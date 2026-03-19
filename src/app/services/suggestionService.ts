/**
 * @file suggestionService.ts
 * @description YYC3 个性化代码建议服务 — 基于用户风格和上下文提供补全
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,suggestion,autocomplete,skeleton
 */

// ── Types ──

export interface CodeSuggestion {
  text: string;
  type: 'function' | 'variable' | 'snippet' | 'import';
  confidence: number; // 0-1
  meta?: string; // e.g., "from 'react'"
}

export interface UserStyleProfile {
  preferredQuotes: 'single' | 'double';
  preferredSemicolons: boolean;
  indentation: '2' | '4';
}

// ── Service ──

/**
 * Suggestion Service
 */
export class SuggestionService {
  private userStyle: UserStyleProfile = {
    preferredQuotes: 'single',
    preferredSemicolons: true,
    indentation: '2',
  };

  /**
   * 基于上下文获取建议
   */
  async getSuggestions(code: string, cursorPosition: number): Promise<CodeSuggestion[]> {
    const prefix = code.substring(0, cursorPosition);
    const lastWord = this.getLastWord(prefix);

    // 1. 本地关键字匹配 (Mock)
    const localMatches = this.getLocalMatches(lastWord);

    // 2. AI 驱动的建议 (Mock)
    const aiMatches = await this.getAIMatches(prefix);

    // 3. 合并并排序
    const allMatches = [...localMatches, ...aiMatches];
    
    return allMatches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // 只返回前 5 个
  }

  /**
   * 保存用户风格偏好
   */
  saveUserStyle(prefs: Partial<UserStyleProfile>) {
    this.userStyle = { ...this.userStyle, ...prefs };
    // TODO: Persist to localStorage / DB
  }

  // ── Private Methods ──

  private getLastWord(prefix: string): string {
    const match = prefix.match(/[\w.]+$/);
    return match ? match[0] : '';
  }

  private getLocalMatches(word: string): CodeSuggestion[] {
    // Mock: 基于 React 的常见建议
    const commonImports = ['useState', 'useEffect', 'useMemo', 'useCallback', 'ref', 'forwardRef'];
    
    if (word.includes('use')) {
      return commonImports
        .filter(i => i.startsWith(word))
        .map(i => ({
          text: i,
          type: 'function' as const,
          confidence: 0.9,
          meta: "from 'react'",
        }));
    }

    return [];
  }

  private async getAIMatches(prefix: string): Promise<CodeSuggestion[]> {
    // Mock: 延迟模拟网络请求
    await new Promise(resolve => setTimeout(resolve, 50));

    // Mock: 如果用户输入 "log"，建议 "console.log"
    if (prefix.endsWith('log')) {
      return [{
        text: 'console.log()',
        type: 'snippet',
        confidence: 0.8,
      }];
    }

    return [];
  }
}

// Singleton
let serviceInstance: SuggestionService | null = null;

export const getSuggestionService = (): SuggestionService => {
  if (!serviceInstance) {
    serviceInstance = new SuggestionService();
  }
  return serviceInstance;
};
