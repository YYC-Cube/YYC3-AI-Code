/**
 * @file plugin-service.ts
 * @description YYC³ 插件系统 — 注册/加载/卸载/启停生命周期管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Implements the FEFS Plugin API (`registerPlugin(name, api)`).
 * Supports plugin types: storage, ai-provider, sync, editor, theme, tool.
 * Each plugin receives a PluginContext with scoped logger, host bridge, and storage.
 */

import { createLogger } from '../utils/logger'
import { hostBridge } from './host-bridge-service'
import type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginRegistry,
} from '../types/storage'

const log = createLogger('PluginService')

/* ================================================================
   Plugin Storage (per-plugin key-value via localStorage)
   ================================================================ */

function createPluginStorage(pluginId: string) {
  const prefix = `yyc3_plugin_${pluginId}:`
  return {
    async get<T>(key: string): Promise<T | null> {
      try {
        const raw = localStorage.getItem(`${prefix}${key}`)
        return raw ? JSON.parse(raw) as T : null
      } catch { return null }
    },
    async set<T>(key: string, value: T): Promise<void> {
      try { localStorage.setItem(`${prefix}${key}`, JSON.stringify(value)) } catch { /* */ }
    },
    async delete(key: string): Promise<void> {
      try { localStorage.removeItem(`${prefix}${key}`) } catch { /* */ }
    },
  }
}

/* ================================================================
   Plugin Registry Implementation
   ================================================================ */

interface PluginEntry {
  manifest: PluginManifest
  factory: (ctx: PluginContext) => Plugin
  instance?: Plugin
  enabled: boolean
  context?: PluginContext
}

class PluginRegistryImpl implements PluginRegistry {
  private plugins = new Map<string, PluginEntry>()

  /**
   * Register a plugin with its manifest and factory.
   */
  register(manifest: PluginManifest, factory: (ctx: PluginContext) => Plugin): void {
    if (this.plugins.has(manifest.id)) {
      log.warn(`Plugin already registered: ${manifest.id} — replacing`)
    }
    this.plugins.set(manifest.id, { manifest, factory, enabled: false })
    log.info(`Plugin registered: ${manifest.displayName} v${manifest.version} [${manifest.type}]`)
  }

  /**
   * Unregister a plugin (disable first if running).
   */
  unregister(pluginId: string): void {
    const entry = this.plugins.get(pluginId)
    if (!entry) {return}
    if (entry.enabled && entry.instance) {
      entry.instance.dispose().catch(e => log.error(`Error disposing plugin ${pluginId}`, e))
    }
    this.plugins.delete(pluginId)
    log.info(`Plugin unregistered: ${pluginId}`)
  }

  /**
   * Get a plugin instance (must be enabled).
   */
  get(pluginId: string): Plugin | undefined {
    const entry = this.plugins.get(pluginId)
    return entry?.enabled ? entry.instance : undefined
  }

  /**
   * List all registered plugin manifests.
   */
  list(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(e => e.manifest)
  }

  /**
   * List plugins by type.
   */
  listByType(type: PluginManifest['type']): PluginManifest[] {
    return Array.from(this.plugins.values())
      .filter(e => e.manifest.type === type)
      .map(e => e.manifest)
  }

  /**
   * Enable and initialise a plugin.
   */
  async enable(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {throw new Error(`Plugin not found: ${pluginId}`)}
    if (entry.enabled) {
      log.debug(`Plugin already enabled: ${pluginId}`)
      return
    }

    const context: PluginContext = {
      manifest: entry.manifest,
      logger: createLogger(`Plugin:${entry.manifest.name}`) as any,
      hostBridge,
      storage: createPluginStorage(pluginId),
      config: {},
    }

    try {
      const instance = entry.factory(context)
      await instance.initialize(context)
      entry.instance = instance
      entry.context = context
      entry.enabled = true
      log.info(`Plugin enabled: ${entry.manifest.displayName}`)
    } catch (err) {
      log.error(`Failed to enable plugin: ${pluginId}`, err)
      throw err
    }
  }

  /**
   * Disable and dispose a plugin.
   */
  async disable(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry || !entry.enabled) {return}

    try {
      if (entry.instance) {
        await entry.instance.dispose()
      }
    } catch (err) {
      log.error(`Error disposing plugin: ${pluginId}`, err)
    }

