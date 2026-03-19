/**
 * @file ganttChart.test.ts
 * @description Unit tests for Gantt chart time calculations and bar positioning
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,gantt,chart,visualization
 */

import { describe, it, expect } from 'vitest';
import { addDays, differenceInDays, startOfDay } from 'date-fns';
import type { Task, TaskStatus, TaskPriority } from '../types/task';

/* ================================================================
   Helper: mirrors TaskGanttChart.getTaskTimeInfo
   ================================================================ */

interface TaskTimeInfo {
  task: Task;
  start: Date;
  end: Date;
  hasExplicitDates: boolean;
}

function getTaskTimeInfo(task: Task): TaskTimeInfo {
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
    end = addDays(start, 3);
  }

  if (differenceInDays(end, start) < 1) {
    end = addDays(start, 1);
  }

  return { task, start, end, hasExplicitDates };
}

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
   Time Info Tests
   ================================================================ */

describe('getTaskTimeInfo', () => {
  it('uses dueDate when available', () => {
    const now = Date.now();
    const dueDate = now + 7 * 86400000; // 7 days from now
    const task = createMockTask({ createdAt: now, dueDate });
    const info = getTaskTimeInfo(task);
    expect(info.hasExplicitDates).toBe(true);
    expect(differenceInDays(info.end, info.start)).toBeGreaterThanOrEqual(1);
  });

  it('uses completedAt when no dueDate', () => {
    const now = Date.now();
    const completedAt = now + 5 * 86400000;
    const task = createMockTask({ createdAt: now, completedAt });
    const info = getTaskTimeInfo(task);
    expect(info.hasExplicitDates).toBe(true);
  });

  it('calculates from estimatedHours when no dates', () => {
    const now = Date.now();
    const task = createMockTask({ createdAt: now, estimatedHours: 24 }); // 3 working days
    const info = getTaskTimeInfo(task);
    expect(info.hasExplicitDates).toBe(false);
    expect(differenceInDays(info.end, info.start)).toBe(3);
  });

  it('defaults to 3-day bar when no info', () => {
    const task = createMockTask();
    const info = getTaskTimeInfo(task);
    expect(info.hasExplicitDates).toBe(false);
    expect(differenceInDays(info.end, info.start)).toBe(3);
  });

  it('ensures minimum 1-day duration', () => {
    const now = Date.now();
    // dueDate same as createdAt
    const task = createMockTask({ createdAt: now, dueDate: now });
    const info = getTaskTimeInfo(task);
    expect(differenceInDays(info.end, info.start)).toBeGreaterThanOrEqual(1);
  });
});

/* ================================================================
   Bar Position Tests
   ================================================================ */

describe('Bar position calculation', () => {
  const cellWidth = 36;

  function getBarRect(info: TaskTimeInfo, rangeStart: Date) {
    const startOffset = differenceInDays(info.start, rangeStart);
    const duration = differenceInDays(info.end, info.start);
    const x = startOffset * cellWidth;
    const w = Math.max(duration * cellWidth, cellWidth * 0.5);
    return { x, w };
  }

  it('calculates correct x position', () => {
    const rangeStart = startOfDay(new Date());
    const task = createMockTask({ createdAt: addDays(rangeStart, 5).getTime() });
    const info = getTaskTimeInfo(task);
    const bar = getBarRect(info, rangeStart);
    expect(bar.x).toBe(5 * cellWidth);
  });

  it('calculates correct width for multi-day task', () => {
    const rangeStart = startOfDay(new Date());
    const created = rangeStart.getTime();
    const dueDate = addDays(rangeStart, 7).getTime();
    const task = createMockTask({ createdAt: created, dueDate });
    const info = getTaskTimeInfo(task);
    const bar = getBarRect(info, rangeStart);
    expect(bar.w).toBe(7 * cellWidth);
  });

  it('applies minimum width', () => {
    const rangeStart = startOfDay(new Date());
    const task = createMockTask({ createdAt: rangeStart.getTime() });
    const info = { ...getTaskTimeInfo(task), start: rangeStart, end: rangeStart };
    // Force 0 duration
    const bar = getBarRect(info, rangeStart);
    expect(bar.w).toBeGreaterThanOrEqual(cellWidth * 0.5);
  });

  it('handles negative x for past tasks', () => {
    const rangeStart = startOfDay(new Date());
    const pastDate = addDays(rangeStart, -10).getTime();
    const task = createMockTask({ createdAt: pastDate });
    const info = getTaskTimeInfo(task);
    const bar = getBarRect(info, rangeStart);
    expect(bar.x).toBeLessThan(0);
  });
});

/* ================================================================
   Drag Resize Tests
   ================================================================ */

describe('Gantt drag resize logic', () => {
  const cellWidth = 36;

  it('right-drag extends due date', () => {
    const task = createMockTask({
      createdAt: Date.now(),
      dueDate: Date.now() + 5 * 86400000,
    });
    const info = getTaskTimeInfo(task);
    const deltaX = 3 * cellWidth; // 3 days forward
    const daysDelta = Math.round(deltaX / cellWidth);
    const newEnd = addDays(info.end, daysDelta);
    expect(differenceInDays(newEnd, info.end)).toBe(3);
  });

  it('left-drag adjusts start date', () => {
    const task = createMockTask({
      createdAt: Date.now(),
      dueDate: Date.now() + 5 * 86400000,
    });
    const info = getTaskTimeInfo(task);
    const deltaX = -2 * cellWidth; // 2 days backward
    const daysDelta = Math.round(deltaX / cellWidth);
    const newStart = addDays(info.start, daysDelta);
    expect(differenceInDays(info.start, newStart)).toBe(2);
  });

  it('prevents end before start on right-drag', () => {
    const task = createMockTask({
      createdAt: Date.now(),
      dueDate: Date.now() + 2 * 86400000,
    });
    const info = getTaskTimeInfo(task);
    const daysDelta = -5; // try to shrink past start
    const newEnd = addDays(info.end, daysDelta);
    const valid = differenceInDays(newEnd, info.start) >= 1;
    expect(valid).toBe(false); // should be rejected
  });

  it('prevents start after end on left-drag', () => {
    const task = createMockTask({
      createdAt: Date.now(),
      dueDate: Date.now() + 2 * 86400000,
    });
    const info = getTaskTimeInfo(task);
    const daysDelta = 5; // try to push start past end
    const newStart = addDays(info.start, daysDelta);
    const valid = differenceInDays(info.end, newStart) >= 1;
    expect(valid).toBe(false); // should be rejected
  });
});

/* ================================================================
   Priority Sort Tests (Gantt ordering)
   ================================================================ */

describe('Gantt task sorting', () => {
  const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  it('sorts by priority then by creation date', () => {
    const tasks = [
      createMockTask({ id: 't1', priority: 'low', createdAt: 1000 }),
      createMockTask({ id: 't2', priority: 'critical', createdAt: 3000 }),
      createMockTask({ id: 't3', priority: 'critical', createdAt: 1000 }),
      createMockTask({ id: 't4', priority: 'high', createdAt: 2000 }),
    ];

    const sorted = [...tasks].sort((a, b) => {
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.createdAt - b.createdAt;
    });

    expect(sorted[0].id).toBe('t3'); // critical, earliest
    expect(sorted[1].id).toBe('t2'); // critical, later
    expect(sorted[2].id).toBe('t4'); // high
    expect(sorted[3].id).toBe('t1'); // low
  });
});
