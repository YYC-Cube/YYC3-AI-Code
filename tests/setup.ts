/**
 * @file setup.ts
 * @description 测试设置 - 测试环境配置、Mock 设置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags core,typescript
 */

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi, beforeEach } from 'vitest'
import fakeIndexedDB from 'fake-indexeddb'
import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange'

// 设置完整的 IndexedDB mock
;(globalThis as any).indexedDB = fakeIndexedDB
;(globalThis as any).IDBKeyRange = FDBKeyRange

// Mock idb库以支持openDB函数
vi.mock('idb', () => {
  const mockDB = new Map()
  const mockIndexes = new Map<string, Map<string, any>>()
  
  const mockOpenDB = async (dbName: string, version: number, options: any) => {
    const upgrade = options?.upgrade
    const storeNames: string[] = []
    
    if (upgrade) {
      const mockDBInstance = {
        objectStoreNames: {
          contains: (name: string) => storeNames.includes(name),
          _storeNames: storeNames,
        },
        createObjectStore: (name: string) => {
          storeNames.push(name)
          if (!mockDB.has(name)) {
            mockDB.set(name, new Map())
          }
          const store = {
            name,
            _storeData: mockDB.get(name),
            createIndex: (indexName: string, keyPath: string, options?: any) => {
              if (!mockIndexes.has(name)) {
                mockIndexes.set(name, new Map())
              }
              const storeIndexes = mockIndexes.get(name)!
              storeIndexes.set(indexName, { keyPath, options })
            },
            deleteIndex: (indexName: string) => {
              if (mockIndexes.has(name)) {
                const storeIndexes = mockIndexes.get(name)!
                storeIndexes.delete(indexName)
              }
            },
          }
          return store
        },
        deleteObjectStore: (name: string) => {
          const index = storeNames.indexOf(name)
          if (index > -1) {
            storeNames.splice(index, 1)
          }
          mockDB.delete(name)
          mockIndexes.delete(name)
        },
      }
      upgrade(mockDBInstance)
    }
    
    return {
      transaction: (storeNames: string | string[], mode: string) => {
        const stores = Array.isArray(storeNames) ? storeNames : [storeNames]
        
        return {
          objectStore: (storeName: string) => {
            const storeData = mockDB.get(storeName) || new Map()
            return {
              get: (key: string) => {
                const result = storeData.get(key) || null
                return Promise.resolve(result)
              },
              put: async (value: any, key?: string) => {
                const actualKey = key || value.id
                storeData.set(actualKey, value)
                return actualKey
              },
              add: async (value: any, key?: string) => {
                const actualKey = key || value.id
                storeData.set(actualKey, value)
                return actualKey
              },
              delete: async (key: string) => {
                storeData.delete(key)
              },
              getAll: async () => {
                return Array.from(storeData.values())
              },
              clear: async () => {
                storeData.clear()
              },
              count: async () => {
                return storeData.size
              },
              index: (indexName: string) => {
                return {
                  getAll: async () => {
                    return Array.from(storeData.values())
                  },
                  getAllKeys: async () => {
                    return Array.from(storeData.keys())
                  },
                  get: async (key: any) => {
                    return Array.from(storeData.values()).find((v: any) => {
                      const index = mockIndexes.get(storeName)?.get(indexName)
                      if (!index) return false
                      return v[index.keyPath] === key
                    }) || null
                  },
                  count: async () => {
                    return storeData.size
                  }
                }
              },
              getAllKeys: async () => {
                return Array.from(storeData.keys())
              },
              openCursor: async (query?: any, direction?: string) => {
                const entries: [string, any][] = Array.from(storeData.entries())
                let index = 0
                
                return {
                  next: async () => {
                    if (index >= entries.length) {
                      return { done: true }
                    }
                    const [key, value] = entries[index++]
                    return {
                      done: false,
                      value: {
                        key,
                        value,
                        continue: async () => {},
                        advance: async (count: number) => {
                          index += count
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          complete: Promise.resolve(),
          done: new Promise(resolve => setTimeout(resolve, 0))
        }
      },
      get: async (storeName: string, key: string) => {
        const storeData = mockDB.get(storeName) || new Map()
        return storeData.get(key) || null
      },
      put: async (storeName: string, value: any, key?: string) => {
        if (!mockDB.has(storeName)) {
          mockDB.set(storeName, new Map())
        }
        const storeData = mockDB.get(storeName)
        const actualKey = key || value.id
        storeData.set(actualKey, value)
        return actualKey
      },
      delete: async (storeName: string, key: string) => {
        const storeData = mockDB.get(storeName)
        if (storeData) {
          storeData.delete(key)
        }
      },
      getAll: async (storeName: string) => {
        const storeData = mockDB.get(storeName) || new Map()
        return Array.from(storeData.values())
      },
      getAllFromIndex: async (storeName: string, indexName: string, query?: any) => {
        const storeData = mockDB.get(storeName) || new Map()
        return Array.from(storeData.values())
      },
      getFromIndex: async (storeName: string, indexName: string, query?: any) => {
        const storeData = mockDB.get(storeName) || new Map()
        return Array.from(storeData.values())[0] || null
      },
      close: () => {},
    }
  }
  
  return {
    openDB: mockOpenDB,
    deleteDB: async (dbName: string) => {
      mockDB.clear()
      mockIndexes.clear()
      return Promise.resolve()
    }
  }
})

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.clearAllMocks()
})

// Mock react-router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'test' }),
  }
})

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: () => null,
}))

