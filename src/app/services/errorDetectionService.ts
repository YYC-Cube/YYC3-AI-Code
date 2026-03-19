/**
 * @file errorDetectionService.ts
 * @description YYC3 错误检测服务 — 智能错误检测与修复建议
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags lint,error-detection,ai,skeleton
 */

// ── Types ──

export interface CodeError {
  line: number;
  column: number;
  message: string;
  ruleId?: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string; // AI generated fix
}

export interface AnalysisResult {
  errors: CodeError[];
  suggestionsCount: number;
  score: number; // 0-100
}

// ── Service ──

/**
 * Error Detection Service
 * Mock implementation for MVP.
 */
export class ErrorDetectionService {
  /**
   * 分析代码并检测错误
   * 模拟实现：实际应集成 ESLint 或 LSP
   */
  async analyzeCode(code: string, language: string): Promise<AnalysisResult> {
    // 1. Static Analysis (Mock)
    const staticErrors = this.runStaticChecks(code);

    // 2. AI Enhancement (Mock)
    // TODO: 调用 AI 模型为错误提供解释和修复建议
    const errorsWithAI = await this.enrichWithAI(staticErrors);

    // 3. Calculate Score
    const score = this.calculateScore(errorsWithAI);

    return {
      errors: errorsWithAI,
      suggestionsCount: errorsWithAI.filter(e => e.suggestion).length,
      score,
    };
  }

  /**
   * 运行基础静态检查
   */
  private runStaticChecks(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = code.split('\n');

    // 简单的 Mock 规则
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Mock: 检查 console.log
      if (line.includes('console.log')) {
        errors.push({
          line: lineNum,
          column: line.indexOf('console.log'),
          message: 'Unexpected console statement.',
          severity: 'warning',
          ruleId: 'no-console',
        });
      }

      // Mock: 检查 var
      if (line.trim().startsWith('var ')) {
        errors.push({
          line: lineNum,
          column: line.indexOf('var'),
          message: '`var` declarations are discouraged. Use `let` or `const`.',
          severity: 'error',
          ruleId: 'no-var',
        });
      }
    });

    return errors;
  }

  /**
   * 使用 AI 增强错误信息
   */
  private async enrichWithAI(errors: CodeError[]): Promise<CodeError[]> {
    // Mock: 为每个错误添加 AI 建议
    return errors.map(err => ({
      ...err,
      suggestion: this.getMockSuggestion(err),
    }));
  }

  private getMockSuggestion(err: CodeError): string {
    if (err.ruleId === 'no-console') {
      return 'Consider removing this before production or use a logging library.';
    }
    if (err.ruleId === 'no-var') {
      return 'Replace `var` with `const` if the value is not reassigned, or `let` otherwise.';
    }
    return 'Review this line for potential issues.';
  }

  private calculateScore(errors: CodeError[]): number {
    let score = 100;
    errors.forEach(err => {
      if (err.severity === 'error') score -= 10;
      if (err.severity === 'warning') score -= 5;
      if (err.severity === 'info') score -= 2;
    });
    return Math.max(0, score);
  }
}

// Singleton
let serviceInstance: ErrorDetectionService | null = null;

export const getErrorDetectionService = (): ErrorDetectionService => {
  if (!serviceInstance) {
    serviceInstance = new ErrorDetectionService();
  }
  return serviceInstance;
};
