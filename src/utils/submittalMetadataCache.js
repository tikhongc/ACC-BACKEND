/**
 * Submittal Metadata 缓存管理器
 * 统一管理 submittal 的 metadata，包括 item types, responses, templates 等
 */

import { reactive } from 'vue'
import axios from 'axios'

// 缓存键名
const SUBMITTAL_METADATA_CACHE_KEY = 'acc_submittal_metadata_cache'

/**
 * Submittal Metadata 缓存管理类
 */
class SubmittalMetadataCacheManager {
  constructor() {
    // 响应式数据存储
    this.data = reactive({
      // 项目级别的缓存 { projectId: { itemTypes: {}, responses: {}, templates: {}, specs: {} } }
      projectMetadataMap: {},
      
      // 缓存时间戳
      cacheTimestamps: {},
      
      // 加载状态
      loading: {}
    })
    
    // 缓存过期时间（1小时）
    this.cacheExpireTime = 60 * 60 * 1000
    
    // 加载本地缓存
    this.loadFromCache()
  }

  /**
   * 获取或加载项目 metadata
   * @param {string} projectId - 项目ID
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object>} metadata 对象
   */
  async getProjectMetadata(projectId, forceRefresh = false) {
    if (!projectId) {
      console.error('❌ 项目ID为空')
      return { itemTypes: {}, responses: {}, templates: {}, specs: {} }
    }

    // 检查缓存
    if (!forceRefresh && this.isDataValid(projectId)) {
      console.log('🏢 使用缓存的 submittal metadata')
      return this.data.projectMetadataMap[projectId] || { itemTypes: {}, responses: {}, templates: {}, specs: {} }
    }

    // 加载新数据
    return await this.loadProjectMetadata(projectId)
  }

  /**
   * 加载项目 metadata
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} metadata 对象
   */
  async loadProjectMetadata(projectId, forceReload = false) {
    // 检查缓存是否有效
    if (!forceReload && this.isDataValid(projectId)) {
      const cached = this.data.projectMetadataMap[projectId]
      console.log('✅ 使用缓存的 submittal metadata:', {
        projectId,
        itemTypesCount: Object.keys(cached?.itemTypes || {}).length,
        responsesCount: Object.keys(cached?.responses || {}).length,
        cacheAge: Math.round((Date.now() - this.data.cacheTimestamps[projectId]) / 1000 / 60) + ' 分钟'
      })
      return cached
    }

    if (this.data.loading[projectId]) {
      console.log('⏳ Submittal metadata 正在加载中...')
      
      // 等待加载完成
      let attempts = 0
      while (this.data.loading[projectId] && attempts < 30) { // 最多等待15秒
        await new Promise(resolve => setTimeout(resolve, 500))
        attempts++
      }
      
      return this.data.projectMetadataMap[projectId] || { itemTypes: {}, responses: {}, templates: {}, specs: {} }
    }

    try {
      console.log('🏢 开始加载 submittal metadata:', projectId)
      this.data.loading[projectId] = true

      const response = await axios.get(`/api/submittals/${projectId}/metadata`, {
        timeout: 30000
      })

      if (response.data.error) {
        throw new Error(response.data.error)
      }

      // 处理 item types 数据
      const itemTypesMap = {}
      const itemTypes = response.data.itemTypes?.results || []
      itemTypes.forEach(itemType => {
        if (itemType.id && itemType.value) {
          itemTypesMap[itemType.id] = {
            id: itemType.id,
            name: itemType.value,
            key: itemType.key,
            platformId: itemType.platformId,
            isActive: itemType.isActive,
            isInUse: itemType.isInUse,
            displayName: itemType.value
          }
        }
      })

      // 处理 responses 数据
      const responsesMap = {}
      const responses = response.data.responses?.results || []
      responses.forEach(response => {
        if (response.id && response.value) {
          responsesMap[response.id] = {
            id: response.id,
            name: response.value,
            key: response.key,
            displayName: response.value
          }
        }
      })

      // 处理 templates 数据
      const templatesMap = {}
      const templates = response.data.templates?.results || []
      templates.forEach(template => {
        if (template.id && template.name) {
          templatesMap[template.id] = {
            id: template.id,
            name: template.name,
            displayName: template.name
          }
        }
      })

      // 处理 specs 数据
      const specsMap = {}
      const specs = response.data.specs?.results || []
      specs.forEach(spec => {
        if (spec.id && spec.title) {
          specsMap[spec.id] = {
            id: spec.id,
            name: spec.title,
            identifier: spec.identifier,
            displayName: spec.title
          }
        }
      })

      const metadata = {
        itemTypes: itemTypesMap,
        responses: responsesMap,
        templates: templatesMap,
        specs: specsMap
      }

      // 缓存数据
      this.data.projectMetadataMap[projectId] = metadata
      this.data.cacheTimestamps[projectId] = Date.now()
      
      // 异步保存到本地缓存，不阻塞返回
      setTimeout(() => this.saveToCache(), 100)
      
      console.log(`✅ Submittal metadata 加载成功:`, {
        itemTypes: Object.keys(metadata.itemTypes).length,
        responses: Object.keys(metadata.responses).length,
        templates: Object.keys(metadata.templates).length,
        specs: Object.keys(metadata.specs).length
      })
      
      return metadata

    } catch (error) {
      console.error('❌ 加载 submittal metadata 失败:', error)
      
      // 即使失败也要创建空的缓存结构
      const emptyMetadata = { itemTypes: {}, responses: {}, templates: {}, specs: {} }
      this.data.projectMetadataMap[projectId] = emptyMetadata
      this.data.cacheTimestamps[projectId] = Date.now()
      
      return emptyMetadata
    } finally {
      this.data.loading[projectId] = false
    }
  }

