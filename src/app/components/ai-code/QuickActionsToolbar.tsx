/**
 * @file QuickActionsToolbar.tsx
 * @description 智能一键操作交互工具栏 — 上下文感知浮动菜单，集成代码/文档/文本/AI 操作
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,quick-actions,interaction,toolbar,ui,context-menu
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy, FileCode2, Globe, RefreshCw, Zap, BookOpen,
  FileText, Sparkles, Languages, Pen, SpellCheck,
  Download, ArrowRightLeft, ChevronRight, ChevronDown,
  Loader, Check, X, AlertCircle, Clipboard, Clock,
  Trash2, Code2, Type, Bug, Expand,
  type LucideIcon,
} from 'lucide-react';
import {
  QuickActionsService, ACTION_REGISTRY, CATEGORY_META, ClipboardManager,
} from '../../services/actions/QuickActionsService';
import type {
  ActionDef, ActionContext, ActionResult, ActionCategory, ClipboardHistoryItem,
} from '../../types/actions';

/* ================================================================
   Icon Mapping — 将 ActionDef.icon 字符串映射为 lucide 组件
   ================================================================ */

const ICON_MAP: Record<string, LucideIcon> = {
  Copy, FileCode2, Globe, RefreshCw, Zap, BookOpen, FileText,
  Sparkles, Languages, Pen, SpellCheck, Download, ArrowRightLeft,
  Code2, Type, Bug, Expand, Clipboard,
  // Fallback aliases
  AlignLeft: Code2,
  FlaskConical: Sparkles,
  MessageSquarePlus: FileText,
  ListCollapse: Type,
  FileType: FileText,
};

function getActionIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Sparkles;
}

/* ================================================================
   Action Status Indicator
   ================================================================ */

function ActionStatusBadge({ status }: { status: 'idle' | 'processing' | 'success' | 'error' }) {
  if (status === 'idle') return null;
  return (
    <span className="ml-1">
      {status === 'processing' && <Loader size={10} className="animate-spin text-[#667eea]" />}
      {status === 'success' && <Check size={10} className="text-emerald-400" />}
      {status === 'error' && <AlertCircle size={10} className="text-red-400" />}
    </span>
  );
}

/* ================================================================
   Clipboard History Panel
   ================================================================ */

function ClipboardHistoryPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ClipboardHistoryItem[]>(ClipboardManager.getHistory());

  const handlePaste = async (item: ClipboardHistoryItem) => {
    await navigator.clipboard.writeText(item.content);
  };

  const handleClear = () => {
    ClipboardManager.clearHistory();
    setItems([]);
  };

  return (
    <div className="w-72 max-h-80 flex flex-col bg-[#12131a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <Clipboard size={12} className="text-[#667eea]" />
          <span className="text-[11px] text-white/60" style={{ fontWeight: 600 }}>剪贴板历史</span>
          <span className="text-[9px] text-white/20 bg-white/[0.04] px-1 rounded">{items.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <button
              onClick={handleClear}
              className="text-[9px] text-white/20 hover:text-red-400 px-1 py-0.5 rounded transition-colors"
            >
              清空
            </button>
          )}
          <button onClick={onClose} className="p-0.5 hover:bg-white/[0.06] rounded transition-colors">
            <X size={11} className="text-white/20" />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-white/15">
            <Clipboard size={20} className="mb-1" />
            <span className="text-[10px]">暂无历史记录</span>
          </div>
        ) : (
          items.map(item => (
            <button
              key={item.id}
              onClick={() => handlePaste(item)}
              className="w-full text-left px-3 py-2 hover:bg-white/[0.04] border-b border-white/[0.03] transition-colors group"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[8px] px-1 py-0 rounded ${
                  item.type === 'code' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-white/[0.06] text-white/30'
                }`}>
                  {item.type === 'code' ? item.language || 'code' : 'text'}
                </span>
                <span className="text-[8px] text-white/15">
                  {new Date(item.copiedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[8px] text-white/10 ml-auto">{item.size} 字符</span>
              </div>
              <div className="text-[10px] text-white/40 truncate" style={{ fontFamily: item.type === 'code' ? 'JetBrains Mono, monospace' : 'inherit' }}>
                {item.content.slice(0, 80)}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Action Result Viewer
   ================================================================ */

function ActionResultViewer({
  result, actionTitle, onClose, onCopy, onApply,
}: {
  result: ActionResult;
  actionTitle: string;
  onClose: () => void;
  onCopy: () => void;
  onApply?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      className="w-[360px] max-h-[420px] flex flex-col bg-[#12131a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          {result.success
            ? <Check size={12} className="text-emerald-400" />
            : <AlertCircle size={12} className="text-red-400" />
          }
          <span className="text-[11px] text-white/60" style={{ fontWeight: 600 }}>{actionTitle}</span>
          <span className="text-[8px] text-white/15">{result.duration}ms</span>
        </div>
        <button onClick={onClose} className="p-0.5 hover:bg-white/[0.06] rounded transition-colors">
          <X size={12} className="text-white/20" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'thin' }}>
        {result.success ? (
          <pre className="text-[11px] text-white/60 whitespace-pre-wrap break-words" style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', lineHeight: '1.5' }}>
            {result.content}
          </pre>
        ) : (
          <div className="text-[11px] text-red-400/80">{result.error}</div>
        )}
      </div>

      {/* Footer actions */}
      {result.success && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-white/[0.06] shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#667eea]/10 text-[#667eea] text-[10px] hover:bg-[#667eea]/20 transition-colors"
            style={{ fontWeight: 500 }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? '已复制' : '复制结果'}
          </button>
          {onApply && (
            <button
              onClick={onApply}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] hover:bg-emerald-500/20 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Check size={11} />
              应用替换
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ================================================================
   Main QuickActionsToolbar Component
   ================================================================ */

export interface QuickActionsToolbarProps {
  /** 当前选中文本 */
  selectedText?: string;
  /** 当前文件完整代码 */
  currentCode?: string;
  /** 当前文件名 */
  fileName?: string;
  /** 当前语言 */
  language?: string;
  /** 是否显示 */
  visible?: boolean;
  /** 点击应用替换时的回调 */
  onApplyReplace?: (newCode: string) => void;
  /** 在聊天中发送 prompt */
  onSendToChat?: (prompt: string) => void;
  /** 面板模式 (inline 嵌入 / floating 浮动) */
  mode?: 'inline' | 'floating';
}

export function QuickActionsToolbar({
  selectedText = '',
  currentCode = '',
  fileName = '',
  language = 'typescript',
  visible = true,
  onApplyReplace,
  onSendToChat,
  mode = 'inline',
}: QuickActionsToolbarProps) {
  const [expandedCategory, setExpandedCategory] = useState<ActionCategory | null>('code');
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [actionResult, setActionResult] = useState<{ result: ActionResult; title: string } | null>(null);
  const [showClipboard, setShowClipboard] = useState(false);

  const hasSelection = selectedText.length > 0;

  // Build context
  const buildContext = useCallback((): ActionContext => ({
    selection: { text: selectedText || currentCode },
    file: fileName ? { path: fileName, name: fileName, language, content: currentCode } : undefined,
  }), [selectedText, currentCode, fileName, language]);

  // Get filtered actions based on current context
  const availableActions = useMemo(() => {
    return ACTION_REGISTRY.filter(a => {
      if (a.requiresSelection && !hasSelection && !currentCode) return false;
      return true;
    });
  }, [hasSelection, currentCode]);

  // Group by category
  const groupedActions = useMemo(() => {
    const groups: Record<ActionCategory, ActionDef[]> = { code: [], ai: [], text: [], document: [] };
    for (const action of availableActions) {
      groups[action.category].push(action);
    }
    return groups;
  }, [availableActions]);

  // Execute action
  const handleExecute = useCallback(async (action: ActionDef) => {
    setProcessing(prev => ({ ...prev, [action.id]: true }));
    setActionResult(null);

    try {
      const ctx = buildContext();
      const result = await QuickActionsService.dispatch(action, ctx);

      if (action.type === 'copy' || action.type === 'copy-markdown' || action.type === 'copy-html') {
        // Copy actions → just show toast-like feedback briefly
        setActionResult({ result, title: action.title });
        setTimeout(() => setActionResult(null), 2000);
      } else {
        // AI/complex actions → show result viewer
        setActionResult({ result, title: action.title });
      }
    } catch (err: any) {
      setActionResult({
        result: { success: false, error: err.message || '操作失败', duration: 0 },
        title: action.title,
      });
    } finally {
      setProcessing(prev => ({ ...prev, [action.id]: false }));
    }
  }, [buildContext]);

  // Copy result
  const handleCopyResult = useCallback(async () => {
    if (actionResult?.result.content) {
      await navigator.clipboard.writeText(actionResult.result.content);
    }
  }, [actionResult]);

  // Apply replace
  const handleApplyReplace = useCallback(() => {
    if (actionResult?.result.content && onApplyReplace) {
      onApplyReplace(actionResult.result.content);
      setActionResult(null);
    }
  }, [actionResult, onApplyReplace]);

  if (!visible) return null;

  const categories: ActionCategory[] = ['code', 'ai', 'text', 'document'];

  return (
    <div className="flex flex-col h-full bg-[#0d0e14]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-[#667eea]" />
          <span className="text-[11px] text-white/50" style={{ fontWeight: 600 }}>快捷操作</span>
          {hasSelection && (
            <span className="text-[8px] text-cyan-400/60 bg-cyan-500/10 px-1.5 py-0.5 rounded">
              选中 {selectedText.split('\n').length} 行
            </span>
          )}
        </div>
        <button
          onClick={() => setShowClipboard(!showClipboard)}
          className={`p-1 rounded-md transition-colors ${
            showClipboard ? 'bg-[#667eea]/15 text-[#667eea]' : 'text-white/20 hover:text-white/40 hover:bg-white/[0.06]'
          }`}
          title="剪贴板历史"
        >
          <Clipboard size={12} />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {/* Clipboard history overlay */}
        <AnimatePresence>
          {showClipboard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-white/[0.06]"
            >
              <ClipboardHistoryPanel onClose={() => setShowClipboard(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action categories */}
        <div className="px-2 py-2 space-y-1">
          {categories.map(cat => {
            const meta = CATEGORY_META[cat];
            const actions = groupedActions[cat];
            const isExpanded = expandedCategory === cat;
            const CatIcon = ICON_MAP[meta.icon] || Sparkles;

            if (actions.length === 0) return null;

            return (
              <div key={cat}>
                {/* Category header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors group"
                >
                  {isExpanded
                    ? <ChevronDown size={10} className="text-white/20" />
                    : <ChevronRight size={10} className="text-white/20" />
                  }
                  <CatIcon size={12} className={meta.color} />
                  <span className="text-[10px] text-white/50" style={{ fontWeight: 500 }}>
                    {meta.label}
                  </span>
                  <span className="text-[8px] text-white/15 ml-auto">{actions.length}</span>
                </button>

                {/* Actions */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 space-y-0.5"
                    >
                      {actions.map(action => {
                        const Icon = getActionIcon(action.icon);
                        const isProcessing = processing[action.id];
                        const isDisabled = action.requiresSelection && !hasSelection && !currentCode;

                        return (
                          <button
                            key={action.id}
                            onClick={() => handleExecute(action)}
                            disabled={isProcessing || isDisabled}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors group ${
                              isDisabled
                                ? 'opacity-30 cursor-not-allowed'
                                : isProcessing
                                  ? 'bg-[#667eea]/5 cursor-wait'
                                  : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
                            }`}
                            title={`${action.description}${action.shortcut ? ` (${action.shortcut})` : ''}`}
                          >
                            {isProcessing
                              ? <Loader size={12} className="animate-spin text-[#667eea]" />
                              : <Icon size={12} className={`${meta.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                            }
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors truncate">
                                  {action.title}
                                </span>
                                {action.requiresAI && (
                                  <Sparkles size={8} className="text-amber-400/40 shrink-0" />
                                )}
                              </div>
                            </div>
                            {action.shortcut && (
                              <span className="text-[8px] text-white/10 shrink-0 font-mono">
                                {action.shortcut}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* No selection hint */}
        {!hasSelection && !currentCode && (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <Code2 size={24} className="text-white/10 mb-2" />
            <span className="text-[10px] text-white/20">选中代码或文本以启用操作</span>
            <span className="text-[9px] text-white/10 mt-0.5">或在编辑器中打开文件</span>
          </div>
        )}
      </div>

      {/* Result viewer */}
      <AnimatePresence>
        {actionResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t border-white/[0.06] max-h-[50%] flex flex-col"
          >
            <ActionResultViewer
              result={actionResult.result}
              actionTitle={actionResult.title}
              onClose={() => setActionResult(null)}
              onCopy={handleCopyResult}
              onApply={onApplyReplace ? handleApplyReplace : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-white/[0.06] shrink-0">
        <span className="text-[8px] text-white/10">
          {availableActions.length} 项操作可用
        </span>
        {language && (
          <span className="text-[8px] text-white/10 bg-white/[0.04] px-1 rounded">{language}</span>
        )}
      </div>
    </div>
  );
}
