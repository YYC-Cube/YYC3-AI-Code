/**
 * @file EnvVarsPanel.tsx
 * @description Project-level environment variable management panel —
 * CRUD, scope filtering, secret masking, search, export
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 * @status active
 * @license MIT
 * @prefix ev*
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Search, Plus, Trash2, Copy, Eye, EyeOff, Lock, Unlock,
  Download, X, Shield, ChevronDown, Check, AlertTriangle,
  Server, Globe, Braces,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useLiquidGlass } from '../../utils/liquid-glass'

/* ================================================================
   Types
   ================================================================ */

type EvScope = 'all' | 'development' | 'staging' | 'production'

interface EvVar {
  id: string
  key: string
  value: string
  scope: EvScope
  isSecret: boolean
  isRequired: boolean
  isInherited: boolean
  description?: string
}

/* ================================================================
   Mock Data — 12 realistic env vars
   ================================================================ */

const EV_INITIAL_VARS: EvVar[] = [
  { id: 'ev-1', key: 'NEXT_PUBLIC_API_URL', value: 'https://api.yyc3.dev/v2', scope: 'all', isSecret: false, isRequired: true, isInherited: false, description: 'Primary API endpoint' },
  { id: 'ev-2', key: 'API_SECRET_KEY', value: 'sk-yyc3-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5', scope: 'all', isSecret: true, isRequired: true, isInherited: false, description: 'API authentication secret' },
  { id: 'ev-3', key: 'NEXT_PUBLIC_WS_URL', value: 'wss://ws.yyc3.dev/realtime', scope: 'all', isSecret: false, isRequired: true, isInherited: false, description: 'WebSocket server for real-time collab' },
  { id: 'ev-4', key: 'SENTRY_DSN', value: 'https://abc123@o456.ingest.sentry.io/789', scope: 'production', isSecret: true, isRequired: false, isInherited: false, description: 'Sentry error tracking DSN' },
  { id: 'ev-5', key: 'NEXT_PUBLIC_GA_ID', value: 'G-YYC3ANALYTICS', scope: 'production', isSecret: false, isRequired: false, isInherited: false, description: 'Google Analytics measurement ID' },
  { id: 'ev-6', key: 'FEATURE_FLAG_AI_V2', value: 'true', scope: 'development', isSecret: false, isRequired: false, isInherited: false, description: 'Enable AI v2 experimental features' },
  { id: 'ev-7', key: 'DATABASE_URL', value: 'postgresql://yyc3_user:p4ssw0rd@db.yyc3.dev:5432/yyc3_main', scope: 'all', isSecret: true, isRequired: true, isInherited: false, description: 'PostgreSQL connection string' },
  { id: 'ev-8', key: 'REDIS_URL', value: 'redis://cache.yyc3.dev:6379/0', scope: 'all', isSecret: true, isRequired: true, isInherited: false, description: 'Redis cache connection' },
  { id: 'ev-9', key: 'OPENAI_API_KEY', value: 'sk-proj-openai-xxxxxxxxxxxxxxxxxxxx', scope: 'all', isSecret: true, isRequired: true, isInherited: false, description: 'OpenAI API key for AI features' },
  { id: 'ev-10', key: 'NODE_ENV', value: 'development', scope: 'development', isSecret: false, isRequired: true, isInherited: true, description: 'Node environment mode' },
  { id: 'ev-11', key: 'FEATURE_FLAG_COLLAB', value: 'false', scope: 'staging', isSecret: false, isRequired: false, isInherited: false, description: 'Enable collaborative editing' },
  { id: 'ev-12', key: 'LOG_LEVEL', value: 'debug', scope: 'development', isSecret: false, isRequired: false, isInherited: true, description: 'Application log verbosity' },
]

/* ================================================================
   Helpers
   ================================================================ */

const EV_SCOPE_CONFIG: Record<EvScope, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  all: { label: 'All', color: 'text-white/60', bg: 'bg-white/10', icon: Globe },
  development: { label: 'Development', color: 'text-blue-400', bg: 'bg-blue-500/15', icon: Braces },
  staging: { label: 'Staging', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: Server },
  production: { label: 'Production', color: 'text-red-400', bg: 'bg-red-500/15', icon: Shield },
}

/* ================================================================
   Component
   ================================================================ */

