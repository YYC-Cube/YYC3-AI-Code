import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorDetectionService, getErrorDetectionService } from './errorDetectionService';

describe('errorDetectionService — 错误检测服务', () => {
  let service: ErrorDetectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = getErrorDetectionService();
  });

  describe('analyzeCode 测试', () => {
    it('TC-ERR-001: 检测代码中的 console.log (警告)', async () => {
      const code = `
        function test() {
          console.log('debug');
        }
      `;

      const result = await service.analyzeCode(code, 'javascript');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].ruleId).toBe('no-console');
      expect(result.errors[0].severity).toBe('warning');
    });

    it('TC-ERR-002: 检测代码中的 var (错误)', async () => {
      const code = `
        function test() {
          var x = 1;
        }
      `;

      const result = await service.analyzeCode(code, 'javascript');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].ruleId).toBe('no-var');
      expect(result.errors[0].severity).toBe('error');
    });

    it('TC-ERR-003: 纯净代码应该返回 0 个错误', async () => {
      const code = `
        function test() {
          const x = 1;
          return x;
        }
      `;

      const result = await service.analyzeCode(code, 'javascript');

      expect(result.errors).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    it('TC-ERR-004: 应该根据严重程度计算正确的分数', async () => {
      // 1 error (score -10) + 1 warning (score -5) = 85
      const code = `
        function test() {
          var x = 1; // error
          console.log(x); // warning
        }
      `;

      const result = await service.analyzeCode(code, 'javascript');

      expect(result.score).toBe(85);
    });
  });

  describe('Mock AI 增强测试', () => {
    it('TC-ERR-010: 错误应该包含 AI 建议字段', async () => {
      const code = `var x = 1;`;
      const result = await service.analyzeCode(code, 'javascript');

      expect(result.errors[0]).toHaveProperty('suggestion');
      expect(result.errors[0].suggestion).toBeTruthy();
    });
  });
});
