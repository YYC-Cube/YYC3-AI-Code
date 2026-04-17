---
file: YYC3-前端一体化-配置变量示例.md
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

# YYC³ 前端一体化应用配置变量示例

## 📋 使用说明

本文档提供了 YYC³ 前端一体化应用完整提示词系统中所有占位符的示例值，可直接用于配置管理工具或手动替换占位符。

### 使用方式

1. **直接使用**：将本文档中的示例值直接复制到配置管理工具
2. **自定义修改**：根据实际需求修改示例值
3. **批量替换**：使用文本编辑器的批量替换功能将占位符替换为示例值

---

## 🎯 项目信息配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{PROJECT_NAME}` | `yyc3-ai-code` | 项目名称（kebab-case） |
| `{PROJECT_DISPLAY_NAME}` | `YYC³ AI Code` | 项目显示名称 |
| `{PROJECT_DESCRIPTION}` | `YYC³ AI Code - 前端一体化智能代码生成平台，基于 Tauri + React + TypeScript 构建` | 项目描述 |
| `{PROJECT_VERSION}` | `1.0.0` | 项目版本号（SemVer） |
| `{PROJECT_LICENSE}` | `MIT` | 许可证类型 |
| `{PROJECT_REPOSITORY}` | `https://github.com/YYC-Cube/yyc3-ai-code` | 代码仓库地址 |
| `{PROJECT_HOMEPAGE}` | `https://yyc3.ai` | 项目主页地址 |
| `{DEFAULT_WORKSPACE}` | `~/Documents/YYC3-AI-Code` | 默认工作区路径 |

---

## 👥 团队信息配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{TEAM_NAME}` | `YanYuCloudCube Team` | 团队名称 |
| `{TEAM_EMAIL}` | `admin@0379.email` | 联系邮箱 |
| `{TEAM_WEBSITE}` | `https://yyc3.ai` | 团队网站 |
| `{TEAM_SLOGAN_CN}` | `言启象限 | 语枢未来` | 中文标语 |
| `{TEAM_SLOGAN_EN}` | `Words Initiate Quadrants, Language Serves as Core for Future` | 英文标语 |
| `{TEAM_MOTTO_CN}` | `万象归元于云枢 | 深栈智启新纪元` | 中文座右铭 |
| `{TEAM_MOTTO_EN}` | `All things converge in cloud pivot; Deep stacks ignite a new era of intelligence` | 英文座右铭 |

---

## 🔧 技术栈配置

### 前端框架

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{FRAMEWORK_NAME}` | `React` | 前端框架名称 |
| `{FRAMEWORK_VERSION}` | `18.3.1` | 前端框架版本 |
| `{FRAMEWORK_TYPE}` | `react` | 框架类型 |

### 构建工具

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{BUILD_TOOL_NAME}` | `Vite` | 构建工具名称 |
| `{BUILD_TOOL_VERSION}` | `5.4.11` | 构建工具版本 |

### 类型系统

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{TYPESCRIPT_ENABLED}` | `true` | 是否启用 TypeScript |
| `{TYPESCRIPT_VERSION}` | `5.6.3` | TypeScript 版本 |
| `{TYPESCRIPT_STRICT}` | `true` | 是否启用严格模式 |

### 状态管理

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{STATE_MANAGEMENT_LIBRARY}` | `Zustand` | 状态管理库 |
| `{STATE_MANAGEMENT_VERSION}` | `5.0.2` | 状态管理库版本 |

### UI 组件库

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{UI_LIBRARY_NAME}` | `Radix UI` | UI 组件库名称 |
| `{UI_LIBRARY_VERSION}` | `1.1.1` | UI 组件库版本 |

### 原生桥接

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{NATIVE_BRIDGE_TYPE}` | `tauri` | 原生桥接类型 |
| `{NATIVE_BRIDGE_VERSION}` | `2.2.6` | 原生桥接版本 |

### 本地存储

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{INDEXEDDB_LIBRARY}` | `Dexie.js` | IndexedDB ORM 库 |
| `{INDEXEDDB_VERSION}` | `4.0.10` | IndexedDB ORM 库版本 |
| `{FILESYSTEM_ENABLED}` | `true` | 是否启用文件系统 API |

### 图标库

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{ICON_LIBRARY_NAME}` | `lucide-react` | 图标库名称 |
| `{ICON_LIBRARY_VERSION}` | `0.468.0` | 图标库版本 |

