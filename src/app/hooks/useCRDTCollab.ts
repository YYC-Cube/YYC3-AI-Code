/**
 * @file useCRDTCollab.ts
 * @description CRDT 实时协同 hook v2.0.0 — 基于 yjs + 自定义 WebSocket Provider + Awareness 协议
 *   实现多人实时代码编辑、光标/选区感知、IndexedDB 持久化、断线重连、状态追踪
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-03-14
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags crdt,yjs,websocket,awareness,collaboration,real-time,ai-code
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

/* ================================================================
   Types
   ================================================================ */
export type CRDTSyncStatus = 'disconnected' | 'connecting' | 'connected' | 'synced' | 'syncing' | 'conflict' | 'error';
export type WSConnectionState = 'closed' | 'connecting' | 'open' | 'reconnecting';

export interface CRDTUser {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
  fileId?: string;
  lastActive: number;
}

export interface CRDTAwarenessState {
  user: CRDTUser;
  fileId?: string;
  timestamp: number;
}

export interface CRDTStats {
  documentSize: number;
  undoStackSize: number;
  redoStackSize: number;
  connectedPeers: number;
  lastSyncTime: number | null;
  totalEdits: number;
  wsLatency: number | null;
  bytesSent: number;
  bytesReceived: number;
}

export interface CRDTCollabConfig {
  /** Room / document name (unique per project+file) */
  roomName: string;
  /** Current user info */
  user: { id: string; name: string; color: string };
  /** WebSocket server URL (optional — if provided, enables remote sync) */
  wsUrl?: string;
  /** Enable IndexedDB persistence */
  enablePersistence?: boolean;
  /** Enable undo/redo manager */
  enableUndoManager?: boolean;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Max reconnect attempts */
  maxReconnectAttempts?: number;
  /** Base reconnect delay in ms */
  reconnectBaseDelay?: number;
}

/* ================================================================
   WebSocket Message Protocol
   ================================================================ */
const WSMessageType = {
  SYNC_STEP1: 0,   // Client → Server: request full state
  SYNC_STEP2: 1,   // Server → Client: full state response
  SYNC_UPDATE: 2,   // Bidirectional: incremental update
  AWARENESS: 3,   // Bidirectional: awareness state
  AUTH: 4,   // Client → Server: authentication
  PING: 5,   // Client → Server: keepalive
  PONG: 6,   // Server → Client: keepalive response
  ERROR: 7,   // Server → Client: error message
} as const;
type WSMessageType = (typeof WSMessageType)[keyof typeof WSMessageType];

/* ================================================================
   Color palette for collaborator cursors
   ================================================================ */
const COLLAB_COLORS = [
  '#667eea', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316',
];

function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

/* ================================================================
   Custom Awareness Protocol
   ================================================================ */
type AwarenessChangeCallback = (changes: {
  added: number[];
  updated: number[];
  removed: number[];
}) => void;

class AwarenessProtocol {
  doc: Y.Doc;
  clientID: number;
  private states: Map<number, CRDTAwarenessState> = new Map();
  private meta: Map<number, { clock: number; lastUpdated: number }> = new Map();
  private listeners: Set<AwarenessChangeCallback> = new Set();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private _localState: CRDTAwarenessState | null = null;

  constructor(doc: Y.Doc) {
    this.doc = doc;
    this.clientID = doc.clientID;
    // Cleanup stale peers every 15s
    this.cleanupInterval = setInterval(() => this.cleanupStale(), 15000);
  }

  get localState(): CRDTAwarenessState | null {
    return this._localState;
  }

  setLocalState(state: CRDTAwarenessState | null) {
    const prev = this._localState;
    this._localState = state;
    if (state) {
      this.states.set(this.clientID, state);
      this.meta.set(this.clientID, { clock: (this.meta.get(this.clientID)?.clock ?? 0) + 1, lastUpdated: Date.now() });
    } else {
      this.states.delete(this.clientID);
      this.meta.delete(this.clientID);
    }
    const changes = prev ? { added: [], updated: [this.clientID], removed: [] }
      : state ? { added: [this.clientID], updated: [], removed: [] }
      : { added: [], updated: [], removed: [this.clientID] };
    this.notifyListeners(changes);
  }

