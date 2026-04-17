---
file: YYC3-P0-架构-本地存储.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: architecture
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


# YYC³ P0-架构-本地存储

## 🤖 AI 角色定义

You are a senior full‑stack architect and data storage specialist with deep expertise in modern web storage solutions, database design, and secure data management.

### Your Role & Expertise

You are an experienced systems architect who specializes in:
- **Data Storage**: IndexedDB, LocalStorage, SessionStorage, WebSQL
- **Database Systems**: PostgreSQL, MySQL, MongoDB, Redis, SQLite
- **ORM Frameworks**: Dexie.js, TypeORM, Prisma, Mongoose
- **Data Encryption**: Web Crypto API, AES encryption, secure key management
- **Data Migration**: Versioned migrations, schema evolution, data transformation
- **Performance Optimization**: Query optimization, indexing strategies, caching
- **Data Synchronization**: Real-time sync, conflict resolution, offline-first
- **Security Best Practices**: Data protection, secure storage, access control

### Code Standards

**IMPORTANT**: Please ensure all generated code files follow the team requirements specified in: `guidelines/YYC3-Code-header.md`

All code files must include proper file headers with:
- @file: File name/path
- @description: Clear description of file purpose
- @author: YanYuCloudCube Team <admin@0379.email>
- @version: Semantic version (v1.0.0)
- @created: Creation date (YYYY-MM-DD)
- @updated: Last update date (YYYY-MM-DD)
- @status: File status (draft/dev/test/stable/deprecated)
- @license: License type
- @copyright: Copyright notice
- @tags: Relevant tags for categorization

---

## 📋 文档信息

| 字段 | 内容 |
|------|------|
| @file | P0-核心架构/YYC3-P0-架构-本地存储.md |
| @description | 本地存储架构层实现，基于 Dexie.js + IndexedDB 的数据持久化与加密存储方案 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P0,architecture,storage,database,encryption |

---

## 🎯 架构目标

实现基于浏览器的本地数据持久化存储系统，支持：

- ✅ 大容量数据存储（IndexedDB，支持数百MB到数GB）
- ✅ 数据加密保护（Web Crypto API）
- ✅ 版本化数据库迁移
- ✅ 高性能查询与索引
- ✅ 事务支持与并发控制
- ✅ 与宿主机文件系统同步

---

## 🏗️ 技术架构

### 核心技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Dexie.js | 3.2.4 | IndexedDB ORM |
| IndexedDB | Browser API | 浏览器本地存储 |
| Web Crypto API | Browser API | 数据加密 |
| dayjs | 1.11.10 | 时间处理 |

### 架构分层

```
┌─────────────────────────────────────┐
│   应用层 (Application Layer)         │
│  - 组件数据访问                       │
│  - 业务逻辑处理                       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   存储服务层 (Storage Service)       │
│  - 加密/解密服务                     │
│  - 同步服务                         │
│  - 缓存服务                         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   数据访问层 (Data Access Layer)     │
│  - Dexie ORM                        │
│  - 事务管理                         │
│  - 查询构建器                       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   存储引擎层 (Storage Engine)        │
│  - IndexedDB                         │
│  - Web Crypto API                   │
└─────────────────────────────────────┘
```

---

## 💾 数据库设计

### 数据库结构

