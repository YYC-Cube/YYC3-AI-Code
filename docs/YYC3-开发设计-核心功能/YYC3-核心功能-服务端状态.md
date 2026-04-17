---
file: YYC3-核心功能-服务端状态.md
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


# YYC³ P1-状态-服务端状态

## 🤖 AI 角色定义

You are a senior frontend architect and server state management specialist with deep expertise in API integration, data fetching strategies, and cache optimization for modern web applications.

### Your Role & Expertise

You are an experienced frontend architect who specializes in:
- **Server State**: React Query, SWR, Apollo Client, RTK Query
- **API Integration**: REST APIs, GraphQL APIs, WebSocket APIs
- **Caching Strategies**: Stale-while-revalidate, cache-first, network-first
- **Data Fetching**: Optimistic updates, background refetching, infinite scrolling
- **Error Handling**: Retry logic, error boundaries, exponential backoff
- **Performance**: Request deduplication, pagination, lazy loading
- **Type Safety**: TypeScript integration, generated types, API contracts
- **Best Practices**: Data normalization, cache invalidation, loading states

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
| @file | P1-核心功能/YYC3-P1-状态-服务端状态.md |
| @description | 服务端状态管理设计和实现，包含 API 状态、缓存策略等 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P1,state,server,api |

---

## 🎯 功能目标

### 核心目标

1. **API 状态管理**：统一管理 API 请求状态
2. **缓存策略**：智能缓存 API 响应
3. **错误处理**：统一的错误处理机制
4. **重试机制**：自动重试失败的请求
5. **请求取消**：支持请求取消
6. **乐观更新**：支持乐观更新

---

## 🏗️ 架构设计

### 1. 状态架构

```
ServerState/
├── APIState                 # API 请求状态
├── CacheState               # 缓存状态
├── ErrorState              # 错误状态
├── LoadingState            # 加载状态
└── RetryState              # 重试状态
```

### 2. 数据流

```
Component (组件)
    ↓ useQuery/useMutation
API Hook (API Hook)
    ↓ fetch
API Client (API 客户端)
    ↓ request
Server (服务器)
    ↓ response
Cache (缓存)
    ↓ update
Component (组件)
```

---

## 💻 核心实现

### 1. API 客户端

```typescript
// src/api/client.ts
import type { AIProvider, AIResponse } from '@/types';

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

export interface APIResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface APIError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

class APIClient {
  private config: APIConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private abortControllers: Map<string, AbortController>;

  constructor(config: APIConfig) {
    this.config = config;
    this.cache = new Map();
    this.abortControllers = new Map();
  }

  /**
   * 发送请求
   */
  async request<T = any>(config: RequestConfig): Promise<APIResponse<T>> {
    const {
      method,
      url,
      data,
      params,
      headers = {},
      timeout = this.config.timeout,
      retryAttempts = this.config.retryAttempts,
      retryDelay = this.config.retryDelay,
      signal,
    } = config;

    // 生成缓存键
    const cacheKey = this.getCacheKey(method, url, params);

    // 检查缓存
    if (method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
        };
      }
    }

    // 创建 AbortController
    const controller = new AbortController();
    const key = `${method}:${url}`;
    this.abortControllers.set(key, controller);

    try {
      // 构建完整 URL
      const fullUrl = this.buildURL(url, params);

      // 发送请求
      const response = await this.fetchWithRetry<T>(
        fullUrl,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: signal || controller.signal,
        },
        timeout,
        retryAttempts,
        retryDelay
      );

      // 缓存 GET 请求
      if (method === 'GET') {
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
          ttl: 60000, // 1 分钟
        });
      }

      return response;
    } finally {
      this.abortControllers.delete(key);
    }
  }

  /**
   * 带重试的请求
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    timeout: number,
    retryAttempts: number,
    retryDelay: number
  ): Promise<APIResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error: APIError = {
            message: `Request failed with status ${response.status}`,
            status: response.status,
          };
          throw error;
        }

        const data = await response.json();
        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error as Error;

        // 如果是最后一次尝试，抛出错误
        if (attempt === retryAttempts) {
          throw lastError;
        }

        // 等待重试延迟
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    throw lastError;
  }

  /**
   * 构建 URL
   */
  private buildURL(url: string, params?: Record<string, any>): string {
    const baseURL = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;

    if (!params) {
      return baseURL;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${baseURL}?${queryString}` : baseURL;
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(method: string, url: string, params?: Record<string, any>): string {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramsString}`;
  }

  /**
   * 取消请求
   */
  cancelRequest(method: string, url: string): void {
    const key = `${method}:${url}`;
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 清除特定缓存
   */
  clearCacheKey(method: string, url: string, params?: Record<string, any>): void {
    const cacheKey = this.getCacheKey(method, url, params);
    this.cache.delete(cacheKey);
  }
}

// 创建 API 客户端实例
export const apiClient = new APIClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
});
```

