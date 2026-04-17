---
file: YYC3-前端一体化本地存储设计系统-完整提示词.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: design
language: zh-CN
---

# YYC³ 前端一体化本地存储设计系统 - 完整提示词

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


</div>

---

## Ⅰ. 需求概述与设计约束

| 需求 | 说明 |
|------|------|
| **全前端** | 完全不依赖传统后端服务，所有业务逻辑、状态、存储均在前端完成。 |
| **宿主机直接交互** | 前端运行在宿主机（桌面 OS）上，能够直接读写本地文件系统、访问硬件 API。 |
| **本地持久化** | 数据只保存在本机（IndexedDB、File System Access API、Tauri/Electron 文件系统），不走云端。 |
| **AI 能力** | 通过 OpenAI（ChatGPT、Embeddings、Fine‑tune 等）提供智能交互，统一封装为前端 SDK。 |
| **可复用、可扩展** | 采用模块化、插件化、依赖倒置的方式，能够在不同项目之间复用核心层（存储、AI、宿主桥），UI 层可随业务自由替换。 |
| **安全与隐私** | 彻底本地化、数据加密、最小化密钥暴露，符合 GDPR/CCPA 等数据合规要求。 |
| **离线优先** | 通过 Service Worker、Cache API、本地缓存实现完整离线工作流，AI 调用在网络可用时自动恢复。 |
| **跨平台** | 支持 Windows / macOS / Linux（可选移动端 PWA），统一代码基。 |
| **文档可编辑** | 支持在线编辑文档，实时保存，版本控制，冲突解决。 |
| **数据同步** | 支持与宿主机文件系统双向同步，自动检测文件变化，智能合并。 |

> **核心思路**：把「前端」提升为「完整运行时 + 本地资源桥 + AI 客户端」的组合体，即 **Front‑End‑Only Full‑Stack**（FEFS）架构。下面给出完整的分层、模块、技术选型与实现要点，帮助你快速搭建可复用的基线工程，并在此基础上灵活演进。

---

## Ⅱ. 高层体系结构（分层 + 模块）

> **ASCII 图示**（可直接复制到文档中做进一步备注）

```
+---------------------------------------------------+
|                     UI 层                         |
|  (React/Vue/Svelte + Component Library)          |
+------------------------+--------------------------+
|            状态层 / 业务层 (Hooks, Zustand, XState, TanStack Query)                |
+------------------------+--------------------------+
|                    服务层 (Service)                                      |
|   ├─ StorageService   ─► 本地持久化抽象 (IndexedDB / FileSystem)          |
|   ├─ DocumentService  ─► 文档编辑、版本控制、冲突解决                  |
|   ├─ SyncService      ─► 宿主机文件系统同步、自动检测、智能合并          |
|   ├─ AISDK            ─► OpenAI 调用 (封装、缓存、重试)                  |
|   ├─ HostBridge       ─► 本地文件系统 / 系统功能 (Tauri/Electron)      |
|   └─ WorkerService    ─► WebWorker / Offscreen Canvas (计算/加密)      |
+------------------------+--------------------------+
|                 PWA / 运行时层                                            |
|   ServiceWorker (offline cache, background sync)                         |
|   IndexedDB / Cache API / Web Crypto (本地加密)                           |
+------------------------+--------------------------+
|                宿主机原生层 (Tauri / Electron)                         |
|   Rust / Node Bridge  ─► OS 文件系统、Native Dialog、系统托盘等          |
+---------------------------------------------------+
```

### 关键抽象

| 抽象层 | 目标 | 关键实现 |
|--------|------|----------|
| **HostBridge** | 统一宿主机原生能力（文件、弹窗、系统托盘等） | Tauri（Rust → JavaScript）或 Electron（Node）封装 `host.*` API，提供 **Promise‑based**、**Type‑safe** 接口。 |
| **StorageService** | 把结构化数据、二进制文件统一管理 | IndexedDB（Dexie.js）+ File System Access API（大文件）+ 本地加密（Web Crypto）。实现 **Repository** 与 **Unit‑Of‑Work** 模式，支持迁移/版本升级。 |
| **DocumentService** | 文档编辑、版本控制、冲突解决 | 基于 Yjs 的 CRDT 冲突解决，自动保存，版本历史，实时协作。 |
| **SyncService** | 宿主机文件系统同步、自动检测、智能合并 | File System Access API + Watcher，双向同步，智能合并，冲突解决。 |
| **AISDK** | 对外统一 OpenAI 能力（Chat、Embedding、Fine‑tune） | 基于 `fetch`+`AbortController`，在 SDK 内实现 **请求排队、速率限制、指数退避、离线缓存**。提供 **Typed** Prompt/Response 模型（Zod 校验）。 |
| **WorkerService** | 计算密集、加密、文件切片等放入子线程 | WebWorker + `Comlink`（透明 RPC），或 `OffscreenCanvas`（大规模图形/渲染）。 |
| **State/Business Layer** | UI 与服务层解耦、可预取、缓存 | 推荐使用 **Zustand** (轻量) + **TanStack Query**（网络/缓存统一），或者 **XState**（状态机）+ **React‑Query**（异步缓存）。 |
| **PWA Offline** | 完全离线运行，自动同步 | Service Worker 缓存 UI 静态资源、API 结果（OpenAI 回答缓存），以及 **Background Sync**（网络恢复后推送挂起的 AI 请求）。 |

---

## Ⅲ. 技术选型指南（可根据团队熟悉度微调）

