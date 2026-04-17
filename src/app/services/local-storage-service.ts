/**
 * @file local-storage-service.ts
 * @description YYC³ 本地存储服务 — IndexedDB (Dexie-style) + Web Crypto AES-GCM 加密 + 文件版本控制
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Implements the FEFS StorageService layer:
 *   - Repository pattern over IndexedDB (in-memory mock for browser sandbox)
 *   - AES-256-GCM encryption via Web Crypto API
 *   - File version control (immutable snapshots, history, rollback, diff)
 *   - Workspace management
 *   - DB connection profile CRUD (encrypted credentials)
 */

import { createLogger } from '../utils/logger'
import type {
  EncryptedPayload,
  CryptoService,
  FileMeta,
  FileVersion,
  Workspace,
  WorkspaceSettings,
  DBConnectionProfile,
  FileNode,
  FileDiff,
  DiffHunk,
} from '../types/storage'

const log = createLogger('LocalStorage')

/* ================================================================
   Web Crypto Service
   ================================================================ */

const ITERATIONS = 200_000
const ALGORITHM = 'AES-256-GCM' as const

class WebCryptoServiceImpl implements CryptoService {
  randomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length))
  }

  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    )
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial as CryptoKey,
      { name: 'AES-GCM', length: 256 } as any,
      false as boolean,
      ['encrypt', 'decrypt'] as KeyUsage[],
    )
  }

  async encrypt(plainText: string, password: string): Promise<EncryptedPayload> {
    const salt = this.randomBytes(16)
    const iv = this.randomBytes(12)
    const key = await this.deriveKey(password, salt)
    const ciphertext = await crypto.subtle.encrypt(
      new TextEncoder().encode(plainText) as any,
      key,
      (new TextEncoder().encode(plainText) as unknown as BufferSource),
    )
    return {
      iv: this.toBase64(iv),
      data: this.toBase64(new Uint8Array(ciphertext)),
      salt: this.toBase64(salt),
      algorithm: ALGORITHM,
      iterations: ITERATIONS,
    }
  }

  async decrypt(payload: EncryptedPayload, password: string): Promise<string> {
    const salt = this.fromBase64(payload.salt)
    const iv = this.fromBase64(payload.iv)
    const data = this.fromBase64(payload.data)
    const key = await this.deriveKey(password, salt)
    const decrypted = await crypto.subtle.decrypt(
      data as any,
      key,
      (data as unknown as BufferSource),
    )
    return new TextDecoder().decode(decrypted)
  }

  async hash(data: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private toBase64(arr: Uint8Array): string {
    let binary = ''
    for (const byte of arr) {binary += String.fromCharCode(byte)}
    return btoa(binary)
  }

  private fromBase64(str: string): Uint8Array {
    const binary = atob(str)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {bytes[i] = binary.charCodeAt(i)}
    return bytes
  }
}

export const cryptoService: CryptoService = new WebCryptoServiceImpl()

/* ================================================================
   In-Memory IndexedDB Mock (Dexie-compatible pattern)
   ================================================================ */

interface DBStore<T> {
  data: Map<string, T>
  put(key: string, value: T): void
  get(key: string): T | undefined
  delete(key: string): void
  toArray(): T[]
  where(predicate: (item: T) => boolean): T[]
  clear(): void
}

function createStore<T>(): DBStore<T> {
  const data = new Map<string, T>()
  return {
    data,
    put(key, value) { data.set(key, value) },
    get(key) { return data.get(key) },
    delete(key) { data.delete(key) },
    toArray() { return Array.from(data.values()) },
    where(predicate) { return Array.from(data.values()).filter(predicate) },
    clear() { data.clear() },
  }
}

/* ================================================================
   Local Database (YYC3AICodeDB)
   ================================================================ */

class AppDatabase {
  readonly files = createStore<FileMeta>()
  readonly versions = createStore<FileVersion>()
  readonly dbProfiles = createStore<DBConnectionProfile>()
  readonly workspaces = createStore<Workspace>()
  readonly cache = createStore<{ key: string; value: unknown; expires: number }>()

  constructor() {
    // Initialise default workspace
    const defaultWs: Workspace = {
      id: 'default',
      name: 'YYC³ Workspace',
      path: '/Documents/YYC3-AI-Code',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true,
      settings: {
        autoSave: true,
        autoSaveDelay: 3,
        encryptFiles: false,
        excludePatterns: ['node_modules', '.git', 'dist'],
        maxVersions: 50,
      },
    }
    this.workspaces.put(defaultWs.id, defaultWs)
    log.info('AppDatabase initialised (in-memory)')
  }
}