  /**
   * 获取 item type 显示名称
   * @param {string} typeId - 类型ID
   * @param {string} projectId - 项目ID
   * @returns {string} 类型显示名称
   */
  getItemTypeDisplayName(typeId, projectId) {
    if (!typeId || !projectId) return typeId || 'Unknown Type'
    
    const metadata = this.data.projectMetadataMap[projectId]
    if (!metadata || !metadata.itemTypes) return typeId
    
    const itemType = metadata.itemTypes[typeId]
    return itemType ? itemType.displayName : typeId
  }

  /**
   * 获取 response 显示名称
   * @param {string} responseId - 响应ID
   * @param {string} projectId - 项目ID
   * @returns {string} 响应显示名称
   */
  getResponseDisplayName(responseId, projectId) {
    if (!responseId || !projectId) return responseId || 'Unknown Response'
    
    const metadata = this.data.projectMetadataMap[projectId]
    if (!metadata || !metadata.responses) return responseId
    
    const response = metadata.responses[responseId]
    return response ? response.displayName : responseId
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
      console.log(`⏰ 项目 ${projectId} submittal metadata 缓存已过期`)
    }
    
    return isValid && !!this.data.projectMetadataMap[projectId]
  }

  /**
   * 清除项目缓存
   * @param {string} projectId - 项目ID
   */
  clearProjectCache(projectId) {
    if (projectId) {
      delete this.data.projectMetadataMap[projectId]
      delete this.data.cacheTimestamps[projectId]
      delete this.data.loading[projectId]
      console.log('🗑️ 已清除项目 submittal metadata 缓存:', projectId)
    }
    this.saveToCache()
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    console.log('🗑️ 清除所有 submittal metadata 缓存')
    this.data.projectMetadataMap = {}
    this.data.cacheTimestamps = {}
    this.data.loading = {}
    
    localStorage.removeItem(SUBMITTAL_METADATA_CACHE_KEY)
  }

  /**
   * 保存到本地缓存
   */
  saveToCache() {
    try {
      const cacheData = {
        projectMetadataMap: this.data.projectMetadataMap,
        cacheTimestamps: this.data.cacheTimestamps,
        saved_at: Date.now(),
        version: '1.0.0'
      }
      
      localStorage.setItem(SUBMITTAL_METADATA_CACHE_KEY, JSON.stringify(cacheData))
      
      // 保存缓存统计信息
      const stats = {
        lastSaved: new Date().toISOString(),
        projectCount: Object.keys(this.data.projectMetadataMap).length,
        totalItemTypes: Object.values(this.data.projectMetadataMap).reduce((sum, metadata) => 
          sum + Object.keys(metadata.itemTypes || {}).length, 0)
      }
      
      console.log('💾 Submittal metadata 缓存已保存:', stats)
    } catch (error) {
      console.error('❌ 保存 submittal metadata 缓存失败:', error)
    }
  }

  /**
   * 从本地缓存加载
   */
  loadFromCache() {
    try {
      const cachedData = localStorage.getItem(SUBMITTAL_METADATA_CACHE_KEY)
      if (!cachedData) {
        console.log('📦 没有找到 submittal metadata 本地缓存数据')
        return false
      }

      const parsed = JSON.parse(cachedData)
      
      // 检查缓存是否过期（4小时）
      const now = Date.now()
      const cacheAge = now - (parsed.saved_at || 0)
      const maxAge = 4 * 60 * 60 * 1000 // 4小时
      
      if (cacheAge > maxAge) {
        console.log(`⏰ Submittal metadata 缓存已过期 (${Math.round(cacheAge / 1000 / 60 / 60)}小时)，清除缓存`)
        localStorage.removeItem(SUBMITTAL_METADATA_CACHE_KEY)
        return false
      }

      // 恢复数据，保持响应式
      if (parsed.projectMetadataMap) {
        Object.assign(this.data.projectMetadataMap, parsed.projectMetadataMap)
      }
      if (parsed.cacheTimestamps) {
        Object.assign(this.data.cacheTimestamps, parsed.cacheTimestamps)
      }

      const stats = {
        cacheAge: Math.round(cacheAge / 1000 / 60) + ' 分钟',
        projectCount: Object.keys(this.data.projectMetadataMap).length,
        totalItemTypes: Object.values(this.data.projectMetadataMap).reduce((sum, metadata) => 
          sum + Object.keys(metadata.itemTypes || {}).length, 0)
      }

      console.log('📦 从本地缓存恢复 submittal metadata 数据:', stats)
      return true
    } catch (error) {
      console.error('❌ 加载 submittal metadata 缓存失败:', error)
      localStorage.removeItem(SUBMITTAL_METADATA_CACHE_KEY)
      return false
    }
  }
}

// 创建单例实例
const submittalMetadataCache = new SubmittalMetadataCacheManager()

// 导出实例和便捷方法
export default submittalMetadataCache

export const {
  getProjectMetadata,
  getItemTypeDisplayName,
  getResponseDisplayName,
  clearProjectCache,
  clearAllCache
} = submittalMetadataCache
