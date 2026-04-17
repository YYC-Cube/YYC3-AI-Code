/**
 * @file ViewSwitchBar.tsx
 * @description 视图切换栏 — 预览/代码/分屏切换、预览状态指示灯、AI 模型指示器、搜索、更多菜单
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.1.0
 * @created 2026-03-13
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags view-switch, toolbar, preview-status, panel-toggle, i18n
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAppStore } from '../../stores/app-store'
import { useLayoutStore } from '../../stores/layout-store'
import { useHeartbeatStore } from '../../stores/heartbeat-store'
import { usePreviewStore } from '../../stores/preview-store'
import { useQuickActionsStore } from '../../stores/quick-actions-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import {
  ChevronLeft,
  Eye,
  Code2,
  Columns2,
  Search,
  MoreHorizontal,
  Bot,
  Settings2,
  Wifi,
  WifiOff,
  Loader2,
  Activity,
  Terminal,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Monitor,
  Maximize2,
  Minimize2,
  X,
  Zap,
  Play,
  Clock,
  Crosshair,
  FolderOpen,
  Database,
  Shield,
  Sparkles,
  ClipboardList,
} from 'lucide-react'
import type { PanelId } from '../../stores/app-store'

export function ViewSwitchBar() {
  const navigate = useNavigate()
  const {
    currentView, setCurrentView,
    aiModels, activeModelId, openModelSettings,
    modelTestResults,
    terminalVisible, toggleTerminal,
    searchPanelOpen, toggleSearchPanel,
    bottomPanelVisible, bottomPanelTab, openBottomPanel, toggleBottomPanel,
  } = useAppStore()
  const { heartbeats, isRunning } = useHeartbeatStore()
  const { config: layoutConfig, togglePanelVisibility, togglePanelCollapse } = useLayoutStore()
  const { mode: previewMode, previewError, consoleEntries } = usePreviewStore()
  const { panelOpen: quickActionsPanelOpen, togglePanel: toggleQuickActions } = useQuickActionsStore()
  const { t, locale } = useI18n()

  const activeModel = aiModels.find(m => m.id === activeModelId)
  const activeTestResult = activeModelId ? modelTestResults[activeModelId] : undefined
  const activeHeartbeat = activeModelId ? heartbeats[activeModelId] : undefined
  const { isLG, navSurfaceStyle, activeViewClass, aiIconColor } = useLiquidGlass()

  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showPanelMenu, setShowPanelMenu] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const panelMenuRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
      if (panelMenuRef.current && !panelMenuRef.current.contains(e.target as Node)) {
        setShowPanelMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const views = [
    { id: 'preview' as const, icon: Eye, label: t('view.preview', 'designer'), shortcut: 'Ctrl+1' },
    { id: 'code' as const, icon: Code2, label: t('view.code', 'designer'), shortcut: 'Ctrl+2' },
    { id: 'split' as const, icon: Columns2, label: t('view.split', 'designer'), shortcut: 'Ctrl+3' },
  ]

  // Panel toggle items
  const panelItems: { id: PanelId; label: string; icon: React.ElementType }[] = [
    { id: 'left', label: t('views.panelAIChat', 'designer'), icon: MessageSquare },
    { id: 'center', label: t('views.panelCodeEditor', 'designer'), icon: Code2 },
    { id: 'right', label: t('views.panelPreviewTerminal', 'designer'), icon: Monitor },
  ]

  // Connectivity indicator color — now uses heartbeat first, then test result
  const getConnIndicator = () => {
    if (!activeModel) {return null}

    // Prefer heartbeat status when running
    if (isRunning && activeHeartbeat) {
      if (activeHeartbeat.status === 'checking') {
        return <Loader2 className="w-3 h-3 text-amber-400/60 animate-spin" />
      }
      if (activeHeartbeat.status === 'online') {
        return (
          <span className="flex items-center gap-0.5">
            <Wifi className="w-3 h-3 text-emerald-400" />
            {activeHeartbeat.latency !== null && (
              <span className="text-[9px] text-emerald-400/60">{activeHeartbeat.latency}ms</span>
            )}
          </span>
        )
      }
      if (activeHeartbeat.status === 'offline') {
        return <WifiOff className="w-3 h-3 text-red-400" />
      }
    }

    // Fallback to test result
    if (activeTestResult?.status === 'testing') {
      return <Loader2 className="w-3 h-3 text-white/30 animate-spin" />
    }
    if (activeTestResult?.status === 'success') {
      return <Wifi className="w-3 h-3 text-emerald-400" />
    }
    if (activeTestResult?.status === 'error') {
      return <WifiOff className="w-3 h-3 text-red-400" />
    }
    return <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
  }

  // Online model count from heartbeat
  const onlineCount = Object.values(heartbeats).filter(h => h.status === 'online').length
  const totalModels = aiModels.filter(m => m.endpoint).length

  // More menu items
  const moreMenuItems = [
    { label: t('views.toggleTerminal', 'designer'), shortcut: 'Ctrl+`', icon: Terminal, action: toggleTerminal, active: terminalVisible },
    { label: t('views.globalSearch', 'designer'), shortcut: 'Ctrl+Shift+F', icon: Search, action: toggleSearchPanel, active: searchPanelOpen },
    { label: t('views.panelManager', 'designer'), shortcut: '', icon: PanelLeftClose, action: () => { setShowMoreMenu(false); setShowPanelMenu(true) } },
  ]

  return (
    <div className="h-9 border-b border-white/[0.06] flex items-center px-3 shrink-0" style={isLG ? { ...navSurfaceStyle, background: 'rgba(10,15,10,0.45)' } : { background: 'color-mix(in oklch, var(--sidebar, #0d0d14), transparent 20%)' }} role="toolbar" aria-label={t('views.bar', 'designer')}>
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors mr-2"
        aria-label={t('navigation.home', 'common')}
        title={`${t('navigation.home', 'common')} (Esc)`}
      >
        <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
        {t('views.back', 'designer')}
      </button>

      <div className="w-px h-4 bg-white/[0.06] mx-1" aria-hidden="true" />

      {/* View Toggles */}
      <div className="flex items-center gap-0.5 ml-2" role="radiogroup" aria-label={t('views.viewMode', 'designer')}>
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setCurrentView(v.id)}
            title={`${v.label} (${v.shortcut})`}
            aria-label={v.label}
            aria-pressed={currentView === v.id}
            role="radio"
            aria-checked={currentView === v.id}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors relative group ${
              currentView === v.id
                ? activeViewClass
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
            }`}
          >
            <v.icon className="w-3.5 h-3.5" aria-hidden="true" />
            {v.label}
            {/* Keyboard shortcut badge on hover */}
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded text-[8px] text-white/40 bg-black/80 border border-white/[0.06] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-mono">
              {v.shortcut}
            </span>
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-white/[0.06] mx-2" aria-hidden="true" />

      {/* Panel Toggle Buttons — quick toggles for each panel */}
      <div className="flex items-center gap-0.5" ref={panelMenuRef}>
        {panelItems.map((p) => {
          const panel = layoutConfig.panels[p.id]
          if (!panel) {return null}
          const isVisible = panel.visible && !panel.collapsed
          return (
            <button
              key={p.id}
              onClick={() => {
                if (panel.visible && panel.collapsed) {
                  togglePanelCollapse(p.id)
                } else {
                  togglePanelVisibility(p.id)
                }
              }}
              title={`${p.label} (${isVisible ? t('views.visible', 'designer') : t('views.hidden', 'designer')})`}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                isVisible
                  ? 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                  : 'text-white/15 hover:text-white/40 hover:bg-white/[0.04]'
              }`}
            >
              <p.icon className="w-3 h-3" />
            </button>
          )
        })}

        {/* Terminal toggle */}
        <button
          onClick={toggleTerminal}
          title={`${t('right.terminal', 'designer')} ${terminalVisible ? `(${t('views.visible', 'designer')})` : `(${t('views.hidden', 'designer')})`} — Ctrl+\``}
          className={`p-1.5 rounded-md text-xs transition-colors ${
            terminalVisible
              ? 'text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/[0.06]'
              : 'text-white/15 hover:text-white/40 hover:bg-white/[0.04]'
          }`}
        >
          <Terminal className="w-3 h-3" />
        </button>

        <div className="w-px h-3 bg-white/[0.04] mx-0.5" aria-hidden="true" />

        {/* FileSystem toggle */}
        <button
          onClick={() => openBottomPanel('filesystem')}
          title="文件系统管理器"
          className={`p-1.5 rounded-md text-xs transition-colors ${
            bottomPanelVisible && bottomPanelTab === 'filesystem'
              ? isLG ? 'text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/[0.06]' : 'text-violet-400/60 hover:text-violet-400 hover:bg-violet-500/[0.06]'
              : 'text-white/15 hover:text-white/40 hover:bg-white/[0.04]'
          }`}
        >
          <FolderOpen className="w-3 h-3" />
        </button>

        {/* Database toggle */}
        <button
          onClick={() => openBottomPanel('database')}
          title="数据库管理器"
          className={`p-1.5 rounded-md text-xs transition-colors ${
            bottomPanelVisible && bottomPanelTab === 'database'
              ? isLG ? 'text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/[0.06]' : 'text-violet-400/60 hover:text-violet-400 hover:bg-violet-500/[0.06]'
              : 'text-white/15 hover:text-white/40 hover:bg-white/[0.04]'
          }`}
        >
          <Database className="w-3 h-3" />
        </button>

        {/* Security toggle */}
        <button
          onClick={() => openBottomPanel('security')}
          title="安全与离线"
          className={`p-1.5 rounded-md text-xs transition-colors ${
            bottomPanelVisible && bottomPanelTab === 'security'
              ? isLG ? 'text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/[0.06]' : 'text-violet-400/60 hover:text-violet-400 hover:bg-violet-500/[0.06]'
              : 'text-white/15 hover:text-white/40 hover:bg-white/[0.04]'
          }`}
        >
          <Shield className="w-3 h-3" />
        </button>

        {/* Branding toggle */}
        <button
          onClick={() => openBottomPanel('branding')}
          title="品牌配置"
          className={`p-1.5 rounded-md text-xs transition-colors ${
            bottomPanelVisible && bottomPanelTab === 'branding'
              ? isLG ? 'text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/[0.06]' : 'text-violet-400/60 hover:text-violet-400 hover:bg-violet-500/[0.06]'
              : 'text-white/15 hover:text-white/40 hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles className="w-3 h-3" />
        </button>

        {/* Task Board toggle */}
        <button
          onClick={() => openBottomPanel('taskboard')}
          title={t('bottom.taskboard', 'designer') || 'Task Board'}
          className={`p-1.5 rounded-md text-xs transition-colors ${
            bottomPanelVisible && bottomPanelTab === 'taskboard'
              ? isLG ? 'text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/[0.06]' : 'text-violet-400/60 hover:text-violet-400 hover:bg-violet-500/[0.06]'
              : 'text-white/15 hover:text-white/40 hover:bg-white/[0.04]'
          }`}
        >
          <ClipboardList className="w-3 h-3" />
        </button>
      </div>

      {/* AI Model Selector - click to open model settings */}
      <div className="relative ml-3">
        <button
          onClick={openModelSettings}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] text-xs transition-colors group"
        >
          <Bot className={`w-3.5 h-3.5 ${aiIconColor}`} />
          <span className="text-white/60">
            {activeModel ? activeModel.name : t('views.noModel', 'designer')}
          </span>
          {getConnIndicator()}
          <Settings2 className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors" />
        </button>
      </div>

      {/* Heartbeat summary */}
      {isRunning && totalModels > 0 && (
        <div className="flex items-center gap-1 ml-2 text-[10px] text-white/20">
          <Activity className="w-3 h-3" />
          <span>{onlineCount}/{totalModels}</span>
        </div>
      )}

      {/* Preview Status Indicator */}
      {(currentView === 'preview' || currentView === 'split') && (
        <div className={`flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md text-[10px] relative ${
          previewError
            ? 'bg-red-500/[0.08] text-red-400/70'
            : isLG ? 'bg-emerald-500/[0.06] text-emerald-400/60' : 'bg-white/[0.03] text-white/30'
        }`} title={t(`preview.mode.${previewMode}`, 'designer')}>
          {previewMode === 'realtime' ? <Zap className="w-2.5 h-2.5" />
            : previewMode === 'manual' ? <Play className="w-2.5 h-2.5" />
            : previewMode === 'delayed' ? <Clock className="w-2.5 h-2.5" />
            : <Crosshair className="w-2.5 h-2.5" />}
          <span>{t(`preview.mode.${previewMode}`, 'designer')}</span>
          {previewError && (
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          )}
          {!previewError && consoleEntries.some(e => e.level === 'error') && (
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Right Controls */}
      <div className="flex items-center gap-0.5">
        {/* Quick Actions */}
        <button
          onClick={toggleQuickActions}
          title={t('quickActions.title', 'designer')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
            quickActionsPanelOpen
              ? isLG ? 'text-emerald-400/80 bg-emerald-500/[0.08]' : 'text-violet-400/80 bg-violet-500/[0.08]'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleSearchPanel}
          title={`${t('actions.search', 'common')} (Ctrl+Shift+F)`}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
            searchPanelOpen
              ? 'text-violet-400/80 bg-violet-500/[0.08]'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          {t('actions.search', 'common')}
        </button>

        {/* More menu */}
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-1.5 rounded-md transition-colors ${
              showMoreMenu
                ? 'text-white/70 bg-white/[0.06]'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
            }`}
            aria-expanded={showMoreMenu}
            aria-haspopup="true"
            aria-label={t('views.moreOptions', 'designer')}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMoreMenu && (
            <div
              className="absolute top-full right-0 mt-1 min-w-[200px] py-1.5 rounded-xl border border-white/[0.08] z-50"
              style={{ background: 'rgba(18,18,30,0.95)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              role="menu"
            >
              {moreMenuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setShowMoreMenu(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
                  role="menuitem"
                >
                  <item.icon className={`w-3.5 h-3.5 ${item.active ? 'text-emerald-400' : ''}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                  {item.shortcut && (
                    <kbd className="text-[9px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              ))}

              <div className="my-1 border-t border-white/[0.06]" />

              {/* Panel visibility quick section */}
              <div className="px-3 py-1 text-[9px] text-white/20 uppercase tracking-wider">{t('views.panelDisplay', 'designer')}</div>
              {panelItems.map((p) => {
                const panel = layoutConfig.panels[p.id]
                if (!panel) {return null}
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePanelVisibility(p.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
                    role="menuitem"
                  >
                    <p.icon className={`w-3.5 h-3.5 ${panel.visible ? 'text-white/40' : 'text-white/15'}`} />
                    <span className="flex-1 text-left">{p.label}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${panel.visible ? 'bg-emerald-400' : 'bg-white/15'}`} />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}