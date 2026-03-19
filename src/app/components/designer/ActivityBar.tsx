import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layers, Puzzle, Database, Server, Sparkles, TestTube,
  Radio, Settings, ChevronLeft, ChevronRight, Eye, Code,
  HardDrive, Rocket, BookOpen, Figma, AlertTriangle,
  Users, Zap, Sun, Droplets, X, Search, Clock, Trash2
} from 'lucide-react';
import { useDesigner, type NavSection } from '../../store';
import { Tooltip } from './Tooltip';
import { motion, AnimatePresence } from 'motion/react';
import { useActivityBarNav } from './hooks/useFlyoutMenu';
import { useThemeTokens } from './hooks/useThemeTokens';
import { SharedFlyoutMenu, type FlyoutStyleConfig } from './hooks/FlyoutMenuRenderer';
import { PluginStoreDialog, usePluginRegistry } from './PluginManager';

/* ================================================================
   Nav item definition
   ================================================================ */

interface NavSubItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  action: (ctx: any) => void;
  badge?: (ctx: any) => string | null;
}

interface NavItem {
  section: NavSection;
  icon: React.ElementType;
  label: string;
  color: string;
  activeColor: string;
  getSubItems: () => NavSubItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    section: 'design',
    icon: Layers,
    label: '设计画布',
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/10 border-blue-500/30',
    getSubItems: () => [
      { id: 'canvas',  label: '画布编辑器', icon: Layers, description: '主设计画布', color: 'text-blue-400', action: (c: any) => c.setViewMode('design') },
      { id: 'preview', label: '实时预览',   icon: Eye,    description: '预览所有面板', color: 'text-emerald-400', action: (c: any) => c.setViewMode('preview') },
      { id: 'code',    label: '代码模式',   icon: Code,   description: '查看生成代码', color: 'text-amber-400', action: (c: any) => c.setViewMode('code') },
    ],
  },
  {
    section: 'components',
    icon: Puzzle,
    label: '组件面板',
    color: 'text-indigo-400',
    activeColor: 'bg-indigo-500/10 border-indigo-500/30',
    getSubItems: () => [], // ComponentPalette is its own flyout
  },
  {
    section: 'data',
    icon: Database,
    label: '数据管理',
    color: 'text-cyan-400',
    activeColor: 'bg-cyan-500/10 border-cyan-500/30',
    getSubItems: () => [
      { id: 'schema', label: '数据库管理', icon: Database, description: 'Schema Explorer', color: 'text-cyan-400', action: (c: any) => c.toggleSchemaExplorer() },
    ],
  },
  {
    section: 'infra',
    icon: Server,
    label: '基础设施',
    color: 'text-amber-400',
    activeColor: 'bg-amber-500/10 border-amber-500/30',
    getSubItems: () => [
      { id: 'backend', label: '后端架构',   icon: Server,    description: '§4.2 五标签页', color: 'text-amber-400', action: (c: any) => c.toggleBackendArch() },
      { id: 'storage', label: '宿主机存储', icon: HardDrive, description: '§5 六标签页',   color: 'text-blue-400',  action: (c: any) => c.toggleHostStorage() },
      { id: 'deploy',  label: '配置即部署', icon: Rocket,    description: '§3.3 五步部署', color: 'text-emerald-400', action: (c: any) => c.toggleDeployPanel() },
      { id: 'manual',  label: '部署手册',   icon: BookOpen,  description: '§7 三标签页',   color: 'text-amber-400', action: (c: any) => c.toggleDeployManual() },
    ],
  },
  {
    section: 'ai',
    icon: Sparkles,
    label: 'AI 智能助手',
    color: 'text-purple-400',
    activeColor: 'bg-purple-500/10 border-purple-500/30',
    getSubItems: () => [
      { id: 'assist', label: 'AI 助手',       icon: Sparkles, description: '属性建议 / 代码片段', color: 'text-purple-400', action: (c: any) => c.toggleAI() },
      { id: 'figma',  label: 'Figma 设计指南', icon: Figma,    description: '§6 五标签页',          color: 'text-purple-400', action: (c: any) => c.toggleFigmaGuide() },
      { id: 'codegen',label: '代码生成引擎',   icon: Code,     description: '代码预览五标签页',      color: 'text-indigo-400', action: (c: any) => c.toggleCodePreview() },
    ],
  },
  {
    section: 'quality',
    icon: TestTube,
    label: '质量保障',
    color: 'text-emerald-400',
    activeColor: 'bg-emerald-500/10 border-emerald-500/30',
    getSubItems: () => [
      { id: 'quality', label: '质量面板', icon: TestTube, description: '§8 五标签页', color: 'text-emerald-400', action: (c: any) => c.toggleQualityPanel() },
    ],
  },
  {
    section: 'collab',
    icon: Radio,
    label: 'CRDT 协同',
    color: 'text-cyan-400',
    activeColor: 'bg-cyan-500/10 border-cyan-500/30',
    getSubItems: () => [
      { id: 'crdt',      label: 'CRDT 协同',   icon: Radio,          description: '四标签页',         color: 'text-cyan-400', action: (c: any) => c.toggleCRDTPanel() },
      { id: 'conflicts', label: '冲突解析器',   icon: AlertTriangle,  description: '查看/解决冲突',    color: 'text-red-400', action: (c: any) => c.toggleConflictResolver(),
        badge: (ctx: any) => {
          const n = ctx.conflicts?.filter((cc: any) => !cc.resolved).length;
          return n > 0 ? String(n) : null;
        },
      },
      { id: 'simulate',  label: '模拟冲突',     icon: Zap,            description: '生成测试冲突数据', color: 'text-amber-400', action: (c: any) => c.simulateConflict() },
    ],
  },
  {
    section: 'settings',
    icon: Settings,
    label: '设置',
    color: 'text-white/50',
    activeColor: 'bg-white/[0.06] border-white/[0.12]',
    getSubItems: () => [
      { id: 'models', label: '模型管理',      icon: Settings,  description: 'AI 模型配置',     color: 'text-white/50',   action: (c: any) => c.openModelSettings() },
      { id: 'theme',  label: '主题切换',      icon: Sun,       description: '暗色/亮色',       color: 'text-amber-400',  action: (c: any) => c.toggleTheme() },
      { id: 'glass',  label: '液态玻璃主题',  icon: Droplets,  description: '切换视觉风格',    color: 'text-purple-400', action: (c: any) => c.setUITheme('liquid-glass') },
      { id: 'aurora', label: '极光主题',      icon: Zap,       description: '自然渐变光影',    color: 'text-emerald-400', action: (c: any) => c.setUITheme('aurora') },
    ],
  },
];

