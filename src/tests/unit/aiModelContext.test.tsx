import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GlobalAIProvider, useGlobalAI } from '../../app/aiModelContext';
import { createMockLocalStorage } from '../utils/mockHelpers';
import React from 'react';

// Mock localStorage
const localStorageMock = createMockLocalStorage();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('aiModelContext — 全局 AI 模型上下文', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('辅助函数测试', () => {
    it('TC-AIMC-001: 应该能够设置和获取激活的模型', async () => {
      const TestComponent = () => {
        const { activeModelId, setActiveModel } = useGlobalAI();
        return (
          <div>
            <span data-testid="active-model">{activeModelId}</span>
            <button onClick={() => setActiveModel('glm-4.5')}>Set Model</button>
          </div>
        );
      };

      render(
        <GlobalAIProvider>
          <TestComponent />
        </GlobalAIProvider>
      );

      const span = screen.getByTestId('active-model');
      // 默认值通常是 'glm-4.5'
      await waitFor(() => {
        expect(span.textContent).toBeTruthy();
      });

      const button = screen.getByRole('button');
      button.click();
      
      await waitFor(() => {
        expect(span.textContent).toBe('glm-4.5');
      });
    });

    it('TC-AIMC-002: 应该能够添加 API Key', async () => {
      const TestComponent = () => {
        const { setApiKey, apiKeys } = useGlobalAI();
        return (
          <div>
            <button onClick={() => setApiKey('openai', 'sk-test-key')}>Add Key</button>
            <span data-testid="keys-count">{Object.keys(apiKeys).length}</span>
          </div>
        );
      };

      render(
        <GlobalAIProvider>
          <TestComponent />
        </GlobalAIProvider>
      );

      const button = screen.getByRole('button');
      button.click();

      const span = screen.getByTestId('keys-count');
      await waitFor(() => {
        expect(parseInt(span.textContent || '0')).toBeGreaterThan(0);
      });
    });
  });

  describe('Provider 行为测试', () => {
    it('TC-AIMC-010: 应该提供默认的模型列表', async () => {
      const TestComponent = () => {
        const { models } = useGlobalAI();
        return <div data-testid="models">{models.length} Models</div>;
      };

      render(
        <GlobalAIProvider>
          <TestComponent />
        </GlobalAIProvider>
      );

      const div = await screen.findByTestId('models');
      // GLOBAL_AI_MODELS 通常有几个预设模型
      expect(parseInt(div.textContent || '0')).toBeGreaterThan(0);
    });

    it('TC-AIMC-011: 应该从 localStorage 加载保存的 API Keys', async () => {
      // 预填充 localStorage
      localStorageMock.setItem('yyc3-ai-model-keys', JSON.stringify({ openai: 'sk-123' }));

      const TestComponent = () => {
        const { apiKeys } = useGlobalAI();
        return <div data-testid="keys">{Object.keys(apiKeys).length}</div>;
      };

      render(
        <GlobalAIProvider>
          <TestComponent />
        </GlobalAIProvider>
      );

      const div = await screen.findByTestId('keys');
      // 应该加载到 1 个 key
      await waitFor(() => {
        expect(div.textContent).toBe('1');
      });
    });
  });
});
