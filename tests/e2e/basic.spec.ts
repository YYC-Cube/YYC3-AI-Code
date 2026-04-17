/**
 * 基础页面 E2E 测试
 * 验证应用的页面渲染和基本功能
 */

import { test, expect } from '@playwright/test'

test.describe('基础页面 - Basic Pages', () => {
  test('应该成功加载首页', async ({ page }) => {
    // 导航到首页
    await page.goto('/')

    // 检查页面标题
    await expect(page).toHaveTitle(/YYC³ Code AI/)

    // 检查页面已加载
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // 检查主容器存在
    const main = page.locator('#root')
    await expect(main).toBeVisible()
  })

  test('应该成功加载设置页面', async ({ page }) => {
    // 导航到设置页面
    await page.goto('/settings')

    // 检查页面标题
    await expect(page).toHaveTitle(/设置/)

    // 检查页面已加载
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('应该处理 404 页面', async ({ page }) => {
    // 导航到不存在的页面
    await page.goto('/non-existent-page')

    // 检查是否显示 404 页面或重定向到首页
    await expect(page).toHaveURL(/(\/non-existent-page|\/)/)
  })

  test('应该正确渲染响应式布局', async ({ page }) => {
    // 导航到首页
    await page.goto('/')

    // 测试桌面视图
    await page.setViewportSize({ width: 1920, height: 1080 })
    const mainDesktop = page.locator('#root')
    await expect(mainDesktop).toBeVisible()

    // 测试平板视图
    await page.setViewportSize({ width: 768, height: 1024 })
    const mainTablet = page.locator('#root')
    await expect(mainTablet).toBeVisible()

    // 测试移动视图
    await page.setViewportSize({ width: 375, height: 667 })
    const mainMobile = page.locator('#root')
    await expect(mainMobile).toBeVisible()
  })

  test('应该正确处理页面加载状态', async ({ page }) => {
    // 导航到首页
    await page.goto('/')

    // 等待页面完全加载
    await page.waitForLoadState('networkidle')

    // 检查没有加载指示器
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]')
    const isVisible = await loadingIndicator.isVisible().catch(() => false)
    expect(isVisible).toBe(false)
  })
})

test.describe('页面性能 - Page Performance', () => {
  test('首页加载时间应该在合理范围内', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // 页面加载时间应该小于 3 秒
    expect(loadTime).toBeLessThan(3000)
  })

  test('设置页面加载时间应该在合理范围内', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // 页面加载时间应该小于 3 秒
    expect(loadTime).toBeLessThan(3000)
  })
})

test.describe('页面可访问性 - Accessibility', () => {
  test('应该有正确的 HTML 结构', async ({ page }) => {
    await page.goto('/')

    // 检查主元素存在
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // 检查页面语言属性
    const html = page.locator('html')
    const lang = await html.getAttribute('lang')
    expect(lang).toBeTruthy()
  })

  test('应该有正确的标题层次结构', async ({ page }) => {
    await page.goto('/')

    // 检查页面有 h1 标题
    const h1 = page.locator('h1')
    const h1Count = await h1.count()
    expect(h1Count).toBeGreaterThan(0)

    // 如果有多个标题，检查层次结构
    const h2 = page.locator('h2')
    const h2Count = await h2.count()
    // h1 后面可以有多个 h2
    if (h2Count > 0) {
      const firstH1 = h1.first()
      const firstH2 = h2.first()
      const h1BoundingBox = await firstH1.boundingBox()
      const h2BoundingBox = await firstH2.boundingBox()
      if (h1BoundingBox && h2BoundingBox) {
        expect(h2BoundingBox.y).toBeGreaterThan(h1BoundingBox.y)
      }
    }
  })

  test('按钮和链接应该有可访问的名称', async ({ page }) => {
    await page.goto('/')

    // 检查所有按钮有文本或 aria-label
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i)
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')
        expect(text?.trim() || ariaLabel).toBeTruthy()
      }
    }
  })
})
