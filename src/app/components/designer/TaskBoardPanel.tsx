/**
 * @file TaskBoardPanel.tsx
 * @description AI Task Board panel v2.0 — react-dnd Kanban, AI-service inference,
 *   task detail side panel with subtask management, due date, reminders
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags task-board, kanban, react-dnd, ai-inference, detail-panel
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Plus, X, Check, Trash2, Archive, Copy, ChevronDown, ChevronRight,
  AlertTriangle, Clock, Tag, FileCode2, Sparkles, Loader2,
  ArrowUpDown, Filter, Search, LayoutGrid, List, GripVertical,
  CircleDot, CircleCheck, CirclePause, CircleX, CirclePlay,
  Flag, Bug, Wrench, TestTube2, FileText, MoreHorizontal,
  Calendar, Timer, Brain, CheckSquare, Square, Bell,
  PanelRightClose, Edit3, Save, XCircle, CalendarClock,
  Link2, Unlink,
} from 'lucide-react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { motion, AnimatePresence } from 'motion/react'
import { useTaskStore } from '../../stores/task-store'
import type { Task, TaskStatus, TaskPriority, TaskType, TaskInference, WipLimits } from '../../stores/task-store'
import { useAIServiceStore } from '../../stores/ai-service-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import { toast } from 'sonner'
import { Virtuoso } from 'react-virtuoso'
import { GanttView } from './GanttView'

// ============================================
// useDebounce hook
// ============================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

// ============================================
// DnD item type
// ============================================
const DND_TASK = 'TASK_CARD'
interface DragItem { id: string; status: TaskStatus }

// ============================================
// Constants
// ============================================

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: typeof CircleDot; color: string; bg: string }> = {
  'todo':        { label: '待办',   icon: CircleDot,    color: 'text-blue-400/60',    bg: 'bg-blue-500/[0.06] border-blue-500/10' },
  'in-progress': { label: '进行中', icon: CirclePlay,   color: 'text-amber-400/60',   bg: 'bg-amber-500/[0.06] border-amber-500/10' },
  'review':      { label: '审查',   icon: CirclePause,  color: 'text-purple-400/60',  bg: 'bg-purple-500/[0.06] border-purple-500/10' },
  'done':        { label: '完成',   icon: CircleCheck,  color: 'text-emerald-400/60',  bg: 'bg-emerald-500/[0.06] border-emerald-500/10' },
  'blocked':     { label: '阻塞',   icon: CircleX,      color: 'text-red-400/60',     bg: 'bg-red-500/[0.06] border-red-500/10' },
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  critical: { label: '紧急', color: 'text-red-400', dot: 'bg-red-500' },
  high:     { label: '高',   color: 'text-orange-400', dot: 'bg-orange-500' },
  medium:   { label: '中',   color: 'text-yellow-400', dot: 'bg-yellow-500' },
  low:      { label: '低',   color: 'text-green-400', dot: 'bg-green-500' },
}

const TYPE_CONFIG: Record<TaskType, { label: string; icon: typeof Flag }> = {
  feature:       { label: '功能', icon: Flag },
  bug:           { label: 'Bug',  icon: Bug },
  refactor:      { label: '重构', icon: Wrench },
  test:          { label: '测试', icon: TestTube2 },
  documentation: { label: '文档', icon: FileText },
  other:         { label: '其他', icon: MoreHorizontal },
}

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'review', 'done', 'blocked']

// WIP limits (0 = unlimited)
const WIP_LIMITS: Record<TaskStatus, number> = {
  'todo': 0,
  'in-progress': 5,
  'review': 3,
  'done': 0,
  'blocked': 0,
}

// ============================================
// Main Component
// ============================================

export function TaskBoardPanel({ standalone }: { standalone?: boolean }) {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const {
    viewMode, setViewMode,
    addFormOpen, setAddFormOpen,
    selectedTaskIds, clearSelection,
    batchUpdateStatus, batchDelete, batchArchive,
    getStats, inferring, detailTaskId,
  } = useTaskStore()

  const stats = useMemo(() => getStats(), [useTaskStore(s => s.tasks)])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col overflow-hidden relative">
        {/* Header toolbar */}
        <div className={`flex items-center justify-between gap-2 px-3 py-1.5 border-b shrink-0 ${
          isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/25">{stats.total} {t('taskBoard.tasks', 'designer')}</span>
            {stats.overdue > 0 && (
              <span className="text-[9px] text-red-400/60 flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> {stats.overdue} {t('taskBoard.overdue', 'designer')}
              </span>
            )}
            <span className="text-[9px] text-emerald-400/40">{(stats.completionRate * 100).toFixed(0)}%</span>
            <FilterBar />
          </div>
          <div className="flex items-center gap-1">
            {selectedTaskIds.length > 0 && <BatchBar />}
            <AIInferButton />
            <button
              onClick={() => setAddFormOpen(true)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors ${
                isLG ? 'text-emerald-400/60 hover:bg-emerald-500/[0.06]' : 'text-violet-400/60 hover:bg-violet-500/[0.06]'
              }`}
            >
              <Plus className="w-3 h-3" /> {t('taskBoard.addTask', 'designer')}
            </button>
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1 rounded ${viewMode === 'kanban' ? 'text-white/50 bg-white/[0.06]' : 'text-white/15 hover:text-white/30'}`}
              ><LayoutGrid className="w-3 h-3" /></button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'text-white/50 bg-white/[0.06]' : 'text-white/15 hover:text-white/30'}`}
              ><List className="w-3 h-3" /></button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1 rounded ${viewMode === 'timeline' ? 'text-white/50 bg-white/[0.06]' : 'text-white/15 hover:text-white/30'}`}
                title="甘特图 / DAG"
              ><Calendar className="w-3 h-3" /></button>
            </div>
            <SortButton />
          </div>
        </div>

        {addFormOpen && <AddTaskForm onClose={() => setAddFormOpen(false)} />}

        {/* Board + detail split */}
        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 overflow-auto ${detailTaskId ? 'mr-0' : ''}`}>
            {viewMode === 'kanban' ? <KanbanView /> : viewMode === 'timeline' ? <GanttView /> : <ListView />}
          </div>
          <AnimatePresence mode="wait">
            {detailTaskId && (
              <motion.div
                key="task-detail"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="shrink-0 overflow-hidden"
              >
                <TaskDetailPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DndProvider>
  )
}

