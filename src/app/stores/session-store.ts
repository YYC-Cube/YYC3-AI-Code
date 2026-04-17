/**
 * @file session-store.ts
 * @description YYC³ AI 会话管理 — 多会话、消息历史、上下文管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Implements the spec's Session / Message data model:
 *   User (1) → (N) Session
 *   Session (1) → (N) SessionMessage
 */

import { create } from 'zustand'
import { createLogger } from '../utils/logger'
import { persistence, CacheKeys, CacheTTL } from '../services/persistence-service'
import type { Session, SessionMessage, SessionContext, MessageMetadata } from '../types/models'

const log = createLogger('SessionStore')

/* ================================================================
   Streaming Batch Buffer — rAF-based chunk coalescing
   ================================================================ */

const streamBuffers: Map<string, string> = new Map()
let rafId: number | null = null

function flushStreamBuffers() {
  rafId = null
  const state = useSessionStore.getState()
  const { sessions } = state

  const updated = { ...sessions }

  for (const [sessionId, pending] of streamBuffers) {
    const session = updated[sessionId]
    if (!session) { continue }

    const messages = [...session.messages]
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.role === 'assistant') {
      messages[messages.length - 1] = {
        ...lastMsg,
        content: lastMsg.content + pending,
      }
    } else {
      messages.push({
        id: generateId('msg'),
        role: 'assistant',
        content: pending,
        timestamp: new Date().toISOString(),
      })
    }

    updated[sessionId] = { ...session, messages, updatedAt: new Date().toISOString() }
  }

  streamBuffers.clear()
  useSessionStore.setState({ sessions: updated })
}

export { flushStreamBuffers }

function scheduleFlush() {
  if (rafId === null) {
    rafId = requestAnimationFrame(flushStreamBuffers)
  }
}

/* ================================================================
   Helpers
   ================================================================ */

