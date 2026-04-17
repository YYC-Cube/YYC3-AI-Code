/**
 * @file sw.js
 * @description Service Worker for offline support and caching
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

const CACHE_NAME = 'yyc3-ai-v3.0.0'
const RUNTIME_CACHE = 'yyc3-ai-runtime-v3.0.0'

// Assets to cache on install
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css',
  '/favicon.ico',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets')
      return cache.addAll(CACHE_ASSETS)
    })
  )
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Take control of all pages immediately
  self.clients.claim()
})

// Fetch event - serve from cache, then network
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return
  }

  // Strategy: Cache First for static assets, Network First for API
  const isAsset = request.url.includes('/assets/')
  const isAPI = request.url.includes('/api/')

  if (isAsset) {
    // Cache First for assets
    event.respondWith(cacheFirst(request))
  } else if (isAPI) {
    // Network First for API
    event.respondWith(networkFirst(request))
  } else {
    // Stale While Revalidate for other requests
    event.respondWith(staleWhileRevalidate(request))
  }
})

// Cache First Strategy
function cacheFirst(request) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url)
      return cachedResponse
    }

    return fetch(request).then((networkResponse) => {
      if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
        return networkResponse
      }

      // Clone the response because it's a stream and can only be consumed once
      const responseToCache = networkResponse.clone()

      caches.open(RUNTIME_CACHE).then((cache) => {
        console.log('[Service Worker] Caching:', request.url)
        cache.put(request, responseToCache)
      })

      return networkResponse
    })
  })
}

// Network First Strategy
function networkFirst(request) {
  return fetch(request)
    .then((networkResponse) => {
      // Clone and cache the response
      const responseToCache = networkResponse.clone()

      caches.open(RUNTIME_CACHE).then((cache) => {
        console.log('[Service Worker] Caching API response:', request.url)
        cache.put(request, responseToCache)
      })

      return networkResponse
    })
    .catch(() => {
      // If network fails, try cache
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving cached API response:', request.url)
          return cachedResponse
        }

        // Return a custom offline response for API
        return new Response(
          JSON.stringify({ error: 'Offline', message: 'No network connection' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      })
    })
}

// Stale While Revalidate Strategy
function staleWhileRevalidate(request) {
  return caches.match(request).then((cachedResponse) => {
    // Fetch in the background
    const fetchPromise = fetch(request).then((networkResponse) => {
      if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
        return networkResponse
      }

      const responseToCache = networkResponse.clone()

      caches.open(RUNTIME_CACHE).then((cache) => {
        console.log('[Service Worker] Updating cache:', request.url)
        cache.put(request, responseToCache)
      })

      return networkResponse
    })

    // Return cached response immediately, or wait for network
    return cachedResponse || fetchPromise
  })
}

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Clearing cache:', cacheName)
          return caches.delete(cacheName)
        })
      )
    })
  }

  if (event.data && event.data.type === 'PRECACHE') {
    const urls = event.data.urls || []
    if (urls.length > 0) {
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Precaching URLs:', urls)
        cache.addAll(urls).catch((err) => {
          console.warn('[Service Worker] Some precache URLs failed:', err)
        })
      })
    }
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.open(CACHE_NAME).then((cache) => {
      return cache.keys()
    }).then((keys) => {
      event.ports[0]?.postMessage({
        type: 'CACHE_STATUS',
        cachedUrls: keys.map((req) => req.url),
      })
    })
  }
})

console.log('[Service Worker] Loaded')
