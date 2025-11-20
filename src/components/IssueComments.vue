<template>
  <div class="issue-comments">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
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
          <el-button @click="loadComments" size="small" type="primary">{{ t('common.retry') }}</el-button>
        </div>
      </template>
    </el-alert>
    
    <!-- 空状态 -->
    <el-empty 
      v-if="!loading && !error && comments.length === 0"
      :description="t('issueDetail.comments.noComments')"
      :image-size="80">
      <template #description>
        <span class="empty-description">{{ t('issueDetail.comments.noCommentsForIssue') }}</span>
      </template>
    </el-empty>
    
    <!-- 留言列表 -->
    <div v-if="!loading && !error && comments.length > 0" class="comments-list">
      <!-- 留言统计 -->
      <div class="comments-header">
        <div class="comments-count">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ t('issueDetail.comments.totalComments', { count: comments.length }) }}</span>
        </div>
        <div class="comments-actions">
          <el-button @click="loadComments" :loading="loading" size="small">
            <el-icon><Refresh /></el-icon>
            {{ t('common.refresh') }}
          </el-button>
          <el-button @click="exportComments" size="small" type="default">
            <el-icon><Download /></el-icon>
            {{ t('common.export') }}
          </el-button>
        </div>
      </div>
      
      <!-- 留言项 -->
      <div class="comments-container">
        <div 
          v-for="(comment, index) in comments" 
          :key="comment.id || index"
          class="comment-item">
          <el-card shadow="hover" class="comment-card">
            <!-- 留言头部 -->
            <div class="comment-header">
              <div class="comment-author">
                <el-avatar 
                  :size="32" 
                  :src="getUserAvatar(comment.createdBy)"
                  class="author-avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <div class="author-info">
                  <div class="author-name">{{ getUserName(comment.createdBy) }}</div>
                  <div class="author-id">{{ comment.createdBy }}</div>
                </div>
              </div>
              <div class="comment-meta">
                <div class="comment-time">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatDateTime(comment.createdAt) }}</span>
                </div>
                <div class="comment-actions">
                  <el-button 
                    @click="copyComment(comment)" 
                    size="small" 
                    text 
                    type="primary">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            
            <!-- 留言内容 -->
            <div class="comment-content">
              <div 
                class="comment-body" 
                v-html="formatCommentBody(comment.body)">
              </div>
            </div>
            
            <!-- 留言ID（调试用） -->
            <div v-if="showDebugInfo" class="comment-debug">
              <el-tag size="small" type="info">ID: {{ comment.id }}</el-tag>
            </div>
          </el-card>
        </div>
      </div>
      
      <!-- 分页 -->
      <div v-if="pagination.total > pagination.limit" class="comments-pagination">
        <el-pagination
          v-model:current-page="pagination.offset"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import userCache from '../utils/userCache.js'
import { formatDateTime } from '../utils/dateUtils.js'

// 图标导入
import {
  ChatDotRound,
  Refresh,
  Download,
  User,
  Clock,
  CopyDocument
} from '@element-plus/icons-vue'

