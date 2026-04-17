/**
 * YYC³ AI - AI Code Generation E2E Tests
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module AI Code Generation E2E Tests
 * @description AI代码生成功能的端到端测试
 * @author YYC³ AI Team
 * @version 1.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { test, expect } from '@playwright/test'
import { Page } from '@playwright/test'

test.describe('AI Code Generation', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto('/')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('应该能够打开AI聊天面板', async () => {
    // 等待应用加载
    await page.waitForLoadState('networkidle')

    // 查找AI聊天面板按钮
    const chatPanelButton = page.locator('[aria-label*="chat"], [aria-label*="AI"], button:has-text("AI")')
    
    // 点击打开AI聊天面板
    await chatPanelButton.click()
    
    // 验证聊天面板已打开
    const chatPanel = page.locator('.chat-panel, [data-testid="chat-panel"]')
    await expect(chatPanel).toBeVisible()
  })

  test('应该能够发送AI请求', async () => {
    await page.waitForLoadState('networkidle')

    // 打开AI聊天面板
    const chatPanelButton = page.locator('[aria-label*="chat"], [aria-label*="AI"]')
    await chatPanelButton.click()

    // 等待聊天面板加载
    const chatInput = page.locator('textarea[placeholder*="输入"], textarea[placeholder*="message"], [data-testid="chat-input"]')
    await expect(chatInput).toBeVisible({ timeout: 5000 })

    // 输入消息
    const message = '请帮我创建一个React组件'
    await chatInput.fill(message)

    // 发送消息
    const sendButton = page.locator('button:has-text("发送"), button:has-text("Send"), [data-testid="send-message"]')
    await sendButton.click()

    // 验证消息已发送
    const sentMessage = page.locator('.message.user:has-text("' + message + '"), [data-message-type="user"]:has-text("' + message + '")')
    await expect(sentMessage).toBeVisible({ timeout: 10000 })
  })

  test('应该能够接收AI响应', async () => {
    await page.waitForLoadState('networkidle')

    // 打开AI聊天面板
    const chatPanelButton = page.locator('[aria-label*="chat"], [aria-label*="AI"]')
    await chatPanelButton.click()

    // 发送测试消息
    const chatInput = page.locator('textarea[placeholder*="输入"], [data-testid="chat-input"]')
    await chatInput.fill('测试消息')
    
    const sendButton = page.locator('button:has-text("发送"), button:has-text("Send"), [data-testid="send-message"]')
    await sendButton.click()

    // 等待并验证AI响应
    const aiResponse = page.locator('.message.assistant, [data-message-type="assistant"]')
    await expect(aiResponse).toBeVisible({ timeout: 30000 })
    
    // 验证响应内容不为空
    const responseText = await aiResponse.textContent()
    expect(responseText?.length).toBeGreaterThan(0)
  })

  test('应该能够进行代码生成', async () => {
    await page.waitForLoadState('networkidle')

    // 打开AI聊天面板
    const chatPanelButton = page.locator('[aria-label*="chat"], [aria-label*="AI"]')
    await chatPanelButton.click()

    // 请求生成代码
    const codeRequest = '请生成一个使用TypeScript和React的计数器组件'
    const chatInput = page.locator('textarea[placeholder*="输入"], [data-testid="chat-input"]')
    await chatInput.fill(codeRequest)
    
    const sendButton = page.locator('button:has-text("发送"), button:has-text("Send"), [data-testid="send-message"]')
    await sendButton.click()

    // 等待AI响应
    const aiResponse = page.locator('.message.assistant, [data-message-type="assistant"]')
    await expect(aiResponse).toBeVisible({ timeout: 30000 })

    // 验证响应中包含代码块
    const codeBlock = aiResponse.locator('pre code, .code-block, [data-code-block="true"]')
    await expect(codeBlock).toBeVisible({ timeout: 5000 })
  })

  test('应该能够使用快捷键打开AI面板', async () => {
    await page.waitForLoadState('networkidle')

    // 使用快捷键打开AI面板（假设快捷键是⌘ + Shift + A）
    await page.keyboard.press('Meta+Shift+A')

    // 验证AI面板已打开
    const aiPanel = page.locator('.ai-panel, [data-testid="ai-panel"], .agent-workflow-panel, [data-testid="agent-panel"]')
    await expect(aiPanel).toBeVisible({ timeout: 5000 })
  })

  test('应该能够查看AI生成历史', async () => {
    await page.waitForLoadState('networkidle')

    // 打开AI聊天面板
    const chatPanelButton = page.locator('[aria-label*="chat"], [aria-label*="AI"]')
    await chatPanelButton.click()

    // 发送两条消息
    const chatInput = page.locator('textarea[placeholder*="输入"], [data-testid="chat-input"]')
    const sendButton = page.locator('button:has-text("发送"), button:has-text("Send"), [data-testid="send-message"]')
    
    await chatInput.fill('消息1')
    await sendButton.click()
    await page.waitForTimeout(1000)
    
    await chatInput.fill('消息2')
    await sendButton.click()

    // 验证历史记录显示两条消息
    const userMessages = page.locator('.message.user, [data-message-type="user"]')
    const count = await userMessages.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('应该能够清空AI对话', async () => {
    await page.waitForLoadState('networkidle')

    // 打开AI聊天面板
    const chatPanelButton = page.locator('[aria-label*="chat"], [aria-label*="AI"]')
    await chatPanelButton.click()

    // 发送一条消息
    const chatInput = page.locator('textarea[placeholder*="输入"], [data-testid="chat-input"]')
    const sendButton = page.locator('button:has-text("发送"), button:has-text("Send"), [data-testid="send-message"]')
    await chatInput.fill('测试消息')
    await sendButton.click()

    // 等待消息出现
    const userMessages = page.locator('.message.user, [data-message-type="user"]')
    await expect(userMessages).toHaveCount(1)

    // 查找并点击清空按钮
    const clearButton = page.locator('button:has-text("清空"), button:has-text("Clear"), [data-testid="clear-chat"]')
    if (await clearButton.count() > 0) {
      await clearButton.click()
      
      // 验证消息已被清空
      await expect(userMessages).toHaveCount(0, { timeout: 3000 })
    }
  })
})
