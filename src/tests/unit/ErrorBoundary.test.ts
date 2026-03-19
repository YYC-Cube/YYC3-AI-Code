/**
 * @file ErrorBoundary.test.ts
 * @description ErrorBoundary 核心类单元测试 — ErrorTelemetry + CircuitBreaker 状态机 + installGlobalErrorHandlers
 * @priority P0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetLocalStorage } from '../setup';

// 直接导入类/实例进行单元测试
import {
  errorTelemetry,
  CircuitBreaker,
  apiCircuitBreaker,
  wsCircuitBreaker,
  aiCircuitBreaker,
  type CircuitState,
  type ErrorRecord,
} from '../../app/components/ErrorBoundary';

/* ================================================================
   ErrorTelemetry 单元测试
   ================================================================ */

describe('ErrorTelemetry', () => {
  beforeEach(() => {
    errorTelemetry.clearErrors();
    resetLocalStorage();
  });

  it('TC-ET-001: report() 返回带有唯一 id 和时间戳的 ErrorRecord', () => {
    const record = errorTelemetry.report({
      message: 'test error',
      source: 'unhandled',
      severity: 'error',
      recovered: false,
      recoveryAttempts: 0,
    });
    expect(record.id).toMatch(/^err-/);
    expect(record.timestamp).toBeGreaterThan(0);
    expect(record.message).toBe('test error');
  });

  it('TC-ET-002: getErrors() 返回所有已记录的错误', () => {
    errorTelemetry.report({ message: 'err1', source: 'boundary', severity: 'warning', recovered: false, recoveryAttempts: 0 });
    errorTelemetry.report({ message: 'err2', source: 'network', severity: 'error', recovered: true, recoveryAttempts: 1 });
    const errors = errorTelemetry.getErrors();
    expect(errors.length).toBe(2);
    expect(errors[0].message).toBe('err1');
    expect(errors[1].message).toBe('err2');
  });

  it('TC-ET-003: getRecentErrors(n) 只返回最近 n 条', () => {
    for (let i = 0; i < 20; i++) {
      errorTelemetry.report({ message: `err-${i}`, source: 'unhandled', severity: 'error', recovered: false, recoveryAttempts: 0 });
    }
    const recent = errorTelemetry.getRecentErrors(5);
    expect(recent.length).toBe(5);
    expect(recent[4].message).toBe('err-19');
  });

  it('TC-ET-004: 超过 maxErrors(100) 时自动截断', () => {
    for (let i = 0; i < 120; i++) {
      errorTelemetry.report({ message: `err-${i}`, source: 'unhandled', severity: 'error', recovered: false, recoveryAttempts: 0 });
    }
    expect(errorTelemetry.getErrors().length).toBeLessThanOrEqual(100);
  });

  it('TC-ET-005: getErrorRate() 按时间窗口计算错误率', () => {
    errorTelemetry.report({ message: 'now', source: 'unhandled', severity: 'error', recovered: false, recoveryAttempts: 0 });
    const rate = errorTelemetry.getErrorRate(60_000);
    expect(rate).toBeGreaterThanOrEqual(1);
  });

  it('TC-ET-006: clearErrors() 清空所有记录并通知订阅者', () => {
    const cb = vi.fn();
    errorTelemetry.subscribe(cb);
    errorTelemetry.report({ message: 'test', source: 'unhandled', severity: 'error', recovered: false, recoveryAttempts: 0 });
    errorTelemetry.clearErrors();
    expect(errorTelemetry.getErrors().length).toBe(0);
    // subscribe callback should have been called (once for report, once for clear)
    expect(cb).toHaveBeenCalled();
  });

  it('TC-ET-007: subscribe() 返回 unsubscribe 函数', () => {
    const cb = vi.fn();
    const unsub = errorTelemetry.subscribe(cb);
    errorTelemetry.report({ message: 'test', source: 'boundary', severity: 'warning', recovered: false, recoveryAttempts: 0 });
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
    errorTelemetry.report({ message: 'test2', source: 'boundary', severity: 'warning', recovered: false, recoveryAttempts: 0 });
    expect(cb).toHaveBeenCalledTimes(1); // 不再被调用
  });

  it('TC-ET-008: report() 将数据持久化到 localStorage', () => {
    errorTelemetry.report({ message: 'persist-test', source: 'promise', severity: 'error', recovered: false, recoveryAttempts: 0 });
    const raw = localStorage.getItem('yyc3-error-telemetry');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.some((e: any) => e.message === 'persist-test')).toBe(true);
  });

  it('TC-ET-009: report() 正确设置 severity 字段', () => {
    const warn = errorTelemetry.report({ message: 'w', source: 'boundary', severity: 'warning', recovered: false, recoveryAttempts: 0 });
    const err = errorTelemetry.report({ message: 'e', source: 'boundary', severity: 'error', recovered: false, recoveryAttempts: 0 });
    const fatal = errorTelemetry.report({ message: 'f', source: 'boundary', severity: 'fatal', recovered: false, recoveryAttempts: 0 });
    expect(warn.severity).toBe('warning');
    expect(err.severity).toBe('error');
    expect(fatal.severity).toBe('fatal');
  });

  it('TC-ET-010: report() 可附带 context 和 stack', () => {
    const record = errorTelemetry.report({
      message: 'ctx',
      source: 'network',
      severity: 'error',
      recovered: false,
      recoveryAttempts: 0,
      stack: 'Error: at line 1',
      context: { path: '/api/test', method: 'GET' },
    });
    expect(record.stack).toBe('Error: at line 1');
    expect(record.context?.path).toBe('/api/test');
  });
});