| 维度 | 推荐技术 | 说明 |
|------|----------|------|
| **框架** | React + Vite（TS）<br>或 Vue 3 + Vite <br>或 SvelteKit | Vite 速度快、原生支持 ES‑Modules，可直接输出 SPA、PWA、Electron/Tauri 包。 |
| **状态管理** | Zustand + TanStack Query <br>或 Jotai + React‑Query <br>或 XState（复杂业务） | 选型依据业务复杂度：Zustand 极简、XState 适用于工作流/状态机。 |
| **本地存储** | Dexie.js（IndexedDB ORM）<br>File System Access API（大文件）<br>Web Crypto API（AES‑GCM 本地加密） | Dexie 与 Zod 搭配做 schema & migration。 |
| **文档编辑** | Yjs（CRDT）<br>Monaco Editor（代码编辑）<br>ProseMirror（富文本编辑） | Yjs 提供实时协作和冲突解决，Monaco 用于代码编辑，ProseMirror 用于富文本。 |
| **文件同步** | File System Access API<br>Watcher（Tauri/Electron）<br>Git（版本控制） | File System Access API 提供原生文件系统访问，Watcher 监控文件变化，Git 提供版本控制。 |
| **宿主桥** | **Tauri**（Rust + lightweight）<br>（如果需要 Node生态，可选 **Electron**） | Tauri 输出体积 5–10 MB，安全性更好；提供 `tauri::api::fs`、`dialog`、`invoke` 等。 |
| **AI SDK** | 自研 `openai-client.ts`（基于 `fetch`）<br>或直接使用官方 `openai` npm 包（需在 Node 环境） | 前端版必须自行实现 OAuth/Token 管理，推荐封装成 `src/sdk/openai.ts`。 |
| **Worker** | **Comlink** + WebWorker <br>或 **Worker‑Threads**（Tauri 中的 Rust → WASM） | Comlink 让 Worker 像普通函数一样调用，代码更清晰。 |
| **构建/打包** | Vite + `@tauri-apps/cli` <br>或 `electron-builder` | Vite 负责前端资源打包，Tauri CLI 负责原生打包与签名。 |
| **CI/CD** | GitHub Actions + `tauri-action` <br> | 自动执行 lint、test、构建，并发布跨平台安装包（AppImage、DMG、MSI）。 |
| **测试** | Vitest（单元）<br>Playwright（E2E）<br>Jest + `@testing-library/react` | 在 CI 中配合 `playwright` 进行 PWA 离线、文件系统权限测试。 |
| **代码质量** | ESLint + Prettier + TypeScript strict<br>Husky + lint‑staged | 防止低质量提交。 |
| **文档** | Storybook（组件库）<br>Typedoc（API）<br>Markdown + Docusaurus | 统一 UI 与 SDK 文档，便于复用。 |

---

## Ⅳ. 核心模块实现细节

### 1. HostBridge（Tauri 示例）

```ts
// src/bridge/host.ts
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readTextFile, writeFile, BaseDirectory } from '@tauri-apps/api/fs';

/**
 * 统一的文件系统接口，内部自行决定是 IndexedDB 还是原生文件系统
 */
export const HostBridge = {
  /** 读取用户选定的文件 */
  async pickAndReadFile(): Promise<string> {
    const path = await open({ multiple: false, directory: false });
    if (!path) throw new Error('User cancelled file picking');

    // 读取内容（示例：文本文件）
    const content = await readTextFile(path as string, { directory: BaseDirectory.Desktop });
    return content;
  },

  /** 写入文件到用户指定目录 */
  async writeFile(filename: string, data: Uint8Array | string): Promise<void> {
    const savePath = await invoke('save_dialog', { defaultPath: filename });
    if (!savePath) throw new Error('User cancelled save dialog');

    await writeFile(savePath as string, data, { directory: BaseDirectory.Desktop });
  },

  /** 监控文件变化 */
  async watchFile(path: string, callback: (event: string) => void): Promise<() => void> {
    const unwatch = await invoke('watch_file', { path });
    // 在 Rust 端实现文件监控，通过事件回调通知前端
    return unwatch;
  },

  /** 打开系统通知 */
  async notify(title: string, body: string): Promise<void> {
    await invoke('notify', { title, body });
  },

  /** 调用自定义 Rust 命令（例如系统资源监控） */
  async execRustCmd<T = any>(cmd: string, args: any = {}): Promise<T> {
    return await invoke<T>(cmd, args);
  },
} as const;
```

> **要点**  
- 所有 `invoke` 调用均返回 `Promise`，便于在业务层统一 `try/catch` 处理错误。  
- `BaseDirectory.Desktop` 只做演示，实际生产请让用户自行选择路径，严格遵循最小权限原则。  
- 在 `tauri.conf.json` 中声明对应的 `allowlist`（fs、dialog、notification），确保安全。

### 2. StorageService（Dexie + 加密）

```ts
// src/storage/db.ts
import Dexie, { Table } from 'dexie';
import { z } from 'zod';
import { encrypt, decrypt } from '../crypto';

// 业务模型示例
export const NoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Note = z.infer<typeof NoteSchema>;

export class AppDB extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    super('AppDB');
    this.version(3).stores({
      notes: 'id, createdAt, updatedAt', // primary key & indexes
    });
    
    // 版本 2：对已有字段进行加密
    this.version(2).upgrade(async (tx) => {
      const old = await tx.table('notes').toArray();
      await Promise.all(
        old.map(async (rec) => {
          const encrypted = await encrypt(JSON.stringify(rec));
          await tx.table('notes').put({ ...rec, ...encrypted });
        })
      );
    });
    
    // 版本 3：添加全文搜索索引
    this.version(3).upgrade(async (tx) => {
      await tx.table('notes').modify((note) => {
        note.searchContent = note.title + ' ' + note.content;
      });
    });
  }
}
export const db = new AppDB();

// 统一的 Repository API
export const NoteRepository = {
  async add(note: Note): Promise<void> {
    const data = await encrypt(JSON.stringify(note));
    await db.notes.add({ ...note, ...data });
  },

  async get(id: string): Promise<Note | null> {
    const raw = await db.notes.get(id);
    if (!raw) return null;
    const decrypted = await decrypt(raw);
    return NoteSchema.parse(JSON.parse(decrypted));
  },

  async list(): Promise<Note[]> {
    const rawList = await db.notes.toArray();
    const decrypted = await Promise.all(
      rawList.map(async (raw) => {
        const dec = await decrypt(raw);
        return JSON.parse(dec) as Note;
      })
    );
    return decrypted.map((n) => NoteSchema.parse(n));
  },

  async update(note: Note): Promise<void> {
    const data = await encrypt(JSON.stringify(note));
    await db.notes.put({ ...note, ...data });
  },

  async delete(id: string): Promise<void> {
    await db.notes.delete(id);
  },

  // 高级功能：全文搜索
  async search(query: string): Promise<Note[]> {
    const results = await db.notes
      .where('searchContent')
      .startsWithIgnoreCase(query)
      .toArray();
    
    const decrypted = await Promise.all(
      results.map(async (raw) => {
        const dec = await decrypt(raw);
        return JSON.parse(dec) as Note;
      })
    );
    return decrypted.map((n) => NoteSchema.parse(n));
  },

  // 高级功能：批量操作
  async bulkAdd(notes: Note[]): Promise<void> {
    const encrypted = await Promise.all(
      notes.map(async (note) => {
        const data = await encrypt(JSON.stringify(note));
        return { ...note, ...data };
      })
    );
    await db.notes.bulkAdd(encrypted);
  },

  // 高级功能：事务处理
  async transaction<T>(callback: (tx: Dexie.Transaction) => Promise<T>): Promise<T> {
    return await db.transaction('rw', db.notes, callback);
  },
};
```

