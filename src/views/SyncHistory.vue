<template>
  <div class="sync-history-container">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <icon-clock-circle class="header-icon" />
          <h1>Sync History</h1>
        </div>
        <div class="header-subtitle">
          <span class="project-name">{{ projectInfo.name }}</span>
          <el-tag type="info" size="large">
            Project ID: {{ projectInfo.id }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- Filters and Controls -->
    <el-card class="filters-card" shadow="hover">
      <div class="filters-content">
        <div class="filter-group">
          <label>Sync Type:</label>
          <el-select v-model="filters.syncType" placeholder="All Types" clearable @change="loadSyncHistory">
            <el-option label="Full Sync" value="full_sync" />
            <el-option label="Batch Sync" value="batch_sync" />
            <el-option label="Optimized Full Sync" value="optimized_full_sync" />
            <el-option label="Optimized Incremental Sync" value="optimized_incremental_sync" />
          </el-select>
        </div>
        
        <div class="filter-group">
          <label>Status:</label>
          <el-select v-model="filters.status" placeholder="All Status" clearable @change="loadSyncHistory">
            <el-option label="Success" value="success" />
            <el-option label="Failed" value="failed" />
            <el-option label="Running" value="running" />
            <el-option label="Pending" value="pending" />
          </el-select>
        </div>

        <div class="filter-group">
          <el-button type="primary" @click="loadSyncHistory" :loading="loading">
            <icon-refresh />
            Refresh
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Sync History Table -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="table-header">
          <h3>Sync Tasks ({{ pagination.total }})</h3>
        </div>
      </template>

      <el-table 
        :data="syncTasks" 
        v-loading="loading" 
        stripe 
        style="width: 100%"
        :default-sort="{ prop: 'created_at', order: 'descending' }"
      >
        <el-table-column prop="task_type" label="Type" width="180">
          <template #default="{ row }">
            <el-tag :type="getTaskTypeColor(row.task_type)">
              {{ formatTaskType(row.task_type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="task_status" label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.task_status)">
              {{ formatStatus(row.task_status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="Started" width="180">
          <template #default="{ row }">
            <span class="datetime-cell">
              {{ formatDateTime(row.created_at) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="Duration" width="100">
          <template #default="{ row }">
            <span class="duration-cell">
              {{ formatDurationSeconds(row.results && row.results.duration_seconds) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="Results" min-width="200">
          <template #default="{ row }">
            <div class="results-summary" v-if="row.results">
              <span class="result-item">
                <strong>{{ row.results.folders_synced || 0 }}</strong> folders
              </span>
              <span class="result-item">
                <strong>{{ row.results.files_synced || 0 }}</strong> files
              </span>
              <span class="result-item">
                <strong>{{ row.results.versions_synced || 0 }}</strong> versions
              </span>
              <el-tag 
                v-if="row.results && row.results.errors && row.results.errors.length > 0"
                type="danger" 
                size="small"
              >
                {{ row.results.errors.length }} errors
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="text" 
              size="small" 
              @click.stop="showTaskDetails(row)"
            >
              <icon-eye />
              Details
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Task Details Dialog -->
    <el-dialog v-model="showDetailsDialog" title="Sync Task Details" width="800px">
      <div v-if="selectedTask">
        <h4>Basic Information</h4>
        <p><strong>Task ID:</strong> {{ selectedTask._id }}</p>
        <p><strong>Type:</strong> {{ selectedTask.task_type }}</p>
        <p><strong>Status:</strong> {{ selectedTask.task_status }}</p>
        <p><strong>Created:</strong> {{ formatDateTime(selectedTask.created_at) }}</p>
        
        <h4 v-if="selectedTask.results">Results</h4>
        <div v-if="selectedTask.results">
          <p><strong>Folders:</strong> {{ selectedTask.results.folders_synced || 0 }}</p>
          <p><strong>Files:</strong> {{ selectedTask.results.files_synced || 0 }}</p>
          <p><strong>Duration:</strong> {{ selectedTask.results.duration_seconds || 0 }}s</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showDetailsDialog = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
// 使用Element Plus內置圖標
import { 
  Clock as IconClockCircle,
  Refresh as IconRefresh,
  Check as IconCheckCircle,
  Warning as IconExclamationCircle,
  View as IconEye
} from '@element-plus/icons-vue'

export default {
  name: 'SyncHistory',
  components: {
    IconClockCircle,
    IconRefresh,
    IconCheckCircle,
    IconExclamationCircle,
    IconEye
  },
  data() {
    return {
      projectInfo: {
        id: 'b.project-id-placeholder',
        name: 'Sample Project'
      },
      syncTasks: [],
      loading: false,
      showDetailsDialog: false,
      selectedTask: null,
      filters: {
        syncType: '',
        status: ''
      },
      pagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0
      }
    }
  },
  mounted() {
    this.loadSyncHistory()
  },
  methods: {
    async loadSyncHistory() {
      this.loading = true
      try {
        const response = await axios.get('/api/sync-history', {
          params: {
            project_id: this.projectInfo.id,
            page: this.pagination.currentPage,
            page_size: this.pagination.pageSize,
            sync_type: this.filters.syncType,
            status: this.filters.status
          }
        })
        
        this.syncTasks = response.data.tasks || []
        this.pagination.total = response.data.total || 0
      } catch (error) {
        console.error('Failed to load sync history:', error)
        this.$message.error('Failed to load sync history')
      } finally {
        this.loading = false
      }
    },
    
    showTaskDetails(task) {
      this.selectedTask = task
      this.showDetailsDialog = true
    },
    
    handleSizeChange(newSize) {
      this.pagination.pageSize = newSize
      this.pagination.currentPage = 1
      this.loadSyncHistory()
    },
    
    handleCurrentChange(newPage) {
      this.pagination.currentPage = newPage
      this.loadSyncHistory()
    },
    
    getTaskTypeColor(type) {
      const colors = {
        'full_sync': 'primary',
        'incremental_sync': 'success',
        'optimized_full_sync': 'warning',
        'optimized_incremental_sync': 'info'
      }
      return colors[type] || 'default'
    },
    
    getStatusColor(status) {
      const colors = {
        'success': 'success',
        'failed': 'danger',
        'running': 'warning',
        'pending': 'info'
      }
      return colors[status] || 'default'
    },
    
    formatTaskType(type) {
      const names = {
        'full_sync': 'Full Sync',
        'incremental_sync': 'Incremental',
        'optimized_full_sync': 'Optimized Full',
        'optimized_incremental_sync': 'Optimized Incremental'
      }
      return names[type] || type
    },
    
    formatStatus(status) {
      return status.charAt(0).toUpperCase() + status.slice(1)
    },
    
    formatDateTime(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleString()
    },
    
    formatDurationSeconds(seconds) {
      if (!seconds) return '-'
      if (seconds < 60) {
        return `${seconds.toFixed(1)}s`
      } else if (seconds < 3600) {
        return `${(seconds / 60).toFixed(1)}m`
      } else {
        return `${(seconds / 3600).toFixed(1)}h`
      }
    }
  }
}
</script>

<style scoped>
.sync-history-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: #409eff;
  font-size: 28px;
}

.header-title h1 {
  margin: 0;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}

.header-subtitle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-name {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.filters-card {
  margin-bottom: 20px;
}

.filters-content {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
  color: #303133;
}

.datetime-cell {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #606266;
}

.duration-cell {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}

.results-summary {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.result-item {
  font-size: 13px;
  color: #606266;
}

.result-item strong {
  color: #303133;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .sync-history-container {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-subtitle {
    flex-direction: column;
    gap: 8px;
  }
  
  .filters-content {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>