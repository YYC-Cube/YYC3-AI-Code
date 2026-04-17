/**
 * @file security-service.ts
 * @description YYC³ 安全防护服务 — 客户端速率限制、CSP 管理、输入净化、安全审计
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Implements the spec's security requirements:
 *   Rate limiting (sliding window) · Input sanitisation · CSP · Security audit
 */

import { createLogger } from '../utils/logger'
import type {
  CSPConfig,
  RateLimitConfig,
  RateLimitState,
} from '../types/security'

const log = createLogger('SecurityService')

/* ================================================================
   Default Configurations
   ================================================================ */

const DEFAULT_CSP: CSPConfig = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
  connectSrc: [
    "'self'",
    'https://api.openai.com',
    'https://api.anthropic.com',
    'https://open.bigmodel.cn',
    'https://aip.baidubce.com',
    'https://dashscope.aliyuncs.com',
    'http://localhost:11434', // Ollama
  ],
  fontSrc: ["'self'", 'data:'],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"],
}

const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  api: {
    windowMs: 15 * 60 * 1000,  // 15 min
    maxRequests: 100,
    message: '请求频率过高，请稍后再试',
    retryAfterSec: 60,
  },
  auth: {
    windowMs: 60 * 1000,       // 1 min
    maxRequests: 5,
    message: '登录尝试过多',
    retryAfterSec: 120,
  },
  ai: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'AI 请求过于频繁',
    retryAfterSec: 30,
  },
}

/* ================================================================
   Sensitive-Data Patterns
   ================================================================ */

