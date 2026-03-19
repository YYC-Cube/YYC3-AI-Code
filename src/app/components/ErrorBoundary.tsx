/**
 * @file ErrorBoundary.tsx
 * @description 高可用错误边界系统 — 全局 + 面板级分层错误捕获、自动恢复、降级 UI、错误上报、崩溃隔离
 *   行业级实现：React Error Boundary + 指数退避重试 + 错误聚合 + 用户友好降级界面
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags error-boundary,high-availability,recovery,fault-tolerance,crash-isolation
 */

import React, { Component, type ReactNode, type ErrorInfo, useState, useCallback, useEffect, useRef } from 'react';
import { AlertTriangle, RotateCcw, Home, Copy, ChevronDown, ChevronUp, Bug, Shield, Zap } from 'lucide-react';

/* ================================================================
   Error Telemetry — 结构化错误收集与上报
   ================================================================ */

export interface ErrorRecord {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  componentStack?: string;
  source: 'boundary' | 'unhandled' | 'promise' | 'network' | 'crdt' | 'ai';
  severity: 'warning' | 'error' | 'fatal';
  context?: Record<string, any>;
  recovered: boolean;
  recoveryAttempts: number;
}

class ErrorTelemetry {
  private errors: ErrorRecord[] = [];
  private maxErrors = 100;
  private listeners: Set<(errors: ErrorRecord[]) => void> = new Set();
  private readonly STORAGE_KEY = 'yyc3-error-telemetry';

  constructor() {
    // Load persisted errors
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) this.errors = JSON.parse(raw).slice(-this.maxErrors);
    } catch { /* ignore */ }
  }

  report(error: Omit<ErrorRecord, 'id' | 'timestamp'>) {
    const record: ErrorRecord = {
      ...error,
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };

    this.errors.push(record);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Persist
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errors.slice(-50)));
    } catch { /* quota */ }

    // Notify listeners
    this.listeners.forEach(cb => cb([...this.errors]));

    // Console output for dev
    const prefix = record.severity === 'fatal' ? '🔴' : record.severity === 'error' ? '🟠' : '🟡';
    console.warn(`${prefix} [ErrorTelemetry] [${record.source}] ${record.message}`);

    return record;
  }

  getErrors(): ErrorRecord[] {
    return [...this.errors];
  }

  getRecentErrors(count: number = 10): ErrorRecord[] {
    return this.errors.slice(-count);
  }

  getErrorRate(windowMs: number = 60_000): number {
    const cutoff = Date.now() - windowMs;
    return this.errors.filter(e => e.timestamp > cutoff).length;
  }

  clearErrors() {
    this.errors = [];
    try { localStorage.removeItem(this.STORAGE_KEY); } catch { /* */ }
    this.listeners.forEach(cb => cb([]));
  }

  subscribe(cb: (errors: ErrorRecord[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const errorTelemetry = new ErrorTelemetry();

/* ================================================================
   Circuit Breaker — API/WS 熔断器
   ================================================================ */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  /** 触发熔断的失败阈值 */
  failureThreshold: number;
  /** 熔断恢复超时（ms） */
  recoveryTimeout: number;
  /** 半开状态最大尝试次数 */
  halfOpenMaxAttempts: number;
  /** 滑动窗口大小（ms）用于失败计数 */
  windowSize: number;
}

export class CircuitBreaker {
  state: CircuitState = 'closed';
  private failures: number[] = []; // timestamps
  private successCount = 0;
  private lastStateChange = Date.now();
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;
  private halfOpenAttempts = 0;
  private config: CircuitBreakerConfig;
  private listeners: Set<(state: CircuitState) => void> = new Set();

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      recoveryTimeout: config.recoveryTimeout ?? 30_000,
      halfOpenMaxAttempts: config.halfOpenMaxAttempts ?? 3,
      windowSize: config.windowSize ?? 60_000,
    };
  }

  /** 检查是否允许通过（closed/half-open 允许，open 阻断） */
  canPass(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'half-open') {
      return this.halfOpenAttempts < this.config.halfOpenMaxAttempts;
    }
    return false; // open
  }

  /** 记录成功 */
  recordSuccess() {
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.halfOpenMaxAttempts) {
        this.transitionTo('closed');
      }
    }
    // In closed state, success is a no-op
  }

  /** 记录失败 */
  recordFailure() {
    const now = Date.now();
    this.failures.push(now);

    // Clean old failures outside window
    const cutoff = now - this.config.windowSize;
    this.failures = this.failures.filter(t => t > cutoff);

    if (this.state === 'half-open') {
      // Failure in half-open → back to open
      this.transitionTo('open');
    } else if (this.state === 'closed') {
      if (this.failures.length >= this.config.failureThreshold) {
        this.transitionTo('open');
      }
    }
  }

  /** 手动重置为关闭状态 */
  reset() {
    if (this.recoveryTimer) { clearTimeout(this.recoveryTimer); this.recoveryTimer = null; }
    this.failures = [];
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.transitionTo('closed');
  }

  /** 获取统计信息 */
  getStats() {
    const now = Date.now();
    const cutoff = now - this.config.windowSize;
    return {
      state: this.state,
      recentFailures: this.failures.filter(t => t > cutoff).length,
      lastStateChange: this.lastStateChange,
      timeSinceLastChange: now - this.lastStateChange,
      halfOpenAttempts: this.halfOpenAttempts,
    };
  }

  onChange(cb: (state: CircuitState) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private transitionTo(newState: CircuitState) {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    if (this.recoveryTimer) { clearTimeout(this.recoveryTimer); this.recoveryTimer = null; }

    if (newState === 'open') {
      this.halfOpenAttempts = 0;
      this.successCount = 0;
      // Auto-transition to half-open after recovery timeout
      this.recoveryTimer = setTimeout(() => {
        this.transitionTo('half-open');
      }, this.config.recoveryTimeout);

      errorTelemetry.report({
        message: `Circuit breaker opened (${this.failures.length} failures in window)`,
        source: 'network',
        severity: 'warning',
        recovered: false,
        recoveryAttempts: 0,
        context: { oldState, failureCount: this.failures.length },
      });
    } else if (newState === 'half-open') {
      this.halfOpenAttempts = 0;
      this.successCount = 0;
    } else if (newState === 'closed') {
      this.failures = [];
      this.successCount = 0;
      this.halfOpenAttempts = 0;
    }

    this.listeners.forEach(cb => cb(newState));
  }

  destroy() {
    if (this.recoveryTimer) clearTimeout(this.recoveryTimer);
    this.listeners.clear();
  }
}

