/**
 * @file lazy-component.tsx
 * @description Lazy loading utility for React components
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

import { lazy, Suspense, ComponentType } from 'react'
import { LoadingPage } from './LoadingPage'

interface LazyComponentOptions {
  loadingMessage?: string
  fallback?: React.ComponentType
}

/**
 * Create a lazy-loaded component with loading state
 * @param importFn - Dynamic import function
 * @param options - Configuration options
 * @returns Lazy-loaded component wrapped with Suspense
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn)
  const Fallback = options.fallback || (() => <LoadingPage message={options.loadingMessage || '加载中...'} />)

  return function WrappedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

/**
 * Create a lazy-loaded component without fallback (for advanced use cases)
 * @param importFn - Dynamic import function
 * @returns Lazy-loaded component
 */
export function createLazyComponentNoFallback<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): T {
  return lazy(importFn) as unknown as T
}
