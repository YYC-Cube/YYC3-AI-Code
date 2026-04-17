/**
 * @file ai-cost-service.ts
 * @description YYC³ AI 成本控制服务 — 预算管理、用量跟踪、模型选择优化、成本报表
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Implements the spec's AI service cost control:
 *   Budget (daily/monthly) · Model-selection optimisation · Cache-aware tracking · Reports
 */

import { createLogger } from '../utils/logger'
import type {
  AICostConfig,
  CostRecord,
  CostSummary,
  CostBreakdown,
  ModelSelectionRule,
} from '../types/security'

const log = createLogger('AICostService')

/* ================================================================
   Default Configuration
   ================================================================ */

const DEFAULT_CONFIG: AICostConfig = {
  budget: {
    dailyLimitUsd: 100,
    monthlyLimitUsd: 3000,
    alertThreshold: 0.8,   // 80%
    hardLimitFactor: 1.2,  // 120%
  },
  modelSelection: [
    { complexity: 'low',     providerId: 'openai',    modelId: 'gpt-3.5-turbo',            reason: '成本低，速度快' },
    { complexity: 'medium',  providerId: 'anthropic',  modelId: 'claude-3-sonnet-20240229',  reason: '性价比均衡' },
    { complexity: 'high',    providerId: 'openai',    modelId: 'gpt-4-turbo-preview',       reason: '最高质量输出' },
    { complexity: 'privacy', providerId: 'ollama',    modelId: 'llama2',                    reason: '数据不出本地' },
  ],
  cache: {
    enabled: true,
    strategy: 'lru',
    maxEntries: 10_000,
    ttlSeconds: 3600,
  },
  batch: {
    enabled: true,
    maxBatchSize: 10,
    maxWaitMs: 5000,
  },
}

/* ================================================================
   Provider Pricing (per 1K tokens, USD)
   ================================================================ */

interface PricingEntry {
  inputPer1k: number
  outputPer1k: number
}

const PRICING: Record<string, Record<string, PricingEntry>> = {
  openai: {
    'gpt-4-turbo-preview': { inputPer1k: 0.03,    outputPer1k: 0.06 },
    'gpt-3.5-turbo':       { inputPer1k: 0.0005,  outputPer1k: 0.0015 },
    'text-embedding-ada-002': { inputPer1k: 0.0001, outputPer1k: 0 },
  },
  anthropic: {
    'claude-3-opus-20240229':   { inputPer1k: 0.015,  outputPer1k: 0.075 },
    'claude-3-sonnet-20240229': { inputPer1k: 0.003,  outputPer1k: 0.015 },
  },
  zhipuai: {
    'glm-4':       { inputPer1k: 0.0001, outputPer1k: 0.0001 },
    'glm-4-flash': { inputPer1k: 0.00005, outputPer1k: 0.00005 },
  },
  baidu: {
    'ernie-4.0-8k': { inputPer1k: 0.00012, outputPer1k: 0.00012 },
    'ernie-3.5-8k': { inputPer1k: 0.00008, outputPer1k: 0.00008 },
  },
  aliyun: {
    'qwen-turbo': { inputPer1k: 0.00008, outputPer1k: 0.00008 },
    'qwen-plus':  { inputPer1k: 0.0001,  outputPer1k: 0.0001 },
    'qwen-max':   { inputPer1k: 0.0002,  outputPer1k: 0.0002 },
  },
  ollama: {
    'llama2':    { inputPer1k: 0, outputPer1k: 0 },
    'mistral':   { inputPer1k: 0, outputPer1k: 0 },
    'codellama': { inputPer1k: 0, outputPer1k: 0 },
  },
}

/* ================================================================
   Helper: date range
   ================================================================ */

