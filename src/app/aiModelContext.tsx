/**
 * @file aiModelContext.tsx
 * @description 全局 AI 模型配置与统一认证 Context — 跨路由共享 API Keys、模型选择、OAuth 会话管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-08
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,context,auth,oauth,model,global
 */

/**
 * Global AI Model Configuration + Unified Auth Context
 *
 * Shared across all routes (Home, Designer, AI Code System).
 * Persists API keys, selected model, and auth session to localStorage.
 * Does NOT depend on DesignerProvider — lives at the app root.
 *
 * Auth Architecture:
 * - OpenAI OAuth / local JWT dual-auth
 * - Session persisted in localStorage with expiry
 * - Token auto-refresh via configurable interval
 * - Usage quota tracking per user session
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

/* ================================================================
   Types — Models
   ================================================================ */

export interface GlobalAIModel {
  id: string;
  name: string;
  provider: 'openai' | 'ollama' | 'custom';
  endpoint: string;
  badge: string;
  providerLabel: string;
}

/* ================================================================
   Types — Auth
   ================================================================ */

export type AuthProvider = 'openai' | 'local' | 'enterprise';
export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'expired' | 'error';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: AuthProvider;
  role: 'admin' | 'user' | 'viewer';
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (ms)
  provider: AuthProvider;
  scopes: string[];
}

export interface AuthQuota {
  tokensUsed: number;
  tokensLimit: number;
  requestsUsed: number;
  requestsLimit: number;
  resetAt: number; // Unix timestamp (ms)
}

/* ================================================================
   Types — Full Context
   ================================================================ */

export interface GlobalAIContextType {
  // Models
  models: GlobalAIModel[];
  activeModelId: string;
  apiKeys: Record<string, string>;
  setActiveModel: (id: string) => void;
  setApiKey: (modelId: string, key: string) => void;
  setApiKeys: (keys: Record<string, string>) => void;
  getActiveModel: () => GlobalAIModel | undefined;
  getApiKey: (modelId: string) => string;
  hasApiKey: (modelId: string) => boolean;

  // Auth
  authStatus: AuthStatus;
  session: AuthSession | null;
  quota: AuthQuota;
  login: (provider: AuthProvider, credentials?: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  getAuthHeader: () => Record<string, string>;
  trackUsage: (tokens: number) => void;
}

/* ================================================================
   Default Models — shared source of truth
   ================================================================ */

export const GLOBAL_AI_MODELS: GlobalAIModel[] = [
  {
    id: 'glm-4.5',
    name: 'GLM-4.5',
    provider: 'custom',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    badge: 'text-cyan-400/70 bg-cyan-500/10 border-cyan-500/15',
    providerLabel: 'ZhipuAI',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    badge: 'text-emerald-400/70 bg-emerald-500/10 border-emerald-500/15',
    providerLabel: 'OpenAI',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'custom',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    badge: 'text-violet-400/70 bg-violet-500/10 border-violet-500/15',
    providerLabel: 'DeepSeek',
  },
  {
    id: 'qwen-plus',
    name: 'Qwen Plus',
    provider: 'custom',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    badge: 'text-amber-400/70 bg-amber-500/10 border-amber-500/15',
    providerLabel: 'Qwen',
  },
  {
    id: 'local-ollama',
    name: 'Ollama',
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    badge: 'text-rose-400/70 bg-rose-500/10 border-rose-500/15',
    providerLabel: 'Local',
  },
];

/* ================================================================
   Storage Helpers
   ================================================================ */

const KEYS_STORAGE = 'yyc3-ai-model-keys';
const ACTIVE_STORAGE = 'yyc3-ai-active-model';
const SESSION_STORAGE = 'yyc3-auth-session';
const QUOTA_STORAGE = 'yyc3-auth-quota';

function loadJSON<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveJSON(key: string, value: any) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function loadKeys(): Record<string, string> { return loadJSON(KEYS_STORAGE, {}); }
function saveKeys(keys: Record<string, string>) { saveJSON(KEYS_STORAGE, keys); }
function loadActive(): string { return loadJSON(ACTIVE_STORAGE, 'glm-4.5') as string; }
function saveActive(id: string) { saveJSON(ACTIVE_STORAGE, id); }

function loadSession(): AuthSession | null {
  const s = loadJSON<AuthSession | null>(SESSION_STORAGE, null);
  if (s && s.expiresAt > Date.now()) return s;
  // Expired — clear
  try { localStorage.removeItem(SESSION_STORAGE); } catch {}
  return null;
}
function saveSession(s: AuthSession | null) {
  if (s) saveJSON(SESSION_STORAGE, s);
  else try { localStorage.removeItem(SESSION_STORAGE); } catch {}
}

const DEFAULT_QUOTA: AuthQuota = {
  tokensUsed: 0,
  tokensLimit: 500000,
  requestsUsed: 0,
  requestsLimit: 1000,
  resetAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
};

function loadQuota(): AuthQuota {
  const q = loadJSON<AuthQuota>(QUOTA_STORAGE, DEFAULT_QUOTA);
  // Reset if expired
  if (q.resetAt < Date.now()) return { ...DEFAULT_QUOTA, resetAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };
  return q;
}
function saveQuota(q: AuthQuota) { saveJSON(QUOTA_STORAGE, q); }

/* ================================================================
   JWT Helpers (local token generation for demo)
   ================================================================ */

function generateLocalJWT(user: AuthUser): string {
  // Simple base64-encoded JWT-like token for demo
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
  }));
  const signature = btoa('yyc3-local-signature-' + user.id);
  return `${header}.${payload}.${signature}`;
}

