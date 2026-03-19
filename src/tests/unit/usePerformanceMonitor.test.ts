/**
 * @file usePerformanceMonitor.test.ts
 * @description usePerformanceMonitor 单元测试 — 性能评分算法、自适应降级决策、指标计算
 * @priority P0
 */

import { describe, it, expect } from 'vitest';
import { resetLocalStorage } from '../setup';

// 导入实际的函数和类型
import {
  usePerformanceMonitor,
  calculateLevel,
  calculateDegradation,
  type PerformanceMetrics,
  type PerformanceLevel,
  type AdaptiveDegradation,
} from '../../app/hooks/usePerformanceMonitor';

// ── 创建 metrics 工厂 ──

function makeMetrics(overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics {
  return {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    inp: null,
    ttfb: null,
    fps: 60,
    memoryUsage: null,
    memoryMB: null,
    longTaskCount: 0,
    lastLongTaskDuration: null,
    domNodeCount: 1000,
    estimatedListeners: 300,
    ...overrides,
  };
}

/* ================================================================
   calculateLevel 评分算法测试
   ================================================================ */

describe('calculateLevel — 性能评分', () => {
  it('TC-PL-001: 理想指标 → excellent', () => {
    expect(calculateLevel(makeMetrics({ fps: 60 }))).toBe('excellent');
  });

  it('TC-PL-002: fps=55, 轻微内存压力 → good', () => {
    expect(calculateLevel(makeMetrics({ fps: 55, memoryUsage: 0.65 }))).toBe('good');
  });

  it('TC-PL-003: fps=45, 中等内存 + 大 LCP → fair', () => {
    const level = calculateLevel(makeMetrics({ fps: 45, memoryUsage: 0.78, lcp: 3000 }));
    expect(['fair', 'good']).toContain(level); // 边界区间
  });

  it('TC-PL-004: fps=25, 高内存 → poor', () => {
    expect(calculateLevel(makeMetrics({ fps: 25, memoryUsage: 0.8, longTaskCount: 15 }))).toBe('poor');
  });

  it('TC-PL-005: fps=15, 极高内存 + 大量长任务 → critical', () => {
    expect(calculateLevel(makeMetrics({
      fps: 15,
      memoryUsage: 0.95,
      longTaskCount: 25,
      lcp: 5000,
      domNodeCount: 6000,
      cls: 0.3,
    }))).toBe('critical');
  });

  it('TC-PL-006: FPS < 20 扣 40 分', () => {
    const level = calculateLevel(makeMetrics({ fps: 10 }));
    // score = 100 - 40 = 60, ∈ [45,65) → fair
    expect(level).toBe('fair');
  });

  it('TC-PL-007: FPS 20~29 扣 20 分', () => {
    const level = calculateLevel(makeMetrics({ fps: 25 }));
    // score = 100 - 20 = 80, ∈ [65,85) → good
    expect(level).toBe('good');
  });

  it('TC-PL-008: 内存 > 90% 扣 35 分', () => {
    const level = calculateLevel(makeMetrics({ memoryUsage: 0.95 }));
    // score = 100 - 35 = 65 → good (边界)
    expect(level).toBe('good');
  });

  it('TC-PL-009: DOM > 5000 扣 10 分', () => {
    const level = calculateLevel(makeMetrics({ domNodeCount: 6000 }));
    // score = 90 → good
    expect(level).toBe('good');
  });

  it('TC-PL-010: CLS > 0.25 扣 10 分', () => {
    const level = calculateLevel(makeMetrics({ cls: 0.3 }));
    expect(level).toBe('good');
  });

  it('TC-PL-011: 多项指标同时恶化叠加扣分', () => {
    const level = calculateLevel(makeMetrics({
      fps: 10,      // -40
      memoryUsage: 0.95, // -35
      longTaskCount: 25, // -20
      lcp: 5000,    // -15
      domNodeCount: 6000, // -10
      cls: 0.3,     // -10
    }));
    // score = 100 - 40 - 35 - 20 - 15 - 10 - 10 = -30 → critical
    expect(level).toBe('critical');
  });

  it('TC-PL-012: null 指标不参与扣分', () => {
    const level = calculateLevel(makeMetrics({
      fps: 30,
      memoryUsage: null,
      lcp: null,
    }));
    // 只扣 FPS -20，score = 80 → good
    expect(level).toBe('good');
  });
});

/* ================================================================
   calculateDegradation 降级决策测试
   ================================================================ */

describe('calculateDegradation — 自适应降级', () => {
  it('TC-AD-001: excellent 级别 — 不降级', () => {
    const result = calculateDegradation(makeMetrics(), 'excellent');
    expect(result.disableAnimations).toBe(false);
    expect(result.disableMinimap).toBe(false);
    expect(result.disableRemoteCursors).toBe(false);
  });

  it('TC-AD-002: good 级别 — 不降级', () => {
    const result = calculateDegradation(makeMetrics(), 'good');
    expect(result.disableAnimations).toBe(false);
    expect(result.disableMinimap).toBe(false);
  });

  it('TC-AD-003: fair 级别 — 不降级', () => {
    const result = calculateDegradation(makeMetrics(), 'fair');
    expect(result.disableAnimations).toBe(false);
    expect(result.disableMinimap).toBe(false);
  });

  it('TC-AD-004: poor 级别 — 禁用动画 + 降预览频率 + 降广播频率', () => {
    const result = calculateDegradation(makeMetrics(), 'poor');
    expect(result.disableAnimations).toBe(true);
    expect(result.disableMinimap).toBe(false);
    expect(result.reducePreviewFrequency).toBe(true);
    expect(result.disableRemoteCursors).toBe(false);
    expect(result.reduceAwarenessBroadcast).toBe(true);
  });

  it('TC-AD-005: critical 级别 — 全面降级', () => {
    const result = calculateDegradation(makeMetrics(), 'critical');
    expect(result.disableAnimations).toBe(true);
    expect(result.disableMinimap).toBe(true);
    expect(result.reducePreviewFrequency).toBe(true);
    expect(result.disableRemoteCursors).toBe(true);
    expect(result.reduceAwarenessBroadcast).toBe(true);
  });
});

/* ================================================================
   usePerformanceMonitor Hook 集成测试
   ================================================================ */

describe('usePerformanceMonitor — Hook 集成', () => {
  // 注意：这里只测试 Hook 的基本功能，详细的性能指标采集测试
  // 需要 mock PerformanceObserver 等环境，这里不做覆盖

  it('TC-HOOK-001: Hook 返回正确的结构', () => {
    const { renderHook } = require('@testing-library/react');
    const { result } = renderHook(() => usePerformanceMonitor());

    expect(result.current).toHaveProperty('metrics');
    expect(result.current).toHaveProperty('level');
    expect(result.current).toHaveProperty('degradation');
    expect(result.current).toHaveProperty('reset');

    expect(typeof result.current.metrics.fps).toBe('number');
    expect(['excellent', 'good', 'fair', 'poor', 'critical']).toContain(result.current.level);
  });

  it('TC-HOOK-002: reset 函数重置指标', () => {
    const { renderHook, act } = require('@testing-library/react');
    const { result } = renderHook(() => usePerformanceMonitor());

    act(() => {
      result.current.reset();
    });

    expect(result.current.metrics.fps).toBe(60);
    expect(result.current.metrics.longTaskCount).toBe(0);
  });

  it('TC-HOOK-003: localStorage 持久化（setup 后重置）', () => {
    resetLocalStorage();
    const { renderHook } = require('@testing-library/react');
    renderHook(() => usePerformanceMonitor());

    // 检查是否写入了 localStorage
    const stored = localStorage.getItem('yyc3-perf-metrics');
    // 由于性能监控是异步的，这里可能还没有写入数据
    // 我们只检查键的存在
    expect(localStorage.getItem('yyc3-perf-metrics')).toBeTruthy();
  });
});
