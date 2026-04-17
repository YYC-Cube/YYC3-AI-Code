/**
 * @file storage.ts
 * @description YYC³ 前端一体化本地存储类型定义 — FEFS 架构核心类型
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Covers: HostBridge, StorageService (IndexedDB + Crypto), WorkerService,
 *         PluginAPI, File versioning, Workspace management, Offline cache.
 */

/* ================================================================
   File System Types
   ================================================================ */

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  /** ISO-8601 */
  createdAt: string
  updatedAt: string
  /** MIME type for files */
  mimeType?: string
  children?: FileNode[]
  /** If file is locked */
  locked?: boolean
}

export interface FileVersion {
  id: string
  /** Absolute path of the file */
  path: string
  /** Version number (auto-increment) */
  versionNumber: number
  /** Content snapshot (encrypted blob) */
  content: string
  /** Size in bytes */
  size: number
  /** SHA-256 hash of content */
  hash: string
  /** ISO-8601 */
  createdAt: string
  /** Author / source */
  author: string
  /** Commit-style message */
  message: string
}

export interface FileMeta {
  path: string
  name: string
  workspace: string
  type: 'file' | 'directory'
  mimeType: string
  size: number
  createdAt: string
  updatedAt: string
  currentVersionId: string
  versionCount: number
  tags: string[]
  encrypted: boolean
}

export interface FileDiff {
  type: 'add' | 'remove' | 'modify'
  path: string
  oldContent?: string
  newContent?: string
  /** Line-level diff hunks */
  hunks: DiffHunk[]
}

export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: Array<{ type: '+' | '-' | ' '; content: string }>
}

/* ================================================================
   Workspace
   ================================================================ */

export interface Workspace {
  id: string
  name: string
  path: string
  createdAt: string
  updatedAt: string
  /** Whether this is the active workspace */
  active: boolean
  /** Settings specific to this workspace */
  settings: WorkspaceSettings
}

export interface WorkspaceSettings {
  autoSave: boolean
  autoSaveDelay: number
  encryptFiles: boolean
  excludePatterns: string[]
  maxVersions: number
}

/* ================================================================
   Host Bridge Types (Tauri / Electron abstraction)
   ================================================================ */

export interface HostBridgeCapabilities {
  fileSystem: boolean
  dialog: boolean
  notification: boolean
  clipboard: boolean
  keychain: boolean
  process: boolean
  path: boolean
  nativeMenu: boolean
  systemTray: boolean
  autoUpdate: boolean
}

export interface DialogOptions {
  title?: string
  defaultPath?: string
  multiple?: boolean
  directory?: boolean
  filters?: Array<{ name: string; extensions: string[] }>
}

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  sound?: boolean
}

export interface HostBridge {
  /** Check available native capabilities */
  getCapabilities(): HostBridgeCapabilities

  /** File operations */
  pickFile(options?: DialogOptions): Promise<string | null>
  pickFiles(options?: DialogOptions): Promise<string[]>
  pickDirectory(options?: DialogOptions): Promise<string | null>
  saveDialog(options?: DialogOptions): Promise<string | null>

  readTextFile(path: string): Promise<string>
  readBinaryFile(path: string): Promise<Uint8Array>
  writeTextFile(path: string, content: string): Promise<void>
  writeBinaryFile(path: string, data: Uint8Array): Promise<void>
  deleteFile(path: string): Promise<void>
  renameFile(oldPath: string, newPath: string): Promise<void>
  createDirectory(path: string): Promise<void>
  listDirectory(path: string): Promise<FileNode[]>
  exists(path: string): Promise<boolean>
  getFileInfo(path: string): Promise<FileNode>

  /** System */
  notify(options: NotificationOptions): Promise<void>
  copyToClipboard(text: string): Promise<void>
  readClipboard(): Promise<string>

  /** Keychain */
  keychainSet(service: string, account: string, value: string): Promise<void>
  keychainGet(service: string, account: string): Promise<string | null>
  keychainDelete(service: string, account: string): Promise<void>

  /** Custom native commands */
  invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T>
}

/* ================================================================
   Encryption / Crypto
   ================================================================ */

export interface EncryptedPayload {
  /** AES-GCM initialisation vector (12 bytes, base64) */
  iv: string
  /** AES-GCM ciphertext (base64) */
  data: string
  /** PBKDF2 salt (16 bytes, base64) */
  salt: string
  /** Algorithm identifier */
  algorithm: 'AES-256-GCM'
  /** Key derivation iterations */
  iterations: number
}

export interface CryptoService {
  /** Derive an AES-256 key from password + salt */
  deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>
  /** Encrypt plaintext → EncryptedPayload */
  encrypt(plainText: string, password: string): Promise<EncryptedPayload>
  /** Decrypt EncryptedPayload → plaintext */
  decrypt(payload: EncryptedPayload, password: string): Promise<string>
  /** SHA-256 hash */
  hash(data: string): Promise<string>
  /** Generate random bytes */
  randomBytes(length: number): Uint8Array
}

/* ================================================================
   Local Database Types
   ================================================================ */

export type DBEngineType = 'postgresql' | 'mysql' | 'redis' | 'sqlite'

export interface DetectedEngine {
  type: DBEngineType
  version: string
  defaultPort: number
  status: 'running' | 'stopped' | 'unknown'
  configPath?: string
}

export interface DBConnectionProfile {
  id: string
  name: string
  type: DBEngineType
  host: string
  port: number
  username: string
  /** Encrypted */
  password: string
  database: string
  ssl: boolean
  defaultSchema?: string
  color?: string
  createdAt: string
  updatedAt: string
}

