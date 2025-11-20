<template>
  <div class="submittal-detail">
    <div class="detail-container">
      <!-- 头部 -->
      <div class="detail-header">
        <div class="header-left">
          <h2 class="detail-title">{{ t('submittal.detailView.title') }}</h2>
          <span class="item-id">{{ item.customIdentifierHumanReadable || item.identifier }}</span>
        </div>
        <button class="btn-close" @click="$emit('close')">
          <i class="icon">✕</i>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="detail-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="detail-loading">
          <div class="spinner"></div>
          <p>{{ t('submittal.detailView.loadingDetail') }}</p>
        </div>

        <div v-else class="detail-sections">
          <!-- basicInfo -->
          <section class="detail-section">
            <div class="section-header">
              <h3 class="section-title">
                <i class="icon">ℹ️</i>
                {{ t('submittal.sections.basicInfo') }}
              </h3>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">{{ t('submittal.fields.title') }}</div>
                  <div class="info-value">{{ item.title }}</div>
                </div>
                <div class="info-item" v-if="item.description">
                  <div class="info-label">{{ t('submittal.fields.description') }}</div>
                  <div class="info-value">{{ item.description }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">{{ t('submittal.fields.status') }}</div>
                  <div class="info-value">
                    <span :class="['status-badge', getStatusClass(item.statusId)]">
                      {{ getStatusText(item.statusId) }}
                    </span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">{{ t('submittal.fields.state') }}</div>
                  <div class="info-value">
                    <span :class="['state-badge', getStateClass(item.stateId)]">
                      {{ getStateText(item.stateId) }}
                    </span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">{{ t('submittal.fields.priority') }}</div>
                  <div class="info-value">
                    <span :class="['priority-badge', getPriorityClass(item.priority)]">
                      {{ item.priority || '-' }}
                    </span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">{{ t('submittal.fields.revision') }}</div>
                  <div class="info-value">
                    <span class="revision-badge">Rev {{ item.revision || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 规格信息 -->
          <section class="detail-section" v-if="item.specTitle">
            <div class="section-header">
              <h3 class="section-title">
                <i class="icon">📋</i>
                {{ t('submittal.sections.specInfo') }}
              </h3>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">{{ t('submittal.fields.specNumber') }}</div>
                  <div class="info-value">{{ item.specIdentifier }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">{{ t('submittal.fields.specTitle') }}</div>
                  <div class="info-value">{{ item.specTitle }}</div>
                </div>
                <div class="info-item" v-if="item.subsection">
                  <div class="info-label">{{ t('submittal.fields.subsection') }}</div>
                  <div class="info-value">{{ item.subsection }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- 日期信息 -->
          <section class="detail-section">
            <div class="section-header">
              <h3 class="section-title">
                <i class="icon">📅</i>
                {{ t('submittal.sections.keyDates') }}
              </h3>
            </div>
            <div class="section-content">
              <div class="timeline">
                <div class="timeline-item" v-if="item.dueDate">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-label">{{ t('submittal.fields.dueDate') }}</div>
                    <div class="timeline-value" :class="getDueDateClass(item.dueDate)">
                      {{ formatDate(item.dueDate) }}
                    </div>
                  </div>
                </div>
                <div class="timeline-item" v-if="item.requiredDate">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-label">{{ t('submittal.fields.requiredSubmissionDate') }}</div>
                    <div class="timeline-value">{{ formatDate(item.requiredDate) }}</div>
                  </div>
                </div>
                <div class="timeline-item" v-if="item.requiredApprovalDate">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-label">{{ t('submittal.fields.requiredApprovalDate') }}</div>
                    <div class="timeline-value">{{ formatDate(item.requiredApprovalDate) }}</div>
                  </div>
                </div>
                <div class="timeline-item" v-if="item.requiredOnJobDate">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-label">{{ t('submittal.fields.requiredOnSiteDate') }}</div>
                    <div class="timeline-value">{{ formatDate(item.requiredOnJobDate) }}</div>
                  </div>
                </div>
                <div class="timeline-item" v-if="item.publishedDate">
                  <div class="timeline-dot success"></div>
                  <div class="timeline-content">
                    <div class="timeline-label">{{ t('submittal.fields.publishDate') }}</div>
                    <div class="timeline-value">{{ formatDateTime(item.publishedDate) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 审核步骤 -->
          <section class="detail-section" v-if="fullDetails && fullDetails.steps && fullDetails.steps.length > 0">
            <div class="section-header">
              <h3 class="section-title">
                <i class="icon">🔄</i>
                {{ t('submittal.sections.reviewProcess') }}
              </h3>
            </div>
            <div class="section-content">
              <SubmittalSteps :steps="fullDetails.steps" />
            </div>
          </section>

          <!-- 附件 -->
          <section class="detail-section" v-if="fullDetails && fullDetails.attachments">
            <div class="section-header">
              <h3 class="section-title">
                <i class="icon">📎</i>
                {{ t('submittal.sections.attachments') }} {{ t('submittal.attachments.count', { count: fullDetails.attachments.length }) }}
              </h3>
            </div>
            <div class="section-content">
              <SubmittalAttachments 
                :attachments="fullDetails.attachments" 
                :project="project" />
            </div>
          </section>

          <!-- 响应信息 -->
          <section class="detail-section" v-if="item.responseComment">
            <div class="section-header">
              <h3 class="section-title">
                <i class="icon">💬</i>
                {{ t('submittal.fields.responseComment') }}
              </h3>
            </div>
            <div class="section-content">
              <div class="response-box">
                <div class="response-meta">
                  <span class="response-author">{{ item.respondedBy }}</span>
                  <span class="response-time">{{ formatDateTime(item.respondedAt) }}</span>
                </div>
                <div class="response-text">{{ item.responseComment }}</div>
              </div>
            </div>
          </section>

          <!-- 负责人信息 -->
          <section class="detail-section">
            <div class="section-header">
              <h3 class="section-title">
                <i class="icon">👥</i>
                {{ t('submittal.sections.assignees') }}
              </h3>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item" v-if="item.manager">
                  <div class="info-label">{{ t('submittal.fields.manager') }}</div>
                  <div class="info-value">
                    <span class="user-badge">{{ getUserDisplayName(item.manager) }}</span>
                    <span class="user-type">({{ getUserTypeText(item.managerType) }})</span>
                  </div>
                </div>
                <div class="info-item" v-if="item.subcontractor">
                  <div class="info-label">{{ t('submittal.fields.subcontractor') }}</div>
                  <div class="info-value">
                    <span class="user-badge">{{ getUserDisplayName(item.subcontractor) }}</span>
                    <span class="user-type">({{ getUserTypeText(item.subcontractorType) }})</span>
                  </div>
                </div>
                <div class="info-item" v-if="item.createdBy">
                  <div class="info-label">{{ t('submittal.fields.creator') }}</div>
                  <div class="info-value">{{ getUserDisplayName(item.createdBy) }}</div>
                </div>
                <div class="info-item" v-if="item.updatedBy">
                  <div class="info-label">{{ t('submittal.fields.lastUpdater') }}</div>
                  <div class="info-value">{{ getUserDisplayName(item.updatedBy) }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- 元数据 -->
          <section class="detail-section">
            <div class="section-header">
              <h3 class="section-title">
                <i class="icon">⏰</i>
                {{ t('submittal.sections.metadata') }}
              </h3>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">{{ t('submittal.fields.createdDate') }}</div>
                  <div class="info-value">{{ formatDateTime(item.createdAt) }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">{{ t('submittal.fields.lastUpdated') }}</div>
                  <div class="info-value">{{ formatDateTime(item.updatedAt) }}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="detail-footer">
        <button class="btn btn-secondary" @click="$emit('refresh')">
          <i class="icon">🔄</i>
          {{ t('submittal.actions.refresh') }}
        </button>
        <button class="btn btn-primary" @click="exportDetails">
          <i class="icon">⬇️</i>
          {{ t('submittal.actions.export') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import SubmittalSteps from './SubmittalSteps.vue';
import SubmittalAttachments from './SubmittalAttachments.vue';
import { formatDate, formatDateTime } from '../../utils/dateUtils.js';
import userCache from '../../utils/userCache.js';

export default {
  name: 'SubmittalDetail',
  components: {
    SubmittalSteps,
    SubmittalAttachments
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    fullDetails: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    project: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'refresh'],
  setup() {
    const { t } = useI18n()
    return { t }
  },
  methods: {
    getStatusText(statusId) {
      const statusMap = {
        '1': 'required',
        '2': 'open',
        '3': 'closed',
        '4': 'void',
        '5': 'empty',
        '6': 'draft'
      };
      const mappedStatus = statusMap[statusId] || 'draft';
      return this.t(`submittal.status.${mappedStatus}`);
    },
    getStatusClass(statusId) {
      const classMap = {
        '1': 'status-required',
        '2': 'status-open',
        '3': 'status-closed',
        '4': 'status-void',
        '5': 'status-empty',
        '6': 'status-draft'
      };
      return classMap[statusId] || '';
    },
    getStateText(stateId) {
      const stateKey = stateId || 'draft';
      return this.t(`submittal.state.${stateKey}`) || stateId;
    },
    getStateClass(stateId) {
      const classMap = {
        'sbc-1': 'state-waiting',
        'mgr-1': 'state-submitted',
        'rev': 'state-review',
        'mgr-2': 'state-reviewed',
        'sbc-2': 'state-closed',
        'void': 'state-void',
        'draft': 'state-draft'
      };
      return classMap[stateId] || '';
    },
    getPriorityClass(priority) {
      const classMap = {
        'High': 'priority-high',
        'Normal': 'priority-normal',
        'Low': 'priority-low'
      };
      return classMap[priority] || '';
    },
    getUserTypeText(userType) {
      const typeMap = {
        '1': 'user',
        '2': 'company',
        '3': 'role'
      };
      const mappedType = typeMap[userType] || 'user';
      return this.t(`submittal.userTypes.${mappedType}`);
    },
    getDueDateClass(dueDate) {
      if (!dueDate) return '';
      const due = new Date(dueDate);
      const now = new Date();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'overdue';
      if (diffDays <= 3) return 'due-soon';
      return '';
    },
    // 使用导入的时间格式化函数
    formatDate,
    formatDateTime,
    exportDetails() {
      // TODO: 实现导出功能
      console.log('Export details:', this.item);
    },
    getUserDisplayName(userId) {
      if (!userId) return this.t('common.unknown')
      
      // 使用用戶緩存獲取用戶顯示名稱
      const displayName = userCache.getUserDisplayName(userId, this.project?.id)
      if (displayName && displayName !== userId) {
        return displayName
      }
      
      // 如果緩存中沒有找到，使用簡化顯示
      if (userId.includes('@')) {
        return userId.split('@')[0]
      }
      return userId.length > 20 ? userId.substring(0, 20) + '...' : userId
    }
  }
};
</script>

<style scoped>
.submittal-detail {
  position: fixed;
  top: 0;
  right: 0;
  width: 600px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 头部 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 2px solid #f3f4f6;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.item-id {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.btn-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: #e5e7eb;
  transform: rotate(90deg);
}

.icon {
  font-size: 18px;
}

/* 内容区域 */
.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.detail-loading {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 3px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 章节 */
.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  background: #f9fafb;
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  padding: 16px 20px;
  background: white;
  border-bottom: 2px solid #f3f4f6;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-content {
  padding: 20px;
}

/* 信息网格 */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
}

/* 时间轴 */
.timeline {
  position: relative;
  padding-left: 32px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
  display: flex;
  align-items: start;
  gap: 12px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -28px;
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 3px solid #667eea;
  z-index: 1;
}

.timeline-dot.success {
  border-color: #10b981;
}

.timeline-content {
  flex: 1;
}

.timeline-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.timeline-value {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
}

.timeline-value.overdue {
  color: #dc2626;
  font-weight: 700;
}

.timeline-value.due-soon {
  color: #f59e0b;
  font-weight: 700;
}

/* 响应框 */
.response-box {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #667eea;
}

.response-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.response-author {
  font-weight: 600;
  color: #667eea;
}

.response-time {
  font-size: 12px;
  color: #9ca3af;
}

.response-text {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

/* 徽章样式 */
.status-badge,
.state-badge,
.priority-badge,
.revision-badge,
.user-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-required {
  background: #fef3c7;
  color: #92400e;
}

.status-open {
  background: #dbeafe;
  color: #1e40af;
}

.status-closed {
  background: #d1fae5;
  color: #065f46;
}

.status-void {
  background: #fee2e2;
  color: #991b1b;
}

.status-draft {
  background: #f3f4f6;
  color: #374151;
}

.state-badge {
  background: #e0e7ff;
  color: #3730a3;
}

.priority-high {
  background: #fee2e2;
  color: #991b1b;
}

.priority-normal {
  background: #dbeafe;
  color: #1e40af;
}

.priority-low {
  background: #f3f4f6;
  color: #6b7280;
}

.revision-badge {
  background: #f3f4f6;
  color: #374151;
}

.user-badge {
  background: #e0e7ff;
  color: #4338ca;
}

.user-type {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 4px;
}

/* 底部操作 */
.detail-footer {
  padding: 20px 24px;
  border-top: 2px solid #f3f4f6;
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .submittal-detail {
    width: 100%;
  }
}
</style>

