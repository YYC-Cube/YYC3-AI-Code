/**
 * @file RightPanel.tsx
 * @description Code detail + multi-tab terminal panel — syntax display, multi-session terminal, command history
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-13
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags code-viewer, terminal, multi-tab, command-history
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  FileCode2, Copy, Search, Plus, ChevronRight,
  WrapText, Terminal as TerminalIcon, Trash2, Maximize2,
  X,
} from 'lucide-react'
import { useAppStore } from '../../stores/app-store'
import { usePluginStore } from '../../stores/plugin-store'
import { ScrollArea } from '../ui/scroll-area'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable'
import { MOCK_FILE_CONTENTS } from '../../utils/file-contents'
import { FileService } from '../../services/file-service'
import { createLogger } from '../../utils/logger'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'

const log = createLogger('RightPanel')

// ============================================
// Constants
// ============================================

const MAX_TERMINAL_LINES = 500

type TermLineType = 'text' | 'command' | 'info' | 'success' | 'error' | 'warning'

interface TermLine {
  text: string
  type: TermLineType
}

interface TerminalSession {
  id: string
  name: string
  lines: TermLine[]
  history: string[]
  historyIndex: number
  input: string
}

const INITIAL_TERMINAL_LINES: TermLine[] = [
  { text: 'YYC\u00B3 CloudPivot AI \u2014 Integrated Terminal', type: 'info' },
  { text: '$ pnpm dev', type: 'command' },
  { text: '  VITE v5.4.0  ready in 340ms', type: 'success' },
  { text: '', type: 'text' },
  { text: '  \u279E  Local:   http://localhost:5173/', type: 'info' },
  { text: '  \u279E  Network: http://192.168.1.100:5173/', type: 'info' },
  { text: '', type: 'text' },
]

// ============================================
// Terminal Colors
// ============================================

function getTermColor(type: TermLineType, isLG: boolean): string {
  switch (type) {
    case 'command': return 'text-cyan-400/80'
    case 'info': return isLG ? 'text-emerald-400/60' : 'text-blue-400/60'
    case 'success': return 'text-emerald-400/70'
    case 'error': return 'text-red-400/70'
    case 'warning': return 'text-amber-400/70'
    default: return 'text-white/50'
  }
}

// ============================================
// Simulated command execution
// ============================================

function executeCommand(cmd: string): TermLine[] {
  const trimmed = cmd.trim()
  if (!trimmed) {return []}

  const output: TermLine[] = [
    { text: `$ ${trimmed}`, type: 'command' },
  ]

  const lower = trimmed.toLowerCase()

  if (lower === 'clear' || lower === 'cls') {
    return [{ text: '__CLEAR__', type: 'text' }]
  }
  if (lower === 'help') {
    output.push(
      { text: 'Available commands:', type: 'info' },
      { text: '  help     - Show this help', type: 'text' },
      { text: '  clear    - Clear terminal', type: 'text' },
      { text: '  ls       - List files', type: 'text' },
      { text: '  pwd      - Print working directory', type: 'text' },
      { text: '  date     - Show current date', type: 'text' },
      { text: '  echo     - Echo text', type: 'text' },
      { text: '  whoami   - Show current user', type: 'text' },
      { text: '  uname    - System info', type: 'text' },
      { text: '  cat      - Display file (simulated)', type: 'text' },
      { text: '  git      - Git commands (simulated)', type: 'text' },
      { text: '  npm/pnpm - Package commands (simulated)', type: 'text' },
    )
    return output
  }
  if (lower === 'pwd') {
    output.push({ text: '/home/yyc3/project', type: 'text' })
    return output
  }
  if (lower === 'whoami') {
    output.push({ text: 'yyc3-dev', type: 'text' })
    return output
  }
  if (lower === 'uname' || lower === 'uname -a') {
    output.push({ text: 'YYC3-OS 6.2.0 x86_64 GNU/Linux (simulated)', type: 'text' })
    return output
  }
  if (lower === 'ls' || lower === 'ls -la') {
    output.push(
      { text: 'drwxr-xr-x  src/', type: 'text' },
      { text: 'drwxr-xr-x  public/', type: 'text' },
      { text: '-rw-r--r--  package.json', type: 'text' },
      { text: '-rw-r--r--  tsconfig.json', type: 'text' },
      { text: '-rw-r--r--  vite.config.ts', type: 'text' },
      { text: '-rw-r--r--  tailwind.config.ts', type: 'text' },
    )
    return output
  }
  if (lower === 'date') {
    output.push({ text: new Date().toLocaleString('zh-CN'), type: 'text' })
    return output
  }
  if (lower.startsWith('echo ')) {
    output.push({ text: trimmed.slice(5), type: 'text' })
    return output
  }
  if (lower.startsWith('cat ')) {
    const file = trimmed.slice(4).trim()
    output.push(
      { text: `[simulated] Contents of ${file}:`, type: 'info' },
      { text: '// ... (file content not available in simulation)', type: 'text' },
    )
    return output
  }
  if (lower.startsWith('git ')) {
    if (lower === 'git status') {
      output.push(
        { text: 'On branch main', type: 'info' },
        { text: 'Changes not staged for commit:', type: 'warning' },
        { text: '  modified:   src/app/App.tsx', type: 'text' },
        { text: '  modified:   src/styles/theme.css', type: 'text' },
      )
    } else if (lower === 'git log') {
      output.push(
        { text: 'commit a1b2c3d (HEAD -> main)', type: 'info' },
        { text: 'Author: YYC\u00B3 AI <ai@yyc3.dev>', type: 'text' },
        { text: 'Date:   ' + new Date().toLocaleDateString(), type: 'text' },
        { text: '    feat: add liquid glass theme', type: 'text' },
      )
    } else if (lower === 'git branch') {
      output.push(
        { text: '* main', type: 'success' },
        { text: '  develop', type: 'text' },
        { text: '  feature/ai-service', type: 'text' },
      )
    } else {
      output.push({ text: `Simulated: ${trimmed}`, type: 'info' })
    }
    return output
  }
  if (lower.startsWith('npm ') || lower.startsWith('pnpm ') || lower.startsWith('yarn ')) {
    output.push(
      { text: `Simulated: ${trimmed}`, type: 'info' },
      { text: 'Done in 1.23s', type: 'success' },
    )
    return output
  }

  output.push({ text: `command not found: ${trimmed.split(' ')[0]}`, type: 'error' })
  return output
}

// ============================================
// Code Viewer Component
// ============================================

function CodeViewer({ filePath }: { filePath: string }) {
  const { fileContents } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [wordWrap, setWordWrap] = useState(false)

  const content = useMemo(() => {
    return FileService.getContent(filePath).content
  }, [filePath])

  const lines = content.split('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className={`h-8 flex items-center justify-between px-3 border-b shrink-0 ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
      }`}>
        <div className="flex items-center gap-1.5">
          <FileCode2 className="w-3 h-3 text-blue-400/50" />
          <span className="text-[10px] text-white/40 truncate max-w-[150px]">{filePath.split('/').pop()}</span>
          <span className="text-[9px] text-white/15">{t('right.lines', 'designer', { count: lines.length })}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`p-1 rounded transition-colors ${
              wordWrap
                ? isLG ? 'bg-emerald-500/[0.1] text-emerald-400/60' : 'bg-white/[0.06] text-white/50'
                : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]'
            }`}
            title={t('right.wordWrap', 'designer')}
          >
            <WrapText className="w-3 h-3" />
          </button>
          <button onClick={handleCopy} className="p-1 rounded text-white/20 hover:text-white/40 hover:bg-white/[0.04] transition-colors" title={t('right.copyAll', 'designer')}>
            {copied ? <span className="text-emerald-400/60"><FileCode2 className="w-3 h-3" /></span> : <Copy className="w-3 h-3" />}
          </button>
          <button className="p-1 rounded text-white/20 hover:text-white/40 hover:bg-white/[0.04] transition-colors" title={t('right.search', 'designer')}>
            <Search className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Code Content */}
      <ScrollArea className="flex-1">
        <div className="flex font-mono text-[11px]">
          {/* Line Numbers */}
          <div className="w-10 shrink-0 flex flex-col items-end pr-2 pt-2 select-none border-r border-white/[0.04]"
            style={{ background: isLG ? 'rgba(10,15,10,0.3)' : 'rgba(0,0,0,0.15)' }}>
            {lines.map((_, i) => (
              <div key={i} className="text-[10px] text-white/15 leading-[18px]">{i + 1}</div>
            ))}
          </div>
          {/* Code */}
          <pre className={`flex-1 p-2 leading-[18px] text-white/60 ${wordWrap ? 'whitespace-pre-wrap break-all' : 'overflow-x-auto'}`}>
            <code>{content}</code>
          </pre>
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================
// Multi-Tab Terminal
// ============================================

