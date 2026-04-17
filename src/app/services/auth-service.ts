/**
 * @file auth-service.ts
 * @description YYC³ 认证服务 — Mock JWT 认证、权限检查、Token 管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Note: This is a front-end mock implementation. In production,
 * JWT signing/verification would happen server-side.
 * Token is stored in localStorage for demo; real apps should
 * use httpOnly cookies or OS keychain (via Tauri bridge).
 */

import { createLogger } from '../utils/logger'
import type { User, UserPreferences } from '../types/models'
import type { AuthTokens, Permission } from '../types/api'

const log = createLogger('AuthService')

/* ================================================================
   Constants
   ================================================================ */

const TOKEN_KEY = 'yyc3_access_token'
const REFRESH_TOKEN_KEY = 'yyc3_refresh_token'
const USER_KEY = 'yyc3_current_user'

/* ================================================================
   Mock User
   ================================================================ */

const MOCK_USER: User = {
  id: 'user-yyc3-001',
  email: 'admin@0379.email',
  name: 'YYC³ Developer',
  avatarUrl: undefined,
  status: 'online',
  role: 'admin',
  permissions: [
    { resource: 'projects', actions: ['read', 'write', 'delete', 'admin'] },
    { resource: 'files', actions: ['read', 'write', 'delete'] },
    { resource: 'settings', actions: ['read', 'write'] },
    { resource: 'users', actions: ['read'] },
    { resource: 'deployments', actions: ['read', 'write'] },
  ],
  preferences: {
    theme: 'dark',
    locale: 'zh',
    fontSize: 14,
    keyboardShortcuts: true,
    notifications: true,
    autoSave: true,
    autoSaveInterval: 30,
  },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-13T00:00:00Z',
}

/* ================================================================
   Mock Token Generation (base64 for demo, NOT real JWT)
   ================================================================ */

function generateMockToken(user: User): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  }))
  const signature = btoa('mock-signature')
  return `${header}.${payload}.${signature}`
}

function decodeMockToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {return null}
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

/* ================================================================
   Auth Service
   ================================================================ */

class AuthServiceImpl {
  /* ── Token Management ── */

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch {
      return null
    }
  }

  private setTokens(tokens: AuthTokens) {
    try {
      localStorage.setItem(TOKEN_KEY, tokens.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    } catch {
      log.error('Failed to store tokens')
    }
  }

  private clearTokens() {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      // ignore
    }
  }

  /* ── Authentication ── */

  /** Mock login — always succeeds with the demo user */
  async login(email: string, _password: string): Promise<{ user: User; tokens: AuthTokens }> {
    log.info('Login attempt', { email })

    // Simulate network delay
    await new Promise(r => setTimeout(r, 500))

    const user = { ...MOCK_USER, email }
    const accessToken = generateMockToken(user)
    const refreshToken = generateMockToken(user) + '-refresh'
    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    }

    this.setTokens(tokens)
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch {
      // ignore
    }

    log.info('Login successful', { userId: user.id })
    return { user, tokens }
  }

  /** Logout — clear all stored credentials */
  async logout(): Promise<void> {
    log.info('Logging out')
    this.clearTokens()
  }

  /** Check if user is currently authenticated */
  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    if (!token) {return false}
    const payload = decodeMockToken(token)
    if (!payload) {return false}
    return payload.exp > Math.floor(Date.now() / 1000)
  }

  /** Get the current user from cache */
  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      if (!raw) {return null}
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  }

  /** Auto-login with mock user (for development) */
  async autoLogin(): Promise<User> {
    if (this.isAuthenticated()) {
      const existing = this.getCurrentUser()
      if (existing) {return existing}
    }
    const { user } = await this.login(MOCK_USER.email, 'demo')
    return user
  }

  /* ── Token Refresh ── */

  async refreshAccessToken(): Promise<AuthTokens | null> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {return null}

    log.info('Refreshing access token')
    await new Promise(r => setTimeout(r, 200))

    const user = this.getCurrentUser() || MOCK_USER
    const newAccessToken = generateMockToken(user)
    const tokens: AuthTokens = {
      accessToken: newAccessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    }

    this.setTokens(tokens)
    return tokens
  }

  /* ── Authorization ── */

  /** Check if the current user has a specific permission */
  hasPermission(resource: string, action: 'read' | 'write' | 'delete' | 'admin'): boolean {
    const user = this.getCurrentUser()
    if (!user) {return false}
    return user.permissions.some(
      p => p.resource === resource && p.actions.includes(action)
    )
  }

  /** Check multiple permissions at once */
  hasAllPermissions(checks: Array<{ resource: string; action: 'read' | 'write' | 'delete' | 'admin' }>): boolean {
    return checks.every(c => this.hasPermission(c.resource, c.action))
  }

  /* ── User Preferences ── */

  async updatePreferences(prefs: Partial<UserPreferences>): Promise<User> {
    const user = this.getCurrentUser() || MOCK_USER
    const updated: User = {
      ...user,
      preferences: { ...user.preferences, ...prefs },
      updatedAt: new Date().toISOString(),
    }
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
    log.info('Preferences updated', prefs)
    return updated
  }
}

/* ================================================================
   Singleton Export
   ================================================================ */

export const authService = new AuthServiceImpl()
