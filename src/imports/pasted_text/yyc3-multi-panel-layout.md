---
file: YYC3-编程模式-多联式布局.md
description: YYC³ AI Family 智能AI编程模式页面设计，包含页面布局策略、页眉公共图标区、三栏式布局架构、区域划分与功能定义
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-10
updated: 2026-03-10
status: stable
tags: programming,layout,multi-panel,ui-design,zh-CN
category: design
language: zh-CN
design_type: ui-ux
review_status: approved
audience: designers,developers
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ 编程模式 - 多联式布局

## 页面布局策略

**布局类型**: 多联式可拖拽合并布局系统
**设计理念**: 模块化、可扩展、用户中心

## 页眉公共图标区

### 顶部导航栏

**布局结构**: Logo + 项目标题区 + 公共图标区 + 个人信息

**公共图标功能**:

| 图标 | 中文名称 | 英文名称 | 功能 | 快捷键 | 悬停提示（中文） | 悬停提示（英文） |
|------|---------|---------|------|--------|----------------|----------------|
| 📁 | 项目管理 | Projects | 项目列表、创建新项目、项目设置 | Ctrl+Shift+P | 项目管理 | Projects |
| 🔔 | 通知中心 | Notifications | 系统通知、更新提醒、消息中心 | Ctrl+Shift+N | 通知中心 | Notifications |
| ⚙️ | 设置 | Settings | 全局设置、偏好配置、主题切换 | Ctrl+, | 设置 | Settings |
| 🐙 | GitHub | GitHub | 代码仓库、版本控制、协作功能 | Ctrl+Shift+G | GitHub | GitHub |
| 📤 | 分享 | Share | 项目分享、协作邀请、导出功能 | Ctrl+Shift+S | 分享 | Share |
| 🚀 | 发布 | Deploy | 部署发布、版本管理、上线流程 | Ctrl+Shift+D | 发布 | Deploy |
| ⚡ | 快速操作 | Quick Actions | 快速操作菜单、常用功能 | Ctrl+Shift+Q | 快速操作 | Quick Actions |
| 🌐 | 语言切换 | Language | 中/英文语言切换 | Ctrl+Shift+L | 语言切换 | Language |

**图标交互规范**:

- **默认状态**: 只显示图标，不显示文字
- **悬停状态**: 显示中文名称（根据当前语言设置）
- **激活状态**: 高亮显示，表示当前功能已激活
- **禁用状态**: 灰度显示，表示功能不可用

### 视图切换栏

**布局位置**: 页眉下方，三栏布局上方

**视图切换图标**:

| 图标 | 中文名称 | 英文名称 | 功能 | 快捷键 | 悬停提示（中文） | 悬停提示（英文） |
|------|---------|---------|------|--------|----------------|----------------|
| ◀ | 返回 | Back | 返回上一级或主页 | Esc | 返回 | Back |
| 👁 | 预览 | Preview | 切换至项目实时预览视图（合并中栏和右栏） | Ctrl+1 | 预览 | Preview |
| ⌨️ | 代码 | Code | 切换至代码详情面板（显示右栏代码编辑） | Ctrl+2 | 代码 | Code |
| ⋮⋮ | 分隔线 | Separator | 视觉分隔符 | - | - | - |
| 🔍 | 搜索 | Search | 全局搜索功能（搜索文件、代码、组件） | Ctrl+Shift+F | 搜索 | Search |
| ⋯ | 更多 | More | 扩展菜单、快捷操作、工具列表 | Ctrl+Shift+M | 更多 | More |

**图标交互规范**:

- **默认状态**: 只显示图标，不显示文字
- **悬停状态**: 显示中文名称（根据当前语言设置）
- **激活状态**: 高亮显示，表示当前功能已激活
- **禁用状态**: 灰度显示，表示功能不可用

## 三栏式布局架构

### 完整页面布局结构

