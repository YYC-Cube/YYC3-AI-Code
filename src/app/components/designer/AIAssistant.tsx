import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X, Send, Sparkles, Code, FileText, AlertTriangle, Wand2,
  Copy, Check, Bot, User, Loader, Wifi, WifiOff, Settings,
  PanelTop, Layers, RefreshCw
} from 'lucide-react';
import { useDesigner, type AIModel, COMPONENT_LIBRARY, type ComponentDef } from '../../store';
import { useGlobalAI } from '../../aiModelContext';
import { copyToClipboard } from '../../utils/clipboard';
import { useThemeTokens } from './hooks/useThemeTokens';
import type { ThemeTokens } from './hooks/useThemeTokens';

/* ================================================================
   Quick Actions — inject as user prompt with context
   ================================================================ */

const AI_QUICK_ACTIONS = [
  { icon: PanelTop,      label: '生成面板', prompt: '请为我生成一个面板设计，以 JSON 格式返回，包含 panels 数组和 children 组件数组。每个组件使用以下可用类型之一：Button, Input, Select, Checkbox, Switch, Textarea, Table, Chart, Card, Text, Image, Stat, List, Progress, Badge, Divider, Avatar, DatePicker, Markdown, CodeBlock。示例格式：\n```json\n{"panels":[{"name":"用户管理","type":"form","children":[{"type":"Input","label":"用户名","props":{"placeholder":"输入用户名","required":true}},{"type":"Select","label":"角色","props":{"placeholder":"选择角色","options":["管理员","编辑","访客"]}},{"type":"Button","label":"提交","props":{"label":"提交","variant":"primary"}}]}]}\n```\n请基于当前项目需求，设计一个实用的面板。' },
  { icon: Wand2,         label: '属性建议', prompt: '请基于当前项目中选中的组件，智能推荐最佳属性配置。列出每个属性的建议值和理由。' },
  { icon: Code,          label: '生成代码', prompt: '请为当前设计面板生成完整的 React TSX 代码，包括所有组件和布局，使用 Tailwind CSS。' },
  { icon: AlertTriangle, label: '错误诊断', prompt: '请检查当前项目的面板布局和组件配置，诊断存在冲突、缺失属性、响应式问题或性能瓶颈。' },
  { icon: FileText,      label: '生成文档', prompt: '请为当前项目生成一份完整的 Markdown 交互文档，包括页面结构、组件说明、交互流程。' },
];

/* ================================================================
   Build system prompt with real project context
   ================================================================ */

function buildSystemPrompt(
  panels: { id: string; name: string; type: string; children: string[] }[],
  components: { id: string; type: string; label: string; props: Record<string, any>; panelId: string }[],
  projectName: string
): string {
  const panelDesc = panels.map(p => {
    const comps = components.filter(c => c.panelId === p.id);
    const compList = comps.map(c => `    - ${c.id}: ${c.type}「${c.label}」props=${JSON.stringify(c.props)}`).join('\n');
    return `  面板「${p.name}」(${p.id}, type=${p.type})\n${compList || '    (空)'}`;
  }).join('\n');

  return `你是 YANYUCLOUD 低代码设计器的 AI 助手。你的任务是帮助用户设计和构建 Web 应用界面。

当前项目：${projectName}
面板数：${panels.length}
组件数：${components.length}

项目结构：
${panelDesc}

技术栈：React 18 + TypeScript + Tailwind CSS v4 + react-grid-layout + react-dnd
设计模式：深色主题 IDE 风格，12列网格布局

你的能力：
1. 分析组件属性并推荐最佳配置
2. 生成可运行的 React TSX 代码
3. 诊断布局冲突和性能问题
4. 生成交互文档

请用中文回答，Markdown 格式，代码块标注语言。回答要简洁专业。`;
}

/* ================================================================
   Real LLM API — streaming fetch
   ================================================================ */

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

