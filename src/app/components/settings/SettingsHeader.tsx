/**
 * YYC³ AI - SettingsHeader Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module SettingsHeader
 * @description 设置页面头部组件，提供标题和描述
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import React from 'react';
import { useThemeStore } from '../../stores/theme-store';

/**
 * SettingsHeaderProps 接口
 */
interface SettingsHeaderProps {
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 是否显示返回按钮 */
  showBackButton?: boolean;
  /** 返回按钮点击回调 */
  onBack?: () => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * SettingsHeader 组件
 * 
 * @description 提供设置页面头部界面，支持标题、描述和返回按钮
 * 
 * @example
 * ```tsx
 * <SettingsHeader
 *   title="通用设置"
 *   description="配置您的应用偏好"
 *   showBackButton={true}
 *   onBack={() => navigate(-1)}
 * />
 * ```
 */
export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title,
  description,
  showBackButton = false,
  onBack,
  className = '',
}) => {
  const { theme, getColor } = useThemeStore();

  return (
    <div
      className={`flex items-center gap-4 ${className}`}
      style={{
        backgroundColor: getColor('background.primary'),
        color: getColor('text.primary'),
      }}
    >
      {/* 返回按钮 */}
      {showBackButton && (
        <button
          onClick={onBack}
          className="p-2 rounded-lg transition-all hover:scale-105"
          style={{
            backgroundColor: getColor('surface.tertiary'),
            color: getColor('text.primary'),
          }}
          title="返回"
        >
          ←
        </button>
      )}

      {/* 标题和描述 */}
      <div className="flex-1">
        <h1
          className="text-2xl font-bold"
          style={{ color: getColor('text.primary') }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="text-sm mt-1"
            style={{ color: getColor('text.secondary') }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default SettingsHeader;
