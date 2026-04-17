---
file: YYC3-前端一体化-完整提示词系统.md
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

# YYC³ 前端一体化应用完整提示词系统

## 📋 使用说明

> **核心特性**：本提示词系统**完全禁用硬编码**，所有配置信息均通过 **UI 可编辑界面** 进行配置，支持动态加载、实时预览、持久化存储。

### 🚀 提示词使用步骤（编号实施）

#### 步骤 1️⃣：配置阶段 - 通过 UI 界面配置项目信息

1.1 **打开配置界面**

- 访问 YYC³ 配置管理工具界面
- 选择"新建配置"或"加载模板"

1.2 **配置项目基础信息**

- 项目名称：`yyc3-ai-code`（kebab-case 格式）
- 显示名称：`YYC³ AI Code`
- 项目描述：详细描述项目功能和目标
- 版本号：遵循 SemVer 规范（如：1.0.0）
- 许可证：选择合适的开源许可证（如：MIT）
- 代码仓库：GitHub 仓库地址
- 项目主页：项目官方网站地址
- 默认工作区：本地工作目录路径

1.3 **配置团队信息**（已预填充 YYC³ 团队信息）

- 团队名称：YanYuCloudCube Team
- 联系邮箱：<admin@0379.email>
- 团队网站：<https://github.com/YYC-Cube/>
- 中文标语：言启象限 | 语枢未来
- 英文标语：Words Initiate Quadrants, Language Serves as Core for Future
- 中文座右铭：万象归元于云枢 | 深栈智启新纪元
- 英文座右铭：All things converge in cloud pivot; Deep stacks ignite a new era of intelligence

1.4 **配置技术栈**

- 前端框架：React 18.2.0
- 构建工具：Vite 5.0.0
- 类型系统：TypeScript 5.3.0（启用严格模式）
- 状态管理：Zustand 4.4.0
- UI 组件库：Radix UI 1.0.0
- 原生桥接：Tauri 1.5.0
- 本地存储：Dexie 3.2.0（IndexedDB ORM）
- 图标库：Lucide React 0.312.0
- AI SDK：OpenAI SDK 4.20.0
- 工作线程：Comlink 4.4.0

1.5 **配置设计系统**

- 颜色系统：主色调、辅助色、背景色等
- 字体系统：字体族、字号、字重、行高
- 间距系统：xs、sm、md、lg、xl
- 圆角系统：sm、md、lg、xl、full
- 阴影系统：sm、md、lg、xl
- 动画系统：时长、缓动函数

1.6 **配置图标系统**

- 图标库：Lucide React
- 图标分类：导航、功能、视图切换、AI 功能、终端、用户、操作
- 交互规范：默认、悬停、激活、禁用状态
- 图标尺寸：xs、sm、md、lg、xl

1.7 **配置数据库**

- 支持的数据库类型：PostgreSQL、MySQL、Redis、SQLite
- 连接池配置：最小/最大连接数、空闲超时
- 查询配置：超时时间、分页大小、最大结果集
- 备份配置：启用状态、备份计划、保留天数、加密

1.8 **配置 AI 服务**

- 服务商配置：OpenAI、Anthropic、智谱AI、百度文心、阿里通义、Ollama（本地）
- 当前选中的服务商和模型
- 缓存配置：启用状态、TTL、最大缓存条目数
- 速率限制：启用状态、每分钟请求数、重试次数、退避倍数
- 智能检测：启用状态、自动选择最佳、性能监控、错误分析

1.9 **配置构建部署**

- Vite 配置：端口、主机、自动打开浏览器
- Tauri 配置：Bundle ID、产品名称、版本、更新 URL、图标路径
- CI/CD 配置：平台、启用状态、构建触发、发布版本

1.10 **配置测试**

- 单元测试：框架、覆盖率阈值
- 集成测试：框架、超时时间
- E2E 测试：框架、浏览器列表、无头模式
- 代码质量：Linter、Formatter、严格模式

1.11 **配置文档**

- 组件文档：工具、启用状态
- API 文档：工具、启用状态
- 用户文档：工具、启用状态

1.12 **保存配置**

- 点击"保存配置"按钮
- 配置自动保存到浏览器本地存储（localStorage）
- 可选择导出为 JSON 文件备份

#### 步骤 2️⃣：生成阶段 - 生成完整 Prompt

2.1 **验证配置完整性**

- 系统自动验证所有必填字段
- 检查配置格式和类型正确性
- 显示验证结果和错误提示

2.2 **生成完整 Prompt**

- 点击"生成 Prompt"按钮
- 系统根据配置生成完整的提示词文本
- 实时预览生成的 Prompt 内容

2.3 **复制 Prompt**

- 点击"复制到剪贴板"按钮
- 或手动选择并复制 Prompt 内容
- Prompt 包含所有配置信息和技术规范

#### 步骤 3️⃣：开发阶段 - 提交给 LLM 生成项目

3.1 **打开 LLM 平台**

- 选择支持长文本的 LLM 平台（如：GPT-4、Claude 3、Gemini Pro）
- 创建新的对话或会话

3.2 **粘贴 Prompt**

- 将复制的 Prompt 粘贴到 LLM 的 **system** 或 **user** 输入框
- 确保完整粘贴，不要截断

3.3 **提交并等待生成**

- 点击"提交"或"发送"按钮
- 等待 LLM 生成完整的 Monorepo 项目代码
- 生成时间取决于 LLM 平台和 Prompt 复杂度

3.4 **接收生成的代码**

- LLM 会生成完整的项目结构
- 包括所有源代码文件、配置文件、文档
- 保存生成的代码到本地

#### 步骤 4️⃣：启动阶段 - 运行生成的项目

4.1 **解压/保存项目文件**

- 将生成的代码保存到本地目录
- 确保目录结构完整

4.2 **安装依赖**

   ```bash
   cd {PROJECT_NAME}
   pnpm install
   ```

4.3 **启动开发服务器**

   ```bash
   pnpm tauri dev
   ```

4.4 **验证项目运行**

- 检查应用是否正常启动
- 验证所有功能是否正常工作
- 测试 AI 服务集成

4.5 **构建生产版本**

   ```bash
   pnpm tauri build
   ```

- 生成的安装包位于 `src-tauri/target/release/bundle/` 目录

#### 步骤 5️⃣：优化阶段 - 持续改进

5.1 **收集反馈**

- 测试应用功能
- 记录问题和改进建议

5.2 **调整配置**

- 根据反馈调整配置参数
- 重新生成 Prompt 并优化项目

5.3 **迭代开发**

- 使用新的 Prompt 重新生成项目
- 持续优化和完善

### 配置管理功能

- **配置持久化**：所有配置自动保存到浏览器本地存储（localStorage）
- **配置导入/导出**：支持 JSON 格式的配置导入和导出
- **配置模板**：提供预设配置模板，快速初始化项目
- **配置验证**：实时验证配置的完整性和正确性
- **配置历史**：保存配置历史版本，支持回滚
- **配置共享**：支持配置分享和团队协作

---

## 🎯 五高五标五化五维框架

### 五高（Five Highs）

- **高可用**：多活架构设计，故障自动切换，数据实时同步
- **高性能**：缓存策略、代码分割、懒加载、性能监控
- **高安全**：数据加密、权限控制、审计日志、安全扫描
- **高扩展**：插件化架构、模块化设计、API 网关
- **高智能**：AI 辅助开发、智能提示、自动化测试

### 五标（Five Standards）

- **标准化**：统一编码规范、API 规范、文档规范
- **规范化**：流程规范、部署规范、运维规范
- **自动化**：CI/CD 自动化、测试自动化、部署自动化
- **可视化**：监控可视化、日志可视化、性能可视化
- **智能化**：智能运维、智能监控、智能告警

### 五化（Five Transformations）

- **流程化**：开发流程标准化、测试流程自动化
- **数字化**：数据数字化、流程数字化、管理数字化
- **生态化**：插件生态、组件生态、工具生态
- **工具化**：开发工具化、测试工具化、运维工具化
- **服务化**：微服务化、API 服务化、平台服务化

### 五维（Five Dimensions）

- **时间维**：实时数据、历史数据、预测数据
- **空间维**：本地存储、云端存储、边缘存储
- **属性维**：结构化数据、非结构化数据、半结构化数据
- **事件维**：用户事件、系统事件、业务事件
- **关联维**：数据关联、服务关联、业务关联

---

## 🔧 UI 可编辑配置系统

### 配置架构设计

