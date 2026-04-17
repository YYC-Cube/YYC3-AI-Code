---
file: YYC3-前端一体化-配置管理工具.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: development
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

# YYC³ 前端一体化应用配置管理工具

## 🎯 工具概述

本工具提供 **可视化配置界面**，用于编辑 YYC³ 前端一体化应用的所有配置参数，并生成完整的 Prompt 供 LLM 使用。

### 核心特性

- ✅ **完全可视化**：所有配置均通过 UI 界面编辑，无需手动修改代码
- ✅ **实时预览**：配置变更实时反映在预览区域
- ✅ **配置验证**：自动验证配置的完整性和正确性
- ✅ **模板系统**：提供预设配置模板，快速初始化项目
- ✅ **导入导出**：支持 JSON 格式的配置导入和导出
- ✅ **持久化存储**：配置自动保存到浏览器本地存储
- ✅ **Prompt 生成**：一键生成完整的 Prompt，可直接复制到 LLM

---

## 🚀 快速开始

### 1. 启动工具

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 2. 配置项目

1. 打开浏览器访问 `http://localhost:5173`
2. 选择配置模板或从空白配置开始
3. 逐项编辑配置参数
4. 实时查看配置预览
5. 验证配置完整性
6. 生成完整 Prompt

### 3. 使用 Prompt

1. 点击 "生成 Prompt" 按钮
2. 复制生成的 Prompt
3. 粘贴到 LLM 的 system/user 输入框
4. 运行模型生成代码

---

## 📋 配置分类

### 1. 项目基础信息

| 配置项 | 说明 | 默认值 | 必填 |
|--------|------|---------|------|
| 项目名称 | 项目的唯一标识符 | yyc3-ai-code | ✅ |
| 显示名称 | 项目的显示名称 | YYC³ AI Code | ✅ |
| 项目描述 | 项目的详细描述 | YYC³ AI Code - 前端一体化智能编程系统 | ✅ |
| 版本号 | 项目版本号 | v1.0.0 | ✅ |
| 许可证 | 项目许可证 | MIT | ✅ |
| 代码仓库 | Git 仓库地址 | https://github.com/YYC-Cube/yyc3-ai-code | ✅ |
| 项目主页 | 项目主页地址 | https://yyc3.ai | ✅ |
| 默认工作区 | 默认工作区路径 | ~/Documents/YYC3-AI-Code | ✅ |

### 2. 团队信息

| 配置项 | 说明 | 默认值 | 必填 |
|--------|------|---------|------|
| 团队名称 | 团队或组织名称 | YanYuCloudCube Team | ✅ |
| 联系邮箱 | 联系邮箱地址 | admin@0379.email | ✅ |
| 团队网站 | 团队官方网站 | https://yyc3.ai | ✅ |
| 中文标语 | 中文宣传标语 | 言传千行代码 \| 语枢万物智能 | ✅ |
| 英文标语 | 英文宣传标语 | Words Initiate Quadrants, Language Serves as Core for Future | ✅ |
| 中文座右铭 | 中文座右铭 | 万象归元于云枢 \| 深栈智启新纪元 | ✅ |
| 英文座右铭 | 英文座右铭 | All things converge in cloud pivot; Deep stacks ignite a new era of intelligence | ✅ |

### 3. 技术栈配置

#### 前端框架

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 框架名称 | 前端框架 | React, Vue, Svelte | React |
| 框架版本 | 框架版本号 | 18.x, 3.x, 4.x | 18.x |
| 框架类型 | 框架类型 | react, vue, svelte | react |

#### 构建工具

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 构建工具名称 | 构建工具 | Vite, Webpack, Rollup | Vite |
| 构建工具版本 | 构建工具版本号 | 5.x, 5.x, 3.x | 5.x |

#### 类型系统

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 启用 TypeScript | 是否使用 TypeScript | true, false | true |
| TypeScript 版本 | TypeScript 版本号 | 5.x | 5.x |
| 严格模式 | 是否启用严格模式 | true, false | true |

