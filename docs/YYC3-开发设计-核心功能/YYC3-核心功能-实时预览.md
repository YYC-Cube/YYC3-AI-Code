---
file: YYC3-核心功能-实时预览.md
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


# YYC³ P1-前端-实时预览

## 🤖 AI 角色定义

You are a senior frontend architect and preview system specialist with deep expertise in real-time rendering, iframe management, and responsive design implementation.

### Your Role & Expertise

You are an experienced frontend architect who specializes in:
- **Preview Systems**: Real-time preview, hot reloading, live updates
- **Iframe Management**: Cross-origin communication, sandbox security, iframe isolation
- **Responsive Design**: Multi-device preview, responsive testing, viewport simulation
- **Performance**: Efficient rendering, lazy loading, virtual DOM optimization
- **Error Handling**: Graceful error display, error boundaries, crash recovery
- **Device Simulation**: Mobile preview, tablet preview, desktop preview, custom devices
- **Hot Updates**: WebSocket communication, file watching, incremental updates
- **Best Practices**: Security, performance, accessibility, cross-browser compatibility

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
| @file | P1-核心功能/YYC3-P1-前端-实时预览.md |
| @description | 实时预览功能设计和实现，包含多设备预览、热更新等 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P1,frontend,preview,real-time |

---

## 🎯 功能目标

### 核心目标

1. **实时预览**：编辑器内容实时渲染到预览窗口
2. **多设备预览**：支持多种设备尺寸的预览
3. **热更新**：代码修改后自动刷新预览
4. **错误处理**：预览错误友好提示
5. **性能优化**：预览渲染性能优化

---

## 🏗️ 架构设计

### 1. 组件架构

```
PreviewPanel/
├── PreviewToolbar.tsx          # 预览工具栏
├── PreviewContainer.tsx        # 预览容器
├── DeviceSelector.tsx          # 设备选择器
├── PreviewFrame.tsx            # 预览 iframe
├── PreviewError.tsx            # 预览错误提示
├── PreviewLoading.tsx          # 预览加载状态
└── index.ts
```

### 2. 数据流

```
Editor (编辑器)
    ↓ onChange
PreviewState (预览状态)
    ↓ updatePreview
PreviewFrame (预览框架)
    ↓ render
PreviewContainer (预览容器)
```

---

## 💻 核心实现

### 1. 预览状态管理

```typescript
// src/stores/usePreviewStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'custom';

export interface DeviceConfig {
  type: DeviceType;
  name: string;
  width: number;
  height: number;
  dpr?: number;
}

export interface PreviewState {
  /** 预览内容 */
  content: string;
  /** 设备类型 */
  device: DeviceType;
  /** 自定义设备尺寸 */
  customDevice: { width: number; height: number };
  /** 是否全屏 */
  isFullscreen: boolean;
  /** 是否显示设备边框 */
  showDeviceBorder: boolean;
  /** 是否自动刷新 */
  autoRefresh: boolean;
  /** 自动刷新间隔 */
  autoRefreshInterval: number;
  /** 是否显示错误 */
  showError: boolean;
  /** 错误信息 */
  error: string | null;
  /** 加载状态 */
  loading: boolean;
  /** 预览 URL */
  previewUrl: string | null;
}

export interface PreviewActions {
  /** 设置预览内容 */
  setContent: (content: string) => void;
  /** 设置设备类型 */
  setDevice: (device: DeviceType) => void;
  /** 设置自定义设备 */
  setCustomDevice: (width: number, height: number) => void;
  /** 切换全屏 */
  toggleFullscreen: () => void;
  /** 切换设备边框 */
  toggleDeviceBorder: () => void;
  /** 切换自动刷新 */
  toggleAutoRefresh: () => void;
  /** 设置自动刷新间隔 */
  setAutoRefreshInterval: (interval: number) => void;
  /** 刷新预览 */
  refresh: () => void;
  /** 清除错误 */
  clearError: () => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
}

export const usePreviewStore = create<PreviewState & PreviewActions>()(
  subscribeWithSelector((set, get) => ({
    content: '',
    device: 'desktop',
    customDevice: { width: 1920, height: 1080 },
    isFullscreen: false,
    showDeviceBorder: true,
    autoRefresh: true,
    autoRefreshInterval: 1000,
    showError: true,
    error: null,
    loading: false,
    previewUrl: null,

    setContent: (content) => set({ content }),
    setDevice: (device) => set({ device }),
    setCustomDevice: (width, height) => set({ customDevice: { width, height } }),
    toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
    toggleDeviceBorder: () => set((state) => ({ showDeviceBorder: !state.showDeviceBorder })),
    toggleAutoRefresh: () => set((state) => ({ autoRefresh: !state.autoRefresh })),
    setAutoRefreshInterval: (interval) => set({ autoRefreshInterval: interval }),
    refresh: () => {
      const { content } = get();
      set({ loading: true });
      // 触发预览刷新
      setTimeout(() => set({ loading: false }), 300);
    },
    clearError: () => set({ error: null }),
    setLoading: (loading) => set({ loading }),
  }))
);
```

