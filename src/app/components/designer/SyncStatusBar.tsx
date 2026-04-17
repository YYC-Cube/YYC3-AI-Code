/**
 * @file SyncStatusBar.tsx
 * @description Bottom status bar — sync status, collab indicator, model health, branch info
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { useState, useEffect } from 'react'
import { useSyncStore, type SyncTarget } from '../../stores/sync-store'
import { useHeartbeatStore } from '../../stores/heartbeat-store'
import { useAppStore } from '../../stores/app-store'
import { CollabIndicator } from './CollabIndicator'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
  Activity,
  Database,
  ChevronUp,
} from 'lucide-react'

// ============================================
// Sync Status Badge
// ============================================

function SyncBadge() {
  const { syncState, syncAll, isSupabaseConnected, getTimeSinceLastSync } = useSyncStore()
  const { t } = useI18n()
  const [timeLabel, setTimeLabel] = useState(getTimeSinceLastSync())

  useEffect(() => {
    const id = setInterval(() => setTimeLabel(getTimeSinceLastSync()), 10_000)
    return () => clearInterval(id)
  }, [])

  const statusConfig = {
    idle: { icon: Cloud, color: 'text-white/20', labelKey: 'sync.idle' as const },
    syncing: { icon: Loader2, color: 'text-cyan-400', labelKey: 'sync.syncing' as const },
    synced: { icon: Check, color: 'text-emerald-400', labelKey: 'sync.synced' as const },
    error: { icon: AlertTriangle, color: 'text-red-400', labelKey: 'sync.error' as const },
    offline: { icon: CloudOff, color: 'text-white/15', labelKey: 'sync.offline' as const },
  }

  const config = statusConfig[syncState.status]
  const Icon = config.icon
  const label = t(config.labelKey, 'designer')

  return (
    <button
      onClick={() => syncAll()}
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors hover:bg-white/[0.04] ${config.color}`}
      title={`${t('sync.status', 'designer')}: ${label}${syncState.lastSynced ? ` · ${t('sync.lastSync', 'designer')}: ${timeLabel}` : ''}`}
    >
      <Icon className={`w-3 h-3 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
      <span className="text-[10px]">
        {isSupabaseConnected ? label : t('sync.local', 'designer')}
      </span>
      {syncState.pendingChanges > 0 && (
        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded-full">
          {syncState.pendingChanges}
        </span>
      )}
    </button>
  )
}

// ============================================
// Heartbeat Status
// ============================================

function HeartbeatStatus() {
  const { heartbeats, isRunning } = useHeartbeatStore()
  const { aiModels, activeModelId } = useAppStore()
  const { t } = useI18n()

  const activeModel = aiModels.find(m => m.id === activeModelId)
  const activeHb = activeModelId ? heartbeats[activeModelId] : null

  const onlineCount = Object.values(heartbeats).filter(h => h.status === 'online').length
  const totalModels = aiModels.filter(m => m.endpoint).length

  if (!isRunning) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-white/15">
        <Activity className="w-3 h-3" />
        {t('sync.heartbeatStopped', 'designer')}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Active model status */}
      {activeModel && activeHb && (
        <span className={`flex items-center gap-1 text-[10px] ${
          activeHb.status === 'online' ? 'text-emerald-400' :
          activeHb.status === 'offline' ? 'text-red-400' :
          activeHb.status === 'checking' ? 'text-amber-400' :
          'text-white/20'
        }`}>
          {activeHb.status === 'online' ? (
            <Wifi className="w-3 h-3" />
          ) : activeHb.status === 'offline' ? (
            <WifiOff className="w-3 h-3" />
          ) : activeHb.status === 'checking' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Wifi className="w-3 h-3" />
          )}
          {activeModel.name}
          {activeHb.latency !== null && (
            <span className="text-[9px] text-white/25">{activeHb.latency}ms</span>
          )}
        </span>
      )}

      {/* Overall count */}
      <span className="flex items-center gap-1 text-[10px] text-white/20">
        <Activity className="w-3 h-3" />
        {onlineCount}/{totalModels}
      </span>
    </div>
  )
}

// ============================================
// Expanded Sync Detail Panel
// ============================================

