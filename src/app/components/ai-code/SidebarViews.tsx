/**
 * @file SidebarViews.tsx
 * @description Activity Bar 侧边视图内容面板 — 搜索/Git/调试/运行/扩展/数据库
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.2.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags sidebar,search,git,debug,extensions,database,ai-code
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search, X, ChevronDown, ChevronRight, GitBranch, GitCommit,
  RotateCcw, Plus, Minus, Check, FileText,
  Bug, Play, Pause, StepForward, StepBack, SkipForward,
  Puzzle, Download, Star, RefreshCcw,
  Database, Table2, Plug, Zap, Trash2, Terminal,
  Replace, CaseSensitive, Regex, WholeWord,
  type LucideIcon,
} from 'lucide-react';

/* ================================================================
   Shared TipIcon (local)
   ================================================================ */
function Tip({ icon: Icon, tip, size = 12, className = '', onClick }: {
  icon: LucideIcon; tip: string; size?: number; className?: string; onClick?: () => void;
}) {
  return (
    <div className="relative group/tip inline-flex">
      <button onClick={onClick}
        className={`p-1 rounded-md transition-all duration-150 hover:bg-white/[0.08] cursor-pointer ${className}`}>
        <Icon size={size} />
      </button>
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] bg-black/95 text-white/90 whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] border border-white/10">
        {tip}
      </div>
    </div>
  );
}

/* ================================================================
   Shared file tree type (matches AICodeSystem FileNode)
   ================================================================ */
export interface SidebarFileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: SidebarFileNode[];
  content?: string;
  language?: string;
}

/** Recursively collect all files with their path from the tree */
function flattenFiles(nodes: SidebarFileNode[], prefix = ''): { path: string; node: SidebarFileNode }[] {
  const out: { path: string; node: SidebarFileNode }[] = [];
  for (const n of nodes) {
    const p = prefix ? prefix + '/' + n.name : n.name;
    if (n.type === 'file') out.push({ path: p, node: n });
    if (n.children) out.push(...flattenFiles(n.children, p));
  }
  return out;
}

/* ================================================================
   1. Search Panel
   ================================================================ */
interface SearchResult {
  file: string;
  fileId: string;
  line: number;
  text: string;
  matchStart: number;
  matchEnd: number;
}

