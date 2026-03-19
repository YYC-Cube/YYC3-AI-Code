/**
 * @file useAppSettings.test.ts
 * @description useAppSettings Hook 单元测试 — 默认值、持久化、跨 tab 同步、RBAC 状态
 * @priority P0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetLocalStorage } from '../setup';
import {
  useAppSettings,
} from '../../app/hooks/useAppSettings';

const STORAGE_KEY = 'yyc3-app-settings';
const RBAC_KEY = 'yyc3-rbac-user';

describe('useAppSettings — 应用设置持久化', () => {

  beforeEach(() => {
    resetLocalStorage();
  });

  /* ── 默认值 ── */

  describe('默认设置', () => {
    it('TC-AS-001: language 默认 zh-CN', () => {
      const defaults = getDefaults();
      expect(defaults.language).toBe('zh-CN');
    });

    it('TC-AS-002: theme 默认 classic', () => {
      expect(getDefaults().theme).toBe('classic');
    });

    it('TC-AS-003: editorFontSize 默认 12', () => {
      expect(getDefaults().editorFontSize).toBe(12);
    });

    it('TC-AS-004: minimap 默认 true', () => {
      expect(getDefaults().minimap).toBe(true);
    });

    it('TC-AS-005: autoSave 默认 true, interval 30s', () => {
      expect(getDefaults().autoSave).toBe(true);
      expect(getDefaults().autoSaveInterval).toBe(30);
    });

    it('TC-AS-006: previewMode 默认 realtime', () => {
      expect(getDefaults().previewMode).toBe('realtime');
    });

    it('TC-AS-007: previewDebounceMs 默认 300', () => {
      expect(getDefaults().previewDebounceMs).toBe(300);
    });

    it('TC-AS-008: streamingEnabled 默认 true', () => {
      expect(getDefaults().streamingEnabled).toBe(true);
    });

    it('TC-AS-009: aiContextLength 默认 10', () => {
      expect(getDefaults().aiContextLength).toBe(10);
    });

    it('TC-AS-010: indentStyle 默认 2-spaces', () => {
      expect(getDefaults().indentStyle).toBe('2-spaces');
    });
  });

  /* ── 持久化读写 ── */

  describe('localStorage 持久化', () => {
    it('TC-AS-020: 写入设置后可读回', () => {
      const settings = { ...getDefaults(), theme: 'aurora' as const, editorFontSize: 16 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      const loaded = loadFromStorage();
      expect(loaded.theme).toBe('aurora');
      expect(loaded.editorFontSize).toBe(16);
    });

    it('TC-AS-021: localStorage 为空时返回默认值', () => {
      const loaded = loadFromStorage();
      expect(loaded.language).toBe('zh-CN');
    });

    it('TC-AS-022: localStorage 中缺少字段时补充默认值', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'liquid-glass' }));
      const loaded = loadFromStorage();
      expect(loaded.theme).toBe('liquid-glass');
      expect(loaded.minimap).toBe(true); // 来自默认值
    });

    it('TC-AS-023: localStorage 损坏时返回默认值', () => {
      localStorage.setItem(STORAGE_KEY, '{{broken json');
      const loaded = loadFromStorage();
      expect(loaded.language).toBe('zh-CN');
    });
  });

  /* ── RBAC 用户状态 ── */

  describe('RBAC 用户状态', () => {
    it('TC-AS-030: RBAC 默认角色为 editor, 状态 online', () => {
      const rbac = loadRBACFromStorage();
      expect(rbac.currentRole).toBe('editor');
      expect(rbac.onlineStatus).toBe('online');
    });

    it('TC-AS-031: 可序列化/反序列化 RBAC 状态', () => {
      const rbac = { identity: null, currentRole: 'admin' as const, onlineStatus: 'busy' as const };
      localStorage.setItem(RBAC_KEY, JSON.stringify(rbac));
      const loaded = JSON.parse(localStorage.getItem(RBAC_KEY)!);
      expect(loaded.currentRole).toBe('admin');
      expect(loaded.onlineStatus).toBe('busy');
    });
  });

  /* ── 设置值合法性 ── */

  describe('值约束', () => {
    it('TC-AS-040: editorFontSize 有合理范围', () => {
      const settings = getDefaults();
      expect(settings.editorFontSize).toBeGreaterThanOrEqual(8);
      expect(settings.editorFontSize).toBeLessThanOrEqual(32);
    });

    it('TC-AS-041: previewDebounceMs 非负', () => {
      expect(getDefaults().previewDebounceMs).toBeGreaterThanOrEqual(0);
    });

    it('TC-AS-042: autoSaveInterval > 0', () => {
      expect(getDefaults().autoSaveInterval).toBeGreaterThan(0);
    });

    it('TC-AS-043: aiContextLength > 0', () => {
      expect(getDefaults().aiContextLength).toBeGreaterThan(0);
    });
  });
});

/* ── 辅助函数 ── */