```
┌───────────────────────────────────────────────────────────────────────┐
│  🏠 CloudPivot AI                            📁 🔔 ⚙️ 🐙 📤 🚀 ⚡ 🌐 👤   │
├───────────────────────────────────────────────────────────────────────┤
│  🤖 🔧 ⚙️                 ◀ 👁 ⌨️  🔍 📁 📄         💻 📝 ⚡ 📋            │
├───────────────────────────────────────────────────────────────────────┤
│ │             │   │                      ││                    │      │
│ │   左栏       │   │        中栏          ││        右栏         │      │
│ │   (25%)     │   │        (45%)         ││        (30%)       │      │
│ │             │   │                      ││                    │      │
│ │ ┌─────────┐ │   │ ┌──────────────────┐ ││ ┌────────────────┐ │      │
│ │ │  AI对话│ │   │ │   文件资源管理器   │ ││ │    文件预览/编辑 │ │      │
│ │ │  面板    │ │   │ │     项目结构      │ ││ │     代码编辑器   │ │      │
│ │ │         │ │   │ │     文件列表      │ ││ │      语法高亮    │ │      │
│ │ │         │ │   │ │     搜索过滤      │ ││ │     智能提示     │ │      │ 
│ │ │         │ │   │ │                  │ ││ │     代码折叠    │ │      │
│ │ │         │ │   │ │                  │ ││ │                │ │      │
│ │ │         │ │   │ │                  │ ││ │                │ │      │
│ │ │         │ │   │ │                  │ ││ │                │ │      │
│ │ │         │ │   │ │                  │ ││ │                │ │      │
│ │ │         │ │   │ │                  │ ││ │                │ │      │
│ │ │         │ │   │ │                  │ ││ │                │ │      │
│ │ │         │ │   │ │                  │ ││ │                │ │      │
│ │ │─────────│ │   │ └──────────────────┘ ││ └────────────────┘ │      │
│ │ │✏️ 用户输入│ │   │ ┌────────────────────││──────────────────┐ │      │
│ │ │         │ │   │ │   集成终端 🖥️ 命令行📋││⚡ 命令执行/快速操作 │ │      │
│ │ │         │ │   │ │                    ││                  │ │      │
│ │ └─────────┘ │   │ └────────────────────││──────────────────┘ │      │
│ └─────────────┘   └──────────────────────┘└────────────────────┘      │
└───────────────────────────────────────────────────────────────────────┘
```

### 图标对应说明

**顶部导航栏图标**:

- 🏠 首页 (Home) - 返回首页
- 📁 文件 (File) - 切换至文件管理
- 🔔 通知 (Notification) - 查看通知
- ⚙️ 设置 (Settings) - 打开设置
- 🐙 GitHub - GitHub 集成
- 📤 导出 (Export) - 导出文件
- 🚀 发布 (Deploy) - 发布部署
- ⚡ 快速操作 (Quick Action) - 快速操作
- 🌐 语言 (Language) - 切换语言
- 👤 用户 (User) - 用户设置

**导航图标**:

- ◀ 返回 (Back) - 返回上一级
- 👁 预览 (Preview) - 切换至预览视图
- ⌨️ 代码 (Code) - 切换至代码视图
- ⋯ 更多 (More) - 扩展菜单
- 🔍 搜索 (Search) - 全局搜索
- ⋮ 扩展菜单 - 更多选项

**AI 功能图标**:

- 🤖 AI模型 (AI Model) - AI模型选择

**终端图标**:

- 🖥️ 终端 (Terminal) - 打开终端
- 📋 标签页 (Tab) - 终端标签页

### 布局说明

- **左栏 (25%)**: 用户与智能AI交互区，包含用户信息、AI模型选择、AI交互主界面、用户聊天框
- **中栏 (45%)**: 项目文件管理区，包含文件树、文件操作、代码编辑器
- **右栏 (30%)**: 文件代码编辑区，包含语法高亮、代码折叠、集成终端

## 区域划分与功能定义

### 左栏 - 用户与智能AI交互区

#### 用户信息展示面板

