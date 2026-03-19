/**
 * @file MultiInstanceManager.tsx
 * @description YYC3 多实例管理面板 — 窗口/工作区/会话/剪贴板/IPC 状态可视化与操控
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags multi-instance,ui,window-manager,workspace,session
 */

import React, { useState, useMemo } from 'react';
import {
  AppWindow,
  FolderOpen,
  MessageSquare,
  Clipboard,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Play,
  Pause,
  ExternalLink,
  Wifi,
  WifiOff,
  Monitor,
  Terminal,
  Bot,
  Settings,
  Eye,
  Code,
  Bug,
  X,
  ChevronDown,
  ChevronRight,
  Radio,
  Search,
  MoreHorizontal,
} from 'lucide-react';
import { useMultiInstanceStore } from '../../services/multi-instance/useMultiInstanceStore';
import type {
  Workspace,
  Session,
  WorkspaceType,
  SessionType,
  AppInstance,
  SharedClipboardItem,
} from '../../types/multi-instance';

/* ================================================================
   Constants & Helpers
   ================================================================ */

type TabKey = 'instances' | 'workspaces' | 'sessions' | 'clipboard';

const WORKSPACE_TYPE_META: Record<WorkspaceType, { label: string; color: string }> = {
  project: { label: 'Project', color: '#667eea' },
  'ai-session': { label: 'AI Session', color: '#f59e0b' },
  debug: { label: 'Debug', color: '#ef4444' },
  custom: { label: 'Custom', color: '#10b981' },
};

