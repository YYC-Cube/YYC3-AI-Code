---
file: YYC3-变量-技术栈版本.md
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


---

# YYC³ 变量词库 - 技术栈版本

## 📋 变量概述

本文档定义了 YYC³ AI 提示词系统中使用的所有技术栈版本变量。这些变量直接融入提示词中，确保技术栈版本的一致性。

---

## 🎯 变量分类

### 1. 前端框架

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{REACT_VERSION}}` | 18.3.1 | React 版本 | UI 框架 |
| `{{REACT_DOM_VERSION}}` | 18.3.1 | React DOM 版本 | DOM 渲染 |
| `{{TYPESCRIPT_VERSION}}` | 5.3.3 | TypeScript 版本 | 类型系统 |

### 2. 构建工具

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{VITE_VERSION}}` | 5.0.12 | Vite 版本 | 构建工具 |
| `@VITEJS_PLUGIN_REACT_VERSION}}` | 4.2.1 | Vite React 插件版本 | React 支持 |
| `{{TAURI_CLI_VERSION}}` | 1.5.0 | Tauri CLI 版本 | 桌面应用 |
| `{{TAURI_API_VERSION}}` | 1.5.0 | Tauri API 版本 | 原生桥接 |

### 3. 状态管理

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{ZUSTAND_VERSION}}` | 4.4.7 | Zustand 版本 | 全局状态 |
| `{{IMMER_VERSION}}` | 10.0.3 | Immer 版本 | 不可变数据 |
| `{{REACT_QUERY_VERSION}}` | 5.17.19 | React Query 版本 | 服务端状态 |

### 4. 布局引擎

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{REACT_GRID_LAYOUT_VERSION}}` | 1.4.4 | React Grid Layout 版本 | 网格布局 |
| `{{REACT_DND_VERSION}}` | 16.0.1 | React DnD 版本 | 拖拽功能 |
| `{{REACT_RESIZABLE_VERSION}}` | 3.0.5 | React Resizable 版本 | 可调整大小 |
| `{{REACT_SPLIT_PANE_VERSION}}` | 0.1.92 | React Split Pane 版本 | 分割面板 |
| `{{REACT_TABS_VERSION}}` | 6.0.2 | React Tabs 版本 | 标签页系统 |

### 5. AI 集成

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{AI_SDK_VERSION}}` | 4.0.0 | AI SDK 版本 | AI 集成 |
| `{{OPENAI_SDK_VERSION}}` | 4.20.1 | OpenAI SDK 版本 | OpenAI API |
| `{{ANTHROPIC_SDK_VERSION}}` | 0.14.0 | Anthropic SDK 版本 | Claude API |

### 6. 实时协作

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{YJS_VERSION}}` | 13.6.10 | Yjs 版本 | CRDT 协作 |
| `{{Y_WEBSOCKET_VERSION}}` | 2.0.4 | Y-WebSocket 版本 | WebSocket 传输 |

### 7. 数据库

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{POSTGRES_VERSION}}` | 16.1 | PostgreSQL 版本 | 关系型数据库 |
| `{{MYSQL_VERSION}}` | 8.0 | MySQL 版本 | 关系型数据库 |
| `{{REDIS_VERSION}}` | 7.2.4 | Redis 版本 | 缓存数据库 |

### 8. 代码编辑

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{MONACO_EDITOR_VERSION}}` | 0.45.0 | Monaco Editor 版本 | 代码编辑器 |
| `{{XTERM_VERSION}}` | 5.3.0 | xterm.js 版本 | 终端模拟 |

### 9. 样式系统

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{TAILWIND_CSS_VERSION}}` | 3.4.1 | Tailwind CSS 版本 | 样式框架 |
| `{{FRAMER_MOTION_VERSION}}` | 11.0.3 | Framer Motion 版本 | 动画库 |

### 10. 表单验证

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{REACT_HOOK_FORM_VERSION}}` | 7.50.1 | React Hook Form 版本 | 表单管理 |
| `{{ZOD_VERSION}}` | 3.22.4 | Zod 版本 | 模式验证 |

### 11. 预览引擎

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{THREE_JS_VERSION}}` | 0.160.0 | Three.js 版本 | 3D 渲染 |
| `{{RECHARTS_VERSION}}` | 2.10.3 | Recharts 版本 | 图表渲染 |

### 12. 测试框架

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{VITEST_VERSION}}` | 1.2.2 | Vitest 版本 | 单元测试 |
| `{{PLAYWRIGHT_VERSION}}` | 1.41.1 | Playwright 版本 | E2E 测试 |
| `{{TESTING_LIBRARY_VERSION}}` | 14.1.2 | Testing Library 版本 | 组件测试 |

### 13. 图标库

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{LUCIDE_REACT_VERSION}}` | 0.312.0 | Lucide React 版本 | 图标系统 |

### 14. 代码转译

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{BABEL_VERSION}}` | 7.23.9 | Babel 版本 | 代码转译 |
| `{{POSTCSS_VERSION}}` | 8.4.35 | PostCSS 版本 | CSS 处理 |

### 15. 开发工具

