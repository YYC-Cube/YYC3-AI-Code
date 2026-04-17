---
file: YYC3-P3-安全-安全加固.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: development
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


# YYC3-P3-安全-安全加固

## 🤖 AI 角色定义

You are a senior security architect and application security specialist with deep expertise in web application security, vulnerability assessment, and secure coding practices.

### Your Role & Expertise

You are an experienced security architect who specializes in:
- **Web Security**: OWASP Top 10, XSS, CSRF, SQL injection, security headers
- **Authentication & Authorization**: JWT, OAuth 2.0, session management, RBAC
- **Input Validation**: Input sanitization, output encoding, parameterized queries
- **Security Testing**: Penetration testing, vulnerability scanning, security audits
- **Cryptography**: Encryption, hashing, secure key management, TLS/SSL
- **Secure Coding**: Security best practices, secure design patterns, threat modeling
- **Compliance**: GDPR, HIPAA, SOC 2, PCI DSS, data privacy
- **Best Practices**: Security by design, defense in depth, zero trust architecture

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

## 🔒 安全加固系统

### 系统概述

YYC3-AI Code Designer 的安全加固系统提供全面的安全防护措施，包括输入验证、输出编码、身份认证、授权控制、安全头部配置、CORS 策略、CSRF 防护、XSS 防护、SQL 注入防护等，确保应用的安全性。

### 核心功能

#### 输入验证

```typescript
/**
 * 输入验证器
 */
export class InputValidator {
  private rules: Map<string, ValidationRule[]> = new Map();

  /**
   * 添加验证规则
   */
  addRule(field: string, rule: ValidationRule): void {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
  }

  /**
   * 验证输入
   */
  validate(input: Record<string, any>): ValidationResult {
    const errors: Map<string, string[]> = new Map();
    const warnings: Map<string, string[]> = new Map();

    for (const [field, rules] of this.rules) {
      const value = input[field];
      const fieldErrors: string[] = [];
      const fieldWarnings: string[] = [];

      for (const rule of rules) {
        const result = rule.validate(value);
        if (!result.valid) {
          if (rule.severity === 'error') {
            fieldErrors.push(result.message || '验证失败');
          } else {
            fieldWarnings.push(result.message || '警告');
          }
        }
      }

      if (fieldErrors.length > 0) {
        errors.set(field, fieldErrors);
      }
      if (fieldWarnings.length > 0) {
        warnings.set(field, fieldWarnings);
      }
    }

    return {
      valid: errors.size === 0,
      errors: Object.fromEntries(errors),
      warnings: Object.fromEntries(warnings),
    };
  }

  /**
   * 清理输入
   */
  sanitize(input: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [field, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[field] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[field] = value.map((item) =>
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[field] = this.sanitize(value);
      } else {
        sanitized[field] = value;
      }
    }

    return sanitized;
  }

  /**
   * 清理字符串
   */
  private sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 规则名称 */
  name: string;

  /** 验证函数 */
  validate: (value: any) => RuleResult;

  /** 严重程度 */
  severity?: 'error' | 'warning';
}

/**
 * 规则结果
 */
export interface RuleResult {
  /** 是否通过 */
  valid: boolean;

  /** 错误消息 */
  message?: string;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否通过 */
  valid: boolean;

  /** 错误 */
  errors: Record<string, string[]>;

  /** 警告 */
  warnings: Record<string, string[]>;
}

/**
 * 常用验证规则
 */
export const CommonRules = {
  required: (message = '此字段为必填项'): ValidationRule => ({
    name: 'required',
    validate: (value) => ({
      valid: value !== null && value !== undefined && value !== '',
      message,
    }),
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    name: 'minLength',
    validate: (value) => ({
      valid: typeof value === 'string' && value.length >= min,
      message: message || `最小长度为 ${min}`,
    }),
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    validate: (value) => ({
      valid: typeof value === 'string' && value.length <= max,
      message: message || `最大长度为 ${max}`,
    }),
  }),

  email: (message = '请输入有效的邮箱地址'): ValidationRule => ({
    name: 'email',
    validate: (value) => ({
      valid:
        typeof value === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message,
    }),
  }),

  url: (message = '请输入有效的 URL'): ValidationRule => ({
    name: 'url',
    validate: (value) => ({
      valid:
        typeof value === 'string' &&
        /^https?:\/\/.+\..+/.test(value),
      message,
    }),
  }),

  pattern: (regex: RegExp, message = '格式不正确'): ValidationRule => ({
    name: 'pattern',
    validate: (value) => ({
      valid: typeof value === 'string' && regex.test(value),
      message,
    }),
  }),

  noSQLInjection: (message = '检测到潜在的 SQL 注入'): ValidationRule => ({
    name: 'noSQLInjection',
    severity: 'error',
    validate: (value) => ({
      valid:
        typeof value !== 'string' ||
        !/['";\\]|--|\/\*|\*\/|xp_|sp_|exec|union|select|insert|update|delete|drop|create|alter/i.test(
          value
        ),
      message,
    }),
  }),

  noXSS: (message = '检测到潜在的 XSS 攻击'): ValidationRule => ({
    name: 'noXSS',
    severity: 'error',
    validate: (value) => ({
      valid:
        typeof value !== 'string' ||
        !/<script|javascript:|on\w+|eval\(|expression\(|vbscript:/i.test(
          value
        ),
      message,
    }),
  }),
};
```

