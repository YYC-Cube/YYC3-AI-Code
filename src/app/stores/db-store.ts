/**
 * @file db-store.ts
 * @description Local-Database Manager store — 连接配置管理、引擎自动发现、SQL 执行、表浏览、表数据 CRUD、备份恢复、分页、导出
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags database, connection-manager, sql-console, table-explorer, auto-discovery, crud, backup, export
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'
import { BackupWorker, PagingWorker } from '../services/worker-service'
import type { BackupProgress, RestoreProgress } from '../services/worker-service'

const log = createLogger('DBStore')

// ============================================
// Types
// ============================================

export type DBEngineType = 'postgresql' | 'mysql' | 'redis' | 'sqlite'

export interface DetectedEngine {
  type: DBEngineType
  version: string
  defaultPort: number
  isRunning: boolean
  configPath?: string
  dataDir?: string
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface DBConnectionProfile {
  id: string
  name: string
  type: DBEngineType
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl: boolean
  color: string
  createdAt: number
  updatedAt: number
  lastConnected?: number
  status: ConnectionStatus
  errorMessage?: string
}

export interface TableInfo {
  name: string
  schema: string
  type: 'table' | 'view'
  rowCount: number
  size: string
  columns: ColumnInfo[]
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  defaultValue?: string
  comment?: string
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTime: number
  affectedRows?: number
  error?: string
}

export interface QueryHistoryEntry {
  id: string
  connectionId: string
  sql: string
  timestamp: number
  executionTime: number
  rowCount: number
  success: boolean
  error?: string
}

export interface SchemaInfo {
  name: string
  tables: TableInfo[]
}

// Pagination
export interface PaginationState {
  page: number
  pageSize: number
  totalRows: number
  totalPages: number
}

// Table Data CRUD
export interface TableDataState {
  profileId: string
  schema: string
  table: string
  columns: ColumnInfo[]
  rows: Record<string, unknown>[]
  pagination: PaginationState
  isLoading: boolean
  editingCell: { rowIndex: number; column: string } | null
  editingValue: string
  newRowDraft: Record<string, string> | null
}

// Backup
export type BackupStatus = 'idle' | 'running' | 'completed' | 'failed'
export interface BackupEntry {
  id: string
  profileId: string
  profileName: string
  engineType: DBEngineType
  database: string
  timestamp: number
  size: string
  format: 'sql' | 'binary' | 'rdb'
  encrypted: boolean
  status: BackupStatus
  filePath: string
  errorMessage?: string
}

// ============================================
// Simulated Data
// ============================================

const MOCK_DETECTED_ENGINES: DetectedEngine[] = [
  { type: 'postgresql', version: '16.2', defaultPort: 5432, isRunning: true, configPath: '/etc/postgresql/16/main/postgresql.conf', dataDir: '/var/lib/postgresql/16/main' },
  { type: 'mysql', version: '8.0.36', defaultPort: 3306, isRunning: true, configPath: '/etc/mysql/my.cnf', dataDir: '/var/lib/mysql' },
  { type: 'redis', version: '7.2.4', defaultPort: 6379, isRunning: true, configPath: '/etc/redis/redis.conf', dataDir: '/var/lib/redis' },
  { type: 'sqlite', version: '3.45.1', defaultPort: 0, isRunning: true },
]

const DEFAULT_PROFILES: DBConnectionProfile[] = [
  { id: 'pg-local', name: 'PostgreSQL Local', type: 'postgresql', host: 'localhost', port: 5432, username: 'postgres', password: '', database: 'yyc3_dev', ssl: false, color: '#336791', createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 2, lastConnected: Date.now() - 3600000, status: 'disconnected' },
  { id: 'mysql-local', name: 'MySQL Local', type: 'mysql', host: 'localhost', port: 3306, username: 'root', password: '', database: 'yyc3_app', ssl: false, color: '#00758f', createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000, status: 'disconnected' },
  { id: 'redis-local', name: 'Redis Local', type: 'redis', host: 'localhost', port: 6379, username: '', password: '', database: '0', ssl: false, color: '#DC382D', createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000, status: 'disconnected' },
]

const MOCK_SCHEMAS: Record<string, SchemaInfo[]> = {
  'pg-local': [{
    name: 'public',
    tables: [
      { name: 'users', schema: 'public', type: 'table', rowCount: 1247, size: '256 KB', columns: [
        { name: 'id', type: 'serial', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'username', type: 'varchar(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'email', type: 'varchar(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'NOW()' },
        { name: 'is_active', type: 'boolean', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'true' },
      ]},
      { name: 'projects', schema: 'public', type: 'table', rowCount: 89, size: '64 KB', columns: [
        { name: 'id', type: 'serial', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'name', type: 'varchar(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'owner_id', type: 'integer', nullable: false, isPrimaryKey: false, isForeignKey: true, comment: 'FK -> users.id' },
        { name: 'status', type: 'varchar(50)', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: "'draft'" },
        { name: 'created_at', type: 'timestamp', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'NOW()' },
      ]},
      { name: 'sessions', schema: 'public', type: 'table', rowCount: 3421, size: '512 KB', columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: 'gen_random_uuid()' },
        { name: 'user_id', type: 'integer', nullable: false, isPrimaryKey: false, isForeignKey: true },
        { name: 'token', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'expires_at', type: 'timestamp', nullable: false, isPrimaryKey: false, isForeignKey: false },
      ]},
      { name: 'audit_log', schema: 'public', type: 'table', rowCount: 15832, size: '2.1 MB', columns: [
        { name: 'id', type: 'bigserial', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'action', type: 'varchar(100)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'user_id', type: 'integer', nullable: true, isPrimaryKey: false, isForeignKey: true },
        { name: 'payload', type: 'jsonb', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'timestamp', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'NOW()' },
      ]},
      { name: 'active_users_view', schema: 'public', type: 'view', rowCount: 0, size: '0 B', columns: [
        { name: 'id', type: 'serial', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'username', type: 'varchar(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'email', type: 'varchar(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
      ]},
    ],
  }],
  'mysql-local': [{
    name: 'yyc3_app',
    tables: [
      { name: 'components', schema: 'yyc3_app', type: 'table', rowCount: 234, size: '128 KB', columns: [
        { name: 'id', type: 'INT AUTO_INCREMENT', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'name', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'category', type: 'VARCHAR(100)', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'code', type: 'LONGTEXT', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'DATETIME', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'CURRENT_TIMESTAMP' },
      ]},
      { name: 'templates', schema: 'yyc3_app', type: 'table', rowCount: 45, size: '32 KB', columns: [
        { name: 'id', type: 'INT AUTO_INCREMENT', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'title', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'content', type: 'LONGTEXT', nullable: true, isPrimaryKey: false, isForeignKey: false },
      ]},
    ],
  }],
}

const MOCK_TABLE_DATA: Record<string, Record<string, unknown>[]> = {
  'pg-local:public:users': [
    { id: 1, username: 'admin', email: 'admin@yyc3.dev', created_at: '2026-01-15 09:00:00', is_active: true },
    { id: 2, username: 'developer', email: 'dev@yyc3.dev', created_at: '2026-01-20 14:30:00', is_active: true },
    { id: 3, username: 'tester', email: 'test@yyc3.dev', created_at: '2026-02-01 10:15:00', is_active: true },
    { id: 4, username: 'designer', email: 'design@yyc3.dev', created_at: '2026-02-10 16:45:00', is_active: false },
    { id: 5, username: 'pm_wang', email: 'wang@yyc3.dev', created_at: '2026-02-15 08:20:00', is_active: true },
    { id: 6, username: 'devops_li', email: 'li@yyc3.dev', created_at: '2026-02-20 11:30:00', is_active: true },
    { id: 7, username: 'analyst_zhao', email: 'zhao@yyc3.dev', created_at: '2026-02-25 09:45:00', is_active: true },
    { id: 8, username: 'intern_chen', email: 'chen@yyc3.dev', created_at: '2026-03-01 13:00:00', is_active: false },
    { id: 9, username: 'lead_sun', email: 'sun@yyc3.dev', created_at: '2026-03-05 07:15:00', is_active: true },
    { id: 10, username: 'qa_liu', email: 'liu@yyc3.dev', created_at: '2026-03-10 10:00:00', is_active: true },
  ],
  'pg-local:public:projects': [
    { id: 1, name: 'YYC³ AI Code', owner_id: 1, status: 'active', created_at: '2026-01-15 09:00:00' },
    { id: 2, name: 'Dashboard v2', owner_id: 2, status: 'active', created_at: '2026-02-01 10:00:00' },
    { id: 3, name: 'Mobile App', owner_id: 5, status: 'draft', created_at: '2026-02-15 14:00:00' },
    { id: 4, name: 'API Gateway', owner_id: 6, status: 'active', created_at: '2026-03-01 08:00:00' },
    { id: 5, name: 'Design System', owner_id: 4, status: 'archived', created_at: '2026-03-05 16:00:00' },
  ],
}

const MOCK_QUERY_RESULTS: Record<string, QueryResult> = {
  'SELECT * FROM users LIMIT 10': {
    columns: ['id', 'username', 'email', 'created_at', 'is_active'],
    rows: MOCK_TABLE_DATA['pg-local:public:users']!,
    rowCount: 10,
    executionTime: 12,
  },
  'SELECT COUNT(*) as total FROM users': {
    columns: ['total'],
    rows: [{ total: 1247 }],
    rowCount: 1,
    executionTime: 3,
  },
}

const MOCK_BACKUPS: BackupEntry[] = [
  { id: 'bk_001', profileId: 'pg-local', profileName: 'PostgreSQL Local', engineType: 'postgresql', database: 'yyc3_dev', timestamp: Date.now() - 86400000 * 3, size: '12.4 MB', format: 'sql', encrypted: true, status: 'completed', filePath: '/backups/pg_yyc3_dev_20260311.sql.enc' },
  { id: 'bk_002', profileId: 'mysql-local', profileName: 'MySQL Local', engineType: 'mysql', database: 'yyc3_app', timestamp: Date.now() - 86400000 * 7, size: '5.8 MB', format: 'sql', encrypted: false, status: 'completed', filePath: '/backups/mysql_yyc3_app_20260307.sql' },
  { id: 'bk_003', profileId: 'redis-local', profileName: 'Redis Local', engineType: 'redis', database: '0', timestamp: Date.now() - 86400000 * 1, size: '1.2 MB', format: 'rdb', encrypted: false, status: 'completed', filePath: '/backups/redis_dump_20260313.rdb' },
]

// ============================================
// Store
// ============================================

export type RightBottomTab = 'terminal' | 'files' | 'database'

interface DBState {
  // Engine discovery
  detectedEngines: DetectedEngine[]
  isDiscovering: boolean
  discoverEngines: () => Promise<void>

  // Connection profiles
  profiles: DBConnectionProfile[]
  activeProfileId: string | null
  setActiveProfile: (id: string | null) => void
  addProfile: (profile: Omit<DBConnectionProfile, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void
  updateProfile: (id: string, updates: Partial<DBConnectionProfile>) => void
  removeProfile: (id: string) => void
  duplicateProfile: (id: string) => void

  // Edit dialog
  editingProfile: DBConnectionProfile | null
  setEditingProfile: (profile: DBConnectionProfile | null) => void
  saveEditingProfile: (updates: Partial<DBConnectionProfile>) => void

  // Connection actions
  connectProfile: (id: string) => Promise<void>
  disconnectProfile: (id: string) => void
  testConnection: (id: string) => Promise<boolean>

  // Schema browsing
  schemas: Record<string, SchemaInfo[]>
  loadSchemas: (profileId: string) => Promise<void>
  expandedSchemas: Set<string>
  expandedTables: Set<string>
  toggleSchemaExpand: (key: string) => void
  toggleTableExpand: (key: string) => void
  selectedTable: { profileId: string; schema: string; table: string } | null
  selectTable: (profileId: string, schema: string, table: string) => void

  // Table Data CRUD
  tableData: TableDataState | null
  loadTableData: (profileId: string, schema: string, table: string, page?: number) => Promise<void>
  startEditingCell: (rowIndex: number, column: string) => void
  setEditingValue: (value: string) => void
  commitCellEdit: () => void
  cancelCellEdit: () => void
  startNewRow: () => void
  cancelNewRow: () => void
  updateNewRowField: (column: string, value: string) => void
  commitNewRow: () => void
  deleteRow: (rowIndex: number) => void
  setTablePage: (page: number) => void
  setTablePageSize: (size: number) => void

  // SQL Console
  sqlInput: string
  setSqlInput: (sql: string) => void
  queryResults: QueryResult | null
  isExecuting: boolean
  executeQuery: (profileId: string, sql: string) => Promise<void>
  queryHistory: QueryHistoryEntry[]
  clearQueryHistory: () => void

  // Pagination for query results
  queryPagination: PaginationState
  setQueryPage: (page: number) => void
  setQueryPageSize: (size: number) => void

  // PagingWorker dataset tracking
  queryDatasetId: string | null

  // Export
  exportResults: (format: 'csv' | 'json') => void

  // Backup & Restore
  backups: BackupEntry[]
  isBackingUp: boolean
  isRestoring: boolean
  backupProgress: BackupProgress | null
  restoreProgress: RestoreProgress | null
  createBackup: (profileId: string, encrypted: boolean) => Promise<void>
  restoreBackup: (backupId: string) => Promise<void>
  deleteBackup: (backupId: string) => void

  // Bottom panel tab
  rightBottomTab: RightBottomTab
  setRightBottomTab: (tab: RightBottomTab) => void

  // Utility
  getProfileById: (id: string) => DBConnectionProfile | undefined
  getConnectedProfiles: () => DBConnectionProfile[]
  getEngineIcon: (type: DBEngineType) => string
  getEngineColor: (type: DBEngineType) => string
}

export const useDBStore = create<DBState>()(persist((set, get) => ({
  // Engine discovery
  detectedEngines: [],
  isDiscovering: false,
  discoverEngines: async () => {
    set({ isDiscovering: true })
    log.info('Starting engine discovery...')
    await new Promise(r => setTimeout(r, 1500))
    set({ detectedEngines: MOCK_DETECTED_ENGINES, isDiscovering: false })
    log.info('Engine discovery completed', { count: MOCK_DETECTED_ENGINES.length })
  },

  // Connection profiles
  profiles: DEFAULT_PROFILES,
  activeProfileId: DEFAULT_PROFILES[0]?.id || null,
  setActiveProfile: (id) => set({ activeProfileId: id }),

  addProfile: (data) => {
    const id = `db_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const profile: DBConnectionProfile = { ...data, id, createdAt: Date.now(), updatedAt: Date.now(), status: 'disconnected' }
    const updated = [...get().profiles, profile]
    log.info('Profile added', { id, name: data.name })
    set({ profiles: updated, activeProfileId: id })
  },

  updateProfile: (id, updates) => {
    const updated = get().profiles.map(p => p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p)
    set({ profiles: updated })
  },

  removeProfile: (id) => {
    const updated = get().profiles.filter(p => p.id !== id)
    const activeId = get().activeProfileId === id ? (updated[0]?.id || null) : get().activeProfileId
    log.info('Profile removed', { id })
    set({ profiles: updated, activeProfileId: activeId })
  },

  duplicateProfile: (id) => {
    const source = get().profiles.find(p => p.id === id)
    if (!source) {return}
    get().addProfile({ ...source, name: `${source.name} (副本)` })
  },

  // Edit dialog
  editingProfile: null,
  setEditingProfile: (profile) => set({ editingProfile: profile }),
  saveEditingProfile: (updates) => {
    const editing = get().editingProfile
    if (!editing) {return}
    get().updateProfile(editing.id, updates)
    set({ editingProfile: null })
    log.info('Profile updated via dialog', { id: editing.id })
  },

  // Connection actions
  connectProfile: async (id) => {
    const profile = get().profiles.find(p => p.id === id)
    if (!profile) {return}
    get().updateProfile(id, { status: 'connecting', errorMessage: undefined })
    log.info('Connecting...', { id, host: profile.host, port: profile.port })
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700))
    const success = Math.random() > 0.2
    if (success) {
      get().updateProfile(id, { status: 'connected', lastConnected: Date.now(), errorMessage: undefined })
      log.info('Connected', { id })
      get().loadSchemas(id)
    } else {
      get().updateProfile(id, { status: 'error', errorMessage: `Connection refused: ${profile.host}:${profile.port} — ECONNREFUSED` })
      log.warn('Connection failed', { id })
    }
  },

  disconnectProfile: (id) => {
    get().updateProfile(id, { status: 'disconnected', errorMessage: undefined })
    log.info('Disconnected', { id })
  },

  testConnection: async (id) => {
    const profile = get().profiles.find(p => p.id === id)
    if (!profile) {return false}
    get().updateProfile(id, { status: 'connecting' })
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
    const success = Math.random() > 0.15
    get().updateProfile(id, { status: success ? 'disconnected' : 'error', errorMessage: success ? undefined : 'Connection test failed' })
    return success
  },

  // Schema browsing
  schemas: {},
  expandedSchemas: new Set<string>(),
  expandedTables: new Set<string>(),
  selectedTable: null,

  loadSchemas: async (profileId) => {
    await new Promise(r => setTimeout(r, 300))
    const mockSchemas = MOCK_SCHEMAS[profileId] || [{ name: 'default', tables: [{ name: 'sample_table', schema: 'default', type: 'table' as const, rowCount: 0, size: '0 B', columns: [{ name: 'id', type: 'INT', nullable: false, isPrimaryKey: true, isForeignKey: false }] }] }]
    set(s => ({ schemas: { ...s.schemas, [profileId]: mockSchemas } }))
    log.debug('Schemas loaded', { profileId, count: mockSchemas.length })
  },

  toggleSchemaExpand: (key) => set(s => { const next = new Set(s.expandedSchemas); next.has(key) ? next.delete(key) : next.add(key); return { expandedSchemas: next } }),
  toggleTableExpand: (key) => set(s => { const next = new Set(s.expandedTables); next.has(key) ? next.delete(key) : next.add(key); return { expandedTables: next } }),
  selectTable: (profileId, schema, table) => set({ selectedTable: { profileId, schema, table } }),

  // Table Data CRUD
  tableData: null,

  loadTableData: async (profileId, schema, table, page = 1) => {
    set(s => ({
      tableData: {
        profileId, schema, table,
        columns: [],
        rows: [],
        pagination: { page, pageSize: s.tableData?.pagination.pageSize || 20, totalRows: 0, totalPages: 0 },
        isLoading: true,
        editingCell: null, editingValue: '', newRowDraft: null,
      },
    }))
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200))

    const key = `${profileId}:${schema}:${table}`
    const allRows = MOCK_TABLE_DATA[key] || []
    const schemaData = get().schemas[profileId]
    const tableInfo = schemaData?.flatMap(s => s.tables).find(t => t.name === table)
    const columns = tableInfo?.columns || []
    const pageSize = get().tableData?.pagination.pageSize || 20
    const totalRows = allRows.length
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
    const start = (page - 1) * pageSize
    const rows = allRows.slice(start, start + pageSize)

    set({
      tableData: {
        profileId, schema, table, columns,
        rows: JSON.parse(JSON.stringify(rows)),
        pagination: { page, pageSize, totalRows, totalPages },
        isLoading: false, editingCell: null, editingValue: '', newRowDraft: null,
      },
    })
    log.debug('Table data loaded', { key, rows: rows.length, totalRows })
  },

  startEditingCell: (rowIndex, column) => set(s => {
    if (!s.tableData) {return s}
    const val = s.tableData.rows[rowIndex]?.[column]
    return { tableData: { ...s.tableData, editingCell: { rowIndex, column }, editingValue: val === null ? '' : String(val ?? '') } }
  }),

  setEditingValue: (value) => set(s => s.tableData ? { tableData: { ...s.tableData, editingValue: value } } : s),

  commitCellEdit: () => set(s => {
    if (!s.tableData?.editingCell) {return s}
    const { rowIndex, column } = s.tableData.editingCell
    const rows = [...s.tableData.rows]
    rows[rowIndex] = { ...rows[rowIndex], [column]: s.tableData.editingValue }
    log.info('Cell updated', { rowIndex, column, value: s.tableData.editingValue })
    return { tableData: { ...s.tableData, rows, editingCell: null, editingValue: '' } }
  }),

  cancelCellEdit: () => set(s => s.tableData ? { tableData: { ...s.tableData, editingCell: null, editingValue: '' } } : s),

  startNewRow: () => set(s => {
    if (!s.tableData) {return s}
    const draft: Record<string, string> = {}
    s.tableData.columns.forEach(c => { draft[c.name] = c.defaultValue || '' })
    return { tableData: { ...s.tableData, newRowDraft: draft } }
  }),

  cancelNewRow: () => set(s => s.tableData ? { tableData: { ...s.tableData, newRowDraft: null } } : s),

  updateNewRowField: (column, value) => set(s => {
    if (!s.tableData?.newRowDraft) {return s}
    return { tableData: { ...s.tableData, newRowDraft: { ...s.tableData.newRowDraft, [column]: value } } }
  }),

  commitNewRow: () => set(s => {
    if (!s.tableData?.newRowDraft) {return s}
    const newRow: Record<string, unknown> = {}
    const pkCol = s.tableData.columns.find(c => c.isPrimaryKey)
    const maxId = s.tableData.rows.reduce((max, r) => Math.max(max, Number(r[pkCol?.name || 'id']) || 0), 0)
    s.tableData.columns.forEach(c => {
      const val = s.tableData!.newRowDraft![c.name]
      if (c.isPrimaryKey && !val) { newRow[c.name] = maxId + 1 }
      else if (c.type.includes('int') || c.type.includes('serial')) { newRow[c.name] = parseInt(val) || 0 }
      else if (c.type.includes('bool')) { newRow[c.name] = val === 'true' }
      else { newRow[c.name] = val || null }
    })
    const rows = [...s.tableData.rows, newRow]
    log.info('Row inserted', { row: newRow })
    return {
      tableData: {
        ...s.tableData, rows, newRowDraft: null,
        pagination: { ...s.tableData.pagination, totalRows: s.tableData.pagination.totalRows + 1 },
      },
    }
  }),

  deleteRow: (rowIndex) => set(s => {
    if (!s.tableData) {return s}
    const rows = s.tableData.rows.filter((_, i) => i !== rowIndex)
    log.info('Row deleted', { rowIndex })
    return {
      tableData: {
        ...s.tableData, rows,
        pagination: { ...s.tableData.pagination, totalRows: s.tableData.pagination.totalRows - 1 },
      },
    }
  }),

  setTablePage: (page) => {
    const td = get().tableData
    if (td) {get().loadTableData(td.profileId, td.schema, td.table, page)}
  },

  setTablePageSize: (size) => set(s => {
    if (!s.tableData) {return s}
    return { tableData: { ...s.tableData, pagination: { ...s.tableData.pagination, pageSize: size } } }
  }),

  // SQL Console
  sqlInput: 'SELECT * FROM users LIMIT 10;',
  setSqlInput: (sql) => set({ sqlInput: sql }),
  queryResults: null,
  isExecuting: false,
  queryHistory: [],
  queryDatasetId: null,

  executeQuery: async (profileId, sql) => {
    set({ isExecuting: true, queryResults: null })
    log.info('Executing query', { profileId, sql: sql.slice(0, 80) })
    const start = Date.now()
    await new Promise(r => setTimeout(r, 200 + Math.random() * 500))
    const elapsed = Date.now() - start
    const normalizedSql = sql.trim().replace(/;$/, '')
    const mockResult = MOCK_QUERY_RESULTS[normalizedSql]
    const result: QueryResult = mockResult ? { ...mockResult, executionTime: elapsed } : {
      columns: ['result'],
      rows: [{ result: `Query executed (${normalizedSql.split(' ')[0].toUpperCase()})` }],
      rowCount: 1, executionTime: elapsed,
      affectedRows: normalizedSql.toLowerCase().startsWith('select') ? undefined : 1,
    }
    const historyEntry: QueryHistoryEntry = {
      id: `qh_${Date.now()}`, connectionId: profileId, sql, timestamp: Date.now(),
      executionTime: elapsed, rowCount: result.rowCount, success: !result.error, error: result.error,
    }
    const totalPages = Math.max(1, Math.ceil(result.rowCount / get().queryPagination.pageSize))
    set(s => ({
      queryResults: result, isExecuting: false,
      queryHistory: [historyEntry, ...s.queryHistory].slice(0, 100),
      queryPagination: { ...s.queryPagination, page: 1, totalRows: result.rowCount, totalPages },
      queryDatasetId: result.error ? null : `ds_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
    }))
    log.info('Query completed', { elapsed, rows: result.rowCount })
  },

  clearQueryHistory: () => set({ queryHistory: [] }),

  // Query pagination
  queryPagination: { page: 1, pageSize: 50, totalRows: 0, totalPages: 0 },
  setQueryPage: (page) => set(s => ({ queryPagination: { ...s.queryPagination, page } })),
  setQueryPageSize: (pageSize) => set(s => ({ queryPagination: { ...s.queryPagination, pageSize, totalPages: Math.max(1, Math.ceil(s.queryPagination.totalRows / pageSize)) } })),

  // Export
  exportResults: (format) => {
    const results = get().queryResults
    if (!results || results.rows.length === 0) {return}
    let content: string
    let mime: string
    let ext: string
    if (format === 'csv') {
      const header = results.columns.join(',')
      const rows = results.rows.map(r => results.columns.map(c => {
        const v = r[c]
        const s = v === null ? '' : String(v)
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
      }).join(','))
      content = [header, ...rows].join('\n')
      mime = 'text/csv'; ext = 'csv'
    } else {
      content = JSON.stringify(results.rows, null, 2)
      mime = 'application/json'; ext = 'json'
    }
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `query_result_${Date.now()}.${ext}`; a.click()
    URL.revokeObjectURL(url)
    log.info(`Results exported as ${format}`, { rows: results.rows.length })
  },

  // Backup & Restore
  backups: MOCK_BACKUPS,
  isBackingUp: false,
  isRestoring: false,
  backupProgress: null,
  restoreProgress: null,

  createBackup: async (profileId, encrypted) => {
    const profile = get().profiles.find(p => p.id === profileId)
    if (!profile) {return}
    set({ isBackingUp: true })
    log.info('Creating backup via BackupWorker...', { profileId, encrypted })

    const ext = profile.type === 'redis' ? 'rdb' : 'sql'
    const encExt = encrypted ? '.enc' : ''
    const destPath = `/backups/${profile.type}_${profile.database}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${ext}${encExt}`

    const result = await BackupWorker.runBackup(
      {
        connectionId: profileId,
        connectionName: profile.name,
        databaseName: profile.database,
        engineType: profile.type === 'postgresql' ? 'postgres' : profile.type as any,
        encrypt: encrypted,
        destPath,
      },
      (progress) => {
        log.debug('Backup progress', { phase: progress.phase, pct: progress.progress })
        set({ backupProgress: progress })
      }
    )

    const id = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`
    const entry: BackupEntry = {
      id, profileId, profileName: profile.name, engineType: profile.type,
      database: profile.database, timestamp: Date.now(),
      size: `${(result.bytesProcessed / (1024 * 1024)).toFixed(1)} MB`,
      format: profile.type === 'redis' ? 'rdb' : 'sql',
      encrypted,
      status: result.phase === 'completed' ? 'completed' : 'failed',
      filePath: destPath,
      errorMessage: result.error,
    }
    const updated = [entry, ...get().backups]
    set({ backups: updated, isBackingUp: false })
    log.info('Backup finished', { id, phase: result.phase, size: entry.size })
    // Auto-clear progress after 3 seconds
    setTimeout(() => set({ backupProgress: null }), 3000)
  },

  restoreBackup: async (backupId) => {
    const backup = get().backups.find(b => b.id === backupId)
    if (!backup) {return}
    set({ isRestoring: true })
    log.info('Restoring backup via BackupWorker...', { backupId })

    const result = await BackupWorker.runRestore(
      {
        connectionId: backup.profileId,
        dumpFilePath: backup.filePath,
        encrypted: backup.encrypted,
      },
      (progress) => {
        log.debug('Restore progress', { phase: progress.phase, pct: progress.progress })
        set({ restoreProgress: progress })
      }
    )

    set({ isRestoring: false })
    log.info('Restore finished', { backupId, phase: result.phase })
    // Auto-clear progress after 3 seconds
    setTimeout(() => set({ restoreProgress: null }), 3000)
  },

  deleteBackup: (backupId) => {
    const updated = get().backups.filter(b => b.id !== backupId)
    set({ backups: updated })
    log.info('Backup deleted', { backupId })
  },

  // Bottom panel tab
  rightBottomTab: 'terminal',
  setRightBottomTab: (tab) => set({ rightBottomTab: tab }),

  // Utility
  getProfileById: (id) => get().profiles.find(p => p.id === id),
  getConnectedProfiles: () => get().profiles.filter(p => p.status === 'connected'),
  getEngineIcon: (type) => {
    switch (type) { case 'postgresql': return '🐘'; case 'mysql': return '🐬'; case 'redis': return '🔴'; case 'sqlite': return '📦'; default: return '💾' }
  },
  getEngineColor: (type) => {
    switch (type) { case 'postgresql': return '#336791'; case 'mysql': return '#00758f'; case 'redis': return '#DC382D'; case 'sqlite': return '#003B57'; default: return '#666' }
  },
}), {
  name: 'yyc3_db_store',
  partialize: (state) => ({
    profiles: state.profiles,
    backups: state.backups,
  }),
  merge: (persisted: any, current) => {
    if (!persisted) {return current}
    return {
      ...current,
      profiles: persisted.profiles?.length ? persisted.profiles : current.profiles,
      backups: persisted.backups?.length ? persisted.backups : current.backups,
    }
  },
}))