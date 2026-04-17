/**
 * YYC³ AI - Collaboration Layout Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module CollaborationLayout
 * @description 协作布局组件，集成所有协作 UI 组件
 * @author YYC³ AI Team
 * @version 3.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { ReactNode } from 'react'
import { CollaborationPanel } from './CollaborationPanel'
import { SyncStatus } from './SyncStatus'
import { OfflineIndicator } from './OfflineIndicator'
import { PerformanceMonitor } from './PerformanceMonitor'

/**
 * 协作布局属性
 */
export interface CollaborationLayoutProps {
  /** 子组件 */
  children?: ReactNode
  /** 是否显示协作面板 */
  showCollaborationPanel?: boolean
  /** 是否显示同步状态 */
  showSyncStatus?: boolean
  /** 是否显示离线指示器 */
  showOfflineIndicator?: boolean
  /** 是否显示性能监控 */
  showPerformanceMonitor?: boolean
}

/**
 * 协作布局组件
 * 
 * @param props 协作布局属性
 * @returns 协作布局组件
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <CollaborationLayout
 *       showCollaborationPanel={true}
 *       showSyncStatus={true}
 *       showOfflineIndicator={true}
 *       showPerformanceMonitor={true}
 *     >
 *       <MainContent />
 *     </CollaborationLayout>
 *   )
 * }
 * ```
 */
export function CollaborationLayout({
  children,
  showCollaborationPanel = true,
  showSyncStatus = true,
  showOfflineIndicator = true,
  showPerformanceMonitor = true,
}: CollaborationLayoutProps) {
  return (
    <div className="relative min-h-screen">
      {/* 协作面板 */}
      {showCollaborationPanel && <CollaborationPanel />}

      {/* 同步状态 */}
      {showSyncStatus && <SyncStatus />}

      {/* 离线指示器 */}
      {showOfflineIndicator && <OfflineIndicator />}

      {/* 性能监控 */}
      {showPerformanceMonitor && <PerformanceMonitor />}

      {/* 主内容 */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  )
}

export default CollaborationLayout
