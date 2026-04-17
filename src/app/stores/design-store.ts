/**
 * @file design-store.ts
 * @description YYC³ 设计组件状态管理 — 组件树 CRUD、选中状态、撤销/重做
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Manages the DesignJSON component tree, selection, and history for
 * the visual designer canvas. Follows the spec's ER model:
 *   Project (1) → (N) DesignComponent
 *   DesignComponent → parent/children tree
 */

import { create } from 'zustand'
import { createLogger } from '../utils/logger'
import type {
  DesignComponent,
  DesignComponentType,
  ComponentStyles,
  ComponentPosition,
  DesignJSON,
  DesignLayoutConfig,
  DesignStyleConfig,
  DesignAsset,
} from '../types/models'

const log = createLogger('DesignStore')

/* ================================================================
   History Snapshot (undo/redo)
   ================================================================ */

interface HistorySnapshot {
  components: Record<string, DesignComponent>
  timestamp: number
}

const MAX_HISTORY = 50

/* ================================================================
   Store State
   ================================================================ */

interface DesignState {
  /** All components indexed by ID */
  components: Record<string, DesignComponent>
  /** Currently selected component IDs */
  selectedIds: string[]
  /** Hovered component ID */
  hoveredId: string | null
  /** Clipboard (cut/copy) */
  clipboard: DesignComponent[] | null
  /** Canvas zoom level (0.1 – 4.0) */
  zoom: number
  /** Canvas pan offset */
  panOffset: { x: number; y: number }
  /** Active project ID */
  projectId: string | null
  /** Layout config */
  layout: DesignLayoutConfig
  /** Style config */
  styleConfig: DesignStyleConfig
  /** Assets */
  assets: DesignAsset[]
  /** Undo history */
  history: HistorySnapshot[]
  /** Redo stack */
  redoStack: HistorySnapshot[]
  /** Dirty flag */
  isDirty: boolean
}

interface DesignActions {
  // ── Project lifecycle ──
  loadDesign: (projectId: string, design: DesignJSON) => void
  getDesignJSON: () => DesignJSON
  clearDesign: () => void

  // ── Component CRUD ──
  addComponent: (type: DesignComponentType, name: string, position: ComponentPosition, parentId?: string) => string
  updateComponent: (id: string, updates: Partial<DesignComponent>) => void
  updateStyles: (id: string, styles: Partial<ComponentStyles>) => void
  updatePosition: (id: string, position: Partial<ComponentPosition>) => void
  removeComponent: (id: string) => void
  duplicateComponent: (id: string) => string | null
  reorderComponent: (id: string, newOrder: number) => void

  // ── Selection ──
  select: (id: string, multi?: boolean) => void
  deselect: (id: string) => void
  clearSelection: () => void
  selectAll: () => void
  setHovered: (id: string | null) => void

  // ── Clipboard ──
  copySelected: () => void
  cutSelected: () => void
  paste: (parentId?: string) => void

  // ── Canvas ──
  setZoom: (zoom: number) => void
  setPanOffset: (offset: { x: number; y: number }) => void
  resetView: () => void

  // ── History ──
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // ── Queries ──
  getComponent: (id: string) => DesignComponent | undefined
  getChildren: (parentId: string) => DesignComponent[]
  getRootComponents: () => DesignComponent[]
  getSelectedComponents: () => DesignComponent[]
  getComponentTree: () => TreeNode[]
}

export interface TreeNode {
  component: DesignComponent
  children: TreeNode[]
}

/* ================================================================
   Helpers
   ================================================================ */