  setLocalStateField(field: string, value: any) {
    const current = this._localState || { user: { id: '', name: '', color: '', lastActive: 0 }, timestamp: 0 };
    if (field === 'user') {
      this.setLocalState({ ...current, user: { ...current.user, ...value }, timestamp: Date.now() });
    } else {
      this.setLocalState({ ...current, [field]: value, timestamp: Date.now() });
    }
  }

  getStates(): Map<number, CRDTAwarenessState> {
    return this.states;
  }

  getRemoteStates(): Map<number, CRDTAwarenessState> {
    const remote = new Map<number, CRDTAwarenessState>();
    this.states.forEach((state, clientID) => {
      if (clientID !== this.clientID) remote.set(clientID, state);
    });
    return remote;
  }

  /** Apply awareness update from a remote peer */
  applyRemoteUpdate(data: { clientID: number; state: CRDTAwarenessState | null }) {
    const { clientID, state } = data;
    if (clientID === this.clientID) return; // ignore own echoes

    const added: number[] = [];
    const updated: number[] = [];
    const removed: number[] = [];

    if (state === null) {
      if (this.states.has(clientID)) {
        this.states.delete(clientID);
        this.meta.delete(clientID);
        removed.push(clientID);
      }
    } else {
      const existed = this.states.has(clientID);
      this.states.set(clientID, state);
      this.meta.set(clientID, { clock: (this.meta.get(clientID)?.clock ?? 0) + 1, lastUpdated: Date.now() });
      if (existed) updated.push(clientID); else added.push(clientID);
    }

    if (added.length || updated.length || removed.length) {
      this.notifyListeners({ added, updated, removed });
    }
  }

  /** Encode local state for sending over WebSocket */
  encodeLocalState(): string {
    return JSON.stringify({ clientID: this.clientID, state: this._localState });
  }

  /** Decode incoming awareness update */
  static decodeUpdate(data: string): { clientID: number; state: CRDTAwarenessState | null } | null {
    try { return JSON.parse(data); } catch { return null; }
  }

  onChange(callback: AwarenessChangeCallback) {
    this.listeners.add(callback);
    return () => { this.listeners.delete(callback); };
  }

  private notifyListeners(changes: { added: number[]; updated: number[]; removed: number[] }) {
    this.listeners.forEach(cb => {
      try { cb(changes); } catch (e) { console.warn('[Awareness] Listener error:', e); }
    });
  }

  private cleanupStale() {
    const now = Date.now();
    const removed: number[] = [];
    this.meta.forEach((meta, clientID) => {
      if (clientID !== this.clientID && now - meta.lastUpdated > 30000) {
        this.states.delete(clientID);
        this.meta.delete(clientID);
        removed.push(clientID);
      }
    });
    if (removed.length) {
      this.notifyListeners({ added: [], updated: [], removed });
    }
  }

  destroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.states.clear();
    this.meta.clear();
    this.listeners.clear();
  }
}

/* ================================================================
   Custom WebSocket Provider
   ================================================================ */
class YWebSocketProvider {
  doc: Y.Doc;
  awareness: AwarenessProtocol;
  wsUrl: string;
  roomName: string;
  ws: WebSocket | null = null;
  connectionState: WSConnectionState = 'closed';
  synced = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectBaseDelay: number;
  private autoReconnect: boolean;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastPingTime = 0;
  latency: number | null = null;
  bytesSent = 0;
  bytesReceived = 0;
  private destroyed = false;
  private onStateChange: (state: WSConnectionState) => void;
  private onSynced: (synced: boolean) => void;
  private onError: (error: string) => void;