// Global circuit breakers
export const apiCircuitBreaker = new CircuitBreaker({ failureThreshold: 5, recoveryTimeout: 30_000 });
export const wsCircuitBreaker = new CircuitBreaker({ failureThreshold: 3, recoveryTimeout: 15_000 });
export const aiCircuitBreaker = new CircuitBreaker({ failureThreshold: 3, recoveryTimeout: 60_000 });

/* ================================================================
   Global Error Handlers — 捕获未处理的异常和 Promise 拒绝
   ================================================================ */

let _globalHandlersInstalled = false;

export function installGlobalErrorHandlers() {
  if (_globalHandlersInstalled) return;
  _globalHandlersInstalled = true;

  // Unhandled errors
  window.addEventListener('error', (event) => {
    // Ignore ResizeObserver loop errors (benign)
    if (event.message?.includes('ResizeObserver')) return;

    errorTelemetry.report({
      message: event.message || 'Unhandled error',
      stack: event.error?.stack,
      source: 'unhandled',
      severity: 'error',
      recovered: false,
      recoveryAttempts: 0,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason?.toString() || 'Unhandled promise rejection';
    errorTelemetry.report({
      message,
      stack: event.reason?.stack,
      source: 'promise',
      severity: 'error',
      recovered: false,
      recoveryAttempts: 0,
    });
  });
}

/* ================================================================
   React Error Boundary — 分层错误捕获与恢复
   ================================================================ */

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 错误边界级别 */
  level: 'app' | 'route' | 'panel' | 'widget';
  /** 自定义降级 UI */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** 自动恢复间隔（ms），0 = 禁用 */
  autoRecoveryMs?: number;
  /** 最大自动恢复尝试 */
  maxAutoRecovery?: number;
  /** 出错时回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 恢复时回调 */
  onRecovery?: () => void;
  /** 组件名称（用于日志） */
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempts: number;
  lastErrorTime: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;

  static defaultProps = {
    level: 'panel' as const,
    autoRecoveryMs: 0,
    maxAutoRecovery: 3,
  };

  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    recoveryAttempts: 0,
    lastErrorTime: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, lastErrorTime: Date.now() };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    const severity = this.props.level === 'app' ? 'fatal' : this.props.level === 'route' ? 'error' : 'warning';

    errorTelemetry.report({
      message: `[${this.props.level}] ${this.props.name || 'Unknown'}: ${error.message}`,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      source: 'boundary',
      severity,
      recovered: false,
      recoveryAttempts: this.state.recoveryAttempts,
      context: { level: this.props.level, name: this.props.name },
    });

    this.props.onError?.(error, errorInfo);

    // Auto-recovery
    const autoMs = this.props.autoRecoveryMs;
    const maxAttempts = this.props.maxAutoRecovery ?? 3;
    if (autoMs && autoMs > 0 && this.state.recoveryAttempts < maxAttempts) {
      this.scheduleRecovery(autoMs);
    }
  }

  override componentWillUnmount() {
    if (this.recoveryTimer) clearTimeout(this.recoveryTimer);
  }

  private scheduleRecovery(ms: number) {
    if (this.recoveryTimer) clearTimeout(this.recoveryTimer);
    // Exponential backoff
    const delay = ms * Math.pow(2, this.state.recoveryAttempts);
    this.recoveryTimer = setTimeout(() => {
      this.handleReset();
    }, Math.min(delay, 60_000));
  }

  handleReset = () => {
    if (this.recoveryTimer) clearTimeout(this.recoveryTimer);
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: prev.recoveryAttempts + 1,
    }));
    this.props.onRecovery?.();
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Custom fallback
    if (this.props.fallback) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error!, this.handleReset);
      }
      return this.props.fallback;
    }

    // Default fallback UI based on level
    return (
      <ErrorFallbackUI
        level={this.props.level}
        error={this.state.error!}
        errorInfo={this.state.errorInfo}
        recoveryAttempts={this.state.recoveryAttempts}
        maxAutoRecovery={this.props.maxAutoRecovery ?? 3}
        onReset={this.handleReset}
        name={this.props.name}
      />
    );
  }
}

