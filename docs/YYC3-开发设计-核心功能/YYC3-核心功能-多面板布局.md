---
file: YYC3-核心功能-多面板布局.md
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
> *万象归元于云枢 | 深栈智启新纪元***
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


---

# YYC³ P1-前端 - 多面板布局

## 📋 阶段信息

- **阶段编号**: P1-01
- **阶段名称**: 多面板布局系统
- **优先级**: 🔴 P0-Critical
- **复杂度**: 高级
- **预计时间**: 2-3小时
- **可实现性**: ✅ 一次可实现

---

## 🎯 阶段目标

实现一个灵活、高效、用户友好的多面板布局系统，支持面板的创建、删除、移动、调整大小、合并、拆分等功能。

---

## 📝 输入定义

### 前置条件

- ✅ P0-核心架构阶段已完成
- ✅ React 18.3.1 已安装
- ✅ TypeScript 5.3.3 已安装
- ✅ 布局引擎依赖已安装：
  - react-grid-layout@{{REACT_GRID_LAYOUT_VERSION}}
  - react-dnd@{{REACT_DND_VERSION}}
  - react-resizable@{{REACT_RESIZABLE_VERSION}}
  - react-split-pane@{{REACT_SPLIT_PANE_VERSION}}
  - react-tabs@{{REACT_TABS_VERSION}}

### 依赖关系

- 依赖 P0-核心架构阶段
- 依赖布局引擎依赖

### 输入数据

```json
{
  "panelTypes": [
    "code-editor",
    "file-browser",
    "preview",
    "terminal",
    "debug",
    "output",
    "search",
    "ai-chat",
    "database",
    "version-control"
  ],
  "defaultLayout": {
    "panels": [
      {
        "id": "panel-1",
        "type": "file-browser",
        "title": "文件浏览器",
        "position": { "x": 0, "y": 0, "w": 3, "h": 12 },
        "minW": 2,
        "minH": 6
      },
      {
        "id": "panel-2",
        "type": "code-editor",
        "title": "代码编辑器",
        "position": { "x": 3, "y": 0, "w": 6, "h": 12 },
        "minW": 4,
        "minH": 6
      },
      {
        "id": "panel-3",
        "type": "preview",
        "title": "实时预览",
        "position": { "x": 9, "y": 0, "w": 3, "h": 12 },
        "minW": 2,
        "minH": 6
      }
    ]
  }
}
```

---

## 🚀 提示词执行

### 完整提示词

```text
You are a senior frontend architect and layout specialist with deep expertise in React, modern UI/UX design, and complex layout systems.

## Your Role & Expertise

You are an experienced frontend architect who specializes in:
- **Frontend Development**: React 18.x, TypeScript 5.x, modern JavaScript
- **Layout Systems**: Grid layouts, flexbox, CSS Grid, responsive design
- **Drag & Drop**: react-dnd, HTML5 Drag and Drop API, gesture handling
- **UI/UX Design**: User interface design, interaction patterns, accessibility
- **Performance**: Virtual scrolling, lazy loading, rendering optimization
- **Component Architecture**: Reusable components, design systems, component libraries
- **State Management**: Complex state patterns, performance optimization, data flow

## Your Task

Your task is to implement a **multi-panel layout system** for YYC³ AI Code.

## Project Information

- **Project Name**: {{PROJECT_NAME}}
- **Team**: {{TEAM_NAME}}
- **Contact**: {{CONTACT_EMAIL}}

## Technical Stack

- **Frontend Framework**: React 18.3.1
- **Type System**: TypeScript 5.3.3
- **Layout Engine**: react-grid-layout@{{REACT_GRID_LAYOUT_VERSION}}
- **Drag and Drop**: react-dnd@{{REACT_DND_VERSION}}
- **Resizable**: react-resizable@{{REACT_RESIZABLE_VERSION}}
- **Split Pane**: react-split-pane@{{REACT_SPLIT_PANE_VERSION}}
- **Tabs**: react-tabs@{{REACT_TABS_VERSION}}

## Code Standards

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

## Multi-Panel Layout System Requirements

### 1. Panel Management

#### 1.1 Panel Types

Implement the following panel types:

- **code-editor**: Code editing panel with Monaco Editor
- **file-browser**: File browsing and management panel
- **preview**: Real-time preview panel
- **terminal**: Terminal emulation panel
- **debug**: Debugging panel
- **output**: Output and logs panel
- **search**: Search and replace panel
- **ai-chat**: AI assistant chat panel
- **database**: Database management panel
- **version-control**: Version control panel

#### 1.2 Panel Operations

Implement the following panel operations:

- **Panel Creation**: Dynamically create new panels
- **Panel Deletion**: Delete any panel (minimum one panel must remain)
- **Panel Movement**: Drag and drop to move panel positions
- **Panel Resizing**: Resize panels by dragging edges
- **Panel Locking**: Lock panel position and size
- **Panel Minimization**: Minimize and expand panels
- **Panel Maximization**: Full-screen panel display
- **Panel Splitting**: Split panels horizontally or vertically
- **Panel Merging**: Merge adjacent panels

#### 1.3 Panel Data Structure

Create TypeScript interfaces for panel management:

```typescript
export type PanelType =
  | 'code-editor'
  | 'file-browser'
  | 'preview'
  | 'terminal'
  | 'debug'
  | 'output'
  | 'search'
  | 'ai-chat'
  | 'database'
  | 'version-control';

