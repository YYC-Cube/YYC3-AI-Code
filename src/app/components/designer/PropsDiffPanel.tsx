import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  GitCompareArrows, RotateCcw, Check, ChevronDown,
  ArrowRight, Minus, Plus, X, History, Eye, AlertTriangle, FileText
} from 'lucide-react';
import { useDesigner } from '../../store';
import { copyToClipboard } from '../../utils/clipboard';
import { useThemeTokens } from './hooks/useThemeTokens';
import { Tooltip } from './Tooltip';

/* ================================================================
   Types
   ================================================================ */

interface PropChange {
  key: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
}

interface PropsSnapshot {
  componentId: string;
  props: Record<string, any>;
  timestamp: number;
  label?: string;
}

/* ================================================================
   Diff Engine — compare two prop objects
   ================================================================ */

function diffProps(
  oldProps: Record<string, any>,
  newProps: Record<string, any>
): PropChange[] {
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
  const changes: PropChange[] = [];

  allKeys.forEach(key => {
    const oldVal = oldProps[key];
    const newVal = newProps[key];
    const oldExists = key in oldProps;
    const newExists = key in newProps;

    if (!oldExists && newExists) {
      changes.push({ key, oldValue: undefined, newValue: newVal, type: 'added' });
    } else if (oldExists && !newExists) {
      changes.push({ key, oldValue: oldVal, newValue: undefined, type: 'removed' });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ key, oldValue: oldVal, newValue: newVal, type: 'modified' });
    } else {
      changes.push({ key, oldValue: oldVal, newValue: newVal, type: 'unchanged' });
    }
  });

  // Sort: modified first, then added, removed, unchanged
  const order = { modified: 0, added: 1, removed: 2, unchanged: 3 };
  return changes.sort((a, b) => order[a.type] - order[b.type]);
}

function formatValue(val: any): string {
  if (val === undefined) return '—';
  if (val === null) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return `"${val}"`;
  if (Array.isArray(val)) return `[${val.map(formatValue).join(', ')}]`;
  return JSON.stringify(val);
}

/* ================================================================
   PropsDiffPanel — shows before/after comparison
   ================================================================ */

