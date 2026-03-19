/**
 * @file useAIService.ts
 * @description AI 服务层 Hook — 多提供商管理、智能检测、缓存、速率限制、故障转移、成本跟踪
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,service,provider,hook,fallback,cache,rate-limit,ai-code
 */

import { useState, useCallback, useRef, useMemo } from 'react';

/* ================================================================
   Type Definitions (aligned with guidelines/YYC3-AI-Code.md)
   ================================================================ */
export interface AIModelConfig {
  id: string;
  name: string;
  displayName: string;
  type: 'chat' | 'embedding' | 'fine-tune' | 'image' | 'audio';
  contextLength: number;
  maxTokens: number;
  enabled: boolean;
  parameters: {
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  capabilities: string[];
  benchmark?: {
    latency: number;
    throughput: number;
    accuracy: number;
  };
}

export interface AIProviderConfig {
  id: string;
  name: string;
  displayName: string;
  type: 'cloud' | 'local';
  baseURL: string;
  apiKey: string;
  apiKeyURL?: string;
  region?: string;
  models: AIModelConfig[];
  enabled: boolean;
  priority: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  pricing?: {
    inputPrice: number;
    outputPrice: number;
    currency: string;
  };
}

export interface AIServiceConfig {
  providers: AIProviderConfig[];
  activeProvider: string;
  activeModel: string;
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
    retryAttempts: number;
    backoffMultiplier: number;
  };
  detection: {
    enabled: boolean;
    autoSelectBest: boolean;
    performanceMonitoring: boolean;
    errorAnalysis: boolean;
  };
}

export interface PerformanceMetrics {
  providerId: string;
  modelId: string;
  timestamp: number;
  latency: number;
  throughput: number;
  successRate: number;
  errorCount: number;
  totalRequests: number;
}