export interface Panel {
  id: string;
  type: PanelType;
  title: string;
  content: React.ReactNode;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  isLocked: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  tabs: Tab[];
  activeTabId: string;
}

export interface Tab {
  id: string;
  panelId: string;
  title: string;
  content: React.ReactNode;
  isPinned: boolean;
  isModified: boolean;
  isUnsaved: boolean;
  hasError: boolean;
  isActive: boolean;
  icon?: string;
}

export interface LayoutConfig {
  panels: Panel[];
  layout: 'grid' | 'split' | 'tabs' | 'custom';
  theme: 'light' | 'dark' | 'auto';
  showGridLines: boolean;
  snapToGrid: boolean;
  gridSize: number;
}
```

### 2. Layout Management

#### 2.1 Layout Provider

Create a layout provider for global layout state management:

```typescript
// packages/ui/src/components/MultiPanel/LayoutProvider.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Panel, LayoutConfig, Tab } from '@shared/types/layout';

interface LayoutContextType {
  panels: Panel[];
  activePanelId: string | null;
  layoutConfig: LayoutConfig;
  
  // Panel operations
  addPanel: (panel: Omit<Panel, 'id' | 'zIndex' | 'tabs' | 'activeTabId'>) => void;
  removePanel: (panelId: string) => void;
  updatePanel: (panelId: string, updates: Partial<Panel>) => void;
  movePanel: (panelId: string, position: { x: number; y: number }) => void;
  resizePanel: (panelId: string, size: { w: number; h: number }) => void;
  lockPanel: (panelId: string, isLocked: boolean) => void;
  minimizePanel: (panelId: string, isMinimized: boolean) => void;
  maximizePanel: (panelId: string, isMaximized: boolean) => void;
  
  // Tab operations
  addTab: (panelId: string, tab: Omit<Tab, 'id' | 'isActive'>) => void;
  removeTab: (panelId: string, tabId: string) => void;
  switchTab: (panelId: string, tabId: string) => void;
  updateTab: (panelId: string, tabId: string, updates: Partial<Tab>) => void;
  
