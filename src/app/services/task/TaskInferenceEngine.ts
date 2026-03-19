/**
 * @file TaskInferenceEngine.ts
 * @description 任务推理引擎 — 从 AI 对话/代码/描述中智能提取任务
 *              v2: 接入真实 AI 提供商（读取 useAIService 的 localStorage 配置，
 *              直接 fetch OpenAI-compatible API），若 AI 不可用则降级为本地正则提取
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,task-board,inference,extraction,ai-service
 */

import type { TaskInference, Task } from '../../types/task';

/* ================================================================
   AI Config Reader — reads the same localStorage key as useAIService
   ================================================================ */

const AI_CONFIG_KEY = 'yyc3-ai-service-config';

interface MinimalProvider {
  id: string;
  displayName: string;
  baseURL: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
  models: Array<{ id: string; name: string; enabled: boolean }>;
}

interface MinimalAIConfig {
  providers: MinimalProvider[];
  activeProvider: string;
  activeModel: string;
}

function readAIConfig(): MinimalAIConfig | null {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as MinimalAIConfig;
    if (!cfg.providers || cfg.providers.length === 0) return null;
    return cfg;
  } catch {
    return null;
  }
}

/** Pick the best available provider + model */
function pickProviderModel(cfg: MinimalAIConfig): { provider: MinimalProvider; modelName: string } | null {
  // Try active provider first
  const active = cfg.providers.find(p => p.id === cfg.activeProvider && p.enabled && p.apiKey);
  if (active) {
    const model = active.models.find(m => m.id === cfg.activeModel && m.enabled)
      || active.models.find(m => m.enabled)
      || active.models[0];
    if (model) return { provider: active, modelName: model.name };
  }
  // Fallback: first enabled provider with apiKey
  const fallback = cfg.providers
    .filter(p => p.enabled && p.apiKey)
    .sort((a, b) => a.priority - b.priority)[0];
  if (fallback) {
    const model = fallback.models.find(m => m.enabled) || fallback.models[0];
    if (model) return { provider: fallback, modelName: model.name };
  }
  return null;
}

/* ================================================================
   System Prompt for AI Task Extraction
   ================================================================ */

const TASK_EXTRACTION_SYSTEM_PROMPT = `You are an expert project manager and task analyst for the YYC³ IDE platform.
Extract actionable tasks from the user's input. For each task, provide:

Respond ONLY with a valid JSON array (no markdown fences). Each element:
{
  "title": "Brief task title (Chinese or English, match input language)",
  "description": "One-sentence description",
  "type": "feature" | "bug" | "refactor" | "test" | "documentation" | "other",
  "priority": "critical" | "high" | "medium" | "low",
  "estimatedHours": number | null,
  "tags": ["string"],
  "confidence": 0.0-1.0,
  "reasoning": "Why this is a task"
}

Rules:
- Only include ACTIONABLE items, not observations
- Confidence >= 0.6
- Keep titles concise (< 80 chars)
- If nothing actionable, return []`;

/* ================================================================
   TaskInferenceEngine
   ================================================================ */

export class TaskInferenceEngine {

  /* ── Public: async AI-first methods ── */

  async inferTasksFromConversationAsync(
    messages: Array<{ role: string; content: string }>,
  ): Promise<TaskInference[]> {
    const text = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    return this.aiExtractWithFallback(
      `Analyze the following conversation and extract all tasks:\n\n${text}`,
      () => this.extractFromText(text, 'conversation'),
    );
  }

  async inferTasksFromCodeAsync(code: string, language: string): Promise<TaskInference[]> {
    return this.aiExtractWithFallback(
      `Extract tasks from the following ${language} code (TODO, FIXME, HACK, etc.):\n\n\`\`\`${language}\n${code}\n\`\`\``,
      () => this.extractFromCode(code),
    );
  }

  async inferTasksFromDescriptionAsync(description: string): Promise<TaskInference[]> {
    return this.aiExtractWithFallback(
      `Break down this description into individual actionable tasks:\n\n${description}`,
      () => this.extractFromText(description, 'description'),
    );
  }

  /* ── Sync methods (regex-only, preserved for backward compat) ── */

  inferTasksFromConversation(
    messages: Array<{ role: string; content: string }>,
  ): TaskInference[] {
    const allText = messages.map(m => m.content).join('\n');
    return this.extractFromText(allText, 'conversation');
  }

  inferTasksFromCode(code: string, _language: string): TaskInference[] {
    return this.extractFromCode(code);
  }

  inferTasksFromDescription(description: string): TaskInference[] {
    return this.extractFromText(description, 'description');
  }

