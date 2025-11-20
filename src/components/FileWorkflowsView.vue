<template>
  <div class="file-workflows-view">
  
    <!-- 手动加载按钮 -->
    <div v-if="!hasLoaded && !loading" class="load-workflows-section">
      <div class="load-prompt">
        <div class="prompt-icon">🔄</div>
        <div class="prompt-text">
          <h4>View Workflow Information</h4>
          <p>Click the button below to load workflow and approval information related to this file</p>
        </div>
      </div>
      <el-button 
        type="primary" 
        size="default"
        @click="loadWorkflows"
        :loading="loading"
        class="load-workflows-btn">
        <el-icon><Search /></el-icon>
        View Workflows
      </el-button>
    </div>
    
    <!-- Workflow Count Statistics -->
    <div v-if="!loading && !error && workflows.length > 0" class="workflows-summary">
      <div class="summary-header">
        <span class="workflow-icon">🔄</span>
        <span class="summary-text">This file is associated with {{ workflows.length }} workflow(s)</span>
        <el-tag :type="getWorkflowsStatusType()" size="small">
          {{ getWorkflowsStatusText() }}
        </el-tag>
        <el-button 
          type="text" 
          size="small" 
          @click="reloadWorkflows"
          :loading="loading"
          class="reload-btn">
          <el-icon><Refresh /></el-icon>
          Refresh
        </el-button>
      </div>
      
      <!-- Workflow List Preview -->
      <div class="workflows-preview">
        <div 
          v-for="workflow in workflows" 
          :key="workflow.id"
          class="workflow-preview-item">
          
          <!-- Workflow Item Header -->
          <div class="workflow-item-header">
            <div class="workflow-info">
              <div class="workflow-name">{{ workflow.name }}</div>
              <div class="workflow-meta">
                <el-tag :type="getStatusForTag(workflow.status)" size="small">
                  {{ workflow.status }}
                </el-tag>
                <!-- File Review Status Tag -->
                <el-tag 
                  v-if="workflow.fileApprovalStatus" 
                  :type="getApprovalStatusType(workflow.fileApprovalStatus.value)" 
                  size="small"
                  class="approval-status-tag">
                  {{ translateApprovalLabel(workflow.fileApprovalStatus.label) }}
                </el-tag>
                <span class="workflow-id">ID: {{ workflow.sequenceId }}</span>
              </div>
            </div>
            
            <!-- 工作流进度条 -->
            <div v-if="workflow.workflowProgress" class="workflow-progress-mini">
              <el-progress 
                :percentage="workflow.workflowProgress.progress_percentage" 
                :stroke-width="4"
                :show-text="false"
                :color="getProgressColor(workflow.workflowProgress.progress_percentage)" />
              <div class="progress-mini-text">
                {{ workflow.workflowProgress.current_step_number }}/{{ workflow.workflowProgress.total_steps }}
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="workflow-actions">
              <el-button 
                size="small" 
                type="primary" 
                text
                @click.stop="toggleWorkflowExpand(workflow)"
                class="expand-btn">
                <el-icon class="expand-icon" :class="{ 'expanded': workflow.expanded }">
                  <ArrowDown />
                </el-icon>
                {{ workflow.expanded ? 'Collapse' : 'Expand' }}
              </el-button>
              <el-button 
                size="small" 
                type="info" 
                @click.stop="showWorkflowDetail(workflow)"
                class="view-btn">
                <el-icon><View /></el-icon>
                View
              </el-button>
            </div>
          </div>
          
          <!-- 工作流详细信息容器 -->
          <div class="workflow-detail-container">
            <!-- 错误状态 -->
            <div v-if="workflow.detailError && workflow.expanded" class="workflow-detail-error">
              <el-alert
                :title="workflow.detailError"
                type="error"
                :closable="false"
                show-icon />
              <el-button 
                type="primary" 
                size="small" 
                @click="retryLoadWorkflowDetail(workflow)"
                style="margin-top: 8px;">
                Retry
              </el-button>
            </div>
            
            <!-- 进度时间线（始终创建以预加载数据，通过v-show控制显示） -->
            <div 
              :class="['workflow-progress-container', { 'hidden': !workflow.expanded || workflow.detailError }]">
              <ReviewProgressHistory 
                :key="`workflow-${workflow.id}`"
                :review-id="workflow.id" 
                :project="project" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="workflows-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>Loading workflow information...</span>
    </div>
    
    <!-- 错误状态 -->
    <div v-if="error" class="workflows-error">
      <el-alert
        :title="error"
        type="error"
        :closable="false"
        show-icon />
      <el-button 
        type="primary" 
        size="small" 
        @click="loadWorkflows"
        style="margin-top: 8px;">
        Retry
      </el-button>
    </div>
    
    <!-- 无工作流状态 -->
    <div v-if="!loading && !error && hasLoaded && workflows.length === 0" class="no-workflows">
      <el-empty description="This file is not associated with any workflows" :image-size="60" />
    </div>
    
    <!-- 工作流详情弹窗 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`Workflow Details - ${selectedWorkflow?.name || ''}`"
      width="85%"
      top="5vh"
      :before-close="handleCloseDetailDialog"
      draggable
      class="workflow-detail-dialog optimized-modal">
      <div v-if="selectedWorkflow" class="dialog-content">
        <ReviewDetail 
          :review="selectedWorkflow" 
          :project="project" />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Loading, Search, Refresh, ArrowDown, View, Check, Clock, Warning, User } from '@element-plus/icons-vue'
