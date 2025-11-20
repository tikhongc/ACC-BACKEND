/**
 * 项目数据统一管理存储
 * 用于管理项目的文件数据、用户数据等，实现数据互通
 */

import { reactive, ref } from 'vue'
import axios from 'axios'

// 数据缓存键名
const PROJECT_DATA_CACHE_KEY = 'acc_project_data_cache'

/**
 * 项目数据存储类
 */
class ProjectDataStore {
  constructor() {
    // 响应式数据存储
    this.data = reactive({
      // 当前选中的项目
      currentProject: null,
      
      // 文件数据缓存
      fileData: {},
      
      // 用户数据缓存
      userData: {},
      
      // 权限数据缓存
      permissionData: {},
      
      // 统一的统计数据
      unifiedStats: {},
      
      // 加载状态
      loading: {
        fileData: false,
        userData: false,
        permissionData: false
      },
      
      // 缓存时间戳
      cacheTimestamps: {},
      
      // 数据版本号（用于检测数据变化）
      dataVersion: 0,
      
      // 下载URL缓存
      downloadUrlCache: {}
    })
    
    // 缓存过期时间（30分钟）
    this.cacheExpireTime = 30 * 60 * 1000
    
    // 请求追踪器，防止重复请求
    this.activeRequests = new Map()
    
    // 异步请求控制器，用于cancel正在进行的异步操作
    this.asyncControllers = new Map()
    
    // 加载缓存数据
    this.loadFromCache()
  }

  /**
   * cancel所有异步操作
   */
  cancelAllAsyncOperations() {
    console.log('🚫 cancel所有异步操作...')
    
    // cancel所有异步控制器
    for (const [key, controller] of this.asyncControllers.entries()) {
      console.log('🚫 cancel异步操作:', key)
      controller.abort()
    }
    this.asyncControllers.clear()
    
    // cancel所有活跃请求
    for (const [key, promise] of this.activeRequests.entries()) {
      console.log('🚫 标记请求为cancel:', key)
      // 注意：这里不能直接cancelPromise，但可以清理追踪
    }
    this.activeRequests.clear()
    
    console.log('✅ 所有异步操作已cancel')
  }

  /**
   * 设置当前项目
   */
  setCurrentProject(project) {
    if (!project) return
    
    console.log('🎯 设置当前项目:', project.name)
    this.data.currentProject = project
    
    // 如果项目切换了，清除旧的缓存数据
    if (this.data.fileData[project.id] || this.data.userData[project.id]) {
      console.log('🔄 项目切换，检查缓存数据')
    }
    
    this.saveToCache()
  }

  /**
   * 获取当前项目
   */
  getCurrentProject() {
    return this.data.currentProject
  }

  /**
   * 获取或加载文件数据
   */
  async getFileData(projectId, forceRefresh = false, maxDepth = 5) {
    if (!projectId) {
      console.error('❌ 项目ID为空')
      return null
    }

    // 如果强制刷新，先清除缓存
    if (forceRefresh) {
      console.log('🔄 强制刷新：清除文件数据缓存')
      delete this.data.fileData[projectId]
      delete this.data.cacheTimestamps[`fileData_${projectId}`]
    }

    // 检查缓存
    if (!forceRefresh && this.isDataValid('fileData', projectId)) {
      console.log('📁 使用缓存的文件数据')
      return this.data.fileData[projectId]
    }

    // 加载新数据
    return await this.loadFileData(projectId, maxDepth, forceRefresh)
  }

  /**
   * 获取或加载用户数据
   */
  async getUserData(projectId, forceRefresh = false) {
    if (!projectId) {
      console.error('❌ 项目ID为空')
      return null
    }

    // 检查缓存
    if (!forceRefresh && this.isDataValid('userData', projectId)) {
      console.log('👥 使用缓存的用户数据')
      return this.data.userData[projectId]
    }

    // 加载新数据
    return await this.loadUserData(projectId)
  }

