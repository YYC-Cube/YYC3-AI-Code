/**
 * @file test-runner-service.ts
 * @description YYC³ 内置测试运行器 — 注册测试套件/用例、执行、收集结果、覆盖率估算
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Implements the spec's testing pyramid (60% unit / 30% integration / 10% E2E).
 * Runs entirely in-browser — no Node test runner required.
 * Real Vitest/Playwright tests run in CI; this service provides an in-app
 * validation & smoke-test capability for services/stores.
 */

import { createLogger } from '../utils/logger'
import type {
  TestSuite,
  TestCase,
  TestCaseResult,
  TestSuiteResult,
  TestRunResult,
  TestRunSummary,
  TestRunnerConfig,
  TestType,
  TestStatus,
  CoverageReport,
  CoverageMetrics,
  ModuleCoverage,
  TestAssertionResult,
  QualityGateResult,
} from '../types/testing'

const log = createLogger('TestRunner')

/* ================================================================
   Default Configuration
   ================================================================ */

const DEFAULT_CONFIG: TestRunnerConfig = {
  concurrency: 4,
  defaultTimeout: 5000,
  defaultRetries: 1,
  bail: false,
  verbose: true,
  collectCoverage: true,
  coverageThresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
  qualityGate: {
    enabled: true,
    conditions: [
      { id: 'pass-rate', name: '通过率', metric: 'passRate', operator: 'gte', threshold: 90, severity: 'blocker', enabled: true },
      { id: 'coverage-lines', name: '行覆盖率', metric: 'coverageLines', operator: 'gte', threshold: 80, severity: 'critical', enabled: true },
      { id: 'coverage-functions', name: '函数覆盖率', metric: 'coverageFunctions', operator: 'gte', threshold: 80, severity: 'critical', enabled: true },
      { id: 'coverage-branches', name: '分支覆盖率', metric: 'coverageBranches', operator: 'gte', threshold: 80, severity: 'major', enabled: true },
      { id: 'no-blockers', name: '无阻塞错误', metric: 'errorCount', operator: 'lte', threshold: 0, severity: 'blocker', enabled: true },
      { id: 'max-duration', name: '总耗时', metric: 'durationSeconds', operator: 'lte', threshold: 300, severity: 'minor', enabled: true },
    ],
  },
}

/* ================================================================
   Assertion Helpers (lightweight)
   ================================================================ */

