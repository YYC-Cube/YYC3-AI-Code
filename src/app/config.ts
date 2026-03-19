/**
 * @file config.ts
 * @description YYC3 全局配置中心 — 所有外部依赖均从环境变量读取，支持一主二备 API/WS/DB/缓存/认证/存储配置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-10
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags config,env,api,websocket,database,cache,auth,storage
 */

/**
 * YANYUCLOUD 全局配置中心
 *
 * 所有外部依赖均从环境变量读取，拒绝硬编码。
 * 在 .env / .env.local / docker-compose.yml 中配置：
 *
 *   # ── API 后端（一主二备） ──
 *   VITE_API_PRIMARY=https://api-primary.yanyucloud.local
 *   VITE_API_STANDBY_1=https://api-standby1.yanyucloud.local
 *   VITE_API_STANDBY_2=https://api-standby2.yanyucloud.local
 *   VITE_API_TIMEOUT=8000
 *   VITE_API_RETRY_COUNT=2
 *
 *   # ── PostgreSQL 双主从 ──
 *   VITE_PG_PRIMARY_HOST=pg-primary.yanyucloud.local
 *   VITE_PG_PRIMARY_PORT=5432
 *   VITE_PG_REPLICA_HOST=pg-replica.yanyucloud.local
 *   VITE_PG_REPLICA_PORT=5432
 *   VITE_PG_DATABASE=yanyucloud_designer
 *   VITE_PG_SCHEMA=public
 *
 *   # ── 缓存库 (Redis Sentinel / Cluster) ──
 *   VITE_CACHE_PRIMARY=redis-primary.yanyucloud.local:6379
 *   VITE_CACHE_REPLICA=redis-replica.yanyucloud.local:6379
 *   VITE_CACHE_SENTINEL=redis-sentinel.yanyucloud.local:26379
 *   VITE_CACHE_DB=0
 *   VITE_CACHE_TTL=3600
 *
 *   # ── WebSocket (CRDT y-websocket) ──
 *   VITE_WS_PRIMARY=wss://ws-primary.yanyucloud.local
 *   VITE_WS_STANDBY=wss://ws-standby.yanyucloud.local
 *   VITE_WS_RECONNECT_INTERVAL=3000
 *   VITE_WS_MAX_RECONNECT=10
 *
 *   # ── AI 代理 ──
 *   VITE_AI_PROXY_ENDPOINT=/api/ai-proxy
 *   VITE_AI_MAX_TOKENS=4096
 *   VITE_AI_TEMPERATURE=0.7
 *
 *   # ── 认证 (OpenID Connect) ──
 *   VITE_AUTH_ISSUER=https://auth.yanyucloud.local
 *   VITE_AUTH_CLIENT_ID=yanyucloud-designer
 *   VITE_AUTH_REDIRECT_URI=http://localhost:5173/auth/callback
 *   VITE_AUTH_SCOPE=openid profile email
 *
 *   # ── 存储 ──
 *   VITE_STORAGE_DESIGN_PATH=/app/designs
 *   VITE_STORAGE_BACKUP_ENABLED=true
 *   VITE_STORAGE_BACKUP_INTERVAL=300
 */

// ── Helper: 读取环境变量（带类型安全 + 默认值） ──

function env(key: string, fallback: string = ''): string {
  return (import.meta as any).env?.[key] ?? fallback;
}

function envNum(key: string, fallback: number): number {
  const v = env(key);
  return v ? Number(v) : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const v = env(key);
  if (!v) return fallback;
  return v === 'true' || v === '1';
}

// ── API 后端配置（一主二备自动故障转移） ──

export const API_CONFIG = {
  primary:    env('VITE_API_PRIMARY',    'https://api-primary.yanyucloud.local'),
  standby1:   env('VITE_API_STANDBY_1',  'https://api-standby1.yanyucloud.local'),
  standby2:   env('VITE_API_STANDBY_2',  'https://api-standby2.yanyucloud.local'),
  timeout:    envNum('VITE_API_TIMEOUT',  8000),
  retryCount: envNum('VITE_API_RETRY_COUNT', 2),

  /** 按优先级返回所有可用端点 */
  get endpoints(): string[] {
    return [this.primary, this.standby1, this.standby2].filter(Boolean);
  },
} as const;

