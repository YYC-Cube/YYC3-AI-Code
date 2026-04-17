/**
 * @file DiffViewer.tsx
 * @description Unified diff viewer powered by DiffWorker — color-coded hunks with line numbers
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags diff, viewer, version-control, worker
 */

import { useState, useEffect } from 'react'
import { X, Loader2, GitCompare, Plus, Minus } from 'lucide-react'
import { DiffWorker } from '../../services/worker-service'
import type { DiffResult } from '../../services/worker-service'
import { useFileTreeStore } from '../../stores/file-tree-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { ScrollArea } from '../ui/scroll-area'

export function DiffViewer() {
  const { diff, closeDiff } = useFileTreeStore()
  const { isLG } = useLiquidGlass()
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!diff.enabled) {
      setDiffResult(null)
      return
    }
    setLoading(true)
    DiffWorker.diff(diff.leftContent, diff.rightContent).then(result => {
      setDiffResult(result)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [diff.enabled, diff.leftContent, diff.rightContent])

  if (!diff.enabled) {return null}

  const fileName = diff.leftPath?.split('/').pop() || 'unknown'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`h-8 flex items-center justify-between px-3 border-b shrink-0 ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
      }`} style={{ background: isLG ? 'rgba(10,15,10,0.4)' : 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-2">
          <GitCompare className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400/50' : 'text-white/30'}`} />
          <span className="text-[11px] text-white/60">{fileName}</span>
          {diffResult && (
            <div className="flex items-center gap-2 ml-2">
              <span className="flex items-center gap-0.5 text-[9px] text-emerald-400/60">
                <Plus className="w-2.5 h-2.5" />{diffResult.linesAdded}
              </span>
              <span className="flex items-center gap-0.5 text-[9px] text-red-400/60">
                <Minus className="w-2.5 h-2.5" />{diffResult.linesRemoved}
              </span>
              <span className="text-[9px] text-white/20">
                {diffResult.linesUnchanged} unchanged
              </span>
            </div>
          )}
        </div>
        <button
          onClick={closeDiff}
          className="p-1 rounded hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Diff Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className={`w-5 h-5 animate-spin ${isLG ? 'text-emerald-400/30' : 'text-white/20'}`} />
          <span className="ml-2 text-[11px] text-white/20">Computing diff...</span>
        </div>
      ) : diffResult ? (
        <ScrollArea className="flex-1">
          <div className="font-mono text-[12px]" style={{ lineHeight: '20px' }}>
            {diffResult.hunks.map((hunk, i) => {
              const bgClass =
                hunk.type === 'add'
                  ? 'bg-emerald-500/[0.08]'
                  : hunk.type === 'remove'
                    ? 'bg-red-500/[0.08]'
                    : ''
              const textClass =
                hunk.type === 'add'
                  ? 'text-emerald-300/70'
                  : hunk.type === 'remove'
                    ? 'text-red-300/70'
                    : 'text-white/40'
              const prefix =
                hunk.type === 'add' ? '+' : hunk.type === 'remove' ? '-' : ' '
              const gutterColor =
                hunk.type === 'add'
                  ? isLG ? 'text-emerald-400/30' : 'text-green-400/30'
                  : hunk.type === 'remove'
                    ? 'text-red-400/30'
                    : 'text-white/12'

              return (
                <div key={i} className={`flex ${bgClass} hover:brightness-110`}>
                  <span className={`w-10 shrink-0 text-right pr-2 select-none ${gutterColor}`}>
                    {hunk.lineNumber}
                  </span>
                  <span className={`w-4 shrink-0 text-center select-none ${
                    hunk.type === 'add' ? 'text-emerald-400/50' : hunk.type === 'remove' ? 'text-red-400/50' : 'text-white/10'
                  }`}>
                    {prefix}
                  </span>
                  <span className={`flex-1 whitespace-pre ${textClass}`}>
                    {hunk.content || '\u00A0'}
                  </span>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[11px] text-white/20">No differences found</span>
        </div>
      )}
    </div>
  )
}