async function callLLM(
  model: AIModel,
  messages: { role: string; content: string }[],
  signal: AbortSignal,
  callbacks: StreamCallbacks
) {
  const { provider, endpoint, apiKey, name } = model;

  // --- Ollama native API ---
  if (provider === 'ollama') {
    // Ollama /api/chat endpoint — NDJSON streaming
    const ollamaBase = endpoint.replace(/\/+$/, '');
    const url = ollamaBase.includes('/api/chat') ? ollamaBase : `${ollamaBase}/api/chat`;

    const body = {
      model: name.toLowerCase(),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`Ollama ${resp.status}: ${errText || resp.statusText}`);
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
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const token = json.message?.content || '';
          if (token) {
            full += token;
            callbacks.onToken(token);
          }
          if (json.done) {
            callbacks.onDone(full);
            return;
          }
        } catch { /* skip malformed lines */ }
      }
    }
    callbacks.onDone(full);
    return;
  }

  // --- OpenAI-compatible API (OpenAI / GLM / Qwen / custom) ---
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Determine the model name to send
  // For custom providers the model name mapping varies
  let modelId = name;
  if (provider === 'openai') {
    modelId = name.toLowerCase().replace(/\s+/g, '-');
  }

  const body = {
    model: modelId,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  };

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    // Parse common error formats
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
      if (data === '[DONE]') {
        callbacks.onDone(full);
        return;
      }
      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content || '';
        if (token) {
          full += token;
          callbacks.onToken(token);
        }
      } catch { /* skip */ }
    }
  }
  callbacks.onDone(full);
}

/* ================================================================
   Markdown Renderer (unchanged)
   ================================================================ */

function MarkdownContent({ content, tokens }: { content: string; tokens?: ThemeTokens }) {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';
  let blockKey = 0;

  const flushCode = () => {
    const code = codeLines.join('\n');
    const key = `cb-${blockKey++}`;
    elements.push(
      <div key={key} className={`my-2 rounded-lg overflow-hidden border ${tokens?.inputBorder || 'border-white/[0.06]'}`}>
        {codeLang && (
          <div className={`flex items-center justify-between px-3 py-1 ${tokens?.inputBg || 'bg-white/[0.04]'} border-b ${tokens?.inputBorder || 'border-white/[0.06]'}`}>
            <span className={`text-[9px] ${tokens?.textMuted || 'text-white/30'} uppercase`}>{codeLang}</span>
            <CopyBtn text={code} tokens={tokens} />
          </div>
        )}
        <pre className={`px-3 py-2 text-[11px] leading-relaxed overflow-x-auto ${tokens?.codeBg || 'bg-black/20'}`}>
          <code className={tokens?.codeAccent || 'text-indigo-300/80'}>{code}</code>
        </pre>
      </div>
    );
    codeLines = [];
    codeLang = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) { flushCode(); inCodeBlock = false; }
      else { inCodeBlock = true; codeLang = line.slice(3).trim(); }
      continue;
    }
    if (inCodeBlock) { codeLines.push(line); continue; }

    // Table
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith('|') && lines[j].endsWith('|')) {
        tableLines.push(lines[j]); j++;
      }
      const dataRows = tableLines.filter(r => !/^\|[\s\-:|]+\|$/.test(r));
      if (dataRows.length > 0) {
        const header = dataRows[0].split('|').filter(c => c.trim()).map(c => c.trim());
        const body = dataRows.slice(1).map(r => r.split('|').filter(c => c.trim()).map(c => c.trim()));
        elements.push(
          <div key={`tbl-${i}`} className={`my-2 overflow-hidden rounded-lg border ${tokens?.inputBorder || 'border-white/[0.06]'}`}>
            <table className="w-full text-[11px]">
              <thead><tr className={tokens?.inputBg || 'bg-white/[0.03]'}>
                {header.map((h, hi) => <th key={hi} className={`text-left px-2 py-1 ${tokens?.textTertiary || 'text-white/40'} border-b ${tokens?.inputBorder || 'border-white/[0.06]'}`}>{h}</th>)}
              </tr></thead>
              <tbody>{body.map((row, ri) => (
                <tr key={ri} className="hover:bg-white/[0.02]">
                  {row.map((cell, ci) => <td key={ci} className={`px-2 py-1 ${tokens?.textSecondary || 'text-white/50'} border-b border-white/[0.04]`}>{cell}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        );
      }
      i = j - 1;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <div key={`bq-${i}`} className={`my-1 pl-3 border-l-2 ${tokens?.accentBorder || 'border-indigo-500/30'} ${tokens?.textTertiary || 'text-white/40'}`}>
          <InlineMd text={line.slice(2)} tokens={tokens} />
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<div key={`h-${i}`} className={`${tokens?.textSecondary || 'text-white/60'} mt-2 mb-1`} style={{ fontWeight: 600, fontSize: '11px' }}><InlineMd text={line.slice(4)} tokens={tokens} /></div>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<div key={`h-${i}`} className={`${tokens?.textPrimary || 'text-white/70'} mt-2 mb-1`} style={{ fontWeight: 600, fontSize: '12px' }}><InlineMd text={line.slice(3)} tokens={tokens} /></div>);
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<div key={`h-${i}`} className={`${tokens?.textPrimary || 'text-white/80'} mt-2 mb-1`} style={{ fontWeight: 600, fontSize: '13px' }}><InlineMd text={line.slice(2)} tokens={tokens} /></div>);
      continue;
    }

    elements.push(
      <div key={`ln-${i}`} className={line.trim() === '' ? 'h-2' : undefined}>
        <InlineMd text={line} tokens={tokens} />
      </div>
    );
  }

  if (inCodeBlock && codeLines.length > 0) flushCode();
  return <div>{elements}</div>;
}

