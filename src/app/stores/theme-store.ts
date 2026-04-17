/**
 * @file theme-store.ts
 * @description Theme system state — colors, fonts, layout, glass effects, liquid glass, presets
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-13
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags theme, presets, liquid-glass, persist
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'

const log = createLogger('ThemeStore')

// ============================================
// Types
// ============================================

export interface ThemeColors {
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  background: string
  backgroundForeground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  muted: string
  mutedForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
  chart1: string
  chart1Foreground: string
  chart2: string
  chart2Foreground: string
  chart3: string
  chart3Foreground: string
  chart4: string
  chart4Foreground: string
  chart5: string
  chart5Foreground: string
  chart6: string
  chart6Foreground: string
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
}

export interface ThemeFonts {
  sans: { primary: string; secondary: string; tertiary: string }
  serif: { primary: string; secondary: string }
  mono: { primary: string; secondary: string }
}

export interface ThemeLayout {
  radiusXs: string
  radiusSm: string
  radiusMd: string
  radiusLg: string
  radiusXl: string
  radiusFull: string
  shadowXs: string
  shadowSm: string
  shadowMd: string
  shadowLg: string
  shadowXl: string
  spaceUnit: number // base 4px
}

export interface ThemeGlass {
  enabled: boolean
  blur: number       // px
  opacity: number    // 0-100
  borderOpacity: number // 0-100
  saturation: number   // 100-200
  tint: string         // hex color for tint
}

export interface ThemeLiquidGlass {
  enabled: boolean
  backgroundOrbs: boolean
  particles: boolean
  shimmerEffects: boolean
  cardLift: boolean
  glowColor: string        // primary glow rgba
  secondaryGlowColor: string // secondary glow rgba
  animationSpeed: number    // multiplier, 1 = normal
}

export interface ThemeBranding {
  logoUrl: string
  logoSize: number     // px height
  logoRadius: number   // px
  logoOpacity: number  // 0-100
  sloganPrimary: string
  sloganSecondary: string
  appName: string
  titleTemplate: string
  backgroundType: 'color' | 'gradient' | 'image'
  backgroundColor: string
  backgroundGradient: string
  backgroundImage: string
  backgroundBlur: number
  backgroundOpacity: number
}

export interface ThemeConfig {
  version: string
  id: string
  name: string
  type: 'light' | 'dark'
  created: string
  colors: ThemeColors
  fonts: ThemeFonts
  layout: ThemeLayout
  glass: ThemeGlass
  branding: ThemeBranding
  liquidGlass?: ThemeLiquidGlass
}

// ============================================
// Preset Themes
// ============================================

const DEFAULT_FONTS: ThemeFonts = {
  sans: {
    primary: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    secondary: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    tertiary: "system-ui, -apple-system, sans-serif",
  },
  serif: {
    primary: "Georgia, 'Times New Roman', Times, serif",
    secondary: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  },
  mono: {
    primary: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    secondary: "'Consolas', 'Monaco', 'Lucida Console', monospace",
  },
}

const DEFAULT_LAYOUT: ThemeLayout = {
  radiusXs: '4px',
  radiusSm: '8px',
  radiusMd: '12px',
  radiusLg: '16px',
  radiusXl: '24px',
  radiusFull: '9999px',
  shadowXs: '0px 1px 2px 0px rgba(0,0,0,0.05)',
  shadowSm: '0px 1px 3px 0px rgba(0,0,0,0.10)',
  shadowMd: '0px 4px 6px -1px rgba(0,0,0,0.10)',
  shadowLg: '0px 10px 15px -3px rgba(0,0,0,0.10)',
  shadowXl: '0px 20px 25px -5px rgba(0,0,0,0.10)',
  spaceUnit: 4,
}

const DEFAULT_GLASS: ThemeGlass = {
  enabled: true,
  blur: 12,
  opacity: 8,
  borderOpacity: 8,
  saturation: 120,
  tint: '#ffffff',
}

const DEFAULT_BRANDING: ThemeBranding = {
  logoUrl: '',
  logoSize: 40,
  logoRadius: 8,
  logoOpacity: 100,
  sloganPrimary: '言启象限 | 语枢未来',
  sloganSecondary: 'Words Initiate Quadrants, Language Serves as Core for Future',
  appName: 'YYC³ Family AI',
  titleTemplate: '{pageName} - {appName}',
  backgroundType: 'color',
  backgroundColor: '#0a0a0f',
  backgroundGradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
  backgroundImage: '',
  backgroundBlur: 0,
  backgroundOpacity: 100,
}

const PRESET_BASIC_LIGHT: ThemeConfig = {
  version: '2.0.0', id: 'preset-basic-light', name: '基础色调', type: 'light', created: '2026-03-02T00:00:00Z',
  colors: {
    primary: 'oklch(0.55 0.22 264)', primaryForeground: 'oklch(0.98 0.01 264)',
    secondary: 'oklch(0.65 0.15 200)', secondaryForeground: 'oklch(0.98 0.01 200)',
    accent: 'oklch(0.60 0.25 30)', accentForeground: 'oklch(0.98 0.01 30)',
    background: 'oklch(0.98 0.01 264)', backgroundForeground: 'oklch(0.15 0.02 264)',
    card: 'oklch(1.00 0.00 0)', cardForeground: 'oklch(0.15 0.02 264)',
    popover: 'oklch(1.00 0.00 0)', popoverForeground: 'oklch(0.15 0.02 264)',
    muted: 'oklch(0.95 0.02 264)', mutedForeground: 'oklch(0.20 0.02 264)',
    destructive: 'oklch(0.55 0.22 25)', destructiveForeground: 'oklch(0.98 0.01 25)',
    border: 'oklch(0.85 0.02 264)', input: 'oklch(1.00 0.00 0)', ring: 'oklch(0.55 0.22 264)',
    chart1: 'oklch(0.55 0.22 264)', chart1Foreground: 'oklch(0.98 0.01 264)',
    chart2: 'oklch(0.60 0.25 30)', chart2Foreground: 'oklch(0.98 0.01 30)',
    chart3: 'oklch(0.65 0.15 200)', chart3Foreground: 'oklch(0.98 0.01 200)',
    chart4: 'oklch(0.70 0.18 150)', chart4Foreground: 'oklch(0.98 0.01 150)',
    chart5: 'oklch(0.75 0.20 280)', chart5Foreground: 'oklch(0.98 0.01 280)',
    chart6: 'oklch(0.80 0.12 100)', chart6Foreground: 'oklch(0.98 0.01 100)',
    sidebar: 'oklch(0.95 0.02 264)', sidebarForeground: 'oklch(0.15 0.02 264)',
    sidebarPrimary: 'oklch(0.55 0.22 264)', sidebarPrimaryForeground: 'oklch(0.98 0.01 264)',
    sidebarAccent: 'oklch(0.60 0.25 30)', sidebarAccentForeground: 'oklch(0.98 0.01 30)',
    sidebarBorder: 'oklch(0.85 0.02 264)',
  },
  fonts: { ...DEFAULT_FONTS }, layout: { ...DEFAULT_LAYOUT },
  glass: { ...DEFAULT_GLASS, tint: '#ffffff' },
  branding: { ...DEFAULT_BRANDING, backgroundColor: '#f5f5fa', backgroundGradient: 'linear-gradient(135deg, #f5f5fa 0%, #e8e8f0 100%)' },
}

const PRESET_COSMIC_NIGHT: ThemeConfig = {
  version: '2.0.0', id: 'preset-cosmic-night', name: '宇宙之夜', type: 'dark', created: '2026-03-02T00:00:00Z',
  colors: {
    primary: 'oklch(0.65 0.22 264)', primaryForeground: 'oklch(0.98 0.01 264)',
    secondary: 'oklch(0.70 0.15 200)', secondaryForeground: 'oklch(0.98 0.01 200)',
    accent: 'oklch(0.68 0.25 30)', accentForeground: 'oklch(0.98 0.01 30)',
    background: 'oklch(0.15 0.02 264)', backgroundForeground: 'oklch(0.98 0.01 264)',
    card: 'oklch(0.20 0.02 264)', cardForeground: 'oklch(0.98 0.01 264)',
    popover: 'oklch(0.20 0.02 264)', popoverForeground: 'oklch(0.98 0.01 264)',
    muted: 'oklch(0.25 0.02 264)', mutedForeground: 'oklch(0.70 0.02 264)',
    destructive: 'oklch(0.55 0.22 25)', destructiveForeground: 'oklch(0.98 0.01 25)',
    border: 'oklch(0.30 0.02 264)', input: 'oklch(0.22 0.02 264)', ring: 'oklch(0.65 0.22 264)',
    chart1: 'oklch(0.65 0.22 264)', chart1Foreground: 'oklch(0.98 0.01 264)',
    chart2: 'oklch(0.68 0.25 30)', chart2Foreground: 'oklch(0.98 0.01 30)',
    chart3: 'oklch(0.70 0.15 200)', chart3Foreground: 'oklch(0.98 0.01 200)',
    chart4: 'oklch(0.72 0.18 150)', chart4Foreground: 'oklch(0.98 0.01 150)',
    chart5: 'oklch(0.75 0.20 280)', chart5Foreground: 'oklch(0.98 0.01 280)',
    chart6: 'oklch(0.80 0.12 100)', chart6Foreground: 'oklch(0.98 0.01 100)',
    sidebar: 'oklch(0.18 0.02 264)', sidebarForeground: 'oklch(0.98 0.01 264)',
    sidebarPrimary: 'oklch(0.65 0.22 264)', sidebarPrimaryForeground: 'oklch(0.98 0.01 264)',
    sidebarAccent: 'oklch(0.68 0.25 30)', sidebarAccentForeground: 'oklch(0.98 0.01 30)',
    sidebarBorder: 'oklch(0.30 0.02 264)',
  },
  fonts: { ...DEFAULT_FONTS }, layout: { ...DEFAULT_LAYOUT },
  glass: { ...DEFAULT_GLASS, blur: 16, opacity: 6, tint: '#8b5cf6' },
  branding: { ...DEFAULT_BRANDING },
}

const PRESET_SOFT_POP: ThemeConfig = {
  version: '2.0.0', id: 'preset-soft-pop', name: '柔和流行', type: 'light', created: '2026-03-02T00:00:00Z',
  colors: {
    primary: 'oklch(0.70 0.18 320)', primaryForeground: 'oklch(0.98 0.01 320)',
    secondary: 'oklch(0.75 0.15 180)', secondaryForeground: 'oklch(0.98 0.01 180)',
    accent: 'oklch(0.72 0.20 40)', accentForeground: 'oklch(0.98 0.01 40)',
    background: 'oklch(0.97 0.01 320)', backgroundForeground: 'oklch(0.15 0.02 320)',
    card: 'oklch(1.00 0.00 0)', cardForeground: 'oklch(0.15 0.02 320)',
    popover: 'oklch(1.00 0.00 0)', popoverForeground: 'oklch(0.15 0.02 320)',
    muted: 'oklch(0.94 0.02 320)', mutedForeground: 'oklch(0.40 0.02 320)',
    destructive: 'oklch(0.55 0.22 25)', destructiveForeground: 'oklch(0.98 0.01 25)',
    border: 'oklch(0.88 0.01 320)', input: 'oklch(1.00 0.00 0)', ring: 'oklch(0.70 0.18 320)',
    chart1: 'oklch(0.70 0.18 320)', chart1Foreground: 'oklch(0.98 0.01 320)',
    chart2: 'oklch(0.72 0.20 40)', chart2Foreground: 'oklch(0.98 0.01 40)',
    chart3: 'oklch(0.75 0.15 180)', chart3Foreground: 'oklch(0.98 0.01 180)',
    chart4: 'oklch(0.68 0.18 260)', chart4Foreground: 'oklch(0.98 0.01 260)',
    chart5: 'oklch(0.78 0.15 120)', chart5Foreground: 'oklch(0.98 0.01 120)',
    chart6: 'oklch(0.80 0.12 70)', chart6Foreground: 'oklch(0.98 0.01 70)',
    sidebar: 'oklch(0.96 0.01 320)', sidebarForeground: 'oklch(0.15 0.02 320)',
    sidebarPrimary: 'oklch(0.70 0.18 320)', sidebarPrimaryForeground: 'oklch(0.98 0.01 320)',
    sidebarAccent: 'oklch(0.72 0.20 40)', sidebarAccentForeground: 'oklch(0.98 0.01 40)',
    sidebarBorder: 'oklch(0.88 0.01 320)',
  },
  fonts: { ...DEFAULT_FONTS }, layout: { ...DEFAULT_LAYOUT, radiusMd: '16px', radiusLg: '20px' },
  glass: { ...DEFAULT_GLASS, blur: 20, opacity: 12, tint: '#ec4899' },
  branding: { ...DEFAULT_BRANDING, backgroundColor: '#fdf2f8', backgroundGradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)' },
}

const PRESET_CYBERPUNK: ThemeConfig = {
  version: '2.0.0', id: 'preset-cyberpunk', name: '赛博朋克', type: 'dark', created: '2026-03-02T00:00:00Z',
  colors: {
    primary: 'oklch(0.60 0.25 300)', primaryForeground: 'oklch(0.98 0.01 300)',
    secondary: 'oklch(0.65 0.20 180)', secondaryForeground: 'oklch(0.98 0.01 180)',
    accent: 'oklch(0.70 0.30 60)', accentForeground: 'oklch(0.10 0.01 60)',
    background: 'oklch(0.10 0.02 300)', backgroundForeground: 'oklch(0.95 0.01 300)',
    card: 'oklch(0.15 0.02 300)', cardForeground: 'oklch(0.95 0.01 300)',
    popover: 'oklch(0.15 0.02 300)', popoverForeground: 'oklch(0.95 0.01 300)',
    muted: 'oklch(0.20 0.03 300)', mutedForeground: 'oklch(0.65 0.03 300)',
    destructive: 'oklch(0.55 0.22 25)', destructiveForeground: 'oklch(0.98 0.01 25)',
    border: 'oklch(0.25 0.02 300)', input: 'oklch(0.18 0.02 300)', ring: 'oklch(0.60 0.25 300)',
    chart1: 'oklch(0.60 0.25 300)', chart1Foreground: 'oklch(0.98 0.01 300)',
    chart2: 'oklch(0.70 0.30 60)', chart2Foreground: 'oklch(0.10 0.01 60)',
    chart3: 'oklch(0.65 0.20 180)', chart3Foreground: 'oklch(0.98 0.01 180)',
    chart4: 'oklch(0.55 0.25 340)', chart4Foreground: 'oklch(0.98 0.01 340)',
    chart5: 'oklch(0.75 0.25 120)', chart5Foreground: 'oklch(0.10 0.01 120)',
    chart6: 'oklch(0.80 0.20 40)', chart6Foreground: 'oklch(0.10 0.01 40)',
    sidebar: 'oklch(0.12 0.02 300)', sidebarForeground: 'oklch(0.95 0.01 300)',
    sidebarPrimary: 'oklch(0.60 0.25 300)', sidebarPrimaryForeground: 'oklch(0.98 0.01 300)',
    sidebarAccent: 'oklch(0.70 0.30 60)', sidebarAccentForeground: 'oklch(0.10 0.01 60)',
    sidebarBorder: 'oklch(0.25 0.02 300)',
  },
  fonts: { ...DEFAULT_FONTS }, layout: { ...DEFAULT_LAYOUT, radiusSm: '4px', radiusMd: '6px', radiusLg: '8px' },
  glass: { ...DEFAULT_GLASS, blur: 24, opacity: 5, borderOpacity: 15, saturation: 180, tint: '#a855f7' },
  branding: { ...DEFAULT_BRANDING, backgroundColor: '#0d0015', backgroundGradient: 'linear-gradient(135deg, #0d0015 0%, #1a0030 50%, #000d1a 100%)' },
}

const PRESET_MODERN_MINIMAL: ThemeConfig = {
  version: '2.0.0', id: 'preset-modern-minimal', name: '现代极简', type: 'light', created: '2026-03-02T00:00:00Z',
  colors: {
    primary: 'oklch(0.30 0.00 0)', primaryForeground: 'oklch(0.98 0.00 0)',
    secondary: 'oklch(0.50 0.00 0)', secondaryForeground: 'oklch(0.98 0.00 0)',
    accent: 'oklch(0.40 0.00 0)', accentForeground: 'oklch(0.98 0.00 0)',
    background: 'oklch(0.98 0.00 0)', backgroundForeground: 'oklch(0.15 0.00 0)',
    card: 'oklch(1.00 0.00 0)', cardForeground: 'oklch(0.15 0.00 0)',
    popover: 'oklch(1.00 0.00 0)', popoverForeground: 'oklch(0.15 0.00 0)',
    muted: 'oklch(0.95 0.00 0)', mutedForeground: 'oklch(0.45 0.00 0)',
    destructive: 'oklch(0.55 0.22 25)', destructiveForeground: 'oklch(0.98 0.01 25)',
    border: 'oklch(0.90 0.00 0)', input: 'oklch(1.00 0.00 0)', ring: 'oklch(0.30 0.00 0)',
    chart1: 'oklch(0.30 0.00 0)', chart1Foreground: 'oklch(0.98 0.00 0)',
    chart2: 'oklch(0.45 0.00 0)', chart2Foreground: 'oklch(0.98 0.00 0)',
    chart3: 'oklch(0.60 0.00 0)', chart3Foreground: 'oklch(0.98 0.00 0)',
    chart4: 'oklch(0.75 0.00 0)', chart4Foreground: 'oklch(0.15 0.00 0)',
    chart5: 'oklch(0.85 0.00 0)', chart5Foreground: 'oklch(0.15 0.00 0)',
    chart6: 'oklch(0.92 0.00 0)', chart6Foreground: 'oklch(0.15 0.00 0)',
    sidebar: 'oklch(0.97 0.00 0)', sidebarForeground: 'oklch(0.15 0.00 0)',
    sidebarPrimary: 'oklch(0.30 0.00 0)', sidebarPrimaryForeground: 'oklch(0.98 0.00 0)',
    sidebarAccent: 'oklch(0.40 0.00 0)', sidebarAccentForeground: 'oklch(0.98 0.00 0)',
    sidebarBorder: 'oklch(0.90 0.00 0)',
  },
  fonts: { ...DEFAULT_FONTS }, layout: { ...DEFAULT_LAYOUT, radiusSm: '4px', radiusMd: '8px', radiusLg: '12px' },
  glass: { ...DEFAULT_GLASS, blur: 8, opacity: 4, tint: '#000000' },
  branding: { ...DEFAULT_BRANDING, backgroundColor: '#fafafa', backgroundGradient: 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)' },
}

const PRESET_FUTURE_TECH: ThemeConfig = {
  version: '2.0.0', id: 'preset-future-tech', name: '未来科技', type: 'dark', created: '2026-03-02T00:00:00Z',
  colors: {
    primary: 'oklch(0.55 0.25 200)', primaryForeground: 'oklch(0.98 0.01 200)',
    secondary: 'oklch(0.60 0.20 160)', secondaryForeground: 'oklch(0.98 0.01 160)',
    accent: 'oklch(0.65 0.30 280)', accentForeground: 'oklch(0.98 0.01 280)',
    background: 'oklch(0.12 0.02 200)', backgroundForeground: 'oklch(0.95 0.01 200)',
    card: 'oklch(0.18 0.02 200)', cardForeground: 'oklch(0.95 0.01 200)',
    popover: 'oklch(0.18 0.02 200)', popoverForeground: 'oklch(0.95 0.01 200)',
    muted: 'oklch(0.22 0.02 200)', mutedForeground: 'oklch(0.65 0.02 200)',
    destructive: 'oklch(0.55 0.22 25)', destructiveForeground: 'oklch(0.98 0.01 25)',
    border: 'oklch(0.28 0.02 200)', input: 'oklch(0.20 0.02 200)', ring: 'oklch(0.55 0.25 200)',
    chart1: 'oklch(0.55 0.25 200)', chart1Foreground: 'oklch(0.98 0.01 200)',
    chart2: 'oklch(0.65 0.30 280)', chart2Foreground: 'oklch(0.98 0.01 280)',
    chart3: 'oklch(0.60 0.20 160)', chart3Foreground: 'oklch(0.98 0.01 160)',
    chart4: 'oklch(0.70 0.22 220)', chart4Foreground: 'oklch(0.98 0.01 220)',
    chart5: 'oklch(0.75 0.18 140)', chart5Foreground: 'oklch(0.98 0.01 140)',
    chart6: 'oklch(0.80 0.15 260)', chart6Foreground: 'oklch(0.98 0.01 260)',
    sidebar: 'oklch(0.14 0.02 200)', sidebarForeground: 'oklch(0.95 0.01 200)',
    sidebarPrimary: 'oklch(0.55 0.25 200)', sidebarPrimaryForeground: 'oklch(0.98 0.01 200)',
    sidebarAccent: 'oklch(0.65 0.30 280)', sidebarAccentForeground: 'oklch(0.98 0.01 280)',
    sidebarBorder: 'oklch(0.28 0.02 200)',
  },
  fonts: { ...DEFAULT_FONTS }, layout: { ...DEFAULT_LAYOUT },
  glass: { ...DEFAULT_GLASS, blur: 20, opacity: 6, borderOpacity: 12, saturation: 150, tint: '#06b6d4' },
  branding: { ...DEFAULT_BRANDING, backgroundColor: '#030d15', backgroundGradient: 'linear-gradient(135deg, #030d15 0%, #051520 50%, #0a1628 100%)' },
}

const PRESET_LIQUID_GLASS_CYAN: ThemeConfig = {
  version: '2.0.0', id: 'preset-liquid-glass-cyan', name: '液态玻璃 · 青', type: 'dark', created: '2026-03-13T00:00:00Z',
  colors: {
    primary: 'oklch(0.65 0.22 160)', primaryForeground: 'oklch(0.98 0.01 160)',
    secondary: 'oklch(0.70 0.18 180)', secondaryForeground: 'oklch(0.98 0.01 180)',
    accent: 'oklch(0.72 0.25 30)', accentForeground: 'oklch(0.98 0.01 30)',
    background: 'oklch(0.12 0.02 160)', backgroundForeground: 'oklch(0.95 0.01 160)',
    card: 'oklch(0.17 0.02 160)', cardForeground: 'oklch(0.95 0.01 160)',
    popover: 'oklch(0.17 0.02 160)', popoverForeground: 'oklch(0.95 0.01 160)',
    muted: 'oklch(0.22 0.02 160)', mutedForeground: 'oklch(0.65 0.02 160)',
    destructive: 'oklch(0.60 0.25 25)', destructiveForeground: 'oklch(0.98 0.01 25)',
    border: 'oklch(0.28 0.03 160)', input: 'oklch(0.18 0.02 160)', ring: 'oklch(0.65 0.22 160)',
    chart1: 'oklch(0.65 0.22 160)', chart1Foreground: 'oklch(0.98 0.01 160)',
    chart2: 'oklch(0.70 0.20 190)', chart2Foreground: 'oklch(0.98 0.01 190)',
    chart3: 'oklch(0.72 0.25 30)', chart3Foreground: 'oklch(0.98 0.01 30)',
    chart4: 'oklch(0.68 0.18 140)', chart4Foreground: 'oklch(0.98 0.01 140)',
    chart5: 'oklch(0.75 0.20 220)', chart5Foreground: 'oklch(0.98 0.01 220)',
    chart6: 'oklch(0.78 0.15 100)', chart6Foreground: 'oklch(0.98 0.01 100)',
    sidebar: 'oklch(0.14 0.02 160)', sidebarForeground: 'oklch(0.95 0.01 160)',
    sidebarPrimary: 'oklch(0.65 0.22 160)', sidebarPrimaryForeground: 'oklch(0.98 0.01 160)',
    sidebarAccent: 'oklch(0.70 0.20 190)', sidebarAccentForeground: 'oklch(0.98 0.01 190)',
    sidebarBorder: 'oklch(0.25 0.03 160)',
  },
  fonts: { ...DEFAULT_FONTS }, layout: { ...DEFAULT_LAYOUT, radiusMd: '16px', radiusLg: '20px', radiusXl: '28px' },
  glass: { enabled: true, blur: 20, opacity: 8, borderOpacity: 10, saturation: 180, tint: '#00ff87' },
  branding: { ...DEFAULT_BRANDING, backgroundColor: '#0a0f0a', backgroundGradient: 'linear-gradient(135deg, #0a0f0a 0%, #0a1a15 50%, #0a0f1a 100%)' },
  liquidGlass: { enabled: true, backgroundOrbs: true, particles: true, shimmerEffects: true, cardLift: true, glowColor: 'rgba(0, 255, 135, 0.35)', secondaryGlowColor: 'rgba(6, 182, 212, 0.3)', animationSpeed: 1 },
}

const PRESET_LIQUID_GLASS_VIOLET: ThemeConfig = {
  version: '2.0.0', id: 'preset-liquid-glass-violet', name: '液态玻璃 · 紫', type: 'dark', created: '2026-03-13T00:00:00Z',
  colors: {
    primary: 'oklch(0.62 0.25 280)', primaryForeground: 'oklch(0.98 0.01 280)',
    secondary: 'oklch(0.68 0.20 320)', secondaryForeground: 'oklch(0.98 0.01 320)',
    accent: 'oklch(0.70 0.22 200)', accentForeground: 'oklch(0.98 0.01 200)',
    background: 'oklch(0.12 0.02 280)', backgroundForeground: 'oklch(0.95 0.01 280)',
    card: 'oklch(0.17 0.02 280)', cardForeground: 'oklch(0.95 0.01 280)',
    popover: 'oklch(0.17 0.02 280)', popoverForeground: 'oklch(0.95 0.01 280)',
    muted: 'oklch(0.22 0.02 280)', mutedForeground: 'oklch(0.65 0.02 280)',
    destructive: 'oklch(0.60 0.25 25)', destructiveForeground: 'oklch(0.98 0.01 25)',
    border: 'oklch(0.28 0.03 280)', input: 'oklch(0.18 0.02 280)', ring: 'oklch(0.62 0.25 280)',
    chart1: 'oklch(0.62 0.25 280)', chart1Foreground: 'oklch(0.98 0.01 280)',
    chart2: 'oklch(0.68 0.20 320)', chart2Foreground: 'oklch(0.98 0.01 320)',
    chart3: 'oklch(0.70 0.22 200)', chart3Foreground: 'oklch(0.98 0.01 200)',
    chart4: 'oklch(0.65 0.18 250)', chart4Foreground: 'oklch(0.98 0.01 250)',
    chart5: 'oklch(0.75 0.20 340)', chart5Foreground: 'oklch(0.98 0.01 340)',
    chart6: 'oklch(0.78 0.15 160)', chart6Foreground: 'oklch(0.98 0.01 160)',
    sidebar: 'oklch(0.14 0.02 280)', sidebarForeground: 'oklch(0.95 0.01 280)',
    sidebarPrimary: 'oklch(0.62 0.25 280)', sidebarPrimaryForeground: 'oklch(0.98 0.01 280)',
    sidebarAccent: 'oklch(0.68 0.20 320)', sidebarAccentForeground: 'oklch(0.98 0.01 320)',
    sidebarBorder: 'oklch(0.25 0.03 280)',
  },
  fonts: { ...DEFAULT_FONTS }, layout: { ...DEFAULT_LAYOUT, radiusMd: '16px', radiusLg: '20px', radiusXl: '28px' },
  glass: { enabled: true, blur: 24, opacity: 7, borderOpacity: 12, saturation: 170, tint: '#a855f7' },
  branding: { ...DEFAULT_BRANDING, backgroundColor: '#0a0510', backgroundGradient: 'linear-gradient(135deg, #0a0510 0%, #150a20 50%, #0a0a1e 100%)' },
  liquidGlass: { enabled: true, backgroundOrbs: true, particles: true, shimmerEffects: true, cardLift: true, glowColor: 'rgba(168, 85, 247, 0.35)', secondaryGlowColor: 'rgba(236, 72, 153, 0.25)', animationSpeed: 1 },
}

const PRESET_LIQUID_GLASS_LIGHT: ThemeConfig = {
  version: '2.0.0', id: 'preset-liquid-glass-light', name: '液态玻璃 · 光', type: 'light', created: '2026-03-13T00:00:00Z',
  colors: {
    primary: 'oklch(0.50 0.22 160)', primaryForeground: 'oklch(0.98 0.01 160)',
    secondary: 'oklch(0.55 0.18 200)', secondaryForeground: 'oklch(0.98 0.01 200)',
    accent: 'oklch(0.60 0.25 30)', accentForeground: 'oklch(0.98 0.01 30)',
    background: 'oklch(0.97 0.01 160)', backgroundForeground: 'oklch(0.15 0.02 160)',
    card: 'oklch(1.00 0.00 0)', cardForeground: 'oklch(0.15 0.02 160)',
    popover: 'oklch(1.00 0.00 0)', popoverForeground: 'oklch(0.15 0.02 160)',
    muted: 'oklch(0.94 0.02 160)', mutedForeground: 'oklch(0.40 0.02 160)',
    destructive: 'oklch(0.55 0.22 25)', destructiveForeground: 'oklch(0.98 0.01 25)',
    border: 'oklch(0.88 0.02 160)', input: 'oklch(1.00 0.00 0)', ring: 'oklch(0.50 0.22 160)',
    chart1: 'oklch(0.50 0.22 160)', chart1Foreground: 'oklch(0.98 0.01 160)',
    chart2: 'oklch(0.55 0.20 200)', chart2Foreground: 'oklch(0.98 0.01 200)',
    chart3: 'oklch(0.60 0.25 30)', chart3Foreground: 'oklch(0.98 0.01 30)',
    chart4: 'oklch(0.52 0.18 140)', chart4Foreground: 'oklch(0.98 0.01 140)',
    chart5: 'oklch(0.58 0.20 260)', chart5Foreground: 'oklch(0.98 0.01 260)',
    chart6: 'oklch(0.62 0.15 100)', chart6Foreground: 'oklch(0.98 0.01 100)',
    sidebar: 'oklch(0.96 0.01 160)', sidebarForeground: 'oklch(0.15 0.02 160)',
    sidebarPrimary: 'oklch(0.50 0.22 160)', sidebarPrimaryForeground: 'oklch(0.98 0.01 160)',
    sidebarAccent: 'oklch(0.55 0.20 200)', sidebarAccentForeground: 'oklch(0.98 0.01 200)',
    sidebarBorder: 'oklch(0.88 0.02 160)',
  },
  fonts: { ...DEFAULT_FONTS }, layout: { ...DEFAULT_LAYOUT, radiusMd: '16px', radiusLg: '20px', radiusXl: '28px' },
  glass: { enabled: true, blur: 20, opacity: 15, borderOpacity: 12, saturation: 150, tint: '#00d4aa' },
  branding: { ...DEFAULT_BRANDING, backgroundColor: '#f0faf5', backgroundGradient: 'linear-gradient(135deg, #f0faf5 0%, #e8f5f0 50%, #f0f5fa 100%)' },
  liquidGlass: { enabled: true, backgroundOrbs: true, particles: true, shimmerEffects: true, cardLift: true, glowColor: 'rgba(0, 200, 120, 0.18)', secondaryGlowColor: 'rgba(6, 152, 212, 0.12)', animationSpeed: 1.2 },
}

export const PRESET_THEMES: ThemeConfig[] = [
  PRESET_COSMIC_NIGHT,
  PRESET_BASIC_LIGHT,
  PRESET_LIQUID_GLASS_CYAN,
  PRESET_LIQUID_GLASS_VIOLET,
  PRESET_LIQUID_GLASS_LIGHT,
  PRESET_SOFT_POP,
  PRESET_CYBERPUNK,
  PRESET_MODERN_MINIMAL,
  PRESET_FUTURE_TECH,
]

// ============================================
// Apply theme to DOM
// ============================================

export function applyThemeToDOM(theme: ThemeConfig) {
  const root = document.documentElement

  log.info(`Applying theme: "${theme.name}" (${theme.type})`, { id: theme.id, version: theme.version })

  const colorMap: Record<string, string> = {
    '--background': theme.colors.background, '--foreground': theme.colors.backgroundForeground,
    '--card': theme.colors.card, '--card-foreground': theme.colors.cardForeground,
    '--popover': theme.colors.popover, '--popover-foreground': theme.colors.popoverForeground,
    '--primary': theme.colors.primary, '--primary-foreground': theme.colors.primaryForeground,
    '--secondary': theme.colors.secondary, '--secondary-foreground': theme.colors.secondaryForeground,
    '--muted': theme.colors.muted, '--muted-foreground': theme.colors.mutedForeground,
    '--accent': theme.colors.accent, '--accent-foreground': theme.colors.accentForeground,
    '--destructive': theme.colors.destructive, '--destructive-foreground': theme.colors.destructiveForeground,
    '--border': theme.colors.border, '--input': theme.colors.input, '--ring': theme.colors.ring,
    '--chart-1': theme.colors.chart1, '--chart-1-foreground': theme.colors.chart1Foreground,
    '--chart-2': theme.colors.chart2, '--chart-2-foreground': theme.colors.chart2Foreground,
    '--chart-3': theme.colors.chart3, '--chart-3-foreground': theme.colors.chart3Foreground,
    '--chart-4': theme.colors.chart4, '--chart-4-foreground': theme.colors.chart4Foreground,
    '--chart-5': theme.colors.chart5, '--chart-5-foreground': theme.colors.chart5Foreground,
    '--chart-6': theme.colors.chart6, '--chart-6-foreground': theme.colors.chart6Foreground,
    '--sidebar': theme.colors.sidebar, '--sidebar-foreground': theme.colors.sidebarForeground,
    '--sidebar-primary': theme.colors.sidebarPrimary, '--sidebar-primary-foreground': theme.colors.sidebarPrimaryForeground,
    '--sidebar-accent': theme.colors.sidebarAccent, '--sidebar-accent-foreground': theme.colors.sidebarAccentForeground,
    '--sidebar-border': theme.colors.sidebarBorder,
  }

  const layoutMap: Record<string, string> = {
    '--radius-xs': theme.layout.radiusXs, '--radius-sm': theme.layout.radiusSm, '--radius-md': theme.layout.radiusMd,
    '--radius-lg': theme.layout.radiusLg, '--radius-xl': theme.layout.radiusXl, '--radius-full': theme.layout.radiusFull,
    '--shadow-xs': theme.layout.shadowXs, '--shadow-sm': theme.layout.shadowSm, '--shadow-md': theme.layout.shadowMd,
    '--shadow-lg': theme.layout.shadowLg, '--shadow-xl': theme.layout.shadowXl,
    '--space-1': (theme.layout.spaceUnit * 1) + 'px', '--space-2': (theme.layout.spaceUnit * 2) + 'px',
    '--space-3': (theme.layout.spaceUnit * 3) + 'px', '--space-4': (theme.layout.spaceUnit * 4) + 'px',
    '--space-5': (theme.layout.spaceUnit * 5) + 'px', '--space-6': (theme.layout.spaceUnit * 6) + 'px',
    '--space-8': (theme.layout.spaceUnit * 8) + 'px', '--space-10': (theme.layout.spaceUnit * 10) + 'px',
    '--space-12': (theme.layout.spaceUnit * 12) + 'px',
  }

  const glassMap: Record<string, string> = {
    '--glass-blur': theme.glass.blur + 'px',
    '--glass-opacity': (theme.glass.opacity / 100).toString(),
    '--glass-border-opacity': (theme.glass.borderOpacity / 100).toString(),
    '--glass-saturation': theme.glass.saturation.toString(),
    '--glass-tint': theme.glass.tint,
  }

  const allVars = { ...colorMap, ...layoutMap, ...glassMap }
  Object.entries(allVars).forEach(([key, value]) => { root.style.setProperty(key, value) })

  root.style.setProperty('--font-sans', theme.fonts.sans.primary)
  root.style.setProperty('--font-sans-secondary', theme.fonts.sans.secondary)
  root.style.setProperty('--font-sans-tertiary', theme.fonts.sans.tertiary)
  root.style.setProperty('--font-serif', theme.fonts.serif.primary)
  root.style.setProperty('--font-serif-secondary', theme.fonts.serif.secondary)
  root.style.setProperty('--font-mono', theme.fonts.mono.primary)
  root.style.setProperty('--font-mono-secondary', theme.fonts.mono.secondary)

  if (theme.type === 'dark') {root.classList.add('dark')}
  else {root.classList.remove('dark')}

  const wasLG = root.classList.contains('liquid-glass-theme')
  const isNowLG = !!theme.liquidGlass?.enabled
  if (wasLG !== isNowLG) {
    root.classList.add('lg-theme-transitioning')
    setTimeout(() => root.classList.remove('lg-theme-transitioning'), 650)
  }

  if (isNowLG) {
    root.classList.add('liquid-glass-theme')
    if (theme.liquidGlass!.glowColor) {root.style.setProperty('--lg-glow-color', theme.liquidGlass!.glowColor)}
    if (theme.liquidGlass!.secondaryGlowColor) {root.style.setProperty('--lg-glow-secondary', theme.liquidGlass!.secondaryGlowColor)}
  } else {
    root.classList.remove('liquid-glass-theme')
    root.style.removeProperty('--lg-glow-color')
    root.style.removeProperty('--lg-glow-secondary')
  }

  log.debug('CSS variables applied', { totalVars: Object.keys(allVars).length + 7, liquidGlass: !!theme.liquidGlass?.enabled })
}

// ============================================
// WCAG Contrast helpers
// ============================================

function oklchToApproxLuminance(oklch: string): number {
  const match = oklch.match(/oklch\(\s*([\d.]+)/)
  if (match) {return parseFloat(match[1])}
  if (oklch.startsWith('#')) {
    const hex = oklch.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    const srgb = [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
  }
  return 0.5
}

export function getContrastRatio(color1: string, color2: string): number {
  const l1 = oklchToApproxLuminance(color1)
  const l2 = oklchToApproxLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getWCAGLevel(ratio: number): { level: string; color: string } {
  if (ratio >= 7) {return { level: 'AAA', color: 'text-emerald-400' }}
  if (ratio >= 4.5) {return { level: 'AA', color: 'text-amber-400' }}
  if (ratio >= 3) {return { level: 'AA (大文本)', color: 'text-orange-400' }}
  return { level: '不通过', color: 'text-red-400' }
}

// ============================================
// Store
// ============================================

const MAX_HISTORY = 50

interface ThemeState {
  currentTheme: ThemeConfig
  theme: ThemeConfig
  themeHistory: ThemeConfig[]
  customizerOpen: boolean

  openCustomizer: () => void
  closeCustomizer: () => void
  setTheme: (theme: ThemeConfig) => void
  updateColors: (colors: Partial<ThemeColors>) => void
  updateFonts: (fonts: Partial<ThemeFonts>) => void
  updateLayout: (layout: Partial<ThemeLayout>) => void
  updateGlass: (glass: Partial<ThemeGlass>) => void
  updateBranding: (branding: Partial<ThemeBranding>) => void
  updateLiquidGlass: (lg: Partial<ThemeLiquidGlass>) => void
  applyPreset: (presetId: string) => void
  exportTheme: () => string
  importTheme: (json: string) => boolean
  undo: () => void
  getColor: (colorKey: string) => string
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: PRESET_COSMIC_NIGHT,
      get theme() { return get().currentTheme },
      themeHistory: [],
      customizerOpen: false,

      openCustomizer: () => set({ customizerOpen: true }),
      closeCustomizer: () => set({ customizerOpen: false }),

      setTheme: (theme) => {
        const prev = get().currentTheme
        const history = [...get().themeHistory, prev].slice(-MAX_HISTORY)
        applyThemeToDOM(theme)
        log.info('Theme set', { from: prev.name, to: theme.name })
        set({ currentTheme: theme, themeHistory: history })
      },

      updateColors: (colors) => {
        const prev = get().currentTheme
        const next = { ...prev, colors: { ...prev.colors, ...colors } }
        const history = [...get().themeHistory, prev].slice(-MAX_HISTORY)
        applyThemeToDOM(next)
        set({ currentTheme: next, themeHistory: history })
      },

      updateFonts: (fonts) => {
        const prev = get().currentTheme
        const merged = { ...prev.fonts }
        if (fonts.sans) {merged.sans = { ...merged.sans, ...fonts.sans }}
        if (fonts.serif) {merged.serif = { ...merged.serif, ...fonts.serif }}
        if (fonts.mono) {merged.mono = { ...merged.mono, ...fonts.mono }}
        const next = { ...prev, fonts: merged }
        applyThemeToDOM(next)
        set({ currentTheme: next })
      },

      updateLayout: (layout) => {
        const prev = get().currentTheme
        const next = { ...prev, layout: { ...prev.layout, ...layout } }
        applyThemeToDOM(next)
        set({ currentTheme: next })
      },

      updateGlass: (glass) => {
        const prev = get().currentTheme
        const next = { ...prev, glass: { ...prev.glass, ...glass } }
        applyThemeToDOM(next)
        set({ currentTheme: next })
      },

      updateBranding: (branding) => {
        const prev = get().currentTheme
        const next = { ...prev, branding: { ...prev.branding, ...branding } }
        set({ currentTheme: next })
      },

      updateLiquidGlass: (lg) => {
        const prev = get().currentTheme
        const currentLG = prev.liquidGlass || {
          enabled: false, backgroundOrbs: true, particles: true,
          shimmerEffects: true, cardLift: true,
          glowColor: 'rgba(0, 255, 135, 0.35)',
          secondaryGlowColor: 'rgba(6, 182, 212, 0.3)',
          animationSpeed: 1,
        }
        const next = { ...prev, liquidGlass: { ...currentLG, ...lg } }
        applyThemeToDOM(next)
        set({ currentTheme: next })
      },

      applyPreset: (presetId) => {
        const preset = PRESET_THEMES.find(p => p.id === presetId)
        if (preset) {
          const prev = get().currentTheme
          const history = [...get().themeHistory, prev].slice(-MAX_HISTORY)
          const theme = { ...preset, created: new Date().toISOString() }
          applyThemeToDOM(theme)
          log.info(`Preset applied: "${preset.name}"`, { presetId })
          set({ currentTheme: theme, themeHistory: history })
        } else {
          log.warn('Preset not found', { presetId })
        }
      },

      exportTheme: () => {
        return JSON.stringify(get().currentTheme, null, 2)
      },

      importTheme: (json) => {
        try {
          const theme: ThemeConfig = JSON.parse(json)
          if (!theme.colors || !theme.fonts || !theme.layout) {
            log.warn('Import validation failed: missing required fields')
            return false
          }
          const prev = get().currentTheme
          const history = [...get().themeHistory, prev].slice(-MAX_HISTORY)
          applyThemeToDOM(theme)
          log.info('Theme imported successfully', { name: theme.name, id: theme.id })
          set({ currentTheme: theme, themeHistory: history })
          return true
        } catch (e) {
          log.error('Theme import failed: invalid JSON', e)
          return false
        }
      },

      undo: () => {
        const history = get().themeHistory
        if (history.length === 0) {
          log.debug('Undo: no history available')
          return
        }
        const prev = history[history.length - 1]
        const newHistory = history.slice(0, -1)
        applyThemeToDOM(prev)
        log.info(`Undo: reverted to "${prev.name}"`, { historyRemaining: newHistory.length })
        set({ currentTheme: prev, themeHistory: newHistory })
      },

      getColor: (colorKey: string): string => {
        const theme = get().currentTheme
        const colors = theme.colors
        
        const colorMap: Record<string, string> = {
          'primary': colors.primary,
          'secondary': colors.secondary,
          'accent': colors.accent,
          'background': colors.background,
          'background.primary': colors.background,
          'background.secondary': colors.card,
          'card': colors.card,
          'popover': colors.popover,
          'muted': colors.muted,
          'destructive': colors.destructive,
          'border': colors.border,
          'border.primary': colors.border,
          'border.secondary': colors.input,
          'input': colors.input,
          'ring': colors.ring,
          'text': colors.backgroundForeground,
          'text.primary': colors.backgroundForeground,
          'text.secondary': colors.mutedForeground,
          'success': colors.primary,
          'warning': colors.accent,
          'error': colors.destructive,
          'accent.primary': colors.accent,
          'accent.secondary': colors.secondary,
          'surface.primary': colors.card,
          'surface.secondary': colors.popover,
          'surface.tertiary': colors.muted,
        }
        
        return colorMap[colorKey] || colors.primary
      },
    }),
    {
      name: 'yyc3_theme_store',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        themeHistory: state.themeHistory,
      }),
      merge: (persisted: any, current) => {
        if (!persisted) {return current}
        return {
          ...current,
          currentTheme: persisted.currentTheme || current.currentTheme,
          themeHistory: persisted.themeHistory || current.themeHistory,
        }
      },
      onRehydrateStorage: () => {
        return (state) => {
          if (state?.currentTheme) {
            applyThemeToDOM(state.currentTheme)
          }
        }
      },
    }
  )
)