  /**
   * 加载文件数据
   */
  async loadFileData(projectId, maxDepth = 6, forceRefresh = false) {
    // 创建请求标识符
    const requestKey = `fileData_${projectId}_${maxDepth}_${forceRefresh}`
    
    // 检查是否有相同的请求正在进行
    if (this.activeRequests.has(requestKey)) {
      console.log('⏳ 相同的文件数据请求正在进行中，等待结果...', { projectId, maxDepth, forceRefresh })
      return await this.activeRequests.get(requestKey)
    }
    
    // 检查是否正在加载相同的请求
    if (this.data.loading.fileData || this.data.loading[requestKey]) {
      console.log('⏳ 文件数据正在加载中，跳过重复请求...', { projectId, maxDepth, forceRefresh })
      return null
    }
    
    // 如果不是强制刷新，检查是否有任何相关的加载任务在进行
    if (!forceRefresh) {
      const anyLoading = Object.keys(this.data.loading).some(key => 
        key.startsWith(`fileData_${projectId}`) && this.data.loading[key]
      )
      if (anyLoading) {
        console.log('⏳ 检测到同项目的其他加载任务，跳过重复请求...')
        return null
      }
    }
    
    // 额外检查：如果已经有相同参数的数据且不是强制刷新，直接返回
    if (!forceRefresh && this.data.fileData[projectId]) {
      console.log('✨ 文件数据已存在且非强制刷新，返回缓存数据')
      return this.data.fileData[projectId]
    }

    // 对于大型项目，使用渐进式加载
    let requestPromise
    if (maxDepth > 5) {
      requestPromise = this._executeProgressiveFileDataRequest(projectId, maxDepth, forceRefresh, requestKey)
    } else {
      requestPromise = this._executeFileDataRequest(projectId, maxDepth, forceRefresh, requestKey)
    }
    
    // 创建请求Promise并添加到追踪器
    this.activeRequests.set(requestKey, requestPromise)
    
    try {
      const result = await requestPromise
      return result
    } finally {
      // 清理请求追踪
      this.activeRequests.delete(requestKey)
    }
  }

  /**
   * 渐进式文件数据加载（用于大型项目）
   */
  async _executeProgressiveFileDataRequest(projectId, maxDepth, forceRefresh, requestKey) {
    try {
      console.log('📁 开始渐进式加载文件数据:', { projectId, maxDepth, forceRefresh, requestKey })
      this.data.loading.fileData = true
      this.data.loading[requestKey] = true

      // 第一阶段：加载浅层结构（深度5）
      console.log('🔄 第一阶段：加载基础文件结构...')
      const params = {
        maxDepth: 5,
        includePermissions: false, // 第一阶段不包含权限以提高速度
        includeCustomAttributes: false
      }

      if (forceRefresh) {
        params._t = Date.now()
      }

      // 使用快速API端点进行第一阶段加载
      const response = await axios.get(`/api/file-sync/project/${projectId}/tree-fast`, {
        timeout: 30000 // 30秒超时，快速API应该更快
      })

      let fileData = response.data
      if (response.data.status === 'success' && response.data.data) {
        fileData = response.data.data
        console.log('✅ 第一阶段加载完成:', {
          project_id: fileData.project_id,
          top_folders: fileData.top_folders?.length || 0
        })
        
        // 缓存第一阶段数据
        this.data.fileData[projectId] = fileData
        this.data.cacheTimestamps[`fileData_${projectId}`] = Date.now()
        this.saveToCache()
        
        // 对于快速模式，直接返回，不进行第二阶段加载
        console.log('✅ 快速模式完成，跳过第二阶段加载')
        return fileData
      } else {
        throw new Error(response.data.error || '加载文件数据失败')
      }

    } catch (error) {
      console.error('❌ 渐进式加载文件数据失败:', error)
      
      // 如果渐进式加载失败，回退到标准加载
      console.log('🔄 回退到标准加载模式...')
      return this._executeFileDataRequest(projectId, Math.min(maxDepth, 3), forceRefresh, requestKey)
    } finally {
      this.data.loading.fileData = false
      this.data.loading[requestKey] = false
    }
  }