#### 输出编码

```typescript
/**
 * 输出编码器
 */
export class OutputEncoder {
  /**
   * HTML 编码
   */
  htmlEncode(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * HTML 属性编码
   */
  htmlAttributeEncode(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * JavaScript 编码
   */
  jsEncode(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\f/g, '\\f')
      .replace(/\b/g, '\\b')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  }

  /**
   * URL 编码
   */
  urlEncode(str: string): string {
    return encodeURIComponent(str);
  }

  /**
   * CSS 编码
   */
  cssEncode(str: string): string {
    return str.replace(/[^\w-]/g, (match) => {
      const hex = match.charCodeAt(0).toString(16);
      return `\\${hex.length < 2 ? '0' : ''}${hex}`;
    });
  }
}
```

#### 身份认证

```typescript
/**
 * 认证管理器
 */
export class AuthManager {
  private tokenStorage: TokenStorage;
  private tokenValidator: TokenValidator;
  private passwordHasher: PasswordHasher;

  constructor() {
    this.tokenStorage = new TokenStorage();
    this.tokenValidator = new TokenValidator();
    this.passwordHasher = new PasswordHasher();
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { username, password } = credentials;

    const user = await this.authenticateUser(username, password);
    if (!user) {
      return {
        success: false,
        message: '用户名或密码错误',
      };
    }

    const token = await this.generateToken(user);
    await this.tokenStorage.setToken(token);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    await this.tokenStorage.removeToken();
  }

  /**
   * 验证令牌
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    return this.tokenValidator.validate(token);
  }

  /**
   * 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const result = await this.tokenValidator.validate(refreshToken);
    if (!result.valid) {
      return {
        success: false,
        message: '刷新令牌无效',
      };
    }

    const user = await this.getUserById(result.userId);
    if (!user) {
      return {
        success: false,
        message: '用户不存在',
      };
    }

    const token = await this.generateToken(user);
    await this.tokenStorage.setToken(token);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  /**
   * 生成令牌
   */
  private async generateToken(user: User): Promise<Token> {
    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  /**
   * 创建访问令牌
   */
  private async createAccessToken(user: User): Promise<string> {
    const payload = {
      userId: user.id,
      username: user.username,
      roles: user.roles,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    return this.signToken(payload);
  }

  /**
   * 创建刷新令牌
   */
  private async createRefreshToken(user: User): Promise<string> {
    const payload = {
      userId: user.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    };

    return this.signToken(payload);
  }

  /**
   * 签名令牌
   */
  private async signToken(payload: any): Promise<string> {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = await this.sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * 签名
   */
  private async sign(data: string): Promise<string> {
    const secret = await this.getSecret();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(data)
    );

    return this.base64UrlEncode(signature);
  }

  /**
   * Base64 URL 编码
   */
  private base64UrlEncode(data: string | ArrayBuffer): string {
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      data = encoder.encode(data);
    }
    return btoa(String.fromCharCode(...new Uint8Array(data as ArrayBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * 获取密钥
   */
  private async getSecret(): Promise<string> {
    return 'your-secret-key';
  }

  /**
   * 认证用户
   */
  private async authenticateUser(
    username: string,
    password: string
  ): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return null;
    }

    const isValid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return user;
  }

  /**
   * 根据用户名获取用户
   */
  private async getUserByUsername(username: string): Promise<User | null> {
    return null;
  }

  /**
   * 根据用户 ID 获取用户
   */
  private async getUserById(userId: string): Promise<User | null> {
    return null;
  }
}

/**
 * 登录凭证
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * 认证结果
 */
export interface AuthResult {
  success: boolean;
  token?: Token;
  user?: UserInfo;
  message?: string;
}

/**
 * 令牌
 */
export interface Token {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

/**
 * 用户
 */
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  roles: string[];
}

/**
 * 令牌验证结果
 */
export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  username?: string;
  roles?: string[];
  error?: string;
}

/**
 * 令牌存储
 */
export class TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * 设置令牌
   */
  async setToken(token: Token): Promise<void> {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token.refreshToken);
  }

  /**
   * 获取访问令牌
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * 获取刷新令牌
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * 移除令牌
   */
  async removeToken(): Promise<void> {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

/**
 * 令牌验证器
 */
export class TokenValidator {
  /**
   * 验证令牌
   */
  async validate(token: string): Promise<TokenValidationResult> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: '无效的令牌格式' };
      }

      const payload = JSON.parse(this.base64UrlDecode(parts[1]));

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: '令牌已过期' };
      }

      const signature = await this.sign(`${parts[0]}.${parts[1]}`);
      if (signature !== parts[2]) {
        return { valid: false, error: '令牌签名无效' };
      }

      return {
        valid: true,
        userId: payload.userId,
        username: payload.username,
        roles: payload.roles,
      };
    } catch (error) {
      return {
        valid: false,
        error: '令牌验证失败',
      };
    }
  }

  /**
   * 签名
   */
  private async sign(data: string): Promise<string> {
    const secret = 'your-secret-key';
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(data)
    );

    return this.base64UrlEncode(signature);
  }

  /**
   * Base64 URL 解码
   */
  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  /**
   * Base64 URL 编码
   */
  private base64UrlEncode(data: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(data)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

/**
 * 密码哈希器
 */
export class PasswordHasher {
  /**
   * 哈希密码
   */
  async hash(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(hash);
  }

  /**
   * 验证密码
   */
  async verify(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hash(password);
    return passwordHash === hash;
  }

  /**
   * Base64 URL 编码
   */
  private base64UrlEncode(data: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(data)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}
```

