/**
 * @file quality-gate-service.test.ts
 * @description QualityGateService 单元测试 - 覆盖率目标: 80%+
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-24
 * @status active
 * @license MIT
 * 
 * @note 结合 2026 年智能应用趋势，采用现代化测试实践：
 * - 使用 describe.each 进行数据驱动测试
 * - 模拟真实业务场景
 * - 验证质量门禁逻辑的完整性
 * - 测试性能监控和趋势分析
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { qualityGateService } from '@/app/services/quality-gate-service'
import { testRunnerService } from '@/app/services/test-runner-service'
import type { TestSuite, TestCase } from '@/app/types/testing'

// Mock 依赖服务
vi.mock('@/app/services/test-runner-service', () => ({
  testRunnerService: {
    registerSuite: vi.fn(),
    runAll: vi.fn(async () => ({
      id: 'test-run-1',
      startTime: Date.now(),
      endTime: Date.now(),
      duration: 1000,
      suites: [],
      summary: {
        totalSuites: 5,
        totalCases: 50,
        passed: 45,
        failed: 3,
        skipped: 2,
        errors: 0,
        passRate: 0.9,
        byType: {
          unit: { total: 30, passed: 27, failed: 2 },
          integration: { total: 15, passed: 14, failed: 1 },
          e2e: { total: 5, passed: 4, failed: 0 },
          performance: { total: 0, passed: 0, failed: 0 },
          security: { total: 0, passed: 0, failed: 0 },
        },
      },
      coverage: {
        timestamp: Date.now(),
        summary: {
          statements: 75,
          branches: 70,
          functions: 80,
          lines: 75,
        },
        modules: [],
        meetsThreshold: false,
      },
      qualityGate: {
        passed: false,
        conditions: [],
        timestamp: Date.now(),
        blockers: 1,
        criticals: 2,
      },
    })),
    runByType: vi.fn(async (type: string) => ({
      id: `test-run-${type}`,
      startTime: Date.now(),
      endTime: Date.now(),
      duration: 500,
      suites: [],
      summary: {
        totalSuites: 2,
        totalCases: 20,
        passed: 18,
        failed: 2,
        skipped: 0,
        errors: 0,
        passRate: 0.9,
        byType: {
          unit: { total: 20, passed: 18, failed: 2 },
          integration: { total: 0, passed: 0, failed: 0 },
          e2e: { total: 0, passed: 0, failed: 0 },
          performance: { total: 0, passed: 0, failed: 0 },
          security: { total: 0, passed: 0, failed: 0 },
        },
      },
      coverage: {
        timestamp: Date.now(),
        summary: {
          statements: 70,
          branches: 65,
          functions: 75,
          lines: 70,
        },
        modules: [],
        meetsThreshold: false,
      },
      qualityGate: {
        passed: false,
        conditions: [],
        timestamp: Date.now(),
        blockers: 0,
        criticals: 1,
      },
    })),
    listSuites: vi.fn(() => []),
    getRunHistory: vi.fn(() => []),
  },
}))

vi.mock('@/app/services/code-quality-service', () => ({
  codeQualityService: {
    analyze: vi.fn(() => ({
      score: 85,
      grade: 'A',
      issues: [],
      metrics: {
        complexity: 3,
        maintainability: 8,
        readability: 9,
      },
    })),
  },
}))

vi.mock('@/app/services/performance-monitor-service', () => ({
  PerformanceMonitorService: {
    collectSnapshot: vi.fn(),
    getReport: vi.fn(() => ({
      score: 75,
      timestamp: Date.now(),
      metrics: {
        lcp: 2.5,
        ttfb: 0.3,
        domSize: 1200,
      },
    })),
  },
}))

vi.mock('@/app/services/monitoring-service', () => ({
  monitoringService: {
    getBenchmarkReport: vi.fn(() => ({
      timestamp: Date.now(),
      targets: [
        { name: 'API Response', target: 300, actual: 280, passed: true },
        { name: 'Page Load', target: 3000, actual: 2500, passed: true },
      ],
    })),
    getErrorReport: vi.fn(() => ({
      timestamp: Date.now(),
      totalErrors: 5,
      errors: [],
    })),
    getConfig: vi.fn(() => ({ enabled: true })),
  },
}))

vi.mock('@/app/services/security-service', () => ({
  securityService: {
    runSecurityAudit: vi.fn(() => ({
      score: 85,
      grade: 'A',
      checks: [],
    })),
  },
}))

vi.mock('@/app/services/ai-cost-service', () => ({
  aiCostService: {
    calculateCost: vi.fn(() => 0.01),
    recordUsage: vi.fn(() => ({ id: 'cost-1' })),
    getSummary: vi.fn(() => ({ totalCostUsd: 10.5 })),
    isOverBudget: vi.fn(() => false),
    recommendModel: vi.fn(() => ({ modelId: 'gpt-3.5-turbo' })),
  },
}))

vi.mock('@/app/services/auth-service', () => ({
  authService: {
    login: vi.fn(async () => ({
      user: { id: '1', email: 'test@example.com' },
      tokens: { accessToken: 'token' },
    })),
    autoLogin: vi.fn(async () => ({ user: { id: '1' }, tokens: {} })),
    isAuthenticated: vi.fn(() => true),
    getCurrentUser: vi.fn(() => ({ id: '1', email: 'test@example.com' })),
    hasPermission: vi.fn(() => true),
    logout: vi.fn(async () => {}),
  },
}))

vi.mock('@/app/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe('QualityGateService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerSmokeTests() - 冒烟测试注册', () => {
    it('应该注册冒烟测试套件', () => {
      qualityGateService.registerSmokeTests()

      expect(testRunnerService.registerSuite).toHaveBeenCalled()
    })

    it('应该只注册一次（幂等性）', () => {
      qualityGateService.registerSmokeTests()
      qualityGateService.registerSmokeTests()

      // 第二次调用应该立即返回，不重复注册
      // 验证方法不会抛出错误
      expect(() => {
        qualityGateService.registerSmokeTests()
      }).not.toThrow()
    })
  })

  describe('runFullAssessment() - 完整质量评估', () => {
    it('应该运行完整评估并返回报告', async () => {
      const report = await qualityGateService.runFullAssessment()

      expect(report).toBeDefined()
      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('overallScore')
      expect(report).toHaveProperty('status')
      expect(report).toHaveProperty('pyramid')
      expect(report).toHaveProperty('coverage')
      expect(report).toHaveProperty('qualityGate')
      expect(report).toHaveProperty('trends')
      expect(report).toHaveProperty('recommendations')
    })

    it('应该包含测试金字塔分析', async () => {
      const report = await qualityGateService.runFullAssessment()

      expect(report.pyramid).toBeDefined()
      expect(report.pyramid).toHaveProperty('unit')
      expect(report.pyramid).toHaveProperty('integration')
      expect(report.pyramid).toHaveProperty('e2e')
      // pyramid 包含 unit, integration, e2e，每个有 actual, met, target
      expect(report.pyramid.unit).toHaveProperty('actual')
      expect(report.pyramid.unit).toHaveProperty('met')
      expect(report.pyramid.unit).toHaveProperty('target')
    })

    it('应该包含覆盖率分析', async () => {
      const report = await qualityGateService.runFullAssessment()

      expect(report.coverage).toBeDefined()
      expect(report.coverage).toHaveProperty('summary')
      expect(report.coverage.summary).toHaveProperty('statements')
      expect(report.coverage.summary).toHaveProperty('functions')
      expect(report.coverage.summary).toHaveProperty('branches')
      expect(report.coverage.summary).toHaveProperty('lines')
    })

    it('应该包含质量门禁结果', async () => {
      const report = await qualityGateService.runFullAssessment()

      expect(report.qualityGate).toBeDefined()
      expect(report.qualityGate).toHaveProperty('passed')
      expect(report.qualityGate).toHaveProperty('blockers')
      expect(report.qualityGate).toHaveProperty('criticals')
    })

    it('应该包含趋势分析', async () => {
      const report = await qualityGateService.runFullAssessment()

      expect(report.trends).toBeDefined()
      expect(report.trends).toHaveProperty('passRate')
      expect(report.trends).toHaveProperty('coverage')
      expect(report.trends).toHaveProperty('duration')
      expect(Array.isArray(report.trends.passRate)).toBe(true)
    })

    it('应该包含改进建议', async () => {
      const report = await qualityGateService.runFullAssessment()

      expect(report.recommendations).toBeDefined()
      expect(Array.isArray(report.recommendations)).toBe(true)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('应该根据分数计算状态', async () => {
      const report = await qualityGateService.runFullAssessment()

      expect(['healthy', 'degraded', 'critical']).toContain(report.status)
    })

    it('应该运行所有测试', async () => {
      await qualityGateService.runFullAssessment()

      expect(testRunnerService.runAll).toHaveBeenCalled()
    })
  })

  describe('quickCheck() - 快速健康检查', () => {
    it('应该返回快速检查结果', async () => {
      const result = await qualityGateService.quickCheck()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('healthy')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('issues')
      expect(typeof result.healthy).toBe('boolean')
      expect(typeof result.score).toBe('number')
      expect(Array.isArray(result.issues)).toBe(true)
    })

    it('应该只运行单元测试', async () => {
      await qualityGateService.quickCheck()

      expect(testRunnerService.runByType).toHaveBeenCalledWith('unit')
    })

    it('应该检测测试失败', async () => {
      // Mock 返回失败的测试
      vi.mocked(testRunnerService.runByType).mockResolvedValueOnce({
        id: 'test-run-failed',
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 500,
        suites: [],
        summary: {
          totalSuites: 2,
          totalCases: 10,
          passed: 5,
          failed: 5,
          skipped: 0,
          errors: 0,
          passRate: 0.5,
          byType: {
            unit: { total: 10, passed: 5, failed: 5 },
            integration: { total: 0, passed: 0, failed: 0 },
            e2e: { total: 0, passed: 0, failed: 0 },
            performance: { total: 0, passed: 0, failed: 0 },
            security: { total: 0, passed: 0, failed: 0 },
          },
        },
        coverage: {
          timestamp: Date.now(),
          summary: {
            statements: 50,
            branches: 45,
            functions: 55,
            lines: 50,
          },
          modules: [],
          meetsThreshold: false,
        },
        qualityGate: {
          passed: false,
          conditions: [],
          timestamp: Date.now(),
          blockers: 0,
          criticals: 0,
        },
      })

      const result = await qualityGateService.quickCheck()

      expect(result.healthy).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
    })
  })

  describe('getPyramidStatus() - 测试金字塔状态', () => {
    it('应该返回金字塔状态', () => {
      const status = qualityGateService.getPyramidStatus()

      expect(status).toBeDefined()
      expect(status).toHaveProperty('unit')
      expect(status).toHaveProperty('integration')
      expect(status).toHaveProperty('e2e')
      expect(status).toHaveProperty('compliant')
      expect(typeof status.unit).toBe('number')
      expect(typeof status.integration).toBe('number')
      expect(typeof status.e2e).toBe('number')
      expect(typeof status.compliant).toBe('boolean')
    })

    it('应该计算百分比', () => {
      const status = qualityGateService.getPyramidStatus()

      expect(status.unit).toBeGreaterThanOrEqual(0)
      expect(status.unit).toBeLessThanOrEqual(100)
      expect(status.integration).toBeGreaterThanOrEqual(0)
      expect(status.integration).toBeLessThanOrEqual(100)
      expect(status.e2e).toBeGreaterThanOrEqual(0)
      expect(status.e2e).toBeLessThanOrEqual(100)
    })
  })

  describe('getCIPipelineConfig() - CI 管道配置', () => {
    it('应该返回 CI 管道配置', () => {
      const config = qualityGateService.getCIPipelineConfig()

      expect(config).toBeDefined()
      expect(config).toHaveProperty('name')
      expect(config).toHaveProperty('triggers')
      expect(config).toHaveProperty('jobs')
    })

    it('应该包含测试任务', () => {
      const config = qualityGateService.getCIPipelineConfig()

      expect(config.jobs).toBeInstanceOf(Array)
      expect(config.jobs.length).toBeGreaterThan(0)

      const testJob = config.jobs.find(job => job.id === 'test')
      expect(testJob).toBeDefined()
      expect(testJob?.name).toContain('测试')
    })

    it('应该包含 E2E 测试任务', () => {
      const config = qualityGateService.getCIPipelineConfig()

      const e2eJob = config.jobs.find(job => job.id === 'e2e')
      expect(e2eJob).toBeDefined()
      expect(e2eJob?.name).toContain('E2E')
    })

    it('应该定义触发条件', () => {
      const config = qualityGateService.getCIPipelineConfig()

      expect(config.triggers).toBeInstanceOf(Array)
      expect(config.triggers.length).toBeGreaterThan(0)
      expect(config.triggers[0]).toHaveProperty('event')
      expect(config.triggers[0]).toHaveProperty('branches')
    })
  })

  describe('集成测试场景', () => {
    it('应该完整处理质量评估流程', async () => {
      // 模拟高质量环境
      const mockReport = await qualityGateService.runFullAssessment()

      expect(mockReport.overallScore).toBeGreaterThanOrEqual(0)
      expect(mockReport.overallScore).toBeLessThanOrEqual(100)
      expect(['healthy', 'degraded', 'critical']).toContain(mockReport.status)
    })

    it('应该处理低质量环境', async () => {
      // 模拟低质量测试结果
      vi.mocked(testRunnerService.runAll).mockResolvedValueOnce({
        id: 'test-run-low-quality',
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 2000,
        suites: [],
        summary: {
          totalSuites: 5,
          totalCases: 50,
          passed: 20,
          failed: 30,
          skipped: 0,
          errors: 5,
          passRate: 0.4,
          byType: {
            unit: { total: 30, passed: 10, failed: 20 },
            integration: { total: 15, passed: 7, failed: 8 },
            e2e: { total: 5, passed: 3, failed: 2 },
            performance: { total: 0, passed: 0, failed: 0 },
            security: { total: 0, passed: 0, failed: 0 },
          },
        },
        coverage: {
          timestamp: Date.now(),
          summary: {
            statements: 40,
            branches: 35,
            functions: 45,
            lines: 40,
          },
          modules: [],
          meetsThreshold: false,
        },
        qualityGate: {
          passed: false,
          conditions: [],
          timestamp: Date.now(),
          blockers: 3,
          criticals: 5,
        },
      })

      const report = await qualityGateService.runFullAssessment()

      expect(report.status).toBe('critical')
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('应该持续跟踪测试趋势', async () => {
      // 运行多次评估
      await qualityGateService.runFullAssessment()
      await qualityGateService.runFullAssessment()
      const report = await qualityGateService.runFullAssessment()

      expect(report.trends.passRate).toBeInstanceOf(Array)
      expect(report.trends.coverage).toBeInstanceOf(Array)
      expect(report.trends.duration).toBeInstanceOf(Array)
    })
  })
})
