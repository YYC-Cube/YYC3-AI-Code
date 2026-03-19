/**
 * @file config.test.ts
 * @description config.ts 单元测试 — 环境变量读取、配置默认值、端点列表生成、类型安全
 * @priority P0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 注意：config.ts 使用 import.meta.env，测试时需要通过 vitest 的 env 配置注入
// 这里我们直接测试导出值的正确性

describe('config.ts — 全局配置中心', () => {

  describe('API_CONFIG', () => {
    it('TC-CFG-001: 默认包含 3 个端点（一主二备）', async () => {
      const { API_CONFIG } = await import('../../app/config');
      expect(API_CONFIG.primary).toBeTruthy();
      expect(API_CONFIG.standby1).toBeTruthy();
      expect(API_CONFIG.standby2).toBeTruthy();
    });

    it('TC-CFG-002: endpoints getter 返回非空数组，且按优先级排列', async () => {
      const { API_CONFIG } = await import('../../app/config');
      const eps = API_CONFIG.endpoints;
      expect(Array.isArray(eps)).toBe(true);
      expect(eps.length).toBeGreaterThanOrEqual(1);
      expect(eps[0]).toBe(API_CONFIG.primary);
    });

    it('TC-CFG-003: timeout 默认为 8000ms', async () => {
      const { API_CONFIG } = await import('../../app/config');
      expect(API_CONFIG.timeout).toBe(8000);
    });

    it('TC-CFG-004: retryCount 默认为 2', async () => {
      const { API_CONFIG } = await import('../../app/config');
      expect(API_CONFIG.retryCount).toBe(2);
    });
  });

  describe('WS_CONFIG', () => {
    it('TC-CFG-010: 包含 primary 和 standby WebSocket 端点', async () => {
      const { WS_CONFIG } = await import('../../app/config');
      expect(WS_CONFIG.primary).toContain('wss://');
      expect(WS_CONFIG.standby).toContain('wss://');
    });

    it('TC-CFG-011: reconnectInterval 默认 3000ms', async () => {
      const { WS_CONFIG } = await import('../../app/config');
      expect(WS_CONFIG.reconnectInterval).toBe(3000);
    });

    it('TC-CFG-012: maxReconnect 默认 10 次', async () => {
      const { WS_CONFIG } = await import('../../app/config');
      expect(WS_CONFIG.maxReconnect).toBe(10);
    });

    it('TC-CFG-013: endpoints getter 返回过滤后的数组', async () => {
      const { WS_CONFIG } = await import('../../app/config');
      expect(WS_CONFIG.endpoints.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('AI_CONFIG', () => {
    it('TC-CFG-020: proxyEndpoint 默认为 /api/ai-proxy', async () => {
      const { AI_CONFIG } = await import('../../app/config');
      expect(AI_CONFIG.proxyEndpoint).toBe('/api/ai-proxy');
    });

    it('TC-CFG-021: maxTokens 默认 4096', async () => {
      const { AI_CONFIG } = await import('../../app/config');
      expect(AI_CONFIG.maxTokens).toBe(4096);
    });

    it('TC-CFG-022: temperature 在 0~1 范围内', async () => {
      const { AI_CONFIG } = await import('../../app/config');
      expect(AI_CONFIG.temperature).toBeGreaterThanOrEqual(0);
      expect(AI_CONFIG.temperature).toBeLessThanOrEqual(1);
    });
  });

  describe('AUTH_CONFIG', () => {
    it('TC-CFG-030: 包含 OpenID Connect 必要字段', async () => {
      const { AUTH_CONFIG } = await import('../../app/config');
      expect(AUTH_CONFIG.issuer).toBeTruthy();
      expect(AUTH_CONFIG.clientId).toBeTruthy();
      expect(AUTH_CONFIG.redirectUri).toContain('http');
      expect(AUTH_CONFIG.scope).toContain('openid');
    });
  });

  describe('PG_CONFIG', () => {
    it('TC-CFG-040: 主从端口默认 5432', async () => {
      const { PG_CONFIG } = await import('../../app/config');
      expect(PG_CONFIG.primary.port).toBe(5432);
      expect(PG_CONFIG.replica.port).toBe(5432);
    });

    it('TC-CFG-041: primaryUrl 包含 postgresql:// 协议', async () => {
      const { PG_CONFIG } = await import('../../app/config');
      expect(PG_CONFIG.primaryUrl).toContain('postgresql://');
    });

    it('TC-CFG-042: 主从角色标记正确', async () => {
      const { PG_CONFIG } = await import('../../app/config');
      expect(PG_CONFIG.primary.role).toBe('primary');
      expect(PG_CONFIG.replica.role).toBe('replica');
    });
  });

  describe('CACHE_CONFIG', () => {
    it('TC-CFG-050: TTL 默认 3600 秒', async () => {
      const { CACHE_CONFIG } = await import('../../app/config');
      expect(CACHE_CONFIG.ttl).toBe(3600);
    });

    it('TC-CFG-051: Redis db 默认为 0', async () => {
      const { CACHE_CONFIG } = await import('../../app/config');
      expect(CACHE_CONFIG.db).toBe(0);
    });
  });

  describe('STORAGE_CONFIG', () => {
    it('TC-CFG-060: backupEnabled 默认 true', async () => {
      const { STORAGE_CONFIG } = await import('../../app/config');
      expect(STORAGE_CONFIG.backupEnabled).toBe(true);
    });

    it('TC-CFG-061: backupInterval 默认 300 秒', async () => {
      const { STORAGE_CONFIG } = await import('../../app/config');
      expect(STORAGE_CONFIG.backupInterval).toBe(300);
    });
  });

  describe('APP_CONFIG 统一导出', () => {
    it('TC-CFG-070: 包含全部 7 个子配置', async () => {
      const { APP_CONFIG } = await import('../../app/config');
      expect(APP_CONFIG.api).toBeDefined();
      expect(APP_CONFIG.pg).toBeDefined();
      expect(APP_CONFIG.cache).toBeDefined();
      expect(APP_CONFIG.ws).toBeDefined();
      expect(APP_CONFIG.ai).toBeDefined();
      expect(APP_CONFIG.auth).toBeDefined();
      expect(APP_CONFIG.storage).toBeDefined();
    });
  });
});