function SyncDetailPanel({ onClose }: { onClose: () => void }) {
  const { syncState, targetStatus, isSupabaseConnected, syncTarget, syncAll } = useSyncStore()
  const { heartbeats } = useHeartbeatStore()
  const { aiModels } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const targets: { key: SyncTarget; labelKey: string; icon: React.ElementType }[] = [
    { key: 'chat', labelKey: 'sync.targetChat', icon: Database },
    { key: 'project', labelKey: 'sync.targetProject', icon: Database },
    { key: 'theme', labelKey: 'sync.targetTheme', icon: Database },
    { key: 'models', labelKey: 'sync.targetModels', icon: Database },
    { key: 'layout', labelKey: 'sync.targetLayout', icon: Database },
  ]

  const statusColor = (s: string) => {
    switch (s) {
      case 'synced': return 'text-emerald-400'
      case 'syncing': return 'text-cyan-400'
      case 'error': return 'text-red-400'
      default: return 'text-white/20'
    }
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case 'synced': return t('sync.synced', 'designer')
      case 'syncing': return t('sync.syncing', 'designer')
      case 'error': return t('sync.error', 'designer')
      default: return t('sync.idle', 'designer')
    }
  }

  const hbStatusLabel = (s: string | undefined) => {
    switch (s) {
      case 'online': return null // show latency instead
      case 'offline': return t('sync.offline', 'designer')
      case 'checking': return t('sync.checking', 'designer')
      default: return t('sync.unknown', 'designer')
    }
  }

  return (
    <div className={`absolute bottom-7 left-0 right-0 border-t border-white/[0.06] z-50 ${isLG ? 'lg-sync-detail-glass' : 'bg-[#0f1019]'}`} style={isLG ? undefined : { boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}>
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Cloud className="w-3.5 h-3.5 text-cyan-400/60" />
          <span className="text-[11px] text-white/60">{t('sync.panelTitle', 'designer')}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${isSupabaseConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/25'}`}>
            {isSupabaseConnected ? t('sync.supabaseConnected', 'designer') : t('sync.localOnly', 'designer')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => syncAll()}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
            {t('sync.syncAll', 'designer')}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
          >
            <ChevronUp className="w-3 h-3 rotate-180" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-3 py-2">
        {/* Sync targets */}
        <div className="space-y-1">
          <div className="text-[9px] text-white/20 uppercase tracking-wider mb-1">{t('sync.dataSync', 'designer')}</div>
          {targets.map(({ key, labelKey }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-[10px] text-white/40">{t(labelKey, 'designer')}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] ${statusColor(targetStatus[key])}`}>
                  {statusLabel(targetStatus[key])}
                </span>
                <button
                  onClick={() => syncTarget(key)}
                  className="p-0.5 rounded text-white/15 hover:text-white/40 transition-colors"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Model heartbeats */}
        <div className="space-y-1">
          <div className="text-[9px] text-white/20 uppercase tracking-wider mb-1">{t('sync.modelHeartbeat', 'designer')}</div>
          {aiModels.filter(m => m.endpoint).slice(0, 5).map(model => {
            const hb = heartbeats[model.id]
            return (
              <div key={model.id} className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 truncate max-w-[120px]">{model.name}</span>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    hb?.status === 'online' ? 'bg-emerald-400' :
                    hb?.status === 'offline' ? 'bg-red-400' :
                    hb?.status === 'checking' ? 'bg-amber-400 animate-pulse' :
                    'bg-white/15'
                  }`} />
                  <span className={`text-[9px] ${
                    hb?.status === 'online' ? 'text-emerald-400/70' :
                    hb?.status === 'offline' ? 'text-red-400/70' :
                    'text-white/20'
                  }`}>
                    {hb?.status === 'online' ? `${hb.latency}ms` :
                     hbStatusLabel(hb?.status) || ''}
                  </span>
                </div>
              </div>
            )
          })}
          {aiModels.filter(m => m.endpoint).length === 0 && (
            <span className="text-[10px] text-white/15">{t('sync.noModels', 'designer')}</span>
          )}
        </div>
      </div>

      {syncState.errorMessage && (
        <div className="px-3 pb-2">
          <div className="text-[9px] text-red-400/60 bg-red-500/[0.05] rounded px-2 py-1 border border-red-500/10">
            {syncState.errorMessage}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Main SyncStatusBar
// ============================================

export function SyncStatusBar() {
  const [showDetail, setShowDetail] = useState(false)
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  return (
    <div className={`relative h-6 flex items-center justify-between px-3 border-t border-white/[0.06] shrink-0 ${isLG ? 'lg-sync-bar' : ''}`} style={isLG ? undefined : { background: 'color-mix(in oklch, var(--sidebar, #0d0d14), transparent 30%)' }}>
      {showDetail && <SyncDetailPanel onClose={() => setShowDetail(false)} />}

      <div className="flex items-center gap-3">
        <HeartbeatStatus />
      </div>

      <div className="flex items-center gap-2">
        <CollabIndicator />
        <div className="w-px h-3 bg-white/[0.06]" />
        <SyncBadge />
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="p-0.5 rounded text-white/15 hover:text-white/40 transition-colors"
          title={t('sync.details', 'designer')}
        >
          <ChevronUp className={`w-3 h-3 transition-transform ${showDetail ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  )
}
