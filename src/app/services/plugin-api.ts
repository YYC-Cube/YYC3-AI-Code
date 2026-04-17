/**
 * @file plugin-api.ts
 * @description F-22 Plugin API — registerPlugin / unregisterPlugin for third-party storage backends and extensions
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin, api, extension, storage-backend, registry
 */

import { createLogger } from '../utils/logger'

const log = createLogger('PluginAPI')

// ============================================
// Plugin API Types
// ============================================

/** Lifecycle hooks a plugin can implement */
export interface PluginLifecycle {
  /** Called when the plugin is registered (one-time init) */
  onRegister?: () => void | Promise<void>
  /** Called when the plugin is activated (user enables it) */
  onActivate?: () => void | Promise<void>
  /** Called when the plugin is deactivated (user disables it) */
  onDeactivate?: () => void | Promise<void>
  /** Called when the plugin is unregistered (cleanup) */
  onUnregister?: () => void | Promise<void>
}

/** Storage backend interface — third-party storage providers implement this */
export interface StorageBackend {
  readonly type: 'local' | 'remote' | 'cloud'
  readonly displayName: string

  /** Test if the backend is reachable / configured */
  ping(): Promise<boolean>

  /** Read a file/blob by key */
  read(key: string): Promise<Uint8Array | null>

  /** Write a file/blob by key */
  write(key: string, data: Uint8Array): Promise<void>

  /** Delete a file/blob by key */
  delete(key: string): Promise<boolean>

  /** List all keys (optionally filtered by prefix) */
  list(prefix?: string): Promise<string[]>

  /** Get metadata for a key */
  stat?(key: string): Promise<{ size: number; lastModified: number } | null>
}

/** Command contribution — plugins can register new commands */
export interface PluginCommand {
  id: string
  label: string
  description?: string
  shortcut?: string
  handler: () => void | Promise<void>
}

/** Panel contribution — plugins can register new UI panels */
export interface PluginPanel {
  id: string
  title: string
  icon: string
  position: 'left' | 'right' | 'bottom'
  /** React component render function — returns JSX string for lazy evaluation */
  render?: () => any
}

/** The full plugin API object a plugin provides at registration */
export interface PluginAPI {
  /** Unique plugin identifier */
  readonly name: string
  /** Human-readable display name */
  readonly displayName: string
  /** Semantic version */
  readonly version: string
  /** Optional plugin description */
  readonly description?: string
  /** Optional author */
  readonly author?: string

  /** Lifecycle hooks */
  lifecycle?: PluginLifecycle

  /** Storage backend (if this plugin provides one) */
  storage?: StorageBackend

  /** Commands contributed by this plugin */
  commands?: PluginCommand[]

  /** Panels contributed by this plugin */
  panels?: PluginPanel[]

  /** Arbitrary plugin configuration */
  config?: Record<string, unknown>

  /** Plugin-specific API surface — any methods the plugin exposes */
  api?: Record<string, (...args: any[]) => any>
}

/** Internal registry entry */
interface PluginEntry {
  plugin: PluginAPI
  registeredAt: number
  isActive: boolean
}

// ============================================
// Plugin Registry (Singleton)
// ============================================

class PluginRegistry {
  private plugins: Map<string, PluginEntry> = new Map()
  private listeners: Set<(event: PluginEvent) => void> = new Set()

  /** Register a plugin */
  async registerPlugin(name: string, api: PluginAPI): Promise<void> {
    if (this.plugins.has(name)) {
      log.warn(`Plugin "${name}" is already registered. Replacing...`)
      await this.unregisterPlugin(name)
    }

    const entry: PluginEntry = {
      plugin: { ...api, name },
      registeredAt: Date.now(),
      isActive: false,
    }

    this.plugins.set(name, entry)

    // Call lifecycle hook
    try {
      await api.lifecycle?.onRegister?.()
    } catch (err) {
      log.error(`Plugin "${name}" onRegister hook failed`, err)
    }

    log.info(`Plugin registered: "${api.displayName}" v${api.version}`)
    this.emit({ type: 'registered', pluginName: name })
  }

