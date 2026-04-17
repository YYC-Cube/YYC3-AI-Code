/**
 * @file api-client.ts
 * @description YYC³ 统一 API 客户端 — 请求/响应标准化、错误处理、重试、缓存
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Follows the spec's RESTful API standards:
 * - Standardized success/error response format
 * - JWT auth header injection
 * - Automatic retry with exponential backoff
 * - Request timeout support
 * - Response caching layer
 * - Structured error classification
 */

import { createLogger } from './logger'
import type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiErrorCode,
  ApiRequestOptions,
  CacheEntry,
  CacheConfig,
} from '../types/api'

const log = createLogger('ApiClient')

/* ================================================================
   Configuration
   ================================================================ */

interface ApiClientConfig {
  baseURL: string
  defaultTimeout: number
  defaultRetries: number
  retryBackoff: number
  cache: CacheConfig
  getAuthToken: () => string | null
}

const DEFAULT_CONFIG: ApiClientConfig = {
  baseURL: '',
  defaultTimeout: 30_000,
  defaultRetries: 0,
  retryBackoff: 1000,
  cache: {
    enabled: false,
    defaultTTL: 300, // 5 minutes
    maxEntries: 100,
  },
  getAuthToken: () => null,
}

let config: ApiClientConfig = { ...DEFAULT_CONFIG }

/** Configure the API client */
export function configureApiClient(overrides: Partial<ApiClientConfig>) {
  config = { ...config, ...overrides }
  log.info('API client configured', { baseURL: config.baseURL })
}

/* ================================================================
   In-Memory Cache
   ================================================================ */

const cache = new Map<string, CacheEntry>()

function getCacheKey(url: string, options?: ApiRequestOptions): string {
  const method = options?.method || 'GET'
  const params = options?.params ? JSON.stringify(options.params) : ''
  return `${method}:${url}:${params}`
}

function getFromCache<T>(key: string): T | null {
  if (!config.cache.enabled) {return null}
  const entry = cache.get(key)
  if (!entry) {return null}
  if (Date.now() - entry.timestamp > entry.ttl * 1000) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T, ttl?: number) {
  if (!config.cache.enabled) {return}
  // Evict oldest entries if over limit
  while (cache.size >= config.cache.maxEntries) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) {cache.delete(oldestKey)}
  }
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttl ?? config.cache.defaultTTL,
    key,
  })
}

/** Clear the API cache */
export function clearApiCache() {
  cache.clear()
  log.debug('API cache cleared')
}

/* ================================================================
   Error Classification
   ================================================================ */

function classifyHttpError(status: number): ApiErrorCode {
  if (status === 400) {return 'VALIDATION_ERROR'}
  if (status === 401) {return 'UNAUTHORIZED'}
  if (status === 403) {return 'FORBIDDEN'}
  if (status === 404) {return 'NOT_FOUND'}
  if (status === 409) {return 'CONFLICT'}
  if (status === 429) {return 'RATE_LIMITED'}
  if (status >= 500) {return 'INTERNAL_ERROR'}
  return 'UNKNOWN'
}

function classifyNetworkError(error: unknown): ApiErrorCode {
  if (error instanceof DOMException && error.name === 'AbortError') {return 'TIMEOUT'}
  return 'NETWORK_ERROR'
}

/* ================================================================
   Core Request Function
   ================================================================ */

async function makeRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
  attempt = 0,
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers: extraHeaders = {},
    params,
    timeout = config.defaultTimeout,
    retries = config.defaultRetries,
    retryBackoff = config.retryBackoff,
    signal,
    noAuth = false,
  } = options

  // Build URL
  let url = endpoint.startsWith('http') ? endpoint : `${config.baseURL}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) {searchParams.set(k, String(v))}
    })
    const qs = searchParams.toString()
    if (qs) {url += `${url.includes('?') ? '&' : '?'}${qs}`}
  }

  // Check cache for GET requests
  if (method === 'GET') {
    const cacheKey = getCacheKey(url, options)
    const cached = getFromCache<T>(cacheKey)
    if (cached !== null) {
      log.debug('Cache hit', { url })
      return { success: true, data: cached }
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
  if (!noAuth) {
    const token = config.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  // Timeout controller
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout)
  const combinedSignal = signal
    ? (AbortSignal as any).any?.([signal, timeoutController.signal]) ?? timeoutController.signal
    : timeoutController.signal

  const startTime = Date.now()

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: combinedSignal,
    })

    clearTimeout(timeoutId)
    const duration = Date.now() - startTime
    log.debug(`${method} ${endpoint}`, { status: response.status, duration })

    if (!response.ok) {
      // Try to parse error body
      let errorBody: any = {}
      try {
        errorBody = await response.json()
      } catch {
        // ignore
      }

      const apiError: ApiErrorResponse = {
        success: false,
        error: {
          code: classifyHttpError(response.status),
          message: errorBody?.error?.message || errorBody?.message || response.statusText,
          details: errorBody?.error?.details || errorBody?.details,
        },
      }

      // Retry on server errors or rate limit
      if (attempt < retries && (response.status >= 500 || response.status === 429)) {
        const backoff = retryBackoff * Math.pow(2, attempt)
        log.warn(`Retrying ${method} ${endpoint} in ${backoff}ms (attempt ${attempt + 1}/${retries})`)
        await sleep(backoff)
        return makeRequest<T>(endpoint, options, attempt + 1)
      }

      return apiError
    }

    // Parse response
    const data = await response.json()

    // Normalize: if the response already follows our format, use it; otherwise wrap
    const result: ApiSuccessResponse<T> = data?.success !== undefined
      ? data
      : { success: true, data }

    // Cache successful GET responses
    if (method === 'GET' && result.success) {
      setCache(getCacheKey(url, options), result.data)
    }

    return result
  } catch (error: unknown) {
    clearTimeout(timeoutId)

    const errorCode = classifyNetworkError(error)
    const message = error instanceof Error ? error.message : 'Unknown network error'

    log.error(`${method} ${endpoint} failed`, { error: message, attempt })

    // Retry on network errors
    if (attempt < retries && errorCode === 'NETWORK_ERROR') {
      const backoff = retryBackoff * Math.pow(2, attempt)
      log.warn(`Retrying ${method} ${endpoint} in ${backoff}ms (attempt ${attempt + 1}/${retries})`)
      await sleep(backoff)
      return makeRequest<T>(endpoint, options, attempt + 1)
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message,
      },
    }
  }
}

/* ================================================================
   Public API
   ================================================================ */

/** GET request */
export function apiGet<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return makeRequest<T>(endpoint, { ...options, method: 'GET' })
}

/** POST request */
export function apiPost<T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return makeRequest<T>(endpoint, { ...options, method: 'POST', body })
}

/** PUT request */
export function apiPut<T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return makeRequest<T>(endpoint, { ...options, method: 'PUT', body })
}

/** PATCH request */
export function apiPatch<T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return makeRequest<T>(endpoint, { ...options, method: 'PATCH', body })
}

/** DELETE request */
export function apiDelete<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return makeRequest<T>(endpoint, { ...options, method: 'DELETE' })
}

/* ================================================================
   Helpers
   ================================================================ */

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Type-guard: checks if an ApiResponse is successful.
 * Narrows the type so you can access `response.data` safely.
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true
}

/**
 * Unwrap an ApiResponse — returns data on success, throws on failure.
 */
export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (isApiSuccess(response)) {return response.data}
  throw new Error(`[${response.error.code}] ${response.error.message}`)
}
