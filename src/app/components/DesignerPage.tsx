/**
 * @file DesignerPage.tsx
 * @description 主 IDE 布局 — 可调三列面板、全局搜索、键盘快捷键、预览控制集成
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.1.0
 * @created 2026-03-13
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags designer, layout, keyboard-shortcuts, preview, panels
 */

import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { useAppStore } from '../stores/app-store'
import { useThemeStore } from '../stores/theme-store'
import { useLayoutStore } from '../stores/layout-store'
import { usePreviewStore } from '../stores/preview-store'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from './ui/resizable'
import { TopNavBar } from './designer/TopNavBar'
import { ViewSwitchBar } from './designer/ViewSwitchBar'
import { LeftPanel } from './designer/LeftPanel'
import { CenterPanel } from './designer/CenterPanel'
import { RightPanel } from './designer/RightPanel'
import { PreviewPanel } from './designer/PreviewPanel'

// Lazy-loaded sub-panels (loaded on demand to reduce initial bundle size)
const ModelSettings = lazy(() => import('./designer/ModelSettings').then(m => ({ default: m.ModelSettings })))
const HeartbeatManager = lazy(() => import('./designer/HeartbeatManager').then(m => ({ default: m.HeartbeatManager })))
const SyncStatusBar = lazy(() => import('./designer/SyncStatusBar').then(m => ({ default: m.SyncStatusBar })))
const FileSystemManager = lazy(() => import('./designer/FileSystemManager').then(m => ({ default: m.FileSystemManager })))
const DatabaseManager = lazy(() => import('./designer/DatabaseManager').then(m => ({ default: m.DatabaseManager })))
const SecurityPanel = lazy(() => import('./designer/SecurityPanel').then(m => ({ default: m.SecurityPanel })))
const BrandingPanel = lazy(() => import('./designer/BrandingPanel').then(m => ({ default: m.BrandingPanel })))
const CommandPalette = lazy(() => import('./designer/CommandPalette').then(m => ({ default: m.CommandPalette })))
const NotificationCenter = lazy(() => import('./designer/NotificationCenter').then(m => ({ default: m.NotificationCenter })))
const QuickActionsPanel = lazy(() => import('./designer/QuickActionsPanel').then(m => ({ default: m.QuickActionsPanel })))
const TaskBoardPanel = lazy(() => import('./designer/TaskBoardPanel').then(m => ({ default: m.TaskBoardPanel })))
const MultiInstancePanel = lazy(() => import('./designer/MultiInstancePanel').then(m => ({ default: m.MultiInstancePanel })))

import { createLogger } from '../utils/logger'
import { Search, FileCode2, FolderOpen, Database, Shield, X, Sparkles, ClipboardList, Monitor } from 'lucide-react'
import { MOCK_FILE_CONTENTS, getLanguage } from '../utils/file-contents'
import { useDebounce } from '../utils/debounce'
import { SearchWorker } from '../services/search-service'
import { ErrorBoundary } from './ErrorBoundary'
import { useLiquidGlass } from '../utils/liquid-glass'
import { useI18n } from '../utils/useI18n'
import { useSettingsStore } from '../stores/settings-store'
import { useMobileLayout } from './ui/use-responsive'

const log = createLogger('DesignerPage')

// Suspense fallback for lazy-loaded components
function LazyFallback() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  )
}

// ============================================
// Global Search Panel
// ============================================

