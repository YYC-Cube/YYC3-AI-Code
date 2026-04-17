/**
 * @file quick-actions-store.tsx
 * @description Quick Actions store — AI-powered code/text/document one-click operations,
 *   clipboard history, context-aware action suggestions
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags quick-actions, ai, clipboard, code-operations, text-processing
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'

const log = createLogger('QuickActionsStore')

// ============================================
// Types
// ============================================

export type ActionType =
  | 'copy'
  | 'copy-markdown'
  | 'copy-html'
  | 'replace'
  | 'refactor'
  | 'optimize'
  | 'format'
  | 'convert'
  | 'summarize'
  | 'translate'
  | 'rewrite'
  | 'expand'
  | 'correct'
  | 'explain'
  | 'add-comments'
  | 'find-issues'
  | 'test-generate'
  | 'doc-generate'

export type ActionTarget = 'code' | 'text' | 'document' | 'file'
export type ActionStatus = 'idle' | 'processing' | 'success' | 'error'

export interface QuickAction {
  id: string
  type: ActionType
  target: ActionTarget
  title: string
  description: string
  icon: string
  shortcut?: string
  requiresAI: boolean
  category: 'code' | 'text' | 'document' | 'ai'
}

export interface ActionContext {
  selection: {
    text: string
    startLine?: number
    endLine?: number
  }
  file?: {
    path: string
    name: string
    language: string
  }
}

export interface ActionExecution {
  id: string
  actionType: ActionType
  input: string
  output: string
  status: ActionStatus
  timestamp: number
  duration?: number
  error?: string
}

export interface ClipboardHistoryItem {
  id: string
  content: string
  type: 'text' | 'code' | 'image'
  copiedAt: number
  sourceFile?: string
  language?: string
  size: number
}

// ============================================
// Preset actions registry
// ============================================

export const QUICK_ACTIONS: QuickAction[] = [
  // Code operations
  { id: 'copy-code', type: 'copy', target: 'code', title: '复制代码', description: 'Copy selected code', icon: 'Copy', requiresAI: false, category: 'code' },
  { id: 'copy-md', type: 'copy-markdown', target: 'code', title: '复制为 Markdown', description: 'Copy as Markdown code block', icon: 'FileCode2', requiresAI: false, category: 'code' },
  { id: 'copy-html', type: 'copy-html', target: 'code', title: '复制为 HTML', description: 'Copy as HTML pre/code', icon: 'Globe', requiresAI: false, category: 'code' },
  { id: 'format-code', type: 'format', target: 'code', title: '格式化代码', description: 'Format selected code', icon: 'AlignLeft', shortcut: 'Shift+Alt+F', requiresAI: false, category: 'code' },
  { id: 'refactor-code', type: 'refactor', target: 'code', title: 'AI 重构', description: 'Refactor code with AI', icon: 'RefreshCw', requiresAI: true, category: 'ai' },
  { id: 'optimize-code', type: 'optimize', target: 'code', title: 'AI 优化', description: 'Optimize code performance', icon: 'Zap', requiresAI: true, category: 'ai' },
  { id: 'explain-code', type: 'explain', target: 'code', title: 'AI 解释', description: 'Explain code logic', icon: 'MessageCircle', requiresAI: true, category: 'ai' },
  { id: 'add-comments', type: 'add-comments', target: 'code', title: 'AI 添加注释', description: 'Add comments to code', icon: 'MessageSquarePlus', requiresAI: true, category: 'ai' },
  { id: 'find-issues', type: 'find-issues', target: 'code', title: 'AI 查找问题', description: 'Find bugs and issues', icon: 'AlertTriangle', requiresAI: true, category: 'ai' },
  { id: 'gen-tests', type: 'test-generate', target: 'code', title: 'AI 生成测试', description: 'Generate test cases', icon: 'TestTube2', requiresAI: true, category: 'ai' },
  { id: 'gen-docs', type: 'doc-generate', target: 'code', title: 'AI 生成文档', description: 'Generate documentation', icon: 'FileText', requiresAI: true, category: 'ai' },

  // Text operations
  { id: 'translate-text', type: 'translate', target: 'text', title: 'AI 翻译', description: 'Translate text', icon: 'Languages', requiresAI: true, category: 'text' },
  { id: 'rewrite-text', type: 'rewrite', target: 'text', title: 'AI 改写', description: 'Rewrite for clarity', icon: 'PenLine', requiresAI: true, category: 'text' },
  { id: 'expand-text', type: 'expand', target: 'text', title: 'AI 扩展', description: 'Expand with details', icon: 'Maximize2', requiresAI: true, category: 'text' },
  { id: 'correct-text', type: 'correct', target: 'text', title: 'AI 纠错', description: 'Fix grammar & spelling', icon: 'SpellCheck', requiresAI: true, category: 'text' },
  { id: 'summarize-text', type: 'summarize', target: 'text', title: 'AI 摘要', description: 'Summarize content', icon: 'ListCollapse', requiresAI: true, category: 'text' },

  // Document operations
  { id: 'format-doc', type: 'format', target: 'document', title: '格式化文档', description: 'Format document', icon: 'AlignLeft', requiresAI: false, category: 'document' },
  { id: 'convert-doc', type: 'convert', target: 'document', title: '转换格式', description: 'Convert document format', icon: 'ArrowRightLeft', requiresAI: true, category: 'document' },
]

// ============================================
// Store
// ============================================

interface QuickActionsState {
  /** Whether the quick actions panel is visible */
  panelOpen: boolean
  /** Current action context (selection info) */
  context: ActionContext | null
  /** Active category filter */
  activeCategory: 'all' | 'code' | 'text' | 'document' | 'ai'
  /** Search filter */
  searchFilter: string
  /** Currently executing action */
  activeExecution: ActionExecution | null
  /** Execution history */
  history: ActionExecution[]
  /** Clipboard history */
  clipboardHistory: ClipboardHistoryItem[]
  /** Whether clipboard panel is visible */
  clipboardPanelOpen: boolean
}

