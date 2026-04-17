/**
 * YYC³ AI - ChatInterface Component Test
 * 
 * @module ChatInterface.test
 * @description ChatInterface 组件测试，符合五标-标准化测试
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '@/app/components/home/ChatInterface';
import { useThemeStore } from '@/app/stores/theme-store';
import { useSettingsStore } from '@/app/stores/settings-store';

// Mock theme store
vi.mock('@/app/stores/theme-store', () => ({
  useThemeStore: vi.fn(),
}));

// Mock settings store
vi.mock('@/app/stores/settings-store', () => ({
  useSettingsStore: vi.fn(),
}));

// Mock logger
vi.mock('@/app/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

const mockGetColor = vi.fn((path) => {
  const colors: Record<string, string> = {
    'background.secondary': '#f5f5f5',
    'text.primary': '#000000',
    'text.secondary': '#666666',
    'surface.primary': '#ffffff',
    'surface.tertiary': '#e5e5e5',
    'border.primary': '#d1d5db',
    'accent.primary': '#3b82f6',
    'error': '#ef4444',
  };
  return colors[path] || '#000000';
});

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.mocked(useThemeStore).mockReturnValue({
      theme: { mode: 'light', colors: {} } as any,
      getColor: mockGetColor,
    } as any);
    
    vi.mocked(useSettingsStore).mockReturnValue({
      settings: {
        general: {
          language: 'zh-CN',
        },
      },
    } as any);

    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该正确渲染 ChatInterface 组件', () => {
      render(<ChatInterface />);
      expect(screen.getByText('智亦师亦友亦伯乐')).toBeInTheDocument();
    });

    it('应该显示空状态提示', () => {
      render(<ChatInterface />);
      expect(screen.getByText('谱一言一语一华章，谱奏人机共生协同的AI Family乐章')).toBeInTheDocument();
    });

    it('应该显示输入框', () => {
      render(<ChatInterface />);
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');
      expect(textarea).toBeInTheDocument();
    });

    it('应该显示发送按钮', () => {
      render(<ChatInterface />);
      expect(screen.getByText('发送')).toBeInTheDocument();
    });
  });

  describe('快捷操作', () => {
    it('应该显示快捷操作按钮', () => {
      render(<ChatInterface showQuickActions={true} />);
      expect(screen.getByText('分析代码')).toBeInTheDocument();
      expect(screen.getByText('优化代码')).toBeInTheDocument();
      expect(screen.getByText('解释概念')).toBeInTheDocument();
      expect(screen.getByText('生成文档')).toBeInTheDocument();
    });

    it('应该不显示快捷操作按钮', () => {
      render(<ChatInterface showQuickActions={false} />);
      expect(screen.queryByText('分析代码')).not.toBeInTheDocument();
    });

    it('点击快捷操作应该更新输入框', () => {
      render(<ChatInterface showQuickActions={true} />);
      const analyzeButton = screen.getByText('分析代码');
      fireEvent.click(analyzeButton);
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');
      expect(textarea).toHaveValue('请帮我分析这段代码');
    });
  });

  describe('消息发送', () => {
    it('应该正确发送消息', async () => {
      const mockOnSend = vi.fn().mockResolvedValue('AI响应');
      render(<ChatInterface onSend={mockOnSend} />);
      
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');
      const sendButton = screen.getByText('发送');

      fireEvent.change(textarea, { target: { value: '测试消息' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('测试消息');
      });
    });

    it('应该在发送后清空输入框', async () => {
      const mockOnSend = vi.fn().mockResolvedValue('AI响应');
      render(<ChatInterface onSend={mockOnSend} />);
      
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');
      const sendButton = screen.getByText('发送');

      fireEvent.change(textarea, { target: { value: '测试消息' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('应该显示AI响应', async () => {
      const mockOnSend = vi.fn().mockResolvedValue('这是AI的响应');
      render(<ChatInterface onSend={mockOnSend} />);
      
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');
      const sendButton = screen.getByText('发送');

      fireEvent.change(textarea, { target: { value: '测试消息' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('这是AI的响应')).toBeInTheDocument();
      });
    });

    it('应该支持Enter键发送消息', async () => {
      const mockOnSend = vi.fn().mockResolvedValue('AI响应');
      render(<ChatInterface onSend={mockOnSend} />);
      
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');

      fireEvent.change(textarea, { target: { value: '测试消息' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('测试消息');
      });
    });

    it('应该支持Shift+Enter换行', () => {
      render(<ChatInterface />);
      
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');

      fireEvent.change(textarea, { target: { value: '第一行' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
      fireEvent.change(textarea, { target: { value: '第一行\n' } });

      expect(textarea).toHaveValue('第一行\n');
    });

    it('应该禁用空消息发送', () => {
      render(<ChatInterface />);
      
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');
      const sendButton = screen.getByText('发送');

      expect(sendButton).toBeDisabled();
    });

    it('应该禁用发送中的按钮', async () => {
      const mockOnSend = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<ChatInterface onSend={mockOnSend} />);
      
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');
      const sendButton = screen.getByText('发送');

      fireEvent.change(textarea, { target: { value: '测试消息' } });
      fireEvent.click(sendButton);

      expect(screen.getByText('发送中...')).toBeInTheDocument();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('初始消息', () => {
    it('应该显示初始消息', () => {
      const initialMessages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: '用户消息',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          role: 'assistant' as const,
          content: 'AI消息',
          timestamp: new Date(),
        },
      ];

      render(<ChatInterface initialMessages={initialMessages} />);
      
      expect(screen.getByText('用户消息')).toBeInTheDocument();
      expect(screen.getByText('AI消息')).toBeInTheDocument();
    });

    it('应该正确显示不同角色的消息', () => {
      const initialMessages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: '用户消息',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          role: 'assistant' as const,
          content: 'AI消息',
          timestamp: new Date(),
        },
        {
          id: 'msg-3',
          role: 'system' as const,
          content: '系统消息',
          timestamp: new Date(),
        },
      ];

      render(<ChatInterface initialMessages={initialMessages} />);
      
      expect(screen.getByText('用户')).toBeInTheDocument();
      expect(screen.getByText('AI导师')).toBeInTheDocument();
      expect(screen.getByText('系统')).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('应该显示错误消息', async () => {
      const mockOnSend = vi.fn().mockRejectedValue(new Error('网络错误'));
      render(<ChatInterface onSend={mockOnSend} />);
      
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');
      const sendButton = screen.getByText('发送');

      fireEvent.change(textarea, { target: { value: '测试消息' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('抱歉，发生了一些错误，请稍后再试。')).toBeInTheDocument();
      });
    });
  });

  describe('自定义样式', () => {
    it('应该应用自定义类名', () => {
      const { container } = render(<ChatInterface className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('交互体验', () => {
    it('应该聚焦输入框当点击快捷操作时', () => {
      render(<ChatInterface showQuickActions={true} />);
      const analyzeButton = screen.getByText('分析代码');
      
      fireEvent.click(analyzeButton);
      
      const textarea = screen.getByPlaceholderText('输入消息... (Enter发送，Shift+Enter换行)');
      expect(textarea).toHaveFocus();
    });
  });

  describe('主题适配', () => {
    it('应该正确应用主题颜色', () => {
      const { container } = render(<ChatInterface />);
      expect(mockGetColor).toHaveBeenCalledWith('background.secondary');
      expect(mockGetColor).toHaveBeenCalledWith('text.primary');
    });
  });
});
