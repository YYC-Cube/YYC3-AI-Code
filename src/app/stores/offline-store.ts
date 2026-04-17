/**
 * @file offline-store.ts
 * @description F-21 离线优先状态管理 — 在线/离线检测、缓存策略管理、同步队列、Service Worker 状态
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags offline, service-worker, cache, pwa, sync
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'

const log = createLogger('OfflineStore')

// ============================================
// Types
// ============================================

export type ConnectionStatus = 'online' | 'offline' | 'slow'
export type SWStatus = 'unsupported' | 'installing' | 'installed' | 'activated' | 'error'

export interface CacheStats {
  name: string
  entryCount: number
  estimatedSize: string
  lastUpdated: number
}

export interface SyncQueueItem {
  id: string
  type: 'file-save' | 'db-query' | 'settings-sync' | 'backup'
  payload: string
  createdAt: number
  retries: number
  maxRetries: number
  status: 'pending' | 'syncing' | 'completed' | 'failed'
}

export interface CacheStrategy {
  name: string
  pattern: string
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only'
  maxAge: number   // seconds
  maxEntries: number
  enabled: boolean
}

// ============================================
// Default Cache Strategies (Workbox-style)
// ============================================

const DEFAULT_CACHE_STRATEGIES: CacheStrategy[] = [
  { name: 'UI Assets', pattern: '/assets/**', strategy: 'cache-first', maxAge: 86400 * 30, maxEntries: 200, enabled: true },
  { name: 'Fonts', pattern: '/fonts/**', strategy: 'cache-first', maxAge: 86400 * 365, maxEntries: 30, enabled: true },
  { name: 'Images', pattern: '/images/**', strategy: 'cache-first', maxAge: 86400 * 7, maxEntries: 100, enabled: true },
  { name: 'API Responses', pattern: '/api/**', strategy: 'network-first', maxAge: 300, maxEntries: 50, enabled: true },
  { name: 'HTML Pages', pattern: '/**/*.html', strategy: 'stale-while-revalidate', maxAge: 3600, maxEntries: 20, enabled: true },
  { name: 'Workspace Data', pattern: 'indexeddb://workspace/**', strategy: 'cache-only', maxAge: 0, maxEntries: 0, enabled: true },
  { name: 'AI Provider APIs', pattern: 'https://api.openai.com/**', strategy: 'network-only', maxAge: 0, maxEntries: 0, enabled: true },
]

// ============================================
// Store
// ============================================

interface OfflineState {
  // Connection
  connectionStatus: ConnectionStatus
  lastOnline: number
  networkSpeed: number | null  // Mbps estimate

  // Service Worker
  swStatus: SWStatus
  swVersion: string | null
  swLastUpdate: number | null
  registerServiceWorker: () => Promise<void>
  updateServiceWorker: () => Promise<void>

  // Cache
  cacheStrategies: CacheStrategy[]
  cacheStats: CacheStats[]
  updateCacheStrategy: (name: string, updates: Partial<CacheStrategy>) => void
  resetCacheStrategies: () => void
  clearCache: (cacheName: string) => Promise<void>
  clearAllCaches: () => Promise<void>
  refreshCacheStats: () => Promise<void>

  // Sync Queue
  syncQueue: SyncQueueItem[]
  addToSyncQueue: (type: SyncQueueItem['type'], payload: string) => void
  processSyncQueue: () => Promise<void>
  clearSyncQueue: () => void
  retryFailedItems: () => void