> **加密细节**（`src/crypto.ts`）

```ts
// 使用 Web Crypto AES‑GCM，密钥本地保存在 IndexedDB（使用 PBKDF2 从用户密码派生）
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 200_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** 加密一个任意对象 */
export async function encrypt(plainText: string): Promise<{ iv: Uint8Array; data: Uint8Array }> {
  const password = await getUserPassword(); // 从安全 UI / OS Keyring 获取
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );
  return { iv, data: new Uint8Array(ciphertext) };
}

/** 解密 */
export async function decrypt(encrypted: {
  iv: Uint8Array;
  data: Uint8Array;
}): Promise<string> {
  const password = await getUserPassword();
  const salt = encrypted.iv.slice(0, 16); // 假设 salt 前 16 位存放在 iv 中
  const key = await deriveKey(password, salt);
  const dec = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: encrypted.iv },
    key,
    encrypted.data
  );
  return new TextDecoder().decode(dec);
}
```

> **安全建议**  
- **密码**必须通过 UI 交互一次性输入（并可选保存到 OS 密钥链）。  
- **密钥和 salt**不应硬编码，使用 `crypto.getRandomValues` 动态生成。  
- **加密后**再写入 `IndexedDB`，确保磁盘上只存 AES‑GCM 密文。  

### 3. DocumentService（文档编辑 + 版本控制）

```ts
// src/services/document.ts
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import Monaco from 'monaco-editor';

export class DocumentService {
  private doc: Y.Doc;
  private provider: WebsocketProvider | null;
  private editor: Monaco.editor.IStandaloneCodeEditor;
  private persistence: IndexeddbPersistence;

  constructor(documentId: string) {
    // 创建 Yjs 文档
    this.doc = new Y.Doc();
    
    // 创建持久化层
    this.persistence = new IndexeddbPersistence(documentId, this.doc);
    
    // 初始化编辑器
    this.editor = monaco.editor.create(document.getElementById('editor')!, {
      value: '',
      language: 'typescript',
      theme: 'vs-dark',
      automaticLayout: true,
    });

    // 绑定 Yjs 到编辑器
    const yText = this.doc.getText('monaco');
    this.bindEditorToYjs(yText);
  }

  /** 绑定编辑器到 Yjs */
  private bindEditorToYjs(yText: Y.Text) {
    this.editor.onDidChangeModelContent((e) => {
      yText.applyDelta(e.changes);
    });

    yText.observe((event) => {
      this.editor.executeEdits('undo', [
        {
          range: this.editor.getSelection()!,
          text: event.changes.map(c => c.insert).join(''),
        },
      ]);
    });
  }

  /** 启用实时协作 */
  async enableCollaboration(websocketUrl: string, roomName: string) {
    this.provider = new WebsocketProvider(
      websocketUrl,
      this.doc,
      roomName
    );

    this.provider.on('status', (event: any) => {
      console.log('Connection status:', event.status);
    });

    this.provider.on('sync', (synced: boolean) => {
      console.log('Document synced:', synced);
    });
  }

  /** 禁用实时协作 */
  disableCollaboration() {
    if (this.provider) {
      this.provider.disconnect();
      this.provider = null;
    }
  }

  /** 保存文档到本地 */
  async saveToLocal(): Promise<void> {
    await this.persistence.flush();
  }

  /** 获取文档内容 */
  getContent(): string {
    const yText = this.doc.getText('monaco');
    return yText.toString();
  }

  /** 设置文档内容 */
  setContent(content: string): void {
    const yText = this.doc.getText('monaco');
    yText.delete(0, yText.length);
    yText.insert(0, content);
  }

  /** 获取版本历史 */
  async getVersionHistory(): Promise<any[]> {
    // 从 IndexedDB 获取版本历史
    return await this.persistence.getVersions();
  }

  /** 恢复到指定版本 */
  async restoreToVersion(versionId: string): Promise<void> {
    await this.persistence.restoreVersion(versionId);
  }

  /** 销毁服务 */
  destroy() {
    this.disableCollaboration();
    this.editor.dispose();
    this.doc.destroy();
  }
}
```

### 4. SyncService（文件系统同步）

```ts
// src/services/sync.ts
import { HostBridge } from '../bridge/host';

export interface SyncConfig {
  localPath: string;
  remotePath: string;
  syncInterval: number; // 毫秒
}

export class SyncService {
  private config: SyncConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor(config: SyncConfig) {
    this.config = config;
  }

  /** 启动同步 */
  async start(): Promise<void> {
    // 立即执行一次同步
    await this.sync();
    
    // 设置定时同步
    this.syncTimer = setInterval(() => {
      this.sync();
    }, this.config.syncInterval);
  }

  /** 停止同步 */
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /** 执行同步 */
  private async sync(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.isSyncing = true;
    try {
      // 1. 检测本地文件变化
      const localChanges = await this.detectLocalChanges();
      
      // 2. 检测远程文件变化
      const remoteChanges = await this.detectRemoteChanges();
      
      // 3. 智能合并
      const mergedChanges = await this.mergeChanges(localChanges, remoteChanges);
      
      // 4. 应用合并结果
      await this.applyChanges(mergedChanges);
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      // 可以添加重试逻辑
    } finally {
      this.isSyncing = false;
    }
  }

  /** 检测本地文件变化 */
  private async detectLocalChanges(): Promise<FileChange[]> {
    const changes: FileChange[] = [];
    
    // 使用 File System Access API 监控文件
    const unwatch = await HostBridge.watchFile(this.config.localPath, (event) => {
      changes.push({
        path: event.path,
        type: event.type, // 'created', 'modified', 'deleted'
        timestamp: Date.now(),
      });
    });
    
    return changes;
  }

  /** 检测远程文件变化 */
  private async detectRemoteChanges(): Promise<FileChange[]> {
    // 这里可以连接到远程存储（如 Dropbox、Google Drive）
    // 暂时返回空数组
    return [];
  }

  /** 智能合并变化 */
  private async mergeChanges(
    localChanges: FileChange[],
    remoteChanges: FileChange[]
  ): Promise<MergedChange[]> {
    const merged: MergedChange[] = [];
    
    // 简单的合并策略：本地优先
    const allChanges = [...localChanges, ...remoteChanges];
    
    // 按文件路径分组
    const grouped = new Map<string, FileChange[]>();
    allChanges.forEach(change => {
      const existing = grouped.get(change.path) || [];
      grouped.set(change.path, [...existing, change]);
    });
    
    // 处理每个文件的冲突
    grouped.forEach((changes, path) => {
      if (changes.length === 1) {
        // 没有冲突，直接应用
        merged.push({
          path,
          change: changes[0],
          conflict: false,
        });
      } else {
        // 有冲突，需要解决
        const resolved = await this.resolveConflict(path, changes);
        merged.push({
          path,
          change: resolved,
          conflict: true,
        });
      }
    });
    
    return merged;
  }

  /** 解决冲突 */
  private async resolveConflict(
    path: string,
    changes: FileChange[]
  ): Promise<FileChange> {
    // 这里可以实现各种冲突解决策略
    // 1. 时间戳优先
    // 2. 用户手动选择
    // 3. 智能合并（如代码文件）
    
    // 简单实现：选择最新的
    const sorted = changes.sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0];
  }

  /** 应用变化 */
  private async applyChanges(changes: MergedChange[]): Promise<void> {
    for (const change of changes) {
      if (change.change.type === 'deleted') {
        await HostBridge.deleteFile(change.path);
      } else {
        await HostBridge.writeFile(
          change.path,
          change.change.content || ''
        );
      }
    }
  }

  /** 手动触发同步 */
  async triggerSync(): Promise<void> {
    await this.sync();
  }
}
```

