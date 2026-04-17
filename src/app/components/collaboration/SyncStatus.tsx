/**
 * YYC³ AI - SyncStatus Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module SyncStatus
 * @description 同步状态指示器组件
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import React from 'react';
import { useThemeStore } from '../../stores/theme-store';

/**
 * SyncStatusProps 接口
 */
interface SyncStatusProps {
  /** 同步状态 */
  status?: 'synced' | 'syncing' | 'error';
  /** 同步时间 */
  lastSync?: Date;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * SyncStatus 组件
 * 
 * @description 显示同步状态指示器
 * 
 * @example
 * ```tsx
 * <SyncStatus
 *   status="synced"
 *   lastSync={new Date()}
 * />
 * ```
 */
export const SyncStatus: React.FC<SyncStatusProps> = ({
  status: statusProp,
  lastSync,
  className = '',
}) => {
  const status = statusProp || 'synced';
  const { getColor } = useThemeStore();

  const statusConfig = {
    synced: {
      icon: '✓',
      text: '已同步',
      color: getColor('success'),
    },
    syncing: {
      icon: '⟳',
      text: '同步中...',
      color: getColor('warning'),
    },
    error: {
      icon: '✗',
      text: '同步失败',
      color: getColor('error'),
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      style={{ color: getColor('text.primary') }}
    >
      <div
        className="flex items-center justify-center w-6 h-6 rounded-full"
        style={{
          backgroundColor: config.color,
          color: '#ffffff',
        }}
      >
        {config.icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium" style={{ color: config.color }}>
          {config.text}
        </span>
        {lastSync && status === 'synced' && (
          <span className="text-xs" style={{ color: getColor('text.secondary') }}>
            最后同步: {lastSync.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default SyncStatus;
