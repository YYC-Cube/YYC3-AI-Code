/**
 * @file heartbeat-store.ts
 * @description AI model health monitoring — periodic ping, latency tracking, status detection
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { create } from 'zustand'
import { createLogger } from '../utils/logger'
import type { AIModel, ModelHeartbeat } from './app-store'
import { useAppStore } from './app-store'

const log = createLogger('HeartbeatStore')

// ============================================
// Heartbeat Configuration
// ============================================

const HEARTBEAT_INTERVAL = 30_000  // 30 seconds
const HEARTBEAT_TIMEOUT = 8_000    // 8 seconds per ping
const MAX_CONSECUTIVE_FAILURES = 3  // After this, mark as offline

// ============================================
// Types
// ============================================

interface HeartbeatState {
  heartbeats: Record<string, ModelHeartbeat>
  isRunning: boolean
  intervalId: ReturnType<typeof setInterval> | null

  // Actions
  startHeartbeat: () => void
  stopHeartbeat: () => void
  pingModel: (model: AIModel) => Promise<void>
  pingAllModels: () => Promise<void>
  getHeartbeat: (modelId: string) => ModelHeartbeat | null
  clearHeartbeat: (modelId: string) => void
  setHeartbeatInterval: (ms: number) => void
}

// ============================================
// Ping Logic
// ============================================

async function pingEndpoint(model: AIModel): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now()

  try {
    // Skip models without API keys (except local Ollama) — they can never succeed
    if (!model.apiKey && model.provider !== 'ollama') {
      return { ok: false, latency: 0 }
    }

    if (model.provider === 'ollama') {
      const baseUrl = model.endpoint.replace(/\/api\/chat\/?$/, '').replace(/\/+$/, '')
      const resp = await fetch(baseUrl + '/api/tags', {
        signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT),
      })
      const latency = Date.now() - start
      if (!resp.ok) {return { ok: false, latency }}

      const data = await resp.json()
      const modelName = model.name.split(':')[0]
      const found = (data.models || []).some((m: any) =>
        (m.name || m.model || '').includes(modelName)
      )
      return { ok: found, latency }
    }

    if (model.provider === 'zhipu' || model.provider === 'custom') {
      // With API key: try /models endpoint
      const baseUrl = model.endpoint.replace(/\/chat\/completions\/?$/, '').replace(/\/+$/, '')
      const resp = await fetch(baseUrl + '/models', {
        headers: { 'Authorization': `Bearer ${model.apiKey}` },
        signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT),
      })
      const latency = Date.now() - start
      return { ok: resp.ok, latency }
    }

    return { ok: false, latency: Date.now() - start }
  } catch {
    return { ok: false, latency: Date.now() - start }
  }
}

// ============================================
// Store
// ============================================

let heartbeatIntervalMs = HEARTBEAT_INTERVAL

export const useHeartbeatStore = create<HeartbeatState>((set, get) => ({
  heartbeats: {},
  isRunning: false,
  intervalId: null,

  startHeartbeat: () => {
    const state = get()
    if (state.isRunning) {return}

    log.info('Heartbeat monitor started', { interval: heartbeatIntervalMs + 'ms' })

    // Immediate first ping
    get().pingAllModels()

    const id = setInterval(() => {
      get().pingAllModels()
    }, heartbeatIntervalMs)

    set({ isRunning: true, intervalId: id })
  },

  stopHeartbeat: () => {
    const state = get()
    if (state.intervalId) {
      clearInterval(state.intervalId)
      log.info('Heartbeat monitor stopped')
    }
    set({ isRunning: false, intervalId: null })
  },

  pingModel: async (model: AIModel) => {
    const prev = get().heartbeats[model.id]

    // If already marked offline, don't keep pinging — avoid log spam
    if (prev?.status === 'offline' && prev.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      return
    }

    // Set checking status
    set((s) => ({
      heartbeats: {
        ...s.heartbeats,
        [model.id]: {
          modelId: model.id,
          status: 'checking',
          latency: prev?.latency ?? null,
          lastCheck: Date.now(),
          consecutiveFailures: prev?.consecutiveFailures ?? 0,
        },
      },
    }))

    const result = await pingEndpoint(model)

    set((s) => {
      const existing = s.heartbeats[model.id]
      const failures = result.ok ? 0 : (existing?.consecutiveFailures ?? 0) + 1

      const hb: ModelHeartbeat = {
        modelId: model.id,
        status: result.ok
          ? 'online'
          : failures >= MAX_CONSECUTIVE_FAILURES
          ? 'offline'
          : 'checking',
        latency: result.ok ? result.latency : null,
        lastCheck: Date.now(),
        consecutiveFailures: failures,
      }

      if (result.ok && existing?.status !== 'online') {
        log.info(`Model "${model.name}" is now online`, { latency: result.latency + 'ms' })
      }
      if (!result.ok && failures === MAX_CONSECUTIVE_FAILURES) {
        log.warn(`Model "${model.name}" is offline after ${failures} failures`)
      }

      return {
        heartbeats: {
          ...s.heartbeats,
          [model.id]: hb,
        },
      }
    })
  },

  pingAllModels: async () => {
    const models = useAppStore.getState().aiModels
    // Only ping models that have endpoints configured
    const toPing = models.filter(m => m.endpoint)

    if (toPing.length === 0) {return}

    log.debug('Heartbeat ping cycle', { models: toPing.length })

    // Ping all in parallel
    await Promise.allSettled(
      toPing.map(m => get().pingModel(m))
    )
  },

  getHeartbeat: (modelId) => {
    return get().heartbeats[modelId] || null
  },

  clearHeartbeat: (modelId) => {
    set((s) => {
      const next = { ...s.heartbeats }
      delete next[modelId]
      return { heartbeats: next }
    })
  },

  setHeartbeatInterval: (ms: number) => {
    heartbeatIntervalMs = ms
    const state = get()
    if (state.isRunning) {
      // Restart with new interval
      state.stopHeartbeat()
      state.startHeartbeat()
    }
    log.info('Heartbeat interval updated', { interval: ms + 'ms' })
  },
}))