/**
 * @file GanttView.tsx
 * @description Enhanced Gantt chart + DAG dependency graph + Burndown chart
 *   - P1: Dependency arrow lines between task bars + WIP config UI
 *   - P2: Burndown chart (recharts), drag-to-adjust task time, DAG export SVG/PNG
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags gantt, timeline, dag, dependency-graph, burndown, recharts
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Calendar, ChevronLeft, GitBranch, ZoomIn, ZoomOut, Maximize2,
  Download, TrendingDown, Settings2, RotateCcw, Image as ImageIcon,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import { useTaskStore } from '../../stores/task-store'
import type { Task, TaskStatus, TaskPriority } from '../../stores/task-store'
import { useI18n } from '../../utils/useI18n'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { toast } from 'sonner'

// ============================================
// Constants
// ============================================

const STATUS_COLORS: Record<TaskStatus, string> = {
  'todo': '#60a5fa',
  'in-progress': '#fbbf24',
  'review': '#a78bfa',
  'done': '#34d399',
  'blocked': '#f87171',
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

const DAY_MS = 86400000
const ROW_HEIGHT = 28

type GanttSubView = 'gantt' | 'dag' | 'burndown' | 'wip-settings'

// ============================================
// WIP Config Panel (P1)
// ============================================

function WipConfigPanel({ onClose }: { onClose: () => void }) {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const wipLimits = useTaskStore(s => s.wipLimits)
  const setWipLimit = useTaskStore(s => s.setWipLimit)
  const resetWipLimits = useTaskStore(s => s.resetWipLimits)
  const accent = isLG ? 'emerald' : 'violet'

  const statuses: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: '待办', color: STATUS_COLORS.todo },
    { status: 'in-progress', label: '进行中', color: STATUS_COLORS['in-progress'] },
    { status: 'review', label: '审查', color: STATUS_COLORS.review },
    { status: 'done', label: '完成', color: STATUS_COLORS.done },
    { status: 'blocked', label: '阻塞', color: STATUS_COLORS.blocked },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1 rounded text-white/30 hover:text-white/50 hover:bg-white/[0.04]">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <Settings2 className={`w-3.5 h-3.5 text-${accent}-400/50`} />
          <span className="text-[10px] text-white/30">{t('mi.wipConfig', 'designer')}</span>
        </div>
        <button onClick={resetWipLimits} className="flex items-center gap-1 text-[9px] text-white/20 hover:text-white/40">
          <RotateCcw className="w-3 h-3" />{t('mi.reset', 'designer')}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="text-[9px] text-white/15 mb-2">{t('mi.wipHint', 'designer')}</div>
        {statuses.map(({ status, label, color }) => (
          <div key={status} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-[10px] text-white/40">{label}</span>
              </div>
              <span className="text-[10px] text-white/20">{wipLimits[status] === 0 ? '∞' : wipLimits[status]}</span>
            </div>
            <input
              type="range"
              min={0} max={20} step={1}
              value={wipLimits[status]}
              onChange={e => setWipLimit(status, parseInt(e.target.value))}
              className="w-full h-1 appearance-none bg-white/[0.06] rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/30
                [&::-webkit-slider-thumb]:hover:bg-white/50 [&::-webkit-slider-thumb]:transition-colors"
            />
            <div className="flex justify-between text-[7px] text-white/10">
              <span>0 (无限)</span>
              <span>20</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Burndown Chart (P2)
// ============================================

function BurndownChart({ onBack }: { onBack: () => void }) {
  const { isLG } = useLiquidGlass()
  const allTasks = useTaskStore(s => s.tasks.filter(t => !t.isArchived))
  const sprints = useTaskStore(s => s.sprints)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
  const accent = isLG ? '#34d399' : '#a78bfa'

  // Filter tasks by sprint
  const tasks = useMemo(() => {
    if (!selectedSprintId) {return allTasks}
    return allTasks.filter(t => t.sprintId === selectedSprintId)
  }, [allTasks, selectedSprintId])

  const selectedSprint = sprints.find(s => s.id === selectedSprintId)

  // Generate burndown data
  const chartData = useMemo(() => {
    const now = Date.now()
    // Use sprint date range if selected, otherwise use task dates
    const rangeStart = selectedSprint ? selectedSprint.startDate : (tasks.length > 0 ? Math.min(...tasks.map(t => t.createdAt)) : now - 14 * DAY_MS)
    const rangeEnd = selectedSprint ? selectedSprint.endDate : now
    const startDay = new Date(rangeStart)
    startDay.setHours(0, 0, 0, 0)
    const totalDays = Math.max(1, Math.ceil((rangeEnd - startDay.getTime()) / DAY_MS) + 1)
    const data: { date: string; remaining: number; ideal: number; completed: number }[] = []

    for (let i = 0; i < totalDays; i++) {
      const dayEnd = startDay.getTime() + (i + 1) * DAY_MS
      const created = tasks.filter(t => t.createdAt <= dayEnd).length
      const completed = tasks.filter(t => t.status === 'done' && t.updatedAt <= dayEnd).length
      const remaining = created - completed
      const ideal = Math.max(0, tasks.length - (tasks.length / Math.max(totalDays - 1, 1)) * i)

      data.push({
        date: new Date(startDay.getTime() + i * DAY_MS).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        remaining,
        ideal: Math.round(ideal * 10) / 10,
        completed,
      })
    }
    return data
  }, [tasks, selectedSprint])

  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const velocity = doneTasks > 0 ? (doneTasks / Math.max(1, chartData.length)).toFixed(1) : '0'

  return (
    <div className="h-full flex flex-col">
      <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 rounded text-white/30 hover:text-white/50 hover:bg-white/[0.04]">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <TrendingDown className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400/50' : 'text-violet-400/50'}`} />
          <span className="text-[10px] text-white/30">燃尽图</span>
          {/* Sprint filter */}
          <select
            value={selectedSprintId || ''}
            onChange={e => setSelectedSprintId(e.target.value || null)}
            className="text-[9px] bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 text-white/40 outline-none"
          >
            <option value="">全部任务</option>
            {sprints.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 text-[8px] text-white/15">
          <span>总计 {totalTasks}</span>
          <span>完成 {doneTasks}</span>
          <span>速率 {velocity}/天</span>
        </div>
      </div>
      <div className="flex-1 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="burnArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.15} />
                <stop offset="95%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.15)' }} />
            <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.15)' }} />
            <Tooltip
              contentStyle={{ background: 'rgba(12,12,20,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}
            />
            <Line type="monotone" dataKey="ideal" stroke="rgba(255,255,255,0.1)" strokeDasharray="5 5" dot={false} />
            <Area type="monotone" dataKey="remaining" stroke={accent} fill="url(#burnArea)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="completed" stroke="#34d399" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================
// Gantt Chart View (P1 enhanced with dependency lines)
// ============================================

export function GanttView() {
  const { isLG } = useLiquidGlass()
  const tasks = useTaskStore(s => s.getFilteredTasks())
  const allTasks = useTaskStore(s => s.tasks.filter(t => !t.isArchived))
  const setDetailTask = useTaskStore(s => s.setDetailTask)
  const updateTask = useTaskStore(s => s.updateTask)
  const [dayWidth, setDayWidth] = useState(32)
  const [subView, setSubView] = useState<GanttSubView>('gantt')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [draggingTask, setDraggingTask] = useState<string | null>(null)
  const [dragEdge, setDragEdge] = useState<'left' | 'right' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)

  const now = Date.now()

  const startDate = useMemo(() => {
    const dates = tasks.map(t => t.createdAt).filter(Boolean)
    const min = dates.length > 0 ? Math.min(...dates) : now - 14 * DAY_MS
    return new Date(min - 3 * DAY_MS)
  }, [tasks, now])

  const endDate = useMemo(() => {
    const dates = [...tasks.map(t => t.dueDate).filter(Boolean) as number[], ...tasks.map(t => t.updatedAt)]
    const max = Math.max(...dates, now)
    return new Date(max + 10 * DAY_MS)
  }, [tasks, now])

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS)
  const days = useMemo(() => {
    const arr: Date[] = []
    for (let i = 0; i < totalDays; i++) {arr.push(new Date(startDate.getTime() + i * DAY_MS))}
    return arr
  }, [startDate, totalDays])

  useEffect(() => {
    if (scrollRef.current && subView === 'gantt') {
      const todayOffset = Math.floor((now - startDate.getTime()) / DAY_MS) * dayWidth
      scrollRef.current.scrollLeft = Math.max(0, todayOffset - 200)
    }
  }, [subView])

  const getBarPosition = (task: Task) => {
    const taskStart = task.createdAt
    const taskEnd = task.dueDate || (task.status === 'done' ? task.updatedAt : now)
    const left = ((taskStart - startDate.getTime()) / DAY_MS) * dayWidth
    const width = Math.max(dayWidth, ((taskEnd - taskStart) / DAY_MS) * dayWidth)
    return { left, width }
  }

  const todayOffset = ((now - startDate.getTime()) / DAY_MS) * dayWidth

  // Build task index map for dependency lines
  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    tasks.forEach((t, i) => map.set(t.id, i))
    return map
  }, [tasks])

  // P2: Drag to adjust task time
  const handleBarMouseDown = (e: React.MouseEvent, taskId: string, edge: 'left' | 'right') => {
    e.stopPropagation()
    e.preventDefault()
    setDraggingTask(taskId)
    setDragEdge(edge)
    setDragStartX(e.clientX)
  }

  useEffect(() => {
    if (!draggingTask || !dragEdge) {return}
    const task = tasks.find(t => t.id === draggingTask)
    if (!task) {return}

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX
      const deltaDays = Math.round(deltaX / dayWidth)
      if (deltaDays === 0) {return}
      const deltaMs = deltaDays * DAY_MS

      if (dragEdge === 'right') {
        const currentEnd = task.dueDate || task.updatedAt
        const newEnd = currentEnd + deltaMs
        if (newEnd > task.createdAt + DAY_MS) {
          updateTask(draggingTask, { dueDate: newEnd })
          setDragStartX(e.clientX)
        }
      } else {
        const newStart = task.createdAt + deltaMs
        const end = task.dueDate || task.updatedAt
        if (newStart < end - DAY_MS) {
          updateTask(draggingTask, { createdAt: newStart } as any)
          setDragStartX(e.clientX)
        }
      }
    }

    const handleMouseUp = () => {
      setDraggingTask(null)
      setDragEdge(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingTask, dragEdge, dragStartX, dayWidth, tasks, updateTask])

  // Sub-view routing
  if (subView === 'dag') {return <DAGView onBack={() => setSubView('gantt')} />}
  if (subView === 'burndown') {return <BurndownChart onBack={() => setSubView('gantt')} />}
  if (subView === 'wip-settings') {return <WipConfigPanel onClose={() => setSubView('gantt')} />}

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
        <div className="flex items-center gap-2">
          <Calendar className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400/50' : 'text-violet-400/50'}`} />
          <span className="text-[10px] text-white/30">甘特图</span>
          <span className="text-[9px] text-white/15">{tasks.length} 任务 · {totalDays} 天</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSubView('dag')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] ${isLG ? 'text-emerald-400/50 hover:bg-emerald-500/[0.06]' : 'text-violet-400/50 hover:bg-violet-500/[0.06]'}`}>
            <GitBranch className="w-3 h-3" /> DAG
          </button>
          <button onClick={() => setSubView('burndown')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] ${isLG ? 'text-emerald-400/50 hover:bg-emerald-500/[0.06]' : 'text-violet-400/50 hover:bg-violet-500/[0.06]'}`}>
            <TrendingDown className="w-3 h-3" /> 燃尽图
          </button>
          <button onClick={() => setSubView('wip-settings')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] ${isLG ? 'text-emerald-400/50 hover:bg-emerald-500/[0.06]' : 'text-violet-400/50 hover:bg-violet-500/[0.06]'}`}>
            <Settings2 className="w-3 h-3" /> WIP
          </button>
          <button onClick={() => setDayWidth(w => Math.max(16, w - 8))} className="p-1 rounded text-white/20 hover:text-white/40"><ZoomOut className="w-3 h-3" /></button>
          <button onClick={() => setDayWidth(w => Math.min(64, w + 8))} className="p-1 rounded text-white/20 hover:text-white/40"><ZoomIn className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left label column */}
        <div className="w-[160px] shrink-0 border-r border-white/[0.04] overflow-y-auto">
          <div className="h-7 border-b border-white/[0.04] px-2 flex items-center">
            <span className="text-[9px] text-white/20">任务</span>
          </div>
          {tasks.map(task => (
            <div key={task.id} onClick={() => setDetailTask(task.id)}
              className="flex items-center gap-1.5 px-2 border-b border-white/[0.02] cursor-pointer hover:bg-white/[0.02] transition-colors"
              style={{ height: ROW_HEIGHT }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[task.priority] }} />
              <span className="text-[9px] text-white/40 truncate flex-1">{task.title}</span>
            </div>
          ))}
        </div>

        {/* Right scrollable chart */}
        <div ref={scrollRef} className="flex-1 overflow-auto relative">
          {/* Date header */}
          <div className="sticky top-0 z-10 flex h-7 border-b border-white/[0.04]"
            style={{ width: totalDays * dayWidth, background: 'rgba(12,12,20,0.9)', backdropFilter: 'blur(6px)' }}>
            {days.map((d, i) => {
              const isToday = d.toDateString() === new Date(now).toDateString()
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              const isMonthStart = d.getDate() === 1
              return (
                <div key={i} className={`shrink-0 flex flex-col items-center justify-center border-r border-white/[0.02] ${
                  isToday ? 'bg-emerald-500/[0.08]' : isWeekend ? 'bg-white/[0.01]' : ''
                }`} style={{ width: dayWidth }}>
                  {isMonthStart && <span className="text-[7px] text-white/25">{d.toLocaleDateString('zh-CN', { month: 'short' })}</span>}
                  <span className={`text-[8px] ${isToday ? 'text-emerald-400/70' : 'text-white/15'}`}>{d.getDate()}</span>
                </div>
              )
            })}
          </div>

          {/* SVG layer for dependency lines (P1) */}
          <svg className="absolute top-7 left-0 pointer-events-none z-[5]"
            style={{ width: totalDays * dayWidth, height: tasks.length * ROW_HEIGHT }}
          >
            {tasks.map(task =>
              task.dependencies?.map(depId => {
                const depIdx = taskIndexMap.get(depId)
                const taskIdx = taskIndexMap.get(task.id)
                if (depIdx === undefined || taskIdx === undefined) {return null}
                const dep = allTasks.find(t => t.id === depId)
                if (!dep) {return null}

                const depBar = getBarPosition(dep)
                const taskBar = getBarPosition(task)

                const x1 = depBar.left + depBar.width
                const y1 = depIdx * ROW_HEIGHT + ROW_HEIGHT / 2
                const x2 = taskBar.left
                const y2 = taskIdx * ROW_HEIGHT + ROW_HEIGHT / 2
                const mx = (x1 + x2) / 2

                return (
                  <g key={`${depId}-${task.id}`}>
                    <path
                      d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={isLG ? 'rgba(52,211,153,0.3)' : 'rgba(139,92,246,0.3)'}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                    />
                    {/* Arrowhead */}
                    <polygon
                      points={`${x2},${y2} ${x2 - 5},${y2 - 3} ${x2 - 5},${y2 + 3}`}
                      fill={isLG ? 'rgba(52,211,153,0.5)' : 'rgba(139,92,246,0.5)'}
                    />
                  </g>
                )
              })
            )}
          </svg>

          {/* Task bars */}
          <div style={{ width: totalDays * dayWidth }} className="relative">
            {/* Today line */}
            <div className="absolute top-0 w-px bg-emerald-400/30 z-10" style={{ left: todayOffset, height: tasks.length * ROW_HEIGHT }} />

            {tasks.map((task) => {
              const { left, width } = getBarPosition(task)
              const statusColor = STATUS_COLORS[task.status]
              const completedSubs = task.subtasks?.filter(st => st.isCompleted).length || 0
              const totalSubs = task.subtasks?.length || 0
              const progress = totalSubs > 0 ? completedSubs / totalSubs : task.status === 'done' ? 1 : 0
              const isDragging = draggingTask === task.id

              return (
                <div key={task.id} className="relative border-b border-white/[0.02]"
                  style={{ height: ROW_HEIGHT, width: totalDays * dayWidth }}>
                  {/* Task bar */}
                  <div
                    onClick={() => setDetailTask(task.id)}
                    className={`absolute top-1 rounded cursor-pointer transition-all group ${isDragging ? 'ring-1 ring-white/20' : 'hover:brightness-125'}`}
                    style={{ left, width: Math.max(dayWidth * 0.8, width), height: ROW_HEIGHT - 8, background: `${statusColor}20`, border: `1px solid ${statusColor}40` }}
                    title={`${task.title}\n${task.status} · 拖拽边缘调整时间`}
                  >
                    {/* Progress fill */}
                    <div className="absolute inset-0 rounded-l" style={{ width: `${progress * 100}%`, background: `${statusColor}30` }} />
                    <span className="relative z-10 text-[8px] px-1.5 py-0.5 truncate block" style={{ color: statusColor }}>{task.title}</span>

                    {/* P2: Drag handles on edges */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 group-hover:opacity-100 bg-white/10 rounded-l"
                      onMouseDown={e => handleBarMouseDown(e, task.id, 'left')}
                    />
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 group-hover:opacity-100 bg-white/10 rounded-r"
                      onMouseDown={e => handleBarMouseDown(e, task.id, 'right')}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// DAG Dependency Graph (Canvas) with Export
// ============================================

export function DAGView({ onBack }: { onBack: () => void }) {
  const { isLG } = useLiquidGlass()
  const tasks = useTaskStore(s => s.tasks.filter(t => !t.isArchived))
  const setDetailTask = useTaskStore(s => s.setDetailTask)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 40, y: 40 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Build DAG layout
  const { nodes, edges } = useMemo(() => {
    const nodeWidth = 160
    const nodeHeight = 36
    const layerGapX = 220
    const layerGapY = 56

    const adj = new Map<string, string[]>()
    const inDeg = new Map<string, number>()
    const edgeList: { from: string; to: string }[] = []

    tasks.forEach(t => { adj.set(t.id, []); inDeg.set(t.id, 0) })
    tasks.forEach(t => {
      t.dependencies?.forEach(depId => {
        if (adj.has(depId)) {
          adj.get(depId)!.push(t.id)
          inDeg.set(t.id, (inDeg.get(t.id) || 0) + 1)
          edgeList.push({ from: depId, to: t.id })
        }
      })
    })

    // Kahn's topological sort
    const layers: string[][] = []
    let queue = tasks.filter(t => (inDeg.get(t.id) || 0) === 0).map(t => t.id)
    const visited = new Set<string>()

    while (queue.length > 0) {
      layers.push([...queue])
      queue.forEach(id => visited.add(id))
      const next: string[] = []
      for (const id of queue) {
        for (const child of adj.get(id) || []) {
          inDeg.set(child, (inDeg.get(child) || 0) - 1)
          if ((inDeg.get(child) || 0) <= 0 && !visited.has(child)) {
            next.push(child)
            visited.add(child)
          }
        }
      }
      queue = next
    }

    const remaining = tasks.filter(t => !visited.has(t.id))
    if (remaining.length > 0) {layers.push(remaining.map(t => t.id))}

    const nodeMap: { id: string; title: string; status: TaskStatus; priority: TaskPriority; x: number; y: number; width: number; height: number }[] = []
    layers.forEach((layer, li) => {
      layer.forEach((id, ni) => {
        const task = tasks.find(t => t.id === id)
        if (!task) {return}
        nodeMap.push({ id, title: task.title, status: task.status, priority: task.priority, x: li * layerGapX, y: ni * layerGapY, width: nodeWidth, height: nodeHeight })
      })
    })
    return { nodes: nodeMap, edges: edgeList }
  }, [tasks])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {return}
    const ctx = canvas.getContext('2d')
    if (!ctx) {return}
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(zoom, zoom)

    // Edges
    edges.forEach(edge => {
      const from = nodes.find(n => n.id === edge.from)
      const to = nodes.find(n => n.id === edge.to)
      if (!from || !to) {return}
      const x1 = from.x + from.width, y1 = from.y + from.height / 2
      const x2 = to.x, y2 = to.y + to.height / 2
      const cpx = (x1 + x2) / 2
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.bezierCurveTo(cpx, y1, cpx, y2, x2, y2)
      ctx.strokeStyle = isLG ? 'rgba(52,211,153,0.25)' : 'rgba(139,92,246,0.25)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      // Arrow
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - 6, y2 - 3.5)
      ctx.lineTo(x2 - 6, y2 + 3.5)
      ctx.closePath()
      ctx.fillStyle = isLG ? 'rgba(52,211,153,0.4)' : 'rgba(139,92,246,0.4)'
      ctx.fill()
    })

    // Nodes
    nodes.forEach(node => {
      const sc = STATUS_COLORS[node.status]
      ctx.fillStyle = `${sc}15`
      ctx.strokeStyle = `${sc}40`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, node.width, node.height, 6)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(node.x + 10, node.y + node.height / 2, 3, 0, Math.PI * 2)
      ctx.fillStyle = PRIORITY_COLORS[node.priority]
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '10px system-ui, sans-serif'
      ctx.textBaseline = 'middle'
      let text = node.title
      const maxW = node.width - 24
      while (ctx.measureText(text).width > maxW && text.length > 3) {text = text.slice(0, -4) + '...'}
      ctx.fillText(text, node.x + 20, node.y + node.height / 2)
    })
    ctx.restore()
  }, [nodes, edges, zoom, offset, isLG])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const h = () => draw()
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [draw])

  const handleMouseDown = (e: React.MouseEvent) => { setDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }) }
  const handleMouseMove = (e: React.MouseEvent) => { if (dragging) {setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })} }
  const handleMouseUp = () => setDragging(false)
  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) {return}
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - offset.x) / zoom
    const y = (e.clientY - rect.top - offset.y) / zoom
    for (const node of nodes) {
      if (x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) { setDetailTask(node.id); return }
    }
  }
  const handleWheel = (e: React.WheelEvent) => { e.preventDefault(); setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001))) }

  // P2: Export DAG as PNG
  const exportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) {return}
    const link = document.createElement('a')
    link.download = `yyc3-dag-${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('DAG 已导出为 PNG')
  }

  // P2: Export as SVG string
  const exportSVG = () => {
    const svgParts: string[] = []
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${(nodes.length ? Math.max(...nodes.map(n => n.x + n.width)) + 40 : 400)} ${(nodes.length ? Math.max(...nodes.map(n => n.y + n.height)) + 40 : 300)}" style="background:#0c0c14">`)
    edges.forEach(e => {
      const from = nodes.find(n => n.id === e.from)
      const to = nodes.find(n => n.id === e.to)
      if (!from || !to) {return}
      const x1 = from.x + from.width, y1 = from.y + from.height / 2
      const x2 = to.x, y2 = to.y + to.height / 2
      const cpx = (x1 + x2) / 2
      svgParts.push(`<path d="M${x1},${y1} C${cpx},${y1} ${cpx},${y2} ${x2},${y2}" fill="none" stroke="rgba(52,211,153,0.3)" stroke-width="1.5"/>`)
    })
    nodes.forEach(n => {
      const sc = STATUS_COLORS[n.status]
      svgParts.push(`<rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="6" fill="${sc}22" stroke="${sc}66"/>`)
      svgParts.push(`<text x="${n.x + 20}" y="${n.y + n.height / 2 + 4}" fill="rgba(255,255,255,0.5)" font-size="10" font-family="system-ui">${n.title.slice(0, 20)}</text>`)
    })
    svgParts.push('</svg>')
    const blob = new Blob([svgParts.join('\n')], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.download = `yyc3-dag-${new Date().toISOString().slice(0, 10)}.svg`
    link.href = URL.createObjectURL(blob)
    link.click()
    toast.success('DAG 已导出为 SVG')
  }

  return (
    <div className="h-full flex flex-col">
      <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 rounded text-white/30 hover:text-white/50 hover:bg-white/[0.04]">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <GitBranch className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400/50' : 'text-violet-400/50'}`} />
          <span className="text-[10px] text-white/30">依赖关系图 (DAG)</span>
          <span className="text-[9px] text-white/15">{nodes.length} 节点 · {edges.length} 边</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={exportPNG} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] text-white/20 hover:text-white/40 hover:bg-white/[0.04]">
            <ImageIcon className="w-3 h-3" />PNG
          </button>
          <button onClick={exportSVG} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] text-white/20 hover:text-white/40 hover:bg-white/[0.04]">
            <Download className="w-3 h-3" />SVG
          </button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="p-1 rounded text-white/20 hover:text-white/40"><ZoomOut className="w-3 h-3" /></button>
          <span className="text-[8px] text-white/15 w-8 text-center">{(zoom * 100).toFixed(0)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1 rounded text-white/20 hover:text-white/40"><ZoomIn className="w-3 h-3" /></button>
          <button onClick={() => { setZoom(1); setOffset({ x: 40, y: 40 }) }} className="p-1 rounded text-white/20 hover:text-white/40"><Maximize2 className="w-3 h-3" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative">
        <canvas ref={canvasRef} className="w-full h-full"
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} onClick={handleClick} onWheel={handleWheel} />
        <div className="absolute bottom-3 left-3 flex items-center gap-3 px-2.5 py-1.5 rounded-lg border border-white/[0.04] bg-black/40 backdrop-blur-sm">
          {(Object.entries(STATUS_COLORS) as [TaskStatus, string][]).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
              <span className="text-[8px] text-white/25">{s === 'todo' ? '待办' : s === 'in-progress' ? '进行中' : s === 'review' ? '审查' : s === 'done' ? '完成' : '阻塞'}</span>
            </div>
          ))}
        </div>
        <div className="absolute top-3 right-3 text-[8px] text-white/10">拖拽平移 · 滚轮缩放 · 点击节点查看详情</div>
      </div>
    </div>
  )
}
