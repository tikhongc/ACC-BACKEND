<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="700px"
    :before-close="handleClose">
    
    <div v-if="resourceData" class="resource-details">
      
      <!-- basicInfo -->
      <div class="detail-section">
        <h3>
          <icon-file />
          Basic Information
        </h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>File Name:</label>
            <span>{{ resourceData.name || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>File Type:</label>
            <el-tag :type="getFileTypeTagType(resourceData.file_type)" size="small">
              {{ resourceData.file_type }}
            </el-tag>
          </div>
          <div class="detail-item">
            <label>Version:</label>
            <span>{{ resourceData.version || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>Resource ID:</label>
            <span class="resource-id">{{ resourceData.id || '-' }}</span>
          </div>
          <div class="detail-item full-width">
            <label>URN:</label>
            <div class="urn-content">
              {{ resourceData.urn || '-' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Status Information -->
      <div class="detail-section">
        <h3>
          <icon-settings />
          Status Information
        </h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>File Status:</label>
            <StatusTag :status="resourceData.status_type" :text="resourceData.status" />
          </div>
          <div class="detail-item">
            <label>Is Deleted:</label>
            <el-tag :type="resourceData.is_deleted ? 'danger' : 'success'" size="small">
              {{ resourceData.is_deleted ? 'Deleted' : 'Normal' }}
            </el-tag>
          </div>
          <div class="detail-item full-width" v-if="resourceData.parent_folder_urn">
            <label>Parent Folder URN:</label>
            <div class="urn-content">
              {{ resourceData.parent_folder_urn }}
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Attributes -->
      <div class="detail-section" v-if="resourceData.custom_attributes && resourceData.custom_attributes.length > 0">
        <h3>
          <icon-tag />
          Custom Attributes ({{ resourceData.custom_attributes_count }})
        </h3>
        <div class="custom-attributes">
          <div 
            v-for="(attribute, index) in resourceData.custom_attributes" 
            :key="index"
            class="attribute-item">
            <div class="attribute-header">
              <strong>{{ attribute.name || `Attribute ${index + 1}` }}</strong>
              <el-tag v-if="attribute.type" type="info" size="small">{{ attribute.type }}</el-tag>
            </div>
            <div class="attribute-value">
              {{ attribute.value || '-' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Review Status -->
      <div class="detail-section" v-if="resourceData.approval_status && Object.keys(resourceData.approval_status).length > 0">
        <h3>
          <icon-check-circle />
          Review Status
        </h3>
        <div class="approval-status">
          <div 
            v-for="(value, key) in resourceData.approval_status" 
            :key="key"
            class="approval-item">
            <label>{{ formatApprovalKey(key) }}:</label>
            <span>{{ formatApprovalValue(value) }}</span>
          </div>
        </div>
      </div>

      <!-- Display Information -->
      <div class="detail-section">
        <h3>
          <icon-info-circle />
          Display Information
        </h3>
        <div class="detail-grid">
          <div class="detail-item full-width">
            <label>Display Name:</label>
            <span>{{ resourceData.display_name || '-' }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Raw Data Display -->
    <div class="detail-section" v-if="showRawData">
      <h3>
        <icon-code />
        Raw Data
        <el-button type="text" size="small" @click="copyRawData">
          <icon-copy />
          Copy
        </el-button>
      </h3>
      <div class="raw-data">
        <pre>{{ JSON.stringify(resourceData.raw_data || resourceData, null, 2) }}</pre>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showRawData = !showRawData">
          <icon-code />
          {{ showRawData ? 'Hide' : 'Show' }} Raw Data
        </el-button>
        <el-button type="primary" @click="handleClose">Close</el-button>
      </div>
    </template>

  </el-dialog>
</template>

<script>
import StatusTag from './StatusTag.vue'
import { 
  IconFile,
  IconSettings,
  IconTag,
  IconCheckCircle,
  IconInfoCircle,
  IconCode,
  IconCopy
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'ResourceDetailsDialog',
  components: {
    StatusTag,
    IconFile,
    IconSettings,
    IconTag,
    IconCheckCircle,
    IconInfoCircle,
    IconCode,
    IconCopy
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    resourceData: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      showRawData: false
    }
  },
  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    dialogTitle() {
      return `資源詳情 - ${this.resourceData?.name || '未知資源'}`
    }
  },
  methods: {
    handleClose() {
      this.visible = false
      this.showRawData = false
    },
    
    getFileTypeTagType(fileType) {
      const typeMap = {
        'PDF': 'danger',
        'DWG': 'primary',
        'RVT': 'success',
        'DOC': 'warning',
        'DOCX': 'warning',
        'XLS': 'info',
        'XLSX': 'info',
        'JPG': 'danger',
        'PNG': 'danger'
      }
      return typeMap[fileType] || ''
    },
    
    formatApprovalKey(key) {
      // 将驼峰命名转换为可读格式
      return key.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim()
    },
    
    formatApprovalValue(value) {
      if (value === null || value === undefined) return '-'
      if (typeof value === 'boolean') return value ? '是' : '否'
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    },
    
    async copyRawData() {
      try {
        const data = JSON.stringify(this.resourceData.raw_data || this.resourceData, null, 2)
        await navigator.clipboard.writeText(data)
        this.$message.success('原始數據已複製到剪貼板')
      } catch (error) {
        console.error('複製失敗:', error)
        this.$message.error('複製失敗')
      }
    }
  }
}
</script>

<style scoped>
.resource-details {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.detail-item span {
  font-size: 14px;
  color: #303133;
  word-break: break-word;
}

.resource-id,
.urn-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  word-break: break-all;
}

/* 自订属性样式 */
.custom-attributes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attribute-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.attribute-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.attribute-header strong {
  color: #303133;
  font-size: 14px;
}

.attribute-value {
  color: #606266;
  font-size: 14px;
  word-break: break-word;
}

/* 审核状态样式 */
.approval-status {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.approval-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #67c23a;
}

.approval-item label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.approval-item span {
  font-size: 14px;
  color: #303133;
}

/* 原始数据样式 */
.raw-data {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.raw-data pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .approval-status {
    grid-template-columns: 1fr;
  }
}
</style>
