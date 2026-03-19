/**
 * @file useDesignerCRDT.ts
 * @description Designer 路由 CRDT 协同适配器 — 将 useCRDTCollab v2.0 桥接到 Designer store 状态模型
 *   替代已废弃的 useCRDTAwareness.ts，统一两套协同系统为一个 yjs 文档驱动架构
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags crdt,yjs,designer,awareness,bridge,collaboration
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useCRDTCollab, type CRDTUser } from './useCRDTCollab';
import { useAppSettings } from './useAppSettings';
import type { CRDTUserIdentity, CRDTPeer, RBACRole } from '../store';

/* ================================================================
   Constants
   ================================================================ */

const IDENTITY_KEY = 'yyc3-crdt-identity';

const AVATAR_COLORS = [
  '#667eea', '#f43f5e', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
];

function pickColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/* ================================================================
   Identity: load from RBAC → localStorage → generate new
   ================================================================ */

function loadOrCreateIdentity(rbacIdentity: CRDTUserIdentity | null): CRDTUserIdentity {
  // Priority 1: RBAC identity from useAppSettings
  if (rbacIdentity) {
    return { ...rbacIdentity, connectedAt: Date.now() };
  }

  // Priority 2: localStorage persisted identity
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CRDTUserIdentity;
      return { ...parsed, connectedAt: Date.now() };
    }
  } catch { /* ignore */ }

  // Priority 3: Generate new identity
  const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const identity: CRDTUserIdentity = {
    userId,
    displayName: 'YanYu 开发者',
    email: 'developer@yanyucloud.cn',
    role: 'editor',
    avatarColor: pickColor(Math.floor(Math.random() * AVATAR_COLORS.length)),
    connectedAt: Date.now(),
  };

  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch { /* ignore */ }

  return identity;
}

/* ================================================================
   Simulated peers — demo / dev mode (when no real WebSocket peers)
   ================================================================ */

const SIMULATED_PEERS: Omit<CRDTPeer, 'lastSeen'>[] = [
  {
    id: 'peer-alice-001',
    name: 'Alice',
    color: '#f43f5e',
    cursor: { panelId: 'panel-1' },
    role: 'admin',
    lockedPanelId: undefined,
  },
  {
    id: 'peer-bob-002',
    name: 'Bob',
    color: '#10b981',
    cursor: { panelId: 'panel-2', componentId: 'comp-4' },
    role: 'editor',
    lockedPanelId: undefined,
  },
  {
    id: 'peer-charlie-003',
    name: 'Charlie',
    color: '#f59e0b',
    cursor: null,
    role: 'viewer',
    lockedPanelId: undefined,
  },
];

function generateSimulatedPeers(): CRDTPeer[] {
  const panelIds = ['panel-1', 'panel-2', 'panel-3', 'panel-4'];
  return SIMULATED_PEERS.map((p) => ({
    ...p,
    lastSeen: Date.now() - Math.floor(Math.random() * 5000),
    cursor: Math.random() > 0.3
      ? { panelId: panelIds[Math.floor(Math.random() * panelIds.length)] }
      : null,
    lockedPanelId: Math.random() > 0.85
      ? panelIds[Math.floor(Math.random() * panelIds.length)]
      : undefined,
  }));
}

/* ================================================================
   CRDTUser → CRDTPeer adapter
   ================================================================ */

function crdtUserToPeer(user: CRDTUser): CRDTPeer {
  return {
    id: user.id,
    name: user.name,
    color: user.color,
    cursor: user.cursor
      ? { panelId: user.fileId || 'unknown' }
      : null,
    lastSeen: user.lastActive,
    role: 'editor' as RBACRole, // Remote peers default to editor; real role comes from awareness
    lockedPanelId: undefined,
  };
}

/* ================================================================
   Hook interface — matches what DesignerLayout needs
   ================================================================ */

interface UseDesignerCRDTOptions {
  /** Room name / project identifier */
  projectId: string;
  /** Store: set current user identity */
  setCurrentUserIdentity: (identity: CRDTUserIdentity | null) => void;
  /** Store: set CRDT peers */
  setCRDTPeers: (peers: CRDTPeer[]) => void;
  /** Store: increment doc version counter */
  incrementDocVersion: () => void;
  /** Store: set sync status */
  setSyncStatus: (s: 'synced' | 'pending' | 'conflict') => void;
}

