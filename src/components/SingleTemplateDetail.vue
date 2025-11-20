<template>
  <div class="single-template-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
      <div class="loading-text">Loading template details...</div>
    </div>

    <!-- 错误状态 -->
    <el-alert
      v-if="error && !loading"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 16px;" />

    <!-- 模板详情内容 -->
    <div v-if="templateData && !loading && !error" class="template-detail-content">
      
      <!-- 描述信息 -->
      <el-card v-if="templateData.description" class="description-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>Description & Notes</span>
          </div>
        </template>
        
        <div class="description-content">
          {{ templateData.description }}
        </div>
      </el-card>
      
      <!-- basicInfo卡片 -->
      <el-card class="info-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>Template Information</span>
          </div>
        </template>
        
        <div class="info-grid">
          <div class="info-item">
            <label>Template Name:</label>
            <span class="info-value">{{ templateData.name || 'N/A' }}</span>
          </div>
          
          <div class="info-item">
            <label>Template ID:</label>
            <span class="info-value template-id">{{ templateData.id || 'N/A' }}</span>
          </div>
          
          <div class="info-item">
            <label>Status:</label>
            <StatusTag 
              :status="getTemplateStatus(templateData.status)" 
              :text="templateData.status || 'Unknown'"
              size="small" 
              :show-icon="true" />
          </div>
          
          <div class="info-item">
            <label>Template Type:</label>
            <span class="info-value">{{ getTemplateTypeDisplay(templateData.templateType) }}</span>
          </div>
          
          <div class="info-item">
            <label>Created By:</label>
            <StatusTag 
              :status="getCreatedByStatus(templateData.createdBy)"
              :text="templateData.createdBy || 'Unknown'"
              size="small" 
              :show-icon="false" />
          </div>
          
          <div class="info-item">
            <label>Updated At:</label>
            <span class="info-value">{{ formatDate(templateData.updatedAt) }}</span>
          </div>
          
          <div class="info-item">
            <label>PDF Template:</label>
            <StatusTag 
              :status="templateData.isPdf ? 'success' : 'info'"
              :text="templateData.isPdf ? 'Yes' : 'No'"
              size="small" 
              :show-icon="true" />
          </div>
          
          <div class="info-item">
            <label>Project ID:</label>
            <span class="info-value template-id">{{ templateData.projectId || 'N/A' }}</span>
          </div>
        </div>
      </el-card>

      <!-- 表单字段信息 -->
      <el-card v-if="templateData.fields && templateData.fields.length > 0" class="fields-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><List /></el-icon>
            <span>Form Fields ({{ templateData.fields.length }})</span>
          </div>
        </template>
        
        <div class="fields-grid">
          <div v-for="(field, index) in templateData.fields" :key="index" class="field-item">
            <div class="field-header">
              <span class="field-name">{{ field.name || field.label || `Field ${index + 1}` }}</span>
              <StatusTag 
                :status="getFieldTypeStatus(field.type)" 
                :text="field.type || 'text'"
                size="small" 
                :show-icon="false" />
            </div>
            <div v-if="field.description" class="field-description">
              {{ field.description }}
            </div>
            <div class="field-properties">
              <span v-if="field.required" class="field-required">Required</span>
              <span v-if="field.readonly" class="field-readonly">Read Only</span>
              <span v-if="field.hidden" class="field-hidden">Hidden</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 权限信息 -->
      <el-card v-if="hasPermissionInfo" class="permissions-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>Permissions & Access Control</span>
          </div>
        </template>
        
        <!-- 组权限 -->
        <div v-if="templateData.groupPermissions && templateData.groupPermissions.length > 0" class="permission-section">
          <h4>Group Permissions</h4>
          <div class="permissions-grid">
            <div v-for="(group, index) in templateData.groupPermissions" :key="index" class="permission-item">
              <div class="permission-header">
                <StatusTag 
                  status="primary" 
                  :text="group.roleName || group.roleKey"
                  size="small" 
                  :show-icon="false" />
              </div>
              <div class="permission-details">
                <div class="role-key">{{ group.roleKey }}</div>
                <div class="permission-list">
                  <StatusTag 
                    v-for="permission in group.permissions" 
                    :key="permission"
                    :status="getPermissionStatus(permission)"
                    :text="permission"
                    size="small" 
                    :show-icon="false"
                    style="margin-right: 4px; margin-bottom: 4px;" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户权限 -->
        <div v-if="templateData.userPermissions && templateData.userPermissions.length > 0" class="permission-section">
          <h4>User Permissions</h4>
          <div class="permissions-grid">
            <div v-for="(user, index) in templateData.userPermissions" :key="index" class="permission-item">
              <div class="permission-header">
                <StatusTag 
                  status="info" 
                  :text="user.userName || user.userId"
                  size="small" 
                  :show-icon="false" />
              </div>
              <div class="permission-details">
                <div class="permission-list">
                  <StatusTag 
                    v-for="permission in user.permissions" 
                    :key="permission"
                    :status="getPermissionStatus(permission)"
                    :text="permission"
                    size="small" 
                    :show-icon="false"
                    style="margin-right: 4px; margin-bottom: 4px;" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无权限提示 -->
        <div v-if="(!templateData.groupPermissions || templateData.groupPermissions.length === 0) && 
                   (!templateData.userPermissions || templateData.userPermissions.length === 0)" 
             class="no-permissions">
          <el-alert
            title="No specific permissions configured"
            type="info"
            :closable="false"
            show-icon />
        </div>
      </el-card>

      <!-- Forms URL信息 -->
      <el-card v-if="templateData.forms?.url" class="forms-url-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><List /></el-icon>
            <span>Related Forms</span>
          </div>
        </template>
        
        <div class="forms-url-content">
          <div class="url-item">
            <label>Forms API Endpoint:</label>
            <div class="url-value">
              <code>{{ templateData.forms.url }}</code>
              <el-button 
                type="text" 
                size="small" 
                @click="copyToClipboard(templateData.forms.url)"
                style="margin-left: 8px;">
                Copy
              </el-button>
            </div>
          </div>
          <div class="url-description">
            <el-alert
              title="This endpoint can be used to retrieve all forms created from this template"
              type="info"
              :closable="false"
              show-icon />
          </div>
        </div>
      </el-card>

      <!-- 统计信息 -->
      <el-card class="stats-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><DataAnalysis /></el-icon>
            <span>Statistics</span>
          </div>
        </template>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ templateData.groupPermissions?.length || 0 }}</div>
            <div class="stat-label">Group Permissions</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-number">{{ templateData.userPermissions?.length || 0 }}</div>
            <div class="stat-label">User Permissions</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-number">{{ getTotalPermissions() }}</div>
            <div class="stat-label">Total Permission Types</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-number">{{ templateData.isPdf ? 'PDF' : 'Digital' }}</div>
            <div class="stat-label">Template Format</div>
          </div>
        </div>
      </el-card>

      <!-- 原始数据查看器 -->
      <el-card class="raw-data-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><View /></el-icon>
            <span>Raw Template Data</span>
          </div>
        </template>
        
        <JsonViewer 
          :data="templateData"
          title="Template Raw Data"
          :collapsible="true"
          :show-controls="true"
          :max-height="400" />
      </el-card>
    </div>

    <!-- 无数据状态 -->
    <el-empty
      v-if="!templateData && !loading && !error"
      description="No template data available"
      :image-size="100" />
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { ElMessage, ElSkeleton, ElAlert, ElEmpty, ElCard, ElIcon } from 'element-plus'
import { Document, List, User, DataAnalysis, View } from '@element-plus/icons-vue'
import StatusTag from './StatusTag.vue'
import JsonViewer from './JsonViewer.vue'

