/**
 * 用户缓存管理
 * 用于缓存用户ID和用户名称的映射关系，避免重复API调用
 */

import { reactive } from 'vue'
import axios from 'axios'

// 用户缓存键名
const USER_CACHE_KEY = 'acc_user_cache'

/**
 * 用户缓存管理类
 */
class UserCacheManager {
  constructor() {
    // 响应式数据存储
    this.data = reactive({
      // 项目ID到用户映射的缓存 { projectId: { userId: userInfo } }
      projectUsersMap: {},
      
      // 全局用户ID到用户信息的映射（跨项目）
      globalUsersMap: {},
      
      // 缓存时间戳
      cacheTimestamps: {},
      
      // 加载状态
      loading: {}
    })
    
    // 缓存过期时间（30分钟）
    this.cacheExpireTime = 30 * 60 * 1000
    
    // 加载本地缓存
    this.loadFromCache()
  }

  /**
   * 获取或加载项目用户数据
   * @param {string} projectId - 项目ID
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object>} 用户映射对象
   */
  async getProjectUsers(projectId, forceRefresh = false) {
    if (!projectId) {
      console.error('❌ 项目ID为空')
      return {}
    }

    // 检查缓存
    if (!forceRefresh && this.isDataValid(projectId)) {
      console.log('👥 使用缓存的用户数据')
      return this.data.projectUsersMap[projectId] || {}
    }

    // 加载新数据
    return await this.loadProjectUsers(projectId)
  }

  /**
   * 加载项目用户数据
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 用户映射对象
   */
  async loadProjectUsers(projectId) {
    if (this.data.loading[projectId]) {
      console.log('⏳ 项目用户数据正在加载中...')
      return this.data.projectUsersMap[projectId] || {}
    }

    try {
      console.log('👥 开始加载项目用户数据:', projectId)
      this.data.loading[projectId] = true

      const response = await axios.get(`/api/users/project/${projectId}/users`, {
        params: {
          limit: 500, // 获取更多用户
          offset: 0,
          sort: 'name',
          fields: 'name,email,firstName,lastName,autodeskId,imageUrl,phone,jobTitle,companyName,status'
        },
        timeout: 30000
      })

      let userData = response.data
      if (response.data.status === 'success' && response.data.data) {
        userData = response.data.data
      }

      // 构建用户映射
      const usersMap = {}
      const users = userData.users || []
      
      console.log('👥 处理用户数据:', users.length, '个用户')
      console.log('📋 原始用户数据:', users)
      
      // 检查用户数据结构
      if (users.length > 0) {
        console.log('📝 第一个用户的完整数据结构:', users[0])
      }
      
      users.forEach((user, index) => {
        if (user.id) {
          const userInfo = {
            id: user.id,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            autodeskId: user.autodeskId,
            imageUrl: user.imageUrl,
            phone: user.phone,
            jobTitle: user.jobTitle,
            companyName: user.companyName,
            status: user.status,
            displayName: this.getDisplayName(user)
          }
          
          // 🔑 关键修复：确保数字ID和字符串ID都能被正确映射
          const userId = user.id
          const userIdStr = String(userId)
          const userIdNum = Number(userId)
          
          // 添加到项目用户映射 - 使用原始ID
          usersMap[userId] = userInfo
          this.data.globalUsersMap[userId] = userInfo
          
          // 🔑 重要：如果ID是数字，同时添加字符串和数字形式的映射
          if (!isNaN(userIdNum) && userIdNum.toString() === userIdStr) {
            // 数字形式映射
            usersMap[userIdNum] = userInfo
            this.data.globalUsersMap[userIdNum] = userInfo
            
            // 字符串形式映射（如果不同的话）
            if (userIdStr !== userId) {
              usersMap[userIdStr] = userInfo
              this.data.globalUsersMap[userIdStr] = userInfo
            }
            
            console.log(`🔢 UserCache添加数字ID映射: ${userIdNum} (${typeof userIdNum}) → ${userInfo.displayName}`)
          }
          
          console.log('📝 UserCache处理用户:', {
            id: user.id,
            类型: typeof user.id,
            autodeskId: user.autodeskId,
            name: userInfo.name,
            displayName: userInfo.displayName
          })
          
          // 如果有autodeskId，也用autodeskId作为键添加映射
          if (user.autodeskId) {
            const autodeskId = user.autodeskId
            const autodeskIdStr = String(autodeskId)
            const autodeskIdNum = Number(autodeskId)
            
            usersMap[autodeskId] = userInfo
            this.data.globalUsersMap[autodeskId] = userInfo
            
            // 同样处理autodeskId的数字/字符串映射
            if (!isNaN(autodeskIdNum) && autodeskIdNum.toString() === autodeskIdStr) {
              usersMap[autodeskIdNum] = userInfo
              this.data.globalUsersMap[autodeskIdNum] = userInfo
              
              if (autodeskIdStr !== autodeskId) {
                usersMap[autodeskIdStr] = userInfo
                this.data.globalUsersMap[autodeskIdStr] = userInfo
              }
            }
            
            console.log('📝 UserCache添加Autodesk ID映射:', autodeskId, '→', userInfo.displayName)
          }
          
          // 显示前几个用户的映射详情
          if (index < 5) {
            console.log(`📝 UserCache用户映射详情 #${index + 1}:`, {
              原始ID: userId,
              类型: typeof userId,
              显示名: userInfo.displayName
            })
          }
        }
      })

      // 缓存数据
      this.data.projectUsersMap[projectId] = usersMap
      this.data.cacheTimestamps[projectId] = Date.now()
      
      // 保存到本地缓存
      this.saveToCache()
      
      console.log(`✅ 项目用户数据加载成功: ${Object.keys(usersMap).length} 个映射`)
      console.log('📋 所有缓存的用户ID:', Object.keys(usersMap))
      console.log('📋 全局缓存的用户ID:', Object.keys(this.data.globalUsersMap))
      
      return usersMap

    } catch (error) {
      console.error('❌ 加载项目用户数据失败:', error)
      // 返回空对象而不是抛出错误，避免影响页面渲染
      return {}
    } finally {
      this.data.loading[projectId] = false
    }
  }

