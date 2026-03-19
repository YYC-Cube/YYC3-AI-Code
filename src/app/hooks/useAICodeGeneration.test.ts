import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAICodeGeneration } from './useAICodeGeneration';

// Mock dependencies
vi.mock('../aiModelContext', () => ({
  useGlobalAI: vi.fn(),
}));

vi.mock('../services/aiCodeService', () => ({
  getAICodeService: vi.fn(),
}));

import { useGlobalAI } from '../aiModelContext';
import { getAICodeService, AICodeService } from '../services/aiCodeService';

const mockUseGlobalAI = useGlobalAI as any;
const mockGetAICodeService = getAICodeService as any;

// Mock Service Instance
const mockService = {
  generateCode: vi.fn(),
};

describe('useAICodeGeneration — AI 代码生成 Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default Mocks
    mockUseGlobalAI.mockReturnValue({
      getApiKey: vi.fn(() => 'sk-test-key'),
      activeModelId: 'gpt-4o-mini',
    });
    
    // Mock with delay to test loading state
    mockService.generateCode.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ code: 'const a = 1;', language: 'typescript' }), 50)
      )
    );
    
    mockGetAICodeService.mockReturnValue(mockService);
  });

  describe('状态管理测试', () => {
    it('TC-HOOK-001: 初始状态应该是 loading=false, error=null, code=null', () => {
      const { result } = renderHook(() => useAICodeGeneration());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.generatedCode).toBe(null);
    });

    it('TC-HOOK-002: 调用 generateCode 时应该设置 loading=true', async () => {
      const { result } = renderHook(() => useAICodeGeneration());
      
      const promise = result.current.generateCode({ prompt: 'test' });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(true);
      });

      await promise;
    });

    it('TC-HOOK-003: 成功时应该更新 generatedCode 并清除 error', async () => {
      const { result } = renderHook(() => useAICodeGeneration());
      
      await result.current.generateCode({ prompt: 'test' });

      await waitFor(() => {
        expect(result.current.generatedCode).toBe('const a = 1;');
      });
      
      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it('TC-HOOK-004: 失败时应该设置 error', async () => {
      mockService.generateCode.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API Failed')), 50)
        )
      );
      
      const { result } = renderHook(() => useAICodeGeneration());
      
      await expect(result.current.generateCode({ prompt: 'test' })).rejects.toThrow('API Failed');

      await waitFor(() => {
        expect(result.current.error).toBe('API Failed');
      });
      
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });
    });
  });

  describe('依赖测试', () => {
    it('TC-HOOK-010: 当没有 API Key 时应该抛出错误', async () => {
      mockUseGlobalAI.mockReturnValue({
        getApiKey: vi.fn(() => null),
        activeModelId: 'gpt-4o-mini',
      });

      const { result } = renderHook(() => useAICodeGeneration());

      await expect(result.current.generateCode({ prompt: 'test' })).rejects.toThrow('API Key not found');
    });

    it('TC-HOOK-011: 应该调用 getAICodeService 并传递 apiKey 和 modelId', async () => {
      const { result } = renderHook(() => useAICodeGeneration());

      await result.current.generateCode({ prompt: 'test' });

      expect(mockGetAICodeService).toHaveBeenCalledWith('sk-test-key', 'gpt-4o-mini');
    });
  });
});
