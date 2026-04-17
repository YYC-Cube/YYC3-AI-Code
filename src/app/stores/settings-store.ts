/**
 * @file settings-store.ts
 * @description Settings state management — user profile, general settings, agents, MCP,
 *   models, context, conversation flow, rules & skills, keybindings, search
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings, state, persist, keybindings, mcp, rules, agents
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'
import { useAIServiceStore } from './ai-service-store'

const log = createLogger('SettingsStore')

// ============================================
// API Key Obfuscation for localStorage
// In production, use crypto-service.ts AES-GCM via Tauri keychain.
// For sandbox/browser, use reversible XOR+Base64 to avoid plaintext keys in localStorage.
// ============================================

const OBFUSCATION_KEY = 'YYC3-Family-AI-2026'

function obfuscateApiKey(plain: string): string {
  if (!plain) {return ''}
  const prefix = '$$ENC$$'
  if (plain.startsWith(prefix)) {return plain}
  const result: number[] = []
  for (let i = 0; i < plain.length; i++) {
    result.push(plain.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length))
  }
  return prefix + btoa(String.fromCharCode(...result))
}

function deobfuscateApiKey(encoded: string): string {
  if (!encoded) {return ''}
  const prefix = '$$ENC$$'
  if (!encoded.startsWith(prefix)) {return encoded}
  try {
    const raw = atob(encoded.slice(prefix.length))
    const result: number[] = []
    for (let i = 0; i < raw.length; i++) {
      result.push(raw.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length))
    }
    return String.fromCharCode(...result)
  } catch {
    return ''
  }
}

/** Custom storage adapter that encrypts API keys before writing to localStorage */
const secureStorage = {
  getItem: (name: string): string | null => {
    const raw = localStorage.getItem(name)
    if (!raw) {return null}
    try {
      const parsed = JSON.parse(raw)
      // Decrypt API keys in models
      if (parsed?.state?.settings?.models) {
        parsed.state.settings.models = parsed.state.settings.models.map((m: any) => ({
          ...m,
          apiKey: deobfuscateApiKey(m.apiKey || ''),
        }))
      }
      return JSON.stringify(parsed)
    } catch {
      return raw
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      const parsed = JSON.parse(value)
      // Encrypt API keys in models before saving
      if (parsed?.state?.settings?.models) {
        parsed.state.settings.models = parsed.state.settings.models.map((m: any) => ({
          ...m,
          apiKey: obfuscateApiKey(m.apiKey || ''),
        }))
      }
      localStorage.setItem(name, JSON.stringify(parsed))
    } catch {
      localStorage.setItem(name, value)
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name)
  },
}

// ============================================
// Pinyin Fuzzy Search — maps common Chinese UI labels to pinyin
// ============================================

const PINYIN_MAP: Record<string, string> = {
  '主题': 'zhuti theme',
  '语言': 'yuyan language',
  '字体': 'ziti font',
  '大小': 'daxiao size',
  '换行': 'huanhang wrap',
  '快捷键': 'kuaijiejian shortcut',
  '编辑器': 'bianjiqi editor',
  '待办': 'daiban todo',
  '清单': 'qingdan list',
  '自动': 'zidong auto',
  '修复': 'xiufu fix',
  '代码': 'daima code',
  '审查': 'shencha review',
  '命令': 'mingling command',
  '执行': 'zhixing run',
  '音量': 'yinliang volume',
  '索引': 'suoyin index',
  '温度': 'wendu temperature',
  '模型': 'moxing model',
  '服务': 'fuwu service',
  '规则': 'guize rule',
  '技能': 'jineng skill',
  '设置': 'shezhi settings',
  '通知': 'tongzhi notification',
  '安全': 'anquan security',
  '加密': 'jiami encrypt',
  '密钥': 'miyao key',
  '连接': 'lianjie connect',
  '数据库': 'shujuku database',
  '文件': 'wenjian file',
  '文档': 'wendang document',
  '导入': 'daoru import',
  '导出': 'daochu export',
  '重置': 'chongzhi reset',
}

/** Enrich a searchable string with pinyin equivalents */
function enrichWithPinyin(text: string): string {
  let enriched = text
  for (const [cn, py] of Object.entries(PINYIN_MAP)) {
    if (text.includes(cn)) {
      enriched += ` ${py}`
    }
  }
  return enriched.toLowerCase()
}

// ============================================
// Types
// ============================================

