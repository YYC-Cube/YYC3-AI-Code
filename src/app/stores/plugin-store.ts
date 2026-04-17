/**
 * @file plugin-store.ts
 * @description Plugin ecosystem state — manifest registry, install/enable, command execution
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'

const log = createLogger('PluginStore')

// ============================================
// Types
// ============================================

export type PluginType = 'panel' | 'command' | 'theme' | 'language' | 'tool'

export interface PluginCommand {
  id: string
  name: string
  description: string
  shortcut?: string
  handler: string // serialized function reference
}

export interface PluginPanel {
  id: string
  title: string
  icon: string // lucide icon name
  position: 'left' | 'right' | 'bottom'
  component: string // component identifier
}

export interface PluginManifest {
  id: string
  name: string
  displayName: string
  version: string
  author: string
  description: string
  type: PluginType
  enabled: boolean
  installed: boolean
  icon: string
  homepage?: string
  repository?: string
  panels?: PluginPanel[]
  commands?: PluginCommand[]
  config?: Record<string, unknown>
}

export interface PluginRegistry {
  plugins: PluginManifest[]
  activePluginId: string | null
}

// ============================================
// Preset Plugins (Mock marketplace)
// ============================================

const PRESET_PLUGINS: PluginManifest[] = [
  {
    id: 'plugin-git-panel',
    name: 'git-panel',
    displayName: 'Git 版本控制',
    version: '1.2.0',
    author: 'YYC³ Team',
    description: '集成 Git 操作面板，支持 commit/push/pull/diff 可视化',
    type: 'panel',
    enabled: true,
    installed: true,
    icon: 'GitBranch',
    panels: [{
      id: 'git-main',
      title: 'Git',
      icon: 'GitBranch',
      position: 'left',
      component: 'GitPanel',
    }],
    commands: [
      { id: 'git-commit', name: 'git:commit', description: 'Git 提交更改', shortcut: 'Ctrl+Shift+G', handler: 'gitCommit' },
      { id: 'git-push', name: 'git:push', description: 'Git 推送到远程', handler: 'gitPush' },
      { id: 'git-pull', name: 'git:pull', description: 'Git 拉取远程更新', handler: 'gitPull' },
      { id: 'git-status', name: 'git:status', description: '查看 Git 状态', handler: 'gitStatus' },
    ],
  },
  {
    id: 'plugin-docker',
    name: 'docker-manager',
    displayName: 'Docker 管理器',
    version: '0.8.0',
    author: 'YYC³ Team',
    description: '管理本地 Docker 容器，查看日志，执行 docker-compose 操作',
    type: 'panel',
    enabled: false,
    installed: true,
    icon: 'Container',
    panels: [{
      id: 'docker-main',
      title: 'Docker',
      icon: 'Container',
      position: 'bottom',
      component: 'DockerPanel',
    }],
    commands: [
      { id: 'docker-up', name: 'docker:up', description: 'Docker Compose Up', handler: 'dockerUp' },
      { id: 'docker-down', name: 'docker:down', description: 'Docker Compose Down', handler: 'dockerDown' },
      { id: 'docker-logs', name: 'docker:logs', description: '查看容器日志', handler: 'dockerLogs' },
    ],
  },
  {
    id: 'plugin-db-explorer',
    name: 'db-explorer',
    displayName: '数据库浏览器',
    version: '1.0.0',
    author: 'YYC³ Team',
    description: '连接并浏览 PostgreSQL/MySQL/Redis 数据库，执行 SQL 查询',
    type: 'panel',
    enabled: true,
    installed: true,
    icon: 'Database',
    panels: [{
      id: 'db-main',
      title: '数据库',
      icon: 'Database',
      position: 'right',
      component: 'DBExplorer',
    }],
    commands: [
      { id: 'db-connect', name: 'db:connect', description: '连接数据库', handler: 'dbConnect' },
      { id: 'db-query', name: 'db:query', description: '执行 SQL 查询', shortcut: 'Ctrl+Shift+Q', handler: 'dbQuery' },
      { id: 'db-export', name: 'db:export', description: '导出查询结果', handler: 'dbExport' },
    ],
  },
  {
    id: 'plugin-api-tester',
    name: 'api-tester',
    displayName: 'API 调试器',
    version: '0.5.0',
    author: 'Community',
    description: '类似 Postman 的 API 测试工具，支持 REST/GraphQL',
    type: 'tool',
    enabled: false,
    installed: false,
    icon: 'Send',
    commands: [
      { id: 'api-test', name: 'api:test', description: '发送 API 请求', shortcut: 'Ctrl+Shift+R', handler: 'apiTest' },
    ],
  },
  {
    id: 'plugin-i18n',
    name: 'i18n-manager',
    displayName: '国际化管理',
    version: '0.3.0',
    author: 'Community',
    description: '多语言翻译管理，自动提取文案并生成 i18n 配置',
    type: 'tool',
    enabled: false,
    installed: false,
    icon: 'Languages',
    commands: [
      { id: 'i18n-extract', name: 'i18n:extract', description: '提取可翻译文案', handler: 'i18nExtract' },
      { id: 'i18n-translate', name: 'i18n:translate', description: 'AI 自动翻译', handler: 'i18nTranslate' },
    ],
  },
  {
    id: 'plugin-snippet-manager',
    name: 'snippet-manager',
    displayName: '代码片段管理',
    version: '1.1.0',
    author: 'YYC³ Team',
    description: '自定义代码片段库，支持快速插入和团队共享',
    type: 'command',
    enabled: true,
    installed: true,
    icon: 'Braces',
    commands: [
      { id: 'snippet-insert', name: 'snippet:insert', description: '插入代码片段', shortcut: 'Ctrl+Shift+S', handler: 'snippetInsert' },
      { id: 'snippet-save', name: 'snippet:save', description: '保存选中为片段', handler: 'snippetSave' },
      { id: 'snippet-list', name: 'snippet:list', description: '浏览片段库', handler: 'snippetList' },
    ],
  },
  {
    id: 'plugin-performance',
    name: 'perf-monitor',
    displayName: '性能监控',
    version: '0.7.0',
    author: 'Community',
    description: '实时性能监控面板，追踪渲染帧率、内存使用和网络请求',
    type: 'panel',
    enabled: false,
    installed: false,
    icon: 'Gauge',
    panels: [{
      id: 'perf-main',
      title: '性能',
      icon: 'Gauge',
      position: 'bottom',
      component: 'PerfPanel',
    }],
  },
]

// ============================================
// Store
// ============================================

interface PluginStoreState {
  plugins: PluginManifest[]
  activePluginId: string | null

  // Actions
  installPlugin: (pluginId: string) => void
  uninstallPlugin: (pluginId: string) => void
  enablePlugin: (pluginId: string) => void
  disablePlugin: (pluginId: string) => void
  togglePlugin: (pluginId: string) => void
  setActivePlugin: (pluginId: string | null) => void
  updatePluginConfig: (pluginId: string, config: Record<string, unknown>) => void
  getEnabledCommands: () => PluginCommand[]
  getEnabledPanels: () => (PluginPanel & { pluginId: string; pluginName: string })[]
  executeCommand: (commandId: string) => string[]
  registerCustomPlugin: (manifest: PluginManifest) => void
  removeCustomPlugin: (pluginId: string) => void
}

export const usePluginStore = create<PluginStoreState>()(
  persist(
    (set, get) => ({
  plugins: [...PRESET_PLUGINS],
  activePluginId: null,

  installPlugin: (pluginId) => {
    set((s) => {
      const updated = s.plugins.map(p =>
        p.id === pluginId ? { ...p, installed: true, enabled: true } : p
      )
      log.info('Plugin installed', { pluginId })
      return { plugins: updated }
    })
  },

  uninstallPlugin: (pluginId) => {
    set((s) => {
      const updated = s.plugins.map(p =>
        p.id === pluginId ? { ...p, installed: false, enabled: false } : p
      )
      log.info('Plugin uninstalled', { pluginId })
      return { plugins: updated }
    })
  },

  enablePlugin: (pluginId) => {
    set((s) => {
      const updated = s.plugins.map(p =>
        p.id === pluginId ? { ...p, enabled: true } : p
      )
      log.info('Plugin enabled', { pluginId })
      return { plugins: updated }
    })
  },

  disablePlugin: (pluginId) => {
    set((s) => {
      const updated = s.plugins.map(p =>
        p.id === pluginId ? { ...p, enabled: false } : p
      )
      log.info('Plugin disabled', { pluginId })
      return { plugins: updated }
    })
  },

  togglePlugin: (pluginId) => {
    const plugin = get().plugins.find(p => p.id === pluginId)
    if (plugin) {
      if (plugin.enabled) {get().disablePlugin(pluginId)}
      else {get().enablePlugin(pluginId)}
    }
  },

  setActivePlugin: (pluginId) => set({ activePluginId: pluginId }),

  updatePluginConfig: (pluginId, config) => {
    set((s) => {
      const updated = s.plugins.map(p =>
        p.id === pluginId ? { ...p, config: { ...p.config, ...config } } : p
      )
      return { plugins: updated }
    })
  },

  getEnabledCommands: () => {
    return get().plugins
      .filter(p => p.enabled && p.installed)
      .flatMap(p => (p.commands || []).map(cmd => ({ ...cmd, id: `${p.id}:${cmd.id}` })))
  },

  getEnabledPanels: () => {
    return get().plugins
      .filter(p => p.enabled && p.installed)
      .flatMap(p => (p.panels || []).map(panel => ({
        ...panel,
        pluginId: p.id,
        pluginName: p.displayName,
      })))
  },

  executeCommand: (commandId) => {
    const plugins = get().plugins.filter(p => p.enabled && p.installed)
    for (const plugin of plugins) {
      const cmd = plugin.commands?.find(c => c.name === commandId || c.id === commandId || `${plugin.id}:${c.id}` === commandId)
      if (cmd) {
        log.info('Executing plugin command', { commandId, plugin: plugin.name })
        // Simulated command execution
        return [
          '',
          `  [${plugin.displayName}] 执行命令: ${cmd.description}`,
          `  → ${cmd.handler}() 模拟执行中...`,
          `  ✓ 命令完成 (${Math.floor(Math.random() * 500 + 100)}ms)`,
          '',
        ]
      }
    }
    return [`  ✗ 未找到命令: ${commandId}`]
  },

  registerCustomPlugin: (manifest) => {
    set((s) => {
      const existing = s.plugins.find(p => p.id === manifest.id)
      let updated: PluginManifest[]
      if (existing) {
        updated = s.plugins.map(p => p.id === manifest.id ? { ...manifest, installed: true } : p)
      } else {
        updated = [...s.plugins, { ...manifest, installed: true }]
      }
      log.info('Custom plugin registered', { id: manifest.id, name: manifest.displayName })
      return { plugins: updated }
    })
  },

  removeCustomPlugin: (pluginId) => {
    set((s) => {
      // Only allow removing non-preset plugins
      const isPreset = PRESET_PLUGINS.some(p => p.id === pluginId)
      if (isPreset) {return s}
      const updated = s.plugins.filter(p => p.id !== pluginId)
      log.info('Custom plugin removed', { pluginId })
      return { plugins: updated }
    })
  },
}),
    {
      name: 'yyc3_plugins',
      partialize: (state) => ({ plugins: state.plugins }),
      merge: (persisted: any, current) => {
        const saved: PluginManifest[] = persisted?.plugins || []
        const savedIds = new Set(saved.map((p: PluginManifest) => p.id))
        const merged = [...saved]
        for (const preset of PRESET_PLUGINS) {
          if (!savedIds.has(preset.id)) {merged.push(preset)}
        }
        return { ...current, plugins: merged.length > 0 ? merged : [...PRESET_PLUGINS] }
      },
    }
  )
)