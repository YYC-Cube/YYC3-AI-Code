/**
 * @file BrandHeader.tsx
 * @description 品牌头部组件 — Logo 显示、品牌标语、主题切换、快捷键按钮、用户菜单、通知面板
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-24
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags header, brand, theme, navigation
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Settings2, Keyboard, Bell, User, Settings, LogOut, ExternalLink, Wrench, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useThemeStore } from '../../stores/theme-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import { toast } from 'sonner'
import logoImage from '/yyc3-logo.png'
import { createLogger } from '../../utils/logger'

const log = createLogger('BrandHeader')

/* ================================================================
   Types
   ================================================================ */

export interface BrandHeaderProps {
  /** 品牌配置 */
  branding: {
    logoUrl: string
    logoSize: number
    logoRadius: number
    logoOpacity: number
    sloganPrimary: string
    sloganSecondary: string
    appName: string
    titleTemplate: string
    backgroundType: 'color' | 'gradient' | 'image'
    backgroundColor: string
    backgroundGradient: string
    backgroundImage: string
    backgroundBlur: number
    backgroundOpacity: number
  }
  /** 玻璃效果配置 */
  glass: {
    enabled: boolean
    blur: number
    opacity: number
    borderOpacity: number
    saturation: number
    tint: string
  }
  /** 是否为暗色模式 */
  isDarkMode: boolean
  /** 主题切换回调 */
  onThemeToggle: () => void
  /** 快捷键点击回调 */
  onShortcutsClick: () => void
  /** 用户菜单点击回调 */
  onUserMenuClick?: () => void
  /** 通知点击回调 */
  onNotificationsClick: () => void
  /** 返回按钮回调 */
  onBack?: () => void
  /** 显示返回按钮 */
  showBackButton?: boolean
  /** 额外操作按钮 */
  extraActions?: Array<{
    icon: React.ElementType
    labelKey: string
    onClick: () => void
  }>
}

/* ================================================================
   Sub-Components
   ================================================================ */

