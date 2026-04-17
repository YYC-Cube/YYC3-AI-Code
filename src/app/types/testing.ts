/**
 * @file testing.ts
 * @description YYC³ 测试体系类型定义 — 测试套件、用例、结果、覆盖率、质量门禁
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Covers: Test pyramid (60% unit / 30% integration / 10% E2E),
 *         coverage thresholds, quality gates, CI pipeline config.
 */

/* ================================================================
   Test Types & Status
   ================================================================ */

export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security'
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'error'
export type TestSeverity = 'critical' | 'major' | 'minor' | 'trivial'

/* ================================================================
   Test Pyramid Configuration
   ================================================================ */

export interface TestPyramidConfig {
  unit: TestTierConfig
  integration: TestTierConfig
  e2e: TestTierConfig
  performance: TestTierConfig
  security: TestTierConfig
}

export interface TestTierConfig {
  /** Target percentage of total tests */
  targetRatio: number
  /** Minimum coverage threshold (0-100) */
  coverageThreshold: number
  /** Execution frequency */
  frequency: 'commit' | 'pr' | 'daily' | 'weekly' | 'monthly'
  /** Tool identifiers */
  tools: string[]
  /** Whether this tier is enabled */
  enabled: boolean
}

/* ================================================================
   Test Suite & Case
   ================================================================ */

export interface TestSuite {
  id: string
  name: string
  description: string
  type: TestType
  /** Module / file path this suite covers */
  target: string
  cases: TestCase[]
  setup?: () => Promise<void>
  teardown?: () => Promise<void>
  tags: string[]
  timeout: number
}

export interface TestCase {
  id: string
  name: string
  description?: string
  type: TestType
  severity: TestSeverity
  /** The assertion function (returns true for pass) */
  fn: () => Promise<TestAssertionResult>
  /** Expected behaviour description */
  expected: string
  tags: string[]
  timeout: number
  retries: number
  skip?: boolean
}

export interface TestAssertionResult {
  passed: boolean
  message?: string
  actual?: unknown
  expected?: unknown
  duration?: number
}

/* ================================================================
   Test Results
   ================================================================ */

export interface TestCaseResult {
  caseId: string
  caseName: string
  suiteId: string
  type: TestType
  status: TestStatus
  duration: number
  /** Assertion details */
  assertion?: TestAssertionResult
  error?: {
    message: string
    stack?: string
  }
  retries: number
  timestamp: number
}

export interface TestSuiteResult {
  suiteId: string
  suiteName: string
  type: TestType
  target: string
  status: TestStatus
  /** Individual case results */
  cases: TestCaseResult[]
  duration: number
  passed: number
  failed: number
  skipped: number
  errors: number
  timestamp: number
}

export interface TestRunResult {
  id: string
  startTime: number
  endTime: number
  duration: number
  suites: TestSuiteResult[]
  summary: TestRunSummary
  coverage: CoverageReport
  qualityGate: QualityGateResult
}

export interface TestRunSummary {
  totalSuites: number
  totalCases: number
  passed: number
  failed: number
  skipped: number
  errors: number
  passRate: number
  byType: Record<TestType, { total: number; passed: number; failed: number }>
}

/* ================================================================
   Coverage
   ================================================================ */

export interface CoverageReport {
  timestamp: number
  /** Aggregated coverage metrics */
  summary: CoverageMetrics
  /** Per-module breakdown */
  modules: ModuleCoverage[]
  /** Meets the configured thresholds? */
  meetsThreshold: boolean
}

export interface CoverageMetrics {
  lines: number        // 0-100
  functions: number    // 0-100
  branches: number     // 0-100
  statements: number   // 0-100
}

export interface ModuleCoverage {
  path: string
  name: string
  type: 'service' | 'component' | 'util' | 'store' | 'type'
  metrics: CoverageMetrics
  /** Uncovered line ranges */
  uncoveredLines: Array<{ start: number; end: number }>
  /** Number of test cases covering this module */
  testCount: number
}

export interface CoverageThresholds {
  lines: number
  functions: number
  branches: number
  statements: number
}

/* ================================================================
   Quality Gate
   ================================================================ */

export interface QualityGateConfig {
  enabled: boolean
  /** All conditions must pass for the gate to pass */
  conditions: QualityGateCondition[]
}

export interface QualityGateCondition {
  id: string
  name: string
  metric: string
  operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq'
  threshold: number
  /** Severity when this condition fails */
  severity: 'blocker' | 'critical' | 'major' | 'minor'
  enabled: boolean
}

export interface QualityGateResult {
  passed: boolean
  conditions: Array<{
    condition: QualityGateCondition
    actualValue: number
    passed: boolean
  }>
  timestamp: number
  blockers: number
  criticals: number
}

/* ================================================================
   Test Runner Configuration
   ================================================================ */

export interface TestRunnerConfig {
  /** Maximum parallel suites */
  concurrency: number
  /** Default timeout per case (ms) */
  defaultTimeout: number
  /** Default retries per case */
  defaultRetries: number
  /** Stop on first failure */
  bail: boolean
  /** Filter by type */
  filterTypes?: TestType[]
  /** Filter by tag */
  filterTags?: string[]
  /** Verbose output */
  verbose: boolean
  /** Coverage collection enabled */
  collectCoverage: boolean
  /** Coverage thresholds */
  coverageThresholds: CoverageThresholds
  /** Quality gate */
  qualityGate: QualityGateConfig
}

/* ================================================================
   CI Pipeline Types
   ================================================================ */

export interface CIPipelineConfig {
  name: string
  triggers: CITrigger[]
  jobs: CIJob[]
}

export interface CITrigger {
  event: 'push' | 'pull_request' | 'schedule'
  branches: string[]
  schedule?: string
}

export interface CIJob {
  id: string
  name: string
  runsOn: string
  needs?: string[]
  steps: CIStep[]
  env?: Record<string, string>
}

export interface CIStep {
  name: string
  command?: string
  uses?: string
  with?: Record<string, string>
  env?: Record<string, string>
  continueOnError?: boolean
}

/* ================================================================
   Test Health Dashboard
   ================================================================ */

export interface TestHealthReport {
  timestamp: number
  overallScore: number      // 0-100
  status: 'healthy' | 'degraded' | 'critical'
  pyramid: {
    unit: { actual: number; target: number; met: boolean }
    integration: { actual: number; target: number; met: boolean }
    e2e: { actual: number; target: number; met: boolean }
  }
  coverage: CoverageReport
  qualityGate: QualityGateResult
  recentRuns: TestRunResult[]
  trends: {
    passRate: number[]
    coverage: number[]
    duration: number[]
  }
  recommendations: string[]
}
