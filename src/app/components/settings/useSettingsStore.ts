/**
 * @file useSettingsStore.ts
 * @description YYC3 设置状态管理 — 轻量级单例 Store，含 localStorage 持久化、全局搜索、类型安全
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,store,state,persist
 */

import { useSyncExternalStore } from 'react';

/* ================================================================
   Types
   ================================================================ */

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'zh-CN' | 'en-US' | 'ja-JP';
export type NotificationType = 'banner' | 'sound' | 'menu';
export type SoundType = 'complete' | 'waiting' | 'interrupt';
export type CodeReviewScope = 'none' | 'all' | 'changed';
export type CommandRunMode = 'sandbox' | 'direct';
export type SkillScope = 'global' | 'project';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export interface GeneralSettings {
  theme: Theme;
  language: Language;
  editorFont: string;
  editorFontSize: number;
  wordWrap: boolean;
  keybindingScheme: 'vscode' | 'custom';
  customKeybindings: Record<string, string>;
  localLinkOpenMode: 'system' | 'builtin';
  markdownOpenMode: 'editor' | 'preview';
  nodeVersion: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isBuiltIn: boolean;
  isCustom: boolean;
}

export interface MCPConfig {
  id: string;
  name: string;
  type: 'market' | 'manual';
  endpoint?: string;
  enabled: boolean;
  projectLevel: boolean;
}

export interface ModelConfig {
  id: string;
  provider: string;
  model: string;
  apiKey: string;
  enabled: boolean;
}

export interface DocumentSet {
  id: string;
  name: string;
  source: 'url' | 'local';
  url?: string;
  localPath?: string;
  enabled: boolean;
}

export interface ContextSettings {
  indexStatus: 'idle' | 'indexing' | 'completed' | 'error';
  ignoreRules: string[];
  documentSets: DocumentSet[];
}

export interface ConversationSettings {
  useTodoList: boolean;
  autoCollapseNodes: boolean;
  autoFixCodeIssues: boolean;
  agentProactiveQuestion: boolean;
  codeReviewScope: CodeReviewScope;
  jumpAfterReview: boolean;
  autoRunMCP: boolean;
  commandRunMode: CommandRunMode;
  whitelistCommands: string[];
  notificationTypes: NotificationType[];
  volume: number;
  soundConfig: Record<SoundType, string>;
}

export interface RuleConfig {
  id: string;
  name: string;
  content: string;
  scope: 'personal' | 'project';
  enabled: boolean;
}

export interface SkillConfig {
  id: string;
  name: string;
  description?: string;
  content: string;
  scope: SkillScope;
  enabled: boolean;
}

export interface ImportSettings {
  includeAgentsMD: boolean;
  includeClaudeMD: boolean;
}

export interface Settings {
  userProfile: UserProfile;
  general: GeneralSettings;
  agents: AgentConfig[];
  mcpConfigs: MCPConfig[];
  models: ModelConfig[];
  context: ContextSettings;
  conversation: ConversationSettings;
  rules: RuleConfig[];
  skills: SkillConfig[];
  importSettings: ImportSettings;
}

/* ================================================================
   Search
   ================================================================ */

export interface SearchResult {
  path: string;
  title: string;
  description?: string;
  value: any;
  type: 'setting' | 'agent' | 'mcp' | 'model' | 'rule' | 'skill';
  section: string;
}

export function searchSettings(settings: Settings, query: string): SearchResult[] {
  if (!query.trim()) return [];
  const results: SearchResult[] = [];
  const lq = query.toLowerCase();

  const gMap: Record<string, string> = {
    theme: '主题 Theme', language: '语言 Language',
    editorFont: '编辑器字体 Editor Font', editorFontSize: '字体大小 Font Size',
    wordWrap: '自动换行 Word Wrap', keybindingScheme: '快捷键方案 Keybinding',
    localLinkOpenMode: '链接打开方式', markdownOpenMode: 'Markdown 打开方式',
    nodeVersion: 'Node.js 版本',
  };
  for (const [k, label] of Object.entries(gMap)) {
    if (label.toLowerCase().includes(lq)) {
      results.push({ path: `general.${k}`, title: label, value: (settings.general as any)[k], type: 'setting', section: 'general' });
    }
  }

  for (const a of settings.agents) {
    if (a.name.toLowerCase().includes(lq) || (a.description?.toLowerCase().includes(lq))) {
      results.push({ path: `agents.${a.id}`, title: a.name, description: a.description, value: a, type: 'agent', section: 'agents' });
    }
  }

  for (const m of settings.mcpConfigs) {
    if (m.name.toLowerCase().includes(lq)) {
      results.push({ path: `mcp.${m.id}`, title: m.name, value: m, type: 'mcp', section: 'mcp' });
    }
  }

  for (const m of settings.models) {
    if (m.provider.toLowerCase().includes(lq) || m.model.toLowerCase().includes(lq)) {
      results.push({ path: `models.${m.id}`, title: `${m.provider} - ${m.model}`, value: m, type: 'model', section: 'models' });
    }
  }

  const cMap: Record<string, string> = {
    useTodoList: '待办清单 Todo', autoCollapseNodes: '自动折叠',
    autoFixCodeIssues: '自动修复', agentProactiveQuestion: '主动提问',
    codeReviewScope: '代码审查 Code Review', autoRunMCP: '自动运行 MCP',
    commandRunMode: '命令运行',
  };
  for (const [k, label] of Object.entries(cMap)) {
    if (label.toLowerCase().includes(lq)) {
      results.push({ path: `conversation.${k}`, title: label, value: (settings.conversation as any)[k], type: 'setting', section: 'conversation' });
    }
  }

  for (const r of settings.rules) {
    if (r.name.toLowerCase().includes(lq)) {
      results.push({ path: `rules.${r.id}`, title: r.name, value: r, type: 'rule', section: 'rules' });
    }
  }

  for (const s of settings.skills) {
    if (s.name.toLowerCase().includes(lq) || (s.description?.toLowerCase().includes(lq))) {
      results.push({ path: `skills.${s.id}`, title: s.name, description: s.description, value: s, type: 'skill', section: 'rules' });
    }
  }

  return results;
}

