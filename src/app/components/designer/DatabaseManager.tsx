/**
 * @file DatabaseManager.tsx
 * @description Local-Database Manager v2.0 — 连接编辑/表 CRUD/SQL Console 增强/分页/导出/备份恢复
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags database, crud, sql-console, backup, restore, export, pagination
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Database, Server, Plus, Trash2, Edit3, Copy, Play, RefreshCw,
  Search, ChevronDown, ChevronRight, Table2, Eye, Key, Columns3,
  Wifi, WifiOff, Loader2, Check, X, AlertCircle,
  Zap, Shield, Link, Unplug, PlugZap,
  FolderOpen, History, Layers, TestTube2, Save,
  SkipBack, SkipForward, PlusCircle,
  HardDriveDownload, HardDriveUpload, Lock, Unlock, FileJson, FileSpreadsheet,
} from 'lucide-react'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import { formatTimeAgo } from '../../utils/time-format'
import {
  useDBStore,
  type DBConnectionProfile,
  type DBEngineType,
  type DetectedEngine,
} from '../../stores/db-store'
import { ScrollArea } from '../ui/scroll-area'
import Editor, { type OnMount } from '@monaco-editor/react'

// ============================================
// Helpers
// ============================================

function getStatusIcon(status: DBConnectionProfile['status']) {
  switch (status) {
    case 'connected': return <Wifi className="w-3 h-3 text-emerald-400/70" />
    case 'connecting': return <Loader2 className="w-3 h-3 text-amber-400/70 animate-spin" />
    case 'error': return <AlertCircle className="w-3 h-3 text-red-400/70" />
    default: return <WifiOff className="w-3 h-3 text-white/20" />
  }
}

function getEngineIcon(type: DBEngineType) {
  switch (type) {
    case 'postgresql': return <span className="text-[10px]">🐘</span>
    case 'mysql': return <span className="text-[10px]">🐬</span>
    case 'redis': return <span className="text-[10px]">🔴</span>
    case 'sqlite': return <span className="text-[10px]">📦</span>
  }
}

const inputClass = 'w-full bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-[10px] text-white/70 outline-none focus:border-blue-500/30 placeholder:text-white/15'

// ============================================
// Engine Discovery Panel
// ============================================

function EngineDiscoveryPanel() {
  const { detectedEngines, isDiscovering, discoverEngines, addProfile, getEngineColor } = useDBStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const handleQuickAdd = (engine: DetectedEngine) => {
    addProfile({
      name: `${engine.type.charAt(0).toUpperCase() + engine.type.slice(1)} Local`,
      type: engine.type, host: 'localhost', port: engine.defaultPort,
      username: engine.type === 'postgresql' ? 'postgres' : engine.type === 'mysql' ? 'root' : '',
      password: '', database: engine.type === 'redis' ? '0' : 'yyc3_dev',
      ssl: false, color: getEngineColor(engine.type),
    })
  }

  return (
    <div className={`p-3 border-b ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Zap className={`w-3 h-3 ${isLG ? 'text-emerald-400/50' : 'text-violet-400/50'}`} />
          <span className="text-[10px] text-white/35 uppercase tracking-wider">{t('discovery', 'database')}</span>
        </div>
        <button onClick={discoverEngines} disabled={isDiscovering}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] transition-colors ${isDiscovering ? 'text-white/20 cursor-not-allowed' : isLG ? 'text-emerald-400/50 hover:text-emerald-400/80 hover:bg-emerald-500/[0.08]' : 'text-violet-400/50 hover:text-violet-400/80 hover:bg-violet-500/[0.08]'}`}>
          {isDiscovering ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Search className="w-2.5 h-2.5" />}
          {isDiscovering ? t('scanning', 'database') : t('scanHint', 'database')}
        </button>
      </div>
      {detectedEngines.length > 0 ? (
        <div className="space-y-1">
          {detectedEngines.map(engine => (
            <div key={engine.type} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-colors ${engine.isRunning ? isLG ? 'border-emerald-500/[0.08] bg-emerald-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.04] opacity-50'}`}>
              <div className="flex items-center gap-2">
                {getEngineIcon(engine.type)}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/50">{engine.type.toUpperCase()}</span>
                    <span className="text-[8px] text-white/20">v{engine.version}</span>
                    {engine.isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />}
                  </div>
                  <div className="text-[8px] text-white/15">{engine.defaultPort > 0 ? `Port ${engine.defaultPort}` : t('embedded', 'database')}</div>
                </div>
              </div>
              <button onClick={() => handleQuickAdd(engine)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] transition-colors ${isLG ? 'text-emerald-400/40 hover:text-emerald-400/70 hover:bg-emerald-500/[0.08]' : 'text-blue-400/40 hover:text-blue-400/70 hover:bg-blue-500/[0.08]'}`}>
                <Plus className="w-2.5 h-2.5" /> {t('add', 'database')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3">
          <Database className="w-4 h-4 text-white/10 mx-auto mb-1" />
          <p className="text-[9px] text-white/15">{isDiscovering ? t('scanning', 'database') : t('scanHint', 'database')}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// Edit Connection Dialog
// ============================================

function EditConnectionDialog() {
  const { editingProfile, setEditingProfile, saveEditingProfile, getEngineColor } = useDBStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [form, setForm] = useState<Partial<DBConnectionProfile>>({})

  useEffect(() => {
    if (editingProfile) {setForm({ ...editingProfile })}
  }, [editingProfile])

  if (!editingProfile) {return null}

  const handleSave = () => {
    saveEditingProfile(form)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={() => setEditingProfile(null)}>
      <div className={`w-80 rounded-xl border overflow-hidden ${isLG ? 'border-emerald-500/[0.12]' : 'border-white/[0.1]'}`}
        style={{ background: isLG ? 'rgba(10,15,10,0.95)' : 'rgba(14,14,24,0.97)', backdropFilter: 'blur(24px)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isLG ? 'border-emerald-500/[0.08]' : 'border-white/[0.06]'}`}>
          <div className="flex items-center gap-2">
            <Edit3 className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400/50' : 'text-violet-400/50'}`} />
            <span className="text-[11px] text-white/60">{t('editConnection', 'database')}</span>
          </div>
          <button onClick={() => setEditingProfile(null)} className="p-0.5 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Form */}
        <div className="p-4 space-y-2.5">
          {/* Engine type */}
          <div className="flex gap-1">
            {(['postgresql', 'mysql', 'redis', 'sqlite'] as DBEngineType[]).map(type => (
              <button key={type} onClick={() => setForm(f => ({ ...f, type, port: type === 'postgresql' ? 5432 : type === 'mysql' ? 3306 : type === 'redis' ? 6379 : 0, color: getEngineColor(type) }))}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] border transition-colors ${form.type === type ? isLG ? 'border-emerald-500/[0.2] bg-emerald-500/[0.08] text-white/60' : 'border-white/[0.12] bg-white/[0.06] text-white/60' : 'border-transparent text-white/25 hover:text-white/40 hover:bg-white/[0.03]'}`}>
                {getEngineIcon(type)}
                <span>{type === 'postgresql' ? 'PG' : type === 'mysql' ? 'MySQL' : type === 'redis' ? 'Redis' : 'SQLite'}</span>
              </button>
            ))}
          </div>
          <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('connectionName', 'database')} className={inputClass} />
          <div className="flex gap-1.5">
            <input value={form.host || ''} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} placeholder={t('host', 'database')} className={`${inputClass} flex-1`} />
            <input type="number" value={form.port || 0} onChange={e => setForm(f => ({ ...f, port: parseInt(e.target.value) || 0 }))} placeholder={t('port', 'database')} className={`${inputClass} w-16`} />
          </div>
          {form.type !== 'sqlite' && (
            <div className="flex gap-1.5">
              <input value={form.username || ''} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder={t('username', 'database')} className={`${inputClass} flex-1`} />
              <input type="password" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={t('password', 'database')} className={`${inputClass} flex-1`} />
            </div>
          )}
          <input value={form.database || ''} onChange={e => setForm(f => ({ ...f, database: e.target.value }))} placeholder={form.type === 'redis' ? t('dbIndex', 'database') : t('databaseName', 'database')} className={inputClass} />
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-[9px] text-white/30 cursor-pointer">
              <input type="checkbox" checked={form.ssl || false} onChange={e => setForm(f => ({ ...f, ssl: e.target.checked }))} className="w-3 h-3 rounded" />
              <Shield className="w-2.5 h-2.5" /> SSL
            </label>
            <div className="flex gap-1">
              <button onClick={() => setEditingProfile(null)} className="px-2 py-0.5 rounded text-[9px] text-white/30 hover:text-white/50 hover:bg-white/[0.04]">{t('cancel', 'database')}</button>
              <button onClick={handleSave} className={`px-2.5 py-0.5 rounded text-[9px] ${isLG ? 'bg-emerald-500/[0.15] text-emerald-400/70 hover:bg-emerald-500/[0.25]' : 'bg-blue-500/[0.15] text-blue-400/70 hover:bg-blue-500/[0.25]'}`}>
                <Save className="w-2.5 h-2.5 inline mr-1" />{t('save', 'database')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Connection List Panel
// ============================================

function ConnectionListPanel() {
  const { profiles, activeProfileId, setActiveProfile, connectProfile, disconnectProfile, removeProfile, testConnection, setEditingProfile, duplicateProfile } = useDBStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [showAddForm, setShowAddForm] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const handleTest = async (id: string) => { setTestingId(id); await testConnection(id); setTestingId(null) }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex items-center justify-between px-3 py-1.5 border-b ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
        <div className="flex items-center gap-1.5">
          <Server className="w-3 h-3 text-white/25" />
          <span className="text-[10px] text-white/35 uppercase tracking-wider">{t('connectionsTab', 'database')}</span>
          <span className={`text-[8px] px-1 rounded-full ${isLG ? 'bg-emerald-500/[0.1] text-emerald-400/40' : 'bg-violet-500/[0.1] text-violet-400/40'}`}>{profiles.length}</span>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className={`p-0.5 rounded transition-colors ${isLG ? 'hover:bg-emerald-500/[0.08] text-emerald-400/40' : 'hover:bg-white/[0.06] text-white/20'}`}>
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {showAddForm && <AddConnectionForm onClose={() => setShowAddForm(false)} />}
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {profiles.length === 0 ? (
            <div className="text-center py-6">
              <Database className="w-5 h-5 text-white/10 mx-auto mb-1.5" />
              <p className="text-[10px] text-white/20">{t('noConnections', 'database')}</p>
            </div>
          ) : profiles.map(profile => (
            <div key={profile.id} onClick={() => setActiveProfile(profile.id)}
              className={`rounded-lg p-2 border transition-all cursor-pointer group ${activeProfileId === profile.id ? isLG ? 'bg-emerald-500/[0.06] border-emerald-500/[0.12]' : 'bg-white/[0.04] border-white/[0.08]' : 'border-transparent hover:bg-white/[0.02] hover:border-white/[0.04]'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {getEngineIcon(profile.type)}
                  <span className="text-[11px] text-white/60">{profile.name}</span>
                  {getStatusIcon(profile.status)}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); setEditingProfile(profile) }}
                    className="p-0.5 rounded hover:bg-white/[0.08] text-white/20 hover:text-blue-400/60 transition-colors" title={t('edit', 'database')}>
                    <Edit3 className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); duplicateProfile(profile.id) }}
                    className="p-0.5 rounded hover:bg-white/[0.08] text-white/20 hover:text-white/50 transition-colors" title={t('copy', 'database')}>
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                  {profile.status === 'connected' ? (
                    <button onClick={e => { e.stopPropagation(); disconnectProfile(profile.id) }}
                      className="p-0.5 rounded hover:bg-white/[0.08] text-white/20 hover:text-red-400/60 transition-colors" title={t('disconnect', 'database')}>
                      <Unplug className="w-2.5 h-2.5" />
                    </button>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); connectProfile(profile.id) }}
                      className={`p-0.5 rounded hover:bg-white/[0.08] transition-colors ${isLG ? 'text-emerald-400/30 hover:text-emerald-400/70' : 'text-blue-400/30 hover:text-blue-400/70'}`} title={t('connect', 'database')}>
                      <PlugZap className="w-2.5 h-2.5" />
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); handleTest(profile.id) }} disabled={testingId === profile.id}
                    className="p-0.5 rounded hover:bg-white/[0.08] text-white/20 hover:text-white/50 transition-colors" title={t('test', 'database')}>
                    {testingId === profile.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <TestTube2 className="w-2.5 h-2.5" />}
                  </button>
                  <button onClick={e => { e.stopPropagation(); removeProfile(profile.id) }}
                    className="p-0.5 rounded hover:bg-white/[0.08] text-white/15 hover:text-red-400/50 transition-colors" title={t('delete', 'database')}>
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[8px] text-white/20">
                <span>{profile.host}:{profile.port}</span><span>·</span><span>{profile.database}</span>
                {profile.ssl && <><span>·</span><Shield className="w-2 h-2" /><span>SSL</span></>}
              </div>
              {profile.errorMessage && <div className="mt-1 px-1.5 py-0.5 rounded bg-red-500/[0.08] text-[8px] text-red-400/50 truncate">{profile.errorMessage}</div>}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================
