/**
 * useYjsBinding — Real yjs document binding for CRDT collaboration
 *
 * Creates a Y.Doc with Y.Maps for panels and components,
 * syncs bidirectionally with React state, and persists to IndexedDB.
 *
 * Architecture:
 *   React State ↔ Y.Doc (panels: Y.Map, components: Y.Map, metadata: Y.Map)
 *                    ↕
 *              IndexedDB (y-indexeddb)
 *                    ↕
 *              WebSocket (simulated / real y-websocket)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import type { Panel, ComponentInstance, CRDTPeer } from '../../store';

/* ================================================================
   Types
   ================================================================ */

export interface YjsBindingState {
  doc: Y.Doc | null;
  connected: boolean;
  docVersion: number;
  idbSynced: boolean;
  wsMessages: WSMessage[];
  awareness: AwarenessPeer[];
}

interface AwarenessPeer {
  clientId: number;
  name: string;
  color: string;
  cursor: { panelId?: string; componentId?: string } | null;
}

export interface WSMessage {
  id: string;
  direction: 'in' | 'out';
  type: 'sync-step1' | 'sync-step2' | 'update' | 'awareness' | 'ping' | 'pong';
  size: number;
  timestamp: number;
}

/* ================================================================
   Simulated WebSocket (mimics y-websocket protocol)
   ================================================================ */

class SimulatedWebSocket {
  private listeners: Map<string, Set<Function>> = new Map();
  private _connected = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  get connected() { return this._connected; }

  connect(_url: string) {
    // Simulate connection handshake
    setTimeout(() => {
      this._connected = true;
      this.emit('open', {});
      // Initial sync messages
      this.emit('message', { type: 'sync-step1', data: new Uint8Array(64) });
      setTimeout(() => {
        this.emit('message', { type: 'sync-step2', data: new Uint8Array(128) });
      }, 100);
    }, 300);

    // Heartbeat
    this.pingInterval = setInterval(() => {
      if (this._connected) {
        this.emit('message', { type: 'ping', data: new Uint8Array(1) });
        setTimeout(() => {
          if (this._connected) {
            this.emit('message', { type: 'pong', data: new Uint8Array(1) });
          }
        }, 12);
      }
    }, 5000);
  }

  disconnect() {
    this._connected = false;
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.emit('close', {});
  }

  // Simulate sending an update (would go to y-websocket server)
  sendUpdate(update: Uint8Array) {
    if (!this._connected) return;
    // Simulate echo from server (other peers receiving the update)
    setTimeout(() => {
      this.emit('message', { type: 'update', data: update });
    }, Math.random() * 50 + 10);
  }

  // Simulate awareness update
  sendAwareness(data: any) {
    if (!this._connected) return;
    setTimeout(() => {
      this.emit('message', { type: 'awareness', data });
    }, 15);
  }