```typescript
/**
 * YYC³ 前端一体化应用配置系统
 * 所有配置均通过 UI 界面编辑，禁用硬编码
 */

interface YYC3Config {
  // 项目基础信息
  project: ProjectConfig;
  
  // 团队信息
  team: TeamConfig;
  
  // 技术栈配置
  techStack: TechStackConfig;
  
  // 设计系统配置
  designSystem: DesignSystemConfig;
  
  // 图标系统配置
  iconSystem: IconSystemConfig;
  
  // 数据库配置
  database: DatabaseConfig;
  
  // AI 服务配置
  aiService: AIServiceConfig;
  
  // 构建部署配置
  build: BuildConfig;
  
  // 测试配置
  testing: TestingConfig;
  
  // 文档配置
  documentation: DocumentationConfig;
}

// 项目基础配置
interface ProjectConfig {
  name: string;                    // 项目名称
  displayName: string;              // 显示名称
  description: string;               // 项目描述
  version: string;                  // 版本号
  license: string;                  // 许可证
  repository: string;               // 代码仓库
  homepage: string;                 // 项目主页
  defaultWorkspace: string;          // 默认工作区路径
}

// 团队配置
interface TeamConfig {
  name: string;                    // 团队名称
  email: string;                    // 联系邮箱
  website: string;                  // 团队网站
  sloganCN: string;                 // 中文标语
  sloganEN: string;                 // 英文标语
  mottoCN: string;                 // 中文座右铭
  mottoEN: string;                 // 英文座右铭
}

// 技术栈配置
interface TechStackConfig {
  // 前端框架
  framework: {
    name: string;                  // 框架名称
    version: string;               // 框架版本
    type: 'react' | 'vue' | 'svelte';
  };
  
  // 构建工具
  buildTool: {
    name: string;                  // 构建工具名称
    version: string;               // 构建工具版本
  };
  
  // 类型系统
  typeScript: {
    enabled: boolean;             // 是否启用 TypeScript
    version: string;              // TypeScript 版本
    strict: boolean;              // 严格模式
  };
  
  // 状态管理
  stateManagement: {
    library: string;              // 状态管理库
    version: string;              // 版本号
  };
  
  // UI 组件库
  uiLibrary: {
    name: string;                // UI 库名称
    version: string;             // 版本号
  };
  
  // 原生桥接
  nativeBridge: {
    type: 'tauri' | 'electron';  // 桥接类型
    version: string;              // 版本号
  };
  
  // 本地存储
  storage: {
    indexedDB: {
      library: string;            // IndexedDB ORM 库
      version: string;           // 版本号
    };
    fileSystem: {
      enabled: boolean;          // 是否启用文件系统 API
    };
  };
  
  // 图标库
  iconLibrary: {
    name: string;                // 图标库名称
    version: string;             // 版本号
  };
  
  // AI SDK
  aiSDK: {
    provider: string;             // AI 提供商
    version: string;             // SDK 版本
  };
  
  // 工作线程
  worker: {
    library: string;             // Worker 通信库
    version: string;             // 版本号
  };
}

// 设计系统配置
interface DesignSystemConfig {
  // 颜色系统
  colors: {
    primary: string;             // 主色调
    secondary: string;           // 辅色调
    background: string;          // 背景色
    surface: string;            // 表面色
    text: {
      primary: string;          // 主文字色
      secondary: string;        // 次要文字色
      disabled: string;         // 禁用文字色
    };
    border: string;             // 边框色
    divider: string;           // 分割线色
    success: string;            // 成功色
    warning: string;            // 警告色
    error: string;              // 错误色
    info: string;               // 信息色
  };
  
  // 字体系统
  typography: {
    fontFamily: {
      primary: string;          // 主字体族
      secondary: string;        // 次要字体族
      mono: string;            // 等宽字体族
    };
    fontSize: {
      h1: string;             // 标题1字号
      h2: string;             // 标题2字号
      h3: string;             // 标题3字号
      h4: string;             // 标题4字号
      h5: string;             // 标题5字号
      h6: string;             // 标题6字号
      bodyLarge: string;       // 大正文字号
      bodyMedium: string;      // 中正文字号
      bodySmall: string;       // 小正文字号
      caption: string;         // 说明文字号
    };
    fontWeight: {
      regular: string;         // 常规字重
      medium: string;          // 中等字重
      semibold: string;        // 半粗字重
      bold: string;            // 粗体字重
    };
    lineHeight: {
      tight: string;           // 紧凑行高
      normal: string;          // 正常行高
      relaxed: string;         // 宽松行高
    };
  };
  
  // 间距系统
  spacing: {
    xs: string;                // 超小间距
    sm: string;                // 小间距
    md: string;                // 中间距
    lg: string;                // 大间距
    xl: string;                // 超大间距
  };
  
  // 圆角系统
  borderRadius: {
    sm: string;                // 小圆角
    md: string;                // 中圆角
    lg: string;                // 大圆角
    xl: string;                // 超大圆角
    full: string;              // 完全圆角
  };
  
  // 阴影系统
  shadows: {
    sm: string;                // 小阴影
    md: string;                // 中阴影
    lg: string;                // 大阴影
    xl: string;                // 超大阴影
  };
  
  // 动画系统
  animation: {
    duration: {
      fast: string;            // 快速动画
      normal: string;           // 正常动画
      slow: string;            // 慢速动画
    };
    easing: {
      easeIn: string;          // 缓入
      easeOut: string;         // 缓出
      easeInOut: string;       // 缓入缓出
    };
  };
}

// 图标系统配置
interface IconSystemConfig {
  library: {
    name: string;                // 图标库名称
    version: string;             // 版本号
    type: 'lucide' | 'feather' | 'ant-design';
  };
  
  // 图标分类
  categories: {
    navigation: IconCategory;     // 导航图标
    function: IconCategory;       // 功能图标
    viewSwitch: IconCategory;     // 视图切换图标
    aiFunction: IconCategory;     // AI 功能图标
    terminal: IconCategory;      // 终端图标
    user: IconCategory;         // 用户图标
    operation: IconCategory;     // 操作图标
  };
  
  // 图标交互规范
  interaction: {
    default: {
      showText: boolean;        // 默认是否显示文字
      color: string;            // 默认颜色
    };
    hover: {
      showText: boolean;        // 悬停是否显示文字
      color: string;            // 悬停颜色
      showTooltip: boolean;      // 是否显示提示
    };
    active: {
      color: string;            // 激活颜色
    };
    disabled: {
      opacity: number;           // 禁用透明度
    };
  };
  
  // 图标尺寸
  sizes: {
    xs: number;                // 超小图标
    sm: number;                // 小图标
    md: number;                // 中图标
    lg: number;                // 大图标
    xl: number;                // 超大图标
  };
}

interface IconCategory {
  icons: Array<{
    name: string;              // 图标名称
    displayNameCN: string;       // 中文名称
    displayNameEN: string;       // 英文名称
    lucideName: string;         // Lucide 图标名称
    shortcut?: string;          // 快捷键
    tooltipCN?: string;         // 中文提示
    tooltipEN?: string;         // 英文提示
  }>;
}

// 数据库配置
interface DatabaseConfig {
  // 支持的数据库类型
  supportedTypes: Array<{
    type: 'postgresql' | 'mysql' | 'redis' | 'sqlite';
    name: string;
    defaultPort: number;
    configFiles: string[];      // 配置文件路径
  }>;
  
  // 连接池配置
  connectionPool: {
    min: number;               // 最小连接数
    max: number;               // 最大连接数
    idleTimeout: number;        // 空闲超时（秒）
  };
  
  // 查询配置
  query: {
    timeout: number;            // 查询超时（毫秒）
    pageSize: number;          // 分页大小
    maxResultSize: number;      // 最大结果集大小
  };
  
  // 备份配置
  backup: {
    enabled: boolean;          // 是否启用备份
    schedule: string;          // 备份计划（cron 表达式）
    retentionDays: number;      // 保留天数
    encryption: boolean;        // 是否加密
  };
}

// AI 服务配置
interface AIServiceConfig {
  // 服务商配置（支持动态增删）
  providers: AIProviderConfig[];
  
  // 当前选中的服务商
  activeProvider: string;
  
  // 当前选中的模型
  activeModel: string;
  
  // 缓存配置
  cache: {
    enabled: boolean;          // 是否启用缓存
    ttl: number;              // 缓存时间（秒）
    maxSize: number;          // 最大缓存条目数
  };
  
  // 速率限制
  rateLimit: {
    enabled: boolean;          // 是否启用速率限制
    requestsPerMinute: number; // 每分钟请求数
    retryAttempts: number;     // 重试次数
    backoffMultiplier: number; // 退避倍数
  };
  
  // 智能检测配置
  detection: {
    enabled: boolean;          // 是否启用智能检测
    autoSelectBest: boolean;   // 自动选择最佳模型
    performanceMonitoring: boolean; // 性能监控
    errorAnalysis: boolean;    // 错误分析
  };
}

// AI 服务商配置
interface AIProviderConfig {
  id: string;                 // 服务商唯一标识
  name: string;               // 服务商名称
  displayName: string;        // 显示名称
  type: 'cloud' | 'local';    // 类型：云端或本地
  baseURL: string;            // API 基础 URL
  apiKey: string;             // API 密钥（加密存储）
  apiKeyURL?: string;         // API 密钥获取页面 URL（用于一键获取）
  region?: string;            // 区域（国内服务商需要）
  models: AIModelConfig[];    // 支持的模型列表
  enabled: boolean;            // 是否启用
  priority: number;            // 优先级（用于自动选择）
  rateLimit?: {
    requestsPerMinute: number; // 每分钟请求数限制
    tokensPerMinute: number;   // 每分钟令牌数限制
  };
  pricing?: {
    inputPrice: number;        // 输入价格（每千令牌）
    outputPrice: number;       // 输出价格（每千令牌）
    currency: string;          // 货币单位
  };
}

// AI 模型配置
interface AIModelConfig {
  id: string;                 // 模型唯一标识
  name: string;               // 模型名称
  displayName: string;        // 显示名称
  type: 'chat' | 'embedding' | 'fine-tune' | 'image' | 'audio'; // 模型类型
  contextLength: number;      // 上下文长度
  maxTokens: number;          // 最大令牌数
  enabled: boolean;            // 是否启用
  parameters: {
    temperature: number;     // 温度参数
    topP: number;          // Top-P 参数
    frequencyPenalty: number; // 频率惩罚
    presencePenalty: number; // 存在惩罚
  };
  capabilities: string[];     // 能力列表（如：['chat', 'code', 'reasoning']）
  benchmark?: {
    latency: number;           // 延迟（毫秒）
    throughput: number;       // 吞吐量（令牌/秒）
    accuracy: number;          // 准确率（0-1）
  };
}

// 构建部署配置
interface BuildConfig {
  // Vite 配置
  vite: {
    port: number;              // 开发服务器端口
    host: string;             // 开发服务器主机
    open: boolean;            // 是否自动打开浏览器
  };
  
  // Tauri 配置
  tauri: {
    bundleId: string;          // Bundle ID
    productName: string;       // 产品名称
    version: string;           // 版本号
    updaterUrl: string;        // 更新 URL
    iconPath: string;          // 图标路径
  };
  
  // CI/CD 配置
  cicd: {
    platform: 'github' | 'gitlab' | 'bitbucket';
    enabled: boolean;          // 是否启用 CI/CD
    buildOnPush: boolean;     // 推送时构建
    buildOnPR: boolean;       // PR 时构建
    publishReleases: boolean;  // 发布版本
  };
}

// 测试配置
interface TestingConfig {
  // 单元测试
  unit: {
    framework: string;          // 测试框架
    coverageThreshold: number;  // 覆盖率阈值
  };
  
  // 集成测试
  integration: {
    framework: string;          // 测试框架
    timeout: number;           // 超时时间
  };
  
  // E2E 测试
  e2e: {
    framework: string;          // 测试框架
    browsers: string[];        // 浏览器列表
    headless: boolean;         // 无头模式
  };
  
  // 代码质量
  quality: {
    linter: string;            // 代码检查工具
    formatter: string;         // 代码格式化工具
    strictMode: boolean;       // 严格模式
  };
}

// 文档配置
interface DocumentationConfig {
  // 组件文档
  components: {
    tool: string;              // 文档工具
    enabled: boolean;          // 是否启用
  };
  
  // API 文档
  api: {
    tool: string;              // 文档工具
    enabled: boolean;          // 是否启用
  };
  
  // 用户文档
  user: {
    tool: string;              // 文档工具
    enabled: boolean;          // 是否启用
  };
}
```

---

## 📋 完整 Prompt（可直接提交）

