/**
 * @file theme-store.test.ts
 * @description Theme Store 全面单元测试 — 覆盖主题管理、预设应用、颜色/字体/布局更新、导入导出
 * @author YYC³ QA Team
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ThemeStore - 初始化状态', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该正确初始化默认主题', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    const store = useThemeStore.getState()

    expect(store.currentTheme).toBeDefined()
    expect(store.currentTheme.id).toBeDefined()
    expect(store.currentTheme.name).toBeDefined()
    expect(store.currentTheme.type).toBeDefined()
    expect(['light', 'dark']).toContain(store.currentTheme.type)
    expect(store.customizerOpen).toBe(false)
    expect(store.themeHistory).toHaveLength(0)
  })

  it('应该包含完整的颜色配置', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    const store = useThemeStore.getState()

    const requiredColors = [
      'primary', 'primaryForeground', 'secondary', 'secondaryForeground',
      'accent', 'accentForeground', 'background', 'backgroundForeground',
      'card', 'cardForeground', 'popover', 'popoverForeground',
      'muted', 'mutedForeground', 'destructive', 'destructiveForeground',
      'border', 'input', 'ring'
    ]

    for (const colorKey of requiredColors) {
      expect(store.currentTheme.colors[colorKey as keyof typeof store.currentTheme.colors]).toBeDefined()
    }
  })

  it('应该包含完整的字体配置', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    const store = useThemeStore.getState()

    expect(store.currentTheme.fonts.sans.primary).toBeDefined()
    expect(store.currentTheme.fonts.sans.secondary).toBeDefined()
    expect(store.currentTheme.fonts.sans.tertiary).toBeDefined()
    expect(store.currentTheme.fonts.serif.primary).toBeDefined()
    expect(store.currentTheme.fonts.mono.primary).toBeDefined()
  })

  it('应该包含完整的布局配置', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    const store = useThemeStore.getState()

    expect(store.currentTheme.layout.radiusXs).toBeDefined()
    expect(store.currentTheme.layout.radiusSm).toBeDefined()
    expect(store.currentTheme.layout.radiusMd).toBeDefined()
    expect(store.currentTheme.layout.radiusLg).toBeDefined()
    expect(store.currentTheme.layout.radiusXl).toBeDefined()
    expect(store.currentTheme.layout.radiusFull).toBeDefined()
    expect(typeof store.currentTheme.layout.spaceUnit).toBe('number')
  })
})

describe('ThemeStore - 预设应用', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该能够应用基础色调预设', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')

    useThemeStore.getState().applyPreset('preset-basic-light')

    expect(useThemeStore.getState().currentTheme.id).toBe('preset-basic-light')
    expect(useThemeStore.getState().currentTheme.type).toBe('light')
  })

  it('应该能够应用宇宙之夜预设', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')

    useThemeStore.getState().applyPreset('preset-cosmic-night')

    expect(useThemeStore.getState().currentTheme.id).toBe('preset-cosmic-night')
    expect(useThemeStore.getState().currentTheme.type).toBe('dark')
  })

  it('应该能够应用柔和流行预设', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')

    useThemeStore.getState().applyPreset('preset-soft-pop')

    expect(useThemeStore.getState().currentTheme.id).toBe('preset-soft-pop')
    expect(useThemeStore.getState().currentTheme.type).toBe('light')
  })

  it('应该能够应用赛博朋克预设', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')

    useThemeStore.getState().applyPreset('preset-cyberpunk')

    expect(useThemeStore.getState().currentTheme.id).toBe('preset-cyberpunk')
    expect(useThemeStore.getState().currentTheme.type).toBe('dark')
  })

  it('应该处理不存在的预设ID', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')

    const originalId = useThemeStore.getState().currentTheme.id

    useThemeStore.getState().applyPreset('non-existent-preset')

    // 不存在的预设不应该改变当前主题
    expect(useThemeStore.getState().currentTheme.id).toBe(originalId)
  })
})

describe('ThemeStore - 颜色更新', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    const { useThemeStore } = await import('@/app/stores/theme-store')
    useThemeStore.getState().applyPreset('preset-cosmic-night')
  })

  it('应该能够更新主色调', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    const originalPrimary = useThemeStore.getState().currentTheme.colors.primary
    
    useThemeStore.getState().updateColors({ primary: 'oklch(0.70 0.25 280)' })
    
    expect(useThemeStore.getState().currentTheme.colors.primary).not.toBe(originalPrimary)
    expect(useThemeStore.getState().currentTheme.colors.primary).toBe('oklch(0.70 0.25 280)')
  })

  it('应该能够批量更新多个颜色', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateColors({
      primary: 'oklch(0.70 0.25 280)',
      secondary: 'oklch(0.75 0.20 180)',
      accent: 'oklch(0.65 0.30 60)'
    })
    
    expect(useThemeStore.getState().currentTheme.colors.primary).toBe('oklch(0.70 0.25 280)')
    expect(useThemeStore.getState().currentTheme.colors.secondary).toBe('oklch(0.75 0.20 180)')
    expect(useThemeStore.getState().currentTheme.colors.accent).toBe('oklch(0.65 0.30 60)')
  })

  it('更新颜色时应该保留未更新的颜色', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    const originalBackground = useThemeStore.getState().currentTheme.colors.background
    
    useThemeStore.getState().updateColors({ primary: 'oklch(0.70 0.25 280)' })
    
    expect(useThemeStore.getState().currentTheme.colors.background).toBe(originalBackground)
  })
})

describe('ThemeStore - 字体更新', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该能够更新Sans字体', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    const originalFont = useThemeStore.getState().currentTheme.fonts.sans.primary
    
    useThemeStore.getState().updateFonts({
      sans: { primary: "'Custom Sans', sans-serif", secondary: 'sans-serif', tertiary: 'system-ui' }
    })
    
    expect(useThemeStore.getState().currentTheme.fonts.sans.primary).not.toBe(originalFont)
    expect(useThemeStore.getState().currentTheme.fonts.sans.primary).toBe("'Custom Sans', sans-serif")
  })

  it('应该能够更新Mono字体', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateFonts({
      mono: { primary: "'Fira Code', monospace", secondary: 'monospace' }
    })
    
    expect(useThemeStore.getState().currentTheme.fonts.mono.primary).toBe("'Fira Code', monospace")
  })

  it('更新字体时应保留其他字体不变', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    const originalSerif = useThemeStore.getState().currentTheme.fonts.serif.primary
    
    useThemeStore.getState().updateFonts({
      sans: { primary: "New Sans, sans-serif", secondary: 'sans-serif', tertiary: 'system-ui' }
    })
    
    expect(useThemeStore.getState().currentTheme.fonts.serif.primary).toBe(originalSerif)
  })
})

describe('ThemeStore - 布局更新', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该能够更新圆角大小', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateLayout({ radiusMd: '16px' })
    
    expect(useThemeStore.getState().currentTheme.layout.radiusMd).toBe('16px')
  })

  it('应该能够更新阴影样式', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateLayout({ shadowLg: '0px 15px 25px -5px rgba(0,0,0,0.15)' })
    
    expect(useThemeStore.getState().currentTheme.layout.shadowLg).toBe('0px 15px 25px -5px rgba(0,0,0,0.15)')
  })

  it('应该能够更新空间单位', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateLayout({ spaceUnit: 8 })
    
    expect(useThemeStore.getState().currentTheme.layout.spaceUnit).toBe(8)
  })
})

describe('ThemeStore - 玻璃效果更新', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该能够启用/禁用玻璃效果', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    expect(useThemeStore.getState().currentTheme.glass.enabled).toBe(true)
    
    useThemeStore.getState().updateGlass({ enabled: false })
    expect(useThemeStore.getState().currentTheme.glass.enabled).toBe(false)
    
    useThemeStore.getState().updateGlass({ enabled: true })
    expect(useThemeStore.getState().currentTheme.glass.enabled).toBe(true)
  })

  it('应该能够调整玻璃模糊度', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateGlass({ blur: 24 })
    
    expect(useThemeStore.getState().currentTheme.glass.blur).toBe(24)
  })

  it('应该能够调整玻璃透明度', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateGlass({ opacity: 12 })
    
    expect(useThemeStore.getState().currentTheme.glass.opacity).toBe(12)
  })
})

describe('ThemeStore - 自定义面板控制', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该能够打开自定义面板', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    expect(useThemeStore.getState().customizerOpen).toBe(false)
    
    useThemeStore.getState().openCustomizer()
    
    expect(useThemeStore.getState().customizerOpen).toBe(true)
  })

  it('应该能够关闭自定义面板', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().openCustomizer()
    expect(useThemeStore.getState().customizerOpen).toBe(true)
    
    useThemeStore.getState().closeCustomizer()
    
    expect(useThemeStore.getState().customizerOpen).toBe(false)
  })
})

describe('ThemeStore - 主题历史记录', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该在切换主题时记录历史', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    const initialHistoryLength = useThemeStore.getState().themeHistory.length
    
    useThemeStore.getState().applyPreset('preset-basic-light')
    
    expect(useThemeStore.getState().themeHistory.length).toBeGreaterThan(initialHistoryLength)
  })

  it('应该限制历史记录数量在50条以内', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    // 应用多个预设来填充历史
    for (let i = 0; i < 55; i++) {
      useThemeStore.getState().applyPreset(
        i % 2 === 0 ? 'preset-basic-light' : 'preset-cosmic-night'
      )
    }
    
    expect(useThemeStore.getState().themeHistory.length).toBeLessThanOrEqual(50)
  })
})

describe('ThemeStore - 导入导出功能', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该能够导出当前主题为JSON字符串', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    const exported = useThemeStore.getState().exportTheme()
    
    expect(typeof exported).toBe('string')
    
    const parsed = JSON.parse(exported)
    expect(parsed.id).toBeDefined()
    expect(parsed.name).toBeDefined()
    expect(parsed.colors).toBeDefined()
  })

  it('应该能够导入有效的主题JSON', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    const themeToImport = {
      version: '2.0.0',
      id: 'test-imported-theme',
      name: 'Test Imported Theme',
      type: 'dark' as const,
      created: new Date().toISOString(),
      colors: {
        primary: 'oklch(0.60 0.25 300)',
        primaryForeground: 'oklch(0.98 0.01 300)',
        secondary: 'oklch(0.65 0.20 180)',
        secondaryForeground: 'oklch(0.98 0.01 180)',
        accent: 'oklch(0.70 0.30 60)',
        accentForeground: 'oklch(0.10 0.01 60)',
        background: 'oklch(0.10 0.02 300)',
        backgroundForeground: 'oklch(0.95 0.01 300)',
        card: 'oklch(0.15 0.02 300)',
        cardForeground: 'oklch(0.95 0.01 300)',
        popover: 'oklch(0.15 0.02 300)',
        popoverForeground: 'oklch(0.95 0.01 300)',
        muted: 'oklch(0.20 0.03 300)',
        mutedForeground: 'oklch(0.65 0.03 300)',
        destructive: 'oklch(0.55 0.22 25)',
        destructiveForeground: 'oklch(0.98 0.01 25)',
        border: 'oklch(0.25 0.02 300)',
        input: 'oklch(0.18 0.02 300)',
        ring: 'oklch(0.60 0.25 300)',
        chart1: 'oklch(0.60 0.25 300)',
        chart1Foreground: 'oklch(0.98 0.01 300)',
        chart2: 'oklch(0.70 0.30 60)',
        chart2Foreground: 'oklch(0.10 0.01 60)',
        chart3: 'oklch(0.65 0.20 180)',
        chart3Foreground: 'oklch(0.98 0.01 180)',
        chart4: 'oklch(0.55 0.25 340)',
        chart4Foreground: 'oklch(0.98 0.01 340)',
        chart5: 'oklch(0.75 0.25 120)',
        chart5Foreground: 'oklch(0.10 0.01 120)',
        chart6: 'oklch(0.80 0.20 40)',
        chart6Foreground: 'oklch(0.10 0.01 40)',
        sidebar: 'oklch(0.12 0.02 300)',
        sidebarForeground: 'oklch(0.95 0.01 300)',
        sidebarPrimary: 'oklch(0.60 0.25 300)',
        sidebarPrimaryForeground: 'oklch(0.98 0.01 300)',
        sidebarAccent: 'oklch(0.70 0.30 60)',
        sidebarAccentForeground: 'oklch(0.10 0.01 60)',
        sidebarBorder: 'oklch(0.25 0.02 300)',
      },
      fonts: {
        sans: { primary: "Inter, sans-serif", secondary: "Roboto, sans-serif", tertiary: "system-ui, sans-serif" },
        serif: { primary: "Georgia, serif", secondary: "Palatino, serif" },
        mono: { primary: "'JetBrains Mono', monospace", secondary: "Consolas, monospace" },
      },
      layout: {
        radiusXs: '4px', radiusSm: '8px', radiusMd: '12px',
        radiusLg: '16px', radiusXl: '24px', radiusFull: '9999px',
        shadowXs: '0px 1px 2px 0px rgba(0,0,0,0.05)',
        shadowSm: '0px 1px 3px 0px rgba(0,0,0,0.10)',
        shadowMd: '0px 4px 6px -1px rgba(0,0,0,0.10)',
        shadowLg: '0px 10px 15px -3px rgba(0,0,0,0.10)',
        shadowXl: '0px 20px 25px -5px rgba(0,0,0,0.10)',
        spaceUnit: 4,
      },
      glass: { enabled: true, blur: 12, opacity: 8, borderOpacity: 8, saturation: 120, tint: '#a855f7' },
      branding: {
        logoUrl: '', logoSize: 40, logoRadius: 8, logoOpacity: 100,
        sloganPrimary: 'Test Slogan', sloganSecondary: 'Test Slogan EN',
        appName: 'Test App', titleTemplate: '{pageName} - {appName}',
        backgroundType: 'color' as const, backgroundColor: '#0d0015',
        backgroundGradient: '', backgroundImage: '',
        backgroundBlur: 0, backgroundOpacity: 100,
      },
    }

    const result = useThemeStore.getState().importTheme(JSON.stringify(themeToImport))

    expect(result).toBe(true)
    expect(useThemeStore.getState().currentTheme.id).toBe('test-imported-theme')
    expect(useThemeStore.getState().currentTheme.name).toBe('Test Imported Theme')
  })

  it('应该拒绝无效的JSON输入', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')

    const result = useThemeStore.getState().importTheme('invalid json {{{')

    expect(result).toBe(false)
  })

  it('应该拒绝空字符串输入', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')

    const result = useThemeStore.getState().importTheme('')

    expect(result).toBe(false)
  })
})

describe('ThemeStore - 液态玻璃效果', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该能够启用液态玻璃效果', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateLiquidGlass({ enabled: true })
    
    expect(useThemeStore.getState().currentTheme.liquidGlass?.enabled).toBe(true)
  })

  it('应该能够禁用液态玻璃效果', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateLiquidGlass({ enabled: false })
    
    expect(useThemeStore.getState().currentTheme.liquidGlass?.enabled).toBe(false)
  })

  it('应该能够设置发光颜色', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateLiquidGlass({
      glowColor: 'rgba(255, 0, 128, 0.5)',
      secondaryGlowColor: 'rgba(0, 255, 128, 0.3)'
    })
    
    expect(useThemeStore.getState().currentTheme.liquidGlass?.glowColor).toBe('rgba(255, 0, 128, 0.5)')
    expect(useThemeStore.getState().currentTheme.liquidGlass?.secondaryGlowColor).toBe('rgba(0, 255, 128, 0.3)')
  })

  it('应该能够调整动画速度', async () => {
    const { useThemeStore } = await import('@/app/stores/theme-store')
    
    useThemeStore.getState().updateLiquidGlass({ animationSpeed: 2 })
    
    expect(useThemeStore.getState().currentTheme.liquidGlass?.animationSpeed).toBe(2)
  })
})
