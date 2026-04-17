/**
 * @file LeftPanel.tsx
 * @description AI chat panel — session persistence, streaming responses, edit/resend, code apply, model selection, enhanced markdown
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Send, Copy, Check, X, RotateCcw, ThumbsUp, ThumbsDown,
  Pencil, Square, Paperclip, FileCode2, Settings2, ImagePlus,
  ChevronDown, Trash2, MessageSquarePlus, FileUp, Play,
  Sparkles, Globe,
} from 'lucide-react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { useAppStore } from '../../stores/app-store'
import type { AIModel } from '../../stores/app-store'
import { useSessionStore } from '../../stores/session-store'
import { useAIServiceStore } from '../../stores/ai-service-store'
import type { SessionMessage } from '../../types/models'
import { createLogger } from '../../utils/logger'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useFileTreeStore } from '../../stores/file-tree-store'
import { useI18n } from '../../utils/useI18n'
import { useSettingsStore } from '../../stores/settings-store'
import { toast } from 'sonner'
import logoImage from '/yyc3-logo.png'

const log = createLogger('LeftPanel')

// ============================================
// Helpers
// ============================================

/** Simulate streaming AI response via OpenAI-compatible endpoint */
async function fetchOpenAIStreamResponse(
  endpoint: string,
  apiKey: string,
  messages: { role: string; content: string }[],
  signal: AbortSignal,
  onChunk: (text: string) => void,
) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        stream: true,
        max_tokens: 2048,
      }),
      signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      throw new Error(`API error ${res.status}: ${errText}`)
    }

    const reader = res.body?.getReader()
    if (!reader) {throw new Error('No response body')}

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {break}

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') {continue}
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6))
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {onChunk(delta)}
          } catch { /* skip malformed SSE */ }
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      log.info('Stream aborted by user')
    } else {
      throw err
    }
  }
}

/** Simulate a mock AI response with typing effect */
async function simulateMockAIResponse(
  _messages: { role: string; content: string }[],
  signal: AbortSignal,
  onChunk: (text: string) => void,
) {
  const mockResponses = [
    '好的，我来帮你分析这个问题。\n\n',
    '根据你的描述，这里有几个关键点：\n\n',
    '1. **组件结构**：建议使用 React 函数组件 + TypeScript 接口定义 props\n',
    '2. **状态管理**：推荐使用 Zustand 管理全局状态\n',
    '3. **样式方案**：使用 Tailwind CSS 配合 CSS 变量实现主题切换\n\n',
    '```typescript\n',
    'interface PanelProps {\n',
    '  id: string\n',
    '  title: string\n',
    '  collapsed?: boolean\n',
    '}\n\n',
    'export function Panel({ id, title, collapsed }: PanelProps) {\n',
    '  const [isOpen, setIsOpen] = useState(!collapsed)\n',
    '  return (\n',
    '    <div className="panel-container">\n',
    '      <h3>{title}</h3>\n',
    '    </div>\n',
    '  )\n',
    '}\n',
    '```\n\n',
    '需要我进一步细化实现方案吗？',
  ]

  for (const chunk of mockResponses) {
    if (signal.aborted) {return}
    await new Promise(r => setTimeout(r, 30 + Math.random() * 60))
    if (signal.aborted) {return}
    onChunk(chunk)
  }
}

