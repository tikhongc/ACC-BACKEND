<template>
  <div class="submittal-stats">
    <div v-if="loading" class="loading-skeleton">
      <div class="skeleton-card" v-for="i in 6" :key="i"></div>
    </div>

    <div v-else class="stats-grid">
      <!-- 总数 -->
      <div class="stat-card total-card" @click="$emit('filter-status', '')">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">{{ t('submittal.stats.total') }}</div>
        </div>
      </div>

      <!-- Required -->
      <div class="stat-card required-card" @click="$emit('filter-status', '1')">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.required }}</div>
          <div class="stat-label">{{ t('submittal.status.required') }}</div>
          <div class="stat-desc">{{ t('submittal.stats.required') }}</div>
        </div>
      </div>

      <!-- Open -->
      <div class="stat-card open-card" @click="$emit('filter-status', '2')">
        <div class="stat-icon">🔵</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.open }}</div>
          <div class="stat-label">{{ t('submittal.status.open') }}</div>
          <div class="stat-desc">{{ t('submittal.stats.open') }}</div>
        </div>
      </div>

      <!-- Closed -->
      <div class="stat-card closed-card" @click="$emit('filter-status', '3')">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.closed }}</div>
          <div class="stat-label">{{ t('submittal.status.closed') }}</div>
          <div class="stat-desc">{{ t('submittal.stats.closed') }}</div>
        </div>
      </div>

      <!-- Void -->
      <div class="stat-card void-card" @click="$emit('filter-status', '4')">
        <div class="stat-icon">🚫</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.void }}</div>
          <div class="stat-label">{{ t('submittal.status.void') }}</div>
          <div class="stat-desc">{{ t('submittal.stats.void') }}</div>
        </div>
      </div>

      <!-- Draft -->
      <div class="stat-card draft-card" @click="$emit('filter-status', '6')">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.draft }}</div>
          <div class="stat-label">{{ t('submittal.status.draft') }}</div>
          <div class="stat-desc">{{ t('submittal.stats.draft') }}</div>
        </div>
      </div>

      <!-- In Review -->
      <div class="stat-card review-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.inReview }}</div>
          <div class="stat-label">{{ t('submittal.stats.inReview') }}</div>
          <div class="stat-desc">{{ t('submittal.stats.inReview') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'SubmittalStats',
  setup() {
    const { t } = useI18n()
    return { t }
  },
  props: {
    stats: {
      type: Object,
      default: () => ({
        total: 0,
        required: 0,
        open: 0,
        closed: 0,
        void: 0,
        draft: 0,
        inReview: 0
      })
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['filter-status']
};
</script>

<style scoped>
.submittal-stats {
  margin-bottom: 24px;
}

/* 骨架屏加载 */
.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.skeleton-card {
  height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 12px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

/* 统计卡片 */
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  transition: width 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card:hover::before {
  width: 100%;
  opacity: 0.1;
}

/* 各类型卡片颜色 */
.total-card::before { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.required-card::before { background: #f59e0b; }
.open-card::before { background: #3b82f6; }
.closed-card::before { background: #10b981; }
.void-card::before { background: #ef4444; }
.draft-card::before { background: #6b7280; }
.review-card::before { background: #8b5cf6; }

/* 图标 */
.stat-icon {
  font-size: 40px;
  line-height: 1;
  flex-shrink: 0;
}

/* 内容区域 */
.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 2px;
}

.stat-desc {
  font-size: 12px;
  color: #9ca3af;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .stat-card {
    padding: 16px;
    gap: 12px;
  }

  .stat-icon {
    font-size: 32px;
  }

  .stat-value {
    font-size: 24px;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
