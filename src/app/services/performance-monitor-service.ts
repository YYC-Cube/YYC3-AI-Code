/**
 * @file performance-monitor-service.ts
 * @description Performance monitoring service — collects Web Vitals, FPS, memory, and resource metrics
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { createLogger } from '../utils/logger'

const log = createLogger('PerfMonitor')

// ============================================
// Types
// ============================================

export interface WebVitalsReport {
  lcp: number | null
  fid: number | null
  cls: number
  ttfb: number | null
  fcp: number | null
  inp: number | null
  timestamp: number
}

export interface MemoryReport {
  usedJSHeapSize: number | null
  totalJSHeapSize: number | null
  jsHeapSizeLimit: number | null
  usedMB: number
  limitMB: number
  percent: number
}

export interface ResourceReport {
  totalResources: number
  totalTransferKB: number
  byType: Record<string, { count: number; transferKB: number }>
  slowestResources: Array<{ name: string; duration: number; transferSize: number }>
}

export interface FPSReport {
  current: number | null
  avg: number | null
  min: number | null
  samples: number
}

export interface PerfSnapshot {
  timestamp: number
  fps: number | null
  domNodes: number
  memoryMB: number
  memoryUsed: number | null
  longTasks: number
  ttfb: number | null
  componentRenderCount: number
}

export interface PerformanceReport {
  webVitals: WebVitalsReport
  memory: MemoryReport
  resources: ResourceReport
  fps: FPSReport
  domNodes: number
  longTasks: number
  timestamp: number
  score: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  snapshots: PerfSnapshot[]
  recommendations: string[]
}

export type PerformanceEventType = 'vitals' | 'memory' | 'fps' | 'longtask'
export type PerformanceListener = (type: PerformanceEventType, data: any) => void

// ============================================
// Performance Monitor Service
// ============================================

class PerformanceMonitorServiceImpl {
  private observers: PerformanceObserver[] = []
  private listeners: Set<PerformanceListener> = new Set()
  private fpsFrameCount = 0
  private fpsLastTime = 0
  private fpsRafId: number | null = null
  private fpsHistory: number[] = []
  private fpsCurrent: number | null = null
  private longTaskCount = 0
  private latestVitals: WebVitalsReport = {
    lcp: null, fid: null, cls: 0, ttfb: null, fcp: null, inp: null, timestamp: 0,
  }
  private snapshotHistory: PerfSnapshot[] = []
  private running = false

  start(): void {
    if (this.running) {return}
    this.running = true
    log.info('Performance monitor started')

    this.observeVitals()
    this.observeLongTasks()
    this.startFPSMonitor()
    this.captureInitialMetrics()
  }

  stop(): void {
    this.running = false
    this.observers.forEach(o => o.disconnect())
    this.observers = []
    if (this.fpsRafId !== null) {
      cancelAnimationFrame(this.fpsRafId)
      this.fpsRafId = null
    }
    log.info('Performance monitor stopped')
  }

  isRunning(): boolean {
    return this.running
  }

  addListener(listener: PerformanceListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  collectSnapshot(): PerfSnapshot {
    const mem = this.getMemoryReport()
    const snapshot: PerfSnapshot = {
      timestamp: Date.now(),
      fps: this.fpsCurrent,
      domNodes: document.querySelectorAll('*').length,
      memoryMB: mem.usedMB,
      memoryUsed: mem.usedJSHeapSize,
      longTasks: this.longTaskCount,
      ttfb: this.latestVitals.ttfb,
      componentRenderCount: 0,
    }
    this.snapshotHistory.push(snapshot)
    if (this.snapshotHistory.length > 100) {this.snapshotHistory.shift()}
    return snapshot
  }

  getReport(): PerformanceReport {
    const mem = this.getMemoryReport()
    const fps = this.getFPSReport()
    const domNodes = document.querySelectorAll('*').length
    const score = this.computeScore(fps, mem, domNodes)
    const status = score >= 90 ? 'excellent' as const : score >= 70 ? 'good' as const : score >= 50 ? 'fair' as const : 'poor' as const

    return {
      webVitals: { ...this.latestVitals },
      memory: mem,
      resources: this.getResourceReport(),
      fps,
      domNodes,
      longTasks: this.longTaskCount,
      timestamp: Date.now(),
      score,
      status,
      snapshots: [...this.snapshotHistory],
      recommendations: this.generateRecommendations(fps, mem, domNodes),
    }
  }

  private computeScore(fps: FPSReport, mem: MemoryReport, domNodes: number): number {
    let score = 100
    if (fps.current !== null) {
      if (fps.current < 30) {score -= 30}
      else if (fps.current < 55) {score -= 10}
    }
    if (mem.percent > 80) {score -= 25}
    else if (mem.percent > 60) {score -= 10}
    if (domNodes > 2000) {score -= 15}
    else if (domNodes > 1500) {score -= 5}
    if (this.longTaskCount > 10) {score -= 15}
    else if (this.longTaskCount > 5) {score -= 5}
    return Math.max(0, Math.min(100, score))
  }

  private generateRecommendations(fps: FPSReport, mem: MemoryReport, domNodes: number): string[] {
    const recs: string[] = []
    if (fps.current !== null && fps.current < 55) {
      recs.push('FPS below 55 — consider reducing DOM complexity or deferring heavy renders')
    }
    if (mem.percent > 70) {
      recs.push('Memory usage above 70% — check for memory leaks or reduce cached data')
    }
    if (domNodes > 1500) {
      recs.push('High DOM node count — consider virtualizing long lists or lazy loading')
    }
    if (this.longTaskCount > 5) {
      recs.push('Multiple long tasks detected — break up heavy computations with requestIdleCallback')
    }
    if (this.latestVitals.lcp !== null && this.latestVitals.lcp > 2500) {
      recs.push('LCP exceeds 2.5s — optimize largest contentful paint element')
    }
    if (this.latestVitals.cls > 0.1) {
      recs.push('CLS above 0.1 — reserve space for dynamic content to reduce layout shifts')
    }
    if (recs.length === 0) {
      recs.push('Performance looks good — no issues detected')
    }
    return recs
  }

  // ============================================
  // Web Vitals Observation
  // ============================================

  private observeVitals(): void {
    const observe = (type: string, handler: (entry: PerformanceEntry) => void) => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            handler(entry)
          }
        })
        observer.observe({ type, buffered: true })
        this.observers.push(observer)
      } catch { /* not supported */ }
    }

    observe('largest-contentful-paint', (entry) => {
      this.latestVitals.lcp = Math.round(entry.startTime)
      this.latestVitals.timestamp = Date.now()
      this.emit('vitals', this.latestVitals)
    })

    observe('first-input', (entry) => {
      const evt = entry as PerformanceEventTiming
      this.latestVitals.fid = Math.round(evt.processingStart - entry.startTime)
      this.latestVitals.timestamp = Date.now()
      this.emit('vitals', this.latestVitals)
    })

    observe('layout-shift', (entry) => {
      const ls = entry as any
      if (!ls.hadRecentInput) {
        this.latestVitals.cls += ls.value
        this.latestVitals.timestamp = Date.now()
        this.emit('vitals', this.latestVitals)
      }
    })

    observe('event', (entry) => {
      const evt = entry as PerformanceEventTiming
      if (evt.duration > 0) {
        const inp = Math.round(evt.duration)
        if (this.latestVitals.inp === null || inp > this.latestVitals.inp) {
          this.latestVitals.inp = inp
          this.latestVitals.timestamp = Date.now()
          this.emit('vitals', this.latestVitals)
        }
      }
    })
  }

  // ============================================
  // Long Task Observation
  // ============================================

  private observeLongTasks(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longTaskCount++
          this.emit('longtask', {
            name: entry.name,
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
          })
        }
      })
      observer.observe({ type: 'longtask', buffered: true })
      this.observers.push(observer)
    } catch { /* not supported */ }
  }

  // ============================================
  // FPS Monitor
  // ============================================

  private startFPSMonitor(): void {
    this.fpsLastTime = performance.now()
    this.fpsFrameCount = 0

    const measure = () => {
      this.fpsFrameCount++
      const now = performance.now()
      if (now - this.fpsLastTime >= 1000) {
        this.fpsCurrent = Math.round(this.fpsFrameCount * 1000 / (now - this.fpsLastTime))
        this.fpsHistory.push(this.fpsCurrent)
        if (this.fpsHistory.length > 60) {this.fpsHistory.shift()}
        this.fpsFrameCount = 0
        this.fpsLastTime = now
        this.emit('fps', this.fpsCurrent)
      }
      this.fpsRafId = requestAnimationFrame(measure)
    }
    this.fpsRafId = requestAnimationFrame(measure)
  }

  // ============================================
  // Memory Report
  // ============================================

  private getMemoryReport(): MemoryReport {
    const mem = (performance as any)?.memory
    if (mem) {
      const usedMB = Math.round(mem.usedJSHeapSize / 1048576)
      const limitMB = Math.round(mem.jsHeapSizeLimit / 1048576)
      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
        usedMB,
        limitMB,
        percent: Math.round((usedMB / limitMB) * 100),
      }
    }
    return { usedJSHeapSize: null, totalJSHeapSize: null, jsHeapSizeLimit: null, usedMB: 0, limitMB: 0, percent: 0 }
  }

  // ============================================
  // Resource Report
  // ============================================

  private getResourceReport(): ResourceReport {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const byType: Record<string, { count: number; transferKB: number }> = {}
    let totalTransfer = 0

    const sorted = [...resources].sort((a, b) => b.duration - a.duration)
    const slowest = sorted.slice(0, 5).map(r => ({
      name: r.name.split('/').pop() || r.name,
      duration: Math.round(r.duration),
      transferSize: r.transferSize || 0,
    }))

    for (const r of resources) {
      const ext = r.name.split('.').pop()?.toLowerCase() || 'other'
      const type = this.classifyResource(ext)
      if (!byType[type]) {byType[type] = { count: 0, transferKB: 0 }}
      byType[type].count++
      const kb = (r.transferSize || 0) / 1024
      byType[type].transferKB += kb
      totalTransfer += kb
    }

    return {
      totalResources: resources.length,
      totalTransferKB: Math.round(totalTransfer),
      byType,
      slowestResources: slowest,
    }
  }

  private classifyResource(ext: string): string {
    if (['js', 'mjs'].includes(ext)) {return 'script'}
    if (['css'].includes(ext)) {return 'stylesheet'}
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {return 'image'}
    if (['woff', 'woff2', 'ttf', 'otf'].includes(ext)) {return 'font'}
    return 'other'
  }

  // ============================================
  // FPS Report
  // ============================================

  private getFPSReport(): FPSReport {
    if (this.fpsHistory.length === 0) {
      return { current: this.fpsCurrent, avg: null, min: null, samples: 0 }
    }
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return {
      current: this.fpsCurrent,
      avg: Math.round(sum / this.fpsHistory.length),
      min: Math.min(...this.fpsHistory),
      samples: this.fpsHistory.length,
    }
  }

  // ============================================
  // Initial Metrics Capture
  // ============================================

  private captureInitialMetrics(): void {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (navEntries.length > 0) {
      const nav = navEntries[0]
      this.latestVitals.ttfb = Math.round(nav.responseStart - nav.requestStart)
      this.latestVitals.fcp = Math.round(nav.domContentLoadedEventEnd - nav.startTime)
      this.latestVitals.timestamp = Date.now()
    }
  }

  // ============================================
  // Event Emitter
  // ============================================

  private emit(type: PerformanceEventType, data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(type, data)
      } catch (err) {
        log.warn('Listener error', err)
      }
    })
  }
}

// ============================================
// Singleton Export
// ============================================

export const PerformanceMonitorService = new PerformanceMonitorServiceImpl()
