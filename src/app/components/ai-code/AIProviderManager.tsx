/**
 * @file AIProviderManager.tsx
 * @description AI 服务商管理面板 — 多提供商动态管理、模型配置、API Key 管理、性能监控
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,provider,model,api-key,performance,ai-code
 */

import React, { useState, useCallback } from 'react';
import {
  Key, ToggleLeft, ToggleRight,
  Check, X, ChevronDown, ChevronRight,
  Activity, AlertTriangle, Clock, Zap,
  Cloud, Server, RefreshCcw,
  Eye, EyeOff, Settings, ChartBar, DollarSign,
  type LucideIcon,
} from 'lucide-react';

/* ================================================================
   Types (aligned with guidelines/YYC3-AI-Code.md)
   ================================================================ */
export interface AIModelConfig {
  id: string;
  name: string;
  displayName: string;
  type: 'chat' | 'embedding' | 'fine-tune' | 'image' | 'audio';
  contextLength: number;
  maxTokens: number;
  enabled: boolean;
  parameters: {
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  capabilities: string[];
  benchmark?: {
    latency: number;
    throughput: number;
    accuracy: number;
  };
}

export interface AIProviderConfig {
  id: string;
  name: string;
  displayName: string;
  type: 'cloud' | 'local';
  baseURL: string;
  apiKey: string;
  apiKeyURL?: string;
  region?: string;
  models: AIModelConfig[];
  enabled: boolean;
  priority: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  pricing?: {
    inputPrice: number;
    outputPrice: number;
    currency: string;
  };
}

/* ================================================================
   TipIcon
   ================================================================ */
function Tip({ icon: Icon, tip, size = 12, className = '', onClick }: {
  icon: LucideIcon; tip: string; size?: number; className?: string; onClick?: () => void;
}) {
  return (
    <div className="relative group/tip inline-flex">
      <button onClick={onClick}
        className={`p-1 rounded-md transition-all duration-150 hover:bg-white/[0.08] cursor-pointer ${className}`}>
        <Icon size={size} />
      </button>
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] bg-black/95 text-white/90 whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] border border-white/10">
        {tip}
      </div>
    </div>
  );
}

/* ================================================================
   Default providers (aligned with guidelines)
   ================================================================ */
