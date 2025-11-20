<template>
  <div class="folder-node" :style="{ '--indent-depth': actualIndentDepth }">
    <div class="node-header" @click="toggleExpanded">
      <div class="node-info">
        <!-- 多选模式下的复选框 -->
        <el-checkbox 
          v-if="multiSelectMode && node.type === 'file'"
          :model-value="isFileSelected"
          @change="handleFileSelection"
          @click.stop
          class="file-checkbox"
        />
        <el-icon class="node-icon" :class="{ 'expanded': isExpanded }">
          <component :is="node.type === 'folder' ? 'Folder' : 'Document'" />
        </el-icon>
        <span class="node-name">{{ displayName }}</span>
                <!-- 文件夹项目数量或懒加载提示 -->
                <el-tag v-if="node.type === 'folder'" :type="getFolderTagType" size="small">
                  {{ getFolderTagText }}
                </el-tag>
        <el-tag v-else :type="getFileTypeTag(node.attributes?.extension?.data?.sourceFileName)" size="small">
          {{ getFileExtension(node.attributes?.extension?.data?.sourceFileName) }}
        </el-tag>
      </div>
      
      <div class="node-actions">
        <el-button 
          size="small" 
          type="primary" 
          text 
          @click.stop="handleDetailsClick"
        >
          {{ t('fileBrowser.folderNode.details') }}
        </el-button>
        <el-button 
          v-if="node.type === 'folder'"
          size="small" 
          type="warning" 
          text 
          :loading="loadingPermissions"
          @click.stop="loadPermissions"
        >
          <el-icon><Lock /></el-icon>
          {{ t('fileBrowser.folderNode.permissions') }}
        </el-button>
        <el-tooltip 
          v-if="node.type === 'folder'"
          :content="t('fileBrowser.folderNode.downloadFolderTooltip')"
          placement="top"
        >
          <el-button 
            size="small" 
            type="success"
            text
            :loading="downloadingFolder"
            @click.stop="downloadFolder"
          >
            <el-icon><Download /></el-icon>
            {{ downloadingFolder ? t('fileBrowser.folderNode.downloading') : t('fileBrowser.folderNode.downloadFolder') }}
          </el-button>
        </el-tooltip>
        <el-tooltip 
          v-if="node.type === 'file'"
          :content="t('fileBrowser.folderNode.previewTooltip')"
          placement="top"
        >
          <el-button 
            size="small" 
            type="info"
            text
            @click.stop="handlePreviewClick"
          >
            <el-icon><View /></el-icon>
            {{ t('fileBrowser.folderNode.preview') }}
          </el-button>
        </el-tooltip>
        <el-tooltip 
          v-if="node.type === 'file'"
          :content="isFileDownloadable ? t('fileBrowser.folderNode.downloadFileTooltip') : t('fileBrowser.folderNode.fileTypeNotSupported')"
          placement="top"
        >
          <el-button 
            size="small" 
            :type="isFileDownloadable ? 'success' : 'info'"
            text
            :loading="downloadingFile"
            @click.stop="downloadFile"
            :disabled="!isFileDownloadable"
          >
            <el-icon><Download /></el-icon>
            {{ downloadingFile ? t('fileBrowser.folderNode.downloading') : (isFileDownloadable ? t('fileBrowser.folderNode.download') : t('fileBrowser.folderNode.notSupported')) }}
          </el-button>
        </el-tooltip>
        <el-button 
          v-if="node.type === 'folder' && (hasChildren || canLoadChildren)"
          size="small" 
          type="info" 
          text
          :loading="loadingChildren"
          @click.stop="toggleExpanded"
        >
          {{ isExpanded ? t('fileBrowser.folderNode.collapse') : t('fileBrowser.folderNode.expand') }}
        </el-button>
      </div>
    </div>

    <!-- 文件夹权限信息 -->
    <div v-if="showPermissions && node.type === 'folder' && node.permissions" class="permissions-section">
      <PermissionSummary :permissions="node.permissions" />
    </div>

    <!-- 文件详细信息 -->
    <div v-if="showFileDetails && node.type === 'file' && node.attributes" class="file-details-section">
      <FileInfoView 
        :attributes="{ ...node.attributes, versions: node.versions }" 
        :project-id="getProjectId()"
        :parent-folder-id="node.parent_id"
        :show-custom-attributes="false"
      />
    </div>

    <!-- 子节点 -->
    <div v-if="isExpanded" class="children-container">
      <!-- 加载中状态 -->
      <div v-if="loadingChildren" class="loading-children">
        <el-skeleton :rows="3" animated />
        <div class="loading-text">{{ t('fileBrowser.folderNode.loadingChildren') }}</div>
      </div>
      
      <!-- 子节点列表 -->
      <div v-else-if="node.children && node.children.length > 0">
        <!-- 大量子节点时使用虚拟滚动 -->
        <VirtualScrollList
          v-if="node.children.length > virtualScrollThreshold"
          :items="node.children"
          :item-height="80"
          :container-height="Math.min(400, node.children.length * 80)"
          :buffer-size="3"
          class="virtual-children-list"
        >
          <template #default="{ item }">
            <div class="child-node">
            <FolderNode 
              :node="item"
              :depth="depth + 1"
              :max-indent-depth="maxIndentDepth"
              :parent-path="currentPath"
              :show-permissions="showPermissions"
              :show-file-details="showFileDetails"
              :multi-select-mode="multiSelectMode"
              :selected-files="selectedFiles"
              @node-click="$emit('node-click', $event)"
              @stats-update="$emit('stats-update', $event)"
              @permission-click="$emit('permission-click', $event)"
              @file-select="(...args) => $emit('file-select', ...args)"
            />
            </div>
          </template>
        </VirtualScrollList>
        
        <!-- 少量子节点时正常渲染 -->
        <div v-else>
          <div v-for="child in node.children" :key="child.id" class="child-node">
            <FolderNode 
              :node="child"
              :depth="depth + 1"
              :max-indent-depth="maxIndentDepth"
              :parent-path="currentPath"
              :show-permissions="showPermissions"
              :show-file-details="showFileDetails"
              :multi-select-mode="multiSelectMode"
              :selected-files="selectedFiles"
              @node-click="$emit('node-click', $event)"
              @stats-update="$emit('stats-update', $event)"
              @permission-click="$emit('permission-click', $event)"
              @file-select="(...args) => $emit('file-select', ...args)"
            />
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-children">
        <el-empty :description="t('fileBrowser.folderNode.emptyFolder')" :image-size="60" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Folder, Document, ArrowDown, Download, Lock, View } from '@element-plus/icons-vue'
