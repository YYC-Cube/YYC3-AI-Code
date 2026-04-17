/**
 * @file paging-worker.ts
 * @description F-23 Worker Layer — Large result-set pagination with cursor-based navigation
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags worker, paging, pagination, cursor, large-dataset
 */

// ============================================
// Types
// ============================================

export interface PageRequest {
  queryId: string
  page: number
  pageSize: number
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  filter?: string
}

export interface PageResult<T = Record<string, unknown>> {
  queryId: string
  page: number
  pageSize: number
  totalRows: number
  totalPages: number
  rows: T[]
  hasNextPage: boolean
  hasPreviousPage: boolean
  executionTimeMs: number
}

export interface DatasetMeta {
  queryId: string
  totalRows: number
  columns: string[]
  storedAt: number
}

// ============================================
// In-memory dataset store (simulates large dataset paging)
// ============================================

const datasets: Map<string, {
  rows: Record<string, unknown>[]
  columns: string[]
  storedAt: number
}> = new Map()

// ============================================
// Public API (exposed via Comlink or direct call)
// ============================================

/**
 * Store a dataset for subsequent pagination
 */
export function storeDataset(queryId: string, rows: Record<string, unknown>[], columns: string[]): DatasetMeta {
  datasets.set(queryId, { rows, columns, storedAt: Date.now() })
  return {
    queryId,
    totalRows: rows.length,
    columns,
    storedAt: Date.now(),
  }
}

/**
 * Retrieve a page from a stored dataset
 */
export function getPage(request: PageRequest): PageResult {
  const start = performance.now()
  const dataset = datasets.get(request.queryId)

  if (!dataset) {
    return {
      queryId: request.queryId,
      page: request.page,
      pageSize: request.pageSize,
      totalRows: 0,
      totalPages: 0,
      rows: [],
      hasNextPage: false,
      hasPreviousPage: false,
      executionTimeMs: performance.now() - start,
    }
  }

  let rows = [...dataset.rows]

  // Apply filter (simple text search across all string values)
  if (request.filter) {
    const filterLower = request.filter.toLowerCase()
    rows = rows.filter(row =>
      Object.values(row).some(v =>
        String(v).toLowerCase().includes(filterLower)
      )
    )
  }

  // Apply sort
  if (request.sortColumn) {
    const col = request.sortColumn
    const dir = request.sortDirection === 'desc' ? -1 : 1
    rows.sort((a, b) => {
      const va = a[col]
      const vb = b[col]
      if (va === vb) {return 0}
      if (va == null) {return 1}
      if (vb == null) {return -1}
      if (typeof va === 'number' && typeof vb === 'number') {return (va - vb) * dir}
      return String(va).localeCompare(String(vb)) * dir
    })
  }

  const totalRows = rows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / request.pageSize))
  const page = Math.max(1, Math.min(request.page, totalPages))
  const offset = (page - 1) * request.pageSize
  const pageRows = rows.slice(offset, offset + request.pageSize)

  return {
    queryId: request.queryId,
    page,
    pageSize: request.pageSize,
    totalRows,
    totalPages,
    rows: pageRows,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    executionTimeMs: performance.now() - start,
  }
}

/**
 * Remove a stored dataset (free memory)
 */
export function releaseDataset(queryId: string): boolean {
  return datasets.delete(queryId)
}

/**
 * List all stored datasets and their metadata
 */
export function listDatasets(): DatasetMeta[] {
  return Array.from(datasets.entries()).map(([queryId, ds]) => ({
    queryId,
    totalRows: ds.rows.length,
    columns: ds.columns,
    storedAt: ds.storedAt,
  }))
}

/**
 * Clear all stored datasets
 */
export function clearAllDatasets(): number {
  const count = datasets.size
  datasets.clear()
  return count
}

/**
 * Get memory estimate for stored datasets (bytes)
 */
export function getMemoryEstimate(): { totalDatasets: number; estimatedBytes: number } {
  let estimatedBytes = 0
  for (const [, ds] of datasets) {
    // Rough estimate: JSON.stringify length * 2 bytes per char
    estimatedBytes += JSON.stringify(ds.rows).length * 2
  }
  return { totalDatasets: datasets.size, estimatedBytes }
}
