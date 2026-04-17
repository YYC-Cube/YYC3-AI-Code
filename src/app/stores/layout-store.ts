/**
 * @file layout-store.ts
 * @description Panel layout state — presets, panel visibility/collapse, persistence,
 * saved custom layouts (v2), tab reorder, undo stack
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.1.0
 * @created 2026-03-13
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags layout, panels, presets, persistence, drag, undo, saved-layouts
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'
import type { PanelId, PanelConfig, LayoutPreset, LayoutConfig } from './app-store'

const log = createLogger('LayoutStore')

// ============================================
// Defaults & Presets
// ============================================

const DEFAULT_PANELS: Record<PanelId, PanelConfig> = {
  left: { id: 'left', label: 'layout.panel.left', visible: true, collapsed: false, defaultSize: 25, minSize: 18, maxSize: 35 },
  center: { id: 'center', label: 'layout.panel.center', visible: true, collapsed: false, defaultSize: 45, minSize: 25, maxSize: 65 },
  right: { id: 'right', label: 'layout.panel.right', visible: true, collapsed: false, defaultSize: 30, minSize: 20, maxSize: 50 },
  preview: { id: 'preview', label: 'layout.panel.preview', visible: true, collapsed: false, defaultSize: 75, minSize: 30, maxSize: 85 },
}

export const LAYOUT_PRESETS: Record<LayoutPreset, { label: string; icon: string; description: string; panels: Partial<Record<PanelId, Partial<PanelConfig>>> }> = {
  'default': {
    label: 'layout.preset.default',
    icon: '\u229E',
    description: 'layout.preset.defaultDesc',
    panels: {
      left: { visible: true, collapsed: false, defaultSize: 25 },
      center: { visible: true, collapsed: false, defaultSize: 45 },
      right: { visible: true, collapsed: false, defaultSize: 30 },
    },
  },
  'focus-code': {
    label: 'layout.preset.focusCode',
    icon: '\u27E9',
    description: 'layout.preset.focusCodeDesc',
    panels: {
      left: { visible: true, collapsed: true, defaultSize: 5 },
      center: { visible: true, collapsed: false, defaultSize: 60 },
      right: { visible: true, collapsed: false, defaultSize: 35 },
    },
  },
  'focus-chat': {
    label: 'layout.preset.focusChat',
    icon: '\u27E8',
    description: 'layout.preset.focusChatDesc',
    panels: {
      left: { visible: true, collapsed: false, defaultSize: 40 },
      center: { visible: true, collapsed: false, defaultSize: 35 },
      right: { visible: true, collapsed: true, defaultSize: 5 },
    },
  },
  'minimal': {
    label: 'layout.preset.minimal',
    icon: '\u25FB',
    description: 'layout.preset.minimalDesc',
    panels: {
      left: { visible: false, collapsed: true, defaultSize: 0 },
      center: { visible: true, collapsed: false, defaultSize: 60 },
      right: { visible: true, collapsed: false, defaultSize: 40 },
    },
  },
  'wide-preview': {
    label: 'layout.preset.widePreview',
    icon: '\u229F',
    description: 'layout.preset.widePreviewDesc',
    panels: {
      left: { visible: true, collapsed: false, defaultSize: 30 },
      center: { visible: true, collapsed: false, defaultSize: 70 },
      right: { visible: false, collapsed: true, defaultSize: 0 },
    },
  },
  'custom': {
    label: 'layout.preset.custom',
    icon: '\u2699',
    description: 'layout.preset.customDesc',
    panels: {},
  },
}

// ============================================
// Saved Layout Types
// ============================================

export interface SavedLayout {
  id: string
  name: string
  config: LayoutConfig
  createdAt: number
  updatedAt: number
}

// ============================================
// Store
// ============================================

interface LayoutState {
  config: LayoutConfig
  panelDragActive: boolean
  savedLayouts: SavedLayout[]
  activeLayoutId: string | null
  undoStack: LayoutConfig[]
  redoStack: LayoutConfig[]

  applyPreset: (preset: LayoutPreset) => void
  togglePanelVisibility: (panelId: PanelId) => void
  togglePanelCollapse: (panelId: PanelId) => void
  setPanelSize: (panelId: PanelId, size: number) => void
  updatePanelConfig: (panelId: PanelId, updates: Partial<PanelConfig>) => void
  setPanelDragActive: (active: boolean) => void
  resetLayout: () => void
  getVisiblePanels: () => PanelConfig[]

  saveCurrentLayout: (name: string) => SavedLayout
  loadSavedLayout: (id: string) => void
  deleteSavedLayout: (id: string) => void
  renameSavedLayout: (id: string, name: string) => void
  overwriteSavedLayout: (id: string) => void

  pushUndoSnapshot: () => void
  undoLayout: () => void
  redoLayout: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      config: {
        preset: 'default',
        panels: { ...DEFAULT_PANELS },
        direction: 'horizontal',
      },
      panelDragActive: false,
      savedLayouts: [],
      activeLayoutId: null,
      undoStack: [],
      redoStack: [],

      applyPreset: (preset) => {
        const presetConfig = LAYOUT_PRESETS[preset]
        if (!presetConfig) {return}

        get().pushUndoSnapshot()

        const newPanels = { ...DEFAULT_PANELS }
        Object.entries(presetConfig.panels).forEach(([id, overrides]) => {
          if (overrides && newPanels[id as PanelId]) {
            newPanels[id as PanelId] = { ...newPanels[id as PanelId], ...overrides }
          }
        })

        const config: LayoutConfig = {
          preset,
          panels: newPanels,
          direction: 'horizontal',
        }

        log.info(`Layout preset applied: "${presetConfig.label}"`, { preset })
        set({ config, activeLayoutId: null })
      },

      togglePanelVisibility: (panelId) => {
        set((s) => {
          const panel = s.config.panels[panelId]
          if (!panel) {return s}

          const updated: LayoutConfig = {
            ...s.config,
            preset: 'custom',
            panels: {
              ...s.config.panels,
              [panelId]: { ...panel, visible: !panel.visible },
            },
          }
          log.debug(`Panel "${panelId}" visibility: ${!panel.visible}`)
          return { config: updated }
        })
      },

      togglePanelCollapse: (panelId) => {
        set((s) => {
          const panel = s.config.panels[panelId]
          if (!panel) {return s}

          const updated: LayoutConfig = {
            ...s.config,
            preset: 'custom',
            panels: {
              ...s.config.panels,
              [panelId]: { ...panel, collapsed: !panel.collapsed },
            },
          }
          log.debug(`Panel "${panelId}" collapsed: ${!panel.collapsed}`)
          return { config: updated }
        })
      },

      setPanelSize: (panelId, size) => {
        set((s) => {
          const panel = s.config.panels[panelId]
          if (!panel) {return s}

          const updated: LayoutConfig = {
            ...s.config,
            preset: 'custom',
            panels: {
              ...s.config.panels,
              [panelId]: { ...panel, defaultSize: size },
            },
          }
          return { config: updated }
        })
      },

      updatePanelConfig: (panelId, updates) => {
        set((s) => {
          const panel = s.config.panels[panelId]
          if (!panel) {return s}

          const updated: LayoutConfig = {
            ...s.config,
            preset: 'custom',
            panels: {
              ...s.config.panels,
              [panelId]: { ...panel, ...updates },
            },
          }
          return { config: updated }
        })
      },

      setPanelDragActive: (active) => set({ panelDragActive: active }),

      resetLayout: () => {
        get().pushUndoSnapshot()
        const config: LayoutConfig = {
          preset: 'default',
          panels: { ...DEFAULT_PANELS },
          direction: 'horizontal',
        }
        log.info('Layout reset to default')
        set({ config, activeLayoutId: null })
      },

      getVisiblePanels: () => {
        const panels = get().config.panels
        return Object.values(panels).filter(p => p.visible && !p.collapsed)
      },

      // ============================================
      // Saved Layouts v2
      // ============================================

      saveCurrentLayout: (name) => {
        const config = get().config
        const id = `layout_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        const saved: SavedLayout = {
          id,
          name,
          config: JSON.parse(JSON.stringify(config)),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        const updated = [...get().savedLayouts, saved]
        log.info(`Layout saved: "${name}"`, { id })
        set({ savedLayouts: updated, activeLayoutId: id })
        return saved
      },

      loadSavedLayout: (id) => {
        const layout = get().savedLayouts.find(l => l.id === id)
        if (!layout) {return}
        get().pushUndoSnapshot()
        const config = JSON.parse(JSON.stringify(layout.config))
        log.info(`Layout loaded: "${layout.name}"`, { id })
        set({ config, activeLayoutId: id })
      },

      deleteSavedLayout: (id) => {
        const updated = get().savedLayouts.filter(l => l.id !== id)
        const activeId = get().activeLayoutId === id ? null : get().activeLayoutId
        log.info(`Layout deleted`, { id })
        set({ savedLayouts: updated, activeLayoutId: activeId })
      },

      renameSavedLayout: (id, name) => {
        const updated = get().savedLayouts.map(l =>
          l.id === id ? { ...l, name, updatedAt: Date.now() } : l
        )
        set({ savedLayouts: updated })
      },

      overwriteSavedLayout: (id) => {
        const config = get().config
        const updated = get().savedLayouts.map(l =>
          l.id === id
            ? { ...l, config: JSON.parse(JSON.stringify(config)), updatedAt: Date.now() }
            : l
        )
        log.info(`Layout overwritten`, { id })
        set({ savedLayouts: updated })
      },

      // ============================================
      // Undo / Redo
      // ============================================

      pushUndoSnapshot: () => {
        const config = get().config
        set((s) => ({
          undoStack: [...s.undoStack.slice(-19), JSON.parse(JSON.stringify(config))],
          redoStack: [],
        }))
      },

      undoLayout: () => {
        const { undoStack, config } = get()
        if (undoStack.length === 0) {return}
        const prev = undoStack[undoStack.length - 1]
        log.debug('Layout undo')
        set({
          config: prev,
          undoStack: undoStack.slice(0, -1),
          redoStack: [...get().redoStack, JSON.parse(JSON.stringify(config))],
        })
      },

      redoLayout: () => {
        const { redoStack, config } = get()
        if (redoStack.length === 0) {return}
        const next = redoStack[redoStack.length - 1]
        log.debug('Layout redo')
        set({
          config: next,
          redoStack: redoStack.slice(0, -1),
          undoStack: [...get().undoStack, JSON.parse(JSON.stringify(config))],
        })
      },

      canUndo: () => get().undoStack.length > 0,
      canRedo: () => get().redoStack.length > 0,
    }),
    {
      name: 'yyc3_layout_config',
      partialize: (state) => ({
        config: state.config,
        savedLayouts: state.savedLayouts,
      }),
      merge: (persisted: any, current) => {
        const config = persisted?.config
          ? {
              preset: persisted.config.preset || 'default',
              panels: { ...DEFAULT_PANELS, ...persisted.config.panels },
              direction: persisted.config.direction || 'horizontal',
            }
          : current.config
        return {
          ...current,
          config,
          savedLayouts: persisted?.savedLayouts || [],
        }
      },
    }
  )
)
