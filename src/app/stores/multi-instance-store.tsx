/**
 * @file multi-instance-store.tsx
 * @description Multi-Instance Management Store — window management, workspace isolation,
 *   session management, IPC simulation via BroadcastChannel, resource sharing
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags multi-instance, workspace, window-management, session, ipc
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'

const log = createLogger('MultiInstance')

// ============================================
// Types
// ============================================

export type InstanceType = 'main' | 'secondary' | 'popup' | 'preview'
export type WindowType = 'main' | 'editor' | 'preview' | 'terminal' | 'ai-chat' | 'settings' | 'database' | 'task-board'
export type WorkspaceType = 'project' | 'ai-session' | 'debug' | 'custom'
export type SessionType = 'ai-chat' | 'code-edit' | 'debug' | 'preview' | 'terminal'
export type SessionStatus = 'active' | 'idle' | 'suspended' | 'closed'

export interface AppInstance {
  id: string
  type: InstanceType
  windowId: string
  windowType: WindowType
  title: string
  createdAt: number
  lastActiveAt: number
  isMain: boolean
  isVisible: boolean
  isMinimized: boolean
  isMaximized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  workspaceId?: string
  sessionIds: string[]
  memoryUsageMB: number
  cpuPercent: number
}

export interface Workspace {
  id: string
  name: string
  type: WorkspaceType
  icon: string
  createdAt: number
  updatedAt: number
  projectPath?: string
  color: string
  sessionIds: string[]
  windowIds: string[]
  isActive: boolean
  config: {
    theme?: string
    fontSize?: number
    aiProvider?: string
    aiModel?: string
  }
}

export interface Session {
  id: string
  type: SessionType
  name: string
  createdAt: number
  updatedAt: number
  status: SessionStatus
  workspaceId: string
  windowId: string
  messageCount?: number
  fileCount?: number
  lastContent?: string
}

export interface IPCMessage {
  id: string
  type: string
  senderId: string
  receiverId?: string
  data: any
  timestamp: number
}

// ============================================
// Window type config
// ============================================

const WINDOW_TYPE_CONFIG: Record<WindowType, { title: string; icon: string; defaultSize: { width: number; height: number } }> = {
  'main':       { title: 'YYC³ AI Code',    icon: '🏠', defaultSize: { width: 1400, height: 900 } },
  'editor':     { title: '代码编辑器',        icon: '📝', defaultSize: { width: 1200, height: 800 } },
  'preview':    { title: '实时预览',          icon: '👁', defaultSize: { width: 800, height: 600 } },
  'terminal':   { title: '终端',             icon: '⌨️', defaultSize: { width: 800, height: 500 } },
  'ai-chat':    { title: 'AI 助手',          icon: '🤖', defaultSize: { width: 600, height: 700 } },
  'settings':   { title: '设置',             icon: '⚙️', defaultSize: { width: 900, height: 600 } },
  'database':   { title: '数据库管理',        icon: '🗄️', defaultSize: { width: 1000, height: 700 } },
  'task-board': { title: '任务看板',          icon: '📋', defaultSize: { width: 1100, height: 750 } },
}

// ============================================
// Preset data
// ============================================

const INITIAL_INSTANCE: AppInstance = {
  id: 'inst-main',
  type: 'main',
  windowId: 'win-main',
  windowType: 'main',
  title: 'YYC³ AI Code — 主窗口',
  createdAt: Date.now() - 3600000,
  lastActiveAt: Date.now(),
  isMain: true,
  isVisible: true,
  isMinimized: false,
  isMaximized: false,
  position: { x: 100, y: 60 },
  size: { width: 1400, height: 900 },
  workspaceId: 'ws-default',
  sessionIds: ['sess-ai-1', 'sess-edit-1'],
  memoryUsageMB: 245,
  cpuPercent: 12,
}

const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-default',
    name: 'YYC³ AI Code',
    type: 'project',
    icon: '🚀',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
    projectPath: '~/Projects/yyc3-ai-code',
    color: '#34d399',
    sessionIds: ['sess-ai-1', 'sess-edit-1'],
    windowIds: ['win-main'],
    isActive: true,
    config: { theme: 'dark', fontSize: 14, aiProvider: 'zhipu', aiModel: 'glm-4' },
  },
  {
    id: 'ws-design',
    name: 'UI 设计稿',
    type: 'project',
    icon: '🎨',
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 7200000,
    projectPath: '~/Projects/yyc3-design',
    color: '#a78bfa',
    sessionIds: ['sess-preview-1'],
    windowIds: [],
    isActive: false,
    config: { theme: 'dark', fontSize: 13 },
  },
  {
    id: 'ws-debug',
    name: '调试会话',
    type: 'debug',
    icon: '🐛',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 3600000,
    color: '#fbbf24',
    sessionIds: [],
    windowIds: [],
    isActive: false,
    config: {},
  },
]

const INITIAL_SESSIONS: Session[] = [
  {
    id: 'sess-ai-1',
    type: 'ai-chat',
    name: 'AI 助手对话 #1',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 600000,
    status: 'active',
    workspaceId: 'ws-default',
    windowId: 'win-main',
    messageCount: 24,
    lastContent: '帮我分析 task-store 的循环依赖检测算法',
  },
  {
    id: 'sess-edit-1',
    type: 'code-edit',
    name: 'TaskBoardPanel.tsx',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 300000,
    status: 'active',
    workspaceId: 'ws-default',
    windowId: 'win-main',
    fileCount: 3,
    lastContent: 'src/app/components/designer/TaskBoardPanel.tsx',
  },
  {
    id: 'sess-preview-1',
    type: 'preview',
    name: '设计预览',
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 7200000,
    status: 'idle',
    workspaceId: 'ws-design',
    windowId: '',
  },
]

// ============================================
// Store
// ============================================

interface MultiInstanceState {
  instances: AppInstance[]
  activeInstanceId: string | null
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  sessions: Session[]
  activeSessionId: string | null
  ipcLog: IPCMessage[]
  totalMemoryMB: number
  maxMemoryMB: number
}

interface MultiInstanceActions {
  // Window management
  createInstance: (windowType: WindowType, workspaceId?: string) => AppInstance
  closeInstance: (instanceId: string) => void
  activateInstance: (instanceId: string) => void
  toggleMinimize: (instanceId: string) => void
  toggleMaximize: (instanceId: string) => void
  updateInstancePosition: (instanceId: string, pos: { x: number; y: number }) => void
  updateInstanceSize: (instanceId: string, size: { width: number; height: number }) => void

  // Workspace management
  createWorkspace: (name: string, type: WorkspaceType, color?: string) => Workspace
  deleteWorkspace: (workspaceId: string) => void
  activateWorkspace: (workspaceId: string) => void
  duplicateWorkspace: (workspaceId: string) => Workspace
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => void

  // Session management
  createSession: (type: SessionType, name: string, workspaceId: string) => Session
  deleteSession: (sessionId: string) => void
  activateSession: (sessionId: string) => void
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void
  suspendSession: (sessionId: string) => void
  resumeSession: (sessionId: string) => void

  // IPC simulation
  broadcastMessage: (type: string, data: any) => void
  sendToInstance: (instanceId: string, type: string, data: any) => void

  // Resource stats
  refreshResourceStats: () => void

  // Queries
  getInstancesByWorkspace: (workspaceId: string) => AppInstance[]
  getSessionsByWorkspace: (workspaceId: string) => Session[]
  getActiveWorkspace: () => Workspace | undefined
}

export const useMultiInstanceStore = create<MultiInstanceState & MultiInstanceActions>()(
  persist(
    (set, get) => ({
      instances: [INITIAL_INSTANCE],
      activeInstanceId: 'inst-main',
      workspaces: INITIAL_WORKSPACES,
      activeWorkspaceId: 'ws-default',
      sessions: INITIAL_SESSIONS,
      activeSessionId: 'sess-ai-1',
      ipcLog: [],
      totalMemoryMB: 245,
      maxMemoryMB: 2048,

      // ── Window management ──

      createInstance: (windowType, workspaceId) => {
        const id = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
        const windowId = `win-${id}`
        const config = WINDOW_TYPE_CONFIG[windowType]
        const count = get().instances.length

        const instance: AppInstance = {
          id,
          type: count === 0 ? 'main' : 'secondary',
          windowId,
          windowType,
          title: `${config.title} #${count + 1}`,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          isMain: count === 0,
          isVisible: true,
          isMinimized: false,
          isMaximized: false,
          position: { x: 120 + count * 40, y: 80 + count * 30 },
          size: { ...config.defaultSize },
          workspaceId,
          sessionIds: [],
          memoryUsageMB: Math.floor(60 + Math.random() * 120),
          cpuPercent: Math.floor(2 + Math.random() * 15),
        }

        set(s => ({
          instances: [...s.instances, instance],
          activeInstanceId: instance.id,
          totalMemoryMB: s.totalMemoryMB + instance.memoryUsageMB,
        }))

        // IPC broadcast
        get().broadcastMessage('instance-created', { instanceId: id, windowType })
        log.info('Instance created', { id, windowType })
        return instance
      },

      closeInstance: (instanceId) => {
        const inst = get().instances.find(i => i.id === instanceId)
        if (!inst) {return}
        // Don't close the last main instance
        if (inst.isMain && get().instances.length === 1) {return}

        set(s => ({
          instances: s.instances.filter(i => i.id !== instanceId),
          activeInstanceId: s.activeInstanceId === instanceId
            ? s.instances.find(i => i.id !== instanceId)?.id || null
            : s.activeInstanceId,
          totalMemoryMB: Math.max(0, s.totalMemoryMB - (inst?.memoryUsageMB || 0)),
        }))
        get().broadcastMessage('instance-closed', { instanceId })
      },

      activateInstance: (instanceId) => {
        set(s => ({
          activeInstanceId: instanceId,
          instances: s.instances.map(i =>
            i.id === instanceId ? { ...i, lastActiveAt: Date.now() } : i
          ),
        }))
      },

      toggleMinimize: (instanceId) => {
        set(s => ({
          instances: s.instances.map(i =>
            i.id === instanceId ? { ...i, isMinimized: !i.isMinimized } : i
          ),
        }))
      },

      toggleMaximize: (instanceId) => {
        set(s => ({
          instances: s.instances.map(i =>
            i.id === instanceId ? { ...i, isMaximized: !i.isMaximized } : i
          ),
        }))
      },

      updateInstancePosition: (instanceId, pos) => {
        set(s => ({
          instances: s.instances.map(i =>
            i.id === instanceId ? { ...i, position: pos } : i
          ),
        }))
      },

      updateInstanceSize: (instanceId, size) => {
        set(s => ({
          instances: s.instances.map(i =>
            i.id === instanceId ? { ...i, size } : i
          ),
        }))
      },

      // ── Workspace management ──

      createWorkspace: (name, type, color) => {
        const ws: Workspace = {
          id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name,
          type,
          icon: type === 'project' ? '📁' : type === 'ai-session' ? '🤖' : type === 'debug' ? '🐛' : '🔧',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          color: color || '#60a5fa',
          sessionIds: [],
          windowIds: [],
          isActive: false,
          config: {},
        }
        set(s => ({ workspaces: [...s.workspaces, ws] }))
        log.info('Workspace created', { id: ws.id, name })
        return ws
      },

      deleteWorkspace: (workspaceId) => {
        set(s => ({
          workspaces: s.workspaces.filter(w => w.id !== workspaceId),
          activeWorkspaceId: s.activeWorkspaceId === workspaceId ? null : s.activeWorkspaceId,
          sessions: s.sessions.filter(ss => ss.workspaceId !== workspaceId),
        }))
      },

      activateWorkspace: (workspaceId) => {
        set(s => ({
          activeWorkspaceId: workspaceId,
          workspaces: s.workspaces.map(w => ({ ...w, isActive: w.id === workspaceId })),
        }))
      },

      duplicateWorkspace: (workspaceId) => {
        const orig = get().workspaces.find(w => w.id === workspaceId)
        if (!orig) {throw new Error('Workspace not found')}
        const dup: Workspace = {
          ...orig,
          id: `ws-${Date.now()}`,
          name: `${orig.name} (副本)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          sessionIds: [],
          windowIds: [],
          isActive: false,
        }
        set(s => ({ workspaces: [...s.workspaces, dup] }))
        return dup
      },

      updateWorkspace: (workspaceId, updates) => {
        set(s => ({
          workspaces: s.workspaces.map(w =>
            w.id === workspaceId ? { ...w, ...updates, updatedAt: Date.now() } : w
          ),
        }))
      },

      // ── Session management ──

      createSession: (type, name, workspaceId) => {
        const sess: Session = {
          id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          type,
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: 'active',
          workspaceId,
          windowId: get().activeInstanceId || '',
        }
        set(s => ({
          sessions: [...s.sessions, sess],
          activeSessionId: sess.id,
        }))
        return sess
      },

      deleteSession: (sessionId) => {
        set(s => ({
          sessions: s.sessions.filter(ss => ss.id !== sessionId),
          activeSessionId: s.activeSessionId === sessionId ? null : s.activeSessionId,
        }))
      },

      activateSession: (sessionId) => {
        set({ activeSessionId: sessionId })
      },

      updateSessionStatus: (sessionId, status) => {
        set(s => ({
          sessions: s.sessions.map(ss =>
            ss.id === sessionId ? { ...ss, status, updatedAt: Date.now() } : ss
          ),
        }))
      },

      suspendSession: (sessionId) => get().updateSessionStatus(sessionId, 'suspended'),
      resumeSession: (sessionId) => get().updateSessionStatus(sessionId, 'active'),

      // ── IPC via BroadcastChannel ──

      broadcastMessage: (type, data) => {
        const msg: IPCMessage = {
          id: `ipc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          type,
          senderId: get().activeInstanceId || 'system',
          data,
          timestamp: Date.now(),
        }
        set(s => ({ ipcLog: [...s.ipcLog.slice(-49), msg] }))
        // Real BroadcastChannel cross-tab IPC
        try {
          const bc = new BroadcastChannel('yyc3-ipc')
          bc.postMessage(msg)
          bc.close()
        } catch (e) {
          log.warn('BroadcastChannel unavailable', e)
        }
      },

      sendToInstance: (instanceId, type, data) => {
        const msg: IPCMessage = {
          id: `ipc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          type,
          senderId: get().activeInstanceId || 'system',
          receiverId: instanceId,
          data,
          timestamp: Date.now(),
        }
        set(s => ({ ipcLog: [...s.ipcLog.slice(-49), msg] }))
        try {
          const bc = new BroadcastChannel('yyc3-ipc')
          bc.postMessage(msg)
          bc.close()
        } catch (e) {
          log.warn('BroadcastChannel unavailable', e)
        }
      },

      // ── Resource stats ──

      refreshResourceStats: () => {
        set(s => ({
          instances: s.instances.map(i => ({
            ...i,
            memoryUsageMB: Math.max(40, i.memoryUsageMB + Math.floor((Math.random() - 0.5) * 20)),
            cpuPercent: Math.max(1, Math.min(95, i.cpuPercent + Math.floor((Math.random() - 0.5) * 8))),
          })),
          totalMemoryMB: s.instances.reduce((sum, i) => sum + i.memoryUsageMB, 0),
        }))
      },

      // ── Queries ──

      getInstancesByWorkspace: (workspaceId) =>
        get().instances.filter(i => i.workspaceId === workspaceId),

      getSessionsByWorkspace: (workspaceId) =>
        get().sessions.filter(s => s.workspaceId === workspaceId),

      getActiveWorkspace: () =>
        get().workspaces.find(w => w.id === get().activeWorkspaceId),
    }),
    {
      name: 'yyc3_multi_instance',
      partialize: (s) => ({
        instances: s.instances,
        workspaces: s.workspaces,
        sessions: s.sessions,
        activeWorkspaceId: s.activeWorkspaceId,
        activeInstanceId: s.activeInstanceId,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
      }),
    }
  )
)

// ============================================
// BroadcastChannel listener — cross-tab IPC
// ============================================

if (typeof BroadcastChannel !== 'undefined') {
  try {
    const bc = new BroadcastChannel('yyc3-ipc')
    bc.onmessage = (event: MessageEvent<IPCMessage>) => {
      const msg = event.data
      if (!msg || !msg.id) {return}
      const state = useMultiInstanceStore.getState()
      // Skip own messages
      if (msg.senderId === state.activeInstanceId) {return}
      // If targeted to a specific instance, skip if not us
      if (msg.receiverId && msg.receiverId !== state.activeInstanceId) {return}
      // Log incoming message
      useMultiInstanceStore.setState(s => ({
        ipcLog: [...s.ipcLog.slice(-49), { ...msg, type: `[rx] ${msg.type}` }],
      }))
      log.info('IPC received', { type: msg.type, from: msg.senderId })
    }
  } catch (e) {
    log.warn('BroadcastChannel init failed', e)
  }
}
