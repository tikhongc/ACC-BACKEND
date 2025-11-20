<template>
  <div class="issue-detail-view">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 返回按钮 -->
    <div class="back-button">
      <el-button @click="goBack" icon="ArrowLeft">{{ t('issueDetail.backToList') }}</el-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>{{ t('issueDetail.loading') }}</p>
    </div>

    <!-- 主内容 -->
    <div v-else-if="item" class="detail-container">
      <!-- 页面标题和摘要 -->
      <div class="page-header-section">
        <div class="header-title">
          <h1>
            <span class="title-icon">🐛</span>
            Issue: {{ item.title }}
          </h1>
          <div class="item-id-badge">
            #{{ item.displayId }}
          </div>
        </div>

        <!-- 核心状态摘要 -->
        <div class="status-summary">
          <div class="summary-row">
            <div class="summary-item">
              <span class="label">{{ t('issueDetail.statusSummary.status') }}</span>
              <span :class="['status-badge', getStatusClass(item.status)]">
                {{ getStatusText(item.status) }}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">{{ t('issueDetail.statusSummary.assignedTo') }}</span>
              <span class="value">
                {{ getAssignedToDisplay(item) }}
                <span v-if="item.assignedToType" class="assignment-type">({{ getAssignedToTypeText(item.assignedToType) }})</span>
              </span>
            </div>
          </div>
          <div class="summary-row">
            <div class="summary-item">
              <span class="label">{{ t('issueDetail.statusSummary.dueDate') }}</span>
              <span :class="['due-date', getDueDateClass(item.dueDate)]">
                {{ formatDate(item.dueDate) || '-' }}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">{{ t('issueDetail.statusSummary.publishStatus') }}</span>
              <span :class="['publish-badge', item.published ? 'published' : 'draft']">
                {{ item.published ? t('issueDetail.statusSummary.published') : t('issueDetail.statusSummary.draft') }}
              </span>
            </div>
          </div>
          <div class="summary-row" v-if="item.commentCount || item.attachmentCount">
            <div class="summary-item">
              <span class="label">{{ t('issueDetail.statusSummary.commentCount') }}</span>
              <span class="count-badge">{{ item.commentCount || 0 }}</span>
            </div>
            <div class="summary-item">
              <span class="label">{{ t('issueDetail.statusSummary.attachmentCount') }}</span>
              <span class="count-badge">{{ item.attachmentCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 页签内容 -->
      <div class="tabs-container">
        <el-tabs v-model="activeTab" type="card">
          <!-- 页签1: 详细资讯 -->
          <el-tab-pane :label="t('issueDetail.tabs.details')" name="details">
            <div class="tab-content">
              <div class="info-grid">
                <!-- 基本资讯 -->
                <div class="info-section">
                  <h3 class="section-title">{{ t('issueDetail.sections.basicInfo') }}</h3>
                  <div class="info-rows">
                    <div class="info-row">
                      <span class="info-label">{{ t('issueDetail.fields.issueId') }}</span>
                      <span class="info-value">#{{ item.displayId }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">{{ t('issueDetail.fields.type') }}</span>
                      <span class="info-value">{{ getIssueTypeDisplayName(item.issueTypeId, item.issueSubtypeId) }}</span>
                    </div>
                    <div class="info-row" v-if="item.rootCauseId">
                      <span class="info-label">{{ t('issueDetail.fields.rootCauseId') }}</span>
                      <span class="info-value">{{ getRootCauseName(item.rootCauseId) }}</span>
                    </div>
                    <div class="info-row" v-if="item.locationId">
                      <span class="info-label">{{ t('issueDetail.fields.locationId') }}</span>
                      <span class="info-value">{{ item.locationId }}</span>
                    </div>
                    <div class="info-row" v-if="item.locationDetails">
                      <span class="info-label">{{ t('issueDetail.fields.locationDescription') }}</span>
                      <span class="info-value">{{ item.locationDetails }}</span>
                    </div>
                  </div>
                </div>

                <!-- 人员与角色 -->
                <div class="info-section">
                  <h3 class="section-title">{{ t('issueDetail.sections.peopleAndRoles') }}</h3>
                  <div class="info-rows">
                    <div class="info-row">
                      <span class="info-label">{{ t('issueDetail.fields.assignedTo') }}</span>
                      <span class="info-value">
                        {{ getAssignedToDisplayName(item.assignedTo, item.assignedToType) }}
                        <span class="user-type-tag">({{ getAssignedToTypeText(item.assignedToType) }})</span>
                      </span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">{{ t('issueDetail.fields.createdBy') }}</span>
                      <span class="info-value">{{ getUserDisplayName(item.createdBy) }}</span>
                    </div>
                    <div class="info-row" v-if="item.updatedBy">
                      <span class="info-label">{{ t('issueDetail.fields.updatedBy') }}</span>
                      <span class="info-value">{{ getUserDisplayName(item.updatedBy) }}</span>
                    </div>
                    <div class="info-row" v-if="item.closedBy">
                      <span class="info-label">{{ t('issueDetail.fields.closedBy') }}</span>
                      <span class="info-value">{{ getUserDisplayName(item.closedBy) }}</span>
                    </div>
                    
                    <!-- 观察者信息移到这里 -->
                    <div v-if="getUniqueWatchers(item).length > 0" class="info-row watchers-row">
                      <span class="info-label">{{ t('issueDetail.fields.watchers') }} ({{ getUniqueWatchers(item).length }})</span>
                      <div class="info-value watchers-list">
                        <div v-for="(watcher, index) in getUniqueWatchers(item)" :key="watcher.id" class="watcher-item">
                          <span class="watcher-name">{{ getWatcherDisplayName(watcher.id, watcher.type) }}</span>
                          <span class="watcher-type-text">({{ getWatcherTypeText(watcher.type) }})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 关键日期 -->
                <div class="info-section full-width">
                  <h3 class="section-title">{{ t('issueDetail.sections.keyDates') }}</h3>
                  <div class="info-rows dates-grid">
                    <div class="info-row">
                      <span class="info-label">{{ t('issueDetail.fields.createdAt') }}</span>
                      <span class="info-value">{{ formatDateTime(item.createdAt) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">{{ t('issueDetail.fields.updatedAt') }}</span>
                      <span class="info-value">{{ formatDateTime(item.updatedAt) }}</span>
                    </div>
                    <div class="info-row" v-if="item.startDate">
                      <span class="info-label">{{ t('issueDetail.fields.startDate') }}</span>
                      <span class="info-value">{{ formatDateTime(item.startDate) }}</span>
                    </div>
                    <div class="info-row" v-if="item.dueDate">
                      <span class="info-label">{{ t('issueDetail.fields.dueDate') }}</span>
                      <span class="info-value">{{ formatDateTime(item.dueDate) }}</span>
                    </div>
                    <div class="info-row" v-if="item.closedAt">
                      <span class="info-label">{{ t('issueDetail.fields.closedAt') }}</span>
                      <span class="info-value">{{ formatDateTime(item.closedAt) }}</span>
                    </div>
                  </div>
                </div>

                <!-- 描述 -->
                <div class="info-section full-width" v-if="item.description">
                  <h3 class="section-title">{{ t('issueDetail.sections.description') }}</h3>
                  <div class="description-box">
                    {{ item.description }}
                  </div>
                </div>

                <!-- 自定义属性 -->
                <div class="info-section full-width" v-if="item.customAttributes && item.customAttributes.length > 0">
                  <h3 class="section-title">{{ t('issueDetail.sections.customAttributes') }} ({{ item.customAttributes.length }})</h3>
                  <div class="custom-attributes-rows">
                    <div v-for="(attr, index) in item.customAttributes" :key="attr.attributeDefinitionId || index" class="custom-attr-row">
                      <div class="custom-attr-label">
                        <span class="attr-name">{{ attr.title || 'Unnamed Attribute' }}</span>
                        <el-tag :type="getCustomAttributeTypeColor(attr.type)" size="small" class="attr-type-tag">
                          {{ getCustomAttributeTypeText(attr.type) }}
                        </el-tag>
                      </div>
                      <div class="custom-attr-value">
                        <span class="value-prefix">value:</span>
                        <span class="attr-value-text" :class="getCustomAttributeValueClass(attr.type)">
                          {{ formatCustomAttributeValue(attr) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 位置信息 -->
                <div class="info-section full-width" v-if="item.linkedDocuments && item.linkedDocuments.length > 0">
                  <h3 class="section-title">{{ t('issueDetail.sections.positionLocationInfo') }}</h3>
                  <div class="simplified-documents-grid">
                    <div v-for="(doc, index) in item.linkedDocuments" :key="index" class="simplified-document-card">
                      <div class="document-header">
                        <div class="document-icon-section">
                          <el-icon class="document-icon" :class="getDocumentIconClass(doc)"><Document /></el-icon>
                        </div>
                        <div class="document-info">
                          <div class="document-name">
                            {{ getDocumentDisplayName(doc) }}
                          </div>
                        </div>
                        <div class="document-actions">
                          <el-button 
                            @click="showDocumentDetail(doc)" 
                            type="primary" 
                            size="small"
                            :icon="View">
                            {{ t('issueDetail.linkedDocuments.viewDetails') }}
                          </el-button>
                        </div>
                      </div>
                      
                      <div class="document-summary">
                        <div class="summary-item" v-if="doc.enhanced_info?.file_size">
                          <span class="summary-label">{{ t('issueDetail.linkedDocuments.fileSize') }}</span>
                          <span class="summary-value">{{ formatFileSize(doc.enhanced_info.file_size) }}</span>
                        </div>
                        <div class="summary-item" v-if="doc.enhanced_info?.version_number">
                          <span class="summary-label">{{ t('issueDetail.linkedDocuments.version') }}</span>
                          <span class="summary-value">v{{ doc.enhanced_info.version_number }}</span>
                        </div>
                        <div class="summary-item" v-if="getDocumentLocationInfo(doc)">
                          <span class="summary-label">{{ t('issueDetail.linkedDocuments.locationInfo') }}</span>
                          <span class="summary-value">{{ getDocumentLocationInfo(doc) }}</span>
                        </div>
                        <div class="summary-item" v-if="doc.enhanced_info?.last_modified_time">
                          <span class="summary-label">{{ t('issueDetail.linkedDocuments.modifiedTime') }}</span>
                          <span class="summary-value">{{ formatDateTime(doc.enhanced_info.last_modified_time) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>



                <!-- 官方回复 -->
                <div class="info-section full-width collapsible-section" v-if="item.officialResponse">
                  <div class="collapsible-header" @click="officialResponseCollapsed = !officialResponseCollapsed">
                    <h3 class="section-title">
                      <el-icon class="collapse-icon" :class="{ 'collapsed': officialResponseCollapsed }">
                        <ArrowDown />
                      </el-icon>
                      {{ t('issueDetail.sections.officialResponse') }}
                    </h3>
                  </div>
                  <div v-show="!officialResponseCollapsed" class="collapsible-content">
                    <div class="official-response-section">
                      <div v-if="item.officialResponse.response" class="response-content">
                        <div class="response-text">{{ item.officialResponse.response }}</div>
                        <div class="response-metadata">
                          <div v-if="item.officialResponse.respondedBy" class="response-by">
                            <span class="label">{{ t('issueDetail.officialResponse.respondedBy') }}:</span>
                            <span class="value">{{ getUserDisplayName(item.officialResponse.respondedBy) }}</span>
                          </div>
                          <div v-if="item.officialResponse.respondedAt" class="response-at">
                            <span class="label">{{ t('issueDetail.officialResponse.respondedAt') }}:</span>
                            <span class="value">{{ formatDateTime(item.officialResponse.respondedAt) }}</span>
                          </div>
                        </div>
                      </div>
                      <div v-else class="no-response">
                        <el-tag type="info">{{ t('issueDetail.officialResponse.noResponse') }}</el-tag>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 快照信息 -->
                <div class="info-section full-width collapsible-section" v-if="item.snapshotUrn">
                  <div class="collapsible-header" @click="snapshotInfoCollapsed = !snapshotInfoCollapsed">
                    <h3 class="section-title">
                      <el-icon class="collapse-icon" :class="{ 'collapsed': snapshotInfoCollapsed }">
                        <ArrowDown />
                      </el-icon>
                      {{ t('issueDetail.sections.snapshotInfo') }}
                    </h3>
                  </div>
                  <div v-show="!snapshotInfoCollapsed" class="collapsible-content">
                    <div class="snapshot-explanation">
                      <el-alert
                        :title="t('issueDetail.snapshot.explanation')"
                        type="info"
                        :closable="false"
                        show-icon>
                        <template #default>
                          {{ t('issueDetail.snapshot.explanationText') }}
                        </template>
                      </el-alert>
                    </div>
                    <div class="snapshot-section">
                      <div class="snapshot-urn">
                        <span class="label">{{ t('issueDetail.snapshot.snapshotUrn') }}:</span>
                        <code class="urn-code">{{ item.snapshotUrn }}</code>
                        <div class="snapshot-actions">
                          <el-button 
                            @click="downloadSnapshot" 
                            :loading="snapshotDownloading"
                            type="primary" 
                            size="small"
                            :disabled="!item.snapshotUrn">
                            <el-icon><Download /></el-icon>
                            {{ t('issueDetail.snapshot.downloadSnapshot') }}
                          </el-button>
                          <el-button 
                            @click="previewSnapshot" 
                            type="default" 
                            size="small"
                            :disabled="!item.snapshotUrn">
                            <el-icon><View /></el-icon>
                            {{ t('issueDetail.snapshot.previewSnapshot') }}
                          </el-button>
                        </div>
                      </div>
                      <div v-if="item.snapshotHasMarkups !== null" class="snapshot-markups">
                        <span class="label">{{ t('issueDetail.snapshot.containsMarkups') }}:</span>
                        <el-tag :type="item.snapshotHasMarkups ? 'success' : 'info'" size="small">
                          {{ item.snapshotHasMarkups ? t('issueDetail.snapshot.yes') : t('issueDetail.snapshot.no') }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 权限信息 -->
                <div class="info-section full-width collapsible-section" v-if="item.permittedActions || item.permittedAttributes || item.permittedStatuses">
                  <div class="collapsible-header" @click="permissionsCollapsed = !permissionsCollapsed">
                    <h3 class="section-title">
                      <el-icon class="collapse-icon" :class="{ 'collapsed': permissionsCollapsed }">
                        <ArrowDown />
                      </el-icon>
                      {{ t('issueDetail.sections.permissions') }}
                    </h3>
                  </div>
                  <div v-show="!permissionsCollapsed" class="collapsible-content">
                    <div class="permissions-section">
                      <div v-if="item.permittedActions && item.permittedActions.length > 0" class="permitted-actions">
                        <div class="permission-group-title">{{ t('issueDetail.permissions.allowedActions') }}:</div>
                        <div class="permission-tags">
                          <el-tag v-for="action in item.permittedActions" :key="action" type="success" size="small">
                            {{ getActionText(action) }}
                          </el-tag>
                        </div>
                      </div>
                      <div v-if="item.permittedStatuses && item.permittedStatuses.length > 0" class="permitted-statuses">
                        <div class="permission-group-title">{{ t('issueDetail.permissions.allowedStatuses') }}:</div>
                        <div class="permission-tags">
                          <el-tag v-for="status in item.permittedStatuses" :key="status" type="primary" size="small">
                            {{ getStatusText(status) }}
                          </el-tag>
                        </div>
                      </div>
                      <div v-if="item.permittedAttributes && item.permittedAttributes.length > 0" class="permitted-attributes">
                        <div class="permission-group-title">{{ t('issueDetail.permissions.editableAttributes') }} ({{ item.permittedAttributes.length }}):</div>
                        <div class="permission-tags attributes-tags">
                          <el-tag v-for="attr in item.permittedAttributes" :key="attr" type="info" size="small">
                            {{ getAttributeText(attr) }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- JSON Viewer for Details Tab -->
              <div class="tab-json-viewer">
                <JsonViewer 
                  v-if="item"
                  :data="item"
                  title="🐛 Detailed Information API Data"
                  description="Basic Issue data displayed on current page"
                  :show-copy="true"
                  :show-download="true"
                  :collapsible="true"
                  :collapsed="true" />
              </div>
            </div>
          </el-tab-pane>

          <!-- 页签2: 留言 -->
          <el-tab-pane name="comments">
            <template #label>
              💬 {{ t('issueDetail.tabs.comments') }} <span class="tab-badge" v-if="commentsCount">({{ commentsCount }})</span>
            </template>
            <div class="tab-content">
              <div v-if="commentsLoading" class="loading-state">
                <div class="spinner-small"></div>
                <p>{{ t('issueDetail.loading.comments') }}</p>
              </div>
              <div v-else>
                <IssueComments 
                  :project-id="route.query.projectId"
                  :issue-id="item.id"
                  :key="`comments-${item.id}`"
                  @comments-loaded="handleCommentsLoaded" />
                
                <!-- JSON Viewer for Comments Tab -->
                <div class="tab-json-viewer">
                  <JsonViewer 
                    v-if="commentsData"
                    :data="commentsData"
                    title="💬 Comments API Data"
                    description="All comment information for this Issue"
                    :show-copy="true"
                    :show-download="true"
                    :collapsible="true"
                    :collapsed="true" />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 页签3: 附件 -->
          <el-tab-pane name="attachments">
            <template #label>
              📎 {{ t('issueDetail.tabs.attachments') }} <span class="tab-badge" v-if="attachmentsCount">({{ attachmentsCount }})</span>
            </template>
            <div class="tab-content">
              <div v-if="attachmentsLoading" class="loading-state">
                <div class="spinner-small"></div>
                <p>{{ t('issueDetail.loading.attachments') }}</p>
              </div>
              <div v-else>
                <IssueAttachments 
                  :project-id="route.query.projectId"
                  :issue-id="item.id"
                  :key="`attachments-${item.id}`"
                  @attachments-loaded="handleAttachmentsLoaded" />
                
                <!-- JSON Viewer for Attachments Tab -->
                <div class="tab-json-viewer">
                  <JsonViewer 
                    v-if="attachmentsData"
                    :data="attachmentsData"
                    title="📎 Attachments API Data"
                    description="All attachment information for this Issue"
                    :show-copy="true"
                    :show-download="true"
                    :collapsible="true"
                    :collapsed="true" />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 页签4: 参照 -->
          <el-tab-pane name="references">
            <template #label>
              🔗 {{ t('issueDetail.tabs.references') }} <span class="tab-badge" v-if="item && item.references_count && item.references_count > 0">({{ item.references_count }})</span>
            </template>
            <div class="tab-content">
              <EntityReferences 
                v-if="item && route.query.projectId"
                :entity="item" 
                :project="{ id: route.query.projectId }"
                entity-type="issue"
                :auto-load="true"
                :show-debug-info="false"
                :show-json-viewer="false"
                :supported-reference-types="['document', 'file', 'drawing', 'photo', 'rfi', 'submittal']"
                @references-loaded="onReferencesLoaded"
                @references-error="onReferencesError" />
            </div>
          </el-tab-pane>

          <!-- 页签5: API 数据 -->
          <el-tab-pane name="api-data">
            <template #label>
              📋 {{ t('issueDetail.tabs.apiData') }}
            </template>
            <div class="tab-content">
              <div class="json-viewers-container">
                
                <!-- 基本项目数据 -->
                <div class="json-section">
                  <JsonViewer 
                    v-if="item"
                    :data="item"
                    :title="t('issueDetail.jsonViewer.issueData.title')"
                    :description="t('issueDetail.jsonViewer.issueData.description')"
                    :show-copy="true"
                    :show-download="true"
                    :collapsible="true"
                    :collapsed="false" />
                </div>

                <!-- 留言数据 -->
                <div v-if="commentsData" class="json-section">
                  <JsonViewer 
                    :data="commentsData"
                    :title="t('issueDetail.jsonViewer.commentsData.title')"
                    :description="t('issueDetail.jsonViewer.commentsData.description')"
                    :show-copy="true"
                    :show-download="true"
                    :collapsible="true"
                    :collapsed="true" />
                </div>

                <!-- 附件数据 -->
                <div v-if="attachmentsData" class="json-section">
                  <JsonViewer 
                    :data="attachmentsData"
                    :title="t('issueDetail.jsonViewer.attachmentsData.title')"
                    :description="t('issueDetail.jsonViewer.attachmentsData.description')"
                    :show-copy="true"
                    :show-download="true"
                    :collapsible="true"
                    :collapsed="true" />
                </div>

                <!-- API 调用信息 -->
                <div class="json-section">
                  <JsonViewer 
                    :data="apiCallsInfo"
                    :title="t('issueDetail.jsonViewer.apiCallsInfo.title')"
                    :description="t('issueDetail.jsonViewer.apiCallsInfo.description')"
                    :show-copy="true"
                    :show-download="false"
                    :collapsible="true"
                    :collapsed="true" />
                </div>

              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>{{ t('issueDetail.error.title') }}</h3>
      <p>{{ t('issueDetail.error.loadFailed') }}</p>
      <el-button type="primary" @click="loadData">{{ t('common.retry') }}</el-button>
    </div>
    
    <!-- 文档详情模态框 -->
    <DocumentDetailModal 
      v-model="documentDetailVisible"
      :document="selectedDocument" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Breadcrumb from '../components/Breadcrumb.vue';
import IssueComments from '../components/IssueComments.vue';
import IssueAttachments from '../components/IssueAttachments.vue';
import EntityReferences from '../components/EntityReferences.vue';
import JsonViewer from '../components/JsonViewer.vue';
import DocumentDetailModal from '../components/DocumentDetailModal.vue';
import userCache from '../utils/userCache.js';
import entityCache from '../utils/entityCache.js';
import rootCauseCache from '../utils/rootCauseCache.js';
import issueTypeCache from '../utils/issueTypeCache.js';
import axios from 'axios';
import { Document, User, Download, View, Location, ArrowDown, ArrowRight } from '@element-plus/icons-vue';

export default {
  name: 'IssueDetailView',
  components: {
    Breadcrumb,
    IssueComments,
    IssueAttachments,
    EntityReferences,
    JsonViewer,
    DocumentDetailModal,
    Document
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();

    // 数据状态
    const item = ref(null);
    const commentsData = ref(null);
    const attachmentsData = ref(null);
    const attributeDefinitions = ref([]);
    
    // UI 状态
    const loading = ref(false);
    const commentsLoading = ref(false);
    const attachmentsLoading = ref(false);
    const commentsCount = ref(0);
    const attachmentsCount = ref(0);
    const activeTab = ref('details');
    const snapshotDownloading = ref(false);
    
    // 折叠状态
    const officialResponseCollapsed = ref(true);
    const snapshotInfoCollapsed = ref(true);
    const permissionsCollapsed = ref(true);
    
    // 文档详情模态框
    const documentDetailVisible = ref(false);
    const selectedDocument = ref(null);
    
    // 缓存的名称
    const rootCauseName = ref('');
    const issueTypeName = ref('');

    // API 调用信息
    const apiCallsInfo = computed(() => {
      const projectId = route.query.projectId;
      const issueId = route.query.issueId;
      
      return {
        timestamp: new Date().toISOString(),
        projectId: projectId,
        issueId: issueId,
        endpoints: {
          item: {
            url: `/api/issues/projects/${projectId}/issues/${issueId}`,
            status: item.value ? 'success' : 'pending',
            hasData: !!item.value,
            dataSize: item.value ? Object.keys(item.value).length : 0
          },
          comments: {
            url: `/api/issues/projects/${projectId}/issues/${issueId}/comments`,
            status: commentsData.value ? 'success' : 'pending',
            hasData: !!commentsData.value,
            count: commentsCount.value
          },
          attachments: {
            url: `/api/issues/projects/${projectId}/issues/${issueId}/attachments`,
            status: attachmentsData.value ? 'success' : 'pending',
            hasData: !!attachmentsData.value,
            count: attachmentsCount.value
          }
        }
      };
    });

    // 加载自定义属性定义
    const loadAttributeDefinitions = async (projectId) => {
      try {
        console.log('🔍 Loading custom attribute definitions...');
        const response = await axios.get(`/api/issues/projects/${projectId}/attribute-definitions`, {
          params: { limit: 200 }
        });
        
        if (response.data.status === 'success') {
          attributeDefinitions.value = response.data.data.results || [];
          console.log(`✅ Loaded ${attributeDefinitions.value.length} custom attribute definitions`);
        } else {
          console.warn('⚠️ Failed to load custom attribute definitions:', response.data.error);
        }
      } catch (error) {
        console.warn('⚠️ Error loading custom attribute definitions:', error);
      }
    };

    // 方法
    const loadData = async () => {
      loading.value = true;
      try {
        const projectId = route.query.projectId;
        const issueId = route.query.issueId;

        if (!projectId || !issueId) {
          throw new Error('Missing required parameters');
        }

        console.log('Loading issue data:', { projectId, issueId });

        // 🔑 关键：预加载实体缓存数据
        console.log('🏢 预加载项目实体缓存数据...')
      // 🔧 修复后：恢复正常缓存行为
      const entityCachePromise = entityCache.getProjectEntities(projectId, false) // 使用缓存提升性能

        // 并行加载基本数据（启用文档增强功能）、实体缓存和属性定义
        const [response, entityCacheData] = await Promise.all([
          axios.get(`/api/issues/projects/${projectId}/issues/${issueId}?enhanceDocuments=true`),
          entityCachePromise,
          loadAttributeDefinitions(projectId)
        ])
        
        console.log('✅ 实体缓存加载完成:', {
          用户数量: Object.keys(entityCacheData.users || {}).length,
          角色数量: Object.keys(entityCacheData.roles || {}).length,
          公司数量: Object.keys(entityCacheData.companies || {}).length
        })

        // 🔍 调试：显示缓存概览
        entityCache.debugCacheOverview(projectId)
        
        // 🔍 调试：检查公司缓存状态
        console.log('🏢 公司缓存详细状态:', {
          项目公司缓存: entityCacheData.companies ? Object.keys(entityCacheData.companies).length : 0,
          项目公司示例: entityCacheData.companies ? Object.keys(entityCacheData.companies).slice(0, 5) : [],
          全局公司缓存: Object.keys(entityCache.data.globalEntitiesMap.companies).length,
          全局公司示例: Object.keys(entityCache.data.globalEntitiesMap.companies).slice(0, 5),
          是否包含611478980: {
            项目: entityCacheData.companies && (entityCacheData.companies['611478980'] || entityCacheData.companies[611478980]),
            全局: entityCache.data.globalEntitiesMap.companies['611478980'] || entityCache.data.globalEntitiesMap.companies[611478980]
          }
        })
        
        // 🔍 调试：检查内部缓存结构
        console.log('🔍 内部缓存结构对比:', {
          项目缓存路径: `data.projectEntitiesMap.${projectId}.companies`,
          项目缓存实际: entityCache.data.projectEntitiesMap[projectId]?.companies,
          项目缓存键: entityCache.data.projectEntitiesMap[projectId]?.companies ? Object.keys(entityCache.data.projectEntitiesMap[projectId].companies) : '无',
          全局缓存实际: entityCache.data.globalEntitiesMap.companies,
          全局缓存键: Object.keys(entityCache.data.globalEntitiesMap.companies),
          返回的缓存数据: entityCacheData.companies,
          返回数据键: entityCacheData.companies ? Object.keys(entityCacheData.companies) : '无'
        })
        
        // 🔍 调试：特别检查问题用户ID
        entityCache.debugFindId('611478980', projectId)
        entityCache.debugFindId(611478980, projectId)
        entityCache.debugFindId('QT725AZVMVUKV69K', projectId)
        
        // 根据API返回结构处理数据
        if (response.data.status === 'success') {
          item.value = response.data.data;
          
          // 预加载缓存名称
          if (item.value) {
            // 加载根本原因名称
            if (item.value.rootCauseId) {
              rootCauseCache.getRootCauseName(item.value.rootCauseId, projectId).then(name => {
                rootCauseName.value = name;
              }).catch(error => {
                console.error('预加载根本原因名称失败:', error);
              });
            }
            
            // 加载议题类型名称
            if (item.value.issueTypeId || item.value.issueSubtypeId) {
              issueTypeCache.getFullTypeName(item.value.issueTypeId, item.value.issueSubtypeId, projectId).then(name => {
                issueTypeName.value = name;
              }).catch(error => {
                console.error('预加载议题类型名称失败:', error);
              });
            }
          }
          
          // 🔍 调试：分析Issue数据中的用户ID
          if (item.value) {
            const userIds = new Set()
            
            // 收集各种用户ID
            if (item.value.assignedTo) userIds.add(item.value.assignedTo)
            if (item.value.createdBy) userIds.add(item.value.createdBy)
            if (item.value.updatedBy) userIds.add(item.value.updatedBy)
            if (item.value.closedBy) userIds.add(item.value.closedBy)
            if (item.value.ownerId) userIds.add(item.value.ownerId)
            
            // 从观察者中收集
            if (item.value.watchers) {
              item.value.watchers.forEach(watcher => userIds.add(watcher))
            }
            if (item.value.watcherObjects) {
              item.value.watcherObjects.forEach(watcher => {
                if (watcher.id) userIds.add(watcher.id)
              })
            }
            
            // 从官方回复中收集
            if (item.value.officialResponse?.respondedBy) {
              userIds.add(item.value.officialResponse.respondedBy)
            }
            
            console.log('🔍 Issue中使用的用户ID:', {
              总数: userIds.size,
              用户ID列表: Array.from(userIds),
              分配给: item.value.assignedTo,
              分配类型: item.value.assignedToType,
              创建者: item.value.createdBy,
              更新者: item.value.updatedBy
            })
            
            // 🔍 特别检查问题ID 611478980 出现在哪些字段
            const problemId = '611478980'
            const problemIdNum = 611478980
            const fieldsWithProblemId = []
            
            if (item.value.assignedTo === problemId || item.value.assignedTo === problemIdNum) {
              fieldsWithProblemId.push(`assignedTo (类型: ${item.value.assignedToType})`)
            }
            if (item.value.createdBy === problemId || item.value.createdBy === problemIdNum) {
              fieldsWithProblemId.push('createdBy')
            }
            if (item.value.updatedBy === problemId || item.value.updatedBy === problemIdNum) {
              fieldsWithProblemId.push('updatedBy')
            }
            if (item.value.closedBy === problemId || item.value.closedBy === problemIdNum) {
              fieldsWithProblemId.push('closedBy')
            }
            if (item.value.watchers && (item.value.watchers.includes(problemId) || item.value.watchers.includes(problemIdNum))) {
              fieldsWithProblemId.push('watchers')
            }
            if (item.value.watcherObjects && item.value.watcherObjects.some(w => w.id === problemId || w.id === problemIdNum)) {
              fieldsWithProblemId.push('watcherObjects')
            }
            
            if (fieldsWithProblemId.length > 0) {
              console.log(`🎯 问题ID ${problemId} 出现在以下字段:`, fieldsWithProblemId)
              console.log(`📝 assignedToType值:`, item.value.assignedToType)
              console.log(`📝 完整分配信息:`, {
                assignedTo: item.value.assignedTo,
                assignedToType: item.value.assignedToType,
                assignedToTypeOf: typeof item.value.assignedToType
              })
            } else {
              console.log(`ℹ️ 问题ID ${problemId} 未在Issue数据中找到`)
            }
            
            // 检查这些ID是否在缓存中
            Array.from(userIds).forEach(userId => {
              if (userId) {
                console.log(`🔍 检查用户ID ${userId} 在缓存中的情况:`)
                entityCache.debugFindId(userId, projectId)
              }
            })
          }
        } else {
          throw new Error(response.data.error || 'Failed to get issue details');
        }

        console.log('Loaded issue data:', {
          item: !!item.value,
          issueId: item.value?.id,
          displayId: item.value?.displayId,
          title: item.value?.title
        });

      } catch (error) {
        console.error('Failed to load issue detail:', error);
        alert(t('issueDetail.error.loadFailed') + ': ' + error.message);
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.push({
        path: '/issues/data',
        query: { projectId: route.query.projectId }
      });
    };

    // 辅助方法
    const getStatusText = (status) => {
      const statusMap = {
        'open': 'Open',
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'in_review': 'In Review',
        'closed': 'Closed',
        'resolved': 'Resolved',
        'rejected': 'Rejected',
        'draft': 'Draft'
      };
      return statusMap[status?.toLowerCase()] || status || 'Unknown';
    };

    const getStatusClass = (status) => {
      return `status-${status?.toLowerCase() || 'unknown'}`;
    };

    const getPriorityClass = (priority) => {
      return `priority-${priority?.toLowerCase() || 'normal'}`;
    };

    const getDueDateClass = (dueDate) => {
      if (!dueDate) return '';
      const due = new Date(dueDate);
      const now = new Date();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'overdue';
      if (diffDays <= 3) return 'due-soon';
      return '';
    };

    const getUserDisplayName = (userId) => {
      if (!userId) return 'Unknown User';
      
      // 使用用户缓存获取用户显示名称
      const displayName = userCache.getUserDisplayName(userId, route.query.projectId);
      if (displayName && displayName !== userId) {
        return displayName;
      }
      
      // 如果缓存中没有找到，使用简化显示
      if (userId.includes('@')) {
        return userId.split('@')[0];
      }
      return userId.length > 20 ? userId.substring(0, 20) + '...' : userId;
    };

    // 新增：根据分配类型获取显示名称
    const getAssignedToDisplayName = (assignedTo, assignedToType) => {
      if (!assignedTo) return 'Unassigned';
      
      console.log('🔍 IssueDetailView获取分配对象名称:', { assignedTo, assignedToType });
      
      // 使用实体缓存获取显示名称
      try {
        const projectId = route.query.projectId;
        console.log('🔍 IssueDetailView调用实体缓存:', { assignedTo, assignedToType, projectId });
        const displayName = entityCache.getAssignedToDisplayName(assignedTo, assignedToType, projectId);
        if (displayName && displayName !== assignedTo) {
          console.log('✅ IssueDetailView实体缓存成功:', { assignedTo, assignedToType, displayName, projectId });
          return displayName;
        } else {
          console.log('⚠️ IssueDetailView实体缓存返回原值:', { assignedTo, assignedToType, displayName, projectId });
        }
      } catch (error) {
        console.warn('⚠️ IssueDetailView实体缓存失败:', error);
      }
      
      // 回退方案：根据分配类型处理
      switch (assignedToType) {
        case 'user':
          return getUserDisplayName(assignedTo);
        case 'role':
          console.log('👔 IssueDetailView角色回退显示:', assignedTo);
          return `Role-${assignedTo}`;
        case 'company':
          console.log('🏢 IssueDetailView公司回退显示:', assignedTo);
          return `Company-${assignedTo}`;
        default:
          return getUserDisplayName(assignedTo);
      }
    };

    const getAssignedToDisplay = (item) => {
      if (item.assignedTo) {
        return getAssignedToDisplayName(item.assignedTo, item.assignedToType);
      }
      return 'Unassigned';
    };

    const getAssignedToTypeText = (type) => {
      const typeMap = {
        'user': 'User',
        'role': 'Role',
        'company': 'Company',
        '1': 'User',
        '2': 'Company',
        '3': 'Role'
      };
      return typeMap[type?.toLowerCase()] || type || 'Unknown';
    };

    // 获取根本原因名称
    const getRootCauseName = (rootCauseId) => {
      if (!rootCauseId) return 'Not Set';
      
      // 如果已经有缓存的名称，直接返回
      if (rootCauseName.value) return rootCauseName.value;
      
      // 异步获取名称
      const projectId = route.query.projectId;
      if (projectId) {
        rootCauseCache.getRootCauseName(rootCauseId, projectId).then(name => {
          rootCauseName.value = name;
        }).catch(error => {
          console.error('获取根本原因名称失败:', error);
          rootCauseName.value = rootCauseCache.formatRootCauseId(rootCauseId);
        });
      }
      
      // 返回格式化的ID作为临时显示
      return rootCauseCache.formatRootCauseId(rootCauseId);
    };

    // 获取议题类型显示名称
    const getIssueTypeDisplayName = (typeId, subtypeId) => {
      if (!typeId && !subtypeId) return 'Uncategorized';
      
      // 如果已经有缓存的名称，直接返回
      if (issueTypeName.value) return issueTypeName.value;
      
      // 异步获取名称
      const projectId = route.query.projectId;
      if (projectId) {
        issueTypeCache.getFullTypeName(typeId, subtypeId, projectId).then(name => {
          issueTypeName.value = name;
        }).catch(error => {
          console.error('获取议题类型名称失败:', error);
          issueTypeName.value = 'Uncategorized';
        });
      }
      
      // 返回格式化的ID作为临时显示
      if (typeId) {
        return issueTypeCache.formatTypeId(typeId);
      }
      return 'Uncategorized';
    };

    const getIssueTypeName = (typeId) => {
      // 保持向后兼容
      return getIssueTypeDisplayName(typeId, null);
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('zh-CN');
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    };

    // 新增的辅助方法
    const getDocumentTypeColor = (type) => {
      const typeMap = {
        'TwoDRasterPushpin': 'primary',
        'ThreeDPushpin': 'success',
        'TwoDVectorPushpin': 'warning',
        'default': 'info'
      };
      return typeMap[type] || typeMap.default;
    };

    const getDocumentTypeText = (type) => {
      const typeMap = {
        'TwoDRasterPushpin': '2D Raster Pushpin',
        'ThreeDPushpin': '3D Pushpin',
        'TwoDVectorPushpin': '2D Vector Pushpin',
        'default': 'Unknown Type'
      };
      return typeMap[type] || typeMap.default;
    };


    const getWatcherTypeText = (type) => {
      const typeMap = {
        'user': 'User',
        'role': 'Role',
        'company': 'Company',
        'default': 'Unknown'
      };
      return typeMap[type] || typeMap.default;
    };

    // 使用通用缓存方法获取观察者显示名称
    const getWatcherDisplayName = (watcherId, watcherType) => {
      return entityCache.getWatcherDisplayName(watcherId, watcherType, route.query.projectId);
    };

    // 获取去重后的观察者列表
    const getUniqueWatchers = (item) => {
      if (!item) return [];
      
      const uniqueWatchers = new Map();
      
      // 处理 watcherObjects（优先使用，因为有类型信息）
      if (item.watcherObjects && Array.isArray(item.watcherObjects)) {
        item.watcherObjects.forEach(watcher => {
          if (watcher.id) {
            uniqueWatchers.set(watcher.id, {
              id: watcher.id,
              type: watcher.type || 'user'
            });
          }
        });
      }
      
      // 处理 watchers（只添加不重复的）
      if (item.watchers && Array.isArray(item.watchers)) {
        item.watchers.forEach(watcherId => {
          if (watcherId && !uniqueWatchers.has(watcherId)) {
            uniqueWatchers.set(watcherId, {
              id: watcherId,
              type: 'user' // 默认类型
            });
          }
        });
      }
      
      return Array.from(uniqueWatchers.values());
    };

    const getActionText = (action) => {
      const actionMap = {
        'add_comment': 'Add Comment',
        'add_attachment': 'Add Attachment',
        'delete': 'Delete',
        'upsert_pin': 'Update Pin',
        'remove_attachment': 'Remove Attachment',
        'unlink_pin': 'Unlink Pin',
        'clear_assignee': 'Clear Assignee',
        'assign_all': 'Assign All',
        'edit': 'Edit',
        'view': 'View',
        'close': 'Close',
        'reopen': 'Reopen'
      };
      return actionMap[action] || action;
    };

    const getAttributeText = (attr) => {
      const attrMap = {
        'title': 'Title',
        'description': 'Description',
        'issueTypeId': 'Issue Type',
        'issueSubtypeId': 'Issue Subtype',
        'status': 'Status',
        'assignedTo': 'Assigned To',
        'assignedToType': 'Assignment Type',
        'dueDate': 'Due Date',
        'locationId': 'Location ID',
        'locationDetails': 'Location Details',
        'linkedDocuments': 'Linked Documents',
        'links': 'Links',
        'ownerId': 'Owner',
        'rootCauseId': 'Root Cause',
        'officialResponse': 'Official Response',
        'customAttributes': 'Custom Attributes',
        'snapshotUrn': 'Snapshot URN',
        'placements': 'Position Information',
        'startDate': 'Start Date',
        'published': 'Published Status',
        'watchers': 'Watchers',
        'watcherObjects': 'Watcher Objects',
        'gpsCoordinates': 'GPS Coordinates'
      };
      return attrMap[attr] || attr;
    };

    // 自定义属性相关方法
    const getCustomAttributeTypeText = (type) => {
      const typeMap = {
        'text': 'Text',
        'paragraph': 'Paragraph',
        'list': 'List',
        'number': 'Number',
        'date': 'Date',
        'boolean': 'Boolean',
        'url': 'URL',
        'email': 'Email'
      };
      return typeMap[type] || type || 'Unknown';
    };

    const getCustomAttributeTypeColor = (type) => {
      const colorMap = {
        'text': 'primary',
        'paragraph': 'success',
        'list': 'warning',
        'number': 'info',
        'date': 'danger',
        'boolean': 'success',
        'url': 'primary',
        'email': 'info'
      };
      return colorMap[type] || '';
    };

    const getCustomAttributeValueClass = (type) => {
      const classMap = {
        'text': 'value-text',
        'paragraph': 'value-paragraph',
        'list': 'value-list',
        'number': 'value-number',
        'date': 'value-date',
        'boolean': 'value-boolean',
        'url': 'value-url',
        'email': 'value-email'
      };
      return classMap[type] || 'value-default';
    };

    const formatCustomAttributeValue = (attr) => {
      if (!attr || attr.value === null || attr.value === undefined) {
        return 'Not set';
      }

      const value = attr.value;
      
      switch (attr.type) {
        case 'paragraph':
          // 段落类型：保持原样，可能包含换行
          return value;
        
        case 'list':
          // 列表类型：查找对应的选项值
          if (typeof value === 'string' && attributeDefinitions.value.length > 0) {
            // 查找对应的属性定义
            const attrDef = attributeDefinitions.value.find(def => def.id === attr.attributeDefinitionId);
            
            if (attrDef) {
              // 检查新的数据结构：metadata.list.options 或 arrayValues
              const options = attrDef.metadata?.list?.options || attrDef.arrayValues || [];
              
              if (options.length > 0) {
                // 在选项中查找匹配的选项
                const option = options.find(opt => opt.id === value || opt.value === value);
                
                if (option) {
                  // 返回选项的显示值
                  return option.value || option.name || option.displayName || value;
                }
              }
            }
            // 如果找不到对应选项，显示简化的ID
            if (value.includes('-')) {
              return `Option ${value.substring(0, 8)}...`;
            }
          }
          return value;
        
        case 'boolean':
          // 布尔类型
          if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
          }
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
              return 'Yes';
            }
            if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
              return 'No';
            }
          }
          return value;
        
        case 'date':
          // 日期类型
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString();
            }
          } catch (e) {
            // 如果解析失败，返回原值
          }
          return value;
        
        case 'number':
          // 数字类型
          if (typeof value === 'number') {
            return value.toLocaleString();
          }
          return value;
        
        case 'url':
        case 'email':
          // URL和邮箱类型：保持原样
          return value;
        
        case 'text':
        default:
          // 文本类型或其他：保持原样
          return value;
      }
    };

    // 事件处理
    const handleCommentsLoaded = (comments) => {
      console.log('Comments loaded:', comments);
      commentsData.value = comments;
      commentsCount.value = comments?.length || 0;
    };

    const handleAttachmentsLoaded = (attachments) => {
      console.log('Attachments loaded:', attachments);
      attachmentsData.value = attachments;
      attachmentsCount.value = attachments?.length || 0;
    };

    const onReferencesLoaded = (data) => {
      console.log('References loaded:', data);
      // 可以在这里更新参照计数或其他状态
      if (item.value && data.stats) {
        item.value.references_count = data.stats.total_references;
      }
    };

    const onReferencesError = (error) => {
      console.error('References error:', error);
    };

    // 快照相关方法
    const downloadSnapshot = async () => {
      if (!item.value?.snapshotUrn) {
        alert(t('issueDetail.error.snapshotUrnNotFound'));
        return;
      }

      snapshotDownloading.value = true;
      try {
        console.log('开始下载快照:', item.value.snapshotUrn);
        
        // 直接调用现有的URN下载端点（通过urn_download_simple.py）
        const response = await axios.get('/api/download-config/download-urn', {
          params: {
            urn: item.value.snapshotUrn,
            document_name: `issue-${item.value.displayId}-snapshot.jpg`
          }
        });

        console.log('下载响应:', response.data);

        if (response.data.success && response.data.download_url) {
          // 创建下载链接
          const link = document.createElement('a');
          link.href = response.data.download_url;
          link.download = response.data.document_name || `issue-${item.value.displayId}-snapshot.jpg`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          alert(t('issueDetail.messages.snapshotDownloadStarted'));
        } else {
          console.error('下载失败:', response.data);
          alert(t('issueDetail.error.downloadFailed') + ': ' + (response.data.error || t('common.unknownError')));
        }
      } catch (error) {
        console.error('下载快照失败:', error);
        alert(t('issueDetail.error.downloadFailed') + ': ' + error.message);
      } finally {
        snapshotDownloading.value = false;
      }
    };

    const previewSnapshot = async () => {
      if (!item.value?.snapshotUrn) {
        alert(t('issueDetail.error.snapshotUrnNotFound'));
        return;
      }

      try {
        console.log('开始预览快照:', item.value.snapshotUrn);
        
        // 获取快照下载链接用于预览
        const response = await axios.get('/api/download-config/download-urn', {
          params: {
            urn: item.value.snapshotUrn,
            document_name: `preview-snapshot`
          }
        });

        if (response.data.success && response.data.download_url) {
          // 在新窗口中打开快照
          window.open(response.data.download_url, '_blank', 'width=800,height=600');
        } else {
          alert(t('issueDetail.error.previewFailed') + ': ' + (response.data.error || t('common.unknownError')));
        }
      } catch (error) {
        console.error('预览快照失败:', error);
        alert(t('issueDetail.error.previewFailed') + ': ' + error.message);
      }
    };

    // 文档增强功能相关方法
    const getDocumentDisplayName = (doc) => {
      if (doc.enhanced_info && doc.enhanced_info.name && doc.enhanced_info.name !== 'Unknown Document') {
        return doc.enhanced_info.name
      }
      return doc.name || 'Unknown Document'
    }

    const getDocumentIconClass = (doc) => {
      if (!doc.enhanced_info) return 'document-icon-default'
      
      const fileType = doc.enhanced_info.file_type?.toLowerCase()
      const iconMap = {
        'pdf': 'document-icon-pdf',
        'dwg': 'document-icon-cad',
        'dxf': 'document-icon-cad',
        'rvt': 'document-icon-bim',
        'ifc': 'document-icon-bim',
        'nwd': 'document-icon-bim',
        'nwc': 'document-icon-bim',
        'jpg': 'document-icon-image',
        'jpeg': 'document-icon-image',
        'png': 'document-icon-image',
        'gif': 'document-icon-image',
        'doc': 'document-icon-word',
        'docx': 'document-icon-word',
        'xls': 'document-icon-excel',
        'xlsx': 'document-icon-excel'
      }
      return iconMap[fileType] || 'document-icon-default'
    }

    const getFileTypeTagType = (fileType) => {
      const typeMap = {
        'pdf': 'danger',
        'dwg': 'primary',
        'dxf': 'primary',
        'rvt': 'success',
        'ifc': 'success',
        'nwd': 'warning',
        'nwc': 'warning',
        'jpg': 'info',
        'jpeg': 'info',
        'png': 'info',
        'gif': 'info',
        'doc': 'primary',
        'docx': 'primary',
        'xls': 'success',
        'xlsx': 'success'
      }
      return typeMap[fileType?.toLowerCase()] || ''
    }

    const formatFileSize = (bytes) => {
      if (!bytes || bytes === 0) return '0 B'
      
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 获取文档位置信息
    const getDocumentLocationInfo = (doc) => {
      if (!doc.details?.viewable) return null
      
      const viewable = doc.details.viewable
      
      // 检查是否为3D视图
      if (viewable.is3D) {
        // 3D视图：显示坐标信息
        if (doc.details.position && Object.keys(doc.details.position).length > 0) {
          const pos = doc.details.position
          if (pos.x !== undefined && pos.y !== undefined && pos.z !== undefined) {
            return `3D View: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`
          } else {
            return '3D View - Incomplete coordinates'
          }
        } else {
          return '3D View - No specific coordinates'
        }
      } else {
        // 2D视图：显示页码或2D坐标
        let locationInfo = '2D View'
        
        // 检查页码信息
        if (viewable.name && viewable.viewableId) {
          // 如果name是类似"(2)"的格式，表示页码
          const pageMatch = viewable.name.match(/^\((\d+)\)$/)
          if (pageMatch) {
            locationInfo += ` - Page ${pageMatch[1]}`
          } else if (viewable.name !== viewable.viewableId) {
            locationInfo += ` - ${viewable.name}`
          }
        }
        
        // 检查2D坐标
        if (doc.details.position && Object.keys(doc.details.position).length > 0) {
          const pos = doc.details.position
          if (pos.x !== undefined && pos.y !== undefined) {
            locationInfo += ` (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`
          }
        }
        
        return locationInfo
      }
    }

    // 显示文档详情
    const showDocumentDetail = (document) => {
      selectedDocument.value = document;
      documentDetailVisible.value = true;
    };

    // 生命周期
    onMounted(() => {
      loadData();
    });

    return {
      // i18n
      t,
      
      item,
      commentsData,
      attachmentsData,
      loading,
      commentsLoading,
      attachmentsLoading,
      commentsCount,
      attachmentsCount,
      activeTab,
      snapshotDownloading,
      apiCallsInfo,
      
      // 折叠状态
      officialResponseCollapsed,
      snapshotInfoCollapsed,
      permissionsCollapsed,
      
      // 文档详情模态框
      documentDetailVisible,
      selectedDocument,
      
      route,
      loadData,
      goBack,
      handleCommentsLoaded,
      handleAttachmentsLoaded,
      onReferencesLoaded,
      onReferencesError,
      getStatusText,
      getStatusClass,
      getPriorityClass,
      getDueDateClass,
      getUserDisplayName,
      getAssignedToDisplayName,
      getAssignedToDisplay,
      getAssignedToTypeText,
      getIssueTypeName,
      getIssueTypeDisplayName,
      getRootCauseName,
      formatDate,
      formatDateTime,
      getDocumentTypeColor,
      getDocumentTypeText,
      getWatcherTypeText,
      getWatcherDisplayName,
      getUniqueWatchers,
      getActionText,
      getAttributeText,
      downloadSnapshot,
      previewSnapshot,
      showDocumentDetail,
      // 新增的文档增强方法
      getDocumentDisplayName,
      getDocumentIconClass,
      getFileTypeTagType,
      formatFileSize,
      getDocumentLocationInfo,
      // 自定义属性方法
      getCustomAttributeTypeText,
      getCustomAttributeTypeColor,
      getCustomAttributeValueClass,
      formatCustomAttributeValue,
      
      // Icons
      ArrowDown,
      View
    };
  }
};
</script>

<style scoped>
@import '../styles/common.css';

.issue-detail-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  min-height: 100vh;
  background: #f5f7fa;
}

.back-button {
  margin-bottom: 20px;
}

.loading-container,
.error-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.spinner {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small {
  width: 30px;
  height: 30px;
  margin: 0 auto 10px;
  border: 3px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 页面头部 */
.page-header-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f3f4f6;
}

.header-title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.title-icon {
  font-size: 32px;
}

.item-id-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
}

/* 状态摘要 */
.status-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-item .label {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}

.summary-item .value {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
}

.status-badge, .priority-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
}

.status-open { background: #dbeafe; color: #1e40af; }
.status-in_progress { background: #fef3c7; color: #92400e; }
.status-closed { background: #d1fae5; color: #065f46; }
.status-resolved { background: #d1fae5; color: #065f46; }
.status-rejected { background: #fee2e2; color: #991b1b; }

.priority-high, .priority-critical { background: #fee2e2; color: #991b1b; }
.priority-medium { background: #fef3c7; color: #92400e; }
.priority-low, .priority-normal { background: #dbeafe; color: #1e40af; }

.due-date.overdue { color: #dc2626; font-weight: 700; }
.due-date.due-soon { color: #f59e0b; font-weight: 700; }

.assignment-type {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 4px;
}

.publish-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
}

.publish-badge.published { background: #d1fae5; color: #065f46; }
.publish-badge.draft { background: #fef3c7; color: #92400e; }

.count-badge {
  background: #f3f4f6;
  color: #374151;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* 页签容器 */
.tabs-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tab-badge {
  margin-left: 6px;
  padding: 2px 8px;
  background: #f59e0b;
  color: white;
  border-radius: 10px;
  font-size: 12px;
}

.tab-content {
  padding: 20px 0;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.info-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
}

.info-section.full-width {
  grid-column: 1 / -1;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.info-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dates-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
}

.info-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  min-width: 120px;
}

.info-value {
  font-size: 13px;
  color: #1a1a1a;
  font-weight: 500;
  text-align: right;
  flex: 1;
}

.user-type-tag {
  font-size: 11px;
  color: #9ca3af;
  margin-left: 4px;
}

.description-box {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  line-height: 1.6;
  color: #374151;
}

/* 自定义属性值样式 */
.custom-attributes-rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.custom-attr-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.custom-attr-row:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.custom-attr-label {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.attr-name {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.attr-type-tag {
  font-size: 11px !important;
  padding: 2px 8px !important;
  height: auto !important;
  line-height: 1.2 !important;
}

.custom-attr-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 200px;
  gap: 8px;
}

.value-prefix {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.attr-value-text {
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  min-width: 100px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 不同类型的值样式 */
.value-text {
  color: #1f2937;
  background: #f8fafc;
  border-left: 3px solid #3b82f6;
}

.value-paragraph {
  color: #065f46;
  background: #f0fdf4;
  border-left: 3px solid #10b981;
  white-space: pre-wrap;
  max-width: 300px;
  text-align: left;
}

.value-list {
  color: #92400e;
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
}

.value-number {
  color: #1e40af;
  background: #dbeafe;
  border-left: 3px solid #3b82f6;
  font-family: 'Consolas', 'Monaco', monospace;
}

.value-date {
  color: #991b1b;
  background: #fee2e2;
  border-left: 3px solid #ef4444;
}

.value-boolean {
  color: #065f46;
  background: #d1fae5;
  border-left: 3px solid #10b981;
  font-weight: 600;
}

.value-url, .value-email {
  color: #1d4ed8;
  background: #dbeafe;
  border-left: 3px solid #3b82f6;
  text-decoration: underline;
  cursor: pointer;
}

.value-default {
  color: #374151;
  background: #f9fafb;
  border-left: 3px solid #9ca3af;
}

.info-label .el-tag {
  margin-left: 8px;
}

/* 自定义属性 */
.custom-attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.custom-attribute-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.custom-attribute-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.attribute-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.attribute-name {
  font-weight: 700;
  color: #1f2937;
  font-size: 16px;
  line-height: 1.4;
  flex: 1;
}

.attribute-value {
  margin-bottom: 12px;
}

.text-value {
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.paragraph-value {
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.list-value {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 6px;
  border-left: 3px solid #f59e0b;
}

.attribute-id {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  margin-top: 12px;
}

.id-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.attribute-definition-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
  color: #4b5563;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
  flex: 1;
}

/* 关联文档 */
.linked-documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.linked-document-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.document-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.document-icon {
  font-size: 24px;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

.document-details {
  flex: 1;
  min-width: 0;
}

.document-name {
  font-weight: 500;
  margin-bottom: 4px;
  word-break: break-word;
}

.document-urn {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 2px 4px;
  border-radius: 2px;
  margin-bottom: 4px;
  word-break: break-all;
}

.document-location {
  font-size: 12px;
  color: #495057;
}

/* JSON Viewer 样式 */
.json-viewers-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.json-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

/* Tab JSON Viewer 样式 */
.tab-json-viewer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
}

/* 新增样式 - 文档相关 */
/* 关联文档 - 单文档宽版布局 */
.single-document-container {
  width: 100%;
  margin-bottom: 16px;
}

.single-document-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.single-document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 文档主要信息区域 */
.document-main-info {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e5e7eb;
}

/* 左侧区域 */
.document-left-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.document-icon-large {
  font-size: 48px;
  flex-shrink: 0;
  transition: color 0.3s ease;
}

.document-basic-details {
  flex: 1;
  min-width: 0;
}

.document-name-large {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  word-break: break-word;
  line-height: 1.3;
}

.document-meta-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-tag,
.file-type-tag {
  font-weight: 600;
}

/* 右侧区域 */
.document-right-section {
  flex: 1;
  max-width: 400px;
}

.document-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 位置信息区域 */
.location-info-section {
  margin-bottom: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 8px;
  border-left: 4px solid #0ea5e9;
}

.location-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.location-icon {
  font-size: 16px;
  color: #0369a1;
}

.location-title {
  font-size: 13px;
  font-weight: 600;
  color: #0369a1;
}

.location-content {
  font-size: 14px;
  font-weight: 500;
  color: #1e40af;
  padding: 4px 0;
}

.mime-type-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.mime-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e5e7eb;
}

.document-icon {
  font-size: 28px;
  color: #3b82f6;
  transition: color 0.3s ease;
}

.document-icon-default { color: var(--el-color-info); }
.document-icon-pdf { color: #d32f2f; }
.document-icon-cad { color: #1976d2; }
.document-icon-bim { color: #388e3c; }
.document-icon-image { color: #f57c00; }
.document-icon-word { color: #1976d2; }
.document-icon-excel { color: #388e3c; }

.document-info-header {
  flex: 1;
}

.document-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-word;
}

.enhanced-tag {
  font-size: 10px;
}

.enhanced-info-section {
  margin-bottom: 12px;
  padding: 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-success);
}

.mime-type {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  background: var(--el-fill-color-light);
  padding: 2px 4px;
  border-radius: 3px;
}

.document-content {
  padding: 16px 20px;
}

.document-urn-section {
  margin-bottom: 16px;
}

.urn-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.document-urn {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #374151;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  word-break: break-all;
  display: block;
  line-height: 1.4;
}

.document-details-section {
  margin-bottom: 16px;
}

.viewable-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.viewable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.viewable-label {
  font-size: 13px;
  color: #0369a1;
  font-weight: 600;
}

.viewable-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.viewable-name {
  font-weight: 500;
  color: #1e40af;
  font-size: 14px;
}

.viewable-guid, .viewable-id {
  font-size: 11px;
  color: #64748b;
}

.viewable-guid code, .viewable-id code {
  background: #e0f2fe;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.position-info {
  background: #fefce8;
  border: 1px solid #fde047;
  border-radius: 8px;
  padding: 12px;
}

.position-label {
  font-size: 13px;
  color: #a16207;
  font-weight: 600;
  display: block;
  margin-bottom: 8px;
}

.position-data {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
  color: #374151;
  background: #fffbeb;
  padding: 8px;
  border-radius: 4px;
  margin: 0;
  overflow-x: auto;
}

.document-metadata {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.metadata-label {
  color: #6b7280;
  font-weight: 500;
}

.metadata-value {
  color: #374151;
}

/* 位置信息样式 */
.placements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.placement-card {
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.placement-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.placement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e5e7eb;
}

.placement-content {
  padding: 16px;
}

.placement-viewable {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.placement-urn {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lineage-urn {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
  color: #374151;
  background: #f9fafb;
  padding: 6px 8px;
  border-radius: 4px;
  word-break: break-all;
  line-height: 1.3;
}

/* 观察者样式 */
.watchers-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.watcher-objects-title, .watchers-title {
  font-size: 14px;
  color: #374151;
  font-weight: 600;
  margin-bottom: 8px;
}

.watcher-objects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.watcher-object-item {
  margin-bottom: 4px;
}

.watcher-type {
  font-size: 11px;
  color: #6b7280;
  margin-left: 4px;
}

.watchers-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 官方回复样式 */
.official-response-section {
  background: #fefce8;
  border: 1px solid #fde047;
  border-radius: 8px;
  padding: 16px;
}

.response-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.response-text {
  background: #fffbeb;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #f59e0b;
  line-height: 1.6;
  color: #374151;
}

.response-metadata {
  display: flex;
  gap: 24px;
  font-size: 12px;
}

.response-by, .response-at {
  display: flex;
  gap: 8px;
}

.response-by .label, .response-at .label {
  color: #a16207;
  font-weight: 600;
}

.response-by .value, .response-at .value {
  color: #374151;
}

.no-response {
  text-align: center;
  padding: 20px;
}

/* 权限信息样式 */
.permissions-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.permission-group-title {
  font-size: 14px;
  color: #374151;
  font-weight: 600;
  margin-bottom: 8px;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.attributes-tags {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

/* 快照信息样式 */
.snapshot-explanation {
  margin-bottom: 16px;
}

.snapshot-section {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.snapshot-urn {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.snapshot-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.snapshot-urn .label {
  font-size: 13px;
  color: #0369a1;
  font-weight: 600;
}

.urn-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #374151;
  background: #e0f2fe;
  padding: 8px 12px;
  border-radius: 6px;
  word-break: break-all;
  line-height: 1.4;
}

.snapshot-markups {
  display: flex;
  align-items: center;
  gap: 8px;
}

.snapshot-markups .label {
  font-size: 13px;
  color: #0369a1;
  font-weight: 600;
}

/* 折叠功能样式 */
.collapsible-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.collapsible-header {
  cursor: pointer;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.3s ease;
}

.collapsible-header:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
}

.collapsible-header .section-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  border: none;
  padding: 0;
}

.collapse-icon {
  transition: transform 0.3s ease;
  color: #6b7280;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.collapsible-content {
  padding: 20px;
  background: #f9fafb;
}

/* 属性部分样式 */
.attributes-subsection {
  margin-bottom: 20px;
}

.attributes-subsection:last-child {
  margin-bottom: 0;
}

.subsection-title {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #d1d5db;
}

.basic-attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.attribute-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.attr-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.attr-value {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

/* 观察者优化样式 */
.watchers-row {
  align-items: flex-start;
}

.watchers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  line-height: 1.5;
}

.watcher-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.watcher-name {
  font-weight: 500;
  color: #374151;
}

.watcher-type-text {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
}

/* 简化文档样式 */
.simplified-documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.simplified-document-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.simplified-document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.document-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e5e7eb;
}

.document-icon-section {
  flex-shrink: 0;
}

.document-icon {
  font-size: 24px;
  color: #3b82f6;
}

.document-icon-default { color: #6b7280; }
.document-icon-pdf { color: #dc2626; }
.document-icon-cad { color: #2563eb; }
.document-icon-bim { color: #16a34a; }
.document-icon-image { color: #ea580c; }
.document-icon-word { color: #2563eb; }
.document-icon-excel { color: #16a34a; }

.document-info {
  flex: 1;
  min-width: 0;
}

.document-name {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.document-actions {
  flex-shrink: 0;
}

.document-summary {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  background: #fafbfc;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
  word-break: break-word;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .summary-row {
    grid-template-columns: 1fr;
  }

  .dates-grid {
    grid-template-columns: 1fr;
  }

  .json-section {
    padding: 12px;
  }

  .custom-attributes-grid {
    grid-template-columns: 1fr;
  }

  .basic-attributes-grid {
    grid-template-columns: 1fr;
  }

  .custom-attribute-item {
    padding: 16px;
  }

  .attribute-name {
    font-size: 15px;
  }

  .custom-attr-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
  }

  .custom-attr-label {
    width: 100%;
  }

  .custom-attr-value {
    width: 100%;
    justify-content: flex-start;
    min-width: auto;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .value-prefix {
    font-size: 11px;
  }

  .attr-value-text {
    text-align: left;
    max-width: 100%;
  }

  .simplified-documents-grid {
    grid-template-columns: 1fr;
  }

  .document-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .document-summary {
    grid-template-columns: 1fr 1fr;
  }

  .response-metadata {
    flex-direction: column;
    gap: 8px;
  }

  .permission-tags {
    max-height: 150px;
    overflow-y: auto;
  }
}

@media (max-width: 640px) {
  .document-summary {
    grid-template-columns: 1fr;
  }
}
</style>
