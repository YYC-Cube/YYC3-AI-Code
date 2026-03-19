/**
 * @file CollabCursors.tsx
 * @description 远程协作用户光标/选区可视化渲染组件 — 在 Monaco 编辑器中叠加显示远程用户光标位置、
 *   选区高亮、姓名标签，支持自动跟踪/淡出/点击跳转/minimap 位置标记
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-14
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags crdt,awareness,cursor,selection,collaboration,monaco,ai-code
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Users, Eye, EyeOff } from 'lucide-react';
import type { CRDTUser } from '../../hooks/useCRDTCollab';

/* ================================================================
   Types
   ================================================================ */
interface CollabCursorsProps {
  /** Monaco editor instance */
  editor: any;
  /** Monaco module */
  monaco: any;
  /** Remote users with cursor/selection data */
  remoteUsers: CRDTUser[];
  /** Whether the overlay panel is enabled */
  enabled?: boolean;
  /** Current user ID (to exclude self) */
  currentUserId?: string;
  /** Callback when clicking a user's cursor to jump to their position */
  onJumpToUser?: (user: CRDTUser) => void;
  /** Enable minimap cursor markers (default: true) */
  enableMinimapMarkers?: boolean;
}

interface DecorationState {
  cursorDecoIds: string[];
  selectionDecoIds: string[];
  minimapDecoIds: string[];
  widgetDisposables: any[];
}

/* ================================================================
   Helpers
   ================================================================ */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

/* Inject CSS once for cursor decorations */
let cssInjected = false;
function injectCursorCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement('style');
  style.id = 'yyc3-collab-cursors-css';
  style.textContent = `
    /* Remote cursor line (thin vertical bar) */
    .yyc3-remote-cursor {
      width: 2px !important;
      margin-left: -1px;
      animation: yyc3-cursor-blink 1.2s ease-in-out infinite;
    }
    @keyframes yyc3-cursor-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* Remote cursor name label */
    .yyc3-cursor-label {
      position: absolute;
      top: -18px;
      left: -1px;
      padding: 1px 5px;
      border-radius: 3px 3px 3px 0;
      font-size: 9px;
      font-weight: 600;
      line-height: 14px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 100;
      opacity: 0.9;
      transition: opacity 0.3s;
      font-family: system-ui, -apple-system, sans-serif;
      letter-spacing: 0.02em;
    }

    /* Remote selection highlight */
    .yyc3-remote-selection {
      opacity: 0.18;
      border-radius: 2px;
    }

    /* Fade out cursors that are stale (>10s) */
    .yyc3-remote-cursor-stale {
      opacity: 0.3 !important;
    }
    .yyc3-remote-cursor-stale .yyc3-cursor-label {
      opacity: 0.4;
    }
  `;
  document.head.appendChild(style);
}

/* ================================================================
   CollabCursors Component
   ================================================================ */