export interface ErrorAnalysis {
  providerId: string;
  modelId: string;
  errorType: 'network' | 'api' | 'rate_limit' | 'authentication' | 'unknown';
  errorMessage: string;
  timestamp: number;
  count: number;
  suggestions: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  providerId?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: Array<{
    message: ChatMessage;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatStreamChunk {
  id: string;
  model: string;
  delta: string;
  done: boolean;
  finishReason: string | null;
}

export interface CostReport {
  providerId: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  currency: string;
}

/* ================================================================
   Default Configuration
   ================================================================ */
const STORAGE_KEY = 'yyc3-ai-service-config';

const DEFAULT_CONFIG: AIServiceConfig = {
  providers: [],
  activeProvider: 'openai',
  activeModel: 'gpt-4-turbo',
  cache: {
    enabled: true,
    ttl: 300,
    maxSize: 100,
  },
  rateLimit: {
    enabled: true,
    requestsPerMinute: 60,
    retryAttempts: 3,
    backoffMultiplier: 2,
  },
  detection: {
    enabled: true,
    autoSelectBest: false,
    performanceMonitoring: true,
    errorAnalysis: true,
  },
};

/* ================================================================
   Error Classification & Suggestions
   ================================================================ */
function classifyError(error: any): ErrorAnalysis['errorType'] {
  const message = (error?.message || '').toLowerCase();
  if (message.includes('network') || message.includes('fetch') || message.includes('econnrefused'))
    return 'network';
  if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests'))
    return 'rate_limit';
  if (message.includes('authentication') || message.includes('401') || message.includes('unauthorized'))
    return 'authentication';
  if (message.includes('api') || message.includes('400') || message.includes('bad request'))
    return 'api';
  return 'unknown';
}

const ERROR_SUGGESTIONS: Record<ErrorAnalysis['errorType'], string[]> = {
  network: [
    '检查网络连接是否正常',
    '确认 API 服务是否正常运行',
    '尝试使用 VPN 或代理',
    '检查防火墙设置',
  ],
  api: [
    '检查请求参数是否正确',
    '确认模型名称是否有效',
    '查看 API 文档了解最新变更',
    '验证请求格式是否符合规范',
  ],
  rate_limit: [
    '降低请求频率',
    '考虑升级到更高级别的 API 计划',
    '增加请求间隔时间',
    '使用多个 API 密钥进行负载均衡',
  ],
  authentication: [
    '检查 API 密钥是否正确',
    '确认 API 密钥是否已激活',
    '尝试重新生成 API 密钥',
    '检查密钥权限设置',
  ],
  unknown: [
    '查看完整的错误日志',
    '联系服务商技术支持',
    '检查系统日志获取更多信息',
    '尝试重启应用程序',
  ],
};

/* ================================================================
   Load / Save (localStorage persistence)
   ================================================================ */
function loadConfig(): AIServiceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_CONFIG;
}

function saveConfig(config: AIServiceConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

/* ================================================================
   useAIService Hook
   ================================================================ */
export function useAIService() {
  const [config, setConfig] = useState<AIServiceConfig>(loadConfig);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [errors, setErrors] = useState<ErrorAnalysis[]>([]);
  const [costReports, setCostReports] = useState<CostReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const rateLimitTracker = useRef<Map<string, { count: number; resetTime: number }>>(new Map());
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());

  // Persist config changes
  const updateConfig = useCallback((updater: (prev: AIServiceConfig) => AIServiceConfig) => {
    setConfig(prev => {
      const next = updater(prev);
      saveConfig(next);
      return next;
    });
  }, []);

  /* ─── Provider Management ─── */
  const addProvider = useCallback((provider: AIProviderConfig) => {
    updateConfig(c => ({ ...c, providers: [...c.providers, provider] }));
  }, [updateConfig]);

  const editProvider = useCallback((provider: AIProviderConfig) => {
    updateConfig(c => ({
      ...c,
      providers: c.providers.map(p => p.id === provider.id ? provider : p),
    }));
  }, [updateConfig]);

  const removeProvider = useCallback((providerId: string) => {
    updateConfig(c => ({ ...c, providers: c.providers.filter(p => p.id !== providerId) }));
  }, [updateConfig]);

  const toggleProvider = useCallback((providerId: string) => {
    updateConfig(c => ({
      ...c,
      providers: c.providers.map(p => p.id === providerId ? { ...p, enabled: !p.enabled } : p),
    }));
  }, [updateConfig]);

  const setApiKey = useCallback((providerId: string, apiKey: string) => {
    updateConfig(c => ({
      ...c,
      providers: c.providers.map(p => p.id === providerId ? { ...p, apiKey } : p),
    }));
  }, [updateConfig]);

  /* ─── Model Management ─── */
  const toggleModel = useCallback((providerId: string, modelId: string) => {
    updateConfig(c => ({
      ...c,
      providers: c.providers.map(p => {
        if (p.id !== providerId) return p;
        return { ...p, models: p.models.map(m => m.id === modelId ? { ...m, enabled: !m.enabled } : m) };
      }),
    }));
  }, [updateConfig]);

  const addModel = useCallback((providerId: string, model: AIModelConfig) => {
    updateConfig(c => ({
      ...c,
      providers: c.providers.map(p => {
        if (p.id !== providerId) return p;
        return { ...p, models: [...p.models, model] };
      }),
    }));
  }, [updateConfig]);

  const removeModel = useCallback((providerId: string, modelId: string) => {
    updateConfig(c => ({
      ...c,
      providers: c.providers.map(p => {
        if (p.id !== providerId) return p;
        return { ...p, models: p.models.filter(m => m.id !== modelId) };
      }),
    }));
  }, [updateConfig]);

  /* ─── Active Provider/Model ─── */
  const setActiveProvider = useCallback((providerId: string) => {
    updateConfig(c => ({ ...c, activeProvider: providerId }));
  }, [updateConfig]);

  const setActiveModel = useCallback((modelId: string) => {
    updateConfig(c => ({ ...c, activeModel: modelId }));
  }, [updateConfig]);

  /* ─── Rate Limit Check ─── */
  const checkRateLimit = useCallback((providerId: string, modelId: string): boolean => {
    if (!config.rateLimit.enabled) return true;
    const key = `${providerId}:${modelId}`;
    const now = Date.now();
    const tracker = rateLimitTracker.current.get(key);

    if (!tracker || now > tracker.resetTime) {
      rateLimitTracker.current.set(key, { count: 1, resetTime: now + 60000 });
      return true;
    }
    if (tracker.count >= config.rateLimit.requestsPerMinute) return false;
    tracker.count++;
    return true;
  }, [config.rateLimit]);

  /* ─── Performance Recording ─── */
  const recordMetrics = useCallback((providerId: string, modelId: string, latency: number, success: boolean, tokens: number) => {
    setMetrics(prev => {
      const existing = prev.find(m => m.providerId === providerId && m.modelId === modelId);
      if (existing) {
        return prev.map(m => {
          if (m.providerId !== providerId || m.modelId !== modelId) return m;
          return {
            ...m,
            timestamp: Date.now(),
            latency,
            throughput: tokens / Math.max(latency / 1000, 0.001),
            successRate: success ? Math.min(1, m.successRate * 0.9 + 0.1) : m.successRate * 0.9,
            errorCount: m.errorCount + (success ? 0 : 1),
            totalRequests: m.totalRequests + 1,
          };
        });
      }
      return [...prev, {
        providerId, modelId,
        timestamp: Date.now(),
        latency,
        throughput: tokens / Math.max(latency / 1000, 0.001),
        successRate: success ? 1 : 0,
        errorCount: success ? 0 : 1,
        totalRequests: 1,
      }].slice(-200); // Keep last 200 records
    });
  }, []);

  /* ─── Error Recording ─── */
  const recordError = useCallback((providerId: string, modelId: string, error: any) => {
    const errorType = classifyError(error);
    setErrors(prev => {
      const existing = prev.find(e => e.providerId === providerId && e.modelId === modelId && e.errorType === errorType);
      if (existing) {
        return prev.map(e => {
          if (e.providerId !== providerId || e.modelId !== modelId || e.errorType !== errorType) return e;
          return { ...e, count: e.count + 1, timestamp: Date.now() };
        });
      }
      return [...prev, {
        providerId, modelId, errorType,
        errorMessage: error?.message || 'Unknown error',
        timestamp: Date.now(),
        count: 1,
        suggestions: ERROR_SUGGESTIONS[errorType] || ERROR_SUGGESTIONS.unknown,
      }].slice(-100);
    });
  }, []);

  /* ─── Cost Tracking ─── */
  const trackCost = useCallback((providerId: string, modelId: string, inputTokens: number, outputTokens: number) => {
    const provider = config.providers.find(p => p.id === providerId);
    if (!provider?.pricing) return;
    const cost = (inputTokens / 1000) * provider.pricing.inputPrice + (outputTokens / 1000) * provider.pricing.outputPrice;
    setCostReports(prev => {
      const existing = prev.find(c => c.providerId === providerId && c.modelId === modelId);
      if (existing) {
        return prev.map(c => {
          if (c.providerId !== providerId || c.modelId !== modelId) return c;
          return { ...c, inputTokens: c.inputTokens + inputTokens, outputTokens: c.outputTokens + outputTokens, cost: c.cost + cost };
        });
      }
      return [...prev, { providerId, modelId, inputTokens, outputTokens, cost, currency: provider.pricing!.currency }];
    });
  }, [config.providers]);

  /* ─── Intelligent Detection ─── */
  const detectBestProvider = useCallback((): AIProviderConfig | null => {
    const enabledProviders = config.providers.filter(p => p.enabled);
    if (enabledProviders.length === 0) return null;

    if (metrics.length === 0) {
      // Sort by priority
      return enabledProviders.sort((a, b) => a.priority - b.priority)[0];
    }

    let bestScore = -1;
    let best: AIProviderConfig | null = null;
    for (const provider of enabledProviders) {
      const pm = metrics.filter(m => m.providerId === provider.id);
      if (pm.length === 0) continue;
      const avgLatency = pm.reduce((s, m) => s + m.latency, 0) / pm.length;
      const avgSuccessRate = pm.reduce((s, m) => s + m.successRate, 0) / pm.length;
      const avgThroughput = pm.reduce((s, m) => s + m.throughput, 0) / pm.length;
      const score = avgThroughput * 0.4 + avgSuccessRate * 100 * 0.4 - avgLatency / 10000 * 0.2;
      if (score > bestScore) { bestScore = score; best = provider; }
    }
    return best || enabledProviders[0];
  }, [config.providers, metrics]);

  const detectBestModel = useCallback((providerId: string): AIModelConfig | null => {
    const provider = config.providers.find(p => p.id === providerId);
    if (!provider) return null;
    const enabledModels = provider.models.filter(m => m.enabled);
    if (enabledModels.length === 0) return null;

    let bestScore = -1;
    let best: AIModelConfig | null = null;
    for (const model of enabledModels) {
      if (model.benchmark) {
        const score = model.benchmark.throughput * 0.5 + model.benchmark.accuracy * 100 * 0.5;
        if (score > bestScore) { bestScore = score; best = model; }
      }
    }
    return best || enabledModels[0];
  }, [config.providers]);

  /* ─── Find Alternative Provider (Fallback) ─── */
  const findAlternativeProvider = useCallback((excludeId: string): AIProviderConfig | null => {
    const alternatives = config.providers
      .filter(p => p.enabled && p.id !== excludeId)
      .sort((a, b) => a.priority - b.priority);
    return alternatives[0] || null;
  }, [config.providers]);

  /* ─── Chat (with retry + fallback) ─── */
  const chat = useCallback(async (
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse> => {
    const providerId = options?.providerId || config.activeProvider;
    const modelId = options?.model || config.activeModel;

    const provider = config.providers.find(p => p.id === providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    const model = provider.models.find(m => m.id === modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    // Check cache
    if (config.cache.enabled) {
      const cacheKey = JSON.stringify({ messages, options });
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < config.cache.ttl * 1000) {
        return cached.data;
      }
    }

    // Check rate limit
    if (!checkRateLimit(provider.id, model.id)) {
      throw new Error('Rate limit exceeded — 请稍后重试');
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const apiKey = provider.apiKey;
      if (!apiKey && provider.type !== 'local') {
        throw new Error(`API key not set for provider ${provider.displayName}`);
      }

      const response = await fetch(`${provider.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model.name,
          messages,
          temperature: options?.temperature ?? model.parameters.temperature,
          max_tokens: options?.maxTokens ?? model.maxTokens,
          top_p: options?.topP ?? model.parameters.topP,
          frequency_penalty: options?.frequencyPenalty ?? model.parameters.frequencyPenalty,
          presence_penalty: options?.presencePenalty ?? model.parameters.presencePenalty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      const result: ChatResponse = {
        id: data.id,
        model: model.name,
        choices: data.choices?.map((c: any) => ({
          message: { role: c.message.role, content: c.message.content },
          finishReason: c.finish_reason,
        })) || [],
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };

      // Record success metrics
      recordMetrics(provider.id, model.id, latency, true, result.usage.totalTokens);
      trackCost(provider.id, model.id, result.usage.promptTokens, result.usage.completionTokens);

      // Cache result
      if (config.cache.enabled) {
        const cacheKey = JSON.stringify({ messages, options });
        cacheRef.current.set(cacheKey, { data: result, timestamp: Date.now() });
        // Cleanup cache
        if (cacheRef.current.size > config.cache.maxSize) {
          const entries = Array.from(cacheRef.current.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
          cacheRef.current.delete(entries[0][0]);
        }
      }

      return result;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      recordMetrics(provider.id, model.id, latency, false, 0);
      recordError(provider.id, model.id, error);

      // Fallback to alternative provider
      if (config.detection.enabled) {
        const alternative = findAlternativeProvider(provider.id);
        if (alternative) {
          console.warn(`[YYC³ AI Service] Falling back from ${provider.displayName} to ${alternative.displayName}`);
          const altModel = alternative.models.find(m => m.enabled) || alternative.models[0];
          if (altModel) {
            return chat(messages, { ...options, providerId: alternative.id, model: altModel.id });
          }
        }
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [config, checkRateLimit, recordMetrics, recordError, trackCost, findAlternativeProvider]);

  /* ─── Streaming Chat (AsyncGenerator) ─── */
  const chatStream = useCallback(async function* (
    messages: ChatMessage[],
    options?: ChatOptions,
    onChunk?: (chunk: ChatStreamChunk) => void,
  ): AsyncGenerator<ChatStreamChunk, void, undefined> {
    const providerId = options?.providerId || config.activeProvider;
    const modelId = options?.model || config.activeModel;

    const provider = config.providers.find(p => p.id === providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    const model = provider.models.find(m => m.id === modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    // Rate limit
    if (!checkRateLimit(provider.id, model.id)) {
      throw new Error('Rate limit exceeded — 请稍后重试');
    }

    const apiKey = provider.apiKey;
    if (!apiKey && provider.type !== 'local') {
      throw new Error(`API key not set for provider ${provider.displayName}`);
    }

    setIsLoading(true);
    const startTime = Date.now();
    let totalTokens = 0;

    try {
      const response = await fetch(`${provider.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model.name,
          messages,
          temperature: options?.temperature ?? model.parameters.temperature,
          max_tokens: options?.maxTokens ?? model.maxTokens,
          top_p: options?.topP ?? model.parameters.topP,
          frequency_penalty: options?.frequencyPenalty ?? model.parameters.frequencyPenalty,
          presence_penalty: options?.presencePenalty ?? model.parameters.presencePenalty,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Stream request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);

          if (data === '[DONE]') {
            const doneChunk: ChatStreamChunk = {
              id: '', model: model.name, delta: '', done: true, finishReason: 'stop',
            };
            onChunk?.(doneChunk);
            yield doneChunk;
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            const finishReason = parsed.choices?.[0]?.finish_reason || null;

            if (delta) totalTokens += 1; // approximate token count

            const chunk: ChatStreamChunk = {
              id: parsed.id || '',
              model: parsed.model || model.name,
              delta,
              done: false,
              finishReason,
            };

            onChunk?.(chunk);
            yield chunk;
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Record streaming metrics
      const latency = Date.now() - startTime;
      recordMetrics(provider.id, model.id, latency, true, totalTokens);
      trackCost(provider.id, model.id, totalTokens, totalTokens); // approximate
    } catch (error: any) {
      const latency = Date.now() - startTime;
      recordMetrics(provider.id, model.id, latency, false, 0);
      recordError(provider.id, model.id, error);

      // Fallback for streaming is not supported — rethrow
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [config, checkRateLimit, recordMetrics, recordError, trackCost]);

  /* ─── Derived State ─── */
  const activeProvider = useMemo(
    () => config.providers.find(p => p.id === config.activeProvider) || null,
    [config.providers, config.activeProvider],
  );

  const activeModel = useMemo(
    () => activeProvider?.models.find(m => m.id === config.activeModel) || null,
    [activeProvider, config.activeModel],
  );

  const enabledProviders = useMemo(
    () => config.providers.filter(p => p.enabled),
    [config.providers],
  );

  const totalModels = useMemo(
    () => config.providers.reduce((s, p) => s + p.models.filter(m => m.enabled).length, 0),
    [config.providers],
  );

  /* ─── Clear Caches / Metrics ─── */
  const clearCache = useCallback(() => { cacheRef.current.clear(); }, []);
  const clearMetrics = useCallback(() => { setMetrics([]); setErrors([]); setCostReports([]); }, []);
  const resetConfig = useCallback(() => { updateConfig(() => DEFAULT_CONFIG); }, [updateConfig]);

  return {
    // Config
    config,
    updateConfig,
    resetConfig,

    // Provider management
    addProvider,
    editProvider,
    removeProvider,
    toggleProvider,
    setApiKey,
    setActiveProvider,

    // Model management
    addModel,
    removeModel,
    toggleModel,
    setActiveModel,

    // Chat
    chat,
    chatStream,
    isLoading,

    // Detection
    detectBestProvider,
    detectBestModel,
    findAlternativeProvider,

    // Monitoring
    metrics,
    errors,
    costReports,
    clearCache,
    clearMetrics,

    // Derived
    activeProvider,
    activeModel,
    enabledProviders,
    totalModels,
  };
}