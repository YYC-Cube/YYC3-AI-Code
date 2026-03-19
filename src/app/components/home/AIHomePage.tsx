/**
 * @file AIHomePage.tsx
 * @description YYC3 AI 首页 — 项目概览、快速开始、功能介绍、AI 助手入口
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags home,landing-page,overview,quick-start,ai
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import yyc3Logo from '/yyc3-logo-blue.png';
import { useGlobalAI } from '../../aiModelContext';
import {
  Bot, Send, Plus, Image as ImageIcon, FileUp, Github, Figma,
  Code2, Clipboard, Clock, MoreHorizontal, Layers,
  Zap, Settings, FolderOpen, BrainCircuit, LayoutDashboard,
  Monitor, Cpu, Globe, ChevronRight, Star, Users, Activity,
  Trash2, Pencil, Copy, X, Database, Check
} from 'lucide-react';

/* ================================================================
   Tooltip wrapper
   ================================================================ */
function IconTip({ icon: Icon, tip, size = 18, className = '', onClick }: {
  icon: React.ElementType; tip: string; size?: number; className?: string; onClick?: () => void;
}) {
  return (
    <div className="relative group inline-flex">
      <button
        onClick={onClick}
        className={`p-1.5 rounded-lg transition-all duration-200 hover:bg-white/10 hover:scale-110 ${className}`}
      >
        <Icon size={size} />
      </button>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] bg-black/90 text-white/90 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/10">
        {tip}
      </div>
    </div>
  );
}

/* ================================================================
   Smart Routing — Intent Analysis Engine
   ================================================================ */
interface IntentResult {
  target: 'designer' | 'ai-code';
  confidence: number;
  category: string;
  keywords: string[];
  reasoning: string;
}

const INTENT_RULES: {
  keywords: string[];
  target: 'designer' | 'ai-code';
  category: string;
  weight: number;
}[] = [
  // AI Code System triggers
  { keywords: ['编程', '代码', 'code', 'coding', '开发', 'develop'], target: 'ai-code', category: '编程开发', weight: 3 },
  { keywords: ['debug', '调试', 'bug', '修复', 'fix', '报错'], target: 'ai-code', category: '调试修复', weight: 3 },
  { keywords: ['api', '接口', 'rest', 'graphql', 'endpoint'], target: 'ai-code', category: 'API 开发', weight: 3 },
  { keywords: ['function', '函数', '方法', 'method', 'class', '类'], target: 'ai-code', category: '代码结构', weight: 2 },
  { keywords: ['typescript', 'javascript', 'react', 'vue', 'python', 'java', 'rust', 'go'], target: 'ai-code', category: '编程语言', weight: 3 },
  { keywords: ['npm', 'package', '依赖', 'install', '安装', 'import'], target: 'ai-code', category: '包管理', weight: 2 },
  { keywords: ['git', '版本', 'commit', 'branch', '分支', 'merge'], target: 'ai-code', category: '版本控制', weight: 2 },
  { keywords: ['test', '测试', 'jest', 'playwright', '单元', 'e2e'], target: 'ai-code', category: '测试', weight: 2 },
  { keywords: ['重构', 'refactor', '优化', 'optimize', '性能', 'performance'], target: 'ai-code', category: '代码优化', weight: 2 },
  { keywords: ['算法', 'algorithm', '数据结构', '排序', '搜索', '递归'], target: 'ai-code', category: '算法', weight: 3 },
  { keywords: ['docker', '部署', 'deploy', '容器', 'ci/cd', 'pipeline'], target: 'ai-code', category: 'DevOps', weight: 2 },
  { keywords: ['数据库', 'database', 'sql', 'prisma', 'mysql', 'sqlite', 'mongodb'], target: 'ai-code', category: '数据库', weight: 2 },

  // Designer triggers
  { keywords: ['设计', 'design', '界面', 'ui', 'ux', '交互'], target: 'designer', category: '界面设计', weight: 3 },
  { keywords: ['布局', 'layout', '排版', '栅格', 'grid', '面板', 'panel'], target: 'designer', category: '布局设计', weight: 3 },
  { keywords: ['组件', 'component', '控件', 'widget', '按钮', 'button'], target: 'designer', category: '组件搭建', weight: 2 },
  { keywords: ['表单', 'form', '输入', 'input', '选择', 'select'], target: 'designer', category: '表单设计', weight: 2 },
  { keywords: ['表格', 'table', '数据表', '列表', 'list'], target: 'designer', category: '数据展示', weight: 2 },
  { keywords: ['图表', 'chart', '仪表盘', 'dashboard', '可视化', 'visualization'], target: 'designer', category: '数据可视化', weight: 2 },
  { keywords: ['拖拽', 'drag', '拖放', 'drop', '移动', 'resize'], target: 'designer', category: '交互设计', weight: 2 },
  { keywords: ['主题', 'theme', '颜色', 'color', '样式', 'style', '暗色', 'dark'], target: 'designer', category: '视觉风格', weight: 2 },
  { keywords: ['页面', 'page', '网站', 'website', '应用', 'app', '工具'], target: 'designer', category: '产品设计', weight: 1 },
  { keywords: ['原型', 'prototype', '线框', 'wireframe', '草图', 'sketch'], target: 'designer', category: '原型设计', weight: 3 },
  { keywords: ['登录', 'login', '注册', 'register', '表单', '管理后台', 'admin'], target: 'designer', category: '业务页面', weight: 1 },
  { keywords: ['创建', 'create', '做一个', '帮我做', '生成', 'generate', '制作'], target: 'designer', category: '创建项目', weight: 0.5 },
];