### 5. AISDK（OpenAI + 本地缓存）

```ts
// src/sdk/openai.ts
import type { ChatCompletionCreateParams, CreateChatCompletionResponse } from 'openai/resources';
import { z } from 'zod';
import { db } from '../storage/db'; // 复用 Dexie
import { supabaseCache } from '../cache'; // 可选：Cache API

// 对外 API 参数校验
const ChatReqSchema = z.object({
  model: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
});
type ChatRequest = z.infer<typeof ChatReqSchema>;

export class OpenAIClient {
  private apiKey: string;
  private endpoint = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('OpenAI API key required');
    this.apiKey = apiKey;
  }

  /** 通用 fetch 包装，实现速率限制、自动重试、离线缓存 */
  private async fetchWithRetry<T>(input: RequestInfo, init?: RequestInit, retries = 3): Promise<T> {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 15000); // 15s 超时
    try {
      const resp = await fetch(input, { ...init, signal: ctrl.signal });
      if (!resp.ok) {
        if (retries > 0 && (resp.status === 429 || resp.status >= 500)) {
          // 指数退避
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, 3 - retries)));
          return this.fetchWithRetry<T>(input, init, retries - 1);
        }
        const txt = await resp.text();
        throw new Error(`OpenAI error ${resp.status}: ${txt}`);
      }
      return (await resp.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Chat 接口，内部自动缓存 */
  async chat(req: ChatRequest): Promise<CreateChatCompletionResponse> {
    // 参数校验
    const safeReq = ChatReqSchema.parse(req);

    // 检查离线缓存（Cache API or IndexedDB）
    const cacheKey = `openai:chat:${JSON.stringify(safeReq)}`;
    const cached = await supabaseCache.get<CreateChatCompletionResponse>(cacheKey);
    if (cached) return cached;

    const body = JSON.stringify(safeReq);
    const response = await this.fetchWithRetry<CreateChatCompletionResponse>(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    // 成功后写入缓存（24h）
    await supabaseCache.set(cacheKey, response, { ttl: 86_400_000 });
    return response;
  }

  /** Embedding 接口（示例） */
  async embed(inputs: string[], model = 'text-embedding-ada-002'): Promise<number[][]> {
    const payload = {
      model,
      input: inputs,
    };
    const result = await this.fetchWithRetry<any>(this.endpoint.replace('chat/completions', 'embeddings'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return result.data.map((d: any) => d.embedding);
  }
}

// 单例包装（在业务层注入）
export const openAIClient = new OpenAIClient(import.meta.env.VITE_OPENAI_API_KEY);
```

> **缓存实现（Cache API+IndexedDB）**  
```ts
// src/cache.ts
import { openDB } from 'idb';

const DB_NAME = 'CacheDB';
const STORE = 'entries';
type CacheEntry<T> = { value: T; expires: number };

export const supabaseCache = {
  async init() {
    await openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE);
      },
    });
  },

  async get<T>(key: string): Promise<T | null> {
    const db = await openDB(DB_NAME, 1);
    const entry = (await db.get(STORE, key)) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expires < Date.now()) {
      await db.delete(STORE, key);
      return null;
    }
    return entry.value;
  },

  async set<T>(key: string, value: T, opts: { ttl: number }) {
    const db = await openDB(DB_NAME, 1);
    const entry: CacheEntry<T> = { value, expires: Date.now() + opts.ttl };
    await db.put(STORE, entry, key);
  },

  async del(key: string) {
    const db = await openDB(DB_NAME, 1);
    await db.delete(STORE, key);
  },

  async clear() {
    const db = await openDB(DB_NAME, 1);
    await db.clear(STORE);
  },
};
```

> **离线处理**：若网络不可用，`fetchWithRetry` 抛错后，业务层（使用 TanStack Query）自动进入 **offline** 状态，并将请求写入 `Background Sync` 队列，等网络恢复后通过 Service Worker 调用 `openAIClient.chat` 重新发送。

### 6. WorkerService（WebWorker + Comlink）

```ts
// src/workers/crypto.worker.ts
import { expose } from 'comlink';

const cryptoOps = {
  async hashSHA256(raw: string): Promise<string> {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(raw));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  },

  async encryptLargeFile(fileHandle: FileSystemFileHandle, password: string) {
    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    // 使用前面 deriveKey、encrypt 等实现（略）
    const { iv, data } = await encrypt(arrayBuffer, password);
    // 跨线程返回 Blob
    return new Blob([iv, data], { type: 'application/octet-stream' });
  },
};

expose(cryptoOps);
```

在主线程：

