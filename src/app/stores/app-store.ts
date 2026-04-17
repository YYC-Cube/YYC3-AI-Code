/**
 * @file app-store.ts
 * @description Core application state — AI chat, file management, models, terminal, UI toggles
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-13
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags app-state, ai-models, projects, persist
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionMessage, MessageMetadata } from '../types/models'
import { useAIServiceStore } from './ai-service-store'

// ============================================
// Types
// ============================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export type UnifiedMessage = SessionMessage & {
  isStreaming?: boolean
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  updatedAt: string
  status: 'active' | 'archived' | 'draft'
  thumbnail: string
}

export type ViewMode = 'code' | 'preview' | 'split'

export interface FileContent {
  path: string
  content: string
  language: string
  isModified: boolean
  /** Original content when first loaded — used to detect real modifications */
  originalContent?: string
}

export interface AIModel {
  id: string
  name: string
  provider: 'zhipu' | 'ollama' | 'custom'
  endpoint: string
  apiKey: string
  isActive: boolean
  isDetected?: boolean
}

export type ModelTestStatus = 'idle' | 'testing' | 'success' | 'error'
export interface ModelTestResult {
  status: ModelTestStatus
  message: string
  latency?: number
}

// Heartbeat
export interface ModelHeartbeat {
  modelId: string
  status: 'online' | 'offline' | 'checking' | 'unknown'
  latency: number | null
  lastCheck: number | null // timestamp
  consecutiveFailures: number
}

// Panel Layout
export type PanelId = 'left' | 'center' | 'right' | 'preview'
export interface PanelConfig {
  id: PanelId
  label: string
  visible: boolean
  collapsed: boolean
  defaultSize: number
  minSize: number
  maxSize: number
}

export type LayoutPreset = 'default' | 'focus-code' | 'focus-chat' | 'minimal' | 'wide-preview' | 'custom'

export interface LayoutConfig {
  preset: LayoutPreset
  panels: Record<PanelId, PanelConfig>
  direction: 'horizontal' | 'vertical'
}

// Sync / Persistence
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
export interface SyncState {
  status: SyncStatus
  lastSynced: number | null
  pendingChanges: number
  errorMessage: string | null
}

// Bottom Panel
export type BottomPanelTab = 'filesystem' | 'database' | 'security' | 'branding' | 'taskboard' | 'multi-instance'

// ============================================
// Defaults
// ============================================

function getDefaultModels(): AIModel[] {
  return [
    {
      id: 'zhipu-glm5',
      name: 'GLM-5',
      provider: 'zhipu',
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      apiKey: '',
      isActive: false,
    },
    {
      id: 'zhipu-glm4.7',
      name: 'GLM-4.7',
      provider: 'zhipu',
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      apiKey: '',
      isActive: false,
    },
    {
      id: 'ollama-default',
      name: 'Ollama Local',
      provider: 'ollama',
      endpoint: 'http://localhost:11434/api/chat',
      apiKey: '',
      isActive: false,
    },
  ]
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)

  if (weeks > 0) {return `${weeks} 周前`}
  if (days > 0) {return `${days} 天前`}
  if (hours > 0) {return `${hours} 小时前`}
  if (minutes > 0) {return `${minutes} 分钟前`}
  return `${seconds} 秒前`
}

function getDefaultProjects(): ProjectItem[] {
  return [
    { id: '1', name: 'E-Commerce Dashboard', description: 'React + TypeScript 电商管理后台', updatedAt: '2 小时前', status: 'active', thumbnail: '' },
    { id: '2', name: 'AI Chat Platform', description: '多模态 AI 对话平台', updatedAt: '1 天前', status: 'active', thumbnail: '' },
    { id: '3', name: 'Design System v2', description: '企业级设计系统组件库', updatedAt: '3 天前', status: 'draft', thumbnail: '' },
    { id: '4', name: 'IoT Monitor', description: '物联网设备监控面板', updatedAt: '1 周前', status: 'archived', thumbnail: '' },
  ]
}

// ============================================
// Store
// ============================================

interface AppState {
  // Navigation
  currentView: ViewMode
  setCurrentView: (view: ViewMode) => void

  // UI Toggles
  terminalVisible: boolean
  toggleTerminal: () => void
  searchPanelOpen: boolean
  toggleSearchPanel: () => void
  setSearchPanelOpen: (v: boolean) => void