```typescript
// src/storage/db.ts
import Dexie, { Table } from 'dexie';

/**
 * 笔记数据模型
 */
export interface Note {
  id: string;                    // 主键
  title: string;                 // 标题
  content: string;               // 内容
  encryptedContent?: string;     // 加密内容（可选）
  createdAt: number;            // 创建时间戳
  updatedAt: number;            // 更新时间戳
  tags?: string[];              // 标签
  isEncrypted: boolean;         // 是否加密
  syncStatus: 'synced' | 'pending' | 'conflict'; // 同步状态
  version: number;              // 版本号
}

/**
 * 项目数据模型
 */
export interface Project {
  id: string;                    // 主键
  name: string;                 // 项目名称
  description: string;          // 项目描述
  createdAt: number;            // 创建时间戳
  updatedAt: number;            // 更新时间戳
  settings: Record<string, any>; // 项目设置
}

/**
 * 文件数据模型
 */
export interface FileRecord {
  id: string;                    // 主键
  name: string;                 // 文件名
  path: string;                 // 文件路径
  content: string;              // 文件内容
  size: number;                 // 文件大小
  type: string;                 // 文件类型
  createdAt: number;            // 创建时间戳
  updatedAt: number;            // 更新时间戳
}

/**
 * 同步记录数据模型
 */
export interface SyncRecord {
  id: string;                    // 主键
  entityType: 'note' | 'project' | 'file'; // 实体类型
  entityId: string;             // 实体ID
  action: 'create' | 'update' | 'delete'; // 操作类型
  timestamp: number;            // 时间戳
  status: 'pending' | 'success' | 'failed'; // 状态
  errorMessage?: string;       // 错误信息
}

/**
 * 应用数据库类
 */
export class AppDB extends Dexie {
  notes!: Table<Note, string>;
  projects!: Table<Project, string>;
  files!: Table<FileRecord, string>;
  syncRecords!: Table<SyncRecord, string>;

  constructor() {
    super('{{PROJECT_SLUG}}-db');

    // 版本 1：初始数据库结构
    this.version(1).stores({
      notes: 'id, createdAt, updatedAt, tags, syncStatus',
      projects: 'id, createdAt, updatedAt',
      files: 'id, name, type, createdAt, updatedAt',
      syncRecords: 'id, entityType, entityId, timestamp, status',
    });

    // 版本 2：添加加密支持
    this.version(2).stores({
      notes: 'id, createdAt, updatedAt, tags, syncStatus, isEncrypted',
      projects: 'id, createdAt, updatedAt',
      files: 'id, name, type, createdAt, updatedAt',
      syncRecords: 'id, entityType, entityId, timestamp, status',
    }).upgrade(async (tx) => {
      // 迁移逻辑：为已有数据添加加密字段
      const notes = await tx.table('notes').toArray();
      await Promise.all(
        notes.map(note => 
          tx.table('notes').update(note.id, { isEncrypted: false })
        )
      );
    });

    // 版本 3：添加版本控制
    this.version(3).stores({
      notes: 'id, createdAt, updatedAt, tags, syncStatus, isEncrypted, version',
      projects: 'id, createdAt, updatedAt',
      files: 'id, name, type, createdAt, updatedAt',
      syncRecords: 'id, entityType, entityId, timestamp, status',
    }).upgrade(async (tx) => {
      // 迁移逻辑：为已有数据添加版本号
      const notes = await tx.table('notes').toArray();
      await Promise.all(
        notes.map(note => 
          tx.table('notes').update(note.id, { version: 1 })
        )
      );
    });
  }
}

// 导出数据库实例
export const db = new AppDB();
```

---

## 🔐 数据加密实现

### 加密服务

```typescript
// src/storage/encryption.ts
import * as crypto from 'crypto';

/**
 * 加密配置
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  saltLength: 16,
} as const;

/**
 * 从密码派生密钥
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: ENCRYPTION_CONFIG.keyLength },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 加密数据
 */
export async function encrypt(
  data: string,
  password: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
  const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
  
  const key = await deriveKey(password, salt);
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: iv,
    },
    key,
    encoder.encode(data)
  );

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * 解密数据
 */
export async function decrypt(
  encryptedData: string,
  password: string,
  salt: string,
  iv: string
): Promise<string> {
  const saltArray = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  const key = await deriveKey(password, saltArray);
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: ivArray,
    },
    key,
    encryptedArray
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * 生成随机密码
 */
export function generateRandomPassword(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  
  return password;
}
```

---

## 🔄 数据同步策略

### 同步服务

