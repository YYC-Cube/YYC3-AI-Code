/**
 * @file ArchitecturePage.tsx
 * @description YYC³ AI Code System Architecture Overview Dashboard (i18n-enabled)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-13
 * @updated 2026-03-14
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags architecture, dashboard, visualization, i18n
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowLeft, Layers, Monitor, Workflow, Brain, Database, Cpu,
  ChevronDown, ChevronRight, CheckCircle2,
  Clock, Rocket, Globe, Server, Shield, Zap, BarChart3,
  Activity, Code2, GitBranch, Boxes, ArrowRight, Sparkles,
  Target, TrendingUp, Eye, Wrench, RefreshCw, Bell, Lock,
  Package,
} from 'lucide-react'
import { motion } from 'motion/react'
import {
  ARCHITECTURE_LAYERS,
  TECH_STACK,
  ARCHITECTURE_PHASES,
  DESIGN_PRINCIPLES,
  type ArchitectureLayer,
  type TechStackItem,
  type ArchitecturePhase,
} from '../types/architecture'
import { PerformanceMonitorService, type PerformanceReport } from '../services/performance-monitor-service'
import { TechStackVersionManager, type VersionReport } from '../services/tech-stack-version-manager'
import { useLiquidGlass } from '../utils/liquid-glass'
import { useI18n } from '../utils/useI18n'

/* ================================================================
   Icon Map
   ================================================================ */

const LAYER_ICONS: Record<string, React.ElementType> = {
  Monitor, Workflow, Brain, Database, Cpu,
}

const PHASE_ICONS: Record<string, React.ElementType> = {
  mvp: Server,
  micro: Boxes,
  cloud: Globe,
  global: Rocket,
}

const CATEGORY_COLORS: Record<string, string> = {
  frontend: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  backend: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  devtools: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  ai: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  infra: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
}

/* ================================================================
   Sub-Components
   ================================================================ */