  // Bottom Panel (FileSystem / Database)
  bottomPanelVisible: boolean
  bottomPanelTab: BottomPanelTab
  toggleBottomPanel: () => void
  setBottomPanelTab: (tab: BottomPanelTab) => void
  openBottomPanel: (tab: BottomPanelTab) => void

  // AI Chat (unified with SessionMessage from models.ts)
  messages: UnifiedMessage[]
  addMessage: (msg: Omit<UnifiedMessage, 'id' | 'timestamp'>) => void
  updateMessage: (id: string, updates: Partial<UnifiedMessage>) => void
  removeMessagesFrom: (id: string) => void
  isAiTyping: boolean
  setAiTyping: (v: boolean) => void

  // Legacy compatibility (deprecated - use addMessage instead)
  addChatMessage?: (role: 'user' | 'assistant', content: string, isStreaming?: boolean) => string

  // Streaming control
  abortController: AbortController | null
  setAbortController: (ctrl: AbortController | null) => void

  // AI Models (full CRUD)
  aiModels: AIModel[]
  activeModelId: string | null
  addAIModel: (model: Omit<AIModel, 'id'>) => void
  removeAIModel: (id: string) => void
  updateAIModel: (id: string, updates: Partial<AIModel>) => void
  activateAIModel: (id: string) => void

  // Model Settings Modal
  modelSettingsOpen: boolean
  openModelSettings: () => void
  closeModelSettings: () => void

  // Model Connectivity Test
  modelTestResults: Record<string, ModelTestResult>
  setModelTestResult: (id: string, result: ModelTestResult) => void
  clearModelTestResult: (id: string) => void

  // File Tree
  selectedFile: string | null
  setSelectedFile: (f: string | null) => void
  expandedFolders: Set<string>
  toggleFolder: (f: string) => void

  // Open Tabs
  openTabs: string[]
  openFileTab: (path: string) => void
  closeFileTab: (path: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void

  // File Contents (editable)
  fileContents: Record<string, FileContent>
  getFileContent: (path: string) => FileContent | null
  updateFileContent: (path: string, content: string) => void

  // Terminal
  terminalLines: string[]
  addTerminalLine: (l: string) => void
  clearTerminal: () => void

  // Projects
  projects: ProjectItem[]
  activeProjectId: string | null
  setActiveProject: (id: string | null) => void
  createProject: (name: string, description: string) => string
  updateProject: (id: string, updates: Partial<ProjectItem>) => void
  deleteProject: (id: string) => void
  archiveProject: (id: string) => void
  renameProject: (id: string, name: string) => void

  // Theme
  isDark: boolean
  toggleTheme: () => void

  // Code Apply tracking
  lastAppliedFile: string | null
  setLastAppliedFile: (path: string | null) => void
  clearAppliedHighlight: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'code',
      setCurrentView: (view) => set({ currentView: view }),

      // UI Toggles
      terminalVisible: true,
      toggleTerminal: () => set((s) => ({ terminalVisible: !s.terminalVisible })),
      searchPanelOpen: false,
      toggleSearchPanel: () => set((s) => ({ searchPanelOpen: !s.searchPanelOpen })),
      setSearchPanelOpen: (v) => set({ searchPanelOpen: v }),

      // Bottom Panel
      bottomPanelVisible: false,
      bottomPanelTab: 'filesystem',
      toggleBottomPanel: () => set((s) => ({ bottomPanelVisible: !s.bottomPanelVisible })),
      setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),
      openBottomPanel: (tab) => set({ bottomPanelVisible: true, bottomPanelTab: tab }),

      messages: [],
      addMessage: (msg) =>
        set((s) => ({
          messages: [
            ...s.messages,
            {
              ...msg,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
            } as UnifiedMessage,
          ],
        })),
      updateMessage: (id, updates) =>
        set((s) => ({
          messages: s.messages.map(m =>
            m.id === id ? { ...m, ...updates } as UnifiedMessage : m
          ),
        })),
      removeMessagesFrom: (id) =>
        set((s) => ({
          messages: s.messages.filter(m => m.id !== id),
        })),
      isAiTyping: false,
      setAiTyping: (v) => set({ isAiTyping: v }),

