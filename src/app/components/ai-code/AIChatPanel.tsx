/**
 * @file AIChatPanel.tsx
 * @description AI 助手聊天面板 — 支持流式对话、代码块高亮、上下文管理、快捷指令、任务看板、规则注入
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-14
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,chat,stream,code,assistant,ai-code,taskboard,rules
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Bot, User, Copy, Check, RotateCcw,
  Sparkles, Code2, Trash2, ChevronDown,
  Loader, CircleStop, MessageSquare, ListTodo,
  type LucideIcon,
} from 'lucide-react';
import type { ChatMessage, ChatStreamChunk } from '../../hooks/useAIService';
import { SettingsSyncService } from '../../services/settingsSyncService';
import { TaskBoard } from './TaskBoard';

/* ================================================================
   Types
   ================================================================ */
interface ChatBubble {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  model?: string;
  tokens?: number;
}

interface QuickAction {
  label: string;
  icon: LucideIcon;
  prompt: string;
  color: string;
}

/* ================================================================
   Quick Actions
   ================================================================ */
const QUICK_ACTIONS: QuickAction[] = [
  { label: '解释代码', icon: Code2, prompt: '请解释以下代码的作用：\n\n', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15' },
  { label: '优化建议', icon: Sparkles, prompt: '请为以下代码提供优化建议：\n\n', color: 'text-amber-400 bg-amber-500/10 border-amber-500/15' },
  { label: '生成测试', icon: Bot, prompt: '请为以下代码生成单元测试：\n\n', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15' },
  { label: '修复错误', icon: RotateCcw, prompt: '请帮我修复以下代码中的错误：\n\n', color: 'text-rose-400 bg-rose-500/10 border-rose-500/15' },
];

/* ================================================================
   buildSystemPromptWithRules — 将规则/技能注入系统提示词
   ================================================================ */

/**
 * 构建包含规则和技能的完整系统提示词
 * 从 settingsSyncService 读取已启用的规则/技能片段，追加到基础提示词尾部
 */
function buildSystemPromptWithRules(basePrompt: string): string {
  const rulesFragment = SettingsSyncService.getRulesPromptFragment();
  const skillsFragment = SettingsSyncService.getSkillsPromptFragment();

  const parts = [basePrompt];

  if (rulesFragment) {
    parts.push('\n\n--- 项目规则（必须遵循） ---\n' + rulesFragment);
  }
  if (skillsFragment) {
    parts.push('\n\n--- 可用技能 ---\n' + skillsFragment);
  }

  return parts.join('');
}

/* ================================================================
   Code Block Renderer
   ================================================================ */
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-white/[0.08] bg-[#0a0b10]">
      <div className="flex items-center justify-between px-3 py-1 bg-white/[0.03] border-b border-white/[0.06]">
        <span className="text-[9px] text-white/25" style={{ fontWeight: 500 }}>{language || 'code'}</span>
        <button onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-colors">
          {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="px-3 py-2 overflow-x-auto text-[11px] text-white/60" style={{ scrollbarWidth: 'thin', fontFamily: 'JetBrains Mono, Fira Code, monospace' }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ================================================================
   Message Content Parser (supports ```code blocks```)
   ================================================================ */
function MessageContent({ content }: { content: string }) {
  const parts: React.ReactNode[] = [];
  const codeRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">{text}</span>
      );
    }
    parts.push(
      <CodeBlock key={`code-${match.index}`} language={match[1]} code={match[2].trim()} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">{content.slice(lastIndex)}</span>
    );
  }

  return <div className="text-[11px] text-white/60" style={{ lineHeight: '1.6' }}>{parts}</div>;
}

/* ================================================================
   Tab type
   ================================================================ */
type PanelTab = 'chat' | 'tasks';

/* ================================================================
   Main AIChatPanel Component
   ================================================================ */
export function AIChatPanel({
  onChatStream,
  activeModel,
  activeProvider,
  isLoading: externalLoading,
  currentCode,
  selectedCode,
  editorFileName,
}: {
  onChatStream?: (
    messages: ChatMessage[],
    onChunk?: (chunk: ChatStreamChunk) => void,
  ) => AsyncGenerator<ChatStreamChunk, void, undefined>;
  activeModel?: string;
  activeProvider?: string;
  isLoading?: boolean;
  currentCode?: string;
  selectedCode?: string;
  editorFileName?: string;
}) {
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [messages, setMessages] = useState<ChatBubble[]>([
    {
      id: 'system-welcome',
      role: 'assistant',
      content: '你好！我是 YYC\u00b3 AI 助手，可以帮你分析代码、解释逻辑、生成测试用例或提供优化建议。\n\n试试下方的快捷指令，或直接输入你的问题。',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef(false);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message — with rules injection
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatBubble = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowQuickActions(false);
    abortRef.current = false;

    // Build context messages
    const codeContext = selectedCode
      ? `\n\n---\n[当前选中代码${editorFileName ? ` (${editorFileName})` : ''}]:\n\`\`\`\n${selectedCode.slice(0, 4000)}\n\`\`\``
      : currentCode
        ? `\n\n---\n[当前编辑文件${editorFileName ? ` (${editorFileName})` : ''}，${currentCode.length} 字符]:\n\`\`\`\n${currentCode.slice(0, 3000)}\n\`\`\``
        : '';

    // Build base prompt and inject rules/skills via settingsSyncService
    const basePrompt = `You are YYC\u00b3 AI Code Assistant. Help with code analysis, optimization, testing, and debugging. Respond in the same language as the user. Use markdown code blocks for code snippets.${codeContext}`;
    const systemPrompt = buildSystemPromptWithRules(basePrompt);

    const contextMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system' && m.id !== 'system-welcome').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: text },
    ];

    // Create streaming response placeholder
    const assistantId = `msg-${Date.now() + 1}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      model: activeModel,
    }]);
    setIsStreaming(true);

    if (onChatStream) {
      try {
        const stream = onChatStream(contextMessages, (chunk) => {
          if (abortRef.current) return;
          if (chunk.delta) {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: m.content + chunk.delta } : m
            ));
          }
        });

        for await (const chunk of stream) {
          if (abortRef.current) break;
          if (chunk.done) break;
        }
      } catch (err: any) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: m.content || `[AI 响应失败] ${err.message || '未知错误'}`, isStreaming: false }
            : m
        ));
      }
    } else {
      // Mock response when no real API is connected
      const mockResponses = [
        '这段代码看起来不错！以下是一些建议：\n\n1. 考虑添加类型注解\n2. 可以使用 `useMemo` 优化性能\n3. 建议添加错误边界处理',
        '让我分析一下...\n\n```typescript\n// 优化后的代码\nconst optimized = useMemo(() => {\n  return data.filter(Boolean).map(transform);\n}, [data]);\n```\n\n这个优化减少了不必要的重渲染。',
        '好的，我来帮你生成测试用例：\n\n```typescript\ndescribe("Component", () => {\n  it("should render correctly", () => {\n    render(<Component />);\n    expect(screen.getByText("Hello")).toBeInTheDocument();\n  });\n\n  it("should handle click", async () => {\n    const onClick = jest.fn();\n    render(<Component onClick={onClick} />);\n    await userEvent.click(screen.getByRole("button"));\n    expect(onClick).toHaveBeenCalledTimes(1);\n  });\n});\n```',
      ];

      const mockResp = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      let idx = 0;
      const typeInterval = setInterval(() => {
        if (abortRef.current || idx >= mockResp.length) {
          clearInterval(typeInterval);
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          ));
          setIsStreaming(false);
          return;
        }
        const chunk = mockResp.slice(idx, idx + 3);
        idx += 3;
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: m.content + chunk } : m
        ));
      }, 30);
      return;
    }

    // Finalize streaming
    setMessages(prev => prev.map(m =>
      m.id === assistantId ? { ...m, isStreaming: false } : m
    ));
    setIsStreaming(false);
  }, [input, isStreaming, messages, onChatStream, activeModel, currentCode, selectedCode, editorFileName]);

  // Stop streaming
  const handleStop = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
  }, []);

  // Clear conversation
  const handleClear = useCallback(() => {
    setMessages([{
      id: 'system-welcome-' + Date.now(),
      role: 'assistant',
      content: '对话已清空。有什么我可以帮你的吗？',
      timestamp: Date.now(),
    }]);
    setShowQuickActions(true);
  }, []);

  // Quick action
  const handleQuickAction = useCallback((action: QuickAction) => {
    const prompt = currentCode
      ? action.prompt + '```\n' + currentCode.slice(0, 2000) + '\n```'
      : action.prompt;
    setInput(prompt);
    inputRef.current?.focus();
  }, [currentCode]);

  // Keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ── Task Board tab ──
  if (activeTab === 'tasks') {
    return (
      <div className="flex flex-col h-full bg-[#0d0e14]">
        {/* Tab bar */}
        <div className="flex items-center border-b border-white/[0.06] shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-white/30 hover:text-white/50 transition-colors border-b-2 border-transparent"
          >
            <MessageSquare size={12} />
            对话
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-[#667eea] border-b-2 border-[#667eea] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <ListTodo size={12} />
            任务
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <TaskBoard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0e14]">
      {/* Tab bar + Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-[#667eea] border-b-2 border-[#667eea] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <MessageSquare size={12} />
            对话
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-white/30 hover:text-white/50 transition-colors border-b-2 border-transparent"
          >
            <ListTodo size={12} />
            任务
          </button>
          {activeModel && (
            <span className="text-[8px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded ml-2">{activeModel}</span>
          )}
        </div>
        <div className="flex items-center gap-1 pr-2">
          <button onClick={handleClear}
            className="p-1 rounded-md hover:bg-white/[0.06] text-white/20 hover:text-white/40 transition-colors"
            title="清空对话">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3" style={{ scrollbarWidth: 'thin' }}>
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === 'user'
                ? 'bg-indigo-500/15 border border-indigo-500/20'
                : 'bg-emerald-500/15 border border-emerald-500/20'
            }`}>
              {msg.role === 'user'
                ? <User size={12} className="text-indigo-400" />
                : <Bot size={12} className="text-emerald-400" />
              }
            </div>

            {/* Message bubble */}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-indigo-500/10 border border-indigo-500/15'
                : 'bg-white/[0.03] border border-white/[0.06]'
            }`}>
              <MessageContent content={msg.content} />
              {msg.isStreaming && (
                <span className="inline-block w-1.5 h-3 bg-indigo-400/60 animate-pulse rounded-sm ml-0.5" />
              )}
              {/* Timestamp & model */}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[8px] text-white/15">
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.model && <span className="text-[7px] text-white/10">{msg.model}</span>}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Loader size={10} className="text-indigo-400/50 animate-spin" />
            <span className="text-[9px] text-white/20">AI 正在思考...</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <AnimatePresence>
        {showQuickActions && messages.length <= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2 border-t border-white/[0.04]"
          >
            <div className="flex items-center gap-1 mb-1.5">
              <Sparkles size={9} className="text-white/15" />
              <span className="text-[8px] text-white/15">快捷指令</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[9px] transition-colors hover:opacity-80 ${action.color}`}
                >
                  <action.icon size={10} />
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="shrink-0 px-3 py-2 border-t border-white/[0.06]">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题... (Shift+Enter 换行)"
              rows={Math.min(5, Math.max(1, input.split('\n').length))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[11px] text-white/60 outline-none resize-none placeholder:text-white/15 focus:border-indigo-500/30 transition-colors"
              style={{ scrollbarWidth: 'thin', fontFamily: 'inherit' }}
            />
            {input.length > 0 && (
              <span className="absolute bottom-1.5 right-2 text-[8px] text-white/10">{input.length}</span>
            )}
          </div>
          {isStreaming ? (
            <button onClick={handleStop}
              className="p-2 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 transition-colors shrink-0">
              <CircleStop size={14} />
            </button>
          ) : (
            <button onClick={handleSend}
              disabled={!input.trim()}
              className={`p-2 rounded-lg shrink-0 transition-colors ${
                input.trim()
                  ? 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/25'
                  : 'bg-white/[0.03] border border-white/[0.06] text-white/15 cursor-not-allowed'
              }`}>
              <Send size={14} />
            </button>
          )}
        </div>
        {/* Context indicator */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[8px] text-white/10">{messages.filter(m => m.role !== 'system' && !m.id.startsWith('system-')).length} 条对话</span>
          {selectedCode && (
            <span className="text-[8px] text-cyan-400/50 bg-cyan-500/10 px-1 py-0.5 rounded">
              选中 {selectedCode.split('\n').length} 行
            </span>
          )}
          {!selectedCode && currentCode && (
            <span className="text-[8px] text-emerald-400/40 bg-emerald-500/8 px-1 py-0.5 rounded">
              {editorFileName || '文件已附加'}
            </span>
          )}
          {activeProvider && <span className="text-[8px] text-white/10">{activeProvider}</span>}
          <ChevronDown size={8} className="text-white/10" />
        </div>
      </div>
    </div>
  );
}