#### 状态管理

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 状态管理库 | 状态管理库 | Zustand, Jotai, Redux, XState | Zustand |
| 版本号 | 库版本号 | 4.x, 2.x, 9.x, 5.x | 4.x |

#### UI 组件库

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| UI 库名称 | UI 组件库 | Ant Design, Material UI, Chakra UI | Ant Design |
| 版本号 | 库版本号 | 5.x, 5.x, 2.x | 5.x |

#### 原生桥接

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 桥接类型 | 原生桥接类型 | Tauri, Electron | Tauri |
| 版本号 | 桥接工具版本号 | Latest, Latest | Latest |

#### 本地存储

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| IndexedDB ORM | IndexedDB ORM 库 | Dexie.js, IDB | Dexie.js |
| 版本号 | 库版本号 | 3.x, 7.x | 3.x |
| 文件系统 API | 是否启用文件系统 API | true, false | true |

#### 图标库

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 图标库名称 | 图标库 | Lucide React, Feather Icons, Ant Design Icons | Lucide React |
| 版本号 | 库版本号 | 0.312.0, 4.x, 5.x | 0.312.0 |

#### AI SDK

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| AI 提供商 | AI 服务提供商 | OpenAI, Anthropic, Google AI | OpenAI |
| SDK 版本 | SDK 版本号 | Latest, Latest, Latest | Latest |

#### 工作线程

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| Worker 通信库 | Worker 通信库 | Comlink, Worker-Threads | Comlink |
| 版本号 | 库版本号 | 4.x, 8.x | 4.x |

### 4. 设计系统配置

#### 颜色系统

| 配置项 | 说明 | 默认值 | 格式 |
|--------|------|---------|------|
| 主色调 | 主要品牌色 | #3A8EE6 | HEX |
| 辅色调 | 辅助品牌色 | #F2A93B | HEX |
| 背景色 | 页面背景色 | #F8FAFC | HEX |
| 表面色 | 卡片/面板色 | #FFFFFF | HEX |
| 主文字色 | 主要文字颜色 | #1F2937 | HEX |
| 次要文字色 | 次要文字颜色 | #4B5563 | HEX |
| 禁用文字色 | 禁用状态文字色 | #9CA3AF | HEX |
| 边框色 | 边框颜色 | #E5E7EB | HEX |
| 分割线色 | 分割线颜色 | #F3F4F6 | HEX |
| 成功色 | 成功状态色 | #10B981 | HEX |
| 警告色 | 警告状态色 | #F59E0B | HEX |
| 错误色 | 错误状态色 | #EF4444 | HEX |
| 信息色 | 信息状态色 | #3B82F6 | HEX |

#### 字体系统

| 配置项 | 说明 | 默认值 | 格式 |
|--------|------|---------|------|
| 主字体族 | 主要字体 | PingFang SC, Roboto, Arial | 字体栈 |
| 次要字体族 | 次要字体 | -apple-system, BlinkMacSystemFont, Segoe UI | 字体栈 |
| 等宽字体族 | 等宽字体 | JetBrains Mono, Fira Code, Consolas | 字体栈 |
| 标题1字号 | H1 字号 | 36px | px |
| 标题2字号 | H2 字号 | 30px | px |
| 标题3字号 | H3 字号 | 24px | px |
| 标题4字号 | H4 字号 | 20px | px |
| 标题5字号 | H5 字号 | 18px | px |
| 标题6字号 | H6 字号 | 16px | px |
| 大正文字号 | Body Large 字号 | 16px | px |
| 中正文字号 | Body Medium 字号 | 14px | px |
| 小正文字号 | Body Small 字号 | 12px | px |
| 说明文字号 | Caption 字号 | 10px | px |

#### 间距系统

| 配置项 | 说明 | 默认值 | 格式 |
|--------|------|---------|------|
| 超小间距 | Extra Small | 4px | px |
| 小间距 | Small | 8px | px |
| 中间距 | Medium | 12px | px |
| 大间距 | Large | 16px | px |
| 超大间距 | Extra Large | 24px | px |

#### 圆角系统