export const assert = {
  isTrue(value: boolean, msg?: string): TestAssertionResult {
    return { passed: value === true, message: msg || `Expected true, got ${value}`, actual: value, expected: true }
  },
  isFalse(value: boolean, msg?: string): TestAssertionResult {
    return { passed: value === false, message: msg || `Expected false, got ${value}`, actual: value, expected: false }
  },
  equals<T>(actual: T, expected: T, msg?: string): TestAssertionResult {
    const passed = JSON.stringify(actual) === JSON.stringify(expected)
    return { passed, message: msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`, actual, expected }
  },
  notEquals<T>(actual: T, unexpected: T, msg?: string): TestAssertionResult {
    const passed = JSON.stringify(actual) !== JSON.stringify(unexpected)
    return { passed, message: msg || `Expected value to differ from ${JSON.stringify(unexpected)}`, actual, expected: `!= ${JSON.stringify(unexpected)}` }
  },
  isDefined(value: unknown, msg?: string): TestAssertionResult {
    const passed = value !== undefined && value !== null
    return { passed, message: msg || `Expected value to be defined, got ${value}`, actual: value, expected: 'defined' }
  },
  isUndefined(value: unknown, msg?: string): TestAssertionResult {
    const passed = value === undefined || value === null
    return { passed, message: msg || `Expected undefined/null, got ${value}`, actual: value, expected: 'undefined' }
  },
  greaterThan(actual: number, expected: number, msg?: string): TestAssertionResult {
    return { passed: actual > expected, message: msg || `Expected ${actual} > ${expected}`, actual, expected: `> ${expected}` }
  },
  lessThan(actual: number, expected: number, msg?: string): TestAssertionResult {
    return { passed: actual < expected, message: msg || `Expected ${actual} < ${expected}`, actual, expected: `< ${expected}` }
  },
  contains(haystack: string, needle: string, msg?: string): TestAssertionResult {
    return { passed: haystack.includes(needle), message: msg || `Expected string to contain "${needle}"`, actual: haystack.slice(0, 100), expected: `contains "${needle}"` }
  },
  hasLength(arr: unknown[], expected: number, msg?: string): TestAssertionResult {
    return { passed: arr.length === expected, message: msg || `Expected length ${expected}, got ${arr.length}`, actual: arr.length, expected }
  },
  throws(fn: () => void, msg?: string): TestAssertionResult {
    try { fn(); return { passed: false, message: msg || 'Expected function to throw' } }
    catch { return { passed: true, message: 'Function threw as expected' } }
  },
  async throwsAsync(fn: () => Promise<void>, msg?: string): Promise<TestAssertionResult> {
    try { await fn(); return { passed: false, message: msg || 'Expected async function to throw' } }
    catch { return { passed: true, message: 'Async function threw as expected' } }
  },
  typeOf(value: unknown, expectedType: string, msg?: string): TestAssertionResult {
    const actual = typeof value
    return { passed: actual === expectedType, message: msg || `Expected type "${expectedType}", got "${actual}"`, actual, expected: expectedType }
  },
  instanceOf(value: unknown, ctor: new (...args: any[]) => any, msg?: string): TestAssertionResult {
    const passed = value instanceof ctor
    return { passed, message: msg || `Expected instance of ${ctor.name}`, actual: value?.constructor?.name, expected: ctor.name }
  },
}

/* ================================================================
   Test Runner Service
   ================================================================ */

class TestRunnerServiceImpl {
  private config: TestRunnerConfig = { ...DEFAULT_CONFIG }
  private suites: Map<string, TestSuite> = new Map()
  private runs: TestRunResult[] = []
  private runIdCounter = 0
  private subscribers: Array<(event: TestRunnerEvent) => void> = []

  /* ── Registration ── */

  /**
   * Register a test suite.
   */
  registerSuite(suite: TestSuite): void {
    this.suites.set(suite.id, suite)
    log.info(`Suite registered: ${suite.name}`, { id: suite.id, cases: suite.cases.length, type: suite.type })
  }

  /**
   * Unregister a test suite.
   */
  unregisterSuite(suiteId: string): void {
    this.suites.delete(suiteId)
  }

  /**
   * List registered suites.
   */
  listSuites(): TestSuite[] {
    return Array.from(this.suites.values())
  }

  /* ── Execution ── */

  /**
   * Run all registered suites (filtered by config).
   */
  async runAll(): Promise<TestRunResult> {
    const filtered = this.getFilteredSuites()
    return this.executeSuites(filtered)
  }

  /**
   * Run suites of a specific type.
   */
  async runByType(type: TestType): Promise<TestRunResult> {
    const filtered = Array.from(this.suites.values()).filter(s => s.type === type)
    return this.executeSuites(filtered)
  }

  /**
   * Run a single suite by ID.
   */
  async runSuite(suiteId: string): Promise<TestSuiteResult | null> {
    const suite = this.suites.get(suiteId)
    if (!suite) {
      log.warn(`Suite not found: ${suiteId}`)
      return null
    }
    const result = await this.executeSingleSuite(suite)
    return result
  }

  /* ── Internal execution ── */

  private getFilteredSuites(): TestSuite[] {
    let suites = Array.from(this.suites.values())

    if (this.config.filterTypes?.length) {
      suites = suites.filter(s => this.config.filterTypes!.includes(s.type))
    }
    if (this.config.filterTags?.length) {
      suites = suites.filter(s => s.tags.some(t => this.config.filterTags!.includes(t)))
    }

    return suites
  }

  private async executeSuites(suites: TestSuite[]): Promise<TestRunResult> {
    const runId = `run-${++this.runIdCounter}-${Date.now()}`
    const startTime = Date.now()

    this.emit({ type: 'run-start', runId, totalSuites: suites.length })
    log.info(`Test run started: ${runId}`, { suites: suites.length })

    const suiteResults: TestSuiteResult[] = []

    // Run suites with concurrency limit
    const chunks = this.chunkArray(suites, this.config.concurrency)
    for (const chunk of chunks) {
      const results = await Promise.all(chunk.map(s => this.executeSingleSuite(s)))
      suiteResults.push(...results)

      // Bail on first failure
      if (this.config.bail && results.some(r => r.status === 'failed')) {
        log.warn('Bail: stopping after first failure')
        break
      }
    }

    const endTime = Date.now()
    const summary = this.computeSummary(suiteResults)
    const coverage = this.computeCoverage(suiteResults)
    const qualityGate = this.evaluateQualityGate(summary, coverage, endTime - startTime)

    const result: TestRunResult = {
      id: runId,
      startTime,
      endTime,
      duration: endTime - startTime,
      suites: suiteResults,
      summary,
      coverage,
      qualityGate,
    }

    this.runs.push(result)
    if (this.runs.length > 50) {this.runs.shift()}

    this.emit({ type: 'run-complete', runId, summary, qualityGate })
    log.info(`Test run complete: ${runId}`, {
      passed: summary.passed,
      failed: summary.failed,
      passRate: `${(summary.passRate * 100).toFixed(1)}%`,
      gate: qualityGate.passed ? 'PASSED' : 'FAILED',
    })

    return result
  }

  private async executeSingleSuite(suite: TestSuite): Promise<TestSuiteResult> {
    const startTime = Date.now()
    this.emit({ type: 'suite-start', suiteId: suite.id, suiteName: suite.name })

    // Setup
    try {
      if (suite.setup) {await suite.setup()}
    } catch (err) {
      log.error(`Suite setup failed: ${suite.name}`, err)
    }

    const caseResults: TestCaseResult[] = []

    for (const testCase of suite.cases) {
      if (testCase.skip) {
        caseResults.push(this.buildCaseResult(testCase, suite.id, 'skipped', 0))
        continue
      }

      const caseResult = await this.executeCase(testCase, suite.id)
      caseResults.push(caseResult)

      if (this.config.bail && caseResult.status === 'failed') {break}
    }

    // Teardown
    try {
      if (suite.teardown) {await suite.teardown()}
    } catch (err) {
      log.error(`Suite teardown failed: ${suite.name}`, err)
    }

    const duration = Date.now() - startTime
    const passed = caseResults.filter(c => c.status === 'passed').length
    const failed = caseResults.filter(c => c.status === 'failed').length
    const skipped = caseResults.filter(c => c.status === 'skipped').length
    const errors = caseResults.filter(c => c.status === 'error').length
    const status: TestStatus = failed > 0 || errors > 0 ? 'failed' : 'passed'

    const result: TestSuiteResult = {
      suiteId: suite.id,
      suiteName: suite.name,
      type: suite.type,
      target: suite.target,
      status,
      cases: caseResults,
      duration,
      passed,
      failed,
      skipped,
      errors,
      timestamp: Date.now(),
    }

    this.emit({ type: 'suite-complete', suiteId: suite.id, result })
    return result
  }

  private async executeCase(testCase: TestCase, suiteId: string): Promise<TestCaseResult> {
    const timeout = testCase.timeout || this.config.defaultTimeout
    const maxRetries = testCase.retries || this.config.defaultRetries
    let lastResult: TestCaseResult | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startTime = Date.now()

      try {
        const assertion = await this.withTimeout(testCase.fn(), timeout)
        const duration = Date.now() - startTime

        if (assertion.passed) {
          return this.buildCaseResult(testCase, suiteId, 'passed', duration, assertion, undefined, attempt)
        }

        lastResult = this.buildCaseResult(testCase, suiteId, 'failed', duration, assertion, undefined, attempt)
      } catch (err: any) {
        const duration = Date.now() - startTime
        lastResult = this.buildCaseResult(testCase, suiteId, 'error', duration, undefined, {
          message: err?.message || String(err),
          stack: err?.stack,
        }, attempt)
      }

      // Only retry if we have retries left
      if (attempt < maxRetries) {
        if (this.config.verbose) {
          log.debug(`Retrying case: ${testCase.name} (attempt ${attempt + 2}/${maxRetries + 1})`)
        }
      }
    }

    return lastResult!
  }

  private buildCaseResult(
    testCase: TestCase,
    suiteId: string,
    status: TestStatus,
    duration: number,
    assertion?: TestAssertionResult,
    error?: { message: string; stack?: string },
    retries = 0,
  ): TestCaseResult {
    return {
      caseId: testCase.id,
      caseName: testCase.name,
      suiteId,
      type: testCase.type,
      status,
      duration,
      assertion,
      error,
      retries,
      timestamp: Date.now(),
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout: exceeded ${ms}ms`)), ms)
      promise.then(
        val => { clearTimeout(timer); resolve(val) },
        err => { clearTimeout(timer); reject(err) },
      )
    })
  }

  /* ── Summary ── */

  private computeSummary(suiteResults: TestSuiteResult[]): TestRunSummary {
    const byType: Record<TestType, { total: number; passed: number; failed: number }> = {
      unit: { total: 0, passed: 0, failed: 0 },
      integration: { total: 0, passed: 0, failed: 0 },
      e2e: { total: 0, passed: 0, failed: 0 },
      performance: { total: 0, passed: 0, failed: 0 },
      security: { total: 0, passed: 0, failed: 0 },
    }

    let totalCases = 0, passed = 0, failed = 0, skipped = 0, errors = 0

    for (const sr of suiteResults) {
      totalCases += sr.cases.length
      passed += sr.passed
      failed += sr.failed
      skipped += sr.skipped
      errors += sr.errors

      const bt = byType[sr.type]
      if (bt) {
        bt.total += sr.cases.length
        bt.passed += sr.passed
        bt.failed += sr.failed
      }
    }

    const executed = totalCases - skipped
    const passRate = executed > 0 ? passed / executed : 1

    return {
      totalSuites: suiteResults.length,
      totalCases,
      passed,
      failed,
      skipped,
      errors,
      passRate,
      byType,
    }
  }

  /* ── Coverage (estimated from registered suites) ── */

  private computeCoverage(suiteResults: TestSuiteResult[]): CoverageReport {
    // Map of known modules and their test counts
    const moduleMap = new Map<string, { name: string; testCount: number; passed: number; type: ModuleCoverage['type'] }>()

    // Known project modules for coverage estimation
    const knownModules: Array<{ path: string; name: string; type: ModuleCoverage['type'] }> = [
      { path: 'services/auth-service.ts', name: 'AuthService', type: 'service' },
      { path: 'services/api-service.ts', name: 'ApiService', type: 'service' },
      { path: 'services/persistence-service.ts', name: 'PersistenceService', type: 'service' },
      { path: 'services/code-generation-service.ts', name: 'CodeGenerationService', type: 'service' },
      { path: 'services/code-quality-service.ts', name: 'CodeQualityService', type: 'service' },
      { path: 'services/template-engine.ts', name: 'TemplateEngine', type: 'service' },
      { path: 'services/prompt-builder.ts', name: 'PromptBuilder', type: 'service' },
      { path: 'services/security-service.ts', name: 'SecurityService', type: 'service' },
      { path: 'services/ai-cost-service.ts', name: 'AICostService', type: 'service' },
      { path: 'services/monitoring-service.ts', name: 'MonitoringService', type: 'service' },
      { path: 'services/performance-monitor-service.ts', name: 'PerformanceMonitorService', type: 'service' },
      { path: 'services/intent-service.ts', name: 'IntentService', type: 'service' },
      { path: 'services/route-decision-service.ts', name: 'RouteDecisionService', type: 'service' },
      { path: 'utils/validation.ts', name: 'Validation', type: 'util' },
      { path: 'utils/logger.ts', name: 'Logger', type: 'util' },
      { path: 'utils/debounce.ts', name: 'Debounce', type: 'util' },
      { path: 'utils/api-client.ts', name: 'ApiClient', type: 'util' },
      { path: 'stores/design-store.ts', name: 'DesignStore', type: 'store' },
      { path: 'stores/session-store.ts', name: 'SessionStore', type: 'store' },
      { path: 'stores/layout-store.ts', name: 'LayoutStore', type: 'store' },
    ]

    // Initialise all modules
    for (const mod of knownModules) {
      moduleMap.set(mod.path, { name: mod.name, testCount: 0, passed: 0, type: mod.type })
    }

    // Count tests per target
    for (const sr of suiteResults) {
      const entry = moduleMap.get(sr.target)
      if (entry) {
        entry.testCount += sr.cases.length
        entry.passed += sr.passed
      }
    }

    // Build module coverage
    const modules: ModuleCoverage[] = knownModules.map(mod => {
      const entry = moduleMap.get(mod.path)!
      const covered = entry.testCount > 0
      // Estimate: if a module has tests, assume coverage proportional to pass count
      const coveragePct = covered ? Math.min(100, 60 + entry.passed * 5) : 0
      return {
        path: mod.path,
        name: mod.name,
        type: mod.type,
        metrics: {
          lines: coveragePct,
          functions: Math.max(0, coveragePct - 5),
          branches: Math.max(0, coveragePct - 10),
          statements: coveragePct,
        },
        uncoveredLines: covered ? [] : [{ start: 1, end: 100 }],
        testCount: entry.testCount,
      }
    })

    // Aggregate
    const coveredModules = modules.filter(m => m.testCount > 0)
    const totalModules = modules.length
    const avg = (field: keyof CoverageMetrics): number => {
      if (totalModules === 0) {return 0}
      return Math.round(modules.reduce((s, m) => s + m.metrics[field], 0) / totalModules)
    }

    const summary: CoverageMetrics = {
      lines: avg('lines'),
      functions: avg('functions'),
      branches: avg('branches'),
      statements: avg('statements'),
    }

    const th = this.config.coverageThresholds
    const meetsThreshold =
      summary.lines >= th.lines &&
      summary.functions >= th.functions &&
      summary.branches >= th.branches &&
      summary.statements >= th.statements

    return { timestamp: Date.now(), summary, modules, meetsThreshold }
  }

  /* ── Quality Gate ── */

  private evaluateQualityGate(
    summary: TestRunSummary,
    coverage: CoverageReport,
    durationMs: number,
  ): QualityGateResult {
    if (!this.config.qualityGate.enabled) {
      return { passed: true, conditions: [], timestamp: Date.now(), blockers: 0, criticals: 0 }
    }

    const metricValues: Record<string, number> = {
      passRate: summary.passRate * 100,
      coverageLines: coverage.summary.lines,
      coverageFunctions: coverage.summary.functions,
      coverageBranches: coverage.summary.branches,
      coverageStatements: coverage.summary.statements,
      errorCount: summary.errors,
      failedCount: summary.failed,
      durationSeconds: durationMs / 1000,
    }

    const results = this.config.qualityGate.conditions
      .filter(c => c.enabled)
      .map(condition => {
        const actualValue = metricValues[condition.metric] ?? 0
        const passed = this.evaluateOp(actualValue, condition.threshold, condition.operator)
        return { condition, actualValue, passed }
      })

    const blockers = results.filter(r => !r.passed && r.condition.severity === 'blocker').length
    const criticals = results.filter(r => !r.passed && r.condition.severity === 'critical').length
    const allPassed = results.every(r => r.passed)

    return {
      passed: allPassed,
      conditions: results,
      timestamp: Date.now(),
      blockers,
      criticals,
    }
  }

  private evaluateOp(value: number, threshold: number, op: string): boolean {
    switch (op) {
      case 'gte': return value >= threshold
      case 'lte': return value <= threshold
      case 'gt':  return value > threshold
      case 'lt':  return value < threshold
      case 'eq':  return value === threshold
      default: return false
    }
  }

  /* ── Events ── */

  onEvent(callback: (event: TestRunnerEvent) => void): () => void {
    this.subscribers.push(callback)
    return () => { this.subscribers = this.subscribers.filter(s => s !== callback) }
  }

  private emit(event: TestRunnerEvent): void {
    for (const sub of this.subscribers) {
      try { sub(event) } catch { /* */ }
    }
  }

  /* ── Queries ── */

  getLastRun(): TestRunResult | undefined {
    return this.runs[this.runs.length - 1]
  }

  getRunHistory(limit = 20): TestRunResult[] {
    return this.runs.slice(-limit)
  }

  getConfig(): TestRunnerConfig {
    return { ...this.config }
  }

  updateConfig(partial: Partial<TestRunnerConfig>): void {
    this.config = { ...this.config, ...partial }
    log.info('Test runner config updated')
  }

  /* ── Helpers ── */

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }

  clearHistory(): void {
    this.runs = []
  }

  reset(): void {
    this.suites.clear()
    this.runs = []
    this.runIdCounter = 0
  }
}

/* ================================================================
   Event Types
   ================================================================ */

export type TestRunnerEvent =
  | { type: 'run-start'; runId: string; totalSuites: number }
  | { type: 'run-complete'; runId: string; summary: TestRunSummary; qualityGate: QualityGateResult }
  | { type: 'suite-start'; suiteId: string; suiteName: string }
  | { type: 'suite-complete'; suiteId: string; result: TestSuiteResult }

/* ================================================================
   Singleton
   ================================================================ */

export const testRunnerService = new TestRunnerServiceImpl()