// Add Connection Form
// ============================================

function AddConnectionForm({ onClose }: { onClose: () => void }) {
  const { addProfile, getEngineColor } = useDBStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [form, setForm] = useState({ name: '', type: 'postgresql' as DBEngineType, host: 'localhost', port: 5432, username: 'postgres', password: '', database: '', ssl: false })

  const handleTypeChange = (type: DBEngineType) => {
    const defaults: Record<DBEngineType, { port: number; username: string }> = { postgresql: { port: 5432, username: 'postgres' }, mysql: { port: 3306, username: 'root' }, redis: { port: 6379, username: '' }, sqlite: { port: 0, username: '' } }
    setForm(f => ({ ...f, type, port: defaults[type].port, username: defaults[type].username }))
  }

  const handleSave = () => { if (!form.name.trim()) {return;} addProfile({ ...form, color: getEngineColor(form.type) }); onClose() }

  return (
    <div className={`px-3 py-2.5 border-b ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`} style={{ background: isLG ? 'rgba(10,15,10,0.4)' : 'rgba(0,0,0,0.1)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-white/40">{t('addConnection', 'database')}</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/[0.06] text-white/20"><X className="w-3 h-3" /></button>
      </div>
      <div className="space-y-1.5">
        <div className="flex gap-1">
          {(['postgresql', 'mysql', 'redis', 'sqlite'] as DBEngineType[]).map(type => (
            <button key={type} onClick={() => handleTypeChange(type)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] border transition-colors ${form.type === type ? isLG ? 'border-emerald-500/[0.2] bg-emerald-500/[0.08] text-white/60' : 'border-white/[0.12] bg-white/[0.06] text-white/60' : 'border-transparent text-white/25 hover:bg-white/[0.03]'}`}>
              {getEngineIcon(type)}
              <span>{type === 'postgresql' ? 'PG' : type === 'mysql' ? 'MySQL' : type === 'redis' ? 'Redis' : 'SQLite'}</span>
            </button>
          ))}
        </div>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('connectionName', 'database')} className={inputClass} autoFocus />
        <div className="flex gap-1.5">
          <input value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} placeholder={t('host', 'database')} className={`${inputClass} flex-1`} />
          <input type="number" value={form.port} onChange={e => setForm(f => ({ ...f, port: parseInt(e.target.value) || 0 }))} className={`${inputClass} w-16`} />
        </div>
        {form.type !== 'sqlite' && (
          <div className="flex gap-1.5">
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder={t('username', 'database')} className={`${inputClass} flex-1`} />
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={t('password', 'database')} className={`${inputClass} flex-1`} />
          </div>
        )}
        <input value={form.database} onChange={e => setForm(f => ({ ...f, database: e.target.value }))} placeholder={form.type === 'redis' ? `${t('dbIndex', 'database')} (0-15)` : t('databaseName', 'database')} className={inputClass} />
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-1.5 text-[9px] text-white/30 cursor-pointer">
            <input type="checkbox" checked={form.ssl} onChange={e => setForm(f => ({ ...f, ssl: e.target.checked }))} className="w-3 h-3 rounded" />
            <Shield className="w-2.5 h-2.5" /> SSL
          </label>
          <div className="flex gap-1">
            <button onClick={onClose} className="px-2 py-0.5 rounded text-[9px] text-white/30 hover:text-white/50 hover:bg-white/[0.04]">{t('cancel', 'database')}</button>
            <button onClick={handleSave} disabled={!form.name.trim()} className={`px-2.5 py-0.5 rounded text-[9px] ${form.name.trim() ? isLG ? 'bg-emerald-500/[0.15] text-emerald-400/70 hover:bg-emerald-500/[0.25]' : 'bg-blue-500/[0.15] text-blue-400/70 hover:bg-blue-500/[0.25]' : 'bg-white/[0.04] text-white/15 cursor-not-allowed'}`}>{t('save', 'database')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Table Explorer + CRUD
// ============================================

function TableExplorer() {
  const { activeProfileId, schemas, loadSchemas, expandedSchemas, expandedTables, toggleSchemaExpand, toggleTableExpand, selectedTable, selectTable, profiles, loadTableData, tableData } = useDBStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const activeProfile = profiles.find(p => p.id === activeProfileId)
  const activeSchemas = activeProfileId ? schemas[activeProfileId] || [] : []

  useEffect(() => {
    if (activeProfileId && activeProfile?.status === 'connected' && !schemas[activeProfileId]) {loadSchemas(activeProfileId)}
  }, [activeProfileId, activeProfile?.status])

  const handleSelectTable = (schema: string, table: string) => {
    if (!activeProfileId) {return}
    selectTable(activeProfileId, schema, table)
    loadTableData(activeProfileId, schema, table)
  }

  if (!activeProfileId || !activeProfile) {return <EmptyState icon={Table2} text={t('selectConnection', 'database')} />}
  if (activeProfile.status !== 'connected') {return <EmptyState icon={WifiOff} text={t('notConnected', 'database')} sub={t('connectFirst', 'database')} />}

  return (
    <div className="h-full flex flex-col">
      {/* Schema/Table tree */}
      <ScrollArea className={`${tableData ? 'h-1/3 border-b' : 'flex-1'} ${isLG ? 'border-emerald-500/[0.04]' : 'border-white/[0.04]'}`}>
        <div className="p-1.5">
          {activeSchemas.map(schema => {
            const schemaKey = `${activeProfileId}:${schema.name}`
            const isExpanded = expandedSchemas.has(schemaKey)
            return (
              <div key={schema.name}>
                <button onClick={() => toggleSchemaExpand(schemaKey)} className="w-full flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/[0.03] text-left transition-colors">
                  {isExpanded ? <ChevronDown className="w-3 h-3 text-white/20" /> : <ChevronRight className="w-3 h-3 text-white/20" />}
                  <FolderOpen className={`w-3 h-3 ${isLG ? 'text-emerald-400/40' : 'text-amber-400/40'}`} />
                  <span className="text-[10px] text-white/50">{schema.name}</span>
                  <span className="text-[8px] text-white/15 ml-auto">{schema.tables.length}</span>
                </button>
                {isExpanded && schema.tables.map(table => {
                  const tableKey = `${schemaKey}:${table.name}`
                  const isTableExpanded = expandedTables.has(tableKey)
                  const isSelected = selectedTable?.table === table.name && selectedTable?.schema === schema.name
                  return (
                    <div key={table.name} className="ml-3">
                      <button onClick={() => { toggleTableExpand(tableKey); handleSelectTable(schema.name, table.name) }}
                        className={`w-full flex items-center gap-1.5 px-2 py-0.5 rounded text-left transition-colors ${isSelected ? isLG ? 'bg-emerald-500/[0.08] text-white/60' : 'bg-white/[0.06] text-white/60' : 'hover:bg-white/[0.03] text-white/40'}`}>
                        {isTableExpanded ? <ChevronDown className="w-2.5 h-2.5 text-white/15" /> : <ChevronRight className="w-2.5 h-2.5 text-white/15" />}
                        {table.type === 'view' ? <Eye className="w-3 h-3 text-cyan-400/40" /> : <Table2 className="w-3 h-3 text-blue-400/40" />}
                        <span className="text-[10px] truncate flex-1">{table.name}</span>
                        <span className="text-[7px] text-white/15">{table.rowCount > 0 ? `${table.rowCount} ${t('rows', 'database')}` : ''}</span>
                      </button>
                      {isTableExpanded && (
                        <div className="ml-5 py-0.5">
                          {table.columns.map(col => (
                            <div key={col.name} className="flex items-center gap-1.5 px-2 py-[2px] text-[9px]">
                              {col.isPrimaryKey ? <Key className="w-2.5 h-2.5 text-amber-400/40 shrink-0" /> : col.isForeignKey ? <Link className="w-2.5 h-2.5 text-cyan-400/40 shrink-0" /> : <Columns3 className="w-2.5 h-2.5 text-white/15 shrink-0" />}
                              <span className="text-white/40 truncate">{col.name}</span>
                              <span className="text-white/15 font-mono ml-auto shrink-0">{col.type}</span>
                              {col.nullable && <span className="text-white/10 text-[7px]">?</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </ScrollArea>
      {/* Table Data CRUD */}
      {tableData && <TableDataPanel />}
    </div>
  )
}

// ============================================
// Table Data Panel (CRUD)
// ============================================

function TableDataPanel() {
  const { tableData, startEditingCell, setEditingValue, commitCellEdit, cancelCellEdit, startNewRow, cancelNewRow, updateNewRowField, commitNewRow, deleteRow, setTablePage } = useDBStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  if (!tableData) {return null}
  const { columns, rows, pagination, isLoading, editingCell, editingValue, newRowDraft } = tableData

  if (isLoading) {return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-white/15 animate-spin" /></div>}

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className={`h-7 flex items-center justify-between px-3 border-b shrink-0 ${isLG ? 'border-emerald-500/[0.04]' : 'border-white/[0.04]'}`}>
        <div className="flex items-center gap-1.5">
          <Table2 className="w-3 h-3 text-white/25" />
          <span className="text-[10px] text-white/40">{tableData.table}</span>
          <span className="text-[8px] text-white/15">{pagination.totalRows} {t('rows', 'database')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={startNewRow} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] ${isLG ? 'text-emerald-400/50 hover:bg-emerald-500/[0.08]' : 'text-blue-400/50 hover:bg-blue-500/[0.08]'} transition-colors`}>
            <PlusCircle className="w-2.5 h-2.5" /> INSERT
          </button>
          <button onClick={() => { const td = useDBStore.getState().tableData; if (td) {useDBStore.getState().loadTableData(td.profileId, td.schema, td.table)} }}
            className="p-0.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-colors"><RefreshCw className="w-2.5 h-2.5" /></button>
        </div>
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className={`border-b ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.06]'}`}>
                <th className="px-2 py-1 text-left text-white/20 font-normal w-8">#</th>
                {columns.map(col => (
                  <th key={col.name} className="px-2 py-1 text-left text-white/30 font-normal whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {col.isPrimaryKey && <Key className="w-2 h-2 text-amber-400/40" />}
                      {col.name}
                    </div>
                  </th>
                ))}
                <th className="px-2 py-1 text-left text-white/15 font-normal w-12">{t('actions', 'database')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`border-b transition-colors ${isLG ? 'border-emerald-500/[0.03] hover:bg-emerald-500/[0.04]' : 'border-white/[0.02] hover:bg-white/[0.03]'}`}>
                  <td className="px-2 py-0.5 text-white/10 font-mono">{(pagination.page - 1) * pagination.pageSize + i + 1}</td>
                  {columns.map(col => {
                    const isEditing = editingCell?.rowIndex === i && editingCell?.column === col.name
                    return (
                      <td key={col.name} className="px-2 py-0.5 font-mono whitespace-nowrap max-w-[200px]"
                        onDoubleClick={() => !col.isPrimaryKey && startEditingCell(i, col.name)}>
                        {isEditing ? (
                          <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') {commitCellEdit();} if (e.key === 'Escape') {cancelCellEdit()} }}
                            onBlur={commitCellEdit}
                            className="w-full bg-white/[0.08] border border-blue-500/30 rounded px-1 py-0 text-[10px] text-white/80 outline-none" />
                        ) : (
                          <span className={`truncate block ${row[col.name] === null ? 'text-white/15 italic' : typeof row[col.name] === 'boolean' ? (row[col.name] ? 'text-emerald-400/60' : 'text-red-400/60') : 'text-white/50'}`}>
                            {row[col.name] === null ? 'NULL' : String(row[col.name])}
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-2 py-0.5">
                    <button onClick={() => { if (confirm(t('confirmDeleteRow', 'database'))) {deleteRow(i)} }} className="p-0.5 rounded text-white/10 hover:text-red-400/60 hover:bg-red-500/[0.06] transition-colors">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {/* New Row Draft */}
              {newRowDraft && (
                <tr className={`border-b ${isLG ? 'bg-emerald-500/[0.06] border-emerald-500/[0.1]' : 'bg-blue-500/[0.06] border-blue-500/[0.1]'}`}>
                  <td className="px-2 py-0.5 text-white/15">+</td>
                  {columns.map(col => (
                    <td key={col.name} className="px-2 py-0.5">
                      <input value={newRowDraft[col.name] || ''} onChange={e => updateNewRowField(col.name, e.target.value)}
                        placeholder={col.isPrimaryKey ? 'auto' : col.type}
                        disabled={col.isPrimaryKey}
                        className="w-full bg-white/[0.06] border border-white/[0.08] rounded px-1 py-0 text-[10px] text-white/70 outline-none focus:border-blue-500/30 placeholder:text-white/10 disabled:opacity-30" />
                    </td>
                  ))}
                  <td className="px-2 py-0.5 flex gap-0.5">
                    <button onClick={commitNewRow} className="p-0.5 rounded text-emerald-400/60 hover:bg-emerald-500/[0.1]"><Check className="w-2.5 h-2.5" /></button>
                    <button onClick={cancelNewRow} className="p-0.5 rounded text-red-400/50 hover:bg-red-500/[0.1]"><X className="w-2.5 h-2.5" /></button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ScrollArea>

      {/* Pagination */}
      {pagination.totalPages > 1 && <PaginationBar page={pagination.page} totalPages={pagination.totalPages} onPageChange={setTablePage} />}
    </div>
  )
}

// ============================================
// Pagination Bar (shared)
// ============================================

function PaginationBar({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  const { isLG } = useLiquidGlass()
  return (
    <div className={`h-6 flex items-center justify-center gap-1 px-3 border-t shrink-0 ${isLG ? 'border-emerald-500/[0.04]' : 'border-white/[0.04]'}`}>
      <button onClick={() => onPageChange(1)} disabled={page <= 1} className="p-0.5 rounded text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors"><SkipBack className="w-2.5 h-2.5" /></button>
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="p-0.5 rounded text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors"><ChevronDown className="w-2.5 h-2.5 -rotate-90" /></button>
      <span className="text-[9px] text-white/30 px-2">{page} / {totalPages}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="p-0.5 rounded text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors"><ChevronDown className="w-2.5 h-2.5 rotate-90" /></button>
      <button onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} className="p-0.5 rounded text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors"><SkipForward className="w-2.5 h-2.5" /></button>
    </div>
  )
}

// ============================================
// SQL Console (F-18 Enhanced)
// ============================================

function SqlConsole() {
  const { activeProfileId, sqlInput, setSqlInput, queryResults, isExecuting, executeQuery, profiles, queryPagination, setQueryPage, setQueryPageSize, exportResults } = useDBStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const editorRef = useRef<any>(null)

  const activeProfile = profiles.find(p => p.id === activeProfileId)
  const canExecute = activeProfileId && activeProfile?.status === 'connected' && sqlInput.trim() && !isExecuting

  const handleExecute = useCallback(() => {
    if (!activeProfileId) {return}
    const state = useDBStore.getState()
    const profile = state.profiles.find(p => p.id === activeProfileId)
    if (!profile || profile.status !== 'connected' || !state.sqlInput.trim() || state.isExecuting) {return}
    state.executeQuery(activeProfileId, state.sqlInput)
  }, [activeProfileId])

  // Monaco editor mount handler
  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monaco.editor.defineTheme('yyc3-sql-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'comment', foreground: '6a9955' },
        { token: 'operator', foreground: 'd4d4d4' },
        { token: 'identifier', foreground: '9cdcfe' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'predefined', foreground: '4fc1ff' },
      ],
      colors: {
        'editor.background': '#00000000',
        'editor.foreground': '#cccccc99',
        'editorCursor.foreground': '#34d39980',
        'editor.lineHighlightBackground': '#ffffff06',
        'editor.selectionBackground': '#10b98120',
        'editorLineNumber.foreground': '#ffffff18',
        'editorLineNumber.activeForeground': '#ffffff30',
        'editorGutter.background': '#00000000',
        'editorWidget.background': '#0d0d14',
        'editorSuggestWidget.background': '#0d0d14',
        'editorSuggestWidget.border': '#ffffff10',
        'editorSuggestWidget.selectedBackground': '#ffffff10',
      },
    })
    monaco.editor.setTheme('yyc3-sql-dark')
    // Ctrl+Enter to execute
    editor.addAction({
      id: 'execute-sql',
      label: 'Execute SQL',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        const state = useDBStore.getState()
        const prof = state.profiles.find(p => p.id === state.activeProfileId)
        if (state.activeProfileId && prof?.status === 'connected' && state.sqlInput.trim()) {
          state.executeQuery(state.activeProfileId, state.sqlInput)
        }
      },
    })
    editor.focus()
  }, [])

  // Get paginated results
  const paginatedRows = queryResults ? queryResults.rows.slice((queryPagination.page - 1) * queryPagination.pageSize, queryPagination.page * queryPagination.pageSize) : []

  return (
    <div className="h-full flex flex-col">
      {/* SQL Input Area */}
      <div className={`flex flex-col border-b ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-white/25 font-mono">SQL</span>
            {activeProfile && (
              <span className={`text-[8px] px-1 rounded ${activeProfile.status === 'connected' ? 'bg-emerald-500/[0.1] text-emerald-400/40' : 'bg-white/[0.04] text-white/15'}`}>
                {activeProfile.name}
              </span>
            )}
            <span className="text-[7px] text-white/10">Monaco · {t('syntaxHighlight', 'database')}</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="text-[7px] text-white/10 bg-white/[0.03] px-1 rounded">Ctrl+Enter</kbd>
            <button onClick={handleExecute} disabled={!canExecute}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] transition-colors ${canExecute ? isLG ? 'bg-emerald-500/[0.15] text-emerald-400/70 hover:bg-emerald-500/[0.25]' : 'bg-blue-500/[0.15] text-blue-400/70 hover:bg-blue-500/[0.25]' : 'bg-white/[0.03] text-white/15 cursor-not-allowed'}`}>
              {isExecuting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />} {t('execute', 'database')}
            </button>
          </div>
        </div>
        {/* Monaco Editor */}
        <div style={{ height: 140, background: isLG ? 'rgba(5,10,5,0.3)' : 'rgba(0,0,0,0.15)' }}>
          <Editor
            language="sql"
            value={sqlInput}
            onChange={val => setSqlInput(val || '')}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              glyphMargin: false,
              folding: false,
              scrollBeyondLastLine: false,
              renderLineHighlight: 'line',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
              tabSize: 2,
              wordWrap: 'on',
              automaticLayout: true,
              scrollbar: { vertical: 'auto', horizontal: 'auto', verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              contextmenu: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              padding: { top: 6, bottom: 6 },
            }}
            loading={<div className="flex items-center justify-center h-full"><Loader2 className="w-4 h-4 text-white/15 animate-spin" /></div>}
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isExecuting ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center"><Loader2 className="w-5 h-5 text-white/15 animate-spin mx-auto mb-1.5" /><p className="text-[10px] text-white/20">{t('executing', 'database')}</p></div>
          </div>
        ) : queryResults ? (
          <>
            {/* Status + Export bar */}
            <div className={`flex items-center justify-between px-3 py-1 border-b shrink-0 ${isLG ? 'border-emerald-500/[0.04]' : 'border-white/[0.04]'}`}>
              <div className="flex items-center gap-2">
                {queryResults.error ? <AlertCircle className="w-2.5 h-2.5 text-red-400/60" /> : <Check className="w-2.5 h-2.5 text-emerald-400/50" />}
                <span className="text-[9px] text-white/30">
                  {queryResults.rowCount} {t('rows', 'database')} · {queryResults.executionTime}ms
                  {queryResults.affectedRows !== undefined && ` · ${queryResults.affectedRows} ${t('rowsAffected', 'database')}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Page size */}
                <select value={queryPagination.pageSize} onChange={e => setQueryPageSize(Number(e.target.value))}
                  className="bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0 text-[8px] text-white/40 outline-none">
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}{t('perPage', 'database')}</option>)}
                </select>
                {/* Export */}
                <button onClick={() => exportResults('csv')} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors" title={t('exportCSV', 'database')}>
                  <FileSpreadsheet className="w-2.5 h-2.5" /> CSV
                </button>
                <button onClick={() => exportResults('json')} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors" title={t('exportJSON', 'database')}>
                  <FileJson className="w-2.5 h-2.5" /> JSON
                </button>
              </div>
            </div>
            {/* Result table */}
            {queryResults.error ? (
              <div className="p-3"><pre className="text-[10px] text-red-400/40 font-mono whitespace-pre-wrap">{queryResults.error}</pre></div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className={`border-b ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.06]'}`}>
                        <th className="px-2 py-1 text-left text-white/20 font-normal w-8">#</th>
                        {queryResults.columns.map(col => <th key={col} className="px-2 py-1 text-left text-white/30 font-normal whitespace-nowrap">{col}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row, i) => (
                        <tr key={i} className={`border-b transition-colors ${isLG ? 'border-emerald-500/[0.03] hover:bg-emerald-500/[0.04]' : 'border-white/[0.02] hover:bg-white/[0.03]'}`}>
                          <td className="px-2 py-0.5 text-white/10 font-mono">{(queryPagination.page - 1) * queryPagination.pageSize + i + 1}</td>
                          {queryResults.columns.map(col => (
                            <td key={col} className="px-2 py-0.5 text-white/50 font-mono whitespace-nowrap max-w-[200px] truncate">
                              {row[col] === null ? <span className="text-white/15 italic">NULL</span>
                                : typeof row[col] === 'boolean' ? <span className={row[col] ? 'text-emerald-400/60' : 'text-red-400/60'}>{String(row[col])}</span>
                                : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            )}
            {/* Pagination */}
            {queryPagination.totalPages > 1 && <PaginationBar page={queryPagination.page} totalPages={queryPagination.totalPages} onPageChange={setQueryPage} />}
          </>
        ) : (
          <EmptyState icon={Table2} text={t('runQueryForResults', 'database')} />
        )}
      </div>
    </div>
  )
}

// ============================================
// Backup & Restore Panel (F-19)
// ============================================

function BackupPanel() {
  const { backups, profiles, isBackingUp, isRestoring, backupProgress, restoreProgress, createBackup, restoreBackup, deleteBackup, activeProfileId } = useDBStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [encrypted, setEncrypted] = useState(true)
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null)

  const activeProfile = profiles.find(p => p.id === activeProfileId)
  const canBackup = activeProfileId && activeProfile?.status === 'connected' && !isBackingUp

  return (
    <div className="h-full flex flex-col">
      {/* Create Backup */}
      <div className={`px-3 py-2.5 border-b ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-white/35 uppercase tracking-wider">{t('createBackup', 'database')}</span>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-[10px] text-white/50 outline-none flex-1" disabled>
            <option>{activeProfile ? `${activeProfile.name} (${activeProfile.database})` : t('selectForBackup', 'database')}</option>
          </select>
          <label className="flex items-center gap-1 text-[9px] text-white/30 cursor-pointer shrink-0">
            <input type="checkbox" checked={encrypted} onChange={e => setEncrypted(e.target.checked)} className="w-3 h-3 rounded" />
            {encrypted ? <Lock className="w-2.5 h-2.5 text-emerald-400/40" /> : <Unlock className="w-2.5 h-2.5" />}
            {t('encrypt', 'database')}
          </label>
          <button onClick={() => activeProfileId && createBackup(activeProfileId, encrypted)} disabled={!canBackup}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[9px] shrink-0 transition-colors ${canBackup ? isLG ? 'bg-emerald-500/[0.15] text-emerald-400/70 hover:bg-emerald-500/[0.25]' : 'bg-blue-500/[0.15] text-blue-400/70 hover:bg-blue-500/[0.25]' : 'bg-white/[0.04] text-white/15 cursor-not-allowed'}`}>
            {isBackingUp ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <HardDriveDownload className="w-2.5 h-2.5" />}
            {isBackingUp ? t('backingUp', 'database') : t('backup', 'database')}
          </button>
        </div>

        {/* Backup Progress Bar */}
        {isBackingUp && backupProgress && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[9px] ${isLG ? 'text-emerald-400/50' : 'text-blue-400/50'}`}>
                {backupProgress.phase === 'preparing' ? t('connecting', 'database') :
                 backupProgress.phase === 'dumping' ? t('dumping', 'database') :
                 backupProgress.phase === 'encrypting' ? t('encrypting', 'database') :
                 backupProgress.phase === 'writing' ? t('writing', 'database') :
                 backupProgress.phase === 'completed' ? t('completed', 'database') : backupProgress.phase}
              </span>
              <span className="text-[9px] text-white/25">{Math.round(backupProgress.progress)}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${isLG ? 'bg-emerald-400/40' : 'bg-blue-400/40'}`}
                style={{ width: `${Math.round(backupProgress.progress)}%` }} />
            </div>
            {backupProgress.bytesProcessed > 0 && (
              <span className="text-[8px] text-white/15 mt-0.5 block">
                {(backupProgress.bytesProcessed / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
          </div>
        )}

        {/* Restore Progress Bar */}
        {isRestoring && restoreProgress && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-amber-400/50">
                {restoreProgress.phase === 'reading' ? t('reading', 'database') :
                 restoreProgress.phase === 'decrypting' ? t('decrypting', 'database') :
                 restoreProgress.phase === 'restoring' ? t('restoring', 'database') :
                 restoreProgress.phase === 'completed' ? t('completed', 'database') : restoreProgress.phase}
              </span>
              <span className="text-[9px] text-white/25">{Math.round(restoreProgress.progress)}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300 bg-amber-400/40"
                style={{ width: `${Math.round(restoreProgress.progress)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Backup List */}
      <ScrollArea className="flex-1">
        {backups.length === 0 ? (
          <EmptyState icon={HardDriveDownload} text={t('noBackups', 'database')} sub={t('createFirstBackup', 'database')} />
        ) : (
          <div className="p-1.5 space-y-1">
            {backups.map(backup => (
              <div key={backup.id} className={`rounded-lg p-2.5 border transition-colors ${isLG ? 'border-emerald-500/[0.06] hover:border-emerald-500/[0.12]' : 'border-white/[0.04] hover:border-white/[0.08]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {getEngineIcon(backup.engineType)}
                    <span className="text-[10px] text-white/50">{backup.profileName}</span>
                    <span className="text-[8px] text-white/20">({backup.database})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {backup.encrypted && <Lock className="w-2.5 h-2.5 text-emerald-400/30" />}
                    <span className={`text-[8px] px-1 rounded ${backup.status === 'completed' ? 'bg-emerald-500/[0.1] text-emerald-400/40' : backup.status === 'failed' ? 'bg-red-500/[0.1] text-red-400/40' : 'bg-amber-500/[0.1] text-amber-400/40'}`}>
                      {backup.status === 'completed' ? t('completed', 'database') : backup.status === 'failed' ? t('failed', 'database') : t('inProgress', 'database')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[8px] text-white/20 mb-1.5">
                  <span>{formatTimeAgo(backup.timestamp)}</span>
                  <span>·</span>
                  <span>{backup.size}</span>
                  <span>·</span>
                  <span className="font-mono">.{backup.format}</span>
                </div>
                <div className="text-[8px] text-white/15 font-mono truncate mb-1.5">{backup.filePath}</div>
                <div className="flex items-center gap-1">
                  {confirmRestore === backup.id ? (
                    <>
                      <span className="text-[9px] text-amber-400/50 mr-1">{t('confirmRestoreWarn', 'database')}</span>
                      <button onClick={() => { restoreBackup(backup.id); setConfirmRestore(null) }}
                        className="px-2 py-0.5 rounded text-[8px] bg-amber-500/[0.15] text-amber-400/60 hover:bg-amber-500/[0.25] transition-colors">
                        {isRestoring ? <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" /> : null}{t('confirm', 'database')}
                      </button>
                      <button onClick={() => setConfirmRestore(null)} className="px-2 py-0.5 rounded text-[8px] text-white/25 hover:text-white/50 hover:bg-white/[0.04]">{t('cancel', 'database')}</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setConfirmRestore(backup.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] transition-colors ${isLG ? 'text-emerald-400/40 hover:bg-emerald-500/[0.08]' : 'text-blue-400/40 hover:bg-blue-500/[0.08]'}`}>
                        <HardDriveUpload className="w-2.5 h-2.5" /> {t('restore', 'database')}
                      </button>
                      <button onClick={() => { if (confirm(t('deleteBackupConfirm', 'database'))) {deleteBackup(backup.id)} }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] text-white/15 hover:text-red-400/50 hover:bg-red-500/[0.06] transition-colors">
                        <Trash2 className="w-2.5 h-2.5" /> {t('delete', 'database')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// ============================================
// Query History Panel
// ============================================

function QueryHistoryPanel() {
  const { queryHistory, clearQueryHistory, setSqlInput } = useDBStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  return (
    <div className="h-full flex flex-col">
      <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
        <span className="text-[10px] text-white/30">{t('history', 'database')}</span>
        {queryHistory.length > 0 && <button onClick={clearQueryHistory} className="text-[9px] text-white/15 hover:text-white/40 transition-colors">{t('clear', 'database')}</button>}
      </div>
      <ScrollArea className="flex-1">
        {queryHistory.length === 0 ? (
          <EmptyState icon={History} text={t('noQueryHistory', 'database')} />
        ) : (
          <div className="p-1.5 space-y-0.5">
            {queryHistory.map(entry => (
              <button key={entry.id} onClick={() => setSqlInput(entry.sql)} className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    {entry.success ? <Check className="w-2.5 h-2.5 text-emerald-400/40" /> : <AlertCircle className="w-2.5 h-2.5 text-red-400/40" />}
                    <span className="text-[9px] text-white/25">{entry.executionTime}ms</span>
                    <span className="text-[8px] text-white/15">{entry.rowCount} {t('rows', 'database')}</span>
                  </div>
                  <span className="text-[8px] text-white/10">{formatTimeAgo(entry.timestamp)}</span>
                </div>
                <pre className="text-[9px] text-white/35 font-mono truncate">{entry.sql}</pre>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// ============================================
// Empty State Helper
// ============================================

function EmptyState({ icon: Icon, text, sub }: { icon: typeof Database; text: string; sub?: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[100px]">
      <div className="text-center">
        <Icon className="w-5 h-5 text-white/10 mx-auto mb-1.5" />
        <p className="text-[10px] text-white/20">{text}</p>
        {sub && <p className="text-[8px] text-white/10 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ============================================
// DatabaseManager (main export)
// ============================================

export type DBTab = 'connections' | 'explorer' | 'sql' | 'history' | 'backup'

export function DatabaseManager() {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const { profiles, editingProfile } = useDBStore()
  const [activeTab, setActiveTab] = useState<DBTab>('connections')
  const connectedCount = profiles.filter(p => p.status === 'connected').length

  const tabs: { key: DBTab; label: string; icon: typeof Database }[] = [
    { key: 'connections', label: t('connectionsTab', 'database'), icon: Server },
    { key: 'explorer', label: t('explorerTab', 'database'), icon: Table2 },
    { key: 'sql', label: 'SQL', icon: Play },
    { key: 'history', label: t('historyTab', 'database'), icon: History },
    { key: 'backup', label: t('backupTab', 'database'), icon: HardDriveDownload },
  ]

  return (
    <div className="h-full flex flex-col relative" style={{ background: isLG ? 'rgba(10,15,10,0.35)' : 'var(--sidebar, #0d0d14)' }}>
      {/* Tab bar */}
      <div className={`flex items-center border-b shrink-0 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}
        style={{ background: isLG ? 'rgba(10,15,10,0.25)' : 'rgba(0,0,0,0.1)' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] border-b-2 transition-colors ${activeTab === key ? isLG ? 'border-emerald-400/40 text-white/60' : 'border-violet-400/40 text-white/60' : 'border-transparent text-white/25 hover:text-white/40'}`}>
            <Icon className="w-3 h-3" /><span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'connections' && <div className="h-full flex flex-col"><EngineDiscoveryPanel /><ConnectionListPanel /></div>}
        {activeTab === 'explorer' && <TableExplorer />}
        {activeTab === 'sql' && <SqlConsole />}
        {activeTab === 'history' && <QueryHistoryPanel />}
        {activeTab === 'backup' && <BackupPanel />}
      </div>

      {/* Footer */}
      <div className={`h-5 flex items-center justify-between px-3 border-t shrink-0 ${isLG ? 'border-emerald-500/[0.04]' : 'border-white/[0.04]'}`}>
        <div className="flex items-center gap-2">
          <Layers className="w-2.5 h-2.5 text-white/10" />
          <span className="text-[8px] text-white/15">Local-Database Manager v2.0.0</span>
        </div>
        <span className={`text-[8px] ${connectedCount > 0 ? 'text-emerald-400/30' : 'text-white/10'}`}>
          {connectedCount > 0 ? `${connectedCount} ${t('connectedN', 'database')}` : t('notConnected', 'database')}
        </span>
      </div>

      {/* Edit Connection Dialog (overlay) */}
      {editingProfile && <EditConnectionDialog />}
    </div>
  )
}