export function CollabCursors({
  editor,
  monaco,
  remoteUsers,
  enabled = true,
  currentUserId,
  onJumpToUser,
  enableMinimapMarkers = true,
}: CollabCursorsProps) {
  const decoRef = useRef<DecorationState>({
    cursorDecoIds: [],
    selectionDecoIds: [],
    minimapDecoIds: [],
    widgetDisposables: [],
  });
  const [showOverlay, setShowOverlay] = useState(true);
  const cssClassCacheRef = useRef<Map<string, string>>(new Map());

  // Inject CSS on first mount
  useEffect(() => { injectCursorCSS(); }, []);

  /* ── Get or create a CSS class for a user's cursor color ── */
  const getCursorClass = useCallback((color: string, suffix: string): string => {
    const key = `${color}-${suffix}`;
    if (cssClassCacheRef.current.has(key)) return cssClassCacheRef.current.get(key)!;

    const className = `yyc3-rc-${suffix}-${color.replace('#', '')}`;
    const style = document.createElement('style');
    if (suffix === 'cursor') {
      style.textContent = `.${className} { background-color: ${color} !important; }`;
    } else if (suffix === 'selection') {
      style.textContent = `.${className} { background-color: ${hexToRgba(color, 0.18)} !important; }`;
    } else if (suffix === 'label-bg') {
      style.textContent = `.${className} { background-color: ${color}; color: #fff; }`;
    }
    document.head.appendChild(style);
    cssClassCacheRef.current.set(key, className);
    return className;
  }, []);

  /* ── Update decorations whenever remote users change ── */
  useEffect(() => {
    if (!editor || !monaco || !enabled) {
      // Clear decorations when disabled
      if (editor && decoRef.current.cursorDecoIds.length) {
        editor.removeDecorations(decoRef.current.cursorDecoIds);
        editor.removeDecorations(decoRef.current.selectionDecoIds);
        editor.removeDecorations(decoRef.current.minimapDecoIds);
        decoRef.current.widgetDisposables.forEach((d: any) => d.dispose?.());
        decoRef.current = { cursorDecoIds: [], selectionDecoIds: [], minimapDecoIds: [], widgetDisposables: [] };
      }
      return;
    }

    const model = editor.getModel();
    if (!model) return;

    const filteredUsers = remoteUsers.filter(u => u.id !== currentUserId);
    const now = Date.now();

    // ── Build decorations ──
    const cursorDecos: any[] = [];
    const selectionDecos: any[] = [];
    const minimapDecos: any[] = [];

    // Clean up old content widgets
    decoRef.current.widgetDisposables.forEach((d: any) => d.dispose?.());
    const newWidgetDisposables: any[] = [];

    filteredUsers.forEach((user) => {
      const isStale = now - user.lastActive > 10000;
      const cursorClassName = getCursorClass(user.color, 'cursor');
      const selClassName = getCursorClass(user.color, 'selection');
      const labelClassName = getCursorClass(user.color, 'label-bg');

      // ── Cursor decoration ──
      if (user.cursor) {
        const { line, column } = user.cursor;
        const maxLine = model.getLineCount();
        const safeLine = Math.min(Math.max(1, line), maxLine);
        const maxCol = model.getLineMaxColumn(safeLine);
        const safeCol = Math.min(Math.max(1, column), maxCol);

        cursorDecos.push({
          range: new monaco.Range(safeLine, safeCol, safeLine, safeCol + 1),
          options: {
            className: `yyc3-remote-cursor ${cursorClassName} ${isStale ? 'yyc3-remote-cursor-stale' : ''}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            zIndex: 100,
          },
        });

        // ── Name label as content widget ──
        const widgetId = `yyc3-cursor-label-${user.id}`;
        const widget = {
          getId: () => widgetId,
          getDomNode: () => {
            const node = document.createElement('div');
            node.className = `yyc3-cursor-label ${labelClassName} ${isStale ? 'yyc3-remote-cursor-stale' : ''}`;
            node.textContent = user.name;
            node.style.boxShadow = `0 1px 3px ${hexToRgba(user.color, 0.3)}`;
            return node;
          },
          getPosition: () => ({
            position: { lineNumber: safeLine, column: safeCol },
            preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE],
          }),
        };

        editor.addContentWidget(widget);
        newWidgetDisposables.push({ dispose: () => editor.removeContentWidget(widget) });
      }

      // ── Selection decoration ──
      if (user.selection) {
        const { startLine, startColumn, endLine, endColumn } = user.selection;
        const maxLine = model.getLineCount();
        const safeStartLine = Math.min(Math.max(1, startLine), maxLine);
        const safeEndLine = Math.min(Math.max(1, endLine), maxLine);
        const safeStartCol = Math.min(Math.max(1, startColumn), model.getLineMaxColumn(safeStartLine));
        const safeEndCol = Math.min(Math.max(1, endColumn), model.getLineMaxColumn(safeEndLine));

        if (safeStartLine !== safeEndLine || safeStartCol !== safeEndCol) {
          selectionDecos.push({
            range: new monaco.Range(safeStartLine, safeStartCol, safeEndLine, safeEndCol),
            options: {
              className: `yyc3-remote-selection ${selClassName}`,
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            },
          });
        }
      }

      // ── Minimap cursor marker ──
      if (enableMinimapMarkers && user.cursor) {
        const { line, column } = user.cursor;
        const maxLine = model.getLineCount();
        const safeLine = Math.min(Math.max(1, line), maxLine);
        const maxCol = model.getLineMaxColumn(safeLine);
        const safeCol = Math.min(Math.max(1, column), maxCol);

        // Minimap: colored bar on the cursor line + overview ruler (scrollbar) marker
        minimapDecos.push({
          range: new monaco.Range(safeLine, 1, safeLine, maxCol),
          options: {
            isWholeLine: true,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            minimap: {
              color: user.color,
              position: monaco.editor.MinimapPosition.Inline,
            },
            overviewRuler: {
              color: user.color,
              position: monaco.editor.OverviewRulerLane.Center,
            },
          },
        });

        // Selection range in minimap (if user has selection)
        if (user.selection) {
          const { startLine, endLine } = user.selection;
          const safeS = Math.min(Math.max(1, startLine), maxLine);
          const safeE = Math.min(Math.max(1, endLine), maxLine);
          if (safeS !== safeE) {
            minimapDecos.push({
              range: new monaco.Range(safeS, 1, safeE, model.getLineMaxColumn(safeE)),
              options: {
                isWholeLine: true,
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                minimap: {
                  color: hexToRgba(user.color, 0.3),
                  position: monaco.editor.MinimapPosition.Inline,
                },
              },
            });
          }
        }
      }
    });

    // ── Apply decorations ──
    const newCursorIds = editor.deltaDecorations(decoRef.current.cursorDecoIds, cursorDecos);
    const newSelectionIds = editor.deltaDecorations(decoRef.current.selectionDecoIds, selectionDecos);
    const newMinimapIds = editor.deltaDecorations(decoRef.current.minimapDecoIds, minimapDecos);

    decoRef.current = {
      cursorDecoIds: newCursorIds,
      selectionDecoIds: newSelectionIds,
      minimapDecoIds: newMinimapIds,
      widgetDisposables: newWidgetDisposables,
    };
  }, [editor, monaco, remoteUsers, enabled, currentUserId, getCursorClass, enableMinimapMarkers]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      if (editor) {
        editor.removeDecorations(decoRef.current.cursorDecoIds);
        editor.removeDecorations(decoRef.current.selectionDecoIds);
        editor.removeDecorations(decoRef.current.minimapDecoIds);
      }
      decoRef.current.widgetDisposables.forEach((d: any) => d.dispose?.());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Overlay: connected users mini-panel ── */
  const filteredUsers = remoteUsers.filter(u => u.id !== currentUserId);

  if (!enabled || filteredUsers.length === 0) return null;

  return (
    <div className="absolute top-1 right-1 z-50 select-none">
      {/* Toggle button */}
      <button
        onClick={() => setShowOverlay(prev => !prev)}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
        title={showOverlay ? '隐藏协作者' : '显示协作者'}
      >
        <Users size={10} className="text-indigo-400/60" />
        <span className="text-[8px] text-white/30">{filteredUsers.length}</span>
        {showOverlay ? (
          <Eye size={8} className="text-white/20" />
        ) : (
          <EyeOff size={8} className="text-white/20" />
        )}
      </button>

      {/* User list overlay */}
      {showOverlay && (
        <div className="mt-1 bg-[#14151e]/95 border border-white/[0.08] rounded-lg shadow-lg p-1.5 min-w-[120px] backdrop-blur-sm">
          <div className="text-[7px] text-white/20 px-1 mb-1" style={{ fontWeight: 600 }}>在线协作者</div>
          {filteredUsers.map((u) => {
            const isStale = Date.now() - u.lastActive > 10000;
            return (
              <button
                key={u.id}
                className="flex items-center gap-1.5 w-full px-1 py-0.5 rounded hover:bg-white/[0.06] transition-colors text-left"
                onClick={() => onJumpToUser?.(u)}
                title={`跳转到 ${u.name} 的光标位置`}
              >
                {/* Avatar dot */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${isStale ? 'opacity-40' : ''}`}
                  style={{ backgroundColor: u.color }}
                />
                {/* Name */}
                <span className={`text-[9px] truncate ${isStale ? 'text-white/20' : 'text-white/50'}`}>
                  {u.name}
                </span>
                {/* Cursor position */}
                {u.cursor && (
                  <span className="text-[7px] text-white/10 ml-auto shrink-0">
                    L{u.cursor.line}:{u.cursor.column}
                  </span>
                )}
                {/* Selection indicator */}
                {u.selection && (
                  <span className="text-[7px] px-0.5 rounded"
                    style={{ backgroundColor: hexToRgba(u.color, 0.15), color: u.color }}>
                    SEL
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   StatusBar Collab Indicator — compact inline for status bar
   ================================================================ */
export function CollabStatusIndicator({
  connectedUsers,
  currentUserId,
  wsState,
  onTogglePanel,
}: {
  connectedUsers: CRDTUser[];
  currentUserId: string;
  wsState: 'closed' | 'connecting' | 'open' | 'reconnecting';
  onTogglePanel?: () => void;
}) {
  const remote = connectedUsers.filter(u => u.id !== currentUserId);
  const wsColor = wsState === 'open' ? 'bg-emerald-400' :
    wsState === 'connecting' || wsState === 'reconnecting' ? 'bg-amber-400 animate-pulse' :
    'bg-white/20';
  const wsLabel = wsState === 'open' ? 'WS 已连接' :
    wsState === 'connecting' ? 'WS 连接中...' :
    wsState === 'reconnecting' ? 'WS 重连中...' : 'WS 未连接';

  return (
    <button
      onClick={onTogglePanel}
      className="flex items-center gap-1 px-1.5 py-0 rounded hover:bg-white/[0.06] transition-colors"
      title={wsLabel}
    >
      {/* WS state dot */}
      <div className={`w-1.5 h-1.5 rounded-full ${wsColor}`} />

      {/* User avatars (stacked) */}
      <div className="flex -space-x-1">
        {remote.slice(0, 4).map(u => (
          <div
            key={u.id}
            className="w-3 h-3 rounded-full border border-[#0d0e17] flex items-center justify-center"
            style={{ backgroundColor: u.color }}
            title={u.name}
          >
            <span className="text-[5px] text-white" style={{ fontWeight: 700 }}>
              {getInitials(u.name)}
            </span>
          </div>
        ))}
        {remote.length > 4 && (
          <div className="w-3 h-3 rounded-full border border-[#0d0e17] bg-white/[0.1] flex items-center justify-center">
            <span className="text-[5px] text-white/40">+{remote.length - 4}</span>
          </div>
        )}
      </div>

      {/* Count */}
      {remote.length > 0 && (
        <span className="text-[8px] text-white/20">{remote.length}</span>
      )}
    </button>
  );
}