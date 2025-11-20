<template>
  <div class="optimized-sync-progress">
    <!-- 頁面標題 -->
    <div class="progress-header">
      <div class="header-content">
        <div class="header-title">
          <icon-sync class="header-icon" :class="{ 'spinning': currentStatus === 'running' }" />
          <h2>{{ projectInfo.name }} - {{ syncTypeText }}</h2>
        </div>
        <div class="status-badge" :class="statusClass">
          <icon-check-circle v-if="currentStatus === 'completed'" />
          <icon-close-circle v-if="currentStatus === 'error'" />
          <icon-loading v-if="currentStatus === 'running'" class="spinning" />
          {{ statusText }}
        </div>
      </div>
    </div>

    <!-- 主要進度區域 -->
    <div class="progress-main">
      <!-- 總體進度條 -->
      <div class="overall-progress-section">
        <div class="progress-info">
          <span class="progress-label">Overall Progress</span>
          <span class="progress-percentage">{{ Math.round(overallProgress) }}%</span>
        </div>
        <div class="progress-bar-container">
          <div 
            class="progress-bar" 
            :style="{ width: `${overallProgress}%` }"
            :class="progressBarClass"
          ></div>
        </div>
      </div>

      <!-- 當前階段信息 -->
      <div class="current-stage-section" v-if="currentStage">
        <div class="stage-header">
          <span class="stage-name">{{ currentStageName }}</span>
          <span class="stage-progress">{{ Math.round(currentStageProgress) }}%</span>
        </div>
        <div class="stage-description">{{ currentStageDescription }}</div>
        <div class="stage-details" v-if="stageDetails">
          <div class="detail-item" v-for="(value, key) in stageDetails" :key="key">
            <span class="detail-label">{{ formatDetailLabel(key) }}:</span>
            <span class="detail-value">{{ value }}</span>
          </div>
        </div>
      </div>

      <!-- 性能統計 -->
      <div class="performance-section" v-if="performanceInfo && Object.keys(performanceInfo).length > 0">
        <h3>Performance Metrics</h3>
        <div class="performance-grid">
          <div class="perf-item">
            <div class="perf-value">{{ performanceInfo.api_calls || 0 }}</div>
            <div class="perf-label">API Calls</div>
          </div>
          <div class="perf-item">
            <div class="perf-value">{{ performanceInfo.concurrent_operations || 0 }}</div>
            <div class="perf-label">Concurrent Ops</div>
          </div>
          <div class="perf-item">
            <div class="perf-value">{{ performanceInfo.batch_operations || 0 }}</div>
            <div class="perf-label">Batch Ops</div>
          </div>
          <div class="perf-item">
            <div class="perf-value">{{ formatDuration(performanceInfo.duration_seconds) }}</div>
            <div class="perf-label">Duration</div>
          </div>
          <div class="perf-item">
            <div class="perf-value">{{ formatResponseTime(performanceInfo.avg_api_response_time) }}</div>
            <div class="perf-label">Avg Response</div>
          </div>
        </div>
      </div>

      <!-- 同步結果統計 -->
      <div class="results-section" v-if="syncResults && Object.keys(syncResults).length > 0">
        <h3>Sync Results</h3>
        <div class="results-grid">
          <div class="result-card folders">
            <icon-folder class="result-icon" />
            <div class="result-info">
              <div class="result-number">{{ syncResults.folders_synced || 0 }}</div>
              <div class="result-label">Folders</div>
            </div>
          </div>
          <div class="result-card files">
            <icon-file class="result-icon" />
            <div class="result-info">
              <div class="result-number">{{ syncResults.files_synced || 0 }}</div>
              <div class="result-label">Files</div>
            </div>
          </div>
          <div class="result-card versions">
            <icon-tag class="result-icon" />
            <div class="result-info">
              <div class="result-number">{{ syncResults.versions_synced || 0 }}</div>
              <div class="result-label">Versions</div>
            </div>
          </div>
          <div class="result-card size">
            <icon-archive class="result-icon" />
            <div class="result-info">
              <div class="result-number">{{ formatFileSize(syncResults.total_size || 0) }}</div>
              <div class="result-label">Total Size</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 錯誤信息 -->
      <div class="errors-section" v-if="syncResults && syncResults.errors && syncResults.errors.length > 0">
        <h3>Errors ({{ syncResults.errors.length }})</h3>
        <div class="errors-list">
          <div 
            v-for="(error, index) in syncResults.errors.slice(0, 5)" 
            :key="index"
            class="error-item"
          >
            <icon-exclamation-circle class="error-icon" />
            <span class="error-message">{{ error }}</span>
          </div>
          <div v-if="syncResults.errors.length > 5" class="error-more">
            ... and {{ syncResults.errors.length - 5 }} more errors
          </div>
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div class="actions-section">
        <el-button 
          v-if="currentStatus === 'running'" 
          @click="cancelSync" 
          type="danger"
          :loading="cancelling"
          size="large"
        >
          {{ cancelling ? 'Cancelling...' : 'Cancel Sync' }}
        </el-button>
        
        <el-button 
          v-if="currentStatus === 'completed'" 
          @click="viewSyncHistory" 
          type="primary"
          size="large"
        >
          <icon-clock-circle />
          View Sync History
        </el-button>
        
        <el-button 
          v-if="currentStatus === 'error'" 
          @click="retrySync" 
          type="warning"
          size="large"
        >
          <icon-refresh />
          Retry Sync
        </el-button>

        <el-button 
          @click="goBack" 
          size="large"
        >
          <icon-arrow-left />
          Back to Home
        </el-button>
      </div>
    </div>

    <!-- 實時日誌 -->
    <div class="logs-section" v-if="showLogs">
      <div class="logs-header">
        <h3>Real-time Logs</h3>
        <el-button @click="showLogs = false" type="text" size="small">
          <icon-close />
          Hide
        </el-button>
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

    <el-button 
      v-if="!showLogs && recentLogs.length > 0" 
      @click="showLogs = true" 
      class="show-logs-btn"
      type="text"
    >
      <icon-eye />
      Show Logs ({{ recentLogs.length }})
    </el-button>
  </div>