function LayerCard({ layer, index, expanded, onToggle, t }: {
  layer: ArchitectureLayer
  index: number
  expanded: boolean
  onToggle: () => void
  t: (key: string, nsOrOpts?: any, opts?: any) => string
}) {
  const IconComp = LAYER_ICONS[layer.icon] || Layers

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center border"
            style={{
              backgroundColor: layer.color + '15',
              borderColor: layer.color + '30',
            }}
          >
            <IconComp className="w-4 h-4" style={{ color: layer.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-white/85">{layer.nameCn}</span>
              <span className="text-[9px] text-white/20 font-mono">{layer.name}</span>
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">{layer.description}</div>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25">
            {t('layers.moduleCount', 'architecture', { count: layer.modules.length })}
          </span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-white/20" /> : <ChevronRight className="w-3.5 h-3.5 text-white/20" />}
        </div>
      </button>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-4 pb-3 pt-1 border-x border-b border-white/[0.06] rounded-b-xl bg-white/[0.01] -mt-1"
        >
          <div className="flex flex-wrap gap-1.5 mt-1">
            {layer.modules.map(mod => (
              <span
                key={mod}
                className="text-[10px] px-2 py-1 rounded-md border"
                style={{
                  color: layer.color,
                  backgroundColor: layer.color + '08',
                  borderColor: layer.color + '20',
                }}
              >
                {mod}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function TechStackTable({ items, filter, t }: { items: TechStackItem[]; filter: string; t: (key: string, nsOrOpts?: any, opts?: any) => string }) {
  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)

  const STATUS_BADGES: Record<string, string> = {
    current: 'text-emerald-400/60 bg-emerald-500/[0.06] border-emerald-500/15',
    updatable: 'text-amber-400/60 bg-amber-500/[0.06] border-amber-500/15',
    deprecated: 'text-red-400/60 bg-red-500/[0.06] border-red-500/15',
    beta: 'text-blue-400/60 bg-blue-500/[0.06] border-blue-500/15',
  }
  const STATUS_LABELS: Record<string, string> = {
    current: t('techStatus.current', 'architecture'),
    updatable: t('techStatus.updatable', 'architecture'),
    deprecated: t('techStatus.deprecated', 'architecture'),
    beta: t('techStatus.beta', 'architecture'),
  }
  const CATEGORY_LABELS: Record<string, string> = {
    frontend: t('category.frontend', 'architecture'),
    backend: t('category.backend', 'architecture'),
    devtools: t('category.devtools', 'architecture'),
    ai: t('category.ai', 'architecture'),
    infra: t('category.infra', 'architecture'),
  }
  const STRATEGY_ICONS: Record<string, React.ElementType> = {
    auto: RefreshCw, manual: Wrench, locked: Lock,
  }

  return (
    <div className="space-y-1.5">
      {filtered.map(item => {
        const StrategyIcon = item.updateStrategy ? STRATEGY_ICONS[item.updateStrategy] || Package : Package
        return (
          <div key={item.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all group">
            <div className={`text-[9px] px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[item.category]}`}>
              {CATEGORY_LABELS[item.category]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-white/70">{item.name}</span>
                <span className="text-[9px] text-white/15 font-mono">v{item.version}</span>
                {item.latestVersion && item.latestVersion !== item.version && item.latestVersion !== 'Latest' && (
                  <span className="text-[8px] text-amber-400/40 font-mono">&rarr; v{item.latestVersion}</span>
                )}
              </div>
              <div className="text-[10px] text-white/25">{item.purpose} — {item.reason}</div>
            </div>
            {item.status && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded border shrink-0 ${STATUS_BADGES[item.status] || ''}`}>
                {STATUS_LABELS[item.status] || item.status}
              </span>
            )}
            {item.updateStrategy && (
              <StrategyIcon className="w-3 h-3 text-white/15 shrink-0" title={`${t('techStatus.strategy', 'architecture')}: ${item.updateStrategy}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PhaseTimeline({ phases, t }: { phases: ArchitecturePhase[]; t: (key: string, nsOrOpts?: any, opts?: any) => string }) {
  return (
    <div className="space-y-3">
      {phases.map((phase, i) => {
        const Icon = PHASE_ICONS[phase.id] || Rocket
        const isActive = phase.status === 'current'
        const isDone = phase.status === 'completed'

        return (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className={`relative flex gap-3 px-4 py-3 rounded-xl border transition-all ${
              isActive
                ? 'border-indigo-500/25 bg-indigo-500/[0.04]'
                : isDone
                ? 'border-emerald-500/15 bg-emerald-500/[0.02]'
                : 'border-white/[0.06] bg-white/[0.01]'
            }`}
          >
            {/* Timeline connector */}
            {i < phases.length - 1 && (
              <div className="absolute left-[30px] top-[48px] w-0.5 h-[calc(100%-12px)] bg-white/[0.06]" />
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isActive
                ? 'bg-indigo-500/15 border-indigo-500/30'
                : isDone
                ? 'bg-emerald-500/15 border-emerald-500/30'
                : 'bg-white/[0.04] border-white/[0.08]'
            }`}>
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-white/25'}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[12px] ${isActive ? 'text-indigo-300' : isDone ? 'text-emerald-400/70' : 'text-white/50'}`}>
                  {phase.name}
                </span>
                <span className="text-[9px] text-white/20">{phase.quarter}</span>
                {isActive && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400/80 border border-indigo-500/20">
                    {t('phase.currentPhase', 'architecture')}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-white/25 mt-0.5">{phase.description}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px] text-white/15">{t('phase.deploy', 'architecture')}: {phase.deployMethod}</span>
                <span className="text-[9px] text-white/15">{t('phase.targetUsers', 'architecture')}: {phase.targetUsers}</span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function DataFlowDiagram({ t }: { t: (key: string, nsOrOpts?: any, opts?: any) => string }) {
  const steps = [
    { label: t('dataflow.userInput', 'architecture'), sub: t('dataflow.userInputSub', 'architecture'), icon: Monitor, color: '#8b5cf6' },
    { label: t('dataflow.intentRecognition', 'architecture'), sub: t('dataflow.intentSub', 'architecture'), icon: Brain, color: '#06b6d4' },
    { label: t('dataflow.routeDecision', 'architecture'), sub: t('dataflow.routeSub', 'architecture'), icon: Workflow, color: '#6366f1' },
    { label: t('dataflow.execution', 'architecture'), sub: t('dataflow.executionSub', 'architecture'), icon: Zap, color: '#f59e0b' },
    { label: t('dataflow.persistence', 'architecture'), sub: t('dataflow.persistenceSub', 'architecture'), icon: Database, color: '#10b981' },
  ]

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center shrink-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] min-w-[100px]"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{ backgroundColor: step.color + '15', borderColor: step.color + '30' }}
            >
              <step.icon className="w-3.5 h-3.5" style={{ color: step.color }} />
            </div>
            <span className="text-[10px] text-white/60">{step.label}</span>
            <span className="text-[8px] text-white/20">{step.sub}</span>
          </motion.div>
          {i < steps.length - 1 && (
            <ArrowRight className="w-3.5 h-3.5 text-white/10 shrink-0 mx-0.5" />
          )}
        </div>
      ))}
    </div>
  )
}

function PerformanceCard({ report, t }: { report: PerformanceReport; t: (key: string, nsOrOpts?: any, opts?: any) => string }) {
  const statusColors: Record<string, string> = {
    excellent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    good: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'needs-improvement': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    poor: 'text-red-400 bg-red-500/10 border-red-500/20',
  }
  const statusLabels: Record<string, string> = {
    excellent: t('performance.status.excellent', 'architecture'),
    good: t('performance.status.good', 'architecture'),
    'needs-improvement': t('performance.status.needsImprovement', 'architecture'),
    poor: t('performance.status.poor', 'architecture'),
  }

  const latest = report.snapshots[report.snapshots.length - 1]

  return (
    <div className="space-y-3">
      {/* Score overview */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={report.score >= 90 ? '#10b981' : report.score >= 70 ? '#3b82f6' : report.score >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="4"
              strokeDasharray={`${(report.score / 100) * 175.9} 175.9`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[14px] text-white/80">{report.score}</span>
          </div>
        </div>
        <div>
          <div className={`text-[10px] px-2 py-0.5 rounded border ${statusColors[report.status]}`}>
            {statusLabels[report.status]}
          </div>
          <div className="text-[10px] text-white/25 mt-1">
            {t('performance.snapshots', 'architecture', { count: report.snapshots.length })}
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      {latest && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: t('performance.metrics.domNodes', 'architecture'), value: String(latest.domNodes), icon: Code2 },
            { label: t('performance.metrics.ttfb', 'architecture'), value: latest.ttfb != null ? latest.ttfb + 'ms' : '-', icon: Clock },
            { label: t('performance.metrics.renderCount', 'architecture'), value: String(latest.componentRenderCount), icon: Activity },
            { label: t('performance.metrics.memory', 'architecture'), value: latest.memoryUsed ? (latest.memoryUsed / 1048576).toFixed(1) + ' MB' : '-', icon: BarChart3 },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <m.icon className="w-3 h-3 text-white/20" />
              <div>
                <div className="text-[11px] text-white/50">{m.value}</div>
                <div className="text-[8px] text-white/15">{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-1">
        {report.recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[10px] text-white/30">
            <Target className="w-3 h-3 text-amber-400/40 shrink-0 mt-0.5" />
            <span>{rec}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   Naming Convention Reference
   ================================================================ */

function NamingConventionCard({ t }: { t: (key: string, nsOrOpts?: any, opts?: any) => string }) {
  const rules = [
    { pattern: 'kebab-case', example: 'user-service.ts', scope: t('standards.naming.fileNaming', 'architecture') },
    { pattern: 'PascalCase', example: 'UserProfile', scope: t('standards.naming.componentNaming', 'architecture') },
    { pattern: 'camelCase', example: 'getUserById', scope: t('standards.naming.functionNaming', 'architecture') },
    { pattern: 'UPPER_SNAKE', example: 'MAX_RETRY_COUNT', scope: t('standards.naming.constantNaming', 'architecture') },
  ]

  return (
    <div className="space-y-1.5">
      {rules.map(r => (
        <div key={r.pattern} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <code className="text-[10px] text-cyan-400/60 bg-cyan-500/[0.06] px-1.5 py-0.5 rounded">{r.pattern}</code>
          <span className="text-[10px] text-white/40 flex-1">{r.scope}</span>
          <code className="text-[10px] text-white/25 font-mono">{r.example}</code>
        </div>
      ))}
    </div>
  )
}

/* ================================================================
   Main Page
   ================================================================ */

type SectionKey = 'layers' | 'dataflow' | 'techstack' | 'roadmap' | 'performance' | 'standards'

export function ArchitecturePage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [expandedLayer, setExpandedLayer] = useState<string | null>('interaction')
  const [techFilter, setTechFilter] = useState('all')
  const [activeSection, setActiveSection] = useState<SectionKey>('layers')
  const [perfReport, setPerfReport] = useState<PerformanceReport | null>(null)
  const [techVersionReport, setTechVersionReport] = useState<VersionReport | null>(null)
  const { isLG, navSurfaceStyle, cardLiftClass, shimmerClass } = useLiquidGlass()

  useEffect(() => {
    // Collect a performance snapshot on mount
    PerformanceMonitorService.collectSnapshot()
    setPerfReport(PerformanceMonitorService.getReport())
    setTechVersionReport(TechStackVersionManager.generateReport())
  }, [])

  const sections: { key: SectionKey; label: string; icon: React.ElementType }[] = [
    { key: 'layers', label: t('sections.layers', 'architecture'), icon: Layers },
    { key: 'dataflow', label: t('sections.dataflow', 'architecture'), icon: GitBranch },
    { key: 'techstack', label: t('sections.techstack', 'architecture'), icon: Boxes },
    { key: 'roadmap', label: t('sections.roadmap', 'architecture'), icon: TrendingUp },
    { key: 'performance', label: t('sections.performance', 'architecture'), icon: Activity },
    { key: 'standards', label: t('sections.standards', 'architecture'), icon: Shield },
  ]

  return (
    <div className="min-h-screen text-white" style={{ background: isLG ? '#060a06' : '#0a0a12' }}>
      {/* Header */}
      <header className={`flex items-center gap-3 px-6 py-4 border-b border-white/[0.06] ${isLG ? 'lg-arch-header' : ''}`}>
        <button
          onClick={() => navigate('/')}
          className={`p-2 rounded-lg text-white/40 hover:text-white/70 transition-all ${isLG ? 'hover:bg-white/[0.06] lg-btn-ghost' : 'hover:bg-white/[0.06]'}`}
          aria-label={t('navigation.home', 'common')}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
          isLG
            ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/25'
            : 'bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border-violet-500/25'
        }`}>
          <Sparkles className={`w-4 h-4 ${isLG ? 'text-emerald-400' : 'text-violet-400'}`} />
        </div>
        <div className="flex-1">
          <div className="text-[14px] text-white/85">{t('header.title', 'architecture')}</div>
          <div className="text-[10px] text-white/25">{t('header.subtitle', 'architecture')}</div>
        </div>
        <button
          onClick={() => navigate('/designer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all border ${
            isLG
              ? 'text-emerald-400/70 hover:text-emerald-400 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] border-emerald-500/15'
              : 'text-indigo-400/70 hover:text-indigo-400 bg-indigo-500/[0.06] hover:bg-indigo-500/[0.12] border-indigo-500/15'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> {t('header.enterDesigner', 'architecture')}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar nav */}
        <nav className={`w-48 border-r border-white/[0.06] p-3 space-y-1 shrink-0 min-h-[calc(100vh-57px)] ${isLG ? 'lg-arch-sidebar' : ''}`}>
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all ${
                activeSection === key
                  ? isLG
                    ? 'text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/15'
                    : 'text-violet-400 bg-violet-500/[0.08] border border-violet-500/15'
                  : 'text-white/35 hover:text-white/55 hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}

          {/* Quick stats */}
          <div className={`!mt-6 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 ${isLG ? 'lg-arch-card' : ''}`}>
            <div className="text-[9px] text-white/20 uppercase tracking-wider">{t('sidebar.projectOverview', 'architecture')}</div>
            {[
              { label: t('sidebar.layerCount', 'architecture'), value: t('sidebar.fiveLayers', 'architecture') },
              { label: t('sidebar.techComponents', 'architecture'), value: t('sidebar.itemCount', 'architecture', { count: TECH_STACK.length }) },
              { label: t('sidebar.evolutionPhases', 'architecture'), value: t('sidebar.phaseCount', 'architecture', { count: ARCHITECTURE_PHASES.length }) },
              { label: t('sidebar.currentPhase', 'architecture'), value: t('sidebar.mvp', 'architecture') },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-[9px] text-white/20">{s.label}</span>
                <span className="text-[10px] text-white/40">{s.value}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-57px)]">
          {activeSection === 'layers' && (
            <div className="space-y-4 max-w-3xl">
              <div className="mb-4">
                <h2 className="text-[16px] text-white/80 mb-1">{t('layers.title', 'architecture')}</h2>
                <p className="text-[11px] text-white/25">{t('layers.subtitle', 'architecture')}</p>
              </div>
              {ARCHITECTURE_LAYERS.map((layer, i) => (
                <LayerCard
                  key={layer.id}
                  layer={layer}
                  index={i}
                  expanded={expandedLayer === layer.id}
                  onToggle={() => setExpandedLayer(prev => prev === layer.id ? null : layer.id)}
                  t={t}
                />
              ))}

              {/* Interface spec hint */}
              <div className="px-4 py-3 rounded-xl bg-indigo-500/[0.03] border border-indigo-500/10 flex items-start gap-2 mt-4">
                <Eye className="w-3.5 h-3.5 text-indigo-400/50 shrink-0 mt-0.5" />
                <div className="text-[10px] text-white/25">
                  <strong className="text-indigo-400/40">{t('layers.interfaceSpec', 'architecture')}</strong>
                  {' '}{t('layers.interfaceDesc', 'architecture')} (<code className="text-cyan-400/40 bg-white/[0.03] px-1 py-0.5 rounded">UserInteractionLayer</code>, <code className="text-cyan-400/40 bg-white/[0.03] px-1 py-0.5 rounded">FunctionLogicLayer</code>, <code className="text-cyan-400/40 bg-white/[0.03] px-1 py-0.5 rounded">AILayer</code>), {t('layers.interfaceLocation', 'architecture')} <code className="text-cyan-400/40 bg-white/[0.03] px-1 py-0.5 rounded">src/app/types/architecture.ts</code>.
                </div>
              </div>

              {/* Design Principles */}
              <div className="mt-6">
                <div className="text-[12px] text-white/45 mb-3">{t('layers.designPrinciples', 'architecture')}</div>
                <div className="grid grid-cols-2 gap-3">
                  {DESIGN_PRINCIPLES.map((p, i) => {
                    const PIcon = LAYER_ICONS[p.icon] || ({ Layers, Boxes, Wrench, Shield } as Record<string, React.ElementType>)[p.icon] || Layers
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center border"
                            style={{ backgroundColor: p.color + '12', borderColor: p.color + '25' }}
                          >
                            <PIcon className="w-3 h-3" style={{ color: p.color }} />
                          </div>
                          <div>
                            <span className="text-[11px] text-white/65">{p.title}</span>
                            <span className="text-[8px] text-white/15 ml-1.5">{p.titleEn}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-white/25 pl-8">{p.description}</div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'dataflow' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-[16px] text-white/80 mb-1">{t('dataflow.title', 'architecture')}</h2>
                <p className="text-[11px] text-white/25">{t('dataflow.subtitle', 'architecture')}</p>
              </div>
              <DataFlowDiagram t={t} />

              {/* Detailed flow description */}
              <div className="space-y-2">
                {[
                  { phase: t('dataflow.detail.multiModal', 'architecture'), desc: t('dataflow.detail.multiModalDesc', 'architecture'), color: '#8b5cf6' },
                  { phase: t('dataflow.detail.nlp', 'architecture'), desc: t('dataflow.detail.nlpDesc', 'architecture'), color: '#06b6d4' },
                  { phase: t('dataflow.detail.routing', 'architecture'), desc: t('dataflow.detail.routingDesc', 'architecture'), color: '#6366f1' },
                  { phase: t('dataflow.detail.state', 'architecture'), desc: t('dataflow.detail.stateDesc', 'architecture'), color: '#f59e0b' },
                  { phase: t('dataflow.detail.version', 'architecture'), desc: t('dataflow.detail.versionDesc', 'architecture'), color: '#10b981' },
                ].map((item, i) => (
                  <motion.div
                    key={item.phase}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: item.color }} />
                    <div>
                      <div className="text-[11px] text-white/50">{item.phase}</div>
                      <div className="text-[10px] text-white/25">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'techstack' && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h2 className="text-[16px] text-white/80 mb-1">{t('techstack.title', 'architecture')}</h2>
                <p className="text-[11px] text-white/25">{t('techstack.subtitle', 'architecture', { count: TECH_STACK.length })}</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {[
                  { key: 'all', label: t('techstack.filterAll', 'architecture') },
                  { key: 'frontend', label: t('category.frontend', 'architecture') },
                  { key: 'backend', label: t('category.backend', 'architecture') },
                  { key: 'ai', label: t('category.ai', 'architecture') },
                  { key: 'devtools', label: t('category.devtools', 'architecture') },
                  { key: 'infra', label: t('category.infra', 'architecture') },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setTechFilter(f.key)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] transition-all border ${
                      techFilter === f.key
                        ? 'text-violet-400 bg-violet-500/[0.08] border-violet-500/15'
                        : 'text-white/25 bg-white/[0.02] border-white/[0.06] hover:text-white/45'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <TechStackTable items={TECH_STACK} filter={techFilter} t={t} />

              {/* Version Management Report */}
              {techVersionReport && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] text-white/45">{t('techstack.versionReport', 'architecture')}</div>
                    <button
                      onClick={() => setTechVersionReport(TechStackVersionManager.generateReport())}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] text-cyan-400/60 hover:text-cyan-400 bg-cyan-500/[0.04] hover:bg-cyan-500/[0.08] border border-cyan-500/10 transition-all"
                    >
                      <RefreshCw className="w-3 h-3" /> {t('techstack.recheck', 'architecture')}
                    </button>
                  </div>

                  {/* Health score + summary */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: t('techstack.healthScore', 'architecture'), value: techVersionReport.healthScore + '%', color: techVersionReport.healthScore >= 90 ? 'text-emerald-400' : 'text-amber-400' },
                      { label: t('techstack.consistent', 'architecture'), value: String(techVersionReport.consistent), color: 'text-emerald-400/60' },
                      { label: t('techstack.updatable', 'architecture'), value: String(techVersionReport.updatable), color: techVersionReport.updatable > 0 ? 'text-amber-400/60' : 'text-white/25' },
                      { label: t('techstack.deprecated', 'architecture'), value: String(techVersionReport.deprecated), color: techVersionReport.deprecated > 0 ? 'text-red-400/60' : 'text-white/25' },
                    ].map(s => (
                      <div key={s.label} className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                        <div className={`text-[14px] ${s.color}`}>{s.value}</div>
                        <div className="text-[8px] text-white/20 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Strategy breakdown */}
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-white/25">{t('techstack.updateStrategy', 'architecture')}</span>
                    {[
                      { icon: RefreshCw, label: t('techstack.strategyAuto', 'architecture'), count: techVersionReport.items.filter(i => i.updateStrategy === 'auto').length, color: 'text-cyan-400/50' },
                      { icon: Wrench, label: t('techstack.strategyManual', 'architecture'), count: techVersionReport.items.filter(i => i.updateStrategy === 'manual').length, color: 'text-amber-400/50' },
                      { icon: Lock, label: t('techstack.strategyLocked', 'architecture'), count: techVersionReport.items.filter(i => i.updateStrategy === 'locked').length, color: 'text-white/30' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-1">
                        <s.icon className={`w-3 h-3 ${s.color}`} />
                        <span className={`text-[9px] ${s.color}`}>{s.label} {s.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {techVersionReport.recommendations.length > 0 && (
                    <div className="space-y-1">
                      {techVersionReport.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-white/30">
                          <Bell className="w-3 h-3 text-indigo-400/40 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSection === 'roadmap' && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h2 className="text-[16px] text-white/80 mb-1">{t('roadmap.title', 'architecture')}</h2>
                <p className="text-[11px] text-white/25">{t('roadmap.subtitle', 'architecture')}</p>
              </div>
              <PhaseTimeline phases={ARCHITECTURE_PHASES} t={t} />
            </div>
          )}

          {activeSection === 'performance' && (
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] text-white/80 mb-1">{t('performance.title', 'architecture')}</h2>
                  <p className="text-[11px] text-white/25">{t('performance.subtitle', 'architecture')}</p>
                </div>
                <button
                  onClick={() => {
                    PerformanceMonitorService.collectSnapshot()
                    setPerfReport(PerformanceMonitorService.getReport())
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-cyan-400 bg-cyan-500/[0.08] border border-cyan-500/15 hover:bg-cyan-500/[0.15] transition-all"
                >
                  <Activity className="w-3 h-3" /> {t('performance.refresh', 'architecture')}
                </button>
              </div>
              {perfReport && <PerformanceCard report={perfReport} t={t} />}

              {/* Performance targets */}
              <div className="mt-4">
                <div className="text-[11px] text-white/35 mb-2">{t('performance.targets', 'architecture')}</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: t('performance.targets.responseTime', 'architecture'), target: '< 500ms' },
                    { label: t('performance.targets.errorRate', 'architecture'), target: '< 1%' },
                    { label: t('performance.targets.availability', 'architecture'), target: '> 99.9%' },
                    { label: 'LCP', target: '< 2.5s' },
                    { label: 'FID', target: '< 100ms' },
                    { label: 'CLS', target: '< 0.1' },
                  ].map(t_item => (
                    <div key={t_item.label} className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                      <div className="text-[11px] text-emerald-400/60">{t_item.target}</div>
                      <div className="text-[8px] text-white/20 mt-0.5">{t_item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'standards' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-[16px] text-white/80 mb-1">{t('standards.title', 'architecture')}</h2>
                <p className="text-[11px] text-white/25">{t('standards.subtitle', 'architecture')}</p>
              </div>

              {/* Naming conventions */}
              <div>
                <div className="text-[11px] text-white/35 mb-2">{t('standards.naming', 'architecture')}</div>
                <NamingConventionCard t={t} />
              </div>

              {/* File header template */}
              <div>
                <div className="text-[11px] text-white/35 mb-2">{t('standards.fileHeader', 'architecture')}</div>
                <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] font-mono text-[10px] text-white/30 whitespace-pre leading-relaxed">
{`/**
 * @file {FILE_NAME}
 * @description {FILE_DESCRIPTION}
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version {VERSION}
 * @created {CREATE_DATE}
 * @updated {UPDATE_DATE}
 * @status {STATUS}
 * @license MIT
 * @copyright Copyright (c) {YEAR} YanYuCloudCube Team
 * @tags {TAGS}
 */`}
                </div>
              </div>

              {/* Security best practices */}
              <div>
                <div className="text-[11px] text-white/35 mb-2">{t('standards.security', 'architecture')}</div>
                <div className="space-y-1.5">
                  {[
                    t('standards.security.inputValidation', 'architecture'),
                    t('standards.security.xss', 'architecture'),
                    t('standards.security.encryption', 'architecture'),
                    t('standards.security.leastPrivilege', 'architecture'),
                    t('standards.security.regularUpdate', 'architecture'),
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <Shield className="w-3 h-3 text-emerald-400/40" />
                      <span className="text-[10px] text-white/35">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* i18n support */}
              <div>
                <div className="text-[11px] text-white/35 mb-2">{t('standards.i18n', 'architecture')}</div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { code: 'zh-CN', label: '简体中文', status: t('standards.i18n.complete', 'architecture') },
                    { code: 'en-US', label: 'English', status: t('standards.i18n.complete', 'architecture') },
                    { code: 'zh-TW', label: '繁體中文', status: t('standards.i18n.planned', 'architecture') },
                    { code: 'ja-JP', label: '日本語', status: t('standards.i18n.planned', 'architecture') },
                    { code: 'ko-KR', label: '한국어', status: t('standards.i18n.planned', 'architecture') },
                  ].map(lang => (
                    <div key={lang.code} className="px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                      <div className="text-[10px] text-white/50">{lang.label}</div>
                      <div className="text-[8px] text-white/15 mt-0.5">{lang.code}</div>
                      <div className={`text-[8px] mt-1 ${lang.status === t('standards.i18n.complete', 'architecture') ? 'text-emerald-400/50' : 'text-white/15'}`}>
                        {lang.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
