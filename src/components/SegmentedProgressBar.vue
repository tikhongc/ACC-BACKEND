<template>
  <div class="segmented-progress-bar" :class="`size-${size}`">
    <div class="segments-container">
      <div 
        v-for="(segment, index) in segments" 
        :key="index"
        class="segment"
        :class="[
          {
            'active': index < activeSegments,
            'current': index === activeSegments - 1
          },
          getSegmentClass(index + 1)
        ]"
        :title="getSegmentTooltip(index + 1)"
      >
        <div class="segment-inner"></div>
      </div>
    </div>
    <div v-if="showLabels" class="labels-container">
      <span 
        v-for="(label, index) in segmentLabels" 
        :key="index"
        class="segment-label"
        :class="{ 'active-label': index < activeSegments }"
      >
        {{ label }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SegmentedProgressBar',
  mounted() {
    // 调试信息：确保组件正确挂载
    console.log('SegmentedProgressBar mounted with level:', this.level, 'size:', this.size)
    console.log('Active segments:', this.activeSegments)
    console.log('Segments:', this.segments)
    console.log('Colors for each segment:', this.segments.map((_, index) => 
      index < this.activeSegments ? this.getSegmentColor(index + 1) : '#E4E7ED'
    ))
  },
  props: {
    // 当前权限级别 (1-6)
    level: {
      type: Number,
      required: true,
      validator: (value) => value >= 1 && value <= 6
    },
    // 是否显示标签
    showLabels: {
      type: Boolean,
      default: false
    },
    // 自定义段数 (默认6段对应6个权限级别)
    totalSegments: {
      type: Number,
      default: 6
    },
    // 尺寸: small, medium, large
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
  },
  computed: {
    segments() {
      return Array.from({ length: this.totalSegments }, (_, index) => index + 1)
    },
    activeSegments() {
      return Math.min(Math.max(this.level, 0), this.totalSegments)
    },
    segmentLabels() {
      const labels = ['View', 'Download', 'Mark', 'Upload', 'Edit', 'Control']
      return labels.slice(0, this.totalSegments)
    }
  },
  methods: {
    getSegmentColor(segmentLevel) {
      const colorMap = {
        1: '#909399',   // Gray - View
        2: '#409EFF',   // Blue - View/Download
        3: '#E6A23C',   // Orange - View/Download/Mark
        4: '#67C23A',   // Green - View/Download/Mark/Upload
        5: '#F56C6C',   // Red - Full Edit
        6: '#F56C6C'    // Red - Full Control
      }
      return colorMap[segmentLevel] || '#909399'
    },
    getSegmentTooltip(segmentLevel) {
      const tooltipMap = {
        1: 'View Permission',
        2: 'View/Download Permission',
        3: 'View/Download/Mark Permission',
        4: 'View/Download/Mark/Upload Permission',
        5: 'Full Edit Permission',
        6: 'Full Control Permission'
      }
      return tooltipMap[segmentLevel] || `Level ${segmentLevel}`
    },
    getSegmentClass(segmentLevel) {
      const segmentIndex = segmentLevel - 1
      if (segmentIndex < this.activeSegments) {
        return `segment-level-${segmentLevel} segment-active`
      }
      return 'segment-inactive'
    }
  }
}
</script>

<style scoped>
.segmented-progress-bar {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
}

.segments-container {
  display: flex !important;
  gap: 2px !important;
  align-items: center !important;
}

.segment {
  height: 6px !important;
  flex: 1 !important;
  border-radius: 3px !important;
  transition: all 0.3s ease !important;
  position: relative !important;
  overflow: hidden !important;
}

/* 不同尺寸 */
.segmented-progress-bar.size-small .segment {
  height: 5px !important;
  border-radius: 2.5px !important;
}

.segmented-progress-bar.size-large .segment {
  height: 8px !important;
  border-radius: 4px !important;
}

.segment.active {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.segment.current {
  animation: pulse 1.5s ease-in-out infinite;
}

/* 分段颜色 */
.segment-level-1.segment-active {
  background-color: #909399 !important; /* 灰色 - 查看 */
}

.segment-level-2.segment-active {
  background-color: #409EFF !important; /* 蓝色 - 查看/下载 */
}

.segment-level-3.segment-active {
  background-color: #E6A23C !important; /* 橙色 - 查看/下载/标记 */
}

.segment-level-4.segment-active {
  background-color: #67C23A !important; /* 绿色 - 查看/下载/标记/上传 */
}

.segment-level-5.segment-active {
  background-color: #F56C6C !important; /* 红色 - 完全编辑 */
}

.segment-level-6.segment-active {
  background-color: #F56C6C !important; /* 红色 - 完全控制 */
}

.segment-inactive {
  background-color: #E4E7ED !important; /* 未激活的灰色 */
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.segment-inner {
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.labels-container {
  display: flex;
  justify-content: space-between;
  margin-top: 2px;
}

.segment-label {
  font-size: 10px;
  color: #909399;
  text-align: center;
  flex: 1;
  transition: color 0.3s ease;
}

.segment-label.active-label {
  color: #303133;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .segment-label {
    font-size: 9px;
  }
  
  .segments-container {
    gap: 1px;
  }
}

/* 为不同容器宽度优化 */
.permission-level-container .segmented-progress-bar {
  width: 100%;
  min-width: 80px;
}

.permission-level-container .segments-container {
  min-width: 60px;
}

/* 表格内的紧凑样式 */
.table-compact .segmented-progress-bar .segment {
  height: 4px;
}

.table-compact .segmented-progress-bar .segment-label {
  display: none; /* 在表格中隐藏标签以节省空间 */
}
</style>
