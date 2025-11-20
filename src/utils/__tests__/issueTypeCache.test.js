/**
 * 议题类型缓存测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import issueTypeCache from '../issueTypeCache.js'

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}))

describe('IssueTypeCache', () => {
  beforeEach(() => {
    // 清除缓存
    issueTypeCache.clearAllCache()
  })

  describe('formatTypeId', () => {
    it('should return "未分类" for empty input', () => {
      expect(issueTypeCache.formatTypeId('')).toBe('未分类')
      expect(issueTypeCache.formatTypeId(null)).toBe('未分类')
      expect(issueTypeCache.formatTypeId(undefined)).toBe('未分类')
    })

    it('should truncate long UUID-like strings', () => {
      const longId = 'b1b5ddb3-e43f-49a5-842d-58f8b4e61d5d'
      const result = issueTypeCache.formatTypeId(longId)
      expect(result).toBe('b1b5ddb3...')
    })

    it('should truncate very long strings', () => {
      const longString = 'this-is-a-very-long-string-that-should-be-truncated'
      const result = issueTypeCache.formatTypeId(longString)
      expect(result).toBe('this-is-a-very-...')
    })

    it('should return short strings as-is', () => {
      const shortString = 'Design'
      const result = issueTypeCache.formatTypeId(shortString)
      expect(result).toBe('Design')
    })
  })

  describe('getCacheInfo', () => {
    it('should return empty cache info initially', () => {
      const info = issueTypeCache.getCacheInfo()
      expect(info.cachedProjects).toEqual([])
      expect(info.loadingProjects).toEqual([])
      expect(info.totalCachedTypes).toBe(0)
    })
  })

  describe('clearProjectCache', () => {
    it('should clear specific project cache', () => {
      const projectId = 'test-project-123'
      
      // 模拟缓存数据
      issueTypeCache.projectTypesCache.set(projectId, [{ id: 'type1', title: 'Type 1' }])
      
      // 验证缓存存在
      expect(issueTypeCache.projectTypesCache.has(projectId)).toBe(true)
      
      // 清除缓存
      issueTypeCache.clearProjectCache(projectId)
      
      // 验证缓存已清除
      expect(issueTypeCache.projectTypesCache.has(projectId)).toBe(false)
    })
  })

  describe('clearAllCache', () => {
    it('should clear all caches', () => {
      // 模拟缓存数据
      issueTypeCache.projectTypesCache.set('project1', [])
      issueTypeCache.projectTypesCache.set('project2', [])
      issueTypeCache.loadingProjects.add('project3')
      
      // 验证缓存存在
      expect(issueTypeCache.projectTypesCache.size).toBe(2)
      expect(issueTypeCache.loadingProjects.size).toBe(1)
      
      // 清除所有缓存
      issueTypeCache.clearAllCache()
      
      // 验证所有缓存已清除
      expect(issueTypeCache.projectTypesCache.size).toBe(0)
      expect(issueTypeCache.loadingProjects.size).toBe(0)
    })
  })
})
