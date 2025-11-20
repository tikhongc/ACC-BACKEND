<template>
  <div class="forms-template-list">
    <!-- 模板列表标题 -->
    <div class="template-list-header">
      <h3 class="template-list-title">
        <el-icon><Document /></el-icon>
        Forms Templates
      </h3>
      <div class="template-list-actions">
        <el-button 
          type="primary" 
          size="small" 
          :icon="Refresh" 
          :loading="loading"
          @click="fetchTemplates">
          Refresh Templates
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 错误状态 -->
    <el-alert
      v-if="error && !loading"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 16px;" />


    <!-- 模板数据表格 -->
    <DataTable
      v-if="templatesData && templatesData.templates?.data && templatesData.templates.data.length > 0 && !loading && !error"
      :data="templatesData.templates.data || []"
      :columns="tableColumns"
      :loading="loading"
      title="Forms Templates List"
      description="Available form templates for the current project"
      :operations="rowOperations"
      :show-index="true"
      @row-operation="handleRowOperation">
      
      <!-- 模板状态列 -->
      <template #status="{ row }">
        <StatusTag
          :status="getTemplateStatus(row)"
          size="small"
          :show-icon="true" />
      </template>
      
      <!-- 创建者列 -->
      <template #created-by="{ row }">
        <StatusTag 
          status="info" 
          :text="row.createdBy || 'Unknown'"
          size="small" 
          :show-icon="false" />
      </template>
      
      
    </DataTable>

    <!-- 无数据状态 -->
    <el-empty
      v-if="templatesData && (!templatesData.templates?.data || templatesData.templates.data.length === 0) && !loading && !error"
      description="No templates available for this project"
      :image-size="100" />
      
    <!-- 完全无数据状态 -->
    <el-empty
      v-if="!templatesData && !loading && !error"
      description="Failed to load templates data"
      :image-size="100" />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElSkeleton, ElAlert, ElEmpty, ElButton, ElIcon } from 'element-plus'
import { Document, Refresh, View } from '@element-plus/icons-vue'
import DataTable from './DataTable.vue'
import StatusTag from './StatusTag.vue'

export default {
  name: 'FormsTemplateList',
  components: {
    DataTable,
    StatusTag,
    ElSkeleton,
    ElAlert,
    ElEmpty,
    ElButton,
    ElIcon,
    Document,
    Refresh,
    View
  },
  props: {
    project: {
      type: Object,
      required: true
    }
  },
  emits: ['template-detail', 'templates-loaded'],
  setup(props, { emit }) {
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const templatesData = ref(null)

    // 表格列配置
    const tableColumns = computed(() => [
      {
        prop: 'name',
        label: 'Template Name',
        minWidth: 200,
        showOverflowTooltip: true
      },
      {
        prop: 'status',
        label: 'Status',
        width: 120,
        slot: 'status'
      },
      {
        prop: 'createdBy',
        label: 'Created By',
        width: 140,
        slot: 'created-by'
      },
      {
        prop: 'updatedAt',
        label: 'Updated At',
        width: 160,
        type: 'datetime'
      },
    ])

    // 行操作配置
    const rowOperations = computed(() => [
      {
        text: 'View Details',
        type: 'primary',
        icon: View,
        action: 'detail'
      }
    ])

    // 获取模板数据
    const fetchTemplates = async () => {
      if (!props.project?.id) {
        error.value = 'No project selected'
        return
      }

      loading.value = true
      error.value = ''
      
      console.log('FormsTemplateList: Fetching templates for project:', props.project.name)
      
      try {
        const response = await axios.get('/api/forms/templates', {
          timeout: 30000,
          params: {
            projectId: props.project.id
          }
        })
        
        console.log('FormsTemplateList: API Response:', response.data)
        templatesData.value = response.data
        
        // 发射模板数据到父组件
        emit('templates-loaded', response.data)
        
        ElMessage.success(`Loaded ${response.data.templates?.data?.length || 0} templates`)
      } catch (err) {
        console.error('FormsTemplateList: Failed to fetch templates:', err)
        
        if (err.code === 'ECONNABORTED') {
          error.value = 'Request timeout - please try again'
        } else if (err.response?.status === 401) {
          error.value = 'Authentication required - please login again'
        } else if (err.response?.status === 403) {
          error.value = 'Insufficient permissions to access templates'
        } else if (err.response?.status === 404) {
          error.value = 'Templates API not found'
        } else if (err.response?.status >= 500) {
          error.value = 'Server error - please try again later'
        } else {
          error.value = err.response?.data?.message || err.message || 'Failed to load templates'
        }
        
        ElMessage.error('Failed to load templates')
      } finally {
        loading.value = false
      }
    }

    // 处理行操作
    const handleRowOperation = (action, button, index) => {
      console.log('FormsTemplateList: Row operation triggered:', action, button, index)
      console.log('FormsTemplateList: Button object:', button)
      
      // 从action中提取实际的操作类型
      const actualAction = action.split(':')[0]
      
      // 优先使用button中的row数据，如果没有则使用index获取
      const row = button?.row || templatesData.value?.templates?.data?.[index]
      
      if (!row) {
        ElMessage.error('Unable to get template data')
        return
      }
      
      console.log('FormsTemplateList: Selected template:', row)
      console.log('FormsTemplateList: Template ID:', row.id)
      console.log('FormsTemplateList: Template Name:', row.name)
      
      switch (actualAction) {
        case 'detail':
          // 发射事件到父组件
          emit('template-detail', row)
          ElMessage.success(`Opening template details: ${row.name}`)
          break
        default:
          ElMessage.info(`Action: ${actualAction}`)
          break
      }
    }

    // 获取模板状态
    const getTemplateStatus = (template) => {
      if (!template) return 'unknown'
      
      // 根据模板的状态字段返回相应的状态
      if (template.status) {
        return template.status.toLowerCase()
      }
      
      // 如果没有明确的状态，根据其他字段推断
      if (template.isActive === false) {
        return 'inactive'
      }
      
      if (template.formsCount > 0) {
        return 'active'
      }
      
      return 'draft'
    }

    // 组件挂载时获取数据
    onMounted(() => {
      if (props.project?.id) {
        fetchTemplates()
      }
    })

    return {
      // 响应式数据
      loading,
      error,
      templatesData,
      
      // 计算属性
      tableColumns,
      rowOperations,
      
      // 方法
      fetchTemplates,
      handleRowOperation,
      getTemplateStatus,
      
      // 图标
      Document,
      Refresh,
      View
    }
  }
}
</script>

<style scoped>
.forms-template-list {
  margin-top: 24px;
}

.template-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

.template-list-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.template-list-actions {
  display: flex;
  gap: 12px;
}

.loading-container {
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .template-list-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>