function generateId(): string {
  return `comp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function snapshot(components: Record<string, DesignComponent>): HistorySnapshot {
  return {
    components: JSON.parse(JSON.stringify(components)),
    timestamp: Date.now(),
  }
}

/* ================================================================
   Default Values
   ================================================================ */

const defaultLayout: DesignLayoutConfig = {
  type: 'flex',
  direction: 'column',
  gap: 8,
  padding: 16,
}

const defaultStyleConfig: DesignStyleConfig = {
  theme: 'dark',
  primaryColor: '#8b5cf6',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 8,
}

/* ================================================================
   Store
   ================================================================ */

export const useDesignStore = create<DesignState & DesignActions>((set, get) => ({
  components: {},
  selectedIds: [],
  hoveredId: null,
  clipboard: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  projectId: null,
  layout: defaultLayout,
  styleConfig: defaultStyleConfig,
  assets: [],
  history: [],
  redoStack: [],
  isDirty: false,

  // ── Project lifecycle ──

  loadDesign: (projectId, design) => {
    const componentMap: Record<string, DesignComponent> = {}
    design.components.forEach(c => { componentMap[c.id] = c })
    set({
      projectId,
      components: componentMap,
      layout: design.layout || defaultLayout,
      styleConfig: design.styles || defaultStyleConfig,
      assets: design.assets || [],
      selectedIds: [],
      hoveredId: null,
      history: [],
      redoStack: [],
      isDirty: false,
    })
    log.info('Design loaded', { projectId, componentCount: design.components.length })
  },

  getDesignJSON: () => {
    const { components, layout, styleConfig, assets } = get()
    return {
      layout,
      components: Object.values(components).sort((a, b) => a.order - b.order),
      styles: styleConfig,
      assets,
    }
  },

  clearDesign: () => {
    set({
      components: {},
      selectedIds: [],
      hoveredId: null,
      projectId: null,
      history: [],
      redoStack: [],
      isDirty: false,
    })
  },

  // ── Component CRUD ──

  addComponent: (type, name, position, parentId) => {
    const id = generateId()
    const now = new Date().toISOString()
    const { components, projectId } = get()

    // Push undo snapshot
    const hist = [...get().history, snapshot(components)]
    if (hist.length > MAX_HISTORY) {hist.shift()}

    const siblings = Object.values(components).filter(c => c.parentId === parentId)
    const order = siblings.length

    const comp: DesignComponent = {
      id,
      projectId: projectId || '',
      type,
      name,
      props: {},
      styles: {},
      position,
      parentId,
      order,
      createdAt: now,
      updatedAt: now,
    }

    set({
      components: { ...components, [id]: comp },
      history: hist,
      redoStack: [],
      isDirty: true,
    })

    log.debug('Component added', { id, type, name })
    return id
  },

  updateComponent: (id, updates) => {
    const { components } = get()
    const existing = components[id]
    if (!existing) {return}

    const hist = [...get().history, snapshot(components)]
    if (hist.length > MAX_HISTORY) {hist.shift()}

    set({
      components: {
        ...components,
        [id]: { ...existing, ...updates, updatedAt: new Date().toISOString() },
      },
      history: hist,
      redoStack: [],
      isDirty: true,
    })
  },

  updateStyles: (id, styles) => {
    const { components } = get()
    const existing = components[id]
    if (!existing) {return}

    set({
      components: {
        ...components,
        [id]: {
          ...existing,
          styles: { ...existing.styles, ...styles },
          updatedAt: new Date().toISOString(),
        },
      },
      isDirty: true,
    })
  },

  updatePosition: (id, position) => {
    const { components } = get()
    const existing = components[id]
    if (!existing) {return}

    set({
      components: {
        ...components,
        [id]: {
          ...existing,
          position: { ...existing.position, ...position },
          updatedAt: new Date().toISOString(),
        },
      },
      isDirty: true,
    })
  },

  removeComponent: (id) => {
    const { components } = get()
    if (!components[id]) {return}

    const hist = [...get().history, snapshot(components)]
    if (hist.length > MAX_HISTORY) {hist.shift()}

    // Remove component and all descendants
    const toRemove = new Set<string>()
    const collectDescendants = (cid: string) => {
      toRemove.add(cid)
      Object.values(components).forEach(c => {
        if (c.parentId === cid) {collectDescendants(c.id)}
      })
    }
    collectDescendants(id)

    const newComponents = { ...components }
    toRemove.forEach(cid => delete newComponents[cid])

    set({
      components: newComponents,
      selectedIds: get().selectedIds.filter(sid => !toRemove.has(sid)),
      history: hist,
      redoStack: [],
      isDirty: true,
    })
    log.debug('Component removed', { id, descendants: toRemove.size - 1 })
  },

  duplicateComponent: (id) => {
    const { components } = get()
    const original = components[id]
    if (!original) {return null}

    const newId = generateId()
    const now = new Date().toISOString()
    const dup: DesignComponent = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: `${original.name} (copy)`,
      position: {
        ...original.position,
        x: original.position.x + 20,
        y: original.position.y + 20,
      },
      order: original.order + 1,
      createdAt: now,
      updatedAt: now,
    }

    set({
      components: { ...components, [newId]: dup },
      selectedIds: [newId],
      isDirty: true,
    })
    return newId
  },

  reorderComponent: (id, newOrder) => {
    const { components } = get()
    const comp = components[id]
    if (!comp) {return}

    set({
      components: {
        ...components,
        [id]: { ...comp, order: newOrder, updatedAt: new Date().toISOString() },
      },
      isDirty: true,
    })
  },

  // ── Selection ──

  select: (id, multi = false) => {
    set(state => ({
      selectedIds: multi
        ? state.selectedIds.includes(id) ? state.selectedIds : [...state.selectedIds, id]
        : [id],
    }))
  },

  deselect: (id) => {
    set(state => ({
      selectedIds: state.selectedIds.filter(sid => sid !== id),
    }))
  },

  clearSelection: () => set({ selectedIds: [] }),

  selectAll: () => {
    set({ selectedIds: Object.keys(get().components) })
  },

  setHovered: (id) => set({ hoveredId: id }),

  // ── Clipboard ──

  copySelected: () => {
    const { components, selectedIds } = get()
    const copied = selectedIds.map(id => components[id]).filter(Boolean)
    set({ clipboard: JSON.parse(JSON.stringify(copied)) })
    log.debug('Copied', { count: copied.length })
  },

  cutSelected: () => {
    const state = get()
    state.copySelected()
    state.selectedIds.forEach(id => state.removeComponent(id))
  },

  paste: (parentId) => {
    const { clipboard } = get()
    if (!clipboard || clipboard.length === 0) {return}

    const newIds: string[] = []
    clipboard.forEach(comp => {
      const id = get().addComponent(
        comp.type,
        `${comp.name} (paste)`,
        { ...comp.position, x: comp.position.x + 20, y: comp.position.y + 20 },
        parentId,
      )
      newIds.push(id)
    })
    set({ selectedIds: newIds })
  },

  // ── Canvas ──

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(4, zoom)) }),

  setPanOffset: (offset) => set({ panOffset: offset }),

  resetView: () => set({ zoom: 1, panOffset: { x: 0, y: 0 } }),

  // ── History ──

  undo: () => {
    const { history, components } = get()
    if (history.length === 0) {return}
    const prev = history[history.length - 1]
    set({
      components: prev.components,
      history: history.slice(0, -1),
      redoStack: [...get().redoStack, snapshot(components)],
      isDirty: true,
    })
    log.debug('Undo')
  },

  redo: () => {
    const { redoStack, components } = get()
    if (redoStack.length === 0) {return}
    const next = redoStack[redoStack.length - 1]
    set({
      components: next.components,
      redoStack: redoStack.slice(0, -1),
      history: [...get().history, snapshot(components)],
      isDirty: true,
    })
    log.debug('Redo')
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().redoStack.length > 0,

  // ── Queries ──

  getComponent: (id) => get().components[id],

  getChildren: (parentId) => {
    return Object.values(get().components)
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.order - b.order)
  },

  getRootComponents: () => {
    return Object.values(get().components)
      .filter(c => !c.parentId)
      .sort((a, b) => a.order - b.order)
  },

  getSelectedComponents: () => {
    const { components, selectedIds } = get()
    return selectedIds.map(id => components[id]).filter(Boolean)
  },

  getComponentTree: () => {
    const { components } = get()
    const buildTree = (parentId?: string): TreeNode[] => {
      return Object.values(components)
        .filter(c => c.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map(c => ({
          component: c,
          children: buildTree(c.id),
        }))
    }
    return buildTree(undefined)
  },
}))
