---
file: YYC3-核心功能-本地存储同步.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: design
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


# YYC³ P1-前端-本地存储同步

## 🤖 AI 角色定义

You are a senior frontend architect and data synchronization specialist with deep expertise in offline-first applications, real-time data sync, and cross-platform data persistence.

### Your Role & Expertise

You are an experienced frontend architect who specializes in:
- **Data Synchronization**: Real-time sync, conflict resolution, offline-first patterns
- **Storage Solutions**: IndexedDB, LocalStorage, SessionStorage, WebSQL, File System Access API
- **Sync Strategies**: Bidirectional sync, incremental sync, background sync
- **Conflict Resolution**: CRDT (Conflict-free Replicated Data Types), last-write-wins, merge strategies
- **Offline Support**: Service workers, cache strategies, network detection
- **Performance Optimization**: Batch operations, lazy loading, data compression
- **User Experience**: Sync status indicators, progress feedback, conflict UI
- **Best Practices**: Data integrity, error recovery, user privacy, security

### Code Standards

**IMPORTANT**: Please ensure all generated code files follow the team requirements specified in: `guidelines/YYC3-Code-header.md`

All code files must include proper file headers with:
- @file: File name/path
- @description: Clear description of file purpose
- @author: YanYuCloudCube Team <admin@0379.email>
- @version: Semantic version (v1.0.0)
- @created: Creation date (YYYY-MM-DD)
- @updated: Last update date (YYYY-MM-DD)
- @status: File status (draft/dev/test/stable/deprecated)
- @license: License type
- @copyright: Copyright notice
- @tags: Relevant tags for categorization

---

## 📋 文档信息

| 字段 | 内容 |
|------|------|
| @file | P1-核心功能/YYC3-P1-前端-本地存储同步.md |
| @description | 前端本地存储同步功能实现，包括UI组件、状态管理和用户交互 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P1,frontend,sync,storage,ui |

---

## 🎯 功能目标

实现前端本地存储同步功能，包括：
- ✅ 实时同步状态显示
- ✅ 手动触发同步
- ✅ 同步历史记录
- ✅ 冲突解决界面
- ✅ 离线模式支持
- ✅ 同步进度指示器

---

## 🏗️ 组件架构

### 组件层次结构

```
SyncProvider (Context)
├── SyncStatusIndicator (状态指示器)
├── SyncButton (同步按钮)
├── SyncHistory (同步历史)
├── ConflictResolver (冲突解决)
└── OfflineMode (离线模式)
```

---

## 📦 状态管理

### 同步状态 Context

