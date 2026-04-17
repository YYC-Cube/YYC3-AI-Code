/**
 * YYC³ AI - CollaborationPanel Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module CollaborationPanel
 * @description 实时协作面板组件，提供综合协作功能
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../../stores/theme-store';
import { getYjsService, destroyYjsService } from '../../services/yjs/yjs-service';
import { getP2PService, destroyP2PService } from '../../services/p2p/p2p-service';
import { getOfflineService, destroyOfflineService } from '../../services/offline/offline-service';
import { getEdgeComputeService, destroyEdgeComputeService } from '../../services/edge/edge-compute-service';
import { createLogger } from '../../utils/logger';

const log = createLogger('CollaborationPanel');

/**
 * CollaborationPanelProps 接口
 */
interface CollaborationPanelProps {
  docId?: string;
  roomName?: string;
  className?: string;
}

/**
 * CollaborationPanel 组件
 * 
 * @description 提供实时协作面板，整合 Yjs CRDT、P2P 直连、离线模式和边缘计算
 * 
 * @example
 * ```tsx
 * <CollaborationPanel
 *   docId="doc-123"
 *   roomName="room-456"
 * />
 * ```
 */
export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  docId: docIdProp,
  roomName: roomNameProp,
  className = '',
}) => {
  const docId = docIdProp || 'yyc3-default-doc';
  const roomName = roomNameProp || 'yyc3-default-room';
  const { getColor } = useThemeStore();
  
  const isInitializedRef = useRef(false);
  
  // 状态管理
  const [isConnected, setIsConnected] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // 服务实例
  const [yjsService, setYjsService] = useState<any>(null);
  const [p2pService, setP2pService] = useState<any>(null);
  const [offlineService, setOfflineService] = useState<any>(null);
  const [edgeService, setEdgeService] = useState<any>(null);

  /**
   * 初始化服务
   */
  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    try {
      // 初始化 Yjs 服务
      const yjs = getYjsService({
        docId,
        roomName,
        enableWebRTC: true,
        enableIndexedDB: true,
      });
      setYjsService(yjs);

      // 监听连接状态
      const unsubscribeYjs = yjs.onConnectionChange((connected: boolean) => {
        setIsConnected(connected);
      });

      // 初始化 P2P 服务
      const p2p = getP2PService();
      setP2pService(p2p);

      // 监听连接状态
      const unsubscribeP2P = p2p.onConnectionChange((state: any) => {
        setIsConnected(state === 'connected');
      });

      // 初始化离线服务
      const offline = getOfflineService();
      setOfflineService(offline);

      // 监听离线状态
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // 初始化边缘计算服务
      const edge = getEdgeComputeService();
      setEdgeService(edge);

      // 监听性能指标
      const unsubscribeEdge = edge.onPerformanceUpdate((metrics: any) => {
        setPerformanceMetrics(metrics);
      });

      // 清理函数
      return () => {
        unsubscribeYjs();
        unsubscribeP2P();
        unsubscribeEdge();
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        
        destroyYjsService();
        destroyP2PService();
        destroyOfflineService();
        destroyEdgeComputeService();
        isInitializedRef.current = false;
      };
    } catch (error) {
      log.error('Failed to initialize services:', error);
    }
  }, [docId, roomName]);

  /**
   * 渲染连接状态
   */
  const renderConnectionStatus = () => {
    if (isOffline) {
      return (
        <div
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{
            backgroundColor: getColor('error'),
            color: '#ffffff',
          }}
        >
          🔴 离线
        </div>
      );
    }

    if (isConnected) {
      return (
        <div
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{
            backgroundColor: getColor('success'),
            color: '#ffffff',
          }}
        >
          🟢 在线 ({connectedPeers} 位协作者)
        </div>
      );
    }

    return (
      <div
        className="px-3 py-1 rounded-full text-sm font-medium"
        style={{
          backgroundColor: getColor('warning'),
          color: '#ffffff',
        }}
      >
        🟡 连接中...
      </div>
    );
  };

  /**
   * 渲染同步状态
   */
  const renderSyncStatus = () => {
    if (syncStatus === 'synced') {
      return (
        <div className="flex items-center gap-2 text-sm" style={{ color: getColor('success') }}>
          <span>✓</span>
          <span>已同步</span>
        </div>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <div className="flex items-center gap-2 text-sm" style={{ color: getColor('warning') }}>
          <span>⟳</span>
          <span>同步中...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: getColor('error') }}>
        <span>✗</span>
        <span>同步失败</span>
      </div>
    );
  };

  /**
   * 渲染性能指标
   */
  const renderPerformanceMetrics = () => {
    if (!performanceMetrics) {
      return null;
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span style={{ color: getColor('text.secondary') }}>总任务数</span>
          <span style={{ color: getColor('text.primary') }}>{performanceMetrics.totalTasks}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: getColor('text.secondary') }}>成功任务</span>
          <span style={{ color: getColor('success') }}>{performanceMetrics.successfulTasks}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: getColor('text.secondary') }}>失败任务</span>
          <span style={{ color: getColor('error') }}>{performanceMetrics.failedTasks}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: getColor('text.secondary') }}>平均执行时间</span>
          <span style={{ color: getColor('text.primary') }}>{performanceMetrics.averageExecutionTime.toFixed(2)}ms</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{
        backgroundColor: getColor('background.secondary'),
        color: getColor('text.primary'),
      }}
    >
      {/* 标题 */}
      <div className="p-4 border-b" style={{ borderColor: getColor('border.primary') }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">实时协作</h2>
          {renderConnectionStatus()}
        </div>
        <p className="text-sm mt-2" style={{ color: getColor('text.secondary') }}>
          多人协同编辑，实时同步
        </p>
      </div>

      {/* 协作状态 */}
      <div className="p-4 border-b" style={{ borderColor: getColor('border.primary') }}>
        <h3 className="text-lg font-bold mb-3">协作状态</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span style={{ color: getColor('text.secondary') }}>连接状态</span>
            {renderConnectionStatus()}
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: getColor('text.secondary') }}>同步状态</span>
            {renderSyncStatus()}
          </div>
          {isOffline && (
            <div className="flex items-center gap-2 text-sm" style={{ color: getColor('warning') }}>
              <span>⚠️</span>
              <span>当前处于离线模式，更改将在联网后自动同步</span>
            </div>
          )}
        </div>
      </div>

      {/* 性能监控 */}
      <div className="p-4 border-b" style={{ borderColor: getColor('border.primary') }}>
        <h3 className="text-lg font-bold mb-3">性能监控</h3>
        {renderPerformanceMetrics()}
      </div>

      {/* 快捷操作 */}
      <div className="p-4">
        <h3 className="text-lg font-bold mb-3">快捷操作</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              if (offlineService) {
                offlineService.syncWithOnline();
                setSyncStatus('syncing');
                setTimeout(() => setSyncStatus('synced'), 2000);
              }
            }}
            disabled={isOffline}
            className="w-full py-2 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: getColor('accent.primary'),
              color: '#ffffff',
            }}
          >
            手动同步
          </button>
          <button
            onClick={() => {
              if (yjsService) {
                log.info('导出协作数据');
              }
            }}
            className="w-full py-2 rounded-lg font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: getColor('surface.tertiary'),
              color: getColor('text.primary'),
            }}
          >
            导出数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;
