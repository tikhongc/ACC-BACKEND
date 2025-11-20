/**
 * 根本原因缓存管理
 * 用于缓存和解析根本原因ID到名称的映射
 */

import axios from 'axios'

class RootCauseCacheManager {
  constructor() {
    // 项目级别的根本原因缓存
    this.projectRootCausesCache = new Map()
    // 加载状态跟踪
    this.loadingProjects = new Set()
  }

  /**
   * 获取项目的根本原因类别和原因
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 根本原因数组
   */
  async getProjectRootCauses(projectId) {
    if (!projectId) {
      console.warn('⚠️ 获取根本原因失败: 缺少项目ID')
      return []
    }

    // 如果已经缓存，直接返回
    if (this.projectRootCausesCache.has(projectId)) {
      console.log('✅ 从缓存获取根本原因:', projectId)
      return this.projectRootCausesCache.get(projectId)
    }

    // 如果正在加载，等待加载完成
    if (this.loadingProjects.has(projectId)) {
      console.log('⏳ 等待根本原因加载完成:', projectId)
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.projectRootCausesCache.has(projectId)) {
            clearInterval(checkInterval)
            resolve(this.projectRootCausesCache.get(projectId))
          }
        }, 100)
        
        // 超时处理
        setTimeout(() => {
          clearInterval(checkInterval)
          resolve([])
        }, 10000)
      })
    }

    // 开始加载
    this.loadingProjects.add(projectId)
    
    try {
      console.log('🔄 加载项目根本原因:', projectId)
      
      const response = await axios.get(
        `/api/issues/projects/${projectId}/root-cause-categories`,
        {
          timeout: 15000,
          params: {
            includeRootCauses: 'true',
            limit: 100
          }
        }
      )

      if (response.data.status === 'success') {
        const categories = response.data.data.results || []
        
        // 扁平化处理，将类别和根本原因都放入同一个数组
        const allRootCauses = []
        
        categories.forEach(category => {
          // 添加类别本身
          allRootCauses.push({
            id: category.id,
            title: category.title || category.name,
            type: 'category',
            category: null
          })
          
          // 添加该类别下的根本原因
          if (category.rootCauses && Array.isArray(category.rootCauses)) {
            category.rootCauses.forEach(rootCause => {
              allRootCauses.push({
                id: rootCause.id,
                title: rootCause.title || rootCause.name,
                type: 'rootcause',
                category: category.title || category.name,
                categoryId: category.id
              })
            })
          }
        })
        
        // 缓存数据
        this.projectRootCausesCache.set(projectId, allRootCauses)
        
        console.log(`✅ 根本原因加载成功: ${allRootCauses.length} 个`, projectId)
        return allRootCauses
      } else {
        throw new Error(response.data.error || '获取根本原因失败')
      }
    } catch (error) {
      console.error('❌ 加载根本原因失败:', error)
      // 缓存空数组避免重复请求
      this.projectRootCausesCache.set(projectId, [])
      return []
    } finally {
      this.loadingProjects.delete(projectId)
    }
  }

  /**
   * 根据根本原因ID获取名称
   * @param {string} rootCauseId - 根本原因ID
   * @param {string} projectId - 项目ID
   * @returns {Promise<string>} 根本原因名称
   */
  async getRootCauseName(rootCauseId, projectId) {
    if (!rootCauseId) return '未设置'
    if (!projectId) return this.formatRootCauseId(rootCauseId)

    try {
      const rootCauses = await this.getProjectRootCauses(projectId)
      
      // 查找根本原因
      const rootCause = rootCauses.find(rc => rc.id === rootCauseId)
      if (rootCause) {
        // 只显示根本原因名称，不显示类别前缀
        return rootCause.title || this.formatRootCauseId(rootCauseId)
      }

      // 未找到，返回格式化的ID
      return this.formatRootCauseId(rootCauseId)
    } catch (error) {
      console.error('❌ 获取根本原因名称失败:', error)
      return this.formatRootCauseId(rootCauseId)
    }
  }

  /**
   * 获取根本原因的详细信息
   * @param {string} rootCauseId - 根本原因ID
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object|null>} 根本原因详细信息
   */
  async getRootCauseDetails(rootCauseId, projectId) {
    if (!rootCauseId || !projectId) return null

    try {
      const rootCauses = await this.getProjectRootCauses(projectId)
      return rootCauses.find(rc => rc.id === rootCauseId) || null
    } catch (error) {
      console.error('❌ 获取根本原因详情失败:', error)
      return null
    }
  }

  /**
   * 获取根本原因的类型（用于标签颜色）
   * @param {string} rootCauseId - 根本原因ID
   * @param {string} projectId - 项目ID
   * @returns {Promise<string>} 类型标识
   */
  async getRootCauseType(rootCauseId, projectId) {
    if (!rootCauseId || !projectId) return 'info'

    try {
      const details = await this.getRootCauseDetails(rootCauseId, projectId)
      if (details) {
        return details.type === 'category' ? 'primary' : 'warning'
      }
      return 'info'
    } catch (error) {
      return 'info'
    }
  }

  /**
   * 格式化根本原因ID为显示文本
   * @param {string} rootCauseId - 根本原因ID
   * @returns {string} 格式化的显示文本
   */
  formatRootCauseId(rootCauseId) {
    if (!rootCauseId) return '未设置'
    
    // 如果是UUID格式，显示前8位
    if (rootCauseId.length > 20 && rootCauseId.includes('-')) {
      return rootCauseId.substring(0, 8) + '...'
    }
    
    // 如果太长，截断显示
    if (rootCauseId.length > 15) {
      return rootCauseId.substring(0, 15) + '...'
    }
    
    return rootCauseId
  }

  /**
   * 清除项目缓存
   * @param {string} projectId - 项目ID
   */
  clearProjectCache(projectId) {
    if (projectId) {
      this.projectRootCausesCache.delete(projectId)
      this.loadingProjects.delete(projectId)
      console.log('🗑️ 清除项目根本原因缓存:', projectId)
    }
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    this.projectRootCausesCache.clear()
    this.loadingProjects.clear()
    console.log('🗑️ 清除所有根本原因缓存')
  }

  /**
   * 获取缓存状态信息
   * @returns {Object} 缓存状态
   */
  getCacheInfo() {
    return {
      cachedProjects: Array.from(this.projectRootCausesCache.keys()),
      loadingProjects: Array.from(this.loadingProjects),
      totalCachedRootCauses: Array.from(this.projectRootCausesCache.values()).reduce((sum, causes) => sum + causes.length, 0)
    }
  }
}

// 创建全局实例
const rootCauseCache = new RootCauseCacheManager()

export default rootCauseCache