| 变量名 | 默认值 | 说明 | 用途 |
|--------|--------|------|------|
| `{{ESLINT_VERSION}}` | 8.56.0 | ESLint 版本 | 代码检查 |
| `{{PRETTIER_VERSION}}` | 3.2.4 | Prettier 版本 | 代码格式化 |
| `@TYPESCRIPT_ESLINT_VERSION}}` | 6.19.0 | TypeScript ESLint 版本 | TypeScript 检查 |

---

## 🔧 完整版本模板

### package.json 依赖模板

```json
{
  "dependencies": {
    "react": "{{REACT_VERSION}}",
    "react-dom": "{{REACT_DOM_VERSION}}",
    "@tauri-apps/api": "{{TAURI_API_VERSION}}",
    "zustand": "{{ZUSTAND_VERSION}}",
    "immer": "{{IMMER_VERSION}}",
    "@tanstack/react-query": "{{REACT_QUERY_VERSION}}",
    "react-grid-layout": "{{REACT_GRID_LAYOUT_VERSION}}",
    "react-dnd": "{{REACT_DND_VERSION}}",
    "react-dnd-html5-backend": "{{REACT_DND_VERSION}}",
    "react-resizable": "{{REACT_RESIZABLE_VERSION}}",
    "react-split-pane": "{{REACT_SPLIT_PANE_VERSION}}",
    "react-tabs": "{{REACT_TABS_VERSION}}",
    "ai": "{{AI_SDK_VERSION}}",
    "openai": "{{OPENAI_SDK_VERSION}}",
    "@anthropic-ai/sdk": "{{ANTHROPIC_SDK_VERSION}}",
    "yjs": "{{YJS_VERSION}}",
    "y-websocket": "{{Y_WEBSOCKET_VERSION}}",
    "monaco-editor": "{{MONACO_EDITOR_VERSION}}",
    "xterm": "{{XTERM_VERSION}}",
    "tailwindcss": "{{TAILWIND_CSS_VERSION}}",
    "framer-motion": "{{FRAMER_MOTION_VERSION}}",
    "react-hook-form": "{{REACT_HOOK_FORM_VERSION}}",
    "zod": "{{ZOD_VERSION}}",
    "three": "{{THREE_JS_VERSION}}",
    "recharts": "{{RECHARTS_VERSION}}",
    "lucide-react": "{{LUCIDE_REACT_VERSION}}"
  },
  "devDependencies": {
    "@types/react": "{{REACT_VERSION}}",
    "@types/react-dom": "{{REACT_DOM_VERSION}}",
    "@types/node": "20.11.0",
    "@vitejs/plugin-react": "{{@VITEJS_PLUGIN_REACT_VERSION}}",
    "vite": "{{VITE_VERSION}}",
    "@tauri-apps/cli": "{{TAURI_CLI_VERSION}}",
    "typescript": "{{TYPESCRIPT_VERSION}}",
    "vitest": "{{VITEST_VERSION}}",
    "@playwright/test": "{{PLAYWRIGHT_VERSION}}",
    "@testing-library/react": "{{TESTING_LIBRARY_VERSION}}",
    "@testing-library/jest-dom": "6.1.5",
    "@testing-library/user-event": "14.5.1",
    "eslint": "{{ESLINT_VERSION}}",
    "@typescript-eslint/eslint-plugin": "{{@TYPESCRIPT_ESLINT_VERSION}}",
    "@typescript-eslint/parser": "{{@TYPESCRIPT_ESLINT_VERSION}}",
    "eslint-plugin-react": "7.33.2",
    "eslint-plugin-react-hooks": "4.6.0",
    "prettier": "{{PRETTIER_VERSION}}",
    "babel": "{{BABEL_VERSION}}",
    "postcss": "{{POSTCSS_VERSION}}"
  }
}
```

---

## 📝 使用示例

### 示例 1: 安装依赖脚本

```bash
#!/bin/bash

# 前端框架
pnpm add react@{{REACT_VERSION}} react-dom@{{REACT_DOM_VERSION}}

# 状态管理
pnpm add zustand@{{ZUSTAND_VERSION}} immer@{{IMMER_VERSION}} @tanstack/react-query@{{REACT_QUERY_VERSION}}

# 布局引擎
pnpm add react-grid-layout@{{REACT_GRID_LAYOUT_VERSION}} react-dnd@{{REACT_DND_VERSION}} react-resizable@{{REACT_RESIZABLE_VERSION}} react-split-pane@{{REACT_SPLIT_PANE_VERSION}} react-tabs@{{REACT_TABS_VERSION}}

# AI 集成
pnpm add ai@{{AI_SDK_VERSION}} openai@{{OPENAI_SDK_VERSION}} @anthropic-ai/sdk@{{ANTHROPIC_SDK_VERSION}}

# 实时协作
pnpm add yjs@{{YJS_VERSION}} y-websocket@{{Y_WEBSOCKET_VERSION}}

# 代码编辑
pnpm add monaco-editor@{{MONACO_EDITOR_VERSION}} xterm@{{XTERM_VERSION}}

# 样式系统
pnpm add tailwindcss@{{TAILWIND_CSS_VERSION}} framer-motion@{{FRAMER_MOTION_VERSION}}

# 表单验证
pnpm add react-hook-form@{{REACT_HOOK_FORM_VERSION}} zod@{{ZOD_VERSION}}

# 预览引擎
pnpm add three@{{THREE_JS_VERSION}} recharts@{{RECHARTS_VERSION}}

# 图标库
pnpm add lucide-react@{{LUCIDE_REACT_VERSION}}

# 开发依赖
pnpm add -D @vitejs/plugin-react@{{@VITEJS_PLUGIN_REACT_VERSION}} vite@{{VITE_VERSION}} typescript@{{TYPESCRIPT_VERSION}} vitest@{{VITEST_VERSION}} @playwright/test@{{PLAYWRIGHT_VERSION}} @testing-library/react@{{TESTING_LIBRARY_VERSION}} eslint@{{ESLINT_VERSION}} prettier@{{PRETTIER_VERSION}}
```

