/**
 * @file font-loader.ts
 * @description 字体加载优化 - 预加载、后备方案、性能监控
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-04-07
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags font, loader, performance
 */

import { createLogger } from './logger'

const log = createLogger('FontLoader')

export interface FontConfig {
  family: string
  weight?: string
  style?: string
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
}

const FONT_SOURCES = [
  {
    name: 'fonts.font.im',
    url: 'https://fonts.font.im/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  },
  {
    name: 'fonts.loli.net',
    url: 'https://fonts.loli.net/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  },
  {
    name: 'fonts.googleapis.com',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  },
]

const loadedFonts: Set<string> = new Set()
const failedSources: Set<string> = new Set()

export async function loadFonts(): Promise<void> {
  log.info('Starting font loading process')

  for (const source of FONT_SOURCES) {
    if (failedSources.has(source.name)) {
      log.debug(`Skipping failed source: ${source.name}`)
      continue
    }

    try {
      log.info(`Trying font source: ${source.name}`)
      
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = source.url
      
      const loadPromise = new Promise<void>((resolve, reject) => {
        link.onload = () => {
          log.info(`Font source loaded successfully: ${source.name}`)
          loadedFonts.add(source.name)
          resolve()
        }
        
        link.onerror = () => {
          log.warn(`Font source failed: ${source.name}`)
          failedSources.add(source.name)
          reject(new Error(`Failed to load fonts from ${source.name}`))
        }
        
        document.head.appendChild(link)
      })

      await Promise.race([
        loadPromise,
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        ),
      ])

      if (loadedFonts.has(source.name)) {
        log.info('Font loading complete', { source: source.name })
        return
      }
    } catch (error) {
      log.warn(`Font source error: ${source.name}`, { error })
      continue
    }
  }

  log.warn('All font sources failed, using system fonts')
  applyFallbackFonts()
}

export function applyFallbackFonts(): void {
  log.info('Applying fallback fonts')
  
  const style = document.createElement('style')
  style.textContent = `
    * {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    }
    
    code, pre, .font-mono {
      font-family: 'Courier New', Consolas, Monaco, 'Lucida Console', monospace !important;
    }
  `
  document.head.appendChild(style)
}

export function preloadFonts(): void {
  log.info('Preloading font sources')
  
  const primarySource = FONT_SOURCES[0]
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = new URL(primarySource.url).origin
  document.head.appendChild(link)
  
  const dnsLink = document.createElement('link')
  dnsLink.rel = 'dns-prefetch'
  dnsLink.href = new URL(primarySource.url).origin
  document.head.appendChild(dnsLink)
}

export function checkFontAvailability(fontFamily: string): boolean {
  if (typeof document === 'undefined') {return false}
  
  const testText = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  if (!context) {return false}
  
  context.font = `16px ${fontFamily}`
  const width = context.measureText(testText).width
  
  context.font = '16px monospace'
  const fallbackWidth = context.measureText(testText).width
  
  return width !== fallbackWidth
}

export function getFontLoadStatus(): {
  loaded: string[]
  failed: string[]
  available: boolean
} {
  return {
    loaded: Array.from(loadedFonts),
    failed: Array.from(failedSources),
    available: checkFontAvailability('Inter') && checkFontAvailability('JetBrains Mono'),
  }
}

export function initFontLoader(): void {
  if (typeof window === 'undefined') {return}
  
  preloadFonts()
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadFonts().catch(error => {
        log.error('Font loading failed', { error })
        applyFallbackFonts()
      })
    })
  } else {
    loadFonts().catch(error => {
      log.error('Font loading failed', { error })
      applyFallbackFonts()
    })
  }
}

export default {
  loadFonts,
  applyFallbackFonts,
  preloadFonts,
  checkFontAvailability,
  getFontLoadStatus,
  initFontLoader,
}
