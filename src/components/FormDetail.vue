<template>
  <div class="form-detail">
    <!-- Form Header -->
    <div class="form-header">
      <div class="form-title-section">
        <h1 class="form-title">{{ form.name || 'Untitled Form' }}</h1>
        <div class="form-meta">
          <el-tag :type="getStatusType(form.status)" size="large">
            {{ form.status || 'Unknown' }}
          </el-tag>
          <span class="form-number" v-if="form.formNum">
            Form #{{ form.formNum }}
          </span>
          <span class="form-date" v-if="form.formDate">
            {{ formatDate(form.formDate) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <el-tabs v-model="activeTab" type="card" class="form-tabs">
      
      <!-- Basic Information Tab -->
      <el-tab-pane label="Basic Info" name="basic">
        <div class="tab-content">
          
          <!-- Form Overview -->
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><InfoFilled /></el-icon>
                  Form Overview
                </span>
              </div>
            </template>
            
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Form ID">
                <code class="id-code">{{ form.id }}</code>
              </el-descriptions-item>
              <el-descriptions-item label="Project ID">
                <code class="id-code">{{ form.projectId }}</code>
              </el-descriptions-item>
              <el-descriptions-item label="Form Number" v-if="form.formNum">
                <el-tag type="info">{{ form.formNum }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Form Date" v-if="form.formDate">
                {{ formatDate(form.formDate) }}
              </el-descriptions-item>
              <el-descriptions-item label="Status">
                <el-tag :type="getStatusType(form.status)">{{ form.status }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Location ID" v-if="form.locationId">
                <code class="id-code">{{ form.locationId }}</code>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- Assignment Information -->
          <el-card class="info-card" shadow="never" v-if="form.assigneeId || form.assigneeType">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><User /></el-icon>
                  Assignment
                </span>
              </div>
            </template>
            
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Assignee" v-if="form.assigneeId">
                <el-tag type="warning">{{ getAssigneeDisplayName(form.assigneeId, form.assigneeType) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Assignee Type" v-if="form.assigneeType">
                <el-tag type="info">{{ form.assigneeType }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- Workflow Timeline -->
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><Clock /></el-icon>
                  Workflow Timeline
                </span>
                <el-button v-if="form.formTemplate?.id" type="text" size="small" @click="loadWorkflowInfo">
                  <el-icon><Refresh /></el-icon>
                  Load Workflow Details
                </el-button>
              </div>
            </template>
            
            <!-- Basic Timeline -->
            <div class="timeline-section">
              <el-timeline>
                <el-timeline-item 
                  v-if="form.userCreatedAt || form.createdAt"
                  :timestamp="formatDateTime(form.userCreatedAt || form.createdAt)"
                  type="primary"
                  icon="Plus">
                  <div class="timeline-content">
                    <h4>Form Created</h4>
                    <p v-if="form.createdBy">Created by: <el-tag type="success" size="small">{{ getUserDisplayName(form.createdBy) }}</el-tag></p>
                    <p v-if="form.formDate">Form Date: {{ formatDate(form.formDate) }}</p>
                  </div>
                </el-timeline-item>
                
                <el-timeline-item 
                  v-if="form.updatedAt && form.updatedAt !== form.createdAt"
                  :timestamp="formatDateTime(form.updatedAt)"
                  type="warning"
                  icon="Edit">
                  <div class="timeline-content">
                    <h4>Form Updated</h4>
                    <p>Last modification time</p>
                  </div>
                </el-timeline-item>
                
                <el-timeline-item 
                  v-if="form.lastReopenedBy"
                  :timestamp="formatDateTime(form.updatedAt)"
                  type="info"
                  icon="RefreshRight">
                  <div class="timeline-content">
                    <h4>Form Reopened</h4>
                    <p>Reopened by: <el-tag type="warning" size="small">{{ getUserDisplayName(form.lastReopenedBy) }}</el-tag></p>
                  </div>
                </el-timeline-item>
                
                <el-timeline-item 
                  :timestamp="formatDateTime(form.updatedAt)"
                  :type="getStatusType(form.status)"
                  icon="CircleCheck">
                  <div class="timeline-content">
                    <h4>Current Status</h4>
                    <p>Status: <el-tag :type="getStatusType(form.status)">{{ form.status }}</el-tag></p>
                    <p v-if="form.lastSubmitterSignature">Digital signature available</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>

            <!-- Workflow Information (if available) -->
            <div v-if="workflowInfo" class="workflow-info-section">
              <el-divider content-position="left">
                <span class="divider-text">
                  <el-icon><Share /></el-icon>
                  Workflow Information
                </span>
              </el-divider>
              
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="Workflow Name" v-if="workflowInfo.name">
                  {{ workflowInfo.name }}
                </el-descriptions-item>
                <el-descriptions-item label="Total Steps" v-if="workflowInfo.steps_count">
                  <el-tag type="info">{{ workflowInfo.steps_count }} steps</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="Approval Options" v-if="workflowInfo.approval_options_count">
                  <el-tag type="success">{{ workflowInfo.approval_options_count }} options</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="Allow Initiator Edit" v-if="workflowInfo.allow_initiator_edit !== undefined">
                  <el-tag :type="workflowInfo.allow_initiator_edit ? 'success' : 'info'">
                    {{ workflowInfo.allow_initiator_edit ? 'Yes' : 'No' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <!-- Workflow Steps -->
              <div v-if="workflowInfo.steps && workflowInfo.steps.length > 0" class="workflow-steps">
                <h4>Workflow Steps</h4>
                <el-steps :active="getCurrentStepIndex()" direction="vertical" size="small">
                  <el-step 
                    v-for="(step, index) in workflowInfo.steps" 
                    :key="index"
                    :title="step.name || `Step ${index + 1}`"
                    :description="step.description || getStepDescription(step)"
                    :status="getStepStatus(step, index)">
                  </el-step>
                </el-steps>
              </div>
            </div>
          </el-card>

          <!-- Form Template -->
          <el-card class="info-card" shadow="never" v-if="form.formTemplate">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><Document /></el-icon>
                  Form Template
                </span>
              </div>
            </template>
            
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Template ID">
                <code class="id-code">{{ form.formTemplate.id }}</code>
              </el-descriptions-item>
              <el-descriptions-item label="Template Name">
                {{ form.formTemplate.name }}
              </el-descriptions-item>
              <el-descriptions-item label="Template Type" v-if="form.formTemplate.templateType">
                <el-tag type="primary">{{ form.formTemplate.templateType }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Template Status" v-if="form.formTemplate.status">
                <el-tag :type="getStatusType(form.formTemplate.status)">
                  {{ form.formTemplate.status }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- Description and Notes -->
          <el-card class="info-card" shadow="never" v-if="form.description || form.notes">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><EditPen /></el-icon>
                  Description & Notes
                </span>
              </div>
            </template>
            
            <div class="content-section">
              <div v-if="form.description" class="description-section">
                <h4>Description</h4>
                <p class="content-text">{{ form.description }}</p>
              </div>
              <div v-if="form.notes" class="notes-section">
                <h4>Notes</h4>
                <p class="content-text">{{ form.notes }}</p>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Work Records Tab -->
      <el-tab-pane label="Work Records" name="workRecords">
        <div class="tab-content">
          
          <!-- Work Records Summary -->
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><DataAnalysis /></el-icon>
                  Work Records Summary
                </span>
              </div>
            </template>
            
            <div class="work-stats-grid">
              <div class="stat-item">
                <div class="stat-icon">📝</div>
                <div class="stat-content">
                  <div class="stat-number">{{ getWorklogCount() }}</div>
                  <div class="stat-label">Worklog Entries</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">🧱</div>
                <div class="stat-content">
                  <div class="stat-number">{{ getMaterialsCount() }}</div>
                  <div class="stat-label">Material Entries</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">🔧</div>
                <div class="stat-content">
                  <div class="stat-number">{{ getEquipmentCount() }}</div>
                  <div class="stat-label">Equipment Entries</div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- Detailed Work Records -->
          <el-collapse v-model="activeCollapseItems" class="work-records-collapse">
            
            <!-- Worklog Entries -->
            <el-collapse-item name="worklog" v-if="hasWorklogEntries()">
              <template #title>
                <div class="collapse-title">
                  <span class="collapse-icon">📝</span>
                  <span>Worklog Records ({{ getWorklogCount() }})</span>
                </div>
              </template>
              
              <el-table :data="form.tabularValues.worklogEntries" stripe>
                <el-table-column label="Trade" prop="trade" />
                <el-table-column label="Headcount" prop="headcount" />
                <el-table-column label="Hours">
                  <template #default="scope">
                    {{ formatHours(scope.row.timespan) }}
                  </template>
                </el-table-column>
                <el-table-column label="Description" prop="description" />
              </el-table>
            </el-collapse-item>

            <!-- Materials Entries -->
            <el-collapse-item name="materials" v-if="hasMaterialsEntries()">
              <template #title>
                <div class="collapse-title">
                  <span class="collapse-icon">🧱</span>
                  <span>Material Records ({{ getMaterialsCount() }})</span>
                </div>
              </template>
              
              <el-table :data="form.tabularValues.materialsEntries" stripe>
                <el-table-column label="Item" prop="item" />
                <el-table-column label="Quantity" prop="quantity" />
                <el-table-column label="Unit" prop="unit" />
                <el-table-column label="Description" prop="description" />
              </el-table>
            </el-collapse-item>

            <!-- Equipment Entries -->
            <el-collapse-item name="equipment" v-if="hasEquipmentEntries()">
              <template #title>
                <div class="collapse-title">
                  <span class="collapse-icon">🔧</span>
                  <span>Equipment Records ({{ getEquipmentCount() }})</span>
                </div>
              </template>
              
              <el-table :data="form.tabularValues.equipmentEntries" stripe>
                <el-table-column label="Item" prop="item" />
                <el-table-column label="Quantity" prop="quantity" />
                <el-table-column label="Hours">
                  <template #default="scope">
                    {{ formatHours(scope.row.timespan) }}
                  </template>
                </el-table-column>
                <el-table-column label="Description" prop="description" />
              </el-table>
            </el-collapse-item>
          </el-collapse>

          <!-- Custom Values -->
          <el-card v-if="hasCustomValues()" class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><Setting /></el-icon>
                  Custom Fields
                </span>
              </div>
            </template>
            
            <el-table :data="form.customValues" stripe>
              <el-table-column label="Field Name" prop="name" />
              <el-table-column label="Value" prop="value" />
              <el-table-column label="Type" prop="type" />
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Weather Tab -->
      <el-tab-pane v-if="form.weather" label="Weather" name="weather">
        <div class="tab-content">
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><Sunny /></el-icon>
                  Weather Information
                </span>
              </div>
            </template>
            
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Summary" v-if="form.weather.summaryKey">
                <el-tag type="info">{{ form.weather.summaryKey }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Provider" v-if="form.weather.provider">
                <el-tag type="success">{{ form.weather.provider }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Temperature Range" v-if="form.weather.temperatureMin || form.weather.temperatureMax">
                {{ form.weather.temperatureMin }}° - {{ form.weather.temperatureMax }}° {{ form.weather.temperatureUnit }}
              </el-descriptions-item>
              <el-descriptions-item label="Humidity" v-if="form.weather.humidity">
                {{ Math.round(form.weather.humidity * 100) }}%
              </el-descriptions-item>
              <el-descriptions-item label="Wind Speed" v-if="form.weather.windSpeed">
                {{ form.weather.windSpeed }} {{ form.weather.speedUnit }}
              </el-descriptions-item>
              <el-descriptions-item label="Wind Gust" v-if="form.weather.windGust">
                {{ form.weather.windGust }} {{ form.weather.speedUnit }}
              </el-descriptions-item>
              <el-descriptions-item label="Precipitation" v-if="form.weather.precipitationAccumulation">
                {{ form.weather.precipitationAccumulation }} {{ form.weather.precipitationAccumulationUnit }}
              </el-descriptions-item>
              <el-descriptions-item label="Wind Bearing" v-if="form.weather.windBearing">
                {{ form.weather.windBearing }}°
              </el-descriptions-item>
            </el-descriptions>

            <!-- Hourly Weather -->
            <div v-if="form.weather.hourlyWeather && form.weather.hourlyWeather.length > 0" class="hourly-weather">
              <h4>Hourly Weather</h4>
              <el-table :data="form.weather.hourlyWeather" stripe size="small">
                <el-table-column label="Hour" prop="hour" />
                <el-table-column label="Temperature">
                  <template #default="scope">
                    {{ scope.row.temp }}° {{ form.weather.temperatureUnit }}
                  </template>
                </el-table-column>
                <el-table-column label="Wind Speed">
                  <template #default="scope">
                    {{ scope.row.windSpeed }} {{ form.weather.speedUnit }}
                  </template>
                </el-table-column>
                <el-table-column label="Humidity">
                  <template #default="scope">
                    {{ Math.round(scope.row.humidity * 100) }}%
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- PDF & Signature Tab -->
      <el-tab-pane v-if="form.pdfUrl || form.lastSubmitterSignature || hasPdfValues()" label="PDF & Signature" name="pdfSignature">
        <div class="tab-content">
          
          <!-- PDF Information -->
          <el-card v-if="form.pdfUrl" class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><Document /></el-icon>
                  PDF Document
                </span>
              </div>
            </template>
            
            <el-descriptions :column="1" border>
              <el-descriptions-item label="PDF Document">
                <div class="pdf-actions">
                  <el-link :href="form.pdfUrl" target="_blank" type="primary" :download="getPdfFileName()">
                    <el-icon><Download /></el-icon>
                    Download PDF
                  </el-link>
                  <el-link :href="form.pdfUrl" target="_blank" type="info" style="margin-left: 12px;">
                    <el-icon><View /></el-icon>
                    View Online
                  </el-link>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- PDF Values -->
          <el-card v-if="hasPdfValues()" class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><List /></el-icon>
                  PDF Form Values
                </span>
              </div>
            </template>
            
            <el-table :data="form.pdfValues" stripe>
              <el-table-column label="Field Name" prop="name" />
              <el-table-column label="Value" prop="value" />
            </el-table>
          </el-card>

          <!-- Signature Information -->
          <el-card v-if="form.lastSubmitterSignature" class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <el-icon><Edit /></el-icon>
                  Digital Signature
                </span>
              </div>
            </template>
            
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Last Submitter">
                <el-tag type="success">{{ getUserDisplayName(form.lastReopenedBy) || 'Unknown' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Signature Status">
                <el-tag type="success">Signed</el-tag>
              </el-descriptions-item>
            </el-descriptions>
            
            <!-- Signature Preview -->
            <div class="signature-preview">
              <h4>Signature Preview</h4>
              <div class="signature-svg" v-html="form.lastSubmitterSignature"></div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- References Tab -->
      <el-tab-pane label="References" name="references">
        <div class="tab-content">
          <EntityReferences
            :entity="form"
            :project="project"
            entity-type="form"
            :auto-load="true"
            :show-debug-info="false"
            :show-json-viewer="false"
            :supported-reference-types="['document', 'file', 'photo', 'issue']"
            @references-loaded="onReferencesLoaded"
            @references-error="onReferencesError"
            @download-success="onReferenceDownloadSuccess"
            @download-error="onReferenceDownloadError" />
        </div>
      </el-tab-pane>

      <!-- Raw Data Tab -->
      <el-tab-pane label="Raw Data" name="rawData">
        <div class="tab-content">
          <JsonViewer
            :data="form"
            title="Form Raw Data"
            description="Complete form data as returned by the API"
            :show-copy="true"
            :show-download="true"
            :collapsible="true"
            :collapsed="false" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { InfoFilled, User, Clock, Document, EditPen, DataAnalysis, Setting, Sunny, Edit, List, Download, View, Refresh, Plus, RefreshRight, CircleCheck, Share } from '@element-plus/icons-vue'
import EntityReferences from './EntityReferences.vue'
import JsonViewer from './JsonViewer.vue'
import { formatDateTime, formatDate } from '../utils/dateUtils.js'
import entityCache from '../utils/entityCache.js'

export default {
  name: 'FormDetail',
  components: {
    EntityReferences,
    JsonViewer,
    InfoFilled,
    User,
    Clock,
    Document,
    EditPen,
    DataAnalysis,
    Setting,
    Sunny,
    Edit,
    List,
    Download,
    View,
    Refresh,
    Plus,
    RefreshRight,
    CircleCheck,
    Share
  },
  props: {
    form: {
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
      activeTab: 'basic',
      activeCollapseItems: ['worklog', 'materials', 'equipment'],
      workflowInfo: null,
      workflowLoading: false,
      entityCache: entityCache,
      entitiesLoaded: false
    }
  },
  async mounted() {
    // Load entity cache for user/role/company mapping
    if (this.project?.id) {
      try {
        await this.entityCache.getProjectEntities(this.project.id)
        this.entitiesLoaded = true
        console.log('✅ Form detail entity cache loaded')
      } catch (error) {
        console.warn('⚠️ Failed to load entity cache for form detail:', error)
      }
    }
  },
  methods: {
    // Date formatting
    formatDateTime(dateString) {
      return formatDateTime(dateString)
    },

    formatDate(dateString) {
      return formatDate(dateString)
    },

    // Hours formatting
    formatHours(timespan) {
      if (!timespan) return '0h'
      const hours = timespan / 3600000 // Convert to hours
      return `${Math.round(hours * 10) / 10}h`
    },

    // Status type mapping
    getStatusType(status) {
      const statusMap = {
        'draft': 'info',
        'submitted': 'success',
        'approved': 'success',
        'rejected': 'danger',
        'pending': 'warning',
        'active': 'success',
        'inactive': 'info'
      }
      return statusMap[status] || 'info'
    },

    // Work records helpers
    hasWorklogEntries() {
      return this.form.tabularValues?.worklogEntries && this.form.tabularValues.worklogEntries.length > 0
    },

    hasMaterialsEntries() {
      return this.form.tabularValues?.materialsEntries && this.form.tabularValues.materialsEntries.length > 0
    },

    hasEquipmentEntries() {
      return this.form.tabularValues?.equipmentEntries && this.form.tabularValues.equipmentEntries.length > 0
    },

    getWorklogCount() {
      return this.form.tabularValues?.worklogEntries?.length || 0
    },

    getMaterialsCount() {
      return this.form.tabularValues?.materialsEntries?.length || 0
    },

    getEquipmentCount() {
      return this.form.tabularValues?.equipmentEntries?.length || 0
    },

    // Custom values helper
    hasCustomValues() {
      return this.form.customValues && this.form.customValues.length > 0
    },

    // PDF values helper
    hasPdfValues() {
      return this.form.pdfValues && this.form.pdfValues.length > 0
    },

    // Generate PDF filename with proper extension
    getPdfFileName() {
      const formName = (this.form.name || 'form').replace(/[^a-zA-Z0-9]/g, '_')
      const formNum = this.form.formNum ? `_${this.form.formNum}` : ''
      const timestamp = new Date().toISOString().slice(0, 10)
      return `${formName}${formNum}_${timestamp}.pdf`
    },

    // Get user display name using entity cache
    getUserDisplayName(userId) {
      if (!userId) return 'Unknown User'
      return this.entityCache.getUserDisplayName(userId, this.project?.id) || `User-${userId}`
    },

    // Get role display name using entity cache
    getRoleDisplayName(roleId) {
      if (!roleId) return 'Unknown Role'
      return this.entityCache.getRoleDisplayName(roleId, this.project?.id) || `Role-${roleId}`
    },

    // Get company display name using entity cache
    getCompanyDisplayName(companyId) {
      if (!companyId) return 'Unknown Company'
      return this.entityCache.getCompanyDisplayName(companyId, this.project?.id) || `Company-${companyId}`
    },

    // Get assignee display name with type detection
    getAssigneeDisplayName(assigneeId, assigneeType) {
      if (!assigneeId) return 'Unassigned'
      return this.entityCache.getAssignedToDisplayName(assigneeId, assigneeType, this.project?.id) || `${assigneeType}-${assigneeId}`
    },

    // Load workflow information from template
    async loadWorkflowInfo() {
      if (!this.form.formTemplate?.id || !this.project?.id) return
      
      this.workflowLoading = true
      try {
        // First try to get template details which might contain workflow info
        const templateResponse = await fetch(`/api/forms/templates?projectId=${this.project.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })
        
        if (templateResponse.ok) {
          const templateData = await templateResponse.json()
          const template = templateData.data?.find(t => t.id === this.form.formTemplate.id)
          
          if (template) {
            // Extract workflow information from template
            this.workflowInfo = {
              name: template.name || 'Unknown Workflow',
              steps: template.workflow?.steps || [],
              steps_count: template.workflow?.steps?.length || 0,
              approval_options_count: template.approvalStatusOptions?.length || 0,
              allow_initiator_edit: template.additionalOptions?.allowInitiatorToEdit || false,
              status: template.status,
              template_type: template.templateType
            }
          }
        }
        
        // Also try to get project workflows for additional context
        const workflowResponse = await fetch(`/api/workflows/${this.project.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })
        
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json()
          // Find matching workflow or use first available
          const workflow = workflowData.workflows_analysis?.[0]
          if (workflow && !this.workflowInfo) {
            this.workflowInfo = workflow
          }
        }
        
      } catch (error) {
        console.error('Failed to load workflow info:', error)
        this.$message.warning('Could not load workflow information')
      } finally {
        this.workflowLoading = false
      }
    },

    // Get current step index based on form status
    getCurrentStepIndex() {
      if (!this.workflowInfo?.steps) return 0
      
      const statusMap = {
        'draft': 0,
        'submitted': 1,
        'under_review': 2,
        'approved': this.workflowInfo.steps.length,
        'rejected': -1
      }
      
      return statusMap[this.form.status] || 0
    },

    // Get step status for timeline
    getStepStatus(step, index) {
      const currentIndex = this.getCurrentStepIndex()
      if (index < currentIndex) return 'finish'
      if (index === currentIndex) return 'process'
      return 'wait'
    },

    // Get step description
    getStepDescription(step) {
      if (step.description) return step.description
      if (step.assignees?.length) return `Assigned to ${step.assignees.length} users`
      if (step.type) return `Step type: ${step.type}`
      return 'Workflow step'
    },

    // Reference callbacks
    onReferencesLoaded(data) {
      console.log('Form references loaded:', data)
      this.$emit('references-loaded', data)
    },

    onReferencesError(error) {
      console.error('Form references error:', error)
      this.$emit('references-error', error)
    },

    onReferenceDownloadSuccess(data) {
      console.log('Form reference download success:', data)
      this.$emit('reference-download-success', data)
    },

    onReferenceDownloadError(error) {
      console.error('Form reference download error:', error)
      this.$emit('reference-download-error', error)
    }
  }
}
</script>

<style scoped>
.form-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-header {
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.form-title-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  line-height: 1.3;
}

.form-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.form-number,
.form-date {
  font-size: 14px;
  color: #6c757d;
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
}

.form-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
}

.tab-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
}

.id-code {
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  font-size: 12px;
  color: #495057;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.description-section,
.notes-section {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.description-section h4,
.notes-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.content-text {
  margin: 0;
  line-height: 1.6;
  color: #6c757d;
}

.work-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.work-records-collapse {
  margin-bottom: 20px;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.collapse-icon {
  font-size: 16px;
}

.hourly-weather {
  margin-top: 20px;
}

.hourly-weather h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.signature-preview {
  margin-top: 20px;
}

.signature-preview h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.signature-svg {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  text-align: center;
}

.signature-svg :deep(svg) {
  max-width: 100%;
  height: auto;
}

/* PDF Actions */
.pdf-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Timeline Styles */
.timeline-section {
  margin-bottom: 20px;
}

.timeline-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.timeline-content p {
  margin: 4px 0;
  font-size: 12px;
  color: #6c757d;
}

/* Workflow Information */
.workflow-info-section {
  margin-top: 20px;
}

.divider-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.workflow-steps {
  margin-top: 16px;
}

.workflow-steps h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-header {
    padding: 16px;
  }
  
  .form-title {
    font-size: 24px;
  }
  
  .form-meta {
    gap: 8px;
  }
  
  .tab-content {
    padding: 16px;
  }
  
  .work-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    padding: 12px;
  }
  
  .stat-number {
    font-size: 20px;
  }
}
</style>
