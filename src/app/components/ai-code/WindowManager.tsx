/**
 * @file WindowManager.tsx
 * @description 窗口管理系统 — 多面板创建/删除/分割/合并/最大化/最小化/锁定/浮动 + 布局持久化 + 标签增强 + 浮动拖拽 + 全8方向缩放 + 磁吸对齐 + 层级管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.4.0
 * @created 2026-03-14
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags window,panel,layout,split,merge,maximize,tab,persistence,ai-code
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Resizable } from 're-resizable';
import {
  X, Minus, Maximize2, Minimize2, Lock, Unlock,
  SquareSplitHorizontal, SquareSplitVertical, Columns2,
  GripVertical, Save, RotateCcw,
  LayoutDashboard, Monitor, FileCode2, Terminal, Bug, Search,
  MessageSquare, Database, GitBranch, Eye, FolderOpen,
  type LucideIcon,
} from 'lucide-react';

/* ================================================================
   Types (aligned with guidelines §2410)
   ================================================================ */
export type PanelType =
  | 'editor'      // Code Editor Panel
  | 'fileTree'    // File Browser Panel
  | 'preview'     // Preview Panel
  | 'terminal'    // Terminal Panel
  | 'debug'       // Debug Panel
  | 'output'      // Output Panel
  | 'search'      // Search Results Panel
  | 'aiChat'      // AI Chat Panel
  | 'database'    // Database Management Panel
  | 'git'         // Version Control Panel
  | 'quickActions'; // Quick Actions Toolbar Panel

export type PanelState = 'normal' | 'minimized' | 'maximized' | 'floating';
export type SplitDirection = 'horizontal' | 'vertical';
export type WindowLayout = 'tiled' | 'stacked' | 'grid' | 'custom';

export interface PanelConfig {
  id: string;
  type: PanelType;
  title: string;
  icon: LucideIcon;
  state: PanelState;
  locked: boolean;
  order: number;
  // Size in percentage
  size: { width: number; height: number };
  // For floating panels
  position?: { x: number; y: number };
  /** Z-index stacking order for floating panels (higher = on top) */
  zIndex?: number;
  // Split info
  splitDirection?: SplitDirection;
  splitChildren?: string[]; // child panel IDs
  parentId?: string;
}

export interface TabConfig {
  id: string;
  fileId: string;
  name: string;
  language: string;
  content: string;
  isPinned: boolean;
  isModified: boolean;
  groupId?: string;
  lastAccessed: number;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  tabIds: string[];
  collapsed: boolean;
}

export interface LayoutSnapshot {
  id: string;
  name: string;
  description: string;
  panels: PanelConfig[];
  tabGroups: TabGroup[];
  windowLayout: WindowLayout;
  timestamp: number;
}

export interface WindowManagerState {
  panels: PanelConfig[];
  tabs: TabConfig[];
  tabGroups: TabGroup[];
  activeTabId: string | null;
  activePanelId: string | null;
  windowLayout: WindowLayout;
  savedLayouts: LayoutSnapshot[];
  recentTabs: string[]; // last 10 tab IDs
}

/* ================================================================
   Panel Type Registry
   ================================================================ */
export const PANEL_TYPE_REGISTRY: Record<PanelType, { label: string; icon: LucideIcon; color: string }> = {
  editor:   { label: '代码编辑器', icon: FileCode2,      color: 'text-cyan-400' },
  fileTree: { label: '文件浏览器', icon: FolderOpen,      color: 'text-amber-400' },
  preview:  { label: '实时预览',   icon: Eye,             color: 'text-emerald-400' },
  terminal: { label: '终端',       icon: Terminal,         color: 'text-green-400' },
  debug:    { label: '调试面板',   icon: Bug,             color: 'text-orange-400' },
  output:   { label: '输出面板',   icon: Monitor,         color: 'text-blue-400' },
  search:   { label: '搜索结果',   icon: Search,          color: 'text-violet-400' },
  aiChat:   { label: 'AI 助手',   icon: MessageSquare,    color: 'text-indigo-400' },
  database: { label: '数据库管理', icon: Database,         color: 'text-rose-400' },
  git:      { label: '版本控制',   icon: GitBranch,        color: 'text-pink-400' },
  quickActions: { label: '快速操作', icon: Columns2,        color: 'text-gray-400' },
};

/* ================================================================
   Storage Keys
   ================================================================ */
const LAYOUT_STORAGE_KEY = 'yyc3-window-layouts';
const ACTIVE_LAYOUT_KEY = 'yyc3-active-layout';

/* ================================================================
   Default State
   ================================================================ */
