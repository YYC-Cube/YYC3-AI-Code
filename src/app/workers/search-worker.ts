/**
 * @file search-worker.ts
 * @description Web Worker for async file content search — offloads main thread
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-04-17
 * @status stable
 * @license MIT
 */

export interface SearchRequest {
  query: string
  files: Record<string, string>
  maxResults: number
}

export interface SearchResult {
  path: string
  line: number
  text: string
}

export interface SearchResponse {
  results: SearchResult[]
  totalMatches: number
  truncated: boolean
}

function searchFiles(request: SearchRequest): SearchResponse {
  const { query, files, maxResults = 50 } = request

  if (!query.trim()) {
    return { results: [], totalMatches: 0, truncated: false }
  }

  const lowerQuery = query.toLowerCase()
  const results: SearchResult[] = []
  let totalMatches = 0
  let truncated = false

  const filePaths = Object.keys(files)

  for (let fi = 0; fi < filePaths.length; fi++) {
    if (truncated) { break }

    const path = filePaths[fi]
    const content = files[path]
    if (typeof content !== 'string') { continue }

    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        totalMatches++
        if (results.length < maxResults) {
          results.push({
            path,
            line: i + 1,
            text: lines[i].trim(),
          })
        } else {
          truncated = true
          break
        }
      }
    }
  }

  return { results, totalMatches, truncated }
}

self.onmessage = (e: MessageEvent<SearchRequest>) => {
  const response = searchFiles(e.data)
  self.postMessage(response)
}
