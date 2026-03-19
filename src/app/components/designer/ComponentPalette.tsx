/**
 * @file ComponentPalette.tsx
 * @description YYC3 Designer 组件面板 — 可拖拽组件库，支持分类筛选、搜索、AI 推荐
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags designer,component-palette,drag-drop,library,ai-recommendation
 */

import React, { useState } from 'react';
import {
  RectangleHorizontal, Type, ImageIcon, Square, Minus, Circle,
  TextCursorInput, ChevronDown, CheckSquare, ToggleLeft, Calendar, AlignLeft,
  Table, ChartBar, List, TrendingUp, Loader,
  User, Play, Smile,
  MapPin, GitBranch, FileText, Code,
  Search, ChevronRight, GripVertical, Sparkles, Lock, ShieldAlert
} from 'lucide-react';
import { useDrag } from 'react-dnd';
import { COMPONENT_LIBRARY, type ComponentDef, useDesigner } from '../../store';
import { Tooltip } from './Tooltip';
import { useThemeTokens } from './hooks/useThemeTokens';

const iconMap: Record<string, React.ElementType> = {
  RectangleHorizontal, Type, Image: ImageIcon, Square, Minus, Circle,
  TextCursorInput, ChevronDown, CheckSquare, ToggleLeft, Calendar, AlignLeft,
  Table, ChartBar, List, TrendingUp, Loader,
  User, Play, Smile,
  MapPin, GitBranch, FileText, Code,
};

const categoryLabels: Record<string, string> = {
  basic: '基础组件',
  form: '表单组件',
  data: '数据展示',
  media: '媒体组件',
  advanced: '高级插件',
};

const categoryDescriptions: Record<string, string> = {
  basic: '按钮、文本、卡片等基础 UI 元素',
  form: '输入框、选择器、开关等表单控件',
  data: '表格、图表、统计卡等数据展示',
  media: '头像、视频、图标等媒体元素',
  advanced: '地图、工作流、Markdown 等高级功能',
};