function analyzeIntent(text: string): IntentResult {
  const lower = text.toLowerCase();
  let designerScore = 0;
  let aiCodeScore = 0;
  const matchedKeywords: string[] = [];
  let bestCategory = '通用';
  let bestWeight = 0;

  for (const rule of INTENT_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        if (rule.target === 'designer') designerScore += rule.weight;
        else aiCodeScore += rule.weight;
        matchedKeywords.push(kw);
        if (rule.weight > bestWeight) {
          bestWeight = rule.weight;
          bestCategory = rule.category;
        }
      }
    }
  }

  const total = designerScore + aiCodeScore || 1;
  const target = aiCodeScore > designerScore ? 'ai-code' : 'designer';
  const winScore = Math.max(designerScore, aiCodeScore);
  const confidence = Math.min(0.99, 0.5 + (winScore / total) * 0.4 + Math.min(matchedKeywords.length * 0.05, 0.2));

  const reasoning = target === 'ai-code'
    ? '检测到编程/开发相关意图，推荐进入智能编程工作台'
    : '检测到设计/布局相关意图，推荐进入多联式布局设计器';

  return { target, confidence, category: bestCategory, keywords: matchedKeywords.slice(0, 5), reasoning };
}

/* ================================================================
   Mock project data
   ================================================================ */
interface ProjectItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  updated: string;
  status: 'active' | 'new' | 'idle';
  stats: { panels: number; components: number; files?: number };
  route: 'designer' | 'ai-code';
}

const INITIAL_PROJECTS: ProjectItem[] = [
  { id: 'proj-1', name: 'YANYUCLOUD Designer', desc: '多联式低码设计器', icon: LayoutDashboard, color: '#667eea', updated: '2 分钟前', status: 'active', stats: { panels: 4, components: 9, files: 23 }, route: 'designer' },
  { id: 'proj-2', name: 'AI Code System', desc: '智能 AI 编程工作台', icon: BrainCircuit, color: '#06b6d4', updated: '刚刚', status: 'new', stats: { panels: 3, components: 12, files: 47 }, route: 'ai-code' },
  { id: 'proj-3', name: 'Dashboard Pro', desc: '企业数据仪表盘', icon: Monitor, color: '#f59e0b', updated: '1 小时前', status: 'active', stats: { panels: 6, components: 24, files: 18 }, route: 'designer' },
  { id: 'proj-4', name: 'API Gateway', desc: '微服务网关管理', icon: Globe, color: '#10b981', updated: '昨天', status: 'idle', stats: { panels: 2, components: 8, files: 31 }, route: 'ai-code' },
  { id: 'proj-5', name: 'IoT Platform', desc: '物联网设备管理平台', icon: Cpu, color: '#ec4899', updated: '3 天前', status: 'idle', stats: { panels: 5, components: 16, files: 42 }, route: 'designer' },
  { id: 'proj-6', name: 'E-Commerce Admin', desc: '电商后台管理系统', icon: Database, color: '#8b5cf6', updated: '5 天前', status: 'idle', stats: { panels: 8, components: 32, files: 56 }, route: 'designer' },
];

