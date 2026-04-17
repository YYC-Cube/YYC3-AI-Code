---
file: YYC3-核心功能-全局状态管理.md
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


# YYC³ P1-状态-全局状态管理

## 🤖 AI 角色定义

You are a senior frontend architect and state management specialist with deep expertise in modern state management patterns, reactive programming, and scalable application architecture.

### Your Role & Expertise

You are an experienced frontend architect who specializes in:
- **State Management**: Zustand, Redux, MobX, Recoil, Jotai
- **Reactive Programming**: React hooks, context API, reactive patterns
- **Performance Optimization**: Memoization, selective subscriptions, state normalization
- **Type Safety**: TypeScript integration, type-safe state, generic patterns
- **Persistence**: Local storage sync, state hydration, state serialization
- **Middleware**: Logging, persistence, time-travel debugging, analytics
- **Best Practices**: State composition, separation of concerns, testability
- **Architecture**: Global state, local state, derived state, server state

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
| @file | P1-核心功能/YYC3-P1-状态-全局状态管理.md |
| @description | 全局状态管理设计和实现，使用 Zustand 进行状态管理 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P1,state,zustand,global |

---

## 🎯 功能目标

### 核心目标

1. **集中管理**：统一管理全局状态
2. **性能优化**：避免不必要的重渲染
3. **类型安全**：完整的 TypeScript 支持
4. **持久化**：支持状态持久化
5. **中间件**：支持中间件扩展

---

## 🏗️ 架构设计

### 1. 状态架构

```
GlobalState/
├── AuthState              # 认证状态
├── UserState              # 用户状态
├── ProjectState           # 项目状态
├── EditorState            # 编辑器状态
├── LayoutState            # 布局状态
├── PreviewState           # 预览状态
├── ThemeState             # 主题状态
└── NotificationState      # 通知状态
```

### 2. 状态流

```
Component (组件)
    ↓ dispatch/useStore
Store (状态存储)
    ↓ middleware
State (状态)
    ↓ selector
Component (组件)
```

---

## 💻 核心实现

### 1. 认证状态

```typescript
// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthUser } from '@/types';

interface AuthState {
  /** 当前用户 */
  user: AuthUser | null;
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 认证状态 */
  authStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  /** 错误信息 */
  error: string | null;
}

interface AuthActions {
  /** 登录 */
  login: (email: string, password: string) => Promise<void>;
  /** 登出 */
  logout: () => Promise<void>;
  /** 刷新令牌 */
  refreshToken: () => Promise<void>;
  /** 更新用户信息 */
  updateUser: (user: Partial<User>) => void;
  /** 清除错误 */
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      authStatus: 'idle',
      error: null,

      login: async (email, password) => {
        set({ authStatus: 'loading', error: null });
        try {
          // 调用登录 API
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            throw new Error('登录失败');
          }

          const authUser = await response.json();
          set({
            user: authUser,
            isAuthenticated: true,
            authStatus: 'authenticated',
          });
        } catch (error) {
          set({
            authStatus: 'unauthenticated',
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      logout: async () => {
        set({ authStatus: 'loading' });
        try {
          // 调用登出 API
          await fetch('/api/auth/logout', { method: 'POST' });
          set({
            user: null,
            isAuthenticated: false,
            authStatus: 'unauthenticated',
          });
        } catch (error) {
          set({
            authStatus: 'unauthenticated',
            error: error instanceof Error ? error.message : '登出失败',
          });
        }
      },

      refreshToken: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.refreshToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('刷新令牌失败');
          }

          const newAuthUser = await response.json();
          set({ user: newAuthUser });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            authStatus: 'unauthenticated',
          });
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 2. 用户状态

```typescript
// src/stores/useUserStore.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { User } from '@/types';

interface UserState {
  /** 用户列表 */
  users: User[];
  /** 当前用户 */
  currentUser: User | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

interface UserActions {
  /** 获取用户列表 */
  fetchUsers: () => Promise<void>;
  /** 获取用户详情 */
  fetchUser: (userId: string) => Promise<void>;
  /** 创建用户 */
  createUser: (userData: Partial<User>) => Promise<void>;
  /** 更新用户 */
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  /** 删除用户 */
  deleteUser: (userId: string) => Promise<void>;
  /** 设置当前用户 */
  setCurrentUser: (user: User | null) => void;
}

export const useUserStore = create<UserState & UserActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      users: [],
      currentUser: null,
      loading: false,
      error: null,

      fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/users');
          if (!response.ok) throw new Error('获取用户列表失败');
          const users = await response.json();
          set({ users, loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      fetchUser: async (userId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (!response.ok) throw new Error('获取用户详情失败');
          const user = await response.json();
          set({ currentUser: user, loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      createUser: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
          if (!response.ok) throw new Error('创建用户失败');
          const newUser = await response.json();
          set((state) => ({
            users: [...state.users, newUser],
            loading: false,
          }));
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      updateUser: async (userId, userData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
          if (!response.ok) throw new Error('更新用户失败');
          const updatedUser = await response.json();
          set((state) => ({
            users: state.users.map((u) => (u.id === userId ? updatedUser : u)),
            currentUser: state.currentUser?.id === userId ? updatedUser : state.currentUser,
            loading: false,
          }));
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      deleteUser: async (userId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('删除用户失败');
          set((state) => ({
            users: state.users.filter((u) => u.id !== userId),
            currentUser: state.currentUser?.id === userId ? null : state.currentUser,
            loading: false,
          }));
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      setCurrentUser: (user) => set({ currentUser: user }),
    }))
  )
);
```

### 3. 项目状态

```typescript
// src/stores/useProjectStore.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { Project } from '@/types';

interface ProjectState {
  /** 项目列表 */
  projects: Project[];
  /** 当前项目 */
  currentProject: Project | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

interface ProjectActions {
  /** 获取项目列表 */
  fetchProjects: () => Promise<void>;
  /** 获取项目详情 */
  fetchProject: (projectId: string) => Promise<void>;
  /** 创建项目 */
  createProject: (projectData: Partial<Project>) => Promise<void>;
  /** 更新项目 */
  updateProject: (projectId: string, projectData: Partial<Project>) => Promise<void>;
  /** 删除项目 */
  deleteProject: (projectId: string) => Promise<void>;
  /** 设置当前项目 */
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState & ProjectActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,

      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/projects');
          if (!response.ok) throw new Error('获取项目列表失败');
          const projects = await response.json();
          set({ projects, loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      fetchProject: async (projectId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/projects/${projectId}`);
          if (!response.ok) throw new Error('获取项目详情失败');
          const project = await response.json();
          set({ currentProject: project, loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      createProject: async (projectData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData),
          });
          if (!response.ok) throw new Error('创建项目失败');
          const newProject = await response.json();
          set((state) => ({
            projects: [...state.projects, newProject],
            currentProject: newProject,
            loading: false,
          }));
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      updateProject: async (projectId, projectData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/projects/${projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData),
          });
          if (!response.ok) throw new Error('更新项目失败');
          const updatedProject = await response.json();
          set((state) => ({
            projects: state.projects.map((p) => (p.id === projectId ? updatedProject : p)),
            currentProject: state.currentProject?.id === projectId ? updatedProject : state.currentProject,
            loading: false,
          }));
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      deleteProject: async (projectId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('删除项目失败');
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
            currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
            loading: false,
          }));
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      },

      setCurrentProject: (project) => set({ currentProject: project }),
    }))
  )
);
```

### 4. 主题状态

```typescript
// src/stores/useThemeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeState {
  /** 当前主题 */
  theme: Theme;
  /** 是否使用系统主题 */
  useSystemTheme: boolean;
}

interface ThemeActions {
  /** 设置主题 */
  setTheme: (theme: Theme) => void;
  /** 切换主题 */
  toggleTheme: () => void;
  /** 设置是否使用系统主题 */
  setUseSystemTheme: (use: boolean) => void;
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      useSystemTheme: false,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const { theme } = get();
        set({ theme: theme === 'light' ? 'dark' : 'light' });
      },
      setUseSystemTheme: (use) => set({ useSystemTheme: use }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
```

### 5. 通知状态

```typescript
// src/stores/useNotificationStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  /** 通知 ID */
  id: string;
  /** 通知类型 */
  type: NotificationType;
  /** 通知标题 */
  title: string;
  /** 通知内容 */
  message: string;
  /** 显示时长（毫秒），0 表示不自动关闭 */
  duration: number;
  /** 创建时间 */
  createdAt: number;
}

interface NotificationState {
  /** 通知列表 */
  notifications: Notification[];
}

interface NotificationActions {
  /** 添加通知 */
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  /** 移除通知 */
  removeNotification: (id: string) => void;
  /** 清除所有通知 */
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  subscribeWithSelector((set, get) => ({
    notifications: [],

    addNotification: (notification) => {
      const id = Date.now().toString();
      const newNotification: Notification = {
        ...notification,
        id,
        createdAt: Date.now(),
      };
      set((state) => ({
        notifications: [...state.notifications, newNotification],
      }));

      // 自动关闭通知
      if (notification.duration > 0) {
        setTimeout(() => {
          get().removeNotification(id);
        }, notification.duration);
      }
    },

    removeNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    },

    clearNotifications: () => set({ notifications: [] }),
  }))
);
```

---

## 🎨 使用示例

### 1. 在组件中使用

```typescript
// src/components/UserProfile.tsx
import React from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useAuthStore } from '@/stores/useAuthStore';

export const UserProfile: React.FC = () => {
  const { currentUser, updateUser } = useUserStore();
  const { user: authUser } = useAuthStore();

  const handleUpdateProfile = async (name: string, email: string) => {
    if (currentUser) {
      await updateUser(currentUser.id, { name, email });
    }
  };

  return (
    <div className="user-profile">
      <h1>{authUser?.username}</h1>
      <p>{currentUser?.email}</p>
      <button onClick={() => handleUpdateProfile('New Name', 'new@email.com')}>
        更新资料
      </button>
    </div>
  );
};
```

### 2. 使用选择器优化性能

```typescript
// src/components/UserList.tsx
import React from 'react';
import { useUserStore } from '@/stores/useUserStore';

export const UserList: React.FC = () => {
  // 使用选择器避免不必要的重渲染
  const users = useUserStore((state) => state.users);
  const loading = useUserStore((state) => state.loading);
  const fetchUsers = useUserStore((state) => state.fetchUsers);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="user-list">
      {users.map((user) => (
        <div key={user.id} className="user-item">
          <span>{user.username}</span>
          <span>{user.email}</span>
        </div>
      ))}
    </div>
  );
};
```

---

## ✅ 验收标准

### 功能完整性

- ✅ 全局状态管理正常
- ✅ 状态持久化功能正常
- ✅ 中间件支持完善
- ✅ 类型定义完整
- ✅ 性能优化到位

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
| v1.0.0 | 2026-03-14 | 初始版本，建立全局状态管理 | YanYuCloudCube Team |

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
| 内容校验 | 3269044bd25c47d5 |
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
