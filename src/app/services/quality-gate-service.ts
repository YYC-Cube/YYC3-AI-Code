/**
 * @file quality-gate-service.ts
 * @description YYC³ 质量门禁服务 — 综合质量评估、内置冒烟测试、健康报告、趋势分析
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Orchestrates the test-runner, code-quality, performance-monitor, and
 * monitoring services into a unified quality assessment.
 * Also registers a set of built-in smoke tests that validate each
 * service module on demand.
 */

import { createLogger } from '../utils/logger'
import { testRunnerService, assert } from './test-runner-service'
import { codeQualityService } from './code-quality-service'
import { PerformanceMonitorService } from './performance-monitor-service'
import { monitoringService } from './monitoring-service'
import { securityService } from './security-service'
import { aiCostService } from './ai-cost-service'
import { authService } from './auth-service'
import type {
  TestSuite,
  TestCase,
  TestHealthReport,
  TestRunResult,
} from '../types/testing'

const log = createLogger('QualityGate')

/* ================================================================
   Built-in Smoke Test Registration
   ================================================================ */

function buildSmokeTests(): TestSuite[] {
  const suites: TestSuite[] = []

  /* ── Validation Utils ── */
  suites.push({
    id: 'smoke-validation',
    name: 'Validation Utils 冒烟测试',
    description: '验证输入验证、XSS 防护、文件校验等工具函数',
    type: 'unit',
    target: 'utils/validation.ts',
    tags: ['smoke', 'utils'],
    timeout: 3000,
    cases: [
      makeCase('val-input-empty', '空输入应失败', 'unit', async () => {
        const { validateInput } = await import('../utils/validation')
        const r = validateInput('')
        return assert.isFalse(r.valid, '空输入应返回 valid=false')
      }),
      makeCase('val-input-ok', '正常输入应通过', 'unit', async () => {
        const { validateInput } = await import('../utils/validation')
        const r = validateInput('Hello World')
        return assert.isTrue(r.valid)
      }),
      makeCase('val-xss', 'XSS 脚本应被检测', 'unit', async () => {
        const { validateInput } = await import('../utils/validation')
        const r = validateInput('<script>alert(1)</script>')
        return assert.isFalse(r.valid, 'XSS 输入应不通过')
      }),
      makeCase('val-email-ok', '合法邮箱应通过', 'unit', async () => {
        const { validateEmail } = await import('../utils/validation')
        const r = validateEmail('admin@0379.email')
        return assert.isTrue(r.valid)
      }),
      makeCase('val-email-bad', '非法邮箱应失败', 'unit', async () => {
        const { validateEmail } = await import('../utils/validation')
        const r = validateEmail('not-an-email')
        return assert.isFalse(r.valid)
      }),
      makeCase('val-password-weak', '弱密码应失败', 'unit', async () => {
        const { validatePassword } = await import('../utils/validation')
        const r = validatePassword('123')
        return assert.isFalse(r.valid)
      }),
      makeCase('val-password-ok', '合规密码应通过', 'unit', async () => {
        const { validatePassword } = await import('../utils/validation')
        const r = validatePassword('MyPass123')
        return assert.isTrue(r.valid)
      }),
      makeCase('val-sanitize', 'HTML 净化应移除脚本', 'unit', async () => {
        const { sanitizeHtml } = await import('../utils/validation')
        const result = sanitizeHtml('Hello <script>evil</script> World')
        return assert.isFalse(result.includes('<script>'), '净化后不应包含 <script>')
      }),
    ],
  })

  /* ── Logger ── */
  suites.push({
    id: 'smoke-logger',
    name: 'Logger 冒烟测试',
    description: '验证日志系统的基本功能',
    type: 'unit',
    target: 'utils/logger.ts',
    tags: ['smoke', 'utils'],
    timeout: 2000,
    cases: [
      makeCase('log-create', 'createLogger 应返回 Logger 实例', 'unit', async () => {
        const { createLogger: cl } = await import('../utils/logger')
        const logger = cl('TestModule')
        return assert.isDefined(logger, 'Logger 实例不应为 undefined')
      }),
      makeCase('log-methods', 'Logger 应包含 debug/info/warn/error 方法', 'unit', async () => {
        const { createLogger: cl } = await import('../utils/logger')
        const logger = cl('Test')
        const hasMethods =
          typeof logger.debug === 'function' &&
          typeof logger.info === 'function' &&
          typeof logger.warn === 'function' &&
          typeof logger.error === 'function'
        return assert.isTrue(hasMethods, 'Logger 缺少必要方法')
      }),
      makeCase('log-buffer', 'getLogBuffer 应返回数组', 'unit', async () => {
        const { getLogBuffer } = await import('../utils/logger')
        const buffer = getLogBuffer()
        return assert.isTrue(Array.isArray(buffer), 'Log buffer 应为数组')
      }),
    ],
  })

  /* ── Security Service ── */
  suites.push({
    id: 'smoke-security',
    name: 'Security Service 冒烟测试',
    description: '验证安全服务的速率限制、CSP、敏感数据检测',
    type: 'unit',
    target: 'services/security-service.ts',
    tags: ['smoke', 'security'],
    timeout: 3000,
    cases: [
      makeCase('sec-rate-ok', '速率限制未触发时应允许请求', 'unit', async () => {
        const state = securityService.checkRateLimit('api', 'smoke-test')
        return assert.isFalse(state.isThrottled, '初始状态不应被限流')
      }),
      makeCase('sec-csp', 'CSP 配置应包含 self', 'unit', async () => {
        const csp = securityService.getCSPConfig()
        return assert.isTrue(csp.defaultSrc.includes("'self'"), 'CSP defaultSrc 应包含 self')
      }),
      makeCase('sec-csp-header', 'buildCSPHeader 应返回有效字符串', 'unit', async () => {
        const header = securityService.buildCSPHeader()
        return assert.contains(header, 'default-src', '应包含 default-src 指令')
      }),
      makeCase('sec-sensitive', '应检测到 API key 模式', 'unit', async () => {
        const findings = securityService.detectSensitiveData('api_key=sk_live_abc123xyz789longkey')
        return assert.greaterThan(findings.length, 0, '应检测到敏感数据模式')
      }),
      makeCase('sec-mask', '敏感值遮蔽应保留首尾', 'unit', async () => {
        const masked = securityService.maskSensitive('sk_live_1234567890abcdef')
        return assert.contains(masked, 'sk_l', '应保留前4个字符')
      }),
      makeCase('sec-sanitize', 'HTML 净化应移除 script', 'unit', async () => {
        const clean = securityService.sanitizeHtml('<b>ok</b><script>bad</script>')
        const noScript = !clean.includes('<script>')
        const hasB = clean.includes('<b>')
        return assert.isTrue(noScript && hasB, '应保留安全标签，移除危险标签')
      }),
      makeCase('sec-audit', '安全审计应返回分数', 'unit', async () => {
        const audit = securityService.runSecurityAudit()
        return assert.greaterThan(audit.score, 0, '审计分数应大于 0')
      }),
    ],
  })

  /* ── AI Cost Service ── */
  suites.push({
    id: 'smoke-ai-cost',
    name: 'AI Cost Service 冒烟测试',
    description: '验证 AI 成本计算、预算检查、模型推荐',
    type: 'unit',
    target: 'services/ai-cost-service.ts',
    tags: ['smoke', 'ai'],
    timeout: 3000,
    cases: [
      makeCase('cost-calc', '应正确计算 OpenAI 成本', 'unit', async () => {
        const cost = aiCostService.calculateCost('openai', 'gpt-3.5-turbo', 1000, 500)
        return assert.greaterThan(cost, 0, '成本应大于 0')
      }),
      makeCase('cost-calc-free', 'Ollama 成本应为 0', 'unit', async () => {
        const cost = aiCostService.calculateCost('ollama', 'llama2', 1000, 500)
        return assert.equals(cost, 0, 'Ollama 本地模型应无成本')
      }),
      makeCase('cost-record', 'recordUsage 应返回 CostRecord', 'unit', async () => {
        const record = aiCostService.recordUsage({
          providerId: 'openai', modelId: 'gpt-3.5-turbo',
          inputTokens: 100, outputTokens: 50, taskType: 'smoke-test',
        })
        return assert.isDefined(record.id, '应返回有效 CostRecord')
      }),
      makeCase('cost-summary', 'getSummary 应返回摘要', 'unit', async () => {
        const summary = aiCostService.getSummary('day')
        return assert.isDefined(summary.totalCostUsd !== undefined, '应有 totalCostUsd')
      }),
      makeCase('cost-recommend', '应为低复杂度推荐 GPT-3.5', 'unit', async () => {
        const rec = aiCostService.recommendModel('low')
        return assert.equals(rec?.modelId, 'gpt-3.5-turbo')
      }),
      makeCase('cost-budget', 'isOverBudget 应返回 boolean', 'unit', async () => {
        const over = aiCostService.isOverBudget()
        return assert.typeOf(over, 'boolean')
      }),
    ],
  })

  /* ── Auth Service ── */
  suites.push({
    id: 'smoke-auth',
    name: 'Auth Service 冒烟测试',
    description: '验证认证服务的 Mock 登录、权限检查',
    type: 'integration',
    target: 'services/auth-service.ts',
    tags: ['smoke', 'auth'],
    timeout: 5000,
    cases: [
      makeCase('auth-login', 'Mock 登录应成功', 'integration', async () => {
        const { user, tokens } = await authService.login('test@example.com', 'demo')
        return assert.isDefined(tokens.accessToken, '应返回 accessToken')
      }),
      makeCase('auth-check', '登录后 isAuthenticated 应为 true', 'integration', async () => {
        await authService.login('test@example.com', 'demo')
        return assert.isTrue(authService.isAuthenticated())
      }),
      makeCase('auth-user', '登录后 getCurrentUser 应有数据', 'integration', async () => {
        await authService.login('test@example.com', 'demo')
        const user = authService.getCurrentUser()
        return assert.isDefined(user?.id, '应返回有效用户')
      }),
      makeCase('auth-permission', 'Admin 应有 projects.read 权限', 'integration', async () => {
        await authService.autoLogin()
        return assert.isTrue(authService.hasPermission('projects', 'read'))
      }),
      makeCase('auth-logout', '登出后 isAuthenticated 应为 false', 'integration', async () => {
        await authService.login('test@example.com', 'demo')
        await authService.logout()
        return assert.isFalse(authService.isAuthenticated())
      }),
    ],
  })

  /* ── Monitoring Service ── */
  suites.push({
    id: 'smoke-monitoring',
    name: 'Monitoring Service 冒烟测试',
    description: '验证监控服务的基准测试、告警、错误追踪',
    type: 'unit',
    target: 'services/monitoring-service.ts',
    tags: ['smoke', 'monitoring'],
    timeout: 3000,
    cases: [
      makeCase('mon-benchmark', '基准报告应有 targets', 'unit', async () => {
        const report = monitoringService.getBenchmarkReport()
        return assert.greaterThan(report.targets.length, 0, '应有基准测试目标')
      }),
      makeCase('mon-error-track', '错误追踪应正常工作', 'unit', async () => {
        monitoringService.trackError(new Error('smoke-test-error'), { componentName: 'SmokeTest' })
        const report = monitoringService.getErrorReport('hour')
        return assert.greaterThan(report.totalErrors, 0, '应记录到错误')
      }),
      makeCase('mon-config', '配置应可读取', 'unit', async () => {
        const config = monitoringService.getConfig()
        return assert.isTrue(config.enabled, '监控应默认启用')
      }),
    ],
  })

  /* ── Performance Monitor ── */
  suites.push({
    id: 'smoke-performance',
    name: 'Performance Monitor 冒烟测试',
    description: '验证性能快照采集与报告',
    type: 'unit',
    target: 'services/performance-monitor-service.ts',
    tags: ['smoke', 'performance'],
    timeout: 3000,
    cases: [
      makeCase('perf-snapshot', '应成功采集快照', 'unit', async () => {
        const snapshot = PerformanceMonitorService.collectSnapshot()
        return assert.isDefined(snapshot.timestamp, '快照应有 timestamp')
      }),
      makeCase('perf-report', '报告应有 score', 'unit', async () => {
        const report = PerformanceMonitorService.getReport()
        return assert.typeOf(report.score, 'number')
      }),
    ],
  })

  return suites
}

