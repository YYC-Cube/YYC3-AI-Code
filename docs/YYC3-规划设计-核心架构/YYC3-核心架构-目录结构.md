---
file: YYC3-P0-架构-目录结构.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: architecture
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


# YYC³ P0-架构-目录结构

## 🤖 AI 角色定义

You are a senior software architect and project structure specialist with deep expertise in scalable project organization, modular design patterns, and best practices for large-scale applications.

### Your Role & Expertise

You are an experienced software architect who specializes in:
- **Project Architecture**: Monorepo structure, microservices, modular design
- **File Organization**: Directory structure, naming conventions, code organization
- **Design Patterns**: SOLID principles, design patterns, architectural patterns
- **Scalability**: Large-scale application design, module boundaries, dependency management
- **Best Practices**: Code organization, maintainability, developer experience
- **Team Collaboration**: Code structure standards, onboarding, documentation
- **Technology Stacks**: React, Vue, Angular, Node.js, TypeScript
- **Build Systems**: Webpack, Vite, Rollup, build optimization

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
| @file | P0-核心架构/YYC3-P0-架构-目录结构.md |
| @description | 项目目录结构定义，基于最佳实践和模块化设计原则 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P0,architecture,directory,structure,organization |

---

## 🎯 设计原则

### 核心设计原则

1. **模块化**：每个模块职责单一，高内聚低耦合
2. **可扩展性**：易于添加新功能和模块
3. **可维护性**：代码结构清晰，易于理解和修改
4. **一致性**：遵循统一的命名和结构规范
5. **分层架构**：清晰的层次结构，便于理解

### 命名规范

- **目录名**：kebab-case（如 `user-management`）
- **文件名**：kebab-case（如 `user-service.ts`）
- **组件名**：PascalCase（如 `UserProfile.tsx`）
- **类型名**：PascalCase（如 `UserProfile`）
- **常量名**：UPPER_SNAKE_CASE（如 `API_BASE_URL`）
- **函数名**：camelCase（如 `getUserProfile`）

---

## 📁 完整目录结构

