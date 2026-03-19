/**
 * @file performance.test.ts
 * @description 性能测试用例 — 内存泄漏检测、大数据渲染、高频操作、CircuitBreaker 吞吐量
 * @priority P1
 * @framework Vitest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resetLocalStorage } from '../setup';
import { CircuitBreaker } from '../../app/components/ErrorBoundary';

describe('性能测试', () => {

  /* ── CircuitBreaker 高频操作 ── */

  describe('CircuitBreaker 高频负载', () => {
    it('TC-PERF-CB-001: 10000 次 recordFailure 不溢出', () => {
      const cb = new CircuitBreaker({ failureThreshold: 100, windowSize: 60_000 });
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        cb.recordFailure();
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000); // < 1s
      cb.destroy();
    });

    it('TC-PERF-CB-002: 10000 次 canPass 查询 < 100ms', () => {
      const cb = new CircuitBreaker();
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        cb.canPass();
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
      cb.destroy();
    });

    it('TC-PERF-CB-003: 滑动窗口清理不累积旧数据', () => {
      vi.useFakeTimers();
      const cb = new CircuitBreaker({ failureThreshold: 1000, windowSize: 1000 });
      // 填入 500 次失败
      for (let i = 0; i < 500; i++) cb.recordFailure();
      // 推进时间，让旧数据过期
      vi.advanceTimersByTime(2000);
      // 再记录一次，触发清理
      cb.recordFailure();
      const stats = cb.getStats();
      // 旧的 500 次应已被清理
      expect(stats.recentFailures).toBeLessThanOrEqual(2);
      cb.destroy();
      vi.useRealTimers();
    });
  });

  /* ── ErrorTelemetry 内存限制 ── */

  describe('ErrorTelemetry 内存管理', () => {
    it('TC-PERF-ET-001: 超过 100 条自动截断', async () => {
      const { errorTelemetry } = await import('../../app/components/ErrorBoundary');
      errorTelemetry.clearErrors();
      for (let i = 0; i < 150; i++) {
        errorTelemetry.report({
          message: `error-${i}`,
          source: 'unhandled',
          severity: 'error',
          recovered: false,
          recoveryAttempts: 0,
        });
      }
      expect(errorTelemetry.getErrors().length).toBeLessThanOrEqual(100);
      errorTelemetry.clearErrors();
    });

    it('TC-PERF-ET-002: localStorage 持久化限制 50 条', async () => {
      const { errorTelemetry } = await import('../../app/components/ErrorBoundary');
      errorTelemetry.clearErrors();
      for (let i = 0; i < 80; i++) {
        errorTelemetry.report({
          message: `persist-${i}`,
          source: 'unhandled',
          severity: 'warning',
          recovered: false,
          recoveryAttempts: 0,
        });
      }
      const raw = localStorage.getItem('yyc3-error-telemetry');
      if (raw) {
        const persisted = JSON.parse(raw);
        expect(persisted.length).toBeLessThanOrEqual(50);
      }
      errorTelemetry.clearErrors();
    });
  });

  /* ── crossRouteBridge 大数据 ── */

  describe('crossRouteBridge 大数据传输', () => {
    it('TC-PERF-BRG-001: 传输 1MB 代码不报错', async () => {
      const { bridgeSendToDesigner, bridgeReadForDesigner, bridgeClearForDesigner } = await import('../../app/crossRouteBridge');
      const largeCode = 'a'.repeat(1_000_000);
      expect(() => {
        bridgeSendToDesigner({ code: largeCode, language: 'typescript' });
      }).not.toThrow();
      const payload = bridgeReadForDesigner();
      expect(payload?.code.length).toBe(1_000_000);
      bridgeClearForDesigner();
    });
  });

  /* ── parseCodeToComponents 大文件 ── */

  describe('parseCodeToComponents 性能', () => {
    it('TC-PERF-PCC-001: 解析 5000 行代码 < 500ms', async () => {
      const { parseCodeToComponents } = await import('../../app/crossRouteBridge');
      const lines = [];
      for (let i = 0; i < 5000; i++) {
        lines.push(`export function Component${i}() { return <Button label="btn-${i}" />; }`);
      }
      const code = lines.join('\n');
      const start = performance.now();
      const result = parseCodeToComponents(code);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
      expect(result).toBeDefined();
      expect(result!.length).toBeGreaterThan(100);
    });
  });

  /* ── 性能评分计算 ── */

  describe('性能评分计算吞吐量', () => {
    it('TC-PERF-CALC-001: 10000 次 calculateLevel 调用 < 100ms', () => {
      // 内联简化版算法
      function calculateLevel(fps: number, mem: number, lt: number): string {
        let score = 100;
        if (fps < 20) score -= 40;
        else if (fps < 30) score -= 20;
        if (mem > 0.9) score -= 35;
        else if (mem > 0.75) score -= 15;
        if (lt > 20) score -= 20;
        else if (lt > 10) score -= 10;
        if (score >= 85) return 'excellent';
        if (score >= 65) return 'good';
        if (score >= 45) return 'fair';
        if (score >= 25) return 'poor';
        return 'critical';
      }

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        calculateLevel(Math.random() * 60, Math.random(), Math.floor(Math.random() * 30));
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