// ============================================
// Filter Bar
// ============================================

function FilterBar() {
  const { filter, setFilter, clearFilter } = useTaskStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const hasFilter = filter.status || filter.priority || filter.type || filter.searchQuery

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setSearchOpen(!searchOpen)}
        className={`p-1 rounded text-[10px] ${searchOpen || filter.searchQuery ? 'text-white/50 bg-white/[0.06]' : 'text-white/15 hover:text-white/30'}`}
      ><Search className="w-3 h-3" /></button>
      {searchOpen && (
        <input
          autoFocus
          value={filter.searchQuery || ''}
          onChange={e => setFilter({ searchQuery: e.target.value || undefined })}
          placeholder="搜索..."
          className="w-28 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.04] text-[10px] text-white/50 placeholder:text-white/15 outline-none"
          onBlur={() => { if (!filter.searchQuery) {setSearchOpen(false)} }}
        />
      )}
      <select value={filter.status || ''} onChange={e => setFilter({ status: (e.target.value || undefined) as any })} className="bg-transparent text-[9px] text-white/25 outline-none cursor-pointer">
        <option value="">状态</option>
        {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
      </select>
      <select value={filter.priority || ''} onChange={e => setFilter({ priority: (e.target.value || undefined) as any })} className="bg-transparent text-[9px] text-white/25 outline-none cursor-pointer">
        <option value="">优先级</option>
        {(['critical', 'high', 'medium', 'low'] as const).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
      </select>
      {hasFilter && (
        <button onClick={clearFilter} className="text-[9px] text-white/20 hover:text-red-400/60 ml-0.5"><X className="w-2.5 h-2.5" /></button>
      )}
    </div>
  )
}

// ============================================
// Sort Button
// ============================================

function SortButton() {
  const { sortBy, setSortBy, sortOrder, toggleSortOrder } = useTaskStore()
  const [open, setOpen] = useState(false)
  const opts: { key: typeof sortBy; label: string }[] = [
    { key: 'priority', label: '优先级' }, { key: 'dueDate', label: '截止日期' },
    { key: 'createdAt', label: '创建时间' }, { key: 'updatedAt', label: '更新时间' }, { key: 'title', label: '标题' },
  ]
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 rounded text-white/15 hover:text-white/30"><ArrowUpDown className="w-3 h-3" /></button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 py-1 rounded-lg border border-white/[0.06] z-50" style={{ background: 'rgba(18,18,30,0.95)', backdropFilter: 'blur(12px)' }}>
          {opts.map(o => (
            <button key={o.key} onClick={() => { setSortBy(o.key); setOpen(false) }} className={`w-full text-left px-2.5 py-1 text-[10px] transition-colors ${sortBy === o.key ? 'text-white/60 bg-white/[0.04]' : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'}`}>{o.label}</button>
          ))}
          <div className="border-t border-white/[0.04] my-0.5" />
          <button onClick={() => { toggleSortOrder(); setOpen(false) }} className="w-full text-left px-2.5 py-1 text-[10px] text-white/30 hover:text-white/50">{sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}</button>
        </div>
      )}
    </div>
  )
}

// ============================================
// Batch Bar
// ============================================

