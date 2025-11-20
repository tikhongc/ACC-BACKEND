<template>
  <div class="node-detail-panel">
    <!-- 节点basicInfo -->
    <div class="node-header">
      <div class="node-title">
        <el-icon class="title-icon">
          <component :is="node.type === 'folder' ? 'Folder' : 'Document'" />
        </el-icon>
        <div class="title-text">
          <h3>{{ node.name }}</h3>
          <p class="node-type">{{ node.type === 'folder' ? t('nodeDetail.basicInfo.folder') : t('nodeDetail.basicInfo.file') }}</p>
          <!-- 文件审阅状态 - 单独一行显示 -->
          <div v-if="node.type === 'file' && getFileReviewStatus(node)" class="review-status-section">
            <div class="status-description">
              <span class="status-label">{{ t('nodeDetail.reviewStatus.title') }}：</span>
              <el-tag 
                :type="getReviewStatusType(getFileReviewStatus(node))" 
                size="small"
                class="review-status-tag">
                {{ getFileReviewStatus(node) }}
              </el-tag>
            </div>
            <div class="status-detail">
              <span class="status-detail-text">{{ getReviewStatusDescription(getFileReviewStatus(node)) }}</span>
            </div>
          </div>
        </div>
      </div>
      <el-tag :type="node.type === 'folder' ? 'primary' : 'success'" size="large">
        {{ node.type === 'folder' ? t('nodeDetail.basicInfo.folder').toUpperCase() : t('nodeDetail.basicInfo.file').toUpperCase() }}
      </el-tag>
    </div>

    <!-- 节点ID信息 -->
    <el-card class="info-card">
      <template #header>
        <span>{{ t('nodeDetail.basicInfo.identityInfo') }}</span>
      </template>
      <div class="id-info">
        <div class="id-item">
          <span class="id-label">{{ t('nodeDetail.basicInfo.nodeId') }}:</span>
          <el-input 
            :model-value="node.id" 
            readonly 
            size="small"
          >
            <template #append>
              <el-button @click="copyToClipboard(node.id)" size="small">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
        <div v-if="node.parent_id" class="id-item">
          <span class="id-label">{{ t('nodeDetail.basicInfo.parentId') }}:</span>
          <el-input 
            :model-value="node.parent_id" 
            readonly 
            size="small"
          >
            <template #append>
              <el-button @click="copyToClipboard(node.parent_id)" size="small">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </el-card>

    <!-- 文件夹特有信息 -->
    <div v-if="node.type === 'folder'">
      <!-- 文件夹basicInfo (优化样式) -->
      <el-card v-if="node.attributes" class="info-card">
        <template #header>
          <div class="card-header-with-stats">
            <span>{{ t('nodeDetail.folderInfo.title') }}</span>
            <div class="header-stats">
              <el-tag type="primary" size="small">
                <el-icon><Files /></el-icon>
                {{ node.children ? node.children.length : 0 }} {{ t('nodeDetail.folderInfo.items') }}
              </el-tag>
              <el-tag type="info" size="small" v-if="node.attributes.objectCount">
                <el-icon><DataAnalysis /></el-icon>
                {{ node.attributes.objectCount }} {{ t('nodeDetail.folderInfo.objects') }}
              </el-tag>
            </div>
          </div>
        </template>
        
        <!-- 使用 el-descriptions 优化basicInfo显示 -->
        <el-descriptions :column="2" border class="folder-descriptions">
          <!-- 时间信息 -->
          <el-descriptions-item :label="t('nodeDetail.folderInfo.createTime')" v-if="node.attributes.createTime">
            <div class="time-info">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDateTime(node.attributes.createTime) }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item :label="t('nodeDetail.folderInfo.modifyTime')" v-if="node.attributes.lastModifiedTime">
            <div class="time-info">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDateTime(node.attributes.lastModifiedTime) }}</span>
            </div>
          </el-descriptions-item>
          
          <!-- 用户信息 -->
          <el-descriptions-item :label="t('nodeDetail.folderInfo.creator')" v-if="node.attributes.createUserName">
            <div class="user-info">
              <el-icon><User /></el-icon>
              <span>{{ node.attributes.createUserName }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item :label="t('nodeDetail.folderInfo.modifier')" v-if="node.attributes.lastModifiedUserName">
            <div class="user-info">
              <el-icon><User /></el-icon>
              <span>{{ node.attributes.lastModifiedUserName }}</span>
            </div>
          </el-descriptions-item>
          
          <!-- 统计信息 -->
          <el-descriptions-item :label="t('nodeDetail.folderInfo.childCount')">
            <el-tag type="primary" size="small">
              {{ node.children ? node.children.length : 0 }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('nodeDetail.folderInfo.objectCount')" v-if="node.attributes.objectCount !== undefined">
            <el-tag type="info" size="small">
              {{ node.attributes.objectCount }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 整合自定义属性定义到basicInfo中 -->
        <div v-if="shouldShowFolderCustomAttributes" class="custom-attributes-integrated">
          <div class="section-divider">
            <el-icon><Management /></el-icon>
            <span>{{ t('nodeDetail.folderInfo.customAttributeDefinitions') }}</span>
            <el-tooltip :content="t('nodeDetail.folderInfo.customAttributeTooltip')" placement="top">
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
            <!-- 刷新按钮 -->
            <el-button 
              size="small" 
              type="info" 
              text
              :loading="loadingCustomAttributes"
              @click="refreshCustomAttributes"
              style="margin-left: auto;"
            >
              <el-icon><Refresh /></el-icon>
              {{ t('nodeDetail.actions.refresh') }}
            </el-button>
          </div>
          
          <!-- 加载按钮区域 - 只在没有自定义属性定义时显示 -->
          <div v-if="!customAttributesLoaded && !hasFolderCustomAttributes" class="load-custom-attributes-section">
            <el-button 
              type="primary" 
              :loading="loadingCustomAttributes"
              @click="loadCustomAttributes"
              size="small"
            >
              <el-icon><Management /></el-icon>
              {{ t('nodeDetail.actions.loadCustomAttributes') }}
            </el-button>
            <span class="load-hint">{{ t('nodeDetail.hints.clickToLoadCustomAttributes') }}</span>
          </div>
          
          <!-- 无自定义属性时的提示 -->
          <div v-if="!customAttributesLoaded && !hasFolderCustomAttributes && !loadingCustomAttributes" class="no-custom-attributes-message">
            <el-empty
              :description="t('nodeDetail.folderInfo.noCustomAttributes')"
              :image-size="60"
            >
              <template #image>
                <el-icon size="60" color="#C0C4CC">
                  <Management />
                </el-icon>
              </template>
            </el-empty>
          </div>
          
          <!-- 自定义属性组件 -->
          <CustomAttributesView 
            v-if="customAttributesLoaded"
            ref="customAttributesRef"
            :project-id="getProjectId()"
            :folder-id="node.id"
            :auto-load="true"
          />
        </div>
      </el-card>

    </div>

    <!-- 文件特有信息 -->
    <div v-if="node.type === 'file'">
      <!-- 文件信息 (整合了basicInfo和属性) -->
      <el-card v-if="node.attributes" class="info-card">
        <template #header>
          <span>{{ t('nodeDetail.fileInfo.title') }}</span>
        </template>
        <FileInfoView 
          :attributes="{ ...node.attributes, versions: node.versions }" 
          :project-id="getProjectId()"
          :parent-folder-id="node.parent_id"
          :show-custom-attributes="true"
          @custom-attributes-loaded="handleFileCustomAttributesLoaded"
        />
      </el-card>

      <!-- 文件版本 -->
      <el-card v-if="node.versions && node.versions.length > 0" class="info-card">
        <template #header>
          <span>{{ t('nodeDetail.fileInfo.versionHistory') }} ({{ node.versions.length }})</span>
        </template>
        <FileVersionsView :versions="node.versions" />
      </el-card>

      <!-- 文件工作流 -->
      <el-card class="info-card">
        <template #header>
          <span>{{ t('nodeDetail.fileInfo.relatedWorkflows') }}</span>
        </template>
        <FileWorkflowsView 
          :project-id="getProjectId()"
          :file-id="node.id"
          :file-name="node.name"
          :project="getCurrentProject()"
        />
      </el-card>

      <!-- 关联的Issues -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header-with-stats">
            <span>{{ t('nodeDetail.fileInfo.relatedIssues') }}</span>
            <div class="header-actions">
              <el-tag v-if="relatedIssues.length > 0" type="warning" size="small">
                {{ relatedIssues.length }} {{ t('common.items') }}
              </el-tag>
              <el-button 
                @click="loadRelatedIssues" 
                :loading="issuesLoading" 
                size="small"
                type="primary">
                <el-icon><Refresh /></el-icon>
                {{ t('nodeDetail.fileInfo.refresh') }}
              </el-button>
            </div>
          </div>
        </template>
        
        <div v-if="issuesLoading" class="loading-container">
          <el-skeleton :rows="2" animated />
        </div>
        
        <div v-else-if="relatedIssues.length === 0" class="empty-state">
          <el-empty :description="t('nodeDetail.fileInfo.noRelatedIssues')" :image-size="80" />
        </div>
        
        <div v-else class="issues-list">
          <div 
            v-for="item in relatedIssues" 
            :key="item.issue.id"
            class="issue-item">
            <div class="issue-header">
              <el-tag :type="getIssueStatusType(item.issue.status)" size="small">
                {{ getIssueStatusText(item.issue.status) }}
              </el-tag>
              <span class="issue-id">#{{ item.issue.displayId }}</span>
              <el-tag :type="getRelationTypeColor(item.relation_type)" size="small">
                {{ getRelationTypeText(item.relation_type) }}
              </el-tag>
                 <el-button 
                   @click="navigateToIssue(item.issue)" 
                   type="primary" 
                   size="small"
                   style="margin-left: auto;"
                   :title="t('nodeDetail.fileInfo.openInNewTab')">
                   <el-icon><View /></el-icon>
                   {{ t('nodeDetail.fileInfo.viewDetails') }}
                   <el-icon style="margin-left: 4px; font-size: 12px;"><Document /></el-icon>
                 </el-button>
            </div>
            <div class="issue-title">{{ item.issue.title }}</div>
            <div class="issue-meta">
              <span class="assignee">{{ t('nodeDetail.issueStatus.assignedTo') }}: {{ getAssignedToName(item.issue.assignedTo, item.issue.assignedToType) }}</span>
              <span class="created-date">{{ t('nodeDetail.issueStatus.created') }}: {{ formatDateTime(item.issue.createdAt) }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>


    <!-- 详细属性信息 -->
    <el-card v-if="node.attributes" class="info-card">
      <template #header>
        <span>{{ t('nodeDetail.fullAttributes.title') }}</span>
      </template>
      <AttributesDetailView :attributes="node.attributes" />
    </el-card>

    <!-- 扩展信息 -->
    <el-card v-if="node.attributes?.extension" class="info-card">
      <template #header>
        <div class="card-header-with-info">
          <span>{{ t('nodeDetail.extensionInfo.title') }}</span>
          <el-tooltip :content="t('nodeDetail.extensionInfo.tooltip')" placement="top">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <div class="extension-info">
        <div class="info-row" v-if="node.attributes.extension.type">
          <span class="info-label">{{ t('nodeDetail.extensionInfo.type') }}:</span>
          <span class="info-value">{{ node.attributes.extension.type }}</span>
        </div>
        <div class="info-row" v-if="node.attributes.extension.version">
          <span class="info-label">{{ t('nodeDetail.extensionInfo.version') }}:</span>
          <span class="info-value">{{ node.attributes.extension.version }}</span>
        </div>
        <div class="info-row" v-if="node.attributes.extension.schema?.href">
          <span class="info-label">{{ t('nodeDetail.extensionInfo.schema') }}:</span>
          <el-link :href="node.attributes.extension.schema.href" target="_blank" type="primary">
            {{ t('nodeDetail.extensionInfo.viewSchemaDefinition') }}
          </el-link>
        </div>
        
        <!-- 扩展数据 -->
        <div v-if="node.attributes.extension.data" class="extension-data">
          <h4>{{ t('nodeDetail.extensionInfo.extensionData') }}:</h4>
          
          <!-- 可见类型 -->
          <div v-if="node.attributes.extension.data.visibleTypes" class="data-section">
            <span class="data-label">{{ t('nodeDetail.extensionInfo.visibleTypes') }}:</span>
            <div class="tag-list">
              <el-tag v-for="type in node.attributes.extension.data.visibleTypes" :key="type" size="small">
                {{ type }}
              </el-tag>
            </div>
          </div>
          
          <!-- 允许类型 -->
          <div v-if="node.attributes.extension.data.allowedTypes" class="data-section">
            <span class="data-label">{{ t('nodeDetail.extensionInfo.allowedTypes') }}:</span>
            <div class="tag-list">
              <el-tag v-for="type in node.attributes.extension.data.allowedTypes" :key="type" size="small" type="success">
                {{ type }}
              </el-tag>
            </div>
          </div>
          
          <!-- 支持操作 -->
          <div v-if="node.attributes.extension.data.actions" class="data-section">
            <span class="data-label">{{ t('nodeDetail.extensionInfo.supportedActions') }}:</span>
            <div class="tag-list">
              <el-tag v-for="action in node.attributes.extension.data.actions" :key="action" size="small" type="warning">
                {{ action }}
              </el-tag>
            </div>
          </div>
          
          <!-- 文件处理状态 -->
          <div v-if="node.attributes.extension.data.processState" class="data-section">
            <span class="data-label">{{ t('nodeDetail.extensionInfo.processState') }}:</span>
            <el-tag :type="getProcessStateType(node.attributes.extension.data.processState)">
              {{ node.attributes.extension.data.processState }}
            </el-tag>
          </div>
          
          <!-- 提取状态 -->
          <div v-if="node.attributes.extension.data.extractionState" class="data-section">
            <span class="data-label">{{ t('nodeDetail.extensionInfo.extractionState') }}:</span>
            <el-tag :type="getExtractionStateType(node.attributes.extension.data.extractionState)">
              {{ node.attributes.extension.data.extractionState }}
            </el-tag>
          </div>
          
          <!-- 源文件名 -->
          <div v-if="node.attributes.extension.data.sourceFileName" class="data-section">
            <span class="data-label">{{ t('nodeDetail.extensionInfo.sourceFileName') }}:</span>
            <span class="data-value">{{ node.attributes.extension.data.sourceFileName }}</span>
          </div>
          
          <!-- 版本标签 -->
          <div v-if="node.attributes.extension.data.revisionDisplayLabel" class="data-section">
            <span class="data-label">{{ t('nodeDetail.extensionInfo.versionLabel') }}:</span>
            <el-tag type="info">{{ node.attributes.extension.data.revisionDisplayLabel }}</el-tag>
          </div>
        </div>
      </div>
      
      <!-- 完整扩展信息 -->
      <el-collapse class="extension-collapse">
        <el-collapse-item :title="t('nodeDetail.extensionInfo.viewFullExtensionInfo')" name="full">
          <ExtensionDetailView :extension="node.attributes.extension" />
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" @click="downloadNodeData">
        <el-icon><Download /></el-icon>
        {{ t('nodeDetail.actions.downloadNodeData') }}
      </el-button>
      <el-button v-if="node.type === 'file'" type="success" @click="openInACC">
        <el-icon><View /></el-icon>
        {{ t('nodeDetail.actions.viewInACC') }}
      </el-button>
      <el-button @click="copyNodeInfo">
        <el-icon><CopyDocument /></el-icon>
        {{ t('nodeDetail.actions.copyInfo') }}
      </el-button>
    </div>

    <!-- JSON Viewer - 显示完整的节点metadata -->
    <JsonViewer 
      :data="node"
      :title="node.type === 'folder' ? t('nodeDetail.jsonViewer.folderMetadata') : t('nodeDetail.jsonViewer.fileMetadata')"
      :description="t('nodeDetail.jsonViewer.description')"
      :show-copy="true"
      :show-download="true"
      :collapsible="true"
      :collapsed="true"
      shadow="hover"
    />
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { 
  Folder, 
  Document, 
  CopyDocument, 
  Files, 
  DataAnalysis, 
  Download, 
  View,
  Clock,
  User,
  Management,
  InfoFilled,
  Refresh
} from '@element-plus/icons-vue'
import axios from 'axios'
import FileInfoView from './FileInfoView.vue'
import FileVersionsView from './FileVersionsView.vue'
import AttributesDetailView from './AttributesDetailView.vue'
import ExtensionDetailView from './ExtensionDetailView.vue'
import entityCache from '@/utils/entityCache.js'
import CustomAttributesView from './CustomAttributesView.vue'
import FileWorkflowsView from './FileWorkflowsView.vue'
import JsonViewer from './JsonViewer.vue'
import projectStore from '@/utils/projectStore.js'
import projectDataStore from '@/utils/projectDataStore.js'

export default {
  name: 'NodeDetailPanel',
  components: {
    Folder,
    Document,
    CopyDocument,
    Files,
    DataAnalysis,
    Download,
    View,
    Clock,
    User,
    Management,
    InfoFilled,
    Refresh,
    FileInfoView,
    FileVersionsView,
    AttributesDetailView,
    ExtensionDetailView,
    CustomAttributesView,
    FileWorkflowsView,
    JsonViewer
  },
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    // Vue Router实例
    const router = useRouter()
    const { t } = useI18n()
    
    // 响应式数据
    const fileReviewStatus = ref(null)
    const reviewStatusLoading = ref(false)
    
    // 自定义属性相关
    const customAttributesLoaded = ref(false)
    const loadingCustomAttributes = ref(false)
    const customAttributesRef = ref(null)
    
    // Issues相关数据
    const relatedIssues = ref([])
    const issuesLoading = ref(false)
    
    // 检查文件夹是否有自定义属性定义
    const hasFolderCustomAttributes = computed(() => {
      return props.node.type === 'folder' && 
             props.node.attributes?.hasCustomAttributeDefinitions === true
    })

    // 是否应该显示文件夹自定义属性区域 - 对于文件夹总是显示
    const shouldShowFolderCustomAttributes = computed(() => {
      return props.node.type === 'folder'
    })

    // 监听文件夹自定义属性变化，自动加载
    watch(hasFolderCustomAttributes, (hasAttributes) => {
      if (hasAttributes && !customAttributesLoaded.value && !loadingCustomAttributes.value) {
        console.log('🔄 检测到文件夹有自定义属性定义，自动加载:', props.node.name)
        customAttributesLoaded.value = true
      }
    }, { immediate: true })

    // 复制到剪贴板
    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text)
        ElMessage.success(t('nodeDetail.actions.copySuccess'))
      } catch (error) {
        console.error('复制失败:', error)
        ElMessage.error(t('nodeDetail.actions.copyFailed'))
      }
    }

    // 下载节点数据
    const downloadNodeData = () => {
      const dataStr = JSON.stringify(props.node, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const fileName = `${props.node.type}_${props.node.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`
      link.setAttribute('download', fileName)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success(t('nodeDetail.actions.nodeDataDownloadSuccess'))
    }

    // 在ACC中查看
    const openInACC = () => {
      if (props.node.type === 'file' && props.node.versions && props.node.versions.length > 0) {
        const webViewUrl = props.node.versions[0].links?.webView?.href
        if (webViewUrl) {
          window.open(webViewUrl, '_blank')
        } else {
          ElMessage.warning(t('nodeDetail.actions.accLinkNotFound'))
        }
      }
    }

    // 获取文件审阅状态
    const getFileReviewStatus = (node) => {
      if (node.type !== 'file') return null
      
      // 从实际的审阅状态数据中获取
      if (fileReviewStatus.value) {
        return fileReviewStatus.value
      }
      
      return null
    }

    // 获取审阅状态标签类型
    const getReviewStatusType = (status) => {
      const typeMap = {
        'Approved': 'success',
        'Completed': 'success',
        'Rejected': 'danger',
        'Cancelled': 'info',
        'Pending Review': 'warning',
        'Under Review': 'primary'
      }
      return typeMap[status] || 'info'
    }

    // 获取审阅状态描述
    const getReviewStatusDescription = (status) => {
      const descriptionMap = {
        'Approved': 'This file has passed all review processes and can be officially used',
        'Completed': 'The review process for this file has been completed',
        'Rejected': 'This file was rejected during the review process and needs to be modified and resubmitted',
        'Cancelled': 'The review process for this file has been cancelled',
        'Pending Review': 'This file is waiting for reviewers to conduct the review',
        'Under Review': 'This file is currently in the review process'
      }
      return descriptionMap[status] || 'File review status information'
    }

    // 复制节点信息
    const copyNodeInfo = () => {
      const info = {
        name: props.node.name,
        type: props.node.type,
        id: props.node.id,
        parent_id: props.node.parent_id
      }
      
      const infoText = Object.entries(info)
        .filter(([key, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
      
      copyToClipboard(infoText)
    }

    // 格式化日期时间
    const formatDateTime = (dateTimeString) => {
      if (!dateTimeString) return 'N/A'
      try {
        const date = new Date(dateTimeString)
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch (error) {
        return dateTimeString
      }
    }

    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (!bytes || bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 获取处理状态类型
    const getProcessStateType = (state) => {
      const stateMap = {
        'PROCESSING_COMPLETE': 'success',
        'PROCESSING': 'warning',
        'PROCESSING_FAILED': 'danger',
        'NOT_PROCESSED': 'info'
      }
      return stateMap[state] || 'info'
    }

    // 获取提取状态类型
    const getExtractionStateType = (state) => {
      const stateMap = {
        'SUCCESS': 'success',
        'PROCESSING': 'warning',
        'FAILED': 'danger',
        'UNSUPPORTED': 'info',
        'NOT_EXTRACTED': 'info'
      }
      return stateMap[state] || 'info'
    }

    // 获取项目ID
    const getProjectId = () => {
      try {
        // 优先从projectDataStore获取
        const currentProject = projectDataStore.getCurrentProject()
        if (currentProject?.id) {
          return currentProject.id
        }
        
        // 回退到projectStore
        return projectStore.getSelectedProject()?.id || ''
      } catch (error) {
        console.warn('无法获取项目ID:', error)
        return ''
      }
    }

    // 加载自定义属性
    const loadCustomAttributes = async () => {
      if (loadingCustomAttributes.value) {
        return
      }

      loadingCustomAttributes.value = true
      
      try {
        console.log('📋 按需加载自定义属性:', props.node.name, props.node.id)
        
        // 手动触发CustomAttributesView的加载
        if (customAttributesRef.value && typeof customAttributesRef.value.loadCustomAttributes === 'function') {
          await customAttributesRef.value.loadCustomAttributes()
        }
        
        customAttributesLoaded.value = true
        console.log('✅ 自定义属性加载完成:', props.node.name)
        
      } catch (error) {
        console.error('❌ 加载自定义属性失败:', error)
        ElMessage.error(t('nodeDetail.errors.loadCustomAttributesFailed') + ': ' + error.message)
      } finally {
        loadingCustomAttributes.value = false
      }
    }

    // 刷新自定义属性
    const refreshCustomAttributes = async () => {
      if (loadingCustomAttributes.value) {
        return
      }

      console.log('🔄 刷新自定义属性:', props.node.name, props.node.id)
      
      // 重置状态
      customAttributesLoaded.value = false
      
      // 重新加载
      await loadCustomAttributes()
    }

    // 处理文件自定义属性加载完成
    const handleFileCustomAttributesLoaded = (data) => {
      console.log('📝 文件自定义属性加载完成:', data)
      
      // 更新节点的自定义属性数据
      if (props.node.attributes) {
        props.node.attributes.customAttributes = data.customAttributes
        props.node.attributes.hasCustomAttributes = data.hasCustomAttributes
        
        console.log('✅ 已更新文件节点的自定义属性:', {
          hasCustomAttributes: data.hasCustomAttributes,
          attributeCount: Object.keys(data.customAttributes).length
        })
      }
    }

    // 获取文件审阅状态
    const loadFileReviewStatus = async () => {
      if (props.node.type !== 'file') {
        return
      }

      const projectId = getProjectId()
      if (!projectId) {
        console.warn('无法获取项目ID，跳过审阅状态加载')
        return
      }

      // 尝试获取文件URN
      let fileUrn = null
      
      if (props.node.versions && props.node.versions.length > 0) {
        // 获取最新版本的URN
        const latestVersion = props.node.versions[0] // 版本数组通常按时间倒序排列
        fileUrn = latestVersion?.urn
      }
      
      if (!fileUrn) {
        console.warn('未找到文件版本URN，跳过审阅状态加载')
        return
      }

      reviewStatusLoading.value = true
      
      try {
        // cancel之前的请求
        if (reviewAbortController) {
          reviewAbortController.abort()
        }
        
        // 创建新的cancel控制器
        reviewAbortController = new AbortController()
        
        const response = await axios.get(`/api/versions/jarvis/${encodeURIComponent(fileUrn)}/approval-statuses`, {
          params: {
            projectId: projectId
          },
          timeout: 15000,
          signal: reviewAbortController.signal
        })

        if (response.data.success && response.data.results && response.data.results.length > 0) {
          // 获取最新的审阅状态
          const latestApproval = response.data.results[0]
          if (latestApproval.approvalStatus) {
            fileReviewStatus.value = latestApproval.approvalStatus.label || latestApproval.approvalStatus.value
          }
        }
      } catch (error) {
        // 如果是cancel请求，不显示错误
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          console.log('🚫 NodeDetailPanel - 审阅状态请求已cancel')
          return
        }
        
        console.warn('获取文件审阅状态失败:', error)
        // 不显示错误消息，因为不是所有文件都有审阅状态
      } finally {
        reviewStatusLoading.value = false
        reviewAbortController = null
      }
    }

    // 获取当前项目对象
    const getCurrentProject = () => {
      try {
        // 优先从projectDataStore获取
        const currentProject = projectDataStore.getCurrentProject()
        if (currentProject) {
          return currentProject
        }
        
        // 回退到projectStore
        return projectStore.getSelectedProject() || null
      } catch (error) {
        console.warn('无法获取当前项目:', error)
        return null
      }
    }

    // 加载关联的Issues
    const loadRelatedIssues = async () => {
      console.log('🔍 开始加载关联的Issues...')
      console.log('节点类型:', props.node.type)
      console.log('节点名称:', props.node.name)
      console.log('节点ID:', props.node.id)
      console.log('节点版本信息:', props.node.versions)
      
      if (props.node.type !== 'file') {
        console.log('❌ 不是文件，跳过Issues加载')
        return
      }

      const projectId = getProjectId()
      console.log('📁 项目ID:', projectId)
      if (!projectId) {
        console.warn('❌ 无法获取项目ID，跳过Issues加载')
        ElMessage.warning(t('nodeDetail.messages.projectIdNotFound'))
        return
      }

      // 尝试获取URN，优先使用版本信息，否则使用文件ID
      let versionUrn = null
      
      if (props.node.versions && props.node.versions.length > 0) {
        // 如果有版本信息，使用版本URN
        const latestVersion = props.node.versions[0]
        console.log('📄 最新版本:', latestVersion)
        
        // 从版本对象中提取URN，可能在id字段或urn字段中
        versionUrn = latestVersion?.urn || latestVersion?.id
        
        // 如果是完整的版本URN，需要提取lineage URN
        if (versionUrn && versionUrn.includes('fs.file:vf.')) {
          // 从 "urn:adsk.wipprod:fs.file:vf.BpecaZkCRhSpekT3CXYIiA?version=1" 
          // 提取 "urn:adsk.wipprod:dm.lineage:BpecaZkCRhSpekT3CXYIiA"
          const match = versionUrn.match(/vf\.([^?]+)/)
          if (match) {
            versionUrn = `urn:adsk.wipprod:dm.lineage:${match[1]}`
            console.log('🔄 转换后的lineage URN:', versionUrn)
          }
        }
      } else {
        // 如果没有版本信息，尝试从文件ID构造lineage URN
        console.log('⚠️ 没有版本信息，尝试使用文件ID构造URN')
        
        // 检查文件ID是否已经是URN格式
        if (props.node.id && props.node.id.startsWith('urn:')) {
          versionUrn = props.node.id
          
          // 如果是文件URN，转换为lineage URN
          if (versionUrn.includes('fs.file:vf.')) {
            const match = versionUrn.match(/vf\.([^?]+)/)
            if (match) {
              versionUrn = `urn:adsk.wipprod:dm.lineage:${match[1]}`
              console.log('🔄 从文件ID转换的lineage URN:', versionUrn)
            }
          } else if (versionUrn.includes('dm.lineage:')) {
            // 已经是lineage URN，直接使用
            console.log('✅ 文件ID已经是lineage URN:', versionUrn)
          }
        } else {
          // 如果文件ID不是URN格式，尝试构造lineage URN
          if (props.node.id) {
            versionUrn = `urn:adsk.wipprod:dm.lineage:${props.node.id}`
            console.log('🔧 构造的lineage URN:', versionUrn)
          }
        }
      }
      
      console.log('📄 最终使用的URN:', versionUrn)
      if (!versionUrn) {
        console.warn('❌ 无法获取文件URN')
        ElMessage.warning('Unable to get file identifier, cannot load related Issues')
        return
      }

      issuesLoading.value = true
      const apiUrl = `/api/issues/projects/${projectId}/files/${encodeURIComponent(versionUrn)}/issues`
      console.log('🔗 API URL:', apiUrl)
      
      // 预先加载实体缓存以确保用户/角色/公司名称能正确显示
      try {
        console.log('📋 预加载实体缓存...')
        await entityCache.getProjectEntities(projectId)
        console.log('✅ 实体缓存加载完成')
      } catch (cacheError) {
        console.warn('⚠️ 实体缓存加载失败，但继续加载Issues:', cacheError)
      }
      
      try {
        // cancel之前的请求
        if (issuesAbortController) {
          issuesAbortController.abort()
        }
        
        // 创建新的cancel控制器
        issuesAbortController = new AbortController()
        
        const response = await axios.get(apiUrl, {
          timeout: 15000,
          signal: issuesAbortController.signal
        })

        console.log('📊 API响应:', response.status, response.data)

        if (response.data.success) {
          relatedIssues.value = response.data.data.related_issues || []
          console.log(`✅ 找到 ${relatedIssues.value.length} 个关联的Issues`)
          
          if (relatedIssues.value.length > 0) {
            ElMessage.success(t('nodeDetail.messages.issuesFound', { count: relatedIssues.value.length }))
          } else {
            console.log('ℹ️ 该文件没有关联的Issues')
            // 不显示消息，因为大部分文件都没有关联的Issues
          }
        } else {
          console.error('❌ API返回失败:', response.data)
          // 如果是404或者没有找到，不显示错误
          if (response.status === 404 || response.data.error?.includes('not found')) {
            console.log('ℹ️ 该文件没有关联的Issues (404)')
            relatedIssues.value = []
          } else {
            ElMessage.error(t('nodeDetail.messages.getIssuesFailed') + ': ' + (response.data.error || t('common.unknownError')))
          }
        }
      } catch (error) {
        // 如果是cancel请求，不显示错误
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          console.log('🚫 NodeDetailPanel - Issues请求已cancel')
          return
        }
        
        console.error('❌ 获取关联Issues失败:', error)
        ElMessage.error(t('nodeDetail.messages.getIssuesFailed') + ': ' + error.message)
      } finally {
        issuesLoading.value = false
        issuesAbortController = null
      }
    }

    // 在新标签页中打开Issue详情页面
    const navigateToIssue = (issue) => {
      console.log('🔗 在新标签页打开Issue详情:', { issueId: issue.id, displayId: issue.displayId })
      
      try {
        const projectId = getProjectId()
        
        // 构建完整的URL
        const baseUrl = window.location.origin
        const issueUrl = `${baseUrl}/issues/detail?projectId=${encodeURIComponent(projectId)}&issueId=${encodeURIComponent(issue.id)}`
        
        console.log('🌐 打开URL:', issueUrl)
        
        // 在新标签页中打开
        window.open(issueUrl, '_blank')
        
        ElMessage.success(t('nodeDetail.messages.openIssueSuccess', { displayId: issue.displayId }))
      } catch (error) {
        console.error('❌ 打开新标签页失败:', error)
        ElMessage.error(t('nodeDetail.messages.openIssueFailed') + ': ' + error.message)
      }
    }

    // 获取议题状态类型
    const getIssueStatusType = (status) => {
      const statusMap = {
        'draft': 'info',
        'open': 'warning', 
        'pending': 'warning',
        'in_progress': 'success',
        'in_review': 'primary',
        'closed': 'info',
        'resolved': 'success',
        'rejected': 'danger'
      }
      return statusMap[status?.toLowerCase()] || 'info'
    }

    // 获取议题状态文本
    const getIssueStatusText = (status) => {
      const statusKey = status?.toLowerCase()
      if (statusKey && t(`nodeDetail.issueStatus.${statusKey}`)) {
        return t(`nodeDetail.issueStatus.${statusKey}`)
      }
      return status || t('nodeDetail.issueStatus.unknown')
    }

    // 获取关联类型颜色
    const getRelationTypeColor = (relationType) => {
      const colorMap = {
        'linked_document': 'primary',
        'pushpin': 'success',
        'attachment': 'warning'
      }
      return colorMap[relationType] || 'info'
    }

    // 获取关联类型文本
    const getRelationTypeText = (relationType) => {
      if (relationType && t(`nodeDetail.relationType.${relationType}`)) {
        return t(`nodeDetail.relationType.${relationType}`)
      }
      return t('nodeDetail.relationType.other')
    }

    // 获取指派人名称
    const getAssignedToName = (assignedTo, assignedToType) => {
      if (!assignedTo) return t('nodeDetail.issueStatus.unassigned')
      
      const projectId = getProjectId()
      console.log('🔍 获取指派对象名称:', { assignedTo, assignedToType, projectId })
      
      // 使用entityCache获取显示名称
      const displayName = entityCache.getAssignedToDisplayName(assignedTo, assignedToType, projectId)
      
      console.log('✅ 指派对象显示名称:', { assignedTo, assignedToType, displayName })
      return displayName
    }

    // cancel请求的控制器
    let reviewAbortController = null
    let issuesAbortController = null
    
    // 清理请求的函数
    const cleanupRequests = () => {
      if (reviewAbortController) {
        reviewAbortController.abort()
        reviewAbortController = null
      }
      if (issuesAbortController) {
        issuesAbortController.abort()
        issuesAbortController = null
      }
    }
    
    // 监听节点变化，重新加载审阅状态和issues
    watch(() => props.node, (newNode, oldNode) => {
      // 如果节点ID发生变化，清理之前的请求
      if (oldNode && newNode.id !== oldNode.id) {
        cleanupRequests()
      }
      
      fileReviewStatus.value = null
      relatedIssues.value = []
      if (newNode.type === 'file') {
        loadFileReviewStatus()
        loadRelatedIssues()
      }
    }, { immediate: true })

    // 组件挂载时加载审阅状态和issues
    onMounted(() => {
      if (props.node.type === 'file') {
        loadFileReviewStatus()
        loadRelatedIssues()
      }
    })
    
    // 组件卸载时清理
    onUnmounted(() => {
      console.log('🧹 NodeDetailPanel - 组件卸载，清理资源')
      cleanupRequests()
      // 清理状态
      fileReviewStatus.value = null
      relatedIssues.value = []
      customAttributesLoaded.value = false
      loadingCustomAttributes.value = false
    })

    return {
      // i18n function
      t,
      hasFolderCustomAttributes,
      shouldShowFolderCustomAttributes,
      customAttributesLoaded,
      loadingCustomAttributes,
      customAttributesRef,
      loadCustomAttributes,
      refreshCustomAttributes,
      handleFileCustomAttributesLoaded,
      copyToClipboard,
      downloadNodeData,
      openInACC,
      copyNodeInfo,
      formatDateTime,
      formatFileSize,
      getProcessStateType,
      getExtractionStateType,
      getProjectId,
      getCurrentProject,
      getFileReviewStatus,
      getReviewStatusType,
      getReviewStatusDescription,
      loadFileReviewStatus,
      fileReviewStatus,
      reviewStatusLoading,
      // Issues相关
      relatedIssues,
      issuesLoading,
      loadRelatedIssues,
      navigateToIssue,
      getIssueStatusType,
      getIssueStatusText,
      getRelationTypeColor,
      getRelationTypeText,
      getAssignedToName
    }
  }
}
</script>

<style scoped>
.load-custom-attributes-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border: 1px dashed #d0d7de;
  border-radius: 8px;
  margin-bottom: 16px;
}

.load-hint {
  color: #656d76;
  font-size: 14px;
}

.custom-attributes-placeholder {
  padding: 20px;
  text-align: center;
  background: #fafbfc;
  border: 1px dashed #d0d7de;
  border-radius: 8px;
  margin-top: 16px;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e1e4e8;
  font-weight: 600;
  color: #24292f;
}

.node-detail-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 20px;
  border-bottom: 2px solid #E4E7ED;
}

.node-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
  color: #409EFF;
  margin-top: 4px;
}

.title-text h3 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 20px;
  word-break: break-all;
}

