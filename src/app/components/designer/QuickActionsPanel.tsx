/**
 * @file QuickActionsPanel.tsx
 * @description AI Quick Actions panel — one-click code/text/document operations,
 *   context-aware suggestions, clipboard history, action execution with results
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags quick-actions, ai, clipboard, code-operations
 */

import { useState, useMemo } from 'react'
import {
  Copy, FileCode2, Globe, AlignLeft, RefreshCw, Zap, MessageCircle,
  MessageSquarePlus, AlertTriangle, TestTube2, FileText, Languages,
  PenLine, Maximize2, SpellCheck, ListCollapse, ArrowRightLeft,
  X, Check, Loader2, Clock, Clipboard, Trash2, Search, ChevronRight,
} from 'lucide-react'
import { useQuickActionsStore, QUICK_ACTIONS } from '../../stores/quick-actions-store'
import type { QuickAction, ActionType } from '../../stores/quick-actions-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import { useAppStore } from '../../stores/app-store'
import { toast } from 'sonner'

// ============================================
// Icon resolver
// ============================================

const ICON_MAP: Record<string, React.ElementType> = {
  Copy, FileCode2, Globe, AlignLeft, RefreshCw, Zap, MessageCircle,
  MessageSquarePlus, AlertTriangle, TestTube2, FileText, Languages,
  PenLine, Maximize2, SpellCheck, ListCollapse, ArrowRightLeft,
}

function ActionIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name]
  if (!Icon) {return <Zap className={className} />}
  return <Icon className={className} />
}

// ============================================
// Category Tabs
// ============================================

const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'code', label: '代码' },
  { id: 'text', label: '文本' },
  { id: 'document', label: '文档' },
  { id: 'ai', label: 'AI' },
] as const

// ============================================
// QuickActionsPanel
// ============================================

