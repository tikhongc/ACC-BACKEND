<template>
  <div>
    <!-- 智能同步按钮 -->
    <el-button 
      type="primary" 
      @click="handleSmartSyncClick" 
      class="smart-sync-button"
      :loading="syncChoiceLoading">
      <icon-sync />
      {{ $t('home.smartSync') }}
    </el-button>

    <!-- 项目选择对话框 - 使用 Teleport 确保在正确位置渲染 -->
    <Teleport to="body">
      <ProjectSelector
        v-model="showProjectSelector"
        :multiple="false"
        :auto-refresh="false"
        @confirm="handleProjectSelected"
        @cancel="handleProjectSelectionCancel" />
    </Teleport>

    <!-- 同步方式选择对话框 - 使用 Teleport 确保在正确位置渲染 -->
    <Teleport to="body">
      <el-dialog
        v-model="showSyncChoiceDialog"
        :title="$t('home.selectSyncMethod')"
        width="500px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        center>
      <div class="sync-choice-content">
        <div class="sync-choice-header">
          <icon-sync class="sync-icon" />
          <h3>Select Sync Method</h3>
          <p>Project "{{ selectedProject?.name || '' }}" already exists in the database. Please choose the appropriate sync method:</p>
        </div>
        
        <div class="sync-options">
          <div class="sync-option full-sync" @click="handleSyncChoice('full')">
            <div class="sync-option-icon">
              <icon-sync />
            </div>
            <div class="sync-option-content">
              <h4>🔄 Full Sync</h4>
              <p class="sync-description">Complete re-synchronization with optimized performance</p>
              <ul class="sync-features">
                <li>• 🚀 Optimized concurrent processing (5x faster)</li>
                <li>• Re-fetch complete folder structure</li>
                <li>• Sync all files and version information</li>
                <li>• Update custom attributes and permissions</li>
                <li>• Suitable for data inconsistency or long periods without sync</li>
              </ul>
              <div class="sync-time">⏱️ Estimated time: Much faster than before (optimized)</div>
            </div>
          </div>
          
          <div class="sync-option incremental-sync" @click="handleSyncChoice('incremental')">
            <div class="sync-option-icon">
              <icon-sync />
            </div>
            <div class="sync-option-content">
              <h4>⚡ Incremental Sync</h4>
              <p class="sync-description">Smart change detection with concurrent processing</p>
              <ul class="sync-features">
                <li>• 🧠 Intelligent timestamp-based change detection</li>
                <li>• 🚀 Concurrent BFS traversal for faster processing</li>
                <li>• Detect added, modified, deleted files</li>
                <li>• Update file versions and status changes</li>
                <li>• Sync new custom attributes</li>
                <li>• Fast and efficient, recommended for daily use</li>
              </ul>
              <div class="sync-time">⏱️ Estimated time: Very fast (optimized algorithms)</div>
            </div>
          </div>
        </div>
      </div>
      
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="handleSyncChoiceCancel">{{ $t('common.cancel') }}</el-button>
          </span>
        </template>
      </el-dialog>
    </Teleport>
  </div>
</template>

<script>
import axios from 'axios'
import ProjectSelector from './ProjectSelector.vue'
import { IconSync } from '@arco-design/web-vue/es/icon'