### AI SDK

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{AI_PROVIDER}` | `openai` | AI 服务商 |
| `{AI_SDK_VERSION}` | `4.73.0` | AI SDK 版本 |

### 工作线程

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{WORKER_LIBRARY}` | `comlink` | Worker 通信库 |
| `{WORKER_VERSION}` | `4.4.1` | Worker 通信库版本 |

---

## 🎨 设计系统配置

### 颜色系统

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{COLOR_PRIMARY}` | `#3B82F6` | 主色调（蓝色） |
| `{COLOR_SECONDARY}` | `#8B5CF6` | 辅色调（紫色） |
| `{COLOR_BACKGROUND}` | `#FFFFFF` | 背景色（白色） |
| `{COLOR_SURFACE}` | `#F9FAFB` | 表面色（浅灰） |
| `{COLOR_TEXT_PRIMARY}` | `#111827` | 主文字色（深灰） |
| `{COLOR_TEXT_SECONDARY}` | `#6B7280` | 次要文字色（中灰） |
| `{COLOR_TEXT_DISABLED}` | `#9CA3AF` | 禁用文字色（浅灰） |
| `{COLOR_BORDER}` | `#E5E7EB` | 边框色（浅灰） |
| `{COLOR_DIVIDER}` | `#F3F4F6` | 分割线色（极浅灰） |
| `{COLOR_SUCCESS}` | `#10B981` | 成功色（绿色） |
| `{COLOR_WARNING}` | `#F59E0B` | 警告色（橙色） |
| `{COLOR_ERROR}` | `#EF4444` | 错误色（红色） |
| `{COLOR_INFO}` | `#3B82F6` | 信息色（蓝色） |

### 字体系统

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{FONT_FAMILY_PRIMARY}` | `PingFang SC, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` | 主字体族 |
| `{FONT_FAMILY_SECONDARY}` | `'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif` | 次要字体族 |
| `{FONT_FAMILY_MONO}` | `'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace` | 等宽字体族 |
| `{FONT_SIZE_H1}` | `36px` | 标题1字号 |
| `{FONT_SIZE_H2}` | `30px` | 标题2字号 |
| `{FONT_SIZE_H3}` | `24px` | 标题3字号 |
| `{FONT_SIZE_H4}` | `20px` | 标题4字号 |
| `{FONT_SIZE_H5}` | `18px` | 标题5字号 |
| `{FONT_SIZE_H6}` | `16px` | 标题6字号 |
| `{FONT_SIZE_BODY_LARGE}` | `16px` | 大正文字号 |
| `{FONT_SIZE_BODY_MEDIUM}` | `14px` | 中正文字号 |
| `{FONT_SIZE_BODY_SMALL}` | `12px` | 小正文字号 |
| `{FONT_SIZE_CAPTION}` | `10px` | 说明文字号 |

### 间距系统

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{SPACING_XS}` | `4px` | 超小间距 |
| `{SPACING_SM}` | `8px` | 小间距 |
| `{SPACING_MD}` | `12px` | 中间距 |
| `{SPACING_LG}` | `16px` | 大间距 |
| `{SPACING_XL}` | `24px` | 超大间距 |

### 圆角系统

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{BORDER_RADIUS_SM}` | `4px` | 小圆角 |
| `{BORDER_RADIUS_MD}` | `8px` | 中圆角 |
| `{BORDER_RADIUS_LG}` | `12px` | 大圆角 |
| `{BORDER_RADIUS_XL}` | `16px` | 超大圆角 |
| `{BORDER_RADIUS_FULL}` | `9999px` | 完全圆角 |

### 阴影系统

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{SHADOW_SM}` | `0 1px 2px rgba(0, 0, 0, 0.05)` | 小阴影 |
| `{SHADOW_MD}` | `0 4px 6px rgba(0, 0, 0, 0.07)` | 中阴影 |
| `{SHADOW_LG}` | `0 10px 15px rgba(0, 0, 0, 0.1)` | 大阴影 |
| `{SHADOW_XL}` | `0 20px 25px rgba(0, 0, 0, 0.15)` | 超大阴影 |

### 动画系统

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{ANIMATION_DURATION_FAST}` | `150ms` | 快速动画时长 |
| `{ANIMATION_DURATION_NORMAL}` | `300ms` | 正常动画时长 |
| `{ANIMATION_DURATION_SLOW}` | `500ms` | 慢速动画时长 |
| `{ANIMATION_EASING_EASE_IN}` | `cubic-bezier(0.4, 0, 1, 1)` | 缓入动画 |
| `{ANIMATION_EASING_EASE_OUT}` | `cubic-bezier(0, 0, 0.2, 1)` | 缓出动画 |
| `{ANIMATION_EASING_EASE_IN_OUT}` | `cubic-bezier(0.4, 0, 0.2, 1)` | 缓入缓出动画 |

