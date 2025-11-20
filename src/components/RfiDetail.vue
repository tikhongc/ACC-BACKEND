<template>
  <div class="rfi-detail">
    
    <!-- Tab Navigation -->
    <el-tabs v-model="activeTab" type="card" class="rfi-tabs">
      
      <!-- Basic Information Tab -->
      <el-tab-pane label="Basic Information" name="basic">
        <div class="tab-content">
          
    <!-- RFI Basic Information -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-file />Basic Information</span>
          <div class="header-tags">
            <StatusTag 
              :status="rfi.status_type" 
              :text="rfi.status" 
              size="default" />
            <StatusTag 
              :status="rfi.priority_type" 
              :text="rfi.priority || 'Normal'" 
              size="default" />
          </div>
        </div>
      </template>
      
      <!-- Title and Status Row -->
      <div class="rfi-header-section">
        <div class="rfi-title-container">
          <h2 class="rfi-main-title">{{ rfi.title }}</h2>
          <div class="rfi-subtitle" v-if="rfi.display_name && rfi.display_name !== rfi.title">
            {{ rfi.display_name }}
          </div>
        </div>
      </div>

      <!-- ID and Number Information -->
      <div class="rfi-ids-section">
        <div class="id-item">
          <span class="id-label">RFI ID</span>
          <span class="rfi-id">{{ rfi.id }}</span>
        </div>
        <div class="id-item" v-if="rfi.custom_identifier">
          <span class="id-label">Custom ID</span>
          <span class="custom-id">{{ rfi.custom_identifier }}</span>
        </div>
        <div class="id-item" v-if="rfi.raw_data?.reference">
          <span class="id-label">Reference ID</span>
          <span class="reference-id">{{ rfi.raw_data.reference }}</span>
        </div>
        <div class="id-item" v-if="rfi.display_id">
          <span class="id-label">Display ID</span>
          <span class="display-id">{{ rfi.display_id }}</span>
        </div>
      </div>

      <!-- Description Content -->
      <div class="rfi-description-section" v-if="rfi.description || rfi.question">
        <div class="description-content">
          <div v-if="rfi.description" class="description-text">{{ rfi.description }}</div>
          <div v-else-if="rfi.question" class="description-text">{{ rfi.question }}</div>
        </div>
      </div>
    </el-card>

    <!-- RFI Questions and Suggested Answers -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-question />Questions & Responses</span>
        </div>
      </template>
      
      <div class="question-content">
        <div class="question-section">
          <h4>Question Content</h4>
          <div class="question-text">{{ rfi.question || 'No question content' }}</div>
        </div>
        
        <div class="answer-section" v-if="rfi.suggested_answer">
          <h4>Suggested Answer</h4>
          <div class="answer-text">{{ rfi.suggested_answer }}</div>
        </div>

        <div class="response-section" v-if="rfi.has_response || rfi.official_response">
          <h4>Official Response:</h4>
          <div class="response-text">{{ rfi.official_response || 'No response yet' }}</div>
          <div class="response-meta" v-if="rfi.responded_at">
            <span>Response Time: {{ formatDateTime(rfi.responded_at) }}</span>
            <span v-if="rfi.responded_by?.name">Responded By: {{ getUserDisplayName(rfi.responded_by) }}</span>
          </div>
        </div>

        <!-- Response List -->
        <div class="responses-section" v-if="rfi.raw_data?.responses && rfi.raw_data.responses.length > 0">
          <h4>All Responses ({{ rfi.raw_data.responses.length }}):</h4>
          <div class="responses-list">
            <div 
              v-for="response in rfi.raw_data.responses" 
              :key="response.id"
              class="response-item">
              <div class="response-header">
                <div class="response-meta">
                  <el-tag 
                    :type="response.status === 'answered' ? 'success' : 'info'" 
                    size="small">
                    {{ response.status }}
                  </el-tag>
                  <el-tag 
                    :type="response.state === 'submitted' ? 'success' : 'warning'" 
                    size="small">
                    {{ response.state }}
                  </el-tag>
                  <span class="response-time">{{ formatDateTime(response.createdAt) }}</span>
                </div>
              </div>
              <div class="response-content">
                <div v-if="response.text && response.text.trim()" class="response-text">
                  {{ response.text }}
                </div>
                <div v-else class="no-response-text">
                  <el-alert 
                    title="No Text Content" 
                    type="info" 
                    :closable="false"
                    size="small">
                    This reply may contain only attachments or be system generated
                  </el-alert>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Categories and Attributes -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-apps />
            Categories & Attributes
          </span>
        </div>
      </template>
      
      <div class="categories-grid">
        <!-- Disciplines -->
        <div class="category-section">
          <h4 class="section-title">Disciplines</h4>
          <div class="tags-wrapper">
            <template v-if="getDisciplineArray().length > 0">
              <el-tag 
                v-for="discipline in getDisciplineArray()" 
                :key="discipline"
                type="info" 
                size="default"
                class="discipline-tag">
                {{ discipline }}
              </el-tag>
            </template>
            <span v-else class="no-data-text">No disciplines specified</span>
          </div>
        </div>

        <!-- Categories -->
        <div class="category-section">
          <h4 class="section-title">Categories</h4>
          <div class="tags-wrapper">
            <template v-if="getCategoryArray().length > 0">
              <el-tag 
                v-for="category in getCategoryArray()" 
                :key="category"
                type="success" 
                size="default"
                class="category-tag">
                {{ category }}
              </el-tag>
            </template>
            <span v-else class="no-data-text">No categories specified</span>
          </div>
        </div>
      </div>

      <!-- Other Attributes -->
      <div class="attributes-summary">
        <div class="attribute-item">
          <span class="attr-label">Workflow Type</span>
          <span class="attr-value">{{ rfi.workflow_type || 'Not Specified' }}</span>
        </div>
        <div class="attribute-item" v-if="rfi.reference">
          <span class="attr-label">External ID</span>
          <span class="attr-value">{{ rfi.reference }}</span>
        </div>
        <div class="attribute-item">
          <span class="attr-label">Custom Attributes</span>
          <span class="attr-value">{{ rfi.custom_attributes_count || 0 }} items</span>
        </div>
      </div>

      <!-- Custom Attributes Details -->
      <div v-if="rfi.custom_attributes && rfi.custom_attributes.length > 0" class="custom-attributes">
        <h4>Custom Attributes Details:</h4>
        <div class="attributes-list">
          <div 
            v-for="(attr, index) in rfi.custom_attributes" 
            :key="index"
            class="custom-attribute-item">
            <div class="attr-header">
              <span class="attr-name">{{ attr.name || `Attribute ${index + 1}` }}</span>
              <el-tag 
                v-if="attr.type" 
                size="small" 
                type="info" 
                effect="plain"
                class="attr-type-tag">
                {{ attr.type }}
              </el-tag>
              <el-tag 
                v-if="attr.source" 
                size="small" 
                type="warning" 
                effect="plain"
                class="attr-source-tag">
                {{ getAttributeSourceDisplayName(attr.source) }}
              </el-tag>
            </div>
            <div class="attr-value">{{ attr.value || 'No Value' }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Impact Assessment -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-exclamation-circle />
            Impact Assessment
          </span>
        </div>
      </template>
      
      <div class="impact-assessment">
        <div class="impact-item">
          <label>Cost Impact:</label>
          <StatusTag 
            :status="rfi.impact_analysis?.has_cost_impact ? 'danger' : 'success'" 
            :text="rfi.cost_impact || 'Unknown'" 
            size="default" />
        </div>
        <div class="impact-item">
          <label>Schedule Impact:</label>
          <StatusTag 
            :status="rfi.impact_analysis?.has_schedule_impact ? 'danger' : 'success'" 
            :text="rfi.schedule_impact || 'Unknown'" 
            size="default" />
        </div>
        <div class="impact-item">
          <label>Overall Impact:</label>
          <StatusTag 
            :status="rfi.impact_analysis?.overall_impact === 'high' ? 'danger' : 'success'" 
            :text="rfi.impact_analysis?.overall_impact === 'high' ? 'High Impact' : 'Low Impact'" 
            size="default" />
        </div>
      </div>
    </el-card>

    <!-- People and Time Information -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-user />
            People & Time Information
          </span>
        </div>
      </template>
      
      <!-- People Information -->
      <div class="people-section">
        <h4 class="section-title">Related People</h4>
        <div class="people-grid">
          <!-- Key People -->
          <div class="people-group">
            <h5 class="group-title">Key People</h5>
            <div class="people-cards">
              <div class="person-card" v-if="rfi.created_by">
                <div class="person-role-badge creator">Creator</div>
                <div class="person-name">{{ getUserDisplayName(rfi.created_by) }}</div>
              </div>
              <div class="person-card" v-if="rfi.manager_id">
                <div class="person-role-badge manager">Manager</div>
                <div class="person-name">{{ getUserDisplayName(rfi.manager_id) }}</div>
              </div>
              <div class="person-card" v-if="rfi.raw_data?.constructionManagerId">
                <div class="person-role-badge construction">Construction Manager</div>
                <div class="person-name">{{ getUserDisplayName(rfi.raw_data.constructionManagerId) }}</div>
              </div>
            </div>
          </div>

          <!-- Assigned and Review Personnel -->
          <div class="people-group" v-if="(rfi.assigned_to && rfi.assigned_to.length > 0) || (rfi.reviewers && rfi.reviewers.length > 0)">
            <h5 class="group-title">Assignment & Review</h5>
            <div class="role-section" v-if="rfi.assigned_to && rfi.assigned_to.length > 0">
              <span class="role-label">Assigned To</span>
              <div class="person-tags-row">
                <el-tag 
                  v-for="person in rfi.assigned_to" 
                  :key="person.id"
                  :type="getEntityTagType(person.type)" 
                  size="default"
                  class="person-tag">
                  <span class="entity-type-icon">{{ getEntityTypeIcon(person.type) }}</span>
                  {{ getAssignedEntityDisplayName(person) }}
                </el-tag>
              </div>
            </div>
            <div class="role-section" v-if="rfi.reviewers && rfi.reviewers.length > 0">
              <span class="role-label">Reviewers</span>
              <div class="person-tags-row">
                <el-tag 
                  v-for="reviewer in rfi.reviewers" 
                  :key="reviewer.id"
                  :type="getEntityTagType(reviewer.type, 'success')" 
                  size="default"
                  class="person-tag">
                  <span class="entity-type-icon">{{ getEntityTypeIcon(reviewer.type) }}</span>
                  {{ getAssignedEntityDisplayName(reviewer) }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- Other Related People -->
          <div class="people-group" v-if="hasOtherPeople()">
            <h5 class="group-title">Other Related People</h5>
            <div class="role-section" v-if="rfi.raw_data?.architects && rfi.raw_data.architects.length > 0">
              <span class="role-label">Architects</span>
              <div class="person-tags-row">
                <el-tag 
                  v-for="architect in rfi.raw_data.architects" 
                  :key="architect.id"
                  :type="getEntityTagType(architect.type, 'warning')" 
                  size="default"
                  class="person-tag">
                  <span class="entity-type-icon">{{ getEntityTypeIcon(architect.type) }}</span>
                  {{ getAssignedEntityDisplayName(architect) }}
                </el-tag>
              </div>
            </div>
            <div class="role-section" v-if="rfi.raw_data?.coReviewers && rfi.raw_data.coReviewers.length > 0">
              <span class="role-label">Co-Reviewers</span>
              <div class="person-tags-row">
                <el-tag 
                  v-for="coReviewer in rfi.raw_data.coReviewers" 
                  :key="coReviewer.id"
                  :type="getEntityTagType(coReviewer.type, 'info')" 
                  size="default"
                  class="person-tag">
                  <span class="entity-type-icon">{{ getEntityTypeIcon(coReviewer.type) }}</span>
                  {{ getAssignedEntityDisplayName(coReviewer) }}
                </el-tag>
              </div>
            </div>
            <div class="role-section" v-if="rfi.raw_data?.watchers && rfi.raw_data.watchers.length > 0">
              <span class="role-label">Watchers</span>
              <div class="person-tags-row">
                <el-tag 
                  v-for="watcher in rfi.raw_data.watchers" 
                  :key="watcher.id"
                  :type="getEntityTagType(watcher.type, 'info')" 
                  size="default"
                  effect="plain"
                  class="person-tag">
                  <span class="entity-type-icon">{{ getEntityTypeIcon(watcher.type) }}</span>
                  {{ getAssignedEntityDisplayName(watcher) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Time Information -->
      <div class="time-section">
        <h4 class="section-title">Timeline</h4>
        <div class="timeline-container">
          <div class="timeline-item" v-if="rfi.created_at">
            <div class="timeline-dot created"></div>
            <div class="timeline-content">
              <div class="timeline-title">Created Time</div>
              <div class="timeline-time">{{ formatDateTime(rfi.created_at) }}</div>
              <div class="timeline-relative">{{ getRelativeTime(rfi.created_at) }}</div>
            </div>
          </div>
          
          <div class="timeline-item" v-if="rfi.start_date">
            <div class="timeline-dot started"></div>
            <div class="timeline-content">
              <div class="timeline-title">Start Date</div>
              <div class="timeline-time">{{ formatDateTime(rfi.start_date) }}</div>
              <div class="timeline-relative">{{ getRelativeTime(rfi.start_date) }}</div>
            </div>
          </div>
          
          <div class="timeline-item" v-if="rfi.due_date">
            <div class="timeline-dot" :class="{ 'due': true, 'overdue': rfi.is_overdue }"></div>
            <div class="timeline-content">
              <div class="timeline-title">
                Due Date
                <el-tag v-if="rfi.is_overdue" type="danger" size="small" class="overdue-tag">Overdue</el-tag>
              </div>
              <div class="timeline-time" :class="{ 'overdue-text': rfi.is_overdue }">
                {{ formatDateTime(rfi.due_date) }}
              </div>
              <div class="timeline-relative">{{ getRelativeTime(rfi.due_date) }}</div>
            </div>
          </div>
          
          <div class="timeline-item" v-if="rfi.updated_at">
            <div class="timeline-dot updated"></div>
            <div class="timeline-content">
              <div class="timeline-title">Updated Time</div>
              <div class="timeline-time">{{ formatDateTime(rfi.updated_at) }}</div>
              <div class="timeline-relative">{{ getRelativeTime(rfi.updated_at) }}</div>
            </div>
          </div>
          
          <div class="timeline-item" v-if="rfi.responded_at">
            <div class="timeline-dot responded"></div>
            <div class="timeline-content">
              <div class="timeline-title">Response Time</div>
              <div class="timeline-time">{{ formatDateTime(rfi.responded_at) }}</div>
              <div class="timeline-relative">{{ getRelativeTime(rfi.responded_at) }}</div>
            </div>
          </div>
          
          <div class="timeline-item" v-if="rfi.closed_at">
            <div class="timeline-dot closed"></div>
            <div class="timeline-content">
              <div class="timeline-title">Closed Time</div>
              <div class="timeline-time">{{ formatDateTime(rfi.closed_at) }}</div>
              <div class="timeline-relative">{{ getRelativeTime(rfi.closed_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Location and Related Information -->
    <el-card class="info-card" shadow="never" v-if="rfi.location_description || rfi.linked_document || rfi.locations?.length > 0">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-location />
            Location & Related Information
          </span>
        </div>
      </template>
      
      <div class="location-info">
        <div class="location-item" v-if="rfi.location_description">
          <label>Location Description:</label>
          <span>{{ rfi.location_description }}</span>
        </div>
        <div class="location-item" v-if="rfi.linked_document">
          <label>Linked Document:</label>
          <span class="document-link">{{ rfi.linked_document }}</span>
        </div>
        <div class="location-item" v-if="rfi.locations && rfi.locations.length > 0">
          <label>Structured Locations:</label>
          <div class="locations-list">
            <el-tag 
              v-for="(location, index) in rfi.locations" 
              :key="index"
              type="info" 
              size="small"
              style="margin: 2px;">
              {{ location.name || `Location ${index + 1}` }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- RFI Status and Progress -->
    <el-card class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-branch />
            Status & Progress
          </span>
        </div>
      </template>
      
      <!-- Main Status Display -->
      <div class="main-status-section">
        <div class="status-card primary-status">
          <div class="status-icon">
            <i class="el-icon-info"></i>
          </div>
          <div class="status-content">
            <div class="status-label">Current Status</div>
            <div class="status-value">
              <StatusTag 
                :status="rfi.status_type" 
                :text="rfi.status" 
                size="large" />
            </div>
            <div class="status-description" v-if="rfi.previous_status">
              Previous Status: {{ rfi.previous_status }}
            </div>
          </div>
        </div>
      </div>

      <!-- Status Details Grid -->
      <div class="status-details-grid">
        <div class="status-detail-card">
          <div class="detail-icon answered" :class="{ active: rfi.is_answered }">
            <i class="el-icon-check"></i>
          </div>
          <div class="detail-content">
            <div class="detail-label">Answer Status</div>
            <StatusTag 
              :status="rfi.is_answered ? 'success' : 'warning'" 
              :text="rfi.is_answered ? 'Answered' : 'Not Answered'" 
              size="default" />
          </div>
        </div>

        <div class="status-detail-card">
          <div class="detail-icon closed" :class="{ active: rfi.is_closed }">
            <i class="el-icon-lock"></i>
          </div>
          <div class="detail-content">
            <div class="detail-label">Closure Status</div>
            <StatusTag 
              :status="rfi.is_closed ? 'info' : 'success'" 
              :text="rfi.is_closed ? 'Closed' : 'In Progress'" 
              size="default" />
          </div>
        </div>

        <div class="status-detail-card">
          <div class="detail-icon overdue" :class="{ active: rfi.is_overdue }">
            <i class="el-icon-warning"></i>
          </div>
          <div class="detail-content">
            <div class="detail-label">Time Status</div>
            <StatusTag 
              :status="rfi.is_overdue ? 'danger' : 'success'" 
              :text="rfi.is_overdue ? 'Overdue' : 'On Time'" 
              size="default" />
          </div>
        </div>

        <div class="status-detail-card">
          <div class="detail-icon draft" :class="{ active: rfi.is_draft }">
            <i class="el-icon-edit"></i>
          </div>
          <div class="detail-content">
            <div class="detail-label">Document Status</div>
            <StatusTag 
              :status="rfi.is_draft ? 'warning' : 'success'" 
              :text="rfi.is_draft ? 'Draft' : 'Official'" 
              size="default" />
          </div>
        </div>
      </div>

      <!-- Available Actions -->
      <div class="actions-section" v-if="rfi.raw_data?.permittedActions">
        <h4 class="section-title">Available Actions</h4>
        <div class="actions-grid">
          <div 
            v-for="(allowed, action) in rfi.raw_data.permittedActions" 
            :key="action"
            class="action-card"
            :class="{ 'action-allowed': allowed, 'action-disabled': !allowed }">
            <div class="action-icon">
              <i :class="getActionIcon(action)"></i>
            </div>
            <div class="action-content">
              <div class="action-name">{{ getActionDisplayName(action) }}</div>
              <div class="action-status">{{ allowed ? 'Allowed' : 'Not Allowed' }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <RfiWorkflowProgress :rfi="rfi" :project="project" />
    </el-card>


    <!-- Raw Data -->
    <el-card class="info-card" shadow="never" v-if="showRawData">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-code />
            Raw Data
          </span>
          <el-button 
            type="text" 
            size="small"
            @click="showRawData = false">
            Hide
          </el-button>
        </div>
      </template>
      
      <div class="raw-data">
        <pre>{{ JSON.stringify(rfi.raw_data, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- RFI Configuration Information -->
    <el-card class="info-card" shadow="never" v-if="showConfigPanel">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-settings />
            RFI Configuration Information
          </span>
          <el-button 
            type="text" 
            size="small"
            @click="showConfigPanel = false">
            Hide Configuration
          </el-button>
        </div>
      </template>
      
      <RfiConfigPanel :project="project" />
    </el-card>

    <!-- RFI Details JSON Viewer -->
    <JsonViewer
      :data="rfi"
      title="🔍 RFI Details JSON"
      description="Complete JSON data structure of current RFI, including all fields and raw data"
      :show-copy="true"
      :show-download="true"
      :collapsible="true"
      :collapsed="true"
      style="margin-top: 24px;" />

        </div>
      </el-tab-pane>
      
      <!-- Attachments Tab -->
      <el-tab-pane name="attachments">
        <template #label>
          <span class="tab-label">
            <icon-folder />
            <span>Attachments</span>
            <el-badge 
              v-if="rfi.attachments_count && rfi.attachments_count > 0" 
              :value="rfi.attachments_count" 
              class="tab-badge"
              :max="99" />
          </span>
        </template>
        <div class="tab-content">
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <icon-folder />Attachments List
                </span>
                <div class="header-actions">
                  <el-button 
                    v-if="rfi.has_attachments && !attachments"
                    type="primary" 
                    size="small"
                    :loading="loadingAttachments"
                    @click="loadAttachments">
                    Load Attachments ({{ rfi.attachments_count }})
                  </el-button>
                  <el-tag v-else-if="attachments" type="success" size="small">
                    Loaded {{ attachments.length }} Attachments
                  </el-tag>
                </div>
              </div>
            </template>
            
            <!-- Attachments Statistics and Filtering -->
            <div v-if="attachments && attachments.length > 0" class="attachments-overview">
              <div class="attachments-stats">
                <div class="stat-item">
                  <span class="stat-number">{{ attachments.length }}</span>
                  <span class="stat-label">Total Attachments</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ getAttachmentsByType('rfiResponse').length }}</span>
                  <span class="stat-label">RFI Responses</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ getAttachmentsByType('rfiOfficialResponse').length }}</span>
                  <span class="stat-label">Official Responses</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ getOtherAttachments().length }}</span>
                  <span class="stat-label">Other Files</span>
                </div>
              </div>
              
              <!-- Attachments Filter -->
              <div class="attachments-filter">
                <el-radio-group v-model="attachmentFilter" size="small" @change="onAttachmentFilterChange">
                  <el-radio-button label="all">All ({{ attachments.length }})</el-radio-button>
                  <el-radio-button label="rfiResponse">RFI Responses ({{ getAttachmentsByType('rfiResponse').length }})</el-radio-button>
                  <el-radio-button label="rfiOfficialResponse">Official Responses ({{ getAttachmentsByType('rfiOfficialResponse').length }})</el-radio-button>
                  <el-radio-button label="other">Other ({{ getOtherAttachments().length }})</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <!-- 附件網格列表 -->
            <div v-if="filteredAttachments && filteredAttachments.length > 0" class="attachments-grid-section">
              <div class="attachments-grid">
                <div 
                  v-for="attachment in filteredAttachments" 
                  :key="attachment.id"
                  class="attachment-card">
                  <div class="attachment-icon">
                    <i :class="getFileIcon(attachment.file_type)"></i>
                  </div>
                  <div class="attachment-details">
                    <div class="attachment-name">{{ attachment.name }}</div>
                    <div class="attachment-meta">
                      <span class="attachment-type">{{ attachment.file_type }}</span>
                      <span class="attachment-size">{{ formatFileSize(attachment.file_size) }}</span>
                      <span class="attachment-category">
                        {{ getAttachmentTypeDisplayName(attachment.attachment_type) }}
                      </span>
                    </div>
                    <div class="attachment-time" v-if="attachment.created_time">
                      {{ formatDateTime(attachment.created_time) }}
                    </div>
                    <div class="attachment-creator" v-if="attachment.created_by_name">
                      Creator: {{ attachment.created_by_name }}
                    </div>
                  </div>
                  <div class="attachment-actions">
                    <el-button 
                      type="primary" 
                      size="mini" 
                      icon="el-icon-download"
                      @click="downloadAttachment(attachment)"
                      :loading="downloadingAttachments[attachment.id]">
                      Download
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Attachments or Empty Filter Results -->
            <div v-else-if="attachments && attachments.length > 0 && filteredAttachments.length === 0" class="no-filtered-attachments">
              <el-empty description="No attachments match the filter criteria">
                <el-button type="primary" @click="attachmentFilter = 'all'">Show All Attachments</el-button>
              </el-empty>
            </div>
            
            <div v-else class="no-attachments">
              <el-empty description="No attachments available" />
            </div>

            <!-- Attachments Data JSON Viewer -->
            <JsonViewer
              v-if="attachments"
              :data="attachments"
              title="📎 Attachments Data JSON"
              description="JSON data of current RFI's attachments list, including file information and metadata"
              :show-copy="true"
              :show-download="true"
              :collapsible="true"
              :collapsed="true"
              style="margin-top: 24px;" />
          </el-card>
        </div>
      </el-tab-pane>
      
      <!-- References Tab -->
      <el-tab-pane name="references">
        <template #label>
          <span class="tab-label">
            <icon-link />
            <span>References</span>
            <el-badge 
              v-if="rfi.references_count && rfi.references_count > 0" 
              :value="rfi.references_count" 
              class="tab-badge"
              :max="99" />
          </span>
        </template>
        <div class="tab-content">
          <EntityReferences 
            v-if="rfi && project"
            :entity="rfi" 
            :project="project"
            entity-type="rfi"
            :auto-load="true"
            :show-debug-info="false"
            :show-json-viewer="false"
            :supported-reference-types="['document', 'file', 'drawing', 'photo', 'issue', 'specification']"
            @references-loaded="onReferencesLoaded"
            @references-error="onReferencesError"
            @download-success="onDownloadSuccess"
            @download-error="onDownloadError" />
        </div>
      </el-tab-pane>
      
      <!-- Comments Tab -->
      <el-tab-pane name="comments">
        <template #label>
          <span class="tab-label">
            <icon-message />
            <span>Comments</span>
            <el-badge 
              v-if="rfi.comments_count && rfi.comments_count > 0" 
              :value="rfi.comments_count" 
              class="tab-badge"
              :max="99" />
          </span>
        </template>
        <div class="tab-content">
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <icon-message />Comments List
                </span>
                <div class="header-actions">
                  <el-button 
                    v-if="rfi.has_comments && !comments"
                    type="info" 
                    size="small"
                    :loading="loadingComments"
                    @click="loadComments">
                    Load Comments ({{ rfi.comments_count }})
                  </el-button>
                  <el-tag v-else-if="comments" type="success" size="small">
                    Loaded {{ comments.length }} Comments
                  </el-tag>
                </div>
              </div>
            </template>
            
            <!-- Debug Information -->
            <div v-if="loadingComments" class="loading-comments">
              <el-skeleton :rows="3" animated />
              <div style="text-align: center; margin-top: 16px; color: #666;">
                Loading comments data...
              </div>
            </div>

            <!-- Comments Statistics -->
            <div v-if="comments !== null" class="comments-stats" style="margin-bottom: 16px;">
              <el-alert 
                :title="`Comments Statistics: Total ${comments?.length || 0} Comments`" 
                type="info" 
                :closable="false"
                style="margin-bottom: 16px;">
                <template #default>
                  <div>API Response Data: {{ comments ? 'Success' : 'No Data' }}</div>
                  <div v-if="commentsRawData">
                    Official Responses: {{ commentsRawData.stats?.response_count || 0 }}, 
                    Draft Responses: {{ commentsRawData.stats?.draft_count || 0 }}
                  </div>
                </template>
              </el-alert>
            </div>

            <!-- Comments List -->
            <div v-if="comments && comments.length > 0" class="comments-section">
              <div class="comments-list">
                <div 
                  v-for="comment in comments" 
                  :key="comment.id"
                  class="comment-item">
                  <div class="comment-header">
                    <div class="comment-author-info">
                      <span class="comment-author">{{ getUserDisplayName(comment.author) }}</span>
                      <span v-if="comment.author?.id && getUserDisplayName(comment.author) === comment.author?.id" class="comment-author-id">
                        (User ID)
                      </span>
                    </div>
                    <div class="comment-meta">
                      <span class="comment-time">{{ comment.created_at }}</span>
                      <el-tag v-if="comment.is_draft" type="warning" size="small">Draft</el-tag>
                      <el-tag :type="comment.type === 'response' ? 'success' : 'info'" size="small">
                        {{ comment.type === 'response' ? 'Official Response' : 'Draft Response' }}
                      </el-tag>
                      <el-tag v-if="comment.status" :type="getCommentStatusType(comment.status)" size="small">
                        {{ comment.status }}
                      </el-tag>
                      <el-tag v-if="comment.state" type="info" size="small">
                        {{ comment.state }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="comment-content">
                    <div v-if="comment.content && comment.content.trim()" class="comment-text">
                      {{ comment.content }}
                    </div>
                    <div v-else class="comment-empty">
                      <el-alert 
                        title="Empty Content" 
                        type="warning" 
                        :closable="false"
                        size="small">
                        <template #default>
                          This comment has no text content, it may only contain attachments or be system generated.
                        </template>
                      </el-alert>
                    </div>
                  </div>
                  <div v-if="comment.attachments && comment.attachments.length > 0" class="comment-attachments">
                    <el-tag type="info" size="small">
                      {{ comment.attachments.length }} Attachments
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- No Comments State -->
            <div v-else-if="comments !== null" class="no-comments">
              <el-empty description="No Comments">
                <template #description>
                  <div>This RFI currently has no comments or responses</div>
                  <div style="font-size: 12px; color: #999; margin-top: 8px;">
                    Comment data has been loaded, but the list is empty
                  </div>
                </template>
              </el-empty>
            </div>

            <!-- Debug Area - Raw Comments Data -->
            <div v-if="commentsRawData" class="debug-section" style="margin-top: 24px;">
              <el-collapse>
                <el-collapse-item title="🔍 Debug Info - Raw Comments Data" name="debug">
                  <JsonViewer
                    :data="commentsRawData"
                    title="Comments API Raw Response"
                    description="For debugging comment data structure and content"
                    :show-copy="true"
                    :collapsible="true"
                    :collapsed="false" />
                </el-collapse-item>
              </el-collapse>
            </div>

            <!-- Comment-related Fields in RFI Raw Data -->
            <div v-if="rfi.raw_data" class="debug-section" style="margin-top: 16px;">
              <el-collapse>
                <el-collapse-item title="🔍 Comment Fields in RFI Raw Data" name="rfi-debug">
                  <JsonViewer
                    :data="{
                      responses: rfi.raw_data.responses || [],
                      draftResponses: rfi.raw_data.draftResponses || [],
                      commentsCount: rfi.raw_data.commentsCount || 0,
                      hasComments: rfi.has_comments,
                      officialResponse: rfi.raw_data.officialResponse || '',
                      officialResponseStatus: rfi.raw_data.officialResponseStatus || ''
                    }"
                    title="Comment-related Fields in RFI"
                    description="Comment-related data extracted from RFI details"
                    :show-copy="true"
                    :collapsible="true"
                    :collapsed="true" />
                </el-collapse-item>
              </el-collapse>
            </div>

            <!-- Comments Data JSON Viewer -->
            <JsonViewer
              v-if="comments"
              :data="comments"
              title="💬 Comments Data JSON"
              description="JSON data of current RFI's comments list, including all comment content and metadata"
              :show-copy="true"
              :show-download="true"
              :collapsible="true"
              :collapsed="true"
              style="margin-top: 24px;" />
          </el-card>
        </div>
      </el-tab-pane>
      
      <!-- Raw Data Tab -->
      <el-tab-pane label="Raw Data" name="raw" v-if="showRawData">
        <div class="tab-content">
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <icon-code />Raw Data
                </span>
                <el-button 
                  type="text" 
                  size="small"
                  @click="showRawData = false">
                  Hide
                </el-button>
              </div>
            </template>
            
            <div class="raw-data">
              <pre>{{ JSON.stringify(rfi.raw_data, null, 2) }}</pre>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
      
    </el-tabs>

    <!-- Action Buttons -->
    <div class="actions">
      <el-button type="primary" @click="showRawData = !showRawData">
        {{ showRawData ? 'Hide' : 'Show' }} Raw Data
      </el-button>
      <el-button type="info" @click="showConfigPanel = !showConfigPanel">
        {{ showConfigPanel ? 'Hide' : 'Show' }} Configuration Info
      </el-button>
      <el-button type="success" @click="exportRfiData">
        Export RFI Data
      </el-button>
      <el-button type="warning" @click="exportFullRfiData">
        Export Full Data (with Config)
      </el-button>
    </div>

  </div>
</template>

<script>
import axios from 'axios'
import { ElMessage } from 'element-plus'
import StatusTag from './StatusTag.vue'
import RfiConfigPanel from './RfiConfigPanel.vue'
import RfiWorkflowProgress from './RfiWorkflowProgress.vue'
import EntityReferences from './EntityReferences.vue'
import JsonViewer from './JsonViewer.vue'
import entityCache from '../utils/entityCache.js'
import { formatDateTime, getRelativeTime } from '../utils/dateUtils.js'
import { 
  IconFile, 
  IconQuestion, 
  IconApps, 
  IconExclamationCircle, 
  IconUser, 
  IconLocation, 
  IconFolder, 
  IconCode,
  IconSettings,
  IconBranch,
  IconMessage,
  IconLink
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'RfiDetail',
  components: {
    StatusTag,
    RfiConfigPanel,
    RfiWorkflowProgress,
    EntityReferences,
    JsonViewer,
    IconFile,
    IconQuestion,
    IconApps,
    IconExclamationCircle,
    IconUser,
    IconLocation,
    IconFolder,
    IconCode,
    IconSettings,
    IconBranch,
    IconMessage,
    IconLink
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
      activeTab: 'basic', // Default to show basic information tab
      showRawData: false,
      showConfigPanel: false,
      attachments: null,
      comments: null,
      commentsRawData: null, // Save raw response data from comments API
      loadingAttachments: false,
      loadingComments: false,
      downloadingAttachments: {}, // Track downloading attachments
      attachmentFilter: 'all' // Attachment filter
    }
  },
  computed: {
    // Filter attachments based on filter criteria
    filteredAttachments() {
      if (!this.attachments) return []
      
      switch (this.attachmentFilter) {
        case 'rfiResponse':
          return this.getAttachmentsByType('rfiResponse')
        case 'rfiOfficialResponse':
          return this.getAttachmentsByType('rfiOfficialResponse')
        case 'other':
          return this.getOtherAttachments()
        default:
          return this.attachments
      }
    }
  },
  async mounted() {
    // 确保实体缓存已加载
    if (this.project?.id) {
      console.log('🏢 RFI Detail组件加载，初始化实体缓存:', this.project.id)
      try {
        await entityCache.getProjectEntities(this.project.id)
        console.log('✅ RFI Detail实体缓存初始化完成')
      } catch (error) {
        console.warn('⚠️ RFI Detail实体缓存初始化失败:', error)
      }
    }
  },
  watch: {
    // Listen for tab switching, automatically load corresponding data
    activeTab(newTab) {
      if (newTab === 'attachments' && !this.attachments && this.rfi.has_attachments) {
        this.loadAttachments()
      } else if (newTab === 'comments' && !this.comments && this.rfi.has_comments) {
        this.loadComments()
      }
    }
  },
  methods: {
    async loadAttachments() {
      if (this.loadingAttachments) return
      
      this.loadingAttachments = true
      
      try {
        ElMessage.info('Loading attachments...')
        
        const response = await axios.get(`/api/rfis/jarvis/${this.rfi.id}/attachments`, {
          params: {
            projectId: this.project.id
          }
        })

        if (response.data.success) {
          this.attachments = response.data.attachments || []
          ElMessage.success(`Successfully loaded ${this.attachments.length} attachments`)
        } else {
          throw new Error(response.data.error || 'Failed to load attachments')
        }
      } catch (error) {
        console.error('Failed to load attachments:', error)
        ElMessage.error(error.response?.data?.error || error.message || 'Failed to load attachments')
      } finally {
        this.loadingAttachments = false
      }
    },

    async loadComments() {
      if (this.loadingComments) return
      
      this.loadingComments = true
      
      try {
        ElMessage.info('Loading comments...')
        
        const response = await axios.get(`/api/rfis/jarvis/${this.rfi.id}/comments`, {
          params: {
            projectId: this.project.id
          }
        })

        console.log('Comments API response:', response.data) // Debug log
        console.log('Comments list:', response.data.comments) // Debug comments list
        
        // Temporary fix: If backend hasn't been fixed yet, we handle it on frontend
        if (response.data.success && response.data.comments) {
          this.comments = response.data.comments.map(comment => {
            // If content is empty but raw data has text, use text
            if (!comment.content || comment.content.trim() === '') {
              // Try to find corresponding response from raw RFI data
              const rawResponses = this.rfi.raw_data?.responses || []
              const matchingResponse = rawResponses.find(r => r.id === comment.id)
              if (matchingResponse && matchingResponse.text) {
                comment.content = matchingResponse.text
                console.log('Frontend fixed comment content:', comment.id, matchingResponse.text)
              }
            }
            return comment
          })
          this.commentsRawData = response.data // Save complete API response data
          
          
          const commentCount = this.comments.length
          if (commentCount > 0) {
            ElMessage.success(`Successfully loaded ${commentCount} comments`)
          } else {
            ElMessage.info('This RFI has no comments')
          }
        } else {
          throw new Error(response.data.error || 'Failed to load comments')
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
        this.commentsRawData = {
          error: error.message,
          response: error.response?.data || null,
          timestamp: new Date().toISOString()
        }
        ElMessage.error(error.response?.data?.error || error.message || 'Failed to load comments')
      } finally {
        this.loadingComments = false
      }
    },

    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    },

    getCommentStatusType(status) {
      const statusMap = {
        'answered': 'success',
        'submitted': 'info',
        'draft': 'warning',
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger'
      }
      return statusMap[status?.toLowerCase()] || 'info'
    },

    exportRfiData() {
      try {
        const exportData = {
          rfi: this.rfi,
          project: this.project,
          attachments: this.attachments,
          comments: this.comments,
          export_time: new Date().toISOString()
        }

        const dataStr = JSON.stringify(exportData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const fileName = `rfi_${this.rfi.id}_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success(`RFI data export successful: ${fileName}`)
      } catch (error) {
        console.error('Failed to export RFI data:', error)
        ElMessage.error('Export failed: ' + error.message)
      }
    },

    async exportFullRfiData() {
      try {
        ElMessage.info('Collecting complete RFI data...')
        
        // Collect all configuration data
        const configData = {}
        
        // Get user permissions
        try {
          const userPermissionsResp = await axios.get('/api/rfis/jarvis/users/me', {
            params: { projectId: this.project.id }
          })
          if (userPermissionsResp.data.success) {
            configData.userPermissions = userPermissionsResp.data.user_permissions
          }
        } catch (e) {
          console.warn('Unable to get user permissions:', e.message)
        }

        // Get RFI types
        try {
          const rfiTypesResp = await axios.get('/api/rfis/jarvis/rfi-types', {
            params: { projectId: this.project.id, limit: 50 }
          })
          if (rfiTypesResp.data.success) {
            configData.rfiTypes = rfiTypesResp.data.rfi_types
          }
        } catch (e) {
          console.warn('Unable to get RFI types:', e.message)
        }

        // Get custom attributes
        try {
          const customAttributesResp = await axios.get('/api/rfis/jarvis/attributes', {
            params: { projectId: this.project.id, limit: 50 }
          })
          if (customAttributesResp.data.success) {
            configData.customAttributes = customAttributesResp.data.custom_attributes
          }
        } catch (e) {
          console.warn('Unable to get custom attributes:', e.message)
        }

        // Get workflow configuration
        try {
          const workflowResp = await axios.get('/api/rfis/jarvis/workflow', {
            params: { projectId: this.project.id }
          })
          if (workflowResp.data.success) {
            configData.workflow = workflowResp.data.workflow
          }
        } catch (e) {
          console.warn('Unable to get workflow configuration:', e.message)
        }

        // Get custom identifier
        try {
          const customIdentifierResp = await axios.get('/api/rfis/jarvis/custom-identifier', {
            params: { projectId: this.project.id }
          })
          if (customIdentifierResp.data.success) {
            configData.customIdentifier = customIdentifierResp.data.custom_identifier
          }
        } catch (e) {
          console.warn('Unable to get custom identifier:', e.message)
        }

        const fullExportData = {
          rfi: this.rfi,
          project: this.project,
          attachments: this.attachments,
          comments: this.comments,
          configuration: configData,
          export_time: new Date().toISOString(),
          export_type: 'full_rfi_data_with_config'
        }

        const dataStr = JSON.stringify(fullExportData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const fileName = `rfi_full_${this.rfi.id}_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success(`Complete RFI data export successful: ${fileName}`)
      } catch (error) {
        console.error('Failed to export complete RFI data:', error)
        ElMessage.error('Export failed: ' + error.message)
      }
    },

    // 新增的輔助方法
    getDisciplineArray() {
      if (this.rfi.raw_data?.discipline && Array.isArray(this.rfi.raw_data.discipline)) {
        return this.rfi.raw_data.discipline
      }
      if (this.rfi.discipline) {
        return this.rfi.discipline.split(',').map(d => d.trim()).filter(d => d)
      }
      return []
    },

    getCategoryArray() {
      if (this.rfi.raw_data?.category && Array.isArray(this.rfi.raw_data.category)) {
        return this.rfi.raw_data.category
      }
      if (this.rfi.category) {
        return this.rfi.category.split(',').map(c => c.trim()).filter(c => c)
      }
      return []
    },

    // 参照加载成功处理
    onReferencesLoaded(data) {
      console.log('参照加载成功:', data)
      // 可以更新RFI的参照计数
      if (data.stats && data.stats.total_references !== undefined) {
        // Vue 3中直接赋值即可
        this.rfi.references_count = data.stats.total_references
      }
    },

    // 参照加载错误处理
    onReferencesError(error) {
      console.error('参照加载失败:', error)
      ElMessage.error('加载参照数据失败')
    },

    // 参照下载成功处理
    onDownloadSuccess(data) {
      console.log('参照下载成功:', data)
      ElMessage.success(`成功下载: ${data.documentName}`)
    },

    // 参照下载错误处理
    onDownloadError(data) {
      console.error('参照下载失败:', data)
      ElMessage.error(`下载失败: ${data.error}`)
    },

    getUserDisplayName(user) {
      if (!user) return '未知用戶'
      
      // 如果是字符串，可能是用户ID
      if (typeof user === 'string') {
        const displayName = entityCache.getUserDisplayName(user, this.project?.id)
        return displayName || user
      }
      
      // 如果是对象，优先使用缓存中的名称
      if (user.id) {
        const cachedName = entityCache.getUserDisplayName(user.id, this.project?.id)
        if (cachedName && cachedName !== user.id) {
          return cachedName
        }
      }
      
      // 回退到对象中的名称字段
      return user.name || user.email || user.id || 'Unknown User'
    },

    /**
     * 根据实体类型获取显示名称
     * @param {Object|string} entity - 实体对象或ID
     * @param {string} entityType - 实体类型 ('user', 'role', 'company')
     * @returns {string} 显示名称
     */
    getEntityDisplayName(entity, entityType = 'user') {
      if (!entity) return 'Unknown Entity'
      
      console.log('🔍 RFI获取实体显示名称:', { entity, entityType, projectId: this.project?.id })
      
      // 如果是字符串，直接作为ID查找
      if (typeof entity === 'string') {
        const displayName = entityCache.getEntityDisplayName(entity, entityType, this.project?.id)
        console.log('📝 字符串ID查找结果:', { entityId: entity, entityType, displayName })
        return displayName || entity
      }
      
      // 如果是对象，先尝试用ID查找缓存
      if (entity.id) {
        const cachedName = entityCache.getEntityDisplayName(entity.id, entityType, this.project?.id)
        if (cachedName && cachedName !== entity.id) {
          console.log('✅ 对象ID缓存查找成功:', { entityId: entity.id, entityType, cachedName })
          return cachedName
        }
      }
      
      // 回退到对象中的名称字段
      const fallbackName = entity.name || entity.email || entity.id || 'Unknown Entity'
      console.log('🔄 使用回退名称:', { entity, entityType, fallbackName })
      return fallbackName
    },

    /**
     * 获取分配对象的显示名称（支持用户、角色、公司）
     * @param {Object} assignedEntity - 分配的实体对象 {id, type}
     * @returns {string} 显示名称
     */
    getAssignedEntityDisplayName(assignedEntity) {
      if (!assignedEntity || !assignedEntity.id) return 'Unassigned'
      
      const { id, type } = assignedEntity
      console.log('🎯 RFI获取分配实体显示名称:', { id, type, projectId: this.project?.id })
      
      // 根据类型调用对应的方法
      switch (type) {
        case 'user':
          return this.getEntityDisplayName(id, 'user')
        case 'role':
          return this.getEntityDisplayName(id, 'role')
        case 'company':
          return this.getEntityDisplayName(id, 'company')
        default:
          // 如果类型未知，尝试自动检测
          console.log('❓ 未知实体类型，尝试自动检测:', { id, type })
          return entityCache.getEntityDisplayName(id, 'auto', this.project?.id) || id
      }
    },

    /**
     * 获取实体类型对应的标签类型
     * @param {string} entityType - 实体类型 ('user', 'role', 'company')
     * @param {string} defaultType - 默认标签类型
     * @returns {string} Element Plus 标签类型
     */
    getEntityTagType(entityType, defaultType = 'primary') {
      const typeMap = {
        'user': 'primary',
        'role': 'warning', 
        'company': 'info'
      }
      return typeMap[entityType] || defaultType
    },

    /**
     * 获取实体类型对应的图标
     * @param {string} entityType - 实体类型 ('user', 'role', 'company')
     * @returns {string} 图标字符
     */
    getEntityTypeIcon(entityType) {
      const iconMap = {
        'user': '👤',
        'role': '👔',
        'company': '🏢'
      }
      return iconMap[entityType] || '❓'
    },

    /**
     * 获取属性源的显示名称
     * @param {string} source - 属性源标识
     * @returns {string} 显示名称
     */
    getAttributeSourceDisplayName(source) {
      const sourceMap = {
        'reference_field': 'Reference Field',
        'potential_custom_field': 'Detected Field',
        'api_custom_attributes': 'Custom Attributes API',
        'default': 'Standard'
      }
      return sourceMap[source] || source || 'Unknown'
    },

    // 使用导入的时间格式化函数
    formatDateTime,
    getRelativeTime,

    getActionDisplayName(action) {
      const actionMap = {
        'nudge': 'Nudge',
        'share': 'Share',
        'edit': 'Edit',
        'delete': 'Delete',
        'close': 'Close',
        'reopen': 'Reopen',
        'respond': 'Respond',
        'approve': 'Approve',
        'reject': 'Reject'
      }
      return actionMap[action] || action
    },

    hasOtherPeople() {
      return (this.rfi.raw_data?.architects && this.rfi.raw_data.architects.length > 0) ||
             (this.rfi.raw_data?.coReviewers && this.rfi.raw_data.coReviewers.length > 0) ||
             (this.rfi.raw_data?.watchers && this.rfi.raw_data.watchers.length > 0)
    },

    getActionIcon(action) {
      const iconMap = {
        'nudge': 'el-icon-bell',
        'share': 'el-icon-share',
        'edit': 'el-icon-edit',
        'delete': 'el-icon-delete',
        'close': 'el-icon-lock',
        'reopen': 'el-icon-unlock',
        'respond': 'el-icon-chat-dot-round',
        'approve': 'el-icon-check',
        'reject': 'el-icon-close'
      }
      return iconMap[action] || 'el-icon-setting'
    },

    getFileIcon(fileType) {
      if (!fileType) return 'el-icon-document'
      
      const type = fileType.toLowerCase()
      const iconMap = {
        'pdf': 'el-icon-document',
        'doc': 'el-icon-document',
        'docx': 'el-icon-document',
        'xls': 'el-icon-s-grid',
        'xlsx': 'el-icon-s-grid',
        'ppt': 'el-icon-present',
        'pptx': 'el-icon-present',
        'jpg': 'el-icon-picture',
        'jpeg': 'el-icon-picture',
        'png': 'el-icon-picture',
        'gif': 'el-icon-picture',
        'zip': 'el-icon-folder-add',
        'rar': 'el-icon-folder-add',
        'txt': 'el-icon-document-copy',
        'dwg': 'el-icon-s-grid',
        'cad': 'el-icon-s-grid'
      }
      return iconMap[type] || 'el-icon-document'
    },

    getAttachmentTypeDisplayName(attachmentType) {
      const typeMap = {
        'rfiResponse': 'RFI Response',
        'rfiOfficialResponse': 'Official Response',
        'rfiWebHiddenFiles': 'Hidden Files',
        'bridgeFiles': 'Bridge Files'
      }
      return typeMap[attachmentType] || attachmentType
    },

    // 去重附件，合併相同文件的不同類型
    getUniqueAttachments(attachments) {
      if (!attachments || !Array.isArray(attachments)) return []
      
      const uniqueMap = new Map()
      
      attachments.forEach(attachment => {
        const key = `${attachment.name}_${attachment.file_size}_${attachment.created_time}`
        
        if (uniqueMap.has(key)) {
          // 如果已存在，合併附件類型
          const existing = uniqueMap.get(key)
          if (!existing.attachment_types.includes(attachment.attachment_type)) {
            existing.attachment_types.push(attachment.attachment_type)
          }
        } else {
          // 新附件，添加到 Map
          uniqueMap.set(key, {
            ...attachment,
            attachment_types: [attachment.attachment_type]
          })
        }
      })
      
      return Array.from(uniqueMap.values())
    },


    // 下載附件
    async downloadAttachment(attachment) {
      try {
        // Vue 3 方式設置下載狀態
        this.downloadingAttachments[attachment.id] = true
        
        // 使用後端 API 獲取下載鏈接
        const axios = this.$axios || (await import('axios')).default
        const response = await axios.get(`/api/rfis/jarvis/${this.rfi.id}/attachments/${attachment.id}/download`, {
          params: {
            projectId: this.project.id
          }
        })
        
        if (response.data.success) {
          const downloadUrl = response.data.download_url
          const fileName = response.data.attachment_name || attachment.name || attachment.file_name
          const requiresAuth = response.data.requires_auth
          const method = response.data.method
          
          console.log(`使用方法 ${method} 獲取下載鏈接成功`)
          console.log(`下載 URL: ${downloadUrl}`)
          
          // 額外驗證：即使後端返回 success，也要檢查 URL 是否有效
          if (!this.isValidDownloadUrl(downloadUrl)) {
            console.error('後端返回了無效的下載 URL:', downloadUrl)
            ElMessage.error('獲取的下載鏈接無效，請嘗試在 ACC 網頁版中下載')
            
            // 顯示調試信息
            console.group('無效下載 URL 調試信息')
            console.log('附件名稱:', fileName)
            console.log('附件 ID:', attachment.id)
            console.log('返回的 URL:', downloadUrl)
            console.log('使用的方法:', method)
            console.log('完整響應:', response.data)
            console.groupEnd()
            
            return
          }
          
          if (requiresAuth) {
            // 需要認證的下載，使用 fetch 帶上認證頭
            this.downloadWithAuth(downloadUrl, fileName)
          } else {
            // 普通下載
            this.downloadDirect(downloadUrl, fileName)
          }
          
          ElMessage.success(`開始下載 ${fileName}`)
        } else {
          // 處理下載失敗的情況
          const errorMessage = response.data.message || response.data.error || '下載失敗'
          const suggestions = response.data.suggestions || []
          
          // 構建詳細的錯誤消息
          let detailedMessage = errorMessage
          if (suggestions.length > 0) {
            detailedMessage += '\n\n建議解決方案:\n' + suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
          }
          
          ElMessage({
            message: detailedMessage,
            type: 'warning',
            duration: 10000,
            dangerouslyUseHTMLString: false,
            showClose: true
          })
          
          // 在控制台顯示詳細調試信息
          if (response.data.debug_info) {
            console.group('附件下載失敗詳情')
            console.log('附件名稱:', response.data.attachment_name)
            console.log('附件 ID:', attachment.id)
            console.log('錯誤信息:', response.data.error)
            console.log('調試信息:', response.data.debug_info)
            console.groupEnd()
          }
          
          return
        }
        
      } catch (error) {
        console.error('下載附件失敗:', error)
        ElMessage.error(`下載失敗: ${error.response?.data?.error || error.message}`)
      } finally {
        // Vue 3 方式清除下載狀態
        this.downloadingAttachments[attachment.id] = false
      }
    },

    // 直接下載（不需要認證）
    downloadDirect(url, fileName) {
      // 驗證 URL 是否為有效的 HTTP/HTTPS 鏈接
      if (!this.isValidDownloadUrl(url)) {
        console.error('無效的下載 URL:', url)
        ElMessage.error('下載鏈接無效，請嘗試其他方式下載')
        return
      }
      
      // 使用 fetch 下載文件以確保使用正確的文件名
      this.downloadWithCustomFilename(url, fileName)
    },

    // 使用自定義文件名下載
    async downloadWithCustomFilename(url, fileName) {
      try {
        console.log(`開始下載文件: ${fileName}`)
        
        // 使用 fetch 獲取文件
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        // 獲取文件內容
        const blob = await response.blob()
        
        // 創建 blob URL
        const blobUrl = window.URL.createObjectURL(blob)
        
        // 創建下載鏈接並設置正確的文件名
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = fileName // 使用我們指定的文件名
        link.style.display = 'none'
        
        // 執行下載
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理 blob URL
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl)
        }, 100)
        
        console.log(`文件下載完成: ${fileName}`)
        
      } catch (error) {
        console.error('自定義文件名下載失敗:', error)
        ElMessage.error(`下載失敗: ${error.message}`)
      }
    },

    // 驗證下載 URL 是否有效
    isValidDownloadUrl(url) {
      if (!url || typeof url !== 'string') {
        return false
      }
      
      // 檢查是否為有效的 HTTP/HTTPS URL
      try {
        const urlObj = new URL(url)
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
      } catch (error) {
        // 如果不是有效的 URL 格式，檢查是否為 URN 或其他無效格式
        if (url.startsWith('urn:') || url.startsWith('adsk:')) {
          console.warn('檢測到 URN 格式的鏈接，無法直接下載:', url)
          return false
        }
        return false
      }
    },

    // 帶認證的下載
    async downloadWithAuth(url, fileName) {
      // 驗證 URL 是否有效
      if (!this.isValidDownloadUrl(url)) {
        console.error('無效的下載 URL:', url)
        ElMessage.error('下載鏈接無效，請嘗試其他方式下載')
        return
      }
      
      try {
        console.log(`開始認證下載文件: ${fileName}`)
        
        // 使用 axios 下載文件
        const axios = this.$axios || (await import('axios')).default
        const response = await axios({
          method: 'GET',
          url: url,
          responseType: 'blob'
        })
        
        // 創建 blob URL
        const blob = new Blob([response.data])
        const blobUrl = window.URL.createObjectURL(blob)
        
        // 創建下載鏈接並設置正確的文件名
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = fileName // 使用我們指定的文件名
        link.style.display = 'none'
        
        // 執行下載
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理 blob URL
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl)
        }, 100)
        
        console.log(`認證下載完成: ${fileName}`)
        
      } catch (error) {
        console.error('認證下載失敗:', error)
        ElMessage.error('認證下載失敗，無法完成下載')
      }
    },

    // 內部下載方法（不進行 URL 驗證）
    downloadDirectInternal(url, fileName) {
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.target = '_blank'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },


    // 附件分類和篩選相關方法
    getAttachmentsByType(type) {
      if (!this.attachments) return []
      return this.attachments.filter(attachment => attachment.attachment_type === type)
    },

    getOtherAttachments() {
      if (!this.attachments) return []
      const knownTypes = ['rfiResponse', 'rfiOfficialResponse']
      return this.attachments.filter(attachment => !knownTypes.includes(attachment.attachment_type))
    },

    onAttachmentFilterChange(value) {
      console.log('附件篩選變更:', value)
      // 篩選變更時的額外處理（如果需要）
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.rfi-detail {
  padding: var(--spacing-lg);
}

.info-card {
  margin-bottom: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-lighter);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-tags {
  display: flex;
  gap: var(--spacing-sm);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.info-item span {
  color: var(--color-text-primary);
}

.title-text {
  font-size: 1.1em;
  font-weight: 500;
  color: var(--color-text-primary);
}

.description-text {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  line-height: 1.6;
}

.question-content {
  margin-top: var(--spacing-md);
}

.question-section,
.answer-section,
.response-section {
  margin-bottom: var(--spacing-lg);
}

.question-section h4,
.answer-section h4,
.response-section h4 {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  font-weight: 500;
}

.question-text,
.answer-text,
.response-text {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  line-height: 1.6;
  white-space: pre-wrap;
}

.response-meta {
  margin-top: var(--spacing-sm);
  font-size: 0.9em;
  color: var(--color-text-secondary);
  display: flex;
  gap: var(--spacing-md);
}

.custom-attributes {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-lighter);
}

.custom-attributes h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.attributes-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.attribute-item {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
}

.attr-name {
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 120px;
}

.attr-value {
  color: var(--color-text-primary);
}

.impact-assessment {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

.impact-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  align-items: center;
  text-align: center;
}

.impact-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.people-time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-md);
}

.people-section h4,
.time-section h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.people-list,
.time-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.person-item,
.time-item {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
}

.person-role,
.time-label {
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 80px;
}

.person-name,
.time-value {
  color: var(--color-text-primary);
}

.time-value.overdue {
  color: var(--color-danger);
  font-weight: 500;
}

.person-email,
.person-type {
  color: var(--color-text-tertiary);
  font-size: 0.9em;
}

.location-info {
  margin-top: var(--spacing-md);
}

.location-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.location-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.document-link {
  font-family: monospace;
  background: var(--color-bg-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  word-break: break-all;
}

.locations-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.attachments-comments-info {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.attachments-section,
.comments-section {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-lighter);
}

.attachments-section h4,
.comments-section h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.attachments-list,
.comments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.attachment-item {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.attachment-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.attachment-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.attachment-type,
.attachment-size {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.attachment-meta {
  font-size: 0.85em;
  color: var(--color-text-tertiary);
  display: flex;
  gap: var(--spacing-sm);
}

.comment-item {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-md);
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 500;
  color: var(--color-text-primary);
}

.comment-time {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.comment-content {
  line-height: 1.6;
  white-space: pre-wrap;
}

.comment-author-id {
  font-size: 0.85em;
  color: var(--color-text-tertiary);
  font-weight: normal;
}

.comment-text {
  background: var(--color-bg-primary);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-primary);
}

.comment-empty {
  margin: var(--spacing-sm) 0;
}

.comment-attachments {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-lighter);
}

.raw-data {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  overflow-x: auto;
}

.raw-data pre {
  font-size: 0.85em;
  line-height: 1.4;
  margin: 0;
}

.actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-lighter);
}