```typescript
// src/storage/sync.ts
import { db } from './db';
import { HostBridge } from '../host-bridge';

/**
 * 同步配置
 */
const SYNC_CONFIG = {
  autoSync: true,
  syncInterval: 30000, // 30秒
  retryAttempts: 3,
  retryDelay: 5000, // 5秒
} as const;

/**
 * 同步服务类
 */
export class SyncService {
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  /**
   * 启动自动同步
   */
  startAutoSync() {
    if (SYNC_CONFIG.autoSync && !this.syncTimer) {
      this.syncTimer = setInterval(() => {
        this.sync();
      }, SYNC_CONFIG.syncInterval);
    }
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * 执行同步
   */
  async sync(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      // 1. 获取待同步记录
      const pendingRecords = await db.syncRecords
        .where('status')
        .equals('pending')
        .toArray();

      // 2. 按实体类型分组
      const groupedRecords = this.groupByEntityType(pendingRecords);

      // 3. 执行同步
      for (const [entityType, records] of Object.entries(groupedRecords)) {
        await this.syncEntityType(entityType, records);
      }

      // 4. 更新同步状态
      await db.syncRecords
        .where('status')
        .equals('pending')
        .modify({ status: 'success' });
    } catch (error) {
      console.error('Sync failed:', error);
      
      // 更新失败记录
      await db.syncRecords
        .where('status')
        .equals('pending')
        .modify({ 
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 按实体类型分组
   */
  private groupByEntityType(records: SyncRecord[]): Record<string, SyncRecord[]> {
    return records.reduce((acc, record) => {
      if (!acc[record.entityType]) {
        acc[record.entityType] = [];
      }
      acc[record.entityType].push(record);
      return acc;
    }, {} as Record<string, SyncRecord[]>);
  }

  /**
   * 同步特定实体类型
   */
  private async syncEntityType(
    entityType: string,
    records: SyncRecord[]
  ): Promise<void> {
    for (const record of records) {
      let attempt = 0;
      let success = false;

      while (attempt < SYNC_CONFIG.retryAttempts && !success) {
        try {
          await this.syncRecord(record);
          success = true;
        } catch (error) {
          attempt++;
          if (attempt < SYNC_CONFIG.retryAttempts) {
            await new Promise(resolve => 
              setTimeout(resolve, SYNC_CONFIG.retryDelay)
            );
          } else {
            throw error;
          }
        }
      }
    }
  }

  /**
   * 同步单条记录
   */
  private async syncRecord(record: SyncRecord): Promise<void> {
    switch (record.entityType) {
      case 'note':
        await this.syncNote(record);
        break;
      case 'project':
        await this.syncProject(record);
        break;
      case 'file':
        await this.syncFile(record);
        break;
      default:
        throw new Error(`Unknown entity type: ${record.entityType}`);
    }
  }

  /**
   * 同步笔记
   */
  private async syncNote(record: SyncRecord): Promise<void> {
    const note = await db.notes.get(record.entityId);
    if (!note) {
      throw new Error(`Note not found: ${record.entityId}`);
    }

    // 使用宿主机桥接保存到文件系统
    const filePath = `/notes/${note.id}.json`;
    await HostBridge.writeFile(filePath, JSON.stringify(note, null, 2));
  }

  /**
   * 同步项目
   */
  private async syncProject(record: SyncRecord): Promise<void> {
    const project = await db.projects.get(record.entityId);
    if (!project) {
      throw new Error(`Project not found: ${record.entityId}`);
    }

    const filePath = `/projects/${project.id}.json`;
    await HostBridge.writeFile(filePath, JSON.stringify(project, null, 2));
  }

  /**
   * 同步文件
   */
  private async syncFile(record: SyncRecord): Promise<void> {
    const file = await db.files.get(record.entityId);
    if (!file) {
      throw new Error(`File not found: ${record.entityId}`);
    }

    await HostBridge.writeFile(file.path, file.content);
  }

  /**
   * 创建同步记录
   */
  async createSyncRecord(
    entityType: SyncRecord['entityType'],
    entityId: string,
    action: SyncRecord['action']
  ): Promise<void> {
    await db.syncRecords.add({
      id: `${entityType}-${entityId}-${Date.now()}`,
      entityType,
      entityId,
      action,
      timestamp: Date.now(),
      status: 'pending',
    });
  }
}

// 导出同步服务实例
export const syncService = new SyncService();
```

---

## 📦 存储服务层

### 存储服务接口

