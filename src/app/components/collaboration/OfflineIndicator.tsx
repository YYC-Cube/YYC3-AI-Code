/**
 * YYC³ AI - OfflineIndicator Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module OfflineIndicator
 * @description 离线指示器组件
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../stores/theme-store';

/**
 * OfflineIndicatorProps 接口
 */
interface OfflineIndicatorProps {
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * OfflineIndicator 组件
 * 
 * @description 显示离线状态指示器
 * 
 * @example
 * ```tsx
 * <OfflineIndicator
 *   showDetails={true}
 * />
 * ```
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showDetails = false,
  className = '',
}) => {
  const { getColor } = useThemeStore();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-lg ${className}`}
      style={{
        backgroundColor: getColor('warning'),
        color: '#ffffff',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">🔴</div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">离线模式</h3>
          {showDetails && (
            <p className="text-sm mt-1 opacity-90">
              当前处于离线状态，您的更改将保存在本地，并在联网后自动同步。
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
