<template>
  <div class="rfi-workflow-progress">
    
    <!-- 工作流進度條 -->
    <div class="workflow-progress-bar">
      <div class="progress-header">
        <span class="progress-title">
          <icon-branch />
          {{ $t('rfiWorkflow.title') }}
        </span>
        <div class="progress-meta">
          <StatusTag 
            :status="getWorkflowStatusType(rfi.workflow_type)" 
            :text="getWorkflowTypeText(rfi.workflow_type)" 
            size="small" />
          <span class="current-status">{{ rfi.status }}</span>
        </div>
      </div>
      
      <div class="progress-steps">
        <div 
          v-for="(step, index) in workflowSteps" 
          :key="index"
          class="progress-step"
          :class="getStepClass(step, index)">
          
          <!-- 步驟連接線 -->
          <div v-if="index > 0" class="step-connector" :class="{ 'active': isStepCompleted(index - 1) }"></div>
          
          <!-- 步驟圓點 -->
          <div class="step-dot">
            <el-icon :size="16">
              <Check v-if="isStepCompleted(index)" />
              <Clock v-else-if="isCurrentStep(index)" />
              <Minus v-else />
            </el-icon>
          </div>
          
          <!-- 步驟信息 -->
          <div class="step-info">
            <div class="step-name">{{ step.name }}</div>
            <div class="step-description">{{ step.description }}</div>
            <div v-if="step.date" class="step-date">{{ step.date }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 狀態變更歷史 -->
    <div class="status-history" v-if="showHistory">
      <div class="history-header">
        <span class="history-title">
          <icon-history />
          {{ $t('rfiWorkflow.statusHistory.title') }}
        </span>
        <el-button 
          type="text" 
          size="small"
          @click="showHistory = false">
          {{ $t('rfiWorkflow.statusHistory.hide') }}
        </el-button>
      </div>
      
      <div class="history-timeline">
        <div 
          v-for="(historyItem, index) in statusHistory" 
          :key="index"
          class="history-item">
          <div class="history-dot" :class="getHistoryDotClass(historyItem.type)"></div>
          <div class="history-content">
            <div class="history-action">
              <span class="action-text">{{ historyItem.action }}</span>
              <StatusTag 
                :status="getStatusType(historyItem.status)" 
                :text="historyItem.status" 
                size="small" />
            </div>
            <div class="history-meta">
              <span class="history-user" v-if="historyItem.user">{{ historyItem.user.name }}</span>
              <span class="history-date">{{ historyItem.date }}</span>
            </div>
            <div v-if="historyItem.comment" class="history-comment">{{ historyItem.comment }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 當前狀態詳情 -->
    <div class="current-status-detail">
      <div class="status-header">
        <span class="status-title">
          <icon-info />
          {{ $t('rfiWorkflow.currentStatus.title') }}
        </span>
      </div>
      
      <div class="status-grid">
        <div class="status-item">
          <label>{{ $t('rfiWorkflow.currentStatus.status') }}:</label>
          <StatusTag 
            :status="getStatusType(rfi.status)" 
            :text="rfi.status" 
            size="default" />
        </div>
        
        <div class="status-item" v-if="rfi.previous_status">
          <label>{{ $t('rfiWorkflow.currentStatus.previousStatus') }}:</label>
          <StatusTag 
            :status="getStatusType(rfi.previous_status)" 
            :text="rfi.previous_status" 
            size="small" />
        </div>
        
        <div class="status-item" v-if="rfi.assigned_to">
          <label>{{ $t('rfiWorkflow.currentStatus.assignee') }}:</label>
          <div class="assignee-info">
            <span class="assignee-name">{{ getAssigneeName(rfi.assigned_to) }}</span>
            <el-tag type="info" size="small">{{ rfi.assigned_to_type || 'user' }}</el-tag>
          </div>
        </div>
        
        <div class="status-item" v-if="rfi.due_date">
          <label>{{ $t('rfiWorkflow.currentStatus.dueDate') }}:</label>
          <div class="due-date" :class="{ 'overdue': rfi.is_overdue }">
            <span>{{ rfi.due_date }}</span>
            <el-tag v-if="rfi.is_overdue" type="danger" size="small">{{ $t('rfiWorkflow.currentStatus.overdue') }}</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 工作流角色信息 -->
    <div class="workflow-roles" v-if="rfi.reviewers && rfi.reviewers.length > 0">
      <div class="roles-header">
        <span class="roles-title">
          <icon-user-group />
          {{ $t('rfiWorkflow.participants.title') }}
        </span>
      </div>
      
      <div class="roles-grid">
        <div class="role-item" v-if="rfi.created_by">
          <div class="role-label">{{ $t('rfiWorkflow.participants.creator') }}</div>
          <div class="role-user">
            <span class="user-name">{{ getUserName(rfi.created_by) }}</span>
            <span class="user-date">{{ rfi.created_at }}</span>
          </div>
        </div>
        
        <div class="role-item" v-if="rfi.manager_id">
          <div class="role-label">{{ $t('rfiWorkflow.participants.manager') }}</div>
          <div class="role-user">
            <span class="user-name">{{ getUserName(rfi.manager_id) }}</span>
          </div>
        </div>
        
        <div class="role-item">
          <div class="role-label">審閱者</div>
          <div class="reviewers-list">
            <div 
              v-for="reviewer in rfi.reviewers" 
              :key="reviewer.id"
              class="reviewer-item">
              <span class="reviewer-name">{{ getUserName(reviewer) }}</span>
              <el-tag type="success" size="small">{{ reviewer.type || 'user' }}</el-tag>
            </div>
          </div>
        </div>
        
        <div class="role-item" v-if="rfi.responded_by">
          <div class="role-label">回覆者</div>
          <div class="role-user">
            <span class="user-name">{{ getUserName(rfi.responded_by) }}</span>
            <span class="user-date">{{ rfi.responded_at }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="workflow-actions">
      <el-button 
        type="info" 
        size="small"
        @click="showHistory = !showHistory">
        {{ showHistory ? '隱藏' : '顯示' }}狀態歷史
      </el-button>
      <el-button 
        type="primary" 
        size="small"
        @click="exportWorkflowData">
        導出工作流數據
      </el-button>
    </div>

  </div>
</template>

<script>
import StatusTag from './StatusTag.vue'
import userCache from '../utils/userCache.js'
import { 
  IconBranch, 
  IconHistory, 
  IconInfo, 
  IconUserGroup 
} from '@arco-design/web-vue/es/icon'
import { 
  Check, 
  Clock, 
  Minus 
} from '@element-plus/icons-vue'

export default {
  name: 'RfiWorkflowProgress',
  components: {
    StatusTag,
    IconBranch,
    IconHistory,
    IconInfo,
    IconUserGroup,
    Check,
    Clock,
    Minus
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
      showHistory: false
    }
  },
  computed: {
    workflowSteps() {
      // 根據工作流類型生成步驟
      if (this.rfi.workflow_type === 'US') {
        return this.getUSWorkflowSteps()
      } else if (this.rfi.workflow_type === 'EMEA') {
        return this.getEMEAWorkflowSteps()
      } else {
        return this.getGenericWorkflowSteps()
      }
    },

    statusHistory() {
      // 構建狀態變更歷史
      const history = []
      
      // 創建事件
      if (this.rfi.created_at) {
        history.push({
          type: 'create',
          action: '創建 RFI',
          status: 'draft',
          user: this.rfi.created_by,
          date: this.rfi.created_at,
          comment: '初始創建'
        })
      }
      
      // 狀態變更事件
      if (this.rfi.previous_status && this.rfi.previous_status !== this.rfi.status) {
        history.push({
          type: 'status_change',
          action: '狀態變更',
          status: this.rfi.status,
          user: this.rfi.updated_by,
          date: this.rfi.updated_at,
          comment: `從 ${this.rfi.previous_status} 變更為 ${this.rfi.status}`
        })
      }
      
      // 回覆事件
      if (this.rfi.responded_at) {
        history.push({
          type: 'response',
          action: '提供回覆',
          status: this.rfi.official_response_status,
          user: this.rfi.responded_by,
          date: this.rfi.responded_at,
          comment: this.rfi.official_response ? '已提供官方回覆' : '回覆狀態更新'
        })
      }
      
      // 關閉事件
      if (this.rfi.closed_at) {
        history.push({
          type: 'close',
          action: '關閉 RFI',
          status: 'closed',
          user: this.rfi.closed_by,
          date: this.rfi.closed_at,
          comment: 'RFI 已關閉'
        })
      }
      
      // 按時間排序
      return history.sort((a, b) => new Date(a.date) - new Date(b.date))
    },

    currentStepIndex() {
      // 根據當前狀態確定當前步驟
      const statusStepMap = {
        'draft': 0,
        'submitted': 1,
        'open': 2,
        'openRev1': 2,
        'openRev2': 3,
        'answered': 4,
        'answeredRev1': 4,
        'answeredManager': 5,
        'closed': 6,
        'void': -1,
        'rejected': -1
      }
      return statusStepMap[this.rfi.status] || 0
    }
  },
  methods: {
    getUSWorkflowSteps() {
      // US 工作流步驟 (單審閱者)
      return [
        {
          name: '草稿',
          description: 'RFI 創建但未提交',
          status: 'draft'
        },
        {
          name: 'Submitted',
          description: 'RFI submitted and waiting for review',
          status: 'submitted',
          date: this.rfi.created_at
        },
        {
          name: '進行中',
          description: '正在審閱和處理',
          status: 'open'
        },
        {
          name: '已回答',
          description: '已提供回覆',
          status: 'answered',
          date: this.rfi.responded_at
        },
        {
          name: '已關閉',
          description: 'RFI 已完成並關閉',
          status: 'closed',
          date: this.rfi.closed_at
        }
      ]
    },

    getEMEAWorkflowSteps() {
      // EMEA 工作流步驟 (多審閱者)
      return [
        {
          name: '草稿',
          description: 'RFI 創建但未提交',
          status: 'draft'
        },
        {
          name: 'Submitted',
          description: 'RFI submitted',
          status: 'submitted',
          date: this.rfi.created_at
        },
        {
          name: '管理者審閱',
          description: '管理者正在審閱',
          status: 'openRev1'
        },
        {
          name: '審閱者審閱',
          description: '審閱者正在審閱',
          status: 'openRev2'
        },
        {
          name: '初步回答',
          description: '已提供初步回覆',
          status: 'answeredRev1'
        },
        {
          name: '管理者確認',
          description: '管理者確認回覆',
          status: 'answeredManager'
        },
        {
          name: '已關閉',
          description: 'RFI 已完成並關閉',
          status: 'closed',
          date: this.rfi.closed_at
        }
      ]
    },

    getGenericWorkflowSteps() {
      // 通用工作流步驟
      return [
        {
          name: '創建',
          description: 'RFI 已創建',
          status: 'created',
          date: this.rfi.created_at
        },
        {
          name: '處理中',
          description: '正在處理',
          status: 'processing'
        },
        {
          name: '已完成',
          description: 'RFI 已完成',
          status: 'completed',
          date: this.rfi.closed_at || this.rfi.responded_at
        }
      ]
    },

    isStepCompleted(stepIndex) {
      return stepIndex < this.currentStepIndex
    },

    isCurrentStep(stepIndex) {
      return stepIndex === this.currentStepIndex
    },

    getStepClass(step, index) {
      return {
        'completed': this.isStepCompleted(index),
        'current': this.isCurrentStep(index),
        'pending': index > this.currentStepIndex
      }
    },

    getWorkflowStatusType(workflowType) {
      const typeMap = {
        'US': 'success',
        'EMEA': 'info',
        'EU': 'info'
      }
      return typeMap[workflowType] || 'info'
    },

    getWorkflowTypeText(workflowType) {
      const textMap = {
        'US': 'Single Reviewer Workflow',
        'EMEA': 'Multi Reviewer Workflow',
        'EU': 'Multi Reviewer Workflow'
      }
      return textMap[workflowType] || workflowType
    },

    getStatusType(status) {
      const statusMap = {
        'draft': 'info',
        'submitted': 'warning',
        'open': 'warning',
        'openRev1': 'warning',
        'openRev2': 'warning',
        'answered': 'success',
        'answeredRev1': 'success',
        'answeredManager': 'success',
        'closed': 'info',
        'void': 'danger',
        'rejected': 'danger'
      }
      return statusMap[status?.toLowerCase()] || 'info'
    },

    getHistoryDotClass(type) {
      const typeMap = {
        'create': 'create',
        'status_change': 'change',
        'response': 'response',
        'close': 'close'
      }
      return typeMap[type] || 'default'
    },

    getAssigneeName(assignee) {
      if (Array.isArray(assignee)) {
        return assignee.map(a => {
          // 对每个分配对象使用用户缓存
          if (typeof a === 'string') {
            const displayName = userCache.getUserDisplayName(a, this.project?.id)
            return displayName !== a ? displayName : a
          }
          if (a && a.id) {
            const cachedName = userCache.getUserDisplayName(a.id, this.project?.id)
            if (cachedName && cachedName !== a.id) {
              return cachedName
            }
          }
          return a?.name || a?.id || '未知'
        }).join(', ')
      }
      
      // 单个分配对象也使用用户缓存
      if (typeof assignee === 'string') {
        const displayName = userCache.getUserDisplayName(assignee, this.project?.id)
        return displayName !== assignee ? displayName : assignee
      }
      if (assignee && assignee.id) {
        const cachedName = userCache.getUserDisplayName(assignee.id, this.project?.id)
        if (cachedName && cachedName !== assignee.id) {
          return cachedName
        }
      }
      return assignee?.name || assignee?.id || '未指定'
    },

    getUserName(user) {
      if (!user) return '未知用戶'
      
      // 如果是字符串（用户ID），使用用户缓存查找
      if (typeof user === 'string') {
        const displayName = userCache.getUserDisplayName(user, this.project?.id)
        if (displayName && displayName !== user) {
          return displayName
        }
        return user
      }
      
      // 如果是對象，先嘗試用ID查找缓存，再回退到对象字段
      if (typeof user === 'object') {
        if (user.id) {
          const cachedName = userCache.getUserDisplayName(user.id, this.project?.id)
          if (cachedName && cachedName !== user.id) {
            return cachedName
          }
        }
        return user.name || user.email || user.id || '未知用戶'
      }
      
      return String(user) || '未知用戶'
    },

    exportWorkflowData() {
      try {
        const workflowData = {
          rfi_id: this.rfi.id,
          project_id: this.project.id,
          workflow_type: this.rfi.workflow_type,
          current_status: this.rfi.status,
          previous_status: this.rfi.previous_status,
          workflow_steps: this.workflowSteps,
          status_history: this.statusHistory,
          participants: {
            created_by: this.rfi.created_by,
            assigned_to: this.rfi.assigned_to,
            reviewers: this.rfi.reviewers,
            manager_id: this.rfi.manager_id,
            responded_by: this.rfi.responded_by,
            closed_by: this.rfi.closed_by
          },
          timeline: {
            created_at: this.rfi.created_at,
            updated_at: this.rfi.updated_at,
            due_date: this.rfi.due_date,
            responded_at: this.rfi.responded_at,
            closed_at: this.rfi.closed_at
          },
          export_time: new Date().toISOString()
        }

        const dataStr = JSON.stringify(workflowData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const fileName = `rfi_workflow_${this.rfi.id}_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success(`工作流數據導出成功: ${fileName}`)
      } catch (error) {
        console.error('導出工作流數據失敗:', error)
        this.$message.error('導出失敗: ' + error.message)
      }
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.rfi-workflow-progress {
  padding: var(--spacing-lg);
}

/* 工作流進度條 */
.workflow-progress-bar {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-lighter);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.progress-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1.1em;
}

.progress-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.current-status {
  font-weight: 500;
  color: var(--color-text-primary);
}

.progress-steps {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  position: relative;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-connector {
  position: absolute;
  top: 20px;
  left: -50%;
  right: 50%;
  height: 2px;
  background: var(--color-border-lighter);
  z-index: 1;
}

.step-connector.active {
  background: var(--color-success);
}

.step-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-lighter);
  margin-bottom: var(--spacing-sm);
  z-index: 2;
  position: relative;
}

.progress-step.completed .step-dot {
  background: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.progress-step.current .step-dot {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: white;
}

.step-info {
  text-align: center;
  max-width: 120px;
}

.step-name {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.step-description {
  font-size: 0.85em;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-bottom: var(--spacing-xs);
}

.step-date {
  font-size: 0.8em;
  color: var(--color-text-tertiary);
}

/* 狀態歷史 */
.status-history {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-lighter);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.history-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.history-timeline {
  position: relative;
  padding-left: var(--spacing-lg);
}

.history-timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-border-lighter);
}

.history-item {
  position: relative;
  margin-bottom: var(--spacing-lg);
}

.history-dot {
  position: absolute;
  left: -12px;
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-lighter);
}

.history-dot.create {
  border-color: var(--color-success);
  background: var(--color-success);
}

.history-dot.change {
  border-color: var(--color-warning);
  background: var(--color-warning);
}

.history-dot.response {
  border-color: var(--color-info);
  background: var(--color-info);
}

.history-dot.close {
  border-color: var(--color-text-secondary);
  background: var(--color-text-secondary);
}

.history-content {
  padding-left: var(--spacing-md);
}

.history-action {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.action-text {
  font-weight: 500;
  color: var(--color-text-primary);
}

.history-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.9em;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.history-user {
  font-weight: 500;
}

.history-comment {
  font-size: 0.85em;
  color: var(--color-text-tertiary);
  font-style: italic;
}

/* 當前狀態詳情 */
.current-status-detail {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-lighter);
}

.status-header {
  margin-bottom: var(--spacing-lg);
}

.status-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.status-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.assignee-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.assignee-name {
  color: var(--color-text-primary);
  font-weight: 500;
}

.due-date {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.due-date.overdue {
  color: var(--color-danger);
  font-weight: 500;
}

/* 工作流角色 */
.workflow-roles {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-lighter);
}

.roles-header {
  margin-bottom: var(--spacing-lg);
}

.roles-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.roles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.role-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.role-label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.role-user {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.user-name {
  color: var(--color-text-primary);
  font-weight: 500;
}

.user-date,
.user-id {
  font-size: 0.85em;
  color: var(--color-text-tertiary);
}

.reviewers-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.reviewer-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-sm);
}

.reviewer-name {
  color: var(--color-text-primary);
  font-weight: 500;
}

/* 操作按鈕 */
.workflow-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-lighter);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .progress-steps {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .step-connector {
    display: none;
  }
  
  .status-grid,
  .roles-grid {
    grid-template-columns: 1fr;
  }
  
  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}
</style>
