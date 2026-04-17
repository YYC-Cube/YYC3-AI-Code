/**
 * @file task-store.tsx
 * @description AI Task Board store — task CRUD, subtasks, reminders, filtering,
 *   sorting, batch operations, AI inference mock, kanban state management
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags task-board, kanban, ai-inference, reminders, project-management
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'
import { useAIServiceStore } from './ai-service-store'

const log = createLogger('TaskStore')

// ============================================
// DFS cycle detection for dependency graph
// ============================================

/** Returns true if adding depId as dependency of taskId would create a cycle */
function wouldCreateCycle(tasks: Task[], taskId: string, depId: string): boolean {
  // DFS from depId — if we can reach taskId, adding the edge creates a cycle
  const visited = new Set<string>()
  const stack = [depId]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === taskId) {return true}
    if (visited.has(current)) {continue}
    visited.add(current)
    const task = tasks.find(t => t.id === current)
    if (task?.dependencies) {
      for (const dep of task.dependencies) {
        if (!visited.has(dep)) {stack.push(dep)}
      }
    }
  }
  return false
}

// ============================================
// WIP (Work-In-Progress) limits per column
// ============================================

export type WipLimits = Record<TaskStatus, number>

const DEFAULT_WIP_LIMITS: WipLimits = {
  'todo': 0,          // 0 = unlimited
  'in-progress': 5,
  'review': 3,
  'done': 0,
  'blocked': 0,
}

// ============================================
// Types
// ============================================

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'
export type TaskType = 'feature' | 'bug' | 'refactor' | 'test' | 'documentation' | 'other'
export type ReminderType = 'deadline' | 'dependency' | 'blocking' | 'progress' | 'custom'
export type TaskSource = 'manual' | 'ai-inferred' | 'imported'

export interface SubTask {
  id: string
  title: string
  isCompleted: boolean
  createdAt: number
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  createdAt: number
  updatedAt: number
  dueDate?: number
  estimatedHours?: number
  actualHours?: number
  relatedMessageId?: string
  relatedFiles?: string[]
  tags?: string[]
  subtasks?: SubTask[]
  dependencies?: string[]
  blocking?: string[]
  assigneeId?: string
  isArchived: boolean
  source: TaskSource
  confidence?: number
  sortIndex: number
  sprintId?: string
}

export type SprintStatus = 'planned' | 'active' | 'completed'

export interface Sprint {
  id: string
  name: string
  startDate: number
  endDate: number
  status: SprintStatus
  createdAt: number
  goal?: string
}

export interface Reminder {
  id: string
  taskId: string
  type: ReminderType
  message: string
  remindAt: number
  isTriggered: boolean
  isRead: boolean
  createdAt: number
}

export interface TaskInference {
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'source'>
  confidence: number
  reasoning: string
  context: string
}

export type TaskSortBy = 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'title'

export interface TaskFilter {
  status?: TaskStatus
  priority?: TaskPriority
  type?: TaskType
  tags?: string[]
  showArchived?: boolean
  searchQuery?: string
}

// ============================================
// Mock data — seed tasks
// ============================================

