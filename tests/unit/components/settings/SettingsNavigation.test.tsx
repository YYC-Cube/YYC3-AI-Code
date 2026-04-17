/**
 * YYC³ AI - SettingsNavigation Component Test
 * 
 * @module SettingsNavigation.test
 * @description SettingsNavigation 组件测试，符合五标-标准化测试
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsNavigation } from '@/app/components/settings/SettingsNavigation';
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
    'surface.primary': '#ffffff',
    'border.primary': '#d1d5db',
    'accent.primary': '#3b82f6',
  };
  return colors[path] || '#000000';
});

describe('SettingsNavigation', () => {
  const mockItems = [
    {
      id: 'general',
      label: '通用设置',
      description: '配置您的应用偏好',
    },
    {
      id: 'appearance',
      label: '外观设置',
      description: '自定义应用外观',
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
    it('应该正确渲染 SettingsNavigation 组件', () => {
      render(
        <SettingsNavigation
          items={mockItems}
          activeItem="general"
          onItemChange={vi.fn()}
        />
      );
      expect(screen.getByText('通用设置')).toBeInTheDocument();
      expect(screen.getByText('外观设置')).toBeInTheDocument();
    });

    it('应该显示描述', () => {
      render(
        <SettingsNavigation
          items={mockItems}
          activeItem="general"
          onItemChange={vi.fn()}
        />
      );
      expect(screen.getByText('配置您的应用偏好')).toBeInTheDocument();
      expect(screen.getByText('自定义应用外观')).toBeInTheDocument();
    });

    it('应该显示图标', () => {
      const itemsWithIcons = [
        ...mockItems,
        {
          id: 'about',
          label: '关于',
          icon: 'ℹ️',
        },
      ];

      render(
        <SettingsNavigation
          items={itemsWithIcons}
          activeItem="about"
          onItemChange={vi.fn()}
        />
      );
      expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });
  });

  describe('导航项交互', () => {
    it('应该点击导航项触发回调', () => {
      const mockOnItemChange = vi.fn();
      render(
        <SettingsNavigation
          items={mockItems}
          activeItem="general"
          onItemChange={mockOnItemChange}
        />
      );
      
      const navItem = screen.getByText('通用设置');
      fireEvent.click(navItem);

      expect(mockOnItemChange).toHaveBeenCalledWith('general');
    });

    it('应该高亮激活的导航项', () => {
      render(
        <SettingsNavigation
          items={mockItems}
          activeItem="general"
          onItemChange={vi.fn()}
        />
      );
      
      const activeItem = screen.getByText('通用设置').closest('button');
      expect(activeItem).toHaveStyle({ borderWidth: '2px', borderStyle: 'solid' });
    });
  });

  describe('自定义样式', () => {
    it('应该应用自定义类名', () => {
      const { container } = render(
        <SettingsNavigation
          items={mockItems}
          activeItem="general"
          onItemChange={vi.fn()}
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('主题适配', () => {
    it('应该正确应用主题颜色', () => {
      const { container } = render(
        <SettingsNavigation
          items={mockItems}
          activeItem="general"
          onItemChange={vi.fn()}
        />
      );
      expect(mockGetColor).toHaveBeenCalledWith('background.secondary');
      expect(mockGetColor).toHaveBeenCalledWith('text.primary');
    });
  });
});
