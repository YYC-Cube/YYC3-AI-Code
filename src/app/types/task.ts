/**
 * @file task.ts
 * @description AI 任务看板核心类型定义 — 任务状态/优先级/类型/子任务/提醒/推理/依赖
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,task-board,interaction,types
 */

/* ================================================================
   枚举/联合类型
   ================================================================ */

/** 任务状态 */
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';

/** 任务优先级 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/** 任务类型 */
export type TaskType = 'feature' | 'bug' | 'refactor' | 'test' | 'documentation' | 'other';

/** 提醒类型 */
export type ReminderType = 'deadline' | 'dependency' | 'blocking' | 'progress' | 'custom';

/* ================================================================
   核心数据接口
   ================================================================ */

/** 子任务 */
export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
}

/** 任务 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  dueDate?: number;
  estimatedHours?: number;
  actualHours?: number;
  relatedMessageId?: string;
  relatedFiles?: string[];
  tags: string[];
  subtasks?: SubTask[];
  dependencies?: string[];
  blocking?: string[];
  assigneeId?: string;
  isArchived: boolean;
  source: 'manual' | 'ai-inferred' | 'imported';
  confidence?: number;
}

/** 提醒 */
export interface Reminder {
  id: string;
  taskId: string;
  type: ReminderType;
  message: string;
  remindAt: number;
  isTriggered: boolean;
  isRead: boolean;
  createdAt: number;
}

/** 任务推理结果 */
export interface TaskInference {
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'source'>;
  confidence: number;
  reasoning: string;
  context: string;
}

/* ================================================================
   筛选/排序
   ================================================================ */

export interface TaskFilter {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  type?: TaskType | 'all';
  tags?: string[];
  source?: Task['source'] | 'all';
  search?: string;
}

export type TaskSortField = 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'title';
export type TaskSortOrder = 'asc' | 'desc';