```text
You are a senior full‑stack architect and code generator.
Your task is to scaffold a **desktop application** that follows a **Front‑End‑Only Full‑Stack (FEFS)** pattern: UI runs in a web stack (React + TypeScript + Vite) but all business logic, persistence and external integrations are implemented **inside the front‑end runtime** via a native host bridge (Tauri).

## Project Configuration

The following configuration is **fully editable via UI** and should be used as the source of truth for all project generation:

### Project Information
- **Project Name**: {PROJECT_NAME}
- **Display Name**: {PROJECT_DISPLAY_NAME}
- **Description**: {PROJECT_DESCRIPTION}
- **Version**: {PROJECT_VERSION}
- **License**: {PROJECT_LICENSE}
- **Repository**: {PROJECT_REPOSITORY}
- **Homepage**: {PROJECT_HOMEPAGE}
- **Default Workspace**: {DEFAULT_WORKSPACE}

### Team Information
- **Team Name**: YanYuCloudCube Team
- **Contact Email**: admin@0379.email
- **Team Website**: https://github.com/YYC-Cube/
- **Slogan (CN)**: 言启象限 | 语枢未来
- **Slogan (EN)**: Words Initiate Quadrants, Language Serves as Core for Future
- **Motto (CN)**: 万象归元于云枢 | 深栈智启新纪元
- **Motto (EN)**: All things converge in cloud pivot; Deep stacks ignite a new era of intelligence

### Technology Stack

#### Frontend Framework
- **Framework**: {FRAMEWORK_NAME}
- **Version**: {FRAMEWORK_VERSION}
- **Type**: {FRAMEWORK_TYPE}

#### Build Tool
- **Name**: {BUILD_TOOL_NAME}
- **Version**: {BUILD_TOOL_VERSION}

#### Type System
- **Enabled**: {TYPESCRIPT_ENABLED}
- **Version**: {TYPESCRIPT_VERSION}
- **Strict Mode**: {TYPESCRIPT_STRICT}

#### State Management
- **Library**: {STATE_MANAGEMENT_LIBRARY}
- **Version**: {STATE_MANAGEMENT_VERSION}

#### UI Component Library
- **Name**: {UI_LIBRARY_NAME}
- **Version**: {UI_LIBRARY_VERSION}

#### Native Bridge
- **Type**: {NATIVE_BRIDGE_TYPE}
- **Version**: {NATIVE_BRIDGE_VERSION}

#### Local Storage
- **IndexedDB ORM**: {INDEXEDDB_LIBRARY}
- **Version**: {INDEXEDDB_VERSION}
- **File System API**: {FILESYSTEM_ENABLED}

#### Icon Library
- **Name**: {ICON_LIBRARY_NAME}
- **Version**: {ICON_LIBRARY_VERSION}

#### AI SDK
- **Provider**: {AI_PROVIDER}
- **Version**: {AI_SDK_VERSION}

#### Worker Communication
- **Library**: {WORKER_LIBRARY}
- **Version**: {WORKER_VERSION}

### Design System

#### Color System
- **Primary**: {COLOR_PRIMARY}
- **Secondary**: {COLOR_SECONDARY}
- **Background**: {COLOR_BACKGROUND}
- **Surface**: {COLOR_SURFACE}
- **Text Primary**: {COLOR_TEXT_PRIMARY}
- **Text Secondary**: {COLOR_TEXT_SECONDARY}
- **Text Disabled**: {COLOR_TEXT_DISABLED}
- **Border**: {COLOR_BORDER}
- **Divider**: {COLOR_DIVIDER}
- **Success**: {COLOR_SUCCESS}
- **Warning**: {COLOR_WARNING}
- **Error**: {COLOR_ERROR}
- **Info**: {COLOR_INFO}

#### Typography System
- **Primary Font Family**: {FONT_FAMILY_PRIMARY}
- **Secondary Font Family**: {FONT_FAMILY_SECONDARY}
- **Mono Font Family**: {FONT_FAMILY_MONO}
- **Heading 1**: {FONT_SIZE_H1}
- **Heading 2**: {FONT_SIZE_H2}
- **Heading 3**: {FONT_SIZE_H3}
- **Heading 4**: {FONT_SIZE_H4}
- **Heading 5**: {FONT_SIZE_H5}
- **Heading 6**: {FONT_SIZE_H6}
- **Body Large**: {FONT_SIZE_BODY_LARGE}
- **Body Medium**: {FONT_SIZE_BODY_MEDIUM}
- **Body Small**: {FONT_SIZE_BODY_SMALL}
- **Caption**: {FONT_SIZE_CAPTION}

#### Spacing System
- **Extra Small**: {SPACING_XS}
- **Small**: {SPACING_SM}
- **Medium**: {SPACING_MD}
- **Large**: {SPACING_LG}
- **Extra Large**: {SPACING_XL}

#### Border Radius System
- **Small**: {BORDER_RADIUS_SM}
- **Medium**: {BORDER_RADIUS_MD}
- **Large**: {BORDER_RADIUS_LG}
- **Extra Large**: {BORDER_RADIUS_XL}
- **Full**: {BORDER_RADIUS_FULL}

#### Shadow System
- **Small**: {SHADOW_SM}
- **Medium**: {SHADOW_MD}
- **Large**: {SHADOW_LG}
- **Extra Large**: {SHADOW_XL}

#### Animation System
- **Fast Duration**: {ANIMATION_DURATION_FAST}
- **Normal Duration**: {ANIMATION_DURATION_NORMAL}
- **Slow Duration**: {ANIMATION_DURATION_SLOW}
- **Ease In**: {ANIMATION_EASING_EASE_IN}
- **Ease Out**: {ANIMATION_EASING_EASE_OUT}
- **Ease In Out**: {ANIMATION_EASING_EASE_IN_OUT}

### Icon System

#### Icon Library
- **Name**: {ICON_LIBRARY_NAME}
- **Version**: {ICON_LIBRARY_VERSION}
- **Type**: {ICON_LIBRARY_TYPE}

#### Icon Categories

##### Navigation Icons
{NAVIGATION_ICONS}

##### Function Icons
{FUNCTION_ICONS}

##### View Switch Icons
{VIEW_SWITCH_ICONS}

##### AI Function Icons
{AI_FUNCTION_ICONS}

##### Terminal Icons
{TERMINAL_ICONS}

##### User Icons
{USER_ICONS}

##### Operation Icons
{OPERATION_ICONS}

#### Icon Interaction Standards

##### Default State
- **Show Text**: {ICON_DEFAULT_SHOW_TEXT}
- **Color**: {ICON_DEFAULT_COLOR}

##### Hover State
- **Show Text**: {ICON_HOVER_SHOW_TEXT}
- **Color**: {ICON_HOVER_COLOR}
- **Show Tooltip**: {ICON_HOVER_SHOW_TOOLTIP}

##### Active State
- **Color**: {ICON_ACTIVE_COLOR}

##### Disabled State
- **Opacity**: {ICON_DISABLED_OPACITY}

#### Icon Sizes
- **Extra Small**: {ICON_SIZE_XS}
- **Small**: {ICON_SIZE_SM}
- **Medium**: {ICON_SIZE_MD}
- **Large**: {ICON_SIZE_LG}
- **Extra Large**: {ICON_SIZE_XL}

### Database Configuration

#### Supported Database Types
{SUPPORTED_DATABASE_TYPES}

#### Connection Pool
- **Min Connections**: {DB_POOL_MIN}
- **Max Connections**: {DB_POOL_MAX}
- **Idle Timeout**: {DB_POOL_IDLE_TIMEOUT}

#### Query Configuration
- **Timeout**: {DB_QUERY_TIMEOUT}
- **Page Size**: {DB_QUERY_PAGE_SIZE}
- **Max Result Size**: {DB_QUERY_MAX_RESULT_SIZE}

#### Backup Configuration
- **Enabled**: {DB_BACKUP_ENABLED}
- **Schedule**: {DB_BACKUP_SCHEDULE}
- **Retention Days**: {DB_BACKUP_RETENTION_DAYS}
- **Encryption**: {DB_BACKUP_ENCRYPTION}

### AI Service Configuration

#### AI Providers Configuration
{AI_PROVIDERS_CONFIG}

#### Active Configuration
- **Active Provider**: {AI_ACTIVE_PROVIDER}
- **Active Model**: {AI_ACTIVE_MODEL}

#### AI Parameters
- **Temperature**: {AI_TEMPERATURE}
- **Max Tokens**: {AI_MAX_TOKENS}
- **Top‑P**: {AI_TOP_P}
- **Frequency Penalty**: {AI_FREQUENCY_PENALTY}
- **Presence Penalty**: {AI_PRESENCE_PENALTY}

#### Cache Configuration
- **Enabled**: {AI_CACHE_ENABLED}
- **TTL**: {AI_CACHE_TTL}
- **Max Size**: {AI_CACHE_MAX_SIZE}

#### Rate Limit Configuration
- **Enabled**: {AI_RATE_LIMIT_ENABLED}
- **Requests Per Minute**: {AI_RATE_LIMIT_REQUESTS_PER_MINUTE}
- **Retry Attempts**: {AI_RATE_LIMIT_RETRY_ATTEMPTS}
- **Backoff Multiplier**: {AI_RATE_LIMIT_BACKOFF_MULTIPLIER}

#### Intelligent Detection Configuration
- **Enabled**: {AI_DETECTION_ENABLED}
- **Auto Select Best**: {AI_DETECTION_AUTO_SELECT_BEST}
- **Performance Monitoring**: {AI_DETECTION_PERFORMANCE_MONITORING}
- **Error Analysis**: {AI_DETECTION_ERROR_ANALYSIS}

#### AI Provider Management Features

##### 1. Dynamic Provider Management
- **Add Provider**: Support adding new AI providers through UI
- **Remove Provider**: Support removing existing AI providers
- **Edit Provider**: Support editing provider configuration
- **Enable/Disable**: Support enabling/disabling providers

##### 2. Dynamic Model Management
- **Add Model**: Support adding new models to existing providers
- **Remove Model**: Support removing models from providers
- **Edit Model**: Support editing model configuration
- **Enable/Disable**: Support enabling/disabling models

##### 3. One-Click API Key Acquisition
- **API Key URL**: Each provider can specify an API key acquisition page URL
- **Auto-Redirect**: Click to automatically redirect to the API key acquisition page
- **Auto-Fill**: Support auto-filling API key after acquisition
- **Validation**: Support validating API key after acquisition

##### 4. Intelligent Detection
- **Performance Monitoring**: Real-time monitoring of each provider's performance
- **Error Analysis**: Automatic analysis of error types and frequencies
- **Auto-Selection**: Automatically select the best provider based on performance
- **Fallback**: Automatic fallback to alternative providers on failure

### Build Configuration

#### Vite Configuration
- **Port**: {VITE_PORT}
- **Host**: {VITE_HOST}
- **Open Browser**: {VITE_OPEN}

#### Tauri Configuration
- **Bundle ID**: {TAURI_BUNDLE_ID}
- **Product Name**: {TAURI_PRODUCT_NAME}
- **Version**: {TAURI_VERSION}
- **Updater URL**: {TAURI_UPDATER_URL}
- **Icon Path**: {TAURI_ICON_PATH}

#### CI/CD Configuration
- **Platform**: {CICD_PLATFORM}
- **Enabled**: {CICD_ENABLED}
- **Build on Push**: {CICD_BUILD_ON_PUSH}
- **Build on PR**: {CICD_BUILD_ON_PR}
- **Publish Releases**: {CICD_PUBLISH_RELEASES}

### Testing Configuration

#### Unit Testing
- **Framework**: {UNIT_TEST_FRAMEWORK}
- **Coverage Threshold**: {UNIT_TEST_COVERAGE_THRESHOLD}

#### Integration Testing
- **Framework**: {INTEGRATION_TEST_FRAMEWORK}
- **Timeout**: {INTEGRATION_TEST_TIMEOUT}

#### E2E Testing
- **Framework**: {E2E_TEST_FRAMEWORK}
- **Browsers**: {E2E_TEST_BROWSERS}
- **Headless**: {E2E_TEST_HEADLESS}

#### Code Quality
- **Linter**: {CODE_QUALITY_LINTER}
- **Formatter**: {CODE_QUALITY_FORMATTER}
- **Strict Mode**: {CODE_QUALITY_STRICT_MODE}

### Documentation Configuration

#### Component Documentation
- **Tool**: {DOC_COMPONENTS_TOOL}
- **Enabled**: {DOC_COMPONENTS_ENABLED}

#### API Documentation
- **Tool**: {DOC_API_TOOL}
- **Enabled**: {DOC_API_ENABLED}

#### User Documentation
- **Tool**: {DOC_USER_TOOL}
- **Enabled**: {DOC_USER_ENABLED}

## Core Mission

1. **Design as Code**: Transform designer's visual designs directly into production‑ready code
2. **Real‑time Preview**: Provide immediate preview feedback on every design change
3. **Multi‑panel Layout**: Support free drag‑and‑drop, merge, and split multi‑panel layout system
4. **Intelligent Assistance**: Provide attribute suggestions, code snippets, error diagnostics through AI
5. **Configuration as Deployment**: Generated code can be directly deployed to production environment

## The app must provide **two independent storage subsystems**:

1️⃣ **Host‑File‑System Manager**
   - Auto‑detect a configurable "workspace" folder on the host OS (default: {DEFAULT_WORKSPACE}).
   - UI to browse, create, rename, delete, edit (text/markdown) files and upload/download arbitrary binary files.
   - Full **file version control** (each edit creates a new immutable version stored in IndexedDB; ability to view history and rollback).
   - Support drag‑and‑drop import, context‑menu actions, and a "Recent Files" pane.
   - Use **{ICON_LIBRARY_NAME}** icons for all UI elements following the icon system specifications.

2️⃣ **Local‑Database Manager**
   - Auto‑discover installed local DB engines ({SUPPORTED_DATABASE_TYPES}) by probing default ports and reading common configuration files.
   - Provide a **Connection Manager** UI where user can add/edit/delete connection profiles (host, port, username, password, ssl, default DB).
   - A **SQL Console** with syntax‑highlighted editor (Monaco) that can run arbitrary queries against selected profile, showing results in a paginated grid with inline editing for updatable result sets.
   - **Table Explorer**: list schemas → tables → columns, allow CRUD on rows (INSERT/UPDATE/DELETE) using generated forms.
   - **Backup & Restore**: one‑click logical dump (pg_dump / mysqldump / redis-cli SAVE) executed via Tauri native side, and ability to import a previously exported dump file.
   - All DB‑related operations must be executed **asynchronously** in a Tauri‑hosted Rust worker to keep the UI responsive, and must return a typed result to the front‑end.

## General Requirements

### Architecture must be **multi‑layered**:

* **UI Layer** – React components, React‑Router pages, {STATE_MANAGEMENT_LIBRARY} state.
* **Service Layer** – Pure TypeScript services exposing async APIs (`FileService`, `VersionService`, `DBDetectService`, `DBConnectionService`, `DBQueryService`, `BackupService`). No side‑effects other than calling the Host Bridge.
* **Host Bridge Layer** – Tauri `invoke` wrappers (`fs.*`, `db.*`, `backup.*`). All native code resides in `src-tauri/src` (Rust). Expose a **single entry point** per domain (`fs`, `db`, `backup`) and keep the JavaScript side type‑safe with `@tauri-apps/api` helpers.
* **Worker Layer** – WebWorkers ({WORKER_LIBRARY}) for CPU‑heavy tasks: file diff/patch for versioning, large result‑set paging, encryption of backup files.
* **Persistence Layer** – IndexedDB ({INDEXEDDB_LIBRARY}) for:
  - File metadata + version blobs (encrypted with AES‑GCM, key derived from a user‑provided passphrase stored in OS key‑ring via `tauri-plugin-keychain`).
  - DB connection profiles (encrypted as well).
  - UI preferences (theme, recent files) – non‑sensitive, stored plain in localStorage via {STATE_MANAGEMENT_LIBRARY} persist.

### Security & Privacy

* Minimal Tauri allow‑list: `fs`, `dialog`, `process`, `path`, `notification`, `clipboard`, `keychain`.
* All sensitive data encrypted at rest; never written in plain text.
* OpenAI integration (if later needed) must be optional and loaded only when a valid API key is supplied via the Connection Manager (store in key‑chain).
* Use **{ICON_LIBRARY_NAME}** icons for all UI elements following the icon system specifications.

### Offline‑First

* All UI assets cached via Workbox Service Worker; file version history and DB connection profiles are always available offline.

### Extensibility

* Provide a **Plugin API** (`registerPlugin(name, api)`) so third‑party storage back‑ends (e.g., local SQLite, cloud S3) can be added without touching core code.

### Testing

* Unit tests with {UNIT_TEST_FRAMEWORK}, integration tests with React‑Testing‑Library, E2E tests with {E2E_TEST_FRAMEWORK} (including native dialog mocks).
* CI pipeline on {CICD_PLATFORM} Actions that builds for Windows, macOS, Linux, runs tests, and publishes signed installers.

### Packaging

* Use Tauri (recommended) to keep the final binary < 12 MB.
* Provide `tauri.conf.json` with bundle icons (using {ICON_LIBRARY_NAME} icon style), updater URL, and auto‑update configuration.

## Project Structure (Monorepo)

```