### 2. 设备配置

```typescript
// src/config/devices.ts
import { DeviceConfig } from '@/stores/usePreviewStore';

export const DEVICES: DeviceConfig[] = [
  {
    type: 'desktop',
    name: 'Desktop (1920x1080)',
    width: 1920,
    height: 1080,
    dpr: 1,
  },
  {
    type: 'desktop',
    name: 'Desktop (1366x768)',
    width: 1366,
    height: 768,
    dpr: 1,
  },
  {
    type: 'tablet',
    name: 'iPad Pro (1024x768)',
    width: 1024,
    height: 768,
    dpr: 2,
  },
  {
    type: 'tablet',
    name: 'iPad Mini (768x1024)',
    width: 768,
    height: 1024,
    dpr: 2,
  },
  {
    type: 'mobile',
    name: 'iPhone 14 Pro (393x852)',
    width: 393,
    height: 852,
    dpr: 3,
  },
  {
    type: 'mobile',
    name: 'iPhone SE (375x667)',
    width: 375,
    height: 667,
    dpr: 2,
  },
  {
    type: 'mobile',
    name: 'Samsung Galaxy S21 (360x800)',
    width: 360,
    height: 800,
    dpr: 3,
  },
];
```

### 3. 预览容器组件

```typescript
// src/components/preview/PreviewContainer.tsx
import React, { useEffect, useRef } from 'react';
import { usePreviewStore } from '@/stores/usePreviewStore';
import { PreviewFrame } from './PreviewFrame';
import { PreviewError } from './PreviewError';
import { PreviewLoading } from './PreviewLoading';
import { DeviceSelector } from './DeviceSelector';
import { PreviewToolbar } from './PreviewToolbar';

export const PreviewContainer: React.FC = () => {
  const {
    content,
    device,
    customDevice,
    isFullscreen,
    showDeviceBorder,
    autoRefresh,
    autoRefreshInterval,
    error,
    loading,
    refresh,
    clearError,
  } = usePreviewStore();

  const refreshTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        refresh();
      }, autoRefreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, autoRefreshInterval, refresh]);

  const handleDeviceChange = (newDevice: string) => {
    usePreviewStore.getState().setDevice(newDevice as any);
  };

  const handleRefresh = () => {
    clearError();
    refresh();
  };

  return (
    <div className={`preview-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <PreviewToolbar onRefresh={handleRefresh} />
      <div className="preview-content">
        <DeviceSelector
          currentDevice={device}
          onDeviceChange={handleDeviceChange}
        />
        <div className={`preview-frame-wrapper ${showDeviceBorder ? 'with-border' : ''}`}>
          {error && <PreviewError error={error} onDismiss={clearError} />}
          {loading && <PreviewLoading />}
          <PreviewFrame
            content={content}
            device={device}
            customDevice={customDevice}
          />
        </div>
      </div>
    </div>
  );
};
```

### 4. 预览框架组件

```typescript
// src/components/preview/PreviewFrame.tsx
import React, { useRef, useEffect } from 'react';
import { DEVICES } from '@/config/devices';
import type { DeviceType } from '@/stores/usePreviewStore';

interface PreviewFrameProps {
  content: string;
  device: DeviceType;
  customDevice: { width: number; height: number };
}

