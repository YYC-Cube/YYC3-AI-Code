import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Wifi, WifiOff, Cpu, Sparkles, Clock, Users, Zap, Database, Magnet, Layers, Radio, Activity, Shield, ShieldCheck, ShieldAlert, Eye, Lock, ChevronUp, ChevronDown, CheckCircle2, XCircle, AlertTriangle, FileJson, RefreshCw, Copy } from 'lucide-react';
import { useDesigner } from '../../store';
import { Tooltip } from './Tooltip';
import { useThemeTokens } from './hooks/useThemeTokens';
import { api } from '../../apiClient';
import { useGlobalAI } from '../../aiModelContext';
import { useHealthMonitor, type HealthStatus as SystemHealthStatus } from '../ErrorBoundary';

/* ================================================================
   Model health ping hook
   ================================================================ */

type HealthStatus = 'unknown' | 'online' | 'offline' | 'checking';

function useModelHealth(intervalMs = 30_000) {
  const { aiModels, activeModelId } = useDesigner();
  const [status, setStatus] = useState<HealthStatus>('unknown');
  const [latency, setLatency] = useState<number | null>(null);
  const mountedRef = useRef(true);

  const activeModel = aiModels.find(m => m.id === activeModelId) ?? null;

  useEffect(() => {
    mountedRef.current = true;
    let timer: ReturnType<typeof setInterval>;

    const ping = async () => {
      if (!activeModel) { setStatus('unknown'); return; }
      setStatus('checking');
      const start = performance.now();
      try {
        const res = await api.system.health();
        if (!mountedRef.current) return;
        const ms = Math.round(performance.now() - start);
        setLatency(ms);
        setStatus(res.ok ? 'online' : 'offline');
      } catch {
        if (!mountedRef.current) return;
        setLatency(null);
        setStatus('offline');
      }
    };

    ping();
    timer = setInterval(ping, intervalMs);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [activeModel?.id, intervalMs]);

  return { status, latency, activeModel };
}

/* ================================================================
   RBAC role labels & colors
   ================================================================ */

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  owner: { label: '所有者', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  admin: { label: '管理员', color: 'text-rose-400', bg: 'bg-rose-500/15' },
  editor: { label: '编辑者', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  viewer: { label: '观察者', color: 'text-white/40', bg: 'bg-white/[0.06]' },
  guest: { label: '访客', color: 'text-white/25', bg: 'bg-white/[0.04]' },
};

export function StatusBar() {
  const t = useThemeTokens();
  const { syncStatus, aiTokensUsed, panels, components, snapEnabled, subCanvasPanelId, crdtPeers, crdtDocVersion, currentUserIdentity, designJsonValid, designJsonErrors, dataBindings } = useDesigner();
  const globalAI = useGlobalAI();
  const [time, setTime] = useState(new Date());
  const { status: modelStatus, latency: modelLatency, activeModel } = useModelHealth(30_000);
  const [peerListOpen, setPeerListOpen] = useState(false);
  const peerListRef = useRef<HTMLDivElement>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const validationRef = useRef<HTMLDivElement>(null);

  // System health monitor (circuit breaker + error rate + memory)
  const { health: sysHealth, errorRate, memoryUsage } = useHealthMonitor();

  // Close peer list on outside click
  useEffect(() => {
    if (!peerListOpen) return;
    const handler = (e: MouseEvent) => {
      if (peerListRef.current && !peerListRef.current.contains(e.target as Node)) {
        setPeerListOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [peerListOpen]);

  // Close validation list on outside click
  useEffect(() => {
    if (!validationOpen) return;
    const handler = (e: MouseEvent) => {
      if (validationRef.current && !validationRef.current.contains(e.target as Node)) {
        setValidationOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [validationOpen]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const dotSynced = t.statusSyncedDot;
  const dotPending = t.statusPendingDot;
  const dotConflict = t.statusConflictDot;
  const sepClass = `w-px h-3 ${t.separator}`;

  return (
    <footer className={`h-7 border-t ${t.sectionBorder} ${t.panelBg} flex items-center px-3 gap-4 shrink-0 select-none ${t.scrollClass}`}
      style={{ boxShadow: '0 -1px 0 rgba(255,255,255,0.02), 0 -4px 16px -4px rgba(0,0,0,0.3)' }}
    >
      {/* Sync status */}
      <Tooltip label={
        syncStatus === 'synced' ? 'CRDT 文档已与服务端完全同步' :
        syncStatus === 'pending' ? 'CRDT 文档正在同步到服务端...' :
        'CRDT 文档存在版本冲突，请手动合并'
      } side="top">
        <div className="flex items-center gap-1.5 cursor-default">
          <div className={`w-1.5 h-1.5 rounded-full ${
            syncStatus === 'synced' ? dotSynced :
            syncStatus === 'pending' ? dotPending :
            dotConflict
          }`} />
          {syncStatus === 'synced' ? (
            <Wifi className={`w-3 h-3 ${t.statusSyncedIcon}`} />
          ) : (
            <WifiOff className={`w-3 h-3 ${t.statusPendingIcon}`} />
          )}
          <span className={`text-[10px] ${t.textTertiary}`}>
            CRDT {syncStatus === 'synced' ? '已同步' : syncStatus === 'pending' ? '同步中' : '冲突'}
          </span>
        </div>
      </Tooltip>

      <div className={sepClass} />

      {/* Panels & Components count */}
      <Tooltip label={`当前项目含 ${panels.length} 个面板、${components.length} 个组件实例`} side="top">
        <div className="flex items-center gap-1.5 cursor-default">
          <Database className={`w-3 h-3 ${t.textMuted}`} />
          <span className={`text-[10px] ${t.textTertiary}`}>{panels.length} 面板 · {components.length} 组件</span>
        </div>
      </Tooltip>

      <div className={sepClass} />

      {/* AI tokens */}
      <Tooltip label={`本次会话已消耗 ${aiTokensUsed.toLocaleString()} tokens`} side="top">
        <div className="flex items-center gap-1.5 cursor-default">
          <Sparkles className={`w-3 h-3 ${t.accent} opacity-40`} />
          <span className={`text-[10px] ${t.textTertiary}`}>AI: {aiTokensUsed.toLocaleString()} tokens</span>
        </div>
      </Tooltip>

      <div className={sepClass} />

      {/* Collab */}
      <div className="relative" ref={peerListRef}>
        <Tooltip label={`${crdtPeers.length + 1} 位协作者在线 · CRDT v${crdtDocVersion} · 点击查看详情`} side="top">
          <button
            onClick={() => setPeerListOpen(prev => !prev)}
            className="flex items-center gap-1.5 cursor-pointer hover:bg-white/[0.04] rounded px-1.5 py-0.5 transition-all"
          >
            <Users className={`w-3 h-3 ${t.textMuted}`} />
            <span className={`text-[10px] ${t.textTertiary}`}>{crdtPeers.length + 1} 在线</span>
            <div className="flex -space-x-1">
              {crdtPeers.slice(0, 4).map(p => (
                <div key={p.id} className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.color, border: `1px solid ${t.peerBorderColor}` }} />
              ))}
              <div className={`w-3.5 h-3.5 rounded-full ${t.btnPrimary}`} style={{ border: `1px solid ${t.peerBorderColor}` }} />
            </div>
            {peerListOpen
              ? <ChevronDown className={`w-2.5 h-2.5 ${t.textMuted}`} />
              : <ChevronUp className={`w-2.5 h-2.5 ${t.textMuted}`} />}
          </button>
        </Tooltip>

        {/* Peer List Popover */}
        {peerListOpen && (
          <div
            className={`absolute bottom-full left-0 mb-1.5 w-[280px] ${t.modalBg} border ${t.modalBorder} rounded-xl overflow-hidden z-[200]`}
            style={{ boxShadow: '0 -8px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}
          >
            {/* Popover header */}
            <div className={`px-3 py-2 border-b ${t.sectionBorder} flex items-center gap-2`}>
              <Users className={`w-3.5 h-3.5 ${t.accent}`} />
              <span className={`text-[11px] ${t.textSecondary}`}>在线协作者</span>
              <span className={`text-[9px] ${t.textMuted} ml-auto`}>CRDT v{crdtDocVersion}</span>
            </div>

            <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-0.5">
              {/* Self */}
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${t.accentBg.replace('/20', '/[0.04]')} border ${t.accentBorder?.replace('/30', '/10') || 'border-transparent'}`}>
                <div className="relative shrink-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]"
                    style={{ backgroundColor: currentUserIdentity?.avatarColor || '#667eea' }}
                  >
                    {currentUserIdentity?.displayName?.[0] || '我'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2" style={{ borderColor: t.peerBorderColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] ${t.textPrimary} truncate`}>{currentUserIdentity?.displayName || '你'}</span>
                    <span className={`text-[8px] ${t.accent} opacity-60`}>本机</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] px-1.5 py-0 rounded ${ROLE_META[currentUserIdentity?.role || 'editor'].bg} ${ROLE_META[currentUserIdentity?.role || 'editor'].color}`}>
                      {ROLE_META[currentUserIdentity?.role || 'editor'].label}
                    </span>
                    <span className={`text-[9px] ${t.textMuted}`}>
                      <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                      活跃编辑中
                    </span>
                  </div>
                </div>
              </div>

              {/* Peers */}
              {crdtPeers.map(peer => {
                const isOnline = Date.now() - peer.lastSeen < 30000;
                const cursorPanel = peer.cursor?.panelId
                  ? panels.find(p => p.id === peer.cursor?.panelId)
                  : null;
                const cursorComp = peer.cursor?.componentId
                  ? components.find(c => c.id === peer.cursor?.componentId)
                  : null;
                const roleMeta = ROLE_META[peer.role || 'editor'];

                return (
                  <div key={peer.id} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.03] transition-all`}>
                    <div className="relative shrink-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]"
                        style={{ backgroundColor: peer.color }}
                      >
                        {peer.name[0]}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isOnline ? 'bg-emerald-400' : 'bg-white/20'}`}
                        style={{ borderColor: t.peerBorderColor }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] ${t.textSecondary} truncate`}>{peer.name}</span>
                        {peer.lockedPanelId && (
                          <Lock className="w-2.5 h-2.5 text-amber-400/60 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0 rounded ${roleMeta.bg} ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                        {cursorPanel ? (
                          <span className={`text-[9px] ${t.textMuted} truncate`}>
                            <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                            {cursorPanel.name}{cursorComp ? ` › ${cursorComp.label}` : ''}
                          </span>
                        ) : (
                          <span className={`text-[9px] ${t.textMuted}`}>
                            {isOnline ? '在线空闲' : '已离线'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Popover footer */}
            <div className={`px-3 py-1.5 border-t ${t.sectionBorder} flex items-center justify-between`}>
              <span className={`text-[9px] ${t.textMuted}`}>Awareness Protocol · yjs v13.6</span>
              <span className={`text-[9px] ${t.textMuted}`}>{crdtPeers.filter(p => Date.now() - p.lastSeen < 30000).length + 1} 活跃</span>
            </div>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* System Health Indicator */}
      <Tooltip label={
        `系统状态: ${sysHealth.overall === 'healthy' ? '正常' : sysHealth.overall === 'degraded' ? '部分降级' : '异常'}\n` +
        `API: ${sysHealth.api === 'healthy' ? '正常' : sysHealth.api === 'degraded' ? '降级' : sysHealth.api === 'down' ? '不可用' : '未知'}\n` +
        `WebSocket: ${sysHealth.ws === 'connected' ? '已连接' : sysHealth.ws === 'reconnecting' ? '重连中' : sysHealth.ws === 'disconnected' ? '已断开' : '未知'}\n` +
        `错误率: ${errorRate}/min` +
        (memoryUsage !== null ? ` · 内存: ${(memoryUsage * 100).toFixed(0)}%` : '')
      } side="top">
        <div className="flex items-center gap-1.5 cursor-default">
          <div className={`w-1.5 h-1.5 rounded-full ${
            sysHealth.overall === 'healthy' ? 'bg-emerald-400' :
            sysHealth.overall === 'degraded' ? 'bg-amber-400 animate-pulse' :
            'bg-red-500 animate-pulse'
          }`} />
          <span className={`text-[10px] ${
            sysHealth.overall === 'healthy' ? 'text-emerald-400/50' :
            sysHealth.overall === 'degraded' ? 'text-amber-400/50' :
            'text-red-400/60'
          }`}>
            {sysHealth.overall === 'healthy' ? '系统正常' :
             sysHealth.overall === 'degraded' ? '部分降级' : '系统异常'}
          </span>
        </div>
      </Tooltip>

      <div className={sepClass} />

      {/* Auth indicator */}
      <Tooltip label={
        globalAI.isAuthenticated
          ? `已登录: ${globalAI.session?.user.name} (${globalAI.session?.user.role}) · 配额: ${Math.round(globalAI.quota.tokensUsed / 1000)}K / ${Math.round(globalAI.quota.tokensLimit / 1000)} tokens`
          : '未登录 — 点击首页头像进行统一认证'
      } side="top">
        <div className="flex items-center gap-1.5 cursor-default">
          {globalAI.isAuthenticated ? (
            <>
              <ShieldCheck className={`w-3 h-3 ${t.accent}`} />
              <span className={`text-[10px] ${t.accent}`}>{globalAI.session?.user.name}</span>
              <div className="w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    (globalAI.quota.tokensUsed / globalAI.quota.tokensLimit) > 0.8
                      ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: Math.min(100, (globalAI.quota.tokensUsed / globalAI.quota.tokensLimit) * 100) + '%' }}
                />
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className={`w-3 h-3 ${t.textMuted}`} />
              <span className={`text-[10px] ${t.textMuted}`}>未认证</span>
            </>
          )}
        </div>
      </Tooltip>

      <div className={sepClass} />

      {/* Sub-canvas indicator */}
      {subCanvasPanelId && (
        <>
          <div className="flex items-center gap-1.5 cursor-default">
            <Layers className={`w-3 h-3 ${t.accent} opacity-60`} />
            <span className={`text-[10px] ${t.accent} opacity-40`}>子画布模式</span>
          </div>
          <div className={sepClass} />
        </>
      )}

      {/* Snap status */}
      <Tooltip label={snapEnabled ? '边缘捕捉已开启 (右键画布切换)' : '边缘捕捉已关闭'} side="top">
        <div className="flex items-center gap-1 cursor-default">
          <Magnet className={`w-3 h-3 ${snapEnabled ? `${t.snapActiveText} opacity-50` : t.textMuted}`} />
          <span className={`text-[10px] ${snapEnabled ? `${t.snapActiveText} opacity-30` : t.textMuted}`}>
            Snap {snapEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </Tooltip>

      <div className={sepClass} />

      {/* Engine info */}
      <Tooltip label="低码引擎版本：JSON→React/Vue 代码生成器" side="top">
        <div className="flex items-center gap-1.5 cursor-default">
          <Zap className={`w-3 h-3 ${t.textMuted}`} />
          <span className={`text-[10px] ${t.textMuted}`}>Engine v2.4.1</span>
        </div>
      </Tooltip>

      <div className={sepClass} />

      <Tooltip label="前端运行时：React 18 + TypeScript + Vite 5" side="top">
        <div className="flex items-center gap-1.5 cursor-default">
          <Cpu className={`w-3 h-3 ${t.textMuted}`} />
          <span className={`text-[10px] ${t.textMuted}`}>React 18 + TypeScript</span>
        </div>
      </Tooltip>

      <div className={sepClass} />

      <Tooltip label="宿主机本地时间" side="top">
        <div className="flex items-center gap-1.5 cursor-default">
          <Clock className={`w-3 h-3 ${t.textMuted}`} />
          <span className={`text-[10px] ${t.textMuted}`}>
            {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </Tooltip>

      <div className={sepClass} />

      {/* Model health */}
      <Tooltip label={
        modelStatus === 'unknown' ? 'AI 模型状态未知' :
        modelStatus === 'checking' ? '正在检查 AI 模型状态...' :
        modelStatus === 'online' ? `AI 模型在线，响应时间 ${modelLatency} ms` :
        'AI 模型离线'
      } side="top">
        <div className="flex items-center gap-1.5 cursor-default">
          <Activity className={`w-3 h-3 ${modelStatus === 'online' ? t.accent : t.textMuted}`} />
          <span className={`text-[10px] ${modelStatus === 'online' ? t.accent : t.textTertiary}`}>
            {modelStatus === 'unknown' ? '未知' :
            modelStatus === 'checking' ? '检查中' :
            modelStatus === 'online' ? '在线' :
            '离线'}
          </span>
        </div>
      </Tooltip>

      {/* Validation status */}
      <div className={sepClass} />
      <div className="relative" ref={validationRef}>
        <Tooltip label={
          designJsonValid
            ? `Design JSON 校验通过 · ${panels.length} 面板 · ${components.length} 组件 · ${Object.keys(dataBindings).length} 数据绑定`
            : `Design JSON 存在 ${designJsonErrors.length} 个错误 · 点击查看详情`
        } side="top">
          <button
            onClick={() => setValidationOpen(prev => !prev)}
            className={`flex items-center gap-1.5 cursor-pointer hover:bg-white/[0.04] rounded px-1.5 py-0.5 transition-all ${!designJsonValid ? 'bg-red-500/[0.06]' : ''}`}
          >
            {designJsonValid ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
            ) : (
              <XCircle className="w-3 h-3 text-red-400/70" />
            )}
            <span className={`text-[10px] ${designJsonValid ? 'text-emerald-400/50' : 'text-red-400/60'}`}>
              JSON {designJsonValid ? '有效' : `${designJsonErrors.length} 错误`}
            </span>
            {validationOpen
              ? <ChevronDown className={`w-2.5 h-2.5 ${t.textMuted}`} />
              : <ChevronUp className={`w-2.5 h-2.5 ${t.textMuted}`} />}
          </button>
        </Tooltip>

        {/* Design JSON Validation Popover */}
        {validationOpen && (
          <DesignJsonValidationPanel
            panels={panels}
            components={components}
            dataBindings={dataBindings}
            designJsonValid={designJsonValid}
            designJsonErrors={designJsonErrors}
            crdtDocVersion={crdtDocVersion}
            t={t}
            onClose={() => setValidationOpen(false)}
          />
        )}
      </div>
    </footer>
  );
}

/* ================================================================
   Design JSON Validation Panel — collapsible popover
   ================================================================ */

function DesignJsonValidationPanel({
  panels, components, dataBindings, designJsonValid, designJsonErrors, crdtDocVersion, t, onClose,
}: {
  panels: any[];
  components: any[];
  dataBindings: Record<string, string>;
  designJsonValid: boolean;
  designJsonErrors: string[];
  crdtDocVersion: number;
  t: ReturnType<typeof useThemeTokens>;
  onClose: () => void;
}) {
  const [copiedJson, setCopiedJson] = useState(false);
  const bindingCount = Object.keys(dataBindings).length;
  const orphanComps = components.filter(c => !panels.some(p => p.children?.includes(c.id)));

  // Extended validation — deeper checks beyond store's basic validation
  const extendedWarnings = useMemo(() => {
    const warnings: { severity: 'error' | 'warning' | 'info'; message: string; target?: string }[] = [];

    // Errors from store
    designJsonErrors.forEach(e => {
      warnings.push({ severity: 'error', message: e });
    });

    // Warnings — non-blocking issues
    panels.forEach(p => {
      if ((p.children?.length || 0) === 0) {
        warnings.push({ severity: 'warning', message: `面板「${p.name}」为空`, target: p.id });
      }
      if (p.w > 12) {
        warnings.push({ severity: 'warning', message: `面板「${p.name}」宽度超过 12 列栅格`, target: p.id });
      }
    });

    // Check for duplicate component IDs
    const ids = new Set<string>();
    components.forEach(c => {
      if (ids.has(c.id)) {
        warnings.push({ severity: 'error', message: `重复组件 ID: ${c.id}`, target: c.id });
      }
      ids.add(c.id);
    });

    // Stale bindings
    Object.entries(dataBindings).forEach(([compId, source]) => {
      if (!components.find(c => c.id === compId)) {
        warnings.push({ severity: 'warning', message: `数据绑定「${source}」引用不存在的组件`, target: compId });
      }
    });

    // Orphan components
    if (orphanComps.length > 0) {
      warnings.push({ severity: 'warning', message: `${orphanComps.length} 个组件未归属任何面板` });
    }

    // Info
    if (warnings.filter(w => w.severity === 'error').length === 0 && warnings.filter(w => w.severity === 'warning').length === 0) {
      warnings.push({ severity: 'info', message: '所有校验通过，设计结构完整' });
    }

    return warnings;
  }, [panels, components, dataBindings, designJsonErrors, orphanComps]);

  const errorCount = extendedWarnings.filter(w => w.severity === 'error').length;
  const warnCount = extendedWarnings.filter(w => w.severity === 'warning').length;
  const infoCount = extendedWarnings.filter(w => w.severity === 'info').length;

  const handleCopyJson = () => {
    const json = JSON.stringify({
      panels: panels.map(p => ({ id: p.id, name: p.name, type: p.type, w: p.w, h: p.h, children: p.children })),
      components: components.map(c => ({ id: c.id, type: c.type, label: c.label, panelId: c.panelId })),
      dataBindings,
      metadata: { version: crdtDocVersion, timestamp: new Date().toISOString() },
    }, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    });
  };

  const severityConfig = {
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/[0.06]', border: 'border-red-500/15', dot: 'bg-red-400' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/[0.06]', border: 'border-amber-500/15', dot: 'bg-amber-400' },
    info: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.06]', border: 'border-emerald-500/15', dot: 'bg-emerald-400' },
  };

  return (
    <div
      className={`absolute bottom-full right-0 mb-1.5 w-[340px] ${t.modalBg} border ${t.modalBorder} rounded-xl overflow-hidden z-[200]`}
      style={{ boxShadow: '0 -8px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}
    >
      {/* Header */}
      <div className={`px-3 py-2.5 border-b ${t.sectionBorder} flex items-center gap-2`}>
        <FileJson className={`w-3.5 h-3.5 ${t.accent}`} />
        <span className={`text-[11px] ${t.textSecondary}`}>Design JSON 验证</span>
        <div className="flex items-center gap-1.5 ml-auto">
          {errorCount > 0 && (
            <span className="text-[9px] text-red-400/70 bg-red-500/10 px-1.5 py-0.5 rounded">{errorCount} 错误</span>
          )}
          {warnCount > 0 && (
            <span className="text-[9px] text-amber-400/70 bg-amber-500/10 px-1.5 py-0.5 rounded">{warnCount} 警告</span>
          )}
          {errorCount === 0 && warnCount === 0 && (
            <span className="text-[9px] text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">通过</span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className={`px-3 py-2 border-b ${t.sectionBorder} flex items-center gap-3`}>
        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-white/20" />
          <span className="text-[9px] text-white/30">{panels.length} 面板</span>
        </div>
        <div className="flex items-center gap-1">
          <Database className="w-3 h-3 text-white/20" />
          <span className="text-[9px] text-white/30">{components.length} 组件</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-white/20" />
          <span className="text-[9px] text-white/30">{bindingCount} 绑定</span>
        </div>
        <span className="text-[9px] text-white/15 ml-auto">v{crdtDocVersion}</span>
      </div>

      {/* Validation results */}
      <div className="max-h-[220px] overflow-y-auto p-1.5 space-y-1">
        {extendedWarnings.map((w, i) => {
          const cfg = severityConfig[w.severity];
          const Icon = cfg.icon;
          return (
            <div
              key={i}
              className={`flex items-start gap-2 px-2.5 py-2 rounded-lg ${cfg.bg} border ${cfg.border} transition-all`}
            >
              <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] ${cfg.color}`}>{w.message}</span>
                {w.target && (
                  <div className="text-[8px] text-white/15 mt-0.5 font-mono truncate">{w.target}</div>
                )}
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} opacity-50 shrink-0 mt-1.5`} />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`px-3 py-2 border-t ${t.sectionBorder} flex items-center gap-2`}>
        <button
          onClick={handleCopyJson}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[9px] text-white/30 hover:text-white/50 transition-all"
        >
          <Copy className="w-3 h-3" />
          {copiedJson ? '已复制' : '复制 JSON'}
        </button>
        <span className={`text-[9px] ${t.textMuted} ml-auto`}>
          Zod Schema 验证器
        </span>
      </div>
    </div>
  );
}