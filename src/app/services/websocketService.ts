/**
 * @file websocketService.ts
 * @description YYC3 WebSocket 服务 — 实时协作编辑的基础架构
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags websocket,realtime,crdt,service,skeleton
 */

import { WS_CONFIG } from '../config';

// ── Types ──

export type WSMessageType = 'cursor' | 'edit' | 'presence' | 'init';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  userId: string;
  timestamp: number;
}

export interface WSConnectionStatus {
  connected: boolean;
  roomId: string | null;
}

// ── Service Class ──

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private url: string;
  private listeners: Map<string, Set<(msg: WSMessage) => void>> = new Map();

  constructor(url?: string) {
    this.url = url || WS_CONFIG.primary.replace('ws://', 'wss://'); // 简单的协议转换
  }

  /**
   * 连接到房间
   */
  connect(roomId: string, userId: string): Promise<WSConnectionStatus> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve({ connected: true, roomId });
        return;
      }

      try {
        const fullUrl = `${this.url}/room/${roomId}?userId=${userId}`;
        this.ws = new WebSocket(fullUrl);

        this.ws.onopen = () => {
          console.log(`[WebSocket] Connected to room: ${roomId}`);
          this.clearReconnectTimer();
          resolve({ connected: true, roomId });
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const msg: WSMessage = JSON.parse(event.data);
            this.dispatch(msg);
          } catch (err) {
            console.error('[WebSocket] Failed to parse message', err);
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 发送消息
   */
  send(type: WSMessageType, payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Not connected. Message not sent.');
      return;
    }

    const message: WSMessage = {
      type,
      payload,
      userId: 'current-user-id', // TODO: from auth context
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * 订阅特定类型的消息
   */
  on(type: WSMessageType, callback: (msg: WSMessage) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // 返回取消订阅函数
    return () => this.off(type, callback);
  }

  /**
   * 取消订阅
   */
  off(type: WSMessageType, callback: (msg: WSMessage) => void) {
    this.listeners.get(type)?.delete(callback);
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.clearReconnectTimer();
  }

  // ── Private Methods ──

  private dispatch(message: WSMessage) {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach(cb => cb(message));
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    console.log('[WebSocket] Scheduling reconnect in 3s...');
    this.reconnectTimer = setTimeout(() => {
      // TODO: Trigger reconnect logic
      // this.connect(this.roomId, this.userId);
      this.reconnectTimer = null;
    }, 3000);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// Singleton
let wsInstance: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!wsInstance) {
    wsInstance = new WebSocketService();
  }
  return wsInstance;
};