/* ================================================================
   CircuitBreaker 状态机单元测试
   ================================================================ */

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000,
      halfOpenMaxAttempts: 2,
      windowSize: 10_000,
    });
  });

  afterEach(() => {
    cb.destroy();
  });

  it('TC-CB-001: 初始状态为 closed', () => {
    expect(cb.state).toBe('closed');
    expect(cb.canPass()).toBe(true);
  });

  it('TC-CB-002: 未达阈值时保持 closed', () => {
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe('closed');
    expect(cb.canPass()).toBe(true);
  });

  it('TC-CB-003: 达到阈值时转为 open', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe('open');
    expect(cb.canPass()).toBe(false);
  });

  it('TC-CB-004: open 状态下 canPass() 返回 false', () => {
    // Force open
    for (let i = 0; i < 5; i++) cb.recordFailure();
    expect(cb.canPass()).toBe(false);
  });

  it('TC-CB-005: open 后经过 recoveryTimeout 自动转为 half-open', async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) cb.recordFailure();
    expect(cb.state).toBe('open');

    vi.advanceTimersByTime(1100);
    expect(cb.state).toBe('half-open');
    expect(cb.canPass()).toBe(true);
    vi.useRealTimers();
  });

  it('TC-CB-006: half-open 成功足够次数后转为 closed', async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) cb.recordFailure();
    vi.advanceTimersByTime(1100);
    expect(cb.state).toBe('half-open');

    cb.recordSuccess();
    cb.recordSuccess();
    expect(cb.state).toBe('closed');
    vi.useRealTimers();
  });

  it('TC-CB-007: half-open 失败后重新回到 open', async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) cb.recordFailure();
    vi.advanceTimersByTime(1100);
    expect(cb.state).toBe('half-open');

    cb.recordFailure();
    expect(cb.state).toBe('open');
    vi.useRealTimers();
  });

  it('TC-CB-008: reset() 强制重置为 closed', () => {
    for (let i = 0; i < 5; i++) cb.recordFailure();
    expect(cb.state).toBe('open');
    cb.reset();
    expect(cb.state).toBe('closed');
    expect(cb.canPass()).toBe(true);
  });

  it('TC-CB-009: getStats() 返回正确统计', () => {
    cb.recordFailure();
    cb.recordFailure();
    const stats = cb.getStats();
    expect(stats.state).toBe('closed');
    expect(stats.recentFailures).toBe(2);
    expect(stats.timeSinceLastChange).toBeGreaterThanOrEqual(0);
  });

  it('TC-CB-010: onChange 订阅状态变更', () => {
    const states: CircuitState[] = [];
    cb.onChange((s) => states.push(s));
    for (let i = 0; i < 3; i++) cb.recordFailure();
    expect(states).toContain('open');
  });

  it('TC-CB-011: 滑动窗口外的旧失败不计入阈值', async () => {
    vi.useFakeTimers();
    cb.recordFailure();
    cb.recordFailure();
    // 等窗口超过
    vi.advanceTimersByTime(11_000);
    cb.recordFailure(); // 窗口内只有 1 次
    expect(cb.state).toBe('closed');
    vi.useRealTimers();
  });

  it('TC-CB-012: closed 状态下 recordSuccess 是 no-op', () => {
    cb.recordSuccess();
    expect(cb.state).toBe('closed');
  });

  it('TC-CB-013: destroy() 清除定时器和监听器', async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) cb.recordFailure();
    const listener = vi.fn();
    cb.onChange(listener);
    cb.destroy();
    vi.advanceTimersByTime(2000);
    // Destroy should have cleared the recovery timer; listener should not be called again
    expect(cb.state).toBe('open'); // stays open, no half-open transition
    vi.useRealTimers();
  });
});

/* ================================================================
   全局熔断器实例检查
   ================================================================ */

describe('Global Circuit Breaker Instances', () => {
  it('TC-GCB-001: apiCircuitBreaker 初始为 closed', () => {
    expect(apiCircuitBreaker.state).toBe('closed');
  });

  it('TC-GCB-002: wsCircuitBreaker 初始为 closed', () => {
    expect(wsCircuitBreaker.state).toBe('closed');
  });

  it('TC-GCB-003: aiCircuitBreaker 初始为 closed', () => {
    expect(aiCircuitBreaker.state).toBe('closed');
  });

  it('TC-GCB-004: 三个实例互相独立', () => {
    // 对 api 触发熔断不影响 ws
    for (let i = 0; i < 10; i++) apiCircuitBreaker.recordFailure();
    expect(wsCircuitBreaker.state).toBe('closed');
    apiCircuitBreaker.reset();
  });
});
