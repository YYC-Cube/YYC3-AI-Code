---
@file: YYC3-Design-Prompt-Index.md
@description: YYC3 Design Prompt 索引，包含完整的提示词目录结构和分类
@author: YanYuCloudCube Team <admin@0379.email>
@version: v1.0.0
@created: 2026-03-19
@updated: 2026-03-19
@status: stable
@tags: prompt,index,design,reference,zh-CN
@category: guide
@language: zh-CN
@audience: developers,ai-engineers
@complexity: intermediate
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC3 Design Prompt 索引

> 从 GitHub 仓库 [YYC-Cube/YanYuCloud](https://github.com/YYC-Cube/YanYuCloud) 拉取
> 路径: `YYC3-Design-Prompt/`
> 拉取时间: 2026-03-15

---

## 目录结构

### /变量词库 (4 files)
- [YYC3-变量-品牌标识.md](./变量词库/YYC3-变量-品牌标识.md) — 品牌名称/视觉标识/联系方式/法律信息/设计规范变量
- [YYC3-变量-技术栈版本.md](./变量词库/YYC3-变量-技术栈版本.md) — React/TypeScript/Vite/Tauri/Zustand/Monaco/Tailwind 等版本变量
- [YYC3-变量-配置参数.md](./变量词库/YYC3-变量-配置参数.md) — 应用/服务器/API/WebSocket/数据库/编辑器/AI/协作/性能/安全/UI/日志配置
- [YYC3-变量-项目信息.md](./变量词库/YYC3-变量-项目信息.md) — 项目基本信息/团队/品牌/许可证/路径变量

### /P0-核心架构 (6 files) → [README](./P0-核心架构/README.md)
- P0-架构-项目初始化 — Monorepo 初始化
- P0-架构-目录结构 — 完整目录规范
- P0-架构-类型定义 — TypeScript 核心类型
- P0-架构-构建配置 — Vite/TS/ESLint/Prettier
- P0-架构-宿主机桥接 — Tauri HostBridge + Rust 后端
- P0-架构-本地存储 — Dexie.js + IndexedDB + 加密 + 同步

### /P1-核心功能 (9 files) → [README](./P1-核心功能/README.md)
- P1-前端-多面板布局 — LayoutProvider + 10 种面板类型
- P1-前端-代码编辑器 — Monaco Editor 集成
- P1-前端-实时预览 — iframe sandbox 实时预览
- P1-前端-本地存储同步 — IndexedDB + 宿主机双写
- P1-布局-拖拽交互 — react-dnd 拖拽/Snap
- P1-状态-全局状态管理 — Zustand + Immer
- P1-状态-服务端状态 — React Query
- P1-AI-多提供商集成 — AIProviderManager 统一接口
- P1-AI-智能代码生成 — AI 辅助代码生成

### /P2-高级功能 (8 files) → [README](./P2-高级功能/README.md)
- P2-协作-实时协作 — Yjs CRDT + WebSocket
- P2-插件-插件系统 — 插件注册/热加载/沙箱
- P2-插件-插件开发 — 插件 SDK/开发指南
- P2-数据库-连接管理 — PostgreSQL/MySQL/Redis
- P2-数据库-查询优化 — 索引/执行计划/缓存
- P2-预览-多设备预览 — mobile/tablet/desktop 视口
- P2-预览-预览历史 — 快照/版本对比/回滚
- P2-高级-文档编辑器 — TipTap 富文本/Markdown

### /P3-优化完善 (9 files) → [README](./P3-优化完善/README.md)
- P3-优化-性能优化 — 全方位性能优化
- P3-性能-代码分割 — React.lazy/Suspense
- P3-性能-性能优化 — 虚拟滚动/Web Worker
- P3-国际化-多语言支持 — i18n/RTL/格式化
- P3-安全-安全加固 — XSS/CSRF/CSP/依赖安全
- P3-安全-数据加密 — AES-GCM/PBKDF2
- P3-测试-单元测试 — Vitest + Testing Library
- P3-测试-集成测试 — Playwright E2E
- P3-部署-CICD流程 — GitHub Actions/Docker

### /P5-审核交付 (1 file) → [README](./P5-审核交付/README.md)
- YYC3-全量收尾交互提示词 — 12 类全量收尾验收提示词系统

---

## 统计

| 目录 | 文件数 | 总大小 |
|------|--------|--------|
| 变量词库 | 4 | ~44KB |
| P0-核心架构 | 6 | ~136KB |
| P1-核心功能 | 9 | ~197KB |
| P2-高级功能 | 8 | ~177KB |
| P3-优化完善 | 9 | ~240KB |
| P5-审核交付 | 1 | ~43KB |
| **总计** | **37** | **~837KB** |
