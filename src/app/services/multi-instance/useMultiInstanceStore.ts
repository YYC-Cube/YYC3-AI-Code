/**
 * @file useMultiInstanceStore.ts
 * @description YYC3 多实例状态管理 — useSyncExternalStore + localStorage 持久化 + BroadcastChannel 跨标签同步
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags multi-instance,store,workspace,session,ipc
 */

import { useSyncExternalStore, useEffect, useRef, useCallback } from 'react';
import { IPCManager } from './IPCManager';
import type {
  MultiInstanceState,
  AppInstance,
  Workspace,
  Session,
  WorkspaceType,
  WorkspaceConfig,
  SessionType,
  SessionData,
  WindowType,
  SharedClipboardItem,
} from '../../types/multi-instance';

/* ================================================================
   Storage Keys
   ================================================================ */

const STORAGE_KEY = 'yyc3-multi-instance';
const TAB_ID_KEY = 'yyc3-tab-id';

/* ================================================================
   Default State
   ================================================================ */

function defaultState(): MultiInstanceState {
  return {
    currentInstance: null,
    instances: [],
    workspaces: [],
    sessions: [],
    sharedClipboard: [],
    activeWorkspaceId: null,
    activeSessionId: null,
    ipcConnected: false,
  };
}

/* ================================================================
   Singleton Store
   ================================================================ */

let _state: MultiInstanceState = defaultState();
let _ipc: IPCManager | null = null;
const _listeners = new Set<() => void>();

function getTabId(): string {
  let id = sessionStorage.getItem(TAB_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(TAB_ID_KEY, id);
  }
  return id;
}

function loadFromStorage(): MultiInstanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MultiInstanceState>;
      return { ...defaultState(), ...parsed };
    }
  } catch { /* ignore */ }
  return defaultState();
}

function persist(): void {
  try {
    // Only persist workspaces, sessions, sharedClipboard (not ephemeral instance info)
    const { workspaces, sessions, sharedClipboard, activeWorkspaceId, activeSessionId } = _state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      workspaces,
      sessions,
      sharedClipboard: sharedClipboard.slice(-50), // cap at 50
      activeWorkspaceId,
      activeSessionId,
    }));
  } catch { /* quota exceeded */ }
}

function emit(): void {
  _listeners.forEach((l) => l());
}

function setState(updater: (prev: MultiInstanceState) => Partial<MultiInstanceState>): void {
  const patch = updater(_state);
  _state = { ..._state, ...patch };
  persist();
  emit();
}

/* ================================================================
   Actions
   ================================================================ */

function getIPC(): IPCManager {
  if (!_ipc) {
    _ipc = new IPCManager(getTabId());
  }
  return _ipc;
}

// ── Instance Actions ──

function registerCurrentInstance(route: string, windowType: WindowType = 'main'): AppInstance {
  const tabId = getTabId();
  const existing = _state.instances.find((i) => i.tabId === tabId);
  if (existing) {
    const updated = { ...existing, lastActiveAt: Date.now(), route };
    setState((s) => ({
      currentInstance: updated,
      instances: s.instances.map((i) => (i.tabId === tabId ? updated : i)),
    }));
    return updated;
  }

  const isMain = _state.instances.length === 0;
  const instance: AppInstance = {
    id: crypto.randomUUID(),
    type: isMain ? 'main' : 'secondary',
    windowId: `win-${tabId}`,
    windowType,
    title: `YYC³ - ${windowType}`,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    isMain,
    isVisible: true,
    isMinimized: false,
    position: { x: 0, y: 0 },
    size: { width: window.innerWidth, height: window.innerHeight },
    sessionIds: [],
    state: {},
    tabId,
    route,
  };

  setState((s) => ({
    currentInstance: instance,
    instances: [...s.instances, instance],
    ipcConnected: true,
  }));

  getIPC().broadcast('instance-created', instance);
  return instance;
}

function unregisterCurrentInstance(): void {
  const tabId = getTabId();
  const instance = _state.instances.find((i) => i.tabId === tabId);
  if (instance) {
    getIPC().broadcast('instance-closed', instance);
  }
  setState((s) => ({
    currentInstance: null,
    instances: s.instances.filter((i) => i.tabId !== tabId),
  }));
}

function pruneStaleInstances(): void {
  const now = Date.now();
  setState((s) => ({
    instances: s.instances.filter(
      (i) => i.tabId === getTabId() || now - i.lastActiveAt < IPCManager.STALE_THRESHOLD
    ),
  }));
}

// ── Workspace Actions ──

