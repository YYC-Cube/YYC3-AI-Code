/**
 * @file TaskCollabService.ts
 * @description 多人协同任务编辑服务 — 基于 yjs CRDT + y-indexeddb 离线持久化 + y-websocket 实时同步
 *              支持多用户并发编辑任务、实时光标感知、冲突自动合并
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,task-board,collaboration,crdt,yjs,websocket
 */

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import React from 'react';
import type { Task } from '../../types/task';
import { taskStoreActions, getTaskStoreState } from './useTaskStore';

/* ================================================================
   Types
   ================================================================ */

/** Collaboration user presence */
export interface CollabUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  /** The task ID this user is currently editing, or null */
  editingTaskId: string | null;
  /** Last active timestamp */
  lastActive: number;
}

/** Collab event types */
export type CollabEventType =
  | 'connected'
  | 'disconnected'
  | 'user-joined'
  | 'user-left'
  | 'user-updated'
  | 'task-updated-remote'
  | 'sync-status-changed';

export interface CollabEvent {
  type: CollabEventType;
  data?: any;
}

export type CollabSyncStatus = 'disconnected' | 'connecting' | 'synced' | 'offline-only';

/* ================================================================
   Predefined colors for users
   ================================================================ */

const USER_COLORS = [
  '#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

/* ================================================================
   Generate anonymous user identity
   ================================================================ */

function getOrCreateUserId(): { id: string; name: string; color: string } {
  const STORAGE_KEY = 'yyc3-collab-user';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }

  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const names = ['匿名开发者', '协作者', '编辑者', '访客', '队友'];
  const name = names[Math.floor(Math.random() * names.length)] + ` ${Math.floor(Math.random() * 100)}`;
  const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  const user = { id, name, color };

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch { /* ignore */ }
  return user;
}

/* ================================================================
   TaskCollabService
   ================================================================ */

export class TaskCollabService {
  private _doc: Y.Doc;
  private _tasksMap: Y.Map<any>;
  private _awarenessData: Y.Map<any>;
  private _indexeddbProvider: IndexeddbPersistence | null = null;
  private _wsProvider: any = null; // WebsocketProvider (lazy loaded)
  private _listeners = new Set<(event: CollabEvent) => void>();
  private _status: CollabSyncStatus = 'disconnected';
  private _localUser: CollabUser;
  private _disposed = false;
  private _syncFromRemoteInProgress = false;
  private _syncFromLocalInProgress = false;

  constructor() {
    this._doc = new Y.Doc();
    this._tasksMap = this._doc.getMap('tasks');
    this._awarenessData = this._doc.getMap('awareness');

    const userInfo = getOrCreateUserId();
    this._localUser = {
      ...userInfo,
      editingTaskId: null,
      lastActive: Date.now(),
    };
  }

  /* ── Getters ── */

  get status(): CollabSyncStatus { return this._status; }
  get localUser(): CollabUser { return { ...this._localUser }; }
  get doc(): Y.Doc { return this._doc; }

  /** Get all currently active remote users */
  getRemoteUsers(): CollabUser[] {
    const users: CollabUser[] = [];
    this._awarenessData.forEach((val, key) => {
      if (key !== this._localUser.id && val) {
        const user = val as CollabUser;
        // Only include users active within last 2 minutes
        if (Date.now() - user.lastActive < 120_000) {
          users.push(user);
        }
      }
    });
    return users;
  }

  /* ── Lifecycle ── */

  /**
   * Initialize: set up IndexedDB persistence and optionally WebSocket sync.
   * @param wsUrl - WebSocket server URL (e.g. 'ws://localhost:1234'). If omitted, offline-only mode.
   * @param roomName - Room/document name for multi-user sync.
   */
  async init(wsUrl?: string, roomName: string = 'yyc3-task-board') {
    if (this._disposed) return;

    // 1. IndexedDB persistence (always enabled for offline support)
    this._indexeddbProvider = new IndexeddbPersistence(roomName, this._doc);
    this._indexeddbProvider.on('synced', () => {
      this._syncRemoteToLocal();
    });

    // 2. Publish local user presence
    this._updatePresence();

    // 3. Listen for remote changes on the Y.Map
    this._tasksMap.observe(this._onRemoteTaskChange.bind(this));
    this._awarenessData.observe(this._onAwarenessChange.bind(this));

    // 4. Connect WebSocket if URL provided
    if (wsUrl) {
      await this._connectWebSocket(wsUrl, roomName);
    } else {
      this._setStatus('offline-only');
    }

    // 5. Initial sync: push local tasks into CRDT
    this._syncLocalToCRDT();

    // 6. Heartbeat for presence
    this._startHeartbeat();
  }