  constructor(
    doc: Y.Doc,
    wsUrl: string,
    roomName: string,
    opts: {
      autoReconnect?: boolean;
      maxReconnectAttempts?: number;
      reconnectBaseDelay?: number;
      onStateChange: (state: WSConnectionState) => void;
      onSynced: (synced: boolean) => void;
      onError: (error: string) => void;
    }
  ) {
    this.doc = doc;
    this.wsUrl = wsUrl;
    this.roomName = roomName;
    this.autoReconnect = opts.autoReconnect ?? true;
    this.maxReconnectAttempts = opts.maxReconnectAttempts ?? 10;
    this.reconnectBaseDelay = opts.reconnectBaseDelay ?? 1000;
    this.onStateChange = opts.onStateChange;
    this.onSynced = opts.onSynced;
    this.onError = opts.onError;

    this.awareness = new AwarenessProtocol(doc);

    // Listen to Y.Doc updates and send to server
    doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin === 'remote') return; // Don't echo remote updates
      this.sendUpdate(update);
    });

    this.connect();
  }

  connect() {
    if (this.destroyed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    this.setConnectionState('connecting');

    try {
      const url = `${this.wsUrl}/${this.roomName}`;
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.setConnectionState('open');
        this.reconnectAttempts = 0;
        // Request full sync
        this.sendSyncStep1();
        // Send local awareness
        this.broadcastAwareness();
        // Start ping interval
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        this.stopPing();
        this.synced = false;
        this.onSynced(false);

        if (!this.destroyed && this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.setConnectionState('reconnecting');
          this.scheduleReconnect();
        } else {
          this.setConnectionState('closed');
          if (!event.wasClean && !this.destroyed) {
            this.onError(`WebSocket closed: code=${event.code} reason=${event.reason || 'unknown'}`);
          }
        }
      };

      this.ws.onerror = () => {
        // onclose will fire after onerror, so we handle reconnection there
        if (!this.destroyed) {
          this.onError('WebSocket connection error');
        }
      };
    } catch (err: any) {
      this.setConnectionState('closed');
      this.onError(`WebSocket creation failed: ${err.message}`);
      if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    }
  }

  disconnect() {
    this.stopPing();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on intentional close
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState('closed');
    this.synced = false;
  }

  destroy() {
    this.destroyed = true;
    this.disconnect();
    // Send awareness removal
    this.awareness.setLocalState(null);
    this.awareness.destroy();
  }

  /* ── Message Sending ── */

  private send(type: WSMessageType, payload: ArrayBuffer | string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      const typeArr = new Uint8Array([type]);
      if (typeof payload === 'string') {
        const enc = new TextEncoder();
        const payloadArr = enc.encode(payload);
        const combined = new Uint8Array(1 + payloadArr.length);
        combined.set(typeArr, 0);
        combined.set(payloadArr, 1);
        const buffer = combined.buffer.slice(0);
        this.ws.send(buffer);
        this.bytesSent += combined.length;
      } else {
        const payloadArr = new Uint8Array(payload);
        const combined = new Uint8Array(1 + payloadArr.length);
        combined.set(typeArr, 0);
        combined.set(payloadArr, 1);
        const buffer = combined.buffer.slice(0);
        this.ws.send(buffer);
        this.bytesSent += combined.length;
      }
    } catch (err: any) {
      console.warn('[WS Provider] Send error:', err);
    }
  }

  private sendSyncStep1() {
    // Encode the full state vector for sync step 1
    const sv = Y.encodeStateVector(this.doc);
    const buffer = new Uint8Array(sv);
    this.send(WSMessageType.SYNC_STEP1, buffer.buffer);
  }

  private sendUpdate(update: Uint8Array) {
    const buffer = new Uint8Array(update);
    this.send(WSMessageType.SYNC_UPDATE, buffer.buffer);
  }

  broadcastAwareness() {
    const encoded = this.awareness.encodeLocalState();
    this.send(WSMessageType.AWARENESS, encoded);
  }

  /* ── Message Handling ── */

  private handleMessage(data: ArrayBuffer | string) {
    try {
      let buf: Uint8Array;
      if (typeof data === 'string') {
        const enc = new TextEncoder();
        buf = enc.encode(data);
      } else {
        buf = new Uint8Array(data);
      }
      this.bytesReceived += buf.length;

      if (buf.length < 1) return;
      const type = buf[0] as WSMessageType;
      const payload = buf.slice(1);

      switch (type) {
        case WSMessageType.SYNC_STEP2: {
          // Full state from server — apply as remote
          Y.applyUpdate(this.doc, payload, 'remote');
          this.synced = true;
          this.onSynced(true);
          break;
        }
        case WSMessageType.SYNC_UPDATE: {
          // Incremental update from another client
          Y.applyUpdate(this.doc, payload, 'remote');
          break;
        }
        case WSMessageType.AWARENESS: {
          // Decode awareness update
          const dec = new TextDecoder();
          const parsed = AwarenessProtocol.decodeUpdate(dec.decode(payload));
          if (parsed) this.awareness.applyRemoteUpdate(parsed);
          break;
        }
        case WSMessageType.PONG: {
          this.latency = Date.now() - this.lastPingTime;
          break;
        }
        case WSMessageType.ERROR: {
          const dec = new TextDecoder();
          this.onError(dec.decode(payload));
          break;
        }
        case WSMessageType.SYNC_STEP1: {
          // Server requesting our state — reply with full state
          const update = Y.encodeStateAsUpdate(this.doc, payload);
          const buffer = new Uint8Array(update);
          this.send(WSMessageType.SYNC_STEP2, buffer.buffer);
          break;
        }
      }
    } catch (err: any) {
      console.warn('[WS Provider] Message handling error:', err);
    }
  }

  /* ── Keepalive ── */

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        this.send(WSMessageType.PING, '');
      }
    }, 10000);
  }

  private stopPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  /* ── Reconnect ── */

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(
      this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      30000 // max 30s
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) this.connect();
    }, delay);
  }

  private setConnectionState(state: WSConnectionState) {
    this.connectionState = state;
    this.onStateChange(state);
  }
}

