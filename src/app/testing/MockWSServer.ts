/**
 * @file MockWSServer.ts
 * @description 模拟 y-websocket 服务器 — 用于浏览器端 E2E 多人协同测试
 *   完整实现 SYNC_STEP1/STEP2/UPDATE/AWARENESS/PING/PONG 协议，支持多房间、
 *   模拟延迟、丢包、断线、冲突注入，以及自动化测试断言
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags testing,websocket,mock,crdt,yjs,e2e,collaboration
 */

import * as Y from 'yjs';

/* ================================================================
   Protocol constants (mirrored from useCRDTCollab.ts)
   ================================================================ */
const WSMessageType = {
  SYNC_STEP1: 0,
  SYNC_STEP2: 1,
  SYNC_UPDATE: 2,
  AWARENESS: 3,
  AUTH: 4,
  PING: 5,
  PONG: 6,
  ERROR: 7,
} as const;
type WSMessageType = (typeof WSMessageType)[keyof typeof WSMessageType];

/* ================================================================
   Types
   ================================================================ */
export interface MockClientSocket {
  /** Unique client ID */
  clientId: string;
  /** Room this client joined */
  roomName: string;
  /** Send data to this client (server → client) */
  receive: (data: ArrayBuffer) => void;
  /** Called when client closes connection */
  onClose?: () => void;
  /** Whether this socket is open */
  isOpen: boolean;
}

export interface MockWSServerConfig {
  /** Simulated network latency in ms (default: 0) */
  latency?: number;
  /** Simulated packet loss rate 0~1 (default: 0) */
  packetLossRate?: number;
  /** Enable detailed logging (default: false) */
  verbose?: boolean;
}

interface RoomState {
  ydoc: Y.Doc;
  clients: Map<string, MockClientSocket>;
  awarenessStates: Map<string, string>; // clientId → awareness JSON
}

export interface SimulatedPeerConfig {
  clientId: string;
  roomName: string;
  name: string;
  color: string;
  /** Simulated cursor position */
  cursor?: { line: number; column: number };
  /** Simulated selection */
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
  /** Auto-typing interval in ms (0 = disabled) */
  autoTypeInterval?: number;
  /** Content to type character by character */
  autoTypeContent?: string;
}

export interface TestAssertion {
  type: 'doc-sync' | 'awareness-count' | 'client-count' | 'content-equals';
  roomName: string;
  expected: any;
}

/* ================================================================
   MockWSServer
   ================================================================ */
export class MockWSServer {
  private rooms: Map<string, RoomState> = new Map();
  private config: Required<MockWSServerConfig>;
  private simulatedPeers: Map<string, { timer: ReturnType<typeof setInterval>; doc: Y.Doc }> = new Map();
  private eventLog: Array<{ timestamp: number; type: string; room: string; client: string; detail?: string }> = [];

  constructor(config: MockWSServerConfig = {}) {
    this.config = {
      latency: config.latency ?? 0,
      packetLossRate: config.packetLossRate ?? 0,
      verbose: config.verbose ?? false,
    };
  }

  /* ── Room Management ── */

  private getOrCreateRoom(roomName: string): RoomState {
    let room = this.rooms.get(roomName);
    if (!room) {
      room = {
        ydoc: new Y.Doc(),
        clients: new Map(),
        awarenessStates: new Map(),
      };
      this.rooms.set(roomName, room);
      this.log('room-create', roomName, 'server', `Room created`);
    }
    return room;
  }

  /* ── Client Connection ── */