/* ================================================================
   Default Settings
   ================================================================ */

const defaultSettings: Settings = {
  userProfile: {
    id: 'user-001',
    username: 'YYC3 Developer',
    email: 'dev@yyc3.local',
    bio: 'Multi-Panel Low-Code Designer',
  },
  general: {
    theme: 'dark',
    language: 'zh-CN',
    editorFont: 'Monaco',
    editorFontSize: 14,
    wordWrap: true,
    keybindingScheme: 'vscode',
    customKeybindings: {},
    localLinkOpenMode: 'system',
    markdownOpenMode: 'editor',
    nodeVersion: '20.0.0',
  },
  agents: [
    {
      id: 'agent-default', name: 'YYC3 Assistant',
      description: '默认智能编程助手，擅长 React/TypeScript 开发',
      systemPrompt: '你是 YYC3 智能编程助手，专注于 React + TypeScript + TailwindCSS 开发。',
      model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 4096,
      isBuiltIn: true, isCustom: false,
    },
    {
      id: 'agent-reviewer', name: 'Code Reviewer',
      description: '代码审查专家，提供最佳实践建议',
      systemPrompt: '你是一个严格的代码审查专家，关注代码质量、性能和安全性。',
      model: 'gpt-4o', temperature: 0.3, maxTokens: 2048,
      isBuiltIn: true, isCustom: false,
    },
  ],
  mcpConfigs: [
    { id: 'mcp-fs', name: '文件系统 MCP', type: 'manual', endpoint: 'ws://localhost:3100/mcp/fs', enabled: true, projectLevel: false },
    { id: 'mcp-git', name: 'Git MCP', type: 'market', endpoint: 'ws://localhost:3100/mcp/git', enabled: true, projectLevel: true },
  ],
  models: [
    { id: 'model-openai', provider: 'OpenAI', model: 'gpt-4o-mini', apiKey: '', enabled: true },
    { id: 'model-anthropic', provider: 'Anthropic', model: 'claude-3.5-sonnet', apiKey: '', enabled: false },
    { id: 'model-zhipu', provider: '智谱 AI', model: 'glm-4-flash', apiKey: '', enabled: false },
  ],
  context: {
    indexStatus: 'idle',
    ignoreRules: ['node_modules', '.git', 'dist', '.next', '*.lock'],
    documentSets: [
      { id: 'doc-react', name: 'React 官方文档', source: 'url', url: 'https://react.dev', enabled: true },
      { id: 'doc-tailwind', name: 'Tailwind CSS 文档', source: 'url', url: 'https://tailwindcss.com/docs', enabled: true },
    ],
  },
  conversation: {
    useTodoList: true, autoCollapseNodes: false, autoFixCodeIssues: true,
    agentProactiveQuestion: true, codeReviewScope: 'all', jumpAfterReview: true,
    autoRunMCP: false, commandRunMode: 'sandbox',
    whitelistCommands: ['npm install', 'npm run build', 'npm test'],
    notificationTypes: ['banner', 'sound'], volume: 80,
    soundConfig: { complete: 'default', waiting: 'default', interrupt: 'default' },
  },
  rules: [
    { id: 'rule-header', name: '文件头部规范', content: '所有代码文件必须包含标准文件头注释', scope: 'project', enabled: true },
    { id: 'rule-naming', name: '命名规范', content: '组件使用 PascalCase，变量使用 camelCase', scope: 'project', enabled: true },
  ],
  skills: [
    { id: 'skill-react', name: 'React 组件开发', description: '生成符合项目规范的 React 组件', content: '使用函数组件 + Hooks 模式', scope: 'global', enabled: true },
    { id: 'skill-test', name: '自动测试生成', description: '根据组件自动生成测试用例', content: '使用 Vitest + React Testing Library', scope: 'global', enabled: true },
  ],
  importSettings: { includeAgentsMD: false, includeClaudeMD: false },
};

