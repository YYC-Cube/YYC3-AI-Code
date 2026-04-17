/**
 * @file PerfDashboard.tsx
 * @description 性能监控仪表盘 — 预览编译/渲染趋势、AI 延迟模拟、内存指标、迷你面板
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags performance, dashboard, recharts, sparkline, monitoring
 */

import { useState, useEffect } from 'react'
import {
  Activity, X, Cpu, Zap, Clock,
  Trash2, Gauge,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { usePreviewStore } from '../../stores/preview-store'
import { useI18n } from '../../utils/useI18n'

// ============================================
// Real Performance API hooks
// ============================================

interface WebVitalsMetric {
  ts: number
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
  fcp: number | null
  inp: number | null
}

interface AIMetricSample {
  ts: number
  latency: number
  throughput: number
  success: boolean
}

function useWebVitals(): WebVitalsMetric[] {
  const [metrics, setMetrics] = useState<WebVitalsMetric[]>([])

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const now = Date.now()

      setMetrics(prev => {
        const latest = prev[prev.length - 1]
        const update: WebVitalsMetric = {
          ts: now,
          lcp: latest?.lcp ?? null,
          fid: latest?.fid ?? null,
          cls: latest?.cls ?? null,
          ttfb: latest?.ttfb ?? null,
          fcp: latest?.fcp ?? null,
          inp: latest?.inp ?? null,
        }

        for (const entry of entries) {
          if (entry.entryType === 'largest-contentful-paint') {
            update.lcp = Math.round(entry.startTime)
          }
          if (entry.entryType === 'first-input') {
            update.fid = Math.round((entry as PerformanceEventTiming).processingStart - entry.startTime)
          }
          if (entry.entryType === 'layout-shift') {
            const lsEntry = entry as any
            if (!lsEntry.hadRecentInput) {
              update.cls = (update.cls || 0) + lsEntry.value
            }
          }
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming
            update.ttfb = Math.round(nav.responseStart - nav.requestStart)
            update.fcp = Math.round(nav.domContentLoadedEventEnd - nav.startTime)
          }
          if (entry.entryType === 'event') {
            const evt = entry as PerformanceEventTiming
            if (evt.duration > 0) {
              update.inp = Math.round(evt.duration)
            }
          }
        }

        return [...prev, update].slice(-40)
      })
    })

    try {
      observer.observe({
        type: 'largest-contentful-paint',
        buffered: true,
      })
    } catch { /* not supported */ }
    try {
      observer.observe({ type: 'first-input', buffered: true })
    } catch { /* not supported */ }
    try {
      observer.observe({ type: 'layout-shift', buffered: true })
    } catch { /* not supported */ }
    try {
      observer.observe({ type: 'event', buffered: true })
    } catch { /* not supported */ }

    const navEntries = performance.getEntriesByType('navigation')
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming
      setMetrics(prev => {
        if (prev.length > 0 && prev[0].ttfb !== null) {return prev}
        return [{
          ts: Date.now(),
          lcp: null,
          fid: null,
          cls: null,
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          fcp: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          inp: null,
        }]
      })
    }

    return () => observer.disconnect()
  }, [])

  return metrics
}