</template>

<script>
import axios from 'axios'
import { 
  IconSync, 
  IconCheckCircle, 
  IconCloseCircle, 
  IconLoading,
  IconFolder,
  IconFile,
  IconTag,
  IconArchive,
  IconExclamationCircle,
  IconClockCircle,
  IconRefresh,
  IconArrowLeft,
  IconClose,
  IconEye
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'OptimizedSyncProgress',
  components: {
    IconSync,
    IconCheckCircle,
    IconCloseCircle,
    IconLoading,
    IconFolder,
    IconFile,
    IconTag,
    IconArchive,
    IconExclamationCircle,
    IconClockCircle,
    IconRefresh,
    IconArrowLeft,
    IconClose,
    IconEye
  },
  
  data() {
    return {
      taskId: null,
      currentStatus: 'preparing', // preparing, running, completed, error, cancelled
      overallProgress: 0,
      currentStage: '',
      currentStageProgress: 0,
      syncResults: {},
      performanceInfo: {},
      recentLogs: [],
      showLogs: false,
      cancelling: false,
      
      // 輪詢控制
      progressTimer: null,
      pollingInterval: 2000, // 2秒輪詢一次
      
      stageMap: {
        'initializing': { name: 'Initializing', description: 'Preparing optimized sync task...' },
        'clearing_data': { name: 'Clearing Data', description: 'Clearing existing project data...' },
        'collecting': { name: 'Collecting Metadata', description: 'Gathering project structure with concurrent BFS...' },
        'collecting_all': { name: 'Collecting All Items', description: 'Collecting all project items...' },
        'collecting_changes': { name: 'Detecting Changes', description: 'Intelligent change detection in progress...' },
        'syncing_folders': { name: 'Syncing Folders', description: 'Processing folder structure...' },
        'syncing_files': { name: 'Syncing Files', description: 'Processing files and versions...' },
        'syncing_to_db': { name: 'Saving to Database', description: 'Batch saving to database...' },
        'syncing_changes_to_db': { name: 'Saving Changes', description: 'Saving detected changes to database...' },
        'processing_folders': { name: 'Processing Folders', description: 'Concurrent folder processing...' },
        'processing_files': { name: 'Processing Files', description: 'Concurrent file processing...' },
        'finalizing': { name: 'Finalizing', description: 'Completing synchronization...' },
        'completed': { name: 'Completed', description: 'Optimized synchronization finished successfully!' }
      }
    }
  },

  computed: {
    projectInfo() {
      return {
        id: this.$route.params.projectId,
        name: decodeURIComponent(this.$route.params.projectName || `Project ${this.$route.params.projectId}`)
      }
    },

    syncTypeText() {
      const syncType = this.$route.params.syncType
      return syncType === 'full' ? '🚀 Optimized Full Sync' : '⚡ Optimized Incremental Sync'
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
    },

    stageDetails() {
      // 從進度數據中提取階段詳細信息
      const progress = this.currentProgressData || {}
      const details = {}
      
      if (progress.processed_folders) details.processed_folders = progress.processed_folders
      if (progress.collected_files) details.collected_files = progress.collected_files
      if (progress.changed_folders) details.changed_folders = progress.changed_folders
      if (progress.changed_files) details.changed_files = progress.changed_files
      if (progress.processed_batches) details.processed_batches = progress.processed_batches
      if (progress.total_batches) details.total_batches = progress.total_batches
      
      return Object.keys(details).length > 0 ? details : null
    }
  },

  async mounted() {
    await this.startOptimizedSync()
  },

  beforeUnmount() {
    this.stopProgressPolling()
  },

  methods: {
    async startOptimizedSync() {
      try {
        this.currentStatus = 'preparing'
        this.addLog('info', 'Starting optimized sync...')

        const projectId = this.projectInfo.id
        const syncType = this.$route.params.syncType
        
        // 確保項目ID有正確的前綴
        const apiProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`
        
        // 調用優化同步API
        const response = await axios.post(`/api/optimized-sync/project/${apiProjectId}/sync`, {
          syncType: syncType === 'full' ? 'full_sync' : 'incremental_sync',
          maxDepth: 10,
          includeCustomAttributes: true,
          performanceMode: 'standard'
        })

        if (response.data.success) {
          this.taskId = response.data.data.task_id
          this.currentStatus = 'running'
          
          this.addLog('success', `Optimized sync started: ${this.taskId}`)
          
          // 開始輪詢進度
          this.startProgressPolling()

        } else {
          this.handleError(response.data.error)
        }

      } catch (error) {
        this.handleError(error.response?.data?.error || error.message)
      }
    },

    startProgressPolling() {
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
      }
      
      this.progressTimer = setInterval(async () => {
        await this.checkProgress()
      }, this.pollingInterval)
      
      // 立即檢查一次
      this.checkProgress()
    },

    stopProgressPolling() {
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
        this.progressTimer = null
      }
    },

    async checkProgress() {
      if (!this.taskId || this.currentStatus !== 'running') {
        return
      }

      try {
        const apiProjectId = this.projectInfo.id.startsWith('b.') ? this.projectInfo.id : `b.${this.projectInfo.id}`
        const response = await axios.get(`/api/task-tracking/project/${apiProjectId}/sync-progress/${this.taskId}`)
        
        if (response.data.success) {
          const taskData = response.data.data
          this.handleProgressUpdate(taskData)
        }
      } catch (error) {
        console.error('Progress check error:', error)
      }
    },

    handleProgressUpdate(taskData) {
      const progress = taskData.progress || {}
      
      this.currentStage = progress.current_stage || 'unknown'
      this.currentStageProgress = progress.progress_percentage || 0
      this.currentProgressData = progress
      
      // 計算總體進度
      this.calculateOverallProgress(progress)
      
      // 更新結果和性能信息
      if (taskData.results) {
        if (taskData.results.results) {
          this.syncResults = taskData.results.results
        }
        if (taskData.results.performance) {
          this.performanceInfo = taskData.results.performance
        }
      }

      // 檢查任務狀態
      if (taskData.task_status === 'completed') {
        this.handleComplete(taskData)
      } else if (taskData.task_status === 'failed') {
        this.handleError('Sync task failed')
      }

      this.addLog('info', `${this.currentStageName}: ${this.currentStageProgress.toFixed(1)}%`)
    },

    calculateOverallProgress(progress) {
      const stageWeights = {
        'initializing': { start: 0, weight: 5 },
        'clearing_data': { start: 5, weight: 5 },
        'collecting': { start: 10, weight: 20 },
        'collecting_all': { start: 10, weight: 20 },
        'collecting_changes': { start: 10, weight: 15 },
        'syncing_folders': { start: 30, weight: 20 },
        'syncing_files': { start: 50, weight: 30 },
        'syncing_to_db': { start: 50, weight: 30 },
        'syncing_changes_to_db': { start: 50, weight: 30 },
        'processing_folders': { start: 30, weight: 20 },
        'processing_files': { start: 50, weight: 30 },
        'finalizing': { start: 80, weight: 20 }
      }

      const stageInfo = stageWeights[this.currentStage] || { start: 0, weight: 0 }
      this.overallProgress = stageInfo.start + (this.currentStageProgress * stageInfo.weight / 100)
      this.overallProgress = Math.min(99.9, this.overallProgress)
    },

    handleComplete(taskData) {
      this.stopProgressPolling()
      this.currentStatus = 'completed'
      this.overallProgress = 100
      this.currentStage = 'completed'
      
      if (taskData.results) {
        if (taskData.results.results) {
          this.syncResults = taskData.results.results
        }
        if (taskData.results.performance) {
          this.performanceInfo = taskData.results.performance
        }
      }
      
      this.addLog('success', 'Optimized sync completed successfully!')
      
      // 顯示成功通知
      this.$notify({
        title: '✅ Sync Completed',
        message: `${this.syncTypeText} finished successfully!`,
        type: 'success',
        duration: 5000
      })
    },

    handleError(error) {
      this.stopProgressPolling()
      this.currentStatus = 'error'
      this.addLog('error', `Sync failed: ${error}`)
      
      this.$notify({
        title: '❌ Sync Failed',
        message: error,
        type: 'error',
        duration: 8000
      })
    },

    addLog(type, message) {
      const log = {
        type,
        message,
        time: new Date().toLocaleTimeString()
      }
      
      this.recentLogs.unshift(log)
      
      // 只保留最近50條日誌
      if (this.recentLogs.length > 50) {
        this.recentLogs = this.recentLogs.slice(0, 50)
      }
    },

    async cancelSync() {
      if (!this.taskId) return
      
      this.cancelling = true
      this.stopProgressPolling()
      this.currentStatus = 'cancelled'
      this.addLog('warning', 'Sync cancelled by user')
      
      this.$notify({
        title: '⚠️ Sync Cancelled',
        message: 'Sync operation was cancelled',
        type: 'warning',
        duration: 3000
      })
    },

    retrySync() {
      this.resetState()
      this.startOptimizedSync()
    },

    resetState() {
      this.taskId = null
      this.currentStatus = 'preparing'
      this.overallProgress = 0
      this.currentStage = ''
      this.currentStageProgress = 0
      this.syncResults = {}
      this.performanceInfo = {}
      this.recentLogs = []
      this.cancelling = false
      this.currentProgressData = null
    },

    viewSyncHistory() {
      this.$router.push({
        path: '/sync-history',
        query: {
          projectId: this.projectInfo.id,
          projectName: this.projectInfo.name
        }
      })
    },

    goBack() {
      this.$router.push('/')
    },

    formatDetailLabel(key) {
      const labelMap = {
        'processed_folders': 'Processed Folders',
        'collected_files': 'Collected Files',
        'changed_folders': 'Changed Folders',
        'changed_files': 'Changed Files',
        'processed_batches': 'Processed Batches',
        'total_batches': 'Total Batches'
      }
      return labelMap[key] || key
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    formatDuration(seconds) {
      if (!seconds) return '0s'
      if (seconds < 60) return `${seconds.toFixed(1)}s`
      if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
      return `${(seconds / 3600).toFixed(1)}h`
    },

    formatResponseTime(seconds) {
      if (!seconds) return '0ms'
      if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`
      return `${seconds.toFixed(2)}s`
    }
  }
}
</script>

<style scoped>
.optimized-sync-progress {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.progress-header {
  margin-bottom: 30px;
}

.header-content {
  background: rgba(255, 255, 255, 0.95);
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 36px;
  color: #667eea;
}

.header-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
}

.status-preparing { background: #fef3c7; color: #92400e; }
.status-running { background: #dbeafe; color: #1e40af; }
.status-completed { background: #d1fae5; color: #065f46; }
.status-error { background: #fee2e2; color: #dc2626; }
.status-cancelled { background: #f3f4f6; color: #6b7280; }

.progress-main {
  background: rgba(255, 255, 255, 0.95);
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.overall-progress-section {
  margin-bottom: 30px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.progress-percentage {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.progress-bar-container {
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 6px;
}

.progress-preparing { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
.progress-running { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
.progress-completed { background: linear-gradient(90deg, #10b981, #059669); }
.progress-error { background: linear-gradient(90deg, #ef4444, #dc2626); }

.current-stage-section {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  border-left: 4px solid #667eea;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stage-name {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.stage-progress {
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
}

.stage-description {
  color: #64748b;
  margin-bottom: 12px;
}

.stage-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  font-size: 14px;
}

.detail-label {
  color: #64748b;
}

.detail-value {
  font-weight: 600;
  color: #2d3748;
}

.performance-section, .results-section {
  margin-bottom: 30px;
}

.performance-section h3, .results-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #2d3748;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.perf-item {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.perf-value {
  font-size: 20px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 4px;
}

.perf-label {
  font-size: 12px;
  color: #64748b;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.result-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.result-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.result-icon {
  font-size: 32px;
}

.result-card.folders .result-icon { color: #f59e0b; }
.result-card.files .result-icon { color: #3b82f6; }
.result-card.versions .result-icon { color: #10b981; }
.result-card.size .result-icon { color: #8b5cf6; }

.result-info {
  flex: 1;
}

.result-number {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 4px;
}

.result-label {
  font-size: 14px;
  color: #64748b;
}

.errors-section {
  background: #fef2f2;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #fecaca;
  margin-bottom: 30px;
}

.errors-section h3 {
  margin: 0 0 12px 0;
  color: #dc2626;
}

.errors-list {
  max-height: 200px;
  overflow-y: auto;
}

.error-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.error-icon {
  color: #dc2626;
  margin-top: 2px;
  flex-shrink: 0;
}

.error-message {
  flex: 1;
  color: #374151;
}

.error-more {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  margin-top: 8px;
}

.actions-section {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.logs-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.logs-header h3 {
  margin: 0;
  color: #2d3748;
}

.logs-content {
  max-height: 300px;
  overflow-y: auto;
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
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
  color: #64748b;
  min-width: 80px;
  font-family: monospace;
}

.log-entry.info .log-message { color: #374151; }
.log-entry.success .log-message { color: #059669; }
.log-entry.warning .log-message { color: #d97706; }
.log-entry.error .log-message { color: #dc2626; }

.show-logs-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px;
  color: #2d3748;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .optimized-sync-progress {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .progress-main {
    padding: 20px;
  }
  
  .performance-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .results-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-section {
    flex-direction: column;
  }
  
  .stage-details {
    grid-template-columns: 1fr;
  }
}
</style>
