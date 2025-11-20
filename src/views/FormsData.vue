<template>
  <div class="forms-data">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      :title="t('forms.title')"
      :description="t('forms.description')"
      :icon="IconDashboard"
      :tag="t('forms.realTimeData')"
      tag-type="success"
      :action-buttons="headerButtons"
      :show-breadcrumb="false"
      :show-stats="false"
      @action="handleHeaderAction" />

    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      :title="t('forms.loading')"
      :text="t('forms.loadingText')"
      :show-progress="false"
      :show-cancel="true"
      @cancel="cancelLoading" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error"
      type="card"
      severity="error"
      :title="t('forms.error')"
      :message="error"
      :suggestions="errorSuggestions"
      :action-buttons="errorButtons"
      @action="handleErrorAction" />

    <!-- 成功状态指示器 -->
    <StatusIndicator
      v-if="formsData && !loading && !error"
      status="success"
      :title="t('forms.successTitle')"
      :description="t('forms.successDescription', { count: formsData.forms?.length || 0 })"
      :details="t('forms.lastUpdated', { time: new Date().toLocaleString() })"
      size="default"
      style="margin-bottom: 24px;" />

    <!-- 查询信息卡片 -->
    <QueryInfoCard
      v-if="formsData && !loading && !error"
      :title="t('forms.queryTitle')"
      api-endpoint="/api/forms/jarvis"
      :description="t('forms.queryDescription')"
      :result-count="formsData.forms?.length || 0"
      :result-unit="t('forms.formUnit')"
      :custom-fields="getFormsQueryFields()" />

    <!-- 表单数据内容 -->
    <div v-if="formsData && !loading && !error">
      <!-- 表单数据表格 -->
      <DataTable
        :data="formsData.forms || []"
        :columns="tableColumns"
        :loading="loading"
        :title="t('forms.tableTitle')"
        :description="t('forms.tableDescription')"
        :action-buttons="tableActions"
        :operations="rowOperations"
        :show-index="true"
        @action="handleTableAction"
        @row-operation="handleRowOperation">
        
        <!-- 表单状态列 -->
        <template #status="{ row }">
          <StatusTag
            :status="row.status || 'unknown'"
            size="small"
            :show-icon="false" />
        </template>
        
        
        <!-- 创建者列 -->
        <template #created-by="{ row }">
          <StatusTag 
            status="info" 
            :text="getCreatedByDisplayName(row.createdBy)"
            size="small" 
            :show-icon="false" />
        </template>
        
        <!-- 工作记录统计列 -->
        <template #work-stats="{ row }">
          <div class="work-stats">
            <StatusTag 
              status="info" 
              :text="t('forms.worklog', { count: row.tabularValues?.worklogEntries?.length || 0 })"
              size="small" 
              :show-icon="false" />
            <StatusTag 
              status="success" 
              :text="t('forms.materials', { count: row.tabularValues?.materialsEntries?.length || 0 })"
              size="small" 
              :show-icon="false"
              style="margin-left: 4px;" />
            <StatusTag 
              status="warning" 
              :text="t('forms.equipment', { count: row.tabularValues?.equipmentEntries?.length || 0 })"
              size="small" 
              :show-icon="false"
              style="margin-left: 4px;" />
          </div>
        </template>
        
      </DataTable>

      <!-- Forms Template 列表 -->
      <FormsTemplateList 
        v-if="currentProject"
        :project="currentProject"
        style="margin-top: 24px;"
        @template-detail="handleTemplateDetail"
        @templates-loaded="handleTemplatesLoaded" />

      <!-- JSON 数据查看器 -->
      <div style="margin-top: 32px;">
        <JsonViewer
          :data="formsData"
          title="Form Details Data"
          :collapsible="true"
          :show-controls="true"
          max-height="500px"
          theme="light" />
      </div>
      
      <!-- Forms Template JSON 数据查看器 -->
      <div style="margin-top: 24px;">
        <JsonViewer
          :data="templatesData"
          title="Forms Template Data"
          :collapsible="true"
          :show-controls="true"
          max-height="500px"
          theme="light" />
      </div>
    </div>

    <!-- 表单详情对话框 -->
    <el-dialog
      v-model="showFormDetailsDialog"
      :title="selectedForm ? t('forms.formDetails', { name: selectedForm.name }) : t('forms.formDetailsTitle')"
      width="95%"
      :max-width="1400"
      top="3vh"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      class="form-details-dialog">
      
      <div v-if="selectedForm" class="form-details-content">
        <FormDetail
          :form="selectedForm"
          :project="currentProject"
          @references-loaded="onFormReferencesLoaded"
          @references-error="onFormReferencesError"
          @reference-download-success="onFormReferenceDownloadSuccess"
          @reference-download-error="onFormReferenceDownloadError" />
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showFormDetailsDialog = false">{{ t('common.close') }}</el-button>
          <el-button type="primary" @click="downloadFormData" :icon="Download">
            {{ t('forms.exportFormData') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 模板详情对话框 -->
    <el-dialog
      v-model="showTemplateDetailsDialog"
      :title="selectedTemplate ? `Template Details - ${selectedTemplate.name}` : 'Template Details'"
      width="90%"
      :before-close="handleCloseTemplateDialog"
      draggable
      destroy-on-close
      class="template-details-dialog">
      
      <div v-if="selectedTemplate" class="template-details-content">
        <SingleTemplateDetail
          :key="templateDetailKey"
          :template-id="selectedTemplateId"
          :project="currentProject"
          :template-data="selectedTemplate" />
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

    <!-- 项目选择对话框 -->
    <ProjectSelector
      v-model="showProjectSelector"
      :multiple="false"
      :auto-refresh="false"
      @confirm="handleProjectSelected"
      @cancel="handleProjectSelectionCancel" />
  </div>
</template>

<script>
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import Breadcrumb from '../components/Breadcrumb.vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import StatusIndicator from '../components/StatusIndicator.vue'
import DataTable from '../components/DataTable.vue'
import BaseCard from '../components/BaseCard.vue'
import JsonViewer from '../components/JsonViewer.vue'
import QueryInfoCard from '../components/QueryInfoCard.vue'
import WorkflowArchitecture from '../components/WorkflowArchitecture.vue'
import FormDetail from '../components/FormDetail.vue'
import ProjectSelector from '../components/ProjectSelector.vue'
import StatusTag from '../components/StatusTag.vue'
import FormsTemplateList from '../components/FormsTemplateList.vue'
import SingleTemplateDetail from '../components/SingleTemplateDetail.vue'
import projectStore from '../utils/projectStore.js'
import entityCache from '../utils/entityCache.js'
import { IconDashboard } from '@arco-design/web-vue/es/icon'
import { Refresh, Download, View } from '@element-plus/icons-vue'

export default {
  name: 'FormsData',
  components: {
    Breadcrumb,
    PageHeader,
    LoadingState,
    ErrorState,
    StatusIndicator,
    DataTable,
    BaseCard,
    JsonViewer,
    QueryInfoCard,
    WorkflowArchitecture,
    FormDetail,
    ProjectSelector,
    StatusTag,
    FormsTemplateList,
    SingleTemplateDetail,
    IconDashboard
  },
  setup() {
    const { t } = useI18n()
    
    return {
      t
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      formsData: null,
      // 表单详情对话框相关
      showFormDetailsDialog: false,
      selectedForm: null,
      activeCollapseItems: ['worklog', 'materials', 'equipment'],
      // 模板详情对话框相关
      showTemplateDetailsDialog: false,
      selectedTemplate: null,
      templatesData: null,
      // 项目相关
      currentProject: null,
      showProjectSelector: false,
      // 实体缓存相关
      entitiesLoading: false,
      entitiesLoaded: false
    }
  },
  computed: {
    headerButtons() {
      return [
        {
          text: this.t('forms.returnToList'),
          type: 'default',
          icon: 'ArrowLeft',
          action: 'home'
        },
        {
          text: this.t('forms.refreshData'),
          type: 'primary',
          icon: Refresh,
          loading: this.loading,
          action: 'refresh'
        },
        {
          text: this.t('forms.exportData'),
          type: 'success',
          icon: Download,
          action: 'export'
        }
      ]
    },
    

    
    errorSuggestions() {
      return [
        this.t('forms.errorSuggestions.checkNetwork'),
        this.t('forms.errorSuggestions.confirmAuth'),
        this.t('forms.errorSuggestions.verifyPermissions'),
        this.t('forms.errorSuggestions.contactAdmin')
      ]
    },
    
    errorButtons() {
      return [
        {
          text: this.t('forms.errorButtons.reauth'),
          type: 'primary',
          action: 'auth'
        },
        {
          text: this.t('forms.errorButtons.retry'),
          type: 'default',
          action: 'retry'
        }
      ]
    },
    
    tableColumns() {
      return [
        {
          prop: 'name',
          label: this.t('forms.formName'),
          minWidth: 200,
          showOverflowTooltip: true
        },
        {
          prop: 'status',
          label: this.t('forms.formStatus'),
          width: 100,
          slot: 'status'
        },
        {
          prop: 'formDate',
          label: this.t('forms.formDate'),
          width: 120,
          type: 'datetime'
        },
        {
          prop: 'createdAt',
          label: this.t('forms.createdAt'),
          width: 180,
          type: 'datetime'
        },
        {
          prop: 'createdBy',
          label: this.t('forms.creator'),
          width: 120,
          slot: 'created-by'
        },
        {
          prop: 'updatedAt',
          label: this.t('forms.updatedAt'),
          width: 180,
          type: 'datetime'
        },
        {
          label: this.t('forms.workRecords'),
          width: 200,
          slot: 'work-stats'
        }
      ]
    },
    
    worklogColumns() {
      return [
        {
          prop: 'trade',
          label: this.t('forms.columns.trade'),
          width: 120
        },
        {
          prop: 'headcount',
          label: this.t('forms.columns.headcount'),
          width: 80,
          type: 'number',
          precision: 0
        },
        {
          label: this.t('forms.columns.workHours'),
          width: 80,
          slot: 'timespan'
        },
        {
          prop: 'description',
          label: this.t('forms.columns.description'),
          showOverflowTooltip: true
        }
      ]
    },
    
    tableActions() {
      return [
        {
          text: this.t('forms.exportJson'),
          type: 'success',
          icon: Download,
          action: 'export'
        },
        {
          text: this.t('forms.refresh'),
          type: 'primary',
          icon: Refresh,
          action: 'refresh'
        }
      ]
    },
    
    rowOperations() {
      return [
        {
          text: this.t('forms.viewDetails'),
          type: 'primary',
          icon: View,
          action: 'view'
        }
      ]
    },
    
    // 材料记录表格列
    materialsColumns() {
      return [
        {
          prop: 'material',
          label: this.t('forms.columns.materialName'),
          minWidth: 150
        },
        {
          prop: 'quantity',
          label: this.t('forms.columns.quantity'),
          width: 100,
          type: 'number'
        },
        {
          prop: 'unit',
          label: this.t('forms.columns.unit'),
          width: 80
        },
        {
          prop: 'description',
          label: this.t('forms.columns.description'),
          showOverflowTooltip: true
        }
      ]
    },
    
    // 设备记录表格列
    equipmentColumns() {
      return [
        {
          prop: 'equipment',
          label: this.t('forms.columns.equipmentName'),
          minWidth: 150
        },
        {
          prop: 'hours',
          label: this.t('forms.columns.usageHours'),
          width: 100,
          type: 'number'
        },
        {
          prop: 'operator',
          label: this.t('forms.columns.operator'),
          width: 120
        },
        {
          prop: 'description',
          label: this.t('forms.columns.description'),
          showOverflowTooltip: true
        }
      ]
    },
    
    // 检查是否有自定义字段值
    hasCustomValues() {
      return Object.keys(this.customValues).length > 0
    },
    
    // 检查是否有权限信息
    hasPermissionInfo() {
      if (!this.selectedForm) return false
      const permissionFields = ['assignee', 'reviewer', 'approver', 'signature', 'permissions', 'userPermissions', 'groupPermissions']
      return permissionFields.some(field => this.selectedForm[field])
    },
    
    // 获取工作流信息
    workflowInfo() {
      if (!this.selectedForm) return []
      
      const workflowInfo = []
      
      // 检查工作流相关字段
      const workflowFields = {
        'assignee': 'Assigned To',
        'reviewer': 'Reviewer', 
        'approver': 'Approver',
        'signature': 'Signature Status',
        'workflow': 'Workflow',
        'process': 'Process'
      }
      
      Object.keys(workflowFields).forEach(key => {
        if (this.selectedForm[key]) {
          workflowInfo.push(`${workflowFields[key]}: ${this.selectedForm[key]}`)
        }
      })
      
      return workflowInfo
    },
    
    // 获取权限详情
    permissionDetails() {
      if (!this.selectedForm) return []
      
      const permissions = []
      
      // 检查用户权限
      if (this.selectedForm.userPermissions && Array.isArray(this.selectedForm.userPermissions)) {
        this.selectedForm.userPermissions.forEach((perm, index) => {
          permissions.push({
            label: `User Permission ${index + 1}`,
            value: typeof perm === 'object' ? JSON.stringify(perm) : perm
          })
        })
      }
      
      // 检查组权限
      if (this.selectedForm.groupPermissions && Array.isArray(this.selectedForm.groupPermissions)) {
        this.selectedForm.groupPermissions.forEach((perm, index) => {
          permissions.push({
            label: `Group Permission ${index + 1}`,
            value: typeof perm === 'object' ? JSON.stringify(perm) : perm
          })
        })
      }
      
      // 检查其他权限相关字段
      const otherPermissionFields = ['permissions', 'roles', 'access', 'capabilities']
      otherPermissionFields.forEach(field => {
        if (this.selectedForm[field]) {
          permissions.push({
            label: field,
            value: typeof this.selectedForm[field] === 'object' ? JSON.stringify(this.selectedForm[field]) : this.selectedForm[field]
          })
        }
      })
      
      return permissions
    },
    
    // 获取自定义字段值
    customValues() {
      if (!this.selectedForm) return {}
      
      const excludedKeys = ['name', 'status', 'formDate', 'createdAt', 'updatedAt', 'createdBy', 'pdfUrl', 'tabularValues', 'id', 'urn']
      const customValues = {}
      
      Object.keys(this.selectedForm).forEach(key => {
        if (!excludedKeys.includes(key) && this.selectedForm[key] !== null && this.selectedForm[key] !== undefined) {
          customValues[key] = this.selectedForm[key]
        }
      })
      
      return customValues
    },

    // 模板相关计算属性
    selectedTemplateId() {
      return this.selectedTemplate ? String(this.selectedTemplate.id) : ''
    },

    templateDetailKey() {
      return this.selectedTemplate ? `template-detail-${this.selectedTemplate.id}` : 'template-detail-empty'
    }
  },
  async mounted() {
    await this.initializeProject()
  },
  methods: {
    async fetchFormsData() {
      if (!this.currentProject) {
        this.error = this.t('forms.errors.noProjectSelected')
        return
      }

      this.loading = true
      this.error = null
      
      console.log('开始获取表单数据...', '项目:', this.currentProject.name)
      
      try {
        const response = await axios.get('/api/forms/jarvis', {
          timeout: 30000, // 30秒超时
          params: {
            projectId: this.currentProject.id
          }
        })
        
        console.log('API响应:', response)
        
        // 检查响应类型
        if (response.headers['content-type']?.includes('application/json')) {
          this.formsData = response.data
          console.log('表单数据获取成功:', this.formsData)
        } else {
          // 如果返回HTML，说明需要重新认证
          console.log('响应不是JSON格式，可能需要重新认证')
          throw new Error('Re-authentication required')
        }
      } catch (error) {
        console.error('获取表单数据失败:', error)
        
        if (error.code === 'ECONNABORTED') {
          this.error = this.t('forms.errors.requestTimeout')
        } else if (error.response?.status === 401) {
          this.error = this.t('forms.errors.noAccessToken')
        } else if (error.response?.status === 403) {
          this.error = this.t('forms.errors.insufficientPermissions')
        } else if (error.response?.status === 404) {
          this.error = this.t('forms.errors.apiNotFound')
        } else if (error.response?.status >= 500) {
          this.error = this.t('forms.errors.serverError')
        } else {
          this.error = this.t('forms.errors.fetchError', { message: error.response?.data?.message || error.message })
        }
      } finally {
        this.loading = false
        console.log('表单数据获取完成，loading状态:', this.loading)
      }
    },

    getTotalWorklogEntries() {
      if (!this.formsData?.forms) return 0
      return this.formsData.forms.reduce((total, form) => {
        return total + (form.tabularValues?.worklogEntries?.length || 0)
      }, 0)
    },

    getTotalMaterialsEntries() {
      if (!this.formsData?.forms) return 0
      return this.formsData.forms.reduce((total, form) => {
        return total + (form.tabularValues?.materialsEntries?.length || 0)
      }, 0)
    },

    getTotalEquipmentEntries() {
      if (!this.formsData?.forms) return 0
      return this.formsData.forms.reduce((total, form) => {
        return total + (form.tabularValues?.equipmentEntries?.length || 0)
      }, 0)
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      try {
        return new Date(dateString).toLocaleString('en-US')
      } catch {
        return dateString
      }
    },

    async exportJson() {
      try {
        const response = await axios.get('/api/forms/export-json', {
          responseType: 'blob'
        })
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `forms_data_${Date.now()}.json`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        this.$message.success(this.t('forms.exportSuccess'))
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error(this.t('forms.exportError', { message: error.response?.data?.message || error.message }))
      }
    },
    
    startAuth() {
      window.location.href = '/auth/start'
    },
    
    refreshData() {
      this.fetchFormsData()
    },
    
    cancelLoading() {
      this.loading = false
      this.error = this.t('forms.loadingCancelled')
      console.log('用户cancel了加载操作')
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
        case 'export':
          this.exportJson()
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
          this.exportJson()
          break
        case 'refresh':
          this.refreshData()
          break
      }
    },
    
    handleRowOperation(action, button, index) {
      const [operation, rowIndex] = action.split(':')
      const row = this.formsData.forms[parseInt(rowIndex)]
      
      switch(operation) {
        case 'view':
          this.showFormDetails(row)
          break
      }
    },
    
    // 显示表单详情
    showFormDetails(form) {
      this.selectedForm = form
      this.showFormDetailsDialog = true
      this.activeCollapseItems = ['worklog', 'materials', 'equipment']
    },
    
    // 转换时间跨度（从毫秒转换为小时）
    convertTimespan(timespan) {
      if (!timespan) return '0'
      // 假设 timespan 是毫秒，转换为小时
      const hours = timespan / (1000 * 60 * 60)
      return hours.toFixed(2)
    },
    
    
    // 下载 PDF
    async downloadPdf(pdfUrl) {
      try {
        this.$message.info('Downloading PDF...')
        
        // 直接打开 PDF 链接
        window.open(pdfUrl, '_blank')
        
        this.$message.success('PDF link opened')
      } catch (error) {
        console.error('下载 PDF 失败:', error)
        this.$message.error('PDF download failed')
      }
    },
    
    // 导出表单数据
    downloadFormData() {
      if (!this.selectedForm) return
      
      try {
        const dataStr = JSON.stringify(this.selectedForm, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        
        const url = window.URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `form_${this.selectedForm.name || 'data'}_${Date.now()}.json`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success('Form data exported successfully')
      } catch (error) {
        console.error('导出表单数据失败:', error)
        this.$message.error('Export failed')
      }
    },
    
    // 获取当前时间戳
    getCurrentTimestamp() {
      return new Date().toLocaleString('en-US')
    },
    
    // 获取状态类型
    getStatusType(status) {
      switch(status) {
        case 'submitted': return 'success'
        case 'approved': return 'success'
        case 'rejected': return 'danger'
        case 'pending': return 'warning'
        case 'draft': return 'info'
        default: return 'info'
      }
    },

    // QueryInfoCard 相关方法
    getFormsQueryFields() {
      if (!this.formsData) return []
      
      const fields = []
      
      // 工作记录统计
      const totalWorklog = this.getTotalWorklogEntries()
      const totalMaterials = this.getTotalMaterialsEntries()
      const totalEquipment = this.getTotalEquipmentEntries()
      
      fields.push({
        label: this.t('forms.worklogRecords'),
        value: this.t('forms.worklogCount', { count: totalWorklog }),
        component: 'StatusTag',
        props: { status: 'info', size: 'small', showIcon: false }
      })
      
      fields.push({
        label: this.t('forms.materialRecords'),
        value: this.t('forms.materialCount', { count: totalMaterials }),
        component: 'StatusTag',
        props: { status: 'success', size: 'small', showIcon: false }
      })
      
      fields.push({
        label: this.t('forms.equipmentRecords'),
        value: this.t('forms.equipmentCount', { count: totalEquipment }),
        component: 'StatusTag',
        props: { status: 'warning', size: 'small', showIcon: false }
      })
      
      // PDF可用统计
      const formsWithPdf = this.formsData.forms?.filter(form => form.pdfUrl)?.length || 0
      fields.push({
        label: 'PDF Available',
        value: `${formsWithPdf} forms`,
        component: 'StatusTag',
        props: { status: 'info', size: 'small', showIcon: false }
      })
      
      return fields
    },

    // 获取表单工作流信息 (从表单数据中提取)
    getFormWorkflowInfo(form) {
      if (!form) return null

      // 从表单数据中提取工作流相关信息
      const workflowInfo = {
        template_id: form.id,
        template_name: form.name,
        roles_and_permissions: {},
        statuses: [],
        workflow_rules: {},
        participants: [],
        template_structure: {
          total_keys: Object.keys(form).length,
          top_level_keys: Object.keys(form),
          has_form_definition: !!form.formDefinition,
          has_workflow: !!form.workflow,
          has_settings: !!form.settings,
          has_permissions: !!form.permissions
        },
        form_fields: [],
        approval_settings: {}
      }

      // 提取审批设置，并映射实体名称
      const approvalKeys = ['status', 'assignee', 'reviewer', 'approver', 'signature', 'workflow']
      approvalKeys.forEach(key => {
        if (form[key] !== undefined && form[key] !== null) {
          let value = form[key]
          
          // 对于人员相关字段，尝试映射为显示名称
          if (['assignee', 'reviewer', 'approver'].includes(key)) {
            const typeKey = key + 'Type'
            const entityType = form[typeKey] || 'auto'
            const displayName = this.getEntityDisplayName(value, entityType)
            
            workflowInfo.approval_settings[key] = {
              id: value,
              type: entityType,
              displayName: displayName,
              original: value
            }
          } else {
            workflowInfo.approval_settings[key] = value
          }
        }
      })

      // 处理参与者信息
      if (form.participants && Array.isArray(form.participants)) {
        workflowInfo.participants = form.participants.map(participant => ({
          ...participant,
          displayName: this.getEntityDisplayName(participant.id, participant.type || 'auto')
        }))
      }

      // 处理角色和权限信息
      if (form.roles || form.permissions) {
        const rolesAndPermissions = {}
        
        if (form.roles && Array.isArray(form.roles)) {
          form.roles.forEach(role => {
            const roleDisplayName = this.getEntityDisplayName(role.id || role, 'role')
            rolesAndPermissions[role.id || role] = {
              type: 'role',
              displayName: roleDisplayName,
              permissions: role.permissions || []
            }
          })
        }
        
        workflowInfo.roles_and_permissions = rolesAndPermissions
      }

      // 如果有任何工作流相关信息，返回数据，否则返回null
      const hasWorkflowInfo = Object.keys(workflowInfo.approval_settings).length > 0 ||
                              workflowInfo.template_structure.has_workflow ||
                              workflowInfo.template_structure.has_permissions ||
                              workflowInfo.participants.length > 0

      return hasWorkflowInfo ? workflowInfo : null
    },

    // 项目初始化方法
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
        console.log('从URL获取项目信息:', this.currentProject)
      } else {
        // 尝试从localStorage获取之前选择的项目
        const savedProject = projectStore.getSelectedProject()
        if (savedProject) {
          this.currentProject = savedProject
          console.log('从localStorage获取项目信息:', this.currentProject)
        }
      }

      if (this.currentProject) {
        // 有项目信息，初始化实体缓存并获取数据
        await this.initializeEntityCache()
        await this.fetchFormsData()
      } else {
        // 没有项目信息，显示项目选择对话框
        this.showProjectSelector = true
      }
    },

    // 初始化实体缓存
    async initializeEntityCache() {
      if (!this.currentProject?.id || this.entitiesLoaded) {
        return
      }

      try {
        console.log('🏢 FormsData: 开始初始化实体缓存...')
        this.entitiesLoading = true
        
        // 获取项目实体数据（用户、角色、公司）
        await entityCache.getProjectEntities(this.currentProject.id)
        
        this.entitiesLoaded = true
        console.log('✅ FormsData: 实体缓存初始化完成')
      } catch (error) {
        console.error('❌ FormsData: 实体缓存初始化失败:', error)
      } finally {
        this.entitiesLoading = false
      }
    },

    // 获取创建者显示名称
    getCreatedByDisplayName(createdBy) {
      if (!createdBy) return this.t('common.notAvailable')
      
      // 调试信息
      console.log('🔍 FormsData获取创建者显示名称:', {
        createdBy,
        projectId: this.currentProject?.id,
        entitiesLoaded: this.entitiesLoaded
      })
      
      // 尝试从实体缓存获取用户显示名称
      const displayName = entityCache.getUserDisplayName(createdBy, this.currentProject?.id)
      
      console.log('📝 FormsData创建者映射结果:', {
        原始ID: createdBy,
        映射结果: displayName,
        是否成功: displayName !== createdBy
      })
      
      return displayName !== createdBy ? displayName : createdBy
    },

    // 获取指派对象显示名称
    getAssigneeDisplayName(assignee, assigneeType) {
      if (!assignee) return this.t('forms.unassigned')
      
      const displayName = entityCache.getAssignedToDisplayName(assignee, assigneeType, this.currentProject?.id)
      return displayName
    },

    // 获取审核者显示名称
    getReviewerDisplayName(reviewer, reviewerType) {
      if (!reviewer) return this.t('forms.notSet')
      
      const displayName = entityCache.getAssignedToDisplayName(reviewer, reviewerType, this.currentProject?.id)
      return displayName
    },

    // 获取审批者显示名称
    getApproverDisplayName(approver, approverType) {
      if (!approver) return this.t('forms.notSet')
      
      const displayName = entityCache.getAssignedToDisplayName(approver, approverType, this.currentProject?.id)
      return displayName
    },

    // 获取实体显示名称（通用方法）
    getEntityDisplayName(entityId, entityType) {
      if (!entityId) return this.t('common.unknown')
      
      const displayName = entityCache.getEntityDisplayName(entityId, entityType, this.currentProject?.id)
      return displayName
    },

    // 处理项目选择确认
    async handleProjectSelected(selectedProject) {
      this.currentProject = selectedProject
      projectStore.saveSelectedProject(selectedProject)
      this.$message.success(`Selected project: ${selectedProject.name}`)
      
      // 重置实体缓存状态
      this.entitiesLoaded = false
      
      // 初始化新项目的实体缓存
      await this.initializeEntityCache()
      
      await this.fetchFormsData()
    },

    // 处理项目选择cancel
    handleProjectSelectionCancel() {
      // 如果cancel选择且没有当前项目，返回首页
      if (!this.currentProject) {
        this.$router.push('/')
      }
    },

    // Form参照相关事件处理
    onFormReferencesLoaded(data) {
      console.log('Form参照加载成功:', data)
      this.$message.success(this.t('forms.references.loadSuccess', { count: data.references?.length || 0 }))
    },

    onFormReferencesError(error) {
      console.error('Form参照加载失败:', error)
      this.$message.error(this.t('forms.references.loadFailed'))
    },

    onFormReferenceDownloadSuccess(data) {
      console.log('Form参照下载成功:', data)
      this.$message.success(this.t('forms.references.downloadSuccess', { name: data.documentName }))
    },

    onFormReferenceDownloadError(error) {
      console.error('Form参照下载失败:', error)
      this.$message.error(this.t('forms.references.downloadFailed'))
    },

    // 模板相关方法
    handleTemplateDetail(template) {
      console.log('FormsData: Opening template detail for:', template)
      this.selectedTemplate = template
      this.showTemplateDetailsDialog = true
    },

    handleTemplatesLoaded(templatesData) {
      console.log('FormsData: Templates data loaded:', templatesData)
      this.templatesData = templatesData
    },

    handleCloseTemplateDialog() {
      try {
        this.showTemplateDetailsDialog = false
        this.selectedTemplate = null
      } catch (error) {
        console.error('关闭模板弹窗时发生错误:', error)
        // 强制重置状态
        this.showTemplateDetailsDialog = false
        this.selectedTemplate = null
      }
    },

    downloadTemplateData() {
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
    }
    
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.forms-data {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

/* 表单详情样式 */
.form-details {
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  margin: var(--spacing-md);
}

.form-details h4, .form-details h5 {
  color: var(--color-text-primary);
  margin: var(--spacing-lg) 0 var(--spacing-md) 0;
  font-weight: 600;
}

/* 工作记录统计样式 */
.work-records-stats {
  padding: var(--spacing-md) 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-light);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: 2rem;
  opacity: 0.8;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 工作统计标签 */
.work-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

/* 表单详情对话框样式 */
.form-details-dialog {
  --el-dialog-padding-primary: 0;
}

/* 模板详情对话框样式 */
.template-details-dialog {
  --el-dialog-padding-primary: 0;
  --el-dialog-border-radius: 12px;
}

.form-details-content {
  max-height: 80vh;
  overflow-y: auto;
  padding: 0 24px;
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

/* 工作统计网格 */
.work-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 24px;
  opacity: 0.8;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  font-weight: 500;
}

/* 折叠面板样式 */
.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.collapse-icon {
  font-size: 16px;
}

/* 自定义字段值网格 */
.custom-values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.custom-value-item {
  padding: 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
}

.custom-value-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-value-content {
  font-size: 14px;
  color: var(--color-text-primary);
  word-break: break-word;
}


/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

/* 工作流时间线样式 */
.timeline-content {
  padding: 8px 0;
}

.timeline-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.timeline-content p {
  margin: 4px 0;
  font-size: 13px;
  color: var(--color-text-regular);
}

.workflow-info {
  margin-top: 8px;
}

.workflow-info strong {
  color: var(--color-text-primary);
  margin-right: 8px;
}

/* 权限网格样式 */
.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.permission-item {
  padding: 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  border-left: 3px solid var(--color-warning);
}

.permission-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.permission-value {
  font-size: 13px;
  color: var(--color-text-primary);
  word-break: break-word;
  max-height: 100px;
  overflow-y: auto;
}

/* 附加信息样式 */
.additional-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.info-item {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-primary);
}

.info-item strong {
  color: var(--color-text-primary);
  display: block;
  margin-bottom: var(--spacing-xs);
}

.info-item p {
  color: var(--color-text-regular);
  margin: 0;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-md);
  }
}

@media (max-width: 768px) {
  .forms-data {
    padding: var(--spacing-md);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .stat-card {
    padding: var(--spacing-md);
    gap: var(--spacing-sm);
  }
  
  .stat-icon {
    font-size: 1.5rem;
  }
  
  .stat-value {
    font-size: 1.2rem;
  }
  
  .work-stats {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-xs);
  }
  
  .stat-icon {
    font-size: 1.3rem;
  }
  
  .stat-value {
    font-size: 1.1rem;
  }
  
  /* 表单详情对话框响应式 */
  .work-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .custom-values-grid {
    grid-template-columns: 1fr;
  }
  
  .permission-grid {
    grid-template-columns: 1fr;
  }
  
  .form-details-content {
    padding: 0 12px;
  }
  
  .timeline-content h4 {
    font-size: 13px;
  }
  
  .timeline-content p {
    font-size: 12px;
  }
}
</style>

