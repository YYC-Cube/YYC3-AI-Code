/**
 * @file host-bridge-service.ts
 * @description YYC³ 宿主桥服务 — 统一文件系统、对话框、通知、剪贴板、密钥链抽象
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Implements the FEFS HostBridge abstraction layer.
 * In a Tauri environment it delegates to `@tauri-apps/api` invoke calls.
 * In a plain browser environment it provides mock/fallback implementations
 * using File System Access API, Notification API, localStorage, etc.
 */

import { createLogger } from '../utils/logger'
import type {
  HostBridge,
  HostBridgeCapabilities,
  DialogOptions,
  NotificationOptions,
  FileNode,
} from '../types/storage'

const log = createLogger('HostBridge')

/* ================================================================
   Runtime Detection
   ================================================================ */

const isTauri = (): boolean => {
  try {
    return !!(window as any).__TAURI_INTERNALS__
  } catch {
    return false
  }
}

/* ================================================================
   Browser Fallback Implementation
   ================================================================ */

class BrowserHostBridge implements HostBridge {
  private fileStore = new Map<string, string>()
  private dirStore = new Set<string>(['/'])
  private keychainStore = new Map<string, string>()

  getCapabilities(): HostBridgeCapabilities {
    return {
      fileSystem: 'showOpenFilePicker' in window,
      dialog: 'showOpenFilePicker' in window,
      notification: 'Notification' in window,
      clipboard: 'clipboard' in navigator,
      keychain: false, // No native keychain in browser; use localStorage fallback
      process: false,
      path: false,
      nativeMenu: false,
      systemTray: false,
      autoUpdate: false,
    }
  }

  /* ── File Dialog ── */

