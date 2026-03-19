import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('clipboard — 剪贴板工具函数 (集成测试)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('copyToClipboard 测试', () => {
    it('TC-CLIP-001: 调用函数时不应该抛出异常', () => {
      expect(() => {
        copyToClipboard('Test Text');
      }).not.toThrow();
    });

    it('TC-CLIP-002: 应该处理空字符串', () => {
      expect(() => {
        copyToClipboard('');
      }).not.toThrow();
    });

    it('TC-CLIP-003: 应该处理特殊字符', () => {
      expect(() => {
        copyToClipboard('Hello 世界 !@#$%^&*()');
      }).not.toThrow();
    });
    
    it('TC-CLIP-004: 应该处理超长文本', () => {
      const longText = 'a'.repeat(100000);
      expect(() => {
        copyToClipboard(longText);
      }).not.toThrow();
    });
  });
});