  on(event: string, fn: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off(event: string, fn: Function) {
    this.listeners.get(event)?.delete(fn);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }

  destroy() {
    this.disconnect();
    this.listeners.clear();
  }
}

/* ================================================================
   Hook: useYjsBinding
   ================================================================ */

export function useYjsBinding(
  panels: Panel[],
  components: ComponentInstance[],
  onPanelsChange: (panels: Panel[]) => void,
  onComponentsChange: (components: ComponentInstance[]) => void,
  _onPeersChange: (peers: CRDTPeer[]) => void,
  _onVersionChange: (version: number) => void,
) {
  const docRef = useRef<Y.Doc | null>(null);
  const idbRef = useRef<IndexeddbPersistence | null>(null);
  const wsRef = useRef<SimulatedWebSocket | null>(null);
  const suppressRef = useRef(false); // prevent echo loops

  const [state, setState] = useState<YjsBindingState>({
    doc: null,
    connected: false,
    docVersion: 0,
    idbSynced: false,
    wsMessages: [],
    awareness: [],
  });

  const addMessage = useCallback((msg: Omit<WSMessage, 'id'>) => {
    setState(prev => ({
      ...prev,
      wsMessages: [{ ...msg, id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }, ...prev.wsMessages].slice(0, 100),
    }));
  }, []);

  // Initialize Y.Doc + IndexedDB persistence
  useEffect(() => {
    const doc = new Y.Doc();
    docRef.current = doc;

    // Create Y.Maps
    const yPanels = doc.getMap('panels');
    const yComponents = doc.getMap('components');
    const yMeta = doc.getMap('metadata');

    // Seed initial data into Y.Doc (only if empty)
    doc.transact(() => {
      if (yPanels.size === 0) {
        panels.forEach(p => {
          const yPanel = new Y.Map();
          Object.entries(p).forEach(([k, v]) => {
            if (k === 'children') {
              const yArr = new Y.Array();
              yArr.push(v as string[]);
              yPanel.set(k, yArr);
            } else {
              yPanel.set(k, v);
            }
          });
          yPanels.set(p.id, yPanel);
        });
      }

      if (yComponents.size === 0) {
        components.forEach(c => {
          const yComp = new Y.Map();
          Object.entries(c).forEach(([k, v]) => {
            if (k === 'props') {
              const yProps = new Y.Map();
              Object.entries(v as Record<string, any>).forEach(([pk, pv]) => {
                yProps.set(pk, pv);
              });
              yComp.set(k, yProps);
            } else {
              yComp.set(k, v);
            }
          });
          yComponents.set(c.id, yComp);
        });
      }

      yMeta.set('project', 'YANYUCLOUD 内部报表系统');
      yMeta.set('theme', 'dark');
      yMeta.set('version', 1);
    });

    // IndexedDB persistence
    const idb = new IndexeddbPersistence('yanyucloud-design-doc', doc);
    idbRef.current = idb;

    idb.on('synced', () => {
      setState(prev => ({ ...prev, idbSynced: true }));
    });

    // Observe Y.Doc changes → push to React state
    const observeHandler = () => {
      if (suppressRef.current) return;

      // Read panels from Y.Doc
      const newPanels: Panel[] = [];
      yPanels.forEach((yPanel: any, key: string) => {
        if (yPanel instanceof Y.Map) {
          const childArr = yPanel.get('children');
          newPanels.push({
            id: yPanel.get('id') as string || key,
            name: yPanel.get('name') as string || '',
            type: yPanel.get('type') as Panel['type'] || 'blank',
            x: yPanel.get('x') as number || 0,
            y: yPanel.get('y') as number || 0,
            w: yPanel.get('w') as number || 6,
            h: yPanel.get('h') as number || 6,
            children: childArr instanceof Y.Array ? childArr.toArray() as string[] : [],
          });
        }
      });

      // Read components from Y.Doc
      const newComponents: ComponentInstance[] = [];
      yComponents.forEach((yComp: any, key: string) => {
        if (yComp instanceof Y.Map) {
          const yProps = yComp.get('props');
          const props: Record<string, any> = {};
          if (yProps instanceof Y.Map) {
            yProps.forEach((v: any, k: string) => { props[k] = v; });
          }
          newComponents.push({
            id: yComp.get('id') as string || key,
            type: yComp.get('type') as string || 'Button',
            label: yComp.get('label') as string || '',
            props,
            panelId: yComp.get('panelId') as string || '',
            groupId: yComp.get('groupId') as string | undefined,
          });
        }
      });

      if (newPanels.length > 0) {
        // Reconcile: ensure panel children arrays include all components that reference them
        if (newComponents.length > 0) {
          const compsByPanel = new Map<string, string[]>();
          for (const c of newComponents) {
            if (!compsByPanel.has(c.panelId)) compsByPanel.set(c.panelId, []);
            compsByPanel.get(c.panelId)!.push(c.id);
          }
          for (const p of newPanels) {
            const expected = compsByPanel.get(p.id) || [];
            const missing = expected.filter(cid => !p.children.includes(cid));
            if (missing.length > 0) {
              p.children = [...p.children, ...missing];
            }
          }
        }
        onPanelsChange(newPanels);
      }
      if (newComponents.length > 0) onComponentsChange(newComponents);
    };

    yPanels.observeDeep(observeHandler);
    yComponents.observeDeep(observeHandler);

    // ── Try real WebSocket first, fall back to simulation ──
    let useSimulated = false;
    let realWs: WebSocket | null = null;

    const WS_ENDPOINTS = [
      'ws://localhost:1234',                  // default y-websocket dev
      'ws://localhost:4444',                  // alternative port
    ];

    // Read custom endpoint from env/localStorage
    try {
      const customWs = localStorage.getItem('yyc3-ws-endpoint');
      if (customWs) WS_ENDPOINTS.unshift(customWs);
    } catch {}

    function setupSimulated() {
      if (useSimulated) return; // already set up
      useSimulated = true;
      const ws = new SimulatedWebSocket();
      wsRef.current = ws;

      ws.on('open', () => {
        setState(prev => ({ ...prev, connected: true }));
        addMessage({ direction: 'in', type: 'sync-step1', size: 64, timestamp: Date.now() });
      });
      ws.on('close', () => {
        setState(prev => ({ ...prev, connected: false }));
      });
      ws.on('message', (msg: any) => {
        addMessage({
          direction: 'in',
          type: msg.type as WSMessage['type'],
          size: msg.data?.byteLength || msg.data?.length || 1,
          timestamp: Date.now(),
        });
        if (msg.type === 'awareness') {
          setState(prev => ({
            ...prev,
            awareness: [
              { clientId: 100001, name: '张三', color: '#a78bfa', cursor: { panelId: 'panel-1' } },
              { clientId: 100002, name: '李四', color: '#34d399', cursor: { panelId: 'panel-3', componentId: 'comp-6' } },
            ],
          }));
        }
      });
      doc.on('update', (update: Uint8Array) => {
        ws.sendUpdate(update);
        addMessage({ direction: 'out', type: 'update', size: update.byteLength, timestamp: Date.now() });
      });
      ws.connect('ws://simulated/yjs-ws');
    }

    // Attempt real WebSocket connections
    let wsAttemptIdx = 0;
    let wsConnected = false;
    const WS_TIMEOUT = 3000;

    function tryRealWs() {
      if (wsAttemptIdx >= WS_ENDPOINTS.length || wsConnected) {
        if (!wsConnected) {
          console.log('[YYC³ CRDT] All real WS endpoints failed, using simulated WebSocket');
          setupSimulated();
        }
        return;
      }

      const url = WS_ENDPOINTS[wsAttemptIdx];
      const wsUrl = url.replace(/\/$/, '') + '/yjs-ws';
      console.log(`[YYC³ CRDT] Attempting real WebSocket: ${wsUrl}`);

      try {
        const candidate = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
          if (!wsConnected) {
            candidate.close();
            wsAttemptIdx++;
            tryRealWs();
          }
        }, WS_TIMEOUT);

        candidate.binaryType = 'arraybuffer';

        candidate.onopen = () => {
          clearTimeout(timeout);
          wsConnected = true;
          realWs = candidate;
          console.log(`[YYC³ CRDT] Real WebSocket connected: ${wsUrl}`);
          setState(prev => ({ ...prev, connected: true }));
          addMessage({ direction: 'in', type: 'sync-step1', size: 0, timestamp: Date.now() });
        };

        candidate.onmessage = (evt) => {
          const data = evt.data instanceof ArrayBuffer ? new Uint8Array(evt.data) : null;
          if (data) {
            Y.applyUpdate(doc, data);
            addMessage({ direction: 'in', type: 'update', size: data.byteLength, timestamp: Date.now() });
          }
        };

        candidate.onclose = () => {
          clearTimeout(timeout);
          if (wsConnected && realWs === candidate) {
            // Connection was active then lost — fall back to simulated
            console.log('[YYC³ CRDT] Real WebSocket closed, switching to simulated');
            wsConnected = false;
            realWs = null;
            setupSimulated();
          } else if (!wsConnected) {
            wsAttemptIdx++;
            tryRealWs();
          }
        };

        candidate.onerror = () => {
          clearTimeout(timeout);
          if (!wsConnected) {
            wsAttemptIdx++;
            tryRealWs();
          }
        };
      } catch {
        wsAttemptIdx++;
        tryRealWs();
      }
    }

    // Forward Y.Doc updates to real WS if connected + track version count
    doc.on('update', (update: Uint8Array) => {
      setState(prev => ({ ...prev, docVersion: prev.docVersion + 1 }));
      if (realWs && realWs.readyState === WebSocket.OPEN) {
        realWs.send(update);
        addMessage({ direction: 'out', type: 'update', size: update.byteLength, timestamp: Date.now() });
      }
    });

    tryRealWs();

    setState(prev => ({ ...prev, doc }));

    return () => {
      yPanels.unobserveDeep(observeHandler);
      yComponents.unobserveDeep(observeHandler);
      if (realWs) { try { realWs.close(); } catch {} }
      if (wsRef.current) wsRef.current.destroy();
      idb.destroy();
      doc.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync React state → Y.Doc (when user edits in the designer)
  const syncToYDoc = useCallback((newPanels: Panel[], newComponents: ComponentInstance[]) => {
    const doc = docRef.current;
    if (!doc) return;

    suppressRef.current = true;

    const yPanels = doc.getMap('panels');
    const yComponents = doc.getMap('components');

    doc.transact(() => {
      // Sync panels
      const existingPanelIds = new Set<string>();
      yPanels.forEach((_: any, key: string) => existingPanelIds.add(key));

      const newPanelIds = new Set(newPanels.map(p => p.id));

      // Remove deleted panels
      existingPanelIds.forEach(id => {
        if (!newPanelIds.has(id)) yPanels.delete(id);
      });

      // Update/add panels
      newPanels.forEach(p => {
        let yPanel = yPanels.get(p.id) as Y.Map<any> | undefined;
        if (!yPanel || !(yPanel instanceof Y.Map)) {
          yPanel = new Y.Map();
          yPanels.set(p.id, yPanel);
        }
        yPanel.set('id', p.id);
        yPanel.set('name', p.name);
        yPanel.set('type', p.type);
        yPanel.set('x', p.x);
        yPanel.set('y', p.y);
        yPanel.set('w', p.w);
        yPanel.set('h', p.h);

        const existingArr = yPanel.get('children');
        if (existingArr instanceof Y.Array) {
          existingArr.delete(0, existingArr.length);
          existingArr.push(p.children);
        } else {
          const yArr = new Y.Array();
          yArr.push(p.children);
          yPanel.set('children', yArr);
        }
      });

      // Sync components
      const existingCompIds = new Set<string>();
      yComponents.forEach((_: any, key: string) => existingCompIds.add(key));

      const newCompIds = new Set(newComponents.map(c => c.id));

      existingCompIds.forEach(id => {
        if (!newCompIds.has(id)) yComponents.delete(id);
      });

      newComponents.forEach(c => {
        let yComp = yComponents.get(c.id) as Y.Map<any> | undefined;
        if (!yComp || !(yComp instanceof Y.Map)) {
          yComp = new Y.Map();
          yComponents.set(c.id, yComp);
        }
        yComp.set('id', c.id);
        yComp.set('type', c.type);
        yComp.set('label', c.label);
        yComp.set('panelId', c.panelId);
        if (c.groupId) yComp.set('groupId', c.groupId);

        let yProps = yComp.get('props') as Y.Map<any> | undefined;
        if (!yProps || !(yProps instanceof Y.Map)) {
          yProps = new Y.Map();
          yComp.set('props', yProps);
        }
        Object.entries(c.props).forEach(([k, v]) => {
          yProps!.set(k, v);
        });
      });
    });

    // Allow observation again after a tick
    setTimeout(() => { suppressRef.current = false; }, 50);
  }, []);

  // Connect/disconnect
  const connect = useCallback(() => {
    wsRef.current?.connect('ws://localhost:1234/yjs-ws');
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
  }, []);

  // Get Y.Doc stats
  const getDocStats = useCallback(() => {
    const doc = docRef.current;
    if (!doc) return { panelCount: 0, componentCount: 0, updateCount: 0, encodedSize: 0 };

    const encoded = Y.encodeStateAsUpdate(doc);
    return {
      panelCount: doc.getMap('panels').size,
      componentCount: doc.getMap('components').size,
      updateCount: state.docVersion,
      encodedSize: encoded.byteLength,
    };
  }, [state.docVersion]);

  return {
    ...state,
    syncToYDoc,
    connect,
    disconnect,
    getDocStats,
  };
}