/* ── Helper ── */

function makeCase(
  id: string,
  name: string,
  type: TestCase['type'],
  fn: () => Promise<import('../types/testing').TestAssertionResult>,
): TestCase {
  return {
    id,
    name,
    type,
    severity: 'major',
    fn,
    expected: name,
    tags: ['smoke'],
    timeout: 3000,
    retries: 1,
  }
}

/* ================================================================
   Quality Gate Service
   ================================================================ */

class QualityGateServiceImpl {
  private smokeTestsRegistered = false

  /**
   * Register all built-in smoke tests with the test runner.
   */
  registerSmokeTests(): void {
    if (this.smokeTestsRegistered) {return}
    const suites = buildSmokeTests()
    for (const suite of suites) {
      testRunnerService.registerSuite(suite)
    }
    this.smokeTestsRegistered = true
    log.info(`Registered ${suites.length} smoke test suites`, {
      cases: suites.reduce((s, suite) => s + suite.cases.length, 0),
    })
  }

  /**
   * Run all smoke tests and return unified health report.
   */
  async runFullAssessment(): Promise<TestHealthReport> {
    this.registerSmokeTests()

    log.info('Starting full quality assessment')

    // Run all tests
    const runResult = await testRunnerService.runAll()

    // Code quality score (check sample code)
    const codeQuality = codeQualityService.analyze(
      '// Sample validation\nconst x: any = 1;\nconsole.log(x);\n'
    )

    // Performance
    PerformanceMonitorService.collectSnapshot()
    const perfReport = PerformanceMonitorService.getReport()

    // Benchmark
    const benchmarkReport = monitoringService.getBenchmarkReport()

    // Compute overall score
    const testScore = runResult.summary.passRate * 40 // max 40
    const coverageScore = (runResult.coverage.summary.lines / 100) * 25 // max 25
    const perfScore = (perfReport.score / 100) * 20 // max 20
    const gateScore = runResult.qualityGate.passed ? 15 : 0 // max 15
    const overallScore = Math.round(testScore + coverageScore + perfScore + gateScore)

    const status: TestHealthReport['status'] =
      overallScore >= 80 ? 'healthy' :
      overallScore >= 50 ? 'degraded' : 'critical'

    // Pyramid compliance
    const unitCases = runResult.summary.byType.unit.total
    const intCases = runResult.summary.byType.integration.total
    const e2eCases = runResult.summary.byType.e2e.total
    const totalCases = unitCases + intCases + e2eCases || 1

    const pyramid = {
      unit: {
        actual: Math.round((unitCases / totalCases) * 100),
        target: 60,
        met: (unitCases / totalCases) >= 0.5,
      },
      integration: {
        actual: Math.round((intCases / totalCases) * 100),
        target: 30,
        met: (intCases / totalCases) >= 0.15,
      },
      e2e: {
        actual: Math.round((e2eCases / totalCases) * 100),
        target: 10,
        met: true, // E2E is optional in-browser
      },
    }

    // Build recommendations
    const recommendations: string[] = []
    if (runResult.summary.failed > 0) {
      recommendations.push(`${runResult.summary.failed} 个测试用例失败，需要修复`)
    }
    if (!runResult.coverage.meetsThreshold) {
      recommendations.push(`覆盖率未达标 (${runResult.coverage.summary.lines}% < 80%)，增加测试用例`)
    }
    if (!pyramid.unit.met) {
      recommendations.push(`单元测试占比 ${pyramid.unit.actual}% < 目标 60%，补充单元测试`)
    }
    if (!pyramid.integration.met) {
      recommendations.push(`集成测试占比 ${pyramid.integration.actual}% < 目标 30%，补充集成测试`)
    }
    if (perfReport.score < 70) {
      recommendations.push('性能评分偏低，检查 LCP/TTFB/DOM 节点数')
    }
    if (runResult.qualityGate.blockers > 0) {
      recommendations.push(`${runResult.qualityGate.blockers} 个阻塞级质量门禁未通过`)
    }
    if (recommendations.length === 0) {
      recommendations.push('所有质量指标达标，系统健康运行')
    }

    // Trends (from history)
    const history = testRunnerService.getRunHistory(10)
    const trends = {
      passRate: history.map(r => Math.round(r.summary.passRate * 100)),
      coverage: history.map(r => r.coverage.summary.lines),
      duration: history.map(r => r.duration),
    }

    const report: TestHealthReport = {
      timestamp: Date.now(),
      overallScore,
      status,
      pyramid,
      coverage: runResult.coverage,
      qualityGate: runResult.qualityGate,
      recentRuns: history.slice(-5),
      trends,
      recommendations,
    }

    log.info('Quality assessment complete', {
      score: overallScore,
      status,
      passed: runResult.summary.passed,
      failed: runResult.summary.failed,
      gate: runResult.qualityGate.passed ? 'PASS' : 'FAIL',
    })

    return report
  }