export function PropsDiffPanel() {
  const t = useThemeTokens();
  const {
    selectedComponentId, components, updateComponentProps,
  } = useDesigner();

  const selectedComponent = components.find(c => c.id === selectedComponentId);

  // Track snapshots history per component
  const snapshotsRef = useRef<Map<string, PropsSnapshot[]>>(new Map());
  const prevPropsRef = useRef<Record<string, any> | null>(null);
  const [activeSnapshot, setActiveSnapshot] = useState<PropsSnapshot | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportedMd, setExportedMd] = useState(false);

  // When selected component changes, save a snapshot of the new component's initial props
  useEffect(() => {
    if (!selectedComponent) {
      prevPropsRef.current = null;
      setActiveSnapshot(null);
      return;
    }

    // If we have no snapshot for this component yet, save initial
    const existing = snapshotsRef.current.get(selectedComponent.id);
    if (!existing || existing.length === 0) {
      const snap: PropsSnapshot = {
        componentId: selectedComponent.id,
        props: { ...selectedComponent.props },
        timestamp: Date.now(),
        label: '初始状态',
      };
      snapshotsRef.current.set(selectedComponent.id, [snap]);
      prevPropsRef.current = { ...selectedComponent.props };
    } else {
      prevPropsRef.current = { ...existing[existing.length - 1].props };
    }
  }, [selectedComponentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track property changes — save new snapshot on each prop update
  useEffect(() => {
    if (!selectedComponent || !prevPropsRef.current) return;

    const currentStr = JSON.stringify(selectedComponent.props);
    const prevStr = JSON.stringify(prevPropsRef.current);

    if (currentStr !== prevStr) {
      const snaps = snapshotsRef.current.get(selectedComponent.id) || [];
      // Only save if meaningfully different from the last snapshot
      const lastSnap = snaps[snaps.length - 1];
      if (!lastSnap || JSON.stringify(lastSnap.props) !== currentStr) {
        const snap: PropsSnapshot = {
          componentId: selectedComponent.id,
          props: { ...selectedComponent.props },
          timestamp: Date.now(),
        };
        snapshotsRef.current.set(selectedComponent.id, [...snaps.slice(-19), snap]);
      }
    }
  }, [selectedComponent?.props]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute diff
  const diff = useMemo(() => {
    if (!selectedComponent || !prevPropsRef.current) return [];
    const compareWith = activeSnapshot?.props || prevPropsRef.current;
    return diffProps(compareWith, selectedComponent.props);
  }, [selectedComponent?.props, activeSnapshot, selectedComponent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const changedCount = diff.filter(d => d.type !== 'unchanged').length;
  const history = selectedComponent
    ? (snapshotsRef.current.get(selectedComponent.id) || [])
    : [];

  // Rollback to snapshot
  const handleRollback = useCallback((snapshot: PropsSnapshot) => {
    if (!selectedComponent) return;
    updateComponentProps(selectedComponent.id, snapshot.props);
    setActiveSnapshot(null);
  }, [selectedComponent, updateComponentProps]);

  // Rollback individual prop
  const handleRollbackProp = useCallback((key: string, oldValue: any) => {
    if (!selectedComponent || oldValue === undefined) return;
    updateComponentProps(selectedComponent.id, { [key]: oldValue });
  }, [selectedComponent, updateComponentProps]);

  if (!selectedComponent) return null;
  if (changedCount === 0 && !activeSnapshot) return null;

  const changeTypeConfig = {
    added: { icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.06]', border: 'border-emerald-500/15', label: '新增' },
    removed: { icon: Minus, color: 'text-red-400', bg: 'bg-red-500/[0.06]', border: 'border-red-500/15', label: '删除' },
    modified: { icon: ArrowRight, color: 'text-amber-400', bg: 'bg-amber-500/[0.06]', border: 'border-amber-500/15', label: '修改' },
    unchanged: { icon: Check, color: 'text-white/20', bg: 'bg-white/[0.02]', border: 'border-white/[0.04]', label: '不变' },
  };

  const displayDiff = showUnchanged ? diff : diff.filter(d => d.type !== 'unchanged');

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitCompareArrows className={`w-3.5 h-3.5 ${t.accent}`} />
        <span className={`text-[10px] ${t.textMuted} uppercase tracking-wider flex-1`}>
          属性变更 Diff
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded ${changedCount > 0 ? 'text-amber-400/70 bg-amber-500/10' : 'text-emerald-400/60 bg-emerald-500/10'}`}>
          {changedCount > 0 ? `${changedCount} 项变更` : '无变更'}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* History dropdown */}
        {history.length > 1 && (
          <div className="relative">
            <Tooltip label="属性变更历史" side="top">
              <button
                onClick={() => setHistoryOpen(prev => !prev)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] ${t.textTertiary} hover:text-white/50 ${t.hoverBg} transition-all`}
              >
                <History className="w-3 h-3" />
                {history.length} 版本
                <ChevronDown className={`w-2.5 h-2.5 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
              </button>
            </Tooltip>

            {historyOpen && (
              <div
                className={`absolute top-full left-0 mt-1 w-[200px] ${t.modalBg} border ${t.modalBorder} rounded-lg overflow-hidden z-50`}
                style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)' }}
              >
                <div className="max-h-[160px] overflow-y-auto p-1 space-y-0.5">
                  {[...history].reverse().map((snap, i) => {
                    const isActive = activeSnapshot?.timestamp === snap.timestamp;
                    const time = new Date(snap.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    });
                    return (
                      <button
                        key={snap.timestamp}
                        onClick={() => {
                          setActiveSnapshot(isActive ? null : snap);
                          setHistoryOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${
                          isActive
                            ? `${t.accentBg} border ${t.accentBorder}`
                            : `hover:bg-white/[0.04] border border-transparent`
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-emerald-400' : 'bg-white/15'}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-[10px] ${isActive ? t.accent : t.textSecondary} truncate`}>
                            {snap.label || `版本 ${history.length - i}`}
                          </div>
                          <div className={`text-[8px] ${t.textMuted}`}>{time}</div>
                        </div>
                        {isActive && <Eye className={`w-3 h-3 ${t.accent} shrink-0`} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle unchanged */}
        <button
          onClick={() => setShowUnchanged(prev => !prev)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] ${showUnchanged ? t.accent : t.textTertiary} ${t.hoverBg} transition-all`}
        >
          <Eye className="w-3 h-3" />
          {showUnchanged ? '隐藏不变' : '显示全部'}
        </button>

        {/* Export Markdown changelog */}
        {changedCount > 0 && (
          <Tooltip label="导出 Markdown 变更日志" side="top">
            <button
              onClick={() => {
                const ts = new Date().toLocaleString('zh-CN');
                const lines = [
                  `## 属性变更日志`,
                  ``,
                  `- **组件**: \`${selectedComponent?.label}\` (\`${selectedComponent?.type}\`)`,
                  `- **时间**: ${ts}`,
                  ``,
                  `| 属性 | 类型 | 旧值 | 新值 |`,
                  `|------|------|------|------|`,
                  ...diff.filter(d => d.type !== 'unchanged').map(d => {
                    const typeLabel = d.type === 'added' ? '新增' : d.type === 'removed' ? '删除' : '修改';
                    return `| \`${d.key}\` | ${typeLabel} | ${d.type === 'added' ? '—' : '\`' + formatValue(d.oldValue) + '\`'} | ${d.type === 'removed' ? '—' : '\`' + formatValue(d.newValue) + '\`'} |`;
                  }),
                  ``,
                  `> 共 ${changedCount} 项变更`,
                ];
                const md = lines.join('\n');
                copyToClipboard(md);
                setExportedMd(true);
                setTimeout(() => setExportedMd(false), 2000);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] ${exportedMd ? 'text-emerald-400' : t.textTertiary} ${t.hoverBg} transition-all`}
            >
              {exportedMd ? <Check className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {exportedMd ? '已复制' : 'MD'}
            </button>
          </Tooltip>
        )}

        {/* Rollback all */}
        {changedCount > 0 && (
          <Tooltip label="一键回滚到上一个快照" side="top">
            <button
              onClick={() => {
                const compareSnap = activeSnapshot || (history.length > 0 ? history[history.length - 1] : null);
                if (compareSnap) handleRollback(compareSnap);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] text-red-400/70 hover:text-red-400 bg-red-500/[0.04] hover:bg-red-500/[0.08] transition-all ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              全部回滚
            </button>
          </Tooltip>
        )}
      </div>

      {/* Comparing indicator */}
      {activeSnapshot && (
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${t.accentBg} border ${t.accentBorder}`}>
          <AlertTriangle className={`w-3 h-3 ${t.accent} shrink-0`} />
          <span className={`text-[9px] ${t.accent}`}>
            对比:「{activeSnapshot.label || new Date(activeSnapshot.timestamp).toLocaleTimeString('zh-CN')}」
          </span>
          <button
            onClick={() => setActiveSnapshot(null)}
            className={`ml-auto p-0.5 rounded ${t.hoverBg}`}
          >
            <X className={`w-2.5 h-2.5 ${t.textMuted}`} />
          </button>
        </div>
      )}

      {/* Diff entries */}
      <div className="space-y-1">
        {displayDiff.map(change => {
          const cfg = changeTypeConfig[change.type];
          const Icon = cfg.icon;

          return (
            <div
              key={change.key}
              className={`px-2.5 py-2 rounded-lg ${cfg.bg} border ${cfg.border} transition-all`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3 h-3 ${cfg.color} shrink-0`} />
                <span className={`text-[10px] ${t.textSecondary} font-mono flex-1 truncate`}>
                  {change.key}
                </span>
                <span className={`text-[8px] ${cfg.color} shrink-0`}>{cfg.label}</span>
                {change.type !== 'unchanged' && change.type !== 'added' && (
                  <Tooltip label={`回滚「${change.key}」到旧值`} side="top">
                    <button
                      onClick={() => handleRollbackProp(change.key, change.oldValue)}
                      className="p-0.5 rounded hover:bg-white/[0.08] transition-all shrink-0"
                    >
                      <RotateCcw className="w-2.5 h-2.5 text-white/25 hover:text-white/50" />
                    </button>
                  </Tooltip>
                )}
              </div>

              {change.type !== 'unchanged' && (
                <div className="mt-1.5 space-y-0.5 pl-5">
                  {/* Before */}
                  {change.type !== 'added' && (
                    <div className="flex items-center gap-1.5">
                      <Minus className="w-2.5 h-2.5 text-red-400/50 shrink-0" />
                      <code className="text-[9px] text-red-400/60 font-mono truncate bg-red-500/[0.04] px-1.5 py-0.5 rounded">
                        {formatValue(change.oldValue)}
                      </code>
                    </div>
                  )}
                  {/* After */}
                  {change.type !== 'removed' && (
                    <div className="flex items-center gap-1.5">
                      <Plus className="w-2.5 h-2.5 text-emerald-400/50 shrink-0" />
                      <code className="text-[9px] text-emerald-400/60 font-mono truncate bg-emerald-500/[0.04] px-1.5 py-0.5 rounded">
                        {formatValue(change.newValue)}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayDiff.length === 0 && (
        <div className={`text-center py-3 text-[10px] ${t.textMuted}`}>
          <Check className="w-4 h-4 mx-auto mb-1 text-emerald-400/40" />
          属性未发生变化
        </div>
      )}
    </div>
  );
}