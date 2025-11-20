<template>
  <div class="issue-markups-panel">
    <!-- 头部工具栏 -->
    <div class="markups-header">
      <div class="header-left">
        <el-icon class="header-icon"><Edit /></el-icon>
        <span class="header-title">图纸标记 ({{ totalMarkups }})</span>
      </div>
      <div class="header-actions">
        <el-button 
          @click="refreshMarkups" 
          :loading="loading" 
          size="small"
          type="primary">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button 
          @click="exportMarkups" 
          size="small"
          :disabled="markupsByDocument.length === 0">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 错误状态 -->
    <el-alert
      v-else-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      style="margin: 16px 0;">
      <template #default>
        <el-button @click="refreshMarkups" size="small" type="primary">重试</el-button>
      </template>
    </el-alert>

    <!-- 空状态 -->
    <el-empty 
      v-else-if="markupsByDocument.length === 0"
      description="No drawing markups"
      :image-size="100">
      <template #description>
        <span class="empty-description">此项目暂无图纸标记数据</span>
      </template>
    </el-empty>

    <!-- 按文档分组的标记列表 -->
    <div v-else class="markups-content">
      <!-- 统计信息 -->
      <div class="markups-stats">
        <el-card shadow="hover">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">📄</div>
              <div class="stat-info">
                <div class="stat-value">{{ markupsByDocument.length }}</div>
                <div class="stat-label">关联文档</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">✏️</div>
              <div class="stat-info">
                <div class="stat-value">{{ totalMarkups }}</div>
                <div class="stat-label">总标记数</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🔓</div>
              <div class="stat-info">
                <div class="stat-value">{{ statusCounts.open || 0 }}</div>
                <div class="stat-label">开放标记</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">📌</div>
              <div class="stat-info">
                <div class="stat-value">{{ statusCounts.published || 0 }}</div>
                <div class="stat-label">已发布</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 文档分组列表 -->
      <div class="documents-list">
        <el-collapse v-model="expandedDocuments" accordion>
          <el-collapse-item 
            v-for="(docGroup, index) in markupsByDocument" 
            :key="docGroup.documentUrn"
            :name="docGroup.documentUrn"
            class="document-group">
            <!-- 文档头部 -->
            <template #title>
              <div class="document-header">
                <el-icon class="document-icon" :size="20"><Document /></el-icon>
                <div class="document-info">
                  <div class="document-name">{{ docGroup.documentName }}</div>
                  <div class="document-meta">
                    <el-tag size="small" type="info">
                      {{ docGroup.markups.length }} 个标记
                    </el-tag>
                    <span class="document-urn">URN: {{ formatUrn(docGroup.documentUrn) }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 标记列表 -->
            <div class="markups-list">
              <div 
                v-for="markup in docGroup.markups" 
                :key="markup.id"
                class="markup-item">
                <el-card shadow="hover" class="markup-card">
                  <!-- 标记头部 -->
                  <div class="markup-header">
                    <div class="markup-title-section">
                      <el-icon class="markup-icon"><EditPen /></el-icon>
                      <span class="markup-title">
                        {{ markup.attributes?.description || `Markup ${markup.id.substring(0, 8)}` }}
                      </span>
                    </div>
                    <div class="markup-status">
                      <el-tag 
                        :type="getStatusType(markup.attributes?.status)" 
                        size="small">
                        {{ getStatusText(markup.attributes?.status) }}
                      </el-tag>
                    </div>
                  </div>

                  <!-- 标记详情 -->
                  <div class="markup-details">
                    <el-descriptions :column="2" size="small" border>
                      <!-- 创建信息 -->
                      <el-descriptions-item label="Creator">
                        <div class="user-info">
                          <el-icon><User /></el-icon>
                          <span>{{ formatUserId(markup.attributes?.created_by) }}</span>
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="Created Time">
                        <div class="time-info">
                          <el-icon><Clock /></el-icon>
                          <span>{{ formatDateTime(markup.attributes?.created_at) }}</span>
                        </div>
                      </el-descriptions-item>

                      <!-- 更新信息 -->
                      <el-descriptions-item label="Last Updated">
                        <div class="time-info">
                          <el-icon><Clock /></el-icon>
                          <span>{{ formatDateTime(markup.attributes?.updated_at) }}</span>
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="Sync Time">
                        <div class="time-info">
                          <el-icon><Refresh /></el-icon>
                          <span>{{ formatDateTime(markup.attributes?.synced_at) }}</span>
                        </div>
                      </el-descriptions-item>

                      <!-- 版本信息 -->
                      <el-descriptions-item label="Starting Version" v-if="markup.attributes?.starting_version">
                        <el-tag type="info" size="small">
                          v{{ markup.attributes.starting_version }}
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="Close Version" v-if="markup.attributes?.close_version">
                        <el-tag type="warning" size="small">
                          v{{ markup.attributes.close_version }}
                        </el-tag>
                      </el-descriptions-item>

                      <!-- 页面信息 -->
                      <el-descriptions-item 
                        label="Target Page" 
                        v-if="markup.attributes?.target_urn_page"
                        :span="2">
                        <code class="page-info">{{ markup.attributes.target_urn_page }}</code>
                      </el-descriptions-item>

                      <!-- 标记ID -->
                      <el-descriptions-item label="标记ID" :span="2">
                        <code class="markup-id">{{ markup.id }}</code>
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>

                  <!-- 标记元数据 -->
                  <div 
                    v-if="markup.attributes?.markup_metadata" 
                    class="markup-metadata">
                    <div class="metadata-title">
                      <el-icon><InfoFilled /></el-icon>
                      <span>标记元数据</span>
                    </div>
                    <pre class="metadata-content">{{ formatJson(markup.attributes.markup_metadata) }}</pre>
                  </div>

                  <!-- 标签 -->
                  <div 
                    v-if="markup.attributes?.tags && markup.attributes.tags.length > 0" 
                    class="markup-tags">
                    <div class="tags-title">标签:</div>
                    <el-tag 
                      v-for="(tag, tagIndex) in markup.attributes.tags" 
                      :key="tagIndex"
                      type="info" 
                      size="small"
                      class="tag-item">
                      {{ tag }}
                    </el-tag>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="markup-actions">
                    <el-button 
                      size="small" 
                      text 
                      type="primary"
                      @click="viewMarkupDetails(markup)">
                      <el-icon><View /></el-icon>
                      查看详情
                    </el-button>
                    <el-button 
                      size="small" 
                      text 
                      type="primary"
                      @click="copyMarkupId(markup.id)">
                      <el-icon><CopyDocument /></el-icon>
                      复制ID
                    </el-button>
                  </div>
                </el-card>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <!-- 标记详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="标记详细信息"
      width="70%"
      draggable
      destroy-on-close>
      <div v-if="selectedMarkup" class="markup-detail-dialog">
        <JsonViewer 
          :data="selectedMarkup"
          title="标记完整数据"
          :max-height="500" />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import JsonViewer from './JsonViewer.vue'

// 图标导入
import {
  Edit,
  Refresh,
  Download,
  Document,
  EditPen,
  User,
  Clock,
  InfoFilled,
  View,
  CopyDocument
} from '@element-plus/icons-vue'

export default {
  name: 'IssueMarkupsPanel',
  components: {
    JsonViewer
  },
  props: {
    containerId: {
      type: String,
      required: true
    },
    autoLoad: {
      type: Boolean,
      default: false  // 🔧 改为默认不自动加载
    },
    // 可选：如果有议题，可以按议题过滤
    issueId: {
      type: String,
      default: null
    }
  },
  emits: ['markups-loaded', 'markups-error'],
  setup(props, { emit }) {
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const allMarkups = ref([])
    const expandedDocuments = ref([])
    const showDetailDialog = ref(false)
    const selectedMarkup = ref(null)

    // 按文档分组的标记
    const markupsByDocument = computed(() => {
      if (allMarkups.value.length === 0) return []

      // 按 target_urn 分组
      const grouped = {}
      
      allMarkups.value.forEach(markup => {
        const targetUrn = markup.attributes?.target_urn || 'unknown'
        
        if (!grouped[targetUrn]) {
          grouped[targetUrn] = {
            documentUrn: targetUrn,
            documentName: extractDocumentName(targetUrn),
            markups: []
          }
        }
        
        grouped[targetUrn].markups.push(markup)
      })

      // 转换为数组并排序
      return Object.values(grouped).sort((a, b) => {
        return b.markups.length - a.markups.length // 按标记数量降序
      })
    })

    // 总标记数
    const totalMarkups = computed(() => allMarkups.value.length)

    // 状态统计
    const statusCounts = computed(() => {
      const counts = {}
      allMarkups.value.forEach(markup => {
        const status = markup.attributes?.status || 'unknown'
        counts[status] = (counts[status] || 0) + 1
      })
      return counts
    })

    // 加载标记数据
    const loadMarkups = async () => {
      if (!props.containerId) {
        error.value = '缺少容器ID'
        return
      }

      loading.value = true
      error.value = ''

      try {
        console.log(`加载Markups: ${props.containerId}`)

        const response = await axios.get(
          `/api/issues/containers/${props.containerId}/markups`,
          {
            timeout: 30000,
            params: {
              limit: 100,
              sort: '-created_at'
            }
          }
        )

        if (response.data.status === 'success') {
          const markupsData = response.data.data.data || []
          allMarkups.value = markupsData
          
          // 默认展开第一个文档
          if (markupsByDocument.value.length > 0) {
            expandedDocuments.value = [markupsByDocument.value[0].documentUrn]
          }

          console.log(`Markups加载成功: ${markupsData.length} 个`)
          emit('markups-loaded', markupsData)
          
          if (markupsData.length > 0) {
            ElMessage.success(`加载了 ${markupsData.length} 个标记`)
          }
        } else {
          throw new Error(response.data.error || '加载标记失败')
        }
      } catch (err) {
        console.error('加载标记失败:', err)
        
        // 提供更详细的错误信息
        let errorMessage = '加载标记失败'
        if (err.response?.status === 404) {
          errorMessage = `标记容器不存在 (容器ID: ${props.containerId})。这可能是因为：
1. 项目中没有创建任何标记
2. 项目类型不支持标记功能
3. 容器ID不正确
4. 权限不足`
        } else {
          errorMessage = err.response?.data?.error || err.message || '加载标记失败'
        }
        
        error.value = errorMessage
        emit('markups-error', errorMessage)
        ElMessage.error(errorMessage)
      } finally {
        loading.value = false
      }
    }

    // 刷新标记
    const refreshMarkups = () => {
      loadMarkups()
    }

    // 导出标记
    const exportMarkups = () => {
      if (allMarkups.value.length === 0) {
        ElMessage.warning('没有标记可以导出')
        return
      }

      try {
        const exportData = {
          container_id: props.containerId,
          total_markups: allMarkups.value.length,
          documents: markupsByDocument.value.map(doc => ({
            document_urn: doc.documentUrn,
            document_name: doc.documentName,
            markups_count: doc.markups.length,
            markups: doc.markups
          })),
          exported_at: new Date().toISOString()
        }

        const dataStr = JSON.stringify(exportData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `markups-${props.containerId}-${Date.now()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        ElMessage.success('标记数据导出成功')
      } catch (err) {
        console.error('导出失败:', err)
        ElMessage.error('导出失败')
      }
    }

    // 查看标记详情
    const viewMarkupDetails = (markup) => {
      selectedMarkup.value = markup
      showDetailDialog.value = true
    }

    // 复制标记ID
    const copyMarkupId = async (markupId) => {
      try {
        await navigator.clipboard.writeText(markupId)
        ElMessage.success('标记ID已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
        ElMessage.error('复制失败')
      }
    }

    // 工具函数
    const extractDocumentName = (urn) => {
      if (!urn) return '未知文档'
      
      // 尝试从URN中提取文档名称
      // URN格式通常是: urn:adsk.wipprod:dm.lineage:xxxxx
      const parts = urn.split(':')
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1]
        return `文档 ${lastPart.substring(0, 8)}...`
      }
      
      return urn.substring(0, 30) + '...'
    }

    const formatUrn = (urn) => {
      if (!urn) return 'N/A'
      if (urn.length > 50) {
        return urn.substring(0, 50) + '...'
      }
      return urn
    }

    const formatUserId = (userId) => {
      if (!userId) return '未知用户'
      if (userId.length > 20) {
        return userId.substring(0, 20) + '...'
      }
      return userId
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return 'N/A'
      
      try {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
        const diffMinutes = Math.floor(diffTime / (1000 * 60))

        // 相对时间显示
        if (diffMinutes < 1) {
          return '刚刚'
        } else if (diffMinutes < 60) {
          return `${diffMinutes}分钟前`
        } else if (diffHours < 24) {
          return `${diffHours}小时前`
        } else if (diffDays < 7) {
          return `${diffDays}天前`
        } else {
          return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      } catch (error) {
        return dateString
      }
    }

    const getStatusType = (status) => {
      const statusMap = {
        'open': 'success',
        'published': 'primary',
        'archived': 'info',
        'private': 'warning'
      }
      return statusMap[status?.toLowerCase()] || 'default'
    }

    const getStatusText = (status) => {
      const statusMap = {
        'open': 'Open',
        'published': '已发布',
        'archived': '已归档',
        'private': '私有'
      }
      return statusMap[status?.toLowerCase()] || status || '未知'
    }

    const formatJson = (obj) => {
      try {
        return JSON.stringify(obj, null, 2)
      } catch {
        return String(obj)
      }
    }

    // 🔧 修改：移除自动加载逻辑
    // 监听props变化 - 仅在明确启用autoLoad时才自动加载
    watch(() => props.containerId, (newId) => {
      if (newId && props.autoLoad) {
        loadMarkups()
      }
    })

    // 🔧 修改：组件挂载时不自动加载
    onMounted(() => {
      // 移除自动加载逻辑
      console.log('IssueMarkupsPanel mounted, autoLoad:', props.autoLoad)
    })

    return {
      // 响应式数据
      loading,
      error,
      allMarkups,
      markupsByDocument,
      totalMarkups,
      statusCounts,
      expandedDocuments,
      showDetailDialog,
      selectedMarkup,

      // 图标
      Edit,
      Refresh,
      Download,
      Document,
      EditPen,
      User,
      Clock,
      InfoFilled,
      View,
      CopyDocument,

      // 方法
      loadMarkups,
      refreshMarkups,
      exportMarkups,
      viewMarkupDetails,
      copyMarkupId,
      extractDocumentName,
      formatUrn,
      formatUserId,
      formatDateTime,
      getStatusType,
      getStatusText,
      formatJson
    }
  }
}
</script>

<style scoped>
.issue-markups-panel {
  padding: 0;
}

/* 头部 */
.markups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 24px;
  color: #409eff;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 加载和错误状态 */
.loading-container {
  padding: 20px;
}

.empty-description {
  color: #909399;
  font-size: 14px;
}

/* 统计信息 */
.markups-stats {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

/* 文档列表 */
.documents-list {
  margin-top: 20px;
}

.document-group {
  margin-bottom: 16px;
}

.document-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding-right: 20px;
}

.document-icon {
  color: #409eff;
  flex-shrink: 0;
}

.document-info {
  flex: 1;
  min-width: 0;
}

.document-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.document-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.document-urn {
  font-size: 11px;
  color: #909399;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* 标记列表 */
.markups-list {
  padding: 16px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.markup-item {
  width: 100%;
}

.markup-card {
  transition: all 0.3s ease;
}

.markup-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 标记头部 */
.markup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.markup-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.markup-icon {
  color: #67c23a;
  font-size: 18px;
}

.markup-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.markup-status {
  flex-shrink: 0;
}

/* 标记详情 */
.markup-details {
  margin-bottom: 16px;
}

.user-info,
.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.markup-id,
.page-info {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #606266;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  word-break: break-all;
}

/* 标记元数据 */
.markup-metadata {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.metadata-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.metadata-content {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #606266;
  margin: 0;
  overflow-x: auto;
  max-height: 200px;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

/* 标签 */
.markup-tags {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tags-title {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.tag-item {
  cursor: default;
}

/* 操作按钮 */
.markup-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 8px;
}

/* 详情对话框 */
.markup-detail-dialog {
  padding: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .markups-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .document-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .markup-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-collapse-item__header) {
  font-weight: 500;
  padding: 12px 16px;
  background: #fafafa;
}

:deep(.el-collapse-item__header:hover) {
  background: #f5f7fa;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  color: #606266;
}

:deep(.el-descriptions__content) {
  color: #303133;
}
</style>

