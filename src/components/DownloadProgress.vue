<template>
  <div class="download-progress">
    <!-- 右下角下载图标 - 始终显示 -->
    <div 
      class="download-icon"
      @click="showModal = true">
      <div class="icon-container" :class="{ 'no-tasks': downloadTasks.length === 0 }">
        <icon-download class="download-icon-svg" />
        <div v-if="hasActiveDownloads" class="progress-ring">
          <svg class="progress-svg" width="40" height="40">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#e0e0e0"
              stroke-width="3"/>
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#409eff"
              stroke-width="3"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="strokeDashoffset"
              transform="rotate(-90 20 20)"/>
          </svg>
        </div>
        <div v-if="activeDownloadCount > 0" class="download-count">
          {{ activeDownloadCount }}
        </div>
      </div>
    </div>

    <!-- 下载进度模态框 -->
    <el-dialog 
      v-model="showModal" 
      title="Download Manager" 
      width="800px"
      :close-on-click-modal="false"
      class="download-modal">
      
      <div class="download-content">
        
        <!-- 统计信息 -->
        <div class="download-stats">
          <div class="stat-item">
            <span class="stat-number">{{ activeDownloadCount }}</span>
            <span class="stat-label">In Progress</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ completedDownloadCount }}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ totalDownloadSize }}</span>
            <span class="stat-label">Total Size</span>
          </div>
        </div>

        <!-- 当前下载任务 -->
        <div v-if="activeDownloads.length > 0" class="section">
          <h4>Downloading</h4>
          <div class="download-list">
            <div 
              v-for="task in activeDownloads" 
              :key="task.task_id" 
              class="download-item active"
              :class="{ 'expanded': expandedTasks.includes(task.task_id) }">
              <div class="item-header" @click="toggleTaskExpansion(task.task_id)">
                <div class="item-info">
                  <div class="item-name">
                    <icon-down 
                      class="expand-icon" 
                      :class="{ 'rotated': expandedTasks.includes(task.task_id) }" />
                    {{ getTaskDisplayName(task) }}
                  </div>
                  <div class="item-details">
                    {{ task.completed_files }}/{{ task.total_files }} 文件 • 
                    {{ formatFileSize(getTaskTotalSize(task)) }}
                  </div>
                </div>
                <div class="item-progress">
                  <el-progress 
                    :percentage="task.progress" 
                    :stroke-width="6"
                    :show-text="false" />
                  <span class="progress-text">{{ task.progress }}%</span>
                </div>
                <div class="item-actions" @click.stop>
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="cancelDownload(task.task_id)">
                    cancel
                  </el-button>
                </div>
              </div>
              
              <!-- 展开的文件列表 -->
              <div v-if="expandedTasks.includes(task.task_id)" class="task-file-list">
                <div v-if="task.file_progress && Object.keys(task.file_progress).length > 0" class="file-progress-section">
                  <h5>文件下载进度</h5>
                  <div class="file-list">
                    <div 
                      v-for="(progress, fileId) in task.file_progress" 
                      :key="fileId" 
                      class="file-item">
                      <div class="file-info">
                        <icon-file class="file-icon" />
                        <div class="file-details">
                          <div class="file-name">{{ progress.filename || `File ${fileId}` }}</div>
                          <div class="file-status">
                            <el-tag 
                              :type="getFileStatusType(progress.status)" 
                              size="small">
                              {{ getFileStatusText(progress.status) }}
                            </el-tag>
                            <span v-if="progress.status === 'downloading'" class="progress-percent">
                              {{ progress.progress }}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="file-progress" v-if="progress.status === 'downloading'">
                        <el-progress 
                          :percentage="progress.progress" 
                          :stroke-width="4"
                          :show-text="false" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 如果没有详细进度信息，显示基本文件信息 -->
                <div v-else-if="task.downloaded_files && task.downloaded_files.length > 0" class="basic-file-section">
                  <h5>已下载文件</h5>
                  <div class="file-list">
                    <div 
                      v-for="file in task.downloaded_files" 
                      :key="file.file_id || file" 
                      class="file-item">
                      <icon-file class="file-icon" />
                      <div class="file-info">
                        <div class="file-name">{{ getFileName(file) }}</div>
                        <div class="file-size">{{ formatFileSize(getFileSize(file)) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 空状态 -->
                <div v-else class="empty-file-list">
                  <p>暂无文件信息</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近完成的下载 -->
        <div v-if="recentDownloads.length > 0" class="section">
          <h4>最近完成</h4>
          <div class="download-list">
            <div 
              v-for="task in recentDownloads" 
              :key="task.task_id" 
              class="download-item completed">
              <div class="item-info">
                <div class="item-name">{{ getTaskDisplayName(task) }}</div>
                <div class="item-details">
                  {{ task.completed_files }} 文件 • 
                  {{ formatFileSize(getTaskTotalSize(task)) }} • 
                  {{ formatTime(task.end_time) }}
                </div>
              </div>
              <div class="item-status">
                <el-tag 
                  :type="task.status === 'completed' ? 'success' : 'warning'" 
                  size="small">
                  {{ getStatusText(task.status) }}
                </el-tag>
              </div>
              <div class="item-actions">
                <el-button 
                  type="text" 
                  size="small" 
                  @click="openDownloadFolder(task)">
                  打开文件夹
                </el-button>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="viewTaskDetail(task)">
                  详情
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 文件下载进度列表 -->
        <div v-if="selectedTask && (selectedTask.file_progress || selectedTask.downloaded_files?.length > 0)" class="section">
          <h4>文件下载进度</h4>
          <div class="file-progress-list">
            <!-- 显示每个文件的进度 -->
            <div 
              v-for="(progress, fileId) in selectedTask.file_progress" 
              :key="fileId" 
              class="file-progress-item">
              <div class="file-progress-info">
                <icon-file class="file-icon" />
                <div class="file-details">
                  <div class="file-name">{{ progress.filename || `File ${fileId}` }}</div>
                  <div class="file-status">
                    <el-tag 
                      :type="getFileStatusType(progress.status)" 
                      size="small">
                      {{ getFileStatusText(progress.status) }}
                    </el-tag>
                    <span v-if="progress.status === 'downloading'" class="progress-percent">
                      {{ progress.progress }}%
                    </span>
                  </div>
                </div>
              </div>
              <div class="file-progress-bar" v-if="progress.status === 'downloading'">
                <el-progress 
                  :percentage="progress.progress" 
                  :stroke-width="4"
                  :show-text="false" />
              </div>
              <div class="file-actions" v-if="progress.status === 'completed'">
                <el-button 
                  type="text" 
                  size="small" 
                  @click="openFile(progress)">
                  打开
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 已下载文件列表（兼容旧格式） -->
          <div v-if="selectedTask.downloaded_files?.length > 0 && !selectedTask.file_progress" class="file-list">
            <div 
              v-for="file in selectedTask.downloaded_files" 
              :key="file.file_id || file" 
              class="file-item">
              <icon-file class="file-icon" />
              <div class="file-info">
                <div class="file-name">{{ getFileName(file) }}</div>
                <div class="file-size">{{ formatFileSize(getFileSize(file)) }}</div>
              </div>
              <div class="file-actions">
                <el-button 
                  type="text" 
                  size="small" 
                  @click="openFile(file)">
                  打开
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!hasActiveDownloads && recentDownloads.length === 0" class="empty-state">
          <icon-folder-add class="empty-icon" />
          <p>暂无下载任务</p>
          <el-button type="primary" @click="$router.push('/download-config')">
            开始下载
          </el-button>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showModal = false">Close</el-button>
          <el-button type="primary" @click="$router.push('/download-tasks')">
            查看所有任务
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { 
  IconDownload,
  IconFile,
  IconFolderAdd,
  IconDown
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'DownloadProgress',
  components: {
    IconDownload,
    IconFile,
    IconFolderAdd,
    IconDown
  },
  data() {
    return {
      showModal: false,
      downloadTasks: [],
      selectedTask: null,
      refreshTimer: null,
      circumference: 2 * Math.PI * 16, // 圆的周长
      expandedTasks: [], // 展开的任务列表
      loadingTasks: false // 防止重复加载
    }
  },
  computed: {
    activeDownloads() {
      return this.downloadTasks.filter(task => 
        task.status === 'running' || task.status === 'pending'
      )
    },
    
    recentDownloads() {
      return this.downloadTasks
        .filter(task => 
          task.status === 'completed' || task.status === 'completed_with_errors'
        )
        .sort((a, b) => new Date(b.end_time) - new Date(a.end_time))
        .slice(0, 5) // 只显示最近5个
    },
    
    hasActiveDownloads() {
      return this.activeDownloads.length > 0
    },
    
    activeDownloadCount() {
      return this.activeDownloads.length
    },
    
    completedDownloadCount() {
      return this.downloadTasks.filter(task => 
        task.status === 'completed' || task.status === 'completed_with_errors'
      ).length
    },
    
    totalDownloadSize() {
      const totalBytes = this.downloadTasks.reduce((total, task) => {
        return total + this.getTaskTotalSize(task)
      }, 0)
      return this.formatFileSize(totalBytes)
    },
    
    overallProgress() {
      if (this.activeDownloads.length === 0) return 100
      
      const totalProgress = this.activeDownloads.reduce((sum, task) => {
        return sum + (task.progress || 0)
      }, 0)
      
      return Math.round(totalProgress / this.activeDownloads.length)
    },
    
    strokeDashoffset() {
      const progress = this.overallProgress
      return this.circumference - (progress / 100) * this.circumference
    }
  },
  async mounted() {
    console.log('🚀 DownloadProgress 组件已挂载')
    await this.loadDownloadTasks()
    this.startAutoRefresh()
    
    // 监听显示下载模态框事件
    this.$eventBus.on('show-download-modal', (taskId) => {
      console.log('📢 收到显示下载模态框事件:', taskId)
      this.showModal = true
      if (taskId) {
        // 如果提供了任务ID，选中该任务
        const task = this.downloadTasks.find(t => t.task_id === taskId)
        if (task) {
          this.selectedTask = task
          console.log('✅ 找到并选中任务:', task.task_id)
        } else {
          console.warn('⚠️ 未找到指定任务:', taskId)
        }
      }
    })
    
    // 监听新下载任务开始事件
    this.$eventBus.on('download-task-started', (taskId) => {
      console.log('📢 收到新下载任务开始事件，任务ID:', taskId)
      // 添加短暂延迟确保任务已完全创建
      setTimeout(() => {
        console.log('🔄 延迟刷新下载任务状态')
        this.loadDownloadTasks()
      }, 1000) // 1秒延迟
    })
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    async loadDownloadTasks() {
      // 防止重复调用
      if (this.loadingTasks) {
        console.log('🔄 下载任务正在加载中，跳过重复请求')
        return
      }
      
      this.loadingTasks = true
      try {
        console.log('🔄 开始加载下载任务...')
        const response = await axios.get('/api/download-config/downloads')
        console.log('📡 API响应:', response.status, response.data)
        
        if (response.data.status === 'success') {
          this.downloadTasks = response.data.tasks || []
          console.log('✅ 下载任务加载成功:', this.downloadTasks.length, '个任务')
          console.log('📋 任务详情:', this.downloadTasks)
        } else {
          console.warn('⚠️ API返回非成功状态:', response.data)
          this.downloadTasks = []
        }
      } catch (error) {
        console.error('❌ 加载下载任务失败:', error)
        console.error('错误详情:', error.response?.data)
        // 如果API调用失败，设置空数组避免界面错误
        this.downloadTasks = []
      } finally {
        this.loadingTasks = false
      }
    },
    
    async cancelDownload(taskId) {
      try {
        await axios.post(`/api/download-config/download/${taskId}/cancel`)
        this.$message.success('Download task cancelled')
        await this.loadDownloadTasks()
      } catch (error) {
        this.$message.error('Cancel download failed: ' + (error.response?.data?.error || error.message))
      }
    },
    
    viewTaskDetail(task) {
      this.selectedTask = task
      this.$router.push({
        path: '/download-tasks',
        query: { taskId: task.task_id }
      })
    },
    
    async openDownloadFolder(task) {
      try {
        const projectName = this.getProjectNameFromCache(task.project_id) || task.project_name || 'Project Files'
        
        const response = await axios.post('/api/download-config/open-folder', {
          task_id: task.task_id,
          project_name: projectName
        })
        
        if (response.data.status === 'success') {
          this.$message.success(`已打开文件夹: ${projectName}`)
        } else {
          this.$message.error('打开文件夹失败: ' + response.data.error)
        }
      } catch (error) {
        console.error('打开文件夹失败:', error)
        const projectName = this.getProjectNameFromCache(task.project_id) || task.project_name || 'Project Files'
        
        // 如果API调用失败，显示文件夹路径信息
        if (error.response?.status === 404) {
          this.$message.warning(`文件夹不存在，可能文件还未下载完成`)
        } else if (error.response?.status === 400 && error.response?.data?.error?.includes('不支持的操作系统')) {
          this.$message.info(`文件保存在: ACC_BACKUP/assets/${projectName}/`)
        } else {
          this.$message.error('打开文件夹失败: ' + (error.response?.data?.error || error.message))
          // 作为备选方案，显示文件夹路径
          this.$message.info(`文件保存在: ACC_BACKUP/assets/${projectName}/`)
        }
      }
    },
    
    openFile(file) {
      // 在实际应用中，这里可以打开文件
      const filename = this.getFileName(file)
      this.$message.info(`打开文件: ${filename}`)
    },
    
    getProjectNameFromCache(projectId) {
      // 从localStorage获取项目名称
      try {
        if (!projectId) return null
        
        const projectData = localStorage.getItem('acc_projects')
        if (projectData) {
          const parsedData = JSON.parse(projectData)
          const projects = parsedData.projects?.list || []
          const project = projects.find(p => p.id === projectId)
          if (project && project.name) {
            return project.name
          }
        }
      } catch (error) {
        console.warn('从缓存获取项目名称失败:', error)
      }
      return null
    },

    getTaskDisplayName(task) {
      // 优先使用缓存中的项目名称
      const cachedProjectName = this.getProjectNameFromCache(task.project_id)
      if (cachedProjectName) {
        return `${cachedProjectName} (${task.total_files}个文件)`
      }
      
      // 其次使用任务中的项目名称
      if (task.project_name && task.project_name !== 'Project Files') {
        return `${task.project_name} (${task.total_files}个文件)`
      }
      
      // 尝试从下载的文件中获取项目名称或使用项目ID
      if (task.downloaded_files && task.downloaded_files.length > 0) {
        const firstFile = task.downloaded_files[0]
        if (typeof firstFile === 'object' && firstFile.original_name) {
          return `${task.total_files}个文件 (${firstFile.original_name}等)`
        }
      }
      return `项目文件下载 (${task.total_files}个文件)`
    },
    
    getTaskTotalSize(task) {
      if (!task.downloaded_files) return 0
      
      return task.downloaded_files.reduce((total, file) => {
        if (typeof file === 'object') {
          return total + (file.file_size || file.original_size || 0)
        }
        return total
      }, 0)
    },
    
    getFileName(file) {
      if (typeof file === 'object') {
        return file.filename || file.original_name || 'Unknown File'
      }
      return file || 'Unknown File'
    },
    
    getFileSize(file) {
      if (typeof file === 'object') {
        return file.file_size || file.original_size || 0
      }
      return 0
    },
    
    getStatusText(status) {
      const statusMap = {
        'pending': '等待中',
        'running': '下载中',
        'completed': '已完成',
        'completed_with_errors': '部分失败',
        'failed': '失败',
        'cancelled': '已cancel'
      }
      return statusMap[status] || status
    },
    
    getFileStatusType(status) {
      const statusMap = {
        'downloading': 'warning',
        'completed': 'success',
        'failed': 'danger',
        'pending': 'info'
      }
      return statusMap[status] || 'info'
    },
    
    getFileStatusText(status) {
      const statusMap = {
        'downloading': '下载中',
        'completed': '已完成',
        'failed': '失败',
        'pending': '等待中'
      }
      return statusMap[status] || status
    },
    
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    formatTime(timeStr) {
      if (!timeStr) return ''
      try {
        const date = new Date(timeStr)
        const now = new Date()
        const diff = now - date
        
        if (diff < 60000) return '刚刚'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
        
        return date.toLocaleDateString('zh-CN')
      } catch {
        return timeStr
      }
    },
    
    startAutoRefresh() {
      // 智能轮询：活动任务时频繁轮询，无活动任务时偶尔检查
      let pollCount = 0
      this.refreshTimer = setInterval(() => {
        // 如果正在加载，跳过本次轮询
        if (this.loadingTasks) {
          console.log('💤 任务正在加载中，跳过轮询')
          return
        }
        
        pollCount++
        
        if (this.hasActiveDownloads) {
          // 有活动下载任务时，每次都刷新
          console.log('🔄 检测到活动下载任务，刷新状态...')
          this.loadDownloadTasks()
          pollCount = 0 // 重置计数器
        } else if (pollCount >= 6) {
          // 无活动任务时，每60秒检查一次是否有新任务（6 * 10秒 = 60秒）
          console.log('🔍 定期检查是否有新下载任务...')
          this.loadDownloadTasks()
          pollCount = 0 // 重置计数器
        } else {
          console.log('💤 无活动下载任务，跳过轮询')
        }
      }, 10000)
    },
    
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    
    toggleTaskExpansion(taskId) {
      const index = this.expandedTasks.indexOf(taskId)
      if (index > -1) {
        this.expandedTasks.splice(index, 1)
      } else {
        this.expandedTasks.push(taskId)
      }
    }
  }
}
</script>

<style scoped>
.download-progress {
  position: relative;
}

.download-icon {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-icon:hover {
  transform: scale(1.1);
}

.icon-container {
  position: relative;
  width: 50px;
  height: 50px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transition: all 0.3s ease;
}

/* 无任务时的样式 */
.icon-container.no-tasks {
  background: #909399;
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.4);
}

.icon-container:hover {
  background: #337ecc;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.6);
}

.download-icon-svg {
  color: white;
  font-size: 20px;
  z-index: 2;
}

.progress-ring {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 60px;
  height: 60px;
}

.progress-svg {
  transform: rotate(-90deg);
}

.download-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f56c6c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.download-modal {
  .el-dialog__body {
    padding: 20px;
  }
}

.download-content {
  max-height: 600px;
  overflow-y: auto;
}

.download-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.section {
  margin-bottom: 20px;
}

.section h4 {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.download-item {
  border: 1px solid #eee;
  border-radius: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.item-header {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.item-header:hover {
  background-color: #f8f9fa;
}

.download-item:hover {
  border-color: #409eff;
  background: #f0f8ff;
}

.download-item.active {
  border-color: #409eff;
  background: #f0f8ff;
}

.download-item.completed {
  border-color: #67c23a;
  background: #f0f9ff;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-icon {
  transition: transform 0.3s ease;
  color: #666;
  font-size: 14px;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.item-details {
  font-size: 12px;
  color: #666;
}

.item-progress {
  width: 120px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 15px;
}

.progress-text {
  font-size: 12px;
  color: #666;
  min-width: 35px;
}

.item-status {
  margin: 0 15px;
}

.item-actions {
  display: flex;
  gap: 5px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fafafa;
}

.file-icon {
  color: #409eff;
  margin-right: 10px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.file-actions {
  margin-left: 10px;
}

.file-progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-progress-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.file-progress-item:hover {
  border-color: #409eff;
  background: #f0f8ff;
}

.file-progress-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
  margin-left: 10px;
}

.file-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-percent {
  font-size: 12px;
  color: #666;
}

.file-progress-bar {
  width: 120px;
  margin: 0 15px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.task-file-list {
  background-color: #f8f9fa;
  border-top: 1px solid #eee;
  padding: 15px;
}

.file-progress-section h5,
.basic-file-section h5 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.task-file-list .file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-file-list .file-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.task-file-list .file-item:hover {
  border-color: #409eff;
  background: #f0f8ff;
}

.task-file-list .file-details {
  flex: 1;
  min-width: 0;
  margin-left: 8px;
}

.task-file-list .file-name {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-file-list .file-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-file-list .file-progress {
  width: 100px;
  margin-left: 10px;
}

.empty-file-list {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .download-icon {
    bottom: 15px;
    right: 15px;
  }
  
  .icon-container {
    width: 45px;
    height: 45px;
  }
  
  .download-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .item-progress {
    width: 100%;
    margin: 0;
  }
  
  .item-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .task-file-list .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .task-file-list .file-progress {
    width: 100%;
    margin-left: 0;
  }
}
</style>
