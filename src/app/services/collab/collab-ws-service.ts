/**
 * @file collab-ws-service.ts
 * @description WebSocket real-time collaboration service — multi-tab sync, OT, presence
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { createLogger } from '../../utils/logger'

const log = createLogger('CollabWSService')

// ============================================
// Protocol Types
// ============================================

export type WSCollabMessageType =
  | 'join'
  | 'leave'
  | 'cursor'
  | 'edit'
  | 'selection'
  | 'file-open'
  | 'file-close'
  | 'chat'
  | 'sync-request'
  | 'sync-response'
  | 'presence'
  | 'ack'

export interface WSCollabMessage {
  type: WSCollabMessageType
  roomId: string
  userId: string
  payload: any
  timestamp: number
  id: string
}

export interface WSCollabConfig {
  url: string
  roomId: string
  userId: string
  userName: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

export type WSCollabStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface WSCollabEventListener {
  onMessage?: (msg: WSCollabMessage) => void
  onStatusChange?: (status: WSCollabStatus) => void
  onUserJoin?: (userId: string, userName: string) => void
  onUserLeave?: (userId: string) => void
  onRemoteEdit?: (edit: any) => void
  onRemoteCursor?: (userId: string, file: string, line: number, col: number) => void
  onRemoteSelection?: (userId: string, file: string, startLine: number, endLine: number) => void
  onChatMessage?: (userId: string, userName: string, content: string) => void
  onSyncResponse?: (data: any) => void
}

// ============================================
// WebSocket Collaboration Service
// ============================================

class CollabWSService {
  private ws: WebSocket | null = null
  private config: WSCollabConfig
  private listeners: WSCollabEventListener = {}
  private status: WSCollabStatus = 'disconnected'
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private messageQueue: WSCollabMessage[] = []
  private pendingAcks: Map<string, { resolve: (value: any) => void; timer: ReturnType<typeof setTimeout> }> = new Map()
  private msgCounter = 0

  constructor(config: WSCollabConfig) {
    this.config = {
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      ...config,
    }
  }

  setListeners(listeners: WSCollabEventListener): void {
    this.listeners = { ...this.listeners, ...listeners }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {return}

    this.setStatus('connecting')
    log.info('Connecting to collaboration server...', { url: this.config.url })

    try {
      this.ws = new WebSocket(this.config.url)
    } catch (err) {
      log.error('Failed to create WebSocket', err)
      this.setStatus('error')
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      log.info('WebSocket connected')
      this.setStatus('connected')
      this.reconnectAttempts = 0
      this.flushQueue()
      this.startHeartbeat()
      this.send({
        type: 'join',
        roomId: this.config.roomId,
        userId: this.config.userId,
        payload: { userName: this.config.userName },
      })
    }

    this.ws.onmessage = (event) => {
      try {
        const msg: WSCollabMessage = JSON.parse(event.data)
        this.handleMessage(msg)
      } catch (err) {
        log.warn('Failed to parse WS message', err)
      }
    }

    this.ws.onclose = (event) => {
      log.info('WebSocket closed', { code: event.code, reason: event.reason })
      this.stopHeartbeat()
      if (this.status !== 'disconnected') {
        this.setStatus('reconnecting')
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (event) => {
      log.error('WebSocket error', event)
      this.setStatus('error')
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    this.clearReconnect()

    if (this.ws) {
      this.send({
        type: 'leave',
        roomId: this.config.roomId,
        userId: this.config.userId,
        payload: {},
      })
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.setStatus('disconnected')
    this.messageQueue = []
    this.pendingAcks.forEach(({ timer }) => clearTimeout(timer))
    this.pendingAcks.clear()
  }

  send(msg: Omit<WSCollabMessage, 'id' | 'timestamp'>): string {
    const fullMsg: WSCollabMessage = {
      ...msg,
      id: this.nextId(),
      timestamp: Date.now(),
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(fullMsg))
    } else {
      this.messageQueue.push(fullMsg)
      log.debug('Message queued (WS not open)', { type: msg.type })
    }

    return fullMsg.id
  }

  sendWithAck(msg: Omit<WSCollabMessage, 'id' | 'timestamp'>, timeout = 5000): Promise<any> {
    const id = this.send(msg)
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingAcks.delete(id)
        reject(new Error(`Ack timeout for message ${id}`))
      }, timeout)
      this.pendingAcks.set(id, { resolve, timer })
    })
  }

  getStatus(): WSCollabStatus {
    return this.status
  }

  broadcastEdit(edit: { filePath: string; type: string; lineStart: number; lineEnd: number; content?: string }): void {
    this.send({
      type: 'edit',
      roomId: this.config.roomId,
      userId: this.config.userId,
      payload: edit,
    })
  }

  broadcastCursor(file: string, line: number, col: number): void {
    this.send({
      type: 'cursor',
      roomId: this.config.roomId,
      userId: this.config.userId,
      payload: { file, line, col },
    })
  }

  broadcastSelection(file: string, startLine: number, endLine: number): void {
    this.send({
      type: 'selection',
      roomId: this.config.roomId,
      userId: this.config.userId,
      payload: { file, startLine, endLine },
    })
  }

  broadcastFileOpen(filePath: string): void {
    this.send({
      type: 'file-open',
      roomId: this.config.roomId,
      userId: this.config.userId,
      payload: { filePath },
    })
  }

  broadcastFileClose(filePath: string): void {
    this.send({
      type: 'file-close',
      roomId: this.config.roomId,
      userId: this.config.userId,
      payload: { filePath },
    })
  }

  sendChat(content: string): void {
    this.send({
      type: 'chat',
      roomId: this.config.roomId,
      userId: this.config.userId,
      payload: { content, userName: this.config.userName },
    })
  }

  requestSync(): void {
    this.send({
      type: 'sync-request',
      roomId: this.config.roomId,
      userId: this.config.userId,
      payload: {},
    })
  }

  updateConfig(config: Partial<WSCollabConfig>): void {
    const wasConnected = this.status === 'connected'
    Object.assign(this.config, config)
    if (wasConnected && (config.url || config.roomId)) {
      this.disconnect()
      this.connect()
    }
  }

  destroy(): void {
    this.disconnect()
    this.listeners = {}
  }

  // ── Private ──

  private handleMessage(msg: WSCollabMessage): void {
    if (msg.type === 'ack') {
      const pending = this.pendingAcks.get(msg.id)
      if (pending) {
        clearTimeout(pending.timer)
        pending.resolve(msg.payload)
        this.pendingAcks.delete(msg.id)
      }
      return
    }

    this.listeners.onMessage?.(msg)

    switch (msg.type) {
      case 'join':
        this.listeners.onUserJoin?.(msg.userId, msg.payload?.userName || '')
        break
      case 'leave':
        this.listeners.onUserLeave?.(msg.userId)
        break
      case 'edit':
        if (msg.userId !== this.config.userId) {
          this.listeners.onRemoteEdit?.(msg.payload)
        }
        break
      case 'cursor':
        if (msg.userId !== this.config.userId) {
          this.listeners.onRemoteCursor?.(msg.userId, msg.payload.file, msg.payload.line, msg.payload.col)
        }
        break
      case 'selection':
        if (msg.userId !== this.config.userId) {
          this.listeners.onRemoteSelection?.(msg.userId, msg.payload.file, msg.payload.startLine, msg.payload.endLine)
        }
        break
      case 'chat':
        this.listeners.onChatMessage?.(msg.userId, msg.payload?.userName || msg.userId, msg.payload?.content || '')
        break
      case 'sync-response':
        this.listeners.onSyncResponse?.(msg.payload)
        break
    }
  }

  private setStatus(status: WSCollabStatus): void {
    if (this.status === status) {return}
    this.status = status
    this.listeners.onStatusChange?.(status)
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      log.warn('Max reconnect attempts reached')
      this.setStatus('error')
      return
    }

    this.clearReconnect()
    const delay = Math.min(
      (this.config.reconnectInterval || 3000) * Math.pow(1.5, this.reconnectAttempts),
      30000
    )

    log.info(`Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts + 1})`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
      }
    }, this.config.heartbeatInterval || 30000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const msg = this.messageQueue.shift()!
      this.ws.send(JSON.stringify(msg))
    }
  }

  private nextId(): string {
    return `${this.config.userId}-${++this.msgCounter}-${Date.now()}`
  }
}

// ============================================
// Singleton
// ============================================

let instance: CollabWSService | null = null

export function getCollabWSService(config?: WSCollabConfig): CollabWSService {
  if (!instance && !config) {
    throw new Error('CollabWSService requires config for first initialization')
  }
  if (!instance) {
    instance = new CollabWSService(config!)
  }
  return instance
}

export function destroyCollabWSService(): void {
  if (instance) {
    instance.destroy()
    instance = null
  }
}

export { CollabWSService }
