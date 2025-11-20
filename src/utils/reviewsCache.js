/**
 * 评审数据缓存管理
 * 用于在不同组件间共享评审数据，避免重复API调用
 */

import { ref, reactive } from 'vue'

// 全局评审数据缓存
const reviewsCache = reactive({
  // 评审ID到评审信息的映射
  reviewsMap: new Map(),
  
  // 项目ID到评审列表的映射
  projectReviewsMap: new Map(),
  
  // 缓存时间戳
  cacheTimestamps: new Map(),
  
  // 缓存过期时间（10分钟）
  cacheExpireTime: 10 * 60 * 1000
})

/**
 * 评审缓存管理类
 */
class ReviewsCacheManager {
  
  /**
   * 更新项目的评审数据缓存
   * @param {string} projectId - 项目ID
   * @param {Array} reviews - 评审数据数组
   */
  updateProjectReviews(projectId, reviews) {
    if (!projectId || !Array.isArray(reviews)) {
      console.warn('更新评审缓存失败：无效的项目ID或评审数据')
      return
    }
    
    // 清空旧的映射
    reviewsCache.reviewsMap.clear()
    
    // 更新评审映射
    reviews.forEach(review => {
      if (review.id && review.name) {
        reviewsCache.reviewsMap.set(review.id, {
          id: review.id,
          name: review.name,
          sequenceId: review.sequenceId,
          status: review.status,
          workflowId: review.workflowId,
          projectId: projectId
        })
      }
    })
    
    // 更新项目评审列表
    reviewsCache.projectReviewsMap.set(projectId, reviews)
    
    // 更新缓存时间戳
    reviewsCache.cacheTimestamps.set(projectId, Date.now())
    
    console.log(`评审缓存已更新 - 项目: ${projectId}, 评审数量: ${reviews.length}`)
  }
  
  /**
   * 根据评审ID获取评审信息
   * @param {string} reviewId - 评审ID
   * @returns {Object|null} 评审信息或null
   */
  getReviewById(reviewId) {
    if (!reviewId) return null
    
    const review = reviewsCache.reviewsMap.get(reviewId)
    if (review) {
      console.log(`从缓存获取评审信息: ${reviewId} -> ${review.name}`)
      return review
    }
    
    console.warn(`缓存中未找到评审: ${reviewId}`)
    return null
  }
  
  /**
   * 根据评审ID获取评审名称
   * @param {string} reviewId - 评审ID
   * @returns {string} 评审名称或ID
   */
  getReviewName(reviewId) {
    if (!reviewId) return ''
    
    const review = this.getReviewById(reviewId)
    return review ? review.name : reviewId
  }
  
  /**
   * 获取项目的所有评审
   * @param {string} projectId - 项目ID
   * @returns {Array} 评审数组
   */
  getProjectReviews(projectId) {
    if (!projectId) return []
    
    // 检查缓存是否过期
    const timestamp = reviewsCache.cacheTimestamps.get(projectId)
    if (timestamp && (Date.now() - timestamp) > reviewsCache.cacheExpireTime) {
      console.log(`项目 ${projectId} 的评审缓存已过期`)
      this.clearProjectCache(projectId)
      return []
    }
    
    return reviewsCache.projectReviewsMap.get(projectId) || []
  }
  
  /**
   * 清空指定项目的缓存
   * @param {string} projectId - 项目ID
   */
  clearProjectCache(projectId) {
    if (!projectId) return
    
    // 清空项目相关的评审映射
    const reviews = reviewsCache.projectReviewsMap.get(projectId) || []
    reviews.forEach(review => {
      if (review.id) {
        reviewsCache.reviewsMap.delete(review.id)
      }
    })
    
    // 清空项目缓存
    reviewsCache.projectReviewsMap.delete(projectId)
    reviewsCache.cacheTimestamps.delete(projectId)
    
    console.log(`已清空项目 ${projectId} 的评审缓存`)
  }
  
  /**
   * 清空所有缓存
   */
  clearAllCache() {
    reviewsCache.reviewsMap.clear()
    reviewsCache.projectReviewsMap.clear()
    reviewsCache.cacheTimestamps.clear()
    console.log('已清空所有评审缓存')
  }
  
  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    return {
      reviewsCount: reviewsCache.reviewsMap.size,
      projectsCount: reviewsCache.projectReviewsMap.size,
      cacheTimestamps: Array.from(reviewsCache.cacheTimestamps.entries()).map(([projectId, timestamp]) => ({
        projectId,
        timestamp,
        age: Date.now() - timestamp,
        expired: (Date.now() - timestamp) > reviewsCache.cacheExpireTime
      }))
    }
  }
}

// 创建单例实例
const reviewsCacheManager = new ReviewsCacheManager()

// 导出缓存管理器和响应式缓存对象
export { reviewsCacheManager, reviewsCache }
export default reviewsCacheManager
