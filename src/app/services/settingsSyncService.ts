/**
 * @file settingsSyncService.ts
 * @description YYC3 设置同步服务 — 将 Settings Store 与 GlobalAI Context、useAppSettings、MCP、快捷键、规则注入等做数据联动
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,sync,service,integration,bridge,mcp,keybinding,rules
 */

import type {
  Settings, ModelConfig, MCPConfig, AgentConfig,
  GeneralSettings, ConversationSettings, RuleConfig, SkillConfig,
} from '../components/settings/useSettingsStore';

/* ================================================================
   Custom Event Types — 全局事件总线
   ================================================================ */

/** 事件名常量 */
export const SETTINGS_EVENTS = {
  /** 模型配置变更 */
  MODELS_UPDATED: 'yyc3:settings:models-updated',
  /** MCP 配置变更 */
  MCP_UPDATED: 'yyc3:settings:mcp-updated',
  /** 智能体配置变更 */
  AGENTS_UPDATED: 'yyc3:settings:agents-updated',
  /** 快捷键变更 */
  KEYBINDINGS_UPDATED: 'yyc3:settings:keybindings-updated',
  /** 规则/技能变更 — 需注入 AI 系统提示词 */
  RULES_UPDATED: 'yyc3:settings:rules-updated',
  /** 主题变更 */
  THEME_UPDATED: 'yyc3:settings:theme-updated',
  /** 编辑器字体/大小变更 */
  EDITOR_UPDATED: 'yyc3:settings:editor-updated',
  /** 对话流设置变更 */
  CONVERSATION_UPDATED: 'yyc3:settings:conversation-updated',
  /** 全量同步完成 */
  SYNC_ALL_COMPLETE: 'yyc3:settings:sync-all-complete',
} as const;

/* ================================================================
   Event Payload Types
   ================================================================ */

export interface ModelsUpdatedPayload {
  models: ModelConfig[];
  /** 映射 model id → API key，用于 GlobalAI setApiKeys */
  apiKeyMap: Record<string, string>;
  /** 启用的模型列表 */
  enabledModels: ModelConfig[];
}

export interface MCPUpdatedPayload {
  configs: MCPConfig[];
  /** 启用的 MCP 端点 URL 列表 */
  activeEndpoints: string[];
}

export interface AgentsUpdatedPayload {
  agents: AgentConfig[];
  /** 构建完成的系统提示词（含注入的规则和技能） */
  systemPrompts: Record<string, string>;
}

export interface KeybindingsUpdatedPayload {
  scheme: 'vscode' | 'custom';
  customKeybindings: Record<string, string>;
  /** 合并后的完整快捷键映射 */
  resolvedBindings: Record<string, string>;
}

export interface RulesUpdatedPayload {
  rules: RuleConfig[];
  skills: SkillConfig[];
  /** 启用的规则拼接成的系统提示词片段 */
  rulesPromptFragment: string;
  /** 启用的技能拼接成的系统提示词片段 */
  skillsPromptFragment: string;
}

export interface ThemeUpdatedPayload {
  theme: 'light' | 'dark' | 'auto';
  /** 实际解析后的主题（auto → 实际值） */
  resolvedTheme: 'light' | 'dark';
}

export interface EditorUpdatedPayload {
  font: string;
  fontSize: number;
  wordWrap: boolean;
}

export interface ConversationUpdatedPayload {
  conversation: ConversationSettings;
}

/* ================================================================
   VS Code 默认快捷键方案
   ================================================================ */

