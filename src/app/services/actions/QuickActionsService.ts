/**
 * @file QuickActionsService.ts
 * @description 智能一键操作服务 — 统一的代码/文档/文本/AI 操作引擎，含剪贴板管理、上下文感知
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,quick-actions,interaction,service,clipboard,code,text,document
 */

import type {
  ActionType, ActionContext, ActionConfig,
  ActionResult, ActionDef, ClipboardHistoryItem, ActionCategory,
} from '../../types/actions';

/* ================================================================
   Action Registry — 所有可用操作定义
   ================================================================ */

export const ACTION_REGISTRY: ActionDef[] = [
  // ── Code Actions ──
  { id: 'copy-code', type: 'copy', target: 'code', category: 'code', title: '复制代码', description: '复制选中代码到剪贴板', icon: 'Copy', requiresAI: false, requiresSelection: true },
  { id: 'copy-markdown', type: 'copy-markdown', target: 'code', category: 'code', title: '复制为 Markdown', description: '复制代码为 Markdown 代码块', icon: 'FileCode2', shortcut: 'Ctrl+Shift+M', requiresAI: false, requiresSelection: true },
  { id: 'copy-html', type: 'copy-html', target: 'code', category: 'code', title: '复制为 HTML', description: '复制代码为 HTML <pre> 标签', icon: 'Globe', requiresAI: false, requiresSelection: true },
  { id: 'format-code', type: 'format', target: 'code', category: 'code', title: '格式化代码', description: 'AI 辅助代码格式化', icon: 'AlignLeft', shortcut: 'Shift+Alt+F', requiresAI: true, requiresSelection: true },
  { id: 'refactor-code', type: 'refactor', target: 'code', category: 'code', title: '重构代码', description: 'AI 辅助代码重构', icon: 'RefreshCw', requiresAI: true, requiresSelection: true },
  { id: 'optimize-code', type: 'optimize', target: 'code', category: 'code', title: '优化代码', description: 'AI 辅助性能和可读性优化', icon: 'Zap', requiresAI: true, requiresSelection: true },

  // ── AI Actions ──
  { id: 'explain-code', type: 'explain', target: 'code', category: 'ai', title: '解释代码', description: 'AI 解释代码逻辑和用途', icon: 'BookOpen', shortcut: 'Ctrl+Shift+E', requiresAI: true, requiresSelection: true },
  { id: 'generate-tests', type: 'test-generate', target: 'code', category: 'ai', title: '生成测试', description: 'AI 生成单元测试用例', icon: 'FlaskConical', requiresAI: true, requiresSelection: true },
  { id: 'generate-docs', type: 'document-generate', target: 'code', category: 'ai', title: '生成文档', description: 'AI 生成 JSDoc/TSDoc 注释', icon: 'FileText', requiresAI: true, requiresSelection: true },
  { id: 'add-comments', type: 'comment', target: 'code', category: 'ai', title: '添加注释', description: 'AI 智能添加代码注释', icon: 'MessageSquarePlus', requiresAI: true, requiresSelection: true },
  { id: 'find-issues', type: 'find-issues', target: 'code', category: 'ai', title: '查找问题', description: 'AI 检测 Bug、安全隐患、性能问题', icon: 'Bug', requiresAI: true, requiresSelection: true },

  // ── Text Actions ──
  { id: 'translate-text', type: 'translate', target: 'text', category: 'text', title: '翻译', description: 'AI 翻译文本（中英互译）', icon: 'Languages', requiresAI: true, requiresSelection: true },
  { id: 'rewrite-text', type: 'rewrite', target: 'text', category: 'text', title: '改写', description: 'AI 改写文本提升质量', icon: 'Pen', requiresAI: true, requiresSelection: true },
  { id: 'expand-text', type: 'expand', target: 'text', category: 'text', title: '扩展', description: 'AI 扩展文本内容', icon: 'Expand', requiresAI: true, requiresSelection: true },
  { id: 'correct-text', type: 'correct', target: 'text', category: 'text', title: '纠错', description: 'AI 纠正语法拼写错误', icon: 'SpellCheck', requiresAI: true, requiresSelection: true },
  { id: 'summarize-text', type: 'summarize', target: 'text', category: 'text', title: '摘要', description: 'AI 生成文本摘要', icon: 'ListCollapse', requiresAI: true, requiresSelection: true },

  // ── Document Actions ──
  { id: 'format-doc', type: 'format', target: 'document', category: 'document', title: '格式化文档', description: 'AI 格式化文档结构', icon: 'FileType', requiresAI: true, requiresSelection: true },
  { id: 'convert-doc', type: 'convert', target: 'document', category: 'document', title: '转换格式', description: '转换文档格式 (Markdown/HTML/纯文本)', icon: 'ArrowRightLeft', requiresAI: false, requiresSelection: true },
  { id: 'export-doc', type: 'export', target: 'document', category: 'document', title: '导出文档', description: '导出为文件下载', icon: 'Download', requiresAI: false, requiresSelection: true },
];

