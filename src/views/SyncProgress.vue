<template>
  <div class="sync-progress-container">
    <!-- 页面头部 -->
    <div class="sync-header">
      <div class="sync-header-content">
        <div class="sync-title">
          <icon-sync class="sync-icon" :class="{ spinning: isActive }" />
          <h1>Database Synchronization</h1>
        </div>
        <div class="sync-subtitle">
          <span class="project-name">{{ projectInfo.name }}</span>
          <el-tag :type="syncTypeTagType" size="large">
            {{ syncTypeText }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 主要进度区域 -->
    <div class="sync-main">
      <el-card class="progress-card" shadow="hover">
        <!-- 整体进度 -->
        <div class="overall-progress">
          <div class="progress-header">
            <h3>Overall Progress</h3>
            <div class="progress-stats">
              <span class="progress-percentage">{{ overallProgress.toFixed(1) }}%</span>
              <span class="progress-status" :class="statusClass">{{ statusText }}</span>
            </div>
          </div>
          
          <el-progress
            :percentage="overallProgress"
            :status="progressStatus"
            :stroke-width="12"
            :show-text="false"
            class="main-progress-bar"
          />
          
          <div class="progress-details">
            <div class="time-info">
              <span>Elapsed: {{ elapsedTime }}</span>
              <span v-if="taskId" class="task-id">Task: {{ taskId.substring(0, 8) }}...</span>
            </div>
          </div>
        </div>

        <!-- 当前阶段信息 -->
        <div class="current-stage">
          <div class="stage-header">
            <h4>Current Stage</h4>
            <div class="stage-info">
              <icon-loading v-if="isActive" class="spinning stage-icon" />
              <icon-check v-else-if="isCompleted" class="stage-icon success" />
              <icon-close v-else-if="hasError" class="stage-icon error" />
              <icon-clock-circle v-else class="stage-icon" />
              <span class="stage-name">{{ currentStageName }}</span>
            </div>
          </div>
          
          <div class="stage-progress">
            <el-progress
              :percentage="currentStageProgress"
              :stroke-width="8"
              :show-text="false"
            />
            <div class="stage-stats">{{ currentStageStats }}</div>
          </div>
        </div>
      </el-card>

      <!-- 实时日志 -->
      <el-card class="log-card" shadow="hover">
        <template #header>
          <div class="log-header">
            <h4>Real-time Logs</h4>
            <div class="log-controls">
              <el-switch
                v-model="autoScroll"
                active-text="Auto Scroll"
                size="small"
              />
              <el-button size="small" @click="clearLogs">
                Clear
              </el-button>
            </div>
          </div>
        </template>
        
        <div ref="logContainer" class="log-container">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-entry"
            :class="log.level"
          >
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-level">{{ log.level.toUpperCase() }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 操作按钮 -->
    <div class="sync-actions">
      <el-button
        v-if="canCancel"
        type="danger"
        @click="cancelSync"
        :loading="cancelling"
      >
        Cancel Sync
      </el-button>
      
      <el-button
        v-if="isCompleted"
        type="primary"
        @click="goBack"
      >
        Back to Home
      </el-button>
      
      <el-button
        v-if="hasError"
        type="warning"
        @click="retrySync"
      >
        Retry Sync
      </el-button>
    </div>

    <!-- 完成对话框 -->
    <el-dialog
      v-model="showCompletionDialog"
      title="Sync Completed"
      width="600px"
      center
    >
      <div class="completion-content">
        <div class="completion-icon">
          <icon-check-circle v-if="!hasError" class="success-icon" />
          <icon-close-circle v-else class="error-icon" />
        </div>
        
        <div class="completion-summary">
          <h3>{{ completionTitle }}</h3>
          
          <!-- 同步统计 -->
          <div class="completion-stats">
            <div class="stat-row">
              <div class="stat-item">
                <el-icon class="stat-icon"><el-icon-timer /></el-icon>
                <div class="stat-content">
                  <span class="stat-label">Duration</span>
                  <span class="stat-value">{{ syncDuration }}</span>
                </div>
              </div>
              <div class="stat-item">
                <el-icon class="stat-icon success"><el-icon-folder /></el-icon>
                <div class="stat-content">
                  <span class="stat-label">Folders</span>
                  <span class="stat-value">{{ syncResults.folders_synced || 0 }}</span>
                </div>
              </div>
            </div>
            
            <div class="stat-row">
              <div class="stat-item">
                <el-icon class="stat-icon primary"><el-icon-document /></el-icon>
                <div class="stat-content">
                  <span class="stat-label">Files</span>
                  <span class="stat-value">{{ syncResults.files_synced || 0 }}</span>
                </div>
              </div>
              <div class="stat-item">
                <el-icon class="stat-icon warning"><el-icon-collection-tag /></el-icon>
                <div class="stat-content">
                  <span class="stat-label">Versions</span>
                  <span class="stat-value">{{ syncResults.versions_synced || 0 }}</span>
                </div>
              </div>
            </div>
            
            <div class="stat-row">
              <div class="stat-item">
                <el-icon class="stat-icon info"><el-icon-pie-chart /></el-icon>
                <div class="stat-content">
                  <span class="stat-label">Total Size</span>
                  <span class="stat-value">{{ formatFileSize(getTotalSize()) }}</span>
                </div>
              </div>
              <div class="stat-item">
                <el-icon class="stat-icon" :class="syncResults.errors && syncResults.errors.length > 0 ? 'error' : 'success'">
                  <el-icon-warning v-if="syncResults.errors && syncResults.errors.length > 0" />
                  <el-icon-success-filled v-else />
                </el-icon>
                <div class="stat-content">
                  <span class="stat-label">Errors</span>
                  <span class="stat-value">{{ (syncResults.errors && syncResults.errors.length) || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 错误详情 -->
          <div v-if="syncResults.errors && syncResults.errors.length > 0" class="error-details">
            <h4>Synchronization Errors</h4>
            <div class="error-list">
              <div v-for="(error, index) in syncResults.errors.slice(0, 3)" :key="index" class="error-item">
                <el-icon class="error-icon"><el-icon-warning /></el-icon>
                <span class="error-message">{{ error.error || error.message || error }}</span>
              </div>
              <div v-if="syncResults.errors.length > 3" class="error-more">
                {{ syncResults.errors.length - 3 }} more errors...
              </div>
            </div>
          </div>
          
          <!-- 总结 -->
          <div class="sync-summary">
            <p class="summary-text">
              Successfully synchronized <strong>{{ getTotalItems() }}</strong> items
              in <strong>{{ syncDuration }}</strong>.
              <span v-if="!syncResults.errors || syncResults.errors.length === 0" class="success-text">
                All operations completed successfully!
              </span>
              <span v-else class="warning-text">
                {{ syncResults.errors.length }} errors encountered during synchronization.
              </span>
            </p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showCompletionDialog = false">
          Close
        </el-button>
        <el-button type="primary" @click="goBack">
          Back to Home
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { 
  IconSync, 
  IconCheck, 
  IconClose, 
  IconLoading, 
  IconClockCircle,
  IconCheckCircle,
  IconCloseCircle
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'SyncProgress',
  components: {
    IconSync,
    IconCheck,
    IconClose,
    IconLoading,
    IconClockCircle,
    IconCheckCircle,
    IconCloseCircle
  },
  data() {
    return {
      // 项目信息
      projectInfo: {
        id: '',
        name: ''
      },
      syncType: 'full',
      
      // 任务状态
      taskId: null,
      currentStatus: 'preparing', // preparing, running, completed, error, cancelled
      startTime: null,
      endTime: null,
      
      // 进度信息
      overallProgress: 0,
      currentStage: 'initializing',
      currentStageProgress: 0,
      
      // 日志
      logs: [],
      autoScroll: true,
      
      // 控制状态
      cancelling: false,
      showCompletionDialog: false,
      
      // 轮询
      progressInterval: null,
      pollingFailureCount: 0,
      pollingErrorCount: 0,
      
      // 同步结果
      syncResults: {},
      
      // 阶段映射
      stageMap: {
        'initializing': { name: 'Initializing', description: 'Preparing sync task...' },
        'collecting': { name: 'Collecting', description: 'Gathering project metadata...' },
        'processing_folders': { name: 'Processing Folders', description: 'Syncing folder structure...' },
        'processing_files': { name: 'Processing Files', description: 'Syncing files and versions...' },
        'processing_attributes': { name: 'Processing Attributes', description: 'Syncing custom attributes...' },
        'finalizing': { name: 'Finalizing', description: 'Completing synchronization...' }
      }
    }
  },
  computed: {
    syncTypeText() {
      return this.syncType === 'full' ? 'Full Sync' : 'Incremental Sync'
    },
    
    syncTypeTagType() {
      return this.syncType === 'full' ? 'danger' : 'success'
    },
    
    statusText() {
      const statusMap = {
        preparing: 'Preparing...',
        running: 'In Progress',
        completed: 'Completed',
        error: 'Error',
        cancelled: 'Cancelled'
      }
      return statusMap[this.currentStatus] || 'Unknown'
    },
    
    statusClass() {
      return `status-${this.currentStatus}`
    },
    
    progressStatus() {
      if (this.currentStatus === 'completed') return 'success'
      if (this.currentStatus === 'error') return 'exception'
      if (this.currentStatus === 'cancelled') return 'warning'
      return null
    },
    
    isActive() {
      return ['preparing', 'running'].includes(this.currentStatus)
    },
    
    canCancel() {
      return ['preparing', 'running'].includes(this.currentStatus)
    },
    
    isCompleted() {
      return this.currentStatus === 'completed'
    },
    
    hasError() {
      return this.currentStatus === 'error'
    },
    
    currentStageName() {
      const stage = this.stageMap[this.currentStage]
      return stage ? stage.name : 'Unknown'
    },
    
    currentStageStats() {
      // 根据当前阶段返回统计信息
      if (this.currentStage === 'processing_folders') {
        return `Processing folders...`
      } else if (this.currentStage === 'processing_files') {
        return `Processing files...`
      } else if (this.currentStage === 'processing_attributes') {
        return `Processing attributes...`
      }
      return ''
    },
    
    elapsedTime() {
      if (!this.startTime) return '00:00:00'
      
      const end = this.endTime || new Date()
      const elapsed = Math.floor((end - this.startTime) / 1000)
      
      const hours = Math.floor(elapsed / 3600)
      const minutes = Math.floor((elapsed % 3600) / 60)
      const seconds = elapsed % 60
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
    
    syncDuration() {
      if (!this.startTime || !this.endTime) return '0s'
      const duration = (this.endTime - this.startTime) / 1000
      return `${duration.toFixed(1)}s`
    },
    
    completionTitle() {
      if (this.hasError) return 'Sync Failed'
      if (this.currentStatus === 'cancelled') return 'Sync Cancelled'
      return 'Sync Completed Successfully'
    }
  },
  async mounted() {
    await this.initializeSync()
  },
  beforeUnmount() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
    }
  },
  methods: {
    async initializeSync() {
      // 从路由参数获取同步信息
      const { projectId, projectName, syncType } = this.$route.params
      
      this.projectInfo = {
        id: projectId,
        name: projectName || `Project ${projectId}`
      }
      this.syncType = syncType || 'full'
      
      this.addLog('info', `Starting ${this.syncTypeText} for project: ${this.projectInfo.name}`)
      
      // 开始同步
      await this.startSync()
    },
    
    async startSync() {
      try {
        this.currentStatus = 'preparing'
        this.startTime = new Date()
        
        // Data Management API需要带'b.'前缀的项目ID
        const apiProjectId = this.projectInfo.id && !this.projectInfo.id.startsWith('b.') 
          ? `b.${this.projectInfo.id}` 
          : this.projectInfo.id
        
        this.addLog('info', 'Starting batch optimized sync...')
        
        // 启动批量同步请求
        const response = await axios.post(`/api/file-sync-db/project/${apiProjectId}/batch-sync`, {
          maxDepth: 10,
          includeCustomAttributes: true,
          batchSize: 100,
          apiDelay: 0.2
        })
        
        if (response.data.success) {
          // 获取任务ID并开始轮询进度
          this.taskId = response.data.data.task_id
          this.currentStatus = 'running'
          
          this.addLog('info', `Sync task started: ${this.taskId}`)
          
          // 开始轮询进度
          this.startProgressPolling()
          
        } else {
          this.handleSyncError(response.data.error)
        }
        
      } catch (error) {
        this.handleSyncError(error.response?.data?.error || error.message)
      }
    },
    
    startProgressPolling() {
      // 确保清理任何现有的轮询
      if (this.progressInterval) {
        console.log('🧹 Clearing existing polling interval')
        clearInterval(this.progressInterval)
        this.progressInterval = null
      }
      
      console.log('🚀 Starting progress polling for task:', this.taskId)
      
      this.progressInterval = setInterval(async () => {
        try {
          // 如果任务已经完成，停止轮询
          if (this.currentStatus === 'completed' || this.currentStatus === 'error') {
            console.log('🛑 Stopping polling - current status:', this.currentStatus)
            clearInterval(this.progressInterval)
            this.progressInterval = null
            return
          }
          
          console.log('🔍 Polling for task:', this.taskId, 'Status:', this.currentStatus)
          
          const apiProjectId = this.projectInfo.id && !this.projectInfo.id.startsWith('b.') 
            ? `b.${this.projectInfo.id}` 
            : this.projectInfo.id
          
          const response = await axios.get(`/api/task-tracking/project/${apiProjectId}/sync-progress/${this.taskId}`)
          
          if (response.data.success) {
            const taskData = response.data.data
            
            // 更新进度
            if (taskData.progress) {
              this.updateProgress(taskData.progress)
            }
            
            // 检查任务状态 - 检查task_status或current_stage是否为completed
            if (taskData.task_status === 'completed' || taskData.progress?.current_stage === 'completed') {
              console.log('🎉 Task completed, stopping polling:', taskData)
              this.addLog('success', `Task completed: ${taskData.task_status} (stage: ${taskData.progress?.current_stage})`)
              this.handleSyncSuccess(taskData)
              clearInterval(this.progressInterval)
              this.progressInterval = null
              return // 立即返回，确保不继续执行
            } else if (taskData.task_status === 'failed') {
              console.log('❌ Task failed, stopping polling:', taskData)
              this.addLog('error', `Task failed: ${taskData.task_status}`)
              this.handleSyncError(taskData.error || 'Sync failed')
              clearInterval(this.progressInterval)
              this.progressInterval = null
              return // 立即返回，确保不继续执行
            } else {
              console.log('🔄 Task still running:', taskData.task_status, taskData.progress)
            }
            
          } else {
            this.addLog('warning', 'Progress polling failed')
            // 如果API调用失败多次，可能任务已经不存在，停止轮询
            this.pollingFailureCount = (this.pollingFailureCount || 0) + 1
            if (this.pollingFailureCount >= 3) {
              this.addLog('info', 'Task may have completed, stopping polling')
              clearInterval(this.progressInterval)
              this.progressInterval = null
              if (this.currentStatus === 'running') {
                this.currentStatus = 'completed'
                this.overallProgress = 100
              }
            }
          }
          
        } catch (error) {
          this.addLog('warning', `Progress polling error: ${error.message}`)
          
          // 如果是404錯誤（新API不可用），立即停止輪詢並標記為完成
          if (error.response && error.response.status === 404) {
            this.addLog('info', 'New API not available, assuming task completed')
            this.currentStatus = 'completed'
            this.overallProgress = 100
            clearInterval(this.progressInterval)
            this.progressInterval = null
            return
          }
          
          // 如果连续出错，停止轮询
          this.pollingErrorCount = (this.pollingErrorCount || 0) + 1
          if (this.pollingErrorCount >= 5) {
            this.addLog('info', 'Too many polling errors, stopping polling')
            clearInterval(this.progressInterval)
            this.progressInterval = null
          }
        }
      }, 3000) // 每3秒轮询一次
    },
    
    updateProgress(progressData) {
      // 如果任务已经完成，不再更新进度
      if (this.currentStatus === 'completed' || this.currentStatus === 'error') {
        return
      }
      
      const stage = progressData.current_stage || 'initializing'
      const stagePercentage = progressData.progress_percentage || 0
      
      this.currentStage = stage
      this.currentStageProgress = Math.min(100, Math.max(0, stagePercentage))
      
      // 计算总体进度 (简化版本)
      const stageWeights = {
        'initializing': { start: 0, weight: 5 },
        'collecting': { start: 5, weight: 15 },
        'processing_folders': { start: 20, weight: 25 },
        'processing_files': { start: 45, weight: 30 },
        'processing_attributes': { start: 75, weight: 15 },
        'finalizing': { start: 90, weight: 10 }
      }
      
      const stageInfo = stageWeights[stage] || { start: 0, weight: 0 }
      this.overallProgress = stageInfo.start + (stagePercentage * stageInfo.weight / 100)
      this.overallProgress = Math.min(99.9, this.overallProgress) // 最大99.9%，完成时才100%
      
      // 添加日志 - 只有在任务运行时才添加
      if (this.currentStatus === 'running') {
        const timestamp = new Date().toLocaleTimeString()
        this.addLog('info', `[${timestamp}] ${this.currentStageName}: ${stagePercentage.toFixed(1)}%`)
      }
    },
    
    handleSyncSuccess(taskData) {
      this.currentStatus = 'completed'
      this.endTime = new Date()
      this.overallProgress = 100
      
      if (this.progressInterval) {
        clearInterval(this.progressInterval)
        this.progressInterval = null
      }
      
      // 保存同步结果
      this.syncResults = taskData.results || {}
      
      const timestamp = new Date().toLocaleTimeString()
      this.addLog('success', `[${timestamp}] Synchronization completed successfully!`)
      this.addLog('info', `[${timestamp}] Results: ${this.syncResults.folders_synced || 0} folders, ${this.syncResults.files_synced || 0} files`)
      
      this.showCompletionDialog = true
    },
    
    handleSyncError(error) {
      this.currentStatus = 'error'
      this.endTime = new Date()
      
      if (this.progressInterval) {
        clearInterval(this.progressInterval)
        this.progressInterval = null
      }
      
      this.addLog('error', `Sync failed: ${error}`)
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    getTotalItems() {
      return (this.syncResults.folders_synced || 0) + (this.syncResults.files_synced || 0)
    },
    
    getTotalSize() {
      // Try to get total_size from results, fallback to 0 if not available or 0
      const totalSize = this.syncResults.total_size || 0
      if (totalSize > 0) {
        return totalSize
      }
      
      // If total_size is 0 or not available, try to estimate from other data
      // This is a fallback for the total_size calculation issue
      const estimatedSize = this.syncResults.estimated_size || 0
      return estimatedSize
    },
    
    addLog(level, message) {
      const log = {
        timestamp: new Date(),
        level,
        message
      }
      
      this.logs.push(log)
      
      // 限制日志数量
      if (this.logs.length > 500) {
        this.logs = this.logs.slice(-250)
      }
      
      // 自动滚动到底部
      if (this.autoScroll) {
        this.$nextTick(() => {
          const container = this.$refs.logContainer
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        })
      }
    },
    
    clearLogs() {
      this.logs = []
    },
    
    formatTime(timestamp) {
      return timestamp.toLocaleTimeString()
    },
    
    async cancelSync() {
      this.cancelling = true
      try {
        this.currentStatus = 'cancelled'
        this.endTime = new Date()
        this.addLog('warning', 'Sync cancelled by user')
        
        if (this.progressInterval) {
          clearInterval(this.progressInterval)
        }
      } catch (error) {
        this.addLog('error', `Failed to cancel sync: ${error.message}`)
      } finally {
        this.cancelling = false
      }
    },
    
    async retrySync() {
      // 重置状态
      this.currentStatus = 'preparing'
      this.overallProgress = 0
      this.currentStageProgress = 0
      this.currentStage = 'initializing'
      this.startTime = null
      this.endTime = null
      this.taskId = null
      this.syncResults = {}
      this.logs = []
      
      // 重新开始同步
      await this.startSync()
    },
    
    goBack() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.sync-progress-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.sync-header {
  margin-bottom: 30px;
}

.sync-header-content {
  text-align: center;
  color: white;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.sync-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.sync-icon {
  font-size: 48px;
}

.sync-icon.spinning {
  animation: spin 2s linear infinite;
}

.sync-title h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.sync-subtitle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.project-name {
  font-size: 18px;
  font-weight: 500;
}

.sync-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.progress-card, .log-card {
  border-radius: 12px;
}

.overall-progress {
  margin-bottom: 30px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.progress-header h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.progress-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-percentage {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.progress-status {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.status-preparing { background: #e6f7ff; color: #1890ff; }
.status-running { background: #f6ffed; color: #52c41a; }
.status-completed { background: #f6ffed; color: #52c41a; }
.status-error { background: #fff2f0; color: #ff4d4f; }
.status-cancelled { background: #fff7e6; color: #fa8c16; }

.main-progress-bar {
  margin-bottom: 16px;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-info {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #666;
}

.task-id {
  font-family: monospace;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.current-stage {
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stage-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.stage-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-icon {
  font-size: 16px;
}

.stage-icon.spinning {
  animation: spin 1s linear infinite;
}

.stage-icon.success { color: #52c41a; }
.stage-icon.error { color: #ff4d4f; }

.stage-name {
  font-weight: 500;
  color: #666;
}

.stage-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stage-stats {
  font-size: 12px;
  color: #999;
  min-width: 120px;
}

.log-card {
  height: fit-content;
  max-height: 600px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-header h4 {
  margin: 0;
  font-size: 16px;
}

.log-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-container {
  height: 400px;
  overflow-y: auto;
  background: #fafafa;
  border-radius: 8px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-entry {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  padding: 2px 0;
}

.log-time {
  color: #999;
  min-width: 80px;
}

.log-level {
  min-width: 60px;
  font-weight: 600;
}

.log-entry.info .log-level { color: #1890ff; }
.log-entry.success .log-level { color: #52c41a; }
.log-entry.warning .log-level { color: #fa8c16; }
.log-entry.error .log-level { color: #ff4d4f; }

.log-message {
  flex: 1;
  word-break: break-word;
}

.sync-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.completion-content {
  text-align: center;
  padding: 20px;
}

.completion-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.success-icon { color: #52c41a; }
.error-icon { color: #ff4d4f; }

.completion-summary h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
}

.completion-stats {
  margin-bottom: 24px;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: left;
}

.stat-icon {
  font-size: 20px;
  margin-right: 12px;
}

.stat-icon.success { color: #52c41a; }
.stat-icon.primary { color: #409eff; }
.stat-icon.warning { color: #e6a23c; }
.stat-icon.info { color: #909399; }
.stat-icon.error { color: #f56c6c; }

.stat-content {
  flex: 1;
}

.stat-label {
  display: block;
  color: #666;
  font-size: 12px;
  margin-bottom: 2px;
}

.stat-value {
  display: block;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.error-details {
  margin: 20px 0;
  padding: 16px;
  background: #fff2f0;
  border-radius: 8px;
  border: 1px solid #ffccc7;
  text-align: left;
}

.error-details h4 {
  margin: 0 0 12px 0;
  color: #cf1322;
  font-size: 14px;
}

.error-list {
  max-height: 120px;
  overflow-y: auto;
}

.error-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  font-size: 12px;
}

.error-icon {
  color: #ff4d4f;
  margin-right: 8px;
  margin-top: 2px;
}

.error-message {
  flex: 1;
  color: #666;
  line-height: 1.4;
}

.error-more {
  text-align: center;
  color: #999;
  font-style: italic;
  margin-top: 8px;
}

.sync-summary {
  padding: 16px;
  background: #f6ffed;
  border-radius: 8px;
  border: 1px solid #b7eb8f;
}

.summary-text {
  margin: 0;
  color: #333;
  line-height: 1.6;
}

.success-text {
  color: #52c41a;
  font-weight: 600;
}

.warning-text {
  color: #fa8c16;
  font-weight: 600;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sync-main {
    grid-template-columns: 1fr;
  }
  
  .sync-title {
    flex-direction: column;
    gap: 8px;
  }
  
  .sync-title h1 {
    font-size: 24px;
  }
  
  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .stat-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sync-progress-container {
    padding: 10px;
  }
  
  .sync-header-content {
    padding: 20px 15px;
  }
  
  .sync-subtitle {
    flex-direction: column;
    gap: 8px;
  }
  
  .progress-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .time-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