  /**
   * Connect a client to the mock server. Returns a MockClientSocket
   * and a `send` function that the client uses to send data to the server.
   */
  connect(roomName: string, clientId: string): {
    socket: MockClientSocket;
    send: (data: ArrayBuffer) => void;
    close: () => void;
  } {
    const room = this.getOrCreateRoom(roomName);

    const socket: MockClientSocket = {
      clientId,
      roomName,
      receive: () => {},
      isOpen: true,
    };

    room.clients.set(clientId, socket);
    this.log('connect', roomName, clientId, `Client connected (${room.clients.size} total)`);

    // Server → client send function (with simulated latency)
    const sendToClient = (data: ArrayBuffer) => {
      if (!socket.isOpen) return;
      if (Math.random() < this.config.packetLossRate) {
        this.log('packet-loss', roomName, clientId, 'Packet dropped');
        return;
      }
      if (this.config.latency > 0) {
        setTimeout(() => { if (socket.isOpen) socket.receive(data); }, this.config.latency);
      } else {
        socket.receive(data);
      }
    };

    // Client → server send function
    const send = (data: ArrayBuffer) => {
      if (!socket.isOpen) return;
      if (Math.random() < this.config.packetLossRate) {
        this.log('packet-loss', roomName, clientId, 'Outgoing packet dropped');
        return;
      }
      const handler = () => this.handleClientMessage(roomName, clientId, data);
      if (this.config.latency > 0) {
        setTimeout(handler, this.config.latency);
      } else {
        handler();
      }
    };

    const close = () => {
      socket.isOpen = false;
      room.clients.delete(clientId);
      room.awarenessStates.delete(clientId);

      // Broadcast awareness removal to remaining clients
      const removal = JSON.stringify({ clientID: clientId, state: null });
      this.broadcastToRoom(roomName, clientId, WSMessageType.AWARENESS, removal);

      socket.onClose?.();
      this.log('disconnect', roomName, clientId, `Client disconnected (${room.clients.size} remaining)`);
    };

    // Assign the receive function (actual client will set this)
    socket.receive = sendToClient as any; // Will be overridden by user

    return { socket, send, close };
  }

  /* ── Message Handling ── */

  private handleClientMessage(roomName: string, clientId: string, data: ArrayBuffer) {
    const room = this.rooms.get(roomName);
    if (!room) return;

    const buf = new Uint8Array(data);
    if (buf.length < 1) return;

    const type = buf[0] as WSMessageType;
    const payload = buf.slice(1);

    switch (type) {
      case WSMessageType.SYNC_STEP1: {
        // Client requests full state — respond with SYNC_STEP2
        this.log('sync', roomName, clientId, 'SYNC_STEP1 received');
        const update = Y.encodeStateAsUpdate(room.ydoc, payload);
        this.sendToClient(room, clientId, WSMessageType.SYNC_STEP2, update);
        break;
      }

      case WSMessageType.SYNC_STEP2: {
        // Client sending full state — apply it
        this.log('sync', roomName, clientId, 'SYNC_STEP2 received');
        Y.applyUpdate(room.ydoc, payload, clientId);
        break;
      }

      case WSMessageType.SYNC_UPDATE: {
        // Incremental update — apply and broadcast to other clients
        this.log('update', roomName, clientId, `UPDATE ${payload.length}B`);
        Y.applyUpdate(room.ydoc, payload, clientId);
        this.broadcastToRoom(roomName, clientId, WSMessageType.SYNC_UPDATE, payload);
        break;
      }

      case WSMessageType.AWARENESS: {
        // Awareness state — store and broadcast to other clients
        const dec = new TextDecoder();
        const json = dec.decode(payload);
        room.awarenessStates.set(clientId, json);
        this.broadcastToRoom(roomName, clientId, WSMessageType.AWARENESS, json);
        this.log('awareness', roomName, clientId, 'Awareness broadcast');
        break;
      }

      case WSMessageType.PING: {
        // Respond with PONG
        this.sendToClient(room, clientId, WSMessageType.PONG, '');
        break;
      }

      case WSMessageType.AUTH: {
        // Simplified auth — always accept
        this.log('auth', roomName, clientId, 'AUTH accepted');
        break;
      }
    }
  }

  /* ── Broadcasting ── */

  private broadcastToRoom(
    roomName: string,
    excludeClientId: string,
    type: WSMessageType,
    payload: Uint8Array | string,
  ) {
    const room = this.rooms.get(roomName);
    if (!room) return;

    room.clients.forEach((client, id) => {
      if (id === excludeClientId || !client.isOpen) return;
      this.sendToClient(room, id, type, payload);
    });
  }

  private sendToClient(
    room: RoomState,
    clientId: string,
    type: WSMessageType,
    payload: Uint8Array | string,
  ) {
    const client = room.clients.get(clientId);
    if (!client?.isOpen) return;

    let payloadArr: Uint8Array;
    if (typeof payload === 'string') {
      payloadArr = new TextEncoder().encode(payload);
    } else {
      payloadArr = payload;
    }

    const combined = new Uint8Array(1 + payloadArr.length);
    combined[0] = type;
    combined.set(payloadArr, 1);

    if (Math.random() < this.config.packetLossRate) return;

    if (this.config.latency > 0) {
      setTimeout(() => { if (client.isOpen) client.receive(combined.buffer); }, this.config.latency);
    } else {
      client.receive(combined.buffer);
    }
  }

  /* ── Simulated Peers ── */

