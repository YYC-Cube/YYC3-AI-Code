/**
 * @file settings.test.ts
 * @description YYC3 设置模块单元测试 — 覆盖 Settings Store、Sync Service、Keybinding Parser、Rules 注入、搜索功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,settings,sync,keybinding,rules,search
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { searchSettings, type Settings, type RuleConfig, type SkillConfig, type MCPConfig, type ModelConfig } from '../components/settings/useSettingsStore';
import {
  SettingsSyncService,
  SETTINGS_EVENTS,
  VSCODE_KEYBINDINGS,
} from '../services/settingsSyncService';
import {
  parseKeybinding,
  matchesKeybinding,
} from '../hooks/useGlobalKeybindings';

/* ================================================================
   Mock localStorage
   ================================================================ */

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get _store() { return store; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

/* ================================================================
   Mock window.dispatchEvent
   ================================================================ */

const dispatchedEvents: CustomEvent[] = [];
const originalDispatch = globalThis.window?.dispatchEvent;

beforeEach(() => {
  localStorageMock.clear();
  dispatchedEvents.length = 0;
  if (typeof window !== 'undefined') {
    vi.spyOn(window, 'dispatchEvent').mockImplementation((e: Event) => {
      if (e instanceof CustomEvent) dispatchedEvents.push(e);
      return true;
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ================================================================
   Test Data Factory
   ================================================================ */

function createTestSettings(overrides?: Partial<Settings>): Settings {
  return {
    userProfile: { id: 'u1', username: 'Test', email: 'test@yyc3.local', bio: '' },
    general: {
      theme: 'dark', language: 'zh-CN', editorFont: 'Monaco', editorFontSize: 14,
      wordWrap: true, keybindingScheme: 'vscode', customKeybindings: {},
      localLinkOpenMode: 'system', markdownOpenMode: 'editor', nodeVersion: '20.0.0',
    },
    agents: [
      { id: 'a1', name: 'Default', description: '默认助手', systemPrompt: '你是助手', model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 4096, isBuiltIn: true, isCustom: false },
    ],
    mcpConfigs: [
      { id: 'mcp1', name: 'FS MCP', type: 'manual', endpoint: 'ws://localhost:3100/mcp/fs', enabled: true, projectLevel: false },
      { id: 'mcp2', name: 'Git MCP', type: 'market', endpoint: 'ws://localhost:3100/mcp/git', enabled: false, projectLevel: true },
    ],
    models: [
      { id: 'm1', provider: 'OpenAI', model: 'gpt-4o-mini', apiKey: 'sk-test123', enabled: true },
      { id: 'm2', provider: 'Anthropic', model: 'claude-3.5-sonnet', apiKey: '', enabled: false },
    ],
    context: { indexStatus: 'idle', ignoreRules: ['node_modules', '.git'], documentSets: [] },
    conversation: {
      useTodoList: true, autoCollapseNodes: false, autoFixCodeIssues: true,
      agentProactiveQuestion: true, codeReviewScope: 'all', jumpAfterReview: true,
      autoRunMCP: false, commandRunMode: 'sandbox',
      whitelistCommands: ['npm install'], notificationTypes: ['banner'],
      volume: 80, soundConfig: { complete: 'default', waiting: 'default', interrupt: 'default' },
    },
    rules: [
      { id: 'r1', name: '文件头规范', content: '所有文件必须包含文件头', scope: 'project', enabled: true },
      { id: 'r2', name: '禁用规则', content: '这条被禁用了', scope: 'personal', enabled: false },
    ],
    skills: [
      { id: 's1', name: 'React', description: 'React 开发', content: '使用函数组件', scope: 'global', enabled: true },
    ],
    importSettings: { includeAgentsMD: false, includeClaudeMD: false },
    ...overrides,
  };
}

/* ================================================================
   1. searchSettings 测试
   ================================================================ */

describe('searchSettings', () => {
  const settings = createTestSettings();

  it('空查询返回空数组', () => {
    expect(searchSettings(settings, '')).toEqual([]);
    expect(searchSettings(settings, '   ')).toEqual([]);
  });

  it('搜索通用设置关键字', () => {
    const results = searchSettings(settings, 'theme');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].section).toBe('general');
    expect(results[0].title).toContain('Theme');
  });

  it('搜索中文关键字', () => {
    const results = searchSettings(settings, '主题');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('主题');
  });

  it('搜索智能体名称', () => {
    const results = searchSettings(settings, 'default');
    expect(results.some(r => r.type === 'agent')).toBe(true);
  });

  it('搜索智能体描述', () => {
    const results = searchSettings(settings, '助手');
    expect(results.some(r => r.type === 'agent' && r.title === 'Default')).toBe(true);
  });

  it('搜索 MCP 配置', () => {
    const results = searchSettings(settings, 'FS');
    expect(results.some(r => r.type === 'mcp')).toBe(true);
  });

  it('搜索模型配置', () => {
    const results = searchSettings(settings, 'openai');
    expect(results.some(r => r.type === 'model')).toBe(true);
  });

  it('搜索规则', () => {
    const results = searchSettings(settings, '文件头');
    expect(results.some(r => r.type === 'rule')).toBe(true);
  });

  it('搜索技能', () => {
    const results = searchSettings(settings, 'react');
    expect(results.some(r => r.type === 'skill')).toBe(true);
  });

  it('搜索对话流设置', () => {
    const results = searchSettings(settings, 'todo');
    expect(results.some(r => r.section === 'conversation')).toBe(true);
  });

  it('不匹配的查询返回空', () => {
    const results = searchSettings(settings, 'xyznonexistent');
    expect(results).toEqual([]);
  });
});

/* ================================================================
   2. SettingsSyncService 测试
   ================================================================ */

describe('SettingsSyncService', () => {
  let service: SettingsSyncService;

  beforeEach(() => {
    service = new SettingsSyncService();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('syncModels', () => {
    it('同步启用的模型到 localStorage', () => {
      const models: ModelConfig[] = [
        { id: 'm1', provider: 'OpenAI', model: 'gpt-4o-mini', apiKey: 'sk-xxx', enabled: true },
        { id: 'm2', provider: 'Anthropic', model: 'claude-3.5-sonnet', apiKey: '', enabled: false },
      ];
      const result = service.syncModels(models);

      expect(result.enabledModels).toHaveLength(1);
      expect(result.enabledModels[0].id).toBe('m1');
      expect(result.apiKeyMap).toHaveProperty('gpt-4o-mini', 'sk-xxx');

      // 验证 localStorage 写入
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'yyc3-ai-model-keys',
        expect.any(String)
      );
    });

    it('禁用或无 key 的模型不写入 apiKeyMap', () => {
      const models: ModelConfig[] = [
        { id: 'm1', provider: 'OpenAI', model: 'gpt-4o-mini', apiKey: '', enabled: true },
        { id: 'm2', provider: 'Anthropic', model: 'claude', apiKey: 'key', enabled: false },
      ];
      const result = service.syncModels(models);
      expect(Object.keys(result.apiKeyMap)).toHaveLength(0);
    });

    it('触发 MODELS_UPDATED 事件', () => {
      service.syncModels([]);
      expect(dispatchedEvents.some(e => e.type === SETTINGS_EVENTS.MODELS_UPDATED)).toBe(true);
    });
  });

  describe('syncMCPs', () => {
    it('仅返回启用且有端点的 MCP', () => {
      const configs: MCPConfig[] = [
        { id: 'c1', name: 'A', type: 'manual', endpoint: 'ws://a', enabled: true, projectLevel: false },
        { id: 'c2', name: 'B', type: 'manual', endpoint: 'ws://b', enabled: false, projectLevel: false },
        { id: 'c3', name: 'C', type: 'manual', endpoint: undefined, enabled: true, projectLevel: false },
      ];
      const result = service.syncMCPs(configs);
      expect(result.activeEndpoints).toEqual(['ws://a']);
    });

    it('将 MCP 端点写入 localStorage', () => {
      service.syncMCPs([
        { id: 'c1', name: 'A', type: 'manual', endpoint: 'ws://x', enabled: true, projectLevel: false },
      ]);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'yyc3-mcp-endpoints',
        JSON.stringify(['ws://x'])
      );
    });

    it('触发 MCP_UPDATED 事件', () => {
      service.syncMCPs([]);
      expect(dispatchedEvents.some(e => e.type === SETTINGS_EVENTS.MCP_UPDATED)).toBe(true);
    });
  });

  describe('buildRulesPromptFragment / buildSkillsPromptFragment', () => {
    it('仅拼接启用的规则', () => {
      const rules: RuleConfig[] = [
        { id: 'r1', name: '规则A', content: '内容A', scope: 'project', enabled: true },
        { id: 'r2', name: '规则B', content: '内容B', scope: 'personal', enabled: false },
        { id: 'r3', name: '规则C', content: '内容C', scope: 'personal', enabled: true },
      ];
      const fragment = service.buildRulesPromptFragment(rules);
      expect(fragment).toContain('规则A');
      expect(fragment).not.toContain('规则B');
      expect(fragment).toContain('规则C');
      expect(fragment).toContain('[项目]');
      expect(fragment).toContain('[个人]');
    });

    it('空规则返回空字符串', () => {
      expect(service.buildRulesPromptFragment([])).toBe('');
    });

    it('空内容的规则被忽略', () => {
      const rules: RuleConfig[] = [
        { id: 'r1', name: '空规则', content: '  ', scope: 'project', enabled: true },
      ];
      expect(service.buildRulesPromptFragment(rules)).toBe('');
    });

    it('构建技能提示词片段', () => {
      const skills: SkillConfig[] = [
        { id: 's1', name: 'React', description: 'React开发', content: '函数组件', scope: 'global', enabled: true },
      ];
      const fragment = service.buildSkillsPromptFragment(skills);
      expect(fragment).toContain('React');
      expect(fragment).toContain('React开发');
      expect(fragment).toContain('函数组件');
    });
  });

  describe('syncAgents (规则注入)', () => {
    it('将规则和技能注入到智能体系统提示词', () => {
      const agents = [{ id: 'a1', name: 'Test', description: '', systemPrompt: '你是助手', model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 4096, isBuiltIn: true, isCustom: false }];
      const rules: RuleConfig[] = [{ id: 'r1', name: '规则A', content: '规则内容', scope: 'project', enabled: true }];
      const skills: SkillConfig[] = [{ id: 's1', name: '技能A', content: '技能内容', scope: 'global', enabled: true }];

      const result = service.syncAgents(agents, rules, skills);

      expect(result.systemPrompts['a1']).toContain('你是助手');
      expect(result.systemPrompts['a1']).toContain('--- 项目规则 ---');
      expect(result.systemPrompts['a1']).toContain('规则内容');
      expect(result.systemPrompts['a1']).toContain('--- 可用技能 ---');
      expect(result.systemPrompts['a1']).toContain('技能内容');
    });

    it('无规则/技能时不注入额外内容', () => {
      const agents = [{ id: 'a1', name: 'Test', description: '', systemPrompt: '纯净提示词', model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 4096, isBuiltIn: true, isCustom: false }];
      const result = service.syncAgents(agents, [], []);
      expect(result.systemPrompts['a1']).toBe('纯净提示词');
    });
  });

  describe('syncKeybindings', () => {
    it('返回 VS Code 默认快捷键', () => {
      const result = service.syncKeybindings({
        theme: 'dark', language: 'zh-CN', editorFont: 'Monaco', editorFontSize: 14,
        wordWrap: true, keybindingScheme: 'vscode', customKeybindings: {},
        localLinkOpenMode: 'system', markdownOpenMode: 'editor', nodeVersion: '20.0.0',
      });
      expect(result.resolvedBindings.save).toBe('Ctrl+S');
      expect(result.resolvedBindings.undo).toBe('Ctrl+Z');
    });

    it('自定义快捷键覆盖默认值', () => {
      const result = service.syncKeybindings({
        theme: 'dark', language: 'zh-CN', editorFont: 'Monaco', editorFontSize: 14,
        wordWrap: true, keybindingScheme: 'custom',
        customKeybindings: { save: 'Ctrl+Shift+S' },
        localLinkOpenMode: 'system', markdownOpenMode: 'editor', nodeVersion: '20.0.0',
      });
      expect(result.resolvedBindings.save).toBe('Ctrl+Shift+S');
      // 未覆盖的保持默认
      expect(result.resolvedBindings.undo).toBe('Ctrl+Z');
    });
  });

  describe('syncAll', () => {
    it('全量同步后更新时间戳', () => {
      const settings = createTestSettings();
      service.syncAll(settings);
      expect(service.lastSyncTimestamp).toBeGreaterThan(0);
    });

    it('触发 SYNC_ALL_COMPLETE 事件', () => {
      service.syncAll(createTestSettings());
      expect(dispatchedEvents.some(e => e.type === SETTINGS_EVENTS.SYNC_ALL_COMPLETE)).toBe(true);
    });

    it('dispose 后不再触发事件', () => {
      service.dispose();
      const countBefore = dispatchedEvents.length;
      service.syncAll(createTestSettings());
      expect(dispatchedEvents.length).toBe(countBefore);
    });
  });

  describe('静态读取方法', () => {
    it('getActiveMCPEndpoints 从 localStorage 读取', () => {
      localStorageMock.setItem('yyc3-mcp-endpoints', JSON.stringify(['ws://a', 'ws://b']));
      expect(SettingsSyncService.getActiveMCPEndpoints()).toEqual(['ws://a', 'ws://b']);
    });

    it('getResolvedKeybindings 从 localStorage 读取', () => {
      localStorageMock.setItem('yyc3-keybindings', JSON.stringify({ save: 'Ctrl+S' }));
      expect(SettingsSyncService.getResolvedKeybindings()).toEqual({ save: 'Ctrl+S' });
    });

    it('getAgentSystemPrompts 从 localStorage 读取', () => {
      localStorageMock.setItem('yyc3-agent-prompts', JSON.stringify({ a1: 'prompt' }));
      expect(SettingsSyncService.getAgentSystemPrompts()).toEqual({ a1: 'prompt' });
    });

    it('localStorage 损坏时返回安全默认值', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json{');
      expect(SettingsSyncService.getActiveMCPEndpoints()).toEqual([]);
    });
  });
});

/* ================================================================
   3. Keybinding Parser 测试
   ================================================================ */

describe('parseKeybinding', () => {
  it('解析 Ctrl+S', () => {
    const parsed = parseKeybinding('Ctrl+S');
    expect(parsed.ctrl).toBe(true);
    expect(parsed.shift).toBe(false);
    expect(parsed.alt).toBe(false);
    expect(parsed.key).toBe('s');
  });

  it('解析 Ctrl+Shift+P', () => {
    const parsed = parseKeybinding('Ctrl+Shift+P');
    expect(parsed.ctrl).toBe(true);
    expect(parsed.shift).toBe(true);
    expect(parsed.key).toBe('p');
  });

  it('解析 F1', () => {
    const parsed = parseKeybinding('F1');
    expect(parsed.ctrl).toBe(false);
    expect(parsed.shift).toBe(false);
    expect(parsed.key).toBe('f1');
  });

  it('解析 Shift+Alt+Down', () => {
    const parsed = parseKeybinding('Shift+Alt+Down');
    expect(parsed.shift).toBe(true);
    expect(parsed.alt).toBe(true);
    expect(parsed.key).toBe('down');
  });

  it('解析 Ctrl+`', () => {
    const parsed = parseKeybinding('Ctrl+`');
    expect(parsed.ctrl).toBe(true);
    expect(parsed.key).toBe('`');
  });
});

describe('matchesKeybinding', () => {
  function makeEvent(key: string, opts: Partial<KeyboardEvent> = {}): KeyboardEvent {
    return {
      key,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      ...opts,
    } as KeyboardEvent;
  }

  it('匹配 Ctrl+S', () => {
    const parsed = parseKeybinding('Ctrl+S');
    expect(matchesKeybinding(makeEvent('s', { ctrlKey: true }), parsed)).toBe(true);
  });

  it('不匹配缺少修饰键的情况', () => {
    const parsed = parseKeybinding('Ctrl+S');
    expect(matchesKeybinding(makeEvent('s'), parsed)).toBe(false);
  });

  it('匹配 F1', () => {
    const parsed = parseKeybinding('F1');
    expect(matchesKeybinding(makeEvent('f1'), parsed)).toBe(true);
  });

  it('不匹配错误的键', () => {
    const parsed = parseKeybinding('Ctrl+S');
    expect(matchesKeybinding(makeEvent('a', { ctrlKey: true }), parsed)).toBe(false);
  });
});

/* ================================================================
   4. VSCODE_KEYBINDINGS 完整性测试
   ================================================================ */

describe('VSCODE_KEYBINDINGS', () => {
  it('包含所有核心快捷键', () => {
    const requiredKeys = [
      'save', 'undo', 'redo', 'find', 'replace',
      'commandPalette', 'quickOpen', 'globalSearch',
      'toggleSidebar', 'aiAssist', 'settings',
    ];
    for (const key of requiredKeys) {
      expect(VSCODE_KEYBINDINGS).toHaveProperty(key);
      expect(typeof VSCODE_KEYBINDINGS[key]).toBe('string');
    }
  });

  it('所有快捷键都是有效格式', () => {
    for (const [, binding] of Object.entries(VSCODE_KEYBINDINGS)) {
      const parsed = parseKeybinding(binding);
      // 必须有一个实际的 key
      expect(parsed.key.length).toBeGreaterThan(0);
    }
  });
});

/* ================================================================
   5. 主题解析测试
   ================================================================ */

describe('syncTheme', () => {
  it('dark 主题直接解析', () => {
    const service = new SettingsSyncService();
    const result = service.syncTheme('dark');
    expect(result.resolvedTheme).toBe('dark');
    service.dispose();
  });

  it('light 主题直接解析', () => {
    const service = new SettingsSyncService();
    const result = service.syncTheme('light');
    expect(result.resolvedTheme).toBe('light');
    service.dispose();
  });
});

/* ================================================================
   6. 编辑器设置同步测试
   ================================================================ */

describe('syncEditorSettings', () => {
  it('将字体大小写入 useAppSettings 的 localStorage', () => {
    const service = new SettingsSyncService();
    // Pre-populate appSettings
    localStorageMock.setItem('yyc3-app-settings', JSON.stringify({ editorFontSize: 12 }));

    service.syncEditorSettings({
      theme: 'dark', language: 'zh-CN', editorFont: 'JetBrains Mono', editorFontSize: 16,
      wordWrap: false, keybindingScheme: 'vscode', customKeybindings: {},
      localLinkOpenMode: 'system', markdownOpenMode: 'editor', nodeVersion: '20.0.0',
    });

    // 验证 localStorage 中 editorFontSize 更新为 16
    const calls = localStorageMock.setItem.mock.calls;
    const appSettingsCall = [...calls].reverse().find((c: any[]) => c[0] === 'yyc3-app-settings');
    expect(appSettingsCall).toBeDefined();
    const saved = JSON.parse(appSettingsCall![1]);
    expect(saved.editorFontSize).toBe(16);

    service.dispose();
  });
});

/* ================================================================
   7. 对话流设置同步测试
   ================================================================ */

describe('syncConversation', () => {
  it('将对话流设置写入 localStorage', () => {
    const service = new SettingsSyncService();
    const conversation = createTestSettings().conversation;
    service.syncConversation(conversation);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'yyc3-conversation-settings',
      expect.any(String)
    );
    service.dispose();
  });
});

/* ================================================================
   8. 事件名常量完整性测试
   ================================================================ */

describe('SETTINGS_EVENTS', () => {
  it('所有事件名以 yyc3:settings: 为前缀', () => {
    for (const [, value] of Object.entries(SETTINGS_EVENTS)) {
      expect(value).toMatch(/^yyc3:settings:/);
    }
  });

  it('事件名唯一', () => {
    const values = Object.values(SETTINGS_EVENTS);
    expect(new Set(values).size).toBe(values.length);
  });
});