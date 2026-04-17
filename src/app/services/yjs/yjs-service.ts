/**
 * YYC³ AI - Yjs CRDT Service
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module YjsService
 * @description Yjs CRDT 服务层，提供实时协作功能
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { createLogger } from '../../utils/logger';

const log = createLogger('YjsService');

/**
 * Yjs 服务接口
 */
export interface IYjsService {
  // 文本协作
  getText(key: string): Y.Text;
  updateText(key: string, content: string): void;
  observeText(key: string, callback: (event: any) => void): () => void;
  
  // 数组协作
  getArray<T>(key: string): Y.Array<T>;
  updateArray<T>(key: string, items: T[]): void;
  observeArray<T>(key: string, callback: (event: any) => void): () => void;
  
  // 地图协作
  getMap<T>(key: string): Y.Map<T>;
  updateMap<T>(key: string, data: Record<string, T>): void;
  observeMap<T>(key: string, callback: (event: any) => void): () => void;
  
  // 文档管理
  destroy(): void;
  
  // 连接状态
  isConnected(): boolean;
  onConnectionChange(callback: (connected: boolean) => void): () => void;
}

/**
 * Yjs 服务配置
 */
export interface YjsServiceConfig {
  /** 文档 ID */
  docId: string;
  /** 房间名称 */
  roomName: string;
  /** 是否启用 WebRTC */
  enableWebRTC?: boolean;
  /** 是否启用 IndexedDB 持久化 */
  enableIndexedDB?: boolean;
  /** WebRTC 信令服务器配置 */
  signalingServers?: string[];
}

/**
 * Yjs 服务实现
 */
export class YjsService implements IYjsService {
  private doc: Y.Doc;
  private webrtcProvider: WebrtcProvider | null = null;
  private indexedDBProvider: IndexeddbPersistence | null = null;
  private connectionCallbacks: Set<(connected: boolean) => void> = new Set();
  private destroyCallbacks: Set<() => void> = new Set();

  constructor(private config: YjsServiceConfig) {
    this.doc = new Y.Doc({ guid: config.docId });
    this.initializeProviders();
  }

  /**
   * 初始化提供商
   */
  private initializeProviders() {
    // 初始化 WebRTC 提供商
    if (this.config.enableWebRTC !== false) {
      const signalingServers = this.config.signalingServers || [
        'wss://signaling.yjs.dev',
      ];

      this.webrtcProvider = new WebrtcProvider(
        this.config.roomName,
        this.doc,
        { signaling: signalingServers }
      );

      // 监听连接状态
      this.webrtcProvider.on('synced', (event: { synced: boolean }) => {
        this.notifyConnectionChange(event.synced);
      });

      this.webrtcProvider.on('peers', () => {
        this.notifyConnectionChange(true);
      });
    }

    // 初始化 IndexedDB 提供商
    if (this.config.enableIndexedDB !== false) {
      try {
        this.indexedDBProvider = new IndexeddbPersistence(
          this.config.roomName,
          this.doc
        );

        this.indexedDBProvider.on('synced', () => {
          log.debug('IndexedDB synced');
        });
      } catch (error) {
        log.error('Failed to initialize IndexedDB persistence:', error);
      }
    }
  }

  /**
   * 获取文本协作对象
   */
  getText(key: string): Y.Text {
    return this.doc.getText(key);
  }

  /**
   * 更新文本内容
   */
  updateText(key: string, content: string): void {
    const text = this.doc.getText(key);
    text.delete(0, text.length);
    text.insert(0, content);
  }

  /**
   * 监听文本变化
   */
  observeText(key: string, callback: (event: any) => void): () => void {
    const text = this.doc.getText(key);
    text.observe(callback);

    // 返回取消订阅函数
    return () => text.unobserve(callback);
  }

  /**
   * 获取数组协作对象
   */
  getArray<T>(key: string): Y.Array<T> {
    return this.doc.getArray(key);
  }

  /**
   * 更新数组内容
   */
  updateArray<T>(key: string, items: T[]): void {
    const array = this.doc.getArray(key);
    array.delete(0, array.length);
    array.push(items);
  }

  /**
   * 监听数组变化
   */
  observeArray<T>(key: string, callback: (event: any) => void): () => void {
    const array = this.doc.getArray(key);
    array.observe(callback);

    return () => array.unobserve(callback);
  }

  /**
   * 获取地图协作对象
   */
  getMap<T>(key: string): Y.Map<T> {
    return this.doc.getMap(key);
  }

  /**
   * 更新地图内容
   */
  updateMap<T>(key: string, data: Record<string, T>): void {
    const map = this.doc.getMap(key);
    Object.entries(data).forEach(([k, v]) => {
      map.set(k, v);
    });
  }

  /**
   * 监听地图变化
   */
  observeMap<T>(key: string, callback: (event: any) => void): () => void {
    const map = this.doc.getMap(key);
    map.observe(callback);

    return () => map.unobserve(callback);
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.webrtcProvider) {
      this.webrtcProvider.destroy();
      this.webrtcProvider = null;
    }

    if (this.indexedDBProvider) {
      this.indexedDBProvider.destroy();
      this.indexedDBProvider = null;
    }

    this.doc.destroy();
    this.connectionCallbacks.clear();
    this.destroyCallbacks.forEach((cb) => cb());
    this.destroyCallbacks.clear();
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    if (!this.webrtcProvider) {
      return false;
    }

    const room = this.webrtcProvider.room;
    return room ? room.webrtcConns.size > 0 : false;
  }

  /**
   * 监听连接状态变化
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.add(callback);

    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  /**
   * 通知连接状态变化
   */
  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => cb(connected));
  }
}

/**
 * 创建 Yjs 服务实例
 */
export function createYjsService(config: YjsServiceConfig): YjsService {
  return new YjsService(config);
}

/**
 * 单例 Yjs 服务
 */
let singletonYjsService: YjsService | null = null;
let currentConfig: YjsServiceConfig | null = null;

/**
 * 获取或创建单例 Yjs 服务
 */
export function getYjsService(config?: YjsServiceConfig): YjsService {
  if (singletonYjsService && currentConfig) {
    if (config && 
        (config.docId !== currentConfig.docId || 
         config.roomName !== currentConfig.roomName)) {
      destroyYjsService();
    } else {
      return singletonYjsService;
    }
  }

  if (!config) {
    throw new Error('YjsService config is required for first initialization');
  }
  
  currentConfig = config;
  singletonYjsService = new YjsService(config);
  return singletonYjsService;
}

/**
 * 销毁单例 Yjs 服务
 */
export function destroyYjsService(): void {
  if (singletonYjsService) {
    singletonYjsService.destroy();
    singletonYjsService = null;
    currentConfig = null;
  }
}

export default YjsService;
