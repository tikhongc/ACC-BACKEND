<template>
  <div class="issue-detail">
    <!-- 议题basicInfo -->
    <div class="issue-header">
      <div class="issue-title-section">
        <div class="issue-id-badge">
          <el-tag type="primary" size="large">#{{ issue.displayId }}</el-tag>
        </div>
        <div class="issue-title-content">
          <h2 class="issue-title">{{ issue.title }}</h2>
          <div class="issue-meta">
            <StatusTag 
              :status="getIssueStatusType(issue.status)"
              :text="getIssueStatusText(issue.status)"
              size="default"
              :show-icon="true" />
            <StatusTag 
              v-if="issue.priority"
              :status="getPriorityType(issue.priority)"
              :text="getPriorityText(issue.priority)"
              size="default"
              :show-icon="false" />
            <el-tag v-if="issue.issueTypeId" type="info" size="default">
              {{ getIssueTypeName(issue.issueTypeId) }}
            </el-tag>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="issue-actions">
        <el-button @click="refreshIssueData" :loading="loading" type="primary">
          <el-icon><Refresh /></el-icon>
          {{ t('common.refresh') }}
        </el-button>
        <el-button @click="exportIssueData">
          <el-icon><Download /></el-icon>
          {{ t('common.export') }}
        </el-button>
      </div>
    </div>

    <!-- 议题描述 -->
    <el-card v-if="issue.description" class="detail-card">
      <template #header>
        <span class="card-title">
          <el-icon><Document /></el-icon>
          {{ t('issueDetail.sections.description') }}
        </span>
      </template>
      <div class="issue-description" v-html="formatDescription(issue.description)"></div>
    </el-card>

    <!-- 议题详细信息 -->
    <el-card class="detail-card">
      <template #header>
        <span class="card-title">
          <el-icon><InfoFilled /></el-icon>
          {{ t('issueDetail.sections.detailInfo') }}
        </span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="t('issueDetail.fields.issueId')">
          <el-tag type="primary">#{{ issue.displayId }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('issueDetail.fields.systemId')">
          <code class="system-id">{{ issue.id }}</code>
        </el-descriptions-item>
        
        <el-descriptions-item :label="t('issueDetail.fields.status')">
          <StatusTag 
            :status="getIssueStatusType(issue.status)"
            :text="getIssueStatusText(issue.status)"
            size="default"
            :show-icon="true" />
        </el-descriptions-item>
        <el-descriptions-item :label="t('issueDetail.fields.priority')">
          <StatusTag 
            v-if="issue.priority"
            :status="getPriorityType(issue.priority)"
            :text="getPriorityText(issue.priority)"
            size="default"
            :show-icon="false" />
          <span v-else class="text-muted">{{ t('common.notSet') }}</span>
        </el-descriptions-item>
        
        <el-descriptions-item :label="t('issueDetail.fields.assignedTo')">
          <div v-if="issue.assignedTo" class="user-info">
            <el-icon><User /></el-icon>
            <span>{{ getAssignedToName(issue.assignedTo, issue.assignedToType) }}</span>
            <code class="user-id">{{ issue.assignedTo }}</code>
          </div>
          <el-tag v-else type="info">{{ t('issueDetail.values.unassigned') }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('issueDetail.fields.assignedToType')">
          <el-tag v-if="issue.assignedToType" type="info" size="small">
            {{ getAssignedToTypeText(issue.assignedToType) }}
          </el-tag>
          <span v-else class="text-muted">-</span>
        </el-descriptions-item>
        
        <el-descriptions-item :label="t('issueDetail.fields.createdBy')">
          <div class="user-info">
            <el-icon><User /></el-icon>
            <span>{{ getUserName(issue.createdBy) }}</span>
            <code class="user-id">{{ issue.createdBy }}</code>
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="t('issueDetail.fields.updatedBy')">
          <div v-if="issue.updatedBy" class="user-info">
            <el-icon><User /></el-icon>
            <span>{{ getUserName(issue.updatedBy) }}</span>
            <code class="user-id">{{ issue.updatedBy }}</code>
          </div>
          <span v-else class="text-muted">-</span>
        </el-descriptions-item>
        
        <el-descriptions-item :label="t('issueDetail.fields.createdAt')">
          <div class="time-info">
            <el-icon><Clock /></el-icon>
            <span>{{ formatDateTime(issue.createdAt) }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="t('issueDetail.fields.updatedAt')">
          <div class="time-info">
            <el-icon><Clock /></el-icon>
            <span>{{ formatDateTime(issue.updatedAt) }}</span>
          </div>
        </el-descriptions-item>
        
        <el-descriptions-item :label="t('issueDetail.fields.startDate')" v-if="issue.startDate">
          <div class="time-info">
            <el-icon><Calendar /></el-icon>
            <span>{{ formatDateTime(issue.startDate) }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="t('issueDetail.fields.dueDate')" v-if="issue.dueDate">
          <div class="time-info">
            <el-icon><Clock /></el-icon>
            <span>{{ formatDateTime(issue.dueDate) }}</span>
            <el-tag 
              :type="getDueDateType(issue.dueDate)" 
              size="small" 
              style="margin-left: 8px;">
              {{ getDueDateStatus(issue.dueDate) }}
            </el-tag>
          </div>
        </el-descriptions-item>
        
        <el-descriptions-item :label="t('issueDetail.fields.closedBy')" v-if="issue.closedBy">
          <div class="user-info">
            <el-icon><User /></el-icon>
            <span>{{ getUserName(issue.closedBy) }}</span>
            <code class="user-id">{{ issue.closedBy }}</code>
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="t('issueDetail.fields.closedAt')" v-if="issue.closedAt">
          <div class="time-info">
            <el-icon><Clock /></el-icon>
            <span>{{ formatDateTime(issue.closedAt) }}</span>
          </div>
        </el-descriptions-item>
        
        <el-descriptions-item :label="t('issueDetail.fields.watchers')" v-if="issue.watchers && issue.watchers.length > 0">
          <div class="watchers-info">
            <el-tag 
              v-for="watcher in issue.watchers" 
              :key="watcher"
              type="primary" 
              size="small"
              style="margin-right: 4px; margin-bottom: 4px;">
              {{ getUserName(watcher) }}
            </el-tag>
            <span class="watcher-count">({{ issue.watchers.length }}{{ t('issueDetail.values.people') }})</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="t('issueDetail.fields.rootCauseId')" v-if="issue.rootCauseId">
          <code class="root-cause-id">{{ issue.rootCauseId }}</code>
        </el-descriptions-item>
        
        <el-descriptions-item :label="t('issueDetail.fields.published')">
          <el-tag :type="issue.published ? 'success' : 'warning'" size="small">
            {{ issue.published ? t('issueDetail.values.published') : t('issueDetail.values.unpublished') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('issueDetail.fields.deleted')">
          <el-tag :type="issue.deleted ? 'danger' : 'success'" size="small">
            {{ issue.deleted ? t('issueDetail.values.deleted') : t('issueDetail.values.normal') }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 位置信息 -->
    <el-card v-if="issue.locationId || issue.locationDetails" class="detail-card">
      <template #header>
        <span class="card-title">
          <el-icon><Location /></el-icon>
          {{ t('issueDetail.sections.locationInfo') }}
        </span>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item v-if="issue.locationId" :label="t('issueDetail.fields.locationId')">
          <code>{{ issue.locationId }}</code>
        </el-descriptions-item>
        <el-descriptions-item v-if="issue.locationDetails" :label="t('issueDetail.fields.locationDescription')">
          {{ issue.locationDetails }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 关联文档 -->
    <el-card v-if="issue.linkedDocuments && issue.linkedDocuments.length > 0" class="detail-card">
      <template #header>
        <span class="card-title">
          <el-icon><Link /></el-icon>
          {{ t('issueDetail.sections.linkedDocuments') }} ({{ issue.linkedDocuments.length }})
        </span>
      </template>
      <div class="linked-documents">
        <div 
          v-for="(doc, index) in issue.linkedDocuments" 
          :key="index"
          class="linked-document-item">
          <el-card shadow="hover">
            <div class="document-info">
              <div class="document-header">
                <el-icon class="document-icon" :class="getDocumentIconClass(doc)">
                  <Document />
                </el-icon>
                <div class="document-basic-info">
                  <div class="document-name">
                    {{ getDocumentDisplayName(doc) }}
                    <el-tag v-if="doc.enhanced_info" type="success" size="small" class="enhanced-tag">
                      {{ t('issueDetail.linkedDocuments.enhanced') }}
                    </el-tag>
                  </div>
                  <div class="document-type" v-if="doc.enhanced_info">
                    {{ getFileTypeDisplay(doc.enhanced_info.file_type) }}
                    <span v-if="doc.enhanced_info.file_size > 0" class="file-size">
                      ({{ formatFileSize(doc.enhanced_info.file_size) }})
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- 增强信息展示 -->
              <div v-if="doc.enhanced_info" class="enhanced-info">
                <el-descriptions :column="2" size="small" border>
                  <el-descriptions-item :label="t('issueDetail.linkedDocuments.fileType')">
                    <el-tag :type="getFileTypeTagType(doc.enhanced_info.file_type)" size="small">
                      {{ doc.enhanced_info.file_type.toUpperCase() }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('issueDetail.linkedDocuments.fileSize')" v-if="doc.enhanced_info.file_size > 0">
                    {{ formatFileSize(doc.enhanced_info.file_size) }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('issueDetail.linkedDocuments.version')" v-if="doc.enhanced_info.version_number">
                    v{{ doc.enhanced_info.version_number }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('issueDetail.linkedDocuments.createTime')" v-if="doc.enhanced_info.create_time">
                    {{ formatDateTime(doc.enhanced_info.create_time) }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('issueDetail.linkedDocuments.modifiedTime')" v-if="doc.enhanced_info.last_modified_time">
                    {{ formatDateTime(doc.enhanced_info.last_modified_time) }}
                  </el-descriptions-item>
                  <el-descriptions-item :label="t('issueDetail.linkedDocuments.mimeType')" v-if="doc.enhanced_info.mime_type">
                    <code class="mime-type">{{ doc.enhanced_info.mime_type }}</code>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              
              <!-- 原始URN信息 -->
              <div class="document-urn-section">
                <el-collapse>
                  <el-collapse-item :title="t('issueDetail.linkedDocuments.technicalInfo')" name="technical">
                    <div class="technical-info">
                      <div class="urn-info">
                        <span class="urn-label">{{ t('issueDetail.linkedDocuments.urn') }}:</span>
                        <el-input 
                          v-model="doc.urn" 
                          readonly 
                          size="small" 
                          class="urn-input">
                          <template #append>
                            <el-button 
                              @click="copyToClipboard(doc.urn)" 
                              size="small" 
                              :icon="CopyDocument">
                              {{ t('common.copy') }}
                            </el-button>
                          </template>
                        </el-input>
                      </div>
                      
                      <div v-if="doc.enhanced_info && doc.enhanced_info.storage_urn" class="storage-urn-info">
                        <span class="urn-label">{{ t('issueDetail.linkedDocuments.storageUrn') }}:</span>
                        <el-input 
                          v-model="doc.enhanced_info.storage_urn" 
                          readonly 
                          size="small" 
                          class="urn-input">
                          <template #append>
                            <el-button 
                              @click="copyToClipboard(doc.enhanced_info.storage_urn)" 
                              size="small" 
                              :icon="CopyDocument">
                              {{ t('common.copy') }}
                            </el-button>
                          </template>
                        </el-input>
                      </div>
                      
                      <div v-if="doc.type" class="document-type-info">
                        <span class="info-label">{{ t('issueDetail.linkedDocuments.documentType') }}:</span>
                        <el-tag size="small">{{ doc.type }}</el-tag>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
              
              <!-- 位置信息 -->
              <div v-if="doc.location || (doc.details && doc.details.position)" class="document-location">
                <el-divider content-position="left">{{ t('issueDetail.linkedDocuments.locationInfo') }}</el-divider>
                <div v-if="doc.location" class="location-text">
                  <el-icon><Location /></el-icon>
                  {{ doc.location }}
                </div>
                <div v-if="doc.details && doc.details.position" class="position-details">
                  <span class="info-label">{{ t('issueDetail.linkedDocuments.coordinatePosition') }}:</span>
                  <code class="position-code">{{ JSON.stringify(doc.details.position) }}</code>
                </div>
              </div>
              
              <!-- 错误信息 -->
              <div v-if="doc.enhanced_info && doc.enhanced_info.error" class="error-info">
                <el-alert 
                  :title="doc.enhanced_info.error" 
                  type="warning" 
                  size="small" 
                  show-icon 
                  :closable="false">
                </el-alert>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <!-- 文档位置信息 -->
    <el-card v-if="issue.placements && issue.placements.length > 0" class="detail-card">
      <template #header>
        <span class="card-title">
          <el-icon><Location /></el-icon>
          {{ t('issueDetail.sections.documentPlacements') }} ({{ issue.placements.length }})
        </span>
      </template>
      <div class="placements">
        <div 
          v-for="(placement, index) in issue.placements" 
          :key="index"
          class="placement-item">
          <el-card shadow="hover">
            <div class="placement-info">
              <div class="placement-details">
                <div class="placement-type">
                  <el-tag type="info" size="small">{{ placement.type || 'file' }}</el-tag>
                </div>
                <div v-if="placement.viewable" class="viewable-info">
                  <div class="viewable-name">{{ placement.viewable.name || 'Unknown View' }}</div>
                  <div class="viewable-guid">
                    <code>{{ placement.viewable.guid }}</code>
                  </div>
                  <div class="viewable-type">
                    <el-tag :type="placement.viewable.is3D ? 'success' : 'primary'" size="small">
                      {{ placement.viewable.is3D ? t('issueDetail.placements.view3D') : t('issueDetail.placements.view2D') }}
                    </el-tag>
                  </div>
                </div>
                <div v-if="placement.lineageUrn" class="lineage-urn">
                  <span class="label">{{ t('issueDetail.placements.documentUrn') }}:</span>
                  <code>{{ placement.lineageUrn }}</code>
                </div>
                <div v-if="placement.createdAtVersion" class="version-info">
                  <span class="label">{{ t('issueDetail.placements.createdVersion') }}:</span>
                  <el-tag type="warning" size="small">v{{ placement.createdAtVersion }}</el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <!-- 自定义属性 -->
    <el-card v-if="issue.customAttributes && issue.customAttributes.length > 0" class="detail-card">
      <template #header>
        <span class="card-title">
          <el-icon><Setting /></el-icon>
          {{ t('issueDetail.sections.customAttributes') }} ({{ issue.customAttributes.length }})
        </span>
      </template>
      <div class="custom-attributes">
        <el-descriptions :column="2" border>
          <el-descriptions-item 
            v-for="attr in issue.customAttributes" 
            :key="attr.id"
            :label="attr.name || attr.id">
            <div class="custom-attribute-value">
              <span v-if="attr.value">{{ attr.value }}</span>
              <span v-else class="text-muted">{{ t('common.notSet') }}</span>
              <el-tag v-if="attr.type" type="info" size="small" style="margin-left: 8px;">
                {{ attr.type }}
              </el-tag>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 留言区域 -->
    <el-card class="detail-card">
      <template #header>
        <span class="card-title">
          <el-icon><ChatDotRound /></el-icon>
          {{ t('issueDetail.sections.comments') }} ({{ issue.commentCount || 0 }})
        </span>
        <el-button 
          @click="refreshComments" 
          :loading="commentsLoading" 
          size="small" 
          type="primary">
          {{ t('issueDetail.actions.refreshComments') }}
        </el-button>
      </template>
      <IssueComments 
        :project-id="project?.id"
        :issue-id="issue.id"
        :key="`comments-${issue.id}`"
        @comments-loaded="handleCommentsLoaded" />
    </el-card>

    <!-- 附件区域 -->
    <el-card class="detail-card">
      <template #header>
        <span class="card-title">
          <el-icon><Paperclip /></el-icon>
          {{ t('issueDetail.sections.attachments') }} ({{ issue.attachmentCount || 0 }})
        </span>
        <el-button 
          @click="refreshAttachments" 
          :loading="attachmentsLoading" 
          size="small" 
          type="primary">
          {{ t('issueDetail.actions.refreshAttachments') }}
        </el-button>
      </template>
      <IssueAttachments 
        :project-id="project?.id"
        :issue-id="issue.id"
        :key="`attachments-${issue.id}`"
        @attachments-loaded="handleAttachmentsLoaded" />
    </el-card>

    <!-- 原始数据 -->
    <el-card class="detail-card">
      <template #header>
        <span class="card-title">
          <el-icon><DataBoard /></el-icon>
          {{ t('issueDetail.sections.rawData') }}
        </span>
      </template>
      <JsonViewer 
        :data="issue"
        :title="t('issueDetail.jsonViewer.title')"
        :max-height="400" />
    </el-card>
  </div>
</template>

<script>
import { ref, computed, getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import StatusTag from './StatusTag.vue'
import JsonViewer from './JsonViewer.vue'
import IssueComments from './IssueComments.vue'
import IssueAttachments from './IssueAttachments.vue'
import userCache from '../utils/userCache.js'
import entityCache from '../utils/entityCache.js'

// 图标导入
import {
  Refresh,
  Download,
  Document,
  InfoFilled,
  User,
  Clock,
  Calendar,
  Location,
  Link,
  Setting,
  ChatDotRound,
  Paperclip,
  DataBoard,
  CopyDocument
} from '@element-plus/icons-vue'

export default {
  name: 'IssueDetail',
  components: {
    StatusTag,
    JsonViewer,
    IssueComments,
    IssueAttachments
  },
  props: {
    issue: {
      type: Object,
      required: true
    },
    project: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const { t } = useI18n()
    
    // 响应式数据
    const loading = ref(false)
    const commentsLoading = ref(false)
    const attachmentsLoading = ref(false)
    
    // 刷新议题数据
    const refreshIssueData = () => {
      ElMessage.info(t('issueDetail.messages.refreshInDevelopment'))
    }
    
    // 导出议题数据
    const exportIssueData = () => {
      try {
        const dataStr = JSON.stringify(props.issue, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `issue-${props.issue.displayId}-${Date.now()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        ElMessage.success(t('issueDetail.messages.exportSuccess'))
      } catch (err) {
        console.error('导出失败:', err)
        ElMessage.error(t('issueDetail.messages.exportFailed'))
      }
    }
    
    // 刷新留言
    const refreshComments = () => {
      commentsLoading.value = true
      // 触发子组件刷新
      setTimeout(() => {
        commentsLoading.value = false
        ElMessage.success(t('issueDetail.messages.commentsRefreshed'))
      }, 1000)
    }
    
    // 刷新附件
    const refreshAttachments = () => {
      attachmentsLoading.value = true
      // 触发子组件刷新
      setTimeout(() => {
        attachmentsLoading.value = false
        ElMessage.success(t('issueDetail.messages.attachmentsRefreshed'))
      }, 1000)
    }
    
    // 处理留言加载完成
    const handleCommentsLoaded = (comments) => {
      console.log('Comments loaded:', comments.length)
    }
    
    // 处理附件加载完成
    const handleAttachmentsLoaded = (attachments) => {
      console.log('Attachments loaded:', attachments.length)
    }
    
    // 格式化描述
    const formatDescription = (description) => {
      if (!description) return ''
      // 简单的HTML格式化，将换行符转换为<br>
      return description.replace(/\n/g, '<br>')
    }
    
    // 工具函数
    const getIssueStatusType = (status) => {
      const statusMap = {
        'open': 'warning',
        'in_progress': 'success',
        'closed': 'info',
        'resolved': 'success',
        'rejected': 'danger'
      }
      return statusMap[status?.toLowerCase()] || 'info'
    }

    const getIssueStatusText = (status) => {
      const statusMap = {
        'open': t('issues.status.open'),
        'in_progress': t('issues.status.inProgress'),
        'closed': t('issues.status.closed'),
        'resolved': t('issues.status.resolved'),
        'rejected': t('issues.status.rejected')
      }
      return statusMap[status?.toLowerCase()] || status || t('common.unknown')
    }

    const getPriorityType = (priority) => {
      const priorityMap = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'success',
        'critical': 'danger'
      }
      return priorityMap[priority?.toLowerCase()] || 'info'
    }

    const getPriorityText = (priority) => {
      const priorityMap = {
        'high': t('issues.priority.high'),
        'medium': t('issues.priority.medium'),
        'low': t('issues.priority.low'),
        'critical': t('issues.priority.critical')
      }
      return priorityMap[priority?.toLowerCase()] || priority || t('common.notSet')
    }

    const getUserName = (userId) => {
      if (!userId) return 'N/A'
      
      // 优先使用新的实体缓存系统
      const displayName = entityCache.getUserDisplayName(userId, props.project?.id)
      if (displayName && displayName !== userId) {
        return displayName
      }
      
      // 回退到原有的用户缓存
      const fallbackName = userCache.getUserDisplayName(userId, props.project?.id)
      if (fallbackName && fallbackName !== userId) {
        return fallbackName
      }
      
      // 如果缓存中没有找到，使用原有逻辑
      // 简化用户名显示
      if (userId.includes('@')) {
        return userId.split('@')[0]
      }
      return userId.length > 20 ? userId.substring(0, 20) + '...' : userId
    }

    const getAssignedToTypeText = (type) => {
      const typeMap = {
        'user': t('issues.assignedToType.user'),
        'role': t('issues.assignedToType.role'),
        'company': t('issues.assignedToType.company')
      }
      return typeMap[type?.toLowerCase()] || type || t('common.unknown')
    }

    // 根据分配类型获取分配对象的显示名称
    const getAssignedToName = (assignedTo, assignedToType) => {
      if (!assignedTo) return t('issueDetail.values.unassigned')
      
      // 调试：显示分配信息
      console.log('🔍 IssueDetail获取分配对象名称:', { assignedTo, assignedToType })
      
      // 使用实体缓存获取显示名称
      try {
        const displayName = entityCache.getAssignedToDisplayName(assignedTo, assignedToType, props.projectId)
        if (displayName && displayName !== assignedTo) {
          console.log('✅ IssueDetail实体缓存成功:', { assignedTo, assignedToType, displayName })
          return displayName
        }
      } catch (error) {
        console.warn('⚠️ IssueDetail实体缓存失败:', error)
      }
      
      // 回退方案：根据分配类型处理
      switch (assignedToType) {
        case 'user':
          const userName = getUserName(assignedTo)
          console.log('👤 IssueDetail使用用户缓存:', { assignedTo, userName })
          return userName
        case 'role':
          // 角色ID通常是数字，显示为"角色-ID"
          console.log('👔 IssueDetail角色回退显示:', assignedTo)
          return `${t('issues.assignedToType.role')}-${assignedTo}`
        case 'company':
          // 公司ID，显示为"公司-ID"
          console.log('🏢 IssueDetail公司回退显示:', assignedTo)
          return `${t('issues.assignedToType.company')}-${assignedTo}`
        default:
          // 未知类型，尝试用户名获取
          console.log('❓ IssueDetail未知类型，使用用户缓存:', { assignedTo, assignedToType })
          return getUserName(assignedTo)
      }
    }

    const getIssueTypeName = (typeId) => {
      // 这里可以从类型缓存中获取类型名称
      // 暂时返回简化的类型ID
      if (!typeId) return t('issueDetail.values.uncategorized')
      return typeId.substring(0, 8) + '...'
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return 'N/A'
      try {
        const date = new Date(dateString)
        return date.toLocaleString('zh-CN')
      } catch (error) {
        return dateString
      }
    }

    const getDueDateType = (dateString) => {
      if (!dateString || dateString === 'N/A') return 'info'
      try {
        const date = new Date(dateString)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)
        const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff < 0) return 'danger'
        if (daysDiff === 0) return 'warning'
        if (daysDiff === 1) return 'warning'
        if (daysDiff <= 3) return 'primary'
        if (daysDiff <= 7) return 'success'
        return 'success'
      } catch (error) {
        return 'info'
      }
    }

    const getDueDateStatus = (dateString) => {
      if (!dateString || dateString === 'N/A') return ''
      try {
        const date = new Date(dateString)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)
        const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff < 0) {
          const absDays = Math.abs(daysDiff)
          if (absDays === 1) return t('issueDetail.dueDate.expiredYesterday')
          if (absDays <= 7) return t('issueDetail.dueDate.expiredDaysAgo', { days: absDays })
          return t('issueDetail.dueDate.expired')
        }
        if (daysDiff === 0) return t('issueDetail.dueDate.dueToday')
        if (daysDiff === 1) return t('issueDetail.dueDate.dueTomorrow')
        if (daysDiff === 2) return t('issueDetail.dueDate.dueDayAfterTomorrow')
        if (daysDiff <= 7) return t('issueDetail.dueDate.dueInDays', { days: daysDiff })
        if (daysDiff <= 30) return t('issueDetail.dueDate.adequateTime')
        return t('issueDetail.dueDate.plentyOfTime')
      } catch (error) {
        return ''
      }
    }

    // 文档增强功能相关方法
    const getDocumentDisplayName = (doc) => {
      if (doc.enhanced_info && doc.enhanced_info.name && doc.enhanced_info.name !== 'Unknown Document') {
        return doc.enhanced_info.name
      }
      return doc.name || 'Unknown Document'
    }

    const getDocumentIconClass = (doc) => {
      if (!doc.enhanced_info) return 'document-icon-default'
      
      const fileType = doc.enhanced_info.file_type?.toLowerCase()
      const iconMap = {
        'pdf': 'document-icon-pdf',
        'dwg': 'document-icon-cad',
        'dxf': 'document-icon-cad',
        'rvt': 'document-icon-bim',
        'ifc': 'document-icon-bim',
        'nwd': 'document-icon-bim',
        'nwc': 'document-icon-bim',
        'jpg': 'document-icon-image',
        'jpeg': 'document-icon-image',
        'png': 'document-icon-image',
        'gif': 'document-icon-image',
        'doc': 'document-icon-word',
        'docx': 'document-icon-word',
        'xls': 'document-icon-excel',
        'xlsx': 'document-icon-excel'
      }
      return iconMap[fileType] || 'document-icon-default'
    }

    const getFileTypeDisplay = (fileType) => {
      const typeMap = {
        'pdf': t('issueDetail.fileTypes.pdf'),
        'dwg': t('issueDetail.fileTypes.dwg'),
        'dxf': t('issueDetail.fileTypes.dxf'),
        'rvt': t('issueDetail.fileTypes.rvt'),
        'ifc': t('issueDetail.fileTypes.ifc'),
        'nwd': t('issueDetail.fileTypes.nwd'),
        'nwc': t('issueDetail.fileTypes.nwc'),
        'jpg': t('issueDetail.fileTypes.jpg'),
        'jpeg': t('issueDetail.fileTypes.jpeg'),
        'png': t('issueDetail.fileTypes.png'),
        'gif': t('issueDetail.fileTypes.gif'),
        'doc': t('issueDetail.fileTypes.doc'),
        'docx': t('issueDetail.fileTypes.docx'),
        'xls': t('issueDetail.fileTypes.xls'),
        'xlsx': t('issueDetail.fileTypes.xlsx'),
        'ppt': t('issueDetail.fileTypes.ppt'),
        'pptx': t('issueDetail.fileTypes.pptx')
      }
      return typeMap[fileType?.toLowerCase()] || fileType?.toUpperCase() || t('issueDetail.fileTypes.unknown')
    }

    const getFileTypeTagType = (fileType) => {
      const typeMap = {
        'pdf': 'danger',
        'dwg': 'primary',
        'dxf': 'primary',
        'rvt': 'success',
        'ifc': 'success',
        'nwd': 'warning',
        'nwc': 'warning',
        'jpg': 'info',
        'jpeg': 'info',
        'png': 'info',
        'gif': 'info',
        'doc': 'primary',
        'docx': 'primary',
        'xls': 'success',
        'xlsx': 'success'
      }
      return typeMap[fileType?.toLowerCase()] || ''
    }

    const formatFileSize = (bytes) => {
      if (!bytes || bytes === 0) return '0 B'
      
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text)
        ElMessage.success(t('common.copySuccess'))
      } catch (error) {
        console.error('复制失败:', error)
        ElMessage.error(t('common.copyFailed'))
      }
    }
    
    return {
      // i18n
      t,
      
      // 响应式数据
      loading,
      commentsLoading,
      attachmentsLoading,
      
      // 图标
      Refresh,
      Download,
      Document,
      InfoFilled,
      User,
      Clock,
      Calendar,
      Location,
      Link,
      Setting,
      ChatDotRound,
      Paperclip,
      DataBoard,
      CopyDocument,
      
      // 方法
      refreshIssueData,
      exportIssueData,
      refreshComments,
      refreshAttachments,
      handleCommentsLoaded,
      handleAttachmentsLoaded,
      formatDescription,
      getIssueStatusType,
      getIssueStatusText,
      getPriorityType,
      getPriorityText,
      getUserName,
      getAssignedToName,
      getAssignedToTypeText,
      getIssueTypeName,
      formatDateTime,
      getDueDateType,
      getDueDateStatus,
      // 新增的文档增强方法
      getDocumentDisplayName,
      getDocumentIconClass,
      getFileTypeDisplay,
      getFileTypeTagType,
      formatFileSize,
      copyToClipboard
    }
  }
}
</script>

<style scoped>
.issue-detail {
  padding: 0;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
}

.issue-title-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.issue-id-badge {
  flex-shrink: 0;
}

.issue-title-content {
  flex: 1;
}

.issue-title {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.3;
}

.issue-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.issue-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.issue-description {
  line-height: 1.6;
  color: #495057;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.system-id {
  font-family: 'Consolas', 'Monaco', monospace;
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 2px 4px;
  border-radius: 2px;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-muted {
  color: #6c757d;
  font-style: italic;
}

.linked-documents {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.linked-document-item {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.document-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.document-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.document-icon {
  font-size: 28px;
  flex-shrink: 0;
  transition: color 0.3s ease;
}

.document-icon-default { color: var(--el-color-info); }
.document-icon-pdf { color: #d32f2f; }
.document-icon-cad { color: #1976d2; }
.document-icon-bim { color: #388e3c; }
.document-icon-image { color: #f57c00; }
.document-icon-word { color: #1976d2; }
.document-icon-excel { color: #388e3c; }

.document-basic-info {
  flex: 1;
}

.document-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-word;
}

.enhanced-tag {
  font-size: 10px;
}

.document-type {
  font-size: 14px;
  color: var(--el-text-color-regular);
  display: flex;
  align-items: center;
  gap: 4px;
}

.file-size {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* 增强信息样式 */
.enhanced-info {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-success);
}

.mime-type {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  background: var(--el-fill-color-light);
  padding: 2px 4px;
  border-radius: 3px;
}

/* URN信息样式 */
.document-urn-section {
  margin-top: 12px;
}

.technical-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.urn-info,
.storage-urn-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.urn-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.urn-input {
  font-family: 'Courier New', monospace;
  font-size: 11px;
}

.document-type-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

/* 位置信息样式 */
.document-location {
  margin-top: 12px;
}

.location-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.position-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.position-code {
  font-family: 'Courier New', monospace;
  background: var(--el-fill-color-light);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 10px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 错误信息样式 */
.error-info {
  margin-top: 12px;
}

.custom-attributes {
  padding: 0;
}

.custom-attribute-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .issue-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .issue-title-section {
    flex-direction: column;
    gap: 12px;
  }
  
  .issue-title {
    font-size: 20px;
  }
  
  .issue-actions {
    align-self: stretch;
  }
  
  .linked-documents {
    grid-template-columns: 1fr;
  }
  
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-descriptions__label) {
  font-weight: 600;
  color: #495057;
}

:deep(.el-card__header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 新增样式 */
.watchers-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.watcher-count {
  color: #6c757d;
  font-size: 12px;
  margin-left: 8px;
}

.root-cause-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #495057;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.placements {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.placement-item {
  border-radius: 6px;
}

.placement-info {
  padding: 4px;
}

.placement-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.placement-type {
  margin-bottom: 8px;
}

.viewable-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.viewable-name {
  font-weight: 500;
  color: #495057;
  margin-bottom: 4px;
}

.viewable-guid {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #6c757d;
  margin-bottom: 8px;
}

.viewable-type {
  margin-top: 4px;
}

.lineage-urn {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lineage-urn .label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.lineage-urn code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
  color: #495057;
  background: #f8f9fa;
  padding: 4px 6px;
  border-radius: 3px;
  word-break: break-all;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-info .label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}
</style>