const VSCODE_KEYBINDINGS: Record<string, string> = {
  'save': 'Ctrl+S',
  'undo': 'Ctrl+Z',
  'redo': 'Ctrl+Shift+Z',
  'find': 'Ctrl+F',
  'replace': 'Ctrl+H',
  'commandPalette': 'Ctrl+Shift+P',
  'quickOpen': 'Ctrl+P',
  'globalSearch': 'Ctrl+K',
  'toggleSidebar': 'Ctrl+B',
  'toggleTerminal': 'Ctrl+`',
  'newFile': 'Ctrl+N',
  'closeTab': 'Ctrl+W',
  'settings': 'Ctrl+,',
  'aiAssist': 'F1',
  'preview': 'Ctrl+Shift+V',
  'formatCode': 'Shift+Alt+F',
  'duplicateLine': 'Shift+Alt+Down',
  'deleteLine': 'Ctrl+Shift+K',
  'toggleComment': 'Ctrl+/',
  'selectAll': 'Ctrl+A',
  'copy': 'Ctrl+C',
  'cut': 'Ctrl+X',
  'paste': 'Ctrl+V',
  'notifications': 'Ctrl+Shift+N',
};

/* ================================================================
   SettingsSyncService — 核心同步服务
   ================================================================ */

export class SettingsSyncService {
  private _disposed = false;
  private _lastSyncTimestamp = 0;

  /* ── 模型同步 → GlobalAI Context ── */

  syncModels(models: ModelConfig[]): ModelsUpdatedPayload {
    const enabledModels = models.filter(m => m.enabled);
    const apiKeyMap: Record<string, string> = {};

    for (const m of enabledModels) {
      if (m.apiKey) {
        // 映射 Settings model ID → GlobalAI model ID
        const globalId = this.resolveGlobalModelId(m);
        apiKeyMap[globalId] = m.apiKey;
      }
    }

    // 同步到 localStorage（GlobalAI 从 localStorage 读取）
    try {
      const existingKeys = JSON.parse(localStorage.getItem('yyc3-ai-model-keys') || '{}');
      const mergedKeys = { ...existingKeys, ...apiKeyMap };
      localStorage.setItem('yyc3-ai-model-keys', JSON.stringify(mergedKeys));
    } catch { /* ignore */ }

    const payload: ModelsUpdatedPayload = { models, apiKeyMap, enabledModels };
    this.dispatch(SETTINGS_EVENTS.MODELS_UPDATED, payload);
    return payload;
  }

  /** 将 Settings ModelConfig 的 provider+model 解析为 GlobalAI 的 model ID */
  private resolveGlobalModelId(m: ModelConfig): string {
    const mapping: Record<string, string> = {
      'OpenAI:gpt-4o-mini': 'gpt-4o-mini',
      'OpenAI:gpt-4o': 'gpt-4o-mini', // fallback
      'Anthropic:claude-3.5-sonnet': 'deepseek-v3', // mapped to custom
      '智谱 AI:glm-4-flash': 'glm-4.5',
      'Ollama:ollama': 'local-ollama',
    };
    return mapping[`${m.provider}:${m.model}`] || m.model.toLowerCase().replace(/\s+/g, '-');
  }

  /* ── MCP 端点运行时注入 ── */

  syncMCPs(configs: MCPConfig[]): MCPUpdatedPayload {
    const activeEndpoints = configs
      .filter(c => c.enabled && c.endpoint)
      .map(c => c.endpoint!);

    // 保存到 localStorage 供 CRDT collab 和其他模块读取
    try {
      localStorage.setItem('yyc3-mcp-endpoints', JSON.stringify(activeEndpoints));
      localStorage.setItem('yyc3-mcp-configs', JSON.stringify(configs));
    } catch { /* ignore */ }

    const payload: MCPUpdatedPayload = { configs, activeEndpoints };
    this.dispatch(SETTINGS_EVENTS.MCP_UPDATED, payload);
    return payload;
  }

  /* ── 智能体同步（含规则注入） ── */