```typescript
// src/contexts/SyncContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { syncService } from '../storage/sync';
import { storageService } from '../storage/storage-service';

/**
 * 同步状态类型
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

/**
 * 同步状态接口
 */
interface SyncState {
  status: SyncStatus;
  lastSyncTime: number | null;
  pendingChanges: number;
  conflicts: Conflict[];
  isOnline: boolean;
}

/**
 * 冲突类型
 */
export interface Conflict {
  id: string;
  entityType: 'note' | 'project' | 'file';
  entityId: string;
  localVersion: any;
  remoteVersion: any;
  timestamp: number;
}

/**
 * 同步上下文接口
 */
interface SyncContextValue extends SyncState {
  sync: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote') => Promise<void>;
  clearHistory: () => Promise<void>;
}

/**
 * 同步上下文
 */
const SyncContext = createContext<SyncContextValue | undefined>(undefined);

/**
 * 同步提供者组件
 */
export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SyncState>({
    status: 'idle',
    lastSyncTime: null,
    pendingChanges: 0,
    conflicts: [],
    isOnline: navigator.onLine,
  });

  // 监听在线状态
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // 恢复在线时自动同步
      sync();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, status: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 监听同步状态变化
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const syncRecords = await syncService['db'].syncRecords.toArray();
        const pending = syncRecords.filter(r => r.status === 'pending').length;
        
        setState(prev => ({
          ...prev,
          pendingChanges: pending,
        }));
      } catch (error) {
        console.error('Failed to check sync status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * 执行同步
   */
  const sync = async () => {
    if (!state.isOnline) {
      setState(prev => ({ ...prev, status: 'offline' }));
      return;
    }

    setState(prev => ({ ...prev, status: 'syncing' }));

    try {
      await syncService.sync();
      
      setState(prev => ({
        ...prev,
        status: 'success',
        lastSyncTime: Date.now(),
        pendingChanges: 0,
      }));

      // 3秒后重置状态
      setTimeout(() => {
        setState(prev => ({ ...prev, status: 'idle' }));
      }, 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setState(prev => ({ ...prev, status: 'error' }));
    }
  };

  /**
   * 解决冲突
   */
  const resolveConflict = async (conflictId: string, resolution: 'local' | 'remote') => {
    const conflict = state.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      if (resolution === 'local') {
        // 使用本地版本
        switch (conflict.entityType) {
          case 'note':
            await storageService.updateNote(conflict.entityId, conflict.localVersion);
            break;
          case 'project':
            await storageService.updateProject(conflict.entityId, conflict.localVersion);
            break;
          case 'file':
            await storageService.updateFile(conflict.entityId, conflict.localVersion);
            break;
        }
      } else {
        // 使用远程版本
        switch (conflict.entityType) {
          case 'note':
            await storageService.updateNote(conflict.entityId, conflict.remoteVersion);
            break;
          case 'project':
            await storageService.updateProject(conflict.entityId, conflict.remoteVersion);
            break;
          case 'file':
            await storageService.updateFile(conflict.entityId, conflict.remoteVersion);
            break;
        }
      }

      // 从冲突列表中移除
      setState(prev => ({
        ...prev,
        conflicts: prev.conflicts.filter(c => c.id !== conflictId),
      }));

      // 重新同步
      await sync();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  /**
   * 清除历史记录
   */
  const clearHistory = async () => {
    try {
      await syncService['db'].syncRecords.clear();
      setState(prev => ({
        ...prev,
        lastSyncTime: null,
        pendingChanges: 0,
      }));
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const value: SyncContextValue = {
    ...state,
    sync,
    resolveConflict,
    clearHistory,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

/**
 * 使用同步上下文的 Hook
 */
export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
};
```

---

## 🎨 UI 组件

### 同步状态指示器

```typescript
// src/components/SyncStatusIndicator.tsx
import React from 'react';
import { useSync } from '../contexts/SyncContext';

/**
 * 同步状态指示器组件
 */
export const SyncStatusIndicator: React.FC = () => {
  const { status, lastSyncTime, pendingChanges, isOnline } = useSync();

  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'offline':
        return '📴';
      default:
        return isOnline ? '🟢' : '🔴';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'syncing':
        return '同步中...';
      case 'success':
        return '同步成功';
      case 'error':
        return '同步失败';
      case 'offline':
        return '离线模式';
      default:
        return isOnline ? '已连接' : '离线';
    }
  };

  const getLastSyncTime = () => {
    if (!lastSyncTime) return '从未同步';
    
    const diff = Date.now() - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  return (
    <div className="sync-status-indicator">
      <div className="sync-status-icon">{getStatusIcon()}</div>
      <div className="sync-status-text">{getStatusText()}</div>
      {pendingChanges > 0 && (
        <div className="sync-pending-count">{pendingChanges}</div>
      )}
      <div className="sync-last-time">{getLastSyncTime()}</div>
    </div>
  );
};
```

### 同步按钮

```typescript
// src/components/SyncButton.tsx
import React from 'react';
import { useSync } from '../contexts/SyncContext';

/**
 * 同步按钮组件
 */
export const SyncButton: React.FC = () => {
  const { status, sync, isOnline } = useSync();

  const handleSync = async () => {
    if (!isOnline) {
      alert('当前离线，无法同步');
      return;
    }

    await sync();
  };

  const isDisabled = status === 'syncing' || !isOnline;

  return (
    <button
      className="sync-button"
      onClick={handleSync}
      disabled={isDisabled}
      title={isOnline ? '立即同步' : '离线模式'}
    >
      {status === 'syncing' ? '同步中...' : '同步'}
    </button>
  );
};
```

