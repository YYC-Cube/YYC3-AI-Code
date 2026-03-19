/**
 * @file GlobalToolbar.tsx
 * @description YYC3 Designer 全局工具栏 — 保存、撤销/重做、主题切换、AI 助手、设置等功能入口
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags designer,toolbar,save,undo,redo,theme,ai,settings
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Save, Code, Sparkles, Sun, Moon, ChevronDown,
  Undo2, Redo2, Settings, Layers, Eye, Search,
  Zap, Droplets, X, Clock, Flame, FileCode2, ArrowLeftRight,
  Shield, Lock
} from 'lucide-react';
import yyc3Logo from '/yyc3-logo-blue.png';
import { useDesigner } from '../../store';
import { Tooltip } from './Tooltip';
import { useThemeTokens } from './hooks/useThemeTokens';
import { useGlobalAI } from '../../aiModelContext';
import { pinyin, match as pinyinMatch } from 'pinyin-pro';
import { api } from '../../apiClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

/* ================================================================
   Pinyin-aware matching (shared with useFlyoutMenu)
   ================================================================ */

function matchesPinyin(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  if (lower.includes(q)) return true;
  const indices = pinyinMatch(text, q, { continuous: true });
  if (indices && indices.length > 0) return true;
  const fullPy = pinyin(text, { toneType: 'none', type: 'array' }).join('').toLowerCase();
  if (fullPy.includes(q)) return true;
  const initials = pinyin(text, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toLowerCase();
  if (initials.includes(q)) return true;
  return false;
}

/* ================================================================
   Global Search History
   ================================================================ */

const GLOBAL_SEARCH_KEY = 'global-search-history';
const MAX_GLOBAL_HISTORY = 10;

interface SearchHistoryEntry { term: string; score: number; lastUsed: number; }

function loadGlobalHistory(): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(GLOBAL_SEARCH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
      return (parsed as string[]).map((t, i) => ({ term: t, score: Math.pow(0.85, i), lastUsed: Date.now() - i * 60000 }));
    }
    return Array.isArray(parsed) ? parsed.slice(0, MAX_GLOBAL_HISTORY) : [];
  } catch { return []; }
}

function saveGlobalHistory(h: SearchHistoryEntry[]) {
  try { localStorage.setItem(GLOBAL_SEARCH_KEY, JSON.stringify(h.slice(0, MAX_GLOBAL_HISTORY))); } catch {}
}

function pushGlobalHistory(term: string): SearchHistoryEntry[] {
  const trimmed = term.trim();
  if (!trimmed) return loadGlobalHistory();
  const prev = loadGlobalHistory();
  const existing = prev.find(h => h.term === trimmed);
  const now = Date.now();
  const decayed = prev.filter(h => h.term !== trimmed).map(h => {
    const hrs = (now - h.lastUsed) / 3600000;
    return { ...h, score: h.score * Math.pow(0.85, hrs) };
  });
  const newScore = existing ? existing.score + 1.0 : 1.0;
  const next = [{ term: trimmed, score: newScore, lastUsed: now }, ...decayed].sort((a, b) => b.score - a.score).slice(0, MAX_GLOBAL_HISTORY);
  saveGlobalHistory(next);
  return next;
}

/* ================================================================
   Global Search Modal (⌘K)
   ================================================================ */

interface SearchResult {
  id: string;
  label: string;
  type: 'component' | 'panel' | 'action';
  desc: string;
  icon: React.ElementType;
  action: () => void;
}

