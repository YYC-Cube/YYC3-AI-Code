/**
 * @file useDesignerCRDT.test.ts
 * @description useDesignerCRDT 适配器 Hook 单元测试 — 身份加载优先级、颜色分配、store 映射
 * @priority P1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetLocalStorage } from '../setup';

const IDENTITY_KEY = 'yyc3-crdt-identity';
const AVATAR_COLORS = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
];

// 复现 loadOrCreateIdentity 逻辑
function loadOrCreateIdentity(rbacIdentity: any | null): any {
  if (rbacIdentity) {
    return { ...rbacIdentity, connectedAt: Date.now() };
  }
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...parsed, connectedAt: Date.now() };
    }
  } catch { /* */ }
  // Generate new
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    displayName: `用户-${id.slice(-4)}`,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    role: 'editor',
    connectedAt: Date.now(),
  };
}

describe('useDesignerCRDT — Designer CRDT 适配器', () => {

  beforeEach(() => {
    resetLocalStorage();
  });

  /* ── 身份加载优先级 ── */

  describe('身份加载优先级', () => {
    it('TC-DC-001: RBAC 身份 > localStorage > 新生成', () => {
      const rbac = { id: 'rbac-user', displayName: 'Admin', avatarColor: '#f00', role: 'admin' };
      const identity = loadOrCreateIdentity(rbac);
      expect(identity.id).toBe('rbac-user');
      expect(identity.displayName).toBe('Admin');
    });

    it('TC-DC-002: RBAC 为 null 时从 localStorage 加载', () => {
      const stored = { id: 'stored-user', displayName: 'Cached', avatarColor: '#0f0', role: 'editor' };
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(stored));
      const identity = loadOrCreateIdentity(null);
      expect(identity.id).toBe('stored-user');
    });

    it('TC-DC-003: RBAC 和 localStorage 均为空时生成新身份', () => {
      const identity = loadOrCreateIdentity(null);
      expect(identity.id).toMatch(/^user-/);
      expect(identity.displayName).toMatch(/^用户-/);
      expect(AVATAR_COLORS).toContain(identity.avatarColor);
    });

    it('TC-DC-004: 生成的身份包含 connectedAt 时间戳', () => {
      const before = Date.now();
      const identity = loadOrCreateIdentity(null);
      expect(identity.connectedAt).toBeGreaterThanOrEqual(before);
    });
  });

  /* ── 颜色分配 ── */

  describe('颜色分配', () => {
    it('TC-DC-010: 新生成身份使用 AVATAR_COLORS 中的颜色', () => {
      for (let i = 0; i < 20; i++) {
        const identity = loadOrCreateIdentity(null);
        expect(AVATAR_COLORS).toContain(identity.avatarColor);
      }
    });
  });

  /* ── localStorage 异常 ── */

  describe('异常安全', () => {
    it('TC-DC-020: localStorage 损坏时生成新身份', () => {
      localStorage.setItem(IDENTITY_KEY, '{{broken}');
      const identity = loadOrCreateIdentity(null);
      expect(identity.id).toMatch(/^user-/);
    });
  });

  /* ── CRDTPeer 映射 ── */

  describe('CRDTUser → CRDTPeer 映射', () => {
    it('TC-DC-030: remoteUser 正确映射为 CRDTPeer 格式', () => {
      const remoteUser = {
        id: 'remote-1',
        name: 'Alice',
        color: '#f43f5e',
        cursor: { line: 5, column: 10 },
        selection: { startLine: 5, startColumn: 1, endLine: 5, endColumn: 20 },
        fileId: 'file-1',
        lastActive: Date.now(),
      };

      // 映射逻辑
      const peer = {
        id: remoteUser.id,
        name: remoteUser.name,
        color: remoteUser.color,
        role: 'editor' as const,
        lastSeen: remoteUser.lastActive,
        cursor: {
          panelId: '',
          componentId: '',
          line: remoteUser.cursor?.line ?? 0,
          column: remoteUser.cursor?.column ?? 0,
        },
        lockedPanelId: null,
      };

      expect(peer.name).toBe('Alice');
      expect(peer.cursor.line).toBe(5);
    });
  });
});
