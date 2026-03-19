/**
 * @file playwright.config.ts
 * @description Playwright E2E 测试配置
 * @version v1.0.0
 *
 * 运行方式:
 *   npx playwright test --config src/tests/e2e/playwright.config.ts
 */

/*
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 30_000,
  retries: 1,
  workers: 2,

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'Chrome Desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Firefox Desktop',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Safari Desktop',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Edge Desktop',
      use: { ...devices['Desktop Edge'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'pnpm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 60_000,
  },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '../../test-results/e2e-report' }],
    ['json', { outputFile: '../../test-results/e2e-results.json' }],
  ],
});
*/

export {};
