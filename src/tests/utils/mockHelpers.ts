import { vi } from 'vitest';

/**
 * @file mockHelpers.ts
 * @description YYC3 测试 Mock 工具库 — 提供通用的 Mock 函数和对象
 */

// ── Store Mock ──

export const createMockStore = (overrides = {}) => ({
  messages: [],
  addMessage: vi.fn(),
  clearMessages: vi.fn(),
  selectedCode: '',
  setSelectedCode: vi.fn(),
  designJson: null,
  generatedCode: '',
  activeView: 'files',
  setActiveView: vi.fn(),
  errors: [],
  performanceMetrics: null,
  healthStatus: 'healthy',
  ...overrides,
});

// ── AI Service Mock ──

export const createMockAIService = (overrides = {}) => ({
  isLoading: false,
  chat: vi.fn(),
  chatStream: vi.fn(),
  config: { providers: [] },
  ...overrides,
});

// ── LocalStorage Mock ──

export const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => key in store ? store[key] : null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

// ─── 导出类型 ───

export type MockStore = ReturnType<typeof createMockStore>;
export type MockAIService = ReturnType<typeof createMockAIService>;
