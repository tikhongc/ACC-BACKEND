<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="1000px"
    :before-close="handleClose">
    
    <div class="package-resources">
      
      <!-- 包信息概览 -->
      <div class="package-overview" v-if="packageData">
        <div class="overview-item">
          <label>包名稱:</label>
          <span>{{ packageData.name }}</span>
        </div>
        <div class="overview-item">
          <label>文件數量:</label>
          <span>{{ packageData.resource_count }} 個文件</span>
        </div>
        <div class="overview-item">
          <label>狀態:</label>
          <StatusTag :status="packageData.status_type" :text="packageData.status" />
        </div>
        <div class="overview-item">
          <label>版本類型:</label>
          <el-tag :type="packageData.version_type === 'CURRENT' ? 'success' : 'info'">
            {{ packageData.version_type }}
          </el-tag>
        </div>
      </div>

      <!-- 加载和刷新按钮 -->
      <div class="resources-toolbar">
        <el-button 
          type="primary" 
          @click="loadResources" 
          :loading="loading"
          :disabled="!packageData">
          <icon-refresh />
          {{ resources.length > 0 ? '刷新資源' : '載入資源' }}
        </el-button>
        
        <div class="toolbar-info" v-if="resourcesStats">
          <span>共 {{ resourcesStats.total_resources }} 個資源</span>
          <span v-if="resourcesStats.deleted_resources > 0">
            ({{ resourcesStats.deleted_resources }} 個已刪除)
          </span>
        </div>
      </div>

      <!-- 资源统计卡片 -->
      <div class="stats-cards" v-if="resourcesStats && resources.length > 0">
        <div class="stat-card">
          <div class="stat-icon active">
            <icon-file />
          </div>
          <div class="stat-info">
            <h4>{{ resourcesStats.active_resources }}</h4>
            <p>活躍文件</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon deleted">
            <icon-delete />
          </div>
          <div class="stat-info">
            <h4>{{ resourcesStats.deleted_resources }}</h4>
            <p>已刪除文件</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon attributes">
            <icon-tag />
          </div>
          <div class="stat-info">
            <h4>{{ resourcesStats.with_custom_attributes }}</h4>
            <p>有自訂屬性</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon approval">
            <icon-check-circle />
          </div>
          <div class="stat-info">
            <h4>{{ resourcesStats.with_approval_status }}</h4>
            <p>有審核狀態</p>
          </div>
        </div>
      </div>

      <!-- 文件类型分布 -->
      <div class="file-types" v-if="resourcesStats && resourcesStats.file_type_counts && Object.keys(resourcesStats.file_type_counts).length > 0">
        <h4>
          <icon-apps />
          文件類型分布
        </h4>
        <div class="type-tags">
          <el-tag 
            v-for="(count, type) in resourcesStats.file_type_counts" 
            :key="type"
            :type="getFileTypeTagType(type)"
            size="large">
            {{ type }}: {{ count }}
          </el-tag>
        </div>
      </div>

      <!-- 资源列表 -->
      <div class="resources-table" v-loading="loading">
        <el-table 
          :data="resources" 
          stripe 
          border 
          style="width: 100%"
          :default-sort="{ prop: 'version', order: 'descending' }"
          empty-text="暫無資源數據，請點擊載入資源按鈕">
          
          <el-table-column prop="name" label="文件名稱" min-width="200" show-overflow-tooltip>
            <template #default="scope">
              <div class="file-name">
                <icon-file :style="{ color: getFileTypeColor(scope.row.file_type) }" />
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="file_type" label="文件類型" width="100">
            <template #default="scope">
              <el-tag :type="getFileTypeTagType(scope.row.file_type)" size="small">
                {{ scope.row.file_type }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="version" label="版本" width="80" sortable />
          
          <el-table-column label="狀態" width="100">
            <template #default="scope">
              <StatusTag :status="scope.row.status_type" :text="scope.row.status" size="small" />
            </template>
          </el-table-column>
          
          <el-table-column label="自訂屬性" width="100">
            <template #default="scope">
              <el-tooltip v-if="scope.row.has_custom_attributes" :content="`${scope.row.custom_attributes_count} 個自訂屬性`" placement="top">
                <el-tag type="info" size="small">
                  {{ scope.row.custom_attributes_count }}
                </el-tag>
              </el-tooltip>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="審核狀態" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.has_approval_status" type="success" size="small">
                有審核
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button type="text" size="small" @click="viewResourceDetails(scope.row)">
                <icon-eye />
                詳情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

    </div>

    <!-- 资源详情对话框 -->
    <ResourceDetailsDialog 
      v-model="showResourceDialog"
      :resource-data="selectedResource" />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">關閉</el-button>
      </div>
    </template>

  </el-dialog>
</template>

<script>
import axios from 'axios'
import StatusTag from './StatusTag.vue'
import ResourceDetailsDialog from './ResourceDetailsDialog.vue'
import { 
  IconRefresh,
  IconFile,
  IconDelete,
  IconTag,
  IconCheckCircle,
  IconApps,
  IconEye
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'PackageResourcesDialog',
  components: {
    StatusTag,
    ResourceDetailsDialog,
    IconRefresh,
    IconFile,
    IconDelete,
    IconTag,
    IconCheckCircle,
    IconApps,
    IconEye
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    packageData: {
      type: Object,
      default: null
    },
    projectId: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      loading: false,
      resources: [],
      resourcesStats: null,
      showResourceDialog: false,
      selectedResource: null
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
      return `文件包資源 - ${this.packageData?.name || '未知包'}`
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.packageData && this.resources.length === 0) {
        // 对话框打开时自动加载资源
        this.loadResources()
      }
    }
  },
  methods: {
    async loadResources() {
      if (!this.packageData || !this.projectId) {
        this.$message.error('缺少必要的包信息或項目ID')
        return
      }
      
      this.loading = true
      try {
        const response = await axios.get(`/api/submittals/jarvis/packages/${this.packageData.id}/resources`, {
          params: { projectId: this.projectId }
        })
        
        if (response.data.success) {
          this.resources = response.data.resources
          this.resourcesStats = response.data.stats
          this.$message.success(`成功載入 ${this.resources.length} 個資源`)
        } else {
          throw new Error(response.data.error || '獲取包資源失敗')
        }
      } catch (error) {
        console.error('加載包資源失敗:', error)
        this.$message.error('加載包資源失敗: ' + error.message)
        this.resources = []
        this.resourcesStats = null
      } finally {
        this.loading = false
      }
    },
    
    viewResourceDetails(resource) {
      this.selectedResource = resource
      this.showResourceDialog = true
    },
    
    handleClose() {
      this.visible = false
      // 清理数据
      this.resources = []
      this.resourcesStats = null
      this.selectedResource = null
    },
    
    getFileTypeColor(fileType) {
      const colorMap = {
        'PDF': '#f56c6c',
        'DWG': '#409eff',
        'RVT': '#67c23a',
        'DOC': '#e6a23c',
        'DOCX': '#e6a23c',
        'XLS': '#909399',
        'XLSX': '#909399',
        'JPG': '#f78989',
        'PNG': '#f78989',
        'TXT': '#606266'
      }
      return colorMap[fileType] || '#909399'
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
    }
  }
}
</script>

<style scoped>
.package-resources {
  max-height: 700px;
  overflow-y: auto;
}

/* 包概览样式 */
.package-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.overview-item label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.overview-item span {
  font-size: 14px;
  color: #303133;
}

/* 工具栏样式 */
.resources-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px;
  background: #f0f2f5;
  border-radius: 6px;
}

.toolbar-info {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.stat-icon.active {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.deleted {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stat-icon.attributes {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.approval {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stat-info h4 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stat-info p {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #909399;
}

/* 文件类型分布样式 */
.file-types {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.file-types h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 资源表格样式 */
.resources-table {
  border-radius: 8px;
  overflow: hidden;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-muted {
  color: #c0c4cc;
}

.dialog-footer {
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .package-overview {
    grid-template-columns: 1fr;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .resources-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
