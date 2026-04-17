/**
 * @file logger.ts
 * @description Centralized logging utility — levels, module tags, timestamps, structured output
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

// ============================================
// YYC³ Global Unified Logger
// ============================================
// Centralized logging utility for the entire application.
// Supports log levels, module tagging, timestamps,
// and structured output for debugging and monitoring.

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: unknown
}

// Global log level — can be changed at runtime
let globalLogLevel: LogLevel = LogLevel.DEBUG

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