/**
 * @file persistence-service.ts
 * @description YYC³ 分层持久化服务 — 内存 → LocalStorage → Remote 三层缓存策略
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Implements the spec's layered persistence strategy:
 *   Memory  (fast, volatile)
 *   → LocalStorage  (persistent across sessions)
 *   → Remote  (synced, placeholder for Tauri bridge / API)
 */

import { createLogger } from '../utils/logger'

const log = createLogger('PersistenceService')

/* ================================================================
   Cache Key System (mirrors Redis key design from spec)
   ================================================================ */

export const CacheKeys = {
  USER_SESSION: (userId: string) => `yyc3:user:${userId}:session`,
  USER_PREFERENCES: (userId: string) => `yyc3:user:${userId}:prefs`,
  PROJECT_DESIGN: (projectId: string) => `yyc3:project:${projectId}:design`,
  PROJECT_META: (projectId: string) => `yyc3:project:${projectId}:meta`,
  AI_RESPONSE: (sessionId: string) => `yyc3:ai:${sessionId}:response`,
  COLLAB_STATE: (projectId: string) => `yyc3:collab:${projectId}:state`,
  FILE_CONTENT: (path: string) => `yyc3:file:${encodeURIComponent(path)}`,
  FILE_VERSION: (path: string, versionId: string) => `yyc3:file:${encodeURIComponent(path)}:v:${versionId}`,
  COMPONENT: (componentId: string) => `yyc3:component:${componentId}`,
  SESSION: (sessionId: string) => `yyc3:session:${sessionId}`,
} as const

/** Cache TTL constants (seconds) */
export const CacheTTL = {
  /** 5 minutes — volatile session data, AI responses */
  SHORT: 300,
  /** 1 hour — project data, component data */
  MEDIUM: 3600,
  /** 24 hours — user data, preferences */
  LONG: 86400,
  /** 7 days — static assets, file versions */
  EXTENDED: 604800,
} as const

/* ================================================================
   Memory Layer
   ================================================================ */

interface MemoryEntry {
  value: unknown
  expiresAt: number | null // null = never expires
}

class MemoryLayer {
  private store = new Map<string, MemoryEntry>()

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) {return null}
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value as T
  }

  set(key: string, value: unknown, ttlSeconds?: number): void {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear(): void {
    this.store.clear()
  }

  /** Remove expired entries */
  gc(): number {
    const now = Date.now()
    let removed = 0
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.store.delete(key)
        removed++
      }
    }
    return removed
  }

  get size(): number {
    return this.store.size
  }
}

/* ================================================================
   LocalStorage Layer
   ================================================================ */

interface StorageEntry {
  value: unknown
  expiresAt: number | null
  storedAt: number
}

class LocalStorageLayer {
  private prefix = 'yyc3:'

  private fullKey(key: string): string {
    return key.startsWith(this.prefix) ? key : `${this.prefix}${key}`
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.fullKey(key))
      if (!raw) {return null}
      const entry: StorageEntry = JSON.parse(raw)
      if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
        this.delete(key)
        return null
      }
      return entry.value as T
    } catch {
      return null
    }
  }

  set(key: string, value: unknown, ttlSeconds?: number): void {
    try {
      const entry: StorageEntry = {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        storedAt: Date.now(),
      }
      localStorage.setItem(this.fullKey(key), JSON.stringify(entry))
    } catch (e) {
      log.warn('LocalStorage write failed (quota?)', { key, error: (e as Error).message })
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.fullKey(key))
    } catch {
      // ignore
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  /** Remove all yyc3: prefixed entries */
  clear(): void {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(this.prefix)) {keys.push(k)}
      }
      keys.forEach(k => localStorage.removeItem(k))
    } catch {
      // ignore
    }
  }

  /** Garbage-collect expired entries */
  gc(): number {
    let removed = 0
    try {
      const now = Date.now()
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (!k?.startsWith(this.prefix)) {continue}
        try {
          const raw = localStorage.getItem(k)
          if (!raw) {continue}
          const entry: StorageEntry = JSON.parse(raw)
          if (entry.expiresAt !== null && now > entry.expiresAt) {
            localStorage.removeItem(k)
            removed++
          }
        } catch {
          // skip malformed entries
        }
      }
    } catch {
      // ignore
    }
    return removed
  }
}

/* ================================================================
   Remote Layer (Placeholder — Tauri bridge or API)
   ================================================================ */

class RemoteLayer {
  async get<T>(key: string): Promise<T | null> {
    // In production: invoke Tauri bridge or fetch from API
    log.debug('Remote.get (stub)', { key })
    return null
  }

  async set(key: string, value: unknown): Promise<void> {
    // In production: invoke Tauri bridge or POST to API
    log.debug('Remote.set (stub)', { key })
  }

  async delete(key: string): Promise<void> {
    log.debug('Remote.delete (stub)', { key })
  }

  async sync(): Promise<{ synced: number; conflicts: number }> {
    // In production: reconcile local changes with server
    log.debug('Remote.sync (stub)')
    return { synced: 0, conflicts: 0 }
  }
}

/* ================================================================
   Unified Persistence Service
   ================================================================ */

export class PersistenceService {
  readonly memory = new MemoryLayer()
  readonly local = new LocalStorageLayer()
  readonly remote = new RemoteLayer()

  private gcIntervalId: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Run GC every 5 minutes
    this.gcIntervalId = setInterval(() => this.gc(), 5 * 60 * 1000)
  }

  /**
   * Read-through: Memory → LocalStorage → Remote
   * Writes back to higher layers on cache miss.
   */
  async get<T>(key: string, ttl?: number): Promise<T | null> {
    // 1. Memory
    const memVal = this.memory.get<T>(key)
    if (memVal !== null) {return memVal}

    // 2. LocalStorage
    const lsVal = this.local.get<T>(key)
    if (lsVal !== null) {
      this.memory.set(key, lsVal, ttl)
      return lsVal
    }

    // 3. Remote
    const remoteVal = await this.remote.get<T>(key)
    if (remoteVal !== null) {
      this.memory.set(key, remoteVal, ttl)
      this.local.set(key, remoteVal, ttl)
      return remoteVal
    }

    return null
  }

  /**
   * Write-through: writes to all layers.
   * Remote write is fire-and-forget by default.
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    this.memory.set(key, value, ttl)
    this.local.set(key, value, ttl)
    // Fire-and-forget remote write
    this.remote.set(key, value).catch(err => {
      log.warn('Remote write failed', { key, error: err })
    })
  }

  /** Delete from all layers */
  async delete(key: string): Promise<void> {
    this.memory.delete(key)
    this.local.delete(key)
    this.remote.delete(key).catch(() => {})
  }

  /** Garbage-collect expired entries */
  gc(): { memory: number; local: number } {
    const memRemoved = this.memory.gc()
    const lsRemoved = this.local.gc()
    if (memRemoved + lsRemoved > 0) {
      log.debug('GC complete', { memRemoved, lsRemoved })
    }
    return { memory: memRemoved, local: lsRemoved }
  }

  /** Clear all caches */
  clearAll(): void {
    this.memory.clear()
    this.local.clear()
    log.info('All caches cleared')
  }

  /** Trigger remote sync */
  async sync(): Promise<{ synced: number; conflicts: number }> {
    return this.remote.sync()
  }

  /** Clean up intervals on disposal */
  dispose(): void {
    if (this.gcIntervalId) {
      clearInterval(this.gcIntervalId)
      this.gcIntervalId = null
    }
  }
}

/* ================================================================
   Singleton
   ================================================================ */

export const persistence = new PersistenceService()
