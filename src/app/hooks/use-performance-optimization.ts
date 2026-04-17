/**
 * @file use-performance-optimization.ts
 * @description Hook for performance optimization integration
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

import { useEffect } from 'react'
import {
  preloadCriticalResources,
  preconnectToOrigins,
  dnsPrefetchOrigins,
  optimizeFontLoading,
  initLazyLoading,
} from '@/app/utils/performance-optimization'
import {
  registerServiceWorker,
  clearServiceWorkerCache,
} from '@/app/utils/service-worker'
import { createLogger } from '@/app/utils/logger'

const log = createLogger('PerformanceOptimization')

export interface PerformanceOptimizationConfig {
  // Resource preloading
  preloadScripts?: string[]
  preloadStyles?: string[]
  preloadFonts?: string[]
  preloadImages?: string[]
  
  // Origins
  preconnectOrigins?: string[]
  dnsPrefetchOrigins?: string[]
  
  // Service Worker
  enableServiceWorker?: boolean
  serviceWorkerScript?: string
  
  // Lazy loading
  enableLazyLoading?: boolean
  
  // Optimization level
  optimizationLevel?: 'basic' | 'standard' | 'aggressive'
}

export function usePerformanceOptimization(config: PerformanceOptimizationConfig = {}) {
  useEffect(() => {
    const {
      preloadScripts = [],
      preloadStyles = [],
      preloadFonts = [],
      preloadImages = [],
      preconnectOrigins = [],
      dnsPrefetchOrigins = [],
      enableServiceWorker = true,
      serviceWorkerScript = '/sw.js',
      enableLazyLoading = true,
      optimizationLevel = 'standard',
    } = config

    log.info('Initializing performance optimization...', { config })

    // 1. Preload critical resources
    if (optimizationLevel !== 'basic') {
      // Preload scripts
      if (preloadScripts.length > 0) {
        preloadCriticalResources(preloadScripts, 'script')
        log.info('Preloaded scripts:', preloadScripts.length)
      }

      // Preload styles
      if (preloadStyles.length > 0) {
        preloadCriticalResources(preloadStyles, 'style')
        log.info('Preloaded styles:', preloadStyles.length)
      }

      // Preload fonts
      if (preloadFonts.length > 0) {
        optimizeFontLoading(preloadFonts)
        log.info('Preloaded fonts:', preloadFonts.length)
      }

      // Preload images
      if (preloadImages.length > 0) {
        preloadCriticalResources(preloadImages, 'image')
        log.info('Preloaded images:', preloadImages.length)
      }
    }

    // 2. Preconnect to origins
    if (preconnectOrigins.length > 0) {
      preconnectToOrigins(preconnectOrigins)
      log.info('Preconnected to origins:', preconnectOrigins.length)
    }

    // 3. DNS prefetch
    if (dnsPrefetchOrigins.length > 0) {
       
      (dnsPrefetchOrigins as any)(dnsPrefetchOrigins)
      log.info('DNS prefetched origins:', dnsPrefetchOrigins.length)
    }

    // 4. Register Service Worker
    if (enableServiceWorker) {
      registerServiceWorker(serviceWorkerScript).then(() => {
        log.info('Service Worker registered')
      }).catch((error) => {
        log.warn('Service Worker registration failed:', error)
      })
    }

    // 5. Initialize lazy loading
    if (enableLazyLoading) {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            initLazyLoading()
            log.info('Lazy loading initialized')
          }, 100)
        })
      } else {
        setTimeout(() => {
          initLazyLoading()
          log.info('Lazy loading initialized')
        }, 100)
      }
    }

    log.info('Performance optimization initialized successfully')
  }, [config])

  return {
    clearCache: clearServiceWorkerCache,
    getServiceWorkerStatus: () => {
      if ('serviceWorker' in navigator) {
        return {
          registered: navigator.serviceWorker.controller !== null,
          activated: true,
        }
      }
      return {
        registered: false,
        activated: false,
      }
    },
  }
}
