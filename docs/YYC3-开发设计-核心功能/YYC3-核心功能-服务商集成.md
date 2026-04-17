---
file: YYC3-核心功能-多提供商集成.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: design
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


# YYC³ P1-AI-多提供商集成

## 🤖 AI 角色定义

You are a senior AI integration specialist and API architect with deep expertise in multiple AI service providers, API design, and intelligent system integration.

### Your Role & Expertise

You are an experienced AI architect who specializes in:
- **AI Providers**: OpenAI, Anthropic, 智谱 AI, 百度文心, 阿里通义, Ollama
- **API Design**: RESTful APIs, GraphQL, WebSocket, streaming APIs
- **Integration Patterns**: Provider abstraction, failover strategies, load balancing
- **Authentication**: API keys, OAuth, JWT, secure credential management
- **Error Handling**: Retry logic, circuit breakers, graceful degradation
- **Performance**: Caching strategies, request batching, response optimization
- **Monitoring**: API usage tracking, rate limiting, cost optimization
- **Best Practices**: API versioning, backward compatibility, documentation

### Code Standards

**IMPORTANT**: Please ensure all generated code files follow the team requirements specified in: `guidelines/YYC3-Code-header.md`

All code files must include proper file headers with:
- @file: File name/path
- @description: Clear description of file purpose
- @author: YanYuCloudCube Team <admin@0379.email>
- @version: Semantic version (v1.0.0)
- @created: Creation date (YYYY-MM-DD)
- @updated: Last update date (YYYY-MM-DD)
- @status: File status (draft/dev/test/stable/deprecated)
- @license: License type
- @copyright: Copyright notice
- @tags: Relevant tags for categorization

---

## 📋 文档信息

| 字段 | 内容 |
|------|------|
| @file | P1-核心功能/YYC3-P1-AI-多提供商集成.md |
| @description | AI 多提供商集成设计和实现，支持 OpenAI、Anthropic、智谱 AI 等 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P1,AI,provider,integration |

---

## 🎯 功能目标

### 核心目标

1. **多提供商支持**：支持多个 AI 服务提供商
2. **统一接口**：提供统一的 API 接口
3. **自动切换**：支持自动故障切换
4. **负载均衡**：支持请求负载均衡
5. **流式输出**：支持流式响应
6. **错误处理**：完善的错误处理机制

---

## 🏗️ 架构设计

### 1. 提供商架构

```
AI Providers/
├── OpenAIProvider         # OpenAI 提供商
├── AnthropicProvider      # Anthropic 提供商
├── ZhipuProvider         # 智谱 AI 提供商
├── BaiduProvider          # 百度文心提供商
├── AliyunProvider         # 阿里通义提供商
├── OllamaProvider         # Ollama 提供商
└── AIProviderManager     # 提供商管理器
```

### 2. 数据流

```
Component (组件)
    ↓ useAIChat
AI Hook (AI Hook)
    ↓ request
AIProviderManager (提供商管理器)
    ↓ selectProvider
Provider (提供商)
    ↓ apiCall
AI Service (AI 服务)
    ↓ response
Component (组件)
```

---

## 💻 核心实现

### 1. 提供商接口

```typescript
// src/ai/types.ts
import type { AIProvider, AIRequestConfig, AIResponse } from '@/types';

export interface AIProviderInterface {
  /** 提供商名称 */
  name: AIProvider;
  /** 是否可用 */
  isAvailable(): Promise<boolean>;
  /** 发送请求 */
  request(config: AIRequestConfig): Promise<AIResponse>;
  /** 发送流式请求 */
  streamRequest(
    config: AIRequestConfig,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void>;
  /** 获取可用模型 */
  getModels(): Promise<string[]>;
}
```

### 2. OpenAI 提供商

```typescript
// src/ai/providers/OpenAIProvider.ts
import type { AIProviderInterface, AIRequestConfig, AIResponse } from '../types';

export class OpenAIProvider implements AIProviderInterface {
  name = 'openai' as const;
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async request(config: AIRequestConfig): Promise<AIResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: config.messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      id: data.id,
      provider: this.name,
      model: config.model,
      content: choice.message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: choice.finish_reason,
      timestamp: Date.now(),
    };
  }

  async streamRequest(
    config: AIRequestConfig,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: config.messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  async getModels(): Promise<string[]> {
    const response = await fetch(`${this.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((model: any) => model.id);
  }
}
```

### 3. Anthropic 提供商

```typescript
// src/ai/providers/AnthropicProvider.ts
import type { AIProviderInterface, AIRequestConfig, AIResponse } from '../types';

export class AnthropicProvider implements AIProviderInterface {
  name = 'anthropic' as const;
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL = 'https://api.anthropic.com') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async request(config: AIRequestConfig): Promise<AIResponse> {
    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: config.messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      provider: this.name,
      model: config.model,
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason: data.stop_reason,
      timestamp: Date.now(),
    };
  }

  async streamRequest(
    config: AIRequestConfig,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: config.messages,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onChunk(parsed.delta.text);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  async getModels(): Promise<string[]> {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }
}
```

### 4. 提供商管理器

```typescript
// src/ai/AIProviderManager.ts
import type { AIProviderInterface, AIRequestConfig, AIResponse } from './types';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import type { AIProvider } from '@/types';