function createWorkspace(name: string, type: WorkspaceType, config: WorkspaceConfig = {}): Workspace {
  const ws: Workspace = {
    id: crypto.randomUUID(),
    name,
    type,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config,
    sessionIds: [],
    windowIds: [],
    isActive: false,
  };
  setState((s) => ({ workspaces: [...s.workspaces, ws] }));
  getIPC().broadcast('workspace-created', ws);
  return ws;
}

function updateWorkspace(id: string, updates: Partial<Workspace>): void {
  setState((s) => ({
    workspaces: s.workspaces.map((w) =>
      w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
    ),
  }));
  getIPC().broadcast('workspace-updated', { id, updates });
}

function deleteWorkspace(id: string): void {
  setState((s) => ({
    workspaces: s.workspaces.filter((w) => w.id !== id),
    sessions: s.sessions.filter((ss) => ss.workspaceId !== id),
    activeWorkspaceId: s.activeWorkspaceId === id ? null : s.activeWorkspaceId,
  }));
  getIPC().broadcast('workspace-closed', { id });
}

function activateWorkspace(id: string): void {
  setState((s) => ({
    activeWorkspaceId: id,
    workspaces: s.workspaces.map((w) => ({ ...w, isActive: w.id === id })),
  }));
}

function duplicateWorkspace(id: string): Workspace | null {
  const original = _state.workspaces.find((w) => w.id === id);
  if (!original) return null;
  return createWorkspace(`${original.name} (Copy)`, original.type, { ...original.config });
}

function exportWorkspace(id: string): string | null {
  const ws = _state.workspaces.find((w) => w.id === id);
  if (!ws) return null;
  const sessions = _state.sessions.filter((s) => s.workspaceId === id);
  return JSON.stringify({ workspace: ws, sessions }, null, 2);
}

function importWorkspace(jsonStr: string): Workspace | null {
  try {
    const { workspace, sessions = [] } = JSON.parse(jsonStr);
    const newId = crypto.randomUUID();
    const ws: Workspace = {
      ...workspace,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: false,
      sessionIds: [],
      windowIds: [],
    };
    const importedSessions: Session[] = sessions.map((s: Session) => ({
      ...s,
      id: crypto.randomUUID(),
      workspaceId: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'idle' as const,
    }));
    setState((prev) => ({
      workspaces: [...prev.workspaces, ws],
      sessions: [...prev.sessions, ...importedSessions],
    }));
    return ws;
  } catch {
    return null;
  }
}

// ── Session Actions ──

function createSession(
  name: string,
  type: SessionType,
  workspaceId: string,
  data: SessionData = {}
): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    name,
    type,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'active',
    data,
    workspaceId,
    windowId: `win-${getTabId()}`,
  };
  setState((s) => ({
    sessions: [...s.sessions, session],
    activeSessionId: session.id,
  }));
  getIPC().broadcast('session-created', session);
  return session;
}

function updateSession(id: string, updates: Partial<Session>): void {
  setState((s) => ({
    sessions: s.sessions.map((ss) =>
      ss.id === id ? { ...ss, ...updates, updatedAt: Date.now() } : ss
    ),
  }));
}

function deleteSession(id: string): void {
  setState((s) => ({
    sessions: s.sessions.filter((ss) => ss.id !== id),
    activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
  }));
  getIPC().broadcast('session-closed', { id });
}

function activateSession(id: string): void {
  setState((s) => ({
    activeSessionId: id,
    sessions: s.sessions.map((ss) =>
      ss.id === id ? { ...ss, status: 'active' as const } : ss
    ),
  }));
}

function suspendSession(id: string): void {
  updateSession(id, { status: 'suspended' });
}

function resumeSession(id: string): void {
  updateSession(id, { status: 'active' });
}

function updateSessionData(id: string, data: Partial<SessionData>): void {
  const existing = _state.sessions.find((s) => s.id === id);
  if (existing) {
    updateSession(id, { data: { ...existing.data, ...data } });
  }
}

// ── Shared Clipboard ──

function shareToClipboard(type: SharedClipboardItem['type'], content: string, metadata?: Record<string, unknown>): void {
  const item: SharedClipboardItem = {
    id: crypto.randomUUID(),
    type,
    content,
    metadata,
    sourceInstanceId: getTabId(),
    timestamp: Date.now(),
  };
  setState((s) => ({
    sharedClipboard: [...s.sharedClipboard.slice(-49), item],
  }));
  getIPC().broadcast('clipboard-share', item);
}

// ── Focus / Navigate ──