---

## 🎯 图标系统配置

### 图标库配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{ICON_LIBRARY_NAME}` | `lucide-react` | 图标库名称 |
| `{ICON_LIBRARY_VERSION}` | `0.468.0` | 图标库版本 |
| `{ICON_LIBRARY_TYPE}` | `lucide` | 图标库类型 |

### 图标分类配置

#### 导航图标

```json
{
  "home": {
    "name": "Home",
    "lucideName": "Home",
    "displayNameCN": "首页",
    "displayNameEN": "Home"
  },
  "back": {
    "name": "Back",
    "lucideName": "ChevronLeft",
    "displayNameCN": "返回",
    "displayNameEN": "Back"
  }
}
```

#### 功能图标

```json
{
  "file": {
    "name": "File",
    "lucideName": "File",
    "displayNameCN": "文件",
    "displayNameEN": "File",
    "shortcut": "Ctrl+O"
  },
  "notification": {
    "name": "Notification",
    "lucideName": "Bell",
    "displayNameCN": "通知",
    "displayNameEN": "Notification",
    "shortcut": "Ctrl+Shift+N"
  },
  "settings": {
    "name": "Settings",
    "lucideName": "Settings",
    "displayNameCN": "设置",
    "displayNameEN": "Settings",
    "shortcut": "Ctrl+,"
  },
  "github": {
    "name": "GitHub",
    "lucideName": "Github",
    "displayNameCN": "GitHub",
    "displayNameEN": "GitHub",
    "shortcut": "Ctrl+Shift+G"
  },
  "export": {
    "name": "Export",
    "lucideName": "Share",
    "displayNameCN": "导出",
    "displayNameEN": "Export",
    "shortcut": "Ctrl+Shift+S"
  },
  "deploy": {
    "name": "Deploy",
    "lucideName": "Rocket",
    "displayNameCN": "发布",
    "displayNameEN": "Deploy",
    "shortcut": "Ctrl+Shift+D"
  },
  "quickAction": {
    "name": "QuickAction",
    "lucideName": "Zap",
    "displayNameCN": "快速操作",
    "displayNameEN": "Quick Action",
    "shortcut": "Ctrl+Shift+Q"
  },
  "language": {
    "name": "Language",
    "lucideName": "Globe",
    "displayNameCN": "语言",
    "displayNameEN": "Language",
    "shortcut": "Ctrl+Shift+L"
  },
  "user": {
    "name": "User",
    "lucideName": "User",
    "displayNameCN": "用户",
    "displayNameEN": "User"
  }
}
```

#### 视图切换图标

```json
{
  "preview": {
    "name": "Preview",
    "lucideName": "Eye",
    "displayNameCN": "预览",
    "displayNameEN": "Preview",
    "shortcut": "Esc"
  },
  "code": {
    "name": "Code",
    "lucideName": "Code",
    "displayNameCN": "代码",
    "displayNameEN": "Code",
    "shortcut": "Ctrl+1"
  },
  "separator": {
    "name": "Separator",
    "lucideName": "SeparatorVertical",
    "displayNameCN": "分隔线",
    "displayNameEN": "Separator"
  },
  "search": {
    "name": "Search",
    "lucideName": "Search",
    "displayNameCN": "搜索",
    "displayNameEN": "Search",
    "shortcut": "Ctrl+Shift+F"
  },
  "more": {
    "name": "More",
    "lucideName": "MoreHorizontal",
    "displayNameCN": "更多",
    "displayNameEN": "More",
    "shortcut": "Ctrl+Shift+M"
  }
}
```

#### AI 功能图标

