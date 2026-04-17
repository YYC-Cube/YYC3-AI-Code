#!/usr/bin/env node

/**
 * @file test-helper.js
 * @description 测试辅助脚本 - 运行特定测试并生成报告
 * @author YYC³ AI Team
 * @version 1.0.0
 * @created 2026-03-24
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

/**
 * 运行命令并返回结果
 */
function runCommand(command, description) {
  try {
    console.log(`${colors.cyan}▶ ${description}${colors.reset}`)
    const output = execSync(command, { encoding: 'utf-8' })
    return { success: true, output }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * 解析测试输出
 */
function parseTestOutput(output) {
  const lines = output.split('\n')
  const result = {
    testFiles: { passed: 0, failed: 0, total: 0 },
    tests: { passed: 0, failed: 0, total: 0 },
    errors: 0,
    duration: 0,
  }

  for (const line of lines) {
    const testFilesMatch = line.match(/Test Files\s+\|\s+(\d+) failed\s+\|\s+(\d+) passed\s+\((\d+)\)/)
    if (testFilesMatch) {
      result.testFiles.failed = parseInt(testFilesMatch[1])
      result.testFiles.passed = parseInt(testFilesMatch[2])
      result.testFiles.total = parseInt(testFilesMatch[3])
    }

    const testsMatch = line.match(/Tests\s+\|\s+(\d+) failed\s+\|\s+(\d+) passed\s+\((\d+)\)/)
    if (testsMatch) {
      result.tests.failed = parseInt(testsMatch[1])
      result.tests.passed = parseInt(testsMatch[2])
      result.tests.total = parseInt(testsMatch[3])
    }

    const errorsMatch = line.match(/Errors\s+\|\s+(\d+) errors/)
    if (errorsMatch) {
      result.errors = parseInt(errorsMatch[1])
    }

    const durationMatch = line.match(/Duration\s+\|\s+(\d+\.?\d*)s/)
    if (durationMatch) {
      result.duration = parseFloat(durationMatch[1])
    }
  }

  return result
}

/**
 * 打印测试结果
 */
function printTestResult(result, name) {
  const { testFiles, tests, errors, duration } = result

  const testFilesPassRate = testFiles.total > 0
    ? ((testFiles.passed / testFiles.total) * 100).toFixed(1)
    : 0

  const testsPassRate = tests.total > 0
    ? ((tests.passed / tests.total) * 100).toFixed(1)
    : 0

  console.log(`\n${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.magenta}  ${name}${colors.reset}`)
  console.log(`${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  // Test Files
  console.log(`${colors.cyan}📁 Test Files:${colors.reset}`)
  console.log(`   ${colors.green}✓${colors.reset} ${testFiles.passed} passed`)
  if (testFiles.failed > 0) {
    console.log(`   ${colors.red}✗${colors.reset} ${testFiles.failed} failed`)
  }
  console.log(`   ${colors.blue}→${colors.reset} ${testFiles.total} total (${testFilesPassRate}% pass rate)`)

  // Tests
  console.log(`\n${colors.cyan}🧪 Tests:${colors.reset}`)
  console.log(`   ${colors.green}✓${colors.reset} ${tests.passed} passed`)
  if (tests.failed > 0) {
    console.log(`   ${colors.red}✗${colors.reset} ${tests.failed} failed`)
  }
  console.log(`   ${colors.blue}→${colors.reset} ${tests.total} total (${testsPassRate}% pass rate)`)

  // Errors
  if (errors > 0) {
    console.log(`\n${colors.red}⚠ Errors:${colors.reset}`)
    console.log(`   ${errors} errors`)
  }

  // Duration
  console.log(`\n${colors.yellow}⏱ Duration:${colors.reset} ${duration.toFixed(2)}s`)

  // Overall Status
  console.log(`\n${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  if (tests.failed === 0 && errors === 0) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}`)
  } else {
    console.log(`${colors.red}✗ Some tests failed${colors.reset}`)
  }
  console.log(`${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'all'

  console.log(`${colors.magenta}\n🚀 YYC³ AI Project Test Runner${colors.reset}\n`)

  if (command === 'unit') {
    const result = runCommand('pnpm test tests/unit', 'Running unit tests...')
    if (result.success) {
      const parsed = parseTestOutput(result.output)
      printTestResult(parsed, 'Unit Tests')
    } else {
      console.error(`${colors.red}✗ Failed to run unit tests${colors.reset}`)
      console.error(result.error)
    }
  } else if (command === 'integration') {
    const result = runCommand('pnpm test tests/integration', 'Running integration tests...')
    if (result.success) {
      const parsed = parseTestOutput(result.output)
      printTestResult(parsed, 'Integration Tests')
    } else {
      console.error(`${colors.red}✗ Failed to run integration tests${colors.reset}`)
      console.error(result.error)
    }
  } else if (command === 'e2e') {
    const result = runCommand('pnpm test:e2e', 'Running E2E tests...')
    if (result.success) {
      const parsed = parseTestOutput(result.output)
      printTestResult(parsed, 'E2E Tests')
    } else {
      console.error(`${colors.red}✗ Failed to run E2E tests${colors.reset}`)
      console.error(result.error)
    }
  } else if (command === 'coverage') {
    const result = runCommand('pnpm test:coverage', 'Running tests with coverage...')
    if (result.success) {
      const parsed = parseTestOutput(result.output)
      printTestResult(parsed, 'Coverage Report')
    } else {
      console.error(`${colors.red}✗ Failed to run coverage tests${colors.reset}`)
      console.error(result.error)
    }
  } else if (command === 'all') {
    // Run all tests
    const unitResult = runCommand('pnpm test tests/unit', 'Running unit tests...')
    const integrationResult = runCommand('pnpm test tests/integration', 'Running integration tests...')
    const e2eResult = runCommand('pnpm test:e2e', 'Running E2E tests...')

    if (unitResult.success) {
      const parsed = parseTestOutput(unitResult.output)
      printTestResult(parsed, 'Unit Tests')
    }

    if (integrationResult.success) {
      const parsed = parseTestOutput(integrationResult.output)
      printTestResult(parsed, 'Integration Tests')
    }

    if (e2eResult.success) {
      const parsed = parseTestOutput(e2eResult.output)
      printTestResult(parsed, 'E2E Tests')
    }
  } else {
    console.log(`${colors.yellow}Usage:${colors.reset}`)
    console.log('  node test-helper.js [command]')
    console.log('')
    console.log(`${colors.cyan}Commands:${colors.reset}`)
    console.log('  unit          Run unit tests only')
    console.log('  integration   Run integration tests only')
    console.log('  e2e           Run E2E tests only')
    console.log('  coverage      Run tests with coverage report')
    console.log('  all           Run all tests (default)')
    console.log('')
  }
}

main().catch(console.error)