function requestFocusInstance(targetTabId: string): void {
  getIPC().sendTo(targetTabId, 'focus-request', {});
}

function requestNavigate(targetTabId: string, route: string): void {
  getIPC().sendTo(targetTabId, 'navigate-request', { route });
}

/* ================================================================
   IPC Listener Setup (call once per tab)
   ================================================================ */

let _ipcInitialized = false;

function initIPCListeners(): () => void {
  if (_ipcInitialized) return () => {};
  _ipcInitialized = true;

  const ipc = getIPC();
  const unsubs: Array<() => void> = [];

  unsubs.push(ipc.on('instance-created', (msg) => {
    const inst = msg.data as AppInstance;
    if (!_state.instances.find((i) => i.tabId === inst.tabId)) {
      setState((s) => ({ instances: [...s.instances, inst] }));
    }
  }));

  unsubs.push(ipc.on('instance-closed', (msg) => {
    const inst = msg.data as AppInstance;
    setState((s) => ({
      instances: s.instances.filter((i) => i.tabId !== inst.tabId),
    }));
  }));

  unsubs.push(ipc.on('instance-heartbeat', (msg) => {
    setState((s) => ({
      instances: s.instances.map((i) =>
        i.tabId === msg.senderId ? { ...i, lastActiveAt: Date.now() } : i
      ),
    }));
  }));

  unsubs.push(ipc.on('clipboard-share', (msg) => {
    const item = msg.data as SharedClipboardItem;
    setState((s) => ({
      sharedClipboard: [...s.sharedClipboard.slice(-49), item],
    }));
  }));

  unsubs.push(ipc.on('workspace-created', (msg) => {
    const ws = msg.data as Workspace;
    if (!_state.workspaces.find((w) => w.id === ws.id)) {
      setState((s) => ({ workspaces: [...s.workspaces, ws] }));
    }
  }));

  unsubs.push(ipc.on('workspace-updated', (msg) => {
    const { id, updates } = msg.data as { id: string; updates: Partial<Workspace> };
    setState((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
      ),
    }));
  }));

  unsubs.push(ipc.on('focus-request', () => {
    window.focus();
  }));

  // Prune stale every 10s
  const pruneTimer = setInterval(pruneStaleInstances, 10000);

  return () => {
    unsubs.forEach((u) => u());
    clearInterval(pruneTimer);
    _ipcInitialized = false;
  };
}

/* ================================================================
   useSyncExternalStore Hook
   ================================================================ */

function subscribe(callback: () => void): () => void {
  _listeners.add(callback);
  return () => { _listeners.delete(callback); };
}

function getSnapshot(): MultiInstanceState {
  return _state;
}

// Initialize from storage
_state = { ...loadFromStorage(), currentInstance: null, instances: [], ipcConnected: false };

/**
 * Primary hook for multi-instance management.
 * Registers current tab on mount, cleans up on unmount.
 */
export function useMultiInstanceStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Register this tab
    const route = window.location.pathname;
    registerCurrentInstance(route);

    // Setup IPC listeners
    cleanupRef.current = initIPCListeners();

    // Unregister on tab close
    const handleUnload = () => unregisterCurrentInstance();
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      unregisterCurrentInstance();
      cleanupRef.current?.();
    };
  }, []);

  return {
    // State
    ...state,

    // Instance actions
    registerCurrentInstance,
    unregisterCurrentInstance,

    // Workspace actions
    createWorkspace: useCallback(createWorkspace, []),
    updateWorkspace: useCallback(updateWorkspace, []),
    deleteWorkspace: useCallback(deleteWorkspace, []),
    activateWorkspace: useCallback(activateWorkspace, []),
    duplicateWorkspace: useCallback(duplicateWorkspace, []),
    exportWorkspace: useCallback(exportWorkspace, []),
    importWorkspace: useCallback(importWorkspace, []),

    // Session actions
    createSession: useCallback(createSession, []),
    updateSession: useCallback(updateSession, []),
    deleteSession: useCallback(deleteSession, []),
    activateSession: useCallback(activateSession, []),
    suspendSession: useCallback(suspendSession, []),
    resumeSession: useCallback(resumeSession, []),
    updateSessionData: useCallback(updateSessionData, []),

    // Shared clipboard
    shareToClipboard: useCallback(shareToClipboard, []),

    // Cross-instance navigation
    requestFocusInstance: useCallback(requestFocusInstance, []),
    requestNavigate: useCallback(requestNavigate, []),

    // Utilities
    getTabId,
    getIPC: useCallback(getIPC, []),
  };
}
