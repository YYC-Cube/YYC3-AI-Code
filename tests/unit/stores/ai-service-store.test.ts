/**
 * AIServiceStore 测试
 * 验证 AI 服务层 store 的完整功能
 * 覆盖: Provider CRUD / Model CRUD / Active Selection / Performance Tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

vi.stubGlobal('localStorage', mockLocalStorage)

describe('AIServiceStore - Provider CRUD - Provider Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('应该能够导入 AIServiceStore', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    expect(useAIServiceStore).toBeDefined()
  })

  it('应该有预设的6个Provider', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    expect(store.providers.length).toBe(6)
    const providerIds = store.providers.map(p => p.id)
    expect(providerIds).toContain('openai')
    expect(providerIds).toContain('anthropic')
    expect(providerIds).toContain('zhipuai')
    expect(providerIds).toContain('baidu')
    expect(providerIds).toContain('aliyun')
    expect(providerIds).toContain('ollama')
  })

  it('应该能够添加新的 Provider', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const newProvider = {
      id: 'custom-provider',
      name: 'custom-provider',
      displayName: 'Custom Provider',
      type: 'cloud' as const,
      baseURL: 'https://api.custom.com/v1',
      apiKey: 'test-key-123',
      models: [],
      enabled: true,
      priority: 99,
    }

    store.addProvider(newProvider)

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.providers.length).toBe(7)
    expect(updatedStore.providers.find(p => p.id === 'custom-provider')).toBeDefined()
  })

  it('应该能够更新 Provider', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.updateProvider('openai', { priority: 100 })

    const updatedStore = useAIServiceStore.getState()
    const openai = updatedStore.providers.find(p => p.id === 'openai')
    expect(openai?.priority).toBe(100)
  })

  it('应该能够删除 Provider', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const initialCount = store.providers.length
    store.removeProvider('ollama')

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.providers.length).toBe(initialCount - 1)
    expect(updatedStore.providers.find(p => p.id === 'ollama')).toBeUndefined()
  })

  it('删除活跃 Provider 时应自动切换到第一个可用 Provider', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const currentActiveId = store.activeProviderId
    store.removeProvider(currentActiveId)

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.activeProviderId).not.toBe(currentActiveId)
    expect(updatedStore.providers.find(p => p.id === updatedStore.activeProviderId)).toBeDefined()
  })

  it('应该能够切换 Provider 的启用状态', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const targetId = store.providers[0]?.id
    expect(targetId).toBeTruthy()

    const targetProvider = store.providers.find(p => p.id === targetId)
    expect(targetProvider).toBeDefined()

    const initialEnabled = targetProvider?.enabled ?? true
    store.toggleProvider(targetId)

    const updatedStore = useAIServiceStore.getState()
    const toggledProvider = updatedStore.providers.find(p => p.id === targetId)
    expect(toggledProvider).toBeDefined()
    expect(toggledProvider?.enabled).toBe(!initialEnabled)
  })

  it('应该能够设置 Provider API Key', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.setProviderApiKey('openai', 'sk-new-test-key')

    const updatedStore = useAIServiceStore.getState()
    const openai = updatedStore.providers.find(p => p.id === 'openai')
    expect(openai?.apiKey).toBe('sk-new-test-key')
  })

  it('应该能够重置所有 Providers 到默认状态', async () => {
    const { useAIServiceStore, PRESET_PROVIDERS } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const initialCount = store.providers.length
    store.addProvider({ id: 'temp', name: 'temp', displayName: 'Temp', type: 'local', baseURL: '', apiKey: '', models: [], enabled: true, priority: 0 })

    const afterAddStore = useAIServiceStore.getState()
    expect(afterAddStore.providers.length).toBeGreaterThan(initialCount)

    store.resetProviders()

    const resetStore = useAIServiceStore.getState()
    expect(resetStore.providers.length).toBe(PRESET_PROVIDERS.length)
    expect(resetStore.providers.find(p => p.id === 'temp')).toBeUndefined()
  })
})

describe('AIServiceStore - Model CRUD - Model Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('应该能够为指定 Provider 添加新 Model', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const newModel = {
      id: 'gpt-5-test',
      name: 'gpt-5-test',
      displayName: 'GPT-5 Test',
      type: 'chat' as const,
      contextLength: 256000,
      maxTokens: 8192,
      enabled: true,
      parameters: { temperature: 0.7, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
      capabilities: ['chat', 'code', 'reasoning'],
    }

    store.addModel('openai', newModel)

    const updatedStore = useAIServiceStore.getState()
    const openai = updatedStore.providers.find(p => p.id === 'openai')
    expect(openai?.models.some(m => m.id === 'gpt-5-test')).toBeTruthy()
  })

  it('应该能够更新 Model 配置', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.updateModel('openai', 'gpt-4-turbo-preview', { maxTokens: 8192 })

    const updatedStore = useAIServiceStore.getState()
    const model = updatedStore.providers
      .find(p => p.id === 'openai')
      ?.models.find(m => m.id === 'gpt-4-turbo-preview')
    expect(model?.maxTokens).toBe(8192)
  })

  it('应该能够删除 Model', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const initialModels = store.providers.find(p => p.id === 'openai')?.models.length || 0
    store.removeModel('openai', 'gpt-3.5-turbo')

    const updatedStore = useAIServiceStore.getState()
    const currentModels = updatedStore.providers.find(p => p.id === 'openai')?.models.length || 0
    expect(currentModels).toBe(initialModels - 1)
  })

  it('应该能够切换 Model 的启用状态', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const initialEnabled = store.providers
      .find(p => p.id === 'openai')
      ?.models.find(m => m.id === 'gpt-4-turbo-preview')?.enabled

    store.toggleModel('openai', 'gpt-4-turbo-preview')

    const updatedStore = useAIServiceStore.getState()
    const toggledModel = updatedStore.providers
      .find(p => p.id === 'openai')
      ?.models.find(m => m.id === 'gpt-4-turbo-preview')
    expect(toggledModel?.enabled).toBe(!initialEnabled)
  })
})

describe('AIServiceStore - Active Selection - Active Provider & Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('应该有默认的活跃 Provider 和 Model', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    expect(store.activeProviderId).toBeTruthy()
    expect(store.activeModelId).toBeTruthy()
  })

  it('setActiveProvider 应该自动选择该 Provider 的第一个启用模型', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.setActiveProvider('anthropic')

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.activeProviderId).toBe('anthropic')

    const activeModel = updatedStore.getActiveModel()
    expect(activeModel).toBeDefined()
    expect(activeModel?.id).toBeTruthy()
  })

  it('setActiveModel 应该只更改活跃模型', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.setActiveModel('gpt-4o')

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.activeModelId).toBe('gpt-4o')
  })

  it('setActiveProviderAndModel 应该同时设置 Provider 和 Model', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.setActiveProviderAndModel('openai', 'gpt-4-turbo-preview')

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.activeProviderId).toBe('openai')
    expect(updatedStore.activeModelId).toBe('gpt-4-turbo-preview')
  })

  it('getActiveProvider 应该返回当前活跃的 Provider', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.setActiveProvider('openai')
    const activeProvider = store.getActiveProvider()

    expect(activeProvider).toBeDefined()
    expect(activeProvider?.id).toBe('openai')
  })

  it('getActiveModel 应该返回当前活跃的 Model', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.setActiveProviderAndModel('openai', 'gpt-4o')
    const activeModel = store.getActiveModel()

    expect(activeModel).toBeDefined()
    expect(activeModel?.id).toBe('gpt-4o')
  })

  it('getEnabledProviders 应该只返回启用的 Provider', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.toggleProvider('ollama')
    const enabledProviders = store.getEnabledProviders()

    expect(enabledProviders.every(p => p.enabled)).toBeTruthy()
    expect(enabledProviders.find(p => p.id === 'ollama')).toBeUndefined()
  })

  it('getAllModels 应该返回所有启用的 Provider 和 Model 组合', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const allModels = store.getAllModels()

    expect(allModels.length).toBeGreaterThan(0)
    allModels.forEach(({ provider, model }) => {
      expect(provider.enabled).toBeTruthy()
      expect(model.enabled).toBeTruthy()
    })
  })
})

describe('AIServiceStore - Performance Tracking - Metrics & Costs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('recordMetric 应该记录性能指标', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.recordMetric({
      providerId: 'openai',
      modelId: 'gpt-4o',
      latency: 800,
      throughput: 80,
      successRate: 0.98,
      errorCount: 0,
      totalRequests: 100,
    })

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.perfMetrics.length).toBe(1)
    expect(updatedStore.perfMetrics[0].latency).toBe(800)
    expect(updatedStore.perfMetrics[0].timestamp).toBeDefined()
  })

  it('recordMetric 应该保留最近200条记录', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    for (let i = 0; i < 250; i++) {
      store.recordMetric({
        providerId: 'test',
        modelId: 'test-model',
        latency: i,
        throughput: 10,
        successRate: 1,
        errorCount: 0,
        totalRequests: 1,
      })
    }

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.perfMetrics.length).toBe(200)
  })

  it('recordCost 应该记录成本条目', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.recordCost({
      providerId: 'openai',
      modelId: 'gpt-4o',
      inputTokens: 1000,
      outputTokens: 500,
      cost: 0.025,
      currency: 'USD',
    })

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.costEntries.length).toBe(1)
    expect(updatedStore.costEntries[0].cost).toBe(0.025)
  })

  it('recordCost 应该保留最近500条记录', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    for (let i = 0; i < 600; i++) {
      store.recordCost({
        providerId: 'test',
        modelId: 'test',
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
        currency: 'USD',
      })
    }

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.costEntries.length).toBe(500)
  })

  it('recordError 应该记录错误并生成建议', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.recordError({
      providerId: 'openai',
      modelId: 'gpt-4o',
      errorType: 'rate_limit',
      errorMessage: 'Rate limit exceeded',
    })

    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.errorRecords.length).toBe(1)
    expect(updatedStore.errorRecords[0].errorType).toBe('rate_limit')
    expect(updatedStore.errorRecords[0].suggestions.length).toBeGreaterThan(0)
    expect(updatedStore.errorRecords[0].timestamp).toBeDefined()
  })

  it('clearMetrics 应该清空所有指标数据', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.recordMetric({
      providerId: 'test', modelId: 'test',
      latency: 100, throughput: 10, successRate: 1, errorCount: 0, totalRequests: 1,
    })
    store.recordCost({ providerId: 'test', modelId: 'test', inputTokens: 100, outputTokens: 50, cost: 0.01, currency: 'USD' })
    store.recordError({ providerId: 'test', modelId: 'test', errorType: 'network', errorMessage: 'Network error' })

    store.clearMetrics()

    const clearedStore = useAIServiceStore.getState()
    expect(clearedStore.perfMetrics.length).toBe(0)
    expect(clearedStore.costEntries.length).toBe(0)
    expect(clearedStore.errorRecords.length).toBe(0)
  })
})

describe('AIServiceStore - Benchmark Comparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('getBenchmarkComparison 应该返回所有启用模型的基准对比数据', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const comparison = store.getBenchmarkComparison()

    expect(comparison.length).toBeGreaterThan(0)
    comparison.forEach(item => {
      expect(item).toHaveProperty('providerId')
      expect(item).toHaveProperty('providerName')
      expect(item).toHaveProperty('modelId')
      expect(item).toHaveProperty('modelName')
      expect(item).toHaveProperty('latency')
      expect(item).toHaveProperty('throughput')
      expect(item).toHaveProperty('accuracy')
      expect(item).toHaveProperty('price')
    })
  })

  it('禁用的模型不应出现在基准对比中', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    store.toggleModel('openai', 'gpt-3.5-turbo')

    const comparison = store.getBenchmarkComparison()
    const disabledModel = comparison.find(m => m.modelId === 'gpt-3.5-turbo')
    expect(disabledModel).toBeUndefined()
  })
})

describe('AIServiceStore - Edge Cases & Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('操作不存在的 Provider 不应报错', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    expect(() => store.updateProvider('non-existent', { priority: 999 })).not.toThrow()
    expect(() => store.removeProvider('non-existent')).not.toThrow()
    expect(() => store.toggleProvider('non-existent')).not.toThrow()
  })

  it('操作不存在的 Model 不应报错', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    expect(() => store.updateModel('openai', 'non-existent-model', {})).not.toThrow()
    expect(() => store.removeModel('openai', 'non-existent-model')).not.toThrow()
    expect(() => store.toggleModel('openai', 'non-existent-model')).not.toThrow()
  })

  it('添加重复 ID 的 Provider 应该允许（用户责任）', async () => {
    const { useAIServiceStore } = await import('@/app/stores/ai-service-store')
    const store = useAIServiceStore.getState()

    const duplicateProvider = {
      id: 'openai',
      name: 'openai-dup',
      displayName: 'OpenAI Duplicate',
      type: 'cloud' as const,
      baseURL: 'https://api.openai.com/v1',
      apiKey: '',
      models: [],
      enabled: true,
      priority: 0,
    }

    expect(() => store.addProvider(duplicateProvider)).not.toThrow()
    const updatedStore = useAIServiceStore.getState()
    expect(updatedStore.providers.filter(p => p.id === 'openai').length).toBe(2)
  })
})
