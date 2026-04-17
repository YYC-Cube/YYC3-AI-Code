/**
 * @file monitoring-service.ts
 * @description YYC³ 监控告警服务 — 统一指标收集、阈值检测、错误追踪、告警分发
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Implements the spec's monitoring & alerting:
 *   Metrics collection · Threshold alerting · Error tracking · Reports
 */

import { createLogger } from '../utils/logger'
import type {
  MonitoringConfig,
  AlertRule,
  Alert,
  AlertSeverity,
  TrackedError,
  ErrorReport,
  BenchmarkTarget,
  BenchmarkReport,
  BenchmarkStatus,
} from '../types/security'

const log = createLogger('MonitoringService')

/* ================================================================
   Default Configuration
   ================================================================ */

const DEFAULT_CONFIG: MonitoringConfig = {
  enabled: true,
  intervalMs: 5000,
  maxAlerts: 200,
  rules: [
    {
      id: 'high-memory',
      name: '内存使用过高',
      metric: 'memoryUsedMB',
      threshold: 500,
      operator: 'gt',
      severity: 'warning',
      channels: ['console', 'toast'],
      cooldownMs: 60_000,
      enabled: true,
    },
    {
      id: 'high-dom-nodes',
      name: 'DOM 节点过多',
      metric: 'domNodes',
      threshold: 2000,
      operator: 'gt',
      severity: 'warning',
      channels: ['console'],
      cooldownMs: 120_000,
      enabled: true,
    },
    {
      id: 'high-error-rate',
      name: '错误率过高',
      metric: 'errorsPerMinute',
      threshold: 10,
      operator: 'gt',
      severity: 'critical',
      channels: ['console', 'toast', 'notification'],
      cooldownMs: 300_000,
      enabled: true,
    },
    {
      id: 'slow-render',
      name: '渲染时间过长',
      metric: 'renderTimeMs',
      threshold: 16,
      operator: 'gt',
      severity: 'info',
      channels: ['console'],
      cooldownMs: 30_000,
      enabled: true,
    },
  ],
}

/* ================================================================
   Performance Benchmark Targets (from the spec table)
   ================================================================ */

const BENCHMARK_TARGETS: BenchmarkTarget[] = [
  { id: 'lighthouse',   category: 'frontend',  metric: 'Lighthouse Score',  target: 90,   unit: 'score', current: 85,   status: 'in-progress', direction: 'higher' },
  { id: 'fcp',          category: 'frontend',  metric: 'FCP',              target: 1800, unit: 'ms',    current: 2000, status: 'in-progress', direction: 'lower' },
  { id: 'lcp',          category: 'frontend',  metric: 'LCP',              target: 2500, unit: 'ms',    current: 2800, status: 'in-progress', direction: 'lower' },
  { id: 'tti',          category: 'frontend',  metric: 'TTI',              target: 3800, unit: 'ms',    current: 4000, status: 'in-progress', direction: 'lower' },
  { id: 'resp-p95',     category: 'backend',   metric: 'Response P95',     target: 100,  unit: 'ms',    current: 120,  status: 'in-progress', direction: 'lower' },
  { id: 'throughput',   category: 'backend',   metric: 'Throughput',       target: 1000, unit: 'req/s', current: 800,  status: 'in-progress', direction: 'higher' },
  { id: 'query-p95',    category: 'database',  metric: 'Query P95',        target: 50,   unit: 'ms',    current: 60,   status: 'in-progress', direction: 'lower' },
  { id: 'tps',          category: 'database',  metric: 'TPS',              target: 2000, unit: 'tps',   current: 1500, status: 'in-progress', direction: 'higher' },
  { id: 'ai-resp-p95',  category: 'ai',        metric: 'AI Response P95',  target: 3000, unit: 'ms',    current: 3500, status: 'in-progress', direction: 'lower' },
  { id: 'ai-throughput', category: 'ai',       metric: 'AI Throughput',    target: 120,  unit: 'req/min', current: 100, status: 'in-progress', direction: 'higher' },
]

/* ================================================================
   Metrics Snapshot
   ================================================================ */

interface MetricsSnapshot {
  timestamp: number
  memoryUsedMB: number
  domNodes: number
  errorsPerMinute: number
  renderTimeMs: number
  jsHeapSizeMB: number
}

/* ================================================================
   Monitoring Service
   ================================================================ */

