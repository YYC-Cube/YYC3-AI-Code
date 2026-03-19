/**
 * @file useTaskStore.ts
 * @description 任务看板状态管理 — useSyncExternalStore + localStorage 持久化（不依赖 zustand）
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,task-board,store,persistence
 */

import { useSyncExternalStore, useCallback } from 'react';
import type {
  Task, SubTask, Reminder, TaskFilter, TaskSortField, TaskSortOrder,
} from '../../types/task';

/* ================================================================
   Storage Keys
   ================================================================ */

const TASKS_KEY = 'yyc3-task-board-tasks';
const REMINDERS_KEY = 'yyc3-task-board-reminders';

/* ================================================================
   Internal State
   ================================================================ */

interface TaskStoreState {
  tasks: Task[];
  reminders: Reminder[];
}

let _state: TaskStoreState = loadFromStorage();
let _snapshot: TaskStoreState = _state;
const _listeners = new Set<() => void>();

function loadFromStorage(): TaskStoreState {
  try {
    const tasks: Task[] = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
    const reminders: Reminder[] = JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]');
    return { tasks, reminders };
  } catch {
    return { tasks: [], reminders: [] };
  }
}

function persist() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(_state.tasks));
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(_state.reminders));
  } catch { /* quota exceeded */ }
}

function emit() {
  _snapshot = { ..._state };
  for (const fn of _listeners) fn();
}

function setState(updater: (prev: TaskStoreState) => Partial<TaskStoreState>) {
  const partial = updater(_state);
  _state = { ..._state, ...partial };
  persist();
  emit();
}

/* ================================================================
   Public Actions
   ================================================================ */

export const taskStoreActions = {
  /* ── Task CRUD ── */

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'> & { source?: Task['source'] }): string {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    const newTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
      isArchived: false,
      source: task.source || 'manual',
      tags: task.tags || [],
    };
    setState(prev => ({ tasks: [newTask, ...prev.tasks] }));
    return id;
  },

  updateTask(taskId: string, updates: Partial<Task>) {
    setState(prev => ({
      tasks: prev.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t
      ),
    }));
  },

  deleteTask(taskId: string) {
    setState(prev => ({
      tasks: prev.tasks.filter(t => t.id !== taskId),
      reminders: prev.reminders.filter(r => r.taskId !== taskId),
    }));
  },

  archiveTask(taskId: string) {
    setState(prev => ({
      tasks: prev.tasks.map(t =>
        t.id === taskId ? { ...t, isArchived: true, updatedAt: Date.now() } : t
      ),
    }));
  },

  /* ── Sub-task CRUD ── */

  addSubtask(taskId: string, title: string): string {
    const subId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`;
    const sub: SubTask = { id: subId, title, isCompleted: false, createdAt: Date.now() };
    setState(prev => ({
      tasks: prev.tasks.map(t =>
        t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), sub], updatedAt: Date.now() } : t
      ),
    }));
    return subId;
  },

  toggleSubtask(taskId: string, subtaskId: string) {
    setState(prev => ({
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks?.map(s =>
            s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
          ),
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  deleteSubtask(taskId: string, subtaskId: string) {
    setState(prev => ({
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks?.filter(s => s.id !== subtaskId),
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  /* ── Reminder CRUD ── */

  addReminder(reminder: Omit<Reminder, 'id' | 'createdAt' | 'isTriggered' | 'isRead'>): string {
    const id = `rem-${Date.now()}`;
    const newReminder: Reminder = {
      ...reminder,
      id,
      createdAt: Date.now(),
      isTriggered: false,
      isRead: false,
    };
    setState(prev => ({ reminders: [...prev.reminders, newReminder] }));
    return id;
  },

  markReminderRead(reminderId: string) {
    setState(prev => ({
      reminders: prev.reminders.map(r =>
        r.id === reminderId ? { ...r, isRead: true, isTriggered: true } : r
      ),
    }));
  },

  deleteReminder(reminderId: string) {
    setState(prev => ({
      reminders: prev.reminders.filter(r => r.id !== reminderId),
    }));
  },

  /* ── Batch Operations ── */

  batchUpdateStatus(taskIds: string[], status: Task['status']) {
    const now = Date.now();
    setState(prev => ({
      tasks: prev.tasks.map(t =>
        taskIds.includes(t.id)
          ? { ...t, status, updatedAt: now, completedAt: status === 'done' ? now : undefined }
          : t
      ),
    }));
  },

  batchDelete(taskIds: string[]) {
    setState(prev => ({
      tasks: prev.tasks.filter(t => !taskIds.includes(t.id)),
      reminders: prev.reminders.filter(r => !taskIds.includes(r.taskId)),
    }));
  },

  batchArchive(taskIds: string[]) {
    const now = Date.now();
    setState(prev => ({
      tasks: prev.tasks.map(t =>
        taskIds.includes(t.id) ? { ...t, isArchived: true, updatedAt: now } : t
      ),
    }));
  },

  /* ── Utility ── */

  duplicateTask(taskId: string): string | null {
    const task = _state.tasks.find(t => t.id === taskId);
    if (!task) return null;
    return taskStoreActions.addTask({
      title: `${task.title} (副本)`,
      description: task.description,
      status: 'todo',
      priority: task.priority,
      type: task.type,
      tags: [...task.tags],
      subtasks: task.subtasks?.map(s => ({ ...s, id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`, isCompleted: false })),
      relatedFiles: task.relatedFiles,
      estimatedHours: task.estimatedHours,
      source: 'manual',
    });
  },

  clearCompleted() {
    setState(prev => ({
      tasks: prev.tasks.filter(t => t.status !== 'done'),
      reminders: prev.reminders.filter(r => {
        const task = prev.tasks.find(t => t.id === r.taskId);
        return task?.status !== 'done';
      }),
    }));
  },

  /** Import tasks extracted by AI (adds with 'ai-inferred' source) */
  importAITasks(titles: string[]) {
    const now = Date.now();
    const newTasks: Task[] = titles.map((title, i) => ({
      id: `task-ai-${now}-${i}`,
      title,
      status: 'todo' as const,
      priority: 'medium' as const,
      type: 'other' as const,
      tags: ['AI'],
      createdAt: now + i,
      updatedAt: now + i,
      isArchived: false,
      source: 'ai-inferred' as const,
      confidence: 0.8,
    }));
    setState(prev => ({ tasks: [...newTasks, ...prev.tasks] }));
  },
};