// ============================================
// Code Block Component
// ============================================

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const { selectedFile, updateFileContent, openFileTab, setSelectedFile, setLastAppliedFile } = useAppStore()
  const { createFile } = useFileTreeStore()

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApply = () => {
    if (!selectedFile) {
      toast.error(t('left.noFileSelected', 'designer'))
      return
    }
    updateFileContent(selectedFile, code)
    setLastAppliedFile(selectedFile)
    toast.success(t('left.codeAppliedTo', 'designer', { file: selectedFile.split('/').pop() || '' }))
    // Auto-clear highlight after 3s
    setTimeout(() => useAppStore.getState().clearAppliedHighlight(), 3000)
  }

  const handleNewFile = () => {
    const name = newFileName.trim()
    if (!name) {return}
    const parentPath = 'src/app/components'
    const fullPath = `${parentPath}/${name}`
    createFile(parentPath, name)
    updateFileContent(fullPath, code)
    openFileTab(fullPath)
    setSelectedFile(fullPath)
    setLastAppliedFile(fullPath)
    toast.success(t('left.createdAndApplied', 'designer', { name }))
    setShowNewFileInput(false)
    setNewFileName('')
    setTimeout(() => useAppStore.getState().clearAppliedHighlight(), 3000)
  }

  const isCodeApplicable = language && ['typescript', 'tsx', 'jsx', 'javascript', 'js', 'ts', 'css', 'json', 'html'].includes(language.toLowerCase())

  return (
    <div className={`rounded-lg overflow-hidden my-2 border ${
      isLG ? 'border-emerald-500/[0.08]' : 'border-white/[0.06]'
    }`}>
      <div className={`flex items-center justify-between px-3 py-1.5 ${
        isLG ? 'bg-emerald-500/[0.04]' : 'bg-white/[0.04]'
      }`}>
        <span className="text-[9px] text-white/30 font-mono">{language}</span>
        <div className="flex items-center gap-1">
          {isCodeApplicable && (
            <>
              <button
                onClick={handleApply}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors whitespace-nowrap ${
                  isLG
                    ? 'text-emerald-400/50 hover:text-emerald-400/80 hover:bg-emerald-500/[0.08]'
                    : 'text-violet-400/50 hover:text-violet-400/80 hover:bg-violet-500/[0.08]'
                }`}
                title={t('left.applyToFile', 'designer')}
              >
                <Play className="w-3 h-3" />
                {t('actions.apply', 'common')}
              </button>
              <button
                onClick={() => setShowNewFileInput(!showNewFileInput)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors whitespace-nowrap"
                title={t('left.newFile', 'designer')}
              >
                <FileUp className="w-3 h-3" />
                {t('left.newFile', 'designer')}
              </button>
            </>
          )}
          <button onClick={handleCopy} className="text-white/25 hover:text-white/60 transition-colors p-0.5 shrink-0">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* New File Inline Input */}
      {showNewFileInput && (
        <div className={`flex items-center gap-2 px-3 py-1.5 border-b ${
          isLG ? 'border-emerald-500/[0.06] bg-emerald-500/[0.02]' : 'border-white/[0.04] bg-white/[0.02]'
        }`}>
          <FileCode2 className="w-3 h-3 text-white/20 shrink-0" />
          <input
            type="text"
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {handleNewFile()}
              if (e.key === 'Escape') { setShowNewFileInput(false); setNewFileName('') }
            }}
            placeholder="filename.tsx"
            className={`flex-1 bg-transparent outline-none text-[10px] text-white/60 placeholder:text-white/20 ${
              isLG ? 'caret-emerald-400' : ''
            }`}
            autoFocus
          />
          <button
            onClick={handleNewFile}
            disabled={!newFileName.trim()}
            className={`px-2 py-0.5 rounded text-[9px] transition-colors ${
              newFileName.trim()
                ? isLG
                  ? 'bg-emerald-500/20 text-emerald-400/80 hover:bg-emerald-500/30'
                  : 'bg-violet-500/20 text-violet-400/80 hover:bg-violet-500/30'
                : 'bg-white/[0.04] text-white/15'
            }`}
          >
            {t('left.create', 'designer')}
          </button>
          <button
            onClick={() => { setShowNewFileInput(false); setNewFileName('') }}
            className="text-white/20 hover:text-white/50"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <pre className="px-3 py-2 overflow-x-auto text-[11px] leading-relaxed text-white/70 font-mono max-w-full whitespace-pre-wrap break-words"
        style={{ background: isLG ? 'rgba(10,15,10,0.4)' : 'rgba(0,0,0,0.2)' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ============================================
// Message Renderer
// ============================================

function renderMessageContent(content: string) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index)
      parts.push(<span key={`t-${lastIndex}`}>{renderInlineMarkdown(textBefore)}</span>)
    }
    // Code block
    parts.push(
      <CodeBlock key={`c-${match.index}`} language={match[1] || 'text'} code={match[2].trim()} />
    )
    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < content.length) {
    parts.push(<span key={`t-${lastIndex}`}>{renderInlineMarkdown(content.slice(lastIndex))}</span>)
  }

  return parts.length > 0 ? parts : renderInlineMarkdown(content)
}

/** Render inline Markdown: **bold**, `code`, [link](url) */
function renderInlineParts(text: string): React.ReactNode[] {
  // Process inline patterns in order: bold, inline-code, links
  const parts: React.ReactNode[] = []
  // Regex that matches **bold**, `code`, and [text](url)
  const inlineRegex = /(\*\*(.*?)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match

  while ((match = inlineRegex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // Bold: **text**
      parts.push(<strong key={`b-${match.index}`} className="text-white/90">{match[2]}</strong>)
    } else if (match[3]) {
      // Inline code: `code`
      parts.push(
        <code key={`ic-${match.index}`} className="px-1 py-0.5 rounded bg-white/[0.06] text-[11px] font-mono text-emerald-400/70">
          {match[4]}
        </code>
      )
    } else if (match[5]) {
      // Link: [text](url)
      parts.push(
        <a key={`a-${match.index}`} href={match[7]} target="_blank" rel="noopener noreferrer"
          className="text-blue-400/70 hover:text-blue-400 underline underline-offset-2 transition-colors">
          {match[6]}
        </a>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

function renderInlineMarkdown(text: string) {
  // Split by line, then handle block-level + inline Markdown
  const lines = text.split('\n')
  const result: React.ReactNode[] = []

  lines.forEach((line, lineIdx) => {
    // Heading detection (### / ## / #)
    const h3 = line.match(/^###\s+(.+)$/)
    if (h3) {
      result.push(<div key={`h3-${lineIdx}`} className="text-[13px] text-white/80 mt-3 mb-1">{h3[1]}</div>)
      return
    }
    const h2 = line.match(/^##\s+(.+)$/)
    if (h2) {
      result.push(<div key={`h2-${lineIdx}`} className="text-[14px] text-white/85 mt-3 mb-1">{h2[1]}</div>)
      return
    }
    const h1 = line.match(/^#\s+(.+)$/)
    if (h1) {
      result.push(<div key={`h1-${lineIdx}`} className="text-[15px] text-white/90 mt-3 mb-1.5">{h1[1]}</div>)
      return
    }

    // Ordered list (1. 2. etc.)
    const ol = line.match(/^(\d+)\.\s+(.+)$/)
    if (ol) {
      result.push(
        <div key={`ol-${lineIdx}`} className="flex gap-1.5 ml-1 my-0.5">
          <span className="text-white/25 shrink-0 w-4 text-right">{ol[1]}.</span>
          <span>{renderInlineParts(ol[2])}</span>
        </div>
      )
      return
    }

    // Unordered list (- or *)
    const ul = line.match(/^[-*]\s+(.+)$/)
    if (ul) {
      result.push(
        <div key={`ul-${lineIdx}`} className="flex gap-1.5 ml-1 my-0.5">
          <span className="text-white/25 mt-1.5 shrink-0">
            <span className="inline-block w-1 h-1 rounded-full bg-white/30" />
          </span>
          <span>{renderInlineParts(ul[1])}</span>
        </div>
      )
      return
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      result.push(<hr key={`hr-${lineIdx}`} className="border-white/[0.06] my-2" />)
      return
    }

    // Normal line — apply inline formatting
    if (line.trim()) {
      result.push(<span key={`l-${lineIdx}`}>{renderInlineParts(line)}</span>)
    }
    // Preserve newlines
    if (lineIdx < lines.length - 1) {
      result.push(<br key={`br-${lineIdx}`} />)
    }
  })

  return result
}

// ============================================
// Chat Message Component (adapted for SessionMessage)
// ============================================

function ChatMessageBubble({ message, isStreaming, onEdit, onResend }: {
  message: SessionMessage
  isStreaming?: boolean
  onEdit?: (id: string) => void
  onResend?: (id: string) => void
}) {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={`group px-4 py-3 ${isUser ? '' : 'bg-white/[0.01]'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${
          isUser
            ? 'bg-blue-500/20 text-blue-400/80'
            : isLG
              ? 'bg-emerald-500/20 text-emerald-400/80'
              : 'bg-violet-500/20 text-violet-400/80'
        }`}>
          {isUser ? '你' : 'AI'}
        </div>
        <span className="text-[10px] text-white/30">
          {isUser ? '你' : 'YYC³ AI'}
        </span>
        <span className="text-[9px] text-white/15 ml-auto">{time}</span>
      </div>

      {/* Content */}
      <div className={`ml-7 text-[12px] leading-relaxed overflow-wrap-break-word break-words ${
        isStreaming ? 'text-white/60' : 'text-white/70'
      }`}>
        {renderMessageContent(message.content)}
        {isStreaming && (
          <span className={`inline-block w-1.5 h-4 ml-0.5 animate-pulse ${
            isLG ? 'bg-emerald-400/60' : 'bg-violet-400/60'
          }`} />
        )}
      </div>

      {/* Actions */}
      {!isStreaming && (
        <div className="ml-7 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleCopy} className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors" title={t('left.copy', 'designer')}>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          {isUser && onEdit && (
            <button onClick={() => onEdit(message.id)} className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors" title={t('left.edit', 'designer')}>
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {isUser && onResend && (
            <button onClick={() => onResend(message.id)} className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors" title={t('left.resend', 'designer')}>
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
          {!isUser && (
            <>
              <button
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                className={`p-1 rounded transition-colors ${
                  feedback === 'up' ? 'text-emerald-400/70 bg-emerald-500/10' : 'text-white/20 hover:text-white/50 hover:bg-white/[0.06]'
                }`}
                title={t('left.helpful', 'designer')}
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                className={`p-1 rounded transition-colors ${
                  feedback === 'down' ? 'text-red-400/70 bg-red-500/10' : 'text-white/20 hover:text-white/50 hover:bg-white/[0.06]'
                }`}
                title={t('left.notHelpful', 'designer')}
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// Session Selector Dropdown
// ============================================

function SessionSelector() {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const {
    activeSessionId, sessions, getAllSessions,
    createSession, setActiveSession, deleteSession,
  } = useSessionStore()
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const allSessions = getAllSessions()
  const activeSession = activeSessionId ? sessions[activeSessionId] : null

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {setOpen(false)}
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-colors max-w-[140px] ${
          isLG
            ? 'bg-emerald-500/[0.06] text-emerald-400/60 hover:bg-emerald-500/[0.1]'
            : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
        }`}
        title={t('left.switchSession', 'designer')}
      >
        <span className="truncate">{activeSession?.title || t('left.newSession', 'designer')}</span>
        <ChevronDown className="w-3 h-3 shrink-0" />
      </button>

      {open && (
        <div
          className={`absolute top-full left-0 mt-1 z-50 w-56 rounded-xl border py-1.5 ${
            isLG ? 'border-emerald-500/[0.1]' : 'border-white/[0.08]'
          }`}
          style={{
            background: isLG ? 'rgba(10,15,10,0.96)' : 'rgba(14,14,24,0.96)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* New session */}
          <button
            onClick={() => {
              createSession('default')
              setOpen(false)
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-colors ${
              isLG ? 'text-emerald-400/60 hover:bg-emerald-500/[0.06]' : 'text-violet-400/60 hover:bg-white/[0.04]'
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            {t('left.createSession', 'designer')}
          </button>

          {allSessions.length > 0 && (
            <div className="border-t border-white/[0.04] my-1" />
          )}

          {/* Session list */}
          <div className="max-h-48 overflow-y-auto">
            {allSessions.map(sess => (
              <div
                key={sess.id}
                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] cursor-pointer transition-colors group ${
                  sess.id === activeSessionId
                    ? isLG ? 'bg-emerald-500/[0.06] text-emerald-400/70' : 'bg-white/[0.06] text-white/60'
                    : 'text-white/35 hover:bg-white/[0.03] hover:text-white/50'
                }`}
                onClick={() => { setActiveSession(sess.id); setOpen(false) }}
              >
                <span className="flex-1 truncate">{sess.title}</span>
                <span className="text-[8px] text-white/15 shrink-0">{sess.messages.length} msg</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(sess.id) }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/20 hover:text-red-400/60 transition-all"
                  title={t('left.deleteSession', 'designer')}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// AI Service Indicator (shows active provider/model from ai-service-store)
// ============================================

function AIServiceIndicator({ activeModel }: { activeModel: AIModel | null }) {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const activeProvider = useAIServiceStore(s => s.getActiveProvider())
  const activeServiceModel = useAIServiceStore(s => s.getActiveModel())

  // Prefer app-store model if configured with API key, otherwise show ai-service-store info
  if (activeModel?.apiKey) {
    return (
      <span className="text-[9px] text-white/15 flex items-center gap-1">
        <Sparkles className={`w-2.5 h-2.5 ${isLG ? 'text-emerald-400/30' : 'text-violet-400/30'}`} />
        {activeModel.name}
      </span>
    )
  }

  return (
    <span className="text-[9px] text-white/15 flex items-center gap-1">
      <Globe className="w-2.5 h-2.5 text-white/15" />
      {activeProvider && activeServiceModel
        ? `${activeProvider.displayName} · ${activeServiceModel.displayName}`
        : activeModel ? activeModel.name : t('left.noModelSelected', 'designer')
      }
    </span>
  )
}

// ============================================
// LeftPanel (main export)
// ============================================

export function LeftPanel() {
  const {
    aiModels,
    activeModelId,
    openModelSettings,
    isAiTyping,
    setAiTyping,
    abortController,
    setAbortController,
  } = useAppStore()

  const {
    activeSessionId,
    sessions,
    addMessage: sessionAddMessage,
    appendToLastAssistant,
    startStreaming,
    stopStreaming,
    isStreaming,
    getSessionMessages,
    deleteMessage: sessionDeleteMessage,
    saveToStorage,
    loadFromStorage,
  } = useSessionStore()

  const {
    isLG,
    panelSurfaceStyle,
  } = useLiquidGlass()

  const { t } = useI18n()

  const [input, setInput] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const activeModel = aiModels.find(m => m.id === activeModelId) || null
  const messages: SessionMessage[] = activeSessionId ? getSessionMessages(activeSessionId) : []

  // Initialize: load from storage + create default session if none
  useEffect(() => {
    loadFromStorage('default-user').then(() => {
      const state = useSessionStore.getState()
      if (Object.keys(state.sessions).length === 0) {
        state.createSession('default', 'YYC³ AI 会话')
      } else if (!state.activeSessionId) {
        const first = Object.keys(state.sessions)[0]
        if (first) {state.setActiveSession(first)}
      }
    })
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  // Auto-save on message changes (with content hash for accuracy)
  const messagesContentHash = useMemo(() => {
    return messages.map(m => `${m.id}:${m.role}:${m.content.length}`).join('|')
  }, [messages])

  useEffect(() => {
    if (messages.length > 0) {
      saveToStorage()
    }
  }, [messagesContentHash])

  const triggerAIResponse = useCallback(async (chatHistory: { role: string; content: string }[]) => {
    if (!activeSessionId) {return}

    startStreaming()
    setAiTyping(true)
    const controller = new AbortController()
    setAbortController(controller)

    try {
      if (activeModel && activeModel.apiKey) {
        // Real API call for openai / custom (OpenAI-compatible)
        await fetchOpenAIStreamResponse(
          activeModel.endpoint,
          activeModel.apiKey,
          chatHistory,
          controller.signal,
          (chunk) => {
            appendToLastAssistant(activeSessionId, chunk)
          }
        )
      } else {
        // Mock response
        await simulateMockAIResponse(chatHistory, controller.signal, (chunk) => {
          appendToLastAssistant(activeSessionId, chunk)
        })
      }
    } catch (err: any) {
      log.error('AI response error', err?.message)
      appendToLastAssistant(activeSessionId, `\n\nError: ${err?.message || '未知错误'}`)
    } finally {
      stopStreaming()
      setAiTyping(false)
      setAbortController(null)
      saveToStorage()
    }
  }, [activeModel, activeSessionId, appendToLastAssistant, startStreaming, stopStreaming, setAiTyping, setAbortController, saveToStorage])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isAiTyping) {return}

    // Ensure we have an active session
    let sessId = activeSessionId
    if (!sessId) {
      sessId = useSessionStore.getState().createSession('default', 'YYC³ AI 会话')
    }

    if (editingMessageId) {
      sessionDeleteMessage(sessId, editingMessageId)
      setEditingMessageId(null)
    }

    sessionAddMessage(sessId, 'user', trimmed)
    setInput('')

    // Build chat history from session messages
    const currentMessages = useSessionStore.getState().getSessionMessages(sessId)
    const chatHistory = currentMessages.map(m => ({ role: m.role, content: m.content }))

    // Inject system prompt with rules & skills from settings store
    const settingsState = useSettingsStore.getState()
    const systemPrompt = settingsState.buildSystemPrompt(
      'You are YYC³ Family AI — an expert full-stack architect and intelligent coding assistant.'
    )
    // Inject enabled MCP endpoints context
    const mcpPayload = settingsState.getMCPInjectionPayload()
    const mcpContext = mcpPayload.length > 0
      ? `\n\n--- Available MCP Endpoints ---\n${mcpPayload.map(m => `- ${m.name}: ${m.endpoint}${m.projectLevel ? ' (project)' : ''}`).join('\n')}`
      : ''

    const enrichedHistory = [
      { role: 'system', content: systemPrompt + mcpContext },
      ...chatHistory,
    ]

    triggerAIResponse(enrichedHistory)
  }, [input, isAiTyping, editingMessageId, activeSessionId, sessionAddMessage, sessionDeleteMessage, triggerAIResponse])

  const handleEdit = (id: string) => {
    const msg = messages.find(m => m.id === id)
    if (msg) {
      setInput(msg.content)
      setEditingMessageId(id)
      inputRef.current?.focus()
    }
  }

  const handleResend = (id: string) => {
    if (!activeSessionId) {return}
    const msg = messages.find(m => m.id === id)
    if (!msg) {return}

    // Delete this message and all after it
    const idx = messages.findIndex(m => m.id === id)
    if (idx >= 0) {
      const toDelete = messages.slice(idx).map(m => m.id)
      toDelete.forEach(mid => sessionDeleteMessage(activeSessionId, mid))
    }

    sessionAddMessage(activeSessionId, 'user', msg.content)

    const currentMessages = useSessionStore.getState().getSessionMessages(activeSessionId)
    const chatHistory = currentMessages.map(m => ({ role: m.role, content: m.content }))

    // Inject system prompt with rules & skills (same as handleSend)
    const settingsState = useSettingsStore.getState()
    const systemPrompt = settingsState.buildSystemPrompt(
      'You are YYC³ Family AI — an expert full-stack architect and intelligent coding assistant.'
    )
    const mcpPayload = settingsState.getMCPInjectionPayload()
    const mcpContext = mcpPayload.length > 0
      ? `\n\n--- Available MCP Endpoints ---\n${mcpPayload.map(m => `- ${m.name}: ${m.endpoint}${m.projectLevel ? ' (project)' : ''}`).join('\n')}`
      : ''

    triggerAIResponse([
      { role: 'system', content: systemPrompt + mcpContext },
      ...chatHistory,
    ])
  }

  const handleStop = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setAiTyping(false)
      stopStreaming()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={`h-full flex flex-col overflow-hidden ${isLG ? 'lg-left-panel' : ''}`}
      style={isLG ? panelSurfaceStyle : { background: 'var(--sidebar, #0d0d14)' }}
    >
      {/* Header */}
      <div className={`h-9 flex items-center justify-between px-3 border-b shrink-0 ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
      }`}>
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="YYC³" className="w-4 h-4 rounded" />
          <span className="text-[11px] text-white/50">YYC³ AI</span>
        </div>
        <div className="flex items-center gap-1">
          <SessionSelector />
          <button
            onClick={openModelSettings}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] transition-colors ${
              activeModel
                ? isLG
                  ? 'bg-emerald-500/[0.08] text-emerald-400/60 hover:bg-emerald-500/[0.12]'
                  : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
                : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]'
            }`}
            title={t('left.modelSettings', 'designer')}
          >
            <Settings2 className="w-3 h-3" />
            <span className="max-w-[60px] truncate">{activeModel?.name || t('left.model', 'designer')}</span>
          </button>
        </div>
      </div>

      {/* Messages — Virtualized with react-virtuoso */}
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
              isLG ? 'bg-emerald-500/10' : 'bg-violet-500/10'
            }`}>
              <img src={logoImage} alt="YYC³" className="w-6 h-6 rounded-lg" />
            </div>
            <p className="text-[12px] text-white/40 mb-1">YYC³ Family AI</p>
            <p className="text-[10px] text-white/20">{t('left.slogan', 'designer')}</p>
            <p className="text-[10px] text-white/15 mt-3">{t('left.startChat', 'designer')}</p>
          </div>
        </div>
      ) : (
        <Virtuoso<SessionMessage>
          ref={virtuosoRef}
          data={messages}
          className="flex-1 min-h-0"
          followOutput="smooth"
          initialTopMostItemIndex={messages.length - 1}
          itemContent={(index, msg) => {
            const isLastAssistant = msg.role === 'assistant' && index === messages.length - 1 && isStreaming
            return (
              <ChatMessageBubble
                message={msg}
                isStreaming={isLastAssistant}
                onEdit={handleEdit}
                onResend={handleResend}
              />
            )
          }}
          components={{
            Header: () => <div className="h-1" />,
            Footer: () => <div className="h-2" />,
          }}
        />
      )}

      {/* Input Area */}
      <div className={`border-t px-3 py-2 shrink-0 ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
      }`}>
        {/* Editing indicator */}
        {editingMessageId && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
            <Pencil className="w-3 h-3 text-amber-400/60" />
            <span className="text-[10px] text-amber-400/60 flex-1">{t('left.editingMessage', 'designer')}</span>
            <button onClick={() => { setEditingMessageId(null); setInput('') }} className="text-amber-400/40 hover:text-amber-400/80">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className={`flex items-end gap-2 rounded-xl border px-3 py-2 ${
          isLG ? 'border-emerald-500/[0.1] bg-emerald-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'
        }`}>
          {/* Attachment buttons */}
          <div className="flex items-center gap-0.5 pb-0.5">
            <button className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-colors" title={t('left.attachFile', 'designer')}>
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-colors" title={t('left.uploadImage', 'designer')}>
              <ImagePlus className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-colors" title={t('left.codeSnippet', 'designer')}>
              <FileCode2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('left.inputPlaceholder', 'designer')}
            rows={1}
            className={`flex-1 bg-transparent text-[12px] text-white/70 placeholder:text-white/20 outline-none resize-none leading-relaxed max-h-[120px] ${
              isLG ? 'caret-emerald-400' : ''
            }`}
          />

          {/* Send / Stop */}
          {isAiTyping ? (
            <button
              onClick={handleStop}
              className="p-1.5 rounded-lg bg-red-500/20 text-red-400/80 hover:bg-red-500/30 transition-colors shrink-0"
              title={t('left.stopGenerate', 'designer')}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                input.trim()
                  ? isLG
                    ? 'bg-emerald-500/20 text-emerald-400/80 hover:bg-emerald-500/30'
                    : 'bg-violet-500/20 text-violet-400/80 hover:bg-violet-500/30'
                  : 'bg-white/[0.04] text-white/15'
              }`}
              title={t('left.send', 'designer')}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5 px-1">
          <AIServiceIndicator activeModel={activeModel} />
          <span className="text-[9px] text-white/10">{t('left.shiftEnterNewline', 'designer')}</span>
        </div>
      </div>
    </div>
  )
}