function GlobalSearchPanel() {
  const { searchPanelOpen, setSearchPanelOpen, setSelectedFile, openFileTab } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ path: string; line: number; text: string }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (searchPanelOpen) {
      setQuery('')
      setResults([])
      setIsSearching(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [searchPanelOpen])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    let cancelled = false
    setIsSearching(true)

    SearchWorker.search(debouncedQuery, MOCK_FILE_CONTENTS, 50)
      .then((response) => {
        if (!cancelled) {
          setResults(response.results)
          setIsSearching(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([])
          setIsSearching(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  if (!searchPanelOpen) {return null}

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-16" onClick={() => setSearchPanelOpen(false)}>
      <div
        className={`w-full max-w-xl rounded-xl border overflow-hidden ${
          isLG ? 'border-emerald-500/[0.1]' : 'border-white/[0.08]'
        }`}
        style={{
          background: isLG ? 'rgba(10,15,10,0.92)' : 'rgba(14,14,24,0.96)',
          backdropFilter: isLG ? 'blur(30px) saturate(180%)' : 'blur(20px)',
          boxShadow: isLG
            ? '0 16px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,135,0.06)'
            : '0 16px 64px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center gap-2 px-4 py-3 border-b ${
          isLG ? 'border-emerald-500/[0.08]' : 'border-white/[0.06]'
        }`}>
          <Search className={`w-4 h-4 ${isLG ? 'text-emerald-400/40' : 'text-white/30'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder', 'designer')}
            className={`flex-1 bg-transparent outline-none text-sm text-white/80 placeholder:text-white/20 ${
              isLG ? 'caret-emerald-400' : ''
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {setSearchPanelOpen(false)}
            }}
          />
          <kbd className="text-[9px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">Esc</kbd>
        </div>
        {isSearching ? (
          <div className="px-4 py-6 text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/20 mx-auto mb-2" />
            <span className="text-[11px] text-white/20">{t('messages.loading', 'common')}</span>
          </div>
        ) : results.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {results.slice(0, 20).map((r, i) => (
              <button
                key={`${r.path}-${r.line}-${i}`}
                onClick={() => {
                  setSelectedFile(r.path)
                  openFileTab(r.path)
                  setSearchPanelOpen(false)
                }}
                className="w-full flex items-start gap-2 px-4 py-2 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.02]"
              >
                <FileCode2 className="w-3.5 h-3.5 text-blue-400/50 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-white/50 truncate">{r.path}<span className="text-white/20 ml-1">:{r.line}</span></div>
                  <div className="text-[11px] text-white/35 truncate font-mono">{r.text}</div>
                </div>
              </button>
            ))}
            {results.length > 20 && (
              <div className="px-4 py-2 text-[10px] text-white/20 text-center">
                {t('search.moreResults', 'designer', { count: results.length - 20 })}
              </div>
            )}
          </div>
        ) : query.trim() ? (
          <div className="px-4 py-6 text-center text-[11px] text-white/20">
            {t('search.noResults', 'designer')}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-[11px] text-white/20">
            {t('search.placeholder', 'designer')}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// DesignerPage
// ============================================

export function DesignerPage() {
  const navigate = useNavigate()
  const { currentView, setCurrentView, searchPanelOpen, setSearchPanelOpen, toggleTerminal, toggleSearchPanel, bottomPanelVisible, selectedFile } = useAppStore()
  const { currentTheme } = useThemeStore()
  const { config: layoutConfig, togglePanelCollapse } = useLayoutStore()
  const { t } = useI18n()
  const mobileLayout = useMobileLayout()

  useEffect(() => {
    log.info('DesignerPage mounted', { view: currentView, theme: currentTheme.name })
  }, [])

  useEffect(() => {
    log.debug('View mode changed', { view: currentView })
  }, [currentView])

  // Global keyboard shortcuts for designer
  useEffect(() => {
    // Read user-customized keybindings from settings store
    const keybindings = useSettingsStore.getState().getActiveKeybindings()

    /** Parse a keybinding string like "Ctrl+Shift+E" into a matcher */
    const matchKey = (binding: string, e: KeyboardEvent): boolean => {
      const parts = binding.split('+').map(p => p.trim())
      const needCtrl = parts.includes('Ctrl')
      const needShift = parts.includes('Shift')
      const needAlt = parts.includes('Alt')
      const keyPart = parts.filter(p => !['Ctrl', 'Shift', 'Alt'].includes(p))[0] || ''
      const ctrl = e.ctrlKey || e.metaKey
      if (needCtrl !== ctrl) {return false}
      if (needShift !== e.shiftKey) {return false}
      if (needAlt !== e.altKey) {return false}
      // Special key matching
      if (keyPart === '`') {return e.key === '`'}
      if (keyPart === ',') {return e.key === ','}
      if (/^[0-9]$/.test(keyPart)) {return e.key === keyPart}
      return e.key.toLowerCase() === keyPart.toLowerCase()
    }

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName

      // Settings-driven keybindings
      if (matchKey(keybindings.viewPreview || 'Ctrl+1', e)) { e.preventDefault(); setCurrentView('preview'); return }
      if (matchKey(keybindings.viewCode || 'Ctrl+2', e)) { e.preventDefault(); setCurrentView('code'); return }
      if (matchKey(keybindings.viewSplit || 'Ctrl+3', e)) { e.preventDefault(); setCurrentView('split'); return }
      if (matchKey(keybindings.toggleTerminal || 'Ctrl+`', e)) { e.preventDefault(); toggleTerminal(); return }

      if (matchKey(keybindings.toggleLeftPanel || 'Ctrl+B', e)) {
        e.preventDefault(); togglePanelCollapse('left'); return
      }
      if (matchKey(keybindings.toggleRightPanel || 'Ctrl+Shift+B', e)) {
        e.preventDefault(); togglePanelCollapse('right'); return
      }
      if (matchKey(keybindings.toggleSearch || 'Ctrl+Shift+F', e)) {
        e.preventDefault(); toggleSearchPanel(); return
      }
      if (matchKey(keybindings.refreshPreview || 'Ctrl+R', e)) {
        e.preventDefault()
        usePreviewStore.getState().clearConsole()
        usePreviewStore.getState().triggerRefresh()
        return
      }
      if (matchKey(keybindings.toggleInspector || 'Ctrl+Shift+I', e)) {
        e.preventDefault(); usePreviewStore.getState().toggleInspector(); return
      }
      if (matchKey(keybindings.toggleGridOverlay || 'Ctrl+Shift+G', e)) {
        e.preventDefault(); usePreviewStore.getState().toggleGridOverlay(); return
      }
      if (matchKey(keybindings.openSettings || 'Ctrl+,', e)) {
        e.preventDefault(); navigate('/settings'); return
      }
      if (matchKey(keybindings.toggleFileSystem || 'Ctrl+Shift+E', e)) {
        e.preventDefault()
        const app = useAppStore.getState()
        if (app.bottomPanelVisible && app.bottomPanelTab === 'filesystem') {app.toggleBottomPanel()}
        else {app.openBottomPanel('filesystem')}
        return
      }
      if (matchKey(keybindings.toggleDatabase || 'Ctrl+Shift+D', e)) {
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault()
          const app = useAppStore.getState()
          if (app.bottomPanelVisible && app.bottomPanelTab === 'database') {app.toggleBottomPanel()}
          else {app.openBottomPanel('database')}
        }
        return
      }
      if (matchKey(keybindings.toggleConsole || 'Ctrl+Shift+C', e)) {
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault()
          usePreviewStore.getState().toggleConsole()
        }
        return
      }

      // Escape → close search first, then close overlays, then navigate home
      if (e.key === 'Escape') {
        // 0. Exit preview fullscreen if active
        if (usePreviewStore.getState().isFullscreen) {
          usePreviewStore.getState().setFullscreen(false)
          return
        }
        // 1. Close search panel if open
        if (useAppStore.getState().searchPanelOpen) {
          setSearchPanelOpen(false)
          return
        }
        // 2. Close model settings if open
        if (useAppStore.getState().modelSettingsOpen) {
          useAppStore.getState().closeModelSettings()
          return
        }
        // 3. Don't navigate if any dialog is open
        if (document.querySelector('[role="dialog"]')) {
          return
        }
        // 4. Navigate home
        navigate('/')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setCurrentView, navigate, toggleTerminal, toggleSearchPanel, setSearchPanelOpen, togglePanelCollapse])

  // Use theme-aware background
  const bgStyle: React.CSSProperties = {
    background: currentTheme.type === 'dark'
      ? currentTheme.branding.backgroundColor || '#0d0d14'
      : 'var(--background, #f5f5fa)',
  }

  // Get panel visibility from layout store
  const leftPanel = layoutConfig.panels.left
  const centerPanel = layoutConfig.panels.center
  const rightPanel = layoutConfig.panels.right

  // Mobile layout: tab-based single column
  if (mobileLayout.tabMode) {
    const tabs: { id: 'ai' | 'code' | 'terminal'; label: string; icon: React.ReactNode; node: React.ReactNode }[] = [
      { id: 'ai', label: 'AI', icon: <Sparkles className="w-4 h-4" />, node: <ErrorBoundary panelName="AI Chat"><LeftPanel /></ErrorBoundary> },
      { id: 'code', label: 'Code', icon: <FileCode2 className="w-4 h-4" />, node: <ErrorBoundary panelName="Code Editor"><CenterPanel /></ErrorBoundary> },
      { id: 'terminal', label: 'Term', icon: <Monitor className="w-4 h-4" />, node: <ErrorBoundary panelName="Terminal"><RightPanel /></ErrorBoundary> },
    ]

    return (
      <div className="h-screen flex flex-col text-white overflow-hidden relative" style={bgStyle}>
        <TopNavBar />
        <ViewSwitchBar />
        <div className="flex-1 overflow-hidden">
          {tabs.find(t => t.id === mobileLayout.activeTab)?.node}
        </div>
        <div className={`flex items-center justify-around border-t ${currentTheme.type === 'dark' ? 'border-white/[0.06] bg-black/40' : 'border-gray-200 bg-white'} backdrop-blur-xl`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => mobileLayout.setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 transition-colors ${
                mobileLayout.activeTab === tab.id
                  ? currentTheme.type === 'dark' ? 'text-white/80' : 'text-gray-900'
                  : currentTheme.type === 'dark' ? 'text-white/25' : 'text-gray-400'
              }`}
            >
              {tab.icon}
              <span className="text-[9px]">{tab.label}</span>
            </button>
          ))}
        </div>
        <Suspense fallback={<LazyFallback />}>
          <SyncStatusBar />
        </Suspense>
        <Suspense fallback={null}>
          <HeartbeatManager />
        </Suspense>
        <Suspense fallback={<LazyFallback />}>
          <ModelSettings />
        </Suspense>
        <GlobalSearchPanel />
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
        <Suspense fallback={<LazyFallback />}>
          <NotificationCenter />
        </Suspense>
        <Suspense fallback={<LazyFallback />}>
          <QuickActionsPanel />
        </Suspense>
      </div>
    )
  }

  // Dynamic panel rendering based on layout config + view mode
  const renderPanels = () => {
    if (currentView === 'preview') {
      return (
        <ResizablePanelGroup direction="horizontal">
          {leftPanel.visible && (
            <>
              <ResizablePanel
                defaultSize={leftPanel.collapsed ? 5 : leftPanel.defaultSize}
                minSize={leftPanel.collapsed ? 3 : leftPanel.minSize}
                maxSize={leftPanel.collapsed ? 8 : leftPanel.maxSize}
                collapsible={true}
                collapsedSize={3}
              >
                {leftPanel.collapsed ? <CollapsedPanelPlaceholder label="AI" /> : <ErrorBoundary panelName="AI Chat"><LeftPanel /></ErrorBoundary>}
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          <ResizablePanel defaultSize={leftPanel.visible ? 75 : 100}>
            <ErrorBoundary panelName="Preview"><PreviewPanel /></ErrorBoundary>
          </ResizablePanel>
        </ResizablePanelGroup>
      )
    }

    if (currentView === 'split') {
      return (
        <ResizablePanelGroup direction="horizontal">
          {leftPanel.visible && (
            <>
              <ResizablePanel
                defaultSize={leftPanel.collapsed ? 5 : 22}
                minSize={leftPanel.collapsed ? 3 : leftPanel.minSize}
                maxSize={leftPanel.collapsed ? 8 : 30}
                collapsible={true}
                collapsedSize={3}
              >
                {leftPanel.collapsed ? <CollapsedPanelPlaceholder label="AI" /> : <ErrorBoundary panelName="AI Chat"><LeftPanel /></ErrorBoundary>}
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          {centerPanel.visible && (
            <>
              <ResizablePanel
                defaultSize={centerPanel.collapsed ? 5 : 38}
                minSize={centerPanel.collapsed ? 3 : 20}
                collapsible={true}
                collapsedSize={3}
              >
                {centerPanel.collapsed ? <CollapsedPanelPlaceholder label="Editor" /> : <ErrorBoundary panelName="Code Editor"><CenterPanel /></ErrorBoundary>}
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          <ResizablePanel
            defaultSize={40}
            minSize={20}
          >
            <ErrorBoundary panelName="Preview"><PreviewPanel /></ErrorBoundary>
          </ResizablePanel>
        </ResizablePanelGroup>
      )
    }

    // Code view (default)
    const visiblePanels: { id: string; node: React.ReactNode; size: number; min: number; max: number; collapsed: boolean }[] = []

    if (leftPanel.visible) {
      visiblePanels.push({
        id: 'left',
        node: leftPanel.collapsed ? <CollapsedPanelPlaceholder label="AI" /> : <ErrorBoundary panelName="AI Chat"><LeftPanel /></ErrorBoundary>,
        size: leftPanel.collapsed ? 5 : leftPanel.defaultSize,
        min: leftPanel.collapsed ? 3 : leftPanel.minSize,
        max: leftPanel.collapsed ? 8 : leftPanel.maxSize,
        collapsed: leftPanel.collapsed,
      })
    }
    if (centerPanel.visible) {
      visiblePanels.push({
        id: 'center',
        node: centerPanel.collapsed ? <CollapsedPanelPlaceholder label="Code" /> : <ErrorBoundary panelName="Code Editor"><CenterPanel /></ErrorBoundary>,
        size: centerPanel.collapsed ? 5 : centerPanel.defaultSize,
        min: centerPanel.collapsed ? 3 : centerPanel.minSize,
        max: centerPanel.collapsed ? 8 : centerPanel.maxSize,
        collapsed: centerPanel.collapsed,
      })
    }
    if (rightPanel.visible) {
      visiblePanels.push({
        id: 'right',
        node: rightPanel.collapsed ? <CollapsedPanelPlaceholder label="Term" /> : <ErrorBoundary panelName="Terminal"><RightPanel /></ErrorBoundary>,
        size: rightPanel.collapsed ? 5 : rightPanel.defaultSize,
        min: rightPanel.collapsed ? 3 : rightPanel.minSize,
        max: rightPanel.collapsed ? 8 : rightPanel.maxSize,
        collapsed: rightPanel.collapsed,
      })
    }

    // Normalize sizes to sum to ~100
    const totalSize = visiblePanels.reduce((s, p) => s + p.size, 0)
    const normalizedPanels = visiblePanels.map(p => ({
      ...p,
      size: Math.round((p.size / totalSize) * 100),
    }))

    if (normalizedPanels.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
          {t('panels.allHidden', 'designer')}
        </div>
      )
    }

    return (
      <ResizablePanelGroup direction="horizontal">
        {normalizedPanels.map((panel, idx) => (
          <PanelWithHandle key={panel.id} isLast={idx === normalizedPanels.length - 1}>
            <ResizablePanel
              defaultSize={panel.size}
              minSize={panel.min}
              maxSize={panel.max}
              collapsible={true}
              collapsedSize={3}
            >
              {panel.node}
            </ResizablePanel>
          </PanelWithHandle>
        ))}
      </ResizablePanelGroup>
    )
  }

  return (
    <div className="h-screen flex flex-col text-white overflow-hidden relative" style={bgStyle}>
      <TopNavBar />
      <ViewSwitchBar />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          {/* Main Panel Area */}
          <ResizablePanel defaultSize={bottomPanelVisible ? 70 : 100} minSize={30}>
            {renderPanels()}
          </ResizablePanel>

          {/* Bottom Tool Panel (FileSystem / Database) */}
          {bottomPanelVisible && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
                <BottomToolPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Sync Status Bar */}
      <Suspense fallback={<LazyFallback />}>
        <SyncStatusBar />
      </Suspense>

      {/* Invisible managers */}
      <Suspense fallback={null}>
        <HeartbeatManager />
      </Suspense>

      {/* Model Settings Modal */}
      <Suspense fallback={<LazyFallback />}>
        <ModelSettings />
      </Suspense>

      {/* Global Search Panel */}
      <GlobalSearchPanel />

      {/* Command Palette (Ctrl+K) */}
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>

      {/* Notification Center */}
      <Suspense fallback={<LazyFallback />}>
        <NotificationCenter />
      </Suspense>

      {/* Quick Actions Panel */}
      <Suspense fallback={<LazyFallback />}>
        <QuickActionsPanel />
      </Suspense>
    </div>
  )
}

// ============================================
// Helper: Panel with optional trailing handle
// ============================================

function PanelWithHandle({ children, isLast }: { children: React.ReactNode; isLast: boolean }) {
  return (
    <>
      {children}
      {!isLast && <ResizableHandle />}
    </>
  )
}

// ============================================
// Collapsed Panel Placeholder
// ============================================

function CollapsedPanelPlaceholder({ label }: { label: string }) {
  const { isLG } = useLiquidGlass()
  return (
    <div
      className="h-full flex items-center justify-center border-r border-white/[0.04]"
      style={{ background: isLG ? 'rgba(10,15,10,0.4)' : 'var(--sidebar, #0d0d14)', writingMode: 'vertical-rl' }}
    >
      <span className="text-[10px] text-white/20 tracking-widest transform rotate-180">{label}</span>
    </div>
  )
}

// ============================================
// Bottom Tool Panel
// ============================================

function BottomToolPanel() {
  const { bottomPanelTab, setBottomPanelTab, toggleBottomPanel, selectedFile } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const tabs: { key: 'filesystem' | 'database' | 'security' | 'branding' | 'taskboard' | 'multi-instance'; label: string; icon: typeof FolderOpen }[] = [
    { key: 'filesystem', label: t('bottom.filesystem', 'designer'), icon: FolderOpen },
    { key: 'database', label: t('bottom.database', 'designer'), icon: Database },
    { key: 'security', label: t('bottom.security', 'designer'), icon: Shield },
    { key: 'branding', label: t('bottom.branding', 'designer') || 'Branding', icon: Sparkles },
    { key: 'taskboard', label: t('bottom.taskboard', 'designer') || 'Tasks', icon: ClipboardList },
    { key: 'multi-instance', label: t('bottom.multiInstance', 'designer') || 'Multi-Instance', icon: Monitor },
  ]

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: isLG ? 'rgba(10,15,10,0.35)' : 'var(--sidebar, #0d0d14)' }}
    >
      {/* Tab bar */}
      <div className={`h-7 flex items-center justify-between px-1 border-b shrink-0 ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
      }`} style={{ background: isLG ? 'rgba(10,15,10,0.25)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-0.5">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setBottomPanelTab(key)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] border-b-2 transition-colors ${
                bottomPanelTab === key
                  ? isLG
                    ? 'border-emerald-400/40 text-white/60'
                    : 'border-violet-400/40 text-white/60'
                  : 'border-transparent text-white/25 hover:text-white/40'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={toggleBottomPanel}
          className="p-0.5 rounded text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-colors mr-1"
          title={t('bottom.closePanel', 'designer')}
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {bottomPanelTab === 'filesystem' ? (
          <ErrorBoundary panelName="FileSystem">
            <Suspense fallback={<LazyFallback />}>
              <FileSystemManager standalone activeFile={selectedFile} />
            </Suspense>
          </ErrorBoundary>
        ) : bottomPanelTab === 'database' ? (
          <ErrorBoundary panelName="Database">
            <Suspense fallback={<LazyFallback />}>
              <DatabaseManager />
            </Suspense>
          </ErrorBoundary>
        ) : bottomPanelTab === 'branding' ? (
          <ErrorBoundary panelName="Branding">
            <Suspense fallback={<LazyFallback />}>
              <BrandingPanel standalone />
            </Suspense>
          </ErrorBoundary>
        ) : bottomPanelTab === 'taskboard' ? (
          <ErrorBoundary panelName="TaskBoard">
            <Suspense fallback={<LazyFallback />}>
              <TaskBoardPanel standalone />
            </Suspense>
          </ErrorBoundary>
        ) : bottomPanelTab === 'multi-instance' ? (
          <ErrorBoundary panelName="MultiInstance">
            <Suspense fallback={<LazyFallback />}>
              <MultiInstancePanel />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <ErrorBoundary panelName="Security">
            <Suspense fallback={<LazyFallback />}>
              <SecurityPanel />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}