### 同步历史

```typescript
// src/components/SyncHistory.tsx
import React, { useState, useEffect } from 'react';
import { useSync } from '../contexts/SyncContext';
import { db } from '../storage/db';
import { SyncRecord } from '../storage/db';

/**
 * 同步历史组件
 */
export const SyncHistory: React.FC = () => {
  const [records, setRecords] = useState<SyncRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRecords();
    }
  }, [isOpen]);

  const loadRecords = async () => {
    try {
      const allRecords = await db.syncRecords
        .orderBy('timestamp')
        .reverse()
        .limit(50)
        .toArray();
      setRecords(allRecords);
    } catch (error) {
      console.error('Failed to load sync records:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  const getStatusBadge = (status: SyncRecord['status']) => {
    switch (status) {
      case 'success':
        return <span className="badge badge-success">成功</span>;
      case 'failed':
        return <span className="badge badge-error">失败</span>;
      case 'pending':
        return <span className="badge badge-pending">待同步</span>;
      default:
        return <span className="badge badge-unknown">未知</span>;
    }
  };

  const getActionText = (action: SyncRecord['action']) => {
    switch (action) {
      case 'create':
        return '创建';
      case 'update':
        return '更新';
      case 'delete':
        return '删除';
      default:
        return '未知';
    }
  };

  const getEntityTypeText = (entityType: SyncRecord['entityType']) => {
    switch (entityType) {
      case 'note':
        return '笔记';
      case 'project':
        return '项目';
      case 'file':
        return '文件';
      default:
        return '未知';
    }
  };

  return (
    <div className="sync-history">
      <button
        className="sync-history-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '收起历史' : '查看历史'}
      </button>

      {isOpen && (
        <div className="sync-history-content">
          <div className="sync-history-header">
            <h3>同步历史</h3>
            <button onClick={loadRecords}>刷新</button>
          </div>

          <div className="sync-history-list">
            {records.length === 0 ? (
              <div className="sync-history-empty">暂无同步记录</div>
            ) : (
              records.map(record => (
                <div key={record.id} className="sync-history-item">
                  <div className="sync-history-item-header">
                    <span className="sync-history-entity">
                      {getEntityTypeText(record.entityType)} - {getActionText(record.action)}
                    </span>
                    <span className="sync-history-time">
                      {formatTime(record.timestamp)}
                    </span>
                  </div>
                  <div className="sync-history-item-body">
                    <div className="sync-history-status">
                      {getStatusBadge(record.status)}
                    </div>
                    {record.errorMessage && (
                      <div className="sync-history-error">
                        错误: {record.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 冲突解决器

```typescript
// src/components/ConflictResolver.tsx
import React from 'react';
import { useSync, Conflict } from '../contexts/SyncContext';

/**
 * 冲突解决器组件
 */