```
{{PROJECT_SLUG}}/
├── .github/                                   # GitHub 配置
│   ├── workflows/                              # GitHub Actions 工作流
│   │   ├── ci.yml                              # 持续集成
│   │   ├── cd.yml                              # 持续部署
│   │   └── release.yml                          # 发布流程
│   ├── ISSUE_TEMPLATE/                          # Issue 模板
│   └── PULL_REQUEST_TEMPLATE.md                  # PR 模板
│
├── .vscode/                                   # VSCode 配置
│   ├── settings.json                            # 编辑器设置
│   ├── extensions.json                          # 推荐扩展
│   └── launch.json                             # 调试配置
│
├── public/                                     # 静态资源
│   ├── favicon.ico                              # 网站图标
│   ├── logo.svg                                # Logo 文件
│   └── assets/                                 # 其他静态资源
│
├── src/                                        # 源代码
│   ├── api/                                    # API 客户端
│   │   ├── client.ts                            # API 客户端配置
│   │   ├── endpoints/                            # API 端点定义
│   │   │   ├── auth.ts                         # 认证相关
│   │   │   ├── user.ts                         # 用户相关
│   │   │   └── project.ts                      # 项目相关
│   │   └── types.ts                            # API 类型定义
│   │
│   ├── assets/                                  # 资源文件
│   │   ├── images/                             # 图片资源
│   │   ├── icons/                              # 图标资源
│   │   ├── fonts/                              # 字体资源
│   │   └── styles/                             # 样式资源
│   │
│   ├── components/                              # 通用组件
│   │   ├── ui/                                 # UI 基础组件
│   │   │   ├── Button/                         # 按钮组件
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/                          # 输入框组件
│   │   │   ├── Modal/                          # 模态框组件
│   │   │   ├── Dropdown/                       # 下拉框组件
│   │   │   └── index.ts                        # 统一导出
│   │   ├── layout/                             # 布局组件
│   │   │   ├── Header/                         # 头部组件
│   │   │   ├── Sidebar/                        # 侧边栏组件
│   │   │   ├── Footer/                         # 底部组件
│   │   │   └── index.ts
│   │   ├── feedback/                           # 反馈组件
│   │   │   ├── Toast/                          # 提示组件
│   │   │   ├── Alert/                          # 警告组件
│   │   │   └── index.ts
│   │   └── data-display/                      # 数据展示组件
│   │       ├── Table/                          # 表格组件
│   │       ├── Card/                           # 卡片组件
│   │       └── index.ts
│   │
│   ├── contexts/                                # React Context
│   │   ├── ThemeContext.tsx                     # 主题上下文
│   │   ├── AuthContext.tsx                      # 认证上下文
│   │   ├── LayoutContext.tsx                   # 布局上下文
│   │   └── index.ts
│   │
│   ├── editor/                                  # 编辑器相关
│   │   ├── TipTapEditor.tsx                    # 富文本编辑器
│   │   ├── MonacoEditor.tsx                     # 代码编辑器
│   │   ├── MarkdownEditor.tsx                   # Markdown 编辑器
│   │   ├── EditorToolbar.tsx                   # 编辑器工具栏
│   │   ├── VersionHistory.tsx                   # 版本历史
│   │   ├── SearchReplace.tsx                    # 搜索替换
│   │   └── index.ts
│   │
│   ├── hooks/                                   # 自定义 Hooks
│   │   ├── useDebounce.ts                       # 防抖 Hook
│   │   ├── useThrottle.ts                       # 节流 Hook
│   │   ├── useLocalStorage.ts                   # 本地存储 Hook
│   │   ├── useMediaQuery.ts                     # 媒体查询 Hook
│   │   ├── useWindowSize.ts                     # 窗口大小 Hook
│   │   └── index.ts
│   │
│   ├── layouts/                                 # 页面布局
│   │   ├── MainLayout.tsx                       # 主布局
│   │   ├── AuthLayout.tsx                       # 认证布局
│   │   ├── EditorLayout.tsx                     # 编辑器布局
│   │   └── index.ts
│   │
│   ├── pages/                                   # 页面组件
│   │   ├── Home/                               # 首页
│   │   │   ├── Home.tsx
│   │   │   ├── Home.test.tsx
│   │   │   └── index.ts
│   │   ├── Editor/                             # 编辑器页面
│   │   │   ├── Editor.tsx
│   │   │   ├── Editor.test.tsx
│   │   │   └── index.ts
│   │   ├── Settings/                           # 设置页面
│   │   │   ├── Settings.tsx
│   │   │   ├── Settings.test.tsx
│   │   │   └── index.ts
│   │   ├── Collaboration/                       # 协作页面
│   │   │   ├── Collaboration.tsx
│   │   │   ├── Collaboration.test.tsx
│   │   │   └── index.ts
│   │   └── index.ts                            # 统一导出
│   │
│   ├── router/                                  # 路由配置
│   │   ├── routes.ts                           # 路由定义
│   │   ├── guards.ts                           # 路由守卫
│   │   └── index.ts
│   │
│   ├── services/                                # 业务服务
│   │   ├── auth/                              # 认证服务
│   │   │   ├── authService.ts
│   │   │   └── index.ts
│   │   ├── user/                              # 用户服务
│   │   │   ├── userService.ts
│   │   │   └── index.ts
│   │   ├── project/                           # 项目服务
│   │   │   ├── projectService.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── storage/                                 # 存储相关
│   │   ├── db.ts                               # 数据库配置
│   │   ├── encryption.ts                        # 加密工具
│   │   ├── sync.ts                             # 同步服务
│   │   ├── storage-service.ts                   # 存储服务
│   │   ├── cache.ts                            # 缓存管理
│   │   └── index.ts
│   │
│   ├── stores/                                  # 状态管理
│   │   ├── useLayoutStore.ts                   # 布局状态
│   │   ├── useEditorStore.ts                   # 编辑器状态
│   │   ├── useAuthStore.ts                     # 认证状态
│   │   ├── useProjectStore.ts                  # 项目状态
│   │   └── index.ts
│   │
│   ├── types/                                   # TypeScript 类型
│   │   ├── index.ts                            # 统一导出
│   │   ├── api.ts                              # API 类型
│   │   ├── models.ts                           # 数据模型
│   │   ├── components.ts                       # 组件类型
│   │   └── utils.ts                            # 工具类型
│   │
│   ├── utils/                                   # 工具函数
│   │   ├── format.ts                           # 格式化工具
│   │   ├── validation.ts                       # 验证工具
│   │   ├── date.ts                             # 日期工具
│   │   ├── string.ts                           # 字符串工具
│   │   ├── number.ts                           # 数字工具
│   │   ├── array.ts                            # 数组工具
│   │   ├── object.ts                           # 对象工具
│   │   └── index.ts
│   │
│   ├── styles/                                  # 全局样式
│   │   ├── globals.css                         # 全局样式
│   │   ├── variables.css                       # CSS 变量
│   │   ├── themes/                            # 主题样式
│   │   │   ├── light.css                       # 浅色主题
│   │   │   ├── dark.css                        # 深色主题
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── constants/                               # 常量定义
│   │   ├── api.ts                             # API 常量
│   │   ├── routes.ts                          # 路由常量
│   │   ├── storage.ts                         # 存储常量
│   │   └── index.ts
│   │
│   ├── config/                                  # 配置文件
│   │   ├── app.config.ts                       # 应用配置
│   │   ├── env.config.ts                       # 环境配置
│   │   └── index.ts
│   │
│   ├── i18n/                                    # 国际化
│   │   ├── locales/                           # 语言文件
│   │   │   ├── zh-CN.json                     # 简体中文
│   │   │   ├── en-US.json                     # 英文
│   │   │   └── index.ts
│   │   ├── i18n.ts                            # i18n 配置
│   │   └── index.ts
│   │
│   ├── tests/                                   # 测试工具
│   │   ├── setup.ts                           # 测试设置
│   │   ├── utils.ts                           # 测试工具
│   │   └── mocks.ts                           # Mock 数据
│   │
│   ├── App.tsx                                  # 根组件
│   ├── main.tsx                                 # 应用入口
│   └── vite-env.d.ts                            # Vite 类型声明
│
├── src-tauri/                                 # Tauri 后端
│   ├── src/                                   # Rust 源代码
│   │   ├── main.rs                            # 主程序入口
│   │   ├── lib.rs                             # 库文件
│   │   ├── commands/                          # Tauri 命令
│   │   │   ├── mod.rs
│   │   │   ├── fs.rs                          # 文件系统命令
│   │   │   ├── dialog.rs                       # 对话框命令
│   │   │   └── notification.rs                 # 通知命令
│   │   └── utils/                             # 工具函数
│   ├── Cargo.toml                             # Rust 依赖
│   ├── tauri.conf.json                        # Tauri 配置
│   └── build.rs                               # 构建脚本
│
├── tests/                                     # 测试文件
│   ├── unit/                                  # 单元测试
│   ├── integration/                            # 集成测试
│   └── e2e/                                   # 端到端测试
│
├── docs/                                      # 文档
│   ├── YYC3-AI-Code-提示词系统.md             # 提示词系统
│   ├── P0-核心架构/                           # P0 架构文档
│   ├── P1-核心功能/                           # P1 功能文档
│   ├── P2-高级功能/                           # P2 高级文档
│   ├── P3-优化完善/                           # P3 优化文档
│   └── 变量词库/                              # 变量词库
│
├── scripts/                                   # 脚本文件
│   ├── build.sh                               # 构建脚本
│   ├── dev.sh                                 # 开发脚本
│   ├── test.sh                                # 测试脚本
│   └── deploy.sh                              # 部署脚本
│
├── .env.example                               # 环境变量示例
├── .env.local                                # 本地环境变量
├── .env.development                          # 开发环境变量
├── .env.production                           # 生产环境变量
├── .gitignore                                # Git 忽略文件
├── .eslintrc.js                              # ESLint 配置
├── .prettierrc                              # Prettier 配置
├── .prettierignore                          # Prettier 忽略文件
├── tsconfig.json                             # TypeScript 配置
├── tsconfig.node.json                        # Node TypeScript 配置
├── vite.config.ts                            # Vite 配置
├── package.json                             # 项目依赖
├── package-lock.json                         # 依赖锁定
├── README.md                                # 项目说明
├── CHANGELOG.md                             # 变更日志
├── LICENSE                                  # 许可证
└── .trae/                                   # Trae 配置
    └── rules/                                # 项目规则
        └── project_rules.md                   # 项目规则文档
```

