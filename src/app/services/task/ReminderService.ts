/**
 * @file ReminderService.ts
 * @description 智能提醒服务 — 截止日期/依赖/阻塞/进度提醒，含浏览器通知和自定义事件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,task-board,reminder,notification
 */

import type { Reminder } from '../../types/task';
import { getTaskStoreState, taskStoreActions } from './useTaskStore';

/* ================================================================
   Custom Event for UI notification
   ================================================================ */

export const TASK_REMINDER_EVENT = 'yyc3:task-reminder';

export interface TaskReminderEventDetail {
  reminderId: string;
  taskId: string;
  taskTitle: string;
  message: string;
  type: Reminder['type'];
}

/* ================================================================
   ReminderService
   ================================================================ */

export class ReminderService {
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _disposed = false;

  /** 启动提醒检查（每 30s 一次） */
  start() {
    if (this._disposed) return;
    this.checkReminders();
    this._interval = setInterval(() => this.checkReminders(), 30_000);
  }

  /** 停止 */
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._disposed = true;
  }

  /** 检查并触发到期提醒 */
  private checkReminders() {
    const { reminders, tasks } = getTaskStoreState();
    const now = Date.now();

    for (const rem of reminders) {
      if (rem.isTriggered || rem.isRead) continue;
      if (rem.remindAt > now) continue;

      const task = tasks.find(t => t.id === rem.taskId);
      if (!task) continue;

      // 触发
      this.fireNotification(rem, task.title);
      taskStoreActions.markReminderRead(rem.id);
    }
  }

  /** 发送浏览器通知 + CustomEvent */
  private fireNotification(rem: Reminder, taskTitle: string) {
    const detail: TaskReminderEventDetail = {
      reminderId: rem.id,
      taskId: rem.taskId,
      taskTitle,
      message: rem.message,
      type: rem.type,
    };

    // CustomEvent — UI 组件可通过 addEventListener 捕获
    try {
      window.dispatchEvent(new CustomEvent(TASK_REMINDER_EVENT, { detail }));
    } catch { /* SSR guard */ }

    // Browser Notification API（需用户已授权）
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 ${taskTitle}`, {
          body: rem.message,
          tag: rem.id,
          silent: false,
        });
      } catch { /* ignore */ }
    }
  }

  /* ── 快捷创建提醒 ── */

  /** 截止日期提前 24h 提醒 */
  createDeadlineReminder(taskId: string, dueDate: number) {
    const remindAt = dueDate - 24 * 60 * 60 * 1000;
    if (remindAt < Date.now()) return; // 已过期
    taskStoreActions.addReminder({
      taskId,
      type: 'deadline',
      message: '任务即将在 24 小时后到期',
      remindAt,
    });
  }

  /** 依赖完成提醒 */
  createDependencyReminder(taskId: string, depTaskTitle: string) {
    taskStoreActions.addReminder({
      taskId,
      type: 'dependency',
      message: `依赖任务「${depTaskTitle}」已完成，可以开始此任务`,
      remindAt: Date.now(),
    });
  }

  /** 阻塞提醒 */
  createBlockingReminder(taskId: string, blockingTaskTitle: string) {
    taskStoreActions.addReminder({
      taskId,
      type: 'blocking',
      message: `当前任务被「${blockingTaskTitle}」阻塞`,
      remindAt: Date.now(),
    });
  }

  /** 请求浏览器通知权限 */
  static async requestPermission(): Promise<NotificationPermission> {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  }
}

/** 全局单例 */
export const reminderService = new ReminderService();