```json
{
  "aiModel": {
    "name": "AIModel",
    "lucideName": "Bot",
    "displayNameCN": "AI模型",
    "displayNameEN": "AI Model"
  },
  "aiChat": {
    "name": "AIChat",
    "lucideName": "MessageSquare",
    "displayNameCN": "AI对话",
    "displayNameEN": "AI Chat"
  },
  "aiSettings": {
    "name": "AISettings",
    "lucideName": "Settings",
    "displayNameCN": "AI设置",
    "displayNameEN": "AI Settings"
  },
  "aiConfig": {
    "name": "AIConfig",
    "lucideName": "Settings",
    "displayNameCN": "AI配置",
    "displayNameEN": "AI Config"
  }
}
```

#### 终端图标

```json
{
  "terminal": {
    "name": "Terminal",
    "lucideName": "Terminal",
    "displayNameCN": "终端",
    "displayNameEN": "Terminal"
  },
  "tab": {
    "name": "Tab",
    "lucideName": "PanelLeft",
    "displayNameCN": "标签页",
    "displayNameEN": "Tab"
  }
}
```

#### 用户图标

```json
{
  "userAvatar": {
    "name": "UserAvatar",
    "lucideName": "User",
    "displayNameCN": "用户头像",
    "displayNameEN": "User Avatar"
  },
  "userName": {
    "name": "UserName",
    "lucideName": "FileText",
    "displayNameCN": "用户名称",
    "displayNameEN": "User Name"
  },
  "onlineStatus": {
    "name": "OnlineStatus",
    "lucideName": "Circle",
    "displayNameCN": "在线状态",
    "displayNameEN": "Online Status"
  },
  "preferences": {
    "name": "Preferences",
    "lucideName": "Settings",
    "displayNameCN": "偏好设置",
    "displayNameEN": "Preferences"
  }
}
```

#### 操作图标

```json
{
  "add": {
    "name": "Add",
    "lucideName": "Plus",
    "displayNameCN": "添加",
    "displayNameEN": "Add"
  },
  "imageUpload": {
    "name": "ImageUpload",
    "lucideName": "Upload",
    "displayNameCN": "图片上传",
    "displayNameEN": "Image Upload"
  },
  "fileImport": {
    "name": "FileImport",
    "lucideName": "FileDown",
    "displayNameCN": "文件导入",
    "displayNameEN": "File Import"
  },
  "gitHubLink": {
    "name": "GitHubLink",
    "lucideName": "Link",
    "displayNameCN": "GitHub链接",
    "displayNameEN": "GitHub Link"
  },
  "figmaFile": {
    "name": "FigmaFile",
    "lucideName": "PenTool",
    "displayNameCN": "Figma文件",
    "displayNameEN": "Figma File"
  },
  "codeSnippet": {
    "name": "CodeSnippet",
    "lucideName": "Code",
    "displayNameCN": "代码片段",
    "displayNameEN": "Code Snippet"
  },
  "clipboard": {
    "name": "Clipboard",
    "lucideName": "Clipboard",
    "displayNameCN": "剪贴板",
    "displayNameEN": "Clipboard"
  }
}
```

### 图标交互规范

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{ICON_DEFAULT_SHOW_TEXT}` | `false` | 默认是否显示文字 |
| `{ICON_DEFAULT_COLOR}` | `#6B7280` | 默认颜色 |
| `{ICON_HOVER_SHOW_TEXT}` | `true` | 悬停是否显示文字 |
| `{ICON_HOVER_COLOR}` | `#3B82F6` | 悬停颜色 |
| `{ICON_HOVER_SHOW_TOOLTIP}` | `true` | 是否显示提示 |
| `{ICON_ACTIVE_COLOR}` | `#2563EB` | 激活颜色 |
| `{ICON_DISABLED_OPACITY}` | `0.4` | 禁用透明度 |

### 图标尺寸

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{ICON_SIZE_XS}` | `16` | 超小图标尺寸 |
| `{ICON_SIZE_SM}` | `20` | 小图标尺寸 |
| `{ICON_SIZE_MD}` | `24` | 中图标尺寸 |
| `{ICON_SIZE_LG}` | `32` | 大图标尺寸 |
| `{ICON_SIZE_XL}` | `48` | 超大图标尺寸 |

---

## 🗄️ 数据库配置

### 支持的数据库类型

```json
[
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
    "defaultPort": null,
    "configFiles": []
  }
]
```

### 连接池配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{DB_POOL_MIN}` | `1` | 最小连接数 |
| `{DB_POOL_MAX}` | `10` | 最大连接数 |
| `{DB_POOL_IDLE_TIMEOUT}` | `300` | 空闲超时（秒） |

