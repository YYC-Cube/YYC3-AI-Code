/**
 * @file CommandPalette.tsx
 * @description 命令面板 (Ctrl+K) — 模糊搜索操作、文件、视图、设置、预览控制
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-13
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags command-palette, keyboard, search, preview, i18n, layout-undo, perf
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import {
  Home, Code2, Eye, Columns2, Terminal, Search,
  Settings, Sun, Moon, Bot, FolderOpen, FileCode2,
  Rocket, Bell, Palette, Layout, MessageSquare,
  Monitor, Keyboard, Trash2, Plus, GitBranch,
  Zap, Globe, RotateCcw, Maximize2,
  Crosshair, Grid3X3, RefreshCw, Play, Clock,
  Smartphone, Tablet, Link2, Columns, Download,
  Activity, Undo2, Redo2, Save, BarChart3,
  FilePlus, FolderPlus, History,
  Database, Server, HardDriveDownload, FileSpreadsheet, FileJson,
  Settings2,
} from 'lucide-react'
import { useAppStore } from '../../stores/app-store'
import { useThemeStore } from '../../stores/theme-store'
import { useLayoutStore, LAYOUT_PRESETS } from '../../stores/layout-store'
import { useNotificationStore } from '../../stores/notification-store'
import { usePreviewStore, type PreviewMode } from '../../stores/preview-store'
import { useFileTreeStore, type FileNode } from '../../stores/file-tree-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import type { LayoutPreset } from '../../stores/app-store'

// ============================================
// Types
// ============================================

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  shortcut?: string
  category: string
  action: () => void
}

// ============================================
// Component
// ============================================

export function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const {
    setCurrentView, toggleTerminal, toggleSearchPanel, openModelSettings,
    toggleTheme, isDark, selectedFile, setSelectedFile, openFileTab,
  } = useAppStore()
  const { openCustomizer } = useThemeStore()
  const { applyPreset, resetLayout, undoLayout, redoLayout, saveCurrentLayout } = useLayoutStore()
  const { togglePanel: toggleNotifications } = useNotificationStore()
  const { fileTree } = useFileTreeStore()
  const {
    mode: previewMode, setMode: setPreviewMode,
    triggerRefresh: refreshPreview,
    toggleInspector, toggleGridOverlay, toggleConsole, toggleScrollSync,
    setActiveDevice, toggleParallelMode,
  } = usePreviewStore()

  // Flatten file tree for file search
  const flattenFiles = useCallback((nodes: FileNode[]): { name: string; path: string }[] => {
    const result: { name: string; path: string }[] = []
    function walk(items: FileNode[]) {
      for (const item of items) {
        if (item.type === 'file') {
          result.push({ name: item.name, path: item.path })
        }
        if (item.children) {walk(item.children)}
      }
    }
    walk(nodes)
    return result
  }, [])

  const allFiles = flattenFiles(fileTree)

  // Build command list
  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-home', label: t('cmd.goHome', 'designer'), description: t('cmd.goHomeDesc', 'designer'), icon: Home, category: t('cmd.category.navigation', 'designer'), action: () => navigate('/') },
    { id: 'nav-designer', label: t('cmd.goDesigner', 'designer'), description: t('cmd.goDesignerDesc', 'designer'), icon: Code2, category: t('cmd.category.navigation', 'designer'), action: () => navigate('/designer') },
    { id: 'nav-settings', label: t('cmd.openSettings', 'designer'), description: t('cmd.openSettingsDesc', 'designer'), icon: Settings2, shortcut: 'Ctrl+,', category: t('cmd.category.navigation', 'designer'), action: () => navigate('/settings') },

    // View modes
    { id: 'view-preview', label: t('cmd.switchPreview', 'designer'), description: t('cmd.switchPreviewDesc', 'designer'), icon: Eye, shortcut: 'Ctrl+1', category: t('cmd.category.view', 'designer'), action: () => setCurrentView('preview') },
    { id: 'view-code', label: t('cmd.switchCode', 'designer'), description: t('cmd.switchCodeDesc', 'designer'), icon: Code2, shortcut: 'Ctrl+2', category: t('cmd.category.view', 'designer'), action: () => setCurrentView('code') },
    { id: 'view-split', label: t('cmd.switchSplit', 'designer'), description: t('cmd.switchSplitDesc', 'designer'), icon: Columns2, shortcut: 'Ctrl+3', category: t('cmd.category.view', 'designer'), action: () => setCurrentView('split') },

    // Tools
    { id: 'tool-terminal', label: t('cmd.toggleTerminal', 'designer'), description: t('cmd.toggleTerminalDesc', 'designer'), icon: Terminal, shortcut: 'Ctrl+`', category: t('cmd.category.tools', 'designer'), action: () => toggleTerminal() },
    { id: 'tool-search', label: t('cmd.globalSearch', 'designer'), description: t('cmd.globalSearchDesc', 'designer'), icon: Search, shortcut: 'Ctrl+Shift+F', category: t('cmd.category.tools', 'designer'), action: () => toggleSearchPanel() },
    { id: 'tool-model', label: t('cmd.aiModelSettings', 'designer'), description: t('cmd.aiModelSettingsDesc', 'designer'), icon: Bot, category: t('cmd.category.tools', 'designer'), action: () => openModelSettings() },
    { id: 'tool-notifications', label: t('cmd.notificationCenter', 'designer'), description: t('cmd.notificationCenterDesc', 'designer'), icon: Bell, category: t('cmd.category.tools', 'designer'), action: () => toggleNotifications() },

    // AI Service
    { id: 'ai-benchmark', label: t('aiService.benchmark', 'designer'), description: 'View AI model performance comparison', icon: BarChart3, category: 'AI', action: () => openModelSettings() },

    // File System
    { id: 'fs-new-file', label: t('cmd.fsNewFile', 'designer'), description: t('cmd.fsNewFileDesc', 'designer'), icon: FilePlus, category: t('cmd.category.files', 'designer'), action: () => {} },
    { id: 'fs-new-folder', label: t('cmd.fsNewFolder', 'designer'), description: t('cmd.fsNewFolderDesc', 'designer'), icon: FolderPlus, category: t('cmd.category.files', 'designer'), action: () => {} },
    { id: 'fs-recent-files', label: t('cmd.fsRecentFiles', 'designer'), description: t('cmd.fsRecentFilesDesc', 'designer'), icon: Clock, category: t('cmd.category.files', 'designer'), action: () => {} },
    { id: 'fs-version-history', label: t('cmd.fsVersionHistory', 'designer'), description: t('cmd.fsVersionHistoryDesc', 'designer'), icon: History, category: t('cmd.category.files', 'designer'), action: () => {} },

    // Database
    { id: 'db-open-manager', label: t('cmd.dbOpenManager', 'designer'), description: t('cmd.dbOpenManagerDesc', 'designer'), icon: Database, shortcut: 'Ctrl+Shift+D', category: t('cmd.category.database', 'designer'), action: () => useAppStore.getState().openBottomPanel('database') },
    { id: 'db-discover-engines', label: t('cmd.dbDiscoverEngines', 'designer'), description: t('cmd.dbDiscoverEnginesDesc', 'designer'), icon: Server, category: t('cmd.category.database', 'designer'), action: () => { useAppStore.getState().openBottomPanel('database') } },
    { id: 'fs-open-manager', label: t('cmd.fsOpenManager', 'designer'), description: t('cmd.fsOpenManagerDesc', 'designer'), icon: FolderOpen, shortcut: 'Ctrl+Shift+E', category: t('cmd.category.files', 'designer'), action: () => useAppStore.getState().openBottomPanel('filesystem') },

    // Layout presets
    ...Object.entries(LAYOUT_PRESETS).map(([key, preset]) => ({
      id: `layout-${key}`,
      label: `${t('cmd.category.layout', 'designer')}: ${t(preset.label, 'designer')}`,
      description: t(preset.description, 'designer'),
      icon: Layout,
      category: t('cmd.category.layout', 'designer'),
      action: () => applyPreset(key as LayoutPreset),
    })),
    { id: 'layout-reset', label: t('cmd.resetLayout', 'designer'), description: t('cmd.resetLayoutDesc', 'designer'), icon: RotateCcw, category: t('cmd.category.layout', 'designer'), action: () => resetLayout() },
    { id: 'layout-undo', label: t('cmd.undoLayout', 'designer'), description: t('cmd.undoLayoutDesc', 'designer'), icon: Undo2, category: t('cmd.category.layout', 'designer'), action: () => undoLayout() },
    { id: 'layout-redo', label: t('cmd.redoLayout', 'designer'), description: t('cmd.redoLayoutDesc', 'designer'), icon: Redo2, category: t('cmd.category.layout', 'designer'), action: () => redoLayout() },
    { id: 'layout-save', label: t('cmd.saveLayout', 'designer'), description: t('cmd.saveLayoutDesc', 'designer'), icon: Save, category: t('cmd.category.layout', 'designer'), action: () => saveCurrentLayout(`Layout ${new Date().toLocaleTimeString()}`) },

    // Theme
    { id: 'theme-toggle', label: isDark ? t('cmd.switchToLight', 'designer') : t('cmd.switchToDark', 'designer'), icon: isDark ? Sun : Moon, category: t('cmd.category.theme', 'designer'), action: () => toggleTheme() },
    { id: 'theme-customizer', label: t('cmd.themeCustomizer', 'designer'), description: t('cmd.themeCustomizerDesc', 'designer'), icon: Palette, category: t('cmd.category.theme', 'designer'), action: () => openCustomizer() },

    // Preview controls
    { id: 'preview-refresh', label: t('cmd.previewRefresh', 'designer'), description: t('cmd.previewRefreshDesc', 'designer'), icon: RefreshCw, shortcut: 'Ctrl+R', category: t('cmd.category.preview', 'designer'), action: () => refreshPreview() },
    { id: 'preview-inspector', label: t('cmd.previewInspector', 'designer'), description: t('cmd.previewInspectorDesc', 'designer'), icon: Crosshair, shortcut: 'Ctrl+Shift+I', category: t('cmd.category.preview', 'designer'), action: () => toggleInspector() },
    { id: 'preview-grid', label: t('cmd.previewGrid', 'designer'), description: t('cmd.previewGridDesc', 'designer'), icon: Grid3X3, shortcut: 'Ctrl+Shift+G', category: t('cmd.category.preview', 'designer'), action: () => toggleGridOverlay() },
    { id: 'preview-console', label: t('cmd.previewConsole', 'designer'), description: t('cmd.previewConsoleDesc', 'designer'), icon: Terminal, shortcut: 'Ctrl+Shift+C', category: t('cmd.category.preview', 'designer'), action: () => toggleConsole() },
    { id: 'preview-scroll-sync', label: t('cmd.previewScrollSync', 'designer'), description: t('cmd.previewScrollSyncDesc', 'designer'), icon: Link2, shortcut: '', category: t('cmd.category.preview', 'designer'), action: () => toggleScrollSync() },
    { id: 'preview-parallel-mode', label: t('cmd.previewParallelMode', 'designer'), description: t('cmd.previewParallelModeDesc', 'designer'), icon: Maximize2, shortcut: 'Ctrl+Shift+P', category: t('cmd.category.preview', 'designer'), action: () => toggleParallelMode() },
    // Preview mode switching
    ...(['realtime', 'manual', 'delayed', 'smart'] as PreviewMode[]).map(m => ({
      id: `preview-mode-${m}`,
      label: `${t('cmd.previewMode', 'designer')}: ${t(`preview.mode.${m}`, 'designer')}`,
      description: t(`cmd.previewMode.${m}Desc`, 'designer'),
      icon: m === 'realtime' ? Zap : m === 'manual' ? Play : m === 'delayed' ? Clock : Crosshair,
      category: t('cmd.category.preview', 'designer'),
      action: () => setPreviewMode(m),
    })),
    // Preview device switching
    { id: 'preview-device-desktop', label: `${t('cmd.previewDevice', 'designer')}: ${t('preview.device.desktop', 'designer')}`, icon: Monitor, category: t('cmd.category.preview', 'designer'), action: () => setActiveDevice({ id: 'desktop-1440', name: 'Desktop', width: 1440, height: 900, category: 'desktop' }) },
    { id: 'preview-device-tablet', label: `${t('cmd.previewDevice', 'designer')}: ${t('preview.device.tablet', 'designer')}`, icon: Tablet, category: t('cmd.category.preview', 'designer'), action: () => setActiveDevice({ id: 'ipad-pro', name: 'iPad Pro 12.9"', width: 1024, height: 1366, category: 'tablet' }) },
    { id: 'preview-device-mobile', label: `${t('cmd.previewDevice', 'designer')}: ${t('preview.device.mobile', 'designer')}`, icon: Smartphone, category: t('cmd.category.preview', 'designer'), action: () => setActiveDevice({ id: 'iphone-15-pro', name: 'iPhone 15 Pro', width: 393, height: 852, category: 'mobile' }) },

    // Files (show top 30 files in palette)
    ...allFiles.slice(0, 30).map(f => ({
      id: `file-${f.path}`,
      label: f.name,
      description: f.path,
      icon: FileCode2,
      category: t('cmd.category.files', 'designer'),
      action: () => { setSelectedFile(f.path); openFileTab(f.path) },
    })),
  ]

  // Filter commands by query
  const filteredCommands = query.trim()
    ? commands.filter(cmd => {
        const lq = query.toLowerCase()
        return cmd.label.toLowerCase().includes(lq)
          || (cmd.description?.toLowerCase().includes(lq))
          || cmd.category.toLowerCase().includes(lq)
      })
    : commands

  // Group by category
  const grouped = filteredCommands.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) {acc[cmd.category] = []}
    acc[cmd.category].push(cmd)
    return acc
  }, {})

  // Flatten for keyboard navigation
  const flatList = Object.values(grouped).flat()

  // Global Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Listen for custom event from TopNavBar quickAction button
  useEffect(() => {
    const handler = () => {
      setOpen(true)
      setQuery('')
      setSelectedIndex(0)
    }
    window.addEventListener('yyc3:open-command-palette', handler)
    return () => window.removeEventListener('yyc3:open-command-palette', handler)
  }, [])

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, flatList.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatList[selectedIndex]) {
        flatList[selectedIndex].action()
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) {return null}

  let runningIndex = -1

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className={`relative w-full max-w-[560px] rounded-2xl border overflow-hidden ${
          isLG ? 'border-emerald-500/[0.12]' : 'border-white/[0.1]'
        }`}
        style={{
          background: isLG ? 'rgba(8,12,8,0.96)' : 'rgba(12,12,22,0.97)',
          backdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: isLG
            ? '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.04)'
            : '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${
          isLG ? 'border-emerald-500/[0.08]' : 'border-white/[0.06]'
        }`}>
          <Search className={`w-4 h-4 shrink-0 ${isLG ? 'text-emerald-400/40' : 'text-white/30'}`} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('cmd.searchPlaceholder', 'designer')}
            className={`flex-1 bg-transparent outline-none text-sm text-white/80 placeholder:text-white/25 ${
              isLG ? 'caret-emerald-400' : ''
            }`}
          />
          <kbd className="text-[9px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono border border-white/[0.06]">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-1">
          {flatList.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12px] text-white/20">
              {t('cmd.noResults', 'designer', { query })}
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className={`px-4 py-1.5 text-[9px] tracking-wider uppercase ${
                  isLG ? 'text-emerald-400/30' : 'text-white/20'
                }`}>
                  {category}
                </div>
                {items.map((cmd) => {
                  runningIndex++
                  const isSelected = runningIndex === selectedIndex
                  const currentIdx = runningIndex
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => { cmd.action(); setOpen(false) }}
                      onMouseEnter={() => setSelectedIndex(currentIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isSelected
                          ? isLG
                            ? 'bg-emerald-500/[0.08] text-emerald-300/80'
                            : 'bg-white/[0.06] text-white/80'
                          : 'text-white/50 hover:bg-white/[0.03]'
                      }`}
                    >
                      <cmd.icon className={`w-4 h-4 shrink-0 ${
                        isSelected
                          ? isLG ? 'text-emerald-400/70' : 'text-white/60'
                          : 'text-white/25'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-[10px] text-white/20 truncate">{cmd.description}</div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="text-[9px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono shrink-0">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-4 px-4 py-2 border-t text-[9px] text-white/15 ${
          isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
        }`}>
          <span className="flex items-center gap-1">
            <kbd className="bg-white/[0.04] px-1 py-0.5 rounded font-mono">Enter</kbd> {t('cmd.toSelect', 'designer')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white/[0.04] px-1 py-0.5 rounded font-mono">&uarr;&darr;</kbd> {t('cmd.toNavigate', 'designer')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white/[0.04] px-1 py-0.5 rounded font-mono">Ctrl+K</kbd> {t('cmd.toToggle', 'designer')}
          </span>
        </div>
      </div>
    </div>
  )
}