import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers, Puzzle, Database, Server, Sparkles, TestTube,
  Radio, Settings, ChevronLeft, ChevronRight, Save, Code,
  Sun, Moon, ChevronDown, Undo2, Redo2, Search, Zap,
  Eye, Wifi, WifiOff, Cpu, Clock, Users, Magnet,
  HardDrive, Rocket, BookOpen, Figma, AlertTriangle,
  Droplets, Flame, X, Trash2, Lock, Shield, ShieldAlert,
  ChevronUp
} from 'lucide-react';
import yyc3Logo from '/yyc3-logo-blue.png';
import { useDesigner, type NavSection } from '../../store';
import { Tooltip } from './Tooltip';
import { motion, AnimatePresence } from 'motion/react';
import { useActivityBarNav } from './hooks/useFlyoutMenu';
import { SharedFlyoutMenu, type FlyoutStyleConfig } from './hooks/FlyoutMenuRenderer';

/* ================================================================
   Liquid Background with Floating Particles
   ================================================================ */

function LiquidBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 15; i++) {
      const p = document.createElement('div');
      p.className = 'lg-particle';
      const size = 2 + Math.random() * 5;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 20}s`;
      p.style.animationDuration = `${15 + Math.random() * 10}s`;
      container.appendChild(p);
      particles.push(p);
    }
    return () => { particles.forEach(p => p.remove()); };
  }, []);

  return <div ref={containerRef} className="lg-bg" />;
}

/* ================================================================
   Glass Toolbar (top bar)
   ================================================================ */

function GlassToolbar() {
  const {
    projectName, toggleTheme, theme, viewMode, setViewMode,
    syncStatus, undo, redo, canUndo, canRedo,
    toggleConflictResolver, conflicts, openModelSettings,
    uiTheme, setUITheme, currentUserIdentity,
  } = useDesigner();

  const userRole = currentUserIdentity?.role || 'editor';
  const isReadOnly = userRole === 'viewer' || userRole === 'guest';
  const roleMeta = LG_ROLE_META[userRole] || LG_ROLE_META.editor;

  return (
    <header
      className="h-12 flex items-center px-4 gap-2 shrink-0 z-50 select-none lg-glass-medium lg-shimmer"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-3">
        <img src={yyc3Logo} alt="YYC³" className="w-7 h-7 rounded-xl object-contain" />
        <div className="flex items-center gap-1 cursor-pointer group">
          <span className="text-[13px] text-white/90 group-hover:text-white transition-colors">{projectName}</span>
          <ChevronDown className="w-3 h-3 text-white/30" />
        </div>
      </div>

      <div className="w-px h-5 bg-white/[0.08] mx-1" />

      {/* History */}
      <Tooltip label="撤销" shortcut="⌘Z">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-2 rounded-xl transition-all ${canUndo ? 'text-white/50 hover:text-white hover:bg-white/[0.08]' : 'text-white/15 cursor-not-allowed'}`}
        >
          <Undo2 className="w-4 h-4" />
        </button>
      </Tooltip>
      <Tooltip label="重做" shortcut="⌘⇧Z">
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-2 rounded-xl transition-all ${canRedo ? 'text-white/50 hover:text-white hover:bg-white/[0.08]' : 'text-white/15 cursor-not-allowed'}`}
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </Tooltip>

      <div className="w-px h-5 bg-white/[0.08] mx-1" />

      {/* View mode */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.04]">
        {([
          { mode: 'design' as const, icon: Layers, label: '设计' },
          { mode: 'preview' as const, icon: Eye, label: '预览' },
          { mode: 'code' as const, icon: Code, label: '代码' },
        ]).map(({ mode, icon: Icon, label }) => (
          <Tooltip key={mode} label={label}>
            <button
              onClick={() => setViewMode(mode)}
              className={`p-2 rounded-lg transition-all ${
                viewMode === mode
                  ? 'bg-white/[0.12] text-white shadow-sm'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <button className="flex items-center gap-2 px-4 py-1.5 rounded-xl lg-glass text-white/30 hover:text-white/50 hover:bg-white/[0.08] transition-all text-[12px] w-64">
          <Search className="w-4 h-4" />
          <span>搜索组件、面板...</span>
          <div className="ml-auto flex items-center gap-0.5">
            <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded-md text-[10px] text-white/25">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded-md text-[10px] text-white/25">K</kbd>
          </div>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Sync */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]">
          <div className={`w-2 h-2 rounded-full ${
            syncStatus === 'synced' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
            : syncStatus === 'pending' ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.4)]'
            : 'bg-red-400 animate-pulse shadow-[0_0_8px_rgba(248,113,113,0.4)]'
          }`} />
          <span className={syncStatus === 'conflict' ? 'text-red-400 cursor-pointer' : 'text-white/30'}
            onClick={syncStatus === 'conflict' ? toggleConflictResolver : undefined}
          >
            {syncStatus === 'synced' ? '已同步' : syncStatus === 'pending' ? '同步中' : `冲突 (${conflicts.filter(c => !c.resolved).length})`}
          </span>
        </div>

        <div className="w-px h-5 bg-white/[0.08]" />

        <Tooltip label={isReadOnly ? '只读模式 — 无法保存' : '保存'} shortcut={isReadOnly ? undefined : '⌘S'}>
          <button
            disabled={isReadOnly}
            className={`p-2 rounded-xl transition-all ${
              isReadOnly
                ? 'text-white/10 cursor-not-allowed'
                : 'text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            {isReadOnly ? <Lock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          </button>
        </Tooltip>

        <Tooltip label={theme === 'dark' ? '切换亮色' : '切换暗色'}>
          <button onClick={toggleTheme} className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </Tooltip>

        {/* UI Theme cycle */}
        <Tooltip label="切换主题风格">
          <button
            onClick={() => setUITheme(uiTheme === 'liquid-glass' ? 'aurora' : uiTheme === 'aurora' ? 'classic' : 'liquid-glass')}
            className="p-2 rounded-xl text-white/40 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
          >
            <Droplets className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip label="模型设置">
          <button onClick={openModelSettings} className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all">
            <Settings className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip label="用户中心">
          <div className="flex items-center gap-1.5 ml-1">
            {/* Role badge */}
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${roleMeta.bg}`}>
              <Shield className={`w-2.5 h-2.5 ${roleMeta.color}`} />
              <span className={`text-[9px] ${roleMeta.color}`}>{roleMeta.label}</span>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer lg-btn-primary" style={{ padding: 0 }}>
              <span className="text-[11px] text-white">YC</span>
            </div>
          </div>
        </Tooltip>
      </div>
    </header>
  );
}

