/**
 * @file service-worker.ts
 * @description Service Worker registration and management
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

import { createLogger } from './logger'

const log = createLogger('ServiceWorker')

let swRegistration: ServiceWorkerRegistration | null = null

/**
 * Register Service Worker
 * @param scriptURL - Service Worker script URL
 */
export async function registerServiceWorker(scriptURL: string = '/sw.js'): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    log.warn('[Service Worker] Not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register(scriptURL, {
      scope: '/',
    })

    swRegistration = registration
    
    log.info('[Service Worker] Registered:', registration)
    log.debug('[Service Worker] Scope:', registration.scope)
    log.debug('[Service Worker] State:', registration.active?.state)

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      log.debug('[Service Worker] Update found')
      const newWorker = registration.installing
      
      if (newWorker) {
        newWorker.addEventListener('statechange', (e) => {
          log.debug('[Service Worker] State:', (e.target as ServiceWorker).state)
        })
      }
    })

    // Listen for controller change
    registration.addEventListener('controllerchange', () => {
      log.info('[Service Worker] Controller changed')
      window.location.reload()
    })
  } catch (error) {
    log.error('[Service Worker] Registration failed:', error)
  }
}

/**
 * Unregister Service Worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!swRegistration) {
    log.warn('[Service Worker] No registration found')
    return
  }

  try {
    const result = await swRegistration.unregister()
    log.info('[Service Worker] Unregistered:', result)
    swRegistration = null
  } catch (error) {
    log.error('[Service Worker] Unregistration failed:', error)
  }
}

/**
 * Get Service Worker registration
 */
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return swRegistration
}

/**
 * Update Service Worker
 */
export async function updateServiceWorker(): Promise<void> {
  if (!swRegistration) {
    log.warn('[Service Worker] No registration found')
    return
  }

  await swRegistration.update()
  log.info('[Service Worker] Update requested')
}

/**
 * Skip waiting Service Worker
 */
export function skipWaitingServiceWorker(): void {
  if (!swRegistration || !swRegistration.waiting) {
    log.warn('[Service Worker] No waiting service worker')
    return
  }

  const waitingWorker = swRegistration.waiting
  waitingWorker.postMessage({ type: 'SKIP_WAITING' })
  log.info('[Service Worker] Skip waiting requested')
}

/**
 * Clear Service Worker cache
 */
export async function clearServiceWorkerCache(): Promise<void> {
  if (!swRegistration) {
    log.warn('[Service Worker] No registration found')
    return
  }

  try {
    const messageChannel = new MessageChannel()
    
    await new Promise<void>((resolve, reject) => {
      messageChannel.port1.onmessage = (event) => {
        if (event.data === 'CACHED_CLEARED') {
          log.info('[Service Worker] Cache cleared')
          resolve()
        } else {
          reject(new Error('Failed to clear cache'))
        }
      }
      
      if (swRegistration && swRegistration.active) {
        swRegistration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        )
      } else {
        reject(new Error('Service Worker not active'))
        return
      }
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Clear cache timeout'))
      }, 5000)
    })
  } catch (error) {
    log.error('[Service Worker] Clear cache failed:', error)
    throw error
  }
}

/**
 * Get Service Worker status
 */
export function getServiceWorkerStatus(): {
  registered: boolean
  activated: boolean
  controlled: boolean
  waiting: boolean
} {
  if (!('serviceWorker' in navigator)) {
    return {
      registered: false,
      activated: false,
      controlled: false,
      waiting: false,
    }
  }

  return {
    registered: swRegistration !== null,
    activated: swRegistration?.active !== undefined,
    controlled: navigator.serviceWorker.controller !== null,
    waiting: swRegistration?.waiting !== undefined,
  }
}
