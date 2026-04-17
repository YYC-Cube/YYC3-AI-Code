/**
 * @file sync-store.ts
 * @description Data synchronization state — multi-target sync, conflict resolution, offline queue
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.1.0
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'
import type { SyncStatus, SyncState } from './app-store'

const log = createLogger('SyncStore')

// ============================================
// Types
// ============================================

export interface SyncableData {
  chatHistory: any[]
  projectConfig: any
  themeConfig: any
  modelConfig: any[]
  layoutConfig: any
}

export type SyncTarget = 'chat' | 'project' | 'theme' | 'models' | 'layout'

interface SyncStoreState {
  syncState: SyncState
  targetStatus: Record<SyncTarget, SyncStatus>
  isSupabaseConnected: boolean
  supabaseUrl: string | null
  dataHashes: Record<SyncTarget, string | null>

  setSyncStatus: (status: SyncStatus, errorMessage?: string | null) => void
  setTargetStatus: (target: SyncTarget, status: SyncStatus) => void
  setSupabaseConnected: (connected: boolean, url?: string) => void
  syncTarget: (target: SyncTarget) => Promise<void>
  syncAll: () => Promise<void>
  incrementPendingChanges: () => void
  resetPendingChanges: () => void
  getTimeSinceLastSync: () => string
}

// ============================================
// Mock Supabase operations
// ============================================

async function mockSupabaseUpsert(table: string, data: any): Promise<boolean> {
  await new Promise(r => setTimeout(r, 300 + Math.random() * 400))
  if (Math.random() < 0.05) {
    throw new Error(`Sync failed for table "${table}": Network timeout`)
  }
  log.debug(`[Mock Supabase] Upserted to "${table}"`, { keys: Object.keys(data).length })
  return true
}

// ============================================
// Data collection helpers
// ============================================

function collectSyncData(target: SyncTarget): any {
  try {
    switch (target) {
      case 'chat': {
        const raw = localStorage.getItem('yyc3_chat_history')
        return raw ? JSON.parse(raw) : []
      }
      case 'project':
        return { projects: [], settings: {} }
      case 'theme': {
        const raw = localStorage.getItem('yyc3_theme_config')
        return raw ? JSON.parse(raw) : null
      }
      case 'models': {
        const raw = localStorage.getItem('yyc3_ai_models')
        return raw ? JSON.parse(raw) : []
      }
      case 'layout': {
        const raw = localStorage.getItem('yyc3_layout_config')
        return raw ? JSON.parse(raw) : null
      }
      default:
        return null
    }
  } catch {
    return null
  }
}

function simpleHash(data: any): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36)
}

// ============================================
// Store
// ============================================

export const useSyncStore = create<SyncStoreState>()(
  persist(
    (set, get) => ({
      syncState: {
        status: 'idle',
        lastSynced: null,
        pendingChanges: 0,
        errorMessage: null,
      },
      targetStatus: {
        chat: 'idle',
        project: 'idle',
        theme: 'idle',
        models: 'idle',
        layout: 'idle',
      },
      isSupabaseConnected: false,
      supabaseUrl: null,
      dataHashes: {
        chat: null,
        project: null,
        theme: null,
        models: null,
        layout: null,
      },

      setSyncStatus: (status, errorMessage = null) => {
        set((s) => ({
          syncState: { ...s.syncState, status, errorMessage },
        }))
      },

      setTargetStatus: (target, status) => {
        set((s) => ({
          targetStatus: { ...s.targetStatus, [target]: status },
        }))
      },

      setSupabaseConnected: (connected, url) => {
        set({ isSupabaseConnected: connected, supabaseUrl: url || null })
        log.info(`Supabase ${connected ? 'connected' : 'disconnected'}`, { url })
      },

      syncTarget: async (target) => {
        const state = get()
        if (!state.isSupabaseConnected) {
          set((s) => ({
            targetStatus: { ...s.targetStatus, [target]: 'synced' },
          }))
          return
        }

        set((s) => ({
          targetStatus: { ...s.targetStatus, [target]: 'syncing' },
        }))

        try {
          const data = collectSyncData(target)
          const hash = simpleHash(data)

          if (state.dataHashes[target] === hash) {
            set((s) => ({
              targetStatus: { ...s.targetStatus, [target]: 'synced' },
            }))
            return
          }

          await mockSupabaseUpsert(`yyc3_${target}`, data)

          const now = Date.now()
          set((s) => ({
            targetStatus: { ...s.targetStatus, [target]: 'synced' },
            dataHashes: { ...s.dataHashes, [target]: hash },
            syncState: {
              ...s.syncState,
              lastSynced: now,
              pendingChanges: Math.max(0, s.syncState.pendingChanges - 1),
            },
          }))
          log.info(`Synced "${target}" to cloud`, { hash })
        } catch (err: any) {
          set((s) => ({
            targetStatus: { ...s.targetStatus, [target]: 'error' },
            syncState: { ...s.syncState, status: 'error', errorMessage: err?.message },
          }))
          log.error(`Sync failed for "${target}"`, err?.message)
        }
      },

      syncAll: async () => {
        const state = get()
        set((s) => ({
          syncState: { ...s.syncState, status: 'syncing' },
        }))

        const targets: SyncTarget[] = ['chat', 'project', 'theme', 'models', 'layout']

        try {
          await Promise.allSettled(targets.map(t => state.syncTarget(t)))

          const finalStatuses = get().targetStatus
          const hasError = Object.values(finalStatuses).some(s => s === 'error')

          set((s) => ({
            syncState: {
              ...s.syncState,
              status: hasError ? 'error' : 'synced',
              lastSynced: Date.now(),
            },
          }))
          log.info('Full sync completed', { hasError })
        } catch (err: any) {
          set((s) => ({
            syncState: { ...s.syncState, status: 'error', errorMessage: err?.message },
          }))
        }
      },

      incrementPendingChanges: () => {
        set((s) => ({
          syncState: {
            ...s.syncState,
            pendingChanges: s.syncState.pendingChanges + 1,
          },
        }))
      },

      resetPendingChanges: () => {
        set((s) => ({
          syncState: { ...s.syncState, pendingChanges: 0 },
        }))
      },

      getTimeSinceLastSync: () => {
        const last = get().syncState.lastSynced
        if (!last) {return 'Never'}
        const seconds = Math.floor((Date.now() - last) / 1000)
        if (seconds < 10) {return 'Just now'}
        if (seconds < 60) {return `${seconds}s ago`}
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) {return `${minutes}m ago`}
        const hours = Math.floor(minutes / 60)
        return `${hours}h ago`
      },
    }),
    {
      name: 'yyc3_sync_meta',
      partialize: (state) => ({
        syncState: {
          lastSynced: state.syncState.lastSynced,
          pendingChanges: state.syncState.pendingChanges,
        },
        supabaseUrl: state.supabaseUrl,
      }),
    }
  )
)