```ts
import { wrap } from 'comlink';
import CryptoWorker from './workers/crypto.worker?worker';

const cryptoWorker = wrap(new CryptoWorker());

async function hashFile(fileHandle: FileSystemFileHandle, pwd: string) {
  const encryptedBlob = await cryptoWorker.encryptLargeFile(fileHandle, pwd);
  // 保存或进一步处理
}
```

> **特性**  
- **CPU 密集**（哈希、AES）放在 Worker，避免 UI 卡顿。  
- 使用 `?worker` （Vite 插件）自动生成 `Worker` 实例。  
- 通过 **Comlink** 自动序列化 `Blob`、`ArrayBuffer`，简化 API。

### 7. UI 与状态层（React + Zustand Example）

```tsx
// src/store/useNoteStore.ts
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { NoteRepository, Note } from '../storage/db';
import { produce } from 'immer';

type State = {
  notes: Record<string, Note>;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
};

export const useNoteStore = create<State>()(
  devtools(
    persist(
      (set, get) => ({
        notes: {},
        loading: false,
        error: null,

        async fetchAll() {
          set({ loading: true, error: null });
          try {
            const list = await NoteRepository.list();
            set({
              notes: list.reduce((acc, n) => ({ ...acc, [n.id]: n }), {}),
            });
          } catch (e) {
            set({ error: (e as Error).message });
          } finally {
            set({ loading: false });
          }
        },

        async addNote(data) {
          const now = new Date().toISOString();
          const newNote: Note = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          };
          await NoteRepository.add(newNote);
          set(
            produce((state) => {
              state.notes[newNote.id] = newNote;
            })
          );
        },

        async updateNote(note) {
          const updated = { ...note, updatedAt: new Date().toISOString() };
          await NoteRepository.update(updated);
          set(
            produce((state) => {
              state.notes[updated.id] = updated;
            })
          );
        },

        async deleteNote(id) {
          await NoteRepository.delete(id);
          set(
            produce((state) => {
              delete state.notes[id];
            })
          );
        },

        async searchNotes(query) {
          set({ loading: true, error: null });
          try {
            const results = await NoteRepository.search(query);
            set({
              notes: results.reduce((acc, n) => ({ ...acc, [n.id]: n }), {}),
            });
          } catch (e) {
            set({ error: (e as Error).message });
          } finally {
            set({ loading: false });
          }
        },
      }),
      {
        name: 'note-storage',
      }
    )
  )
);
```

---

## Ⅴ. 高级数据库功能

### 1. 索引优化

```ts
// 在 Dexie schema 中定义复合索引
export class AppDB extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    super('AppDB');
    this.version(4).stores({
      // 复合索引：支持按创建时间和标题联合查询
      notes: 'id, [createdAt+updatedAt], title, searchContent, [type+status]',
    });
  }
}

// 使用复合索引查询
export const NoteRepository = {
  // 查询特定时间范围内的笔记
  async findByDateRange(start: Date, end: Date): Promise<Note[]> {
    const results = await db.notes
      .where('[createdAt+updatedAt]')
      .between([start.toISOString(), ''], [end.toISOString(), '\uffff'])
      .toArray();
    
    return await Promise.all(
      results.map(async (raw) => {
        const dec = await decrypt(raw);
        return JSON.parse(dec) as Note;
      })
    );
  },

  // 查询特定类型和状态的笔记
  async findByTypeAndStatus(type: string, status: string): Promise<Note[]> {
    const results = await db.notes
      .where('[type+status]')
      .equals([type, status])
      .toArray();
    
    return await Promise.all(
      results.map(async (raw) => {
        const dec = await decrypt(raw);
        return JSON.parse(dec) as Note;
      })
    );
  },
};
```

### 2. 查询优化

```ts
// 使用 Dexie 的 where 子句进行高效查询
export const NoteRepository = {
  // 分页查询
  async paginate(page: number, pageSize: number): Promise<{ notes: Note[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const results = await db.notes
      .offset(offset)
      .limit(pageSize)
      .reverse() // 按创建时间倒序
      .toArray();
    
    const total = await db.notes.count();
    
    const decrypted = await Promise.all(
      results.map(async (raw) => {
        const dec = await decrypt(raw);
        return JSON.parse(dec) as Note;
      })
    );
    
    return {
      notes: decrypted,
      total,
    };
  },

  // 批量查询
  async findByIds(ids: string[]): Promise<Note[]> {
    const results = await db.notes.where('id').anyOf(ids).toArray();
    
    return await Promise.all(
      results.map(async (raw) => {
        const dec = await decrypt(raw);
        return JSON.parse(dec) as Note;
      })
    );
  },

  // 聚合查询
  async getStats(): Promise<{ total: number; byType: Record<string, number> }> {
    const allNotes = await db.notes.toArray();
    
    const stats = {
      total: allNotes.length,
      byType: {} as Record<string, number>,
    };
    
    allNotes.forEach((note) => {
      const type = note.type || 'default';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });
    
    return stats;
  },
};
```

### 3. 事务处理

```ts
// 使用 Dexie 的事务功能
export const NoteRepository = {
  // 原子操作：移动笔记到文件夹
  async moveToFolder(noteIds: string[], folderId: string): Promise<void> {
    await db.transaction('rw', db.notes, async (tx) => {
      await Promise.all(
        noteIds.map(async (id) => {
          const note = await tx.table('notes').get(id);
          if (note) {
            await tx.table('notes').put({ ...note, folderId });
          }
        })
      );
    });
  },

  // 复杂操作：批量更新并记录日志
  async bulkUpdateWithLog(updates: Array<{ id: string; data: Partial<Note> }>): Promise<void> {
    await db.transaction('rw', db.notes, db.logs, async (tx) => {
      // 更新笔记
      await Promise.all(
        updates.map(async ({ id, data }) => {
          const note = await tx.table('notes').get(id);
          if (note) {
            await tx.table('notes').put({ ...note, ...data });
            
            // 记录操作日志
            await tx.table('logs').add({
              id: crypto.randomUUID(),
              action: 'update',
              noteId: id,
              timestamp: new Date().toISOString(),
              changes: data,
            });
          }
        })
      );
    });
  },

  // 原子操作：删除关联数据
  async deleteWithRelations(noteId: string): Promise<void> {
    await db.transaction('rw', db.notes, db.attachments, db.comments, async (tx) => {
      // 删除笔记
      await tx.table('notes').delete(noteId);
      
      // 删除关联的附件
      await tx.table('attachments')
        .where('noteId')
        .equals(noteId)
        .delete();
      
      // 删除关联的评论
      await tx.table('comments')
        .where('noteId')
        .equals(noteId)
        .delete();
    });
  },
};
```

