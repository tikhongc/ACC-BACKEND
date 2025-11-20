<template>
  <el-card class="query-info-card" shadow="never">
    <template #header>
      <div class="card-header">
        <h3>🔍 {{ title || t('queryInfo.defaultTitle') }}</h3>
      </div>
    </template>
    
    <el-descriptions :column="column" border>
      <!-- API端点信息 -->
      <el-descriptions-item v-if="apiEndpoint" :label="t('queryInfo.apiEndpoint')">
        <el-link 
          :href="apiEndpoint" 
          target="_blank" 
          type="primary"
          class="api-endpoint-link">
          {{ apiEndpoint }}
        </el-link>
      </el-descriptions-item>
      
      <!-- 查询描述 -->
      <el-descriptions-item v-if="description" :label="t('queryInfo.queryDescription')">
        <span class="query-description">{{ description }}</span>
      </el-descriptions-item>
      
      <!-- 查询参数 -->
      <el-descriptions-item v-if="hasQueryParams" :label="t('queryInfo.queryParams')">
        <div class="query-params">
          <el-tag 
            v-for="(value, key) in queryParams" 
            :key="key" 
            size="small" 
            :type="getParamTagType(key)"
            style="margin: 2px;">
            {{ key }}: {{ formatParamValue(value) }}
          </el-tag>
        </div>
      </el-descriptions-item>
      
      <!-- 结果统计 -->
      <el-descriptions-item v-if="resultCount !== null" :label="t('queryInfo.resultCount')">
        <el-tag type="success" size="large">
          {{ resultCount }} {{ resultUnit || t('queryInfo.defaultUnit') }}
        </el-tag>
      </el-descriptions-item>
      
      <!-- 响应时间 -->
      <el-descriptions-item v-if="responseTime" :label="t('queryInfo.responseTime')">
        <el-tag type="info" size="small">{{ responseTime }}</el-tag>
      </el-descriptions-item>
      
      <!-- Check Time -->
      <el-descriptions-item v-if="queryTime" :label="t('queryInfo.queryTime')">
        <span class="query-time">{{ formatQueryTime(queryTime) }}</span>
      </el-descriptions-item>
      
      <!-- 自定义字段 -->
      <el-descriptions-item 
        v-for="(field, index) in customFields" 
        :key="index"
        :label="field.label">
        <component 
          :is="field.component || 'span'"
          v-bind="field.props"
          :class="field.class">
          {{ field.value }}
        </component>
      </el-descriptions-item>
    </el-descriptions>
    
    <!-- 额外信息区域 -->
    <div v-if="$slots.extra || extraInfo" class="extra-info">
      <slot name="extra">
        <div v-if="extraInfo" v-html="extraInfo"></div>
      </slot>
    </div>
    
    <!-- 操作按钮区域 -->
    <div v-if="$slots.actions || actions.length > 0" class="actions-area">
      <slot name="actions">
        <div class="actions-buttons">
          <el-button
            v-for="(action, index) in actions"
            :key="index"
            :type="action.type || 'default'"
            :size="action.size || 'small'"
            :icon="action.icon"
            :loading="action.loading"
            @click="handleAction(action)">
            {{ action.text }}
          </el-button>
        </div>
      </slot>
    </div>
  </el-card>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { formatQueryTime } from '@/utils/dateUtils'

export default {
  name: 'QueryInfoCard',
  setup() {
    const { t } = useI18n()
    return { t }
  },
  props: {
    // 卡片标题
    title: {
      type: String,
      default: '查询信息'
    },
    
    // 描述列数
    column: {
      type: Number,
      default: 2
    },
    
    // API端点
    apiEndpoint: {
      type: String,
      default: ''
    },
    
    // 查询描述
    description: {
      type: String,
      default: ''
    },
    
    // 查询参数
    queryParams: {
      type: Object,
      default: () => ({})
    },
    
    // 结果数量
    resultCount: {
      type: Number,
      default: null
    },
    
    // 结果单位
    resultUnit: {
      type: String,
      default: 'records'
    },
    
    // 响应时间
    responseTime: {
      type: String,
      default: ''
    },
    
    // Check Time
    queryTime: {
      type: [String, Date, Number],
      default: null
    },
    
    // 自定义字段
    customFields: {
      type: Array,
      default: () => []
    },
    
    // 额外信息HTML
    extraInfo: {
      type: String,
      default: ''
    },
    
    // 操作按钮
    actions: {
      type: Array,
      default: () => []
    }
  },
  
  computed: {
    hasQueryParams() {
      return this.queryParams && Object.keys(this.queryParams).length > 0
    }
  },
  
  methods: {
    // 格式化参数值
    formatParamValue(value) {
      if (value === null || value === undefined) {
        return 'null'
      }
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false'
      }
      if (typeof value === 'object') {
        return JSON.stringify(value)
      }
      return String(value)
    },
    
    // 获取参数标签类型
    getParamTagType(key) {
      const typeMap = {
        'limit': 'primary',
        'offset': 'info',
        'sortOrder': 'success',
        'updatedAfter': 'warning',
        'updatedBefore': 'warning',
        'status': 'success',
        'type': 'info'
      }
      return typeMap[key] || 'default'
    },
    
    // 格式化Check Time
    formatQueryTime(time) {
      return formatQueryTime(time)
    },
    
    // 处理操作按钮点击
    handleAction(action) {
      if (typeof action.handler === 'function') {
        action.handler()
      } else if (action.event) {
        this.$emit(action.event, action)
      }
    }
  }
}
</script>

<style scoped>
.query-info-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.api-endpoint-link {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  word-break: break-all;
}

.query-description {
  font-size: 14px;
  color: var(--color-text-regular);
  line-height: 1.4;
}

.query-params {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
}

.query-time {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  background-color: var(--color-fill-light);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.extra-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
}

.actions-area {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
}

.actions-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .query-params {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .actions-buttons {
    flex-direction: column;
  }
}
</style>