const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai', name: 'openai', displayName: 'OpenAI', type: 'cloud',
    baseURL: 'https://api.openai.com/v1', apiKey: '', apiKeyURL: 'https://platform.openai.com/api-keys',
    region: 'global',
    models: [
      { id: 'gpt-4-turbo', name: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', type: 'chat', contextLength: 128000, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code', 'reasoning', 'analysis'], benchmark: { latency: 800, throughput: 80, accuracy: 0.96 } },
      { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo', type: 'chat', contextLength: 16385, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code'], benchmark: { latency: 400, throughput: 120, accuracy: 0.90 } },
    ],
    enabled: true, priority: 1,
    rateLimit: { requestsPerMinute: 60, tokensPerMinute: 90000 },
    pricing: { inputPrice: 0.01, outputPrice: 0.03, currency: 'USD' },
  },
  {
    id: 'anthropic', name: 'anthropic', displayName: 'Anthropic', type: 'cloud',
    baseURL: 'https://api.anthropic.com/v1', apiKey: '', apiKeyURL: 'https://console.anthropic.com/settings/keys',
    region: 'global',
    models: [
      { id: 'claude-3-opus', name: 'claude-3-opus', displayName: 'Claude 3 Opus', type: 'chat', contextLength: 200000, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code', 'reasoning', 'analysis'], benchmark: { latency: 1200, throughput: 60, accuracy: 0.97 } },
      { id: 'claude-3-sonnet', name: 'claude-3-sonnet', displayName: 'Claude 3 Sonnet', type: 'chat', contextLength: 200000, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code', 'reasoning'], benchmark: { latency: 600, throughput: 100, accuracy: 0.94 } },
    ],
    enabled: true, priority: 2,
    rateLimit: { requestsPerMinute: 50, tokensPerMinute: 80000 },
    pricing: { inputPrice: 0.015, outputPrice: 0.075, currency: 'USD' },
  },
  {
    id: 'zhipu', name: 'zhipu', displayName: '智谱 AI', type: 'cloud',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4', apiKey: '', apiKeyURL: 'https://open.bigmodel.cn/usercenter/apikeys',
    region: 'cn',
    models: [
      { id: 'glm-4', name: 'glm-4', displayName: 'GLM-4', type: 'chat', contextLength: 128000, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code', 'reasoning'], benchmark: { latency: 700, throughput: 85, accuracy: 0.93 } },
      { id: 'glm-4-flash', name: 'glm-4-flash', displayName: 'GLM-4 Flash', type: 'chat', contextLength: 128000, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code'], benchmark: { latency: 350, throughput: 130, accuracy: 0.90 } },
    ],
    enabled: true, priority: 3,
    rateLimit: { requestsPerMinute: 100, tokensPerMinute: 100000 },
    pricing: { inputPrice: 0.0001, outputPrice: 0.0001, currency: 'CNY' },
  },
  {
    id: 'baidu', name: 'baidu', displayName: '百度文心', type: 'cloud',
    baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop', apiKey: '',
    apiKeyURL: 'https://console.bce.baidu.com/qianfan/ais/console/application/list',
    region: 'cn',
    models: [
      { id: 'ernie-4.0-8k', name: 'ernie-4.0-8k', displayName: 'ERNIE-4.0-8K', type: 'chat', contextLength: 8192, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code', 'reasoning'], benchmark: { latency: 1200, throughput: 65, accuracy: 0.91 } },
      { id: 'ernie-3.5-8k', name: 'ernie-3.5-8k', displayName: 'ERNIE-3.5-8K', type: 'chat', contextLength: 8192, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code'], benchmark: { latency: 800, throughput: 90, accuracy: 0.89 } },
    ],
    enabled: true, priority: 4,
    rateLimit: { requestsPerMinute: 50, tokensPerMinute: 30000 },
    pricing: { inputPrice: 0.00012, outputPrice: 0.00012, currency: 'CNY' },
  },
  {
    id: 'aliyun', name: 'aliyun', displayName: '阿里通义', type: 'cloud',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKey: '',
    apiKeyURL: 'https://dashscope.console.aliyun.com/apiKey',
    region: 'cn',
    models: [
      { id: 'qwen-turbo', name: 'qwen-turbo', displayName: 'Qwen Turbo', type: 'chat', contextLength: 8192, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code'], benchmark: { latency: 600, throughput: 100, accuracy: 0.90 } },
      { id: 'qwen-plus', name: 'qwen-plus', displayName: 'Qwen Plus', type: 'chat', contextLength: 32768, maxTokens: 8192, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code', 'reasoning'], benchmark: { latency: 1000, throughput: 75, accuracy: 0.93 } },
      { id: 'qwen-max', name: 'qwen-max', displayName: 'Qwen Max', type: 'chat', contextLength: 32768, maxTokens: 8192, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code', 'reasoning', 'analysis'], benchmark: { latency: 1500, throughput: 55, accuracy: 0.95 } },
    ],
    enabled: true, priority: 5,
    rateLimit: { requestsPerMinute: 100, tokensPerMinute: 60000 },
    pricing: { inputPrice: 0.00008, outputPrice: 0.00008, currency: 'CNY' },
  },
  {
    id: 'ollama', name: 'ollama', displayName: 'Ollama (本地)', type: 'local',
    baseURL: 'http://localhost:11434', apiKey: 'ollama',
    models: [
      { id: 'llama2', name: 'llama2', displayName: 'Llama 2', type: 'chat', contextLength: 4096, maxTokens: 2048, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code'], benchmark: { latency: 3000, throughput: 20, accuracy: 0.85 } },
      { id: 'mistral', name: 'mistral', displayName: 'Mistral', type: 'chat', contextLength: 8192, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code', 'reasoning'], benchmark: { latency: 2000, throughput: 30, accuracy: 0.88 } },
      { id: 'codellama', name: 'codellama', displayName: 'Code Llama', type: 'chat', contextLength: 16384, maxTokens: 4096, enabled: true, parameters: { temperature: 0.7, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, capabilities: ['chat', 'code'], benchmark: { latency: 2500, throughput: 25, accuracy: 0.90 } },
    ],
    enabled: true, priority: 10,
    pricing: { inputPrice: 0, outputPrice: 0, currency: 'USD' },
  },
];

/* ================================================================
   Provider color & icon mapping
   ================================================================ */
const PROVIDER_COLORS: Record<string, string> = {
  openai: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
  anthropic: 'text-violet-400 bg-violet-500/10 border-violet-500/15',
  zhipu: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15',
  baidu: 'text-blue-400 bg-blue-500/10 border-blue-500/15',
  aliyun: 'text-orange-400 bg-orange-500/10 border-orange-500/15',
  ollama: 'text-rose-400 bg-rose-500/10 border-rose-500/15',
};

/* ================================================================
   Main Provider Manager Component
   ================================================================ */
export function AIProviderManager({ onClose, externalProviders, onExternalToggleProvider, onExternalToggleModel, onExternalUpdateApiKey }: {
  onClose?: () => void;
  /** If provided, uses external state from useAIService hook (persistent) */
  externalProviders?: AIProviderConfig[];
  onExternalToggleProvider?: (id: string) => void;
  onExternalToggleModel?: (providerId: string, modelId: string) => void;
  onExternalUpdateApiKey?: (id: string, key: string) => void;
}) {
  // Internal state (fallback when no external state)
  const [internalProviders, setInternalProviders] = useState<AIProviderConfig[]>(DEFAULT_PROVIDERS);
  const [selectedId, setSelectedId] = useState<string | null>('openai');
  const [view, setView] = useState<'providers' | 'models' | 'monitor'>('providers');
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  // Use external providers if provided, otherwise internal
  const providers = externalProviders ?? internalProviders;

  const selectedProvider = providers.find(p => p.id === selectedId) || null;

  const toggleProvider = useCallback((id: string) => {
    if (onExternalToggleProvider) { onExternalToggleProvider(id); return; }
    setInternalProviders(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  }, [onExternalToggleProvider]);

  const toggleModel = useCallback((providerId: string, modelId: string) => {
    if (onExternalToggleModel) { onExternalToggleModel(providerId, modelId); return; }
    setInternalProviders(prev => prev.map(p => {
      if (p.id !== providerId) return p;
      return { ...p, models: p.models.map(m => m.id === modelId ? { ...m, enabled: !m.enabled } : m) };
    }));
  }, [onExternalToggleModel]);

  const updateApiKey = useCallback((id: string, key: string) => {
    if (onExternalUpdateApiKey) { onExternalUpdateApiKey(id, key); return; }
    setInternalProviders(prev => prev.map(p => p.id === id ? { ...p, apiKey: key } : p));
  }, [onExternalUpdateApiKey]);

  const totalModels = providers.reduce((s, p) => s + p.models.filter(m => m.enabled).length, 0);
  const enabledProviders = providers.filter(p => p.enabled).length;

  return (
    <div className="flex flex-col h-full bg-[#0d0e14]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/[0.06] flex items-center justify-center">
            <Zap size={14} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-[12px] text-white/70" style={{ fontWeight: 600 }}>AI 服务管理</h2>
            <p className="text-[9px] text-white/25">{enabledProviders} 个服务商 · {totalModels} 个模型</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tip icon={RefreshCcw} tip="重置默认" size={12} className="text-white/25" onClick={() => setInternalProviders(DEFAULT_PROVIDERS)} />
          {onClose && <Tip icon={X} tip="关闭" size={12} className="text-white/25" onClick={onClose} />}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-white/[0.04] shrink-0">
        {([
          { id: 'providers' as const, label: '服务商', icon: Cloud },
          { id: 'models' as const, label: '模型管理', icon: Settings },
          { id: 'monitor' as const, label: '性能监控', icon: ChartBar },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] transition-colors ${
              view === tab.id ? 'bg-white/[0.06] text-white/60' : 'text-white/25 hover:text-white/40 hover:bg-white/[0.03]'
            }`} style={{ fontWeight: view === tab.id ? 500 : 400 }}>
            <tab.icon size={11} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {view === 'providers' && (
          <ProviderList
            providers={providers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggle={toggleProvider}
            onApiKeyChange={updateApiKey}
            showApiKey={showApiKey}
            onToggleShowKey={(id) => setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }))}
          />
        )}
        {view === 'models' && selectedProvider && (
          <ModelList provider={selectedProvider} onToggleModel={toggleModel} />
        )}
        {view === 'models' && !selectedProvider && (
          <div className="flex flex-col items-center justify-center py-12">
            <Settings size={28} className="text-white/10 mb-2" />
            <p className="text-[10px] text-white/20">请先选择一个服务商</p>
          </div>
        )}
        {view === 'monitor' && <PerformanceMonitor providers={providers} />}
      </div>
    </div>
  );
}

/* ================================================================
   Provider List
   ================================================================ */
function ProviderList({ providers, selectedId, onSelect, onToggle, onApiKeyChange, showApiKey, onToggleShowKey }: {
  providers: AIProviderConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onApiKeyChange: (id: string, key: string) => void;
  showApiKey: Record<string, boolean>;
  onToggleShowKey: (id: string) => void;
}) {
  return (
    <div className="py-1">
      {providers.map(p => {
        const isSelected = p.id === selectedId;
        const colors = PROVIDER_COLORS[p.id] || 'text-white/40 bg-white/5 border-white/10';
        const enabledModels = p.models.filter(m => m.enabled).length;

        return (
          <div key={p.id}
            className={`mx-2 my-1 rounded-lg border transition-all ${isSelected ? 'border-indigo-500/25 bg-white/[0.02]' : 'border-white/[0.04] hover:border-white/[0.08]'}`}>
            {/* Provider header */}
            <button onClick={() => onSelect(p.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${colors}`}>
                {p.type === 'cloud' ? <Cloud size={14} /> : <Server size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-white/60" style={{ fontWeight: 500 }}>{p.displayName}</span>
                  {p.region && (
                    <span className={`text-[8px] px-1 py-0.5 rounded border ${
                      p.region === 'cn' ? 'text-red-400/40 bg-red-500/10 border-red-500/10' : 'text-blue-400/40 bg-blue-500/10 border-blue-500/10'
                    }`}>{p.region === 'cn' ? '国内' : '全球'}</span>
                  )}
                  <span className={`text-[8px] px-1 py-0.5 rounded ${p.type === 'cloud' ? 'text-cyan-400/40 bg-cyan-500/10' : 'text-amber-400/40 bg-amber-500/10'}`}>
                    {p.type === 'cloud' ? '云端' : '本地'}
                  </span>
                </div>
                <p className="text-[9px] text-white/20 truncate">{enabledModels} 个模型启用 · 优先级 {p.priority}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onToggle(p.id); }}
                className="p-1 rounded-md transition-colors hover:bg-white/[0.06]">
                {p.enabled
                  ? <ToggleRight size={18} className="text-emerald-400" />
                  : <ToggleLeft size={18} className="text-white/20" />}
              </button>
            </button>

            {/* Expanded details */}
            {isSelected && (
              <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04] pt-2">
                {/* API Key */}
                <div>
                  <label className="text-[9px] text-white/25 mb-1 block" style={{ fontWeight: 600 }}>API 密钥</label>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 flex items-center bg-white/[0.03] border border-white/[0.08] rounded-md focus-within:border-indigo-500/40">
                      <input
                        type={showApiKey[p.id] ? 'text' : 'password'}
                        value={p.apiKey}
                        onChange={e => onApiKeyChange(p.id, e.target.value)}
                        placeholder={p.type === 'local' ? '本地模型无需密钥' : '输入 API Key...'}
                        className="flex-1 bg-transparent text-[10px] text-white/50 px-2 py-1.5 outline-none placeholder:text-white/15 font-mono"
                      />
                      <button onClick={() => onToggleShowKey(p.id)} className="p-1 text-white/20 hover:text-white/40">
                        {showApiKey[p.id] ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                    </div>
                    {p.apiKeyURL && (
                      <a href={p.apiKeyURL} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-[9px] hover:bg-indigo-500/20 transition-colors shrink-0"
                        style={{ fontWeight: 500 }}>
                        <Key size={10} />
                        获取
                      </a>
                    )}
                  </div>
                </div>

                {/* Base URL */}
                <div>
                  <label className="text-[9px] text-white/25 mb-1 block" style={{ fontWeight: 600 }}>API 地址</label>
                  <input
                    value={p.baseURL}
                    readOnly
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-md text-[10px] text-white/30 px-2 py-1.5 outline-none font-mono"
                  />
                </div>

                {/* Rate limits & pricing */}
                <div className="flex gap-2">
                  {p.rateLimit && (
                    <div className="flex-1 bg-white/[0.02] border border-white/[0.04] rounded-md p-2">
                      <span className="text-[8px] text-white/20 block mb-1" style={{ fontWeight: 600 }}>速率限制</span>
                      <div className="flex items-center gap-1">
                        <Clock size={9} className="text-white/15" />
                        <span className="text-[9px] text-white/30">{p.rateLimit.requestsPerMinute} 次/分</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Zap size={9} className="text-white/15" />
                        <span className="text-[9px] text-white/30">{(p.rateLimit.tokensPerMinute / 1000).toFixed(0)}K tok/分</span>
                      </div>
                    </div>
                  )}
                  {p.pricing && (
                    <div className="flex-1 bg-white/[0.02] border border-white/[0.04] rounded-md p-2">
                      <span className="text-[8px] text-white/20 block mb-1" style={{ fontWeight: 600 }}>计费</span>
                      <div className="flex items-center gap-1">
                        <DollarSign size={9} className="text-white/15" />
                        <span className="text-[9px] text-white/30">输入: {p.pricing.currency} {p.pricing.inputPrice}/1K</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <DollarSign size={9} className="text-white/15" />
                        <span className="text-[9px] text-white/30">输出: {p.pricing.currency} {p.pricing.outputPrice}/1K</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick model summary */}
                <div>
                  <span className="text-[8px] text-white/20 block mb-1" style={{ fontWeight: 600 }}>模型列表</span>
                  <div className="flex flex-wrap gap-1">
                    {p.models.map(m => (
                      <span key={m.id}
                        className={`text-[8px] px-1.5 py-0.5 rounded border ${
                          m.enabled ? 'text-white/40 bg-white/[0.03] border-white/[0.08]' : 'text-white/15 bg-white/[0.01] border-white/[0.04] line-through'
                        }`}>{m.displayName}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================
   Model List (for selected provider)
   ================================================================ */
function ModelList({ provider, onToggleModel }: {
  provider: AIProviderConfig;
  onToggleModel: (providerId: string, modelId: string) => void;
}) {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  return (
    <div className="py-1">
      <div className="px-4 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${PROVIDER_COLORS[provider.id] || 'text-white/40 bg-white/5 border-white/10'}`}>
            {provider.type === 'cloud' ? <Cloud size={12} /> : <Server size={12} />}
          </div>
          <div>
            <span className="text-[11px] text-white/60" style={{ fontWeight: 500 }}>{provider.displayName}</span>
            <span className="text-[9px] text-white/20 ml-2">{provider.models.length} 个模型</span>
          </div>
        </div>
      </div>

      {provider.models.map(m => {
        const isExpanded = expandedModel === m.id;
        return (
          <div key={m.id} className="mx-2 my-1 rounded-lg border border-white/[0.04] hover:border-white/[0.08] transition-all">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <button onClick={() => setExpandedModel(isExpanded ? null : m.id)} className="text-white/25">
                {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/50" style={{ fontWeight: 500 }}>{m.displayName}</span>
                  <span className="text-[8px] text-indigo-400/40 bg-indigo-500/10 px-1 py-0.5 rounded">{m.type}</span>
                  {m.capabilities.map(cap => (
                    <span key={cap} className="text-[7px] text-white/15 bg-white/[0.03] px-1 py-0.5 rounded">{cap}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[8px] text-white/20">上下文: {(m.contextLength / 1024).toFixed(0)}K</span>
                  <span className="text-[8px] text-white/20">最大: {m.maxTokens} tok</span>
                  {m.benchmark && (
                    <>
                      <span className="text-[8px] text-white/20">延迟: {m.benchmark.latency}ms</span>
                      <span className="text-[8px] text-white/20">准确率: {(m.benchmark.accuracy * 100).toFixed(0)}%</span>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => onToggleModel(provider.id, m.id)}
                className="p-1 rounded-md transition-colors hover:bg-white/[0.06]">
                {m.enabled
                  ? <ToggleRight size={16} className="text-emerald-400" />
                  : <ToggleLeft size={16} className="text-white/20" />}
              </button>
            </div>

            {/* Expanded parameters */}
            {isExpanded && (
              <div className="px-4 pb-3 pt-1 border-t border-white/[0.04] grid grid-cols-2 gap-2">
                {([
                  { label: '温度', key: 'temperature' as const, min: 0, max: 2, step: 0.1 },
                  { label: 'Top-P', key: 'topP' as const, min: 0, max: 1, step: 0.05 },
                  { label: '频率惩罚', key: 'frequencyPenalty' as const, min: -2, max: 2, step: 0.1 },
                  { label: '存在惩罚', key: 'presencePenalty' as const, min: -2, max: 2, step: 0.1 },
                ] as const).map(param => (
                  <div key={param.key}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[8px] text-white/25" style={{ fontWeight: 500 }}>{param.label}</span>
                      <span className="text-[8px] text-white/30 font-mono">{m.parameters[param.key].toFixed(1)}</span>
                    </div>
                    <input type="range" min={param.min} max={param.max} step={param.step}
                      value={m.parameters[param.key]}
                      className="w-full h-1 bg-white/[0.06] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:cursor-pointer"
                      readOnly
                    />
                  </div>
                ))}

                {/* Benchmark bars */}
                {m.benchmark && (
                  <div className="col-span-2 mt-1">
                    <span className="text-[8px] text-white/20 block mb-1" style={{ fontWeight: 600 }}>性能基准</span>
                    <div className="space-y-1">
                      {[
                        { label: '延迟', value: m.benchmark.latency, max: 5000, unit: 'ms', color: 'bg-amber-400' },
                        { label: '吞吐', value: m.benchmark.throughput, max: 200, unit: 'tok/s', color: 'bg-emerald-400' },
                        { label: '准确率', value: m.benchmark.accuracy * 100, max: 100, unit: '%', color: 'bg-indigo-400' },
                      ].map(b => (
                        <div key={b.label} className="flex items-center gap-2">
                          <span className="text-[8px] text-white/20 w-10">{b.label}</span>
                          <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${b.color} transition-all`}
                              style={{ width: `${Math.min(100, (b.value / b.max) * 100)}%` }} />
                          </div>
                          <span className="text-[8px] text-white/25 font-mono w-14 text-right">
                            {b.label === '准确率' ? b.value.toFixed(1) : b.value}{b.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================
   Performance Monitor (mock)
   ================================================================ */
function PerformanceMonitor({ providers }: { providers: AIProviderConfig[] }) {
  // Mock performance data
  const metrics = providers.filter(p => p.enabled).map(p => ({
    providerId: p.id,
    displayName: p.displayName,
    latency: Math.round(100 + Math.random() * 2000),
    throughput: Math.round(20 + Math.random() * 150),
    successRate: 0.85 + Math.random() * 0.15,
    totalRequests: Math.round(Math.random() * 1000),
    errorCount: Math.round(Math.random() * 20),
  }));

  const totalCost = providers.reduce((sum, p) => {
    if (!p.pricing) return sum;
    return sum + (Math.random() * 0.5);
  }, 0);

  return (
    <div className="py-2 px-3 space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '总请求', value: metrics.reduce((s, m) => s + m.totalRequests, 0).toLocaleString(), color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/15' },
          { label: '平均延��', value: Math.round(metrics.reduce((s, m) => s + m.latency, 0) / Math.max(1, metrics.length)) + 'ms', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/15' },
          { label: '总费用', value: '$' + totalCost.toFixed(4), color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15' },
        ].map(card => (
          <div key={card.label} className={`rounded-lg border p-2 ${card.bg}`}>
            <span className="text-[8px] text-white/25 block" style={{ fontWeight: 600 }}>{card.label}</span>
            <span className={`text-[13px] ${card.color} block mt-0.5`} style={{ fontWeight: 600 }}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Provider metrics table */}
      <div className="rounded-lg border border-white/[0.06] overflow-hidden">
        <div className="bg-white/[0.02] px-3 py-1.5 border-b border-white/[0.04]">
          <span className="text-[9px] text-white/30" style={{ fontWeight: 600 }}>服务商性能指标</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {metrics.map(m => (
            <div key={m.providerId} className="flex items-center gap-3 px-3 py-2">
              <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${PROVIDER_COLORS[m.providerId] || 'text-white/40 bg-white/5 border-white/10'}`}>
                <Cloud size={11} />
              </div>
              <span className="text-[10px] text-white/40 w-16 shrink-0" style={{ fontWeight: 500 }}>{m.displayName}</span>
              <div className="flex-1 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Clock size={8} className="text-white/15" />
                  <span className="text-[9px] text-white/25 font-mono">{m.latency}ms</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap size={8} className="text-white/15" />
                  <span className="text-[9px] text-white/25 font-mono">{m.throughput} tok/s</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check size={8} className={m.successRate > 0.95 ? 'text-emerald-400/50' : 'text-amber-400/50'} />
                  <span className="text-[9px] text-white/25 font-mono">{(m.successRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity size={8} className="text-white/15" />
                  <span className="text-[9px] text-white/25 font-mono">{m.totalRequests}</span>
                </div>
                {m.errorCount > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle size={8} className="text-red-400/50" />
                    <span className="text-[9px] text-red-400/40 font-mono">{m.errorCount}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="rounded-lg border border-white/[0.06] overflow-hidden">
        <div className="bg-white/[0.02] px-3 py-1.5 border-b border-white/[0.04]">
          <span className="text-[9px] text-white/30" style={{ fontWeight: 600 }}>成本明细</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {providers.filter(p => p.pricing && p.enabled).map(p => {
            const mockInput = Math.round(Math.random() * 50000);
            const mockOutput = Math.round(Math.random() * 20000);
            const cost = p.pricing ? (mockInput / 1000 * p.pricing.inputPrice + mockOutput / 1000 * p.pricing.outputPrice) : 0;
            return (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                <span className="text-[10px] text-white/40 w-16 shrink-0">{p.displayName}</span>
                <span className="text-[9px] text-white/20 font-mono flex-1">{mockInput.toLocaleString()} 输入</span>
                <span className="text-[9px] text-white/20 font-mono flex-1">{mockOutput.toLocaleString()} 输出</span>
                <span className="text-[9px] text-emerald-400/50 font-mono">{p.pricing?.currency} {cost.toFixed(4)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}