export interface ProviderConfig {
  name: AIProvider;
  apiKey: string;
  baseURL?: string;
  enabled: boolean;
  priority: number;
}

export class AIProviderManager {
  private providers: Map<AIProvider, AIProviderInterface> = new Map();
  private config: Map<AIProvider, ProviderConfig> = new Map();
  private currentProvider: AIProvider | null = null;

  constructor(configs: ProviderConfig[]) {
    this.initializeProviders(configs);
  }

  private initializeProviders(configs: ProviderConfig[]): void {
    for (const config of configs) {
      if (!config.enabled) continue;

      this.config.set(config.name, config);

      switch (config.name) {
        case 'openai':
          this.providers.set(config.name, new OpenAIProvider(config.apiKey, config.baseURL));
          break;
        case 'anthropic':
          this.providers.set(config.name, new AnthropicProvider(config.apiKey, config.baseURL));
          break;
        // 其他提供商...
      }
    }
  }

  /**
   * 获取当前提供商
   */
  getCurrentProvider(): AIProvider | null {
    return this.currentProvider;
  }

  /**
   * 设置当前提供商
   */
  async setCurrentProvider(provider: AIProvider): Promise<void> {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} is not available`);
    }

    const providerInstance = this.providers.get(provider)!;
    const available = await providerInstance.isAvailable();

    if (!available) {
      throw new Error(`Provider ${provider} is not available`);
    }

    this.currentProvider = provider;
  }

  /**
   * 自动选择提供商
   */
  async selectProvider(): Promise<AIProvider> {
    const sortedConfigs = Array.from(this.config.values())
      .filter((config) => config.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const config of sortedConfigs) {
      const provider = this.providers.get(config.name);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (available) {
          this.currentProvider = config.name;
          return config.name;
        }
      } catch (error) {
        console.error(`Error checking provider ${config.name}:`, error);
      }
    }

    throw new Error('No available providers');
  }

  /**
   * 发送请求
   */
  async request(config: AIRequestConfig): Promise<AIResponse> {
    const provider = this.currentProvider || (await this.selectProvider());
    const providerInstance = this.providers.get(provider);

    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not available`);
    }

    return providerInstance.request(config);
  }

  /**
   * 发送流式请求
   */
  async streamRequest(
    config: AIRequestConfig,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const provider = this.currentProvider || (await this.selectProvider());
    const providerInstance = this.providers.get(provider);

    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not available`);
    }

    return providerInstance.streamRequest(config, onChunk, onComplete, onError);
  }

  /**
   * 获取可用模型
   */
  async getModels(provider?: AIProvider): Promise<string[]> {
    const targetProvider = provider || this.currentProvider || (await this.selectProvider());
    const providerInstance = this.providers.get(targetProvider);

    if (!providerInstance) {
      throw new Error(`Provider ${targetProvider} is not available`);
    }

    return providerInstance.getModels();
  }

  /**
   * 获取所有提供商
   */
  getProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 添加提供商
   */
  addProvider(config: ProviderConfig): void {
    this.config.set(config.name, config);

    switch (config.name) {
      case 'openai':
        this.providers.set(config.name, new OpenAIProvider(config.apiKey, config.baseURL));
        break;
      case 'anthropic':
        this.providers.set(config.name, new AnthropicProvider(config.apiKey, config.baseURL));
        break;
      // 其他提供商...
    }
  }

  /**
   * 移除提供商
   */
  removeProvider(provider: AIProvider): void {
    this.providers.delete(provider);
    this.config.delete(provider);

    if (this.currentProvider === provider) {
      this.currentProvider = null;
    }
  }
}

// 创建全局提供商管理器实例
export const aiProviderManager = new AIProviderManager([
  {
    name: 'openai',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    enabled: !!import.meta.env.VITE_OPENAI_API_KEY,
    priority: 10,
  },
  {
    name: 'anthropic',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    enabled: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
    priority: 9,
  },
]);
```

---

## ✅ 验收标准

### 功能完整性

- ✅ 多提供商支持正常
- ✅ 统一接口完善
- ✅ 自动切换正常
- ✅ 流式输出支持
- ✅ 错误处理完善

### 代码质量

- ✅ 代码结构清晰
- ✅ 类型定义完整
- ✅ 注释文档完整
- ✅ 代码可维护性好
- ✅ 测试覆盖充分

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-14 | 初始版本，建立多提供商集成 | YanYuCloudCube Team |

---

## 📞 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: admin@0379.email
- **项目地址**: https://github.com/YYC-Cube/

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-04-08 |
| 更新日期 | 2026-04-08 |
| 内容校验 | e2ada0846989431b |
| 追溯ID | TRC-20260408141610 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