  syncAgents(agents: AgentConfig[], rules: RuleConfig[], skills: SkillConfig[]): AgentsUpdatedPayload {
    const rulesFragment = this.buildRulesPromptFragment(rules);
    const skillsFragment = this.buildSkillsPromptFragment(skills);

    const systemPrompts: Record<string, string> = {};
    for (const agent of agents) {
      // 将启用的规则和技能注入到每个智能体的系统提示词尾部
      systemPrompts[agent.id] = [
        agent.systemPrompt,
        rulesFragment ? `\n\n--- 项目规则 ---\n${rulesFragment}` : '',
        skillsFragment ? `\n\n--- 可用技能 ---\n${skillsFragment}` : '',
      ].join('');
    }

    // 保存到 localStorage 供 AI Chat 面板读取
    try {
      localStorage.setItem('yyc3-agent-prompts', JSON.stringify(systemPrompts));
      localStorage.setItem('yyc3-agents', JSON.stringify(agents));
    } catch { /* ignore */ }

    const payload: AgentsUpdatedPayload = { agents, systemPrompts };
    this.dispatch(SETTINGS_EVENTS.AGENTS_UPDATED, payload);
    return payload;
  }

  /* ── 规则内容注入到 AI 系统提示词 ── */

  buildRulesPromptFragment(rules: RuleConfig[]): string {
    const enabled = rules.filter(r => r.enabled && r.content.trim());
    if (enabled.length === 0) return '';
    return enabled
      .map((r, i) => `${i + 1}. [${r.scope === 'project' ? '项目' : '个人'}] ${r.name}: ${r.content}`)
      .join('\n');
  }

  buildSkillsPromptFragment(skills: SkillConfig[]): string {
    const enabled = skills.filter(s => s.enabled && s.content.trim());
    if (enabled.length === 0) return '';
    return enabled
      .map((s, i) => `${i + 1}. ${s.name}${s.description ? ` (${s.description})` : ''}: ${s.content}`)
      .join('\n');
  }

  /* ── 快捷键全局映射 ── */

  syncKeybindings(general: GeneralSettings): KeybindingsUpdatedPayload {
    const base = general.keybindingScheme === 'vscode'
      ? { ...VSCODE_KEYBINDINGS }
      : { ...VSCODE_KEYBINDINGS }; // custom 也先从 vscode 基础上叠加

    const resolved = { ...base, ...general.customKeybindings };

    // 保存到 localStorage
    try {
      localStorage.setItem('yyc3-keybindings', JSON.stringify(resolved));
      localStorage.setItem('yyc3-keybinding-scheme', general.keybindingScheme);
    } catch { /* ignore */ }

    const payload: KeybindingsUpdatedPayload = {
      scheme: general.keybindingScheme,
      customKeybindings: general.customKeybindings,
      resolvedBindings: resolved,
    };
    this.dispatch(SETTINGS_EVENTS.KEYBINDINGS_UPDATED, payload);
    return payload;
  }

  /* ── 规则/技能变更事件 ── */

  syncRules(rules: RuleConfig[], skills: SkillConfig[]): RulesUpdatedPayload {
    const rulesPromptFragment = this.buildRulesPromptFragment(rules);
    const skillsPromptFragment = this.buildSkillsPromptFragment(skills);

    try {
      localStorage.setItem('yyc3-rules-prompt', rulesPromptFragment);
      localStorage.setItem('yyc3-skills-prompt', skillsPromptFragment);
    } catch { /* ignore */ }

    const payload: RulesUpdatedPayload = { rules, skills, rulesPromptFragment, skillsPromptFragment };
    this.dispatch(SETTINGS_EVENTS.RULES_UPDATED, payload);
    return payload;
  }

  /* ── 主题同步 → useAppSettings ── */

