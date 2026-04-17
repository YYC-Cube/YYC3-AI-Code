/**
 * @file OptimizedImage.tsx
 * @description Optimized image component with lazy loading and performance improvements
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

import { useEffect, useRef, useState } from 'react'
import { cn } from './ui/utils'
import { lazyLoadImage } from '@/app/utils/performance-optimization'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  loading?: 'lazy' | 'eager'
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
  placeholder,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) {return}

    if (loading === 'lazy') {
      // Use Intersection Observer for lazy loading
      lazyLoadImage(img, {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01,
      })
    } else {
      // Eager loading
      img.src = src
    }
  }, [src, loading])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
    onError?.()
  }

  return (
    <div
      className={cn('relative overflow-hidden bg-muted', className)}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
      }}
    >
      {!isLoaded && !error && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        </div>
      )}
      
      <img
        ref={imgRef}
        data-src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading === 'eager' ? 'eager' : undefined}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          aspectRatio: width && height ? `${width}/${height}` : undefined,
        }}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">图片加载失败</span>
        </div>
      )}
    </div>
  )
}

export default OptimizedImage