  /**
   * 异步加载完整文件结构
   */
  async _loadFullStructureAsync(projectId, maxDepth, forceRefresh, asyncKey) {
    // 创建cancel控制器
    const controller = new AbortController()
    this.asyncControllers.set(asyncKey, controller)
    
    try {
      console.log('🚀 开始异步加载完整文件结构...', { projectId, asyncKey })
      
      const params = {
        maxDepth: maxDepth,
        includePermissions: true,
        includeCustomAttributes: true
      }

      if (forceRefresh) {
        params._t = Date.now()
      }

      const response = await axios.get(`/api/file-sync/project/${projectId}/tree-with-permissions`, {
        params: params,
        timeout: 180000, // 3分钟超时
        signal: controller.signal // 添加cancel信号
      })

      // 检查请求是否被cancel
      if (controller.signal.aborted) {
        console.log('🚫 异步加载已被cancel:', asyncKey)
        return
      }

      if (response.data.status === 'success' && response.data.data) {
        const fullFileData = response.data.data
        console.log('✅ 完整结构加载完成:', {
          project_id: fullFileData.project_id,
          top_folders: fullFileData.top_folders?.length || 0,
          statistics: fullFileData.statistics,
          asyncKey
        })
        
        // 再次检查是否被cancel（防止在处理响应时被cancel）
        if (controller.signal.aborted) {
          console.log('🚫 异步加载在处理响应时被cancel:', asyncKey)
          return
        }
        
        // 更新缓存
        this.data.fileData[projectId] = fullFileData
        this.data.cacheTimestamps[`fileData_${projectId}`] = Date.now()
        this.updateUnifiedStats(projectId)
        this.saveToCache()
        
        // 触发更新事件
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('fileDataUpdated', { 
            detail: { projectId, fileData: fullFileData } 
          }))
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 异步加载被用户cancel:', asyncKey)
      } else {
        console.warn('⚠️ 异步加载完整结构失败:', error, { asyncKey })
      }
    } finally {
      // 清理控制器
      this.asyncControllers.delete(asyncKey)
    }
  }

  /**
   * 执行文件数据请求
   */
  async _executeFileDataRequest(projectId, maxDepth, forceRefresh, requestKey) {
    try {
      console.log('📁 开始加载文件数据:', { projectId, maxDepth, forceRefresh, requestKey })
      this.data.loading.fileData = true
      this.data.loading[requestKey] = true

      // 构建请求参数 - 默认使用快速模式
      const params = {
        maxDepth: maxDepth,
        includePermissions: false,  // 默认不包含权限，按需加载
        includeCustomAttributes: true  // 包含自定义属性，确保文件自定义属性能正确显示
      }

      // 如果是强制刷新，添加时间戳参数绕过缓存
      if (forceRefresh) {
        params._t = Date.now()
      }

      // 使用快速API端点，避免重复遍历
      const response = await axios.get(`/api/file-sync/project/${projectId}/tree-fast`, {
        params: params,
        timeout: 60000 // 1分钟超时，快速API应该更快
      })

      let fileData = response.data
      if (response.data.status === 'success' && response.data.data) {
        fileData = response.data.data
        console.log('📁 文件数据加载成功:', {
          project_id: fileData.project_id,
          top_folders: fileData.top_folders?.length || 0,
          statistics: fileData.statistics
        })
        
        // 首先清除所有加载标记（特别是在更改深度时）
        this.clearLoadedMarks(fileData.top_folders)
        
        // 然后重新标记已加载的节点
        this.markLoadedNodes(fileData.top_folders, 0, maxDepth)
      } else {
        console.warn('⚠️ 文件数据响应格式异常:', response.data)
      }

      // 缓存数据
      this.data.fileData[projectId] = fileData
      this.data.cacheTimestamps[`fileData_${projectId}`] = Date.now()
      
      // 更新统一统计数据
      this.updateUnifiedStats(projectId)
      
      // 保存到本地缓存
      this.saveToCache()
      
      console.log('✅ 文件数据加载成功')
      return fileData

    } catch (error) {
      console.error('❌ 加载文件数据失败:', error)
      throw error
    } finally {
      this.data.loading.fileData = false
      this.data.loading[requestKey] = false
    }
  }

  /**
   * 加载用户数据
   */
  async loadUserData(projectId) {
    if (this.data.loading.userData) {
      console.log('⏳ 用户数据正在加载中...')
      return null
    }

    try {
      console.log('👥 开始加载用户数据:', projectId)
      this.data.loading.userData = true

      const response = await axios.get(`/api/users/project/${projectId}/users`, {
        params: {
          limit: 200,
          offset: 0,
          sort: 'name'
        }
      })

      let userData = response.data
      if (response.data.status === 'success' && response.data.data) {
        userData = response.data.data
      }

      // 缓存数据
      this.data.userData[projectId] = userData
      this.data.cacheTimestamps[`userData_${projectId}`] = Date.now()
      
      // 更新统一统计数据
      this.updateUnifiedStats(projectId)
      
      // 保存到本地缓存
      this.saveToCache()
      
      console.log('✅ 用户数据加载成功')
      return userData

    } catch (error) {
      console.error('❌ 加载用户数据失败:', error)
      throw error
    } finally {
      this.data.loading.userData = false
    }
  }

  /**
   * 更新统一统计数据
   */
  updateUnifiedStats(projectId) {
    const fileData = this.data.fileData[projectId]
    const userData = this.data.userData[projectId]

    if (!fileData && !userData) return

    // 创建统一的统计数据
    const stats = {
      project_id: projectId,
      last_updated: new Date().toISOString(),
      
      // 文件统计
      files: {
        total_folders: fileData?.statistics?.total_folders || 0,
        total_files: fileData?.statistics?.total_files || 0,
        total_size: fileData?.statistics?.total_size || 0
      },
      
      // 用户统计（优先使用用户管理API的数据，因为更准确）
      users: {
        // 项目总用户数（来自用户管理API）
        total_project_users: userData?.statistics?.total_users || 0,
        active_users: userData?.statistics?.active_users || 0,
        pending_users: userData?.statistics?.pending_users || 0,
        
        // 有文件权限的用户数（来自文件权限API）
        users_with_file_permissions: fileData?.permission_summary?.total_users || 0,
        
        // 计算没有文件权限的用户数
        users_without_file_permissions: Math.max(0, 
          (userData?.statistics?.total_users || 0) - 
          (fileData?.permission_summary?.total_users || 0)
        )
      },
      
      // 权限统计
      permissions: {
        total_roles: Math.max(
          userData?.statistics?.roles || 0,
          fileData?.permission_summary?.total_roles || 0
        ),
        total_companies: Math.max(
          userData?.statistics?.companies || 0,
          fileData?.permission_summary?.total_companies || 0
        )
      },
      
      // 数据完整性标记
      data_completeness: {
        has_file_data: !!fileData,
        has_user_data: !!userData,
        is_complete: !!(fileData && userData)
      }
    }

    this.data.unifiedStats[projectId] = stats
    this.data.dataVersion++
    
    console.log('📊 统一统计数据已更新:', stats)
  }

  /**
   * 增量更新统计数据（用于懒加载）
   */
  incrementStats(projectId, deltaStats) {
    const fileData = this.data.fileData[projectId]
    if (!fileData || !fileData.statistics) return

    // 更新文件数据中的统计
    if (deltaStats.folders) {
      fileData.statistics.total_folders += deltaStats.folders
    }
    if (deltaStats.files) {
      fileData.statistics.total_files += deltaStats.files
    }
    if (deltaStats.totalSize) {
      fileData.statistics.total_size += deltaStats.totalSize
    }

    // 更新统一统计数据
    this.updateUnifiedStats(projectId)
    
    console.log('📊 增量统计数据更新完成:', deltaStats)
  }

  /**
   * 清除所有节点的加载标记（用于重新设置遍历深度时）
   */
  clearLoadedMarks(nodes) {
    if (!nodes || !Array.isArray(nodes)) return
    
    for (const node of nodes) {
      if (node.type === 'folder') {
        // 清除加载标记，让系统重新评估
        delete node._childrenLoaded
        
        // 递归清除子节点的标记
        if (node.children && Array.isArray(node.children)) {
          this.clearLoadedMarks(node.children)
        }
      }
    }
  }

  /**
   * 递归标记已加载的节点
   */
  markLoadedNodes(nodes, currentDepth = 0, maxDepth = 6) {
    if (!nodes || !Array.isArray(nodes)) return
    
    for (const node of nodes) {
      if (node.type === 'folder') {
        // 检查是否有子节点数组
        const hasChildrenArray = node.children && Array.isArray(node.children)
        
        if (currentDepth < maxDepth - 1) {
          // 在递归范围内（不是最后一层）
          if (hasChildrenArray && node.children.length > 0) {
            // 有子节点，标记为已加载，并递归处理子节点
            node._childrenLoaded = true
            this.markLoadedNodes(node.children, currentDepth + 1, maxDepth)
          } else {
            // 没有子节点或子节点为空，标记为未加载（可能需要懒加载）
            node._childrenLoaded = false
          }
        } else if (currentDepth === maxDepth - 1) {
          // 在最后一层递归深度
          if (hasChildrenArray) {
            // 有子节点数组，标记为已加载
            node._childrenLoaded = true
            // 但是子节点可能还有更深层的内容，标记为可展开
            if (node.children.length > 0) {
              this.markLoadedNodes(node.children, currentDepth + 1, maxDepth)
            }
          } else {
            // 没有子节点数组，可能有更深层内容，标记为未加载
            node._childrenLoaded = false
          }
        } else {
          // 超过递归深度限制，这些文件夹的子节点不会被预加载
          // 但是它们仍然可能有子内容，应该允许懒加载
          node._childrenLoaded = false
        }
      }
    }
  }

  /**
   * 获取统一统计数据
   */
  getUnifiedStats(projectId) {
    return this.data.unifiedStats[projectId] || null
  }

  /**
   * 检查数据是否有效（未过期）
   */
  isDataValid(dataType, projectId) {
    const cacheKey = `${dataType}_${projectId}`
    const timestamp = this.data.cacheTimestamps[cacheKey]
    
    if (!timestamp) return false
    
    const now = Date.now()
    const isValid = (now - timestamp) < this.cacheExpireTime
    
    if (!isValid) {
      console.log(`⏰ ${dataType} 缓存已过期`)
    }
    
    return isValid && !!this.data[dataType][projectId]
  }

  /**
   * 强制刷新项目数据
   */
  async refreshProjectData(projectId, maxDepth = 6) {
    console.log('🔄 强制刷新项目数据:', projectId)
    
    // 清除缓存
    this.clearProjectCache(projectId)
    
    // 并行加载数据（使用强制刷新标志）
    const promises = [
      this.loadFileData(projectId, maxDepth, true), // 强制刷新文件数据
      this.loadUserData(projectId) // 用户数据不需要强制刷新
    ]
    
    try {
      const results = await Promise.allSettled(promises)
      
      // 检查结果
      const fileDataResult = results[0]
      const userDataResult = results[1]
      
      if (fileDataResult.status === 'rejected') {
        console.error('❌ 文件数据刷新失败:', fileDataResult.reason)
      }
      
      if (userDataResult.status === 'rejected') {
        console.error('❌ 用户数据刷新失败:', userDataResult.reason)
      }
      
      console.log('✅ 项目数据刷新完成')
      return this.getUnifiedStats(projectId)
    } catch (error) {
      console.error('❌ 项目数据刷新失败:', error)
      throw error
    }
  }

  /**
   * 清除项目缓存
   */
  clearProjectCache(projectId) {
    console.log('🗑️ 清除项目缓存:', projectId)
    
    delete this.data.fileData[projectId]
    delete this.data.userData[projectId]
    delete this.data.unifiedStats[projectId]
    delete this.data.downloadUrlCache[projectId]
    delete this.data.cacheTimestamps[`fileData_${projectId}`]
    delete this.data.cacheTimestamps[`userData_${projectId}`]
    
    // 清理相关的活跃请求
    for (const [key, promise] of this.activeRequests.entries()) {
      if (key.includes(projectId)) {
        this.activeRequests.delete(key)
        console.log('🗑️ 清除活跃请求:', key)
      }
    }
    
    this.data.dataVersion++
    this.saveToCache()
  }

  /**
   * 获取加载状态
   */
  getLoadingState() {
    return { ...this.data.loading }
  }

  /**
   * 保存到本地缓存
   */
  saveToCache() {
    try {
      const cacheData = {
        currentProject: this.data.currentProject,
        fileData: this.data.fileData,
        userData: this.data.userData,
        unifiedStats: this.data.unifiedStats,
        downloadUrlCache: this.data.downloadUrlCache,
        cacheTimestamps: this.data.cacheTimestamps,
        dataVersion: this.data.dataVersion,
        saved_at: Date.now()
      }
      
      localStorage.setItem(PROJECT_DATA_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error('❌ 保存缓存失败:', error)
    }
  }

  /**
   * 从本地缓存加载
   */
  loadFromCache() {
    try {
      const cachedData = localStorage.getItem(PROJECT_DATA_CACHE_KEY)
      if (!cachedData) return

      const parsed = JSON.parse(cachedData)
      
      // 检查缓存是否过期（24小时）
      const now = Date.now()
      if (parsed.saved_at && (now - parsed.saved_at) > 24 * 60 * 60 * 1000) {
        console.log('⏰ 本地缓存已过期，清除缓存')
        localStorage.removeItem(PROJECT_DATA_CACHE_KEY)
        return
      }

      // 恢复数据
      if (parsed.currentProject) this.data.currentProject = parsed.currentProject
      if (parsed.fileData) this.data.fileData = parsed.fileData
      if (parsed.userData) this.data.userData = parsed.userData
      if (parsed.unifiedStats) this.data.unifiedStats = parsed.unifiedStats
      if (parsed.downloadUrlCache) this.data.downloadUrlCache = parsed.downloadUrlCache
      if (parsed.cacheTimestamps) this.data.cacheTimestamps = parsed.cacheTimestamps
      if (parsed.dataVersion) this.data.dataVersion = parsed.dataVersion

      console.log('📦 从本地缓存恢复数据')
    } catch (error) {
      console.error('❌ 加载缓存失败:', error)
    }
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    console.log('🗑️ 清除所有缓存')
    
    this.data.currentProject = null
    this.data.fileData = {}
    this.data.userData = {}
    this.data.unifiedStats = {}
    this.data.downloadUrlCache = {}
    this.data.cacheTimestamps = {}
    this.data.dataVersion = 0
    
    localStorage.removeItem(PROJECT_DATA_CACHE_KEY)
  }

  /**
   * 获取缓存状态信息
   */
  getCacheStatus() {
    const currentProject = this.data.currentProject
    if (!currentProject) return null

    const projectId = currentProject.id
    const fileDataValid = this.isDataValid('fileData', projectId)
    const userDataValid = this.isDataValid('userData', projectId)

    return {
      project: currentProject,
      cache_status: {
        file_data: {
          exists: !!this.data.fileData[projectId],
          valid: fileDataValid,
          timestamp: this.data.cacheTimestamps[`fileData_${projectId}`]
        },
        user_data: {
          exists: !!this.data.userData[projectId],
          valid: userDataValid,
          timestamp: this.data.cacheTimestamps[`userData_${projectId}`]
        },
        unified_stats: {
          exists: !!this.data.unifiedStats[projectId],
          complete: this.data.unifiedStats[projectId]?.data_completeness?.is_complete || false
        }
      },
      data_version: this.data.dataVersion
    }
  }

  /**
   * 预缓存所有文件的下载URL
   */
  async preloadDownloadUrls(projectId, fileData) {
    if (!projectId || !fileData) return
    
    console.log('🔗 开始预缓存下载URL...')
    
    // 收集所有文件节点
    const allFiles = this.collectAllFiles(fileData.top_folders || [])
    
    if (allFiles.length === 0) {
      console.log('📁 没有找到可下载的文件')
      return
    }
    
    console.log(`📁 找到 ${allFiles.length} 个文件，开始批量获取下载URL...`)
    
    // 初始化项目的下载URL缓存
    if (!this.data.downloadUrlCache[projectId]) {
      this.data.downloadUrlCache[projectId] = {}
    }
    
    // 批量获取下载URL（分批处理，避免过多并发请求）
    const batchSize = 10 // 每批处理10个文件
    const batches = []
    
    for (let i = 0; i < allFiles.length; i += batchSize) {
      batches.push(allFiles.slice(i, i + batchSize))
    }
    
    let successCount = 0
    let errorCount = 0
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log(`🔄 处理第 ${batchIndex + 1}/${batches.length} 批文件 (${batch.length} 个文件)`)
      
      // 并行处理当前批次的文件
      const batchPromises = batch.map(async (file) => {
        try {
          const response = await axios.get(`/api/file-sync/download/${projectId}/${file.id}`, {
            timeout: 30000 // 30秒超时
          })
          
          if (response.data.status === 'success') {
            this.data.downloadUrlCache[projectId][file.id] = {
              downloadInfo: response.data.download_info,
              versionInfo: response.data.version_info,
              message: response.data.message,
              cachedAt: Date.now(),
              fileName: file.name
            }
            successCount++
            return { success: true, fileId: file.id, fileName: file.name }
          } else {
            throw new Error(response.data.error || '获取下载信息失败')
          }
        } catch (error) {
          errorCount++
          console.warn(`⚠️ 获取文件 "${file.name}" 下载URL失败:`, error.message)
          return { success: false, fileId: file.id, fileName: file.name, error: error.message }
        }
      })
      
      // 等待当前批次完成
      await Promise.all(batchPromises)
      
      // 批次间稍作延迟，避免服务器压力过大
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 500ms延迟
      }
    }
    
    console.log(`✅ 下载URL预缓存完成: 成功 ${successCount} 个，失败 ${errorCount} 个`)
    
    // 保存到localStorage
    this.saveToCache()
    
    return {
      total: allFiles.length,
      success: successCount,
      error: errorCount
    }
  }

  /**
   * 递归收集所有文件节点
   */
  collectAllFiles(nodes) {
    const files = []
    
    const traverse = (nodeList) => {
      if (!nodeList || !Array.isArray(nodeList)) return
      
      for (const node of nodeList) {
        if (node.type === 'file') {
          // 检查文件是否可下载
          const fileName = node.attributes?.extension?.data?.sourceFileName || node.name || ''
          const extension = this.getFileExtension(fileName).toLowerCase()
          
          // 支持下载的文件类型
          const downloadableExtensions = new Set([
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'dwg', 'dxf', 'rvt', 'rfa', 'ifc',
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff',
            'zip', 'rar', '7z', 'txt', 'csv', 'md',
            'mp4', 'avi', 'mov', 'wmv', 'flv',
            'mp3', 'wav', 'aac', 'flac',
            '3dm', 'step', 'stp', 'iges', 'igs', 'obj', 'fbx', 'max', 'skp'
          ])
          
          if (downloadableExtensions.has(extension)) {
            files.push({
              id: node.id,
              name: node.name,
              extension: extension
            })
          }
        } else if (node.type === 'folder' && node.children) {
          traverse(node.children)
        }
      }
    }
    
    traverse(nodes)
    return files
  }

  /**
   * 获取文件扩展名
   */
  getFileExtension(fileName) {
    if (!fileName) return 'unknown'
    const ext = fileName.split('.').pop()
    return ext ? ext.toUpperCase() : 'unknown'
  }

  /**
   * 获取缓存的下载URL
   */
  getCachedDownloadUrl(projectId, fileId) {
    if (!projectId || !fileId) return null
    
    const cache = this.data.downloadUrlCache[projectId]
    if (!cache || !cache[fileId]) return null
    
    const cachedData = cache[fileId]
    
    // 检查缓存是否过期（1小时）
    const cacheAge = Date.now() - cachedData.cachedAt
    const maxAge = 60 * 60 * 1000 // 1小时
    
    if (cacheAge > maxAge) {
      console.log(`⏰ 下载URL缓存已过期: ${cachedData.fileName}`)
      delete cache[fileId]
      return null
    }
    
    return cachedData
  }

  /**
   * 清除下载URL缓存
   */
  clearDownloadUrlCache(projectId) {
    if (projectId) {
      delete this.data.downloadUrlCache[projectId]
    } else {
      this.data.downloadUrlCache = {}
    }
    console.log('🗑️ 已清除下载URL缓存:', projectId || '全部')
  }
}

// 创建单例实例
const projectDataStore = new ProjectDataStore()

// 导出实例
export default projectDataStore

// 便捷方法导出
export const {
  setCurrentProject,
  getCurrentProject,
  getFileData,
  getUserData,
  getUnifiedStats,
  refreshProjectData,
  clearProjectCache,
  clearAllCache,
  getCacheStatus,
  getLoadingState,
  preloadDownloadUrls,
  getCachedDownloadUrl,
  clearDownloadUrlCache
} = projectDataStore