  /** Disconnect and clean up */
  dispose() {
    this._disposed = true;
    if (this._wsProvider) {
      try { this._wsProvider.destroy(); } catch { /* ignore */ }
      this._wsProvider = null;
    }
    if (this._indexeddbProvider) {
      try { this._indexeddbProvider.destroy(); } catch { /* ignore */ }
      this._indexeddbProvider = null;
    }
    // Remove local presence
    this._awarenessData.delete(this._localUser.id);
    this._doc.destroy();
    this._listeners.clear();
    this._setStatus('disconnected');
  }

  /* ── Public API ── */

  /** Subscribe to collab events */
  on(listener: (event: CollabEvent) => void) {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  /** Notify that the local user is editing a specific task */
  setEditingTask(taskId: string | null) {
    this._localUser.editingTaskId = taskId;
    this._updatePresence();
  }

  /** Push a local task update into the CRDT (call this after taskStoreActions.updateTask) */
  broadcastTaskUpdate(taskId: string, updates: Partial<Task>) {
    if (this._syncFromRemoteInProgress) return;
    this._syncFromLocalInProgress = true;
    try {
      this._doc.transact(() => {
        const existing = this._tasksMap.get(taskId);
        if (existing) {
          this._tasksMap.set(taskId, { ...existing, ...updates, updatedAt: Date.now() });
        }
      });
    } finally {
      this._syncFromLocalInProgress = false;
    }
  }

  /** Push a new task into the CRDT */
  broadcastTaskAdd(task: Task) {
    if (this._syncFromRemoteInProgress) return;
    this._syncFromLocalInProgress = true;
    try {
      this._doc.transact(() => {
        this._tasksMap.set(task.id, { ...task });
      });
    } finally {
      this._syncFromLocalInProgress = false;
    }
  }

  /** Remove a task from the CRDT */
  broadcastTaskDelete(taskId: string) {
    if (this._syncFromRemoteInProgress) return;
    this._syncFromLocalInProgress = true;
    try {
      this._doc.transact(() => {
        this._tasksMap.delete(taskId);
      });
    } finally {
      this._syncFromLocalInProgress = false;
    }
  }

  /** Force full sync: local → CRDT */
  syncLocalToCRDT() {
    this._syncLocalToCRDT();
  }

  /** Update local user display name */
  setUserName(name: string) {
    this._localUser.name = name;
    try {
      localStorage.setItem('yyc3-collab-user', JSON.stringify({
        id: this._localUser.id,
        name: this._localUser.name,
        color: this._localUser.color,
      }));
    } catch { /* ignore */ }
    this._updatePresence();
  }

  /* ── Internal ── */

  private async _connectWebSocket(wsUrl: string, roomName: string) {
    this._setStatus('connecting');
    try {
      // Dynamic import to avoid breaking if server not available
      const { WebsocketProvider } = await import('y-websocket');
      if (this._disposed) return;

      this._wsProvider = new WebsocketProvider(wsUrl, roomName, this._doc);

      this._wsProvider.on('status', (event: { status: string }) => {
        if (event.status === 'connected') {
          this._setStatus('synced');
          this._emit({ type: 'connected' });
        } else if (event.status === 'disconnected') {
          this._setStatus('offline-only');
          this._emit({ type: 'disconnected' });
        }
      });

      this._wsProvider.on('sync', (isSynced: boolean) => {
        if (isSynced) {
          this._syncRemoteToLocal();
        }
      });
    } catch (err) {
      console.warn('[TaskCollab] WebSocket connection failed, running in offline-only mode:', err);
      this._setStatus('offline-only');
    }
  }

  /** Sync all local tasks into the Y.Map */
  private _syncLocalToCRDT() {
    const { tasks } = getTaskStoreState();
    this._syncFromLocalInProgress = true;
    try {
      this._doc.transact(() => {
        for (const task of tasks) {
          const existing = this._tasksMap.get(task.id);
          // Only update if local is newer or doesn't exist in CRDT
          if (!existing || (existing.updatedAt || 0) < task.updatedAt) {
            this._tasksMap.set(task.id, { ...task });
          }
        }
      });
    } finally {
      this._syncFromLocalInProgress = false;
    }
  }

  /** Sync remote CRDT state into local store */
  private _syncRemoteToLocal() {
    if (this._syncFromLocalInProgress) return;
    this._syncFromRemoteInProgress = true;
    try {
      const { tasks: localTasks } = getTaskStoreState();
      const localMap = new Map(localTasks.map(t => [t.id, t]));

      this._tasksMap.forEach((val, key) => {
        const remote = val as Task;
        const local = localMap.get(key);

        if (!local) {
          // New task from remote — add locally
          taskStoreActions.addTask({
            ...remote,
            source: remote.source || 'imported',
          });
        } else if (remote.updatedAt > local.updatedAt) {
          // Remote is newer — update locally
          taskStoreActions.updateTask(key, remote);
        }
      });
    } finally {
      this._syncFromRemoteInProgress = false;
    }
  }

  /** Handle remote task map changes */
  private _onRemoteTaskChange(event: Y.YMapEvent<any>) {
    if (this._syncFromLocalInProgress) return;

    this._syncFromRemoteInProgress = true;
    try {
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const remote = this._tasksMap.get(key) as Task;
          if (remote) {
            const { tasks } = getTaskStoreState();
            const local = tasks.find(t => t.id === key);
            if (!local) {
              taskStoreActions.addTask({ ...remote, source: remote.source || 'imported' });
            } else if (remote.updatedAt > local.updatedAt) {
              taskStoreActions.updateTask(key, remote);
            }
            this._emit({ type: 'task-updated-remote', data: { taskId: key, action: change.action } });
          }
        } else if (change.action === 'delete') {
          taskStoreActions.deleteTask(key);
          this._emit({ type: 'task-updated-remote', data: { taskId: key, action: 'delete' } });
        }
      });
    } finally {
      this._syncFromRemoteInProgress = false;
    }
  }

  /** Handle awareness map changes */
  private _onAwarenessChange() {
    this._emit({ type: 'user-updated', data: this.getRemoteUsers() });
  }

  /** Update local user presence in awareness map */
  private _updatePresence() {
    this._localUser.lastActive = Date.now();
    this._doc.transact(() => {
      this._awarenessData.set(this._localUser.id, { ...this._localUser });
    });
  }

  /** Heartbeat: update presence every 30s */
  private _heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private _startHeartbeat() {
    this._heartbeatInterval = setInterval(() => {
      if (this._disposed) {
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
        return;
      }
      this._updatePresence();
      // Clean stale users
      this._awarenessData.forEach((val, key) => {
        if (key !== this._localUser.id && val) {
          const user = val as CollabUser;
          if (Date.now() - user.lastActive > 120_000) {
            this._awarenessData.delete(key);
          }
        }
      });
    }, 30_000);
  }

  private _setStatus(s: CollabSyncStatus) {
    if (this._status === s) return;
    this._status = s;
    this._emit({ type: 'sync-status-changed', data: s });
  }

  private _emit(event: CollabEvent) {
    for (const fn of this._listeners) {
      try { fn(event); } catch { /* ignore */ }
    }
  }
}

/* ================================================================
   Singleton & React Hook
   ================================================================ */

/** Global singleton instance */
export const taskCollabService = new TaskCollabService();

/**
 * React hook for collab state.
 * Call once at app level; returns reactive status, users, etc.
 */
export function useTaskCollab() {
  const [status, setStatus] = React.useState<CollabSyncStatus>(taskCollabService.status);
  const [remoteUsers, setRemoteUsers] = React.useState<CollabUser[]>([]);

  React.useEffect(() => {
    const unsub = taskCollabService.on((event) => {
      if (event.type === 'sync-status-changed') {
        setStatus(event.data);
      }
      if (event.type === 'user-updated' || event.type === 'user-joined' || event.type === 'user-left') {
        setRemoteUsers(taskCollabService.getRemoteUsers());
      }
      if (event.type === 'connected' || event.type === 'disconnected') {
        setStatus(taskCollabService.status);
        setRemoteUsers(taskCollabService.getRemoteUsers());
      }
    });

    // Initial
    setStatus(taskCollabService.status);
    setRemoteUsers(taskCollabService.getRemoteUsers());

    return unsub;
  }, []);

  return {
    status,
    remoteUsers,
    localUser: taskCollabService.localUser,
    service: taskCollabService,
  };
}