export default {
  name: 'SmartSyncDialog',
  components: {
    ProjectSelector,
    IconSync
  },
  emits: ['sync-result'],
  data() {
    return {
      showProjectSelector: false,
      showSyncChoiceDialog: false,
      syncChoiceLoading: false,
      selectedProject: null
    }
  },
  methods: {
    // 智能同步点击处理
    handleSmartSyncClick() {
      this.showProjectSelector = true
    },

    // 处理项目选择确认
    handleProjectSelected(selectedProject) {
      // 确保项目对象有必要的属性
      if (!selectedProject) {
        this.$message.error('No project data received')
        return
      }
      
      // 标准化项目数据，处理不同的数据格式
      // 处理缓存数据 vs API数据的不同结构
      let projectId = selectedProject.id
      let originalId = selectedProject.originalId
      let projectName = selectedProject.name || selectedProject.attributes?.name || 'Unknown Project'
      
      // 如果没有 originalId（缓存数据），但 id 有 'b.' 前缀，则设置 originalId
      if (!originalId && projectId && projectId.startsWith('b.')) {
        originalId = projectId
        projectId = projectId.substring(2) // 移除 'b.' 前缀作为标准化 ID
      }
      // 如果有 originalId 但没有标准化的 id，则从 originalId 生成
      else if (originalId && !projectId) {
        projectId = originalId.startsWith('b.') ? originalId.substring(2) : originalId
      }
      // 如果都没有 originalId，但有 projectId，生成 originalId
      else if (!originalId && projectId) {
        originalId = projectId.startsWith('b.') ? projectId : `b.${projectId}`
      }
      
      this.selectedProject = {
        // 使用标准化的 ID（不带 b. 前缀）
        id: projectId,
        // 保留原始 ID（带 b. 前缀，用于 API 调用）
        originalId: originalId,
        // 确保有项目名称
        name: projectName,
        // 保留其他属性（但不覆盖上面设置的关键属性）
        type: selectedProject.type,
        isActive: selectedProject.isActive,
        status: selectedProject.status,
        permissions: selectedProject.permissions,
        attributes: selectedProject.attributes
      }
      
      // Close the project selector dialog
      this.showProjectSelector = false
      
      this.$message.success(`Selected project: ${this.selectedProject.name}`)
      this.handleSmartSync()
    },

    // 处理项目选择取消
    handleProjectSelectionCancel() {
      this.selectedProject = null
    },

    // 智能同步处理
    async handleSmartSync() {
      if (!this.selectedProject) {
        this.$message.error('No project selected')
        return
      }

      try {
        this.syncChoiceLoading = true
        
        // 更安全的项目名称获取
        const projectName = this.selectedProject.name || 
                           this.selectedProject.attributes?.name || 
                           'Unknown Project'
        
        // 使用 originalId（带 b. 前缀）进行 API 调用
        const projectId = this.selectedProject.originalId
        
        // 确保项目ID存在
        if (!projectId) {
          console.error('Project data missing originalId:', this.selectedProject)
          this.$message.error('Invalid project data: missing ID. Please select project again.')
          return
        }
        
        console.log('Project processing:', {
          originalProject: this.selectedProject,
          projectName,
          projectId
        })
        
        this.$message.info(`Checking if project "${projectName}" exists in database...`)
        
        // 检查项目同步状态 - 404是正常情况，不需要显示错误
        const statusResponse = await axios.get(`/api/file-sync-db/project/${projectId}/sync-status`, {
          validateStatus: function (status) {
            // 接受200和404作为正常响应，避免axios抛出错误
            return status === 200 || status === 404;
          }
        })
        
        // 检查响应状态
        if (statusResponse.status === 404) {
          // 项目不存在于数据库中，这是首次同步的正常情况
          this.handleSyncStatusError({ response: { status: 404, data: { error: '项目不存在' } } })
        } else if (statusResponse.data.success) {
          const projectData = statusResponse.data.data.project
          const hasBeenSynced = projectData && projectData.sync_info && projectData.sync_info.last_sync_time
          
          if (hasBeenSynced) {
            // 项目已同步过，显示选择对话框
            this.$message.success(`Project "${projectName}" found in database. Please select sync method.`)
            this.showSyncChoiceDialog = true
          } else {
            // 项目存在但未同步过，提示需要全量同步
            this.$confirm(
              `Project "${projectName}" exists in database but has not completed initial sync.\nFull sync is required to establish complete data structure.\n\nStart full sync immediately?`,
              'Full Sync Required',
              {
                confirmButtonText: 'Start Full Sync',
                cancelButtonText: 'Cancel',
                type: 'info',
                center: true
              }
            ).then(() => {
              this.executeSync('full')
            }).catch(() => {
              this.$message.info('Sync operation cancelled')
            })
          }
        } else {
          // API返回失败，检查具体错误
          this.handleSyncStatusError(statusResponse.data)
        }
      } catch (error) {
        // 只在非404错误时打印到控制台，因为404是项目首次同步的正常情况
        if (error.response?.status !== 404) {
          console.error('Sync status check error:', error)
        }
        this.handleSyncStatusError(error)
      } finally {
        this.syncChoiceLoading = false
      }
    },

    // 处理同步状态检查错误
    handleSyncStatusError(error) {
      const errorMessage = error.response?.data?.error || error.error || error.message || '未知错误'
      
      // 更安全的项目信息获取
      const projectName = this.selectedProject?.name || 
                         this.selectedProject?.attributes?.name || 
                         'Unknown Project'
      
      const projectId = this.selectedProject?.originalId || 'unknown'
      
      // 检查是否是"项目不存在"的错误
      if (errorMessage.includes('项目不存在') || errorMessage.includes('Project does not exist') || 
          (error.response && error.response.status === 404)) {
        
        this.$confirm(
          `Project "${projectName}" not found in database.\n\nThis is the first sync for this project. Full sync is required to establish complete project data structure.\n\nFull sync will:\n• Fetch complete folder structure\n• Sync all file information\n• Establish version history\n• Set up custom attributes\n\nStart full sync immediately?`,
          'Project Not in Database',
          {
            confirmButtonText: 'Start Full Sync',
            cancelButtonText: 'Cancel',
            type: 'warning',
            center: true,
            customClass: 'first-sync-dialog'
          }
        ).then(() => {
          this.executeSync('full')
        }).catch(() => {
          this.$message.info('Sync operation cancelled')
        })
      } else {
        // 其他错误
        this.$message.error(`Sync status check failed: ${errorMessage}`)
        console.error('Sync status check failed:', error)
        console.error('Project info:', { name: projectName, id: projectId })
      }
    },

    // 执行同步
    async executeSync(syncType) {
      if (!this.selectedProject) {
        this.$message.error('No project selected')
        return
      }

      // 更安全的项目信息获取
      const projectName = this.selectedProject.name || 
                         this.selectedProject.attributes?.name || 
                         'Unknown Project'
      
      // 使用标准化的 ID（不带 b. 前缀）用于路由
      const rawProjectId = this.selectedProject.id
      // 使用 originalId（带 b. 前缀）用于 API 调用
      const projectId = this.selectedProject.originalId
      const syncTypeText = syncType === 'full' ? 'Full Sync' : 'Incremental Sync'
      
      // 关闭选择对话框
      this.showSyncChoiceDialog = false
      
      try {
        // 显示跳转提示
        this.$message.info(`🚀 正在跳转到${syncTypeText}进度页面...`)
        
        const targetPath = `/sync-progress/${encodeURIComponent(rawProjectId)}/${encodeURIComponent(projectName)}/${syncType}`
        console.log('Navigating to:', targetPath)
        console.log('Project info:', { projectId, projectName, syncType })
        
        // 跳转到同步进度页面
        await this.$router.push({
          path: targetPath
        })
        
        console.log('Navigation successful')
        
      } catch (error) {
        console.error('Navigation error:', error)
        this.$message.error(`跳转失败: ${error.message}`)
        
        // 如果跳转失败，回退到原来的同步方式
        this.fallbackToDirectSync(syncType)
      }
    },

    // 回退到直接同步（如果路由跳转失败）
    async fallbackToDirectSync(syncType) {
      // 使用 originalId（带 b. 前缀）进行 API 调用
      const projectId = this.selectedProject.originalId
      
      // 優先使用優化同步API，如果失敗則回退到原版API
      const optimizedEndpoint = `/api/optimized-sync/project/${projectId}/sync`
      const fallbackEndpoint = syncType === 'full' 
        ? `/api/file-sync-db/project/${projectId}/full-sync`
        : `/api/file-sync-db/project/${projectId}/incremental-sync`
      
      const syncTypeText = syncType === 'full' ? 'Full Sync' : 'Incremental Sync'
      const projectName = this.selectedProject?.name || 
                         this.selectedProject?.attributes?.name || 
                         'Unknown Project'
      
      // 显示进度提示
      let progressMessage = null
      
      try {
        // 显示开始同步的消息
        progressMessage = this.$message({
          message: `🔄 Executing ${syncTypeText}, Project: ${projectName}...`,
          type: 'info',
          duration: 0, // 不自动关闭
          showClose: false
        })
        
        // 先嘗試優化同步API
        let response
        let usedOptimized = false
        
        try {
          response = await axios.post(optimizedEndpoint, {
            syncType: syncType === 'full' ? 'full_sync' : 'incremental_sync',
            maxDepth: 10,
            includeCustomAttributes: true,
            performanceMode: 'standard'
          })
          usedOptimized = true
          console.log('✅ 使用優化同步API成功')
        } catch (optimizedError) {
          console.warn('⚠️ 優化同步API失敗，回退到原版API:', optimizedError.message)
          
          // 回退到原版API
          response = await axios.post(fallbackEndpoint, {
          maxDepth: 10,
          includeCustomAttributes: true
        })
          usedOptimized = false
        }
        
        // 关闭进度消息
        if (progressMessage) {
          progressMessage.close()
        }
        
        if (response.data.success) {
          const duration = response.data.data.duration_seconds
          const results = response.data.data.results
          
          const syncResult = {
            success: true,
            syncType,
            project: this.selectedProject,
            duration,
            results,
            response: response.data
          }
          
          // 发送结果给父组件
          this.$emit('sync-result', syncResult)
          
          // 显示详细的成功信息
          const resultSummary = this.formatSyncResults(results, syncType)
          const apiType = usedOptimized ? '🚀 優化同步' : '🔄 標準同步'
          this.$notify({
            title: `✅ ${syncTypeText} Completed (${apiType})`,
            message: `Project: ${projectName}\nDuration: ${duration.toFixed(2)} seconds\n\n${resultSummary}`,
            type: 'success',
            duration: 8000,
            position: 'top-right'
          })
        } else {
          const syncResult = {
            success: false,
            syncType,
            project: this.selectedProject,
            error: response.data.error,
            response: response.data
          }
          
          this.$emit('sync-result', syncResult)
          this.$message.error(`❌ ${syncTypeText} Failed: ${response.data.error}`)
        }
      } catch (error) {
        // 关闭进度消息
        if (progressMessage) {
          progressMessage.close()
        }
        
        const syncResult = {
          success: false,
          syncType,
          project: this.selectedProject,
          error: error.response?.data?.error || error.message,
          response: error.response?.data
        }
        
        this.$emit('sync-result', syncResult)
        this.$message.error(`❌ ${syncTypeText} Failed: ${error.response?.data?.error || error.message}`)
      }
    },

    // 格式化同步结果
    formatSyncResults(results, syncType) {
      if (!results) return 'Sync completed'
      
      const parts = []
      
      if (results.folders_processed) {
        parts.push(`📁 Folders: ${results.folders_processed}`)
      }
      if (results.files_processed) {
        parts.push(`📄 Files: ${results.files_processed}`)
      }
      if (results.versions_processed) {
        parts.push(`🔄 Versions: ${results.versions_processed}`)
      }
      
      if (syncType === 'incremental' && results.changes) {
        const changes = results.changes
        const changeParts = []
        if (changes.added) changeParts.push(`Added: ${changes.added}`)
        if (changes.modified) changeParts.push(`Modified: ${changes.modified}`)
        if (changes.deleted) changeParts.push(`Deleted: ${changes.deleted}`)
        if (changeParts.length > 0) {
          parts.push(`📊 Changes: ${changeParts.join(', ')}`)
        }
      }
      
      return parts.length > 0 ? parts.join('\n') : 'Sync completed'
    },

    // 处理同步选择
    handleSyncChoice(syncType) {
      this.executeSync(syncType)
    },

    // 取消同步选择
    handleSyncChoiceCancel() {
      this.showSyncChoiceDialog = false
    }
  }
}
</script>