  inferDependencies(tasks: Task[]): Map<string, string[]> {
    const deps = new Map<string, string[]>();
    for (const task of tasks) {
      const depIds: string[] = [];
      for (const other of tasks) {
        if (other.id === task.id) continue;
        const keywords = other.title.split(/\s+/).filter(w => w.length > 2);
        const hasRef = keywords.some(kw =>
          (task.description || '').toLowerCase().includes(kw.toLowerCase()) ||
          task.title.toLowerCase().includes(kw.toLowerCase())
        );
        if (hasRef) depIds.push(other.id);
      }
      if (depIds.length > 0) deps.set(task.id, depIds);
    }
    return deps;
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Private — AI call with fallback
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  private async aiExtractWithFallback(
    userPrompt: string,
    fallback: () => TaskInference[],
  ): Promise<TaskInference[]> {
    // Try real AI first
    try {
      const cfg = readAIConfig();
      if (!cfg) throw new Error('No AI config');
      const pm = pickProviderModel(cfg);
      if (!pm) throw new Error('No enabled provider');

      const { provider, modelName } = pm;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const response = await fetch(`${provider.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: TASK_EXTRACTION_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`API ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content: string = data.choices?.[0]?.message?.content || '';

      const parsed = this.parseAIResponse(content);
      if (parsed.length > 0) {
        console.info(`[TaskInference] AI extracted ${parsed.length} tasks via ${provider.displayName}/${modelName}`);
        return parsed;
      }

      // AI returned empty — use fallback
      return fallback();
    } catch (err) {
      console.warn('[TaskInference] AI unavailable, falling back to regex:', (err as Error).message);
      return fallback();
    }
  }

  /** Parse the JSON array from AI response content */
  private parseAIResponse(content: string): TaskInference[] {
    try {
      // Strip markdown fences if present
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const items: any[] = JSON.parse(jsonMatch[0]);
      return items
        .filter(item => item && item.title && (item.confidence ?? 0.8) >= 0.5)
        .map(item => ({
          task: {
            title: String(item.title).slice(0, 200),
            description: item.description || undefined,
            status: 'todo' as const,
            priority: (['critical', 'high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium') as any,
            type: (['feature', 'bug', 'refactor', 'test', 'documentation', 'other'].includes(item.type) ? item.type : 'other') as any,
            estimatedHours: typeof item.estimatedHours === 'number' ? item.estimatedHours : undefined,
            tags: Array.isArray(item.tags) ? item.tags.map(String) : ['AI'],
          },
          confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.8)),
          reasoning: item.reasoning || 'AI inferred',
          context: 'ai-provider',
        }));
    } catch (err) {
      console.warn('[TaskInference] Failed to parse AI JSON:', err);
      return [];
    }
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Private — Local regex extraction (fallback)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  private extractFromText(text: string, source: 'conversation' | 'description'): TaskInference[] {
    const results: TaskInference[] = [];
    const seen = new Set<string>();

    const checkboxRe = /(?:^|\n)\s*[-*]\s*\[[ x]\]\s*(.+)/gim;
    let m: RegExpExecArray | null;
    while ((m = checkboxRe.exec(text)) !== null) {
      const title = m[1].trim();
      if (title.length > 2 && title.length < 200 && !seen.has(title)) {
        seen.add(title);
        results.push(this.buildInference(title, 0.9, 'checkbox', source));
      }
    }

    const numberedRe = /(?:^|\n)\s*\d+[.)]\s+(.+)/gm;
    while ((m = numberedRe.exec(text)) !== null) {
      const title = m[1].trim();
      if (title.length > 4 && title.length < 200 && !seen.has(title)) {
        seen.add(title);
        results.push(this.buildInference(title, 0.75, 'numbered-list', source));
      }
    }

    const actionRe = /(?:需要|TODO|FIXME|HACK|应该|请|建议|必须|记得|别忘了|fix|implement|add|create|update|remove|refactor)[:：]?\s*(.{5,120})/gim;
    while ((m = actionRe.exec(text)) !== null) {
      const title = m[1].trim().replace(/[。.!！?？]+$/, '');
      if (title.length > 4 && !seen.has(title)) {
        seen.add(title);
        const isTodo = /TODO|FIXME|HACK/i.test(m[0]);
        results.push(this.buildInference(title, isTodo ? 0.85 : 0.65, 'keyword', source));
      }
    }

    return results;
  }

  private extractFromCode(code: string): TaskInference[] {
    const results: TaskInference[] = [];
    const seen = new Set<string>();

    const commentRe = /(?:\/\/|#|\/\*|\*)\s*(TODO|FIXME|HACK|BUG|XXX)[:：]?\s*(.+?)(?:\*\/)?$/gim;
    let m: RegExpExecArray | null;
    while ((m = commentRe.exec(code)) !== null) {
      const tag = m[1].toUpperCase();
      const title = m[2].trim();
      if (title.length > 2 && !seen.has(title)) {
        seen.add(title);
        const typeMap: Record<string, string> = {
          'TODO': 'feature', 'FIXME': 'bug', 'HACK': 'refactor', 'BUG': 'bug', 'XXX': 'refactor',
        };
        const priorityMap: Record<string, string> = {
          'TODO': 'medium', 'FIXME': 'high', 'HACK': 'medium', 'BUG': 'high', 'XXX': 'low',
        };
        results.push({
          task: {
            title,
            description: `从代码注释 ${tag} 中提取`,
            status: 'todo',
            priority: (priorityMap[tag] as any) || 'medium',
            type: (typeMap[tag] as any) || 'other',
            tags: [tag, 'code'],
          },
          confidence: 0.92,
          reasoning: `代码中 ${tag} 注释`,
          context: 'code-comment',
        });
      }
    }

    return results;
  }

  private buildInference(
    title: string,
    confidence: number,
    reasoning: string,
    context: string,
  ): TaskInference {
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    if (/紧急|urgent|critical|asap|立即|马上/i.test(title)) priority = 'critical';
    else if (/重要|important|必须|must|high/i.test(title)) priority = 'high';
    else if (/低|low|minor|小/i.test(title)) priority = 'low';

    let type: 'feature' | 'bug' | 'refactor' | 'test' | 'documentation' | 'other' = 'other';
    if (/fix|bug|修复|错误|问题/i.test(title)) type = 'bug';
    else if (/refactor|重构|优化/i.test(title)) type = 'refactor';
    else if (/test|测试|覆盖/i.test(title)) type = 'test';
    else if (/doc|文档|注释|说明/i.test(title)) type = 'documentation';
    else if (/add|create|implement|新增|添加|实现|feature|功能/i.test(title)) type = 'feature';

    return {
      task: {
        title,
        status: 'todo',
        priority,
        type,
        tags: ['AI'],
      },
      confidence,
      reasoning,
      context,
    };
  }
}

/** 全局单例 */
export const taskInferenceEngine = new TaskInferenceEngine();