  /** Unregister a plugin */
  async unregisterPlugin(name: string): Promise<boolean> {
    const entry = this.plugins.get(name)
    if (!entry) {
      log.warn(`Plugin "${name}" not found for unregister`)
      return false
    }

    // Deactivate first if active
    if (entry.isActive) {
      await this.deactivatePlugin(name)
    }

    // Call lifecycle hook
    try {
      await entry.plugin.lifecycle?.onUnregister?.()
    } catch (err) {
      log.error(`Plugin "${name}" onUnregister hook failed`, err)
    }

    this.plugins.delete(name)
    log.info(`Plugin unregistered: "${name}"`)
    this.emit({ type: 'unregistered', pluginName: name })
    return true
  }

  /** Activate a plugin */
  async activatePlugin(name: string): Promise<boolean> {
    const entry = this.plugins.get(name)
    if (!entry) {return false}
    if (entry.isActive) {return true}

    try {
      await entry.plugin.lifecycle?.onActivate?.()
      entry.isActive = true
      log.info(`Plugin activated: "${name}"`)
      this.emit({ type: 'activated', pluginName: name })
      return true
    } catch (err) {
      log.error(`Plugin "${name}" activation failed`, err)
      return false
    }
  }

  /** Deactivate a plugin */
  async deactivatePlugin(name: string): Promise<boolean> {
    const entry = this.plugins.get(name)
    if (!entry || !entry.isActive) {return false}

    try {
      await entry.plugin.lifecycle?.onDeactivate?.()
      entry.isActive = false
      log.info(`Plugin deactivated: "${name}"`)
      this.emit({ type: 'deactivated', pluginName: name })
      return true
    } catch (err) {
      log.error(`Plugin "${name}" deactivation failed`, err)
      return false
    }
  }

  /** Get a registered plugin by name */
  getPlugin(name: string): PluginAPI | undefined {
    return this.plugins.get(name)?.plugin
  }

  /** List all registered plugins */
  listPlugins(): Array<{ name: string; displayName: string; version: string; isActive: boolean; registeredAt: number }> {
    return Array.from(this.plugins.entries()).map(([name, entry]) => ({
      name,
      displayName: entry.plugin.displayName,
      version: entry.plugin.version,
      isActive: entry.isActive,
      registeredAt: entry.registeredAt,
    }))
  }

  /** Get all active storage backends */
  getStorageBackends(): Array<{ name: string; backend: StorageBackend }> {
    return Array.from(this.plugins.entries())
      .filter(([, entry]) => entry.isActive && entry.plugin.storage)
      .map(([name, entry]) => ({
        name,
        backend: entry.plugin.storage!,
      }))
  }

  /** Get all commands from active plugins */
  getCommands(): PluginCommand[] {
    return Array.from(this.plugins.values())
      .filter(entry => entry.isActive)
      .flatMap(entry => entry.plugin.commands || [])
  }

  /** Get all panels from active plugins */
  getPanels(): Array<PluginPanel & { pluginName: string }> {
    return Array.from(this.plugins.entries())
      .filter(([, entry]) => entry.isActive)
      .flatMap(([name, entry]) =>
        (entry.plugin.panels || []).map(panel => ({ ...panel, pluginName: name }))
      )
  }

  /** Execute a command by ID */
  async executeCommand(commandId: string): Promise<boolean> {
    const commands = this.getCommands()
    const cmd = commands.find(c => c.id === commandId)
    if (!cmd) {
      log.warn(`Command "${commandId}" not found`)
      return false
    }
    try {
      await cmd.handler()
      log.info(`Command executed: "${commandId}"`)
      return true
    } catch (err) {
      log.error(`Command "${commandId}" failed`, err)
      return false
    }
  }

  /** Call a plugin's API method */
  async callPluginAPI(pluginName: string, method: string, ...args: any[]): Promise<any> {
    const entry = this.plugins.get(pluginName)
    if (!entry || !entry.isActive) {
      throw new Error(`Plugin "${pluginName}" not found or not active`)
    }
    const fn = entry.plugin.api?.[method]
    if (!fn) {
      throw new Error(`Plugin "${pluginName}" has no API method "${method}"`)
    }
    return fn(...args)
  }