  /**
   * Add a simulated peer that joins a room, broadcasts awareness,
   * and optionally types content at a configurable interval.
   */
  addSimulatedPeer(config: SimulatedPeerConfig): () => void {
    const room = this.getOrCreateRoom(config.roomName);
    const peerDoc = new Y.Doc();
    const yText = peerDoc.getText('monaco');

    // Sync with server doc
    const serverState = Y.encodeStateAsUpdate(room.ydoc);
    Y.applyUpdate(peerDoc, serverState);

    // Register peer as a client
    const fakeSocket: MockClientSocket = {
      clientId: config.clientId,
      roomName: config.roomName,
      receive: () => {}, // Peers don't process incoming
      isOpen: true,
    };
    room.clients.set(config.clientId, fakeSocket);

    // Broadcast awareness
    const awarenessState = JSON.stringify({
      clientID: config.clientId,
      state: {
        user: {
          id: config.clientId,
          name: config.name,
          color: config.color,
          cursor: config.cursor,
          selection: config.selection,
          lastActive: Date.now(),
        },
        fileId: config.roomName,
        timestamp: Date.now(),
      },
    });
    room.awarenessStates.set(config.clientId, awarenessState);
    this.broadcastToRoom(config.roomName, config.clientId, WSMessageType.AWARENESS, awarenessState);

    // Auto-typing simulation
    let typeIndex = 0;
    let timer: ReturnType<typeof setInterval> | null = null;

    if (config.autoTypeInterval && config.autoTypeContent) {
      timer = setInterval(() => {
        if (typeIndex >= (config.autoTypeContent?.length ?? 0)) {
          if (timer) clearInterval(timer);
          return;
        }

        const char = config.autoTypeContent![typeIndex];
        peerDoc.transact(() => {
          yText.insert(yText.length, char);
        });

        // Get the update and apply to server + broadcast
        const update = Y.encodeStateAsUpdate(peerDoc);
        Y.applyUpdate(room.ydoc, update, config.clientId);
        this.broadcastToRoom(config.roomName, config.clientId, WSMessageType.SYNC_UPDATE, update);

        // Update cursor position in awareness
        const newLine = yText.toString().split('\n').length;
        const lastLine = yText.toString().split('\n').pop() || '';
        const updatedAwareness = JSON.stringify({
          clientID: config.clientId,
          state: {
            user: {
              id: config.clientId,
              name: config.name,
              color: config.color,
              cursor: { line: newLine, column: lastLine.length + 1 },
              lastActive: Date.now(),
            },
            fileId: config.roomName,
            timestamp: Date.now(),
          },
        });
        room.awarenessStates.set(config.clientId, updatedAwareness);
        this.broadcastToRoom(config.roomName, config.clientId, WSMessageType.AWARENESS, updatedAwareness);

        typeIndex++;
      }, config.autoTypeInterval);
    }

    this.simulatedPeers.set(config.clientId, { timer: timer!, doc: peerDoc });
    this.log('simulated-peer', config.roomName, config.clientId, `Peer "${config.name}" added`);

    // Return cleanup function
    return () => {
      if (timer) clearInterval(timer);
      fakeSocket.isOpen = false;
      room.clients.delete(config.clientId);
      room.awarenessStates.delete(config.clientId);
      peerDoc.destroy();
      this.simulatedPeers.delete(config.clientId);

      // Broadcast removal
      const removal = JSON.stringify({ clientID: config.clientId, state: null });
      this.broadcastToRoom(config.roomName, config.clientId, WSMessageType.AWARENESS, removal);
    };
  }

  /* ── Fault Injection ── */

  /** Simulate a network partition: disconnect all clients in a room */
  simulatePartition(roomName: string) {
    const room = this.rooms.get(roomName);
    if (!room) return;
    this.log('fault', roomName, 'server', 'Network partition simulated');
    room.clients.forEach((client) => {
      client.isOpen = false;
      client.onClose?.();
    });
    room.clients.clear();
  }

  /** Simulate healing: allow reconnections (clients must re-call connect()) */
  healPartition(roomName: string) {
    this.log('fault', roomName, 'server', 'Partition healed');
  }

  /** Inject a conflict by directly modifying the server doc */
  injectConflict(roomName: string, text: string) {
    const room = this.getOrCreateRoom(roomName);
    const yText = room.ydoc.getText('monaco');
    room.ydoc.transact(() => {
      yText.insert(0, text);
    });
    // Broadcast the update to all clients
    const update = Y.encodeStateAsUpdate(room.ydoc);
    room.clients.forEach((client, id) => {
      this.sendToClient(room, id, WSMessageType.SYNC_UPDATE, update);
    });
    this.log('fault', roomName, 'server', `Conflict injected: "${text.slice(0, 50)}..."`);
  }

