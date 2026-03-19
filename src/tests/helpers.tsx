/**
 * @file helpers.tsx
 * @description 测试辅助工具 — React 渲染包装器、Mock Provider、断言扩展、常用 fixture
 * @version v1.0.0
 */

import React, { type ReactNode } from 'react';

// ── Providers Wrapper（含 Router + Store + AI Context 等） ──

/**
 * 轻量级 Provider 包装器，用于组件测试。
 * 在真实环境中会挂载 DesignerProvider / GlobalAIProvider 等。
 */
export function TestProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// ── 常用 Mock 数据 ──

export const MOCK_PANEL = {
  id: 'panel-test-1',
  name: 'Test Panel',
  type: 'container' as const,
  x: 0, y: 0, w: 6, h: 4,
  children: ['comp-1', 'comp-2'],
};

export const MOCK_COMPONENT = {
  id: 'comp-1',
  type: 'Button',
  label: 'Test Button',
  props: { label: 'Click Me', variant: 'primary' },
  panelId: 'panel-test-1',
};

export const MOCK_CRDT_PEER = {
  id: 'peer-1',
  name: 'TestUser',
  color: '#ff6b6b',
  role: 'editor' as const,
  lastSeen: Date.now(),
  cursor: { panelId: 'panel-test-1', componentId: 'comp-1', line: 5, column: 10 },
  lockedPanelId: null,
};

export const MOCK_CRDT_USER_IDENTITY = {
  id: 'user-self',
  displayName: 'LocalUser',
  avatarColor: '#6366f1',
  role: 'owner' as const,
};

export const MOCK_FILE_NODE = {
  id: 'f1',
  name: 'src',
  type: 'folder' as const,
  children: [
    {
      id: 'f2',
      name: 'App.tsx',
      type: 'file' as const,
      language: 'typescript',
      content: 'export default function App() { return <div>Hello</div>; }',
    },
    {
      id: 'f3',
      name: 'utils',
      type: 'folder' as const,
      children: [
        { id: 'f4', name: 'helpers.ts', type: 'file' as const, language: 'typescript', content: 'export const add = (a: number, b: number) => a + b;' },
      ],
    },
  ],
};

export const MOCK_BRIDGE_PAYLOAD = {
  code: 'export function Hello() { return <div>Hello</div>; }',
  language: 'typescript',
  fileName: 'Hello.tsx',
  components: [
    { type: 'Custom', label: 'Hello', props: { source: 'ai-code' } },
  ],
};

export const MOCK_APP_SETTINGS = {
  language: 'zh-CN' as const,
  theme: 'classic' as const,
  editorFontSize: 12,
  indentStyle: '2-spaces' as const,
  autoSave: true,
  autoSaveInterval: 30,
  minimap: true,
  sidebarOpen: true,
  streamingEnabled: true,
  aiContextLength: 10,
  previewTailwind: true,
  previewScrollSync: true,
  previewDebounceMs: 300,
  previewMode: 'realtime' as const,
};

// ── 延迟辅助 ──

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => queueMicrotask(resolve));
}

// ── Fake Timer 辅助 ──

export function advanceTimersByTimeAsync(ms: number): Promise<void> {
  return new Promise(resolve => {
    // vitest.advanceTimersByTime(ms) should be called externally
    setTimeout(resolve, 0);
  });
}

// ── Snapshot 辅助 ──

export function sanitizeSnapshot(html: string): string {
  return html
    .replace(/data-testid="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
    .replace(/class="[^"]*"/g, 'class="..."');
}

export default {};