interface QuickActionsActions {
  // Panel
  openPanel: (ctx?: ActionContext) => void
  closePanel: () => void
  togglePanel: () => void
  setContext: (ctx: ActionContext | null) => void
  setActiveCategory: (cat: QuickActionsState['activeCategory']) => void
  setSearchFilter: (filter: string) => void

  // Actions
  executeAction: (actionType: ActionType, ctx?: ActionContext) => Promise<void>
  cancelAction: () => void
  getFilteredActions: () => QuickAction[]
  getContextualActions: () => QuickAction[]

  // Clipboard
  addToClipboard: (content: string, type?: 'text' | 'code', sourceFile?: string, language?: string) => void
  clearClipboardHistory: () => void
  pasteFromHistory: (id: string) => string | null
  toggleClipboardPanel: () => void

  // History
  clearHistory: () => void
}

/** Simulate AI-powered action execution (mock) */
async function simulateAIAction(
  actionType: ActionType,
  input: string,
  language: string,
): Promise<string> {
  // Simulate processing time
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))

  const responses: Partial<Record<ActionType, string>> = {
    'refactor': `// Refactored version\n${input.replace(/var /g, 'const ').replace(/function /g, 'const ').replace(/ {2}/g, '  ')}`,
    'optimize': `// Optimized for performance\n${input}\n\n// Optimization notes:\n// - Memoized expensive computations\n// - Reduced re-renders with useMemo/useCallback`,
    'explain': `## Code Explanation\n\nThis code performs the following:\n1. Defines a component/function\n2. Processes input data\n3. Returns the transformed result\n\n**Key patterns**: Uses modern JavaScript/TypeScript idioms.`,
    'add-comments': input.split('\n').map((line, i) => i === 0 ? `/** Main logic */\n${line}` : line).join('\n'),
    'find-issues': `## Issues Found\n\n1. **Potential null reference** (line 3): Add null check\n2. **Performance**: Consider memoizing the result\n3. **Type safety**: Use explicit types instead of \`any\``,
    'test-generate': `import { describe, it, expect } from 'vitest'\n\ndescribe('Component', () => {\n  it('should render correctly', () => {\n    expect(true).toBe(true)\n  })\n\n  it('should handle edge cases', () => {\n    expect(() => {}).not.toThrow()\n  })\n})`,
    'doc-generate': `# API Documentation\n\n## Overview\n${input.slice(0, 80)}...\n\n## Parameters\n- **input**: The source data\n\n## Returns\nProcessed output\n\n## Examples\n\`\`\`${language}\n${input.slice(0, 100)}\n\`\`\``,
    'translate': `// Translated content (EN → ZH)\n${input}`,
    'rewrite': `// Rewritten for clarity\n${input}`,
    'expand': `${input}\n\n// Additional context and details:\n// This implementation follows the SOLID principles...`,
    'correct': input,
    'summarize': `**Summary**: This code handles data processing and transformation using modern patterns.`,
    'convert': input,
  }

  return responses[actionType] || input
}