/* 标签页样式 */
.rfi-tabs {
  margin-bottom: var(--spacing-lg);
}

.rfi-tabs :deep(.el-tabs__header) {
  margin: 0 0 var(--spacing-lg) 0;
}

.rfi-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.tab-content {
  padding: 0;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.tab-badge {
  margin-left: var(--spacing-xs);
}

.no-attachments,
.no-comments {
  padding: var(--spacing-xl);
  text-align: center;
}

/* 新增样式 - basicInfo优化 */
.rfi-header-section {
  margin-bottom: var(--spacing-lg);
}

.rfi-title-container {
  text-align: center;
}

.rfi-main-title {
  font-size: 1.5em;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.3;
}

.rfi-subtitle {
  font-size: 1.1em;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.rfi-ids-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.id-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  text-align: center;
}

.id-label {
  font-size: 0.85em;
  color: var(--color-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rfi-id, .custom-id, .reference-id, .display-id {
  font-family: monospace;
  background: var(--color-bg-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-size: 0.9em;
  font-weight: 600;
  border: 1px solid var(--color-border-lighter);
  word-break: break-all;
}

.rfi-description-section {
  margin-bottom: var(--spacing-lg);
}

.description-content {
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-primary);
}

.description-text {
  line-height: 1.6;
  color: var(--color-text-primary);
  font-size: 1em;
}

/* 分类和属性样式 */
.categories-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}

.category-section {
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
}

.section-title {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.duplicate-info {
  font-size: 0.8em;
  color: var(--color-text-secondary);
  font-weight: normal;
  background: var(--color-warning-light);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.no-data-text {
  color: var(--color-text-tertiary);
  font-style: italic;
  padding: var(--spacing-sm);
}

.discipline-tag, .category-tag {
  margin: 2px;
  font-weight: 500;
}

.attributes-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.attribute-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border-lighter);
}

.attr-label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.attr-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 人员信息样式 */
.people-section {
  margin-bottom: var(--spacing-xl);
}

.people-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.people-group {
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-lighter);
}

.group-title {
  font-size: 1em;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-lighter);
}

