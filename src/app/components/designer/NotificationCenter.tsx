/**
 * @file NotificationCenter.tsx
 * @description Notification center slide-over panel — view, manage, and dismiss notifications
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.1.0
 */

import { useRef, useEffect } from 'react'
import {
  X, Bell, BellOff, Check, CheckCheck, Trash2,
  Info, AlertTriangle, AlertCircle, CheckCircle2,
  Bot, Settings2, Sparkles,
} from 'lucide-react'
import { useNotificationStore, type NotificationType, type AppNotification } from '../../stores/notification-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import { ScrollArea } from '../ui/scroll-area'

// ============================================
// Helpers
// ============================================

function getNotifIcon(type: NotificationType) {
  switch (type) {
    case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-400/70" />
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400/70" />
    case 'error': return <AlertCircle className="w-4 h-4 text-red-400/70" />
    case 'ai': return <Bot className="w-4 h-4 text-violet-400/70" />
    case 'system': return <Settings2 className="w-4 h-4 text-cyan-400/70" />
    default: return <Info className="w-4 h-4 text-blue-400/70" />
  }
}

function getNotifAccent(type: NotificationType, isLG: boolean) {
  switch (type) {
    case 'success': return isLG ? 'border-l-emerald-500/30' : 'border-l-emerald-500/20'
    case 'warning': return 'border-l-amber-500/30'
    case 'error': return 'border-l-red-500/30'
    case 'ai': return isLG ? 'border-l-emerald-400/30' : 'border-l-violet-500/30'
    case 'system': return 'border-l-cyan-500/30'
    default: return 'border-l-blue-500/30'
  }
}

function useFormatTimestamp() {
  const { t } = useI18n()

  return (ts: string): string => {
    const date = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    if (mins < 1) {return t('notification.justNow', 'designer')}
    if (mins < 60) {return t('notification.minutesAgo', 'designer', { count: mins })}
    if (hours < 24) {return t('notification.hoursAgo', 'designer', { count: hours })}
    if (days < 7) {return t('notification.daysAgo', 'designer', { count: days })}
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

// ============================================
// Single Notification Item
// ============================================

function NotificationItem({ notification }: { notification: AppNotification }) {
  const { markAsRead, deleteNotification } = useNotificationStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const formatTimestamp = useFormatTimestamp()

  return (
    <div
      className={`group px-4 py-3 border-l-2 transition-colors cursor-pointer ${
        getNotifAccent(notification.type, isLG)
      } ${
        notification.read
          ? 'opacity-50 hover:opacity-70'
          : 'hover:bg-white/[0.02]'
      }`}
      onClick={() => !notification.read && markAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {getNotifIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] truncate ${
              notification.read ? 'text-white/40' : 'text-white/70'
            }`}>
              {notification.title}
            </span>
            {!notification.read && (
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isLG ? 'bg-emerald-400' : 'bg-blue-400'
              }`} />
            )}
          </div>
          <p className="text-[10px] text-white/30 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] text-white/15">
              {formatTimestamp(notification.timestamp)}
            </span>
            {notification.source && (
              <span className="text-[8px] text-white/10 bg-white/[0.03] px-1 py-0.5 rounded">
                {notification.source}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!notification.read && (
            <button
              onClick={(e) => { e.stopPropagation(); markAsRead(notification.id) }}
              className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors"
              title={t('notification.markAsRead', 'designer')}
            >
              <Check className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}
            className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400/60 transition-colors"
            title={t('notification.deleteItem', 'designer')}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function NotificationCenter() {
  const { notifications, panelOpen, setPanelOpen, markAllAsRead, clearAll, unreadCount } = useNotificationStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)

  const count = unreadCount()

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) {return}
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen, setPanelOpen])

  // Close on Escape
  useEffect(() => {
    if (!panelOpen) {return}
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {setPanelOpen(false)}
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [panelOpen, setPanelOpen])

  if (!panelOpen) {return null}

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={() => setPanelOpen(false)} />

      {/* Panel - slides in from right */}
      <div
        ref={panelRef}
        className={`absolute top-0 right-0 h-full w-[360px] max-w-[90vw] border-l flex flex-col ${
          isLG ? 'border-emerald-500/[0.08]' : 'border-white/[0.06]'
        }`}
        style={{
          background: isLG ? 'rgba(8,12,8,0.97)' : 'rgba(12,12,22,0.98)',
          backdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
          isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
        }`}>
          <div className="flex items-center gap-2">
            <Bell className={`w-4 h-4 ${isLG ? 'text-emerald-400/60' : 'text-white/40'}`} />
            <span className="text-[12px] text-white/60">{t('notification.title', 'designer')}</span>
            {count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                isLG ? 'bg-emerald-500/20 text-emerald-400/80' : 'bg-blue-500/20 text-blue-400/80'
              }`}>
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {count > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 rounded-md text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
                title={t('notification.markAllAsRead', 'designer')}
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="p-1.5 rounded-md text-white/20 hover:text-red-400/50 hover:bg-red-500/[0.04] transition-colors"
                title={t('notification.clearAll', 'designer')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1.5 rounded-md text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <BellOff className="w-8 h-8 text-white/10 mb-3" />
              <p className="text-[12px] text-white/25">{t('notification.noNotifications', 'designer')}</p>
              <p className="text-[10px] text-white/15 mt-1">{t('notification.allCaughtUp', 'designer')}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.02]">
              {notifications.map(notif => (
                <NotificationItem key={notif.id} notification={notif} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className={`px-4 py-2 border-t text-[9px] text-white/15 text-center shrink-0 ${
          isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
        }`}>
          {t('notification.totalCount', 'designer', { count: notifications.length })}
        </div>
      </div>
    </div>
  )
}
