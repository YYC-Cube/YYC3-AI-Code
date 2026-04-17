/**
 * @file debounce.ts
 * @description 防抖 / 节流工具 — 前端性能优化基础设施
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 */

/* ================================================================
   Debounce
   ================================================================ */

/**
 * Creates a debounced version of the provided function.
 * The function will only be called after `delay` ms of inactivity.
 *
 * @example
 * const debouncedSearch = debounce((q: string) => search(q), 300)
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value))
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      timeoutId = null
      fn(...args)
      lastArgs = null
    }, delay)
  }

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
      lastArgs = null
    }
  }

  debounced.flush = () => {
    if (timeoutId !== null && lastArgs !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
      fn(...lastArgs)
      lastArgs = null
    }
  }

  return debounced as T & { cancel: () => void; flush: () => void }
}

/* ================================================================
   Throttle
   ================================================================ */

/**
 * Creates a throttled version of the provided function.
 * The function will be called at most once per `interval` ms.
 *
 * @example
 * const throttledScroll = throttle(() => onScroll(), 100)
 * window.addEventListener('scroll', throttledScroll)
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): T & { cancel: () => void } {
  let lastCallTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = interval - (now - lastCallTime)

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCallTime = now
      fn(...args)
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now()
        timeoutId = null
        fn(...args)
      }, remaining)
    }
  }

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return throttled as T & { cancel: () => void }
}

/* ================================================================
   useDebounce Hook
   ================================================================ */

import { useState, useEffect } from 'react'

/**
 * React hook that debounces a value.
 *
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 * useEffect(() => { fetchResults(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
