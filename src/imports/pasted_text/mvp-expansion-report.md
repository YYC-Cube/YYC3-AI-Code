---
file: mvp-expansion-report.md
description: MVP 扩展报告，记录 MVP 功能扩展计划
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-19
updated: 2026-03-19
status: stable
tags: general,zh-CN
category: project
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC3 Family AI — MVP 功能拓展规划报告

> **文档版本**: v1.0.0
> **编制日期**: 2026-03-14
> **编制角色**: 产品经理 + 技术架构师
> **项目阶段**: MVP → v1.1 拓展期

---

## 一、现有 MVP 功能审计

### 1.1 已实现能力清单

| 维度 | 能力 | 实现状态 | 文件位置 | 成熟度 |
|------|------|---------|---------|--------|
| **页面路由** | 首页 / 设计器 / 架构 | ✅ 完成 | `routes.ts` | 高 |
| **AI 对话** | 流式响应、OpenAI/DashScope 兼容 | ✅ 完成 | `LeftPanel.tsx` | 中高 |
| **文件管理** | 文件树、上下文菜单、代码高亮 | ✅ 完成 | `CenterPanel.tsx` | 中高 |
| **终端模拟** | 命令行、自动补全、历史记录 | ✅ 完成 | `RightPanel.tsx` | 中 |
| **实时预览** | 设备模拟、缩放、Mock 渲染 | ✅ 完成 | `PreviewPanel.tsx` | 中 |
| **主题系统** | 深色/亮色/自定义、液态玻璃 | ✅ 完成 | `theme-store.ts` + CSS | 高 |
| **布局管理** | 6 预设、面板折叠/拖拽/导入导出 | ✅ 完成 | `layout-store.ts` | 高 |
| **AI 模型** | 多模型配置、心跳检测、测试连接 | ✅ 完成 | `ModelSettings.tsx` + `heartbeat-store.ts` | 高 |
| **协同框架** | 用户状态、光标同步、编辑事件 | ✅ 骨架 | `collab-store.ts` | 低 |
| **插件系统** | 清单注册、安装/启用、命令执行 | ✅ 骨架 | `plugin-store.ts` | 低 |
| **会话管理** | 多会话 CRUD、持久化接口 | ✅ 骨架 | `session-store.ts` | 低 |
| **设计引擎** | 组件树 CRUD、撤销/重做 | ✅ 骨架 | `design-store.ts` | 低 |
| **意图识别** | 关键词匹配、路由决策 | ✅ 完成 | `intent-service.ts` | 中 |
| **安全/监控** | Auth mock、安全服务、成本跟踪 | ✅ 骨架 | `services/*.ts` | 低 |
| **国际化** | i18n 服务框架 | ✅ 骨架 | `i18n-service.ts` | 低 |
| **全局搜索** | 文件内容搜索、快捷键唤起 | ✅ 完成 | `DesignerPage.tsx` | 中 |
| **快捷键** | 40+ 全局快捷键 | ✅ 完成 | 各组件分散 | 中 |

### 1.2 关键缺口识别

| 编号 | 缺口 | 影响等级 | 阻断性 |
|------|------|---------|--------|
| G-01 | `session-store` 未接入 `LeftPanel` 聊天 UI，对话不可持久化 | 🔴 高 | 阻断 |
| G-02 | PreviewPanel 仅为 Mock 静态渲染，无真实代码编译/热更新 | 🔴 高 | 阻断 |
| G-03 | 协同编辑 collab-store 仅有数据结构，无 WebSocket/CRDT 接入 | 🟡 中 | 非阻断 |
| G-04 | 插件系统仅 Mock 市场，无真实加载/沙箱执行 | 🟡 中 | 非阻断 |
| G-05 | `LayoutManager.tsx`/`PluginManager.tsx` 未集成 `useLiquidGlass` | 🟢 低 | 非阻断 |
| G-06 | 无项目 CRUD（新建/删除/重命名），首页项目卡片为静态 Mock | 🔴 高 | 阻断 |
| G-07 | AI 意图识别为纯关键词匹配，无语义理解 | 🟡 中 | 非阻断 |
| G-08 | 代码生成服务 `code-generation-service.ts` 未与 AI 对话集成 | 🔴 高 | 阻断 |
| G-09 | i18n 服务存在但 UI 无中英文切换入口 | 🟡 中 | 非阻断 |
| G-10 | 无 Git 版本控制集成（仅 UI 占位） | 🟡 中 | 非阻断 |