| 图标 | 中文名称 | 英文名称 | 功能 | 悬停提示（中文） | 悬停提示（英文） |
|------|---------|---------|------|----------------|----------------|
| 👤 | 用户头像 | User Avatar | 显示用户头像，点击可切换用户 | 用户头像 | User Avatar |
| 📝 | 用户名称 | User Name | 显示当前用户名称 | 用户名称 | User Name |
| 🟢 | 在线状态 | Online Status | 实时在线状态指示（在线/忙碌/离线） | 在线状态 | Online Status |
| ⚙️ | 偏好设置 | Preferences | 快速访问用户偏好设置 | 偏好设置 | Preferences |

**图标交互规范**:

- **默认状态**: 只显示图标，不显示文字
- **悬停状态**: 显示中文名称（根据当前语言设置）
- **激活状态**: 高亮显示，表示当前功能已激活
- **禁用状态**: 灰度显示，表示功能不可用

## 布局状态持久化

### 布局配置数据结构

```typescript
interface LayoutConfig {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  panels: PanelConfig[];
  activePanel: string;
  collapsedPanels: string[];
  splitRatios: {
    left: number;
    middle: number;
    right: number;
  };
}

interface PanelConfig {
  id: string;
  type: 'ai-chat' | 'file-manager' | 'code-editor' | 'terminal';
  position: 'left' | 'middle' | 'right';
  order: number;
  isVisible: boolean;
  isCollapsed: boolean;
  size?: number;
}
```

### 持久化策略

```typescript
// 布局持久化服务
class LayoutPersistenceService {
  private storageKey = 'yyc3-layout-config';
  
  // 保存布局配置
  saveLayout(config: LayoutConfig): void {
    try {
      const serialized = JSON.stringify(config);
      localStorage.setItem(this.storageKey, serialized);
      
      // 同步到服务器
      this.syncToServer(config);
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  }
  
  // 加载布局配置
  loadLayout(): LayoutConfig | null {
    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (serialized) {
        return JSON.parse(serialized);
      }
      return null;
    } catch (error) {
      console.error('Failed to load layout:', error);
      return null;
    }
  }
  
  // 同步到服务器
  private async syncToServer(config: LayoutConfig): Promise<void> {
    try {
      await fetch('/api/user/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
    } catch (error) {
      console.error('Failed to sync layout to server:', error);
    }
  }
  
  // 从服务器同步
  async syncFromServer(): Promise<LayoutConfig | null> {
    try {
      const response = await fetch('/api/user/layout');
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to sync layout from server:', error);
      return null;
    }
  }
}
```

### 自动保存机制

```typescript
// 自动保存 Hook
const useAutoSaveLayout = (layoutConfig: LayoutConfig) => {
  const persistenceService = useMemo(
    () => new LayoutPersistenceService(),
    []
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const debouncedSave = useMemo(
    () => debounce((config: LayoutConfig) => {
      setIsSaving(true);
      persistenceService.saveLayout(config);
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000),
    [persistenceService]
  );
  
  useEffect(() => {
    debouncedSave(layoutConfig);
  }, [layoutConfig, debouncedSave]);
  
  return { isSaving, lastSaved };
};
```

## 自定义布局导入导出

### 导出布局

```typescript
// 布局导出功能
const exportLayout = async (config: LayoutConfig): Promise<void> => {
  try {
    // 创建导出数据
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      layout: config,
    };
    
    // 生成文件名
    const fileName = `yyc3-layout-${config.name}-${Date.now()}.json`;
    
    // 创建 Blob 并下载
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // 显示成功提示
    toast.success('布局导出成功');
  } catch (error) {
    console.error('Failed to export layout:', error);
    toast.error('布局导出失败');
  }
};
```

### 导入布局

```typescript
// 布局导入功能
const importLayout = async (file: File): Promise<LayoutConfig> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        // 验证数据格式
        if (!data.version || !data.layout) {
          throw new Error('Invalid layout file format');
        }
        
        // 版本兼容性检查
        if (!isVersionCompatible(data.version)) {
          throw new Error('Layout version is not compatible');
        }
        
        resolve(data.layout);
        toast.success('布局导入成功');
      } catch (error) {
        console.error('Failed to import layout:', error);
        toast.error('布局导入失败');
        reject(error);
      }
    };
    
    reader.onerror = () => {
      toast.error('文件读取失败');
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

// 版本兼容性检查
const isVersionCompatible = (version: string): boolean => {
  const currentVersion = '1.0.0';
  const [major, minor] = version.split('.').map(Number);
  const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
  
  // 主版本必须匹配
  if (major !== currentMajor) {
    return false;
  }
  
  // 次版本不能高于当前版本
  if (minor > currentMinor) {
    return false;
  }
  
  return true;
};
```

