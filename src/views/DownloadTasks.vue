<template>
    <div class="download-tasks">
      <!-- 面包屑导航 -->
      <Breadcrumb />
      
      <!-- 页面头部 -->
      <PageHeader
        title="Download Task Management"
        description="Monitor and manage file download tasks"
        :icon="IconEye" />
  
      <!-- 任务统计 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ taskStats.total }}</div>
              <div class="stat-label">总任务数</div>
            </div>
            <icon-list class="stat-icon" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card running">
            <div class="stat-content">
              <div class="stat-number">{{ taskStats.running }}</div>
              <div class="stat-label">运行中</div>
            </div>
            <icon-loading class="stat-icon" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card completed">
            <div class="stat-content">
              <div class="stat-number">{{ taskStats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
            <icon-check-circle class="stat-icon" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card failed">
            <div class="stat-content">
              <div class="stat-number">{{ taskStats.failed }}</div>
              <div class="stat-label">失败</div>
            </div>
            <icon-close-circle class="stat-icon" />
          </el-card>
        </el-col>
      </el-row>
  
      <!-- 任务列表 -->
      <el-card class="tasks-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-list />
              下载任务列表
            </span>
            <div class="header-actions">
              <el-button type="text" @click="refreshTasks" :loading="loading">
                <icon-refresh />
                刷新
              </el-button>
              <el-button type="primary" @click="$router.push('/download-config')">
                <icon-plus />
                新建任务
              </el-button>
            </div>
          </div>
        </template>
        
        <div class="tasks-content">
          <el-table :data="tasks" v-loading="loading" style="width: 100%">
            <el-table-column prop="task_id" label="Task ID" width="200" show-overflow-tooltip />
            <el-table-column prop="project_id" label="Project" width="150" show-overflow-tooltip />
            <el-table-column label="Status" width="120">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)" size="small">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Progress" width="200">
              <template #default="scope">
                <div class="progress-cell">
                  <el-progress 
                    :percentage="scope.row.progress" 
                    :status="getProgressStatus(scope.row.status)"
                    :stroke-width="8" />
                  <span class="progress-text">
                    {{ scope.row.completed_files }}/{{ scope.row.total_files }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="start_time" label="Start Time" width="160">
              <template #default="scope">
                {{ formatTime(scope.row.start_time) }}
              </template>
            </el-table-column>
            <el-table-column label="Duration" width="100">
              <template #default="scope">
                {{ calculateDuration(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="200">
              <template #default="scope">
                <div class="action-buttons">
                  <el-button type="text" size="small" @click="viewTaskDetail(scope.row)">
                    <icon-eye />
                    详情
                  </el-button>
                  <el-button 
                    v-if="scope.row.status === 'running'" 
                    type="text" 
                    size="small" 
                    @click="cancelTask(scope.row.task_id)">
                    <icon-close />
                    cancel
                  </el-button>
                  <el-button 
                    v-if="scope.row.status === 'failed'" 
                    type="text" 
                    size="small" 
                    @click="retryTask(scope.row)">
                    <icon-refresh />
                    重试
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 空状态 -->
          <div v-if="!loading && tasks.length === 0" class="empty-state">
            <icon-folder-add class="empty-icon" />
            <p>暂无下载任务</p>
            <el-button type="primary" @click="$router.push('/download-config')">
              创建第一个下载任务
            </el-button>
          </div>
        </div>
      </el-card>
  
      <!-- 任务详情对话框 -->
      <el-dialog 
        v-model="showTaskDetail" 
        title="Task Details" 
        width="800px"
        :close-on-click-modal="false">
        
        <div v-if="selectedTask" class="task-detail">
          
          <!-- basicInfo -->
          <el-descriptions title="Basic Information" :column="2" border>
            <el-descriptions-item label="Task ID">{{ selectedTask.task_id }}</el-descriptions-item>
            <el-descriptions-item label="Project ID">{{ selectedTask.project_id }}</el-descriptions-item>
            <el-descriptions-item label="Status">
              <el-tag :type="getStatusType(selectedTask.status)">
                {{ getStatusText(selectedTask.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Progress">{{ selectedTask.progress }}%</el-descriptions-item>
            <el-descriptions-item label="Total Files">{{ selectedTask.total_files }}</el-descriptions-item>
            <el-descriptions-item label="Completed">{{ selectedTask.completed_files }}</el-descriptions-item>
            <el-descriptions-item label="Failed">{{ selectedTask.failed_files }}</el-descriptions-item>
            <el-descriptions-item label="Start Time">{{ formatTime(selectedTask.start_time) }}</el-descriptions-item>
          </el-descriptions>
  
          <!-- 下载选项 -->
          <div class="detail-section">
            <h4>下载选项</h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Download Path">
                {{ selectedTask.options?.downloadPath || 'ACC_BACKUP/assets' }}
              </el-descriptions-item>
              <el-descriptions-item label="Concurrency">
                {{ selectedTask.options?.concurrency || 3 }}
              </el-descriptions-item>
              <el-descriptions-item label="Retry Count">
                {{ selectedTask.options?.retryCount || 2 }}
              </el-descriptions-item>
              <el-descriptions-item label="Timeout">
                {{ selectedTask.options?.timeout || 120 }}秒
              </el-descriptions-item>
            </el-descriptions>
          </div>
  
        <!-- 已下载文件 -->
        <div class="detail-section" v-if="selectedTask.downloaded_files?.length > 0">
          <h4>已下载文件 ({{ selectedTask.downloaded_files.length }})</h4>
          <el-table :data="getDownloadedFilesData(selectedTask.downloaded_files)" max-height="200">
            <el-table-column prop="original_name" label="Original Filename" show-overflow-tooltip />
            <el-table-column prop="filename" label="Download Filename" show-overflow-tooltip />
            <el-table-column prop="file_size" label="Size" width="100">
              <template #default="scope">
                {{ formatFileSize(scope.row.file_size || scope.row.size || 0) }}
              </template>
            </el-table-column>
            <el-table-column prop="download_time" label="Download Time" width="150">
              <template #default="scope">
                {{ formatTime(scope.row.download_time) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
  
          <!-- 错误信息 -->
          <div class="detail-section" v-if="selectedTask.errors?.length > 0">
            <h4>错误信息 ({{ selectedTask.errors.length }})</h4>
            <div class="error-list">
              <div v-for="(error, index) in selectedTask.errors" :key="index" class="error-item">
                <icon-warning class="error-icon" />
                <span>{{ error }}</span>
              </div>
            </div>
          </div>
  
          <!-- 实时日志 -->
          <div class="detail-section" v-if="selectedTask.status === 'running'">
            <h4>实时日志</h4>
            <div class="log-container">
              <div v-for="(log, index) in taskLogs" :key="index" class="log-item">
                <span class="log-time">{{ formatTime(log.time) }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </div>
  
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showTaskDetail = false">关闭</el-button>
            <el-button 
              v-if="selectedTask?.status === 'running'" 
              type="danger" 
              @click="cancelTask(selectedTask.task_id)">
              cancel任务
            </el-button>
            <el-button 
              v-if="selectedTask?.status === 'failed'" 
              type="primary" 
              @click="retryTask(selectedTask)">
              重试任务
            </el-button>
          </div>
        </template>
      </el-dialog>
  
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  import Breadcrumb from '../components/Breadcrumb.vue'
  import PageHeader from '../components/PageHeader.vue'
  import { 
    IconEye,
    IconList,
    IconLoading,
    IconCheckCircle,
    IconCloseCircle,
    IconRefresh,
    IconPlus,
    IconClose,
    IconFolderAdd,
    IconExclamation 
  } from '@arco-design/web-vue/es/icon'
  
  export default {
    name: 'DownloadTasks',
    components: {
      Breadcrumb,
      PageHeader,
      IconEye,
      IconList,
      IconLoading,
      IconCheckCircle,
      IconCloseCircle,
      IconRefresh,
      IconPlus,
      IconClose,
      IconFolderAdd,
      IconExclamation 
    },
    data() {
      return {
        tasks: [],
        loading: false,
        showTaskDetail: false,
        selectedTask: null,
        taskLogs: [],
        refreshTimer: null
      }
    },
    computed: {
      taskStats() {
        const stats = {
          total: this.tasks.length,
          running: 0,
          completed: 0,
          failed: 0
        }
        
        this.tasks.forEach(task => {
          if (task.status === 'running' || task.status === 'pending') {
            stats.running++
          } else if (task.status === 'completed' || task.status === 'completed_with_errors') {
            stats.completed++
          } else if (task.status === 'failed' || task.status === 'cancelled') {
            stats.failed++
          }
        })
        
        return stats
      }
    },
    async mounted() {
      await this.loadTasks()
      
      // 检查是否有指定的任务ID需要显示
      if (this.$route.query.taskId) {
        const task = this.tasks.find(t => t.task_id === this.$route.query.taskId)
        if (task) {
          this.viewTaskDetail(task)
        }
      }
      
      // 启动自动刷新
      this.startAutoRefresh()
    },
    beforeUnmount() {
      this.stopAutoRefresh()
    },
    methods: {
      async loadTasks() {
        this.loading = true
        try {
          const response = await axios.get('/api/download-config/downloads')
          if (response.data.status === 'success') {
            this.tasks = response.data.tasks || []
          }
        } catch (error) {
          this.$message.error('Failed to load task list: ' + (error.response?.data?.error || error.message))
        } finally {
          this.loading = false
        }
      },
      
      async refreshTasks() {
        await this.loadTasks()
        this.$message.success('Task list refreshed')
      },
      
      async viewTaskDetail(task) {
        this.selectedTask = task
        this.showTaskDetail = true
        
        // 如果是运行中的任务，加载实时日志
        if (task.status === 'running') {
          this.loadTaskLogs(task.task_id)
        }
      },
      
      async cancelTask(taskId) {
        try {
          const response = await axios.post(`/api/download-config/download/${taskId}/cancel`)
          if (response.data.status === 'success') {
            this.$message.success('Task cancelled')
            await this.loadTasks()
            
            // 如果详情对话框打开，更新选中的任务
            if (this.selectedTask && this.selectedTask.task_id === taskId) {
              this.selectedTask = this.tasks.find(t => t.task_id === taskId)
            }
          }
        } catch (error) {
          this.$message.error('Failed to cancel task: ' + (error.response?.data?.error || error.message))
        }
      },
      
      async retryTask(task) {
        try {
          // 创建新的下载任务（重试）
          const retryData = {
            project_id: task.project_id,
            file_ids: task.file_ids || [],
            options: task.options || {}
          }
          
          const response = await axios.post('/api/download-config/download', retryData)
          if (response.data.status === 'success') {
            this.$message.success(`Retry task created: ${response.data.task_id}`)
            
            // 通知下载进度组件有新任务开始
            this.$eventBus.emit('download-task-started', response.data.task_id)
            
            await this.loadTasks()
            this.showTaskDetail = false
          }
        } catch (error) {
          this.$message.error('Failed to retry task: ' + (error.response?.data?.error || error.message))
        }
      },
      
      async loadTaskLogs(taskId) {
        // 模拟实时日志加载
        this.taskLogs = [
          { time: new Date().toISOString(), message: 'Starting download task...' },
          { time: new Date().toISOString(), message: 'Processing file list...' },
          { time: new Date().toISOString(), message: 'Starting file download...' }
        ]
      },
      
      startAutoRefresh() {
        // 每10秒自动刷新任务状态
        this.refreshTimer = setInterval(() => {
          if (this.taskStats.running > 0) {
            this.loadTasks()
          }
        }, 10000)
      },
      
      stopAutoRefresh() {
        if (this.refreshTimer) {
          clearInterval(this.refreshTimer)
          this.refreshTimer = null
        }
      },
      
      getStatusType(status) {
        const statusMap = {
          'pending': 'info',
          'running': 'warning',
          'completed': 'success',
          'completed_with_errors': 'warning',
          'failed': 'danger',
          'cancelled': 'info'
        }
        return statusMap[status] || 'info'
      },
      
      getStatusText(status) {
        const statusMap = {
          'pending': 'Pending',
          'running': 'Running',
          'completed': 'Completed',
          'completed_with_errors': 'Partially Failed',
          'failed': 'Failed',
          'cancelled': 'Cancelled'
        }
        return statusMap[status] || status
      },
      
      getProgressStatus(status) {
        if (status === 'completed') return 'success'
        if (status === 'failed') return 'exception'
        if (status === 'completed_with_errors') return 'warning'
        return null
      },
      
      formatTime(timeStr) {
        if (!timeStr) return '-'
        try {
          return new Date(timeStr).toLocaleString('zh-CN')
        } catch {
          return timeStr
        }
      },
      
      calculateDuration(task) {
        if (!task.start_time) return '-'
        
        const start = new Date(task.start_time)
        const end = task.end_time ? new Date(task.end_time) : new Date()
        const duration = Math.floor((end - start) / 1000)
        
        if (duration < 60) return `${duration}s`
        if (duration < 3600) return `${Math.floor(duration / 60)}m`
        return `${Math.floor(duration / 3600)}h${Math.floor((duration % 3600) / 60)}m`
      },
      
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    getDownloadedFilesData(downloadedFiles) {
      if (!downloadedFiles) return []
      
      return downloadedFiles.map(file => {
        // 处理新格式的文件数据（对象格式）
        if (typeof file === 'object' && file.file_id) {
          return {
            file_id: file.file_id,
            original_name: file.original_name || 'Unknown File',
            filename: file.filename || 'Unknown File',
            file_size: file.file_size || file.original_size || 0,
            download_time: file.download_time
          }
        }
        
        // 处理旧格式的文件数据（字符串格式）
        return {
          file_id: file,
          original_name: file,
          filename: file,
          file_size: 0,
          download_time: null
        }
      })
    }
  }
}
</script>
  
  <style scoped>
  .download-tasks {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .stats-row {
    margin-bottom: 20px;
  }
  
  .stat-card {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .stat-card.running {
    border-left: 4px solid #e6a23c;
  }
  
  .stat-card.completed {
    border-left: 4px solid #67c23a;
  }
  
  .stat-card.failed {
    border-left: 4px solid #f56c6c;
  }
  
  .stat-content {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .stat-number {
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }
  
  .stat-label {
    font-size: 14px;
    color: #666;
  }
  
  .stat-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 24px;
    color: #ddd;
  }
  
  .tasks-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
  
  .card-header span {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
  
  .progress-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .progress-text {
    font-size: 12px;
    color: #666;
    min-width: 50px;
  }
  
  .action-buttons {
    display: flex;
    gap: 5px;
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
  }
  
  .empty-icon {
    font-size: 48px;
    color: #ddd;
    margin-bottom: 20px;
  }
  
  .empty-state p {
    margin-bottom: 20px;
    font-size: 16px;
  }
  
  .task-detail {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .detail-section h4 {
    margin-bottom: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
  
  .error-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 10px;
  }
  
  .error-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
    padding: 8px;
    background-color: #fef0f0;
    border-radius: 4px;
  }
  
  .error-icon {
    color: #f56c6c;
    margin-top: 2px;
  }
  
  .log-container {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 10px;
    background-color: #f8f9fa;
    font-family: 'Courier New', monospace;
  }
  
  .log-item {
    display: flex;
    gap: 10px;
    margin-bottom: 5px;
    font-size: 12px;
  }
  
  .log-time {
    color: #666;
    min-width: 80px;
  }
  
  .log-message {
    color: #333;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .download-tasks {
      padding: 10px;
    }
    
    .stats-row .el-col {
      margin-bottom: 10px;
    }
    
    .header-actions {
      flex-direction: column;
      gap: 5px;
    }
    
    .action-buttons {
      flex-direction: column;
      gap: 2px;
    }
  }
  </style>