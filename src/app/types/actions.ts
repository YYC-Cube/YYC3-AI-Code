/**
 * @file actions.ts
 * @description 一键操作交互核心类型定义 — 代码/文档/文本/AI 操作、剪贴板管理、上下文感知
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,quick-actions,interaction,types
 */

/* ================================================================
   操作类型
   ================================================================ */

/** 操作类型枚举 */
export type ActionType =
  | 'copy'
  | 'copy-markdown'
  | 'copy-html'
  | 'replace'
  | 'refactor'
  | 'optimize'
  | 'format'
  | 'convert'
  | 'summarize'
  | 'translate'
  | 'rewrite'
  | 'expand'
  | 'correct'
  | 'explain'
  | 'comment'
  | 'find-issues'
  | 'test-generate'
  | 'document-generate'
  | 'export';

/** 操作目标类型 */
export type ActionTarget = 'code' | 'text' | 'document' | 'file';

/** 操作状态 */
export type ActionStatus = 'idle' | 'processing' | 'success' | 'error';

/** 操作分类 */
export type ActionCategory = 'code' | 'document' | 'text' | 'ai';

/* ================================================================
   操作接口
   ================================================================ */

/** 操作定义 */
export interface ActionDef {
  /** 操作 ID */
  id: string;
  /** 操作类型 */
  type: ActionType;
  /** 操作目标 */
  target: ActionTarget;
  /** 操作分类 */
  category: ActionCategory;
  /** 操作标题 */
  title: string;
  /** 操作描述 */
  description: string;
  /** 操作图标名 (lucide-react) */
  icon: string;
  /** 操作快捷键 */
  shortcut?: string;
  /** 是否需要 AI */
  requiresAI: boolean;
  /** 是否需要选中内容 */
  requiresSelection: boolean;
}

/** 操作运行时状态 */
export interface ActionState {
  /** 操作定义 ID */
  actionId: string;
  /** 操作状态 */
  status: ActionStatus;
  /** 操作结果 */
  result?: string;
  /** 错误信息 */
  error?: string;
  /** 处理开始时间 */
  startedAt?: number;
  /** 处理结束时间 */
  completedAt?: number;
}

/* ================================================================
   操作上下文
   ================================================================ */

/** 操作上下文 */
export interface ActionContext {
  /** 选中的内容 */
  selection: {
    text: string;
    startLine?: number;
    endLine?: number;
    startColumn?: number;
    endColumn?: number;
  };
  /** 文件信息 */
  file?: {
    path: string;
    name: string;
    language: string;
    content: string;
  };
  /** 编辑器信息 */
  editor?: {
    cursorPosition: { line: number; column: number };
    selectionRange?: { start: number; end: number };
  };
  /** 项目信息 */
  project?: {
    path: string;
    name: string;
  };
}

/* ================================================================
   操作配置
   ================================================================ */

/** 操作配置 */
export interface ActionConfig {
  /** 操作类型 */
  type: ActionType;
  /** 操作参数 */
  params?: Record<string, any>;
  /** 是否使用 AI */
  useAI?: boolean;
  /** AI 模型 */
  aiModel?: string;
  /** AI 温度 */
  temperature?: number;
  /** 最大 tokens */
  maxTokens?: number;
}

/* ================================================================
   剪贴板历史
   ================================================================ */

/** 剪贴板历史项 */
export interface ClipboardHistoryItem {
  /** 历史项 ID */
  id: string;
  /** 内容 */
  content: string;
  /** 内容类型 */
  type: 'text' | 'code' | 'image';
  /** 复制时间 */
  copiedAt: number;
  /** 来源文件 */
  sourceFile?: string;
  /** 内容语言 */
  language?: string;
  /** 内容大小 (字符数) */
  size: number;
}

/* ================================================================
   操作执行结果
   ================================================================ */

/** 操作执行结果 */
export interface ActionResult {
  /** 是否成功 */
  success: boolean;
  /** 结果内容 */
  content?: string;
  /** 错误信息 */
  error?: string;
  /** 执行耗时 (ms) */
  duration: number;
  /** 附加数据 */
  meta?: Record<string, any>;
}
