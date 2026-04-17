---
file: YYC3-数据模型-架构设计.md
description: YYC³ AI Family 数据模型架构设计，包含数据模型定义、关系设计、数据流转、存储策略等
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-10
updated: 2026-03-10
status: stable
tags: data-model,architecture,database,zh-CN
category: technical
language: zh-CN
audience: developers,architects
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ 数据模型 - 架构设计

## 核心数据模型

### 用户模型 (User)

```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // 邮箱（唯一）
  passwordHash: string;            // 密码哈希
  name: string;                  // 用户名称
  avatarUrl?: string;             // 头像 URL
  status: 'online' | 'busy' | 'offline';  // 在线状态
  preferences: UserPreferences;    // 用户偏好设置
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';  // 主题
  language: 'zh-CN' | 'en-US';       // 语言
  notifications: boolean;        // 通知开关
  fontSize: 'small' | 'medium' | 'large';  // 字体大小
}
```

### 项目模型 (Project)

```typescript
interface Project {
  id: string;                    // UUID
  userId: string;                 // 所属用户 ID
  name: string;                  // 项目名称
  description?: string;           // 项目描述
  designJson: DesignJSON;        // 设计数据（JSONB）
  code?: string;                 // 生成的代码
  status: 'draft' | 'active' | 'archived';  // 项目状态
  isPublic: boolean;             // 是否公开
  collaborators: string[];        // 协作者 ID 列表
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}

interface DesignJSON {
  layout: LayoutConfig;         // 布局配置
  components: Component[];        // 组件列表
  styles: StyleConfig;          // 样式配置
  assets: Asset[];             // 资源列表
}
```

### 组件模型 (Component)

```typescript
interface Component {
  id: string;                    // 组件 ID
  projectId: string;              // 所属项目 ID
  type: 'panel' | 'button' | 'input' | 'text' | 'image';  // 组件类型
  name: string;                  // 组件名称
  props: ComponentProps;         // 组件属性
  styles: ComponentStyles;        // 组件样式
  position: Position;            // 位置信息
  parentId?: string;             // 父组件 ID
  order: number;                // 排序
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}

interface ComponentProps {
  [key: string]: any;            // 动态属性
}

interface ComponentStyles {
  width?: string | number;
  height?: string | number;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
}

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}
```

### 会话模型 (Session)

```typescript
interface Session {
  id: string;                    // 会话 ID
  userId: string;                 // 用户 ID
  projectId: string;              // 项目 ID
  messages: Message[];            // 消息列表
  context: SessionContext;         // 会话上下文
  status: 'active' | 'closed';  // 会话状态
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

interface SessionContext {
  currentFile?: string;          // 当前文件
  selectedComponent?: string;     // 选中组件
  aiModel: string;             // AI 模型
  preferences: any;            // 偏好设置
}
```

## 数据关系设计

### ER 图

```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │ 1:N
       │
┌──────▼──────┐
│  Projects   │
└──────┬──────┘
       │ 1:N
       │
┌──────▼──────┐
│ Components │
└─────────────┘

┌─────────────┐
│  Sessions   │
└──────┬──────┘
       │ 1:N
       │
┌──────▼──────┐
│  Messages   │
└─────────────┘
```

### 关系说明

1. **用户 - 项目**: 一对多关系
   - 一个用户可以创建多个项目
   - 项目必须属于一个用户

2. **项目 - 组件**: 一对多关系
   - 一个项目包含多个组件
   - 组件必须属于一个项目

3. **用户 - 会话**: 一对多关系
   - 一个用户可以有多个活跃会话
   - 会话必须属于一个用户

4. **会话 - 消息**: 一对多关系
   - 一个会话包含多条消息
   - 消息必须属于一个会话

## 数据流转设计

### 设计到代码流程

```
用户输入 → AI 解析 → 设计 JSON → 代码生成 → 代码预览
    ↓           ↓          ↓          ↓          ↓
  上下文    意图识别   模板匹配   AST 转换   实时渲染
```

### 协同编辑流程

```
用户 A 操作 → CRDT 转换 → 操作广播 → 用户 B 接收 → 状态同步
    ↓           ↓          ↓          ↓          ↓
  本地更新   操作序列化   WebSocket   CRDT 合并   界面刷新
```

### 数据持久化策略

```typescript
// 分层持久化
interface PersistenceStrategy {
  // 内存层（快速访问）
  memory: {
    get(key: string): any;
    set(key: string, value: any): void;
    clear(): void;
  };
  
  // 本地存储（持久化）
  localStorage: {
    get(key: string): any;
    set(key: string, value: any): void;
    remove(key: string): void;
  };
  
  // 远程存储（同步）
  remote: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    sync(): Promise<void>;
  };
}
```

## 存储策略

### PostgreSQL 存储设计

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'offline',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 项目表
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  design_json JSONB NOT NULL DEFAULT '{}',
  code TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 组件表
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  props JSONB NOT NULL DEFAULT '{}',
  styles JSONB NOT NULL DEFAULT '{}',
  position JSONB NOT NULL DEFAULT '{}',
  parent_id UUID REFERENCES components(id) ON DELETE SET NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_components_project_id ON components(project_id);
CREATE INDEX idx_components_parent_id ON components(parent_id);
```

### Redis 缓存设计

```typescript
// 缓存键设计
const CacheKeys = {
  USER_SESSION: (userId: string) => `user:${userId}:session`,
  PROJECT_DESIGN: (projectId: string) => `project:${projectId}:design`,
  AI_RESPONSE: (sessionId: string) => `ai:${sessionId}:response`,
  COLLAB_STATE: (projectId: string) => `collab:${projectId}:state`,
};

// 缓存策略
const CacheTTL = {
  SHORT: 300,      // 5 分钟 - 会话数据
  MEDIUM: 3600,    // 1 小时 - 项目数据
  LONG: 86400,     // 24 小时 - 用户数据
};
```

### 文件存储设计

```typescript
interface FileStorage {
  // 本地存储
  local: {
    save(file: File, path: string): Promise<string>;
    read(path: string): Promise<File>;
    delete(path: string): Promise<void>;
  };
  
  // 云存储
  cloud: {
    upload(file: File): Promise<string>;  // 返回 URL
    download(url: string): Promise<File>;
    delete(url: string): Promise<void>;
  };
}

// 文件类型支持
const SupportedFileTypes = {
  IMAGES: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
  FIGMA: ['fig'],
  CODE: ['ts', 'tsx', 'js', 'jsx', 'json'],
  ASSETS: ['css', 'scss', 'woff', 'woff2'],
};
```

## 数据验证与安全

### 输入验证

```typescript
// 用户输入验证
const validateUserInput = (input: string): ValidationResult => {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: 'Input cannot be empty' };
  }
  
  if (input.length > 10000) {
    return { valid: false, error: 'Input too long' };
  }
  
  // XSS 防护
  if (/<script[^>]*>.*?<\/script>/gi.test(input)) {
    return { valid: false, error: 'Invalid input' };
  }
  
  return { valid: true };
};

// 文件上传验证
const validateFileUpload = (file: File): ValidationResult => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!SupportedFileTypes.IMAGES.includes(extension || '')) {
    return { valid: false, error: 'Unsupported file type' };
  }
  
  return { valid: true };
};
```

### 数据加密

```typescript
// 敏感数据加密
import crypto from 'crypto';

const encryptSensitiveData = (data: string, key: string): string => {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

const decryptSensitiveData = (encrypted: string, key: string): string => {
  const algorithm = 'aes-256-gcm';
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-10
**维护团队**: YanYuCloudCube Team

---

<div align="center">

> **「YanYuCloudCube」**
> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**

---
