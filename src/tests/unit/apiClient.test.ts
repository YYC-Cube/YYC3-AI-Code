import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setToken, clearToken, addRequestInterceptor, addResponseInterceptor } from '../../app/apiClient';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => key in store ? store[key] : null, // Fix: check key existence, not just value
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('apiClient — API 客户端工具函数', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Token 管理测试', () => {
    it('TC-API-001: setToken 应该将令牌保存到 localStorage', () => {
      setToken('test-token-123');
      expect(localStorage.getItem('yanyucloud-auth-token')).toBe('test-token-123');
    });

    it('TC-API-002: clearToken 应该清除 localStorage 中的令牌', () => {
      setToken('test-token-123');
      clearToken();
      expect(localStorage.getItem('yanyucloud-auth-token')).toBeNull();
    });
  });

  describe('拦截器测试', () => {
    it('TC-API-010: addRequestInterceptor 应该添加请求拦截器', () => {
      const interceptor = vi.fn();
      expect(() => addRequestInterceptor(interceptor)).not.toThrow();
    });

    it('TC-API-011: addResponseInterceptor 应该添加响应拦截器', () => {
      const interceptor = vi.fn();
      expect(() => addResponseInterceptor(interceptor)).not.toThrow();
    });
  });

  describe('边界条件测试', () => {
    it('TC-API-020: setToken 应该处理空字符串', () => {
      setToken('');
      expect(localStorage.getItem('yanyucloud-auth-token')).toBe('');
    });

    it('TC-API-021: setToken 应该处理特殊字符', () => {
      const specialToken = 'test-!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      setToken(specialToken);
      expect(localStorage.getItem('yanyucloud-auth-token')).toBe(specialToken);
    });

    it('TC-API-022: setToken 应该处理超长令牌', () => {
      const longToken = 'a'.repeat(10000);
      setToken(longToken);
      expect(localStorage.getItem('yanyucloud-auth-token')).toBe(longToken);
    });
  });
});
