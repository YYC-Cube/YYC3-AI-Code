/**
 * @file security.ts
 * @description YYC³ 安全与性能类型定义 — CSP、速率限制、性能基准、AI 成本控制
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 */

/* ================================================================
   Content Security Policy
   ================================================================ */

export interface CSPConfig {
  defaultSrc: string[]
  scriptSrc: string[]
  styleSrc: string[]
  imgSrc: string[]
  connectSrc: string[]
  fontSrc: string[]
  objectSrc: string[]
  frameSrc: string[]
  reportUri?: string
}

/* ================================================================
   Rate Limiting (Client-Side)
   ================================================================ */

export interface RateLimitConfig {
  /** Window duration in milliseconds */
  windowMs: number
  /** Maximum requests within the window */
  maxRequests: number
  /** Message displayed when limit exceeded */
  message: string
  /** Retry-After header value in seconds */
  retryAfterSec: number
}

export interface RateLimitState {
  /** Sliding-window request timestamps */
  timestamps: number[]
  /** Whether currently throttled */
  isThrottled: boolean
  /** Time until throttle lifts (ms) */
  retryAfter: number
  /** Remaining requests in current window */
  remaining: number
}

/* ================================================================
   Performance Benchmarks
   ================================================================ */

export type BenchmarkCategory = 'frontend' | 'backend' | 'database' | 'ai'
export type BenchmarkStatus = 'met' | 'in-progress' | 'failing'

export interface BenchmarkTarget {
  id: string
  category: BenchmarkCategory
  metric: string
  /** Target threshold value */
  target: number
  /** Unit of measurement */
  unit: string
  /** Current measured value */
  current: number
  status: BenchmarkStatus
  /** Higher or lower is better */
  direction: 'lower' | 'higher'
}

export interface BenchmarkReport {
  timestamp: number
  targets: BenchmarkTarget[]
  overallScore: number        // 0-100
  passRate: number            // 0-1
  recommendations: string[]
}

/* ================================================================
   AI Cost Control
   ================================================================ */

export interface AICostConfig {
  /** Budget settings */
  budget: {
    dailyLimitUsd: number
    monthlyLimitUsd: number
    alertThreshold: number     // 0-1 (e.g. 0.8 = 80%)
    hardLimitFactor: number    // e.g. 1.2 = 120%
  }
  /** Model-selection optimisation rules */
  modelSelection: ModelSelectionRule[]
  /** Caching policy */
  cache: {
    enabled: boolean
    strategy: 'lru' | 'ttl' | 'lfu'
    maxEntries: number
    ttlSeconds: number
  }
  /** Batch-request policy */
  batch: {
    enabled: boolean
    maxBatchSize: number
    maxWaitMs: number
  }
}

export interface ModelSelectionRule {
  complexity: 'low' | 'medium' | 'high' | 'privacy'
  providerId: string
  modelId: string
  reason: string
}

export interface CostRecord {
  id: string
  timestamp: number
  providerId: string
  modelId: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  taskType: string
  cached: boolean
}

export interface CostSummary {
  period: 'day' | 'month'
  totalCostUsd: number
  totalInputTokens: number
  totalOutputTokens: number
  requestCount: number
  cacheHitRate: number
  budgetUsed: number          // 0-1
  budgetRemaining: number     // USD
  isOverBudget: boolean
  breakdown: CostBreakdown[]
}

export interface CostBreakdown {
  providerId: string
  modelId: string
  costUsd: number
  requestCount: number
  avgLatencyMs: number
}

/* ================================================================
   Monitoring & Alerting
   ================================================================ */

export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertChannel = 'console' | 'toast' | 'notification' | 'callback'

export interface AlertRule {
  id: string
  name: string
  /** Metric to watch */
  metric: string
  /** Threshold that triggers the alert */
  threshold: number
  /** Comparison operator */
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
  severity: AlertSeverity
  channels: AlertChannel[]
  /** Cooldown before re-firing (ms) */
  cooldownMs: number
  enabled: boolean
}

export interface Alert {
  id: string
  ruleId: string
  severity: AlertSeverity
  message: string
  metricValue: number
  threshold: number
  timestamp: number
  acknowledged: boolean
}

export interface MonitoringConfig {
  enabled: boolean
  /** Polling interval for metrics (ms) */
  intervalMs: number
  /** Maximum alerts kept in memory */
  maxAlerts: number
  rules: AlertRule[]
}

/* ================================================================
   Error Tracking
   ================================================================ */

export interface TrackedError {
  id: string
  message: string
  stack?: string
  componentName?: string
  route?: string
  userId?: string
  timestamp: number
  severity: AlertSeverity
  count: number
  lastOccurrence: number
  metadata?: Record<string, unknown>
}

export interface ErrorReport {
  period: 'hour' | 'day' | 'week'
  totalErrors: number
  uniqueErrors: number
  errorRate: number           // errors per minute
  topErrors: TrackedError[]
  bySeverity: Record<AlertSeverity, number>
}