import ReviewDetail from './ReviewDetail.vue'
import ReviewProgressHistory from './ReviewProgressHistory.vue'
import { formatDate } from '../utils/dateUtils.js'

export default {
  name: 'FileWorkflowsView',
  components: {
    Loading,
    Search,
    Refresh,
    ArrowDown,
    View,
    Check,
    Clock,
    Warning,
    User,
    ReviewDetail,
    ReviewProgressHistory
  },
  props: {
    projectId: {
      type: String,
      required: true
    },
    fileId: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      default: ''
    },
    project: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup(props) {
    // i18n
    const { t } = useI18n()
    
    // 响应式数据
    const workflows = ref([])
    const loading = ref(false)
    const error = ref('')
    const showDetailDialog = ref(false)
    const selectedWorkflow = ref(null)
    const hasLoaded = ref(false)
    
    // 加载文件关联的工作流
    const loadWorkflows = async () => {
      console.log('🔍 FileWorkflowsView - 开始加载工作流')
      
      if (!props.projectId || !props.fileId) {
        const errorMsg = `缺少必需参数 - projectId: ${props.projectId}, fileId: ${props.fileId}`
        console.error('❌', errorMsg)
        error.value = errorMsg
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        // cancel之前的请求
        if (abortController) {
          abortController.abort()
        }
        
        // 创建新的cancel控制器
        abortController = new AbortController()
        
        const apiUrl = `/api/reviews/file-workflows/${props.projectId}/${props.fileId}`
        console.log('🌐 API请求URL:', apiUrl)
        
        const response = await axios.get(apiUrl, {
          timeout: 30000,
          signal: abortController.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          params: {
            '_t': Date.now()
          }
        })
        
        console.log('📥 API响应:', response.data)
        
        if (response.data.success) {
          workflows.value = response.data.workflows || []
          hasLoaded.value = true
          
          ElMessage.success(`加载成功，找到 ${workflows.value.length} 个关联工作流`)
          
          // 自动预加载所有工作流的进度时间线数据，但保持收起状态
          if (workflows.value.length > 0) {
            ElMessage.info('正在后台预加载工作流详细信息...')
            await preloadAllWorkflowDetails()
            ElMessage.success('所有工作流详细信息预加载完成')
          }
        } else {
          throw new Error(response.data.error || '加载文件工作流失败')
        }
      } catch (err) {
        // 如果是cancel请求，不显示错误
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          console.log('🚫 FileWorkflowsView - 请求已cancel')
          return
        }
        
        console.error('加载文件工作流失败:', err)
        error.value = err.response?.data?.error || err.message || '加载文件工作流失败'
        ElMessage.error(error.value)
      } finally {
        loading.value = false
        abortController = null
      }
    }
    
    // 重新加载工作流
    const reloadWorkflows = async () => {
      console.log('🔄 FileWorkflowsView - 重新加载工作流')
      workflows.value = []
      hasLoaded.value = false
      await loadWorkflows()
    }
    
    // 显示工作流详情
    const showWorkflowDetail = (workflow) => {
      selectedWorkflow.value = workflow
      showDetailDialog.value = true
    }
    
    // 关闭工作流详情对话框
    const handleCloseDetailDialog = () => {
      showDetailDialog.value = false
      selectedWorkflow.value = null
    }
    
    // 切换工作流展开状态
    const toggleWorkflowExpand = async (workflow) => {
      if (!workflow.hasOwnProperty('expanded')) {
        workflow.expanded = false
      }
      workflow.expanded = !workflow.expanded
      
      // 展开时直接显示ReviewProgressHistory，让它自己处理loading
      // 不再需要预加载详细数据
    }
    
    // 预加载所有工作流的详细信息
    const preloadAllWorkflowDetails = async () => {
      if (!workflows.value || workflows.value.length === 0) return
      
      console.log('🔄 开始预加载所有工作流的详细信息...')
      
      // 并行加载所有工作流的详细信息
      const loadPromises = workflows.value.map(async (workflow) => {
        try {
          // 初始化工作流状态
          if (!workflow.hasOwnProperty('expanded')) {
            workflow.expanded = false // 默认收起
          }
          if (!workflow.hasOwnProperty('preloaded')) {
            workflow.preloaded = false
          }
          
          // 预加载数据但不展开
          console.log(`📥 预加载工作流 ${workflow.id} 的详细信息`)
          workflow.preloaded = true
          
          return workflow
        } catch (error) {
          console.error(`预加载工作流 ${workflow.id} 失败:`, error)
          workflow.detailError = error.message || '预加载失败'
          return workflow
        }
      })
      
      await Promise.all(loadPromises)
      console.log('✅ 所有工作流详细信息预加载完成')
    }
    
    // 重试加载工作流详情（清除错误状态）
    const retryLoadWorkflowDetail = (workflow) => {
      workflow.detailError = ''
      // ReviewProgressHistory组件会自动重新加载
    }
    
    // 工具方法
    const getStatusForTag = (status) => {
      const statusMap = {
        'OPEN': 'open',
        'CLOSED': 'closed',
        'VOID': 'void',
        'FAILED': 'failed'
      }
      return statusMap[status] || status?.toLowerCase() || 'unknown'
    }

    // 获取审阅状态对应的标签类型
    const getApprovalStatusType = (approvalValue) => {
      const approvalMap = {
        'APPROVED': 'success',
        'REJECTED': 'danger',
        'IN_REVIEW': 'warning',
        'PENDING': 'info'
      }
      return approvalMap[approvalValue] || 'info'
    }

    // 翻译审批状态标签
    const translateApprovalLabel = (label) => {
      if (!label) return label
      
      const labelMap = {
        '已批准': 'Approved',
        '已拒绝': 'Rejected',
        '已批准且带注释': 'Approved with Comments',
        '需要修改': 'Needs Revision',
        '暂停': 'On Hold',
        '取消': 'Cancelled',
        '待审批': 'Pending Approval',
        '审批中': 'In Review',
        '草稿': 'Draft'
      }
      
      return labelMap[label] || label
    }
    
    const getProgressColor = (percentage) => {
      if (percentage >= 100) return '#67c23a'
      if (percentage >= 75) return '#e6a23c'
      if (percentage >= 50) return '#409eff'
      if (percentage >= 25) return '#909399'
      return '#f56c6c'
    }
    
    const getProgressType = (percentage) => {
      if (percentage >= 100) return 'success'
      if (percentage >= 75) return 'warning'
      if (percentage >= 25) return 'primary'
      return 'info'
    }
    
    const getWorkflowsStatusType = () => {
      if (workflows.value.length === 0) return 'info'
      
      const openCount = workflows.value.filter(w => w.status === 'OPEN').length
      const closedCount = workflows.value.filter(w => w.status === 'CLOSED').length
      const voidCount = workflows.value.filter(w => w.status === 'VOID').length
      
      if (openCount > 0) return 'warning'
      if (closedCount > 0 && voidCount === 0) return 'success'
      if (voidCount > 0) return 'danger'
      return 'info'
    }
    
    const getWorkflowsStatusText = () => {
      if (workflows.value.length === 0) return 'No workflows'
      
      const openCount = workflows.value.filter(w => w.status === 'OPEN').length
      const closedCount = workflows.value.filter(w => w.status === 'CLOSED').length
      const voidCount = workflows.value.filter(w => w.status === 'VOID').length
      
      const statusParts = []
      if (openCount > 0) statusParts.push(`${openCount}${t('reviewDetail.workflowSteps.stepStatus.current')}`)
      if (closedCount > 0) statusParts.push(`${closedCount}${t('reviewDetail.workflowSteps.stepStatus.completed')}`)
      if (voidCount > 0) statusParts.push(`${voidCount}${t('reviewDetail.workflowSteps.stepStatus.rejected')}`)
      
      return statusParts.join(', ') || t('reviewDetail.workflowSteps.stepStatus.unknown')
    }
    
    const getStepTypeLabel = (type) => {
      const stepTypes = t('reviewDetail.workflowSteps.stepTypes', {}, { returnObjects: true })
      return stepTypes[type] || type
    }
    
    // 详细步骤状态相关方法
    const getDetailedStepStatus = (step, workflow) => {
      if (workflow.status === 'CLOSED' || workflow.status === 'VOID') {
        return 'completed'
      }
      
      if (step.id === workflow.currentStepId && workflow.status === 'OPEN') {
        return 'current'
      }
      
      const currentStepNum = getCurrentStepNumber(workflow.currentStepId, workflow.detailData?.detailed_steps)
      if (currentStepNum > 0 && step.step_number < currentStepNum) {
        return 'completed'
      }
      
      return 'pending'
    }
    
    const getCurrentStepNumber = (currentStepId, detailedSteps) => {
      if (!detailedSteps || !currentStepId) return 0
      const currentStep = detailedSteps.find(step => step.id === currentStepId)
      return currentStep ? currentStep.step_number : 0
    }
    
    const getDetailedStepTagType = (step, workflow) => {
      const status = getDetailedStepStatus(step, workflow)
      switch (status) {
        case 'completed':
          return 'success'
        case 'current':
          return 'primary'
        case 'pending':
          return 'info'
        default:
          return 'info'
      }
    }
    
    const getDetailedStepStatusText = (step, workflow) => {
      const status = getDetailedStepStatus(step, workflow)
      
      if (status === 'completed' && workflow.status !== 'OPEN') {
        const isLastStep = workflow.detailData?.detailed_steps && 
          step.step_number === workflow.detailData.detailed_steps.length
        
        if (isLastStep) {
          switch (workflow.status) {
            case 'CLOSED':
              return 'Approved'
            case 'VOID':
              return 'Rejected'
            default:
              return t('reviewDetail.workflowSteps.stepStatus.completed')
          }
        }
      }
      
      switch (status) {
        case 'completed':
          return t('reviewDetail.workflowSteps.stepStatus.completed')
        case 'current':
          return t('reviewDetail.workflowSteps.stepStatus.current')
        case 'pending':
          return t('reviewDetail.workflowSteps.stepStatus.pending')
        default:
          return t('reviewDetail.workflowSteps.stepStatus.unknown')
      }
    }
    
    const getStepLineStatus = (step, index, workflow) => {
      const currentStepNum = getCurrentStepNumber(workflow.currentStepId, workflow.detailData?.detailed_steps)
      const nextStep = workflow.detailData?.detailed_steps[index + 1]
      
      if (!nextStep) return 'pending'
      
      if (workflow.status === 'CLOSED' || workflow.status === 'VOID') {
        return 'completed'
      }
      
      if (currentStepNum > 0 && nextStep.step_number <= currentStepNum) {
        return 'completed'
      }
      
      return 'pending'
    }
    
    const getStepCompletionTime = (step, workflow) => {
      const status = getDetailedStepStatus(step, workflow)
      
      if (status !== 'completed') {
        return '未完成'
      }
      
      if (step.step_number === 1) {
        return `完成于 ${formatDate(workflow.createdAt)}`
      }
      
      const isLastStep = workflow.detailData?.detailed_steps && 
        step.step_number === workflow.detailData.detailed_steps.length
      
      if (isLastStep && workflow.finishedAt) {
        return `完成于 ${formatDate(workflow.finishedAt)}`
      }
      
      if (workflow.updatedAt) {
        return `约 ${formatDate(workflow.updatedAt)}`
      }
      
      return t('reviewDetail.workflowSteps.timing.timeUnknown')
    }
    
    // 使用导入的formatDate函数
    
    // 监听变化
    watch([() => props.fileId, () => props.projectId], (newValues, oldValues) => {
      const [newFileId, newProjectId] = newValues
      const [oldFileId, oldProjectId] = oldValues
      
      if ((oldFileId && newFileId !== oldFileId) || (oldProjectId && newProjectId !== oldProjectId)) {
        workflows.value = []
        hasLoaded.value = false
        loading.value = false
        error.value = ''
        showDetailDialog.value = false
        selectedWorkflow.value = null
      }
    }, { immediate: false })
    
    // cancel请求的控制器
    let abortController = null
    
    // 组件挂载时不自动加载工作流，改为手动加载
    onMounted(() => {
      console.log('🔧 FileWorkflowsView - 组件挂载')
      console.log('Props:', {
        projectId: props.projectId,
        fileId: props.fileId,
        fileName: props.fileName
      })
      
      // 不自动加载，等待用户点击
    })
    
    // 组件卸载时清理
    onUnmounted(() => {
      console.log('🧹 FileWorkflowsView - 组件卸载，清理资源')
      if (abortController) {
        abortController.abort()
        abortController = null
      }
      // 清理状态
      workflows.value = []
      hasLoaded.value = false
      loading.value = false
      error.value = ''
      showDetailDialog.value = false
      selectedWorkflow.value = null
    })
    
    return {
      t,
      workflows,
      loading,
      error,
      showDetailDialog,
      selectedWorkflow,
      hasLoaded,
      loadWorkflows,
      reloadWorkflows,
      showWorkflowDetail,
      handleCloseDetailDialog,
      toggleWorkflowExpand,
      preloadAllWorkflowDetails,
      retryLoadWorkflowDetail,
      getStatusForTag,
      getApprovalStatusType,
      translateApprovalLabel,
      getProgressColor,
      getProgressType,
      getWorkflowsStatusType,
      getWorkflowsStatusText,
      getStepTypeLabel,
      getDetailedStepStatus,
      getDetailedStepTagType,
      getDetailedStepStatusText,
      getStepLineStatus,
      getStepCompletionTime,
      formatDate
    }
  }
}
</script>