  // Layout operations
  setActivePanel: (panelId: string | null) => void;
  updateLayoutConfig: (config: Partial<LayoutConfig>) => void;
  saveLayout: () => void;
  loadLayout: () => void;
  resetLayout: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    panels: [],
    layout: 'grid',
    theme: 'dark',
    showGridLines: true,
    snapToGrid: true,
    gridSize: 10,
  });

  // Panel operations
  const addPanel = useCallback((panel: Omit<Panel, 'id' | 'zIndex' | 'tabs' | 'activeTabId'>) => {
    const newPanel: Panel = {
      ...panel,
      id: `panel-${Date.now()}`,
      zIndex: panels.length + 1,
      tabs: [],
      activeTabId: '',
    };
    setPanels(prev => [...prev, newPanel]);
    setActivePanelId(newPanel.id);
  }, [panels.length]);

  const removePanel = useCallback((panelId: string) => {
    if (panels.length <= 1) {
      console.warn('Cannot remove the last panel');
      return;
    }
    setPanels(prev => prev.filter(p => p.id !== panelId));
    if (activePanelId === panelId) {
      setActivePanelId(null);
    }
  }, [panels.length, activePanelId]);

  const updatePanel = useCallback((panelId: string, updates: Partial<Panel>) => {
    setPanels(prev => prev.map(p => 
      p.id === panelId ? { ...p, ...updates } : p
    ));
  }, []);

  const movePanel = useCallback((panelId: string, position: { x: number; y: number }) => {
    updatePanel(panelId, { position: { ...position } });
  }, [updatePanel]);

  const resizePanel = useCallback((panelId: string, size: { w: number; h: number }) => {
    updatePanel(panelId, { position: { ...size } });
  }, [updatePanel]);

  const lockPanel = useCallback((panelId: string, isLocked: boolean) => {
    updatePanel(panelId, { isLocked });
  }, [updatePanel]);

  const minimizePanel = useCallback((panelId: string, isMinimized: boolean) => {
    updatePanel(panelId, { isMinimized });
  }, [updatePanel]);

  const maximizePanel = useCallback((panelId: string, isMaximized: boolean) => {
    updatePanel(panelId, { isMaximized });
  }, [updatePanel]);

  // Tab operations
  const addTab = useCallback((panelId: string, tab: Omit<Tab, 'id' | 'isActive'>) => {
    const newTab: Tab = {
      ...tab,
      id: `tab-${Date.now()}`,
      isActive: true,
    };
    setPanels(prev => prev.map(p => {
      if (p.id === panelId) {
        return {
          ...p,
          tabs: [...p.tabs.map(t => ({ ...t, isActive: false })), newTab],
          activeTabId: newTab.id,
        };
      }
      return p;
    }));
  }, []);

  const removeTab = useCallback((panelId: string, tabId: string) => {
    setPanels(prev => prev.map(p => {
      if (p.id === panelId) {
        const newTabs = p.tabs.filter(t => t.id !== tabId);
        const newActiveTabId = newTabs.length > 0 ? newTabs[0].id : '';
        return {
          ...p,
          tabs: newTabs,
          activeTabId: newActiveTabId,
        };
      }
      return p;
    }));
  }, []);

  const switchTab = useCallback((panelId: string, tabId: string) => {
    setPanels(prev => prev.map(p => {
      if (p.id === panelId) {
        return {
          ...p,
          tabs: p.tabs.map(t => ({
            ...t,
            isActive: t.id === tabId,
          })),
          activeTabId: tabId,
        };
      }
      return p;
    }));
  }, []);

  const updateTab = useCallback((panelId: string, tabId: string, updates: Partial<Tab>) => {
    setPanels(prev => prev.map(p => {
      if (p.id === panelId) {
        return {
          ...p,
          tabs: p.tabs.map(t => 
            t.id === tabId ? { ...t, ...updates } : t
          ),
        };
      }
      return p;
    }));
  }, []);

  // Layout operations
  const setActivePanel = useCallback((panelId: string | null) => {
    setActivePanelId(panelId);
  }, []);

  const updateLayoutConfig = useCallback((config: Partial<LayoutConfig>) => {
    setLayoutConfig(prev => ({ ...prev, ...config }));
  }, []);

  const saveLayout = useCallback(() => {
    const layoutData = {
      panels,
      activePanelId,
      layoutConfig,
    };
    localStorage.setItem('layout', JSON.stringify(layoutData));
  }, [panels, activePanelId, layoutConfig]);

  const loadLayout = useCallback(() => {
    const savedLayout = localStorage.getItem('layout');
    if (savedLayout) {
      try {
        const layoutData = JSON.parse(savedLayout);
        setPanels(layoutData.panels);
        setActivePanelId(layoutData.activePanelId);
        setLayoutConfig(layoutData.layoutConfig);
      } catch (error) {
        console.error('Failed to load layout:', error);
      }
    }
  }, []);

  const resetLayout = useCallback(() => {
    setPanels([]);
    setActivePanelId(null);
    setLayoutConfig({
      panels: [],
      layout: 'grid',
      theme: 'dark',
      showGridLines: true,
      snapToGrid: true,
      gridSize: 10,
    });
  }, []);

  // Load layout on mount
  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  // Auto-save layout on changes
  useEffect(() => {
    saveLayout();
  }, [panels, activePanelId, layoutConfig, saveLayout]);

  const value: LayoutContextType = {
    panels,
    activePanelId,
    layoutConfig,
    addPanel,
    removePanel,
    updatePanel,
    movePanel,
    resizePanel,
    lockPanel,
    minimizePanel,
    maximizePanel,
    addTab,
    removeTab,
    switchTab,
    updateTab,
    setActivePanel,
    updateLayoutConfig,
    saveLayout,
    loadLayout,
    resetLayout,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
```

#### 2.2 Workspace Component

Create the main workspace component:

```typescript
// packages/ui/src/components/MultiPanel/Workspace.tsx
import React from 'react';
import { useLayout } from './LayoutProvider';
import { PanelContainer } from './PanelContainer';
import { PanelToolbar } from './PanelToolbar';

export const Workspace: React.FC = () => {
  const { panels, activePanelId, layoutConfig } = useLayout();

  return (
    <div className="workspace">
      <PanelToolbar />
      <div 
        className="workspace-content"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'repeat(12, 1fr)',
          gap: layoutConfig.showGridLines ? '1px' : '0',
          backgroundColor: layoutConfig.showGridLines ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        }}
      >
        {panels.map(panel => (
          <PanelContainer
            key={panel.id}
            panel={panel}
            isActive={panel.id === activePanelId}
          />
        ))}
      </div>
    </div>
  );
};
```

#### 2.3 Panel Container Component

Create the panel container component:

```typescript
// packages/ui/src/components/MultiPanel/PanelContainer.tsx
import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Panel } from '@shared/types/layout';
import { Panel } from './Panel';
import { PanelResizeHandle } from './PanelResizeHandle';

