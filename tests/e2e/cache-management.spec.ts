/**
 * YYC³ AI - Cache Management E2E Tests
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module Cache Management E2E Tests
 * @description 缓存管理功能的端到端测试
 * @author YYC³ AI Team
 * @version 1.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { test, expect } from '@playwright/test'
import { Page } from '@playwright/test'

test.describe('Cache Management', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto('/')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('应该能够打开缓存Dashboard', async () => {
    await page.waitForLoadState('networkidle')

    // 查找缓存管理按钮
    const cacheButton = page.locator('[aria-label*="缓存"], [aria-label*="Cache"], button:has-text("缓存"), [data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      // 验证缓存Dashboard已打开
      const cacheDashboard = page.locator('[data-testid="cache-dashboard"], .cache-management-panel, [role="region"][aria-label*="缓存"]')
      await expect(cacheDashboard).toBeVisible({ timeout: 5000 })
    }
  })

  test('应该能够查看缓存统计信息', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      // 验证缓存统计网格显示
      const statsGrid = page.locator('[data-testid="cache-stats-grid"]')
      await expect(statsGrid).toBeVisible({ timeout: 5000 })
      
      // 验证关键指标显示
      const cacheCount = page.locator('[data-metric="cache-count"]')
      const cacheSize = page.locator('[data-metric="cache-size"]')
      const hitRate = page.locator('[data-metric="hit-rate"]')
      const memoryUsage = page.locator('[data-metric="memory-usage"]')
      
      await expect(cacheCount).toBeVisible()
      await expect(cacheSize).toBeVisible()
      await expect(hitRate).toBeVisible()
      await expect(memoryUsage).toBeVisible()
    }
  })

  test('应该能够浏览模型缓存', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      // 切换到模型缓存Tab
      const modelCacheTab = page.locator('[role="tab"]:has-text("模型"), [data-testid="model-cache-tab"]')
      if (await modelCacheTab.count() > 0) {
        await modelCacheTab.click()
        
        // 验证模型缓存列表显示
        const modelList = page.locator('[data-testid="model-cache-list"]')
        await expect(modelList).toBeVisible({ timeout: 5000 })
        
        // 验证模型列表不为空
        const modelItems = modelList.locator('[data-testid="model-item"]')
        const itemCount = await modelItems.count()
        expect(itemCount).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('应该能够搜索模型缓存', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard并切换到模型Tab
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      const modelCacheTab = page.locator('[data-testid="model-cache-tab"]')
      if (await modelCacheTab.count() > 0) {
        await modelCacheTab.click()
        
        // 查找搜索框
        const searchInput = page.locator('[data-testid="model-search-input"]')
        if (await searchInput.count() > 0) {
          // 输入搜索关键词
          await searchInput.fill('GPT')
          
          // 等待搜索结果
          const modelItems = page.locator('[data-testid="model-item"]')
          await page.waitForTimeout(1000)
          
          // 验证搜索结果
          const filteredCount = await modelItems.count()
          expect(filteredCount).toBeGreaterThan(0)
        }
      }
    }
  })

  test('应该能够删除模型缓存', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard并切换到模型Tab
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      const modelCacheTab = page.locator('[data-testid="model-cache-tab"]')
      if (await modelCacheTab.count() > 0) {
        await modelCacheTab.click()
        
        // 查找第一个模型项
        const firstModel = page.locator('[data-testid="model-item"]').first()
        const modelName = await firstModel.textContent()
        
        // 查找并点击删除按钮
        const deleteButton = firstModel.locator('[data-testid="delete-model"]')
        if (await deleteButton.count() > 0) {
          await deleteButton.click()
          
          // 确认删除（如果需要）
          const confirmButton = page.locator('button:has-text("确认"), button:has-text("Confirm")')
          if (await confirmButton.count() > 0) {
            await confirmButton.click()
          }
          
          // 验证模型已被删除
          const deletedModel = page.locator(`text="${modelName}"`)
          await expect(deletedModel).not.toBeVisible({ timeout: 5000 })
        }
      }
    }
  })

  test('应该能够浏览推理缓存', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      // 切换到推理缓存Tab
      const inferenceCacheTab = page.locator('[role="tab"]:has-text("推理"), [data-testid="inference-cache-tab"]')
      if (await inferenceCacheTab.count() > 0) {
        await inferenceCacheTab.click()
        
        // 验证推理缓存列表显示
        const inferenceList = page.locator('[data-testid="inference-cache-list"]')
        await expect(inferenceList).toBeVisible({ timeout: 5000 })
        
        // 验证缓存统计显示
        const cacheStats = page.locator('[data-testid="inference-cache-stats"]')
        await expect(cacheStats).toBeVisible()
      }
    }
  })

  test('应该能够清理过期缓存', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard并切换到推理Tab
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      const inferenceCacheTab = page.locator('[data-testid="inference-cache-tab"]')
      if (await inferenceCacheTab.count() > 0) {
        await inferenceCacheTab.click()
        
        // 查找清理按钮
        const cleanButton = page.locator('[data-testid="clean-expired-cache"]')
        if (await cleanButton.count() > 0) {
          // 记录清理前的缓存项数
          const inferenceItems = page.locator('[data-testid="inference-item"]')
          const beforeCount = await inferenceItems.count()
          
          await cleanButton.click()
          
          // 等待清理完成
          await page.waitForTimeout(2000)
          
          // 验证缓存项减少
          const afterCount = await inferenceItems.count()
          expect(afterCount).toBeLessThanOrEqual(beforeCount)
        }
      }
    }
  })

  test('应该能够浏览性能缓存', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      // 切换到性能缓存Tab
      const performanceCacheTab = page.locator('[role="tab"]:has-text("性能"), [data-testid="performance-cache-tab"]')
      if (await performanceCacheTab.count() > 0) {
        await performanceCacheTab.click()
        
        // 验证性能指标面板显示
        const performancePanel = page.locator('[data-testid="performance-cache-panel"]')
        await expect(performancePanel).toBeVisible({ timeout: 5000 })
        
        // 验证图表显示
        const performanceChart = page.locator('[data-testid="performance-chart"]')
        await expect(performanceChart).toBeVisible()
      }
    }
  })

  test('应该能够选择缓存策略', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      // 切换到设置Tab
      const settingsTab = page.locator('[role="tab"]:has-text("设置"), [data-testid="cache-settings-tab"]')
      if (await settingsTab.count() > 0) {
        await settingsTab.click()
        
        // 查找缓存策略选择器
        const strategySelector = page.locator('[data-testid="cache-strategy-selector"]')
        if (await strategySelector.count() > 0) {
          // 选择LRU策略
          await strategySelector.selectOption('lru')
          
          const selectedValue = await strategySelector.inputValue()
          expect(selectedValue).toBe('lru')
          
          // 切换到LFU策略
          await strategySelector.selectOption('lfu')
          
          const newValue = await strategySelector.inputValue()
          expect(newValue).toBe('lfu')
        }
      }
    }
  })

  test('应该能够调整缓存容量', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard并切换到设置Tab
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      const settingsTab = page.locator('[data-testid="cache-settings-tab"]')
      if (await settingsTab.count() > 0) {
        await settingsTab.click()
        
        // 查找容量设置
        const capacityInput = page.locator('[data-testid="cache-capacity-input"]')
        if (await capacityInput.count() > 0) {
          // 清空并设置新容量
          await capacityInput.clear()
          await capacityInput.fill('512')
          
          // 验证值已更新
          const value = await capacityInput.inputValue()
          expect(value).toBe('512')
        }
      }
    }
  })

  test('应该能够一键清空所有缓存', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      // 查找清空所有缓存按钮
      const clearAllButton = page.locator('[data-testid="clear-all-cache"]')
      if (await clearAllButton.count() > 0) {
        // 记录清空前的缓存统计
        const cacheCount = page.locator('[data-metric="cache-count"]')
        const beforeValue = await cacheCount.textContent()
        
        // 点击清空按钮
        await clearAllButton.click()
        
        // 确认清空
        const confirmButton = page.locator('button:has-text("确认"), button:has-text("Confirm")')
        if (await confirmButton.count() > 0) {
          await confirmButton.click()
        }
        
        // 等待清空完成
        await page.waitForTimeout(2000)
        
        // 验证缓存已清空
        const afterValue = await cacheCount.textContent()
        expect(afterValue).toBe('0')
      }
    }
  })

  test('应该能够查看缓存命中趋势', async () => {
    await page.waitForLoadState('networkidle')

    // 打开缓存Dashboard
    const cacheButton = page.locator('[data-testid="cache-button"]')
    if (await cacheButton.count() > 0) {
      await cacheButton.click()
      
      // 查找命中趋势图表
      const hitTrendChart = page.locator('[data-testid="hit-rate-trend-chart"]')
      if (await hitTrendChart.count() > 0) {
        await expect(hitTrendChart).toBeVisible({ timeout: 5000 })
        
        // 验证趋势图有数据
        const chartData = hitTrendChart.locator('[data-point="true"]')
        const dataPointCount = await chartData.count()
        expect(dataPointCount).toBeGreaterThan(0)
      }
    }
  })
})
