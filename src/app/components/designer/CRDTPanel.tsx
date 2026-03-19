import { useState, useEffect, useCallback } from 'react';
import {
  X, Wifi, WifiOff, Users, GitBranch,
  AlertTriangle, Radio, Eye, Database, Zap,
  ChevronRight, Copy, Check,
  Shield, Lock, Unlock, UserCog, Timer, History
} from 'lucide-react';
import { useDesigner } from '../../store';
import { copyToClipboard } from '../../utils/clipboard';
import { useYjsBinding } from './useYjsBinding';
import { useThemeTokens } from './hooks/useThemeTokens';
import { Tooltip } from './Tooltip';

/* ================================================================
   Simulated CRDT Document State
   ================================================================ */

interface CRDTChange {
  id: string;
  peerId: string;
  peerName: string;
  color: string;
  type: 'insert' | 'update' | 'delete' | 'move' | 'lock' | 'unlock' | 'role-change';
  target: string;
  timestamp: number;
}

const MOCK_CHANGES: CRDTChange[] = [
  { id: 'ch-1', peerId: 'peer-1', peerName: '张三', color: '#a78bfa', type: 'update', target: 'comp-1.props.value → "28,491"', timestamp: Date.now() - 3000 },
  { id: 'ch-2', peerId: 'self', peerName: '你', color: '#667eea', type: 'insert', target: 'panel-4 → comp-9 (Button)', timestamp: Date.now() - 8000 },
  { id: 'ch-3', peerId: 'peer-2', peerName: '李四', color: '#34d399', type: 'lock', target: 'panel-2 (分析面板) 已锁定', timestamp: Date.now() - 12000 },
  { id: 'ch-4', peerId: 'peer-2', peerName: '李四', color: '#34d399', type: 'update', target: 'comp-6.props.chartType → "bar"', timestamp: Date.now() - 15000 },
  { id: 'ch-5', peerId: 'peer-1', peerName: '张三', color: '#a78bfa', type: 'move', target: 'panel-1 layout → {x:0,y:0,w:6,h:8}', timestamp: Date.now() - 25000 },
  { id: 'ch-6', peerId: 'self', peerName: '你', color: '#667eea', type: 'delete', target: 'comp-old-3 (removed)', timestamp: Date.now() - 40000 },
  { id: 'ch-7', peerId: 'peer-2', peerName: '李四', color: '#34d399', type: 'unlock', target: 'panel-2 (分析面板) 已解锁', timestamp: Date.now() - 50000 },
  { id: 'ch-8', peerId: 'peer-1', peerName: '张三', color: '#a78bfa', type: 'role-change', target: '角色变更: viewer → editor', timestamp: Date.now() - 55000 },
  { id: 'ch-9', peerId: 'peer-2', peerName: '李四', color: '#34d399', type: 'insert', target: 'panel-3 → comp-6 (Chart)', timestamp: Date.now() - 60000 },
];

/* ================================================================
   RBAC Role metadata
   ================================================================ */

const ROLE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  owner:  { label: '所有者', color: 'text-amber-400',  bg: 'bg-amber-500/15',  icon: '👑' },
  admin:  { label: '管理员', color: 'text-rose-400',   bg: 'bg-rose-500/15',   icon: '🛡️' },
  editor: { label: '编辑者', color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   icon: '✏️' },
  viewer: { label: '观察者', color: 'text-white/40',   bg: 'bg-white/[0.06]',  icon: '👁️' },
  guest:  { label: '访客',   color: 'text-white/25',   bg: 'bg-white/[0.04]',  icon: '🔗' },
};