function GlobalSearchModal({ onClose }: { onClose: () => void }) {
  const t = useThemeTokens();
  const ctx = useDesigner();
  const { panels, components, setViewMode, toggleAI, openModelSettings, toggleSchemaExplorer, selectComponent, selectPanel } = ctx;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const resultRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => { setHistory(loadGlobalHistory()); }, []);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Build searchable items
  const allItems = useMemo((): SearchResult[] => {
    const items: SearchResult[] = [];
    // Panels
    panels.forEach(p => {
      items.push({
        id: 'panel-' + p.id, label: p.name, type: 'panel', desc: `面板 · ${p.type}`,
        icon: Layers, action: () => { selectPanel(p.id); onClose(); },
      });
    });
    // Components
    components.forEach(c => {
      items.push({
        id: 'comp-' + c.id, label: c.label, type: 'component', desc: `${c.type} · ${c.panelId}`,
        icon: Zap, action: () => { selectComponent(c.id); onClose(); },
      });
    });
    // Quick actions
    items.push(
      { id: 'act-design', label: '设计画布', type: 'action', desc: '切换到设计模式', icon: Layers, action: () => { setViewMode('design'); onClose(); } },
      { id: 'act-preview', label: '实时预览', type: 'action', desc: '切换到预览模式', icon: Eye, action: () => { setViewMode('preview'); onClose(); } },
      { id: 'act-code', label: '代码模式', type: 'action', desc: '切换到代码视图', icon: Code, action: () => { setViewMode('code'); onClose(); } },
      { id: 'act-ai', label: 'AI 助手', type: 'action', desc: '打开 AI 助手面板', icon: Sparkles, action: () => { toggleAI(); onClose(); } },
      { id: 'act-models', label: '模型设置', type: 'action', desc: '管理 AI 模型', icon: Settings, action: () => { openModelSettings(); onClose(); } },
      { id: 'act-schema', label: '数据库管理', type: 'action', desc: 'Schema Explorer', icon: Search, action: () => { toggleSchemaExplorer(); onClose(); } },
    );
    return items;
  }, [panels, components, selectPanel, selectComponent, setViewMode, toggleAI, openModelSettings, toggleSchemaExplorer, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    return allItems.filter(item =>
      matchesPinyin(item.label, query.trim()) || matchesPinyin(item.desc, query.trim()) || item.id.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 12);
  }, [query, allItems]);

  useEffect(() => { setFocusedIdx(0); }, [filtered.length]);

  // Click outside
  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (backdropRef.current === e.target) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      const list = filtered.length > 0 ? filtered : [];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIdx(prev => (prev + 1) % Math.max(list.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIdx(prev => (prev - 1 + list.length) % Math.max(list.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (list[focusedIdx]) {
          pushGlobalHistory(query);
          list[focusedIdx].action();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, filtered, focusedIdx, query]);

  const selectHistory = (term: string) => { setQuery(term); inputRef.current?.focus(); };
  const showHistoryList = !query.trim() && history.length > 0;

  const typeColors: Record<string, string> = {
    component: t.accent,
    panel: 'text-cyan-400',
    action: 'text-amber-400',
  };

  return (
    <div ref={backdropRef} className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div className={`w-[520px] ${t.panelBg} border ${t.panelBorder} rounded-2xl shadow-2xl shadow-black/60 overflow-hidden`}
        style={{ backdropFilter: 'blur(40px) saturate(180%)' }}>
        {/* Search input */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${t.sectionBorder}`}>
          <Search className={`w-5 h-5 ${t.accent} shrink-0`} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索组件、面板、操作...（支持拼音）"
            className={`flex-1 bg-transparent text-[14px] ${t.inputText} placeholder:text-white/20 outline-none`}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-white/20 hover:text-white/40">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className={`px-1.5 py-0.5 ${t.badgeBg} rounded text-[10px] ${t.textMuted}`}>ESC</kbd>
        </div>

        {/* Results / History */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {showHistoryList && (
            <div className="px-3 pb-2">
              <div className={`text-[10px] ${t.textMuted} uppercase tracking-wider mb-1.5 px-1`}>最近搜索</div>
              {history.map(entry => (
                <button key={entry.term} onClick={() => selectHistory(entry.term)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg ${t.hoverBg} transition-all text-left`}>
                  <Clock className={`w-3.5 h-3.5 ${t.textMuted} shrink-0`} />
                  <span className={`text-[12px] ${t.textSecondary}`}>{entry.term}</span>
                </button>
              ))}
            </div>
          )}
          {query.trim() && filtered.length === 0 && (
            <div className={`text-center py-8 text-[12px] ${t.textTertiary}`}>无匹配结果</div>
          )}
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              ref={el => { resultRefs.current[idx] = el; }}
              onClick={() => { pushGlobalHistory(query); item.action(); }}
              onMouseEnter={() => setFocusedIdx(idx)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left ${
                idx === focusedIdx ? `${t.activeBg}` : `${t.hoverBg}`
              }`}
            >
              <div className={`w-7 h-7 rounded-lg ${t.inputBg} flex items-center justify-center shrink-0`}>
                <item.icon className={`w-4 h-4 ${typeColors[item.type] || t.accent}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[12px] ${t.textPrimary}`}>{item.label}</div>
                <div className={`text-[10px] ${t.textTertiary} truncate`}>{item.desc}</div>
              </div>
              <span className={`text-[9px] ${t.textMuted} uppercase`}>{
                item.type === 'component' ? '组件' : item.type === 'panel' ? '面板' : '操作'
              }</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-4 px-4 py-2 border-t ${t.sectionBorder}`}>
          <div className={`flex items-center gap-1 text-[10px] ${t.textMuted}`}>
            <kbd className={`px-1 py-0.5 ${t.badgeBg} rounded text-[9px]`}>↑↓</kbd>
            <span>导航</span>
          </div>
          <div className={`flex items-center gap-1 text-[10px] ${t.textMuted}`}>
            <kbd className={`px-1 py-0.5 ${t.badgeBg} rounded text-[9px]`}>Enter</kbd>
            <span>确认</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Global Toolbar
   ================================================================ */