export function useDesignerCRDT({
  projectId,
  setCurrentUserIdentity,
  setCRDTPeers,
  incrementDocVersion,
  setSyncStatus,
}: UseDesignerCRDTOptions) {
  const { rbacUser } = useAppSettings();
  const peerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const identityRef = useRef<CRDTUserIdentity | null>(null);

  // Stable identity derived from RBAC or localStorage
  const identity = useMemo(
    () => loadOrCreateIdentity(rbacUser.identity),
    [rbacUser.identity]
  );

  // CRDT user for useCRDTCollab
  const crdtUser = useMemo(() => ({
    id: identity.userId,
    name: identity.displayName,
    color: identity.avatarColor,
  }), [identity]);

  // WebSocket URL (localStorage override or local-only)
  const wsUrl = useMemo(() => {
    try {
      const override = localStorage.getItem('yyc3-crdt-ws-url');
      if (override) return override;
    } catch { /* ignore */ }
    return undefined;
  }, []);

  // Core CRDT hook
  const crdt = useCRDTCollab({
    roomName: `yyc3-designer-${projectId}`,
    user: crdtUser,
    wsUrl,
    enablePersistence: true,
    enableUndoManager: false, // Designer has its own undo history in store
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectBaseDelay: 1000,
  });

  /* ── Bridge identity to store ── */
  useEffect(() => {
    identityRef.current = identity;
    setCurrentUserIdentity(identity);
    return () => {
      setCurrentUserIdentity(null);
    };
  }, [identity, setCurrentUserIdentity]);

  /* ── Bridge sync status ── */
  useEffect(() => {
    const status = crdt.status;
    if (status === 'synced' || status === 'connected') {
      setSyncStatus('synced');
    } else if (status === 'conflict') {
      setSyncStatus('conflict');
    } else if (status === 'syncing' || status === 'connecting') {
      setSyncStatus('pending');
    }
    // 'disconnected' and 'error' → keep current status
  }, [crdt.status, setSyncStatus]);

  /* ── Bridge remote users → CRDTPeers ── */
  useEffect(() => {
    const realPeers: CRDTPeer[] = crdt.remoteUsers.map(crdtUserToPeer);

    if (realPeers.length > 0) {
      // Real remote peers exist → use them (no simulated peers)
      setCRDTPeers(realPeers);
    } else {
      // No real remote peers → show simulated peers for dev/demo
      // Only start simulation if no WS connection
      if (!wsUrl) {
        // Simulated peers are handled by the interval below
      } else {
        // WS connected but no peers yet → empty
        setCRDTPeers([]);
      }
    }
  }, [crdt.remoteUsers, wsUrl, setCRDTPeers]);

  /* ── Simulated peers for dev mode (no WS) ── */
  useEffect(() => {
    if (wsUrl) {
      // Real WS mode — skip simulation
      if (peerIntervalRef.current) {
        clearInterval(peerIntervalRef.current);
        peerIntervalRef.current = null;
      }
      return;
    }

    // Initial simulated peers
    setCRDTPeers(generateSimulatedPeers());
    incrementDocVersion();

    // Periodically refresh simulated peers
    peerIntervalRef.current = setInterval(() => {
      setCRDTPeers(generateSimulatedPeers());
    }, 8000);

    return () => {
      if (peerIntervalRef.current) {
        clearInterval(peerIntervalRef.current);
        peerIntervalRef.current = null;
      }
    };
  }, [wsUrl, setCRDTPeers, incrementDocVersion]);

  /* ── Track document changes → incrementDocVersion ── */
  useEffect(() => {
    const ydoc = crdt.ydocRef.current;
    if (!ydoc) return;

    const handler = () => {
      incrementDocVersion();
    };
    ydoc.on('update', handler);
    return () => { ydoc.off('update', handler); };
  }, [crdt.ydocRef, incrementDocVersion]);

  /* ── Manual identity update (e.g. after role change from settings) ── */
  const updateIdentity = useCallback((partial: Partial<CRDTUserIdentity>) => {
    if (!identityRef.current) return;
    const updated = { ...identityRef.current, ...partial };
    identityRef.current = updated;
    setCurrentUserIdentity(updated);
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [setCurrentUserIdentity]);

  return {
    /** The resolved user identity */
    identity,
    /** Update identity (e.g. after role change) */
    updateIdentity,
    /** Full CRDT hook return for advanced usage */
    crdt,
    /** Current sync status from useCRDTCollab */
    syncStatus: crdt.status,
    /** WebSocket connection state */
    wsState: crdt.wsState,
    /** Real remote users (from awareness, excludes self) */
    remoteUsers: crdt.remoteUsers,
    /** All connected users (from awareness, includes self) */
    connectedUsers: crdt.connectedUsers,
    /** WebSocket errors */
    wsErrors: crdt.wsErrors,
    /** CRDT stats (doc size, latency, bandwidth) */
    stats: crdt.stats,
  };
}