export function EnvVarsPanel() {
  const { isLG } = useLiquidGlass()

  const [evVars, setEvVars] = useState<EvVar[]>(EV_INITIAL_VARS)
  const [evScope, setEvScope] = useState<EvScope>('all')
  const [evSearch, setEvSearch] = useState('')
  const [evVisibleSecrets, setEvVisibleSecrets] = useState<Set<string>>(new Set())
  const [evEditingId, setEvEditingId] = useState<string | null>(null)
  const [evEditKey, setEvEditKey] = useState('')
  const [evEditValue, setEvEditValue] = useState('')

  const searchLower = evSearch.toLowerCase()

  const evFiltered = useMemo(() => {
    return evVars.filter(v => {
      const scopeMatch = evScope === 'all' || v.scope === 'all' || v.scope === evScope
      const searchMatch = !searchLower ||
        v.key.toLowerCase().includes(searchLower) ||
        (!v.isSecret && v.value.toLowerCase().includes(searchLower))
      return scopeMatch && searchMatch
    })
  }, [evVars, evScope, searchLower])

  const evScopeCounts = useMemo(() => {
    const counts: Record<EvScope, number> = { all: evVars.length, development: 0, staging: 0, production: 0 }
    for (const v of evVars) {
      if (v.scope !== 'all' && counts[v.scope] !== undefined) {
        counts[v.scope]++
      }
    }
    return counts
  }, [evVars])

  const evToggleSecret = useCallback((id: string) => {
    setEvVisibleSecrets(prev => {
      const next = new Set(prev)
      if (next.has(id)) {next.delete(id)}
      else {next.add(id)}
      return next
    })
  }, [])

  const evToggleLock = useCallback((id: string) => {
    setEvVars(prev => prev.map(v => v.id === id ? { ...v, isSecret: !v.isSecret } : v))
  }, [])

  const evDelete = useCallback((id: string) => {
    setEvVars(prev => prev.filter(v => v.id !== id))
    toast.success('Variable deleted')
  }, [])

  const evCopy = useCallback((value: string) => {
    navigator.clipboard.writeText(value).then(() => toast.success('Copied to clipboard'))
  }, [])

  const evAdd = useCallback(() => {
    const newId = `ev-${Date.now()}`
    const newVar: EvVar = {
      id: newId,
      key: '',
      value: '',
      scope: evScope === 'all' ? 'development' : evScope,
      isSecret: false,
      isRequired: false,
      isInherited: false,
    }
    setEvVars(prev => [newVar, ...prev])
    setEvEditingId(newId)
    setEvEditKey('')
    setEvEditValue('')
  }, [evScope])

  const evStartEdit = useCallback((v: EvVar) => {
    setEvEditingId(v.id)
    setEvEditKey(v.key)
    setEvEditValue(v.value)
  }, [])

  const evSaveEdit = useCallback(() => {
    if (!evEditingId) {return}
    setEvVars(prev => prev.map(v =>
      v.id === evEditingId
        ? { ...v, key: evEditKey.trim() || v.key, value: evEditValue }
        : v
    ))
    setEvEditingId(null)
  }, [evEditingId, evEditKey, evEditValue])

  const evExport = useCallback(() => {
    const envStr = evFiltered
      .map(v => `${v.key}=${v.isSecret ? '********' : v.value}`)
      .join('\n')
    navigator.clipboard.writeText(envStr).then(() => toast.success('Exported as .env format'))
  }, [evFiltered])

  // Keyboard: Enter to save, Escape to cancel edit
  const evKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {evSaveEdit()}
    if (e.key === 'Escape') {setEvEditingId(null)}
  }, [evSaveEdit])

  const accentText = isLG ? 'text-emerald-400' : 'text-violet-400'
  const accentBg = isLG ? 'bg-emerald-500/10' : 'bg-violet-500/10'
  const accentBgHover = isLG ? 'hover:bg-emerald-500/20' : 'hover:bg-violet-500/20'

  return (
    <div className="h-full flex flex-col bg-[#0a0a14] text-white overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield className={`w-5 h-5 ${accentText}`} />
          <span className="text-sm text-white/80">Environment Variables</span>
          <span className="text-[10px] text-white/20 px-2 py-0.5 rounded bg-white/[0.04]">
            {evFiltered.length} vars
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={evExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/70 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export .env
          </button>
          <button
            onClick={evAdd}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] ${accentText} ${accentBg} ${accentBgHover} transition-colors`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Variable
          </button>
        </div>
      </div>

      {/* ── Search + Scope Tabs ── */}
      <div className="px-4 py-2.5 border-b border-white/[0.04] space-y-2.5 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            type="text"
            value={evSearch}
            onChange={e => setEvSearch(e.target.value)}
            placeholder="Search variables..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-white/[0.12] transition-colors"
          />
          {evSearch && (
            <button onClick={() => setEvSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Scope Tabs */}
        <div className="flex items-center gap-1">
          {(Object.keys(EV_SCOPE_CONFIG) as EvScope[]).map(scope => {
            const cfg = EV_SCOPE_CONFIG[scope]
            const count = evScopeCounts[scope]
            const active = evScope === scope
            return (
              <button
                key={scope}
                onClick={() => setEvScope(scope)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${
                  active
                    ? `${cfg.bg} ${cfg.color}`
                    : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                }`}
              >
                <cfg.icon className="w-3.5 h-3.5" />
                {cfg.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/10' : 'bg-white/[0.04]'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Variable List ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1.2fr_100px_110px] gap-2 px-4 py-2 text-[9px] text-white/20 uppercase tracking-wider border-b border-white/[0.04] sticky top-0 bg-[#0a0a14] z-10">
          <span>Key</span>
          <span>Value</span>
          <span>Scope</span>
          <span className="text-right">Actions</span>
        </div>

        <AnimatePresence initial={false}>
          {evFiltered.map(v => {
            const scopeCfg = EV_SCOPE_CONFIG[v.scope] || EV_SCOPE_CONFIG.all
            const isEditing = evEditingId === v.id
            const isRevealed = evVisibleSecrets.has(v.id)

            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-[1fr_1.2fr_100px_110px] gap-2 items-center px-4 py-2 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group"
              >
                {/* Key */}
                <div className="min-w-0">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={evEditKey}
                      onChange={e => setEvEditKey(e.target.value)}
                      onKeyDown={evKeyDown}
                      placeholder="VARIABLE_NAME"
                      className="w-full bg-white/[0.06] border border-white/[0.12] rounded px-2 py-1 text-[11px] text-white/80 font-mono outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        onClick={() => evStartEdit(v)}
                        className="text-[11px] text-white/70 font-mono truncate hover:text-white/90 transition-colors text-left"
                        title={v.key}
                      >
                        {v.key || <span className="text-white/20 italic">empty key</span>}
                      </button>
                      {v.isRequired && (
                        <span className="text-[8px] text-red-400/60 bg-red-500/10 px-1 py-0.5 rounded shrink-0">REQ</span>
                      )}
                      {v.isInherited && (
                        <span className="text-[8px] text-cyan-400/60 bg-cyan-500/10 px-1 py-0.5 rounded shrink-0">INH</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Value */}
                <div className="min-w-0">
                  {isEditing ? (
                    <input
                      value={evEditValue}
                      onChange={e => setEvEditValue(e.target.value)}
                      onKeyDown={evKeyDown}
                      placeholder="value"
                      className="w-full bg-white/[0.06] border border-white/[0.12] rounded px-2 py-1 text-[11px] text-white/60 font-mono outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 min-w-0">
                      {v.isSecret && !isRevealed ? (
                        <button
                          onClick={() => evToggleSecret(v.id)}
                          className="text-[11px] text-white/20 font-mono tracking-wider hover:text-white/40 transition-colors"
                        >
                          {'●'.repeat(8)}
                        </button>
                      ) : (
                        <span className="text-[11px] text-white/50 font-mono truncate" title={v.value}>
                          {v.value || <span className="text-white/15 italic">empty</span>}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Scope Badge */}
                <div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] ${scopeCfg.bg} ${scopeCfg.color}`}>
                    <scopeCfg.icon className="w-2.5 h-2.5" />
                    {scopeCfg.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-0.5">
                  {isEditing ? (
                    <>
                      <button
                        onClick={evSaveEdit}
                        className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-400/60 hover:text-emerald-400 transition-colors"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEvEditingId(null)}
                        className="p-1.5 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      {v.isSecret && (
                        <button
                          onClick={() => evToggleSecret(v.id)}
                          className="p-1.5 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100"
                          title={isRevealed ? 'Hide value' : 'Reveal value'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => evToggleLock(v.id)}
                        className="p-1.5 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100"
                        title={v.isSecret ? 'Mark as plaintext' : 'Mark as secret'}
                      >
                        {v.isSecret ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => evCopy(v.value)}
                        className="p-1.5 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy value"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => evDelete(v.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {evFiltered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-white/15">
            <AlertTriangle className="w-8 h-8 mb-3" />
            <span className="text-sm">No variables found</span>
            <span className="text-[11px] mt-1">Try adjusting your search or scope filter</span>
          </div>
        )}
      </div>
    </div>
  )
}