| 配置项 | 说明 | 默认值 | 格式 |
|--------|------|---------|------|
| 小圆角 | Small | 4px | px |
| 中圆角 | Medium | 8px | px |
| 大圆角 | Large | 12px | px |
| 超大圆角 | Extra Large | 16px | px |
| 完全圆角 | Full | 9999px | px |

#### 阴影系统

| 配置项 | 说明 | 默认值 | 格式 |
|--------|------|---------|------|
| 小阴影 | Small | 0 1px 2px rgba(0,0,0,0.05) | CSS |
| 中阴影 | Medium | 0 4px 6px rgba(0,0,0,0.07) | CSS |
| 大阴影 | Large | 0 10px 15px rgba(0,0,0,0.1) | CSS |
| 超大阴影 | Extra Large | 0 20px 25px rgba(0,0,0,0.15) | CSS |

#### 动画系统

| 配置项 | 说明 | 默认值 | 格式 |
|--------|------|---------|------|
| 快速动画 | Fast | 150ms | ms |
| 正常动画 | Normal | 300ms | ms |
| 慢速动画 | Slow | 500ms | ms |
| 缓入 | Ease In | cubic-bezier(0.4, 0, 1, 1) | CSS |
| 缓出 | Ease Out | cubic-bezier(0, 0, 0.2, 1) | CSS |
| 缓入缓出 | Ease In Out | cubic-bezier(0.4, 0, 0.2, 1) | CSS |

### 5. 图标系统配置

#### 图标库配置

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 图标库名称 | 图标库 | Lucide React, Feather Icons, Ant Design Icons | Lucide React |
| 版本号 | 库版本号 | 0.312.0, 4.x, 5.x | 0.312.0 |
| 图标类型 | 图标类型 | lucide, feather, ant-design | lucide |

#### 图标交互规范

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 默认显示文字 | 默认状态是否显示文字 | true, false | false |
| 默认颜色 | 默认状态颜色 | #6B7280 | HEX |
| 悬停显示文字 | 悬停状态是否显示文字 | true, false | true |
| 悬停颜色 | 悬停状态颜色 | #3B82F6 | HEX |
| 悬停显示提示 | 悬停是否显示 Tooltip | true, false | true |
| 激活颜色 | 激活状态颜色 | #2563EB | HEX |
| 禁用透明度 | 禁用状态透明度 | 0.4 | 0-1 |

#### 图标尺寸

| 配置项 | 说明 | 默认值 | 格式 |
|--------|------|---------|------|
| 超小图标 | Extra Small | 16 | px |
| 小图标 | Small | 20 | px |
| 中图标 | Medium | 24 | px |
| 大图标 | Large | 32 | px |
| 超大图标 | Extra Large | 48 | px |

### 6. 数据库配置

#### 支持的数据库类型

| 数据库类型 | 名称 | 默认端口 | 配置文件 |
|----------|------|---------|---------|
| PostgreSQL | PostgreSQL | 5432 | postgresql.conf, pg_hba.conf |
| MySQL | MySQL | 3306 | my.cnf, my.ini |
| Redis | Redis | 6379 | redis.conf |
| SQLite | SQLite | - | - |

#### 连接池配置

| 配置项 | 说明 | 默认值 | 范围 |
|--------|------|---------|------|
| 最小连接数 | 最小连接数 | 1 | 1-10 |
| 最大连接数 | 最大连接数 | 10 | 10-100 |
| 空闲超时 | 空闲连接超时时间 | 300 | 60-3600 |

#### 查询配置

| 配置项 | 说明 | 默认值 | 范围 |
|--------|------|---------|------|
| 查询超时 | 查询超时时间（毫秒） | 30000 | 5000-120000 |
| 分页大小 | 每页记录数 | 50 | 10-500 |
| 最大结果集 | 最大结果集大小 | 10000 | 1000-100000 |

#### 备份配置

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 启用备份 | 是否启用自动备份 | true, false | true |
| 备份计划 | 备份计划（cron 表达式） | 0 2 * * * | cron |
| 保留天数 | 备份保留天数 | 30 | 1-365 |
| 加密备份 | 是否加密备份文件 | true, false | true |

