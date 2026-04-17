/**
 * @file CodeIntelligence.tsx
 * @description AI 代码智能辅助 — 自动补全建议弹出层、错误诊断面板、属性提示
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags code-intelligence, autocomplete, diagnostics, suggestions
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Sparkles, AlertCircle, AlertTriangle, Info, Check,
  ChevronRight, X, Lightbulb, Zap, Code2, Bug,
  Wrench, FileCode2,
} from 'lucide-react'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'

// ============================================
// Types
// ============================================

export interface CompletionItem {
  label: string
  kind: 'function' | 'variable' | 'keyword' | 'snippet' | 'property' | 'type' | 'import'
  detail: string
  documentation?: string
  insertText: string
  sortOrder: number
}

export interface DiagnosticItem {
  line: number
  column: number
  severity: 'error' | 'warning' | 'info' | 'hint'
  message: string
  source: string
  code?: string
  quickFix?: string
}

// ============================================
// Mock completions database
// ============================================

const REACT_COMPLETIONS: CompletionItem[] = [
  { label: 'useState', kind: 'function', detail: 'React Hook', documentation: 'Returns a stateful value and a function to update it.', insertText: 'const [state, setState] = useState()', sortOrder: 1 },
  { label: 'useEffect', kind: 'function', detail: 'React Hook', documentation: 'Performs side effects in function components.', insertText: 'useEffect(() => {\n  \n}, [])', sortOrder: 2 },
  { label: 'useCallback', kind: 'function', detail: 'React Hook', documentation: 'Returns a memoized callback.', insertText: 'useCallback(() => {\n  \n}, [])', sortOrder: 3 },
  { label: 'useMemo', kind: 'function', detail: 'React Hook', documentation: 'Returns a memoized value.', insertText: 'useMemo(() => {\n  \n}, [])', sortOrder: 4 },
  { label: 'useRef', kind: 'function', detail: 'React Hook', documentation: 'Returns a mutable ref object.', insertText: 'useRef(null)', sortOrder: 5 },
  { label: 'useContext', kind: 'function', detail: 'React Hook', documentation: 'Accepts a context object and returns the current context value.', insertText: 'useContext()', sortOrder: 6 },
  { label: 'interface', kind: 'keyword', detail: 'TypeScript', documentation: 'Define a TypeScript interface.', insertText: 'interface Props {\n  \n}', sortOrder: 10 },
  { label: 'export default', kind: 'keyword', detail: 'ES Module', documentation: 'Default export.', insertText: 'export default function Component() {\n  return (\n    <div>\n      \n    </div>\n  )\n}', sortOrder: 11 },
  { label: 'className', kind: 'property', detail: 'JSX Attribute', documentation: 'CSS class name for the element.', insertText: 'className=""', sortOrder: 20 },
  { label: 'onClick', kind: 'property', detail: 'Event Handler', documentation: 'Click event handler.', insertText: 'onClick={() => {}}', sortOrder: 21 },
  { label: 'onChange', kind: 'property', detail: 'Event Handler', documentation: 'Change event handler.', insertText: 'onChange={(e) => {}}', sortOrder: 22 },
  { label: 'children', kind: 'property', detail: 'React.ReactNode', documentation: 'Child elements.', insertText: 'children', sortOrder: 23 },
]

const TAILWIND_COMPLETIONS: CompletionItem[] = [
  { label: 'flex', kind: 'snippet', detail: 'Tailwind CSS', insertText: 'flex items-center justify-center', sortOrder: 1 },
  { label: 'grid', kind: 'snippet', detail: 'Tailwind CSS', insertText: 'grid grid-cols-3 gap-4', sortOrder: 2 },
  { label: 'bg-gradient', kind: 'snippet', detail: 'Tailwind CSS', insertText: 'bg-gradient-to-r from-blue-500 to-purple-500', sortOrder: 3 },
  { label: 'transition', kind: 'snippet', detail: 'Tailwind CSS', insertText: 'transition-all duration-300 ease-in-out', sortOrder: 4 },
  { label: 'shadow', kind: 'snippet', detail: 'Tailwind CSS', insertText: 'shadow-lg hover:shadow-xl', sortOrder: 5 },
  { label: 'responsive', kind: 'snippet', detail: 'Tailwind CSS', insertText: 'sm:flex md:grid lg:flex-row', sortOrder: 6 },
]

const ZUSTAND_COMPLETIONS: CompletionItem[] = [
  { label: 'create', kind: 'function', detail: 'Zustand', documentation: 'Create a Zustand store.', insertText: 'create<State>((set, get) => ({\n  \n}))', sortOrder: 1 },
  { label: 'useStore', kind: 'function', detail: 'Zustand', documentation: 'Use a Zustand store hook.', insertText: 'const { } = useStore()', sortOrder: 2 },
]

// ============================================
// Mock diagnostics generator
// ============================================

function generateMockDiagnostics(code: string, _filePath: string): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = []
  const lines = code.split('\n')

  lines.forEach((line, idx) => {
    // Detect unused imports
    if (line.includes('import') && line.includes('{')) {
      const imported = line.match(/\{([^}]+)\}/)?.[1]?.split(',').map(s => s.trim()) || []
      const restOfCode = lines.slice(idx + 1).join('\n')
      for (const name of imported) {
        if (name && !restOfCode.includes(name)) {
          diagnostics.push({
            line: idx + 1, column: line.indexOf(name) + 1,
            severity: 'warning', message: `'${name}' is imported but never used.`,
            source: 'ts', code: '6133',
            quickFix: `Remove unused import '${name}'`,
          })
        }
      }
    }

    // console.log detection
    if (line.includes('console.log') && !line.trim().startsWith('//')) {
      diagnostics.push({
        line: idx + 1, column: line.indexOf('console.log') + 1,
        severity: 'info', message: 'Unexpected console statement.',
        source: 'eslint', code: 'no-console',
        quickFix: 'Remove console.log',
      })
    }

    // any type detection
    if (line.includes(': any') || line.includes(':any')) {
      diagnostics.push({
        line: idx + 1, column: line.indexOf('any') + 1,
        severity: 'warning', message: 'Unexpected any. Specify a more specific type.',
        source: 'ts-eslint', code: '@typescript-eslint/no-explicit-any',
        quickFix: 'Replace with specific type',
      })
    }

    // Missing key prop hint
    if (line.includes('.map(') && !lines.slice(idx, idx + 5).join('\n').includes('key=')) {
      diagnostics.push({
        line: idx + 1, column: 1,
        severity: 'hint', message: 'Ensure elements in .map() have a unique "key" prop.',
        source: 'react', code: 'react/jsx-key',
      })
    }
  })

  return diagnostics.slice(0, 10) // limit
}

// ============================================
// Autocomplete Popup
// ============================================

interface AutocompletePopupProps {
  visible: boolean
  items: CompletionItem[]
  selectedIndex: number
  position: { top: number; left: number }
  onSelect: (item: CompletionItem) => void
  onClose: () => void
}

function AutocompletePopup({ visible, items, selectedIndex, position, onSelect, onClose }: AutocompletePopupProps) {
  const { isLG } = useLiquidGlass()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-idx="${selectedIndex}"]`)
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!visible || items.length === 0) {return null}

  const kindIcons: Record<string, React.ElementType> = {
    function: Zap,
    variable: Code2,
    keyword: FileCode2,
    snippet: Sparkles,
    property: ChevronRight,
    type: Info,
    import: FileCode2,
  }

  const kindColors: Record<string, string> = {
    function: 'text-blue-400',
    variable: 'text-cyan-400',
    keyword: 'text-purple-400',
    snippet: 'text-amber-400',
    property: 'text-emerald-400',
    type: 'text-rose-400',
    import: 'text-violet-400',
  }

  return (
    <div
      className={`absolute z-[60] w-72 rounded-lg border overflow-hidden ${
        isLG ? 'border-emerald-500/[0.12]' : 'border-white/[0.1]'
      }`}
      style={{
        top: position.top,
        left: position.left,
        background: isLG ? 'rgba(8,14,8,0.97)' : 'rgba(12,12,22,0.97)',
        backdropFilter: 'blur(20px)',
        boxShadow: isLG
          ? '0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.06)'
          : '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className={`px-2.5 py-1.5 flex items-center gap-1.5 border-b ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.06]'
      }`}>
        <Sparkles className={`w-3 h-3 ${isLG ? 'text-emerald-400/50' : 'text-violet-400/50'}`} />
        <span className="text-[9px] text-white/25">AI Suggestions</span>
      </div>

      <div ref={listRef} className="max-h-48 overflow-y-auto py-0.5">
        {items.map((item, i) => {
          const IconComp = kindIcons[item.kind] || Code2
          return (
            <div
              key={`${item.label}-${i}`}
              data-idx={i}
              onClick={() => onSelect(item)}
              className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-colors ${
                i === selectedIndex
                  ? isLG ? 'bg-emerald-500/[0.1]' : 'bg-white/[0.06]'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 shrink-0 ${kindColors[item.kind] || 'text-white/30'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white/70 truncate font-mono">{item.label}</div>
              </div>
              <span className="text-[9px] text-white/20 shrink-0">{item.detail}</span>
            </div>
          )
        })}
      </div>

      {items[selectedIndex]?.documentation && (
        <div className={`px-2.5 py-2 border-t text-[10px] text-white/30 ${
          isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.06]'
        }`}>
          {items[selectedIndex].documentation}
        </div>
      )}
    </div>
  )
}

// ============================================
// Diagnostics Panel
// ============================================

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticItem[]
  onGoToLine?: (line: number) => void
  onApplyFix?: (diagnostic: DiagnosticItem) => void
}

export function DiagnosticsPanel({ diagnostics, onGoToLine, onApplyFix }: DiagnosticsPanelProps) {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const sevIcon: Record<string, React.ElementType> = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    hint: Lightbulb,
  }

  const sevColor: Record<string, string> = {
    error: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
    hint: 'text-emerald-400',
  }

  const sevBg: Record<string, string> = {
    error: 'bg-red-500/[0.06]',
    warning: 'bg-amber-500/[0.06]',
    info: 'bg-blue-500/[0.06]',
    hint: 'bg-emerald-500/[0.06]',
  }

  const errorCount = diagnostics.filter(d => d.severity === 'error').length
  const warnCount = diagnostics.filter(d => d.severity === 'warning').length
  const infoCount = diagnostics.filter(d => d.severity === 'info' || d.severity === 'hint').length

  if (diagnostics.length === 0) {return null}

  return (
    <div className={`border-t ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.06]'}`}>
      {/* Summary bar */}
      <div className={`flex items-center gap-3 px-3 py-1.5 ${
        isLG ? 'bg-emerald-500/[0.02]' : 'bg-white/[0.02]'
      }`}>
        <Bug className={`w-3 h-3 ${isLG ? 'text-emerald-400/40' : 'text-violet-400/40'}`} />
        <span className="text-[10px] text-white/40">{t('codeIntel.diagnostics', 'designer')}</span>
        <div className="flex items-center gap-2 ml-auto">
          {errorCount > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-red-400/60">
              <AlertCircle className="w-2.5 h-2.5" /> {errorCount}
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-amber-400/60">
              <AlertTriangle className="w-2.5 h-2.5" /> {warnCount}
            </span>
          )}
          {infoCount > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-blue-400/60">
              <Info className="w-2.5 h-2.5" /> {infoCount}
            </span>
          )}
        </div>
      </div>

      {/* Diagnostics list */}
      <div className="max-h-32 overflow-y-auto">
        {diagnostics.map((d, i) => {
          const SevIcon = sevIcon[d.severity] || Info
          return (
            <div
              key={`${d.line}-${d.column}-${i}`}
              className={`flex items-start gap-2 px-3 py-1.5 cursor-pointer transition-colors hover:bg-white/[0.03] ${sevBg[d.severity]}`}
              onClick={() => onGoToLine?.(d.line)}
            >
              <SevIcon className={`w-3 h-3 mt-0.5 shrink-0 ${sevColor[d.severity]}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/60 truncate">{d.message}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-white/20 font-mono">
                    L{d.line}:{d.column}
                  </span>
                  <span className="text-[9px] text-white/15">{d.source}{d.code ? `(${d.code})` : ''}</span>
                </div>
              </div>
              {d.quickFix && (
                <button
                  onClick={(e) => { e.stopPropagation(); onApplyFix?.(d) }}
                  className={`shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] transition-colors ${
                    isLG
                      ? 'text-emerald-400/40 hover:text-emerald-400/70 hover:bg-emerald-500/[0.08]'
                      : 'text-violet-400/40 hover:text-violet-400/70 hover:bg-violet-500/[0.08]'
                  }`}
                  title={d.quickFix}
                >
                  <Wrench className="w-2.5 h-2.5" />
                  Fix
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
// useCodeIntelligence Hook
// ============================================

export function useCodeIntelligence(code: string, filePath: string) {
  const [completions, setCompletions] = useState<CompletionItem[]>([])
  const [completionVisible, setCompletionVisible] = useState(false)
  const [completionIndex, setCompletionIndex] = useState(0)
  const [completionPosition, setCompletionPosition] = useState({ top: 0, left: 0 })
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([])
  const triggerTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Generate diagnostics on code change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const diags = generateMockDiagnostics(code, filePath)
      setDiagnostics(diags)
    }, 1500)
    return () => clearTimeout(timer)
  }, [code, filePath])

  // Trigger completions based on current word
  const triggerCompletion = useCallback((currentWord: string, caretPosition: { top: number; left: number }) => {
    if (triggerTimeoutRef.current) {clearTimeout(triggerTimeoutRef.current)}

    if (currentWord.length < 2) {
      setCompletionVisible(false)
      return
    }

    triggerTimeoutRef.current = setTimeout(() => {
      const lw = currentWord.toLowerCase()
      const allCompletions = [...REACT_COMPLETIONS, ...TAILWIND_COMPLETIONS, ...ZUSTAND_COMPLETIONS]
      const filtered = allCompletions
        .filter(c => c.label.toLowerCase().includes(lw))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, 8)

      if (filtered.length > 0) {
        setCompletions(filtered)
        setCompletionIndex(0)
        setCompletionPosition(caretPosition)
        setCompletionVisible(true)
      } else {
        setCompletionVisible(false)
      }
    }, 300)
  }, [])

  const acceptCompletion = useCallback((item: CompletionItem) => {
    setCompletionVisible(false)
    return item.insertText
  }, [])

  const navigateCompletion = useCallback((direction: 'up' | 'down') => {
    setCompletionIndex(prev => {
      if (direction === 'up') {return Math.max(0, prev - 1)}
      return Math.min(completions.length - 1, prev + 1)
    })
  }, [completions.length])

  const dismissCompletion = useCallback(() => {
    setCompletionVisible(false)
  }, [])

  return {
    completions,
    completionVisible,
    completionIndex,
    completionPosition,
    diagnostics,
    triggerCompletion,
    acceptCompletion,
    navigateCompletion,
    dismissCompletion,
    AutocompletePopup,
  }
}
