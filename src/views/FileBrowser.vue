<template>
  <div class="file-browser">
    <!-- 面包屑导航 -->
    <Breadcrumb :items="breadcrumbItems" />

    <!-- 主要内容区域 -->
    <div v-if="selectedProject" class="main-content">
      <!-- 加载状态 -->
      <LoadingState 
        v-if="loading" 
        type="card"
        :title="t('fileBrowser.loading.dataSyncing')"
        :text="loadingMessage"
        :show-progress="true"
        :progress="loadingProgress"
        :progress-status="loadingStatus"
        size="default"
        :show-cancel="true"
        @cancel="cancelLoading"
      />
      
      <!-- 项目信息栏 -->
      <el-card v-else class="project-info-card">
        <div class="project-info">
          <div class="project-details">
            <h3>{{ selectedProject.name }}</h3>
            <p class="project-id">{{ t('fileBrowser.projectInfo.projectId') }}: {{ selectedProject.id }}</p>
          </div>
          <div class="project-actions">
            <el-button @click="forceRefreshData" :loading="loading" type="primary">
              <el-icon><Refresh /></el-icon>
              {{ t('fileBrowser.projectInfo.forceRefresh') }}
            </el-button>
            <el-button @click="downloadFullData">
              <el-icon><Download /></el-icon>
              {{ t('fileBrowser.projectInfo.downloadFileData') }}
            </el-button>
            <el-button @click="downloadAllFiles" type="warning" :loading="downloadingAllFiles">
              <el-icon><Download /></el-icon>
              {{ t('fileBrowser.projectInfo.downloadAllFiles') }}
            </el-button>
            <el-button @click="goToUserManagement" type="success">
              <el-icon><User /></el-icon>
              {{ t('fileBrowser.projectInfo.userManagement') }}
            </el-button>
            <el-button @click="changeProject" type="info">
              <el-icon><Switch /></el-icon>
              {{ t('fileBrowser.projectInfo.changeProject') }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 统计信息 -->
      <div v-if="fileData" class="statistics-row">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ fileData.statistics?.total_folders || 0 }}</div>
            <div class="stat-label">{{ t('fileBrowser.statistics.folders') }}</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ fileData.statistics?.total_files || 0 }}</div>
            <div class="stat-label">{{ t('fileBrowser.statistics.files') }}</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ formatFileSize(fileData.statistics?.total_size || 0) }}</div>
            <div class="stat-label">{{ t('fileBrowser.statistics.totalSize') }}</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ unifiedStats?.users?.total_project_users || 0 }}</div>
            <div class="stat-label">{{ t('fileBrowser.statistics.projectUsers') }}</div>
          </div>
        </el-card>
      </div>

      <!-- 文件树视图 -->
      <el-card v-if="fileData" class="file-tree-card">
        <template #header>
          <div class="card-header">
            <span>{{ t('fileBrowser.fileTree.title') }}</span>
            <div class="header-actions">
              <el-switch
                v-model="multiSelectMode"
                :active-text="t('fileBrowser.fileTree.multiSelectMode')"
                :inactive-text="t('fileBrowser.fileTree.singleSelectMode')"
              />
              <el-switch
                v-model="showPermissions"
                :active-text="t('fileBrowser.fileTree.showPermissions')"
                :inactive-text="t('fileBrowser.fileTree.hidePermissions')"
              />
              <el-switch
                v-model="showFileDetails"
                :active-text="t('fileBrowser.fileTree.detailedView')"
                :inactive-text="t('fileBrowser.fileTree.simpleView')"
              />
              <el-tooltip :content="t('fileBrowser.fileTree.traversalDepthTooltip')" placement="top">
                <div class="depth-control">
                  <span class="control-label">{{ t('fileBrowser.fileTree.traversalDepth') }}:</span>
                  <el-input-number
                    v-model="maxDepth"
                    :min="2"
                    :max="20"
                    size="small"
                    style="width: 80px"
                    @change="onMaxDepthChange"
                  />
                </div>
              </el-tooltip>
            </div>
          </div>
        </template>


        <!-- 批量操作工具栏 -->
        <div v-if="multiSelectMode && selectedFiles.length > 0" class="batch-actions-toolbar">
          <div class="selected-info">
            <el-icon><Files /></el-icon>
            <span>{{ t('fileBrowser.batchActions.selectedFiles', { count: selectedFiles.length }) }}</span>
            <span class="total-size">{{ t('fileBrowser.batchActions.totalSize', { size: formatFileSize(selectedFilesTotalSize) }) }}</span>
          </div>
          <div class="batch-actions">
            <el-button type="primary" @click="showBatchDownloadDialog = true">
              <el-icon><Download /></el-icon>
              {{ t('fileBrowser.batchActions.batchDownload') }}
            </el-button>
            <el-button @click="clearSelection">
              <el-icon><Close /></el-icon>
              {{ t('fileBrowser.batchActions.clearSelection') }}
            </el-button>
          </div>
        </div>

        <div class="file-tree-container">
          <!-- 调试信息 -->
          <div v-if="!fileData?.top_folders || fileData.top_folders.length === 0" class="debug-info">
            <el-alert
              :title="t('fileBrowser.debug.title')"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <p><strong>fileData:</strong> {{ fileData ? t('fileBrowser.debug.fileDataLoaded') : t('fileBrowser.debug.fileDataNotLoaded') }}</p>
                <p v-if="fileData"><strong>{{ t('fileBrowser.debug.topFoldersCount') }}:</strong> {{ fileData.top_folders?.length || 0 }}</p>
                <p v-if="fileData"><strong>{{ t('fileBrowser.debug.statisticsInfo') }}:</strong> {{ t('fileBrowser.debug.folders') }}: {{ fileData.statistics?.total_folders }}, {{ t('fileBrowser.debug.files') }}: {{ fileData.statistics?.total_files }}</p>
                <details v-if="fileData">
                  <summary>{{ t('fileBrowser.debug.rawDataStructure') }}</summary>
                  <pre>{{ JSON.stringify(fileData, null, 2) }}</pre>
                </details>
              </template>
            </el-alert>
          </div>
          
          <!-- 文件树 -->
          <div v-for="folder in fileData?.top_folders || []" :key="folder.id" class="folder-item">
            <FolderNode 
              :node="folder"
              :depth="0"
              :max-indent-depth="maxIndentDepth"
              :parent-path="[]"
              :show-permissions="showPermissions"
              :show-file-details="showFileDetails"
              :multi-select-mode="multiSelectMode"
              :selected-files="selectedFiles"
              @node-click="handleNodeClick"
              @stats-update="handleStatsUpdate"
              @permission-click="handlePermissionClick"
              @file-select="handleFileSelect"
            />
          </div>
        </div>
      </el-card>

      <!-- 详情面板 -->
      <el-drawer
        v-model="showDetailDrawer"
        :title="selectedNode ? selectedNode.name : t('fileBrowser.detailDrawer.defaultTitle')"
        direction="rtl"
        size="50%"
        :before-close="handleDetailDrawerClose"
      >
        <template #header>
          <div class="drawer-header">
            <h4>{{ selectedNode ? `${t('fileBrowser.detailDrawer.title')} - ${selectedNode.name}` : t('fileBrowser.detailDrawer.defaultTitle') }}</h4>
          </div>
        </template>
        <NodeDetailPanel 
          v-if="selectedNode"
          :node="selectedNode"
        />
        <div v-else class="no-node-selected">
          {{ t('fileBrowser.detailDrawer.noNodeSelected') }}
        </div>
      </el-drawer>

      <!-- 权限详情抽屉 -->
      <el-drawer
        v-model="showPermissionDrawer"
        :title="`${t('fileBrowser.permissionDrawer.title')} - ${selectedPermissionNode ? selectedPermissionNode.name : ''}`"
        direction="rtl"
        size="60%"
      >
        <PermissionDetailDrawer
          v-if="selectedPermissionNode"
          :permissions="selectedPermissionNode.permissions"
          :node-name="selectedPermissionNode.name"
          :node-type="selectedPermissionNode.type"
          :project-id="selectedProject?.id"
          :loading="permissionLoading"
          :error="permissionError"
          @retry-load="retryLoadPermissions"
          @refresh-permissions="refreshPermissions"
        />
      </el-drawer>
    </div>

    <!-- 批量下载对话框 -->
    <el-dialog
      v-model="showBatchDownloadDialog"
      :title="t('fileBrowser.batchActions.batchDownloadConfig')"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="batch-download-config">
        <!-- 选中文件列表 -->
        <div class="selected-files-section">
          <h4>{{ t('fileBrowser.batchActions.selectedFilesList', { count: selectedFiles.length }) }}</h4>
          <el-table :data="selectedFiles" max-height="200" size="small">
            <el-table-column prop="name" :label="t('common.title')" show-overflow-tooltip />
            <el-table-column :label="t('common.type')" width="80">
              <template #default="scope">
                <el-tag size="small">{{ getFileExtension(scope.row.name) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.size')" width="100">
              <template #default="scope">
                {{ formatFileSize(getFileSize(scope.row)) }}
              </template>
            </el-table-column>
            <el-table-column :label="t('common.actions')" width="80">
              <template #default="scope">
                <el-button type="text" size="small" @click="removeFileFromSelection(scope.row)">
                  {{ t('fileBrowser.batchActions.remove') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 下载选项 -->
        <div class="download-options-section">
          <h4>{{ t('fileBrowser.batchActions.downloadOptions') }}</h4>
          <el-form :model="batchDownloadOptions" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="t('fileBrowser.batchActions.downloadPath')">
                  <el-input v-model="batchDownloadOptions.downloadPath" :placeholder="t('fileBrowser.downloadConfig.defaultPath')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('fileBrowser.batchActions.concurrentDownloads')">
                  <el-input-number v-model="batchDownloadOptions.concurrency" :min="1" :max="10" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="t('fileBrowser.batchActions.retryCount')">
                  <el-input-number v-model="batchDownloadOptions.retryCount" :min="0" :max="5" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('fileBrowser.batchActions.timeoutSeconds')">
                  <el-input-number v-model="batchDownloadOptions.timeout" :min="30" :max="300" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item :label="t('fileBrowser.batchActions.downloadOptions')">
              <el-checkbox-group v-model="batchDownloadOptions.options">
                <el-checkbox label="overwrite">{{ t('fileBrowser.batchActions.overwriteExisting') }}</el-checkbox>
                <el-checkbox label="createFolders">{{ t('fileBrowser.batchActions.createFolders') }}</el-checkbox>
                <el-checkbox label="skipErrors">{{ t('fileBrowser.batchActions.skipErrors') }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showBatchDownloadDialog = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" @click="startBatchDownload" :loading="startingBatchDownload">
            {{ t('fileBrowser.batchActions.startBatchDownload') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 项目选择器对话框 -->
    <ProjectSelector 
      v-model="showProjectSelector"
      @confirm="handleProjectSelected"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Folder, Refresh, Download, Switch, User, Files, Close } from '@element-plus/icons-vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import ProjectSelector from '@/components/ProjectSelector.vue'
import LoadingState from '@/components/LoadingState.vue'
import FolderNode from '@/components/FolderNode.vue'
import NodeDetailPanel from '@/components/NodeDetailPanel.vue'
import PermissionDetailDrawer from '@/components/PermissionDetailDrawer.vue'
import projectDataStore from '@/utils/projectDataStore.js'
    const router = useRouter()
    const route = useRoute()
    const instance = getCurrentInstance()
    const { t } = useI18n()
    
    // 响应式数据
    const selectedProject = ref(null)
    const fileData = ref(null)
    const loading = ref(false)
    const loadingMessage = ref('')
    const loadingProgress = ref(0)
    const loadingStatus = ref('primary')
    
    // 防重复加载机制
    const isInitializing = ref(false)
    const loadingRequestId = ref(null)
    const lastLoadedProjectId = ref(null)
    
    // 断路器机制
    const requestCount = ref(0)
    const maxRequestsPerMinute = 10
    const requestTimestamps = ref([])
    const showPermissions = ref(true)
    const showFileDetails = ref(false)
    const maxIndentDepth = ref(4) // 默认最大缩进深度为4层
    const maxDepth = ref(5) // 默认遍历深度为5层
    
    // 多选相关
    const multiSelectMode = ref(false)
    const selectedFiles = ref([])
    const showBatchDownloadDialog = ref(false)
    const startingBatchDownload = ref(false)
    const downloadingAllFiles = ref(false)
    const batchDownloadOptions = ref({
      downloadPath: 'ACC_BACKUP/assets',
      concurrency: 3,
      retryCount: 2,
      timeout: 120,
      options: ['createFolders', 'skipErrors']
    })
    
    // 加载cancel控制
    let loadingController = null
    const showDetailDrawer = ref(false)
    const selectedNode = ref(null)
    const showProjectSelector = ref(false)
    
    // 权限详情抽屉相关
    const showPermissionDrawer = ref(false)
    const selectedPermissionNode = ref(null)
    const permissionLoading = ref(false)
    const permissionError = ref('')
    
    // 统一统计数据
    const unifiedStats = ref(null)

    // 计算属性：选中文件的总大小
    const selectedFilesTotalSize = computed(() => {
      return selectedFiles.value.reduce((total, file) => {
        return total + getFileSize(file)
      }, 0)
    })


    // 面包屑导航
    const breadcrumbItems = computed(() => {
      const items = [
        { text: t('fileBrowser.breadcrumb.home'), path: '/' },
        { text: t('fileBrowser.breadcrumb.projectManagement'), path: '/project-management' }
      ]
      
      // 如果是从用户管理跳转过来的，添加用户管理链接
      if (route.query.from === 'project-users' && selectedProject.value) {
        items.push({
          text: t('fileBrowser.breadcrumb.userManagement'),
          path: '/project-users',
          query: {
            projectId: selectedProject.value.id,
            projectName: selectedProject.value.name
          }
        })
      }
      
      items.push({ text: t('fileBrowser.breadcrumb.fileBrowser'), path: '/file-browser' })
      return items
    })

    // 统一的项目初始化方法
    const initializeProject = async () => {
      if (isInitializing.value) {
        console.log('⏸️ 项目正在初始化中，跳过重复请求')
        return
      }
      
      isInitializing.value = true
      
      try {
        let projectToLoad = null
        let source = ''
        
        // 优先级1: URL参数中的项目信息
        if (route.query.projectId && route.query.projectName) {
          projectToLoad = {
            id: route.query.projectId,
            name: route.query.projectName
          }
          source = 'URL参数'
        }
        // 优先级2: projectStore中保存的项目信息
        else {
          try {
            const { default: projectStore } = await import('../utils/projectStore.js')
            const savedProject = projectStore.getSelectedProject()
            if (savedProject) {
              projectToLoad = savedProject
              source = 'projectStore缓存'
            }
          } catch (error) {
            console.error('❌ 获取projectStore失败:', error)
          }
        }
        
        if (projectToLoad) {
          console.log(`📍 从${source}获取项目信息:`, projectToLoad)
          await setSelectedProject(projectToLoad, false) // 统一的项目设置方法
        } else {
          console.log('❓ 没有项目信息，显示项目选择器')
          showProjectSelector.value = true
        }
      } catch (error) {
        console.error('❌ 项目初始化失败:', error)
        showProjectSelector.value = true
      } finally {
        isInitializing.value = false
      }
    }
    
    // 组件挂载时检查是否有项目信息
    onMounted(async () => {
      console.log('🚀 FileBrowser 组件挂载，开始初始化...')
      await initializeProject()
      
      // 监听异步文件数据更新事件
      window.addEventListener('fileDataUpdated', handleFileDataUpdated)
    })
    
    // 处理异步文件数据更新
    const handleFileDataUpdated = (event) => {
      const { projectId, fileData } = event.detail
      if (projectId === selectedProject.value?.id) {
        console.log('🔄 接收到异步文件数据更新:', projectId)
        fileData.value = fileData
        
        // 更新统一统计数据
        unifiedStats.value = projectDataStore.getUnifiedStats(projectId)
        
        ElMessage.success('File structure updated successfully with complete permission information')
      }
    }

    // 组件卸载时清理资源
    onUnmounted(() => {
      console.log('🧹 FileBrowser 组件卸载，清理资源...')
      
      // 移除事件监听器
      window.removeEventListener('fileDataUpdated', handleFileDataUpdated)
      
      // cancel所有正在进行的请求
      if (loadingController) {
        loadingController.abort()
        loadingController = null
      }
      
      // cancelprojectDataStore中的所有异步操作
      if (projectDataStore) {
        projectDataStore.cancelAllAsyncOperations()
      }
      
      // 清理状态
      loading.value = false
      loadingRequestId.value = null
      isInitializing.value = false
      
      // 清理断路器状态
      requestTimestamps.value = []
      
      console.log('✅ FileBrowser 组件资源清理完成')
    })

    // 统一的项目设置方法
    const setSelectedProject = async (project, forceRefresh = false) => {
      if (!project) {
        console.error('❌ 项目信息为空')
        return
      }
      
      // 防止重复设置相同项目
      if (!forceRefresh && selectedProject.value && selectedProject.value.id === project.id) {
        console.log('✨ 项目已选中且非强制刷新，跳过重复设置')
        return
      }
      
      // 检查是否正在加载相同项目
      if (loading.value && loadingRequestId.value && loadingRequestId.value.startsWith(project.id)) {
        console.log('⏸️ 相同项目正在加载中，跳过重复设置')
        return
      }
      
      console.log('📝 设置选中项目:', project, forceRefresh ? '(强制刷新)' : '')
      selectedProject.value = project
      
      // 保存项目到projectStore
      try {
        const { default: projectStore } = await import('../utils/projectStore.js')
        projectStore.saveSelectedProject(project)
        console.log('💾 项目信息已保存到 projectStore')
      } catch (error) {
        console.error('❌ 保存项目信息失败:', error)
      }
      
      // 加载项目数据
      await loadFileData(forceRefresh)
    }
    
    // 处理项目选择
    const handleProjectSelected = async (project) => {
      console.log('✅ 项目选择确认:', project)
      showProjectSelector.value = false
      await setSelectedProject(project, false)
    }

    // 断路器检查
    const checkCircuitBreaker = () => {
      const now = Date.now()
      const oneMinuteAgo = now - 60000
      
      // 清理过期的请求时间戳
      requestTimestamps.value = requestTimestamps.value.filter(timestamp => timestamp > oneMinuteAgo)
      
      if (requestTimestamps.value.length >= maxRequestsPerMinute) {
        console.error('🚫 断路器触发：1分钟内请求次数过多，停止加载')
        ElMessage.error('Requests too frequent, please try again later')
        return false
      }
      
      requestTimestamps.value.push(now)
      return true
    }
    
    // 加载文件数据（使用统一数据管理）
    const loadFileData = async (forceRefresh = false) => {
      if (!selectedProject.value) {
        console.log('❌ 没有选择项目，跳过加载')
        return
      }
      
      // 断路器检查
      if (!checkCircuitBreaker()) {
        return
      }
      
      const projectId = selectedProject.value.id
      const requestId = `${projectId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 增强的防重复加载机制
      if (loading.value && !forceRefresh) {
        console.log('⏸️ 数据正在加载中，跳过重复请求')
        return
      }
      
      // 检查是否是相同项目的重复请求
      if (!forceRefresh && lastLoadedProjectId.value === projectId && fileData.value && fileData.value.project_id === projectId) {
        console.log('✨ 项目数据已存在且非强制刷新，跳过加载')
        return
      }
      
      // 检查请求ID是否已经存在（防止重复调用）
      if (loadingRequestId.value && loadingRequestId.value.startsWith(projectId)) {
        console.log('⏸️ 相同项目的请求已在进行中，跳过重复请求')
        return
      }
      
      // 设置当前请求ID
      loadingRequestId.value = requestId
      
      console.log('🔄 开始加载项目文件数据:', projectId, forceRefresh ? '(强制刷新)' : '', '请求ID:', requestId)
      loading.value = true
      loadingProgress.value = 0
      loadingStatus.value = 'primary'
      
      // 创建cancel控制器
      loadingController = new AbortController()
      
      try {
        // 阶段1: 初始化
        loadingMessage.value = t('fileBrowser.loading.initializingDataStore')
        loadingProgress.value = 10
        
        // 设置当前项目到数据存储
        projectDataStore.setCurrentProject(selectedProject.value)
        
        // 阶段2: 检查缓存
        loadingMessage.value = t('fileBrowser.loading.checkingCache')
        loadingProgress.value = 20
        
        // 阶段3: 加载文件数据
        loadingMessage.value = t('fileBrowser.loading.syncingFileData')
        loadingProgress.value = 30
        
        // 创建进度更新器和时间跟踪
        const startTime = Date.now()
        let progressUpdateCount = 0
        
        const progressUpdater = setInterval(() => {
          if (loadingProgress.value < 65 && loading.value) {
            loadingProgress.value += 1
            progressUpdateCount++
            
            // 计算预估剩余时间
            const elapsed = Date.now() - startTime
            const estimatedTotal = (elapsed / loadingProgress.value) * 100
            const remaining = Math.max(0, estimatedTotal - elapsed)
            const remainingMinutes = Math.ceil(remaining / 60000)
            
            // 更新加载消息
            if (loadingProgress.value < 40) {
              loadingMessage.value = 'Connecting to server...'
            } else if (loadingProgress.value < 50) {
              loadingMessage.value = 'Retrieving file structure...'
            } else if (loadingProgress.value < 60) {
              loadingMessage.value = `Processing large dataset, please wait patiently... ${remainingMinutes > 0 ? `(Estimated ${remainingMinutes} minutes remaining)` : ''}`
            } else {
              loadingMessage.value = 'Almost complete, final processing...'
            }
            
            // 如果超过1分钟，显示提示
            if (elapsed > 60000 && progressUpdateCount % 15 === 0) { // 每30秒显示一次提示
              ElMessage.info('Data synchronization in progress, please wait patiently. Large projects may take 2-3 minutes.', { duration: 3000 })
            }
          }
        }, 2000) // 每2秒更新一次
        
        let cachedFileData = null
        try {
          // 设置超时处理
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Request timeout: File tree synchronization took too long, possibly due to large data volume. Please try again later or contact administrator.'))
            }, 180000) // 3分钟超时
          })
          
          // 获取文件数据（优先使用缓存）
          cachedFileData = await Promise.race([
            projectDataStore.getFileData(selectedProject.value.id, forceRefresh, maxDepth.value),
            timeoutPromise
          ])
          
          // 清理进度更新器
          clearInterval(progressUpdater)
          
          loadingProgress.value = 70
          loadingMessage.value = t('fileBrowser.loading.processingFileTree')
        } catch (error) {
          // 清理进度更新器
          clearInterval(progressUpdater)
          throw error
        }
        
        if (cachedFileData) {
          fileData.value = cachedFileData
          
          // 异步预缓存下载URL（不阻塞UI）
          setTimeout(async () => {
            try {
              console.log('🚀 开始预缓存下载URL...')
              const cacheResult = await projectDataStore.preloadDownloadUrls(selectedProject.value.id, cachedFileData)
              if (cacheResult) {
                console.log(`✅ 下载URL预缓存完成: ${cacheResult.success}/${cacheResult.total} 成功`)
                if (cacheResult.success > 0) {
                  ElMessage.success(`Pre-cached download links for ${cacheResult.success} files, downloads will be faster`)
                }
              }
            } catch (error) {
              console.warn('⚠️ 预缓存下载URL失败:', error)
            }
          }, 1000) // 1秒后开始预缓存，让UI先渲染完成
        }
        
        // 阶段4: 加载用户数据
        loadingMessage.value = t('fileBrowser.loading.loadingUserData')
        loadingProgress.value = 85
        
        // 尝试获取用户数据（如果还没有的话）
        await projectDataStore.getUserData(selectedProject.value.id, false)
        
        // 阶段5: 生成统计数据
        loadingMessage.value = t('fileBrowser.loading.generatingStats')
        loadingProgress.value = 95
        
        // 获取统一统计数据
        unifiedStats.value = projectDataStore.getUnifiedStats(selectedProject.value.id)
        
        // 完成
        loadingProgress.value = 100
        loadingStatus.value = 'success'
        loadingMessage.value = t('fileBrowser.loading.dataLoadComplete')
        
        // 验证请求是否仍然有效（防止异步竞态条件）
        if (loadingRequestId.value !== requestId) {
          console.log('⚠️ 请求已过期，跳过结果处理:', requestId, '当前请求:', loadingRequestId.value)
          return
        }
        
        if (fileData.value) {
          lastLoadedProjectId.value = projectId
          ElMessage.success(t('fileBrowser.messages.dataLoadSuccess', { count: fileData.value?.top_folders?.length || 0 }))
        }
        
      } catch (error) {
        // 验证请求是否仍然有效
        if (loadingRequestId.value !== requestId) {
          console.log('⚠️ 请求已过期，跳过错误处理:', requestId)
          return
        }
        
        console.error('加载文件数据失败:', error)
        loadingProgress.value = 100
        loadingStatus.value = 'exception'
        
        // 更详细的错误信息
        let errorMessage = 'Unknown error'
        if (error.name === 'AbortError') {
          errorMessage = 'Request cancelled'
        } else if (error.code === 'NETWORK_ERROR') {
          errorMessage = 'Network connection error, please check your network connection'
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorMessage = 'Request timeout, large data volume, please try again later'
        } else {
          errorMessage = error.response?.data?.error || error.message
        }
        
        loadingMessage.value = t('fileBrowser.messages.dataLoadFailed', { error: errorMessage })
        
        if (error.name !== 'AbortError') {
          ElMessage.error(t('fileBrowser.messages.dataLoadFailed', { error: errorMessage }))
        }
      } finally {
        // 只有当前请求才能清除loading状态
        if (loadingRequestId.value === requestId) {
          // 延迟隐藏加载状态，让用户看到完成状态
          setTimeout(() => {
            if (loadingRequestId.value === requestId) { // 再次检查以防止端条件
              loading.value = false
              loadingController = null
              loadingRequestId.value = null
            }
          }, 1500) // 增加到1.5秒，让用户看到结果
        }
      }
    }

    // cancel加载
    const cancelLoading = () => {
      console.log('🚫 用户cancel加载操作')
      
      // cancel当前请求
      if (loadingController) {
        loadingController.abort()
        loadingController = null
      }
      
      // 清理状态
      loading.value = false
      loadingRequestId.value = null
      loadingMessage.value = t('fileBrowser.loading.loadingCancelled')
      loadingProgress.value = 0
      loadingStatus.value = 'primary'
      
      ElMessage.warning(t('fileBrowser.loading.loadingCancelled'))
    }

    // 强制刷新数据
    const forceRefreshData = async () => {
      if (selectedProject.value) {
        try {
          ElMessage.info(t('fileBrowser.loading.forceRefreshing'))
          
          // 立即清空数据和缓存
          fileData.value = null
          unifiedStats.value = null
          lastLoadedProjectId.value = null
          
          // 清空数据存储缓存
          await projectDataStore.clearProjectCache(selectedProject.value.id)
          
          // 使用统一的项目设置方法进行强制刷新
          await setSelectedProject(selectedProject.value, true)
          
          ElMessage.success(t('fileBrowser.messages.dataRefreshComplete'))
        } catch (error) {
          console.error('强制刷新失败:', error)
          ElMessage.error(t('fileBrowser.messages.dataRefreshFailed', { error: error.message }))
          // 确保在错误时也隐藏loading状态
          loading.value = false
        }
      }
    }

    // 下载完整数据
    const downloadFullData = async () => {
      try {
        const response = await axios.get(
          `/api/file-sync/project/${selectedProject.value.id}/download-with-permissions`,
          {
            responseType: 'blob',
            params: {
              maxDepth: 5,
              includePermissions: true
            }
          }
        )
        
        const blob = new Blob([response.data], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const projectName = selectedProject.value.name.replace(/[^a-zA-Z0-9]/g, '_')
        const fileName = `project_${projectName}_files_permissions_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success(t('fileBrowser.messages.fileDownloadSuccess'))
      } catch (error) {
        console.error('下载失败:', error)
        ElMessage.error(t('fileBrowser.messages.fileDownloadFailed', { error: error.response?.data?.error || error.message }))
      }
    }

    // 切换项目
    const changeProject = () => {
      selectedProject.value = null
      fileData.value = null
      showProjectSelector.value = true
    }

    // 跳转到用户管理
    const goToUserManagement = () => {
      if (selectedProject.value) {
        // 保存当前项目到数据存储，确保数据互通
        projectDataStore.setCurrentProject(selectedProject.value)
        
        router.push({
          path: '/project-users',
          query: {
            projectId: selectedProject.value.id,
            projectName: selectedProject.value.name,
            from: 'file-browser'
          }
        })
        
        ElMessage.success(t('fileBrowser.messages.redirectingToUserManagement'))
      } else {
        ElMessage.warning(t('fileBrowser.messages.selectProjectFirst'))
      }
    }

    // 处理cancel选择
    const handleCancel = () => {
      showProjectSelector.value = false
      // 如果没有选择项目，返回主页面
      if (!selectedProject.value) {
        router.push('/')
      }
    }

    // 处理节点点击
    const handleNodeClick = (node) => {
      selectedNode.value = node
      showDetailDrawer.value = true
    }

    // 处理详情抽屉关闭
    const handleDetailDrawerClose = (done) => {
      selectedNode.value = null
      done()
    }

    // 处理maxDepth变化
    const onMaxDepthChange = async () => {
      if (selectedProject.value) {
        try {
          ElMessage.info(t('fileBrowser.loading.reloadingWithDepth', { depth: maxDepth.value }))
          
          // 立即清空数据和缓存
          fileData.value = null
          unifiedStats.value = null
          lastLoadedProjectId.value = null
          
          // 清空数据存储缓存（确保使用新的深度参数）
          await projectDataStore.clearProjectCache(selectedProject.value.id)
          
          // 使用统一的项目设置方法进行强制刷新
          await setSelectedProject(selectedProject.value, true)
          
          ElMessage.success(t('fileBrowser.messages.dataReloadComplete'))
        } catch (error) {
          console.error('重新加载数据失败:', error)
          ElMessage.error(t('fileBrowser.messages.dataReloadFailed', { error: error.message }))
          // 确保在错误时也隐藏loading状态
          loading.value = false
        }
      }
    }

    // 处理数据刷新
    const handleDataRefresh = async () => {
      // 数据同步状态组件触发的刷新
      if (selectedProject.value) {
        await setSelectedProject(selectedProject.value, true)
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

    // 处理统计数据更新
    const handleStatsUpdate = (updateInfo) => {
      if (!fileData.value || !fileData.value.statistics) return
      
      console.log('📊 收到统计数据更新事件:', updateInfo)
      
      if (updateInfo.action === 'lazy-load') {
        // 懒加载新数据时，更新全局统计
        const stats = updateInfo.stats
        if (stats) {
          fileData.value.statistics.total_folders += stats.folders
          fileData.value.statistics.total_files += stats.files
          fileData.value.statistics.total_size += stats.totalSize
          
          console.log('📊 统计数据已更新:', {
            folders: fileData.value.statistics.total_folders,
            files: fileData.value.statistics.total_files,
            size: formatFileSize(fileData.value.statistics.total_size)
          })
          
          // 同时更新projectDataStore中的统计数据（使用增量更新）
          if (selectedProject.value) {
            projectDataStore.incrementStats(selectedProject.value.id, stats)
            unifiedStats.value = projectDataStore.getUnifiedStats(selectedProject.value.id)
          }
        }
      }
    }

    // 处理权限点击
    const handlePermissionClick = (node) => {
      selectedPermissionNode.value = node
      showPermissionDrawer.value = true
    }

    // 重试加载权限
    const retryLoadPermissions = async () => {
      if (!selectedPermissionNode.value) return
      
      const node = selectedPermissionNode.value
      console.log('🔄 重试加载权限:', node.name)
      
      // 清除现有的权限数据
      node.permissions = null
      
      // 设置加载状态
      permissionLoading.value = true
      permissionError.value = ''
      
      try {
        const projectId = selectedProject.value?.id
        if (!projectId) {
          throw new Error('无法获取项目ID')
        }
        
        console.log('🔐 重新调用权限API:', node.name, node.id)
        
        const response = await axios.get(`/api/permissions-sync/folder/${projectId}/${node.id}`)
        
        if (response.data.status === 'success') {
          // 将权限数据添加到节点
          node.permissions = {
            status: 'success',
            data: response.data.permissions,
            api_source: 'retry_api'
          }
          
          console.log('✅ 权限重新加载完成:', node.name)
          console.log('🔍 权限数据结构:', node.permissions)
          
          ElMessage.success('权限信息加载成功')
        } else {
          throw new Error(response.data.error || '权限加载失败')
        }
      } catch (error) {
        console.error('❌ 重新加载权限失败:', error)
        
        // 设置错误状态的权限对象
        node.permissions = {
          status: 'error',
          error: error.message,
          api_source: 'retry_api'
        }
        
        permissionError.value = error.message
        ElMessage.error('权限加载失败: ' + error.message)
      } finally {
        permissionLoading.value = false
      }
    }

    // 刷新权限
    const refreshPermissions = async () => {
      // 刷新权限就是重新加载权限
      await retryLoadPermissions()
    }

    // 多选相关方法
    const handleFileSelect = (file, selected) => {
      if (!multiSelectMode.value) return
      
      const index = selectedFiles.value.findIndex(f => f.id === file.id)
      if (selected && index === -1) {
        selectedFiles.value.push(file)
      } else if (!selected && index !== -1) {
        selectedFiles.value.splice(index, 1)
      }
    }

    const clearSelection = () => {
      selectedFiles.value = []
    }


    const removeFileFromSelection = (file) => {
      const index = selectedFiles.value.findIndex(f => f.id === file.id)
      if (index !== -1) {
        selectedFiles.value.splice(index, 1)
      }
    }

    // 递归获取文件树中的所有文件
    const getAllFilesFromTree = (nodes) => {
      const files = []
      
      const traverse = (nodeList) => {
        for (const node of nodeList) {
          if (node.type === 'file') {
            files.push(node)
          } else if (node.type === 'folder' && node.children) {
            traverse(node.children)
          }
        }
      }
      
      traverse(nodes)
      return files
    }

    // 获取文件大小
    const getFileSize = (file) => {
      return file.attributes?.fileSize || file.attributes?.storageSize || 0
    }

    // 获取文件扩展名
    const getFileExtension = (fileName) => {
      if (!fileName) return 'unknown'
      const ext = fileName.split('.').pop()
      return ext ? ext.toUpperCase() : 'unknown'
    }

    // 开始批量下载
    const startBatchDownload = async () => {
      if (selectedFiles.value.length === 0) {
        ElMessage.warning(t('fileBrowser.messages.selectFilesFirst'))
        return
      }

      startingBatchDownload.value = true
      
      try {
        const downloadData = {
          project_id: selectedProject.value.id,
          file_ids: selectedFiles.value.map(f => f.id),
          options: {
            ...batchDownloadOptions.value
          }
        }
        
        console.log('🚀 发送批量下载请求，项目ID:', selectedProject.value.id, '文件数量:', selectedFiles.value.length)
        
        const response = await axios.post('/api/download-config/download', downloadData)
        
        if (response.data.status === 'success') {
          ElMessage.success(t('fileBrowser.messages.batchDownloadSuccess', { taskId: response.data.task_id }))
          
          // 关闭对话框
          showBatchDownloadDialog.value = false
          
          // 清空选择
          clearSelection()
          
          // 触发显示下载模态框事件
          if (instance?.appContext.config.globalProperties.$eventBus) {
            instance.appContext.config.globalProperties.$eventBus.emit('download-task-started', response.data.task_id)
            instance.appContext.config.globalProperties.$eventBus.emit('show-download-modal', response.data.task_id)
          }
        }
      } catch (error) {
        console.error('批量下载失败:', error)
        ElMessage.error(t('fileBrowser.messages.batchDownloadFailed', { error: error.response?.data?.error || error.message }))
      } finally {
        startingBatchDownload.value = false
      }
    }

    // 下载全部文件
    const downloadAllFiles = async () => {
      if (!selectedProject.value) {
        ElMessage.warning(t('fileBrowser.messages.selectProjectFirst'))
        return
      }

      downloadingAllFiles.value = true
      
      try {
        ElMessage.info(t('fileBrowser.messages.gettingAllFiles'))
        
        // 使用API获取项目中的所有文件（包括懒加载的文件）
        // 设置maxDepth为999来实现递归搜索所有层级
        const response = await axios.get(`/api/download-config/project/${selectedProject.value.id}/files`, {
          params: {
            maxDepth: 999, // 设置很大的值来递归搜索所有层级，直到没有更多文件夹
            file_types: [], // 不过滤文件类型，获取所有文件
            _t: Date.now() // 添加时间戳参数绕过缓存
          },
          timeout: 300000 // 5分钟超时，因为递归搜索可能需要更长时间
        })
        
        if (response.data.status !== 'success') {
          throw new Error(response.data.error || '获取文件列表失败')
        }
        
        const allFiles = response.data.data.files || []
        const totalSize = response.data.data.total_size || 0
        
        if (allFiles.length === 0) {
          ElMessage.warning(t('fileBrowser.messages.noFilesToDownload'))
          return
        }

        // 确认下载
        const confirmResult = await ElMessageBox.confirm(
          t('fileBrowser.messages.confirmDownloadAllFiles', { count: allFiles.length, size: formatFileSize(totalSize) }),
          t('fileBrowser.confirmDialog.downloadAllFilesTitle'),
          {
            confirmButtonText: t('fileBrowser.confirmDialog.confirmDownload'),
            cancelButtonText: t('fileBrowser.confirmDialog.cancel'),
            type: 'warning',
          }
        )

        if (confirmResult !== 'confirm') {
          return
        }

        const downloadData = {
          project_id: selectedProject.value.id,
          file_ids: allFiles.map(f => f.id),
          options: {
            downloadPath: 'ACC_BACKUP/assets',
            concurrency: 5, // 全部下载时使用更高的并发数
            retryCount: 3,
            timeout: 180,
            options: ['createFolders', 'skipErrors']
          }
        }
        
        console.log('🚀 发送全部文件下载请求，项目ID:', selectedProject.value.id, '文件数量:', allFiles.length)
        
        const downloadResponse = await axios.post('/api/download-config/download', downloadData)
        
        if (downloadResponse.data.status === 'success') {
          ElMessage.success(t('fileBrowser.messages.allFilesDownloadSuccess', { taskId: downloadResponse.data.task_id }))
          
          // 触发显示下载模态框事件
          if (instance?.appContext.config.globalProperties.$eventBus) {
            instance.appContext.config.globalProperties.$eventBus.emit('download-task-started', downloadResponse.data.task_id)
            instance.appContext.config.globalProperties.$eventBus.emit('show-download-modal', downloadResponse.data.task_id)
          }
        }
      } catch (error) {
        if (error === 'cancel') {
          ElMessage.info(t('fileBrowser.messages.downloadCancelled'))
        } else {
          console.error('下载全部文件失败:', error)
          ElMessage.error(t('fileBrowser.messages.allFilesDownloadFailed', { error: error.response?.data?.error || error.message }))
        }
      } finally {
        downloadingAllFiles.value = false
      }
    }

</script>

<style scoped>
.file-browser {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}


.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-info-card {
  margin-bottom: 20px;
}

.project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-details h3 {
  margin: 0 0 5px 0;
  color: #303133;
}

.project-id {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.project-actions {
  display: flex;
  gap: 10px;
}

.statistics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-item {
  padding: 10px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.file-tree-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.indent-control, .depth-control {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.control-label {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.file-tree-container {
  max-height: 600px;
  overflow-y: auto;
}

.folder-item {
  margin-bottom: 10px;
}

/* 批量操作工具栏 */
.batch-actions-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, #e8f4fd 0%, #f0f9ff 100%);
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  margin-bottom: 16px;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1890ff;
  font-weight: 500;
}

.total-size {
  color: #666;
  font-size: 14px;
  margin-left: 12px;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

/* 批量下载对话框 */
.batch-download-config {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selected-files-section h4,
.download-options-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.selected-files-section {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  background: #fafbfc;
}

.download-options-section {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  background: #f9f9f9;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-browser {
    padding: 10px;
  }
  
  .project-info {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .project-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .statistics-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .batch-actions-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .batch-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