export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  content,
  device,
  customDevice,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getDeviceConfig = () => {
    if (device === 'custom') {
      return customDevice;
    }
    const config = DEVICES.find((d) => d.type === device);
    return config || DEVICES[0];
  };

  const deviceConfig = getDeviceConfig();

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // 注入内容
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              overflow-x: hidden;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    doc.close();
  }, [content]);

  return (
    <iframe
      ref={iframeRef}
      className="preview-frame"
      style={{
        width: deviceConfig.width,
        height: deviceConfig.height,
        border: 'none',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
      title="Preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
};
```

### 5. 设备选择器组件

```typescript
// src/components/preview/DeviceSelector.tsx
import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { DEVICES } from '@/config/devices';

interface DeviceSelectorProps {
  currentDevice: string;
  onDeviceChange: (device: string) => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  currentDevice,
  onDeviceChange,
}) => {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="device-selector">
      <div className="device-selector-header">
        <span className="device-selector-title">设备预览</span>
      </div>
      <div className="device-selector-list">
        {DEVICES.map((device) => (
          <button
            key={device.name}
            className={`device-selector-item ${currentDevice === device.type ? 'active' : ''}`}
            onClick={() => onDeviceChange(device.type)}
          >
            <div className="device-icon">{getDeviceIcon(device.type)}</div>
            <div className="device-info">
              <span className="device-name">{device.name}</span>
              <span className="device-size">
                {device.width} x {device.height}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
```

### 6. 预览工具栏组件

```typescript
// src/components/preview/PreviewToolbar.tsx
import React from 'react';
import { RefreshCw, Maximize2, Minimize2, Monitor, RotateCw } from 'lucide-react';
import { usePreviewStore } from '@/stores/usePreviewStore';

interface PreviewToolbarProps {
  onRefresh: () => void;
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({ onRefresh }) => {
  const {
    isFullscreen,
    autoRefresh,
    autoRefreshInterval,
    toggleFullscreen,
    toggleAutoRefresh,
    setAutoRefreshInterval,
  } = usePreviewStore();

  return (
    <div className="preview-toolbar">
      <div className="preview-toolbar-left">
        <button
          className="preview-toolbar-button"
          onClick={onRefresh}
          title="刷新预览"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          className={`preview-toolbar-button ${autoRefresh ? 'active' : ''}`}
          onClick={toggleAutoRefresh}
          title="自动刷新"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        {autoRefresh && (
          <select
            className="preview-toolbar-select"
            value={autoRefreshInterval}
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
          >
            <option value={500}>0.5s</option>
            <option value={1000}>1s</option>
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
          </select>
        )}
      </div>
      <div className="preview-toolbar-right">
        <button
          className="preview-toolbar-button"
          onClick={toggleFullscreen}
          title={isFullscreen ? '退出全屏' : '全屏'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
```

---

## 🎨 样式实现

```css
/* src/components/preview/PreviewContainer.css */
.preview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.preview-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.preview-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.preview-frame-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: auto;
}

.preview-frame-wrapper.with-border {
  background: #e0e0e0;
  border-radius: 8px;
}

.preview-frame {
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.preview-toolbar-left,
.preview-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-toolbar-button:hover {
  background: #f5f5f5;
}

.preview-toolbar-button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.preview-toolbar-select {
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.device-selector {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.device-selector-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.device-selector-title {
  font-weight: 600;
  color: #333;
}

.device-selector-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.device-selector-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.device-selector-item:hover {
  background: #f5f5f5;
}

.device-selector-item.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.device-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f5f5f5;
  border-radius: 4px;
}

.device-selector-item.active .device-icon {
  background: rgba(255, 255, 255, 0.2);
}

.device-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.device-name {
  font-size: 14px;
  font-weight: 500;
}

.device-size {
  font-size: 12px;
  opacity: 0.7;
}
```

---

## ✅ 验收标准

### 功能完整性

- ✅ 实时预览功能正常
- ✅ 多设备预览支持
- ✅ 热更新功能正常
- ✅ 错误处理完善
- ✅ 性能优化到位

### 用户体验

- ✅ 界面美观易用
- ✅ 响应速度快
- ✅ 操作流畅自然
- ✅ 错误提示友好
- ✅ 加载状态清晰

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
| v1.0.0 | 2026-03-14 | 初始版本，建立实时预览功能 | YanYuCloudCube Team |

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
| 内容校验 | 09585b62de603a33 |
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