/* ================================================================
   Glass Activity Bar — Flyout-based with keyboard navigation
   ================================================================ */

interface GlassSubItem {
  id: string;
  label: string;
  icon: React.ElementType;
  desc: string;
  color: string;
  action: (ctx: any) => void;
}

const GLASS_NAV_ITEMS: {
  section: NavSection;
  icon: React.ElementType;
  label: string;
  gradient: string;
  getSubItems: () => GlassSubItem[];
}[] = [
  {
    section: 'design', icon: Layers, label: '设计画布', gradient: 'from-blue-500 to-cyan-400',
    getSubItems: () => [
      { id: 'canvas', label: '画布编辑器', icon: Layers, desc: '主设计画布', color: 'from-blue-500 to-cyan-400', action: c => c.setViewMode('design') },
      { id: 'preview', label: '实时预览', icon: Eye, desc: '预览所有面板', color: 'from-emerald-500 to-green-400', action: c => c.setViewMode('preview') },
      { id: 'code', label: '代码模式', icon: Code, desc: '查看生成代码', color: 'from-amber-500 to-orange-400', action: c => c.setViewMode('code') },
    ],
  },
  { section: 'components', icon: Puzzle, label: '组件面板', gradient: 'from-indigo-500 to-purple-400', getSubItems: () => [] },
  {
    section: 'data', icon: Database, label: '数据管理', gradient: 'from-cyan-500 to-teal-400',
    getSubItems: () => [
      { id: 'schema', label: '数据库管理', icon: Database, desc: 'Schema Explorer', color: 'from-cyan-500 to-teal-400', action: c => c.toggleSchemaExplorer() },
    ],
  },
  {
    section: 'infra', icon: Server, label: '基础设施', gradient: 'from-amber-500 to-orange-400',
    getSubItems: () => [
      { id: 'backend', label: '后端架构', icon: Server, desc: '五标签页', color: 'from-amber-500 to-orange-400', action: c => c.toggleBackendArch() },
      { id: 'storage', label: '宿主机存储', icon: HardDrive, desc: '六标签页', color: 'from-blue-500 to-cyan-400', action: c => c.toggleHostStorage() },
      { id: 'deploy', label: '配置即部署', icon: Rocket, desc: '五步部署', color: 'from-emerald-500 to-green-400', action: c => c.toggleDeployPanel() },
      { id: 'manual', label: '部署手册', icon: BookOpen, desc: '三标签页', color: 'from-amber-500 to-yellow-400', action: c => c.toggleDeployManual() },
    ],
  },
  {
    section: 'ai', icon: Sparkles, label: 'AI 智能', gradient: 'from-purple-500 to-pink-400',
    getSubItems: () => [
      { id: 'assist', label: 'AI 助手', icon: Sparkles, desc: '属性建议 / 代码片段', color: 'from-purple-500 to-pink-400', action: c => c.toggleAI() },
      { id: 'figma', label: 'Figma 设计指南', icon: Figma, desc: '五标签页', color: 'from-purple-500 to-violet-400', action: c => c.toggleFigmaGuide() },
      { id: 'codegen', label: '代码生成引擎', icon: Code, desc: '代码预览', color: 'from-indigo-500 to-blue-400', action: c => c.toggleCodePreview() },
    ],
  },
  {
    section: 'quality', icon: TestTube, label: '质量保障', gradient: 'from-emerald-500 to-green-400',
    getSubItems: () => [
      { id: 'quality', label: '质量面板', icon: TestTube, desc: '五标签页', color: 'from-emerald-500 to-green-400', action: c => c.toggleQualityPanel() },
    ],
  },
  {
    section: 'collab', icon: Radio, label: 'CRDT 协同', gradient: 'from-cyan-500 to-blue-400',
    getSubItems: () => [
      { id: 'crdt', label: 'CRDT 协同', icon: Radio, desc: '四标签页', color: 'from-cyan-500 to-blue-400', action: c => c.toggleCRDTPanel() },
      { id: 'conflicts', label: '冲突解析器', icon: AlertTriangle, desc: '查看/解决冲突', color: 'from-red-500 to-pink-400', action: c => c.toggleConflictResolver() },
      { id: 'simulate', label: '模拟冲突', icon: Zap, desc: '生成测试冲突', color: 'from-amber-500 to-orange-400', action: c => c.simulateConflict() },
    ],
  },
  {
    section: 'settings', icon: Settings, label: '设置', gradient: 'from-gray-400 to-gray-300',
    getSubItems: () => [
      { id: 'models', label: '模型管理', icon: Settings, desc: 'AI 模型配置', color: 'from-gray-400 to-gray-300', action: c => c.openModelSettings() },
      { id: 'theme', label: '主题切换', icon: Sun, desc: '暗色/亮色', color: 'from-amber-500 to-yellow-400', action: c => c.toggleTheme() },
      { id: 'aurora', label: '极光主题', icon: Flame, desc: '自然渐变光影', color: 'from-green-400 to-cyan-400', action: c => c.setUITheme('aurora') },
    ],
  },
];