/* ================================================================
   Flyout sub-menu component (now uses SharedFlyoutMenu)
   ================================================================ */

function FlyoutMenu({
  items,
  navItem,
  ctx,
  onClose,
  anchorRect,
}: {
  items: NavSubItem[];
  navItem: NavItem;
  ctx: any;
  onClose: () => void;
  anchorRect: DOMRect | null;
}) {
  const t = useThemeTokens();

  const styleConfig: FlyoutStyleConfig = {
    containerClass: `${t.ctxBg} border ${t.ctxBorder}`,
    containerMinHeight: 200,
    containerShadow: t.ctxShadow,
    headerBorder: `1px solid var(--section-border-color, rgba(255,255,255,0.06))`,
    headerIconClass: `w-5 h-5 rounded-md ${t.inputBg} flex items-center justify-center`,
    headerIconColor: navItem.color,
    headerLabelClass: `text-[11px] ${t.textSecondary} tracking-wide`,
    searchWrapperClass: `flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${t.inputBg} border ${t.inputBorder} ${t.inputFocusBorder} transition-colors`,
    searchIconClass: t.textMuted,
    searchInputClass: `bg-transparent text-[11px] ${t.inputText} placeholder:${t.textMuted} outline-none w-full`,
    searchClearClass: `${t.textMuted} hover:text-white/50`,
    historyContainerClass: `mt-1 py-1 rounded-lg ${t.inputBg} border ${t.inputBorder}`,
    historyLabelClass: `text-[9px] ${t.textMuted}`,
    historyClearBtnClass: `text-[9px] ${t.textMuted} hover:text-white/40 transition-colors`,
    historyItemClass: `flex items-center gap-1.5 px-2 py-1 ${t.hoverBg} rounded cursor-pointer group`,
    historyIconClass: t.textMuted,
    historyTextClass: `text-[10px] ${t.textTertiary} group-hover:text-white/60 flex-1 truncate`,
    historyDeleteClass: `${t.textMuted} hover:text-white/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`,
    itemBtnClass: `${t.hoverBg} focus:${t.activeBg} focus:outline-none`,
    itemFocusRing: `focus:ring-1 focus:ring-${t.accent.replace('text-', '')}/40`,
    itemIconWrapperClass: `${t.inputBg} group-hover:bg-white/[0.08] transition-colors`,
    itemIconClass: 'opacity-70 group-hover:opacity-100 transition-opacity',
    itemLabelClass: `text-[11px] ${t.textSecondary} group-hover:text-white/80 transition-colors`,
    itemDescClass: `text-[9px] ${t.textMuted} truncate`,
    emptyClass: `text-[10px] ${t.textMuted} text-center py-3`,
    arrowClass: `${t.ctxBg} border-l border-b ${t.ctxBorder}`,
    leftOffset: 56,
    renderBadge: (item: any, ctx: any) => {
      if (item.id === 'conflicts') {
        const n = ctx.conflicts?.filter((cc: any) => !cc.resolved).length;
        if (n > 0) {
          return (
            <span className="relative flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {n} 冲突
            </span>
          );
        }
      }
      return null;
    },
  };

  return (
    <SharedFlyoutMenu
      items={items}
      navItem={{ icon: navItem.icon, label: navItem.label, color: navItem.color }}
      ctx={ctx}
      onClose={onClose}
      anchorRect={anchorRect}
      style={styleConfig}
    />
  );
}

