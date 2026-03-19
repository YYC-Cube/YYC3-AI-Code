/**
 * @file TaskGanttChart.tsx
 * @description 任务甘特图/时间线视图 — 按时间轴展示任务进度条、依赖连线、今日标记线
 *              支持横向滚动、缩放级别切换（日/周）、点击编辑、拖拽调整时间范围
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,task-board,gantt,timeline,visualization
 */

import React, { useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2, Circle, Clock, Eye, Ban, Flame,
  ArrowUpCircle, ArrowDownCircle, MinusCircle,
  ChevronLeft, ChevronRight,
  CalendarDays, type LucideIcon,
} from 'lucide-react';
import {
  format, addDays, differenceInDays, startOfDay, eachDayOfInterval,
  isToday,
} from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import type { Task, TaskStatus, TaskPriority } from '../../types/task';
import { taskStoreActions } from '../../services/task/useTaskStore';

/* ================================================================
   Config — mirrors TaskBoard constants
   ================================================================ */

const STATUS_CFG: Record<TaskStatus, { label: string; icon: LucideIcon; barColor: string }> = {
  'todo':        { label: '待处理', icon: Circle,       barColor: 'rgba(255,255,255,0.12)' },
  'in-progress': { label: '进行中', icon: Clock,        barColor: 'rgba(251,191,36,0.5)' },
  'review':      { label: '审核中', icon: Eye,          barColor: 'rgba(167,139,250,0.5)' },
  'done':        { label: '已完成', icon: CheckCircle2, barColor: 'rgba(52,211,153,0.5)' },
  'blocked':     { label: '已阻塞', icon: Ban,          barColor: 'rgba(248,113,113,0.5)' },
};

const PRIORITY_CFG: Record<TaskPriority, { label: string; icon: LucideIcon; color: string }> = {
  'critical': { label: '紧急', icon: Flame,           color: 'text-red-500' },
  'high':     { label: '高',   icon: ArrowUpCircle,   color: 'text-red-400' },
  'medium':   { label: '中',   icon: MinusCircle,     color: 'text-amber-400' },
  'low':      { label: '低',   icon: ArrowDownCircle, color: 'text-emerald-400' },
};

const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/* ================================================================
   Zoom levels
   ================================================================ */

type ZoomLevel = 'day' | 'week';

const ZOOM_CFG: Record<ZoomLevel, { cellWidth: number; headerFormat: string; subFormat: string }> = {
  day:  { cellWidth: 36, headerFormat: 'M月', subFormat: 'd' },
  week: { cellWidth: 80, headerFormat: 'yyyy年M月', subFormat: "'W'w" },
};

/* ================================================================
   Helper: get task time range
   ================================================================ */

interface TaskTimeInfo {
  task: Task;
  start: Date;
  end: Date;
  hasExplicitDates: boolean;
}

function getTaskTimeInfo(task: Task): TaskTimeInfo {
  const now = new Date();
  const created = new Date(task.createdAt);
  const start = startOfDay(created);

  let end: Date;
  let hasExplicitDates = false;

  if (task.dueDate) {
    end = startOfDay(new Date(task.dueDate));
    hasExplicitDates = true;
  } else if (task.completedAt) {
    end = startOfDay(new Date(task.completedAt));
    hasExplicitDates = true;
  } else if (task.estimatedHours) {
    const days = Math.max(1, Math.ceil(task.estimatedHours / 8));
    end = addDays(start, days);
  } else {
    // Default: 3-day bar
    end = addDays(start, 3);
  }

  // Ensure end is at least 1 day after start
  if (differenceInDays(end, start) < 1) {
    end = addDays(start, 1);
  }

  return { task, start, end, hasExplicitDates };
}

/* ================================================================
   GanttChart Component
   ================================================================ */

export interface TaskGanttChartProps {
  tasks: Task[];
  onOpenDetail?: (task: Task) => void;
}