/* ================================================================
   Category Metadata
   ================================================================ */

export const CATEGORY_META: Record<ActionCategory, { label: string; icon: string; color: string }> = {
  code: { label: '代码操作', icon: 'Code2', color: 'text-cyan-400' },
  ai: { label: 'AI 辅助', icon: 'Sparkles', color: 'text-amber-400' },
  text: { label: '文本操作', icon: 'Type', color: 'text-emerald-400' },
  document: { label: '文档操作', icon: 'FileText', color: 'text-violet-400' },
};

/* ================================================================
   Clipboard Manager
   ================================================================ */

const CLIPBOARD_STORAGE_KEY = 'yyc3-clipboard-history';
const MAX_CLIPBOARD_ITEMS = 50;

export class ClipboardManager {
  /** 复制文本到剪贴板 */
  static async copyToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }

  /** 添加到剪贴板历史 */
  static addToHistory(item: Omit<ClipboardHistoryItem, 'id' | 'copiedAt' | 'size'>): ClipboardHistoryItem {
    const entry: ClipboardHistoryItem = {
      ...item,
      id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      copiedAt: Date.now(),
      size: item.content.length,
    };

    try {
      const history = this.getHistory();
      history.unshift(entry);
      if (history.length > MAX_CLIPBOARD_ITEMS) history.pop();
      localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(history));
    } catch { /* quota exceeded → ignore */ }

    return entry;
  }

  /** 读取剪贴板历史 */
  static getHistory(): ClipboardHistoryItem[] {
    try {
      return JSON.parse(localStorage.getItem(CLIPBOARD_STORAGE_KEY) || '[]');
    } catch { return []; }
  }

  /** 清空剪贴板历史 */
  static clearHistory(): void {
    try { localStorage.removeItem(CLIPBOARD_STORAGE_KEY); } catch { /* ignore */ }
  }
}

/* ================================================================
   HTML Escape Utility
   ================================================================ */

