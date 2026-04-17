/**
 * YYC³ AI - ProjectPanel Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module ProjectPanel
 * @description 项目面板组件，提供项目管理和导航
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import React, { useState } from 'react';
import { useThemeStore } from '../../stores/theme-store';
import { useAppStore } from '../../stores/app-store';
import { createLogger } from '../../utils/logger';

const log = createLogger('ProjectPanel');

/**
 * Project 接口
 */
interface Project {
  id: string;
  name: string;
  description?: string;
  lastModified: Date;
  isActive?: boolean;
}

/**
 * ProjectPanelProps 接口
 */
interface ProjectPanelProps {
  /** 初始项目列表 */
  initialProjects?: Project[];
  /** 创建项目回调 */
  onCreateProject?: (name: string, description?: string) => Promise<void>;
  /** 删除项目回调 */
  onDeleteProject?: (projectId: string) => Promise<void>;
  /** 切换项目回调 */
  onSelectProject?: (projectId: string) => void;
  /** 是否显示创建按钮 */
  showCreateButton?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * ProjectPanel 组件
 * 
 * @description 提供项目管理和导航界面，支持创建、删除、切换项目等功能
 * 
 * @example
 * ```tsx
 * <ProjectPanel
 *   initialProjects={projects}
 *   onCreateProject={handleCreateProject}
 *   onDeleteProject={handleDeleteProject}
 *   onSelectProject={handleSelectProject}
 *   showCreateButton={true}
 * />
 * ```
 */
export const ProjectPanel: React.FC<ProjectPanelProps> = ({
  initialProjects = [],
  onCreateProject,
  onDeleteProject,
  onSelectProject,
  showCreateButton = true,
  className = '',
}) => {
  const { theme, getColor } = useThemeStore();
  const { projects } = useAppStore();
  const [localProjects, setLocalProjects] = useState<Project[]>(initialProjects);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  /**
   * 获取显示的项目列表
   */
  const displayProjects = projects.length > 0 ? projects : localProjects;

  /**
   * 处理创建项目
   */
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      if (onCreateProject) {
        await onCreateProject(newProjectName, newProjectDescription);
      } else {
        const newProject: Project = {
          id: `project-${Date.now()}`,
          name: newProjectName,
          description: newProjectDescription,
          lastModified: new Date(),
          isActive: false,
        };
        setLocalProjects((prev) => [...prev, newProject]);
      }
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateForm(false);
    } catch (error) {
      log.error('创建项目失败:', error);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * 处理删除项目
   */
  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('确定要删除这个项目吗？')) {
      return;
    }

    try {
      if (onDeleteProject) {
        await onDeleteProject(projectId);
      } else {
        setLocalProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } catch (error) {
      log.error('删除项目失败:', error);
    }
  };

  /**
   * 处理选择项目
   */
  const handleSelectProject = (projectId: string) => {
    if (onSelectProject) {
      onSelectProject(projectId);
    } else {
      setLocalProjects((prev) =>
        prev.map((p) => ({
          ...p,
          isActive: p.id === projectId,
        }))
      );
    }
  };

  /**
   * 渲染项目卡片
   */
  const renderProjectCard = (project: Project) => (
    <div
      key={project.id}
      className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-105 ${
        project.isActive ? 'ring-2' : ''
      }`}
      style={{
        backgroundColor: getColor('surface.primary'),
        color: getColor('text.primary'),
        borderColor: project.isActive ? getColor('accent.primary') : getColor('border.primary'),
        borderWidth: '2px',
        borderStyle: project.isActive ? 'solid' : 'none',
      }}
      onClick={() => handleSelectProject(project.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">{project.name}</h3>
        {onDeleteProject && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProject(project.id);
            }}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="删除项目"
          >
            🗑️
          </button>
        )}
      </div>
      {project.description && (
        <p className="text-sm mb-2" style={{ color: getColor('text.secondary') }}>
          {project.description}
        </p>
      )}
      <div className="text-xs" style={{ color: getColor('text.tertiary') }}>
        最后修改: {project.lastModified.toLocaleString()}
      </div>
    </div>
  );

  return (
    <div
      className={`h-full flex flex-col ${className}`}
      style={{
        backgroundColor: getColor('background.secondary'),
        color: getColor('text.primary'),
      }}
    >
      {/* 标题 */}
      <div className="p-4 border-b" style={{ borderColor: getColor('border.primary') }}>
        <h2 className="text-xl font-bold">项目列表</h2>
        <p className="text-sm" style={{ color: getColor('text.secondary') }}>
          管理和切换您的项目
        </p>
      </div>

      {/* 项目列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayProjects.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">📁</div>
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: getColor('text.primary') }}
            >
              暂无项目
            </h3>
            <p className="text-sm" style={{ color: getColor('text.secondary') }}>
              创建您的第一个项目开始使用
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayProjects.map((project: any) => renderProjectCard(project))}
          </div>
        )}
      </div>

      {/* 创建按钮/表单 */}
      {showCreateButton && (
        <div className="p-4 border-t" style={{ borderColor: getColor('border.primary') }}>
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-3 rounded-lg font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: getColor('accent.primary'),
                color: '#ffffff',
              }}
            >
              ➕ 创建新项目
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="项目名称"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: getColor('surface.primary'),
                  color: getColor('text.primary'),
                  borderColor: getColor('border.primary'),
                }}
              />
              <textarea
                placeholder="项目描述（可选）"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: getColor('surface.primary'),
                  color: getColor('text.primary'),
                  borderColor: getColor('border.primary'),
                  minHeight: '80px',
                }}
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProject}
                  disabled={isCreating || !newProjectName.trim()}
                  className="flex-1 py-2 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: getColor('accent.primary'),
                    color: '#ffffff',
                  }}
                >
                  {isCreating ? '创建中...' : '创建'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewProjectName('');
                    setNewProjectDescription('');
                  }}
                  className="flex-1 py-2 rounded-lg font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: getColor('surface.tertiary'),
                    color: getColor('text.primary'),
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectPanel;