  /** Subscribe to plugin events */
  onEvent(listener: (event: PluginEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: PluginEvent) {
    this.listeners.forEach(fn => {
      try { fn(event) } catch { /* swallow listener errors */ }
    })
  }

  /** Reset the registry (for testing) */
  async reset(): Promise<void> {
    for (const name of Array.from(this.plugins.keys())) {
      await this.unregisterPlugin(name)
    }
  }
}

// ============================================
// Event Types
// ============================================

export type PluginEventType = 'registered' | 'unregistered' | 'activated' | 'deactivated'

export interface PluginEvent {
  type: PluginEventType
  pluginName: string
}

// ============================================
// Singleton Export
// ============================================

export const pluginRegistry = new PluginRegistry()

/** Convenience shorthand */
export const registerPlugin = (name: string, api: PluginAPI) => pluginRegistry.registerPlugin(name, api)
export const unregisterPlugin = (name: string) => pluginRegistry.unregisterPlugin(name)

// ============================================
// Built-in Example Plugins (for demo)
// ============================================

/** Example: Local SQLite storage backend plugin */
export const localSQLitePlugin: PluginAPI = {
  name: 'storage-sqlite',
  displayName: 'SQLite Storage',
  version: '1.0.0',
  description: 'Local SQLite file-based storage backend',
  author: 'YYC3 Team',
  lifecycle: {
    onRegister: () => log.info('[SQLite] Plugin registered'),
    onActivate: () => log.info('[SQLite] Database opened'),
    onDeactivate: () => log.info('[SQLite] Database closed'),
  },
  storage: {
    type: 'local',
    displayName: 'SQLite (Local)',
    ping: async () => true,
    read: async (key) => {
      log.debug(`[SQLite] READ ${key}`)
      return null // Simulated
    },
    write: async (key, data) => {
      log.debug(`[SQLite] WRITE ${key} (${data.byteLength} bytes)`)
    },
    delete: async (key) => {
      log.debug(`[SQLite] DELETE ${key}`)
      return true
    },
    list: async (prefix) => {
      log.debug(`[SQLite] LIST prefix="${prefix || ''}"`)
      return []
    },
    stat: async (key) => {
      return { size: 0, lastModified: Date.now() }
    },
  },
  commands: [
    {
      id: 'sqlite:vacuum',
      label: 'SQLite: Vacuum Database',
      description: 'Reclaim unused space in the SQLite database',
      handler: async () => { log.info('[SQLite] VACUUM executed') },
    },
  ],
}

/** Example: S3-compatible cloud storage backend plugin */
export const s3StoragePlugin: PluginAPI = {
  name: 'storage-s3',
  displayName: 'S3 Cloud Storage',
  version: '1.0.0',
  description: 'Amazon S3 / MinIO compatible cloud storage backend',
  author: 'YYC3 Team',
  lifecycle: {
    onRegister: () => log.info('[S3] Plugin registered'),
    onActivate: () => log.info('[S3] Connection established'),
    onDeactivate: () => log.info('[S3] Connection closed'),
  },
  storage: {
    type: 'cloud',
    displayName: 'Amazon S3',
    ping: async () => {
      await new Promise(r => setTimeout(r, 200))
      return true
    },
    read: async (key) => {
      log.debug(`[S3] GET s3://bucket/${key}`)
      return null
    },
    write: async (key, data) => {
      log.debug(`[S3] PUT s3://bucket/${key} (${data.byteLength} bytes)`)
    },
    delete: async (key) => {
      log.debug(`[S3] DELETE s3://bucket/${key}`)
      return true
    },
    list: async (prefix) => {
      log.debug(`[S3] LIST s3://bucket/${prefix || ''}`)
      return []
    },
    stat: async (key) => {
      return { size: 0, lastModified: Date.now() }
    },
  },
  config: {
    bucket: 'yyc3-workspace',
    region: 'us-east-1',
    endpoint: '',
  },
  commands: [
    {
      id: 's3:sync',
      label: 'S3: Sync Workspace',
      description: 'Synchronize local workspace with S3 bucket',
      handler: async () => { log.info('[S3] Workspace sync started') },
    },
  ],
  api: {
    setBucket: (bucket: string) => { log.info(`[S3] Bucket set to ${bucket}`) },
    setRegion: (region: string) => { log.info(`[S3] Region set to ${region}`) },
  },
}

/** Auto-register built-in example plugins */
export async function registerBuiltinPlugins(): Promise<void> {
  await pluginRegistry.registerPlugin('storage-sqlite', localSQLitePlugin)
  await pluginRegistry.registerPlugin('storage-s3', s3StoragePlugin)
  log.info('Built-in plugins registered (SQLite, S3)')
}

// ============================================
// Plugin Sandbox — Web Worker Isolation
// ============================================

export interface SandboxConfig {
  /** Maximum execution time in ms (default: 5000) */
  timeout?: number
  /** Maximum memory in MB (hint, not enforced in all environments) */
  maxMemoryMB?: number
  /** Allowed API surface to expose to the sandbox */
  allowedAPIs?: string[]
}

export interface SandboxMessage {
  id: string
  type: 'execute' | 'result' | 'error' | 'ping'
  method?: string
  args?: any[]
  result?: any
  error?: string
  stack?: string
}

const SANDBOX_WORKER_CODE = `
const allowedAPIs = new Set()

self.onmessage = function(e) {
  const msg = e.data
  if (msg.type === 'ping') {
    self.postMessage({ id: msg.id, type: 'result', result: 'pong' })
    return
  }
  if (msg.type === 'execute') {
    try {
      const fn = new Function('return (' + msg.method + ')')()
      const result = fn(...(msg.args || []))
      if (result && typeof result.then === 'function') {
        result
          .then((val) => self.postMessage({ id: msg.id, type: 'result', result: val }))
          .catch((err) => self.postMessage({ id: msg.id, type: 'error', error: String(err), stack: err?.stack }))
      } else {
        self.postMessage({ id: msg.id, type: 'result', result: result })
      }
    } catch (err) {
      self.postMessage({ id: msg.id, type: 'error', error: String(err), stack: err?.stack })
    }
  }
}
`

class PluginSandbox {
  private worker: Worker | null = null
  private iframe: HTMLIFrameElement | null = null
  private pendingRequests: Map<string, {
    resolve: (value: any) => void
    reject: (reason: any) => void
    timer: ReturnType<typeof setTimeout>
  }> = new Map()
  private config: Required<SandboxConfig>
  private messageId = 0

