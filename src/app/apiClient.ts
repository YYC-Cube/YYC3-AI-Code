/**
 * @file apiClient.ts
 * @description YYC3 API 客户端 — 一主二备自动故障转移、超时控制、JWT 注入、请求/响应拦截、类型安全 CRUD
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.2.0
 * @created 2026-03-10
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags api,http,failover,jwt,interceptor,crud
 */

/**
 * YANYUCLOUD API 客户端
 *
 * 一主二备自动故障转移，零硬编码。
 * 所有端点来自 /src/app/config.ts (环境变量)。
 *
 * 特性：
 * - 自动故障转移：主 → 备1 → 备2
 * - 超时控制 (AbortController)
 * - 令牌自动注入 (JWT from localStorage)
 * - 请求/响应拦截
 * - 类型安全的 CRUD 方法
 * - 缓存层感知 (X-Cache-TTL header)
 * - 熔断器模式 (Circuit Breaker)
 * - 请求去重 (Request Deduplication)
 */

import { API_CONFIG, CACHE_CONFIG } from './config';
import { apiCircuitBreaker, errorTelemetry } from './components/ErrorBoundary';

// ── Types ──

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  endpoint: string;        // 实际命中的端点
  latency: number;         // 请求耗时 ms
  fromCache: boolean;      // 是否来自缓存
  failoverCount: number;   // 故障转移次数
}

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  cacheTTL?: number;       // 缓存 TTL（秒），0 = 不缓存
  skipAuth?: boolean;
}

// ── Token 管理 ──

const TOKEN_KEY = 'yanyucloud-auth-token';

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

// ── 请求拦截器 ──

type RequestInterceptor = (config: ApiRequestConfig) => ApiRequestConfig;
type ResponseInterceptor = (response: ApiResponse) => ApiResponse;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

export function addRequestInterceptor(fn: RequestInterceptor) {
  requestInterceptors.push(fn);
  return () => {
    const idx = requestInterceptors.indexOf(fn);
    if (idx >= 0) requestInterceptors.splice(idx, 1);
  };
}

export function addResponseInterceptor(fn: ResponseInterceptor) {
  responseInterceptors.push(fn);
  return () => {
    const idx = responseInterceptors.indexOf(fn);
    if (idx >= 0) responseInterceptors.splice(idx, 1);
  };
}

// ── 健康检查缓存 ──

const healthCache = new Map<string, { healthy: boolean; checkedAt: number }>();
const HEALTH_CHECK_INTERVAL = 30_000; // 30s

