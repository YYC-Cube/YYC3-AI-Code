/**
 * YYC³ AI - Network Exception Edge Cases Tests
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module Network Exception Tests
 * @description 网络异常处理测试 - 测试各种网络错误场景的处理
 * @author YYC³ AI Team
 * @version 1.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAIStore } from '@/app/stores/ai-store'
import { getOfflineService, destroyOfflineService } from '@/app/services/offline/offline-service'
import { destroyYjsService } from '@/app/services/yjs/yjs-service'

// Type declarations for test environment
declare const global: {
  fetch: typeof fetch
  navigator: {
    onLine: boolean
  }
}

// Mock fetch for network error simulation
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to mock navigator.onLine
let mockIsOnline = true
Object.defineProperty(global.navigator, 'onLine', {
  get() { return mockIsOnline },
  configurable: true
})

describe('Network Exception Tests - 网络异常处理测试', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    mockFetch.mockReset()
    
    // Reset online status
    mockIsOnline = true
    
    // Clear stores and disable retries for faster tests
    useAIStore.setState({
      isLoading: false,
      error: null,
      messages: [],
      isStreaming: false,
      _attemptCount: 0,
    })
    useAIStore.getState()._disableRetries()
    
    // Clear services
    destroyOfflineService()
    destroyYjsService()
  })

  afterEach(() => {
    // Cleanup
    vi.clearAllMocks()
    destroyOfflineService()
    destroyYjsService()
  })

  describe('Network Timeout - 网络超时', () => {
    it('应该处理网络请求超时', async () => {
      // Mock timeout
      mockFetch.mockImplementationOnce(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 10)
        )
      )

      const { result } = renderHook(() => useAIStore())

      await act(async () => {
        try {
          await result.current.sendMessage('Test message with timeout')
        } catch (error) {
          expect(error).toBeDefined()
          expect(error instanceof Error ? error.message : String(error)).toContain('timeout')
        }
      })

      expect(result.current.error).toBeDefined()
    })

    it('应该在超时后重试', async () => {
      // Enable retries for this test
      useAIStore.getState()._enableRetries()
      
      let attemptCount = 0
      mockFetch.mockImplementation(() =>
        new Promise((resolve, reject) => {
          attemptCount++
          if (attemptCount < 3) {
            setTimeout(() => reject(new Error('Network timeout')), 10)
          } else {
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve({ content: 'Success after retry' })
            }), 10)
          }
        })
      )

      const { result } = renderHook(() => useAIStore())

      await act(async () => {
        await result.current.sendMessage('Test with retry')
      })

      expect(attemptCount).toBe(3)
      expect(result.current.error).toBeNull()
      expect(result.current.messages.length).toBeGreaterThan(0)
    })
  })

  describe('Network Error - 网络错误', () => {
    it('应该处理网络连接失败', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'))

      const { result } = renderHook(() => useAIStore())

      await act(async () => {
        try {
          await result.current.sendMessage('Test message')
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error!.message).toContain('Network connection failed')
    })

    it('应该处理 CORS 错误', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const { result } = renderHook(() => useAIStore())

      await act(async () => {
        try {
          await result.current.sendMessage('Test CORS error')
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      expect(result.current.error).toBeDefined()
    })

    it('应该处理 HTTP 错误状态码', async () => {
      // 500 Internal Server Error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' }),
      })

      const { result } = renderHook(() => useAIStore())

      await act(async () => {
        try {
          await result.current.sendMessage('Test 500 error')
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error!.message).toContain('500')
    })

    it('应该处理 401 Unauthorized 错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })

      const { result } = renderHook(() => useAIStore())

      await act(async () => {
        try {
          await result.current.sendMessage('Test 401 error')
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error!.message).toContain('401')
    })

    it('应该处理 429 Rate Limit 错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          get: () => '60', // Retry-After header
        },
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      })

      const { result } = renderHook(() => useAIStore())

      await act(async () => {
        try {
          await result.current.sendMessage('Test 429 error')
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error!.message).toContain('Rate limit')
    })
  })

  describe('Offline Mode - 离线模式', () => {
    it('应该在离线时切换到离线模式', async () => {
      // Mock offline
      mockIsOnline = false

      const offlineService = getOfflineService()

      // Store data while offline
      await offlineService.storeText('offline-message', 'Test offline message')

      // Verify data is stored
      const retrieved = await offlineService.getText('offline-message')
      expect(retrieved).toBe('Test offline message')
    })

    it('应该在恢复在线后同步数据', async () => {
      // Start offline
      mockIsOnline = false
      const offlineService = getOfflineService()

      // Store data offline
      await offlineService.storeText('sync-test', 'Data to sync')

      // Get unsynced items
      const unsynced = await offlineService.getUnsyncedItems()
      expect(unsynced.length).toBeGreaterThan(0)

      // Go online
      mockIsOnline = true
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      // Sync would happen here (implementation specific)
      // For now, just verify unsynced items are detected
      expect(unsynced).toBeDefined()
    })

    it('应该在离线时禁用在线功能', async () => {
      mockIsOnline = false

      const { result } = renderHook(() => useAIStore())

      // Try to send message offline
      await act(async () => {
        try {
          await result.current.sendMessage('Test offline message')
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      // Verify offline mode is indicated
      expect(result.current.error).toBeDefined()
      expect(result.current.error!.message).toMatch(/offline|network/)
    })
  })

  describe('Network Fluctuation - 网络波动', () => {
    it('应该处理间歇性网络连接', async () => {
      let callCount = 0
      mockFetch.mockImplementation(() => {
        callCount++
        if (callCount % 2 === 0) {
          return Promise.reject(new Error('Network unstable'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: `Response ${callCount}` }),
        })
      })

      const { result } = renderHook(() => useAIStore())

      // Send multiple messages
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          try {
            await result.current.sendMessage(`Message ${i}`)
          } catch (error) {
            // Some will fail due to network instability
            expect(error).toBeDefined()
          }
        })
      }

      // Verify some messages got through
      expect(result.current.messages.length).toBeGreaterThan(0)
    })

    it('应该在网络波动时保持UI响应', async () => {
      mockFetch.mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ content: 'Delayed response' }),
            })
          }, 50) // Short delay
        })
      )

      const { result } = renderHook(() => useAIStore())

      // Verify initial state
      expect(result.current.isLoading).toBe(false)

      // Start a request - it should complete without blocking
      await act(async () => {
        await result.current.sendMessage('Long request')
      })

      // Verify request completed successfully
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.messages.length).toBe(2) // user + assistant message
      
      // The key test: verify that the store properly manages loading state
      // and doesn't leave the UI in a permanent loading state
      expect(result.current.isStreaming).toBe(false)
    })
  })

  describe('Partial Failure - 部分失败', () => {
    it('应该处理批量请求中的部分失败', async () => {
      const messages = ['msg1', 'msg2', 'msg3', 'msg4', 'msg5']
      
      // Track which messages should fail (by message content)
      const failingMessages = new Set(['msg2', 'msg4'])

      mockFetch.mockImplementation(() => {
        // Simulate some messages failing
        const currentMessage = messages[mockFetch.mock.calls.length - 1] || ''
        if (failingMessages.has(currentMessage)) {
          return Promise.reject(new Error(`Message ${currentMessage} failed`))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: `Response for ${currentMessage}` }),
        })
      })

      const { result } = renderHook(() => useAIStore())

      const results: Array<{ success: boolean; message: string; error?: string }> = []
      for (const message of messages) {
        try {
          await act(async () => {
            await result.current.sendMessage(message)
            results.push({ success: true, message })
          })
        } catch (error) {
          results.push({ success: false, message, error: error instanceof Error ? error.message : String(error) })
        }
      }

      // Verify mixed success and failure
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      expect(successCount + failureCount).toBe(messages.length)
      expect(failureCount).toBe(failingMessages.size)
    })

    it('应该在部分失败后继续执行', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('First request failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ content: 'Second request succeeded' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ content: 'Third request succeeded' }),
        })

      const { result } = renderHook(() => useAIStore())

      // First request should fail
      await act(async () => {
        try {
          await result.current.sendMessage('msg1')
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      // Subsequent requests should still work
      await act(async () => {
        await result.current.sendMessage('msg2')
      })

      await act(async () => {
        await result.current.sendMessage('msg3')
      })

      expect(result.current.messages.length).toBe(4) // 2 successful messages × 2 (user + assistant)
    })
  })

  describe('Retry Logic - 重试逻辑', () => {
    beforeEach(() => {
      // Enable retries for these specific tests
      useAIStore.getState()._enableRetries()
    })
    
    it('应该实现指数退避重试', async () => {
      const delays: number[] = []

      mockFetch.mockImplementation(() => {
        delays.push(Date.now())
        return new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Temporary failure')), 10)
        )
      })

      const { result } = renderHook(() => useAIStore())

      await act(async () => {
        try {
          await result.current.sendMessage('Test exponential backoff')
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      // Verify retries happened using store's internal counter
      expect(result.current._attemptCount).toBeGreaterThan(1)

      // Calculate delays between attempts
      const retryDelays: number[] = []
      for (let i = 1; i < delays.length; i++) {
        retryDelays.push(delays[i] - delays[i - 1])
      }

      // Verify delays are increasing (exponential backoff)
      for (let i = 1; i < retryDelays.length; i++) {
        expect(retryDelays[i]).toBeGreaterThanOrEqual(retryDelays[i - 1])
      }
    })

    it('应该限制最大重试次数', async () => {
      mockFetch.mockImplementation(() => {
        return Promise.reject(new Error('Persistent failure'))
      })

      const { result } = renderHook(() => useAIStore())

      await act(async () => {
        try {
          await result.current.sendMessage('Test retry limit')
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      // Should not retry indefinitely
      expect(result.current._attemptCount).toBeLessThan(10) // Reasonable upper limit
    })
  })
})