export function QuickActionsPanel() {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const { selectedFile } = useAppStore()
  const {
    panelOpen, closePanel, context,
    activeCategory, setActiveCategory,
    searchFilter, setSearchFilter,
    activeExecution, executeAction,
    history, clearHistory,
    clipboardHistory, clearClipboardHistory, pasteFromHistory,
    clipboardPanelOpen, toggleClipboardPanel,
    getFilteredActions,
  } = useQuickActionsStore()

  const [activeTab, setActiveTab] = useState<'actions' | 'history' | 'clipboard'>('actions')

  const filteredActions = useMemo(() => getFilteredActions(), [activeCategory, searchFilter])

  if (!panelOpen) {return null}

  const handleExecute = async (actionType: ActionType) => {
    const ctx = context || {
      selection: { text: '' },
      file: selectedFile ? { path: selectedFile, name: selectedFile.split('/').pop() || '', language: detectLanguage(selectedFile) } : undefined,
    }

    if (!ctx.selection.text) {
      toast.error(t('quickActions.noSelection', 'designer'))
      return
    }

    await executeAction(actionType, ctx)

    if (useQuickActionsStore.getState().activeExecution?.status === 'success') {
      toast.success(t('quickActions.actionComplete', 'designer'))
    }
  }

  return (
    <div
      className={`fixed right-4 top-14 z-50 w-80 rounded-xl border shadow-2xl overflow-hidden ${
        isLG ? 'border-emerald-500/[0.1]' : 'border-white/[0.08]'
      }`}
      style={{
        background: isLG ? 'rgba(8,12,8,0.96)' : 'rgba(12,12,20,0.96)',
        backdropFilter: 'blur(20px)',
        maxHeight: 'calc(100vh - 80px)',
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
      }`}>
        <div className="flex items-center gap-2">
          <Zap className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400/60' : 'text-violet-400/60'}`} />
          <span className="text-[11px] text-white/50">{t('quickActions.title', 'designer')}</span>
        </div>
        <button onClick={closePanel} className="p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/50">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 px-2 py-1 border-b border-white/[0.03]">
        {(['actions', 'history', 'clipboard'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-1 rounded text-[10px] transition-colors ${
              activeTab === tab
                ? isLG ? 'bg-emerald-500/10 text-emerald-400/70' : 'bg-white/[0.08] text-white/60'
                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
            }`}
          >
            {tab === 'actions' ? t('quickActions.tabActions', 'designer')
              : tab === 'history' ? t('quickActions.tabHistory', 'designer')
              : t('quickActions.tabClipboard', 'designer')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {activeTab === 'actions' && (
          <ActionsTab
            isLG={isLG}
            filteredActions={filteredActions}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            onExecute={handleExecute}
            activeExecution={activeExecution}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab isLG={isLG} history={history} onClear={clearHistory} />
        )}

        {activeTab === 'clipboard' && (
          <ClipboardTab
            isLG={isLG}
            items={clipboardHistory}
            onPaste={pasteFromHistory}
            onClear={clearClipboardHistory}
          />
        )}
      </div>

      {/* Footer — context info */}
      {context?.file && (
        <div className="px-3 py-1.5 border-t border-white/[0.03]">
          <span className="text-[9px] text-white/15 flex items-center gap-1">
            <FileCode2 className="w-2.5 h-2.5" />
            {context.file.name} · {context.selection.text.length} chars
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================
// Actions Tab
// ============================================

function ActionsTab({
  isLG, filteredActions, activeCategory, setActiveCategory,
  searchFilter, setSearchFilter, onExecute, activeExecution,
}: {
  isLG: boolean
  filteredActions: QuickAction[]
  activeCategory: string
  setActiveCategory: (cat: any) => void
  searchFilter: string
  setSearchFilter: (f: string) => void
  onExecute: (type: ActionType) => void
  activeExecution: any
}) {
  return (
    <div className="p-2">
      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
        <input
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          placeholder="Search actions..."
          className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-[10px] text-white/60 placeholder:text-white/15 outline-none focus:border-white/[0.1]"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-1 mb-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2 py-0.5 rounded-full text-[9px] transition-colors ${
              activeCategory === cat.id
                ? isLG ? 'bg-emerald-500/15 text-emerald-400/70' : 'bg-violet-500/15 text-violet-400/70'
                : 'bg-white/[0.03] text-white/25 hover:text-white/40 hover:bg-white/[0.06]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Actions grid */}
      <div className="space-y-0.5">
        {filteredActions.map(action => {
          const isProcessing = activeExecution?.actionType === action.type && activeExecution?.status === 'processing'
          return (
            <button
              key={action.id}
              onClick={() => onExecute(action.type)}
              disabled={isProcessing}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors group ${
                isProcessing
                  ? 'bg-amber-500/10 cursor-wait'
                  : isLG
                    ? 'hover:bg-emerald-500/[0.06]'
                    : 'hover:bg-white/[0.04]'
              }`}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                action.requiresAI
                  ? isLG ? 'bg-emerald-500/10' : 'bg-violet-500/10'
                  : 'bg-white/[0.04]'
              }`}>
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 text-amber-400/60 animate-spin" />
                ) : (
                  <ActionIcon name={action.icon} className={`w-3 h-3 ${
                    action.requiresAI
                      ? isLG ? 'text-emerald-400/50' : 'text-violet-400/50'
                      : 'text-white/30'
                  }`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors truncate">
                  {action.title}
                </div>
                <div className="text-[8px] text-white/15 truncate">{action.description}</div>
              </div>
              {action.shortcut && (
                <code className="text-[8px] text-white/15 bg-white/[0.03] px-1 py-0.5 rounded shrink-0">
                  {action.shortcut}
                </code>
              )}
              {action.requiresAI && (
                <span className={`text-[7px] px-1 py-0.5 rounded shrink-0 ${
                  isLG ? 'bg-emerald-500/10 text-emerald-400/40' : 'bg-violet-500/10 text-violet-400/40'
                }`}>
                  AI
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Execution result */}
      {activeExecution && activeExecution.status !== 'processing' && (
        <div className={`mt-2 p-2 rounded-lg border ${
          activeExecution.status === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
            : 'border-red-500/20 bg-red-500/[0.03]'
        }`}>
          <div className="flex items-center gap-1 mb-1">
            {activeExecution.status === 'success' ? (
              <Check className="w-3 h-3 text-emerald-400/60" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-red-400/60" />
            )}
            <span className="text-[9px] text-white/30">
              {activeExecution.duration}ms
            </span>
          </div>
          <pre className="text-[9px] text-white/40 max-h-24 overflow-y-auto font-mono whitespace-pre-wrap">
            {activeExecution.status === 'success'
              ? activeExecution.output.slice(0, 300) + (activeExecution.output.length > 300 ? '...' : '')
              : activeExecution.error}
          </pre>
          {activeExecution.status === 'success' && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeExecution.output)
                toast.success('Copied to clipboard')
              }}
              className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded text-[8px] text-white/25 hover:text-white/50 hover:bg-white/[0.04]"
            >
              <Copy className="w-2.5 h-2.5" /> Copy result
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// History Tab
// ============================================

function HistoryTab({ isLG, history, onClear }: {
  isLG: boolean
  history: any[]
  onClear: () => void
}) {
  if (history.length === 0) {
    return (
      <div className="p-4 text-center">
        <Clock className="w-6 h-6 mx-auto text-white/10 mb-2" />
        <p className="text-[10px] text-white/20">No action history</p>
      </div>
    )
  }

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] text-white/20">{history.length} actions</span>
        <button onClick={onClear} className="text-[9px] text-white/20 hover:text-red-400/60 flex items-center gap-1">
          <Trash2 className="w-2.5 h-2.5" /> Clear
        </button>
      </div>
      <div className="space-y-1">
        {history.map(exec => {
          const action = QUICK_ACTIONS.find(a => a.type === exec.actionType)
          return (
            <div key={exec.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                exec.status === 'success' ? 'bg-emerald-400/60' : 'bg-red-400/60'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-white/40 truncate">{action?.title || exec.actionType}</div>
                <div className="text-[8px] text-white/15">{exec.duration}ms · {new Date(exec.timestamp).toLocaleTimeString()}</div>
              </div>
              {exec.status === 'success' && (
                <button
                  onClick={() => navigator.clipboard.writeText(exec.output)}
                  className="p-0.5 rounded text-white/15 hover:text-white/40"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// Clipboard Tab
// ============================================

function ClipboardTab({ isLG, items, onPaste, onClear }: {
  isLG: boolean
  items: any[]
  onPaste: (id: string) => string | null
  onClear: () => void
}) {
  if (items.length === 0) {
    return (
      <div className="p-4 text-center">
        <Clipboard className="w-6 h-6 mx-auto text-white/10 mb-2" />
        <p className="text-[10px] text-white/20">Clipboard empty</p>
      </div>
    )
  }

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] text-white/20">{items.length} items</span>
        <button onClick={onClear} className="text-[9px] text-white/20 hover:text-red-400/60 flex items-center gap-1">
          <Trash2 className="w-2.5 h-2.5" /> Clear
        </button>
      </div>
      <div className="space-y-1">
        {items.map((item: any) => (
          <button
            key={item.id}
            onClick={() => {
              onPaste(item.id)
              toast.success('Copied from history')
            }}
            className="w-full text-left px-2 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[8px] px-1 py-0.5 rounded ${
                item.type === 'code'
                  ? isLG ? 'bg-emerald-500/10 text-emerald-400/40' : 'bg-violet-500/10 text-violet-400/40'
                  : 'bg-white/[0.04] text-white/20'
              }`}>
                {item.type}
              </span>
              {item.language && (
                <span className="text-[8px] text-white/15">{item.language}</span>
              )}
              <span className="text-[8px] text-white/10 ml-auto">{item.size} chars</span>
            </div>
            <pre className="text-[9px] text-white/30 font-mono truncate max-w-full">
              {item.content.slice(0, 80)}
            </pre>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Helpers
// ============================================

function detectLanguage(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) {return 'typescript'}
  if (path.endsWith('.jsx') || path.endsWith('.js')) {return 'javascript'}
  if (path.endsWith('.css')) {return 'css'}
  if (path.endsWith('.json')) {return 'json'}
  if (path.endsWith('.md')) {return 'markdown'}
  if (path.endsWith('.html')) {return 'html'}
  return 'text'
}
