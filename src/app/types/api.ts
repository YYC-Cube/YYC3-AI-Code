/**
 * @file api.ts
 * @description YYC³ 标准化 API 响应与请求类型 — 遵循 RESTful 规范
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 */

/* ================================================================
   Standard API Response Format
   ================================================================ */

/** Successful API response */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: ApiMeta
}

/** Error API response */
export interface ApiErrorResponse {
  success: false
  error: ApiError
}

/** Union response type */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

export function isApiSuccess<T>(res: ApiResponse<T>): res is ApiSuccessResponse<T> {
  return res.success === true
}

export function isApiError(res: ApiResponse): res is ApiErrorResponse {
  return res.success === false
}

/** Error detail */
export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: Record<string, unknown>
  stack?: string // only in development
}

/** Pagination metadata */
export interface ApiMeta {
  page?: number
  pageSize?: number
  total?: number
  totalPages?: number
  hasMore?: boolean
  cursor?: string
}

/* ================================================================
   Error Codes
   ================================================================ */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN'

/* ================================================================
   Request Options
   ================================================================ */

export interface ApiRequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Request body (JSON-serializable) */
  body?: unknown
  /** Additional headers */
  headers?: Record<string, string>
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>
  /** Request timeout in ms (default: 30000) */
  timeout?: number
  /** Number of retry attempts (default: 0) */
  retries?: number
  /** Retry backoff multiplier in ms (default: 1000) */
  retryBackoff?: number
  /** AbortSignal for cancellation */
  signal?: AbortSignal
  /** Skip auth header */
  noAuth?: boolean
}

/* ================================================================
   Pagination Request
   ================================================================ */

export interface PaginationParams {
  page?: number
  pageSize?: number
  cursor?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  meta: Required<Pick<ApiMeta, 'page' | 'pageSize' | 'total' | 'totalPages' | 'hasMore'>>
}

/* ================================================================
   WebSocket Event Types
   ================================================================ */

export interface WSMessage<T = unknown> {
  type: string
  payload: T
  timestamp: number
  senderId?: string
}

export interface WSCodeChange {
  roomId: string
  filePath: string
  changes: Array<{
    type: 'insert' | 'delete' | 'retain'
    position: number
    content?: string
    length?: number
  }>
}

/* ================================================================
   Auth Types
   ================================================================ */

export interface AuthTokenPayload {
  id: string
  email: string
  name: string
  iat: number
  exp: number
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface Permission {
  resource: string
  actions: ('read' | 'write' | 'delete' | 'admin')[]
}

/* ================================================================
   Cache Types
   ================================================================ */

export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

export interface CacheConfig {
  enabled: boolean
  defaultTTL: number // seconds
  maxEntries: number
}