---

## 二、功能拓展规划

### 2.1 优先级矩阵

采用 **ICE 评分法**（Impact 影响 / Confidence 信心 / Ease 容易度，各 1-10 分）：

| 编号 | 功能模块 | Impact | Confidence | Ease | ICE 分 | 优先级 |
|------|---------|--------|-----------|------|--------|--------|
| F-01 | 会话持久化接入 | 9 | 9 | 8 | 648 | 🔴 P0 |
| F-02 | 项目 CRUD + 本地存储 | 9 | 9 | 7 | 567 | 🔴 P0 |
| F-03 | AI 代码生成 → 编辑器回写 | 10 | 8 | 6 | 480 | 🔴 P0 |
| F-04 | 中英文切换 (i18n UI) | 7 | 9 | 8 | 504 | 🟡 P1 |
| F-05 | 预览面板真实渲染 | 9 | 7 | 5 | 315 | 🟡 P1 |
| F-06 | Liquid Glass 全组件覆盖 | 6 | 10 | 8 | 480 | 🟡 P1 |
| F-07 | 命令面板 (Command Palette) | 8 | 9 | 7 | 504 | 🟡 P1 |
| F-08 | Git 集成（基础） | 7 | 7 | 5 | 245 | 🟢 P2 |
| F-09 | 协同编辑 MVP | 8 | 6 | 4 | 192 | 🟢 P2 |
| F-10 | 插件沙箱执行 | 7 | 6 | 4 | 168 | 🟢 P2 |
| F-11 | AI 语义意图增强 | 7 | 7 | 5 | 245 | 🟢 P2 |
| F-12 | 通知中心 | 5 | 9 | 8 | 360 | 🟡 P1 |
| F-13 | 部署发布流程 | 8 | 6 | 4 | 192 | 🟢 P2 |
| F-14 | 数据导出/备份 | 6 | 9 | 7 | 378 | 🟡 P1 |

### 2.2 分期实施路线图

```
Sprint 1 (v1.1-alpha) — "核心闭环"          Sprint 2 (v1.1-beta) — "体验增强"
┌────────────────────────────┐            ┌────────────────────────────┐
│ F-01 会话持久化接入         │            │ F-04 i18n 中英文切换 UI     │
│ F-02 项目 CRUD + 存储      │            │ F-06 Liquid Glass 全覆盖    │
│ F-03 AI 代码生成→编辑器回写 │            │ F-07 命令面板               │
│ F-06 LG 部分覆盖(2组件)    │            │ F-12 通知中心               │
│                            │            │ F-14 数据导出/备份          │
│ 工期: ~8 天                │            │ F-05 预览面板增强(基础)      │
└────────────────────────────┘            │                            │
                                          │ 工期: ~10 天               │
Sprint 3 (v1.1-rc) — "平台能力"           └────────────────────────────┘
┌────────────────────────────┐
│ F-08 Git 基础集成           │
│ F-09 协同编辑 MVP           │
│ F-10 插件沙箱               │
│ F-11 AI 语义增强            │
│ F-13 部署发布流程           │
│                            │
│ 工期: ~12 天               │
└────────────────────────────┘
```

---

## 三、功能规格文档

### F-01: 会话持久化接入

**目标**: 将 `session-store.ts` 的完整会话管理能力接入 `LeftPanel.tsx` 聊天 UI，实现对话历史持久化、多会话切换。

**当前状态**:
- `session-store.ts` 已实现完整 CRUD：`createSession`、`addMessage`、`appendToLastAssistant`、`saveToStorage`、`loadFromStorage`
- `LeftPanel.tsx` 的 `triggerAIResponse` 当前使用 `app-store` 的 `addMessage`/`messages`
- 两个 store 之间无桥接

