/**
 * @file useCRDTAwareness.ts
 * @description CRDT Awareness Protocol — Designer 路由专用用户身份注册/模拟 Peer 生成
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-14
 * @updated 2026-03-15
 * @status deprecated
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags crdt,awareness,identity,designer,deprecated
 * @deprecated 仅用于 Designer 路由的模拟 Peer 系统。AI Code 路由已迁移至 useCRDTCollab.ts v2.0.0
 *   (自带 AwarenessProtocol + WebSocket Provider)。未来计划统一两个路由的协同系统。
 */

/**
 * useCRDTAwareness — CRDT Awareness Protocol
 *
 * 当用户进入 Designer 路由时自动注册身份到 CRDT 文档，
 * 离开时自动注销。同时模拟其他协同 Peer 的存在状态。
 *
 * Phase 12 — 多人协同 RBAC
 */

import { useEffect, useRef, useCallback } from 'react';
import type { CRDTUserIdentity, CRDTPeer } from '../store';

/* ================================================================
   Peer color palette — unique avatar colors for CRDT peers
   ================================================================ */

const AVATAR_COLORS = [
  '#667eea', // yyc3-brand
  '#f43f5e', // rose
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
];

function pickColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/* ================================================================
   Local identity persistence
   ================================================================ */

const IDENTITY_KEY = 'yyc3-crdt-identity';

function loadOrCreateIdentity(): CRDTUserIdentity {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CRDTUserIdentity;
      // Refresh connectedAt on each session
      return { ...parsed, connectedAt: Date.now() };
    }
  } catch { /* ignore */ }

  // Generate new identity
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
   Simulated peers — demo / development mode
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

/* ================================================================
   Hook interface
   ================================================================ */

interface UseCRDTAwarenessOptions {
  setCurrentUserIdentity: (identity: CRDTUserIdentity | null) => void;
  setCRDTPeers: (peers: CRDTPeer[]) => void;
  incrementDocVersion: () => void;
}

export type { UseCRDTAwarenessOptions };

export function useCRDTAwareness({
  setCurrentUserIdentity,
  setCRDTPeers,
  incrementDocVersion,
}: UseCRDTAwarenessOptions) {
  const identityRef = useRef<CRDTUserIdentity | null>(null);
  const peerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- Mount: register identity ---- */
  useEffect(() => {
    const identity = loadOrCreateIdentity();
    identityRef.current = identity;

    // Register self into CRDT document
    setCurrentUserIdentity(identity);

    // Simulate peers joining with staggered timing
    const now = Date.now();
    const initialPeers: CRDTPeer[] = SIMULATED_PEERS.map((p) => ({
      ...p,
      lastSeen: now - Math.floor(Math.random() * 30000),
    }));
    setCRDTPeers(initialPeers);
    incrementDocVersion();

    // Periodically update peer cursors to simulate real-time awareness
    peerIntervalRef.current = setInterval(() => {
      const panelIds = ['panel-1', 'panel-2', 'panel-3', 'panel-4'];
      const updatedPeers: CRDTPeer[] = SIMULATED_PEERS.map((p) => ({
        ...p,
        lastSeen: Date.now() - Math.floor(Math.random() * 5000),
        cursor: Math.random() > 0.3
          ? { panelId: panelIds[Math.floor(Math.random() * panelIds.length)] }
          : null,
        // Randomly simulate lock acquisition
        lockedPanelId: Math.random() > 0.85
          ? panelIds[Math.floor(Math.random() * panelIds.length)]
          : undefined,
      }));
      setCRDTPeers(updatedPeers);
    }, 8000); // Update every 8 seconds

    // Cleanup: unregister on unmount
    return () => {
      setCurrentUserIdentity(null);
      setCRDTPeers([]);
      if (peerIntervalRef.current) {
        clearInterval(peerIntervalRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Manually update own identity (e.g. after role change from settings) */
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
    identity: identityRef.current,
    updateIdentity,
  };
}