### 查询配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{DB_QUERY_TIMEOUT}` | `30000` | 查询超时（毫秒） |
| `{DB_QUERY_PAGE_SIZE}` | `50` | 分页大小 |
| `{DB_QUERY_MAX_RESULT_SIZE}` | `10000` | 最大结果集大小 |

### 备份配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{DB_BACKUP_ENABLED}` | `true` | 是否启用备份 |
| `{DB_BACKUP_SCHEDULE}` | `0 2 * * *` | 备份计划（cron 表达式） |
| `{DB_BACKUP_RETENTION_DAYS}` | `30` | 保留天数 |
| `{DB_BACKUP_ENCRYPTION}` | `true` | 是否加密 |

---

## 🤖 AI 服务配置

### AI 服务商配置

```json
{
  "providers": [
    {
      "id": "openai",
      "name": "openai",
      "displayName": "OpenAI",
      "type": "cloud",
      "baseURL": "https://api.openai.com/v1",
      "apiKey": "",
      "apiKeyURL": "https://platform.openai.com/api-keys",
      "region": null,
      "models": [
        {
          "id": "gpt-4-turbo-preview",
          "name": "gpt-4-turbo-preview",
          "displayName": "GPT-4 Turbo",
          "type": "chat",
          "contextLength": 128000,
          "maxTokens": 4096,
          "enabled": true,
          "parameters": {
            "temperature": 0.7,
            "topP": 1.0,
            "frequencyPenalty": 0.0,
            "presencePenalty": 0.0
          },
          "capabilities": ["chat", "code", "reasoning"],
          "benchmark": {
            "latency": 1500,
            "throughput": 50,
            "accuracy": 0.95
          }
        },
        {
          "id": "gpt-3.5-turbo",
          "name": "gpt-3.5-turbo",
          "displayName": "GPT-3.5 Turbo",
          "type": "chat",
          "contextLength": 16385,
          "maxTokens": 4096,
          "enabled": true,
          "parameters": {
            "temperature": 0.7,
            "topP": 1.0,
            "frequencyPenalty": 0.0,
            "presencePenalty": 0.0
          },
          "capabilities": ["chat", "code"],
          "benchmark": {
            "latency": 800,
            "throughput": 100,
            "accuracy": 0.90
          }
        }
      ],
      "enabled": true,
      "priority": 1,
      "rateLimit": {
        "requestsPerMinute": 3500,
        "tokensPerMinute": 90000
      },
      "pricing": {
        "inputPrice": 0.01,
        "outputPrice": 0.03,
        "currency": "USD"
      }
    },
    {
      "id": "zhipuai",
      "name": "zhipuai",
      "displayName": "智谱 AI",
      "type": "cloud",
      "baseURL": "https://open.bigmodel.cn/api/paas/v4",
      "apiKey": "",
      "apiKeyURL": "https://open.bigmodel.cn/usercenter/apikeys",
      "region": "cn",
      "models": [
        {
          "id": "glm-4",
          "name": "glm-4",
          "displayName": "GLM-4",
          "type": "chat",
          "contextLength": 128000,
          "maxTokens": 8192,
          "enabled": true,
          "parameters": {
            "temperature": 0.7,
            "topP": 0.9,
            "frequencyPenalty": 0.0,
            "presencePenalty": 0.0
          },
          "capabilities": ["chat", "code", "reasoning"],
          "benchmark": {
            "latency": 1000,
            "throughput": 70,
            "accuracy": 0.92
          }
        }
      ],
      "enabled": true,
      "priority": 3,
      "rateLimit": {
        "requestsPerMinute": 100,
        "tokensPerMinute": 50000
      },
      "pricing": {
        "inputPrice": 0.0001,
        "outputPrice": 0.0001,
        "currency": "CNY"
      }
    },
    {
      "id": "ollama",
      "name": "ollama",
      "displayName": "Ollama (本地)",
      "type": "local",
      "baseURL": "http://localhost:11434",
      "apiKey": "ollama",
      "models": [
        {
          "id": "llama2",
          "name": "llama2",
          "displayName": "Llama 2",
          "type": "chat",
          "contextLength": 4096,
          "maxTokens": 2048,
          "enabled": true,
          "parameters": {
            "temperature": 0.7,
            "topP": 0.9,
            "frequencyPenalty": 0.0,
            "presencePenalty": 0.0
          },
          "capabilities": ["chat", "code"],
          "benchmark": {
            "latency": 3000,
            "throughput": 20,
            "accuracy": 0.85
          }
        }
      ],
      "enabled": true,
      "priority": 10,
      "pricing": {
        "inputPrice": 0,
        "outputPrice": 0,
        "currency": "USD"
      }
    }
  ]
}
```