**用户场景**:
1. 用户打开设计器，左侧聊天面板自动加载上次会话
2. 用户点击"新建会话"，当前对话保存，开始新会话
3. 用户从会话列表切换历史会话，查看/继续之前的对话
4. 页面刷新后对话历史不丢失

**技术实现路径**:

```
LeftPanel.tsx
├─ useSessionStore() 替代 useAppStore().messages
├─ 顶部新增会话选择器下拉
│  ├─ 当前会话标题（可编辑）
│  ├─ 会话列表（按更新时间排序）
│  └─ "新建会话" 按钮
├─ triggerAIResponse 改写
│  ├─ addMessage(activeSessionId, 'user', text)
│  ├─ startStreaming()
│  ├─ appendToLastAssistant(activeSessionId, chunk)
│  └─ stopStreaming() + saveToStorage()
└─ useEffect → loadFromStorage(userId) on mount
```

**改动文件**:
| 文件 | 改动类型 | 改动量 |
|------|---------|--------|
| `LeftPanel.tsx` | 重构 | 中（约 80 行改动） |
| `session-store.ts` | 微调 | 小（补充 `getOrCreateDefault` 方法） |
| `app-store.ts` | 清理 | 小（可选：移除重复 `messages` 字段） |

**验收标准**:
- [ ] 会话列表正确展示，可新建/切换/删除
- [ ] AI 流式响应正确写入 session-store
- [ ] 刷新页面后对话历史从 localStorage 恢复
- [ ] 性能：切换会话 < 100ms

---

### F-02: 项目 CRUD + 本地存储

**目标**: 首页项目卡片支持真实的创建、编辑、删除、归档操作，数据持久化到 localStorage。

**当前状态**:
- `app-store.ts` 的 `projects` 为硬编码 Mock 数组
- `HomePage.tsx` 的 `ProjectContextMenu` 已有 UI 但 action 为 toast 占位
- `persistence-service.ts` 已提供 `set`/`get`/`remove` 的 localStorage 封装

**用户场景**:
1. 用户点击"新建项目"→ 弹出创建对话框（名称、描述、技术栈选择）
2. 右键项目卡片 → 重命名/归档/删除
3. 项目列表按最近更新时间排序
4. 进入设计器后项目上下文自动关联

**技术实现路径**:

```
app-store.ts
├─ projects → 从 persistence-service 加载
├─ createProject(name, desc, techStack) → 生成 UUID + 持久化
├─ updateProject(id, updates) → 合并 + 持久化
├─ deleteProject(id) → 删除 + 持久化
├─ archiveProject(id) → status='archived' + 持久化
└─ setActiveProject(id) → 记录当前工作项目

HomePage.tsx
├─ "新建项目"按钮 → 弹出 CreateProjectDialog
│  ├─ 名称输入（必填）
│  ├─ 描述输入（可选）
│  ├─ 技术栈选择（React/Vue/Vanilla）
│  └─ 确认 → createProject() → navigate('/designer')
├─ ProjectContextMenu
│  ├─ "重命名" → inline editing
│  ├─ "归档" → archiveProject()
│  └─ "删除" → 二次确认 → deleteProject()
└─ 项目筛选：全部 / 活跃 / 草稿 / 归档
```

**新增组件**:
- `CreateProjectDialog.tsx` — 项目创建对话框

**改动文件**:
| 文件 | 改动类型 | 改动量 |
|------|---------|--------|
| `app-store.ts` | 扩展 | 中（约 60 行新增） |
| `HomePage.tsx` | 扩展 | 中（约 100 行改动） |
| `CreateProjectDialog.tsx` | 新增 | 约 120 行 |

---

### F-03: AI 代码生成 → 编辑器回写

**目标**: AI 对话生成的代码片段可一键应用到 CenterPanel 编辑器，支持新建文件和修改现有文件。

**当前状态**:
- `LeftPanel.tsx` 已有 Markdown 代码块渲染（`renderMarkdown` 函数）
- 代码块已有"复制"按钮，但无"应用到编辑器"功能
- `code-generation-service.ts` 有模板引擎但未与 AI 对话集成
- `app-store.ts` 有 `fileContents`/`openFileTab`/`setSelectedFile` API