  async pickFile(options?: DialogOptions): Promise<string | null> {
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await (window as any).showOpenFilePicker({
          multiple: false,
          types: options?.filters?.map(f => ({
            description: f.name,
            accept: { '*/*': f.extensions.map(e => `.${e}`) },
          })),
        })
        const file: File = await handle.getFile()
        const content = await file.text()
        const path = `/${file.name}`
        this.fileStore.set(path, content)
        return path
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {return null}
      log.error('pickFile failed', e)
    }
    return null
  }

  async pickFiles(options?: DialogOptions): Promise<string[]> {
    try {
      if ('showOpenFilePicker' in window) {
        const handles = await (window as any).showOpenFilePicker({ multiple: true })
        const paths: string[] = []
        for (const handle of handles) {
          const file: File = await handle.getFile()
          const path = `/${file.name}`
          this.fileStore.set(path, await file.text())
          paths.push(path)
        }
        return paths
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {log.error('pickFiles failed', e)}
    }
    return []
  }

  async pickDirectory(_options?: DialogOptions): Promise<string | null> {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker()
        return `/${handle.name}`
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {log.error('pickDirectory failed', e)}
    }
    return null
  }

  async saveDialog(_options?: DialogOptions): Promise<string | null> {
    try {
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker()
        return `/${handle.name}`
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {log.error('saveDialog failed', e)}
    }
    return null
  }

  /* ── File Operations (in-memory mock) ── */

  async readTextFile(path: string): Promise<string> {
    const content = this.fileStore.get(path)
    if (content === undefined) {throw new Error(`File not found: ${path}`)}
    return content
  }

  async readBinaryFile(path: string): Promise<Uint8Array> {
    const content = this.fileStore.get(path)
    if (content === undefined) {throw new Error(`File not found: ${path}`)}
    return new TextEncoder().encode(content)
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    this.fileStore.set(path, content)
    this.ensureParentDir(path)
  }

  async writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
    this.fileStore.set(path, new TextDecoder().decode(data))
    this.ensureParentDir(path)
  }

  async deleteFile(path: string): Promise<void> {
    this.fileStore.delete(path)
    this.dirStore.delete(path)
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const content = this.fileStore.get(oldPath)
    if (content !== undefined) {
      this.fileStore.set(newPath, content)
      this.fileStore.delete(oldPath)
    }
    if (this.dirStore.has(oldPath)) {
      this.dirStore.add(newPath)
      this.dirStore.delete(oldPath)
    }
  }

  async createDirectory(path: string): Promise<void> {
    this.dirStore.add(path)
    this.ensureParentDir(path)
  }

  async listDirectory(dir: string): Promise<FileNode[]> {
    const now = new Date().toISOString()
    const nodes: FileNode[] = []

    // Files in this directory
    for (const [filePath, content] of this.fileStore.entries()) {
      const parent = filePath.substring(0, filePath.lastIndexOf('/')) || '/'
      if (parent === dir) {
        nodes.push({
          name: filePath.split('/').pop()!,
          path: filePath,
          type: 'file',
          size: content.length,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    // Subdirectories
    for (const dirPath of this.dirStore) {
      if (dirPath === dir) {continue}
      const parent = dirPath.substring(0, dirPath.lastIndexOf('/')) || '/'
      if (parent === dir) {
        nodes.push({
          name: dirPath.split('/').pop()!,
          path: dirPath,
          type: 'directory',
          size: 0,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    return nodes.sort((a, b) => {
      if (a.type !== b.type) {return a.type === 'directory' ? -1 : 1}
      return a.name.localeCompare(b.name)
    })
  }

  async exists(path: string): Promise<boolean> {
    return this.fileStore.has(path) || this.dirStore.has(path)
  }

  async getFileInfo(path: string): Promise<FileNode> {
    const now = new Date().toISOString()
    if (this.dirStore.has(path)) {
      return { name: path.split('/').pop()!, path, type: 'directory', size: 0, createdAt: now, updatedAt: now }
    }
    const content = this.fileStore.get(path)
    if (content !== undefined) {
      return { name: path.split('/').pop()!, path, type: 'file', size: content.length, createdAt: now, updatedAt: now }
    }
    throw new Error(`Path not found: ${path}`)
  }

  /* ── System ── */

  async notify(options: NotificationOptions): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(options.title, { body: options.body, icon: options.icon })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {new Notification(options.title, { body: options.body })}
    }
    log.info(`Notification: ${options.title} — ${options.body}`)
  }

  async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    }
  }

  async readClipboard(): Promise<string> {
    if (navigator.clipboard) {
      return await navigator.clipboard.readText()
    }
    return ''
  }

  /* ── Keychain (localStorage fallback — not secure for production) ── */

  async keychainSet(service: string, account: string, value: string): Promise<void> {
    const key = `yyc3_keychain:${service}:${account}`
    this.keychainStore.set(key, value)
    try { localStorage.setItem(key, btoa(value)) } catch { /* */ }
    log.debug(`Keychain set: ${service}/${account}`)
  }

  async keychainGet(service: string, account: string): Promise<string | null> {
    const key = `yyc3_keychain:${service}:${account}`
    const mem = this.keychainStore.get(key)
    if (mem) {return mem}
    try {
      const stored = localStorage.getItem(key)
      if (stored) {return atob(stored)}
    } catch { /* */ }
    return null
  }

  async keychainDelete(service: string, account: string): Promise<void> {
    const key = `yyc3_keychain:${service}:${account}`
    this.keychainStore.delete(key)
    try { localStorage.removeItem(key) } catch { /* */ }
  }

  /* ── Custom commands ── */

  async invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
    log.warn(`invoke("${command}") called in browser mode — returning mock`, args)
    return undefined as T
  }

  /* ── Helpers ── */

  private ensureParentDir(path: string): void {
    const parts = path.split('/')
    for (let i = 1; i < parts.length - 1; i++) {
      this.dirStore.add(parts.slice(0, i + 1).join('/'))
    }
  }
}

/* ================================================================
   Tauri Bridge Implementation (delegates to Tauri invoke)
   ================================================================ */

class TauriBridgeStub implements HostBridge {
  /**
   * In a real Tauri app this would use `@tauri-apps/api`.
   * Here we provide the typed stubs that mirror the expected Tauri commands.
   * When running inside Tauri, replace the body of each method with
   * actual `invoke(...)` calls.
   */

  private async tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri' as any)
      return await invoke(cmd, args)
    } catch {
      log.warn(`Tauri invoke fallback for: ${cmd}`)
      return undefined as T
    }
  }

  getCapabilities(): HostBridgeCapabilities {
    return {
      fileSystem: true,
      dialog: true,
      notification: true,
      clipboard: true,
      keychain: true,
      process: true,
      path: true,
      nativeMenu: true,
      systemTray: true,
      autoUpdate: true,
    }
  }

  async pickFile(options?: DialogOptions): Promise<string | null> {
    return this.tauriInvoke('plugin:dialog|open', { ...options, multiple: false, directory: false })
  }
  async pickFiles(options?: DialogOptions): Promise<string[]> {
    return (await this.tauriInvoke<string[]>('plugin:dialog|open', { ...options, multiple: true })) || []
  }
  async pickDirectory(options?: DialogOptions): Promise<string | null> {
    return this.tauriInvoke('plugin:dialog|open', { ...options, directory: true } as any)
  }
  async saveDialog(options?: DialogOptions): Promise<string | null> {
    return this.tauriInvoke('plugin:dialog|save', options as any)
  }

  async readTextFile(path: string): Promise<string> {
    return this.tauriInvoke('plugin:fs|read_text_file', { path })
  }
  async readBinaryFile(path: string): Promise<Uint8Array> {
    return this.tauriInvoke('plugin:fs|read_file', { path })
  }
  async writeTextFile(path: string, content: string): Promise<void> {
    return this.tauriInvoke('plugin:fs|write_text_file', { path, contents: content })
  }
  async writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
    return this.tauriInvoke('plugin:fs|write_file', { path, contents: Array.from(data) })
  }
  async deleteFile(path: string): Promise<void> {
    return this.tauriInvoke('plugin:fs|remove_file', { path })
  }
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    return this.tauriInvoke('plugin:fs|rename', { oldPath, newPath })
  }
  async createDirectory(path: string): Promise<void> {
    return this.tauriInvoke('plugin:fs|create_dir', { path, recursive: true })
  }
  async listDirectory(path: string): Promise<FileNode[]> {
    return (await this.tauriInvoke<FileNode[]>('plugin:fs|read_dir', { path })) || []
  }
  async exists(path: string): Promise<boolean> {
    return (await this.tauriInvoke<boolean>('plugin:fs|exists', { path })) ?? false
  }
  async getFileInfo(path: string): Promise<FileNode> {
    return this.tauriInvoke('plugin:fs|stat', { path })
  }

  async notify(options: NotificationOptions): Promise<void> {
    return this.tauriInvoke('plugin:notification|notify', options as any)
  }
  async copyToClipboard(text: string): Promise<void> {
    return this.tauriInvoke('plugin:clipboard-manager|write_text', { text })
  }
  async readClipboard(): Promise<string> {
    return (await this.tauriInvoke<string>('plugin:clipboard-manager|read_text')) || ''
  }

  async keychainSet(service: string, account: string, value: string): Promise<void> {
    return this.tauriInvoke('keychain_set', { service, account, value })
  }
  async keychainGet(service: string, account: string): Promise<string | null> {
    return this.tauriInvoke('keychain_get', { service, account })
  }
  async keychainDelete(service: string, account: string): Promise<void> {
    return this.tauriInvoke('keychain_delete', { service, account })
  }

  async invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
    return this.tauriInvoke(command, args)
  }
}

/* ================================================================
   Factory & Singleton
   ================================================================ */

function createHostBridge(): HostBridge {
  if (isTauri()) {
    log.info('Tauri environment detected — using TauriBridge')
    return new TauriBridgeStub()
  }
  log.info('Browser environment detected — using BrowserHostBridge (mock/fallback)')
  return new BrowserHostBridge()
}

export const hostBridge: HostBridge = createHostBridge()