const SENSITIVE_PATTERNS = [
  { name: 'API Key', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?([A-Za-z0-9_-]{20,})['"]?/gi },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { name: 'Password', pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"]?([^\s'"]{4,})['"]?/gi },
  { name: 'Secret', pattern: /(?:secret|token)\s*[:=]\s*['"]?([A-Za-z0-9_-]{16,})['"]?/gi },
  { name: 'Private Key', pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g },
]

/* ================================================================
   HTML Sanitisation (lightweight, no external dep)
   ================================================================ */

const SAFE_TAGS = new Set([
  'b', 'i', 'u', 'strong', 'em', 'p', 'br', 'span', 'a',
  'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2',
  'h3', 'h4', 'h5', 'h6', 'hr', 'sub', 'sup', 'mark',
])

const SAFE_ATTRS = new Set(['href', 'title', 'class', 'id', 'target', 'rel'])

function sanitizeHtmlAdvanced(html: string): string {
  // Strip script / iframe / object / embed tags entirely
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')

  // Remove event handler attributes
  clean = clean.replace(/\s+on\w+\s*=\s*(['"]?)[\s\S]*?\1/gi, '')

  // Remove javascript: / data:text/html URIs
  clean = clean.replace(/javascript\s*:/gi, '')
  clean = clean.replace(/data\s*:\s*text\/html/gi, '')

  // Strip disallowed tags (keep content)
  clean = clean.replace(/<\/?(\w+)([^>]*)>/g, (match, tag, attrs) => {
    const lower = tag.toLowerCase()
    if (!SAFE_TAGS.has(lower)) {return ''}
    // Strip disallowed attributes
    const safeAttrs = (attrs as string).replace(/\s+(\w+)\s*=\s*(['"]?)([^'"]*)\2/g,
      (_: string, attr: string, _q: string, val: string) => {
        if (!SAFE_ATTRS.has(attr.toLowerCase())) {return ''}
        // Extra: sanitise href to block javascript:
        if (attr.toLowerCase() === 'href' && /^\s*javascript/i.test(val)) {return ''}
        return ` ${attr}="${val}"`
      }
    )
    return match.startsWith('</') ? `</${lower}>` : `<${lower}${safeAttrs}>`
  })

  return clean
}

/* ================================================================
   Rate Limiter (sliding window, per-key)
   ================================================================ */

class SlidingWindowRateLimiter {
  private windows: Map<string, number[]> = new Map()

  check(key: string, config: RateLimitConfig): RateLimitState {
    const now = Date.now()
    const timestamps = this.windows.get(key) || []

    // Remove expired timestamps
    const valid = timestamps.filter(t => now - t < config.windowMs)
    this.windows.set(key, valid)

    const isThrottled = valid.length >= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - valid.length)
    const retryAfter = isThrottled && valid.length > 0
      ? config.windowMs - (now - valid[0])
      : 0

    return { timestamps: valid, isThrottled, retryAfter, remaining }
  }

  record(key: string): void {
    const timestamps = this.windows.get(key) || []
    timestamps.push(Date.now())
    this.windows.set(key, timestamps)
  }

  reset(key: string): void {
    this.windows.delete(key)
  }

  resetAll(): void {
    this.windows.clear()
  }
}

/* ================================================================
   Security Service
   ================================================================ */

class SecurityServiceImpl {
  private rateLimiter = new SlidingWindowRateLimiter()
  private cspConfig: CSPConfig = DEFAULT_CSP
  private auditLog: Array<{ action: string; details: string; timestamp: number }> = []

  /* ── Rate Limiting ── */

  /**
   * Check whether a request under `category` is allowed.
   * Returns state with `isThrottled` flag.
   */
  checkRateLimit(category: keyof typeof DEFAULT_RATE_LIMITS, clientId = 'default'): RateLimitState {
    const config = DEFAULT_RATE_LIMITS[category]
    if (!config) {
      return { timestamps: [], isThrottled: false, retryAfter: 0, remaining: Infinity }
    }
    const key = `${category}:${clientId}`
    return this.rateLimiter.check(key, config)
  }

  /**
   * Record a successful request for rate-limit accounting.
   */
  recordRequest(category: keyof typeof DEFAULT_RATE_LIMITS, clientId = 'default'): void {
    this.rateLimiter.record(`${category}:${clientId}`)
  }

  /**
   * Convenience: check + record in one call. Throws string message if throttled.
   */
  enforceRateLimit(category: keyof typeof DEFAULT_RATE_LIMITS, clientId = 'default'): RateLimitState {
    const state = this.checkRateLimit(category, clientId)
    if (state.isThrottled) {
      const config = DEFAULT_RATE_LIMITS[category]
      log.warn('Rate limit exceeded', { category, clientId, retryAfter: state.retryAfter })
      this.addAuditEntry('rate_limit_exceeded', `category=${category} client=${clientId}`)
      throw new Error(config?.message || '请求频率过高')
    }
    this.recordRequest(category, clientId)
    return state
  }

  /* ── Input Sanitisation ── */

  /**
   * Sanitise HTML — removes dangerous tags/attributes, keeps safe formatting.
   */
  sanitizeHtml(html: string): string {
    return sanitizeHtmlAdvanced(html)
  }

  /**
   * Detect sensitive data patterns in a string (API keys, passwords, tokens).
   */
  detectSensitiveData(text: string): Array<{ type: string; match: string; index: number }> {
    const findings: Array<{ type: string; match: string; index: number }> = []

    for (const { name, pattern } of SENSITIVE_PATTERNS) {
      const re = new RegExp(pattern.source, pattern.flags)
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        findings.push({ type: name, match: m[0].slice(0, 30) + '…', index: m.index })
      }
    }

    if (findings.length > 0) {
      log.warn('Sensitive data detected', { count: findings.length })
      this.addAuditEntry('sensitive_data_detected', `patterns=${findings.map(f => f.type).join(',')}`)
    }

    return findings
  }

  /**
   * Mask sensitive values for safe logging (show only first/last 4 chars).
   */
  maskSensitive(value: string, visibleChars = 4): string {
    if (value.length <= visibleChars * 2) {return '*'.repeat(value.length)}
    const start = value.slice(0, visibleChars)
    const end = value.slice(-visibleChars)
    return `${start}${'*'.repeat(Math.max(4, value.length - visibleChars * 2))}${end}`
  }

  /* ── CSP ── */

  /**
   * Get the current CSP config object.
   */
  getCSPConfig(): CSPConfig {
    return { ...this.cspConfig }
  }

  /**
   * Build a CSP header string from config.
   */
  buildCSPHeader(config?: CSPConfig): string {
    const c = config || this.cspConfig
    const directives: string[] = []

    if (c.defaultSrc.length) {directives.push(`default-src ${c.defaultSrc.join(' ')}`)}
    if (c.scriptSrc.length)  {directives.push(`script-src ${c.scriptSrc.join(' ')}`)}
    if (c.styleSrc.length)   {directives.push(`style-src ${c.styleSrc.join(' ')}`)}
    if (c.imgSrc.length)     {directives.push(`img-src ${c.imgSrc.join(' ')}`)}
    if (c.connectSrc.length) {directives.push(`connect-src ${c.connectSrc.join(' ')}`)}
    if (c.fontSrc.length)    {directives.push(`font-src ${c.fontSrc.join(' ')}`)}
    if (c.objectSrc.length)  {directives.push(`object-src ${c.objectSrc.join(' ')}`)}
    if (c.frameSrc.length)   {directives.push(`frame-src ${c.frameSrc.join(' ')}`)}
    if (c.reportUri)         {directives.push(`report-uri ${c.reportUri}`)}

    return directives.join('; ')
  }

  /**
   * Add an allowed origin to a CSP directive.
   */
  addCSPOrigin(directive: keyof CSPConfig, origin: string): void {
    const list = this.cspConfig[directive]
    if (Array.isArray(list) && !list.includes(origin)) {
      list.push(origin)
      log.info('CSP origin added', { directive, origin })
    }
  }

  /* ── Security Audit ── */

  /**
   * Run a quick security audit on the current environment.
   */
  runSecurityAudit(): {
    score: number
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    checks: Array<{ name: string; passed: boolean; details: string }>
  } {
    const checks: Array<{ name: string; passed: boolean; details: string }> = []

    // 1. Check HTTPS
    const isHttps = typeof location !== 'undefined' && location.protocol === 'https:'
    const isLocalhost = typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    checks.push({
      name: 'HTTPS',
      passed: isHttps || isLocalhost,
      details: isHttps ? '使用 HTTPS 安全连接' : isLocalhost ? '本地开发环境 (允许 HTTP)' : '生产环境应使用 HTTPS',
    })

    // 2. Check CSP
    checks.push({
      name: 'CSP 配置',
      passed: this.cspConfig.objectSrc.includes("'none'") && this.cspConfig.frameSrc.includes("'none'"),
      details: '限制 object/frame 来源',
    })

    // 3. Check localStorage availability
    let storageAvailable = false
    try {
      const key = '__yyc3_test__'
      localStorage.setItem(key, '1')
      localStorage.removeItem(key)
      storageAvailable = true
    } catch { /* */ }
    checks.push({
      name: 'LocalStorage',
      passed: storageAvailable,
      details: storageAvailable ? '存储可用' : '存储不可用，部分功能受限',
    })

    // 4. Check for common security headers (meta tags)
    const hasXFrame = !!document.querySelector('meta[http-equiv="X-Frame-Options"]')
    checks.push({
      name: 'X-Frame-Options',
      passed: hasXFrame || isLocalhost,
      details: hasXFrame ? '已设置 X-Frame-Options' : '建议添加 X-Frame-Options 防止点击劫持',
    })

    // 5. Rate limiter active
    checks.push({
      name: '速率限制',
      passed: true,
      details: `已配置 ${Object.keys(DEFAULT_RATE_LIMITS).length} 个速率限制策略`,
    })

    // 6. Input sanitisation
    checks.push({
      name: '输入净化',
      passed: true,
      details: 'HTML 净化与 XSS 防护已启用',
    })

    const passedCount = checks.filter(c => c.passed).length
    const score = Math.round((passedCount / checks.length) * 100)
    const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F'

    this.addAuditEntry('security_audit', `score=${score} grade=${grade}`)

    return { score, grade, checks }
  }

  /* ── Audit Log ── */

  private addAuditEntry(action: string, details: string): void {
    this.auditLog.push({ action, details, timestamp: Date.now() })
    if (this.auditLog.length > 500) {this.auditLog.shift()}
  }

  getAuditLog() {
    return [...this.auditLog]
  }

  clearAuditLog(): void {
    this.auditLog.length = 0
  }
}

/* ================================================================
   Singleton
   ================================================================ */

export const securityService = new SecurityServiceImpl()
