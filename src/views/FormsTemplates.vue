<template>
  <div class="forms-templates">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      title="Forms Templates"
      description="Manage and view form templates in your project"
      :icon="IconFile"
      tag="Template Management"
      tag-type="primary"
      :action-buttons="headerButtons"
      :show-breadcrumb="false"
      :show-stats="false"
      @action="handleHeaderAction" />

    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      title="Loading Templates"
      text="Fetching form templates from the server..."
      :show-progress="false"
      :show-cancel="true"
      @cancel="cancelLoading" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error"
      type="card"
      severity="error"
      title="Error Loading Templates"
      :message="error"
      :suggestions="errorSuggestions"
      :action-buttons="errorButtons"
      @action="handleErrorAction" />

    <!-- 成功状态指示器 -->
    <StatusIndicator
      v-if="templatesData && !loading && !error"
      status="success"
      title="Templates Loaded Successfully"
      :description="`Successfully loaded ${templatesData.templates?.data?.length || 0} form templates`"
      :details="`Last updated: ${new Date().toLocaleString()}`"
      size="default"
      style="margin-bottom: 24px;" />

    <!-- 查询信息卡片 -->
    <QueryInfoCard
      v-if="templatesData && !loading && !error"
      title="Template Query Information"
      :api-endpoint="getApiEndpoint()"
      :description="getQueryDescription()"
      :query-params="getFormattedQueryParams()"
      :result-count="templatesData.templates?.data?.length || 0"
      result-unit="templates"
      :response-time="getResponseTime()"
      :query-time="queryTime"
      :custom-fields="getCustomQueryFields()"
      :actions="getQueryActions()"
      @refresh="refreshWithParams"
      @reset="resetParams" />

    <!-- 查询控制面板 -->
    <el-card v-if="templatesData && !loading && !error" class="query-control-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h3>Query Controls</h3>
        </div>
      </template>
      
      <div class="query-controls">
        <div class="control-row">
          <div class="control-item">
            <label>Items per page:</label>
            <el-select v-model="queryParams.limit" @change="refreshWithParams" style="width: 100px;">
              <el-option label="10" :value="10" />
              <el-option label="20" :value="20" />
              <el-option label="50" :value="50" />
            </el-select>
          </div>
          
          <div class="control-item">
            <label>Sort:</label>
            <el-select v-model="queryParams.sortOrder" @change="refreshWithParams" style="width: 120px;">
              <el-option label="Newest First" value="desc" />
              <el-option label="Oldest First" value="asc" />
            </el-select>
          </div>
          
          <div class="control-item">
            <label>Filter by update time:</label>
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="to"
              start-placeholder="Start Time"
              end-placeholder="End Time"
              @change="handleDateRangeChange"
              style="width: 300px;" />
          </div>
        </div>
        
        <div class="control-row">
          <el-button type="primary" @click="refreshWithParams" :loading="loading">
            <Refresh />
            Apply Filter
          </el-button>
          <el-button @click="resetParams">Reset</el-button>
        </div>
      </div>
    </el-card>

    <!-- 模板数据内容 -->
    <div v-if="templatesData && !loading && !error">
      <!-- 模板数据表格 -->
      <DataTable
        :data="templatesData.templates?.data || []"
        :columns="tableColumns"
        :loading="loading"
        title="📋 Form Templates List"
        description="All form templates in the project, including workflow and permission information"
        :action-buttons="tableActions"
        :operations="rowOperations"
        :show-index="true"
        :show-pagination="false"
        @action="handleTableAction"
        @row-operation="handleRowOperation">
        
        <!-- 状态列 -->
        <template #status="{ row }">
          <StatusTag
            v-if="row"
            :status="getTemplateStatus(row.status)"
            :text="row.status || 'Unknown'"
            size="small"
            :show-icon="false" />
          <span v-else>N/A</span>
        </template>
        
        <!-- 更新时间列 -->
        <template #updated-at="{ row }">
          <div v-if="row" class="update-info">
            <div class="update-time">{{ formatDate(row.updatedAt) }}</div>
            <div class="update-ago">{{ getTimeAgo(row.updatedAt) }}</div>
          </div>
          <span v-else>N/A</span>
        </template>

        <!-- 创建者列 -->
        <template #created-by="{ row }">
          <StatusTag 
            status="info" 
            :text="getCreatedByDisplayName(row.createdBy)"
            size="small" 
            :show-icon="false" />
        </template>
        
        <!-- 工作流信息列 -->
        <template #workflow-info="{ row }">
          <div v-if="row" class="workflow-preview">
            <StatusTag 
              v-if="hasWorkflowInfo(row)" 
              status="available" 
              text="Has Workflow"
              size="small" 
              :show-icon="false" />
            <StatusTag 
              v-else 
              status="unavailable" 
              text="No Workflow"
              size="small" 
              :show-icon="false" />
          </div>
          <div v-else class="workflow-preview">
            <StatusTag 
              status="unknown" 
              text="N/A"
              size="small" 
              :show-icon="false" />
          </div>
        </template>
      </DataTable>

      <!-- 分页控制 -->
      <div class="pagination-container" v-if="templatesData && getTotalCount() > 0">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="queryParams.limit"
          :total="getTotalCount()"
          layout="prev, pager, next, jumper"
          @current-change="handlePageChange" />
      </div>


      <!-- JSON 数据查看器 -->
      <div style="margin-top: 32px;">
        <JsonViewer
          :data="templatesData"
          title="Complete Template Data"
          :collapsible="true"
          :show-controls="true"
          max-height="500px"
          theme="light" />
      </div>
    </div>

    <!-- 模板详情对话框 -->
    <el-dialog
      v-model="showTemplateDetailsDialog"
      :title="selectedTemplate ? `📋 Template Details - ${selectedTemplate.name}` : 'Template Details'"
      width="90%"
      :max-width="1200"
      top="5vh"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      class="template-details-dialog">
      
      <div v-if="selectedTemplate" class="template-details-content">
        <!-- basicInfo -->
        <el-card class="details-section" shadow="never">
          <template #header>
            <div class="section-header">
              <h3>📝 Basic Information</h3>
            </div>
            </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Template Name">
              <StatusTag 
                status="info" 
                :text="selectedTemplate.name"
                size="default" 
                :show-icon="false" />
            </el-descriptions-item>
            <el-descriptions-item label="Status">
              <StatusIndicator
                :status="getTemplateStatus(selectedTemplate.status)"
                :title="selectedTemplate.status"
                size="small" />
            </el-descriptions-item>
            <el-descriptions-item label="Created Time">
              {{ formatDate(selectedTemplate.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="Updated Time">
              {{ formatDate(selectedTemplate.updatedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="Creator">
              <StatusTag 
                status="info" 
                :text="getCreatedByDisplayName(selectedTemplate.createdBy)"
                size="small" 
                :show-icon="false" />
            </el-descriptions-item>
            <el-descriptions-item label="Template ID">
              <StatusTag 
                status="info" 
                :text="selectedTemplate.id"
                size="small" 
                :show-icon="false" />
            </el-descriptions-item>
          </el-descriptions>
      </el-card>

        <!-- 工作流架构信息 -->
        <WorkflowArchitecture
          v-if="selectedTemplate && getTemplateWorkflowInfo(selectedTemplate)"
          :workflow-info="getTemplateWorkflowInfo(selectedTemplate)"
          :default-active-items="['architecture-summary', 'template-details', 'roles', 'resources']"
          class="details-section" />

        <!-- 原始数据查看 -->
        <el-card class="details-section" shadow="never">
        <template #header>
            <div class="section-header">
              <h3>🔍 Raw Data</h3>
            </div>
        </template>
          
          <JsonViewer
            :data="selectedTemplate"
            title=""
            :collapsible="true"
            :show-controls="true"
            max-height="400px"
            theme="light" />
      </el-card>
    </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showTemplateDetailsDialog = false">Close</el-button>
          <el-button type="primary" @click="downloadTemplateData" :icon="Download">
            Export Template Data
          </el-button>
      </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Breadcrumb from '../components/Breadcrumb.vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import StatusIndicator from '../components/StatusIndicator.vue'
import DataTable from '../components/DataTable.vue'
import JsonViewer from '../components/JsonViewer.vue'
import QueryInfoCard from '../components/QueryInfoCard.vue'
import WorkflowArchitecture from '../components/WorkflowArchitecture.vue'
import StatusTag from '../components/StatusTag.vue'
import entityCache from '../utils/entityCache.js'
import { IconFile } from '@arco-design/web-vue/es/icon'
import { Refresh, Download, View, DocumentCopy } from '@element-plus/icons-vue'

export default {
  name: 'FormsTemplates',
  components: {
    Breadcrumb,
    PageHeader,
    LoadingState,
    ErrorState,
    StatusIndicator,
    DataTable,
    JsonViewer,
    QueryInfoCard,
    WorkflowArchitecture,
    StatusTag,
    IconFile
  },
  setup() {
    const { t } = useI18n()
    
    // Reactive data
    const loading = ref(false)
    const error = ref(null)
    const templatesData = ref(null)
    const queryParams = ref({
      offset: 0,
      limit: 20,
      sortOrder: 'desc',
      updatedAfter: null,
      updatedBefore: null
    })
    const dateRange = ref(null)
    const currentPage = ref(1)
    const queryTime = ref(null)
    const responseTime = ref(null)
    const showTemplateDetailsDialog = ref(false)
    const selectedTemplate = ref(null)
    const entitiesLoading = ref(false)
    const entitiesLoaded = ref(false)
    const currentProject = ref(null)
    
    return {
      t,
      loading, error, templatesData, queryParams, dateRange, currentPage,
      queryTime, responseTime, showTemplateDetailsDialog, selectedTemplate,
      entitiesLoading, entitiesLoaded, currentProject
    }
  },
  computed: {
    headerButtons() {
      return [
        {
          text: 'Back to Home',
          type: 'default',
          icon: 'ArrowLeft',
          action: 'home'
        },
        {
          text: 'Refresh Data',
          type: 'primary',
          icon: Refresh,
          loading: this.loading,
          action: 'refresh'
        },
        {
          text: 'Recent Templates',
          type: 'success',
          icon: View,
          action: 'recent-templates'
        }
      ]
    },
    
    errorSuggestions() {
      return [
        'Check if network connection is normal',
        'Confirm Autodesk authentication is completed',
        'Verify project permission settings',
        'Contact administrator to check API configuration'
      ]
    },
    
    errorButtons() {
      return [
        {
          text: 'Re-authenticate',
          type: 'primary',
          action: 'auth'
        },
        {
          text: 'Retry',
          type: 'default',
          action: 'retry'
        }
      ]
    },
    
    tableColumns() {
      return [
        {
          prop: 'name',
          label: 'Template Name',
          minWidth: 200,
          showOverflowTooltip: true
        },
        {
          prop: 'status',
          label: 'Status',
          width: 100,
          slot: 'status'
        },
        {
          prop: 'createdAt',
          label: 'Created Time',
          width: 180,
          type: 'datetime'
        },
        {
          prop: 'updatedAt',
          label: 'Updated Time',
          width: 200,
          slot: 'updated-at'
        },
        {
          prop: 'createdBy',
          label: 'Creator',
          width: 120,
          slot: 'created-by'
        },
        {
          label: 'Workflow',
          width: 100,
          slot: 'workflow-info'
        }
      ]
    },

    formFieldColumns() {
      return [
        {
          prop: 'name',
          label: 'Field Name',
          minWidth: 150
        },
        {
          prop: 'type',
          label: 'Field Type',
          width: 120
        },
        {
          prop: 'required',
          label: 'Required',
          width: 80,
          type: 'tag',
          tagMap: {
            true: { type: 'danger', text: 'Yes' },
            false: { type: 'success', text: 'No' }
          }
        },
        {
          prop: 'label',
          label: 'Label',
          minWidth: 150
        }
      ]
    },
    
    tableActions() {
      return [
        {
          text: 'Export Data',
          type: 'success',
          icon: Download,
          action: 'export'
        },
        {
          text: 'Refresh',
          type: 'primary',
          icon: Refresh,
          action: 'refresh'
        }
      ]
    },
    
    rowOperations() {
      return [
        {
          text: 'View Details',
          type: 'primary',
          icon: View,
          action: 'view'
        }
      ]
    }
  },
  async mounted() {
    await this.initializeProject()
    await this.fetchTemplatesData()
  },
  methods: {
    // 初始化项目（从URL或localStorage获取）
    async initializeProject() {
      // 检查URL参数中是否有项目ID
      const projectId = this.$route.query.projectId
      const projectName = this.$route.query.projectName
      
      if (projectId) {
        // 从URL参数获取项目信息
        this.currentProject = {
          id: projectId,
          name: projectName || projectId
        }
        console.log('FormsTemplates: 从URL获取项目信息:', this.currentProject)
      } else {
        // 尝试从localStorage获取之前选择的项目
        try {
          const savedProject = JSON.parse(localStorage.getItem('selectedProject'))
          if (savedProject && savedProject.id) {
            this.currentProject = savedProject
            console.log('FormsTemplates: 从localStorage获取项目信息:', this.currentProject)
          }
        } catch (error) {
          console.warn('FormsTemplates: 获取保存的项目信息失败:', error)
        }
      }

      if (this.currentProject?.id) {
        // 有项目信息，初始化实体缓存
        await this.initializeEntityCache()
      } else {
        console.warn('FormsTemplates: 未找到项目信息')
      }
    },

    // 初始化实体缓存
    async initializeEntityCache() {
      if (!this.currentProject?.id || this.entitiesLoaded) {
        return
      }

      try {
        console.log('🏢 FormsTemplates: 开始初始化实体缓存...')
        this.entitiesLoading = true
        
        // 获取项目实体数据（用户、角色、公司）
        await entityCache.getProjectEntities(this.currentProject.id)
        
        this.entitiesLoaded = true
        console.log('✅ FormsTemplates: 实体缓存初始化完成')
      } catch (error) {
        console.error('❌ FormsTemplates: 实体缓存初始化失败:', error)
      } finally {
        this.entitiesLoading = false
      }
    },

    // 获取创建者显示名称
    getCreatedByDisplayName(createdBy) {
      if (!createdBy) return 'N/A'
      
      // 调试信息
      console.log('🔍 FormsTemplates获取创建者显示名称:', {
        createdBy,
        projectId: this.currentProject?.id,
        entitiesLoaded: this.entitiesLoaded
      })
      
      // 尝试从实体缓存获取用户显示名称
      const displayName = entityCache.getUserDisplayName(createdBy, this.currentProject?.id)
      
      console.log('📝 FormsTemplates创建者映射结果:', {
        原始ID: createdBy,
        映射结果: displayName,
        是否成功: displayName !== createdBy
      })
      
      return displayName !== createdBy ? displayName : createdBy
    },

    // 获取实体显示名称（通用方法）
    getEntityDisplayName(entityId, entityType) {
      if (!entityId) return 'Unknown'
      
      const displayName = entityCache.getEntityDisplayName(entityId, entityType, this.currentProject?.id)
      return displayName
    },

    async fetchTemplatesData() {
      // 检查是否有项目信息
      if (!this.currentProject?.id) {
        this.error = 'Missing project information, please select a project first'
        console.error('FormsTemplates: 缺少项目信息')
        return
      }

      this.loading = true
      this.error = null
      
      // 记录查询开始时间
      const startTime = Date.now()
      this.queryTime = new Date()
      
      // 构建包含 projectId 的查询参数
      const requestParams = {
        ...this.queryParams,
        projectId: this.currentProject.id
      }
      
      console.log('开始获取模板数据...', requestParams)
      
      try {
        const response = await axios.get('/api/forms/templates', {
          params: requestParams,
          timeout: 30000 // 30秒超时
        })
        
        // 计算响应时间
        const endTime = Date.now()
        this.responseTime = `${endTime - startTime}ms`
        
        console.log('API响应:', response)
        
        if (response.headers['content-type']?.includes('application/json')) {
          this.templatesData = response.data
          console.log('模板数据获取成功:', this.templatesData)
        } else {
          console.log('响应不是JSON格式，可能需要重新认证')
          throw new Error('Re-authentication required')
        }
      } catch (error) {
        console.error('获取模板数据失败:', error)
        
        if (error.code === 'ECONNABORTED') {
          this.error = 'Request timeout, please check network connection or try again later'
        } else if (error.response?.status === 401) {
          this.error = 'Access Token not found, please authenticate first'
        } else if (error.response?.status === 403) {
          this.error = 'Insufficient permissions, please check account permission settings'
        } else if (error.response?.status === 404) {
          this.error = 'API endpoint does not exist, please check server configuration'
        } else if (error.response?.status >= 500) {
          this.error = 'Server internal error, please try again later or contact administrator'
        } else {
          this.error = `Error occurred while fetching template data: ${error.response?.data?.message || error.message}`
        }
      } finally {
        this.loading = false
        console.log('模板数据获取完成，loading状态:', this.loading)
      }
    },

    refreshWithParams() {
      this.currentPage = 1
      this.queryParams.offset = 0
      this.fetchTemplatesData()
    },

    resetParams() {
      this.queryParams = {
        offset: 0,
        limit: 20,
        sortOrder: 'desc',
        updatedAfter: null,
        updatedBefore: null
      }
      this.dateRange = null
      this.currentPage = 1
      this.fetchTemplatesData()
    },

    handleDateRangeChange(dates) {
      if (dates && dates.length === 2) {
        this.queryParams.updatedAfter = dates[0].toISOString()
        this.queryParams.updatedBefore = dates[1].toISOString()
      } else {
        this.queryParams.updatedAfter = null
        this.queryParams.updatedBefore = null
      }
    },

    handlePageChange(page) {
      this.currentPage = page
      this.queryParams.offset = (page - 1) * this.queryParams.limit
      this.fetchTemplatesData()
    },

    getTotalCount() {
      // 优先使用分页信息中的总数，否则使用当前数据长度
      if (this.templatesData?.pagination?.total) {
        return this.templatesData.pagination.total
      }
      if (this.templatesData?.templates?.pagination?.total) {
        return this.templatesData.templates.pagination.total
      }
      // 如果没有分页信息，使用当前数据长度作为估算
      return this.templatesData?.templates?.data?.length || 0
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      try {
        return new Date(dateString).toLocaleString('en-US')
      } catch {
        return dateString
      }
    },

    getTimeAgo(dateString) {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMinutes = Math.floor(diffMs / (1000 * 60))

        if (diffDays > 0) {
          return `${diffDays} days ago`
        } else if (diffHours > 0) {
          return `${diffHours} hours ago`
        } else if (diffMinutes > 0) {
          return `${diffMinutes} minutes ago`
        } else {
          return 'Just now'
        }
      } catch {
        return ''
      }
    },

    getTemplateStatus(status) {
      switch(status) {
        case 'active': return 'success'
        case 'draft': return 'warning'
        case 'archived': return 'info'
        default: return 'info'
      }
    },

    hasWorkflowInfo(template) {
      const workflowInfo = this.getTemplateWorkflowInfo(template)
      return workflowInfo && (
        this.hasRolesAndPermissions(template) ||
        this.hasStatuses(template) ||
        this.hasWorkflowRules(template) ||
        this.hasParticipants(template)
      )
    },

    getTemplateWorkflowInfo(template) {
      if (!this.templatesData?.workflow_architecture) return null
      const workflowInfo = this.templatesData.workflow_architecture.find(arch => arch.template_id === template.id)
      
      // Enhance workflow info with architecture summary and template data
      if (workflowInfo) {
        const enhancedWorkflowInfo = {
          ...workflowInfo,
          architecture_summary: this.templatesData.architecture_summary,
          templatesData: this.templatesData
        }

        // 映射角色和权限中的实体名称
        if (enhancedWorkflowInfo.roles_and_permissions) {
          const mappedRoles = {}
          Object.keys(enhancedWorkflowInfo.roles_and_permissions).forEach(roleId => {
            const roleInfo = enhancedWorkflowInfo.roles_and_permissions[roleId]
            const roleDisplayName = this.getEntityDisplayName(roleId, 'role')
            
            mappedRoles[roleId] = {
              ...roleInfo,
              displayName: roleDisplayName,
              original_id: roleId
            }
          })
          enhancedWorkflowInfo.roles_and_permissions = mappedRoles
        }

        // 映射参与者信息
        if (enhancedWorkflowInfo.participants && Array.isArray(enhancedWorkflowInfo.participants)) {
          enhancedWorkflowInfo.participants = enhancedWorkflowInfo.participants.map(participant => ({
            ...participant,
            displayName: this.getEntityDisplayName(participant.id, participant.type || 'auto')
          }))
        }

        // 映射工作流规则中的实体
        if (enhancedWorkflowInfo.workflow_rules) {
          const mappedRules = {}
          Object.keys(enhancedWorkflowInfo.workflow_rules).forEach(ruleKey => {
            const rule = enhancedWorkflowInfo.workflow_rules[ruleKey]
            
            // 如果规则中包含assignee、reviewer等字段，进行映射
            if (rule && typeof rule === 'object') {
              const mappedRule = { ...rule }
              
              ['assignee', 'reviewer', 'approver', 'watcher'].forEach(field => {
                if (rule[field]) {
                  const fieldType = rule[field + 'Type'] || 'auto'
                  mappedRule[field + '_display'] = this.getEntityDisplayName(rule[field], fieldType)
                }
              })
              
              mappedRules[ruleKey] = mappedRule
            } else {
              mappedRules[ruleKey] = rule
            }
          })
          enhancedWorkflowInfo.workflow_rules = mappedRules
        }

        return enhancedWorkflowInfo
      }
      
      return workflowInfo
    },

    // Helper functions for workflow info checking
    hasRolesAndPermissions(template) {
      const workflowInfo = this.getTemplateWorkflowInfo(template)
      return workflowInfo && workflowInfo.roles_and_permissions && 
             Object.keys(workflowInfo.roles_and_permissions).length > 0
    },

    hasStatuses(template) {
      const workflowInfo = this.getTemplateWorkflowInfo(template)
      return workflowInfo && workflowInfo.statuses && workflowInfo.statuses.length > 0
    },

    hasWorkflowRules(template) {
      const workflowInfo = this.getTemplateWorkflowInfo(template)
      return workflowInfo && workflowInfo.workflow_rules && 
             Object.keys(workflowInfo.workflow_rules).length > 0
    },

    hasParticipants(template) {
      const workflowInfo = this.getTemplateWorkflowInfo(template)
      return workflowInfo && workflowInfo.participants && workflowInfo.participants.length > 0
    },

    async downloadTemplateData() {
      if (!this.selectedTemplate) return
      
      try {
        const dataStr = JSON.stringify(this.selectedTemplate, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        
        const url = window.URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `template_${this.selectedTemplate.name || 'data'}_${Date.now()}.json`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success('Template data exported successfully')
      } catch (error) {
        console.error('导出模板数据失败:', error)
        this.$message.error('Export failed')
      }
    },

    async exportData() {
      try {
        const dataStr = JSON.stringify(this.templatesData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        
        const url = window.URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `templates_${Date.now()}.json`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success('Data exported successfully')
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error(`Export failed: ${error.message}`)
      }
    },
    
    startAuth() {
      window.location.href = '/auth/start'
    },
    
    refreshData() {
      this.fetchTemplatesData()
    },
    
    cancelLoading() {
      this.loading = false
      this.error = 'Loading cancelled'
      console.log('用户cancel了加载操作')
    },
    
    // 显示模板详情
    showTemplateDetails(template) {
      this.selectedTemplate = template
      this.showTemplateDetailsDialog = true
    },
    
    // 事件处理方法
    handleHeaderAction(action) {
      switch(action) {
        case 'home':
          this.$router.push('/')
          break
        case 'refresh':
          this.refreshData()
          break
        case 'recent-templates':
          this.$router.push('/forms/templates/recent')
          break
      }
    },
    
    handleErrorAction(action) {
      switch(action) {
        case 'auth':
          this.startAuth()
          break
        case 'retry':
          this.refreshData()
          break
      }
    },
    
    handleTableAction(action) {
      switch(action) {
        case 'export':
          this.exportData()
          break
        case 'refresh':
          this.refreshData()
          break
      }
    },
    
    handleRowOperation(action, button, index) {
      const [operation, rowIndex] = action.split(':')
      const template = this.templatesData.templates?.data[parseInt(rowIndex)]
      
      switch(operation) {
        case 'view':
          this.showTemplateDetails(template)
          break
      }
    },

    // QueryInfoCard 相关方法
    getApiEndpoint() {
      const baseUrl = window.location.origin
      return `${baseUrl}/api/forms/templates`
    },

    getQueryDescription() {
      const params = this.queryParams
      let description = `Get form template list`
      
      if (params.updatedAfter || params.updatedBefore) {
        description += ', filtered by update time'
      }
      
      description += `, ${params.limit} items per page, sorted by ${params.sortOrder === 'desc' ? 'newest first' : 'oldest first'}`
      
      return description
    },

    getFormattedQueryParams() {
      const formatted = {}
      Object.keys(this.queryParams).forEach(key => {
        const value = this.queryParams[key]
        if (value !== null && value !== undefined) {
          formatted[key] = value
        }
      })
      return formatted
    },

    getResponseTime() {
      return this.responseTime
    },

    getCustomQueryFields() {
      const fields = []
      
      // 当前页码
      fields.push({
        label: 'Current Page',
        value: Math.floor(this.queryParams.offset / this.queryParams.limit) + 1,
        component: 'StatusTag',
        props: { status: 'info', size: 'small', showIcon: false }
      })
      
      // 分页信息
      if (this.templatesData?.pagination) {
        const pagination = this.templatesData.pagination
        if (pagination.total) {
          fields.push({
            label: 'Total Records',
            value: pagination.total,
            component: 'StatusTag',
            props: { status: 'success', size: 'small', showIcon: false }
          })
        }
      }
      
      // 架构统计
      if (this.templatesData?.architecture_summary) {
        const summary = this.templatesData.architecture_summary
        fields.push({
          label: 'Contains Workflow',
          value: `${summary.templates_with_workflow_rules || 0} items`,
          component: 'StatusTag',
          props: { status: 'warning', size: 'small', showIcon: false }
        })
      }
      
      return fields
    },

    getQueryActions() {
      return [
        {
          text: 'Refresh Query',
          type: 'primary',
          icon: Refresh,
          event: 'refresh'
        },
        {
          text: 'Reset Parameters',
          type: 'default',
          event: 'reset'
        },
        {
          text: 'Copy API',
          type: 'info',
          icon: DocumentCopy,
          handler: () => this.copyApiEndpoint()
        }
      ]
    },

    async copyApiEndpoint() {
      try {
        const endpoint = this.getApiEndpoint()
        await navigator.clipboard.writeText(endpoint)
        this.$message.success('API endpoint copied to clipboard')
      } catch (error) {
        console.error('复制失败:', error)
        this.$message.error('Copy failed')
      }
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.forms-templates {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.query-control-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.query-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-item label {
  font-size: 14px;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.update-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.update-time {
  font-size: 13px;
  color: var(--color-text-primary);
}

.update-ago {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-style: italic;
}

.workflow-preview {
  display: flex;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.summary-card {
  margin-top: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
}

.summary-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.summary-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* 模板详情对话框样式 */
.template-details-dialog {
  --el-dialog-padding-primary: 0;
}

.template-details-content {
  max-height: 80vh;
  overflow-y: auto;
  padding: 0 24px;
}

.details-section {
  margin-bottom: 20px;
}

.details-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}


.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .forms-templates {
    padding: var(--spacing-md);
  }
  
  .control-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .roles-grid {
    grid-template-columns: 1fr;
  }
  
  .template-details-content {
    padding: 0 12px;
  }
}
</style>