export type Theme = 'light' | 'dark' | 'auto'
export type Language = 'zh-CN' | 'en-US' | 'ja-JP'
export type NotificationType = 'banner' | 'sound' | 'menu'
export type SoundType = 'complete' | 'waiting' | 'interrupt'
export type CodeReviewScope = 'none' | 'all' | 'changed'
export type CommandRunMode = 'sandbox' | 'direct'
export type SkillScope = 'global' | 'project'

export interface UserProfile {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
}

export interface GeneralSettings {
  theme: Theme
  language: Language
  editorFont: string
  editorFontSize: number
  wordWrap: boolean
  keybindingScheme: 'vscode' | 'custom'
  customKeybindings: Record<string, string>
  localLinkOpenMode: 'system' | 'builtin'
  markdownOpenMode: 'editor' | 'preview'
  nodeVersion: string
}

export interface AgentConfig {
  id: string
  name: string
  description?: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  isBuiltIn: boolean
  isCustom: boolean
}

export interface MCPConfig {
  id: string
  name: string
  type: 'market' | 'manual'
  endpoint?: string
  enabled: boolean
  projectLevel: boolean
  description?: string
  icon?: string
}

export interface ModelConfig {
  id: string
  provider: string
  model: string
  apiKey: string
  enabled: boolean
}

export interface DocumentSet {
  id: string
  name: string
  source: 'url' | 'local'
  url?: string
  localPath?: string
  enabled: boolean
}

export interface ContextSettings {
  indexStatus: 'idle' | 'indexing' | 'completed' | 'error'
  ignoreRules: string[]
  documentSets: DocumentSet[]
}

export interface ConversationSettings {
  useTodoList: boolean
  autoCollapseNodes: boolean
  autoFixCodeIssues: boolean
  agentProactiveQuestion: boolean
  codeReviewScope: CodeReviewScope
  jumpAfterReview: boolean
  autoRunMCP: boolean
  commandRunMode: CommandRunMode
  whitelistCommands: string[]
  notificationTypes: NotificationType[]
  volume: number
  soundConfig: Record<SoundType, string>
}

export interface RuleConfig {
  id: string
  name: string
  content: string
  scope: 'personal' | 'project'
  enabled: boolean
}

export interface SkillConfig {
  id: string
  name: string
  description?: string
  content: string
  scope: SkillScope
  enabled: boolean
}

export interface ImportSettings {
  includeAgentsMD: boolean
  includeClaudeMD: boolean
}

export interface Settings {
  userProfile: UserProfile
  general: GeneralSettings
  agents: AgentConfig[]
  mcpConfigs: MCPConfig[]
  models: ModelConfig[]
  context: ContextSettings
  conversation: ConversationSettings
  rules: RuleConfig[]
  skills: SkillConfig[]
  importSettings: ImportSettings
}

// ============================================
// Default keybindings (VSCode-style)
// ============================================

export const DEFAULT_KEYBINDINGS: Record<string, string> = {
  'toggleTerminal': 'Ctrl+`',
  'toggleLeftPanel': 'Ctrl+B',
  'toggleRightPanel': 'Ctrl+Shift+B',
  'toggleSearch': 'Ctrl+Shift+F',
  'refreshPreview': 'Ctrl+R',
  'toggleInspector': 'Ctrl+Shift+I',
  'toggleGridOverlay': 'Ctrl+Shift+G',
  'toggleFileSystem': 'Ctrl+Shift+E',
  'toggleDatabase': 'Ctrl+Shift+D',
  'toggleConsole': 'Ctrl+Shift+C',
  'commandPalette': 'Ctrl+K',
  'viewPreview': 'Ctrl+1',
  'viewCode': 'Ctrl+2',
  'viewSplit': 'Ctrl+3',
  'saveFile': 'Ctrl+S',
  'newFile': 'Ctrl+N',
  'closeTab': 'Ctrl+W',
  'openSettings': 'Ctrl+,',
}

// ============================================
// Preset data
// ============================================

const PRESET_AGENTS: AgentConfig[] = [
  {
    id: 'agent-coder',
    name: 'Code Assistant',
    description: 'Full-stack code generation and debugging',
    systemPrompt: 'You are an expert full-stack developer. Help users write clean, efficient code following best practices.',
    model: 'gpt-4-turbo-preview',
    temperature: 0.3,
    maxTokens: 4096,
    isBuiltIn: true,
    isCustom: false,
  },
  {
    id: 'agent-reviewer',
    name: 'Code Reviewer',
    description: 'Code review and quality analysis',
    systemPrompt: 'You are a senior code reviewer. Analyze code for bugs, performance issues, security vulnerabilities, and suggest improvements.',
    model: 'gpt-4-turbo-preview',
    temperature: 0.2,
    maxTokens: 4096,
    isBuiltIn: true,
    isCustom: false,
  },
  {
    id: 'agent-architect',
    name: 'System Architect',
    description: 'Architecture design and technical decisions',
    systemPrompt: 'You are a senior system architect. Help design scalable, maintainable system architectures.',
    model: 'claude-3-opus-20240229',
    temperature: 0.5,
    maxTokens: 8192,
    isBuiltIn: true,
    isCustom: false,
  },
]

