import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ThemeStore - 补充功能测试', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  describe('自定义器控制', () => {
    it('openCustomizer应该打开自定义器', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      
      useThemeStore.getState().openCustomizer()
      
      expect(useThemeStore.getState().customizerOpen).toBe(true)
    })

    it('closeCustomizer应该关闭自定义器', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      
      useThemeStore.getState().openCustomizer()
      useThemeStore.getState().closeCustomizer()
      
      expect(useThemeStore.getState().customizerOpen).toBe(false)
    })
  })

  describe('预设应用', () => {
    it('applyPreset应该应用默认预设', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      
      useThemeStore.getState().applyPreset('default')
      
      expect(useThemeStore.getState().currentTheme).toBeDefined()
    })
  })

  describe('颜色更新', () => {
    it('updateColors应该支持部分更新', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      
      useThemeStore.getState().updateColors({ primary: '#ff0000' as any })
      
      expect(useThemeStore.getState().currentTheme.colors.primary).toBeDefined()
    })

    it('updateColors空对象不应该报错', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      
      expect(() => useThemeStore.getState().updateColors({})).not.toThrow()
    })
  })

  describe('字体更新', () => {
    it('updateFonts空对象不应该报错', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      
      expect(() => useThemeStore.getState().updateFonts({})).not.toThrow()
    })
  })

  describe('布局更新', () => {
    it('updateLayout空对象不应该报错', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      
      expect(() => useThemeStore.getState().updateLayout({})).not.toThrow()
    })
  })

  describe('导入导出功能', () => {
    it('exportTheme应该返回有效的JSON字符串', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      
      const exported = useThemeStore.getState().exportTheme()
      
      expect(typeof exported).toBe('string')
      expect(() => JSON.parse(exported)).not.toThrow()
    })

    it('importTheme对于无效的JSON应该返回false', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      
      const result = useThemeStore.getState().importTheme('invalid json')
      
      expect(result).toBe(false)
    })

    it('importTheme对于空字符串应该返回false', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      
      const result = useThemeStore.getState().importTheme('')
      
      expect(result).toBe(false)
    })
  })

  describe('setTheme完整配置', () => {
    it('setTheme应该接受完整的主题配置', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      const currentTheme = useThemeStore.getState().currentTheme
      
      useThemeStore.getState().setTheme({
        ...currentTheme,
        id: 'test-complete-theme',
        name: 'Test Complete Theme',
      } as any)
      
      expect(useThemeStore.getState().currentTheme.id).toContain('test-complete-theme')
    })
  })

  describe('主题状态验证', () => {
    it('当前主题应该包含所有必需字段', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      const theme = useThemeStore.getState().currentTheme
      
      expect(theme.id).toBeDefined()
      expect(theme.name).toBeDefined()
      expect(theme.type).toBeDefined()
      expect(theme.colors).toBeDefined()
      expect(theme.fonts).toBeDefined()
      expect(theme.layout).toBeDefined()
    })

    it('颜色对象应该包含所有基础颜色', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      const colors = useThemeStore.getState().currentTheme.colors
      
      expect(colors.primary).toBeDefined()
      expect(colors.background).toBeDefined()
      expect(Object.keys(colors).length).toBeGreaterThan(5)
    })

    it('字体对象应该包含sans和mono字体', async () => {
      const { useThemeStore } = await import('@/app/stores/theme-store')
      const fonts = useThemeStore.getState().currentTheme.fonts
      
      expect(fonts.sans).toBeDefined()
      expect(fonts.mono).toBeDefined()
    })
  })
})