const SEED_TASKS: Task[] = [
  {
    id: 'task-001',
    title: '实现 AI 对话流式响应',
    description: '将 LeftPanel AI 聊天面板的消息响应升级为 SSE 流式输出，支持逐字显示',
    status: 'in-progress',
    priority: 'high',
    type: 'feature',
    createdAt: Date.now() - 3 * 86400000,
    updatedAt: Date.now() - 1 * 86400000,
    estimatedHours: 8,
    relatedFiles: ['src/app/components/designer/LeftPanel.tsx', 'src/app/stores/session-store.ts'],
    tags: ['AI', 'streaming', 'UX'],
    subtasks: [
      { id: 'st-001-1', title: '实现 SSE 客户端解析', isCompleted: true, createdAt: Date.now() - 3 * 86400000 },
      { id: 'st-001-2', title: '添加打字机动画效果', isCompleted: false, createdAt: Date.now() - 3 * 86400000 },
      { id: 'st-001-3', title: '处理断连重试逻辑', isCompleted: false, createdAt: Date.now() - 2 * 86400000 },
    ],
    isArchived: false,
    source: 'manual',
    sortIndex: 0,
  },
  {
    id: 'task-002',
    title: '修复 Monaco Editor 内存泄漏',
    description: '切换文件时 Monaco Editor 实例未正确 dispose，导致内存持续增长',
    status: 'todo',
    priority: 'critical',
    type: 'bug',
    createdAt: Date.now() - 2 * 86400000,
    updatedAt: Date.now() - 2 * 86400000,
    estimatedHours: 4,
    relatedFiles: ['src/app/components/designer/CenterPanel.tsx'],
    tags: ['性能', 'Monaco', 'bug'],
    isArchived: false,
    source: 'ai-inferred',
    confidence: 0.92,
    sortIndex: 1,
  },
  {
    id: 'task-003',
    title: '添加 Vitest 单元测试覆盖',
    description: '为 settings-store、ai-service-store、task-store 添加 Vitest 单元测试',
    status: 'todo',
    priority: 'medium',
    type: 'test',
    createdAt: Date.now() - 1 * 86400000,
    updatedAt: Date.now() - 1 * 86400000,
    estimatedHours: 12,
    dueDate: Date.now() + 5 * 86400000,
    tags: ['测试', 'vitest', 'CI'],
    subtasks: [
      { id: 'st-003-1', title: 'settings-store CRUD 测试', isCompleted: false, createdAt: Date.now() - 1 * 86400000 },
      { id: 'st-003-2', title: 'ai-service-store 同步测试', isCompleted: false, createdAt: Date.now() - 1 * 86400000 },
      { id: 'st-003-3', title: 'task-store 过滤排序测试', isCompleted: false, createdAt: Date.now() - 1 * 86400000 },
    ],
    isArchived: false,
    source: 'manual',
    sortIndex: 2,
  },
  {
    id: 'task-004',
    title: '重构 preview-store 状态管理',
    description: '将 preview-store 中的设备配置和预览历史分离为独立的 derived stores',
    status: 'review',
    priority: 'medium',
    type: 'refactor',
    createdAt: Date.now() - 4 * 86400000,
    updatedAt: Date.now(),
    estimatedHours: 6,
    relatedFiles: ['src/app/stores/preview-store.ts'],
    tags: ['重构', 'store'],
    dependencies: ['task-001'],
    isArchived: false,
    source: 'manual',
    sortIndex: 3,
  },
  {
    id: 'task-005',
    title: '补充 i18n 翻译键 — 日语',
    description: '为 ja-JP 语言包补充所有已有的 zh-CN / en-US 翻译键',
    status: 'blocked',
    priority: 'low',
    type: 'documentation',
    createdAt: Date.now() - 5 * 86400000,
    updatedAt: Date.now() - 3 * 86400000,
    estimatedHours: 16,
    tags: ['i18n', '日语', '文档'],
    isArchived: false,
    source: 'manual',
    sortIndex: 4,
  },
  {
    id: 'task-006',
    title: '完成 Plugin API registerPlugin 集成测试',
    description: '为 plugin-api.ts 的 registerPlugin / unregister / activate 流程编写集成测试',
    status: 'done',
    priority: 'medium',
    type: 'test',
    createdAt: Date.now() - 6 * 86400000,
    updatedAt: Date.now() - 1 * 86400000,
    estimatedHours: 4,
    actualHours: 3.5,
    relatedFiles: ['src/app/services/plugin-api.ts'],
    tags: ['插件', '测试'],
    isArchived: false,
    source: 'manual',
    sortIndex: 5,
  },
]