export function TaskGanttChart({ tasks, onOpenDetail }: TaskGanttChartProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<ZoomLevel>('day');
  const [viewOffset, setViewOffset] = useState(0); // days offset from "today center"
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [resizingTask, setResizingTask] = useState<string | null>(null);

  const zoomCfg = ZOOM_CFG[zoom];

  // Sort tasks by priority then by creation date
  const sortedTasks = useMemo(() => {
    return [...tasks]
      .filter(t => !t.isArchived)
      .sort((a, b) => {
        const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (pDiff !== 0) return pDiff;
        return a.createdAt - b.createdAt;
      });
  }, [tasks]);

  // Compute time info for each task
  const taskTimeInfos = useMemo(() => sortedTasks.map(getTaskTimeInfo), [sortedTasks]);

  // Determine visible date range
  const today = startOfDay(new Date());
  const visibleDays = zoom === 'day' ? 30 : 56;
  const rangeStart = addDays(today, viewOffset - Math.floor(visibleDays / 3));
  const rangeEnd = addDays(rangeStart, visibleDays);

  const allDays = useMemo(() => {
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  }, [rangeStart.getTime(), rangeEnd.getTime()]);

  // Group days by month for header
  const monthGroups = useMemo(() => {
    const groups: Array<{ label: string; days: Date[] }> = [];
    let current: { label: string; days: Date[] } | null = null;
    for (const day of allDays) {
      const label = format(day, zoom === 'day' ? 'M月' : 'yyyy年M月', { locale: zhCN });
      if (!current || current.label !== label) {
        current = { label, days: [] };
        groups.push(current);
      }
      current.days.push(day);
    }
    return groups;
  }, [allDays, zoom]);

  const totalWidth = allDays.length * zoomCfg.cellWidth;
  const rowHeight = 32;
  const headerHeight = 48;
  const labelWidth = 180;

  // Compute bar position for a task
  const getBarRect = useCallback((info: TaskTimeInfo) => {
    const startOffset = differenceInDays(info.start, rangeStart);
    const duration = differenceInDays(info.end, info.start);
    const x = startOffset * zoomCfg.cellWidth;
    const w = Math.max(duration * zoomCfg.cellWidth, zoomCfg.cellWidth * 0.5);
    return { x, w };
  }, [rangeStart, zoomCfg.cellWidth]);

  // Today line position
  const todayX = differenceInDays(today, rangeStart) * zoomCfg.cellWidth;

  // Handle bar end drag to change dueDate
  const handleBarDragEnd = useCallback((taskId: string, deltaX: number) => {
    const daysDelta = Math.round(deltaX / zoomCfg.cellWidth);
    if (daysDelta === 0) return;

    const task = sortedTasks.find(t => t.id === taskId);
    if (!task) return;

    const info = getTaskTimeInfo(task);
    const newEnd = addDays(info.end, daysDelta);
    // Prevent end before start
    if (differenceInDays(newEnd, info.start) < 1) return;
    taskStoreActions.updateTask(taskId, { dueDate: newEnd.getTime() });
    setResizingTask(null);
  }, [zoomCfg.cellWidth, sortedTasks]);

  // Handle bar start drag to change createdAt (start date)
  const handleBarDragStart = useCallback((taskId: string, deltaX: number) => {
    const daysDelta = Math.round(deltaX / zoomCfg.cellWidth);
    if (daysDelta === 0) return;

    const task = sortedTasks.find(t => t.id === taskId);
    if (!task) return;

    const info = getTaskTimeInfo(task);
    const newStart = addDays(info.start, daysDelta);
    // Prevent start after end
    if (differenceInDays(info.end, newStart) < 1) return;
    taskStoreActions.updateTask(taskId, { createdAt: newStart.getTime() });
    setResizingTask(null);
  }, [zoomCfg.cellWidth, sortedTasks]);

  // Navigate
  const handleNavigate = (direction: number) => {
    setViewOffset(prev => prev + direction * (zoom === 'day' ? 7 : 14));
  };

  const handleGoToday = () => setViewOffset(0);

  // Dependencies: draw lines between tasks
  const depLines = useMemo(() => {
    const lines: Array<{ fromX: number; fromY: number; toX: number; toY: number; highlighted: boolean }> = [];
    const taskIndexMap = new Map(sortedTasks.map((t, i) => [t.id, i]));

    for (let i = 0; i < taskTimeInfos.length; i++) {
      const info = taskTimeInfos[i];
      const deps = info.task.dependencies || [];
      for (const depId of deps) {
        const depIdx = taskIndexMap.get(depId);
        if (depIdx === undefined) continue;
        const depInfo = taskTimeInfos[depIdx];

        const fromBar = getBarRect(depInfo);
        const toBar = getBarRect(info);

        lines.push({
          fromX: fromBar.x + fromBar.w,
          fromY: depIdx * rowHeight + rowHeight / 2,
          toX: toBar.x,
          toY: i * rowHeight + rowHeight / 2,
          highlighted: hoveredTaskId === info.task.id || hoveredTaskId === depId,
        });
      }
    }
    return lines;
  }, [taskTimeInfos, sortedTasks, getBarRect, hoveredTaskId, rowHeight]);

  if (sortedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-white/15">
        <CalendarDays size={28} className="mb-2" />
        <span className="text-[11px]">暂无任务数据</span>
        <span className="text-[9px] mt-1">添加任务后可查看甘特图</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.04] shrink-0">
        <button
          onClick={() => handleNavigate(-1)}
          className="p-0.5 rounded text-white/20 hover:text-white/40 hover:bg-white/[0.04] transition-colors"
          title="向前"
        >
          <ChevronLeft size={12} />
        </button>
        <button
          onClick={handleGoToday}
          className="text-[9px] px-2 py-0.5 rounded bg-[#667eea]/10 text-[#667eea] hover:bg-[#667eea]/20 transition-colors"
          style={{ fontWeight: 500 }}
        >
          今日
        </button>
        <button
          onClick={() => handleNavigate(1)}
          className="p-0.5 rounded text-white/20 hover:text-white/40 hover:bg-white/[0.04] transition-colors"
          title="向后"
        >
          <ChevronRight size={12} />
        </button>
        <div className="w-px h-3 bg-white/[0.06]" />
        <button
          onClick={() => setZoom('day')}
          className={`text-[8px] px-1.5 py-0.5 rounded transition-colors ${zoom === 'day' ? 'bg-[#667eea]/15 text-[#667eea]' : 'text-white/20 hover:text-white/40'}`}
        >
          日
        </button>
        <button
          onClick={() => setZoom('week')}
          className={`text-[8px] px-1.5 py-0.5 rounded transition-colors ${zoom === 'week' ? 'bg-[#667eea]/15 text-[#667eea]' : 'text-white/20 hover:text-white/40'}`}
        >
          周
        </button>
        <div className="flex-1" />
        <span className="text-[8px] text-white/15">
          {format(rangeStart, 'M/d', { locale: zhCN })} — {format(rangeEnd, 'M/d', { locale: zhCN })}
        </span>
      </div>

      {/* Main gantt area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Task labels (left) */}
        <div className="shrink-0 border-r border-white/[0.06] overflow-y-auto" style={{ width: labelWidth, scrollbarWidth: 'none' }}>
          {/* Header spacer */}
          <div style={{ height: headerHeight }} className="border-b border-white/[0.06] px-2 flex items-end pb-1">
            <span className="text-[8px] text-white/20">任务名称</span>
          </div>
          {/* Task rows */}
          {sortedTasks.map((task, idx) => {
            const pri = PRIORITY_CFG[task.priority];
            const sts = STATUS_CFG[task.status];
            const isHovered = hoveredTaskId === task.id;
            return (
              <div
                key={task.id}
                className={`flex items-center gap-1.5 px-2 border-b border-white/[0.02] cursor-pointer transition-colors ${
                  isHovered ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                }`}
                style={{ height: rowHeight }}
                onMouseEnter={() => setHoveredTaskId(task.id)}
                onMouseLeave={() => setHoveredTaskId(null)}
                onClick={() => onOpenDetail?.(task)}
              >
                <sts.icon size={10} className={
                  task.status === 'done' ? 'text-emerald-400/60'
                  : task.status === 'in-progress' ? 'text-amber-400/60'
                  : task.status === 'blocked' ? 'text-red-400/60'
                  : task.status === 'review' ? 'text-violet-400/60'
                  : 'text-white/20'
                } />
                <span
                  className={`text-[10px] truncate flex-1 ${
                    task.status === 'done' ? 'line-through text-white/20' : 'text-white/50'
                  }`}
                  title={task.title}
                >
                  {task.title}
                </span>
                <pri.icon size={8} className={`${pri.color} shrink-0 opacity-50`} />
              </div>
            );
          })}
        </div>

        {/* Chart area (scrollable) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div style={{ width: totalWidth, minHeight: headerHeight + sortedTasks.length * rowHeight }}>
            {/* Date headers */}
            <div className="sticky top-0 z-10" style={{ height: headerHeight }}>
              {/* Month row */}
              <div className="flex h-6" style={{ background: 'rgba(10,11,16,0.95)' }}>
                {monthGroups.map((mg, i) => (
                  <div
                    key={i}
                    className="border-r border-b border-white/[0.04] flex items-center justify-center text-[9px] text-white/30"
                    style={{ width: mg.days.length * zoomCfg.cellWidth, fontWeight: 500 }}
                  >
                    {mg.label}
                  </div>
                ))}
              </div>
              {/* Day/Week row */}
              <div className="flex" style={{ height: headerHeight - 24, background: 'rgba(10,11,16,0.9)' }}>
                {allDays.map((day, i) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isTodayDay = isToday(day);
                  return (
                    <div
                      key={i}
                      className={`border-r border-b border-white/[0.03] flex items-center justify-center text-[8px] ${
                        isTodayDay ? 'text-[#667eea] bg-[#667eea]/[0.06]'
                        : isWeekend ? 'text-white/10 bg-white/[0.01]'
                        : 'text-white/20'
                      }`}
                      style={{ width: zoomCfg.cellWidth }}
                    >
                      {zoom === 'day' ? format(day, 'd') : format(day, 'M/d')}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid lines + bars */}
            <div className="relative" style={{ height: sortedTasks.length * rowHeight }}>
              {/* Vertical grid lines */}
              {allDays.map((day, i) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={`grid-${i}`}
                    className="absolute top-0 bottom-0"
                    style={{
                      left: i * zoomCfg.cellWidth,
                      width: zoomCfg.cellWidth,
                      borderRight: '1px solid rgba(255,255,255,0.02)',
                      background: isWeekend ? 'rgba(255,255,255,0.008)' : 'transparent',
                    }}
                  />
                );
              })}

              {/* Horizontal row lines */}
              {sortedTasks.map((_, i) => (
                <div
                  key={`hline-${i}`}
                  className="absolute w-full"
                  style={{
                    top: i * rowHeight + rowHeight,
                    height: 1,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                />
              ))}

              {/* Today indicator line */}
              {todayX > 0 && todayX < totalWidth && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{ left: todayX, width: 2, background: 'rgba(102,126,234,0.5)' }}
                >
                  <div
                    className="absolute -top-0.5 -left-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: '#667eea' }}
                  />
                </div>
              )}

              {/* Dependency lines (SVG overlay) */}
              {depLines.length > 0 && (
                <svg
                  className="absolute top-0 left-0 pointer-events-none z-10"
                  width={totalWidth}
                  height={sortedTasks.length * rowHeight}
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    <marker id="gantt-arrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                      <polygon points="0 0, 6 2, 0 4" fill="rgba(102,126,234,0.4)" />
                    </marker>
                  </defs>
                  {depLines.map((line, i) => {
                    // Draw a bezier curve
                    const midX = (line.fromX + line.toX) / 2;
                    return (
                      <path
                        key={i}
                        d={`M${line.fromX},${line.fromY} C${midX},${line.fromY} ${midX},${line.toY} ${line.toX},${line.toY}`}
                        fill="none"
                        stroke={line.highlighted ? 'rgba(102,126,234,0.5)' : 'rgba(255,255,255,0.06)'}
                        strokeWidth={line.highlighted ? 1.5 : 1}
                        strokeDasharray={line.highlighted ? 'none' : '3,3'}
                        markerEnd="url(#gantt-arrow)"
                      />
                    );
                  })}
                </svg>
              )}

              {/* Task bars */}
              {taskTimeInfos.map((info, idx) => {
                const bar = getBarRect(info);
                const statusCfg = STATUS_CFG[info.task.status];
                const isHovered = hoveredTaskId === info.task.id;
                const isOverdue = info.task.dueDate && info.task.dueDate < Date.now() && info.task.status !== 'done';

                return (
                  <motion.div
                    key={info.task.id}
                    className={`absolute flex items-center rounded-md cursor-pointer transition-shadow ${
                      isHovered ? 'shadow-lg ring-1 ring-white/10' : ''
                    }`}
                    style={{
                      left: bar.x,
                      top: idx * rowHeight + 4,
                      width: bar.w,
                      height: rowHeight - 8,
                      background: statusCfg.barColor,
                      border: isOverdue ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={() => setHoveredTaskId(info.task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    onClick={() => onOpenDetail?.(info.task)}
                    title={`${info.task.title}\n${format(info.start, 'M/d')} → ${format(info.end, 'M/d')}`}
                    initial={false}
                    layout
                  >
                    {/* Progress fill for done */}
                    {info.task.status === 'done' && (
                      <div
                        className="absolute inset-0 rounded-md"
                        style={{ background: 'rgba(52,211,153,0.15)' }}
                      />
                    )}

                    {/* Label (if bar is wide enough) */}
                    {bar.w > 60 && (
                      <span className="text-[8px] text-white/40 truncate px-1.5 relative z-10">
                        {info.task.title}
                      </span>
                    )}

                    {/* Resize handle (right edge) */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/10 rounded-r-md transition-colors"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingTask(info.task.id);
                        const startX = e.clientX;
                        const onMove = (ev: MouseEvent) => {
                          // Visual feedback handled by CSS
                        };
                        const onUp = (ev: MouseEvent) => {
                          handleBarDragEnd(info.task.id, ev.clientX - startX);
                          document.removeEventListener('mousemove', onMove);
                          document.removeEventListener('mouseup', onUp);
                        };
                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                      }}
                    />

                    {/* Resize handle (left edge) */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/10 rounded-l-md transition-colors"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingTask(info.task.id);
                        const startX = e.clientX;
                        const onMove = (ev: MouseEvent) => {
                          // Visual feedback handled by CSS
                        };
                        const onUp = (ev: MouseEvent) => {
                          handleBarDragStart(info.task.id, ev.clientX - startX);
                          document.removeEventListener('mousemove', onMove);
                          document.removeEventListener('mouseup', onUp);
                        };
                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                      }}
                    />

                    {/* Overdue indicator */}
                    {isOverdue && (
                      <div className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-red-400 border border-[#0d0e14]" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}