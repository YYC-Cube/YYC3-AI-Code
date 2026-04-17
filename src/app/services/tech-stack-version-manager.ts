/**
 * @file tech-stack-version-manager.ts
 * @description 技术栈版本管理服务 — 版本检查、一致性验证、更新通知
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @updated 2026-03-13
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags version, management, tech-stack
 */

import { TECH_STACK, type TechStackItem } from '../types/architecture'

/* ================================================================
   Types
   ================================================================ */

export type VersionStatus = 'consistent' | 'updatable' | 'deprecated' | 'unknown'

export interface VersionCheckResult {
  name: string
  currentVersion: string
  latestVersion: string
  status: VersionStatus
  category: TechStackItem['category']
  updateStrategy: TechStackItem['updateStrategy']
  lastChecked: number
}

export interface VersionReport {
  timestamp: number
  totalItems: number
  consistent: number
  updatable: number
  deprecated: number
  items: VersionCheckResult[]
  healthScore: number // 0-100
  recommendations: string[]
}

export interface UpdateNotification {
  id: string
  name: string
  fromVersion: string
  toVersion: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: number
  acknowledged: boolean
}

/* ================================================================
   Storage
   ================================================================ */

const STORAGE_KEY = 'yyc3_version_check_cache'
const NOTIFICATIONS_KEY = 'yyc3_version_notifications'

function loadCache(): VersionCheckResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCache(results: VersionCheckResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
  } catch { /* quota */ }
}

function loadNotifications(): UpdateNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveNotifications(notifications: UpdateNotification[]) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  } catch { /* quota */ }
}

/* ================================================================
   Version Manager Service
   ================================================================ */

export class TechStackVersionManager {
  private static cachedResults: VersionCheckResult[] = loadCache()
  private static notifications: UpdateNotification[] = loadNotifications()

  /**
   * 执行全量版本检查
   * 对比 TECH_STACK 中每项的 version 与 latestVersion
   */
  static checkAllVersions(): VersionCheckResult[] {
    const now = Date.now()
    const results: VersionCheckResult[] = TECH_STACK.map(item => {
      const status = this.determineStatus(item)
      return {
        name: item.name,
        currentVersion: item.version,
        latestVersion: item.latestVersion || item.version,
        status,
        category: item.category,
        updateStrategy: item.updateStrategy,
        lastChecked: now,
      }
    })

    this.cachedResults = results
    saveCache(results)

    // Generate notifications for updatable items
    results
      .filter(r => r.status === 'updatable')
      .forEach(r => this.addNotification(r))

    return results
  }

  /**
   * 获取缓存的检查结果（若有）
   */
  static getCachedResults(): VersionCheckResult[] {
    return this.cachedResults.length > 0 ? this.cachedResults : this.checkAllVersions()
  }

  /**
   * 生成版本健康报告
   */
  static generateReport(): VersionReport {
    const items = this.getCachedResults()
    const consistent = items.filter(i => i.status === 'consistent').length
    const updatable = items.filter(i => i.status === 'updatable').length
    const deprecated = items.filter(i => i.status === 'deprecated').length

    const healthScore = Math.round((consistent / items.length) * 100)
    const recommendations: string[] = []

    if (updatable > 0) {
      recommendations.push(`${updatable} 个技术组件有可用更新，建议审核后升级`)
    }
    if (deprecated > 0) {
      recommendations.push(`${deprecated} 个技术组件已过时，需要尽快替换`)
    }
    if (healthScore === 100) {
      recommendations.push('所有技术栈版本一致，无需操作')
    }

    const lockedCount = items.filter(i => i.updateStrategy === 'locked').length
    if (lockedCount > 0) {
      recommendations.push(`${lockedCount} 个组件版本已锁定（数据库/编辑器等核心依赖）`)
    }

    return {
      timestamp: Date.now(),
      totalItems: items.length,
      consistent,
      updatable,
      deprecated,
      items,
      healthScore,
      recommendations,
    }
  }

  /**
   * 验证某个技术项是否与配置一致
   */
  static validateItem(name: string): VersionCheckResult | null {
    const item = TECH_STACK.find(t => t.name === name)
    if (!item) {return null}

    return {
      name: item.name,
      currentVersion: item.version,
      latestVersion: item.latestVersion || item.version,
      status: this.determineStatus(item),
      category: item.category,
      updateStrategy: item.updateStrategy,
      lastChecked: Date.now(),
    }
  }

  /**
   * 按分类获取技术栈项
   */
  static getByCategory(category: TechStackItem['category']): VersionCheckResult[] {
    return this.getCachedResults().filter(r => r.category === category)
  }

  /**
   * 获取通知列表
   */
  static getNotifications(): UpdateNotification[] {
    return this.notifications
  }

  /**
   * 确认通知
   */
  static acknowledgeNotification(id: string): void {
    const notif = this.notifications.find(n => n.id === id)
    if (notif) {
      notif.acknowledged = true
      saveNotifications(this.notifications)
    }
  }

  /**
   * 清除已确认的通知
   */
  static clearAcknowledged(): void {
    this.notifications = this.notifications.filter(n => !n.acknowledged)
    saveNotifications(this.notifications)
  }

  /**
   * 获取更新策略摘要
   */
  static getStrategyBreakdown(): Record<string, number> {
    const results = this.getCachedResults()
    return {
      auto: results.filter(r => r.updateStrategy === 'auto').length,
      manual: results.filter(r => r.updateStrategy === 'manual').length,
      locked: results.filter(r => r.updateStrategy === 'locked').length,
    }
  }

  /* ================================================================
     Private Helpers
     ================================================================ */

  private static determineStatus(item: TechStackItem): VersionStatus {
    if (item.status === 'deprecated') {return 'deprecated'}
    if (item.status === 'updatable') {return 'updatable'}
    if (!item.latestVersion) {return 'unknown'}

    // Normalize for comparison
    const current = item.version.replace(/\.x$/, '').replace(/^v/, '')
    const latest = item.latestVersion.replace(/\.x$/, '').replace(/^v/, '')

    if (current === latest || current === 'Latest') {return 'consistent'}
    if (current !== latest) {return 'updatable'}
    return 'consistent'
  }

  private static addNotification(result: VersionCheckResult): void {
    // Don't duplicate
    const exists = this.notifications.find(
      n => n.name === result.name && n.toVersion === result.latestVersion && !n.acknowledged
    )
    if (exists) {return}

    const notif: UpdateNotification = {
      id: `notif-${Date.now()}-${result.name}`,
      name: result.name,
      fromVersion: result.currentVersion,
      toVersion: result.latestVersion,
      severity: result.status === 'deprecated' ? 'critical' : 'info',
      message: `${result.name} 可从 ${result.currentVersion} 更新至 ${result.latestVersion}`,
      timestamp: Date.now(),
      acknowledged: false,
    }

    this.notifications.push(notif)
    saveNotifications(this.notifications)
  }
}
