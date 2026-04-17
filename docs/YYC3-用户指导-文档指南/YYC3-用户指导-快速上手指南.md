---
file: YYC3-用户指导-快速上手指南.md
description: YYC³ AI Code 开发者快速上手指南 - 项目简介、技术栈、环境准备、开发工作流、核心概念等入门指引
author: YanYuCloudCube Team
version: v3.0.0
created: 2026-03-26
updated: 2026-04-10
status: published
tags: [快速上手],[开发者指南],[环境配置],[项目结构]
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ AI 开发者快速上手指南

## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维

---

## 📖 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [环境准备](#环境准备)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发工作流](#开发工作流)
- [核心概念](#核心概念)
- [常用命令](#常用命令)
- [测试指南](#测试指南)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)
- [资源链接](#资源链接)

---

## 🎯 项目简介

YYC³ AI 是一个智能化的代码生成与协作平台，基于 AI 驱动的代码生成、实时协作编辑、多模态支持等核心功能，为开发者提供前所未有的开发体验。

### 核心特性

- **AI 代码生成**：基于大语言模型的智能代码生成
- **实时协作**：基于 CRDT（Yjs）的多人实时协作编辑
- **多模态支持**：支持图片、代码、文本等多种输入方式
- **智能路由**：AI 驱动的智能路由决策
- **主题定制**：高度可定制的主题系统
- **响应式设计**：完美的移动端适配

### 技术亮点

- ⚡ **Vite 构建工具**：极速的开发体验
- 🎨 **React 18**：最新的 React 特性
- 🔷 **TypeScript**：完整的类型安全
- 🎯 **Zustand**：轻量级状态管理
- 🔄 **Yjs CRDT**：无冲突的实时协作
- 🤖 **AI 集成**：OpenAI、Claude 等多个 AI 提供商

---

## 🛠️ 技术栈

### 前端框架
- **React 18.3.1**：UI 框架
- **React Router v7**：路由管理
- **Motion**：动画库（Framer Motion）

### 状态管理
- **Zustand 4.5.5**：全局状态管理
  - `app-store.ts`：应用状态
  - `theme-store.ts`：主题状态
  - `settings-store.ts`：设置状态
  - `ai-service-store.ts`：AI 服务状态

### 协作功能
- **Yjs 13.6.19**：CRDT 数据结构
- **y-indexeddb 9.0.12**：本地持久化
- **y-websocket 1.5.0**：WebSocket 同步

### UI 组件
- **Lucide React**：图标库
- **Sonner**：Toast 通知
- **Recharts**：图表组件
- **Headless UI**：无障碍组件

### 开发工具
- **Vite 5.x**：构建工具
- **TypeScript 5.x**：类型系统
- **Vitest**：单元测试框架
- **Playwright**：E2E 测试框架
- **ESLint**：代码规范
- **Prettier**：代码格式化

---

## 🚀 环境准备

### 系统要求
- **Node.js**：v20.0.0 或更高版本
- **pnpm**：v9.0.0 或更高版本
- **Git**：v2.30.0 或更高版本
- **操作系统**：macOS、Linux、Windows

### 安装依赖

#### 1. 克隆仓库

```bash
git clone https://github.com/your-org/YYC3-Code-AI.git
cd YYC3-Code-AI
```

#### 2. 安装 pnpm（如果未安装）

```bash
npm install -g pnpm@latest
```

#### 3. 安装项目依赖

```bash
pnpm install
```

### 环境变量配置

创建 `.env` 文件：

```env
# AI 服务配置
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key
VITE_LOCAL_LLM_URL=http://localhost:11434

# WebSocket 服务器配置
VITE_WS_URL=ws://localhost:1234
VITE_WS_ROOM=default

# 开发环境配置
VITE_DEV_MODE=true
VITE_DEBUG=true
```

---

## ⚡ 快速开始

### 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:5173` 查看应用。

### 构建生产版本

```bash
pnpm build
```

构建产物将输出到 `dist/` 目录。

### 预览生产构建

```bash
pnpm preview
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并监听文件变化
pnpm test:watch

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行 E2E 测试
pnpm test:e2e
```

### 代码检查和格式化

```bash
# 运行 ESLint
pnpm lint

# 自动修复 ESLint 错误
pnpm lint:fix

# 运行 Prettier
pnpm format

# 检查 Prettier
pnpm format:check
```

---

## 📁 项目结构

```
YYC3-Code-AI/
├── src/                          # 源代码
│   ├── app/                      # 应用主目录
│   │   ├── components/           # React 组件
│   │   │   ├── ui/             # 基础 UI 组件
│   │   │   ├── home/           # 首页组件
│   │   │   ├── collaboration/   # 协作组件
│   │   │   ├── figma/          # Figma 集成
│   │   │   ├── theme/          # 主题组件
│   │   │   ├── designer/       # 设计器组件
│   │   │   └── icons/          # 图标组件
│   │   ├── stores/              # Zustand 状态管理
│   │   │   ├── app-store.ts
│   │   │   ├── theme-store.ts
│   │   │   ├── settings-store.ts
│   │   │   └── ai-service-store.ts
│   │   ├── hooks/               # React Hooks
│   │   │   └── services/       # 服务层 Hooks
│   │   ├── services/            # 业务服务
│   │   │   ├── yjs/           # CRDT 协作
│   │   │   ├── edge/          # 边缘计算
│   │   │   └── ai-service.ts  # AI 服务
│   │   ├── utils/               # 工具函数
│   │   ├── types/               # TypeScript 类型
│   │   ├── workers/             # Web Workers
│   │   ├── App.tsx              # 应用根组件
│   │   ├── main.tsx             # 应用入口
│   │   └── vite-env.d.ts        # Vite 类型定义
├── tests/                       # 测试代码
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── e2e/                    # E2E 测试
├── docs/                        # 项目文档
├── scripts/                     # 脚本文件
├── public/                      # 静态资源
├── index.html                   # HTML 入口
├── package.json                 # 项目配置
├── pnpm-lock.yaml              # 依赖锁定
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
├── vitest.config.ts           # Vitest 配置
├── playwright.config.ts        # Playwright 配置
└── README.md                  # 项目说明
```

---

## 🔄 开发工作流

### 1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

### 2. 开发新功能

```bash
# 在 src/ 中开发新功能
# 编写组件、服务、类型等
```

### 3. 编写测试

```bash
# 在 tests/ 中编写测试
# 确保测试覆盖核心逻辑
```

### 4. 运行测试

```bash
# 运行所有测试
pnpm test

# 或运行特定测试
pnpm test tests/unit/components/YourComponent.test.tsx
```

### 5. 代码检查

```bash
# 运行 ESLint
pnpm lint

# 自动修复
pnpm lint:fix

# 运行 Prettier
pnpm format
```

### 6. 提交代码

```bash
git add .
git commit -m "feat: add your feature description"
```

### 7. 推送到远程

```bash
git push origin feature/your-feature-name
```

### 8. 创建 Pull Request

在 GitHub 上创建 Pull Request，等待 Code Review。

---

## 🧠 核心概念

### 状态管理（Zustand）

YYC³ AI 使用 Zustand 进行状态管理，状态分为 4 个主要 Store：

#### 1. App Store
应用全局状态，管理项目、消息、AI 模型等。

```typescript
import { useAppStore } from '@/app/stores/app-store'

function MyComponent() {
  const { projects, addProject, deleteProject } = useAppStore()
  
  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
      <button onClick={() => addProject('New Project')}>
        Add Project
      </button>
    </div>
  )
}
```

#### 2. Theme Store
主题状态，管理主题、颜色、字体等。

```typescript
import { useThemeStore } from '@/app/stores/theme-store'

function MyComponent() {
  const { currentTheme, setTheme } = useThemeStore()
  
  return (
    <div>
      <h1>Current Theme: {currentTheme.name}</h1>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark Theme
      </button>
    </div>
  )
}
```

#### 3. Settings Store
设置状态，管理用户设置、偏好等。

```typescript
import { useSettingsStore } from '@/app/stores/settings-store'

function MyComponent() {
  const { settings, updateSettings } = useSettingsStore()
  
  return (
    <div>
      <h1>Settings</h1>
      <label>
        <input
          type="checkbox"
          checked={settings.autoSave}
          onChange={(e) => updateSettings({ autoSave: e.target.checked })}
        />
        Auto Save
      </label>
    </div>
  )
}
```

#### 4. AI Service Store
AI 服务状态，管理 AI 模型、聊天、响应等。

```typescript
import { useAIServiceStore } from '@/app/stores/ai-service-store'

function MyComponent() {
  const { messages, addMessage, sendMessage } = useAIServiceStore()
  
  const handleSendMessage = () => {
    sendMessage('Hello AI!')
  }
  
  return (
    <div>
      <ul>
        {messages.map(msg => (
          <li key={msg.id}>{msg.content}</li>
        ))}
      </ul>
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  )
}
```

### 组件开发规范

#### 组件文件结构

```typescript
/**
 * @file ComponentName.tsx
 * @description 组件描述
 * @author Your Name <your.email@example.com>
 * @version 1.0.0
 * @created 2026-03-26
 * @license MIT
 */

import { useState, useEffect } from 'react'

// ==================== Types ====================

interface ComponentProps {
  // Props 定义
  title: string
  onSubmit?: () => void
}

// ==================== Constants ====================

const DEFAULT_VALUE = ''

// ==================== Helper Functions ====================

function formatTitle(title: string): string {
  return title.trim()
}

// ==================== Main Component ====================

export function ComponentName({ title, onSubmit }: ComponentProps) {
  const [value, setValue] = useState(DEFAULT_VALUE)

  useEffect(() => {
    setValue(formatTitle(title))
  }, [title])

  const handleSubmit = () => {
    onSubmit?.()
  }

  return (
    <div>
      <h1>{value}</h1>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

#### 命名导出 vs 默认导出

**推荐使用命名导出**：

```typescript
// ✅ 推荐：命名导出
export function MyComponent() {
  return <div>My Component</div>
}

// ❌ 不推荐：默认导出
export default function MyComponent() {
  return <div>My Component</div>
}
```

**导入方式**：

```typescript
// ✅ 推荐：命名导入
import { MyComponent } from '@/app/components/MyComponent'

// ❌ 不推荐：默认导入
import MyComponent from '@/app/components/MyComponent'
```

### 服务层架构

服务层负责业务逻辑和外部 API 调用。

#### 创建服务

```typescript
// src/app/services/my-service.ts

export interface MyServiceOptions {
  apiKey: string
  timeout?: number
}

export class MyService {
  private apiKey: string
  private timeout: number

  constructor(options: MyServiceOptions) {
    this.apiKey = options.apiKey
    this.timeout = options.timeout || 5000
  }

  async fetchData(): Promise<any> {
    const response = await fetch('https://api.example.com/data', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }
}
```

#### 使用服务

```typescript
import { MyService } from '@/app/services/my-service'

function MyComponent() {
  const service = new MyService({ apiKey: 'your-api-key' })
  
  const loadData = async () => {
    try {
      const data = await service.fetchData()
      console.log(data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }
  
  return <button onClick={loadData}>Load Data</button>
}
```

### 协作功能（Yjs CRDT）

YYC³ AI 使用 Yjs 实现 CRDT（无冲突复制数据类型）协作功能。

#### 初始化 Yjs 文档

```typescript
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

const doc = new Y.Doc()
const wsProvider = new WebsocketProvider(
  'ws://localhost:1234',
  'my-document-id',
  doc
)
const idbProvider = new IndexeddbPersistence('my-document-id', doc)
```

#### 使用 Yjs 文本

```typescript
const ytext = doc.getText('content')

// 设置内容
ytext.insert(0, 'Hello, World!')

// 监听变化
ytext.observe((event) => {
  console.log('Content changed:', ytext.toString())
})

// 获取内容
const content = ytext.toString()
```

#### 使用 Yjs 数组

```typescript
const yarray = doc.getArray('items')

// 添加元素
yarray.push(['item1', 'item2', 'item3'])

// 监听变化
yarray.observe((event) => {
  console.log('Array changed:', yarray.toArray())
})

// 获取元素
const items = yarray.toArray()
```

---

## 💻 常用命令

### 开发相关

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

### 测试相关

```bash
# 运行所有测试
pnpm test

# 运行测试并监听文件变化
pnpm test:watch

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行 E2E 测试
pnpm test:e2e

# 运行特定测试文件
pnpm test tests/unit/components/MyComponent.test.tsx
```

### 代码质量相关

```bash
# 运行 ESLint
pnpm lint

# 自动修复 ESLint 错误
pnpm lint:fix

# 运行 Prettier
pnpm format

# 检查 Prettier
pnpm format:check
```

### 依赖管理

```bash
# 安装新依赖
pnpm add package-name

# 安装开发依赖
pnpm add -D package-name

# 更新依赖
pnpm update

# 移除依赖
pnpm remove package-name
```

### Git 相关

```bash
# 查看状态
git status

# 查看分支
git branch

# 创建新分支
git checkout -b feature/my-feature

# 切换分支
git checkout main

# 查看提交历史
git log

# 查看差异
git diff

# 提交更改
git add .
git commit -m "feat: add my feature"

# 推送到远程
git push origin feature/my-feature
```

---

## 🧪 测试指南

### 单元测试

使用 Vitest 编写单元测试。

```typescript
// tests/unit/components/MyComponent.test.tsx

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/app/components/MyComponent'

describe('MyComponent', () => {
  it('应该正确渲染', () => {
    render(<MyComponent title="Test Title" />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('应该处理点击事件', async () => {
    const handleClick = vi.fn()
    render(<MyComponent title="Test Title" onSubmit={handleClick} />)
    
    const button = screen.getByRole('button')
    button.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### 集成测试

使用 Vitest 编写集成测试。

```typescript
// tests/integration/my-integration.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { MyService } from '@/app/services/my-service'

describe('MyService Integration', () => {
  let service: MyService

  beforeEach(() => {
    service = new MyService({ apiKey: 'test-key' })
  })

  it('应该成功获取数据', async () => {
    const data = await service.fetchData()
    
    expect(data).toBeDefined()
    expect(data).toHaveProperty('items')
  })
})
```

### E2E 测试

使用 Playwright 编写 E2E 测试。

```typescript
// tests/e2e/home-page.spec.ts

import { test, expect } from '@playwright/test'

test('首页应该正确加载', async ({ page }) => {
  await page.goto('http://localhost:5173')
  
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
})

test('应该能够创建新项目', async ({ page }) => {
  await page.goto('http://localhost:5173')
  
  await page.getByRole('button', { name: 'New Project' }).click()
  await page.getByRole('textbox', { name: 'Project Name' }).fill('My Project')
  await page.getByRole('button', { name: 'Create' }).click()
  
  await expect(page.getByText('My Project')).toBeVisible()
})
```

---

## 🐛 调试技巧

### Chrome DevTools

1. **打开 DevTools**：`F12` 或 `Cmd+Option+I`
2. **查看组件状态**：React DevTools
3. **查看网络请求**：Network 面板
4. **查看控制台日志**：Console 面板
5. **性能分析**：Performance 面板

### VS Code 调试

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

### 日志系统

YYC³ AI 提供了日志系统：

```typescript
import { createLogger } from '@/app/utils/logger'

const log = createLogger('MyComponent')

// Debug 级别
log.debug('This is a debug message')

// Info 级别
log.info('This is an info message')

// Warn 级别
log.warn('This is a warning message')

// Error 级别
log.error('This is an error message')
```

### 性能监控

使用 React DevTools Profiler：

1. 打开 React DevTools
2. 切换到 Profiler 标签
3. 点击 Record 开始录制
4. 执行操作
5. 点击 Stop 停止录制
6. 分析性能数据

---

## ❓ 常见问题

### Q1: 启动开发服务器失败

**问题**：运行 `pnpm dev` 时报错

**解决方案**：
```bash
# 清除缓存和 node_modules
rm -rf node_modules dist .vite
pnpm install
pnpm dev
```

### Q2: 测试失败

**问题**：运行 `pnpm test` 时测试失败

**解决方案**：
```bash
# 查看详细错误信息
pnpm test --reporter=verbose

# 清除缓存
pnpm test --clearCache
```

### Q3: 构建失败

**问题**：运行 `pnpm build` 时报错

**解决方案**：
```bash
# 检查 TypeScript 错误
npx tsc --noEmit

# 检查依赖
pnpm install

# 清除缓存
rm -rf dist .vite
pnpm build
```

### Q4: 协作功能不工作

**问题**：Yjs 协作功能不工作

**解决方案**：
```bash
# 检查 WebSocket 服务器
pnpm ws-server

# 检查环境变量
cat .env

# 检查网络连接
ping localhost
```

### Q5: AI 服务不响应

**问题**：AI 服务调用失败

**解决方案**：
```bash
# 检查 API 密钥
cat .env | grep API_KEY

# 检查网络连接
ping api.openai.com

# 查看错误日志
console.log(error)
```

---

## 🔗 资源链接

### 官方文档

- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Zustand 官方文档](https://zustand-demo.pmnd.rs/)
- [Yjs 官方文档](https://docs.yjs.dev/)
- [Vitest 官方文档](https://vitest.dev/)
- [Playwright 官方文档](https://playwright.dev/)

### 项目文档

- [项目 README](../../README.md)
- [全局审核报告](./全局审核报告-2026-03-26.md)
- [API 参考文档](./API参考文档.md)
- [组件使用指南](./组件使用指南.md)
- [开发最佳实践](./开发最佳实践.md)
- [故障排查手册](./故障排查手册.md)

### 社区资源

- [GitHub 仓库](https://github.com/your-org/YYC3-Code-AI)
- [Issue Tracker](https://github.com/your-org/YYC3-Code-AI/issues)
- [Discussions](https://github.com/your-org/YYC3-Code-AI/discussions)
- [贡献指南](../../CONTRIBUTING.md)

---

## 📝 下一步

恭喜你完成了快速上手指南！现在你可以：

1. 🚀 开始开发新功能
2. 🧪 编写测试
3. 📚 深入学习项目架构
4. 🤝 参与社区贡献

祝你开发愉快！🎉

---

**文档维护者**：CodeBuddy AI Assistant
**最后更新**：2026-04-10
**反馈渠道**：GitHub Issues

---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v3.0.0 |
| 创建日期 | 2026-03-26 |
| 更新日期 | 2026-04-10 |
| 内容校验 | SHA256:自动生成 |
| 追溯ID | DOC-QUICK-START-001 |
| 关联文档 | [开发最佳实践](./YYC3-用户指导-开发最佳实践.md) \| [API参考文档](./YYC3-用户指导-API参考文档.md) |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
