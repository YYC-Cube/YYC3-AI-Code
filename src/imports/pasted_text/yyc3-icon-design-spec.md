---
file: YYC3-图标系统-设计规范.md
description: YYC³ AI Family 图标系统设计规范，包含图标设计原则、图标库规范、交互规范、图标分类等
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-10
updated: 2026-03-10
status: stable
tags: icons,design-system,ui,zh-CN
category: design
language: zh-CN
design_type: design-system
review_status: approved
audience: designers,developers
complexity: intermediate
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ 图标系统 - 设计规范

## 图标设计原则

### 核心原则

1. **一致性**: 所有图标遵循统一的设计语言
2. **清晰性**: 图标含义明确，易于理解
3. **简洁性**: 避免过度装饰，保持简洁
4. **可识别性**: 在不同尺寸下都清晰可辨
5. **无障碍性**: 考虑色盲用户和屏幕阅读器

### 视觉风格

- **线条风格**: 统一使用 Lucide 图标库风格
- **线条粗细**: 2px 标准线条
- **圆角处理**: 2px 圆角，保持一致性
- **图标尺寸**: 24px 标准尺寸，支持 16px/32px/48px

## 图标库规范

### 图标库选择

**主图标库**: Lucide React v0.312.0

**选择理由**:
- 开源免费，MIT 许可
- 风格统一，质量高
- TypeScript 原生支持
- 持续维护更新
- 社区活跃，生态完善

### 图标分类

#### 导航图标

| 图标 | 中文名称 | 英文名称 | 用途 |
|------|---------|---------|------|
| 🏠 | 首页 | Home - 返回首页 |
| 📁 | 文件 | File - 文件管理 |
| 🔔 | 通知 | Notification - 通知中心 |
| ⚙️ | 设置 | Settings - 系统设置 |
| 🐙 | GitHub | GitHub - 代码仓库 |
| 📤 | 导出 | Export - 导出文件 |
| 🚀 | 发布 | Deploy - 发布部署 |
| ⚡ | 快速操作 | Quick Action - 快速操作 |
| 🌐 | 语言 | Language - 语言切换 |
| 👤 | 用户 | User - 用户设置 |

#### 视图切换图标

| 图标 | 中文名称 | 英文名称 | 用途 |
|------|---------|---------|------|
| ◀ | 返回 | Back - 返回上一级 |
| 👁 | 预览 | Preview - 预览视图 |
| ⌨️ | 代码 | Code - 代码视图 |
| ⋮⋮ | 分隔线 | Separator - 视觉分隔 |
| 🔍 | 搜索 | Search - 全局搜索 |
| ⋯ | 更多 | More - 扩展菜单 |

#### AI 功能图标

| 图标 | 中文名称 | 英文名称 | 用途 |
|------|---------|---------|------|
| 🤖 | AI 模型 | AI Model - AI 模型选择 |
| 🤖 | AI 对话 | AI Chat - AI 对话界面 |
| 🔧 | AI 设置 | AI Settings - AI 参数设置 |
| ⚙️ | AI 配置 | AI Config - AI 配置选项 |

#### 终端图标

| 图标 | 中文名称 | 英文名称 | 用途 |
|------|---------|---------|------|
| 🖥️ | 终端 | Terminal - 打开终端 |
| 📋 | 标签页 | Tab - 终端标签页 |

#### 用户图标

| 图标 | 中文名称 | 英文名称 | 用途 |
|------|---------|---------|------|
| 👤 | 用户头像 | User Avatar - 用户头像 |
| 📝 | 用户名称 | User Name - 用户名称 |
| 🟢 | 在线状态 | Online Status - 在线状态 |
| ⚙️ | 偏好设置 | Preferences - 偏好设置 |

#### 功能操作图标

| 图标 | 中文名称 | 英文名称 | 用途 |
|------|---------|---------|------|
| ⊕ | 添加 | Add - 添加功能 |
| 📤 | 图片上传 | Image Upload - 图片上传 |
| 📁 | 文件导入 | File Import - 文件导入 |
| 🔗 | GitHub 链接 | GitHub Link - GitHub 链接 |
| 🎨 | Figma 文件 | Figma File - Figma 文件 |
| 💻 | 代码片段 | Code Snippet - 代码片段 |
| 📋 | 剪贴板 | Clipboard - 剪贴板 |

