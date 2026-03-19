/**
 * @file TaskBoard.tsx
 * @description AI 任务看板 v4 — 5 列看板 + react-dnd 跨列拖拽(Touch+Desktop)
 *              + 日期选择器 + 任务描述 Modal(Markdown 预览) + 依赖关系 DAG 可视化
 *              + 子任务 + AI 推理提取(真实AI+降级) + 提醒 + 搜索筛选
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.0.0
 * @created 2026-03-17
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,task-board,kanban,dnd,touch,date-picker,markdown,dag,inference
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, CheckCircle2, Circle, Clock,
  ChevronDown, ChevronRight, Sparkles, Search,
  ListTodo, MoreHorizontal, ArrowUpCircle, ArrowDownCircle,
  MinusCircle, Copy, Archive, Eye, Flame, GripVertical,
  CalendarDays, Check, X, Loader, FileText, Link, Network,
  ChevronUp, Bell, ShieldAlert, Ban, PenLine,
  GanttChart, Users, Wifi, WifiOff, Move,
  type LucideIcon,
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import type {
  Task, TaskStatus, TaskPriority, TaskType, TaskFilter,
} from '../../types/task';
import { useTaskStore, taskStoreActions } from '../../services/task/useTaskStore';
import { taskInferenceEngine } from '../../services/task/TaskInferenceEngine';
import { reminderService, ReminderService, TASK_REMINDER_EVENT, type TaskReminderEventDetail } from '../../services/task/ReminderService';
import { toast } from 'sonner';
import { TaskGanttChart } from './TaskGanttChart';
import { useTaskCollab, taskCollabService } from '../../services/task/TaskCollabService';

/* ================================================================
   DnD — auto-detect touch vs mouse
   ================================================================ */

const DND_TASK_TYPE = 'TASK_CARD';

interface DragItem {
  id: string;
  status: TaskStatus;
}

/**
 * Touch support: SmartDndProvider dynamically loads react-dnd-touch-backend
 * on touch devices, falling back to HTML5Backend on desktop or if unavailable.
 */
