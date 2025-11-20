/**
 * 根本原因缓存测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import rootCauseCache from '../rootCauseCache.js'

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}))

describe('RootCauseCache', () => {
  beforeEach(() => {
    // 清除缓存
    rootCauseCache.clearAllCache()
  })

  describe('formatRootCauseId', () => {
    it('should return "未设置" for empty input', () => {
      expect(rootCauseCache.formatRootCauseId('')).toBe('未设置')
      expect(rootCauseCache.formatRootCauseId(null)).toBe('未设置')
      expect(rootCauseCache.formatRootCauseId(undefined)).toBe('未设置')
    })

    it('should truncate long UUID-like strings', () => {
      const longId = 'ad671f4d-9f83-47aa-b6a8-e5ca4b131d06'
      const result = rootCauseCache.formatRootCauseId(longId)
      expect(result).toBe('ad671f4d...')
    })

    it('should truncate very long strings', () => {
      const longString = 'this-is-a-very-long-root-cause-name-that-should-be-truncated'
      const result = rootCauseCache.formatRootCauseId(longString)
      expect(result).toBe('this-is-a-very-...')
    })

    it('should return short strings as-is', () => {
      const shortString = 'Communication'
      const result = rootCauseCache.formatRootCauseId(shortString)
      expect(result).toBe('Communication')
    })
  })

  describe('getCacheInfo', () => {
    it('should return empty cache info initially', () => {
      const info = rootCauseCache.getCacheInfo()
      expect(info.cachedProjects).toEqual([])
      expect(info.loadingProjects).toEqual([])
      expect(info.totalCachedRootCauses).toBe(0)
    })
  })

  describe('clearProjectCache', () => {
    it('should clear specific project cache', () => {
      const projectId = 'test-project-123'
      
      // 模拟缓存数据
      rootCauseCache.projectRootCausesCache.set(projectId, [
        { id: 'cause1', title: 'Communication', type: 'category' }
      ])
      
      // 验证缓存存在
      expect(rootCauseCache.projectRootCausesCache.has(projectId)).toBe(true)
      
      // 清除缓存
      rootCauseCache.clearProjectCache(projectId)
      
      // 验证缓存已清除
      expect(rootCauseCache.projectRootCausesCache.has(projectId)).toBe(false)
    })
  })

  describe('clearAllCache', () => {
    it('should clear all caches', () => {
      // 模拟缓存数据
      rootCauseCache.projectRootCausesCache.set('project1', [])
      rootCauseCache.projectRootCausesCache.set('project2', [])
      rootCauseCache.loadingProjects.add('project3')
      
      // 验证缓存存在
      expect(rootCauseCache.projectRootCausesCache.size).toBe(2)
      expect(rootCauseCache.loadingProjects.size).toBe(1)
      
      // 清除所有缓存
      rootCauseCache.clearAllCache()
      
      // 验证所有缓存已清除
      expect(rootCauseCache.projectRootCausesCache.size).toBe(0)
      expect(rootCauseCache.loadingProjects.size).toBe(0)
    })
  })
})