function startOfDay(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function startOfMonth(): number {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/* ================================================================
   AI Cost Service
   ================================================================ */

class AICostServiceImpl {
  private config: AICostConfig = { ...DEFAULT_CONFIG }
  private records: CostRecord[] = []
  private idCounter = 0
  private alertCallbacks: Array<(msg: string, severity: 'info' | 'warning' | 'critical') => void> = []

  /* ── Configuration ── */

  getConfig(): AICostConfig {
    return { ...this.config }
  }

  updateConfig(partial: Partial<AICostConfig>): void {
    this.config = { ...this.config, ...partial }
    log.info('Cost config updated', partial)
  }

  updateBudget(budget: Partial<AICostConfig['budget']>): void {
    this.config.budget = { ...this.config.budget, ...budget }
    log.info('Budget updated', this.config.budget)
  }

  /* ── Cost Calculation ── */

  /**
   * Calculate cost for a single request.
   */
  calculateCost(providerId: string, modelId: string, inputTokens: number, outputTokens: number): number {
    const providerPricing = PRICING[providerId]
    if (!providerPricing) {return 0}
    const modelPricing = providerPricing[modelId]
    if (!modelPricing) {return 0}

    const inputCost = (inputTokens / 1000) * modelPricing.inputPer1k
    const outputCost = (outputTokens / 1000) * modelPricing.outputPer1k
    return inputCost + outputCost
  }

  /* ── Recording ── */

  /**
   * Record a completed AI request for cost tracking.
   */
  recordUsage(params: {
    providerId: string
    modelId: string
    inputTokens: number
    outputTokens: number
    taskType: string
    cached?: boolean
  }): CostRecord {
    const cost = params.cached
      ? 0
      : this.calculateCost(params.providerId, params.modelId, params.inputTokens, params.outputTokens)

    const record: CostRecord = {
      id: `cost-${++this.idCounter}-${Date.now()}`,
      timestamp: Date.now(),
      providerId: params.providerId,
      modelId: params.modelId,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      costUsd: cost,
      taskType: params.taskType,
      cached: params.cached || false,
    }

    this.records.push(record)

    // Trim old records (keep last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    this.records = this.records.filter(r => r.timestamp >= thirtyDaysAgo)

    // Budget check
    this.checkBudget()

    log.debug('Usage recorded', { model: params.modelId, cost: cost.toFixed(6) })
    return record
  }

  /* ── Budget Checks ── */

  private checkBudget(): void {
    const daySummary = this.getSummary('day')
    const monthSummary = this.getSummary('month')

    const { budget } = this.config
    const dayHard = budget.dailyLimitUsd * budget.hardLimitFactor
    const monthHard = budget.monthlyLimitUsd * budget.hardLimitFactor

    // Daily alerts
    if (daySummary.totalCostUsd >= dayHard) {
      this.fireAlert(`日预算已超出硬限制 ($${daySummary.totalCostUsd.toFixed(2)} / $${budget.dailyLimitUsd})`, 'critical')
    } else if (daySummary.budgetUsed >= budget.alertThreshold) {
      this.fireAlert(`日预算已使用 ${(daySummary.budgetUsed * 100).toFixed(0)}%`, 'warning')
    }

    // Monthly alerts
    if (monthSummary.totalCostUsd >= monthHard) {
      this.fireAlert(`月预算已超出硬限制 ($${monthSummary.totalCostUsd.toFixed(2)} / $${budget.monthlyLimitUsd})`, 'critical')
    } else if (monthSummary.budgetUsed >= budget.alertThreshold) {
      this.fireAlert(`月预算已使用 ${(monthSummary.budgetUsed * 100).toFixed(0)}%`, 'warning')
    }
  }

  /**
   * Check if a request would exceed the daily hard limit.
   */
  isOverBudget(): boolean {
    const daySummary = this.getSummary('day')
    return daySummary.totalCostUsd >= this.config.budget.dailyLimitUsd * this.config.budget.hardLimitFactor
  }

  /* ── Summaries ── */

  /**
   * Get a cost summary for a given period.
   */
  getSummary(period: 'day' | 'month'): CostSummary {
    const cutoff = period === 'day' ? startOfDay() : startOfMonth()
    const limit = period === 'day' ? this.config.budget.dailyLimitUsd : this.config.budget.monthlyLimitUsd
    const periodRecords = this.records.filter(r => r.timestamp >= cutoff)

    const totalCostUsd = periodRecords.reduce((s, r) => s + r.costUsd, 0)
    const totalInputTokens = periodRecords.reduce((s, r) => s + r.inputTokens, 0)
    const totalOutputTokens = periodRecords.reduce((s, r) => s + r.outputTokens, 0)
    const cacheHits = periodRecords.filter(r => r.cached).length
    const requestCount = periodRecords.length
    const cacheHitRate = requestCount > 0 ? cacheHits / requestCount : 0
    const budgetUsed = limit > 0 ? totalCostUsd / limit : 0

    // Breakdown by provider+model
    const grouped = new Map<string, { records: CostRecord[] }>()
    for (const r of periodRecords) {
      const key = `${r.providerId}:${r.modelId}`
      if (!grouped.has(key)) {grouped.set(key, { records: [] })}
      grouped.get(key)!.records.push(r)
    }

    const breakdown: CostBreakdown[] = Array.from(grouped.entries()).map(([key, { records }]) => {
      const [providerId, modelId] = key.split(':')
      return {
        providerId,
        modelId,
        costUsd: records.reduce((s, r) => s + r.costUsd, 0),
        requestCount: records.length,
        avgLatencyMs: 0, // latency tracked elsewhere
      }
    }).sort((a, b) => b.costUsd - a.costUsd)

    return {
      period,
      totalCostUsd,
      totalInputTokens,
      totalOutputTokens,
      requestCount,
      cacheHitRate,
      budgetUsed,
      budgetRemaining: Math.max(0, limit - totalCostUsd),
      isOverBudget: totalCostUsd >= limit * this.config.budget.hardLimitFactor,
      breakdown,
    }
  }

  /* ── Model Selection Optimisation ── */

  /**
   * Get the recommended provider/model for a given task complexity.
   */
  recommendModel(complexity: 'low' | 'medium' | 'high' | 'privacy'): ModelSelectionRule | undefined {
    return this.config.modelSelection.find(r => r.complexity === complexity)
  }

  /**
   * Set model-selection rules.
   */
  setModelSelectionRules(rules: ModelSelectionRule[]): void {
    this.config.modelSelection = rules
    log.info('Model selection rules updated', { count: rules.length })
  }

  /* ── Alert Callbacks ── */

  onAlert(callback: (msg: string, severity: 'info' | 'warning' | 'critical') => void): () => void {
    this.alertCallbacks.push(callback)
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback)
    }
  }

  private fireAlert(message: string, severity: 'info' | 'warning' | 'critical'): void {
    log.warn('Cost alert', { message, severity })
    for (const cb of this.alertCallbacks) {
      try { cb(message, severity) } catch { /* */ }
    }
  }

  /* ── Records Access ── */

  getRecords(limit = 100): CostRecord[] {
    return this.records.slice(-limit)
  }

  clearRecords(): void {
    this.records = []
    this.idCounter = 0
  }
}

/* ================================================================
   Singleton
   ================================================================ */

export const aiCostService = new AICostServiceImpl()
