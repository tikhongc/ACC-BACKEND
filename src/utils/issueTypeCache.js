/**
 * 议题类型缓存管理
 * 用于缓存和解析议题类型ID到名称的映射
 */

import axios from 'axios'

class IssueTypeCacheManager {
  constructor() {
    // 项目级别的类型缓存
    this.projectTypesCache = new Map()
    // 加载状态跟踪
    this.loadingProjects = new Set()
  }

  /**
   * 获取项目的议题类型
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 议题类型数组
   */
  async getProjectIssueTypes(projectId) {
    if (!projectId) {
      console.warn('⚠️ 获取议题类型失败: 缺少项目ID')
      return []
    }

    // 如果已经缓存，直接返回
    if (this.projectTypesCache.has(projectId)) {
      console.log('✅ 从缓存获取议题类型:', projectId)
      return this.projectTypesCache.get(projectId)
    }

    // 如果正在加载，等待加载完成
    if (this.loadingProjects.has(projectId)) {
      console.log('⏳ 等待议题类型加载完成:', projectId)
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.projectTypesCache.has(projectId)) {
            clearInterval(checkInterval)
            resolve(this.projectTypesCache.get(projectId))
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
      console.log('🔄 加载项目议题类型:', projectId)
      
      const response = await axios.get(
        `/api/issues/projects/${projectId}/issue-types`,
        {
          timeout: 15000,
          params: {
            includeSubtypes: 'true',
            limit: 100
          }
        }
      )

      if (response.data.status === 'success') {
        const types = response.data.data.results || []
        
        // 缓存类型数据
        this.projectTypesCache.set(projectId, types)
        
        console.log(`✅ 议题类型加载成功: ${types.length} 个`, projectId)
        return types
      } else {
        throw new Error(response.data.error || '获取议题类型失败')
      }
    } catch (error) {
      console.error('❌ 加载议题类型失败:', error)
      // 缓存空数组避免重复请求
      this.projectTypesCache.set(projectId, [])
      return []
    } finally {
      this.loadingProjects.delete(projectId)
    }
  }

  /**
   * 根据类型ID获取类型名称
   * @param {string} typeId - 议题类型ID
   * @param {string} projectId - 项目ID
   * @returns {Promise<string>} 类型名称
   */
  async getIssueTypeName(typeId, projectId) {
    if (!typeId) return '未分类'
    if (!projectId) return this.formatTypeId(typeId)

    try {
      const types = await this.getProjectIssueTypes(projectId)
      
      // 查找主类型
      const mainType = types.find(type => type.id === typeId)
      if (mainType) {
        return mainType.title || mainType.name || this.formatTypeId(typeId)
      }

      // 查找子类型
      for (const type of types) {
        if (type.subtypes && Array.isArray(type.subtypes)) {
          const subtype = type.subtypes.find(sub => sub.id === typeId)
          if (subtype) {
            return subtype.title || subtype.name || this.formatTypeId(typeId)
          }
        }
      }

      // 未找到，返回格式化的ID
      return this.formatTypeId(typeId)
    } catch (error) {
      console.error('❌ 获取议题类型名称失败:', error)
      return this.formatTypeId(typeId)
    }
  }

  /**
   * 根据子类型ID获取子类型名称
   * @param {string} subtypeId - 议题子类型ID
   * @param {string} projectId - 项目ID
   * @returns {Promise<string>} 子类型名称
   */
  async getIssueSubtypeName(subtypeId, projectId) {
    if (!subtypeId) return '未分类'
    if (!projectId) return this.formatTypeId(subtypeId)

    try {
      const types = await this.getProjectIssueTypes(projectId)
      
      // 查找子类型
      for (const type of types) {
        if (type.subtypes && Array.isArray(type.subtypes)) {
          const subtype = type.subtypes.find(sub => sub.id === subtypeId)
          if (subtype) {
            return subtype.title || subtype.name || this.formatTypeId(subtypeId)
          }
        }
      }

      // 未找到，返回格式化的ID
      return this.formatTypeId(subtypeId)
    } catch (error) {
      console.error('❌ 获取议题子类型名称失败:', error)
      return this.formatTypeId(subtypeId)
    }
  }

  /**
   * 获取完整的类型信息（主类型 + 子类型）
   * @param {string} typeId - 议题类型ID
   * @param {string} subtypeId - 议题子类型ID
   * @param {string} projectId - 项目ID
   * @returns {Promise<string>} 完整类型信息
   */
  async getFullTypeName(typeId, subtypeId, projectId) {
    if (!typeId && !subtypeId) return '未分类'
    if (!projectId) {
      const parts = []
      if (typeId) parts.push(this.formatTypeId(typeId))
      if (subtypeId) parts.push(this.formatTypeId(subtypeId))
      return parts.join(' / ')
    }

    try {
      const [typeName, subtypeName] = await Promise.all([
        typeId ? this.getIssueTypeName(typeId, projectId) : Promise.resolve(''),
        subtypeId ? this.getIssueSubtypeName(subtypeId, projectId) : Promise.resolve('')
      ])

      const parts = []
      if (typeName && typeName !== '未分类') parts.push(typeName)
      if (subtypeName && subtypeName !== '未分类') parts.push(subtypeName)
      
      return parts.length > 0 ? parts.join(' / ') : '未分类'
    } catch (error) {
      console.error('❌ 获取完整类型信息失败:', error)
      return '未分类'
    }
  }

  /**
   * 格式化类型ID为显示文本
   * @param {string} typeId - 类型ID
   * @returns {string} 格式化的显示文本
   */
  formatTypeId(typeId) {
    if (!typeId) return '未分类'
    
    // 如果是UUID格式，显示前8位
    if (typeId.length > 20 && typeId.includes('-')) {
      return typeId.substring(0, 8) + '...'
    }
    
    // 如果太长，截断显示
    if (typeId.length > 15) {
      return typeId.substring(0, 15) + '...'
    }
    
    return typeId
  }

  /**
   * 清除项目缓存
   * @param {string} projectId - 项目ID
   */
  clearProjectCache(projectId) {
    if (projectId) {
      this.projectTypesCache.delete(projectId)
      this.loadingProjects.delete(projectId)
      console.log('🗑️ 清除项目议题类型缓存:', projectId)
    }
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    this.projectTypesCache.clear()
    this.loadingProjects.clear()
    console.log('🗑️ 清除所有议题类型缓存')
  }

  /**
   * 获取缓存状态信息
   * @returns {Object} 缓存状态
   */
  getCacheInfo() {
    return {
      cachedProjects: Array.from(this.projectTypesCache.keys()),
      loadingProjects: Array.from(this.loadingProjects),
      totalCachedTypes: Array.from(this.projectTypesCache.values()).reduce((sum, types) => sum + types.length, 0)
    }
  }
}

// 创建全局实例
const issueTypeCache = new IssueTypeCacheManager()

export default issueTypeCache