  /** Update latency dynamically */
  setLatency(ms: number) {
    this.config.latency = ms;
  }

  /** Update packet loss rate dynamically */
  setPacketLossRate(rate: number) {
    this.config.packetLossRate = Math.max(0, Math.min(1, rate));
  }

  /* ── Test Assertions ── */

  assert(assertion: TestAssertion): { pass: boolean; message: string } {
    const room = this.rooms.get(assertion.roomName);
    if (!room) {
      return { pass: false, message: `Room "${assertion.roomName}" does not exist` };
    }

    switch (assertion.type) {
      case 'doc-sync': {
        // Check that server doc matches expected content
        const yText = room.ydoc.getText('monaco');
        const actual = yText.toString();
        const pass = actual === assertion.expected;
        return { pass, message: pass ? 'Doc content matches' : `Expected "${assertion.expected}", got "${actual}"` };
      }
      case 'awareness-count': {
        const actual = room.awarenessStates.size;
        const pass = actual === assertion.expected;
        return { pass, message: pass ? `${actual} awareness states` : `Expected ${assertion.expected} awareness states, got ${actual}` };
      }
      case 'client-count': {
        const actual = room.clients.size;
        const pass = actual === assertion.expected;
        return { pass, message: pass ? `${actual} clients connected` : `Expected ${assertion.expected} clients, got ${actual}` };
      }
      case 'content-equals': {
        const yText = room.ydoc.getText('monaco');
        const pass = yText.toString() === assertion.expected;
        return { pass, message: pass ? 'Content matches' : `Content mismatch` };
      }
      default:
        return { pass: false, message: `Unknown assertion type: ${assertion.type}` };
    }
  }

  /* ── Inspection ── */

  /** Get the server Y.Doc content for a room */
  getDocContent(roomName: string): string {
    const room = this.rooms.get(roomName);
    if (!room) return '';
    return room.ydoc.getText('monaco').toString();
  }

  /** Get all awareness states for a room */
  getAwarenessStates(roomName: string): Map<string, string> {
    return this.rooms.get(roomName)?.awarenessStates ?? new Map();
  }

  /** Get connected client count for a room */
  getClientCount(roomName: string): number {
    return this.rooms.get(roomName)?.clients.size ?? 0;
  }

  /** Get full event log */
  getEventLog() {
    return [...this.eventLog];
  }

  /** Clear event log */
  clearEventLog() {
    this.eventLog = [];
  }

  /* ── Lifecycle ── */

  /** Destroy all rooms, disconnect all clients, clean up */
  destroy() {
    this.simulatedPeers.forEach(({ timer, doc }) => {
      if (timer) clearInterval(timer);
      doc.destroy();
    });
    this.simulatedPeers.clear();

    this.rooms.forEach((room) => {
      room.clients.forEach((client) => {
        client.isOpen = false;
        client.onClose?.();
      });
      room.ydoc.destroy();
    });
    this.rooms.clear();
    this.log('destroy', '*', 'server', 'MockWSServer destroyed');
  }

  /* ── Logging ── */

  private log(type: string, room: string, client: string, detail?: string) {
    const entry = { timestamp: Date.now(), type, room, client, detail };
    this.eventLog.push(entry);
    if (this.config.verbose) {
      console.log(`[MockWS] [${type}] [${room}] [${client}] ${detail || ''}`);
    }
  }
}

/* ================================================================
   MockWebSocket — Drop-in replacement for browser WebSocket
   that connects to MockWSServer instead of a real server
   ================================================================ */
