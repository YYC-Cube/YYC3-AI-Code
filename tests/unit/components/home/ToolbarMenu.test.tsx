/**
 * YYC³ AI - ToolbarMenu Component Test
 * 
 * @module ToolbarMenu.test
 * @description ToolbarMenu 组件测试，符合五标-标准化测试
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolbarMenu } from '@/app/components/home/ToolbarMenu';
import { useThemeStore } from '@/app/stores/theme-store';

// Mock theme store
vi.mock('@/app/stores/theme-store', () => ({
  useThemeStore: vi.fn(),
}));

const mockGetColor = vi.fn((path) => {
  const colors: Record<string, string> = {
    'background.secondary': '#f5f5f5',
    'text.primary': '#000000',
    'surface.primary': '#ffffff',
    'surface.tertiary': '#e5e5e5',
    'border.primary': '#d1d5db',
    'accent.primary': '#3b82f6',
  };
  return colors[path] || '#000000';
});

describe('ToolbarMenu', () => {
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
    it('应该正确渲染 ToolbarMenu 组件', () => {
      const items = [{ id: '1', label: '菜单项' }];
      render(<ToolbarMenu items={items} />);
      expect(screen.getByText('菜单项')).toBeInTheDocument();
    });

    it('应该水平布局', () => {
      const items = [{ id: '1', label: '菜单项' }];
      const { container } = render(<ToolbarMenu items={items} direction="horizontal" />);
      expect(container.firstChild).toHaveClass('flex-row');
    });

    it('应该垂直布局', () => {
      const items = [{ id: '1', label: '菜单项' }];
      const { container } = render(<ToolbarMenu items={items} direction="vertical" />);
      expect(container.firstChild).toHaveClass('flex-col');
    });
  });

  describe('菜单项交互', () => {
    it('应该点击菜单项触发回调', () => {
      const mockOnClick = vi.fn();
      const items = [{ id: '1', label: '菜单项', onClick: mockOnClick }];
      render(<ToolbarMenu items={items} />);
      
      const menuItem = screen.getByText('菜单项');
      fireEvent.click(menuItem);

      expect(mockOnClick).toHaveBeenCalled();
    });

    it('应该禁用菜单项', () => {
      const mockOnClick = vi.fn();
      const items = [{ id: '1', label: '菜单项', onClick: mockOnClick, disabled: true }];
      render(<ToolbarMenu items={items} />);
      
      const menuItem = screen.getByText('菜单项');
      fireEvent.click(menuItem);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('应该显示图标', () => {
      const items = [{ id: '1', label: '菜单项', icon: '🔍' }];
      render(<ToolbarMenu items={items} />);
      
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });
  });

  describe('子菜单', () => {
    it('应该展开子菜单', () => {
      const items = [
        {
          id: '1',
          label: '父菜单',
          children: [{ id: '2', label: '子菜单' }],
        },
      ];
      render(<ToolbarMenu items={items} />);
      
      const parentMenu = screen.getByText('父菜单');
      fireEvent.click(parentMenu);

      expect(screen.getByText('子菜单')).toBeInTheDocument();
    });

    it('应该折叠子菜单', () => {
      const items = [
        {
          id: '1',
          label: '父菜单',
          children: [{ id: '2', label: '子菜单' }],
        },
      ];
      render(<ToolbarMenu items={items} />);
      
      const parentMenu = screen.getByText('父菜单');
      fireEvent.click(parentMenu);
      fireEvent.click(parentMenu);

      expect(screen.queryByText('子菜单')).not.toBeInTheDocument();
    });
  });

  describe('自定义样式', () => {
    it('应该应用自定义类名', () => {
      const items = [{ id: '1', label: '菜单项' }];
      const { container } = render(<ToolbarMenu items={items} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