export default {
  name: 'SingleTemplateDetail',
  components: {
    StatusTag,
    JsonViewer,
    ElSkeleton,
    ElAlert,
    ElEmpty,
    ElCard,
    ElIcon,
    Document,
    List,
    User,
    DataAnalysis,
    View
  },
  props: {
    templateId: {
      type: String,
      required: true
    },
    project: {
      type: Object,
      required: true
    },
    templateData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const templateData = ref(null)

    // 如果传入了templateData prop，直接使用它
    if (props.templateData) {
      templateData.value = props.templateData
    }

    // 计算属性：是否有权限信息
    const hasPermissionInfo = computed(() => {
      if (!templateData.value) return false
      return (templateData.value.groupPermissions && templateData.value.groupPermissions.length > 0) ||
             (templateData.value.userPermissions && templateData.value.userPermissions.length > 0)
    })

    // 获取模板详情
    const fetchTemplateDetail = async () => {
      // 如果已经有templateData prop，不需要再获取
      if (props.templateData) {
        console.log('SingleTemplateDetail: Using provided template data')
        return
      }

      if (!props.templateId || !props.project?.id) {
        error.value = 'Missing template ID or project information'
        return
      }

      loading.value = true
      error.value = ''
      
      console.log('SingleTemplateDetail: Loading template detail for ID:', props.templateId)
      console.log('SingleTemplateDetail: Project ID:', props.project.id)
      
      const apiUrl = `/api/forms/templates/${props.templateId}`
      console.log('SingleTemplateDetail: API URL:', apiUrl)
      
      try {
        const response = await axios.get(apiUrl, {
          timeout: 30000,
          params: {
            projectId: props.project.id
          }
        })
        
        console.log('SingleTemplateDetail: API Response:', response.data)
        templateData.value = response.data
        
      } catch (err) {
        console.error('SingleTemplateDetail: Failed to fetch template detail:', err)
        
        if (err.code === 'ECONNABORTED') {
          error.value = 'Request timeout - please try again'
        } else if (err.response?.status === 401) {
          error.value = 'Authentication required - please login again'
        } else if (err.response?.status === 403) {
          error.value = 'Insufficient permissions to access template details'
        } else if (err.response?.status === 404) {
          error.value = 'Template not found - using basic template information'
          // 对于404错误，我们可以使用基本的模板信息
          templateData.value = {
            id: props.templateId,
            name: 'Template Details',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            description: 'Template details not available from API'
          }
        } else if (err.response?.status >= 500) {
          error.value = 'Server error - please try again later'
        } else {
          error.value = err.response?.data?.message || err.message || 'Failed to load template details'
        }
        
        if (err.response?.status !== 404) {
          ElMessage.error('Failed to load template details')
        }
      } finally {
        loading.value = false
      }
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      try {
        return new Date(dateString).toLocaleString('en-US')
      } catch {
        return dateString
      }
    }

    // 获取模板状态
    const getTemplateStatus = (template) => {
      if (!template) return 'unknown'
      
      if (template.status) {
        return template.status.toLowerCase()
      }
      
      if (template.isActive === false) {
        return 'inactive'
      }
      
      if (template.formsCount > 0) {
        return 'active'
      }
      
      return 'draft'
    }

    // 获取字段类型状态
    const getFieldTypeStatus = (fieldType) => {
      if (!fieldType) return 'info'
      
      const type = fieldType.toLowerCase()
      switch (type) {
        case 'text':
        case 'string':
          return 'primary'
        case 'number':
        case 'integer':
          return 'success'
        case 'date':
        case 'datetime':
          return 'warning'
        case 'boolean':
        case 'checkbox':
          return 'info'
        case 'select':
        case 'dropdown':
          return 'danger'
        default:
          return 'info'
      }
    }

    // 获取模板类型显示名称
    const getTemplateTypeDisplay = (templateType) => {
      if (!templateType) return 'Standard'
      
      // 解析模板类型
      if (templateType.includes('daily_report')) return 'Daily Report'
      if (templateType.includes('inspection')) return 'Inspection'
      if (templateType.includes('safety')) return 'Safety'
      if (templateType.includes('quality')) return 'Quality'
      
      return templateType.replace(/^pg\.template_type\./, '').replace(/_/g, ' ')
    }

    // 获取创建者状态
    const getCreatedByStatus = (createdBy) => {
      if (!createdBy) return 'info'
      if (createdBy === 'AUTODESK_SERVICE') return 'primary'
      return 'info'
    }

    // 获取权限状态
    const getPermissionStatus = (permission) => {
      switch (permission) {
        case 'manage': return 'danger'
        case 'submit': return 'success'
        case 'review': return 'warning'
        case 'read': return 'info'
        default: return 'primary'
      }
    }

    // 获取总权限类型数量
    const getTotalPermissions = () => {
      const allPermissions = new Set()
      
      // 从组权限中收集
      templateData.value?.groupPermissions?.forEach(group => {
        group.permissions?.forEach(permission => allPermissions.add(permission))
      })
      
      // 从用户权限中收集
      templateData.value?.userPermissions?.forEach(user => {
        user.permissions?.forEach(permission => allPermissions.add(permission))
      })
      
      return allPermissions.size
    }

    // 复制到剪贴板
    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text)
        ElMessage.success('URL copied to clipboard')
      } catch (error) {
        console.error('Failed to copy:', error)
        ElMessage.error('Failed to copy URL')
      }
    }

    // 监听templateId变化
    watch(() => props.templateId, (newId, oldId) => {
      if (newId !== oldId && newId) {
        console.log('SingleTemplateDetail: Template ID changed from', oldId, 'to', newId)
        fetchTemplateDetail()
      }
    })

    // 组件挂载时获取数据
    onMounted(() => {
      console.log('SingleTemplateDetail mounted with templateId:', props.templateId)
      if (props.templateId) {
        fetchTemplateDetail()
      }
    })

    return {
      // 响应式数据
      loading,
      error,
      templateData,
      
      // 计算属性
      hasPermissionInfo,
      
      // 方法
      fetchTemplateDetail,
      formatDate,
      getTemplateStatus,
      getTemplateTypeDisplay,
      getCreatedByStatus,
      getPermissionStatus,
      getTotalPermissions,
      copyToClipboard,
      
      // 图标
      Document,
      List,
      User,
      DataAnalysis,
      View
    }
  }
}
</script>

