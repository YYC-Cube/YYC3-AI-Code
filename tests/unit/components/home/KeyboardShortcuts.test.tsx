/**
 * YYC³ AI - KeyboardShortcuts Component Test
 * 
 * @module KeyboardShortcuts.test
 * @description KeyboardShortcuts 组件测试，符合五标-标准化测试
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcuts } from '@/app/components/home/KeyboardShortcuts';
import { useThemeStore } from '@/app/stores/theme-store';

// Mock theme store
vi.mock('@/app/stores/theme-store', () => ({
  useThemeStore: vi.fn(),
}));

const mockGetColor = vi.fn((path) => {
  const colors: Record<string, string> = {
    'background.secondary': '#f5f5f5',
    'text.primary': '#000000',
    'text.secondary': '#666666',
    'text.tertiary': '#999999',
    'surface.primary': '#ffffff',
    'surface.tertiary': '#e5e5e5',
    'border.primary': '#d1d5db',
    'accent.primary': '#3b82f6',
  };
  return colors[path] || '#000000';
});

describe('KeyboardShortcuts', () => {
  const mockShortcuts = [
    {
      id: '1',
      keys: ['Ctrl', 'S'],
      description: '保存文件',
      category: '文件',
    },
    {
      id: '2',
      keys: ['Ctrl', 'C'],
      description: '复制',
      category: '编辑',
    },
  ];

  beforeEach(() => {
    vi.mocked(useThemeStore).mockReturnValue({
      theme: { mode: 'light', colors: {} } as any,
      getColor: mockGetColor,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该正确渲染 KeyboardShortcuts 组件', () => {
      render(<KeyboardShortcuts shortcuts={mockShortcuts} />);
      expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      expect(screen.getByText('保存文件')).toBeInTheDocument();
      expect(screen.getByText('复制')).toBeInTheDocument();
    });

    it('应该不显示组件', () => {
      const { container } = render(<KeyboardShortcuts shortcuts={mockShortcuts} visible={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('应该显示按键组合', () => {
      render(<KeyboardShortcuts shortcuts={mockShortcuts} />);
      expect(screen.getAllByText('Ctrl').length).toBeGreaterThan(0);
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('应该显示分类', () => {
      render(<KeyboardShortcuts shortcuts={mockShortcuts} />);
      expect(screen.getAllByText('文件').length).toBeGreaterThan(0);
      expect(screen.getAllByText('编辑').length).toBeGreaterThan(0);
    });
  });

  describe('搜索功能', () => {
    it('应该根据描述搜索', () => {
      render(<KeyboardShortcuts shortcuts={mockShortcuts} />);
      
      const searchInput = screen.getByPlaceholderText('搜索快捷键...');
      fireEvent.change(searchInput, { target: { value: '保存' } });

      expect(screen.getByText('保存文件')).toBeInTheDocument();
      expect(screen.queryByText('复制')).not.toBeInTheDocument();
    });

    it('应该根据按键搜索', () => {
      render(<KeyboardShortcuts shortcuts={mockShortcuts} />);
      
      const searchInput = screen.getByPlaceholderText('搜索快捷键...');
      fireEvent.change(searchInput, { target: { value: 'Ctrl' } });

      expect(screen.getByText('保存文件')).toBeInTheDocument();
      expect(screen.getByText('复制')).toBeInTheDocument();
    });

    it('应该显示未找到结果', () => {
      render(<KeyboardShortcuts shortcuts={mockShortcuts} />);
      
      const searchInput = screen.getByPlaceholderText('搜索快捷键...');
      fireEvent.change(searchInput, { target: { value: '未找到' } });

      expect(screen.getByText('未找到快捷键')).toBeInTheDocument();
    });
  });

  describe('分类筛选', () => {
    it('应该显示分类按钮', () => {
      render(<KeyboardShortcuts shortcuts={mockShortcuts} />);
      
      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getAllByText('文件').length).toBeGreaterThan(0);
      expect(screen.getAllByText('编辑').length).toBeGreaterThan(0);
    });

    it('应该根据分类筛选', () => {
      render(<KeyboardShortcuts shortcuts={mockShortcuts} />);
      
      const categoryButtons = screen.getAllByText('文件');
      const categoryButton = categoryButtons.find(btn => btn.tagName === 'BUTTON');
      fireEvent.click(categoryButton!);

      expect(screen.getByText('保存文件')).toBeInTheDocument();
      expect(screen.queryByText('复制')).not.toBeInTheDocument();
    });

    it('应该切换到全部分类', () => {
      render(<KeyboardShortcuts shortcuts={mockShortcuts} />);
      
      const categoryButtons = screen.getAllByText('文件');
      const categoryButton = categoryButtons.find(btn => btn.tagName === 'BUTTON');
      fireEvent.click(categoryButton!);

      const allButton = screen.getByText('全部');
      fireEvent.click(allButton);

      expect(screen.getByText('保存文件')).toBeInTheDocument();
      expect(screen.getByText('复制')).toBeInTheDocument();
    });
  });

  describe('空状态', () => {
    it('应该显示空状态', () => {
      render(<KeyboardShortcuts shortcuts={[]} />);
      
      expect(screen.getByText('未找到快捷键')).toBeInTheDocument();
    });
  });

  describe('自定义样式', () => {
    it('应该应用自定义类名', () => {
      const { container } = render(<KeyboardShortcuts shortcuts={mockShortcuts} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('主题适配', () => {
    it('应该正确应用主题颜色', () => {
      const { container } = render(<KeyboardShortcuts shortcuts={mockShortcuts} />);
      expect(mockGetColor).toHaveBeenCalledWith('background.secondary');
      expect(mockGetColor).toHaveBeenCalledWith('text.primary');
    });
  });
});
