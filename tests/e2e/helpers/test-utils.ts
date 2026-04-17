/**
 * E2E 测试辅助工具
 * 提供通用的测试辅助函数和页面对象
 */

import { Page, Locator, expect } from '@playwright/test'

/**
 * 通用测试辅助类
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 等待元素可见并可交互
   */
  async waitForElement(selector: string, timeout = 5000): Promise<Locator> {
    const element = this.page.locator(selector)
    await element.waitFor({ state: 'visible', timeout })
    return element
  }

  /**
   * 安全点击元素（等待可见后点击）
   */
  async safeClick(selector: string): Promise<void> {
    const element = await this.waitForElement(selector)
    await element.click()
  }

  /**
   * 安全输入文本（等待可见后输入）
   */
  async safeType(selector: string, text: string): Promise<void> {
    const element = await this.waitForElement(selector)
    await element.fill('')
    await element.type(text, { delay: 50 })
  }

  /**
   * 截图（用于调试）
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true })
  }

  /**
   * 检查元素是否存在
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 2000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * 等待 URL 变化
   */
  async waitForURL(pattern: RegExp | string): Promise<void> {
    await this.page.waitForURL(pattern)
  }

  /**
   * 导航到指定路径
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path)
    await this.waitForPageLoad()
  }
}

/**
 * 应用通用页面对象
 */
export class AppPage {
  protected helpers: TestHelpers

  constructor(protected page: Page) {
    this.helpers = new TestHelpers(this.page)
  }

  /**
   * 获取当前 URL
   */
  getCurrentURL(): string {
    return this.page.url()
  }

  /**
   * 检查页面标题
   */
  async expectTitle(title: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(title))
  }

  /**
   * 检查 URL 包含指定路径
   */
  async expectURLContains(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path))
  }

  /**
   * 导航到指定路径
   */
  async navigateTo(path: string): Promise<void> {
    await this.helpers.navigateTo(path)
  }
}

/**
 * 首页页面对象
 */
export class HomePage extends AppPage {
  /**
   * 导航到首页
   */
  async goto(): Promise<void> {
    await this.navigateTo('/')
  }

  /**
   * 检查是否在首页
   */
  async isOnPage(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="home-page"]')
  }

  /**
   * 获取欢迎标题
   */
  getWelcomeTitle(): Locator {
    return this.page.locator('[data-testid="welcome-title"]')
  }

  /**
   * 获取主要操作按钮
   */
  getMainActionButtons(): Locator {
    return this.page.locator('[data-testid^="main-action-"]')
  }
}

/**
 * 设置页面页面对象
 */
export class SettingsPage extends AppPage {
  /**
   * 导航到设置页面
   */
  async goto(): Promise<void> {
    await this.navigateTo('/settings')
  }

  /**
   * 检查是否在设置页面
   */
  async isOnPage(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="settings-page"]')
  }

  /**
   * 获取设置选项卡
   */
  getSettingsTabs(): Locator {
    return this.page.locator('[data-testid^="settings-tab-"]')
  }

  /**
   * 获取主题切换按钮
   */
  getThemeToggle(): Locator {
    return this.page.locator('[data-testid="theme-toggle"]')
  }
}

/**
 * 导航栏页面对象
 */
export class NavigationBar {
  constructor(private page: Page) {}

  /**
   * 获取首页链接
   */
  getHomeLink(): Locator {
    return this.page.locator('[data-testid="nav-home"]')
  }

  /**
   * 获取设置链接
   */
  getSettingsLink(): Locator {
    return this.page.locator('[data-testid="nav-settings"]')
  }

  /**
   * 点击首页链接
   */
  async clickHome(): Promise<void> {
    await this.getHomeLink().click()
  }

  /**
   * 点击设置链接
   */
  async clickSettings(): Promise<void> {
    await this.getSettingsLink().click()
  }
}

/**
 * 主题切换页面对象
 */
export class ThemeToggle {
  constructor(private page: Page) {}

  /**
   * 获取主题切换按钮
   */
  getToggle(): Locator {
    return this.page.locator('[data-testid="theme-toggle"]')
  }

  /**
   * 切换主题
   */
  async toggle(): Promise<void> {
    await this.getToggle().click()
  }

  /**
   * 检查当前主题
   */
  async isDarkMode(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark')
    })
  }
}
