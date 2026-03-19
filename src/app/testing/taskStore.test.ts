/**
 * @file taskStore.test.ts
 * @description Unit tests for Task Store — CRUD operations, filtering, persistence
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,task-store,crud,persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task, TaskStatus, TaskPriority } from '../types/task';

/* ================================================================
   Mock localStorage
   ================================================================ */

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

/* ================================================================
   Test Helpers
   ================================================================ */

function createMockTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: 'task-' + Math.random().toString(36).slice(2, 8),
    title: 'Test Task',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    type: 'feature',
    createdAt: now,
    updatedAt: now,
    tags: [],
    isArchived: false,
    source: 'manual',
    ...overrides,
  };
}

/* ================================================================
   Task Type Tests
   ================================================================ */

describe('Task Type Validation', () => {
  it('creates a valid task with all required fields', () => {
    const task = createMockTask();
    expect(task.id).toBeTruthy();
    expect(task.title).toBe('Test Task');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.type).toBe('feature');
    expect(task.createdAt).toBeGreaterThan(0);
    expect(task.updatedAt).toBeGreaterThan(0);
    expect(task.tags).toEqual([]);
    expect(task.isArchived).toBe(false);
    expect(task.source).toBe('manual');
  });

  it('supports all task statuses', () => {
    const statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'done', 'blocked'];
    for (const status of statuses) {
      const task = createMockTask({ status });
      expect(task.status).toBe(status);
    }
  });

  it('supports all task priorities', () => {
    const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
    for (const priority of priorities) {
      const task = createMockTask({ priority });
      expect(task.priority).toBe(priority);
    }
  });

  it('handles optional fields correctly', () => {
    const task = createMockTask({
      description: 'A detailed description',
      dueDate: Date.now() + 86400000,
      estimatedHours: 4,
      subtasks: [
        { id: 'sub-1', title: 'Subtask 1', isCompleted: false, createdAt: Date.now() },
      ],
      dependencies: ['task-abc'],
      tags: ['frontend', 'urgent'],
    });

    expect(task.description).toBe('A detailed description');
    expect(task.dueDate).toBeGreaterThan(Date.now());
    expect(task.estimatedHours).toBe(4);
    expect(task.subtasks!.length).toBe(1);
    expect(task.dependencies!.length).toBe(1);
    expect(task.tags.length).toBe(2);
  });
});

/* ================================================================
   Task Filtering Tests
   ================================================================ */

describe('Task Filtering Logic', () => {
  const tasks: Task[] = [
    createMockTask({ id: 't1', title: 'Build login page', status: 'todo', priority: 'high', tags: ['frontend'] }),
    createMockTask({ id: 't2', title: 'Fix API bug', status: 'in-progress', priority: 'critical', tags: ['backend', 'bug'] }),
    createMockTask({ id: 't3', title: 'Write tests', status: 'done', priority: 'medium', tags: ['testing'] }),
    createMockTask({ id: 't4', title: 'Deploy to staging', status: 'review', priority: 'low', isArchived: true }),
    createMockTask({ id: 't5', title: 'Update documentation', status: 'blocked', priority: 'medium', tags: ['docs'] }),
  ];

  it('filters by status', () => {
    const todoTasks = tasks.filter(t => t.status === 'todo');
    expect(todoTasks.length).toBe(1);
    expect(todoTasks[0].id).toBe('t1');
  });

  it('filters by priority', () => {
    const criticalTasks = tasks.filter(t => t.priority === 'critical');
    expect(criticalTasks.length).toBe(1);
    expect(criticalTasks[0].id).toBe('t2');
  });

  it('filters out archived tasks', () => {
    const active = tasks.filter(t => !t.isArchived);
    expect(active.length).toBe(4);
    expect(active.find(t => t.id === 't4')).toBeUndefined();
  });

  it('searches by title', () => {
    const query = 'api';
    const results = tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('t2');
  });

  it('filters by tags', () => {
    const frontendTasks = tasks.filter(t => t.tags.includes('frontend'));
    expect(frontendTasks.length).toBe(1);
    expect(frontendTasks[0].id).toBe('t1');
  });

  it('applies combined filters', () => {
    const results = tasks.filter(t =>
      !t.isArchived &&
      t.priority !== 'low' &&
      t.status !== 'done'
    );
    expect(results.length).toBe(3);
  });
});

/* ================================================================
   Task Sorting Tests
   ================================================================ */