<style scoped>
/* 智能同步按钮样式 */
.smart-sync-button {
  width: 100%;
  min-height: 56px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  padding: 0 24px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.smart-sync-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.smart-sync-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.3);
}

.smart-sync-button:hover::before {
  left: 100%;
}

/* 同步选择对话框样式 */
.sync-choice-content {
  padding: 20px 0;
}

.sync-choice-header {
  text-align: center;
  margin-bottom: 30px;
}

.sync-choice-header .sync-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.sync-choice-header h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.sync-choice-header p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.sync-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sync-option {
  display: flex;
  align-items: flex-start;
  padding: 24px;
  border: 2px solid #e4e7ed;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  position: relative;
}

.sync-option:hover {
  border-color: #409eff;
  background: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.15);
}

.sync-option.full-sync:hover {
  border-color: #f56c6c;
  background: #fef0f0;
  box-shadow: 0 6px 20px rgba(245, 108, 108, 0.15);
}

.sync-option.incremental-sync:hover {
  border-color: #67c23a;
  background: #f0f9ff;
  box-shadow: 0 6px 20px rgba(103, 194, 58, 0.15);
}

.sync-option-icon {
  margin-right: 20px;
  font-size: 28px;
  color: #409eff;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

.full-sync .sync-option-icon {
  color: #f56c6c;
}

.incremental-sync .sync-option-icon {
  color: #67c23a;
}

.sync-option-content {
  flex: 1;
}

.sync-option-content h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.sync-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.sync-features {
  margin: 0 0 16px 0;
  padding: 0;
  list-style: none;
}

.sync-features li {
  margin: 6px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

.sync-time {
  font-size: 12px;
  color: #909399;
  font-style: italic;
  padding: 8px 12px;
  background: rgba(144, 147, 153, 0.1);
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

.full-sync .sync-time {
  border-left-color: #f56c6c;
}

.incremental-sync .sync-time {
  border-left-color: #67c23a;
}

/* 自定义确认对话框样式 */
:deep(.first-sync-dialog) {
  .el-message-box {
    width: 520px;
  }
  
  .el-message-box__message {
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-line;
  }
  
  .el-message-box__title {
    font-size: 18px;
    font-weight: 600;
  }
  
  .el-button--primary {
    background-color: #f56c6c;
    border-color: #f56c6c;
  }
  
  .el-button--primary:hover {
    background-color: #f78989;
    border-color: #f78989;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .smart-sync-button {
    min-height: 48px !important;
    font-size: 14px !important;
  }
  
  .sync-choice-header .sync-icon {
    font-size: 36px;
  }
  
  .sync-option {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }
  
  .sync-option-icon {
    font-size: 24px;
    margin-right: 0;
    margin-bottom: 12px;
    min-width: auto;
  }
  
  .sync-features li {
    font-size: 12px;
  }
  
  :deep(.first-sync-dialog) .el-message-box {
    width: 90%;
    margin: 0 auto;
  }
}
</style>
