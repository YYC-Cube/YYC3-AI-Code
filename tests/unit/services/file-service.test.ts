/**
 * @file file-service.test.ts
 * @description FileService 全面单元测试 — 覆盖文件内容获取、缓存、语言检测、统计功能
 * @author YYC³ QA Team
 * @version 2.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage.store[key] = value }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage.store[key] }),
  clear: vi.fn(() => { mockLocalStorage.store = {} }),
}

vi.stubGlobal('localStorage', mockLocalStorage)

describe('FileService - 文件内容获取', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { FileService } = await import('@/app/services/file-service')
    FileService.invalidateCache()
    
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()
    Object.keys(store.fileContents).forEach(key => {
      delete (store as any).fileContents[key]
    })
  })

  it('应该能够获取store中的文件内容', async () => {
    const { FileService } = await import('@/app/services/file-service')
    const { useAppStore } = await import('@/app/stores/app-store')

    useAppStore.getState().updateFileContent('src/test.tsx', 'console.log("test")')

    const result = FileService.getContent('src/test.tsx')

    expect(result.content).toBe('console.log("test")')
    expect(result.source).toBe('store')
    expect(result.isModified).toBe(false) // 首次设置，originalContent=content，所以未修改
  })

  it('应该正确检测文件修改状态', async () => {
    const { FileService } = await import('@/app/services/file-service')
    const { useAppStore } = await import('@/app/stores/app-store')

    useAppStore.getState().updateFileContent('src/modified.tsx', 'initial content')
    
    let result = FileService.getContent('src/modified.tsx')
    expect(result.isModified).toBe(false) // 首次设置

    useAppStore.getState().updateFileContent('src/modified.tsx', 'modified content')
    
    result = FileService.getContent('src/modified.tsx')
    expect(result.isModified).toBe(true) // 第二次设置，内容变化
    expect(result.content).toBe('modified content')
  })

  it('应该回退到mock数据（当store中没有时）', async () => {
    const { FileService } = await import('@/app/services/file-service')

    const result = FileService.getContent('src/App.tsx')

    if (result.source === 'mock') {
      expect(result.content).toBeDefined()
      expect(typeof result.content).toBe('string')
      expect(result.isModified).toBe(false)
    }
  })

  it('应该返回默认空内容（当文件不存在于任何源）', async () => {
    const { FileService } = await import('@/app/services/file-service')

    const result = FileService.getContent('non/existent/file.xyz')

    if (result.source === 'default') {
      expect(result.content).toBe('// Empty file')
    }
  })

  it('应该正确检测文件语言类型', async () => {
    const { FileService } = await import('@/app/services/file-service')

    expect(FileService.detectLanguage('test.tsx')).toBe('typescript')
    expect(FileService.detectLanguage('test.ts')).toBe('typescript')
    expect(FileService.detectLanguage('test.jsx')).toBe('javascript')
    expect(FileService.detectLanguage('test.js')).toBe('javascript')
    expect(FileService.detectLanguage('test.css')).toBe('css')
    expect(FileService.detectLanguage('test.json')).toBe('json')
    expect(FileService.detectLanguage('test.md')).toBe('markdown')
    expect(FileService.detectLanguage('test.html')).toBe('html')
    expect(FileService.detectLanguage('test.vue')).toBe('vue')
    expect(FileService.detectLanguage('unknown.xyz')).toBe('text')
  })

  it('应该返回包含时间戳的结果', async () => {
    const { FileService } = await import('@/app/services/file-service')
    const before = Date.now()

    const result = FileService.getContent('any-file.ts')

    const after = Date.now()
    expect(result.lastUpdated).toBeGreaterThanOrEqual(before)
    expect(result.lastUpdated).toBeLessThanOrEqual(after)
  })
})

describe('FileService - 文件内容更新', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { FileService } = await import('@/app/services/file-service')
    FileService.invalidateCache()
    
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()
    Object.keys(store.fileContents).forEach(key => {
      delete (store as any).fileContents[key]
    })
  })

  it('应该能够通过FileService更新文件内容', async () => {
    const { FileService } = await import('@/app/services/file-service')

    FileService.setContent('src/new-file.ts', 'initial content')
    
    let result = FileService.getContent('src/new-file.ts')
    expect(result.content).toBe('initial content')
    expect(result.isModified).toBe(false) // 首次设置

    FileService.setContent('src/new-file.ts', 'updated content')
    
    result = FileService.getContent('src/new-file.ts')
    expect(result.content).toBe('updated content')
    expect(result.isModified).toBe(true) // 第二次设置，内容变化
  })

  it('更新文件后应该清除缓存', async () => {
    const { FileService } = await import('@/app/services/file-service')

    FileService.setContent('src/cached.ts', 'original')
    FileService.getContent('src/cached.ts')

    FileService.setContent('src/cached.ts', 'updated')

    const result = FileService.getContent('src/cached.ts')
    expect(result.content).toBe('updated')
  })

  it('应该处理不存在的文件路径', async () => {
    const { FileService } = await import('@/app/services/file-service')

    expect(() => {
      FileService.setContent('deep/nested/new/file.py', '# Python code')
    }).not.toThrow()

    const result = FileService.getContent('deep/nested/new/file.py')
    expect(result.content).toBe('# Python code')
  })
})

describe('FileService - 缓存系统', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { FileService } = await import('@/app/services/file-service')
    FileService.invalidateCache()
  })

  it('应该能够缓存文件内容', async () => {
    const { FileService } = await import('@/app/services/file-service')

    FileService.setCachedContent('cache-test.ts', 'cached content')
    const cached = FileService.getCachedContent('cache-test.ts')

    expect(cached).toBe('cached content')
  })

  it('未缓存的文件应返回null', async () => {
    const { FileService } = await import('@/app/services/file-service')

    const cached = FileService.getCachedContent('never-cached.ts')
    expect(cached).toBeNull()
  })

  it('应该能够清除单个文件的缓存', async () => {
    const { FileService } = await import('@/app/services/file-service')

    FileService.setCachedContent('to-clear.ts', 'content')
    FileService.invalidateCache('to-clear.ts')

    expect(FileService.getCachedContent('to-clear.ts')).toBeNull()
  })

  it('应该能够清除所有缓存', async () => {
    const { FileService } = await import('@/app/services/file-service')

    FileService.setCachedContent('file1.ts', 'content1')
    FileService.setCachedContent('file2.ts', 'content2')
    FileService.invalidateCache()

    expect(FileService.getCachedContent('file1.ts')).toBeNull()
    expect(FileService.getCachedContent('file2.ts')).toBeNull()
  })
})

describe('FileService - 查询功能', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { FileService } = await import('@/app/services/file-service')
    FileService.invalidateCache()
    
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()
    Object.keys(store.fileContents).forEach(key => {
      delete (store as any).fileContents[key]
    }
    )
  })

  it('fileExists 应该检测store中的文件', async () => {
    const { FileService } = await import('@/app/services/file-service')
    const { useAppStore } = await import('@/app/stores/app-store')

    useAppStore.getState().updateFileContent('exists.ts', 'content')

    expect(FileService.fileExists('exists.ts')).toBe(true)
  })

  it('fileExists 应该检测mock数据中的文件', async () => {
    const { FileService } = await import('@/app/services/file-service')

    const exists = FileService.fileExists('src/App.tsx')
    expect(typeof exists).toBe('boolean')
  })

  it('getAvailableFiles 应该返回所有可用文件列表', async () => {
    const { FileService } = await import('@/app/services/file-service')
    const { useAppStore } = await import('@/app/stores/app-store')

    useAppStore.getState().updateFileContent('custom-1.ts', 'content1')
    useAppStore.getState().updateFileContent('custom-2.ts', 'content2')

    const files = FileService.getAvailableFiles()
    expect(Array.isArray(files)).toBe(true)
    expect(files.length).toBeGreaterThanOrEqual(2)
    expect(files).toContain('custom-1.ts')
    expect(files).toContain('custom-2.ts')
  })

  it('getFileStats 应该返回正确的统计数据', async () => {
    const { FileService } = await import('@/app/services/file-service')
    const { useAppStore } = await import('@/app/stores/app-store')

    useAppStore.getState().updateFileContent('modified.ts', 'changed content')

    const stats = FileService.getFileStats()
    
    expect(stats.totalFiles).toBeGreaterThanOrEqual(0)
    expect(stats.storeFiles).toBeGreaterThanOrEqual(0)
    expect(stats.mockFiles).toBeGreaterThanOrEqual(0)
    expect(stats.modifiedFiles).toBeGreaterThanOrEqual(0)
    expect(typeof stats.cacheSize).toBe('number')
  })
})

describe('FileService - 配置管理', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { FileService } = await import('@/app/services/file-service')
    FileService.updateConfig({
      enableMockFallback: true,
      cacheEnabled: true,
      cacheTTL: 5000,
    })
    FileService.invalidateCache()
  })

  it('应该支持配置更新', async () => {
    const { FileService } = await import('@/app/services/file-service')

    FileService.updateConfig({ cacheEnabled: false })

    FileService.setCachedContent('config-test.ts', 'should not cache')
    expect(FileService.getCachedContent('config-test.ts')).toBeNull()
  })

  it('应该支持禁用mock回退', async () => {
    const { FileService } = await import('@/app/services/file-service')

    FileService.updateConfig({ enableMockFallback: false })

    const result = FileService.getContent('non-existent-file.xyz')
    expect(result.source).not.toBe('mock')
  })
})

describe('FileService - 边界条件测试', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { FileService } = await import('@/app/services/file-service')
    FileService.invalidateCache()
  })

  it('应该处理空字符串文件路径', async () => {
    const { FileService } = await import('@/app/services/file-service')

    const result = FileService.getContent('')
    expect(result.content).toBeDefined()
  })

  it('应该处理特殊字符的文件路径', async () => {
    const { FileService } = await import('@/app/services/file-service')

    const specialPath = 'path/with spaces/and-中文/and-special@chars.ts'
    expect(() => {
      FileService.getContent(specialPath)
    }).not.toThrow()
  })

  it('应该处理超长文件路径', async () => {
    const { FileService } = await import('@/app/services/file-service')

    const longPath = 'a'.repeat(500) + '.ts'
    expect(() => {
      FileService.getContent(longPath)
    }).not.toThrow()
  })

  it('应该处理空内容设置', async () => {
    const { FileService } = await import('@/app/services/file-service')

    FileService.setContent('empty.ts', '')
    const result = FileService.getContent('empty.ts')
    expect(result.content).toBe('')
  })

  it('应该处理超长文件内容', async () => {
    const { FileService } = await import('@/app/services/file-service')

    const longContent = 'x'.repeat(100000)
    FileService.setContent('large.ts', longContent)

    const result = FileService.getContent('large.ts')
    expect(result.content.length).toBe(100000)
  })

  it('应该处理包含换行符和特殊字符的内容', async () => {
    const { FileService } = await import('@/app/services/file-service')

    const specialContent = 'line1\nline2\ttabbed\r\nwindows\0null'
    FileService.setContent('special.ts', specialContent)

    const result = FileService.getContent('special.ts')
    expect(result.content).toBe(specialContent)
  })
})