/* ================================================================
   useCRDTCollab Hook
   ================================================================ */
export function useCRDTCollab(config: CRDTCollabConfig) {
  const {
    roomName, user, wsUrl,
    enablePersistence = true,
    enableUndoManager = true,
    autoReconnect = true,
    maxReconnectAttempts = 10,
    reconnectBaseDelay = 1000,
  } = config;

  const [status, setStatus] = useState<CRDTSyncStatus>('disconnected');
  const [wsState, setWsState] = useState<WSConnectionState>('closed');
  const [connectedUsers, setConnectedUsers] = useState<CRDTUser[]>([]);
  const [stats, setStats] = useState<CRDTStats>({
    documentSize: 0,
    undoStackSize: 0,
    redoStackSize: 0,
    connectedPeers: 0,
    lastSyncTime: null,
    totalEdits: 0,
    wsLatency: null,
    bytesSent: 0,
    bytesReceived: 0,
  });
  const [wsErrors, setWsErrors] = useState<string[]>([]);

  // Core yjs refs
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<YWebSocketProvider | null>(null);
  const persistenceRef = useRef<IndexeddbPersistence | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const awarenessRef = useRef<AwarenessProtocol | null>(null);
  const editCountRef = useRef(0);
  const yTextRef = useRef<Y.Text | null>(null);
  const monacoBindingRef = useRef<any>(null);

  /* ─── Awareness change → update connectedUsers ─── */
  const syncUsersFromAwareness = useCallback((awareness: AwarenessProtocol) => {
    const states = awareness.getStates();
    const users: CRDTUser[] = [];
    states.forEach((state) => {
      if (state?.user) {
        users.push({
          ...state.user,
          color: state.user.color || getColorForUser(state.user.id),
          lastActive: state.timestamp || state.user.lastActive,
        });
      }
    });
    setConnectedUsers(users);
    setStats(prev => ({ ...prev, connectedPeers: users.length }));
  }, []);

  /* ─── Derive status from ws + persistence ─── */
  const deriveStatus = useCallback((ws: WSConnectionState, persistenceSynced: boolean, hasWs: boolean): CRDTSyncStatus => {
    if (hasWs) {
      switch (ws) {
        case 'open': return persistenceSynced ? 'synced' : 'syncing';
        case 'connecting': return 'connecting';
        case 'reconnecting': return 'connecting';
        case 'closed': return persistenceSynced ? 'synced' : 'disconnected';
      }
    }
    return persistenceSynced ? 'synced' : 'disconnected';
  }, []);

  /* ─── Initialize yjs Document ─── */
  const initDoc = useCallback(() => {
    // Cleanup previous
    monacoBindingRef.current?.destroy?.();
    monacoBindingRef.current = null;
    undoManagerRef.current?.destroy();
    persistenceRef.current?.destroy();
    providerRef.current?.destroy();
    ydocRef.current?.destroy();

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const yText = ydoc.getText('monaco');
    yTextRef.current = yText;

    let persistenceSynced = false;

    // ── IndexedDB persistence ──
    if (enablePersistence) {
      const persistence = new IndexeddbPersistence(`yyc3-crdt-${roomName}`, ydoc);
      persistenceRef.current = persistence;
      persistence.on('synced', () => {
        persistenceSynced = true;
        setStatus(prev => {
          if (prev === 'disconnected' || prev === 'connecting') return 'synced';
          return prev;
        });
        setStats(prev => ({ ...prev, lastSyncTime: Date.now() }));
      });
    }

    // ── WebSocket Provider ──
    const hasWs = !!wsUrl;
    if (wsUrl) {
      const provider = new YWebSocketProvider(ydoc, wsUrl, roomName, {
        autoReconnect,
        maxReconnectAttempts,
        reconnectBaseDelay,
        onStateChange: (state) => {
          setWsState(state);
          setStatus(deriveStatus(state, persistenceSynced, true));
          // Update bandwidth stats periodically
          setStats(prev => ({
            ...prev,
            wsLatency: provider.latency,
            bytesSent: provider.bytesSent,
            bytesReceived: provider.bytesReceived,
          }));
        },
        onSynced: (synced) => {
          if (synced) {
            persistenceSynced = true;
            setStatus('synced');
            setStats(prev => ({ ...prev, lastSyncTime: Date.now() }));
          }
        },
        onError: (error) => {
          setWsErrors(prev => [...prev.slice(-9), error]);
          console.warn('[CRDT WS]', error);
        },
      });
      providerRef.current = provider;
      awarenessRef.current = provider.awareness;

      // Set local awareness state
      provider.awareness.setLocalState({
        user: {
          id: user.id,
          name: user.name,
          color: user.color || getColorForUser(user.id),
          lastActive: Date.now(),
        },
        fileId: roomName,
        timestamp: Date.now(),
      });

      // Listen to awareness changes
      provider.awareness.onChange(() => {
        syncUsersFromAwareness(provider.awareness);
      });

      // Periodically broadcast awareness
      const awarenessInterval = setInterval(() => {
        if (provider.connectionState === 'open') {
          provider.broadcastAwareness();
        }
      }, 5000);

      // Store cleanup for interval
      const origDestroy = provider.destroy.bind(provider);
      provider.destroy = () => {
        clearInterval(awarenessInterval);
        origDestroy();
      };
    } else {
      // ── Local-only mode (no WebSocket) ──
      const awareness = new AwarenessProtocol(ydoc);
      awarenessRef.current = awareness;

      awareness.setLocalState({
        user: {
          id: user.id,
          name: user.name,
          color: user.color || getColorForUser(user.id),
          lastActive: Date.now(),
        },
        fileId: roomName,
        timestamp: Date.now(),
      });

      awareness.onChange(() => {
        syncUsersFromAwareness(awareness);
      });

      // Initialize user list
      syncUsersFromAwareness(awareness);
    }

    // ── UndoManager ──
    if (enableUndoManager) {
      const undoManager = new Y.UndoManager(yText, {
        trackedOrigins: new Set([ydoc.clientID]),
      });
      undoManagerRef.current = undoManager;
      undoManager.on('stack-item-added', () => {
        editCountRef.current++;
        setStats(prev => ({
          ...prev,
          undoStackSize: undoManager.undoStack.length,
          redoStackSize: undoManager.redoStack.length,
          totalEdits: editCountRef.current,
        }));
      });
    }

    // ── Track document size ──
    yText.observe(() => {
      setStats(prev => ({ ...prev, documentSize: yText.length }));
    });

    if (!hasWs) {
      setStatus(enablePersistence ? 'connecting' : 'synced');
    } else {
      setStatus('connecting');
    }

    return { ydoc, yText };
  }, [roomName, user, wsUrl, enablePersistence, enableUndoManager, autoReconnect, maxReconnectAttempts, reconnectBaseDelay, deriveStatus, syncUsersFromAwareness]);

  /* ─── Connect / Disconnect ─── */
  const connect = useCallback(() => {
    if (status === 'synced' || status === 'syncing' || status === 'connected') return;
    initDoc();
  }, [status, initDoc]);

  const disconnect = useCallback(() => {
    monacoBindingRef.current?.destroy?.();
    monacoBindingRef.current = null;
    providerRef.current?.disconnect();
    setStatus('disconnected');
    setWsState('closed');
    setConnectedUsers(prev => prev.filter(u => u.id === user.id));
  }, [user.id]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 100);
  }, [disconnect, connect]);

  /* ─── Undo / Redo ─── */
  const undo = useCallback(() => { undoManagerRef.current?.undo(); }, []);
  const redo = useCallback(() => { undoManagerRef.current?.redo(); }, []);

  /* ─── Bind to Monaco Editor ─── */
  const bindMonacoEditor = useCallback(async (editor: any, monaco: any) => {
    // Cleanup previous binding
    monacoBindingRef.current?.destroy?.();
    monacoBindingRef.current = null;

    if (!ydocRef.current || !yTextRef.current) {
      initDoc();
    }

    const yText = yTextRef.current;
    if (!yText || !editor) return null;

    try {
      const { MonacoBinding } = await import('y-monaco');

      // Pass awareness if using WebSocket (for remote cursor rendering by y-monaco)
      // y-monaco's MonacoBinding accepts an awareness-like object with getStates/on
      const binding = new MonacoBinding(
        yText,
        editor.getModel()!,
        new Set([editor]),
        // y-monaco expects awareness with on('change', cb) interface
        // Our AwarenessProtocol doesn't match exactly, so skip for now
        // Remote cursors are rendered by our CollabCursors component instead
      );

      monacoBindingRef.current = binding;
      setStatus('synced');
      setStats(prev => ({ ...prev, lastSyncTime: Date.now() }));

      return binding;
    } catch (err) {
      console.warn('[CRDT] y-monaco binding failed (non-critical):', err);
      setStatus(prev => prev === 'disconnected' ? 'error' : prev);
      return null;
    }
  }, [initDoc]);

  /* ─── Awareness: Update Cursor Position ─── */
  const updateCursor = useCallback((line: number, column: number) => {
    const awareness = awarenessRef.current;
    if (!awareness) return;
    const current = awareness.localState;
    if (!current) return;

    awareness.setLocalState({
      ...current,
      user: { ...current.user, cursor: { line, column }, lastActive: Date.now() },
      timestamp: Date.now(),
    });

    // Broadcast via WS if connected
    providerRef.current?.broadcastAwareness();
  }, []);

  /* ─── Awareness: Update Selection ─── */
  const updateSelection = useCallback((startLine: number, startColumn: number, endLine: number, endColumn: number) => {
    const awareness = awarenessRef.current;
    if (!awareness) return;
    const current = awareness.localState;
    if (!current) return;

    awareness.setLocalState({
      ...current,
      user: {
        ...current.user,
        selection: { startLine, startColumn, endLine, endColumn },
        lastActive: Date.now(),
      },
      timestamp: Date.now(),
    });

    providerRef.current?.broadcastAwareness();
  }, []);

  /* ─── Get / Set Document Content ─── */
  const getContent = useCallback((): string => {
    return yTextRef.current?.toString() || '';
  }, []);

  const setContent = useCallback((content: string) => {
    if (!yTextRef.current || !ydocRef.current) return;
    const yText = yTextRef.current;
    ydocRef.current.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, content);
    }, ydocRef.current.clientID);
  }, []);

  /* ─── Apply Delta (incremental edit) ─── */
  const applyDelta = useCallback((index: number, deleteCount: number, insertText: string) => {
    if (!yTextRef.current || !ydocRef.current) return;
    ydocRef.current.transact(() => {
      if (deleteCount > 0) yTextRef.current!.delete(index, deleteCount);
      if (insertText) yTextRef.current!.insert(index, insertText);
    }, ydocRef.current.clientID);
  }, []);

  /* ─── Get remote users (excluding self) ─── */
  const remoteUsers = useMemo(() => {
    return connectedUsers.filter(u => u.id !== user.id);
  }, [connectedUsers, user.id]);

  /* ─── Clear WS errors ─── */
  const clearErrors = useCallback(() => { setWsErrors([]); }, []);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      monacoBindingRef.current?.destroy?.();
      undoManagerRef.current?.destroy();
      persistenceRef.current?.destroy();
      providerRef.current?.destroy();
      awarenessRef.current?.destroy();
      ydocRef.current?.destroy();
    };
  }, []);

  /* ─── Auto-connect on mount / room change ─── */
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [roomName]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Derived ─── */
  const canUndo = useMemo(() => (undoManagerRef.current?.undoStack.length ?? 0) > 0, [stats.undoStackSize]);
  const canRedo = useMemo(() => (undoManagerRef.current?.redoStack.length ?? 0) > 0, [stats.redoStackSize]);

  return {
    // State
    status,
    wsState,
    connectedUsers,
    remoteUsers,
    stats,
    wsErrors,

    // Actions
    connect,
    disconnect,
    reconnect,
    undo,
    redo,
    canUndo,
    canRedo,
    clearErrors,

    // Monaco integration
    bindMonacoEditor,

    // Awareness
    updateCursor,
    updateSelection,
    awarenessRef,

    // Document operations
    getContent,
    setContent,
    applyDelta,

    // Refs (for advanced usage)
    ydocRef,
    yTextRef,
    providerRef,
  };
}