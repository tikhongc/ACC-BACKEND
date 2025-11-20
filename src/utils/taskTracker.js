/**
 * 獨立的任務追蹤工具
 * 完全獨立於現有組件，提供智能輪詢管理
 */

import axios from 'axios'

class TaskTracker {
  constructor() {
    this.activeTasks = new Map()
    this.pollingIntervals = new Map()
    this.defaultPollingInterval = 3000 // 3秒
    this.maxPollingDuration = 30 * 60 * 1000 // 30分鐘最大輪詢時間
    this.failureThreshold = 5 // 連續失敗5次後停止
  }

  /**
   * 開始追蹤任務
   */
  startTracking(taskId, projectId, options = {}) {
    const {
      onProgress = () => {},
      onComplete = () => {},
      onError = () => {},
      pollingInterval = this.defaultPollingInterval
    } = options

    // 如果已經在追蹤，先停止
    if (this.activeTasks.has(taskId)) {
      this.stopTracking(taskId)
    }

    const taskInfo = {
      taskId,
      projectId,
      startTime: Date.now(),
      failureCount: 0,
      onProgress,
      onComplete,
      onError,
      pollingInterval
    }

    this.activeTasks.set(taskId, taskInfo)

    console.log(`🚀 TaskTracker: Started tracking task ${taskId}`)

    // 立即執行一次檢查
    this._checkTaskStatus(taskId)

    // 設置定期輪詢
    const intervalId = setInterval(() => {
      this._checkTaskStatus(taskId)
    }, pollingInterval)

    this.pollingIntervals.set(taskId, intervalId)

    // 設置最大輪詢時間限制
    setTimeout(() => {
      if (this.activeTasks.has(taskId)) {
        console.warn(`⏰ TaskTracker: Task ${taskId} reached max polling duration, stopping`)
        this.stopTracking(taskId, 'timeout')
      }
    }, this.maxPollingDuration)

    return taskId
  }

  /**
   * 停止追蹤任務
   */
  stopTracking(taskId, reason = 'manual') {
    if (!this.activeTasks.has(taskId)) {
      return false
    }

    // 清理輪詢
    if (this.pollingIntervals.has(taskId)) {
      clearInterval(this.pollingIntervals.get(taskId))
      this.pollingIntervals.delete(taskId)
    }

    // 移除任務
    this.activeTasks.delete(taskId)

    console.log(`🛑 TaskTracker: Stopped tracking task ${taskId} (reason: ${reason})`)
    return true
  }

  /**
   * 檢查任務狀態
   */
  async _checkTaskStatus(taskId) {
    const taskInfo = this.activeTasks.get(taskId)
    if (!taskInfo) {
      return
    }

    try {
      // 使用新的智能API端點
      const response = await axios.get(
        `/api/task-tracking/project/${taskInfo.projectId}/sync-progress/${taskId}`
      )

      if (response.data.success) {
        const taskData = response.data.data
        
        // 重置失敗計數
        taskInfo.failureCount = 0

        // 調用進度回調
        taskInfo.onProgress(taskData)

        // 檢查是否完成
        if (taskData.task_status === 'completed') {
          console.log(`🎉 TaskTracker: Task ${taskId} completed`)
          taskInfo.onComplete(taskData)
          this.stopTracking(taskId, 'completed')
        } else if (taskData.task_status === 'failed') {
          console.log(`❌ TaskTracker: Task ${taskId} failed`)
          taskInfo.onError(taskData.error || 'Task failed')
          this.stopTracking(taskId, 'failed')
        }
      } else {
        this._handleFailure(taskId, `API error: ${response.data.error}`)
      }
    } catch (error) {
      this._handleFailure(taskId, `Network error: ${error.message}`)
    }
  }

  /**
   * 處理失敗
   */
  _handleFailure(taskId, errorMessage) {
    const taskInfo = this.activeTasks.get(taskId)
    if (!taskInfo) {
      return
    }

    taskInfo.failureCount++
    console.warn(`⚠️ TaskTracker: Task ${taskId} check failed (${taskInfo.failureCount}/${this.failureThreshold}): ${errorMessage}`)

    if (taskInfo.failureCount >= this.failureThreshold) {
      console.error(`💥 TaskTracker: Task ${taskId} exceeded failure threshold, stopping`)
      taskInfo.onError(`Too many failures: ${errorMessage}`)
      this.stopTracking(taskId, 'failure_threshold')
    }
  }

  /**
   * 獲取活動任務統計
   */
  getStats() {
    return {
      activeTasks: this.activeTasks.size,
      taskIds: Array.from(this.activeTasks.keys()),
      pollingIntervals: this.pollingIntervals.size
    }
  }

  /**
   * 停止所有追蹤
   */
  stopAll() {
    const taskIds = Array.from(this.activeTasks.keys())
    taskIds.forEach(taskId => this.stopTracking(taskId, 'stop_all'))
    console.log(`🧹 TaskTracker: Stopped all ${taskIds.length} tasks`)
  }
}

// 全局實例
export const taskTracker = new TaskTracker()

// 頁面卸載時自動清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    taskTracker.stopAll()
  })
}

export default TaskTracker