function InlineMd({ text, tokens }: { text: string; tokens?: ThemeTokens }) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*)|(`([^`]+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    if (m[2]) parts.push(<span key={k++} className={tokens?.textPrimary || 'text-white/80'} style={{ fontWeight: 600 }}>{m[2]}</span>);
    else if (m[4]) parts.push(<code key={k++} className={`px-1 py-0.5 rounded ${tokens?.badgeBg || 'bg-white/[0.06]'} ${tokens?.codeAccent || 'text-indigo-300/80'} text-[11px]`}>{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

function CopyBtn({ text, tokens }: { text: string; tokens?: ThemeTokens }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { copyToClipboard(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className={`flex items-center gap-1 text-[9px] ${tokens?.textMuted || 'text-white/25'} hover:text-white/50 transition-colors`}
    >
      {ok ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
      {ok ? '已复制' : '复制'}
    </button>
  );
}

/* ================================================================
   AI → Design JSON Injection — parse AI output into canvas components
   ================================================================ */

/** Map common keywords/component names from AI text to COMPONENT_LIBRARY types */
const COMPONENT_ALIASES: Record<string, string> = {
  'button': 'Button', 'btn': 'Button',
  'input': 'Input', 'textfield': 'Input', 'text field': 'Input',
  'select': 'Select', 'dropdown': 'Select',
  'checkbox': 'Checkbox', 'check': 'Checkbox',
  'switch': 'Switch', 'toggle': 'Switch',
  'textarea': 'Textarea', 'text area': 'Textarea',
  'table': 'Table',
  'chart': 'Chart', 'graph': 'Chart', 'bar chart': 'Chart', 'line chart': 'Chart',
  'card': 'Card',
  'text': 'Text', 'label': 'Text', 'heading': 'Text', 'title': 'Text', 'paragraph': 'Text',
  'image': 'Image', 'img': 'Image', 'photo': 'Image',
  'stat': 'Stat', 'statistic': 'Stat', 'kpi': 'Stat',
  'form': 'Input', // forms map to inputs
  'list': 'List',
  'progress': 'Progress', 'progressbar': 'Progress',
  'badge': 'Badge', 'tag': 'Badge',
  'divider': 'Divider', 'separator': 'Divider',
  'avatar': 'Avatar',
  'datepicker': 'DatePicker', 'date picker': 'DatePicker', 'date': 'DatePicker',
  'markdown': 'Markdown', 'md': 'Markdown',
  'code': 'CodeBlock', 'codeblock': 'CodeBlock',
  'workflow': 'Workflow',
  'map': 'Map',
  'video': 'Video',
};

interface ParsedDesignComponent {
  type: string;
  label: string;
  props: Record<string, any>;
}

interface ParsedDesign {
  panelName: string;
  panelType: 'blank' | 'form' | 'table' | 'chart' | 'custom';
  components: ParsedDesignComponent[];
}

/** Try to extract design intent from AI response text */
function parseAIResponseToDesign(text: string): ParsedDesign | null {
  const components: ParsedDesignComponent[] = [];

  // Strategy 1: Look for JSON code blocks with component definitions
  const jsonMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      // Handle { panels: [...] } format
      if (parsed.panels && Array.isArray(parsed.panels)) {
        const panel = parsed.panels[0];
        if (panel?.children) {
          for (const child of panel.children) {
            const compDef = COMPONENT_LIBRARY.find(c => c.type === child.type);
            if (compDef) {
              components.push({
                type: child.type,
                label: child.label || child.props?.label || compDef.label,
                props: { ...compDef.defaultProps, ...child.props },
              });
            }
          }
        }
        if (components.length > 0) {
          return {
            panelName: panel.name || 'AI \u751f\u6210\u9762\u677f',
            panelType: panel.type || 'blank',
            components,
          };
        }
      }
      // Handle array of components
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const compDef = COMPONENT_LIBRARY.find(c => c.type === item.type);
          if (compDef) {
            components.push({
              type: item.type,
              label: item.label || compDef.label,
              props: { ...compDef.defaultProps, ...item.props },
            });
          }
        }
      }
    } catch { /* not valid JSON, continue */ }
  }

  // Strategy 2: Look for TSX/JSX code blocks and extract component tags
  const tsxMatch = text.match(/```(?:tsx|jsx|react)?\s*\n([\s\S]*?)```/);
  if (tsxMatch && components.length === 0) {
    const code = tsxMatch[1];
    // Extract component tags like <Button>, <Input>, <Table>
    const tagRegex = /<(Button|Input|Select|Checkbox|Switch|Textarea|Table|Chart|Card|Text|Image|Stat|List|Progress|Badge|Divider|Avatar|DatePicker|Markdown|CodeBlock|Video|Map|Workflow)\b[^>]*(?:\/>|>)/gi;
    let tagMatch: RegExpExecArray | null;
    const seen = new Set<string>();
    while ((tagMatch = tagRegex.exec(code)) !== null) {
      const tagName = tagMatch[1];
      const normalizedType = Object.entries(COMPONENT_ALIASES).find(
        ([, v]) => v.toLowerCase() === tagName.toLowerCase()
      )?.[1] || tagName;
      const compDef = COMPONENT_LIBRARY.find(c => c.type.toLowerCase() === normalizedType.toLowerCase());
      if (compDef && !seen.has(compDef.type)) {
        seen.add(compDef.type);
        // Try to extract props from the tag
        const propsObj: Record<string, any> = { ...compDef.defaultProps };
        const labelMatch = tagMatch[0].match(/label[=:]"([^"]+)"/i);
        if (labelMatch) propsObj.label = labelMatch[1];
        const placeholderMatch = tagMatch[0].match(/placeholder[=:]"([^"]+)"/i);
        if (placeholderMatch) propsObj.placeholder = placeholderMatch[1];
        components.push({
          type: compDef.type,
          label: labelMatch?.[1] || compDef.label,
          props: propsObj,
        });
      }
    }
  }

  // Strategy 3: Scan plain text for component keywords
  if (components.length === 0) {
    const lower = text.toLowerCase();
    for (const [alias, type] of Object.entries(COMPONENT_ALIASES)) {
      if (lower.includes(alias) && !components.find(c => c.type === type)) {
        const compDef = COMPONENT_LIBRARY.find(c => c.type === type);
        if (compDef) {
          components.push({
            type: compDef.type,
            label: compDef.label,
            props: { ...compDef.defaultProps },
          });
        }
      }
    }
  }

  if (components.length === 0) return null;

  // Detect panel type from component mix
  const types = new Set(components.map(c => c.type));
  let panelType: ParsedDesign['panelType'] = 'blank';
  if (types.has('Input') || types.has('Select') || types.has('Checkbox') || types.has('DatePicker'))
    panelType = 'form';
  else if (types.has('Table'))
    panelType = 'table';
  else if (types.has('Chart'))
    panelType = 'chart';

  return {
    panelName: 'AI \u751f\u6210\u9762\u677f',
    panelType,
    components,
  };
}