### 4. 数据迁移

```ts
// 在 Dexie schema 中定义版本迁移
export class AppDB extends Dexie {
  notes!: Table<Note, string>;
  attachments!: Table<Attachment, string>;

  constructor() {
    super('AppDB');
    this.version(5).stores({
      notes: 'id, createdAt, updatedAt, folderId',
      attachments: 'id, noteId, createdAt',
    }).upgrade(async (tx) => {
      // 版本 1 → 2：添加加密字段
      tx.version(2).stores({
        notes: 'id, createdAt, updatedAt',
      }).upgrade(async (tx) => {
        const oldNotes = await tx.table('notes').toArray();
        await Promise.all(
          oldNotes.map(async (note) => {
            const encrypted = await encrypt(JSON.stringify(note));
            await tx.table('notes').put({ ...note, ...encrypted });
          })
        );
      });
      
      // 版本 2 → 3：添加全文搜索索引
      tx.version(3).stores({
        notes: 'id, createdAt, updatedAt, searchContent',
      }).upgrade(async (tx) => {
        await tx.table('notes').modify((note) => {
          note.searchContent = note.title + ' ' + note.content;
        });
      });
      
      // 版本 3 → 4：添加文件夹支持
      tx.version(4).stores({
        notes: 'id, createdAt, updatedAt, folderId',
      }).upgrade(async (tx) => {
        // 将所有笔记移动到默认文件夹
        await tx.table('notes').modify((note) => {
          note.folderId = note.folderId || 'default';
        });
      });
      
      // 版本 4 → 5：添加附件表
      tx.version(5).stores({
        notes: 'id, createdAt, updatedAt, folderId',
        attachments: 'id, noteId, createdAt',
      }).upgrade(async (tx) => {
        // 创建附件表
        await tx.table('attachments').clear();
      });
    });
  }
}
```

### 5. 备份与恢复

```ts
// 导出数据
export const BackupService = {
  async exportData(): Promise<Blob> {
    // 导出所有笔记
    const notes = await NoteRepository.list();
    
    // 导出所有附件
    const attachments = await AttachmentRepository.list();
    
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes,
      attachments,
    };
    
    // 创建 JSON 文件
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    
    return blob;
  },

  async importData(file: File): Promise<void> {
    const content = await file.text();
    const backupData = JSON.parse(content);
    
    // 验证数据格式
    if (!backupData.version || !backupData.notes) {
      throw new Error('Invalid backup file format');
    }
    
    // 使用事务导入数据
    await db.transaction('rw', db.notes, db.attachments, async (tx) => {
      // 清空现有数据
      await tx.table('notes').clear();
      await tx.table('attachments').clear();
      
      // 导入笔记
      await tx.table('notes').bulkAdd(backupData.notes);
      
      // 导入附件
      if (backupData.attachments) {
        await tx.table('attachments').bulkAdd(backupData.attachments);
      }
    });
  },

  async createIncrementalBackup(): Promise<void> {
    // 创建增量备份（只备份最近修改的数据）
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // 最近24小时
    
    const recentNotes = await db.notes
      .where('updatedAt')
      .above(since.toISOString())
      .toArray();
    
    const backupData = {
      version: '1.0',
      type: 'incremental',
      since: since.toISOString(),
      notes: recentNotes,
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    
    // 保存到文件系统
    await HostBridge.writeFile(
      `backup-${Date.now()}.json`,
      await blob.arrayBuffer()
    );
  },
};
```

### 6. 性能监控

```ts
// 监控数据库性能
export const DBMonitor = {
  private queries: Map<string, { count: number; totalTime: number }> = new Map();

  async trackQuery<T>(name: string, query: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await query();
    const end = performance.now();
    const duration = end - start;
    
    const stats = this.queries.get(name) || { count: 0, totalTime: 0 };
    stats.count++;
    stats.totalTime += duration;
    this.queries.set(name, stats);
    
    // 记录慢查询
    if (duration > 100) {
      console.warn(`Slow query detected: ${name} took ${duration}ms`);
    }
    
    return result;
  },

  getStats(): Record<string, { count: number; avgTime: number }> {
    const stats: Record<string, { count: number; avgTime: number }> = {};
    
    this.queries.forEach((data, name) => {
      stats[name] = {
        count: data.count,
        avgTime: data.totalTime / data.count,
      };
    });
    
    return stats;
  },

  clearStats(): void {
    this.queries.clear();
  },
};

// 使用示例
export const NoteRepository = {
  async get(id: string): Promise<Note | null> {
    return await DBMonitor.trackQuery('NoteRepository.get', async () => {
      const raw = await db.notes.get(id);
      if (!raw) return null;
      const decrypted = await decrypt(raw);
      return NoteSchema.parse(JSON.parse(decrypted));
    });
  },
};
```

---

## Ⅵ. 可编辑文档功能

### 1. 文档编辑器集成

```tsx
// src/components/DocumentEditor.tsx
import React, { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Monaco from 'monaco-editor';

interface DocumentEditorProps {
  documentId: string;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

export function DocumentEditor({ documentId, content, onChange, onSave }: DocumentEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    // 初始化 Yjs 文档
    const yDoc = new Y.Doc();
    yDocRef.current = yDoc;
    
    // 创建 Yjs 文本
    const yText = yDoc.getText('monaco');
    
    // 初始化 Monaco Editor
    const editor = monaco.editor.create(document.getElementById('editor')!, {
      value: content,
      language: 'typescript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
    });
    
    editorRef.current = editor;
    
    // 绑定 Yjs 到编辑器
    editor.onDidChangeModelContent((e) => {
      yText.applyDelta(e.changes);
      onChange(editor.getValue());
    });
    
    yText.observe((event) => {
      editor.executeEdits('undo', [
        {
          range: editor.getSelection()!,
          text: event.changes.map(c => c.insert).join(''),
        },
      ]);
    });
    
    // 启用实时协作
    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      yDoc,
      documentId
    );
    providerRef.current = provider;
    
    return () => {
      // 清理
      provider.disconnect();
      editor.dispose();
      yDoc.destroy();
    };
  }, [documentId]);

  const handleSave = async () => {
    if (editorRef.current) {
      const content = editorRef.current.getValue();
      await DocumentService.saveToLocal();
      onSave();
    }
  };

  return (
    <div className="document-editor">
      <div id="editor" style={{ height: '100%', width: '100%' }} />
      <div className="editor-toolbar">
        <button onClick={handleSave}>保存</button>
        <button onClick={() => editorRef.current?.trigger('source.action.formatDocument')}>
          格式化
        </button>
      </div>
    </div>
  );
}
```