let termIdCounter = 1
function createSession(name?: string): TerminalSession {
  const id = `term_${termIdCounter++}`
  return {
    id,
    name: name || `bash ${termIdCounter - 1}`,
    lines: [...INITIAL_TERMINAL_LINES],
    history: [],
    historyIndex: -1,
    input: '',
  }
}

function IntegratedTerminal() {
  const { terminalVisible } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const [sessions, setSessions] = useState<TerminalSession[]>(() => [createSession('bash')])
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || '')
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeSession?.lines])

  if (!terminalVisible) {return null}

  const addSession = () => {
    const s = createSession()
    setSessions(prev => [...prev, s])
    setActiveSessionId(s.id)
  }

  const closeSession = (id: string) => {
    if (sessions.length <= 1) {return}
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id)
      if (activeSessionId === id) {
        setActiveSessionId(updated[updated.length - 1]?.id || '')
      }
      return updated
    })
  }

  const updateSession = (id: string, updates: Partial<TerminalSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const handleCommand = () => {
    if (!activeSession) {return}
    const trimmed = activeSession.input.trim()
    if (!trimmed) {return}

    const newHistory = [...activeSession.history, trimmed]
    const result = executeCommand(trimmed)

    if (result.length === 1 && result[0].text === '__CLEAR__') {
      updateSession(activeSession.id, {
        lines: [],
        history: newHistory,
        historyIndex: -1,
        input: '',
      })
    } else {
      const updatedLines = [...activeSession.lines, ...result]
      updateSession(activeSession.id, {
        lines: updatedLines.length > MAX_TERMINAL_LINES
          ? updatedLines.slice(updatedLines.length - MAX_TERMINAL_LINES)
          : updatedLines,
        history: newHistory,
        historyIndex: -1,
        input: '',
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeSession) {return}

    if (e.key === 'Enter') {
      handleCommand()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const history = activeSession.history
      if (history.length > 0) {
        const newIndex = activeSession.historyIndex < history.length - 1
          ? activeSession.historyIndex + 1
          : activeSession.historyIndex
        updateSession(activeSession.id, {
          historyIndex: newIndex,
          input: history[history.length - 1 - newIndex],
        })
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (activeSession.historyIndex > 0) {
        const newIndex = activeSession.historyIndex - 1
        updateSession(activeSession.id, {
          historyIndex: newIndex,
          input: activeSession.history[activeSession.history.length - 1 - newIndex],
        })
      } else {
        updateSession(activeSession.id, { historyIndex: -1, input: '' })
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Simple tab completion
      const input = activeSession.input
      const cmds = ['help', 'clear', 'ls', 'pwd', 'date', 'echo', 'git', 'npm', 'pnpm', 'whoami', 'uname', 'cat']
      const match = cmds.find(c => c.startsWith(input.toLowerCase()))
      if (match) {
        updateSession(activeSession.id, { input: match })
      }
    }
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: isLG ? 'rgba(5,10,5,0.8)' : 'rgba(0,0,0,0.3)' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal Tab Bar */}
      <div className={`h-7 flex items-center justify-between px-1 border-b shrink-0 ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
      }`}>
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto min-w-0">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={(e) => { e.stopPropagation(); setActiveSessionId(session.id) }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] cursor-pointer shrink-0 transition-colors group ${
                activeSessionId === session.id
                  ? isLG ? 'bg-emerald-500/[0.1] text-emerald-400/70' : 'bg-white/[0.06] text-white/60'
                  : 'text-white/25 hover:text-white/40 hover:bg-white/[0.03]'
              }`}
            >
              <TerminalIcon className="w-2.5 h-2.5" />
              <span>{session.name}</span>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeSession(session.id) }}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400/60 transition-all"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          <button
            onClick={(e) => { e.stopPropagation(); addSession() }}
            className="p-0.5 rounded text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-colors"
            title={t('right.newTerminal', 'designer')}
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (activeSession) {updateSession(activeSession.id, { lines: [] })} }}
            className="p-0.5 rounded text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-colors"
            title={t('right.clearTerminal', 'designer')}
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button className="p-0.5 rounded text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-colors" title={t('right.maximize', 'designer')}>
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px]">
        {activeSession && activeSession.lines.map((line, i) => (
          <div key={i} className={`leading-[18px] ${getTermColor(line.type, isLG)}`}>
            {line.text || '\u00A0'}
          </div>
        ))}
      </div>

      {/* Terminal Input */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 border-t ${
        isLG ? 'border-emerald-500/[0.04]' : 'border-white/[0.04]'
      }`}>
        <ChevronRight className={`w-3 h-3 shrink-0 ${isLG ? 'text-emerald-400/50' : 'text-cyan-400/50'}`} />
        <input
          ref={inputRef}
          value={activeSession?.input || ''}
          onChange={(e) => { if (activeSession) {updateSession(activeSession.id, { input: e.target.value })} }}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent text-[11px] text-white/60 outline-none font-mono placeholder:text-white/15 ${
            isLG ? 'caret-emerald-400' : 'caret-cyan-400'
          }`}
          placeholder={t('right.inputCommand', 'designer')}
          spellCheck={false}
        />
        {activeSession && activeSession.history.length > 0 && (
          <span className="text-[8px] text-white/10 shrink-0">
            {activeSession.history.length} cmds
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================
// RightPanel (main export)
// ============================================

export function RightPanel() {
  const { selectedFile, terminalVisible } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  return (
    <div
      className={`h-full flex flex-col ${isLG ? 'lg-right-panel' : ''}`}
      style={{ background: isLG ? 'rgba(10,15,10,0.35)' : 'var(--sidebar, #0d0d14)' }}
    >
      <ResizablePanelGroup direction="vertical">
        {/* Code Viewer */}
        <ResizablePanel defaultSize={terminalVisible ? 60 : 100} minSize={20}>
          {selectedFile ? (
            <CodeViewer filePath={selectedFile} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileCode2 className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-[11px] text-white/20">{t('right.codeDetail', 'designer')}</p>
                <p className="text-[9px] text-white/10 mt-1">{t('right.selectFileToView', 'designer')}</p>
              </div>
            </div>
          )}
        </ResizablePanel>

        {terminalVisible && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={40} minSize={15} maxSize={70}>
              <IntegratedTerminal />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}