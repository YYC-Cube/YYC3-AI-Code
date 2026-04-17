/**
 * @file diff-worker.ts
 * @description F-23 Worker Layer — Text diff computation (LCS-based) for file version control
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags worker, diff, patch, version-control, lcs
 */

// ============================================
// Types
// ============================================

export interface DiffHunk {
  type: 'add' | 'remove' | 'context'
  lineNumber: number
  content: string
}

export interface DiffResult {
  hunks: DiffHunk[]
  linesAdded: number
  linesRemoved: number
  linesUnchanged: number
  /** Unified diff string for display */
  unified: string
}

export interface PatchOp {
  type: 'insert' | 'delete' | 'replace'
  startLine: number
  endLine?: number
  content?: string
}

export interface PatchResult {
  ops: PatchOp[]
  canApply: boolean
}

// ============================================
// Diff Algorithm (Myers-style simplified LCS)
// ============================================

function lcsLines(a: string[], b: string[]): boolean[][] {
  const m = a.length
  const n = b.length
  // Optimization: use 1D rolling array for space efficiency
  const prev = new Array(n + 1).fill(0)
  const curr = new Array(n + 1).fill(0)

  // Build LCS length table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find LCS membership
  const inLCS_a = new Array(m).fill(false)
  const inLCS_b = new Array(n).fill(false)
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      inLCS_a[i - 1] = true
      inLCS_b[j - 1] = true
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return [inLCS_a, inLCS_b]
}

// ============================================
// Public API (exposed via Comlink or direct call)
// ============================================

/**
 * Compute diff between two text strings
 */
export function diff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')

  const [inLCS_old, inLCS_new] = lcsLines(oldLines, newLines)

  const hunks: DiffHunk[] = []
  let linesAdded = 0
  let linesRemoved = 0
  let linesUnchanged = 0

  let oi = 0, ni = 0
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && inLCS_old[oi] && ni < newLines.length && inLCS_new[ni]) {
      // Context (unchanged)
      hunks.push({ type: 'context', lineNumber: ni + 1, content: newLines[ni] })
      linesUnchanged++
      oi++
      ni++
    } else {
      // Removed lines from old
      while (oi < oldLines.length && !inLCS_old[oi]) {
        hunks.push({ type: 'remove', lineNumber: oi + 1, content: oldLines[oi] })
        linesRemoved++
        oi++
      }
      // Added lines in new
      while (ni < newLines.length && !inLCS_new[ni]) {
        hunks.push({ type: 'add', lineNumber: ni + 1, content: newLines[ni] })
        linesAdded++
        ni++
      }
    }
  }

  // Generate unified diff string
  const unified = hunks
    .map(h => {
      switch (h.type) {
        case 'add': return `+${h.content}`
        case 'remove': return `-${h.content}`
        case 'context': return ` ${h.content}`
      }
    })
    .join('\n')

  return { hunks, linesAdded, linesRemoved, linesUnchanged, unified }
}

/**
 * Generate patch operations from old text to new text
 */
export function generatePatch(oldText: string, newText: string): PatchResult {
  const result = diff(oldText, newText)
  const ops: PatchOp[] = []

  let i = 0
  while (i < result.hunks.length) {
    const hunk = result.hunks[i]

    if (hunk.type === 'remove') {
      // Check if followed by 'add' — that's a replace
      const addHunks: DiffHunk[] = []
      const j = i + 1
      // Collect all consecutive removes
      const removeStart = hunk.lineNumber
      let removeEnd = removeStart
      let k = i
      while (k < result.hunks.length && result.hunks[k].type === 'remove') {
        removeEnd = result.hunks[k].lineNumber
        k++
      }
      // Check for subsequent adds
      while (k < result.hunks.length && result.hunks[k].type === 'add') {
        addHunks.push(result.hunks[k])
        k++
      }

      if (addHunks.length > 0) {
        ops.push({
          type: 'replace',
          startLine: removeStart,
          endLine: removeEnd,
          content: addHunks.map(h => h.content).join('\n'),
        })
      } else {
        ops.push({
          type: 'delete',
          startLine: removeStart,
          endLine: removeEnd,
        })
      }
      i = k
    } else if (hunk.type === 'add') {
      ops.push({
        type: 'insert',
        startLine: hunk.lineNumber,
        content: hunk.content,
      })
      i++
    } else {
      i++
    }
  }

  return { ops, canApply: true }
}

/**
 * Apply a patch to reconstruct text
 */
export function applyPatch(oldText: string, patch: PatchResult): string {
  if (!patch.canApply) {return oldText}

  const lines = oldText.split('\n')
  let offset = 0

  for (const op of patch.ops) {
    const adjustedStart = op.startLine - 1 + offset

    switch (op.type) {
      case 'insert': {
        const newLines = op.content?.split('\n') || []
        lines.splice(adjustedStart, 0, ...newLines)
        offset += newLines.length
        break
      }
      case 'delete': {
        const count = (op.endLine || op.startLine) - op.startLine + 1
        lines.splice(adjustedStart, count)
        offset -= count
        break
      }
      case 'replace': {
        const count = (op.endLine || op.startLine) - op.startLine + 1
        const newLines = op.content?.split('\n') || []
        lines.splice(adjustedStart, count, ...newLines)
        offset += newLines.length - count
        break
      }
    }
  }

  return lines.join('\n')
}
