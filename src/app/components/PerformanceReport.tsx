/**
 * @file PerformanceReport.tsx
 * @description Performance report component displaying metrics and alerts
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { cn } from './ui/utils'
import { PerformanceMetrics, PerformanceAlert } from '@/app/hooks/use-performance-monitor'

interface PerformanceReportProps {
  metrics: PerformanceMetrics
  alerts: PerformanceAlert[]
  onClose?: () => void
  onClearAlerts?: () => void
  onExport?: () => void
}

export function PerformanceReport({
  metrics,
  alerts,
  onClose,
  onClearAlerts,
  onExport,
}: PerformanceReportProps) {
  const [expandedMetrics, setExpandedMetrics] = useState(true)
  const [expandedAlerts, setExpandedAlerts] = useState(true)
  const [score, setScore] = useState<number | null>(null)

  // Calculate overall performance score
  useEffect(() => {
    const scores: number[] = []
    
    if (metrics.lcp) {
      scores.push(getMetricScore('lcp', metrics.lcp))
    }
    if (metrics.fid) {
      scores.push(getMetricScore('fid', metrics.fid))
    }
    if (metrics.cls) {
      scores.push(getMetricScore('cls', metrics.cls))
    }
    if (metrics.fcp) {
      scores.push(getMetricScore('fcp', metrics.fcp))
    }
    if (metrics.ttfb) {
      scores.push(getMetricScore('ttfb', metrics.ttfb))
    }
    
    if (scores.length > 0) {
      setScore(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length))
    }
  }, [metrics])

  const getMetricScore = (type: string, value: number): number => {
    const thresholds: Record<string, { good: number; needsImprovement: number }> = {
      lcp: { good: 2500, needsImprovement: 4000 },
      fid: { good: 100, needsImprovement: 300 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      fcp: { good: 1800, needsImprovement: 3000 },
      ttfb: { good: 800, needsImprovement: 1800 },
    }
    
    const threshold = thresholds[type]
    if (!threshold) {return 100}
    
    if (value <= threshold.good) {return 100}
    if (value <= threshold.needsImprovement) {return 50}
    return 0
  }

  const getMetricStatus = (score: number) => {
    if (score >= 90) {return { label: '优秀', color: 'bg-green-500' }}
    if (score >= 50) {return { label: '良好', color: 'bg-yellow-500' }}
    return { label: '需改进', color: 'bg-red-500' }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {return '0 B'}
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">性能报告</h2>
            <p className="text-sm text-muted-foreground mt-1">
              更新时间: {new Date(metrics.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onClearAlerts && alerts.length > 0 && (
              <Button variant="outline" size="sm" onClick={onClearAlerts}>
                清除告警
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                导出报告
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                关闭
              </Button>
            )}
          </div>
        </div>

        {/* Performance Score */}
        {score !== null && (
          <div className="p-6 border-b bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">总体性能评分</h3>
              <Badge variant="outline" className={cn('text-lg px-4 py-2', getMetricStatus(score).color)}>
                {score}
              </Badge>
            </div>
            <Progress value={score} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {score >= 90 ? '🎉 性能优秀！' : score >= 50 ? '👍 性能良好，有提升空间' : '⚠️ 需要优化'}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {/* Core Web Vitals */}
          <div className="p-6">
            <div
              className="flex items-center justify-between cursor-pointer mb-4"
              onClick={() => setExpandedMetrics(!expandedMetrics)}
            >
              <h3 className="text-lg font-semibold">Core Web Vitals</h3>
              <Button variant="ghost" size="sm">
                {expandedMetrics ? '收起' : '展开'}
              </Button>
            </div>

            {expandedMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* LCP */}
                {metrics.lcp !== undefined && (
                  <MetricCard
                    title="LCP (Largest Contentful Paint)"
                    value={`${Math.round(metrics.lcp)}ms`}
                    score={getMetricScore('lcp', metrics.lcp)}
                    thresholds={{ good: 2500, needsImprovement: 4000 }}
                    description="最大内容绘制时间"
                  />
                )}

                {/* FID */}
                {metrics.fid !== undefined && (
                  <MetricCard
                    title="FID (First Input Delay)"
                    value={`${Math.round(metrics.fid)}ms`}
                    score={getMetricScore('fid', metrics.fid)}
                    thresholds={{ good: 100, needsImprovement: 300 }}
                    description="首次输入延迟"
                  />
                )}

                {/* CLS */}
                {metrics.cls !== undefined && (
                  <MetricCard
                    title="CLS (Cumulative Layout Shift)"
                    value={metrics.cls.toFixed(3)}
                    score={getMetricScore('cls', metrics.cls)}
                    thresholds={{ good: 0.1, needsImprovement: 0.25 }}
                    description="累积布局偏移"
                  />
                )}

                {/* FCP */}
                {metrics.fcp !== undefined && (
                  <MetricCard
                    title="FCP (First Contentful Paint)"
                    value={`${Math.round(metrics.fcp)}ms`}
                    score={getMetricScore('fcp', metrics.fcp)}
                    thresholds={{ good: 1800, needsImprovement: 3000 }}
                    description="首次内容绘制"
                  />
                )}

                {/* TTFB */}
                {metrics.ttfb !== undefined && (
                  <MetricCard
                    title="TTFB (Time to First Byte)"
                    value={`${Math.round(metrics.ttfb)}ms`}
                    score={getMetricScore('ttfb', metrics.ttfb)}
                    thresholds={{ good: 800, needsImprovement: 1800 }}
                    description="首字节时间"
                  />
                )}

                {/* Resource Metrics */}
                {metrics.totalResources !== undefined && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-semibold mb-2">资源统计</h4>
                    <p className="text-sm text-muted-foreground">
                      总资源数: <span className="font-mono">{metrics.totalResources}</span>
                    </p>
                    {metrics.totalResourceSize !== undefined && (
                      <p className="text-sm text-muted-foreground mt-1">
                        总大小: <span className="font-mono">{formatBytes(metrics.totalResourceSize)}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="p-6 border-t">
              <div
                className="flex items-center justify-between cursor-pointer mb-4"
                onClick={() => setExpandedAlerts(!expandedAlerts)}
              >
                <h3 className="text-lg font-semibold">
                  性能告警 ({alerts.length})
                </h3>
                <Button variant="ghost" size="sm">
                  {expandedAlerts ? '收起' : '展开'}
                </Button>
              </div>

              {expandedAlerts && (
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <AlertCard key={index} alert={alert} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  score: number
  thresholds: { good: number; needsImprovement: number }
  description: string
}

function MetricCard({ title, value, score, thresholds, description }: MetricCardProps) {
  const status = score >= 90 ? '优秀' : score >= 50 ? '良好' : '需改进'
  const color = score >= 90 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        <Badge variant="outline" className={cn('text-xs', color)}>
          {status}
        </Badge>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <Progress value={score} className="h-2" />
    </div>
  )
}

function AlertCard({ alert }: { alert: PerformanceAlert }) {
  const severityColors = {
    info: 'border-blue-500 bg-blue-50',
    warning: 'border-yellow-500 bg-yellow-50',
    error: 'border-red-500 bg-red-50',
  }

  const severityIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
  }

  return (
    <div className={cn('p-3 border-l-4 rounded', severityColors[alert.severity])}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{severityIcons[alert.severity]}</span>
        <div className="flex-1">
          <p className="font-medium text-sm">{alert.message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(alert.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
