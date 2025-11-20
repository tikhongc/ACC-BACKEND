<template>
  <div class="submittal-workflow">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading workflow...</p>
    </div>
    
    <div v-else class="workflow-content">
      <!-- 工作流程概览 -->
      <el-card class="workflow-overview-card">
        <template #header>
          <div class="card-header">
            <span>Submittal Workflow</span>
            <el-tag :type="getOverallStatusType()" size="large">
              {{ getOverallStatusText() }}
            </el-tag>
          </div>
        </template>
        
        <!-- 简化的流程步骤 -->
        <div class="workflow-steps">
          <!-- 步骤1: Submitted -->
          <div :class="['workflow-step', getStepClass('submitted')]">
            <div class="step-icon">
              <el-icon v-if="isStepCompleted('submitted')"><Check /></el-icon>
              <el-icon v-else-if="isStepActive('submitted')"><Loading /></el-icon>
              <span v-else class="step-number">1</span>
            </div>
            <div class="step-content">
              <h4>Submitted</h4>
              <p class="step-description">Submittal has been submitted by the contractor</p>
              <div v-if="workflowData.submittedInfo" class="step-details">
                <p><strong>Submitted By:</strong> {{ getUserDisplayName(workflowData.submittedInfo.submittedBy) }}</p>
                <p><strong>Submitted At:</strong> {{ formatDateTime(workflowData.submittedInfo.receivedFromSubmitter) }}</p>
              </div>
            </div>
          </div>

          <!-- 连接线 -->
          <div :class="['workflow-connector', { 'active': isStepCompleted('submitted') }]"></div>

          <!-- 步骤2: Sent for review -->
          <div :class="['workflow-step', getStepClass('sent-for-review')]">
            <div class="step-icon">
              <el-icon v-if="isStepCompleted('sent-for-review')"><Check /></el-icon>
              <el-icon v-else-if="isStepActive('sent-for-review')"><Loading /></el-icon>
              <span v-else class="step-number">2</span>
            </div>
            <div class="step-content">
              <h4>Sent for Review</h4>
              <p class="step-description">Submittal has been sent for review process</p>
              <div v-if="workflowData.sentForReviewInfo" class="step-details">
                <p><strong>Sent By:</strong> {{ getUserDisplayName(workflowData.sentForReviewInfo.sentToReviewBy) }}</p>
                <p><strong>Sent At:</strong> {{ formatDateTime(workflowData.sentForReviewInfo.sentToReview) }}</p>
              </div>
            </div>
          </div>

          <!-- 连接线 -->
          <div :class="['workflow-connector', { 'active': isStepCompleted('sent-for-review') }]"></div>

          <!-- 步骤3: Review steps (动态生成) -->
          <div v-for="(step, index) in steps" :key="step.id" class="review-step-container">
            <div :class="['workflow-step', getStepClass('review', step)]">
              <div class="step-icon">
                <el-icon v-if="step.status === 'completed'"><Check /></el-icon>
                <el-icon v-else-if="step.status === 'in-progress'"><Loading /></el-icon>
                <span v-else class="step-number">{{ 2 + index + 1 }}</span>
              </div>
              <div class="step-content">
                <h4>Review Step {{ step.stepNumber }}</h4>
                <p class="step-description">Review step in the approval process</p>
                <div class="step-details">
                  <p><strong>Due Date:</strong> {{ formatDate(step.dueDate) }}</p>
                  <p><strong>Response Time:</strong> {{ step.daysToRespond }} days</p>
                  <div v-if="step.startedAt" class="step-timeline">
                    <p><strong>Started:</strong> {{ formatDateTime(step.startedAt) }}</p>
                  </div>
                  <div v-if="step.completedAt" class="step-timeline">
                    <p><strong>Completed:</strong> {{ formatDateTime(step.completedAt) }}</p>
                  </div>
                </div>

                <!-- 任务列表 -->
                <div v-if="step.tasks && step.tasks.length > 0" class="tasks-section">
                  <el-collapse v-model="activeCollapse[step.id]">
                    <el-collapse-item :title="`Tasks (${step.tasks.length})`" :name="step.id">
                      <div class="tasks-list">
                        <div v-for="task in step.tasks" :key="task.id" class="task-item">
                          <div class="task-header">
                            <div class="task-assignee">
                              <el-avatar :size="32" class="task-avatar">
                                {{ getInitials(getUserDisplayName(task.assignedTo)) }}
                              </el-avatar>
                              <div class="assignee-info">
                                <span class="assignee-name">{{ getUserDisplayName(task.assignedTo) }}</span>
                                <span class="assignee-type">({{ getUserTypeText(task.assignedToType) }})</span>
                                <el-tag v-if="task.isRequired" size="small" type="danger">Required</el-tag>
                              </div>
                            </div>
                            <el-tag :type="getTaskStatusType(task.status)" size="small">
                              {{ getTaskStatusText(task.status) }}
                            </el-tag>
                          </div>
                          
                          <div v-if="task.responseId || task.responseComment" class="task-response">
                            <div v-if="task.responseId" class="response-type">
                              <strong>Response Type:</strong> 
                              <el-tag :type="getResponseTypeTag(task.responseId)" size="small">
                                {{ getResponseText(task.responseId) }}
                              </el-tag>
                            </div>
                            <div v-if="task.responseComment" class="response-comment">
                              <strong>Comment:</strong> {{ task.responseComment }}
                            </div>
                            <div v-if="task.respondedAt" class="response-time">
                              <strong>Responded At:</strong> {{ formatDateTime(task.respondedAt) }}
                              <span v-if="task.respondedBy">({{ getUserDisplayName(task.respondedBy) }})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
            </div>
            
            <!-- 连接线 (如果不是最后一个步骤) -->
            <div v-if="index < steps.length - 1" :class="['workflow-connector', { 'active': step.status === 'completed' }]"></div>
          </div>

          <!-- 最终状态 -->
          <div v-if="workflowData.isCompleted" class="workflow-connector active"></div>
          <div v-if="workflowData.isCompleted" :class="['workflow-step', 'completed']">
            <div class="step-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="step-content">
              <h4>Completed</h4>
              <p class="step-description">Submittal workflow has been completed</p>
              <div v-if="workflowData.finalResponse" class="step-details">
                <p><strong>Final Response:</strong> 
                  <el-tag :type="getResponseTypeTag(workflowData.finalResponse.responseId)" size="small">
                    {{ getResponseText(workflowData.finalResponse.responseId) }}
                  </el-tag>
                </p>
                <p v-if="workflowData.finalResponse.responseComment"><strong>Comment:</strong> {{ workflowData.finalResponse.responseComment }}</p>
                <p><strong>Completed At:</strong> {{ formatDateTime(workflowData.finalResponse.respondedAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 统计信息 -->
      <el-card class="workflow-stats-card">
        <template #header>
          <span>Workflow Statistics</span>
        </template>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ totalSteps }}</div>
            <div class="stat-label">Total Steps</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ completedSteps }}</div>
            <div class="stat-label">Completed Steps</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ totalTasks }}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ completedTasks }}</div>
            <div class="stat-label">Completed Tasks</div>
          </div>
        </div>
        <el-progress
          :percentage="workflowProgress"
          :stroke-width="12"
          :text-inside="true"
          class="workflow-progress"
        />
      </el-card>

      <!-- JSON数据查看器 -->
      <div class="workflow-json-viewer">
        <div class="json-viewers-grid">
          <JsonViewer 
            v-if="steps.length > 0"
            :data="steps"
            title="🔄 Workflow Steps API Data"
            description="Complete workflow steps and tasks data for this submittal item"
            :show-copy="true"
            :show-download="true"
            :collapsible="true"
            :collapsed="true" />
          
          <JsonViewer 
            v-if="templates.length > 0"
            :data="templates"
            title="📄 Workflow Templates API Data"
            description="Available workflow templates configured for this project"
            :show-copy="true"
            :show-download="true"
            :collapsible="true"
            :collapsed="true" />

          <JsonViewer 
            v-if="item && Object.keys(item).length > 0"
            :data="workflowRelatedData"
            title="📋 Submittal Workflow Status Data"
            description="Workflow-related fields from the submittal item"
            :show-copy="true"
            :show-download="true"
            :collapsible="true"
            :collapsed="true" />

          <JsonViewer 
            v-if="metadata && Object.keys(metadata).length > 0"
            :data="metadata"
            title="⚙️ Project Metadata"
            description="Project metadata including user types, statuses, and responses"
            :show-copy="true"
            :show-download="true"
            :collapsible="true"
            :collapsed="true" />

          <JsonViewer 
            v-if="responses.length > 0"
            :data="responses"
            title="💬 Response Types"
            description="Available response types for this project"
            :show-copy="true"
            :show-download="true"
            :collapsible="true"
            :collapsed="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { Check, Loading } from '@element-plus/icons-vue';