const QUICK_ACTIONS = [
  { icon: ImageIcon, label: '图片上传', format: 'PNG, JPG, GIF, SVG' },
  { icon: FileUp, label: '文件导入', format: '多文件支持' },
  { icon: Github, label: 'GitHub 链接', format: '仓库 URL' },
  { icon: Figma, label: 'Figma 文件', format: '.fig 文件' },
  { icon: Code2, label: '代码片段', format: '多语言代码' },
  { icon: Clipboard, label: '剪贴板', format: 'Ctrl+V' },
];

const STATUS_COLORS = {
  active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', label: '活跃' },
  new: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-400', label: '新建' },
  idle: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', dot: 'bg-zinc-400', label: '闲置' },
};

/* ================================================================
   Project Card Context Menu
   ================================================================ */
function ProjectContextMenu({ x, y, project, onAction, onClose }: {
  x: number; y: number; project: ProjectItem;
  onAction: (action: string, id: string) => void; onClose: () => void;
}) {
  useEffect(() => {
    const h = () => onClose();
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [onClose]);

  const items = [
    { action: 'open', label: '打开项目', icon: FolderOpen },
    { action: 'rename', label: '重命名', icon: Pencil },
    { action: 'duplicate', label: '复制项目', icon: Copy },
    { action: 'delete', label: '删除项目', icon: Trash2, danger: true },
  ];

  return (
    <motion.div
      className="fixed z-[200] bg-[#1a1b26] border border-white/[0.1] rounded-xl py-1.5 shadow-2xl min-w-[160px]"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      <div className="px-3 py-1.5 border-b border-white/[0.06] mb-1">
        <p className="text-[10px] text-white/30 truncate">{project.name}</p>
      </div>
      {items.map(item => (
        <button
          key={item.action}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] transition-colors ${
            item.danger ? 'text-red-400/70 hover:bg-red-500/10' : 'text-white/60 hover:bg-white/[0.06]'
          }`}
          onClick={(e) => { e.stopPropagation(); onAction(item.action, project.id); onClose(); }}
        >
          <item.icon size={12} />
          {item.label}
        </button>
      ))}
    </motion.div>
  );
}

/* ================================================================
   Intent Analysis Overlay — shows when routing is being decided
   ================================================================ */
function IntentAnalysisOverlay({ intent, userText, onOverride, onConfirm }: {
  intent: IntentResult; userText: string;
  onOverride: (target: 'designer' | 'ai-code') => void;
  onConfirm: () => void;
}) {
  const [phase, setPhase] = useState(0); // 0=analyzing, 1=result, 2=navigating

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => { setPhase(2); onConfirm(); }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onConfirm]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'radial-gradient(circle at center, rgba(99,102,241,0.12) 0%, rgba(10,11,16,0.98) 70%)' }}
    >
      <motion.div
        className="w-[440px] rounded-2xl bg-[#12131a] border border-white/[0.08] overflow-hidden"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 120px rgba(99,102,241,0.08)' }}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <BrainCircuit size={14} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-[12px] text-white/80" style={{ fontWeight: 600 }}>智能路由决策</p>
              <p className="text-[10px] text-white/30">分析用户意图，自动选择最佳工作模式</p>
            </div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/50" style={{ lineHeight: '1.5' }}>
            "{userText}"
          </div>
        </div>

        {/* Analysis Body */}
        <div className="px-5 py-4 space-y-3">
          <AnimatePresence mode="wait">
            {phase === 0 && (
              <motion.div key="analyzing" className="flex flex-col items-center py-4 gap-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: i * 150 + 'ms' }} />
                  ))}
                </div>
                <p className="text-[11px] text-white/40">正在分析语义意图...</p>
              </motion.div>
            )}
            {phase >= 1 && (
              <motion.div key="result" className="space-y-3"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Matched keywords */}
                {intent.keywords.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/25 mb-1.5">匹配关键词</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intent.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/15 text-[10px] text-indigo-400/70">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category & Confidence */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-white/25 mb-1">意图分类</p>
                    <p className="text-[12px] text-white/70" style={{ fontWeight: 500 }}>{intent.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/25 mb-1">置信度</p>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${intent.confidence > 0.8 ? 'bg-emerald-400' : intent.confidence > 0.6 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          initial={{ width: 0 }}
                          animate={{ width: (intent.confidence * 100) + '%' }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-[11px] text-white/50" style={{ fontWeight: 500 }}>{Math.round(intent.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <p className="text-[10px] text-white/30" style={{ lineHeight: '1.5' }}>{intent.reasoning}</p>

                {/* Target selection */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onOverride('designer')}
                    className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                      intent.target === 'designer'
                        ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <Layers size={16} className={intent.target === 'designer' ? 'text-indigo-400' : 'text-white/30'} />
                    <div className="text-left">
                      <p className={`text-[11px] ${intent.target === 'designer' ? 'text-indigo-300' : 'text-white/50'}`} style={{ fontWeight: 500 }}>布局设计器</p>
                      <p className="text-[9px] text-white/20">拖拽 / 面板 / 可视化</p>
                    </div>
                    {intent.target === 'designer' && <Check size={12} className="text-indigo-400 ml-auto" />}
                  </button>
                  <button
                    onClick={() => onOverride('ai-code')}
                    className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                      intent.target === 'ai-code'
                        ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <BrainCircuit size={16} className={intent.target === 'ai-code' ? 'text-cyan-400' : 'text-white/30'} />
                    <div className="text-left">
                      <p className={`text-[11px] ${intent.target === 'ai-code' ? 'text-cyan-300' : 'text-white/50'}`} style={{ fontWeight: 500 }}>编程工作台</p>
                      <p className="text-[9px] text-white/20">AI / 代码 / 终端</p>
                    </div>
                    {intent.target === 'ai-code' && <Check size={12} className="text-cyan-400 ml-auto" />}
                  </button>
                </div>

                {phase === 2 && (
                  <motion.div className="flex items-center justify-center gap-2 pt-2"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="w-4 h-0.5 rounded-full bg-indigo-400/50 animate-pulse" />
                    <p className="text-[10px] text-white/30">
                      {intent.target === 'ai-code' ? '正在启动智能编程工作台...' : '正在启动设计器...'}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================
   Main AI Home Page
   ================================================================ */
export function AIHomePage() {
  const navigate = useNavigate();
  const globalAI = useGlobalAI();
  const [input, setInput] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; project: ProjectItem } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Smart routing state
  const [routingIntent, setRoutingIntent] = useState<IntentResult | null>(null);
  const [routingText, setRoutingText] = useState('');
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const authMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close auth menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (authMenuRef.current && !authMenuRef.current.contains(e.target as HTMLElement)) {
        setShowAuthMenu(false);
      }
    };
    if (showAuthMenu) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showAuthMenu]);

  const doNavigate = useCallback((target: string) => {
    setTimeout(() => {
      if (target === 'designer') navigate('/designer');
      else if (target === 'ai-code') navigate('/ai-code');
    }, 400);
  }, [navigate]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    const intent = analyzeIntent(input.trim());
    setRoutingText(input.trim());
    setRoutingIntent(intent);
  }, [input]);

  const handleRouteOverride = useCallback((target: 'designer' | 'ai-code') => {
    setRoutingIntent(prev => prev ? { ...prev, target } : null);
  }, []);

  const handleRouteConfirm = useCallback(() => {
    if (routingIntent) doNavigate(routingIntent.target);
  }, [routingIntent, doNavigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Project context menu actions
  const handleProjectAction = useCallback((action: string, id: string) => {
    switch (action) {
      case 'open': {
        const proj = projects.find(p => p.id === id);
        if (proj) doNavigate(proj.route);
        break;
      }
      case 'rename': {
        const proj = projects.find(p => p.id === id);
        setRenamingId(id);
        setRenameValue(proj?.name || '');
        break;
      }
      case 'duplicate': {
        const proj = projects.find(p => p.id === id);
        if (proj) {
          setProjects(prev => [...prev, {
            ...proj,
            id: 'proj-' + Date.now(),
            name: proj.name + ' (副本)',
            status: 'new',
            updated: '刚刚',
          }]);
        }
        break;
      }
      case 'delete': {
        setProjects(prev => prev.filter(p => p.id !== id));
        break;
      }
    }
  }, [projects, doNavigate]);

  const handleRenameSubmit = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      setProjects(prev => prev.map(p => p.id === renamingId ? { ...p, name: renameValue.trim() } : p));
    }
    setRenamingId(null);
  }, [renamingId, renameValue]);

  return (
    <AnimatePresence>
      <motion.div
        className="h-screen w-screen bg-[#0a0b10] text-white flex flex-col overflow-hidden relative"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
      >
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }} />
          <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)' }} />
        </div>

        {/* Top navigation */}
        <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            
            <div>
              <h1 className="text-white/90 text-[#0ce6dce6] text-[16px] italic" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>YanYuCloudCube</h1>
              
            </div>
          </div>
          <div className="flex items-center gap-1">
            <IconTip icon={Star} tip="收藏" />
            <IconTip icon={Activity} tip="活动" />
            <IconTip icon={Settings} tip="设置" onClick={() => navigate('/settings')} />
            {/* Auth-aware profile button */}
            <div className="relative ml-2" ref={authMenuRef}>
              <button
                onClick={() => setShowAuthMenu(!showAuthMenu)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] transition-all hover:ring-2 ring-white/20 ${
                  globalAI.isAuthenticated
                    ? 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                    : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                }`}
                style={{ fontWeight: 600 }}
              >
                {globalAI.isAuthenticated
                  ? (globalAI.session?.user.name?.[0] || 'U')
                  : 'Y'}
              </button>
              {globalAI.isAuthenticated && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0b10]" />
              )}
              <AnimatePresence>
                {showAuthMenu && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-[240px] bg-[#14151e] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-[100]"
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    {globalAI.isAuthenticated ? (
                      <>
                        <div className="px-4 py-3 border-b border-white/[0.06]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-[12px] text-white" style={{ fontWeight: 600 }}>
                              {globalAI.session?.user.name?.[0] || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-white/80 truncate" style={{ fontWeight: 500 }}>{globalAI.session?.user.name}</p>
                              <p className="text-[10px] text-white/30 truncate">{globalAI.session?.user.email}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/15 text-emerald-400/70 border border-emerald-500/20">
                              {globalAI.session?.user.role}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/15 text-indigo-400/70 border border-indigo-500/20">
                              {globalAI.session?.provider}
                            </span>
                          </div>
                        </div>
                        {/* Quota */}
                        <div className="px-4 py-2 border-b border-white/[0.06]">
                          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">API 配额</p>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-400"
                                style={{ width: Math.min(100, (globalAI.quota.tokensUsed / globalAI.quota.tokensLimit) * 100) + '%' }}
                              />
                            </div>
                            <span className="text-[9px] text-white/30">
                              {Math.round(globalAI.quota.tokensUsed / 1000)}K / {Math.round(globalAI.quota.tokensLimit / 1000)}K
                            </span>
                          </div>
                          <p className="text-[9px] text-white/20">{globalAI.quota.requestsUsed} / {globalAI.quota.requestsLimit} 请求</p>
                        </div>
                        <button
                          onClick={() => { globalAI.logout(); setShowAuthMenu(false); }}
                          className="w-full px-4 py-2.5 text-left text-[11px] text-red-400/70 hover:bg-red-500/10 transition-colors"
                        >
                          退出登录
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-white/[0.06]">
                          <p className="text-[12px] text-white/70" style={{ fontWeight: 500 }}>统一认证</p>
                          <p className="text-[10px] text-white/25 mt-0.5">登录后所有路由共享身份与配额</p>
                        </div>
                        <div className="p-2 space-y-1">
                          <button
                            onClick={() => { globalAI.login('openai'); setShowAuthMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-white/60 hover:bg-white/[0.06] transition-colors"
                          >
                            <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center"><Globe size={11} className="text-emerald-400" /></div>
                            OpenAI OAuth 登录
                          </button>
                          <button
                            onClick={() => { globalAI.login('enterprise', { email: 'dev@corp.yyc3.cn', password: '' }); setShowAuthMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-white/60 hover:bg-white/[0.06] transition-colors"
                          >
                            <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center"><Users size={11} className="text-indigo-400" /></div>
                            企业 IdP (OIDC) 登录
                          </button>
                          <button
                            onClick={() => { globalAI.login('local', { email: 'admin@localhost', password: '' }); setShowAuthMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-white/60 hover:bg-white/[0.06] transition-colors"
                          >
                            <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center"><Monitor size={11} className="text-amber-400" /></div>
                            本地 JWT 登录
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
          {/* Brand hero */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] mb-4">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[11px] text-white/50">YYC3 CloudPivot Intelli-Matrix v3.0</span>
            </div>
            <h2 className="text-[28px] text-white/95 mb-2" style={{ fontWeight: 700, letterSpacing: '-0.5px' }}><span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent"><span className="italic">言启千行代码&nbsp;&nbsp;语枢万物智能</span></span></h2>
            <p className="text-[13px] text-white/40 max-w-md mx-auto" style={{ lineHeight: '1.6' }}>
              描述你的需求，AI 将智能分析语义意图并路由到最佳工作模式
            </p>
          </motion.div>

          {/* Chat input area */}
          <motion.div
            className="w-full max-w-[640px] mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm overflow-hidden transition-all duration-300 focus-within:border-indigo-500/40 focus-within:bg-white/[0.06]"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              {/* Action bar */}
              <div className="flex items-center gap-1 px-3 pt-3 pb-1">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1.5 rounded-lg transition-all duration-200 hover:bg-white/10"
                >
                  <Plus size={16} className={`transition-transform duration-200 ${showActions ? 'rotate-45 text-indigo-400' : 'text-white/40'}`} />
                </button>
                {showActions && (
                  <motion.div
                    className="flex items-center gap-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {QUICK_ACTIONS.map((action) => (
                      <IconTip key={action.label} icon={action.icon} tip={action.label} size={15} className="text-white/40" />
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Text area */}
              <div className="px-4 pb-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='描述你想创建的应用，例如："创建一个管理后台仪表盘" 或 "写一个 React 登录表单组件"'
                  className="w-full bg-transparent text-white/90 text-[13px] placeholder-white/25 outline-none resize-none"
                  style={{ minHeight: '48px', maxHeight: '120px', lineHeight: '1.6' }}
                  rows={2}
                />
              </div>

              {/* Bottom bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.05] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.05] border border-white/[0.06]">
                    <Bot size={12} className="text-indigo-400" />
                    <span className="text-[10px] text-white/50">{globalAI.getActiveModel()?.name || 'GLM-4.5'}</span>
                    {globalAI.hasApiKey(globalAI.activeModelId) && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    <ChevronRight size={10} className="text-white/20" />
                  </div>
                  <span className="text-[10px] text-white/20">Enter 发送 / Shift+Enter 换行</span>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    input.trim()
                      ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-white/[0.05] text-white/20 cursor-not-allowed'
                  }`}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick route cards */}
          <motion.div
            className="flex items-center gap-3 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button
              onClick={() => doNavigate('designer')}
              className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-indigo-500/30 hover:bg-indigo-500/[0.06] transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors">
                <Layers size={18} className="text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-[12px] text-white/80" style={{ fontWeight: 500 }}>多联式布局设计器</p>
                <p className="text-[10px] text-white/30">拖拽 / 合并 / 分割面板系统</p>
              </div>
              
            </button>

            <button
              onClick={() => doNavigate('ai-code')}
              className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-cyan-500/30 hover:bg-cyan-500/[0.06] transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center group-hover:bg-cyan-500/25 transition-colors">
                <BrainCircuit size={18} className="text-cyan-400" />
              </div>
              <div className="text-left">
                <p className="text-[12px] text-white/80" style={{ fontWeight: 500 }}>智能 AI 编程工作台</p>
                <p className="text-[10px] text-white/30">AI 对话 / 文件管理 / 代码编辑</p>
              </div>
              
            </button>
          </motion.div>

          {/* Recent projects — horizontally scrollable with context menu */}
          <motion.div
            className="w-full max-w-[900px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-white/30" />
                <span className="text-[11px] text-white/40" style={{ fontWeight: 500 }}>最近项目</span>
                <span className="text-[10px] text-white/20 ml-1">{projects.length} 个项目</span>
              </div>
              <button className="text-[10px] text-white/30 hover:text-white/50 transition-colors flex items-center gap-1">
                查看全部 <ChevronRight size={10} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
              {/* New project card */}
              <motion.div
                className="flex-shrink-0 w-[160px] p-3.5 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer"
                whileHover={{ y: -2 }}
                onClick={() => doNavigate('designer')}
                role="button"
                tabIndex={0}
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <Plus size={20} className="text-white/25" />
                </div>
                <p className="text-[11px] text-white/40" style={{ fontWeight: 500 }}>新建项目</p>
              </motion.div>

              {projects.map((proj, i) => {
                const status = STATUS_COLORS[proj.status];
                const isRenaming = renamingId === proj.id;
                return (
                  <motion.div
                    key={proj.id}
                    onClick={() => doNavigate(proj.route)}
                    onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, project: proj }); }}
                    className="group flex-shrink-0 w-[200px] p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 text-left relative cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    whileHover={{ y: -2 }}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Quick actions on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded-md hover:bg-white/[0.08] text-white/30 hover:text-white/60"
                        onClick={(e) => { e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, project: proj }); }}
                      >
                        <MoreHorizontal size={12} />
                      </button>
                    </div>

                    <div className="flex items-start justify-between mb-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: proj.color + '20' }}>
                        <proj.icon size={16} style={{ color: proj.color }} />
                      </div>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${status.bg}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span className={`text-[9px] ${status.text}`}>{status.label}</span>
                      </div>
                    </div>
                    {isRenaming ? (
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setRenamingId(null); }}
                        onBlur={handleRenameSubmit}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full bg-white/[0.06] border border-indigo-500/30 rounded px-1.5 py-0.5 text-[12px] text-white/80 outline-none mb-0.5"
                      />
                    ) : (
                      <p className="text-[12px] text-white/80 mb-0.5 truncate" style={{ fontWeight: 500 }}>{proj.name}</p>
                    )}
                    <p className="text-[10px] text-white/30 mb-2 truncate">{proj.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-white/20">{proj.updated}</span>
                      <div className="flex items-center gap-2 text-[9px] text-white/20">
                        <span>{proj.stats.panels} 面板</span>
                        <span>{proj.stats.components} 组件</span>
                        {proj.stats.files && <span>{proj.stats.files} 文件</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 flex items-center justify-center py-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-4 text-[10px] text-white/20">
            <img src={yyc3Logo} alt="YYC³" className="w-4 h-4 object-contain opacity-40" />
            <span>YYC3 CloudPivot Intelli-Matrix</span>
            <span>v3.0.0</span>
            <span className="flex items-center gap-1.5">
              <Bot size={10} />
              {globalAI.getActiveModel()?.name || 'GLM-4.5'}
              {globalAI.hasApiKey(globalAI.activeModelId)
                ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                : <span className="text-amber-400/50">未配置</span>
              }
            </span>
            <span>言启象限 | 语枢未来</span>
          </div>
        </footer>

        {/* Smart routing overlay */}
        <AnimatePresence>
          {routingIntent && (
            <IntentAnalysisOverlay
              intent={routingIntent}
              userText={routingText}
              onOverride={handleRouteOverride}
              onConfirm={handleRouteConfirm}
            />
          )}
        </AnimatePresence>

        {/* Project context menu */}
        <AnimatePresence>
          {ctxMenu && (
            <ProjectContextMenu
              x={ctxMenu.x}
              y={ctxMenu.y}
              project={ctxMenu.project}
              onAction={handleProjectAction}
              onClose={() => setCtxMenu(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}