/**
 * @file aiCodeService.ts
 * @description YYC3 AI 代码生成服务 — 核心功能：根据自然语言描述生成代码
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,code-generation,service,mvp
 */

import { GLOBAL_AI_MODELS } from '../aiModelContext';

// ── Types ──

export interface CodeGenerationRequest {
  prompt: string;
  context?: string; // 当前代码上下文
  language?: string; // 目标编程语言
  style?: 'concise' | 'verbose' | 'functional'; // 代码风格
}

export interface CodeGenerationResponse {
  code: string;
  language: string;
  explanation?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

// ── System Prompts ──

const SYSTEM_PROMPT = `You are a senior software engineer and AI coding assistant.
Your task is to generate high-quality, clean, and maintainable code based on user requirements.

Requirements:
1. Provide complete, runnable code snippets.
2. Include comments for complex logic.
3. Adhere to modern best practices for the specified language.
4. If the request is ambiguous, ask clarifying questions (output as comments).

Output format:
- Return ONLY the code block.
- If explanation is needed, output as a markdown comment at the top.`;

// ── Service ──

/**
 * AI Code Generation Service
 */
export class AICodeService {
  private endpoint: string;
  private apiKey: string;
  private modelId: string;

  constructor(apiKey: string, modelId: string = 'gpt-4o-mini', endpoint?: string) {
    this.apiKey = apiKey;
    this.modelId = modelId;
    
    // 查找模型对应的 endpoint
    const modelConfig = GLOBAL_AI_MODELS.find(m => m.id === modelId);
    this.endpoint = endpoint || modelConfig?.endpoint || 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * 生成代码
   */
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    const { prompt, context = '', language = 'typescript', style = 'concise' } = request;

    // 构造完整的 Prompt
    const fullPrompt = `
Language: ${language}
Style: ${style}
Context:
${context}

User Request:
${prompt}

Generate the code below:
    `.trim();

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0.2, // 较低的温度以确保代码的准确性
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Request Failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '// No code generated';

      // 简单的解析：提取代码块
      const codeMatch = content.match(/```(\w+)?\n([\s\S]*?)\n```/);
      const rawCode = codeMatch ? codeMatch[2] : content;
      const detectedLang = codeMatch ? (codeMatch[1] || language) : language;

      return {
        code: rawCode.trim(),
        language: detectedLang,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
        },
      };

    } catch (error) {
      console.error('[AICodeService] Generation failed:', error);
      throw error;
    }
  }
}

// ── Singleton Helper ──

let serviceInstance: AICodeService | null = null;

export const getAICodeService = (apiKey: string, modelId?: string): AICodeService => {
  if (!serviceInstance || serviceInstance['apiKey'] !== apiKey) {
    serviceInstance = new AICodeService(apiKey, modelId);
  }
  return serviceInstance;
};
