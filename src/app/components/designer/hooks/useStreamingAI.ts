/**
 * useStreamingAI — Shared streaming AI hook
 *
 * Supports: OpenAI-compatible APIs (GLM-4.5, GPT-4o-mini, Qwen, DeepSeek),
 *           Ollama native API, and local mock fallback.
 *
 * SSE (Server-Sent Events) streaming with token-by-token callback.
 */

import { useRef, useCallback, useState } from 'react';

/* ================================================================
   Types
   ================================================================ */

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'ollama' | 'custom' | 'mock';
  endpoint: string;
  apiKey: string;
}

export interface StreamingMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamingState {
  isStreaming: boolean;
  currentText: string;
  error: string | null;
  tokensUsed: number;
  latencyMs: number;
}

/* ================================================================
   Mock responses — used when no real API is available
   ================================================================ */

const MOCK_RESPONSES: Record<string, string> = {
  code: `Here's the generated component:

\`\`\`tsx
import React, { useState } from 'react';

interface FormProps {
  onSubmit: (data: FormData) => void;
}

interface FormData {
  username: string;
  email: string;
  role: string;
}

export function UserForm({ onSubmit }: FormProps) {
  const [form, setForm] = useState<FormData>({
    username: '',
    email: '',
    role: 'viewer',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div>
        <label className="text-sm text-gray-400 mb-1 block">Username</label>
        <input
          value={form.username}
          onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          placeholder="Enter username..."
        />
      </div>
      <div>
        <label className="text-sm text-gray-400 mb-1 block">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          placeholder="Enter email..."
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400"
      >
        Submit
      </button>
    </form>
  );
}
\`\`\`

The component includes form state management, validation-ready structure, and Tailwind styling.`,

  design: `Based on the current project structure, here are my recommendations:

### Layout Optimization
1. **Panel "User Dashboard"** — Consider splitting into 2 sub-panels: one for stats, one for the trend chart
2. **Panel "Data Table"** — Add pagination controls and a search filter above the table

### Component Properties
| Component | Suggested Change | Reason |
|-----------|-----------------|--------|
| Stat Card | Add \`trend: 'up'\` | Shows growth direction |
| Table | Set \`pageSize: 15\` | Better viewport fit |
| Chart | Switch to \`'area'\` type | Better trend visualization |

### Performance Tips
- Enable virtual scrolling for tables with >100 rows
- Use \`React.memo\` on Chart component to prevent unnecessary re-renders`,

  error: `### Diagnostic Report

**Severity: Medium**

Found **3 issues** in the current design:

1. **Panel Overlap Warning** — Panel "Dashboard" (0,0,6,8) and Panel "Table" (6,0,6,8) share the same row height. Consider adjusting grid proportions.

2. **Missing Data Binding** — Component \`comp-6\` (Chart) references \`local:analytics\` but no matching data source is configured.

3. **Accessibility** — Input components in Panel "Form" lack \`aria-label\` attributes. Add \`label\` props for screen reader support.

> All issues are non-blocking. The design is deployable.`,

  default: `I've analyzed your request. Here's what I can help with:

- **Code Generation** — I can generate React/Vue/Angular components from your design
- **Property Suggestions** — I can recommend optimal configurations
- **Error Diagnosis** — I can scan for layout conflicts and missing bindings
- **Documentation** — I can produce Markdown/MDX docs

What would you like me to do?`,
};

function getMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('code') || lower.includes('代码') || lower.includes('生成') || lower.includes('组件') || lower.includes('component'))
    return MOCK_RESPONSES.code;
  if (lower.includes('design') || lower.includes('设计') || lower.includes('建议') || lower.includes('推荐') || lower.includes('属性'))
    return MOCK_RESPONSES.design;
  if (lower.includes('error') || lower.includes('错误') || lower.includes('诊断') || lower.includes('检查') || lower.includes('bug'))
    return MOCK_RESPONSES.error;
  return MOCK_RESPONSES.default;
}

/* ================================================================
   Core streaming fetch — SSE parser
   ================================================================ */

async function streamOpenAICompatible(
  endpoint: string,
  apiKey: string,
  modelName: string,
  messages: StreamingMessage[],
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelName,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    let errMsg = `API ${resp.status}`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errJson.message || errMsg;
    } catch {
      if (errText) errMsg += `: ${errText.slice(0, 200)}`;
    }
    throw new Error(errMsg);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return full;
      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content || '';
        if (token) {
          full += token;
          onToken(token);
        }
      } catch { /* skip malformed */ }
    }
  }
  return full;
}

async function streamOllama(
  endpoint: string,
  modelName: string,
  messages: StreamingMessage[],
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<string> {
  const base = endpoint.replace(/\/+$/, '');
  const url = base.includes('/api/chat') ? base : `${base}/api/chat`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName.toLowerCase(),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    }),
    signal,
  });

  if (!resp.ok) throw new Error(`Ollama ${resp.status}: ${resp.statusText}`);

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        const token = json.message?.content || '';
        if (token) { full += token; onToken(token); }
        if (json.done) return full;
      } catch { /* skip */ }
    }
  }
  return full;
}

async function streamMock(
  prompt: string,
  onToken: (token: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const response = getMockResponse(prompt);
  let full = '';

  for (let i = 0; i < response.length; i++) {
    if (signal.aborted) throw new Error('Aborted');
    // Variable speed: faster for spaces, slower for code
    const ch = response[i];
    const delay = ch === ' ' ? 8 : ch === '\n' ? 15 : 12;
    await new Promise(r => setTimeout(r, delay));
    full += ch;
    onToken(ch);
  }
  return full;
}

/* ================================================================
   Hook: useStreamingAI
   ================================================================ */

export function useStreamingAI() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentText: '',
    error: null,
    tokensUsed: 0,
    latencyMs: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    model: AIModelConfig,
    messages: StreamingMessage[],
    onToken?: (fullTextSoFar: string) => void,
  ): Promise<string> => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ isStreaming: true, currentText: '', error: null, tokensUsed: 0, latencyMs: 0 });
    const start = performance.now();

    let accumulated = '';
    const handleToken = (token: string) => {
      accumulated += token;
      setState(prev => ({
        ...prev,
        currentText: accumulated,
        tokensUsed: Math.ceil(accumulated.length / 4),
      }));
      onToken?.(accumulated);
    };

    try {
      let result: string;

      if (model.provider === 'mock' || (!model.apiKey && model.provider !== 'ollama')) {
        // Use mock streaming when no API key
        const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
        result = await streamMock(lastUserMsg, handleToken, controller.signal);
      } else if (model.provider === 'ollama') {
        result = await streamOllama(model.endpoint, model.name, messages, controller.signal, handleToken);
      } else {
        // OpenAI-compatible (openai, custom, glm, qwen, deepseek)
        result = await streamOpenAICompatible(model.endpoint, model.apiKey, model.name, messages, controller.signal, handleToken);
      }

      const latency = Math.round(performance.now() - start);
      setState(prev => ({
        ...prev,
        isStreaming: false,
        currentText: result,
        latencyMs: latency,
        tokensUsed: Math.ceil(result.length / 4),
      }));
      return result;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setState(prev => ({ ...prev, isStreaming: false }));
        return accumulated;
      }
      const errMsg = err.message || 'Unknown error';
      setState(prev => ({ ...prev, isStreaming: false, error: errMsg }));
      throw err;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, isStreaming: false }));
  }, []);

  return { ...state, sendMessage, cancel };
}