.people-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.person-card {
  background: var(--color-bg-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border-lighter);
  text-align: center;
  transition: all 0.2s ease;
}

.person-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.person-role-badge {
  font-size: 0.8em;
  font-weight: 600;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.person-role-badge.creator {
  background: #e3f2fd;
  color: #1976d2;
}

.person-role-badge.manager {
  background: #f3e5f5;
  color: #7b1fa2;
}

.person-role-badge.construction {
  background: #fff3e0;
  color: #f57c00;
}

.person-name {
  font-weight: 500;
  color: var(--color-text-primary);
  word-break: break-word;
}

.role-section {
  margin-bottom: var(--spacing-lg);
}

.role-section:last-child {
  margin-bottom: 0;
}

.role-label {
  display: block;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
  font-size: 0.9em;
}

.person-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.person-tag {
  margin: 2px;
  font-weight: 500;
}

.entity-type-icon {
  margin-right: 4px;
  font-size: 11px;
  opacity: 0.8;
}

/* Custom Attributes Styling */
.custom-attribute-item {
  padding: 12px;
  margin: 8px 0;
  background: var(--el-color-info-light-9);
  border: 1px solid var(--el-color-info-light-7);
  border-radius: 8px;
}

.attr-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.attr-name {
  font-weight: 600;
  color: var(--el-color-text-primary);
  flex: 1;
}

.attr-type-tag,
.attr-source-tag {
  font-size: 10px;
}

.custom-attribute-item .attr-value {
  color: var(--el-color-text-regular);
  font-size: 14px;
  word-break: break-word;
}

.responses-section {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-lighter);
}