.node-type {
  margin: 0 0 8px 0;
  color: #909399;
  font-size: 14px;
}

/* 审阅状态区域样式 */
.review-status-section {
  margin-top: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
}

.status-description {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.status-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.review-status-tag {
  flex-shrink: 0;
  font-weight: 600;
}

.status-detail {
  margin-top: 6px;
}

.status-detail-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

.info-card {
  margin-bottom: 0;
}

/* 文件夹信息优化样式 */
.card-header-with-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-stats {
  display: flex;
  gap: 8px;
  align-items: center;
}

.folder-descriptions {
  margin-bottom: 0;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
}

.time-info .el-icon {
  color: #909399;
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
}

.user-info .el-icon {
  color: #409EFF;
  font-size: 14px;
}

/* 整合自定义属性样式 */
.custom-attributes-integrated {
  margin-top: 20px;
  border-top: 1px solid #E4E7ED;
  padding-top: 16px;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.section-divider .el-icon {
  color: #409EFF;
}

.section-divider .info-icon {
  color: #909399;
  cursor: help;
  margin-left: auto;
}

.no-custom-attributes-inline {
  padding: 20px;
  text-align: center;
  background: #FAFAFA;
  border-radius: 6px;
  border: 1px dashed #E4E7ED;
  margin-top: 8px;
}

.id-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.id-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.id-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.folder-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #F5F7FA;
  border-radius: 8px;
  min-width: 100px;
}

.stat-item .el-icon {
  font-size: 24px;
  color: #409EFF;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.basic-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F0F0F0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #606266;
  min-width: 100px;
}

.info-value {
  color: #303133;
  text-align: right;
  word-break: break-all;
}

.card-header-with-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  color: #909399;
  cursor: help;
}

