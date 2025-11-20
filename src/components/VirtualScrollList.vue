<template>
  <div 
    ref="containerRef" 
    class="virtual-scroll-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <!-- 虚拟滚动区域 -->
    <div 
      class="virtual-scroll-content"
      :style="{ 
        height: totalHeight + 'px',
        paddingTop: offsetY + 'px'
      }"
    >
      <!-- 渲染可见项目 -->
      <div
        v-for="(item, index) in visibleItems"
        :key="item.id || index"
        class="virtual-scroll-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item" :index="startIndex + index" />
      </div>
    </div>
    
    <!-- 加载更多指示器 -->
    <div v-if="loading" class="loading-indicator">
      <el-skeleton :rows="3" animated />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export default {
  name: 'VirtualScrollList',
  props: {
    // 数据列表
    items: {
      type: Array,
      default: () => []
    },
    
    // 每项高度
    itemHeight: {
      type: Number,
      default: 60
    },
    
    // 容器高度
    containerHeight: {
      type: Number,
      default: 400
    },
    
    // 缓冲区大小（渲染额外的项目数）
    bufferSize: {
      type: Number,
      default: 5
    },
    
    // 是否正在加载
    loading: {
      type: Boolean,
      default: false
    },
    
    // 是否启用无限滚动
    infiniteScroll: {
      type: Boolean,
      default: false
    },
    
    // 触发加载更多的距离
    loadMoreThreshold: {
      type: Number,
      default: 100
    }
  },
  
  emits: ['load-more', 'scroll'],
  
  setup(props, { emit }) {
    const containerRef = ref(null)
    const scrollTop = ref(0)
    
    // 计算总高度
    const totalHeight = computed(() => {
      return props.items.length * props.itemHeight
    })
    
    // 计算可见区域能显示的项目数量
    const visibleCount = computed(() => {
      return Math.ceil(props.containerHeight / props.itemHeight) + props.bufferSize * 2
    })
    
    // 计算开始索引
    const startIndex = computed(() => {
      const index = Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize
      return Math.max(0, index)
    })
    
    // 计算结束索引
    const endIndex = computed(() => {
      const index = startIndex.value + visibleCount.value
      return Math.min(props.items.length, index)
    })
    
    // 计算可见项目
    const visibleItems = computed(() => {
      return props.items.slice(startIndex.value, endIndex.value)
    })
    
    // 计算偏移量
    const offsetY = computed(() => {
      return startIndex.value * props.itemHeight
    })
    
    // 处理滚动事件
    const handleScroll = (event) => {
      const target = event.target
      scrollTop.value = target.scrollTop
      
      emit('scroll', {
        scrollTop: scrollTop.value,
        scrollHeight: target.scrollHeight,
        clientHeight: target.clientHeight
      })
      
      // 无限滚动检测
      if (props.infiniteScroll && !props.loading) {
        const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight
        if (distanceToBottom <= props.loadMoreThreshold) {
          emit('load-more')
        }
      }
    }
    
    // 滚动到指定项目
    const scrollToItem = (index) => {
      if (containerRef.value) {
        const targetScrollTop = index * props.itemHeight
        containerRef.value.scrollTop = targetScrollTop
      }
    }
    
    // 滚动到顶部
    const scrollToTop = () => {
      if (containerRef.value) {
        containerRef.value.scrollTop = 0
      }
    }
    
    // 滚动到底部
    const scrollToBottom = () => {
      if (containerRef.value) {
        containerRef.value.scrollTop = totalHeight.value
      }
    }
    
    // 监听数据变化，重置滚动位置
    watch(() => props.items.length, (newLength, oldLength) => {
      // 如果是新增数据且在底部附近，保持在底部
      if (newLength > oldLength && containerRef.value) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.value
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        
        if (isNearBottom) {
          setTimeout(() => {
            scrollToBottom()
          }, 0)
        }
      }
    })
    
    return {
      containerRef,
      totalHeight,
      visibleItems,
      startIndex,
      offsetY,
      handleScroll,
      scrollToItem,
      scrollToTop,
      scrollToBottom
    }
  }
}
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-scroll-content {
  position: relative;
  width: 100%;
}

.virtual-scroll-item {
  width: 100%;
  box-sizing: border-box;
}

.loading-indicator {
  padding: 20px;
  text-align: center;
  background: #f8f9fa;
  border-top: 1px solid #e4e7ed;
}

/* 滚动条样式 */
.virtual-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .virtual-scroll-container::-webkit-scrollbar {
    width: 4px;
  }
}
</style>