  constructor(config: SandboxConfig = {}) {
    this.config = {
      timeout: config.timeout || 5000,
      maxMemoryMB: config.maxMemoryMB || 50,
      allowedAPIs: config.allowedAPIs || [],
    }
  }

  private ensureWorker(): Worker {
    if (this.worker) {return this.worker}

    const blob = new Blob([SANDBOX_WORKER_CODE], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    this.worker = new Worker(url)
    URL.revokeObjectURL(url)

    this.worker.onmessage = (e: MessageEvent<SandboxMessage>) => {
      const msg = e.data
      const pending = this.pendingRequests.get(msg.id)
      if (!pending) {return}

      clearTimeout(pending.timer)
      this.pendingRequests.delete(msg.id)

      if (msg.type === 'result') {
        pending.resolve(msg.result)
      } else if (msg.type === 'error') {
        pending.reject(new SandboxExecutionError(msg.error || 'Unknown error', msg.stack))
      }
    }

    this.worker.onerror = (e) => {
      log.error('[Sandbox] Worker error', e.message)
    }

    return this.worker
  }

  async execute<T = any>(fn: (...args: any[]) => T, args: any[] = []): Promise<T> {
    const worker = this.ensureWorker()
    const id = String(++this.messageId)

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new SandboxTimeoutError(`Execution timed out after ${this.config.timeout}ms`))
      }, this.config.timeout)

      this.pendingRequests.set(id, { resolve, reject, timer })

