/**
 * @file validation.ts
 * @description YYC³ 数据验证工具 — 输入验证、文件验证、XSS 防护
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 */

/* ================================================================
   Types
   ================================================================ */

export interface ValidationResult {
  valid: boolean
  error?: string
  code?: ValidationErrorCode
}

export type ValidationErrorCode =
  | 'EMPTY'
  | 'TOO_LONG'
  | 'TOO_SHORT'
  | 'INVALID_FORMAT'
  | 'INVALID_CHARS'
  | 'XSS_DETECTED'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_TYPE'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'

/* ================================================================
   Supported File Types
   ================================================================ */

export const SupportedFileTypes = {
  IMAGES: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'],
  FIGMA: ['fig'],
  CODE: ['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'scss', 'less', 'md', 'yaml', 'yml', 'toml'],
  ASSETS: ['css', 'scss', 'woff', 'woff2', 'ttf', 'otf', 'eot'],
  DOCUMENTS: ['md', 'txt', 'pdf', 'doc', 'docx'],
  ALL_ALLOWED: [] as string[], // populated below
} as const

// Build ALL_ALLOWED as a mutable array
;(SupportedFileTypes.ALL_ALLOWED as string[]).push(
  ...SupportedFileTypes.IMAGES,
  ...SupportedFileTypes.FIGMA,
  ...SupportedFileTypes.CODE,
  ...SupportedFileTypes.ASSETS,
  ...SupportedFileTypes.DOCUMENTS,
)

/* ================================================================
   Constants
   ================================================================ */

const MAX_INPUT_LENGTH = 10_000
const MIN_INPUT_LENGTH = 1
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const MIN_PASSWORD_LENGTH = 8

const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /data\s*:\s*text\/html/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* ================================================================
   Input Validation
   ================================================================ */

/** Validate general text input */
export function validateInput(input: string, options?: {
  maxLength?: number
  minLength?: number
  allowHtml?: boolean
}): ValidationResult {
  const maxLen = options?.maxLength ?? MAX_INPUT_LENGTH
  const minLen = options?.minLength ?? MIN_INPUT_LENGTH
  const allowHtml = options?.allowHtml ?? false

  if (!input || input.trim().length === 0) {
    return { valid: false, error: '输入不能为空', code: 'EMPTY' }
  }

  if (input.trim().length < minLen) {
    return { valid: false, error: `输入长度不能少于 ${minLen} 个字符`, code: 'TOO_SHORT' }
  }

  if (input.length > maxLen) {
    return { valid: false, error: `输入长度不能超过 ${maxLen} 个字符`, code: 'TOO_LONG' }
  }

  // XSS protection
  if (!allowHtml) {
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(input)) {
        return { valid: false, error: '输入内容包含不安全的代码', code: 'XSS_DETECTED' }
      }
      // Reset regex lastIndex
      pattern.lastIndex = 0
    }
  }

  return { valid: true }
}

/** Validate email format */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: '邮箱不能为空', code: 'EMPTY' }
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: '邮箱格式不正确', code: 'INVALID_EMAIL' }
  }

  return { valid: true }
}

/** Validate password strength */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length === 0) {
    return { valid: false, error: '密码不能为空', code: 'EMPTY' }
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `密码长度不能少于 ${MIN_PASSWORD_LENGTH} 个字符`, code: 'WEAK_PASSWORD' }
  }

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /\d/.test(password)

  if (!hasUpper || !hasLower || !hasDigit) {
    return { valid: false, error: '密码需包含大小写字母和数字', code: 'WEAK_PASSWORD' }
  }

  return { valid: true }
}

/** Validate project name */
export function validateProjectName(name: string): ValidationResult {
  const base = validateInput(name, { maxLength: 255, minLength: 1 })
  if (!base.valid) {return base}

  // No special filesystem chars
  if (/[\\/:*?"<>|]/.test(name)) {
    return { valid: false, error: '项目名称不能包含特殊字符 (\\/:*?"<>|)', code: 'INVALID_CHARS' }
  }

  return { valid: true }
}

/* ================================================================
   File Validation
   ================================================================ */

/** Validate a file upload */
export function validateFileUpload(file: File, options?: {
  maxSize?: number
  allowedTypes?: string[]
}): ValidationResult {
  const maxSize = options?.maxSize ?? MAX_FILE_SIZE
  const allowedTypes = options?.allowedTypes ?? SupportedFileTypes.ALL_ALLOWED as string[]

  if (file.size === 0) {
    return { valid: false, error: '文件为空', code: 'EMPTY' }
  }

  if (file.size > maxSize) {
    const maxMB = (maxSize / 1024 / 1024).toFixed(1)
    return { valid: false, error: `文件大小不能超过 ${maxMB} MB`, code: 'FILE_TOO_LARGE' }
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !allowedTypes.includes(extension)) {
    return { valid: false, error: `不支持的文件类型: .${extension}`, code: 'UNSUPPORTED_TYPE' }
  }

  return { valid: true }
}

/** Validate image upload specifically */
export function validateImageUpload(file: File): ValidationResult {
  return validateFileUpload(file, {
    maxSize: MAX_IMAGE_SIZE,
    allowedTypes: [...SupportedFileTypes.IMAGES],
  })
}

/** Validate code file upload */
export function validateCodeFileUpload(file: File): ValidationResult {
  return validateFileUpload(file, {
    maxSize: MAX_FILE_SIZE,
    allowedTypes: [...SupportedFileTypes.CODE],
  })
}

/* ================================================================
   Sanitization
   ================================================================ */

/** Strip potential XSS from HTML content */
export function sanitizeHtml(input: string): string {
  let cleaned = input
  for (const pattern of XSS_PATTERNS) {
    cleaned = cleaned.replace(pattern, '')
    pattern.lastIndex = 0
  }
  return cleaned
}

/** Escape HTML entities */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return str.replace(/[&<>"']/g, char => map[char] || char)
}

/* ================================================================
   Component / JSON Validation
   ================================================================ */

/** Validate a DesignJSON structure has required fields */
export function validateDesignJSON(json: unknown): ValidationResult {
  if (!json || typeof json !== 'object') {
    return { valid: false, error: 'Design JSON 必须是对象', code: 'INVALID_FORMAT' }
  }

  const obj = json as Record<string, unknown>
  if (!obj.layout || typeof obj.layout !== 'object') {
    return { valid: false, error: 'Design JSON 缺少 layout 字段', code: 'INVALID_FORMAT' }
  }
  if (!Array.isArray(obj.components)) {
    return { valid: false, error: 'Design JSON 的 components 必须是数组', code: 'INVALID_FORMAT' }
  }

  return { valid: true }
}

/** Validate component position values are sane */
export function validateComponentPosition(pos: unknown): ValidationResult {
  if (!pos || typeof pos !== 'object') {
    return { valid: false, error: '位置数据无效', code: 'INVALID_FORMAT' }
  }
  const p = pos as Record<string, unknown>
  if (typeof p.x !== 'number' || typeof p.y !== 'number') {
    return { valid: false, error: '位置 x/y 必须是数字', code: 'INVALID_FORMAT' }
  }
  if (typeof p.width !== 'number' || p.width <= 0) {
    return { valid: false, error: '宽度必须大于 0', code: 'INVALID_FORMAT' }
  }
  if (typeof p.height !== 'number' || p.height <= 0) {
    return { valid: false, error: '高度必须大于 0', code: 'INVALID_FORMAT' }
  }
  return { valid: true }
}