const SEED_REMINDERS: Reminder[] = [
  {
    id: 'rem-001',
    taskId: 'task-003',
    type: 'deadline',
    message: '单元测试覆盖任务将在 5 天后到期',
    remindAt: Date.now() + 4 * 86400000,
    isTriggered: false,
    isRead: false,
    createdAt: Date.now(),
  },
]

// ============================================
// Priority sorting weight
// ============================================

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

// ============================================
// Store
// ============================================

interface TaskStoreState {
  tasks: Task[]
  reminders: Reminder[]
  filter: TaskFilter
  sortBy: TaskSortBy
  sortOrder: 'asc' | 'desc'
  /** Currently selected task IDs (for batch ops) */
  selectedTaskIds: string[]
  /** ID of task being viewed/edited in detail */
  detailTaskId: string | null
  /** Board view mode */
  viewMode: 'kanban' | 'list' | 'timeline'
  /** Whether add-task form is visible */
  addFormOpen: boolean
  /** AI inference in progress */
  inferring: boolean
  /** WIP limits per column (0 = unlimited) */
  wipLimits: WipLimits
  /** Sprint management */
  sprints: Sprint[]
  activeSprintId: string | null
}

interface TaskStoreActions {
  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'> & { source?: TaskSource }) => string
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  archiveTask: (id: string) => void
  duplicateTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  reorderTask: (taskId: string, targetTaskId: string, position: 'before' | 'after') => void

  // Dependencies
  addDependency: (taskId: string, dependencyId: string) => boolean
  removeDependency: (taskId: string, dependencyId: string) => void
  addBlocking: (taskId: string, blockingId: string) => void
  removeBlocking: (taskId: string, blockingId: string) => void

  // Subtask CRUD
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void

  // Reminders
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt' | 'isTriggered' | 'isRead'>) => void
  markReminderRead: (id: string) => void
  deleteReminder: (id: string) => void
  getActiveReminders: () => Reminder[]

  // Filter & Sort
  setFilter: (filter: Partial<TaskFilter>) => void
  clearFilter: () => void
  setSortBy: (sortBy: TaskSortBy) => void
  toggleSortOrder: () => void
  getFilteredTasks: () => Task[]
  getTasksByStatus: (status: TaskStatus) => Task[]

  // Selection
  toggleSelectTask: (id: string) => void
  selectAllFiltered: () => void
  clearSelection: () => void

  // Batch
  batchUpdateStatus: (status: TaskStatus) => void
  batchDelete: () => void
  batchArchive: () => void
  batchUpdatePriority: (priority: TaskPriority) => void

  // Detail / UI
  setDetailTask: (id: string | null) => void
  setViewMode: (mode: TaskStoreState['viewMode']) => void
  setAddFormOpen: (open: boolean) => void

  // AI inference (simulated)
  inferTasksFromText: (text: string) => Promise<TaskInference[]>
  acceptInference: (inference: TaskInference) => void

  // Stats
  getStats: () => { total: number; byStatus: Record<TaskStatus, number>; byPriority: Record<TaskPriority, number>; overdue: number; completionRate: number }

  // WIP limits
  setWipLimit: (status: TaskStatus, limit: number) => void
  resetWipLimits: () => void

  // Sprint management
  createSprint: (name: string, startDate: number, endDate: number, goal?: string) => string
  updateSprint: (id: string, updates: Partial<Sprint>) => void
  deleteSprint: (id: string) => void
  startSprint: (id: string) => void
  completeSprint: (id: string) => void
  setActiveSprint: (id: string | null) => void
  assignTaskToSprint: (taskId: string, sprintId: string | null) => void
  getSprintTasks: (sprintId: string) => Task[]
}

