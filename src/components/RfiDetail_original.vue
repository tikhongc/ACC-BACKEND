<template>
  <div class="rfi-detail">
    
    <!-- 標籤頁設計 -->
    <el-tabs v-model="activeTab" type="card" class="rfi-tabs">
      
      <!-- basicInfo標籤頁 -->
      <el-tab-pane label="basicInfo" name="basic">
        <!-- RFI basicInfo -->
        <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-file />
            RFI basicInfo
          </span>
          <div class="header-tags">
            <StatusTag 
              :status="rfi.status_type" 
              :text="rfi.status" 
              size="default" />
            <StatusTag 
              :status="rfi.priority_type" 
              :text="rfi.priority || 'Normal'" 
              size="default" />
          </div>
        </div>
      </template>
      
      <div class="info-grid">
        <div class="info-item">
          <label>RFI ID:</label>
          <span>{{ rfi.id }}</span>
        </div>
        <div class="info-item" v-if="rfi.custom_identifier">
          <label>自定義編號:</label>
          <span>{{ rfi.custom_identifier }}</span>
        </div>
        <div class="info-item" v-if="rfi.display_id">
          <label>顯示編號:</label>
          <span>{{ rfi.display_id }}</span>
        </div>
        <div class="info-item full-width">
          <label>標題:</label>
          <span class="title-text">{{ rfi.title }}</span>
        </div>
        <div class="info-item full-width" v-if="rfi.description">
          <label>描述:</label>
          <div class="description-text">{{ rfi.description }}</div>
        </div>
      </div>
    </el-card>

    <!-- RFI 問題和建議答案 -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-question />
            問題詳情
          </span>
        </div>
      </template>
      
      <div class="question-content">
        <div class="question-section">
          <h4>問題內容:</h4>
          <div class="question-text">{{ rfi.question || '無問題內容' }}</div>
        </div>
        
        <div class="answer-section" v-if="rfi.suggested_answer">
          <h4>建議答案:</h4>
          <div class="answer-text">{{ rfi.suggested_answer }}</div>
        </div>

        <div class="response-section" v-if="rfi.has_response">
          <h4>官方回覆:</h4>
          <div class="response-text">{{ rfi.official_response }}</div>
          <div class="response-meta" v-if="rfi.responded_at">
            <span>回覆時間: {{ rfi.responded_at }}</span>
            <span v-if="rfi.responded_by?.name">回覆人: {{ rfi.responded_by.name }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 分類和屬性 -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-apps />
            分類和屬性
          </span>
        </div>
      </template>
      
      <div class="info-grid">
        <div class="info-item">
          <label>專業領域:</label>
          <span>{{ rfi.discipline || '未指定' }}</span>
        </div>
        <div class="info-item">
          <label>類別:</label>
          <span>{{ rfi.category || '未指定' }}</span>
        </div>
        <div class="info-item">
          <label>工作流類型:</label>
          <span>{{ rfi.workflow_type || '未指定' }}</span>
        </div>
        <div class="info-item">
          <label>自定義屬性:</label>
          <span>{{ rfi.custom_attributes_count }} 個</span>
        </div>
      </div>

      <!-- 自定義屬性詳情 -->
      <div v-if="rfi.custom_attributes && rfi.custom_attributes.length > 0" class="custom-attributes">
        <h4>自定義屬性詳情:</h4>
        <div class="attributes-list">
          <div 
            v-for="(attr, index) in rfi.custom_attributes" 
            :key="index"
            class="attribute-item">
            <span class="attr-name">{{ attr.name || `屬性 ${index + 1}` }}:</span>
            <span class="attr-value">{{ attr.value || '無值' }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 影響評估 -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-exclamation-circle />
            影響評估
          </span>
        </div>
      </template>
      
      <div class="impact-assessment">
        <div class="impact-item">
          <label>成本影響:</label>
          <StatusTag 
            :status="rfi.impact_analysis?.has_cost_impact ? 'danger' : 'success'" 
            :text="rfi.cost_impact || 'Unknown'" 
            size="default" />
        </div>
        <div class="impact-item">
          <label>時程影響:</label>
          <StatusTag 
            :status="rfi.impact_analysis?.has_schedule_impact ? 'danger' : 'success'" 
            :text="rfi.schedule_impact || 'Unknown'" 
            size="default" />
        </div>
        <div class="impact-item">
          <label>整體影響等級:</label>
          <StatusTag 
            :status="rfi.impact_analysis?.overall_impact === 'high' ? 'danger' : 'success'" 
            :text="rfi.impact_analysis?.overall_impact === 'high' ? '高影響' : '低影響'" 
            size="default" />
        </div>
      </div>
    </el-card>

    <!-- 人員和時間信息 -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-user />
            人員和時間信息
          </span>
        </div>
      </template>
      
      <div class="people-time-grid">
        <!-- 人員信息 -->
        <div class="people-section">
          <h4>相關人員:</h4>
          <div class="people-list">
            <div class="person-item" v-if="rfi.created_by?.name">
              <span class="person-role">創建人:</span>
              <span class="person-name">{{ rfi.created_by.name }}</span>
              <span class="person-email" v-if="rfi.created_by.email">({{ rfi.created_by.email }})</span>
            </div>
            <div class="person-item" v-if="rfi.assigned_to?.name">
              <span class="person-role">指派給:</span>
              <span class="person-name">{{ rfi.assigned_to.name }}</span>
              <span class="person-type">({{ rfi.assigned_to_type }})</span>
            </div>
            <div class="person-item" v-if="rfi.updated_by?.name">
              <span class="person-role">最後更新:</span>
              <span class="person-name">{{ rfi.updated_by.name }}</span>
            </div>
            <div class="person-item" v-if="rfi.closed_by?.name">
              <span class="person-role">關閉人:</span>
              <span class="person-name">{{ rfi.closed_by.name }}</span>
            </div>
          </div>
        </div>

        <!-- 時間信息 -->
        <div class="time-section">
          <h4>時間節點:</h4>
          <div class="time-list">
            <div class="time-item" v-if="rfi.created_at">
              <span class="time-label">創建時間:</span>
              <span class="time-value">{{ rfi.created_at }}</span>
            </div>
            <div class="time-item" v-if="rfi.start_date">
              <span class="time-label">開始日期:</span>
              <span class="time-value">{{ rfi.start_date }}</span>
            </div>
            <div class="time-item" v-if="rfi.due_date">
              <span class="time-label">到期日期:</span>
              <span class="time-value" :class="{ 'overdue': rfi.is_overdue }">
                {{ rfi.due_date }}
                <el-tag v-if="rfi.is_overdue" type="danger" size="small">已逾期</el-tag>
              </span>
            </div>
            <div class="time-item" v-if="rfi.updated_at">
              <span class="time-label">更新時間:</span>
              <span class="time-value">{{ rfi.updated_at }}</span>
            </div>
            <div class="time-item" v-if="rfi.closed_at">
              <span class="time-label">關閉時間:</span>
              <span class="time-value">{{ rfi.closed_at }}</span>
            </div>
            <div class="time-item" v-if="rfi.responded_at">
              <span class="time-label">回覆時間:</span>
              <span class="time-value">{{ rfi.responded_at }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 位置和關聯信息 -->
    <el-card class="info-card" shadow="never" v-if="rfi.location_description || rfi.linked_document || rfi.locations?.length > 0">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-location />
            位置和關聯信息
          </span>
        </div>
      </template>
      
      <div class="location-info">
        <div class="location-item" v-if="rfi.location_description">
          <label>位置描述:</label>
          <span>{{ rfi.location_description }}</span>
        </div>
        <div class="location-item" v-if="rfi.linked_document">
          <label>關聯文件:</label>
          <span class="document-link">{{ rfi.linked_document }}</span>
        </div>
        <div class="location-item" v-if="rfi.locations && rfi.locations.length > 0">
          <label>結構化位置:</label>
          <div class="locations-list">
            <el-tag 
              v-for="(location, index) in rfi.locations" 
              :key="index"
              type="info" 
              size="small"
              style="margin: 2px;">
              {{ location.name || `位置 ${index + 1}` }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- RFI 工作流進度 -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-branch />
            工作流進度
          </span>
        </div>
      </template>
      
      <RfiWorkflowProgress :rfi="rfi" :project="project" />
    </el-card>

    <!-- 附件和評論統計 -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-folder />
            附件和評論
          </span>
          <div class="header-actions">
            <el-button 
              v-if="rfi.has_attachments"
              type="primary" 
              size="small"
              @click="loadAttachments">
              查看附件 ({{ rfi.attachments_count }})
            </el-button>
            <el-button 
              v-if="rfi.has_comments"
              type="info" 
              size="small"
              @click="loadComments">
              查看評論 ({{ rfi.comments_count }})
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="attachments-comments-info">
        <div class="info-item">
          <label>附件數量:</label>
          <span>{{ rfi.attachments_count }} 個</span>
        </div>
        <div class="info-item">
          <label>評論數量:</label>
          <span>{{ rfi.comments_count }} 個</span>
        </div>
        <div class="info-item">
          <label>有附件:</label>
          <StatusTag 
            :status="rfi.has_attachments ? 'success' : 'info'" 
            :text="rfi.has_attachments ? '是' : '否'" 
            size="small" />
        </div>
        <div class="info-item">
          <label>有評論:</label>
          <StatusTag 
            :status="rfi.has_comments ? 'success' : 'info'" 
            :text="rfi.has_comments ? '是' : '否'" 
            size="small" />
        </div>
      </div>

      <!-- 附件列表 -->
      <div v-if="attachments && attachments.length > 0" class="attachments-section">
        <h4>附件列表:</h4>
        <div class="attachments-list">
          <div 
            v-for="attachment in attachments" 
            :key="attachment.id"
            class="attachment-item">
            <div class="attachment-info">
              <span class="attachment-name">{{ attachment.name }}</span>
              <span class="attachment-type">{{ attachment.file_type }}</span>
              <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
            </div>
            <div class="attachment-meta">
              <span>創建: {{ attachment.created_time }}</span>
              <span v-if="attachment.created_by">by {{ attachment.created_by }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 評論列表 -->
      <div v-if="comments && comments.length > 0" class="comments-section">
        <h4>評論列表:</h4>
        <div class="comments-list">
          <div 
            v-for="comment in comments" 
            :key="comment.id"
            class="comment-item">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author?.name || '未知用戶' }}</span>
              <span class="comment-time">{{ comment.created_at }}</span>
              <el-tag v-if="comment.is_draft" type="warning" size="small">草稿</el-tag>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 原始數據 -->
    <el-card class="info-card" shadow="never" v-if="showRawData">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-code />
            原始數據
          </span>
          <el-button 
            type="text" 
            size="small"
            @click="showRawData = false">
            隱藏
          </el-button>
        </div>
      </template>
      
      <div class="raw-data">
        <pre>{{ JSON.stringify(rfi.raw_data, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- RFI 配置信息 -->
    <el-card class="info-card" shadow="never" v-if="showConfigPanel">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-settings />
            RFI 配置信息
          </span>
          <el-button 
            type="text" 
            size="small"
            @click="showConfigPanel = false">
            隱藏配置
          </el-button>
        </div>
      </template>
      
      <RfiConfigPanel :project="project" />
    </el-card>

    <!-- 操作按鈕 -->
    <div class="actions">
      <el-button type="primary" @click="showRawData = !showRawData">
        {{ showRawData ? '隱藏' : '顯示' }}原始數據
      </el-button>
      <el-button type="info" @click="showConfigPanel = !showConfigPanel">
        {{ showConfigPanel ? '隱藏' : '顯示' }}配置信息
      </el-button>
      <el-button type="success" @click="exportRfiData">
        導出 RFI 數據
      </el-button>
      <el-button type="warning" @click="exportFullRfiData">
        導出完整數據 (含配置)
      </el-button>
    </div>

  </div>
</template>

<script>
import axios from 'axios'
import StatusTag from './StatusTag.vue'
import RfiConfigPanel from './RfiConfigPanel.vue'
import RfiWorkflowProgress from './RfiWorkflowProgress.vue'
import { 
  IconFile, 
  IconQuestion, 
  IconApps, 
  IconExclamationCircle, 
  IconUser, 
  IconLocation, 
  IconFolder, 
  IconCode,
  IconSettings,
  IconBranch
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'RfiDetail',
  components: {
    StatusTag,
    RfiConfigPanel,
    RfiWorkflowProgress,
    IconFile,
    IconQuestion,
    IconApps,
    IconExclamationCircle,
    IconUser,
    IconLocation,
    IconFolder,
    IconCode,
    IconSettings,
    IconBranch
  },
  props: {
    rfi: {
      type: Object,
      required: true
    },
    project: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showRawData: false,
      showConfigPanel: false,
      attachments: null,
      comments: null,
      loadingAttachments: false,
      loadingComments: false
    }
  },
  methods: {
    async loadAttachments() {
      if (this.loadingAttachments) return
      
      this.loadingAttachments = true
      
      try {
        this.$message.info('正在獲取附件...')
        
        const response = await axios.get(`/api/rfis/jarvis/${this.rfi.id}/attachments`, {
          params: {
            projectId: this.project.id
          }
        })

        if (response.data.success) {
          this.attachments = response.data.attachments || []
          this.$message.success(`成功獲取 ${this.attachments.length} 個附件`)
        } else {
          throw new Error(response.data.error || '獲取附件失敗')
        }
      } catch (error) {
        console.error('獲取附件失敗:', error)
        this.$message.error(error.response?.data?.error || error.message || '獲取附件失敗')
      } finally {
        this.loadingAttachments = false
      }
    },

    async loadComments() {
      if (this.loadingComments) return
      
      this.loadingComments = true
      
      try {
        this.$message.info('正在獲取評論...')
        
        const response = await axios.get(`/api/rfis/jarvis/${this.rfi.id}/comments`, {
          params: {
            projectId: this.project.id
          }
        })

        if (response.data.success) {
          this.comments = response.data.comments || []
          this.$message.success(`成功獲取 ${this.comments.length} 個評論`)
        } else {
          throw new Error(response.data.error || '獲取評論失敗')
        }
      } catch (error) {
        console.error('獲取評論失敗:', error)
        this.$message.error(error.response?.data?.error || error.message || '獲取評論失敗')
      } finally {
        this.loadingComments = false
      }
    },

    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    },

    exportRfiData() {
      try {
        const exportData = {
          rfi: this.rfi,
          project: this.project,
          attachments: this.attachments,
          comments: this.comments,
          export_time: new Date().toISOString()
        }

        const dataStr = JSON.stringify(exportData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const fileName = `rfi_${this.rfi.id}_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success(`RFI 數據導出成功: ${fileName}`)
      } catch (error) {
        console.error('導出 RFI 數據失敗:', error)
        this.$message.error('導出失敗: ' + error.message)
      }
    },

    async exportFullRfiData() {
      try {
        this.$message.info('正在收集完整 RFI 數據...')
        
        // 收集所有配置數據
        const configData = {}
        
        // 獲取用戶權限
        try {
          const userPermissionsResp = await axios.get('/api/rfis/jarvis/users/me', {
            params: { projectId: this.project.id }
          })
          if (userPermissionsResp.data.success) {
            configData.userPermissions = userPermissionsResp.data.user_permissions
          }
        } catch (e) {
          console.warn('無法獲取用戶權限:', e.message)
        }

        // 獲取 RFI 類型
        try {
          const rfiTypesResp = await axios.get('/api/rfis/jarvis/rfi-types', {
            params: { projectId: this.project.id, limit: 50 }
          })
          if (rfiTypesResp.data.success) {
            configData.rfiTypes = rfiTypesResp.data.rfi_types
          }
        } catch (e) {
          console.warn('無法獲取 RFI 類型:', e.message)
        }

        // 獲取自定義屬性
        try {
          const customAttributesResp = await axios.get('/api/rfis/jarvis/attributes', {
            params: { projectId: this.project.id, limit: 50 }
          })
          if (customAttributesResp.data.success) {
            configData.customAttributes = customAttributesResp.data.custom_attributes
          }
        } catch (e) {
          console.warn('無法獲取自定義屬性:', e.message)
        }

        // 獲取工作流配置
        try {
          const workflowResp = await axios.get('/api/rfis/jarvis/workflow', {
            params: { projectId: this.project.id }
          })
          if (workflowResp.data.success) {
            configData.workflow = workflowResp.data.workflow
          }
        } catch (e) {
          console.warn('無法獲取工作流配置:', e.message)
        }

        // 獲取自定義標識符
        try {
          const customIdentifierResp = await axios.get('/api/rfis/jarvis/custom-identifier', {
            params: { projectId: this.project.id }
          })
          if (customIdentifierResp.data.success) {
            configData.customIdentifier = customIdentifierResp.data.custom_identifier
          }
        } catch (e) {
          console.warn('無法獲取自定義標識符:', e.message)
        }

        const fullExportData = {
          rfi: this.rfi,
          project: this.project,
          attachments: this.attachments,
          comments: this.comments,
          configuration: configData,
          export_time: new Date().toISOString(),
          export_type: 'full_rfi_data_with_config'
        }

        const dataStr = JSON.stringify(fullExportData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const fileName = `rfi_full_${this.rfi.id}_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success(`完整 RFI 數據導出成功: ${fileName}`)
      } catch (error) {
        console.error('導出完整 RFI 數據失敗:', error)
        this.$message.error('導出失敗: ' + error.message)
      }
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.rfi-detail {
  padding: var(--spacing-lg);
}

.info-card {
  margin-bottom: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-tags {
  display: flex;
  gap: var(--spacing-sm);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.info-item span {
  color: var(--color-text-primary);
}

.title-text {
  font-size: 1.1em;
  font-weight: 500;
  color: var(--color-text-primary);
}

.description-text {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  line-height: 1.6;
}

.question-content {
  margin-top: var(--spacing-md);
}

.question-section,
.answer-section,
.response-section {
  margin-bottom: var(--spacing-lg);
}

.question-section h4,
.answer-section h4,
.response-section h4 {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  font-weight: 500;
}

.question-text,
.answer-text,
.response-text {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  line-height: 1.6;
  white-space: pre-wrap;
}

.response-meta {
  margin-top: var(--spacing-sm);
  font-size: 0.9em;
  color: var(--color-text-secondary);
  display: flex;
  gap: var(--spacing-md);
}

.custom-attributes {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-lighter);
}

.custom-attributes h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.attributes-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.attribute-item {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
}

.attr-name {
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 120px;
}

.attr-value {
  color: var(--color-text-primary);
}

.impact-assessment {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

.impact-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  align-items: center;
  text-align: center;
}

.impact-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.people-time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-md);
}

.people-section h4,
.time-section h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.people-list,
.time-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.person-item,
.time-item {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
}

.person-role,
.time-label {
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 80px;
}

.person-name,
.time-value {
  color: var(--color-text-primary);
}

.time-value.overdue {
  color: var(--color-danger);
  font-weight: 500;
}

.person-email,
.person-type {
  color: var(--color-text-tertiary);
  font-size: 0.9em;
}

.location-info {
  margin-top: var(--spacing-md);
}

.location-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.location-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.document-link {
  font-family: monospace;
  background: var(--color-bg-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  word-break: break-all;
}

.locations-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.attachments-comments-info {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.attachments-section,
.comments-section {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-lighter);
}

.attachments-section h4,
.comments-section h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.attachments-list,
.comments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.attachment-item {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.attachment-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.attachment-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.attachment-type,
.attachment-size {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.attachment-meta {
  font-size: 0.85em;
  color: var(--color-text-tertiary);
  display: flex;
  gap: var(--spacing-sm);
}

.comment-item {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.comment-header {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.comment-author {
  font-weight: 500;
  color: var(--color-text-primary);
}

.comment-time {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.comment-content {
  line-height: 1.6;
  white-space: pre-wrap;
}

.raw-data {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  overflow-x: auto;
}

.raw-data pre {
  font-size: 0.85em;
  line-height: 1.4;
  margin: 0;
}

.actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-lighter);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .impact-assessment {
    grid-template-columns: 1fr;
  }
  
  .people-time-grid {
    grid-template-columns: 1fr;
  }
  
  .attachments-comments-info {
    grid-template-columns: 1fr 1fr;
  }
  
  .attributes-list {
    grid-template-columns: 1fr;
  }
}
</style>