### 7. AI 服务配置

#### 服务商管理

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 服务商 ID | 服务商唯一标识 | 自定义字符串 | openai |
| 服务商名称 | 服务商名称 | 自定义字符串 | OpenAI |
| 显示名称 | 显示名称 | 自定义字符串 | OpenAI |
| 服务商类型 | 类型 | cloud, local | cloud |
| API 基础 URL | API 基础 URL | URL | https://api.openai.com/v1 |
| API 密钥 | API 密钥（加密存储） | 加密字符串 | - |
| API 密钥 URL | API 密钥获取页面 URL | URL | https://platform.openai.com/api-keys |
| 区域 | 区域（国内服务商需要） | cn, us, eu | - |
| 启用状态 | 是否启用 | true, false | true |
| 优先级 | 优先级（用于自动选择） | 1-100 | 1 |

#### 模型管理

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 模型 ID | 模型唯一标识 | 自定义字符串 | gpt-4-turbo-preview |
| 模型名称 | 模型名称 | 自定义字符串 | gpt-4-turbo-preview |
| 显示名称 | 显示名称 | 自定义字符串 | GPT-4 Turbo |
| 模型类型 | 模型类型 | chat, embedding, fine-tune, image, audio | chat |
| 上下文长度 | 上下文长度 | 1-200000 | 128000 |
| 最大令牌数 | 最大令牌数 | 1-4096 | 4096 |
| 启用状态 | 是否启用 | true, false | true |

#### 模型参数

| 配置项 | 说明 | 默认值 | 范围 |
|--------|------|---------|------|
| 温度参数 | Temperature | 0.7 | 0-2 |
| Top‑P 参数 | Top‑P | 1.0 | 0-1 |
| 频率惩罚 | Frequency Penalty | 0.0 | -2.0-2.0 |
| 存在惩罚 | Presence Penalty | 0.0 | -2.0-2.0 |

#### 模型能力

| 能力 | 说明 | 适用模型 |
|------|------|----------|
| chat | 对话能力 | GPT-4, Claude, GLM-4, Qwen 等 |
| code | 代码生成能力 | GPT-4, Claude, Code Llama 等 |
| reasoning | 推理能力 | GPT-4, Claude, GLM-4, Qwen Max 等 |
| analysis | 分析能力 | Claude 3 Opus, Qwen Max 等 |
| embedding | 嵌入能力 | Ada Embedding, Embedding-2 等 |

#### 模型基准测试

| 配置项 | 说明 | 默认值 | 单位 |
|--------|------|---------|------|
| 延迟 | 响应延迟 | 1500 | ms |
| 吞吐量 | 吞吐量 | 50 | tokens/s |
| 准确率 | 准确率 | 0.95 | 0-1 |

#### 速率限制

| 配置项 | 说明 | 默认值 | 范围 |
|--------|------|---------|------|
| 每分钟请求数 | 每分钟最大请求数 | 3500 | 10-10000 |
| 每分钟令牌数 | 每分钟最大令牌数 | 90000 | 1000-1000000 |

#### 定价信息

| 配置项 | 说明 | 默认值 | 单位 |
|--------|------|---------|------|
| 输入价格 | 输入价格 | 0.01 | USD/1K tokens |
| 输出价格 | 输出价格 | 0.03 | USD/1K tokens |
| 货币单位 | 货币单位 | USD, CNY | - |

#### 智能检测配置

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 启用智能检测 | 是否启用智能检测 | true, false | true |
| 自动选择最佳 | 自动选择最佳服务商/模型 | true, false | true |
| 性能监控 | 实时监控性能 | true, false | true |
| 错误分析 | 自动分析错误 | true, false | true |

#### 缓存配置

| 配置项 | 说明 | 默认值 | 范围 |
|--------|------|---------|------|
| 启用缓存 | 是否启用 AI 缓存 | true | - |
| 缓存时间 | 缓存生存时间（秒） | 86400 | 60-604800 |
| 最大缓存条目 | 最大缓存条目数 | 1000 | 100-10000 |