### AI 服务配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{AI_ACTIVE_PROVIDER}` | `openai` | 当前激活的服务商 |
| `{AI_ACTIVE_MODEL}` | `gpt-4-turbo-preview` | 当前激活的模型 |
| `{AI_TEMPERATURE}` | `0.7` | 温度参数 |
| `{AI_MAX_TOKENS}` | `2000` | 最大令牌数 |
| `{AI_TOP_P}` | `1.0` | Top-P 参数 |
| `{AI_FREQUENCY_PENALTY}` | `0.0` | 频率惩罚 |
| `{AI_PRESENCE_PENALTY}` | `0.0` | 存在惩罚 |

### AI 缓存配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{AI_CACHE_ENABLED}` | `true` | 是否启用缓存 |
| `{AI_CACHE_TTL}` | `86400` | 缓存时间（秒） |
| `{AI_CACHE_MAX_SIZE}` | `1000` | 最大缓存条目数 |

### AI 速率限制配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{AI_RATE_LIMIT_ENABLED}` | `true` | 是否启用速率限制 |
| `{AI_RATE_LIMIT_REQUESTS_PER_MINUTE}` | `60` | 每分钟请求数 |
| `{AI_RATE_LIMIT_RETRY_ATTEMPTS}` | `3` | 重试次数 |
| `{AI_RATE_LIMIT_BACKOFF_MULTIPLIER}` | `2` | 退避倍数 |

### AI 智能检测配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{AI_DETECTION_ENABLED}` | `true` | 是否启用智能检测 |
| `{AI_DETECTION_AUTO_SELECT_BEST}` | `true` | 是否自动选择最佳 |
| `{AI_DETECTION_PERFORMANCE_MONITORING}` | `true` | 是否启用性能监控 |
| `{AI_DETECTION_ERROR_ANALYSIS}` | `true` | 是否启用错误分析 |

---

## 🚀 构建部署配置

### Vite 配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{VITE_PORT}` | `5173` | 开发服务器端口 |
| `{VITE_HOST}` | `localhost` | 开发服务器主机 |
| `{VITE_OPEN}` | `true` | 是否自动打开浏览器 |

### Tauri 配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{TAURI_BUNDLE_ID}` | `com.yyc3.ai-code` | Bundle ID |
| `{TAURI_PRODUCT_NAME}` | `YYC³ AI Code` | 产品名称 |
| `{TAURI_VERSION}` | `1.0.0` | 版本号 |
| `{TAURI_UPDATER_URL}` | `https://updates.yyc3.ai` | 更新 URL |
| `{TAURI_ICON_PATH}` | `./icons/icon.png` | 图标路径 |

### CI/CD 配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{CICD_PLATFORM}` | `github` | CI/CD 平台 |
| `{CICD_ENABLED}` | `true` | 是否启用 CI/CD |
| `{CICD_BUILD_ON_PUSH}` | `true` | 推送时构建 |
| `{CICD_BUILD_ON_PR}` | `true` | PR 时构建 |
| `{CICD_PUBLISH_RELEASES}` | `true` | 发布版本 |

---

## 🧪 测试配置

### 单元测试配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{UNIT_TEST_FRAMEWORK}` | `Vitest` | 测试框架 |
| `{UNIT_TEST_COVERAGE_THRESHOLD}` | `80` | 覆盖率阈值（%） |

### 集成测试配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{INTEGRATION_TEST_FRAMEWORK}` | `Vitest` | 测试框架 |
| `{INTEGRATION_TEST_TIMEOUT}` | `10000` | 超时时间（毫秒） |

### E2E 测试配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{E2E_TEST_FRAMEWORK}` | `Playwright` | 测试框架 |
| `{E2E_TEST_BROWSERS}` | `["chromium", "firefox", "webkit"]` | 浏览器列表 |
| `{E2E_TEST_HEADLESS}` | `true` | 无头模式 |

### 代码质量配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{CODE_QUALITY_LINTER}` | `ESLint` | 代码检查工具 |
| `{CODE_QUALITY_FORMATTER}` | `Prettier` | 代码格式化工具 |
| `{CODE_QUALITY_STRICT_MODE}` | `true` | 严格模式 |