.responses-section h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.response-item {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border-left: 3px solid var(--color-primary);
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.response-meta {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.response-time {
  font-size: 0.9em;
  color: var(--color-text-secondary);
  margin-left: var(--spacing-sm);
}

.no-response-text {
  margin: var(--spacing-sm) 0;
}

.status-progress-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-md);
}

.status-section h4,
.actions-section h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.status-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
}

.status-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.previous-status {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.permitted-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.action-tag {
  margin: 2px;
}

.time-value-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.time-value {
  color: var(--color-text-primary);
}

.time-relative {
  font-size: 0.85em;
  color: var(--color-text-tertiary);
}

/* 时间线样式 */
.time-section {
  margin-bottom: var(--spacing-xl);
}

.timeline-container {
  position: relative;
  padding-left: var(--spacing-xl);
}

.timeline-container::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--color-primary), var(--color-border-lighter));
}

.timeline-item {
  position: relative;
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -32px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid var(--color-bg-primary);
  z-index: 1;
}

.timeline-dot.created {
  background: #4caf50;
}

.timeline-dot.started {
  background: #2196f3;
}

.timeline-dot.due {
  background: #ff9800;
}

.timeline-dot.due.overdue {
  background: #f44336;
  animation: pulse 2s infinite;
}

.timeline-dot.updated {
  background: #9c27b0;
}