```typescript
// src/storage/storage-service.ts
import { db, Note, Project, FileRecord } from './db';
import { encrypt, decrypt } from './encryption';
import { syncService } from './sync';

/**
 * 存储服务类
 */
export class StorageService {
  /**
   * 创建笔记
   */
  async createNote(
    note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    password?: string
  ): Promise<Note> {
    const now = Date.now();
    const id = crypto.randomUUID();
    
    let content = note.content;
    let isEncrypted = false;
    let encryptedContent: string | undefined;

    if (password) {
      const encrypted = await encrypt(note.content, password);
      encryptedContent = encrypted.encrypted;
      content = '';
      isEncrypted = true;
    }

    const newNote: Note = {
      id,
      title: note.title,
      content,
      encryptedContent,
      createdAt: now,
      updatedAt: now,
      tags: note.tags,
      isEncrypted,
      syncStatus: 'pending',
      version: 1,
    };

    await db.notes.add(newNote);
    await syncService.createSyncRecord('note', id, 'create');

    return newNote;
  }

  /**
   * 更新笔记
   */
  async updateNote(
    id: string,
    updates: Partial<Omit<Note, 'id' | 'createdAt' | 'version'>>,
    password?: string
  ): Promise<Note> {
    const existing = await db.notes.get(id);
    if (!existing) {
      throw new Error(`Note not found: ${id}`);
    }

    let content = updates.content ?? existing.content;
    let encryptedContent = updates.encryptedContent ?? existing.encryptedContent;
    let isEncrypted = updates.isEncrypted ?? existing.isEncrypted;

    if (password && updates.content) {
      const encrypted = await encrypt(updates.content, password);
      encryptedContent = encrypted.encrypted;
      content = '';
      isEncrypted = true;
    }

    const updated: Note = {
      ...existing,
      ...updates,
      content,
      encryptedContent,
      isEncrypted,
      updatedAt: Date.now(),
      syncStatus: 'pending',
      version: existing.version + 1,
    };

    await db.notes.put(updated);
    await syncService.createSyncRecord('note', id, 'update');

    return updated;
  }

  /**
   * 删除笔记
   */
  async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id);
    await syncService.createSyncRecord('note', id, 'delete');
  }

  /**
   * 获取笔记
   */
  async getNote(id: string, password?: string): Promise<Note | undefined> {
    const note = await db.notes.get(id);
    if (!note) {
      return undefined;
    }

    if (note.isEncrypted && password && note.encryptedContent) {
      try {
        note.content = await decrypt(
          note.encryptedContent,
          password,
          '', // salt
          ''  // iv
        );
      } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt note');
      }
    }

    return note;
  }

  /**
   * 获取所有笔记
   */
  async getAllNotes(): Promise<Note[]> {
    return db.notes.toArray();
  }

  /**
   * 搜索笔记
   */
  async searchNotes(query: string): Promise<Note[]> {
    const notes = await db.notes.toArray();
    const lowerQuery = query.toLowerCase();

    return notes.filter(note => 
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 按标签获取笔记
   */
  async getNotesByTag(tag: string): Promise<Note[]> {
    const notes = await db.notes.toArray();
    return notes.filter(note => 
      note.tags?.includes(tag)
    );
  }

  /**
   * 创建项目
   */
  async createProject(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> {
    const now = Date.now();
    const id = crypto.randomUUID();

    const newProject: Project = {
      id,
      name: project.name,
      description: project.description,
      createdAt: now,
      updatedAt: now,
      settings: project.settings,
    };

    await db.projects.add(newProject);
    await syncService.createSyncRecord('project', id, 'create');

    return newProject;
  }

  /**
   * 更新项目
   */
  async updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
  ): Promise<Project> {
    const existing = await db.projects.get(id);
    if (!existing) {
      throw new Error(`Project not found: ${id}`);
    }

    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await db.projects.put(updated);
    await syncService.createSyncRecord('project', id, 'update');

    return updated;
  }

  /**
   * 删除项目
   */
  async deleteProject(id: string): Promise<void> {
    await db.projects.delete(id);
    await syncService.createSyncRecord('project', id, 'delete');
  }

  /**
   * 获取所有项目
   */
  async getAllProjects(): Promise<Project[]> {
    return db.projects.toArray();
  }

  /**
   * 创建文件记录
   */
  async createFile(
    file: Omit<FileRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FileRecord> {
    const now = Date.now();
    const id = crypto.randomUUID();

    const newFile: FileRecord = {
      id,
      name: file.name,
      path: file.path,
      content: file.content,
      size: file.size,
      type: file.type,
      createdAt: now,
      updatedAt: now,
    };

    await db.files.add(newFile);
    await syncService.createSyncRecord('file', id, 'create');

    return newFile;
  }

  /**
   * 更新文件记录
   */
  async updateFile(
    id: string,
    updates: Partial<Omit<FileRecord, 'id' | 'createdAt'>>
  ): Promise<FileRecord> {
    const existing = await db.files.get(id);
    if (!existing) {
      throw new Error(`File not found: ${id}`);
    }

    const updated: FileRecord = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await db.files.put(updated);
    await syncService.createSyncRecord('file', id, 'update');

    return updated;
  }

  /**
   * 删除文件记录
   */
  async deleteFile(id: string): Promise<void> {
    await db.files.delete(id);
    await syncService.createSyncRecord('file', id, 'delete');
  }

  /**
   * 获取所有文件
   */
  async getAllFiles(): Promise<FileRecord[]> {
    return db.files.toArray();
  }

  /**
   * 按类型获取文件
   */
  async getFilesByType(type: string): Promise<FileRecord[]> {
    return db.files.where('type').equals(type).toArray();
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    await db.notes.clear();
    await db.projects.clear();
    await db.files.clear();
    await db.syncRecords.clear();
  }

  /**
   * 导出数据
   */
  async exportData(): Promise<{
    notes: Note[];
    projects: Project[];
    files: FileRecord[];
  }> {
    const [notes, projects, files] = await Promise.all([
      db.notes.toArray(),
      db.projects.toArray(),
      db.files.toArray(),
    ]);

    return { notes, projects, files };
  }

  /**
   * 导入数据
   */
  async importData(data: {
    notes: Note[];
    projects: Project[];
    files: FileRecord[];
  }): Promise<void> {
    await db.transaction('rw', db.notes, db.projects, db.files, async () => {
      await db.notes.bulkPut(data.notes);
      await db.projects.bulkPut(data.projects);
      await db.files.bulkPut(data.files);
    });
  }
}

// 导出存储服务实例
export const storageService = new StorageService();
```