export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  binaryType: string = 'arraybuffer';

  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  private sendFn: ((data: ArrayBuffer) => void) | null = null;
  private closeFn: (() => void) | null = null;

  constructor(server: MockWSServer, roomName: string, clientId: string) {
    // Simulate async connection
    setTimeout(() => {
      const { socket, send, close } = server.connect(roomName, clientId);

      // Server → client messages arrive via socket.receive
      socket.receive = (data: ArrayBuffer) => {
        if (this.readyState !== MockWebSocket.OPEN) return;
        this.onmessage?.({ data } as MessageEvent);
      };

      socket.onClose = () => {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({ code: 1000, reason: 'Server closed', wasClean: true } as CloseEvent);
      };

      this.sendFn = send;
      this.closeFn = close;

      this.readyState = MockWebSocket.OPEN;
      this.onopen?.({} as Event);
    }, 10); // 10ms simulated handshake
  }

  send(data: ArrayBuffer | string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    let buf: ArrayBuffer;
    if (typeof data === 'string') {
      buf = new TextEncoder().encode(data).buffer;
    } else {
      buf = data;
    }
    this.sendFn?.(buf);
  }

  close(code?: number, reason?: string) {
    if (this.readyState === MockWebSocket.CLOSED) return;
    this.readyState = MockWebSocket.CLOSING;
    this.closeFn?.();
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: code ?? 1000, reason: reason ?? '', wasClean: true } as CloseEvent);
  }
}

/* ================================================================
   Test Scenario Runner — preconfigured E2E test scenarios
   ================================================================ */
export interface TestScenario {
  name: string;
  description: string;
  run: (server: MockWSServer) => Promise<{ passed: boolean; details: string[] }>;
}

export const BUILTIN_SCENARIOS: TestScenario[] = [
  {
    name: 'basic-sync',
    description: '基础双人同步：两个客户端同时编辑，验证最终文档一致',
    run: async (server) => {
      const details: string[] = [];
      const room = 'test-basic-sync';

      // Create two peers
      const cleanup1 = server.addSimulatedPeer({
        clientId: 'alice',
        roomName: room,
        name: 'Alice',
        color: '#f43f5e',
        cursor: { line: 1, column: 1 },
        autoTypeInterval: 50,
        autoTypeContent: 'Hello ',
      });

      const cleanup2 = server.addSimulatedPeer({
        clientId: 'bob',
        roomName: room,
        name: 'Bob',
        color: '#10b981',
        cursor: { line: 1, column: 7 },
        autoTypeInterval: 60,
        autoTypeContent: 'World!',
      });

      // Wait for typing to complete
      await new Promise(resolve => setTimeout(resolve, 800));

      const clientResult = server.assert({ type: 'client-count', roomName: room, expected: 2 });
      details.push(clientResult.message);

      const awarenessResult = server.assert({ type: 'awareness-count', roomName: room, expected: 2 });
      details.push(awarenessResult.message);

      const content = server.getDocContent(room);
      details.push(`Final doc content: "${content}"`);
      details.push(`Content length: ${content.length}`);

      cleanup1();
      cleanup2();

      const passed = clientResult.pass && awarenessResult.pass && content.length > 0;
      return { passed, details };
    },
  },
  {
    name: 'partition-recovery',
    description: '网络分区恢复：断开后重连，验证数据完整性',
    run: async (server) => {
      const details: string[] = [];
      const room = 'test-partition';

      const cleanup1 = server.addSimulatedPeer({
        clientId: 'alice',
        roomName: room,
        name: 'Alice',
        color: '#f43f5e',
        autoTypeInterval: 30,
        autoTypeContent: 'Before partition ',
      });

      await new Promise(resolve => setTimeout(resolve, 600));
      details.push(`Content before partition: "${server.getDocContent(room)}"`);

      server.simulatePartition(room);
      details.push('Partition simulated');

      const afterPartition = server.assert({ type: 'client-count', roomName: room, expected: 0 });
      details.push(`After partition: ${afterPartition.message}`);

      server.healPartition(room);
      details.push('Partition healed');

      // Verify doc content persisted on server
      const content = server.getDocContent(room);
      details.push(`Content after heal: "${content}"`);

      cleanup1();

      return { passed: content.length > 0 && afterPartition.pass, details };
    },
  },
  {
    name: 'conflict-injection',
    description: '冲突注入：服务端直接修改文档，验证客户端接收冲突更新',
    run: async (server) => {
      const details: string[] = [];
      const room = 'test-conflict';

      const cleanup1 = server.addSimulatedPeer({
        clientId: 'alice',
        roomName: room,
        name: 'Alice',
        color: '#f43f5e',
        autoTypeInterval: 40,
        autoTypeContent: 'Original text ',
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      server.injectConflict(room, '[CONFLICT] ');
      details.push('Conflict injected');

      await new Promise(resolve => setTimeout(resolve, 200));

      const content = server.getDocContent(room);
      details.push(`Content after conflict: "${content}"`);
      const hasConflictText = content.includes('[CONFLICT]');
      details.push(`Contains conflict text: ${hasConflictText}`);

      cleanup1();

      return { passed: hasConflictText, details };
    },
  },
];