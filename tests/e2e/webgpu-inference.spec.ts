/**
 * YYC³ AI - WebGPU Inference E2E Tests
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module WebGPU Inference E2E Tests
 * @description WebGPU推理功能的端到端测试
 * @author YYC³ AI Team
 * @version 1.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { test, expect } from '@playwright/test'
import { Page } from '@playwright/test'

test.describe('WebGPU Inference', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto('/')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('应该能够打开WebGPU设置面板', async () => {
    await page.waitForLoadState('networkidle')

    // 查找设置按钮
    const settingsButton = page.locator('[aria-label*="设置"], button:has-text("设置"), [data-testid="settings-button"]')
    await settingsButton.click()

    // 查找并点击WebGPU设置
    const webgpuSettings = page.locator('[data-testid="webgpu-settings"], [aria-label*="WebGPU"], [aria-label*="GPU"]')
    await expect(webgpuSettings).toBeVisible({ timeout: 5000 })
  })

  test('应该能够查看WebGPU设备信息', async () => {
    await page.waitForLoadState('networkidle')

    // 打开WebGPU设置
    const settingsButton = page.locator('[aria-label*="设置"], button:has-text("设置"), [data-testid="settings-button"]')
    await settingsButton.click()
    
    const webgpuSettings = page.locator('[data-testid="webgpu-settings"]')
    await webgpuSettings.click()

    // 验证设备信息显示
    const deviceInfo = page.locator('[data-testid="gpu-device-info"]')
    await expect(deviceInfo).toBeVisible({ timeout: 5000 })

    // 验证显示GPU类型
    const gpuType = page.locator('[data-testid="gpu-type"]')
    const gpuTypeText = await gpuType.textContent()
    expect(gpuTypeText?.length).toBeGreaterThan(0)
  })

  test('应该能够选择推理后端', async () => {
    await page.waitForLoadState('networkidle')

    // 打开WebGPU设置
    const settingsButton = page.locator('[aria-label*="设置"], button:has-text("设置"), [data-testid="settings-button"]')
    await settingsButton.click()
    
    const webgpuSettings = page.locator('[data-testid="webgpu-settings"]')
    await webgpuSettings.click()

    // 查找后端选择器
    const backendSelector = page.locator('[data-testid="backend-selector"]')
    await expect(backendSelector).toBeVisible({ timeout: 5000 })

    // 选择WebGPU后端
    const webgpuOption = backendSelector.locator('option[value="webgpu"]')
    if (await webgpuOption.count() > 0) {
      await backendSelector.selectOption('webgpu')
      
      // 验证选择成功
      const selectedValue = await backendSelector.inputValue()
      expect(selectedValue).toBe('webgpu')
    }
  })

  test('应该能够加载AI模型', async () => {
    await page.waitForLoadState('networkidle')

    // 打开WebGPU设置
    const settingsButton = page.locator('[aria-label*="设置"], button:has-text("设置"), [data-testid="settings-button"]')
    await settingsButton.click()
    
    const webgpuSettings = page.locator('[data-testid="webgpu-settings"]')
    await webgpuSettings.click()

    // 查找模型加载区域
    const modelLoader = page.locator('[data-testid="model-loader"]')
    await expect(modelLoader).toBeVisible({ timeout: 5000 })

    // 选择一个模型（如果有模型列表）
    const modelList = page.locator('[data-testid="model-list"]')
    if (await modelList.count() > 0) {
      const firstModel = modelList.locator('li').first()
      await firstModel.click()
      
      // 验证模型已加载
      const loadedModel = page.locator('[data-testid="loaded-model"]')
      await expect(loadedModel).toBeVisible({ timeout: 10000 })
    }
  })

  test('应该能够执行WebGPU推理', async () => {
    await page.waitForLoadState('networkidle')

    // 打开AI聊天面板
    const chatPanelButton = page.locator('[aria-label*="chat"], [aria-label*="AI"]')
    await chatPanelButton.click()

    // 等待聊天输入框
    const chatInput = page.locator('textarea[placeholder*="输入"], textarea[placeholder*="message"], [data-testid="chat-input"]')
    await expect(chatInput).toBeVisible({ timeout: 5000 })

    // 输入推理请求
    const inferenceRequest = '使用WebGPU推理：计算两个向量的点积'
    await chatInput.fill(inferenceRequest)

    // 发送请求
    const sendButton = page.locator('button:has-text("发送"), button:has-text("Send"), [data-testid="send-message"]')
    await sendButton.click()

    // 等待AI响应
    const aiResponse = page.locator('.message.assistant, [data-message-type="assistant"]')
    await expect(aiResponse).toBeVisible({ timeout: 30000 })

    // 验证响应中包含推理结果
    const responseText = await aiResponse.textContent()
    expect(responseText?.length).toBeGreaterThan(0)
  })

  test('应该能够查看推理性能指标', async () => {
    await page.waitForLoadState('networkidle')

    // 打开WebGPU设置
    const settingsButton = page.locator('[aria-label*="设置"], button:has-text("设置"), [data-testid="settings-button"]')
    await settingsButton.click()
    
    const webgpuSettings = page.locator('[data-testid="webgpu-settings"]')
    await webgpuSettings.click()

    // 查找性能指标面板
    const performanceMetrics = page.locator('[data-testid="performance-metrics"]')
    await expect(performanceMetrics).toBeVisible({ timeout: 5000 })

    // 验证显示关键指标
    const latency = page.locator('[data-metric="latency"]')
    const throughput = page.locator('[data-metric="throughput"]')
    const gpuUtilization = page.locator('[data-metric="gpu-utilization"]')
    
    await expect(latency).toBeVisible()
    await expect(throughput).toBeVisible()
    await expect(gpuUtilization).toBeVisible()
  })

  test('应该能够处理WebGPU不可用的情况', async () => {
    await page.waitForLoadState('networkidle')

    // 打开WebGPU设置
    const settingsButton = page.locator('[aria-label*="设置"], button:has-text("设置"), [data-testid="settings-button"]')
    await settingsButton.click()
    
    const webgpuSettings = page.locator('[data-testid="webgpu-settings"]')
    await webgpuSettings.click()

    // 验证在WebGPU不可用时显示警告
    const warningMessage = page.locator('[data-testid="webgpu-warning"], .warning-message')
    const fallbackInfo = page.locator('[data-testid="gpu-fallback-info"]')
    
    // 至少应该显示一个
    const hasWarningOrFallback = 
      (await warningMessage.count() > 0) || 
      (await fallbackInfo.count() > 0)
    
    expect(hasWarningOrFallback).toBe(true)
  })

  test('应该能够在WebGPU和WebGL后端之间切换', async () => {
    await page.waitForLoadState('networkidle')

    // 打开WebGPU设置
    const settingsButton = page.locator('[aria-label*="设置"], button:has-text("设置"), [data-testid="settings-button"]')
    await settingsButton.click()
    
    const webgpuSettings = page.locator('[data-testid="webgpu-settings"]')
    await webgpuSettings.click()

    // 查找后端选择器
    const backendSelector = page.locator('[data-testid="backend-selector"]')
    await backendSelector.selectOption('webgpu')

    // 验证WebGPU选中
    let selectedValue = await backendSelector.inputValue()
    expect(selectedValue).toBe('webgpu')

    // 切换到WebGL
    await backendSelector.selectOption('webgl')
    selectedValue = await backendSelector.inputValue()
    expect(selectedValue).toBe('webgl')

    // 切换到CPU
    await backendSelector.selectOption('cpu')
    selectedValue = await backendSelector.inputValue()
    expect(selectedValue).toBe('cpu')
  })

  test('应该能够批量加载模型', async () => {
    await page.waitForLoadState('networkidle')

    // 打开WebGPU设置
    const settingsButton = page.locator('[aria-label*="设置"], button:has-text("设置"), [data-testid="settings-button"]')
    await settingsButton.click()
    
    const webgpuSettings = page.locator('[data-testid="webgpu-settings"]')
    await webgpuSettings.click()

    // 查找批量加载按钮
    const batchLoadButton = page.locator('[data-testid="batch-load-models"]')
    if (await batchLoadButton.count() > 0) {
      await batchLoadButton.click()
      
      // 验证加载状态
      const loadingIndicator = page.locator('[data-testid="loading-indicator"]')
      await expect(loadingIndicator).toBeVisible({ timeout: 5000 })
      
      // 等待加载完成
      await expect(loadingIndicator).not.toBeVisible({ timeout: 30000 })
    }
  })
})