export default {
  name: 'IssueComments',
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
  emits: ['comments-loaded', 'comments-error'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const comments = ref([])
    const pagination = reactive({
      offset: 1,
      limit: 20,
      total: 0
    })
    
    // 加载留言
    const loadComments = async () => {
      if (!props.projectId || !props.issueId) {
        error.value = t('issueDetail.comments.missingIds')
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        console.log(`加载议题留言: ${props.issueId}`)
        
        const response = await axios.get(
          `/api/issues/projects/${props.projectId}/issues/${props.issueId}/comments`,
          {
            timeout: 15000,
            params: {
              limit: pagination.limit,
              offset: (pagination.offset - 1) * pagination.limit
            }
          }
        )
        
        if (response.data.status === 'success') {
          const commentsData = response.data.data.results || []
          comments.value = commentsData
          
          // 更新分页信息
          pagination.total = response.data.data.total || commentsData.length
          
          console.log(`留言加载成功: ${commentsData.length} 条`)
          emit('comments-loaded', commentsData)
          
          if (commentsData.length === 0) {
            // 不显示消息，让空状态组件处理
          } else {
            ElMessage.success(t('issueDetail.comments.loadSuccess', { count: commentsData.length }))
          }
        } else {
          throw new Error(response.data.error || t('issueDetail.comments.loadFailed'))
        }
      } catch (err) {
        console.error('加载留言失败:', err)
        error.value = err.response?.data?.error || err.message || t('issueDetail.comments.loadFailed')
        emit('comments-error', error.value)
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }
    
    // 格式化留言内容
    const formatCommentBody = (body) => {
      if (!body) return ''
      
      // 简单的文本格式化
      let formatted = body
        .replace(/\n/g, '<br>')  // 换行符转换为<br>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **粗体**
        .replace(/\*(.*?)\*/g, '<em>$1</em>')  // *斜体*
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')  // 链接
      
      return formatted
    }
    
    // 获取用户名
    const getUserName = (userId) => {
      if (!userId) return t('issueDetail.comments.unknownUser')
      
      // 使用用户缓存获取用户显示名称
      const displayName = userCache.getUserDisplayName(userId, props.projectId)
      if (displayName && displayName !== userId) {
        return displayName
      }
      
      // 如果缓存中没有找到，使用原有逻辑
      // 如果是邮箱，提取用户名部分
      if (userId.includes('@')) {
        return userId.split('@')[0]
      }
      
      // 如果是长ID，截取前面部分
      if (userId.length > 20) {
        return userId.substring(0, 20) + '...'
      }
      
      return userId
    }
    
    // 获取用户头像
    const getUserAvatar = (userId) => {
      // 这里可以实现头像逻辑，暂时返回null使用默认头像
      return null
    }
    
    // 使用导入的formatDateTime函数
    
    // 复制留言
    const copyComment = async (comment) => {
      try {
        const text = `${getUserName(comment.createdBy)} (${formatDateTime(comment.createdAt)}):\n${comment.body}`
        await navigator.clipboard.writeText(text)
        ElMessage.success(t('issueDetail.comments.copySuccess'))
      } catch (error) {
        console.error('复制失败:', error)
        ElMessage.error(t('common.copyFailed'))
      }
    }
    
    // 导出留言
    const exportComments = () => {
      if (comments.value.length === 0) {
        ElMessage.warning(t('issueDetail.comments.noCommentsToExport'))
        return
      }
      
      try {
        const dataStr = JSON.stringify(comments.value, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `issue-${props.issueId}-comments-${Date.now()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        ElMessage.success(t('issueDetail.comments.exportSuccess'))
      } catch (err) {
        console.error('导出失败:', err)
        ElMessage.error(t('issueDetail.comments.exportFailed'))
      }
    }
    
    // 分页处理
    const handleSizeChange = (newSize) => {
      pagination.limit = newSize
      pagination.offset = 1
      loadComments()
    }
    
    const handleCurrentChange = (newPage) => {
      pagination.offset = newPage
      loadComments()
    }
    
    // 监听props变化
    watch(() => [props.projectId, props.issueId], () => {
      if (props.autoLoad && props.projectId && props.issueId) {
        loadComments()
      }
    }, { immediate: false })
    
    // 组件挂载时自动加载
    onMounted(() => {
      if (props.autoLoad) {
        loadComments()
      }
    })
    
    return {
      // i18n
      t,
      
      // 响应式数据
      loading,
      error,
      comments,
      pagination,
      
      // 图标
      ChatDotRound,
      Refresh,
      Download,
      User,
      Clock,
      CopyDocument,
      
      // 方法
      loadComments,
      formatCommentBody,
      getUserName,
      getUserAvatar,
      formatDateTime,
      copyComment,
      exportComments,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.issue-comments {
  padding: 0;
}

.loading-container {
  padding: 20px;
}

.empty-description {
  color: #909399;
  font-size: 14px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.comments-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #495057;
}

.comments-actions {
  display: flex;
  gap: 8px;
}

.comments-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  width: 100%;
}

.comment-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.comment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  flex-shrink: 0;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.author-id {
  font-size: 11px;
  color: #6c757d;
  font-family: 'Consolas', 'Monaco', monospace;
}

.comment-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.comment-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6c757d;
}

.comment-actions {
  display: flex;
  gap: 4px;
}

.comment-content {
  padding: 12px 0;
}

.comment-body {
  line-height: 1.6;
  color: #495057;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.comment-body :deep(a) {
  color: #007bff;
  text-decoration: none;
}

.comment-body :deep(a:hover) {
  text-decoration: underline;
}

.comment-body :deep(strong) {
  font-weight: 600;
}

.comment-body :deep(em) {
  font-style: italic;
}

.comment-debug {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
}

.comments-pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.error-actions {
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comments-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .comments-actions {
    justify-content: center;
  }
  
  .comment-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .comment-meta {
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  
  .author-info {
    flex: 1;
  }
}

/* 动画效果 */
.comment-item {
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
</style>