function DraggableComponent({ comp, disabled }: { comp: ComponentDef; disabled?: boolean }) {
  const t = useThemeTokens();
  const [{ isDragging }, dragRef] = useDrag({
    type: 'COMPONENT',
    item: { componentDef: comp },
    canDrag: () => !disabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const IconComp = iconMap[comp.icon] || Square;

  if (disabled) {
    return (
      <Tooltip label="当前角色无拖拽权限" side="top">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-not-allowed opacity-35 transition-all">
          <div className={`w-7 h-7 rounded-md ${t.inputBg} flex items-center justify-center relative`}>
            <IconComp className={`w-3.5 h-3.5 ${t.textMuted}`} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Lock className="w-1.5 h-1.5 text-amber-400/60" />
            </div>
          </div>
          <span className={`text-[12px] ${t.textMuted} flex-1 line-through decoration-white/10`}>{comp.label}</span>
          <Lock className={`w-3 h-3 ${t.textMuted}`} />
        </div>
      </Tooltip>
    );
  }

  return (
    <div
      ref={dragRef as any}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing group transition-all ${
        isDragging ? 'opacity-40 scale-95' : t.hoverBg
      }`}
    >
      <div className={`w-7 h-7 rounded-md ${t.inputBg} flex items-center justify-center group-hover:bg-white/[0.08] transition-colors`}>
        <IconComp className={`w-3.5 h-3.5 ${t.textTertiary} group-hover:${t.textSecondary}`} />
      </div>
      <span className={`text-[12px] ${t.textSecondary} group-hover:text-white/80 transition-colors flex-1`}>{comp.label}</span>
      <GripVertical className={`w-3 h-3 ${t.textMuted} group-hover:${t.textTertiary} transition-colors`} />
    </div>
  );
}

export function ComponentPalette() {
  const t = useThemeTokens();
  const { currentUserIdentity } = useDesigner();
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    basic: true, form: true, data: true, media: false, advanced: false,
  });

  const userRole = currentUserIdentity?.role || 'editor';
  const isReadOnly = userRole === 'viewer' || userRole === 'guest';

  const filtered = COMPONENT_LIBRARY.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = Object.entries(categoryLabels).map(([key, label]) => ({
    key,
    label,
    items: filtered.filter(c => c.category === key),
  })).filter(g => g.items.length > 0);

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`w-[220px] border-r ${t.panelBorder} ${t.panelBg} flex flex-col shrink-0 select-none ${t.scrollClass}`}
      style={{ boxShadow: t.panelShadow }}
    >
      {/* Header */}
      <div className={`p-3 border-b ${t.sectionBorder}`}>
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`text-[12px] ${t.textSecondary} tracking-wide uppercase`}>组件面板</span>
          <Tooltip label={`共 ${COMPONENT_LIBRARY.length} 个可用组件`} side="bottom">
            <span className={`ml-auto text-[10px] ${t.badgeText} ${t.badgeBg} px-1.5 py-0.5 rounded cursor-default`}>{COMPONENT_LIBRARY.length}</span>
          </Tooltip>
        </div>
        <div className="relative">
          <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${t.textMuted}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索组件..."
            className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-lg pl-8 pr-3 py-1.5 text-[12px] ${t.inputText} placeholder:text-white/20 focus:outline-none ${t.inputFocusBorder} transition-all`}
          />
        </div>
      </div>

      {/* RBAC read-only banner */}
      {isReadOnly && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/[0.06] border-b border-amber-500/10 shrink-0">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-amber-400/60">
              {userRole === 'viewer' ? '观察者' : '访客'}模式 — 拖拽已禁用
            </div>
            <div className="text-[9px] text-white/15 mt-0.5">升级角色以解锁组件操作</div>
          </div>
          <Lock className="w-3 h-3 text-amber-400/30 shrink-0" />
        </div>
      )}

      {/* AI suggestion */}
      <div className={`mx-3 mt-3 mb-1 p-2.5 rounded-lg ${t.suggestionBg} border ${t.suggestionBorder}`}>
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className={`w-3 h-3 ${t.suggestionAccent}`} />
          <span className={`text-[11px] ${t.suggestionAccent}`}>AI 推荐</span>
        </div>
        <p className={`text-[11px] ${t.textTertiary} leading-relaxed`}>
          基于当前面板，建议添加 <span className={t.suggestionAccent}>Stat 统计卡</span> 和 <span className={t.suggestionAccent}>Chart 图表</span>
        </p>
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {grouped.map(({ key, label, items }) => (
          <div key={key} className="mb-0.5">
            <Tooltip label={categoryDescriptions[key] || label} side="bottom">
              <button
                onClick={() => toggleCategory(key)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] ${t.hoverBg} transition-colors`}
              >
                <ChevronRight className={`w-3 h-3 ${t.textMuted} transition-transform ${expandedCategories[key] ? 'rotate-90' : ''}`} />
                <span className={`${t.categoryColors[key] || t.accent} uppercase tracking-wider`}>{label}</span>
                <span className={`ml-auto text-[10px] ${t.textMuted}`}>{items.length}</span>
              </button>
            </Tooltip>
            {expandedCategories[key] && (
              <div className="px-1.5 pb-1">
                {items.map(comp => (
                  <DraggableComponent key={comp.type} comp={comp} disabled={isReadOnly} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Templates shortcut */}
      <div className={`p-3 border-t ${t.sectionBorder}`}>
        <Tooltip label="浏览社区和官方提供的页面模板" side="top">
          <button className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${t.inputBg} ${t.hoverBg} ${t.textTertiary} hover:text-white/60 transition-all text-[12px]`}>
            <FileText className="w-3.5 h-3.5" />
            浏览模板市场
          </button>
        </Tooltip>
      </div>
    </div>
  );
}