export const useQuickActionsStore = create<QuickActionsState & QuickActionsActions>()(
  persist(
    (set, get) => ({
      panelOpen: false,
      context: null,
      activeCategory: 'all',
      searchFilter: '',
      activeExecution: null,
      history: [],
      clipboardHistory: [],
      clipboardPanelOpen: false,

      // Panel
      openPanel: (ctx) => set({ panelOpen: true, context: ctx || get().context }),
      closePanel: () => set({ panelOpen: false, searchFilter: '' }),
      togglePanel: () => set(s => ({ panelOpen: !s.panelOpen })),
      setContext: (ctx) => set({ context: ctx }),
      setActiveCategory: (cat) => set({ activeCategory: cat }),
      setSearchFilter: (filter) => set({ searchFilter: filter }),

      // Actions
      executeAction: async (actionType, ctx) => {
        const context = ctx || get().context
        if (!context?.selection?.text) {
          log.warn('No selection for action', { actionType })
          return
        }

        const action = QUICK_ACTIONS.find(a => a.type === actionType)
        if (!action) {return}

        const execId = `exec-${Date.now()}`
        const startTime = Date.now()

        // Set active execution
        set({
          activeExecution: {
            id: execId,
            actionType,
            input: context.selection.text,
            output: '',
            status: 'processing',
            timestamp: startTime,
          },
        })

        try {
          let output: string

          // Non-AI actions
          if (!action.requiresAI) {
            switch (actionType) {
              case 'copy': {
                await navigator.clipboard.writeText(context.selection.text)
                get().addToClipboard(context.selection.text, 'code', context.file?.path, context.file?.language)
                output = context.selection.text
                break
              }
              case 'copy-markdown': {
                const lang = context.file?.language || 'text'
                const md = `\`\`\`${lang}\n${context.selection.text}\n\`\`\``
                await navigator.clipboard.writeText(md)
                get().addToClipboard(md, 'text', context.file?.path)
                output = md
                break
              }
              case 'copy-html': {
                const lang = context.file?.language || 'text'
                const html = `<pre><code class="language-${lang}">${context.selection.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
                await navigator.clipboard.writeText(html)
                get().addToClipboard(html, 'text', context.file?.path)
                output = html
                break
              }
              case 'format': {
                // Simple indent normalization
                output = context.selection.text.replace(/\t/g, '  ')
                break
              }
              default:
                output = context.selection.text
            }
          } else {
            // AI-powered actions (simulated)
            output = await simulateAIAction(actionType, context.selection.text, context.file?.language || 'text')
          }

          const duration = Date.now() - startTime
          const execution: ActionExecution = {
            id: execId,
            actionType,
            input: context.selection.text,
            output,
            status: 'success',
            timestamp: startTime,
            duration,
          }

          set(s => ({
            activeExecution: execution,
            history: [execution, ...s.history].slice(0, 50),
          }))

          log.info('Action executed', { actionType, duration })
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error'
          const execution: ActionExecution = {
            id: execId,
            actionType,
            input: context.selection.text,
            output: '',
            status: 'error',
            timestamp: startTime,
            duration: Date.now() - startTime,
            error: errMsg,
          }

          set(s => ({
            activeExecution: execution,
            history: [execution, ...s.history].slice(0, 50),
          }))

          log.error('Action failed', { actionType, error: errMsg })
        }
      },

      cancelAction: () => {
        set(s => {
          if (s.activeExecution?.status === 'processing') {
            return {
              activeExecution: { ...s.activeExecution, status: 'error', error: 'Cancelled by user' },
            }
          }
          return {}
        })
      },

      getFilteredActions: () => {
        const { activeCategory, searchFilter } = get()
        let actions = QUICK_ACTIONS

        if (activeCategory !== 'all') {
          actions = actions.filter(a => a.category === activeCategory)
        }

        if (searchFilter) {
          const q = searchFilter.toLowerCase()
          actions = actions.filter(a =>
            a.title.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.type.includes(q)
          )
        }

        return actions
      },

      getContextualActions: () => {
        const { context } = get()
        if (!context?.file?.language) {return QUICK_ACTIONS}

        const lang = context.file.language.toLowerCase()
        const isCode = ['typescript', 'javascript', 'tsx', 'jsx', 'ts', 'js', 'python', 'rust', 'go', 'java', 'css'].includes(lang)
        const isMarkdown = ['markdown', 'md'].includes(lang)

        if (isCode) {
          return QUICK_ACTIONS.filter(a => a.target === 'code' || a.category === 'ai')
        }
        if (isMarkdown) {
          return QUICK_ACTIONS.filter(a => a.target === 'document' || a.target === 'text' || a.category === 'ai')
        }

        return QUICK_ACTIONS
      },

      // Clipboard
      addToClipboard: (content, type = 'text', sourceFile, language) => {
        const item: ClipboardHistoryItem = {
          id: `clip-${Date.now()}`,
          content,
          type,
          copiedAt: Date.now(),
          sourceFile,
          language,
          size: content.length,
        }

        set(s => ({
          clipboardHistory: [item, ...s.clipboardHistory].slice(0, 50),
        }))
      },

      clearClipboardHistory: () => set({ clipboardHistory: [] }),

      pasteFromHistory: (id) => {
        const item = get().clipboardHistory.find(i => i.id === id)
        if (item) {
          navigator.clipboard.writeText(item.content)
          return item.content
        }
        return null
      },

      toggleClipboardPanel: () => set(s => ({ clipboardPanelOpen: !s.clipboardPanelOpen })),

      // History
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'yyc3_quick_actions',
      partialize: (state) => ({
        clipboardHistory: state.clipboardHistory,
        history: state.history.slice(0, 20),
      }),
    }
  )
)
