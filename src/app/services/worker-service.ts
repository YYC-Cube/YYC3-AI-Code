/**
 * @file worker-service.ts
 * @description F-23 Worker Layer — Comlink-style service facade for diff, paging, and backup workers
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags worker, comlink, facade, diff, paging, backup
 */

import { createLogger } from '../utils/logger'
import {
  diff as diffImpl,
  generatePatch as generatePatchImpl,
  applyPatch as applyPatchImpl,
} from '../workers/diff-worker'
import type { DiffResult, PatchResult } from '../workers/diff-worker'
import {
  storeDataset as storeDatasetImpl,
  getPage as getPageImpl,
  releaseDataset as releaseDatasetImpl,
  listDatasets as listDatasetsImpl,
  clearAllDatasets as clearAllDatasetsImpl,
  getMemoryEstimate as getMemoryEstimateImpl,
} from '../workers/paging-worker'
import type { PageRequest, PageResult, DatasetMeta } from '../workers/paging-worker'
import {
  runBackup as runBackupImpl,
  runRestore as runRestoreImpl,
} from '../workers/backup-worker'
import type { BackupParams, BackupProgress, RestoreParams, RestoreProgress } from '../workers/backup-worker'

const log = createLogger('WorkerService')

// ============================================
// Worker Service Facade
// ============================================

/**
 * Wraps CPU-heavy operations in an async facade.
 *
 * **Architecture note**: In a real Tauri/Electron app, these would be
 * actual Web Workers communicating via Comlink `wrap()/expose()`. In the
 * Figma Make sandbox, Web Workers are not available, so we run the logic
 * on the main thread behind `Promise.resolve()` / `setTimeout()` to keep
 * the API shape identical. When migrating to production, replace the
 * `runOnMainThread` calls with `Comlink.wrap(new Worker(...))`.
 */

/** Execute fn asynchronously (yields to event loop) */
function runAsync<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn())
      } catch (e) {
        reject(e)
      }
    }, 0)
  })
}

// ============================================
// Diff Worker API
// ============================================

export const DiffWorker = {
  /**
   * Compute diff between two text strings
   */
  async diff(oldText: string, newText: string): Promise<DiffResult> {
    log.debug('DiffWorker.diff()', { oldLen: oldText.length, newLen: newText.length })
    return runAsync(() => diffImpl(oldText, newText))
  },

  /**
   * Generate patch operations from old → new
   */
  async generatePatch(oldText: string, newText: string): Promise<PatchResult> {
    log.debug('DiffWorker.generatePatch()')
    return runAsync(() => generatePatchImpl(oldText, newText))
  },

  /**
   * Apply patch to reconstruct text
   */
  async applyPatch(oldText: string, patch: PatchResult): Promise<string> {
    log.debug('DiffWorker.applyPatch()')
    return runAsync(() => applyPatchImpl(oldText, patch))
  },
}

// ============================================
// Paging Worker API
// ============================================

export const PagingWorker = {
  /**
   * Store a dataset for subsequent pagination
   */
  async storeDataset(queryId: string, rows: Record<string, unknown>[], columns: string[]): Promise<DatasetMeta> {
    log.debug('PagingWorker.storeDataset()', { queryId, rowCount: rows.length })
    return runAsync(() => storeDatasetImpl(queryId, rows, columns))
  },

  /**
   * Retrieve a page from a stored dataset
   */
  async getPage(request: PageRequest): Promise<PageResult> {
    log.debug('PagingWorker.getPage()', { queryId: request.queryId, page: request.page })
    return runAsync(() => getPageImpl(request))
  },

  /**
   * Release a stored dataset
   */
  async releaseDataset(queryId: string): Promise<boolean> {
    log.debug('PagingWorker.releaseDataset()', { queryId })
    return runAsync(() => releaseDatasetImpl(queryId))
  },

  /**
   * List all stored datasets
   */
  async listDatasets(): Promise<DatasetMeta[]> {
    return runAsync(() => listDatasetsImpl())
  },

  /**
   * Clear all stored datasets
   */
  async clearAll(): Promise<number> {
    return runAsync(() => clearAllDatasetsImpl())
  },

  /**
   * Get memory estimate
   */
  async getMemoryEstimate(): Promise<{ totalDatasets: number; estimatedBytes: number }> {
    return runAsync(() => getMemoryEstimateImpl())
  },
}

// ============================================
// Backup Worker API
// ============================================

export const BackupWorker = {
  /**
   * Run database backup with progress callback
   */
  async runBackup(params: BackupParams, onProgress: (p: BackupProgress) => void): Promise<BackupProgress> {
    log.info('BackupWorker.runBackup()', { connectionId: params.connectionId, encrypt: params.encrypt })
    return runBackupImpl(params, onProgress)
  },

  /**
   * Run database restore with progress callback
   */
  async runRestore(params: RestoreParams, onProgress: (p: RestoreProgress) => void): Promise<RestoreProgress> {
    log.info('BackupWorker.runRestore()', { connectionId: params.connectionId })
    return runRestoreImpl(params, onProgress)
  },
}

// ============================================
// Re-export types for convenience
// ============================================

export type {
  DiffResult,
  DiffHunk,
  PatchResult,
  PatchOp,
} from '../workers/diff-worker'

export type {
  PageRequest,
  PageResult,
  DatasetMeta,
} from '../workers/paging-worker'

export type {
  BackupParams,
  BackupProgress,
  RestoreParams,
  RestoreProgress,
} from '../workers/backup-worker'
