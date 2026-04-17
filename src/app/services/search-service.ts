/**
 * @file search-service.ts
 * @description Search Worker facade — async file content search via Web Worker
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-04-17
 * @status stable
 * @license MIT
 */

import { createLogger } from '../utils/logger'
import type { SearchResponse } from '../workers/search-worker'

const log = createLogger('SearchService')

let workerInstance: Worker | null = null
let pendingResolve: ((response: SearchResponse) => void) | null = null
let pendingReject: ((error: Error) => void) | null = null

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('../workers/search-worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerInstance.onmessage = (e: MessageEvent<SearchResponse>) => {
      if (pendingResolve) {
        pendingResolve(e.data)
        pendingResolve = null
        pendingReject = null
      }
    }
    workerInstance.onerror = (e: ErrorEvent) => {
      if (pendingReject) {
        pendingReject(new Error(e.message))
        pendingResolve = null
        pendingReject = null
      }
    }
    log.info('Search Worker initialized')
  }
  return workerInstance
}

function terminateWorker(): void {
  if (workerInstance) {
    workerInstance.terminate()
    workerInstance = null
    pendingResolve = null
    pendingReject = null
    log.info('Search Worker terminated')
  }
}

export const SearchWorker = {
  async search(
    query: string,
    files: Record<string, string>,
    maxResults = 50,
  ): Promise<SearchResponse> {
    if (!query.trim()) {
      return { results: [], totalMatches: 0, truncated: false }
    }

    const worker = getWorker()

    return new Promise<SearchResponse>((resolve, reject) => {
      pendingResolve = resolve
      pendingReject = reject

      const timeout = setTimeout(() => {
        if (pendingReject) {
          pendingReject(new Error('Search timed out'))
          pendingResolve = null
          pendingReject = null
        }
      }, 10000)

      const originalResolve = pendingResolve
      pendingResolve = (response: SearchResponse) => {
        clearTimeout(timeout)
        originalResolve(response)
      }

      const originalReject = pendingReject
      pendingReject = (error: Error) => {
        clearTimeout(timeout)
        originalReject(error)
      }

      worker.postMessage({ query, files, maxResults })
    })
  },

  terminate: terminateWorker,
}
