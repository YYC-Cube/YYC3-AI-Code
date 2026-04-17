/**
 * @file file-service.ts
 * @description Unified file service layer — single source of truth for file content access
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @status stable
 *
 * Resolves the scattered file content access pattern:
 *   BEFORE: fileContents[filePath]?.content || MOCK_FILE_CONTENTS[filePath] || '// Empty'
 *   AFTER:  FileService.getContent(filePath)
 */

import { MOCK_FILE_CONTENTS } from '../utils/file-contents'
import { useAppStore } from '../stores/app-store'
import { createLogger } from '../utils/logger'

const log = createLogger('FileService')

// ============================================
// Types
// ============================================

export interface FileContentResult {
  content: string
  source: 'store' | 'mock' | 'default'
  language: string
  isModified: boolean
  lastUpdated?: number
}

export interface FileServiceConfig {
  enableMockFallback: boolean
  cacheEnabled: boolean
  cacheTTL: number // ms
}

// ============================================
// Default config
// ============================================

const DEFAULT_CONFIG: FileServiceConfig = {
  enableMockFallback: true,
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
}

// ============================================
// In-memory cache
// ============================================

interface CacheEntry {
  content: string
  timestamp: number
}

const contentCache = new Map<string, CacheEntry>()

// ============================================
// Service implementation
// ============================================

class FileServiceImpl {
  private config: FileServiceConfig

  constructor(config?: Partial<FileServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  updateConfig(updates: Partial<FileServiceConfig>) {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get file content with unified fallback strategy:
   * 1. Check app-store (user edits)
   * 2. Check mock data (initial content)
   * 3. Return default empty content
   */
  getContent(filePath: string): FileContentResult {
    const now = Date.now()

    try {
      const store = useAppStore.getState()
      const storedContent = store.fileContents[filePath]

      if (storedContent !== undefined && storedContent !== null) {
        log.debug('Content from store', { path: filePath, modified: storedContent.isModified, hasContent: 'content' in storedContent })
        return {
          content: storedContent.content ?? '',  // 确保空字符串返回''而不是undefined
          source: 'store',
          language: storedContent.language,
          isModified: storedContent.isModified,
          lastUpdated: now,
        }
      }
    } catch (e) {
      log.warn('Failed to access app-store', { error: e })
    }

    if (this.config.enableMockFallback && MOCK_FILE_CONTENTS[filePath]) {
      log.debug('Content from mock', { path: filePath })
      return {
        content: MOCK_FILE_CONTENTS[filePath],
        source: 'mock',
        language: this.detectLanguage(filePath),
        isModified: false,
        lastUpdated: now,
      }
    }

    log.debug('Using default empty content', { path: filePath })
    return {
      content: '// Empty file',
      source: 'default',
      language: this.detectLanguage(filePath),
      isModified: false,
      lastUpdated: now,
    }
  }

  /**
   * Update file content through the unified service
   */
  setContent(filePath: string, content: string): void {
    try {
      useAppStore.getState().updateFileContent(filePath, content)
      this.invalidateCache(filePath)
      log.info('File content updated', { path: filePath, length: content.length })
    } catch (e) {
      log.error('Failed to update file content', { path: filePath, error: e })
      throw new Error(`Failed to update file ${filePath}: ${e}`)
    }
  }

  /**
   * Get language from file extension
   */
  detectLanguage(filePath: string): string {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) return 'typescript'
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) return 'javascript'
    if (filePath.endsWith('.css') || filePath.endsWith('.scss')) return 'css'
    if (filePath.endsWith('.json')) return 'json'
    if (filePath.endsWith('.md')) return 'markdown'
    if (filePath.endsWith('.html')) return 'html'
    if (filePath.endsWith('.vue')) return 'vue'
    return 'text'
  }

  /**
   * Clear cache for specific file or all files
   */
  invalidateCache(filePath?: string): void {
    if (filePath) {
      contentCache.delete(filePath)
    } else {
      contentCache.clear()
    }
  }

  /**
   * Get cached content if still valid
   */
  getCachedContent(filePath: string): string | null {
    if (!this.config.cacheEnabled) return null

    const entry = contentCache.get(filePath)
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    if (age > this.config.cacheTTL) {
      contentCache.delete(filePath)
      return null
    }

    return entry.content
  }

  /**
   * Set content in cache
   */
  setCachedContent(filePath: string, content: string): void {
    if (!this.config.cacheEnabled) return

    contentCache.set(filePath, {
      content,
      timestamp: Date.now(),
    })
  }

  /**
   * Check if file exists in any source
   */
  fileExists(filePath: string): boolean {
    const store = useAppStore.getState()
    return !!(store.fileContents[filePath] || MOCK_FILE_CONTENTS[filePath])
  }

  /**
   * Get all available file paths
   */
  getAvailableFiles(): string[] {
    const store = useAppStore.getState()
    const storeFiles = Object.keys(store.fileContents)
    const mockFiles = Object.keys(MOCK_FILE_CONTENTS)
    return [...new Set([...storeFiles, ...mockFiles])]
  }

  /**
   * Get file statistics
   */
  getFileStats(): {
    totalFiles: number
    storeFiles: number
    mockFiles: number
    modifiedFiles: number
    cacheSize: number
  } {
    const store = useAppStore.getState()
    const storeFiles = Object.keys(store.fileContents)
    const mockFiles = Object.keys(MOCK_FILE_CONTENTS)
    const modifiedFiles = storeFiles.filter(f => store.fileContents[f]?.isModified)

    return {
      totalFiles: new Set([...storeFiles, ...mockFiles]).size,
      storeFiles: storeFiles.length,
      mockFiles: mockFiles.length,
      modifiedFiles: modifiedFiles.length,
      cacheSize: contentCache.size,
    }
  }
}

// ============================================
// Singleton export
// ============================================

export const FileService = new FileServiceImpl()

export default FileService
