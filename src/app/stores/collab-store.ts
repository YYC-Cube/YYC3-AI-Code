/**
 * @file collab-store.ts
 * @description Real-time collaboration state — users, cursors, edits, connection simulation
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'
import type { WSCollabStatus } from '../services/collab/collab-ws-service'
import { getCollabWSService, destroyCollabWSService } from '../services/collab/collab-ws-service'

const log = createLogger('CollabStore')

// ============================================
// Types
// ============================================

export interface CollabUser {
  id: string
  name: string
  avatar: string
  color: string
  isOnline: boolean
  lastSeen: number
  currentFile: string | null
  cursorLine: number | null
  cursorCol: number | null
  selection?: { startLine: number; endLine: number }
}

export interface CollabEdit {
  id: string
  userId: string
  userName: string
  filePath: string
  timestamp: number
  type: 'insert' | 'delete' | 'replace'
  lineStart: number
  lineEnd: number
  content?: string
}

export type CollabConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface CollabMessage {
  id: string
  userId: string
  userName: string
  type: 'join' | 'leave' | 'edit' | 'cursor' | 'chat'
  content: string
  timestamp: number
}

// ============================================
// Mock Users
// ============================================

const MOCK_USERS: CollabUser[] = [
  {
    id: 'user-self',
    name: '我',
    avatar: '',
    color: '#818cf8',
    isOnline: true,
    lastSeen: Date.now(),
    currentFile: 'src/app/App.tsx',
    cursorLine: 12,
    cursorCol: 24,
  },
  {
    id: 'user-alice',
    name: 'Alice Chen',
    avatar: '',
    color: '#34d399',
    isOnline: true,
    lastSeen: Date.now() - 5000,
    currentFile: 'src/app/components/HomePage.tsx',
    cursorLine: 45,
    cursorCol: 8,
    selection: { startLine: 42, endLine: 48 },
  },
  {
    id: 'user-bob',
    name: 'Bob Wang',
    avatar: '',
    color: '#fb923c',
    isOnline: true,
    lastSeen: Date.now() - 12000,
    currentFile: 'src/app/App.tsx',
    cursorLine: 6,
    cursorCol: 15,
  },
  {
    id: 'user-charlie',
    name: 'Charlie Li',
    avatar: '',
    color: '#f472b6',
    isOnline: false,
    lastSeen: Date.now() - 300000,
    currentFile: null,
    cursorLine: null,
    cursorCol: null,
  },
]

// ============================================
// Config
// ============================================

interface CollabConfig {
  autoConnect: boolean
  showCursors: boolean
  showEdits: boolean
  showPresence: boolean
  serverUrl: string
}

const DEFAULT_CONFIG: CollabConfig = {
  autoConnect: false,
  showCursors: true,
  showEdits: true,
  showPresence: true,
  serverUrl: 'ws://localhost:4444',
}

// Module-level
let _simulationIntervalId: ReturnType<typeof setInterval> | null = null

// ============================================
// Store
// ============================================

interface CollabStoreState {
  // State
  connectionStatus: CollabConnectionStatus
  users: CollabUser[]
  recentEdits: CollabEdit[]
  messages: CollabMessage[]
  config: CollabConfig
  simulationRunning: boolean
  useWebSocket: boolean

  // Actions
  connect: () => void
  disconnect: () => void
  connectWS: (url: string, roomId: string, userId: string, userName: string) => void
  disconnectWS: () => void
  broadcastCursor: (file: string, line: number, col: number) => void
  broadcastEdit: (filePath: string, type: string, lineStart: number, lineEnd: number, content?: string) => void
  broadcastSelection: (file: string, startLine: number, endLine: number) => void
  sendChat: (content: string) => void
  startSimulation: () => void
  stopSimulation: () => void
  updateUserCursor: (userId: string, file: string | null, line: number | null, col: number | null) => void
  addEdit: (edit: Omit<CollabEdit, 'id' | 'timestamp'>) => void
  addMessage: (msg: Omit<CollabMessage, 'id' | 'timestamp'>) => void
  updateConfig: (config: Partial<CollabConfig>) => void
  getOnlineUsers: () => CollabUser[]
  getUsersInFile: (filePath: string) => CollabUser[]
  getRecentEditsForFile: (filePath: string) => CollabEdit[]
}

export const useCollabStore = create<CollabStoreState>()(
  persist(
    (set, get) => ({
      connectionStatus: 'disconnected',
      users: MOCK_USERS,
      recentEdits: [],
      messages: [],
      config: DEFAULT_CONFIG,
      simulationRunning: false,
      useWebSocket: false,

      connectWS: (url, roomId, userId, userName) => {
        try {
          const ws = getCollabWSService({ url, roomId, userId, userName })
          ws.setListeners({
            onStatusChange: (status: WSCollabStatus) => {
              set({ connectionStatus: status })
            },
            onUserJoin: (uid, uname) => {
              set((s) => ({
                users: s.users.map(u =>
                  u.id === uid ? { ...u, isOnline: true, lastSeen: Date.now(), name: uname || u.name } : u
                ),
              }))
              get().addMessage({ userId: uid, userName: uname, type: 'join', content: `${uname} 加入了协作` })
            },
            onUserLeave: (uid) => {
              set((s) => ({
                users: s.users.map(u =>
                  u.id === uid ? { ...u, isOnline: false, lastSeen: Date.now() } : u
                ),
              }))
              const user = get().users.find(u => u.id === uid)
              get().addMessage({ userId: uid, userName: user?.name || uid, type: 'leave', content: `${user?.name || uid} 离开了协作` })
            },
            onRemoteEdit: (edit) => {
              get().addEdit({
                userId: edit.userId,
                userName: edit.userName || edit.userId,
                filePath: edit.filePath,
                type: edit.type || 'replace',
                lineStart: edit.lineStart,
                lineEnd: edit.lineEnd,
                content: edit.content,
              })
            },
            onRemoteCursor: (uid, file, line, col) => {
              get().updateUserCursor(uid, file, line, col)
            },
            onRemoteSelection: (uid, file, startLine, endLine) => {
              set((s) => ({
                users: s.users.map(u =>
                  u.id === uid ? { ...u, currentFile: file, selection: { startLine, endLine } } : u
                ),
              }))
            },
            onChatMessage: (uid, uname, content) => {
              get().addMessage({ userId: uid, userName: uname, type: 'chat', content })
            },
          })
          ws.connect()
          set({ useWebSocket: true })
          log.info('WebSocket collaboration enabled', { url, roomId })
        } catch (err) {
          log.error('Failed to connect WebSocket', err)
          set({ connectionStatus: 'error' })
        }
      },

      disconnectWS: () => {
        destroyCollabWSService()
        set({ useWebSocket: false, connectionStatus: 'disconnected' })
        log.info('WebSocket collaboration disabled')
      },

      broadcastCursor: (file, line, col) => {
        try {
          const ws = getCollabWSService()
          ws.broadcastCursor(file, line, col)
        } catch { /* WS not initialized */ }
      },

      broadcastEdit: (filePath, type, lineStart, lineEnd, content) => {
        try {
          const ws = getCollabWSService()
          ws.broadcastEdit({ filePath, type, lineStart, lineEnd, content })
        } catch { /* WS not initialized */ }
      },

      broadcastSelection: (file, startLine, endLine) => {
        try {
          const ws = getCollabWSService()
          ws.broadcastSelection(file, startLine, endLine)
        } catch { /* WS not initialized */ }
      },

      sendChat: (content) => {
        try {
          const ws = getCollabWSService()
          ws.sendChat(content)
        } catch { /* WS not initialized */ }
      },

      connect: () => {
        set({ connectionStatus: 'connecting' })
        log.info('Connecting to collaboration server...')

        // Simulate connection delay
        setTimeout(() => {
          set({ connectionStatus: 'connected' })
          log.info('Connected to collaboration server')

          // Add join messages for existing users
          const onlineUsers = get().users.filter(u => u.isOnline && u.id !== 'user-self')
          onlineUsers.forEach(user => {
            get().addMessage({
              userId: user.id,
              userName: user.name,
              type: 'join',
              content: `${user.name} 已在线`,
            })
          })

          // Start cursor simulation
          get().startSimulation()
        }, 1200)
      },

      disconnect: () => {
        get().stopSimulation()
        set({ connectionStatus: 'disconnected' })
        log.info('Disconnected from collaboration server')
        get().addMessage({
          userId: 'system',
          userName: '系统',
          type: 'leave',
          content: '已断开协作连接',
        })
      },

      startSimulation: () => {
        if (_simulationIntervalId) {clearInterval(_simulationIntervalId)}

        const files = [
          'src/app/App.tsx',
          'src/app/components/HomePage.tsx',
          'src/app/components/DesignerPage.tsx',
          'src/app/components/designer/TopNavBar.tsx',
          'src/app/components/designer/LeftPanel.tsx',
          'src/app/stores/app-store.ts',
        ]

        _simulationIntervalId = setInterval(() => {
          const state = get()
          if (state.connectionStatus !== 'connected') {return}

          // Randomly move cursors of other users
          const otherUsers = state.users.filter(u => u.id !== 'user-self' && u.isOnline)
          if (otherUsers.length === 0) {return}

          const user = otherUsers[Math.floor(Math.random() * otherUsers.length)]
          const action = Math.random()

          if (action < 0.5) {
            // Move cursor
            const line = (user.cursorLine || 1) + Math.floor(Math.random() * 5) - 2
            const col = Math.floor(Math.random() * 60) + 1
            get().updateUserCursor(user.id, user.currentFile, Math.max(1, line), col)
          } else if (action < 0.75) {
            // Switch file
            const newFile = files[Math.floor(Math.random() * files.length)]
            const line = Math.floor(Math.random() * 50) + 1
            get().updateUserCursor(user.id, newFile, line, 1)
          } else {
            // Simulate edit
            const editTypes: CollabEdit['type'][] = ['insert', 'delete', 'replace']
            get().addEdit({
              userId: user.id,
              userName: user.name,
              filePath: user.currentFile || files[0],
              type: editTypes[Math.floor(Math.random() * editTypes.length)],
              lineStart: user.cursorLine || 1,
              lineEnd: (user.cursorLine || 1) + Math.floor(Math.random() * 3),
              content: action < 0.9 ? 'const value = computed()' : undefined,
            })
          }
        }, 3000)

        set({ simulationRunning: true })
        log.debug('Collaboration simulation started')
      },

      stopSimulation: () => {
        if (_simulationIntervalId) {
          clearInterval(_simulationIntervalId)
          _simulationIntervalId = null
        }
        set({ simulationRunning: false })
        log.debug('Collaboration simulation stopped')
      },

      updateUserCursor: (userId, file, line, col) => {
        set((s) => ({
          users: s.users.map(u =>
            u.id === userId
              ? { ...u, currentFile: file, cursorLine: line, cursorCol: col, lastSeen: Date.now() }
              : u
          ),
        }))
      },

      addEdit: (edit) => {
        const newEdit: CollabEdit = {
          ...edit,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        }
        set((s) => ({
          recentEdits: [...s.recentEdits.slice(-49), newEdit],
        }))
      },

      addMessage: (msg) => {
        const newMsg: CollabMessage = {
          ...msg,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        }
        set((s) => ({
          messages: [...s.messages.slice(-99), newMsg],
        }))
      },

      updateConfig: (config) => {
        set((s) => {
          const updated = { ...s.config, ...config }
          log.info('Collab config updated', config)
          return { config: updated }
        })
      },

      getOnlineUsers: () => {
        return get().users.filter(u => u.isOnline)
      },

      getUsersInFile: (filePath) => {
        return get().users.filter(u => u.isOnline && u.currentFile === filePath && u.id !== 'user-self')
      },

      getRecentEditsForFile: (filePath) => {
        return get().recentEdits.filter(e => e.filePath === filePath).slice(-10)
      },
    }),
    {
      name: 'yyc3_collab_config',
      partialize: (state) => ({ config: state.config }),
    }
  )
)