export function SearchPanel({ onOpenFile, fileTree }: {
  onOpenFile?: (fileId: string, line?: number) => void;
  fileTree?: SidebarFileNode[];
}) {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Real file tree search — recursively search content of all files
  const handleSearch = useCallback(() => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      const found: SearchResult[] = [];
      const files = fileTree ? flattenFiles(fileTree) : [];
      const q = caseSensitive ? query : query.toLowerCase();

      for (const { path, node } of files) {
        if (!node.content) continue;
        const lines = node.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i];
          const compareLine = caseSensitive ? lineText : lineText.toLowerCase();
          let searchTarget = q;

          if (useRegex) {
            try {
              const re = new RegExp(query, caseSensitive ? 'g' : 'gi');
              let match: RegExpExecArray | null;
              while ((match = re.exec(lineText)) !== null) {
                if (wholeWord) {
                  const before = lineText[match.index - 1];
                  const after = lineText[match.index + match[0].length];
                  if (before && /\w/.test(before)) continue;
                  if (after && /\w/.test(after)) continue;
                }
                found.push({
                  file: path,
                  fileId: node.id,
                  line: i + 1,
                  text: lineText.trim(),
                  matchStart: match.index,
                  matchEnd: match.index + match[0].length,
                });
              }
            } catch { /* invalid regex — skip */ }
          } else {
            let idx = 0;
            while ((idx = compareLine.indexOf(searchTarget, idx)) !== -1) {
              if (wholeWord) {
                const before = lineText[idx - 1];
                const after = lineText[idx + q.length];
                if (before && /\w/.test(before)) { idx++; continue; }
                if (after && /\w/.test(after)) { idx++; continue; }
              }
              found.push({
                file: path,
                fileId: node.id,
                line: i + 1,
                text: lineText.trim(),
                matchStart: idx,
                matchEnd: idx + q.length,
              });
              idx += q.length;
            }
          }
        }
      }

      // If no file tree provided, show hint
      if (files.length === 0) {
        // Fallback mock results for demonstration
        found.push(
          { file: '(无文件树)', fileId: '', line: 0, text: '请在编辑器中打开文件后使用搜索功能', matchStart: 0, matchEnd: 0 },
        );
      }

      setResults(found.slice(0, 200)); // Limit to 200 results
      setExpandedFiles(new Set(found.map(r => r.file)));
      setSearching(false);
    }, 50);
  }, [query, caseSensitive, wholeWord, useRegex, fileTree]);

  // Group results by file
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.file]) acc[r.file] = [];
    acc[r.file].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const toggleFile = (file: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file); else next.add(file);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <Search size={13} className="text-cyan-400/60" />
          <span className="text-[11px] text-white/50" style={{ fontWeight: 500 }}>搜索</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Tip icon={Replace} tip="替换" size={11} className="text-white/25" onClick={() => setShowReplace(!showReplace)} />
          <Tip icon={RefreshCcw} tip="刷新" size={11} className="text-white/25" onClick={() => setResults([])} />
        </div>
      </div>

      {/* Search input */}
      <div className="px-3 py-2 space-y-1.5 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1">
          <div className="flex-1 flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md focus-within:border-indigo-500/40">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="搜索..."
              className="flex-1 bg-transparent text-[11px] text-white/70 px-2 py-1.5 outline-none placeholder:text-white/20"
            />
            <div className="flex items-center gap-0.5 pr-1">
              <button onClick={() => setCaseSensitive(!caseSensitive)}
                className={`p-0.5 rounded transition-colors ${caseSensitive ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/20 hover:text-white/40'}`}
                title="区分大小写"><CaseSensitive size={12} /></button>
              <button onClick={() => setWholeWord(!wholeWord)}
                className={`p-0.5 rounded transition-colors ${wholeWord ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/20 hover:text-white/40'}`}
                title="全字匹配"><WholeWord size={12} /></button>
              <button onClick={() => setUseRegex(!useRegex)}
                className={`p-0.5 rounded transition-colors ${useRegex ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/20 hover:text-white/40'}`}
                title="正则表达式"><Regex size={12} /></button>
            </div>
          </div>
        </div>
        {showReplace && (
          <div className="flex items-center gap-1">
            <input
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              placeholder="替换..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md text-[11px] text-white/70 px-2 py-1.5 outline-none placeholder:text-white/20 focus:border-indigo-500/40"
            />
            <Tip icon={Check} tip="全部替换" size={11} className="text-white/25" />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
        {searching ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Search size={28} className="text-white/10 mb-2" />
            <p className="text-[10px] text-white/20 text-center">
              {query ? '未找到匹配结果' : '输入搜索词后按 Enter 搜索'}
            </p>
          </div>
        ) : (
          <>
            <div className="px-3 py-1">
              <span className="text-[9px] text-white/25">{results.length} 个结果，{Object.keys(grouped).length} 个文件</span>
            </div>
            {Object.entries(grouped).map(([file, fileResults]) => (
              <div key={file}>
                <button onClick={() => toggleFile(file)}
                  className="w-full flex items-center gap-1.5 px-3 py-1 hover:bg-white/[0.03] transition-colors text-left">
                  {expandedFiles.has(file) ? <ChevronDown size={10} className="text-white/30" /> : <ChevronRight size={10} className="text-white/30" />}
                  <FileText size={11} className="text-amber-400/50 shrink-0" />
                  <span className="text-[10px] text-white/50 truncate flex-1" style={{ fontWeight: 500 }}>{file}</span>
                  <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">{fileResults.length}</span>
                </button>
                {expandedFiles.has(file) && fileResults.map((r, i) => (
                  <button key={i} onClick={() => onOpenFile?.(r.fileId, r.line)}
                    className="w-full flex items-center gap-2 pl-8 pr-3 py-1 hover:bg-white/[0.04] transition-colors text-left">
                    <span className="text-[9px] text-white/15 w-6 text-right shrink-0">{r.line}</span>
                    <span className="text-[10px] text-white/40 truncate font-mono">{r.text}</span>
                  </button>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   2. Git Panel (Source Control)
   ================================================================ */
interface GitChange {
  file: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
  staged: boolean;
}

export function GitPanel() {
  const [commitMsg, setCommitMsg] = useState('');
  const [branch] = useState('main');
  const [changes] = useState<GitChange[]>([
    { file: 'src/App.tsx', status: 'modified', staged: true },
    { file: 'src/components/Header.tsx', status: 'modified', staged: false },
    { file: 'src/utils/newHelper.ts', status: 'added', staged: false },
    { file: 'src/old/deprecated.ts', status: 'deleted', staged: false },
  ]);

  const statusColor: Record<string, string> = {
    modified: 'text-amber-400/70',
    added: 'text-emerald-400/70',
    deleted: 'text-red-400/70',
    untracked: 'text-cyan-400/70',
  };
  const statusLabel: Record<string, string> = { modified: 'M', added: 'A', deleted: 'D', untracked: 'U' };

  const staged = changes.filter(c => c.staged);
  const unstaged = changes.filter(c => !c.staged);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <GitBranch size={13} className="text-blue-400/60" />
          <span className="text-[11px] text-white/50" style={{ fontWeight: 500 }}>源代码管理</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Tip icon={RefreshCcw} tip="同步" size={11} className="text-white/25" />
          <Tip icon={RotateCcw} tip="撤销所有更改" size={11} className="text-white/25" />
        </div>
      </div>

      {/* Branch info */}
      <div className="px-3 py-2 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1.5">
          <GitBranch size={11} className="text-indigo-400/60" />
          <span className="text-[10px] text-white/40" style={{ fontWeight: 500 }}>{branch}</span>
          <span className="text-[9px] text-white/15">· {changes.length} 个更改</span>
        </div>
      </div>

      {/* Commit input */}
      <div className="px-3 py-2 border-b border-white/[0.04] shrink-0">
        <textarea
          value={commitMsg}
          onChange={e => setCommitMsg(e.target.value)}
          placeholder="提交消息..."
          rows={2}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md text-[11px] text-white/70 px-2 py-1.5 outline-none placeholder:text-white/20 resize-none focus:border-indigo-500/40"
        />
        <button
          disabled={!commitMsg.trim() || staged.length === 0}
          className="w-full mt-1.5 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] hover:bg-indigo-500/30 transition-colors disabled:opacity-30 disabled:cursor-default"
          style={{ fontWeight: 500 }}
        >
          <Check size={11} /> 提交 ({staged.length})
        </button>
      </div>

      {/* Changes list */}
      <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
        {/* Staged */}
        {staged.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[9px] text-white/25" style={{ fontWeight: 600 }}>暂存的更改 ({staged.length})</span>
              <Tip icon={Minus} tip="取消暂存所有" size={10} className="text-white/20" />
            </div>
            {staged.map(c => (
              <div key={c.file + '-staged'} className="flex items-center gap-2 px-3 py-1 hover:bg-white/[0.03] transition-colors group">
                <FileText size={11} className="text-white/20 shrink-0" />
                <span className="text-[10px] text-white/40 truncate flex-1">{c.file}</span>
                <span className={`text-[9px] ${statusColor[c.status]} shrink-0`} style={{ fontWeight: 600 }}>{statusLabel[c.status]}</span>
                <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/[0.06] transition-all">
                  <Minus size={10} className="text-white/30" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Unstaged */}
        {unstaged.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[9px] text-white/25" style={{ fontWeight: 600 }}>更改 ({unstaged.length})</span>
              <Tip icon={Plus} tip="暂存所有" size={10} className="text-white/20" />
            </div>
            {unstaged.map(c => (
              <div key={c.file + '-unstaged'} className="flex items-center gap-2 px-3 py-1 hover:bg-white/[0.03] transition-colors group">
                <FileText size={11} className="text-white/20 shrink-0" />
                <span className="text-[10px] text-white/40 truncate flex-1">{c.file}</span>
                <span className={`text-[9px] ${statusColor[c.status]} shrink-0`} style={{ fontWeight: 600 }}>{statusLabel[c.status]}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button className="p-0.5 rounded hover:bg-white/[0.06]"><RotateCcw size={10} className="text-white/30" /></button>
                  <button className="p-0.5 rounded hover:bg-white/[0.06]"><Plus size={10} className="text-white/30" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Git log (recent commits) */}
      <div className="border-t border-white/[0.04] px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <GitCommit size={10} className="text-white/20" />
          <span className="text-[9px] text-white/25" style={{ fontWeight: 600 }}>最近提交</span>
        </div>
        {[
          { hash: 'a3f2c1d', msg: 'feat: 新增 Settings 预览标签页', time: '2 小时前' },
          { hash: 'b7e4f89', msg: 'fix: 终端 cat 命令递归查找', time: '5 小时前' },
          { hash: 'c9d1a23', msg: 'refactor: Activity Bar 状态管理', time: '1 天前' },
        ].map(c => (
          <div key={c.hash} className="flex items-start gap-2 py-1">
            <span className="text-[9px] text-indigo-400/40 font-mono shrink-0 mt-0.5">{c.hash}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/40 truncate">{c.msg}</p>
              <p className="text-[8px] text-white/15">{c.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   3. Debug Panel
   ================================================================ */
interface BreakpointItem { file: string; line: number; enabled: boolean; condition?: string }
interface WatchItem { expr: string; value: string }

export function DebugPanel() {
  const [isDebugging] = useState(false);
  const [breakpoints] = useState<BreakpointItem[]>([
    { file: 'src/App.tsx', line: 42, enabled: true },
    { file: 'src/utils/api.ts', line: 18, enabled: true, condition: 'count > 10' },
    { file: 'src/components/Table.tsx', line: 95, enabled: false },
  ]);
  const [watches] = useState<WatchItem[]>([
    { expr: 'currentUser', value: '{ name: "Admin", role: "admin" }' },
    { expr: 'items.length', value: '42' },
    { expr: 'isLoading', value: 'false' },
  ]);
  const [callStack] = useState([
    { fn: 'handleClick', file: 'App.tsx:42', active: true },
    { fn: 'processData', file: 'utils.ts:18', active: false },
    { fn: 'render', file: 'React:internal', active: false },
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <Bug size={13} className="text-orange-400/60" />
          <span className="text-[11px] text-white/50" style={{ fontWeight: 500 }}>调试</span>
        </div>
        <div className="flex items-center gap-0.5">
          {!isDebugging ? (
            <Tip icon={Play} tip="开始调试" size={12} className="text-emerald-400/60" />
          ) : (
            <>
              <Tip icon={Pause} tip="暂停" size={11} className="text-amber-400/60" />
              <Tip icon={StepForward} tip="单步跳过" size={11} className="text-white/30" />
              <Tip icon={StepBack} tip="单步进入" size={11} className="text-white/30" />
              <Tip icon={SkipForward} tip="继续" size={11} className="text-white/30" />
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="px-3 py-2 border-b border-white/[0.04] shrink-0">
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md ${isDebugging ? 'bg-orange-500/10 border border-orange-500/15' : 'bg-white/[0.02] border border-white/[0.06]'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isDebugging ? 'bg-orange-400 animate-pulse' : 'bg-white/20'}`} />
          <span className={`text-[10px] ${isDebugging ? 'text-orange-400/70' : 'text-white/25'}`} style={{ fontWeight: 500 }}>
            {isDebugging ? '调试中...' : '未启动调试'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
        {/* Breakpoints */}
        <div className="mb-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[9px] text-white/25" style={{ fontWeight: 600 }}>断点 ({breakpoints.length})</span>
            <Tip icon={Trash2} tip="清除所有断点" size={10} className="text-white/20" />
          </div>
          {breakpoints.map((bp, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1 hover:bg-white/[0.03] transition-colors group">
              <div className={`w-2 h-2 rounded-full shrink-0 ${bp.enabled ? 'bg-red-400' : 'bg-white/15'}`} />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-white/40 truncate block">{bp.file}:{bp.line}</span>
                {bp.condition && <span className="text-[8px] text-amber-400/40">条件: {bp.condition}</span>}
              </div>
              <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/[0.06] transition-all">
                <X size={9} className="text-white/30" />
              </button>
            </div>
          ))}
        </div>

        {/* Watch expressions */}
        <div className="mb-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[9px] text-white/25" style={{ fontWeight: 600 }}>监视</span>
            <Tip icon={Plus} tip="添加表达式" size={10} className="text-white/20" />
          </div>
          {watches.map((w, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1 hover:bg-white/[0.03] transition-colors">
              <span className="text-[10px] text-indigo-400/50 font-mono shrink-0">{w.expr}</span>
              <span className="text-[10px] text-white/20">=</span>
              <span className="text-[10px] text-emerald-400/50 font-mono truncate">{w.value}</span>
            </div>
          ))}
        </div>

        {/* Call stack */}
        <div>
          <div className="px-3 py-1">
            <span className="text-[9px] text-white/25" style={{ fontWeight: 600 }}>调用栈</span>
          </div>
          {callStack.map((cs, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-1 hover:bg-white/[0.03] transition-colors ${cs.active ? 'bg-amber-500/[0.04]' : ''}`}>
              {cs.active && <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />}
              {!cs.active && <div className="w-1 shrink-0" />}
              <span className="text-[10px] text-white/40 font-mono">{cs.fn}</span>
              <span className="text-[9px] text-white/15 truncate">{cs.file}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   4. Run & Debug Panel
   ================================================================ */
interface RunConfig { id: string; name: string; command: string; env: string }

export function RunPanel() {
  const [configs] = useState<RunConfig[]>([
    { id: '1', name: 'Dev Server', command: 'npm run dev', env: 'development' },
    { id: '2', name: 'Build', command: 'npm run build', env: 'production' },
    { id: '3', name: 'Test Suite', command: 'npm test', env: 'test' },
    { id: '4', name: 'Lint', command: 'npm run lint', env: 'development' },
  ]);
  const [running, setRunning] = useState<Set<string>>(new Set(['1']));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <Play size={13} className="text-emerald-400/60" />
          <span className="text-[11px] text-white/50" style={{ fontWeight: 500 }}>运行与调试</span>
        </div>
        <Tip icon={Plus} tip="新建配置" size={11} className="text-white/25" />
      </div>

      <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
        {configs.map(cfg => {
          const isRunning = running.has(cfg.id);
          return (
            <div key={cfg.id} className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors group border-b border-white/[0.02]">
              <button
                onClick={() => {
                  setRunning(prev => {
                    const next = new Set(prev);
                    if (next.has(cfg.id)) next.delete(cfg.id); else next.add(cfg.id);
                    return next;
                  });
                }}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${isRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-white/25 hover:text-white/50'}`}
              >
                {isRunning ? <Pause size={11} /> : <Play size={11} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/50" style={{ fontWeight: 500 }}>{cfg.name}</span>
                  {isRunning && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </div>
                <p className="text-[9px] text-white/20 font-mono truncate">{cfg.command}</p>
              </div>
              <span className={`text-[8px] px-1.5 py-0.5 rounded border ${
                cfg.env === 'production' ? 'text-amber-400/40 bg-amber-500/10 border-amber-500/10' :
                cfg.env === 'test' ? 'text-cyan-400/40 bg-cyan-500/10 border-cyan-500/10' :
                'text-emerald-400/40 bg-emerald-500/10 border-emerald-500/10'
              }`}>{cfg.env}</span>
            </div>
          );
        })}
      </div>

      {/* Quick tasks */}
      <div className="border-t border-white/[0.04] px-3 py-2 shrink-0">
        <span className="text-[9px] text-white/25 mb-1.5 block" style={{ fontWeight: 600 }}>快捷任务</span>
        <div className="flex flex-wrap gap-1">
          {['npm install', 'npm run format', 'npm audit', 'git pull'].map(cmd => (
            <button key={cmd} className="text-[9px] text-white/30 bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1 hover:bg-white/[0.06] hover:text-white/50 transition-colors font-mono">
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   5. Extensions Panel
   ================================================================ */
interface Extension {
  id: string;
  name: string;
  author: string;
  description: string;
  installed: boolean;
  stars: number;
  category: string;
}

export function ExtensionsPanel() {
  const [search, setSearch] = useState('');
  const [extensions] = useState<Extension[]>([
    { id: '1', name: 'Tailwind CSS 智能提示', author: 'YYC³ Team', description: '提供 Tailwind CSS 类名自动补全和预览', installed: true, stars: 2840, category: 'CSS' },
    { id: '2', name: 'ESLint 集成', author: 'Microsoft', description: 'JavaScript/TypeScript 代码检查与自动修复', installed: true, stars: 4200, category: '代码质量' },
    { id: '3', name: 'Prettier 格式化', author: 'Prettier', description: '统一代码格式化工具', installed: true, stars: 3800, category: '格式化' },
    { id: '4', name: 'Git Lens', author: 'GitKraken', description: '增强 Git 功能，行级 blame 和历史查看', installed: false, stars: 5600, category: 'Git' },
    { id: '5', name: 'AI 代码审查', author: 'YYC³ Team', description: 'AI 驱动的代码质量分析和建议', installed: false, stars: 1200, category: 'AI' },
    { id: '6', name: 'REST Client', author: 'Huachao', description: '内嵌 HTTP 请求测试工具', installed: false, stars: 3100, category: 'API' },
  ]);

  const filtered = search
    ? extensions.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.author.toLowerCase().includes(search.toLowerCase()))
    : extensions;

  const installed = filtered.filter(e => e.installed);
  const marketplace = filtered.filter(e => !e.installed);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <Puzzle size={13} className="text-violet-400/60" />
          <span className="text-[11px] text-white/50" style={{ fontWeight: 500 }}>扩展</span>
        </div>
        <Tip icon={RefreshCcw} tip="刷新" size={11} className="text-white/25" />
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md focus-within:border-indigo-500/40">
          <Search size={11} className="text-white/20 ml-2 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索扩展..."
            className="flex-1 bg-transparent text-[11px] text-white/70 px-2 py-1.5 outline-none placeholder:text-white/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
        {/* Installed */}
        {installed.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-1">
              <span className="text-[9px] text-white/25" style={{ fontWeight: 600 }}>已安装 ({installed.length})</span>
            </div>
            {installed.map(ext => (
              <ExtensionCard key={ext.id} ext={ext} />
            ))}
          </div>
        )}

        {/* Marketplace */}
        {marketplace.length > 0 && (
          <div>
            <div className="px-3 py-1">
              <span className="text-[9px] text-white/25" style={{ fontWeight: 600 }}>推荐 ({marketplace.length})</span>
            </div>
            {marketplace.map(ext => (
              <ExtensionCard key={ext.id} ext={ext} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExtensionCard({ ext }: { ext: Extension }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors group border-b border-white/[0.02]">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/[0.06] flex items-center justify-center shrink-0">
        <Puzzle size={14} className="text-violet-400/50" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/50 truncate" style={{ fontWeight: 500 }}>{ext.name}</span>
          <span className="text-[8px] text-white/15 bg-white/[0.03] px-1 py-0.5 rounded">{ext.category}</span>
        </div>
        <p className="text-[9px] text-white/25 truncate">{ext.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[8px] text-white/20">{ext.author}</span>
          <div className="flex items-center gap-0.5">
            <Star size={8} className="text-amber-400/40" />
            <span className="text-[8px] text-white/20">{(ext.stars / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>
      <button className={`shrink-0 px-2 py-1 rounded text-[9px] transition-colors ${
        ext.installed
          ? 'text-white/20 bg-white/[0.03] border border-white/[0.06] hover:bg-red-500/10 hover:text-red-400/60 hover:border-red-500/15'
          : 'text-indigo-400 bg-indigo-500/15 border border-indigo-500/20 hover:bg-indigo-500/25'
      }`} style={{ fontWeight: 500 }}>
        {ext.installed ? '卸载' : '安装'}
      </button>
    </div>
  );
}

/* ================================================================
   6. Database Panel
   ================================================================ */
interface DBConnection { id: string; name: string; type: 'PostgreSQL' | 'MySQL' | 'Redis' | 'SQLite'; host: string; status: 'connected' | 'disconnected' | 'error' }

export function DatabasePanel() {
  const [connections] = useState<DBConnection[]>([
    { id: '1', name: '本地开发 DB', type: 'PostgreSQL', host: 'localhost:5432', status: 'connected' },
    { id: '2', name: '测试 MySQL', type: 'MySQL', host: 'localhost:3306', status: 'disconnected' },
    { id: '3', name: 'Redis 缓存', type: 'Redis', host: 'localhost:6379', status: 'connected' },
    { id: '4', name: '本地 SQLite', type: 'SQLite', host: './data/local.db', status: 'connected' },
  ]);
  const [selectedConn, setSelectedConn] = useState<string | null>('1');

  const statusIcon: Record<string, { color: string; label: string }> = {
    connected: { color: 'bg-emerald-400', label: '已连接' },
    disconnected: { color: 'bg-white/20', label: '未连接' },
    error: { color: 'bg-red-400', label: '错误' },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <Database size={13} className="text-rose-400/60" />
          <span className="text-[11px] text-white/50" style={{ fontWeight: 500 }}>数据库</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Tip icon={Plus} tip="新建连接" size={11} className="text-white/25" />
          <Tip icon={RefreshCcw} tip="自动检测" size={11} className="text-white/25" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
        {/* Connections */}
        <div className="px-3 py-1">
          <span className="text-[9px] text-white/25" style={{ fontWeight: 600 }}>连接管理 ({connections.length})</span>
        </div>
        {connections.map(conn => {
          const st = statusIcon[conn.status];
          const isSelected = selectedConn === conn.id;
          return (
            <button key={conn.id} onClick={() => setSelectedConn(conn.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 transition-colors text-left border-b border-white/[0.02] ${
                isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'
              }`}>
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-rose-500/15 to-pink-500/15 border border-white/[0.06] flex items-center justify-center shrink-0">
                <Database size={13} className="text-rose-400/50" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/50" style={{ fontWeight: 500 }}>{conn.name}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${st.color}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-white/20">{conn.type}</span>
                  <span className="text-[8px] text-white/15 font-mono">{conn.host}</span>
                </div>
              </div>
              <Plug size={10} className={conn.status === 'connected' ? 'text-emerald-400/40' : 'text-white/15'} />
            </button>
          );
        })}

        {/* Quick actions for selected */}
        {selectedConn && (
          <div className="px-3 py-2 border-t border-white/[0.04]">
            <span className="text-[9px] text-white/25 mb-1.5 block" style={{ fontWeight: 600 }}>快捷操作</span>
            <div className="grid grid-cols-2 gap-1">
              {[
                { icon: Terminal, label: 'SQL 控制台' },
                { icon: Table2, label: '表浏览器' },
                { icon: Download, label: '备份' },
                { icon: Zap, label: '性能监控' },
              ].map(action => (
                <button key={action.label}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                  <action.icon size={10} className="text-white/25" />
                  <span className="text-[9px] text-white/30">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}