import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // 并行运行测试
  fullyParallel: true,
  
  // 失败时重试 2 次
  retries: process.env.CI ? 2 : 0,
  
  // 并发工作线程数
  workers: process.env.CI ? 1 : undefined,
  
  // 测试超时时间（单位：毫秒）
  timeout: 30 * 1000,
  
  // 期望超时时间
  expect: {
    timeout: 5000,
  },
  
  // 报告器配置
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  // 全局设置
  use: {
    // 基础 URL（用于相对路径）
    baseURL: 'http://localhost:3201',
    
    // 浏览器上下文配置
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 超时配置
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 测试项目配置
  projects: [
    // Chrome (桌面)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Firefox (桌面)
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Safari (桌面)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Chrome (移动设备)
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    // Safari (移动设备)
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 启动开发服务器（测试前）
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3201',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