function SmartDndProvider({ children }: { children: React.ReactNode }) {
  const [backend, setBackend] = useState<{ backend: any; options?: any }>({
    backend: HTML5Backend,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      import('react-dnd-touch-backend')
        .then((mod) => {
          setBackend({
            backend: mod.TouchBackend,
            options: { enableMouseEvents: true, delayTouchStart: 200 },
          });
        })
        .catch(() => {
          // Touch backend not available — use HTML5Backend
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return <>{children}</>;

  return (
    <DndProvider backend={backend.backend} options={backend.options}>
      {children}
    </DndProvider>
  );
}

/* ================================================================
   Constants & Config
   ================================================================ */

const STATUS_COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'review', 'done', 'blocked'];

const STATUS_CFG: Record<TaskStatus, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  'todo':        { label: '待处理', icon: Circle,       color: 'text-white/40',    bg: 'bg-white/[0.04]' },
  'in-progress': { label: '进行中', icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  'review':      { label: '审核中', icon: Eye,          color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  'done':        { label: '已完成', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'blocked':     { label: '已阻塞', icon: Ban,          color: 'text-red-400',     bg: 'bg-red-500/10' },
};

const PRIORITY_CFG: Record<TaskPriority, { label: string; icon: LucideIcon; color: string; order: number }> = {
  'critical': { label: '紧急', icon: Flame,           color: 'text-red-500',     order: 0 },
  'high':     { label: '高',   icon: ArrowUpCircle,   color: 'text-red-400',     order: 1 },
  'medium':   { label: '中',   icon: MinusCircle,     color: 'text-amber-400',   order: 2 },
  'low':      { label: '低',   icon: ArrowDownCircle, color: 'text-emerald-400', order: 3 },
};

const TYPE_CFG: Record<TaskType, { label: string; color: string }> = {
  'feature':       { label: '功能', color: 'bg-cyan-500/15 text-cyan-400' },
  'bug':           { label: 'Bug',  color: 'bg-red-500/15 text-red-400' },
  'refactor':      { label: '重构', color: 'bg-violet-500/15 text-violet-400' },
  'test':          { label: '测试', color: 'bg-emerald-500/15 text-emerald-400' },
  'documentation': { label: '文档', color: 'bg-blue-500/15 text-blue-400' },
  'other':         { label: '其他', color: 'bg-white/[0.06] text-white/30' },
};

/* ================================================================
   Simple Markdown Renderer (no external lib)
   ================================================================ */

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);margin:8px 0 4px">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);margin:8px 0 4px">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.8);margin:8px 0 4px">$1</h2>')
    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:rgba(255,255,255,0.7)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;font-size:10px;font-family:JetBrains Mono,monospace">$1</code>')
    // Checkbox
    .replace(/^- \[x\] (.+)$/gm, '<div style="display:flex;gap:4px;align-items:center"><span style="color:#34d399">✓</span><s style="color:rgba(255,255,255,0.25)">$1</s></div>')
    .replace(/^- \[ \] (.+)$/gm, '<div style="display:flex;gap:4px;align-items:center"><span style="color:rgba(255,255,255,0.15)">○</span><span>$1</span></div>')
    // Bullet list
    .replace(/^- (.+)$/gm, '<div style="padding-left:8px">• $1</div>')
    // Numbered list
    .replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:8px">$1. $2</div>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:6px 0" />')
    // Paragraph breaks
    .replace(/\n\n/g, '<div style="margin:4px 0"></div>')
    .replace(/\n/g, '<br/>');
  return html;
}

/* ================================================================
   TaskDescriptionModal — edit + markdown preview
   ================================================================ */

function TaskDescriptionModal({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [desc, setDesc] = useState(task.description || '');
  const [title, setTitle] = useState(task.title);
  const [depInput, setDepInput] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  const { tasks } = useTaskStore();
  const otherTasks = useMemo(() => tasks.filter(t => t.id !== task.id && !t.isArchived), [tasks, task.id]);
  const depTasks = useMemo(
    () => (task.dependencies || []).map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[],
    [tasks, task.dependencies]
  );
  const blockingTasks = useMemo(
    () => tasks.filter(t => !t.isArchived && t.dependencies?.includes(task.id)),
    [tasks, task.id]
  );

  const handleSave = () => {
    const updates: Partial<Task> = {};
    if (desc !== (task.description || '')) updates.description = desc;
    if (title !== task.title) updates.title = title;
    if (Object.keys(updates).length > 0) {
      taskStoreActions.updateTask(task.id, updates);
    }
    onClose();
  };

  const handleAddDependency = (depId: string) => {
    if (!depId || depId === task.id) return;
    const current = task.dependencies || [];
    if (current.includes(depId)) return;
    taskStoreActions.updateTask(task.id, { dependencies: [...current, depId] });
    setDepInput('');
  };

  const handleRemoveDependency = (depId: string) => {
    const current = task.dependencies || [];
    taskStoreActions.updateTask(task.id, { dependencies: current.filter(d => d !== depId) });
  };

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) handleSave(); }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#12131a] border border-white/[0.08] rounded-xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[#667eea]" />
            <span className="text-[11px] text-white/50" style={{ fontWeight: 600 }}>任务详情</span>
            <span className={`text-[8px] px-1 py-0 rounded ${TYPE_CFG[task.type].color}`}>
              {TYPE_CFG[task.type].label}
            </span>
            <span className={`text-[8px] ${PRIORITY_CFG[task.priority].color}`}>
              {PRIORITY_CFG[task.priority].label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode('edit')}
              className={`text-[9px] px-2 py-0.5 rounded transition-colors ${mode === 'edit' ? 'bg-[#667eea]/15 text-[#667eea]' : 'text-white/20 hover:text-white/40'}`}
            >
              <PenLine size={10} className="inline mr-1" />编辑
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`text-[9px] px-2 py-0.5 rounded transition-colors ${mode === 'preview' ? 'bg-[#667eea]/15 text-[#667eea]' : 'text-white/20 hover:text-white/40'}`}
            >
              <Eye size={10} className="inline mr-1" />预览
            </button>
            <button onClick={handleSave} className="p-1 text-white/15 hover:text-white/40">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="px-4 pt-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent text-[13px] text-white/80 outline-none placeholder:text-white/15"
            style={{ fontWeight: 600 }}
            placeholder="任务标题..."
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
          {mode === 'edit' ? (
            <textarea
              autoFocus
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="任务描述（支持 Markdown）...&#10;&#10;# 标题&#10;- 列表项&#10;- [x] 已完成&#10;- [ ] 待完成&#10;**加粗** `代码`"
              className="w-full min-h-[180px] bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white/60 placeholder:text-white/10 outline-none resize-y focus:border-[#667eea]/20 transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.6', scrollbarWidth: 'thin' }}
            />
          ) : (
            <div
              className="min-h-[180px] bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2 text-[11px] text-white/50"
              style={{ lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{
                __html: desc.trim()
                  ? renderMarkdown(desc)
                  : '<span style="color:rgba(255,255,255,0.1)">暂无描述内容</span>',
              }}
            />
          )}

          {/* Dependencies section */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Link size={10} className="text-[#667eea]/60" />
              <span className="text-[10px] text-white/40" style={{ fontWeight: 500 }}>依赖关系</span>
            </div>

            {/* Current dependencies */}
            {depTasks.length > 0 && (
              <div className="space-y-1 mb-2">
                {depTasks.map(dep => (
                  <div key={dep.id} className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02] border border-white/[0.04]">
                    <span className={`text-[8px] ${STATUS_CFG[dep.status].color}`}>
                      {STATUS_CFG[dep.status].label}
                    </span>
                    <span className="text-[10px] text-white/50 flex-1 truncate">{dep.title}</span>
                    <button
                      onClick={() => handleRemoveDependency(dep.id)}
                      className="p-0.5 text-white/10 hover:text-red-400 transition-colors"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Blocking (tasks that depend on this task) */}
            {blockingTasks.length > 0 && (
              <div className="mb-2">
                <span className="text-[8px] text-white/20 block mb-1">阻塞以下任务:</span>
                <div className="space-y-1">
                  {blockingTasks.map(bt => (
                    <div key={bt.id} className="flex items-center gap-2 px-2 py-1 rounded bg-red-500/[0.03] border border-red-500/10">
                      <ShieldAlert size={8} className="text-red-400/40 shrink-0" />
                      <span className="text-[10px] text-white/40 flex-1 truncate">{bt.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add dependency */}
            <select
              value={depInput}
              onChange={e => { handleAddDependency(e.target.value); }}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded text-[9px] text-white/30 px-2 py-1 outline-none"
            >
              <option value="">+ 添加依赖任务...</option>
              {otherTasks
                .filter(t => !(task.dependencies || []).includes(t.id))
                .map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
            </select>
          </div>

          {/* Meta info */}
          <div className="mt-4 flex flex-wrap gap-3 text-[8px] text-white/15">
            <span>创建: {format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm')}</span>
            <span>更新: {format(new Date(task.updatedAt), 'yyyy-MM-dd HH:mm')}</span>
            {task.dueDate && (
              <span className={task.dueDate < Date.now() ? 'text-red-400/60' : ''}>
                截止: {format(new Date(task.dueDate), 'yyyy-MM-dd')}
              </span>
            )}
            {task.completedAt && <span className="text-emerald-400/40">完成: {format(new Date(task.completedAt), 'yyyy-MM-dd')}</span>}
            <span>来源: {task.source}</span>
            <span>ID: {task.id}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-white/[0.06] shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-[10px] text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 rounded text-[10px] bg-[#667eea]/15 border border-[#667eea]/20 text-[#667eea] hover:bg-[#667eea]/25 transition-colors"
            style={{ fontWeight: 500 }}
          >
            保存
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   DependencyDAG — SVG-based DAG visualization
   ================================================================ */

function DependencyDAG({ onClose }: { onClose: () => void }) {
  const { tasks } = useTaskStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragOverrides, setDragOverrides] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);

  // Build graph: only tasks with dependencies or that are depended on
  const graph = useMemo(() => {
    const active = tasks.filter(t => !t.isArchived);
    const involvedIds = new Set<string>();
    for (const t of active) {
      if (t.dependencies && t.dependencies.length > 0) {
        involvedIds.add(t.id);
        for (const dep of t.dependencies) involvedIds.add(dep);
      }
    }
    const nodes = active.filter(t => involvedIds.has(t.id));
    const edges: Array<{ from: string; to: string }> = [];
    for (const t of nodes) {
      for (const dep of (t.dependencies || [])) {
        if (involvedIds.has(dep)) {
          edges.push({ from: dep, to: t.id });
        }
      }
    }
    return { nodes, edges };
  }, [tasks]);

  // Topological sort for layer assignment
  const layout = useMemo(() => {
    if (graph.nodes.length === 0) return { positions: new Map<string, { x: number; y: number }>() };

    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    for (const n of graph.nodes) {
      inDegree.set(n.id, 0);
      adj.set(n.id, []);
    }
    for (const e of graph.edges) {
      inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
      adj.get(e.from)?.push(e.to);
    }

    // BFS layers
    const layers: string[][] = [];
    const visited = new Set<string>();
    let queue = graph.nodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id);
    if (queue.length === 0) queue = [graph.nodes[0].id]; // cycle fallback

    while (queue.length > 0) {
      layers.push([...queue]);
      for (const id of queue) visited.add(id);
      const next: string[] = [];
      for (const id of queue) {
        for (const child of (adj.get(id) || [])) {
          if (!visited.has(child) && !next.includes(child)) {
            const remaining = (inDegree.get(child) || 0) - 1;
            inDegree.set(child, remaining);
            if (remaining <= 0) next.push(child);
          }
        }
      }
      queue = next;
      if (layers.length > 50) break; // safety
    }

    // Place unvisited nodes (cycles)
    const unvisited = graph.nodes.filter(n => !visited.has(n.id)).map(n => n.id);
    if (unvisited.length > 0) layers.push(unvisited);

    const colW = 160;
    const rowH = 50;
    const padX = 40;
    const padY = 30;

    const positions = new Map<string, { x: number; y: number }>();
    for (let layer = 0; layer < layers.length; layer++) {
      const items = layers[layer];
      for (let i = 0; i < items.length; i++) {
        positions.set(items[i], {
          x: padX + layer * colW,
          y: padY + i * rowH,
        });
      }
    }

    return { positions };
  }, [graph]);

  // Merge auto-layout with drag overrides
  const mergedPositions = useMemo(() => {
    const merged = new Map<string, { x: number; y: number }>();
    layout.positions.forEach((pos, id) => {
      const override = dragOverrides.get(id);
      merged.set(id, override || pos);
    });
    return merged;
  }, [layout.positions, dragOverrides]);

  // Node drag handlers
  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = mergedPositions.get(nodeId);
    if (!pos) return;
    setDraggingId(nodeId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, origX: pos.x, origY: pos.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = ev.clientX - dragStartRef.current.x;
      const dy = ev.clientY - dragStartRef.current.y;
      setDragOverrides(prev => {
        const next = new Map(prev);
        next.set(nodeId, {
          x: dragStartRef.current!.origX + dx,
          y: dragStartRef.current!.origY + dy,
        });
        return next;
      });
    };

    const onUp = () => {
      setDraggingId(null);
      dragStartRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [mergedPositions]);

  const handleResetLayout = useCallback(() => {
    setDragOverrides(new Map());
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) setCtxMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ctxMenu]);

  /** Right-click on DAG node: show context menu */
  const handleNodeContextMenu = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const svgRect = svgRef.current?.getBoundingClientRect();
    setCtxMenu({ nodeId, x: e.clientX - (svgRect?.left || 0), y: e.clientY - (svgRect?.top || 0) });
  }, []);

  /** Remove a specific dependency edge */
  const handleRemoveDep = useCallback((taskId: string, depId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newDeps = (task.dependencies || []).filter(d => d !== depId);
    taskStoreActions.updateTask(taskId, { dependencies: newDeps });
    setCtxMenu(null);
  }, [tasks]);

  /** Add dependency: make the ctx node depend on a prompted task */
  const handleAddDep = useCallback((nodeId: string) => {
    const available = graph.nodes.filter(n => n.id !== nodeId && !(tasks.find(t => t.id === nodeId)?.dependencies || []).includes(n.id));
    if (available.length === 0) return;
    // Use first available for simplicity (in production, show a picker)
    const target = available[0];
    const task = tasks.find(t => t.id === nodeId);
    if (!task) return;
    const newDeps = [...(task.dependencies || []), target.id];
    taskStoreActions.updateTask(nodeId, { dependencies: newDeps });
    setCtxMenu(null);
  }, [tasks, graph.nodes]);

  const allPositions = Array.from(mergedPositions.values());
  const svgW = Math.max(400, (allPositions.length > 0 ? Math.max(...allPositions.map(p => p.x)) + 180 : 400));
  const svgH = Math.max(200, (allPositions.length > 0 ? Math.max(...allPositions.map(p => p.y)) + 60 : 200));

  if (graph.nodes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="border-b border-white/[0.06] bg-[#0a0b10] px-3 py-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Network size={12} className="text-[#667eea]" />
            <span className="text-[10px] text-white/50" style={{ fontWeight: 600 }}>任务依赖图</span>
          </div>
          <button onClick={onClose} className="p-0.5 text-white/15 hover:text-white/40"><X size={11} /></button>
        </div>
        <div className="text-center py-4 text-[9px] text-white/15">
          暂无依赖关系。在任务详情中可添加依赖。
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-white/[0.06] bg-[#0a0b10]"
    >
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Network size={12} className="text-[#667eea]" />
            <span className="text-[10px] text-white/50" style={{ fontWeight: 600 }}>任务依赖图</span>
            <span className="text-[8px] text-white/15">{graph.nodes.length} 节点 · {graph.edges.length} 边</span>
          </div>
          <div className="flex items-center gap-1">
            {dragOverrides.size > 0 && (
              <button
                onClick={handleResetLayout}
                className="text-[8px] px-1.5 py-0.5 rounded text-white/20 hover:text-white/40 hover:bg-white/[0.04] transition-colors"
                title="重置布局"
              >
                重置
              </button>
            )}
            <span className="text-[7px] text-white/10 flex items-center gap-0.5"><Move size={7} /> 可拖拽节点</span>
            <button onClick={onClose} className="p-0.5 text-white/15 hover:text-white/40"><X size={11} /></button>
          </div>
        </div>

        <div className="overflow-auto rounded-lg border border-white/[0.04] bg-white/[0.01] relative" style={{ maxHeight: 240, scrollbarWidth: 'thin' }}>
          <svg ref={svgRef} width={svgW} height={svgH} className="block">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(102,126,234,0.4)" />
              </marker>
            </defs>

            {/* Edges */}
            {graph.edges.map((e, i) => {
              const from = mergedPositions.get(e.from);
              const to = mergedPositions.get(e.to);
              if (!from || !to) return null;
              const highlighted = hoveredId === e.from || hoveredId === e.to;
              return (
                <line
                  key={`edge-${i}`}
                  x1={from.x + 120}
                  y1={from.y + 16}
                  x2={to.x}
                  y2={to.y + 16}
                  stroke={highlighted ? 'rgba(102,126,234,0.6)' : 'rgba(255,255,255,0.06)'}
                  strokeWidth={highlighted ? 2 : 1}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}

            {/* Nodes */}
            {graph.nodes.map(node => {
              const pos = mergedPositions.get(node.id);
              if (!pos) return null;
              const cfg = STATUS_CFG[node.status];
              const priCfg = PRIORITY_CFG[node.priority];
              const isHovered = hoveredId === node.id;
              const isDragging = draggingId === node.id;
              return (
                <g
                  key={node.id}
                  onMouseEnter={() => !draggingId && setHoveredId(node.id)}
                  onMouseLeave={() => !draggingId && setHoveredId(null)}
                  onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  onContextMenu={(e) => handleNodeContextMenu(node.id, e)}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={120}
                    height={32}
                    rx={6}
                    fill={isHovered ? 'rgba(102,126,234,0.08)' : 'rgba(255,255,255,0.02)'}
                    stroke={isHovered ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.06)'}
                    strokeWidth={1}
                  />
                  {/* Status dot */}
                  <circle
                    cx={pos.x + 10}
                    cy={pos.y + 16}
                    r={3}
                    fill={
                      node.status === 'done' ? '#34d399'
                        : node.status === 'in-progress' ? '#fbbf24'
                        : node.status === 'blocked' ? '#f87171'
                        : node.status === 'review' ? '#a78bfa'
                        : 'rgba(255,255,255,0.2)'
                    }
                  />
                  {/* Title */}
                  <text
                    x={pos.x + 20}
                    y={pos.y + 14}
                    fontSize={9}
                    fill="rgba(255,255,255,0.5)"
                    style={{ fontWeight: 500 }}
                  >
                    {node.title.length > 14 ? node.title.slice(0, 14) + '…' : node.title}
                  </text>
                  {/* Priority label */}
                  <text
                    x={pos.x + 20}
                    y={pos.y + 26}
                    fontSize={7}
                    fill="rgba(255,255,255,0.2)"
                  >
                    {priCfg.label} · {cfg.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Right-click context menu */}
          {ctxMenu && (() => {
            const node = tasks.find(t => t.id === ctxMenu.nodeId);
            if (!node) return null;
            const deps = node.dependencies || [];
            const depTasks = deps.map(d => tasks.find(t => t.id === d)).filter(Boolean) as Task[];
            const blocking = tasks.filter(t => (t.dependencies || []).includes(node.id));
            return (
              <div
                ref={ctxMenuRef}
                className="absolute z-50 bg-[#1a1b26] border border-white/[0.1] rounded-lg shadow-2xl py-1 min-w-[160px]"
                style={{ left: ctxMenu.x, top: ctxMenu.y }}
              >
                <div className="px-2 py-1 text-[9px] text-white/30 border-b border-white/[0.06]">
                  {node.title.length > 20 ? node.title.slice(0, 20) + '…' : node.title}
                </div>
                {/* Show current deps */}
                {depTasks.length > 0 && (
                  <div className="px-2 py-1">
                    <span className="text-[7px] text-white/20">依赖 ({depTasks.length}):</span>
                    {depTasks.map(dep => (
                      <div key={dep.id} className="flex items-center justify-between py-0.5">
                        <span className="text-[8px] text-white/40 truncate flex-1">{dep.title}</span>
                        <button
                          onClick={() => handleRemoveDep(node.id, dep.id)}
                          className="text-[7px] text-red-400/60 hover:text-red-400 ml-1 px-1"
                        >
                          移除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Show who depends on this */}
                {blocking.length > 0 && (
                  <div className="px-2 py-1 border-t border-white/[0.04]">
                    <span className="text-[7px] text-white/20">被依赖 ({blocking.length}):</span>
                    {blocking.map(b => (
                      <div key={b.id} className="flex items-center justify-between py-0.5">
                        <span className="text-[8px] text-white/40 truncate flex-1">{b.title}</span>
                        <button
                          onClick={() => handleRemoveDep(b.id, node.id)}
                          className="text-[7px] text-red-400/60 hover:text-red-400 ml-1 px-1"
                        >
                          移除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Actions */}
                <div className="border-t border-white/[0.06] mt-0.5">
                  <button
                    onClick={() => handleAddDep(node.id)}
                    className="w-full text-left px-2 py-1 text-[8px] text-white/40 hover:bg-white/[0.04] hover:text-white/60 transition-colors"
                  >
                    + 添加依赖
                  </button>
                  <button
                    onClick={() => setCtxMenu(null)}
                    className="w-full text-left px-2 py-1 text-[8px] text-white/20 hover:bg-white/[0.04] hover:text-white/40 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}

/* ================================================================
   DatePickerPopover
   ================================================================ */

function DatePickerPopover({
  value,
  onChange,
  onClose,
}: {
  value?: number;
  onChange: (date: number | undefined) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selected = value ? new Date(value) : undefined;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-[100] bg-[#1a1b26] border border-white/[0.1] rounded-lg shadow-2xl p-2"
      style={{ minWidth: 260 }}
    >
      <style>{`
        .yyc3-picker .rdp-months { display: flex; }
        .yyc3-picker .rdp-month { width: 100%; }
        .yyc3-picker .rdp-caption { display: flex; justify-content: center; padding: 4px 0; position: relative; }
        .yyc3-picker .rdp-caption_label { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 500; }
        .yyc3-picker .rdp-nav { display: flex; gap: 2px; position: absolute; right: 0; top: 2px; }
        .yyc3-picker .rdp-nav_button { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: rgba(255,255,255,0.3); cursor: pointer; }
        .yyc3-picker .rdp-nav_button:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); }
        .yyc3-picker .rdp-nav_button svg { width: 14px; height: 14px; }
        .yyc3-picker .rdp-table { width: 100%; border-collapse: collapse; }
        .yyc3-picker .rdp-head_cell { font-size: 9px; color: rgba(255,255,255,0.2); text-align: center; padding: 2px; font-weight: 400; }
        .yyc3-picker .rdp-cell { text-align: center; padding: 1px; }
        .yyc3-picker .rdp-button { width: 28px; height: 28px; border-radius: 6px; font-size: 10px; color: rgba(255,255,255,0.5); cursor: pointer; border: none; background: transparent; transition: all 0.15s; }
        .yyc3-picker .rdp-button:hover { background: rgba(102,126,234,0.15); color: #667eea; }
        .yyc3-picker .rdp-day_selected { background: rgba(102,126,234,0.25) !important; color: #667eea !important; font-weight: 600; }
        .yyc3-picker .rdp-day_today { border: 1px solid rgba(102,126,234,0.3); }
        .yyc3-picker .rdp-day_outside { color: rgba(255,255,255,0.1); }
      `}</style>
      <div className="yyc3-picker">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={(day) => {
            onChange(day ? day.getTime() : undefined);
            onClose();
          }}
          locale={zhCN}
          showOutsideDays
        />
      </div>
      {value && (
        <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/[0.06]">
          <span className="text-[9px] text-white/30">{format(new Date(value), 'yyyy-MM-dd')}</span>
          <button
            onClick={() => { onChange(undefined); onClose(); }}
            className="text-[9px] text-red-400/60 hover:text-red-400 transition-colors"
          >
            清除日期
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   DraggableTaskItem
   ================================================================ */

function DraggableTaskItem({
  task,
  onOpenDetail,
}: {
  task: Task;
  compact?: boolean;
  onOpenDetail: (task: Task) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showDetail, setShowDetail] = useState(false);
  const [newSub, setNewSub] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const priority = PRIORITY_CFG[task.priority];
  const status = STATUS_CFG[task.status];

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    type: DND_TASK_TYPE,
    item: (): DragItem => ({ id: task.id, status: task.status }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const nextStatus = (): TaskStatus => {
    const order: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];
    const idx = order.indexOf(task.status);
    return order[(idx + 1) % order.length] || 'todo';
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      taskStoreActions.updateTask(task.id, { title: editTitle.trim() });
    }
    setEditing(false);
  };

  const handleAddSub = () => {
    if (!newSub.trim()) return;
    taskStoreActions.addSubtask(task.id, newSub.trim());
    setNewSub('');
  };

  const completedSubs = task.subtasks?.filter(s => s.isCompleted).length ?? 0;
  const totalSubs = task.subtasks?.length ?? 0;
  const hasDeps = (task.dependencies?.length || 0) > 0;

  return (
    <div ref={previewRef as any} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        className={`group relative rounded-lg border border-white/[0.06] p-2.5 mb-1.5 transition-colors hover:border-white/[0.12] ${
          task.status === 'done' ? 'opacity-50' : ''
        } ${task.status === 'blocked' ? 'border-red-500/20' : ''}`}
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-start gap-1.5">
          {/* Drag handle */}
          <div
            ref={dragRef as any}
            className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-white/10 hover:text-white/25 transition-colors"
            title="拖拽移动"
          >
            <GripVertical size={12} />
          </div>

          {/* Status toggle */}
          <button
            onClick={() => taskStoreActions.updateTask(task.id, {
              status: nextStatus(),
              completedAt: nextStatus() === 'done' ? Date.now() : undefined,
            })}
            className={`mt-0.5 shrink-0 transition-colors ${status.color} hover:opacity-80`}
            title={`切换到: ${STATUS_CFG[nextStatus()].label}`}
          >
            <status.icon size={14} />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') { setEditTitle(task.title); setEditing(false); }
                }}
                className="w-full bg-white/[0.06] border border-[#667eea]/30 rounded px-2 py-0.5 text-[11px] text-white/80 outline-none"
              />
            ) : (
              <div
                onClick={() => setEditing(true)}
                onDoubleClick={(e) => { e.stopPropagation(); onOpenDetail(task); }}
                className={`text-[11px] cursor-text ${
                  task.status === 'done' ? 'line-through text-white/30' : 'text-white/70'
                }`}
                style={{ lineHeight: '1.4' }}
                title="单击编辑标题 · 双击打开详情"
              >
                {task.title}
              </div>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <button
                onClick={() => {
                  const list: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
                  const idx = list.indexOf(task.priority);
                  taskStoreActions.updateTask(task.id, { priority: list[(idx + 1) % 4] });
                }}
                className={`flex items-center gap-0.5 text-[8px] ${priority.color} hover:opacity-80 transition-opacity`}
                title={`优先级: ${priority.label}`}
              >
                <priority.icon size={9} />
                {priority.label}
              </button>

              <span className={`text-[8px] px-1 py-0 rounded ${TYPE_CFG[task.type].color}`}>
                {TYPE_CFG[task.type].label}
              </span>

              {task.tags.map(tag => (
                <span key={tag} className="text-[8px] px-1 py-0 rounded bg-[#667eea]/10 text-[#667eea]/60">
                  {tag}
                </span>
              ))}

              {task.source === 'ai-inferred' && (
                <span className="text-[8px] px-1 py-0 rounded bg-amber-500/10 text-amber-400/60 flex items-center gap-0.5">
                  <Sparkles size={7} /> AI
                </span>
              )}

              {hasDeps && (
                <span className="text-[8px] px-1 py-0 rounded bg-[#667eea]/10 text-[#667eea]/40 flex items-center gap-0.5">
                  <Link size={7} /> {task.dependencies!.length}
                </span>
              )}

              {task.description && (
                <span className="text-[8px] text-white/15 flex items-center gap-0.5" title="有描述">
                  <FileText size={7} />
                </span>
              )}

              {task.dueDate && (
                <span className={`text-[8px] flex items-center gap-0.5 ${
                  task.dueDate < Date.now() ? 'text-red-400' : 'text-white/25'
                }`}>
                  <CalendarDays size={8} />
                  {format(new Date(task.dueDate), 'M/d')}
                </span>
              )}

              {totalSubs > 0 && (
                <span className="text-[8px] text-white/20 flex items-center gap-0.5">
                  <Check size={7} /> {completedSubs}/{totalSubs}
                </span>
              )}

              <span className="text-[8px] text-white/15">
                {format(new Date(task.createdAt), 'M/d')}
              </span>
            </div>

            {/* Subtasks (expandable) */}
            {totalSubs > 0 && showDetail && (
              <div className="mt-1.5 pl-0.5 space-y-0.5">
                {task.subtasks!.map(sub => (
                  <div key={sub.id} className="flex items-center gap-1.5 group/sub">
                    <button
                      onClick={() => taskStoreActions.toggleSubtask(task.id, sub.id)}
                      className={sub.isCompleted ? 'text-emerald-400/60' : 'text-white/20'}
                    >
                      {sub.isCompleted ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                    </button>
                    <span className={`text-[10px] ${sub.isCompleted ? 'line-through text-white/20' : 'text-white/50'}`}>
                      {sub.title}
                    </span>
                    <button
                      onClick={() => taskStoreActions.deleteSubtask(task.id, sub.id)}
                      className="p-0.5 opacity-0 group-hover/sub:opacity-100 text-white/10 hover:text-red-400 transition-all"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-1 mt-1">
                  <input
                    value={newSub}
                    onChange={e => setNewSub(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddSub(); }}
                    placeholder="添加子任务..."
                    className="flex-1 bg-transparent border-b border-white/[0.06] text-[9px] text-white/40 placeholder:text-white/10 outline-none py-0.5"
                  />
                  {newSub.trim() && (
                    <button onClick={handleAddSub} className="text-[#667eea]"><Plus size={10} /></button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative">
            {totalSubs > 0 && (
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="p-0.5 rounded hover:bg-white/[0.06] text-white/15 hover:text-white/40 transition-colors"
                title={showDetail ? '收起子任务' : '展开子任务'}
              >
                {showDetail ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
            <button
              onClick={() => onOpenDetail(task)}
              className="p-0.5 rounded hover:bg-white/[0.06] text-white/15 hover:text-[#667eea] transition-colors"
              title="打开详情"
            >
              <FileText size={11} />
            </button>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`p-0.5 rounded hover:bg-white/[0.06] transition-colors ${
                task.dueDate ? 'text-[#667eea]/60' : 'text-white/15 hover:text-white/40'
              }`}
              title="设置截止日期"
            >
              <CalendarDays size={11} />
            </button>
            <button
              onClick={() => taskStoreActions.duplicateTask(task.id)}
              className="p-0.5 rounded hover:bg-white/[0.06] text-white/15 hover:text-white/40 transition-colors"
              title="复制任务"
            >
              <Copy size={11} />
            </button>
            <button
              onClick={() => taskStoreActions.archiveTask(task.id)}
              className="p-0.5 rounded hover:bg-white/[0.06] text-white/15 hover:text-amber-400 transition-colors"
              title="归档"
            >
              <Archive size={11} />
            </button>
            <button
              onClick={() => taskStoreActions.deleteTask(task.id)}
              className="p-0.5 rounded hover:bg-red-500/10 text-white/15 hover:text-red-400 transition-colors"
              title="删除"
            >
              <Trash2 size={11} />
            </button>

            {showDatePicker && (
              <DatePickerPopover
                value={task.dueDate}
                onChange={(d) => {
                  taskStoreActions.updateTask(task.id, { dueDate: d });
                  if (d) reminderService.createDeadlineReminder(task.id, d);
                }}
                onClose={() => setShowDatePicker(false)}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   DroppableColumn
   ================================================================ */

function DroppableColumn({
  status,
  tasks,
  collapsed,
  onToggle,
  onOpenDetail,
}: {
  status: TaskStatus;
  tasks: Task[];
  collapsed: boolean;
  onToggle: () => void;
  onOpenDetail: (task: Task) => void;
}) {
  const cfg = STATUS_CFG[status];

  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: DND_TASK_TYPE,
    canDrop: (item: DragItem) => item.status !== status,
    drop: (item: DragItem) => {
      taskStoreActions.updateTask(item.id, {
        status,
        completedAt: status === 'done' ? Date.now() : undefined,
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={dropRef as any}
      className={`flex-1 min-w-[120px] flex flex-col rounded-lg border transition-colors ${
        isOver && canDrop
          ? 'bg-[#667eea]/[0.06] border-[#667eea]/30'
          : 'bg-white/[0.02] border-white/[0.04]'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2 py-1.5 text-left shrink-0 hover:bg-white/[0.02] transition-colors"
      >
        {collapsed
          ? <ChevronRight size={10} className="text-white/20" />
          : <ChevronDown size={10} className="text-white/20" />
        }
        <cfg.icon size={11} className={cfg.color} />
        <span className="text-[10px] text-white/50 truncate" style={{ fontWeight: 500 }}>{cfg.label}</span>
        <span className="text-[9px] text-white/20 ml-auto shrink-0">{tasks.length}</span>
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-1.5 pb-1.5" style={{ scrollbarWidth: 'thin' }}>
          {tasks.length === 0 ? (
            <div className={`text-center py-4 text-[9px] rounded-md transition-colors ${
              isOver && canDrop ? 'text-[#667eea]/40 bg-[#667eea]/[0.04]' : 'text-white/10'
            }`}>
              {isOver && canDrop ? '放置到此列' : '空'}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {tasks.map(task => (
                <DraggableTaskItem key={task.id} task={task} compact onOpenDetail={onOpenDetail} />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   AddTaskForm
   ================================================================ */

function AddTaskForm() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskType>('other');
  const [dueDate, setDueDate] = useState<number | undefined>();
  const [expanded, setExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) return;
    const id = taskStoreActions.addTask({
      title: title.trim(),
      status: 'todo',
      priority,
      type,
      tags: [],
      dueDate,
      source: 'manual',
    });
    if (dueDate && id) reminderService.createDeadlineReminder(id, dueDate);
    setTitle('');
    setPriority('medium');
    setType('other');
    setDueDate(undefined);
  };

  return (
    <div className="px-3 py-2 border-b border-white/[0.04] shrink-0">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="添加新任务..."
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-white/60 placeholder:text-white/15 focus:outline-none focus:border-[#667eea]/30 transition-colors"
        />
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-1 rounded transition-colors ${expanded ? 'text-[#667eea] bg-[#667eea]/10' : 'text-white/20 hover:text-white/40'}`}
          title="展开选项"
        >
          <MoreHorizontal size={14} />
        </button>
        <button
          onClick={handleAdd}
          disabled={!title.trim()}
          className={`p-1.5 rounded-lg shrink-0 transition-colors ${
            title.trim()
              ? 'bg-[#667eea]/15 border border-[#667eea]/20 text-[#667eea] hover:bg-[#667eea]/25'
              : 'bg-white/[0.03] border border-white/[0.06] text-white/15 cursor-not-allowed'
          }`}
        >
          <Plus size={14} />
        </button>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 mt-2 flex-wrap relative"
        >
          <div className="flex items-center gap-1">
            <span className="text-[8px] text-white/20">优先级:</span>
            {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`text-[8px] px-1.5 py-0.5 rounded transition-colors ${
                  priority === p
                    ? `${PRIORITY_CFG[p].color} bg-white/[0.06]`
                    : 'text-white/15 hover:text-white/30'
                }`}
              >
                {PRIORITY_CFG[p].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8px] text-white/20">类型:</span>
            <select
              value={type}
              onChange={e => setType(e.target.value as TaskType)}
              className="bg-white/[0.04] border border-white/[0.08] rounded text-[9px] text-white/40 px-1 py-0.5 outline-none"
            >
              {Object.entries(TYPE_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded transition-colors ${
                dueDate ? 'text-[#667eea] bg-[#667eea]/10' : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]'
              }`}
            >
              <CalendarDays size={9} />
              {dueDate ? format(new Date(dueDate), 'M/d') : '截止日期'}
            </button>
            {showDatePicker && (
              <DatePickerPopover value={dueDate} onChange={setDueDate} onClose={() => setShowDatePicker(false)} />
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ================================================================
   AI Extract Panel
   ================================================================ */

function AIExtractPanel({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'conversation' | 'code'>('conversation');
  const [results, setResults] = useState<Array<{ title: string; type: string; priority: string; confidence: number }>>([]);
  const [extracted, setExtracted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExtract = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    setExtracted(false);
    try {
      const inferences = mode === 'code'
        ? await taskInferenceEngine.inferTasksFromCodeAsync(text, 'typescript')
        : await taskInferenceEngine.inferTasksFromDescriptionAsync(text);
      setResults(inferences.map(inf => ({
        title: inf.task.title,
        type: inf.task.type || 'other',
        priority: inf.task.priority || 'medium',
        confidence: inf.confidence,
      })));
    } catch {
      const inferences = mode === 'code'
        ? taskInferenceEngine.inferTasksFromCode(text, 'typescript')
        : taskInferenceEngine.inferTasksFromDescription(text);
      setResults(inferences.map(inf => ({
        title: inf.task.title,
        type: inf.task.type || 'other',
        priority: inf.task.priority || 'medium',
        confidence: inf.confidence,
      })));
    } finally {
      setExtracted(true);
      setLoading(false);
    }
  }, [text, mode]);

  const handleImport = () => {
    if (results.length === 0) return;
    taskStoreActions.importAITasks(results.map(r => r.title));
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-white/[0.06] bg-[#0a0b10]"
    >
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-amber-400" />
            <span className="text-[10px] text-white/50" style={{ fontWeight: 600 }}>AI 任务提取</span>
            {loading && <Loader size={10} className="animate-spin text-amber-400/60" />}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode('conversation')}
              className={`text-[8px] px-1.5 py-0.5 rounded ${mode === 'conversation' ? 'bg-[#667eea]/15 text-[#667eea]' : 'text-white/20'}`}
            >
              对话
            </button>
            <button
              onClick={() => setMode('code')}
              className={`text-[8px] px-1.5 py-0.5 rounded ${mode === 'code' ? 'bg-[#667eea]/15 text-[#667eea]' : 'text-white/20'}`}
            >
              代码
            </button>
            <button onClick={onClose} className="p-0.5 text-white/15 hover:text-white/40"><X size={11} /></button>
          </div>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={mode === 'code' ? '粘贴代码，自动提取 TODO/FIXME 等...' : '粘贴对话或描述，AI 自动提取任务...'}
          rows={4}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2 text-[10px] text-white/50 placeholder:text-white/15 focus:outline-none focus:border-[#667eea]/30 resize-none"
          style={{ fontFamily: mode === 'code' ? 'JetBrains Mono, monospace' : 'inherit', scrollbarWidth: 'thin' }}
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleExtract}
            disabled={!text.trim() || loading}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] transition-colors ${
              text.trim() && !loading
                ? 'bg-amber-500/15 border border-amber-500/20 text-amber-400 hover:bg-amber-500/25'
                : 'bg-white/[0.03] border border-white/[0.06] text-white/15 cursor-not-allowed'
            }`}
            style={{ fontWeight: 500 }}
          >
            {loading ? <Loader size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {loading ? '提取中...' : '提取任务'}
          </button>
          {extracted && results.length > 0 && (
            <button
              onClick={handleImport}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Plus size={11} /> 导入 {results.length} 项
            </button>
          )}
          {extracted && results.length === 0 && !loading && (
            <span className="text-[9px] text-white/20">未发现可提取的任务</span>
          )}
        </div>
        {results.length > 0 && (
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02] border border-white/[0.04]">
                <span className={`text-[8px] px-1 rounded ${TYPE_CFG[r.type as TaskType]?.color || 'text-white/20'}`}>
                  {TYPE_CFG[r.type as TaskType]?.label || r.type}
                </span>
                <span className="text-[10px] text-white/50 flex-1 truncate">{r.title}</span>
                <span className={`text-[8px] px-1 rounded ${PRIORITY_CFG[r.priority as TaskPriority]?.color || 'text-white/15'}`}>
                  {PRIORITY_CFG[r.priority as TaskPriority]?.label || r.priority}
                </span>
                <span className="text-[8px] text-white/15">{Math.round(r.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ================================================================
   Reminder Toast
   ================================================================ */

function ReminderToast() {
  const [toasts, setToasts] = useState<TaskReminderEventDetail[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TaskReminderEventDetail>).detail;
      setToasts(prev => [...prev, detail]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.reminderId !== detail.reminderId));
      }, 6000);
    };
    window.addEventListener(TASK_REMINDER_EVENT, handler);
    return () => window.removeEventListener(TASK_REMINDER_EVENT, handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="absolute top-12 right-2 z-50 space-y-1 w-56">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.reminderId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-[#1a1b26] border border-amber-500/20 rounded-lg p-2 shadow-xl"
          >
            <div className="flex items-center gap-1.5">
              <Bell size={11} className="text-amber-400 shrink-0" />
              <span className="text-[10px] text-amber-400" style={{ fontWeight: 600 }}>{t.taskTitle}</span>
            </div>
            <p className="text-[9px] text-white/40 mt-0.5 pl-4">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   Main TaskBoard Component
   ================================================================ */

export function TaskBoard() {
  const { tasks, reminders } = useTaskStore();
  const [filter, setFilter] = useState<TaskFilter>({ status: 'all' });
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'gantt'>('kanban');
  const [collapsedCols, setCollapsedCols] = useState<Set<TaskStatus>>(new Set());
  const [showAIExtract, setShowAIExtract] = useState(false);
  const [showDAG, setShowDAG] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Collaboration
  const { status: collabStatus, remoteUsers, localUser } = useTaskCollab();
  const [showCollabPanel, setShowCollabPanel] = useState(false);

  const activeTasks = useMemo(() => tasks.filter(t => !t.isArchived), [tasks]);

  useEffect(() => {
    reminderService.start();
    ReminderService.requestPermission();
    return () => reminderService.stop();
  }, []);

  // Initialize collab service (offline-only by default, ws URL configurable)
  useEffect(() => {
    const wsUrl = (() => {
      try { return localStorage.getItem('yyc3-collab-ws-url') || undefined; } catch { return undefined; }
    })();
    taskCollabService.init(wsUrl, 'yyc3-task-board').catch(() => {});
    return () => { taskCollabService.dispose(); };
  }, []);

  // Collab conflict / remote event toast notifications
  useEffect(() => {
    const unsub = taskCollabService.on((event) => {
      if (event.type === 'task-updated-remote') {
        const { taskId, action } = event.data || {};
        const task = tasks.find(t => t.id === taskId);
        const taskName = task?.title || taskId;
        if (action === 'delete') {
          toast.info(`协同: 远端删除了任务「${taskName}」`);
        } else {
          toast.info(`协同: 远端更新了任务「${taskName}」`);
        }
      }
      if (event.type === 'user-joined') {
        const users = event.data;
        if (Array.isArray(users) && users.length > 0) {
          toast(`${users[users.length - 1]?.name || '用户'} 加入了协同编辑`);
        }
      }
      if (event.type === 'user-left') {
        const users = event.data;
        if (Array.isArray(users) && users.length > 0) {
          toast(`${users[users.length - 1]?.name || '用户'} 离开了协同编辑`);
        }
      }
      if (event.type === 'connected') {
        toast.success('协同连接已建立');
      }
      if (event.type === 'disconnected') {
        toast.warning('协同连接已断开，切换至离线模式');
      }
    });
    return unsub;
  }, [tasks]);

  // Keep detailTask in sync with store
  useEffect(() => {
    if (detailTask) {
      const fresh = tasks.find(t => t.id === detailTask.id);
      if (fresh && fresh !== detailTask) setDetailTask(fresh);
    }
  }, [tasks, detailTask]);

  const filteredTasks = useMemo(() => {
    let result = activeTasks;
    if (filter.status && filter.status !== 'all') {
      result = result.filter(t => t.status === filter.status);
    }
    if (filter.priority && filter.priority !== 'all') {
      result = result.filter(t => t.priority === filter.priority);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeTasks, filter, searchQuery]);

  const stats = useMemo(() => {
    const s = { total: activeTasks.length, todo: 0, inProgress: 0, review: 0, done: 0, blocked: 0 };
    for (const t of activeTasks) {
      if (t.status === 'todo') s.todo++;
      else if (t.status === 'in-progress') s.inProgress++;
      else if (t.status === 'review') s.review++;
      else if (t.status === 'done') s.done++;
      else if (t.status === 'blocked') s.blocked++;
    }
    return s;
  }, [activeTasks]);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { 'todo': [], 'in-progress': [], 'review': [], 'done': [], 'blocked': [] };
    for (const t of filteredTasks) g[t.status].push(t);
    for (const col of STATUS_COLUMNS) {
      g[col].sort((a, b) => (PRIORITY_CFG[a.priority].order) - (PRIORITY_CFG[b.priority].order));
    }
    return g;
  }, [filteredTasks]);

  const toggleColumn = (col: TaskStatus) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      return next;
    });
  };

  const unreadReminders = reminders.filter(r => !r.isRead).length;
  const depCount = useMemo(() => tasks.filter(t => !t.isArchived && (t.dependencies?.length || 0) > 0).length, [tasks]);

  const handleOpenDetail = useCallback((task: Task) => {
    setDetailTask(task);
  }, []);

  return (
    <SmartDndProvider>
      <div className="flex flex-col h-full bg-[#0d0e14] relative">
        <ReminderToast />

        {/* Detail Modal */}
        <AnimatePresence>
          {detailTask && (
            <TaskDescriptionModal
              key={detailTask.id}
              task={detailTask}
              onClose={() => setDetailTask(null)}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <ListTodo size={13} className="text-[#667eea]" />
            <span className="text-[11px] text-white/50" style={{ fontWeight: 600 }}>任务看板</span>
            <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">{stats.total}</span>
            {unreadReminders > 0 && (
              <span className="text-[8px] text-amber-400 bg-amber-500/15 px-1 py-0.5 rounded-full flex items-center gap-0.5">
                <Bell size={8} /> {unreadReminders}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1 rounded transition-colors ${showSearch ? 'bg-[#667eea]/10 text-[#667eea]' : 'text-white/20 hover:text-white/40'}`}
              title="搜索"
            >
              <Search size={12} />
            </button>
            <button
              onClick={() => setShowAIExtract(!showAIExtract)}
              className={`p-1 rounded transition-colors ${showAIExtract ? 'bg-amber-500/10 text-amber-400' : 'text-white/20 hover:text-amber-400/60'}`}
              title="AI 提取任务"
            >
              <Sparkles size={12} />
            </button>
            <button
              onClick={() => setShowDAG(!showDAG)}
              className={`p-1 rounded transition-colors ${showDAG ? 'bg-[#667eea]/10 text-[#667eea]' : 'text-white/20 hover:text-white/40'}`}
              title={`依赖图 (${depCount})`}
            >
              <Network size={12} />
            </button>
            <button
              onClick={() => setViewMode(v => v === 'kanban' ? 'list' : v === 'list' ? 'gantt' : 'kanban')}
              className="px-1.5 py-0.5 rounded text-[9px] text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-colors"
              title="切换视图: 看板 → 列表 → 甘特图"
            >
              {viewMode === 'kanban' ? '列表' : viewMode === 'list' ? '甘特图' : '看板'}
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`p-1 rounded transition-colors ${viewMode === 'gantt' ? 'bg-[#667eea]/10 text-[#667eea]' : 'text-white/20 hover:text-white/40'}`}
              title="甘特图视图"
            >
              <GanttChart size={12} />
            </button>
            <button
              onClick={() => setShowCollabPanel(!showCollabPanel)}
              className={`p-1 rounded transition-colors relative ${showCollabPanel ? 'bg-[#667eea]/10 text-[#667eea]' : 'text-white/20 hover:text-white/40'}`}
              title={`协同: ${collabStatus === 'synced' ? '已连接' : collabStatus === 'offline-only' ? '离线模式' : collabStatus}`}
            >
              {collabStatus === 'synced' ? <Wifi size={12} /> : <WifiOff size={12} />}
              {remoteUsers.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[6px] bg-emerald-500 text-white rounded-full w-3 h-3 flex items-center justify-center">
                  {remoteUsers.length}
                </span>
              )}
            </button>
            {stats.done > 0 && (
              <button
                onClick={() => taskStoreActions.clearCompleted()}
                className="px-1.5 py-0.5 rounded text-[9px] text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                清除 {stats.done}
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-white/[0.04] px-3 py-1.5"
            >
              <div className="flex items-center gap-2">
                <Search size={11} className="text-white/20 shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索任务标题、描述、标签..."
                  className="flex-1 bg-transparent text-[10px] text-white/50 placeholder:text-white/15 outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-white/15 hover:text-white/30">
                    <X size={10} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.04] shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {(['all', ...STATUS_COLUMNS] as const).map(s => {
            const count = s === 'all' ? stats.total
              : s === 'todo' ? stats.todo
              : s === 'in-progress' ? stats.inProgress
              : s === 'review' ? stats.review
              : s === 'done' ? stats.done
              : stats.blocked;
            const label = s === 'all' ? '全部' : STATUS_CFG[s].label;
            return (
              <button
                key={s}
                onClick={() => setFilter(prev => ({ ...prev, status: s }))}
                className={`text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
                  (filter.status || 'all') === s
                    ? 'bg-[#667eea]/15 text-[#667eea]'
                    : 'text-white/25 hover:text-white/40 hover:bg-white/[0.04]'
                }`}
                style={{ fontWeight: (filter.status || 'all') === s ? 500 : 400 }}
              >
                {label} ({count})
              </button>
            );
          })}
          <div className="w-px h-3 bg-white/[0.06] shrink-0" />
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilter(prev => ({ ...prev, priority: p }))}
              className={`text-[8px] px-1 py-0.5 rounded whitespace-nowrap transition-colors ${
                (filter.priority || 'all') === p
                  ? p === 'all' ? 'text-[#667eea] bg-[#667eea]/10' : `${PRIORITY_CFG[p as TaskPriority]?.color} bg-white/[0.06]`
                  : 'text-white/15 hover:text-white/25'
              }`}
            >
              {p === 'all' ? 'P:全部' : PRIORITY_CFG[p as TaskPriority].label}
            </button>
          ))}
        </div>

        {/* AI Extract */}
        <AnimatePresence>
          {showAIExtract && <AIExtractPanel onClose={() => setShowAIExtract(false)} />}
        </AnimatePresence>

        {/* DAG */}
        <AnimatePresence>
          {showDAG && <DependencyDAG onClose={() => setShowDAG(false)} />}
        </AnimatePresence>

        {/* Collab panel */}
        <AnimatePresence>
          {showCollabPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-white/[0.06] bg-[#0a0b10] px-3 py-2"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-[#667eea]" />
                  <span className="text-[10px] text-white/50" style={{ fontWeight: 600 }}>协同编辑</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                    collabStatus === 'synced' ? 'bg-emerald-500/15 text-emerald-400'
                    : collabStatus === 'connecting' ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-white/[0.04] text-white/20'
                  }`}>
                    {collabStatus === 'synced' ? '已同步' : collabStatus === 'connecting' ? '连接中...' : collabStatus === 'offline-only' ? '离线模式' : '未连接'}
                  </span>
                </div>
                <button onClick={() => setShowCollabPanel(false)} className="p-0.5 text-white/15 hover:text-white/40"><X size={11} /></button>
              </div>
              {/* Local user */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ background: localUser.color, fontWeight: 600 }}>
                  {localUser.name[0]}
                </div>
                <span className="text-[10px] text-white/50">{localUser.name}</span>
                <span className="text-[7px] text-white/15">(你)</span>
              </div>
              {/* Remote users */}
              {remoteUsers.length > 0 ? (
                <div className="space-y-1">
                  {remoteUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ background: user.color, fontWeight: 600 }}>
                        {user.name[0]}
                      </div>
                      <span className="text-[10px] text-white/40">{user.name}</span>
                      {user.editingTaskId && (
                        <span className="text-[7px] text-[#667eea]/50">编辑中...</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[9px] text-white/15">暂无其他在线用户</div>
              )}
              {/* WS URL config */}
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[8px] text-white/15 shrink-0">WS:</span>
                <input
                  defaultValue={(() => { try { return localStorage.getItem('yyc3-collab-ws-url') || ''; } catch { return ''; } })()}
                  placeholder="ws://localhost:1234 (可选)"
                  onBlur={(e) => {
                    try { localStorage.setItem('yyc3-collab-ws-url', e.target.value.trim()); } catch {}
                  }}
                  className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded text-[8px] text-white/30 px-1.5 py-0.5 outline-none placeholder:text-white/10"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AddTaskForm />

        {/* Main content */}
        <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
          {viewMode === 'list' ? (
            <div className="px-3 py-2">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-white/15">
                  <ListTodo size={28} className="mb-2" />
                  <span className="text-[11px]">暂无任务</span>
                  <span className="text-[9px] mt-1">输入任务标题并按 Enter 添加</span>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map(task => (
                    <DraggableTaskItem key={task.id} task={task} onOpenDetail={handleOpenDetail} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          ) : viewMode === 'gantt' ? (
            <TaskGanttChart tasks={filteredTasks} onOpenDetail={handleOpenDetail} />
          ) : (
            <div className="flex gap-2 p-2 h-full min-w-0">
              {STATUS_COLUMNS.map(col => (
                <DroppableColumn
                  key={col}
                  status={col}
                  tasks={grouped[col]}
                  collapsed={collapsedCols.has(col)}
                  onToggle={() => toggleColumn(col)}
                  onOpenDetail={handleOpenDetail}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-white/[0.06] shrink-0">
          <span className="text-[8px] text-white/15">
            {stats.done}/{stats.total} 已完成
          </span>
          {stats.total > 0 && (
            <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500/40 rounded-full transition-all"
                style={{ width: `${(stats.done / stats.total) * 100}%` }}
              />
            </div>
          )}
          {stats.blocked > 0 && (
            <span className="text-[8px] text-red-400/60 flex items-center gap-0.5">
              <ShieldAlert size={8} /> {stats.blocked} 阻塞
            </span>
          )}
          {/* Collab presence avatars */}
          {remoteUsers.length > 0 && (
            <div className="flex items-center gap-0.5 ml-auto">
              {remoteUsers.slice(0, 5).map(user => (
                <div
                  key={user.id}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] text-white border border-[#0d0e14]"
                  style={{ background: user.color, fontWeight: 600 }}
                  title={`${user.name}${user.editingTaskId ? ' (编辑中)' : ''}`}
                >
                  {user.name[0]}
                </div>
              ))}
              {remoteUsers.length > 5 && (
                <span className="text-[7px] text-white/20">+{remoteUsers.length - 5}</span>
              )}
            </div>
          )}
          <span className={`text-[7px] flex items-center gap-0.5 ${
            collabStatus === 'synced' ? 'text-emerald-400/40' : 'text-white/10'
          }`}>
            {collabStatus === 'synced' ? <Wifi size={7} /> : <WifiOff size={7} />}
            {collabStatus === 'synced' ? '同步' : '离线'}
          </span>
        </div>
      </div>
    </SmartDndProvider>
  );
}

/* ================================================================
   Legacy compatibility exports
   ================================================================ */

/** @deprecated Use useTaskStore + taskStoreActions instead */
export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem('yyc3-task-board-tasks');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/** @deprecated Use useTaskStore + taskStoreActions instead */
export function saveTasks(tasks: Task[]) {
  try { localStorage.setItem('yyc3-task-board-tasks', JSON.stringify(tasks)); } catch { /* ignore */ }
}