import JsonViewer from '../JsonViewer.vue';
import userCache from '../../utils/userCache.js';
import entityCache from '../../utils/entityCache.js';
import submittalMetadataCache from '../../utils/submittalMetadataCache.js';

export default {
  name: 'SubmittalWorkflow',
  components: {
    JsonViewer,
    Check,
    Loading
  },
  props: {
    item: {
      type: Object,
      default: () => ({})
    },
    steps: {
      type: Array,
      default: () => []
    },
    templates: {
      type: Array,
      default: () => []
    },
    metadata: {
      type: Object,
      default: () => ({})
    },
    responses: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const activeCollapse = ref({});

    // 工作流程数据分析
    const workflowData = computed(() => {
      const data = {
        submittedInfo: null,
        sentForReviewInfo: null,
        isCompleted: false,
        finalResponse: null,
        currentPhase: 'not-started'
      };

      if (!props.item || Object.keys(props.item).length === 0) {
        return data;
      }

      // 分析提交信息
      if (props.item.receivedFromSubmitter) {
        data.submittedInfo = {
          submittedBy: props.item.submittedBy,
          receivedFromSubmitter: props.item.receivedFromSubmitter
        };
        data.currentPhase = 'submitted';
      }

      // 分析发送审核信息
      if (props.item.sentToReview) {
        data.sentForReviewInfo = {
          sentToReviewBy: props.item.sentToReviewBy,
          sentToReview: props.item.sentToReview
        };
        data.currentPhase = 'sent-for-review';
      }

      // 检查是否有进行中的审核步骤
      if (props.steps.length > 0) {
        const hasInProgressStep = props.steps.some(step => step.status === 'in-progress');
        if (hasInProgressStep) {
          data.currentPhase = 'in-review';
        }
      }

      // 分析完成状态
      if (props.item.stateId === 'sbc-2' || props.item.statusId === '3') {
        data.isCompleted = true;
        data.currentPhase = 'completed';
        if (props.item.responseId) {
          data.finalResponse = {
            responseId: props.item.responseId,
            responseComment: props.item.responseComment,
            respondedAt: props.item.respondedAt,
            respondedBy: props.item.respondedBy
          };
        }
      }

      return data;
    });

    // 计算统计数据
    const totalSteps = computed(() => props.steps.length);
    const completedSteps = computed(() => props.steps.filter(step => step.status === 'completed').length);
    const totalTasks = computed(() => {
      return props.steps.reduce((total, step) => total + (step.tasks ? step.tasks.length : 0), 0);
    });
    const completedTasks = computed(() => {
      return props.steps.reduce((total, step) => {
        return total + (step.tasks ? step.tasks.filter(task => task.status === 'completed').length : 0);
      }, 0);
    });

    const workflowProgress = computed(() => {
      const totalPhases = 3 + props.steps.length; // submitted + sent-for-review + review steps + completed
      let completedPhases = 0;

      if (workflowData.value.submittedInfo) completedPhases++;
      if (workflowData.value.sentForReviewInfo) completedPhases++;
      completedPhases += completedSteps.value;
      if (workflowData.value.isCompleted) completedPhases++;

      return Math.round((completedPhases / totalPhases) * 100);
    });

    // 工作流程相关数据
    const workflowRelatedData = computed(() => {
      if (!props.item || Object.keys(props.item).length === 0) return {};
      
      return {
        // 基本状态信息
        basicStatus: {
          id: props.item.id,
          identifier: props.item.identifier,
          customIdentifier: props.item.customIdentifier,
          customIdentifierHumanReadable: props.item.customIdentifierHumanReadable,
          title: props.item.title,
          stateId: props.item.stateId,
          statusId: props.item.statusId,
          revision: props.item.revision,
          priority: props.item.priority
        },
        
        // 工作流程时间线
        workflowTimeline: {
          createdAt: props.item.createdAt,
          createdBy: props.item.createdBy,
          updatedAt: props.item.updatedAt,
          updatedBy: props.item.updatedBy,
          sentToSubmitter: props.item.sentToSubmitter,
          receivedFromSubmitter: props.item.receivedFromSubmitter,
          submittedBy: props.item.submittedBy,
          sentToReview: props.item.sentToReview,
          sentToReviewBy: props.item.sentToReviewBy,
          receivedFromReview: props.item.receivedFromReview,
          publishedDate: props.item.publishedDate,
          publishedBy: props.item.publishedBy
        },
        
        // 责任人信息
        assignees: {
          manager: props.item.manager,
          managerType: props.item.managerType,
          subcontractor: props.item.subcontractor,
          subcontractorType: props.item.subcontractorType,
          ballInCourtUsers: props.item.ballInCourtUsers,
          ballInCourtCompanies: props.item.ballInCourtCompanies,
          ballInCourtRoles: props.item.ballInCourtRoles,
          ballInCourtType: props.item.ballInCourtType,
          watchers: props.item.watchers
        },
        
        // 日期信息
        dates: {
          dueDate: props.item.dueDate,
          submitterDueDate: props.item.submitterDueDate,
          managerDueDate: props.item.managerDueDate,
          requiredDate: props.item.requiredDate,
          requiredApprovalDate: props.item.requiredApprovalDate,
          requiredOnJobDate: props.item.requiredOnJobDate,
          leadTime: props.item.leadTime
        },
        
        // 响应信息
        response: {
          responseId: props.item.responseId,
          responseComment: props.item.responseComment,
          respondedAt: props.item.respondedAt,
          respondedBy: props.item.respondedBy
        }
      };
    });

    // 辅助方法
    const isStepCompleted = (stepType) => {
      switch (stepType) {
        case 'submitted':
          return !!workflowData.value.submittedInfo;
        case 'sent-for-review':
          return !!workflowData.value.sentForReviewInfo;
        default:
          return false;
      }
    };

    const isStepActive = (stepType) => {
      return workflowData.value.currentPhase === stepType;
    };

    const getStepClass = (stepType, step = null) => {
      if (step) {
        return {
          'completed': step.status === 'completed',
          'in-progress': step.status === 'in-progress',
          'pending': step.status === 'not-started' || !step.status
        };
      }

      const completed = isStepCompleted(stepType);
      const active = isStepActive(stepType);
      
      return {
        'completed': completed && !active,
        'in-progress': active,
        'pending': !completed && !active
      };
    };

    const getOverallStatusType = () => {
      switch (workflowData.value.currentPhase) {
        case 'completed': return 'success';
        case 'in-review': return 'warning';
        case 'sent-for-review': return 'primary';
        case 'submitted': return 'info';
        default: return 'info';
      }
    };

    const getOverallStatusText = () => {
      const phaseMap = {
        'not-started': 'Not Started',
        'submitted': 'Submitted',
        'sent-for-review': 'Sent for Review',
        'in-review': 'In Review',
        'completed': 'Completed'
      };
      return phaseMap[workflowData.value.currentPhase] || 'Unknown';
    };

    const getTaskStatusType = (status) => {
      const map = {
        'not-started': 'info',
        'in-progress': 'warning',
        'completed': 'success'
      };
      return map[status] || 'info';
    };

    const getTaskStatusText = (status) => {
      const statusMap = {
        'not-started': 'Not Started',
        'in-progress': 'In Progress',
        'completed': 'Completed'
      };
      return statusMap[status] || status;
    };

    const getResponseTypeTag = (responseId) => {
      if (!responseId) return 'info';
      
      // 查找响应类型
      let response = null;
      if (props.responses && props.responses.length > 0) {
        response = props.responses.find(r => r.id === responseId);
      } else if (props.metadata && props.metadata.responses) {
        response = props.metadata.responses.find(r => r.id === responseId);
      }

      if (response) {
        // 根据categoryId确定标签类型
        switch (response.categoryId) {
          case '1': return 'success'; // Approved
          case '2': return 'danger';  // Rejected
          case '3': return 'warning'; // Revise and resubmit
          default: return 'info';
        }
      }

      return 'info';
    };

    const getUserDisplayName = (userId) => {
      if (!userId) return 'Unknown';
      const displayName = userCache.getUserDisplayName(userId, props.projectId);
      if (displayName && displayName !== userId) {
        return displayName;
      }
      if (userId.includes('@')) {
        return userId.split('@')[0];
      }
      return userId.length > 20 ? userId.substring(0, 20) + '...' : userId;
    };

    const getUserTypeText = (type) => {
      // 首先尝试从metadata中查找
      if (props.metadata && props.metadata.userTypes) {
        const userType = props.metadata.userTypes.find(ut => ut.id === type);
        if (userType) {
          return userType.value || userType.name || userType.key;
        }
      }
      
      // 回退到默认映射
      const typeMap = { '1': 'User', '2': 'Company', '3': 'Role' };
      return typeMap[type] || 'User';
    };

    const getResponseText = (responseId) => {
      if (!responseId) return '-';
      
      // 首先尝试从新的responses数据中查找
      if (props.responses && props.responses.length > 0) {
        const response = props.responses.find(r => r.id === responseId);
        if (response) {
          return response.value || response.name || response.key;
        }
      }
      
      // 如果metadata中有responses数据，也尝试查找
      if (props.metadata && props.metadata.responses) {
        const response = props.metadata.responses.find(r => r.id === responseId);
        if (response) {
          return response.value || response.name || response.key;
        }
      }
      
      // 回退到缓存
      const responseName = submittalMetadataCache.getResponseDisplayName(responseId, props.projectId);
      return responseName !== responseId ? responseName : (responseId.substring(0, 8) + '...');
    };

    const getInitials = (name) => {
      if (!name) return '?';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString();
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString();
    };

    return {
      activeCollapse,
      workflowData,
      totalSteps,
      completedSteps,
      totalTasks,
      completedTasks,
      workflowProgress,
      workflowRelatedData,
      isStepCompleted,
      isStepActive,
      getStepClass,
      getOverallStatusType,
      getOverallStatusText,
      getTaskStatusType,
      getTaskStatusText,
      getResponseTypeTag,
      getUserDisplayName,
      getUserTypeText,
      getResponseText,
      getInitials,
      formatDate,
      formatDateTime
    };
  }
};
</script>

