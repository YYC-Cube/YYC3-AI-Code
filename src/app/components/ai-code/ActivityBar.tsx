/**
 * @file ActivityBar.tsx
 * @description VS Code 风格纤细垂直活动栏 — AI Code System 最左侧导航
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ui,activity-bar,navigation,ai-code
 */
import React, { useState } from 'react';
import {
  FolderOpen, Search, GitBranch, Puzzle, Bot, Bug, Play,
  Database, Settings, AppWindow, type LucideIcon
} from 'lucide-react';

export type ActivityView = 'files' | 'search' | 'git' | 'debug' | 'extensions' | 'ai' | 'database' | 'run' | 'multi-instance';

interface ActivityItem {
  id: ActivityView;
  icon: LucideIcon;
  tip: string;
  badge?: number;
  color?: string;
}

const ACTIVITIES: ActivityItem[] = [
  { id: 'files', icon: FolderOpen, tip: '资源管理器', color: 'text-amber-400/70' },
  { id: 'search', icon: Search, tip: '搜索', color: 'text-cyan-400/70' },
  { id: 'git', icon: GitBranch, tip: '源代码管理', badge: 3, color: 'text-blue-400/70' },
  { id: 'debug', icon: Bug, tip: '调试', color: 'text-orange-400/70' },
  { id: 'run', icon: Play, tip: '运行与调试', color: 'text-emerald-400/70' },
  { id: 'extensions', icon: Puzzle, tip: '扩展', color: 'text-violet-400/70' },
  { id: 'database', icon: Database, tip: '数据库', color: 'text-rose-400/70' },
  { id: 'ai', icon: Bot, tip: 'AI 助手', color: 'text-indigo-400/70' },
  { id: 'multi-instance', icon: AppWindow, tip: '多实例管理', color: 'text-[var(--yyc3-brand)]' },
];

export function ActivityBar({
  activeView,
  onViewChange,
}: {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
}) {
  return (
    <div className="w-11 flex flex-col items-center py-2 gap-0.5 bg-[#0a0b10] border-r border-white/[0.06] shrink-0">
      {ACTIVITIES.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <div key={item.id} className="relative group">
            <button
              onClick={() => onViewChange(item.id)}
              className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white/[0.08] text-white/90'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-indigo-400" />
              )}
              <Icon size={18} className={isActive ? (item.color || '') : ''} />
              {item.badge && item.badge > 0 && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 text-[8px] text-white flex items-center justify-center" style={{ fontWeight: 600 }}>
                  {item.badge}
                </div>
              )}
            </button>
            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded text-[10px]
              bg-black/95 text-white/90 whitespace-nowrap opacity-0 group-hover:opacity-100
              transition-opacity duration-200 pointer-events-none z-[100] border border-white/10">
              {item.tip}
            </div>
          </div>
        );
      })}
      <div className="flex-1" />
      <div className="relative group">
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all">
          <Settings size={17} />
        </button>
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded text-[10px]
          bg-black/95 text-white/90 whitespace-nowrap opacity-0 group-hover:opacity-100
          transition-opacity duration-200 pointer-events-none z-[100] border border-white/10">
          设置
        </div>
      </div>
    </div>
  );
}