/* ---------- Glass Flyout Menu ---------- */

function GlassFlyout({
  items, navItem, ctx, onClose, anchorRect,
}: {
  items: GlassSubItem[];
  navItem: typeof GLASS_NAV_ITEMS[number];
  ctx: any;
  onClose: () => void;
  anchorRect: DOMRect | null;
}) {
  const styleConfig: FlyoutStyleConfig = {
    containerClass: 'lg-glass-strong',
    containerMinHeight: 200,
    containerShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
    headerBorder: '1px solid rgba(255,255,255,0.06)',
    headerIconClass: `w-5 h-5 rounded-md bg-gradient-to-br ${navItem.gradient} flex items-center justify-center`,
    headerIconColor: 'text-white',
    headerLabelClass: 'text-[11px] text-white/60 tracking-wide',
    searchWrapperClass: 'flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] focus-within:border-indigo-400/30 transition-colors',
    searchIconClass: 'text-white/20',
    searchInputClass: 'bg-transparent text-[11px] text-white/70 placeholder:text-white/20 outline-none w-full',
    searchClearClass: 'text-white/20 hover:text-white/50',
    historyContainerClass: 'mt-1 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04]',
    historyLabelClass: 'text-[9px] text-white/20',
    historyClearBtnClass: 'text-[9px] text-white/15 hover:text-white/40 transition-colors',
    historyItemClass: 'flex items-center gap-1.5 px-2 py-1 hover:bg-white/[0.04] rounded cursor-pointer group',
    historyIconClass: 'text-white/15',
    historyTextClass: 'text-[10px] text-white/40 group-hover:text-white/60 flex-1 truncate',
    historyDeleteClass: 'text-white/10 hover:text-white/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
    itemBtnClass: 'hover:bg-white/[0.06] focus:bg-white/[0.08] focus:outline-none',
    itemFocusRing: 'focus:ring-1 focus:ring-indigo-400/30',
    itemIconWrapperClass: 'bg-gradient-to-br opacity-70 group-hover:opacity-100 transition-opacity',
    itemIconClass: 'text-white',
    itemLabelClass: 'text-[11px] text-white/60 group-hover:text-white/80 transition-colors',
    itemDescClass: 'text-[9px] text-white/20 truncate',
    emptyClass: 'text-[10px] text-white/20 text-center py-3',
    arrowClass: 'bg-[#14151f]/30 border-l border-b border-white/[0.08]',
    leftOffset: 64,
  };

  return (
    <SharedFlyoutMenu
      items={items}
      navItem={{ icon: navItem.icon, label: navItem.label, gradient: navItem.gradient }}
      ctx={ctx}
      onClose={onClose}
      anchorRect={anchorRect}
      style={styleConfig}
    />
  );
}

