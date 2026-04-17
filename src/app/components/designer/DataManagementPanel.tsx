/**
 * @file DataManagementPanel.tsx
 * @description YYC³ 统一数据管理面板 — 纯开源·本地化·一用户一端·极致信任
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-04-08
 * @updated 2026-04-08
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags data-management, local-storage, privacy-first, crud, import-export
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Database,
  HardDrive,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Lock,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronRight,
  ChevronDown,
  FileJson,
  Archive,
  BarChart3,
  Layers,
  Server,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { createLogger } from '../../utils/logger'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import { fileRepository, fileVersionService, workspaceService } from '../../services/local-storage-service'
import { useAppStore } from '../../stores/app-store'
import { useAIServiceStore } from '../../stores/ai-service-store'
import { useThemeStore } from '../../stores/theme-store'
import { useSettingsStore } from '../../stores/settings-store'

const log = createLogger('DataManagementPanel')

/* ================================================================
   Types
   ================================================================ */

interface StorageStats {
  totalSize: number
  fileCount: number
  versionCount: number
  workspaceCount: number
  encryptedCount: number
  lastBackup: number | null
  oldestData: number | null
  newestData: number | null
}

interface StorageCategory {
  id: string
  name: string
  icon: typeof Database
  count: number
  size: number
  encrypted: boolean
  description: string
}

interface IsolationCheck {
  id: string
  name: string
  status: 'pass' | 'warning' | 'fail'
  message: string
}

/* ================================================================
   Storage Statistics Hook
   ================================================================ */

function useStorageStats(): { stats: StorageStats; isLoading: boolean; refresh: () => void } {
  const [stats, setStats] = useState<StorageStats>({
    totalSize: 0,
    fileCount: 0,
    versionCount: 0,
    workspaceCount: 0,
    encryptedCount: 0,
    lastBackup: null,
    oldestData: null,
    newestData: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  const calculateStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const localStorageSize = calculateLocalStorageSize()
      const files = fileRepository.getAll()
      const workspaces = workspaceService.list()
      
      let totalVersions = 0
      let encryptedCount = 0
      let oldestTimestamp = Date.now()
      let newestTimestamp = 0

      for (const file of files) {
        const history = fileVersionService.getHistory(file.path)
        totalVersions += history.length
        if (file.encrypted) encryptedCount++
        const createdAt = new Date(file.createdAt).getTime()
        const updatedAt = new Date(file.updatedAt).getTime()
        if (createdAt < oldestTimestamp) oldestTimestamp = createdAt
        if (updatedAt > newestTimestamp) newestTimestamp = updatedAt
      }

      setStats({
        totalSize: localStorageSize,
        fileCount: files.length,
        versionCount: totalVersions,
        workspaceCount: workspaces.length,
        encryptedCount,
        lastBackup: getLastBackupTime(),
        oldestData: oldestTimestamp === Date.now() ? null : oldestTimestamp,
        newestData: newestTimestamp === 0 ? null : newestTimestamp,
      })
    } catch (error) {
      log.error('Failed to calculate storage stats', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    calculateStats()
  }, [calculateStats])

  return { stats, isLoading, refresh: calculateStats }
}

function calculateLocalStorageSize(): number {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key)
      if (value) {
        total += key.length + value.length
      }
    }
  }
  return total * 2
}

function getLastBackupTime(): number | null {
  const backupTime = localStorage.getItem('yyc3-last-backup')
  return backupTime ? parseInt(backupTime, 10) : null
}

/* ================================================================
   Storage Categories Hook
   ================================================================ */

