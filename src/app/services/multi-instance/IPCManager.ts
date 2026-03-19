/**
 * @file IPCManager.ts
 * @description YYC3 跨标签页 IPC 通信管理器 — 基于 BroadcastChannel API 实现多实例消息传递
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ipc,broadcast-channel,multi-instance,cross-tab
 */

import type { IPCMessage, IPCMessageType } from '../../types/multi-instance';

const CHANNEL_NAME = 'yyc3-multi-instance';
const HEARTBEAT_INTERVAL = 3000;
const STALE_THRESHOLD = 10000;

type Handler = (message: IPCMessage) => void;

/**
 * Browser-based IPC Manager using BroadcastChannel API.
 * Replaces Tauri IPC for cross-tab communication.
 */
export class IPCManager {
  private channel: BroadcastChannel | null = null;
  private handlers: Map<IPCMessageType, Set<Handler>> = new Map();
  private wildcardHandlers: Set<Handler> = new Set();
  private instanceId: string;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(instanceId?: string) {
    this.instanceId = instanceId || crypto.randomUUID();
    this.init();
  }

  private init(): void {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('[IPCManager] BroadcastChannel not supported; cross-tab IPC disabled.');
      return;
    }

    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = (event: MessageEvent<IPCMessage>) => {
      const msg = event.data;
      // Skip messages from self
      if (msg.senderId === this.instanceId) return;
      // If targeted to another instance, skip
      if (msg.receiverId && msg.receiverId !== this.instanceId) return;

      this.dispatch(msg);
    };

    // Start heartbeat
    this.heartbeatTimer = setInterval(() => {
      this.broadcast('instance-heartbeat', { alive: true });
    }, HEARTBEAT_INTERVAL);
  }

  private dispatch(msg: IPCMessage): void {
    const typed = this.handlers.get(msg.type);
    if (typed) typed.forEach((h) => h(msg));
    this.wildcardHandlers.forEach((h) => h(msg));
  }

  /** Register handler for a specific message type */
  on(type: IPCMessageType, handler: Handler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => { this.handlers.get(type)?.delete(handler); };
  }

  /** Register handler for ALL message types */
  onAny(handler: Handler): () => void {
    this.wildcardHandlers.add(handler);
    return () => { this.wildcardHandlers.delete(handler); };
  }

  /** Broadcast to all other tabs */
  broadcast(type: IPCMessageType, data: unknown): void {
    if (!this.channel) return;
    const msg: IPCMessage = {
      id: crypto.randomUUID(),
      type,
      senderId: this.instanceId,
      data,
      timestamp: Date.now(),
    };
    this.channel.postMessage(msg);
  }

  /** Send to specific instance */
  sendTo(receiverId: string, type: IPCMessageType, data: unknown): void {
    if (!this.channel) return;
    const msg: IPCMessage = {
      id: crypto.randomUUID(),
      type,
      senderId: this.instanceId,
      receiverId,
      data,
      timestamp: Date.now(),
    };
    this.channel.postMessage(msg);
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  /** Destroy channel & stop heartbeat */
  destroy(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.channel?.close();
    this.channel = null;
    this.handlers.clear();
    this.wildcardHandlers.clear();
  }

  static get STALE_THRESHOLD() { return STALE_THRESHOLD; }
}
