/**
 * YYC³ AI - Offline Service (IndexedDB + Service Worker)
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module OfflineService
 * @description 离线模式支持服务，提供数据存储、同步功能、Service Worker预缓存和离线状态检测
 * @author YYC³ AI Team
 * @version 3.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { openDB, IDBPDatabase } from 'idb';
import { createLogger } from '../../utils/logger';

const log = createLogger('OfflineService');

// ============================================
// Service Worker Types
// ============================================

export interface ServiceWorkerStatus {
  registered: boolean
  waiting: boolean
  active: boolean
  controller: ServiceWorker | null
}

export interface PrecacheEntry {
  url: string
  revision?: string
}

export type NetworkStatus = 'online' | 'offline' | 'slow'

export interface OfflineStatus {
  networkStatus: NetworkStatus
  serviceWorkerStatus: ServiceWorkerStatus
  lastSyncTimestamp: number | null
  pendingSyncCount: number
}

type OfflineStatusListener = (status: OfflineStatus) => void

// ============================================
// Database Schema
// ============================================
 
interface YYC3OfflineDB {
   
  texts: {
    key: string;
    value: {
      id: string;
      content: string;
      timestamp: number;
      synced: boolean;
    };
    indexes: { 'by-timestamp': number; 'by-synced': boolean };
  };
   
  arrays: {
    key: string;
    value: {
      id: string;
      items: any[];
      timestamp: number;
      synced: boolean;
    };
    indexes: { 'by-timestamp': number; 'by-synced': boolean };
  };
   
  maps: {
    key: string;
    value: {
      id: string;
      data: Record<string, any>;
      timestamp: number;
      synced: boolean;
    };
    indexes: { 'by-timestamp': number; 'by-synced': boolean };
  };

  precacheManifest: {
    key: string;
    value: {
      url: string;
      revision: string;
      cachedAt: number;
    };
  };
}

/**
 * 离线服务接口
 */
export interface IOfflineService {
  // 数据存储
  storeText(id: string, content: string): Promise<void>;
  storeArray<T>(id: string, items: T[]): Promise<void>;
  storeMap<T>(id: string, data: Record<string, T>): Promise<void>;
  
  // 数据获取
  getText(id: string): Promise<string | null>;
  getArray<T>(id: string): Promise<T[] | null>;
  getMap<T>(id: string): Promise<Record<string, T> | null>;
  
  // 数据删除
  deleteText(id: string): Promise<void>;
  deleteArray(id: string): Promise<void>;
  deleteMap(id: string): Promise<void>;
  
  // 同步管理
  syncWithOnline(): Promise<void>;
  markAsSynced(id: string): Promise<void>;
  getUnsyncedItems(): Promise<Array<{ id: string; type: string }>>;
  
  // 事件管理
  onSync(callback: (data: any) => void): () => void;
  
  // Service Worker 管理
  registerServiceWorker(swPath?: string): Promise<ServiceWorkerRegistration | null>;
  getServiceWorkerStatus(): ServiceWorkerStatus;
  updateServiceWorker(): Promise<void>;
  unregisterServiceWorker(): Promise<void>;
  
  // 预缓存管理
  precacheResources(entries: PrecacheEntry[]): Promise<void>;
  getPrecachedUrls(): Promise<string[]>;
  clearPrecache(): Promise<void>;
  
  // 离线状态
  getOfflineStatus(): OfflineStatus;
  onStatusChange(listener: OfflineStatusListener): () => void;
  
  // 销毁
  destroy(): void;
}

/**
 * 离线服务配置
 */
export interface OfflineServiceConfig {
  /** 数据库名称 */
  dbName?: string;
  /** 数据库版本 */
  dbVersion?: number;
  /** Service Worker 脚本路径 */
  swPath?: string;
  /** 是否自动注册 Service Worker */
  autoRegisterSW?: boolean;
  /** 关键资源预缓存列表 */
  precacheEntries?: PrecacheEntry[];
  /** 网络状态检测间隔 (ms) */
  networkCheckInterval?: number;
}

