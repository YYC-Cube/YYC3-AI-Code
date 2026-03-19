/**
 * @file useAppSettings.ts
 * @description 跨路由共享的应用设置 Hook — 通过 localStorage 持久化，含预览设置、RBAC 用户身份信息
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.2.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hooks,settings,persistence,rbac,preview
 */

import { useState, useCallback, useEffect } from 'react';
import type { RBACRole, CRDTUserIdentity } from '../store';

/* ================================================================
   Types
   ================================================================ */

export type UITheme = 'classic' | 'liquid-glass' | 'aurora';
export type IndentStyle = '2-spaces' | '4-spaces' | 'tab';
export type UILanguage = 'zh-CN' | 'en-US';

export interface AppSettings {
  /** 界面语言 */
  language: UILanguage;
  /** UI 视觉主题 */
  theme: UITheme;
  /** Monaco 编辑器字体大小 */
  editorFontSize: number;
  /** 缩进方式 */
  indentStyle: IndentStyle;
  /** 自动保存 */
  autoSave: boolean;
  /** 自动保存间隔（秒） */
  autoSaveInterval: number;
  /** 代码小地图 */
  minimap: boolean;
  /** 侧栏默认展开 */
  sidebarOpen: boolean;
  /** 流式 AI 响应 */
  streamingEnabled: boolean;
  /** AI 上下文条数 */
  aiContextLength: number;
  /** 预览：Tailwind CDN 启用 */
  previewTailwind: boolean;
  /** 预览：默认滚动同步 */
  previewScrollSync: boolean;
  /** 预览：防抖延迟(ms) */
  previewDebounceMs: number;
  /** 预览：默认模式 */
  previewMode: 'realtime' | 'manual' | 'delayed' | 'smart';
}

export interface RBACUserState {
  identity: CRDTUserIdentity | null;
  currentRole: RBACRole;
  onlineStatus: 'online' | 'busy' | 'offline';
}

/* ================================================================
   Defaults
   ================================================================ */

const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh-CN',
  theme: 'classic',
  editorFontSize: 12,
  indentStyle: '2-spaces',
  autoSave: true,
  autoSaveInterval: 30,
  minimap: true,
  sidebarOpen: true,
  streamingEnabled: true,
  aiContextLength: 10,
  previewTailwind: true,
  previewScrollSync: true,
  previewDebounceMs: 300,
  previewMode: 'realtime',
};

const STORAGE_KEY = 'yyc3-app-settings';
const RBAC_KEY = 'yyc3-rbac-user';

/* ================================================================
   Persistence
   ================================================================ */

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    // Sync theme to the separate key that DesignerProvider also reads
    localStorage.setItem('yyc3-ui-theme', s.theme);
  } catch { /* quota exceeded */ }
}

function loadRBACUser(): RBACUserState {
  try {
    const raw = localStorage.getItem(RBAC_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    identity: null,
    currentRole: 'editor',
    onlineStatus: 'online',
  };
}

function saveRBACUser(u: RBACUserState) {
  try {
    localStorage.setItem(RBAC_KEY, JSON.stringify(u));
  } catch { /* ignore */ }
}

/* ================================================================
   Hook
   ================================================================ */

export function useAppSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);
  const [rbacUser, setRBACUserState] = useState<RBACUserState>(loadRBACUser);

  // Persist on change
  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => { saveRBACUser(rbacUser); }, [rbacUser]);

  /** Update a single setting key */
  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettingsState(prev => ({ ...prev, [key]: value }));
  }, []);

  /** Replace all settings */
  const setSettings = useCallback((s: AppSettings) => {
    setSettingsState(s);
  }, []);

  /** Reset to defaults */
  const resetSettings = useCallback(() => {
    setSettingsState({ ...DEFAULT_SETTINGS });
  }, []);

  /** Update RBAC user identity */
  const setRBACIdentity = useCallback((identity: CRDTUserIdentity | null) => {
    setRBACUserState(prev => ({ ...prev, identity, currentRole: identity?.role ?? 'editor' }));
  }, []);

  /** Set online status */
  const setOnlineStatus = useCallback((status: 'online' | 'busy' | 'offline') => {
    setRBACUserState(prev => ({ ...prev, onlineStatus: status }));
  }, []);

  /** Set RBAC role */
  const setRole = useCallback((role: RBACRole) => {
    setRBACUserState(prev => ({ ...prev, currentRole: role }));
  }, []);

  return {
    settings,
    updateSetting,
    setSettings,
    resetSettings,
    rbacUser,
    setRBACIdentity,
    setOnlineStatus,
    setRole,
  };
}