import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityBar } from '../../app/components/ai-code/ActivityBar';
import type { ActivityView } from '../../app/components/ai-code/ActivityBar';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  FolderOpen: ({ size, className }: any) => <div data-testid="FolderOpen" data-size={size} className={className}>Folder</div>,
  Search: ({ size, className }: any) => <div data-testid="Search" data-size={size} className={className}>Search</div>,
  GitBranch: ({ size, className }: any) => <div data-testid="GitBranch" data-size={size} className={className}>Git</div>,
  Bug: ({ size, className }: any) => <div data-testid="Bug" data-size={size} className={className}>Bug</div>,
  Play: ({ size, className }: any) => <div data-testid="Play" data-size={size} className={className}>Play</div>,
  Puzzle: ({ size, className }: any) => <div data-testid="Puzzle" data-size={size} className={className}>Puzzle</div>,
  Bot: ({ size, className }: any) => <div data-testid="Bot" data-size={size} className={className}>Bot</div>,
  Database: ({ size, className }: any) => <div data-testid="Database" data-size={size} className={className}>Database</div>,
  Sparkles: ({ size, className }: any) => <div data-testid="Sparkles" data-size={size} className={className}>Sparkles</div>,
  AppWindow: ({ size, className }: any) => <div data-testid="AppWindow" data-size={size} className={className}>AppWindow</div>,
  Settings: ({ size }: any) => <div data-testid="Settings" data-size={size}>Settings</div>,
}));

describe('ActivityBar — 活动栏组件', () => {
  const mockOnViewChange = vi.fn();

  const renderComponent = (activeView: ActivityView = 'files') => {
    return render(
      <ActivityBar activeView={activeView} onViewChange={mockOnViewChange} />
    );
  };

  describe('渲染测试', () => {
    it('TC-ACT-001: 应该渲染所有预定义的活动按钮', () => {
      renderComponent();
      expect(screen.getByTestId('FolderOpen')).toBeInTheDocument();
      expect(screen.getByTestId('Search')).toBeInTheDocument();
      expect(screen.getByTestId('Sparkles')).toBeInTheDocument(); // Generator
    });

    it('TC-ACT-002: 应该渲染底部的 "设置" 按钮', () => {
      renderComponent();
      expect(screen.getByTestId('Settings')).toBeInTheDocument();
    });
  });

  describe('交互与导航测试', () => {
    it('TC-ACT-010: 点击 "Sparkles" (AI Generator) 按钮应该调用 onViewChange("generator")', () => {
      renderComponent();
      
      const button = screen.getByTestId('Sparkles').closest('button');
      expect(button).toBeInTheDocument();
      
      if (button) {
        button.click();
        expect(mockOnViewChange).toHaveBeenCalledWith('generator');
      }
    });

    it('TC-ACT-011: 当 activeView 为 "generator" 时，Sparkles 按钮应该高亮', () => {
      renderComponent('generator');
      
      const button = screen.getByTestId('Sparkles').closest('button');
      expect(button).toHaveClass('bg-white/[0.08]', 'text-white/90');
    });

    it('TC-ACT-012: 当 activeView 不为 "generator" 时，Sparkles 按钮应该是灰色', () => {
      renderComponent('files');
      
      const button = screen.getByTestId('Sparkles').closest('button');
      expect(button).toHaveClass('text-white/30');
    });
  });
});