const PRESET_MCPS: MCPConfig[] = [
  {
    id: 'mcp-filesystem',
    name: 'File System',
    type: 'market',
    endpoint: 'stdio://mcp-server-filesystem',
    enabled: true,
    projectLevel: false,
    description: 'Read/write files on the local filesystem',
    icon: 'FolderOpen',
  },
  {
    id: 'mcp-github',
    name: 'GitHub',
    type: 'market',
    endpoint: 'stdio://mcp-server-github',
    enabled: false,
    projectLevel: false,
    description: 'GitHub repository operations',
    icon: 'Github',
  },
  {
    id: 'mcp-browser',
    name: 'Browser',
    type: 'market',
    endpoint: 'stdio://mcp-server-puppeteer',
    enabled: false,
    projectLevel: false,
    description: 'Browser automation and web scraping',
    icon: 'Globe',
  },
  {
    id: 'mcp-database',
    name: 'Database',
    type: 'market',
    endpoint: 'stdio://mcp-server-postgres',
    enabled: false,
    projectLevel: true,
    description: 'PostgreSQL database operations',
    icon: 'Database',
  },
]

const PRESET_MODELS: ModelConfig[] = [
  { id: 'model-gpt4t', provider: 'OpenAI', model: 'gpt-4-turbo-preview', apiKey: '', enabled: true },
  { id: 'model-gpt35', provider: 'OpenAI', model: 'gpt-3.5-turbo', apiKey: '', enabled: true },
  { id: 'model-claude3', provider: 'Anthropic', model: 'claude-3-opus-20240229', apiKey: '', enabled: false },
  { id: 'model-glm4', provider: 'ZhipuAI', model: 'glm-4', apiKey: '', enabled: false },
  { id: 'model-qwen', provider: 'Aliyun', model: 'qwen-max', apiKey: '', enabled: false },
]

const PRESET_RULES: RuleConfig[] = [
  {
    id: 'rule-code-style',
    name: 'Code Style Guide',
    content: 'Always use TypeScript strict mode. Prefer const over let. Use functional components with hooks. Follow the project naming conventions.',
    scope: 'personal',
    enabled: true,
  },
  {
    id: 'rule-file-header',
    name: 'File Header Standard',
    content: 'All code files must include proper file headers with @file, @description, @author (YanYuCloudCube Team), @version, @created, @updated, @status, @license (MIT), @copyright.',
    scope: 'project',
    enabled: true,
  },
]

const PRESET_SKILLS: SkillConfig[] = [
  {
    id: 'skill-react',
    name: 'React Expert',
    description: 'Advanced React patterns and best practices',
    content: 'Use React 18 features: concurrent rendering, Suspense, useTransition. Prefer server components where applicable. Use Zustand for state management.',
    scope: 'global',
    enabled: true,
  },
  {
    id: 'skill-tailwind',
    name: 'Tailwind CSS',
    description: 'Tailwind CSS v4 utility-first styling',
    content: 'Use Tailwind CSS v4 classes. Avoid custom CSS when possible. Use @apply sparingly. Leverage design tokens from theme.css.',
    scope: 'global',
    enabled: true,
  },
]

// ============================================
// Default Settings
// ============================================

const defaultSettings: Settings = {
  userProfile: {
    id: 'user-default',
    username: 'YYC3 Developer',
    email: 'dev@yyc3.ai',
    bio: 'YYC3 Family AI Developer',
  },
  general: {
    theme: 'dark',
    language: 'zh-CN',
    editorFont: 'JetBrains Mono',
    editorFontSize: 14,
    wordWrap: true,
    keybindingScheme: 'vscode',
    customKeybindings: { ...DEFAULT_KEYBINDINGS },
    localLinkOpenMode: 'system',
    markdownOpenMode: 'editor',
    nodeVersion: '20.11.0',
  },
  agents: PRESET_AGENTS,
  mcpConfigs: PRESET_MCPS,
  models: PRESET_MODELS,
  context: {
    indexStatus: 'idle',
    ignoreRules: ['node_modules', '.git', 'dist', '.next', '.turbo', '*.lock'],
    documentSets: [],
  },
  conversation: {
    useTodoList: true,
    autoCollapseNodes: false,
    autoFixCodeIssues: true,
    agentProactiveQuestion: true,
    codeReviewScope: 'all',
    jumpAfterReview: true,
    autoRunMCP: false,
    commandRunMode: 'sandbox',
    whitelistCommands: ['npm test', 'npm run lint', 'npm run build'],
    notificationTypes: ['banner', 'sound'],
    volume: 80,
    soundConfig: { complete: 'default', waiting: 'default', interrupt: 'default' },
  },
  rules: PRESET_RULES,
  skills: PRESET_SKILLS,
  importSettings: { includeAgentsMD: false, includeClaudeMD: false },
}

