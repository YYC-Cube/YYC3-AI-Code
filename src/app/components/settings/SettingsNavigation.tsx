/**
 * YYC³ AI - SettingsNavigation Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module SettingsNavigation
 * @description 设置导航组件，提供设置页面的导航菜单
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import React from 'react';
import { useThemeStore } from '../../stores/theme-store';

/**
 * NavItem 接口
 */
interface NavItem {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

/**
 * SettingsNavigationProps 接口
 */
interface SettingsNavigationProps {
  /** 导航项列表 */
  items: NavItem[];
  /** 当前选中的导航项 */
  activeItem: string;
  /** 导航项点击回调 */
  onItemChange: (itemId: string) => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * SettingsNavigation 组件
 * 
 * @description 提供设置页面导航界面，支持导航项选择和切换
 * 
 * @example
 * ```tsx
 * <SettingsNavigation
 *   items={navItems}
 *   activeItem="general"
 *   onItemChange={(itemId) => setActiveItem(itemId)}
 * />
 * ```
 */
export const SettingsNavigation: React.FC<SettingsNavigationProps> = ({
  items,
  activeItem,
  onItemChange,
  className = '',
}) => {
  const { theme, getColor } = useThemeStore();

  /**
   * 渲染导航项
   */
  const renderNavItem = (item: NavItem) => {
    const isActive = activeItem === item.id;

    return (
      <button
        key={item.id}
        onClick={() => onItemChange(item.id)}
        className={`
          w-full text-left p-4 rounded-lg transition-all hover:scale-105
          ${isActive ? 'ring-2' : ''}
        `}
        style={{
          backgroundColor: getColor('surface.primary'),
          color: getColor('text.primary'),
          borderColor: isActive ? getColor('accent.primary') : 'transparent',
          borderWidth: '2px',
          borderStyle: isActive ? 'solid' : 'none',
        }}
      >
        <div className="flex items-center gap-3">
          {item.icon && <span className="text-2xl">{item.icon}</span>}
          <div className="flex-1">
            <h3 className="font-bold">{item.label}</h3>
            {item.description && (
              <p
                className="text-sm mt-1"
                style={{ color: getColor('text.secondary') }}
              >
                {item.description}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      className={`flex flex-col gap-3 ${className}`}
      style={{
        backgroundColor: getColor('background.secondary'),
        color: getColor('text.primary'),
      }}
    >
      {items.map(renderNavItem)}
    </div>
  );
};

export default SettingsNavigation;
