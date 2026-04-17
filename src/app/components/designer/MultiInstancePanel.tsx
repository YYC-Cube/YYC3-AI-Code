/**
 * @file MultiInstancePanel.tsx
 * @description Multi-Instance Management Panel — window manager, workspace switcher,
 *   session overview, IPC log, resource monitor, sprint manager, window thumbnails
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags multi-instance, window-management, workspace, session, ipc, sprint
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Monitor, Layers, MessageSquare, Radio, Cpu, Plus, X, Minimize2, Maximize2,
  Eye, Trash2, Copy, Play, Pause, Square,
  Code2, Terminal, Settings, LayoutGrid, Bot, Bug, HardDrive,
  RefreshCw, Activity, Circle, ChevronLeft, Calendar,
  Target, Flag, Rocket, CheckCircle2, Clock,
} from 'lucide-react'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import {
  useMultiInstanceStore,
  type WindowType, type WorkspaceType, type SessionType,
  type AppInstance, type Workspace, type Session,
} from '../../stores/multi-instance-store'
import { useTaskStore, type Sprint, type SprintStatus } from '../../stores/task-store'

// ============================================
// Constants
// ============================================

const WINDOW_TYPE_ICONS: Record<WindowType, React.ElementType> = {
  'main': Monitor, 'editor': Code2, 'preview': Eye, 'terminal': Terminal,
  'ai-chat': Bot, 'settings': Settings, 'database': HardDrive, 'task-board': LayoutGrid,
}

const SESSION_TYPE_ICONS: Record<SessionType, React.ElementType> = {
  'ai-chat': Bot, 'code-edit': Code2, 'debug': Bug, 'preview': Eye, 'terminal': Terminal,
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400', idle: 'text-amber-400', suspended: 'text-white/25', closed: 'text-red-400/50',
}

const WINDOW_THUMBNAILS: Record<WindowType, { bg: string; lines: string[] }> = {
  'main': { bg: '#0d0d14', lines: ['sidebar', 'editor', 'panel'] },
  'editor': { bg: '#0f0f18', lines: ['code', 'code', 'code'] },
  'preview': { bg: '#111118', lines: ['browser', 'content'] },
  'terminal': { bg: '#0a0a0f', lines: ['prompt', 'output', 'output'] },
  'ai-chat': { bg: '#0d0f14', lines: ['msg-l', 'msg-r', 'msg-l'] },
  'settings': { bg: '#0e0e16', lines: ['nav', 'form', 'form'] },
  'database': { bg: '#0c0f12', lines: ['tree', 'grid', 'grid'] },
  'task-board': { bg: '#0d0d12', lines: ['col', 'col', 'col'] },
}

type TabId = 'windows' | 'workspaces' | 'sessions' | 'ipc' | 'resources' | 'sprints'

// ============================================
// Window Thumbnail (P2)
// ============================================

function WindowThumbnail({ type, isActive }: { type: WindowType; isActive: boolean }) {
  const config = WINDOW_THUMBNAILS[type]
  const accent = isActive ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.06)'

  return (
    <div className="w-14 h-10 rounded border shrink-0 overflow-hidden relative"
      style={{ background: config.bg, borderColor: isActive ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)' }}>
      {config.lines.map((line, i) => {
        const y = 2 + i * 3
        if (line === 'sidebar') {return <div key={i} className="absolute left-0.5 rounded-sm" style={{ top: y, width: 4, height: 8, background: accent }} />}
        if (line === 'editor') {return <div key={i} className="absolute left-1.5 rounded-sm" style={{ top: 2, width: 10, height: 8, background: 'rgba(96,165,250,0.15)' }} />}
        if (line === 'panel') {return <div key={i} className="absolute right-0.5 rounded-sm" style={{ top: 2, width: 3, height: 8, background: 'rgba(167,139,250,0.15)' }} />}
        if (line === 'code') {return <div key={i} className="absolute left-1" style={{ top: y, width: 6 + Math.random() * 5, height: 1.5, background: 'rgba(52,211,153,0.2)', borderRadius: 1 }} />}
        if (line === 'browser') {return <div key={i} className="absolute left-0.5 right-0.5 rounded-t-sm" style={{ top: 1, height: 2, background: 'rgba(255,255,255,0.06)' }} />}
        if (line === 'content') {return <div key={i} className="absolute left-1 right-1 rounded-sm" style={{ top: 4, height: 5, background: 'rgba(96,165,250,0.1)' }} />}
        if (line.startsWith('msg-l')) {return <div key={i} className="absolute left-1 rounded" style={{ top: y, width: 7, height: 2, background: 'rgba(52,211,153,0.15)' }} />}
        if (line.startsWith('msg-r')) {return <div key={i} className="absolute right-1 rounded" style={{ top: y, width: 6, height: 2, background: 'rgba(139,92,246,0.15)' }} />}
        if (line === 'prompt') {return <div key={i} className="absolute left-1" style={{ top: y, width: 8, height: 1.5, background: 'rgba(52,211,153,0.3)' }} />}
        if (line === 'output') {return <div key={i} className="absolute left-1" style={{ top: y, width: 9, height: 1.5, background: 'rgba(255,255,255,0.05)' }} />}
        if (line === 'nav') {return <div key={i} className="absolute left-0.5" style={{ top: 1, width: 3, height: 9, background: 'rgba(255,255,255,0.04)' }} />}
        if (line === 'form') {return <div key={i} className="absolute left-1.5" style={{ top: y + 1, width: 10, height: 1.5, background: 'rgba(255,255,255,0.04)' }} />}
        if (line === 'tree') {return <div key={i} className="absolute left-0.5" style={{ top: 1, width: 4, height: 9, background: 'rgba(250,204,21,0.1)' }} />}
        if (line === 'grid') {return <div key={i} className="absolute left-1.5" style={{ top: y + 1, width: 10, height: 1.5, background: 'rgba(96,165,250,0.06)' }} />}
        if (line === 'col') {return <div key={i} className="absolute rounded-sm" style={{ top: 1, left: 1 + i * 4.5, width: 3.5, height: 9, background: 'rgba(255,255,255,0.03)' }} />}
        return null
      })}
    </div>
  )
}

// ============================================
// Sub-Components
// ============================================

function WindowCard({ instance, isActive }: { instance: AppInstance; isActive: boolean }) {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const { activateInstance, closeInstance, toggleMinimize, toggleMaximize } = useMultiInstanceStore()
  const Icon = WINDOW_TYPE_ICONS[instance.windowType] || Monitor
  const accent = isLG ? 'emerald' : 'violet'

  return (
    <div onClick={() => activateInstance(instance.id)}
      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${isActive ? `border-${accent}-500/20 bg-${accent}-500/[0.04]` : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <WindowThumbnail type={instance.windowType} isActive={isActive} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Icon className={`w-3 h-3 shrink-0 ${isActive ? `text-${accent}-400` : 'text-white/30'}`} />
            <span className={`text-[10px] truncate ${isActive ? 'text-white/70' : 'text-white/40'}`}>{instance.title}</span>
            {instance.isMain && <span className="text-[7px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400/60 shrink-0">{t('mi.main', 'designer')}</span>}
          </div>
          <div className="flex items-center gap-3 text-[8px] text-white/15 mt-0.5">
            <span>{instance.size.width}×{instance.size.height}</span>
            <span className="flex items-center gap-0.5"><Cpu className="w-2 h-2" />{instance.cpuPercent}%</span>
            <span className="flex items-center gap-0.5"><HardDrive className="w-2 h-2" />{instance.memoryUsageMB}MB</span>
            <span>{instance.isMinimized ? t('mi.minimized', 'designer') : instance.isMaximized ? t('mi.maximized', 'designer') : t('mi.normal', 'designer')}</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 shrink-0">
          <button onClick={e => { e.stopPropagation(); toggleMinimize(instance.id) }} className="p-0.5 rounded hover:bg-white/[0.06] text-white/15 hover:text-white/30"><Minimize2 className="w-2.5 h-2.5" /></button>
          <button onClick={e => { e.stopPropagation(); toggleMaximize(instance.id) }} className="p-0.5 rounded hover:bg-white/[0.06] text-white/15 hover:text-white/30"><Maximize2 className="w-2.5 h-2.5" /></button>
          {!instance.isMain && <button onClick={e => { e.stopPropagation(); closeInstance(instance.id) }} className="p-0.5 rounded hover:bg-red-500/[0.06] text-white/15 hover:text-red-400/50"><X className="w-2.5 h-2.5" /></button>}
        </div>
      </div>
    </div>
  )
}

function WorkspaceCard({ workspace, isActive }: { workspace: Workspace; isActive: boolean }) {
  const { t } = useI18n()
  const { activateWorkspace, deleteWorkspace, duplicateWorkspace } = useMultiInstanceStore()
  const sessions = useMultiInstanceStore(s => s.sessions.filter(ss => ss.workspaceId === workspace.id))

  return (
    <div onClick={() => activateWorkspace(workspace.id)}
      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${isActive ? 'border-white/10 bg-white/[0.04]' : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{workspace.icon}</span>
          <span className={`text-[10px] truncate ${isActive ? 'text-white/70' : 'text-white/40'}`}>{workspace.name}</span>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: workspace.color }} />
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={e => { e.stopPropagation(); duplicateWorkspace(workspace.id) }} className="p-0.5 rounded hover:bg-white/[0.06] text-white/15 hover:text-white/30"><Copy className="w-2.5 h-2.5" /></button>
          <button onClick={e => { e.stopPropagation(); deleteWorkspace(workspace.id) }} className="p-0.5 rounded hover:bg-red-500/[0.06] text-white/15 hover:text-red-400/50"><Trash2 className="w-2.5 h-2.5" /></button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[8px] text-white/15">
        <span>{workspace.type}</span>
        <span>{sessions.length} {t('mi.sessions', 'designer').toLowerCase()}</span>
        {workspace.projectPath && <span className="truncate">{workspace.projectPath}</span>}
      </div>
    </div>
  )
}

function SessionRow({ session, isActive }: { session: Session; isActive: boolean }) {
  const { activateSession, deleteSession, suspendSession, resumeSession } = useMultiInstanceStore()
  const Icon = SESSION_TYPE_ICONS[session.type] || MessageSquare
  const statusColor = STATUS_COLORS[session.status] || 'text-white/20'

  return (
    <div onClick={() => activateSession(session.id)}
      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}>
      <Icon className={`w-3 h-3 shrink-0 ${statusColor}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-white/40 truncate">{session.name}</div>
        {session.lastContent && <div className="text-[8px] text-white/15 truncate">{session.lastContent}</div>}
      </div>
      <Circle className={`w-2 h-2 shrink-0 ${statusColor}`} fill="currentColor" />
      <div className="flex items-center gap-0.5 shrink-0">
        {session.status === 'active' ? (
          <button onClick={e => { e.stopPropagation(); suspendSession(session.id) }} className="p-0.5 rounded hover:bg-white/[0.06] text-white/15"><Pause className="w-2.5 h-2.5" /></button>
        ) : session.status === 'suspended' ? (
          <button onClick={e => { e.stopPropagation(); resumeSession(session.id) }} className="p-0.5 rounded hover:bg-white/[0.06] text-white/15"><Play className="w-2.5 h-2.5" /></button>
        ) : null}
        <button onClick={e => { e.stopPropagation(); deleteSession(session.id) }} className="p-0.5 rounded hover:bg-red-500/[0.06] text-white/15"><X className="w-2.5 h-2.5" /></button>
      </div>
    </div>
  )
}

// ============================================
// Sprint Manager (P2)
// ============================================

function SprintPanel() {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const { sprints, activeSprintId, createSprint, deleteSprint, startSprint, completeSprint, setActiveSprint, getSprintTasks } = useTaskStore()
  const tasks = useTaskStore(s => s.tasks.filter(t => !t.isArchived))
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const accent = isLG ? 'emerald' : 'violet'

  const DAY_MS = 86400000

  const handleCreate = () => {
    if (!name.trim() || !startDate || !endDate) {return}
    createSprint(name.trim(), new Date(startDate).getTime(), new Date(endDate).getTime())
    setName(''); setStartDate(''); setEndDate('')
    setShowCreate(false)
  }

  const getSprintStats = (sprint: Sprint) => {
    const sprintTasks = tasks.filter(tk => tk.sprintId === sprint.id)
    const done = sprintTasks.filter(tk => tk.status === 'done').length
    const total = sprintTasks.length
    const daysElapsed = Math.max(1, Math.ceil((Date.now() - sprint.startDate) / DAY_MS))
    const velocity = done > 0 ? (done / daysElapsed).toFixed(1) : '0'
    return { total, done, velocity }
  }

  const sprintStatusIcon = (s: SprintStatus) =>
    s === 'active' ? <Rocket className="w-3 h-3 text-emerald-400" /> :
    s === 'completed' ? <CheckCircle2 className="w-3 h-3 text-blue-400/50" /> :
    <Clock className="w-3 h-3 text-white/20" />

  const sprintStatusColor = (s: SprintStatus) =>
    s === 'active' ? 'text-emerald-400/70' : s === 'completed' ? 'text-blue-400/50' : 'text-white/25'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-white/20">{sprints.length} Sprint</span>
        <button onClick={() => setShowCreate(v => !v)}
          className={`flex items-center gap-1 text-[9px] text-${accent}-400/50 hover:text-${accent}-400`}>
          <Plus className="w-3 h-3" />{t('sprint.create', 'designer')}
        </button>
      </div>

      {showCreate && (
        <div className="p-2.5 rounded-lg border border-white/[0.04] bg-white/[0.01] space-y-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t('sprint.name', 'designer')}
            className="w-full px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/60 outline-none" />
          <div className="flex gap-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="flex-1 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/40 outline-none" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="flex-1 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/40 outline-none" />
          </div>
          <div className="flex justify-end gap-1">
            <button onClick={() => setShowCreate(false)} className="px-2 py-1 rounded text-[9px] text-white/20">{t('mi.cancel', 'designer')}</button>
            <button onClick={handleCreate} className={`px-2 py-1 rounded text-[9px] bg-${accent}-500/10 text-${accent}-400/70`}>{t('mi.create', 'designer')}</button>
          </div>
        </div>
      )}

      {sprints.length === 0 && !showCreate && (
        <div className="text-[9px] text-white/10 text-center py-6">{t('sprint.noSprints', 'designer')}</div>
      )}

      {sprints.map(sprint => {
        const stats = getSprintStats(sprint)
        const isActive = sprint.id === activeSprintId
        const progress = stats.total > 0 ? (stats.done / stats.total) * 100 : 0

        return (
          <div key={sprint.id}
            onClick={() => setActiveSprint(sprint.id === activeSprintId ? null : sprint.id)}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${isActive ? `border-${accent}-500/20 bg-${accent}-500/[0.04]` : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {sprintStatusIcon(sprint.status)}
                <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-white/40'}`}>{sprint.name}</span>
                <span className={`text-[8px] ${sprintStatusColor(sprint.status)}`}>
                  {t(`sprint.${sprint.status}`, 'designer')}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {sprint.status === 'planned' && (
                  <button onClick={e => { e.stopPropagation(); startSprint(sprint.id) }}
                    className="p-0.5 rounded hover:bg-white/[0.06] text-white/15 hover:text-emerald-400/50" title={t('sprint.start', 'designer')}>
                    <Play className="w-2.5 h-2.5" />
                  </button>
                )}
                {sprint.status === 'active' && (
                  <button onClick={e => { e.stopPropagation(); completeSprint(sprint.id) }}
                    className="p-0.5 rounded hover:bg-white/[0.06] text-white/15 hover:text-blue-400/50" title={t('sprint.complete', 'designer')}>
                    <Square className="w-2.5 h-2.5" />
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); deleteSprint(sprint.id) }}
                  className="p-0.5 rounded hover:bg-red-500/[0.06] text-white/15 hover:text-red-400/50">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mb-1.5">
              <div className="h-full rounded-full bg-emerald-500/40 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center gap-3 text-[8px] text-white/15">
              <span>{stats.done}/{stats.total} {t('sprint.tasks', 'designer')}</span>
              <span>{t('sprint.velocity', 'designer')}: {stats.velocity}{t('sprint.perDay', 'designer')}</span>
              <span>{new Date(sprint.startDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} — {new Date(sprint.endDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// Create Dialogs
// ============================================

function CreateWindowDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { createInstance } = useMultiInstanceStore()
  const [type, setType] = useState<WindowType>('editor')
  const types: WindowType[] = ['editor', 'preview', 'terminal', 'ai-chat', 'settings', 'database', 'task-board']

  return (
    <div className="p-3 border-t border-white/[0.04]">
      <div className="text-[9px] text-white/25 mb-2">{t('mi.createWindowTitle', 'designer')}</div>
      <div className="flex flex-wrap gap-1 mb-2">
        {types.map(tp => {
          const Icon = WINDOW_TYPE_ICONS[tp]
          return (
            <button key={tp} onClick={() => setType(tp)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] ${type === tp ? 'bg-white/[0.08] text-white/60' : 'bg-white/[0.02] text-white/20 hover:text-white/40'}`}>
              <Icon className="w-3 h-3" />{tp}
            </button>
          )
        })}
      </div>
      <div className="flex justify-end gap-1">
        <button onClick={onClose} className="px-2 py-1 rounded text-[9px] text-white/20">{t('mi.cancel', 'designer')}</button>
        <button onClick={() => { createInstance(type); onClose() }} className="px-2 py-1 rounded text-[9px] bg-emerald-500/10 text-emerald-400/70">{t('mi.create', 'designer')}</button>
      </div>
    </div>
  )
}

function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { createWorkspace } = useMultiInstanceStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<WorkspaceType>('project')

  return (
    <div className="p-3 border-t border-white/[0.04]">
      <div className="text-[9px] text-white/25 mb-2">{t('mi.createWorkspaceTitle', 'designer')}</div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={t('mi.workspaceName', 'designer')}
        className="w-full px-2 py-1 mb-2 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/60 outline-none" />
      <div className="flex gap-1 mb-2">
        {(['project', 'ai-session', 'debug', 'custom'] as WorkspaceType[]).map(tp => (
          <button key={tp} onClick={() => setType(tp)}
            className={`px-2 py-1 rounded text-[9px] ${type === tp ? 'bg-white/[0.08] text-white/60' : 'text-white/20'}`}>{tp}</button>
        ))}
      </div>
      <div className="flex justify-end gap-1">
        <button onClick={onClose} className="px-2 py-1 rounded text-[9px] text-white/20">{t('mi.cancel', 'designer')}</button>
        <button onClick={() => { if (name.trim()) { createWorkspace(name.trim(), type); onClose() } }}
          className="px-2 py-1 rounded text-[9px] bg-emerald-500/10 text-emerald-400/70">{t('mi.create', 'designer')}</button>
      </div>
    </div>
  )
}

// ============================================
// Main Panel
// ============================================

export function MultiInstancePanel() {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const {
    instances, activeInstanceId,
    workspaces, activeWorkspaceId,
    sessions, activeSessionId,
    ipcLog, totalMemoryMB, maxMemoryMB,
    refreshResourceStats,
  } = useMultiInstanceStore()

  const [tab, setTab] = useState<TabId>('windows')
  const [showCreateWindow, setShowCreateWindow] = useState(false)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => refreshResourceStats(), 5000)
    return () => clearInterval(iv)
  }, [refreshResourceStats])

  const accent = isLG ? 'emerald' : 'violet'

  const tabs: { id: TabId; icon: React.ElementType; label: string; count: number }[] = [
    { id: 'windows', icon: Monitor, label: t('mi.windows', 'designer'), count: instances.length },
    { id: 'workspaces', icon: Layers, label: t('mi.workspaces', 'designer'), count: workspaces.length },
    { id: 'sessions', icon: MessageSquare, label: t('mi.sessions', 'designer'), count: sessions.length },
    { id: 'sprints', icon: Target, label: 'Sprint', count: useTaskStore.getState().sprints.length },
    { id: 'ipc', icon: Radio, label: t('mi.ipc', 'designer'), count: ipcLog.length },
    { id: 'resources', icon: Cpu, label: t('mi.resources', 'designer'), count: 0 },
  ]

  const memPercent = Math.round((totalMemoryMB / maxMemoryMB) * 100)

  return (
    <div className="h-full flex flex-col text-white/60">
      {/* Tab bar */}
      <div className={`flex items-center gap-0.5 px-2 py-1 border-b shrink-0 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors ${tab === tb.id ? `text-${accent}-400/70 bg-${accent}-500/[0.06]` : 'text-white/20 hover:text-white/40'}`}>
            <tb.icon className="w-3 h-3" />
            {tb.label}
            {tb.count > 0 && <span className="text-[7px] text-white/15">{tb.count}</span>}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[8px] text-white/10 flex items-center gap-1">
          <Activity className="w-2.5 h-2.5" />{totalMemoryMB}MB / {maxMemoryMB}MB ({memPercent}%)
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        {tab === 'windows' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/20">{instances.length} {t('mi.instances', 'designer')}</span>
              <button onClick={() => setShowCreateWindow(v => !v)}
                className={`flex items-center gap-1 text-[9px] text-${accent}-400/50 hover:text-${accent}-400`}>
                <Plus className="w-3 h-3" />{t('mi.newWindow', 'designer')}
              </button>
            </div>
            {showCreateWindow && <CreateWindowDialog onClose={() => setShowCreateWindow(false)} />}
            {instances.map(inst => <WindowCard key={inst.id} instance={inst} isActive={inst.id === activeInstanceId} />)}
          </div>
        )}

        {tab === 'workspaces' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/20">{workspaces.length} {t('mi.workspaces', 'designer').toLowerCase()}</span>
              <button onClick={() => setShowCreateWorkspace(v => !v)}
                className={`flex items-center gap-1 text-[9px] text-${accent}-400/50 hover:text-${accent}-400`}>
                <Plus className="w-3 h-3" />{t('mi.newWorkspace', 'designer')}
              </button>
            </div>
            {showCreateWorkspace && <CreateWorkspaceDialog onClose={() => setShowCreateWorkspace(false)} />}
            {workspaces.map(ws => <WorkspaceCard key={ws.id} workspace={ws} isActive={ws.id === activeWorkspaceId} />)}
          </div>
        )}

        {tab === 'sessions' && (
          <div className="space-y-1">
            <span className="text-[9px] text-white/20 block mb-1">
              {sessions.filter(s => s.status === 'active').length} {t('mi.activeSessions', 'designer')} / {sessions.length} {t('mi.total', 'designer')}
            </span>
            {sessions.map(sess => <SessionRow key={sess.id} session={sess} isActive={sess.id === activeSessionId} />)}
          </div>
        )}

        {tab === 'sprints' && <SprintPanel />}

        {tab === 'ipc' && (
          <div className="space-y-1">
            <span className="text-[9px] text-white/20 block mb-1">{t('mi.recentIpc', 'designer')} ({ipcLog.length})</span>
            {ipcLog.length === 0 && <div className="text-[9px] text-white/10 text-center py-4">{t('mi.noIpc', 'designer')}</div>}
            {[...ipcLog].reverse().map(msg => (
              <div key={msg.id} className="flex items-start gap-2 px-2 py-1 rounded bg-white/[0.01] border border-white/[0.02]">
                <Radio className="w-2.5 h-2.5 text-cyan-400/30 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] ${msg.type.startsWith('[rx]') ? 'text-amber-400/40' : 'text-cyan-400/40'}`}>{msg.type}</span>
                    <span className="text-[7px] text-white/10">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[8px] text-white/15 truncate">{JSON.stringify(msg.data)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'resources' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/20">{t('mi.resourceMonitor', 'designer')}</span>
              <button onClick={refreshResourceStats} className="flex items-center gap-1 text-[8px] text-white/15 hover:text-white/30">
                <RefreshCw className="w-2.5 h-2.5" />{t('mi.refresh', 'designer')}
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between text-[9px] text-white/25 mb-1">
                <span>{t('mi.memoryUsage', 'designer')}</span>
                <span>{totalMemoryMB} / {maxMemoryMB} MB ({memPercent}%)</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <div className={`h-full rounded-full transition-all ${memPercent > 80 ? 'bg-red-500/50' : memPercent > 50 ? 'bg-amber-500/50' : 'bg-emerald-500/50'}`} style={{ width: `${memPercent}%` }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] text-white/15">{t('mi.perInstance', 'designer')}</span>
              {instances.map(inst => {
                const Icon = WINDOW_TYPE_ICONS[inst.windowType] || Monitor
                return (
                  <div key={inst.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/[0.01] border border-white/[0.02]">
                    <WindowThumbnail type={inst.windowType} isActive={inst.id === activeInstanceId} />
                    <span className="text-[9px] text-white/30 flex-1 truncate">{inst.title}</span>
                    <div className="flex items-center gap-3 text-[8px] shrink-0">
                      <span className="text-white/15 flex items-center gap-0.5"><Cpu className="w-2 h-2" />{inst.cpuPercent}%</span>
                      <span className="text-white/15 flex items-center gap-0.5"><HardDrive className="w-2 h-2" />{inst.memoryUsageMB}MB</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className={`flex items-center justify-between px-2 py-1 border-t text-[8px] text-white/10 shrink-0 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
        <span>{instances.length} {t('mi.instances', 'designer')} · {workspaces.length} {t('mi.workspaces', 'designer').toLowerCase()} · {sessions.filter(s => s.status === 'active').length} {t('mi.activeSessions', 'designer')}</span>
        <span>{t('mi.ipcChannel', 'designer')} · {ipcLog.length} {t('mi.messages', 'designer')}</span>
      </div>
    </div>
  )
}