const db = new AppDatabase()

/* ================================================================
   File Version Service
   ================================================================ */

class FileVersionServiceImpl {
  private versionCounter = 0

  /**
   * Create a new version snapshot for a file.
   */
  async createVersion(path: string, content: string, author = 'system', message = 'Auto-save'): Promise<FileVersion> {
    const hash = await cryptoService.hash(content)
    const version: FileVersion = {
      id: `v-${++this.versionCounter}-${Date.now()}`,
      path,
      versionNumber: this.versionCounter,
      content,
      size: content.length,
      hash,
      createdAt: new Date().toISOString(),
      author,
      message,
    }
    db.versions.put(version.id, version)
    log.debug(`Version created: ${version.id} for ${path}`)
    return version
  }

  /**
   * Get version history for a file, newest first.
   */
  getHistory(path: string): FileVersion[] {
    return db.versions
      .where(v => v.path === path)
      .sort((a, b) => b.versionNumber - a.versionNumber)
  }

  /**
   * Get a specific version.
   */
  getVersion(versionId: string): FileVersion | undefined {
    return db.versions.get(versionId)
  }

  /**
   * Rollback a file to a previous version.
   */
  async rollback(path: string, versionId: string): Promise<string> {
    const version = db.versions.get(versionId)
    if (!version) {throw new Error(`Version not found: ${versionId}`)}
    if (version.path !== path) {throw new Error(`Version ${versionId} does not belong to ${path}`)}

    // Create a new version recording the rollback
    await this.createVersion(path, version.content, 'system', `Rollback to v${version.versionNumber}`)
    log.info(`Rolled back ${path} to version ${versionId}`)
    return version.content
  }

  /**
   * Compute a simple line diff between two strings.
   */
  diff(oldContent: string, newContent: string): FileDiff {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    const hunks: DiffHunk[] = []
    const lines: Array<{ type: '+' | '-' | ' '; content: string }> = []

    const maxLen = Math.max(oldLines.length, newLines.length)
    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]
      if (oldLine === newLine) {
        lines.push({ type: ' ', content: oldLine ?? '' })
      } else {
        if (oldLine !== undefined) {lines.push({ type: '-', content: oldLine })}
        if (newLine !== undefined) {lines.push({ type: '+', content: newLine })}
      }
    }

    if (lines.some(l => l.type !== ' ')) {
      hunks.push({
        oldStart: 1,
        oldLines: oldLines.length,
        newStart: 1,
        newLines: newLines.length,
        lines,
      })
    }

    return {
      type: oldContent === '' ? 'add' : newContent === '' ? 'remove' : 'modify',
      path: '',
      oldContent,
      newContent,
      hunks,
    }
  }

  /**
   * Compare two versions.
   */
  compare(versionAId: string, versionBId: string): FileDiff {
    const a = db.versions.get(versionAId)
    const b = db.versions.get(versionBId)
    if (!a) {throw new Error(`Version not found: ${versionAId}`)}
    if (!b) {throw new Error(`Version not found: ${versionBId}`)}
    const d = this.diff(a.content, b.content)
    d.path = a.path
    return d
  }

  /**
   * Prune old versions beyond maxVersions.
   */
  prune(path: string, maxVersions: number): void {
    const history = this.getHistory(path)
    if (history.length > maxVersions) {
      const toRemove = history.slice(maxVersions)
      for (const v of toRemove) {db.versions.delete(v.id)}
      log.info(`Pruned ${toRemove.length} old versions for ${path}`)
    }
  }
}

export const fileVersionService = new FileVersionServiceImpl()

/* ================================================================
   File Repository
   ================================================================ */

class FileRepositoryImpl {
  /**
   * Save or update a file with automatic versioning.
   */
  async save(path: string, content: string, message = 'Save'): Promise<FileMeta> {
    const version = await fileVersionService.createVersion(path, content, 'user', message)
    const now = new Date().toISOString()
    const existing = db.files.get(path)
    const workspace = this.getActiveWorkspace()

    const meta: FileMeta = {
      path,
      name: path.split('/').pop()!,
      workspace: workspace.path,
      type: 'file',
      mimeType: this.guessMimeType(path),
      size: content.length,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      currentVersionId: version.id,
      versionCount: (existing?.versionCount || 0) + 1,
      tags: existing?.tags || [],
      encrypted: workspace.settings.encryptFiles,
    }
    db.files.put(path, meta)

    // Prune old versions
    fileVersionService.prune(path, workspace.settings.maxVersions)

    log.debug(`File saved: ${path} (v${version.versionNumber})`)
    return meta
  }

