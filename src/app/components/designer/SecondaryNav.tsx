import React from 'react';
import {
  Layers, Database, Server, HardDrive, Rocket, BookOpen,
  Sparkles, Figma, TestTube, Radio, Settings,
  Sun, Moon, ChevronRight, Puzzle, Eye, Code,
  AlertTriangle, Users, Zap, Droplets
} from 'lucide-react';
import { useDesigner, type NavSection } from '../../store';
import { useThemeTokens } from './hooks/useThemeTokens';

/* ================================================================
   Section header titles
   ================================================================ */

const SECTION_TITLES: Record<NavSection, { label: string; icon: React.ElementType; description: string }> = {
  design:     { label: '设计画布',   icon: Layers,   description: '面板画布与实时预览' },
  components: { label: '组件面板',   icon: Puzzle,   description: '拖拽组件到画布' },
  data:       { label: '数据管理',   icon: Database, description: '数据库 · Schema · 绑定' },
  infra:      { label: '基础设施',   icon: Server,   description: '后端 · 存储 · 部署' },
  ai:         { label: 'AI 智能',    icon: Sparkles, description: 'AI 助手 · Figma 设计指南' },
  quality:    { label: '质量保障',   icon: TestTube,  description: '测试 · CI/CD · 文档' },
  collab:     { label: '实时协同',   icon: Radio,    description: 'CRDT · WebSocket · 冲突' },
  settings:   { label: '设置',       icon: Settings,  description: '模型 · 主题 · 认证' },
};

/* ================================================================
   Sub-items for each section
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

function getSubItems(section: NavSection): NavSubItem[] {
  switch (section) {
    case 'design':
      return [
        { id: 'canvas',  label: '画布编辑器', icon: Layers, description: '主设计画布', color: 'text-blue-400', action: (c) => c.setViewMode('design') },
        { id: 'preview', label: '实时预览',   icon: Eye,    description: '预览所有面板', color: 'text-emerald-400', action: (c) => c.setViewMode('preview') },
        { id: 'code',    label: '代码模式',   icon: Code,   description: '查看生成代码', color: 'text-amber-400', action: (c) => c.setViewMode('code') },
      ];
    case 'components':
      return []; // ComponentPalette handles its own content
    case 'data':
      return [
        { id: 'schema',  label: '数据库管理',   icon: Database,  description: 'Schema Explorer', color: 'text-cyan-400', action: (c) => c.toggleSchemaExplorer() },
      ];
    case 'infra':
      return [
        { id: 'backend', label: '后端架构',     icon: Server,    description: '§4.2 五标签页', color: 'text-amber-400', action: (c) => c.toggleBackendArch() },
        { id: 'storage', label: '宿主机存储',   icon: HardDrive, description: '§5 六标签页',   color: 'text-blue-400',  action: (c) => c.toggleHostStorage() },
        { id: 'deploy',  label: '配置即部署',   icon: Rocket,    description: '§3.3 五步部署', color: 'text-emerald-400', action: (c) => c.toggleDeployPanel() },
        { id: 'manual',  label: '部署手册',     icon: BookOpen,  description: '§7 三标签页',   color: 'text-amber-400', action: (c) => c.toggleDeployManual() },
      ];
    case 'ai':
      return [
        { id: 'assist',  label: 'AI 助手',       icon: Sparkles, description: '属性建议 / 代码片段', color: 'text-purple-400', action: (c) => c.toggleAI() },
        { id: 'figma',   label: 'Figma 设计指南', icon: Figma,    description: '§6 五标签页',          color: 'text-purple-400', action: (c) => c.toggleFigmaGuide() },
        { id: 'codegen', label: '代码生成引擎',   icon: Code,     description: '代码预览五标签页',      color: 'text-indigo-400', action: (c) => c.toggleCodePreview() },
      ];
    case 'quality':
      return [
        { id: 'quality', label: '质量面板', icon: TestTube, description: '§8 五标签页', color: 'text-emerald-400', action: (c) => c.toggleQualityPanel() },
      ];
    case 'collab':
      return [
        { id: 'crdt',      label: 'CRDT 协同',   icon: Radio,          description: '四标签页',         color: 'text-cyan-400', action: (c) => c.toggleCRDTPanel() },
        { id: 'conflicts', label: '冲突解析器',   icon: AlertTriangle,  description: '查看/解决冲突',    color: 'text-red-400', action: (c) => c.toggleConflictResolver(),
          badge: (ctx) => {
            const n = ctx.conflicts?.filter((cc: any) => !cc.resolved).length;
            return n > 0 ? String(n) : null;
          },
        },
        { id: 'simulate',  label: '模拟冲突',     icon: Zap,            description: '生成测试冲突数据', color: 'text-amber-400', action: (c) => c.simulateConflict() },
      ];
    case 'settings':
      return [
        { id: 'models', label: '模型管理',      icon: Settings,  description: 'AI 模型配置',     color: 'text-white/50',   action: (c) => c.openModelSettings() },
        { id: 'theme',  label: '主题切换',      icon: Sun,       description: '暗色/亮色',       color: 'text-amber-400',  action: (c) => c.toggleTheme() },
        { id: 'glass',  label: '液态玻璃主题',  icon: Droplets,  description: '切换视觉风格',    color: 'text-purple-400', action: (c) => c.setUITheme(c.uiTheme === 'liquid-glass' ? 'classic' : 'liquid-glass') },
      ];
    default:
      return [];
  }
}

/* ================================================================
   SecondaryNav Component
   ================================================================ */