## 图标交互规范

### 状态定义

#### 默认状态

- **显示**: 只显示图标
- **颜色**: 使用默认主题色
- **不显示文字**: 保持界面简洁

#### 悬停状态

- **显示**: 显示中文名称（根据当前语言设置）
- **颜色**: 使用悬停主题色（高亮）
- **提示**: 显示 Tooltip 提示

#### 激活状态

- **显示**: 高亮显示
- **颜色**: 使用激活主题色
- **指示**: 表示当前功能已激活

#### 禁用状态

- **显示**: 灰度显示
- **颜色**: 使用禁用色（opacity: 0.4）
- **交互**: 不响应点击事件

### 快捷键规范

#### 全局快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| Ctrl+Shift+A | 添加 | 打开添加菜单 |
| Ctrl+U | 图片上传 | 上传图片 |
| Ctrl+O | 文件导入 | 导入文件 |
| Ctrl+G | GitHub 链接 | 打开 GitHub 链接 |
| Ctrl+F | Figma 文件 | 打开 Figma 文件 |
| Ctrl+I | 代码片段 | 插入代码片段 |
| Ctrl+V | 剪贴板 | 粘贴剪贴板内容 |

#### 导航快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| Ctrl+Shift+P | 项目管理 | 打开项目管理 |
| Ctrl+Shift+N | 通知中心 | 打开通知中心 |
| Ctrl+, | 设置 | 打开设置 |
| Ctrl+Shift+G | GitHub | 打开 GitHub |
| Ctrl+Shift+S | 分享 | 分享项目 |
| Ctrl+Shift+D | 发布 | 发布部署 |
| Ctrl+Shift+Q | 快速操作 | 打开快速操作 |
| Ctrl+Shift+L | 语言切换 | 切换语言 |

#### 视图切换快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| Esc | 返回 | 返回上一级 |
| Ctrl+1 | 预览 | 切换至预览视图 |
| Ctrl+2 | 代码 | 切换至代码视图 |
| Ctrl+Shift+F | 搜索 | 全局搜索 |
| Ctrl+Shift+M | 更多 | 打开更多菜单 |

## 图标使用指南

### 导入方式

```typescript
import { 
  Home, 
  File, 
  Settings, 
  GitHub, 
  User 
} from 'lucide-react';
```

### 使用示例

```typescript
// 基础使用
<Home size={24} />

// 带颜色
<Settings size={24} className="text-primary" />

// 带状态
<User 
  size={24} 
  className={isActive ? 'text-accent' : 'text-muted'} 
/>
```

### 响应式尺寸

```typescript
// 不同尺寸
<Home size={16} />  // 小尺寸
<Home size={24} />  // 标准尺寸
<Home size={32} />  // 大尺寸
<Home size={48} />  // 超大尺寸
```

## 图标主题适配

### 亮色主题

```css
.icon-light {
  color: #1a1a1a;
}
```

### 暗色主题

```css
.icon-dark {
  color: #f5f5f5;
}
```

### 自定义主题

```typescript
interface IconTheme {
  default: string;
  hover: string;
  active: string;
  disabled: string;
}

const customTheme: IconTheme = {
  default: '#6366f1',
  hover: '#8b5cf6',
  active: '#3b82f6',
  disabled: '#9ca3af',
};
```

## 图标性能优化

### 按需加载

```typescript
import { lazy } from 'react';

const LazyIcon = lazy(() => import('lucide-react').then(mod => ({ default: mod.IconName })));
```

### 图标预加载

```typescript
// 预加载常用图标
import { 
  Home, 
  File, 
  Settings, 
  GitHub 
} from 'lucide-react';
```

### SVG 优化

- 使用 `stroke-width="2"` 保持线条一致
- 使用 `stroke-linecap="round"` 圆角处理
- 使用 `stroke-linejoin="round"` 连接圆角

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