{PROJECT_NAME}/
├─ packages/
│   ├─ core/                     # TS services, bridge typings, workers
│   │   ├─ src/
│   │   │   ├─ bridge/            # host/* wrappers (fs, db, backup)
│   │   │   ├─ services/
│   │   │   │   ├─ fileService.ts
│   │   │   │   ├─ versionService.ts
│   │   │   │   ├─ dbDetectService.ts
│   │   │   │   ├─ dbConnectionService.ts
│   │   │   │   ├─ dbQueryService.ts
│   │   │   │   └─ backupService.ts
│   │   │   ├─ workers/
│   │   │   │   ├─ diffWorker.ts
│   │   │   │   └─ pagingWorker.ts
│   │   │   ├─ storage/
│   │   │   │   ├─ db.ts          # {INDEXEDDB_LIBRARY} schemas (files, versions, dbProfiles)
│   │   │   │   └─ crypto.ts      # AES‑GCM helpers
│   │   │   └─ icons/
│   │   │       └─ iconSystem.ts  # {ICON_LIBRARY_NAME} icon system
│   │   └─ package.json
│   ├─ ui/                       # React front‑end
│   │   ├─ src/
│   │   │   ├─ components/
│   │   │   │   ├─ FileBrowser/
│   │   │   │   │   ├─ FileTree.tsx
│   │   │   │   │   ├─ FileEditor.tsx
│   │   │   │   │   └─ VersionPanel.tsx
│   │   │   │   ├─ DBExplorer/
│   │   │   │   │   ├─ ConnectionManager.tsx
│   │   │   │   │   ├─ SqlConsole.tsx
│   │   │   │   │   └─ TableViewer.tsx
│   │   │   │   ├─ Common/
│   │   │   │   │   ├─ Header.tsx
│   │   │   │   │   ├─ Sidebar.tsx
│   │   │   │   │   ├─ ThemeSwitcher.tsx
│   │   │   │   │   └─ Icon.tsx  # {ICON_LIBRARY_NAME} icon wrapper
│   │   │   ├─ pages/
│   │   │   │   ├─ HomePage.tsx
│   │   │   │   ├─ FilesPage.tsx
│   │   │   │   └─ DatabasesPage.tsx
│   │   │   ├─ store/
│   │   │   │   ├─ useFileStore.ts
│   │   │   │   └─ useDBStore.ts
│   │   │   └─ App.tsx
│   │   └─ package.json
│   └─ shared/                  # tsconfig, eslint, prettier
│       ├─ tsconfig.base.json
│       └─ eslint.config.mjs
├─ src-tauri/
│   ├─ src/
│   │   ├─ commands/
│   │   │   ├─ fs.rs          # list_dir, read_file, write_file, delete, rename, create_dir, upload, download
│   │   │   ├─ db.rs          # detect_engines, test_connection, exec_query, list_schemas, list_tables, dump, restore
│   │   │   └─ backup.rs      # encrypt_backup, decrypt_backup (uses ring crate)
│   │   ├─ utils/
│   │   │   ├─ versioning.rs  # compute diff, store version blobs
│   │   │   └─ crypto.rs      # AES‑GCM wrapper for Rust side (used for backup encryption)
│   │   └─ main.rs            # tauri::Builder with .invoke_handler(…)
│   ├─ Cargo.toml
│   └─ tauri.conf.json
├─ .github/workflows/ci.yml
└─ README.md

```

## Detailed Interface Definitions (TypeScript)

```ts
/**-------------------  Host Bridge   -------------------**/
export interface FsBridge {
  // workspace
  getWorkspace(): Promise<string>;
  setWorkspace(path: string): Promise<void>;

