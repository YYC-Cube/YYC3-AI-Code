/**
 * @file use-performance-monitor.ts
 * @description Performance monitoring hook for Core Web Vitals and custom metrics
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

import { useEffect, useState, useCallback } from 'react'
import { createLogger } from '../utils/logger'

const log = createLogger('PerformanceMonitor')

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte

  // Navigation metrics
  domContentLoaded?: number
  loadComplete?: number
  firstPaint?: number

  // Resource metrics
  totalResources?: number
  totalResourceSize?: number

  // Custom metrics
  renderTime?: number
  interactionTime?: number

  // Timestamps
  timestamp: number
}

export interface PerformanceAlert {
  type: 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb' | 'custom'
  severity: 'info' | 'warning' | 'error'
  message: string
  value: number
  threshold: number
  timestamp: number
}

const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
}

export function usePerformanceMonitor(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    timestamp: Date.now(),
  })
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)

  // Measure Core Web Vitals
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.performance) {return}

    setIsMonitoring(true)

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach(entry => {
        if (entry.entryType === 'largest-contentful-paint') {
          const lcp = entry.startTime
          setMetrics(prev => ({ ...prev, lcp, timestamp: Date.now() }))
          checkThreshold('lcp', lcp)
        }
        if (entry.entryType === 'first-input') {
          const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime
          setMetrics(prev => ({ ...prev, fid, timestamp: Date.now() }))
          checkThreshold('fid', fid)
        }
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          const cls = (entry as any).value
          setMetrics(prev => ({ ...prev, cls, timestamp: Date.now() }))
          checkThreshold('cls', cls)
        }
        if (entry.entryType === 'paint' && (entry as any).name === 'first-contentful-paint') {
          const fcp = entry.startTime
          setMetrics(prev => ({ ...prev, fcp, timestamp: Date.now() }))
          checkThreshold('fcp', fcp)
        }
      })
    })

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      observer.observe({ type: 'first-input', buffered: true })
      observer.observe({ type: 'layout-shift', buffered: true })
      observer.observe({ type: 'paint', buffered: true })
    } catch (e) {
      log.warn('PerformanceObserver not fully supported:', e)
    }

    // Measure navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart
      const domContentLoaded = navigation.domContentLoadedEventEnd - (navigation as any).navigationStart
      const loadComplete = navigation.loadEventEnd - (navigation as any).navigationStart
      
      setMetrics(prev => ({
        ...prev,
        ttfb,
        domContentLoaded,
        loadComplete,
        timestamp: Date.now(),
      }))
      
      checkThreshold('ttfb', ttfb)
    }

    // Measure resources
    const resources = performance.getEntriesByType('resource')
    const totalResources = resources.length
    const totalResourceSize = resources.reduce((sum, entry) => {
      return sum + (entry as any).transferSize || 0
    }, 0)

    setMetrics(prev => ({
      ...prev,
      totalResources,
      totalResourceSize,
      timestamp: Date.now(),
    }))

    return () => {
      observer.disconnect()
      setIsMonitoring(false)
    }
  }, [enabled])

  // Check performance against thresholds
  const checkThreshold = useCallback((type: keyof typeof PERFORMANCE_THRESHOLDS, value: number) => {
    const threshold = PERFORMANCE_THRESHOLDS[type]
    if (!threshold) {return}

    let severity: PerformanceAlert['severity'] = 'info'
    let message = ''

    if (value <= threshold.good) {
      message = `${type.toUpperCase()} performance is good: ${Math.round(value)}ms`
      severity = 'info'
    } else if (value <= threshold.needsImprovement) {
      message = `${type.toUpperCase()} needs improvement: ${Math.round(value)}ms (threshold: ${threshold.good}ms)`
      severity = 'warning'
    } else {
      message = `${type.toUpperCase()} performance is poor: ${Math.round(value)}ms (threshold: ${threshold.needsImprovement}ms)`
      severity = 'error'
    }

    const alert: PerformanceAlert = {
      type,
      severity,
      message,
      value,
      threshold: threshold.good,
      timestamp: Date.now(),
    }

    setAlerts(prev => {
      // Avoid duplicate alerts
      const existing = prev.some(
        a => a.type === type && Math.abs(a.timestamp - alert.timestamp) < 1000
      )
      if (existing) {return prev}
      return [...prev, alert].slice(-50) // Keep only last 50 alerts
    })
  }, [])

  // Measure render time
  const measureRender = useCallback((name: string, fn: () => void) => {
    if (!enabled) {return fn()}
    
    const start = performance.now()
    fn()
    const end = performance.now()
    const renderTime = end - start
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      timestamp: Date.now(),
    }))

    if (renderTime > 16) { // 60fps = 16.67ms
      setAlerts(prev => [...prev, {
        type: 'custom' as const,
        severity: 'warning' as const,
        message: `Slow render detected for ${name}: ${Math.round(renderTime)}ms`,
        value: renderTime,
        threshold: 16,
        timestamp: Date.now(),
      }].slice(-50) as any)
    }

    return renderTime
  }, [enabled])

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  // Get performance score
  const getPerformanceScore = useCallback(() => {
    const scores: number[] = []
    
    if (metrics.lcp) {
      const lcpScore = metrics.lcp <= PERFORMANCE_THRESHOLDS.lcp.good ? 100 :
                      metrics.lcp <= PERFORMANCE_THRESHOLDS.lcp.needsImprovement ? 50 : 0
      scores.push(lcpScore)
    }
    
    if (metrics.fid) {
      const fidScore = metrics.fid <= PERFORMANCE_THRESHOLDS.fid.good ? 100 :
                      metrics.fid <= PERFORMANCE_THRESHOLDS.fid.needsImprovement ? 50 : 0
      scores.push(fidScore)
    }
    
    if (metrics.cls) {
      const clsScore = metrics.cls <= PERFORMANCE_THRESHOLDS.cls.good ? 100 :
                      metrics.cls <= PERFORMANCE_THRESHOLDS.cls.needsImprovement ? 50 : 0
      scores.push(clsScore)
    }
    
    if (scores.length === 0) {return null}
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [metrics])

  return {
    metrics,
    alerts,
    isMonitoring,
    measureRender,
    clearAlerts,
    getPerformanceScore,
  }
}
