<template>
  <div class="issue-attachments">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="2" animated />
    </div>
    
    <!-- 错误状态 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 16px;">
      <template #default>
        <div class="error-actions">
          <el-button @click="loadAttachments" size="small" type="primary">{{ t('common.retry') }}</el-button>
        </div>
      </template>
    </el-alert>
    
    <!-- 空状态 -->
    <el-empty 
      v-if="!loading && !error && attachments.length === 0"
      :description="t('issueDetail.attachments.noAttachments')"
      :image-size="80">
      <template #description>
        <span class="empty-description">{{ t('issueDetail.attachments.noAttachmentsForIssue') }}</span>
      </template>
    </el-empty>
    
    <!-- 附件列表 -->
    <div v-if="!loading && !error && attachments.length > 0" class="attachments-list">
      <!-- 附件统计 -->
      <div class="attachments-header">
        <div class="attachments-count">
          <el-icon><Paperclip /></el-icon>
          <span>{{ t('issueDetail.attachments.totalAttachments', { count: attachments.length }) }}</span>
          <el-tag v-if="totalSize > 0" type="info" size="small">
            {{ t('issueDetail.attachments.totalSize') }}: {{ formatFileSize(totalSize) }}
          </el-tag>
        </div>
        <div class="attachments-actions">
          <el-button @click="loadAttachments" :loading="loading" size="small">
            <el-icon><Refresh /></el-icon>
            {{ t('common.refresh') }}
          </el-button>
          <el-button @click="exportAttachments" size="small" type="default">
            <el-icon><Download /></el-icon>
            {{ t('issueDetail.attachments.exportList') }}
          </el-button>
        </div>
      </div>
      
      <!-- 附件网格 -->
      <div class="attachments-grid">
        <div 
          v-for="(attachment, index) in attachments" 
          :key="attachment.attachmentId || index"
          class="attachment-item">
          <el-card shadow="hover" class="attachment-card">
            <!-- 附件头部 -->
            <div class="attachment-header">
              <div class="attachment-icon">
                <el-icon :size="32" :color="getFileTypeColor(attachment.fileType)">
                  <component :is="getFileTypeIcon(attachment.fileType)" />
                </el-icon>
              </div>
              <div class="attachment-info">
                <div class="attachment-name" :title="attachment.displayName">
                  {{ attachment.displayName || attachment.fileName || t('issueDetail.attachments.unknownFile') }}
                </div>
                <div class="attachment-type">
                  <el-tag :type="getFileTypeTagType(attachment.fileType)" size="small">
                    {{ attachment.fileType?.toUpperCase() || 'UNKNOWN' }}
                  </el-tag>
                  <el-tag v-if="attachment.attachmentType" type="info" size="small">
                    {{ getAttachmentTypeText(attachment.attachmentType) }}
                  </el-tag>
                </div>
              </div>
            </div>
            
            <!-- 附件详情 -->
            <div class="attachment-details">
              <el-descriptions :column="1" size="small" border>
                <el-descriptions-item v-if="attachment.fileSize" :label="t('issueDetail.attachments.fileSize')">
                  {{ formatFileSize(attachment.fileSize) }}
                </el-descriptions-item>
                <el-descriptions-item v-if="attachment.createdBy" :label="t('issueDetail.attachments.uploader')">
                  <div class="user-info">
                    <el-icon><User /></el-icon>
                    <span>{{ getUserName(attachment.createdBy) }}</span>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item v-if="attachment.createdOn" :label="t('issueDetail.attachments.uploadTime')">
                  <div class="time-info">
                    <el-icon><Clock /></el-icon>
                    <span>{{ formatDateTime(attachment.createdOn) }}</span>
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </div>
            
            <!-- 附件操作 -->
            <div class="attachment-actions">
              <el-button 
                v-if="attachment.urn"
                @click="downloadAttachment(attachment)" 
                :loading="downloadingIds.includes(attachment.attachmentId)"
                size="small" 
                type="primary">
                <el-icon><Download /></el-icon>
                {{ t('common.download') }}
              </el-button>
              <el-button 
                @click="previewAttachment(attachment)" 
                size="small" 
                type="default"
                :disabled="!canPreview(attachment)">
                <el-icon><View /></el-icon>
                {{ t('issueDetail.attachments.preview') }}
              </el-button>
              <el-button 
                @click="copyAttachmentInfo(attachment)" 
                size="small" 
                text 
                type="info">
                <el-icon><CopyDocument /></el-icon>
                {{ t('issueDetail.attachments.copyInfo') }}
              </el-button>
            </div>
            
            <!-- 附件URN（调试用） -->
            <div v-if="showDebugInfo && attachment.urn" class="attachment-debug">
              <el-descriptions :column="1" size="small">
                <el-descriptions-item :label="t('issueDetail.attachments.urn')">
                  <code class="urn-code">{{ attachment.urn }}</code>
                </el-descriptions-item>
                <el-descriptions-item :label="t('issueDetail.attachments.attachmentId')">
                  <code>{{ attachment.attachmentId }}</code>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-card>
        </div>
      </div>
    </div>
    
    <!-- 预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="t('issueDetail.attachments.previewTitle', { name: currentPreviewAttachment?.displayName || '' })"
      width="80%"
      :before-close="handleClosePreview">
      <div class="preview-container">
        <!-- 图片预览 -->
        <div v-if="isImageFile(currentPreviewAttachment)" class="image-preview">
          <el-image 
            :src="previewUrl"
            :alt="currentPreviewAttachment?.displayName"
            fit="contain"
            style="max-width: 100%; max-height: 60vh;"
            :preview-src-list="[previewUrl]"
            :initial-index="0"
            preview-teleported />
        </div>
        
        <!-- 文本预览 -->
        <div v-else-if="isTextFile(currentPreviewAttachment)" class="text-preview">
          <pre class="text-content">{{ previewContent }}</pre>
        </div>
        
        <!-- 不支持预览 -->
        <div v-else class="unsupported-preview">
          <el-empty :description="t('issueDetail.attachments.unsupportedPreview')">
            <el-button @click="downloadAttachment(currentPreviewAttachment)" type="primary">
              <el-icon><Download /></el-icon>
              {{ t('issueDetail.attachments.downloadFile') }}
            </el-button>
          </el-empty>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import userCache from '../utils/userCache.js'