### 2. 版本历史查看器

```tsx
// src/components/VersionHistory.tsx
import React, { useState, useEffect } from 'react';
import { DocumentService } from '../services/document';

interface Version {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

export function VersionHistory({ documentId }: { documentId: string }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [diff, setDiff] = useState<string>('');

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    const history = await DocumentService.getVersionHistory();
    setVersions(history);
  };

  const handleVersionSelect = async (version: Version) => {
    setSelectedVersion(version);
    
    // 计算差异
    const currentContent = DocumentService.getContent();
    const diff = calculateDiff(currentContent, version.content);
    setDiff(diff);
  };

  const handleRestore = async () => {
    if (selectedVersion) {
      await DocumentService.restoreToVersion(selectedVersion.id);
      await loadVersions();
      setSelectedVersion(null);
      setDiff('');
    }
  };

  return (
    <div className="version-history">
      <h3>版本历史</h3>
      <div className="version-list">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`version-item ${selectedVersion?.id === version.id ? 'selected' : ''}`}
            onClick={() => handleVersionSelect(version)}
          >
            <div className="version-info">
              <span className="version-author">{version.author}</span>
              <span className="version-time">
                {new Date(version.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {selectedVersion && (
        <div className="version-diff">
          <h4>版本差异</h4>
          <pre className="diff-content">{diff}</pre>
          <button onClick={handleRestore}>恢复到此版本</button>
        </div>
      )}
    </div>
  );
}

// 简单的差异计算
function calculateDiff(oldContent: string, newContent: string): string {
  // 这里可以使用 diff 库如 'diff' 或 'jsdiff'
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  let diff = '';
  const maxLines = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';
    
    if (oldLine === newLine) {
      diff += `  ${oldLine}\n`;
    } else {
      if (oldLine) {
        diff += `- ${oldLine}\n`;
      }
      if (newLine) {
        diff += `+ ${newLine}\n`;
      }
    }
  }
  
  return diff;
}
```

### 3. 冲突解决界面

```tsx
// src/components/ConflictResolver.tsx
import React, { useState } from 'react';

interface Conflict {
  path: string;
  localChange: FileChange;
  remoteChange: FileChange;
}

interface ConflictResolverProps {
  conflicts: Conflict[];
  onResolve: (resolutions: Map<string, 'local' | 'remote' | 'merge'>) => void;
}

export function ConflictResolver({ conflicts, onResolve }: ConflictResolverProps) {
  const [resolutions, setResolutions] = useState<Map<string, 'local' | 'remote' | 'merge'>>(new Map());

  const handleResolve = (path: string, resolution: 'local' | 'remote' | 'merge') => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(path, resolution);
    setResolutions(newResolutions);
  };

  const handleSubmit = () => {
    onResolve(resolutions);
  };

  return (
    <div className="conflict-resolver">
      <h3>解决冲突</h3>
      <div className="conflict-list">
        {conflicts.map((conflict) => (
          <div key={conflict.path} className="conflict-item">
            <div className="conflict-path">{conflict.path}</div>
            
            <div className="conflict-versions">
              <div className="version local">
                <h4>本地版本</h4>
                <pre>{conflict.localChange.content}</pre>
                <button
                  className={resolutions.get(conflict.path) === 'local' ? 'active' : ''}
                  onClick={() => handleResolve(conflict.path, 'local')}
                >
                  使用本地
                </button>
              </div>
              
              <div className="version remote">
                <h4>远程版本</h4>
                <pre>{conflict.remoteChange.content}</pre>
                <button
                  className={resolutions.get(conflict.path) === 'remote' ? 'active' : ''}
                  onClick={() => handleResolve(conflict.path, 'remote')}
                >
                  使用远程
                </button>
              </div>
            </div>
            
            <button
              className={resolutions.get(conflict.path) === 'merge' ? 'active' : ''}
              onClick={() => handleResolve(conflict.path, 'merge')}
            >
              手动合并
            </button>
          </div>
        ))}
      </div>
      
      <div className="resolver-actions">
        <button onClick={handleSubmit}>应用解决方案</button>
        <button onClick={() => setResolutions(new Map())}>重置</button>
      </div>
    </div>
  );
}
```

---

## Ⅶ. 实施路线图

| 阶段 | 目标 | 关键里程碑 |
|------|------|-----------|
| **0️⃣ 前期准备** | 选型、目录结构、CI 基础 | 初始化 Monorepo、pnpm workspace、GitHub Actions、Storybook 基础 |
| **1️⃣ 基础平台** | 完成 Tauri + Vite 项目框架 | `tauri init` → `vite build` → `tauri dev` 正常启动 |
| **2️⃣ 本地存储 & 加密** | 实现 Dexie + Web Crypto + File System Access | 完成 `storage/db.ts`、`crypto.ts`、`HostBridge.pickAndReadFile` 示例 |
| **3️⃣ AI SDK** | 封装 OpenAI 调用、缓存、离线回退 | `openai.ts`、`supabaseCache.ts`、Service Worker `openai-api` 路由 |
| **4️⃣ 状态管理 & UI** | 搭建 UI 框架、零依赖的业务状态 | `useNoteStore`、基本 CRUD 页面、Storybook 组件库 |
| **5️⃣ 文档编辑** | 实现文档编辑器、版本控制、冲突解决 | `DocumentService`、`VersionHistory`、`ConflictResolver` 组件 |
| **6️⃣ 文件同步** | 实现文件系统同步、自动检测、智能合并 | `SyncService`、`HostBridge.watchFile`、冲突解决逻辑 |
| **7️⃣ 高级数据库** | 实现索引优化、查询优化、事务处理、备份恢复 | 复合索引、分页查询、事务操作、数据迁移、备份恢复 |
| **8️⃣ 背景任务** | WebWorker、Background Sync、离线写入 | `workers/crypto.worker.ts`、`sw.ts`、`registerSync` |
| **9️⃣ 安全 & 隐私** | Keyring + 最小权限、加密审计 | 集成 `keytar`（Tauri）或 `@electron/remote`（Electron）用于安全存储 API Key |
| **🔟 打包 & 发布** | 多平台安装包、自动发布 | `tauri build` → GitHub Release，CI 完成自动化 |
| **1️⃣1️⃣ 扩展插件** | 插件系统、外部 LLM、云同步 | 设计 `plugins` 目录、示例 `local-llm`、`dropbox-sync` |
| **1️⃣2️⃣ 生产监控** | 错误上报、性能监控 | 集成 Sentry（前端）+ `tauri-plugin-log`，发布 DoS 防护措施 |

