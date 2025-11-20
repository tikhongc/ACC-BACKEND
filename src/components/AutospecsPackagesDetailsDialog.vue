<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="800px"
    :before-close="handleClose">
    
    <div v-if="data && dialogType === 'autospecs'" class="autospecs-details">
      
      <!-- basicInfo -->
      <div class="detail-section">
        <h3>
          <icon-info-circle />
          basicInfo
        </h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>記錄編號:</label>
            <span>{{ data.id || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>描述:</label>
            <span>{{ data.description || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>規範編號:</label>
            <span>{{ data.spec_number || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>規範名稱:</label>
            <span>{{ data.spec_name || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 分類信息 -->
      <div class="detail-section">
        <h3>
          <icon-tag />
          分類信息
        </h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>分項編碼:</label>
            <span>{{ data.division_code || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>分項名稱:</label>
            <span>{{ data.division_name || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>記錄類型:</label>
            <StatusTag 
              v-if="data.spec_category"
              :status="data.spec_category_type" 
              :text="data.spec_category" />
            <span v-else>-</span>
          </div>
          <div class="detail-item">
            <label>章節標題:</label>
            <span>{{ data.submittals_heading || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 日期和狀態 -->
      <div class="detail-section">
        <h3>
          <icon-calendar />
          日期和狀態
        </h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>目標日期:</label>
            <span v-if="data.target_date">
              {{ formatDate(data.target_date) }}
              <el-tag v-if="data.is_overdue" type="danger" size="small" style="margin-left: 8px">
                逾期
              </el-tag>
            </span>
            <span v-else class="text-muted">未設定</span>
          </div>
          <div class="detail-item">
            <label>版本名稱:</label>
            <span>{{ data.version_name || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 其他信息 -->
      <div class="detail-section">
        <h3>
          <icon-file />
          其他信息
        </h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>段落編號:</label>
            <span>{{ data.para_code || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>目標群組:</label>
            <span>{{ data.target_group || '-' }}</span>
          </div>
          <div class="detail-item full-width" v-if="data.user_notes">
            <label>用戶備註:</label>
            <div class="notes-content">
              {{ data.user_notes }}
            </div>
          </div>
        </div>
      </div>

    </div>

    <div v-else-if="data && dialogType === 'package'" class="package-details">
      
      <!-- 包basicInfo -->
      <div class="detail-section">
        <h3>
          <icon-folder />
          包basicInfo
        </h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>包 ID:</label>
            <span>{{ data.id || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>顯示編號:</label>
            <span>{{ data.display_id || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>包名稱:</label>
            <span>{{ data.name || '-' }}</span>
          </div>
          <div class="detail-item full-width">
            <label>描述:</label>
            <span>{{ data.description || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 包狀態信息 -->
      <div class="detail-section">
        <h3>
          <icon-settings />
          狀態信息
        </h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>鎖定狀態:</label>
            <StatusTag 
              :status="data.status_type" 
              :text="data.status" />
          </div>
          <div class="detail-item">
            <label>版本類型:</label>
            <el-tag :type="data.version_type === 'CURRENT' ? 'success' : 'info'">
              {{ data.version_type }}
            </el-tag>
          </div>
          <div class="detail-item">
            <label>文件數量:</label>
            <span>{{ data.resource_count || 0 }} 個文件</span>
          </div>
        </div>
      </div>

      <!-- 時間信息 -->
      <div class="detail-section">
        <h3>
          <icon-clock-circle />
          時間信息
        </h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>創建時間:</label>
            <span>{{ formatDate(data.created_at) }}</span>
          </div>
          <div class="detail-item">
            <label>創建者:</label>
            <span>{{ data.created_by || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>更新時間:</label>
            <span>{{ formatDate(data.updated_at) }}</span>
          </div>
          <div class="detail-item">
            <label>更新者:</label>
            <span>{{ data.updated_by || '-' }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- 原始数据展示 -->
    <div class="detail-section" v-if="showRawData">
      <h3>
        <icon-code />
        原始數據
        <el-button type="text" size="small" @click="copyRawData">
          <icon-copy />
          複製
        </el-button>
      </h3>
      <div class="raw-data">
        <pre>{{ JSON.stringify(data.raw_data || data, null, 2) }}</pre>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showRawData = !showRawData">
          <icon-code />
          {{ showRawData ? '隱藏' : '顯示' }}原始數據
        </el-button>
        <el-button type="primary" @click="handleClose">關閉</el-button>
      </div>
    </template>

  </el-dialog>
</template>

<script>
import StatusTag from './StatusTag.vue'
import { 
  IconInfoCircle,
  IconTag,
  IconCalendar,
  IconFile,
  IconFolder,
  IconSettings,
  IconClockCircle,
  IconCode,
  IconCopy
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'AutospecsPackagesDetailsDialog',
  components: {
    StatusTag,
    IconInfoCircle,
    IconTag,
    IconCalendar,
    IconFile,
    IconFolder,
    IconSettings,
    IconClockCircle,
    IconCode,
    IconCopy
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: null
    },
    dialogType: {
      type: String,
      default: 'autospecs' // 'autospecs' or 'package'
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
      if (this.dialogType === 'package') {
        return `Package 詳情 - ${this.data?.name || '未知包'}`
      }
      return `Autospecs 記錄詳情 - ${this.data?.display_name || '未知記錄'}`
    }
  },
  methods: {
    handleClose() {
      this.visible = false
      this.showRawData = false
    },
    
    formatDate(dateString) {
      if (!dateString) return '-'
      try {
        return new Date(dateString).toLocaleString('zh-TW')
      } catch {
        return dateString
      }
    },
    
    async copyRawData() {
      try {
        const data = JSON.stringify(this.data.raw_data || this.data, null, 2)
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
.autospecs-details,
.package-details {
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

.notes-content {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
  white-space: pre-wrap;
}

.text-muted {
  color: #909399 !important;
}

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
}
</style>