// ── PostgreSQL 双主从配置 ──

export const PG_CONFIG = {
  primary: {
    host: env('VITE_PG_PRIMARY_HOST', 'pg-primary.yanyucloud.local'),
    port: envNum('VITE_PG_PRIMARY_PORT', 5432),
    role: 'primary' as const,
  },
  replica: {
    host: env('VITE_PG_REPLICA_HOST', 'pg-replica.yanyucloud.local'),
    port: envNum('VITE_PG_REPLICA_PORT', 5432),
    role: 'replica' as const,
  },
  database: env('VITE_PG_DATABASE', 'yanyucloud_designer'),
  schema:   env('VITE_PG_SCHEMA',   'public'),

  /** Prisma 格式连接串（主） */
  get primaryUrl(): string {
    return `postgresql://\${user}:\${password}@${this.primary.host}:${this.primary.port}/${this.database}?schema=${this.schema}`;
  },
  /** Prisma 格式连接串（从） */
  get replicaUrl(): string {
    return `postgresql://\${user}:\${password}@${this.replica.host}:${this.replica.port}/${this.database}?schema=${this.schema}`;
  },
} as const;

// ── 缓存库配置（Redis Sentinel / Cluster） ──

export const CACHE_CONFIG = {
  primary:  env('VITE_CACHE_PRIMARY',  'redis-primary.yanyucloud.local:6379'),
  replica:  env('VITE_CACHE_REPLICA',  'redis-replica.yanyucloud.local:6379'),
  sentinel: env('VITE_CACHE_SENTINEL', 'redis-sentinel.yanyucloud.local:26379'),
  db:       envNum('VITE_CACHE_DB', 0),
  ttl:      envNum('VITE_CACHE_TTL', 3600),
} as const;

// ── WebSocket（CRDT 协同） ──

export const WS_CONFIG = {
  primary:           env('VITE_WS_PRIMARY',  'wss://ws-primary.yanyucloud.local'),
  standby:           env('VITE_WS_STANDBY',  'wss://ws-standby.yanyucloud.local'),
  reconnectInterval: envNum('VITE_WS_RECONNECT_INTERVAL', 3000),
  maxReconnect:      envNum('VITE_WS_MAX_RECONNECT', 10),

  get endpoints(): string[] {
    return [this.primary, this.standby].filter(Boolean);
  },
} as const;

// ── AI 代理配置 ──

export const AI_CONFIG = {
  proxyEndpoint: env('VITE_AI_PROXY_ENDPOINT', '/api/ai-proxy'),
  maxTokens:     envNum('VITE_AI_MAX_TOKENS', 4096),
  temperature:   envNum('VITE_AI_TEMPERATURE', 0.7) / (envNum('VITE_AI_TEMPERATURE', 0.7) > 1 ? 10 : 1),
} as const;

// ── 认证配置 (OpenID Connect) ──

export const AUTH_CONFIG = {
  issuer:      env('VITE_AUTH_ISSUER',       'https://auth.yanyucloud.local'),
  clientId:    env('VITE_AUTH_CLIENT_ID',    'yanyucloud-designer'),
  redirectUri: env('VITE_AUTH_REDIRECT_URI', 'http://localhost:5173/auth/callback'),
  scope:       env('VITE_AUTH_SCOPE',        'openid profile email'),
} as const;

// ── 存储配置 ──

export const STORAGE_CONFIG = {
  designPath:     env('VITE_STORAGE_DESIGN_PATH',      '/app/designs'),
  backupEnabled:  envBool('VITE_STORAGE_BACKUP_ENABLED', true),
  backupInterval: envNum('VITE_STORAGE_BACKUP_INTERVAL', 300),
} as const;

// ── 统一导出 ──

export const APP_CONFIG = {
  api:     API_CONFIG,
  pg:      PG_CONFIG,
  cache:   CACHE_CONFIG,
  ws:      WS_CONFIG,
  ai:      AI_CONFIG,
  auth:    AUTH_CONFIG,
  storage: STORAGE_CONFIG,
} as const;

export type AppConfig = typeof APP_CONFIG;