class MonitoringServiceImpl {
  private config: MonitoringConfig = DEFAULT_CONFIG
  private alerts: Alert[] = []
  private errors: Map<string, TrackedError> = new Map()
  private recentErrors: number[] = [] // timestamps for rate calc
  private lastFired: Map<string, number> = new Map()
  private alertIdCounter = 0
  private errorIdCounter = 0
  private intervalHandle: ReturnType<typeof setInterval> | null = null
  private alertSubscribers: Array<(alert: Alert) => void> = []
  private benchmarks: BenchmarkTarget[] = BENCHMARK_TARGETS.map(b => ({ ...b }))
  private metricsHistory: MetricsSnapshot[] = []

  /* ── Lifecycle ── */

  /**
   * Start the monitoring loop.
   */
  start(): void {
    if (this.intervalHandle) {return}
    if (!this.config.enabled) {return}

    log.info('Monitoring started', { intervalMs: this.config.intervalMs })
    this.intervalHandle = setInterval(() => this.tick(), this.config.intervalMs)
    this.tick() // immediate first tick
  }

  /**
   * Stop the monitoring loop.
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
      log.info('Monitoring stopped')
    }
  }

  /* ── Metrics Collection (each tick) ── */

  private tick(): void {
    const snapshot = this.collectMetrics()
    this.metricsHistory.push(snapshot)
    if (this.metricsHistory.length > 500) {this.metricsHistory.shift()}

    // Evaluate alert rules
    for (const rule of this.config.rules) {
      if (!rule.enabled) {continue}
      const value = (snapshot as unknown as Record<string, number>)[rule.metric]
      if (value === undefined) {continue}
      if (this.evaluateCondition(value, rule.threshold, rule.operator)) {
        this.fireRule(rule, value)
      }
    }
  }

  private collectMetrics(): MetricsSnapshot {
    const mem = (performance as any)?.memory
    const now = Date.now()

    // Error rate: count errors in the last 60s
    const oneMinuteAgo = now - 60_000
    this.recentErrors = this.recentErrors.filter(t => t >= oneMinuteAgo)
    const errorsPerMinute = this.recentErrors.length

    return {
      timestamp: now,
      memoryUsedMB: mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : 0,
      domNodes: typeof document !== 'undefined' ? document.querySelectorAll('*').length : 0,
      errorsPerMinute,
      renderTimeMs: 0, // can be fed externally via recordRenderTime
      jsHeapSizeMB: mem ? Math.round(mem.totalJSHeapSize / 1024 / 1024) : 0,
    }
  }

  private evaluateCondition(value: number, threshold: number, op: AlertRule['operator']): boolean {
    switch (op) {
      case 'gt':  return value > threshold
      case 'lt':  return value < threshold
      case 'gte': return value >= threshold
      case 'lte': return value <= threshold
      case 'eq':  return value === threshold
      default: return false
    }
  }

  /* ── Alert Firing ── */

  private fireRule(rule: AlertRule, value: number): void {
    const now = Date.now()
    const lastFiredAt = this.lastFired.get(rule.id) || 0
    if (now - lastFiredAt < rule.cooldownMs) {return} // cooldown

    this.lastFired.set(rule.id, now)

    const alert: Alert = {
      id: `alert-${++this.alertIdCounter}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.name}: ${rule.metric} = ${value} (阈值: ${rule.threshold})`,
      metricValue: value,
      threshold: rule.threshold,
      timestamp: now,
      acknowledged: false,
    }

    this.alerts.push(alert)
    if (this.alerts.length > this.config.maxAlerts) {this.alerts.shift()}

    // Dispatch to channels
    if (rule.channels.includes('console')) {
      const logFn = rule.severity === 'critical' ? log.error : rule.severity === 'warning' ? log.warn : log.info
      logFn.call(log, `[Alert] ${alert.message}`)
    }

    // Notify subscribers
    for (const sub of this.alertSubscribers) {
      try { sub(alert) } catch { /* */ }
    }
  }

  /* ── Error Tracking ── */

  /**
   * Track an error occurrence.
   */
  trackError(error: Error, context?: { componentName?: string; route?: string; userId?: string }): void {
    const now = Date.now()
    this.recentErrors.push(now)

    const key = `${error.message}|${context?.componentName || ''}`
    const existing = this.errors.get(key)

    if (existing) {
      existing.count++
      existing.lastOccurrence = now
    } else {
      this.errors.set(key, {
        id: `err-${++this.errorIdCounter}`,
        message: error.message,
        stack: error.stack,
        componentName: context?.componentName,
        route: context?.route,
        userId: context?.userId,
        timestamp: now,
        severity: 'warning',
        count: 1,
        lastOccurrence: now,
      })
    }

    log.error('Error tracked', { message: error.message, component: context?.componentName })
  }