const SESSION_TYPE_ICON: Record<SessionType, React.ReactNode> = {
  'ai-chat': <Bot size={14} />,
  'code-edit': <Code size={14} />,
  debug: <Bug size={14} />,
  preview: <Eye size={14} />,
  terminal: <Terminal size={14} />,
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

/* ================================================================
   Sub-Components
   ================================================================ */

/** Tab button */
function TabBtn({ active, icon, label, count, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; count: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
        active
          ? 'bg-[var(--yyc3-brand)]/20 text-[var(--yyc3-brand)]'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
          active ? 'bg-[var(--yyc3-brand)]/30' : 'bg-white/10'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

/** Instance card */
function InstanceCard({ instance, isCurrent, onFocus }: {
  instance: AppInstance; isCurrent: boolean; onFocus: () => void;
}) {
  const isAlive = Date.now() - instance.lastActiveAt < 10000;
  return (
    <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
      isCurrent
        ? 'border-[var(--yyc3-brand)]/40 bg-[var(--yyc3-brand)]/5'
        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isCurrent ? 'bg-[var(--yyc3-brand)]/20 text-[var(--yyc3-brand)]' : 'bg-white/5 text-gray-400'
      }`}>
        <Monitor size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-200 truncate">{instance.title}</span>
          {isCurrent && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--yyc3-brand)]/20 text-[var(--yyc3-brand)] shrink-0">
              Current
            </span>
          )}
          {instance.isMain && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 shrink-0">
              Main
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-500">{instance.route}</span>
          <span className="text-[10px] text-gray-600">{timeAgo(instance.lastActiveAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${isAlive ? 'bg-emerald-400' : 'bg-red-400'}`} />
        {!isCurrent && (
          <button
            onClick={onFocus}
            className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Focus this tab"
          >
            <ExternalLink size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Workspace card */
function WorkspaceCard({ workspace, isActive, sessionCount, onActivate, onDuplicate, onDelete, onExport }: {
  workspace: Workspace;
  isActive: boolean;
  sessionCount: number;
  onActivate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = WORKSPACE_TYPE_META[workspace.type];

  return (
    <div className={`group px-3 py-2.5 rounded-lg border transition-colors ${
      isActive
        ? 'border-[var(--yyc3-brand)]/40 bg-[var(--yyc3-brand)]/5'
        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
    }`}>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${workspace.color || meta.color}20`, color: workspace.color || meta.color }}
        >
          <FolderOpen size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-200 truncate">{workspace.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
              style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-500">{sessionCount} sessions</span>
            <span className="text-[10px] text-gray-600">{timeAgo(workspace.updatedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 relative">
          {!isActive && (
            <button
              onClick={onActivate}
              className="p-1 rounded text-gray-500 hover:text-[var(--yyc3-brand)] hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Activate"
            >
              <Play size={12} />
            </button>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={12} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-50 bg-[var(--yyc3-bg-elevated)] border border-white/10 rounded-lg shadow-xl py-1 min-w-[120px]">
              <button onClick={() => { onDuplicate(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5">
                <Copy size={12} /> Duplicate
              </button>
              <button onClick={() => { onExport(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5">
                <Download size={12} /> Export
              </button>
              <div className="border-t border-white/5 my-1" />
              <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Session row */
function SessionRow({ session, isActive, onActivate, onSuspend, onResume, onDelete }: {
  session: Session;
  isActive: boolean;
  onActivate: () => void;
  onSuspend: () => void;
  onResume: () => void;
  onDelete: () => void;
}) {
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-400',
    idle: 'bg-yellow-400',
    suspended: 'bg-orange-400',
    closed: 'bg-gray-500',
  };

  return (
    <div className={`group flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
      isActive
        ? 'border-[var(--yyc3-brand)]/40 bg-[var(--yyc3-brand)]/5'
        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
    }`}>
      <div className="w-6 h-6 rounded flex items-center justify-center bg-white/5 text-gray-400 shrink-0">
        {SESSION_TYPE_ICON[session.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-200 truncate">{session.name}</span>
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColors[session.status]}`} />
          <span className="text-[10px] text-gray-500 capitalize">{session.status}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {session.status !== 'active' && (
          <button onClick={session.status === 'suspended' ? onResume : onActivate} className="p-1 rounded text-gray-500 hover:text-emerald-400 hover:bg-white/5" title="Resume">
            <Play size={11} />
          </button>
        )}
        {session.status === 'active' && (
          <button onClick={onSuspend} className="p-1 rounded text-gray-500 hover:text-amber-400 hover:bg-white/5" title="Suspend">
            <Pause size={11} />
          </button>
        )}
        <button onClick={onDelete} className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-white/5" title="Delete">
          <X size={11} />
        </button>
      </div>
    </div>
  );
}

/** Clipboard item */
function ClipboardItem({ item }: { item: SharedClipboardItem }) {
  const [copied, setCopied] = useState(false);
  const typeIcons: Record<string, React.ReactNode> = {
    text: <MessageSquare size={12} />,
    code: <Code size={12} />,
    'file-ref': <FolderOpen size={12} />,
    component: <AppWindow size={12} />,
  };

  return (
    <div className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="w-5 h-5 rounded flex items-center justify-center bg-white/5 text-gray-400 shrink-0">
        {typeIcons[item.type] || <Clipboard size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] text-gray-300 truncate block">{item.content.slice(0, 80)}</span>
        <span className="text-[10px] text-gray-600">{timeAgo(item.timestamp)}</span>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(item.content);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy"
      >
        {copied ? <span className="text-[10px] text-emerald-400">Copied</span> : <Copy size={11} />}
      </button>
    </div>
  );
}

/* ================================================================
   Create Dialogs
   ================================================================ */

function CreateWorkspaceDialog({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, type: WorkspaceType) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<WorkspaceType>('project');

  return (
    <div className="p-4 border border-white/10 rounded-lg bg-[var(--yyc3-bg-elevated)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-200">New Workspace</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-200"><X size={14} /></button>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workspace name..."
        className="w-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-md text-gray-200 placeholder-gray-500 outline-none focus:border-[var(--yyc3-brand)]/50 mb-2"
        autoFocus
      />
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(Object.keys(WORKSPACE_TYPE_META) as WorkspaceType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
              type === t
                ? 'border-[var(--yyc3-brand)]/50 bg-[var(--yyc3-brand)]/10 text-[var(--yyc3-brand)]'
                : 'border-white/5 text-gray-400 hover:bg-white/5'
            }`}
          >
            {WORKSPACE_TYPE_META[t].label}
          </button>
        ))}
      </div>
      <button
        onClick={() => { if (name.trim()) { onCreate(name.trim(), type); onClose(); } }}
        disabled={!name.trim()}
        className="w-full py-1.5 text-xs rounded-md bg-[var(--yyc3-brand)] text-white disabled:opacity-40 hover:brightness-110 transition-all"
      >
        Create Workspace
      </button>
    </div>
  );
}

function CreateSessionDialog({ workspaces, onClose, onCreate }: {
  workspaces: Workspace[];
  onClose: () => void;
  onCreate: (name: string, type: SessionType, workspaceId: string) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<SessionType>('ai-chat');
  const [wsId, setWsId] = useState(workspaces[0]?.id || '');
  const types: SessionType[] = ['ai-chat', 'code-edit', 'debug', 'preview', 'terminal'];

  return (
    <div className="p-4 border border-white/10 rounded-lg bg-[var(--yyc3-bg-elevated)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-200">New Session</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-200"><X size={14} /></button>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Session name..."
        className="w-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-md text-gray-200 placeholder-gray-500 outline-none focus:border-[var(--yyc3-brand)]/50 mb-2"
        autoFocus
      />
      <div className="flex flex-wrap gap-1.5 mb-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border transition-colors ${
              type === t
                ? 'border-[var(--yyc3-brand)]/50 bg-[var(--yyc3-brand)]/10 text-[var(--yyc3-brand)]'
                : 'border-white/5 text-gray-400 hover:bg-white/5'
            }`}
          >
            {SESSION_TYPE_ICON[t]} {t}
          </button>
        ))}
      </div>
      {workspaces.length > 0 && (
        <select
          value={wsId}
          onChange={(e) => setWsId(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-md text-gray-200 outline-none mb-3"
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      )}
      <button
        onClick={() => { if (name.trim() && wsId) { onCreate(name.trim(), type, wsId); onClose(); } }}
        disabled={!name.trim() || !wsId}
        className="w-full py-1.5 text-xs rounded-md bg-[var(--yyc3-brand)] text-white disabled:opacity-40 hover:brightness-110 transition-all"
      >
        Create Session
      </button>
    </div>
  );
}

/* ================================================================
   Main Component
   ================================================================ */

export function MultiInstanceManager() {
  const store = useMultiInstanceStore();
  const [activeTab, setActiveTab] = useState<TabKey>('instances');
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const currentTabId = store.getTabId();

  // Filtered data
  const filteredWorkspaces = useMemo(() => {
    if (!searchTerm) return store.workspaces;
    const q = searchTerm.toLowerCase();
    return store.workspaces.filter((w) => w.name.toLowerCase().includes(q));
  }, [store.workspaces, searchTerm]);

  const filteredSessions = useMemo(() => {
    if (!searchTerm) return store.sessions;
    const q = searchTerm.toLowerCase();
    return store.sessions.filter((s) => s.name.toLowerCase().includes(q));
  }, [store.sessions, searchTerm]);

  const handleExportWorkspace = (id: string) => {
    const json = store.exportWorkspace(id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workspace-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportWorkspace = () => {
    if (importText.trim()) {
      store.importWorkspace(importText.trim());
      setImportText('');
      setShowImport(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--yyc3-bg-surface)] text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <AppWindow size={16} className="text-[var(--yyc3-brand)]" />
          <span className="text-sm text-gray-200">Multi-Instance Manager</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
            store.ipcConnected
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {store.ipcConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
            IPC {store.ipcConnected ? 'Connected' : 'Offline'}
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400">
            <Radio size={10} />
            {store.instances.length} tab{store.instances.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 rounded-md">
          <Search size={12} className="text-gray-500 shrink-0" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search workspaces, sessions..."
            className="flex-1 bg-transparent text-xs text-gray-200 placeholder-gray-500 outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-gray-200">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto">
        <TabBtn active={activeTab === 'instances'} icon={<Monitor size={12} />} label="Instances" count={store.instances.length} onClick={() => setActiveTab('instances')} />
        <TabBtn active={activeTab === 'workspaces'} icon={<FolderOpen size={12} />} label="Workspaces" count={store.workspaces.length} onClick={() => setActiveTab('workspaces')} />
        <TabBtn active={activeTab === 'sessions'} icon={<MessageSquare size={12} />} label="Sessions" count={store.sessions.length} onClick={() => setActiveTab('sessions')} />
        <TabBtn active={activeTab === 'clipboard'} icon={<Clipboard size={12} />} label="Clipboard" count={store.sharedClipboard.length} onClick={() => setActiveTab('clipboard')} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">

        {/* ── Instances Tab ── */}
        {activeTab === 'instances' && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Active Browser Tabs</span>
              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
              >
                <Plus size={10} /> New Tab
              </button>
            </div>
            {store.instances.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-xs">No instances detected</div>
            ) : (
              store.instances.map((inst) => (
                <InstanceCard
                  key={inst.tabId}
                  instance={inst}
                  isCurrent={inst.tabId === currentTabId}
                  onFocus={() => store.requestFocusInstance(inst.tabId)}
                />
              ))
            )}
          </>
        )}

        {/* ── Workspaces Tab ── */}
        {activeTab === 'workspaces' && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Workspaces</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowImport(!showImport)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
                >
                  <Upload size={10} /> Import
                </button>
                <button
                  onClick={() => setShowCreateWs(true)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-md text-[var(--yyc3-brand)] hover:bg-[var(--yyc3-brand)]/10 transition-colors"
                >
                  <Plus size={10} /> New
                </button>
              </div>
            </div>

            {showImport && (
              <div className="p-3 border border-white/10 rounded-lg bg-[var(--yyc3-bg-elevated)] mb-2">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste workspace JSON here..."
                  className="w-full h-20 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded-md text-gray-200 placeholder-gray-500 outline-none resize-none mb-2"
                />
                <div className="flex gap-2">
                  <button onClick={handleImportWorkspace} className="px-3 py-1 text-[10px] rounded bg-[var(--yyc3-brand)] text-white">Import</button>
                  <button onClick={() => setShowImport(false)} className="px-3 py-1 text-[10px] rounded bg-white/5 text-gray-400">Cancel</button>
                </div>
              </div>
            )}

            {showCreateWs && (
              <CreateWorkspaceDialog
                onClose={() => setShowCreateWs(false)}
                onCreate={(name, type) => store.createWorkspace(name, type)}
              />
            )}

            {filteredWorkspaces.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen size={24} className="mx-auto mb-2 text-gray-600" />
                <p className="text-xs text-gray-500">No workspaces yet</p>
                <button
                  onClick={() => setShowCreateWs(true)}
                  className="mt-2 text-[10px] text-[var(--yyc3-brand)] hover:underline"
                >
                  Create your first workspace
                </button>
              </div>
            ) : (
              filteredWorkspaces.map((ws) => (
                <WorkspaceCard
                  key={ws.id}
                  workspace={ws}
                  isActive={ws.id === store.activeWorkspaceId}
                  sessionCount={store.sessions.filter((s) => s.workspaceId === ws.id).length}
                  onActivate={() => store.activateWorkspace(ws.id)}
                  onDuplicate={() => store.duplicateWorkspace(ws.id)}
                  onDelete={() => store.deleteWorkspace(ws.id)}
                  onExport={() => handleExportWorkspace(ws.id)}
                />
              ))
            )}
          </>
        )}

        {/* ── Sessions Tab ── */}
        {activeTab === 'sessions' && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Sessions</span>
              <button
                onClick={() => setShowCreateSession(true)}
                disabled={store.workspaces.length === 0}
                className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-md text-[var(--yyc3-brand)] hover:bg-[var(--yyc3-brand)]/10 transition-colors disabled:opacity-40"
              >
                <Plus size={10} /> New
              </button>
            </div>

            {showCreateSession && (
              <CreateSessionDialog
                workspaces={store.workspaces}
                onClose={() => setShowCreateSession(false)}
                onCreate={(name, type, wsId) => store.createSession(name, type, wsId)}
              />
            )}

            {store.workspaces.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                Create a workspace first to add sessions
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">No sessions</div>
            ) : (
              filteredSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === store.activeSessionId}
                  onActivate={() => store.activateSession(session.id)}
                  onSuspend={() => store.suspendSession(session.id)}
                  onResume={() => store.resumeSession(session.id)}
                  onDelete={() => store.deleteSession(session.id)}
                />
              ))
            )}
          </>
        )}

        {/* ── Clipboard Tab ── */}
        {activeTab === 'clipboard' && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Shared Clipboard</span>
              <span className="text-[10px] text-gray-600">{store.sharedClipboard.length} items</span>
            </div>
            {store.sharedClipboard.length === 0 ? (
              <div className="text-center py-8">
                <Clipboard size={24} className="mx-auto mb-2 text-gray-600" />
                <p className="text-xs text-gray-500">No shared clipboard items</p>
                <p className="text-[10px] text-gray-600 mt-1">Use shareToClipboard() to share content across tabs</p>
              </div>
            ) : (
              [...store.sharedClipboard].reverse().map((item) => (
                <ClipboardItem key={item.id} item={item} />
              ))
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-gray-600">
          Tab ID: {currentTabId.slice(0, 8)}...
        </span>
        <span className="text-[10px] text-gray-600">
          {store.workspaces.length} workspaces &middot; {store.sessions.length} sessions
        </span>
      </div>
    </div>
  );
}