export function SecondaryNav() {
  const ctx = useDesigner();
  const { activeNavSection, secondaryNavOpen, activeNavSubItem, setActiveNavSubItem } = ctx;
  const t = useThemeTokens();

  if (!secondaryNavOpen) return null;

  // For 'components' section, we let ComponentPalette render directly
  if (activeNavSection === 'components') return null;

  const sectionMeta = SECTION_TITLES[activeNavSection];
  const subItems = getSubItems(activeNavSection);

  return (
    <div
      className={`w-[220px] border-r ${t.panelBorder} ${t.panelBg} flex flex-col shrink-0 select-none ${t.scrollClass}`}
      style={{ boxShadow: t.panelShadow }}
    >
      {/* Section header */}
      <div className={`px-3 py-3 border-b ${t.sectionBorder}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-6 h-6 rounded-lg ${t.inputBg} flex items-center justify-center`}>
            <sectionMeta.icon className={`w-3.5 h-3.5 ${t.textTertiary}`} />
          </div>
          <span className={`text-[12px] ${t.textPrimary} tracking-wide`}>{sectionMeta.label}</span>
        </div>
        <p className={`text-[10px] ${t.textMuted} ml-8`}>{sectionMeta.description}</p>
      </div>

      {/* Sub items */}
      <div className="flex-1 overflow-y-auto py-2 px-1.5">
        {subItems.length === 0 ? (
          <div className="p-6 text-center">
            <sectionMeta.icon className={`w-10 h-10 ${t.textMuted} mx-auto mb-3`} />
            <p className={`text-[11px] ${t.textMuted}`}>该模块内容在主画布中展示</p>
            <p className={`text-[9px] ${t.textMuted} mt-1`}>点击左侧图标切换视图</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {subItems.map((item) => {
              const isActive = activeNavSubItem === item.id;
              const badgeText = item.badge?.(ctx);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNavSubItem(isActive ? null : item.id);
                    item.action(ctx);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg transition-all group text-left ${
                    isActive
                      ? `${t.activeBg} ring-1 ring-inset ring-white/[0.06]`
                      : `${t.hoverBg}`
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? `${t.activeBg}` : `${t.inputBg} ${t.textMuted} group-hover:text-white/40`
                  }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${isActive ? item.color : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[11px] transition-colors ${
                      isActive ? t.textPrimary : `${t.textSecondary} group-hover:text-white/70`
                    }`}>
                      {item.label}
                    </div>
                    <div className={`text-[9px] ${t.textMuted} truncate`}>{item.description}</div>
                  </div>
                  {badgeText && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{badgeText}</span>
                  )}
                  <ChevronRight className={`w-3 h-3 transition-all ${
                    isActive ? `${t.textTertiary} rotate-90` : `${t.textMuted} group-hover:text-white/20`
                  }`} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section footer with context info */}
      <SectionFooter section={activeNavSection} />
    </div>
  );
}

/* ================================================================
   Section Footer — contextual info per section
   ================================================================ */

function SectionFooter({ section }: { section: NavSection }) {
  const { panels, components, crdtPeers, crdtDocVersion, syncStatus, theme, aiModels } = useDesigner();
  const t = useThemeTokens();

  const footerContent = () => {
    switch (section) {
      case 'design':
        return <span>{panels.length} 面板 · {components.length} 组件</span>;
      case 'data':
        return <span>SQLite / MySQL · Prisma ORM</span>;
      case 'infra':
        return <span>Docker Compose · 一主二备</span>;
      case 'collab':
        return (
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-400' : syncStatus === 'conflict' ? 'bg-red-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
            {crdtPeers.length + 1} 在线 · v{crdtDocVersion}
          </span>
        );
      case 'settings':
        return <span>{theme === 'dark' ? '暗色主题' : '亮色主题'} · {aiModels.filter(m => m.isActive).length} 模型</span>;
      default:
        return null;
    }
  };

  const content = footerContent();
  if (!content) return null;

  return (
    <div className={`px-3 py-2 border-t ${t.sectionBorder} text-[9px] ${t.textMuted}`}>
      {content}
    </div>
  );
}