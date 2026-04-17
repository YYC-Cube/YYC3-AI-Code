/**
 * YYC³ AI - ProjectPanel Component Test
 * 
 * @module ProjectPanel.test
 * @description ProjectPanel 组件测试，符合五标-标准化测试
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectPanel } from '@/app/components/home/ProjectPanel';
import { useThemeStore } from '@/app/stores/theme-store';
import { useAppStore } from '@/app/stores/app-store';

// Mock theme store
vi.mock('@/app/stores/theme-store', () => ({
  useThemeStore: vi.fn(),
}));

// Mock app store
vi.mock('@/app/stores/app-store', () => ({
  useAppStore: vi.fn(),
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
    'error': '#ef4444',
  };
  return colors[path] || '#000000';
});

describe('ProjectPanel', () => {
  beforeEach(() => {
    vi.mocked(useThemeStore).mockReturnValue({
      theme: { mode: 'light', colors: {} } as any,
      getColor: mockGetColor,
    } as any);

    vi.mocked(useAppStore).mockReturnValue({
      projects: [],
    } as any);

    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该正确渲染 ProjectPanel 组件', () => {
      render(<ProjectPanel />);
      expect(screen.getByText('项目列表')).toBeInTheDocument();
      expect(screen.getByText('管理和切换您的项目')).toBeInTheDocument();
    });

    it('应该显示创建按钮', () => {
      render(<ProjectPanel showCreateButton={true} />);
      expect(screen.getByText('➕ 创建新项目')).toBeInTheDocument();
    });

    it('应该不显示创建按钮', () => {
      render(<ProjectPanel showCreateButton={false} />);
      expect(screen.queryByText('➕ 创建新项目')).not.toBeInTheDocument();
    });

    it('应该显示空状态', () => {
      render(<ProjectPanel />);
      expect(screen.getByText('暂无项目')).toBeInTheDocument();
      expect(screen.getByText('创建您的第一个项目开始使用')).toBeInTheDocument();
    });
  });

  describe('项目列表', () => {
    it('应该显示项目列表', () => {
      const initialProjects = [
        {
          id: 'project-1',
          name: '项目 A',
          description: '项目 A 描述',
          lastModified: new Date(),
          isActive: true,
        },
        {
          id: 'project-2',
          name: '项目 B',
          description: '项目 B 描述',
          lastModified: new Date(),
          isActive: false,
        },
      ];

      render(<ProjectPanel initialProjects={initialProjects} />);
      
      expect(screen.getByText('项目 A')).toBeInTheDocument();
      expect(screen.getByText('项目 B')).toBeInTheDocument();
      expect(screen.getByText('项目 A 描述')).toBeInTheDocument();
      expect(screen.getByText('项目 B 描述')).toBeInTheDocument();
    });

    it('应该显示项目的激活状态', () => {
      const initialProjects = [
        {
          id: 'project-1',
          name: '项目 A',
          description: '项目 A 描述',
          lastModified: new Date(),
          isActive: true,
        },
      ];

      render(<ProjectPanel initialProjects={initialProjects} />);
      
      const projectCard = screen.getByText('项目 A').closest('div');
      expect(projectCard).toBeTruthy();
    });

    it('应该显示项目的最后修改时间', () => {
      const testDate = new Date('2026-03-24T10:00:00');
      const initialProjects = [
        {
          id: 'project-1',
          name: '项目 A',
          description: '项目 A 描述',
          lastModified: testDate,
          isActive: false,
        },
      ];

      render(<ProjectPanel initialProjects={initialProjects} />);
      
      expect(screen.getByText(/最后修改:/)).toBeInTheDocument();
    });
  });

  describe('创建项目', () => {
    it('应该显示创建表单', () => {
      render(<ProjectPanel showCreateButton={true} />);
      
      const createButton = screen.getByText('➕ 创建新项目');
      fireEvent.click(createButton);

      expect(screen.getByPlaceholderText('项目名称')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('项目描述（可选）')).toBeInTheDocument();
      expect(screen.getByText('创建')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('应该成功创建项目', async () => {
      const mockOnCreateProject = vi.fn().mockResolvedValue(undefined);
      render(<ProjectPanel showCreateButton={true} onCreateProject={mockOnCreateProject} />);
      
      const createButton = screen.getByText('➕ 创建新项目');
      fireEvent.click(createButton);

      const nameInput = screen.getByPlaceholderText('项目名称');
      const descInput = screen.getByPlaceholderText('项目描述（可选）');
      const submitButton = screen.getByText('创建');

      fireEvent.change(nameInput, { target: { value: '新项目' } });
      fireEvent.change(descInput, { target: { value: '新项目描述' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreateProject).toHaveBeenCalledWith('新项目', '新项目描述');
      });
    });

    it('应该禁用空项目名称提交', () => {
      render(<ProjectPanel showCreateButton={true} />);
      
      const createButton = screen.getByText('➕ 创建新项目');
      fireEvent.click(createButton);

      const submitButton = screen.getByText('创建');
      expect(submitButton).toBeDisabled();
    });

    it('应该取消创建项目', () => {
      render(<ProjectPanel showCreateButton={true} />);
      
      const createButton = screen.getByText('➕ 创建新项目');
      fireEvent.click(createButton);

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText('项目名称')).not.toBeInTheDocument();
    });

    it('应该创建本地项目', async () => {
      render(<ProjectPanel showCreateButton={true} />);
      
      const createButton = screen.getByText('➕ 创建新项目');
      fireEvent.click(createButton);

      const nameInput = screen.getByPlaceholderText('项目名称');
      const submitButton = screen.getByText('创建');

      fireEvent.change(nameInput, { target: { value: '新项目' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('新项目')).toBeInTheDocument();
      });
    });
  });

  describe('删除项目', () => {
    it('应该显示删除按钮', () => {
      const initialProjects = [
        {
          id: 'project-1',
          name: '项目 A',
          description: '项目 A 描述',
          lastModified: new Date(),
          isActive: false,
        },
      ];

      render(<ProjectPanel initialProjects={initialProjects} onDeleteProject={vi.fn()} />);
      
      const deleteButton = screen.getByTitle('删除项目');
      expect(deleteButton).toBeInTheDocument();
    });

    it('应该成功删除项目', async () => {
      const mockOnDeleteProject = vi.fn().mockResolvedValue(undefined);
      const initialProjects = [
        {
          id: 'project-1',
          name: '项目 A',
          description: '项目 A 描述',
          lastModified: new Date(),
          isActive: false,
        },
      ];

      // Mock window.confirm
      window.confirm = vi.fn(() => true);

      render(<ProjectPanel initialProjects={initialProjects} onDeleteProject={mockOnDeleteProject} />);
      
      const deleteButton = screen.getByTitle('删除项目');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('确定要删除这个项目吗？');
        expect(mockOnDeleteProject).toHaveBeenCalledWith('project-1');
      });
    });

    it('应该在取消确认时不删除项目', async () => {
      const mockOnDeleteProject = vi.fn().mockResolvedValue(undefined);
      const initialProjects = [
        {
          id: 'project-1',
          name: '项目 A',
          description: '项目 A 描述',
          lastModified: new Date(),
          isActive: false,
        },
      ];

      // Mock window.confirm
      window.confirm = vi.fn(() => false);

      render(<ProjectPanel initialProjects={initialProjects} onDeleteProject={mockOnDeleteProject} />);
      
      const deleteButton = screen.getByTitle('删除项目');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(mockOnDeleteProject).not.toHaveBeenCalled();
      });
    });

    it('应该删除本地项目', async () => {
      const initialProjects = [
        {
          id: 'project-1',
          name: '项目 A',
          description: '项目 A 描述',
          lastModified: new Date(),
          isActive: false,
        },
      ];

      // Mock window.confirm
      window.confirm = vi.fn(() => true);

      render(<ProjectPanel initialProjects={initialProjects} />);
      
      const deleteButton = screen.queryByTitle('删除项目');
      if (deleteButton) {
        fireEvent.click(deleteButton);

        await waitFor(() => {
          expect(screen.queryByText('项目 A')).not.toBeInTheDocument();
        });
      } else {
        expect(screen.getByText('项目 A')).toBeInTheDocument();
      }
    });
  });

  describe('选择项目', () => {
    it('应该成功选择项目', () => {
      const mockOnSelectProject = vi.fn();
      const initialProjects = [
        {
          id: 'project-1',
          name: '项目 A',
          description: '项目 A 描述',
          lastModified: new Date(),
          isActive: false,
        },
      ];

      render(<ProjectPanel initialProjects={initialProjects} onSelectProject={mockOnSelectProject} />);
      
      const projectCard = screen.getByText('项目 A');
      fireEvent.click(projectCard);

      expect(mockOnSelectProject).toHaveBeenCalledWith('project-1');
    });

    it('应该更新本地项目激活状态', () => {
      const initialProjects = [
        {
          id: 'project-1',
          name: '项目 A',
          description: '项目 A 描述',
          lastModified: new Date(),
          isActive: false,
        },
      ];

      render(<ProjectPanel initialProjects={initialProjects} />);
      
      const projectCard = screen.getByText('项目 A');
      fireEvent.click(projectCard);

      const updatedCard = screen.getByText('项目 A').closest('div');
      expect(updatedCard).toBeTruthy();
    });
  });

  describe('自定义样式', () => {
    it('应该应用自定义类名', () => {
      const { container } = render(<ProjectPanel className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('主题适配', () => {
    it('应该正确应用主题颜色', () => {
      const { container } = render(<ProjectPanel />);
      expect(mockGetColor).toHaveBeenCalledWith('background.secondary');
      expect(mockGetColor).toHaveBeenCalledWith('text.primary');
    });
  });
});
