<template>
  <div class="approval-workflows">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      :title="t('approvalWorkflows.title')"
      :description="t('approvalWorkflows.description')"
      :tag="t('approvalWorkflows.tag')"
      tag-type="primary"
      :action-buttons="headerButtons"
      @action="handleHeaderAction" />

    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      :title="t('approvalWorkflows.loading.title')"
      :text="t('approvalWorkflows.loading.text')"
      :show-progress="false"
      :show-cancel="true"
      @cancel="cancelLoading" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error"
      type="card"
      severity="error"
      :title="t('approvalWorkflows.error.title')"
      :message="error"
      :suggestions="errorSuggestions"
      :action-buttons="errorButtons"
      @action="handleErrorAction" />

    <!-- 成功状态指示器 -->
    <StatusIndicator
      v-if="workflowsData && !loading && !error"
      status="success"
      :title="t('approvalWorkflows.success.title')"
      :description="t('approvalWorkflows.success.description', { count: workflowsData.workflows?.length || 0 })"
      :details="t('approvalWorkflows.success.lastUpdated', { time: new Date().toLocaleString('zh-CN') })"
      size="default"
      style="margin-bottom: 24px;" />

    <!-- 查询信息卡片 -->
    <QueryInfoCard
      v-if="workflowsData && !loading && !error"
      title="Approval Workflows Query"
      api-endpoint="/api/reviews/workflows/jarvis"
      description="Get all approval workflow configurations for isBIM JARVIS 2025 Dev project"
      :result-count="workflowsData.workflows?.length || 0"
      result-unit="workflows"
      :custom-fields="getWorkflowsQueryFields()" />

    <!-- 工作流详情弹窗 -->
    <el-dialog
      v-model="showWorkflowDialog"
      :title="`Workflow Template - ${selectedWorkflow?.name || ''}`"
      width="90%"
      :before-close="handleCloseDialog"
      draggable
      destroy-on-close
      class="workflow-dialog">
      <div v-if="selectedWorkflow" class="dialog-content">
        <SingleWorkflowDetail 
          :key="workflowDetailKey"
          :workflow-id="selectedWorkflowId" 
          :project="currentProject" />
      </div>
    </el-dialog>

    <!-- 工作流数据内容 -->
    <div v-if="workflowsData && !loading && !error">
      <!-- 工作流统计卡片 -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <BaseCard 
          title="📊 Workflow Statistics"
          :show-header="true"
          :collapsible="true"
          :default-collapsed="false">
          <div class="stats-content">
            <div class="stat-item">
              <div class="stat-label">Total Workflows</div>
              <div class="stat-value primary">{{ workflowsData.stats?.total_workflows || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Active Workflows</div>
              <div class="stat-value success">{{ workflowsData.stats?.active_workflows || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Inactive Workflows</div>
              <div class="stat-value warning">{{ workflowsData.stats?.inactive_workflows || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Average Steps</div>
              <div class="stat-value info">{{ workflowsData.stats?.avg_steps_per_workflow || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">File Copy Support</div>
              <div class="stat-value primary">{{ workflowsData.stats?.workflows_with_copy_files || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Additional Attributes</div>
              <div class="stat-value info">{{ workflowsData.stats?.workflows_with_attributes || 0 }}</div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- 工作流数据表格 -->
      <DataTable
        :data="workflowsData.workflows || []"
        :columns="tableColumns"
        :loading="loading"
        title="🔄 Approval Workflow Details"
        description="Expand each row to view detailed workflow configuration and step information"
        :action-buttons="tableActions"
        :operations="rowOperations"
        :show-index="true"
        @action="handleTableAction"
        @row-operation="handleRowOperation">
        
        <!-- 工作流状态列 -->
        <template #status="{ row }">
          <StatusTag
            :status="row.status === 'ACTIVE' ? 'active' : 'inactive'"
            :text="row.status"
            size="small"
            :show-icon="false" />
        </template>
        
        <!-- 步骤数量列 -->
        <template #steps-count="{ row }">
          <StatusTag 
            status="info" 
            :text="`${row.steps_count} Steps`"
            size="small" 
            :show-icon="false" />
        </template>
        
        <!-- 创建时间列 -->
        <template #created-at="{ row }">
          <span class="timestamp">{{ row.created_at }}</span>
        </template>
        
        <!-- 更新时间列 -->
        <template #updated-at="{ row }">
          <span class="timestamp">{{ row.updated_at }}</span>
        </template>
        
      </DataTable>
      
      <!-- 详细分析数据 -->
      <BaseCard 
        v-if="workflowsData.detailed_analysis && workflowsData.detailed_analysis.length > 0"
        title="📋 Detailed Workflow Analysis"
        :show-header="true"
        :collapsible="true"
        :default-collapsed="true"
        style="margin-top: 24px;">
        <JsonViewer 
          :data="workflowsData.detailed_analysis"
          title="Workflow Detailed Analysis Data"
          :max-height="600" />
      </BaseCard>
      
      <!-- 原始数据 -->
      <BaseCard 
        title="🔍 Raw API Data"
        :show-header="true"
        :collapsible="true"
        :default-collapsed="true"
        style="margin-top: 24px;">
        <JsonViewer 
          :data="workflowsData.raw_data"
          title="Autodesk Construction Cloud API Raw Response"
          :max-height="600" />
      </BaseCard>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import Breadcrumb from '../components/Breadcrumb.vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import StatusIndicator from '../components/StatusIndicator.vue'
import QueryInfoCard from '../components/QueryInfoCard.vue'
import DataTable from '../components/DataTable.vue'
import BaseCard from '../components/BaseCard.vue'
import JsonViewer from '../components/JsonViewer.vue'
import StatusTag from '../components/StatusTag.vue'
import SingleWorkflowDetail from '../components/SingleWorkflowDetail.vue'

// 图标导入
import { 
  Document as IconWorkflow,
  Refresh,
  Download,
  Setting,
  View,
  Search,
  Filter
} from '@element-plus/icons-vue'

export default {
  name: 'ApprovalWorkflows',
  components: {
    Breadcrumb,
    PageHeader,
    LoadingState,
    ErrorState,
    StatusIndicator,
    QueryInfoCard,
    DataTable,
    BaseCard,
    JsonViewer,
    StatusTag,
    SingleWorkflowDetail
  },
  setup() {
    const { t } = useI18n()
    
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const workflowsData = ref(null)
    const showWorkflowDialog = ref(false)
    const selectedWorkflow = ref(null)
    const currentProject = ref(null) // 项目ID将从URL参数或localStorage获取
    
    // 页面头部配置
    const headerButtons = reactive([
      {
        text: t('approvalWorkflows.actions.refresh'),
        type: 'primary',
        icon: Refresh,
        action: 'refresh'
      },
      {
        text: t('approvalWorkflows.actions.export'),
        type: 'default',
        icon: Download,
        action: 'export'
      },
      {
        text: t('approvalWorkflows.actions.settings'),
        type: 'default',
        icon: Setting,
        action: 'settings'
      }
    ])
    
    // 计算属性：头部统计
    const headerStats = computed(() => {
      if (!workflowsData.value?.stats) return []
      
      const stats = workflowsData.value.stats
      return [
        {
          label: 'Total Workflows',
          value: stats.total_workflows || 0,
          type: 'primary'
        },
        {
          label: 'Active Workflows',
          value: stats.active_workflows || 0,
          type: 'success'
        },
        {
          label: 'Average Steps',
          value: stats.avg_steps_per_workflow || 0,
          type: 'info'
        }
      ]
    })

    // 计算属性：工作流相关的键和ID
    const selectedWorkflowId = computed(() => {
      return selectedWorkflow.value ? String(selectedWorkflow.value.id) : ''
    })

    const workflowDetailKey = computed(() => {
      return selectedWorkflow.value ? `workflow-detail-${selectedWorkflow.value.id}` : 'workflow-detail-empty'
    })
    
    // 表格配置
    const tableColumns = [
      {
        prop: 'name',
        label: 'Workflow Name',
        minWidth: 200,
        sortable: true
      },
      {
        prop: 'status',
        label: 'Status',
        width: 100,
        slot: 'status'
      },
      {
        prop: 'steps_count',
        label: 'Steps Count',
        width: 100,
        slot: 'steps-count'
      },
      {
        prop: 'approval_options_count',
        label: 'Approval Options',
        width: 100
      },
      {
        prop: 'created_at',
        label: 'Created Time',
        width: 160,
        slot: 'created-at',
        sortable: true
      },
      {
        prop: 'updated_at',
        label: 'Updated Time',
        width: 160,
        slot: 'updated-at',
        sortable: true
      }
    ]
    
    const tableActions = [
      {
        text: 'Search',
        type: 'primary',
        icon: Search,
        action: 'search'
      },
      {
        text: 'Filter',
        type: 'default',
        icon: Filter,
        action: 'filter'
      }
    ]
    
    const rowOperations = [
      {
        text: 'View Details',
        type: 'primary',
        icon: View,
        action: 'check'
      }
    ]
    
    // 错误处理配置
    const errorSuggestions = [
      'Check if network connection is normal',
      'Confirm Autodesk account authentication is completed',
      'Verify project access permissions',
      'Check API service status'
    ]
    
    const errorButtons = [
      {
        text: 'Re-authenticate',
        type: 'primary',
        action: 'reauth'
      },
      {
        text: 'Retry',
        type: 'default',
        action: 'retry'
      }
    ]
    
    // 获取工作流数据
    const fetchWorkflowsData = async () => {
      if (!currentProject.value?.id) {
        error.value = 'Missing project information, please select a project first'
        console.error('ApprovalWorkflows: 缺少项目信息')
        return
      }

      loading.value = true
      error.value = ''
      
      console.log('ApprovalWorkflows: 开始获取工作流数据，项目ID:', currentProject.value.id)
      
      try {
         const response = await axios.get('/api/reviews/workflows/jarvis', {
          timeout: 30000,
          params: {
            projectId: currentProject.value.id
          }
        })
        
        if (response.data.success) {
          workflowsData.value = response.data
          console.log('API Response workflows:', response.data.workflows?.map(w => ({ id: w.id, name: w.name })))
          console.log('API Response raw_data:', response.data.raw_data?.map(w => ({ id: w.id, name: w.name })))
          ElMessage.success('Workflow data retrieved successfully')
        } else {
          throw new Error(response.data.error || 'Failed to retrieve data')
        }
      } catch (err) {
        console.error('获取工作流数据失败:', err)
        error.value = err.response?.data?.error || err.message || 'Failed to retrieve workflow data'
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }
    
    // cancel加载
    const cancelLoading = () => {
      loading.value = false
      ElMessage.info('Data retrieval cancelled')
    }
    
    // 处理头部操作
    const handleHeaderAction = (action) => {
      switch (action) {
        case 'refresh':
          fetchWorkflowsData()
          break
        case 'export':
          exportWorkflowsData()
          break
        case 'settings':
          ElMessage.info('Configuration feature under development')
          break
      }
    }
    
    // 处理错误操作
    const handleErrorAction = (action) => {
      switch (action) {
        case 'reauth':
          window.location.href = '/login'
          break
        case 'retry':
          fetchWorkflowsData()
          break
      }
    }
    
    // 处理表格操作
    const handleTableAction = (action) => {
      switch (action) {
        case 'search':
          ElMessage.info('Search feature under development')
          break
        case 'filter':
          ElMessage.info('Filter feature under development')
          break
      }
    }
    
    // 处理行操作
    const handleRowOperation = (action, button, index) => {
      console.log('Row operation triggered:', action, button, index)
      console.log('All workflows data:', workflowsData.value?.workflows?.map(w => ({ id: w.id, name: w.name })))
      
      // 从action中提取实际的操作类型和行索引
      const actionParts = action.split(':')
      const actualAction = actionParts[0]
      const rowIndex = actionParts.length > 1 ? parseInt(actionParts[1]) : index
      
      console.log('Extracted action:', actualAction, 'Row index:', rowIndex)
      
      // 获取对应行的数据
      const row = workflowsData.value?.workflows?.[rowIndex]
      
      if (!row) {
        ElMessage.error('Unable to get row data')
        return
      }
      
      console.log('Selected workflow row:', row)
      console.log('Workflow ID:', row.id)
      console.log('Used index:', rowIndex, 'Total workflows:', workflowsData.value?.workflows?.length)
      
      switch (actualAction) {
        case 'check':
        case 'view':
          // 打开工作流详情弹窗
          console.log('Row data before selection:', row)
          console.log('Row ID:', row.id)
          selectedWorkflow.value = getWorkflowForDiagram(row)
          console.log('Selected workflow for dialog:', selectedWorkflow.value)
          console.log('Selected workflow ID:', selectedWorkflow.value?.id)
          showWorkflowDialog.value = true
          ElMessage.success(`Viewing workflow: ${row.name}`)
          break
        default:
          ElMessage.info(`Action: ${actualAction}`)
          break
      }
    }
    
    // 导出数据
    const exportWorkflowsData = () => {
      if (!workflowsData.value) {
        ElMessage.warning('No data to export')
        return
      }
      
      try {
        const dataStr = JSON.stringify(workflowsData.value, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `approval-workflows-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        ElMessage.success('Data export successful')
      } catch (err) {
        console.error('导出失败:', err)
        ElMessage.error('Export failed')
      }
    }
    
    // 获取查询字段信息
    const getWorkflowsQueryFields = () => {
      if (!workflowsData.value) return []
      
      return [
        {
          label: 'Project ID',
          value: workflowsData.value.project_id || 'N/A',
          type: 'code'
        },
        {
          label: 'Query Parameters',
          value: JSON.stringify(workflowsData.value.query_params || {}),
          type: 'json'
        },
        {
          label: 'Pagination Info',
          value: JSON.stringify(workflowsData.value.pagination || {}),
          type: 'json'
        },
        {
          label: 'Check Time',
          value: workflowsData.value.timestamp || 'N/A',
          type: 'timestamp'
        }
      ]
    }
    
    // 为图表组件准备工作流数据
    const getWorkflowForDiagram = (row) => {
      console.log('getWorkflowForDiagram called with row:', row)
      console.log('Looking for workflow ID:', row.id)
      console.log('Row ID type:', typeof row.id)
      console.log('Available raw_data:', workflowsData.value?.raw_data?.map(w => ({ id: w.id, name: w.name, idType: typeof w.id })))
      
      // 从原始数据中找到对应的完整工作流数据
      const rawWorkflow = workflowsData.value?.raw_data?.find(w => {
        console.log(`Comparing: ${w.id} (${typeof w.id}) === ${row.id} (${typeof row.id})`)
        return w.id === row.id || w.id === String(row.id) || String(w.id) === String(row.id)
      })
      if (rawWorkflow) {
        console.log('Found raw workflow:', rawWorkflow.name, 'with ID:', rawWorkflow.id)
        return rawWorkflow
      }
      
      console.log('Raw workflow not found, constructing from processed data')
      // 如果找不到原始数据，使用处理过的数据构造
      const constructedWorkflow = {
        id: row.id,
        name: row.name,
        description: row.description || '',
        notes: row.notes || '',
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        steps: row.steps || [],
        approvalStatusOptions: row.approval_status_options || [],
        copyFilesOptions: row.copy_files_options || {},
        additionalOptions: row.additional_options || {},
        attachedAttributes: row.attached_attributes || [],
        updateAttributesOptions: row.update_attributes_options || {}
      }
      
      console.log('Constructed workflow:', constructedWorkflow)
      return constructedWorkflow
    }
    
    // 关闭弹窗处理
    const handleCloseDialog = () => {
      showWorkflowDialog.value = false
      selectedWorkflow.value = null
    }
    
    // 初始化项目信息
    const initializeProject = async () => {
      const route = getCurrentInstance().appContext.config.globalProperties.$route
      const projectId = route.query.projectId
      const projectName = route.query.projectName
      
      if (projectId) {
        // 从URL参数获取项目信息
        currentProject.value = {
          id: projectId,
          name: projectName || projectId
        }
        console.log('ApprovalWorkflows: 从URL获取项目信息:', currentProject.value)
      } else {
        // 尝试从localStorage获取之前选择的项目
        try {
          const savedProject = JSON.parse(localStorage.getItem('selectedProject'))
          if (savedProject && savedProject.id) {
            currentProject.value = savedProject
            console.log('ApprovalWorkflows: 从localStorage获取项目信息:', currentProject.value)
          }
        } catch (error) {
          console.warn('ApprovalWorkflows: 获取保存的项目信息失败:', error)
        }
      }

      if (!currentProject.value?.id) {
        console.warn('ApprovalWorkflows: 未找到项目信息')
        error.value = 'Missing project information, please select a project first'
        return
      }
    }

    // 组件挂载时初始化项目并获取数据
    onMounted(async () => {
      await initializeProject()
      if (currentProject.value?.id) {
        fetchWorkflowsData()
      }
    })
    
    return {
      // i18n
      t,
      
      // 响应式数据
      loading,
      error,
      workflowsData,
      showWorkflowDialog,
      selectedWorkflow,
      
      // 配置
      headerButtons,
      headerStats,
      tableColumns,
      tableActions,
      rowOperations,
      errorSuggestions,
      errorButtons,

      // 计算属性
      selectedWorkflowId,
      workflowDetailKey,
      
      // 图标
      IconWorkflow,
      
      // 方法
      fetchWorkflowsData,
      cancelLoading,
      handleHeaderAction,
      handleErrorAction,
      handleTableAction,
      handleRowOperation,
      exportWorkflowsData,
      getWorkflowsQueryFields,
      getWorkflowForDiagram,
      handleCloseDialog,
      currentProject
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.approval-workflows {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.stats-grid {
  display: grid;
  gap: 20px;
}

.stats-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  padding: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.stat-value.primary { color: #409eff; }
.stat-value.success { color: #67c23a; }
.stat-value.warning { color: #e6a23c; }
.stat-value.info { color: #909399; }


.timestamp {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #666;
}

.workflow-expand-content {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin: 8px 0;
}

/* 弹窗样式 */
.workflow-dialog {
  --el-dialog-border-radius: 12px;
}

.workflow-dialog :deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.workflow-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
}

.workflow-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.workflow-dialog :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
}

.workflow-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 20px;
}

.workflow-dialog :deep(.el-dialog__headerbtn .el-dialog__close):hover {
  color: #f0f0f0;
}

.workflow-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: #f8fafc;
  border-radius: 0 0 12px 12px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-content {
  padding: 20px;
}

.workflow-details {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
  margin: 10px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
  font-size: 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.detail-item strong {
  min-width: 80px;
  color: #606266;
  font-size: 12px;
}

.detail-item code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #e74c3c;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-item {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.step-header strong {
  flex: 1;
  color: #303133;
}

.step-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #606266;
}

.candidates-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.candidates-info > div {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.candidates-info strong {
  min-width: 50px;
  font-size: 12px;
  color: #909399;
}

.approval-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.copy-files-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  font-size: 13px;
}

.copy-files-info > div {
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.copy-files-info strong {
  color: #606266;
  margin-right: 8px;
}

.copy-files-info code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #e74c3c;
  word-break: break-all;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .approval-workflows {
    padding: 10px;
  }
  
  .stats-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .step-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .candidates-info > div {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