#### 授权控制

```typescript
/**
 * 授权管理器
 */
export class AuthzManager {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();

  /**
   * 添加角色
   */
  addRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  /**
   * 添加权限
   */
  addPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }

  /**
   * 检查权限
   */
  hasPermission(userId: string, permissionId: string): boolean {
    const userRoles = this.getUserRoles(userId);
    return userRoles.some((role) =>
      role.permissions.includes(permissionId)
    );
  }

  /**
   * 检查角色
   */
  hasRole(userId: string, roleId: string): boolean {
    const userRoles = this.getUserRoles(userId);
    return userRoles.some((role) => role.id === roleId);
  }

  /**
   * 获取用户角色
   */
  getUserRoles(userId: string): Role[] {
    return [];
  }

  /**
   * 获取角色权限
   */
  getRolePermissions(roleId: string): Permission[] {
    const role = this.roles.get(roleId);
    if (!role) {
      return [];
    }

    return role.permissions
      .map((permissionId) => this.permissions.get(permissionId))
      .filter((permission): permission is Permission => permission !== undefined);
  }
}

/**
 * 角色
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

/**
 * 权限
 */
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

/**
 * 权限守卫
 */
export const PermissionGuard: React.FC<{
  userId: string;
  permissionId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ userId, permissionId, children, fallback }) => {
  const authzManager = new AuthzManager();
  const hasPermission = authzManager.hasPermission(userId, permissionId);

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback || null}</>;
};

/**
 * 角色守卫
 */
export const RoleGuard: React.FC<{
  userId: string;
  roleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ userId, roleId, children, fallback }) => {
  const authzManager = new AuthzManager();
  const hasRole = authzManager.hasRole(userId, roleId);

  if (hasRole) {
    return <>{children}</>;
  }

  return <>{fallback || null}</>;
};
```

