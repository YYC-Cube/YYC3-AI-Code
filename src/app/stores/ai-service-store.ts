/**
 * @file ai-service-store.ts
 * @description AI 服务层 store — 多服务商管理、模型选择、性能指标、成本追踪、缓存与限流
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai-service, providers, models, performance, cost
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'

const log = createLogger('AIServiceStore')

// ============================================
// Types (aligned with Guidelines AIServiceConfig)
// ============================================

export interface AIProviderConfig {
  id: string
  name: string
  displayName: string
  type: 'cloud' | 'local'
  baseURL: string
  apiKey: string
  apiKeyURL?: string
  region?: string
  models: AIModelConfig[]
  enabled: boolean
  priority: number
  rateLimit?: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
  pricing?: {
    inputPrice: number
    outputPrice: number
    currency: string
  }
}

export interface AIModelConfig {
  id: string
  name: string
  displayName: string
  type: 'chat' | 'embedding' | 'fine-tune' | 'image' | 'audio'
  contextLength: number
  maxTokens: number
  enabled: boolean
  parameters: {
    temperature: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
  }
  capabilities: string[]
  benchmark?: {
    latency: number
    throughput: number
    accuracy: number
  }
}

export interface PerformanceMetric {
  providerId: string
  modelId: string
  timestamp: number
  latency: number
  throughput: number
  successRate: number
  errorCount: number
  totalRequests: number
}

export interface CostEntry {
  providerId: string
  modelId: string
  inputTokens: number
  outputTokens: number
  cost: number
  currency: string
}

export interface ErrorRecord {
  providerId: string
  modelId: string
  errorType: 'network' | 'api' | 'rate_limit' | 'authentication' | 'unknown'
  errorMessage: string
  timestamp: number
  count: number
  suggestions: string[]
}

// ============================================
// Preset Providers (from Guidelines)
// ============================================

export const PRESET_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    type: 'cloud',
    baseURL: 'https://api.openai.com/v1',
    apiKey: '',
    apiKeyURL: 'https://platform.openai.com/api-keys',
    models: [
      {
        id: 'gpt-4-turbo-preview', name: 'gpt-4-turbo-preview', displayName: 'GPT-4 Turbo',
        type: 'chat', contextLength: 128000, maxTokens: 4096, enabled: true,
        parameters: { temperature: 0.7, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code', 'reasoning'],
        benchmark: { latency: 1500, throughput: 50, accuracy: 0.95 },
      },
      {
        id: 'gpt-4o', name: 'gpt-4o', displayName: 'GPT-4o',
        type: 'chat', contextLength: 128000, maxTokens: 4096, enabled: true,
        parameters: { temperature: 0.7, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
        benchmark: { latency: 800, throughput: 80, accuracy: 0.96 },
      },
      {
        id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo',
        type: 'chat', contextLength: 16385, maxTokens: 4096, enabled: true,
        parameters: { temperature: 0.7, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code'],
        benchmark: { latency: 800, throughput: 100, accuracy: 0.90 },
      },
    ],
    enabled: true, priority: 1,
    rateLimit: { requestsPerMinute: 3500, tokensPerMinute: 90000 },
    pricing: { inputPrice: 0.01, outputPrice: 0.03, currency: 'USD' },
  },
  {
    id: 'anthropic',
    name: 'anthropic',
    displayName: 'Anthropic',
    type: 'cloud',
    baseURL: 'https://api.anthropic.com/v1',
    apiKey: '',
    apiKeyURL: 'https://console.anthropic.com/settings/keys',
    models: [
      {
        id: 'claude-3-opus', name: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus',
        type: 'chat', contextLength: 200000, maxTokens: 4096, enabled: true,
        parameters: { temperature: 0.7, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code', 'reasoning', 'analysis'],
        benchmark: { latency: 2000, throughput: 40, accuracy: 0.97 },
      },
      {
        id: 'claude-3.5-sonnet', name: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet',
        type: 'chat', contextLength: 200000, maxTokens: 8192, enabled: true,
        parameters: { temperature: 0.7, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code', 'reasoning', 'analysis'],
        benchmark: { latency: 1200, throughput: 60, accuracy: 0.96 },
      },
    ],
    enabled: true, priority: 2,
    rateLimit: { requestsPerMinute: 50, tokensPerMinute: 40000 },
    pricing: { inputPrice: 0.015, outputPrice: 0.075, currency: 'USD' },
  },
  {
    id: 'zhipuai',
    name: 'zhipuai',
    displayName: '\u667a\u8c31 AI',
    type: 'cloud',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '',
    apiKeyURL: 'https://open.bigmodel.cn/usercenter/apikeys',
    region: 'cn',
    models: [
      {
        id: 'glm-4', name: 'glm-4', displayName: 'GLM-4',
        type: 'chat', contextLength: 128000, maxTokens: 8192, enabled: true,
        parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code', 'reasoning'],
        benchmark: { latency: 1000, throughput: 70, accuracy: 0.92 },
      },
      {
        id: 'glm-4-flash', name: 'glm-4-flash', displayName: 'GLM-4 Flash',
        type: 'chat', contextLength: 128000, maxTokens: 8192, enabled: true,
        parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code'],
        benchmark: { latency: 500, throughput: 120, accuracy: 0.88 },
      },
    ],
    enabled: true, priority: 3,
    rateLimit: { requestsPerMinute: 100, tokensPerMinute: 50000 },
    pricing: { inputPrice: 0.0001, outputPrice: 0.0001, currency: 'CNY' },
  },
  {
    id: 'baidu',
    name: 'baidu',
    displayName: '\u767e\u5ea6\u6587\u5fc3',
    type: 'cloud',
    baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    apiKey: '',
    apiKeyURL: 'https://console.bce.baidu.com/qianfan/ais/console/application/list',
    region: 'cn',
    models: [
      {
        id: 'ernie-4.0-8k', name: 'ernie-4.0-8k', displayName: 'ERNIE-4.0-8K',
        type: 'chat', contextLength: 8192, maxTokens: 4096, enabled: true,
        parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code', 'reasoning'],
        benchmark: { latency: 1200, throughput: 65, accuracy: 0.91 },
      },
    ],
    enabled: true, priority: 4,
    rateLimit: { requestsPerMinute: 50, tokensPerMinute: 30000 },
    pricing: { inputPrice: 0.00012, outputPrice: 0.00012, currency: 'CNY' },
  },
  {
    id: 'aliyun',
    name: 'aliyun',
    displayName: '\u963f\u91cc\u901a\u4e49',
    type: 'cloud',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    apiKeyURL: 'https://dashscope.console.aliyun.com/apiKey',
    region: 'cn',
    models: [
      {
        id: 'qwen-turbo', name: 'qwen-turbo', displayName: 'Qwen Turbo',
        type: 'chat', contextLength: 8192, maxTokens: 4096, enabled: true,
        parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code'],
        benchmark: { latency: 600, throughput: 100, accuracy: 0.90 },
      },
      {
        id: 'qwen-max', name: 'qwen-max', displayName: 'Qwen Max',
        type: 'chat', contextLength: 32768, maxTokens: 8192, enabled: true,
        parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code', 'reasoning', 'analysis'],
        benchmark: { latency: 1500, throughput: 55, accuracy: 0.95 },
      },
    ],
    enabled: true, priority: 5,
    rateLimit: { requestsPerMinute: 100, tokensPerMinute: 60000 },
    pricing: { inputPrice: 0.00008, outputPrice: 0.00008, currency: 'CNY' },
  },
  {
    id: 'ollama',
    name: 'ollama',
    displayName: 'Ollama (\u672c\u5730)',
    type: 'local',
    baseURL: 'http://localhost:11434',
    apiKey: 'ollama',
    models: [
      {
        id: 'llama2', name: 'llama2', displayName: 'Llama 2',
        type: 'chat', contextLength: 4096, maxTokens: 2048, enabled: true,
        parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code'],
        benchmark: { latency: 3000, throughput: 20, accuracy: 0.85 },
      },
      {
        id: 'mistral', name: 'mistral', displayName: 'Mistral',
        type: 'chat', contextLength: 8192, maxTokens: 4096, enabled: true,
        parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code', 'reasoning'],
        benchmark: { latency: 2000, throughput: 30, accuracy: 0.88 },
      },
      {
        id: 'codellama', name: 'codellama', displayName: 'Code Llama',
        type: 'chat', contextLength: 16384, maxTokens: 4096, enabled: true,
        parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
        capabilities: ['chat', 'code'],
        benchmark: { latency: 2500, throughput: 25, accuracy: 0.90 },
      },
    ],
    enabled: true, priority: 10,
    pricing: { inputPrice: 0, outputPrice: 0, currency: 'USD' },
  },
]

// ============================================
// Store
// ============================================

interface AIServiceState {
  providers: AIProviderConfig[]
  activeProviderId: string
  activeModelId: string

  // Performance & cost
  perfMetrics: PerformanceMetric[]
  costEntries: CostEntry[]
  errorRecords: ErrorRecord[]

  // Cache config
  cacheEnabled: boolean
  rateLimitEnabled: boolean
  autoSelectEnabled: boolean

  // Provider CRUD
  addProvider: (provider: AIProviderConfig) => void
  updateProvider: (id: string, updates: Partial<AIProviderConfig>) => void
  removeProvider: (id: string) => void
  toggleProvider: (id: string) => void
  setProviderApiKey: (id: string, apiKey: string) => void
  resetProviders: () => void

  // Model CRUD
  addModel: (providerId: string, model: AIModelConfig) => void
  updateModel: (providerId: string, modelId: string, updates: Partial<AIModelConfig>) => void
  removeModel: (providerId: string, modelId: string) => void
  toggleModel: (providerId: string, modelId: string) => void

  // Active selection
  setActiveProvider: (providerId: string) => void
  setActiveModel: (modelId: string) => void
  setActiveProviderAndModel: (providerId: string, modelId: string) => void

  // Derived getters
  getActiveProvider: () => AIProviderConfig | undefined
  getActiveModel: () => AIModelConfig | undefined
  getEnabledProviders: () => AIProviderConfig[]
  getAllModels: () => { provider: AIProviderConfig; model: AIModelConfig }[]

  // Performance tracking (mock)
  recordMetric: (metric: Omit<PerformanceMetric, 'timestamp'>) => void
  recordCost: (entry: CostEntry) => void
  recordError: (record: Omit<ErrorRecord, 'timestamp' | 'count' | 'suggestions'>) => void
  clearMetrics: () => void

  // Benchmark
  getBenchmarkComparison: () => {
    providerId: string; providerName: string
    modelId: string; modelName: string
    latency: number; throughput: number; accuracy: number
    price: string
  }[]
}

export const useAIServiceStore = create<AIServiceState>()(
  persist(
    (set, get) => ({
      providers: JSON.parse(JSON.stringify(PRESET_PROVIDERS)),
      activeProviderId: 'zhipu',
      activeModelId: 'glm-4',
      perfMetrics: [],
      costEntries: [],
      errorRecords: [],
      cacheEnabled: true,
      rateLimitEnabled: true,
      autoSelectEnabled: false,

      // ── Provider CRUD ──

      addProvider: (provider) => {
        set(s => {
          const updated = [...s.providers, provider]
          log.info(`Provider added: ${provider.displayName}`)
          return { providers: updated }
        })
      },

      updateProvider: (id, updates) => {
        set(s => {
          const updated = s.providers.map(p => p.id === id ? { ...p, ...updates } : p)
          return { providers: updated }
        })
      },

      removeProvider: (id) => {
        set(s => {
          const updated = s.providers.filter(p => p.id !== id)
          const activeProviderId = s.activeProviderId === id
            ? (updated[0]?.id || 'zhipu')
            : s.activeProviderId
          log.info(`Provider removed: ${id}`)
          return { providers: updated, activeProviderId }
        })
      },

      toggleProvider: (id) => {
        set(s => {
          const updated = s.providers.map(p =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
          )
          return { providers: updated }
        })
      },

      setProviderApiKey: (id, apiKey) => {
        set(s => {
          const updated = s.providers.map(p =>
            p.id === id ? { ...p, apiKey } : p
          )
          log.debug(`API key updated for provider: ${id}`)
          return { providers: updated }
        })
      },

      resetProviders: () => {
        const fresh = JSON.parse(JSON.stringify(PRESET_PROVIDERS))
        log.info('Providers reset to defaults')
        set({ providers: fresh })
      },

      // ── Model CRUD ──

      addModel: (providerId, model) => {
        set(s => {
          const updated = s.providers.map(p => {
            if (p.id !== providerId) {return p}
            return { ...p, models: [...p.models, model] }
          })
          return { providers: updated }
        })
      },

      updateModel: (providerId, modelId, updates) => {
        set(s => {
          const updated = s.providers.map(p => {
            if (p.id !== providerId) {return p}
            return {
              ...p,
              models: p.models.map(m => m.id === modelId ? { ...m, ...updates } : m),
            }
          })
          return { providers: updated }
        })
      },

      removeModel: (providerId, modelId) => {
        set(s => {
          const updated = s.providers.map(p => {
            if (p.id !== providerId) {return p}
            return { ...p, models: p.models.filter(m => m.id !== modelId) }
          })
          return { providers: updated }
        })
      },

      toggleModel: (providerId, modelId) => {
        set(s => {
          const updated = s.providers.map(p => {
            if (p.id !== providerId) {return p}
            return {
              ...p,
              models: p.models.map(m =>
                m.id === modelId ? { ...m, enabled: !m.enabled } : m
              ),
            }
          })
          return { providers: updated }
        })
      },

      // ── Active selection ──

      setActiveProvider: (providerId) => {
        const provider = get().providers.find(p => p.id === providerId)
        const firstModel = provider?.models.find(m => m.enabled)
        const modelId = firstModel?.id || get().activeModelId
        log.info(`Active provider: ${providerId}, model: ${modelId}`)
        set({ activeProviderId: providerId, activeModelId: modelId })
      },

      setActiveModel: (modelId) => {
        set({ activeModelId: modelId })
      },

      setActiveProviderAndModel: (providerId, modelId) => {
        set({ activeProviderId: providerId, activeModelId: modelId })
      },

      // ── Derived getters ──

      getActiveProvider: () => {
        return get().providers.find(p => p.id === get().activeProviderId)
      },

      getActiveModel: () => {
        const provider = get().getActiveProvider()
        return provider?.models.find(m => m.id === get().activeModelId)
      },

      getEnabledProviders: () => {
        return get().providers.filter(p => p.enabled)
      },

      getAllModels: () => {
        const result: { provider: AIProviderConfig; model: AIModelConfig }[] = []
        for (const provider of get().providers) {
          if (!provider.enabled) {continue}
          for (const model of provider.models) {
            if (model.enabled) {result.push({ provider, model })}
          }
        }
        return result
      },

      // ── Performance tracking ──

      recordMetric: (metric) => {
        set(s => ({
          perfMetrics: [...s.perfMetrics.slice(-199), { ...metric, timestamp: Date.now() }],
        }))
      },

      recordCost: (entry) => {
        set(s => ({
          costEntries: [...s.costEntries.slice(-499), entry],
        }))
      },

      recordError: (record) => {
        const suggestions = getErrorSuggestions(record.errorType)
        set(s => ({
          errorRecords: [...s.errorRecords.slice(-99), {
            ...record, timestamp: Date.now(), count: 1, suggestions,
          }],
        }))
      },

      clearMetrics: () => {
        set({ perfMetrics: [], costEntries: [], errorRecords: [] })
      },

      // ── Benchmark comparison ──

      getBenchmarkComparison: () => {
        const result: {
          providerId: string; providerName: string
          modelId: string; modelName: string
          latency: number; throughput: number; accuracy: number
          price: string
        }[] = []

        for (const provider of get().providers) {
          if (!provider.enabled) {continue}
          for (const model of provider.models) {
            if (!model.enabled || model.type !== 'chat' || !model.benchmark) {continue}
            const price = provider.pricing
              ? `${provider.pricing.inputPrice}/${provider.pricing.outputPrice} ${provider.pricing.currency}`
              : 'Free'
            result.push({
              providerId: provider.id,
              providerName: provider.displayName,
              modelId: model.id,
              modelName: model.displayName,
              latency: model.benchmark.latency,
              throughput: model.benchmark.throughput,
              accuracy: model.benchmark.accuracy,
              price,
            })
          }
        }

        return result.sort((a, b) => b.accuracy - a.accuracy)
      },
    }),
    {
      name: 'yyc3_ai_store',
      partialize: (state) => ({
        providers: state.providers,
        activeProviderId: state.activeProviderId,
        activeModelId: state.activeModelId,
      }),
      merge: (persisted: any, current) => {
        if (!persisted) {return current}
        return {
          ...current,
          providers: persisted.providers?.length ? persisted.providers : current.providers,
          activeProviderId: persisted.activeProviderId || current.activeProviderId,
          activeModelId: persisted.activeModelId || current.activeModelId,
        }
      },
    }
  )
)

// ============================================
// Error suggestions helper
// ============================================

function getErrorSuggestions(errorType: ErrorRecord['errorType']): string[] {
  const map: Record<string, string[]> = {
    network: ['检查网络连接', '确认 API 服务是否正常', '尝试 VPN 或代理', '检查防火墙设置'],
    api: ['检查请求参数', '确认模型名称有效', '查看 API 文档'],
    rate_limit: ['降低请求频率', '升级 API 计划', '增加请求间隔'],
    authentication: ['检查 API Key 是否正确', '确认 API Key 已激活', '重新生成 API Key'],
    unknown: ['查看完整错误日志', '联系服务商支持'],
  }
  return map[errorType] || map.unknown
}