<style scoped>
/* 基础样式 */
.file-workflows-view {
  width: 100%;
}

/* 手动加载按钮样式 */
.load-workflows-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  background: #fafbfc;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 16px;
}

.load-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.prompt-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.8;
}

.prompt-text h4 {
  margin: 0 0 8px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.prompt-text p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.load-workflows-btn {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
}

.reload-btn {
  margin-left: auto;
  color: #6b7280;
}

.reload-btn:hover {
  color: #3b82f6;
}

.workflows-summary {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.workflow-icon {
  color: #3b82f6;
  font-size: 16px;
  margin-right: 4px;
}

.summary-text {
  font-weight: 500;
  color: #374151;
  flex: 1;
}

.workflows-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workflow-preview-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
  overflow: hidden;
}

.workflow-preview-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
  border-color: #3b82f6;
}

/* 工作流条目头部 */
.workflow-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.workflow-info {
  flex: 1;
  min-width: 0;
}

.workflow-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workflow-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.approval-status-tag {
  font-weight: 500;
}


.workflow-id {
  font-size: 11px;
  color: #6b7280;
  font-family: 'Consolas', 'Monaco', monospace;
}

.workflow-progress-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.workflow-progress-mini .el-progress {
  width: 60px;
}

.progress-mini-text {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

/* 工作流操作按钮 */
.workflow-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-btn .expand-icon {
  transition: transform 0.2s ease;
}

.expand-btn .expand-icon.expanded {
  transform: rotate(180deg);
}

.expand-btn,
.view-btn {
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
  line-height: 1.2;
}


/* 工作流详细信息容器 */
.workflow-detail-container {
  margin-top: 12px;
}

.workflow-progress-container {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.workflow-progress-container.hidden {
  display: none;
}

/* 工作流详细信息错误状态 */
.workflow-detail-error {
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
  margin-bottom: 12px;
}


.workflow-basic-info {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.workflow-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.workflow-status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workflow-sequence {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 4px;
}

.progress-summary {
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.current-step-info {
  color: #6b7280;
  font-size: 13px;
}







.workflows-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  color: #6b7280;
  justify-content: center;
}

.workflows-error {
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
}

.no-workflows {
  padding: 20px;
  text-align: center;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
}

/* 组件特定的模态框样式 */
.workflow-detail-dialog {
  --el-dialog-content-font-size: 14px;
}

.workflow-detail-dialog .dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workflow-item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .workflow-actions {
    align-self: stretch;
    justify-content: flex-end;
  }
  
  .workflow-progress-mini {
    align-self: stretch;
    flex-direction: row;
    justify-content: space-between;
    min-width: auto;
  }
  
  .workflow-progress-mini .el-progress {
    flex: 1;
    margin-right: 8px;
  }
  
  .workflow-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .workflow-status-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .progress-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
}
</style>