  syncTheme(theme: Settings['general']['theme']): ThemeUpdatedPayload {
    const resolvedTheme: 'light' | 'dark' = theme === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    // 同步到 useAppSettings 的 localStorage key
    try {
      JSON.parse(localStorage.getItem('yyc3-app-settings') || '{}');
      // map Settings theme to useAppSettings UITheme
      // useAppSettings uses 'classic' | 'liquid-glass' | 'aurora' — we keep existing
      // but sync the document-level dark/light mode
      localStorage.setItem('yyc3-resolved-theme', resolvedTheme);
      document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
      document.documentElement.classList.toggle('light', resolvedTheme === 'light');
    } catch { /* ignore */ }

    const payload: ThemeUpdatedPayload = { theme, resolvedTheme };
    this.dispatch(SETTINGS_EVENTS.THEME_UPDATED, payload);
    return payload;
  }

  /* ── 编辑器设置同步 → useAppSettings ── */

  syncEditorSettings(general: GeneralSettings): EditorUpdatedPayload {
    // 同步字体大小到 useAppSettings
    try {
      const appSettings = JSON.parse(localStorage.getItem('yyc3-app-settings') || '{}');
      appSettings.editorFontSize = general.editorFontSize;
      localStorage.setItem('yyc3-app-settings', JSON.stringify(appSettings));
    } catch { /* ignore */ }

    const payload: EditorUpdatedPayload = {
      font: general.editorFont,
      fontSize: general.editorFontSize,
      wordWrap: general.wordWrap,
    };
    this.dispatch(SETTINGS_EVENTS.EDITOR_UPDATED, payload);
    return payload;
  }

  /* ── 对话流同步 ── */

  syncConversation(conversation: ConversationSettings): ConversationUpdatedPayload {
    try {
      localStorage.setItem('yyc3-conversation-settings', JSON.stringify(conversation));
    } catch { /* ignore */ }

    const payload: ConversationUpdatedPayload = { conversation };
    this.dispatch(SETTINGS_EVENTS.CONVERSATION_UPDATED, payload);
    return payload;
  }

  /* ── 全量同步 ── */

  syncAll(settings: Settings): void {
    if (this._disposed) return;

    this.syncModels(settings.models);
    this.syncMCPs(settings.mcpConfigs);
    this.syncAgents(settings.agents, settings.rules, settings.skills);
    this.syncKeybindings(settings.general);
    this.syncRules(settings.rules, settings.skills);
    this.syncTheme(settings.general.theme);
    this.syncEditorSettings(settings.general);
    this.syncConversation(settings.conversation);

    this._lastSyncTimestamp = Date.now();
    this.dispatch(SETTINGS_EVENTS.SYNC_ALL_COMPLETE, { timestamp: this._lastSyncTimestamp });
  }

  /* ── 读取运行时 MCP 端点（供其他模块调用） ── */

  static getActiveMCPEndpoints(): string[] {
    try {
      return JSON.parse(localStorage.getItem('yyc3-mcp-endpoints') || '[]');
    } catch { return []; }
  }

  /** 读取解析后的快捷键映射 */
  static getResolvedKeybindings(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem('yyc3-keybindings') || '{}');
    } catch { return { ...VSCODE_KEYBINDINGS }; }
  }

  /** 读取注入规则后的智能体系统提示词 */
  static getAgentSystemPrompts(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem('yyc3-agent-prompts') || '{}');
    } catch { return {}; }
  }

  /** 读取规则提示词片段 */
  static getRulesPromptFragment(): string {
    try { return localStorage.getItem('yyc3-rules-prompt') || ''; } catch { return ''; }
  }

  /** 读取技能提示词片段 */
  static getSkillsPromptFragment(): string {
    try { return localStorage.getItem('yyc3-skills-prompt') || ''; } catch { return ''; }
  }

  get lastSyncTimestamp(): number { return this._lastSyncTimestamp; }

  /* ── 内部 ── */

  private dispatch(eventName: string, detail: any) {
    if (this._disposed) return;
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch { /* SSR guard */ }
  }

  dispose() {
    this._disposed = true;
  }
}

/** 全局单例 */
export const settingsSyncService = new SettingsSyncService();

/** 导出默认快捷键供测试 */
export { VSCODE_KEYBINDINGS };