.extension-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.extension-data h4 {
  margin: 16px 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.data-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.data-label {
  font-weight: 500;
  color: #606266;
  font-size: 13px;
}

.data-value {
  color: #303133;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  background: #F5F7FA;
  padding: 4px 8px;
  border-radius: 4px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.extension-collapse {
  margin-top: 16px;
  border: none;
}

.extension-collapse :deep(.el-collapse-item__header) {
  background: #F8F9FA;
  border: 1px solid #E4E7ED;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 13px;
}

.extension-collapse :deep(.el-collapse-item__content) {
  padding: 12px 0 0 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 1px solid #E4E7ED;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .node-detail-panel {
    padding: 15px;
  }
  
  .node-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .folder-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}

/* Issues相关样式 */
.issues-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.issue-item {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s ease;
}

.issue-item:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.issue-id {
  font-weight: bold;
  color: #495057;
  font-family: 'Consolas', 'Monaco', monospace;
}

.issue-title {
  font-weight: 500;
  color: #212529;
  margin-bottom: 6px;
  line-height: 1.4;
}

.issue-meta {
  font-size: 12px;
  color: #6c757d;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.assignee, .created-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading-container {
  padding: 20px;
  text-align: center;
}

.empty-state {
  padding: 20px;
  text-align: center;
}

.card-header-with-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
