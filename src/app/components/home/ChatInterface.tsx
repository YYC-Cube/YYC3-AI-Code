/**
 * YYC³ AI - ChatInterface Component
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module ChatInterface
 * @description AI聊天界面组件，提供智能对话交互
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../stores/theme-store';
import { useSettingsStore } from '../../stores/settings-store';
import { createLogger } from '../../utils/logger';

const log = createLogger('ChatInterface');

/**
 * ChatMessage 接口
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * ChatInterfaceProps 接口
 */
interface ChatInterfaceProps {
  /** 初始消息列表 */
  initialMessages?: ChatMessage[];
  /** 发送消息回调 */
  onSend?: (message: string) => Promise<string>;
  /** 是否显示快捷操作 */
  showQuickActions?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * ChatInterface 组件
 * 
 * @description 提供智能对话交互界面，支持消息发送、接收、快捷操作等功能
 * 
 * @example
 * ```tsx
 * <ChatInterface
 *   initialMessages={[]}
 *   onSend={async (message) => {
 *     // 处理消息发送
 *     return 'AI响应';
 *   }}
 *   showQuickActions={true}
 * />
 * ```
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialMessages = [],
  onSend,
  showQuickActions = true,
  className = '',
}) => {
  const { theme, getColor } = useThemeStore();
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((msg, index) => ({
      ...msg,
      id: msg.id || `msg-${Date.now()}-${index}`,
      timestamp: msg.timestamp || new Date(),
    }))
  );
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 快捷操作列表
  const quickActions = [
    { label: '分析代码', icon: '🔍', prompt: '请帮我分析这段代码' },
    { label: '优化代码', icon: '⚡', prompt: '请帮我优化这段代码' },
    { label: '解释概念', icon: '💡', prompt: '请解释这个概念' },
    { label: '生成文档', icon: '📝', prompt: '请生成相关文档' },
  ];

  /**
   * 滚动到底部
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * 自动滚动
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 处理发送消息
   */
  const handleSend = async (message: string = inputValue) => {
    if (!message.trim() || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      if (onSend) {
        const response = await onSend(message);
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      log.error('发送消息失败:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'system',
        content: '抱歉，发生了一些错误，请稍后再试。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  /**
   * 处理快捷操作
   */
  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * 渲染消息
   */
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <div
        key={message.id}
        className={`flex ${
          isUser ? 'justify-end' : 'justify-start'
        } mb-4 animate-fade-in`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-4 ${
            isUser
              ? 'bg-blue-500 text-white'
              : isSystem
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
          style={{
            backgroundColor: isUser
              ? getColor('accent.primary')
              : isSystem
              ? getColor('error')
              : getColor('surface.tertiary'),
            color: isUser || isSystem ? '#ffffff' : getColor('text.primary'),
          }}
        >
          <div className="text-sm mb-1 opacity-75">
            {isUser ? '用户' : isSystem ? '系统' : 'AI导师'}
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
          <div className="text-xs mt-2 opacity-50">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{
        backgroundColor: getColor('background.secondary'),
        color: getColor('text.primary'),
      }}
    >
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: getColor('text.primary') }}
            >
              智亦师亦友亦伯乐
            </h3>
            <p className="text-sm" style={{ color: getColor('text.secondary') }}>
              谱一言一语一华章，谱奏人机共生协同的AI Family乐章
            </p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷操作 */}
      {showQuickActions && (
        <div className="px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.prompt)}
                className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all hover:scale-105"
                style={{
                  backgroundColor: getColor('surface.tertiary'),
                  color: getColor('text.primary'),
                }}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t" style={{ borderColor: getColor('border.primary') }}>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter发送，Shift+Enter换行)"
            className="flex-1 p-3 rounded-lg resize-none focus:outline-none focus:ring-2"
            style={{
              backgroundColor: getColor('surface.primary'),
              color: getColor('text.primary'),
              borderColor: getColor('border.primary'),
              minHeight: '44px',
              maxHeight: '120px',
            }}
            rows={1}
            disabled={isSending}
          />
          <button
            onClick={() => handleSend()}
            disabled={isSending || !inputValue.trim()}
            className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: getColor('accent.primary'),
              color: '#ffffff',
            }}
          >
            {isSending ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