/* ================================================================
   ActivityBar component
   ================================================================ */

export function ActivityBar() {
  const ctx = useDesigner();
  const t = useThemeTokens();
  const {
    activeNavSection, setActiveNavSection, secondaryNavOpen, toggleSecondaryNav,
    syncStatus, conflicts, crdtPeers,
  } = ctx;

  const { openFlyout, anchorRect, handleNavClick, closeFlyout, setButtonRef } = useActivityBarNav<NavItem>({
    ctx,
    setActiveNavSection,
  });

  const unresolvedConflicts = conflicts.filter(c => !c.resolved).length;
  const [pluginStoreOpen, setPluginStoreOpen] = useState(false);
  const { installed } = usePluginRegistry();

  const mainItems = NAV_ITEMS.filter(n => n.section !== 'settings');
  const settingsItem = NAV_ITEMS.find(n => n.section === 'settings')!;

  return (
    <>
      <nav
        className={`w-[48px] border-r ${t.panelBorder} ${t.panelBg} flex flex-col items-center py-2 gap-0.5 shrink-0 select-none z-40`}
        style={{ boxShadow: t.panelShadow }}
      >
        {/* Top nav items */}
        <div className="flex flex-col items-center gap-1 flex-1">
          {mainItems.map((navItem) => {
            const { section, icon: Icon, label, color, activeColor } = navItem;
            const isActive = activeNavSection === section;
            const hasFlyout = openFlyout === section;

            return (
              <Tooltip key={section} label={label} side="bottom">
                <button
                  ref={setButtonRef(section)}
                  onClick={() => handleNavClick(section, navItem)}
                  className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${
                    isActive
                      ? `${activeColor} ${color}`
                      : `border-transparent ${t.textMuted} hover:text-white/50 hover:border-white/[0.08] ${t.hoverBg}`
                  } ${hasFlyout ? 'ring-1 ring-white/[0.1]' : ''}`}
                >
                  <Icon className="w-[16px] h-[16px]" />
                  {/* Active dot indicator */}
                  {isActive && !hasFlyout && (
                    <div className={`absolute -left-[5px] top-1/2 -translate-y-1/2 w-[3px] h-3 rounded-r-full ${t.btnPrimary}`} />
                  )}
                  {/* Badge for collab */}
                  {section === 'collab' && (crdtPeers.length > 0 || unresolvedConflicts > 0) && (
                    <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] text-white ${
                      unresolvedConflicts > 0 ? t.statusConflictDot.replace(' animate-pulse', '') : t.statusSyncedDot.replace(' animate-pulse', '')
                    }`}>
                      {unresolvedConflicts > 0 ? unresolvedConflicts : crdtPeers.length + 1}
                    </div>
                  )}
                  {/* Badge for sync conflicts */}
                  {section === 'data' && syncStatus === 'conflict' && (
                    <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${t.statusConflictDot}`} />
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* Separator */}
        <div className={`w-5 h-px ${t.separator} my-1`} />

        {/* Collapse toggle for ComponentPalette */}
        <Tooltip label={secondaryNavOpen ? '收起组件' : '展开组件'} side="bottom">
          <button
            onClick={toggleSecondaryNav}
            className={`w-9 h-7 rounded-lg flex items-center justify-center ${t.textMuted} hover:text-white/40 ${t.hoverBg} transition-all border border-transparent hover:border-white/[0.06]`}
          >
            {secondaryNavOpen ? (
              <ChevronLeft className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </Tooltip>

        {/* Plugin Store */}
        <Tooltip label={`插件市场 (${installed.length} 已安装)`} side="bottom">
          <button
            onClick={() => setPluginStoreOpen(true)}
            className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all border border-transparent ${t.textMuted} hover:text-violet-400/70 hover:border-violet-500/20 ${t.hoverBg}`}
          >
            <Puzzle className="w-[16px] h-[16px]" />
            {installed.length > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-violet-500/80 flex items-center justify-center text-[7px] text-white">
                {installed.length}
              </div>
            )}
          </button>
        </Tooltip>

        {/* Settings — bottom-pinned */}
        <Tooltip label={settingsItem.label} side="bottom">
          <button
            ref={setButtonRef(settingsItem.section)}
            onClick={() => handleNavClick(settingsItem.section, settingsItem)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${
              activeNavSection === 'settings'
                ? `${settingsItem.activeColor} ${settingsItem.color}`
                : `border-transparent ${t.textMuted} hover:text-white/40 hover:border-white/[0.08] ${t.hoverBg}`
            } ${openFlyout === 'settings' ? 'ring-1 ring-white/[0.1]' : ''}`}
          >
            <Settings className="w-[16px] h-[16px]" />
          </button>
        </Tooltip>
      </nav>

      {/* Flyout menus rendered as portals */}
      <AnimatePresence>
        {openFlyout && (() => {
          const navItem = NAV_ITEMS.find(n => n.section === openFlyout);
          if (!navItem) return null;
          const subItems = navItem.getSubItems();
          if (subItems.length === 0) return null;
          return (
            <FlyoutMenu
              key={openFlyout}
              items={subItems}
              navItem={navItem}
              ctx={ctx}
              onClose={closeFlyout}
              anchorRect={anchorRect}
            />
          );
        })()}
      </AnimatePresence>

      {/* Plugin Store Dialog */}
      <AnimatePresence>
        {pluginStoreOpen && <PluginStoreDialog onClose={() => setPluginStoreOpen(false)} />}
      </AnimatePresence>
    </>
  );
}