// ============================================
// Service Worker Manager
// ============================================

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private swPath: string

  constructor(swPath: string = '/sw.js') {
    this.swPath = swPath
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      log.warn('Service Worker not supported')
      return null
    }

    try {
      this.registration = await navigator.serviceWorker.register(this.swPath, {
        scope: '/',
        updateViaCache: 'none',
      })

      log.info('Service Worker registered', { scope: this.registration.scope })

      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing
        if (!newWorker) {return}

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            log.info('New Service Worker available, waiting to activate')
          }
          if (newWorker.state === 'activated') {
            log.info('New Service Worker activated')
          }
        })
      })

      return this.registration
    } catch (err) {
      log.error('Service Worker registration failed', err)
      return null
    }
  }

  getStatus(): ServiceWorkerStatus {
    const controller = navigator.serviceWorker?.controller || null
    return {
      registered: !!this.registration,
      waiting: !!this.registration?.waiting,
      active: !!controller,
      controller,
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      log.warn('No Service Worker registration to update')
      return
    }
    try {
      await this.registration.update()
      log.info('Service Worker update triggered')
    } catch (err) {
      log.error('Service Worker update failed', err)
    }
  }

  async unregister(): Promise<void> {
    if (!this.registration) {return}
    try {
      await this.registration.unregister()
      this.registration = null
      log.info('Service Worker unregistered')
    } catch (err) {
      log.error('Service Worker unregister failed', err)
    }
  }

  postMessage(message: any): void {
    const controller = navigator.serviceWorker?.controller
    if (controller) {
      controller.postMessage(message)
    }
  }
}

// ============================================
// Network Status Monitor
// ============================================

class NetworkMonitor {
  private status: NetworkStatus = 'online'
  private listeners: Set<OfflineStatusListener> = new Set()
  private intervalId: ReturnType<typeof setInterval> | null = null
  private checkInterval: number
  private getStatusCallback: () => OfflineStatus

  constructor(checkInterval: number, getStatusCallback: () => OfflineStatus) {
    this.checkInterval = checkInterval
    this.getStatusCallback = getStatusCallback

    if (typeof window !== 'undefined') {
      this.status = navigator.onLine ? 'online' : 'offline'
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
      this.startPeriodicCheck()
    }
  }

  private handleOnline = () => {
    this.status = 'online'
    this.notifyListeners()
  }

  private handleOffline = () => {
    this.status = 'offline'
    this.notifyListeners()
  }

  private startPeriodicCheck() {
    if (this.checkInterval <= 0) {return}
    this.intervalId = setInterval(() => {
      const newStatus: NetworkStatus = navigator.onLine ? 'online' : 'offline'
      if (newStatus !== this.status) {
        this.status = newStatus
        this.notifyListeners()
      }
    }, this.checkInterval)
  }

  getStatus(): NetworkStatus {
    return this.status
  }

  onStatusChange(listener: OfflineStatusListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    const status = this.getStatusCallback()
    this.listeners.forEach(fn => {
      try { fn(status) } catch { /* swallow */ }
    })
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.listeners.clear()
  }
}

/**
 * 离线服务实现
 */
export class OfflineService implements IOfflineService {
  private db: IDBPDatabase<YYC3OfflineDB> | null = null;
  private syncCallbacks: Set<(data: any) => void> = new Set();
  private destroyCallbacks: Set<() => void> = new Set();
  
  private readonly DB_NAME = 'YYC3OfflineDB';
  private readonly DB_VERSION = 2;

  private swManager: ServiceWorkerManager;
  private networkMonitor: NetworkMonitor;
  private statusListeners: Set<OfflineStatusListener> = new Set();
  private config: Required<Pick<OfflineServiceConfig, 'swPath' | 'networkCheckInterval'>> & OfflineServiceConfig;

  constructor(config: OfflineServiceConfig = {}) {
    this.config = {
      swPath: config.swPath || '/sw.js',
      networkCheckInterval: config.networkCheckInterval || 30000,
      ...config,
    };

    this.swManager = new ServiceWorkerManager(this.config.swPath);
    this.networkMonitor = new NetworkMonitor(
      this.config.networkCheckInterval || 30000,
      () => this.getOfflineStatus()
    );

    this.initialize();

    if (config.autoRegisterSW) {
      this.registerServiceWorker(this.config.swPath);
    }

    if (config.precacheEntries?.length) {
      this.precacheResources(config.precacheEntries);
    }
  }

