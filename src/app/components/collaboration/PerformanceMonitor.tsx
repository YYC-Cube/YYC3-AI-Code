/**
 * YYC³ AI - PerformanceMonitor Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module PerformanceMonitor
 * @description 性能监控组件
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../stores/theme-store';
import { getEdgeComputeService } from '../../services/edge/edge-compute-service';

/**
 * PerformanceMonitorProps 接口
 */
interface PerformanceMonitorProps {
  /** 刷新间隔（毫秒） */
  refreshInterval?: number;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * PerformanceMonitor 组件
 * 
 * @description 显示边缘计算性能指标
 * 
 * @example
 * ```tsx
 * <PerformanceMonitor
 *   refreshInterval={1000}
 *   showDetails={true}
 * />
 * ```
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  refreshInterval = 1000,
  showDetails = false,
  className = '',
}) => {
  const { getColor } = useThemeStore();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const edgeService = getEdgeComputeService();
    
    // 立即获取一次
    setMetrics(edgeService.getPerformanceMetrics());

    // 定期刷新
    const interval = setInterval(() => {
      setMetrics(edgeService.getPerformanceMetrics());
    }, refreshInterval);

    // 监听性能更新
    const unsubscribe = edgeService.onPerformanceUpdate((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [refreshInterval]);

  if (!metrics) {
    return null;
  }

  const successRate = metrics.totalTasks > 0
    ? ((metrics.successfulTasks / metrics.totalTasks) * 100).toFixed(1)
    : '0.0';

  return (
    <div
      className={`p-4 rounded-lg ${className}`}
      style={{
        backgroundColor: getColor('surface.primary'),
        color: getColor('text.primary'),
        border: `1px solid ${getColor('border.primary')}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">性能监控</h3>
        <div
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{
            backgroundColor: parseFloat(successRate) > 90
              ? getColor('success')
              : parseFloat(successRate) > 70
              ? getColor('warning')
              : getColor('error'),
            color: '#ffffff',
          }}
        >
          {successRate}% 成功率
        </div>
      </div>

      {showDetails && (
        <div className="space-y-3">
          <div className="flex justify-between">
            <span style={{ color: getColor('text.secondary') }}>总任务数</span>
            <span className="font-medium">{metrics.totalTasks}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: getColor('text.secondary') }}>成功任务</span>
            <span className="font-medium" style={{ color: getColor('success') }}>
              {metrics.successfulTasks}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: getColor('text.secondary') }}>失败任务</span>
            <span className="font-medium" style={{ color: getColor('error') }}>
              {metrics.failedTasks}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: getColor('text.secondary') }}>平均执行时间</span>
            <span className="font-medium">
              {metrics.averageExecutionTime.toFixed(2)}ms
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: getColor('text.secondary') }}>活跃 Workers</span>
            <span className="font-medium">{metrics.activeWorkers}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: getColor('text.secondary') }}>队列中任务</span>
            <span className="font-medium">{metrics.queuedTasks}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