**用户场景**:
1. AI 返回代码片段，每个代码块右上角显示 [复制] [应用] [新建文件] 按钮
2. 点击 [应用] → 代码写入当前打开文件（光标位置或替换全文）
3. 点击 [新建文件] → 弹出文件名输入 → 在文件树创建新文件并写入代码
4. 应用后编辑器高亮变更区域，3 秒后渐隐

**技术实现路径**:

```
LeftPanel.tsx → renderMarkdown
├─ 代码块增加 "Apply" 按钮
│  ├─ 读取 app-store.selectedFile
│  ├─ 调用 app-store.updateFileContent(path, code)
│  └─ toast("代码已应用到 {filename}")
├─ 代码块增加 "New File" 按钮
│  ├─ 弹出 inline 文件名输入
│  ├─ 调用 file-tree-store.createFile(path)
│  ├─ 调用 app-store.setFileContent(path, code)
│  └─ 自动切换到新文件 tab
└─ 应用动画
   ├─ CenterPanel 监听 lastAppliedFile 变更
   └─ 显示 diff 高亮 → 渐隐动画

app-store.ts
├─ updateFileContent(path, content) → 更新 fileContents
├─ lastAppliedFile: string | null → 触发编辑器高亮
└─ clearAppliedHighlight() → 3s 后清除
```

**改动文件**:
| 文件 | 改动类型 | 改动量 |
|------|---------|--------|
| `LeftPanel.tsx` | 扩展 | 中（约 60 行） |
| `app-store.ts` | 扩展 | 小（约 20 行） |
| `CenterPanel.tsx` | 扩展 | 小（约 30 行高亮动画） |

---

### F-04: 中英文切换 (i18n UI)

**目标**: TopNavBar 语言切换图标可实际切换 UI 语言，所有静态文案支持中/英文。

**当前状态**:
- `i18n-service.ts` 已实现 `t(key)` 翻译函数和 locale 切换
- TopNavBar 已有语言切换图标（`Globe` icon），但 onClick 为 toast 占位
- 所有组件硬编码中文字符串

**技术实现路径**:

```
Phase 1: 基础设施
├─ i18n-service.ts → 补充完整词表（预计 200+ keys）
├─ 新增 useI18n() hook → { t, locale, setLocale }
└─ TopNavBar 语言按钮 → 调用 setLocale('en'/'zh')

Phase 2: 逐步迁移（可跨多轮迭代）
├─ TopNavBar → t('nav.home'), t('nav.settings'), ...
├─ ViewSwitchBar → t('view.preview'), t('view.code'), ...
├─ LeftPanel → t('chat.placeholder'), t('chat.send'), ...
├─ HomePage → t('home.brand'), t('home.slogan'), ...
└─ 快捷键提示、toast 消息等
```

**改动文件**:
| 文件 | 改动类型 | 改动量 |
|------|---------|--------|
| `i18n-service.ts` | 扩展 | 大（200+ 词条） |
| 新增 `useI18n.ts` hook | 新增 | 小（约 20 行） |
| `TopNavBar.tsx` | 修改 | 小（接入 setLocale） |
| 所有 UI 组件 | 逐步迁移 | 中（每组件约 10-30 行改动） |

---

### F-05: 预览面板真实渲染（基础版）

**目标**: PreviewPanel 从纯 Mock Dashboard 升级为能渲染 AI 生成的 React 组件代码。

**当前状态**:
- `PreviewPanel.tsx` 渲染硬编码的 Mock Dashboard UI
- 设备模拟（桌面/平板/手机）和缩放已实现

**技术实现路径（基础版）**:

```
方案: iframe + srcdoc 注入
├─ 监听 app-store.fileContents 变更
├─ 将当前文件代码包装为完整 HTML
│  ├─ 注入 React/ReactDOM CDN
│  ├─ 注入 Tailwind CSS CDN
│  └─ 代码通过 Babel standalone 编译
├─ 生成 srcdoc 并设置到 iframe
├─ 刷新按钮 → 强制重新注入
└─ 错误边界 → 编译失败显示错误信息

进阶（后续迭代）:
├─ 接入 sandpack / webcontainer
└─ 支持多文件项目编译
```

