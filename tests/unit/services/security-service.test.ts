/**
 * @file security-service.test.ts
 * @description SecurityService 单元测试 - 覆盖率目标: 80%+
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-24
 * @status active
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { securityService } from '@/app/services/security-service'
import type { CSPConfig } from '@/app/types/security'

// Mock logger
vi.mock('@/app/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe('SecurityService', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('checkRateLimit() - 速率限制检查', () => {
    it('初始状态应未被限流', () => {
      const state = securityService.checkRateLimit('api', 'test-client')

      expect(state.isThrottled).toBe(false)
      expect(state.remaining).toBeGreaterThan(0)
      expect(state.retryAfter).toBe(0)
    })

    it('应在达到最大请求次数后限流', () => {
      // 连续发起 100 次请求（api 类型的限制）
      for (let i = 0; i < 100; i++) {
        securityService.recordRequest('api', 'test-client')
      }

      const state = securityService.checkRateLimit('api', 'test-client')

      expect(state.isThrottled).toBe(true)
      expect(state.remaining).toBe(0)
      expect(state.retryAfter).toBeGreaterThan(0)
    })

    it('不同客户端应有独立计数', () => {
      // 客户端 1 消耗限额
      for (let i = 0; i < 100; i++) {
        securityService.recordRequest('api', 'client-1')
      }

      // 客户端 2 应该仍然可用
      const state2 = securityService.checkRateLimit('api', 'client-2')

      expect(state2.isThrottled).toBe(false)
      expect(state2.remaining).toBeGreaterThan(0)
    })

    it('不同类别的限制应独立', () => {
      // auth 类别的限制是 5 次
      for (let i = 0; i < 5; i++) {
        securityService.recordRequest('auth', 'auth-client')
      }

      const authState = securityService.checkRateLimit('auth', 'auth-client')
      const apiState = securityService.checkRateLimit('api', 'api-client')

      expect(authState.isThrottled).toBe(true)
      expect(apiState.isThrottled).toBe(false)
    })

    it('应返回正确的时间戳数组', () => {
      securityService.recordRequest('api', 'client-timestamps')

      const state = securityService.checkRateLimit('api', 'client-timestamps')

      expect(state.timestamps).toBeInstanceOf(Array)
      expect(state.timestamps.length).toBeGreaterThan(0)
    })
  })

  describe('recordRequest() - 记录请求', () => {
    it('应增加请求计数', () => {
      const stateBefore = securityService.checkRateLimit('api', 'client-record')
      const before = stateBefore.remaining

      securityService.recordRequest('api', 'client-record')

      const stateAfter = securityService.checkRateLimit('api', 'client-record')
      expect(stateAfter.remaining).toBe(before - 1)
    })

    it('应为新客户端创建记录', () => {
      securityService.recordRequest('api', 'new-client-xyz')

      const state = securityService.checkRateLimit('api', 'new-client-xyz')

      expect(state.timestamps.length).toBe(1)
    })
  })

  describe('enforceRateLimit() - 强制速率限制', () => {
    it('未超限时应成功', () => {
      expect(() => {
        securityService.enforceRateLimit('api', 'safe-client')
      }).not.toThrow()
    })

    it('超限时应抛出错误', () => {
      // 消耗 auth 限额
      for (let i = 0; i < 10; i++) {
        securityService.recordRequest('auth', 'throttled-client')
      }

      expect(() => {
        securityService.enforceRateLimit('auth', 'throttled-client')
      }).toThrow('登录尝试过多')
    })

    it('超限后应自动记录请求', () => {
      // 消耗限额
      for (let i = 0; i < 99; i++) {
        securityService.recordRequest('api', 'auto-record-client')
      }

      try {
        securityService.enforceRateLimit('api', 'auto-record-client')
      } catch {
        // 预期的错误
      }

      // 验证已记录（第100次请求记录后才超限）
      const state = securityService.checkRateLimit('api', 'auto-record-client')
      expect(state.timestamps.length).toBeGreaterThanOrEqual(100)
    })
  })

  describe('sanitizeHtml() - HTML 净化', () => {
    it('应移除 script 标签', () => {
      const dirty = '<p>Hello <script>alert("XSS")</script> World</p>'
      const clean = securityService.sanitizeHtml(dirty)

      expect(clean).not.toContain('<script>')
      expect(clean).toContain('<p>')
      expect(clean).toContain('Hello')
      expect(clean).toContain('World')
    })

    it('应移除 iframe 标签', () => {
      const dirty = '<iframe src="evil.com"></iframe>'
      const clean = securityService.sanitizeHtml(dirty)

      expect(clean).not.toContain('<iframe')
    })

    it('应移除 object 标签', () => {
      const dirty = '<object data="evil.swf"></object>'
      const clean = securityService.sanitizeHtml(dirty)

      expect(clean).not.toContain('<object')
    })

    it('应移除 embed 标签', () => {
      const dirty = '<embed src="evil.swf" />'
      const clean = securityService.sanitizeHtml(dirty)

      expect(clean).not.toContain('<embed')
    })

    it('应移除事件处理器', () => {
      const dirty = '<button onclick="evil()">Click</button>'
      const clean = securityService.sanitizeHtml(dirty)

      expect(clean).not.toContain('onclick')
    })

    it('应移除 javascript: 协议', () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>'
      const clean = securityService.sanitizeHtml(dirty)

      expect(clean).not.toContain('javascript:')
    })

    it('应保留安全标签', () => {
      const safe = '<b>Bold</b> <i>Italic</i> <p>Paragraph</p> <br/>'
      const clean = securityService.sanitizeHtml(safe)

      expect(clean).toContain('<b>')
      expect(clean).toContain('<i>')
      expect(clean).toContain('<p>')
      expect(clean).toContain('<br')
    })

    it('应保留安全属性', () => {
      const safe = '<a href="https://example.com" class="link">Link</a>'
      const clean = securityService.sanitizeHtml(safe)

      expect(clean).toContain('href=')
      expect(clean).toContain('class=')
    })

    it('应处理嵌套标签', () => {
      const nested = '<section><p><b>Bold text</b></p></section>'
      const clean = securityService.sanitizeHtml(nested)

      // section 和 p 不在安全标签中，会被移除，只保留 b 标签
      expect(clean).toContain('<b>Bold text</b>')
      expect(clean).toContain('Bold text')
    })
  })

  describe('detectSensitiveData() - 敏感数据检测', () => {
    it('应检测 API Key', () => {
      const text = 'api_key=sk_live_abc123xyz789longkey'
      const findings = securityService.detectSensitiveData(text)

      expect(findings.length).toBeGreaterThan(0)
      expect(findings[0].type).toBe('API Key')
    })

    it('应检测 JWT Token', () => {
      const text = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const findings = securityService.detectSensitiveData(text)

      expect(findings.length).toBeGreaterThan(0)
      expect(findings[0].type).toBe('JWT Token')
    })

    it('应检测 Password', () => {
      const text = 'password=MySecretPassword123'
      const findings = securityService.detectSensitiveData(text)

      expect(findings.length).toBeGreaterThan(0)
      expect(findings[0].type).toBe('Password')
    })

    it('应检测 Secret', () => {
      const text = 'secret=mysecretkey12345678'
      const findings = securityService.detectSensitiveData(text)

      expect(findings.length).toBeGreaterThan(0)
      expect(findings.some(f => f.type === 'Secret')).toBe(true)
    })

    it('应检测 Private Key', () => {
      const text = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...'
      const findings = securityService.detectSensitiveData(text)

      expect(findings.length).toBeGreaterThan(0)
      expect(findings[0].type).toBe('Private Key')
    })

    it('应返回匹配位置', () => {
      const text = 'api_key=sk_live_abc123xyz789longkey'
      const findings = securityService.detectSensitiveData(text)

      if (findings.length > 0) {
        expect(findings[0]).toHaveProperty('index')
        expect(findings[0]).toHaveProperty('match')
      }
    })

    it('应检测多个敏感数据', () => {
      const text = 'api_key=sk_live_abc123xyz789longkey password=MyPassword'
      const findings = securityService.detectSensitiveData(text)

      expect(findings.length).toBeGreaterThan(1)
    })

    it('应对普通文本返回空数组', () => {
      const text = 'This is normal text without sensitive data'
      const findings = securityService.detectSensitiveData(text)

      expect(findings.length).toBe(0)
    })
  })

  describe('maskSensitive() - 敏感值遮蔽', () => {
    it('应遮蔽长字符串', () => {
      const value = 'sk_live_1234567890abcdef'
      const masked = securityService.maskSensitive(value, 4)

      expect(masked).toContain('sk_l')
      expect(masked).toContain('def')
      expect(masked).toContain('*')
      expect(masked.length).toBe(value.length)
    })

    it('应保留前后字符', () => {
      const value = 'secret1234567890'
      const masked = securityService.maskSensitive(value, 3)

      expect(masked.startsWith('sec')).toBe(true)
      expect(masked.endsWith('890')).toBe(true)
    })

    it('应完全遮蔽短字符串', () => {
      const value = 'short'
      const masked = securityService.maskSensitive(value, 4)

      expect(masked).toBe('*****')
    })

    it('应支持自定义可见字符数', () => {
      const value = 'verylongvalue1234567890'
      const masked2 = securityService.maskSensitive(value, 2)
      const masked4 = securityService.maskSensitive(value, 4)

      expect(masked2.startsWith('ve')).toBe(true)
      expect(masked4.startsWith('very')).toBe(true)
    })
  })

  describe('getCSPConfig() - CSP 配置', () => {
    it('应返回 CSP 配置对象', () => {
      const config = securityService.getCSPConfig()

      expect(config).toBeDefined()
      expect(config).toHaveProperty('defaultSrc')
      expect(config).toHaveProperty('scriptSrc')
      expect(config).toHaveProperty('styleSrc')
    })

    it('应包含 self 来源', () => {
      const config = securityService.getCSPConfig()

      expect(config.defaultSrc).toContain("'self'")
    })
  })

  describe('buildCSPHeader() - CSP 头构建', () => {
    it('应构建有效的 CSP 头字符串', () => {
      const header = securityService.buildCSPHeader()

      expect(typeof header).toBe('string')
      expect(header).toContain('default-src')
      expect(header).toContain('script-src')
      expect(header).toContain(';')
    })

    it('应使用自定义配置', () => {
      const customConfig: CSPConfig = {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      }

      const header = securityService.buildCSPHeader(customConfig)

      expect(header).toContain('default-src \'self\'')
      expect(header).toContain('script-src \'self\' \'unsafe-inline\'')
    })

    it('应包含所有配置的指令', () => {
      const header = securityService.buildCSPHeader()

      expect(header).toContain('default-src')
      expect(header).toContain('script-src')
      expect(header).toContain('style-src')
      expect(header).toContain('img-src')
      expect(header).toContain('connect-src')
      expect(header).toContain('font-src')
      expect(header).toContain('object-src')
      expect(header).toContain('frame-src')
    })
  })

  describe('addCSPOrigin() - 添加 CSP 来源', () => {
    it('应添加来源到指定指令', () => {
      const configBefore = securityService.getCSPConfig()
      const connectSrcBefore = [...configBefore.connectSrc]

      securityService.addCSPOrigin('connectSrc', 'https://api.example.com')

      const configAfter = securityService.getCSPConfig()
      expect(configAfter.connectSrc.length).toBe(connectSrcBefore.length + 1)
      expect(configAfter.connectSrc).toContain('https://api.example.com')
    })

    it('不应重复添加相同来源', () => {
      const configBefore = securityService.getCSPConfig()
      const connectSrcBefore = configBefore.connectSrc.length

      securityService.addCSPOrigin('connectSrc', 'https://api.openai.com')
      securityService.addCSPOrigin('connectSrc', 'https://api.openai.com')

      const configAfter = securityService.getCSPConfig()
      expect(configAfter.connectSrc.length).toBe(connectSrcBefore)
    })
  })

  describe('runSecurityAudit() - 安全审计', () => {
    it('应返回审计分数', () => {
      const audit = securityService.runSecurityAudit()

      expect(audit).toBeDefined()
      expect(audit.score).toBeGreaterThanOrEqual(0)
      expect(audit.score).toBeLessThanOrEqual(100)
    })

    it('应返回审计等级', () => {
      const audit = securityService.runSecurityAudit()

      expect(['A', 'B', 'C', 'D', 'F']).toContain(audit.grade)
    })

    it('应返回检查详情', () => {
      const audit = securityService.runSecurityAudit()

      expect(audit.checks).toBeInstanceOf(Array)
      expect(audit.checks.length).toBeGreaterThan(0)
    })

    it('每个检查项应有详细信息', () => {
      const audit = securityService.runSecurityAudit()

      audit.checks.forEach(check => {
        expect(check).toHaveProperty('name')
        expect(check).toHaveProperty('passed')
        expect(check).toHaveProperty('details')
        expect(typeof check.passed).toBe('boolean')
        expect(typeof check.details).toBe('string')
      })
    })
  })

  describe('getAuditLog() / clearAuditLog() - 审计日志', () => {
    it('应获取审计日志', () => {
      const log = securityService.getAuditLog()

      expect(log).toBeInstanceOf(Array)
    })

    it('应清空审计日志', () => {
      // 先添加一些日志（通过调用其他方法）
      securityService.runSecurityAudit()

      securityService.clearAuditLog()

      const log = securityService.getAuditLog()
      expect(log.length).toBe(0)
    })
  })

  describe('集成测试', () => {
    it('应完整处理速率限制流程', () => {
      const clientId = 'integration-test'

      // 检查初始状态
      let state = securityService.checkRateLimit('api', clientId)
      expect(state.isThrottled).toBe(false)

      // 发起少量请求
      for (let i = 0; i < 5; i++) {
        securityService.recordRequest('api', clientId)
      }

      state = securityService.checkRateLimit('api', clientId)
      expect(state.isThrottled).toBe(false)
      expect(state.remaining).toBe(95)

      // 消耗至限额
      for (let i = 0; i < 95; i++) {
        securityService.recordRequest('api', clientId)
      }

      state = securityService.checkRateLimit('api', clientId)
      expect(state.isThrottled).toBe(true)
      expect(state.remaining).toBe(0)
    })

    it('应完整处理 HTML 净化流程', () => {
      const dangerousHtml = `
        <section>
          <script>alert('XSS')</script>
          <iframe src="evil.com"></iframe>
          <p onclick="evil()">Click me</p>
          <a href="javascript:alert(1)">Link</a>
          <b>Bold text</b>
        </section>
      `

      const safeHtml = securityService.sanitizeHtml(dangerousHtml)

      // 危险内容应被移除
      expect(safeHtml).not.toContain('<script>')
      expect(safeHtml).not.toContain('<iframe')
      expect(safeHtml).not.toContain('onclick')
      expect(safeHtml).not.toContain('javascript:')

      // 安全内容应保留（b 是安全标签）
      expect(safeHtml).toContain('<b>Bold text</b>')
      expect(safeHtml).toContain('Bold text')
    })

    it('应完整处理敏感数据检测和遮蔽', () => {
      const textWithSecrets = `
        API Key: api_key=sk_live_abc123xyz789longkey
        Password: password=MySecretPassword123
      `

      // 检测
      const findings = securityService.detectSensitiveData(textWithSecrets)
      expect(findings.length).toBeGreaterThan(0)

      // 遮蔽
      const maskedKey = securityService.maskSensitive('sk_live_abc123xyz789longkey')
      expect(maskedKey).not.toBe('sk_live_abc123xyz789longkey')
      expect(maskedKey).toContain('sk_l')
      expect(maskedKey).toContain('key')
    })
  })
})
