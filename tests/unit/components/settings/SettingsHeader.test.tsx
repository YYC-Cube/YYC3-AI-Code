/**
 * YYC³ AI - SettingsHeader Component Test
 * 
 * @module SettingsHeader.test
 * @description SettingsHeader 组件测试，符合五标-标准化测试
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsHeader } from '@/app/components/settings/SettingsHeader';
import { useThemeStore } from '@/app/stores/theme-store';

// Mock theme store
vi.mock('@/app/stores/theme-store', () => ({
  useThemeStore: vi.fn(),
}));

const mockGetColor = vi.fn((path) => {
  const colors: Record<string, string> = {
    'background.primary': '#ffffff',
    'text.primary': '#000000',
    'text.secondary': '#666666',
    'surface.tertiary': '#e5e5e5',
  };
  return colors[path] || '#000000';
});

describe('SettingsHeader', () => {
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
    it('应该正确渲染 SettingsHeader 组件', () => {
      render(<SettingsHeader title="设置标题" />);
      expect(screen.getByText('设置标题')).toBeInTheDocument();
    });

    it('应该显示描述', () => {
      render(
        <SettingsHeader title="设置标题" description="设置描述" />
      );
      expect(screen.getByText('设置描述')).toBeInTheDocument();
    });

    it('应该不显示返回按钮', () => {
      render(<SettingsHeader title="设置标题" showBackButton={false} />);
      expect(screen.queryByText('←')).not.toBeInTheDocument();
    });
  });

  describe('返回按钮', () => {
    it('应该显示返回按钮', () => {
      render(<SettingsHeader title="设置标题" showBackButton={true} />);
      expect(screen.getByText('←')).toBeInTheDocument();
    });

    it('应该点击返回按钮触发回调', () => {
      const mockOnBack = vi.fn();
      render(
        <SettingsHeader
          title="设置标题"
          showBackButton={true}
          onBack={mockOnBack}
        />
      );
      
      const backButton = screen.getByText('←');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('自定义样式', () => {
    it('应该应用自定义类名', () => {
      const { container } = render(
        <SettingsHeader title="设置标题" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('主题适配', () => {
    it('应该正确应用主题颜色', () => {
      const { container } = render(<SettingsHeader title="设置标题" />);
      expect(mockGetColor).toHaveBeenCalledWith('background.primary');
      expect(mockGetColor).toHaveBeenCalledWith('text.primary');
    });
  });
});
