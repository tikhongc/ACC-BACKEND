<template>
  <div class="custom-attributes-view">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 错误状态 -->
    <el-alert
      v-else-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
    />

    <!-- 无自定义属性 -->
    <div v-else-if="!hasCustomAttributes" class="no-attributes">
      <el-empty
        description="No custom attributes configured for this folder"
        :image-size="80"
      />
    </div>

    <!-- 自定义属性列表 -->
    <div v-else class="attributes-content">
      <!-- 属性摘要 -->
      <div class="attributes-summary">
        <div class="summary-stats">
          <el-tag type="info" size="small">
            <el-icon><Document /></el-icon>
            Total: {{ summary.total_attributes || 0 }}
          </el-tag>
          <el-tag v-if="summary.required_attributes > 0" type="warning" size="small">
            <el-icon><Star /></el-icon>
            Required: {{ summary.required_attributes }}
          </el-tag>
        </div>
      </div>

      <!-- 属性定义列表 -->
      <div class="attributes-list">
        <div
          v-for="attribute in attributes"
          :key="attribute.id"
          class="attribute-item"
        >
          <div class="attribute-header">
            <div class="attribute-name">
              <el-icon class="attribute-icon">
                <component :is="getAttributeIcon(attribute.type)" />
              </el-icon>
              <span class="name-text">{{ attribute.displayName }}</span>
              <el-tag
                :type="getAttributeTypeTag(attribute.type)"
                size="small"
                class="type-tag"
              >
                {{ attribute.typeDisplayName }}
              </el-tag>
            </div>
            
            <div class="attribute-actions">
              <el-tooltip
                v-if="attribute.description"
                :content="attribute.description"
                placement="top"
              >
                <el-icon class="info-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </div>

          <div class="attribute-details">
            <!-- basicInfo -->
            <div class="detail-row">
              <span class="detail-label">ID:</span>
              <span class="detail-value">{{ attribute.id }}</span>
            </div>

            <!-- 类型特定信息 -->
            <div v-if="attribute.type === 'string' && (attribute.minLength || attribute.maxLength)" class="detail-row">
              <span class="detail-label">Length Limit:</span>
              <span class="detail-value">
                {{ attribute.minLength || 0 }} - {{ attribute.maxLength || 'Unlimited' }}
              </span>
            </div>

            <!-- 默认值 -->
            <div v-if="attribute.defaultValue" class="detail-row">
              <span class="detail-label">Default Value:</span>
              <span class="detail-value">{{ attribute.defaultValue }}</span>
            </div>

            <!-- 选项值 (array类型) -->
            <div v-if="attribute.hasOptions" class="detail-row">
              <span class="detail-label">Options:</span>
              <div class="options-list">
                <el-tag
                  v-for="option in attribute.arrayValues"
                  :key="option"
                  size="small"
                  type="success"
                  class="option-tag"
                >
                  {{ option }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination && pagination.totalResults > pagination.limit" class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pagination.limit"
          :total="pagination.totalResults"
          layout="prev, pager, next, total"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import {
  Document,
  Star,
  InfoFilled,
  Edit,
  Calendar,
  List,
  Key
} from '@element-plus/icons-vue'

export default {
  name: 'CustomAttributesView',
  components: {
    Document,
    Star,
    InfoFilled,
    Edit,
    Calendar,
    List,
    Key
  },
  props: {
    projectId: {
      type: String,
      required: true
    },
    folderId: {
      type: String,
      required: true
    },
    autoLoad: {
      type: Boolean,
      default: true
    }
  },
  emits: ['loaded', 'error'],
  setup(props, { emit }) {
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const attributes = ref([])
    const summary = ref({})
    const pagination = ref(null)
    const currentPage = ref(1)

    // 计算属性
    const hasCustomAttributes = computed(() => {
      return attributes.value && attributes.value.length > 0
    })

    // 获取属性图标
    const getAttributeIcon = (type) => {
      const iconMap = {
        'string': 'Edit',
        'array': 'List',
        'date': 'Calendar',
        'number': 'Key',
        'boolean': 'Key'
      }
      return iconMap[type] || 'Edit'
    }

    // 获取属性类型标签样式
    const getAttributeTypeTag = (type) => {
      const tagMap = {
        'string': 'primary',
        'array': 'success',
        'date': 'warning',
        'number': 'info',
        'boolean': 'danger'
      }
      return tagMap[type] || 'primary'
    }

    // 加载自定义属性定义
    const loadCustomAttributes = async (page = 1) => {
      if (!props.projectId || !props.folderId) {
        return
      }

      loading.value = true
      error.value = ''

      try {
        // cancel之前的请求
        if (abortController) {
          abortController.abort()
        }
        
        // 创建新的cancel控制器
        abortController = new AbortController()
        
        const limit = 20
        const offset = (page - 1) * limit

        // URL编码文件夹ID
        const encodedFolderId = encodeURIComponent(props.folderId)
        
        const response = await axios.get(
          `/api/custom-attributes/projects/${props.projectId}/folders/${encodedFolderId}/definitions`,
          {
            params: { limit, offset },
            signal: abortController.signal
          }
        )

        if (response.data.error) {
          throw new Error(response.data.error)
        }

        attributes.value = response.data.results || []
        summary.value = response.data.summary || {}
        pagination.value = response.data.pagination || null

        emit('loaded', {
          attributes: attributes.value,
          summary: summary.value,
          hasAttributes: hasCustomAttributes.value
        })

      } catch (err) {
        // 如果是cancel请求，不显示错误
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          console.log('🚫 CustomAttributesView - Request cancelled')
          return
        }
        
        console.error('Failed to load custom attributes:', err)
        error.value = err.response?.data?.error || err.message || 'Failed to load custom attributes'
        emit('error', error.value)
      } finally {
        loading.value = false
        abortController = null
      }
    }

    // 处理分页变化
    const handlePageChange = (page) => {
      currentPage.value = page
      loadCustomAttributes(page)
    }

    // 监听属性变化
    watch(
      () => [props.projectId, props.folderId],
      () => {
        if (props.autoLoad) {
          currentPage.value = 1
          loadCustomAttributes()
        }
      },
      { immediate: false }
    )

    // cancel请求的控制器
    let abortController = null
    
    // 组件挂载时加载数据
    onMounted(() => {
      if (props.autoLoad) {
        loadCustomAttributes()
      }
    })
    
    // 组件卸载时清理
    onUnmounted(() => {
      console.log('🧹 CustomAttributesView - Component unmounted, cleaning up resources')
      if (abortController) {
        abortController.abort()
        abortController = null
      }
      // 清理状态
      attributes.value = []
      summary.value = {}
      pagination.value = null
      loading.value = false
      error.value = ''
    })

    // 公开方法
    const refresh = () => {
      currentPage.value = 1
      loadCustomAttributes()
    }

    return {
      loading,
      error,
      attributes,
      summary,
      pagination,
      currentPage,
      hasCustomAttributes,
      getAttributeIcon,
      getAttributeTypeTag,
      loadCustomAttributes,
      handlePageChange,
      refresh
    }
  }
}
</script>

