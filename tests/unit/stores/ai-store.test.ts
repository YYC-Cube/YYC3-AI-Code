/**
 * @file ai-store.test.ts
 * @description AI Store 全面单元测试 — 覆盖消息发送、错误处理、重试机制、批量操作
 * @author YYC³ QA Team
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('AIStore - 消息管理系统', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    const { useAIStore } = await import('@/app/stores/ai-store')
    useAIStore.getState().clearMessages()
  })

  it('应该正确初始化状态', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')
    const store = useAIStore.getState()

    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.messages).toHaveLength(0)
    expect(store.isStreaming).toBe(false)
    expect(store._attemptCount).toBe(0)
    expect(store.retryConfig.maxRetries).toBe(3)
    expect(store.retryConfig.baseDelay).toBe(1000)
    expect(store.retryConfig.maxDelay).toBe(10000)
  })

  it('应该能够清除所有消息', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')
    const store = useAIStore.getState()

    store.setError(new Error('test error'))
    
    store.clearMessages()
    
    expect(useAIStore.getState().messages).toHaveLength(0)
    expect(useAIStore.getState().error).toBeNull()
  })
})

describe('AIStore - 消息发送功能', () => {
  let originalFetch: typeof fetch

  beforeEach(async () => {
    vi.clearAllMocks()
    originalFetch = window.fetch
    
    const { useAIStore } = await import('@/app/stores/ai-store')
    useAIStore.getState()._disableRetries()
    useAIStore.getState().clearMessages()
  })

  afterEach(() => {
    window.fetch = originalFetch
  })

  it('应该成功发送消息并接收响应', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ content: 'Hello from AI!' }),
    })

    await useAIStore.getState().sendMessage('Test message')

    const state = useAIStore.getState()
    expect(state.messages).toHaveLength(2) // user + assistant
    expect(state.messages[0].role).toBe('user')
    expect(state.messages[0].content).toBe('Test message')
    expect(state.messages[1].role).toBe('assistant')
    expect(state.messages[1].content).toBe('Hello from AI!')
    expect(state.isLoading).toBe(false)
    expect(state.isStreaming).toBe(false)
    expect(state.error).toBeNull()
  })

  it('应该在发送时设置loading和streaming状态', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    let resolvePromise: (value: any) => void
    window.fetch = vi.fn().mockImplementation(() => 
      new Promise(resolve => { resolvePromise = resolve })
    )

    const sendPromise = useAIStore.getState().sendMessage('async test')

    expect(useAIStore.getState().isLoading).toBe(true)
    expect(useAIStore.getState().isStreaming).toBe(true)

    resolvePromise!({
      ok: true,
      json: async () => ({ content: 'Response' }),
    })

    await sendPromise

    expect(useAIStore.getState().isLoading).toBe(false)
    expect(useAIStore.getState().isStreaming).toBe(false)
  })

  it('应该为每条消息生成唯一ID', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Response' }),
    })

    await useAIStore.getState().sendMessage('Message 1')
    
    const stateAfterFirst = useAIStore.getState()
    
    expect(stateAfterFirst.messages).toHaveLength(2) // user + assistant
    expect(stateAfterFirst.messages[0].id).toBeDefined()
    expect(stateAfterFirst.messages[1].id).toBeDefined()
    expect(stateAfterFirst.messages[0].id).not.toBe(stateAfterFirst.messages[1].id)
  })

  it('应该记录消息时间戳', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')
    const beforeTime = Date.now()

    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Response' }),
    })

    await useAIStore.getState().sendMessage('Timestamp test')

    const state = useAIStore.getState()
    const afterTime = Date.now()

    for (const msg of state.messages) {
      expect(msg.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(msg.timestamp).toBeLessThanOrEqual(afterTime)
    }
  })
})

describe('AIStore - 错误处理', () => {
  let originalFetch: typeof fetch

  beforeEach(async () => {
    vi.clearAllMocks()
    originalFetch = window.fetch
    
    const { useAIStore } = await import('@/app/stores/ai-store')
    useAIStore.getState()._disableRetries() // 禁用重试以加快测试速度
    useAIStore.getState().clearMessages()
  })

  afterEach(() => {
    window.fetch = originalFetch
  })

  it('应该处理HTTP 429错误（速率限制）', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    })

    try {
      await useAIStore.getState().sendMessage('rate limit test')
      expect(true).toBe(false) // 不应到达这里
    } catch (error) {
      expect(error).toBeDefined()
      expect(error instanceof Error).toBe(true)
      expect((error as Error).message).toContain('Rate limit exceeded')
      expect((error as Error).message).toContain('429')
    }

    const state = useAIStore.getState()
    expect(state.error).not.toBeNull()
    expect(state.error!.message).toContain('Rate limit')
    expect(state.isLoading).toBe(false)
  })

  it('应该处理HTTP 401错误（未授权）', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    try {
      await useAIStore.getState().sendMessage('auth test')
      expect(true).toBe(false) // 不应到达这里
    } catch (error) {
      expect((error as Error).message).toContain('Unauthorized')
      expect((error as Error).message).toContain('401')
    }

    expect(useAIStore.getState().error!.message).toContain('Unauthorized')
  })

  it('应该处理HTTP 500+服务器错误', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    try {
      await useAIStore.getState().sendMessage('server error test')
      expect(true).toBe(false) // 不应到达这里
    } catch (error) {
      expect((error as Error).message).toContain('Server error')
      expect((error as Error).message).toContain('500')
    }
  })

  it('应该处理网络错误（离线状态）', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')
    
    Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true })

    try {
      await useAIStore.getState().sendMessage('offline test')
      expect(true).toBe(false) // 不应到达这里
    } catch (error) {
      expect((error as Error).message).toContain('offline')
    }

    expect(useAIStore.getState().error!.message).toContain('offline')
    
    Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true })
  })

  it('应该手动设置错误状态', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    const testError = new Error('Manual error test')
    useAIStore.getState().setError(testError)

    expect(useAIStore.getState().error).toBe(testError)
    expect(useAIStore.getState().error!.message).toBe('Manual error test')
  })

  it('应该能够清除错误状态', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    useAIStore.getState().setError(new Error('Existing error'))
    expect(useAIStore.getState().error).not.toBeNull()

    useAIStore.getState().setError(null)
    expect(useAIStore.getState().error).toBeNull()
  })
})

describe('AIStore - 重试机制配置', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    const { useAIStore } = await import('@/app/stores/ai-store')
    useAIStore.getState().clearMessages()
  })

  it('应该能够自定义重试配置', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    useAIStore.getState().setRetryConfig({
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 20000,
    })

    const config = useAIStore.getState().retryConfig
    expect(config.maxRetries).toBe(5)
    expect(config.baseDelay).toBe(2000)
    expect(config.maxDelay).toBe(20000)
  })

  it('应该能够禁用和启用重试', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    expect(useAIStore.getState().retryConfig.maxRetries).toBeGreaterThan(0)

    useAIStore.getState()._disableRetries()
    expect(useAIStore.getState().retryConfig.maxRetries).toBe(0)

    useAIStore.getState()._enableRetries()
    expect(useAIStore.getState().retryConfig.maxRetries).toBe(3)
  })

  it('应该能够重置尝试计数器', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    const initialCount = useAIStore.getState()._attemptCount
    useAIStore.setState(s => ({ _attemptCount: s._attemptCount + 5 }))
    
    expect(useAIStore.getState()._attemptCount).toBe(initialCount + 5)

    useAIStore.getState()._resetAttemptCount()
    expect(useAIStore.getState()._attemptCount).toBe(0)
  })

  it('应该在单次失败后设置错误（禁用重试时）', async () => {
    let originalFetch = window.fetch
    
    const { useAIStore } = await import('@/app/stores/ai-store')
    useAIStore.getState()._disableRetries()

    window.fetch = vi.fn().mockRejectedValueOnce(new Error('Immediate failure'))

    try {
      await useAIStore.getState().sendMessage('no retry test')
      expect(true).toBe(false) // 不应到达这里
    } catch (error) {
      expect(error).toBeDefined()
      expect((error as Error).message).toContain('Immediate failure')
    }

    expect(useAIStore.getState().error).not.toBeNull()
    expect(useAIStore.getState().isLoading).toBe(false)
    expect(useAIStore.getState().isStreaming).toBe(false)
    
    window.fetch = originalFetch
  })
})

describe('AIStore - 批量消息发送', () => {
  let originalFetch: typeof fetch

  beforeEach(async () => {
    vi.clearAllMocks()
    originalFetch = window.fetch
    
    const { useAIStore } = await import('@/app/stores/ai-store')
    useAIStore.getState()._disableRetries()
    useAIStore.getState().clearMessages()
  })

  afterEach(() => {
    window.fetch = originalFetch
  })

  it('应该成功发送多条消息', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'OK' }),
    })

    const results = await useAIStore.getState().sendBatchMessages([
      'Message 1',
      'Message 2',
      'Message 3',
    ])

    expect(results).toHaveLength(3)
    expect(results.every(r => r.success)).toBe(true)
    expect(window.fetch).toHaveBeenCalledTimes(3)
  })

  it('应该在部分失败时继续发送剩余消息', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'OK' }) })
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'OK' }) })

    const results = await useAIStore.getState().sendBatchMessages([
      'Success msg',
      'Fail msg',
      'Another success',
    ])

    expect(results).toHaveLength(3)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(false)
    expect(results[1].error).toBeDefined()
    expect(results[2].success).toBe(true)
  })

  it('应该返回包含错误信息的失败结果', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'))

    const results = await useAIStore.getState().sendBatchMessages(['Failing message'])

    expect(results[0].success).toBe(false)
    expect(results[0].message).toBe('Failing message')
    expect(results[0].error).toBe('Network timeout')
  })

  it('应该处理空消息数组', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    const results = await useAIStore.getState().sendBatchMessages([])

    expect(results).toHaveLength(0)
  })
})

describe('AIStore - Loading状态管理', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    const { useAIStore } = await import('@/app/stores/ai-store')
    useAIStore.getState().clearMessages()
  })

  it('应该能够手动设置loading状态', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    expect(useAIStore.getState().isLoading).toBe(false)

    useAIStore.getState().setLoading(true)
    expect(useAIStore.getState().isLoading).toBe(true)

    useAIStore.getState().setLoading(false)
    expect(useAIStore.getState().isLoading).toBe(false)
  })
})

describe('AIStore - 边界条件测试', () => {
  let originalFetch: typeof fetch

  beforeEach(async () => {
    vi.clearAllMocks()
    originalFetch = window.fetch
    
    const { useAIStore } = await import('@/app/stores/ai-store')
    useAIStore.getState()._disableRetries()
    useAIStore.getState().clearMessages()
  })

  afterEach(() => {
    window.fetch = originalFetch
  })

  it('应该处理空字符串消息', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: '' }),
    })

    await useAIStore.getState().sendMessage('')

    const state = useAIStore.getState()
    expect(state.messages[0].content).toBe('')
  })

  it('应该处理超长消息内容', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    const longContent = 'A'.repeat(100000)
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: longContent }),
    })

    await useAIStore.getState().sendMessage(longContent)

    expect(useAIStore.getState().messages[0].content.length).toBe(100000)
  })

  it('应该处理特殊字符消息', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    const specialContent = '<script>alert("xss")</script>\n"quotes"\n中文内容'
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: specialContent }),
    })

    await useAIStore.getState().sendMessage(specialContent)

    expect(useAIStore.getState().messages[0].content).toBe(specialContent)
  })

  it('应该处理API返回的不同响应格式', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Using message field' }),
    })

    await useAIStore.getState().sendMessage('format test')

    expect(useAIStore.getState().messages[1].content).toBe('Using message field')
  })

  it('应该处理API返回空对象', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    await useAIStore.getState().sendMessage('empty response')

    expect(useAIStore.getState().messages[1].content).toBe('')
  })

  it('应该只发送最近10条历史消息', async () => {
    const { useAIStore } = await import('@/app/stores/ai-store')

    window.fetch = vi.fn().mockImplementation((_url, options) => {
      const body = JSON.parse(options?.body as string)
      expect(body.history.length).toBeLessThanOrEqual(10)
      
      return Promise.resolve({
        ok: true,
        json: async () => ({ content: 'OK' }),
      })
    })

    for (let i = 0; i < 15; i++) {
      await useAIStore.getState().sendMessage(`Message ${i}`)
    }

    expect(window.fetch).toHaveBeenCalledTimes(15)
  }, 15000)
})