function generateId(prefix = 'sess'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/* ================================================================
   Store
   ================================================================ */

interface SessionState {
  sessions: Record<string, Session>
  activeSessionId: string | null
  isStreaming: boolean
}

interface SessionActions {
  // ── Session CRUD ──
  createSession: (projectId: string, title?: string) => string
  closeSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  setActiveSession: (sessionId: string | null) => void
  renameSession: (sessionId: string, title: string) => void

  // ── Messages ──
  addMessage: (sessionId: string, role: SessionMessage['role'], content: string, metadata?: MessageMetadata) => string
  updateMessage: (sessionId: string, messageId: string, updates: Partial<SessionMessage>) => void
  deleteMessage: (sessionId: string, messageId: string) => void
  clearMessages: (sessionId: string) => void

  // ── Streaming ──
  startStreaming: () => void
  stopStreaming: () => void
  appendToLastAssistant: (sessionId: string, chunk: string) => void

  // ── Context ──
  updateContext: (sessionId: string, context: Partial<SessionContext>) => void

  // ── Queries ──
  getActiveSession: () => Session | null
  getSessionMessages: (sessionId: string) => SessionMessage[]
  getSessionsByProject: (projectId: string) => Session[]
  getAllSessions: () => Session[]

  // ── Persistence ──
  saveToStorage: () => Promise<void>
  loadFromStorage: (userId: string) => Promise<void>
}

export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  sessions: {},
  activeSessionId: null,
  isStreaming: false,

  // ── Session CRUD ──

  createSession: (projectId, title) => {
    const id = generateId()
    const now = new Date().toISOString()
    const session: Session = {
      id,
      userId: '',
      projectId,
      title: title || `会话 ${Object.keys(get().sessions).length + 1}`,
      messages: [],
      context: {
        aiModel: 'glm-4',
        aiProvider: 'zhipu',
        temperature: 0.7,
        maxTokens: 4096,
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }

    set(state => ({
      sessions: { ...state.sessions, [id]: session },
      activeSessionId: id,
    }))

    log.info('Session created', { id, projectId })
    return id
  },

  closeSession: (sessionId) => {
    const { sessions } = get()
    const session = sessions[sessionId]
    if (!session) {return}

    set(state => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { ...session, status: 'closed', updatedAt: new Date().toISOString() },
      },
      activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
    }))
  },

  deleteSession: (sessionId) => {
    set(state => {
      const { [sessionId]: _, ...rest } = state.sessions
      return {
        sessions: rest,
        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
      }
    })
    log.info('Session deleted', { sessionId })
  },

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  renameSession: (sessionId, title) => {
    const { sessions } = get()
    const session = sessions[sessionId]
    if (!session) {return}

    set({
      sessions: {
        ...sessions,
        [sessionId]: { ...session, title, updatedAt: new Date().toISOString() },
      },
    })
  },

  // ── Messages ──

  addMessage: (sessionId, role, content, metadata) => {
    const { sessions } = get()
    const session = sessions[sessionId]
    if (!session) {return ''}

    const msgId = generateId('msg')
    const message: SessionMessage = {
      id: msgId,
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    }

    set({
      sessions: {
        ...sessions,
        [sessionId]: {
          ...session,
          messages: [...session.messages, message],
          updatedAt: new Date().toISOString(),
        },
      },
    })

    return msgId
  },

  updateMessage: (sessionId, messageId, updates) => {
    const { sessions } = get()
    const session = sessions[sessionId]
    if (!session) {return}

    set({
      sessions: {
        ...sessions,
        [sessionId]: {
          ...session,
          messages: session.messages.map(m =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
          updatedAt: new Date().toISOString(),
        },
      },
    })
  },

  deleteMessage: (sessionId, messageId) => {
    const { sessions } = get()
    const session = sessions[sessionId]
    if (!session) {return}

    set({
      sessions: {
        ...sessions,
        [sessionId]: {
          ...session,
          messages: session.messages.filter(m => m.id !== messageId),
          updatedAt: new Date().toISOString(),
        },
      },
    })
  },

  clearMessages: (sessionId) => {
    const { sessions } = get()
    const session = sessions[sessionId]
    if (!session) {return}

    set({
      sessions: {
        ...sessions,
        [sessionId]: {
          ...session,
          messages: [],
          updatedAt: new Date().toISOString(),
        },
      },
    })
  },

  // ── Streaming ──

  startStreaming: () => set({ isStreaming: true }),
  stopStreaming: () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (streamBuffers.size > 0) {
      flushStreamBuffers()
    }
    set({ isStreaming: false })
  },

  appendToLastAssistant: (sessionId, chunk) => {
    const existing = streamBuffers.get(sessionId) || ''
    streamBuffers.set(sessionId, existing + chunk)
    scheduleFlush()
  },

  // ── Context ──

  updateContext: (sessionId, context) => {
    const { sessions } = get()
    const session = sessions[sessionId]
    if (!session) {return}

    set({
      sessions: {
        ...sessions,
        [sessionId]: {
          ...session,
          context: { ...session.context, ...context },
          updatedAt: new Date().toISOString(),
        },
      },
    })
  },

  // ── Queries ──

  getActiveSession: () => {
    const { sessions, activeSessionId } = get()
    return activeSessionId ? sessions[activeSessionId] || null : null
  },

  getSessionMessages: (sessionId) => {
    return get().sessions[sessionId]?.messages || []
  },

  getSessionsByProject: (projectId) => {
    return Object.values(get().sessions)
      .filter(s => s.projectId === projectId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  getAllSessions: () => {
    return Object.values(get().sessions)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  // ── Persistence ──

  saveToStorage: async () => {
    const { sessions, activeSessionId } = get()
    await persistence.set('yyc3:sessions:all', sessions, CacheTTL.LONG)
    await persistence.set('yyc3:sessions:active', activeSessionId, CacheTTL.LONG)
    log.debug('Sessions saved', { count: Object.keys(sessions).length })
  },

  loadFromStorage: async (userId) => {
    const sessions = await persistence.get<Record<string, Session>>('yyc3:sessions:all')
    const activeId = await persistence.get<string>('yyc3:sessions:active')
    if (sessions) {
      set({ sessions, activeSessionId: activeId || null })
      log.info('Sessions loaded from storage', { count: Object.keys(sessions).length })
    }
  },
}))
