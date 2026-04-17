/**
 * @file CollabIndicator.tsx
 * @description Real-time collaboration indicator — user presence, edit activity, connection status
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { useState, useEffect } from 'react'
import {
  Users, Wifi, WifiOff, ChevronDown,
  ChevronUp, Settings2, FileCode2, X,
} from 'lucide-react'
import { useCollabStore, type CollabUser, type CollabEdit } from '../../stores/collab-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'

// ============================================
// User Avatar
// ============================================

function UserAvatar({ user, size = 24 }: { user: CollabUser; size?: number }) {
  const { t } = useI18n()
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 relative"
      style={{
        width: size,
        height: size,
        backgroundColor: user.color + '20',
        border: `1.5px solid ${user.color}40`,
      }}
      title={`${user.name}${user.isOnline ? ` (${t('collab.online', 'designer')})` : ` (${t('collab.offline', 'designer')})`}`}
    >
      <span style={{ fontSize: size * 0.4, color: user.color }} className="select-none">
        {initials}
      </span>
      {user.isOnline && (
        <div
          className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0f0f18]"
          style={{ backgroundColor: '#34d399' }}
        />
      )}
    </div>
  )
}

// ============================================
// Cursor Overlay (for code editor integration)
// ============================================

export function CollabCursors({ filePath }: { filePath: string }) {
  const { users, config, connectionStatus } = useCollabStore()

  if (connectionStatus !== 'connected' || !config.showCursors) {return null}

  const usersInFile = users.filter(u =>
    u.isOnline && u.currentFile === filePath && u.id !== 'user-self' && u.cursorLine != null
  )

  if (usersInFile.length === 0) {return null}

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {usersInFile.map(user => (
        <div key={user.id}>
          {/* Cursor line indicator */}
          {user.cursorLine && (
            <div
              className="absolute left-0 right-0 transition-all duration-300"
              style={{
                top: `${(user.cursorLine - 1) * 20}px`,
                height: '20px',
                backgroundColor: user.color + '08',
                borderLeft: `2px solid ${user.color}60`,
              }}
            >
              {/* Name tag */}
              <span
                className="absolute -top-4 left-2 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap"
                style={{
                  backgroundColor: user.color + '25',
                  color: user.color,
                  border: `1px solid ${user.color}30`,
                }}
              >
                {user.name}
              </span>
            </div>
          )}

          {/* Selection highlight */}
          {user.selection && (
            <div
              className="absolute left-0 right-0 transition-all duration-300"
              style={{
                top: `${(user.selection.startLine - 1) * 20}px`,
                height: `${(user.selection.endLine - user.selection.startLine + 1) * 20}px`,
                backgroundColor: user.color + '06',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================
// Live Edit Feed
// ============================================

function EditFeed({ edits }: { edits: CollabEdit[] }) {
  const { t } = useI18n()
  const typeLabels: Record<string, string> = {
    insert: t('collab.editInsert', 'designer'),
    delete: t('collab.editDelete', 'designer'),
    replace: t('collab.editReplace', 'designer'),
  }
  const typeColors: Record<string, string> = {
    insert: 'text-emerald-400',
    delete: 'text-red-400',
    replace: 'text-amber-400',
  }

  return (
    <div className="space-y-1 max-h-32 overflow-y-auto">
      {edits.slice(-8).reverse().map(edit => (
        <div key={edit.id} className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02] text-[9px]">
          <span className={`${typeColors[edit.type]} shrink-0`}>
            {typeLabels[edit.type]}
          </span>
          <span className="text-white/30 truncate">{edit.userName}</span>
          <span className="text-white/15 font-mono truncate flex-1">
            {edit.filePath.split('/').pop()} L{edit.lineStart}
          </span>
          <span className="text-white/10">
            {Math.floor((Date.now() - edit.timestamp) / 1000)}s
          </span>
        </div>
      ))}
      {edits.length === 0 && (
        <div className="text-[9px] text-white/15 text-center py-2">{t('collab.noRecentEdits', 'designer')}</div>
      )}
    </div>
  )
}

// ============================================
// CollabIndicator (bottom bar widget)
// ============================================

export function CollabIndicator() {
  const {
    connectionStatus, users, recentEdits, config,
    connect, disconnect, updateConfig,
  } = useCollabStore()

  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const onlineUsers = users.filter(u => u.isOnline)
  const otherOnlineUsers = onlineUsers.filter(u => u.id !== 'user-self')

  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting' || connectionStatus === 'reconnecting'

  // Pulsing indicator for recent edits
  const [hasRecentActivity, setHasRecentActivity] = useState(false)
  useEffect(() => {
    if (recentEdits.length > 0) {
      const latest = recentEdits[recentEdits.length - 1]
      if (Date.now() - latest.timestamp < 3000) {
        setHasRecentActivity(true)
        const timer = setTimeout(() => setHasRecentActivity(false), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [recentEdits])

  return (
    <div className="relative">
      {/* Expanded Panel */}
      {expanded && (
        <div
          className="absolute bottom-full left-0 mb-1 w-72 bg-[#0f0f18]/95 border border-white/[0.08] rounded-xl overflow-hidden backdrop-blur-sm"
          style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.3)' }}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Users className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400' : 'text-violet-400'}`} />
              <span className="text-[11px] text-white/60">{t('collab.title', 'designer')}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
              >
                <Settings2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Settings */}
          {showSettings && (
            <div className="px-3 py-2 border-b border-white/[0.06] space-y-2">
              <div className="text-[10px] text-white/25 uppercase tracking-wider">{t('collab.settings', 'designer')}</div>
              {[
                { key: 'showCursors' as const, labelKey: 'collab.showCursors' },
                { key: 'showEdits' as const, labelKey: 'collab.showEdits' },
                { key: 'showPresence' as const, labelKey: 'collab.showPresence' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <button
                    onClick={() => updateConfig({ [opt.key]: !config[opt.key] })}
                    className={`w-7 h-3.5 rounded-full transition-all ${config[opt.key] ? (isLG ? 'bg-emerald-500/30' : 'bg-violet-500/30') : 'bg-white/[0.06]'}`}
                  >
                    <div className={`w-3 h-3 rounded-full transition-all ${
                      config[opt.key] ? (isLG ? 'bg-emerald-400 ml-[15px]' : 'bg-violet-400 ml-[15px]') : 'bg-white/20 ml-[1px]'
                    }`} style={{ marginTop: '1px' }} />
                  </button>
                  <span className="text-[10px] text-white/40">{t(opt.labelKey, 'designer')}</span>
                </label>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/25">{t('collab.server', 'designer')}:</span>
                <span className="text-[10px] text-white/30 font-mono">{config.serverUrl}</span>
              </div>
            </div>
          )}

          {/* Online Users */}
          <div className="px-3 py-2 space-y-1.5">
            <div className="text-[10px] text-white/25 uppercase tracking-wider">
              {t('collab.onlineUsers', 'designer')} ({onlineUsers.length})
            </div>
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-all">
                <UserAvatar user={user} size={22} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-white/60">
                    {user.name}
                    {user.id === 'user-self' && <span className="text-white/20 ml-1">({t('collab.you', 'designer')})</span>}
                  </div>
                  {user.currentFile && user.isOnline && (
                    <div className="text-[9px] text-white/20 flex items-center gap-1 truncate">
                      <FileCode2 className="w-2.5 h-2.5 shrink-0" />
                      {user.currentFile.split('/').pop()}
                      {user.cursorLine && <span className="text-white/10">:L{user.cursorLine}</span>}
                    </div>
                  )}
                </div>
                {!user.isOnline && (
                  <span className="text-[8px] text-white/15">
                    {Math.floor((Date.now() - user.lastSeen) / 60000)}m {t('collab.ago', 'designer')}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Recent Edits */}
          {isConnected && config.showEdits && (
            <div className="px-3 py-2 border-t border-white/[0.06]">
              <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">{t('collab.liveEditFeed', 'designer')}</div>
              <EditFeed edits={recentEdits} />
            </div>
          )}

          {/* Connect/Disconnect */}
          <div className="px-3 py-2.5 border-t border-white/[0.06]">
            {isConnected ? (
              <button
                onClick={disconnect}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 text-[10px] hover:bg-red-500/20 transition-all"
              >
                <WifiOff className="w-3 h-3" /> {t('collab.disconnect', 'designer')}
              </button>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] hover:opacity-90 transition-all disabled:opacity-50 ${
                  isLG
                    ? 'bg-emerald-500/10 border border-emerald-500/15 text-emerald-400'
                    : 'bg-violet-500/10 border border-violet-500/15 text-violet-400'
                }`}
              >
                {isConnecting ? (
                  <><div className={`w-3 h-3 border-2 rounded-full animate-spin ${
                    isLG ? 'border-emerald-400/30 border-t-emerald-400' : 'border-violet-400/30 border-t-violet-400'
                  }`} /> {t('collab.connecting', 'designer')}</>
                ) : (
                  <><Wifi className="w-3 h-3" /> {t('collab.startCollab', 'designer')}</>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Compact Bar Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all text-[10px] ${
          isConnected
            ? isLG
              ? 'text-emerald-400/70 hover:bg-emerald-500/10'
              : 'text-violet-400/70 hover:bg-violet-500/10'
            : 'text-white/25 hover:bg-white/[0.04]'
        }`}
      >
        {isConnected ? (
          <>
            <div className="flex items-center -space-x-1.5">
              {otherOnlineUsers.slice(0, 3).map(user => (
                <UserAvatar key={user.id} user={user} size={16} />
              ))}
            </div>
            <Users className="w-3 h-3" />
            <span>{otherOnlineUsers.length} {t('collab.online', 'designer')}</span>
            {hasRecentActivity && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </>
        ) : (
          <>
            <Users className="w-3 h-3" />
            <span>{t('collab.collab', 'designer')}</span>
          </>
        )}
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
    </div>
  )
}
