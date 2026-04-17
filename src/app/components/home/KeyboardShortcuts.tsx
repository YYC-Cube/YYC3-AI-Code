/**
 * YYC³ AI - KeyboardShortcuts Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module KeyboardShortcuts
 * @description 键盘快捷键组件，显示和提示键盘快捷键
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../stores/theme-store';

/**
 * Shortcut 接口
 */
interface Shortcut {
  id: string;
  keys: string[];
  description: string;
  category?: string;
}

/**
 * KeyboardShortcutsProps 接口
 */
interface KeyboardShortcutsProps {
  /** 快捷键列表 */
  shortcuts: Shortcut[];
  /** 是否显示 */
  visible?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * KeyboardShortcuts 组件
 * 
 * @description 显示键盘快捷键列表，支持分类和搜索
 * 
 * @example
 * ```tsx
 * <KeyboardShortcuts
 *   shortcuts={shortcuts}
 *   visible={true}
 * />
 * ```
 */
export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  shortcuts,
  visible = true,
  className = '',
}) => {
  const { theme, getColor } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  /**
   * 获取所有分类
   */
  const categories = Array.from(
    new Set(shortcuts.map((s) => s.category).filter(Boolean))
  ) as string[];

  /**
   * 过滤快捷键
   */
  const filteredShortcuts = shortcuts.filter((shortcut) => {
    const matchesSearch =
      searchTerm === '' ||
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.keys.some((key: string) =>
        key.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === null || shortcut.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  /**
   * 按分类分组快捷键
   */
  const groupedShortcuts = filteredShortcuts.reduce<Record<string, Shortcut[]>>(
    (acc, shortcut) => {
      const category = shortcut.category || '其他';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    },
    {}
  );

  /**
   * 渲染按键
   */
  const renderKey = (key: string, index: number) => (
    <React.Fragment key={key}>
      <kbd
        className="px-2 py-1 rounded font-mono text-sm"
        style={{
          backgroundColor: getColor('surface.tertiary'),
          color: getColor('text.primary'),
          border: `1px solid ${getColor('border.primary')}`,
        }}
      >
        {key}
      </kbd>
      {index < shortcuts.keys.length - 1 && <span className="mx-1">+</span>}
    </React.Fragment>
  );

  /**
   * 渲染快捷键卡片
   */
  const renderShortcutCard = (shortcut: Shortcut) => (
    <div
      key={shortcut.id}
      className="p-3 rounded-lg flex justify-between items-center"
      style={{
        backgroundColor: getColor('surface.primary'),
        color: getColor('text.primary'),
      }}
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{shortcut.description}</p>
        {shortcut.category && (
          <p className="text-xs mt-1" style={{ color: getColor('text.secondary') }}>
            {shortcut.category}
          </p>
        )}
      </div>
      <div className="flex gap-1 ml-4">{shortcut.keys.map(renderKey)}</div>
    </div>
  );

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        backgroundColor: getColor('background.secondary'),
        color: getColor('text.primary'),
      }}
    >
      {/* 标题 */}
      <div className="p-4 border-b" style={{ borderColor: getColor('border.primary') }}>
        <h2 className="text-xl font-bold mb-2">键盘快捷键</h2>
        <p className="text-sm" style={{ color: getColor('text.secondary') }}>
          提高您的工作效率
        </p>
      </div>

      {/* 搜索框 */}
      <div className="p-4">
        <input
          type="text"
          placeholder="搜索快捷键..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
          style={{
            backgroundColor: getColor('surface.primary'),
            color: getColor('text.primary'),
            borderColor: getColor('border.primary'),
          }}
        />
      </div>

      {/* 分类筛选 */}
      {categories.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                selectedCategory === null ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor:
                  selectedCategory === null
                    ? getColor('accent.primary')
                    : getColor('surface.tertiary'),
                color: selectedCategory === null ? '#ffffff' : getColor('text.primary'),
              }}
            >
              全部
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  selectedCategory === category ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor:
                    selectedCategory === category
                      ? getColor('accent.primary')
                      : getColor('surface.tertiary'),
                  color:
                    selectedCategory === category
                      ? '#ffffff'
                      : getColor('text.primary'),
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 快捷键列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredShortcuts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: getColor('text.primary') }}
            >
              未找到快捷键
            </h3>
            <p className="text-sm" style={{ color: getColor('text.secondary') }}>
              请尝试其他搜索关键词
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <div key={category}>
                <h3
                  className="text-sm font-bold mb-2"
                  style={{ color: getColor('text.secondary') }}
                >
                  {category}
                </h3>
                {shortcuts.map(renderShortcutCard)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