function escapeHTML(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

/* ================================================================
   QuickActionsService — 核心执行引擎
   ================================================================ */

export class QuickActionsService {
  /* ── Code Actions ── */

  /** 复制代码 */
  static async copyCode(ctx: ActionContext): Promise<ActionResult> {
    const t0 = Date.now();
    if (!ctx.selection.text) return { success: false, error: '无选中内容', duration: 0 };

    await ClipboardManager.copyToClipboard(ctx.selection.text);
    ClipboardManager.addToHistory({
      content: ctx.selection.text,
      type: 'code',
      language: ctx.file?.language,
      sourceFile: ctx.file?.path,
    });

    return { success: true, content: '已复制到剪贴板', duration: Date.now() - t0 };
  }

  /** 复制代码为 Markdown */
  static async copyCodeAsMarkdown(ctx: ActionContext): Promise<ActionResult> {
    const t0 = Date.now();
    if (!ctx.selection.text) return { success: false, error: '无选中内容', duration: 0 };

    const lang = ctx.file?.language || 'text';
    const md = `\`\`\`${lang}\n${ctx.selection.text}\n\`\`\``;
    await ClipboardManager.copyToClipboard(md);
    ClipboardManager.addToHistory({ content: md, type: 'code', sourceFile: ctx.file?.path });

    return { success: true, content: '已复制为 Markdown 代码块', duration: Date.now() - t0 };
  }

  /** 复制代码为 HTML */
  static async copyCodeAsHTML(ctx: ActionContext): Promise<ActionResult> {
    const t0 = Date.now();
    if (!ctx.selection.text) return { success: false, error: '无选中内容', duration: 0 };

    const lang = ctx.file?.language || 'text';
    const html = `<pre><code class="language-${lang}">${escapeHTML(ctx.selection.text)}</code></pre>`;
    await ClipboardManager.copyToClipboard(html);
    ClipboardManager.addToHistory({ content: html, type: 'code', sourceFile: ctx.file?.path });

    return { success: true, content: '已复制为 HTML', duration: Date.now() - t0 };
  }

  /* ── AI-Powered Actions (Mock / Simulated) ── */

  /**
   * 通用 AI 操作入口 — 构建 prompt 并模拟 AI 响应
   * 在真实环境中应调用 useAIService 的 streaming 接口
   */
  static async executeAIAction(
    actionType: ActionType,
    ctx: ActionContext,
    _config?: ActionConfig,
  ): Promise<ActionResult> {
    const t0 = Date.now();
    if (!ctx.selection.text) return { success: false, error: '无选中内容', duration: 0 };

    const lang = ctx.file?.language || 'text';
    const code = ctx.selection.text;

    // Build prompt based on action type
    const prompt = this.buildPrompt(actionType, code, lang);

    // In a real implementation, this would call the AI service:
    // const response = await aiService.chat([{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]);
    // For now, return a simulated response
    const simulated = this.simulateAIResponse(actionType, code, lang);

    return {
      success: true,
      content: simulated,
      duration: Date.now() - t0,
      meta: { prompt, actionType, language: lang },
    };
  }

  /* ── Document Actions ── */

  /** 导出文档为文件 */
  static exportDocument(ctx: ActionContext, format: 'markdown' | 'html' | 'txt' = 'markdown'): ActionResult {
    const t0 = Date.now();
    if (!ctx.selection.text) return { success: false, error: '无选中内容', duration: 0 };

    const mimeMap = { markdown: 'text/markdown', html: 'text/html', txt: 'text/plain' };
    const extMap = { markdown: '.md', html: '.html', txt: '.txt' };

    const blob = new Blob([ctx.selection.text], { type: mimeMap[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document${extMap[format]}`;
    a.click();
    URL.revokeObjectURL(url);

    return { success: true, content: `已导出为 ${format} 文件`, duration: Date.now() - t0 };
  }

  /** 纯文本格式转换 (Markdown → HTML 等) */
  static convertFormat(text: string, from: string, to: string): string {
    // Simple Markdown → HTML conversion (no external lib needed for basic)
    if (from === 'markdown' && to === 'html') {
      return text
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>\n');
    }
    if (from === 'html' && to === 'text') {
      return text.replace(/<[^>]+>/g, '');
    }
    return text;
  }

  /* ── Prompt Builder ── */

  private static buildPrompt(type: ActionType, code: string, language: string): string {
    const codeBlock = `\`\`\`${language}\n${code}\n\`\`\``;

    const prompts: Partial<Record<ActionType, string>> = {
      'explain': `请解释以下 ${language} 代码的功能、逻辑和设计思路：\n\n${codeBlock}\n\n请包含：\n- 总体功能描述\n- 关键逻辑流程\n- 使用的设计模式\n- 潜在改进点`,
      'refactor': `请重构以下 ${language} 代码，提升可读性、可维护性和设计质量：\n\n${codeBlock}\n\n只输出重构后的代码，无需解释。`,
      'optimize': `请优化以下 ${language} 代码的性能和效率：\n\n${codeBlock}\n\n请提供：\n1. 优化后的代码\n2. 简要说明所做的优化`,
      'format': `请格式化以下 ${language} 代码，遵循最佳实践：\n\n${codeBlock}\n\n只输出格式化后的代码。`,
      'test-generate': `请为以下 ${language} 代码生成全面的单元测试，使用 Vitest 框架：\n\n${codeBlock}\n\n包含正常路径、边界条件和错误处理测试。`,
      'document-generate': `请为以下 ${language} 代码生成完整的 JSDoc/TSDoc 文档注释：\n\n${codeBlock}\n\n包含函数描述、参数、返回值和使用示例。`,
      'comment': `请为以下 ${language} 代码添加清晰的行内注释和块注释：\n\n${codeBlock}\n\n只输出带注释的代码。`,
      'find-issues': `请检查以下 ${language} 代码中的潜在问题：\n\n${codeBlock}\n\n请检查：Bug、安全隐患、性能问题、代码异味、最佳实践违规。`,
      'translate': `请翻译以下文本（如果是中文翻译为英文，如果是英文翻译为中文）：\n\n${code}\n\n只输出翻译结果。`,
      'rewrite': `请改写以下文本，提升清晰度、简洁性和表达力：\n\n${code}\n\n只输出改写后的文本。`,
      'expand': `请扩展以下文本，添加相关细节、示例和解释：\n\n${code}\n\n保持原有风格。`,
      'correct': `请纠正以下文本中的语法、拼写和标点错误：\n\n${code}\n\n只输出纠正后的文本。`,
      'summarize': `请为以下文本生成简明摘要：\n\n${code}\n\n包含核心要点和关键信息。`,
    };

    return prompts[type] || `请处理以下内容：\n\n${codeBlock}`;
  }

  /* ── Simulated AI Responses ── */

  private static simulateAIResponse(type: ActionType, code: string, language: string): string {
    const lineCount = code.split('\n').length;
    const charCount = code.length;

    const responses: Partial<Record<ActionType, string>> = {
      'explain': [
        `## 代码解析\n\n`,
        `这段 ${language} 代码共 ${lineCount} 行，主要功能：\n\n`,
        `### 核心逻辑\n`,
        `- 定义了数据处理和状态管理逻辑\n`,
        `- 使用了常见的 ${language} 设计模式\n`,
        `- 包含错误处理和边界条件检查\n\n`,
        `### 建议改进\n`,
        `1. 考虑添加更完善的类型注解\n`,
        `2. 可以抽取公共逻辑为独立函数\n`,
        `3. 建议增加单元测试覆盖\n`,
      ].join(''),

      'refactor': [
        `// Refactored version with improved structure\n`,
        code.replace(/var /g, 'const ').replace(/function /g, 'const fn = '),
      ].join(''),

      'optimize': [
        `## 优化建议\n\n`,
        `### 优化后代码\n`,
        `\`\`\`${language}\n${code}\n\`\`\`\n\n`,
        `### 优化说明\n`,
        `1. **内存优化**: 减少临时变量创建\n`,
        `2. **算法优化**: 使用更高效的数据结构\n`,
        `3. **渲染优化**: 添加 useMemo/useCallback 缓存\n`,
      ].join(''),

      'test-generate': [
        `\`\`\`${language}\n`,
        `import { describe, it, expect, vi } from 'vitest';\n\n`,
        `describe('模块测试', () => {\n`,
        `  it('应正确处理正常输入', () => {\n`,
        `    // Arrange\n`,
        `    const input = {};\n`,
        `    // Act & Assert\n`,
        `    expect(input).toBeDefined();\n`,
        `  });\n\n`,
        `  it('应处理边界条件', () => {\n`,
        `    expect(() => {}).not.toThrow();\n`,
        `  });\n\n`,
        `  it('应处理错误情况', () => {\n`,
        `    expect(() => { throw new Error('test'); }).toThrow('test');\n`,
        `  });\n`,
        `});\n`,
        `\`\`\``,
      ].join(''),

      'document-generate': [
        `\`\`\`${language}\n`,
        `/**\n`,
        ` * 模块描述 — 基于 ${lineCount} 行 ${language} 代码生成\n`,
        ` *\n`,
        ` * @module ModuleName\n`,
        ` * @description 自动生成的文档注释\n`,
        ` * @example\n`,
        ` * // 基本用法\n`,
        ` * import { fn } from './module';\n`,
        ` * const result = fn(args);\n`,
        ` */\n`,
        `\`\`\``,
      ].join(''),

      'comment': `// 以下是带注释版本 (${lineCount} 行代码)\n${code.split('\n').map((line, i) => i % 3 === 0 && line.trim() ? `// ${line.trim().slice(0, 40)}...\n${line}` : line).join('\n')}`,

      'find-issues': [
        `## 代码检查报告\n\n`,
        `扫描 ${lineCount} 行 ${language} 代码，发现以下潜在问题：\n\n`,
        `### 1. 类型安全 (中等)\n`,
        `- 部分变量缺少显式类型注解\n`,
        `- 建议启用 strict 模式\n\n`,
        `### 2. 错误处理 (建议)\n`,
        `- 异步操作缺少 try-catch 保护\n`,
        `- 建议添加全局错误边界\n\n`,
        `### 3. 性能 (提示)\n`,
        `- 可考虑使用 memo 减少重渲染\n`,
        `- 大列表建议使用虚拟化\n`,
      ].join(''),

      'translate': (/[\u4e00-\u9fff]/.test(code))
        ? `[Translated to English]\n\n${code.slice(0, 200)}...`
        : `[翻译为中文]\n\n${code.slice(0, 200)}...`,

      'rewrite': `[改写版本]\n\n${code}`,
      'expand': `[扩展版本]\n\n${code}\n\n以上内容的进一步展开说明...`,
      'correct': code,
      'summarize': `## 摘要\n\n该内容共 ${charCount} 字符，核心要点如下：\n- 主要内容涉及 ${language} 相关逻辑\n- 包含数据处理和状态管理\n- 整体结构清晰，逻辑完整`,
    };

    return responses[type] || `[${type}] 操作完成`;
  }

  /* ── Dispatcher — 根据 ActionDef 调度执行 ── */

  static async dispatch(
    action: ActionDef,
    ctx: ActionContext,
    config?: ActionConfig,
  ): Promise<ActionResult> {
    switch (action.type) {
      case 'copy': return this.copyCode(ctx);
      case 'copy-markdown': return this.copyCodeAsMarkdown(ctx);
      case 'copy-html': return this.copyCodeAsHTML(ctx);
      case 'export': return this.exportDocument(ctx, config?.params?.format || 'markdown');
      case 'convert': {
        const t0 = Date.now();
        const result = this.convertFormat(
          ctx.selection.text,
          config?.params?.fromFormat || 'markdown',
          config?.params?.toFormat || 'html',
        );
        return { success: true, content: result, duration: Date.now() - t0 };
      }
      default:
        // All AI-powered actions
        return this.executeAIAction(action.type, ctx, config);
    }
  }
}