#### 速率限制配置

| 配置项 | 说明 | 默认值 | 范围 |
|--------|------|---------|------|
| 启用速率限制 | 是否启用速率限制 | true | - |
| 每分钟请求数 | 每分钟最大请求数 | 60 | 10-300 |
| 重试次数 | 失败重试次数 | 3 | 1-10 |
| 退避倍数 | 指数退避倍数 | 2 | 1.5-5 |

#### 预设服务商

| 服务商 | 类型 | 区域 | API 密钥 URL | 主要模型 |
|--------|------|------|-------------|----------|
| OpenAI | cloud | global | https://platform.openai.com/api-keys | GPT-4 Turbo, GPT-3.5 Turbo, Ada Embedding |
| Anthropic | cloud | global | https://console.anthropic.com/settings/keys | Claude 3 Opus, Claude 3 Sonnet |
| 智谱 AI | cloud | cn | https://open.bigmodel.cn/usercenter/apikeys | GLM-4, GLM-4 Flash, Embedding-2 |
| 百度文心 | cloud | cn | https://console.bce.baidu.com/qianfan/ais/console/application/list | ERNIE-4.0-8K, ERNIE-3.5-8K |
| 阿里通义 | cloud | cn | https://dashscope.console.aliyun.com/apiKey | Qwen Turbo, Qwen Plus, Qwen Max |
| Ollama | local | - | - | Llama 2, Mistral, Code Llama |

#### 服务商管理功能

##### 1. 动态服务商管理
- **添加服务商**：通过 UI 界面添加新的 AI 服务商
- **删除服务商**：删除现有的 AI 服务商
- **编辑服务商**：编辑服务商配置信息
- **启用/禁用**：启用或禁用服务商

##### 2. 动态模型管理
- **添加模型**：为现有服务商添加新模型
- **删除模型**：从服务商中删除模型
- **编辑模型**：编辑模型配置信息
- **启用/禁用**：启用或禁用模型

##### 3. 一键 API 密钥获取
- **API 密钥 URL**：每个服务商可以指定 API 密钥获取页面 URL
- **自动跳转**：点击自动跳转到 API 密钥获取页面
- **自动填充**：支持获取后自动填充 API 密钥
- **密钥验证**：支持获取后验证 API 密钥有效性

##### 4. 智能检测
- **性能监控**：实时监控每个服务商的性能指标
- **错误分析**：自动分析错误类型和频率
- **自动选择**：根据性能自动选择最佳服务商
- **故障转移**：失败时自动切换到备用服务商

##### 5. 错误分析
- **错误分类**：将错误分类为不同类型（网络、API、速率限制等）
- **错误日志**：详细记录所有错误及时间戳
- **错误统计**：统计分析错误模式
- **错误建议**：提供解决常见错误的建议

### 8. 构建部署配置

#### Vite 配置

| 配置项 | 说明 | 默认值 | 范围 |
|--------|------|---------|------|
| 开发服务器端口 | 开发服务器端口 | 5173 | 1024-65535 |
| 开发服务器主机 | 开发服务器主机 | localhost | - |
| 自动打开浏览器 | 是否自动打开浏览器 | true | - |

#### Tauri 配置

| 配置项 | 说明 | 默认值 | 必填 |
|--------|------|---------|------|
| Bundle ID | Bundle ID | com.yyc3.ai-code | ✅ |
| 产品名称 | 产品名称 | YYC³ AI Code | ✅ |
| 版本号 | 版本号 | 1.0.0 | ✅ |
| 更新 URL | 更新服务器 URL | https://updates.yyc3.ai | ✅ |
| 图标路径 | 图标文件路径 | ./icons/icon.png | ✅ |

#### CI/CD 配置

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| CI/CD 平台 | CI/CD 平台 | GitHub, GitLab, Bitbucket | GitHub |
| 启用 CI/CD | 是否启用 CI/CD | true, false | true |
| 推送时构建 | 推送时自动构建 | true, false | true |
| PR 时构建 | PR 时自动构建 | true, false | true |
| 发布版本 | 自动发布版本 | true, false | true |