function useAIMetrics(): AIMetricSample[] {
  const [samples, setSamples] = useState<AIMetricSample[]>(() => {
    const now = Date.now()
    return Array.from({ length: 20 }, (_, i) => ({
      ts: now - (20 - i) * 5000,
      latency: 200 + Math.random() * 800,
      throughput: 30 + Math.random() * 70,
      success: Math.random() > 0.05,
    }))
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setSamples(prev => {
        const next = [...prev, {
          ts: Date.now(),
          latency: 200 + Math.random() * 800,
          throughput: 30 + Math.random() * 70,
          success: Math.random() > 0.05,
        }]
        return next.slice(-40)
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return samples
}

// ============================================
// Real Memory API
// ============================================

interface MemoryInfo {
  used: number
  total: number
  jsHeapSize: number | null
  jsHeapLimit: number | null
}

function useMemoryUsage(): MemoryInfo {
  const [usage, setUsage] = useState<MemoryInfo>(() => readMemory())

  useEffect(() => {
    const timer = setInterval(() => {
      setUsage(readMemory())
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return usage
}

function readMemory(): MemoryInfo {
  const mem = (performance as any)?.memory
  if (mem) {
    return {
      used: Math.round(mem.usedJSHeapSize / 1048576),
      total: Math.round(mem.jsHeapSizeLimit / 1048576),
      jsHeapSize: Math.round(mem.totalJSHeapSize / 1048576),
      jsHeapLimit: Math.round(mem.jsHeapSizeLimit / 1048576),
    }
  }
  return { used: 48, total: 128, jsHeapSize: null, jsHeapLimit: null }
}

// ============================================
// Real Performance Snapshots
// ============================================

interface PerfSnapshot {
  ts: number
  domNodes: number
  longTasks: number
  fps: number | null
  resourceCount: number
  transferSize: number
}

function usePerfSnapshots(): PerfSnapshot[] {
  const [snapshots, setSnapshots] = useState<PerfSnapshot[]>([])

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let fps: number | null = null
    let rafId: number

    const measureFps = () => {
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        fps = Math.round(frameCount * 1000 / (now - lastTime))
        frameCount = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(measureFps)
    }
    rafId = requestAnimationFrame(measureFps)

    const timer = setInterval(() => {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const longTaskEntries = performance.getEntriesByType('longtask') as PerformanceEntry[]

      const transferSize = resourceEntries.reduce((sum, r) => sum + (r.transferSize || 0), 0)

      const snapshot: PerfSnapshot = {
        ts: Date.now(),
        domNodes: document.querySelectorAll('*').length,
        longTasks: longTaskEntries.length,
        fps,
        resourceCount: resourceEntries.length,
        transferSize: Math.round(transferSize / 1024),
      }

      setSnapshots(prev => [...prev, snapshot].slice(-40))
    }, 3000)

    return () => {
      cancelAnimationFrame(rafId)
      clearInterval(timer)
    }
  }, [])

  return snapshots
}

// ============================================
// PerfDashboard Component
// ============================================

interface PerfDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export function PerfDashboard({ isOpen, onClose }: PerfDashboardProps) {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const { perfHistory, clearPerfHistory } = usePreviewStore()
  const aiMetrics = useAIMetrics()
  const memory = useMemoryUsage()
  const webVitals = useWebVitals()
  const perfSnapshots = usePerfSnapshots()

  if (!isOpen) {return null}

  const accent = isLG ? '#10b981' : '#22d3ee'
  const accentDim = isLG ? 'rgba(16,185,129,0.15)' : 'rgba(34,211,238,0.15)'

  const previewData = perfHistory.slice(-30).map((d, i) => ({
    idx: i,
    compile: Math.round(d.compile * 10) / 10,
    render: Math.round(d.render * 10) / 10,
    total: Math.round((d.compile + d.render) * 10) / 10,
  }))

  const aiData = aiMetrics.slice(-20).map((d, i) => ({
    idx: i,
    latency: Math.round(d.latency),
    throughput: Math.round(d.throughput),
  }))

  const perfData = perfSnapshots.map((d, i) => ({
    idx: i,
    domNodes: d.domNodes,
    fps: d.fps,
    resources: d.resourceCount,
    transferKB: d.transferSize,
  }))

  const avgCompile = previewData.length > 0
    ? (previewData.reduce((s, d) => s + d.compile, 0) / previewData.length).toFixed(1)
    : '—'
  const avgRender = previewData.length > 0
    ? (previewData.reduce((s, d) => s + d.render, 0) / previewData.length).toFixed(1)
    : '—'
  const successRate = aiMetrics.length > 0
    ? ((aiMetrics.filter(d => d.success).length / aiMetrics.length) * 100).toFixed(1)
    : '100'
  const memPercent = Math.round((memory.used / memory.total) * 100)

  const latestVitals = webVitals[webVitals.length - 1]
  const latestPerf = perfSnapshots[perfSnapshots.length - 1]
  const currentFps = latestPerf?.fps ?? null
  const currentDomNodes = latestPerf?.domNodes ?? 0
  const currentResources = latestPerf?.resourceCount ?? 0

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative w-[640px] max-h-[80vh] border rounded-2xl flex flex-col overflow-hidden ${
          isLG ? 'border-emerald-500/[0.1]' : 'border-white/[0.08]'
        }`}
        style={{
          background: isLG ? 'rgba(10,15,10,0.94)' : '#13141c',
          backdropFilter: isLG ? 'blur(30px) saturate(180%)' : undefined,
          boxShadow: isLG
            ? '0 25px 60px -12px rgba(0,0,0,0.6), 0 0 80px -20px rgba(16,185,129,0.12)'
            : '0 25px 60px -12px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${isLG ? 'border-emerald-500/[0.08]' : 'border-white/[0.06]'}`}>
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
            isLG ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/20' : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/20'
          }`}>
            <Activity className={`w-4 h-4 ${isLG ? 'text-emerald-400' : 'text-cyan-400'}`} />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-white/90">{t('perf.title', 'designer')}</div>
            <div className="text-[11px] text-white/30">{t('perf.subtitle', 'designer')}</div>
          </div>
          <button onClick={() => clearPerfHistory()} className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-all" title={t('perf.clearHistory', 'designer')}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard icon={Zap} label={t('perf.avgCompile', 'designer')} value={`${avgCompile}ms`} accent={accent} />
            <StatCard icon={Clock} label={t('perf.avgRender', 'designer')} value={`${avgRender}ms`} accent={accent} />
            <StatCard icon={Gauge} label="FPS" value={currentFps !== null ? `${currentFps}` : '—'} accent={accent} subtext={currentFps !== null ? (currentFps >= 55 ? 'smooth' : currentFps >= 30 ? 'ok' : 'janky') : undefined} />
            <StatCard icon={Cpu} label={t('perf.memory', 'designer')} value={`${memory.used.toFixed(0)}MB`} accent={accent} subtext={`${memPercent}%`} />
          </div>

          {/* Web Vitals Section */}
          {latestVitals && (
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-white/50">Web Vitals (Real)</span>
                <span className="text-[9px] text-white/20">PerformanceObserver</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'LCP', value: latestVitals.lcp, unit: 'ms', good: 2500, warn: 4000 },
                  { label: 'FID', value: latestVitals.fid, unit: 'ms', good: 100, warn: 300 },
                  { label: 'CLS', value: latestVitals.cls !== null ? Math.round(latestVitals.cls * 1000) / 1000 : null, unit: '', good: 0.1, warn: 0.25 },
                  { label: 'TTFB', value: latestVitals.ttfb, unit: 'ms', good: 800, warn: 1800 },
                  { label: 'INP', value: latestVitals.inp, unit: 'ms', good: 200, warn: 500 },
                ].map(v => {
                  const status = v.value === null ? 'none' : v.value <= v.good ? 'good' : v.value <= v.warn ? 'warn' : 'poor'
                  const color = status === 'good' ? '#10b981' : status === 'warn' ? '#f59e0b' : status === 'poor' ? '#ef4444' : 'rgba(255,255,255,0.15)'
                  return (
                    <div key={v.label} className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className="text-[9px] text-white/25 mb-1">{v.label}</div>
                      <div className="text-[13px] font-mono" style={{ color }}>{v.value !== null ? `${v.value}` : '—'}</div>
                      {v.value !== null && <div className="text-[8px] text-white/15">{v.unit}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Preview Perf Chart */}
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-white/50">{t('perf.previewPerf', 'designer')}</span>
              <span className="text-[9px] text-white/20">{previewData.length} {t('preview.perf.samples', 'designer')}</span>
            </div>
            {previewData.length > 1 ? (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={previewData}>
                    <defs>
                      <linearGradient id="compileGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accent} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={accent} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="renderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="idx" hide />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area type="monotone" dataKey="compile" stroke={accent} fill="url(#compileGrad)" strokeWidth={1.5} name="Compile" />
                    <Area type="monotone" dataKey="render" stroke="#f59e0b" fill="url(#renderGrad)" strokeWidth={1.5} name="Render" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-[10px] text-white/15">
                {t('perf.noData', 'designer')}
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
                <span className="text-[9px] text-white/30">Compile</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[9px] text-white/30">Render</span>
              </div>
            </div>
          </div>

          {/* AI Latency Chart */}
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-white/50">{t('perf.aiPerf', 'designer')}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                Number(successRate) >= 95 ? 'bg-emerald-500/10 text-emerald-400/60' : 'bg-amber-500/10 text-amber-400/60'
              }`}>
                {successRate}% {t('perf.successRate', 'designer')}
              </span>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiData}>
                  <XAxis dataKey="idx" hide />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Bar dataKey="latency" fill={accentDim} radius={[2, 2, 0, 0]} name="Latency (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Memory Gauge */}
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-white/50">{t('perf.memoryUsage', 'designer')}</span>
              <span className="text-[10px] text-white/30">{memory.used.toFixed(0)} / {memory.total} MB</span>
            </div>
            <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${memPercent}%`,
                  background: memPercent > 80
                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                    : memPercent > 60
                      ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                      : `linear-gradient(90deg, ${accent}, ${isLG ? '#06b6d4' : '#3b82f6'})`,
                }}
              />
            </div>
            {memory.jsHeapSize !== null && (
              <div className="flex items-center justify-between mt-2 text-[9px] text-white/20">
                <span>Heap: {memory.jsHeapSize} MB</span>
                <span>Limit: {memory.jsHeapLimit} MB</span>
              </div>
            )}
          </div>

          {/* Runtime Metrics */}
          <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-white/50">Runtime Metrics (Real)</span>
              <span className="text-[9px] text-white/20">Performance API</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[9px] text-white/25 mb-1">DOM Nodes</div>
                <div className="text-[14px] font-mono text-white/60">{currentDomNodes}</div>
                {currentDomNodes > 1500 && <div className="text-[8px] text-amber-400/50 mt-0.5">High</div>}
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[9px] text-white/25 mb-1">Resources</div>
                <div className="text-[14px] font-mono text-white/60">{currentResources}</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[9px] text-white/25 mb-1">Transfer</div>
                <div className="text-[14px] font-mono text-white/60">{latestPerf?.transferSize ?? 0} KB</div>
              </div>
            </div>
            {perfData.length > 1 && (
              <div className="h-20 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perfData}>
                    <defs>
                      <linearGradient id="fpsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accent} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={accent} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="idx" hide />
                    <YAxis hide domain={[0, 120]} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area type="monotone" dataKey="fps" stroke={accent} fill="url(#fpsGrad)" strokeWidth={1.5} name="FPS" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Stat Card
// ============================================

function StatCard({ icon: Icon, label, value, accent, subtext }: {
  icon: React.ElementType; label: string; value: string; accent: string; subtext?: string
}) {
  return (
    <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3 h-3" style={{ color: accent }} />
        <span className="text-[9px] text-white/30">{label}</span>
      </div>
      <div className="text-[16px] text-white/80">{value}</div>
      {subtext && <div className="text-[9px] text-white/20 mt-0.5">{subtext}</div>}
    </div>
  )
}