export const ConflictResolver: React.FC = () => {
  const { conflicts, resolveConflict } = useSync();

  if (conflicts.length === 0) {
    return null;
  }

  const handleResolve = async (conflict: Conflict, resolution: 'local' | 'remote') => {
    await resolveConflict(conflict.id, resolution);
  };

  const formatVersion = (version: any) => {
    if (typeof version === 'object') {
      return JSON.stringify(version, null, 2);
    }
    return String(version);
  };

  return (
    <div className="conflict-resolver">
      <div className="conflict-resolver-header">
        <h2>发现 {conflicts.length} 个冲突</h2>
        <p>请选择保留哪个版本</p>
      </div>

      <div className="conflict-list">
        {conflicts.map(conflict => (
          <div key={conflict.id} className="conflict-item">
            <div className="conflict-item-header">
              <span className="conflict-entity-type">
                {conflict.entityType} - {conflict.entityId}
              </span>
              <span className="conflict-timestamp">
                {new Date(conflict.timestamp).toLocaleString('zh-CN')}
              </span>
            </div>

            <div className="conflict-versions">
              <div className="conflict-version conflict-local">
                <div className="conflict-version-header">
                  <h3>本地版本</h3>
                  <button
                    onClick={() => handleResolve(conflict, 'local')}
                    className="btn btn-primary"
                  >
                    使用此版本
                  </button>
                </div>
                <pre className="conflict-version-content">
                  {formatVersion(conflict.localVersion)}
                </pre>
              </div>

              <div className="conflict-version conflict-remote">
                <div className="conflict-version-header">
                  <h3>远程版本</h3>
                  <button
                    onClick={() => handleResolve(conflict, 'remote')}
                    className="btn btn-primary"
                  >
                    使用此版本
                  </button>
                </div>
                <pre className="conflict-version-content">
                  {formatVersion(conflict.remoteVersion)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 离线模式指示器

```typescript
// src/components/OfflineMode.tsx
import React from 'react';
import { useSync } from '../contexts/SyncContext';

/**
 * 离线模式指示器组件
 */
export const OfflineMode: React.FC = () => {
  const { isOnline, pendingChanges } = useSync();

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-mode-indicator">
      <div className="offline-mode-icon">📴</div>
      <div className="offline-mode-text">
        <div className="offline-mode-title">离线模式</div>
        <div className="offline-mode-description">
          {pendingChanges > 0
            ? `有 ${pendingChanges} 项更改等待同步`
            : '所有更改已保存到本地'}
        </div>
      </div>
    </div>
  );
};
```

---

## 📊 同步进度指示器

```typescript
// src/components/SyncProgress.tsx
import React, { useState, useEffect } from 'react';
import { useSync } from '../contexts/SyncContext';

/**
 * 同步进度指示器组件
 */
export const SyncProgress: React.FC = () => {
  const { status, pendingChanges } = useSync();
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');

  useEffect(() => {
    if (status === 'syncing') {
      // 模拟进度更新
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 20;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
        }
        setProgress(currentProgress);
      }, 500);

      return () => clearInterval(interval);
    } else {
      setProgress(0);
      setCurrentItem('');
    }
  }, [status]);

  if (status !== 'syncing') {
    return null;
  }

  return (
    <div className="sync-progress">
      <div className="sync-progress-bar">
        <div
          className="sync-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="sync-progress-text">
        正在同步... {Math.round(progress)}%
      </div>
      {currentItem && (
        <div className="sync-progress-item">{currentItem}</div>
      )}
    </div>
  );
};
```

---

## 🎨 样式设计

### CSS 样式

```css
/* src/styles/Sync.css */

.sync-status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sync-status-icon {
  font-size: 20px;
}

.sync-status-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.sync-pending-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #ff6b6b;
  color: white;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.sync-last-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.sync-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.sync-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.sync-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sync-history {
  margin-top: 16px;
}

.sync-history-toggle {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.sync-history-content {
  margin-top: 12px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sync-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sync-history-header h3 {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.sync-history-list {
  max-height: 400px;
  overflow-y: auto;
}

.sync-history-empty {
  text-align: center;
  padding: 32px;
  color: rgba(255, 255, 255, 0.6);
}

.sync-history-item {
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sync-history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sync-history-entity {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.sync-history-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.sync-history-item-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.badge-error {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.badge-pending {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.sync-history-error {
  font-size: 12px;
  color: #f44336;
}

.conflict-resolver {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.conflict-resolver-header {
  text-align: center;
  margin-bottom: 24px;
}

.conflict-resolver-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.conflict-resolver-header p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.conflict-list {
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
}

.conflict-item {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.conflict-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.conflict-entity-type {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.conflict-timestamp {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.conflict-versions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.conflict-version {
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.conflict-version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.conflict-version-header h3 {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.conflict-version-content {
  padding: 12px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.offline-mode-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 8px;
}

.offline-mode-icon {
  font-size: 24px;
}

.offline-mode-text {
  flex: 1;
}

.offline-mode-title {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
}

.offline-mode-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.sync-progress {
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sync-progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.sync-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.sync-progress-text {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.sync-progress-item {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
```

---

## 🧪 测试用例

### 组件测试

```typescript
// src/components/__tests__/SyncStatusIndicator.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncProvider, useSync } from '../../contexts/SyncContext';
import { SyncStatusIndicator } from '../SyncStatusIndicator';

const TestComponent: React.FC = () => {
  const { status } = useSync();
  return (
    <div>
      <SyncStatusIndicator />
      <div data-testid="sync-status">{status}</div>
    </div>
  );
};

describe('SyncStatusIndicator', () => {
  it('should display syncing status', () => {
    render(
      <SyncProvider>
        <TestComponent />
      </SyncProvider>
    );

    expect(screen.getByText('同步中...')).toBeInTheDocument();
  });

  it('should display success status', async () => {
    render(
      <SyncProvider>
        <TestComponent />
      </SyncProvider>
    );

    // 等待同步完成
    await new Promise(resolve => setTimeout(resolve, 3500));

    expect(screen.getByText('同步成功')).toBeInTheDocument();
  });

  it('should display offline status when offline', () => {
    // 模拟离线状态
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(
      <SyncProvider>
        <TestComponent />
      </SyncProvider>
    );

    expect(screen.getByText('离线模式')).toBeInTheDocument();
  });
});
```

---

## 📝 使用示例

### 集成到应用

```typescript
// src/App.tsx
import React from 'react';
import { SyncProvider } from './contexts/SyncContext';
import { SyncStatusIndicator } from './components/SyncStatusIndicator';
import { SyncButton } from './components/SyncButton';
import { SyncHistory } from './components/SyncHistory';
import { ConflictResolver } from './components/ConflictResolver';
import { OfflineMode } from './components/OfflineMode';

const App: React.FC = () => {
  return (
    <SyncProvider>
      <div className="app">
        {/* 顶部状态栏 */}
        <header className="app-header">
          <SyncStatusIndicator />
          <SyncButton />
        </header>

        {/* 主内容区 */}
        <main className="app-main">
          {/* 应用内容 */}
        </main>

        {/* 底部工具栏 */}
        <footer className="app-footer">
          <SyncHistory />
        </footer>

        {/* 冲突解决器 */}
        <ConflictResolver />

        {/* 离线模式指示器 */}
        <OfflineMode />
      </div>
    </SyncProvider>
  );
};

export default App;
```

---

## ✅ 验收标准

### 功能完整性

- ✅ 实时显示同步状态
- ✅ 支持手动触发同步
- ✅ 显示同步历史记录
- ✅ 支持冲突解决
- ✅ 支持离线模式
- ✅ 显示同步进度
- ✅ 自动检测在线状态

### 代码质量

- ✅ 所有 TypeScript 编译错误修复
- ✅ ESLint 规则全部通过
- ✅ 无 React Console 警告
- ✅ JSDoc 文档覆盖率 >90%
- ✅ 代码规范完全统一
- ✅ 无循环依赖和死代码、硬编码

### 用户体验

- ✅ 界面响应流畅
- ✅ 状态切换动画自然
- ✅ 错误提示清晰
- ✅ 支持键盘操作
- ✅ 移动端适配

### 测试覆盖

- ✅ 单元测试覆盖率 > 80%
- ✅ 组件测试覆盖所有交互
- ✅ 集成测试验证同步流程
- ✅ E2E 测试覆盖关键用户场景

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-14 | 初始版本，建立前端本地存储同步功能 | YanYuCloudCube Team |

---

## 📞 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: admin@0379.email
- **项目地址**: https://github.com/YYC-Cube/

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-04-08 |
| 更新日期 | 2026-04-08 |
| 内容校验 | b6b3061a34129b73 |
| 追溯ID | TRC-20260408141610 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