/* ================================================================
   Format helpers
   ================================================================ */

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分${seconds % 60}秒`;
  const hours = Math.floor(minutes / 60);
  return `${hours}时${minutes % 60}分`;
}

/* ================================================================
   Main Component
   ================================================================ */

export function CRDTPanel() {
  const {
    crdtPanelOpen, toggleCRDTPanel, crdtPeers, crdtDocVersion,
    syncStatus, panels, components, incrementDocVersion,
    setCRDTPeers, setPanelsFromCRDT, setComponentsFromCRDT,
    currentUserIdentity,
  } = useDesigner();
  const t = useThemeTokens();

  // Real yjs binding — wired to store for bidirectional CRDT ↔ UI sync
  const yjs = useYjsBinding(
    panels, components,
    setPanelsFromCRDT,     // CRDT → Store: panels
    setComponentsFromCRDT, // CRDT → Store: components
    setCRDTPeers,
    incrementDocVersion,
  );

  const [activeTab, setActiveTab] = useState<'peers' | 'changes' | 'document' | 'ws'>('peers');
  const [changes, setChanges] = useState<CRDTChange[]>(MOCK_CHANGES);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update "now" every second for live duration display
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = useCallback((text: string) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 5000) return '刚刚';
    if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    return `${Math.floor(diff / 3600000)}小时前`;
  };

  if (!crdtPanelOpen) return null;

  // Compute lock history from changes
  const lockHistory = changes.filter(ch => ch.type === 'lock' || ch.type === 'unlock');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className={`absolute inset-0 ${t.overlayBg} backdrop-blur-md`} onClick={toggleCRDTPanel} />
      <div
        className={`relative w-[820px] max-h-[85vh] ${t.modalBg} border ${t.modalBorder} rounded-2xl flex flex-col overflow-hidden`}
        style={{ boxShadow: t.modalShadow }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.sectionBorder}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className={`text-[14px] ${t.textPrimary}`}>CRDT 实时协同</div>
            <div className={`text-[11px] ${t.textTertiary}`}>yjs + y-websocket · 文档版本 v{crdtDocVersion}</div>
          </div>
          <div className="flex items-center gap-2 mr-2">
            <div className={`w-2 h-2 rounded-full ${yjs.connected ? t.statusSyncedDot : t.statusConflictDot.replace(' animate-pulse', '')}`} />
            <span className={`text-[10px] ${t.textTertiary}`}>{yjs.connected ? 'WebSocket 已连接' : '已断开'}</span>
          </div>
          <button onClick={toggleCRDTPanel} className={`p-2 rounded-lg ${t.textMuted} hover:text-white/60 ${t.hoverBg} transition-all`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 px-5 pt-3 pb-0 border-b ${t.sectionBorder}`}>
          {([
            { key: 'peers' as const, label: '协作者', icon: Users },
            { key: 'changes' as const, label: '变更日志', icon: GitBranch },
            { key: 'document' as const, label: '文档状态', icon: Database },
            { key: 'ws' as const, label: 'WebSocket', icon: Wifi },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] transition-all border-b-2 whitespace-nowrap ${
                activeTab === key
                  ? `${t.activeTabText} border-current ${t.activeBg}`
                  : `${t.textTertiary} border-transparent hover:text-white/50`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {key === 'peers' && <span className={`text-[9px] ${t.textMuted} ml-0.5`}>({crdtPeers.length + 1})</span>}
              {key === 'changes' && <span className={`text-[9px] ${t.textMuted} ml-0.5`}>({changes.length})</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          {activeTab === 'peers' && (
            <div className="space-y-4">
              {/* Self — enhanced with connection duration */}
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px]"
                      style={{ backgroundColor: currentUserIdentity?.avatarColor || '#667eea' }}
                    >
                      {currentUserIdentity?.displayName?.[0] || '你'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1e1f32]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-white/80">{currentUserIdentity?.displayName || '你'} (本机)</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${ROLE_META[currentUserIdentity?.role || 'editor'].bg} ${ROLE_META[currentUserIdentity?.role || 'editor'].color}`}>
                        {ROLE_META[currentUserIdentity?.role || 'editor'].icon} {ROLE_META[currentUserIdentity?.role || 'editor'].label}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/30">
                      {currentUserIdentity?.email || 'developer@yanyucloud.cn'} · ws://localhost:1234/yjs-ws
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-[10px] text-white/25">
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    已连接 {currentUserIdentity?.connectedAt ? formatDuration(now - currentUserIdentity.connectedAt) : '—'}
                  </span>
                  <span>编辑中: {panels.find(p => p.id === 'panel-1')?.name || '—'}</span>
                  <span>组件: {components.length}</span>
                  <span>版本: v{crdtDocVersion}</span>
                </div>
              </div>

              {/* Peers — enhanced with duration, role management */}
              {crdtPeers.map(peer => {
                const isOnline = now - peer.lastSeen < 30000;
                const roleMeta = ROLE_META[peer.role || 'editor'];
                const cursorPanel = peer.cursor?.panelId ? panels.find(p => p.id === peer.cursor?.panelId) : null;
                const cursorComp = peer.cursor?.componentId ? components.find(c => c.id === peer.cursor?.componentId) : null;
                const lockedPanel = peer.lockedPanelId ? panels.find(p => p.id === peer.lockedPanelId) : null;

                return (
                  <div key={peer.id} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px]" style={{ backgroundColor: peer.color }}>
                          {peer.name[0]}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1e1f32] ${isOnline ? 'bg-emerald-400' : 'bg-white/15'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-white/70">{peer.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${roleMeta.bg} ${roleMeta.color}`}>
                            {roleMeta.icon} {roleMeta.label}
                          </span>
                          {!isOnline && <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">离线</span>}
                        </div>
                        <div className="text-[10px] text-white/25">{formatTime(peer.lastSeen)}</div>
                      </div>
                      {/* Role management button (simulated) */}
                      <Tooltip label="角色管理 (模拟)">
                        <button
                          onClick={() => {
                            const roles = ['owner', 'admin', 'editor', 'viewer', 'guest'] as const;
                            const currentIdx = roles.indexOf((peer.role || 'editor') as any);
                            const nextRole = roles[(currentIdx + 1) % roles.length];
                            setCRDTPeers(crdtPeers.map(p =>
                              p.id === peer.id ? { ...p, role: nextRole } : p
                            ));
                            // Add change log entry
                            setChanges(prev => [{
                              id: 'ch-role-' + Date.now(),
                              peerId: peer.id,
                              peerName: peer.name,
                              color: peer.color,
                              type: 'role-change' as const,
                              target: `角色变更: ${peer.role || 'editor'} → ${nextRole}`,
                              timestamp: Date.now(),
                            }, ...prev]);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/40 transition-all"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                    {/* Cursor & lock info */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-white/25">
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {isOnline ? '活跃中' : `最后活跃 ${formatTime(peer.lastSeen)}`}
                      </span>
                      {peer.cursor && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          正在查看: {cursorPanel?.name || '—'}
                          {cursorComp && (
                            <>
                              <ChevronRight className="w-3 h-3" />
                              {cursorComp.label || cursorComp.id}
                            </>
                          )}
                        </span>
                      )}
                      {lockedPanel && (
                        <span className="flex items-center gap-1 text-amber-400/50">
                          <Lock className="w-3 h-3" />
                          锁定: {lockedPanel.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Lock History Section */}
              {lockHistory.length > 0 && (
                <div className="rounded-xl border border-amber-500/10 overflow-hidden">
                  <div className="px-4 py-2.5 bg-amber-500/[0.04] border-b border-amber-500/10 flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-amber-400/60" />
                    <span className="text-[11px] text-amber-400/70">锁定历史</span>
                    <span className="text-[9px] text-white/20 ml-auto">{lockHistory.length} 条记录</span>
                  </div>
                  <div className="p-2 space-y-0.5 max-h-[120px] overflow-y-auto">
                    {lockHistory.map(lh => (
                      <div key={lh.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.02] transition-all">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lh.color }} />
                        {lh.type === 'lock'
                          ? <Lock className="w-3 h-3 text-amber-400/40 shrink-0" />
                          : <Unlock className="w-3 h-3 text-emerald-400/40 shrink-0" />}
                        <span className="text-[10px] text-white/40 flex-1 truncate">
                          <span style={{ color: lh.color }}>{lh.peerName}</span>
                          <span className="text-white/15 mx-1">·</span>
                          {lh.target}
                        </span>
                        <span className="text-[9px] text-white/15 shrink-0">{formatTime(lh.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awareness summary — enhanced */}
              <div className="p-3 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/10 flex items-start gap-2">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] text-cyan-400/80">Awareness Protocol — 实时状态广播</div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    yjs Awareness API 广播每个用户的光标位置、选中组件、编辑状态和面板锁定信息。
                    当前 {crdtPeers.length + 1} 个连接（{crdtPeers.filter(p => now - p.lastSeen < 30000).length + 1} 活跃），
                    CRDT 文档版本 v{crdtDocVersion}，
                    {lockHistory.filter(l => l.type === 'lock').length} 次锁定操作已记录。
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[9px] text-white/20">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      RBAC: {Object.entries(
                        [...crdtPeers.map(p => p.role || 'editor'), currentUserIdentity?.role || 'editor']
                          .reduce((acc, r) => ({ ...acc, [r]: (acc[r as keyof typeof acc] || 0) + 1 }), {} as Record<string, number>)
                      ).map(([role, count]) => `${ROLE_META[role]?.label || role}×${count}`).join(' · ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'changes' && (
            <div className="space-y-1">
              {changes.map(ch => (
                <div key={ch.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-all">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                  <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] shrink-0 ${
                    ch.type === 'insert' ? 'bg-emerald-500/15 text-emerald-400' :
                    ch.type === 'update' ? 'bg-blue-500/15 text-blue-400' :
                    ch.type === 'delete' ? 'bg-red-500/15 text-red-400' :
                    ch.type === 'lock' ? 'bg-amber-500/15 text-amber-400' :
                    ch.type === 'unlock' ? 'bg-emerald-500/15 text-emerald-400' :
                    ch.type === 'role-change' ? 'bg-purple-500/15 text-purple-400' :
                    'bg-amber-500/15 text-amber-400'
                  }`}>
                    {ch.type === 'insert' ? '+' : ch.type === 'update' ? '~' : ch.type === 'delete' ? '-' : ch.type === 'lock' ? '🔒' : ch.type === 'unlock' ? '🔓' : ch.type === 'role-change' ? '👤' : '↕'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-white/50 truncate">
                      <span style={{ color: ch.color }}>{ch.peerName}</span>
                      <span className="text-white/20 mx-1.5">·</span>
                      <span className="font-mono text-white/35">{ch.target}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-white/15 shrink-0">{formatTime(ch.timestamp)}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'document' && (
            <div className="space-y-4">
              {/* Document stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: '文版本', value: `v${crdtDocVersion}`, color: 'text-cyan-400' },
                  { label: 'Y.Doc 大小', value: `${(panels.length * 120 + components.length * 85).toLocaleString()} bytes`, color: 'text-white/50' },
                  { label: 'Y.Map 键数', value: `${panels.length + components.length}`, color: 'text-white/50' },
                  { label: '同步状态', value: syncStatus === 'synced' ? '已同步' : syncStatus === 'pending' ? '同步中' : '冲突', color: syncStatus === 'synced' ? 'text-emerald-400' : syncStatus === 'pending' ? 'text-amber-400' : 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                    <div className={`text-[14px] ${s.color}`}>{s.value}</div>
                    <div className="text-[9px] text-white/20 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Y.Doc structure */}
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-3 py-2 bg-white/[0.02] border-b border-white/[0.04] flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-cyan-400/60" />
                  <span className="text-[10px] text-white/40">Y.Doc 结构</span>
                </div>
                <pre className="p-3 text-[10px] leading-relaxed font-mono text-white/35 overflow-x-auto max-h-[280px] overflow-y-auto">
{`Y.Doc {
  clientID: ${Math.floor(Math.random() * 999999999)}
  gc: true
  
  // ── Y.Map: panels ──
  panels: Y.Map(${panels.length}) {
${panels.map(p => `    "${p.id}": Y.Map {
      name: "${p.name}"
      type: "${p.type}"
      layout: Y.Map { x:${p.x}, y:${p.y}, w:${p.w}, h:${p.h} }
      children: Y.Array(${p.children.length}) [${p.children.slice(0, 3).map(c => `"${c}"`).join(', ')}${p.children.length > 3 ? '...' : ''}]
    }`).join('\n')}
  }
  
  // ── Y.Map: components ──
  components: Y.Map(${components.length}) {
${components.slice(0, 5).map(c => `    "${c.id}": Y.Map {
      type: "${c.type}", label: "${c.label}"
      panelId: "${c.panelId}"
      props: Y.Map(${Object.keys(c.props).length}) { ... }
    }`).join('\n')}${components.length > 5 ? `\n    ... (${components.length - 5} more)` : ''}
  }
  
  // ── Y.Map: metadata ──
  metadata: Y.Map {
    version: ${crdtDocVersion}
    theme: "dark"
    project: "YANYUCLOUD 内部报表系统"
    lastModified: "${new Date().toISOString()}"
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'ws' && (
            <div className="space-y-4">
              {/* Connection status */}
              <div className={`p-4 rounded-xl border ${yjs.connected ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : 'border-red-500/20 bg-red-500/[0.04]'}`}>
                <div className="flex items-center gap-3">
                  {yjs.connected ? <Wifi className="w-5 h-5 text-emerald-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
                  <div className="flex-1">
                    <div className="text-[13px] text-white/70">{yjs.connected ? 'WebSocket 已连接' : 'WebSocket 已断开'}</div>
                    <div className="text-[10px] text-white/30 font-mono">ws://localhost:1234/yjs-ws</div>
                  </div>
                  <button
                    onClick={() => yjs.connected ? yjs.disconnect() : yjs.connect()}
                    className={`px-3 py-1.5 rounded-lg text-[10px] transition-all ${
                      yjs.connected
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {yjs.connected ? '断开' : '重连'}
                  </button>
                </div>
              </div>

              {/* Server config */}
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-3 py-2 bg-white/[0.02] border-b border-white/[0.04] flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono">y-websocket server config</span>
                  <button
                    onClick={() => handleCopy(WS_SERVER_CODE)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-white/20 hover:text-white/40"
                  >
                    {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                </div>
                <pre className="p-3 text-[10px] leading-relaxed font-mono text-white/35 overflow-x-auto max-h-[200px] overflow-y-auto">
                  {WS_SERVER_CODE}
                </pre>
              </div>

              {/* Connection metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '消息/秒', value: yjs.connected ? '2.4' : '0', color: 'text-cyan-400' },
                  { label: '延迟', value: yjs.connected ? '12ms' : '—', color: 'text-emerald-400' },
                  { label: '重连次数', value: '0', color: 'text-white/40' },
                ].map(m => (
                  <div key={m.label} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                    <div className={`text-[14px] ${m.color}`}>{m.value}</div>
                    <div className="text-[9px] text-white/20 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Offline strategy */}
              <div className="p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/10 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] text-amber-400/80">离线策略</div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    断开连接后，所有编辑自动写入 IndexedDB（本地首写）。
                    重新连接后 CRDT 会自动合并冲突，无需手动处理。
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-3 border-t ${t.sectionBorder} ${t.surfaceInset}`}>
          <span className={`text-[10px] ${t.textMuted}`}>
            yjs v13.6 · y-websocket v1.5 · CRDT v{crdtDocVersion} · {crdtPeers.length + 1} peers
          </span>
          <button onClick={toggleCRDTPanel} className={`px-4 py-1.5 rounded-lg ${t.badgeBg} ${t.textTertiary} text-[11px] ${t.hoverBg} transition-all`}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

const WS_SERVER_CODE = `// y-websocket server (src/ws-server.ts)
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils.js';
import jwt from 'jsonwebtoken';

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws, req) => {
  // JWT 认证
  const token = new URL(req.url!, 'ws://localhost')
    .searchParams.get('token');
  
  try {
    const payload = jwt.verify(token!, process.env.JWT_SECRET!);
    console.log(\`[yjs] 用户 \${payload.sub} 已连接\`);
  } catch {
    ws.close(4001, 'Unauthorized');
    return;
  }

  // 建立 yjs WebSocket 连接
  setupWSConnection(ws, req, {
    gc: true,           // 启用垃圾回收
    pingTimeout: 30000, // 心跳超时
    docName: 'yanyucloud-design',
  });
});

console.log('[yjs] WebSocket server running on ws://0.0.0.0:1234');`;