<template>
  <div class="submittal-activity-log">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('submittal.activityLog.loading') }}</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>{{ t('submittal.detailView.loadFailed') }}</h3>
      <p>{{ error }}</p>
      <el-button type="primary" @click="loadActivityLog">{{ t('submittal.actions.retry') }}</el-button>
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
          <p v-else>This submittal has no activity history yet</p>
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
                <div v-if="activity.details.response_comment" class="detail-item comment">
                  <div class="detail-label">Comment:</div>
                  <div class="detail-value comment-text">{{ activity.details.response_comment }}</div>
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
                
                <!-- 步骤信息 -->
                <div v-if="activity.details.step_number" class="detail-item step">
                  <div class="detail-label">Step:</div>
                  <div class="detail-value">
                    Step {{ activity.details.step_number }}
                    <span v-if="activity.details.due_date" class="due-date">
                      (Due: {{ formatDate(activity.details.due_date) }})
                    </span>
                  </div>
                </div>
                
                <!-- 修订信息 -->
                <div v-if="activity.details.revision !== undefined" class="detail-item revision">
                  <div class="detail-label">Revision:</div>
                  <div class="detail-value">Rev {{ activity.details.revision }}</div>
                </div>

                <!-- 响应信息 -->
                <div v-if="activity.details.response_id" class="detail-item response">
                  <div class="detail-label">Response:</div>
                  <div class="detail-value response-name">
                    {{ getResponseDisplayName(activity.details.response_id) }}
                    <span class="response-id">({{ activity.details.response_id }})</span>
                  </div>
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

                <!-- 任务状态 -->
                <div v-if="activity.details.status" class="detail-item status">
                  <div class="detail-label">Status:</div>
                  <div class="detail-value">
                    <span :class="['status-badge', activity.details.status]">
                      {{ getStatusDisplayText(activity.details.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 调试信息和原始数据 - 放在最下面 -->
      <div v-if="rawData && showDebugSection" class="debug-section">
        <JsonViewer 
          :data="rawData" 
          title="🔍 Raw Submittal Activity API Data"
          description="Complete API response data including workflow logs, activities, steps, revisions, and metadata"
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
import submittalMetadataCache from '../../utils/submittalMetadataCache.js';
import entityCache from '../../utils/entityCache.js';
import JsonViewer from '../JsonViewer.vue';

export default {
  name: 'SubmittalActivityLog',
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
    const loading = ref(false);
    const error = ref(null);
    const showDebugSection = ref(false);

    // 计算属性
    const eventCount = computed(() => activities.value.length);

    // 活动类型图标映射 - 使用简单的几何形状和符号
    const activityIcons = {
      item_created: '●',
      file_added: '▲',
      step_created: '■',
      step_started: '▶',
      step_completed: '✓',
      task_assigned: '◆',
      task_started: '○',
      task_responded: '◐',
      task_completed: '✓',
      revision_created: '◇',
      comment_added: '◑',
      submitted_to_manager: '↑',
      sent_to_review: '→',
      returned_from_review: '←',
      final_response_submitted: '✓',
      closed_and_distributed: '◉'
    };

    // 活动类型文本映射
    const activityTypeTexts = {
      item_created: 'Item Created',
      file_added: 'File Added',
      step_created: 'Step Created',
      step_started: 'Step Started',
      step_completed: 'Step Completed',
      task_assigned: 'Task Assigned',
      task_started: 'Task Started',
      task_responded: 'Task Responded',
      task_completed: 'Task Completed',
      revision_created: 'Revision Created',
      comment_added: 'Comment Added',
      submitted_to_manager: 'Submitted to Manager',
      sent_to_review: 'Sent to Review',
      returned_from_review: 'Returned from Review',
      final_response_submitted: 'Final Response Submitted',
      closed_and_distributed: 'Closed and Distributed'
    };

    // 从 API 数据增强活动历史
    const enhanceActivitiesFromApiData = (baseActivities, apiData) => {
      const allActivities = [...baseActivities];
      
      try {
        // 从步骤数据中提取活动
        if (apiData.individual_apis?.steps?.success && apiData.individual_apis.steps.all_steps) {
          const steps = apiData.individual_apis.steps.all_steps;
          
          steps.forEach(step => {
            // 步骤创建活动
            if (step.createdAt) {
              allActivities.push({
                description: `Step ${step.stepNumber} created`,
                details: {
                  step_number: step.stepNumber,
                  status: step.status,
                  due_date: step.dueDate,
                  days_to_respond: step.daysToRespond
                },
                event_type: 'step_created',
                timestamp: step.createdAt,
                user_id: step.createdBy
              });
            }

            // 步骤开始活动
            if (step.startedAt) {
              allActivities.push({
                description: `Step ${step.stepNumber} started`,
                details: {
                  step_number: step.stepNumber,
                  status: step.status
                },
                event_type: 'step_started',
                timestamp: step.startedAt,
                user_id: step.createdBy
              });
            }

            // 步骤完成活动
            if (step.completedAt) {
              allActivities.push({
                description: `Step ${step.stepNumber} completed`,
                details: {
                  step_number: step.stepNumber,
                  status: step.status
                },
                event_type: 'step_completed',
                timestamp: step.completedAt,
                user_id: step.createdBy
              });
            }

            // 从任务中提取活动
            if (step.tasks && Array.isArray(step.tasks)) {
              step.tasks.forEach(task => {
                // 任务分配活动
                if (task.createdAt) {
                  const assignedToName = getAssignedToDisplayName(task.assignedTo, task.assignedToType);
                  allActivities.push({
                    description: `Task assigned to ${assignedToName}`,
                    details: {
                      step_number: step.stepNumber,
                      task_id: task.id,
                      assigned_to: task.assignedTo,
                      assigned_to_type: task.assignedToType,
                      assigned_to_name: assignedToName,
                      is_required: task.isRequired,
                      status: task.status
                    },
                    event_type: 'task_assigned',
                    timestamp: task.createdAt,
                    user_id: task.createdBy
                  });
                }

                // 任务开始活动
                if (task.startedAt) {
                  allActivities.push({
                    description: `Task started processing`,
                    details: {
                      step_number: step.stepNumber,
                      task_id: task.id,
                      assigned_to: task.assignedTo,
                      status: task.status
                    },
                    event_type: 'task_started',
                    timestamp: task.startedAt,
                    user_id: task.assignedTo
                  });
                }

                // 任务响应活动
                if (task.respondedAt) {
                  allActivities.push({
                    description: `Task responded${task.responseComment ? ': ' + task.responseComment : ''}`,
                    details: {
                      step_number: step.stepNumber,
                      task_id: task.id,
                      response_comment: task.responseComment,
                      response_id: task.responseId,
                      status: task.status
                    },
                    event_type: 'task_responded',
                    timestamp: task.respondedAt,
                    user_id: task.respondedBy
                  });
                }

                // 任务完成活动
                if (task.completedAt) {
                  allActivities.push({
                    description: `Task completed`,
                    details: {
                      step_number: step.stepNumber,
                      task_id: task.id,
                      status: task.status
                    },
                    event_type: 'task_completed',
                    timestamp: task.completedAt,
                    user_id: task.completedBy
                  });
                }
              });
            }
          });
        }

        // 从修订数据中提取活动
        if (apiData.individual_apis?.revisions?.success && apiData.individual_apis.revisions.all_revisions) {
          const revisions = apiData.individual_apis.revisions.all_revisions;
          
          revisions.forEach(revision => {
            if (revision.createdAt) {
              allActivities.push({
                description: `Revision ${revision.revision} created`,
                details: {
                  revision: revision.revision,
                  status: revision.status
                },
                event_type: 'revision_created',
                timestamp: revision.createdAt,
                user_id: revision.createdBy
              });
            }
          });
        }

        // 从附件数据中提取活动
        if (apiData.individual_apis?.attachments?.success && apiData.individual_apis.attachments.all_attachments) {
          const attachments = apiData.individual_apis.attachments.all_attachments;
          
          attachments.forEach(attachment => {
            if (attachment.createdAt) {
              allActivities.push({
                description: `Attachment added: ${attachment.fileName || attachment.name || 'Unknown file'}`,
                details: {
                  filename: attachment.fileName || attachment.name,
                  file_size: attachment.fileSize,
                  is_uploaded: true
                },
                event_type: 'file_added',
                timestamp: attachment.createdAt,
                user_id: attachment.createdBy
              });
            }
          });
        }

        // 按时间戳排序所有活动
        allActivities.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        console.log('Enhanced activities breakdown:', {
          original: baseActivities.length,
          enhanced: allActivities.length,
          added: allActivities.length - baseActivities.length
        });

      } catch (error) {
        console.error('Error enhancing activities:', error);
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
        item_created: 'activity-created',
        file_added: 'activity-file',
        step_created: 'activity-step',
        step_started: 'activity-step',
        step_completed: 'activity-completed',
        task_assigned: 'activity-task',
        task_started: 'activity-task',
        task_responded: 'activity-comment',
        task_completed: 'activity-completed',
        revision_created: 'activity-revision',
        comment_added: 'activity-comment',
        submitted_to_manager: 'activity-submit',
        sent_to_review: 'activity-review',
        returned_from_review: 'activity-return',
        final_response_submitted: 'activity-response',
        closed_and_distributed: 'activity-closed'
      };
      return classMap[eventType] || 'activity-default';
    };

    const getStatusDisplayText = (status) => {
      const statusMap = {
        'not-started': 'Not Started',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'pending': 'Pending'
      };
      return statusMap[status] || status;
    };

    const getUserDisplayName = (userId) => {
      if (!userId) return 'System';
      
      // 首先尝试使用 entityCache 获取用户显示名称
      const entityDisplayName = entityCache.getUserDisplayName(userId, props.projectId);
      if (entityDisplayName && entityDisplayName !== userId) {
        return entityDisplayName;
      }
      
      // 回退到原有的 userCache
      const userCacheDisplayName = userCache.getUserDisplayName(userId);
      if (userCacheDisplayName && userCacheDisplayName !== userId) {
        return userCacheDisplayName;
      }
      
      return userId;
    };

    // 获取响应显示名称
    const getResponseDisplayName = (responseId) => {
      if (!responseId || !props.projectId) return responseId || 'Unknown Response';
      return submittalMetadataCache.getResponseDisplayName(responseId, props.projectId);
    };

    // 获取分配对象显示名称（支持用户、角色、公司）
    const getAssignedToDisplayName = (assignedTo, assignedToType) => {
      if (!assignedTo) return 'Unassigned';
      
      console.log('🔍 ActivityLog获取分配显示名称:', { assignedTo, assignedToType, projectId: props.projectId });
      
      // 使用 entityCache 的统一方法
      const displayName = entityCache.getAssignedToDisplayName(assignedTo, assignedToType, props.projectId);
      
      console.log('✅ ActivityLog分配显示名称结果:', { assignedTo, assignedToType, displayName });
      
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

    // 加载活动日志
    const loadActivityLog = async () => {
      if (!props.projectId || !props.itemId) {
        error.value = 'Missing required project ID or submittal ID';
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        console.log('Loading activity log for:', props.projectId, props.itemId);
        
        const response = await axios.get(
          `/api/test/submittals/test-workflow-log/${encodeURIComponent(props.projectId)}/${encodeURIComponent(props.itemId)}`
        );

        console.log('Raw API response:', response.data);

        if (response.data) {
          // 保存原始数据用于调试
          rawData.value = response.data;

          // 提取和增强活动日志数据
          let extractedActivities = [];
          
          // 1. 首先获取基础活动数据
          if (response.data.formatted_display && response.data.formatted_display.success) {
            extractedActivities = [...(response.data.formatted_display.formatted_activities || [])];
            console.log('Using formatted activities:', extractedActivities.length);
          } else if (response.data.workflow_log && response.data.workflow_log.success) {
            extractedActivities = [...(response.data.workflow_log.activities || [])];
            console.log('Using raw workflow activities:', extractedActivities.length);
          }

          // 2. 从其他 API 数据源增强活动历史
          const enhancedActivities = enhanceActivitiesFromApiData(extractedActivities, response.data);
          
          activities.value = enhancedActivities;
          console.log('Final enhanced activities:', enhancedActivities.length);

          // 提取摘要数据
          if (response.data.activity_summary && response.data.activity_summary.success) {
            summary.value = response.data.activity_summary.data || null;
          } else {
            summary.value = null;
            // 如果有错误信息，显示在界面上
            if (response.data.activity_summary && response.data.activity_summary.error) {
              console.warn('Activity summary error:', response.data.activity_summary.error);
            }
          }

          console.log('Activity log loaded:', {
            activities: activities.value.length,
            summary: summary.value,
            hasErrors: response.data.test_summary?.has_errors,
            errorCount: response.data.test_summary?.error_count,
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
        console.error('Failed to load activity log:', err);
        error.value = err.response?.data?.error || err.message || 'Failed to load activity log';
        emit('error', error.value);
      } finally {
        loading.value = false;
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
      // 预加载实体缓存以确保用户、角色、公司映射可用
      if (props.projectId) {
        try {
          console.log('🏢 ActivityLog预加载实体缓存:', props.projectId);
          await entityCache.getProjectEntities(props.projectId);
          console.log('✅ ActivityLog实体缓存预加载完成');
        } catch (error) {
          console.warn('⚠️ ActivityLog实体缓存预加载失败:', error);
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
      getUserDisplayName,
      getResponseDisplayName,
      getAssignedToDisplayName,
      formatDateTime,
      formatDate
    };
  }
};
</script>

<style scoped>
.submittal-activity-log {
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
  min-width: 60px;
  margin-right: 8px;
}

.detail-value {
  flex: 1;
  color: #303133;
}

.comment-text {
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

.due-date {
  color: #909399;
  font-size: 11px;
}

.response-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.response-id {
  font-family: monospace;
  font-size: 11px;
  background: #f5f7fa;
  color: #909399;
  padding: 2px 6px;
  border-radius: 3px;
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

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.completed {
  background: #f0f9ff;
  color: #67c23a;
}

.status-badge.in-progress {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-badge.not-started {
  background: #f5f7fa;
  color: #909399;
}

/* 不同活动类型的样式 */
.activity-created .timeline-marker {
  border-color: #67c23a;
  background: #f0f9ff;
}

.activity-file .timeline-marker {
  border-color: #409eff;
  background: #ecf5ff;
}

.activity-step .timeline-marker {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.activity-completed .timeline-marker {
  border-color: #67c23a;
  background: #f0f9ff;
}

.activity-comment .timeline-marker {
  border-color: #909399;
  background: #f5f7fa;
}

.activity-submit .timeline-marker {
  border-color: #f56c6c;
  background: #fef0f0;
}

.activity-review .timeline-marker {
  border-color: #c0c4cc;
  background: #fafafa;
}

.activity-return .timeline-marker {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.activity-response .timeline-marker {
  border-color: #409eff;
  background: #ecf5ff;
}

.activity-closed .timeline-marker {
  border-color: #303133;
  background: #f5f7fa;
}

.activity-task .timeline-marker {
  border-color: #909399;
  background: #f5f7fa;
}

.activity-revision .timeline-marker {
  border-color: #409eff;
  background: #ecf5ff;
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