/* ================================================================
   Error Fallback UI — 降级界面
   ================================================================ */

function ErrorFallbackUI({
  level,
  error,
  errorInfo,
  recoveryAttempts,
  maxAutoRecovery,
  onReset,
  name,
}: {
  level: 'app' | 'route' | 'panel' | 'widget';
  error: Error;
  errorInfo: ErrorInfo | null;
  recoveryAttempts: number;
  maxAutoRecovery: number;
  onReset: () => void;
  name?: string;
}) {
  const [showStack, setShowStack] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyError = useCallback(() => {
    const text = [
      `Error: ${error.message}`,
      `Level: ${level}`,
      `Component: ${name || 'Unknown'}`,
      `Recovery Attempts: ${recoveryAttempts}`,
      `Stack: ${error.stack || 'N/A'}`,
      `Component Stack: ${errorInfo?.componentStack || 'N/A'}`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [error, level, name, recoveryAttempts, errorInfo]);

  // Widget-level: compact inline error
  if (level === 'widget') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/15 rounded-lg">
        <AlertTriangle size={12} className="text-red-400/60 shrink-0" />
        <span className="text-[10px] text-red-300/60 truncate">{error.message}</span>
        <button onClick={onReset}
          className="ml-auto shrink-0 p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/50 transition-colors">
          <RotateCcw size={10} />
        </button>
      </div>
    );
  }

  // Panel-level: medium card
  if (level === 'panel') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[120px] p-4 bg-[#12131a]">
        <div className="flex flex-col items-center gap-3 max-w-[320px]">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Bug size={18} className="text-red-400/70" />
          </div>
          <div className="text-center">
            <p className="text-[11px] text-white/50" style={{ fontWeight: 600 }}>{name || '面板'}发生错误</p>
            <p className="text-[9px] text-white/25 mt-1 line-clamp-2">{error.message}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] hover:bg-indigo-500/25 transition-colors"
              style={{ fontWeight: 500 }}>
              <RotateCcw size={10} /> 重试
            </button>
            <button onClick={copyError}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/30 text-[10px] hover:bg-white/[0.08] transition-colors">
              <Copy size={10} /> {copied ? '已复制' : '复制错误'}
            </button>
          </div>
          {recoveryAttempts > 0 && (
            <p className="text-[8px] text-white/15">已自动恢复 {recoveryAttempts}/{maxAutoRecovery} 次</p>
          )}
        </div>
      </div>
    );
  }

  // App/Route-level: full page error
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0b0f] text-white/80">
      <div className="flex flex-col items-center gap-6 max-w-[520px] px-8">
        {/* Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield size={36} className="text-red-400/80" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <AlertTriangle size={10} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-[16px] text-white/70" style={{ fontWeight: 700 }}>
            {level === 'app' ? '应用发生严重错误' : '当前页面发生错误'}
          </h2>
          <p className="text-[12px] text-white/35 mt-2 max-w-[400px]">
            {level === 'app'
              ? '应用遇到了无法自动恢复的错误。您的数据已通过 CRDT 本地持久化保存。'
              : '此页面遇到错误，您可以尝试重新加载或返回首页。'}
          </p>
        </div>

        {/* Error Message */}
        <div className="w-full bg-red-500/5 border border-red-500/15 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-red-400/60 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-red-300/70" style={{ fontWeight: 500 }}>{error.message}</p>
              {recoveryAttempts > 0 && (
                <p className="text-[9px] text-red-400/40 mt-1">
                  <Zap size={8} className="inline mr-1" />
                  已尝试自动恢复 {recoveryAttempts} 次
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[12px] hover:bg-indigo-500/30 transition-colors"
            style={{ fontWeight: 600 }}>
            <RotateCcw size={14} /> 重新加载
          </button>
          <button onClick={() => { window.location.href = '/'; }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 text-[12px] hover:bg-white/[0.08] transition-colors"
            style={{ fontWeight: 500 }}>
            <Home size={14} /> 返回首页
          </button>
          <button onClick={copyError}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/25 text-[12px] hover:bg-white/[0.06] transition-colors">
            <Copy size={12} /> {copied ? '已复制' : '复制'}
          </button>
        </div>

        {/* Stack trace toggle */}
        <button onClick={() => setShowStack(!showStack)}
          className="flex items-center gap-1 text-[10px] text-white/15 hover:text-white/30 transition-colors">
          {showStack ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showStack ? '隐藏' : '显示'}错误堆栈
        </button>

        {showStack && (
          <div className="w-full max-h-[200px] overflow-auto bg-black/40 border border-white/[0.06] rounded-lg p-3" style={{ scrollbarWidth: 'thin' }}>
            <pre className="text-[9px] text-white/20 whitespace-pre-wrap break-all" style={{ fontFamily: 'monospace' }}>
              {error.stack || 'No stack trace available'}
              {errorInfo?.componentStack && (
                <>
                  {'\n\n--- Component Stack ---\n'}
                  {errorInfo.componentStack}
                </>
              )}
            </pre>
          </div>
        )}

        {/* Brand */}
        <p className="text-[9px] text-white/10 mt-4">
          YanYuCloudCube (YYC3) v1.4.0 &middot; 错误已记录至本地遥测日志
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   useHealthMonitor — 系统健康监控 Hook
   ================================================================ */

export interface HealthStatus {
  api: 'healthy' | 'degraded' | 'down' | 'unknown';
  ws: 'connected' | 'reconnecting' | 'disconnected' | 'unknown';
  crdt: 'synced' | 'syncing' | 'conflict' | 'disconnected' | 'unknown';
  memory: 'normal' | 'warning' | 'critical' | 'unknown';
  errors: 'clear' | 'elevated' | 'critical';
  overall: 'healthy' | 'degraded' | 'critical';
}

export function useHealthMonitor(): {
  health: HealthStatus;
  errorRate: number;
  memoryUsage: number | null;
  recentErrors: ErrorRecord[];
  clearErrors: () => void;
} {
  const [health, setHealth] = useState<HealthStatus>({
    api: 'unknown',
    ws: 'unknown',
    crdt: 'unknown',
    memory: 'unknown',
    errors: 'clear',
    overall: 'healthy',
  });
  const [errorRate, setErrorRate] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const [recentErrors, setRecentErrors] = useState<ErrorRecord[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const updateHealth = () => {
      // Error rate
      const rate = errorTelemetry.getErrorRate(60_000);
      setErrorRate(rate);
      setRecentErrors(errorTelemetry.getRecentErrors(10));

      // Memory (if available)
      let memStatus: HealthStatus['memory'] = 'unknown';
      let memPct: number | null = null;
      const perf = performance as any;
      if (perf.memory) {
        memPct = perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit;
        setMemoryUsage(memPct);
        if (memPct > 0.9) memStatus = 'critical';
        else if (memPct > 0.7) memStatus = 'warning';
        else memStatus = 'normal';
      }

      // API circuit breaker
      const apiState = apiCircuitBreaker.state;
      const apiHealth: HealthStatus['api'] =
        apiState === 'closed' ? 'healthy' :
        apiState === 'half-open' ? 'degraded' : 'down';

      // WS circuit breaker
      const wsState = wsCircuitBreaker.state;
      const wsHealth: HealthStatus['ws'] =
        wsState === 'closed' ? 'connected' :
        wsState === 'half-open' ? 'reconnecting' : 'disconnected';

      // Error status
      const errorStatus: HealthStatus['errors'] =
        rate >= 10 ? 'critical' :
        rate >= 3 ? 'elevated' : 'clear';

      // Overall
      const overall: HealthStatus['overall'] =
        (apiHealth === 'down' || memStatus === 'critical' || errorStatus === 'critical') ? 'critical' :
        (apiHealth === 'degraded' || memStatus === 'warning' || errorStatus === 'elevated' || wsHealth === 'reconnecting') ? 'degraded' :
        'healthy';

      setHealth({
        api: apiHealth,
        ws: wsHealth,
        crdt: 'unknown', // Updated by CRDT hook
        memory: memStatus,
        errors: errorStatus,
        overall,
      });
    };

    updateHealth();
    intervalRef.current = setInterval(updateHealth, 5_000);

    // Subscribe to error changes
    const unsub = errorTelemetry.subscribe(() => updateHealth());

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      unsub();
    };
  }, []);

  const clearErrors = useCallback(() => {
    errorTelemetry.clearErrors();
    setRecentErrors([]);
    setErrorRate(0);
  }, []);

  return { health, errorRate, memoryUsage, recentErrors, clearErrors };
}

/* ================================================================
   HealthIndicator — 状态栏健康指示器组件
   ================================================================ */

export function HealthIndicator({ className = '' }: { className?: string }) {
  const { health, errorRate, memoryUsage } = useHealthMonitor();

  const color =
    health.overall === 'healthy' ? 'bg-emerald-500' :
    health.overall === 'degraded' ? 'bg-amber-500' :
    'bg-red-500';

  const label =
    health.overall === 'healthy' ? '系统正常' :
    health.overall === 'degraded' ? '部分降级' :
    '系统异常';

  return (
    <div className={`flex items-center gap-1.5 ${className}`} title={`${label} | 错误率: ${errorRate}/min${memoryUsage !== null ? ` | 内存: ${(memoryUsage * 100).toFixed(0)}%` : ''}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${color} ${health.overall !== 'healthy' ? 'animate-pulse' : ''}`} />
      <span className="text-[9px] text-white/25">{label}</span>
    </div>
  );
}
