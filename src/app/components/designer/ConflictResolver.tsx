import React, { useState, useCallback, useMemo } from 'react';
import {
  X, AlertTriangle, CheckCircle2, GitBranch, ArrowLeft, ArrowRight,
  Shield, ChevronRight, RefreshCw, Zap, Check, Clock, RotateCcw,
  History, ChevronDown, ChevronUp, Eye, Lock, Unlock, UserCog,
  Download, FileJson, FileText as FileTextIcon, Copy, CheckCheck,
  Table2, CheckSquare, XSquare, MinusSquare,
  Search, Filter, ChevronsLeft, ChevronsRight, ChevronLeft
} from 'lucide-react';
import { useDesigner, type CRDTConflict } from '../../store';
import { useThemeTokens } from './hooks/useThemeTokens';
import { Tooltip } from './Tooltip';

/* ================================================================
   Timeline Change Entry — shared with CRDTPanel
   ================================================================ */

interface TimelineEntry {
  id: string;
  peerId: string;
  peerName: string;
  color: string;
  type: 'insert' | 'update' | 'delete' | 'move' | 'lock' | 'unlock' | 'role-change' | 'conflict' | 'rollback';
  target: string;
  timestamp: number;
  snapshotId?: string;
}

const MOCK_TIMELINE: TimelineEntry[] = [
  { id: 'tl-1', peerId: 'self', peerName: '你', color: '#667eea', type: 'update', target: 'comp-1.props.label → "提交订单"', timestamp: Date.now() - 2000, snapshotId: 'snap-001' },
  { id: 'tl-2', peerId: 'peer-alice-001', peerName: 'Alice', color: '#f43f5e', type: 'conflict', target: 'panel-2.layout.w — 本地:8 vs 远程:6', timestamp: Date.now() - 5000, snapshotId: 'snap-002' },
  { id: 'tl-3', peerId: 'peer-bob-002', peerName: 'Bob', color: '#10b981', type: 'update', target: 'comp-6.props.chartType → "bar"', timestamp: Date.now() - 12000, snapshotId: 'snap-003' },
  { id: 'tl-4', peerId: 'peer-alice-001', peerName: 'Alice', color: '#f43f5e', type: 'lock', target: 'panel-1 (概览面板) 已锁定', timestamp: Date.now() - 18000, snapshotId: 'snap-004' },
  { id: 'tl-5', peerId: 'self', peerName: '你', color: '#667eea', type: 'insert', target: 'panel-3 → comp-9 (Button)', timestamp: Date.now() - 25000, snapshotId: 'snap-005' },
  { id: 'tl-6', peerId: 'peer-bob-002', peerName: 'Bob', color: '#10b981', type: 'move', target: 'panel-2 layout → {x:0,y:4,w:6,h:6}', timestamp: Date.now() - 35000, snapshotId: 'snap-006' },
  { id: 'tl-7', peerId: 'peer-charlie-003', peerName: 'Charlie', color: '#f59e0b', type: 'delete', target: 'comp-old-7 (已移除)', timestamp: Date.now() - 48000, snapshotId: 'snap-007' },
  { id: 'tl-8', peerId: 'self', peerName: '你', color: '#667eea', type: 'update', target: 'comp-3.props.columns → ["名称","状态","操作"]', timestamp: Date.now() - 60000, snapshotId: 'snap-008' },
  { id: 'tl-9', peerId: 'peer-alice-001', peerName: 'Alice', color: '#f43f5e', type: 'unlock', target: 'panel-1 (概览面板) 已解锁', timestamp: Date.now() - 72000, snapshotId: 'snap-009' },
  { id: 'tl-10', peerId: 'peer-bob-002', peerName: 'Bob', color: '#10b981', type: 'conflict', target: 'comp-2.props.value — 本地:"总收入" vs 远程:"净利润"', timestamp: Date.now() - 90000, snapshotId: 'snap-010' },
];

