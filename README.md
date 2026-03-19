---
@file: README.md
@description: YYC³ AI Code 项目总览文档，包含项目介绍、快速开始、技术栈、开发指南等内容
@author: YanYuCloudCube Team <admin@0379.email>
@version: v0.0.1
@created: 2026-03-19
@updated: 2026-03-19
@status: dev
@tags: project,overview,getting-started,development,zh-CN
@category: general
@language: zh-CN
@audience: developers,users
@complexity: basic
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YANYUCLOUD (YYC³) - 智能多面板可视化 AI 编程应用

> **版本**: v0.0.1  
> **状态**: 开发中 (Dev)  
> **最后更新**: 2026-03-19  
> **团队**: YanYuCloudCube Team  
> **邮箱**: admin@0379.email

---

## 📋 项目简介

YANYUCLOUD (YYC³) 是一个智能多面板可视化 AI 编程应用，采用现代化 IDE 风格设计，提供：

- **多面板可调整工作区** - 基于 react-resizable-panels 的灵活布局
- **Monaco 代码编辑器** - 智能代码补全和语法高亮
- **AI 驱动的聊天与代码生成** - 流式 SSE 响应，多提供商支持
- **可视化设计器** - 拖拽式面板画布 (react-dnd)
- **任务看板** - 支持 Gantt 图表、DAG 可视化、CRDT 协同
- **设置系统** - 快捷键编辑器、规则/技能注入
- **深色主题 IDE 美学** - Tailwind CSS v4

---

## 🚀 快速开始

### 前置要求

- Node.js >= 20.x
- pnpm >= 9.x (推荐) 或 npm >= 10.x
- Git

### 安装依赖

```bash
# 克隆项目
git clone <repo-url> yyc3-ai-code
cd yyc3-ai-code

# 安装依赖
pnpm install
```

### 环境配置

创建 `.env` 文件（参考 `.env.example`）：

```bash
cp .env.example .env
```

### 启动开发服务器

```bash
# 启动开发服务器
pnpm dev

# 应用将在 http://localhost:3160 启动
```

### 构建生产版本

```bash
pnpm build
# 输出目录: dist/
```

---

## 📁 项目结构

```
yyc3-ai-code/
├── src/
│   ├── app/                    # 主应用代码
│   │   ├── App.tsx            # 应用入口
│   │   ├── routes.tsx          # 路由配置
│   │   ├── store.tsx           # 全局状态管理
│   │   ├── config.ts           # 配置中心
│   │   ├── apiClient.ts        # API 客户端
│   │   ├── components/         # 组件库
│   │   │   ├── ai-code/        # AI 代码工作台
│   │   │   ├── designer/       # 可视化设计器
│   │   │   ├── settings/       # 设置页面
│   │   │   ├── home/           # 首页
│   │   │   └── ui/             # 共享 UI 组件
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── services/           # 服务层
│   │   ├── types/              # 类型定义
│   │   └── testing/            # 测试文件
│   ├── styles/                 # 样式文件
│   └── tests/                   # 测试套件
├── public/                     # 静态资源
├── docs/                       # 文档
├── guidelines/                 # 指南和规范
├── package.json
├── vite.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── README.md
```

---

## 🛠️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | React + TypeScript | 18.3.1 |
| 路由 | react-router (Data Mode) | 7.13.0 |
| 样式 | Tailwind CSS v4 | 4.1.12 |
| 代码编辑器 | @monaco-editor/react | 4.7.0 |
| 面板 | react-resizable-panels | 2.1.7 |
| 拖拽 | react-dnd + HTML5/Touch | 16.0.1 |
| 动画 | motion (Motion/React) | 12.23.24 |
| CRDT 协同 | yjs + y-websocket | 13.6.29 |
| 图标 | lucide-react | 0.487.0 |
| UI 原语 | Radix UI | various |
| Toast | sonner | 2.0.3 |
| 状态管理 | React Context + useReducer | - |
| 构建 | Vite | 6.3.5 |

---

## 📱 应用路由

| 路径 | 组件 | 描述 |
|------|------|------|
| `/` | AIHomePage | 首页/着陆页 |
| `/designer` | DesignerLayout | 可视化多面板设计器 |
| `/ai-code` | AICodeSystem | AI 代码工作台 (IDE) |
| `/settings` | SettingsPage | 设置管理页面 |