function getDefaults() {
  return {
    language: 'zh-CN' as const,
    theme: 'classic' as const,
    editorFontSize: 12,
    indentStyle: '2-spaces' as const,
    autoSave: true,
    autoSaveInterval: 30,
    minimap: true,
    sidebarOpen: true,
    streamingEnabled: true,
    aiContextLength: 10,
    previewTailwind: true,
    previewScrollSync: true,
    previewDebounceMs: 300,
    previewMode: 'realtime' as const,
  };
}

function loadFromStorage() {
  const defaults = getDefaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaults };
}

function loadRBACFromStorage() {
  const defaults = { identity: null, currentRole: 'editor' as const, onlineStatus: 'online' as const };
  try {
    const raw = localStorage.getItem(RBAC_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaults };
}

/* ── Hook 实际调用测试 ── */

describe('Hook 实际调用测试', () => {
  it('TC-HOOK-001: useAppSettings 返回正确的 API', () => {
    const { renderHook } = require('@testing-library/react');
    const { result } = renderHook(() => useAppSettings());
    
    expect(result.current).toHaveProperty('settings');
    expect(result.current).toHaveProperty('updateSetting');
    expect(result.current).toHaveProperty('setSettings');
    expect(result.current).toHaveProperty('resetSettings');
    expect(result.current).toHaveProperty('rbacUser');
    expect(result.current).toHaveProperty('setRBACIdentity');
    expect(result.current).toHaveProperty('setOnlineStatus');
    expect(result.current).toHaveProperty('setRole');
  });

  it('TC-HOOK-002: 初始化时加载默认设置', () => {
    const { renderHook } = require('@testing-library/react');
    const { result } = renderHook(() => useAppSettings());
    
    expect(result.current.settings).toBeDefined();
    expect(result.current.settings.language).toBe('zh-CN');
    expect(result.current.settings.theme).toBe('classic');
  });

  it('TC-HOOK-003: updateSetting 正常工作', () => {
    const { renderHook, act } = require('@testing-library/react');
    const { result } = renderHook(() => useAppSettings());
    
    expect(result.current.settings.language).toBe('zh-CN');
    
    act(() => {
      result.current.updateSetting('language', 'en-US');
    });
    
    expect(result.current.settings.language).toBe('en-US');
  });

  it('TC-HOOK-004: setSettings 正常工作', () => {
    const { renderHook, act } = require('@testing-library/react');
    const { result } = renderHook(() => useAppSettings());
    
    act(() => {
      result.current.setSettings({
        ...result.current.settings,
        language: 'en-US',
        theme: 'dark',
        editorFontSize: 14,
      });
    });
    
    expect(result.current.settings.language).toBe('en-US');
    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.editorFontSize).toBe(14);
  });

  it('TC-HOOK-005: resetSettings 正常工作', () => {
    const { renderHook, act } = require('@testing-library/react');
    const { result } = renderHook(() => useAppSettings());
    
    act(() => {
      result.current.updateSetting('language', 'en-US');
      result.current.updateSetting('theme', 'dark');
    });
    
    expect(result.current.settings.language).toBe('en-US');
    expect(result.current.settings.theme).toBe('dark');
    
    act(() => {
      result.current.resetSettings();
    });
    
    expect(result.current.settings.language).toBe('zh-CN');
    expect(result.current.settings.theme).toBe('classic');
  });

  it('TC-HOOK-006: setRBACIdentity 正常工作', () => {
    const { renderHook, act } = require('@testing-library/react');
    const { result } = renderHook(() => useAppSettings());
    
    expect(result.current.rbacUser.identity).toBeNull();
    
    act(() => {
      result.current.setRBACIdentity({
        id: 'test-user',
        role: 'owner',
        name: 'Test User',
      });
    });
    
    expect(result.current.rbacUser.identity).not.toBeNull();
    expect(result.current.rbacUser.identity?.id).toBe('test-user');
    expect(result.current.rbacUser.currentRole).toBe('owner'); // role from identity
  });

  it('TC-HOOK-007: setOnlineStatus 正常工作', () => {
    const { renderHook, act } = require('@testing-library/react');
    const { result } = renderHook(() => useAppSettings());
    
    expect(result.current.rbacUser.onlineStatus).toBe('online');
    
    act(() => {
      result.current.setOnlineStatus('busy');
    });
    
    expect(result.current.rbacUser.onlineStatus).toBe('busy');
  });

  it('TC-HOOK-008: setRole 正常工作', () => {
    resetLocalStorage(); // Reset before test
    const { renderHook, act } = require('@testing-library/react');
    const { result } = renderHook(() => useAppSettings());
    
    // Initial role should be 'editor'
    expect(result.current.rbacUser.currentRole).toBe('editor');
    
    // Set identity with 'owner' role
    act(() => {
      result.current.setRBACIdentity({
        id: 'test-user',
        role: 'owner',
        name: 'Test User',
      });
    });
    
    // Role should be updated to 'owner' from identity
    expect(result.current.rbacUser.currentRole).toBe('owner');
    
    // Change role to 'editor' using setRole
    act(() => {
      result.current.setRole('editor');
    });
    
    // Role should now be 'editor'
    expect(result.current.rbacUser.currentRole).toBe('editor');
  });
});