**改动文件**:
| 文件 | 改动类型 | 改动量 |
|------|---------|--------|
| `PreviewPanel.tsx` | 重构 | 大（约 150 行） |
| 新增 `preview-compiler.ts` | 新增 | 约 80 行 |

---

### F-06: Liquid Glass 全组件覆盖

**目标**: `LayoutManager.tsx` 和 `PluginManager.tsx` 集成 `useLiquidGlass` hook，消除 CSS 覆写兜底。

**当前状态**:
- 12 个消费组件中 10 个已集成 `useLiquidGlass`
- `LayoutManager.tsx` 和 `PluginManager.tsx` 靠 `liquid-glass.css` 的 `.liquid-glass-theme .lg-*` 类兜底

**技术实现路径**:

```
LayoutManager.tsx
├─ import { useLiquidGlass } from '../../utils/liquid-glass'
├─ const { isLG, cardLiftClass, ... } = useLiquidGlass()
├─ 面板配置卡片 → 条件应用 LG 样式
└─ 预设按钮 → 条件应用 LG 渐变/发光

PluginManager.tsx
├─ import { useLiquidGlass } from '../../utils/liquid-glass'
├─ const { isLG, cardLiftClass, ... } = useLiquidGlass()
├─ 插件卡片 → 条件应用 LG 样式
└─ 安装/启用按钮 → 条件应用 LG 色调
```

**改动文件**:
| 文件 | 改动类型 | 改动量 |
|------|---------|--------|
| `LayoutManager.tsx` | 修改 | 小（约 20 行） |
| `PluginManager.tsx` | 修改 | 小（约 20 行） |

---

### F-07: 命令面板 (Command Palette)

**目标**: 全局 `Ctrl+Shift+P` 唤起命令面板，支持模糊搜索快速执行操作。

**用户场景**:
1. `Ctrl+Shift+P` → 弹出命令面板
2. 输入关键词模糊匹配命令（如 "theme" → "切换主题"、"打开主题定制器"）
3. 回车/点击执行命令
4. 命令分类：文件操作、视图切换、AI 操作、布局预设、插件命令

**技术实现路径**:

```
新增 CommandPalette.tsx
├─ 使用 cmdk 库（已安装为 "cmdk": "1.1.1"）
├─ 命令注册表
│  ├─ 文件: 新建文件、打开文件、保存、搜索
│  ├─ 视图: 预览、代码、分屏、终端
│  ├─ 布局: 6 个预设切换
│  ├─ AI: 新建会话、清空对话、切换模型
│  ├─ 主题: 切换深色/亮色、打开定制器、LG 切换
│  └─ 插件: 从 plugin-store 动态注入
├─ 模糊搜索（cmdk 内置）
├─ 最近使用命令置顶
└─ 快捷键提示显示

DesignerPage.tsx
├─ 注册 Ctrl+Shift+P 快捷键
└─ 渲染 <CommandPalette />
```

**新增组件**:
- `CommandPalette.tsx` — 约 200 行

**依赖**: `cmdk@1.1.1`（已安装）

---

### F-12: 通知中心

**目标**: TopNavBar 通知图标点击展开通知面板，展示系统事件、AI 任务完成、协同消息。

**技术实现路径**:

```
新增 notification-store.ts
├─ notifications: Notification[]
├─ addNotification(type, title, message)
├─ markAsRead(id)
├─ clearAll()
└─ unreadCount (computed)

新增 NotificationPanel.tsx
├─ TopNavBar 通知图标上显示未读数 badge
├─ 点击展开下拉面板
├─ 通知列表（时间线样式）
├─ 分类筛选：全部 / AI / 系统 / 协同
└─ "全部已读" / "清空" 操作

触发源:
├─ AI 响应完成 → "AI 已生成代码"
├─ 模型心跳状态变更 → "GPT-4o 已离线"
├─ 文件保存 → "文件已自动保存"
├─ 协同用户加入/离开 → "张三已加入编辑"
└─ 插件安装完成 → "ESLint 插件已安装"
```

---

### F-14: 数据导出/备份

**目标**: 支持一键导出项目数据（会话历史、布局配置、主题设置、文件内容）为 JSON 压缩包。

