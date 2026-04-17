import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useHeartbeatStore } from '@/app/stores/heartbeat-store'

const mockAIModel = {
  id: 'test-model-1',
  name: 'Test Model',
  provider: 'ollama' as const,
  endpoint: 'http://localhost:11434/api/chat',
  apiKey: '',
  enabled: true,
  isActive: true,
}

const mockZhipuModel = {
  id: 'zhipu-model-1',
  name: 'Zhipu GLM-4',
  provider: 'zhipu' as const,
  endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  apiKey: 'test-api-key',
  enabled: true,
  isActive: true,
}

describe('HeartbeatStore - 初始化与状态', () => {
  beforeEach(() => {
    useHeartbeatStore.setState({
      heartbeats: {},
      isRunning: false,
      intervalId: null,
    })
  })

  it('应该有正确的初始状态', () => {
    const state = useHeartbeatStore.getState()
    
    expect(state.heartbeats).toEqual({})
    expect(state.isRunning).toBe(false)
    expect(state.intervalId).toBeNull()
  })

  it('getHeartbeat对于不存在的模型返回null', () => {
    const { getHeartbeat } = useHeartbeatStore.getState()
    
    expect(getHeartbeat('nonexistent')).toBeNull()
  })
})

describe('HeartbeatStore - 心跳管理', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useHeartbeatStore.setState({
      heartbeats: {},
      isRunning: false,
      intervalId: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    const state = useHeartbeatStore.getState()
    if (state.intervalId) {
      clearInterval(state.intervalId)
    }
  })

  describe('startHeartbeat / stopHeartbeat', () => {
    it('startHeartbeat应该启动心跳监控', () => {
      const { startHeartbeat } = useHeartbeatStore.getState()
      
      startHeartbeat()
      
      expect(useHeartbeatStore.getState().isRunning).toBe(true)
      expect(useHeartbeatStore.getState().intervalId).not.toBeNull()
    })

    it('重复调用startHeartbeat不应该创建多个定时器', () => {
      const { startHeartbeat, stopHeartbeat } = useHeartbeatStore.getState()
      
      startHeartbeat()
      const firstIntervalId = useHeartbeatStore.getState().intervalId
      
      startHeartbeat()
      const secondIntervalId = useHeartbeatStore.getState().intervalId
      
      expect(firstIntervalId).toBe(secondIntervalId)
      
      stopHeartbeat()
    })

    it('stopHeartbeat应该停止心跳监控', () => {
      const { startHeartbeat, stopHeartbeat } = useHeartbeatStore.getState()
      
      startHeartbeat()
      stopHeartbeat()
      
      expect(useHeartbeatStore.getState().isRunning).toBe(false)
      expect(useHeartbeatStore.getState().intervalId).toBeNull()
    })

    it('stopHeartbeat在没有运行时不应报错', () => {
      const { stopHeartbeat } = useHeartbeatStore.getState()
      
      expect(() => stopHeartbeat()).not.toThrow()
      expect(useHeartbeatStore.getState().isRunning).toBe(false)
    })
  })

  describe('setHeartbeatInterval', () => {
    it('应该更新心跳间隔', () => {
      const { setHeartbeatInterval } = useHeartbeatStore.getState()
      
      setHeartbeatInterval(60000)
      
      expect(() => setHeartbeatInterval(60000)).not.toThrow()
    })
  })
})