/* ================================================================
   Context
   ================================================================ */

const CTX_KEY = '__YYC3_GLOBAL_AI_CTX__';
const GlobalAIContext: React.Context<GlobalAIContextType | null> =
  (globalThis as any)[CTX_KEY] ??
  ((globalThis as any)[CTX_KEY] = createContext<GlobalAIContextType | null>(null));

export function useGlobalAI(): GlobalAIContextType {
  const ctx = useContext(GlobalAIContext);
  if (!ctx) throw new Error('useGlobalAI must be used within GlobalAIProvider');
  return ctx;
}

/* ================================================================
   Provider
   ================================================================ */

export function GlobalAIProvider({ children }: { children: ReactNode }) {
  // Model state
  const [apiKeys, setApiKeysState] = useState<Record<string, string>>(loadKeys);
  const [activeModelId, setActiveModelIdState] = useState<string>(loadActive);

  // Auth state
  const [session, setSessionState] = useState<AuthSession | null>(loadSession);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    loadSession() ? 'authenticated' : 'idle'
  );
  const [quota, setQuotaState] = useState<AuthQuota>(loadQuota);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist model changes
  useEffect(() => { saveKeys(apiKeys); }, [apiKeys]);
  useEffect(() => { saveActive(activeModelId); }, [activeModelId]);

  // Persist auth changes
  useEffect(() => { saveSession(session); }, [session]);
  useEffect(() => { saveQuota(quota); }, [quota]);

  // Auto-check session expiry every minute
  useEffect(() => {
    const check = () => {
      if (session && session.expiresAt < Date.now()) {
        setAuthStatus('expired');
        setSessionState(null);
      }
    };
    const timer = setInterval(check, 60 * 1000);
    check(); // immediate check
    return () => clearInterval(timer);
  }, [session]);

  // ── Model actions ──

  const setActiveModel = useCallback((id: string) => {
    setActiveModelIdState(id);
  }, []);

  const setApiKey = useCallback((modelId: string, key: string) => {
    setApiKeysState(prev => ({ ...prev, [modelId]: key }));
  }, []);

  const setApiKeys = useCallback((keys: Record<string, string>) => {
    setApiKeysState(keys);
  }, []);

  const getActiveModel = useCallback(() => {
    return GLOBAL_AI_MODELS.find(m => m.id === activeModelId);
  }, [activeModelId]);

  const getApiKey = useCallback((modelId: string) => {
    return apiKeys[modelId] || '';
  }, [apiKeys]);

  const hasApiKey = useCallback((modelId: string) => {
    const model = GLOBAL_AI_MODELS.find(m => m.id === modelId);
    if (model?.provider === 'ollama') return true;
    return !!apiKeys[modelId];
  }, [apiKeys]);

  // ── Auth actions ──

  const login = useCallback(async (provider: AuthProvider, credentials?: { email: string; password: string }) => {
    setAuthStatus('authenticating');

    try {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1200));

      let user: AuthUser;
      let token: string;

      if (provider === 'openai') {
        // OpenAI OAuth flow — in production this would redirect to OpenAI's OAuth page
        // For demo, we simulate a successful OAuth callback
        user = {
          id: 'openai-' + Date.now().toString(36),
          name: 'YYC3 Developer',
          email: 'dev@yyc3.cn',
          avatar: undefined,
          provider: 'openai',
          role: 'admin',
        };
        token = generateLocalJWT(user);
      } else if (provider === 'enterprise') {
        // Enterprise IdP (OIDC) flow
        user = {
          id: 'ent-' + Date.now().toString(36),
          name: credentials?.email?.split('@')[0] || 'Enterprise User',
          email: credentials?.email || 'user@corp.yyc3.cn',
          avatar: undefined,
          provider: 'enterprise',
          role: 'user',
        };
        token = generateLocalJWT(user);
      } else {
        // Local JWT auth
        user = {
          id: 'local-' + Date.now().toString(36),
          name: credentials?.email?.split('@')[0] || 'Local User',
          email: credentials?.email || 'admin@localhost',
          avatar: undefined,
          provider: 'local',
          role: 'admin',
        };
        token = generateLocalJWT(user);
      }

      const newSession: AuthSession = {
        user,
        token,
        refreshToken: 'refresh-' + Date.now().toString(36) + Math.random().toString(36).slice(2),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        provider,
        scopes: ['ai:read', 'ai:write', 'design:read', 'design:write', 'admin:basic'],
      };

      setSessionState(newSession);
      setAuthStatus('authenticated');

      // Reset quota on new login
      setQuotaState({
        ...DEFAULT_QUOTA,
        resetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });
    } catch (err) {
      setAuthStatus('error');
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setSessionState(null);
    setAuthStatus('idle');
    try { localStorage.removeItem(SESSION_STORAGE); } catch {}
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session) return;

    try {
      // Simulate token refresh
      await new Promise(r => setTimeout(r, 500));
      const newToken = generateLocalJWT(session.user);
      setSessionState(prev => prev ? {
        ...prev,
        token: newToken,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      } : null);
      setAuthStatus('authenticated');
    } catch {
      setAuthStatus('expired');
    }
  }, [session]);

  const getAuthHeader = useCallback((): Record<string, string> => {
    if (!session?.token) return {};
    return { 'Authorization': `Bearer ${session.token}` };
  }, [session]);

  const trackUsage = useCallback((tokens: number) => {
    setQuotaState(prev => ({
      ...prev,
      tokensUsed: prev.tokensUsed + tokens,
      requestsUsed: prev.requestsUsed + 1,
    }));
  }, []);

  const isAuthenticated = authStatus === 'authenticated' && !!session;

  // ── Build context value ──

  const value: GlobalAIContextType = {
    // Models
    models: GLOBAL_AI_MODELS,
    activeModelId,
    apiKeys,
    setActiveModel,
    setApiKey,
    setApiKeys,
    getActiveModel,
    getApiKey,
    hasApiKey,

    // Auth
    authStatus,
    session,
    quota,
    login,
    logout,
    refreshSession,
    isAuthenticated,
    getAuthHeader,
    trackUsage,
  };

  return (
    <GlobalAIContext.Provider value={value}>
      {children}
    </GlobalAIContext.Provider>
  );
}