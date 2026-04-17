/**
 * @file validation.test.ts
 * @description Validation 工具函数单元测试 - 覆盖率目标: 90%+
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-24
 * @status active
 * @license MIT
 * 
 * @note 结合 2026 年智能应用趋势，采用现代化测试实践：
 * - 数据驱动测试（describe.each）
 * - 边界值测试
 * - 性能测试
 * - 安全性验证测试
 * - 正则表达式测试
 * - 类型安全测试
 * 
 * @tech-stack-2026:
 * - Vitest (快速测试框架）
 * - TypeScript (严格类型检查）
 * - TDD (测试驱动开发）
 * - 测试覆盖率监控
 */

import { describe, it, expect } from 'vitest'
import {
  validateInput,
  validateEmail,
  validatePassword,
  validateProjectName,
  validateFileUpload,
  validateImageUpload,
  validateCodeFileUpload,
  sanitizeHtml,
  escapeHtml,
  validateDesignJSON,
  validateComponentPosition,
  type ValidationResult,
} from '@/app/utils/validation'

describe('Validation 工具函数', () => {
  // ============================================
  // Input Validation Tests
  // ============================================
  
  describe('validateInput() - 输入验证', () => {
    describe('空值验证', () => {
      it.each([
        ['', '空字符串'],
        ['   ', '只有空格'],
        [null as any, 'null'],
        [undefined as any, 'undefined'],
      ])('应该拒绝 %s', (input, desc) => {
        const result = validateInput(input)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('EMPTY')
        expect(result.error).toContain('不能为空')
      })
    })

    describe('长度验证', () => {
      it('应该接受合法长度的输入', () => {
        const result = validateInput('Valid input')
        expect(result.valid).toBe(true)
      })

      it('应该拒绝太短的输入', () => {
        const result = validateInput('')
        expect(result.valid).toBe(false)
        expect(result.code).toBe('EMPTY')
      })

      it('应该拒绝太长的输入', () => {
        const longInput = 'a'.repeat(10001)
        const result = validateInput(longInput)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('TOO_LONG')
      })

      it('应该使用自定义长度限制', () => {
        const shortInput = 'Short'
        const result = validateInput(shortInput, { maxLength: 3 })
        expect(result.valid).toBe(false)
        expect(result.code).toBe('TOO_LONG')
      })

      it('应该使用自定义最小长度', () => {
        const shortInput = 'A'
        const result = validateInput(shortInput, { minLength: 3 })
        expect(result.valid).toBe(false)
        expect(result.code).toBe('TOO_SHORT')
      })
    })

    describe('XSS 防护测试', () => {
      it.each([
        ['<script>alert("XSS")</script>', 'script 标签'],
        ['<img src=x onerror=alert(1)>', 'img 事件处理器'],
        ['javascript:alert(1)', 'javascript: 协议'],
        ['<iframe src="evil.com"></iframe>', 'iframe 标签'],
        ['<object data="evil.swf"></object>', 'object 标签'],
        ['<embed src="evil.swf" />', 'embed 标签'],
        ['<div onclick="evil()">Click</div>', 'onclick 事件'],
        ['<a href="javascript:void(0)">Link</a>', 'javascript: href'],
        ['data:text/html,<script>alert(1)</script>', 'data: URI'],
      ])('应该检测 XSS 攻击: %s', (input, desc) => {
        const result = validateInput(input)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('XSS_DETECTED')
        expect(result.error).toContain('不安全的代码')
      })

      it('应该允许 HTML 当明确允许时', () => {
        const htmlInput = '<div>Hello</div>'
        const result = validateInput(htmlInput, { allowHtml: true })
        expect(result.valid).toBe(true)
      })
    })

    describe('边界值测试', () => {
      it('应该接受最小长度输入', () => {
        const result = validateInput('A', { minLength: 1 })
        expect(result.valid).toBe(true)
      })

      it('应该接受最大长度输入', () => {
        const input = 'A'.repeat(10000)
        const result = validateInput(input, { maxLength: 10000 })
        expect(result.valid).toBe(true)
      })

      it('应该拒绝刚好超过最大长度', () => {
        const input = 'A'.repeat(10001)
        const result = validateInput(input, { maxLength: 10000 })
        expect(result.valid).toBe(false)
      })
    })
  })

  // ============================================
  // Email Validation Tests
  // ============================================
  
  describe('validateEmail() - 邮箱验证', () => {
    describe('有效邮箱', () => {
      it.each([
        ['test@example.com', '标准邮箱'],
        ['user.name@domain.com', '带点号'],
        ['user+tag@example.com', '带加号'],
        ['user123@example.co.uk', '子域名'],
        ['user@sub.example.com', '多级子域名'],
        ['a@b.c', '最短有效邮箱'],
        ['very.long.email.address@company.name.com', '长邮箱地址'],
      ])('应该接受 %s', (email, desc) => {
        const result = validateEmail(email)
        expect(result.valid).toBe(true)
      })
    })

    describe('无效邮箱', () => {
      it.each([
        ['', '空字符串', 'EMPTY'],
        ['invalid', '缺少 @ 符号', 'INVALID_EMAIL'],
        ['@example.com', '缺少用户名', 'INVALID_EMAIL'],
        ['user@', '缺少域名', 'INVALID_EMAIL'],
        ['user@.com', '域名只有点号', 'INVALID_EMAIL'],
        ['user@@example.com', '多个 @ 符号', 'INVALID_EMAIL'],
        ['user@example', '缺少顶级域名', 'INVALID_EMAIL'],
        ['user name@example.com', '用户名有空格', 'INVALID_EMAIL'],
      ])('应该拒绝 %s: %s', (email, desc, expectedCode) => {
        const result = validateEmail(email)
        expect(result.valid).toBe(false)
        expect(result.code).toBe(expectedCode)
      })
    })

    describe('边界情况', () => {
      it('应该处理空格', () => {
        const result = validateEmail('  test@example.com  ')
        expect(result.valid).toBe(false)
      })

      it('应该处理空邮箱', () => {
        const result = validateEmail('')
        expect(result.valid).toBe(false)
        expect(result.code).toBe('EMPTY')
      })
    })
  })

  // ============================================
  // Password Validation Tests
  // ============================================
  
  describe('validatePassword() - 密码验证', () => {
    describe('强度要求', () => {
      it('应该拒绝空密码', () => {
        const result = validatePassword('')
        expect(result.valid).toBe(false)
        expect(result.code).toBe('EMPTY')
      })

      it('应该拒绝短密码', () => {
        const result = validatePassword('short')
        expect(result.valid).toBe(false)
        expect(result.code).toBe('WEAK_PASSWORD')
        expect(result.error).toContain('少于')
      })

      it('应该要求大写字母', () => {
        const result = validatePassword('lowercase123')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('大小写字母')
      })

      it('应该要求小写字母', () => {
        const result = validatePassword('UPPERCASE123')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('大小写字母')
      })

      it('应该要求数字', () => {
        const result = validatePassword('PasswordABC')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('数字')
      })
    })

    describe('有效密码', () => {
      it.each([
        ['Password123', '基本密码'],
        ['StrongP@ss123', '带特殊字符'],
        ['MySecurePass2026!', '复杂密码'],
        ['Aa1Bb2Cc3', '交替模式'],
      ])('应该接受 %s', (password, desc) => {
        const result = validatePassword(password)
        expect(result.valid).toBe(true)
      })
    })

    describe('边界值', () => {
      it('应该接受最小长度密码', () => {
        const result = validatePassword('Aa123456')
        expect(result.valid).toBe(true)
      })

      it('应该拒绝刚好短于最小长度', () => {
        const result = validatePassword('Aa12345')
        expect(result.valid).toBe(false)
        expect(result.code).toBe('WEAK_PASSWORD')
      })
    })
  })

  // ============================================
  // Project Name Validation Tests
  // ============================================
  
  describe('validateProjectName() - 项目名称验证', () => {
    describe('有效项目名', () => {
      it.each([
        ['My Project', '带空格'],
        ['project-123', '带数字和连字符'],
        ['my_project_v2', '带下划线'],
        ['Project2026', '纯数字后缀'],
        ['a', '单字符'],
        ['My Awesome Project Name', '多空格'],
      ])('应该接受 %s', (name, desc) => {
        const result = validateProjectName(name)
        expect(result.valid).toBe(true)
      })
    })

    describe('特殊字符检查', () => {
      it.each([
        ['project/name', '斜杠'],
        ['project\\name', '反斜杠'],
        ['project:name', '冒号'],
        ['project*name', '星号'],
        ['project?name', '问号'],
        ['project<name>', '尖括号'],
        ['project|name', '管道符'],
      ])('应该拒绝包含 %s 的名称', (name, char) => {
        const result = validateProjectName(name)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('INVALID_CHARS')
        expect(result.error).toContain('特殊字符')
      })
    })

    describe('长度验证', () => {
      it('应该拒绝空项目名', () => {
        const result = validateProjectName('')
        expect(result.valid).toBe(false)
        expect(result.code).toBe('EMPTY')
      })

      it('应该拒绝超长项目名', () => {
        const longName = 'A'.repeat(256)
        const result = validateProjectName(longName)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('TOO_LONG')
      })
    })
  })

  // ============================================
  // File Upload Validation Tests
  // ============================================
  
  describe('validateFileUpload() - 文件上传验证', () => {
    const createMockFile = (name: string, size: number, type = 'text/plain'): File => {
      const buffer = new Uint8Array(size)
      const blob = new Blob([buffer], { type })
      return new File([blob], name, { type })
    }

    describe('文件大小验证', () => {
      it('应该拒绝空文件', () => {
        const file = createMockFile('empty.txt', 0)
        const result = validateFileUpload(file)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('EMPTY')
      })

      it('应该拒绝超大文件', () => {
        const largeFile = createMockFile('large.txt', 11 * 1024 * 1024)
        const result = validateFileUpload(largeFile)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('FILE_TOO_LARGE')
        expect(result.error).toContain('MB')
      })

      it('应该接受正常大小的文件', () => {
        const file = createMockFile('normal.txt', 1024 * 1024) // 1MB
        const result = validateFileUpload(file)
        expect(result.valid).toBe(true)
      })
    })

    describe('文件类型验证', () => {
      it('应该拒绝不支持的文件类型', () => {
        const file = createMockFile('test.exe', 1024)
        const result = validateFileUpload(file)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('UNSUPPORTED_TYPE')
        expect(result.error).toContain('.exe')
      })

      it('应该接受支持的文件类型', () => {
        const supportedFiles = [
          'test.tsx',
          'test.css',
          'test.json',
          'test.png',
          'test.jpg',
        ]

        supportedFiles.forEach(fileName => {
          const file = createMockFile(fileName, 1024)
          const result = validateFileUpload(file)
          expect(result.valid).toBe(true)
        })
      })

      it('应该允许自定义文件类型', () => {
        const file = createMockFile('test.custom', 1024)
        const result = validateFileUpload(file, {
          allowedTypes: ['custom'],
        })
        expect(result.valid).toBe(true)
      })
    })

    describe('边界值', () => {
      it('应该接受刚好在大小限制内的文件', () => {
        const file = createMockFile('boundary.txt', 10 * 1024 * 1024)
        const result = validateFileUpload(file)
        expect(result.valid).toBe(true)
      })

      it('应该使用自定义大小限制', () => {
        const file = createMockFile('custom.txt', 6 * 1024 * 1024)
        const result = validateFileUpload(file, {
          maxSize: 5 * 1024 * 1024,
        })
        expect(result.valid).toBe(false)
        expect(result.code).toBe('FILE_TOO_LARGE')
      })
    })
  })

  // ============================================
  // Image Upload Validation Tests
  // ============================================
  
  describe('validateImageUpload() - 图片上传验证', () => {
    const createMockImage = (name: string, size: number, type = 'image/png'): File => {
      const buffer = new Uint8Array(size)
      const blob = new Blob([buffer], { type })
      return new File([blob], name, { type })
    }

    describe('支持的图片格式', () => {
      it.each([
        ['image.png', 'PNG 格式'],
        ['image.jpg', 'JPG 格式'],
        ['image.jpeg', 'JPEG 格式'],
        ['image.gif', 'GIF 格式'],
        ['image.svg', 'SVG 格式'],
        ['image.webp', 'WebP 格式'],
      ])('应该接受 %s', (fileName, desc) => {
        const file = createMockImage(fileName, 1024)
        const result = validateImageUpload(file)
        expect(result.valid).toBe(true)
      })
    })

    describe('不支持的图片格式', () => {
      it.each([
        ['image.tiff', 'TIFF 格式'],
        ['image.webm', 'WebM 视频格式'],
      ])('应该拒绝 %s', (fileName, desc) => {
        const file = createMockImage(fileName, 1024, 'image/tiff')
        const result = validateImageUpload(file)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('UNSUPPORTED_TYPE')
      })
    })

    describe('图片大小限制', () => {
      it('应该拒绝超过 5MB 的图片', () => {
        const largeImage = createMockImage('large.png', 6 * 1024 * 1024)
        const result = validateImageUpload(largeImage)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('FILE_TOO_LARGE')
      })

      it('应该接受 5MB 内的图片', () => {
        const image = createMockImage('normal.png', 4 * 1024 * 1024)
        const result = validateImageUpload(image)
        expect(result.valid).toBe(true)
      })
    })
  })

  // ============================================
  // Integration Tests
  // ============================================
  
  describe('Integration - 集成场景', () => {
    it('应该验证完整的用户注册数据', () => {
      const email = 'user@example.com'
      const password = 'SecurePass123'
      const projectName = 'My Project 2026'

      const emailResult = validateEmail(email)
      const passwordResult = validatePassword(password)
      const projectNameResult = validateProjectName(projectName)

      expect(emailResult.valid).toBe(true)
      expect(passwordResult.valid).toBe(true)
      expect(projectNameResult.valid).toBe(true)
    })

    it('应该拒绝包含错误数据的表单', () => {
      const invalidCases = [
        { field: 'email', value: 'invalid', validator: validateEmail },
        { field: 'password', value: 'weak', validator: validatePassword },
        { field: 'projectName', value: '', validator: validateProjectName },
      ]

      const results = invalidCases.map(({ value, validator }) => validator(value))

      expect(results.every(r => r.valid === false)).toBe(true)
    })

    it('应该处理批量文件验证', () => {
      const files = [
        { name: 'file1.tsx', size: 1024, valid: true },
        { name: 'file2.txt', size: 0, valid: false, code: 'EMPTY' },
        { name: 'file3.exe', size: 1024, valid: false, code: 'UNSUPPORTED_TYPE' },
      ]

      const results = files.map(file => ({
        ...file,
        result: validateFileUpload({
          name: file.name,
          size: file.size,
        } as File),
      }))

      expect(results[0].result.valid).toBe(true)
      expect(results[1].result.valid).toBe(false)
      expect(results[1].result.code).toBe('EMPTY')
      expect(results[2].result.valid).toBe(false)
      expect(results[2].result.code).toBe('UNSUPPORTED_TYPE')
    })
  })

  // ============================================
  // Performance Tests
  // ============================================
  
  describe('Performance - 性能测试', () => {
    it('应该在合理时间内完成验证', () => {
      const start = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        validateEmail('test@example.com')
        validatePassword('Password123')
      }
      
      const duration = performance.now() - start
      
      // 1000 次验证应该在 100ms 内完成
      expect(duration).toBeLessThan(100)
    })

    it('应该高效处理大输入', () => {
      const largeInput = 'A'.repeat(10001)
      
      const start = performance.now()
      const result = validateInput(largeInput)
      const duration = performance.now() - start
      
      expect(result.valid).toBe(false)
      // 即使是无效输入，也应该快速完成
      expect(duration).toBeLessThan(10)
    })
  })

  // ============================================
  // Type Safety Tests
  // ============================================
  
  describe('Type Safety - 类型安全', () => {
    it('应该返回正确的类型结构', () => {
      const validResult = validateEmail('test@example.com')
      const invalidResult = validateEmail('invalid-email')
      
      // 有效结果
      expect(validResult).toHaveProperty('valid')
      expect(validResult.valid).toBe(true)
      
      // 无效结果
      expect(invalidResult).toHaveProperty('valid')
      expect(invalidResult).toHaveProperty('error')
      expect(invalidResult).toHaveProperty('code')
      expect(invalidResult.valid).toBe(false)
      expect(typeof invalidResult.error).toBe('string')
      expect(typeof invalidResult.code).toBe('string')
    })

    it('应该处理 undefined 的 error', () => {
      const validResult = validateEmail('test@example.com')
      
      // 有效情况下 error 和 code 应该是 undefined
      expect(validResult.error).toBeUndefined()
      expect(validResult.code).toBeUndefined()
    })
  })

  // ============================================
  // Code File Upload Validation Tests
  // ============================================
  
  describe('validateCodeFileUpload() - 代码文件上传验证', () => {
    const createMockCodeFile = (name: string, size: number, type = 'text/javascript'): File => {
      const buffer = new Uint8Array(size)
      const blob = new Blob([buffer], { type })
      return new File([blob], name, { type })
    }

    describe('有效的代码文件', () => {
      it.each([
        ['test.js', 1024],
        ['test.ts', 1024],
        ['test.jsx', 1024],
        ['test.tsx', 1024],
        ['test.json', 1024],
        ['test.html', 1024],
        ['test.css', 1024],
        ['test.scss', 1024],
        ['test.md', 1024],
        ['test.yaml', 1024],
      ])('应该接受 %s', (fileName, size) => {
        const file = createMockCodeFile(fileName, size)
        const result = validateCodeFileUpload(file)
        expect(result.valid).toBe(true)
      })

      it('应该接受接近大小限制的文件', () => {
        const file = createMockCodeFile('test.js', 10 * 1024 * 1024 - 1, 'text/javascript')
        const result = validateCodeFileUpload(file)
        expect(result.valid).toBe(true)
      })
    })

    describe('无效的代码文件', () => {
      it('应该拒绝过大的文件', () => {
        const file = createMockCodeFile('large.js', 10 * 1024 * 1024 + 1, 'text/javascript')
        const result = validateCodeFileUpload(file)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('FILE_TOO_LARGE')
      })

      it('应该拒绝不支持的文件类型', () => {
        const file = createMockCodeFile('test.doc', 1024, 'application/msword')
        const result = validateCodeFileUpload(file)
        expect(result.valid).toBe(false)
        expect(result.code).toBe('UNSUPPORTED_TYPE')
      })
    })
  })

  // ============================================
  // HTML Sanitization Tests
  // ============================================
  
  describe('sanitizeHtml() - HTML 清理', () => {
    it('应该清理 script 标签', () => {
      const input = '<script>alert("xss")</script>Hello'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('</script>')
    })

    it('应该清理 javascript: 协议', () => {
      const input = '<a href="javascript:alert(1)">Click</a>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('javascript:')
    })

    it('应该清理事件处理器', () => {
      const input = '<div onclick="alert(1)">Click</div>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('onclick=')
    })

    it('应该清理 iframe 标签', () => {
      const input = '<iframe src="evil.com"></iframe>Hello'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<iframe>')
    })

    it('应该清理 object 标签', () => {
      const input = '<object data="evil.swf"></object>Hello'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<object>')
    })

    it('应该清理 embed 标签', () => {
      const input = '<embed src="evil.swf">Hello'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<embed>')
    })

    it('应该保留安全的 HTML', () => {
      const input = '<p>Hello</p><div>World</div>'
      const result = sanitizeHtml(input)
      expect(result).toContain('<p>')
      expect(result).toContain('</p>')
      expect(result).toContain('<div>')
      expect(result).toContain('</div>')
    })

    it('应该处理空字符串', () => {
      const result = sanitizeHtml('')
      expect(result).toBe('')
    })

    it('应该处理多个恶意代码', () => {
      const input = '<script>alert(1)</script><iframe></iframe><div onclick="alert(2)">Click</div>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('<iframe>')
      expect(result).not.toContain('onclick=')
    })
  })

  // ============================================
  // HTML Escaping Tests
  // ============================================
  
  describe('escapeHtml() - HTML 转义', () => {
    it('应该转义 & 符号', () => {
      const result = escapeHtml('A & B')
      expect(result).toBe('A &amp; B')
    })

    it('应该转义 < 符号', () => {
      const result = escapeHtml('A < B')
      expect(result).toBe('A &lt; B')
    })

    it('应该转义 > 符号', () => {
      const result = escapeHtml('A > B')
      expect(result).toBe('A &gt; B')
    })

    it('应该转义双引号', () => {
      const result = escapeHtml('A " B')
      expect(result).toBe('A &quot; B')
    })

    it('应该转义单引号', () => {
      const result = escapeHtml("A ' B")
      expect(result).toBe('A &#039; B')
    })

    it('应该转义多个特殊字符', () => {
      const result = escapeHtml('<div class="test">&</div>')
      expect(result).toBe('&lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;')
    })

    it('应该处理空字符串', () => {
      const result = escapeHtml('')
      expect(result).toBe('')
    })

    it('应该保留普通字符', () => {
      const result = escapeHtml('Hello World 123')
      expect(result).toBe('Hello World 123')
    })
  })

  // ============================================
  // Design JSON Validation Tests
  // ============================================
  
  describe('validateDesignJSON() - Design JSON 验证', () => {
    describe('有效的 Design JSON', () => {
      it('应该接受完整的 Design JSON', () => {
        const json = {
          layout: { type: 'flex', direction: 'row' },
          components: [
            { id: '1', type: 'text', content: 'Hello' },
          ],
        }
        const result = validateDesignJSON(json)
        expect(result.valid).toBe(true)
      })

      it('应该接受空组件数组', () => {
        const json = {
          layout: {},
          components: [],
        }
        const result = validateDesignJSON(json)
        expect(result.valid).toBe(true)
      })
    })

    describe('无效的 Design JSON', () => {
      it('应该拒绝 null', () => {
        const result = validateDesignJSON(null)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Design JSON 必须是对象')
        expect(result.code).toBe('INVALID_FORMAT')
      })

      it('应该拒绝 undefined', () => {
        const result = validateDesignJSON(undefined)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Design JSON 必须是对象')
      })

      it('应该拒绝字符串', () => {
        const result = validateDesignJSON('invalid')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Design JSON 必须是对象')
      })

      it('应该拒绝缺少 layout 字段', () => {
        const json = {
          components: [],
        }
        const result = validateDesignJSON(json)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Design JSON 缺少 layout 字段')
      })

      it('应该拒绝 layout 不是对象', () => {
        const json = {
          layout: 'invalid',
          components: [],
        }
        const result = validateDesignJSON(json)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Design JSON 缺少 layout 字段')
      })

      it('应该拒绝缺少 components 字段', () => {
        const json = {
          layout: {},
        }
        const result = validateDesignJSON(json)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Design JSON 的 components 必须是数组')
      })

      it('应该拒绝 components 不是数组', () => {
        const json = {
          layout: {},
          components: 'invalid',
        }
        const result = validateDesignJSON(json)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Design JSON 的 components 必须是数组')
      })

      it('应该拒绝 components 是 null', () => {
        const json = {
          layout: {},
          components: null,
        }
        const result = validateDesignJSON(json)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Design JSON 的 components 必须是数组')
      })
    })
  })

  // ============================================
  // Component Position Validation Tests
  // ============================================
  
  describe('validateComponentPosition() - 组件位置验证', () => {
    describe('有效的位置数据', () => {
      it('应该接受有效的位置数据', () => {
        const pos = { x: 100, y: 200, width: 300, height: 400 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(true)
      })

      it('应该接受零坐标', () => {
        const pos = { x: 0, y: 0, width: 100, height: 100 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(true)
      })

      it('应该接受负坐标', () => {
        const pos = { x: -100, y: -200, width: 100, height: 100 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(true)
      })

      it('应该接受小数坐标', () => {
        const pos = { x: 100.5, y: 200.3, width: 100.1, height: 100.2 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(true)
      })
    })

    describe('无效的位置数据', () => {
      it('应该拒绝 null', () => {
        const result = validateComponentPosition(null)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('位置数据无效')
      })

      it('应该拒绝 undefined', () => {
        const result = validateComponentPosition(undefined)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('位置数据无效')
      })

      it('应该拒绝字符串', () => {
        const result = validateComponentPosition('invalid')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('位置数据无效')
      })

      it('应该拒绝缺少 x 坐标', () => {
        const pos = { y: 200, width: 100, height: 100 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('位置 x/y 必须是数字')
      })

      it('应该拒绝缺少 y 坐标', () => {
        const pos = { x: 100, width: 100, height: 100 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('位置 x/y 必须是数字')
      })

      it('应该拒绝 x 不是数字', () => {
        const pos = { x: '100', y: 200, width: 100, height: 100 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('位置 x/y 必须是数字')
      })

      it('应该拒绝 y 不是数字', () => {
        const pos = { x: 100, y: '200', width: 100, height: 100 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('位置 x/y 必须是数字')
      })

      it('应该拒绝宽度为 0', () => {
        const pos = { x: 100, y: 200, width: 0, height: 100 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('宽度必须大于 0')
      })

      it('应该拒绝宽度为负数', () => {
        const pos = { x: 100, y: 200, width: -100, height: 100 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('宽度必须大于 0')
      })

      it('应该拒绝宽度不是数字', () => {
        const pos = { x: 100, y: 200, width: '100', height: 100 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('宽度必须大于 0')
      })

      it('应该拒绝高度为 0', () => {
        const pos = { x: 100, y: 200, width: 100, height: 0 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('高度必须大于 0')
      })

      it('应该拒绝高度为负数', () => {
        const pos = { x: 100, y: 200, width: 100, height: -100 }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('高度必须大于 0')
      })

      it('应该拒绝高度不是数字', () => {
        const pos = { x: 100, y: 200, width: 100, height: '100' }
        const result = validateComponentPosition(pos)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('高度必须大于 0')
      })
    })
  })
})