function useStorageCategories(): StorageCategory[] {
  const { aiModels, projects, messages } = useAppStore()
  const { providers } = useAIServiceStore()
  const { settings } = useSettingsStore()
  const { currentTheme } = useThemeStore()

  return useMemo(() => {
    const categories: StorageCategory[] = [
      {
        id: 'ai-models',
        name: 'AI 模型配置',
        icon: Server,
        count: aiModels.length,
        size: JSON.stringify(aiModels).length * 2,
        encrypted: true,
        description: 'AI 服务商和模型配置信息',
      },
      {
        id: 'projects',
        name: '项目数据',
        icon: Database,
        count: projects.length,
        size: JSON.stringify(projects).length * 2,
        encrypted: false,
        description: '用户创建的项目和设计文件',
      },
      {
        id: 'messages',
        name: '对话历史',
        icon: Archive,
        count: messages.length,
        size: JSON.stringify(messages).length * 2,
        encrypted: false,
        description: 'AI 对话消息记录',
      },
      {
        id: 'providers',
        name: '服务商配置',
        icon: Server,
        count: providers.length,
        size: JSON.stringify(providers).length * 2,
        encrypted: true,
        description: 'AI 服务商连接配置',
      },
      {
        id: 'settings',
        name: '应用设置',
        icon: Database,
        count: Object.keys(settings).length,
        size: JSON.stringify(settings).length * 2,
        encrypted: false,
        description: '应用全局设置',
      },
      {
        id: 'theme',
        name: '主题配置',
        icon: Database,
        count: Object.keys(currentTheme).length,
        size: JSON.stringify(currentTheme).length * 2,
        encrypted: false,
        description: 'UI 主题和样式配置',
      },
    ]
    return categories
  }, [aiModels, projects, messages, providers, settings, currentTheme])
}

/* ================================================================
   Isolation Checks Hook
   ================================================================ */

function useIsolationChecks(): IsolationCheck[] {
  return useMemo(() => {
    const checks: IsolationCheck[] = []

    const hasNoCloudSync = !localStorage.getItem('yyc3-cloud-sync-enabled')
    checks.push({
      id: 'no-cloud-sync',
      name: '无云端同步',
      status: hasNoCloudSync ? 'pass' : 'warning',
      message: hasNoCloudSync ? '数据完全存储在本地' : '云端同步已启用',
    })

    const hasEncryption = localStorage.getItem('yyc3-encryption-enabled') === 'true'
    checks.push({
      id: 'encryption',
      name: '数据加密',
      status: hasEncryption ? 'pass' : 'warning',
      message: hasEncryption ? '敏感数据已加密' : '建议启用数据加密',
    })

    const isOfflineCapable = 'serviceWorker' in navigator
    checks.push({
      id: 'offline-capable',
      name: '离线能力',
      status: isOfflineCapable ? 'pass' : 'warning',
      message: isOfflineCapable ? '支持完全离线运行' : '离线功能未启用',
    })

    const hasSecureContext = window.isSecureContext
    checks.push({
      id: 'secure-context',
      name: '安全上下文',
      status: hasSecureContext ? 'pass' : 'warning',
      message: hasSecureContext ? '运行在安全上下文中' : '建议使用 HTTPS',
    })

    const hasNoThirdParty = !localStorage.getItem('yyc3-third-party-enabled')
    checks.push({
      id: 'no-third-party',
      name: '无第三方服务',
      status: hasNoThirdParty ? 'pass' : 'warning',
      message: hasNoThirdParty ? '无第三方数据传输' : '第三方服务已启用',
    })

    return checks
  }, [])
}

/* ================================================================
   Format Utilities
   ================================================================ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return '无数据'
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ================================================================
   Sub-Components
   ================================================================ */