#### 安全头部

```typescript
/**
 * 安全头部配置
 */
export const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'geolocation=(), microphone=(), camera=(), payment=()',
};

/**
 * 安全头部中间件
 */
export function securityHeadersMiddleware(
  request: Request,
  response: Response
): Response {
  const newHeaders = new Headers(response.headers);

  for (const [key, value] of Object.entries(securityHeaders)) {
    newHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
```

#### CORS 策略

```typescript
/**
 * CORS 配置
 */
export interface CORSConfig {
  /** 允许的源 */
  origin: string | string[] | ((origin: string) => boolean);

  /** 允许的方法 */
  methods?: string[];

  /** 允许的头部 */
  allowedHeaders?: string[];

  /** 暴露的头部 */
  exposedHeaders?: string[];

  /** 允许凭证 */
  credentials?: boolean;

  /** 预检请求缓存时间 (秒) */
  maxAge?: number;
}

/**
 * 默认 CORS 配置
 */
export const defaultCORSConfig: CORSConfig = {
  origin: ['http://localhost:3201', 'https://yyc3.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  maxAge: 86400,
};

/**
 * CORS 中间件
 */
export function corsMiddleware(
  config: CORSConfig = defaultCORSConfig
): (request: Request, response: Response) => Response {
  return (request: Request, response: Response) => {
    const origin = request.headers.get('origin');

    if (origin) {
      const allowedOrigin = isOriginAllowed(origin, config.origin);
      if (allowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
      }
    }

    if (config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (config.methods) {
      response.headers.set(
        'Access-Control-Allow-Methods',
        config.methods.join(', ')
      );
    }

    if (config.allowedHeaders) {
      response.headers.set(
        'Access-Control-Allow-Headers',
        config.allowedHeaders.join(', ')
      );
    }

    if (config.exposedHeaders) {
      response.headers.set(
        'Access-Control-Expose-Headers',
        config.exposedHeaders.join(', ')
      );
    }

    if (config.maxAge) {
      response.headers.set(
        'Access-Control-Max-Age',
        config.maxAge.toString()
      );
    }

    return response;
  };
}

/**
 * 检查源是否允许
 */
function isOriginAllowed(
  origin: string,
  allowed: CORSConfig['origin']
): string | false {
  if (typeof allowed === 'string') {
    return allowed === '*' ? '*' : origin === allowed ? origin : false;
  }

  if (Array.isArray(allowed)) {
    return allowed.includes(origin) ? origin : false;
  }

  if (typeof allowed === 'function') {
    return allowed(origin) ? origin : false;
  }

  return false;
}
```

#### CSRF 防护

```typescript
/**
 * CSRF 令牌管理器
 */
export class CSRFTokenManager {
  private readonly TOKEN_KEY = 'csrf_token';
  private readonly HEADER_NAME = 'X-CSRF-Token';

  /**
   * 生成令牌
   */
  async generateToken(): Promise<string> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    sessionStorage.setItem(this.TOKEN_KEY, token);
    return token;
  }

  /**
   * 获取令牌
   */
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * 验证令牌
   */
  validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }

  /**
   * 获取头部名称
   */
  getHeaderName(): string {
    return this.HEADER_NAME;
  }

  /**
   * 添加令牌到请求
   */
  async addToRequest(request: RequestInit): Promise<RequestInit> {
    const token = await this.generateToken();
    return {
      ...request,
      headers: {
        ...request.headers,
        [this.HEADER_NAME]: token,
      },
    };
  }
}

/**
 * CSRF 中间件
 */
export function csrfMiddleware(
  tokenManager: CSRFTokenManager
): (request: Request, response: Response) => Response {
  return (request: Request, response: Response) => {
    const token = request.headers.get(tokenManager.getHeaderName());

    if (!token || !tokenManager.validateToken(token)) {
      return new Response('Invalid CSRF token', {
        status: 403,
        statusText: 'Forbidden',
      });
    }

    return response;
  };
}
```

