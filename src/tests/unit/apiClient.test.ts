/**
 * @file apiClient.test.ts
 * @description apiClient.ts 单元测试 — 故障转移、熔断器集成、Token 管理、请求拦截器、去重、CRUD
 * @priority P0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetLocalStorage, createMockFetch } from '../setup';

// 重置模块状态
const TOKEN_KEY = 'yanyucloud-auth-token';

describe('apiClient.ts — API 客户端', () => {

  beforeEach(() => {
    resetLocalStorage();
    vi.restoreAllMocks();
  });

  /* ── Token 管理 ── */

  describe('Token 管理', () => {
    it('TC-API-001: setToken 写入 localStorage', async () => {
      const { setToken } = await import('../../app/apiClient');
      setToken('jwt-abc123');
      expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-abc123');
    });

    it('TC-API-002: clearToken 清除 localStorage', async () => {
      const { setToken, clearToken } = await import('../../app/apiClient');
      setToken('jwt-abc123');
      clearToken();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  /* ── 拦截器 ── */

  describe('拦截器', () => {
    it('TC-API-010: addRequestInterceptor 返回卸载函数', async () => {
      const { addRequestInterceptor } = await import('../../app/apiClient');
      const interceptor = (config: any) => ({ ...config, headers: { ...config.headers, 'X-Custom': 'yes' } });
      const remove = addRequestInterceptor(interceptor);
      expect(typeof remove).toBe('function');
      remove(); // 清理
    });

    it('TC-API-011: addResponseInterceptor 返回卸载函数', async () => {
      const { addResponseInterceptor } = await import('../../app/apiClient');
      const interceptor = (resp: any) => ({ ...resp, _intercepted: true });
      const remove = addResponseInterceptor(interceptor);
      expect(typeof remove).toBe('function');
      remove();
    });
  });

  /* ── API CRUD 方法签名 ── */

  describe('CRUD 方法签名', () => {
    it('TC-API-020: api 对象包含 get/post/put/patch/delete 方法', async () => {
      const { api } = await import('../../app/apiClient');
      expect(typeof api.get).toBe('function');
      expect(typeof api.post).toBe('function');
      expect(typeof api.put).toBe('function');
      expect(typeof api.patch).toBe('function');
      expect(typeof api.delete).toBe('function');
    });

    it('TC-API-021: api.designs 包含 CRUD 子方法', async () => {
      const { api } = await import('../../app/apiClient');
      expect(typeof api.designs.list).toBe('function');
      expect(typeof api.designs.get).toBe('function');
      expect(typeof api.designs.create).toBe('function');
      expect(typeof api.designs.update).toBe('function');
      expect(typeof api.designs.delete).toBe('function');
      expect(typeof api.designs.export).toBe('function');
    });

    it('TC-API-022: api.crdt 包含 CRDT 子方法', async () => {
      const { api } = await import('../../app/apiClient');
      expect(typeof api.crdt.getDoc).toBe('function');
      expect(typeof api.crdt.snapshot).toBe('function');
      expect(typeof api.crdt.conflicts).toBe('function');
      expect(typeof api.crdt.resolve).toBe('function');
    });

    it('TC-API-023: api.ai 包含 AI 代理子方法', async () => {
      const { api } = await import('../../app/apiClient');
      expect(typeof api.ai.chat).toBe('function');
      expect(typeof api.ai.suggest).toBe('function');
      expect(typeof api.ai.diagnose).toBe('function');
    });

    it('TC-API-024: api.system 包含系统健康子方法', async () => {
      const { api } = await import('../../app/apiClient');
      expect(typeof api.system.health).toBe('function');
      expect(typeof api.system.config).toBe('function');
      expect(typeof api.system.metrics).toBe('function');
    });

    it('TC-API-025: api.db 包含数据库管理子方法', async () => {
      const { api } = await import('../../app/apiClient');
      expect(typeof api.db.tables).toBe('function');
      expect(typeof api.db.schema).toBe('function');
      expect(typeof api.db.query).toBe('function');
      expect(typeof api.db.health).toBe('function');
    });
  });

  /* ── 工具方法 ── */

  describe('工具方法', () => {
    it('TC-API-030: getEndpoints 返回配置中的端点列表', async () => {
      const { api } = await import('../../app/apiClient');
      const eps = api.getEndpoints();
      expect(Array.isArray(eps)).toBe(true);
      expect(eps.length).toBeGreaterThanOrEqual(1);
    });

    it('TC-API-031: isEndpointHealthy 可调用', async () => {
      const { api } = await import('../../app/apiClient');
      expect(typeof api.isEndpointHealthy).toBe('function');
    });

    it('TC-API-032: getActiveEndpoint 可调用', async () => {
      const { api } = await import('../../app/apiClient');
      expect(typeof api.getActiveEndpoint).toBe('function');
    });
  });

  /* ── ApiResponse 结构 ── */

  describe('ApiResponse 类型结构', () => {
    it('TC-API-040: 失败响应包含正确字段', async () => {
      // 模拟所有端点失败
      vi.stubGlobal('fetch', async () => { throw new Error('Network unreachable'); });

      const { api } = await import('../../app/apiClient');
      // 需要先重置熔断器状态
      const { apiCircuitBreaker } = await import('../../app/components/ErrorBoundary');
      apiCircuitBreaker.reset();

      const res = await api.get('/api/test-fail');
      expect(res.ok).toBe(false);
      expect(res.error).toBeTruthy();
      expect(typeof res.latency).toBe('number');
      expect(typeof res.failoverCount).toBe('number');

      vi.unstubAllGlobals();
    });
  });

  /* ── 熔断器集成 ── */

  describe('熔断器集成', () => {
    it('TC-API-050: 熔断器开启时直接返回 503', async () => {
      const { apiCircuitBreaker } = await import('../../app/components/ErrorBoundary');
      // 手动触发熔断
      for (let i = 0; i < 10; i++) apiCircuitBreaker.recordFailure();
      expect(apiCircuitBreaker.state).toBe('open');

      const { api } = await import('../../app/apiClient');
      const res = await api.get('/api/any');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(503);
      expect(res.endpoint).toBe('circuit-breaker');

      apiCircuitBreaker.reset();
    });
  });
});
