<template>
  <div class="submittal-steps">
    <div v-if="steps && steps.length > 0" class="steps-timeline">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="step-item"
        :class="getStepStatusClass(step.status)"
      >
        <!-- 步骤编号 -->
        <div class="step-number">
          <span v-if="step.status === 'completed'">✓</span>
          <span v-else-if="step.status === 'in-progress'">⏳</span>
          <span v-else>{{ step.stepNumber }}</span>
        </div>

        <!-- 步骤内容 -->
        <div class="step-content">
          <div class="step-header">
            <div class="step-title">
              <span class="step-label">Step {{ step.stepNumber }}</span>
              <span :class="['step-status-badge', getStepStatusClass(step.status)]">
                {{ getStepStatusText(step.status) }}
              </span>
            </div>
            <div class="step-meta">
              <span v-if="step.dueDate" class="step-due">
                截止: {{ formatDate(step.dueDate) }}
              </span>
              <span v-if="step.daysToRespond" class="step-duration">
                {{ step.daysToRespond }} 天
              </span>
            </div>
          </div>

          <!-- 任务列表 -->
          <div v-if="step.tasks && step.tasks.length > 0" class="tasks-list">
            <div
              v-for="task in step.tasks"
              :key="task.id"
              class="task-item"
              :class="getTaskStatusClass(task.status)"
            >
              <div class="task-header">
                <div class="task-assignee">
                  <i class="icon">👤</i>
                  <span class="assignee-name">{{ task.assignedTo }}</span>
                  <span class="assignee-type">({{ getAssigneeTypeText(task.assignedToType) }})</span>
                  <span v-if="task.isRequired" class="required-badge">必需</span>
                </div>
                <span :class="['task-status-badge', getTaskStatusClass(task.status)]">
                  {{ getTaskStatusText(task.status) }}
                </span>
              </div>

              <!-- 任务响应 -->
              <div v-if="task.responseComment" class="task-response">
                <div class="response-header">
                  <i class="icon">💬</i>
                  <span class="response-label">响应</span>
                  <span v-if="task.respondedAt" class="response-time">
                    {{ formatDateTime(task.respondedAt) }}
                  </span>
                </div>
                <div class="response-content">{{ task.responseComment }}</div>
                <div v-if="task.respondedBy" class="response-author">
                  由 {{ task.respondedBy }} 响应
                </div>
              </div>

              <!-- 任务时间线 -->
              <div class="task-timeline">
                <div v-if="task.startedAt" class="timeline-point">
                  <i class="icon">▶️</i>
                  <span>开始: {{ formatDateTime(task.startedAt) }}</span>
                </div>
                <div v-if="task.completedAt" class="timeline-point">
                  <i class="icon">✅</i>
                  <span>完成: {{ formatDateTime(task.completedAt) }}</span>
                  <span v-if="task.completedBy" class="completed-by">
                    ({{ task.completedBy }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 步骤时间信息 -->
          <div class="step-times">
            <div v-if="step.startedAt" class="time-info">
              <i class="icon">🕐</i>
              <span>开始: {{ formatDateTime(step.startedAt) }}</span>
            </div>
            <div v-if="step.completedAt" class="time-info">
              <i class="icon">✓</i>
              <span>完成: {{ formatDateTime(step.completedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 连接线 -->
        <div v-if="index < steps.length - 1" class="step-connector"></div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-steps">
      <i class="icon">📋</i>
      <p>暂无审核步骤</p>
    </div>
  </div>
</template>

<script>
import { formatDate, formatDateTime } from '../../utils/dateUtils.js'

export default {
  name: 'SubmittalSteps',
  props: {
    steps: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getStepStatusText(status) {
      const statusMap = {
        'not-started': '未开始',
        'in-progress': '进行中',
        'completed': '已完成'
      };
      return statusMap[status] || status;
    },
    getStepStatusClass(status) {
      return `step-${status}`;
    },
    getTaskStatusText(status) {
      const statusMap = {
        'not-started': '待处理',
        'in-progress': '处理中',
        'completed': '已完成'
      };
      return statusMap[status] || status;
    },
    getTaskStatusClass(status) {
      return `task-${status}`;
    },
    getAssigneeTypeText(type) {
      const typeMap = {
        '1': '用户',
        '2': '公司',
        '3': '角色'
      };
      return typeMap[type] || 'Unknown';
    },
    // 使用导入的时间格式化函数
    formatDate,
    formatDateTime
  }
};
</script>

<style scoped>
.submittal-steps {
  width: 100%;
}

.steps-timeline {
  position: relative;
}

.step-item {
  position: relative;
  display: flex;
  gap: 20px;
  padding-bottom: 32px;
}

.step-item:last-child {
  padding-bottom: 0;
}

/* 步骤编号 */
.step-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: 3px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #9ca3af;
  flex-shrink: 0;
  z-index: 1;
  transition: all 0.3s ease;
}

.step-item.step-not-started .step-number {
  border-color: #e5e7eb;
  color: #9ca3af;
}

.step-item.step-in-progress .step-number {
  border-color: #60a5fa;
  background: #dbeafe;
  color: #1e40af;
  animation: pulse 2s infinite;
}

.step-item.step-completed .step-number {
  border-color: #10b981;
  background: #d1fae5;
  color: #065f46;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(96, 165, 250, 0);
  }
}

/* 连接线 */
.step-connector {
  position: absolute;
  left: 23px;
  top: 48px;
  bottom: -32px;
  width: 3px;
  background: #e5e7eb;
}

.step-item.step-completed .step-connector {
  background: linear-gradient(to bottom, #10b981, #e5e7eb);
}

/* 步骤内容 */
.step-content {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #f3f4f6;
  transition: all 0.3s ease;
}

.step-item.step-in-progress .step-content {
  border-color: #60a5fa;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
}

.step-item.step-completed .step-content {
  border-color: #d1fae5;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 16px;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.step-label {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.step-status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.step-status-badge.step-not-started {
  background: #f3f4f6;
  color: #6b7280;
}

.step-status-badge.step-in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.step-status-badge.step-completed {
  background: #d1fae5;
  color: #065f46;
}

.step-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 13px;
}

.step-due {
  color: #6b7280;
  font-weight: 500;
}

.step-duration {
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  color: #374151;
  font-weight: 600;
}

/* 任务列表 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.task-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 14px;
  border-left: 4px solid #e5e7eb;
  transition: all 0.3s ease;
}

.task-item.task-in-progress {
  border-left-color: #60a5fa;
  background: #eff6ff;
}

.task-item.task-completed {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.icon {
  font-size: 14px;
}

.assignee-name {
  font-weight: 600;
  color: #1a1a1a;
}

.assignee-type {
  font-size: 12px;
  color: #9ca3af;
}

.required-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.task-status-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.task-status-badge.task-not-started {
  background: #f3f4f6;
  color: #6b7280;
}

.task-status-badge.task-in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.task-status-badge.task-completed {
  background: #d1fae5;
  color: #065f46;
}

/* 任务响应 */
.task-response {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
  border: 1px solid #e5e7eb;
}

.response-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: #667eea;
  font-weight: 600;
  font-size: 13px;
}

.response-time {
  color: #9ca3af;
  font-size: 11px;
  font-weight: 400;
}

.response-content {
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 6px;
}

.response-author {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}

/* 任务时间线 */
.task-timeline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
}

.timeline-point {
  display: flex;
  align-items: center;
  gap: 6px;
}

.completed-by {
  color: #9ca3af;
  font-style: italic;
}

/* 步骤时间信息 */
.step-times {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  font-size: 12px;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
}

/* 空状态 */
.empty-steps {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-steps .icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-steps p {
  margin: 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .step-item {
    gap: 12px;
  }

  .step-number {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .step-connector {
    left: 19px;
  }

  .step-content {
    padding: 16px;
  }

  .step-header {
    flex-direction: column;
    gap: 12px;
  }

  .step-meta {
    align-items: flex-start;
  }

  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .step-times {
    flex-direction: column;
    gap: 8px;
  }
}
</style>

