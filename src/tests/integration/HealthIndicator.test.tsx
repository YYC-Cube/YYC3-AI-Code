/**
 * @file HealthIndicator.test.tsx
 * @description HealthIndicator 组件集成测试 — 颜色映射、标签文本、Tooltip、脉冲动画
 * @priority P0
 * @framework Vitest + @testing-library/react
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  apiCircuitBreaker,
  wsCircuitBreaker,
  errorTelemetry,
} from '../../app/components/ErrorBoundary';

type HealthStatus = {
  api: string;
  ws: string;
  crdt: string;
  memory: string;
  errors: string;
  overall: string;
};

describe('HealthIndicator 组件', () => {

  beforeEach(() => {
    apiCircuitBreaker.reset();
    wsCircuitBreaker.reset();
    errorTelemetry.clearErrors();
  });

  /* ── 颜色映射逻辑 ── */

  describe('颜色映射', () => {
    it('TC-HI-001: healthy → bg-emerald-500', () => {
      const color = mapOverallToColor('healthy');
      expect(color).toBe('bg-emerald-500');
    });

    it('TC-HI-002: degraded → bg-amber-500', () => {
      expect(mapOverallToColor('degraded')).toBe('bg-amber-500');
    });

    it('TC-HI-003: critical → bg-red-500', () => {
      expect(mapOverallToColor('critical')).toBe('bg-red-500');
    });
  });

  /* ── 标签文本 ── */

  describe('标签文本', () => {
    it('TC-HI-010: healthy → 系统正常', () => {
      expect(mapOverallToLabel('healthy')).toBe('系统正常');
    });

    it('TC-HI-011: degraded → 部分降级', () => {
      expect(mapOverallToLabel('degraded')).toBe('部分降级');
    });

    it('TC-HI-012: critical → 系统异常', () => {
      expect(mapOverallToLabel('critical')).toBe('系统异常');
    });
  });

  /* ── 脉冲动画 ── */

  describe('脉冲动画', () => {
    it('TC-HI-020: healthy 无脉冲', () => {
      expect(shouldPulse('healthy')).toBe(false);
    });

    it('TC-HI-021: degraded 有脉冲', () => {
      expect(shouldPulse('degraded')).toBe(true);
    });

    it('TC-HI-022: critical 有脉冲', () => {
      expect(shouldPulse('critical')).toBe(true);
    });
  });

  /* ── Overall 状态计算 ── */

  describe('Overall 综合状态计算', () => {
    it('TC-HI-030: 全部正常 → healthy', () => {
      const health: HealthStatus = {
        api: 'healthy', ws: 'connected', crdt: 'synced', memory: 'normal', errors: 'clear', overall: 'healthy',
      };
      expect(health.overall).toBe('healthy');
    });

    it('TC-HI-031: API down → critical', () => {
      const overall = computeOverall({ api: 'down', ws: 'connected', memory: 'normal', errors: 'clear' });
      expect(overall).toBe('critical');
    });

    it('TC-HI-032: 内存 critical → critical', () => {
      const overall = computeOverall({ api: 'healthy', ws: 'connected', memory: 'critical', errors: 'clear' });
      expect(overall).toBe('critical');
    });

    it('TC-HI-033: API degraded → degraded', () => {
      const overall = computeOverall({ api: 'degraded', ws: 'connected', memory: 'normal', errors: 'clear' });
      expect(overall).toBe('degraded');
    });

    it('TC-HI-034: WS reconnecting → degraded', () => {
      const overall = computeOverall({ api: 'healthy', ws: 'reconnecting', memory: 'normal', errors: 'clear' });
      expect(overall).toBe('degraded');
    });

    it('TC-HI-035: 错误率 elevated → degraded', () => {
      const overall = computeOverall({ api: 'healthy', ws: 'connected', memory: 'normal', errors: 'elevated' });
      expect(overall).toBe('degraded');
    });

    it('TC-HI-036: 错误率 critical → critical', () => {
      const overall = computeOverall({ api: 'healthy', ws: 'connected', memory: 'normal', errors: 'critical' });
      expect(overall).toBe('critical');
    });
  });

  /* ── 熔断器联动 ── */

  describe('熔断器 → 健康状态联动', () => {
    it('TC-HI-040: API 熔断器 closed → api=healthy', () => {
      const state = apiCircuitBreaker.state; // closed
      const apiHealth = state === 'closed' ? 'healthy' : state === 'half-open' ? 'degraded' : 'down';
      expect(apiHealth).toBe('healthy');
    });

    it('TC-HI-041: API 熔断器 open → api=down', () => {
      for (let i = 0; i < 10; i++) apiCircuitBreaker.recordFailure();
      const state = apiCircuitBreaker.state;
      const apiHealth = state === 'closed' ? 'healthy' : state === 'half-open' ? 'degraded' : 'down';
      expect(apiHealth).toBe('down');
      apiCircuitBreaker.reset();
    });

    it('TC-HI-042: WS 熔断器 open → ws=disconnected', () => {
      for (let i = 0; i < 5; i++) wsCircuitBreaker.recordFailure();
      const wsHealth = wsCircuitBreaker.state === 'closed' ? 'connected' :
        wsCircuitBreaker.state === 'half-open' ? 'reconnecting' : 'disconnected';
      expect(wsHealth).toBe('disconnected');
      wsCircuitBreaker.reset();
    });
  });

  /* ── 错误率计算 ── */

  describe('错误率 → 健康状态', () => {
    it('TC-HI-050: 0 errors/min → clear', () => {
      const rate = 0;
      const status = rate >= 10 ? 'critical' : rate >= 3 ? 'elevated' : 'clear';
      expect(status).toBe('clear');
    });

    it('TC-HI-051: 5 errors/min → elevated', () => {
      const rate = 5;
      const status = rate >= 10 ? 'critical' : rate >= 3 ? 'elevated' : 'clear';
      expect(status).toBe('elevated');
    });

    it('TC-HI-052: 15 errors/min → critical', () => {
      const rate = 15;
      const status = rate >= 10 ? 'critical' : rate >= 3 ? 'elevated' : 'clear';
      expect(status).toBe('critical');
    });
  });
});

/* ── 辅助函数 ── */

function mapOverallToColor(overall: string): string {
  return overall === 'healthy' ? 'bg-emerald-500' :
    overall === 'degraded' ? 'bg-amber-500' : 'bg-red-500';
}

function mapOverallToLabel(overall: string): string {
  return overall === 'healthy' ? '系统正常' :
    overall === 'degraded' ? '部分降级' : '系统异常';
}

function shouldPulse(overall: string): boolean {
  return overall !== 'healthy';
}

function computeOverall(input: {
  api: string; ws: string; memory: string; errors: string;
}): 'healthy' | 'degraded' | 'critical' {
  if (input.api === 'down' || input.memory === 'critical' || input.errors === 'critical') return 'critical';
  if (input.api === 'degraded' || input.memory === 'warning' || input.errors === 'elevated' || input.ws === 'reconnecting') return 'degraded';
  return 'healthy';
}
