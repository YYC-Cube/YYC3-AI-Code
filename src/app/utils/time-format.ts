/**
 * @file time-format.ts
 * @description 共享时间格式化工具 — 相对时间 / 日期格式化，支持 i18n
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags time, format, i18n, utility
 */

import { t } from '../services/i18n-service'

/**
 * Format a timestamp as relative time string (e.g. "3 minutes ago")
 * Uses i18n for localized output
 */
export function formatTimeAgo(timestamp: number | undefined): string {
  if (!timestamp) {return '-'}
  const diff = Date.now() - timestamp
  if (diff < 60000) {return t('time.justNow', 'common')}
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return t('time.minutesAgo', 'common').replace('{{count}}', String(mins))
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return t('time.hoursAgo', 'common').replace('{{count}}', String(hours))
  }
  const days = Math.floor(diff / 86400000)
  return t('time.daysAgo', 'common').replace('{{count}}', String(days))
}

/**
 * Format a timestamp or ISO date string to a locale date string
 */
export function formatDate(ts: number | string | undefined): string {
  if (!ts) {return '-'}
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts)
  return d.toLocaleDateString()
}

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0) {return '0 B'}
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