<style scoped>
.custom-attributes-view {
  width: 100%;
}

.loading-section {
  padding: 16px;
}

.no-attributes {
  padding: 20px;
  text-align: center;
}

.attributes-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attributes-summary {
  padding: 12px;
  background: #F8F9FA;
  border-radius: 6px;
  border-left: 4px solid #409EFF;
}

.summary-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.attributes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attribute-item {
  border: 1px solid #E4E7ED;
  border-radius: 6px;
  padding: 16px;
  background: #FFFFFF;
  transition: all 0.3s ease;
}

.attribute-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.attribute-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.attribute-name {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.attribute-icon {
  color: #409EFF;
  font-size: 16px;
}

.name-text {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.type-tag {
  margin-left: 8px;
}

.attribute-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  color: #909399;
  cursor: help;
  font-size: 14px;
}

.attribute-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 24px;
  border-left: 2px solid #F0F0F0;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.detail-label {
  color: #909399;
  font-weight: 500;
  min-width: 80px;
  flex-shrink: 0;
}

.detail-value {
  color: #606266;
  flex: 1;
}

.options-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.option-tag {
  font-size: 12px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .attribute-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .attribute-name {
    width: 100%;
  }

  .attribute-details {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #F0F0F0;
    padding-top: 12px;
    margin-top: 8px;
  }

  .detail-row {
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    min-width: auto;
  }

  .summary-stats {
    justify-content: center;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .attributes-summary {
    background: #1A1A1A;
    border-left-color: #409EFF;
  }

  .attribute-item {
    background: #1E1E1E;
    border-color: #3C3C3C;
  }

  .attribute-item:hover {
    border-color: #409EFF;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }

  .attribute-details {
    border-left-color: #3C3C3C;
  }
}
</style>