<style scoped>
.submittal-workflow {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.loading-container {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 15px;
  border: 3px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.workflow-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.workflow-overview-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.workflow-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 20px 0;
}

.workflow-step {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  border-left: 4px solid #e5e7eb;
}

.workflow-step.completed {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.workflow-step.in-progress {
  border-left-color: #f59e0b;
  background: #fffbeb;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.workflow-step.pending {
  border-left-color: #6b7280;
  background: #f9fafb;
}

.step-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  font-weight: bold;
  font-size: 16px;
}

.workflow-step.completed .step-icon {
  background: #10b981;
  color: white;
}

.workflow-step.in-progress .step-icon {
  background: #f59e0b;
  color: white;
}

.workflow-step.pending .step-icon {
  background: #e5e7eb;
  color: #6b7280;
}

.step-content {
  flex: 1;
}

.step-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.step-description {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.step-details {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
}

.step-details p {
  margin: 4px 0;
}

.step-timeline {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.workflow-connector {
  width: 4px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 auto 0 42px;
  transition: background-color 0.3s ease;
}

.workflow-connector.active {
  background: #10b981;
}

.review-step-container {
  display: flex;
  flex-direction: column;
}

.tasks-section {
  margin-top: 16px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  border-left: 3px solid #3b82f6;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-avatar {
  background: #3b82f6;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.assignee-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.assignee-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.assignee-type {
  font-size: 12px;
  color: #6b7280;
}

.task-response {
  background: #f8fafc;
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
}

.response-type, .response-comment, .response-time {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.response-type:last-child, .response-comment:last-child, .response-time:last-child {
  margin-bottom: 0;
}

.workflow-stats-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.workflow-progress {
  margin-top: 16px;
}

.workflow-json-viewer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
}

.json-viewers-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .submittal-workflow {
    padding: 16px;
  }
  
  .workflow-step {
    padding: 16px;
  }
  
  .step-icon {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
  
  .workflow-connector {
    margin-left: 36px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>