### 预设布局模板

```typescript
// 预设布局配置
const presetLayouts: LayoutConfig[] = [
  {
    id: 'default',
    name: '默认布局',
    createdAt: new Date(),
    updatedAt: new Date(),
    panels: [
      { id: 'ai-chat', type: 'ai-chat', position: 'left', order: 1, isVisible: true, isCollapsed: false },
      { id: 'file-manager', type: 'file-manager', position: 'middle', order: 1, isVisible: true, isCollapsed: false },
      { id: 'code-editor', type: 'code-editor', position: 'right', order: 1, isVisible: true, isCollapsed: false },
    ],
    activePanel: 'ai-chat',
    collapsedPanels: [],
    splitRatios: { left: 25, middle: 45, right: 30 },
  },
  {
    id: 'coding-focused',
    name: '编程专注',
    createdAt: new Date(),
    updatedAt: new Date(),
    panels: [
      { id: 'file-manager', type: 'file-manager', position: 'left', order: 1, isVisible: true, isCollapsed: false },
      { id: 'code-editor', type: 'code-editor', position: 'middle', order: 1, isVisible: true, isCollapsed: false },
      { id: 'ai-chat', type: 'ai-chat', position: 'right', order: 1, isVisible: true, isCollapsed: true },
    ],
    activePanel: 'code-editor',
    collapsedPanels: ['ai-chat'],
    splitRatios: { left: 20, middle: 60, right: 20 },
  },
  {
    id: 'ai-focused',
    name: 'AI 交互',
    createdAt: new Date(),
    updatedAt: new Date(),
    panels: [
      { id: 'ai-chat', type: 'ai-chat', position: 'left', order: 1, isVisible: true, isCollapsed: false },
      { id: 'code-editor', type: 'code-editor', position: 'right', order: 1, isVisible: true, isCollapsed: false },
    ],
    activePanel: 'ai-chat',
    collapsedPanels: [],
    splitRatios: { left: 40, right: 60 },
  },
  {
    id: 'preview-mode',
    name: '预览模式',
    createdAt: new Date(),
    updatedAt: new Date(),
    panels: [
      { id: 'file-manager', type: 'file-manager', position: 'left', order: 1, isVisible: true, isCollapsed: false },
      { id: 'code-editor', type: 'code-editor', position: 'middle', order: 1, isVisible: true, isCollapsed: false },
    ],
    activePanel: 'code-editor',
    collapsedPanels: [],
    splitRatios: { left: 30, middle: 70 },
  },
];

// 布局切换组件
const LayoutSwitcher: React.FC = () => {
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(presetLayouts[0]);
  
  const handleLayoutChange = (layoutId: string) => {
    const layout = presetLayouts.find(l => l.id === layoutId);
    if (layout) {
      setCurrentLayout(layout);
      // 应用布局
      applyLayout(layout);
    }
  };
  
  return (
    <div className="layout-switcher">
      <select
        value={currentLayout.id}
        onChange={(e) => handleLayoutChange(e.target.value)}
        className="layout-select"
      >
        {presetLayouts.map((layout) => (
          <option key={layout.id} value={layout.id}>
            {layout.name}
          </option>
        ))}
      </select>
      
      <button onClick={() => exportLayout(currentLayout)}>
        导出布局
      </button>
      
      <label>
        导入布局
        <input
          type="file"
          accept=".json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const layout = await importLayout(file);
              setCurrentLayout(layout);
              applyLayout(layout);
            }
          }}
        />
      </label>
    </div>
  );
};
```

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-10
**维护团队**: YanYuCloudCube Team

---

<div align="center">

> **「YanYuCloudCube」**
> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**

</div>