// ============================================
// Store Interface
// ============================================

export type SettingsSectionId =
  | 'account'
  | 'general'
  | 'agents'
  | 'mcp'
  | 'models'
  | 'context'
  | 'conversation'
  | 'rules'
  | 'data'

// Deep search result
export interface SearchResult {
  path: string
  title: string
  description?: string
  value: any
  type: 'setting' | 'agent' | 'mcp' | 'model' | 'rule' | 'skill'
  section: SettingsSectionId
}

interface SettingsStoreState {
  settings: Settings
  searchQuery: string
  activeSection: SettingsSectionId
  loading: boolean
  error: string | null
}

interface SettingsStoreActions {
  setActiveSection: (section: SettingsSectionId) => void
  setSearchQuery: (query: string) => void

  // User profile
  updateUserProfile: (profile: Partial<UserProfile>) => void

  // General
  updateGeneralSettings: (s: Partial<GeneralSettings>) => void
  updateKeybinding: (action: string, keys: string) => void
  resetKeybindings: () => void

  // Agents
  addAgent: (agent: AgentConfig) => void
  updateAgent: (id: string, agent: Partial<AgentConfig>) => void
  removeAgent: (id: string) => void

  // MCP
  addMCP: (mcp: MCPConfig) => void
  updateMCP: (id: string, mcp: Partial<MCPConfig>) => void
  removeMCP: (id: string) => void
  toggleMCP: (id: string) => void

  // Models
  addModel: (model: ModelConfig) => void
  updateModel: (id: string, model: Partial<ModelConfig>) => void
  removeModel: (id: string) => void

  // Context
  updateContextSettings: (s: Partial<ContextSettings>) => void
  addDocumentSet: (doc: DocumentSet) => void
  removeDocumentSet: (id: string) => void
  addIgnoreRule: (rule: string) => void
  removeIgnoreRule: (rule: string) => void

  // Conversation
  updateConversationSettings: (s: Partial<ConversationSettings>) => void
  addWhitelistCommand: (cmd: string) => void
  removeWhitelistCommand: (cmd: string) => void

  // Rules
  addRule: (rule: RuleConfig) => void
  updateRule: (id: string, rule: Partial<RuleConfig>) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void

  // Skills
  addSkill: (skill: SkillConfig) => void
  updateSkill: (id: string, skill: Partial<SkillConfig>) => void
  removeSkill: (id: string) => void
  toggleSkill: (id: string) => void

  // Import / Export / Reset
  updateImportSettings: (s: Partial<ImportSettings>) => void
  importConfig: (config: Partial<Settings>) => void
  exportConfig: () => Settings
  resetSettings: () => void

  // Cross-module helpers
  getEnabledRulesContent: () => string
  getEnabledMCPs: () => MCPConfig[]
  getActiveKeybindings: () => Record<string, string>

  // Deep search across all settings fields
  deepSearch: (query: string) => SearchResult[]

  // API key validation (simulated Tauri bridge — in production, calls invoke('validate_api_key'))
  validateApiKey: (modelId: string) => Promise<{ valid: boolean; message: string; latency?: number }>

  // MCP connection test (simulated Tauri bridge — in production, calls invoke('test_mcp'))
  testMCPConnection: (mcpId: string) => Promise<{ connected: boolean; message: string; latency?: number }>

  // Cross-module sync
  syncThemeToStore: () => void
  syncLanguageToI18n: () => void
  syncModelsToAIService: () => void
  buildSystemPrompt: (basePrompt?: string) => string
  getMCPInjectionPayload: () => { name: string; endpoint: string; projectLevel: boolean }[]
}