  // file ops
  listDir(dir: string): Promise<FileNode[]>;
  readFile(path: string): Promise<string>;               // text files only
  writeFile(path: string, content: string): Promise<void>;
  deletePath(path: string): Promise<void>;
  renamePath(oldPath: string, newPath: string): Promise<void>;
  createFile(path: string, content?: string): Promise<void>;
  createDirectory(path: string): Promise<void>;

  // binary upload / download
  uploadFile(srcHandle: FileSystemFileHandle, destPath: string): Promise<void>;
  downloadFile(srcPath: string, suggestedName?: string): Promise<void>;
}

export interface DbBridge {
  // discovery
  detectEngines(): Promise<DetectedEngine[]>; // e.g. [{type:'postgres', version:'14.5', defaultPort:5432}]
  // connection lifecycle
  testConnection(cfg: DBConnectionProfile): Promise<ConnectionTestResult>;
  saveProfile(profile: DBConnectionProfile): Promise<void>;
  loadProfiles(): Promise<DBConnectionProfile[]>;
  deleteProfile(id: string): Promise<void>;

  // schema browsing
  listSchemas(connId: string): Promise<string[]>;
  listTables(connId: string, schema: string): Promise<TableInfo[]>;
  getTableColumns(connId: string, schema: string, table: string): Promise<ColumnInfo[]>;

  // query execution
  execQuery(connId: string, sql: string, options?: {limit?: number; offset?: number}):
    Promise<QueryResult>;

  // backup / restore
  dumpDatabase(connId: string, destPath: string, options?: DumpOptions): Promise<void>;
  restoreDatabase(connId: string, dumpFile: string): Promise<void>;
}

/**-------------------  Service Layer   -------------------**/
export interface FileService {
  getWorkspace(): Promise<string>;
  setWorkspace(path: string): Promise<void>;
  browse(dir?: string): Promise<FileNode[]>;
  open(path: string): Promise<string>;
  save(path: string, content: string): Promise<void>;
  delete(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  createFile(path: string, init?: string): Promise<void>;
  createFolder(path: string): Promise<void>;
  upload(handle: FileSystemFileHandle, dest: string): Promise<void>;
  download(src: string, name?: string): Promise<void>;
  /** version control */
  getHistory(path: string): Promise<FileVersion[]>;
  rollback(path: string, versionId: string): Promise<void>;
}

export interface DBDetectService {
  detect(): Promise<DetectedEngine[]>;
}
export interface DBConnectionService {
  listProfiles(): Promise<DBConnectionProfile[]>;
  addProfile(p: DBConnectionProfile): Promise<void>;
  editProfile(p: DBConnectionProfile): Promise<void>;
  removeProfile(id: string): Promise<void>;
  test(p: DBConnectionProfile): Promise<ConnectionTestResult>;
}
export interface DBQueryService {
  listSchemas(connId: string): Promise<string[]>;
  listTables(connId: string, schema: string): Promise<TableInfo[]>;
  getColumns(connId: string, schema: string, table: string): Promise<ColumnInfo[]>;
  runQuery(connId: string, sql: string, opts?: {limit?: number; offset?: number}):
    Promise<QueryResult>;
}
export interface BackupService {
  dump(connId: string, dest: string, opts?: DumpOptions): Promise<void>;
  restore(connId: string, dumpFile: string): Promise<void>;
}
```

## Icon System Implementation

### Icon Categories and Mappings

```ts
// Navigation Icons
export const NavigationIcons = {
  home: { name: 'Home', lucideName: 'Home', displayNameCN: '首页', displayNameEN: 'Home' },
  back: { name: 'Back', lucideName: 'Back', displayNameCN: '返回', displayNameEN: 'Back' }
};

// Function Icons
export const FunctionIcons = {
  file: { name: 'File', lucideName: 'File', displayNameCN: '文件', displayNameEN: 'File', shortcut: 'Ctrl+O' },
  notification: { name: 'Notification', lucideName: 'Notification', displayNameCN: '通知', displayNameEN: 'Notification', shortcut: 'Ctrl+Shift+N' },
  settings: { name: 'Settings', lucideName: 'Settings', displayNameCN: '设置', displayNameEN: 'Settings', shortcut: 'Ctrl+,' },
  github: { name: 'GitHub', lucideName: 'GitHub', displayNameCN: 'GitHub', displayNameEN: 'GitHub', shortcut: 'Ctrl+Shift+G' },
  export: { name: 'Export', lucideName: 'Share', displayNameCN: '导出', displayNameEN: 'Export', shortcut: 'Ctrl+Shift+S' },
  deploy: { name: 'Deploy', lucideName: 'Deploy', displayNameCN: '发布', displayNameEN: 'Deploy', shortcut: 'Ctrl+Shift+D' },
  quickAction: { name: 'QuickAction', lucideName: 'Zap', displayNameCN: '快速操作', displayNameEN: 'Quick Action', shortcut: 'Ctrl+Shift+Q' },
  language: { name: 'Language', lucideName: 'Globe', displayNameCN: '语言', displayNameEN: 'Language', shortcut: 'Ctrl+Shift+L' },
  user: { name: 'User', lucideName: 'User', displayNameCN: '用户', displayNameEN: 'User' }
};

// View Switch Icons
export const ViewSwitchIcons = {
  preview: { name: 'Preview', lucideName: 'Eye', displayNameCN: '预览', displayNameEN: 'Preview', shortcut: 'Esc' },
  code: { name: 'Code', lucideName: 'Keyboard', displayNameCN: '代码', displayNameEN: 'Code', shortcut: 'Ctrl+1' },
  separator: { name: 'Separator', lucideName: 'SeparatorVertical', displayNameCN: '分隔线', displayNameEN: 'Separator' },
  search: { name: 'Search', lucideName: 'Search', displayNameCN: '搜索', displayNameEN: 'Search', shortcut: 'Ctrl+Shift+F' },
  more: { name: 'More', lucideName: 'MoreHorizontal', displayNameCN: '更多', displayNameEN: 'More', shortcut: 'Ctrl+Shift+M' }
};

// AI Function Icons
export const AIFunctionIcons = {
  aiModel: { name: 'AIModel', lucideName: 'Bot', displayNameCN: 'AI模型', displayNameEN: 'AI Model' },
  aiChat: { name: 'AIChat', lucideName: 'MessageSquare', displayNameCN: 'AI对话', displayNameEN: 'AI Chat' },
  aiSettings: { name: 'AISettings', lucideName: 'Settings', displayNameCN: 'AI设置', displayNameEN: 'AI Settings' },
  aiConfig: { name: 'AIConfig', lucideName: 'Settings', displayNameCN: 'AI配置', displayNameEN: 'AI Config' }
};

// Terminal Icons
export const TerminalIcons = {
  terminal: { name: 'Terminal', lucideName: 'Terminal', displayNameCN: '终端', displayNameEN: 'Terminal' },
  tab: { name: 'Tab', lucideName: 'PanelLeft', displayNameCN: '标签页', displayNameEN: 'Tab' }
};

// User Icons
export const UserIcons = {
  userAvatar: { name: 'UserAvatar', lucideName: 'User', displayNameCN: '用户头像', displayNameEN: 'User Avatar' },
  userName: { name: 'UserName', lucideName: 'FileText', displayNameCN: '用户名称', displayNameEN: 'User Name' },
  onlineStatus: { name: 'OnlineStatus', lucideName: 'Circle', displayNameCN: '在线状态', displayNameEN: 'Online Status' },
  preferences: { name: 'Preferences', lucideName: 'Settings', displayNameCN: '偏好设置', displayNameEN: 'Preferences' }
};

// Function Operation Icons
export const FunctionOperationIcons = {
  add: { name: 'Add', lucideName: 'Plus', displayNameCN: '添加', displayNameEN: 'Add' },
  imageUpload: { name: 'ImageUpload', lucideName: 'Upload', displayNameCN: '图片上传', displayNameEN: 'Image Upload' },
  fileImport: { name: 'FileImport', lucideName: 'FileDown', displayNameCN: '文件导入', displayNameEN: 'File Import' },
  gitHubLink: { name: 'GitHubLink', lucideName: 'Link', displayNameCN: 'GitHub链接', displayNameEN: 'GitHub Link' },
  figmaFile: { name: 'FigmaFile', lucideName: 'PenTool', displayNameCN: 'Figma文件', displayNameEN: 'Figma File' },
  codeSnippet: { name: 'CodeSnippet', lucideName: 'Code', displayNameCN: '代码片段', displayNameEN: 'Code Snippet' },
  clipboard: { name: 'Clipboard', lucideName: 'Clipboard', displayNameCN: '剪贴板', displayNameEN: 'Clipboard' }
};
```

### Icon Component Wrapper

```tsx
import { Icon as LucideIcon } from '{ICON_LIBRARY_NAME}';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  tooltip?: string;
  onClick?: () => void;
  showText?: boolean;
  state?: 'default' | 'hover' | 'active' | 'disabled';
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = {ICON_SIZE_MD},
  className = '',
  tooltip,
  onClick,
  showText = {ICON_DEFAULT_SHOW_TEXT},
  state = 'default'
}) => {
  const IconComponent = LucideIcon[name];

  const stateStyles = {
    default: { color: '{ICON_DEFAULT_COLOR}' },
    hover: { color: '{ICON_HOVER_COLOR}' },
    active: { color: '{ICON_ACTIVE_COLOR}' },
    disabled: { opacity: {ICON_DISABLED_OPACITY} }
  };

  return (
    <div
      className={`icon-wrapper ${className}`}
      onClick={onClick}
      title={tooltip}
      style={stateStyles[state]}
    >
      {IconComponent && <IconComponent size={size} />}
      {showText && <span className="icon-text">{tooltip}</span>}
    </div>
  );
};
```

## AI Service Architecture

### AI Service Layer Design

```ts
/**-------------------  AI Service Layer   -------------------**/

// AI 服务管理接口
export interface AIService {
  // 服务商管理
  listProviders(): Promise<AIProviderConfig[]>;
  addProvider(provider: AIProviderConfig): Promise<void>;
  editProvider(provider: AIProviderConfig): Promise<void>;
  removeProvider(providerId: string): Promise<void>;
  enableProvider(providerId: string): Promise<void>;
  disableProvider(providerId: string): Promise<void>;
  
  // 模型管理
  listModels(providerId: string): Promise<AIModelConfig[]>;
  addModel(providerId: string, model: AIModelConfig): Promise<void>;
  editModel(providerId: string, model: AIModelConfig): Promise<void>;
  removeModel(providerId: string, modelId: string): Promise<void>;
  enableModel(providerId: string, modelId: string): Promise<void>;
  disableModel(providerId: string, modelId: string): Promise<void>;
  
  // API 密钥管理
  setApiKey(providerId: string, apiKey: string): Promise<void>;
  getApiKey(providerId: string): Promise<string>;
  validateApiKey(providerId: string): Promise<boolean>;
  
  // 一键 API 获取
  getApiKeyURL(providerId: string): Promise<string>;
  openApiKeyPage(providerId: string): Promise<void>;
  
  // 智能检测
  detectBestProvider(): Promise<AIProviderConfig>;
  detectBestModel(providerId: string): Promise<AIModelConfig>;
  monitorPerformance(): Promise<PerformanceMetrics[]>;
  analyzeErrors(): Promise<ErrorAnalysis[]>;
  
  // 聊天功能
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  
  // 嵌入功能
  embed(text: string, options?: EmbedOptions): Promise<number[]>;
  
  // 流式聊天
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatStreamChunk>;
}

// 性能指标
export interface PerformanceMetrics {
  providerId: string;
  modelId: string;
  timestamp: number;
  latency: number;           // 延迟（毫秒）
  throughput: number;       // 吞吐量（令牌/秒）
  successRate: number;      // 成功率（0-1）
  errorCount: number;      // 错误次数
  totalRequests: number;    // 总请求数
}

// 错误分析
export interface ErrorAnalysis {
  providerId: string;
  modelId: string;
  errorType: 'network' | 'api' | 'rate_limit' | 'authentication' | 'unknown';
  errorMessage: string;
  timestamp: number;
  count: number;
  suggestions: string[];    // 解决建议
}

// 聊天消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

// 聊天选项
export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
}

// 聊天响应
export interface ChatResponse {
  message: ChatMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  latency: number;
}

// 流式聊天块
export interface ChatStreamChunk {
  delta: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  done: boolean;
}

// 嵌入选项
export interface EmbedOptions {
  model?: string;
  dimensions?: number;
}
```

### AI Service Implementation

```ts
// AI 服务实现
export class AIServiceImpl implements AIService {
  private providers: Map<string, AIProviderConfig> = new Map();
  private activeProvider: string;
  private activeModel: string;
  private performanceMetrics: PerformanceMetrics[] = [];
  private errorLog: ErrorAnalysis[] = [];
  
  constructor(config: AIServiceConfig) {
    config.providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
    this.activeProvider = config.activeProvider;
    this.activeModel = config.activeModel;
  }
  
  // 服务商管理
  async listProviders(): Promise<AIProviderConfig[]> {
    return Array.from(this.providers.values());
  }
  
  async addProvider(provider: AIProviderConfig): Promise<void> {
    this.providers.set(provider.id, provider);
    await this.saveProviders();
  }
  
  async editProvider(provider: AIProviderConfig): Promise<void> {
    if (this.providers.has(provider.id)) {
      this.providers.set(provider.id, provider);
      await this.saveProviders();
    }
  }
  
  async removeProvider(providerId: string): Promise<void> {
    this.providers.delete(providerId);
    await this.saveProviders();
  }
  