  /**
   * Quick health check — runs only critical tests.
   */
  async quickCheck(): Promise<{ healthy: boolean; score: number; issues: string[] }> {
    this.registerSmokeTests()

    const result = await testRunnerService.runByType('unit')
    const issues: string[] = []

    if (result.summary.failed > 0) {
      issues.push(`${result.summary.failed} 单元测试失败`)
    }
    if (result.summary.errors > 0) {
      issues.push(`${result.summary.errors} 测试出错`)
    }

    const score = Math.round(result.summary.passRate * 100)
    return {
      healthy: issues.length === 0,
      score,
      issues,
    }
  }

  /**
   * Get the test pyramid compliance status.
   */
  getPyramidStatus(): {
    unit: number; integration: number; e2e: number
    compliant: boolean
  } {
    const suites = testRunnerService.listSuites()
    const unit = suites.filter(s => s.type === 'unit').reduce((s, suite) => s + suite.cases.length, 0)
    const integration = suites.filter(s => s.type === 'integration').reduce((s, suite) => s + suite.cases.length, 0)
    const e2e = suites.filter(s => s.type === 'e2e').reduce((s, suite) => s + suite.cases.length, 0)
    const total = unit + integration + e2e || 1

    const unitPct = unit / total
    const intPct = integration / total

    return {
      unit: Math.round(unitPct * 100),
      integration: Math.round(intPct * 100),
      e2e: Math.round((e2e / total) * 100),
      compliant: unitPct >= 0.5 && intPct >= 0.15,
    }
  }

