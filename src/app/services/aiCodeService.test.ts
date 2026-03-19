import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AICodeService, CodeGenerationRequest } from './aiCodeService';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('aiCodeService — AI 代码生成服务', () => {
  let service: AICodeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AICodeService('test-api-key', 'gpt-4o-mini');
  });

  describe('generateCode 测试', () => {
    it('TC-ACG-001: 成功时应该返回生成的代码', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '```typescript\nconst a = 1;\n```' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const request: CodeGenerationRequest = {
        prompt: 'Create a variable',
        language: 'typescript',
      };

      const result = await service.generateCode(request);

      expect(result.code).toBe('const a = 1;');
      expect(result.language).toBe('typescript');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });

    it('TC-ACG-002: 当 API 返回错误时应该抛出异常', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ error: { message: 'Invalid API Key' } }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const request: CodeGenerationRequest = { prompt: 'test' };

      await expect(service.generateCode(request)).rejects.toThrow('Invalid API Key');
    });

    it('TC-ACG-003: 当返回的内容不是代码块时应该返回原始内容', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Just plain text' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const request: CodeGenerationRequest = { prompt: 'test' };
      const result = await service.generateCode(request);

      expect(result.code).toBe('Just plain text');
    });

    it('TC-ACG-004: 应该正确处理 Context 参数', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '```js\nctx()\n```' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const request: CodeGenerationRequest = {
        prompt: 'test',
        context: 'const x = 1;',
      };

      await service.generateCode(request);

      // 检查发送的 body 是否包含 context
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.messages[1].content).toContain('const x = 1;');
    });
  });
});