async function isEndpointHealthy(endpoint: string): Promise<boolean> {
  const cached = healthCache.get(endpoint);
  if (cached && Date.now() - cached.checkedAt < HEALTH_CHECK_INTERVAL) {
    return cached.healthy;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${endpoint}/health`, { signal: controller.signal, method: 'HEAD' });
    clearTimeout(timer);
    const healthy = res.ok;
    healthCache.set(endpoint, { healthy, checkedAt: Date.now() });
    return healthy;
  } catch {
    healthCache.set(endpoint, { healthy: false, checkedAt: Date.now() });
    return false;
  }
}

// ── 请求去重缓存 ──

const inflightRequests = new Map<string, Promise<ApiResponse>>();

function getDedupeKey(config: ApiRequestConfig): string {
  return `${config.method}:${config.path}:${JSON.stringify(config.body || '')}`;
}

// ── 核心请求函数（带故障转移 + 熔断器 + 去重） ──

async function requestWithFailover(config: ApiRequestConfig): Promise<ApiResponse> {
  // Circuit breaker check
  if (!apiCircuitBreaker.canPass()) {
    const stats = apiCircuitBreaker.getStats();
    return {
      ok: false,
      status: 503,
      data: null,
      error: `API 熔断器已开启（${stats.recentFailures} 次失败），${Math.round((apiCircuitBreaker as any).config?.recoveryTimeout / 1000 || 30)}s 后自动恢复`,
      endpoint: 'circuit-breaker',
      latency: 0,
      fromCache: false,
      failoverCount: 0,
    };
  }

  // Request deduplication for GET requests
  if (config.method === 'GET') {
    const key = getDedupeKey(config);
    const inflight = inflightRequests.get(key);
    if (inflight) return inflight;

    const promise = executeRequest(config);
    inflightRequests.set(key, promise);
    promise.finally(() => inflightRequests.delete(key));
    return promise;
  }

  return executeRequest(config);
}

async function executeRequest(config: ApiRequestConfig): Promise<ApiResponse> {
  // 应用请求拦截器
  let finalConfig = config;
  for (const interceptor of requestInterceptors) {
    finalConfig = interceptor(finalConfig);
  }

  const endpoints = API_CONFIG.endpoints;
  const timeout = finalConfig.timeout ?? API_CONFIG.timeout;
  let failoverCount = 0;
  let lastError = '';

  for (const endpoint of endpoints) {
    const url = `${endpoint}${finalConfig.path}`;
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Request-ID': `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...finalConfig.headers,
      };

      // 注入认证令牌
      if (!finalConfig.skipAuth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      // 缓存控制
      if (finalConfig.cacheTTL !== undefined && finalConfig.cacheTTL > 0) {
        headers['X-Cache-TTL'] = String(finalConfig.cacheTTL);
      }

      const res = await fetch(url, {
        method: finalConfig.method,
        headers,
        body: finalConfig.body ? JSON.stringify(finalConfig.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latency = Math.round(performance.now() - start);

      let data: any = null;
      try { data = await res.json(); } catch {}

      let response: ApiResponse = {
        ok: res.ok,
        status: res.status,
        data: res.ok ? data : null,
        error: res.ok ? null : (data?.message || data?.error || `HTTP ${res.status}`),
        endpoint,
        latency,
        fromCache: res.headers.get('X-Cache-Hit') === 'true',
        failoverCount,
      };

      // 应用响应拦截器
      for (const interceptor of responseInterceptors) {
        response = interceptor(response);
      }

      // Record success in circuit breaker
      if (res.ok) {
        apiCircuitBreaker.recordSuccess();
      }

      return response;
    } catch (err: any) {
      failoverCount++;
      lastError = err.name === 'AbortError' ? `超时 (${timeout}ms)` : (err.message || 'Network Error');
      // 标记端点不健康
      healthCache.set(endpoint, { healthy: false, checkedAt: Date.now() });
      // Record failure in circuit breaker
      apiCircuitBreaker.recordFailure();
      // 继续尝试下一个端点
    }
  }

  // 所有端点均失败 — report to telemetry
  errorTelemetry.report({
    message: `API 全部端点不可达: ${lastError}`,
    source: 'network',
    severity: 'error',
    recovered: false,
    recoveryAttempts: failoverCount,
    context: { path: config.path, method: config.method },
  });

  return {
    ok: false,
    status: 0,
    data: null,
    error: `所有端点均不可达 (${failoverCount} 次故障转移): ${lastError}`,
    endpoint: 'none',
    latency: 0,
    fromCache: false,
    failoverCount,
  };
}

// ── 类型安全的 CRUD 方法 ──

export const api = {
  async get<T = any>(path: string, opts?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return requestWithFailover({ method: 'GET', path, cacheTTL: CACHE_CONFIG.ttl, ...opts });
  },

  async post<T = any>(path: string, body?: any, opts?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return requestWithFailover({ method: 'POST', path, body, ...opts });
  },

  async put<T = any>(path: string, body?: any, opts?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return requestWithFailover({ method: 'PUT', path, body, ...opts });
  },

  async patch<T = any>(path: string, body?: any, opts?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return requestWithFailover({ method: 'PATCH', path, body, ...opts });
  },

  async delete<T = any>(path: string, opts?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return requestWithFailover({ method: 'DELETE', path, ...opts });
  },

  // ── 设计文档 CRUD ──

  designs: {
    list:   ()                     => api.get('/api/designs'),
    get:    (id: string)           => api.get(`/api/designs/${id}`),
    create: (data: any)            => api.post('/api/designs', data),
    update: (id: string, data: any)=> api.put(`/api/designs/${id}`, data),
    delete: (id: string)           => api.delete(`/api/designs/${id}`),
    export: (id: string, format: 'react' | 'vue' | 'angular') =>
      api.get(`/api/designs/${id}/export?format=${format}`),
  },

  // ── CRDT 文档 ──

  crdt: {
    getDoc:    (room: string)           => api.get(`/api/crdt/${room}`),
    snapshot:  (room: string)           => api.post(`/api/crdt/${room}/snapshot`),
    conflicts: (room: string)           => api.get(`/api/crdt/${room}/conflicts`),
    resolve:   (room: string, data: any)=> api.post(`/api/crdt/${room}/resolve`, data),
  },

  // ── AI 代理 ──

  ai: {
    chat:     (body: any) => api.post('/api/ai-proxy', body),
    suggest:  (body: any) => api.post('/api/ai-proxy/suggest', body),
    diagnose: (body: any) => api.post('/api/ai-proxy/diagnose', body),
  },

  // ── 数据库管理 ──

  db: {
    tables:  ()                      => api.get('/api/db/tables'),
    schema:  (table: string)         => api.get(`/api/db/tables/${table}/schema`),
    query:   (sql: string)           => api.post('/api/db/query', { sql }),
    health:  ()                      => api.get('/api/db/health'),
  },

  // ── 系统健康 ──

  system: {
    health:  () => api.get('/api/health', { skipAuth: true }),
    config:  () => api.get('/api/config'),
    metrics: () => api.get('/api/metrics'),
  },

  // ── 工具方法 ──

  isEndpointHealthy,
  getEndpoints: () => API_CONFIG.endpoints,
  getActiveEndpoint: async (): Promise<string | null> => {
    for (const ep of API_CONFIG.endpoints) {
      if (await isEndpointHealthy(ep)) return ep;
    }
    return null;
  },
};