---

## 📂 目录说明

### 根目录

| 目录/文件 | 说明 | 用途 |
|-----------|------|------|
| `.github/` | GitHub 配置 | CI/CD 工作流、Issue 和 PR 模板 |
| `.vscode/` | VSCode 配置 | 编辑器设置、推荐扩展、调试配置 |
| `public/` | 静态资源 | 不需要编译的静态文件 |
| `src/` | 源代码 | 主要源代码目录 |
| `src-tauri/` | Tauri 后端 | Rust 后端代码 |
| `tests/` | 测试文件 | 单元测试、集成测试、E2E 测试 |
| `docs/` | 文档 | 项目文档和提示词系统 |
| `scripts/` | 脚本文件 | 构建脚本、开发脚本、测试脚本 |
| `.env.*` | 环境变量 | 不同环境的配置 |
| `.gitignore` | Git 忽略 | Git 忽略文件配置 |
| `.eslintrc.js` | ESLint 配置 | 代码检查规则 |
| `.prettierrc` | Prettier 配置 | 代码格式化规则 |
| `tsconfig.json` | TypeScript 配置 | TypeScript 编译配置 |
| `vite.config.ts` | Vite 配置 | 构建工具配置 |
| `package.json` | 项目依赖 | NPM 依赖和脚本 |