### 9. 测试配置

#### 单元测试

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 测试框架 | 单元测试框架 | Vitest, Jest, Mocha | Vitest |
| 覆盖率阈值 | 代码覆盖率阈值 | 80 | 0-100 |

#### 集成测试

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 测试框架 | 集成测试框架 | React Testing Library, Testing Library | React Testing Library |
| 超时时间 | 测试超时时间 | 5000 | 1000-30000 |

#### E2E 测试

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 测试框架 | E2E 测试框架 | Playwright, Cypress, Puppeteer | Playwright |
| 浏览器列表 | 测试浏览器 | Chrome, Firefox, Safari, Edge | Chrome, Firefox, Safari, Edge |
| 无头模式 | 无头模式 | true, false | true |

#### 代码质量

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 代码检查工具 | Linter | ESLint, TSLint | ESLint |
| 代码格式化工具 | Formatter | Prettier, Biome | Prettier |
| 严格模式 | 严格模式 | true, false | true |

### 10. 文档配置

#### 组件文档

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 文档工具 | 组件文档工具 | Storybook, Docz | Storybook |
| 启用组件文档 | 是否启用组件文档 | true, false | true |

#### API 文档

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 文档工具 | API 文档工具 | TypeDoc, OpenAPI | TypeDoc |
| 启用 API 文档 | 是否启用 API 文档 | true, false | true |

#### 用户文档

| 配置项 | 说明 | 可选值 | 默认值 |
|--------|------|---------|--------|
| 文档工具 | 用户文档工具 | Docusaurus, VuePress | Docusaurus |
| 启用用户文档 | 是否启用用户文档 | true, false | true |

---

## 🎨 配置模板

### 1. YYC³ 默认模板

适用于 YYC³ 团队标准项目，包含所有推荐配置。

### 2. 最小化模板

适用于快速原型开发，仅包含核心配置。

### 3. 企业级模板

适用于企业级应用，包含完整的安全、监控、日志配置。

### 4. AI 优先模板

适用于 AI 驱动的应用，包含完整的 AI 服务配置。

---

## 📤 配置导入导出

### 导出配置

