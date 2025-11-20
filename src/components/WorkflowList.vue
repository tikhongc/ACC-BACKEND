<template>
  <BaseCard 
    title="🔄 Approval Workflows"
    :show-header="true"
    :collapsible="true"
    :default-collapsed="false"
    class="workflow-list-card">
    
    <template #header-actions>
      <el-button 
        type="primary" 
        size="small" 
        :icon="Refresh"
        :loading="loading"
        @click="fetchWorkflows">
        {{ t('common.refresh') }}
      </el-button>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="workflow-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>Loading workflows...</span>
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
        @click="fetchWorkflows"
        style="margin-top: 8px;">
        Retry Loading
      </el-button>
    </div>

    <!-- 工作流列表 -->
    <div v-else-if="workflowsData && workflowsData.workflows" class="workflow-content">
      <!-- 统计信息 -->
      <div v-if="workflowsData.stats" class="workflow-stats">
        <div class="stat-item">
          <div class="stat-label">Total Workflows</div>
          <div class="stat-value primary">{{ workflowsData.stats.total_workflows || 0 }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Active</div>
          <div class="stat-value success">{{ workflowsData.stats.active_workflows || 0 }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Inactive</div>
          <div class="stat-value warning">{{ workflowsData.stats.inactive_workflows || 0 }}</div>
        </div>
      </div>

      <!-- 工作流表格 -->
      <DataTable
        :data="workflowsData.workflows || []"
        :columns="tableColumns"
        :loading="loading"
        title="Workflow Templates"
        description="Click 'View Details' to see workflow configuration"
        :operations="rowOperations"
        :show-index="true"
        row-key="id"
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
    </div>

    <!-- 无数据状态 -->
    <div v-else class="no-workflows">
      <el-empty description="No workflows found" />
    </div>
  </BaseCard>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Refresh, Loading, View } from '@element-plus/icons-vue'
import BaseCard from './BaseCard.vue'
import DataTable from './DataTable.vue'
import StatusTag from './StatusTag.vue'

export default {
  name: 'WorkflowList',
  components: {
    BaseCard,
    DataTable,
    StatusTag,
    Loading
  },
  props: {
    project: {
      type: Object,
      required: true
    }
  },
  emits: ['workflow-detail'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    // 响应式数据
    const workflowsData = ref(null)
    const loading = ref(false)
    const error = ref('')
    
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
        label: 'Steps',
        width: 80,
        slot: 'steps-count'
      },
      {
        prop: 'approval_options_count',
        label: 'Options',
        width: 80
      },
      {
        prop: 'created_at',
        label: 'Created',
        width: 140,
        slot: 'created-at',
        sortable: true
      },
      {
        prop: 'updated_at',
        label: 'Updated',
        width: 140,
        slot: 'updated-at',
        sortable: true
      }
    ]
    
    const rowOperations = [
      {
        text: 'View Details',
        type: 'primary',
        icon: View,
        action: 'detail'
      }
    ]
    
    // 获取工作流数据
    const fetchWorkflows = async () => {
      if (!props.project?.id) {
        error.value = 'Missing project information'
        return
      }

      loading.value = true
      error.value = ''
      
      console.log('WorkflowList: Fetching workflows for project:', props.project.id)
      
      try {
        const response = await axios.get('/api/reviews/workflows/jarvis', {
          timeout: 30000,
          params: {
            projectId: props.project.id
          }
        })
        
        if (response.data.success) {
          workflowsData.value = response.data
          console.log('WorkflowList: Workflows loaded successfully:', response.data.workflows?.length)
        } else {
          throw new Error(response.data.error || 'Failed to load workflows')
        }
      } catch (err) {
        console.error('WorkflowList: Failed to fetch workflows:', err)
        error.value = err.response?.data?.error || err.message || 'Failed to load workflows'
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }
    
    // 处理行操作
    const handleRowOperation = (action, button, index) => {
      console.log('WorkflowList: Row operation triggered:', action, button, index)
      console.log('WorkflowList: Button object:', button)
      
      // 从action中提取实际的操作类型
      const actualAction = action.split(':')[0]
      
      // 优先使用button中的row数据，如果没有则使用index获取
      const row = button?.row || workflowsData.value?.workflows?.[index]
      
      if (!row) {
        ElMessage.error('Unable to get workflow data')
        return
      }
      
      console.log('WorkflowList: Selected workflow:', row)
      console.log('WorkflowList: Workflow ID:', row.id)
      console.log('WorkflowList: Workflow Name:', row.name)
      
      switch (actualAction) {
        case 'detail':
          // 发射事件到父组件
          emit('workflow-detail', row)
          ElMessage.success(`Opening workflow details: ${row.name}`)
          break
        default:
          ElMessage.info(`Action: ${actualAction}`)
          break
      }
    }
    
    // 监听项目变化
    watch(() => props.project, (newProject) => {
      if (newProject?.id) {
        fetchWorkflows()
      }
    }, { immediate: true })
    
    // 组件挂载时获取数据
    onMounted(() => {
      if (props.project?.id) {
        fetchWorkflows()
      }
    })
    
    return {
      // i18n
      t,
      
      // 响应式数据
      workflowsData,
      loading,
      error,
      
      // 配置
      tableColumns,
      rowOperations,
      
      // 图标
      Refresh,
      View,
      
      // 方法
      fetchWorkflows,
      handleRowOperation
    }
  }
}
</script>

<style scoped>
.workflow-list-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
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
  gap: 16px;
}

.workflow-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
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

.no-workflows {
  padding: 40px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workflow-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
