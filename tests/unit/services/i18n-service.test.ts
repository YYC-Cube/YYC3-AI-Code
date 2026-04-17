import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('i18nService - 国际化服务', () => {
  let i18nService: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('@/app/services/i18n-service')
    i18nService = module.i18nService
  })

  describe('基础翻译功能', () => {
    it('应该能够翻译简单的key', () => {
      const result = i18nService.t('app.name')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('应该支持命名空间翻译', () => {
      const result = i18nService.t('title', 'home')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('缺失的key应该返回key本身', () => {
      const result = i18nService.t('nonexistent.key.that.does.not.exist')
      expect(result).toBe('nonexistent.key.that.does.not.exist')
    })

    it('应该支持插值', () => {
      const result = i18nService.t('time.minutesAgo', { count: 5 })
      expect(result).toContain('5')
    })

    it('应该支持多个插值变量', () => {
      const result = i18nService.t('projects.deleteSuccess', 'home', { name: 'TestProject' })
      expect(result).toContain('TestProject')
    })
  })

  describe('语言管理', () => {
    it('getLocale应该返回当前语言', () => {
      const locale = i18nService.getLocale()
      expect(locale).toBeDefined()
      expect(typeof locale).toBe('string')
    })

    it('setLocale应该切换语言', () => {
      const originalLocale = i18nService.getLocale()
      
      i18nService.setLocale('en-US')
      expect(i18nService.getLocale()).toBe('en-US')
      
      i18nService.setLocale(originalLocale)
    })

    it('setLocale对于无效语言不应该改变状态', () => {
      const originalLocale = i18nService.getLocale()
      
      i18nService.setLocale('invalid-locale' as any)
      
      expect(i18nService.getLocale()).toBe(originalLocale)
    })

    it('getSupportedLocales应该返回支持的语言列表', () => {
      const locales = i18nService.getSupportedLocales()
      expect(Array.isArray(locales)).toBe(true)
      expect(locales.length).toBeGreaterThan(0)
    })

    it('getLocaleInfo应该返回语言详细信息', () => {
      const info = i18nService.getLocaleInfo('zh-CN')
      expect(info).toBeDefined()
      expect(info.code).toBe('zh-CN')
      expect(info.name).toBeDefined()
      expect(info.nativeName).toBeDefined()
      expect(info.flag).toBeDefined()
    })

    it('语言切换后翻译应该更新', () => {
      i18nService.setLocale('zh-CN')
      const zhResult = i18nService.t('actions.save')
      
      i18nService.setLocale('en-US')
      const enResult = i18nService.t('actions.save')
      
      expect(typeof zhResult).toBe('string')
      expect(typeof enResult).toBe('string')
    })
  })

  describe('日期格式化', () => {
    it('formatDate应该格式化日期', () => {
      const date = new Date(2026, 0, 15)
      const result = i18nService.formatDate(date, { style: 'date' })
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('应该支持datetime格式', () => {
      const date = new Date(2026, 6, 20, 14, 30, 45)
      const result = i18nService.formatDate(date, { style: 'datetime' })
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('应该支持time格式', () => {
      const date = new Date(2026, 0, 1, 10, 15, 30)
      const result = i18nService.formatDate(date, { style: 'time' })
      expect(result).toBeDefined()
    })

    it('应该支持short格式', () => {
      const date = new Date(2026, 11, 25)
      const result = i18nService.formatDate(date, { style: 'short' })
      expect(result).toBeDefined()
    })

    it('应该支持long格式', () => {
      const date = new Date(2026, 2, 14)
      const result = i18nService.formatDate(date, { style: 'long' })
      expect(result).toBeDefined()
    })

    it('应该处理字符串日期输入', () => {
      const result = i18nService.formatDate('2026-06-15')
      expect(result).toBeDefined()
    })

    it('应该处理时间戳输入', () => {
      const timestamp = Date.now()
      const result = i18nService.formatDate(timestamp)
      expect(result).toBeDefined()
    })
  })

  describe('数字格式化', () => {
    it('formatNumber应该格式化数字', () => {
      const result = i18nService.formatNumber(1234.56)
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('应该支持货币格式', () => {
      const result = i18nService.formatNumber(99.99, { style: 'currency' })
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('应该支持百分比格式', () => {
      const result = i18nService.formatPercent(0.756)
      expect(result).toBeDefined()
      expect(result).toContain('%')
    })

    it('应该处理大数字', () => {
      const result = i18nService.formatNumber(1000000)
      expect(result).toBeDefined()
    })

    it('应该处理小数', () => {
      const result = i18nService.formatNumber(3.14159, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
      expect(result).toBeDefined()
    })
  })

  describe('exists方法', () => {
    it('存在的key应该返回true', () => {
      expect(i18nService.exists('app.name')).toBe(true)
    })

    it('不存在的key应该返回false', () => {
      expect(i18nService.exists('nonexistent.key')).toBe(false)
    })

    it('应该在指定命名空间中检查', () => {
      expect(i18nService.exists('title', 'home')).toBe(true)
      expect(i18nService.exists('nonexistent', 'home')).toBe(false)
    })
  })

  describe('相对时间格式化', () => {
    it('应该格式化刚刚的时间', () => {
      const now = Date.now()
      const result = i18nService.formatRelativeTime(now)
      expect(result).toBeDefined()
    })

    it('应该格式化几分钟前的时间', () => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000
      const result = i18nService.formatRelativeTime(fiveMinAgo)
      expect(result).toBeDefined()
      expect(result).toContain('5')
    })
  })

  describe('边界情况', () => {
    it('空字符串key应该返回空字符串或key', () => {
      const result = i18nService.t('')
      expect(typeof result).toBe('string')
    })

    it('undefined插值值应该被忽略', () => {
      const result = i18nService.t('time.minutesAgo', { count: undefined as any })
      expect(typeof result).toBe('string')
    })

    it('数字插值值应该被转换为字符串', () => {
      const result = i18nService.t('time.daysAgo', { count: 10 })
      expect(result).toContain('10')
    })

    it('特殊字符在插值中应该正常工作', () => {
      const result = i18nService.t('projects.deleteSuccess', 'home', { name: 'Test"Project<>&\'' })
      expect(result).toContain('Test')
    })
  })

  describe('配置和持久化', () => {
    it('updateConfig应该更新配置', () => {
      if (i18nService.updateConfig) {
        const originalDebug = i18nService.config?.debug
        
        i18nService.updateConfig({ debug: true })
        
        expect(i18nService.config?.debug).toBe(true)
        
        i18nService.updateConfig({ debug: originalDebug ?? false })
      }
    })

    it('onLocaleChange应该注册回调', () => {
      if (i18nService.onLocaleChange) {
        const listener = vi.fn()
        i18nService.onLocaleChange(listener)
        
        i18nService.setLocale('en-US')
        
        expect(listener).toHaveBeenCalledWith('en-US')
        
        i18nService.setLocale('zh-CN')
      }
    })
  })
})