export interface ConnectionTestResult {
  success: boolean
  latency: number
  version?: string
  error?: string
}

export interface TableInfo {
  name: string
  schema: string
  type: 'table' | 'view'
  rowCount: number
  size: string
  comment?: string
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue: string | null
  primaryKey: boolean
  autoIncrement: boolean
  comment?: string
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  affectedRows: number
  executionTime: number
  /** For paginated results */
  hasMore: boolean
  totalRows?: number
}

export interface DumpOptions {
  /** Include schema (CREATE TABLE) */
  schema: boolean
  /** Include data (INSERT) */
  data: boolean
  /** Compress output */
  compress: boolean
  /** Encrypt output */
  encrypt: boolean
  /** Specific tables (empty = all) */
  tables: string[]
}

/* ================================================================
   Worker Service Types
   ================================================================ */

export type WorkerTaskType = 'diff' | 'paging' | 'crypto' | 'hash' | 'search' | 'compress'

export interface WorkerTask<TInput = unknown, TOutput = unknown> {
  id: string
  type: WorkerTaskType
  input: TInput
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  result?: TOutput
  error?: string
  startedAt?: number
  completedAt?: number
}

export interface WorkerPoolConfig {
  /** Maximum concurrent workers */
  maxWorkers: number
  /** Task timeout (ms) */
  taskTimeout: number
  /** Auto-terminate idle workers after (ms) */
  idleTimeout: number
}

/* ================================================================
   Plugin API Types
   ================================================================ */

export interface PluginManifest {
  id: string
  name: string
  displayName: string
  version: string
  description: string
  author: string
  /** Plugin type */
  type: 'storage' | 'ai-provider' | 'sync' | 'editor' | 'theme' | 'tool'
  /** Required capabilities */
  capabilities: string[]
  /** Entry point */
  main: string
  /** Icon name (Lucide) */
  icon?: string
  /** Plugin-specific configuration schema */
  configSchema?: Record<string, unknown>
}

export interface PluginContext {
  /** Plugin manifest */
  manifest: PluginManifest
  /** Logger scoped to this plugin */
  logger: { debug: (...args: unknown[]) => void; info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void; error: (...args: unknown[]) => void }
  /** Access to host bridge */
  hostBridge: HostBridge
  /** Access to storage */
  storage: {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T): Promise<void>
    delete(key: string): Promise<void>
  }
  /** Plugin config */
  config: Record<string, unknown>
}

export interface Plugin {
  /** Called when the plugin is loaded */
  initialize(context: PluginContext): Promise<void>
  /** Called when the plugin is unloaded */
  dispose(): Promise<void>
  /** Plugin API exposed to the app */
  api: Record<string, (...args: unknown[]) => unknown>
}

export interface PluginRegistry {
  register(manifest: PluginManifest, factory: (ctx: PluginContext) => Plugin): void
  unregister(pluginId: string): void
  get(pluginId: string): Plugin | undefined
  list(): PluginManifest[]
  enable(pluginId: string): Promise<void>
  disable(pluginId: string): Promise<void>
  isEnabled(pluginId: string): boolean
}

/* ================================================================
   Offline / Cache Types
   ================================================================ */

export interface CacheEntry<T = unknown> {
  key: string
  value: T
  /** Expiry timestamp (ms) */
  expires: number
  /** Created timestamp (ms) */
  createdAt: number
  /** Size in bytes (estimated) */
  size: number
}

export interface OfflineSyncQueue {
  id: string
  type: 'ai-chat' | 'file-sync' | 'backup'
  payload: unknown
  retries: number
  maxRetries: number
  createdAt: number
  lastAttempt?: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

/* ================================================================
   Composite Service Interfaces
   ================================================================ */

export interface FileService {
  getWorkspace(): Promise<Workspace>
  setWorkspace(path: string): Promise<void>
  listWorkspaces(): Promise<Workspace[]>
  browse(dir?: string): Promise<FileNode[]>
  open(path: string): Promise<string>
  save(path: string, content: string, message?: string): Promise<void>
  delete(path: string): Promise<void>
  rename(oldPath: string, newPath: string): Promise<void>
  createFile(path: string, initialContent?: string): Promise<void>
  createFolder(path: string): Promise<void>
  upload(file: File, destPath: string): Promise<void>
  download(srcPath: string, suggestedName?: string): Promise<void>
  getHistory(path: string): Promise<FileVersion[]>
  rollback(path: string, versionId: string): Promise<void>
  compare(path: string, versionA: string, versionB: string): Promise<FileDiff>
  search(query: string, dir?: string): Promise<FileNode[]>
}

export interface DBService {
  detectEngines(): Promise<DetectedEngine[]>
  listProfiles(): Promise<DBConnectionProfile[]>
  addProfile(profile: DBConnectionProfile): Promise<void>
  editProfile(profile: DBConnectionProfile): Promise<void>
  removeProfile(id: string): Promise<void>
  testConnection(profile: DBConnectionProfile): Promise<ConnectionTestResult>
  listSchemas(connId: string): Promise<string[]>
  listTables(connId: string, schema: string): Promise<TableInfo[]>
  getColumns(connId: string, schema: string, table: string): Promise<ColumnInfo[]>
  runQuery(connId: string, sql: string, opts?: { limit?: number; offset?: number }): Promise<QueryResult>
  dump(connId: string, destPath: string, opts?: DumpOptions): Promise<void>
  restore(connId: string, dumpFile: string): Promise<void>
}