/** Inject button shown at the bottom of AI assistant messages containing design hints */
function InjectToCanvasButton({ text, onInject, tokens }: {
  text: string;
  onInject: (design: ParsedDesign) => void;
  tokens?: ThemeTokens;
}) {
  const design = useMemo(() => parseAIResponseToDesign(text), [text]);
  const [injected, setInjected] = useState(false);

  if (!design || design.components.length === 0) return null;

  return (
    <div className={`mt-2 flex items-center gap-2 flex-wrap`}>
      <button
        onClick={() => { onInject(design); setInjected(true); setTimeout(() => setInjected(false), 3000); }}
        disabled={injected}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] transition-all ${
          injected
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25'
            : `${tokens?.accentBg || 'bg-indigo-500/20'} ${tokens?.accent || 'text-indigo-300'} border ${tokens?.accentBorder || 'border-indigo-500/25'} hover:bg-indigo-500/30`
        }`}
      >
        {injected ? <Check className="w-3 h-3" /> : <PanelTop className="w-3 h-3" />}
        {injected ? '\u5df2\u6ce8\u5165\u753b\u5e03' : `\u6ce8\u5165\u5230\u753b\u5e03 (${design.components.length} \u4e2a\u7ec4\u4ef6)`}
      </button>
      <span className={`text-[9px] ${tokens?.textMuted || 'text-white/25'}`}>
        <Layers className="w-3 h-3 inline mr-0.5" />
        {design.components.map(c => c.type).join(', ')}
      </span>
    </div>
  );
}

/* ================================================================
   Patch Existing Component — detects JSON patches in AI response
   ================================================================ */

/** Try to extract component prop patches from AI response */
function parseAIResponseToPatch(text: string): { type?: string; label?: string; props: Record<string, any> } | null {
  // Strategy 1: JSON code block with "props" or "component" key
  const jsonBlockRe = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = jsonBlockRe.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      // Direct props object
      if (parsed.props && typeof parsed.props === 'object') {
        return { type: parsed.type, label: parsed.label, props: parsed.props };
      }
      // Nested component object
      if (parsed.component && parsed.component.props) {
        return { type: parsed.component.type, label: parsed.component.label, props: parsed.component.props };
      }
    } catch {}
  }
  return null;
}

function PatchSelectedButton({ text, tokens }: {
  text: string;
  tokens?: ThemeTokens;
}) {
  const { selectedComponentId, components, updateComponentProps } = useDesigner();
  const patch = useMemo(() => parseAIResponseToPatch(text), [text]);
  const [applied, setApplied] = useState(false);

  const selectedComponent = components.find(c => c.id === selectedComponentId);

  // Only show if there's a patch AND a component is selected
  if (!patch || !selectedComponent) return null;

  // Check type compatibility (if specified)
  if (patch.type && patch.type !== selectedComponent.type) return null;

  const diffKeys = Object.keys(patch.props).filter(k => {
    const oldVal = selectedComponent.props[k];
    const newVal = patch.props[k];
    return JSON.stringify(oldVal) !== JSON.stringify(newVal);
  });

  if (diffKeys.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            updateComponentProps(selectedComponent.id, patch.props);
            setApplied(true);
            setTimeout(() => setApplied(false), 3000);
          }}
          disabled={applied}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] transition-all ${
            applied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25'
              : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/25'
          }`}
        >
          {applied ? <Check className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
          {applied ? '\u5df2\u5e94\u7528\u5230\u7ec4\u4ef6' : `\u4e00\u952e\u5e94\u7528\u5230 \u300c${selectedComponent.label}\u300d (${diffKeys.length} \u9879\u53d8\u66f4)`}
        </button>
      </div>
      {/* Show diff preview */}
      <div className={`text-[9px] ${tokens?.textMuted || 'text-white/25'} space-y-0.5`}>
        {diffKeys.slice(0, 5).map(k => (
          <div key={k} className="flex items-center gap-1">
            <span className="text-red-400/50 line-through">{k}: {JSON.stringify(selectedComponent.props[k])}</span>
            <span className="text-white/20">&rarr;</span>
            <span className="text-emerald-400/50">{k}: {JSON.stringify(patch.props[k])}</span>
          </div>
        ))}
        {diffKeys.length > 5 && <span>...+{diffKeys.length - 5} 项</span>}
      </div>
    </div>
  );
}

