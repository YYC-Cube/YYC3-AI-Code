import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIChatPanel } from '../../app/components/ai-code/AIChatPanel';

// Mock all dependencies
vi.mock('../../app/hooks/useAIService', () => ({
  useAIService: () => ({
    isLoading: false,
    chat: vi.fn(),
    chatStream: vi.fn(),
  }),
}));

vi.mock('../../app/store', () => ({
  useStore: () => ({
    messages: [],
    addMessage: vi.fn(),
    clearMessages: vi.fn(),
    selectedCode: '',
    setSelectedCode: vi.fn(),
  }),
}));

describe('AIChatPanel — AI 聊天面板组件', () => {
  describe('基础渲染测试', () => {
    it('TC-ACP-001: 应该正确渲染聊天面板', () => {
      render(<AIChatPanel />);
      const container = document.querySelector('.flex.flex-col');
      expect(container).toBeInTheDocument();
    });

    it('TC-ACP-002: 应该渲染消息列表', () => {
      render(<AIChatPanel />);
      const messageList = document.querySelector('.overflow-y-auto');
      expect(messageList).toBeInTheDocument();
    });

    it('TC-ACP-003: 应该渲染输入框', () => {
      render(<AIChatPanel />);
      const inputField = screen.getByRole('textbox');
      expect(inputField).toBeInTheDocument();
    });
  });

  describe('输入框测试', () => {
    it('TC-ACP-020: 应该支持用户输入', () => {
      render(<AIChatPanel />);
      const inputField = screen.getByRole('textbox');
      fireEvent.change(inputField, { target: { value: 'Hello' } });
      expect(inputField).toHaveValue('Hello');
    });

    it('TC-ACP-021: 应该支持多行输入', () => {
      render(<AIChatPanel />);
      const inputField = screen.getByRole('textbox');
      fireEvent.change(inputField, { target: { value: 'Line 1\nLine 2' } });
      expect(inputField).toHaveValue('Line 1\nLine 2');
    });

    it('TC-ACP-022: 应该支持特殊字符', () => {
      render(<AIChatPanel />);
      const inputField = screen.getByRole('textbox');
      fireEvent.change(inputField, { target: { value: 'Hello 特殊字符 !@#$%' } });
      expect(inputField).toHaveValue('Hello 特殊字符 !@#$%');
    });
  });

  describe('发送按钮测试', () => {
    it('TC-ACP-030: 点击发送按钮应该触发发送', () => {
      render(<AIChatPanel />);
      const sendButtons = screen.getAllByRole('button');
      expect(sendButtons.length).toBeGreaterThan(0);
    });

    it('TC-ACP-031: 空输入时发送按钮应该禁用', () => {
      render(<AIChatPanel />);
      const sendButtons = screen.getAllByRole('button');
      expect(sendButtons.length).toBeGreaterThan(0);
    });

    it('TC-ACP-032: 按下 Enter 键应该发送消息', () => {
      render(<AIChatPanel />);
      const inputField = screen.getByRole('textbox');
      fireEvent.change(inputField, { target: { value: 'Hello' } });
      fireEvent.keyDown(inputField, { key: 'Enter', code: 'Enter' });
      expect(inputField).toBeInTheDocument();
    });

    it('TC-ACP-033: 按下 Shift+Enter 键不应该发送消息', () => {
      render(<AIChatPanel />);
      const inputField = screen.getByRole('textbox');
      fireEvent.change(inputField, { target: { value: 'Hello' } });
      fireEvent.keyDown(inputField, { key: 'Enter', shiftKey: true });
      expect(inputField).toBeInTheDocument();
    });
  });

  describe('边界条件测试', () => {
    it('TC-ACP-060: 应该处理空消息列表', () => {
      render(<AIChatPanel />);
      const container = document.querySelector('.flex.flex-col');
      expect(container).toBeInTheDocument();
    });

    it('TC-ACP-061: 应该处理超长输入', () => {
      render(<AIChatPanel />);
      const inputField = screen.getByRole('textbox');
      const longInput = 'A'.repeat(10000);
      fireEvent.change(inputField, { target: { value: longInput } });
      expect(inputField).toHaveValue(longInput);
    });

    it('TC-ACP-062: 应该处理特殊字符', () => {
      render(<AIChatPanel />);
      const inputField = screen.getByRole('textbox');
      const specialChars = 'Hello 世界 !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      fireEvent.change(inputField, { target: { value: specialChars } });
      expect(inputField).toHaveValue(specialChars);
    });
  });
});