const DEFAULT_PANELS: PanelConfig[] = [
  { id: 'panel-filetree', type: 'fileTree', title: '文件浏览器', icon: FolderOpen, state: 'normal', locked: false, order: 0, size: { width: 20, height: 100 } },
  { id: 'panel-editor', type: 'editor', title: '代码编辑器', icon: FileCode2, state: 'normal', locked: false, order: 1, size: { width: 50, height: 100 } },
  { id: 'panel-preview', type: 'preview', title: '实时预览', icon: Eye, state: 'normal', locked: false, order: 2, size: { width: 30, height: 100 } },
];

/* ================================================================
   Persistence Helpers
   ================================================================ */
function loadLayouts(): LayoutSnapshot[] {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLayouts(layouts: LayoutSnapshot[]) {
  try { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts)); } catch { /* */ }
}

function loadActiveLayoutId(): string | null {
  try { return localStorage.getItem(ACTIVE_LAYOUT_KEY); } catch { return null; }
}

function saveActiveLayoutId(id: string) {
  try { localStorage.setItem(ACTIVE_LAYOUT_KEY, id); } catch { /* */ }
}

/* ================================================================
   useWindowManager Hook
   ================================================================ */
export function useWindowManager() {
  const [panels, setPanels] = useState<PanelConfig[]>(DEFAULT_PANELS);
  const [tabs, setTabs] = useState<TabConfig[]>([]);
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activePanelId, setActivePanelId] = useState<string | null>('panel-editor');
  const [windowLayout, setWindowLayout] = useState<WindowLayout>('tiled');
  const [savedLayouts, setSavedLayouts] = useState<LayoutSnapshot[]>(loadLayouts);
  const [recentTabs, setRecentTabs] = useState<string[]>([]);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save layout on changes (debounced)
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const autoLayout: LayoutSnapshot = {
        id: '__auto__',
        name: '自动保存',
        description: '上次使用的布局',
        panels,
        tabGroups,
        windowLayout,
        timestamp: Date.now(),
      };
      const others = savedLayouts.filter(l => l.id !== '__auto__');
      const newLayouts = [autoLayout, ...others];
      setSavedLayouts(newLayouts);
      saveLayouts(newLayouts);
      saveActiveLayoutId('__auto__');
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [panels, tabGroups, windowLayout]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore layout on mount
  useEffect(() => {
    const activeId = loadActiveLayoutId();
    if (activeId) {
      const layouts = loadLayouts();
      const layout = layouts.find(l => l.id === activeId);
      if (layout && layout.panels.length > 0) {
        setPanels(layout.panels.map(p => ({
          ...p,
          icon: PANEL_TYPE_REGISTRY[p.type]?.icon || FileCode2,
        })));
        setTabGroups(layout.tabGroups || []);
        setWindowLayout(layout.windowLayout || 'tiled');
      }
    }
  }, []);

  /* ─── Panel CRUD ─── */
  const createPanel = useCallback((type: PanelType, config?: Partial<PanelConfig>): string => {
    const reg = PANEL_TYPE_REGISTRY[type];
    const id = `panel-${type}-${Date.now()}`;
    const newPanel: PanelConfig = {
      id,
      type,
      title: reg.label,
      icon: reg.icon,
      state: 'normal',
      locked: false,
      order: panels.length,
      size: { width: 33, height: 100 },
      ...config,
    };
    setPanels(prev => [...prev, newPanel]);
    setActivePanelId(id);
    return id;
  }, [panels.length]);

  const deletePanel = useCallback((id: string) => {
    setPanels(prev => {
      if (prev.length <= 1) return prev; // Minimum one panel
      const next = prev.filter(p => p.id !== id);
      if (activePanelId === id) setActivePanelId(next[0]?.id || null);
      return next;
    });
  }, [activePanelId]);

  const updatePanel = useCallback((id: string, updates: Partial<PanelConfig>) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  /* ─── Panel State Operations ─── */
  const maximizePanel = useCallback((id: string) => {
    setPanels(prev => prev.map(p => ({
      ...p,
      state: p.id === id ? (p.state === 'maximized' ? 'normal' : 'maximized') : (p.state === 'maximized' ? 'normal' : p.state),
    })));
    setActivePanelId(id);
  }, []);

  const minimizePanel = useCallback((id: string) => {
    setPanels(prev => prev.map(p =>
      p.id === id ? { ...p, state: p.state === 'minimized' ? 'normal' : 'minimized' } : p
    ));
  }, []);

  const toggleLockPanel = useCallback((id: string) => {
    setPanels(prev => prev.map(p =>
      p.id === id ? { ...p, locked: !p.locked } : p
    ));
  }, []);

  const floatPanel = useCallback((id: string, position?: { x: number; y: number }) => {
    setPanels(prev => prev.map(p =>
      p.id === id ? { ...p, state: 'floating', position: position || { x: 100, y: 100 } } : p
    ));
  }, []);

  const dockPanel = useCallback((id: string) => {
    setPanels(prev => prev.map(p =>
      p.id === id ? { ...p, state: 'normal', position: undefined } : p
    ));
  }, []);

  const updatePanelPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setPanels(prev => prev.map(p =>
      p.id === id ? { ...p, position } : p
    ));
  }, []);

  /* ─── Split Operations ─── */
  const splitPanel = useCallback((id: string, direction: SplitDirection): string | null => {
    const panel = panels.find(p => p.id === id);
    if (!panel || panel.locked) return null;

    const reg = PANEL_TYPE_REGISTRY[panel.type];
    const newId = `panel-${panel.type}-${Date.now()}`;
    const newPanel: PanelConfig = {
      id: newId,
      type: panel.type,
      title: reg.label + ' (分割)',
      icon: reg.icon,
      state: 'normal',
      locked: false,
      order: panel.order + 0.5,
      size: {
        width: direction === 'horizontal' ? panel.size.width / 2 : panel.size.width,
        height: direction === 'vertical' ? panel.size.height / 2 : panel.size.height,
      },
      parentId: id,
    };

    setPanels(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          splitDirection: direction,
          splitChildren: [id, newId],
          size: {
            width: direction === 'horizontal' ? p.size.width / 2 : p.size.width,
            height: direction === 'vertical' ? p.size.height / 2 : p.size.height,
          },
        };
      });
      return [...updated, newPanel].sort((a, b) => a.order - b.order);
    });
    return newId;
  }, [panels]);

  const mergePanel = useCallback((sourceId: string, targetId: string) => {
    setPanels(prev => {
      const source = prev.find(p => p.id === sourceId);
      const target = prev.find(p => p.id === targetId);
      if (!source || !target) return prev;
      // Remove source, expand target
      return prev
        .filter(p => p.id !== sourceId)
        .map(p => p.id === targetId ? { ...p, size: { width: p.size.width + source.size.width, height: p.size.height } } : p);
    });
  }, []);

  /* ─── Tab Management ── */
  const openTab = useCallback((tab: Omit<TabConfig, 'lastAccessed'>): void => {
    setTabs(prev => {
      const existing = prev.find(t => t.fileId === tab.fileId);
      if (existing) {
        setActiveTabId(existing.id);
        return prev.map(t => t.id === existing.id ? { ...t, lastAccessed: Date.now() } : t);
      }
      const newTab = { ...tab, lastAccessed: Date.now() };
      setActiveTabId(newTab.id);
      return [...prev, newTab];
    });
    setRecentTabs(prev => [tab.id, ...prev.filter(id => id !== tab.id)].slice(0, 10));
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const tab = prev.find(t => t.id === tabId);
      if (tab?.isPinned) return prev; // Cannot close pinned tab
      const next = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && next.length > 0) {
        // Switch to most recently accessed tab
        const sorted = [...next].sort((a, b) => b.lastAccessed - a.lastAccessed);
        setActiveTabId(sorted[0].id);
      } else if (next.length === 0) {
        setActiveTabId(null);
      }
      return next;
    });
  }, [activeTabId]);

  const closeOtherTabs = useCallback((keepTabId: string) => {
    setTabs(prev => prev.filter(t => t.id === keepTabId || t.isPinned));
    setActiveTabId(keepTabId);
  }, []);

  const closeAllTabs = useCallback(() => {
    setTabs(prev => prev.filter(t => t.isPinned));
    const pinned = tabs.filter(t => t.isPinned);
    setActiveTabId(pinned.length > 0 ? pinned[0].id : null);
  }, [tabs]);

  const togglePinTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isPinned: !t.isPinned } : t));
  }, []);

  const markTabModified = useCallback((tabId: string, modified: boolean) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isModified: modified } : t));
  }, []);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, content, isModified: true } : t));
  }, []);

  const switchToNextTab = useCallback(() => {
    if (tabs.length === 0) return;
    const idx = tabs.findIndex(t => t.id === activeTabId);
    const next = tabs[(idx + 1) % tabs.length];
    setActiveTabId(next.id);
    setRecentTabs(prev => [next.id, ...prev.filter(id => id !== next.id)].slice(0, 10));
  }, [tabs, activeTabId]);

  const switchToPrevTab = useCallback(() => {
    if (tabs.length === 0) return;
    const idx = tabs.findIndex(t => t.id === activeTabId);
    const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
    setActiveTabId(prev.id);
    setRecentTabs(p => [prev.id, ...p.filter(id => id !== prev.id)].slice(0, 10));
  }, [tabs, activeTabId]);

  const reorderTabs = useCallback((fromIdx: number, toIdx: number) => {
    setTabs(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  /* ─── Tab Groups ─── */
  const createTabGroup = useCallback((name: string, color: string, tabIds: string[]): string => {
    const id = `group-${Date.now()}`;
    setTabGroups(prev => [...prev, { id, name, color, tabIds, collapsed: false }]);
    setTabs(prev => prev.map(t => tabIds.includes(t.id) ? { ...t, groupId: id } : t));
    return id;
  }, []);

  const removeTabGroup = useCallback((groupId: string) => {
    setTabGroups(prev => prev.filter(g => g.id !== groupId));
    setTabs(prev => prev.map(t => t.groupId === groupId ? { ...t, groupId: undefined } : t));
  }, []);

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setTabGroups(prev => prev.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
  }, []);

  /* ─── Layout Management ─── */
  const saveLayout = useCallback((name: string, description: string = ''): string => {
    const id = `layout-${Date.now()}`;
    const snapshot: LayoutSnapshot = {
      id,
      name,
      description,
      panels: panels.map(({ icon, ...rest }) => ({ ...rest, icon } as any)),
      tabGroups,
      windowLayout,
      timestamp: Date.now(),
    };
    setSavedLayouts(prev => {
      const next = [...prev.filter(l => l.id !== '__auto__'), snapshot];
      saveLayouts(next);
      return next;
    });
    saveActiveLayoutId(id);
    return id;
  }, [panels, tabGroups, windowLayout]);

  const loadLayout = useCallback((layoutId: string) => {
    const layout = savedLayouts.find(l => l.id === layoutId);
    if (!layout) return;
    setPanels(layout.panels.map(p => ({
      ...p,
      icon: PANEL_TYPE_REGISTRY[p.type]?.icon || FileCode2,
    })));
    setTabGroups(layout.tabGroups || []);
    setWindowLayout(layout.windowLayout || 'tiled');
    saveActiveLayoutId(layoutId);
  }, [savedLayouts]);

  const deleteLayout = useCallback((layoutId: string) => {
    setSavedLayouts(prev => {
      const next = prev.filter(l => l.id !== layoutId);
      saveLayouts(next);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setPanels(DEFAULT_PANELS);
    setWindowLayout('tiled');
  }, []);

  /* ─── Keyboard Shortcuts (only shortcuts not handled by AICodeSystem) ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      // Ctrl+Tab = next tab
      if (mod && e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) switchToPrevTab();
        else switchToNextTab();
      }
      // Ctrl+Shift+\ = vertical split
      if (mod && e.shiftKey && e.key === '|') {
        e.preventDefault();
        if (activePanelId) splitPanel(activePanelId, 'vertical');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabId, activePanelId, switchToNextTab, switchToPrevTab, splitPanel]);

  /* ─── Derived ─── */
  const visiblePanels = useMemo(
    () => panels.filter(p => p.state !== 'minimized'),
    [panels],
  );
  const minimizedPanels = useMemo(
    () => panels.filter(p => p.state === 'minimized'),
    [panels],
  );
  const floatingPanels = useMemo(
    () => panels.filter(p => p.state === 'floating'),
    [panels],
  );
  const maximizedPanel = useMemo(
    () => panels.find(p => p.state === 'maximized') || null,
    [panels],
  );
  const modifiedTabs = useMemo(
    () => tabs.filter(t => t.isModified),
    [tabs],
  );
  const pinnedTabs = useMemo(
    () => tabs.filter(t => t.isPinned),
    [tabs],
  );

  return {
    // Panels
    panels, visiblePanels, minimizedPanels, floatingPanels, maximizedPanel,
    createPanel, deletePanel, updatePanel,
    maximizePanel, minimizePanel, toggleLockPanel, floatPanel, dockPanel, updatePanelPosition,
    splitPanel, mergePanel,
    activePanelId, setActivePanelId,

    // Tabs
    tabs, modifiedTabs, pinnedTabs, recentTabs,
    activeTabId, setActiveTabId,
    openTab, closeTab, closeOtherTabs, closeAllTabs,
    togglePinTab, markTabModified, updateTabContent,
    switchToNextTab, switchToPrevTab, reorderTabs,

    // Tab Groups
    tabGroups,
    createTabGroup, removeTabGroup, toggleGroupCollapse,

    // Layout
    windowLayout, setWindowLayout,
    savedLayouts, saveLayout, loadLayout, deleteLayout, resetLayout,
  };
}

/* ================================================================
   Panel Header Bar (reusable)
   ================================================================ */
export function PanelHeader({
  panel,
  onMaximize, onMinimize, onClose, onLock, onFloat, onSplitH, onSplitV,
}: {
  panel: PanelConfig;
  onMaximize?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  onLock?: () => void;
  onFloat?: () => void;
  onSplitH?: () => void;
  onSplitV?: () => void;
}) {
  const reg = PANEL_TYPE_REGISTRY[panel.type];
  const Icon = reg.icon;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="flex items-center justify-between px-2 py-1 border-b border-white/[0.06] bg-white/[0.01] shrink-0 group/ph">
      <div className="flex items-center gap-1.5">
        <GripVertical size={10} className="text-white/10 cursor-grab active:cursor-grabbing opacity-0 group-hover/ph:opacity-100 transition-opacity" />
        <Icon size={11} className={reg.color + '/60'} />
        <span className="text-[10px] text-white/40" style={{ fontWeight: 500 }}>{panel.title}</span>
        {panel.locked && <Lock size={8} className="text-amber-400/40" />}
        {panel.state === 'floating' && <span className="text-[7px] text-violet-400/40 bg-violet-500/10 px-1 py-0.5 rounded">浮动</span>}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover/ph:opacity-100 transition-opacity">
        {/* Split dropdown */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)}
            className="p-0.5 rounded hover:bg-white/[0.08] text-white/20 hover:text-white/40 transition-colors">
            <Columns2 size={10} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 bg-[#1a1b26] border border-white/[0.1] rounded-lg shadow-xl z-50 overflow-hidden min-w-[130px]"
              >
                <button onClick={() => { onSplitH?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-white/50 hover:bg-white/[0.06] transition-colors">
                  <SquareSplitHorizontal size={11} /> 水平分割
                </button>
                <button onClick={() => { onSplitV?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-white/50 hover:bg-white/[0.06] transition-colors">
                  <SquareSplitVertical size={11} /> 垂直分割
                </button>
                <div className="border-t border-white/[0.06]" />
                <button onClick={() => { onFloat?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-white/50 hover:bg-white/[0.06] transition-colors">
                  <Maximize2 size={11} /> {panel.state === 'floating' ? '停靠面板' : '浮动面板'}
                </button>
                <button onClick={() => { onLock?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-white/50 hover:bg-white/[0.06] transition-colors">
                  {panel.locked ? <Unlock size={11} /> : <Lock size={11} />}
                  {panel.locked ? '解锁面板' : '锁定面板'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onMinimize && (
          <button onClick={onMinimize}
            className="p-0.5 rounded hover:bg-white/[0.08] text-white/20 hover:text-white/40 transition-colors">
            <Minus size={10} />
          </button>
        )}
        {onMaximize && (
          <button onClick={onMaximize}
            className="p-0.5 rounded hover:bg-white/[0.08] text-white/20 hover:text-white/40 transition-colors">
            {panel.state === 'maximized' ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
          </button>
        )}
        {onClose && (
          <button onClick={onClose}
            className="p-0.5 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors">
            <X size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Layout Saver Dialog
   ================================================================ */
export function LayoutSaverDialog({
  savedLayouts,
  onSave,
  onLoad,
  onDelete,
  onReset,
  onClose,
}: {
  savedLayouts: LayoutSnapshot[];
  onSave: (name: string, desc: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const userLayouts = savedLayouts.filter(l => l.id !== '__auto__');

  return (
    <motion.div className="fixed inset-0 z-[320] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="w-[420px] bg-[#14151e] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
        initial={{ y: -20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={14} className="text-indigo-400" />
            <span className="text-[12px] text-white/60" style={{ fontWeight: 600 }}>布局管理</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onReset}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] text-white/25 hover:bg-white/[0.06] hover:text-white/40 transition-colors">
              <RotateCcw size={10} /> 重置默认
            </button>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-white/[0.06] text-white/25"><X size={12} /></button>
          </div>
        </div>

        {/* Save new */}
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <div className="flex gap-2">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="布局名称..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[10px] text-white/50 outline-none placeholder:text-white/15 focus:border-indigo-500/40" />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="备注（可选）"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[10px] text-white/50 outline-none placeholder:text-white/15 focus:border-indigo-500/40" />
            <button onClick={() => { if (name.trim()) { onSave(name.trim(), desc.trim()); setName(''); setDesc(''); } }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 text-[10px] hover:bg-indigo-500/25 transition-colors shrink-0"
              style={{ fontWeight: 500 }}>
              <Save size={10} /> 保存
            </button>
          </div>
        </div>

        {/* Layout list */}
        <div className="max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {userLayouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <LayoutDashboard size={24} className="text-white/10 mb-2" />
              <p className="text-[10px] text-white/20">暂无保存的布局</p>
            </div>
          ) : (
            <div className="py-1">
              {userLayouts.map(l => (
                <div key={l.id} className="flex items-center gap-3 px-4 py-2 hover:bg-white/[0.03] transition-colors">
                  <LayoutDashboard size={12} className="text-white/20 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-white/50 block" style={{ fontWeight: 500 }}>{l.name}</span>
                    {l.description && <p className="text-[8px] text-white/20 truncate">{l.description}</p>}
                    <span className="text-[8px] text-white/15">{new Date(l.timestamp).toLocaleString('zh-CN')}</span>
                  </div>
                  <button onClick={() => onLoad(l.id)}
                    className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[9px] hover:bg-emerald-500/20 transition-colors"
                    style={{ fontWeight: 500 }}>加载</button>
                  <button onClick={() => onDelete(l.id)}
                    className="p-1 rounded-md hover:bg-red-500/15 text-white/15 hover:text-red-400 transition-colors">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================
   Minimized Panel Tray (bottom bar)
   ================================================================ */
export function MinimizedPanelTray({
  panels,
  onRestore,
}: {
  panels: PanelConfig[];
  onRestore: (id: string) => void;
}) {
  if (panels.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-0.5">
      {panels.map(p => {
        const reg = PANEL_TYPE_REGISTRY[p.type];
        const Icon = reg.icon;
        return (
          <button key={p.id} onClick={() => onRestore(p.id)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white/50 hover:bg-white/[0.06] transition-colors">
            <Icon size={10} className={reg.color + '/40'} />
            <span className="text-[8px]">{p.title}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================
   Panel Creator Menu
   ================================================================ */
export function PanelCreatorMenu({
  onCreatePanel,
  onClose,
}: {
  onCreatePanel: (type: PanelType) => void;
  onClose: () => void;
}) {
  const types = Object.entries(PANEL_TYPE_REGISTRY) as [PanelType, typeof PANEL_TYPE_REGISTRY[PanelType]][];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }}
      className="absolute right-0 top-full mt-1 bg-[#1a1b26] border border-white/[0.1] rounded-lg shadow-2xl z-50 overflow-hidden min-w-[180px]"
    >
      <div className="px-3 py-1.5 border-b border-white/[0.06]">
        <span className="text-[9px] text-white/25" style={{ fontWeight: 600 }}>新建面板</span>
      </div>
      <div className="py-1 max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {types.map(([type, reg]) => (
          <button key={type} onClick={() => { onCreatePanel(type); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[10px] text-white/50 hover:bg-white/[0.06] hover:text-white/70 transition-colors">
            <reg.icon size={12} className={reg.color + '/60'} />
            <span>{reg.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ================================================================
   Floating Panel Wrapper (draggable + resizable)
   ================================================================ */
const RESIZE_HANDLE_STYLES: React.CSSProperties = {
  position: 'absolute',
  zIndex: 10,
};

/* ── Snap-to-edge constants ── */
const SNAP_THRESHOLD = 12; // px proximity to trigger snap
const SNAP_EDGES = { top: 0, left: 0 }; // viewport edges (dynamic right/bottom calculated from window)

interface SnapGuide {
  axis: 'x' | 'y';
  position: number;
}

/**
 * Calculate snap-adjusted position given raw position and panel size.
 * Returns snapped position and active snap guides for visual feedback.
 */
function calculateSnap(
  rawX: number,
  rawY: number,
  width: number,
  height: number,
  otherPanels: Array<{ x: number; y: number; w: number; h: number }>,
): { x: number; y: number; guides: SnapGuide[] } {
  let x = rawX;
  let y = rawY;
  const guides: SnapGuide[] = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Snap to viewport edges
  // Left edge
  if (Math.abs(x) < SNAP_THRESHOLD) { x = 0; guides.push({ axis: 'x', position: 0 }); }
  // Right edge
  if (Math.abs(x + width - vw) < SNAP_THRESHOLD) { x = vw - width; guides.push({ axis: 'x', position: vw }); }
  // Top edge
  if (Math.abs(y) < SNAP_THRESHOLD) { y = 0; guides.push({ axis: 'y', position: 0 }); }
  // Bottom edge
  if (Math.abs(y + height - vh) < SNAP_THRESHOLD) { y = vh - height; guides.push({ axis: 'y', position: vh }); }
  // Center horizontal
  const cx = vw / 2 - width / 2;
  if (Math.abs(x - cx) < SNAP_THRESHOLD) { x = cx; guides.push({ axis: 'x', position: vw / 2 }); }
  // Center vertical
  const cy = vh / 2 - height / 2;
  if (Math.abs(y - cy) < SNAP_THRESHOLD) { y = cy; guides.push({ axis: 'y', position: vh / 2 }); }

  // Snap to other floating panels
  for (const op of otherPanels) {
    // Snap left edge to other's right edge
    if (Math.abs(x - (op.x + op.w)) < SNAP_THRESHOLD) { x = op.x + op.w; guides.push({ axis: 'x', position: op.x + op.w }); }
    // Snap right edge to other's left edge
    if (Math.abs((x + width) - op.x) < SNAP_THRESHOLD) { x = op.x - width; guides.push({ axis: 'x', position: op.x }); }
    // Snap top edge to other's bottom edge
    if (Math.abs(y - (op.y + op.h)) < SNAP_THRESHOLD) { y = op.y + op.h; guides.push({ axis: 'y', position: op.y + op.h }); }
    // Snap bottom edge to other's top edge
    if (Math.abs((y + height) - op.y) < SNAP_THRESHOLD) { y = op.y - height; guides.push({ axis: 'y', position: op.y }); }
    // Align left edges
    if (Math.abs(x - op.x) < SNAP_THRESHOLD) { x = op.x; guides.push({ axis: 'x', position: op.x }); }
    // Align top edges
    if (Math.abs(y - op.y) < SNAP_THRESHOLD) { y = op.y; guides.push({ axis: 'y', position: op.y }); }
  }

  return { x: Math.max(0, x), y: Math.max(0, y), guides };
}

/* ── Z-order counter (monotonically increasing) ── */
let globalZCounter = 200;
export function getNextZIndex(): number {
  return ++globalZCounter;
}

export function FloatingPanelWrapper({
  panel,
  onUpdatePosition,
  onDock,
  onClose,
  children,
  otherFloatingPanels,
  onBringToFront,
}: {
  panel: PanelConfig;
  onUpdatePosition: (id: string, pos: { x: number; y: number }) => void;
  onDock: (id: string) => void;
  onClose: (id: string) => void;
  children: React.ReactNode;
  /** Other floating panels for snap-to-edge calculations */
  otherFloatingPanels?: Array<{ id: string; x: number; y: number; w: number; h: number }>;
  /** Callback to bring this panel to the front of the z-order stack */
  onBringToFront?: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStartPosRef = useRef({ x: 0, y: 0 });
  const [panelSize, setPanelSize] = useState({ width: 420, height: 380 });
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [localZIndex, setLocalZIndex] = useState(panel.zIndex ?? 200);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Only allow drag from header area
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-resize-handle]')) return;
    const header = (e.currentTarget as HTMLElement).querySelector('[data-drag-header]');
    if (!header) return;
    const headerRect = header.getBoundingClientRect();
    if (e.clientY > headerRect.bottom) return;

    // Bring to front on drag start
    const newZ = getNextZIndex();
    setLocalZIndex(newZ);
    onBringToFront?.(panel.id);

    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - (panel.position?.x || 0),
      y: e.clientY - (panel.position?.y || 0),
    };

    const move = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const rawX = ev.clientX - dragOffset.current.x;
      const rawY = ev.clientY - dragOffset.current.y;
      // Apply snap-to-edge
      const others = (otherFloatingPanels || []).filter(p => p.id !== panel.id);
      const { x, y, guides } = calculateSnap(rawX, rawY, panelSize.width, panelSize.height, others);
      setSnapGuides(guides);
      onUpdatePosition(panel.id, { x, y });
    };

    const up = () => {
      isDragging.current = false;
      setSnapGuides([]);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [panel.id, panel.position, onUpdatePosition, onBringToFront, otherFloatingPanels, panelSize]);

  // Bring to front on any click
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const newZ = getNextZIndex();
    setLocalZIndex(newZ);
    onBringToFront?.(panel.id);
    handleDragStart(e);
  }, [handleDragStart, onBringToFront, panel.id]);

  return (
    <>
      {/* Snap guide lines (rendered during drag) */}
      {snapGuides.length > 0 && snapGuides.map((g, i) => (
        <div
          key={i}
          className="fixed pointer-events-none"
          style={g.axis === 'x'
            ? { left: g.position, top: 0, width: 1, height: '100vh', background: 'rgba(99, 102, 241, 0.35)', zIndex: 999 }
            : { left: 0, top: g.position, width: '100vw', height: 1, background: 'rgba(99, 102, 241, 0.35)', zIndex: 999 }
          }
        />
      ))}
      <motion.div
        ref={wrapRef}
        className="fixed"
        style={{ left: panel.position?.x ?? 100, top: panel.position?.y ?? 100, zIndex: localZIndex }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.18 }}
        onMouseDown={handleMouseDown}
      >
        <Resizable
          size={panelSize}
          onResizeStart={(_e, _dir) => {
            // Capture starting position before resize begins
            resizeStartPosRef.current = {
              x: panel.position?.x ?? 100,
              y: panel.position?.y ?? 100,
            };
          }}
          onResize={(_e, dir, _ref, d) => {
            // During left/top resize, compensate position in real-time to prevent visual jumping
            const baseX = resizeStartPosRef.current.x;
            const baseY = resizeStartPosRef.current.y;
            let newX = baseX;
            let newY = baseY;

            if (dir === 'left' || dir === 'topLeft' || dir === 'bottomLeft') {
              newX = baseX - d.width;
            }
            if (dir === 'top' || dir === 'topLeft' || dir === 'topRight') {
              newY = baseY - d.height;
            }

            if (newX !== baseX || newY !== baseY) {
              onUpdatePosition(panel.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
            }
          }}
          onResizeStop={(_e, _dir, _ref, d) => {
            setPanelSize(prev => ({
              width: Math.max(280, prev.width + d.width),
              height: Math.max(200, prev.height + d.height),
            }));
          }}
          minWidth={280}
          minHeight={200}
          maxWidth={Math.max(280, window.innerWidth - 40)}
          maxHeight={Math.max(200, window.innerHeight - 40)}
          enable={{
            top: true, left: true, topLeft: true, topRight: true,
            right: true, bottom: true, bottomLeft: true, bottomRight: true,
          }}
          handleComponent={{
            right: <ResizeHandle direction="right" />,
            bottom: <ResizeHandle direction="bottom" />,
            left: <ResizeHandle direction="left" />,
            top: <ResizeHandle direction="top" />,
            bottomRight: <ResizeHandle direction="bottomRight" />,
            bottomLeft: <ResizeHandle direction="bottomLeft" />,
            topRight: <ResizeHandle direction="topRight" />,
            topLeft: <ResizeHandle direction="topLeft" />,
          }}
          className="bg-[#14151e] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header — drag zone */}
          <div data-drag-header className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.06] cursor-grab active:cursor-grabbing select-none">
            <div className="flex items-center gap-1.5">
              <GripVertical size={10} className="text-white/15" />
              {(() => { const reg = PANEL_TYPE_REGISTRY[panel.type]; const Icon = reg.icon; return <Icon size={11} className={reg.color + '/60'} />; })()}
              <span className="text-[10px] text-white/40" style={{ fontWeight: 500 }}>{panel.title}</span>
              <span className="text-[7px] text-violet-400/50 bg-violet-500/10 px-1 py-0.5 rounded">浮动</span>
              <span className="text-[7px] text-white/10">{panelSize.width}×{panelSize.height}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => onDock(panel.id)}
                className="p-0.5 rounded hover:bg-white/[0.08] text-white/20 hover:text-white/40 transition-colors"
                title="停靠面板">
                <Minimize2 size={10} />
              </button>
              <button onClick={() => onClose(panel.id)}
                className="p-0.5 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"
                title="关闭">
                <X size={10} />
              </button>
            </div>
          </div>
          {/* Content */}
          <div className="overflow-auto" style={{ height: panelSize.height - 30, scrollbarWidth: 'thin' }}>
            {children}
          </div>
        </Resizable>
      </motion.div>
    </>
  );
}

/* Custom thin resize handles matching dark theme */
type ResizeDir = 'right' | 'bottom' | 'left' | 'top' | 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';

function ResizeHandle({ direction }: { direction: ResizeDir }) {
  // Corner handles
  if (direction === 'bottomRight') {
    return (
      <div data-resize-handle style={{ ...RESIZE_HANDLE_STYLES, right: 0, bottom: 0, width: 14, height: 14, cursor: 'nwse-resize' }}
        className="flex items-end justify-end p-0.5 opacity-0 hover:opacity-100 transition-opacity">
        <svg width="8" height="8" viewBox="0 0 8 8" className="text-white/20">
          <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </div>
    );
  }
  if (direction === 'topLeft') {
    return (
      <div data-resize-handle style={{ ...RESIZE_HANDLE_STYLES, left: 0, top: 0, width: 14, height: 14, cursor: 'nwse-resize' }}
        className="flex items-start justify-start p-0.5 opacity-0 hover:opacity-100 transition-opacity">
        <svg width="8" height="8" viewBox="0 0 8 8" className="text-white/20">
          <path d="M1 7L7 1M1 4L4 1M1 1L1 1" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </div>
    );
  }
  if (direction === 'topRight') {
    return (
      <div data-resize-handle style={{ ...RESIZE_HANDLE_STYLES, right: 0, top: 0, width: 14, height: 14, cursor: 'nesw-resize' }}
        className="opacity-0 hover:opacity-100 transition-opacity" />
    );
  }
  if (direction === 'bottomLeft') {
    return (
      <div data-resize-handle style={{ ...RESIZE_HANDLE_STYLES, left: 0, bottom: 0, width: 14, height: 14, cursor: 'nesw-resize' }}
        className="opacity-0 hover:opacity-100 transition-opacity" />
    );
  }
  // Edge handles
  if (direction === 'right') {
    return <div data-resize-handle style={{ ...RESIZE_HANDLE_STYLES, right: -1, top: 0, width: 3, height: '100%', cursor: 'ew-resize' }}
      className="hover:bg-indigo-500/30 transition-colors" />;
  }
  if (direction === 'left') {
    return <div data-resize-handle style={{ ...RESIZE_HANDLE_STYLES, left: -1, top: 0, width: 3, height: '100%', cursor: 'ew-resize' }}
      className="hover:bg-indigo-500/30 transition-colors" />;
  }
  if (direction === 'top') {
    return <div data-resize-handle style={{ ...RESIZE_HANDLE_STYLES, top: -1, left: 0, width: '100%', height: 3, cursor: 'ns-resize' }}
      className="hover:bg-indigo-500/30 transition-colors" />;
  }
  // bottom
  return <div data-resize-handle style={{ ...RESIZE_HANDLE_STYLES, bottom: -1, left: 0, width: '100%', height: 3, cursor: 'ns-resize' }}
    className="hover:bg-indigo-500/30 transition-colors" />;
}