export function ConflictResolver() {
  const {
    conflictResolverOpen, toggleConflictResolver, conflicts,
    resolveConflict, resolveAllConflicts, syncStatus, crdtPeers, crdtDocVersion
  } = useDesigner();
  const t = useThemeTokens();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'conflicts' | 'timeline'>('conflicts');
  const [timeline, setTimeline] = useState<TimelineEntry[]>(MOCK_TIMELINE);
  const [rollbackTarget, setRollbackTarget] = useState<string | null>(null);
  const [rollbackConfirm, setRollbackConfirm] = useState(false);
  const [rollbackDone, setRollbackDone] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);

  // ── Timeline filter/pagination state ──
  const [tlSearch, setTlSearch] = useState('');
  const [tlTypeFilter, setTlTypeFilter] = useState<string | null>(null);
  const [tlPeerFilter, setTlPeerFilter] = useState<string | null>(null);
  const [tlPage, setTlPage] = useState(0);
  const TL_PAGE_SIZE = 8;

  // Derived: unique peers in timeline
  const tlPeers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    timeline.forEach(e => { if (!map.has(e.peerId)) map.set(e.peerId, { id: e.peerId, name: e.peerName, color: e.color }); });
    return Array.from(map.values());
  }, [timeline]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    let result = timeline;
    if (tlSearch.trim()) {
      const q = tlSearch.toLowerCase();
      result = result.filter(e =>
        e.peerName.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        (e.snapshotId && e.snapshotId.toLowerCase().includes(q))
      );
    }
    if (tlTypeFilter) {
      result = result.filter(e => e.type === tlTypeFilter);
    }
    if (tlPeerFilter) {
      result = result.filter(e => e.peerId === tlPeerFilter);
    }
    return result;
  }, [timeline, tlSearch, tlTypeFilter, tlPeerFilter]);

  const tlTotalPages = Math.max(1, Math.ceil(filteredTimeline.length / TL_PAGE_SIZE));
  const tlPagedEntries = filteredTimeline.slice(tlPage * TL_PAGE_SIZE, (tlPage + 1) * TL_PAGE_SIZE);

  // Reset page when filters change
  const resetTlPage = useCallback(() => setTlPage(0), []);

  const handleRollback = useCallback((entryId: string) => {
    setRollbackTarget(entryId);
    setRollbackConfirm(true);
  }, []);

  const confirmRollback = useCallback(() => {
    if (!rollbackTarget) return;
    const entry = timeline.find(e => e.id === rollbackTarget);
    if (!entry) return;

    // Add rollback entry to timeline
    const rollbackEntry: TimelineEntry = {
      id: 'tl-rb-' + Date.now(),
      peerId: 'self',
      peerName: '你',
      color: '#667eea',
      type: 'rollback',
      target: `回滚到 ${entry.snapshotId} — ${entry.target}`,
      timestamp: Date.now(),
      snapshotId: 'snap-rb-' + Date.now(),
    };
    setTimeline(prev => [rollbackEntry, ...prev]);
    setRollbackDone(rollbackTarget);
    setRollbackConfirm(false);
    setRollbackTarget(null);

    // Clear rollback visual after 3s
    setTimeout(() => setRollbackDone(null), 3000);
  }, [rollbackTarget, timeline]);

  const formatTimeAbsolute = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const exportAsJSON = useCallback(() => {
    const unresolvedCount = conflicts.filter(c => !c.resolved).length;
    const resolvedCount = conflicts.filter(c => c.resolved).length;
    const data = {
      exportedAt: new Date().toISOString(),
      crdtDocVersion,
      projectName: 'YYC³ Designer',
      totalEntries: timeline.length,
      conflicts: { unresolved: unresolvedCount, resolved: resolvedCount },
      timeline: timeline.map(e => ({
        id: e.id,
        snapshotId: e.snapshotId,
        peer: e.peerName,
        type: e.type,
        target: e.target,
        timestamp: new Date(e.timestamp).toISOString(),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yyc3-crdt-timeline-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [timeline, crdtDocVersion, conflicts]);

  const exportAsMarkdown = useCallback(() => {
    const unresolvedCount = conflicts.filter(c => !c.resolved).length;
    const resolvedCount = conflicts.filter(c => c.resolved).length;
    const typeLabels: Record<string, string> = {
      insert: '新增', update: '更新', delete: '删除', move: '移动',
      lock: '锁定', unlock: '解锁', 'role-change': '角色变更',
      conflict: '冲突', rollback: '回滚',
    };
    const lines = [
      '# YYC³ CRDT 变更时间线',
      '',
      `> 导出时间: ${new Date().toLocaleString('zh-CN')}`,
      `> CRDT 文档版本: v${crdtDocVersion}`,
      `> 冲突统计: ${unresolvedCount} 未解决, ${resolvedCount} 已解决`,
      `> 时间线条目: ${timeline.length} 条`,
      '',
      '---',
      '',
      '| 时间 | 操作者 | 类型 | 快照 | 描述 |',
      '|------|--------|------|------|------|',
      ...timeline.map(e =>
        `| ${formatTimeAbsolute(e.timestamp)} | ${e.peerName} | ${typeLabels[e.type] || e.type} | ${e.snapshotId || '-'} | ${e.target.replace(/\|/g, '\\|')} |`
      ),
      '',
      '---',
      '',
      '*由 YANYUCLOUD (YYC³) 智能多联式可视化AI编程应用自动生成*',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yyc3-crdt-timeline-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [timeline, crdtDocVersion, conflicts]);

  const copyToClipboard = useCallback(() => {
    const text = timeline.map(e =>
      `[${formatTimeAbsolute(e.timestamp)}] ${e.peerName} (${e.type}) ${e.snapshotId || ''}: ${e.target}`
    ).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    });
  }, [timeline]);

  if (!conflictResolverOpen) return null;

  const unresolved = conflicts.filter(c => !c.resolved);
  const resolved = conflicts.filter(c => c.resolved);
  const selectedConflict = conflicts.find(c => c.id === selectedId);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 5000) return '刚刚';
    if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`;
    return `${Math.floor(diff / 60000)}分钟前`;
  };

  const typeIcon = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'insert': return { symbol: '+', classes: 'bg-emerald-500/15 text-emerald-400' };
      case 'update': return { symbol: '~', classes: 'bg-blue-500/15 text-blue-400' };
      case 'delete': return { symbol: '-', classes: 'bg-red-500/15 text-red-400' };
      case 'move': return { symbol: '↕', classes: 'bg-amber-500/15 text-amber-400' };
      case 'lock': return { symbol: '🔒', classes: 'bg-amber-500/15 text-amber-400' };
      case 'unlock': return { symbol: '🔓', classes: 'bg-emerald-500/15 text-emerald-400' };
      case 'role-change': return { symbol: '👤', classes: 'bg-purple-500/15 text-purple-400' };
      case 'conflict': return { symbol: '⚡', classes: 'bg-red-500/15 text-red-400' };
      case 'rollback': return { symbol: '⏪', classes: `${t.rollbackBg} ${t.rollbackText}` };
      default: return { symbol: '?', classes: 'bg-white/[0.06] text-white/40' };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className={`absolute inset-0 ${t.overlayBg} backdrop-blur-md`} onClick={toggleConflictResolver} />
      <div
        className={`relative w-[900px] max-h-[85vh] ${t.modalBg} border ${t.modalBorder} rounded-2xl flex flex-col overflow-hidden`}
        style={{ boxShadow: t.modalShadow }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.sectionBorder}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1">
            <div className={`text-[14px] ${t.textPrimary}`}>CRDT 冲突解析器</div>
            <div className={`text-[11px] ${t.textTertiary}`}>
              {unresolved.length} 个未解决冲突 · {resolved.length} 个已解决 · v{crdtDocVersion} · {timeline.length} 条时间线
            </div>
          </div>

          {/* View Switcher */}
          <div className={`flex items-center ${t.inputBg} rounded-lg p-0.5 mr-2`}>
            <button
              onClick={() => setActiveView('conflicts')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] transition-all ${
                activeView === 'conflicts'
                  ? `${t.activeBg} ${t.activeTabText}`
                  : `${t.textTertiary} hover:text-white/50`
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              冲突 ({unresolved.length})
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] transition-all ${
                activeView === 'timeline'
                  ? `${t.activeBg} ${t.activeTabText}`
                  : `${t.textTertiary} hover:text-white/50`
              }`}
            >
              <History className="w-3 h-3" />
              时间线 ({timeline.length})
            </button>
          </div>

          {activeView === 'conflicts' && unresolved.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => resolveAllConflicts('local')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 text-[10px] hover:bg-indigo-500/25 transition-all"
              >
                <ArrowLeft className="w-3 h-3" />
                全部采用本地
              </button>
              <button
                onClick={() => resolveAllConflicts('remote')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] hover:bg-amber-500/25 transition-all"
              >
                全部采用远程
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
          <button onClick={toggleConflictResolver} className={`p-2 rounded-lg ${t.textMuted} hover:text-white/60 ${t.hoverBg} transition-all`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {activeView === 'conflicts' ? (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Conflict list */}
            <div className={`w-[300px] border-r ${t.sectionBorder} overflow-y-auto`}>
              {unresolved.length === 0 && resolved.length === 0 && (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400/30 mx-auto mb-3" />
                  <div className={`text-[13px] ${t.textTertiary}`}>无冲突</div>
                  <div className={`text-[10px] ${t.textMuted} mt-1`}>所有 CRDT 文档版本一致</div>
                  <button
                    onClick={() => setActiveView('timeline')}
                    className={`mt-3 text-[10px] ${t.accent} hover:underline`}
                  >
                    查看时间线 →
                  </button>
                </div>
              )}

              {unresolved.length > 0 && (
                <div className={`px-3 py-2 text-[10px] text-red-400/60 bg-red-500/[0.04] border-b ${t.sectionBorder} flex items-center gap-1.5`}>
                  <AlertTriangle className="w-3 h-3" />
                  {unresolved.length} 个未解决
                </div>
              )}
              {unresolved.map(c => (
                <ConflictItem key={c.id} conflict={c} selected={selectedId === c.id} onClick={() => setSelectedId(c.id)} formatTime={formatTime} />
              ))}

              {resolved.length > 0 && (
                <div className={`px-3 py-2 text-[10px] text-emerald-400/60 bg-emerald-500/[0.04] border-b ${t.sectionBorder} flex items-center gap-1.5`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {resolved.length} 个已��决
                </div>
              )}
              {resolved.map(c => (
                <ConflictItem key={c.id} conflict={c} selected={selectedId === c.id} onClick={() => setSelectedId(c.id)} formatTime={formatTime} />
              ))}
            </div>

            {/* Detail pane */}
            <div className="flex-1 overflow-y-auto p-5">
              {!selectedConflict ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-white/15">
                  <GitBranch className="w-12 h-12" />
                  <div className="text-[13px]">选择一个冲突查看详情</div>
                  <div className="text-[10px]">左侧列表点击冲突项</div>
                </div>
              ) : (
                <ConflictDetail
                  conflict={selectedConflict}
                  onResolve={(resolution) => resolveConflict(selectedConflict.id, resolution)}
                  crdtPeers={crdtPeers}
                />
              )}
            </div>
          </div>
        ) : (
          /* Timeline View */
          <div className="flex-1 overflow-y-auto p-5">
            {/* Timeline header info */}
            <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${t.surfaceInset} border ${t.surfaceInsetBorder}`}>
              <Clock className={`w-4 h-4 ${t.accent} shrink-0`} />
              <div className="flex-1">
                <div className={`text-[11px] ${t.textSecondary}`}>CRDT 变更时间线</div>
                <div className={`text-[10px] ${t.textMuted} mt-0.5`}>
                  点击「回滚」按钮可将文档恢复到该时间点之前的状态。回滚操作会通过 CRDT 广播给所有协作者。
                </div>
              </div>
              {/* Export actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Tooltip label="导出为 JSON" side="top">
                  <button
                    onClick={exportAsJSON}
                    className={`p-1.5 rounded-lg ${t.textMuted} hover:text-emerald-400 ${t.hoverBg} transition-all`}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Tooltip label="导出为 Markdown" side="top">
                  <button
                    onClick={exportAsMarkdown}
                    className={`p-1.5 rounded-lg ${t.textMuted} hover:text-blue-400 ${t.hoverBg} transition-all`}
                  >
                    <FileTextIcon className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Tooltip label={exportCopied ? '已复制' : '复制到剪贴板'} side="top">
                  <button
                    onClick={copyToClipboard}
                    className={`p-1.5 rounded-lg ${exportCopied ? 'text-emerald-400' : t.textMuted} hover:text-white/50 ${t.hoverBg} transition-all`}
                  >
                    {exportCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </Tooltip>
              </div>
              <span className={`text-[9px] ${t.textMuted}`}>{timeline.length} 条记录</span>
            </div>

            {/* ── Search / Filter / Pagination Bar ── */}
            <div className={`flex items-center gap-2 mb-4 p-2.5 rounded-xl ${t.surfaceInset} border ${t.surfaceInsetBorder}`}>
              {/* Search */}
              <div className="flex items-center gap-1.5 flex-1">
                <Search className={`w-3.5 h-3.5 ${t.textMuted} shrink-0`} />
                <input
                  type="text"
                  value={tlSearch}
                  onChange={e => { setTlSearch(e.target.value); resetTlPage(); }}
                  placeholder="搜索操作者、目标、快照..."
                  className={`flex-1 bg-transparent text-[10px] text-white/60 placeholder-white/20 outline-none`}
                />
                {tlSearch && (
                  <button onClick={() => { setTlSearch(''); resetTlPage(); }} className="text-white/20 hover:text-white/40">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="w-px h-5 bg-white/[0.06]" />

              {/* Type filter chips */}
              <div className="flex items-center gap-1">
                <Filter className={`w-3 h-3 ${t.textMuted} shrink-0`} />
                {([
                  { type: null, label: '全部' },
                  { type: 'update', label: '更新' },
                  { type: 'insert', label: '新增' },
                  { type: 'delete', label: '删除' },
                  { type: 'conflict', label: '冲突' },
                  { type: 'lock', label: '锁定' },
                  { type: 'rollback', label: '回滚' },
                ] as { type: string | null; label: string }[]).map(chip => (
                  <button
                    key={chip.label}
                    onClick={() => { setTlTypeFilter(chip.type); resetTlPage(); }}
                    className={`px-1.5 py-0.5 rounded text-[9px] transition-all ${
                      tlTypeFilter === chip.type
                        ? `${t.activeBg} ${t.activeTabText}`
                        : 'text-white/25 hover:text-white/40 hover:bg-white/[0.04]'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-5 bg-white/[0.06]" />

              {/* Peer filter */}
              <div className="flex items-center gap-1">
                {tlPeers.map(peer => (
                  <Tooltip key={peer.id} label={peer.name} side="top">
                    <button
                      onClick={() => { setTlPeerFilter(tlPeerFilter === peer.id ? null : peer.id); resetTlPage(); }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white transition-all ${
                        tlPeerFilter === peer.id ? 'ring-2 ring-white/30 scale-110' : 'opacity-50 hover:opacity-80'
                      }`}
                      style={{ backgroundColor: peer.color }}
                    >
                      {peer.name[0]}
                    </button>
                  </Tooltip>
                ))}
                {tlPeerFilter && (
                  <button onClick={() => { setTlPeerFilter(null); resetTlPage(); }} className="text-[8px] text-white/20 hover:text-white/40 ml-0.5">
                    清除
                  </button>
                )}
              </div>

              <div className="w-px h-5 bg-white/[0.06]" />

              {/* Filter stats */}
              <span className={`text-[9px] ${t.textMuted} shrink-0`}>
                {filteredTimeline.length}/{timeline.length}
              </span>
            </div>

            {/* Timeline entries */}
            <div className="relative">
              {/* Vertical track line */}
              <div className={`absolute left-[18px] top-2 bottom-2 w-px ${t.timelineTrack}`} />

              <div className="space-y-0.5">
                {tlPagedEntries.map((entry, idx) => {
                  const ti = typeIcon(entry.type);
                  const isRolledBack = rollbackDone === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className={`relative flex items-start gap-3 pl-1 pr-3 py-2.5 rounded-lg transition-all ${
                        isRolledBack ? `${t.rollbackBg} border ${t.rollbackBorder}` : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 flex items-center justify-center w-9 shrink-0">
                        <div
                          className="w-3 h-3 rounded-full border-2"
                          style={{
                            backgroundColor: entry.type === 'conflict' ? '#ef4444' : entry.type === 'rollback' ? '#f97316' : entry.color,
                            borderColor: 'rgba(13,14,20,0.8)',
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-4.5 h-4.5 rounded flex items-center justify-center text-[8px] shrink-0 ${ti.classes}`}>
                            {ti.symbol}
                          </div>
                          <span className="text-[11px] truncate" style={{ color: entry.color }}>{entry.peerName}</span>
                          <span className={`text-[9px] ${t.textMuted}`}>·</span>
                          <span className={`text-[9px] ${t.textMuted}`}>{formatTime(entry.timestamp)}</span>
                          {entry.type === 'conflict' && (
                            <Tooltip label="跳转到冲突列表" side="top">
                              <button
                                onClick={() => {
                                  setActiveView('conflicts');
                                  // Try to find matching conflict by target text
                                  const matching = conflicts.find(c =>
                                    entry.target.includes(c.path) || c.path.includes(entry.target.split(' ')[0])
                                  );
                                  if (matching) setSelectedId(matching.id);
                                  else if (conflicts.length > 0) setSelectedId(conflicts[0].id);
                                }}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all shrink-0"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" />
                                查看冲突
                              </button>
                            </Tooltip>
                          )}
                          {entry.snapshotId && (
                            <span className={`text-[8px] ${t.textMuted} font-mono ml-auto shrink-0`}>{entry.snapshotId}</span>
                          )}
                        </div>
                        <div className={`text-[10px] text-white/35 mt-0.5 font-mono truncate`}>
                          {entry.target}
                        </div>
                      </div>

                      {/* Rollback button */}
                      {entry.type !== 'rollback' && (
                        <Tooltip label={`回滚到此时间点 (${entry.snapshotId})`} side="top">
                          <button
                            onClick={() => handleRollback(entry.id)}
                            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[9px] ${t.rollbackText} ${t.rollbackBg} border ${t.rollbackBorder} hover:opacity-80 transition-all opacity-0 group-hover:opacity-100`}
                            style={{ opacity: undefined }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                          >
                            <RotateCcw className="w-3 h-3" />
                            回滚
                          </button>
                        </Tooltip>
                      )}
                      {entry.type === 'rollback' && (
                        <span className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[9px] ${t.rollbackText} ${t.rollbackBg} border ${t.rollbackBorder}`}>
                          <RotateCcw className="w-3 h-3" />
                          已回滚
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rollback strategy note */}
            <div className={`mt-4 p-3 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/10 flex items-start gap-2`}>
              <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] text-cyan-400/80">选择性回滚策略</div>
                <div className="text-[10px] text-white/30 mt-0.5 leading-relaxed">
                  CRDT 回滚基于快照机制：每次变更都会生成一个 snapshot ID，回滚时系统会将 Y.Doc 恢复到目标快照，
                  并通过 WebSocket 广播 undo 操作给所有在线协作者。冲突条目会被标记为已解决 (rolled back)。
                  连续回滚遵循 Last-Rollback-Wins 策略。
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setTlPage(prev => Math.max(0, prev - 1))}
                className={`px-2 py-1.5 rounded-lg ${t.badgeBg} ${t.textTertiary} text-[11px] ${t.hoverBg} transition-all ${tlPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={tlPage === 0}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className={`text-[10px] ${t.textMuted}`}>
                {tlPage + 1} / {tlTotalPages}
              </span>
              <button
                onClick={() => setTlPage(prev => Math.min(tlTotalPages - 1, prev + 1))}
                className={`px-2 py-1.5 rounded-lg ${t.badgeBg} ${t.textTertiary} text-[11px] ${t.hoverBg} transition-all ${tlPage === tlTotalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={tlPage === tlTotalPages - 1}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Rollback Confirmation Dialog */}
        {rollbackConfirm && rollbackTarget && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className={`w-[400px] ${t.modalBg} border ${t.modalBorder} rounded-xl p-5`} style={{ boxShadow: t.modalShadow }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/20 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className={`text-[13px] ${t.textPrimary}`}>确认回滚</div>
                  <div className={`text-[10px] ${t.textTertiary} mt-0.5`}>
                    此操作将通过 CRDT 广播给所有协作者
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${t.surfaceInset} border ${t.surfaceInsetBorder} mb-4`}>
                <div className={`text-[10px] ${t.textTertiary}`}>回滚目标</div>
                <div className="text-[11px] text-white/50 mt-1 font-mono">
                  {timeline.find(e => e.id === rollbackTarget)?.target || '—'}
                </div>
                <div className={`text-[9px] ${t.textMuted} mt-1`}>
                  快照: {timeline.find(e => e.id === rollbackTarget)?.snapshotId || '—'} · {formatTime(timeline.find(e => e.id === rollbackTarget)?.timestamp || 0)}
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setRollbackConfirm(false); setRollbackTarget(null); }}
                  className={`px-4 py-2 rounded-lg ${t.badgeBg} ${t.textTertiary} text-[11px] ${t.hoverBg} transition-all`}
                >
                  取消
                </button>
                <button
                  onClick={confirmRollback}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-[11px] hover:bg-orange-500/30 transition-all border border-orange-500/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  确认回滚
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-3 border-t ${t.sectionBorder} ${t.surfaceInset}`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'conflict' ? 'bg-red-400 animate-pulse' : syncStatus === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className={`text-[10px] ${t.textMuted}`}>
              {syncStatus === 'conflict' ? 'CRDT 冲突待解决' : syncStatus === 'pending' ? '正在同步...' : '文档已同步'}
            </span>
            <span className={`text-[10px] ${t.textMuted}`}>·</span>
            <span className={`text-[10px] ${t.textMuted}`}>
              {timeline.filter(e => e.type === 'rollback').length} 次回滚
            </span>
          </div>
          <button onClick={toggleConflictResolver} className={`px-4 py-1.5 rounded-lg ${t.badgeBg} ${t.textTertiary} text-[11px] ${t.hoverBg} transition-all`}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Conflict List Item
   ================================================================ */

function ConflictItem({ conflict, selected, onClick, formatTime }: {
  conflict: CRDTConflict;
  selected: boolean;
  onClick: () => void;
  formatTime: (ts: number) => string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-white/[0.04] transition-all ${
        selected ? 'bg-indigo-500/[0.08] border-l-2 border-l-indigo-500' :
        conflict.resolved ? 'hover:bg-white/[0.02] opacity-60' : 'hover:bg-white/[0.03]'
      }`}
    >
      <div className="flex items-center gap-2">
        {conflict.resolved ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
        )}
        <span className="text-[11px] text-white/60 font-mono truncate flex-1">{conflict.path}</span>
      </div>
      <div className="flex items-center gap-2 mt-1.5 ml-5.5">
        <span className="text-[9px] text-white/25">{conflict.remotePeer}</span>
        <span className="text-[9px] text-white/15">·</span>
        <span className="text-[9px] text-white/15">{formatTime(conflict.timestamp)}</span>
        {conflict.resolved && (
          <span className={`text-[8px] px-1.5 py-0.5 rounded ml-auto ${
            conflict.resolution === 'local' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-amber-500/15 text-amber-400'
          }`}>
            {conflict.resolution === 'local' ? '本地' : '远程'}
          </span>
        )}
      </div>
    </button>
  );
}

/* ================================================================
   Conflict Detail — Side-by-side diff
   ================================================================ */

function ConflictDetail({ conflict, onResolve, crdtPeers }: {
  conflict: CRDTConflict;
  onResolve: (resolution: 'local' | 'remote') => void;
  crdtPeers: any[];
}) {
  const peer = crdtPeers.find(p => p.name === conflict.remotePeer);
  const peerColor = peer?.color || '#f59e0b';

  return (
    <div className="space-y-4">
      {/* Path info */}
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${conflict.resolved ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
        <code className="text-[13px] text-white/70 font-mono">{conflict.path}</code>
        {conflict.resolved && (
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg ml-auto flex items-center gap-1">
            <Check className="w-3 h-3" />
            已解决 ({conflict.resolution === 'local' ? '本地' : '远程'})
          </span>
        )}
      </div>

      {/* Side-by-side diff */}
      <div className="grid grid-cols-2 gap-3">
        {/* Local */}
        <div className={`rounded-xl border overflow-hidden ${
          conflict.resolved && conflict.resolution === 'local' ? 'border-indigo-500/40 ring-1 ring-indigo-500/20' : 'border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/[0.06] border-b border-white/[0.06]">
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] text-white">你</div>
            <span className="text-[11px] text-indigo-400">本地值</span>
            <span className="text-[9px] text-white/20 ml-auto">LOCAL</span>
          </div>
          <div className="p-3">
            <pre className="text-[12px] font-mono text-white/60 whitespace-pre-wrap break-all bg-white/[0.02] rounded-lg p-3">
              {typeof conflict.localValue === 'object'
                ? JSON.stringify(conflict.localValue, null, 2)
                : String(conflict.localValue)
              }
            </pre>
          </div>
          {!conflict.resolved && (
            <div className="px-3 pb-3">
              <button
                onClick={() => onResolve('local')}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-500/15 text-indigo-400 text-[11px] hover:bg-indigo-500/25 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                采用本地值
              </button>
            </div>
          )}
        </div>

        {/* Remote */}
        <div className={`rounded-xl border overflow-hidden ${
          conflict.resolved && conflict.resolution === 'remote' ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/[0.06] border-b border-white/[0.06]">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: peerColor }}>
              {conflict.remotePeer[0]}
            </div>
            <span className="text-[11px] text-amber-400">{conflict.remotePeer}</span>
            <span className="text-[9px] text-white/20 ml-auto">REMOTE</span>
          </div>
          <div className="p-3">
            <pre className="text-[12px] font-mono text-white/60 whitespace-pre-wrap break-all bg-white/[0.02] rounded-lg p-3">
              {typeof conflict.remoteValue === 'object'
                ? JSON.stringify(conflict.remoteValue, null, 2)
                : String(conflict.remoteValue)
              }
            </pre>
          </div>
          {!conflict.resolved && (
            <div className="px-3 pb-3">
              <button
                onClick={() => onResolve('remote')}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/15 text-amber-400 text-[11px] hover:bg-amber-500/25 transition-all"
              >
                采用远程值
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resolution explanation */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[11px] text-cyan-400/80">冲突解析策略</div>
            <div className="text-[10px] text-white/30 mt-0.5 leading-relaxed">
              CRDT (Conflict-free Replicated Data Type) 通常通过 Last-Writer-Wins 或 Multi-Value Register 自动合并。
              当两个用户同时修改同一字段的不同值时，需要人工选择保留哪个版本。
              选择后变更将写入 Y.Doc 并通过 WebSocket 广播给所有协作者。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}