// Mock WebRTC API
vi.stubGlobal('RTCPeerConnection', class MockRTCPeerConnection {
  constructor(iceServers: any) {
    this.iceServers = iceServers
    this.remoteDescription = null
    this.localDescription = null
    this.signalingState = 'stable'
    this.iceConnectionState = 'new'
    this.connectionState = 'new'
  }

  createDataChannel(label: string, options?: any) {
    return new (globalThis as any).RTCDataChannel()
  }

  async createOffer() {
    return { sdp: 'mock-sdp', type: 'offer' }
  }

  async createAnswer() {
    return { sdp: 'mock-sdp', type: 'answer' }
  }

  async setLocalDescription(description: any) {
    this.localDescription = description
  }

  async setRemoteDescription(description: any) {
    this.remoteDescription = description
  }

  async addIceCandidate(candidate: any) {}

  close() {
    this.connectionState = 'closed'
  }

  addEventListener(type: string, listener: any) {}
  removeEventListener(type: string, listener: any) {}

  onicecandidate: any = null
  onsignalingstatechange: any = null
  onconnectionstatechange: any = null

  iceServers: any
  localDescription: any
  remoteDescription: any
  signalingState: string
  iceConnectionState: string
  connectionState: string
})

vi.stubGlobal('RTCDataChannel', class MockRTCDataChannel {
  constructor() {
    this.readyState = 'open'
    this.bufferedAmount = 0
  }

  send(data: any) {}
  close() {
    this.readyState = 'closed'
  }

  addEventListener(type: string, listener: any) {}
  removeEventListener(type: string, listener: any) {}

  onopen: any = null
  onmessage: any = null
  onclose: any = null
  onerror: any = null

  readyState: 'connecting' | 'open' | 'closing' | 'closed'
  bufferedAmount: number
})

// Mock WebGPU (navigator.gpu)
vi.stubGlobal('gpu', {
  requestAdapter: vi.fn(async () => ({
    requestDevice: vi.fn(async () => ({
      queue: {
        writeBuffer: vi.fn(),
        submit: vi.fn(),
      },
      createBuffer: vi.fn(),
      createBindGroupLayout: vi.fn(),
      createPipelineLayout: vi.fn(),
      createShaderModule: vi.fn(),
      createComputePipeline: vi.fn(),
      createCommandEncoder: vi.fn(),
      destroy: vi.fn(),
    })),
    features: {
      timestampQuery: true,
    },
    limits: {
      maxBufferSize: 256 * 1024 * 1024,
      maxComputeWorkgroupStorageSize: 16384,
    },
  })),
})

// Mock Web Audio API
vi.stubGlobal('AudioContext', vi.fn(() => ({
  createAnalyser: vi.fn(() => ({
    frequencyBinCount: 1024,
    getByteFrequencyData: vi.fn(),
  })),
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1 },
  })),
})) as any)

// Mock ResizeObserver
;(globalThis as any).ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
;(globalThis as any).IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})