.timeline-dot.responded {
  background: #00bcd4;
}

.timeline-dot.closed {
  background: #607d8b;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
}

.timeline-content {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-lighter);
  flex: 1;
  min-width: 0;
}

.timeline-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.timeline-time {
  font-size: 0.95em;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.timeline-time.overdue-text {
  color: var(--color-danger);
  font-weight: 600;
}

.timeline-relative {
  font-size: 0.85em;
  color: var(--color-text-tertiary);
}

.overdue-tag {
  margin-left: var(--spacing-xs);
}

/* 状态和进度区域样式 */
.main-status-section {
  margin-bottom: var(--spacing-xl);
}

.status-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary), #667eea);
  border-radius: var(--border-radius-lg);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.status-content {
  flex: 1;
}

.status-label {
  font-size: 0.9em;
  opacity: 0.9;
  margin-bottom: var(--spacing-xs);
}

.status-value {
  margin-bottom: var(--spacing-sm);
}

.status-description {
  font-size: 0.85em;
  opacity: 0.8;
}

.status-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.status-detail-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-lighter);
  transition: all 0.2s ease;
}

.status-detail-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.detail-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-lighter);
  color: var(--color-text-tertiary);
}

.detail-icon.answered.active {
  background: #4caf50;
  border-color: #4caf50;
  color: white;
}

