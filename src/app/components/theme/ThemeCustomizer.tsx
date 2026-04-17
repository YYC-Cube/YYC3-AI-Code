/**
 * @file ThemeCustomizer.tsx
 * @description Theme customization panel — color/font/layout/glass/branding editors, presets, import/export
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { useState } from 'react'
import {
  X, Palette, Type, Layout, Sparkles, Download, Upload, Undo2,
  Check, Copy, AlertCircle, CheckCircle2,
  Droplets, Image as ImageIcon, SunMedium, Moon,
} from 'lucide-react'
import {
  useThemeStore,
  PRESET_THEMES,
  getContrastRatio,
  getWCAGLevel,
} from '../../stores/theme-store'
import logoImage from '/yyc3-logo.png'

type Tab = 'presets' | 'colors' | 'fonts' | 'layout' | 'glass' | 'branding' | 'export'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'presets', label: '预设主题', icon: Sparkles },
  { key: 'colors', label: '颜色系统', icon: Palette },
  { key: 'fonts', label: '字体排版', icon: Type },
  { key: 'layout', label: '布局系统', icon: Layout },
  { key: 'glass', label: '玻璃效果', icon: Droplets },
  { key: 'branding', label: '品牌元素', icon: ImageIcon },
  { key: 'export', label: '导入/导出', icon: Download },
]

export function ThemeCustomizer() {
  const { customizerOpen, closeCustomizer, currentTheme } = useThemeStore()
  const [activeTab, setActiveTab] = useState<Tab>('presets')

  if (!customizerOpen) {return null}

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeCustomizer} />
      <div
        className="relative w-[880px] max-h-[90vh] bg-[#13141c] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden"
        style={{
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 25px 60px -12px rgba(0,0,0,0.6), 0 0 120px -40px rgba(99,102,241,0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/20 flex items-center justify-center">
            <Palette className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-white/90" style={{ fontWeight: 500 }}>YYC³ 主题定制系统</div>
            <div className="text-[11px] text-white/30" style={{ fontWeight: 400 }}>
              当前主题: {currentTheme.name} ({currentTheme.type === 'dark' ? '深色' : '浅色'})
            </div>
          </div>
          <UndoButton />
          <button
            onClick={closeCustomizer}
            className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar Tabs */}
          <div className="w-[160px] border-r border-white/[0.06] py-2 px-2 shrink-0 overflow-y-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all mb-0.5 ${
                  activeTab === key
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
                }`}
                style={{ fontWeight: 400 }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 min-h-0">
            {activeTab === 'presets' && <PresetsTab />}
            {activeTab === 'colors' && <ColorsTab />}
            {activeTab === 'fonts' && <FontsTab />}
            {activeTab === 'layout' && <LayoutTab />}
            {activeTab === 'glass' && <GlassTab />}
            {activeTab === 'branding' && <BrandingTab />}
            {activeTab === 'export' && <ExportTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ========================================= */
/* Undo Button                               */
/* ========================================= */

function UndoButton() {
  const { undo, themeHistory } = useThemeStore()
  return (
    <button
      onClick={undo}
      disabled={themeHistory.length === 0}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
      title="撤销 (Undo)"
      style={{ fontWeight: 400 }}
    >
      <Undo2 className="w-3.5 h-3.5" />
      撤销
    </button>
  )
}

/* ========================================= */
/* Presets Tab                               */
/* ========================================= */

function PresetsTab() {
  const { applyPreset, currentTheme } = useThemeStore()

  return (
    <div className="space-y-4">
      <SectionTitle title="预设主题" desc="一键应用预设配色方案，支持浅色、深色与液态玻璃模式" />
      <div className="grid grid-cols-2 gap-3">
        {PRESET_THEMES.map((preset) => {
          const isActive = currentTheme.id === preset.id
          const isLiquidGlass = !!preset.liquidGlass?.enabled
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`relative p-4 rounded-xl border transition-all text-left group ${
                isActive
                  ? 'border-violet-500/40 bg-violet-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
              }`}
              style={isActive ? { boxShadow: '0 0 20px -6px rgba(139,92,246,0.2)' } : {}}
            >
              {isActive && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-4 h-4 text-violet-400" />
                </div>
              )}
              {/* Color swatches */}
              <div className="flex gap-1.5 mb-3">
                {[preset.colors.primary, preset.colors.secondary, preset.colors.accent, preset.colors.background, preset.colors.card].map((c, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-md border border-white/10"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-white/80 mb-0.5" style={{ fontWeight: 500 }}>{preset.name}</span>
                {isLiquidGlass && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" style={{ fontWeight: 500 }}>
                    GLASS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/30" style={{ fontWeight: 400 }}>
                {preset.type === 'dark' ? <Moon className="w-3 h-3" /> : <SunMedium className="w-3 h-3" />}
                {preset.type === 'dark' ? '深色模式' : '浅色模式'}
                {isLiquidGlass && <Droplets className="w-3 h-3 text-emerald-400/50 ml-1" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ========================================= */
/* Colors Tab                                */
/* ========================================= */

const COLOR_GROUPS = [
  {
    title: '基础颜色',
    items: [
      { key: 'primary', fgKey: 'primaryForeground', label: '主色' },
      { key: 'secondary', fgKey: 'secondaryForeground', label: '次色' },
      { key: 'accent', fgKey: 'accentForeground', label: '强调色' },
      { key: 'destructive', fgKey: 'destructiveForeground', label: '破坏性' },
    ],
  },
  {
    title: '背景系统',
    items: [
      { key: 'background', fgKey: 'backgroundForeground', label: '背景色' },
      { key: 'card', fgKey: 'cardForeground', label: '卡片色' },
      { key: 'popover', fgKey: 'popoverForeground', label: '弹窗色' },
      { key: 'muted', fgKey: 'mutedForeground', label: '柔和色' },
    ],
  },
  {
    title: '边框与输入',
    items: [
      { key: 'border', fgKey: null, label: '边框色' },
      { key: 'input', fgKey: null, label: '输入色' },
      { key: 'ring', fgKey: null, label: '焦点环' },
    ],
  },
  {
    title: '图表颜色',
    items: [
      { key: 'chart1', fgKey: 'chart1Foreground', label: '图表1' },
      { key: 'chart2', fgKey: 'chart2Foreground', label: '图表2' },
      { key: 'chart3', fgKey: 'chart3Foreground', label: '图表3' },
      { key: 'chart4', fgKey: 'chart4Foreground', label: '图表4' },
      { key: 'chart5', fgKey: 'chart5Foreground', label: '图表5' },
      { key: 'chart6', fgKey: 'chart6Foreground', label: '图表6' },
    ],
  },
  {
    title: '侧边栏',
    items: [
      { key: 'sidebar', fgKey: 'sidebarForeground', label: '侧边栏' },
      { key: 'sidebarPrimary', fgKey: 'sidebarPrimaryForeground', label: '侧边栏主色' },
      { key: 'sidebarAccent', fgKey: 'sidebarAccentForeground', label: '侧边栏强调' },
      { key: 'sidebarBorder', fgKey: null, label: '侧边栏边框' },
    ],
  },
]

function ColorsTab() {
  const { currentTheme, updateColors } = useThemeStore()

  return (
    <div className="space-y-6">
      <SectionTitle title="颜色系统" desc="基于 OKLch 颜色空间的语义化颜色变量，支持实时对比度检测" />
      {COLOR_GROUPS.map((group) => (
        <div key={group.title}>
          <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>{group.title}</div>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((item) => {
              const bgVal = (currentTheme.colors as any)[item.key] as string
              const fgVal = item.fgKey ? (currentTheme.colors as any)[item.fgKey] as string : null
              const contrast = fgVal ? getContrastRatio(fgVal, bgVal) : null
              const wcag = contrast ? getWCAGLevel(contrast) : null

              return (
                <div key={item.key} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/60" style={{ fontWeight: 400 }}>{item.label}</span>
                    {wcag && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${wcag.color} bg-white/[0.04]`} style={{ fontWeight: 500 }}>
                        {wcag.level} ({contrast!.toFixed(1)}:1)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md border border-white/10" style={{ background: bgVal }} />
                    <input
                      value={bgVal}
                      onChange={(e) => updateColors({ [item.key]: e.target.value } as any)}
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[10px] text-white/60 font-mono focus:outline-none focus:border-violet-500/40"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                  {item.fgKey && fgVal && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md border border-white/10 flex items-center justify-center" style={{ background: bgVal }}>
                        <span style={{ color: fgVal, fontWeight: 500, fontSize: '10px' }}>Aa</span>
                      </div>
                      <input
                        value={fgVal}
                        onChange={(e) => updateColors({ [item.fgKey!]: e.target.value } as any)}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[10px] text-white/60 font-mono focus:outline-none focus:border-violet-500/40"
                        placeholder="前景色"
                        style={{ fontWeight: 400 }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ========================================= */
/* Fonts Tab                                 */
/* ========================================= */

function FontsTab() {
  const { currentTheme, updateFonts } = useThemeStore()

  const fontCategories = [
    {
      title: '无衬线字体 (Sans-serif)',
      desc: '正文、标题、按钮',
      fields: [
        { label: 'Primary', value: currentTheme.fonts.sans.primary, onChange: (v: string) => updateFonts({ sans: { ...currentTheme.fonts.sans, primary: v } }) },
        { label: 'Secondary', value: currentTheme.fonts.sans.secondary, onChange: (v: string) => updateFonts({ sans: { ...currentTheme.fonts.sans, secondary: v } }) },
        { label: 'Tertiary', value: currentTheme.fonts.sans.tertiary, onChange: (v: string) => updateFonts({ sans: { ...currentTheme.fonts.sans, tertiary: v } }) },
      ],
    },
    {
      title: '衬线字体 (Serif)',
      desc: '引用、装饰性文字',
      fields: [
        { label: 'Primary', value: currentTheme.fonts.serif.primary, onChange: (v: string) => updateFonts({ serif: { ...currentTheme.fonts.serif, primary: v } }) },
        { label: 'Secondary', value: currentTheme.fonts.serif.secondary, onChange: (v: string) => updateFonts({ serif: { ...currentTheme.fonts.serif, secondary: v } }) },
      ],
    },
    {
      title: '等宽字体 (Monospace)',
      desc: '代码、终端、数据',
      fields: [
        { label: 'Primary', value: currentTheme.fonts.mono.primary, onChange: (v: string) => updateFonts({ mono: { ...currentTheme.fonts.mono, primary: v } }) },
        { label: 'Secondary', value: currentTheme.fonts.mono.secondary, onChange: (v: string) => updateFonts({ mono: { ...currentTheme.fonts.mono, secondary: v } }) },
      ],
    },
  ]

  const sizeSpec = [
    { name: 'xs', size: '12px', desc: '辅助文字、标签' },
    { name: 'sm', size: '14px', desc: '按钮、次要文字' },
    { name: 'base', size: '16px', desc: '正文' },
    { name: 'lg', size: '18px', desc: '小标题' },
    { name: 'xl', size: '20px', desc: '中标题' },
    { name: '2xl', size: '24px', desc: '大标题' },
    { name: '3xl', size: '30px', desc: '页面标题' },
  ]

  return (
    <div className="space-y-6">
      <SectionTitle title="字体排版系统" desc="分层设计字体家族，建立清晰的视觉层次" />

      {fontCategories.map((cat) => (
        <div key={cat.title}>
          <div className="text-[11px] text-white/30 uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{cat.title}</div>
          <div className="text-[10px] text-white/15 mb-3" style={{ fontWeight: 400 }}>{cat.desc}</div>
          <div className="space-y-2">
            {cat.fields.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-[10px] text-white/30 w-16" style={{ fontWeight: 400 }}>{f.label}</span>
                <input
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11px] text-white/60 focus:outline-none focus:border-violet-500/40"
                  style={{ fontWeight: 400 }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Font Size Reference */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>字号规范参考</div>
        <div className="space-y-1">
          {sizeSpec.map((s) => (
            <div key={s.name} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/[0.02]">
              <span className="text-white/70 w-20" style={{ fontSize: s.size, lineHeight: '1.5', fontWeight: 400 }}>{s.name}</span>
              <span className="text-[10px] text-white/30 w-12" style={{ fontWeight: 400 }}>{s.size}</span>
              <span className="text-[10px] text-white/20" style={{ fontWeight: 400 }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ========================================= */
/* Layout Tab                                */
/* ========================================= */

function LayoutTab() {
  const { currentTheme, updateLayout } = useThemeStore()
  const layout = currentTheme.layout

  const radiusItems = [
    { key: 'radiusXs' as const, label: 'XS', desc: '小元素' },
    { key: 'radiusSm' as const, label: 'SM', desc: '中小元素' },
    { key: 'radiusMd' as const, label: 'MD', desc: '中等元素' },
    { key: 'radiusLg' as const, label: 'LG', desc: '大元素' },
    { key: 'radiusXl' as const, label: 'XL', desc: '特大元素' },
  ]

  return (
    <div className="space-y-6">
      <SectionTitle title="布局系统" desc="圆角、阴影、间距的统一配置" />

      {/* Radius */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>圆角 (Radius)</div>
        <div className="grid grid-cols-5 gap-3">
          {radiusItems.map((r) => (
            <div key={r.key} className="text-center space-y-2">
              <div
                className="w-full h-14 bg-violet-500/20 border border-violet-500/30 mx-auto"
                style={{ borderRadius: layout[r.key] }}
              />
              <div className="text-[10px] text-white/50" style={{ fontWeight: 400 }}>{r.label}</div>
              <input
                value={layout[r.key]}
                onChange={(e) => updateLayout({ [r.key]: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[10px] text-white/60 text-center focus:outline-none focus:border-violet-500/40"
                style={{ fontWeight: 400 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Shadows */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>阴影 (Shadow)</div>
        <div className="space-y-2">
          {(['shadowXs', 'shadowSm', 'shadowMd', 'shadowLg', 'shadowXl'] as const).map((key) => (
            <div key={key} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg bg-[#1e1e2e]"
                style={{ boxShadow: layout[key] }}
              />
              <span className="text-[10px] text-white/30 w-16" style={{ fontWeight: 400 }}>{key.replace('shadow', '').toUpperCase()}</span>
              <input
                value={layout[key]}
                onChange={(e) => updateLayout({ [key]: e.target.value })}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[10px] text-white/60 font-mono focus:outline-none focus:border-violet-500/40"
                style={{ fontWeight: 400 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>间距基准</div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/30" style={{ fontWeight: 400 }}>基础单位</span>
          <input
            type="number"
            value={layout.spaceUnit}
            onChange={(e) => updateLayout({ spaceUnit: Number(e.target.value) })}
            className="w-20 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/60 focus:outline-none focus:border-violet-500/40"
            style={{ fontWeight: 400 }}
          />
          <span className="text-[10px] text-white/20" style={{ fontWeight: 400 }}>px (space-1 = {layout.spaceUnit}px, space-4 = {layout.spaceUnit * 4}px)</span>
        </div>
        <div className="flex items-end gap-1 mt-4">
          {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
            <div key={n} className="text-center">
              <div
                className="bg-violet-500/30 rounded-sm mx-auto"
                style={{ width: Math.min(layout.spaceUnit * n, 60), height: Math.min(layout.spaceUnit * n, 60) }}
              />
              <div className="text-[8px] text-white/20 mt-1" style={{ fontWeight: 400 }}>{n}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ========================================= */
/* Glass Tab                                 */
/* ========================================= */

function GlassTab() {
  const { currentTheme, updateGlass } = useThemeStore()
  const glass = currentTheme.glass

  const sliders = [
    { key: 'blur' as const, label: '模糊度 (Blur)', min: 0, max: 40, unit: 'px' },
    { key: 'opacity' as const, label: '背景透明度', min: 0, max: 50, unit: '%' },
    { key: 'borderOpacity' as const, label: '边框透明度', min: 0, max: 50, unit: '%' },
    { key: 'saturation' as const, label: '饱和度 (Saturation)', min: 100, max: 200, unit: '' },
  ]

  return (
    <div className="space-y-6">
      <SectionTitle title="玻璃效果 (Glassmorphism)" desc="自定义毛玻璃效果参数，打造现代通透视觉" />

      {/* Enable toggle */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
        <button
          onClick={() => updateGlass({ enabled: !glass.enabled })}
          className={`w-10 h-5 rounded-full relative transition-colors ${glass.enabled ? 'bg-violet-500' : 'bg-white/10'}`}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{ left: glass.enabled ? '22px' : '2px' }}
          />
        </button>
        <span className="text-[12px] text-white/70" style={{ fontWeight: 400 }}>启用玻璃效果</span>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {sliders.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/50" style={{ fontWeight: 400 }}>{s.label}</span>
              <span className="text-[11px] text-white/30 tabular-nums" style={{ fontWeight: 400 }}>{glass[s.key]}{s.unit}</span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              value={glass[s.key]}
              onChange={(e) => updateGlass({ [s.key]: Number(e.target.value) })}
              className="w-full accent-violet-500"
            />
          </div>
        ))}

        {/* Tint color */}
        <div>
          <div className="text-[11px] text-white/50 mb-2" style={{ fontWeight: 400 }}>着色 (Tint)</div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={glass.tint}
              onChange={(e) => updateGlass({ tint: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent"
            />
            <input
              value={glass.tint}
              onChange={(e) => updateGlass({ tint: e.target.value })}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/60 font-mono focus:outline-none focus:border-violet-500/40"
              style={{ fontWeight: 400 }}
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>实时预览</div>
        <div
          className="relative h-40 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="w-full max-w-[280px] rounded-xl p-4 border"
              style={{
                background: glass.enabled
                  ? `rgba(${hexToRgb(glass.tint)}, ${glass.opacity / 100})`
                  : 'rgba(255,255,255,0.1)',
                backdropFilter: glass.enabled ? `blur(${glass.blur}px) saturate(${glass.saturation}%)` : 'none',
                WebkitBackdropFilter: glass.enabled ? `blur(${glass.blur}px) saturate(${glass.saturation}%)` : 'none',
                borderColor: glass.enabled
                  ? `rgba(255,255,255,${glass.borderOpacity / 100})`
                  : 'rgba(255,255,255,0.1)',
              }}
            >
              <div className="text-[13px] text-white/90 mb-1" style={{ fontWeight: 500 }}>Glass Card</div>
              <div className="text-[10px] text-white/60" style={{ fontWeight: 400 }}>毛玻璃效果预览面板</div>
              <div className="flex gap-2 mt-3">
                <div className="px-3 py-1 rounded-md bg-white/20 text-[10px] text-white/80" style={{ fontWeight: 500 }}>按钮</div>
                <div className="px-3 py-1 rounded-md bg-white/10 text-[10px] text-white/60" style={{ fontWeight: 400 }}>取消</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liquid Glass Advanced Controls */}
      <LiquidGlassControls />
    </div>
  )
}

/* ========================================= */
/* Liquid Glass Controls                     */
/* ========================================= */

function LiquidGlassControls() {
  const { currentTheme, updateLiquidGlass } = useThemeStore()
  const lg = currentTheme.liquidGlass || {
    enabled: false, backgroundOrbs: true, particles: true,
    shimmerEffects: true, cardLift: true,
    glowColor: 'rgba(0, 255, 135, 0.35)',
    secondaryGlowColor: 'rgba(6, 182, 212, 0.3)',
    animationSpeed: 1,
  }

  const toggles = [
    { key: 'enabled' as const, label: '启用液态玻璃主题', desc: '激活完整液态玻璃视觉系统（Emerald/Cyan 色调）' },
    { key: 'backgroundOrbs' as const, label: '浮动光球', desc: '动画背景中的发光球体' },
    { key: 'particles' as const, label: '漂浮粒子', desc: '微小的漂浮光点' },
    { key: 'shimmerEffects' as const, label: '微光扫射', desc: '卡片表面的微光动画' },
    { key: 'cardLift' as const, label: '卡片悬浮', desc: '鼠标悬停时卡片上浮效果' },
  ]

  return (
    <div className="space-y-4">
      <div className="text-[11px] text-white/30 uppercase tracking-wider" style={{ fontWeight: 500 }}>
        液态玻璃主题 (Liquid Glass)
      </div>

      {/* Toggle switches */}
      <div className="space-y-2">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <button
              onClick={() => updateLiquidGlass({ [t.key]: !lg[t.key] })}
              className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${lg[t.key] ? 'bg-emerald-500' : 'bg-white/10'}`}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ left: lg[t.key] ? '22px' : '2px' }}
              />
            </button>
            <div className="min-w-0">
              <div className="text-[12px] text-white/70" style={{ fontWeight: 400 }}>{t.label}</div>
              <div className="text-[10px] text-white/25" style={{ fontWeight: 400 }}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Glow colors (only if enabled) */}
      {lg.enabled && (
        <>
          <div className="text-[10px] text-white/30 mb-2" style={{ fontWeight: 400 }}>发光颜色</div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/30 w-16" style={{ fontWeight: 400 }}>主发光</span>
              <input
                value={lg.glowColor || ''}
                onChange={(e) => updateLiquidGlass({ glowColor: e.target.value })}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/60 font-mono focus:outline-none focus:border-emerald-500/40"
                style={{ fontWeight: 400 }}
                placeholder="rgba(0, 255, 135, 0.35)"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/30 w-16" style={{ fontWeight: 400 }}>次发光</span>
              <input
                value={lg.secondaryGlowColor || ''}
                onChange={(e) => updateLiquidGlass({ secondaryGlowColor: e.target.value })}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/60 font-mono focus:outline-none focus:border-emerald-500/40"
                style={{ fontWeight: 400 }}
                placeholder="rgba(6, 182, 212, 0.3)"
              />
            </div>
          </div>

          {/* Animation speed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/50" style={{ fontWeight: 400 }}>动画速度</span>
              <span className="text-[11px] text-white/30 tabular-nums" style={{ fontWeight: 400 }}>{lg.animationSpeed?.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={3}
              step={0.1}
              value={lg.animationSpeed || 1}
              onChange={(e) => updateLiquidGlass({ animationSpeed: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>
        </>
      )}
    </div>
  )
}

/* ========================================= */
/* Branding Tab                              */
/* ========================================= */

function BrandingTab() {
  const { currentTheme, updateBranding } = useThemeStore()
  const b = currentTheme.branding

  return (
    <div className="space-y-6">
      <SectionTitle title="品牌元素定制" desc="Logo、标语、应用名称、背景等牌元素" />

      {/* Logo */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>Logo 配置</div>
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 border border-white/10 flex items-center justify-center bg-white/[0.02] overflow-hidden"
            style={{
              width: b.logoSize + 20,
              height: b.logoSize + 20,
              borderRadius: b.logoRadius,
              opacity: b.logoOpacity / 100,
            }}
          >
            {b.logoUrl ? (
              <img
                src={b.logoUrl || logoImage}
                alt="Logo"
                className="max-w-full max-h-full object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                style={{ width: b.logoSize, height: b.logoSize }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white/30 w-16" style={{ fontWeight: 400 }}>尺寸</label>
              <input
                type="range" min={24} max={80} value={b.logoSize}
                onChange={(e) => updateBranding({ logoSize: Number(e.target.value) })}
                className="flex-1 accent-violet-500"
              />
              <span className="text-[10px] text-white/30 w-10 tabular-nums" style={{ fontWeight: 400 }}>{b.logoSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white/30 w-16" style={{ fontWeight: 400 }}>圆角</label>
              <input
                type="range" min={0} max={24} value={b.logoRadius}
                onChange={(e) => updateBranding({ logoRadius: Number(e.target.value) })}
                className="flex-1 accent-violet-500"
              />
              <span className="text-[10px] text-white/30 w-10 tabular-nums" style={{ fontWeight: 400 }}>{b.logoRadius}px</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white/30 w-16" style={{ fontWeight: 400 }}>透明度</label>
              <input
                type="range" min={10} max={100} value={b.logoOpacity}
                onChange={(e) => updateBranding({ logoOpacity: Number(e.target.value) })}
                className="flex-1 accent-violet-500"
              />
              <span className="text-[10px] text-white/30 w-10 tabular-nums" style={{ fontWeight: 400 }}>{b.logoOpacity}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slogan */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>标语配置</div>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-white/30 mb-1 block" style={{ fontWeight: 400 }}>主标语 (最多 50 字符)</label>
            <input
              value={b.sloganPrimary}
              maxLength={50}
              onChange={(e) => updateBranding({ sloganPrimary: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/70 focus:outline-none focus:border-violet-500/40"
              style={{ fontWeight: 400 }}
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 mb-1 block" style={{ fontWeight: 400 }}>副标语 (最多 100 字符)</label>
            <input
              value={b.sloganSecondary}
              maxLength={100}
              onChange={(e) => updateBranding({ sloganSecondary: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/70 focus:outline-none focus:border-violet-500/40"
              style={{ fontWeight: 400 }}
            />
          </div>
        </div>
      </div>

      {/* App Name & Title */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>页面标题</div>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-white/30 mb-1 block" style={{ fontWeight: 400 }}>应用名称</label>
            <input
              value={b.appName}
              onChange={(e) => updateBranding({ appName: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/70 focus:outline-none focus:border-violet-500/40"
              style={{ fontWeight: 400 }}
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 mb-1 block" style={{ fontWeight: 400 }}>标题模板 ({'{pageName}'} - {'{appName}'})</label>
            <input
              value={b.titleTemplate}
              onChange={(e) => updateBranding({ titleTemplate: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/70 font-mono focus:outline-none focus:border-violet-500/40"
              style={{ fontWeight: 400 }}
            />
          </div>
        </div>
      </div>

      {/* Background */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>背景配置</div>
        <div className="flex gap-2 mb-3">
          {(['color', 'gradient'] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateBranding({ backgroundType: t })}
              className={`px-3 py-1.5 rounded-lg text-[11px] border transition-all ${
                b.backgroundType === t
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                  : 'border-white/[0.06] text-white/30 hover:text-white/50'
              }`}
              style={{ fontWeight: 400 }}
            >
              {t === 'color' ? '纯色' : '渐变'}
            </button>
          ))}
        </div>
        {b.backgroundType === 'color' && (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={b.backgroundColor}
              onChange={(e) => updateBranding({ backgroundColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent"
            />
            <input
              value={b.backgroundColor}
              onChange={(e) => updateBranding({ backgroundColor: e.target.value })}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/60 font-mono focus:outline-none focus:border-violet-500/40"
              style={{ fontWeight: 400 }}
            />
          </div>
        )}
        {b.backgroundType === 'gradient' && (
          <input
            value={b.backgroundGradient}
            onChange={(e) => updateBranding({ backgroundGradient: e.target.value })}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[11px] text-white/60 font-mono focus:outline-none focus:border-violet-500/40"
            placeholder="linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)"
            style={{ fontWeight: 400 }}
          />
        )}
        {/* Preview */}
        <div
          className="h-16 rounded-lg mt-3 border border-white/[0.06]"
          style={{
            background: b.backgroundType === 'gradient' ? b.backgroundGradient : b.backgroundColor,
          }}
        />
      </div>
    </div>
  )
}

/* ========================================= */
/* Export Tab                                 */
/* ========================================= */

function ExportTab() {
  const { exportTheme, importTheme, currentTheme } = useThemeStore()
  const [importJson, setImportJson] = useState('')
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [copied, setCopied] = useState(false)

  const handleExport = () => {
    const json = exportTheme()
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = () => {
    const json = exportTheme()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yyc3-theme-${currentTheme.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    if (!importJson.trim()) {return}
    const ok = importTheme(importJson)
    setImportStatus(ok ? 'success' : 'error')
    if (ok) {setImportJson('')}
    setTimeout(() => setImportStatus('idle'), 3000)
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {return}
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      setImportJson(text)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="主题导入 / 导出" desc="以 JSON 格式导入导出主题配置，便于分享和备份" />

      {/* Export */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>导出当前主题</div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500/15 text-violet-400 text-[11px] hover:bg-violet-500/25 transition-all border border-violet-500/20"
            style={{ fontWeight: 500 }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制' : '复制 JSON'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.1] transition-all"
            style={{ fontWeight: 400 }}
          >
            <Download className="w-3.5 h-3.5" />
            下载文件
          </button>
        </div>
        <pre className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[9px] text-white/30 font-mono max-h-[160px] overflow-auto" style={{ fontWeight: 400 }}>
          {exportTheme()}
        </pre>
      </div>

      {/* Import */}
      <div>
        <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>导入主题</div>
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/40 text-[11px] hover:bg-white/[0.1] cursor-pointer transition-all" style={{ fontWeight: 400 }}>
            <Upload className="w-3.5 h-3.5" />
            选择文件
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>
          {importStatus === 'success' && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1" style={{ fontWeight: 400 }}>
              <CheckCircle2 className="w-3 h-3" /> 导入成功
            </span>
          )}
          {importStatus === 'error' && (
            <span className="text-[10px] text-red-400 flex items-center gap-1" style={{ fontWeight: 400 }}>
              <AlertCircle className="w-3 h-3" /> 格式错误
            </span>
          )}
        </div>
        <textarea
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder="粘贴 JSON 主题配置..."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[11px] text-white/60 font-mono focus:outline-none focus:border-violet-500/40 min-h-[100px] resize-none"
          style={{ fontWeight: 400 }}
        />
        <button
          onClick={handleImport}
          disabled={!importJson.trim()}
          className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500/15 text-violet-400 text-[11px] hover:bg-violet-500/25 transition-all border border-violet-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontWeight: 500 }}
        >
          <Upload className="w-3.5 h-3.5" />
          应用导入
        </button>
      </div>

      {/* Version Info */}
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <div className="text-[10px] text-white/20 space-y-1" style={{ fontWeight: 400 }}>
          <div>版本: {currentTheme.version}</div>
          <div>主题 ID: {currentTheme.id}</div>
          <div>创建时间: {currentTheme.created}</div>
        </div>
      </div>
    </div>
  )
}

/* ========================================= */
/* Shared Components                         */
/* ========================================= */

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <div className="text-[14px] text-white/80" style={{ fontWeight: 500 }}>{title}</div>
      <div className="text-[11px] text-white/25 mt-0.5" style={{ fontWeight: 400 }}>{desc}</div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) || 0
  const g = parseInt(h.substring(2, 4), 16) || 0
  const b = parseInt(h.substring(4, 6), 16) || 0
  return `${r},${g},${b}`
}

export default ThemeCustomizer