每个阶段完成后，建议跑一次 **完整回归测试**（Playwright）确保离线/在线、不同平台都能顺畅运行。

---

## Ⅷ. 常见问题 & 风险预估

| 问题 | 解决思路 |
|------|----------|
| **1. OpenAI API Key 泄露** | • **构建时注入**（`.env` → Vite replace）<br>• 生产环境不在源码中硬编码<br>• 支持用户自带 Key（存入 OS Keyring）<br>• 在 UI 中不打印、不要在 URL 参数里传递 |
| **2. 大文件读写卡顿** | • 把文件读取、分块、加密放到 WebWorker<br>• 使用 **Stream API**（`ReadableStream`）分块处理<br>• 通过 `requestIdleCallback` 异步写回 |
| **3. 数据迁移失败** | • 在 `Dexie` `upgrade` 中加入 **持久化日志**（写入专用日志表），若异常回滚<br>• 为文件系统迁移提供 **回滚脚本** |
| **4. 跨平台权限弹窗不统一** | • 把所有文件交互封装为统一 `HostBridge`，在 Tauri 的 Rust 端统一处理权限请求，前端只调用统一 API |
| **5. Service Worker 在本地文件系统（file://）不生效** | • 必须使用 **HTTPS** 或 **Tauri 内部协议**（`tauri://`）来注册 SW。Tauri 已内置 PWA 支持，确保 `tauri.conf.json` 中 `webview` 允许 Service Worker。 |
| **6. 体积膨胀** | • 只引入所需的 UI 组件库（Tree‑shaking）<br>• 使用 `esbuild` / `vite` 的 `@vitejs/plugin-legacy` 控制兼容性<br>• 移除不必要的语言/图标、压缩图片（`imagemin`） |
| **7. 兼容性（Safari、Edge）** | • File System Access API 在 Safari 仍是实验特性，提供 **fallback**（使用 `input[type=file]` + `Blob`）<br>• 对不支持 Service Worker 的老浏览器，提供 **完整 SPA fallback**（无离线） |
| **8. 用户在离线状态下频繁调用 AI** | • 在 SDK 中检测 `navigator.onLine`，若离线直接返回缓存或错误包装（`{offline:true}`），并加入 **请求队列**（Background Sync）|
| **9. 安全审计不通过** | • 通过 **Snyk**、`npm audit` 定期检查依赖<br>• 对所有外部 HTTP 请求强制使用 `Content‑Security‑Policy`（`script-src 'self'`）|
| **10. 多用户共享同一机器数据冲突** | • 引入 **工作区**（workspace）概念，每个工作区独立目录+DB，UI 提供切换与删除操作，避免数据交叉 |
| **11. 文档编辑器性能问题** | • 使用虚拟滚动（Virtual Scrolling）处理大文档<br>• 实现增量渲染，只渲染可见区域<br>• 使用 Web Worker 进行语法高亮和格式化 |
| **12. 版本冲突解决复杂** | • 提供可视化差异对比工具<br>• 支持逐行合并<br>• 提供冲突预览和回滚功能 |
| **13. 文件同步冲突频繁** | • 实现智能合并策略<br>• 提供冲突解决界面<br>• 支持手动选择保留版本 |
| **14. 数据库查询性能下降** | • 使用复合索引优化查询<br>• 实现查询结果缓存<br>• 使用分页减少单次查询数据量 |
| **15. 备份恢复失败** | • 实现备份文件校验<br>• 提供部分恢复功能<br>• 支持增量备份 |

---

## Ⅸ. 小结

- **前端一体化全栈**（FEFS）并非"没有后端"，而是把原本后端的 **存储、业务、AI 调用、文件操作、文档编辑** 统一搬到 **前端运行时 + 原生宿主桥**。  
- 通过 **Tauri (或 Electron)** 建立 *安全、轻量* 的宿主层；使用 **IndexedDB + File System Access API + Web Crypto** 完成本地安全持久化；利用 **OpenAI SDK**（自研包装）提供 AI 能力，配合 **Service Worker + Background Sync** 实现离线写入与自动恢复。  
- **文档编辑功能**：基于 Yjs 的 CRDT 冲突解决，Monaco Editor 代码编辑，版本历史查看，冲突解决界面，实时协作支持。  
- **文件同步功能**：File System Access API + Watcher，双向同步，智能合并，冲突解决。  
- **高级数据库功能**：复合索引优化查询，分页查询减少数据量，事务处理保证数据一致性，数据迁移支持版本升级，备份恢复保障数据安全，性能监控优化查询效率。  
- **模块化**（core、ui、shared）+ **插件化**（AIProvider、SyncProvider、DocumentProvider）保证 **可复用** 与 **可扩展**；**Zustand + TanStack Query** 让业务层保持 **可预测、可测试**。  
- **安全** 通过最小权限、密钥本地化、AES‑GCM 加密、Keyring 存储、HTTPS 以及严格的 CSP 完成；**性能** 则靠 **Code Splitting、Lazy Loading、Worker Offload、Cache‑First** 等手段保障。  
- 完整的 **CI/CD、自动化测试、版本化迁移** 能让团队在多平台上持续交付高质量的桌面 PWA 应用。

> **一句话定位**：把「后端」的职责全部转化为 **前端 + 本地原生桥**，配合 **AI SDK**、**文档编辑**、**文件同步**与**高级数据库**，即可在用户机器上实现「全栈」功能，且所有核心技术（存储、加密、AI、编辑、同步）都可在不同项目之间以 **npm 包 / monorepo** 方式复用。祝你搭建成功，若后续需要更细的实现代码或具体插件示例，随时提问！ 🚀


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-04-08 |
| 更新日期 | 2026-04-08 |
| 内容校验 | 518523b9999cd2e4 |
| 追溯ID | TRC-20260408141610 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
