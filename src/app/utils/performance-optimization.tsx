/**
 * @file performance-optimization.ts
 * @description Performance optimization utilities for Core Web Vitals
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

/**
 * Preload critical resources for LCP optimization
 * @param hrefs - URLs of resources to preload
 * @param as - Type of resource (script, style, font, image)
 */
export function preloadCriticalResources(hrefs: string[], as: 'script' | 'style' | 'font' | 'image'): void {
  hrefs.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    
    if (as === 'font') {
      link.crossOrigin = 'anonymous'
    }
    
    document.head.appendChild(link)
  })
}

/**
 * Preconnect to important origins
 * @param origins - Origins to preconnect to
 */
export function preconnectToOrigins(origins: string[]): void {
  origins.forEach(origin => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = origin
    document.head.appendChild(link)
  })
}

/**
 * DNS prefetch for less critical origins
 * @param origins - Origins to DNS prefetch
 */
export function dnsPrefetchOrigins(origins: string[]): void {
  origins.forEach(origin => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = origin
    document.head.appendChild(link)
  })
}

/**
 * Lazy load images with Intersection Observer
 * @param img - Image element to lazy load
 * @param options - Intersection Observer options
 */
export function lazyLoadImage(img: HTMLImageElement, options?: IntersectionObserverInit): void {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without IntersectionObserver
    img.src = img.dataset.src || ''
    return
  }

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        if (img.dataset.src) {
          img.src = img.dataset.src
          img.removeAttribute('data-src')
          observer.unobserve(img)
        }
      }
    })
  }, options)

  observer.observe(img)
}

/**
 * Initialize lazy loading for all images with data-src
 */
export function initLazyLoading(): void {
  const images = document.querySelectorAll('img[data-src]')
  images.forEach(img => {
    lazyLoadImage(img as HTMLImageElement, {
      rootMargin: '50px', // Start loading 50px before entering viewport
      threshold: 0.01,
    })
  })
}

/**
 * Optimize font loading
 * @param fonts - Font URLs to optimize
 */
export function optimizeFontLoading(fonts: string[]): void {
  fonts.forEach(fontUrl => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = fontUrl
    document.head.appendChild(link)
  })
}

/**
 * Reduce layout shift by reserving space for dynamic content
 * @param element - Element to reserve space for
 * @param width - Width to reserve
 * @param height - Height to reserve
 */
export function reserveSpaceForDynamicContent(
  element: HTMLElement,
  width: number,
  height: number
): void {
  element.style.width = `${width}px`
  element.style.height = `${height}px`
  element.style.display = 'block'
}

/**
 * Optimize CLS by adding fallback dimensions to images
 * @param img - Image element
 * @param width - Fallback width
 * @param height - Fallback height
 */
export function addImageFallbackDimensions(
  img: HTMLImageElement,
  width: number,
  height: number
): void {
  img.width = width
  img.height = height
  img.style.aspectRatio = `${width}/${height}`
}

/**
 * Reduce JavaScript blocking by deferring non-critical scripts
 * @param scriptUrl - URL of script to defer
 */
export function deferNonCriticalScript(scriptUrl: string): void {
  const script = document.createElement('script')
  script.src = scriptUrl
  script.defer = true
  document.body.appendChild(script)
}

/**
 * Async load non-blocking scripts
 * @param scriptUrl - URL of script to load asynchronously
 */
export function asyncLoadScript(scriptUrl: string): void {
  const script = document.createElement('script')
  script.src = scriptUrl
  script.async = true
  document.body.appendChild(script)
}

/**
 * Measure and report layout shift
 * @returns - Layout shift value
 */
export function measureLayoutShift(): number {
  let cls = 0
  let sessionValue = 0
  let sessionEntries: PerformanceEntry[] = []

  if ('LayoutShift' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[]
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          sessionValue += entry.value
          sessionEntries.push(entry)
          
          if (sessionEntries.length > 0) {
            sessionEntries = sessionEntries.filter(e => e.startTime < entry.startTime - 1000)
          }
          
          cls = Math.max(cls, sessionValue)
        }
      })
    })

    observer.observe({ entryTypes: ['layout-shift'] })
  }

  return cls
}

/**
 * Optimize First Input Delay by using passive event listeners
 * @param target - Event target
 * @param type - Event type
 * @param listener - Event listener
 * @param options - Event listener options
 */
export function addPassiveEventListener(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions
): void {
  target.addEventListener(type, listener, {
    passive: true,
    ...options,
  })
}

/**
 * Request Idle Callback for non-critical tasks
 * @param callback - Callback function
 * @param options - Options
 */
export function runWhenIdle(callback: () => void, options?: IdleRequestOptions): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options)
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(callback, 1)
  }
}

/**
 * Throttle function to improve performance
 * @param func - Function to throttle
 * @param limit - Time limit in ms
 * @returns - Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Debounce function to improve performance
 * @param func - Function to debounce
 * @param wait - Wait time in ms
 * @returns - Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {clearTimeout(timeout)}
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

/**
 * Virtual scrolling optimization for long lists
 * @param items - Items to render
 * @param renderItem - Function to render each item
 * @param itemHeight - Height of each item
 * @param containerHeight - Height of container
 * @param scrollPosition - Current scroll position
 * @returns - Visible items and offset
 */
export function getVisibleItems<T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  itemHeight: number,
  containerHeight: number,
  scrollPosition: number
): { items: React.ReactNode[]; offsetY: number } {
  const totalHeight = items.length * itemHeight
  const startIdx = Math.floor(scrollPosition / itemHeight)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const endIdx = Math.min(startIdx + visibleCount + 1, items.length)

  const visibleItems: React.ReactNode[] = []
  for (let i = startIdx; i < endIdx; i++) {
    visibleItems.push(
      <div key={i} style={{ position: 'absolute', top: i * itemHeight, height: itemHeight }}>
        {renderItem(items[i], i)}
      </div>
    )
  }

  const offsetY = startIdx * itemHeight

  return { items: visibleItems, offsetY }
}

/**
 * Optimize re-renders with React.memo helper
 * @param Component - Component to memoize
 * @param propsAreEqual - Custom props comparison function
 * @returns - Memoized component
 */
export function shouldComponentUpdate<P extends object>(
  prevProps: P,
  nextProps: P
): boolean {
  // Deep comparison for objects
  return JSON.stringify(prevProps) !== JSON.stringify(nextProps)
}

/**
 * Batch DOM updates for better performance
 * @param updates - Array of update functions
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update())
  })
}