interface PanelContainerProps {
  panel: Panel;
  isActive: boolean;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({ panel, isActive }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'PANEL',
    item: { panelId: panel.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(ref);

  return (
    <div
      ref={ref}
      className={`panel-container ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        gridColumn: `span ${panel.position.w}`,
        gridRow: `span ${panel.position.h}`,
        gridColumnStart: panel.position.x + 1,
        gridRowStart: panel.position.y + 1,
        position: 'relative',
        zIndex: panel.zIndex,
        opacity: isDragging ? 0.5 : 1,
        display: panel.isMinimized ? 'none' : 'block',
      }}
    >
      <Panel panel={panel} isActive={isActive} />
      {!panel.isLocked && !panel.isMaximized && (
        <PanelResizeHandle panelId={panel.id} />
      )}
    </div>
  );
};
```

#### 2.4 Panel Component

Create the panel component:

```typescript
// packages/ui/src/components/MultiPanel/Panel.tsx
import React from 'react';
import { Panel as PanelType } from '@shared/types/layout';
import { PanelHeader } from './PanelHeader';
import { PanelContent } from './PanelContent';
import { TabBar } from './TabBar';

interface PanelProps {
  panel: PanelType;
  isActive: boolean;
}

export const Panel: React.FC<PanelProps> = ({ panel, isActive }) => {
  return (
    <div
      className={`panel ${panel.isMaximized ? 'maximized' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        border: isActive ? '2px solid #6366f1' : '1px solid #334155',
        borderRadius: '8px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
      }}
    >
      <PanelHeader panel={panel} isActive={isActive} />
      {panel.tabs.length > 0 && <TabBar panel={panel} />}
      <PanelContent panel={panel} />
    </div>
  );
};
```

#### 2.5 Panel Header Component

Create the panel header component:

```typescript
// packages/ui/src/components/MultiPanel/PanelHeader.tsx
import React from 'react';
import { X, Minus, Maximize2, Lock, Unlock } from 'lucide-react';
import { Panel as PanelType } from '@shared/types/layout';
import { useLayout } from './LayoutProvider';

interface PanelHeaderProps {
  panel: PanelType;
  isActive: boolean;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ panel, isActive }) => {
  const { removePanel, minimizePanel, maximizePanel, lockPanel } = useLayout();

  return (
    <div
      className="panel-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(51, 65, 85, 0.5)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
        cursor: 'move',
      }}
    >
      <div className="panel-title" style={{ fontWeight: 500, fontSize: '14px' }}>
        {panel.title}
      </div>
      <div className="panel-actions" style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => lockPanel(panel.id, !panel.isLocked)}
          style={{
            padding: '4px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'white',
          }}
        >
          {panel.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
        </button>
        <button
          onClick={() => minimizePanel(panel.id, !panel.isMinimized)}
          style={{
            padding: '4px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'white',
          }}
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => maximizePanel(panel.id, !panel.isMaximized)}
          style={{
            padding: '4px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'white',
          }}
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={() => removePanel(panel.id)}
          style={{
            padding: '4px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'white',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
```

#### 2.6 Panel Content Component

Create the panel content component:

```typescript
// packages/ui/src/components/MultiPanel/PanelContent.tsx
import React from 'react';
import { Panel as PanelType } from '@shared/types/layout';

interface PanelContentProps {
  panel: PanelType;
}

export const PanelContent: React.FC<PanelContentProps> = ({ panel }) => {
  return (
    <div
      className="panel-content"
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px',
      }}
    >
      {panel.content}
    </div>
  );
};
```

#### 2.7 Tab Bar Component

Create the tab bar component:

```typescript
// packages/ui/src/components/MultiPanel/TabBar.tsx
import React from 'react';
import { X } from 'lucide-react';
import { Panel as PanelType, Tab as TabType } from '@shared/types/layout';
import { useLayout } from './LayoutProvider';

