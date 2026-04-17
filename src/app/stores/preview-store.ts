/**
 * @file preview-store.ts
 * @description Preview engine state — mode, devices, history, console, errors, perf, scroll sync, fullscreen, parallel, snapshots
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-14
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview, state, zustand, device, history, console, scroll-sync, fullscreen, parallel, export, perf-history
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'

const log = createLogger('PreviewStore')

// ============================================
// Types
// ============================================

export type PreviewMode = 'realtime' | 'manual' | 'delayed' | 'smart'

export interface DevicePreset {
  id: string
  name: string
  nameKey?: string
  width: number
  height: number
  category: 'desktop' | 'tablet' | 'mobile' | 'custom'
  userAgent?: string
}

export interface PreviewHistoryEntry {
  id: string
  code: string
  language: string
  timestamp: number
  label?: string
}

export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug'

export interface ConsoleEntry {
  id: string
  level: ConsoleLevel
  message: string
  timestamp: number
  count: number
}

export interface PreviewError {
  message: string
  line?: number
  column?: number
  stack?: string
  timestamp: number
}

export interface PreviewPerf {
  compileTime: number | null
  renderTime: number | null
  totalTime: number | null
  lastUpdate: number | null
}

// ============================================
// Device Presets
// ============================================

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'desktop-1920', name: 'Desktop HD', nameKey: 'preview.deviceName.desktopHd', width: 1920, height: 1080, category: 'desktop' },
  { id: 'desktop-1440', name: 'Desktop', nameKey: 'preview.deviceName.desktop', width: 1440, height: 900, category: 'desktop' },
  { id: 'desktop-1280', name: 'Laptop', nameKey: 'preview.deviceName.laptop', width: 1280, height: 800, category: 'desktop' },
  { id: 'ipad-pro', name: 'iPad Pro 12.9"', width: 1024, height: 1366, category: 'tablet' },
  { id: 'ipad-air', name: 'iPad Air', width: 820, height: 1180, category: 'tablet' },
  { id: 'ipad-mini', name: 'iPad Mini', width: 768, height: 1024, category: 'tablet' },
  { id: 'surface-pro', name: 'Surface Pro', width: 912, height: 1368, category: 'tablet' },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', width: 393, height: 852, category: 'mobile' },
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667, category: 'mobile' },
  { id: 'pixel-7', name: 'Pixel 7', width: 412, height: 915, category: 'mobile' },
  { id: 'galaxy-s23', name: 'Galaxy S23', width: 360, height: 780, category: 'mobile' },
  { id: 'galaxy-fold', name: 'Galaxy Fold', width: 280, height: 653, category: 'mobile' },
]

// ============================================
// Constants
// ============================================

const MAX_HISTORY = 50
const MAX_CONSOLE = 200

// ============================================
// Store Interface
// ============================================

interface PreviewState {
  mode: PreviewMode
  setMode: (mode: PreviewMode) => void

  autoRefresh: boolean
  setAutoRefresh: (v: boolean) => void
  refreshInterval: number
  setRefreshInterval: (ms: number) => void
  previewDelay: number
  setPreviewDelay: (ms: number) => void

  activeDevice: DevicePreset
  setActiveDevice: (device: DevicePreset) => void
  customDevices: DevicePreset[]
  addCustomDevice: (device: Omit<DevicePreset, 'id' | 'category'>) => void
  removeCustomDevice: (id: string) => void
  orientation: 'portrait' | 'landscape'
  toggleOrientation: () => void

  zoom: number
  setZoom: (z: number) => void

  responsiveWidth: number | null
  setResponsiveWidth: (w: number | null) => void

  history: PreviewHistoryEntry[]
  historyIndex: number
  addHistory: (code: string, language: string, label?: string) => void
  goToHistory: (index: number) => void
  undoHistory: () => void
  redoHistory: () => void
  clearHistory: () => void
  saveSnapshot: (label: string) => void

  consoleEntries: ConsoleEntry[]
  addConsoleEntry: (level: ConsoleLevel, message: string) => void
  clearConsole: () => void
  consoleVisible: boolean
  toggleConsole: () => void
  setConsoleVisible: (v: boolean) => void

  previewError: PreviewError | null
  setPreviewError: (err: PreviewError | null) => void

  perf: PreviewPerf
  updatePerf: (updates: Partial<PreviewPerf>) => void

  refreshKey: number
  triggerRefresh: () => void

  inspectorEnabled: boolean
  toggleInspector: () => void

  gridOverlay: boolean
  toggleGridOverlay: () => void

  showMock: boolean
  setShowMock: (v: boolean) => void

  scrollSyncEnabled: boolean
  toggleScrollSync: () => void
  scrollPercent: number
  _scrollSource: 'editor' | 'preview' | null
  setScrollPercent: (pct: number, source: 'editor' | 'preview') => void

  isFullscreen: boolean
  setFullscreen: (v: boolean) => void
  toggleFullscreen: () => void

  parallelMode: boolean
  toggleParallelMode: () => void
  parallelDevices: DevicePreset[]
  setParallelDevices: (devices: DevicePreset[]) => void

  perfHistory: Array<{ compile: number; render: number; ts: number }>
  addPerfSample: (compile: number, render: number) => void
  clearPerfHistory: () => void

  _iframeTransitioning: boolean
  _setIframeTransitioning: (v: boolean) => void
}

// ============================================
// Store Implementation
// ============================================

export const usePreviewStore = create<PreviewState>()(
  persist(
    (set, get) => ({
      mode: 'realtime',
      setMode: (mode) => {
        log.info('Preview mode changed', { mode })
        set({ mode })
      },

      autoRefresh: false,
      setAutoRefresh: (v) => set({ autoRefresh: v }),
      refreshInterval: 5000,
      setRefreshInterval: (ms) => set({ refreshInterval: Math.max(1000, Math.min(60000, ms)) }),
      previewDelay: 300,
      setPreviewDelay: (ms) => set({ previewDelay: Math.max(100, Math.min(3000, ms)) }),

      activeDevice: DEVICE_PRESETS[1],
      setActiveDevice: (device) => set({ activeDevice: device }),
      customDevices: [],
      addCustomDevice: (device) => {
        const custom: DevicePreset = {
          ...device,
          id: `custom-${Date.now()}`,
          category: 'custom',
        }
        set((s) => ({ customDevices: [...s.customDevices, custom] }))
      },
      removeCustomDevice: (id) => {
        set((s) => ({ customDevices: s.customDevices.filter(d => d.id !== id) }))
      },
      orientation: 'portrait',
      toggleOrientation: () => {
        set((s) => ({ orientation: s.orientation === 'portrait' ? 'landscape' : 'portrait' }))
      },

      zoom: 100,
      setZoom: (z) => set({ zoom: Math.max(25, Math.min(200, z)) }),

      responsiveWidth: null,
      setResponsiveWidth: (w) => set({ responsiveWidth: w }),

      // History
      history: [],
      historyIndex: -1,

      addHistory: (code, language, label) => {
        const entry: PreviewHistoryEntry = {
          id: crypto.randomUUID(),
          code,
          language,
          timestamp: Date.now(),
          label,
        }
        set((s) => {
          const trimmed = s.history.slice(0, s.historyIndex + 1)
          const next = [...trimmed, entry].slice(-MAX_HISTORY)
          return { history: next, historyIndex: next.length - 1 }
        })
      },

      goToHistory: (index) => {
        const { history } = get()
        if (index >= 0 && index < history.length) {
          set({ historyIndex: index })
        }
      },

      undoHistory: () => {
        set((s) => ({ historyIndex: Math.max(0, s.historyIndex - 1) }))
      },

      redoHistory: () => {
        set((s) => ({ historyIndex: Math.min(s.history.length - 1, s.historyIndex + 1) }))
      },

      clearHistory: () => {
        set({ history: [], historyIndex: -1 })
      },

      saveSnapshot: (label) => {
        const { history, historyIndex } = get()
        if (historyIndex >= 0 && historyIndex < history.length) {
          const updated = [...history]
          updated[historyIndex] = { ...updated[historyIndex], label }
          set({ history: updated })
        }
      },

      // Console
      consoleEntries: [],
      addConsoleEntry: (level, message) => {
        set((s) => {
          const entries = [...s.consoleEntries]
          const last = entries[entries.length - 1]
          if (last && last.message === message && last.level === level) {
            entries[entries.length - 1] = { ...last, count: last.count + 1 }
            return { consoleEntries: entries }
          }
          const entry: ConsoleEntry = {
            id: crypto.randomUUID(),
            level,
            message,
            timestamp: Date.now(),
            count: 1,
          }
          const next = [...entries, entry].slice(-MAX_CONSOLE)
          return { consoleEntries: next }
        })
      },
      clearConsole: () => set({ consoleEntries: [] }),
      consoleVisible: false,
      toggleConsole: () => set((s) => ({ consoleVisible: !s.consoleVisible })),
      setConsoleVisible: (v) => set({ consoleVisible: v }),

      // Errors
      previewError: null,
      setPreviewError: (err) => set({ previewError: err }),

      // Performance
      perf: { compileTime: null, renderTime: null, totalTime: null, lastUpdate: null },
      updatePerf: (updates) => set((s) => ({ perf: { ...s.perf, ...updates } })),

      // Refresh
      refreshKey: 0,
      triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),

      // Inspector
      inspectorEnabled: false,
      toggleInspector: () => set((s) => ({ inspectorEnabled: !s.inspectorEnabled })),

      // Grid
      gridOverlay: false,
      toggleGridOverlay: () => set((s) => ({ gridOverlay: !s.gridOverlay })),

      // Mock
      showMock: false,
      setShowMock: (v) => set({ showMock: v }),

      // Scroll sync
      scrollSyncEnabled: false,
      toggleScrollSync: () => set((s) => ({ scrollSyncEnabled: !s.scrollSyncEnabled })),
      scrollPercent: 0,
      _scrollSource: null,
      setScrollPercent: (pct, source) => set({ scrollPercent: pct, _scrollSource: source }),

      // Fullscreen
      isFullscreen: false,
      setFullscreen: (v) => set({ isFullscreen: v }),
      toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),

      // Parallel preview
      parallelMode: false,
      toggleParallelMode: () => set((s) => ({ parallelMode: !s.parallelMode })),
      parallelDevices: [],
      setParallelDevices: (devices) => set({ parallelDevices: devices }),

      // Performance history
      perfHistory: [],
      addPerfSample: (compile, render) => {
        set((s) => ({
          perfHistory: [...s.perfHistory, { compile, render, ts: Date.now() }],
        }))
      },
      clearPerfHistory: () => set({ perfHistory: [] }),

      // HMR smoothing
      _iframeTransitioning: false,
      _setIframeTransitioning: (v) => set({ _iframeTransitioning: v }),
    }),
    {
      name: 'yyc3_preview_prefs',
      partialize: (state) => ({
        mode: state.mode,
        previewDelay: state.previewDelay,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        activeDeviceId: state.activeDevice.id,
        orientation: state.orientation,
        zoom: state.zoom,
        consoleVisible: state.consoleVisible,
        scrollSyncEnabled: state.scrollSyncEnabled,
        customDevices: state.customDevices,
        history: state.history,
      }),
      merge: (persisted: any, current) => {
        if (!persisted) {return current}
        const activeDevice = persisted.activeDeviceId
          ? (DEVICE_PRESETS.find(d => d.id === persisted.activeDeviceId) || DEVICE_PRESETS[1])
          : DEVICE_PRESETS[1]
        return {
          ...current,
          mode: persisted.mode || current.mode,
          previewDelay: persisted.previewDelay ?? current.previewDelay,
          autoRefresh: persisted.autoRefresh ?? current.autoRefresh,
          refreshInterval: persisted.refreshInterval ?? current.refreshInterval,
          activeDevice,
          orientation: persisted.orientation || current.orientation,
          zoom: persisted.zoom ?? current.zoom,
          consoleVisible: persisted.consoleVisible ?? current.consoleVisible,
          scrollSyncEnabled: persisted.scrollSyncEnabled ?? current.scrollSyncEnabled,
          customDevices: persisted.customDevices || [],
          history: persisted.history || [],
        }
      },
    }
  )
)
