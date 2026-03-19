/**
 * @file useSettingsBridge.ts
 * @description YYC3 设置桥接 Hook — 在 React 生命周期内监听 Settings Store 变化，自动同步到 GlobalAI / AppSettings / MCP / Rules
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,bridge,hook,sync,integration,globalai,mcp
 */

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../components/settings/useSettingsStore';
import { settingsSyncService, SETTINGS_EVENTS } from '../services/settingsSyncService';

/**
 * useSettingsBridge — 放在 App 根级别，实现设置 → 各子系统的联动
 *
 * 功能:
 * 1. 首次挂载时执行全量同步
 * 2. 监听 settings 变化，diff 后按模块增量同步
 * 3. 提供读取注入后的系统提示词的工具函数
 *
 * 用法:
 * ```tsx
 * // 在 App.tsx 中
 * function App() {
 *   useSettingsBridge();
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export function useSettingsBridge() {
  const { settings } = useSettingsStore();
  const prevRef = useRef(settings);
  const initializedRef = useRef(false);

  // 首次挂载 → 全量同步
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      settingsSyncService.syncAll(settings);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 增量同步 — 比较前后差异
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = settings;

    // 跳过首次
    if (!initializedRef.current) return;

    // 模型变更
    if (prev.models !== settings.models) {
      settingsSyncService.syncModels(settings.models);
    }

    // MCP 变更
    if (prev.mcpConfigs !== settings.mcpConfigs) {
      settingsSyncService.syncMCPs(settings.mcpConfigs);
    }

    // 智能体或规则/技能变更 → 需要重新注入
    if (prev.agents !== settings.agents || prev.rules !== settings.rules || prev.skills !== settings.skills) {
      settingsSyncService.syncAgents(settings.agents, settings.rules, settings.skills);
      settingsSyncService.syncRules(settings.rules, settings.skills);
    }

    // 通用设置变更
    if (prev.general !== settings.general) {
      // 主题
      if (prev.general.theme !== settings.general.theme) {
        settingsSyncService.syncTheme(settings.general.theme);
      }
      // 编辑器
      if (
        prev.general.editorFont !== settings.general.editorFont ||
        prev.general.editorFontSize !== settings.general.editorFontSize ||
        prev.general.wordWrap !== settings.general.wordWrap
      ) {
        settingsSyncService.syncEditorSettings(settings.general);
      }
      // 快捷键
      if (
        prev.general.keybindingScheme !== settings.general.keybindingScheme ||
        prev.general.customKeybindings !== settings.general.customKeybindings
      ) {
        settingsSyncService.syncKeybindings(settings.general);
      }
    }

    // 对话流变更
    if (prev.conversation !== settings.conversation) {
      settingsSyncService.syncConversation(settings.conversation);
    }
  }, [settings]);

  return null;
}

/* ================================================================
   MCP 端点运行时动态注入 Hook
   ================================================================ */

/**
 * useMCPEndpoints — 监听 MCP 配置变更，返回当前活跃的 MCP 端点列表
 *
 * 用法:
 * ```tsx
 * const { endpoints, configs } = useMCPEndpoints();
 * // endpoints: ['ws://localhost:3100/mcp/fs', 'ws://localhost:3100/mcp/git']
 * ```
 */
export function useMCPEndpoints() {
  const { settings } = useSettingsStore();
  const activeEndpoints = settings.mcpConfigs
    .filter(c => c.enabled && c.endpoint)
    .map(c => c.endpoint!);

  // 也监听全局事件以获取外部更新
  useEffect(() => {
    const handler = (e: Event) => {
      // 其他模块通过事件通知 MCP 变更时，此 hook 会自动更新
      // 因为 settings store 是单一真相源
    };
    window.addEventListener(SETTINGS_EVENTS.MCP_UPDATED, handler);
    return () => window.removeEventListener(SETTINGS_EVENTS.MCP_UPDATED, handler);
  }, []);

  return {
    endpoints: activeEndpoints,
    configs: settings.mcpConfigs,
    enabledCount: settings.mcpConfigs.filter(c => c.enabled).length,
    totalCount: settings.mcpConfigs.length,
  };
}

/* ================================================================
   AI 系统提示词注入 Hook
   ================================================================ */

/**
 * useAISystemPrompt — 返回注入了规则/技能的完整系统提示词
 *
 * @param agentId - 智能体 ID，不传则返回默认智能体的提示词
 *
 * 用法:
 * ```tsx
 * const { systemPrompt, rulesFragment, skillsFragment } = useAISystemPrompt('agent-default');
 * // systemPrompt 已包含注入的规则和技能内容
 * ```
 */
export function useAISystemPrompt(agentId?: string) {
  const { settings } = useSettingsStore();

  const agent = agentId
    ? settings.agents.find(a => a.id === agentId)
    : settings.agents[0];

  const rulesFragment = settingsSyncService.buildRulesPromptFragment(settings.rules);
  const skillsFragment = settingsSyncService.buildSkillsPromptFragment(settings.skills);

  const systemPrompt = agent
    ? [
        agent.systemPrompt,
        rulesFragment ? `\n\n--- 项目规则 ---\n${rulesFragment}` : '',
        skillsFragment ? `\n\n--- 可用技能 ---\n${skillsFragment}` : '',
      ].join('')
    : '';

  return {
    agent,
    systemPrompt,
    rulesFragment,
    skillsFragment,
    hasRules: settings.rules.some(r => r.enabled),
    hasSkills: settings.skills.some(s => s.enabled),
  };
}