<style scoped>
.single-template-detail {
  padding: 16px;
}

.loading-container {
  padding: 20px;
  text-align: center;
}

.loading-text {
  margin-top: 16px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.template-detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.template-id {
  font-family: monospace;
  background: var(--el-fill-color-light);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* 描述卡片 */
.description-content {
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

/* 字段网格 */
.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.field-item {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  border-left: 3px solid var(--el-color-primary);
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.field-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.field-description {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
  line-height: 1.4;
}

.field-properties {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.field-required,
.field-readonly,
.field-hidden {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-required {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.field-readonly {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.field-hidden {
  background: var(--el-color-info-light-9);
  color: var(--el-color-info);
}

/* 权限网格 */
.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.permission-section {
  margin-bottom: 24px;
}

.permission-section:last-child {
  margin-bottom: 0;
}

.permission-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.permission-item {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  border-left: 3px solid var(--el-color-primary);
}

.permission-header {
  margin-bottom: 8px;
}

.permission-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-key {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.permission-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.no-permissions {
  margin-top: 16px;
}

/* Forms URL样式 */
.forms-url-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.url-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.url-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.url-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.url-value code {
  flex: 1;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  word-break: break-all;
  border: 1px solid var(--el-border-color-light);
}

.url-description {
  margin-top: 8px;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .fields-grid {
    grid-template-columns: 1fr;
  }
  
  .permissions-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .single-template-detail {
    padding: 12px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .field-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
