/**
 * @file TopNavBar.tsx
 * @description 页眉公共图标区 — Logo + 项目标题 + 布局快捷 + 公共图标(AppIcon) + 个人信息
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 4.0.0
 * @updated 2026-03-14
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Moon, Sun, Download, Upload, HardDriveDownload, HardDriveUpload, Activity } from 'lucide-react'
import { useAppStore } from '../../stores/app-store'
import { useThemeStore } from '../../stores/theme-store'
import { useLayoutStore } from '../../stores/layout-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import { LayoutManager, LayoutQuickToggles } from './LayoutManager'
import { PluginManager } from './PluginManager'
import { PerfDashboard } from './PerfDashboard'
import { AppIcon } from '../icons'
import { toast } from 'sonner'
import { useNotificationStore } from '../../stores/notification-store'
import { exportBackup, importBackup } from '../../utils/data-export'
import { t as rawT } from '../../services/i18n-service'
import logoImage from '/yyc3-logo.png'

/* ================================================================
   Layout Import/Export
   ================================================================ */

function exportLayoutToFile() {
  const config = useLayoutStore.getState().config
  const exportData = { version: '1.0.0', exportedAt: new Date().toISOString(), layout: config }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `yyc3-layout-${config.preset}-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  toast.success(rawT('nav.layoutExportSuccess', 'designer'))
}

function importLayoutFromFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) {return}
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.version || !data.layout) {throw new Error('Invalid format')}
      const [major] = data.version.split('.').map(Number)
      if (major !== 1) {throw new Error('Incompatible version')}
      const store = useLayoutStore.getState()
      const panels = { ...store.config.panels, ...data.layout.panels }
      store.applyPreset('custom')
      Object.entries(panels).forEach(([id, cfg]) => {
        store.updatePanelConfig(id as any, cfg as any)
      })
      toast.success(rawT('nav.layoutImportSuccess', 'designer'))
    } catch (err: any) {
      toast.error(`${rawT('nav.layoutImportFailed', 'designer')}: ${err.message}`)
    }
  }
  input.click()
}

/* ================================================================
   Nav Icon Definitions — using icon-registry IDs
   ================================================================ */

interface NavSlot {
  /** ID in the icon registry */
  registryId: string
  onClick: () => void
  /** Optional accent color class */
  accent?: string
}

/* ================================================================
   Component
   ================================================================ */

export function TopNavBar() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useAppStore()
  const { openCustomizer, currentTheme } = useThemeStore()
  const [layoutManagerOpen, setLayoutManagerOpen] = useState(false)
  const [pluginManagerOpen, setPluginManagerOpen] = useState(false)
  const [perfDashboardOpen, setPerfDashboardOpen] = useState(false)
  const { togglePanel: toggleNotifications, unreadCount } = useNotificationStore()
  const { t, toggleLocale, locale, localeFlag } = useI18n()

  const logoSize = currentTheme.branding.logoSize || 32
  const logoRadius = currentTheme.branding.logoRadius || 8
  const appName = currentTheme.branding.appName || 'YYC³ Family AI'
  const { isLG, navSurfaceStyle, logoGlow } = useLiquidGlass()

  const placeholder = useCallback((label: string) => {
    toast(`${label} — ${t('messages.loading', 'common')}`)
  }, [t])

  // Build nav icon slots using registry IDs
  const navSlots: NavSlot[] = [
    { registryId: 'file', onClick: () => placeholder(t('navigation.projects', 'common')) },
    { registryId: 'notification', onClick: () => toggleNotifications() },
    { registryId: 'settings', onClick: () => placeholder(t('navigation.settings', 'common')) },
    { registryId: 'github', onClick: () => placeholder('GitHub') },
    { registryId: 'export', onClick: () => placeholder(t('actions.export', 'common')) },
    { registryId: 'deploy', onClick: () => placeholder(t('actions.deploy', 'common')), accent: isLG ? 'text-emerald-400' : 'text-violet-400' },
    { registryId: 'quickAction', onClick: () => placeholder(t('actions.search', 'common')) },
    { registryId: 'language', onClick: () => toggleLocale() },
  ]

  return (
    <>
      <header
        className="h-12 border-b border-white/[0.06] flex items-center justify-between px-3 shrink-0"
        style={navSurfaceStyle}
        role="banner"
      >
        {/* ── Left: Logo + Title + Layout controls ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center hover:opacity-90 transition-opacity overflow-hidden"
            style={{
              width: Math.min(logoSize, 32) + 4,
              height: Math.min(logoSize, 32) + 4,
              borderRadius: logoRadius,
            }}
            aria-label={t('nav.backToHome', 'designer')}
          >
            <img
              src={currentTheme.branding.logoUrl || logoImage}
              alt="YYC³ Logo"
              className={`object-contain ${logoGlow}`}
              loading="eager"
              decoding="async"
              style={{
                width: Math.min(logoSize, 32),
                height: Math.min(logoSize, 32),
                opacity: (currentTheme.branding.logoOpacity || 100) / 100,
              }}
            />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">{appName}</span>
            <span className="text-xs text-white/20">|</span>
            <span className="text-xs text-white/40">E-Commerce Dashboard</span>
          </div>

          <div className="w-px h-5 bg-white/[0.06] mx-1" />
          <LayoutQuickToggles />

          {/* Layout import / export + Data backup */}
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={exportLayoutToFile}
              className="p-1.5 rounded-md text-white/20 hover:text-cyan-400/70 hover:bg-cyan-500/[0.06] transition-colors"
              title={t('actions.export', 'common') + ' Layout'}
              aria-label={t('actions.export', 'common') + ' Layout'}
            >
              <Download className="w-3 h-3" aria-hidden="true" />
            </button>
            <button
              onClick={importLayoutFromFile}
              className="p-1.5 rounded-md text-white/20 hover:text-cyan-400/70 hover:bg-cyan-500/[0.06] transition-colors"
              title={t('actions.import', 'common') + ' Layout'}
              aria-label={t('actions.import', 'common') + ' Layout'}
            >
              <Upload className="w-3 h-3" aria-hidden="true" />
            </button>
            <div className="w-px h-3 bg-white/[0.04] mx-0.5" />
            <button
              onClick={exportBackup}
              className="p-1.5 rounded-md text-white/20 hover:text-amber-400/70 hover:bg-amber-500/[0.06] transition-colors"
              title={t('backup.export', 'designer')}
              aria-label={t('backup.export', 'designer')}
            >
              <HardDriveDownload className="w-3 h-3" aria-hidden="true" />
            </button>
            <button
              onClick={importBackup}
              className="p-1.5 rounded-md text-white/20 hover:text-amber-400/70 hover:bg-amber-500/[0.06] transition-colors"
              title={t('backup.import', 'designer')}
              aria-label={t('backup.import', 'designer')}
            >
              <HardDriveUpload className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Right: Nav icons via AppIcon + Theme + User ── */}
        <nav className="flex items-center gap-0.5" role="toolbar" aria-label={t('nav.toolbar', 'designer')}>
          {/* Layout & Plugin managers (special icons) */}
          <AppIcon
            name="settings"
            label={t('nav.layoutManager', 'designer')}
            accent="text-cyan-400/60"
            size={16}
            onClick={() => setLayoutManagerOpen(true)}
          />
          <AppIcon
            name="aiSettings"
            label={t('nav.pluginSystem', 'designer')}
            size={16}
            onClick={() => setPluginManagerOpen(true)}
          />
          <AppIcon
            name="aiConfig"
            label={t('nav.themeCustomize', 'designer')}
            accent="text-pink-400/70"
            size={16}
            onClick={openCustomizer}
          />

          {/* Performance Dashboard toggle */}
          <button
            onClick={() => setPerfDashboardOpen(true)}
            className={`p-2 rounded-lg transition-colors ${
              isLG ? 'text-white/30 hover:text-emerald-400/70 hover:bg-emerald-500/[0.06]' : 'text-white/30 hover:text-cyan-400/70 hover:bg-cyan-500/[0.06]'
            }`}
            title={t('perf.title', 'designer')}
            aria-label={t('perf.title', 'designer')}
          >
            <Activity className="w-4 h-4" aria-hidden="true" />
          </button>

          <div className="w-px h-4 bg-white/[0.06] mx-0.5" aria-hidden="true" />

          {/* Registry-driven nav icons */}
          {navSlots.map((slot) => (
            <AppIcon
              key={slot.registryId}
              name={slot.registryId}
              size={16}
              accent={slot.accent}
              onClick={slot.onClick}
              showShortcut
              badge={slot.registryId === 'notification' ? (unreadCount() || undefined) : undefined}
              themeColors={isLG ? {
                default: 'text-white/40',
                hover: 'text-emerald-400/70',
                active: 'text-emerald-400',
                disabled: 'text-white/15',
              } : undefined}
            />
          ))}

          <div className="w-px h-5 bg-white/[0.06] mx-1" aria-hidden="true" />

          {/* Theme Toggle (not in registry — one-off) */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg text-white/40 hover:bg-white/[0.06] transition-colors ${
              isLG ? 'hover:text-emerald-400/70' : 'hover:text-white/70'
            }`}
            aria-label={isDark ? t('settings.theme.light', 'settings') : t('settings.theme.dark', 'settings')}
            title={t('nav.toggleTheme', 'designer')}
          >
            {isDark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
          </button>

          {/* Locale indicator */}
          <span className="text-[9px] text-white/20 mx-0.5">{localeFlag}</span>

          {/* User Avatar with online indicator */}
          <div
            className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[10px] ml-1 cursor-pointer relative group"
            role="button"
            tabIndex={0}
            aria-label={t('nav.userMenu', 'designer')}
          >
            YY
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d0d14]" aria-label={t('status.online', 'common')} />
          </div>
        </nav>
      </header>

      <LayoutManager isOpen={layoutManagerOpen} onClose={() => setLayoutManagerOpen(false)} />
      <PluginManager open={pluginManagerOpen} onClose={() => setPluginManagerOpen(false)} />
      <PerfDashboard isOpen={perfDashboardOpen} onClose={() => setPerfDashboardOpen(false)} />
    </>
  )
}