export const useTaskStore = create<TaskStoreState & TaskStoreActions>()(
  persist(
    (set, get) => ({
      tasks: SEED_TASKS,
      reminders: SEED_REMINDERS,
      filter: {},
      sortBy: 'priority',
      sortOrder: 'asc',
      selectedTaskIds: [],
      detailTaskId: null,
      viewMode: 'kanban',
      addFormOpen: false,
      inferring: false,
      wipLimits: DEFAULT_WIP_LIMITS,
      sprints: [],
      activeSprintId: null,

      // ── Task CRUD ──

      addTask: (taskInput) => {
        const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const newTask: Task = {
          ...taskInput,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isArchived: false,
          source: taskInput.source || 'manual',
          sortIndex: get().tasks.length,
        }
        set(s => ({ tasks: [...s.tasks, newTask] }))
        log.info('Task added', { id, title: newTask.title })
        return id
      },

      updateTask: (id, updates) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t),
        }))
      },

      deleteTask: (id) => {
        set(s => ({
          tasks: s.tasks.filter(t => t.id !== id),
          reminders: s.reminders.filter(r => r.taskId !== id),
          selectedTaskIds: s.selectedTaskIds.filter(sid => sid !== id),
          detailTaskId: s.detailTaskId === id ? null : s.detailTaskId,
        }))
        log.info('Task deleted', { id })
      },

      archiveTask: (id) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === id ? { ...t, isArchived: true, updatedAt: Date.now() } : t),
        }))
      },

      duplicateTask: (id) => {
        const task = get().tasks.find(t => t.id === id)
        if (!task) {return}
        get().addTask({
          title: `${task.title} (副本)`,
          description: task.description,
          status: 'todo',
          priority: task.priority,
          type: task.type,
          estimatedHours: task.estimatedHours,
          relatedFiles: task.relatedFiles,
          tags: task.tags,
          subtasks: task.subtasks?.map(st => ({ ...st, id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`, isCompleted: false })),
          sortIndex: (task.sortIndex || 0) + 1,
          source: 'duplicate' as any,
        })
      },

      moveTask: (id, status) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === id ? { ...t, status, updatedAt: Date.now() } : t),
        }))
      },

      reorderTask: (taskId, targetTaskId, position) => {
        set(s => {
          const tasks = [...s.tasks]
          const taskIndex = tasks.findIndex(t => t.id === taskId)
          const targetIndex = tasks.findIndex(t => t.id === targetTaskId)
          if (taskIndex === -1 || targetIndex === -1 || taskId === targetTaskId) {return s}

          const [task] = tasks.splice(taskIndex, 1)
          const targetTask = tasks.find(t => t.id === targetTaskId)
          if (targetTask) {task.status = targetTask.status}

          const newTargetIndex = tasks.findIndex(t => t.id === targetTaskId)
          tasks.splice(position === 'before' ? newTargetIndex : newTargetIndex + 1, 0, task)

          // Persist sortIndex for all tasks to maintain manual ordering
          tasks.forEach((t, i) => { t.sortIndex = i })

          return { tasks }
        })
      },

      // ── Dependencies ──

      addDependency: (taskId, dependencyId) => {
        const { tasks } = get()
        // DFS cycle detection: prevent circular dependencies
        if (wouldCreateCycle(tasks, taskId, dependencyId)) {
          log.warn('Circular dependency detected', { taskId, dependencyId })
          return false
        }
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, dependencies: [...(t.dependencies || []), dependencyId] } : t),
        }))
        return true
      },

      removeDependency: (taskId, dependencyId) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, dependencies: t.dependencies?.filter(id => id !== dependencyId) } : t),
        }))
      },

      addBlocking: (taskId, blockingId) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, blocking: [...(t.blocking || []), blockingId] } : t),
        }))
      },

      removeBlocking: (taskId, blockingId) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, blocking: t.blocking?.filter(id => id !== blockingId) } : t),
        }))
      },

      // ── Subtask CRUD ──

      addSubtask: (taskId, title) => {
        set(s => ({
          tasks: s.tasks.map(t => {
            if (t.id !== taskId) {return t}
            const st: SubTask = { id: `st-${Date.now()}`, title, isCompleted: false, createdAt: Date.now() }
            return { ...t, subtasks: [...(t.subtasks || []), st], updatedAt: Date.now() }
          }),
        }))
      },

      toggleSubtask: (taskId, subtaskId) => {
        set(s => ({
          tasks: s.tasks.map(t => {
            if (t.id !== taskId) {return t}
            return {
              ...t,
              subtasks: t.subtasks?.map(st => st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st),
              updatedAt: Date.now(),
            }
          }),
        }))
      },

      deleteSubtask: (taskId, subtaskId) => {
        set(s => ({
          tasks: s.tasks.map(t => {
            if (t.id !== taskId) {return t}
            return { ...t, subtasks: t.subtasks?.filter(st => st.id !== subtaskId), updatedAt: Date.now() }
          }),
        }))
      },

      // ── Reminders ──

      addReminder: (r) => {
        const reminder: Reminder = { ...r, id: `rem-${Date.now()}`, createdAt: Date.now(), isTriggered: false, isRead: false }
        set(s => ({ reminders: [...s.reminders, reminder] }))
      },

      markReminderRead: (id) => {
        set(s => ({ reminders: s.reminders.map(r => r.id === id ? { ...r, isRead: true, isTriggered: true } : r) }))
      },

      deleteReminder: (id) => {
        set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }))
      },

      getActiveReminders: () => {
        return get().reminders.filter(r => !r.isRead && !r.isTriggered && r.remindAt <= Date.now())
      },

      // ── Filter & Sort ──

      setFilter: (filter) => set(s => ({ filter: { ...s.filter, ...filter } })),
      clearFilter: () => set({ filter: {} }),
      setSortBy: (sortBy) => set({ sortBy }),
      toggleSortOrder: () => set(s => ({ sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' })),

      getFilteredTasks: () => {
        const { tasks, filter, sortBy, sortOrder } = get()
        let result = tasks.filter(t => !t.isArchived || filter.showArchived)

        if (filter.status) {result = result.filter(t => t.status === filter.status)}
        if (filter.priority) {result = result.filter(t => t.priority === filter.priority)}
        if (filter.type) {result = result.filter(t => t.type === filter.type)}
        if (filter.tags?.length) {result = result.filter(t => filter.tags!.some(tag => t.tags?.includes(tag)))}
        if (filter.searchQuery) {
          const q = filter.searchQuery.toLowerCase()
          result = result.filter(t =>
            t.title.toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q) ||
            t.tags?.some(tag => tag.toLowerCase().includes(q))
          )
        }

        result.sort((a, b) => {
          let cmp = 0
          switch (sortBy) {
            case 'priority': cmp = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]; break
            case 'dueDate': cmp = (a.dueDate || Infinity) - (b.dueDate || Infinity); break
            case 'createdAt': cmp = a.createdAt - b.createdAt; break
            case 'updatedAt': cmp = a.updatedAt - b.updatedAt; break
            case 'title': cmp = a.title.localeCompare(b.title); break
          }
          return sortOrder === 'asc' ? cmp : -cmp
        })

        return result
      },

      getTasksByStatus: (status) => {
        return get().getFilteredTasks()
          .filter(t => t.status === status)
          .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
      },

      // ── Selection ──

      toggleSelectTask: (id) => {
        set(s => ({
          selectedTaskIds: s.selectedTaskIds.includes(id)
            ? s.selectedTaskIds.filter(sid => sid !== id)
            : [...s.selectedTaskIds, id],
        }))
      },

      selectAllFiltered: () => {
        const ids = get().getFilteredTasks().map(t => t.id)
        set({ selectedTaskIds: ids })
      },

      clearSelection: () => set({ selectedTaskIds: [] }),

      // ── Batch ──

      batchUpdateStatus: (status) => {
        const { selectedTaskIds } = get()
        set(s => ({
          tasks: s.tasks.map(t =>
            selectedTaskIds.includes(t.id) ? { ...t, status, updatedAt: Date.now() } : t
          ),
          selectedTaskIds: [],
        }))
      },

      batchDelete: () => {
        const { selectedTaskIds } = get()
        set(s => ({
          tasks: s.tasks.filter(t => !selectedTaskIds.includes(t.id)),
          reminders: s.reminders.filter(r => !selectedTaskIds.includes(r.taskId)),
          selectedTaskIds: [],
        }))
      },

      batchArchive: () => {
        const { selectedTaskIds } = get()
        set(s => ({
          tasks: s.tasks.map(t =>
            selectedTaskIds.includes(t.id) ? { ...t, isArchived: true, updatedAt: Date.now() } : t
          ),
          selectedTaskIds: [],
        }))
      },

      batchUpdatePriority: (priority) => {
        const { selectedTaskIds } = get()
        set(s => ({
          tasks: s.tasks.map(t =>
            selectedTaskIds.includes(t.id) ? { ...t, priority, updatedAt: Date.now() } : t
          ),
          selectedTaskIds: [],
        }))
      },

      // ── Detail / UI ──

      setDetailTask: (id) => set({ detailTaskId: id }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setAddFormOpen: (open) => set({ addFormOpen: open }),

      // ── AI inference (simulated) ──

      inferTasksFromText: async (text) => {
        set({ inferring: true })
        log.info('Starting AI task inference', { textLength: text.length })

        // ── Step 1: Attempt real AI service call ──
        try {
          const aiStore = useAIServiceStore.getState()
          const provider = aiStore.getActiveProvider()
          const model = aiStore.getActiveModel()

          if (provider && model && provider.apiKey && provider.apiKey.length > 5) {
            log.info('Using real AI provider for task inference', { provider: provider.displayName, model: model.displayName })

            const systemPrompt = `You are an expert project manager and task analyst. Extract actionable tasks from the given text.

Task Types: feature, bug, refactor, test, documentation, other
Task Priorities: critical, high, medium, low

For each task found, respond ONLY with a JSON array. Each element must have:
- title: string (concise task title, max 60 chars)
- description: string (detailed description)
- type: one of the task types above
- priority: one of the priorities above
- estimatedHours: number or null
- tags: string[] (relevant labels)
- confidence: number between 0 and 1
- reasoning: string (why this is a task)
- context: string (relevant context snippet)

Respond with ONLY the JSON array, no markdown fences, no explanation.`

            const response = await fetch(`${provider.baseURL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`,
              },
              body: JSON.stringify({
                model: model.name,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: `Extract tasks from the following text:\n\n${text}` },
                ],
                temperature: 0.3,
                max_tokens: 2048,
              }),
              signal: AbortSignal.timeout(15000),
            })

            if (response.ok) {
              const data = await response.json()
              const content: string = data.choices?.[0]?.message?.content || ''

              // Record performance metric
              aiStore.recordMetric({
                providerId: provider.id,
                modelId: model.id,
                latency: Date.now(),
                throughput: (data.usage?.total_tokens || 0) / 1,
                successRate: 1,
                errorCount: 0,
                totalRequests: 1,
              })

              // Parse JSON array from response
              const jsonMatch = content.match(/\[[\s\S]*\]/)
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                const inferences: TaskInference[] = parsed.map((t: any) => ({
                  task: {
                    title: String(t.title || '').slice(0, 80),
                    description: String(t.description || ''),
                    status: 'todo' as const,
                    priority: (['critical', 'high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium') as TaskPriority,
                    type: (['feature', 'bug', 'refactor', 'test', 'documentation', 'other'].includes(t.type) ? t.type : 'other') as TaskType,
                    estimatedHours: typeof t.estimatedHours === 'number' ? t.estimatedHours : undefined,
                    tags: Array.isArray(t.tags) ? [...t.tags, 'AI推理'] : ['AI推理'],
                  },
                  confidence: typeof t.confidence === 'number' ? Math.min(1, Math.max(0, t.confidence)) : 0.8,
                  reasoning: String(t.reasoning || ''),
                  context: String(t.context || text.slice(0, 100)),
                }))

                set({ inferring: false })
                log.info('AI inference complete (real)', { count: inferences.length })
                return inferences
              }
            } else {
              log.warn('AI API returned non-OK status, falling back to local inference', { status: response.status })
            }
          }
        } catch (err) {
          log.warn('Real AI inference failed, falling back to local keyword inference', { error: String(err) })
        }

        // ── Step 2: Fallback — local keyword-based inference ──
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400))

        const inferences: TaskInference[] = []
        const lower = text.toLowerCase()

        if (lower.includes('todo') || lower.includes('待办') || lower.includes('需要')) {
          inferences.push({
            task: {
              title: text.slice(0, 60).replace(/^(todo|TODO|待办|需要)[：:\s]*/i, ''),
              description: text.slice(0, 200),
              status: 'todo',
              priority: lower.includes('urgent') || lower.includes('紧急') ? 'high' : 'medium',
              type: lower.includes('bug') || lower.includes('修复') ? 'bug'
                : lower.includes('test') || lower.includes('测试') ? 'test'
                : lower.includes('refactor') || lower.includes('重构') ? 'refactor'
                : lower.includes('doc') || lower.includes('文档') ? 'documentation'
                : 'feature',
              tags: ['AI推理(本地)'],
              sortIndex: 0,
            },
            confidence: 0.72,
            reasoning: '本地关键词匹配（未连接 AI 服务）',
            context: text.slice(0, 100),
          })
        }

        if (lower.includes('fix') || lower.includes('修复') || lower.includes('bug')) {
          inferences.push({
            task: {
              title: `修复: ${text.slice(0, 50)}`,
              description: text.slice(0, 200),
              status: 'todo',
              priority: 'high',
              type: 'bug',
              tags: ['AI推理(本地)', 'bug'],
              sortIndex: 0,
            },
            confidence: 0.78,
            reasoning: '检测到 bug 修复关键词（本地推理）',
            context: text.slice(0, 100),
          })
        }

        if (lower.includes('implement') || lower.includes('实现') || lower.includes('添加') || lower.includes('新增')) {
          inferences.push({
            task: {
              title: text.slice(0, 60),
              description: text.slice(0, 200),
              status: 'todo',
              priority: 'medium',
              type: 'feature',
              tags: ['AI推理(本地)', '功能'],
              sortIndex: 0,
            },
            confidence: 0.68,
            reasoning: '检测到新功能关键词（本地推理）',
            context: text.slice(0, 100),
          })
        }

        if (lower.includes('refactor') || lower.includes('重构') || lower.includes('优化')) {
          inferences.push({
            task: {
              title: text.slice(0, 60),
              description: text.slice(0, 200),
              status: 'todo',
              priority: 'medium',
              type: 'refactor',
              tags: ['AI推理(本地)', '重构'],
              sortIndex: 0,
            },
            confidence: 0.70,
            reasoning: '检测到重构/优化关键词（本地推理）',
            context: text.slice(0, 100),
          })
        }

        if (lower.includes('test') || lower.includes('测试') || lower.includes('vitest') || lower.includes('jest')) {
          inferences.push({
            task: {
              title: `测试: ${text.slice(0, 50)}`,
              description: text.slice(0, 200),
              status: 'todo',
              priority: 'medium',
              type: 'test',
              tags: ['AI推理(本地)', '测试'],
              sortIndex: 0,
            },
            confidence: 0.75,
            reasoning: '检测到测试相关关键词（本地推理）',
            context: text.slice(0, 100),
          })
        }

        // Fallback — always produce at least one inference
        if (inferences.length === 0 && text.trim().length > 5) {
          inferences.push({
            task: {
              title: text.slice(0, 60),
              description: text,
              status: 'todo',
              priority: 'medium',
              type: 'other',
              tags: ['AI推理(本地)'],
              sortIndex: 0,
            },
            confidence: 0.50,
            reasoning: '基于上下文自动推理（本地兜底）',
            context: text.slice(0, 100),
          })
        }

        set({ inferring: false })
        log.info('AI inference complete (local fallback)', { count: inferences.length })
        return inferences
      },

      acceptInference: (inference) => {
        get().addTask({
          ...inference.task,
          source: 'ai-inferred',
          confidence: inference.confidence,
        })
      },

      // ── Stats ──

      getStats: () => {
        const tasks = get().tasks.filter(t => !t.isArchived)
        const now = Date.now()
        const byStatus = { todo: 0, 'in-progress': 0, review: 0, done: 0, blocked: 0 } as Record<TaskStatus, number>
        const byPriority = { critical: 0, high: 0, medium: 0, low: 0 } as Record<TaskPriority, number>
        let overdue = 0

        for (const t of tasks) {
          byStatus[t.status]++
          byPriority[t.priority]++
          if (t.dueDate && t.dueDate < now && t.status !== 'done') {overdue++}
        }

        const total = tasks.length
        const completionRate = total > 0 ? byStatus.done / total : 0

        return { total, byStatus, byPriority, overdue, completionRate }
      },

      // ── WIP limits ──

      setWipLimit: (status, limit) => {
        set(s => ({
          wipLimits: { ...s.wipLimits, [status]: Math.max(0, limit) },
        }))
      },

      resetWipLimits: () => {
        set({ wipLimits: { ...DEFAULT_WIP_LIMITS } })
      },

      // ── Sprint management ──

      createSprint: (name, startDate, endDate, goal) => {
        const id = `sprint-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
        const sprint: Sprint = { id, name, startDate, endDate, status: 'planned', createdAt: Date.now(), goal }
        set(s => ({ sprints: [...s.sprints, sprint] }))
        log.info('Sprint created', { id, name })
        return id
      },

      updateSprint: (id, updates) => {
        set(s => ({
          sprints: s.sprints.map(sp => sp.id === id ? { ...sp, ...updates } : sp),
        }))
      },

      deleteSprint: (id) => {
        set(s => ({
          sprints: s.sprints.filter(sp => sp.id !== id),
          activeSprintId: s.activeSprintId === id ? null : s.activeSprintId,
          tasks: s.tasks.map(t => t.sprintId === id ? { ...t, sprintId: undefined } : t),
        }))
      },

      startSprint: (id) => {
        set(s => ({
          sprints: s.sprints.map(sp =>
            sp.id === id ? { ...sp, status: 'active' as const } :
            sp.status === 'active' ? { ...sp, status: 'completed' as const } : sp
          ),
          activeSprintId: id,
        }))
      },

      completeSprint: (id) => {
        set(s => ({
          sprints: s.sprints.map(sp => sp.id === id ? { ...sp, status: 'completed' as const } : sp),
          activeSprintId: s.activeSprintId === id ? null : s.activeSprintId,
        }))
      },

      setActiveSprint: (id) => set({ activeSprintId: id }),

      assignTaskToSprint: (taskId, sprintId) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, sprintId: sprintId || undefined, updatedAt: Date.now() } : t),
        }))
      },

      getSprintTasks: (sprintId) => {
        return get().tasks.filter(t => t.sprintId === sprintId && !t.isArchived)
      },
    }),
    {
      name: 'yyc3_task_board',
      partialize: (state) => ({
        tasks: state.tasks,
        reminders: state.reminders,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        wipLimits: state.wipLimits,
        sprints: state.sprints,
        activeSprintId: state.activeSprintId,
      }),
      merge: (persisted: any, current) => {
        if (!persisted) {return current}
        return {
          ...current,
          ...persisted,
          // Ensure seed tasks are present if tasks array is empty
          tasks: persisted.tasks?.length > 0 ? persisted.tasks : SEED_TASKS,
          reminders: persisted.reminders || SEED_REMINDERS,
        }
      },
    }
  )
)