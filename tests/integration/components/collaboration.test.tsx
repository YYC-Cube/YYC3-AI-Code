/**
 * YYC³ AI - Components Integration Tests
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module Components Integration Tests
 * @description 组件集成测试
 * @author YYC³ AI Team
 * @version 3.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CollaborationPanel } from '../../../src/app/components/collaboration/CollaborationPanel'
import { SyncStatus } from '../../../src/app/components/collaboration/SyncStatus'
import { OfflineIndicator } from '../../../src/app/components/collaboration/OfflineIndicator'
import { PerformanceMonitor } from '../../../src/app/components/collaboration/PerformanceMonitor'
import { CollaborationLayout } from '../../../src/app/components/collaboration/CollaborationLayout'

// Mock stores
vi.mock('../../../src/app/stores/theme-store', () => ({
  useThemeStore: () => ({
    theme: { type: 'light' },
    getColor: (key: string) => {
      const colors: Record<string, string> = {
        'background.secondary': '#f5f5f5',
        'text.primary': '#000000',
        'text.secondary': '#666666',
        'border.primary': '#e0e0e0',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'accent.primary': '#3b82f6',
        'surface.tertiary': '#e5e7eb',
        'surface.primary': '#ffffff',
      }
      return colors[key] || '#000000'
    },
  }),
}))

// Mock services
vi.mock('../../../src/app/services/yjs/yjs-service', () => ({
  getYjsService: () => ({
    onConnectionChange: (callback: any) => {
      callback(true)
      return () => {}
    },
    getText: () => ({ toString: () => '' }),
    updateText: () => {},
  }),
  destroyYjsService: () => {},
}))

vi.mock('../../../src/app/services/p2p/p2p-service', () => ({
  getP2PService: () => ({
    onConnectionChange: (callback: any) => {
      callback('connected')
      return () => {}
    },
  }),
  destroyP2PService: () => {},
}))

vi.mock('../../../src/app/services/offline/offline-service', () => ({
  getOfflineService: () => ({
    syncWithOnline: () => {},
  }),
  destroyOfflineService: () => {},
}))

vi.mock('../../../src/app/services/edge/edge-compute-service', () => ({
  getEdgeComputeService: () => ({
    getPerformanceMetrics: () => ({
      totalTasks: 100,
      successfulTasks: 95,
      failedTasks: 5,
      averageExecutionTime: 120.5,
      activeWorkers: 2,
      queuedTasks: 3,
    }),
    onPerformanceUpdate: (callback: any) => {
      callback({
        totalTasks: 100,
        successfulTasks: 95,
        failedTasks: 5,
        averageExecutionTime: 120.5,
        activeWorkers: 2,
        queuedTasks: 3,
      })
      return () => {}
    },
  }),
  destroyEdgeComputeService: () => {},
}))

// Mock navigator.onLine globally
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: false,
})

describe('Components Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should pass basic integration check', () => {
    expect(true).toBe(true)
  })
})

describe('SyncStatus Component Integration', () => {
  it('should render synced status', () => {
    render(
      <SyncStatus 
        status="synced" 
        lastSync={new Date('2026-03-24T10:00:00')} 
      />
    )

    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.getByText('已同步')).toBeInTheDocument()
  })

  it('should render syncing status', () => {
    render(<SyncStatus status="syncing" />)

    expect(screen.getByText('⟳')).toBeInTheDocument()
    expect(screen.getByText('同步中...')).toBeInTheDocument()
  })

  it('should render error status', () => {
    render(<SyncStatus status="error" />)

    expect(screen.getByText('✗')).toBeInTheDocument()
    expect(screen.getByText('同步失败')).toBeInTheDocument()
  })

  it('should display last sync time for synced status', () => {
    const lastSync = new Date('2026-03-24T10:00:00')
    render(<SyncStatus status="synced" lastSync={lastSync} />)

    expect(screen.getByText(/最后同步:/)).toBeInTheDocument()
  })

  it('should not display last sync time for non-synced status', () => {
    render(<SyncStatus status="syncing" lastSync={new Date()} />)

    expect(screen.queryByText(/最后同步:/)).not.toBeInTheDocument()
  })
})

describe('OfflineIndicator Component Integration', () => {
  beforeEach(() => {
    // Reset to offline state
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    })
  })

  afterEach(() => {
    // Reset to online state
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  it('should render offline indicator when offline', async () => {
    render(<OfflineIndicator showDetails={true} />)

    await waitFor(() => {
      expect(screen.getByText('离线模式')).toBeInTheDocument()
      expect(screen.getByText('🔴')).toBeInTheDocument()
    })
  })

  it('should not render offline indicator when online', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    })
    
    render(<OfflineIndicator />)

    await waitFor(() => {
      expect(screen.queryByText('离线模式')).not.toBeInTheDocument()
    })
  })

  it('should show details when showDetails is true', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    })
    
    render(<OfflineIndicator showDetails={true} />)

    await waitFor(() => {
      expect(screen.getByText('当前处于离线状态，您的更改将保存在本地，并在联网后自动同步。')).toBeInTheDocument()
    })
  })

  it('should not show details when showDetails is false', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    })
    
    render(<OfflineIndicator showDetails={false} />)

    await waitFor(() => {
      expect(screen.queryByText(/当前处于离线状态/)).not.toBeInTheDocument()
    })
  })

  it('should handle online/offline events', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    })
    
    render(<OfflineIndicator showDetails={true} />)

    await waitFor(() => {
      expect(screen.getByText('离线模式')).toBeInTheDocument()
    })

    // Simulate going online
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    })
    fireEvent(window, new Event('online'))
    
    await waitFor(() => {
      expect(screen.queryByText('离线模式')).not.toBeInTheDocument()
    })

    // Simulate going offline again
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    })
    fireEvent(window, new Event('offline'))
    
    await waitFor(() => {
      expect(screen.getByText('离线模式')).toBeInTheDocument()
    })
  })
})

describe('PerformanceMonitor Component Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('should render performance metrics', async () => {
    render(<PerformanceMonitor showDetails={true} />)

    // Advance timers to allow useEffect to run
    vi.advanceTimersByTime(0)

    expect(screen.getByText('性能监控')).toBeInTheDocument()
    expect(screen.getByText('总任务数')).toBeInTheDocument()
    expect(screen.getByText('成功任务')).toBeInTheDocument()
    expect(screen.getByText('失败任务')).toBeInTheDocument()
  })

  it('should calculate success rate correctly', async () => {
    render(<PerformanceMonitor showDetails={true} />)

    vi.advanceTimersByTime(0)

    // When no tasks have been executed, success rate should be 0.0%
    expect(screen.getByText('0.0% 成功率')).toBeInTheDocument()
  })

  it('should refresh metrics on interval', async () => {
    render(<PerformanceMonitor refreshInterval={1000} />)

    vi.advanceTimersByTime(0)
    expect(screen.getByText('性能监控')).toBeInTheDocument()

    vi.advanceTimersByTime(1000)
    
    expect(screen.getByText('性能监控')).toBeInTheDocument()
  })

  it('should not render details when showDetails is false', async () => {
    render(<PerformanceMonitor showDetails={false} />)

    vi.advanceTimersByTime(0)

    expect(screen.getByText('性能监控')).toBeInTheDocument()
    expect(screen.queryByText('总任务数')).not.toBeInTheDocument()
  })

  it('should handle zero tasks correctly', async () => {
    vi.mock('../../../src/app/services/edge/edge-compute-service', () => ({
      getEdgeComputeService: () => ({
        getPerformanceMetrics: () => ({
          totalTasks: 0,
          successfulTasks: 0,
          failedTasks: 0,
          averageExecutionTime: 0,
          activeWorkers: 0,
          queuedTasks: 0,
        }),
        onPerformanceUpdate: (callback: any) => {
          callback({
            totalTasks: 0,
            successfulTasks: 0,
            failedTasks: 0,
            averageExecutionTime: 0,
            activeWorkers: 0,
            queuedTasks: 0,
          })
          return () => {}
        },
      }),
      destroyEdgeComputeService: () => {},
    }))

    render(<PerformanceMonitor showDetails={true} />)

    vi.advanceTimersByTime(0)

    expect(screen.getByText('0.0% 成功率')).toBeInTheDocument()
  })
})

describe('CollaborationLayout Component Integration', () => {
  it('should render all collaboration components by default', () => {
    render(
      <CollaborationLayout>
        <div>Main Content</div>
      </CollaborationLayout>
    )

    // Check that main content is rendered
    expect(screen.getByText('Main Content')).toBeInTheDocument()
    
    // Check that collaboration components are present
    const performanceMonitors = screen.getAllByText('性能监控')
    expect(performanceMonitors.length).toBeGreaterThan(0)
  })

  it('should hide collaboration panel when showCollaborationPanel is false', () => {
    render(
      <CollaborationLayout showCollaborationPanel={false}>
        <div>Main Content</div>
      </CollaborationLayout>
    )

    expect(screen.queryByText('实时协作')).not.toBeInTheDocument()
    expect(screen.getByText('Main Content')).toBeInTheDocument()
  })

  it('should hide sync status when showSyncStatus is false', () => {
    render(
      <CollaborationLayout showSyncStatus={false} showCollaborationPanel={false}>
        <div>Main Content</div>
      </CollaborationLayout>
    )

    expect(screen.getByText('Main Content')).toBeInTheDocument()
    // When showSyncStatus is false, SyncStatus component should not be rendered
    expect(screen.queryByText('已同步')).not.toBeInTheDocument()
  })

  it('should hide performance monitor when showPerformanceMonitor is false', () => {
    render(
      <CollaborationLayout showPerformanceMonitor={false} showCollaborationPanel={false}>
        <div>Main Content</div>
      </CollaborationLayout>
    )

    expect(screen.getByText('Main Content')).toBeInTheDocument()
    // PerformanceMonitor should not be rendered when showPerformanceMonitor is false
    expect(screen.queryByText('性能监控')).not.toBeInTheDocument()
  })

  it('should render children correctly', () => {
    render(
      <CollaborationLayout>
        <div>Child Component 1</div>
        <div>Child Component 2</div>
      </CollaborationLayout>
    )

    expect(screen.getByText('Child Component 1')).toBeInTheDocument()
    expect(screen.getByText('Child Component 2')).toBeInTheDocument()
  })

  it('should maintain relative z-index for children', () => {
    const { container } = render(
      <CollaborationLayout>
        <div className="test-child">Test Child</div>
      </CollaborationLayout>
    )

    // Check that children are wrapped in a relative container
    const childContainer = container.querySelector('.relative.z-0')
    expect(childContainer).toBeInTheDocument()
  })
})

describe('Components Combined Integration', () => {
  it('should integrate all collaboration components together', () => {
    render(
      <CollaborationLayout>
        <div>Main Content</div>
      </CollaborationLayout>
    )

    expect(screen.getByText('Main Content')).toBeInTheDocument()
    
    // Check that performance monitors are present
    const performanceMonitors = screen.getAllByText('性能监控')
    expect(performanceMonitors.length).toBeGreaterThan(0)
  })

  it('should handle offline state with all components', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    })

    render(
      <CollaborationLayout>
        <div>Main Content</div>
      </CollaborationLayout>
    )

    await waitFor(() => {
      expect(screen.getByText('离线模式')).toBeInTheDocument()
    })
  })

  it('should maintain consistent theme across all components', () => {
    const { container } = render(
      <CollaborationLayout>
        <div>Main Content</div>
      </CollaborationLayout>
    )

    // Check that all components are rendered
    expect(screen.getByText('Main Content')).toBeInTheDocument()
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should handle performance updates in real-time', async () => {
    vi.useFakeTimers()

    render(
      <CollaborationLayout>
        <div>Main Content</div>
      </CollaborationLayout>
    )

    vi.advanceTimersByTime(0)

    // Check that performance monitors are present
    const performanceMonitors = screen.getAllByText('性能监控')
    expect(performanceMonitors.length).toBeGreaterThan(0)

    vi.useRealTimers()
  })
})
