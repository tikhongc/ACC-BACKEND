<template>
  <div class="smart-sync-progress">
    <div class="progress-header">
      <h3>{{ projectInfo.name }} - {{ syncTypeText }}</h3>
      <div class="status-badge" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <div class="progress-content">
      <!-- 總體進度 -->
      <div class="overall-progress">
        <div class="progress-info">
          <span>Overall Progress</span>
          <span class="percentage">{{ Math.round(overallProgress) }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${overallProgress}%` }"
            :class="progressBarClass"
          ></div>
        </div>
      </div>

      <!-- 當前階段 -->
      <div class="current-stage" v-if="currentStage">
        <div class="stage-info">
          <span class="stage-name">{{ currentStageName }}</span>
          <span class="stage-progress">{{ Math.round(currentStageProgress) }}%</span>
        </div>
        <div class="stage-description">{{ currentStageDescription }}</div>
      </div>

      <!-- 統計信息 -->
      <div class="stats-grid" v-if="syncResults && Object.keys(syncResults).length > 0">
        <div class="stat-item">
          <div class="stat-value">{{ syncResults.folders_synced || 0 }}</div>
          <div class="stat-label">Folders</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ syncResults.files_synced || 0 }}</div>
          <div class="stat-label">Files</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ syncResults.versions_synced || 0 }}</div>
          <div class="stat-label">Versions</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ formatFileSize(syncResults.total_size || 0) }}</div>
          <div class="stat-label">Size</div>
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div class="actions">
        <button 
          v-if="currentStatus === 'running'" 
          @click="cancelSync" 
          class="btn btn-cancel"
          :disabled="cancelling"
        >
          {{ cancelling ? 'Cancelling...' : 'Cancel' }}
        </button>
        
        <button 
          v-if="currentStatus === 'completed'" 
          @click="viewResults" 
          class="btn btn-primary"
        >
          View Results
        </button>
        
        <button 
          v-if="currentStatus === 'error'" 
          @click="retrySync" 
          class="btn btn-retry"
        >
          Retry
        </button>
      </div>
    </div>

    <!-- 簡化的日誌 -->
    <div class="logs-section" v-if="showLogs">
      <div class="logs-header">
        <span>Progress Log</span>
        <button @click="showLogs = false" class="btn-close">×</button>
      </div>
      <div class="logs-content">
        <div 
          v-for="(log, index) in recentLogs" 
          :key="index"
          class="log-entry"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <button 
      v-if="!showLogs && recentLogs.length > 0" 
      @click="showLogs = true" 
      class="btn-show-logs"
    >
      Show Logs ({{ recentLogs.length }})
    </button>
  </div>
</template>

<script>
import { taskTracker } from '@/utils/taskTracker'

export default {
  name: 'SmartSyncProgress',
  props: {
    projectId: {
      type: String,
      required: true
    },
    projectName: {
      type: String,
      default: ''
    },
    syncType: {
      type: String,
      default: 'full'
    },
    autoStart: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      taskId: null,
      currentStatus: 'preparing', // preparing, running, completed, error, cancelled
      overallProgress: 0,
      currentStage: '',
      currentStageProgress: 0,
      syncResults: {},
      recentLogs: [],
      showLogs: false,
      cancelling: false,
      
      stageMap: {
        'initializing': { name: 'Initializing', description: 'Preparing sync task...' },
        'clearing_data': { name: 'Clearing Data', description: 'Clearing existing project data...' },
        'collecting': { name: 'Collecting', description: 'Gathering project metadata...' },
        'collecting_all': { name: 'Collecting All Items', description: 'Collecting all project items with BFS...' },
        'collecting_changes': { name: 'Detecting Changes', description: 'Intelligent change detection...' },
        'syncing_folders': { name: 'Syncing Folders', description: 'Processing folder structure...' },
        'syncing_files': { name: 'Syncing Files', description: 'Processing files and versions...' },
        'syncing_to_db': { name: 'Saving to Database', description: 'Batch saving to database...' },
        'syncing_changes_to_db': { name: 'Saving Changes', description: 'Saving detected changes...' },
        'processing_folders': { name: 'Processing Folders', description: 'Syncing folder structure...' },
        'processing_files': { name: 'Processing Files', description: 'Syncing files and versions...' },
        'processing_attributes': { name: 'Processing Attributes', description: 'Syncing custom attributes...' },
        'finalizing': { name: 'Finalizing', description: 'Completing synchronization...' },
        'completed': { name: 'Completed', description: 'Synchronization finished successfully' }
      }
    }
  },

  computed: {
    projectInfo() {
      return {
        id: this.projectId,
        name: this.projectName || `Project ${this.projectId}`
      }
    },

    syncTypeText() {
      return this.syncType === 'full' ? 'Full Sync' : 'Incremental Sync'
    },

    statusText() {
      const statusMap = {
        'preparing': 'Preparing',
        'running': 'Running',
        'completed': 'Completed',
        'error': 'Error',
        'cancelled': 'Cancelled'
      }
      return statusMap[this.currentStatus] || 'Unknown'
    },

    statusClass() {
      return `status-${this.currentStatus}`
    },

    progressBarClass() {
      return `progress-${this.currentStatus}`
    },

    currentStageName() {
      return this.stageMap[this.currentStage]?.name || this.currentStage
    },

    currentStageDescription() {
      return this.stageMap[this.currentStage]?.description || ''
    }
  },

  mounted() {
    if (this.autoStart) {
      this.startSync()
    }
  },

  beforeUnmount() {
    if (this.taskId) {
      taskTracker.stopTracking(this.taskId)
    }
  },

  methods: {
    async startSync() {
      try {
        this.currentStatus = 'preparing'
        this.addLog('info', 'Starting sync...')

        // 啟動同步任務 - 優先使用優化同步API
        const apiProjectId = this.projectId.startsWith('b.') ? this.projectId : `b.${this.projectId}`
        
        let response
        let usedOptimized = false
        
        try {
          // 嘗試優化同步API
          response = await this.$http.post(`/api/optimized-sync/project/${apiProjectId}/sync`, {
            syncType: this.syncType === 'full' ? 'full_sync' : 'incremental_sync',
            maxDepth: 10,
            includeCustomAttributes: true,
            performanceMode: 'standard'
          })
          usedOptimized = true
          this.addLog('success', '✅ Using optimized sync API')
        } catch (optimizedError) {
          this.addLog('warning', '⚠️ Optimized API failed, falling back to standard API')
          
          // 回退到原版API
          response = await this.$http.post(`/api/file-sync-db/project/${apiProjectId}/batch-sync`, {
            maxDepth: 10,
            includeCustomAttributes: true,
            batchSize: 100,
            apiDelay: 0.2
          })
          usedOptimized = false
        }

        if (response.data.success) {
          this.taskId = response.data.data.task_id
          this.currentStatus = 'running'
          
          const apiType = usedOptimized ? '🚀 Optimized' : '🔄 Standard'
          this.addLog('success', `${apiType} sync started: ${this.taskId}`)

          // 使用新的TaskTracker
          taskTracker.startTracking(this.taskId, apiProjectId, {
            onProgress: this.handleProgress,
            onComplete: this.handleComplete,
            onError: this.handleError,
            pollingInterval: usedOptimized ? 2000 : 3000 // 優化同步使用更快的輪詢
          })

        } else {
          this.handleError(response.data.error)
        }

      } catch (error) {
        this.handleError(error.response?.data?.error || error.message)
      }
    },

    handleProgress(taskData) {
      const progress = taskData.progress || {}
      
      this.currentStage = progress.current_stage || 'unknown'
      this.currentStageProgress = progress.progress_percentage || 0
      
      // 計算總體進度
      this.calculateOverallProgress(progress)
      
      // 更新結果
      if (taskData.results) {
        this.syncResults = taskData.results
      }

      this.addLog('info', `${this.currentStageName}: ${this.currentStageProgress.toFixed(1)}%`)
    },

    handleComplete(taskData) {
      this.currentStatus = 'completed'
      this.overallProgress = 100
      this.currentStage = 'completed'
      this.syncResults = taskData.results || {}
      
      this.addLog('success', 'Sync completed successfully!')
      this.$emit('sync-complete', taskData)
    },

    handleError(error) {
      this.currentStatus = 'error'
      this.addLog('error', `Sync failed: ${error}`)
      this.$emit('sync-error', error)
    },

    calculateOverallProgress(progress) {
      const stageWeights = {
        'initializing': { start: 0, weight: 5 },
        'collecting': { start: 5, weight: 15 },
        'processing_folders': { start: 20, weight: 25 },
        'processing_files': { start: 45, weight: 30 },
        'processing_attributes': { start: 75, weight: 15 },
        'finalizing': { start: 90, weight: 10 }
      }

      const stageInfo = stageWeights[this.currentStage] || { start: 0, weight: 0 }
      this.overallProgress = stageInfo.start + (this.currentStageProgress * stageInfo.weight / 100)
      this.overallProgress = Math.min(99.9, this.overallProgress)
    },

    addLog(type, message) {
      const log = {
        type,
        message,
        time: new Date().toLocaleTimeString()
      }
      
      this.recentLogs.unshift(log)
      
      // 只保留最近20條日誌
      if (this.recentLogs.length > 20) {
        this.recentLogs = this.recentLogs.slice(0, 20)
      }
    },

    async cancelSync() {
      if (!this.taskId) return
      
      this.cancelling = true
      taskTracker.stopTracking(this.taskId, 'user_cancelled')
      this.currentStatus = 'cancelled'
      this.addLog('warning', 'Sync cancelled by user')
      this.$emit('sync-cancelled')
    },

    viewResults() {
      this.$emit('view-results', this.syncResults)
    },

    retrySync() {
      this.resetState()
      this.startSync()
    },

    resetState() {
      this.taskId = null
      this.currentStatus = 'preparing'
      this.overallProgress = 0
      this.currentStage = ''
      this.currentStageProgress = 0
      this.syncResults = {}
      this.recentLogs = []
      this.cancelling = false
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }
}
</script>

<style scoped>
.smart-sync-progress {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.progress-header h3 {
  margin: 0;
  color: #1f2937;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.status-preparing { background: #fef3c7; color: #92400e; }
.status-running { background: #dbeafe; color: #1e40af; }
.status-completed { background: #d1fae5; color: #065f46; }
.status-error { background: #fee2e2; color: #dc2626; }
.status-cancelled { background: #f3f4f6; color: #6b7280; }

.overall-progress {
  margin-bottom: 24px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.percentage {
  font-weight: 600;
  color: #1f2937;
}

.progress-bar {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-preparing { background: #fbbf24; }
.progress-running { background: #3b82f6; }
.progress-completed { background: #10b981; }
.progress-error { background: #ef4444; }

.current-stage {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
}

.stage-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.stage-name {
  font-weight: 600;
  color: #1f2937;
}

.stage-progress {
  color: #6b7280;
}

.stage-description {
  color: #6b7280;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  color: #6b7280;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-cancel {
  background: #ef4444;
  color: white;
}

.btn-cancel:hover {
  background: #dc2626;
}

.btn-retry {
  background: #f59e0b;
  color: white;
}

.btn-retry:hover {
  background: #d97706;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.logs-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
}

.logs-content {
  max-height: 200px;
  overflow-y: auto;
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
}

.log-entry {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

.log-entry:last-child {
  margin-bottom: 0;
}

.log-time {
  color: #6b7280;
  min-width: 80px;
}

.log-entry.info .log-message { color: #1f2937; }
.log-entry.success .log-message { color: #065f46; }
.log-entry.warning .log-message { color: #92400e; }
.log-entry.error .log-message { color: #dc2626; }

.btn-show-logs {
  width: 100%;
  padding: 8px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-show-logs:hover {
  background: #e5e7eb;
}
</style>
