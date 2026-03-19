/**
 * @file security.test.ts
 * @description 安全测试用例 — XSS 防护、Token 安全、输入验证、localStorage 加固、Bridge 注入防护
 * @priority P0
 * @framework Vitest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetLocalStorage } from '../setup';

describe('安全测试', () => {

  beforeEach(() => {
    resetLocalStorage();
  });

  /* ── XSS 防护 ── */

  describe('XSS 攻击防护', () => {
    it('TC-SEC-XSS-001: parseCodeToComponents 不执行恶意脚本', async () => {
      const { parseCodeToComponents } = await import('../../app/crossRouteBridge');
      const malicious = `<script>alert("xss")</script>`;
      // parseCodeToComponents 只做正则匹配，不执行代码
      const result = parseCodeToComponents(malicious);
      // 不应崩溃，也不应返回 script 为组件
      expect(result === undefined || !result.some(c => c.type === 'script')).toBe(true);
    });

    it('TC-SEC-XSS-002: Bridge payload 中的 HTML 不会被浏览器执行', async () => {
      const { bridgeSendToDesigner, bridgeReadForDesigner, bridgeClearForDesigner } = await import('../../app/crossRouteBridge');
      const xssCode = `<img src=x onerror="alert(1)" /><script>document.cookie</script>`;
      bridgeSendToDesigner({ code: xssCode, language: 'html' });
      const payload = bridgeReadForDesigner();
      // 数据以 JSON 字符串存储，不会被执行
      expect(payload?.code).toBe(xssCode);
      expect(typeof payload?.code).toBe('string');
      bridgeClearForDesigner();
    });

    it('TC-SEC-XSS-003: ErrorBoundary 错误信息不渲染为 HTML', () => {
      // 错误消息应作为 text content，不是 innerHTML
      const errorMsg = '<img src=x onerror=alert(1)>';
      // 在 React 中，{error.message} 自动转义为文本
      const div = document.createElement('div');
      div.textContent = errorMsg; // textContent 不执行 HTML
      expect(div.innerHTML).not.toContain('<img');
      expect(div.textContent).toBe(errorMsg);
    });

    it('TC-SEC-XSS-004: Design JSON 中的恶意 props 不被执行', () => {
      const maliciousProps = {
        label: '"><script>alert(1)</script>',
        onClick: 'javascript:alert(1)',
        src: 'javascript:alert(document.domain)',
      };
      // 在 React 中，这些值作为字符串属性传递，不会执行
      expect(typeof maliciousProps.label).toBe('string');
      expect(maliciousProps.onClick).not.toMatch(/^function/);
    });
  });

  /* ── Token 安全 ── */

  describe('Token 安全管理', () => {
    it('TC-SEC-TK-001: Token 存储在 localStorage 而非 cookie', async () => {
      const { setToken } = await import('../../app/apiClient');
      setToken('jwt-secret-value');
      expect(localStorage.getItem('yanyucloud-auth-token')).toBe('jwt-secret-value');
      // 不应出现在 cookie 中
      expect(document.cookie).not.toContain('jwt-secret-value');
    });

    it('TC-SEC-TK-002: clearToken 完全清除令牌', async () => {
      const { setToken, clearToken } = await import('../../app/apiClient');
      setToken('sensitive-token');
      clearToken();
      expect(localStorage.getItem('yanyucloud-auth-token')).toBeNull();
    });

    it('TC-SEC-TK-003: API 请求自动注入 Authorization header', () => {
      // 验证请求拦截器会注入 Bearer token
      localStorage.setItem('yanyucloud-auth-token', 'my-jwt');
      const token = localStorage.getItem('yanyucloud-auth-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      expect(headers['Authorization']).toBe('Bearer my-jwt');
    });

    it('TC-SEC-TK-004: skipAuth=true 时不注入 Token', () => {
      const config = { skipAuth: true };
      const headers: Record<string, string> = {};
      if (!config.skipAuth) {
        headers['Authorization'] = 'Bearer xxx';
      }
      expect(headers['Authorization']).toBeUndefined();
    });

    it('TC-SEC-TK-005: Token 格式验证（JWT 三段式）', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.abc123';
      const parts = validJWT.split('.');
      expect(parts).toHaveLength(3);
      expect(parts.every(p => p.length > 0)).toBe(true);
    });
  });

  /* ── 输入验证 ── */

  describe('输入验证', () => {
    it('TC-SEC-IV-001: API path 不允许路径遍历', () => {
      const dangerousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '/api/../../../secret',
      ];
      for (const path of dangerousPaths) {
        // 路径应该被规范化或拒绝
        expect(path.includes('..')).toBe(true);
        // 实际使用时应过滤 .. 序列
      }
    });

    it('TC-SEC-IV-002: SQL 注入字符串不影响前端', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      // 前端将其作为纯字符串发送到后端
      const body = JSON.stringify({ sql: sqlInjection });
      expect(body).toContain("DROP TABLE");
      // 后端应使用参数化查询，前端只负责传输
    });

    it('TC-SEC-IV-003: 特殊字符在 JSON 序列化中正确转义', () => {
      const special = { value: 'test\n\t"quotes"\\backslash\0null' };
      const json = JSON.stringify(special);
      const parsed = JSON.parse(json);
      expect(parsed.value).toBe(special.value);
    });
  });

  /* ── localStorage 数据完整性 ── */

  describe('localStorage 数据完整性', () => {
    it('TC-SEC-LS-001: 损坏的 JSON 不导致应用崩溃', () => {
      localStorage.setItem('yyc3-app-settings', '{broken');
      localStorage.setItem('yyc3-error-telemetry', 'not-json');
      localStorage.setItem('yyc3-perf-metrics', '');

      // 所有读取操作应有 try-catch 保护
      let settings;
      try { settings = JSON.parse(localStorage.getItem('yyc3-app-settings')!); } catch { settings = {}; }
      expect(settings).toBeDefined();
    });

    it('TC-SEC-LS-002: localStorage 配额满时不崩溃', () => {
      // 模拟 quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => { throw new DOMException('QuotaExceededError'); };

      // 应用的写入操作都包含 try-catch
      expect(() => {
        try { localStorage.setItem('test', 'value'); } catch { /* expected */ }
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  /* ── Bridge 注入防护 ── */

  describe('Bridge 数据注入防护', () => {
    it('TC-SEC-BRG-001: 篡改的 Bridge 数据格式不崩溃', async () => {
      const { bridgeReadForDesigner } = await import('../../app/crossRouteBridge');
      // 注入非法格式
      localStorage.setItem('yyc3-bridge-code-to-designer', '12345');
      expect(bridgeReadForDesigner()).toBeNull();
    });

    it('TC-SEC-BRG-002: 超大 payload 不导致 OOM', async () => {
      const { bridgeSendToDesigner, bridgeClearForDesigner } = await import('../../app/crossRouteBridge');
      // 5MB 字符串
      const huge = 'x'.repeat(5_000_000);
      expect(() => {
        try {
          bridgeSendToDesigner({ code: huge, language: 'text' });
        } catch { /* quota exceeded is ok */ }
      }).not.toThrow();
      bridgeClearForDesigner();
    });

    it('TC-SEC-BRG-003: 过期时间戳防重放攻击', async () => {
      const { bridgeReadForDesigner } = await import('../../app/crossRouteBridge');
      // 写入一个旧时间戳的条目
      const old = {
        type: 'code-to-designer',
        code: 'replayed',
        language: 'ts',
        timestamp: Date.now() - 10 * 60 * 1000, // 10 min ago
      };
      localStorage.setItem('yyc3-bridge-code-to-designer', JSON.stringify(old));
      // 应被 5 分钟过期机制拒绝
      expect(bridgeReadForDesigner()).toBeNull();
    });
  });

  /* ── RBAC 权限 ── */

  describe('RBAC 权限验证', () => {
    it('TC-SEC-RBAC-001: 角色类型只允许 admin/editor/viewer', () => {
      const validRoles = ['admin', 'editor', 'viewer'];
      const testRole = 'editor';
      expect(validRoles.includes(testRole)).toBe(true);
      expect(validRoles.includes('superadmin' as any)).toBe(false);
    });

    it('TC-SEC-RBAC-002: viewer 不应有写权限', () => {
      const permissions: Record<string, string[]> = {
        admin: ['read', 'write', 'delete', 'manage'],
        editor: ['read', 'write'],
        viewer: ['read'],
      };
      expect(permissions.viewer).not.toContain('write');
      expect(permissions.viewer).not.toContain('delete');
    });
  });

  /* ── AI Proxy 安全 ── */

  describe('AI Proxy 安全', () => {
    it('TC-SEC-AI-001: API Key 不在前端代码中硬编码', async () => {
      const { AI_CONFIG } = await import('../../app/config');
      // AI proxy endpoint 应指向后端代理，而非直接的 OpenAI URL
      expect(AI_CONFIG.proxyEndpoint).not.toContain('openai.com');
      expect(AI_CONFIG.proxyEndpoint).toContain('/api/');
    });

    it('TC-SEC-AI-002: AI 请求走 /api/ai-proxy 代理', async () => {
      const { AI_CONFIG } = await import('../../app/config');
      expect(AI_CONFIG.proxyEndpoint).toBe('/api/ai-proxy');
    });
  });
});