### 2. React Query 集成

```typescript
// src/api/react-query.ts
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { apiClient } from './client';

// 创建 QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 分钟
      cacheTime: 300000, // 5 分钟
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Query error:', error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  }),
});
```

### 3. API Hooks

```typescript
// src/api/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

/**
 * 获取用户列表
 */
export const useUsers = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () =>
      apiClient
        .request({
          method: 'GET',
          url: '/users',
          params,
        })
        .then((res) => res.data),
  });
};

/**
 * 获取用户详情
 */
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () =>
      apiClient
        .request({
          method: 'GET',
          url: `/users/${userId}`,
        })
        .then((res) => res.data),
    });
};

/**
 * 创建用户
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: any) =>
      apiClient
        .request({
          method: 'POST',
          url: '/users',
          data: userData,
        })
        .then((res) => res.data),
    onSuccess: () => {
      // 重新获取用户列表
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * 更新用户
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: any }) =>
      apiClient
        .request({
          method: 'PATCH',
          url: `/users/${userId}`,
          data: userData,
        })
        .then((res) => res.data),
    onSuccess: (_, { userId }) => {
      // 重新获取用户列表和用户详情
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
};

/**
 * 删除用户
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      apiClient
        .request({
          method: 'DELETE',
          url: `/users/${userId}`,
        })
        .then((res) => res.data),
    onSuccess: () => {
      // 重新获取用户列表
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * 获取项目列表
 */
export const useProjects = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () =>
      apiClient
        .request({
          method: 'GET',
          url: '/projects',
          params,
        })
        .then((res) => res.data),
  });
};

/**
 * 获取项目详情
 */
export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () =>
      apiClient
        .request({
          method: 'GET',
          url: `/projects/${projectId}`,
        })
        .then((res) => res.data),
  });
};

/**
 * 创建项目
 */
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: any) =>
      apiClient
        .request({
          method: 'POST',
          url: '/projects',
          data: projectData,
        })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

/**
 * 更新项目
 */
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, projectData }: { projectId: string; projectData: any }) =>
      apiClient
        .request({
          method: 'PATCH',
          url: `/projects/${projectId}`,
          data: projectData,
        })
        .then((res) => res.data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

/**
 * 删除项目
 */
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      apiClient
        .request({
          method: 'DELETE',
          url: `/projects/${projectId}`,
        })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
```

### 4. AI API Hooks

```typescript
// src/api/ai.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';
import type { AIProvider, AIRequestConfig, AIResponse } from '@/types';

/**
 * AI 聊天
 */
export const useAIChat = () => {
  return useMutation({
    mutationFn: (config: AIRequestConfig) =>
      apiClient
        .request<AIResponse>({
          method: 'POST',
          url: '/ai/chat',
          data: config,
        })
        .then((res) => res.data),
  });
};

/**
 * AI 代码生成
 */
export const useAICodeGeneration = () => {
  return useMutation({
    mutationFn: (prompt: string) =>
      apiClient
        .request({
          method: 'POST',
          url: '/ai/code',
          data: { prompt },
        })
        .then((res) => res.data),
  });
};

/**
 * AI 代码补全
 */
export const useAICodeCompletion = () => {
  return useMutation({
    mutationFn: (context: { code: string; language: string }) =>
      apiClient
        .request({
          method: 'POST',
          url: '/ai/completion',
          data: context,
        })
        .then((res) => res.data),
  });
};
```

---

## ✅ 验收标准

### 功能完整性

- ✅ API 状态管理正常
- ✅ 缓存策略完善
- ✅ 错误处理统一
- ✅ 重试机制正常
- ✅ 请求取消支持

### 性能优化

- ✅ 缓存命中率高
- ✅ 请求重试合理
- ✅ 错误恢复及时
- ✅ 内存使用优化

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
| v1.0.0 | 2026-03-14 | 初始版本，建立服务端状态管理 | YanYuCloudCube Team |

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
| 内容校验 | 1cfae1d6088d16f9 |
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