describe('HeartbeatStore - 模型Ping操作', () => {
  beforeEach(() => {
    useHeartbeatStore.setState({
      heartbeats: {},
      isRunning: false,
      intervalId: null,
    })
  })

  describe('getHeartbeat / clearHeartbeat', () => {
    it('应该能够获取已设置的心跳信息', () => {
      const { getHeartbeat } = useHeartbeatStore.getState()
      
      useHeartbeatStore.setState({
        heartbeats: {
          'model-1': {
            modelId: 'model-1',
            status: 'online',
            latency: 120,
            lastCheck: Date.now(),
            consecutiveFailures: 0,
          },
        },
      })
      
      const heartbeat = getHeartbeat('model-1')
      expect(heartbeat).toBeDefined()
      expect(heartbeat?.status).toBe('online')
      expect(heartbeat?.latency).toBe(120)
    })

    it('clearHeartbeat应该移除指定模型的心跳信息', () => {
      const { clearHeartbeat, getHeartbeat } = useHeartbeatStore.getState()
      
      useHeartbeatStore.setState({
        heartbeats: {
          'model-1': {
            modelId: 'model-1',
            status: 'online',
            latency: 100,
            lastCheck: Date.now(),
            consecutiveFailures: 0,
          },
          'model-2': {
            modelId: 'model-2',
            status: 'offline',
            latency: null,
            lastCheck: Date.now(),
            consecutiveFailures: 3,
          },
        },
      })
      
      clearHeartbeat('model-1')
      
      expect(getHeartbeat('model-1')).toBeNull()
      expect(getHeartbeat('model-2')).toBeDefined()
    })

    it('clearHeartbeat对于不存在的ID不应报错', () => {
      const { clearHeartbeat } = useHeartbeatStore.getState()
      
      expect(() => clearHeartbeat('nonexistent')).not.toThrow()
    })
  })

  describe('pingModel - 状态转换', () => {
    it('pingModel应该更新心跳状态为checking', async () => {
      const { pingModel, getHeartbeat } = useHeartbeatStore.getState()
      
      const pingPromise = pingModel(mockAIModel)
      
      const heartbeatAfterStart = getHeartbeat(mockAIModel.id)
      expect(heartbeatAfterStart?.status).toBe('checking')
      
      await pingPromise
    })

    it('成功ping后状态应为online', async () => {
      window.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'Test Model' }] }),
      })
      
      const { pingModel, getHeartbeat } = useHeartbeatStore.getState()
      
      await pingModel(mockAIModel)
      
      const heartbeat = getHeartbeat(mockAIModel.id)
      expect(heartbeat?.status).toBe('online')
      expect(heartbeat?.latency).toBeGreaterThanOrEqual(0)
    })

    it('失败ping后应增加consecutiveFailures', async () => {
      window.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))
      
      const { pingModel, getHeartbeat } = useHeartbeatStore.getState()
      
      await pingModel(mockAIModel)
      
      const heartbeat = getHeartbeat(mockAIModel.id)
      expect(heartbeat?.consecutiveFailures).toBeGreaterThan(0)
    })

    it('连续失败达到阈值后应标记为offline', async () => {
      window.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      
      const { pingModel, getHeartbeat } = useHeartbeatStore.getState()
      
      for (let i = 0; i < 3; i++) {
        await pingModel(mockAIModel)
      }
      
      const heartbeat = getHeartbeat(mockAIModel.id)
      expect(heartbeat?.status).toBe('offline')
      expect(heartbeat?.consecutiveFailures).toBeGreaterThanOrEqual(3)
    })

    it('offline状态的模型不再重复ping', async () => {
      window.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      
      const { pingModel, getHeartbeat } = useHeartbeatStore.getState()
      
      for (let i = 0; i < 4; i++) {
        await pingModel(mockAIModel)
      }
      
      const callCount = (window.fetch as any).mock.calls.length
      expect(callCount).toBeLessThanOrEqual(3)
    })
  })

  describe('pingModel - 不同provider处理', () => {
    it('没有API key的非Ollama模型直接返回失败', async () => {
      const noKeyModel = {
        ...mockAIModel,
        id: 'no-key-model',
        provider: 'custom' as const,
        apiKey: '',
      }
      
      window.fetch = vi.fn()
      
      const { pingModel, getHeartbeat } = useHeartbeatStore.getState()
      
      await pingModel(noKeyModel)
      
      expect(window.fetch).not.toHaveBeenCalled()
      
      const heartbeat = getHeartbeat(noKeyModel.id)
      expect(heartbeat?.status).not.toBe('online')
    })

    it('Ollama模型即使没有API key也应该尝试连接', async () => {
      window.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'Test Model' }] }),
      })
      
      const { pingModel, getHeartbeat } = useHeartbeatStore.getState()
      
      await pingModel(mockAIModel)
      
      expect(window.fetch).toHaveBeenCalled()
    })
  })
})

describe('HeartbeatStore - 边界情况', () => {
  beforeEach(() => {
    useHeartbeatStore.setState({
      heartbeats: {},
      isRunning: false,
      intervalId: null,
    })
  })

  it('应该正确处理多个模型的心跳', () => {
    const { getHeartbeat } = useHeartbeatStore.getState()
    
    useHeartbeatStore.setState({
      heartbeats: {
        'model-a': {
          modelId: 'model-a',
          status: 'online',
          latency: 50,
          lastCheck: Date.now(),
          consecutiveFailures: 0,
        },
        'model-b': {
          modelId: 'model-b',
          status: 'offline',
          latency: null,
          lastCheck: Date.now() - 60000,
          consecutiveFailures: 5,
        },
        'model-c': {
          modelId: 'model-c',
          status: 'checking',
          latency: null,
          lastCheck: Date.now(),
          consecutiveFailures: 1,
        },
      },
    })
    
    expect(getHeartbeat('model-a')?.status).toBe('online')
    expect(getHeartbeat('model-b')?.status).toBe('offline')
    expect(getHeartbeat('model-c')?.status).toBe('checking')
    expect(getHeartbeat('nonexistent')).toBeNull()
  })

  it('清除所有心跳后应该为空对象', () => {
    const { clearHeartbeat } = useHeartbeatStore.getState()
    
    useHeartbeatStore.setState({
      heartbeats: {
        'model-1': {
          modelId: 'model-1',
          status: 'online',
          latency: 100,
          lastCheck: Date.now(),
          consecutiveFailures: 0,
        },
      },
    })
    
    clearHeartbeat('model-1')
    
    expect(Object.keys(useHeartbeatStore.getState().heartbeats).length).toBe(0)
  })
})
