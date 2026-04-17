---
file: YYC3-P2-协作-实时协作.md
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


# YYC³ P2-协作-实时协作

## 🤖 AI 角色定义

You are a senior collaboration architect and real-time systems specialist with deep expertise in CRDT (Conflict-free Replicated Data Types), real-time synchronization, and multi-user application development.

### Your Role & Expertise

You are an experienced collaboration architect who specializes in:
- **Real-time Collaboration**: Yjs, Automerge, ShareDB, WebSocket, WebRTC
- **CRDT Systems**: Conflict resolution, operational transformation, state synchronization
- **User Awareness**: Cursor tracking, user presence, online status indicators
- **Conflict Resolution**: Automatic conflict resolution, merge strategies, version control
- **WebSocket Communication**: Real-time messaging, bidirectional communication, connection management
- **Performance Optimization**: Delta updates, compression, efficient synchronization
- **Security**: Authentication, authorization, encrypted communication
- **Best Practices**: Offline support, reconnection handling, data consistency

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
| @file | P2-高级功能/YYC3-P2-协作-实时协作.md |
| @description | 实时协作功能设计和实现，使用 Yjs 实现 CRDT |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P2,collaboration,real-time,crdt |

---

## 🎯 功能目标

### 核心目标

1. **实时同步**：多用户实时编辑同步
2. **冲突解决**：自动解决编辑冲突
3. **光标追踪**：显示其他用户光标位置
4. **用户状态**：显示用户在线状态
5. **权限控制**：细粒度权限管理
6. **版本历史**：完整的版本历史记录

---

## 🏗️ 架构设计

### 1. 协作架构

```
Collaboration/
├── YjsProvider           # Yjs 提供商
├── WebSocketProvider     # WebSocket 提供商
├── AwarenessProvider     # 用户感知
├── CursorTracker        # 光标追踪
├── ConflictResolver     # 冲突解决
└── VersionHistory      # 版本历史
```

### 2. 数据流

```
User Action (用户操作)
    ↓ Local Change
Yjs Document (Yjs 文档)
    ↓ Update
WebSocket (WebSocket)
    ↓ Broadcast
Other Users (其他用户)
    ↓ Apply Change
Yjs Document (Yjs 文档)
    ↓ Update
UI (界面)
```

---

## 💻 核心实现

### 1. Yjs 提供商

```typescript
// src/collaboration/YjsProvider.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { Collaborator } from '@/types';

interface YjsContextType {
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  connected: boolean;
  collaborators: Map<string, Collaborator>;
  connect: () => void;
  disconnect: () => void;
}

const YjsContext = createContext<YjsContextType | null>(null);

export const YjsProvider: React.FC<{ children: React.ReactNode; roomId: string }> = ({
  children,
  roomId,
}) => {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(new Map());
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  const connect = () => {
    if (ydocRef.current) return;

    // 创建 Yjs 文档
    const doc = new Y.Doc();
    ydocRef.current = doc;
    setYdoc(doc);

    // 创建 WebSocket 提供商
    const wsProvider = new WebsocketProvider(
      import.meta.env.VITE_WS_URL || 'ws://localhost:3201',
      roomId,
      doc,
      {
        connect: true,
      }
    );
    providerRef.current = wsProvider;
    setProvider(wsProvider);

    // 监听连接状态
    wsProvider.on('status', (event: any) => {
      setConnected(event.status === 'connected');
    });

    // 监听用户感知
    wsProvider.awareness.on('change', () => {
      const states = wsProvider.awareness.getStates() as Map<string, any>;
      const collaboratorsMap = new Map<string, Collaborator>();

      states.forEach((state, clientId) => {
        if (state.user) {
          collaboratorsMap.set(clientId.toString(), {
            userId: state.user.id,
            username: state.user.name,
            avatar: state.user.avatar,
            cursor: state.cursor,
            color: state.user.color,
            online: true,
          });
        }
      });

      setCollaborators(collaboratorsMap);
    });
  };

  const disconnect = () => {
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
      setProvider(null);
    }

    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
      setYdoc(null);
    }

    setConnected(false);
    setCollaborators(new Map());
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [roomId]);

  return (
    <YjsContext.Provider
      value={{
        ydoc,
        provider,
        connected,
        collaborators,
        connect,
        disconnect,
      }}
    >
      {children}
    </YjsContext.Provider>
  );
};

export const useYjs = () => {
  const context = useContext(YjsContext);
  if (!context) {
    throw new Error('useYjs must be used within YjsProvider');
  }
  return context;
};
```