      worker.postMessage({
        id,
        type: 'execute',
        method: fn.toString(),
        args,
      })
    })
  }

  async ping(): Promise<string> {
    const worker = this.ensureWorker()
    const id = String(++this.messageId)

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new SandboxTimeoutError('Ping timed out'))
      }, 3000)

      this.pendingRequests.set(id, { resolve, reject, timer })

      worker.postMessage({ id, type: 'ping' })
    })
  }

  createUIContainer(containerId: string): HTMLIFrameElement {
    if (this.iframe) {
      this.iframe.remove()
    }

    const iframe = document.createElement('iframe')
    iframe.id = containerId
    iframe.sandbox.add('allow-scripts')
    iframe.sandbox.add('allow-same-origin')
    iframe.style.border = 'none'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.display = 'block'

    document.body.appendChild(iframe)
    this.iframe = iframe

    log.info('[Sandbox] UI container iframe created', { containerId })
    return iframe
  }

  postToUI(message: any): void {
    if (!this.iframe?.contentWindow) {
      log.warn('[Sandbox] No UI container to post message to')
      return
    }
    this.iframe.contentWindow.postMessage(message, '*')
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    if (this.iframe) {
      this.iframe.remove()
      this.iframe = null
    }
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer)
      pending.reject(new Error('Sandbox destroyed'))
    }
    this.pendingRequests.clear()
    log.info('[Sandbox] Destroyed')
  }
}

// ============================================
// Sandbox Errors
// ============================================

export class SandboxExecutionError extends Error {
  constructor(message: string, public readonly stack?: string) {
    super(message)
    this.name = 'SandboxExecutionError'
  }
}

export class SandboxTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SandboxTimeoutError'
  }
}

// ============================================
// Sandboxed Plugin Registry
// ============================================

class SandboxedPluginRegistry extends PluginRegistry {
  private sandboxes: Map<string, PluginSandbox> = new Map()

  async activatePlugin(name: string): Promise<boolean> {
    const result = await super.activatePlugin(name)
    if (result) {
      const sandbox = new PluginSandbox({ timeout: 10000 })
      this.sandboxes.set(name, sandbox)
      log.info(`[Sandbox] Created for plugin "${name}"`)
    }
    return result
  }

  async deactivatePlugin(name: string): Promise<boolean> {
    const sandbox = this.sandboxes.get(name)
    if (sandbox) {
      sandbox.destroy()
      this.sandboxes.delete(name)
      log.info(`[Sandbox] Destroyed for plugin "${name}"`)
    }
    return super.deactivatePlugin(name)
  }

  async executeInSandbox<T = any>(pluginName: string, fn: (...args: any[]) => T, args?: any[]): Promise<T> {
    const sandbox = this.sandboxes.get(pluginName)
    if (!sandbox) {
      throw new Error(`No sandbox found for plugin "${pluginName}". Is it active?`)
    }
    return sandbox.execute(fn, args)
  }

  getSandbox(pluginName: string): PluginSandbox | undefined {
    return this.sandboxes.get(pluginName)
  }

  async callPluginAPI(pluginName: string, method: string, ...args: any[]): Promise<any> {
    const sandbox = this.sandboxes.get(pluginName)
    if (sandbox) {
      try {
        return await sandbox.execute((m: string, a: any[]) => {
          return { method: m, args: a }
        }, [method, args])
      } catch {
        return super.callPluginAPI(pluginName, method, ...args)
      }
    }
    return super.callPluginAPI(pluginName, method, ...args)
  }

  async reset(): Promise<void> {
    for (const [, sandbox] of this.sandboxes) {
      sandbox.destroy()
    }
    this.sandboxes.clear()
    await super.reset()
  }
}

export const sandboxedPluginRegistry = new SandboxedPluginRegistry()

export const registerSandboxedPlugin = (name: string, api: PluginAPI) =>
  sandboxedPluginRegistry.registerPlugin(name, api)
export const unregisterSandboxedPlugin = (name: string) =>
  sandboxedPluginRegistry.unregisterPlugin(name)
export const executeInSandbox = <T = any>(pluginName: string, fn: (...args: any[]) => T, args?: any[]) =>
  sandboxedPluginRegistry.executeInSandbox<T>(pluginName, fn, args)
