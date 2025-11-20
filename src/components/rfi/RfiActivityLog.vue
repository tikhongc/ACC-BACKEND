<template>
  <div class="rfi-activity-log">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('rfi.activityLog.loading') || 'Loading activity log...' }}</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>{{ t('rfi.detailView.loadFailed') || 'Failed to Load Activity Log' }}</h3>
      <p>{{ error }}</p>
      <el-button type="primary" @click="loadActivityLog">{{ t('rfi.actions.retry') || 'Retry' }}</el-button>
    </div>

    <!-- 活动日志内容 -->
    <div v-else class="activity-log-container">
      <!-- 操作按钮区域 -->
      <div class="action-buttons">
        <el-button 
          type="primary" 
          :icon="loading ? 'Loading' : 'Refresh'"
          :loading="loading"
          @click="loadActivityLog"
          size="default">
          {{ loading ? 'Loading...' : 'Refresh Activity Log' }}
        </el-button>
        <el-button 
          type="info" 
          icon="View"
          @click="toggleDebugSection"
          size="default">
          {{ showDebugSection ? 'Hide' : 'Show' }} API Data
        </el-button>
      </div>

      <!-- 活动统计摘要 -->
      <div v-if="summary" class="activity-summary">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-value">{{ summary.total_events || 0 }}</div>
            <div class="card-label">Total Events</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ summary.unique_users || 0 }}</div>
            <div class="card-label">Participants</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ summary.has_comments ? 'Yes' : 'No' }}</div>
            <div class="card-label">Has Comments</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ summary.has_attachments ? 'Yes' : 'No' }}</div>
            <div class="card-label">Has Attachments</div>
          </div>
          <div v-if="workflowConfig" class="summary-card">
            <div class="card-value">{{ getWorkflowTypeDisplayName(workflowConfig.workflowType) }}</div>
            <div class="card-label">Workflow Type</div>
          </div>
        </div>
        
        <div v-if="summary.first_activity && summary.last_activity" class="timeline-info">
          <div class="timeline-item">
            <span class="timeline-label">First Activity:</span>
            <span class="timeline-value">{{ formatDateTime(summary.first_activity) }}</span>
          </div>
          <div class="timeline-item">
            <span class="timeline-label">Latest Activity:</span>
            <span class="timeline-value">{{ formatDateTime(summary.last_activity) }}</span>
          </div>
        </div>
      </div>

      <!-- 活动时间线 -->
      <div class="activity-timeline">
        <div v-if="activities.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No Activity Records</h3>
          <div v-if="rawData && rawData.test_summary && rawData.test_summary.has_errors">
            <p>API call encountered error, unable to retrieve activity data</p>
            <div class="error-details">
              <p><strong>Error Statistics:</strong> {{ rawData.test_summary.error_count }} errors</p>
              <p><strong>Success Rate:</strong> {{ rawData.test_summary.success_rate }}</p>
              <el-button size="small" type="primary" @click="loadActivityLog">Reload</el-button>
            </div>
          </div>
          <div v-else-if="rawData">
            <p>API call successful, but no activity data found</p>
            <div class="info-details">
              <p><strong>Data Structure:</strong> Please check the raw API data above for details</p>
              <p><strong>Tip:</strong> Data may be in workflow_log or formatted_display fields</p>
              <el-button size="small" type="primary" @click="loadActivityLog">Reload</el-button>
            </div>
          </div>
          <p v-else>This RFI has no activity history yet</p>
        </div>

        <div v-else class="timeline-list">
          <div 
            v-for="(activity, index) in activities" 
            :key="index"
            class="timeline-item"
            :class="getActivityTypeClass(activity.event_type)"
          >
            <div class="timeline-marker">
              <div class="marker-icon">{{ getActivityIcon(activity.event_type) }}</div>
            </div>
            
            <div class="timeline-content">
              <div class="activity-header">
                <div class="activity-description">{{ activity.description }}</div>
                <div class="activity-time">{{ formatDateTime(activity.timestamp) }}</div>
              </div>
              
              <div class="activity-meta">
                <span class="activity-user">
                  <i class="user-icon">👤</i>
                  {{ getUserDisplayName(activity.user_id) || 'System' }}
                </span>
                <span class="activity-type">{{ getActivityTypeText(activity.event_type) }}</span>
              </div>

              <!-- 活动详细信息 -->
              <div v-if="activity.details" class="activity-details">
                <!-- 评论内容 -->
                <div v-if="activity.details.comment" class="detail-item comment">
                  <div class="detail-label">Comment:</div>
                  <div class="detail-value comment-text">{{ activity.details.comment }}</div>
                </div>
                
                <!-- 文件信息 -->
                <div v-if="activity.details.filename" class="detail-item file">
                  <div class="detail-label">File:</div>
                  <div class="detail-value file-name">
                    <i class="file-icon">📎</i>
                    {{ activity.details.filename }}
                    <span v-if="activity.details.is_uploaded" class="upload-status uploaded">Uploaded</span>
                    <span v-else class="upload-status pending">Pending</span>
                  </div>
                </div>
                
                <!-- 状态变更信息 -->
                <div v-if="activity.details.from_status || activity.details.to_status" class="detail-item status-change">
                  <div class="detail-label">Status Change:</div>
                  <div class="detail-value">
                    <span v-if="activity.details.from_status" class="status-from">{{ getStatusDisplayText(activity.details.from_status) }}</span>
                    <span v-if="activity.details.from_status && activity.details.to_status" class="status-arrow">→</span>
                    <span v-if="activity.details.to_status" class="status-to">{{ getStatusDisplayText(activity.details.to_status) }}</span>
                  </div>
                </div>

                <!-- 响应信息 -->
                <div v-if="activity.details.response_text" class="detail-item response">
                  <div class="detail-label">Response:</div>
                  <div class="detail-value response-text">{{ activity.details.response_text }}</div>
                </div>

                <!-- 分配对象信息 -->
                <div v-if="activity.details.assigned_to && activity.details.assigned_to_type" class="detail-item assigned">
                  <div class="detail-label">Assigned to:</div>
                  <div class="detail-value assigned-to">
                    <span class="assigned-name">{{ getAssignedToDisplayName(activity.details.assigned_to, activity.details.assigned_to_type) }}</span>
                    <span class="assigned-type">({{ activity.details.assigned_to_type }})</span>
                    <span class="assigned-id">{{ activity.details.assigned_to }}</span>
                  </div>
                </div>

                <!-- 优先级变更 -->
                <div v-if="activity.details.priority" class="detail-item priority">
                  <div class="detail-label">Priority:</div>
                  <div class="detail-value">
                    <span :class="['priority-badge', getPriorityClass(activity.details.priority)]">
                      {{ activity.details.priority }}
                    </span>
                  </div>
                </div>

                <!-- 截止日期 -->
                <div v-if="activity.details.due_date" class="detail-item due-date">
                  <div class="detail-label">Due Date:</div>
                  <div class="detail-value">{{ formatDate(activity.details.due_date) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 调试信息和原始数据 -->
      <div v-if="rawData && showDebugSection" class="debug-section">
        <JsonViewer 
          :data="rawData" 
          title="🔍 Raw RFI Activity API Data"
          description="Complete API response data including workflow logs, activities, and metadata"
          :show-copy="true"
          :show-download="true"
          :collapsible="true"
          :collapsed="false"
          :expand-depth="2" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import userCache from '../../utils/userCache.js';
import entityCache from '../../utils/entityCache.js';
import JsonViewer from '../JsonViewer.vue';

export default {
  name: 'RfiActivityLog',
  components: {
    JsonViewer
  },
  props: {
    projectId: {
      type: String,
      required: true
    },
    itemId: {
      type: String,
      required: true
    },
    // 是否自动加载
    autoLoad: {
      type: Boolean,
      default: true
    }
  },
  emits: ['loaded', 'error'],
  setup(props, { emit }) {
    // i18n setup
    const { t } = useI18n();
    
    // 数据状态
    const activities = ref([]);
    const summary = ref(null);
    const rawData = ref(null);
    const workflowConfig = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const showDebugSection = ref(false);

    // 计算属性
    const eventCount = computed(() => activities.value.length);

    // RFI 活动类型图标映射 - 使用简单的几何形状和符号
    const activityIcons = {
      rfi_created: '●',
      rfi_submitted: '↑',
      rfi_opened: '▶',
      rfi_answered: '✓',
      rfi_closed: '◉',
      rfi_voided: '✕',
      status_changed: '◆',
      comment_added: '◑',
      attachment_added: '▲',
      response_submitted: '■',
      assignment_changed: '◇',
      priority_changed: '◐',
      due_date_changed: '○',
      workflow_advanced: '→',
      review_requested: '◎',
      review_completed: '✓',
      revision_requested: '↻',
      approval_granted: '✓',
      rejection_issued: '✕'
    };

    // RFI 活动类型文本映射
    const activityTypeTexts = {
      rfi_created: 'RFI Created',
      rfi_submitted: 'RFI Submitted',
      rfi_opened: 'RFI Opened',
      rfi_answered: 'RFI Answered',
      rfi_closed: 'RFI Closed',
      rfi_voided: 'RFI Voided',
      status_changed: 'Status Changed',
      comment_added: 'Comment Added',
      attachment_added: 'Attachment Added',
      response_submitted: 'Response Submitted',
      assignment_changed: 'Assignment Changed',
      priority_changed: 'Priority Changed',
      due_date_changed: 'Due Date Changed',
      workflow_advanced: 'Workflow Advanced',
      review_requested: 'Review Requested',
      review_completed: 'Review Completed',
      revision_requested: 'Revision Requested',
      approval_granted: 'Approval Granted',
      rejection_issued: 'Rejection Issued'
    };

    // 从 RFI API 数据增强活动历史
    const enhanceActivitiesFromApiData = (baseActivities, apiData) => {
      const allActivities = [...baseActivities];
      
      try {
        // 从 RFI basicInfo中提取活动
        if (apiData.rfi) {
          const rfi = apiData.rfi;
          
          // RFI 创建活动
          if (rfi.created_at) {
            allActivities.push({
              description: `RFI created: ${rfi.title || rfi.custom_identifier || 'Untitled'}`,
              details: {
                status: rfi.status,
                priority: rfi.priority,
                workflow_type: rfi.workflow_type
              },
              event_type: 'rfi_created',
              timestamp: rfi.created_at,
              user_id: rfi.created_by
            });
          }

          // RFI 响应活动
          if (rfi.responded_at && rfi.official_response) {
            allActivities.push({
              description: `Official response submitted`,
              details: {
                response_text: rfi.official_response,
                status: rfi.status
              },
              event_type: 'response_submitted',
              timestamp: rfi.responded_at,
              user_id: rfi.responded_by
            });
          }

          // RFI 关闭活动
          if (rfi.closed_at) {
            allActivities.push({
              description: `RFI closed`,
              details: {
                status: 'closed'
              },
              event_type: 'rfi_closed',
              timestamp: rfi.closed_at,
              user_id: rfi.closed_by
            });
          }
        }

        // 从评论数据中提取活动
        if (apiData.comments && Array.isArray(apiData.comments)) {
          apiData.comments.forEach(comment => {
            if (comment.created_at) {
              // 🔧 修复：正确处理 comment.author 对象
              let authorId = null;
              if (comment.author) {
                // 如果 author 是对象，提取 id 字段
                if (typeof comment.author === 'object' && comment.author.id) {
                  authorId = comment.author.id;
                } else if (typeof comment.author === 'string') {
                  // 如果 author 是字符串，直接使用
                  authorId = comment.author;
                }
              }
              // 如果没有 author，回退到 created_by
              if (!authorId) {
                authorId = comment.created_by;
              }

              console.log('🔍 处理评论活动:', {
                原始comment: comment,
                提取的authorId: authorId,
                author类型: typeof comment.author,
                author值: comment.author
              });

              allActivities.push({
                description: `Comment added${comment.content ? ': ' + (comment.content.length > 50 ? comment.content.substring(0, 50) + '...' : comment.content) : ''}`,
                details: {
                  comment: comment.content,
                  comment_type: comment.type || 'comment'
                },
                event_type: 'comment_added',
                timestamp: comment.created_at,
                user_id: authorId
              });
            }
          });
        }

        // 从附件数据中提取活动
        if (apiData.attachments && Array.isArray(apiData.attachments)) {
          apiData.attachments.forEach(attachment => {
            if (attachment.created_time || attachment.created_at) {
              allActivities.push({
                description: `Attachment added: ${attachment.name || attachment.fileName || 'Unknown file'}`,
                details: {
                  filename: attachment.name || attachment.fileName,
                  file_size: attachment.file_size || attachment.fileSize,
                  file_type: attachment.file_type || attachment.fileType,
                  is_uploaded: true
                },
                event_type: 'attachment_added',
                timestamp: attachment.created_time || attachment.created_at,
                user_id: attachment.created_by || attachment.createdBy
              });
            }
          });
        }

        // 按时间戳排序所有活动
        allActivities.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        console.log('Enhanced RFI activities breakdown:', {
          original: baseActivities.length,
          enhanced: allActivities.length,
          added: allActivities.length - baseActivities.length
        });

      } catch (error) {
        console.error('Error enhancing RFI activities:', error);
      }

      return allActivities;
    };

    // 方法
    const getActivityIcon = (eventType) => {
      return activityIcons[eventType] || '📝';
    };

    const getActivityTypeText = (eventType) => {
      return activityTypeTexts[eventType] || eventType;
    };

    const getActivityTypeClass = (eventType) => {
      const classMap = {
        rfi_created: 'activity-created',
        rfi_submitted: 'activity-submit',
        rfi_opened: 'activity-open',
        rfi_answered: 'activity-answered',
        rfi_closed: 'activity-closed',
        rfi_voided: 'activity-voided',
        status_changed: 'activity-status',
        comment_added: 'activity-comment',
        attachment_added: 'activity-file',
        response_submitted: 'activity-response',
        assignment_changed: 'activity-assignment',
        priority_changed: 'activity-priority',
        due_date_changed: 'activity-date',
        workflow_advanced: 'activity-workflow',
        review_requested: 'activity-review',
        review_completed: 'activity-completed',
        revision_requested: 'activity-revision',
        approval_granted: 'activity-approved',
        rejection_issued: 'activity-rejected'
      };
      return classMap[eventType] || 'activity-default';
    };

    const getStatusDisplayText = (status) => {
      const statusMap = {
        'draft': 'Draft',
        'submitted': 'Submitted',
        'open': 'Open',
        'answered': 'Answered',
        'closed': 'Closed',
        'void': 'Void'
      };
      return statusMap[status] || status;
    };

    const getPriorityClass = (priority) => {
      if (!priority) return 'priority-normal';
      return `priority-${priority.toLowerCase()}`;
    };

    const getWorkflowTypeDisplayName = (workflowType) => {
      const typeMap = {
        'US': 'Single Reviewer',
        'EU': 'Multi Reviewer',
        'EMEA': 'Multi Reviewer'
      };
      return typeMap[workflowType] || workflowType || 'Unknown';
    };

    const getUserDisplayName = (userId) => {
      if (!userId) return 'System';
      
      // 🔧 修复：如果传入的是对象，尝试提取 id 字段
      let actualUserId = userId;
      if (typeof userId === 'object') {
        if (userId.id) {
          actualUserId = userId.id;
          console.warn('⚠️ getUserDisplayName 收到对象参数，已提取 id 字段:', { 原始对象: userId, 提取的ID: actualUserId });
        } else {
          console.error('❌ getUserDisplayName 收到无效对象参数:', userId);
          return 'Unknown User';
        }
      }
      
      // 首先尝试使用 entityCache 获取用户显示名称
      const entityDisplayName = entityCache.getUserDisplayName(actualUserId, props.projectId);
      if (entityDisplayName && entityDisplayName !== actualUserId) {
        return entityDisplayName;
      }
      
      // 回退到原有的 userCache
      const userCacheDisplayName = userCache.getUserDisplayName(actualUserId);
      if (userCacheDisplayName && userCacheDisplayName !== actualUserId) {
        return userCacheDisplayName;
      }
      
      return actualUserId;
    };

    // 获取分配对象显示名称（支持用户、角色、公司）
    const getAssignedToDisplayName = (assignedTo, assignedToType) => {
      if (!assignedTo) return 'Unassigned';
      
      console.log('🔍 RFI ActivityLog获取分配显示名称:', { assignedTo, assignedToType, projectId: props.projectId });
      
      // 首先尝试从工作流配置中获取角色映射
      if (assignedToType === 'role' && workflowConfig.value?.projectRolesMapping) {
        const roleMapping = workflowConfig.value.projectRolesMapping.find(
          mapping => mapping.name === assignedTo
        );
        if (roleMapping) {
          // 如果找到角色映射，显示角色名称和成员信息
          const memberCount = roleMapping.permittedAssignees?.length || 0;
          const roleDisplayNames = {
            'projectGC': 'General Contractor',
            'projectSC': 'Subcontractor', 
            'projectCoordinator': 'Construction Manager',
            'projectReviewer': 'Architect/Reviewer'
          };
          const roleName = roleDisplayNames[assignedTo] || assignedTo;
          return `${roleName} (${memberCount} members)`;
        }
      }
      
      // 使用 entityCache 的统一方法
      const displayName = entityCache.getAssignedToDisplayName(assignedTo, assignedToType, props.projectId);
      
      console.log('✅ RFI ActivityLog分配显示名称结果:', { assignedTo, assignedToType, displayName });
      
      return displayName;
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (e) {
        return dateString;
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US');
      } catch (e) {
        return dateString;
      }
    };

    // 切换调试区域显示
    const toggleDebugSection = () => {
      showDebugSection.value = !showDebugSection.value;
    };

    // 加载工作流配置
    const loadWorkflowConfig = async () => {
      if (!props.projectId) return;

      try {
        console.log('Loading RFI workflow config for project:', props.projectId);
        
        const response = await axios.get(
          `/api/rfis/jarvis/workflow/${encodeURIComponent(props.projectId)}`
        );

        if (response.data && response.data.success) {
          workflowConfig.value = response.data.workflow;
          console.log('RFI workflow config loaded:', workflowConfig.value);
        }
      } catch (error) {
        console.warn('Failed to load RFI workflow config:', error);
        // 工作流配置是可选的，失败不影响主要功能
      }
    };

    // 加载活动日志
    const loadActivityLog = async () => {
      if (!props.projectId || !props.itemId) {
        error.value = 'Missing required project ID or RFI ID';
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        console.log('Loading RFI activity log for:', props.projectId, props.itemId);
        
        // 尝试加载 RFI 工作流日志 API（如果存在）
        const response = await axios.get(
          `/api/rfis/jarvis/${encodeURIComponent(props.itemId)}/workflow-log`,
          {
            params: { projectId: props.projectId }
          }
        );

        console.log('Raw RFI activity API response:', response.data);

        if (response.data) {
          // 保存原始数据用于调试
          rawData.value = response.data;

          // 提取和增强活动日志数据
          let extractedActivities = [];
          
          // 1. 首先获取基础活动数据
          if (response.data.success && response.data.activities) {
            extractedActivities = [...response.data.activities];
            console.log('Using RFI workflow activities:', extractedActivities.length);
          } else if (response.data.workflow_log && response.data.workflow_log.activities) {
            extractedActivities = [...response.data.workflow_log.activities];
            console.log('Using raw RFI workflow activities:', extractedActivities.length);
          }

          // 2. 从其他 API 数据源增强活动历史
          const enhancedActivities = enhanceActivitiesFromApiData(extractedActivities, response.data);
          
          activities.value = enhancedActivities;
          console.log('Final enhanced RFI activities:', enhancedActivities.length);

          // 提取摘要数据
          if (response.data.summary) {
            summary.value = response.data.summary;
          } else {
            // 生成基本摘要
            summary.value = {
              total_events: enhancedActivities.length,
              unique_users: [...new Set(enhancedActivities.map(a => a.user_id).filter(Boolean))].length,
              has_comments: enhancedActivities.some(a => a.event_type === 'comment_added'),
              has_attachments: enhancedActivities.some(a => a.event_type === 'attachment_added'),
              first_activity: enhancedActivities.length > 0 ? enhancedActivities[0].timestamp : null,
              last_activity: enhancedActivities.length > 0 ? enhancedActivities[enhancedActivities.length - 1].timestamp : null
            };
          }

          console.log('RFI activity log loaded:', {
            activities: activities.value.length,
            summary: summary.value,
            rawDataKeys: Object.keys(response.data)
          });

          emit('loaded', {
            activities: activities.value,
            summary: summary.value,
            count: activities.value.length,
            rawData: response.data
          });
        } else {
          throw new Error('Invalid response data');
        }
      } catch (err) {
        console.error('Failed to load RFI activity log:', err);
        
        // 如果专用的工作流日志 API 不存在，尝试从现有的 RFI 数据构建活动日志
        if (err.response?.status === 404) {
          console.log('Workflow log API not found, building from existing RFI data...');
          try {
            await buildActivityLogFromExistingData();
          } catch (buildError) {
            error.value = 'RFI activity log API not available and failed to build from existing data';
            emit('error', error.value);
          }
        } else {
          error.value = err.response?.data?.error || err.message || 'Failed to load RFI activity log';
          emit('error', error.value);
        }
      } finally {
        loading.value = false;
      }
    };

    // 从现有 RFI 数据构建活动日志
    const buildActivityLogFromExistingData = async () => {
      try {
        // 获取 RFI basicInfo、评论和附件
        const [rfiResponse, commentsResponse, attachmentsResponse] = await Promise.allSettled([
          axios.get(`/api/rfis/jarvis/${props.itemId}`, { params: { projectId: props.projectId } }),
          axios.get(`/api/rfis/jarvis/${props.itemId}/comments`, { params: { projectId: props.projectId } }),
          axios.get(`/api/rfis/jarvis/${props.itemId}/attachments`, { params: { projectId: props.projectId } })
        ]);

        const mockApiData = {};
        
        if (rfiResponse.status === 'fulfilled' && rfiResponse.value.data.success) {
          mockApiData.rfi = rfiResponse.value.data.rfi;
        }
        
        if (commentsResponse.status === 'fulfilled' && commentsResponse.value.data.success) {
          mockApiData.comments = commentsResponse.value.data.comments;
        }
        
        if (attachmentsResponse.status === 'fulfilled' && attachmentsResponse.value.data.success) {
          mockApiData.attachments = attachmentsResponse.value.data.attachments;
        }

        // 保存原始数据
        rawData.value = {
          built_from_existing_data: true,
          ...mockApiData
        };

        // 从现有数据构建活动
        const builtActivities = enhanceActivitiesFromApiData([], mockApiData);
        activities.value = builtActivities;

        // 生成摘要
        summary.value = {
          total_events: builtActivities.length,
          unique_users: [...new Set(builtActivities.map(a => a.user_id).filter(Boolean))].length,
          has_comments: builtActivities.some(a => a.event_type === 'comment_added'),
          has_attachments: builtActivities.some(a => a.event_type === 'attachment_added'),
          first_activity: builtActivities.length > 0 ? builtActivities[0].timestamp : null,
          last_activity: builtActivities.length > 0 ? builtActivities[builtActivities.length - 1].timestamp : null
        };

        console.log('Built RFI activity log from existing data:', {
          activities: activities.value.length,
          summary: summary.value
        });

        emit('loaded', {
          activities: activities.value,
          summary: summary.value,
          count: activities.value.length,
          rawData: rawData.value
        });

      } catch (buildError) {
        console.error('Failed to build activity log from existing data:', buildError);
        throw buildError;
      }
    };

    // 监听 props 变化
    watch([() => props.projectId, () => props.itemId], () => {
      if (props.autoLoad && props.projectId && props.itemId) {
        loadActivityLog();
      }
    }, { immediate: true });

    // 组件挂载时加载数据
    onMounted(async () => {
      // 预加载实体缓存和工作流配置
      if (props.projectId) {
        try {
          console.log('🏢 RFI ActivityLog预加载实体缓存:', props.projectId);
          
          // 并行加载实体缓存和工作流配置
          await Promise.all([
            entityCache.getProjectEntities(props.projectId),
            loadWorkflowConfig()
          ]);
          
          console.log('✅ RFI ActivityLog实体缓存和工作流配置预加载完成');
        } catch (error) {
          console.warn('⚠️ RFI ActivityLog预加载失败:', error);
        }
      }
      
      if (props.autoLoad && props.projectId && props.itemId) {
        loadActivityLog();
      }
    });

    return {
      // i18n
      t,
      
      // 数据
      activities,
      summary,
      rawData,
      workflowConfig,
      loading,
      error,
      eventCount,
      showDebugSection,
      
      // 方法
      loadActivityLog,
      toggleDebugSection,
      getActivityIcon,
      getActivityTypeText,
      getActivityTypeClass,
      getStatusDisplayText,
      getPriorityClass,
      getWorkflowTypeDisplayName,
      getUserDisplayName,
      getAssignedToDisplayName,
      formatDateTime,
      formatDate
    };
  }
};
</script>

<style scoped>
.rfi-activity-log {
  width: 100%;
}

/* 操作按钮区域 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.action-buttons .el-button {
  font-size: 14px;
}

/* 加载和错误状态 */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-details {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 6px;
  padding: 16px;
  margin: 16px auto;
  max-width: 400px;
  color: #f56c6c;
}

.error-details p {
  margin: 8px 0;
  font-size: 14px;
}

.error-details strong {
  color: #e6a23c;
}

.info-details {
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 16px;
  margin: 16px auto;
  max-width: 400px;
  color: #1e40af;
}

.info-details p {
  margin: 8px 0;
  font-size: 14px;
}

.info-details strong {
  color: #1d4ed8;
}

/* 调试部分 */
.debug-section {
  margin-bottom: 24px;
}

.debug-section .el-collapse {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

/* 活动摘要 */
.activity-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: white;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  border: 1px solid #e4e7ed;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.card-label {
  font-size: 12px;
  color: #909399;
}

.timeline-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-label {
  font-weight: 500;
  color: #606266;
}

.timeline-value {
  color: #303133;
}

/* 活动时间线 */
.activity-timeline {
  position: relative;
}

.timeline-list {
  position: relative;
}

.timeline-list::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
}

.timeline-item {
  position: relative;
  display: flex;
  margin-bottom: 24px;
  padding-left: 60px;
}

.timeline-marker {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 50%;
  z-index: 1;
}

.marker-icon {
  font-size: 16px;
}

.timeline-content {
  flex: 1;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-left: 16px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.activity-description {
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.activity-time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  margin-left: 16px;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #606266;
}

.activity-user {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-icon {
  font-size: 12px;
}

.activity-type {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

/* 活动详细信息 */
.activity-details {
  border-top: 1px solid #f0f2f5;
  padding-top: 12px;
  margin-top: 12px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  font-size: 13px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
  margin-right: 8px;
}

.detail-value {
  flex: 1;
  color: #303133;
}

.comment-text, .response-text {
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  font-style: italic;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-icon {
  font-size: 14px;
}

.upload-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.upload-status.uploaded {
  background: #f0f9ff;
  color: #67c23a;
}

.upload-status.pending {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-change {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-from, .status-to {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-from {
  background: #f5f7fa;
  color: #909399;
}

.status-to {
  background: #e6f7ff;
  color: #1890ff;
}

.status-arrow {
  color: #909399;
  font-weight: bold;
}

.assigned-to {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.assigned-name {
  font-weight: 500;
  color: #303133;
}

.assigned-type {
  font-size: 11px;
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 6px;
  border-radius: 10px;
  text-transform: capitalize;
}

.assigned-id {
  font-family: monospace;
  font-size: 10px;
  background: #f5f7fa;
  color: #909399;
  padding: 1px 4px;
  border-radius: 3px;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.priority-high {
  background: #fee2e2;
  color: #dc2626;
}

.priority-normal {
  background: #dbeafe;
  color: #2563eb;
}

.priority-low {
  background: #f3f4f6;
  color: #6b7280;
}

/* 不同活动类型的样式 */
.activity-created .timeline-marker {
  border-color: #67c23a;
  background: #f0f9ff;
}

.activity-submit .timeline-marker {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.activity-open .timeline-marker {
  border-color: #409eff;
  background: #ecf5ff;
}

.activity-answered .timeline-marker {
  border-color: #67c23a;
  background: #f0f9ff;
}

.activity-closed .timeline-marker {
  border-color: #303133;
  background: #f5f7fa;
}

.activity-voided .timeline-marker {
  border-color: #f56c6c;
  background: #fef0f0;
}

.activity-comment .timeline-marker {
  border-color: #909399;
  background: #f5f7fa;
}

.activity-file .timeline-marker {
  border-color: #409eff;
  background: #ecf5ff;
}

.activity-response .timeline-marker {
  border-color: #67c23a;
  background: #f0f9ff;
}

.activity-assignment .timeline-marker {
  border-color: #c0c4cc;
  background: #fafafa;
}

.activity-priority .timeline-marker {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.activity-date .timeline-marker {
  border-color: #909399;
  background: #f5f7fa;
}

.activity-workflow .timeline-marker {
  border-color: #409eff;
  background: #ecf5ff;
}

.activity-review .timeline-marker {
  border-color: #c0c4cc;
  background: #fafafa;
}

.activity-completed .timeline-marker {
  border-color: #67c23a;
  background: #f0f9ff;
}

.activity-revision .timeline-marker {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.activity-approved .timeline-marker {
  border-color: #67c23a;
  background: #f0f9ff;
}

.activity-rejected .timeline-marker {
  border-color: #f56c6c;
  background: #fef0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .activity-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .activity-time {
    margin-left: 0;
    margin-top: 4px;
  }

  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .timeline-info {
    grid-template-columns: 1fr;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-label {
    margin-bottom: 4px;
  }
}
</style>
