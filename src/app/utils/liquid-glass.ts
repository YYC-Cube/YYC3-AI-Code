/**
 * @file liquid-glass.ts
 * @description Utility helpers for liquid glass theme integration —
 * conditional style objects and CSS class builders for components
 * to adapt when liquid glass theme is active.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import type React from 'react'
import { useThemeStore, type ThemeConfig } from '../stores/theme-store'

// ============================================
// Pure helpers (no hooks)
// ============================================

/** Check whether a given ThemeConfig has liquidGlass enabled */
export function isLiquidGlassActive(theme: ThemeConfig): boolean {
  return !!theme.liquidGlass?.enabled
}

/** Shared glass surface style used for nav bars when LG is active */
export function buildNavSurfaceStyle(theme: ThemeConfig): React.CSSProperties {
  if (!isLiquidGlassActive(theme)) {return {}}
  return {
    background: 'rgba(10, 15, 10, 0.35)',
    backdropFilter: 'blur(18px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(18px) saturate(1.6)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  }
}

/** Panel surface style (slightly different tint than nav) */
export function buildPanelSurfaceStyle(theme: ThemeConfig): React.CSSProperties {
  if (!isLiquidGlassActive(theme)) {return {}}
  return {
    background: 'rgba(8, 12, 8, 0.40)',
    backdropFilter: 'blur(16px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
  }
}

// ============================================
// CSS class builders
// ============================================

export function buildBrandGradientClass(active: boolean): string {
  return active
    ? 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent'
    : ''
}

export function buildLogoGlow(active: boolean): string {
  return active ? 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' : ''
}

export function buildLogoGlowLg(active: boolean): string {
  return active ? 'drop-shadow(0 0 14px rgba(16,185,129,0.6)) drop-shadow(0 0 28px rgba(6,182,212,0.3))' : ''
}

export function buildFocusGlowClass(active: boolean): string {
  return active ? 'ring-emerald-500/40 focus-within:ring-emerald-400/60 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.25)]' : ''
}

export function buildSendBtnClass(active: boolean): string {
  return active
    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
    : ''
}

export function buildCardLiftClass(active: boolean): string {
  return active ? 'lg-card-lift' : ''
}

export function buildShimmerClass(active: boolean): string {
  return active ? 'lg-shimmer' : ''
}

export function buildActiveViewClass(active: boolean): string {
  return active
    ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
    : 'bg-white/10 text-white'
}

export function getAiIconColor(active: boolean): string {
  return active ? '#34d399' : '#a78bfa'
}

export function getAccentColor(active: boolean): string {
  return active ? '#10b981' : '#8b5cf6'
}

// ============================================
// React hook
// ============================================

export interface LiquidGlassResult {
  isLG: boolean
  navSurfaceStyle: React.CSSProperties
  panelSurfaceStyle: React.CSSProperties
  brandGradientClass: string
  logoGlow: string
  logoGlowLg: string
  focusGlowClass: string
  sendBtnClass: string
  cardLiftClass: string
  shimmerClass: string
  activeViewClass: string
  aiIconColor: string
  accentColor: string
}

/**
 * React hook that derives liquid-glass styling helpers from the current theme.
 * Components destructure only the properties they need.
 */
export function useLiquidGlass(): LiquidGlassResult {
  const currentTheme = useThemeStore((s) => s.currentTheme)
  const active = isLiquidGlassActive(currentTheme)

  return {
    isLG: active,
    navSurfaceStyle: buildNavSurfaceStyle(currentTheme),
    panelSurfaceStyle: buildPanelSurfaceStyle(currentTheme),
    brandGradientClass: buildBrandGradientClass(active),
    logoGlow: buildLogoGlow(active),
    logoGlowLg: buildLogoGlowLg(active),
    focusGlowClass: buildFocusGlowClass(active),
    sendBtnClass: buildSendBtnClass(active),
    cardLiftClass: buildCardLiftClass(active),
    shimmerClass: buildShimmerClass(active),
    activeViewClass: buildActiveViewClass(active),
    aiIconColor: getAiIconColor(active),
    accentColor: getAccentColor(active),
  }
}
