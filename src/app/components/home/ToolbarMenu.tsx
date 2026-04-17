/**
 * YYC³ AI - ToolbarMenu Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module ToolbarMenu
 * @description 工具栏菜单组件，提供快捷操作和功能入口
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import React, { useState } from 'react';
import { useThemeStore } from '../../stores/theme-store';

/**
 * MenuItem 接口
 */
interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick?: () => void;
  children?: MenuItem[];
  disabled?: boolean;
}

/**
 * ToolbarMenuProps 接口
 */
interface ToolbarMenuProps {
  /** 菜单项列表 */
  items: MenuItem[];
  /** 方向 */
  direction?: 'horizontal' | 'vertical';
  /** 自定义样式类名 */
  className?: string;
}

/**
 * ToolbarMenu 组件
 * 
 * @description 提供工具栏菜单界面，支持快捷操作和功能入口
 * 
 * @example
 * ```tsx
 * <ToolbarMenu
 *   items={menuItems}
 *   direction="horizontal"
 * />
 * ```
 */
export const ToolbarMenu: React.FC<ToolbarMenuProps> = ({
  items,
  direction = 'horizontal',
  className = '',
}) => {
  const { theme, getColor } = useThemeStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  /**
   * 处理菜单项点击
   */
  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) {
      return;
    }

    if (item.children) {
      setOpenMenu(openMenu === item.id ? null : item.id);
    } else if (item.onClick) {
      item.onClick();
      setOpenMenu(null);
    }
  };

  /**
   * 渲染菜单项
   */
  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenu === item.id;

    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105
            ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${direction === 'horizontal' ? 'whitespace-nowrap' : ''}
          `}
          style={{
            backgroundColor: getColor('surface.primary'),
            color: getColor('text.primary'),
          }}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
          {hasChildren && <span>{isOpen ? '▼' : '▶'}</span>}
        </button>
        
        {hasChildren && isOpen && (
          <div
            className={`
              absolute z-50 rounded-lg shadow-lg overflow-hidden
              ${direction === 'horizontal' ? 'top-full left-0 mt-1' : 'left-full top-0 ml-1'}
            `}
            style={{
              backgroundColor: getColor('surface.primary'),
              border: `1px solid ${getColor('border.primary')}`,
            }}
          >
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`
        flex ${direction === 'horizontal' ? 'flex-row gap-2' : 'flex-col gap-1'}
        ${className}
      `}
      style={{
        backgroundColor: getColor('background.secondary'),
        color: getColor('text.primary'),
      }}
    >
      {items.map((item) => renderMenuItem(item))}
    </div>
  );
};

export default ToolbarMenu;