  /**
   * Read file content (latest version).
   */
  read(path: string): string {
    const meta = db.files.get(path)
    if (!meta) {throw new Error(`File not found: ${path}`)}
    const version = fileVersionService.getVersion(meta.currentVersionId)
    if (!version) {throw new Error(`Version not found for: ${path}`)}
    return version.content
  }

  /**
   * Get file metadata.
   */
  getMeta(path: string): FileMeta | undefined {
    return db.files.get(path)
  }

  /**
   * List files in a directory.
   */
  list(dir: string): FileMeta[] {
    return db.files.where(f => {
      const parent = f.path.substring(0, f.path.lastIndexOf('/')) || '/'
      return parent === dir
    })
  }

  /**
   * Delete a file and all its versions.
   */
  delete(path: string): void {
    db.files.delete(path)
    const versions = fileVersionService.getHistory(path)
    for (const v of versions) {db.versions.delete(v.id)}
    log.info(`File deleted: ${path}`)
  }

  /**
   * Rename/move a file.
   */
  rename(oldPath: string, newPath: string): void {
    const meta = db.files.get(oldPath)
    if (!meta) {throw new Error(`File not found: ${oldPath}`)}
    db.files.delete(oldPath)
    meta.path = newPath
    meta.name = newPath.split('/').pop()!
    meta.updatedAt = new Date().toISOString()
    db.files.put(newPath, meta)
    log.info(`File renamed: ${oldPath} → ${newPath}`)
  }

  /**
   * Search files by name pattern.
   */
  search(query: string): FileMeta[] {
    const q = query.toLowerCase()
    return db.files.where(f => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
  }

  /**
   * Get all files.
   */
  getAll(): FileMeta[] {
    return db.files.toArray()
  }

  /* ── Helpers ── */

  private getActiveWorkspace(): Workspace {
    const ws = db.workspaces.where(w => w.active)
    return ws[0] || db.workspaces.toArray()[0]
  }

  private guessMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || ''
    const map: Record<string, string> = {
      ts: 'text/typescript', tsx: 'text/typescript',
      js: 'text/javascript', jsx: 'text/javascript',
      json: 'application/json', md: 'text/markdown',
      html: 'text/html', css: 'text/css',
      txt: 'text/plain', xml: 'application/xml',
      yaml: 'text/yaml', yml: 'text/yaml',
      svg: 'image/svg+xml', png: 'image/png',
      jpg: 'image/jpeg', gif: 'image/gif',
      pdf: 'application/pdf', zip: 'application/zip',
      sql: 'text/sql', rs: 'text/rust',
      toml: 'text/toml',
    }
    return map[ext] || 'application/octet-stream'
  }
}

export const fileRepository = new FileRepositoryImpl()

/* ================================================================
   Workspace Service
   ================================================================ */

class WorkspaceServiceImpl {
  getActive(): Workspace {
    const ws = db.workspaces.where(w => w.active)
    return ws[0] || db.workspaces.toArray()[0]
  }

  list(): Workspace[] {
    return db.workspaces.toArray()
  }

  create(name: string, path: string, settings?: Partial<WorkspaceSettings>): Workspace {
    const ws: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      path,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: false,
      settings: {
        autoSave: true,
        autoSaveDelay: 3,
        encryptFiles: false,
        excludePatterns: ['node_modules', '.git', 'dist'],
        maxVersions: 50,
        ...settings,
      },
    }
    db.workspaces.put(ws.id, ws)
    log.info(`Workspace created: ${name} @ ${path}`)
    return ws
  }

  setActive(id: string): void {
    for (const ws of db.workspaces.toArray()) {
      ws.active = ws.id === id
      db.workspaces.put(ws.id, ws)
    }
    log.info(`Active workspace set: ${id}`)
  }

  update(id: string, updates: Partial<Workspace>): void {
    const ws = db.workspaces.get(id)
    if (!ws) {throw new Error(`Workspace not found: ${id}`)}
    Object.assign(ws, updates, { updatedAt: new Date().toISOString() })
    db.workspaces.put(id, ws)
  }

  delete(id: string): void {
    db.workspaces.delete(id)
    log.info(`Workspace deleted: ${id}`)
  }
}

export const workspaceService = new WorkspaceServiceImpl()

