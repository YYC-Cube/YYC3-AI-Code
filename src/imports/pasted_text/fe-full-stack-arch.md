---
file: fe-full-stack-arch.md
description: 前端全栈架构文档，介绍前端架构设计
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-19
updated: 2026-03-19
status: stable
tags: general,zh-CN
category: technical
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## Ⅰ. 需求概述与设计约束

| 需求 | 说明 |
|------|------|
| **全前端** | 完全不依赖传统后端服务，所有业务逻辑、状态、存储均在前端完成。 |
| **宿主机直接交互** | 前端运行在宿主机（桌面 OS）上，能够直接读写本地文件系统、访问硬件 API。 |
| **本地持久化** | 数据只保存在本机（IndexedDB、File System Access API、Tauri/Electron 文件系统），不走云端。 |
| **AI 能力** | 通过 OpenAI（ChatGPT、Embeddings、Fine‑tune 等）提供智能交互，统一封装为前端 SDK。 |
| **可复用、可扩展** | 采用模块化、插件化、依赖倒置的方式，能够在不同项目之间复用核心层（存储、AI、宿主桥）， UI 层可随业务自由替换。 |
| **安全与隐私** | 彻底本地化、数据加密、最小化密钥暴露，符合 GDPR/CCPA 等数据合规要求。 |
| **离线优先** | 通过 Service Worker、Cache API、本地缓存实现完整离线工作流，AI 调用在网络可用时自动恢复。 |
| **跨平台** | 支持 Windows / macOS / Linux（可选移动端 PWA），统一代码基。 |

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
| **AISDK** | 对外统一 OpenAI 能力（Chat、Embedding、Fine‑tune） | 基于 `fetch`+`AbortController`，在 SDK 内实现 **请求排队、速率限制、指数退避、离线缓存**。提供 **Typed** Prompt/Response 模型（Zod 校验） |
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
    this.version(2).stores({
      notes: 'id, createdAt, updatedAt', // primary key & indexes
    });
    // 迁移示例：在 v2 中对已有字段进行加密
    this.version(2).upgrade(async (tx) => {
      const old = await tx.table('notes').toArray();
      await Promise.all(
        old.map(async (rec) => {
          const encrypted = await encrypt(JSON.stringify(rec));
          await tx.table('notes').put({ ...rec, ...encrypted });
        })
      );
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

### 3. AISDK（OpenAI + 本地缓存）

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

### 4. WorkerService（WebWorker + Comlink）

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

### 5. UI 与状态层（React + Zustand Example）

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
      }),
      {
        name: 'note-store', // localStorage key
        getStorage: () => localStorage,
      }
    )
  )
);
```

> **说明**  
- 使用 `zustand` + `immer` 实现 **不可变** API，便于 React 组件直接 `useNoteStore`。  
- `persist` 能把状态（非敏感）同步至 `localStorage`，让 UI 更快启动。  
- 所有业务操作走 `NoteRepository` → 底层加密 → IndexedDB，实现 **安全‑持久化**。

### 6. Service Worker（离线缓存 + Background Sync）

```ts
// src/sw.ts (Workbox)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { Queue } from 'workbox-background-sync';

// 1. 静态资源预缓存（Vite 自动注入 __WB_MANIFEST）
precacheAndRoute(self.__WB_MANIFEST as any);

// 2. API 请求缓存（OpenAI 调用）
registerRoute(
  ({ url }) => url.origin === 'https://api.openai.com',
  new StaleWhileRevalidate({
    cacheName: 'openai-api',
    plugins: [
      // 可加入 response 确认、加密（如果需在 SW 层加密）等
    ],
  })
);

