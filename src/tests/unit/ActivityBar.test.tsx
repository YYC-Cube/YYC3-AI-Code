import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityBar } from '../../app/components/ai-code/ActivityBar';
import type { ActivityView } from '../../app/components/ai-code/ActivityBar';

describe('ActivityBar — 活动栏组件', () => {
  const mockOnViewChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染测试', () => {
    it('TC-AB-001: 应该正确渲染活动栏', () => {
      render(<ActivityBar activeView="files" onViewChange={mockOnViewChange} />);
      
      const container = document.querySelector('.w-11.flex.flex-col');
      expect(container).toBeInTheDocument();
    });

    it('TC-AB-002: 应该渲染所有活动按钮', () => {
      render(<ActivityBar activeView="files" onViewChange={mockOnViewChange} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10);
    });
  });

  describe('交互测试', () => {
    it('TC-AB-040: 点击活动按钮应该调用 onViewChange', () => {
      render(<ActivityBar activeView="files" onViewChange={mockOnViewChange} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]);
      
      expect(mockOnViewChange).toHaveBeenCalledWith('search');
    });

    it('TC-AB-041: 点击 git 按钮应该调用 onViewChange', () => {
      render(<ActivityBar activeView="files" onViewChange={mockOnViewChange} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[2]);
      
      expect(mockOnViewChange).toHaveBeenCalledWith('git');
    });

    it('TC-AB-042: 点击 ai 按钮应该调用 onViewChange', () => {
      render(<ActivityBar activeView="files" onViewChange={mockOnViewChange} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[7]);
      
      expect(mockOnViewChange).toHaveBeenCalledWith('ai');
    });

    it('TC-AB-043: 点击 multi-instance 按钮应该调用 onViewChange', () => {
      render(<ActivityBar activeView="files" onViewChange={mockOnViewChange} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[8]);
      
      expect(mockOnViewChange).toHaveBeenCalledWith('multi-instance');
    });
  });

  describe('边界条件测试', () => {
    it('TC-AB-060: 应该处理所有的活动视图类型', () => {
      const views: ActivityView[] = [
        'files', 'search', 'git', 'debug', 'extensions', 
        'ai', 'database', 'run', 'multi-instance'
      ];
      
      views.forEach((view) => {
        const { unmount } = render(
          <ActivityBar activeView={view} onViewChange={mockOnViewChange} />
        );
        
        const container = document.querySelector('.w-11.flex.flex-col');
        expect(container).toBeInTheDocument();
        
        unmount();
      });
    });
  });
});