```json
{
  "project": {
    "name": "yyc3-ai-code",
    "displayName": "YYC³ AI Code",
    "description": "YYC³ AI Code - 前端一体化智能编程系统",
    "version": "v1.0.0",
    "license": "MIT",
    "repository": "https://github.com/YYC-Cube/yyc3-ai-code",
    "homepage": "https://yyc3.ai",
    "defaultWorkspace": "~/Documents/YYC3-AI-Code"
  },
  "team": {
    "name": "YanYuCloudCube Team",
    "email": "admin@0379.email",
    "website": "https://yyc3.ai",
    "sloganCN": "言传千行代码 | 语枢万物智能",
    "sloganEN": "Words Initiate Quadrants, Language Serves as Core for Future",
    "mottoCN": "万象归元于云枢 | 深栈智启新纪元",
    "mottoEN": "All things converge in cloud pivot; Deep stacks ignite a new era of intelligence"
  },
  "techStack": {
    "framework": {
      "name": "React",
      "version": "18.x",
      "type": "react"
    },
    "buildTool": {
      "name": "Vite",
      "version": "5.x"
    },
    "typeScript": {
      "enabled": true,
      "version": "5.x",
      "strict": true
    },
    "stateManagement": {
      "library": "Zustand",
      "version": "4.x"
    },
    "uiLibrary": {
      "name": "Ant Design",
      "version": "5.x"
    },
    "nativeBridge": {
      "type": "tauri",
      "version": "Latest"
    },
    "storage": {
      "indexedDB": {
        "library": "Dexie.js",
        "version": "3.x"
      },
      "fileSystem": {
        "enabled": true
      }
    },
    "iconLibrary": {
      "name": "Lucide React",
      "version": "0.312.0"
    },
    "aiSDK": {
      "provider": "OpenAI",
      "version": "Latest"
    },
    "worker": {
      "library": "Comlink",
      "version": "4.x"
    }
  },
  "designSystem": {
    "colors": {
      "primary": "#3A8EE6",
      "secondary": "#F2A93B",
      "background": "#F8FAFC",
      "surface": "#FFFFFF",
      "text": {
        "primary": "#1F2937",
        "secondary": "#4B5563",
        "disabled": "#9CA3AF"
      },
      "border": "#E5E7EB",
      "divider": "#F3F4F6",
      "success": "#10B981",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6"
    },
    "typography": {
      "fontFamily": {
        "primary": "PingFang SC, Roboto, Arial",
        "secondary": "-apple-system, BlinkMacSystemFont, Segoe UI",
        "mono": "JetBrains Mono, Fira Code, Consolas"
      },
      "fontSize": {
        "h1": "36px",
        "h2": "30px",
        "h3": "24px",
        "h4": "20px",
        "h5": "18px",
        "h6": "16px",
        "bodyLarge": "16px",
        "bodyMedium": "14px",
        "bodySmall": "12px",
        "caption": "10px"
      }
    },
    "spacing": {
      "xs": "4px",
      "sm": "8px",
      "md": "12px",
      "lg": "16px",
      "xl": "24px"
    },
    "borderRadius": {
      "sm": "4px",
      "md": "8px",
      "lg": "12px",
      "xl": "16px",
      "full": "9999px"
    },
    "shadows": {
      "sm": "0 1px 2px rgba(0,0,0,0.05)",
      "md": "0 4px 6px rgba(0,0,0,0.07)",
      "lg": "0 10px 15px rgba(0,0,0,0.1)",
      "xl": "0 20px 25px rgba(0,0,0,0.15)"
    },
    "animation": {
      "duration": {
        "fast": "150ms",
        "normal": "300ms",
        "slow": "500ms"
      },
      "easing": {
        "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
        "easeOut": "cubic-bezier(0, 0, 0.2, 1)",
        "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)"
      }
    }
  },
  "iconSystem": {
    "library": {
      "name": "Lucide React",
      "version": "0.312.0",
      "type": "lucide"
    },
    "interaction": {
      "default": {
        "showText": false,
        "color": "#6B7280"
      },
      "hover": {
        "showText": true,
        "color": "#3B82F6",
        "showTooltip": true
      },
      "active": {
        "color": "#2563EB"
      },
      "disabled": {
        "opacity": 0.4
      }
    },
    "sizes": {
      "xs": 16,
      "sm": 20,
      "md": 24,
      "lg": 32,
      "xl": 48
    }
  },
  "database": {
    "supportedTypes": [
      {
        "type": "postgresql",
        "name": "PostgreSQL",
        "defaultPort": 5432,
        "configFiles": ["postgresql.conf", "pg_hba.conf"]
      },
      {
        "type": "mysql",
        "name": "MySQL",
        "defaultPort": 3306,
        "configFiles": ["my.cnf", "my.ini"]
      },
      {
        "type": "redis",
        "name": "Redis",
        "defaultPort": 6379,
        "configFiles": ["redis.conf"]
      },
      {
        "type": "sqlite",
        "name": "SQLite",
        "defaultPort": 0,
        "configFiles": []
      }
    ],
    "connectionPool": {
      "min": 1,
      "max": 10,
      "idleTimeout": 300
    },
    "query": {
      "timeout": 30000,
      "pageSize": 50,
      "maxResultSize": 10000
    },
    "backup": {
      "enabled": true,
      "schedule": "0 2 * * *",
      "retentionDays": 30,
      "encryption": true
    }
  },
  "aiService": {
    "openai": {
      "enabled": true,
      "baseURL": "https://api.openai.com/v1",
      "models": {
        "chat": "gpt-4-turbo-preview",
        "embedding": "text-embedding-ada-002",
        "fineTune": ""
      },
      "parameters": {
        "temperature": 0.7,
        "maxTokens": 2000,
        "topP": 1.0,
        "frequencyPenalty": 0.0,
        "presencePenalty": 0.0
      }
    },
    "cache": {
      "enabled": true,
      "ttl": 86400,
      "maxSize": 1000
    },
    "rateLimit": {
      "enabled": true,
      "requestsPerMinute": 60,
      "retryAttempts": 3,
      "backoffMultiplier": 2
    }
  },
  "build": {
    "vite": {
      "port": 5173,
      "host": "localhost",
      "open": true
    },
    "tauri": {
      "bundleId": "com.yyc3.ai-code",
      "productName": "YYC³ AI Code",
      "version": "1.0.0",
      "updaterUrl": "https://updates.yyc3.ai",
      "iconPath": "./icons/icon.png"
    },
    "cicd": {
      "platform": "github",
      "enabled": true,
      "buildOnPush": true,
      "buildOnPR": true,
      "publishReleases": true
    }
  },
  "testing": {
    "unit": {
      "framework": "Vitest",
      "coverageThreshold": 80
    },
    "integration": {
      "framework": "React Testing Library",
      "timeout": 5000
    },
    "e2e": {
      "framework": "Playwright",
      "browsers": ["Chrome", "Firefox", "Safari", "Edge"],
      "headless": true
    },
    "quality": {
      "linter": "ESLint",
      "formatter": "Prettier",
      "strictMode": true
    }
  },
  "documentation": {
    "components": {
      "tool": "Storybook",
      "enabled": true
    },
    "api": {
      "tool": "TypeDoc",
      "enabled": true
    },
    "user": {
      "tool": "Docusaurus",
      "enabled": true
    }
  }
}
```