export const useSettingsStore = create<SettingsStoreState & SettingsStoreActions>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      searchQuery: '',
      activeSection: 'general',
      loading: false,
      error: null,

      setActiveSection: (section) => set({ activeSection: section }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      // User profile
      updateUserProfile: (profile) => {
        set((s) => ({
          settings: { ...s.settings, userProfile: { ...s.settings.userProfile, ...profile } },
        }))
        log.info('User profile updated')
      },

      // General
      updateGeneralSettings: (gs) => {
        set((s) => ({
          settings: { ...s.settings, general: { ...s.settings.general, ...gs } },
        }))
      },

      updateKeybinding: (action, keys) => {
        set((s) => ({
          settings: {
            ...s.settings,
            general: {
              ...s.settings.general,
              customKeybindings: { ...s.settings.general.customKeybindings, [action]: keys },
            },
          },
        }))
      },

      resetKeybindings: () => {
        set((s) => ({
          settings: {
            ...s.settings,
            general: { ...s.settings.general, customKeybindings: { ...DEFAULT_KEYBINDINGS } },
          },
        }))
      },

      // Agents
      addAgent: (agent) => {
        set((s) => ({
          settings: { ...s.settings, agents: [...s.settings.agents, agent] },
        }))
      },
      updateAgent: (id, agent) => {
        set((s) => ({
          settings: {
            ...s.settings,
            agents: s.settings.agents.map((a) => (a.id === id ? { ...a, ...agent } : a)),
          },
        }))
      },
      removeAgent: (id) => {
        set((s) => ({
          settings: { ...s.settings, agents: s.settings.agents.filter((a) => a.id !== id) },
        }))
      },

      // MCP
      addMCP: (mcp) => {
        set((s) => ({
          settings: { ...s.settings, mcpConfigs: [...s.settings.mcpConfigs, mcp] },
        }))
      },
      updateMCP: (id, mcp) => {
        set((s) => ({
          settings: {
            ...s.settings,
            mcpConfigs: s.settings.mcpConfigs.map((m) => (m.id === id ? { ...m, ...mcp } : m)),
          },
        }))
      },
      removeMCP: (id) => {
        set((s) => ({
          settings: { ...s.settings, mcpConfigs: s.settings.mcpConfigs.filter((m) => m.id !== id) },
        }))
      },
      toggleMCP: (id) => {
        set((s) => ({
          settings: {
            ...s.settings,
            mcpConfigs: s.settings.mcpConfigs.map((m) =>
              m.id === id ? { ...m, enabled: !m.enabled } : m
            ),
          },
        }))
      },

      // Models
      addModel: (model) => {
        set((s) => ({
          settings: { ...s.settings, models: [...s.settings.models, model] },
        }))
      },
      updateModel: (id, model) => {
        set((s) => ({
          settings: {
            ...s.settings,
            models: s.settings.models.map((m) => (m.id === id ? { ...m, ...model } : m)),
          },
        }))
      },
      removeModel: (id) => {
        set((s) => ({
          settings: { ...s.settings, models: s.settings.models.filter((m) => m.id !== id) },
        }))
      },

      // Context
      updateContextSettings: (cs) => {
        set((s) => ({
          settings: { ...s.settings, context: { ...s.settings.context, ...cs } },
        }))
      },
      addDocumentSet: (doc) => {
        set((s) => ({
          settings: {
            ...s.settings,
            context: {
              ...s.settings.context,
              documentSets: [...s.settings.context.documentSets, doc],
            },
          },
        }))
      },
      removeDocumentSet: (id) => {
        set((s) => ({
          settings: {
            ...s.settings,
            context: {
              ...s.settings.context,
              documentSets: s.settings.context.documentSets.filter((d) => d.id !== id),
            },
          },
        }))
      },
      addIgnoreRule: (rule) => {
        set((s) => ({
          settings: {
            ...s.settings,
            context: {
              ...s.settings.context,
              ignoreRules: [...s.settings.context.ignoreRules, rule],
            },
          },
        }))
      },
      removeIgnoreRule: (rule) => {
        set((s) => ({
          settings: {
            ...s.settings,
            context: {
              ...s.settings.context,
              ignoreRules: s.settings.context.ignoreRules.filter((r) => r !== rule),
            },
          },
        }))
      },

      // Conversation
      updateConversationSettings: (cs) => {
        set((s) => ({
          settings: { ...s.settings, conversation: { ...s.settings.conversation, ...cs } },
        }))
      },
      addWhitelistCommand: (cmd) => {
        set((s) => ({
          settings: {
            ...s.settings,
            conversation: {
              ...s.settings.conversation,
              whitelistCommands: [...s.settings.conversation.whitelistCommands, cmd],
            },
          },
        }))
      },
      removeWhitelistCommand: (cmd) => {
        set((s) => ({
          settings: {
            ...s.settings,
            conversation: {
              ...s.settings.conversation,
              whitelistCommands: s.settings.conversation.whitelistCommands.filter((c) => c !== cmd),
            },
          },
        }))
      },

      // Rules
      addRule: (rule) => {
        set((s) => ({
          settings: { ...s.settings, rules: [...s.settings.rules, rule] },
        }))
      },
      updateRule: (id, rule) => {
        set((s) => ({
          settings: {
            ...s.settings,
            rules: s.settings.rules.map((r) => (r.id === id ? { ...r, ...rule } : r)),
          },
        }))
      },
      removeRule: (id) => {
        set((s) => ({
          settings: { ...s.settings, rules: s.settings.rules.filter((r) => r.id !== id) },
        }))
      },
      toggleRule: (id) => {
        set((s) => ({
          settings: {
            ...s.settings,
            rules: s.settings.rules.map((r) =>
              r.id === id ? { ...r, enabled: !r.enabled } : r
            ),
          },
        }))
      },

      // Skills
      addSkill: (skill) => {
        set((s) => ({
          settings: { ...s.settings, skills: [...s.settings.skills, skill] },
        }))
      },
      updateSkill: (id, skill) => {
        set((s) => ({
          settings: {
            ...s.settings,
            skills: s.settings.skills.map((sk) => (sk.id === id ? { ...sk, ...skill } : sk)),
          },
        }))
      },
      removeSkill: (id) => {
        set((s) => ({
          settings: { ...s.settings, skills: s.settings.skills.filter((sk) => sk.id !== id) },
        }))
      },
      toggleSkill: (id) => {
        set((s) => ({
          settings: {
            ...s.settings,
            skills: s.settings.skills.map((sk) =>
              sk.id === id ? { ...sk, enabled: !sk.enabled } : sk
            ),
          },
        }))
      },

      // Import/Export/Reset
      updateImportSettings: (is) => {
        set((s) => ({
          settings: { ...s.settings, importSettings: { ...s.settings.importSettings, ...is } },
        }))
      },
      importConfig: (config) => {
        set({ settings: { ...defaultSettings, ...config } })
        log.info('Settings imported')
      },
      exportConfig: () => get().settings,
      resetSettings: () => {
        set({ settings: defaultSettings })
        log.info('Settings reset to defaults')
      },

      // Cross-module helpers
      getEnabledRulesContent: () => {
        const { rules, skills } = get().settings
        const parts: string[] = []
        rules.filter((r) => r.enabled).forEach((r) => parts.push(`[Rule: ${r.name}]\n${r.content}`))
        skills.filter((s) => s.enabled).forEach((s) => parts.push(`[Skill: ${s.name}]\n${s.content}`))
        return parts.join('\n\n')
      },

      getEnabledMCPs: () => {
        return get().settings.mcpConfigs.filter((m) => m.enabled)
      },

      getActiveKeybindings: () => {
        const { general } = get().settings
        if (general.keybindingScheme === 'vscode') {return { ...DEFAULT_KEYBINDINGS }}
        return { ...DEFAULT_KEYBINDINGS, ...general.customKeybindings }
      },

      // Deep search across all settings fields
      deepSearch: (query: string): SearchResult[] => {
        if (!query.trim()) {return []}
        const results: SearchResult[] = []
        const q = query.toLowerCase()
        const { settings: s } = get()

        // General settings — theme, language, font, etc.
        const generalFields: [string, string, any][] = [
          ['general.theme', '主题 / Theme', s.general.theme],
          ['general.language', '语言 / Language', s.general.language],
          ['general.editorFont', '编辑器字体 / Editor Font', s.general.editorFont],
          ['general.editorFontSize', '字体大小 / Font Size', s.general.editorFontSize],
          ['general.wordWrap', '自动换行 / Word Wrap', s.general.wordWrap],
          ['general.keybindingScheme', '快捷键方案 / Keybinding Scheme', s.general.keybindingScheme],
          ['general.nodeVersion', 'Node.js', s.general.nodeVersion],
        ]
        for (const [path, title, value] of generalFields) {
          const searchable = enrichWithPinyin(`${title} ${String(value)}`)
          if (searchable.includes(q)) {
            results.push({ path, title, value, type: 'setting', section: 'general' })
          }
        }

        // Agents — name, description, model, temperature
        for (const agent of s.agents) {
          const searchable = enrichWithPinyin(`${agent.name} ${agent.description || ''} ${agent.model} temperature:${agent.temperature} 温度`)
          if (searchable.includes(q)) {
            results.push({
              path: `agents.${agent.id}`,
              title: agent.name,
              description: agent.description,
              value: agent,
              type: 'agent',
              section: 'agents',
            })
          }
        }

        // MCP configs — name, endpoint, description
        for (const mcp of s.mcpConfigs) {
          const searchable = enrichWithPinyin(`${mcp.name} ${mcp.endpoint || ''} ${mcp.description || ''} ${mcp.type}`)
          if (searchable.includes(q)) {
            results.push({
              path: `mcp.${mcp.id}`,
              title: mcp.name,
              description: mcp.description,
              value: mcp,
              type: 'mcp',
              section: 'mcp',
            })
          }
        }

        // Models — provider, model name
        for (const model of s.models) {
          const searchable = enrichWithPinyin(`${model.provider} ${model.model}`)
          if (searchable.includes(q)) {
            results.push({
              path: `models.${model.id}`,
              title: `${model.provider} / ${model.model}`,
              value: model,
              type: 'model',
              section: 'models',
            })
          }
        }

        // Context settings
        if (enrichWithPinyin('代码索引 code index indexing').includes(q)) {
          results.push({ path: 'context.indexStatus', title: '代码索引状态 / Code Index', value: s.context.indexStatus, type: 'setting', section: 'context' })
        }
        for (const doc of s.context.documentSets) {
          if (doc.name.toLowerCase().includes(q)) {
            results.push({ path: `context.doc.${doc.id}`, title: doc.name, value: doc, type: 'setting', section: 'context' })
          }
        }

        // Conversation settings
        const convFields: [string, string, any][] = [
          ['conversation.useTodoList', '待办清单 / Todo List', s.conversation.useTodoList],
          ['conversation.autoFixCodeIssues', '自动修复 / Auto Fix', s.conversation.autoFixCodeIssues],
          ['conversation.codeReviewScope', '代码审查 / Code Review', s.conversation.codeReviewScope],
          ['conversation.autoRunMCP', '自动运行MCP / Auto Run MCP', s.conversation.autoRunMCP],
          ['conversation.commandRunMode', '命令执行 / Command Run', s.conversation.commandRunMode],
          ['conversation.volume', '音量 / Volume', s.conversation.volume],
        ]
        for (const [path, title, value] of convFields) {
          const searchable = enrichWithPinyin(`${title} ${String(value)}`)
          if (searchable.includes(q)) {
            results.push({ path, title, value, type: 'setting', section: 'conversation' })
          }
        }

        // Rules
        for (const rule of s.rules) {
          const searchable = enrichWithPinyin(`${rule.name} ${rule.content} ${rule.scope}`)
          if (searchable.includes(q)) {
            results.push({ path: `rules.${rule.id}`, title: rule.name, value: rule, type: 'rule', section: 'rules' })
          }
        }

        // Skills
        for (const skill of s.skills) {
          const searchable = enrichWithPinyin(`${skill.name} ${skill.description || ''} ${skill.content} ${skill.scope}`)
          if (searchable.includes(q)) {
            results.push({ path: `skills.${skill.id}`, title: skill.name, description: skill.description, value: skill, type: 'skill', section: 'rules' })
          }
        }

        return results
      },

      // API key validation (simulated Tauri bridge — in production, calls invoke('validate_api_key'))
      validateApiKey: async (modelId: string) => {
        const model = get().settings.models.find(m => m.id === modelId)
        if (!model) {return { valid: false, message: 'Model not found' }}
        if (!model.apiKey || model.apiKey.trim().length < 8) {
          return { valid: false, message: 'API key is empty or too short' }
        }

        // Simulate network latency for key validation
        const latency = 200 + Math.random() * 800
        await new Promise(r => setTimeout(r, latency))

        // Simulate validation: keys starting with 'sk-' or non-empty keys pass
        const valid = model.apiKey.startsWith('sk-') || model.apiKey.length >= 20
        return {
          valid,
          message: valid ? 'API key validated successfully' : 'Invalid API key format',
          latency: Math.round(latency),
        }
      },

      // MCP connection test (simulated Tauri bridge — in production, calls invoke('test_mcp'))
      testMCPConnection: async (mcpId: string) => {
        const mcp = get().settings.mcpConfigs.find(m => m.id === mcpId)
        if (!mcp) {return { connected: false, message: 'MCP not found' }}
        if (!mcp.endpoint) {return { connected: false, message: 'No endpoint configured' }}

        // Simulate connection test
        const latency = 100 + Math.random() * 500
        await new Promise(r => setTimeout(r, latency))

        // stdio:// always connects, http:// has 90% success
        const isStdio = mcp.endpoint.startsWith('stdio://')
        const connected = isStdio || Math.random() > 0.1
        return {
          connected,
          message: connected
            ? `Connected to ${mcp.name} (${Math.round(latency)}ms)`
            : `Failed to connect: endpoint unreachable`,
          latency: Math.round(latency),
        }
      },

      // Cross-module sync: settings theme → theme-store
      syncThemeToStore: () => {
        // This is called by the SettingsPage when theme changes
        // The actual theme application is handled by theme-store.setTheme
        log.info('Theme sync requested', { theme: get().settings.general.theme })
      },

      // Cross-module sync: settings language → i18n-service
      syncLanguageToI18n: () => {
        log.info('Language sync requested', { language: get().settings.general.language })
      },

      // Cross-module sync: settings models → ai-service-store
      syncModelsToAIService: () => {
        const models = get().settings.models.filter(m => m.enabled)
        log.info('Syncing models to AI service store', { count: models.length })

        // Access ai-service-store via getState (imported at top)
        const aiStore = useAIServiceStore.getState()
        if (!aiStore) {
          log.warn('ai-service-store not available for sync')
          return
        }

        for (const mc of models) {
          const existing = aiStore.providers?.find((p: any) => p.id === mc.provider || p.name === mc.provider)
          if (existing) {
            // Update API key on existing provider
            if (mc.apiKey) {
              aiStore.setProviderApiKey?.(existing.id, mc.apiKey)
            }
            // Ensure the specific model is enabled
            const modelMatch = existing.models?.find((m: any) => m.name === mc.model || m.id === mc.model)
            if (modelMatch && !modelMatch.enabled) {
              aiStore.toggleModel?.(existing.id, modelMatch.id)
            }
          } else {
            // Create a custom provider entry for unknown providers
            aiStore.addProvider?.({
              id: mc.provider.toLowerCase().replace(/\s+/g, '-'),
              name: mc.provider.toLowerCase().replace(/\s+/g, '-'),
              displayName: mc.provider,
              type: 'cloud' as const,
              baseURL: '',
              apiKey: mc.apiKey,
              models: [{
                id: mc.model,
                name: mc.model,
                displayName: mc.model,
                type: 'chat' as const,
                contextLength: 128000,
                maxTokens: 4096,
                enabled: true,
                parameters: { temperature: 0.7, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
                capabilities: ['chat', 'code'],
              }],
              enabled: true,
              priority: 99,
            })
          }
        }
        log.info('Models sync complete')
      },

      // Build complete system prompt with injected rules & skills
      buildSystemPrompt: (basePrompt?: string) => {
        const rulesContent = get().getEnabledRulesContent()
        const parts: string[] = []
        if (basePrompt) {parts.push(basePrompt)}
        if (rulesContent) {
          parts.push('\n--- Injected Rules & Skills ---\n')
          parts.push(rulesContent)
        }
        return parts.join('\n')
      },

      // Get MCP injection payload for AI session
      getMCPInjectionPayload: () => {
        return get().settings.mcpConfigs
          .filter(m => m.enabled && m.endpoint)
          .map(m => ({
            name: m.name,
            endpoint: m.endpoint!,
            projectLevel: m.projectLevel,
          }))
      },
    }),
    {
      name: 'yyc3_settings_store',
       
      storage: secureStorage as any,
       
      partialize: (state: any) => ({
        settings: state.settings,
        activeSection: state.activeSection,
      }),
      merge: (persisted: any, current) => {
        if (!persisted) {return current}
        return {
          ...current,
          settings: {
            ...defaultSettings,
            ...persisted.settings,
            general: {
              ...defaultSettings.general,
              ...(persisted.settings?.general || {}),
              customKeybindings: {
                ...DEFAULT_KEYBINDINGS,
                ...(persisted.settings?.general?.customKeybindings || {}),
              },
            },
            agents: persisted.settings?.agents?.length ? persisted.settings.agents : defaultSettings.agents,
            mcpConfigs: persisted.settings?.mcpConfigs?.length ? persisted.settings.mcpConfigs : defaultSettings.mcpConfigs,
            models: persisted.settings?.models?.length ? persisted.settings.models : defaultSettings.models,
            rules: persisted.settings?.rules?.length ? persisted.settings.rules : defaultSettings.rules,
            skills: persisted.settings?.skills?.length ? persisted.settings.skills : defaultSettings.skills,
          },
          activeSection: persisted.activeSection || current.activeSection,
        }
      },
    }
  )
)