  /**
   * 获取用户显示名称
   * @param {Object} user - 用户对象
   * @returns {string} 显示名称
   */
  getDisplayName(user) {
    if (!user) return '未知用户'
    
    // 优先级：name > firstName + lastName > email > id
    if (user.name && user.name.trim()) {
      return user.name.trim()
    }
    
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    if (fullName) {
      return fullName
    }
    
    if (user.email) {
      return user.email
    }
    
    return user.id || '未知用户'
  }

  /**
   * 根据用户ID获取用户信息
   * @param {string} userId - 用户ID
   * @param {string} projectId - 项目ID（可选，优先从项目缓存查找）
   * @returns {Object|null} 用户信息
   */
  getUserById(userId, projectId = null) {
    if (!userId) return null

    // 🔑 关键修复：尝试多种ID格式查找
    const searchIds = []
    
    // 添加原始ID
    if (userId !== null && userId !== undefined && userId !== '') {
      searchIds.push(userId)
    }
    
    // 添加字符串形式（如果不同）
    const userIdStr = String(userId)
    if (userIdStr !== userId && userIdStr !== '' && !searchIds.includes(userIdStr)) {
      searchIds.push(userIdStr)
    }
    
    // 添加数字形式（仅当是有效数字时）
    const userIdNum = Number(userId)
    if (!isNaN(userIdNum) && userIdNum.toString() === userIdStr && !searchIds.includes(userIdNum)) {
      searchIds.push(userIdNum)
    }

    console.log(`🔍 UserCache查找用户:`, {
      原始ID: userId,
      搜索ID列表: searchIds,
      项目ID: projectId
    })

    // 优先从项目缓存查找
    if (projectId && this.data.projectUsersMap[projectId]) {
      const projectUsers = this.data.projectUsersMap[projectId]
      
      for (const searchId of searchIds) {
        const user = projectUsers[searchId]
        if (user) {
          console.log('✅ UserCache在项目缓存中找到用户:', searchId, '→', user.displayName)
          return user
        }
      }
    }

    // 从全局缓存查找
    for (const searchId of searchIds) {
      const globalUser = this.data.globalUsersMap[searchId]
      if (globalUser) {
        console.log('✅ UserCache在全局缓存中找到用户:', searchId, '→', globalUser.displayName)
        return globalUser
      }
    }

    // 🔍 详细调试信息
    const projectCacheKeys = projectId && this.data.projectUsersMap[projectId] ? 
      Object.keys(this.data.projectUsersMap[projectId]) : []
    const globalCacheKeys = Object.keys(this.data.globalUsersMap)
    
    console.log(`❌ UserCache未找到用户:`, {
      原始ID: userId,
      搜索的ID: searchIds,
      项目缓存存在: !!(projectId && this.data.projectUsersMap[projectId]),
      项目缓存大小: projectCacheKeys.length,
      项目缓存示例ID: projectCacheKeys.slice(0, 10),
      全局缓存大小: globalCacheKeys.length,
      全局缓存示例ID: globalCacheKeys.slice(0, 10),
      是否包含目标ID: {
        项目缓存: searchIds.some(id => projectCacheKeys.includes(String(id))),
        全局缓存: searchIds.some(id => globalCacheKeys.includes(String(id)))
      }
    })

    return null
  }

  /**
   * 根据用户ID获取显示名称
   * @param {string} userId - 用户ID
   * @param {string} projectId - 项目ID（可选）
   * @returns {string} 用户显示名称
   */
  getUserDisplayName(userId, projectId = null) {
    if (!userId) return '未知用户'

    console.log(`🔍 UserCache获取用户显示名称:`, { userId, projectId, userIdType: typeof userId })

    const user = this.getUserById(userId, projectId)
    
    if (user) {
      const displayName = user.displayName || user.name || userId
      console.log(`✅ UserCache找到用户:`, { userId, displayName, user })
      return displayName
    }


    // 如果找不到用户信息，返回用户ID
    console.log('❌ 未找到用户信息，返回用户ID:', userId)
    return userId
  }