---

## ✅ 配置验证

### 验证规则

1. **必填字段检查**：所有标记为必填的字段必须有值
2. **格式验证**：验证 URL、邮箱、版本号等格式
3. **范围验证**：验证数值是否在有效范围内
4. **依赖验证**：验证配置项之间的依赖关系
5. **一致性验证**：验证相关配置项的一致性

### 验证结果

- ✅ **通过**：配置完整且正确，可以生成 Prompt
- ⚠️ **警告**：配置存在潜在问题，建议修正
- ❌ **错误**：配置存在严重问题，必须修正

---

## 🚀 Prompt 生成

### 生成流程

1. **配置验证**：自动验证配置的完整性和正确性
2. **占位符替换**：将配置值替换到 Prompt 模板中
3. **格式化输出**：格式化生成的 Prompt，便于阅读
4. **复制到剪贴板**：一键复制生成的 Prompt

### 生成结果

生成的 Prompt 包含：
- 完整的项目配置信息
- 详细的技术栈规范
- 完整的设计系统定义
- 图标系统规范
- 数据库配置
- AI 服务配置
- 构建部署配置
- 测试配置
- 文档配置

---

## 📚 使用指南

### 1. 首次使用

1. 打开配置管理工具
2. 选择 "YYC³ 默认模板"
3. 根据项目需求调整配置
4. 验证配置完整性
5. 生成完整 Prompt

### 2. 配置管理

1. 定期保存配置到本地
2. 导出配置文件备份
3. 在不同项目间共享配置
4. 根据项目演进更新配置

### 3. 最佳实践

1. **从模板开始**：使用预设模板快速初始化
2. **逐步调整**：根据实际需求逐步调整配置
3. **定期验证**：定期验证配置的完整性
4. **版本管理**：为不同项目版本保存不同配置
5. **团队协作**：通过配置文件实现团队协作

---

## 🎯 高级功能

### 1. 配置对比

支持对比两个配置文件，显示差异和变更。

### 2. 配置合并

支持合并多个配置文件，解决冲突。

### 3. 配置历史

自动保存配置历史，支持回滚到之前的版本。

### 4. 配置分享

生成配置分享链接，方便团队成员共享配置。

---

## 📞 技术支持

- **文档地址**：https://docs.yyc3.ai/config-tool
- **问题反馈**：https://github.com/YYC-Cube/yyc3-ai-code/issues
- **联系邮箱**：admin@0379.email

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-13
**维护团队**: YanYuCloudCube Team

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
| 创建日期 | 2026-03-13 |
| 更新日期 | 2026-04-08 |
| 内容校验 | c41f465a73a311ac |
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