.detail-icon.closed.active {
  background: #607d8b;
  border-color: #607d8b;
  color: white;
}

.detail-icon.overdue.active {
  background: #f44336;
  border-color: #f44336;
  color: white;
}

.detail-icon.draft.active {
  background: #ff9800;
  border-color: #ff9800;
  color: white;
}

.detail-content {
  flex: 1;
}

.detail-label {
  font-size: 0.9em;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.action-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 2px solid var(--color-border-lighter);
  transition: all 0.2s ease;
}

.action-card.action-allowed {
  border-color: var(--color-success);
  background: rgba(76, 175, 80, 0.05);
}

.action-card.action-disabled {
  border-color: var(--color-border-lighter);
  background: var(--color-bg-secondary);
  opacity: 0.6;
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.action-allowed .action-icon {
  background: var(--color-success);
  color: white;
}

.action-disabled .action-icon {
  background: var(--color-border-lighter);
  color: var(--color-text-tertiary);
}

.action-content {
  flex: 1;
}

.action-name {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.action-status {
  font-size: 0.85em;
  color: var(--color-text-secondary);
}

/* 附件和评论区域样式 */
.media-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.media-stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--color-border-lighter);
  transition: all 0.2s ease;
}

.media-stat-card.has-content {
  border-color: var(--color-primary);
  background: rgba(64, 158, 255, 0.05);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: var(--color-primary);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2em;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 1.1em;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.stat-status {
  margin-bottom: var(--spacing-sm);
}

.stat-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.media-content-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--color-border-lighter);
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.attachment-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-lighter);
  transition: all 0.2s ease;
}