/* ================================================================
   Main Component
   ================================================================ */

export function AIAssistant() {
  const {
    aiOpen, toggleAI, aiMessages, addAIMessage,
    aiModels, activeModelId, openModelSettings,
    panels, components, projectName,
    importDesignJSON,
  } = useDesigner();
  const t = useThemeTokens();
  const globalAI = useGlobalAI();

  // Sync Designer model API keys to global context when they change
  useEffect(() => {
    const keys: Record<string, string> = {};
    for (const m of aiModels) {
      if (m.apiKey) keys[m.id] = m.apiKey;
    }
    if (Object.keys(keys).length > 0) {
      globalAI.setApiKeys({ ...globalAI.apiKeys, ...keys });
    }
  }, [aiModels]); // eslint-disable-line react-hooks/exhaustive-deps

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamText, setStreamText] = useState('');       // accumulates tokens in real-time
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'streaming' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeModel = aiModels.find(m => m.id === activeModelId);
  const modelName = activeModel?.name || '未配置';
  const hasEndpoint = !!activeModel?.endpoint;
  const hasApiKey = !!activeModel?.apiKey || activeModel?.provider === 'ollama';

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, streamText, isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  /* ---- Send message to real LLM ---- */
  const doSend = useCallback(async (userText: string) => {
    if (isTyping || !userText.trim()) return;

    // Add user message
    addAIMessage({ role: 'user', content: userText });
    setIsTyping(true);
    setStreamText('');
    setErrorMsg('');
    setConnectionStatus('connecting');

    // Check model configuration
    if (!activeModel || !activeModel.endpoint) {
      const errContent = `⚠️ **未配置模型端点**

请先在 **模型设置** 中配置 AI 模型：
1. 点击右上方 ⚙️ 打开模型设置
2. 选择一个模型并填入 API 端点和密钥
3. 或启动本地 **Ollama** 并扫描模型

支持的后端：
- **Ollama**（本地）→ \`http://localhost:11434\`
- **OpenAI** → \`https://api.openai.com/v1/chat/completions\`
- **智谱 GLM** → \`https://open.bigmodel.cn/api/paas/v4/chat/completions\`
- **通义千问** → \`https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions\``;
      addAIMessage({ role: 'assistant', content: errContent });
      setIsTyping(false);
      setConnectionStatus('error');
      return;
    }

    if (!hasApiKey && activeModel.provider !== 'ollama') {
      const errContent = `⚠️ **缺少 API Key**

模型 **${activeModel.name}** 需要 API Key 才能调用。
请在 **模型设置** 中为该模型填入有效的 API Key。

> Ollama 本地模型不需要 API Key，启 \`ollama serve\` 即可直连。`;
      addAIMessage({ role: 'assistant', content: errContent });
      setIsTyping(false);
      setConnectionStatus('error');
      return;
    }

    // Build message history for LLM
    const systemPrompt = buildSystemPrompt(panels, components, projectName);
    const historyMessages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Include recent conversation (last 20 messages for context window)
    const recentMsgs = aiMessages
      .filter(m => m.role !== 'system')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));
    historyMessages.push(...recentMsgs);
    historyMessages.push({ role: 'user', content: userText });

    // Make real API call with streaming
    const controller = new AbortController();
    abortRef.current = controller;

    let fullResponse = '';

    try {
      await callLLM(
        activeModel,
        historyMessages,
        controller.signal,
        {
          onToken: (token) => {
            setConnectionStatus('streaming');
            fullResponse += token;
            setStreamText(fullResponse);
          },
          onDone: (text) => {
            fullResponse = text;
          },
          onError: (err) => {
            throw new Error(err);
          },
        }
      );

      // Save complete response
      if (fullResponse.trim()) {
        addAIMessage({ role: 'assistant', content: fullResponse });
      }
      setConnectionStatus('idle');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled — save partial response if any
        if (fullResponse.trim()) {
          addAIMessage({ role: 'assistant', content: fullResponse + '\n\n*(已中断)*' });
        }
        setConnectionStatus('idle');
      } else {
        setConnectionStatus('error');
        const errorContent = formatAPIError(err, activeModel);
        addAIMessage({ role: 'assistant', content: errorContent });
        setErrorMsg(err.message || '连接失败');
      }
    } finally {
      setIsTyping(false);
      setStreamText('');
      abortRef.current = null;
    }
  }, [isTyping, activeModel, hasApiKey, aiMessages, addAIMessage, panels, components, projectName]);

  /* ---- Stop generation ---- */
  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /* ---- Input handlers ---- */
  const handleSendInput = useCallback(() => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    doSend(text);
  }, [doSend, input]);

  const handleQuickAction = useCallback((action: typeof AI_QUICK_ACTIONS[number]) => {
    doSend(action.prompt);
  }, [doSend]);

  /* ---- Inject AI-parsed design into canvas ---- */
  const handleInjectToCanvas = useCallback((design: ParsedDesign) => {
    // Calculate position for new panel (place below existing ones)
    const maxY = panels.reduce((m, p) => Math.max(m, p.y + p.h), 0);
    const panelW = Math.min(12, Math.max(4, design.components.length * 2));
    const panelH = Math.max(4, design.components.length * 2);

    const ts = Date.now();
    const rnd = () => Math.random().toString(36).slice(2, 7);
    const panelId = `panel-ai-${ts}-${rnd()}`;
    const panelName = design.panelName + ' ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    // Build component instances
    const newComponents = design.components.map((comp, idx) => {
      const compId = `comp-ai-${ts}-${idx}-${rnd()}`;
      return {
        id: compId,
        type: comp.type,
        label: comp.label,
        props: comp.props,
        panelId: panelId,
      };
    });

    const newPanel = {
      id: panelId,
      name: panelName,
      type: design.panelType,
      x: 0,
      y: maxY,
      w: panelW,
      h: panelH,
      children: newComponents.map(c => c.id),
    };

    // Use importDesignJSON to atomically merge new panel + components with existing ones
    const mergedDesign = {
      panels: [...panels, newPanel],
      components: [...components, ...newComponents],
    };
    importDesignJSON(JSON.stringify(mergedDesign));

    // Confirm to user
    addAIMessage({
      role: 'assistant',
      content: `\u2705 **\u5df2\u6ce8\u5165\u5230\u8bbe\u8ba1\u753b\u5e03**\n\n\u9762\u677f\u300c${panelName}\u300d\u5df2\u521b\u5efa\uff0c\u5305\u542b ${design.components.length} \u4e2a\u7ec4\u4ef6\uff1a\n${design.components.map(c => `- **${c.type}** \u300c${c.label}\u300d`).join('\n')}\n\n> \u8bf7\u5728\u753b\u5e03\u4e2d\u627e\u5230\u65b0\u9762\u677f\uff0c\u70b9\u51fb\u5404\u7ec4\u4ef6\u5728\u53f3\u4fa7\u5c5e\u6027\u9762\u677f\u4e2d\u7cbe\u8c03\u914d\u7f6e\u3002`,
    });
  }, [panels, components, importDesignJSON, addAIMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendInput(); }
  }, [handleSendInput]);

  if (!aiOpen) return null;

  const statusColor = connectionStatus === 'streaming' ? 'bg-green-400'
    : connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse'
    : connectionStatus === 'error' ? 'bg-red-400'
    : 'bg-white/20';

  return (
    <div
      className={`w-[340px] border-l ${t.panelBorder} ${t.panelBg} flex flex-col shrink-0 select-none ${t.scrollClass}`}
      style={{ boxShadow: t.panelShadow.replace('1px', '-1px').replace('4px', '-4px') }}
    >
      {/* Header */}
      <div className={`p-3 border-b ${t.sectionBorder} flex items-center gap-2`}>
        <div className={`w-7 h-7 rounded-lg ${t.accentGradient} flex items-center justify-center`}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[12px] ${t.textPrimary} flex items-center gap-1.5`}>
            AI 助手
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
          </div>
          <div className={`text-[10px] ${t.textTertiary} truncate`}>
            {modelName} · {(() => { try { return activeModel?.endpoint ? new URL(activeModel.endpoint).hostname : '未配置'; } catch { return activeModel?.endpoint || '未配置'; } })()}
          </div>
        </div>
        <button
          onClick={openModelSettings}
          className={`p-1.5 rounded-md ${t.textMuted} hover:text-white/50 ${t.hoverBg} transition-all`}
          title="模型设置"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button onClick={toggleAI} className={`p-1.5 rounded-md ${t.textMuted} hover:text-white/50 ${t.hoverBg} transition-all`}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Connection warning */}
      {(!hasEndpoint || (!hasApiKey && activeModel?.provider !== 'ollama')) && (
        <button
          onClick={openModelSettings}
          className="mx-3 mt-2 p-2.5 rounded-lg bg-amber-500/[0.08] border border-amber-500/20 text-left hover:bg-amber-500/[0.12] transition-colors"
        >
          <div className="flex items-center gap-2 text-[11px] text-amber-400/80">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <div>
              <div>{!hasEndpoint ? '未配置模型端点' : '缺少 API Key'} — 点击配置</div>
              <div className="text-[9px] text-amber-400/40 mt-0.5">
                在「AI 模型服务管理」中选择服务商 → 填入 API Key → 选择模型 → 点击「使用」
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Quick actions */}
      <div className={`p-2 border-b ${t.sectionBorder} flex gap-1.5 overflow-x-auto`}>
        {AI_QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            onClick={() => handleQuickAction(action)}
            disabled={isTyping}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${t.inputBg} border ${t.inputBorder} text-[11px] ${t.textTertiary} hover:text-white/60 ${t.hoverBg} transition-all whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <action.icon className="w-3 h-3" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {aiMessages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? t.userBubbleBg
              : msg.role === 'system' ? 'bg-amber-500/20'
              : t.aiIconBg
            }`}>
              {msg.role === 'user'
                ? <User className={`w-3 h-3 ${t.accent}`} />
                : <Bot className={`w-3 h-3 ${t.aiIconColor}`} />}
            </div>
            <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block text-left max-w-full px-3 py-2 rounded-xl text-[12px] leading-relaxed break-words ${
                msg.role === 'user'
                  ? `${t.userBubbleBg} text-white/70 rounded-tr-sm`
                  : msg.role === 'system'
                  ? 'bg-amber-500/[0.06] text-white/50 border border-amber-500/10 rounded-tl-sm'
                  : `${t.aiBubbleBg} text-white/60 rounded-tl-sm`
              }`}>
                <MarkdownContent content={msg.content} tokens={t} />
                {msg.role === 'assistant' && (
                  <>
                    <InjectToCanvasButton text={msg.content} onInject={handleInjectToCanvas} tokens={t} />
                    <PatchSelectedButton text={msg.content} tokens={t} />
                  </>
                )}
              </div>
              <div className={`text-[9px] ${t.textMuted} mt-1 px-1`}>
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking / connecting */}
        {isTyping && !streamText && (
          <div className="flex gap-2">
            <div className={`w-6 h-6 rounded-lg ${t.aiIconBg} flex items-center justify-center`}>
              <Bot className={`w-3 h-3 ${t.aiIconColor}`} />
            </div>
            <div className={`px-3 py-2 rounded-xl ${t.aiBubbleBg} rounded-tl-sm`}>
              <div className="flex items-center gap-2">
                <Loader className={`w-3 h-3 ${t.aiIconColor} opacity-60 animate-spin`} />
                <span className={`text-[11px] ${t.textTertiary}`}>
                  {connectionStatus === 'connecting' ? `连接 ${modelName}...` : '思考中...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Live streaming response */}
        {streamText && (
          <div className="flex gap-2">
            <div className={`w-6 h-6 rounded-lg ${t.aiIconBg} flex items-center justify-center shrink-0`}>
              <Bot className={`w-3 h-3 ${t.aiIconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`inline-block text-left max-w-full px-3 py-2 rounded-xl rounded-tl-sm ${t.aiBubbleBg} text-white/60 text-[12px] leading-relaxed break-words`}>
                <MarkdownContent content={streamText} tokens={t} />
                <span className={`inline-block w-1.5 h-3.5 ${t.btnPrimary} opacity-60 ml-0.5 animate-pulse rounded-sm`} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-3 border-t ${t.sectionBorder}`}>
        <div className={`flex items-end gap-2 ${t.inputBg} rounded-xl border ${t.inputBorder} p-2 ${t.inputFocusBorder} transition-all`}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTyping ? '生成中...' : '输入消息... (Enter 发送)'}
            rows={1}
            disabled={isTyping}
            className={`flex-1 bg-transparent text-[12px] ${t.inputText} placeholder:text-white/20 focus:outline-none resize-none min-h-[28px] max-h-[80px] disabled:opacity-50`}
          />
          {isTyping ? (
            <button
              onClick={handleStop}
              className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors"
              title="停止生成"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSendInput}
              disabled={!input.trim()}
              className={`p-1.5 rounded-lg ${t.btnPrimary} text-white ${t.btnPrimaryHover} transition-colors disabled:opacity-30`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
            <span className={`text-[9px] ${t.textMuted}`}>
              {connectionStatus === 'streaming' ? '接收中...' : connectionStatus === 'error' ? '连接失败' : modelName}
            </span>
          </div>
          <span className={`text-[9px] ${t.textMuted}`}>Shift+Enter 换行</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Error Formatting — helpful error messages
   ================================================================ */

function formatAPIError(err: any, model: AIModel): string {
  const msg = err.message || String(err);

  // CORS error
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
    return `❌ **连接失败** — 无法访问 \`${model.endpoint}\`

**可能原因**：
1. **CORS 限制** — 浏览器直连外部 API 被跨域策略阻止
2. **网络不通** — 端点地址不可达
3. **服务未启动** — Ollama 等本地服务未运行

**解决方案**：
- **方案 A**：使用本地 **Ollama**（无 CORS 限制）
  \`\`\`bash
  ollama serve  # 启动在 localhost:11434
  \`\`\`
- **方案 B**：部署后端代理 \`/api/ai-proxy\`
  \`\`\`bash
  docker compose up backend  # 启动代理服务
  \`\`\`
- **方案 C**：检查端点地址是否正确`;
  }

  // Auth error
  if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('auth')) {
    return `❌ **认证失败 (401)** — API Key 无效或已过期

请检查模型 **${model.name}** 的 API Key 配置：
1. 打开 **模型设置**
2. 点击编辑 → 更新 API Key
3. 确保 Key 完整，没有多余空格`;
  }

  // Rate limit
  if (msg.includes('429') || msg.includes('rate') || msg.includes('quota')) {
    return `⚠️ **请求限流 (429)** — API 配额耗尽或请求过于频繁

**解决方案**：
- 等待几秒后重试
- 检查 API 配额（OpenAI / 智谱控制台）
- 切换到本地 Ollama 无限制调用`;
  }

  // Model not found (Ollama)
  if (msg.includes('model') && (msg.includes('not found') || msg.includes('404'))) {
    return `❌ **模型未找到** — \`${model.name}\` 未安装

请先拉取模型：
\`\`\`bash
ollama pull ${model.name.toLowerCase()}
\`\`\`

或在模型设置中切换到已安装的模型。`;
  }

  // Generic
  return `❌ **请求失败**：${msg}

**排查步骤**：
1. 检查网络连接
2. 确认端点地址：\`${model.endpoint}\`
3. 检查 API Key 是否有效
4. 查看浏览器控制台获取详细错误`;
}