#### XSS 防护

```typescript
/**
 * XSS 防护器
 */
export class XSSProtector {
  private encoder: OutputEncoder;

  constructor() {
    this.encoder = new OutputEncoder();
  }

  /**
   * 清理 HTML
   */
  sanitizeHTML(html: string): string {
    return this.encoder.htmlEncode(html);
  }

  /**
   * 清理 HTML 属性
   */
  sanitizeHTMLAttribute(attr: string): string {
    return this.encoder.htmlAttributeEncode(attr);
  }

  /**
   * 清理 JavaScript
   */
  sanitizeJS(js: string): string {
    return this.encoder.jsEncode(js);
  }

  /**
   * 清理 URL
   */
  sanitizeURL(url: string): string {
    return this.encoder.urlEncode(url);
  }

  /**
   * 清理 CSS
   */
  sanitizeCSS(css: string): string {
    return this.encoder.cssEncode(css);
  }

  /**
   * 检测 XSS
   */
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }
}
```

#### SQL 注入防护

```typescript
/**
 * SQL 注入防护器
 */
export class SQLInjectionProtector {
  /**
   * 参数化查询
   */
  parameterizeQuery(query: string, params: any[]): string {
    let index = 0;
    return query.replace(/\?/g, () => {
      const param = params[index++];
      return this.escapeParameter(param);
    });
  }

  /**
   * 转义参数
   */
  escapeParameter(param: any): string {
    if (param === null || param === undefined) {
      return 'NULL';
    }

    if (typeof param === 'number') {
      return param.toString();
    }

    if (typeof param === 'boolean') {
      return param ? 'TRUE' : 'FALSE';
    }

    if (typeof param === 'string') {
      return `'${this.escapeString(param)}'`;
    }

    if (Array.isArray(param)) {
      return `(${param.map((p) => this.escapeParameter(p)).join(', ')})`;
    }

    return `'${this.escapeString(JSON.stringify(param))}'`;
  }

  /**
   * 转义字符串
   */
  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "''")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\x00/g, '\\0');
  }

  /**
   * 检测 SQL 注入
   */
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /['";\\]/,
      /--/,
      /\/\*/,
      /\*\//,
      /xp_/i,
      /sp_/i,
      /exec/i,
      /union/i,
      /select/i,
      /insert/i,
      /update/i,
      /delete/i,
      /drop/i,
      /create/i,
      /alter/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }
}
```

---

## ✅ 验收标准

### 功能完整性

- [ ] 输入验证功能完整
- [ ] 输出编码功能完整
- [ ] 身份认证功能完整
- [ ] 授权控制功能完整
- [ ] 安全头部配置完整
- [ ] CORS 策略配置完整
- [ ] CSRF 防护功能完整
- [ ] XSS 防护功能完整
- [ ] SQL 注入防护功能完整
- [ ] 安全审计日志完整

### 代码质量

- [ ] TypeScript 类型定义完整
- [ ] 代码安全性高
- [ ] 错误处理完善
- [ ] 性能优化到位
- [ ] 代码可维护性强

### 安全性

- [ ] 无已知安全漏洞
- [ ] 通过安全扫描
- [ ] 符合安全最佳实践
- [ ] 加密算法安全
- [ ] 密钥管理安全

---

## 📚 相关文档

- [YYC3-P3-安全-数据加密.md](./YYC3-P3-安全-数据加密.md)
- [YYC3-P0-架构-类型定义.md](../P0-核心架构/YYC3-P0-架构-类型定义.md)
- [YYC3-变量-配置参数.md](../变量词库/YYC3-变量-配置参数.md)

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
| 内容校验 | 594cda20d89650d5 |
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
