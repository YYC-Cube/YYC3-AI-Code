/**
 * @file ThemeProvider.tsx
 * @description Theme lifecycle manager — applies CSS variables, renders liquid glass background
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { useEffect } from 'react'
import { useThemeStore, applyThemeToDOM } from '../../stores/theme-store'
import { LiquidGlassBackground } from './LiquidGlassBackground'
import { createLogger } from '../../utils/logger'

const log = createLogger('ThemeProvider')

/**
 * ThemeProvider: applies the current theme CSS variables on mount
 * and re-applies whenever the theme changes. Also renders the
 * LiquidGlassBackground when a liquid glass theme is active.
 */
export function ThemeProvider() {
  const currentTheme = useThemeStore(s => s.currentTheme)

  useEffect(() => {
    log.info('Initializing theme system', { theme: currentTheme.name, type: currentTheme.type })
    applyThemeToDOM(currentTheme)
  }, [currentTheme])

  // Also set document title from branding
  useEffect(() => {
    const { appName } = currentTheme.branding
    if (appName) {
      document.title = appName
      log.debug('Document title updated', { title: appName })
    }
  }, [currentTheme.branding.appName])

  return <LiquidGlassBackground />
}