**技术实现路径**:

```
TopNavBar 导出按钮（已有 Download 图标）
├─ 收集数据
��  ├─ session-store → 所有会话和消息
│  ├─ layout-store → 布局配置
│  ├─ theme-store → 主题设置
│  ├─ app-store → 项目、文件内容
│  └─ plugin-store → 插件配置
├─ 序列化为 JSON
├─ 生成 Blob → 下载
└─ 文件名: yyc3-backup-{timestamp}.json

导入:
├─ TopNavBar 导入按钮
├─ 文件选择 → 解析 JSON
├─ 版本兼容性检查
├─ 逐 store 恢复数据
└─ toast("数据恢复成功")
```

---

## 四、技术架构影响评估

### 4.1 Store 层变更

```
现有 10 stores                    新增/修改
┌─────────────────┐              ┌──────────────────────┐
│ app-store       │──── 扩展 ───→│ + createProject()     │
│ session-store   │──── 接入 ───→│ + 接入 LeftPanel UI   │
│ theme-store     │              │ (无变更)              │
│ layout-store    │              │ (无变更)              │
│ file-tree-store │              │ (无变更)              │
│ plugin-store    │              │ (无变更)              │
│ collab-store    │              │ (P2 阶段改造)         │
│ sync-store      │              │ (无变更)              │
│ heartbeat-store │              │ (无变更)              │
│ design-store    │              │ (无变更)              │
└─────────────────┘              └──────────────────────┘
                                  新增:
                                  ┌──────────────────────┐
                                  │ notification-store    │
                                  └──────────────────────┘
```

### 4.2 组件层变更

```
Sprint 1 改动文件:
├─ LeftPanel.tsx ───── 重构（session-store 接入 + 代码应用按钮）
├─ CenterPanel.tsx ─── 小改（代码应用高亮动画）
├─ app-store.ts ───── 扩展（项目 CRUD + 文件更新 API）
├─ HomePage.tsx ───── 扩展（项目 CRUD UI）
├─ LayoutManager.tsx ─ 小改（useLiquidGlass 集成）
├─ PluginManager.tsx ─ 小改（useLiquidGlass 集成）
└─ 新增:
   └─ CreateProjectDialog.tsx

Sprint 2 新增文件:
├─ CommandPalette.tsx
├─ NotificationPanel.tsx
├─ notification-store.ts
├─ useI18n.ts
└─ preview-compiler.ts
```

### 4.3 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| LeftPanel.tsx 大文件重构导致截断 | 高 | 高 | **必须用 `write_tool` 输出完整内容** |
| CenterPanel.tsx 大文件编辑截断 | 中 | 高 | 小改用 `edit_tool`，大改用 `write_tool` |
| session-store 接入引起 hydration 竞态 | 中 | 中 | loadFromStorage 加 loading 态守卫 |
| PreviewPanel iframe 编译性能 | 中 | 中 | 防抖 500ms + loading 骨架屏 |
| i18n 迁移遗漏硬编码字符串 | 高 | 低 | 分批迁移，CI lint 检查 |
| `react-router-dom` 误引入 | 低 | 高 | 全局搜索 + 替换为 `react-router` |

---

## 五、实施计划

### Sprint 1 任务分解 (v1.1-alpha)

| 序号 | 任务 | 前置依赖 | 预估工时 | 交付物 |
|------|------|---------|---------|--------|
| 1.1 | session-store 补充 `getOrCreateDefault` | 无 | 0.5d | store 更新 |
| 1.2 | LeftPanel 接入 session-store | 1.1 | 1.5d | 会话持久化 |
| 1.3 | app-store 项目 CRUD 方法 | 无 | 0.5d | store 更新 |
| 1.4 | CreateProjectDialog 组件 | 1.3 | 1d | 新组件 |
| 1.5 | HomePage 项目 CRUD 集成 | 1.3, 1.4 | 1d | 页面更新 |
| 1.6 | LeftPanel 代码应用按钮 | 1.2 | 1d | 功能增强 |
| 1.7 | CenterPanel 代码应用高亮 | 1.6 | 0.5d | 动画效果 |
| 1.8 | LayoutManager LG 集成 | 无 | 0.5d | 样式修复 |
| 1.9 | PluginManager LG 集成 | 无 | 0.5d | 样式修复 |
| 1.10 | 集成测试 + 回归验证 | 1.1-1.9 | 1d | 质量保证 |
| | **合计** | | **8d** | |

