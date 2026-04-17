/**
 * @file LoadingPage.tsx
 * @description Loading page component for lazy-loaded routes
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

import { useEffect, useState } from 'react'
import { cn } from './ui/utils'

interface LoadingPageProps {
  message?: string
  progress?: number
}

export function LoadingPage({ message = '加载中...', progress }: LoadingPageProps) {
  const [dots, setDots] = useState('')
  const [showProgress, setShowProgress] = useState(false)

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) {return ''}
        return prev + '.'
      })
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Show progress after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowProgress(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        {/* Loading Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="w-12 h-12 border-4 border-secondary border-b-transparent rounded-full animate-spin mx-auto absolute top-2 left-2 animate-pulse" />
        </div>

        {/* Loading Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">
            YYC³ AI
          </h2>
          <p className="text-muted-foreground">
            {message}{dots}
          </p>
        </div>

        {/* Progress Bar */}
        {progress !== undefined && showProgress && (
          <div className="w-64 mx-auto space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full bg-primary rounded-full transition-all duration-300 ease-out',
                  progress >= 100 && 'bg-green-500'
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {progress}%
            </p>
          </div>
        )}

        {/* Loading Tips */}
        <div className="max-w-md mx-auto p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 提示：首次加载可能需要几秒钟，正在初始化服务和组件...
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoadingPage
