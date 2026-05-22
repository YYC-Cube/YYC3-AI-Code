/**
 * @file logger.ts
 * @description YYC3 生产环境日志管理系统 — 智能、安全、高性能的日志工具
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @updated 2026-05-22
 * @status production
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags logger,production,security,performance
 */

// ============================================
// YYC³ Global Unified Logger - Production Ready
// ============================================
// Centralized logging utility for the entire application.
// Supports log levels, module tagging, timestamps,
// and structured output for debugging and monitoring.
// Enhanced with production security features.

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
  NONE = 5, // Complete silence for production
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: unknown
  stackTrace?: string
  userAgent?: string
  url?: string
  userId?: string
}

// Production-safe configuration
interface LoggerConfig {
  enableProductionLogging: boolean // Enable console logging in production
  enableRemoteLogging: boolean // Enable remote log aggregation
  remoteEndpoint?: string // Remote logging service endpoint
  samplingRate: number // Log sampling rate for production (0.0-1.0)
  maxBufferSize: number // Maximum log buffer size
  enableStackTrace: boolean // Include stack traces for errors
  sanitizeData: boolean // Sanitize sensitive data
}

const DEFAULT_CONFIG: LoggerConfig = {
  enableProductionLogging: process.env.NODE_ENV !== 'production',
  enableRemoteLogging: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.VITE_LOG_ENDPOINT || '/api/logs',
  samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% sampling in production
  maxBufferSize: 100,
  enableStackTrace: process.env.NODE_ENV === 'development',
  sanitizeData: true,
}

// Global configuration
let loggerConfig: LoggerConfig = { ...DEFAULT_CONFIG }

// Global log level — can be changed at runtime
let globalLogLevel: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG

// Log buffer for remote aggregation
const REMOTE_LOG_BUFFER: LogEntry[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null

// In-memory log buffer for export/inspection
const LOG_BUFFER_MAX = 500
const logBuffer: LogEntry[] = []

const LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SILENT]: 'SILENT',
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '#8b8b8b',
  [LogLevel.INFO]: '#60a5fa',
  [LogLevel.WARN]: '#fbbf24',
  [LogLevel.ERROR]: '#f87171',
  [LogLevel.SILENT]: '#ffffff',
}

const MODULE_COLORS: Record<string, string> = {
  'ThemeStore': '#a78bfa',
  'ThemeProvider': '#818cf8',
  'ThemeCustomizer': '#c084fc',
  'AppStore': '#34d399',
  'App': '#22d3ee',
  'HomePage': '#22d3ee',
  'DesignerPage': '#2dd4bf',
  'TopNavBar': '#fb923c',
  'ModelSettings': '#f472b6',
  'LeftPanel': '#38bdf8',
  'CenterPanel': '#4ade80',
  'RightPanel': '#facc15',
  'ViewSwitchBar': '#e879f9',
  'Router': '#f97316',
  'API': '#ef4444',
  'ApiClient': '#ef4444',
  'ApiService': '#f87171',
  'AuthService': '#f59e0b',
  'HeartbeatStore': '#f43f5e',
  'HeartbeatManager': '#fb7185',
  'LayoutStore': '#06b6d4',
  'SyncStore': '#8b5cf6',
  'PluginStore': '#10b981',
  'PluginManager': '#34d399',
  'CollabStore': '#ec4899',
  'CollabIndicator': '#f472b6',
  'FileTreeStore': '#f59e0b',
  'DesignStore': '#a855f7',
  'SessionStore': '#6366f1',
  'PersistenceService': '#14b8a6',
  'CodeGeneration': '#f472b6',
  'TemplateEngine': '#c084fc',
  'PromptBuilder': '#fb923c',
  'CodeQuality': '#22d3ee',
  'SecurityService': '#ef4444',
  'AICostService': '#f59e0b',
  'MonitoringService': '#10b981',
  'TestRunner': '#6366f1',
  'QualityGate': '#a855f7',
  'I18nService': '#06b6d4',
  'HostBridge': '#0ea5e9',
  'LocalStorage': '#14b8a6',
  'WorkerService': '#8b5cf6',
  'PluginService': '#d946ef',
}

// ── Helpers ──

function getTimestamp(): string {
  return new Date().toISOString()
}

function getModuleColor(module: string): string {
  return MODULE_COLORS[module] || '#9ca3af'
}

function pushToBuffer(entry: LogEntry): void {
  logBuffer.push(entry)
  if (logBuffer.length > LOG_BUFFER_MAX) {
    logBuffer.shift()
  }
}

// ── Core log function ──

function logMessage(level: LogLevel, module: string, message: string, ...data: unknown[]): void {
  if (level < globalLogLevel) {return}

  const timestamp = getTimestamp()
  const entry: LogEntry = { timestamp, level, module, message, data: data.length > 0 ? data : undefined }
  pushToBuffer(entry)

  const levelLabel = LEVEL_LABELS[level]
  const levelColor = LEVEL_COLORS[level]
  const moduleColor = getModuleColor(module)

  const prefix = `%c[${timestamp.slice(11, 23)}]%c [${levelLabel}]%c [${module}]%c`
  const styles = [
    'color: #6b7280',
    `color: ${levelColor}; font-weight: bold`,
    `color: ${moduleColor}; font-weight: bold`,
    'color: inherit',
  ]

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(prefix, ...styles, message, ...data)
      break
    case LogLevel.INFO:
      console.info(prefix, ...styles, message, ...data)
      break
    case LogLevel.WARN:
      console.warn(prefix, ...styles, message, ...data)
      break
    case LogLevel.ERROR:
      console.error(prefix, ...styles, message, ...data)
      break
    default:
      break
  }
}

// ── Public API ──

export interface Logger {
  debug: (message: string, ...data: unknown[]) => void
  info: (message: string, ...data: unknown[]) => void
  warn: (message: string, ...data: unknown[]) => void
  error: (message: string, ...data: unknown[]) => void
}

/**
 * Create a scoped logger for a specific module.
 *
 * Usage:
 * ```ts
 * const log = createLogger('MyModule')
 * log.info('Hello from MyModule')
 * ```
 */
export function createLogger(module: string): Logger {
  return {
    debug: (message: string, ...data: unknown[]) => logMessage(LogLevel.DEBUG, module, message, ...data),
    info: (message: string, ...data: unknown[]) => logMessage(LogLevel.INFO, module, message, ...data),
    warn: (message: string, ...data: unknown[]) => logMessage(LogLevel.WARN, module, message, ...data),
    error: (message: string, ...data: unknown[]) => logMessage(LogLevel.ERROR, module, message, ...data),
  }
}

/**
 * Set the global log level at runtime.
 */
export function setLogLevel(level: LogLevel): void {
  globalLogLevel = level
}

/**
 * Get the current global log level.
 */
export function getLogLevel(): LogLevel {
  return globalLogLevel
}

/**
 * Get a copy of the in-memory log buffer.
 */
export function getLogBuffer(): LogEntry[] {
  return [...logBuffer]
}

/**
 * Clear the in-memory log buffer.
 */
export function clearLogBuffer(): void {
  logBuffer.length = 0
}

/* ================================================================
   Production Environment Enhancements
   ================================================================ */

/**
 * Configure logger settings
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  loggerConfig = { ...loggerConfig, ...config }

  // Update remote logging timer
  if (loggerConfig.enableRemoteLogging && !flushTimer) {
    startFlushTimer()
  } else if (!loggerConfig.enableRemoteLogging && flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeData(data: unknown): unknown {
  if (!loggerConfig.sanitizeData || !data) return data

  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'creditCard', 'ssn', 'authorization']
  const dataStr = JSON.stringify(data)

  try {
    const parsed = JSON.parse(dataStr)
    const sanitized = Array.isArray(parsed) ? parsed : { ...parsed }

    function sanitizeObject(obj: any): any {
      if (typeof obj !== 'object' || obj === null) return obj

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject)
      }

      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase()
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          result[key] = '[REDACTED]'
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value)
        } else {
          result[key] = value
        }
      }
      return result
    }

    return sanitizeObject(sanitized)
  } catch {
    return data // Return original if sanitization fails
  }
}

/**
 * Get current user ID for logging
 */
function getUserId(): string | null {
  try {
    return localStorage.getItem('yyc3-user-id') || null
  } catch {
    return null
  }
}

/**
 * Flush remote logs to server
 */
async function flushRemoteLogs(): Promise<void> {
  if (REMOTE_LOG_BUFFER.length === 0) return

  const logsToSend = [...REMOTE_LOG_BUFFER]
  REMOTE_LOG_BUFFER.length = 0 // Clear buffer

  if (!loggerConfig.remoteEndpoint) return

  try {
    await fetch(loggerConfig.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs: logsToSend }),
      keepalive: true, // Ensure request completes even if page is unloading
    })
  } catch (error) {
    // If remote logging fails, add back to buffer (with limit)
    if (REMOTE_LOG_BUFFER.length < loggerConfig.maxBufferSize) {
      REMOTE_LOG_BUFFER.unshift(...logsToSend.slice(0, 10))
    }
  }
}