  /**
   * 初始化数据库
   */
  private async initialize(): Promise<void> {
    const dbName = this.config.dbName || this.DB_NAME;
    const dbVersion = this.config.dbVersion || this.DB_VERSION;

    this.db = await openDB<YYC3OfflineDB>(dbName, dbVersion, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('texts')) {
          const textStore = db.createObjectStore('texts', { keyPath: 'id' });
          textStore.createIndex('by-timestamp', 'timestamp');
          textStore.createIndex('by-synced', 'synced');
        }

        if (!db.objectStoreNames.contains('arrays')) {
          const arrayStore = db.createObjectStore('arrays', { keyPath: 'id' });
          arrayStore.createIndex('by-timestamp', 'timestamp');
          arrayStore.createIndex('by-synced', 'synced');
        }

        if (!db.objectStoreNames.contains('maps')) {
          const mapStore = db.createObjectStore('maps', { keyPath: 'id' });
          mapStore.createIndex('by-timestamp', 'timestamp');
          mapStore.createIndex('by-synced', 'synced');
        }

        if (!db.objectStoreNames.contains('precacheManifest')) {
          db.createObjectStore('precacheManifest', { keyPath: 'url' });
        }
      },
    });
  }

  // ── Data Storage ──

  async storeText(id: string, content: string): Promise<void> {
    if (!this.db) { await this.waitForDb() }
    await this.db!.put('texts', { id, content, timestamp: Date.now(), synced: false });
  }

  async storeArray<T>(id: string, items: T[]): Promise<void> {
    if (!this.db) { await this.waitForDb() }
    await this.db!.put('arrays', { id, items, timestamp: Date.now(), synced: false });
  }

  async storeMap<T>(id: string, data: Record<string, T>): Promise<void> {
    if (!this.db) { await this.waitForDb() }
    await this.db!.put('maps', { id, data, timestamp: Date.now(), synced: false });
  }

  // ── Data Retrieval ──

  async getText(id: string): Promise<string | null> {
    if (!this.db) { await this.waitForDb() }
    const result = await this.db!.get('texts', id);
    return result?.content || null;
  }

  async getArray<T>(id: string): Promise<T[] | null> {
    if (!this.db) { await this.waitForDb() }
    const result = await this.db!.get('arrays', id);
    return result?.items || null;
  }

  async getMap<T>(id: string): Promise<Record<string, T> | null> {
    if (!this.db) { await this.waitForDb() }
    const result = await this.db!.get('maps', id);
    return result?.data || null;
  }

  // ── Data Deletion ──

  async deleteText(id: string): Promise<void> {
    if (!this.db) { await this.waitForDb() }
    await this.db!.delete('texts', id);
  }

  async deleteArray(id: string): Promise<void> {
    if (!this.db) { await this.waitForDb() }
    await this.db!.delete('arrays', id);
  }

  async deleteMap(id: string): Promise<void> {
    if (!this.db) { await this.waitForDb() }
    await this.db!.delete('maps', id);
  }

  // ── Sync Management ──

  async syncWithOnline(): Promise<void> {
    const unsyncedItems = await this.getUnsyncedItems();
    
    for (const item of unsyncedItems) {
      log.debug('Syncing item:', item);
      await this.markAsSynced(item.id);
      this.syncCallbacks.forEach((cb) => cb(item));
    }
  }

  async markAsSynced(id: string): Promise<void> {
    if (!this.db) { await this.waitForDb() }

    const textItem = await this.db!.get('texts', id);
    if (textItem) {
      await this.db!.put('texts', { ...textItem, synced: true });
      return;
    }

    const arrayItem = await this.db!.get('arrays', id);
    if (arrayItem) {
      await this.db!.put('arrays', { ...arrayItem, synced: true });
      return;
    }

    const mapItem = await this.db!.get('maps', id);
    if (mapItem) {
      await this.db!.put('maps', { ...mapItem, synced: true });
      return;
    }
  }

  async getUnsyncedItems(): Promise<Array<{ id: string; type: string }>> {
    if (!this.db) { await this.waitForDb() }

    const unsyncedItems: Array<{ id: string; type: string }> = [];

    const unsyncedTexts = await this.db!.getAllFromIndex('texts', 'by-synced', 0 as any);
    unsyncedTexts.forEach((text) => { unsyncedItems.push({ id: text.id, type: 'text' }) });

    const unsyncedArrays = await this.db!.getAllFromIndex('arrays', 'by-synced', 0 as any);
    unsyncedArrays.forEach((array) => { unsyncedItems.push({ id: array.id, type: 'array' }) });

    const unsyncedMaps = await this.db!.getAllFromIndex('maps', 'by-synced', 0 as any);
    unsyncedMaps.forEach((map) => { unsyncedItems.push({ id: map.id, type: 'map' }) });

    return unsyncedItems;
  }

  onSync(callback: (data: any) => void): () => void {
    this.syncCallbacks.add(callback);
    return () => { this.syncCallbacks.delete(callback) };
  }

  // ── Service Worker Management ──

  async registerServiceWorker(swPath?: string): Promise<ServiceWorkerRegistration | null> {
    if (swPath) { this.swManager = new ServiceWorkerManager(swPath) }
    return this.swManager.register()
  }

  getServiceWorkerStatus(): ServiceWorkerStatus {
    return this.swManager.getStatus()
  }

  async updateServiceWorker(): Promise<void> {
    await this.swManager.update()
  }

  async unregisterServiceWorker(): Promise<void> {
    await this.swManager.unregister()
  }

  // ── Precache Management ──

  async precacheResources(entries: PrecacheEntry[]): Promise<void> {
    if (!this.db) { await this.waitForDb() }

    const tx = this.db!.transaction('precacheManifest', 'readwrite')
    const now = Date.now()

    for (const entry of entries) {
      await tx.store.put({
        url: entry.url,
        revision: entry.revision || String(now),
        cachedAt: now,
      })
    }

    this.swManager.postMessage({
      type: 'PRECACHE',
      urls: entries.map(e => e.url),
    })

    log.info('Precache resources queued', { count: entries.length })
  }

  async getPrecachedUrls(): Promise<string[]> {
    if (!this.db) { await this.waitForDb() }
    const all = await this.db!.getAll('precacheManifest')
    return all.map(e => e.url)
  }

  async clearPrecache(): Promise<void> {
    if (!this.db) { await this.waitForDb() }
    await this.db!.clear('precacheManifest')
    this.swManager.postMessage({ type: 'CLEAR_CACHE' })
    log.info('Precache cleared')
  }

  // ── Offline Status ──

  getOfflineStatus(): OfflineStatus {
    return {
      networkStatus: this.networkMonitor.getStatus(),
      serviceWorkerStatus: this.swManager.getStatus(),
      lastSyncTimestamp: null,
      pendingSyncCount: 0,
    }
  }

  onStatusChange(listener: OfflineStatusListener): () => void {
    this.statusListeners.add(listener)
    this.networkMonitor.onStatusChange(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  // ── Lifecycle ──

  private async waitForDb(): Promise<void> {
    let retries = 0
    while (!this.db && retries < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      retries++
    }
    if (!this.db) { throw new Error('Database initialization timed out') }
  }

  async destroy(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }

    this.networkMonitor.destroy()
    this.syncCallbacks.clear();
    this.statusListeners.clear()
    this.destroyCallbacks.forEach((cb) => cb());
    this.destroyCallbacks.clear();
  }
}

/**
 * 创建离线服务实例
 */
export function createOfflineService(config?: OfflineServiceConfig): OfflineService {
  return new OfflineService(config);
}

/**
 * 单例离线服务
 */
let singletonOfflineService: OfflineService | null = null;

/**
 * 获取或创建单例离线服务
 */
export function getOfflineService(config?: OfflineServiceConfig): OfflineService {
  if (!singletonOfflineService) {
    singletonOfflineService = new OfflineService(config);
  }

  return singletonOfflineService;
}

/**
 * 销毁单例离线服务
 */
export async function destroyOfflineService(): Promise<void> {
  if (singletonOfflineService) {
    await singletonOfflineService.destroy();
    singletonOfflineService = null;
  }
}

export default OfflineService;