---

## ⚡ 性能优化

### 缓存策略

```typescript
// src/storage/cache.ts
/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  maxSize: 100, // 最大缓存条目数
  ttl: 300000, // 缓存有效期（5分钟）
} as const;

/**
 * 缓存条目
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * LRU 缓存类
 */
export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = CACHE_CONFIG.maxSize, ttl: number = CACHE_CONFIG.ttl) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T): void {
    // 删除过期条目
    this.cleanup();

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 获取缓存
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // 更新访问顺序（LRU）
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期条目
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

// 导出缓存实例
export const noteCache = new LRUCache<any>();
export const projectCache = new LRUCache<any>();
export const fileCache = new LRUCache<any>();
```

---

## 🧪 测试用例

### 单元测试

```typescript
// src/storage/__tests__/storage-service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storageService } from '../storage-service';
import { db } from '../db';

describe('StorageService', () => {
  beforeEach(async () => {
    await db.notes.clear();
    await db.projects.clear();
    await db.files.clear();
  });

  afterEach(async () => {
    await db.notes.clear();
    await db.projects.clear();
    await db.files.clear();
  });

  describe('Note Operations', () => {
    it('should create a note', async () => {
      const note = await storageService.createNote({
        title: 'Test Note',
        content: 'Test Content',
        tags: ['test'],
        isEncrypted: false,
        syncStatus: 'pending',
      });

      expect(note.id).toBeDefined();
      expect(note.title).toBe('Test Note');
      expect(note.content).toBe('Test Content');
      expect(note.tags).toEqual(['test']);
      expect(note.isEncrypted).toBe(false);
      expect(note.version).toBe(1);
    });

    it('should create an encrypted note', async () => {
      const note = await storageService.createNote(
        {
          title: 'Encrypted Note',
          content: 'Secret Content',
          tags: ['secret'],
          isEncrypted: false,
          syncStatus: 'pending',
        },
        'password123'
      );

      expect(note.isEncrypted).toBe(true);
      expect(note.encryptedContent).toBeDefined();
      expect(note.content).toBe('');
    });

    it('should update a note', async () => {
      const created = await storageService.createNote({
        title: 'Original Title',
        content: 'Original Content',
        tags: ['original'],
        isEncrypted: false,
        syncStatus: 'pending',
      });

      const updated = await storageService.updateNote(created.id, {
        title: 'Updated Title',
        content: 'Updated Content',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Updated Content');
      expect(updated.version).toBe(2);
    });

    it('should delete a note', async () => {
      const note = await storageService.createNote({
        title: 'To Delete',
        content: 'Content',
        tags: [],
        isEncrypted: false,
        syncStatus: 'pending',
      });

      await storageService.deleteNote(note.id);

      const retrieved = await storageService.getNote(note.id);
      expect(retrieved).toBeUndefined();
    });

    it('should search notes', async () => {
      await storageService.createNote({
        title: 'First Note',
        content: 'Content about testing',
        tags: ['test'],
        isEncrypted: false,
        syncStatus: 'pending',
      });

      await storageService.createNote({
        title: 'Second Note',
        content: 'Content about development',
        tags: ['dev'],
        isEncrypted: false,
        syncStatus: 'pending',
      });

      const results = await storageService.searchNotes('testing');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('First Note');
    });

    it('should get notes by tag', async () => {
      await storageService.createNote({
        title: 'Note 1',
        content: 'Content 1',
        tags: ['tag1', 'tag2'],
        isEncrypted: false,
        syncStatus: 'pending',
      });

      await storageService.createNote({
        title: 'Note 2',
        content: 'Content 2',
        tags: ['tag2', 'tag3'],
        isEncrypted: false,
        syncStatus: 'pending',
      });

      const results = await storageService.getNotesByTag('tag2');
      expect(results).toHaveLength(2);
    });
  });

  describe('Project Operations', () => {
    it('should create a project', async () => {
      const project = await storageService.createProject({
        name: 'Test Project',
        description: 'Test Description',
        settings: {},
      });

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Test Description');
    });

    it('should update a project', async () => {
      const created = await storageService.createProject({
        name: 'Original Name',
        description: 'Original Description',
        settings: {},
      });

      const updated = await storageService.updateProject(created.id, {
        name: 'Updated Name',
        description: 'Updated Description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated Description');
    });

    it('should delete a project', async () => {
      const project = await storageService.createProject({
        name: 'To Delete',
        description: 'Description',
        settings: {},
      });

      await storageService.deleteProject(project.id);

      const projects = await storageService.getAllProjects();
      expect(projects).toHaveLength(0);
    });
  });

  describe('File Operations', () => {
    it('should create a file record', async () => {
      const file = await storageService.createFile({
        name: 'test.txt',
        path: '/path/to/test.txt',
        content: 'File content',
        size: 12,
        type: 'text/plain',
      });

      expect(file.id).toBeDefined();
      expect(file.name).toBe('test.txt');
      expect(file.path).toBe('/path/to/test.txt');
    });

    it('should get files by type', async () => {
      await storageService.createFile({
        name: 'file1.txt',
        path: '/path/to/file1.txt',
        content: 'Content 1',
        size: 9,
        type: 'text/plain',
      });

      await storageService.createFile({
        name: 'file2.json',
        path: '/path/to/file2.json',
        content: '{"key": "value"}',
        size: 17,
        type: 'application/json',
      });

      const textFiles = await storageService.getFilesByType('text/plain');
      expect(textFiles).toHaveLength(1);
      expect(textFiles[0].name).toBe('file1.txt');
    });
  });

  describe('Export/Import', () => {
    it('should export all data', async () => {
      await storageService.createNote({
        title: 'Note 1',
        content: 'Content 1',
        tags: [],
        isEncrypted: false,
        syncStatus: 'pending',
      });

      await storageService.createProject({
        name: 'Project 1',
        description: 'Description 1',
        settings: {},
      });

      const exported = await storageService.exportData();

      expect(exported.notes).toHaveLength(1);
      expect(exported.projects).toHaveLength(1);
      expect(exported.files).toHaveLength(0);
    });

    it('should import data', async () => {
      const dataToImport = {
        notes: [
          {
            id: 'note-1',
            title: 'Imported Note',
            content: 'Imported Content',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: ['imported'],
            isEncrypted: false,
            syncStatus: 'pending',
            version: 1,
          },
        ],
        projects: [],
        files: [],
      };

      await storageService.importData(dataToImport);

      const notes = await storageService.getAllNotes();
      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('Imported Note');
    });
  });
});
```

