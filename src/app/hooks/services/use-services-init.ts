/**
 * YYC³ AI - Services Initialization Hook
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module useServicesInit
 * @description 服务初始化 Hook，集成所有服务
 * @author YYC³ AI Team
 * @version 3.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { useEffect, useRef } from 'react'
import { 
  getYjsService, 
  destroyYjsService,
  type YjsServiceConfig 
} from '../../services/yjs/yjs-service'
import { 
  getP2PService, 
  destroyP2PService,
  type P2PServiceConfig 
} from '../../services/p2p/p2p-service'
import { 
  getOfflineService, 
  destroyOfflineService,
  type OfflineServiceConfig 
} from '../../services/offline/offline-service'
import { 
  getEdgeComputeService, 
  destroyEdgeComputeService 
} from '../../services/edge/edge-compute-service'
import { createLogger } from '../../utils/logger'

const log = createLogger('useServicesInit')

/**
 * 服务配置
 */
export interface ServicesConfig {
  /** Yjs 服务配置 */
  yjs?: YjsServiceConfig
  /** P2P 服务配置 */
  p2p?: P2PServiceConfig
  /** 离线服务配置 */
  offline?: OfflineServiceConfig
  /** 是否启用边缘计算 */
  enableEdgeCompute?: boolean
  /** 边缘计算 Worker 数量 */
  maxWorkers?: number
}

/**
 * 服务初始化 Hook
 * 
 * @param config 服务配置
 * @returns 服务初始化状态
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { isInitialized, error } = useServicesInit({
 *     yjs: {
 *       docId: 'my-doc',
 *       roomName: 'my-room',
 *     },
 *     enableEdgeCompute: true,
 *   })
 * 
 *   if (!isInitialized) {
 *     return <LoadingScreen />
 *   }
 * 
 *   return <MainApp />
 * }
 * ```
 */
export function useServicesInit(config: ServicesConfig = {}): {
  isInitialized: boolean
  error: Error | null
} {
  const isInitializedRef = useRef(false)
  const errorRef = useRef<Error | null>(null)

  useEffect(() => {
    // 避免重复初始化
    if (isInitializedRef.current) {
      return
    }

    log.info('Initializing services...')

    async function initServices() {
      const initResults: string[] = []
      const errors: Error[] = []

      try {
        // 初始化 Yjs CRDT 服务（带容错）
        if (config.yjs) {
          try {
            log.info('Initializing Yjs CRDT service')
            getYjsService(config.yjs)
            initResults.push('Yjs CRDT')
            log.info('Yjs CRDT service initialized')
          } catch (err) {
            const error = err as Error
            errors.push(error)
            log.warn('Yjs service initialization failed (non-critical)', { error: error.message })
          }
        }

        // 初始化 P2P 直连服务（带容错）
        if (config.p2p !== undefined) {
          try {
            log.info('Initializing P2P service')
            getP2PService(config.p2p)
            initResults.push('P2P')
            log.info('P2P service initialized')
          } catch (err) {
            const error = err as Error
            errors.push(error)
            log.warn('P2P service initialization failed (non-critical)', { error: error.message })
          }
        }

        // 初始化离线模式服务（带容错）
        if (config.offline !== undefined) {
          try {
            log.info('Initializing offline service')
            getOfflineService(config.offline)
            initResults.push('Offline')
            log.info('Offline service initialized')
          } catch (err) {
            const error = err as Error
            errors.push(error)
            log.warn('Offline service initialization failed (non-critical)', { error: error.message })
          }
        }

        // 初始化边缘计算服务（带容错）
        if (config.enableEdgeCompute) {
          try {
            log.info('Initializing edge compute service')
            getEdgeComputeService(config.maxWorkers)
            initResults.push('Edge Compute')
            log.info('Edge compute service initialized')
          } catch (err) {
            const error = err as Error
            errors.push(error)
            log.warn('Edge compute service initialization failed (non-critical)', { error: error.message })
          }
        }

        isInitializedRef.current = true
        
        if (errors.length > 0) {
          log.warn(`Services initialized with ${errors.length} warnings`, { 
            successful: initResults, 
            failed: errors.map(e => e.message) 
          })
        } else {
          log.info('All services initialized successfully', { services: initResults })
        }
        
      } catch (error) {
        const err = error as Error
        errorRef.current = err
        log.error('Critical failure during service initialization', { error: err.message })
        isInitializedRef.current = true
      }
    }

    initServices()

    // 清理函数：销毁所有服务
    return () => {
      log.info('Destroying services...')
      try {
        destroyYjsService()
        destroyP2PService()
        destroyOfflineService()
        destroyEdgeComputeService()
        isInitializedRef.current = false
        log.info('All services destroyed')
      } catch (error) {
        log.error('Failed to destroy services', { error })
      }
    }
  }, [config])

  return {
    isInitialized: isInitializedRef.current,
    error: errorRef.current,
  }
}

/**
 * 等待服务初始化 Hook
 * 
 * @param config 服务配置
 * @returns 服务初始化状态
 */
export function useServicesReady(config: ServicesConfig = {}): boolean {
  const { isInitialized, error } = useServicesInit(config)
  return isInitialized && !error
}