const TOOLBAR_ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  owner: { label: '所有者', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  admin: { label: '管理员', color: 'text-rose-400', bg: 'bg-rose-500/15' },
  editor: { label: '编辑者', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  viewer: { label: '观察者', color: 'text-white/40', bg: 'bg-white/[0.06]' },
  guest: { label: '访客', color: 'text-white/25', bg: 'bg-white/[0.04]' },
};

export function GlobalToolbar({ onSyncToCode }: { onSyncToCode?: () => void } = {}) {
  const t = useThemeTokens();
  const {
    projectName, theme, toggleTheme, viewMode, setViewMode,
    syncStatus, undo, redo, canUndo, canRedo,
    toggleConflictResolver, conflicts, openModelSettings,
    uiTheme, setUITheme, toggleCodePreview,
    currentUserIdentity,
  } = useDesigner();
  const globalAI = useGlobalAI();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backendSaveStatus, setBackendSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { panels, components, dataBindings, theme: designTheme } = useDesigner();

  const userRole = currentUserIdentity?.role || 'editor';
  const isReadOnly = userRole === 'viewer' || userRole === 'guest';
  const roleMeta = TOOLBAR_ROLE_META[userRole];

  const handleSave = useCallback(async () => {
    if (isReadOnly) return;

    // 1. Local save — always succeeds (handled by store's auto-save)
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success('设计已保存到本地', {
      description: `${panels.length} 面板 · ${components.length} 组件`,
      duration: 2000,
    });

    // 2. Attempt backend persistence via api.designs.update
    setBackendSaveStatus('saving');
    try {
      const designJSON = {
        panels: panels.map(p => ({
          id: p.id, name: p.name, type: p.type,
          layout: { x: p.x, y: p.y, w: p.w, h: p.h },
          children: p.children,
        })),
        components: components.map(c => ({
          id: c.id, type: c.type, label: c.label,
          props: c.props, panelId: c.panelId,
        })),
        dataBindings,
        theme: designTheme,
        metadata: {
          project: projectName,
          savedAt: new Date().toISOString(),
          engine: 'yanyucloud-lowcode-v2.4.1',
        },
      };

      const response = await api.designs.update('current', designJSON);
      if (response.ok) {
        setBackendSaveStatus('saved');
        setTimeout(() => setBackendSaveStatus('idle'), 3000);
        toast.success('设计已保存到后端');
      } else {
        // Backend not reachable — that's fine, we still saved locally
        setBackendSaveStatus('error');
        setTimeout(() => setBackendSaveStatus('idle'), 4000);
        toast.error('无法连接到后端，设计已保存到本地');
      }
    } catch {
      // Network error — silent fail, local save is sufficient
      setBackendSaveStatus('error');
      setTimeout(() => setBackendSaveStatus('idle'), 4000);
      toast.error('网络错误，设计已保存到本地');
    }
  }, [isReadOnly, panels, components, dataBindings, designTheme, projectName]);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      // ⌘S save shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!isReadOnly) {
          handleSave();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isReadOnly, handleSave]);

  return (
    <>
      <header className={`h-11 border-b ${t.sectionBorder} ${t.panelBg} flex items-center px-3 gap-1 shrink-0 z-50 select-none`}
        style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.02), 0 4px 20px -4px rgba(0,0,0,0.4)' }}
      >
        {/* Logo & Project */}
        <div className="flex items-center gap-2 mr-2">
          <img src={yyc3Logo} alt="YYC³" className="w-6 h-6 rounded-lg object-contain" />
          <div className="flex items-center gap-1 cursor-pointer group">
            <span className={`text-[12px] ${t.textPrimary} group-hover:text-white transition-colors`}>{projectName}</span>
            <ChevronDown className={`w-3 h-3 ${t.textTertiary}`} />
          </div>
        </div>

        {/* Separator */}
        <div className={`w-px h-4 ${t.separator} mx-1`} />

        {/* History */}
        <Tooltip label="撤销" shortcut="⌘Z">
          <button
            onClick={undo}
            className={`p-1.5 rounded-md transition-all ${canUndo ? `${t.textTertiary} hover:text-white/70 ${t.hoverBg}` : `${t.textMuted} cursor-not-allowed`}`}
            disabled={!canUndo}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip label="重做" shortcut="⌘⇧Z">
          <button
            onClick={redo}
            className={`p-1.5 rounded-md transition-all ${canRedo ? `${t.textTertiary} hover:text-white/70 ${t.hoverBg}` : `${t.textMuted} cursor-not-allowed`}`}
            disabled={!canRedo}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <div className={`w-px h-4 ${t.separator} mx-1`} />

        {/* View mode switcher */}
        <div className={`flex items-center ${t.inputBg} rounded-lg p-0.5`}>
          {([
            { mode: 'design' as const, icon: Layers, label: '设计' },
            { mode: 'preview' as const, icon: Eye, label: '预览' },
            { mode: 'code' as const, icon: Code, label: '代码' },
          ]).map(({ mode, icon: Icon, label }) => {
            const isActive = viewMode === mode;
            return (
              <Tooltip key={mode} label={label}>
                <button
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center justify-center p-1.5 rounded-md transition-all ${
                    isActive
                      ? `${t.accentBg} ${t.activeTabText}`
                      : `${t.textTertiary} hover:text-white/70`
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* Search — centered */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => setSearchOpen(true)}
            className={`flex items-center gap-2 px-3 py-1 ${t.inputBg} rounded-lg ${t.textTertiary} hover:text-white/50 ${t.hoverBg} transition-all text-[11px] w-56`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>搜索组件、面板...</span>
            <div className="ml-auto flex items-center gap-0.5">
              <kbd className={`px-1 py-0.5 ${t.badgeBg} rounded text-[9px] ${t.textMuted}`}>⌘</kbd>
              <kbd className={`px-1 py-0.5 ${t.badgeBg} rounded text-[9px] ${t.textMuted}`}>K</kbd>
            </div>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Sync status */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px]">
            <div className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === 'synced' ? t.statusSyncedDot :
              syncStatus === 'pending' ? t.statusPendingDot :
              t.statusConflictDot
            }`} />
            <span className={`${syncStatus === 'conflict' ? 'text-red-400 cursor-pointer hover:underline' : t.textTertiary}`}
              onClick={syncStatus === 'conflict' ? toggleConflictResolver : undefined}
            >
              {syncStatus === 'synced' ? '已同步' : syncStatus === 'pending' ? '同步中...' : `冲突 (${conflicts.filter(c => !c.resolved).length})`}
            </span>
          </div>

          <div className={`w-px h-4 ${t.separator} mx-0.5`} />

          {/* Save */}
          <Tooltip label={
            isReadOnly ? '只读模式 — 无法保存'
            : backendSaveStatus === 'saving' ? '正在保存到后端...'
            : backendSaveStatus === 'saved' ? '已保存到本地 + 后端'
            : backendSaveStatus === 'error' ? '已保存到本地（后端不可达）'
            : saved ? '已保存到本地'
            : '保存'
          } shortcut={isReadOnly ? undefined : '⌘S'}>
            <button
              disabled={isReadOnly}
              onClick={handleSave}
              className={`p-1.5 rounded-md transition-all relative ${
                isReadOnly
                  ? 'text-white/10 cursor-not-allowed'
                  : backendSaveStatus === 'saving'
                  ? 'text-blue-400 animate-pulse'
                  : backendSaveStatus === 'saved'
                  ? 'text-emerald-400'
                  : backendSaveStatus === 'error'
                  ? 'text-amber-400'
                  : saved
                  ? 'text-emerald-400'
                  : `${t.textTertiary} hover:text-white/70 ${t.hoverBg}`
              }`}
            >
              {isReadOnly ? <Lock className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {backendSaveStatus === 'saved' && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
              {backendSaveStatus === 'error' && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          </Tooltip>

          {/* Code export */}
          <Tooltip label={isReadOnly ? '只读模式 — 无法导出' : '导出代码'}>
            <button
              onClick={isReadOnly ? undefined : toggleCodePreview}
              disabled={isReadOnly}
              className={`p-1.5 rounded-md transition-all ${
                isReadOnly
                  ? 'text-white/10 cursor-not-allowed'
                  : `${t.textTertiary} hover:text-white/70 ${t.hoverBg}`
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {/* Sync to AI Code System */}
          {onSyncToCode && (
            <Tooltip label="同步到 AI Code System">
              <button
                onClick={onSyncToCode}
                className={`p-1.5 rounded-md text-cyan-400/60 hover:text-cyan-400 ${t.hoverBg} transition-all`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}

          {/* Theme toggle */}
          <Tooltip label={theme === 'dark' ? '切换亮色' : '切换暗色'}>
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-md ${t.textTertiary} hover:text-white/70 ${t.hoverBg} transition-all`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>

          {/* UI Theme — cycle through themes */}
          <Tooltip label={uiTheme === 'classic' ? '切换到液态玻璃' : uiTheme === 'liquid-glass' ? '切换到极光主题' : '切换到经典主题'}>
            <button
              onClick={() => setUITheme(uiTheme === 'classic' ? 'liquid-glass' : uiTheme === 'liquid-glass' ? 'aurora' : 'classic')}
              className={`p-1.5 rounded-md ${t.textTertiary} ${t.accentHoverBg} transition-all`}
            >
              <Droplets className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {/* Settings */}
          <Tooltip label="模型设置">
            <button
              onClick={openModelSettings}
              className={`p-1.5 rounded-md ${t.textTertiary} hover:text-white/70 ${t.hoverBg} transition-all`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {/* Global Settings */}
          <Tooltip label="全局设置">
            <button
              onClick={() => navigate('/settings')}
              className={`p-1.5 rounded-md ${t.textTertiary} hover:text-white/70 ${t.hoverBg} transition-all`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {/* User avatar — auth-aware + RBAC badge */}
          <Tooltip label={
            globalAI.isAuthenticated
              ? `${globalAI.session?.user.name} (${globalAI.session?.user.role}) · ${globalAI.session?.provider}`
              : '未登录 — 请从首页进行统一认证'
          }>
            <div className="flex items-center gap-1.5 ml-1">
              {/* Role badge */}
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${roleMeta.bg}`}>
                <Shield className={`w-2.5 h-2.5 ${roleMeta.color}`} />
                <span className={`text-[9px] ${roleMeta.color}`}>{roleMeta.label}</span>
              </div>
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer relative ${
                globalAI.isAuthenticated
                  ? 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                  : `${t.accentGradient}`
              }`}>
                <span className="text-[10px] text-white" style={{ fontWeight: 600 }}>
                  {globalAI.isAuthenticated ? (globalAI.session?.user.name?.[0] || 'U') : 'YC'}
                </span>
                {globalAI.isAuthenticated && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#14151e]" />
                )}
              </div>
            </div>
          </Tooltip>
        </div>
      </header>

      {/* Global search modal */}
      {searchOpen && <GlobalSearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}