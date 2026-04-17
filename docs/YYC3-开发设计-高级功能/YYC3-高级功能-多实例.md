---
file: YYC3-AI-「高级功能-多实例」.md
description: 多实例功能文档，介绍多实例管理和切换
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-19
updated: 2026-03-19
status: stable
tags: general,zh-CN
category: technical
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ P2 高级功能 — 应用多开架构

> **已实施**: 2026-03-18 | Store + UI 完成

## 实施状态

| 模块 | 状态 | 文件 |
|------|------|------|
| WindowManager (窗口管理) | ✅ 已完成 | `multi-instance-store.tsx` |
| WorkspaceManager (工作区管理) | ✅ 已完成 | `multi-instance-store.tsx` |
| SessionManager (会话管理) | ✅ 已完成 | `multi-instance-store.tsx` |
| IPCManager (IPC 通信) | ✅ 模拟完成 | `multi-instance-store.tsx` |
| ResourceManager (资源管理) | ✅ 模拟完成 | `multi-instance-store.tsx` |
| MultiInstancePanel (UI) | ✅ 已完成 | `MultiInstancePanel.tsx` |
| DesignerPage 集成 | ✅ 已完成 | `DesignerPage.tsx` |

## 架构决策

### Figma Make 沙箱适配

原文档设计基于 Tauri 的 `invoke()` 调用，在 Figma Make 沙箱环境中：

1. **无 Tauri invoke** → 所有操作在 Zustand store 内存中完成
2. **无 BroadcastChannel IPC** → IPC 消息存储在 `ipcLog[]` 数组中模拟
3. **无真实进程隔离** → 多实例通过 store 状态模拟
4. **无 OS Keychain** → localStorage persist 中间件

### 本地 Tauri 迁移指南

```typescript
// 1. 替换 store 内的模拟操作为 Tauri invoke
// Before (sandbox):
createInstance: (type) => { /* store-only */ }

// After (Tauri):
createInstance: async (type) => {
  await invoke('create_window', { windowType: type, ... })
  // store update same as before
}

// 2. 替换 IPC 模拟为真实 BroadcastChannel
const bc = new BroadcastChannel('yyc3-ipc')
bc.onmessage = (e) => handleIPCMessage(e.data)

// 3. 资源监控替换为 Tauri sidecar
await invoke('get_process_metrics') // Rust side: sysinfo crate
```

## 类型定义摘要

```typescript
type InstanceType = 'main' | 'secondary' | 'popup' | 'preview'
type WindowType = 'main' | 'editor' | 'preview' | 'terminal' | 'ai-chat' | 'settings' | 'database' | 'task-board'
type WorkspaceType = 'project' | 'ai-session' | 'debug' | 'custom'
type SessionType = 'ai-chat' | 'code-edit' | 'debug' | 'preview' | 'terminal'
type SessionStatus = 'active' | 'idle' | 'suspended' | 'closed'
```

---

**维护团队**: YanYuCloudCube Team <admin@0379.email>