---

## 📊 性能指标

### 性能目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 读取延迟 | < 10ms | 单条记录读取 |
| 写入延迟 | < 20ms | 单条记录写入 |
| 批量读取 | < 100ms | 100条记录 |
| 批量写入 | < 200ms | 100条记录 |
| 搜索响应 | < 50ms | 1000条记录中搜索 |
| 缓存命中率 | > 80% | LRU缓存 |
| 数据库大小 | < 500MB | 典型使用场景 |

### 优化策略

1. **索引优化**
   - 为常用查询字段创建索引
   - 使用复合索引优化多字段查询

2. **批量操作**
   - 使用 `bulkPut`、`bulkAdd` 等批量API
   - 减少事务开销

3. **缓存策略**
   - LRU缓存热点数据
   - 设置合理的TTL

4. **懒加载**
   - 大数据集分页加载
   - 按需获取详细信息

5. **事务优化**
   - 合并相关操作到单个事务
   - 避免长事务

---

## 🔍 监控与调试

### 性能监控

```typescript
// src/storage/monitor.ts
/**
 * 性能指标
 */
interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
}

/**
 * 性能监控类
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;

  /**
   * 记录性能指标
   */
  record(operation: string, duration: number): void {
    this.metrics.push({
      operation,
      duration,
      timestamp: Date.now(),
    });

    // 保持最大记录数
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * 获取平均性能
   */
  getAverage(operation: string): number {
    const filtered = this.metrics.filter(m => m.operation === operation);
    if (filtered.length === 0) return 0;

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  /**
   * 获取P95性能
   */
  getP95(operation: string): number {
    const filtered = this.metrics
      .filter(m => m.operation === operation)
      .map(m => m.duration)
      .sort((a, b) => a - b);

    if (filtered.length === 0) return 0;

    const index = Math.floor(filtered.length * 0.95);
    return filtered[index];
  }

  /**
   * 获取P99性能
   */
  getP99(operation: string): number {
    const filtered = this.metrics
      .filter(m => m.operation === operation)
      .map(m => m.duration)
      .sort((a, b) => a - b);

    if (filtered.length === 0) return 0;

    const index = Math.floor(filtered.length * 0.99);
    return filtered[index];
  }

  /**
   * 导出指标
   */
  export(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * 清空指标
   */
  clear(): void {
    this.metrics = [];
  }
}

// 导出监控实例
export const performanceMonitor = new PerformanceMonitor();
```