  /**
   * Get error report for a period.
   */
  getErrorReport(period: 'hour' | 'day' | 'week' = 'day'): ErrorReport {
    const cutoff = Date.now() - (
      period === 'hour' ? 3_600_000 :
      period === 'day' ? 86_400_000 :
      604_800_000
    )

    const periodErrors = Array.from(this.errors.values()).filter(e => e.lastOccurrence >= cutoff)
    const totalErrors = periodErrors.reduce((s, e) => s + e.count, 0)
    const durationMinutes = (Date.now() - cutoff) / 60_000

    const bySeverity: Record<AlertSeverity, number> = { info: 0, warning: 0, critical: 0 }
    for (const e of periodErrors) {
      bySeverity[e.severity] += e.count
    }

    return {
      period,
      totalErrors,
      uniqueErrors: periodErrors.length,
      errorRate: durationMinutes > 0 ? totalErrors / durationMinutes : 0,
      topErrors: periodErrors.sort((a, b) => b.count - a.count).slice(0, 10),
      bySeverity,
    }
  }

  /* ── Benchmarks ── */

  /**
   * Update a benchmark's current value.
   */
  updateBenchmark(id: string, currentValue: number): void {
    const target = this.benchmarks.find(b => b.id === id)
    if (!target) {return}
    target.current = currentValue
    target.status = this.evaluateBenchmarkStatus(target)
  }

  private evaluateBenchmarkStatus(target: BenchmarkTarget): BenchmarkStatus {
    if (target.direction === 'lower') {
      return target.current <= target.target ? 'met' : 'in-progress'
    }
    return target.current >= target.target ? 'met' : 'in-progress'
  }

  /**
   * Generate a benchmark report.
   */
  getBenchmarkReport(): BenchmarkReport {
    const met = this.benchmarks.filter(b => b.status === 'met').length
    const passRate = this.benchmarks.length > 0 ? met / this.benchmarks.length : 0
    const overallScore = Math.round(passRate * 100)

    const recommendations: string[] = []
    for (const b of this.benchmarks) {
      if (b.status !== 'met') {
        const dir = b.direction === 'lower' ? '降低' : '提高'
        recommendations.push(`${b.metric}: 当前 ${b.current}${b.unit}，目标 ${b.direction === 'lower' ? '<' : '≥'} ${b.target}${b.unit}，需${dir}`)
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('所有性能基准已达标')
    }

    return {
      timestamp: Date.now(),
      targets: [...this.benchmarks],
      overallScore,
      passRate,
      recommendations,
    }
  }

  /* ── Subscriptions ── */

  onAlert(callback: (alert: Alert) => void): () => void {
    this.alertSubscribers.push(callback)
    return () => {
      this.alertSubscribers = this.alertSubscribers.filter(s => s !== callback)
    }
  }

  /* ── Queries ── */

  getAlerts(limit = 50): Alert[] {
    return this.alerts.slice(-limit)
  }

  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(a => !a.acknowledged)
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {alert.acknowledged = true}
  }

  acknowledgeAll(): void {
    this.alerts.forEach(a => { a.acknowledged = true })
  }

  getMetricsHistory(limit = 100): MetricsSnapshot[] {
    return this.metricsHistory.slice(-limit)
  }

  /* ── Configuration ── */

  getConfig(): MonitoringConfig {
    return { ...this.config }
  }

  updateConfig(partial: Partial<MonitoringConfig>): void {
    const wasRunning = !!this.intervalHandle
    if (wasRunning) {this.stop()}

    this.config = { ...this.config, ...partial }

    if (wasRunning && this.config.enabled) {this.start()}
    log.info('Monitoring config updated')
  }

  addRule(rule: AlertRule): void {
    this.config.rules.push(rule)
  }

  removeRule(ruleId: string): void {
    this.config.rules = this.config.rules.filter(r => r.id !== ruleId)
  }

  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.config.rules.find(r => r.id === ruleId)
    if (rule) {rule.enabled = enabled}
  }

  /* ── Cleanup ── */

  clearAlerts(): void {
    this.alerts = []
  }

  clearErrors(): void {
    this.errors.clear()
    this.recentErrors = []
  }

  reset(): void {
    this.stop()
    this.clearAlerts()
    this.clearErrors()
    this.metricsHistory = []
    this.lastFired.clear()
  }
}

/* ================================================================
   Singleton
   ================================================================ */

export const monitoringService = new MonitoringServiceImpl()