    entry.instance = undefined
    entry.context = undefined
    entry.enabled = false
    log.info(`Plugin disabled: ${pluginId}`)
  }

  /**
   * Check if a plugin is enabled.
   */
  isEnabled(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.enabled ?? false
  }

  /**
   * Call a plugin API method.
   */
  callApi<T = unknown>(pluginId: string, method: string, ...args: unknown[]): T {
    const instance = this.get(pluginId)
    if (!instance) {throw new Error(`Plugin not enabled: ${pluginId}`)}
    const fn = instance.api[method]
    if (typeof fn !== 'function') {throw new Error(`Plugin ${pluginId} has no method: ${method}`)}
    return fn(...args) as T
  }

  /**
   * Enable all registered plugins.
   */
  async enableAll(): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
    const success: string[] = []
    const failed: Array<{ id: string; error: string }> = []

    for (const [id] of this.plugins) {
      try {
        await this.enable(id)
        success.push(id)
      } catch (err: any) {
        failed.push({ id, error: err?.message || String(err) })
      }
    }

    return { success, failed }
  }

  /**
   * Disable all plugins.
   */
  async disableAll(): Promise<void> {
    for (const [id] of this.plugins) {
      await this.disable(id)
    }
  }

  /**
   * Get plugin stats.
   */
  getStats(): { total: number; enabled: number; disabled: number; byType: Record<string, number> } {
    const entries = Array.from(this.plugins.values())
    const byType: Record<string, number> = {}
    for (const e of entries) {
      byType[e.manifest.type] = (byType[e.manifest.type] || 0) + 1
    }
    return {
      total: entries.length,
      enabled: entries.filter(e => e.enabled).length,
      disabled: entries.filter(e => !e.enabled).length,
      byType,
    }
  }
}

/* ================================================================
   Built-in Example Plugins
   ================================================================ */

/** Example: Local SQLite storage plugin manifest */
const builtinPlugins: Array<{ manifest: PluginManifest; factory: (ctx: PluginContext) => Plugin }> = [
  {
    manifest: {
      id: 'yyc3-local-cache',
      name: 'local-cache',
      displayName: 'Local Cache Manager',
      version: '1.0.0',
      description: 'Manages local IndexedDB cache with TTL and cleanup',
      author: 'YanYuCloudCube Team',
      type: 'storage',
      capabilities: ['cache.read', 'cache.write', 'cache.clear'],
      main: 'built-in',
      icon: 'Database',
    },
    factory: (ctx) => ({
      async initialize() {
        ctx.logger.info('Local Cache Manager initialised')
      },
      async dispose() {
        ctx.logger.info('Local Cache Manager disposed')
      },
      api: {
        getStats: () => ({
          entries: 0,
          sizeEstimate: '0 KB',
        }),
        cleanup: () => {
          ctx.logger.info('Cache cleanup triggered')
          return 0
        },
      },
    }),
  },
  {
    manifest: {
      id: 'yyc3-export-tool',
      name: 'export-tool',
      displayName: 'Data Export Tool',
      version: '1.0.0',
      description: 'Export workspace data as encrypted JSON backup',
      author: 'YanYuCloudCube Team',
      type: 'tool',
      capabilities: ['data.export', 'data.import'],
      main: 'built-in',
      icon: 'Download',
    },
    factory: (ctx) => ({
      async initialize() {
        ctx.logger.info('Data Export Tool initialised')
      },
      async dispose() {
        ctx.logger.info('Data Export Tool disposed')
      },
      api: {
        getSupportedFormats: () => ['json', 'json-encrypted'],
      },
    }),
  },
]

/* ================================================================
   Singleton & Initialisation
   ================================================================ */

export const pluginRegistry: PluginRegistry & {
  callApi: <T = unknown>(pluginId: string, method: string, ...args: unknown[]) => T
  listByType: (type: PluginManifest['type']) => PluginManifest[]
  enableAll: () => Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }>
  disableAll: () => Promise<void>
  getStats: () => { total: number; enabled: number; disabled: number; byType: Record<string, number> }
} = new PluginRegistryImpl()

// Register built-in plugins
for (const bp of builtinPlugins) {
  pluginRegistry.register(bp.manifest, bp.factory)
}