  /**
   * 批量获取用户显示名称
   * @param {Array} userIds - 用户ID数组
   * @param {string} projectId - 项目ID（可选）
   * @returns {Object} 用户ID到显示名称的映射
   */
  getBatchUserDisplayNames(userIds, projectId = null) {
    if (!Array.isArray(userIds)) return {}

    const result = {}
    userIds.forEach(userId => {
      if (userId) {
        result[userId] = this.getUserDisplayName(userId, projectId)
      }
    })
    
    return result
  }

  /**
   * 检查缓存是否有效
   * @param {string} projectId - 项目ID
   * @returns {boolean} 是否有效
   */
  isDataValid(projectId) {
    const timestamp = this.data.cacheTimestamps[projectId]
    if (!timestamp) return false
    
    const now = Date.now()
    const isValid = (now - timestamp) < this.cacheExpireTime
    
    if (!isValid) {
      console.log(`⏰ 项目 ${projectId} 用户缓存已过期`)
    }
    
    return isValid && !!this.data.projectUsersMap[projectId]
  }

  /**
   * 清除项目用户缓存
   * @param {string} projectId - 项目ID
   */
  clearProjectCache(projectId) {
    if (projectId) {
      delete this.data.projectUsersMap[projectId]
      delete this.data.cacheTimestamps[projectId]
      delete this.data.loading[projectId]
      console.log('🗑️ 已清除项目用户缓存:', projectId)
    }
    this.saveToCache()
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    console.log('🗑️ 清除所有用户缓存')
    this.data.projectUsersMap = {}
    this.data.globalUsersMap = {}
    this.data.cacheTimestamps = {}
    this.data.loading = {}
    
    localStorage.removeItem(USER_CACHE_KEY)
  }

  /**
   * 保存到本地缓存
   */
  saveToCache() {
    try {
      const cacheData = {
        projectUsersMap: this.data.projectUsersMap,
        globalUsersMap: this.data.globalUsersMap,
        cacheTimestamps: this.data.cacheTimestamps,
        saved_at: Date.now()
      }
      
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error('❌ 保存用户缓存失败:', error)
    }
  }

  /**
   * 从本地缓存加载
   */
  loadFromCache() {
    try {
      const cachedData = localStorage.getItem(USER_CACHE_KEY)
      if (!cachedData) return

      const parsed = JSON.parse(cachedData)
      
      // 检查缓存是否过期（24小时）
      const now = Date.now()
      if (parsed.saved_at && (now - parsed.saved_at) > 24 * 60 * 60 * 1000) {
        console.log('⏰ 用户缓存已过期，清除缓存')
        localStorage.removeItem(USER_CACHE_KEY)
        return
      }

      // 恢复数据
      if (parsed.projectUsersMap) this.data.projectUsersMap = parsed.projectUsersMap
      if (parsed.globalUsersMap) this.data.globalUsersMap = parsed.globalUsersMap
      if (parsed.cacheTimestamps) this.data.cacheTimestamps = parsed.cacheTimestamps

      console.log('📦 从本地缓存恢复用户数据')
    } catch (error) {
      console.error('❌ 加载用户缓存失败:', error)
    }
  }

  /**
   * 获取缓存状态
   * @param {string} projectId - 项目ID
   * @returns {Object} 缓存状态信息
   */
  getCacheStatus(projectId) {
    if (!projectId) return null

    const usersMap = this.data.projectUsersMap[projectId]
    const isValid = this.isDataValid(projectId)
    const timestamp = this.data.cacheTimestamps[projectId]

    return {
      project_id: projectId,
      cache_status: {
        exists: !!usersMap,
        valid: isValid,
        user_count: usersMap ? Object.keys(usersMap).length : 0,
        timestamp: timestamp,
        loading: !!this.data.loading[projectId]
      }
    }
  }

  /**
   * 预加载多个项目的用户数据
   * @param {Array} projectIds - 项目ID数组
   * @returns {Promise<Object>} 加载结果
   */
  async preloadMultipleProjects(projectIds) {
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return { success: 0, error: 0, total: 0 }
    }

    console.log('👥 开始预加载多个项目的用户数据:', projectIds)

    const promises = projectIds.map(projectId => 
      this.getProjectUsers(projectId).catch(error => {
        console.error(`预加载项目 ${projectId} 用户数据失败:`, error)
        return null
      })
    )

    const results = await Promise.allSettled(promises)
    
    let successCount = 0
    let errorCount = 0

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++
      } else {
        errorCount++
      }
    })

    console.log(`✅ 用户数据预加载完成: 成功 ${successCount} 个，失败 ${errorCount} 个`)

    return {
      success: successCount,
      error: errorCount,
      total: projectIds.length
    }
  }

}

// 创建单例实例
const userCache = new UserCacheManager()

// 导出实例和便捷方法
export default userCache

export const {
  getProjectUsers,
  getUserById,
  getUserDisplayName,
  getBatchUserDisplayNames,
  clearProjectCache,
  clearAllCache,
  getCacheStatus,
  preloadMultipleProjects
} = userCache