/**
 * Start automatic log flushing
 */
function startFlushTimer(): void {
  if (flushTimer) return

  flushTimer = setInterval(() => {
    flushRemoteLogs()
  }, 30000) // Flush every 30 seconds

  // Flush on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      flushRemoteLogs()
    })
  }
}

/**
 * Enhanced log function with production safety
 */
function logMessageEnhanced(
  level: LogLevel,
  module: string,
  message: string,
  ...data: unknown[]
): void {
  // Check log level
  if (level < globalLogLevel) {
    return
  }

  // Production sampling
  if (process.env.NODE_ENV === 'production' && Math.random() > loggerConfig.samplingRate) {
    return
  }

  const timestamp = getTimestamp()
  const sanitizedData = sanitizeData(data.length > 0 ? data : undefined)

  const entry: LogEntry = {
    timestamp,
    level,
    module,
    message,
    data: sanitizedData,
  }

  // Add stack trace for errors in production
  if (level >= LogLevel.ERROR && loggerConfig.enableStackTrace) {
    entry.stackTrace = new Error().stack
  }

  // Add context information
  if (typeof window !== 'undefined') {
    entry.userAgent = navigator.userAgent
    entry.url = window.location.href
    entry.userId = getUserId() || undefined
  }

  pushToBuffer(entry)

  // Console output (controlled by config)
  if (loggerConfig.enableProductionLogging || process.env.NODE_ENV === 'development') {
    const levelLabel = LEVEL_LABELS[level]
    const levelColor = LEVEL_COLORS[level]
    const moduleColor = getModuleColor(module)

    const prefix = `%c[${timestamp.slice(11, 23)}]%c [${levelLabel}]%c [${module}]%c`
    const styles = [
      'color: #6b7280',
      `color: ${levelColor}; font-weight: bold`,
      `color: ${moduleColor}; font-weight: bold`,
      'color: inherit',
    ]

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, ...styles, message, sanitizedData)
        break
      case LogLevel.INFO:
        console.info(prefix, ...styles, message, sanitizedData)
        break
      case LogLevel.WARN:
        console.warn(prefix, ...styles, message, sanitizedData)
        break
      case LogLevel.ERROR:
        console.error(prefix, ...styles, message, sanitizedData)
        if (entry.stackTrace) {
          console.error('Stack trace:', entry.stackTrace)
        }
        break
      default:
        break
    }
  }

  // Remote logging for warnings and errors
  if (loggerConfig.enableRemoteLogging && level >= LogLevel.WARN) {
    REMOTE_LOG_BUFFER.push(entry)
    if (REMOTE_LOG_BUFFER.length >= loggerConfig.maxBufferSize) {
      flushRemoteLogs()
    }
  }
}

/* ================================================================
   Production Environment Console Override
   ================================================================ */

if (process.env.NODE_ENV === 'production') {
  // Store original console methods for emergency use
  const originalConsole = {
    log: console.log,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }

  // Override console methods to use enhanced logger
  console.log = (...args: any[]) => {
    if (args.length > 0) {
      logMessageEnhanced(LogLevel.INFO, 'Console', String(args[0]), ...args.slice(1))
    }
  }

  console.debug = (...args: any[]) => {
    if (args.length > 0) {
      logMessageEnhanced(LogLevel.DEBUG, 'Console', String(args[0]), ...args.slice(1))
    }
  }

  console.info = (...args: any[]) => {
    if (args.length > 0) {
      logMessageEnhanced(LogLevel.INFO, 'Console', String(args[0]), ...args.slice(1))
    }
  }

  console.warn = (...args: any[]) => {
    if (args.length > 0) {
      logMessageEnhanced(LogLevel.WARN, 'Console', String(args[0]), ...args.slice(1))
    }
  }

  console.error = (...args: any[]) => {
    if (args.length > 0) {
      logMessageEnhanced(LogLevel.ERROR, 'Console', String(args[0]), ...args.slice(1))
    }
  }

  // Store original console for emergency debugging
  ;(window as any).__ORIGINAL_CONSOLE__ = originalConsole

  // Emergency access function (only in development or with special flag)
  ;(window as any).__ENABLE_DEBUG_CONSOLE__ = () => {
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('yyc3-debug-mode') === 'true') {
      Object.assign(console, originalConsole)
      console.warn('🔓 Debug console enabled - use with caution!')
    }
  }
}

/* ================================================================
   Export Enhanced Functions
   ================================================================ */

export { flushRemoteLogs }

// Export types
export type { LoggerConfig }