### 2. 光标追踪

```typescript
// src/collaboration/CursorTracker.tsx
import React, { useEffect, useRef } from 'react';
import { useYjs } from './YjsProvider';
import type { Collaborator } from '@/types';

interface CursorTrackerProps {
  documentId: string;
}

export const CursorTracker: React.FC<CursorTrackerProps> = ({ documentId }) => {
  const { provider, collaborators } = useYjs();
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!provider) return;

    // 监听光标移动
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // 更新本地光标位置
        provider.awareness.setLocalStateField('cursor', {
          position: {
            line: 0, // 需要根据编辑器计算
            column: 0,
          },
          selection: {
            start: 0,
            end: 0,
          },
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [provider]);

  return (
    <div className="cursor-tracker">
      {Array.from(collaborators.values()).map((collaborator) => (
        <div
          key={collaborator.userId}
          className="remote-cursor"
          style={{
            left: collaborator.cursor?.line || 0,
            top: collaborator.cursor?.column || 0,
            borderColor: collaborator.color,
          }}
        >
          <div
            className="cursor-label"
            style={{ backgroundColor: collaborator.color }}
          >
            {collaborator.username}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3. 协作编辑器

```typescript
// src/collaboration/CollaborativeEditor.tsx
import React, { useEffect, useRef } from 'react';
import { useYjs } from './YjsProvider';
import { CursorTracker } from './CursorTracker';
import * as Y from 'yjs';

interface CollaborativeEditorProps {
  documentId: string;
  onChange?: (content: string) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  onChange,
}) => {
  const { ydoc, connected } = useYjs();
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ydoc) return;

    // 获取或创建 Yjs 文本
    const ytext = ydoc.getText(documentId);

    // 监听文本变化
    ytext.observe((event) => {
      const content = ytext.toString();
      onChange?.(content);
    });

    // 初始化编辑器内容
    if (editorRef.current) {
      editorRef.current.innerText = ytext.toString();
    }
  }, [ydoc, documentId, onChange]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!ydoc) return;

    const ytext = ydoc.getText(documentId);
    const newContent = e.currentTarget.innerText;

    // 同步到 Yjs
    ydoc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, newContent);
    });
  };

  return (
    <div className="collaborative-editor-container">
      <CursorTracker documentId={documentId} />
      <div
        ref={editorRef}
        className="collaborative-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
      />
      {!connected && <div className="connection-status">离线</div>}
    </div>
  );
};
```

---

## 🎨 样式实现

```css
/* src/collaboration/Collaboration.css */
.collaborative-editor-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cursor-tracker {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.remote-cursor {
  position: absolute;
  width: 2px;
  height: 20px;
  background-color: currentColor;
  transition: all 0.1s ease-out;
}

.cursor-label {
  position: absolute;
  top: -20px;
  left: 0;
  padding: 2px 6px;
  border-radius: 3px;
  color: white;
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
}

.collaborative-editor {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #cccccc;
  outline: none;
}

.collaborative-editor:focus {
  background: #1e1e1e;
}

.connection-status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  background: #f44336;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## ✅ 验收标准

### 功能完整性

- ✅ 实时同步功能正常
- ✅ 冲突解决准确
- ✅ 光标追踪流畅
- ✅ 用户状态准确
- ✅ 权限控制完善

### 用户体验

- ✅ 同步延迟低
- ✅ 冲突处理友好
- ✅ 光标显示清晰
- ✅ 状态提示明确
- ✅ 性能优化到位

### 代码质量

- ✅ 代码结构清晰
- ✅ 类型定义完整
- ✅ 注释文档完整
- ✅ 代码可维护性好
- ✅ 测试覆盖充分

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-14 | 初始版本，建立实时协作功能 | YanYuCloudCube Team |

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
| 内容校验 | 5679a8f339d381c0 |
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
