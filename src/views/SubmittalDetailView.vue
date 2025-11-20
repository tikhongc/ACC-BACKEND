<template>
  <div class="submittal-detail-view">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 返回按钮 -->
    <div class="back-button">
      <el-button @click="goBack" icon="ArrowLeft">{{ t('submittal.detailView.backToList') }}</el-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>{{ t('submittal.detailView.loading') }}</p>
    </div>

    <!-- 主内容 -->
    <div v-else-if="item" class="detail-container">
      <!-- 页面标题和摘要 -->
      <div class="page-header-section">
        <div class="header-title">
          <h1>
            <span class="title-icon">📋</span>
            {{ t('submittal.detailView.itemTitle', { title: item.title }) }}
          </h1>
          <div class="item-id-badge">
            {{ item.customIdentifierHumanReadable || item.identifier }}
          </div>
        </div>

        <!-- 核心状态摘要 -->
        <div class="status-summary">
          <div class="summary-row">
            <div class="summary-item">
              <span class="label">{{ t('submittal.fields.status') }}</span>
              <span :class="['status-badge', getStatusClass(item.statusId)]">
                {{ getStatusText(item.statusId) }}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">{{ t('submittal.fields.currentResponsible') }}</span>
              <span class="value">
                {{ getBallInCourtDisplay(item) }}
              </span>
            </div>
          </div>
          <div class="summary-row">
            <div class="summary-item">
              <span class="label">{{ t('submittal.fields.priority') }}:</span>
              <span :class="['priority-badge', getPriorityClass(item.priority)]">
                {{ item.priority || '-' }}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">{{ t('submittal.fields.dueDate') }}:</span>
              <span :class="['due-date', getDueDateClass(item.dueDate)]">
                {{ formatDate(item.dueDate) || '-' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 页签内容 -->
      <div class="tabs-container">
        <el-tabs v-model="activeTab" type="card">
          <!-- 页签1: 详细资讯 -->
          <el-tab-pane :label="t('submittal.detailView.tabs.details')" name="details">
            <div class="tab-content">
              <div class="info-grid">
                <!-- 基本资讯 -->
                <div class="info-section">
                  <h3 class="section-title">{{ t('submittal.sections.basicInfo') }}</h3>
                  <div class="info-rows">
                    <div class="info-row">
                      <span class="info-label">{{ t('submittal.fields.projectNumber') }}</span>
                      <span class="info-value">{{ item.customIdentifierHumanReadable || item.identifier }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">{{ t('submittal.fields.type') }}</span>
                      <span class="info-value">{{ getTypeName(item.typeId) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">{{ t('submittal.fields.specSection') }}</span>
                      <span class="info-value">{{ item.specIdentifier }} - {{ item.specTitle }}</span>
                    </div>
                    <div class="info-row" v-if="item.packageTitle">
                      <span class="info-label">{{ t('submittal.fields.submittalPackage') }}</span>
                      <span class="info-value">{{ item.packageTitle }}</span>
                    </div>
                    <div class="info-row" v-if="item.subsection">
                      <span class="info-label">{{ t('submittal.fields.subsection') }}</span>
                      <span class="info-value">{{ item.subsection }}</span>
                    </div>
                  </div>
                </div>

                <!-- 人员与角色 -->
                <div class="info-section">
                  <h3 class="section-title">{{ t('submittal.sections.assignees') }}</h3>
                  <div class="info-rows">
                    <div class="info-row">
                      <span class="info-label">{{ t('submittal.fields.manager') }}</span>
                      <span class="info-value">
                        {{ getSmartDisplayName(item.manager, item.managerType) }}
                        <span class="user-type-tag">({{ getUserTypeText(item.managerType) }})</span>
                      </span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">{{ t('submittal.fields.subcontractor') }}</span>
                      <span class="info-value">
                        {{ getSmartDisplayName(item.subcontractor, item.subcontractorType) }}
                        <span class="user-type-tag">({{ getUserTypeText(item.subcontractorType) }})</span>
                      </span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">{{ t('submittal.fields.creator') }}</span>
                      <span class="info-value">{{ getUserDisplayName(item.createdBy) }}</span>
                    </div>
                    <div class="info-row" v-if="item.watchers && item.watchers.length > 0">
                      <span class="info-label">{{ t('submittal.fields.watchers') }}</span>
                      <span class="info-value">
                        <span v-for="(watcher, index) in item.watchers" :key="index" class="watcher-tag">
                          {{ getSmartDisplayName(watcher.id, watcher.userType) }} ({{ getUserTypeText(watcher.userType) }})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 关键日期 -->
                <div class="info-section full-width">
                  <h3 class="section-title">{{ t('submittal.sections.keyDates') }}</h3>
                  <div class="info-rows dates-grid">
                    <div class="info-row">
                      <span class="info-label">{{ t('submittal.fields.createdDate') }}</span>
                      <span class="info-value">{{ formatDateTime(item.createdAt) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">{{ t('submittal.fields.lastUpdated') }}</span>
                      <span class="info-value">{{ formatDateTime(item.updatedAt) }}</span>
                    </div>
                    <div class="info-row" v-if="item.submitterDueDate">
                      <span class="info-label">{{ t('submittal.fields.expectedSubmissionDate') }}</span>
                      <span class="info-value">{{ formatDate(item.submitterDueDate) }}</span>
                    </div>
                    <div class="info-row" v-if="item.sentToReview">
                      <span class="info-label">{{ t('submittal.fields.actualSubmissionDate') }}</span>
                      <span class="info-value">{{ formatDateTime(item.sentToReview) }}</span>
                    </div>
                    <div class="info-row" v-if="item.receivedFromReview">
                      <span class="info-label">{{ t('submittal.fields.reviewCompletedDate') }}</span>
                      <span class="info-value">{{ formatDateTime(item.receivedFromReview) }}</span>
                    </div>
                    <div class="info-row" v-if="item.publishedDate">
                      <span class="info-label">{{ t('submittal.fields.finalPublishDate') }}</span>
                      <span class="info-value">{{ formatDateTime(item.publishedDate) }}</span>
                    </div>
                  </div>
                 </div>

                 <!-- 计划信息 -->
                 <div class="info-section full-width">
                   <h3 class="section-title">Planning</h3>
                   <div class="info-rows dates-grid">
                     <div class="info-row" v-if="item.leadTime !== null && item.leadTime !== undefined">
                       <span class="info-label">Lead Time</span>
                       <span class="info-value">
                         {{ item.leadTime }} days
                       </span>
                     </div>
                     <div class="info-row" v-if="item.requiredDate">
                       <span class="info-label">Required Date</span>
                       <span class="info-value">{{ formatDate(item.requiredDate) }}</span>
                     </div>
                     <div class="info-row" v-if="item.requiredApprovalDate">
                       <span class="info-label">Required Approval Date</span>
                       <span class="info-value">{{ formatDate(item.requiredApprovalDate) }}</span>
                     </div>
                     <div class="info-row" v-if="item.requiredOnJobDate">
                       <span class="info-label">Required On Job Date</span>
                       <span class="info-value">{{ formatDate(item.requiredOnJobDate) }}</span>
                     </div>
                   </div>
                 </div>

                <!-- 描述 -->
                <div class="info-section full-width" v-if="item.description">
                  <h3 class="section-title">{{ t('submittal.fields.description') }}</h3>
                  <div class="description-box">
                    {{ item.description }}
                  </div>
                </div>

                <!-- 响应信息 -->
                <div class="info-section full-width" v-if="item.responseComment || item.responseId">
                  <h3 class="section-title">Final Response</h3>
                  <div class="response-box">
                    <div class="response-meta">
                      <span class="response-author">{{ getUserDisplayName(item.respondedBy) }}</span>
                      <span class="response-time">{{ formatDateTime(item.respondedAt) }}</span>
                    </div>
                    <div class="response-type" v-if="item.responseId">
                      <strong>Response Type:</strong> {{ getResponseText(item.responseId) }}
                    </div>
                    <div class="response-content" v-if="item.responseComment">
                      <strong>Comment:</strong> {{ item.responseComment }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- JSON Viewer for Details Tab -->
              <div class="tab-json-viewer">
                <JsonViewer 
                  v-if="item"
                  :data="item"
                  :title="t('submittal.apiData.basicData')"
                  :description="t('submittal.apiData.basicDataDesc')"
                  :show-copy="true"
                  :show-download="true"
                  :collapsible="true"
                  :collapsed="true" />
              </div>
            </div>
          </el-tab-pane>

          <!-- 页签2: 附件 -->
          <el-tab-pane name="attachments">
            <template #label>
              {{ t('submittal.detailView.tabs.attachments') }} <span class="tab-badge" v-if="attachments.length">({{ attachments.length }})</span>
            </template>
            <div class="tab-content">
              <div v-if="attachmentsLoading" class="loading-state">
                <div class="spinner-small"></div>
                <p>{{ t('submittal.attachments.loading') }}</p>
              </div>
              <div v-else>
                <SubmittalAttachments 
                  :attachments="attachments" 
                  :project="{ id: route.query.projectId }" />
                
                <!-- JSON Viewer for Attachments Tab -->
                <div class="tab-json-viewer">
                  <JsonViewer 
                    :data="attachments"
                    :title="t('submittal.apiData.attachmentsData')"
                    :description="t('submittal.apiData.attachmentsDataDesc')"
                    :show-copy="true"
                    :show-download="true"
                    :collapsible="true"
                    :collapsed="true" />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 页签3: 工作流程 -->
          <el-tab-pane name="workflow">
            <template #label>
              🔄 {{ t('submittal.detailView.tabs.workflow') }} <span class="tab-badge" v-if="steps.length">({{ steps.length }} {{ t('steps') }})</span>
            </template>
            <div class="tab-content">
              <SubmittalWorkflow 
                :item="item"
                :steps="steps"
                :templates="templates"
                :metadata="metadata"
                :responses="responses"
                :loading="loading"
                :project-id="route.query.projectId" />
            </div>
          </el-tab-pane>

          <!-- 页签4: 参照 -->
          <el-tab-pane name="references">
            <template #label>
              🔗 {{ t('submittal.detailView.tabs.references') }} <span class="tab-badge" v-if="item && item.references_count && item.references_count > 0">({{ item.references_count }})</span>
            </template>
            <div class="tab-content">
              <EntityReferences 
                v-if="item && route.query.projectId"
                :entity="item" 
                :project="{ id: route.query.projectId }"
                entity-type="submittal"
                :auto-load="true"
                :show-debug-info="false"
                :show-json-viewer="false"
                :supported-reference-types="['document', 'file', 'drawing', 'photo', 'specification']"
                @references-loaded="onReferencesLoaded"
                @references-error="onReferencesError"
                @download-success="onDownloadSuccess"
                @download-error="onDownloadError" />
            </div>
          </el-tab-pane>

          <!-- 页签5: 活动日志 -->
          <el-tab-pane name="activity-log">
            <template #label>
              📋 {{ t('submittal.detailView.tabs.activityLog') }} <span class="tab-badge" v-if="activityEventCount">{{ t('submittal.activityLog.count', { count: activityEventCount }) }}</span>
            </template>
            <div class="tab-content">
              <SubmittalActivityLog
                :project-id="route.query.projectId"
                :item-id="route.query.itemId"
                :auto-load="true"
                @loaded="onActivityLogLoaded"
                @error="onActivityLogError"
              />
            </div>
          </el-tab-pane>

          <!-- 页签6: API 数据 -->
          <el-tab-pane name="api-data">
            <template #label>
              📋 {{ t('submittal.detailView.tabs.apiData') }}
            </template>
            <div class="tab-content">
              <div class="json-viewers-container">
                
                <!-- 基本项目数据 -->
                <div class="json-section">
                  <JsonViewer 
                    v-if="item"
                    :data="item"
                    :title="t('submittal.apiData.basicData')"
                    :description="t('submittal.apiData.basicDataDesc')"
                    :show-copy="true"
                    :show-download="true"
                    :collapsible="true"
                    :collapsed="false" />
                </div>

                <!-- 附件数据 -->
                <div v-if="attachments.length > 0" class="json-section">
                  <JsonViewer 
                    :data="attachments"
                    :title="t('submittal.apiData.attachmentsData')"
                    :description="t('submittal.apiData.attachmentsDataDesc')"
                    :show-copy="true"
                    :show-download="true"
                    :collapsible="true"
                    :collapsed="true" />
                </div>

                <!-- 审核历史数据 -->
                <div v-if="revisions.length > 0" class="json-section">
                  <JsonViewer 
                    :data="revisions"
                    :title="t('submittal.apiData.revisionsData')"
                    :description="t('submittal.apiData.revisionsDataDesc')"
                    :show-copy="true"
                    :show-download="true"
                    :collapsible="true"
                    :collapsed="true" />
                </div>

                <!-- API 调用信息 -->
                <div class="json-section">
                  <JsonViewer 
                    :data="apiCallsInfo"
                    :title="t('submittal.apiData.apiCallInfo')"
                    :description="t('submittal.apiData.apiCallInfoDesc')"
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
      <h3>{{ t('submittal.detailView.loadFailed') }}</h3>
      <p>{{ t('submittal.detailView.loadFailedDesc') }}</p>
      <el-button type="primary" @click="loadData">{{ t('submittal.actions.retry') }}</el-button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Breadcrumb from '../components/Breadcrumb.vue';
import SubmittalAttachments from '../components/submittal/SubmittalAttachments.vue';
import SubmittalWorkflow from '../components/submittal/SubmittalWorkflow.vue';
import SubmittalActivityLog from '../components/submittal/SubmittalActivityLog.vue';
import EntityReferences from '../components/EntityReferences.vue';
import JsonViewer from '../components/JsonViewer.vue';
import userCache from '../utils/userCache.js';
import entityCache from '../utils/entityCache.js';
import submittalMetadataCache from '../utils/submittalMetadataCache.js';
import axios from 'axios';

export default {
  name: 'SubmittalDetailView',
  components: {
    Breadcrumb,
    SubmittalAttachments,
    SubmittalWorkflow,
    SubmittalActivityLog,
    EntityReferences,
    JsonViewer
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();

    // 数据状态
    const item = ref(null);
    const attachments = ref([]);
    const revisions = ref([]);
    const steps = ref([]);
    const templates = ref([]);
    const metadata = ref({});
    const responses = ref([]);
    // UI 状态
    const loading = ref(false);
    const attachmentsLoading = ref(false);
    const revisionsLoading = ref(false);
    const activityEventCount = ref(0);
    const activeTab = ref('details');
    const activeRevisions = ref([]);
    const activeSteps = ref([]);

    // 计算属性
    const latestRevision = computed(() => {
      if (revisions.value.length === 0) return null;
      return Math.max(...revisions.value.map(r => r.revision));
    });

    // API 调用信息
    const apiCallsInfo = computed(() => {
      const projectId = route.query.projectId;
      const itemId = route.query.itemId;
      
      return {
        timestamp: new Date().toISOString(),
        projectId: projectId,
        itemId: itemId,
        endpoints: {
          item: {
            url: `/api/submittals/${projectId}/items/${itemId}`,
            status: item.value ? 'success' : 'pending',
            hasData: !!item.value,
            dataSize: item.value ? Object.keys(item.value).length : 0
          },
          attachments: {
            url: `/api/submittals/${projectId}/items/${itemId}/attachments`,
            status: 'success',
            hasData: attachments.value.length > 0,
            count: attachments.value.length
          },
          revisions: {
            url: `/api/submittals/${projectId}/items/${itemId}/revisions`,
            status: 'success',
            hasData: revisions.value.length > 0,
            count: revisions.value.length,
            note: revisions.value.length === 0 ? 'No revisions data found' : null
          },
          steps: {
            url: `/api/submittals/${projectId}/items/${itemId}/steps`,
            status: 'success',
            hasData: steps.value.length > 0,
            count: steps.value.length,
            note: steps.value.length === 0 ? 'No steps data found - this may indicate no workflow is configured' : null
          },
          templates: {
            url: `/api/submittals/${projectId}/templates`,
            status: 'success',
            hasData: templates.length > 0,
            count: templates.length,
            note: templates.length === 0 ? 'No templates configured - workflow steps require templates' : null
          }
        },
        debugInfo: {
          loadingStates: {
            main: loading.value,
            attachments: attachmentsLoading.value,
            revisions: revisionsLoading.value
          },
          possibleIssues: (revisions.value.length === 0 && steps.value.length === 0) ? [
            templates.length === 0 ? '❌ No review templates configured for this project' : '✅ Templates are available',
            item.value?.sentToReview ? '✅ Item has been sent to review' : '❌ Item may not have entered review process',
            'User may not have permission to view workflow data',
            'API endpoints may be returning empty results',
            'Workflow steps may only exist during active review phases'
          ].filter(Boolean) : []
        }
      };
    });

    // 方法
    const loadData = async () => {
      loading.value = true;
      try {
        const projectId = route.query.projectId;
        const itemId = route.query.itemId;

        if (!projectId || !itemId) {
          throw new Error(t('submittal.messages.missingParams'));
        }

        console.log('Loading submittal data:', { projectId, itemId });

        // 并发加载数据
        const [itemResponse, attachmentsResponse, revisionsResponse, stepsResponse, templatesResponse, metadataResponse, responsesResponse] = await Promise.all([
          axios.get(`/api/submittals/${projectId}/items/${itemId}`),
          axios.get(`/api/submittals/${projectId}/items/${itemId}/attachments`).catch(error => {
            console.warn('Failed to load attachments:', error);
            return { data: { results: [] } };
          }),
          axios.get(`/api/submittals/${projectId}/items/${itemId}/revisions`).catch(error => {
            console.warn('Failed to load revisions:', error);
            console.warn('Revisions API error details:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              url: `/api/submittals/${projectId}/items/${itemId}/revisions`
            });
            return { data: { results: [] } };
          }),
          axios.get(`/api/submittals/${projectId}/items/${itemId}/steps`).catch(error => {
            console.warn('Failed to load steps:', error);
            console.warn('Steps API error details:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              url: `/api/submittals/${projectId}/items/${itemId}/steps`
            });
            return { data: { results: [] } };
          }),
          axios.get(`/api/submittals/${projectId}/templates`).catch(error => {
            console.warn('Failed to load templates:', error);
            console.warn('Templates API error details:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              url: `/api/submittals/${projectId}/templates`
            });
            return { data: { results: [] } };
          }),
          axios.get(`/api/submittals/${projectId}/metadata`).catch(error => {
            console.warn('Failed to load metadata:', error);
            return { data: {} };
          }),
          axios.get(`/api/submittals/${projectId}/responses`).catch(error => {
            console.warn('Failed to load responses:', error);
            return { data: { results: [] } };
          })
        ]);

        item.value = itemResponse.data;
        attachments.value = attachmentsResponse.data.results || [];
        revisions.value = revisionsResponse.data.results || [];
        steps.value = stepsResponse.data.results || [];
        templates.value = templatesResponse.data.results || [];
        metadata.value = metadataResponse.data || {};
        responses.value = responsesResponse.data.results || [];

        console.log('Loaded data:', {
          item: !!item.value,
          attachmentsCount: attachments.value.length,
          revisionsCount: revisions.value.length,
          stepsCount: steps.value.length,
          templatesCount: templates.value.length,
          itemStatus: item.value?.statusId,
          itemState: item.value?.stateId
        });

        // 如果没有工作流数据，输出调试信息
        if (revisions.value.length === 0 && steps.value.length === 0) {
          console.warn('No workflow data found (neither revisions nor steps). Analysis:');
          console.warn('- Templates available:', templates.value.length);
          console.warn('- Item status:', item.value?.statusId, 'state:', item.value?.stateId);
          console.warn('- Has workflow timestamps:', {
            sentToReview: !!item.value?.sentToReview,
            receivedFromReview: !!item.value?.receivedFromReview,
            publishedDate: !!item.value?.publishedDate
          });
          
          if (templates.value.length === 0) {
            console.warn('❌ No templates configured for this project - this may explain why no steps data is available');
          } else {
            console.log('✅ Templates are available:', templates.value.map(t => ({ id: t.id, name: t.name, stepsCount: t.steps?.length || 0 })));
          }
        } else if (steps.value.length > 0) {
          console.log('Found steps data:', steps.value);
        }

        // 默认展开最新版本
        if (revisions.value.length > 0) {
          activeRevisions.value = [latestRevision.value];
        }
      } catch (error) {
        console.error('Failed to load submittal detail:', error);
        alert(t('submittal.messages.loadFailed', { error: error.message }));
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.push({
        path: '/submittals/data',
        query: { projectId: route.query.projectId }
      });
    };

    // 辅助方法
    const getStatusText = (statusId) => {
      const map = { '1': 'Required', '2': 'Open', '3': 'Closed', '4': 'Void', '5': 'Empty', '6': 'Draft' };
      return map[statusId] || statusId;
    };

    const getStatusClass = (statusId) => {
      return `status-${statusId}`;
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

    const getUserTypeText = (type) => {
      const typeMap = { '1': 'user', '2': 'company', '3': 'role' };
      const mappedType = typeMap[type] || 'user';
      return t(`submittal.userTypes.${mappedType}`);
    };

    const getUserDisplayName = (userId) => {
      if (!userId) return t('common.unknown');
      
      const projectId = route.query.projectId;
      
      // 使用用户缓存获取用户显示名称
      const displayName = userCache.getUserDisplayName(userId, projectId);
      if (displayName && displayName !== userId) {
        return displayName;
      }
      
      // 如果缓存中没有找到，使用简化显示
      if (userId.includes('@')) {
        return userId.split('@')[0];
      }
      return userId.length > 20 ? userId.substring(0, 20) + '...' : userId;
    };

    // 智能显示名称获取（支持用户、角色、公司）
    const getSmartDisplayName = (id, type) => {
      if (!id) return t('common.unknown');
      
      const projectId = route.query.projectId;
      
      switch(type) {
        case '1': // 用户
          return entityCache.getUserDisplayName(id, projectId) || id;
        case '2': // 公司
          return entityCache.getCompanyDisplayName(id, projectId) || id;
        case '3': // 角色
          return entityCache.getRoleDisplayName(id, projectId) || id;
        default:
          // 自动检测类型
          return entityCache.getEntityDisplayName(id, 'auto', projectId) || id;
      }
    };

    const getBallInCourtDisplay = (item) => {
      if (item.ballInCourtUsers && item.ballInCourtUsers.length > 0) {
        return item.ballInCourtUsers.map(userId => getUserDisplayName(userId)).join(', ');
      }
      return '-';
    };

    const getTypeName = (typeId) => {
      if (!typeId) return '-';
      
      const projectId = route.query.projectId;
      if (!projectId) {
        return typeId.substring(0, 8) + '...';
      }
      
      // 使用 metadata 缓存获取类型名称
      const typeName = submittalMetadataCache.getItemTypeDisplayName(typeId, projectId);
      return typeName !== typeId ? typeName : (typeId.substring(0, 8) + '...');
    };

    const getResponseText = (responseId) => {
      if (!responseId) return '-';
      
      const projectId = route.query.projectId;
      if (!projectId) {
        return responseId.substring(0, 8) + '...';
      }
      
      // 使用 metadata 缓存获取响应文本
      const responseName = submittalMetadataCache.getResponseDisplayName(responseId, projectId);
      return responseName !== responseId ? responseName : (responseId.substring(0, 8) + '...');
    };

    const getTaskStatusClass = (status) => {
      return `task-status-${status}`;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('zh-CN');
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    };

    const getStepStatusText = (status) => {
      return t(`submittal.reviewProcess.stepStatus.${status}`) || status;
    };

    const getStepStatusType = (status) => {
      const map = {
        'not-started': 'info',
        'in-progress': 'warning',
        'completed': 'success'
      };
      return map[status] || 'info';
    };

    const getTaskStatusText = (status) => {
      return t(`submittal.reviewProcess.taskStatus.${status}`) || status;
    };

    const getTaskStatusType = (status) => {
      const map = {
        'not-started': 'info',
        'in-progress': 'warning',
        'completed': 'success'
      };
      return map[status] || 'info';
    };


    // 生命周期
    onMounted(() => {
      loadData();
      
      // 预加载metadata
      const projectId = route.query.projectId;
      if (projectId) {
        submittalMetadataCache.getProjectMetadata(projectId).catch(error => {
          console.warn('Failed to preload submittal metadata:', error);
        });
      }
    });

    // 活动日志事件处理
    const onActivityLogLoaded = (data) => {
      console.log('Activity log loaded:', data);
      activityEventCount.value = data.count || 0;
    };

    const onActivityLogError = (error) => {
      console.error('Activity log error:', error);
      activityEventCount.value = 0;
    };

    // 参照事件处理
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

    const onDownloadSuccess = (data) => {
      console.log('Reference download success:', data);
    };

    const onDownloadError = (data) => {
      console.error('Reference download error:', data);
    };

    return {
      t,
      item,
      attachments,
      revisions,
      steps,
      templates,
      metadata,
      responses,
      loading,
      attachmentsLoading,
      revisionsLoading,
      activeTab,
      activeRevisions,
      activeSteps,
      activityEventCount,
      latestRevision,
      apiCallsInfo,
      route,
      loadData,
      goBack,
      onActivityLogLoaded,
      onActivityLogError,
      onReferencesLoaded,
      onReferencesError,
      onDownloadSuccess,
      onDownloadError,
      getStatusText,
      getStatusClass,
      getPriorityClass,
      getDueDateClass,
      getUserTypeText,
      getUserDisplayName,
      getSmartDisplayName,
      getBallInCourtDisplay,
      getTypeName,
      getResponseText,
      getTaskStatusClass,
      formatDate,
      formatDateTime,
      getStepStatusText,
      getStepStatusType,
      getTaskStatusText,
      getTaskStatusType
    };
  }
};
</script>

<style scoped>
@import '../styles/common.css';

.submittal-detail-view {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.status-1 { background: #fef3c7; color: #92400e; }
.status-2 { background: #dbeafe; color: #1e40af; }
.status-3 { background: #d1fae5; color: #065f46; }
.status-4 { background: #fee2e2; color: #991b1b; }
.status-6 { background: #f3f4f6; color: #374151; }

.priority-high { background: #fee2e2; color: #991b1b; }
.priority-normal { background: #dbeafe; color: #1e40af; }
.priority-low { background: #f3f4f6; color: #6b7280; }

.due-date.overdue { color: #dc2626; font-weight: 700; }
.due-date.due-soon { color: #f59e0b; font-weight: 700; }

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
  background: #667eea;
  color: white;
  border-radius: 10px;
  font-size: 12px;
}

.tab-content {
  padding: 20px 0;
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

.watcher-tag {
  display: inline-block;
  margin: 2px;
  padding: 4px 8px;
  background: #e0e7ff;
  border-radius: 4px;
  font-size: 12px;
}

.description-box {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  line-height: 1.6;
  color: #374151;
}

.response-box {
  background: white;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #667eea;
  border-radius: 6px;
  padding: 16px;
}

.response-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.response-author {
  font-weight: 700;
  color: #667eea;
}

.response-time {
  font-size: 12px;
  color: #9ca3af;
}

.response-content {
  line-height: 1.6;
  color: #374151;
}

.response-type {
  margin: 8px 0;
  padding: 8px 12px;
  background: #f0f9ff;
  border-left: 3px solid #0ea5e9;
  border-radius: 4px;
  font-size: 13px;
  color: #0c4a6e;
}

/* 审核历史 */
.revision-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
}

.revision-number {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.latest-badge {
  margin-left: 8px;
  padding: 2px 8px;
  background: #10b981;
  color: white;
  border-radius: 4px;
  font-size: 11px;
}

.response-indicator {
  font-size: 13px;
  color: #6b7280;
}

.revision-content {
  padding: 16px 0;
}

.review-step {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.step-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.step-info {
  font-size: 12px;
  color: #6b7280;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-assignee {
  font-size: 13px;
  font-weight: 600;
}

.required-tag {
  margin-left: 6px;
  padding: 2px 6px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  font-size: 11px;
}

.task-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.task-response {
  margin: 8px 0;
  padding: 8px;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
}

.task-timeline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #6b7280;
  margin-top: 8px;
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

.json-viewers-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.debug-info {
  margin-top: 16px;
}

.debug-info ul {
  margin: 12px 0;
  padding-left: 20px;
}

.debug-info li {
  margin: 6px 0;
  line-height: 1.5;
}

.debug-info code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
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
}

/* Steps 容器样式 */
.steps-container {
  margin: 24px 0;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.steps-container h4 {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 16px;
  font-weight: 600;
}

/* Step 头部样式覆盖 */
.steps-container .step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.steps-container .step-number {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #495057;
}

.step-due-date {
  font-size: 12px;
  color: #6c757d;
}

/* Step 内容样式覆盖 */
.steps-container .step-content {
  padding: 16px 0;
}

.steps-container .step-info {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #ffffff;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.steps-container .step-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #495057;
}

/* Tasks 列表样式覆盖 */
.steps-container .tasks-list {
  margin-top: 16px;
  display: block;
}

.steps-container .tasks-list h5 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
}

.steps-container .task-item {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #ffffff;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  border-left: 4px solid #007bff;
}

.steps-container .task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 0;
  border-bottom: none;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #495057;
}

.user-type-tag {
  font-size: 12px;
  color: #6c757d;
  font-weight: normal;
}

.required-tag {
  background-color: #dc3545;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
}

.task-response {
  margin: 8px 0;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #28a745;
  font-size: 13px;
  color: #495057;
}

.task-timeline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6c757d;
  margin-top: 8px;
}

.task-timeline span {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>