  // Monitoring
  startMonitoring: () => void
  stopMonitoring: () => void
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => {
  let monitorInterval: ReturnType<typeof setInterval> | null = null

  return {
    // Connection
    connectionStatus: navigator.onLine ? 'online' : 'offline',
    lastOnline: navigator.onLine ? Date.now() : 0,
    networkSpeed: null,

    // Service Worker
    swStatus: 'serviceWorker' in navigator ? 'installed' : 'unsupported',
    swVersion: null,
    swLastUpdate: null,

    registerServiceWorker: async () => {
      if (!('serviceWorker' in navigator)) {
        set({ swStatus: 'unsupported' })
        log.warn('Service Worker not supported')
        return
      }
      try {
        set({ swStatus: 'installing' })
        log.info('Registering Service Worker...')

        // In production: navigator.serviceWorker.register('/sw.js')
        // Simulated for now
        await new Promise(r => setTimeout(r, 800))

        set({ swStatus: 'activated', swVersion: '1.0.0', swLastUpdate: Date.now() })
        log.info('Service Worker activated', { version: '1.0.0' })
      } catch (error) {
        set({ swStatus: 'error' })
        log.error('Service Worker registration failed', { error })
      }
    },

    updateServiceWorker: async () => {
      set({ swStatus: 'installing' })
      log.info('Updating Service Worker...')
      await new Promise(r => setTimeout(r, 1200))
      const newVersion = `1.0.${Math.floor(Math.random() * 10) + 1}`
      set({ swStatus: 'activated', swVersion: newVersion, swLastUpdate: Date.now() })
      log.info('Service Worker updated', { version: newVersion })
    },

    // Cache
    cacheStrategies: DEFAULT_CACHE_STRATEGIES,
    cacheStats: [
      { name: 'ui-assets-v1', entryCount: 142, estimatedSize: '3.2 MB', lastUpdated: Date.now() - 3600000 },
      { name: 'fonts-v1', entryCount: 12, estimatedSize: '1.8 MB', lastUpdated: Date.now() - 86400000 },
      { name: 'images-v1', entryCount: 38, estimatedSize: '8.5 MB', lastUpdated: Date.now() - 7200000 },
      { name: 'api-cache-v1', entryCount: 7, estimatedSize: '0.1 MB', lastUpdated: Date.now() - 600000 },
      { name: 'html-pages-v1', entryCount: 5, estimatedSize: '0.3 MB', lastUpdated: Date.now() - 1800000 },
    ],

    updateCacheStrategy: (name, updates) => {
      const strategies = get().cacheStrategies.map(s => s.name === name ? { ...s, ...updates } : s)
      set({ cacheStrategies: strategies })
      log.debug('Cache strategy updated', { name, updates })
    },

    resetCacheStrategies: () => {
      set({ cacheStrategies: DEFAULT_CACHE_STRATEGIES })
      log.info('Cache strategies reset to defaults')
    },

    clearCache: async (cacheName) => {
      log.info('Clearing cache', { cacheName })
      await new Promise(r => setTimeout(r, 500))
      set(s => ({
        cacheStats: s.cacheStats.map(c => c.name === cacheName ? { ...c, entryCount: 0, estimatedSize: '0 B', lastUpdated: Date.now() } : c),
      }))
    },

    clearAllCaches: async () => {
      log.info('Clearing all caches...')
      await new Promise(r => setTimeout(r, 1000))
      set(s => ({
        cacheStats: s.cacheStats.map(c => ({ ...c, entryCount: 0, estimatedSize: '0 B', lastUpdated: Date.now() })),
      }))
      log.info('All caches cleared')
    },

    refreshCacheStats: async () => {
      await new Promise(r => setTimeout(r, 300))
      // Simulated refresh
      set(s => ({
        cacheStats: s.cacheStats.map(c => ({
          ...c,
          entryCount: c.entryCount + Math.floor(Math.random() * 5),
          lastUpdated: Date.now(),
        })),
      }))
    },

    // Sync Queue
    syncQueue: [],

    addToSyncQueue: (type, payload) => {
      const item: SyncQueueItem = {
        id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        type, payload, createdAt: Date.now(),
        retries: 0, maxRetries: 3, status: 'pending',
      }
      set(s => ({ syncQueue: [...s.syncQueue, item] }))
      log.debug('Added to sync queue', { type, id: item.id })
      // Auto-process if online
      if (get().connectionStatus === 'online') {get().processSyncQueue()}
    },

    processSyncQueue: async () => {
      const pending = get().syncQueue.filter(i => i.status === 'pending' || (i.status === 'failed' && i.retries < i.maxRetries))
      if (pending.length === 0) {return}
      log.info('Processing sync queue', { count: pending.length })

      for (const item of pending) {
        set(s => ({ syncQueue: s.syncQueue.map(i => i.id === item.id ? { ...i, status: 'syncing' as const } : i) }))
        await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
        const success = Math.random() > 0.1
        set(s => ({
          syncQueue: s.syncQueue.map(i => i.id === item.id
            ? { ...i, status: success ? 'completed' as const : 'failed' as const, retries: i.retries + (success ? 0 : 1) }
            : i),
        }))
      }

      // Remove completed items after 10 seconds
      setTimeout(() => {
        set(s => ({ syncQueue: s.syncQueue.filter(i => i.status !== 'completed') }))
      }, 10000)
    },

    clearSyncQueue: () => set({ syncQueue: [] }),

    retryFailedItems: () => {
      set(s => ({
        syncQueue: s.syncQueue.map(i => i.status === 'failed' ? { ...i, status: 'pending' as const } : i),
      }))
      get().processSyncQueue()
    },

    // Monitoring
    startMonitoring: () => {
      if (monitorInterval) {return}
      log.info('Starting offline monitoring')

      const updateConnection = () => {
        const isOnline = navigator.onLine
        const prev = get().connectionStatus
        const next: ConnectionStatus = isOnline ? 'online' : 'offline'
        if (prev !== next) {
          set({ connectionStatus: next, ...(isOnline ? { lastOnline: Date.now() } : {}) })
          log.info(`Connection status changed: ${prev} → ${next}`)
          if (isOnline && get().syncQueue.some(i => i.status === 'pending')) {
            get().processSyncQueue()
          }
        }
      }

      window.addEventListener('online', updateConnection)
      window.addEventListener('offline', updateConnection)

      // Estimate network speed periodically
      monitorInterval = setInterval(() => {
        const conn = (navigator as any).connection
        if (conn) {
          set({ networkSpeed: conn.downlink || null })
          if (conn.downlink && conn.downlink < 1) {set({ connectionStatus: 'slow' })}
        }
      }, 10000)
    },

    stopMonitoring: () => {
      if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null }
      log.info('Offline monitoring stopped')
    },
  }
},
    {
      name: 'yyc3_offline_settings',
      partialize: (state) => ({ cacheStrategies: state.cacheStrategies }),
    }
  )
)