---

## 📝 使用示例

### 基本使用

```typescript
import { storageService } from './storage/storage-service';
import { syncService } from './storage/sync';

// 启动自动同步
syncService.startAutoSync();

// 创建笔记
const note = await storageService.createNote({
  title: '我的第一篇笔记',
  content: '这是笔记内容',
  tags: ['个人', '学习'],
  isEncrypted: false,
  syncStatus: 'pending',
});

// 创建加密笔记
const encryptedNote = await storageService.createNote(
  {
    title: '机密笔记',
    content: '这是机密内容',
    tags: ['机密'],
    isEncrypted: false,
    syncStatus: 'pending',
  },
  'my-secret-password'
);

// 更新笔记
await storageService.updateNote(note.id, {
  title: '更新后的标题',
  content: '更新后的内容',
});

// 搜索笔记
const results = await storageService.searchNotes('学习');

// 按标签获取笔记
const taggedNotes = await storageService.getNotesByTag('个人');

// 导出数据
const exported = await storageService.exportData();
console.log('导出的数据:', exported);

// 导入数据
await storageService.importData(exported);

// 停止自动同步
syncService.stopAutoSync();
```

---

## ✅ 验收标准

### 功能完整性

- ✅ 支持笔记的增删改查
- ✅ 支持笔记加密存储
- ✅ 支持项目管理
- ✅ 支持文件记录管理
- ✅ 支持数据搜索和过滤
- ✅ 支持数据导出和导入
- ✅ 支持与宿主机文件系统同步
- ✅ 支持自动同步和手动同步

### 代码质量

- ✅ 所有 TypeScript 编译错误修复
- ✅ ESLint 规则全部通过
- ✅ 无 React Console 警告
- ✅ JSDoc 文档覆盖率 >90%
- ✅ 代码规范完全统一
- ✅ 无循环依赖和死代码、硬编码

### 性能要求

- ✅ 单条记录读取延迟 < 10ms
- ✅ 单条记录写入延迟 < 20ms
- ✅ 批量读取 100 条记录 < 100ms
- ✅ 批量写入 100 条记录 < 200ms
- ✅ 搜索 1000 条记录响应 < 50ms
- ✅ 缓存命中率 > 80%

### 测试覆盖

- ✅ 单元测试覆盖率 > 80%
- ✅ 集成测试覆盖核心功能
- ✅ 性能测试验证性能指标
- ✅ 加密功能测试通过

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-14 | 初始版本，建立本地存储架构 | YanYuCloudCube Team |

---

## 📞 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: <admin@0379.email>
- **项目地址**: <https://github.com/YYC-Cube/>

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-04-08 |
| 更新日期 | 2026-04-08 |
| 内容校验 | fd281a8e73db1f79 |
| 追溯ID | TRC-20260408141609 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
