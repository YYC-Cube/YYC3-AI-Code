/**
 * @file useGlobalKeybindings.ts
 * @description YYC3 全局快捷键管理 Hook — 监听 Settings Store 的快捷键变更，动态绑定/解绑全局键盘事件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags keybindings,keyboard,shortcuts,global,hook
 */

import { useEffect, useRef } from 'react';
import { SETTINGS_EVENTS, SettingsSyncService, type KeybindingsUpdatedPayload } from '../services/settingsSyncService';

/* ================================================================
   Types
   ================================================================ */

export interface KeybindingAction {
  /** 操作唯一标识（对应 VSCODE_KEYBINDINGS 的 key） */
  id: string;
  /** 执行回调 */
  handler: () => void;
  /** 是否阻止默认行为 */
  preventDefault?: boolean;
  /** 是否仅在特定条件下激活 */
  when?: () => boolean;
}

/* ================================================================
   Keybinding Parser
   ================================================================ */

interface ParsedKey {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
}

/**
 * 将快捷键字符串解析为结构化对象
 * 支持: "Ctrl+S", "Ctrl+Shift+P", "F1", "Shift+Alt+Down", etc.
 */
export function parseKeybinding(binding: string): ParsedKey {
  const parts = binding.split('+').map(p => p.trim().toLowerCase());
  return {
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt') || parts.includes('option'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
    key: parts.filter(p => !['ctrl', 'control', 'shift', 'alt', 'option', 'meta', 'cmd', 'command'].includes(p)).pop() || '',
  };
}

/**
 * 检查 KeyboardEvent 是否匹配已解析的快捷键
 */
export function matchesKeybinding(event: KeyboardEvent, parsed: ParsedKey): boolean {
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

  // 在 Mac 上，Ctrl 映射到 ⌘ (metaKey)
  const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;

  if (parsed.ctrl && !ctrlOrMeta) return false;
  if (!parsed.ctrl && ctrlOrMeta && !parsed.meta) return false;
  if (parsed.shift && !event.shiftKey) return false;
  if (!parsed.shift && event.shiftKey && parsed.key.length > 1) return false; // allow shift for single chars
  if (parsed.alt && !event.altKey) return false;
  if (parsed.meta && !event.metaKey) return false;

  // Key matching
  const eventKey = event.key.toLowerCase();
  const parsedKey = parsed.key.toLowerCase();

  // Special key names
  const keyMap: Record<string, string> = {
    'up': 'arrowup',
    'down': 'arrowdown',
    'left': 'arrowleft',
    'right': 'arrowright',
    'esc': 'escape',
    'del': 'delete',
    'backspace': 'backspace',
    'enter': 'enter',
    'tab': 'tab',
    'space': ' ',
    '`': '`',
    ',': ',',
    '.': '.',
    '/': '/',
    's': 's',
    'z': 'z',
    'f': 'f',
    'h': 'h',
    'p': 'p',
    'k': 'k',
    'b': 'b',
    'n': 'n',
    'w': 'w',
    'v': 'v',
    'a': 'a',
    'c': 'c',
    'x': 'x',
  };

  const normalizedParsed = keyMap[parsedKey] || parsedKey;
  const normalizedEvent = eventKey;

  // F-keys
  if (parsedKey.startsWith('f') && /^f\d+$/.test(parsedKey)) {
    return normalizedEvent === parsedKey;
  }

  return normalizedEvent === normalizedParsed;
}

/* ================================================================
   Hook
   ================================================================ */

/**
 * 全局快捷键管理 Hook
 *
 * @param actions - 需要绑定的操作列表
 *
 * 用法:
 * ```tsx
 * useGlobalKeybindings([
 *   { id: 'save', handler: () => handleSave(), preventDefault: true },
 *   { id: 'aiAssist', handler: () => toggleAI() },
 * ]);
 * ```
 */
export function useGlobalKeybindings(actions: KeybindingAction[]) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const bindingsRef = useRef<Record<string, string>>(
    SettingsSyncService.getResolvedKeybindings()
  );

  // 监听快捷键配置变更事件
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<KeybindingsUpdatedPayload>).detail;
      bindingsRef.current = detail.resolvedBindings;
    };
    window.addEventListener(SETTINGS_EVENTS.KEYBINDINGS_UPDATED, handler);
    return () => window.removeEventListener(SETTINGS_EVENTS.KEYBINDINGS_UPDATED, handler);
  }, []);

  // 全局键盘事件监听
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // 如果焦点在 input/textarea/contenteditable 中，跳过大部分快捷键
      const target = event.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const bindings = bindingsRef.current;
      const currentActions = actionsRef.current;

      for (const action of currentActions) {
        const binding = bindings[action.id];
        if (!binding) continue;

        const parsed = parseKeybinding(binding);
        if (!matchesKeybinding(event, parsed)) continue;

        // 在编辑区域中，只允许带修饰键的快捷键
        if (isEditing && !parsed.ctrl && !parsed.meta && !parsed.alt) continue;

        // 条件检查
        if (action.when && !action.when()) continue;

        // 执行
        if (action.preventDefault !== false) {
          event.preventDefault();
          event.stopPropagation();
        }
        action.handler();
        return; // 第一个匹配的就执行，不继续
      }
    };

    document.addEventListener('keydown', handler, true); // capture phase
    return () => document.removeEventListener('keydown', handler, true);
  }, []);
}

/**
 * 获取快捷键的显示文本（用于 Tooltip）
 */
export function getKeybindingLabel(actionId: string): string {
  const bindings = SettingsSyncService.getResolvedKeybindings();
  const binding = bindings[actionId];
  if (!binding) return '';

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  return binding
    .replace(/Ctrl/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/Shift/gi, isMac ? '⇧' : 'Shift')
    .replace(/Alt/gi, isMac ? '⌥' : 'Alt')
    .replace(/Meta/gi, '⌘')
    .replace(/\+/g, isMac ? '' : '+');
}
