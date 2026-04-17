/**
 * @file LayoutManager.tsx
 * @description Layout preset manager — panel visibility, preset selection, reset,
 * saved custom layouts CRUD, undo/redo, visual preview
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-13
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags layout, panels, presets, saved-layouts, undo
 */

import { useState } from 'react'
import { useLayoutStore, LAYOUT_PRESETS, type SavedLayout } from '../../stores/layout-store'
import type { PanelId, LayoutPreset } from '../../stores/app-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import {
  Layout,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Columns2,
  PanelLeftClose,
  PanelRightClose,
  Monitor,
  MessageSquare,
  Code2,
  Terminal,
  Save,
  FolderOpen,
  Trash2,
  Edit3,
  Check,
  Undo2,
  Redo2,
  Plus,
  Upload,
} from 'lucide-react'

const PANEL_ICONS: Record<PanelId, React.ElementType> = {
  left: MessageSquare,
  center: Code2,
  right: Terminal,
  preview: Monitor,
}

interface LayoutManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function LayoutManager({ isOpen, onClose }: LayoutManagerProps) {
  const {
    config,
    applyPreset,
    togglePanelVisibility,
    togglePanelCollapse,
    resetLayout,
    savedLayouts,
    activeLayoutId,
    saveCurrentLayout,
    loadSavedLayout,
    deleteSavedLayout,
    renameSavedLayout,
    overwriteSavedLayout,
    undoLayout,
    redoLayout,
    canUndo,
    canRedo,
  } = useLayoutStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveLayoutName, setSaveLayoutName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  if (!isOpen) {return null}

  const presets = Object.entries(LAYOUT_PRESETS) as [LayoutPreset, typeof LAYOUT_PRESETS[LayoutPreset]][]
  const panels: PanelId[] = ['left', 'center', 'right']

  const handleSave = () => {
    if (!saveLayoutName.trim()) {return}
    saveCurrentLayout(saveLayoutName.trim())
    setSaveLayoutName('')
    setShowSaveDialog(false)
  }