interface TabBarProps {
  panel: PanelType;
}

export const TabBar: React.FC<TabBarProps> = ({ panel }) => {
  const { removeTab, switchTab } = useLayout();

  return (
    <div
      className="tab-bar"
      style={{
        display: 'flex',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
        overflowX: 'auto',
      }}
    >
      {panel.tabs.map(tab => (
        <div
          key={tab.id}
          className={`tab ${tab.isActive ? 'active' : ''}`}
          onClick={() => switchTab(panel.id, tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: tab.isActive ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
            borderBottom: tab.isActive ? '2px solid #6366f1' : 'none',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.title}</span>
          {tab.isModified && <span style={{ color: '#f59e0b' }}>●</span>}
          {tab.hasError && <span style={{ color: '#ef4444' }}>●</span>}
          {!tab.isPinned && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTab(panel.id, tab.id);
              }}
              style={{
                padding: '2px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'white',
                opacity: 0.6,
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

#### 2.8 Panel Resize Handle Component

Create the panel resize handle component:

```typescript
// packages/ui/src/components/MultiPanel/PanelResizeHandle.tsx
import React from 'react';
import { useDrag } from 'react-dnd';

interface PanelResizeHandleProps {
  panelId: string;
}

export const PanelResizeHandle: React.FC<PanelResizeHandleProps> = ({ panelId }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'RESIZE',
    item: { panelId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className="panel-resize-handle"
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        cursor: 'col-resize',
        backgroundColor: isDragging ? '#6366f1' : 'transparent',
        transition: 'background-color 0.2s',
      }}
    />
  );
};
```

#### 2.9 Panel Toolbar Component

Create the panel toolbar component:

```typescript
// packages/ui/src/components/MultiPanel/PanelToolbar.tsx
import React from 'react';
import { Plus, Layout, Save, RotateCcw, Settings } from 'lucide-react';
import { useLayout } from './LayoutProvider';

export const PanelToolbar: React.FC = () => {
  const { addPanel, saveLayout, resetLayout, updateLayoutConfig, layoutConfig } = useLayout();

  const handleAddPanel = () => {
    addPanel({
      type: 'code-editor',
      title: '新面板',
      content: <div>新面板内容</div>,
      position: { x: 0, y: 0, w: 6, h: 6 },
      minW: 2,
      minH: 4,
      isLocked: false,
      isMinimized: false,
      isMaximized: false,
    });
  };

  return (
    <div
      className="panel-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
      }}
    >
      <button
        onClick={handleAddPanel}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <Plus size={16} />
        添加面板
      </button>
      <button
        onClick={saveLayout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          color: 'white',
          border: '1px solid #6366f1',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <Save size={16} />
        保存布局
      </button>
      <button
        onClick={resetLayout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: 'white',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500',
        }}
      >
        <RotateCcw size={16} />
        重置布局
      </button>
      <div style={{ flex: 1 }} />
      <button
        onClick={() => updateLayoutConfig({ showGridLines: !layoutConfig.showGridLines })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: layoutConfig.showGridLines ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
          color: 'white',
          border: layoutConfig.showGridLines ? '1px solid #6366f1' : '1px solid #334155',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <Layout size={16} />
        网格线
      </button>
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: 'transparent',
          color: 'white',
          border: '1px solid #334155',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500',
        }}
      >
        <Settings size={16} />
        设置
      </button>
    </div>
  );
};
```

### 3. Styling

Create comprehensive styles for the multi-panel layout system:

```css
/* packages/ui/src/components/MultiPanel/styles.css */
.workspace {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.workspace-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.panel-container {
  transition: all 0.2s ease;
}

.panel-container.active {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
}

.panel-container.dragging {
  opacity: 0.5;
}

.panel {
  transition: all 0.3s ease;
}

.panel.maximized {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  border-radius: 0;
}

.panel-header {
  user-select: none;
}

.panel-header:hover {
  background-color: rgba(99, 102, 241, 0.3);
}

.panel-actions button:hover {
  background-color: rgba(99, 102, 241, 0.3);
  border-radius: 4px;
}

.tab {
  transition: all 0.2s ease;
}

.tab:hover {
  background-color: rgba(99, 102, 241, 0.2);
}

.tab.active {
  font-weight: 500;
}

.panel-resize-handle:hover {
  background-color: #6366f1;
}

.panel-toolbar button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.panel-toolbar button:active {
  transform: translateY(0);
  box-shadow: none;
}

/* Scrollbar styling */
.workspace-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.workspace-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.workspace-content::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.5);
  border-radius: 4px;
}

.workspace-content::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.8);
}
```

### 4. Integration

Integrate the multi-panel layout system into the main application:

```typescript
// src/App.tsx
import React from 'react';
import { LayoutProvider } from '@ui/components/MultiPanel/LayoutProvider';
import { Workspace } from '@ui/components/MultiPanel/Workspace';

function App() {
  return (
    <LayoutProvider>
      <Workspace />
    </LayoutProvider>
  );
}

export default App;
```

## Output Requirements

### Generated Components

1. ✅ `LayoutProvider.tsx` - Layout context provider
2. ✅ `Workspace.tsx` - Main workspace component
3. ✅ `PanelContainer.tsx` - Panel container component
4. ✅ `Panel.tsx` - Panel component
5. ✅ `PanelHeader.tsx` - Panel header component
6. ✅ `PanelContent.tsx` - Panel content component
7. ✅ `TabBar.tsx` - Tab bar component
8. ✅ `PanelResizeHandle.tsx` - Panel resize handle component
9. ✅ `PanelToolbar.tsx` - Panel toolbar component
10. ✅ `styles.css` - Component styles

### Type Definitions

1. ✅ `PanelType` - Panel type union
2. ✅ `Panel` - Panel interface
3. ✅ `Tab` - Tab interface
4. ✅ `LayoutConfig` - Layout configuration interface

## Verification Steps

### 1. Install Dependencies

\`\`\`bash
pnpm add react-grid-layout@{{REACT_GRID_LAYOUT_VERSION}}
pnpm add react-dnd@{{REACT_DND_VERSION}}
pnpm add react-dnd-html5-backend@{{REACT_DND_VERSION}}
pnpm add react-resizable@{{REACT_RESIZABLE_VERSION}}
pnpm add react-split-pane@{{REACT_SPLIT_PANE_VERSION}}
pnpm add react-tabs@{{REACT_TABS_VERSION}}
\`\`\`

**Expected**: All dependencies installed successfully.

### 2. Create Default Panels

\`\`\`typescript
// Create default panels
const defaultPanels = [
  {
    type: 'file-browser' as const,
    title: '文件浏览器',
    content: <FileBrowser />,
    position: { x: 0, y: 0, w: 3, h: 12 },
    minW: 2,
    minH: 6,
    isLocked: false,
    isMinimized: false,
    isMaximized: false,
  },
  {
    type: 'code-editor' as const,
    title: '代码编辑器',
    content: <CodeEditor />,
    position: { x: 3, y: 0, w: 6, h: 12 },
    minW: 4,
    minH: 6,
    isLocked: false,
    isMinimized: false,
    isMaximized: false,
  },
  {
    type: 'preview' as const,
    title: '实时预览',
    content: <Preview />,
    position: { x: 9, y: 0, w: 3, h: 12 },
    minW: 2,
    minH: 6,
    isLocked: false,
    isMinimized: false,
    isMaximized: false,
  },
];

defaultPanels.forEach(panel => addPanel(panel));
\`\`\`

**Expected**: Default panels created and displayed.

### 3. Test Panel Operations

\`\`\`typescript
// Test panel creation
addPanel({
  type: 'terminal' as const,
  title: '终端',
  content: <Terminal />,
  position: { x: 0, y: 6, w: 6, h: 6 },
  minW: 4,
  minH: 4,
  isLocked: false,
  isMinimized: false,
  isMaximized: false,
});

// Test panel movement
movePanel('panel-1', { x: 3, y: 3 });

// Test panel resizing
resizePanel('panel-1', { w: 4, h: 8 });

// Test panel locking
lockPanel('panel-1', true);

// Test panel minimization
minimizePanel('panel-1', true);

// Test panel maximization
maximizePanel('panel-1', true);
\`\`\`

**Expected**: All panel operations work correctly.

### 4. Test Tab Operations

\`\`\`typescript
// Test tab creation
addTab('panel-1', {
  panelId: 'panel-1',
  title: 'main.tsx',
  content: <CodeEditor file="main.tsx" />,
  isPinned: false,
  isModified: false,
  isUnsaved: false,
  hasError: false,
});

// Test tab switching
switchTab('panel-1', 'tab-1');

// Test tab removal
removeTab('panel-1', 'tab-1');
\`\`\`

**Expected**: All tab operations work correctly.

### 5. Test Layout Persistence

\`\`\`typescript
// Save layout
saveLayout();

// Reload page and load layout
loadLayout();
\`\`\`

**Expected**: Layout is saved and restored correctly.

## Success Criteria

- ✅ All components are created
- ✅ Panel operations work correctly
- ✅ Tab operations work correctly
- ✅ Drag and drop works smoothly
- ✅ Panel resizing works smoothly
- ✅ Layout persistence works correctly
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ All files formatted correctly
- ✅ Performance is acceptable (60fps)

## Next Steps

After completing this stage, proceed to:

1. **[P1-02-前端-实时预览](../P1-核心功能/YYC3-P1-前端-实时预览.md)** - Implement real-time preview functionality
2. **[P1-03-前端-代码编辑器](../P1-核心功能/YYC3-P1-前端-代码编辑器.md)** - Integrate Monaco Editor
3. **[P1-04-状态-全局状态管理](../P1-核心功能/YYC3-P1-状态-全局状态管理.md)** - Implement Zustand state management

---

<div align="center">

> **「YanYuCloudCube」**
> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**

</div>
```

---

## 📤 输出生成

### 生成文件

执行上述提示词后，应该生成以下文件：

1. `packages/ui/src/components/MultiPanel/LayoutProvider.tsx`
2. `packages/ui/src/components/MultiPanel/Workspace.tsx`
3. `packages/ui/src/components/MultiPanel/PanelContainer.tsx`
4. `packages/ui/src/components/MultiPanel/Panel.tsx`
5. `packages/ui/src/components/MultiPanel/PanelHeader.tsx`
6. `packages/ui/src/components/MultiPanel/PanelContent.tsx`
7. `packages/ui/src/components/MultiPanel/TabBar.tsx`
8. `packages/ui/src/components/MultiPanel/PanelResizeHandle.tsx`
9. `packages/ui/src/components/MultiPanel/PanelToolbar.tsx`
10. `packages/ui/src/components/MultiPanel/styles.css`
11. `packages/shared/src/types/layout.ts`

---

## ✅ 验收标准

### 功能验收

- ✅ 面板可以正常创建
- ✅ 面板可以正常删除
- ✅ 面板可以正常拖拽移动
- ✅ 面板可以正常调整大小
- ✅ 面板可以正常锁定/解锁
- ✅ 面板可以正常最小化/展开
- ✅ 面板可以正常最大化/还原
- ✅ 标签页可以正常创建
- ✅ 标签页可以正常删除
- ✅ 标签页可以正常切换
- ✅ 布局可以正常保存
- ✅ 布局可以正常加载
- ✅ 布局可以正常重置

### 性能验收

- ✅ 面板操作响应时间 < 100ms
- ✅ 拖拽操作流畅度 60fps
- ✅ 内存使用 < 500MB
- ✅ CPU 使用 < 30%

### 代码质量验收

- ✅ 无 TypeScript 编译错误
- ✅ 无 ESLint 错误
- ✅ 所有文件格式正确
- ✅ 代码符合规范
- ✅ 组件可复用性高

---

## 🎯 下一步

完成本阶段后，请继续执行：

1. **[P1-02-前端-实时预览](./YYC3-P1-前端-实时预览.md)** - 实现实时预览功能
2. **[P1-03-前端-代码编辑器](./YYC3-P1-前端-代码编辑器.md)** - 集成 Monaco Editor
3. **[P1-04-状态-全局状态管理](./YYC3-P1-状态-全局状态管理.md)** - 实现 Zustand 状态管理

---

<div align="center">

> **「YanYuCloudCube」**
> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-14 |
| 更新日期 | 2026-04-08 |
| 内容校验 | 029ab458f6655594 |
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
