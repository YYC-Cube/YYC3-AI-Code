/**
 * @file use-responsive.ts
 * @description Responsive breakpoint hooks — multi-breakpoint, device detection, layout adaptation
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { useState, useEffect, useMemo } from 'react'

// ============================================
// Breakpoint Definitions
// ============================================

export const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

export interface ResponsiveState {
  width: number
  height: number
  breakpoint: BreakpointKey
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
  orientation: 'portrait' | 'landscape'
  deviceType: 'mobile' | 'tablet' | 'desktop'
  pixelRatio: number
  touchSupport: boolean
}

// ============================================
// Core Hook: useResponsive
// ============================================

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => computeState())

  useEffect(() => {
    const update = () => setState(computeState())

    const mqls = Object.values(BREAKPOINTS).map(bp =>
      window.matchMedia(`(min-width: ${bp}px)`)
    )

    mqls.forEach(mql => mql.addEventListener('change', update))
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)

    return () => {
      mqls.forEach(mql => mql.removeEventListener('change', update))
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return state
}

function computeState(): ResponsiveState {
  const width = window.innerWidth
  const height = window.innerHeight

  let breakpoint: BreakpointKey = 'xs'
  if (width >= BREAKPOINTS['2xl']) {breakpoint = '2xl'}
  else if (width >= BREAKPOINTS.xl) {breakpoint = 'xl'}
  else if (width >= BREAKPOINTS.lg) {breakpoint = 'lg'}
  else if (width >= BREAKPOINTS.md) {breakpoint = 'md'}
  else if (width >= BREAKPOINTS.sm) {breakpoint = 'sm'}

  const isMobile = width < BREAKPOINTS.md
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg
  const isDesktop = width >= BREAKPOINTS.lg
  const isLargeDesktop = width >= BREAKPOINTS.xl

  const deviceType: ResponsiveState['deviceType'] = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    orientation: width >= height ? 'landscape' : 'portrait',
    deviceType,
    pixelRatio: window.devicePixelRatio || 1,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  }
}

// ============================================
// Convenience Hooks
// ============================================

export function useBreakpoint(): BreakpointKey {
  return useResponsive().breakpoint
}

export function useIsMobile(): boolean {
  return useResponsive().isMobile
}

export function useIsTablet(): boolean {
  return useResponsive().isTablet
}

export function useIsDesktop(): boolean {
  return useResponsive().isDesktop
}

export function useDeviceType(): ResponsiveState['deviceType'] {
  return useResponsive().deviceType
}

// ============================================
// Media Query Hook
// ============================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {return false}
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

// ============================================
// Layout Adaptation Hook
// ============================================

export interface MobileLayoutConfig {
  /** Whether to use single-column layout */
  singleColumn: boolean
  /** Whether to show bottom navigation */
  showBottomNav: boolean
  /** Whether panels should be tabs instead of side-by-side */
  tabMode: boolean
  /** Which panel is active in tab mode */
  activeTab: 'ai' | 'code' | 'terminal'
  /** Whether to hide the sidebar */
  hideSidebar: boolean
  /** Compact mode for smaller screens */
  compact: boolean
}

export function useMobileLayout(): MobileLayoutConfig & {
  setActiveTab: (tab: MobileLayoutConfig['activeTab']) => void
} {
  const { isMobile, isTablet, width } = useResponsive()
  const [activeTab, setActiveTab] = useState<MobileLayoutConfig['activeTab']>('ai')

  const config = useMemo((): MobileLayoutConfig => {
    if (isMobile) {
      return {
        singleColumn: true,
        showBottomNav: true,
        tabMode: true,
        activeTab,
        hideSidebar: true,
        compact: true,
      }
    }
    if (isTablet) {
      return {
        singleColumn: width < 900,
        showBottomNav: false,
        tabMode: width < 900,
        activeTab,
        hideSidebar: width < 900,
        compact: true,
      }
    }
    return {
      singleColumn: false,
      showBottomNav: false,
      tabMode: false,
      activeTab,
      hideSidebar: false,
      compact: false,
    }
  }, [isMobile, isTablet, width, activeTab])

  return { ...config, setActiveTab }
}

// ============================================
// Responsive Value Hook
// ============================================

export function useResponsiveValue<T>(values: Partial<Record<BreakpointKey | 'default', T>>): T | undefined {
  const { breakpoint } = useResponsive()

  return useMemo(() => {
    const order: BreakpointKey[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
    const startIdx = order.indexOf(breakpoint)

    for (let i = startIdx; i < order.length; i++) {
      const bp = order[i]
      if (values[bp] !== undefined) {return values[bp]}
    }

    return values.default
  }, [breakpoint, values])
}

// ============================================
// Viewport Size Hook
// ============================================

export function useViewportSize(): { width: number; height: number } {
  const { width, height } = useResponsive()
  return { width, height }
}

// ============================================
// Orientation Hook
// ============================================

export function useOrientation(): 'portrait' | 'landscape' {
  return useResponsive().orientation
}