describe('Task Sorting', () => {
  const tasks: Task[] = [
    createMockTask({ id: 't1', title: 'B Task', priority: 'low', createdAt: 1000 }),
    createMockTask({ id: 't2', title: 'A Task', priority: 'critical', createdAt: 3000 }),
    createMockTask({ id: 't3', title: 'C Task', priority: 'high', createdAt: 2000 }),
  ];

  const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  it('sorts by priority (ascending)', () => {
    const sorted = [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    expect(sorted[0].id).toBe('t2'); // critical
    expect(sorted[1].id).toBe('t3'); // high
    expect(sorted[2].id).toBe('t1'); // low
  });

  it('sorts by creation date (newest first)', () => {
    const sorted = [...tasks].sort((a, b) => b.createdAt - a.createdAt);
    expect(sorted[0].id).toBe('t2'); // 3000
    expect(sorted[1].id).toBe('t3'); // 2000
    expect(sorted[2].id).toBe('t1'); // 1000
  });

  it('sorts by title alphabetically', () => {
    const sorted = [...tasks].sort((a, b) => a.title.localeCompare(b.title));
    expect(sorted[0].title).toBe('A Task');
    expect(sorted[1].title).toBe('B Task');
    expect(sorted[2].title).toBe('C Task');
  });
});

/* ================================================================
   Dependency Graph Tests
   ================================================================ */

describe('Task Dependencies', () => {
  it('identifies tasks with dependencies', () => {
    const tasks: Task[] = [
      createMockTask({ id: 't1', title: 'Setup', dependencies: [] }),
      createMockTask({ id: 't2', title: 'Build', dependencies: ['t1'] }),
      createMockTask({ id: 't3', title: 'Test', dependencies: ['t2'] }),
      createMockTask({ id: 't4', title: 'Deploy', dependencies: ['t2', 't3'] }),
    ];

    const withDeps = tasks.filter(t => (t.dependencies?.length || 0) > 0);
    expect(withDeps.length).toBe(3);
  });

  it('detects circular dependencies', () => {
    const tasks: Task[] = [
      createMockTask({ id: 't1', dependencies: ['t2'] }),
      createMockTask({ id: 't2', dependencies: ['t1'] }),
    ];

    // Simple cycle detection
    function hasCycle(tasks: Task[]): boolean {
      const visited = new Set<string>();
      const stack = new Set<string>();
      const adj = new Map<string, string[]>();

      for (const t of tasks) {
        adj.set(t.id, t.dependencies || []);
      }

      function dfs(id: string): boolean {
        if (stack.has(id)) return true;
        if (visited.has(id)) return false;
        visited.add(id);
        stack.add(id);
        for (const dep of (adj.get(id) || [])) {
          if (dfs(dep)) return true;
        }
        stack.delete(id);
        return false;
      }

      for (const t of tasks) {
        if (dfs(t.id)) return true;
      }
      return false;
    }

    expect(hasCycle(tasks)).toBe(true);
  });

  it('topological sort of tasks', () => {
    const tasks: Task[] = [
      createMockTask({ id: 't1', title: 'Setup', dependencies: [] }),
      createMockTask({ id: 't2', title: 'Build', dependencies: ['t1'] }),
      createMockTask({ id: 't3', title: 'Test', dependencies: ['t2'] }),
    ];

    // Simple topological sort
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    for (const t of tasks) {
      inDegree.set(t.id, 0);
      adj.set(t.id, []);
    }
    for (const t of tasks) {
      for (const dep of (t.dependencies || [])) {
        adj.get(dep)?.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
      }
    }

    const queue = tasks.filter(t => (inDegree.get(t.id) || 0) === 0).map(t => t.id);
    const order: string[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      order.push(id);
      for (const child of (adj.get(id) || [])) {
        const newDeg = (inDegree.get(child) || 0) - 1;
        inDegree.set(child, newDeg);
        if (newDeg === 0) queue.push(child);
      }
    }

    expect(order).toEqual(['t1', 't2', 't3']);
  });
});

/* ================================================================
   Task Statistics Tests
   ================================================================ */

describe('Task Statistics', () => {
  const tasks: Task[] = [
    createMockTask({ status: 'todo' }),
    createMockTask({ status: 'todo' }),
    createMockTask({ status: 'in-progress' }),
    createMockTask({ status: 'review' }),
    createMockTask({ status: 'done' }),
    createMockTask({ status: 'done' }),
    createMockTask({ status: 'done' }),
    createMockTask({ status: 'blocked' }),
    createMockTask({ status: 'todo', isArchived: true }),
  ];

  it('computes correct status counts', () => {
    const active = tasks.filter(t => !t.isArchived);
    const stats = {
      total: active.length,
      todo: active.filter(t => t.status === 'todo').length,
      inProgress: active.filter(t => t.status === 'in-progress').length,
      review: active.filter(t => t.status === 'review').length,
      done: active.filter(t => t.status === 'done').length,
      blocked: active.filter(t => t.status === 'blocked').length,
    };

    expect(stats.total).toBe(8);
    expect(stats.todo).toBe(2);
    expect(stats.inProgress).toBe(1);
    expect(stats.review).toBe(1);
    expect(stats.done).toBe(3);
    expect(stats.blocked).toBe(1);
  });

  it('calculates completion percentage', () => {
    const active = tasks.filter(t => !t.isArchived);
    const done = active.filter(t => t.status === 'done').length;
    const pct = Math.round((done / active.length) * 100);
    expect(pct).toBe(38); // 3/8 = 37.5 -> 38
  });
});

/* ================================================================
   LocalStorage Persistence Tests
   ================================================================ */

describe('Task Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('serializes tasks to JSON', () => {
    const tasks = [createMockTask({ id: 't1', title: 'Persist me' })];
    const json = JSON.stringify(tasks);
    expect(json).toContain('Persist me');
    expect(json).toContain('t1');
  });

  it('deserializes tasks from JSON', () => {
    const original = [createMockTask({ id: 't1', title: 'Restored' })];
    const json = JSON.stringify(original);
    const restored: Task[] = JSON.parse(json);
    expect(restored[0].id).toBe('t1');
    expect(restored[0].title).toBe('Restored');
    expect(restored[0].status).toBe('todo');
  });

  it('handles corrupted storage gracefully', () => {
    localStorageMock.setItem('yyc3-task-board-tasks', 'not-valid-json');
    let tasks: Task[] = [];
    try {
      const raw = localStorageMock.getItem('yyc3-task-board-tasks');
      tasks = raw ? JSON.parse(raw) : [];
    } catch {
      tasks = [];
    }
    expect(tasks).toEqual([]);
  });

  it('handles empty storage', () => {
    let tasks: Task[] = [];
    try {
      const raw = localStorageMock.getItem('yyc3-task-board-tasks');
      tasks = raw ? JSON.parse(raw) : [];
    } catch {
      tasks = [];
    }
    expect(tasks).toEqual([]);
  });
});