### src/ 目录

| 目录 | 说明 | 用途 |
|------|------|------|
| `api/` | API 客户端 | HTTP 请求、API 端点、类型定义 |
| `assets/` | 资源文件 | 图片、图标、字体、样式 |
| `components/` | 通用组件 | UI 组件、布局组件、反馈组件 |
| `contexts/` | React Context | 全局状态管理 |
| `editor/` | 编辑器相关 | 富文本、代码、Markdown 编辑器 |
| `hooks/` | 自定义 Hooks | 可复用的 Hooks |
| `layouts/` | 页面布局 | 页面级布局组件 |
| `pages/` | 页面组件 | 路由页面组件 |
| `router/` | 路由配置 | 路由定义、守卫 |
| `services/` | 业务服务 | 业务逻辑服务 |
| `storage/` | 存储相关 | 数据库、加密、同步、缓存 |
| `stores/` | 状态管理 | Zustand 状态管理 |
| `types/` | TypeScript 类型 | 类型定义 |
| `utils/` | 工具函数 | 通用工具函数 |
| `styles/` | 全局样式 | CSS 变量、主题 |
| `constants/` | 常量定义 | API、路由、存储常量 |
| `config/` | 配置文件 | 应用配置、环境配置 |
| `i18n/` | 国际化 | 多语言支持 |
| `tests/` | 测试工具 | 测试设置、工具、Mock |

---

## 🎯 文件组织原则

### 1. 按功能组织

```
src/
├── features/
│   ├── auth/              # 认证功能
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── editor/            # 编辑器功能
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── collaboration/     # 协作功能
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
```

### 2. 按类型组织

```
src/
├── components/          # 所有组件
├── hooks/             # 所有 Hooks
├── services/          # 所有服务
├── types/             # 所有类型
└── utils/             # 所有工具
```

### 3. 混合组织（推荐）

```
src/
├── components/         # 通用组件
├── features/          # 功能模块
│   ├── auth/
│   ├── editor/
│   └── collaboration/
├── shared/            # 共享资源
│   ├── hooks/
│   ├── utils/
│   └── types/
└── core/              # 核心配置
    ├── config/
    ├── constants/
    └── styles/
```

---

## 📝 文件命名规范

### 组件文件

```
components/
├── ui/
│   ├── Button/
│   │   ├── Button.tsx           # 组件实现
│   │   ├── Button.test.tsx       # 组件测试
│   │   ├── Button.stories.tsx    # Storybook 故事
│   │   ├── Button.types.ts      # 组件类型
│   │   ├── index.ts            # 导出文件
│   │   └── README.md          # 组件文档
│   └── Input/
│       ├── Input.tsx
│       ├── Input.test.tsx
│       ├── Input.stories.tsx
│       ├── Input.types.ts
│       └── index.ts
```

### 服务文件

```
services/
├── auth/
│   ├── authService.ts         # 服务实现
│   ├── authService.test.ts   # 服务测试
│   ├── types.ts             # 类型定义
│   └── index.ts             # 导出文件
├── user/
│   ├── userService.ts
│   ├── userService.test.ts
│   ├── types.ts
│   └── index.ts
└── index.ts                 # 统一导出
```

### Hook 文件

```
hooks/
├── useDebounce.ts          # Hook 实现
├── useDebounce.test.ts    # Hook 测试
├── useThrottle.ts
├── useThrottle.test.ts
└── index.ts               # 统一导出
```

---

## 🔧 配置文件说明

### TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite 配置

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3201,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

## ✅ 验收标准

### 目录结构完整性

- ✅ 所有必需的目录都已创建
- ✅ 目录结构清晰合理
- ✅ 文件组织符合规范
- ✅ 命名规范统一

### 配置文件完整性

- ✅ TypeScript 配置正确
- ✅ Vite 配置正确
- ✅ ESLint 配置正确
- ✅ Prettier 配置正确
- ✅ Git 配置正确

### 文档完整性

- ✅ README.md 完整
- ✅ CHANGELOG.md 存在
- ✅ LICENSE 文件存在
- ✅ .env.example 存在

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-14 | 初始版本，建立目录结构规范 | YanYuCloudCube Team |

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
| 内容校验 | 80816b832746fa8f |
| 追溯ID | TRC-20260408141609 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