/* ================================================================
   useSyncExternalStore Hook
   ================================================================ */

function subscribe(cb: () => void) {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

function getSnapshot(): TaskStoreState {
  return _snapshot;
}

/** Main hook — returns current state */
export function useTaskStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Convenience: get tasks with filter + sort applied */
export function useFilteredTasks(
  filter: TaskFilter,
  sortField: TaskSortField = 'createdAt',
  sortOrder: TaskSortOrder = 'desc',
) {
  const { tasks } = useTaskStore();

  const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  let filtered = tasks.filter(t => !t.isArchived);

  if (filter.status && filter.status !== 'all') {
    filtered = filtered.filter(t => t.status === filter.status);
  }
  if (filter.priority && filter.priority !== 'all') {
    filtered = filtered.filter(t => t.priority === filter.priority);
  }
  if (filter.type && filter.type !== 'all') {
    filtered = filtered.filter(t => t.type === filter.type);
  }
  if (filter.source && filter.source !== 'all') {
    filtered = filtered.filter(t => t.source === filter.source);
  }
  if (filter.tags && filter.tags.length > 0) {
    filtered = filtered.filter(t => filter.tags!.some(tag => t.tags.includes(tag)));
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }

  // Sort
  filtered.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'priority': cmp = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2); break;
      case 'dueDate': cmp = (a.dueDate || Infinity) - (b.dueDate || Infinity); break;
      case 'createdAt': cmp = a.createdAt - b.createdAt; break;
      case 'updatedAt': cmp = a.updatedAt - b.updatedAt; break;
      case 'title': cmp = a.title.localeCompare(b.title); break;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  return filtered;
}

/** Direct read (non-reactive, for services) */
export function getTaskStoreState(): TaskStoreState {
  return _state;
}