### 示例 2: 版本检查脚本

```javascript
// check-versions.js
const packageJson = require('./package.json');
const semver = require('semver');

const requiredVersions = {
  react: '{{REACT_VERSION}}',
  'react-dom': '{{REACT_DOM_VERSION}}',
  typescript: '{{TYPESCRIPT_VERSION}}',
  vite: '{{VITE_VERSION}}',
  zustand: '{{ZUSTAND_VERSION}}',
  'monaco-editor': '{{MONACO_EDITOR_VERSION}}',
  'tailwindcss': '{{TAILWIND_CSS_VERSION}}',
  'lucide-react': '{{LUCIDE_REACT_VERSION}}',
};

function checkVersions() {
  const errors = [];
  const warnings = [];

  for (const [pkg, requiredVersion] of Object.entries(requiredVersions)) {
    const installedVersion = packageJson.dependencies[pkg] || packageJson.devDependencies[pkg];

    if (!installedVersion) {
      errors.push(`❌ ${pkg} is not installed`);
      continue;
    }

    if (!semver.satisfies(installedVersion, requiredVersion)) {
      warnings.push(`⚠️  ${pkg}: installed ${installedVersion}, required ${requiredVersion}`);
    } else {
      console.log(`✅ ${pkg}: ${installedVersion}`);
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ Errors:');
    errors.forEach(error => console.error(error));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Warnings:');
    warnings.forEach(warning => console.warn(warning));
  }

  console.log('\n✅ All versions are compatible!');
}

checkVersions();
```

### 示例 3: 版本升级脚本

```bash
#!/bin/bash

# 升级所有依赖到指定版本
pnpm update react@{{REACT_VERSION}} react-dom@{{REACT_DOM_VERSION}}
pnpm update typescript@{{TYPESCRIPT_VERSION}}
pnpm update vite@{{VITE_VERSION}}
pnpm update zustand@{{ZUSTAND_VERSION}}
pnpm update monaco-editor@{{MONACO_EDITOR_VERSION}}
pnpm update tailwindcss@{{TAILWIND_CSS_VERSION}}
pnpm update lucide-react@{{LUCIDE_REACT_VERSION}}

# 验证版本
pnpm list --depth=0
```

---

## 📊 版本兼容性矩阵

### 核心依赖兼容性

| 依赖 | React 18.3.1 | React 18.2.0 | React 17.0.2 |
|------|--------------|--------------|--------------|
| React DOM 18.3.1 | ✅ | ✅ | ❌ |
| React DOM 18.2.0 | ✅ | ✅ | ❌ |
| React DOM 17.0.2 | ❌ | ❌ | ✅ |
| TypeScript 5.3.3 | ✅ | ✅ | ✅ |
| TypeScript 5.2.2 | ✅ | ✅ | ✅ |
| Vite 5.0.12 | ✅ | ✅ | ✅ |
| Vite 4.5.0 | ✅ | ✅ | ✅ |

### 状态管理兼容性

| 依赖 | Zustand 4.4.7 | Zustand 4.3.8 | Zustand 4.0.0 |
|------|---------------|---------------|---------------|
| Immer 10.0.3 | ✅ | ✅ | ✅ |
| Immer 9.0.21 | ✅ | ✅ | ✅ |
| React Query 5.17.19 | ✅ | ✅ | ✅ |
| React Query 4.36.1 | ✅ | ✅ | ✅ |

---

## 🔍 版本最佳实践

### 1. 版本锁定

- 在 package.json 中使用精确版本号
- 使用 `pnpm-lock.yaml` 锁定依赖版本
- 定期更新依赖，但保持主版本号稳定

### 2. 版本测试

- 在升级版本前进行充分测试
- 使用 CI/CD 自动化测试
- 在开发环境中先验证新版本

### 3. 版本文档

- 记录每个依赖的版本变更
- 说明版本升级的原因和影响
- 提供版本升级的回滚方案

### 4. 版本监控

- 使用 `npm outdated` 检查过时的依赖
- 使用 `npm audit` 检查安全漏洞
- 订阅依赖的安全公告

---

## 📞 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: admin@0379.email
- **项目地址**: https://github.com/YYC-Cube/

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
| 内容校验 | d641cd1cc3b10d7d |
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