/** 用户下拉菜单 */
function UserMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()
  const { openCustomizer } = useThemeStore()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const items = [
    { icon: User, label: t('user.profile', 'branding' as any), action: () => { toast(t('user.profile', 'branding' as any)) } },
    { icon: Settings, label: t('user.settings', 'branding' as any), action: () => { toast(t('user.settings', 'branding' as any)) } },
    { icon: Wrench, label: t('user.tools', 'branding' as any), action: () => { toast(t('user.tools', 'branding' as any)) } },
    { icon: Sparkles, label: t('user.features', 'branding' as any), action: () => { toast(t('user.features', 'branding' as any)) } },
    { icon: ExternalLink, label: t('user.documentation', 'branding' as any), action: () => { window.open('https://docs.yyc3.ai', '_blank') } },
    { icon: LogOut, label: t('user.logout', 'branding' as any), action: () => { toast(t('user.logout', 'branding' as any)) }, danger: true },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.12 }}
          className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden z-50"
          style={{ background: 'rgba(18,18,30,0.95)', backdropFilter: 'blur(16px)' }}
          role="menu"
          aria-label={t('user.menu', 'branding' as any)}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.action()
                onClose()
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-[12px] transition-colors hover:bg-white/[0.04] ${
                (item as any).danger ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06]' : 'text-white/60 hover:text-white/90'
              }`}
              role="menuitem"
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** 通知面板 */
function NotificationsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const notifications = [
    { id: 1, title: t('notification.newFeature', 'branding' as any), desc: t('notification.newFeatureDesc', 'branding' as any), time: '5分钟前' },
    { id: 2, title: t('notification.update', 'branding' as any), desc: t('notification.updateDesc', 'branding' as any), time: '1小时前' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.95, x: 10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: 10 }}
          transition={{ duration: 0.12 }}
          className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden z-50"
          style={{ background: 'rgba(18,18,30,0.95)', backdropFilter: 'blur(16px)' }}
          role="dialog"
          aria-label={t('notification.panel', 'branding' as any)}
        >
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
            <span className="text-[12px] text-white/70">{t('notification.title', 'branding' as any)}</span>
            <span className="text-[10px] text-white/30">{notifications.length}</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[11px] text-white/30">
                {t('notification.empty', 'branding' as any)}
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="px-4 py-3 border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-white/70 mb-1">{notif.title}</div>
                      <div className="text-[10px] text-white/30 line-clamp-2">{notif.desc}</div>
                      <div className="text-[9px] text-white/20 mt-1">{notif.time}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-white/[0.04] text-center">
            <button onClick={onClose} className="text-[10px] text-violet-400/70 hover:text-violet-400 transition-colors">
              {t('notification.markRead', 'branding' as any)}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ================================================================
   Main Component
   ================================================================ */

export function BrandHeader({
  branding,
  glass,
  isDarkMode,
  onThemeToggle,
  onShortcutsClick,
  onUserMenuClick,
  onNotificationsClick,
  onBack,
  showBackButton = false,
  extraActions,
}: BrandHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { logoGlow } = useLiquidGlass()
  const { t } = useI18n()

  const handleThemeToggle = useCallback(() => {
    log.info('Theme toggle triggered')
    onThemeToggle()
  }, [onThemeToggle])

  const handleShortcutsClick = useCallback(() => {
    log.info('Shortcuts panel opened')
    onShortcutsClick()
  }, [onShortcutsClick])

  const handleUserMenuClick = useCallback(() => {
    setShowUserMenu(!showUserMenu)
    setShowNotifications(false)
    if (onUserMenuClick) {
      onUserMenuClick()
    }
  }, [showUserMenu, onUserMenuClick])

  const handleNotificationsClick = useCallback(() => {
    setShowNotifications(!showNotifications)
    setShowUserMenu(false)
    onNotificationsClick()
  }, [showNotifications, onNotificationsClick])

  return (
    <header
      className="relative z-10 border-b border-white/[0.04] backdrop-blur-md"
      style={{
        background: glass.enabled
          ? `rgba(18, 18, 30, ${glass.opacity / 100})`
          : branding.backgroundType === 'gradient'
            ? branding.backgroundGradient
            : branding.backgroundColor,
      }}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-colors"
                aria-label={t('common.back', 'branding' as any)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="relative"
                style={{
                  width: `${branding.logoSize}px`,
                  height: `${branding.logoSize}px`,
                  borderRadius: `${branding.logoRadius}px`,
                  opacity: branding.logoOpacity / 100,
                }}
              >
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt={branding.appName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-lg flex items-center justify-center"
                    style={{
                      background: branding.backgroundGradient,
                      boxShadow: logoGlow,
                    }}
                  >
                    <span className="text-white font-bold text-lg">YYC³</span>
                  </div>
                )}
              </div>

              <div className="hidden sm:block">
                <h1 className="text-[13px] text-white/90 font-semibold">{branding.appName}</h1>
                <p className="text-[10px] text-white/40 mt-0.5">{branding.sloganPrimary}</p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Extra Actions */}
            {extraActions?.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="p-2 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-colors"
                aria-label={t(action.labelKey, 'branding' as any)}
              >
                <action.icon className="w-4 h-4" />
              </button>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-colors"
              aria-label={isDarkMode ? t('theme.light', 'branding' as any) : t('theme.dark', 'branding' as any)}
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Shortcuts */}
            <button
              onClick={handleShortcutsClick}
              className="hidden md:block px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-colors text-[11px] flex items-center gap-2"
              aria-label={t('shortcuts.title', 'branding' as any)}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('shortcuts.title', 'branding' as any)}</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={handleNotificationsClick}
                className="p-2 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-colors"
                aria-label={t('notification.title', 'branding' as any)}
              >
                <Bell className="w-4 h-4" />
              </button>
              <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={handleUserMenuClick}
                className="p-2 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-colors"
                aria-label={t('user.menu', 'branding' as any)}
              >
                <User className="w-4 h-4" />
              </button>
              <UserMenu isOpen={showUserMenu} onClose={() => setShowUserMenu(false)} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ================================================================
   Default Props
   ================================================================ */

BrandHeader.defaultProps = {
  showBackButton: false,
}

/* ================================================================
   Exports
   ================================================================ */

export default BrandHeader
