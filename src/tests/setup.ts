/**
 * @file setup.ts
 * @description Vitest 全局测试设置 — DOM 环境模拟、localStorage/WebSocket/performance API Mock、通用 fixture
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.3.0
 * @created 2026-03-18
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,setup,mock,localStorage
 */

// ── Testing Library 支持 ──

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── jsdom / happy-dom 环境补丁 ──

// localStorage mock (强制覆盖，因为 jsdom 可能提供了不完整的实现)
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = String(value); },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => {
    const keys = Object.keys(store);
    for (const key of keys) {
      delete store[key];
    }
  },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

// 强制设置到 globalThis，覆盖任何不完整的实现
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// performance.memory mock (仅 Chrome 存在)
if (typeof performance !== 'undefined' && !(performance as any).memory) {
  (performance as any).memory = {
    usedJSHeapSize: 50 * 1024 * 1024,    // 50 MB
    totalJSHeapSize: 100 * 1024 * 1024,   // 100 MB
    jsHeapSizeLimit: 2048 * 1024 * 1024,  // 2 GB
  };
}

// PerformanceObserver stub
if (typeof globalThis.PerformanceObserver === 'undefined') {
  (globalThis as any).PerformanceObserver = class {
    constructor(_cb: any) {}
    observe() {}
    disconnect() {}
  };
}

// ResizeObserver stub
if (typeof globalThis.ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class {
    constructor(_cb: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// requestAnimationFrame / cancelAnimationFrame
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16);
  (globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
}

// CustomEvent polyfill (jsdom 已提供，但确保存在)
if (typeof globalThis.CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class extends Event {
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      super(type);
      this.detail = params?.detail;
    }
  };
}

// fetch mock (default noop, tests should override)
if (typeof globalThis.fetch === 'undefined') {
  (globalThis as any).fetch = async () => {
    throw new Error('fetch not mocked — use vi.mock or mockFetch()');
  };
}

// execCommand mock (jsdom 不支持)
if (typeof document !== 'undefined' && typeof document.execCommand === 'undefined') {
  document.execCommand = vi.fn(() => true);
}

// ── 清理函数 (每个 test 后重置) ──

/**
 * 安全地重置 localStorage
 */
export function resetLocalStorage() {
  localStorageMock.clear();
}

/**
 * 重置 performance.memory mock
 */
export function resetPerformanceMemory(opts: { usedMB?: number; limitMB?: number } = {}) {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    (performance as any).memory = {
      usedJSHeapSize: (opts.usedMB ?? 50) * 1024 * 1024,
      totalJSHeapSize: (opts.usedMB ?? 50) * 2 * 1024 * 1024,
      jsHeapSizeLimit: (opts.limitMB ?? 2048) * 1024 * 1024,
    };
  }
}

// ── 通用 fetch mock 工厂 ──

export interface MockFetchResponse {
  ok?: boolean;
  status?: number;
  json?: any;
  headers?: Record<string, string>;
}

export function createMockFetch(responses: Record<string, MockFetchResponse> = {}) {
  return async (url: string, init?: RequestInit) => {
    // 查找最匹配的 pattern
    const match = Object.keys(responses).find(pattern => url.includes(pattern));
    const resp = match ? responses[match] : { ok: false, status: 404, json: { error: 'Not Found' } };

    return {
      ok: resp.ok ?? true,
      status: resp.status ?? 200,
      headers: new Map(Object.entries(resp.headers ?? {})) as any,
      json: async () => resp.json ?? {},
      text: async () => JSON.stringify(resp.json ?? {}),
      clone: function () { return this; },
    };
  };
}

// ── WebSocket Mock ──

export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  sentMessages: any[] = [];

  constructor(url: string) {
    this.url = url;
    // Auto-open after microtask
    queueMicrotask(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    });
  }

  send(data: any) {
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: code ?? 1000, reason: reason ?? '', wasClean: true } as any);
  }

  // 测试辅助：模拟收到消息
  simulateMessage(data: any) {
    this.onmessage?.({ data } as MessageEvent);
  }

  // 测试辅助：模拟错误
  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

// ── Monaco Editor Mock ──

export function createMockMonaco() {
  return {
    editor: {
      defineTheme: () => {},
      setTheme: () => {},
      create: () => createMockEditor(),
    },
    languages: {
      register: () => {},
      setMonarchTokensProvider: () => {},
      registerCompletionItemProvider: () => ({ dispose: () => {} }),
    },
    Range: class {
      constructor(public startLineNumber: number, public startColumn: number, public endLineNumber: number, public endColumn: number) {}
    },
    Uri: { parse: (s: string) => s },
  };
}

export function createMockEditor() {
  return {
    getValue: () => '// mock content',
    setValue: () => {},
    getModel: () => ({
      getLineCount: () => 10,
      getLineContent: (n: number) => `line ${n}`,
      getFullModelRange: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 10, endColumn: 1 }),
      onDidChangeContent: () => ({ dispose: () => {} }),
    }),
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    setPosition: () => {},
    getSelection: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
    revealLineInCenter: () => {},
    getScrollHeight: () => 1000,
    getLayoutInfo: () => ({ height: 500, width: 800 }),
    setScrollTop: () => {},
    deltaDecorations: () => [],
    createDecorationsCollection: () => ({
      set: () => {},
      clear: () => {},
    }),
    onDidChangeCursorPosition: () => ({ dispose: () => {} }),
    onDidChangeCursorSelection: () => ({ dispose: () => {} }),
    onDidScrollChange: () => ({ dispose: () => {} }),
    dispose: () => {},
    focus: () => {},
    layout: () => {},
    addAction: () => ({ dispose: () => {} }),
  };
}

export default {};