      // Streaming control (non-serializable — excluded from persist)
      abortController: null,
      setAbortController: (ctrl) => set({ abortController: ctrl }),

      // AI Models (with ai-service-store sync)
      aiModels: getDefaultModels(),
      activeModelId: null,

      addAIModel: (model) => {
        const newModel: AIModel = { ...model, id: crypto.randomUUID() }
        set((s) => ({ aiModels: [...s.aiModels, newModel] }))
        try {
          const aiStore = useAIServiceStore.getState()
          const providerId = model.provider === 'zhipu' ? 'zhipuai'
            : model.provider === 'ollama' ? 'ollama'
            : 'custom'
          aiStore.addModel(providerId, {
            id: newModel.id,
            name: model.name,
            displayName: model.name,
            type: 'chat',
            contextLength: 8192,
            maxTokens: 4096,
            enabled: true,
            parameters: { temperature: 0.7, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
            capabilities: ['chat', 'code'],
          })
        } catch (e) {
          console.warn('[AppStore] Failed to sync model to ai-service-store:', e)
        }
      },

      removeAIModel: (id) => {
        set((s) => {
          const updated = s.aiModels.filter(m => m.id !== id)
          const newActiveId = s.activeModelId === id ? null : s.activeModelId
          return { aiModels: updated, activeModelId: newActiveId }
        })
        try {
          const aiStore = useAIServiceStore.getState()
          for (const provider of aiStore.providers) {
            if (provider.models.some(m => m.id === id)) {
              aiStore.removeModel(provider.id, id)
              break
            }
          }
        } catch (e) {
          console.warn('[AppStore] Failed to remove model from ai-service-store:', e)
        }
      },

      updateAIModel: (id, updates) => {
        set((s) => ({
          aiModels: s.aiModels.map(m => m.id === id ? { ...m, ...updates } : m),
        }))
        try {
          const aiStore = useAIServiceStore.getState()
          for (const provider of aiStore.providers) {
            if (provider.models.some(m => m.id === id)) {
              aiStore.updateModel(provider.id, id, updates as any)
              break
            }
          }
        } catch (e) {
          console.warn('[AppStore] Failed to update model in ai-service-store:', e)
        }
      },

      activateAIModel: (id) => {
        set((s) => ({
          aiModels: s.aiModels.map(m => ({ ...m, isActive: m.id === id })),
          activeModelId: id,
        }))
        try {
          const aiStore = useAIServiceStore.getState()
          for (const provider of aiStore.providers) {
            if (provider.models.some(m => m.id === id)) {
              aiStore.setActiveProviderAndModel(provider.id, id)
              break
            }
          }
        } catch (e) {
          console.warn('[AppStore] Failed to activate model in ai-service-store:', e)
        }
      },

      // Model Settings Modal
      modelSettingsOpen: false,
      openModelSettings: () => set({ modelSettingsOpen: true }),
      closeModelSettings: () => set({ modelSettingsOpen: false }),

      // Model Test
      modelTestResults: {},
      setModelTestResult: (id, result) =>
        set((s) => ({
          modelTestResults: { ...s.modelTestResults, [id]: result },
        })),
      clearModelTestResult: (id) =>
        set((s) => {
          const next = { ...s.modelTestResults }
          delete next[id]
          return { modelTestResults: next }
        }),

      // File Tree — expandedFolders uses Set (non-serializable, excluded from persist)
      selectedFile: 'src/app/App.tsx',
      setSelectedFile: (f) => set({ selectedFile: f }),
      expandedFolders: new Set(['src', 'src/app', 'src/app/components']),
      toggleFolder: (f) =>
        set((s) => {
          const next = new Set(s.expandedFolders)
          if (next.has(f)) {next.delete(f)}
          else {next.add(f)}
          return { expandedFolders: next }
        }),

      openTabs: ['src/app/App.tsx'],
      openFileTab: (path) =>
        set((s) => {
          const next = new Set(s.openTabs)
          next.add(path)
          return { openTabs: Array.from(next) }
        }),
      closeFileTab: (path) =>
        set((s) => {
          const tabs = s.openTabs.filter(t => t !== path)
          let selectedFile = s.selectedFile
          if (s.selectedFile === path) {
            const closedIdx = s.openTabs.indexOf(path)
            selectedFile = tabs[Math.min(closedIdx, tabs.length - 1)] || null
          }
          return { openTabs: tabs, selectedFile }
        }),
      reorderTabs: (fromIndex, toIndex) =>
        set((s) => {
          const tabs = [...s.openTabs]
          const [movedTab] = tabs.splice(fromIndex, 1)
          tabs.splice(toIndex, 0, movedTab)
          return { openTabs: tabs }
        }),

      fileContents: {},
      getFileContent: (path) => get().fileContents[path] || null,
      updateFileContent: (path, content) =>
        set((s) => {
          const existing = s.fileContents[path]
          const originalContent = existing?.originalContent ?? existing?.content ?? content
          return {
            fileContents: {
              ...s.fileContents,
              [path]: {
                path,
                content,
                language: path.endsWith('.tsx') || path.endsWith('.ts') ? 'typescript' :
                          path.endsWith('.css') ? 'css' :
                          path.endsWith('.json') ? 'json' : 'text',
                isModified: content !== originalContent,
                originalContent,
              },
            },
          }
        }),

      terminalLines: [
        '$ npm run dev',
        '',
        '  VITE v5.4.2  ready in 324 ms',
        '',
        '  ➜  Local:   http://localhost:5173/',
        '  ➜  Network: http://192.168.1.100:5173/',
        '  ➜  press h + enter to show help',
        '',
      ],
      addTerminalLine: (l) =>
        set((s) => {
          const MAX_TERMINAL_LINES = 500
          const lines = [...s.terminalLines, l]
          return { terminalLines: lines.length > MAX_TERMINAL_LINES ? lines.slice(-MAX_TERMINAL_LINES) : lines }
        }),
      clearTerminal: () =>
        set(() => ({ terminalLines: [] })),

      projects: getDefaultProjects(),
      activeProjectId: null,

      setActiveProject: (id) => set({ activeProjectId: id }),

      createProject: (name, description) => {
        const id = crypto.randomUUID()
        const now = new Date()
        const newProject: ProjectItem = {
          id, name, description,
          updatedAt: formatRelativeTime(now),
          status: 'active', thumbnail: '',
        }
        set((s) => ({
          projects: [newProject, ...s.projects],
          activeProjectId: id,
        }))
        return id
      },

      updateProject: (id, updates) => {
        set((s) => ({
          projects: s.projects.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: formatRelativeTime(new Date()) } : p
          ),
        }))
      },

      deleteProject: (id) => {
        set((s) => {
          const updated = s.projects.filter(p => p.id !== id)
          const newActiveId = s.activeProjectId === id ? null : s.activeProjectId
          return { projects: updated, activeProjectId: newActiveId }
        })
      },

      archiveProject: (id) => {
        set((s) => ({
          projects: s.projects.map(p =>
            p.id === id ? { ...p, status: 'archived' as const, updatedAt: formatRelativeTime(new Date()) } : p
          ),
        }))
      },

      renameProject: (id, name) => {
        set((s) => ({
          projects: s.projects.map(p =>
            p.id === id ? { ...p, name, updatedAt: formatRelativeTime(new Date()) } : p
          ),
        }))
      },

      isDark: true,
      toggleTheme: () => set((s) => ({ isDark: !s.isDark })),

      // Code Apply tracking
      lastAppliedFile: null,
      setLastAppliedFile: (path) => set({ lastAppliedFile: path }),
      clearAppliedHighlight: () => set({ lastAppliedFile: null }),
    }),
    {
      name: 'yyc3_app_store',
      partialize: (state) => ({
        aiModels: state.aiModels,
        activeModelId: state.activeModelId,
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
      merge: (persisted: any, current) => {
        if (!persisted) {return current}
        const aiModels = persisted.aiModels?.length ? persisted.aiModels : current.aiModels
        const activeModelId = persisted.activeModelId && aiModels.some((m: AIModel) => m.id === persisted.activeModelId)
          ? persisted.activeModelId : aiModels.find((m: AIModel) => m.isActive)?.id || null
        if (activeModelId) {aiModels.forEach((m: AIModel) => { m.isActive = m.id === activeModelId })}
        return {
          ...current,
          aiModels,
          activeModelId,
          projects: persisted.projects?.length ? persisted.projects : current.projects,
          activeProjectId: persisted.activeProjectId ?? current.activeProjectId,
        }
      },
    }
  )
)