  const handleRename = (id: string) => {
    if (!editingName.trim()) {return}
    renameSavedLayout(id, editingName.trim())
    setEditingId(null)
    setEditingName('')
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative w-[560px] max-h-[80vh] border rounded-2xl flex flex-col overflow-hidden ${
          isLG ? 'border-emerald-500/[0.1]' : 'border-white/[0.08]'
        }`}
        style={{
          background: isLG ? 'rgba(10,15,10,0.92)' : '#13141c',
          backdropFilter: isLG ? 'blur(30px) saturate(180%)' : undefined,
          boxShadow: isLG
            ? '0 25px 60px -12px rgba(0,0,0,0.6), 0 0 80px -20px rgba(16,185,129,0.12)'
            : '0 25px 60px -12px rgba(0,0,0,0.6), 0 0 80px -20px rgba(99,102,241,0.1)',
        }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${
          isLG ? 'border-emerald-500/[0.08]' : 'border-white/[0.06]'
        }`}>
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
            isLG
              ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/20'
              : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/20'
          }`}>
            <Layout className={`w-4 h-4 ${isLG ? 'text-emerald-400' : 'text-cyan-400'}`} />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-white/90">{t('layout.manager', 'designer')}</div>
            <div className="text-[11px] text-white/30">{t('layout.subtitle', 'designer')}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={undoLayout}
              disabled={!canUndo()}
              className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all disabled:opacity-20"
              title={t('layout.undo', 'designer')}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redoLayout}
              disabled={!canRedo()}
              className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all disabled:opacity-20"
              title={t('layout.redo', 'designer')}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Layout Presets */}
          <div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">{t('layout.presets', 'designer')}</div>
            <div className="grid grid-cols-3 gap-2">
              {presets.map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`relative p-3 rounded-xl border text-left transition-all group ${
                    config.preset === key
                      ? isLG
                        ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                        : 'border-cyan-500/30 bg-cyan-500/[0.06]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                  }`}
                  style={config.preset === key ? {
                    boxShadow: isLG
                      ? '0 0 15px -3px rgba(16,185,129,0.15)'
                      : '0 0 15px -3px rgba(6,182,212,0.15)',
                  } : {}}
                >
                  <div className="text-lg mb-1">{preset.icon}</div>
                  <div className="text-[11px] text-white/70">{t(preset.label, 'designer')}</div>
                  <div className="text-[9px] text-white/25 mt-0.5 line-clamp-2">{t(preset.description, 'designer')}</div>
                  {config.preset === key && (
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      isLG ? 'bg-emerald-400' : 'bg-cyan-400'
                    }`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Saved Custom Layouts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] text-white/30 uppercase tracking-wider">{t('layout.savedLayouts', 'designer')}</div>
              <button
                onClick={() => setShowSaveDialog(!showSaveDialog)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all ${
                  showSaveDialog
                    ? isLG ? 'bg-emerald-500/15 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400'
                    : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
                }`}
              >
                <Plus className="w-3 h-3" />
                {t('layout.saveLayout', 'designer')}
              </button>
            </div>

            {/* Save dialog */}
            {showSaveDialog && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <input
                  autoFocus
                  value={saveLayoutName}
                  onChange={e => setSaveLayoutName(e.target.value)}
                  placeholder={t('layout.layoutName', 'designer')}
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-[11px] text-white/60 outline-none focus:border-emerald-500/30 placeholder:text-white/15"
                  onKeyDown={e => { if (e.key === 'Enter') {handleSave();} if (e.key === 'Escape') {setShowSaveDialog(false)} }}
                />
                <button onClick={handleSave} className="px-3 py-1 rounded text-[10px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                  <Save className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Saved layouts list */}
            {savedLayouts.length === 0 ? (
              <div className="text-[10px] text-white/15 text-center py-6 border border-dashed border-white/[0.06] rounded-lg">
                {t('layout.noSavedLayouts', 'designer')}
              </div>
            ) : (
              <div className="space-y-1.5">
                {savedLayouts.map(layout => (
                  <div
                    key={layout.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      activeLayoutId === layout.id
                        ? isLG ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : 'border-cyan-500/20 bg-cyan-500/[0.04]'
                        : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08]'
                    }`}
                  >
                    <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${activeLayoutId === layout.id ? (isLG ? 'text-emerald-400/60' : 'text-cyan-400/60') : 'text-white/20'}`} />
                    <div className="flex-1 min-w-0">
                      {editingId === layout.id ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5 text-[11px] text-white/60 outline-none"
                          onKeyDown={e => { if (e.key === 'Enter') {handleRename(layout.id);} if (e.key === 'Escape') {setEditingId(null)} }}
                          onBlur={() => handleRename(layout.id)}
                        />
                      ) : (
                        <>
                          <span className="text-[11px] text-white/60 truncate block">{layout.name}</span>
                          <span className="text-[9px] text-white/15">
                            {new Date(layout.updatedAt).toLocaleDateString()} {new Date(layout.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => loadSavedLayout(layout.id)}
                        className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-colors"
                        title={t('layout.loadLayout', 'designer')}
                      >
                        <Upload className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => overwriteSavedLayout(layout.id)}
                        className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-colors"
                        title={t('layout.overwriteLayout', 'designer')}
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => { setEditingId(layout.id); setEditingName(layout.name) }}
                        className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-colors"
                        title={t('layout.renameLayout', 'designer')}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteSavedLayout(layout.id)}
                        className="p-1 rounded text-white/20 hover:text-red-400/50 hover:bg-red-500/[0.06] transition-colors"
                        title={t('layout.deleteLayout', 'designer')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Controls */}
          <div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">{t('layout.panelControl', 'designer')}</div>
            <div className="space-y-2">
              {panels.map(panelId => {
                const panel = config.panels[panelId]
                if (!panel) {return null}
                const Icon = PANEL_ICONS[panelId]

                return (
                  <div
                    key={panelId}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      panel.visible
                        ? 'border-white/[0.06] bg-white/[0.02]'
                        : 'border-white/[0.03] bg-white/[0.01] opacity-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      panel.visible ? 'bg-white/[0.06]' : 'bg-white/[0.02]'
                    }`}>
                      <Icon className={`w-4 h-4 ${panel.visible ? 'text-white/50' : 'text-white/15'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-white/70">{t(panel.label, 'designer')}</div>
                      <div className="text-[10px] text-white/25">
                        {panel.visible
                          ? (panel.collapsed ? t('layout.collapsed', 'designer') : `${panel.defaultSize}%`)
                          : t('layout.hidden', 'designer')
                        }
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Visibility toggle */}
                      <button
                        onClick={() => togglePanelVisibility(panelId)}
                        className={`p-1.5 rounded-lg transition-all ${
                          panel.visible
                            ? 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
                            : 'text-white/15 hover:text-white/40 hover:bg-white/[0.04]'
                        }`}
                        title={panel.visible ? t('layout.hidePanel', 'designer') : t('layout.showPanel', 'designer')}
                      >
                        {panel.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Collapse toggle */}
                      {panel.visible && (
                        <button
                          onClick={() => togglePanelCollapse(panelId)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                          title={panel.collapsed ? t('layout.expandPanel', 'designer') : t('layout.collapsePanel', 'designer')}
                        >
                          {panelId === 'left' ? (
                            panel.collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />
                          ) : (
                            panel.collapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <PanelRightClose className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Visual Preview */}
          <div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">{t('layout.layoutPreview', 'designer')}</div>
            <div className="h-16 rounded-lg border border-white/[0.06] bg-white/[0.02] flex overflow-hidden">
              {panels.map(panelId => {
                const panel = config.panels[panelId]
                if (!panel || !panel.visible) {return null}

                const colorMap: Record<PanelId, string> = {
                  left: 'bg-violet-500/15 border-violet-500/20',
                  center: 'bg-blue-500/15 border-blue-500/20',
                  right: 'bg-emerald-500/15 border-emerald-500/20',
                  preview: 'bg-cyan-500/15 border-cyan-500/20',
                }

                return (
                  <div
                    key={panelId}
                    className={`h-full border-r last:border-r-0 flex items-center justify-center transition-all ${colorMap[panelId]}`}
                    style={{
                      width: panel.collapsed ? '24px' : `${panel.defaultSize}%`,
                      minWidth: panel.collapsed ? '24px' : undefined,
                    }}
                  >
                    {!panel.collapsed && (
                      <span className="text-[9px] text-white/30">{t(panel.label, 'designer')}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-3 border-t bg-white/[0.01] ${
          isLG ? 'border-emerald-500/[0.08]' : 'border-white/[0.06]'
        }`}>
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/30 text-[11px] hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            {t('layout.resetDefault', 'designer')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.1] transition-all"
          >
            {t('layout.done', 'designer')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Quick layout toggle buttons for TopNavBar
// ============================================

export function LayoutQuickToggles() {
  const { config, togglePanelCollapse, togglePanelVisibility } = useLayoutStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const panels: PanelId[] = ['left', 'center', 'right']

  return (
    <div className="flex items-center gap-0.5">
      {panels.map(panelId => {
        const panel = config.panels[panelId]
        if (!panel) {return null}
        const Icon = PANEL_ICONS[panelId]

        return (
          <button
            key={panelId}
            onClick={() => {
              if (!panel.visible) {
                togglePanelVisibility(panelId)
              } else {
                togglePanelCollapse(panelId)
              }
            }}
            className={`p-1 rounded transition-colors ${
              panel.visible && !panel.collapsed
                ? isLG
                  ? 'text-emerald-400/40 hover:text-emerald-400/70 bg-emerald-500/[0.06]'
                  : 'text-white/40 hover:text-white/70 bg-white/[0.04]'
                : 'text-white/15 hover:text-white/30'
            }`}
            title={`${t(panel.label, 'designer')} - ${panel.visible ? (panel.collapsed ? t('layout.collapsed', 'designer') : t('layout.showing', 'designer')) : t('layout.hidden', 'designer')}`}
          >
            <Icon className="w-3 h-3" />
          </button>
        )
      })}
    </div>
  )
}
