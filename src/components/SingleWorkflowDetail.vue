<template>
  <div class="single-workflow-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="workflow-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>Loading workflow details...</span>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="workflow-error">
      <el-alert
        :title="error"
        type="error"
        :closable="false"
        show-icon />
      <el-button 
        type="primary" 
        size="small" 
        @click="loadWorkflowDetail"
        style="margin-top: 8px;">
        Retry Loading
      </el-button>
    </div>
    
    <!-- 工作流详情内容 -->
    <div v-else-if="workflowData" class="workflow-content">
      <!-- 工作流basicInfo -->
      <div class="workflow-header">
        <div class="workflow-title">
          <h3>{{ workflowData.workflow.name }}</h3>
          <div class="workflow-meta">
            <StatusTag 
              :status="getStatusForTag(workflowData.workflow.status)" 
              :text="workflowData.workflow.status"
              size="small"
              :show-icon="false" />
            <span class="workflow-id">ID: {{ workflowData.workflow.id }}</span>
          </div>
        </div>
        
        <!-- 工作流统计 -->
        <div class="workflow-stats-mini">
          <el-statistic title="Steps" :value="workflowData.workflow.steps_count" />
          <el-statistic title="Approval Options" :value="workflowData.workflow.approval_options_count" />
        </div>
      </div>
      
      <!-- 工作流描述 -->
      <div v-if="workflowData.workflow.description" class="workflow-description">
        <h4>📝 Description</h4>
        <p>{{ workflowData.workflow.description }}</p>
      </div>
      
      <!-- 工作流备注 -->
      <div v-if="workflowData.workflow.notes" class="workflow-notes">
        <h4>📋 Notes</h4>
        <p>{{ workflowData.workflow.notes }}</p>
      </div>
      
      <!-- 工作流时间信息 -->
      <div class="workflow-timeline">
        <h4>📅 Timeline Information</h4>
        <div class="timeline-grid">
          <div class="timeline-item">
            <div class="timeline-label">Created At</div>
            <div class="timeline-value">{{ workflowData.workflow.created_at }}</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-label">Updated At</div>
            <div class="timeline-value">{{ workflowData.workflow.updated_at }}</div>
          </div>
        </div>
      </div>
      
      <!-- 工作流配置 -->
      <div class="workflow-config">
        <h4>⚙️ Configuration Options</h4>
        <div class="config-grid">
          <div class="config-item">
            <div class="config-label">File Copy</div>
            <div class="config-value">
              <el-tag :type="workflowData.workflow.has_copy_files ? 'success' : 'info'" size="small">
                {{ workflowData.workflow.has_copy_files ? 'Enabled' : 'Disabled' }}
              </el-tag>
            </div>
          </div>
          <div class="config-item">
            <div class="config-label">Attached Attributes</div>
            <div class="config-value">
              <el-tag :type="workflowData.workflow.has_attached_attributes ? 'success' : 'info'" size="small">
                {{ workflowData.workflow.has_attached_attributes ? 'Yes' : 'No' }}
              </el-tag>
            </div>
          </div>
          <div class="config-item">
            <div class="config-label">Allow Initiator to Edit</div>
            <div class="config-value">
              <el-tag :type="workflowData.workflow.additional_options?.allowInitiatorToEdit ? 'success' : 'info'" size="small">
                {{ workflowData.workflow.additional_options?.allowInitiatorToEdit ? 'Yes' : 'No' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 审批状态选项 -->
      <div v-if="workflowData.approval_options && workflowData.approval_options.length > 0" class="approval-options">
        <h4>✅ Approval Status Options</h4>
        <div class="options-list">
          <div 
            v-for="option in workflowData.approval_options" 
            :key="option.id"
            class="option-item">
            <div class="option-info">
              <div class="option-label">{{ translateApprovalLabel(option.label) }}</div>
              <div class="option-value">{{ option.value }}</div>
            </div>
            <el-tag v-if="option.built_in" type="info" size="small">Built-in</el-tag>
            <el-tag v-else type="warning" size="small">Custom</el-tag>
          </div>
        </div>
      </div>
      
      <!-- 工作流步骤详情 -->
      <div v-if="workflowData.detailed_steps && workflowData.detailed_steps.length > 0" class="workflow-steps">
        <h4>🔄 Workflow Steps</h4>
        <div class="steps-list">
          <div 
            v-for="step in workflowData.detailed_steps" 
            :key="step.id"
            class="step-card">
            
            <!-- 步骤头部 -->
            <div class="step-header">
              <div class="step-title">
                <div class="step-number">{{ step.step_number }}</div>
                <div class="step-info">
                  <h5>{{ getEnglishStepName(step.name, step.step_number, step.type) }}</h5>
                  <div class="step-meta">
                    <el-tag size="small" type="primary">{{ getStepTypeLabel(step.type) }}</el-tag>
                    <span v-if="step.duration > 0" class="step-duration">{{ step.duration }} days deadline</span>
                    <span class="step-due-type">{{ getDueDateTypeLabel(step.due_date_type) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 组审阅配置 -->
            <div v-if="step.group_review_analysis && step.group_review_analysis.enabled" class="group-review-config">
              <div class="config-title">👥 Group Review Configuration</div>
              <div class="config-content">
                <el-tag type="info" size="small">{{ translateGroupReviewDescription(step.group_review_analysis.description) }}</el-tag>
                <span class="min-reviewers">Minimum {{ step.group_review_analysis.min_reviewers }} reviewers</span>
              </div>
            </div>
            
            <!-- 候选者信息 -->
            <div class="step-candidates">
              <div class="candidates-title">🎯 Candidates</div>
              
              <!-- 直接用户 -->
              <div v-if="step.candidates.users_count > 0" class="candidate-group">
                <div class="candidate-type">👤 Assigned Users ({{ step.candidates.users_count }})</div>
                <div class="candidates-list">
                  <div 
                    v-for="user in step.candidates.users" 
                    :key="user.autodeskId"
                    class="candidate-item user">
                    <div class="candidate-avatar">{{ user.name.charAt(0) }}</div>
                    <div class="candidate-info">
                      <div class="candidate-name">{{ user.name }}</div>
                      <div class="candidate-id">{{ user.autodeskId }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 角色 -->
              <div v-if="step.candidates.roles_count > 0" class="candidate-group">
                <div class="candidate-type">🏷️ Roles ({{ step.candidates.roles_count }})</div>
                <div class="candidates-list">
                  <div 
                    v-for="role in step.candidates.roles" 
                    :key="role.autodeskId"
                    class="candidate-item role">
                    <div class="candidate-avatar">🏷️</div>
                    <div class="candidate-info">
                      <div class="candidate-name">{{ role.name }}</div>
                      <div class="candidate-id">{{ role.autodeskId }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 公司 -->
              <div v-if="step.candidates.companies_count > 0" class="candidate-group">
                <div class="candidate-type">🏢 Companies ({{ step.candidates.companies_count }})</div>
                <div class="candidates-list">
                  <div 
                    v-for="company in step.candidates.companies" 
                    :key="company.autodeskId"
                    class="candidate-item company">
                    <div class="candidate-avatar">🏢</div>
                    <div class="candidate-info">
                      <div class="candidate-name">{{ company.name }}</div>
                      <div class="candidate-id">{{ company.autodeskId }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 审阅者类型分析 -->
              <div v-if="step.reviewer_type_analysis" class="reviewer-analysis">
                <div class="analysis-title">📊 Reviewer Analysis</div>
                <div class="analysis-content">
                  <el-tag size="small" type="info">{{ translateAssignmentMode(step.reviewer_type_analysis.assignment_mode) }}</el-tag>
                  <span class="potential-reviewers">{{ step.reviewer_type_analysis.total_potential_reviewers }} potential reviewers</span>
                  <el-tag v-if="step.reviewer_type_analysis.is_multi_reviewer" size="small" type="warning">Multi-Reviewer</el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 文件复制配置 -->
      <div v-if="workflowData.workflow.has_copy_files && workflowData.workflow.copy_files_options" class="copy-files-config">
        <h4>📁 File Copy Configuration</h4>
        <div class="config-details">
          <div class="config-item">
            <div class="config-label">Status</div>
            <div class="config-value">
              <el-tag type="success" size="small">Enabled</el-tag>
            </div>
          </div>
          <div v-if="workflowData.workflow.copy_files_options.condition" class="config-item">
            <div class="config-label">Copy Condition</div>
            <div class="config-value">{{ workflowData.workflow.copy_files_options.condition }}</div>
          </div>
          <div v-if="workflowData.workflow.copy_files_options.folderUrn" class="config-item">
            <div class="config-label">Target Folder</div>
            <div class="config-value">
              <code>{{ workflowData.workflow.copy_files_options.folderUrn }}</code>
            </div>
          </div>
        </div>
      </div>
      
      
      <!-- 原始数据 -->
      <div class="raw-data-section">
        <el-collapse>
          <el-collapse-item title="🔍 View Workflow Raw Data" name="workflow-raw-data">
            <JsonViewer 
              :data="workflowData"
              title="Workflow Raw Data"
              :max-height="400" />
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import JsonViewer from './JsonViewer.vue'
import StatusTag from './StatusTag.vue'

export default {
  name: 'SingleWorkflowDetail',
  components: {
    JsonViewer,
    StatusTag,
    Loading
  },
  props: {
    workflowId: {
      type: String,
      required: true
    },
    project: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup(props) {
    // 响应式数据
    const workflowData = ref(null)
    const loading = ref(false)
    const error = ref('')
    
    // 加载工作流详情
    const loadWorkflowDetail = async () => {
      if (!props.workflowId) {
        error.value = 'Missing workflow ID'
        return
      }
      
      if (!props.project?.id) {
        error.value = 'Missing project information, unable to load workflow details'
        return
      }
      
      loading.value = true
      error.value = ''
      
      console.log('SingleWorkflowDetail: Loading workflow detail for ID:', props.workflowId)
      console.log('SingleWorkflowDetail: Project ID:', props.project?.id)
      
      try {
        const apiUrl = `/api/workflows/jarvis/${props.workflowId}`
        console.log('SingleWorkflowDetail: API URL:', apiUrl)
        
        const response = await axios.get(apiUrl, {
          timeout: 30000,
          params: {
            projectId: props.project.id
          }
        })
        
        console.log('SingleWorkflowDetail: API Response:', response.data)
        
        if (response.data.success) {
          workflowData.value = response.data
          ElMessage.success('Workflow details loaded successfully')
        } else {
          throw new Error(response.data.error || 'Failed to load workflow details')
        }
      } catch (err) {
        console.error('Failed to load workflow details:', err)
        error.value = err.response?.data?.error || err.message || 'Failed to load workflow details'
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }
    
    // 工具方法
    const getStatusForTag = (status) => {
      const statusMap = {
        'ACTIVE': 'active',
        'INACTIVE': 'inactive'
      }
      return statusMap[status] || status?.toLowerCase() || 'unknown'
    }
    
    const getStepTypeLabel = (type) => {
      const stepTypes = {
        'INITIATOR': 'Initiator',
        'REVIEWER': 'Reviewer',
        'APPROVER': 'Approver'
      }
      return stepTypes[type] || type
    }
    
    const getDueDateTypeLabel = (type) => {
      const typeMap = {
        'CALENDAR_DAY': 'Calendar Days',
        'BUSINESS_DAY': 'Business Days',
        'NONE': 'No Deadline'
      }
      return typeMap[type] || type
    }

    const translateApprovalLabel = (label) => {
      const labelMap = {
        'approved': 'Approved',
        'rejected': 'Rejected', 
        'approved_with_comments': 'Approved with Comments',
        'needs_revision': 'Needs Revision',
        'on_hold': 'On Hold',
        'cancelled': 'Cancelled'
      }
      return labelMap[label] || label
    }

    const translateStepName = (name) => {
      const nameMap = {
        '发起者': 'Initiator',
        '审阅者': 'Reviewer',
        '审批者': 'Approver',
        '最终审批': 'Final Approval',
        '初审': 'Initial Review',
        '复审': 'Secondary Review',
        '初始审阅1': 'Initial Review 1',
        '初始审阅2': 'Initial Review 2', 
        '初始审阅3': 'Initial Review 3',
        '初始审阅4': 'Initial Review 4',
        '初始审阅5': 'Initial Review 5',
        '提交': 'Submit',
        '完成': 'Complete'
      }
      return nameMap[name] || name
    }

    const translateAssignmentMode = (mode) => {
      const modeMap = {
        'single_user': 'Single User',
        'role_or_company_based': 'Role or Company Based',
        'multiple_users': 'Multiple Users',
        'any_user': 'Any User'
      }
      return modeMap[mode] || mode
    }

    const translateGroupReviewDescription = (description) => {
      const descriptionMap = {
        '需要所有人审阅': 'All reviewers required',
        '需要任意一人审阅': 'Any reviewer required',
        '需要最少审阅人数': 'Minimum reviewers required',
        '并行审阅': 'Parallel review',
        '串行审阅': 'Sequential review'
      }
      return descriptionMap[description] || description
    }

    const getEnglishStepName = (originalName, stepNumber, stepType) => {
      // 直接根据步骤类型和编号生成英文名称
      if (stepType === 'INITIATOR') {
        return 'Initiator'
      } else if (stepType === 'REVIEWER') {
        return `Initial Review ${stepNumber - 1}` // 减1因为第一步通常是Initiator
      } else if (stepType === 'APPROVER') {
        return 'Final Approval'
      } else {
        // 如果有原始英文名称且不包含中文，直接使用
        if (originalName && !/[\u4e00-\u9fff]/.test(originalName)) {
          return originalName
        }
        // 否则根据步骤编号生成通用名称
        return `Step ${stepNumber}`
      }
    }
    
    // 监听工作流ID变化
    watch(() => props.workflowId, (newId, oldId) => {
      if (newId && newId !== oldId) {
        console.log(`Workflow ID changed from ${oldId} to ${newId}`)
        workflowData.value = null
        error.value = ''
        loadWorkflowDetail()
      }
    }, { immediate: true })
    
    // 组件挂载时加载数据
    onMounted(() => {
      console.log('SingleWorkflowDetail mounted with workflowId:', props.workflowId)
      if (props.workflowId) {
        loadWorkflowDetail()
      }
    })
    
    return {
      // data and methods
      workflowData,
      loading,
      error,
      loadWorkflowDetail,
      getStatusForTag,
      getStepTypeLabel,
      getDueDateTypeLabel,
      translateApprovalLabel,
      translateStepName,
      translateAssignmentMode,
      translateGroupReviewDescription,
      getEnglishStepName
    }
  }
}
</script>

<style scoped>
.single-workflow-detail {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.workflow-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 40px;
  justify-content: center;
  color: #6b7280;
}

.workflow-error {
  padding: 20px;
  text-align: center;
}

.workflow-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f2f5;
}

.workflow-title h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
}

.workflow-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workflow-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 4px;
}

.workflow-stats-mini {
  display: flex;
  gap: 24px;
}

.workflow-description,
.workflow-notes {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #3b82f6;
}

.workflow-description h4,
.workflow-notes h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 14px;
}

.workflow-description p,
.workflow-notes p {
  margin: 0;
  color: #374151;
  line-height: 1.5;
}

.workflow-timeline h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.timeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.timeline-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.timeline-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
  font-weight: 500;
}

.timeline-value {
  font-size: 13px;
  color: #1f2937;
  font-family: 'Consolas', 'Monaco', monospace;
}

.workflow-config h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.config-label {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.approval-options h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-label {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.option-value {
  font-size: 12px;
  color: #6b7280;
  font-family: 'Consolas', 'Monaco', monospace;
}

.workflow-steps h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.step-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.step-header {
  margin-bottom: 16px;
}

.step-title {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.step-info {
  flex: 1;
}

.step-info h5 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

.step-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.step-duration {
  color: #f59e0b;
  font-weight: 500;
}

.group-review-config {
  background: #e0f2fe;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  border-left: 4px solid #0ea5e9;
}

.config-title {
  font-weight: 500;
  color: #0c4a6e;
  margin-bottom: 8px;
  font-size: 13px;
}

.config-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.min-reviewers {
  font-size: 12px;
  color: #0369a1;
}

.step-candidates {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.candidates-title {
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
  font-size: 14px;
}

.candidate-group {
  margin-bottom: 16px;
}

.candidate-group:last-child {
  margin-bottom: 0;
}

.candidate-type {
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 8px;
  font-size: 12px;
}

.candidates-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.candidate-item.user {
  background: #eff6ff;
  border: 1px solid #bae6fd;
}

.candidate-item.role {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.candidate-item.company {
  background: #fffbeb;
  border: 1px solid #fed7aa;
}

.candidate-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.candidate-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}

.candidate-item.role .candidate-avatar {
  background: #10b981;
}

.candidate-item.company .candidate-avatar {
  background: #f59e0b;
}

.candidate-info {
  flex: 1;
  min-width: 0;
}

.candidate-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 13px;
  margin-bottom: 2px;
}

.candidate-id {
  font-size: 11px;
  color: #6b7280;
  font-family: 'Consolas', 'Monaco', monospace;
}

.reviewer-analysis {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.analysis-title {
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
  font-size: 12px;
}

.analysis-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.potential-reviewers {
  color: #6b7280;
}

.copy-files-config h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.config-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-details .config-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.config-details .config-value code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #dc2626;
  word-break: break-all;
}

.workflow-diagram h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.raw-data-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .single-workflow-detail {
    padding: 16px;
  }
  
  .workflow-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .timeline-grid,
  .config-grid {
    grid-template-columns: 1fr;
  }
  
  .candidates-list {
    grid-template-columns: 1fr;
  }
  
  .step-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
