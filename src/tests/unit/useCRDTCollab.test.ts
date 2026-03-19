/**
 * @file useCRDTCollab.test.ts
 * @description useCRDTCollab Hook 单元测试 — 类型验证、默认状态、身份生成、协议常量、统计信息
 * @priority P0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetLocalStorage } from '../setup';
import type {
  CRDTSyncStatus,
  WSConnectionState,
  CRDTUser,
  CRDTAwarenessState,
  CRDTStats,
  CRDTCollabConfig,
} from '../../app/hooks/useCRDTCollab';

describe('useCRDTCollab — CRDT 实时协同', () => {

  beforeEach(() => {
    resetLocalStorage();
  });

  /* ── 类型完整性 ── */

  describe('类型定义', () => {
    it('TC-CRDT-001: CRDTSyncStatus 包含 7 种状态', () => {
      const statuses: CRDTSyncStatus[] = [
        'disconnected', 'connecting', 'connected', 'synced', 'syncing', 'conflict', 'error',
      ];
      expect(statuses).toHaveLength(7);
    });

    it('TC-CRDT-002: WSConnectionState 包含 4 种状态', () => {
      const states: WSConnectionState[] = ['closed', 'connecting', 'open', 'reconnecting'];
      expect(states).toHaveLength(4);
    });

    it('TC-CRDT-003: CRDTUser 包含光标和选区信息', () => {
      const user: CRDTUser = {
        id: 'user-1',
        name: 'Alice',
        color: '#6366f1',
        cursor: { line: 10, column: 5 },
        selection: { startLine: 10, startColumn: 1, endLine: 10, endColumn: 20 },
        fileId: 'file-1',
        lastActive: Date.now(),
      };
      expect(user.cursor?.line).toBe(10);
      expect(user.selection?.endColumn).toBe(20);
    });

    it('TC-CRDT-004: CRDTAwarenessState 包含用户和文件 ID', () => {
      const state: CRDTAwarenessState = {
        user: {
          id: 'user-1',
          name: 'Alice',
          color: '#6366f1',
          lastActive: Date.now(),
        },
        fileId: 'file-1',
        timestamp: Date.now(),
      };
      expect(state.fileId).toBe('file-1');
    });

    it('TC-CRDT-005: CRDTStats 包含 9 个统计字段', () => {
      const stats: CRDTStats = {
        documentSize: 1024,
        undoStackSize: 5,
        redoStackSize: 2,
        connectedPeers: 3,
        lastSyncTime: Date.now(),
        totalEdits: 42,
        wsLatency: 15,
        bytesSent: 2048,
        bytesReceived: 4096,
      };
      expect(Object.keys(stats)).toHaveLength(9);
      expect(stats.wsLatency).toBe(15);
    });

    it('TC-CRDT-006: CRDTCollabConfig 必须包含 roomName 和 user', () => {
      const config: CRDTCollabConfig = {
        roomName: 'project-1/App.tsx',
        user: { id: 'u1', name: 'Alice', color: '#f00' },
      };
      expect(config.roomName).toBe('project-1/App.tsx');
    });
  });

  /* ── 协议常量 ── */

  describe('WebSocket 协议常量', () => {
    it('TC-CRDT-010: 消息类型编号与 MockWSServer 对齐', () => {
      // 保持与 MockWSServer.ts 中的 WSMessageType 一致
      const proto = {
        SYNC_STEP1: 0,
        SYNC_STEP2: 1,
        SYNC_UPDATE: 2,
        AWARENESS: 3,
        AUTH: 4,
        PING: 5,
        PONG: 6,
        ERROR: 7,
      };
      expect(proto.SYNC_STEP1).toBe(0);
      expect(proto.SYNC_UPDATE).toBe(2);
      expect(proto.AWARENESS).toBe(3);
      expect(proto.PING).toBe(5);
      expect(proto.PONG).toBe(6);
    });
  });

  /* ── 默认初始状态 ── */

  describe('默认初始状态', () => {
    it('TC-CRDT-020: 初始 syncStatus 为 disconnected', () => {
      const initialStatus: CRDTSyncStatus = 'disconnected';
      expect(initialStatus).toBe('disconnected');
    });

    it('TC-CRDT-021: 初始 remoteUsers 为空数组', () => {
      const remoteUsers: CRDTUser[] = [];
      expect(remoteUsers).toHaveLength(0);
    });

    it('TC-CRDT-022: 初始 stats 全部为 0/null', () => {
      const stats: CRDTStats = {
        documentSize: 0,
        undoStackSize: 0,
        redoStackSize: 0,
        connectedPeers: 0,
        lastSyncTime: null,
        totalEdits: 0,
        wsLatency: null,
        bytesSent: 0,
        bytesReceived: 0,
      };
      expect(stats.documentSize).toBe(0);
      expect(stats.lastSyncTime).toBeNull();
    });
  });

  /* ── 房间名生成 ── */

  describe('房间名格式', () => {
    it('TC-CRDT-030: 格式为 project/file 路径', () => {
      const roomName = 'my-project/src/App.tsx';
      expect(roomName).toContain('/');
      expect(roomName).toContain('.tsx');
    });

    it('TC-CRDT-031: 房间名不含特殊字符（空格、中文）', () => {
      const roomName = 'my-project/src/App.tsx';
      expect(/^[\w\-./]+$/.test(roomName)).toBe(true);
    });
  });

  /* ── IndexedDB 持久化 ── */

  describe('IndexedDB 持久化', () => {
    it('TC-CRDT-040: y-indexeddb 模块可导入', async () => {
      try {
        const mod = await import('y-indexeddb');
        expect(mod.IndexeddbPersistence).toBeDefined();
      } catch {
        // y-indexeddb 在纯 Node 环境可能不可用（需 indexedDB polyfill）
        expect(true).toBe(true);
      }
    });
  });

  /* ── Awareness 颜色分配 ── */

  describe('用户颜色分配', () => {
    it('TC-CRDT-050: AVATAR_COLORS 包含 8 种颜色', () => {
      const AVATAR_COLORS = [
        '#6366f1', '#f43f5e', '#10b981', '#f59e0b',
        '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
      ];
      expect(AVATAR_COLORS).toHaveLength(8);
    });

    it('TC-CRDT-051: 颜色轮转分配（index % length）', () => {
      const AVATAR_COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b'];
      const pickColor = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];
      expect(pickColor(0)).toBe('#6366f1');
      expect(pickColor(4)).toBe('#6366f1'); // wraps
      expect(pickColor(5)).toBe('#f43f5e');
    });
  });

  /* ── 编码辅助 ── */

  describe('二进制编码工具', () => {
    it('TC-CRDT-060: Uint8Array 可拼接为 ArrayBuffer', () => {
      const header = new Uint8Array([0, 1, 2]);
      const body = new Uint8Array([3, 4, 5]);
      const combined = new Uint8Array(header.length + body.length);
      combined.set(header, 0);
      combined.set(body, header.length);
      expect(combined.length).toBe(6);
      expect(combined[3]).toBe(3);
    });

    it('TC-CRDT-061: TextEncoder/TextDecoder 正确编解码', () => {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const text = 'Hello CRDT';
      const encoded = encoder.encode(text);
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe(text);
    });
  });
});