.attachment-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.attachment-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-left: auto;
  flex-shrink: 0;
}

.attachment-actions .el-button {
  min-width: 60px;
}

.attachment-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-sm);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.attachment-details {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  word-break: break-word;
}

.attachment-meta {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  flex-wrap: wrap;
}

.attachment-type, .attachment-size {
  font-size: 0.85em;
  color: var(--color-text-secondary);
  background: var(--color-bg-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
}

.attachment-category {
  font-size: 0.8em;
  color: var(--color-success);
  background: var(--color-success-light);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-weight: 500;
}

.attachment-creator {
  font-size: 0.8em;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.attachment-time {
  font-size: 0.8em;
  color: var(--color-text-tertiary);
}

.comments-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.comment-card {
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-lighter);
}



.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-md);
}

.comment-author {
  font-weight: 600;
  color: var(--color-text-primary);
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.comment-time {
  font-size: 0.85em;
  color: var(--color-text-secondary);
}

.comment-content {
  line-height: 1.6;
}

.comment-text {
  background: var(--color-bg-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-primary);
}

.comment-empty {
  margin: var(--spacing-sm) 0;
}

/* 附件標籤頁專用樣式 */
.attachments-overview {
  margin-bottom: var(--spacing-xl);
}

.attachments-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border-lighter);
  transition: all 0.2s ease;
}