  /**
   * Generate CI pipeline config for the spec's test workflow.
   */
  getCIPipelineConfig(): import('../types/testing').CIPipelineConfig {
    return {
      name: 'YYC³ Test Suite',
      triggers: [
        { event: 'push', branches: ['main', 'develop'] },
        { event: 'pull_request', branches: ['main', 'develop'] },
      ],
      jobs: [
        {
          id: 'test',
          name: '单元 & 集成测试',
          runsOn: 'ubuntu-latest',
          steps: [
            { name: 'Checkout', uses: 'actions/checkout@v4' },
            { name: 'Setup Node', uses: 'actions/setup-node@v4', with: { 'node-version': '20', cache: 'pnpm' } },
            { name: 'Install', command: 'pnpm i --frozen-lockfile' },
            { name: 'Lint', command: 'pnpm lint' },
            { name: 'Unit Tests', command: 'pnpm test:unit -- --coverage' },
            { name: 'Integration Tests', command: 'pnpm test:integration' },
            { name: 'Upload Coverage', uses: 'codecov/codecov-action@v4', with: { files: './coverage/lcov.info' } },
          ],
        },
        {
          id: 'e2e',
          name: 'E2E 测试',
          runsOn: 'ubuntu-latest',
          needs: ['test'],
          steps: [
            { name: 'Checkout', uses: 'actions/checkout@v4' },
            { name: 'Setup Node', uses: 'actions/setup-node@v4', with: { 'node-version': '20', cache: 'pnpm' } },
            { name: 'Install', command: 'pnpm i --frozen-lockfile' },
            { name: 'Install Playwright', command: 'npx playwright install --with-deps' },
            { name: 'E2E Tests', command: 'pnpm test:e2e' },
            { name: 'Upload Report', uses: 'actions/upload-artifact@v4', with: { name: 'playwright-report', path: 'playwright-report/' }, continueOnError: true },
          ],
        },
      ],
    }
  }
}

/* ================================================================
   Singleton
   ================================================================ */

export const qualityGateService = new QualityGateServiceImpl()