---

## 📚 文档配置

### 组件文档配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{DOC_COMPONENTS_TOOL}` | `Storybook` | 文档工具 |
| `{DOC_COMPONENTS_ENABLED}` | `true` | 是否启用 |

### API 文档配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{DOC_API_TOOL}` | `TypeDoc` | 文档工具 |
| `{DOC_API_ENABLED}` | `true` | 是否启用 |

### 用户文档配置

| 占位符 | 示例值 | 说明 |
|---------|--------|------|
| `{DOC_USER_TOOL}` | `VitePress` | 文档工具 |
| `{DOC_USER_ENABLED}` | `true` | 是否启用 |

---

## 📊 配置汇总

### 配置分类统计

| 分类 | 配置项数量 | 说明 |
|------|-----------|------|
| 项目信息 | 8 | 项目基础信息配置 |
| 团队信息 | 7 | 团队基础信息配置 |
| 技术栈 | 18 | 技术栈相关配置 |
| 设计系统 | 40 | 设计系统相关配置 |
| 图标系统 | 30 | 图标系统相关配置 |
| 数据库配置 | 10 | 数据库相关配置 |
| AI 服务配置 | 15 | AI 服务相关配置 |
| 构建部署配置 | 11 | 构建部署相关配置 |
| 测试配置 | 8 | 测试相关配置 |
| 文档配置 | 6 | 文档相关配置 |
| **总计** | **153** | 所有配置项 |

### 配置优先级

| 优先级 | 配置项 | 说明 |
|--------|--------|------|
| 🔴 必填 | PROJECT_NAME, PROJECT_DISPLAY_NAME, PROJECT_VERSION, TEAM_NAME, TEAM_EMAIL | 项目和团队基础信息 |
| 🟡 推荐 | FRAMEWORK_NAME, BUILD_TOOL_NAME, TYPESCRIPT_ENABLED, ICON_LIBRARY_NAME | 核心技术栈 |
| 🟢 可选 | COLOR_PRIMARY, FONT_FAMILY_PRIMARY, SPACING_MD | 设计系统 |
| 🟢 可选 | AI_PROVIDER, AI_ACTIVE_MODEL | AI 服务 |

---

## 🎯 使用示例

### 示例 1：快速开始

```bash
# 1. 复制本文档中的配置值到配置管理工具
# 2. 点击"生成 Prompt"按钮
# 3. 将生成的 Prompt 复制到 LLM
# 4. 等待生成代码
# 5. 运行 pnpm install && pnpm tauri dev
```

### 示例 2：自定义配置

```javascript
// 修改项目名称
const config = {
  PROJECT_NAME: 'my-awesome-app',
  PROJECT_DISPLAY_NAME: 'My Awesome App',
  // ... 其他配置
};
```

### 示例 3：批量替换

```bash
# 使用 sed 批量替换占位符
sed -i 's/{PROJECT_NAME}/my-app/g' prompt.md
sed -i 's/{PROJECT_DISPLAY_NAME}/My App/g' prompt.md
```

---

## 📝 注意事项

1. **版本兼容性**：确保所有依赖版本之间的兼容性
2. **安全性**：API 密钥等敏感信息应使用加密存储
3. **性能优化**：根据实际需求调整缓存和速率限制配置
4. **本地化**：根据目标市场调整语言和区域设置
5. **可访问性**：确保颜色对比度符合 WCAG 2.1 标准

---

## 🔗 相关文档

- [YYC³ 前端一体化-完整提示词系统](./YYC3-前端一体化-完整提示词系统.md)
- [YYC³ 前端一体化-配置管理工具](./YYC3-前端一体化-配置管理工具.md)
- [YYC³ 团队规范-代码标头](../YYC3-团队规范-代码标头.md)
- [YYC³ 团队规范-文档格式](../YYC3-团队规范-文档格式.md)

---

<div align="center">

> **「YanYuCloudCube」**
> **「<admin@0379.email>」**
> **「言启象限 | 语枢未来」**
> **「Words Initiate Quadrants, Language Serves as Core for Future」**
> **「万象归元于云枢 | 深栈智启新纪元」**
> **「All things converge in cloud pivot; Deep stacks ignite a new era of intelligence」**

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-13 |
| 更新日期 | 2026-04-08 |
| 内容校验 | c7a349d7c37f0721 |
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