// 3. Background Sync (仅对失败的 POST *chat* 请求)
const chatQueue = new Queue('openai-chat-queue', {
  maxRetentionTime: 24 * 60, // 24 小时
});
registerRoute(
  ({ url, request }) => url.origin === 'https://api.openai.com' && request.method === 'POST',
  async ({ request }) => {
    try {
      const response = await fetch(request.clone());
      // 成功则返回
      return response;
    } catch (err) {
      // 网络错误，放入队列
      await chatQueue.pushRequest({ request });
      // 返回一个自定义"已离线"响应
      return new Response(
        JSON.stringify({ error: 'offline', message: '已缓存，网络恢复后自动发送' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
  'POST'
);
```

> **工作原理**  
- **Precache**：Vite 构建产物经过 Workbox 插件自动注入 `__WB_MANIFEST`，确保离线加载 UI 所需的 JS/CSS/资产。  
- **Stale‑While‑Revalidate**：OpenAI 响应先从 Cache 返回（最近一次成功调用），随后后台刷新。  
- **Background Sync**：网络断开时，把 POST（Chat）请求放入 Queue，Service Worker 会在 `sync` 事件触发时自动重发，保持 **“写即使离线”** 的一致性。  

---

## Ⅵ. 项目结构（Monorepo 示例）

```
/my-fe-fs-app
│
├─ packages/
│   ├─ core/
│   │   ├─ src/
│   │   │   ├─ bridge/      # HostBridge (Tauri/Electron)
│   │   │   ├─ storage/      # Dexie + Crypto
│   │   │   ├─ sdk/          # OpenAI SDK + cache
│   │   │   └─ workers/      # WebWorker utils
│   │   └─ package.json
│   |
│   ├─ ui/
│   │   ├─ src/
│   │   │   ├─ components/   # UI 组件库 (Storybook)
│   │   │   ├─ pages/        # 页面路由（React Router / Vite SPA）
│   │   │   ├─ store/        # Zustand + TanStack Query
│   │   │   └─ app.tsx
│   │   └─ package.json
│   |
│   └─ shared/
│       ├─ tsconfig.json
│       └─ vite.config.ts
│
├─ electron/ (optional)  # or tauri/
│   └─ src-tauri/
│
├─ .github/workflows/
│   └─ build.yml
│
├─ vite.config.ts
├─ tauri.conf.json   # Tauri 打包配置
└─ package.json
```

> **好处**  
- **core** 包可单独 **npm 发布** 或在内部项目中 `npm i @my/fe-fs-core`，实现业务层的 **可复用**。  
- **ui** 包专注 UI，使用 **Storybook** 生成组件文档，便于跨项目共享。  
- **shared** 包维护统一的 **TSConfig、ESLint、Prettier** 配置。  
- **根** 采用 **pnpm** 管理 workspace，可一次性 `pnpm i` 完成依赖安装。

---

## Ⅶ. 开发、测试、持续集成（CI）

### 1. 本地开发 Workflow

| 步骤 | 命令 | 说明 |
|------|------|------|
| 安装依赖 | `pnpm i` | workspace 安装 |
| 启动前端（dev） | `pnpm dev` | Vite 开发服务器 +热更新 |
| 启动 Tauri（桌面） | `pnpm tauri dev` | 运行带原生桥的桌面窗口 |
| 运行单元测试 | `pnpm test` | Vitest（覆盖率 > 80%） |
| 运行 E2E 测试 | `pnpm playwright:test` | 通过 CI 本地模拟文件系统权限、离线场景 |
| 打包发行 | `pnpm build && pnpm tauri build` | 生成三平台安装包（AppImage、DMG、MSI） |

### 2. GitHub Actions 示例（`.github/workflows/build.yml`）

```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'     # 仅在标签时发布

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - name: Install pnpm
        run: npm i -g pnpm
      - name: Install deps
        run: pnpm i --frozen-lockfile
      - name: Build Frontend
        run: pnpm run build
      - name: Build Tauri
        run: pnpm run tauri build
        env:
          VITE_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PWD }}

      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.os }}-binary
          path: src-tauri/target/release/bundle/**

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          path: artifacts
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: artifacts/**/*.*
          tag_name: ${{ github.ref_name }}
```

> **要点**  
- **Secrets** 中存放 OpenAI API Key、Tauri 签名钥匙，防止泄漏。  
- `pnpm tauri build` 会自动在 `src-tauri/target/release/bundle` 生成跨平台安装包。  
- 通过 `action-gh-release` 自动发布至 GitHub Release，供用户下载。

### 3. 测试策略

| 类别 | 工具 | 关注点 |
|------|------|--------|
| **单元** | Vitest (Jest API) | 业务函数、Repository、SDK 参数校验、加密/解密 |
| **集成** | React Testing Library + Vitest | 组件与 Store 交互、异步调用（Mock OpenAI） |
| **端到端** | Playwright | 完整 UI 流、文件系统权限弹窗、离线/在线切换、后台同步 |
| **安全审计** | npm audit、Snyk | 第三方依赖安全、OpenAI Key 泄露风险 |
| **性能** | Lighthouse CI | 首屏加载、PWA 离线、资源体积（目标 < 10 MB） |

---

## Ⅷ. 安全 & 隐私设计细则

1. **最小权限**  
   - Tauri/Electron `allowlist` 仅启用 `fs`, `dialog`, `notification`，其它原生 API 均关闭。  
   - 对文件系统操作必须通过 **用户显式交互**（文件选择器、保存对话框），避免任意路径读写。

2. **密钥管理**  
   - **OpenAI API Key** 通过 **构建时注入**（`import.meta.env.VITE_OPENAI_API_KEY`），不硬编码在源码。  
   - 在运行时，可让用户自行在设置页面填入自己的 API Key，使用 OS **Keyring**（macOS Keychain、Windows Credential Manager、Linux Secret Service）加密存储，调用前从 Keyring 读取。

3. **本地加密**  
   - 所有持久化数据（Dexie、文件）在写入前使用 **AES‑GCM** 加密。  
   - 加密密钥来源于 **用户密码**（PBKDF2 派生）或 **系统 Keyring**，不保存在任何明文文件。  
   - 加密数据的 **IV**、**salt** 随机生成并存储在同一记录（公开无害）。

4. **网络安全**  
   - 仅使用 **HTTPS** 与 OpenAI 通信（`fetch` 默认）。  
   - 对请求进行 **速率限制**，防止滥用导致账户被封。  
   - 任何错误信息不泄露 **API Key** 或 **用户数据**。

5. **数据合规**  
   - 因所有数据本地存储，不跨境传输，天然符合 GDPR “数据最小化”。  
   - 在 UI 中提供 **“导出/删除所有数据”** 功能，导出为已加密的 JSON，删除功能彻底清除 IndexedDB、文件系统缓存、Service Worker 缓存。  
   - **隐私政策** 中声明：仅在调用 OpenAI 时向云端发送用户消息，且不持久化 OpenAI 返回的数据至本地（除非用户手动保存）。

---

## Ⅸ. 性能调优 & 可伸缩

| 场景 | 优化方案 |
|------|----------|
| **首次加载** | 使用 Vite `esbuild` 进行代码拆分；`preload` 必要资源；服务工作线程缓存 `index.html`、`manifest.json`、关键 JS/CSS。 |
| **大文件处理** | 采用 **File System Access API + WebWorker** 把文件读取、分片、AES 加密等放在子线程。 |
| **AI 响应体积** | 对 OpenAI `chat/completions` 只保留 `content`，使用 **Zod** 剔除不必要字段后写入本地缓存；在 UI 上使用 **virtualized list**（react‑virtualized）渲染长聊天历史。 |
| **并发请求** | `TanStack Query` 内部支持 **请求去重** 与 **缓存失效**，可通过 `staleTime` 与 `cacheTime` 控制；对 OpenAI 采用 **batching**（如一次发送多条 `messages`）降低请求次数。 |
| **离线模式** | Service Worker 缓存：`HTML`, `JS`, `CSS`, `images`, `OpenAI responses`，并通过 **Background Sync** 确保离线操作不丢失。 |
| **内存占用** | 大文件仅在 **Worker** 中持有 `ArrayBuffer`，处理完后立即 `revokeObjectURL`，减少主线程内存压力。 |
| **跨平台体积** | 采用 **Tauri**（Rust + Webview）区别于 Electron，安装包大小约 5–12 MB。可通过 `tauri.conf.json` 的 `bundle` 选项移除不需要的图标、语言包。 |

---

## Ⅹ. 迁移、升级与未来扩展

1. **数据迁移**  
   - 在 `Dexie` 中使用 `version` + `upgrade` 回调，**自动加密/解密** 老数据。  
   - 对文件系统变更（如目录结构）可在 `HostBridge` 中加入 **迁移脚本**（在首次启动后检测旧目录，执行 `copy/move`）。

2. **插件化**  
   - 在 `core` 中预留 **Plugin API**：插件实现 `registerPlugin(name, api)`，`HostBridge` 通过 `invoke` 动态加载（如图表插件、第三方 AI 服务）。  
   - 插件可是 **WebAssembly**（Rust、Go 编译）或 **JS**，只要实现约定的 `initialize(context)` 即可。

3. **多用户/多实例**  
   - 若需要分离用户数据，可在本地创建 **工作区目录**（用户自行选择），每个工作区对应一个独立 `IndexedDB` 实例（通过 `dbName` 参数区分）。  
   - UI 中提供 **切换工作区** 功能，避免数据混杂。

4. **云同步（可选）**  
   - 虽然目标是 **无后端**，但可以提供 **可选云同步**（如使用 Dropbox、OneDrive、Google Drive API）作为 **外部可插拔的同步插件**，不影响核心“无后端”特性。

5. **模型切换**  
   - `OpenAIClient` 抽象为 **AIProvider**。未来可自行实现 **Local LLM**（如 `ggml`、`web-llm`）或 **其他云供应商**（Azure OpenAI、Anthropic）插件，只需要实现同一接口即可。

---

## Ⅺ. 完整实现路线图（按阶段）

| 阶段 | 目标 | 关键里程碑 |
|------|------|-----------|
| **0️⃣ 前期准备** | 选型、目录结构、CI 基础 | 初始化 Monorepo、pnpm workspace、GitHub Actions、Storybook 基础 |
| **1️⃣ 基础平台** | 完成 Tauri + Vite 项目框架 | `tauri init` → `vite build` → `tauri dev` 正常启动 |
| **2️⃣ 本地存储 & 加密** | 实现 Dexie + Web Crypto + File System Access | 完成 `storage/db.ts`、`crypto.ts`、`HostBridge.pickAndReadFile` 示例 |
| **3️⃣ AI SDK** | 封装 OpenAI 调用、缓存、离线回退 | `openai.ts`、`supabaseCache.ts`、Service Worker `openai-api` 路由 |
| **4️⃣ 状态管理 & UI** | 搭建 UI框架、零依赖的业务状态 | `useNoteStore`、基本 CRUD 页面、Storybook 组件库 |
| **5️⃣ 背景任务** | WebWorker、Background Sync、离线写入 | `workers/crypto.worker.ts`、`sw.ts`、`registerSync` |
| **6️⃣ 安全 & 隐私** | Keyring + 最小权限、加密审计 | 集成 `keytar`（Tauri）或 `@electron/remote`（Electron）用于安全存储 API Key |
| **7️⃣ 打包 & 发布** | 多平台安装包、自动发布 | `tauri build` → GitHub Release，CI 完成自动化 |
| **8️⃣ 扩展插件** | 插件系统、外部 LLM、云同步 | 设计 `plugins` 目录、示例 `local-llm`、`dropbox-sync` |
| **9️⃣ 生产监控** | 错误上报、性能监控 | 集成 Sentry（前端）+ `tauri-plugin-log`，发布 DoS 防护措施 |

每个阶段完成后，建议跑一次 **完整回归测试**（Playwright）确保离线/在线、不同平台都能顺畅运行。

---

## Ⅻ. 常见问题 & 风险预估

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

---

## Ⅼ. 小结

- **前端一体化全栈**（FEFS）并非“没有后端”，而是把原本后端的 **存储、业务、AI 调用、文件操作** 统一搬到 **前端运行时 + 原生宿主桥**。  
- 通过 **Tauri (或 Electron)** 建立 *安全、轻量* 的宿主层；使用 **IndexedDB + File System Access API + Web Crypto** 完成本地安全持久化；利用 **OpenAI SDK**（自研包装）提供 AI 能力，配合 **Service Worker + Background Sync** 实现离线写入与自动恢复。  
- **模块化**（core、ui、shared）+ **插件化**（AIProvider、SyncProvider）保证 **可复用** 与 **可扩展**；**Zustand + TanStack Query** 让业务层保持 **可预测、可测试**。  
- **安全** 通过最小权限、密钥本地化、AES‑GCM 加密、Keyring 存储、HTTPS 以及严格的 CSP 完成；**性能** 则靠 **Code Splitting、Lazy Loading、Worker Offload、Cache‑First** 等手段保障。  
- 完整的 **CI/CD、自动化测试、版本化迁移** 能让团队在多平台上持续交付高质量的桌面 PWA 应用。

> **一句话定位**：把「后端」的职责全部转化为 **前端 + 本地原生桥**，配合 **AI SDK** 与 **离线缓存**，即可在用户机器上实现「全栈」功能，且所有核心技术（存储、加密、AI）都可在不同项目之间以 **npm 包 / monorepo** 方式复用。祝你搭建成功，若后续需要更细的实现代码或具体插件示例，随时提问！ 🚀
