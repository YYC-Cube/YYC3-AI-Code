/**
 * YYC³ AI - Services Integration Tests
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module Services Integration Tests
 * @description 服务集成测试
 * @author YYC³ AI Team
 * @version 3.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getYjsService,
  destroyYjsService,
  type YjsServiceConfig,
} from '../../../src/app/services/yjs/yjs-service'
import {
  getP2PService,
  destroyP2PService,
} from '../../../src/app/services/p2p/p2p-service'
import {
  getOfflineService,
  destroyOfflineService,
} from '../../../src/app/services/offline/offline-service'
import {
  getEdgeComputeService,
  destroyEdgeComputeService,
} from '../../../src/app/services/edge/edge-compute-service'
import { useServicesInit } from '../../../src/app/hooks/services/use-services-init'

describe('Services Integration', () => {
  beforeEach(() => {
    // 清理所有服务
    destroyYjsService()
    destroyP2PService()
    destroyOfflineService()
    destroyEdgeComputeService()
  })

  afterEach(() => {
    // 清理所有服务
    destroyYjsService()
    destroyP2PService()
    destroyOfflineService()
    destroyEdgeComputeService()
  })

  describe('Yjs CRDT Service Integration', () => {
    it('should initialize Yjs service', () => {
      const config: YjsServiceConfig = {
        docId: 'test-doc',
        roomName: 'test-room',
        enableWebRTC: false,
        enableIndexedDB: false,
      }

      const service = getYjsService(config)
      expect(service).toBeDefined()
    })

    it('should create and update text', () => {
      const config: YjsServiceConfig = {
        docId: 'test-doc',
        roomName: 'test-room',
        enableWebRTC: false,
        enableIndexedDB: false,
      }

      const service = getYjsService(config)
      service.updateText('test-key', 'test content')
      const text = service.getText('test-key')

      expect(text.toString()).toBe('test content')
    })

    it('should create and update array', () => {
      const config: YjsServiceConfig = {
        docId: 'test-doc',
        roomName: 'test-room',
        enableWebRTC: false,
        enableIndexedDB: false,
      }

      const service = getYjsService(config)
      service.updateArray('test-array', ['item1', 'item2'])
      const array = service.getArray('test-array')

      expect(array.toJSON()).toEqual(['item1', 'item2'])
    })

    it('should create and update map', () => {
      const config: YjsServiceConfig = {
        docId: 'test-doc',
        roomName: 'test-room',
        enableWebRTC: false,
        enableIndexedDB: false,
      }

      const service = getYjsService(config)
      service.updateMap('test-map', { key1: 'value1', key2: 'value2' })
      const map = service.getMap('test-map')

      expect(map.toJSON()).toEqual({ key1: 'value1', key2: 'value2' })
    })

    it('should observe text changes', () => {
      const config: YjsServiceConfig = {
        docId: 'test-doc',
        roomName: 'test-room',
        enableWebRTC: false,
        enableIndexedDB: false,
      }

      const service = getYjsService(config)
      const callback = vi.fn()
      const unsubscribe = service.observeText('test-key', callback)

      service.updateText('test-key', 'new content')

      expect(callback).toHaveBeenCalled()
      unsubscribe()
    })

    it('should check connection state', () => {
      const config: YjsServiceConfig = {
        docId: 'test-doc',
        roomName: 'test-room',
        enableWebRTC: false,
        enableIndexedDB: false,
      }

      const service = getYjsService(config)
      const isConnected = service.isConnected()

      expect(typeof isConnected).toBe('boolean')
    })
  })

  describe('P2P Service Integration', () => {
    it('should initialize P2P service', () => {
      const service = getP2PService({
        enableDataChannel: false,
      })

      expect(service).toBeDefined()
    })

    it('should create offer', async () => {
      const service = getP2PService({
        enableDataChannel: false,
      })

      const offer = await service.createOffer()

      expect(offer).toBeDefined()
      expect(offer.type).toBe('offer')
    })

    it('should get connection state', () => {
      const service = getP2PService({
        enableDataChannel: false,
      })

      const state = service.getConnectionState()

      expect(typeof state).toBe('string')
    })

    it('should get peer ID', () => {
      const service = getP2PService({
        enableDataChannel: false,
      })

      const peerId = (service as any).getPeerId()

      expect(typeof peerId).toBe('string')
      expect(peerId).toBeTruthy()
    })
  })

  describe('Offline Service Integration', () => {
    it('should initialize offline service', () => {
      const service = getOfflineService()

      expect(service).toBeDefined()
    })

    it('should store and retrieve text', async () => {
      const service = getOfflineService()

      await service.storeText('test-id', 'test content')
      const result = await service.getText('test-id')

      expect(result).toBe('test content')
    })

    it('should store and retrieve array', async () => {
      const service = getOfflineService()

      await service.storeArray('test-array-id', ['item1', 'item2'])
      const result = await service.getArray('test-array-id')

      expect(result).toEqual(['item1', 'item2'])
    })

    it('should store and retrieve map', async () => {
      const service = getOfflineService()

      await service.storeMap('test-map-id', { key1: 'value1', key2: 'value2' })
      const result = await service.getMap('test-map-id')

      expect(result).toEqual({ key1: 'value1', key2: 'value2' })
    })

    it('should delete text', async () => {
      const service = getOfflineService()

      await service.storeText('test-id', 'test content')
      await service.deleteText('test-id')
      const result = await service.getText('test-id')

      expect(result).toBeNull()
    })

    it('should get unsynced items', async () => {
      const service = getOfflineService()

      await service.storeText('test-id', 'test content')
      const unsynced = await service.getUnsyncedItems()

      expect(Array.isArray(unsynced)).toBe(true)
    })
  })

  describe('Edge Compute Service Integration', () => {
    it('should initialize edge compute service', () => {
      const service = getEdgeComputeService(2)

      expect(service).toBeDefined()
    })

    it('should execute task', async () => {
      const service = getEdgeComputeService(2)

      const task = {
        type: 'test-task',
        data: 'test data',
      }

      const result = await service.execute(task)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should execute parallel tasks', async () => {
      const service = getEdgeComputeService(2)

      const tasks = [
        { type: 'task1', data: 'data1' },
        { type: 'task2', data: 'data2' },
      ]

      const results = await service.executeParallel(tasks)

      expect(Array.isArray(results)).toBe(true)
      expect(results).toHaveLength(2)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('should get performance metrics', () => {
      const service = getEdgeComputeService(2)

      const metrics = service.getPerformanceMetrics()

      expect(metrics).toBeDefined()
      expect(typeof metrics.totalTasks).toBe('number')
    })

    it('should clear queue', () => {
      const service = getEdgeComputeService(2)

      service.clearQueue()
      const metrics = service.getPerformanceMetrics()

      expect(metrics.queuedTasks).toBe(0)
    })
  })

  describe('Services Combined Integration', () => {
    it('should initialize all services together', () => {
      const yjsConfig: YjsServiceConfig = {
        docId: 'test-doc',
        roomName: 'test-room',
        enableWebRTC: false,
        enableIndexedDB: false,
      }

      const yjsService = getYjsService(yjsConfig)
      const p2pService = getP2PService()
      const offlineService = getOfflineService()
      const edgeService = getEdgeComputeService(2)

      expect(yjsService).toBeDefined()
      expect(p2pService).toBeDefined()
      expect(offlineService).toBeDefined()
      expect(edgeService).toBeDefined()
    })

    it('should store data in offline service and sync with Yjs', async () => {
      const yjsConfig: YjsServiceConfig = {
        docId: 'test-doc',
        roomName: 'test-room',
        enableWebRTC: false,
        enableIndexedDB: false,
      }

      const yjsService = getYjsService(yjsConfig)
      const offlineService = getOfflineService()

      // Store in offline
      await offlineService.storeText('sync-test', 'content to sync')

      // Simulate sync to Yjs
      const content = await offlineService.getText('sync-test')
      yjsService.updateText('sync-test', content!)

      // Verify Yjs has the data
      const yjsText = yjsService.getText('sync-test')
      expect(yjsText.toString()).toBe('content to sync')
    })

    it('should use edge compute to process Yjs data', async () => {
      const yjsConfig: YjsServiceConfig = {
        docId: 'test-doc',
        roomName: 'test-room',
        enableWebRTC: false,
        enableIndexedDB: false,
      }

      const yjsService = getYjsService(yjsConfig)
      const edgeService = getEdgeComputeService(2)

      // Update Yjs data
      yjsService.updateText('process-test', 'data to process')

      // Process with edge compute
      const task = {
        type: 'process-text',
        data: yjsService.getText('process-test').toString(),
      }

      const result = await edgeService.execute(task)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })
})
