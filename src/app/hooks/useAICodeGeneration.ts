/**
 * @file useAICodeGeneration.ts
 * @description YYC3 AI 代码生成 Hook — 封装 AICodeService 的 React 状态管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hook,ai,code-generation,react
 */

import { useState, useCallback } from 'react';
import { useGlobalAI } from '../aiModelContext';
import { getAICodeService, CodeGenerationRequest, CodeGenerationResponse } from '../services/aiCodeService';

// ── Hook ──

interface UseAICodeGenerationResult {
  generateCode: (request: CodeGenerationRequest) => Promise<string>;
  generatedCode: string | null;
  isGenerating: boolean;
  error: string | null;
  clearCode: () => void;
}

export const useAICodeGeneration = (): UseAICodeGenerationResult => {
  const { getApiKey, activeModelId } = useGlobalAI();
  
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateCode = useCallback(async (request: CodeGenerationRequest): Promise<string> => {
    const apiKey = getApiKey(activeModelId);

    if (!apiKey) {
      const msg = `API Key not found for model: ${activeModelId}`;
      setError(msg);
      throw new Error(msg);
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedCode(null);

    try {
      const service = getAICodeService(apiKey, activeModelId);
      const response: CodeGenerationResponse = await service.generateCode(request);
      
      setGeneratedCode(response.code);
      return response.code;
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error occurred';
      setError(errorMsg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [getApiKey, activeModelId]);

  const clearCode = useCallback(() => {
    setGeneratedCode(null);
    setError(null);
  }, []);

  return {
    generateCode,
    generatedCode,
    isGenerating,
    error,
    clearCode,
  };
};
