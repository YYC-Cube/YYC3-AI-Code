/**
 * @file vitest.config.ts
 * @description Vitest 测试配置 — 环境、覆盖率、路径别名、超时、并行度
 * @version v1.0.0
 *
 * 使用方式:
 *   npx vitest --config src/tests/vitest.config.ts
 *   npx vitest --config src/tests/vitest.config.ts --coverage
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // ── 测试环境 ──
    environment: 'jsdom',

    // ── 全局 Setup ──
    setupFiles: ['./src/tests/setup.ts'],

    // ── 包含的测试文件 ──
    include: [
      'src/tests/**/*.test.{ts,tsx}',
      'src/tests/**/*.spec.{ts,tsx}',
    ],

    // ── 排除 ──
    exclude: [
      'node_modules',
      'dist',
      'src/tests/e2e/**', // E2E 由 Playwright 单独运行
    ],

    // ── 超时 ──
    testTimeout: 10_000,
    hookTimeout: 15_000,

    // ── 并行 ──
    pool: 'forks',

    // ── 覆盖率 ──
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/app/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/app/components/figma/**',
        'src/tests/**',
        '**/*.d.ts',
        '**/node_modules/**',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 75,
        lines: 80,
      },
    },

    // ── 全局变量 ──
    globals: true,

    // ── CSS ──
    css: false,

    // ── 报告 ──
    reporters: ['default', 'verbose'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../app'),
    },
  },
});