function BatchBar() {
  const { isLG } = useLiquidGlass()
  const { selectedTaskIds, clearSelection, batchUpdateStatus, batchDelete, batchArchive } = useTaskStore()
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] border ${isLG ? 'border-emerald-500/10 bg-emerald-500/[0.04]' : 'border-violet-500/10 bg-violet-500/[0.04]'}`}>
      <span className="text-white/30">{selectedTaskIds.length} 选中</span>
      <button onClick={() => batchUpdateStatus('done')} className="text-emerald-400/50 hover:text-emerald-400" title="标记完成"><Check className="w-3 h-3" /></button>
      <button onClick={() => batchArchive} className="text-amber-400/50 hover:text-amber-400" title="归档"><Archive className="w-3 h-3" /></button>
      <button onClick={batchDelete} className="text-red-400/50 hover:text-red-400" title="删除"><Trash2 className="w-3 h-3" /></button>
      <button onClick={clearSelection} className="text-white/20 hover:text-white/40"><X className="w-3 h-3" /></button>
    </div>
  )
}

// ============================================
// AI Infer Button — upgraded to use ai-service-store
// ============================================

function AIInferButton() {
  const { isLG } = useLiquidGlass()
  const { inferring, inferTasksFromText, acceptInference } = useTaskStore()
  const [showDialog, setShowDialog] = useState(false)
  const [inferText, setInferText] = useState('')
  const [inferences, setInferences] = useState<TaskInference[]>([])

  const handleInfer = async () => {
    if (!inferText.trim()) {return}
    const results = await inferTasksFromText(inferText)
    setInferences(results)
  }

  const handleAccept = (inf: TaskInference) => {
    acceptInference(inf)
    setInferences(prev => prev.filter(i => i !== inf))
    toast.success(`任务已创建: ${inf.task.title.slice(0, 30)}`)
  }

  const handleAcceptAll = () => {
    inferences.forEach(inf => acceptInference(inf))
    toast.success(`已批量创建 ${inferences.length} 个任务`)
    setInferences([])
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        disabled={inferring}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors ${isLG ? 'text-emerald-400/50 hover:bg-emerald-500/[0.06]' : 'text-violet-400/50 hover:bg-violet-500/[0.06]'}`}
      >
        {inferring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
        AI 推理
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowDialog(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-[480px] max-h-[80vh] overflow-y-auto rounded-xl border border-white/[0.08] p-4" style={{ background: 'rgba(12,12,20,0.96)', backdropFilter: 'blur(20px)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className={`w-4 h-4 ${isLG ? 'text-emerald-400/60' : 'text-violet-400/60'}`} />
                <span className="text-[12px] text-white/60">AI 任务推理</span>
                <ProviderBadge />
              </div>
              <button onClick={() => setShowDialog(false)} className="text-white/20 hover:text-white/50"><X className="w-4 h-4" /></button>
            </div>

            <textarea value={inferText} onChange={e => setInferText(e.target.value)} placeholder="粘贴对话内容、需求描述或代码注释，AI 将自动提取任务..." className="w-full h-28 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/50 placeholder:text-white/15 outline-none resize-none" />

            <button onClick={handleInfer} disabled={inferring || !inferText.trim()} className={`mt-2 px-4 py-1.5 rounded-lg text-[11px] transition-colors ${inferring ? 'opacity-50 cursor-wait' : ''} ${isLG ? 'bg-emerald-500/15 text-emerald-400/70 hover:bg-emerald-500/25' : 'bg-violet-500/15 text-violet-400/70 hover:bg-violet-500/25'}`}>
              {inferring ? <><Loader2 className="w-3 h-3 inline animate-spin mr-1" /> 推理中...</> : '开始推理'}
            </button>

            {inferences.length > 0 && (
              <div className="mt-3 space-y-2">
                <span className="text-[10px] text-white/25">推理结果 ({inferences.length})</span>
                {inferences.map((inf, idx) => (
                  <div key={idx} className="p-2 rounded-lg border border-white/[0.04] bg-white/[0.02]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-white/50 truncate">{inf.task.title}</div>
                        <div className="text-[9px] text-white/20 mt-0.5">{inf.reasoning}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[8px] px-1 py-0.5 rounded ${PRIORITY_CONFIG[inf.task.priority].color} bg-white/[0.03]`}>{PRIORITY_CONFIG[inf.task.priority].label}</span>
                          <span className="text-[8px] text-white/15">{TYPE_CONFIG[inf.task.type].label}</span>
                          <span className="text-[8px] text-white/15">置信度 {(inf.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <button onClick={() => handleAccept(inf)} className={`shrink-0 px-2 py-1 rounded text-[9px] ${isLG ? 'bg-emerald-500/10 text-emerald-400/60 hover:bg-emerald-500/20' : 'bg-violet-500/10 text-violet-400/60 hover:bg-violet-500/20'}`}>
                        <Check className="w-3 h-3 inline mr-0.5" /> 采纳
                      </button>
                    </div>
                  </div>
                ))}
                {inferences.length > 1 && (
                  <button onClick={handleAcceptAll} className={`mt-2 px-4 py-1.5 rounded-lg text-[11px] transition-colors ${isLG ? 'bg-emerald-500/15 text-emerald-400/70 hover:bg-emerald-500/25' : 'bg-violet-500/15 text-violet-400/70 hover:bg-violet-500/25'}`}>
                    <Check className="w-3 h-3 inline mr-0.5" /> 全部采纳
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/** Small badge showing active AI provider/model */
function ProviderBadge() {
  const provider = useAIServiceStore(s => s.getActiveProvider())
  const model = useAIServiceStore(s => s.getActiveModel())
  if (!provider) {return null}
  return (
    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.03] text-white/20">
      {provider.displayName} / {model?.displayName || '—'}
    </span>
  )
}

// ============================================
// Add Task Form
// ============================================

function AddTaskForm({ onClose }: { onClose: () => void }) {
  const { isLG } = useLiquidGlass()
  const { addTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [type, setType] = useState<TaskType>('feature')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {return}
    addTask({ title: title.trim(), status: 'todo', priority, type, sortIndex: 0, source: 'manual' as any })
    toast.success('任务已创建')
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 px-3 py-2 border-b ${isLG ? 'border-emerald-500/[0.06] bg-emerald-500/[0.02]' : 'border-white/[0.04] bg-white/[0.01]'}`}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="输入任务标题..." className="flex-1 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.04] text-[11px] text-white/60 placeholder:text-white/15 outline-none" />
      <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="bg-transparent text-[9px] text-white/30 outline-none">
        {(['critical', 'high', 'medium', 'low'] as const).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
      </select>
      <select value={type} onChange={e => setType(e.target.value as TaskType)} className="bg-transparent text-[9px] text-white/30 outline-none">
        {(Object.keys(TYPE_CONFIG) as TaskType[]).map(tp => <option key={tp} value={tp}>{TYPE_CONFIG[tp].label}</option>)}
      </select>
      <button type="submit" className={`p-1 rounded ${isLG ? 'text-emerald-400/60 hover:bg-emerald-500/10' : 'text-violet-400/60 hover:bg-violet-500/10'}`}><Check className="w-3.5 h-3.5" /></button>
      <button type="button" onClick={onClose} className="p-1 rounded text-white/20 hover:text-white/40"><X className="w-3.5 h-3.5" /></button>
    </form>
  )
}

// ============================================
// Kanban View — react-dnd powered
// ============================================

function KanbanView() {
  const getTasksByStatus = useTaskStore(s => s.getTasksByStatus)
  return (
    <div className="flex gap-2 p-2 h-full overflow-x-auto">
      {STATUSES.map(status => (
        <KanbanColumn key={status} status={status} tasks={getTasksByStatus(status)} />
      ))}
    </div>
  )
}

function KanbanColumn({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const { isLG } = useLiquidGlass()
  const moveTask = useTaskStore(s => s.moveTask)
  const wipLimits = useTaskStore(s => s.wipLimits)
  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon
  const wipLimit = wipLimits[status]
  const isOverWip = wipLimit > 0 && tasks.length > wipLimit

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: DND_TASK,
    canDrop: (item) => item.status !== status,
    drop: (item) => { moveTask(item.id, status) },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  const dropHighlight = isOver && canDrop
    ? isLG ? 'ring-1 ring-emerald-400/30 bg-emerald-500/[0.04]' : 'ring-1 ring-violet-400/30 bg-violet-500/[0.04]'
    : canDrop && isOver === false ? '' : ''

  return (
    <div
      ref={drop as any}
      className={`flex flex-col min-w-[200px] max-w-[240px] flex-1 rounded-lg border transition-all ${config.bg} ${dropHighlight}`}
    >
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.03]">
        <div className="flex items-center gap-1.5">
          <StatusIcon className={`w-3 h-3 ${config.color}`} />
          <span className="text-[10px] text-white/40">{config.label}</span>
          {wipLimit > 0 && (
            <span className={`text-[8px] px-1 py-0.5 rounded ${isOverWip ? 'bg-red-500/15 text-red-400/70' : 'bg-white/[0.04] text-white/15'}`}>
              WIP {wipLimit}
            </span>
          )}
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isOverWip ? 'bg-red-500/15 text-red-400/70' : 'text-white/15 bg-white/[0.04]'}`}>{tasks.length}</span>
      </div>
      {isOverWip && (
        <div className="px-2.5 py-1 bg-red-500/[0.06] border-b border-red-500/10">
          <span className="text-[8px] text-red-400/60 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> 超出 WIP 限制 ({tasks.length}/{wipLimit})
          </span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {tasks.map(task => <DndTaskCard key={task.id} task={task} />)}
        {tasks.length === 0 && <div className="text-[9px] text-white/10 text-center py-4">无任务</div>}
      </div>
    </div>
  )
}

// ============================================
// DnD Task Card
// ============================================

function DndTaskCard({ task }: { task: Task }) {
  const { isLG } = useLiquidGlass()
  const { selectedTaskIds, toggleSelectTask, setDetailTask, moveTask, deleteTask, duplicateTask, archiveTask } = useTaskStore()
  const reorderTask = useTaskStore(s => s.reorderTask)
  const isSelected = selectedTaskIds.includes(task.id)
  const [menuOpen, setMenuOpen] = useState(false)

  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: DND_TASK,
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  })

  // Accept drops for intra-column reorder
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const [{ isOverCard, dropPosition }, cardDrop] = useDrop<DragItem, void, { isOverCard: boolean; dropPosition: 'top' | 'bottom' | null }>({
    accept: DND_TASK,
    canDrop: (item) => item.id !== task.id,
    hover: (item, monitor) => {
      // RAF throttle: skip if a frame is already pending
      if (rafRef.current) {return}
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (!cardRef.current || item.id === task.id) {return}
        const hoverRect = cardRef.current.getBoundingClientRect()
        const clientOffset = monitor.getClientOffset()
        if (!clientOffset) {return}
        const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2
        const hoverClientY = clientOffset.y - hoverRect.top
        // Only trigger reorder when cursor passes the midpoint
        if (hoverClientY < hoverMiddleY) {
          // hovering top half
        } else {
          // hovering bottom half
        }
      })
    },
    drop: (item, monitor) => {
      if (item.id === task.id) {return}
      if (!cardRef.current) {return}
      const hoverRect = cardRef.current.getBoundingClientRect()
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) {return}
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2
      const hoverClientY = clientOffset.y - hoverRect.top
      const position = hoverClientY < hoverMiddleY ? 'before' : 'after'
      reorderTask(item.id, task.id, position)
    },
    collect: (monitor) => {
      if (!monitor.isOver({ shallow: true }) || monitor.getItem()?.id === task.id) {
        return { isOverCard: false, dropPosition: null }
      }
      // Determine position for visual indicator
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset || !cardRef.current) {return { isOverCard: true, dropPosition: null }}
      const hoverRect = cardRef.current.getBoundingClientRect()
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2
      const hoverClientY = clientOffset.y - hoverRect.top
      return {
        isOverCard: true,
        dropPosition: hoverClientY < hoverMiddleY ? 'top' : 'bottom',
      }
    },
  })

  // Combine drop ref with card ref
  cardDrop(cardRef)

  // Combine preview + cardRef
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    cardRef.current = node
    preview(node)
    cardDrop(node)
  }, [preview, cardDrop])

  const completedSubs = task.subtasks?.filter(st => st.isCompleted).length || 0
  const totalSubs = task.subtasks?.length || 0
  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== 'done'
  const TypeIcon = TYPE_CONFIG[task.type].icon
  const priorityCfg = PRIORITY_CONFIG[task.priority]

  return (
    <div
      ref={combinedRef}
      onClick={() => setDetailTask(task.id)}
      className={`relative p-2 rounded-lg border cursor-pointer transition-all group ${
        isDragging ? 'opacity-30 scale-95' :
        isSelected ? (isLG ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : 'border-violet-500/20 bg-violet-500/[0.04]')
          : 'border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.06]'
      }`}
    >
      {/* Drop position indicator */}
      {isOverCard && dropPosition === 'top' && (
        <div className={`absolute -top-0.5 left-1 right-1 h-0.5 rounded-full ${isLG ? 'bg-emerald-400/60' : 'bg-violet-400/60'}`} />
      )}
      {isOverCard && dropPosition === 'bottom' && (
        <div className={`absolute -bottom-0.5 left-1 right-1 h-0.5 rounded-full ${isLG ? 'bg-emerald-400/60' : 'bg-violet-400/60'}`} />
      )}

      {/* Drag handle */}
      <div ref={drag as any} className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5"
        onClick={e => e.stopPropagation()}>
        <GripVertical className="w-2.5 h-2.5 text-white/15" />
      </div>

      {/* Select checkbox */}
      <button onClick={e => { e.stopPropagation(); toggleSelectTask(task.id) }}
        className="absolute top-1.5 left-5 opacity-0 group-hover:opacity-100 transition-opacity">
        {isSelected ? <CheckSquare className={`w-3 h-3 ${isLG ? 'text-emerald-400/60' : 'text-violet-400/60'}`} /> : <Square className="w-3 h-3 text-white/15" />}
      </button>

      {/* Context menu */}
      <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/[0.06]">
        <MoreHorizontal className="w-3 h-3 text-white/20" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-6 z-50 w-28 py-1 rounded-lg border border-white/[0.06]" style={{ background: 'rgba(18,18,30,0.95)' }}
          onClick={e => e.stopPropagation()} onMouseLeave={() => setMenuOpen(false)}>
          {STATUSES.filter(s => s !== task.status).map(s => (
            <button key={s} onClick={() => { moveTask(task.id, s); setMenuOpen(false) }} className="w-full text-left px-2 py-1 text-[9px] text-white/30 hover:text-white/50 hover:bg-white/[0.03]">→ {STATUS_CONFIG[s].label}</button>
          ))}
          <div className="border-t border-white/[0.04] my-0.5" />
          <button onClick={() => { duplicateTask(task.id); setMenuOpen(false) }} className="w-full text-left px-2 py-1 text-[9px] text-white/30 hover:text-white/50 hover:bg-white/[0.03] flex items-center gap-1"><Copy className="w-2.5 h-2.5" /> 复制</button>
          <button onClick={() => { archiveTask(task.id); setMenuOpen(false) }} className="w-full text-left px-2 py-1 text-[9px] text-white/30 hover:text-white/50 hover:bg-white/[0.03] flex items-center gap-1"><Archive className="w-2.5 h-2.5" /> 归档</button>
          <button onClick={() => { deleteTask(task.id); setMenuOpen(false) }} className="w-full text-left px-2 py-1 text-[9px] text-red-400/50 hover:text-red-400 hover:bg-white/[0.03] flex items-center gap-1"><Trash2 className="w-2.5 h-2.5" /> 删除</button>
        </div>
      )}

      {/* Title */}
      <div className="text-[11px] text-white/50 pr-4 pl-3 mb-1 truncate">{task.title}</div>

      {/* Meta */}
      <div className="flex items-center gap-1.5 flex-wrap pl-3">
        <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} title={priorityCfg.label} />
        <span className="text-[8px] text-white/15 flex items-center gap-0.5"><TypeIcon className="w-2.5 h-2.5" /> {TYPE_CONFIG[task.type].label}</span>
        {task.source === 'ai-inferred' && (
          <span className={`text-[7px] px-1 py-0.5 rounded ${isLG ? 'bg-emerald-500/10 text-emerald-400/40' : 'bg-violet-500/10 text-violet-400/40'}`}>
            AI {task.confidence ? `${(task.confidence * 100).toFixed(0)}%` : ''}
          </span>
        )}
        {task.dueDate && (
          <span className={`text-[8px] flex items-center gap-0.5 ${isOverdue ? 'text-red-400/60' : 'text-white/15'}`}>
            <Calendar className="w-2.5 h-2.5" />
            {new Date(task.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {task.estimatedHours != null && (
          <span className="text-[8px] text-white/15 flex items-center gap-0.5"><Timer className="w-2.5 h-2.5" /> {task.estimatedHours}h</span>
        )}
      </div>

      {totalSubs > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5 pl-3">
          <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
            <div className={`h-full rounded-full transition-all ${isLG ? 'bg-emerald-500/40' : 'bg-violet-500/40'}`} style={{ width: `${(completedSubs / totalSubs) * 100}%` }} />
          </div>
          <span className="text-[8px] text-white/15 shrink-0">{completedSubs}/{totalSubs}</span>
        </div>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 flex-wrap pl-3">
          {task.tags.slice(0, 3).map(tag => <span key={tag} className="text-[7px] px-1 py-0.5 rounded bg-white/[0.03] text-white/15">{tag}</span>)}
          {task.tags.length > 3 && <span className="text-[7px] text-white/10">+{task.tags.length - 3}</span>}
        </div>
      )}
    </div>
  )
}

// ============================================
// List View
// ============================================

function ListView() {
  const getFilteredTasks = useTaskStore(s => s.getFilteredTasks)
  const tasks = getFilteredTasks()
  const { selectedTaskIds, toggleSelectTask, setDetailTask } = useTaskStore()

  if (tasks.length === 0) {return <div className="text-center text-[11px] text-white/15 py-8">无任务</div>}

  const renderRow = (task: Task) => {
    const isSelected = selectedTaskIds.includes(task.id)
    const cfg = STATUS_CONFIG[task.status]
    const StatusIcon = cfg.icon
    const priorityCfg = PRIORITY_CONFIG[task.priority]
    const TypeIcon = TYPE_CONFIG[task.type].icon
    const completedSubs = task.subtasks?.filter(st => st.isCompleted).length || 0
    const totalSubs = task.subtasks?.length || 0
    return (
      <div onClick={() => setDetailTask(task.id)} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors border-b border-white/[0.03] ${isSelected ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}>
        <button onClick={e => { e.stopPropagation(); toggleSelectTask(task.id) }} className="shrink-0">
          {isSelected ? <CheckSquare className="w-3 h-3 text-emerald-400/60" /> : <Square className="w-3 h-3 text-white/10" />}
        </button>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityCfg.dot}`} />
        <StatusIcon className={`w-3 h-3 shrink-0 ${cfg.color}`} />
        <span className="text-[10px] text-white/50 flex-1 truncate">{task.title}</span>
        <span className="text-[8px] text-white/15 flex items-center gap-0.5 shrink-0"><TypeIcon className="w-2.5 h-2.5" /> {TYPE_CONFIG[task.type].label}</span>
        {totalSubs > 0 && <span className="text-[8px] text-white/15 shrink-0">{completedSubs}/{totalSubs}</span>}
        {task.dueDate && <span className={`text-[8px] shrink-0 ${task.dueDate < Date.now() && task.status !== 'done' ? 'text-red-400/60' : 'text-white/15'}`}>{new Date(task.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>}
      </div>
    )
  }

  // Use react-virtuoso for large lists (>100 tasks) to maintain 60fps scrolling
  if (tasks.length > 100) {
    return (
      <Virtuoso
        data={tasks}
        itemContent={(_, task) => renderRow(task)}
        style={{ height: '100%' }}
        overscan={20}
      />
    )
  }

  return (
    <div>
      {tasks.map(task => <div key={task.id}>{renderRow(task)}</div>)}
    </div>
  )
}

// ============================================
// Task Detail Side Panel
// ============================================

function TaskDetailPanel() {
  const { isLG } = useLiquidGlass()
  const { detailTaskId, setDetailTask, updateTask, addSubtask, toggleSubtask, deleteSubtask, deleteTask, addReminder } = useTaskStore()
  const task = useTaskStore(s => s.tasks.find(t => t.id === s.detailTaskId))

  const [editTitle, setEditTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editDesc, setEditDesc] = useState(false)
  const [descDraft, setDescDraft] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [newTag, setNewTag] = useState('')

  // Sync drafts when task changes
  useEffect(() => {
    if (task) {
      setTitleDraft(task.title)
      setDescDraft(task.description || '')
      setEditTitle(false)
      setEditDesc(false)
    }
  }, [detailTaskId])

  if (!task) {return null}

  const completedSubs = task.subtasks?.filter(st => st.isCompleted).length || 0
  const totalSubs = task.subtasks?.length || 0
  const priorityCfg = PRIORITY_CONFIG[task.priority]
  const StatusIcon = STATUS_CONFIG[task.status].icon
  const TypeIcon = TYPE_CONFIG[task.type].icon

  const saveTitle = () => {
    if (titleDraft.trim() && titleDraft !== task.title) {updateTask(task.id, { title: titleDraft.trim() })}
    setEditTitle(false)
  }
  const saveDesc = () => {
    updateTask(task.id, { description: descDraft || undefined })
    setEditDesc(false)
  }
  const handleAddSubtask = () => {
    if (!newSubtask.trim()) {return}
    addSubtask(task.id, newSubtask.trim())
    setNewSubtask('')
  }
  const handleAddTag = () => {
    if (!newTag.trim()) {return}
    const tags = [...(task.tags || []), newTag.trim()]
    updateTask(task.id, { tags })
    setNewTag('')
  }
  const handleRemoveTag = (tag: string) => {
    updateTask(task.id, { tags: (task.tags || []).filter(t => t !== tag) })
  }
  const handleSetDueDate = (dateStr: string) => {
    if (!dateStr) { updateTask(task.id, { dueDate: undefined }); return }
    updateTask(task.id, { dueDate: new Date(dateStr).getTime() })
  }
  const handleAddDeadlineReminder = () => {
    if (!task.dueDate) {return}
    addReminder({
      taskId: task.id,
      type: 'deadline',
      message: `任务「${task.title}」即将到期`,
      remindAt: task.dueDate - 24 * 60 * 60 * 1000,
    })
    toast.success('截止日期提醒已设置（提前24小时）')
  }

  const accent = isLG ? 'emerald' : 'violet'

  return (
    <div
      className={`w-[300px] shrink-0 border-l overflow-y-auto ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}
      style={{ background: isLG ? 'rgba(10,15,10,0.4)' : 'rgba(12,12,20,0.5)' }}
    >
      {/* Panel header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b sticky top-0 z-10 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}
        style={{ background: isLG ? 'rgba(10,15,10,0.8)' : 'rgba(12,12,20,0.9)', backdropFilter: 'blur(8px)' }}>
        <span className="text-[10px] text-white/30">任务详情</span>
        <div className="flex items-center gap-1">
          <button onClick={() => deleteTask(task.id)} className="p-1 rounded text-red-400/30 hover:text-red-400/60 hover:bg-red-500/[0.06]" title="删除"><Trash2 className="w-3 h-3" /></button>
          <button onClick={() => setDetailTask(null)} className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.04]"><PanelRightClose className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Title */}
        <div>
          {editTitle ? (
            <div className="flex items-center gap-1">
              <input value={titleDraft} onChange={e => setTitleDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveTitle()}
                autoFocus className="flex-1 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-[12px] text-white/60 outline-none" />
              <button onClick={saveTitle} className={`p-1 rounded text-${accent}-400/60`}><Save className="w-3 h-3" /></button>
              <button onClick={() => setEditTitle(false)} className="p-1 rounded text-white/20"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="flex items-start gap-1 group/title cursor-pointer" onClick={() => setEditTitle(true)}>
              <span className="text-[13px] text-white/60 flex-1">{task.title}</span>
              <Edit3 className="w-3 h-3 text-white/10 opacity-0 group-hover/title:opacity-100 transition-opacity mt-0.5 shrink-0" />
            </div>
          )}
        </div>

        {/* Status & Priority & Type row */}
        <div className="flex items-center gap-2 flex-wrap">
          <select value={task.status} onChange={e => updateTask(task.id, { status: e.target.value as TaskStatus })}
            className={`px-2 py-1 rounded-md text-[10px] bg-white/[0.03] border border-white/[0.04] text-white/40 outline-none`}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
          <select value={task.priority} onChange={e => updateTask(task.id, { priority: e.target.value as TaskPriority })}
            className={`px-2 py-1 rounded-md text-[10px] bg-white/[0.03] border border-white/[0.04] ${priorityCfg.color} outline-none`}>
            {(['critical', 'high', 'medium', 'low'] as const).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
          </select>
          <select value={task.type} onChange={e => updateTask(task.id, { type: e.target.value as TaskType })}
            className="px-2 py-1 rounded-md text-[10px] bg-white/[0.03] border border-white/[0.04] text-white/30 outline-none">
            {(Object.keys(TYPE_CONFIG) as TaskType[]).map(tp => <option key={tp} value={tp}>{TYPE_CONFIG[tp].label}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <div className="text-[9px] text-white/20 mb-1">描述</div>
          {editDesc ? (
            <div>
              <textarea value={descDraft} onChange={e => setDescDraft(e.target.value)} rows={4}
                className="w-full px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/50 outline-none resize-none" autoFocus />
              <div className="flex items-center gap-1 mt-1">
                <button onClick={saveDesc} className={`px-2 py-0.5 rounded text-[9px] bg-${accent}-500/10 text-${accent}-400/60`}>保存</button>
                <button onClick={() => setEditDesc(false)} className="px-2 py-0.5 rounded text-[9px] text-white/20">取消</button>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-white/30 cursor-pointer hover:text-white/40 min-h-[24px] px-2 py-1 rounded bg-white/[0.02] border border-transparent hover:border-white/[0.04]"
              onClick={() => { setDescDraft(task.description || ''); setEditDesc(true) }}>
              {task.description || '点击添加描述...'}
            </div>
          )}
        </div>

        {/* Due Date */}
        <div>
          <div className="text-[9px] text-white/20 mb-1 flex items-center gap-1"><CalendarClock className="w-3 h-3" /> 截止日期</div>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              onChange={e => handleSetDueDate(e.target.value)}
              className="flex-1 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.04] text-[10px] text-white/40 outline-none"
            />
            {task.dueDate && (
              <button onClick={handleAddDeadlineReminder} className={`p-1 rounded text-${accent}-400/40 hover:text-${accent}-400/70 hover:bg-${accent}-500/[0.06]`} title="设置提醒">
                <Bell className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Estimated hours */}
        <div>
          <div className="text-[9px] text-white/20 mb-1 flex items-center gap-1"><Timer className="w-3 h-3" /> 预估时间（小时）</div>
          <input
            type="number" min={0} step={0.5}
            value={task.estimatedHours ?? ''}
            onChange={e => updateTask(task.id, { estimatedHours: e.target.value ? Number(e.target.value) : undefined })}
            className="w-24 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.04] text-[10px] text-white/40 outline-none"
          />
        </div>

        {/* Subtasks */}
        <div>
          <div className="text-[9px] text-white/20 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" /> 子任务 {totalSubs > 0 && `(${completedSubs}/${totalSubs})`}</span>
          </div>
          <div className="space-y-0.5">
            {task.subtasks?.map(st => (
              <div key={st.id} className="flex items-center gap-1.5 group/st py-0.5">
                <button onClick={() => toggleSubtask(task.id, st.id)} className="shrink-0">
                  {st.isCompleted
                    ? <CheckSquare className={`w-3 h-3 text-${accent}-400/60`} />
                    : <Square className="w-3 h-3 text-white/15 hover:text-white/30" />}
                </button>
                <span className={`text-[10px] flex-1 ${st.isCompleted ? 'text-white/20 line-through' : 'text-white/40'}`}>{st.title}</span>
                <button onClick={() => deleteSubtask(task.id, st.id)}
                  className="opacity-0 group-hover/st:opacity-100 text-red-400/30 hover:text-red-400/60 p-0.5 rounded"><X className="w-2.5 h-2.5" /></button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
              placeholder="添加子任务..." className="flex-1 px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.03] text-[9px] text-white/40 placeholder:text-white/10 outline-none" />
            <button onClick={handleAddSubtask} className={`p-0.5 rounded text-${accent}-400/40 hover:text-${accent}-400/70`}><Plus className="w-3 h-3" /></button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="text-[9px] text-white/20 mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> 标签</div>
          <div className="flex items-center gap-1 flex-wrap">
            {task.tags?.map(tag => (
              <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25 flex items-center gap-0.5">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="text-white/10 hover:text-red-400/50"><X className="w-2 h-2" /></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <input value={newTag} onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              placeholder="新标签..." className="w-24 px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.03] text-[9px] text-white/40 placeholder:text-white/10 outline-none" />
            <button onClick={handleAddTag} className={`p-0.5 rounded text-${accent}-400/40 hover:text-${accent}-400/70`}><Plus className="w-3 h-3" /></button>
          </div>
        </div>

        {/* Dependencies & Blocking */}
        <DependencySelector taskId={task.id} dependencies={task.dependencies || []} blocking={task.blocking || []} accent={accent} />

        {/* Related files */}
        {task.relatedFiles && task.relatedFiles.length > 0 && (
          <div>
            <div className="text-[9px] text-white/20 mb-1 flex items-center gap-1"><FileCode2 className="w-3 h-3" /> 关联文件</div>
            <div className="space-y-0.5">
              {task.relatedFiles.map(f => (
                <div key={f} className="text-[9px] text-white/25 px-2 py-0.5 rounded bg-white/[0.02] font-mono truncate">{f}</div>
              ))}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="pt-2 border-t border-white/[0.03] space-y-1">
          <div className="text-[8px] text-white/10 flex items-center justify-between">
            <span>来源</span>
            <span>{task.source === 'ai-inferred' ? `AI 推理 (${task.confidence ? (task.confidence * 100).toFixed(0) + '%' : ''})` : task.source === 'imported' ? '导入' : '手动'}</span>
          </div>
          <div className="text-[8px] text-white/10 flex items-center justify-between">
            <span>创建</span>
            <span>{new Date(task.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="text-[8px] text-white/10 flex items-center justify-between">
            <span>更新</span>
            <span>{new Date(task.updatedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Dependency Selector
// ============================================

function DependencySelector({ taskId, dependencies, blocking, accent }: { taskId: string; dependencies: string[]; blocking: string[]; accent: string }) {
  const { tasks, addDependency, removeDependency, addBlocking, removeBlocking } = useTaskStore()
  const [depOpen, setDepOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [depSearch, setDepSearch] = useState('')
  const [blockSearch, setBlockSearch] = useState('')

  // 300ms debounce for search filtering
  const debouncedDepSearch = useDebounce(depSearch, 300)
  const debouncedBlockSearch = useDebounce(blockSearch, 300)

  const otherTasks = tasks.filter(t => t.id !== taskId && !t.isArchived)
  const depCandidates = otherTasks.filter(t => !dependencies.includes(t.id) && t.title.toLowerCase().includes(debouncedDepSearch.toLowerCase()))
  const blockCandidates = otherTasks.filter(t => !blocking.includes(t.id) && t.title.toLowerCase().includes(debouncedBlockSearch.toLowerCase()))

  return (
    <div className="space-y-3">
      {/* Dependencies — this task depends on */}
      <div>
        <div className="text-[9px] text-white/20 mb-1 flex items-center gap-1"><Link2 className="w-3 h-3" /> 依赖（此任务依赖于）</div>
        <div className="flex items-center gap-1 flex-wrap mb-1">
          {dependencies.map(id => {
            const dep = tasks.find(t => t.id === id)
            return (
              <span key={id} className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/[0.08] text-blue-400/40 flex items-center gap-0.5">
                {dep?.title?.slice(0, 20) || '未知'}
                <button onClick={() => removeDependency(taskId, id)} className="text-white/10 hover:text-red-400/50"><X className="w-2 h-2" /></button>
              </span>
            )
          })}
          {dependencies.length === 0 && <span className="text-[8px] text-white/10">无依赖</span>}
        </div>
        <div className="relative">
          <button onClick={() => { setDepOpen(!depOpen); setBlockOpen(false) }}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-white/20 hover:text-white/40 hover:bg-white/[0.03] border border-white/[0.03]">
            <Plus className="w-2.5 h-2.5" /> 添加依赖
          </button>
          {depOpen && (
            <div className="absolute left-0 top-full mt-1 w-52 max-h-40 overflow-y-auto py-1 rounded-lg border border-white/[0.08] z-50" style={{ background: 'rgba(18,18,30,0.97)', backdropFilter: 'blur(12px)' }}>
              <input value={depSearch} onChange={e => setDepSearch(e.target.value)} placeholder="搜索任务..." autoFocus
                className="w-full px-2 py-1 bg-transparent border-b border-white/[0.04] text-[9px] text-white/50 placeholder:text-white/15 outline-none" />
              {depCandidates.slice(0, 10).map(t => (
                <button key={t.id} onClick={() => {
                  const ok = addDependency(taskId, t.id)
                  if (!ok) {
                    toast.error('无法添加：会形成循环依赖')
                  }
                  setDepOpen(false); setDepSearch('')
                }}
                  className="w-full text-left px-2 py-1 text-[9px] text-white/30 hover:text-white/50 hover:bg-white/[0.04] truncate">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${PRIORITY_CONFIG[t.priority].dot}`} />
                  {t.title}
                </button>
              ))}
              {depCandidates.length === 0 && <div className="text-[8px] text-white/10 text-center py-2">无可选任务</div>}
            </div>
          )}
        </div>
      </div>

      {/* Blocking — this task blocks */}
      <div>
        <div className="text-[9px] text-white/20 mb-1 flex items-center gap-1"><Unlink className="w-3 h-3" /> 阻塞（此任务阻塞）</div>
        <div className="flex items-center gap-1 flex-wrap mb-1">
          {blocking.map(id => {
            const blk = tasks.find(t => t.id === id)
            return (
              <span key={id} className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/[0.08] text-red-400/40 flex items-center gap-0.5">
                {blk?.title?.slice(0, 20) || '未知'}
                <button onClick={() => removeBlocking(taskId, id)} className="text-white/10 hover:text-red-400/50"><X className="w-2 h-2" /></button>
              </span>
            )
          })}
          {blocking.length === 0 && <span className="text-[8px] text-white/10">无阻塞</span>}
        </div>
        <div className="relative">
          <button onClick={() => { setBlockOpen(!blockOpen); setDepOpen(false) }}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-white/20 hover:text-white/40 hover:bg-white/[0.03] border border-white/[0.03]">
            <Plus className="w-2.5 h-2.5" /> 添加阻塞
          </button>
          {blockOpen && (
            <div className="absolute left-0 top-full mt-1 w-52 max-h-40 overflow-y-auto py-1 rounded-lg border border-white/[0.08] z-50" style={{ background: 'rgba(18,18,30,0.97)', backdropFilter: 'blur(12px)' }}>
              <input value={blockSearch} onChange={e => setBlockSearch(e.target.value)} placeholder="搜索任务..." autoFocus
                className="w-full px-2 py-1 bg-transparent border-b border-white/[0.04] text-[9px] text-white/50 placeholder:text-white/15 outline-none" />
              {blockCandidates.slice(0, 10).map(t => (
                <button key={t.id} onClick={() => { addBlocking(taskId, t.id); setBlockOpen(false); setBlockSearch('') }}
                  className="w-full text-left px-2 py-1 text-[9px] text-white/30 hover:text-white/50 hover:bg-white/[0.04] truncate">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${PRIORITY_CONFIG[t.priority].dot}`} />
                  {t.title}
                </button>
              ))}
              {blockCandidates.length === 0 && <div className="text-[8px] text-white/10 text-center py-2">无可选任务</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}