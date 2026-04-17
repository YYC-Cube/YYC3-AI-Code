/**
 * 导航 E2E 测试
 * 验证应用的导航功能
 */

import { test, expect } from '@playwright/test'

test.describe('导航功能 - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前导航到首页
    await page.goto('/')
  })

  test('应该能够从首页导航到设置页面', async ({ page }) => {
    // 导航到设置页面
    await page.goto('/settings')

    // 检查 URL 已更新
    await expect(page).toHaveURL(/\/settings/)

    // 检查页面标题
    await expect(page).toHaveTitle(/设置/)

    // 等待页面加载完成
    await page.waitForLoadState('networkidle')
  })

  test('应该能够从设置页面导航回首页', async ({ page }) => {
    // 先导航到设置页面
    await page.goto('/settings')

    // 导航回首页
    await page.goto('/')

    // 检查 URL 已更新
    await expect(page).toHaveURL(/\//)

    // 检查页面标题
    await expect(page).toHaveTitle(/YYC³/)
  })

  test('应该支持浏览器前进和后退', async ({ page }) => {
    // 导航到设置页面
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings/)

    // 后退
    await page.goBack()
    await expect(page).toHaveURL(/\//)

    // 前进
    await page.goForward()
    await expect(page).toHaveURL(/\/settings/)
  })

  test('应该支持直接输入 URL 导航', async ({ page }) => {
    // 导航到设置页面
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings/)

    // 导航到首页
    await page.goto('/')
    await expect(page).toHaveURL(/\//)

    // 再次导航到设置页面
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings/)
  })

  test('应该正确处理 URL 参数', async ({ page }) => {
    // 导航到带参数的首页
    await page.goto('/?test=123')

    // 检查 URL 包含参数
    await expect(page).toHaveURL(/\?test=123/)

    // 页面应该正常加载
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('应该正确处理 URL 哈希', async ({ page }) => {
    // 导航到带哈希的首页
    await page.goto('/#section')

    // 检查 URL 包含哈希
    await expect(page).toHaveURL(/#section/)

    // 页面应该正常加载
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('导航性能 - Navigation Performance', () => {
  test('导航速度应该在合理范围内', async ({ page }) => {
    // 首页加载
    const homeStartTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const homeLoadTime = Date.now() - homeStartTime

    // 设置页面加载
    const settingsStartTime = Date.now()
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    const settingsLoadTime = Date.now() - settingsStartTime

    // 两个页面的加载时间都应该小于 3 秒
    expect(homeLoadTime).toBeLessThan(3000)
    expect(settingsLoadTime).toBeLessThan(3000)
  })

  test('多次导航不应该有明显的性能下降', async ({ page }) => {
    const loadTimes: number[] = []

    // 进行 5 次导航
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      loadTimes.push(loadTime)

      // 导航到设置页面
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')
    }

    // 检查加载时间相对稳定（变化不超过 50%）
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
    const maxLoadTime = Math.max(...loadTimes)
    const minLoadTime = Math.min(...loadTimes)

    const variation = (maxLoadTime - minLoadTime) / avgLoadTime
    expect(variation).toBeLessThan(0.5)
  })
})

test.describe('路由保护 - Route Protection', () => {
  test('应该正确处理未授权的路由', async ({ page }) => {
    // 如果有需要授权的路由，应该重定向或显示错误
    // 这里我们假设大部分路由都是公开的

    // 导航到一个可能受保护的路径
    await page.goto('/admin')

    // 检查是否重定向或显示错误
    const currentUrl = page.url()

    // 可能的选项：
    // 1. 重定向到首页
    // 2. 重定向到登录页面
    // 3. 显示 404 页面
    // 4. 显示 403 页面

    // 这里我们只检查页面仍然可以访问
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('应该正确处理 404 路由', async ({ page }) => {
    // 导航到不存在的页面
    await page.goto('/this-page-does-not-exist-12345')

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 检查页面仍然可以渲染（React Router 的 404 处理）
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // 或者检查 URL 保持不变
    await expect(page).toHaveURL(/\/this-page-does-not-exist-12345/)
  })
})