/* ================================================================
   Singleton Store with useSyncExternalStore
   ================================================================ */

const STORAGE_KEY = 'yyc3-settings-storage';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch { /* ignore */ }
  return defaultSettings;
}

function saveSettings(s: Settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// Internal mutable state
let _settings = loadSettings();
let _searchQuery = '';
let _activeSection = 'account';
const _listeners = new Set<() => void>();

// Cached snapshot — must be referentially stable for useSyncExternalStore
let _snapshot = { settings: _settings, searchQuery: _searchQuery, activeSection: _activeSection };

function emit() {
  // Rebuild the cached snapshot only when something changes
  _snapshot = { settings: _settings, searchQuery: _searchQuery, activeSection: _activeSection };
  _listeners.forEach((l) => l());
}

function getSnapshot() {
  return _snapshot;
}

function subscribe(listener: () => void) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

// Typed updater helpers
function updateSettings(fn: (prev: Settings) => Settings) {
  _settings = fn(_settings);
  saveSettings(_settings);
  emit();
}

/* ================================================================
   Public Hook
   ================================================================ */

export function useSettingsStore() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    settings: snap.settings,
    searchQuery: snap.searchQuery,
    activeSection: snap.activeSection,

    // Setters
    setSearchQuery: (q: string) => { _searchQuery = q; emit(); },
    setActiveSection: (s: string) => { _activeSection = s; emit(); },

    // User Profile
    updateUserProfile: (p: Partial<UserProfile>) => updateSettings((s) => ({
      ...s, userProfile: { ...s.userProfile, ...p },
    })),

    // General
    updateGeneralSettings: (g: Partial<GeneralSettings>) => updateSettings((s) => ({
      ...s, general: { ...s.general, ...g },
    })),

    // Agents
    addAgent: (a: AgentConfig) => updateSettings((s) => ({ ...s, agents: [...s.agents, a] })),
    updateAgent: (id: string, a: Partial<AgentConfig>) => updateSettings((s) => ({
      ...s, agents: s.agents.map((x) => x.id === id ? { ...x, ...a } : x),
    })),
    removeAgent: (id: string) => updateSettings((s) => ({ ...s, agents: s.agents.filter((x) => x.id !== id) })),

    // MCP
    addMCP: (m: MCPConfig) => updateSettings((s) => ({ ...s, mcpConfigs: [...s.mcpConfigs, m] })),
    updateMCP: (id: string, m: Partial<MCPConfig>) => updateSettings((s) => ({
      ...s, mcpConfigs: s.mcpConfigs.map((x) => x.id === id ? { ...x, ...m } : x),
    })),
    removeMCP: (id: string) => updateSettings((s) => ({ ...s, mcpConfigs: s.mcpConfigs.filter((x) => x.id !== id) })),

    // Models
    addModel: (m: ModelConfig) => updateSettings((s) => ({ ...s, models: [...s.models, m] })),
    updateModel: (id: string, m: Partial<ModelConfig>) => updateSettings((s) => ({
      ...s, models: s.models.map((x) => x.id === id ? { ...x, ...m } : x),
    })),
    removeModel: (id: string) => updateSettings((s) => ({ ...s, models: s.models.filter((x) => x.id !== id) })),

    // Context
    updateContextSettings: (c: Partial<ContextSettings>) => updateSettings((s) => ({
      ...s, context: { ...s.context, ...c },
    })),

    // Conversation
    updateConversationSettings: (c: Partial<ConversationSettings>) => updateSettings((s) => ({
      ...s, conversation: { ...s.conversation, ...c },
    })),

    // Rules
    addRule: (r: RuleConfig) => updateSettings((s) => ({ ...s, rules: [...s.rules, r] })),
    updateRule: (id: string, r: Partial<RuleConfig>) => updateSettings((s) => ({
      ...s, rules: s.rules.map((x) => x.id === id ? { ...x, ...r } : x),
    })),
    removeRule: (id: string) => updateSettings((s) => ({ ...s, rules: s.rules.filter((x) => x.id !== id) })),

    // Skills
    addSkill: (sk: SkillConfig) => updateSettings((s) => ({ ...s, skills: [...s.skills, sk] })),
    updateSkill: (id: string, sk: Partial<SkillConfig>) => updateSettings((s) => ({
      ...s, skills: s.skills.map((x) => x.id === id ? { ...x, ...sk } : x),
    })),
    removeSkill: (id: string) => updateSettings((s) => ({ ...s, skills: s.skills.filter((x) => x.id !== id) })),

    // Import
    updateImportSettings: (i: Partial<ImportSettings>) => updateSettings((s) => ({
      ...s, importSettings: { ...s.importSettings, ...i },
    })),

    // Config management
    exportConfig: () => _settings,
    importConfig: (c: Partial<Settings>) => { _settings = { ...defaultSettings, ...c }; saveSettings(_settings); emit(); },
    resetSettings: () => { _settings = defaultSettings; saveSettings(_settings); emit(); },
  };
}