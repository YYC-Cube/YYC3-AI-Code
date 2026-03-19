/**
 * @file LayoutPresets.tsx
 * @description 布局预设快捷切换器 — 预定义面板布局一键切换
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ui,layout,presets,panel,ai-code
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layout, Code2, Bug, Maximize2, Columns2, PanelLeft,
  Save, Check, ChevronDown
} from 'lucide-react';

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  config: {
    leftPanel: number;  // 0 = collapsed
    middlePanel: number;
    rightPanel: number; // 0 = collapsed
    terminalVisible: boolean;
    terminalSize: number; // percentage of vertical space
  };
}

export const DEFAULT_PRESETS: LayoutPreset[] = [
  {
    id: 'coding',
    name: '编码模式',
    description: '文件树 + 编辑器 + AI 助手',
    icon: Code2,
    color: 'text-cyan-400/70',
    config: { leftPanel: 22, middlePanel: 38, rightPanel: 40, terminalVisible: true, terminalSize: 25 },
  },
  {
    id: 'focus',
    name: '专注模式',
    description: '最大化编辑器，隐藏侧栏',
    icon: Maximize2,
    color: 'text-amber-400/70',
    config: { leftPanel: 0, middlePanel: 35, rightPanel: 65, terminalVisible: false, terminalSize: 0 },
  },
  {
    id: 'debug',
    name: '调试模式',
    description: '编辑器 + 终端 + AI 诊断',
    icon: Bug,
    color: 'text-orange-400/70',
    config: { leftPanel: 25, middlePanel: 30, rightPanel: 45, terminalVisible: true, terminalSize: 40 },
  },
  {
    id: 'review',
    name: '审查模式',
    description: '并排对比 + 文件树',
    icon: Columns2,
    color: 'text-violet-400/70',
    config: { leftPanel: 0, middlePanel: 40, rightPanel: 60, terminalVisible: false, terminalSize: 0 },
  },
  {
    id: 'explorer',
    name: '浏览模式',
    description: '宽文件树 + 预览',
    icon: PanelLeft,
    color: 'text-emerald-400/70',
    config: { leftPanel: 20, middlePanel: 50, rightPanel: 30, terminalVisible: false, terminalSize: 0 },
  },
];

export function LayoutPresetSwitcher({
  activePreset,
  onApplyPreset,
}: {
  activePreset: string;
  onApplyPreset: (preset: LayoutPreset) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = DEFAULT_PRESETS.find(p => p.id === activePreset) || DEFAULT_PRESETS[0];
  const CurrentIcon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-white/40 hover:bg-white/[0.06] hover:text-white/60 transition-all border border-white/[0.06]"
      >
        <Layout size={11} />
        <span>{current.name}</span>
        <ChevronDown size={9} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-full right-0 mt-1 w-[220px] bg-[#14151e] border border-white/[0.1] rounded-xl shadow-2xl z-[200] overflow-hidden"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <div className="px-3 py-2 border-b border-white/[0.06]">
              <p className="text-[10px] text-white/30">布局预设</p>
            </div>
            <div className="p-1.5 space-y-0.5">
              {DEFAULT_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isActive = preset.id === activePreset;
                return (
                  <button
                    key={preset.id}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      isActive ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/[0.04] border border-transparent'
                    }`}
                    onClick={() => { onApplyPreset(preset); setOpen(false); }}
                  >
                    <Icon size={14} className={preset.color} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] ${isActive ? 'text-indigo-300' : 'text-white/60'}`} style={{ fontWeight: 500 }}>{preset.name}</p>
                      <p className="text-[9px] text-white/25 truncate">{preset.description}</p>
                    </div>
                    {isActive && <Check size={11} className="text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-2 border-t border-white/[0.06]">
              <button className="flex items-center gap-1.5 text-[9px] text-white/25 hover:text-white/50 transition-colors">
                <Save size={9} />
                <span>保存当前布局为预设</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}