### Sprint 2 任务分解 (v1.1-beta)

| 序号 | 任务 | 前置依赖 | 预估工时 | 交付物 |
|------|------|---------|---------|--------|
| 2.1 | i18n 词表补充 (200+ keys) | 无 | 1.5d | i18n 数据 |
| 2.2 | useI18n hook + TopNavBar 接入 | 2.1 | 0.5d | 基础框架 |
| 2.3 | 核心组件 i18n 迁移 | 2.2 | 2d | UI 国际化 |
| 2.4 | CommandPalette 组件 | 无 | 1.5d | 新组件 |
| 2.5 | notification-store | 无 | 0.5d | 新 store |
| 2.6 | NotificationPanel 组件 | 2.5 | 1d | 新组件 |
| 2.7 | 数据导出/导入 | 无 | 1d | 功能 |
| 2.8 | PreviewPanel 基础真实渲染 | 无 | 1.5d | 功能增强 |
| 2.9 | 集成测试 + 回归验证 | 2.1-2.8 | 1d | 质量保证 |
| | **合计** | | **10.5d** | |

### 里程碑

| 日期 | 里程碑 | 关键指标 |
|------|--------|---------|
| T+8d | v1.1-alpha | 核心闭环：会话持久 + 项目 CRUD + 代码回写 |
| T+18d | v1.1-beta | 体验增强：i18n + 命令面板 + 通知 + 导出 |
| T+30d | v1.1-rc | 平台能力：Git + 协同 + 插件沙箱 |
| T+35d | v1.1-release | 全面回归测试通过，发布 |

---

## 六、质量保障计划

### 6.1 测试策略

| 测试层级 | 覆盖范围 | 工具 |
|---------|---------|------|
| 单元测试 | Store 逻辑、Service 方法 | Vitest |
| 组件测试 | 关键 UI 交互 | React Testing Library |
| E2E 测试 | 核心用户流程 | Playwright |
| 性能测试 | 大文件编辑、多会话切换 | Lighthouse + 自建 |

### 6.2 大文件操作安全规程

鉴于 `LeftPanel.tsx`、`CenterPanel.tsx`、`RightPanel.tsx` 均为 400+ 行大文件，且历史上多次因 `fast_apply_tool` 截断丢失内容：

1. **修改前**: 必须 `read` 完整文件确认行数
2. **小改动** (< 30 行): 使用 `edit_tool` + 充分上下文
3. **大改动** (> 30 行): **必须使用 `write_tool` 输出完整文件**
4. **修改后**: 立即 `read` 验证文件完整性（行数对比）
5. **关键函数**: 修改 `triggerAIResponse`、`renderMarkdown` 等核心函数后必须逐行验证

### 6.3 编译验证清单

每次修改后执行：
- [ ] 无 TypeScript 编译错误
- [ ] 无 `react-router-dom` 误引入（全部使用 `react-router`）
- [ ] `useLiquidGlass` 导出完整（12 个消费组件依赖）
- [ ] `sync-store.ts` 语法正确（注意 `syncTarget` 函数闭合）
- [ ] 所有 Zustand store 正确导出

---

## 七、附录：建议执行顺序（即刻可启动）

基于当前代码状态，建议**立即**启动以下三项（互不依赖，可并行）：

1. **F-06 LG 全覆盖**（最小改动，0.5d，消除技术债）
   - `LayoutManager.tsx` + `PluginManager.tsx` 集成 `useLiquidGlass`

2. **F-01 会话持久化**（核心价值，1.5d，打通数据闭环）
   - `session-store` → `LeftPanel` 桥接

3. **F-02 项目 CRUD**（用户体验，2d，首页功能闭合）
   - `app-store` 扩展 + `CreateProjectDialog` + `HomePage` 集成

---

> **「YanYuCloudCube」**
> 万象归元于云枢 | 深栈智启新纪元