/* ---------- Glass Activity Bar with Flyout ---------- */

function GlassActivityBar() {
  const ctx = useDesigner();
  const {
    activeNavSection, setActiveNavSection, secondaryNavOpen, toggleSecondaryNav,
    syncStatus, conflicts, crdtPeers,
  } = ctx;

  const { openFlyout, anchorRect, handleNavClick, closeFlyout, setButtonRef } = useActivityBarNav<typeof GLASS_NAV_ITEMS[number]>({
    ctx,
    setActiveNavSection,
  });
  const unresolvedConflicts = conflicts.filter(c => !c.resolved).length;

  const mainItems = GLASS_NAV_ITEMS.filter(n => n.section !== 'settings');
  const settingsItem = GLASS_NAV_ITEMS.find(n => n.section === 'settings')!;

  return (
    <>
      <nav
        className="w-[56px] flex flex-col items-center py-3 gap-1 shrink-0 select-none z-40 lg-glass"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)', borderRadius: 0 }}
      >
        <div className="flex flex-col items-center gap-1 flex-1">
          {mainItems.map(({ section, icon: Icon, label, gradient }) => {
            const isActive = activeNavSection === section;
            const hasFlyout = openFlyout === section;
            return (
              <Tooltip key={section} label={label} side="bottom">
                <button
                  ref={setButtonRef(section)}
                  onClick={() => handleNavClick(section, GLASS_NAV_ITEMS.find(n => n.section === section)!)}
                  className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all group ${
                    isActive
                      ? 'lg-nav-active text-white'
                      : 'text-white/25 hover:text-white/60 hover:bg-white/[0.06]'
                  } ${hasFlyout ? 'ring-1 ring-white/[0.12]' : ''}`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {isActive && !hasFlyout && (
                    <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b ${gradient}`} />
                  )}
                  {section === 'collab' && (crdtPeers.length > 0 || unresolvedConflicts > 0) && (
                    <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white ${
                      unresolvedConflicts > 0 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    }`}>
                      {unresolvedConflicts > 0 ? unresolvedConflicts : crdtPeers.length + 1}
                    </div>
                  )}
                  {section === 'data' && syncStatus === 'conflict' && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>

        <div className="w-7 h-px bg-white/[0.06] my-1" />

        <Tooltip label={secondaryNavOpen ? '收起组件' : '展开组件'} side="bottom">
          <button
            onClick={toggleSecondaryNav}
            className="w-10 h-8 rounded-xl flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-all"
          >
            {secondaryNavOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </Tooltip>

        {/* Settings */}
        <Tooltip label={settingsItem.label} side="bottom">
          <button
            ref={setButtonRef(settingsItem.section)}
            onClick={() => handleNavClick(settingsItem.section, settingsItem)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeNavSection === 'settings' ? 'lg-nav-active text-white' : 'text-white/20 hover:text-white/50 hover:bg-white/[0.06]'
            } ${openFlyout === 'settings' ? 'ring-1 ring-white/[0.12]' : ''}`}
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </Tooltip>
      </nav>

      {/* Flyout menus */}
      <AnimatePresence>
        {openFlyout && (() => {
          const navItem = GLASS_NAV_ITEMS.find(n => n.section === openFlyout);
          if (!navItem) return null;
          const subItems = navItem.getSubItems();
          if (subItems.length === 0) return null;
          return (
            <GlassFlyout key={openFlyout} items={subItems} navItem={navItem} ctx={ctx} onClose={closeFlyout} anchorRect={anchorRect} />
          );
        })()}
      </AnimatePresence>
    </>
  );
}

/* ================================================================
   RBAC Role Meta — Liquid Glass
   ================================================================ */

const LG_ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  owner: { label: '所有者', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  admin: { label: '管理员', color: 'text-rose-400', bg: 'bg-rose-500/15' },
  editor: { label: '编辑者', color: 'text-violet-400', bg: 'bg-violet-500/15' },
  viewer: { label: '观察者', color: 'text-white/40', bg: 'bg-white/[0.06]' },
  guest: { label: '访客', color: 'text-white/25', bg: 'bg-white/[0.04]' },
};

/* ================================================================
   Glass Status Bar — enhanced with Peer List Popup & RBAC
   ================================================================ */

function GlassStatusBar() {
  const { syncStatus, aiTokensUsed, panels, components, snapEnabled, subCanvasPanelId, crdtPeers, crdtDocVersion, currentUserIdentity } = useDesigner();
  const [peerListOpen, setPeerListOpen] = useState(false);
  const peerListRef = useRef<HTMLDivElement>(null);

  // Close peer list on outside click
  useEffect(() => {
    if (!peerListOpen) return;
    const handler = (e: MouseEvent) => {
      if (peerListRef.current && !peerListRef.current.contains(e.target as Node)) {
        setPeerListOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [peerListOpen]);

  const userRole = currentUserIdentity?.role || 'editor';
  const isReadOnly = userRole === 'viewer' || userRole === 'guest';

  return (
    <footer
      className="h-8 flex items-center px-4 gap-4 shrink-0 select-none lg-glass-medium"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderRadius: 0 }}
    >
      {/* RBAC Read-only indicator */}
      {isReadOnly && (
        <>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/[0.08] border border-amber-500/15">
            <ShieldAlert className="w-3 h-3 text-amber-400/70" />
            <span className="text-[9px] text-amber-400/70">
              {userRole === 'viewer' ? '观察者' : '访客'}只读模式
            </span>
            <Lock className="w-2.5 h-2.5 text-amber-400/40" />
          </div>
          <div className="w-px h-3 bg-white/[0.06]" />
        </>
      )}

      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${
          syncStatus === 'synced' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
          : syncStatus === 'pending' ? 'bg-amber-400 animate-pulse'
          : 'bg-red-400 animate-pulse'
        }`} />
        {syncStatus === 'synced' ? (
          <Wifi className="w-3 h-3 text-emerald-400/60" />
        ) : (
          <WifiOff className="w-3 h-3 text-amber-400/60" />
        )}
        <span className="text-[10px] text-white/30">CRDT {syncStatus === 'synced' ? '已同步' : syncStatus === 'pending' ? '同步中' : '冲突'}</span>
      </div>

      <div className="w-px h-3 bg-white/[0.06]" />

      <div className="flex items-center gap-1.5">
        <Database className="w-3 h-3 text-white/20" />
        <span className="text-[10px] text-white/30">{panels.length} 面板 {components.length} 组件</span>
      </div>

      <div className="w-px h-3 bg-white/[0.06]" />

      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-purple-400/40" />
        <span className="text-[10px] text-white/30">AI: {aiTokensUsed.toLocaleString()} tokens</span>
      </div>

      <div className="w-px h-3 bg-white/[0.06]" />

      {/* Interactive Peer List */}
      <div className="relative" ref={peerListRef}>
        <Tooltip label={`${crdtPeers.length + 1} 位协作者在线 · 点击查看`} side="top">
          <button
            onClick={() => setPeerListOpen(prev => !prev)}
            className="flex items-center gap-1.5 cursor-pointer hover:bg-white/[0.06] rounded px-1.5 py-0.5 transition-all"
          >
            <Users className="w-3 h-3 text-white/20" />
            <span className="text-[10px] text-white/30">{crdtPeers.length + 1} 在线</span>
            <div className="flex -space-x-1">
              {crdtPeers.slice(0, 4).map(p => (
                <div key={p.id} className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.color, border: '1px solid #1e1f32' }} />
              ))}
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" style={{ border: '1px solid #1e1f32' }} />
            </div>
            {peerListOpen
              ? <ChevronDown className="w-2.5 h-2.5 text-white/20" />
              : <ChevronUp className="w-2.5 h-2.5 text-white/20" />}
          </button>
        </Tooltip>

        {/* Peer List Popover */}
        {peerListOpen && (
          <div
            className="absolute bottom-full left-0 mb-1.5 w-[280px] lg-glass-strong border border-white/[0.1] rounded-xl overflow-hidden z-[200]"
            style={{ boxShadow: '0 -8px 32px -8px rgba(0,0,0,0.6), 0 0 60px -20px rgba(139,92,246,0.08)' }}
          >
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[11px] text-white/60">在线协作者</span>
              <span className="text-[9px] text-white/20 ml-auto">CRDT v{crdtDocVersion}</span>
            </div>

            <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-0.5">
              {/* Self */}
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-violet-500/[0.06] border border-violet-500/10">
                <div className="relative shrink-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]"
                    style={{ backgroundColor: currentUserIdentity?.avatarColor || '#8b5cf6' }}
                  >
                    {currentUserIdentity?.displayName?.[0] || '我'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2" style={{ borderColor: '#1e1f32' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/90 truncate">{currentUserIdentity?.displayName || '你'}</span>
                    <span className="text-[8px] text-violet-400 opacity-60">本机</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] px-1.5 py-0 rounded ${LG_ROLE_META[userRole].bg} ${LG_ROLE_META[userRole].color}`}>
                      {LG_ROLE_META[userRole].label}
                    </span>
                    <span className="text-[9px] text-white/20">
                      <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                      {isReadOnly ? '只读浏览中' : '活跃编辑中'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Peers */}
              {crdtPeers.map(peer => {
                const isOnline = Date.now() - peer.lastSeen < 30000;
                const cursorPanel = peer.cursor?.panelId ? panels.find(p => p.id === peer.cursor?.panelId) : null;
                const cursorComp = peer.cursor?.componentId ? components.find(c => c.id === peer.cursor?.componentId) : null;
                const roleMeta = LG_ROLE_META[peer.role || 'editor'];

                return (
                  <div key={peer.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-all">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: peer.color }}>
                        {peer.name[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isOnline ? 'bg-emerald-400' : 'bg-white/20'}`} style={{ borderColor: '#1e1f32' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-white/60 truncate">{peer.name}</span>
                        {peer.lockedPanelId && <Lock className="w-2.5 h-2.5 text-amber-400/60 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0 rounded ${roleMeta.bg} ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                        {cursorPanel ? (
                          <span className="text-[9px] text-white/20 truncate">
                            <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                            {cursorPanel.name}{cursorComp ? ` › ${cursorComp.label}` : ''}
                          </span>
                        ) : (
                          <span className="text-[9px] text-white/20">{isOnline ? '在线空闲' : '已离线'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-3 py-1.5 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[9px] text-white/20">Awareness Protocol · yjs v13.6</span>
              <span className="text-[9px] text-white/20">{crdtPeers.filter(p => Date.now() - p.lastSeen < 30000).length + 1} 活跃</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {subCanvasPanelId && (
        <>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-indigo-400/60" />
            <span className="text-[10px] text-indigo-400/40">子画布模式</span>
          </div>
          <div className="w-px h-3 bg-white/[0.06]" />
        </>
      )}

      <div className="flex items-center gap-1">
        <Magnet className={`w-3 h-3 ${snapEnabled ? 'text-cyan-400/50' : 'text-white/10'}`} />
        <span className={`text-[10px] ${snapEnabled ? 'text-cyan-400/30' : 'text-white/15'}`}>
          Snap {snapEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="w-px h-3 bg-white/[0.06]" />

      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-white/20" />
        <span className="text-[10px] text-white/25">Engine v2.4.1</span>
      </div>

      <div className="w-px h-3 bg-white/[0.06]" />

      <div className="flex items-center gap-1.5">
        <Cpu className="w-3 h-3 text-white/20" />
        <span className="text-[10px] text-white/25">React 18 + TS</span>
      </div>
    </footer>
  );
}

/* ================================================================
   LiquidGlassLayout — drop-in replacement for DesignerLayout
   ================================================================ */

import { ComponentPalette } from './ComponentPalette';
import { PanelCanvas } from './PanelCanvas';
import { Inspector } from './Inspector';
import { AIAssistant } from './AIAssistant';
import { CodePreview } from './CodePreview';
import { ModelSettings } from './ModelSettings';
import { SchemaExplorer } from './SchemaExplorer';
import { DeployPanel } from './DeployPanel';
import { BackendArchitecture } from './BackendArchitecture';
import { HostStorage } from './HostStorage';
import { FigmaGuide } from './FigmaGuide';
import { DeployManual } from './DeployManual';
import { QualityPanel } from './QualityPanel';
import { CRDTPanel } from './CRDTPanel';
import { ConflictResolver } from './ConflictResolver';

export function LiquidGlassLayout() {
  const { activeNavSection, secondaryNavOpen } = useDesigner();
  const showComponentPalette = activeNavSection === 'components' && secondaryNavOpen;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden text-white relative lg-theme">
      {/* Animated liquid background */}
      <LiquidBackground />

      {/* Content layer on top of background */}
      <div className="relative z-10 flex flex-col h-full">
        <GlassToolbar />
        <div className="flex flex-1 min-h-0">
          <GlassActivityBar />
          {showComponentPalette && <ComponentPalette />}
          <PanelCanvas />
          <CodePreview />
          <AIAssistant />
          <Inspector />
        </div>
        <GlassStatusBar />
      </div>

      {/* Modal overlays — same as classic */}
      <ModelSettings />
      <SchemaExplorer />
      <DeployPanel />
      <BackendArchitecture />
      <HostStorage />
      <FigmaGuide />
      <DeployManual />
      <QualityPanel />
      <CRDTPanel />
      <ConflictResolver />
    </div>
  );
}