/* ================================================================
   DB Connection Profile Repository
   ================================================================ */

class DBProfileRepositoryImpl {
  list(): DBConnectionProfile[] {
    return db.dbProfiles.toArray()
  }

  get(id: string): DBConnectionProfile | undefined {
    return db.dbProfiles.get(id)
  }

  add(profile: DBConnectionProfile): void {
    db.dbProfiles.put(profile.id, profile)
    log.info(`DB profile added: ${profile.name} (${profile.type})`)
  }

  update(profile: DBConnectionProfile): void {
    profile.updatedAt = new Date().toISOString()
    db.dbProfiles.put(profile.id, profile)
    log.info(`DB profile updated: ${profile.name}`)
  }

  remove(id: string): void {
    db.dbProfiles.delete(id)
    log.info(`DB profile removed: ${id}`)
  }

  /**
   * Save profile with encrypted password.
   */
  async addEncrypted(profile: DBConnectionProfile, masterPassword: string): Promise<void> {
    const encrypted = await cryptoService.encrypt(profile.password, masterPassword)
    this.add({ ...profile, password: JSON.stringify(encrypted) })
  }

  /**
   * Retrieve profile and decrypt password.
   */
  async getDecrypted(id: string, masterPassword: string): Promise<DBConnectionProfile | null> {
    const profile = this.get(id)
    if (!profile) {return null}
    try {
      const payload: EncryptedPayload = JSON.parse(profile.password)
      const plainPassword = await cryptoService.decrypt(payload, masterPassword)
      return { ...profile, password: plainPassword }
    } catch {
      // Password may not be encrypted (legacy), return as-is
      return profile
    }
  }
}

export const dbProfileRepository = new DBProfileRepositoryImpl()

/* ================================================================
   Generic Cache Store (TTL-based)
   ================================================================ */

class CacheStoreImpl {
  set<T>(key: string, value: T, ttlMs: number): void {
    db.cache.put(key, { key, value, expires: Date.now() + ttlMs })
  }

  get<T>(key: string): T | null {
    const entry = db.cache.get(key)
    if (!entry) {return null}
    if (entry.expires < Date.now()) {
      db.cache.delete(key)
      return null
    }
    return entry.value as T
  }

  delete(key: string): void {
    db.cache.delete(key)
  }

  clear(): void {
    db.cache.clear()
  }

  /** Remove all expired entries */
  cleanup(): number {
    const now = Date.now()
    const expired = db.cache.where(e => e.expires < now)
    for (const e of expired) {db.cache.delete(e.key)}
    return expired.length
  }
}

export const cacheStore = new CacheStoreImpl()

/* ================================================================
   Data Export / Import (GDPR compliance)
   ================================================================ */

export const dataExport = {
  /**
   * Export all local data as a JSON string (optionally encrypted).
   */
  async exportAll(password?: string): Promise<string> {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workspaces: db.workspaces.toArray(),
      files: db.files.toArray(),
      versions: db.versions.toArray(),
      dbProfiles: db.dbProfiles.toArray(),
    }
    const json = JSON.stringify(payload, null, 2)
    if (password) {
      const encrypted = await cryptoService.encrypt(json, password)
      return JSON.stringify(encrypted)
    }
    return json
  },

  /**
   * Import data from a previously exported JSON string.
   */
  async importAll(data: string, password?: string): Promise<void> {
    let json = data
    if (password) {
      try {
        const payload: EncryptedPayload = JSON.parse(data)
        json = await cryptoService.decrypt(payload, password)
      } catch {
        throw new Error('Decryption failed — wrong password or corrupted data')
      }
    }
    const parsed = JSON.parse(json)
    if (parsed.workspaces) {
      for (const ws of parsed.workspaces) {db.workspaces.put(ws.id, ws)}
    }
    if (parsed.files) {
      for (const f of parsed.files) {db.files.put(f.path, f)}
    }
    if (parsed.versions) {
      for (const v of parsed.versions) {db.versions.put(v.id, v)}
    }
    if (parsed.dbProfiles) {
      for (const p of parsed.dbProfiles) {db.dbProfiles.put(p.id, p)}
    }
    log.info('Data imported successfully')
  },

  /**
   * Delete ALL local data (GDPR "right to be forgotten").
   */
  deleteAll(): void {
    db.files.clear()
    db.versions.clear()
    db.dbProfiles.clear()
    db.cache.clear()
    // Keep workspaces but clear files
    log.warn('All local data deleted (GDPR compliance)')
  },
}
