/**
 * @file SecurityPanel.tsx
 * @description F-20 安全面板 + F-21 离线管理 — Keychain 管理/API Key 加密/缓存策略/离线状态
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-14
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security, keychain, offline, cache, service-worker, i18n
 */

import { useState, useEffect } from 'react'
import {
  Shield, Lock, Unlock, Key, Eye, EyeOff, Trash2,
  Wifi, WifiOff, RefreshCw, HardDrive,
  Loader2, Check, AlertCircle, FileWarning, Zap,
  Database, Download, Upload, RotateCcw, Activity,
  Clock, Server, Globe,
} from 'lucide-react'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useSecurityStore, type AuditLogEntry } from '../../stores/security-store'
import { useOfflineStore, type CacheStrategy } from '../../stores/offline-store'
import { ScrollArea } from '../ui/scroll-area'
import { useI18n } from '../../utils/useI18n'
import { formatTimeAgo } from '../../utils/time-format'

// ============================================
// Helpers
// ============================================

const sectionTitle = 'text-[10px] text-white/35 uppercase tracking-wider'
const cardBorder = (isLG: boolean) => isLG ? 'border-emerald-500/[0.08]' : 'border-white/[0.06]'

// ============================================
// Keychain Panel
// ============================================

function KeychainPanel() {
  const { securityLevel, keychainReady, isUnlocking, unlockError, initializeKeychain, lockKeychain, wipeAllSecrets } = useSecurityStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [passphrase, setPassphrase] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleUnlock = async () => {
    if (!passphrase.trim()) {return}
    await initializeKeychain(passphrase)
    setPassphrase('')
  }

  return (
    <div className={`p-3 border-b ${cardBorder(isLG)}`}>
      <div className="flex items-center gap-1.5 mb-2.5">
        <Shield className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400/50' : 'text-violet-400/50'}`} />
        <span className={sectionTitle}>{t('keychain', 'security')} Keychain</span>
        <span className={`ml-auto text-[8px] px-1.5 rounded-full ${keychainReady ? 'bg-emerald-500/[0.15] text-emerald-400/50' : securityLevel === 'locked' ? 'bg-amber-500/[0.15] text-amber-400/50' : 'bg-white/[0.06] text-white/20'}`}>
          {keychainReady ? t('keychainUnlocked', 'security') : securityLevel === 'locked' ? t('keychainLocked', 'security') : t('keychainUninitialized', 'security')}
        </span>
      </div>

      {!keychainReady ? (
        <div className="space-y-2">
          <p className="text-[9px] text-white/25">{t('keychainDesc', 'security')}</p>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <input type={showPass ? 'text' : 'password'} value={passphrase} onChange={e => setPassphrase(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()} placeholder={t('passwordPlaceholder', 'security')}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1.5 text-[10px] text-white/70 outline-none focus:border-blue-500/30 pr-7 placeholder:text-white/15" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40">
                {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            <button onClick={handleUnlock} disabled={isUnlocking || !passphrase.trim()}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[9px] shrink-0 transition-colors ${passphrase.trim() ? isLG ? 'bg-emerald-500/[0.15] text-emerald-400/70 hover:bg-emerald-500/[0.25]' : 'bg-blue-500/[0.15] text-blue-400/70 hover:bg-blue-500/[0.25]' : 'bg-white/[0.04] text-white/15 cursor-not-allowed'}`}>
              {isUnlocking ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Unlock className="w-2.5 h-2.5" />}
              {isUnlocking ? t('unlocking', 'security') : t('unlock', 'security')}
            </button>
          </div>
          {unlockError && <p className="text-[9px] text-red-400/50 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" />{unlockError}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.1]">
            <Check className="w-3 h-3 text-emerald-400/60" />
            <span className="text-[10px] text-emerald-400/50">{t('keychainUnlocked', 'security')} — {t('aesGcm', 'security')}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={lockKeychain} className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] text-amber-400/40 hover:bg-amber-500/[0.08] transition-colors">
              <Lock className="w-2.5 h-2.5" /> {t('lock', 'security')}
            </button>
            <button onClick={() => { if (confirm(t('wipeConfirm', 'security'))) {wipeAllSecrets()} }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] text-red-400/30 hover:text-red-400/50 hover:bg-red-500/[0.06] transition-colors">
              <Trash2 className="w-2.5 h-2.5" /> {t('wipeAll', 'security')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Encryption Info Panel
// ============================================

function EncryptionInfoPanel() {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const specs = [
    { label: t('algorithm', 'security'), value: 'AES-256-GCM', icon: Shield },
    { label: t('keyDerivation', 'security'), value: 'PBKDF2 (SHA-256, 310K iterations)', icon: Key },
    { label: t('ivLength', 'security'), value: '96 bits (12 bytes)', icon: Lock },
    { label: t('saltLength', 'security'), value: '128 bits (16 bytes)', icon: Database },
    { label: t('keychainSim', 'security'), value: 'Web Crypto API + localStorage', icon: Server },
    { label: t('production', 'security'), value: 'tauri-plugin-keychain', icon: Globe },
  ]
  return (
    <div className={`p-3 border-b ${cardBorder(isLG)}`}>
      <span className={sectionTitle}>{t('encryptionSpecs', 'security')}</span>
      <div className="mt-2 space-y-1">
        {specs.map(s => (
          <div key={s.label} className="flex items-center justify-between px-2 py-1 rounded hover:bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <s.icon className="w-2.5 h-2.5 text-white/15" />
              <span className="text-[9px] text-white/30">{s.label}</span>
            </div>
            <span className="text-[9px] text-white/45 font-mono">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Audit Log Panel
// ============================================

function AuditLogPanel() {
  const { auditLog, clearAuditLog } = useSecurityStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const levelIcon = (level: AuditLogEntry['level']) => {
    switch (level) {
      case 'info': return <Check className="w-2.5 h-2.5 text-emerald-400/40" />
      case 'warn': return <AlertCircle className="w-2.5 h-2.5 text-amber-400/40" />
      case 'error': return <FileWarning className="w-2.5 h-2.5 text-red-400/40" />
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${cardBorder(isLG)}`}>
        <span className={sectionTitle}>{t('auditLog', 'security')}</span>
        {auditLog.length > 0 && <button onClick={clearAuditLog} className="text-[8px] text-white/15 hover:text-white/40">{t('clearLog', 'security')}</button>}
      </div>
      <ScrollArea className="flex-1">
        {auditLog.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[80px]">
            <p className="text-[9px] text-white/15">{t('noAuditRecords', 'security')}</p>
          </div>
        ) : (
          <div className="p-1.5 space-y-0.5">
            {auditLog.slice(0, 50).map(entry => (
              <div key={entry.id} className="flex items-start gap-1.5 px-2 py-1 rounded hover:bg-white/[0.02]">
                {levelIcon(entry.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/40 font-mono">{entry.action}</span>
                    <span className="text-[7px] text-white/15">{entry.target}</span>
                  </div>
                  <p className="text-[8px] text-white/20 truncate">{entry.detail}</p>
                </div>
                <span className="text-[7px] text-white/10 shrink-0">{formatTimeAgo(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// ============================================
// Offline Status Panel
// ============================================

function OfflineStatusPanel() {
  const { connectionStatus, lastOnline, networkSpeed, swStatus, swVersion, swLastUpdate, registerServiceWorker, updateServiceWorker } = useOfflineStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const statusColor = connectionStatus === 'online' ? 'text-emerald-400/60' : connectionStatus === 'slow' ? 'text-amber-400/60' : 'text-red-400/60'
  const statusBg = connectionStatus === 'online' ? 'bg-emerald-500/[0.1]' : connectionStatus === 'slow' ? 'bg-amber-500/[0.1]' : 'bg-red-500/[0.1]'

  return (
    <div className={`p-3 border-b ${cardBorder(isLG)}`}>
      <div className="flex items-center gap-1.5 mb-2.5">
        {connectionStatus === 'online' ? <Wifi className="w-3.5 h-3.5 text-emerald-400/50" /> : <WifiOff className="w-3.5 h-3.5 text-red-400/50" />}
        <span className={sectionTitle}>{t('offline', 'security')}</span>
        <span className={`ml-auto text-[8px] px-1.5 rounded-full ${statusBg} ${statusColor}`}>
          {connectionStatus === 'online' ? t('online', 'security') : connectionStatus === 'slow' ? t('slow', 'security') : t('status.offline', 'common')}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-white/25">{t('networkSpeed', 'security')}</span>
          <span className="text-white/40">{networkSpeed ? `${networkSpeed} Mbps` : t('unknown', 'security')}</span>
        </div>
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-white/25">{t('lastOnline', 'security')}</span>
          <span className="text-white/40">{formatTimeAgo(lastOnline)}</span>
        </div>

        {/* Service Worker */}
        <div className={`mt-2 p-2 rounded-lg border ${cardBorder(isLG)}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-white/20" />
              <span className="text-[9px] text-white/35">{t('serviceWorker', 'security')}</span>
            </div>
            <span className={`text-[8px] px-1 rounded ${swStatus === 'activated' ? 'bg-emerald-500/[0.1] text-emerald-400/40' : swStatus === 'error' ? 'bg-red-500/[0.1] text-red-400/40' : 'bg-white/[0.04] text-white/20'}`}>
              {swStatus}
            </span>
          </div>
          {swVersion && <div className="text-[8px] text-white/20 mb-1">v{swVersion} · {swLastUpdate ? formatTimeAgo(swLastUpdate) : '—'}</div>}
          <div className="flex gap-1">
            {swStatus !== 'activated' ? (
              <button onClick={registerServiceWorker}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] ${isLG ? 'text-emerald-400/40 hover:bg-emerald-500/[0.08]' : 'text-blue-400/40 hover:bg-blue-500/[0.08]'} transition-colors`}>
                <Download className="w-2.5 h-2.5" /> {t('register', 'security')}
              </button>
            ) : (
              <button onClick={updateServiceWorker}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] ${isLG ? 'text-emerald-400/40 hover:bg-emerald-500/[0.08]' : 'text-blue-400/40 hover:bg-blue-500/[0.08]'} transition-colors`}>
                <RefreshCw className="w-2.5 h-2.5" /> {t('update', 'security')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Cache Strategy Panel
// ============================================

function CacheStrategyPanel() {
  const { cacheStrategies, cacheStats, updateCacheStrategy, clearCache, clearAllCaches, refreshCacheStats, resetCacheStrategies } = useOfflineStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [clearing, setClearing] = useState<string | null>(null)

  const handleClear = async (name: string) => { setClearing(name); await clearCache(name); setClearing(null) }
  const handleClearAll = async () => { setClearing('all'); await clearAllCaches(); setClearing(null) }

  const strategyColor = (s: CacheStrategy['strategy']) => {
    switch (s) {
      case 'cache-first': return 'text-emerald-400/50'
      case 'network-first': return 'text-blue-400/50'
      case 'stale-while-revalidate': return 'text-amber-400/50'
      case 'cache-only': return 'text-cyan-400/50'
      case 'network-only': return 'text-violet-400/50'
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${cardBorder(isLG)}`}>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3 h-3 text-white/25" />
          <span className={sectionTitle}>{t('cacheStrategy', 'security')}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={refreshCacheStats} className="p-0.5 rounded text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-colors"><RefreshCw className="w-2.5 h-2.5" /></button>
          <button onClick={resetCacheStrategies} className="p-0.5 rounded text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-colors" title={t('resetDefault', 'security')}><RotateCcw className="w-2.5 h-2.5" /></button>
          <button onClick={handleClearAll} disabled={clearing === 'all'}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] text-red-400/30 hover:text-red-400/50 hover:bg-red-500/[0.06] transition-colors">
            {clearing === 'all' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Trash2 className="w-2.5 h-2.5" />} {t('clearCache', 'security')}
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-1">
          {/* Strategies */}
          {cacheStrategies.map(strategy => {
            const stats = cacheStats.find(c => c.name.startsWith(strategy.name.toLowerCase().replace(/ /g, '-')))
            return (
              <div key={strategy.name} className={`rounded-lg p-2 border ${cardBorder(isLG)} hover:bg-white/[0.01] transition-colors`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/45">{strategy.name}</span>
                    <span className={`text-[7px] font-mono ${strategyColor(strategy.strategy)}`}>{strategy.strategy}</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={strategy.enabled} onChange={e => updateCacheStrategy(strategy.name, { enabled: e.target.checked })} className="w-2.5 h-2.5 rounded" />
                    <span className="text-[8px] text-white/20">{strategy.enabled ? t('labels.enabled', 'common') : t('labels.disabled', 'common')}</span>
                  </label>
                </div>
                <div className="flex items-center justify-between text-[8px] text-white/20">
                  <span className="font-mono truncate max-w-[60%]">{strategy.pattern}</span>
                  {stats && (
                    <div className="flex items-center gap-2">
                      <span>{stats.entryCount} {t('entries', 'security')}</span>
                      <span>{stats.estimatedSize}</span>
                      <button onClick={() => handleClear(stats.name)} disabled={clearing === stats.name}
                        className="text-white/15 hover:text-red-400/50 transition-colors">
                        {clearing === stats.name ? <Loader2 className="w-2 h-2 animate-spin" /> : <Trash2 className="w-2 h-2" />}
                      </button>
                    </div>
                  )}
                </div>
                {strategy.maxAge > 0 && <div className="text-[7px] text-white/10 mt-0.5">TTL: {strategy.maxAge > 86400 ? `${Math.floor(strategy.maxAge / 86400)}d` : strategy.maxAge > 3600 ? `${Math.floor(strategy.maxAge / 3600)}h` : `${strategy.maxAge}s`} · Max: {strategy.maxEntries}</div>}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================
// Sync Queue Panel
// ============================================

function SyncQueuePanel() {
  const { syncQueue, processSyncQueue, clearSyncQueue, retryFailedItems, connectionStatus } = useOfflineStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const pending = syncQueue.filter(i => i.status === 'pending').length
  const failed = syncQueue.filter(i => i.status === 'failed').length

  return (
    <div className={`p-3 border-b ${cardBorder(isLG)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Upload className="w-3 h-3 text-white/20" />
          <span className={sectionTitle}>{t('syncQueue', 'security')}</span>
          {pending > 0 && <span className="text-[8px] px-1 rounded-full bg-amber-500/[0.1] text-amber-400/40">{pending} {t('pending', 'security')}</span>}
        </div>
        <div className="flex gap-1">
          {failed > 0 && <button onClick={retryFailedItems} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] text-amber-400/40 hover:bg-amber-500/[0.08] transition-colors"><RefreshCw className="w-2 h-2" /> {t('retryFailed', 'security')}</button>}
          {syncQueue.length > 0 && <button onClick={clearSyncQueue} className="text-[8px] text-white/15 hover:text-white/40">{t('clearQueue', 'security')}</button>}
        </div>
      </div>
      {syncQueue.length === 0 ? (
        <p className="text-[9px] text-white/15 text-center py-2">{t('syncQueueEmpty', 'security')}</p>
      ) : (
        <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
          {syncQueue.map(item => (
            <div key={item.id} className="flex items-center justify-between px-2 py-1 rounded bg-white/[0.02]">
              <div className="flex items-center gap-1.5">
                {item.status === 'syncing' ? <Loader2 className="w-2.5 h-2.5 text-blue-400/50 animate-spin" /> : item.status === 'completed' ? <Check className="w-2.5 h-2.5 text-emerald-400/50" /> : item.status === 'failed' ? <AlertCircle className="w-2.5 h-2.5 text-red-400/50" /> : <Clock className="w-2.5 h-2.5 text-white/20" />}
                <span className="text-[9px] text-white/35">{item.type}</span>
              </div>
              <span className="text-[7px] text-white/15">{item.retries > 0 ? `${item.retries}/${item.maxRetries}` : formatTimeAgo(item.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// SecurityPanel (main export)
// ============================================

export type SecurityTab = 'keychain' | 'offline' | 'cache' | 'audit'

export function SecurityPanel() {
  const { isLG } = useLiquidGlass()
  const { startMonitoring, stopMonitoring } = useOfflineStore()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<SecurityTab>('keychain')

  useEffect(() => {
    startMonitoring()
    return () => stopMonitoring()
  }, [])

  const tabs: { key: SecurityTab; label: string; icon: typeof Shield }[] = [
    { key: 'keychain', label: t('keychain', 'security'), icon: Shield },
    { key: 'offline', label: t('offline', 'security'), icon: Wifi },
    { key: 'cache', label: t('cacheStrategy', 'security'), icon: HardDrive },
    { key: 'audit', label: t('audit', 'security'), icon: Activity },
  ]

  return (
    <div className="h-full flex flex-col" style={{ background: isLG ? 'rgba(10,15,10,0.35)' : 'var(--sidebar, #0d0d14)' }}>
      {/* Tab bar */}
      <div className={`flex items-center border-b shrink-0 ${cardBorder(isLG)}`}
        style={{ background: isLG ? 'rgba(10,15,10,0.25)' : 'rgba(0,0,0,0.1)' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] border-b-2 transition-colors ${
              activeTab === key
                ? isLG ? 'border-emerald-400/40 text-white/60' : 'border-violet-400/40 text-white/60'
                : 'border-transparent text-white/25 hover:text-white/40'
            }`}>
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {activeTab === 'keychain' && (
            <>
              <KeychainPanel />
              <EncryptionInfoPanel />
            </>
          )}
          {activeTab === 'offline' && (
            <>
              <OfflineStatusPanel />
              <SyncQueuePanel />
            </>
          )}
          {activeTab === 'cache' && <CacheStrategyPanel />}
          {activeTab === 'audit' && <AuditLogPanel />}
        </ScrollArea>
      </div>
    </div>
  )
}