  async enableProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.enabled = true;
      await this.saveProviders();
    }
  }
  
  async disableProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.enabled = false;
      await this.saveProviders();
    }
  }
  
  // 模型管理
  async listModels(providerId: string): Promise<AIModelConfig[]> {
    const provider = this.providers.get(providerId);
    return provider?.models || [];
  }
  
  async addModel(providerId: string, model: AIModelConfig): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.models.push(model);
      await this.saveProviders();
    }
  }
  
  async editModel(providerId: string, model: AIModelConfig): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      const index = provider.models.findIndex(m => m.id === model.id);
      if (index !== -1) {
        provider.models[index] = model;
        await this.saveProviders();
      }
    }
  }
  
  async removeModel(providerId: string, modelId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.models = provider.models.filter(m => m.id !== modelId);
      await this.saveProviders();
    }
  }
  
  async enableModel(providerId: string, modelId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      const model = provider.models.find(m => m.id === modelId);
      if (model) {
        model.enabled = true;
        await this.saveProviders();
      }
    }
  }
  
  async disableModel(providerId: string, modelId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      const model = provider.models.find(m => m.id === modelId);
      if (model) {
        model.enabled = false;
        await this.saveProviders();
      }
    }
  }
  
  // API 密钥管理
  async setApiKey(providerId: string, apiKey: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      // 加密存储 API 密钥
      const encryptedKey = await this.encryptApiKey(apiKey);
      provider.apiKey = encryptedKey;
      await this.saveProviders();
    }
  }
  
  async getApiKey(providerId: string): Promise<string> {
    const provider = this.providers.get(providerId);
    if (provider) {
      // 解密 API 密钥
      return await this.decryptApiKey(provider.apiKey);
    }
    throw new Error('Provider not found');
  }
  
  async validateApiKey(providerId: string): Promise<boolean> {
    try {
      const provider = this.providers.get(providerId);
      if (!provider) return false;
      
      const apiKey = await this.getApiKey(providerId);
      const response = await fetch(`${provider.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  // 一键 API 获取
  async getApiKeyURL(providerId: string): Promise<string> {
    const provider = this.providers.get(providerId);
    if (provider?.apiKeyURL) {
      return provider.apiKeyURL;
    }
    throw new Error('API key URL not configured for this provider');
  }
  
  async openApiKeyPage(providerId: string): Promise<void> {
    const url = await this.getApiKeyURL(providerId);
    window.open(url, '_blank');
  }
  
  // 智能检测
  async detectBestProvider(): Promise<AIProviderConfig> {
    const enabledProviders = Array.from(this.providers.values())
      .filter(p => p.enabled);
    
    if (enabledProviders.length === 0) {
      throw new Error('No enabled providers found');
    }
    
    // 根据性能指标选择最佳服务商
    const metrics = await this.monitorPerformance();
    const bestProvider = metrics.reduce((best, current) => 
      current.successRate > best.successRate ? current : best
    );
    
    return this.providers.get(bestProvider.providerId)!;
  }
  
  async detectBestModel(providerId: string): Promise<AIModelConfig> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    const enabledModels = provider.models.filter(m => m.enabled);
    if (enabledModels.length === 0) {
      throw new Error('No enabled models found');
    }
    
    // 根据基准测试选择最佳模型
    const bestModel = enabledModels.reduce((best, current) => 
      (current.benchmark?.accuracy || 0) > (best.benchmark?.accuracy || 0) ? current : best
    );
    
    return bestModel;
  }
  
  async monitorPerformance(): Promise<PerformanceMetrics[]> {
    return this.performanceMetrics;
  }
  
  async analyzeErrors(): Promise<ErrorAnalysis[]> {
    return this.errorLog;
  }
  
  // 聊天功能
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new Error('Active provider not found');
    }
    
    const model = provider.models.find(m => m.id === this.activeModel);
    if (!model) {
      throw new Error('Active model not found');
    }
    
    const startTime = Date.now();
    
    try {
      const apiKey = await this.getApiKey(this.activeProvider);
      const response = await fetch(`${provider.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model.name,
          messages: messages,
          temperature: options?.temperature ?? model.parameters.temperature,
          max_tokens: options?.maxTokens ?? model.parameters.maxTokens,
          top_p: options?.topP ?? model.parameters.topP,
          frequency_penalty: options?.frequencyPenalty ?? model.parameters.frequencyPenalty,
          presence_penalty: options?.presencePenalty ?? model.parameters.presencePenalty
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      const latency = Date.now() - startTime;
      
      // 记录性能指标
      this.performanceMetrics.push({
        providerId: this.activeProvider,
        modelId: this.activeModel,
        timestamp: Date.now(),
        latency,
        throughput: data.usage?.total_tokens / (latency / 1000) || 0,
        successRate: 1,
        errorCount: 0,
        totalRequests: 1
      });
      
      return {
        message: {
          role: 'assistant',
          content: data.choices[0].message.content,
          timestamp: Date.now()
        },
        usage: data.usage,
        model: model.name,
        provider: provider.name,
        latency
      };
    } catch (error) {
      // 记录错误
      this.errorLog.push({
        providerId: this.activeProvider,
        modelId: this.activeModel,
        errorType: this.classifyError(error),
        errorMessage: error.message,
        timestamp: Date.now(),
        count: 1,
        suggestions: this.getErrorSuggestions(error)
      });
      
      throw error;
    }
  }
  
  // 流式聊天
  async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatStreamChunk> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new Error('Active provider not found');
    }
    
    const model = provider.models.find(m => m.id === this.activeModel);
    if (!model) {
      throw new Error('Active model not found');
    }
    
    try {
      const apiKey = await this.getApiKey(this.activeProvider);
      const response = await fetch(`${provider.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model.name,
          messages: messages,
          temperature: options?.temperature ?? model.parameters.temperature,
          max_tokens: options?.maxTokens ?? model.parameters.maxTokens,
          top_p: options?.topP ?? model.parameters.topP,
          frequency_penalty: options?.frequencyPenalty ?? model.parameters.frequencyPenalty,
          presence_penalty: options?.presencePenalty ?? model.parameters.presencePenalty,
          stream: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { delta: '', done: true };
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta?.content || '';
              yield {
                delta,
                usage: parsed.usage,
                done: false
              };
            } catch (error) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      // 记录错误
      this.errorLog.push({
        providerId: this.activeProvider,
        modelId: this.activeModel,
        errorType: this.classifyError(error),
        errorMessage: error.message,
        timestamp: Date.now(),
        count: 1,
        suggestions: this.getErrorSuggestions(error)
      });
      
      throw error;
    }
  }
  
  // 嵌入功能
  async embed(text: string, options?: EmbedOptions): Promise<number[]> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new Error('Active provider not found');
    }
    
    const model = provider.models.find(m => m.type === 'embedding');
    if (!model) {
      throw new Error('No embedding model found');
    }
    
    const apiKey = await this.getApiKey(this.activeProvider);
    const response = await fetch(`${provider.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: options?.model || model.name,
        input: text,
        dimensions: options?.dimensions
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  }
  
  // 私有方法
  private async saveProviders(): Promise<void> {
    // 保存服务商配置到 IndexedDB
    const db = await getAppDB();
    await db.aiProviders.clear();
    await db.aiProviders.bulkAdd(Array.from(this.providers.values()));
  }
  
  private async encryptApiKey(apiKey: string): Promise<string> {
    // 使用 AES-GCM 加密 API 密钥
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(apiKey)
    );
    return JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    });
  }
  
  private async decryptApiKey(encryptedKey: string): Promise<string> {
    // 使用 AES-GCM 解密 API 密钥
    const key = await this.getEncryptionKey();
    const { iv, data } = JSON.parse(encryptedKey);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    return new TextDecoder().decode(decrypted);
  }
  
  private async getEncryptionKey(): Promise<CryptoKey> {
    // 从密钥链获取加密密钥
    const keyData = await window.__TAURI__.keychain.getPassword('encryption-key');
    return await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keyData),
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  private classifyError(error: any): ErrorAnalysis['errorType'] {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'network';
    }
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return 'rate_limit';
    }
    if (error.message.includes('authentication') || error.message.includes('401')) {
      return 'authentication';
    }
    if (error.message.includes('API') || error.message.includes('400')) {
      return 'api';
    }
    return 'unknown';
  }
  
  private getErrorSuggestions(error: any): string[] {
    const suggestions: string[] = [];
    
    if (error.message.includes('rate limit')) {
      suggestions.push('降低请求频率');
      suggestions.push('考虑升级到更高级别的 API 计划');
    }
    
    if (error.message.includes('authentication')) {
      suggestions.push('检查 API 密钥是否正确');
      suggestions.push('确认 API 密钥是否已激活');
      suggestions.push('尝试重新生成 API 密钥');
    }
    
    if (error.message.includes('network')) {
      suggestions.push('检查网络连接');
      suggestions.push('确认 API 服务是否正常运行');
      suggestions.push('尝试使用 VPN 或代理');
    }
    
    if (error.message.includes('API')) {
      suggestions.push('检查请求参数是否正确');
      suggestions.push('确认模型名称是否有效');
      suggestions.push('查看 API 文档了解最新变更');
    }
    
    return suggestions;
  }
}
```

### Preset AI Providers

```ts
// 预设服务商配置
export const presetProviders: AIProviderConfig[] = [
  // OpenAI
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    type: 'cloud',
    baseURL: 'https://api.openai.com/v1',
    apiKey: '',
    apiKeyURL: 'https://platform.openai.com/api-keys',
    models: [
      {
        id: 'gpt-4-turbo-preview',
        name: 'gpt-4-turbo-preview',
        displayName: 'GPT-4 Turbo',
        type: 'chat',
        contextLength: 128000,
        maxTokens: 4096,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code', 'reasoning'],
        benchmark: {
          latency: 1500,
          throughput: 50,
          accuracy: 0.95
        }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        type: 'chat',
        contextLength: 16385,
        maxTokens: 4096,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code'],
        benchmark: {
          latency: 800,
          throughput: 100,
          accuracy: 0.90
        }
      },
      {
        id: 'text-embedding-ada-002',
        name: 'text-embedding-ada-002',
        displayName: 'Ada Embedding',
        type: 'embedding',
        contextLength: 8191,
        maxTokens: 8191,
        enabled: true,
        parameters: {
          temperature: 0.0,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['embedding'],
        benchmark: {
          latency: 200,
          throughput: 500,
          accuracy: 0.85
        }
      }
    ],
    enabled: true,
    priority: 1,
    rateLimit: {
      requestsPerMinute: 3500,
      tokensPerMinute: 90000
    },
    pricing: {
      inputPrice: 0.01,
      outputPrice: 0.03,
      currency: 'USD'
    }
  },
  
  // Anthropic
  {
    id: 'anthropic',
    name: 'anthropic',
    displayName: 'Anthropic',
    type: 'cloud',
    baseURL: 'https://api.anthropic.com/v1',
    apiKey: '',
    apiKeyURL: 'https://console.anthropic.com/settings/keys',
    models: [
      {
        id: 'claude-3-opus-20240229',
        name: 'claude-3-opus-20240229',
        displayName: 'Claude 3 Opus',
        type: 'chat',
        contextLength: 200000,
        maxTokens: 4096,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code', 'reasoning', 'analysis'],
        benchmark: {
          latency: 2000,
          throughput: 40,
          accuracy: 0.97
        }
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'claude-3-sonnet-20240229',
        displayName: 'Claude 3 Sonnet',
        type: 'chat',
        contextLength: 200000,
        maxTokens: 4096,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code', 'reasoning'],
        benchmark: {
          latency: 1200,
          throughput: 60,
          accuracy: 0.94
        }
      }
    ],
    enabled: true,
    priority: 2,
    rateLimit: {
      requestsPerMinute: 50,
      tokensPerMinute: 40000
    },
    pricing: {
      inputPrice: 0.015,
      outputPrice: 0.075,
      currency: 'USD'
    }
  },
  
  // 国内服务商 - 智谱 AI
  {
    id: 'zhipuai',
    name: 'zhipuai',
    displayName: '智谱 AI',
    type: 'cloud',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '',
    apiKeyURL: 'https://open.bigmodel.cn/usercenter/apikeys',
    region: 'cn',
    models: [
      {
        id: 'glm-4',
        name: 'glm-4',
        displayName: 'GLM-4',
        type: 'chat',
        contextLength: 128000,
        maxTokens: 8192,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code', 'reasoning'],
        benchmark: {
          latency: 1000,
          throughput: 70,
          accuracy: 0.92
        }
      },
      {
        id: 'glm-4-flash',
        name: 'glm-4-flash',
        displayName: 'GLM-4 Flash',
        type: 'chat',
        contextLength: 128000,
        maxTokens: 8192,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code'],
        benchmark: {
          latency: 500,
          throughput: 120,
          accuracy: 0.88
        }
      },
      {
        id: 'embedding-2',
        name: 'embedding-2',
        displayName: 'Embedding-2',
        type: 'embedding',
        contextLength: 8192,
        maxTokens: 8192,
        enabled: true,
        parameters: {
          temperature: 0.0,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['embedding'],
        benchmark: {
          latency: 150,
          throughput: 600,
          accuracy: 0.87
        }
      }
    ],
    enabled: true,
    priority: 3,
    rateLimit: {
      requestsPerMinute: 100,
      tokensPerMinute: 50000
    },
    pricing: {
      inputPrice: 0.0001,
      outputPrice: 0.0001,
      currency: 'CNY'
    }
  },
  
  // 国内服务商 - 百度文心
  {
    id: 'baidu',
    name: 'baidu',
    displayName: '百度文心',
    type: 'cloud',
    baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    apiKey: '',
    apiKeyURL: 'https://console.bce.baidu.com/qianfan/ais/console/application/list',
    region: 'cn',
    models: [
      {
        id: 'ernie-4.0-8k',
        name: 'ernie-4.0-8k',
        displayName: 'ERNIE-4.0-8K',
        type: 'chat',
        contextLength: 8192,
        maxTokens: 4096,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code', 'reasoning'],
        benchmark: {
          latency: 1200,
          throughput: 65,
          accuracy: 0.91
        }
      },
      {
        id: 'ernie-3.5-8k',
        name: 'ernie-3.5-8k',
        displayName: 'ERNIE-3.5-8K',
        type: 'chat',
        contextLength: 8192,
        maxTokens: 4096,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code'],
        benchmark: {
          latency: 800,
          throughput: 90,
          accuracy: 0.89
        }
      }
    ],
    enabled: true,
    priority: 4,
    rateLimit: {
      requestsPerMinute: 50,
      tokensPerMinute: 30000
    },
    pricing: {
      inputPrice: 0.00012,
      outputPrice: 0.00012,
      currency: 'CNY'
    }
  },
  
  // 国内服务商 - 阿里通义
  {
    id: 'aliyun',
    name: 'aliyun',
    displayName: '阿里通义',
    type: 'cloud',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    apiKeyURL: 'https://dashscope.console.aliyun.com/apiKey',
    region: 'cn',
    models: [
      {
        id: 'qwen-turbo',
        name: 'qwen-turbo',
        displayName: 'Qwen Turbo',
        type: 'chat',
        contextLength: 8192,
        maxTokens: 4096,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code'],
        benchmark: {
          latency: 600,
          throughput: 100,
          accuracy: 0.90
        }
      },
      {
        id: 'qwen-plus',
        name: 'qwen-plus',
        displayName: 'Qwen Plus',
        type: 'chat',
        contextLength: 32768,
        maxTokens: 8192,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code', 'reasoning'],
        benchmark: {
          latency: 1000,
          throughput: 75,
          accuracy: 0.93
        }
      },
      {
        id: 'qwen-max',
        name: 'qwen-max',
        displayName: 'Qwen Max',
        type: 'chat',
        contextLength: 32768,
        maxTokens: 8192,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code', 'reasoning', 'analysis'],
        benchmark: {
          latency: 1500,
          throughput: 55,
          accuracy: 0.95
        }
      }
    ],
    enabled: true,
    priority: 5,
    rateLimit: {
      requestsPerMinute: 100,
      tokensPerMinute: 60000
    },
    pricing: {
      inputPrice: 0.00008,
      outputPrice: 0.00008,
      currency: 'CNY'
    }
  },
  
  // Ollama (本地)
  {
    id: 'ollama',
    name: 'ollama',
    displayName: 'Ollama (本地)',
    type: 'local',
    baseURL: 'http://localhost:11434',
    apiKey: 'ollama',
    models: [
      {
        id: 'llama2',
        name: 'llama2',
        displayName: 'Llama 2',
        type: 'chat',
        contextLength: 4096,
        maxTokens: 2048,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code'],
        benchmark: {
          latency: 3000,
          throughput: 20,
          accuracy: 0.85
        }
      },
      {
        id: 'mistral',
        name: 'mistral',
        displayName: 'Mistral',
        type: 'chat',
        contextLength: 8192,
        maxTokens: 4096,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code', 'reasoning'],
        benchmark: {
          latency: 2000,
          throughput: 30,
          accuracy: 0.88
        }
      },
      {
        id: 'codellama',
        name: 'codellama',
        displayName: 'Code Llama',
        type: 'chat',
        contextLength: 16384,
        maxTokens: 4096,
        enabled: true,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        },
        capabilities: ['chat', 'code'],
        benchmark: {
          latency: 2500,
          throughput: 25,
          accuracy: 0.90
        }
      }
    ],
    enabled: true,
    priority: 10,
    pricing: {
      inputPrice: 0,
      outputPrice: 0,
      currency: 'USD'
    }
  }
];
```

### AI Service UI Components

```tsx
// 服务商管理组件
export const ProviderManager: React.FC = () => {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderConfig | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const aiService = useAIService();
  
  useEffect(() => {
    loadProviders();
  }, []);
  
  const loadProviders = async () => {
    const data = await aiService.listProviders();
    setProviders(data);
  };
  
  const handleAddProvider = async (provider: AIProviderConfig) => {
    await aiService.addProvider(provider);
    await loadProviders();
    setShowAddDialog(false);
  };
  
  const handleEditProvider = async (provider: AIProviderConfig) => {
    await aiService.editProvider(provider);
    await loadProviders();
    setShowEditDialog(false);
  };
  
  const handleRemoveProvider = async (providerId: string) => {
    if (confirm('确定要删除此服务商吗？')) {
      await aiService.removeProvider(providerId);
      await loadProviders();
    }
  };
  
  const handleToggleProvider = async (providerId: string, enabled: boolean) => {
    if (enabled) {
      await aiService.enableProvider(providerId);
    } else {
      await aiService.disableProvider(providerId);
    }
    await loadProviders();
  };
  
  const handleGetApiKey = async (providerId: string) => {
    await aiService.openApiKeyPage(providerId);
  };
  
  return (
    <div className="provider-manager">
      <div className="provider-header">
        <h2>AI 服务商管理</h2>
        <button onClick={() => setShowAddDialog(true)}>
          <Icon name="Plus" />
          添加服务商
        </button>
      </div>
      
      <div className="provider-list">
        {providers.map(provider => (
          <div key={provider.id} className="provider-card">
            <div className="provider-info">
              <h3>{provider.displayName}</h3>
              <p>{provider.type === 'cloud' ? '云端服务' : '本地服务'}</p>
              {provider.region && <span className="region-badge">{provider.region}</span>}
            </div>
            
            <div className="provider-actions">
              <button onClick={() => setSelectedProvider(provider)}>
                <Icon name="Settings" />
              </button>
              <button onClick={() => setShowEditDialog(true)}>
                <Icon name="Edit" />
              </button>
              <button onClick={() => handleGetApiKey(provider.id)}>
                <Icon name="Key" />
                获取 API 密钥
              </button>
              <button onClick={() => handleToggleProvider(provider.id, !provider.enabled)}>
                <Icon name={provider.enabled ? 'ToggleRight' : 'ToggleLeft'} />
              </button>
              <button onClick={() => handleRemoveProvider(provider.id)}>
                <Icon name="Trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {showAddDialog && (
        <ProviderDialog
          mode="add"
          onSave={handleAddProvider}
          onClose={() => setShowAddDialog(false)}
        />
      )}
      
      {showEditDialog && selectedProvider && (
        <ProviderDialog
          mode="edit"
          provider={selectedProvider}
          onSave={handleEditProvider}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </div>
  );
};

// 模型管理组件
export const ModelManager: React.FC<{ providerId: string }> = ({ providerId }) => {
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelConfig | null>(null);
  
  const aiService = useAIService();
  
  useEffect(() => {
    loadModels();
  }, [providerId]);
  
  const loadModels = async () => {
    const data = await aiService.listModels(providerId);
    setModels(data);
  };
  
  const handleAddModel = async (model: AIModelConfig) => {
    await aiService.addModel(providerId, model);
    await loadModels();
    setShowAddDialog(false);
  };
  
  const handleEditModel = async (model: AIModelConfig) => {
    await aiService.editModel(providerId, model);
    await loadModels();
    setShowEditDialog(false);
  };
  
  const handleRemoveModel = async (modelId: string) => {
    if (confirm('确定要删除此模型吗？')) {
      await aiService.removeModel(providerId, modelId);
      await loadModels();
    }
  };
  
  const handleToggleModel = async (modelId: string, enabled: boolean) => {
    if (enabled) {
      await aiService.enableModel(providerId, modelId);
    } else {
      await aiService.disableModel(providerId, modelId);
    }
    await loadModels();
  };
  
  return (
    <div className="model-manager">
      <div className="model-header">
        <h2>模型管理</h2>
        <button onClick={() => setShowAddDialog(true)}>
          <Icon name="Plus" />
          添加模型
        </button>
      </div>
      
      <div className="model-list">
        {models.map(model => (
          <div key={model.id} className="model-card">
            <div className="model-info">
              <h3>{model.displayName}</h3>
              <p>{model.type}</p>
              <span className="context-length">上下文: {model.contextLength}</span>
              {model.benchmark && (
                <div className="benchmark">
                  <span>延迟: {model.benchmark.latency}ms</span>
                  <span>准确率: {(model.benchmark.accuracy * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
            
            <div className="model-actions">
              <button onClick={() => setSelectedModel(model)}>
                <Icon name="Settings" />
              </button>
              <button onClick={() => setShowEditDialog(true)}>
                <Icon name="Edit" />
              </button>
              <button onClick={() => handleToggleModel(model.id, !model.enabled)}>
                <Icon name={model.enabled ? 'ToggleRight' : 'ToggleLeft'} />
              </button>
              <button onClick={() => handleRemoveModel(model.id)}>
                <Icon name="Trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {showAddDialog && (
        <ModelDialog
          mode="add"
          onSave={handleAddModel}
          onClose={() => setShowAddDialog(false)}
        />
      )}
      
      {showEditDialog && selectedModel && (
        <ModelDialog
          mode="edit"
          model={selectedModel}
          onSave={handleEditModel}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </div>
  );
};

// 性能监控组件
export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [errors, setErrors] = useState<ErrorAnalysis[]>([]);
  
  const aiService = useAIService();
  
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const loadData = async () => {
    const [metricsData, errorsData] = await Promise.all([
      aiService.monitorPerformance(),
      aiService.analyzeErrors()
    ]);
    setMetrics(metricsData);
    setErrors(errorsData);
  };
  
  return (
    <div className="performance-monitor">
      <h2>性能监控</h2>
      
      <div className="metrics-section">
        <h3>性能指标</h3>
        <table>
          <thead>
            <tr>
              <th>服务商</th>
              <th>模型</th>
              <th>延迟</th>
              <th>吞吐量</th>
              <th>成功率</th>
              <th>请求数</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <tr key={index}>
                <td>{metric.providerId}</td>
                <td>{metric.modelId}</td>
                <td>{metric.latency}ms</td>
                <td>{metric.throughput.toFixed(1)} t/s</td>
                <td>{(metric.successRate * 100).toFixed(1)}%</td>
                <td>{metric.totalRequests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="errors-section">
        <h3>错误分析</h3>
        <table>
          <thead>
            <tr>
              <th>服务商</th>
              <th>模型</th>
              <th>错误类型</th>
              <th>错误消息</th>
              <th>次数</th>
              <th>建议</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((error, index) => (
              <tr key={index}>
                <td>{error.providerId}</td>
                <td>{error.modelId}</td>
                <td>{error.errorType}</td>
                <td>{error.errorMessage}</td>
                <td>{error.count}</td>
                <td>
                  <ul>
                    {error.suggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## Key Algorithms / Workers

| Worker | Responsibility | Communication ({WORKER_LIBRARY}) |
|-------|----------------|------------------------|
| `diffWorker.ts` | Compute diff between two text versions, generate patch (`json-patch`) for rollback view. | `diff(old: string, new: string): Promise<Patch>` |
| `pagingWorker.ts` | Incrementally fetch large result‑sets (cursor based) from DB query service, return pages of rows. | `page(queryId: string, page: number, size: number): Promise<Row[]>` |
| `backupWorker.ts` | Stream dump file through Rust `pg_dump`/`mysqldump` -> encrypt on‑the‑fly -> write to destination. | `runDump(params): Promise<Progress>` |

## Persistence ({INDEXEDDB_LIBRARY}) Schema

```ts
export class AppDB extends {INDEXEDDB_LIBRARY_CLASS} {
  // file system
  files!: Table<FileMeta, string>;        // key = absolutePath
  versions!: Table<FileVersion, string>; // key = versionId
  // db connections
  dbProfiles!: Table<DBConnectionProfile, string>;

  constructor() {
    super("{PROJECT_NAME}DB");
    this.version(3).stores({
      files: "path, workspace, updatedAt",
      versions: "id, path, createdAt",
      dbProfiles: "id, type, host, port"
    });
  }
}
```

## Security Highlights

- All bridge functions that accept passwords (DB or file‑encryption) receive **encrypted strings** from the UI; the UI encrypts with a user‑derived key before invoking the host.
- Rust side never logs raw credentials; use `log::debug!` behind a feature flag.
- Use **tauri-plugin-keychain** (macOS/Windows) / **tauri-plugin-secret** (Linux) for secure storage of the AES master key.
- CSP in `tauri.conf.json`:

```json
"csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src https://api.openai.com;"
```

## Testing / CI Pipeline ({CICD_PLATFORM})

```yaml
name: Build & Test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-linux:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [{NODE_VERSION}]
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: pnpm
      - run: pnpm i --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test --coverage
      - run: pnpm build
      - name: Build Tauri (Linux)
        run: pnpm tauri build
        env:
          VITE_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      - uses: actions/upload-artifact@v4
        with:
          name: linux-bundle
          path: src-tauri/target/release/bundle/**/*.AppImage

  # repeat for macos & windows ...

  release:
    needs: [build-linux, build-macos, build-windows]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          path: artifacts
      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          files: artifacts/**/*.*
```

## README / Usage 指南（模型自动生成）

- 启动前请在系统中安装对应的本地数据库（{SUPPORTED_DATABASE_TYPES}）。
- 第一次运行时会自动检测并提示创建 "workspace"（默认：{DEFAULT_WORKSPACE}）。
- 所有文件编辑自动保存为新版本，右侧 "版本历史" 面板可以逐版对比、回滚。
- 在 "数据库" 页面点击 "检测本地引擎" → 选择所需实例 → "测试连接"。
- 使用 "SQL 控制台" 执行查询，结果表格支持分页、过滤、内联编辑。
- "备份" 按钮会调用对应的 `pg_dump` / `mysqldump`，生成的 *.bak* 文件被 AES‑GCM 加密后保存在工作区；恢复时选择 *.bak* 即可。
- 所有 UI 元素使用 **{ICON_LIBRARY_NAME}** 图标，遵循 YYC³ 图标系统规范。

---

## ✅ 结束语

把上面 **完整的 Prompt** 交给 LLM，它会生成：

- **完整的 Monorepo**（Tauri + React + TypeScript）
- **Typed Host Bridge**（Rust ↔ JavaScript）
- **文件系统 UI + 版本控制**
- **本地数据库自动发现、连接管理、SQL 控制台、表浏览、备份/恢复**
- **YYC³ 图标系统**（基于 {ICON_LIBRARY_NAME}）
- **安全、离线、插件化**的全套实现以及 **CI/CD** 脚手架。

所有配置信息均通过 **UI 可编辑界面** 进行配置，**完全禁用硬编码**，确保项目的灵活性和可维护性。

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
| 内容校验 | 57bb11ec242af5d0 |
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