import PermissionSummary from './PermissionSummary.vue'
import FileInfoView from './FileInfoView.vue'
import VirtualScrollList from './VirtualScrollList.vue'
import projectStore from '@/utils/projectStore.js'
import projectDataStore from '@/utils/projectDataStore.js'
import { openFilePreview, isPreviewSupported, extractFileName } from '@/utils/filePreviewUtils.js'
import axios from 'axios'

export default {
  name: 'FolderNode',
  components: {
    Folder,
    Document,
    ArrowDown,
    Download,
    Lock,
    PermissionSummary,
    FileInfoView,
    VirtualScrollList
  },
  props: {
    node: {
      type: Object,
      required: true
    },
    showPermissions: {
      type: Boolean,
      default: true
    },
    showFileDetails: {
      type: Boolean,
      default: false
    },
    // 嵌套深度
    depth: {
      type: Number,
      default: 0
    },
    // 最大缩进深度
    maxIndentDepth: {
      type: Number,
      default: 4
    },
    // 父级路径（用于构建面包屑）
    parentPath: {
      type: Array,
      default: () => []
    },
    // 多选模式
    multiSelectMode: {
      type: Boolean,
      default: false
    },
    // 已选择的文件列表
    selectedFiles: {
      type: Array,
      default: () => []
    }
  },
  emits: ['node-click', 'stats-update', 'permission-click', 'file-select'],
  setup(props, context) {
    const { t } = useI18n()
    
    // 权限加载状态
    const loadingPermissions = ref(false)
    const isExpanded = ref(false)
    const loadingChildren = ref(false)
    const downloadingFile = ref(false)
    const downloadingFolder = ref(false)
    const forceUpdate = ref(0) // 用于强制更新tag显示
    const instance = getCurrentInstance()
    
    // 虚拟滚动阈值：超过这个数量的子节点将使用虚拟滚动
    const virtualScrollThreshold = 20

    // 计算实际缩进深度（限制最大缩进）
    const actualIndentDepth = computed(() => {
      return Math.min(props.depth, props.maxIndentDepth)
    })

    // 显示名称（处理顶级文件夹的项目名称替换）
    const displayName = computed(() => {
      // 如果是顶级文件夹（depth为0）且名称是"Project Files"，尝试获取真实项目名称
      if (props.depth === 0 && props.node.name === 'Project Files') {
        // 尝试从localStorage获取项目名称
        try {
          const projectId = getProjectId()
          if (projectId) {
            const projectData = localStorage.getItem('acc_projects')
            if (projectData) {
              const parsedData = JSON.parse(projectData)
              const projects = parsedData.projects?.list || []
              const project = projects.find(p => p.id === projectId)
              if (project && project.name) {
                return project.name
              }
            }
          }
        } catch (error) {
          console.warn('获取项目名称失败:', error)
        }
      }
      
      // 返回原始名称
      return props.node.name
    })

    // 当前节点的完整路径
    const currentPath = computed(() => {
      return [...props.parentPath, displayName.value]
    })

    // 获取文件夹标签类型（响应式计算属性）
    const getFolderTagType = computed(() => {
      // 依赖forceUpdate来强制响应式更新
      forceUpdate.value
      
      if (props.node.type !== 'folder') return 'info'
      
      // 如果已经加载了子节点，显示蓝色（已确定数量）
      if (props.node._childrenLoaded === true) {
        return 'primary'
      }
      
      // 如果明确标记为未加载或可以展开，显示橙色（待加载）
      if (props.node._childrenLoaded === false || canLoadChildren.value) {
        return 'warning'
      }
      
      // 其他情况显示灰色
      return 'info'
    })

    // 递归计算文件夹中的总项目数（包括深层子项）
    const calculateTotalItems = (node) => {
      if (!node || node.type !== 'folder') return 0
      
      let totalItems = 0
      
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          totalItems += 1 // 计算当前子项
          
          // 如果子项是文件夹且已展开/加载，递归计算其子项
          if (child.type === 'folder' && child._childrenLoaded && child.children) {
            totalItems += calculateTotalItems(child)
          }
        }
      }
      
      return totalItems
    }

    // 获取文件夹标签文本（响应式计算属性）
    const getFolderTagText = computed(() => {
      // 依赖forceUpdate来强制响应式更新
      forceUpdate.value
      
      if (props.node.type !== 'folder') return ''
      
      // 如果已经加载了子节点，显示实际数量
      if (props.node._childrenLoaded === true) {
        const childCount = props.node.children ? props.node.children.length : 0
        return `${childCount} ${t('fileBrowser.folderNode.items')}`
      }
      
      // 如果明确标记为未加载，检查是否真的有内容可展开
      if (props.node._childrenLoaded === false) {
        const hasObjectCount = (props.node.attributes?.objectCount || 0) > 0
        if (hasObjectCount) {
          return t('fileBrowser.folderNode.expandable')
        } else {
          return `0 ${t('fileBrowser.folderNode.items')}`
        }
      }
      
      // 如果还没有_childrenLoaded标记，检查是否可以加载
      if (props.node._childrenLoaded === undefined) {
        // 如果有子节点，显示数量
        if (props.node.children && props.node.children.length > 0) {
          return `${props.node.children.length} ${t('fileBrowser.folderNode.items')}`
        }
        
        // 检查是否有提示信息表明有子项
        const objectCount = props.node.attributes?.objectCount || 0
        if (objectCount > 0) {
          return t('fileBrowser.folderNode.expandable')
        }
        
        // 默认显示0项
        return `0 ${t('fileBrowser.folderNode.items')}`
      }
      
      // 默认显示0项
      return `0 ${t('fileBrowser.folderNode.items')}`
    })

    // 计算属性：是否有子节点
    const hasChildren = computed(() => {
      return props.node.children && props.node.children.length > 0
    })

    // 计算属性：是否可以加载子节点（文件夹且还没有加载过子节点）
    const canLoadChildren = computed(() => {
      if (props.node.type !== 'folder') return false
      
      // 如果明确标记为未加载，且有潜在内容，则可以加载
      if (props.node._childrenLoaded === false) {
        // 检查是否有潜在内容
        const hasObjectCount = (props.node.attributes?.objectCount || 0) > 0
        return hasObjectCount
      }
      
      // 如果没有_childrenLoaded标记，检查其他条件
      if (props.node._childrenLoaded === undefined) {
        // 没有子节点或子节点为空，且有潜在内容（objectCount > 0）
        const hasNoChildren = !props.node.children || props.node.children.length === 0
        const hasObjectCount = (props.node.attributes?.objectCount || 0) > 0
        
        return hasNoChildren && hasObjectCount
      }
      
      // 如果已经标记为已加载，不需要懒加载
      return false
    })

    // 计算属性：文件是否可下载
    const isFileDownloadable = computed(() => {
      if (props.node.type !== 'file') return false
      
      // 获取文件扩展名
      const fileName = props.node.attributes?.extension?.data?.sourceFileName || props.node.name || ''
      const extension = getFileExtension(fileName).toLowerCase()
      
      // 支持下载的文件类型
      const downloadableExtensions = new Set([
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'dwg', 'dxf', 'rvt', 'rfa', 'ifc',
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff',
        'zip', 'rar', '7z', 'txt', 'csv', 'md',
        'mp4', 'avi', 'mov', 'wmv', 'flv',
        'mp3', 'wav', 'aac', 'flac',
        '3dm', 'step', 'stp', 'iges', 'igs', 'obj', 'fbx', 'max', 'skp'
      ])
      
      return downloadableExtensions.has(extension)
    })

    // 计算属性：当前文件是否被选中
    const isFileSelected = computed(() => {
      if (props.node.type !== 'file' || !props.multiSelectMode) return false
      return props.selectedFiles.some(file => file.id === props.node.id)
    })

    // 计算属性：文件是否支持预览
    const isFilePreviewSupported = computed(() => {
      if (props.node.type !== 'file') return false
      const fileName = extractFileName(props.node)
      return isPreviewSupported(fileName)
    })


    // 懒加载子节点
    const loadChildren = async () => {
      if (loadingChildren.value || props.node._childrenLoaded) {
        return
      }

      const projectId = getProjectId()
      if (!projectId) {
        ElMessage.error(t('fileBrowser.folderNode.errors.cannotGetProjectId'))
        return
      }

      loadingChildren.value = true
      
      try {
        console.log('🔄 懒加载文件夹子节点:', props.node.name, props.node.id)
        
        const response = await axios.get(`/api/file-sync/project/${projectId}/folder/${props.node.id}/children`, {
          params: {
            maxDepth: 1,
            includePermissions: true,
            includeCustomAttributes: true,
            compact: false  // 使用完整格式以获取所有metadata
          },
          timeout: 120000 // 2分钟超时
        })

        if (response.data.status === 'success') {
          const children = response.data.data.children || []
          
          // 更新节点的子节点
          props.node.children = children
          props.node._childrenLoaded = true
          
          // 强制更新tag显示
          forceUpdate.value++
          
          // 触发全局统计数据更新事件
          emitStatsUpdate(children)
          
          console.log(`✅ 懒加载完成: ${children.length} 个子节点`)
          console.log(`📊 标签将从"可展开"变为"${children.length} 项"`)
          
          if (children.length === 0) {
            ElMessage.info(t('fileBrowser.folderNode.emptyFolder'))
          }
        } else {
          throw new Error(response.data.error || t('fileBrowser.folderNode.errors.loadFailed'))
        }
      } catch (error) {
        console.error(t('fileBrowser.folderNode.errors.lazyLoadFailed'), error)
        ElMessage.error(`${t('common.error')}: ${error.response?.data?.error || error.message}`)
      } finally {
        loadingChildren.value = false
      }
    }

    const toggleExpanded = async () => {
      if (props.node.type !== 'folder') {
        return
      }

      if (!isExpanded.value) {
        // 展开时，如果还没有加载子节点，则先加载
        if (canLoadChildren.value) {
          await loadChildren()
          // 加载完成后，强制更新组件以刷新tag显示
          // Vue 3的响应式系统会自动检测到_childrenLoaded的变化
        }
        isExpanded.value = true
      } else {
        // 收起
        isExpanded.value = false
      }
    }

    const getFileExtension = (fileName) => {
      if (!fileName) return 'unknown'
      const ext = fileName.split('.').pop()
      return ext ? ext.toUpperCase() : 'unknown'
    }

    const getFileTypeTag = (fileName) => {
      const ext = getFileExtension(fileName).toLowerCase()
      const typeMap = {
        'pdf': 'danger',
        'dwg': 'warning',
        'rvt': 'success',
        'docx': 'primary',
        'png': 'info',
        'jpg': 'info',
        'jpeg': 'info',
        'mp4': 'warning',
        'mov': 'warning'
      }
      return typeMap[ext] || ''
    }

    // 获取项目ID
    const getProjectId = () => {
      try {
        return projectStore.getSelectedProject()?.id || ''
      } catch (error) {
        console.warn(t('fileBrowser.folderNode.errors.cannotGetProjectIdWarning'), error)
        return ''
      }
    }

    // 加载权限信息
    const loadPermissions = async () => {
      // 如果正在加载，直接返回
      if (loadingPermissions.value) {
        return
      }
      
      // 如果已经有成功的权限数据，直接显示
      if (props.node.permissions && props.node.permissions.status === 'success') {
        console.log('🔍 使用已有的权限数据:', props.node.permissions)
        context.emit('permission-click', props.node)
        return
      }
      
      // 如果权限对象存在但状态不是成功，清除它并重新加载
      if (props.node.permissions && props.node.permissions.status !== 'success') {
        console.log('🔄 清除无效的权限数据，重新加载:', props.node.permissions)
        props.node.permissions = null
      }

      const projectId = getProjectId()
      if (!projectId) {
        ElMessage.error(t('fileBrowser.folderNode.errors.cannotGetProjectId'))
        return
      }

      loadingPermissions.value = true
      
      try {
        console.log('🔐 按需加载文件夹权限:', props.node.name, props.node.id)
        
        const response = await axios.get(`/api/permissions-sync/folder/${projectId}/${props.node.id}`)

        if (response.data.status === 'success') {
          // 将权限数据添加到节点
          props.node.permissions = {
            status: 'success',
            data: response.data.permissions,
            api_source: 'on_demand_api'
          }
          
          console.log('✅ 权限加载完成:', props.node.name)
          console.log('🔍 权限数据结构:', props.node.permissions)
          console.log('🔍 权限数据详情:', response.data.permissions)
          
          // 触发权限点击事件
          context.emit('permission-click', props.node)
        } else {
          console.error('❌ API返回错误状态:', response.data)
          throw new Error(response.data.error || t('fileBrowser.folderNode.errors.loadPermissionsFailed'))
        }
      } catch (error) {
        console.error('❌ 加载权限失败:', error)
        
        // 设置错误状态的权限对象
        props.node.permissions = {
          status: 'error',
          error: error.message,
          api_source: 'on_demand_api'
        }
        
        // 仍然触发权限点击事件，让用户看到错误信息
        context.emit('permission-click', props.node)
        
        ElMessage.error(t('fileBrowser.folderNode.errors.loadPermissionsFailed') + ': ' + error.message)
      } finally {
        loadingPermissions.value = false
      }
    }

    // 触发统计数据更新事件
    const emitStatsUpdate = (newChildren) => {
      if (!newChildren || !Array.isArray(newChildren)) return
      
      // 计算新增的统计数据
      const stats = {
        folders: newChildren.filter(child => child.type === 'folder').length,
        files: newChildren.filter(child => child.type === 'file').length,
        totalSize: newChildren
          .filter(child => child.type === 'file')
          .reduce((sum, file) => {
            const size = file.attributes?.fileSize || file.attributes?.storageSize || 0
            return sum + size
          }, 0)
      }
      
      // 向父组件发送统计更新事件
      context.emit('stats-update', {
        action: 'lazy-load',
        nodeId: props.node.id,
        nodeName: props.node.name,
        stats: stats
      })
    }

    // 下载单个文件
    const downloadFile = async () => {
      if (props.node.type !== 'file' || downloadingFile.value) {
        return
      }

      const projectId = getProjectId()
      if (!projectId) {
        ElMessage.error(t('fileBrowser.folderNode.errors.cannotGetProjectId'))
        return
      }

      downloadingFile.value = true
      
      try {
        console.log('🔄 开始下载文件:', props.node.name, props.node.id)
        
        // 首先尝试从缓存获取下载URL
        const cachedDownloadInfo = projectDataStore.getCachedDownloadUrl(projectId, props.node.id)
        
        if (cachedDownloadInfo) {
          console.log('✅ 使用缓存的下载URL:', props.node.name)
          
          // 使用缓存的下载信息直接下载
          await downloadFileWithCachedUrl(cachedDownloadInfo)
        } else {
          console.log('⚠️ 未找到缓存的下载URL，使用下载任务方式:', props.node.name)
          
          // 回退到原来的下载任务方式
          await downloadFileWithTask()
        }
      } catch (error) {
        console.error('下载文件失败:', error)
        ElMessage.error(`下载文件失败: ${error.response?.data?.error || error.message}`)
      } finally {
        downloadingFile.value = false
      }
    }

    // 使用缓存的URL直接下载文件
    const downloadFileWithCachedUrl = async (cachedInfo) => {
      const downloadInfo = cachedInfo.downloadInfo
      
      if (downloadInfo.method === 'direct_download' && downloadInfo.download_url) {
        // 直接下载
        const link = document.createElement('a')
        link.href = downloadInfo.download_url
        link.download = props.node.name
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        ElMessage.success(t('fileBrowser.messages.fileDownloadSuccess'))
      } else if (downloadInfo.method === 'model_derivative') {
        // Model Derivative方式下载
        if (downloadInfo.pdf_pages && downloadInfo.pdf_pages.length > 0) {
          // PDF文件，下载第一页作为示例
          const pageUrn = downloadInfo.pdf_pages[0]
          const downloadUrl = `${downloadInfo.download_base_url}/${pageUrn}`
          
          const response = await axios.get(downloadUrl, {
            responseType: 'blob',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          })
          
          const blob = new Blob([response.data], { type: 'application/pdf' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${props.node.name}_page1.pdf`
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          ElMessage.success(t('fileBrowser.messages.fileDownloadSuccess'))
        } else {
          throw new Error('不支持的Model Derivative下载方式')
        }
      } else {
        // 其他情况回退到任务方式
        await downloadFileWithTask()
      }
    }

    // 使用下载任务方式下载文件（回退方案）
    const downloadFileWithTask = async () => {
      const downloadData = {
        project_id: getProjectId(),
        file_ids: [props.node.id],
        options: {
          downloadPath: 'ACC_BACKUP/assets',
          concurrency: 1,
          retryCount: 2,
          timeout: 120,
          options: ['createFolders', 'skipErrors']
        }
      }
      
      const response = await axios.post('/api/download-config/download', downloadData)
      
      if (response.data.status === 'success') {
        const taskId = response.data.task_id
        ElMessage.success(t('fileBrowser.messages.fileDownloadSuccess'))
        
        // 触发显示下载模态框事件
        if (instance?.appContext.config.globalProperties.$eventBus) {
          instance.appContext.config.globalProperties.$eventBus.emit('download-task-started', taskId)
          instance.appContext.config.globalProperties.$eventBus.emit('show-download-modal', taskId)
        }
      } else {
        throw new Error(response.data.error || '创建下载任务失败')
      }
    }

    // 处理文件选择
    const handleFileSelection = (selected) => {
      if (props.node.type !== 'file') return
      context.emit('file-select', props.node, selected)
    }

    // 下载文件夹
    const downloadFolder = async () => {
      if (props.node.type !== 'folder' || downloadingFolder.value) {
        return
      }

      const projectId = getProjectId()
      if (!projectId) {
        ElMessage.error(t('fileBrowser.folderNode.errors.cannotGetProjectId'))
        return
      }

      downloadingFolder.value = true
      
      try {
        console.log('🔄 开始下载文件夹:', props.node.name, props.node.id)
        
        ElMessage.info(t('fileBrowser.messages.gettingFolderFiles', { name: props.node.name }))
        
        // 使用API获取文件夹中的所有文件（包括懒加载的文件）
        // 设置maxDepth为999来实现递归搜索所有层级
        const response = await axios.get(`/api/download-config/project/${projectId}/files`, {
          params: {
            folder_ids: [props.node.id], // 指定文件夹ID
            maxDepth: 999, // 设置很大的值来递归搜索所有层级，直到没有更多文件夹
            file_types: [], // 不过滤文件类型，获取所有文件
            _t: Date.now() // 添加时间戳参数绕过缓存
          },
          timeout: 300000 // 5分钟超时，因为递归搜索可能需要更长时间
        })
        
        if (response.data.status !== 'success') {
          throw new Error(response.data.error || '获取文件夹文件列表失败')
        }
        
        const folderFiles = response.data.data.files || []
        const totalSize = response.data.data.total_size || 0
        
        if (folderFiles.length === 0) {
          ElMessage.warning(t('fileBrowser.messages.noFilesToDownload'))
          return
        }

        // 添加确认提示弹窗
        const confirmResult = await ElMessageBox.confirm(
          t('fileBrowser.messages.confirmDownloadFolder', { 
            name: props.node.name, 
            count: folderFiles.length, 
            size: formatFileSize(totalSize) 
          }),
          t('fileBrowser.confirmDialog.downloadFolderTitle'),
          {
            confirmButtonText: t('fileBrowser.confirmDialog.confirmDownload'),
            cancelButtonText: t('fileBrowser.confirmDialog.cancel'),
            type: 'warning',
          }
        )

        if (confirmResult !== 'confirm') {
          return
        }

        // 创建下载任务
        const downloadData = {
          project_id: projectId,
          file_ids: folderFiles.map(f => f.id),
          options: {
            downloadPath: `ACC_BACKUP/assets/${props.node.name}`, // 使用文件夹名称作为子目录
            concurrency: 3,
            retryCount: 2,
            timeout: 120,
            options: ['createFolders', 'skipErrors']
          }
        }
        
        console.log('🚀 发送文件夹下载请求，文件夹:', props.node.name, '文件数量:', folderFiles.length)
        
        const downloadResponse = await axios.post('/api/download-config/download', downloadData)
        
        if (downloadResponse.data.status === 'success') {
          const taskId = downloadResponse.data.task_id
          ElMessage.success(t('fileBrowser.messages.folderDownloadSuccess', { 
            name: props.node.name, 
            count: folderFiles.length 
          }))
          
          // 触发显示下载模态框事件
          if (instance?.appContext.config.globalProperties.$eventBus) {
            instance.appContext.config.globalProperties.$eventBus.emit('download-task-started', taskId)
            instance.appContext.config.globalProperties.$eventBus.emit('show-download-modal', taskId)
          }
        } else {
          throw new Error(downloadResponse.data.error || '创建下载任务失败')
        }
      } catch (error) {
        console.error('下载文件夹失败:', error)
        ElMessage.error(t('fileBrowser.messages.folderDownloadFailed', { error: error.response?.data?.error || error.message }))
      } finally {
        downloadingFolder.value = false
      }
    }

    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 处理详情按钮点击
    const handleDetailsClick = () => {
      context.emit('node-click', props.node)
    }

    // 处理预览按钮点击
    const handlePreviewClick = () => {
      const fileName = extractFileName(props.node)
      
      if (!fileName) {
        ElMessage.warning('无法获取文件名')
        return
      }
      
      console.log('尝试预览文件:', fileName)
      
      // 尝试打开预览
      const success = openFilePreview(fileName)
      
      if (success) {
        ElMessage.success(`正在新标签页中打开预览: ${fileName}`)
      } else {
        ElMessage.info(`文件 "${fileName}" 暂不支持预览`)
      }
    }

    // 监控下载进度
    const monitorDownloadProgress = (taskId) => {
      let progressNotification = null
      
      const checkProgress = async () => {
        try {
          const response = await axios.get(`/api/download-config/download/${taskId}/status`)
          
          if (response.data.status === 'success') {
            const task = response.data.task
            const progress = task.progress || 0
            
            // 显示进度通知
            if (!progressNotification && task.status === 'running') {
              progressNotification = ElMessage({
                message: `正在下载 "${props.node.name}" - ${progress}%`,
                type: 'info',
                duration: 0, // 不自动关闭
                showClose: true
              })
            } else if (progressNotification && task.status === 'running') {
              // 更新进度消息
              progressNotification.message = `正在下载 "${props.node.name}" - ${progress}%`
            }
            
            if (task.status === 'completed') {
              if (progressNotification) {
                progressNotification.close()
              }
              ElMessage.success(`文件 "${props.node.name}" 下载完成`)
              
              // 显示下载详情
              if (task.downloaded_files && task.downloaded_files.length > 0) {
                const downloadedFile = task.downloaded_files[0]
                console.log('📁 文件下载完成:', downloadedFile)
              }
              return
            } else if (task.status === 'failed' || task.status === 'cancelled') {
              if (progressNotification) {
                progressNotification.close()
              }
              const errorMsg = task.errors && task.errors.length > 0 ? task.errors[0] : '未知错误'
              ElMessage.error(`文件 "${props.node.name}" 下载失败: ${errorMsg}`)
              return
            } else if (task.status === 'completed_with_errors') {
              if (progressNotification) {
                progressNotification.close()
              }
              ElMessage.warning(`文件 "${props.node.name}" 下载完成，但有部分错误`)
              return
            }
            
            // 如果任务还在进行中，继续监控
            if (task.status === 'running' || task.status === 'pending') {
              setTimeout(checkProgress, 2000) // 2秒后再次检查
            }
          }
        } catch (error) {
          console.error('监控下载进度失败:', error)
          if (progressNotification) {
            progressNotification.close()
          }
        }
      }
      
      // 开始监控
      setTimeout(checkProgress, 1000) // 1秒后开始检查
    }

    return {
      // i18n function
      t,
      isExpanded,
      loadingChildren,
      loadingPermissions,
      downloadingFile,
      downloadingFolder,
      hasChildren,
      canLoadChildren,
      isFileDownloadable,
      isFileSelected,
      isFilePreviewSupported,
      actualIndentDepth,
      currentPath,
      virtualScrollThreshold,
      toggleExpanded,
      downloadFile,
      downloadFileWithCachedUrl,
      downloadFileWithTask,
      downloadFolder,
      loadPermissions,
      handleFileSelection,
      handleDetailsClick,
      handlePreviewClick,
      displayName,
      getFolderTagType,
      getFolderTagText,
      getFileExtension,
      getFileTypeTag,
      getProjectId,
      calculateTotalItems,
      emitStatsUpdate
    }
  }
}
</script>

<style scoped>
.folder-node {
  border: 1px solid #EBEEF5;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fff;
  transition: all 0.3s ease;
  
  /* 使用CSS变量控制缩进，最大80px */
  margin-left: min(calc(var(--indent-depth, 0) * 20px), 80px);
}


.folder-node:hover {
  border-color: #C0C4CC;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.node-header:hover {
  background-color: #F5F7FA;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.file-checkbox {
  margin-right: 4px;
}

.node-icon {
  font-size: 18px;
  color: #409EFF;
  transition: transform 0.3s ease;
}

.node-icon.expanded {
  transform: rotate(90deg);
}

.node-name {
  font-weight: 500;
  color: #303133;
  word-break: break-all;
}

.node-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.node-actions .el-button {
  transition: all 0.3s ease;
}

.node-actions .el-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.node-actions .el-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.permissions-section {
  padding: 0 16px 12px 16px;
  border-top: 1px solid #F0F0F0;
  background-color: #FAFAFA;
}

.file-details-section {
  padding: 0 16px 12px 16px;
  border-top: 1px solid #F0F0F0;
  background-color: #F9F9F9;
}

.children-container {
  padding: 8px 16px 8px 0; /* 移除左侧padding，让子节点自己控制缩进 */
  background-color: #FAFBFC;
  border-top: 1px solid #E4E7ED;
}

.child-node {
  margin-bottom: 8px;
}

.child-node:last-child {
  margin-bottom: 0;
}

.loading-children {
  margin: 12px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.loading-text {
  margin-top: 12px;
  color: #606266;
  font-size: 14px;
  text-align: center;
}

.empty-children {
  margin: 12px 0;
  padding: 20px;
  text-align: center;
  color: #909399;
}

.virtual-children-list {
  margin: 8px 0;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafbfc;
}

.virtual-children-list .child-node {
  margin-bottom: 0;
  border-bottom: 1px solid #f0f0f0;
}

.virtual-children-list .child-node:last-child {
  border-bottom: none;
}

.load-more-container {
  margin: 12px 0;
  text-align: center;
  padding: 8px;
  border-top: 1px dashed #e4e7ed;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 auto;
  color: #409eff;
  font-size: 14px;
}

.load-more-btn:hover {
  background-color: #ecf5ff;
}


/* 文件类型特殊样式 */
.folder-node[data-type="file"] .node-header {
  background: linear-gradient(90deg, #fff 0%, #f8f9fa 100%);
}

.folder-node[data-type="folder"] .node-header {
  background: linear-gradient(90deg, #fff 0%, #f0f8ff 100%);
}
</style>