// 图标导入
import {
  Paperclip,
  Refresh,
  Download,
  View,
  User,
  Clock,
  CopyDocument,
  Document,
  Picture,
  VideoCamera,
  Headset,
  Files,
  FolderOpened
} from '@element-plus/icons-vue'

export default {
  name: 'IssueAttachments',
  props: {
    projectId: {
      type: String,
      required: true
    },
    issueId: {
      type: String,
      required: true
    },
    autoLoad: {
      type: Boolean,
      default: true
    },
    showDebugInfo: {
      type: Boolean,
      default: false
    }
  },
  emits: ['attachments-loaded', 'attachments-error'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const attachments = ref([])
    const downloadingIds = ref([])
    const showPreviewDialog = ref(false)
    const currentPreviewAttachment = ref(null)
    const previewUrl = ref('')
    const previewContent = ref('')
    
    // 计算属性：总文件大小
    const totalSize = computed(() => {
      return attachments.value.reduce((total, attachment) => {
        return total + (attachment.fileSize || 0)
      }, 0)
    })
    
    // 加载附件
    const loadAttachments = async () => {
      if (!props.projectId || !props.issueId) {
        error.value = t('issueDetail.attachments.missingIds')
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        console.log(`加载议题附件: ${props.issueId}`)
        
        // 并行加载附件数据和用户缓存
        const [response] = await Promise.all([
          axios.get(
            `/api/issues/projects/${props.projectId}/issues/${props.issueId}/attachments`,
            {
              timeout: 15000
            }
          ),
          userCache.getProjectUsers(props.projectId) // 预加载用户缓存
        ])
        
        if (response.data.status === 'success') {
          const attachmentsData = response.data.data.results || []
          attachments.value = attachmentsData
          
          console.log(`附件加载成功: ${attachmentsData.length} 个`)
          emit('attachments-loaded', attachmentsData)
          
          if (attachmentsData.length === 0) {
            // 不显示消息，让空状态组件处理
          } else {
            ElMessage.success(t('issueDetail.attachments.loadSuccess', { count: attachmentsData.length }))
          }
        } else {
          throw new Error(response.data.error || t('issueDetail.attachments.loadFailed'))
        }
      } catch (err) {
        console.error('加载附件失败:', err)
        error.value = err.response?.data?.error || err.message || t('issueDetail.attachments.loadFailed')
        emit('attachments-error', error.value)
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }
    
    // 下载附件
    const downloadAttachment = async (attachment) => {
      if (!attachment.urn) {
        ElMessage.warning(t('issueDetail.attachments.noDownloadLink'))
        return
      }
      
      const attachmentId = attachment.attachmentId
      downloadingIds.value.push(attachmentId)
      
      try {
        // 这里应该调用文件下载API
        // 暂时显示提示信息
        ElMessage.info(t('issueDetail.attachments.downloadInDevelopment'))
        
        // 模拟下载延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.success(t('issueDetail.attachments.downloadStarted', { name: attachment.displayName }))
      } catch (err) {
        console.error('下载失败:', err)
        ElMessage.error(t('issueDetail.attachments.downloadFailed'))
      } finally {
        const index = downloadingIds.value.indexOf(attachmentId)
        if (index > -1) {
          downloadingIds.value.splice(index, 1)
        }
      }
    }
    
    // 预览附件
    const previewAttachment = async (attachment) => {
      if (!canPreview(attachment)) {
        ElMessage.warning(t('issueDetail.attachments.unsupportedPreview'))
        return
      }
      
      currentPreviewAttachment.value = attachment
      previewUrl.value = ''
      previewContent.value = ''
      
      try {
        if (isImageFile(attachment)) {
          // 图片预览 - 这里应该通过API获取预览URL
          previewUrl.value = `data:image/${attachment.fileType};base64,placeholder`
          ElMessage.info(t('issueDetail.attachments.imagePreviewInDevelopment'))
        } else if (isTextFile(attachment)) {
          // 文本预览 - 这里应该通过API获取文件内容
          previewContent.value = t('issueDetail.attachments.textPreviewInDevelopment')
          ElMessage.info(t('issueDetail.attachments.textPreviewInDevelopment'))
        }
        
        showPreviewDialog.value = true
      } catch (err) {
        console.error('预览失败:', err)
        ElMessage.error(t('issueDetail.attachments.previewFailed'))
      }
    }
    
    // 关闭预览
    const handleClosePreview = () => {
      showPreviewDialog.value = false
      currentPreviewAttachment.value = null
      previewUrl.value = ''
      previewContent.value = ''
    }
    
    // 复制附件信息
    const copyAttachmentInfo = async (attachment) => {
      try {
        const info = [
          `${t('issueDetail.attachments.fileName')}: ${attachment.displayName || attachment.fileName}`,
          `${t('issueDetail.attachments.fileType')}: ${attachment.fileType}`,
          `${t('issueDetail.attachments.fileSize')}: ${formatFileSize(attachment.fileSize)}`,
          `${t('issueDetail.attachments.uploader')}: ${getUserName(attachment.createdBy)}`,
          `${t('issueDetail.attachments.uploadTime')}: ${formatDateTime(attachment.createdOn)}`,
          `URN: ${attachment.urn}`
        ].join('\n')
        
        await navigator.clipboard.writeText(info)
        ElMessage.success(t('issueDetail.attachments.copySuccess'))
      } catch (error) {
        console.error('复制失败:', error)
        ElMessage.error(t('common.copyFailed'))
      }
    }
    
    // 导出附件列表
    const exportAttachments = () => {
      if (attachments.value.length === 0) {
        ElMessage.warning(t('issueDetail.attachments.noAttachmentsToExport'))
        return
      }
      
      try {
        const dataStr = JSON.stringify(attachments.value, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `issue-${props.issueId}-attachments-${Date.now()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        ElMessage.success(t('issueDetail.attachments.exportSuccess'))
      } catch (err) {
        console.error('导出失败:', err)
        ElMessage.error(t('issueDetail.attachments.exportFailed'))
      }
    }
    
    // 工具函数
    const getUserName = (userId) => {
      if (!userId) return t('issueDetail.attachments.unknownUser')
      
      // 使用用户缓存获取用户显示名称
      const displayName = userCache.getUserDisplayName(userId, props.projectId)
      if (displayName && displayName !== userId) {
        return displayName
      }
      
      // 回退方案：如果缓存中没有找到，使用简化显示
      if (userId.includes('@')) {
        return userId.split('@')[0]
      }
      
      if (userId.length > 20) {
        return userId.substring(0, 20) + '...'
      }
      
      return userId
    }
    
    const formatDateTime = (dateString) => {
      if (!dateString) return t('issueDetail.attachments.unknownTime')
      
      try {
        const date = new Date(dateString)
        return date.toLocaleString('zh-CN')
      } catch (error) {
        return dateString
      }
    }
    
    const formatFileSize = (bytes) => {
      if (!bytes || bytes === 0) return '0 B'
      
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    const getFileTypeIcon = (fileType) => {
      if (!fileType) return Files
      
      const type = fileType.toLowerCase()
      
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(type)) {
        return Picture
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
        return VideoCamera
      } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(type)) {
        return Headset
      } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(type)) {
        return Document
      } else {
        return Files
      }
    }
    
    const getFileTypeColor = (fileType) => {
      if (!fileType) return '#909399'
      
      const type = fileType.toLowerCase()
      
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(type)) {
        return '#67c23a'
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
        return '#e6a23c'
      } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(type)) {
        return '#f56c6c'
      } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(type)) {
        return '#409eff'
      } else {
        return '#909399'
      }
    }
    
    const getFileTypeTagType = (fileType) => {
      if (!fileType) return 'info'
      
      const type = fileType.toLowerCase()
      
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(type)) {
        return 'success'
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
        return 'warning'
      } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(type)) {
        return 'danger'
      } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(type)) {
        return 'primary'
      } else {
        return 'info'
      }
    }
    
    const getAttachmentTypeText = (type) => {
      const typeMap = {
        'photo': t('issueDetail.attachments.attachmentTypes.photo'),
        'document': t('issueDetail.attachments.attachmentTypes.document'),
        'video': t('issueDetail.attachments.attachmentTypes.video'),
        'audio': t('issueDetail.attachments.attachmentTypes.audio')
      }
      return typeMap[type?.toLowerCase()] || type || t('issueDetail.attachments.attachmentTypes.file')
    }
    
    const canPreview = (attachment) => {
      return isImageFile(attachment) || isTextFile(attachment)
    }
    
    const isImageFile = (attachment) => {
      if (!attachment?.fileType) return false
      const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']
      return imageTypes.includes(attachment.fileType.toLowerCase())
    }
    
    const isTextFile = (attachment) => {
      if (!attachment?.fileType) return false
      const textTypes = ['txt', 'json', 'xml', 'csv', 'log']
      return textTypes.includes(attachment.fileType.toLowerCase())
    }
    
    // 监听props变化
    watch(() => [props.projectId, props.issueId], () => {
      if (props.autoLoad && props.projectId && props.issueId) {
        loadAttachments()
      }
    }, { immediate: false })
    
    // 组件挂载时自动加载
    onMounted(() => {
      if (props.autoLoad) {
        loadAttachments()
      }
    })
    
    return {
      // i18n
      t,
      
      // 响应式数据
      loading,
      error,
      attachments,
      downloadingIds,
      showPreviewDialog,
      currentPreviewAttachment,
      previewUrl,
      previewContent,
      totalSize,
      
      // 图标
      Paperclip,
      Refresh,
      Download,
      View,
      User,
      Clock,
      CopyDocument,
      Document,
      Picture,
      VideoCamera,
      Headset,
      Files,
      FolderOpened,
      
      // 方法
      loadAttachments,
      downloadAttachment,
      previewAttachment,
      handleClosePreview,
      copyAttachmentInfo,
      exportAttachments,
      getUserName,
      formatDateTime,
      formatFileSize,
      getFileTypeIcon,
      getFileTypeColor,
      getFileTypeTagType,
      getAttachmentTypeText,
      canPreview,
      isImageFile,
      isTextFile
    }
  }
}
</script>

<style scoped>
.issue-attachments {
  padding: 0;
}

.loading-container {
  padding: 20px;
}

.empty-description {
  color: #909399;
  font-size: 14px;
}

.attachments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.attachments-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #495057;
}

.attachments-actions {
  display: flex;
  gap: 8px;
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.attachment-item {
  width: 100%;
}

.attachment-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.attachment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.attachment-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.attachment-icon {
  flex-shrink: 0;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 6px;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.attachment-type {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.attachment-details {
  flex: 1;
  margin-bottom: 12px;
}

.file-name {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  background: #f1f3f4;
  padding: 2px 4px;
  border-radius: 2px;
  word-break: break-all;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.attachment-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}

.attachment-debug {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.urn-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
  background: #f1f3f4;
  padding: 2px 4px;
  border-radius: 2px;
  word-break: break-all;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.error-actions {
  margin-top: 8px;
}

/* 预览对话框样式 */
.preview-container {
  max-height: 70vh;
  overflow: auto;
}

.image-preview {
  text-align: center;
  padding: 20px;
}

.text-preview {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.text-content {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #495057;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}

.unsupported-preview {
  padding: 40px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .attachments-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .attachments-actions {
    justify-content: center;
  }
  
  .attachments-grid {
    grid-template-columns: 1fr;
  }
  
  .attachment-actions {
    justify-content: center;
  }
}

/* 动画效果 */
.attachment-item {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
  color: #6c757d;
}

:deep(.el-descriptions__content) {
  color: #495057;
}
</style>
