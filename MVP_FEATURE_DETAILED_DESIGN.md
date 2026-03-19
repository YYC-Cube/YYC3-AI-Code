# YYC³ AI Code - MVP 功能详细设计 (v1.1 - Updated for Phase 2)

> **设计时间**: 2026-03-19 04:10
> **更新时间**: 2026-03-19 07:20 (对齐 Phase 2 实施成果)
> **项目**: YYC³ AI Code
> **版本**: v1.1 (MVP)
> **设计团队**: YanYuCloudCube Team

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [核心功能设计](#2-核心功能设计)
3. [技术架构设计 (已更新)](#3-技术架构设计)
4. [UI/UX 设计](#4-uiux-设计)
5. [数据流设计](#5-数据流设计)
6. [测试策略 (新增)](#6-测试策略)
7. [API 设计](#7-api-设计)
8. [数据库设计](#8-数据库设计)
9. [部署架构](#9-部署架构)
10. [开发时间表 (已更新)](#10-开发时间表)
11. [成本估算](#11-成本估算)
12. [风险评估](#12-风险评估)
13. [附录](#13-附录)

---

## 1. 项目概述

### 1.1 项目背景

**YYC³ AI Code** 是一款面向开发者的 AI 驱动的智能代码生成与协作工作台，旨在通过 AI 技术、实时协作和个性化建议，大幅提升开发者的生产力。

### 1.2 项目目标

**短期目标（3 个月）**:
- ✅ 完成 MVP 核心功能开发 (Phase 1 & 2)
- ⏳ 吸引 1000+ 日活用户
- ⏳ 达到 5000+ 月活用户
- ⏳ 用户满意度达到 4.5/5.0

**中期目标（6 个月）**:
- ⏳ 扩展功能，支持更多编程语言
- ⏳ 提升 AI 模型性能
- ⏳ 优化用户体验
- ⏳ 用户满意度达到 4.7/5.0

**长期目标（12 个月）**:
- ⏳ 成为开发者首选的 AI 代码生成工具
- ⏳ 占据市场份额的 10%+
- ⏳ 用户满意度达到 4.8/5.0
- ⏳ 实现盈利

### 1.3 项目范围

**MVP 范围**:
- ✅ AI 代码生成功能 (Phase 2 完成)
- ⏳ 实时协作编辑功能 (架构已就绪)
- ⏳ 智能错误检测功能 (服务已创建)
- ⏳ 个性化代码建议功能 (服务已创建)
- ⏳ 性能优化功能 (基础配置)

**未来扩展范围**:
- ⏳ 支持更多编程语言
- ⏳ 集成更多 AI 模型
- ⏳ 增加更多协作功能
- ⏳ 增加更多个性化功能

---

## 2. 核心功能设计

### 2.1 功能 1: AI 代码生成 (已实施)

#### 2.1.1 功能描述
使用 AI 自动生成代码，支持多种编程语言和框架，用户可以通过自然语言描述需求，AI 自动生成符合要求的代码。

#### 2.1.2 技术实现 (Phase 2 更新)

**前端架构 (已实施)**:
1.  **服务层**:
    *   定义了 `CodeGenerationRequest` 接口。
    *   定义了 `CodeGenerationResponse` 接口。
    *   实现了 `AICodeService` 类，封装 Chat Completions API 调用。
    *   优化了 **System Prompt**，确保代码高质量。
2.  **状态管理层**:
    *   创建了 `useAICodeGeneration` Hook。
    *   管理 `isGenerating`, `generatedCode`, `error` 状态。
    *   集成 `useGlobalAI` Context 自动获取 API Key。
3.  **UI 层**:
    *   创建了 `CodeGeneratorPanel` 组件。
    *   提供输入框和结果预览。
    *   集成到 `routes` (`/ai-generator`)。
4.  **导航集成**:
    *   在 `ActivityBar` 添加 'generator' 入口。
    *   在 `AICodeSystem` 添加导航逻辑。

**System Prompt 策略**:
- 明确角色："Senior software engineer and AI coding assistant"。
- 指导 Context 分析。
- 强制输出格式：**仅代码块**，无会话文本。

---

## 3. 技术架构设计 (已更新)

### 3.1 前端架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Layer (React)                   │
├─────────────────────────────────────────────────────────────────────┤
│  UI Components:                                                 │
│  • ActivityBar (导航)                                           │
│  • CodeGeneratorPanel (AI 生成)                                 │
│  • AIChatPanel (AI 助手)                                      │
│  • LivePreview (实时预览)                                       │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         State Management                       │
├─────────────────────────────────────────────────────────────────────┤
│  • GlobalAIContext (AI 模型配置, API Keys)                   │
│  • AppStore (全局应用状态)                                    │
│  • Custom Hooks (useAICodeGeneration, etc.)                  │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Service Layer                         │
├─────────────────────────────────────────────────────────────────────┤
│  • AICodeService (代码生成 API)                              │
│  • WebSocketService (实时协作)                                 │
│  • ErrorDetectionService (错误检测)                             │
│  • SuggestionService (代码建议)                                │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Infrastructure & Utils                     │
├─────────────────────────────────────────────────────────────────────┤
│  • API Client (Fetch封装)                                     │
│  • LocalStorage (持久化)                                      │
│  • Clipboard Utils (剪贴板)                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 后端架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway                          │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Services                             │
├─────────────────────────────────────────────────────────────────────┤
│  • Auth Service (认证)                                        │
│  • User Service (用户管理)                                    │
│  • Collab Service (协作)                                      │
│  • Proxy Service (AI 模型代理)                                 │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
├─────────────────────────────────────────────────────────────────────┤
│  • PostgreSQL (关系型数据)                                    │
│  • MongoDB (文档型数据, 生成历史)                             │
│  • Redis (缓存, 会话)                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. 测试策略 (新增 - Phase 2)

### 6.1 测试金字塔

```
          /\
         /  \
        / E2E \      <-- 集成测试 (少量)
       /--------\
      /  Integration \ <-- 服务/组件集成 (中等)
     /----------------\
    /    Unit Tests    \ <-- 单元测试 (大量)
   /--------------------\
```

### 6.2 测试用例矩阵

| 模块 | 测试类型 | 测试文件 | 覆盖率目标 | 状态 |
|------|----------|----------|-----------|------|
| **AICodeService** | Unit | `src/app/services/aiCodeService.test.ts` | 90%+ | ✅ 完成 |
| **useAICodeGeneration** | Unit | `src/app/hooks/useAICodeGeneration.test.ts` | 90%+ | ✅ 完成 |
| **CodeGeneratorPanel** | Component | `src/tests/unit/CodeGeneratorPanel.test.tsx` | 80%+ | ⏳ 待创建 |
| **ActivityBar** | Component | `src/tests/unit/ActivityBar.test.tsx` | 80%+ | ⏳ 待创建 |
| **ErrorDetectionService** | Unit | `src/app/services/errorDetectionService.test.ts` | 80%+ | ⏳ 待创建 |
| **SuggestionService** | Unit | `src/app/services/suggestionService.test.ts` | 80%+ | ⏳ 待创建 |
| **MVP Workflow** | Integration | `src/tests/integration/mvpWorkflows.test.tsx` | 80%+ | ⏳ 待创建 |

### 6.3 关键测试场景

1.  **AI 代码生成 (Unit & Integration)**
    *   Service 成功调用 API。
    *   Service 解析代码块。
    *   Service 处理 API 错误。
    *   Hook 状态转换 (Idle -> Loading -> Success/Error)。
    *   UI 输入框禁用逻辑。
    *   UI 错误消息显示。
    *   UI 代码复制功能。
    *   **集成**: 用户点击 "生成" -> Loading -> 显示结果 -> 复制成功。

2.  **导航 (Unit & Integration)**
    *   ActivityBar 渲染 'generator' 按钮。
    *   点击按钮调用 `onViewChange('generator')`。
    *   AICodeSystem 拦截并跳转到 `/ai-generator`。
    *   **集成**: 点击 Sidebar 图标 -> 页面跳转 -> 渲染 Generator Panel。

3.  **错误检测 (Unit)**
    *   检测 `var` 关键字。
    *   检测 `console.log`。
    *   生成质量评分。

4.  **代码建议 (Unit)**
    *   输入 `use` -> 返回 React Hooks 列表。
    *   按置信度排序。

---

## 7. API 设计

(保持原设计，仅增加前端服务的接口定义)

### 7.1 前端服务接口定义

```typescript
/**
 * AI Code Generation Request
 */
export interface CodeGenerationRequest {
  prompt: string;
  context?: string;
  language?: string;
  style?: 'concise' | 'verbose' | 'functional';
}

/**
 * AI Code Generation Response
 */
export interface CodeGenerationResponse {
  code: string;
  language: string;
  explanation?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * Code Error Item
 */
export interface CodeError {
  line: number;
  column: number;
  message: string;
  ruleId?: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

/**
 * Code Analysis Result
 */
export interface AnalysisResult {
  errors: CodeError[];
  suggestionsCount: number;
  score: number; // 0-100
}

/**
 * Code Suggestion Item
 */
export interface CodeSuggestion {
  text: string;
  type: 'function' | 'variable' | 'snippet' | 'import';
  confidence: number; // 0-1
  meta?: string; // e.g., "from 'react'"
}

/**
 * Code Analysis Result
 */
export interface AnalysisResult {
  errors: CodeError[];
  suggestionsCount: number;
  score: number; // 0-100
}

/**
 * Code Suggestion Item
 */
export interface CodeSuggestion {
  text: string;
  type: 'function' | 'variable' | 'snippet' | 'import';
  confidence: number; // 0-1
  meta?: string; // e.g., "from 'react'"
}
```

---

## 10. 开发时间表 (已更新)

### 10.1 Phase 1: 基础架构 (已完成 ✅)

| 任务 | 负责人 | 时间 | 状态 |
|------|--------|------|------|
| 搭建项目基础架构 (Vite, React, Tailwind) | 前端工程师 | 第 1 周 | ✅ 完成 |
| 配置 Vitest & Testing Library | 测试工程师 | 第 1 周 | ✅ 完成 |
| 创建基础组件 | 前端工程师 | 第 1 周 | ✅ 完成 |

### 10.2 Phase 2: MVP 核心功能 (已完成 ✅)

| 任务 | 负责人 | 时间 | 状态 |
|------|--------|------|------|
| **AI 代码生成** | AI 工程师 | 第 2 周 | ✅ 完成 |
|  • 实现 aiCodeService | AI 工程师 | - | ✅ 完成 |
|  • 实现 useAICodeGeneration Hook | AI 工程师 | - | ✅ 完成 |
|  • 实现 CodeGeneratorPanel UI | 前端工程师 | - | ✅ 完成 |
|  • 集成路由 | 前端工程师 | - | ✅ 完成 |
| **服务架构** | AI 工程师 | 第 2 周 | ✅ 完成 |
|  • 实现 WebSocketService 骨架 | 后端工程师 | - | ✅ 完成 |
|  • 实现 ErrorDetectionService 骨架 | AI 工程师 | - | ✅ 完成 |
|  • 实现 SuggestionService 骨架 | AI 工程师 | - | ✅ 完成 |
| **测试** | 测试工程师 | 第 2 周 | ✅ 完成 |
|  • Service 单元测试 | 测试工程师 | - | ✅ 完成 |
|  • Hook 单元测试 | 测试工程师 | - | ✅ 完成 |
|  • Mock 工具库 | 测试工程师 | - | ✅ 完成 |

### 10.3 Phase 3: 测试覆盖与优化 (进行中 ⏳)

| 任务 | 负责人 | 时间 | 状态 |
|------|--------|------|------|
| **组件测试** | 前端工程师 | 第 3 周 | ⏳ 进行中 |
|  • ActivityBar.test.tsx | 测试工程师 | - | ⏳ 待创建 |
|  • CodeGeneratorPanel.test.tsx | 测试工程师 | - | ⏳ 待创建 |
| **服务扩展测试** | AI 工程师 | 第 3 周 | ⏳ 待创建 |
|  • ErrorDetectionService.test.ts | 测试工程师 | - | ⏳ 待创建 |
|  • SuggestionService.test.ts | 测试工程师 | - | ⏳ 待创建 |
| **集成测试** | 测试工程师 | 第 3 周 | ⏳ 待创建 |
|  • MVP Workflow E2E Test | 测试工程师 | - | ⏳ 待创建 |
| **UI 优化** | UI 设计师 | 第 3 周 | ⏳ 待开始 |
|  • 完善 Generator Panel UI | UI 设计师 | - | ⏳ 待开始 |

---

(以下章节保持原设计)