.stat-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.stat-number {
  font-size: 2em;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 0.9em;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.attachments-filter {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
}

.attachments-filter .el-radio-group {
  background: var(--color-bg-secondary);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
}

.attachments-grid-section {
  margin-top: var(--spacing-lg);
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.attachment-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-lighter);
  transition: all 0.2s ease;
}

.attachment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.attachment-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-sm);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.attachment-details {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  word-break: break-word;
  line-height: 1.4;
}

.attachment-meta {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  flex-wrap: wrap;
}

.attachment-type, .attachment-size {
  font-size: 0.85em;
  color: var(--color-text-secondary);
  background: var(--color-bg-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border-lighter);
}

.attachment-category {
  font-size: 0.8em;
  color: var(--color-success);
  background: var(--color-success-light);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-weight: 500;
}

.attachment-time {
  font-size: 0.8em;
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-xs);
}

.attachment-creator {
  font-size: 0.8em;
  color: var(--color-text-secondary);
}

.attachment-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-left: auto;
  flex-shrink: 0;
}

.attachment-actions .el-button {
  min-width: 60px;
}

.no-filtered-attachments {
  padding: var(--spacing-xl);
  text-align: center;
}

.no-filtered-attachments .el-empty {
  padding: var(--spacing-lg) 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rfi-main-title {
    font-size: 1.3em;
  }

  .rfi-ids-section {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .categories-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .attributes-summary {
    grid-template-columns: 1fr;
  }

  .people-cards {
    grid-template-columns: 1fr;
  }

  .person-tags-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .timeline-container {
    padding-left: var(--spacing-lg);
  }

  .timeline-dot {
    left: -24px;
    width: 12px;
    height: 12px;
  }

  .timeline-container::before {
    left: 8px;
  }

  .impact-assessment {
    grid-template-columns: 1fr;
  }
  
  .attachments-comments-info {
    grid-template-columns: 1fr;
  }
  
  .attributes-list {
    grid-template-columns: 1fr;
  }

  .status-progress-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .status-details-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .media-overview {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .attachments-grid {
    grid-template-columns: 1fr;
  }

  .attachments-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
  }

  .stat-item {
    padding: var(--spacing-sm);
  }

  .stat-number {
    font-size: 1.5em;
  }

  .attachments-filter .el-radio-group {
    padding: var(--spacing-xs);
  }

  .attachments-filter .el-radio-button {
    font-size: 0.8em;
  }

  .attachment-card {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }

  .attachment-actions {
    flex-direction: row;
    justify-content: center;
    margin-left: 0;
  }

  .status-card {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-md);
  }

  .media-stat-card {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-md);
  }
}
</style>