---

## 🎯 核心功能

### 1. AI 代码工作台 (`/ai-code`)
- Monaco 编辑器集成
- 文件树管理（CRUD 操作）
- 集成终端（多标签、命令历史）
- AI 聊天面板（流式响应）
- 实时代码预览（iframe 沙箱）
- 快速操作工具栏
- 任务看板（Kanban + Gantt）
- 多实例管理

### 2. 可视化设计器 (`/designer`)
- 多面板拖拽画布
- 组件库侧边栏
- 属性检查器
- AI 助手面板
- 代码生成与预览
- CRDT 协同编辑
- 部署管理
- 数据库架构探索
- 三种主题：Classic、Aurora、Liquid Glass

### 3. 设置页面 (`/settings`)
- 账号信息
- 通用设置
- 智能体配置
- MCP 连接
- 模型配置
- 上下文管理
- 对话流设置
- 规则与技能注入

---

## 🔧 开发指南

### 代码规范

所有源代码文件必须包含文件头注释：

```typescript
/**
 * @file filename.tsx
 * @description 文件描述
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags tag1,tag2,tag3
 */
```

### 状态管理

- 全局状态：`src/app/store.tsx` (Context + useReducer)
- 设置状态：`src/app/components/settings/useSettingsStore.ts` (useSyncExternalStore)
- 多实例状态：`src/app/services/multi-instance/useMultiInstanceStore.ts`

### API 调用

使用 `src/app/apiClient.ts` 提供的 API 客户端：

```typescript
import { api } from './apiClient';

// GET 请求
const response = await api.get('/api/designs');

// POST 请求
const response = await api.post('/api/designs', data);
```

### CRDT 协同

使用 `yjs` + `y-websocket` 实现实时协同：

```typescript
import { useCRDTCollab } from './hooks/useCRDTCollab';

const { doc, awareness, connected } = useCRDTCollab('room-id');
```

---

## 🧪 测试

```bash
# 运行测试
pnpm test

# 测试覆盖率
pnpm test:coverage

# 测试 UI
pnpm test:ui
```

测试文件位置：
- `src/app/testing/settings.test.ts`
- `src/app/testing/fileTreeUtils.test.ts`
- `src/app/testing/taskStore.test.ts`
- `src/app/testing/ganttChart.test.ts`
- `src/app/testing/multiInstance.test.ts`

---

## 📊 性能优化

- React.lazy() 路由级代码分割
- Suspense 边界 + 加载骨架
- TaskBoard 和 AICodeSystem 中的昂贵计算记忆化
- 请求去重（GET 请求）
- 健康检查缓存
- 熔断器模式

---

## 🔐 安全

- JWT 令牌自动注入
- 请求/响应拦截器
- RBAC 权限控制
- 输入验证和清理
- CORS 配置

---

## 🌐 环境变量

参考 `.env.example` 文件配置以下环境变量：

- API 后端（一主二备）
- WebSocket (CRDT 协同)
- AI 代理
- 认证 (OpenID Connect)
- PostgreSQL 数据库
- Redis 缓存
- 存储配置

---

## 📚 文档

- [本地开发交接指南](docs/YYC3-Local-Dev-Handoff-README.md)
- [设置页面文档](docs/YYC3-P1-Settings.md)
- [多实例功能文档](docs/YYC3-P2-Advanced-Feature-Multi-Instance.md)
- [设计指南](guidelines/YYC3-Design-Prompt-Index.md)
- [UI/UX 规范](guidelines/Aurora__UI-UX.md)

---

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

## 👥 团队

**YanYuCloudCube Team**  
Email: admin@0379.email

---

## 🙏 致谢

本项目使用了以下开源项目：

- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库 (MIT License)
- [Unsplash](https://unsplash.com) - 图片资源
- [Radix UI](https://www.radix-ui.com/) - 无障碍 UI 原语
- [Lucide Icons](https://lucide.dev/) - 图标库

---

## 📞 联系方式

- **问题反馈**: [GitHub Issues](https://github.com/your-repo/issues)
- **邮件**: admin@0379.email
- **文档**: [项目文档](./docs/)

---

**© 2026 YanYuCloudCube Team. All rights reserved.**