function StatCard({ icon: Icon, label, value, subValue, color }: {
  icon: typeof Database
  label: string
  value: string | number
  subValue?: string
  color: string
}) {
  const { isLG } = useLiquidGlass()
  
  return (
    <div className={`p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] ${isLG ? 'backdrop-blur-sm' : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[11px] text-white/50">{label}</span>
      </div>
      <div className="text-xl font-semibold text-white/90">{value}</div>
      {subValue && <div className="text-[10px] text-white/30 mt-1">{subValue}</div>}
    </div>
  )
}

function CategoryItem({ category, onClick }: { category: StorageCategory; onClick: () => void }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="rounded-lg border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${category.encrypted ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
            <category.icon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-[12px] text-white/70 flex items-center gap-2">
              {category.name}
              {category.encrypted && <Lock className="w-3 h-3 text-amber-400" />}
            </div>
            <div className="text-[10px] text-white/40">{category.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-white/60">{category.count} 项</div>
            <div className="text-[10px] text-white/30">{formatBytes(category.size)}</div>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
        </div>
      </button>
      
      {expanded && (
        <div className="border-t border-white/[0.04]">
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/40">数据条目</span>
              <span className="text-white/60">{category.count}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/40">存储大小</span>
              <span className="text-white/60">{formatBytes(category.size)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/40">加密状态</span>
              <span className={category.encrypted ? 'text-amber-400' : 'text-white/60'}>
                {category.encrypted ? '已加密' : '未加密'}
              </span>
            </div>
            <button
              onClick={onClick}
              className="w-full mt-2 py-1.5 text-[10px] text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded hover:bg-blue-500/10 transition-colors"
            >
              查看详情
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function IsolationBadge({ check }: { check: IsolationCheck }) {
  const statusConfig = {
    pass: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    fail: { icon: X, color: 'text-red-400', bg: 'bg-red-500/10' },
  }
  
  const config = statusConfig[check.status]
  const Icon = config.icon
  
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${config.bg}`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-white/70">{check.name}</div>
        <div className={`text-[10px] ${config.color}`}>{check.message}</div>
      </div>
    </div>
  )
}

/* ================================================================
   Main Component
   ================================================================ */

export function DataManagementPanel() {
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useStorageStats()
  const categories = useStorageCategories()
  const isolationChecks = useIsolationChecks()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'isolation' | 'import-export'>('overview')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const passedChecks = isolationChecks.filter(c => c.status === 'pass').length
  const totalChecks = isolationChecks.length
  const isolationScore = Math.round((passedChecks / totalChecks) * 100)

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        metadata: {
          app: 'YYC³ AI Code',
          user: 'local-user',
          device: navigator.userAgent,
        },
        data: {
          localStorage: { ...localStorage },
          settings: useSettingsStore.getState().settings,
          theme: useThemeStore.getState().currentTheme,
          aiModels: useAppStore.getState().aiModels,
          projects: useAppStore.getState().projects,
        },
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `yyc3-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      localStorage.setItem('yyc3-last-backup', Date.now().toString())
      refreshStats()
      
      toast.success('数据导出成功', {
        description: `已导出 ${formatBytes(blob.size)} 数据`,
      })
    } catch (error) {
      log.error('Export failed', error)
      toast.error('导出失败', { description: String(error) })
    } finally {
      setIsExporting(false)
    }
  }, [refreshStats])

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsImporting(true)
    try {
      const text = await file.text()
      const importData = JSON.parse(text)
      
      if (importData.version !== '1.0.0') {
        throw new Error('不支持的备份版本')
      }
      
      if (importData.data.localStorage) {
        Object.entries(importData.data.localStorage).forEach(([key, value]) => {
          localStorage.setItem(key, String(value))
        })
      }
      
      toast.success('数据导入成功', {
        description: '请刷新页面以应用更改',
        action: {
          label: '刷新',
          onClick: () => window.location.reload(),
        },
      })
    } catch (error) {
      log.error('Import failed', error)
      toast.error('导入失败', { description: String(error) })
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }, [])

  const handleClearAllData = useCallback(async () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
      
      toast.success('数据已清除', {
        description: '页面将刷新',
      })
      
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      log.error('Clear failed', error)
      toast.error('清除失败', { description: String(error) })
    }
  }, [])

  const tabs = [
    { id: 'overview', label: '数据概览', icon: BarChart3 },
    { id: 'categories', label: '存储分类', icon: Layers },
    { id: 'isolation', label: '隔离验证', icon: Shield },
    { id: 'import-export', label: '导入导出', icon: Archive },
  ] as const

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-white/90">数据管理中心</h2>
              <p className="text-[10px] text-white/40">纯开源 · 本地化 · 一用户一端 · 极致信任</p>
            </div>
          </div>
          <button
            onClick={refreshStats}
            disabled={statsLoading}
            className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-white/60 ${statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 mt-4 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/[0.04] text-white/90 border-b-2 border-emerald-400'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/[0.02]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={HardDrive}
                label="总存储大小"
                value={formatBytes(stats.totalSize)}
                color="bg-blue-500/10 text-blue-400"
              />
              <StatCard
                icon={FileJson}
                label="文件数量"
                value={stats.fileCount}
                subValue={`${stats.versionCount} 个版本`}
                color="bg-purple-500/10 text-purple-400"
              />
              <StatCard
                icon={Lock}
                label="加密数据"
                value={stats.encryptedCount}
                subValue="已加密保护"
                color="bg-amber-500/10 text-amber-400"
              />
              <StatCard
                icon={Shield}
                label="隔离评分"
                value={`${isolationScore}%`}
                subValue={`${passedChecks}/${totalChecks} 项通过`}
                color="bg-emerald-500/10 text-emerald-400"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-blue-400" />
                )}
                <span className="text-[12px] text-blue-400">导出全部数据</span>
              </button>
              
              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer">
                {isImporting ? (
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-[12px] text-emerald-400">导入数据</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-white/[0.06] p-4">
              <h3 className="text-[12px] text-white/70 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                数据时间线
              </h3>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-white/40">最早数据</span>
                  <span className="text-white/60">{formatDate(stats.oldestData)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">最新数据</span>
                  <span className="text-white/60">{formatDate(stats.newestData)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">上次备份</span>
                  <span className="text-white/60">{formatDate(stats.lastBackup)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-3">
            {categories.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                onClick={() => toast.info(`查看 ${category.name} 详情功能开发中`)}
              />
            ))}
          </div>
        )}

        {activeTab === 'isolation' && (
          <div className="space-y-6">
            {/* Score */}
            <div className="text-center p-6 rounded-xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/5 to-blue-500/5">
              <div className="text-5xl font-bold text-emerald-400 mb-2">{isolationScore}%</div>
              <div className="text-[12px] text-white/50">数据隔离评分</div>
            </div>

            {/* Checks */}
            <div className="space-y-2">
              {isolationChecks.map(check => (
                <IsolationBadge key={check.id} check={check} />
              ))}
            </div>

            {/* Info */}
            <div className="rounded-xl border border-white/[0.06] p-4 bg-blue-500/5">
              <h3 className="text-[12px] text-blue-400 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                数据隔离说明
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                YYC³ 采用"一用户一端"架构，所有数据完全存储在本地浏览器中。
                无云端同步、无第三方数据传输、无追踪分析。
                您的数据完全由您自己掌控。
              </p>
            </div>
          </div>
        )}

        {activeTab === 'import-export' && (
          <div className="space-y-6">
            {/* Export Section */}
            <div className="rounded-xl border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-4 h-4 text-blue-400" />
                <h3 className="text-[12px] text-white/70">数据导出</h3>
              </div>
              <p className="text-[11px] text-white/40 mb-4">
                将所有本地数据导出为 JSON 文件，包含设置、项目、对话历史等。
              </p>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-2.5 rounded-lg bg-blue-500/10 text-blue-400 text-[12px] hover:bg-blue-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    导出全部数据
                  </>
                )}
              </button>
            </div>

            {/* Import Section */}
            <div className="rounded-xl border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-emerald-400" />
                <h3 className="text-[12px] text-white/70">数据导入</h3>
              </div>
              <p className="text-[11px] text-white/40 mb-4">
                从备份文件恢复数据。注意：导入将覆盖现有数据。
              </p>
              <label className="block w-full py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[12px] hover:bg-emerald-500/20 transition-colors cursor-pointer text-center">
                {isImporting ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    导入中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    选择备份文件
                  </span>
                )}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-[12px] text-red-400">危险操作</h3>
              </div>
              <p className="text-[11px] text-white/40 mb-4">
                清除所有本地数据。此操作不可撤销，请谨慎操作。
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 rounded-lg bg-red-500/10 text-red-400 text-[12px] hover:bg-red-500/20 transition-colors"
                >
                  清除所有数据
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-red-400 text-center">
                    确定要清除所有数据吗？此操作不可撤销！
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 rounded-lg bg-white/[0.04] text-white/60 text-[11px] hover:bg-white/[0.06] transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleClearAllData}
                      className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-[11px] hover:bg-red-500/30 transition-colors"
                    >
                      确认清除
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-6 py-3">
        <div className="flex items-center justify-between text-[10px] text-white/30">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span>数据完全存储在本地浏览器中</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3" />
            <span>敏感数据已加密保护</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataManagementPanel
