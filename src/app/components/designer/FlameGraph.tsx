/**
 * @file FlameGraph.tsx
 * @description Real-time performance analysis flame graph — SVG rendering,
 * profiling modes, search/zoom, frame detail panel
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 * @status active
 * @license MIT
 * @prefix fg*
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Search, ZoomIn, ZoomOut, RotateCcw, Play, Cpu, HardDrive, MonitorDot,
  X, ChevronRight, Clock, Layers, Activity, BarChart3, Flame,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useLiquidGlass } from '../../utils/liquid-glass'

/* ================================================================
   Types
   ================================================================ */

interface FgFrame {
  id: string
  name: string
  module: string
  selfTime: number
  totalTime: number
  samples: number
  depth: number
  children: FgFrame[]
}

type FgProfileMode = 'cpu' | 'memory' | 'render'

/* ================================================================
   Mock Data — 15+ frames covering full call stack
   ================================================================ */

function fgBuildMockFrames(): FgFrame {
  const root: FgFrame = {
    id: 'fg-root',
    name: 'React.render',
    module: 'react-dom',
    selfTime: 2.1,
    totalTime: 148.6,
    samples: 1420,
    depth: 0,
    children: [
      {
        id: 'fg-idelayout',
        name: 'IDELayout',
        module: 'components/layout',
        selfTime: 3.4,
        totalTime: 138.2,
        samples: 1280,
        depth: 1,
        children: [
          {
            id: 'fg-chat',
            name: 'ChatInterface',
            module: 'components/chat',
            selfTime: 5.6,
            totalTime: 42.8,
            samples: 410,
            depth: 2,
            children: [
              {
                id: 'fg-markdown',
                name: 'markdownParse',
                module: 'utils/markdown',
                selfTime: 12.3,
                totalTime: 18.7,
                samples: 180,
                depth: 3,
                children: [
                  { id: 'fg-highlight', name: 'syntaxHighlight', module: 'prism-react', selfTime: 6.4, totalTime: 6.4, samples: 62, depth: 4, children: [] },
                ],
              },
              {
                id: 'fg-aicomp',
                name: 'AICompletion',
                module: 'services/ai',
                selfTime: 8.2,
                totalTime: 15.4,
                samples: 148,
                depth: 3,
                children: [
                  { id: 'fg-stream', name: 'streamTokens', module: 'services/ai/stream', selfTime: 7.2, totalTime: 7.2, samples: 69, depth: 4, children: [] },
                ],
              },
              { id: 'fg-msglist', name: 'MessageList', module: 'components/chat', selfTime: 3.1, totalTime: 3.1, samples: 30, depth: 3, children: [] },
            ],
          },
          {
            id: 'fg-editor',
            name: 'CodeEditor',
            module: 'components/editor',
            selfTime: 4.2,
            totalTime: 56.3,
            samples: 540,
            depth: 2,
            children: [
              {
                id: 'fg-monaco',
                name: 'MonacoEditor',
                module: '@monaco-editor/react',
                selfTime: 22.6,
                totalTime: 38.4,
                samples: 368,
                depth: 3,
                children: [
                  { id: 'fg-tokenize', name: 'tokenizeLines', module: 'monaco-editor/core', selfTime: 9.8, totalTime: 9.8, samples: 94, depth: 4, children: [] },
                  { id: 'fg-layout', name: 'layoutWidget', module: 'monaco-editor/core', selfTime: 6.0, totalTime: 6.0, samples: 58, depth: 4, children: [] },
                ],
              },
              { id: 'fg-minimap', name: 'MinimapRender', module: 'components/editor', selfTime: 8.7, totalTime: 8.7, samples: 84, depth: 3, children: [] },
              { id: 'fg-gutter', name: 'GutterDecoration', module: 'components/editor', selfTime: 5.0, totalTime: 5.0, samples: 48, depth: 3, children: [] },
            ],
          },
          {
            id: 'fg-filemgr',
            name: 'FileManager',
            module: 'components/files',
            selfTime: 6.8,
            totalTime: 28.3,
            samples: 270,
            depth: 2,
            children: [
              { id: 'fg-filetree', name: 'FileTreeVirtual', module: 'components/files', selfTime: 11.5, totalTime: 11.5, samples: 110, depth: 3, children: [] },
              { id: 'fg-watcher', name: 'fsWatcher', module: 'services/fs', selfTime: 5.2, totalTime: 5.2, samples: 50, depth: 3, children: [] },
              { id: 'fg-search', name: 'fileSearch', module: 'services/search', selfTime: 4.8, totalTime: 4.8, samples: 46, depth: 3, children: [] },
            ],
          },
          { id: 'fg-terminal', name: 'TerminalEmulator', module: 'components/terminal', selfTime: 4.6, totalTime: 4.6, samples: 44, depth: 2, children: [] },
          { id: 'fg-statusbar', name: 'StatusBar', module: 'components/ui', selfTime: 2.2, totalTime: 2.2, samples: 21, depth: 2, children: [] },
        ],
      },
      { id: 'fg-gc', name: '[GC] Minor', module: 'v8/gc', selfTime: 4.8, totalTime: 4.8, samples: 46, depth: 1, children: [] },
      { id: 'fg-idle', name: '[idle]', module: 'v8/runtime', selfTime: 3.5, totalTime: 3.5, samples: 34, depth: 1, children: [] },
    ],
  }
  return root
}

/* ================================================================
   Helpers
   ================================================================ */

/** Flatten all frames into array */
function fgFlattenFrames(frame: FgFrame): FgFrame[] {
  const result: FgFrame[] = [frame]
  for (const c of frame.children) {
    result.push(...fgFlattenFrames(c))
  }
  return result
}

/** Get heat color for selfTime ratio — green→yellow→red */
function fgHeatColor(selfTime: number, maxSelf: number): string {
  const ratio = Math.min(selfTime / Math.max(maxSelf, 1), 1)
  if (ratio < 0.33) {
    const t = ratio / 0.33
    const r = Math.round(34 + t * (234 - 34))
    const g = Math.round(197 + t * (179 - 197))
    const b = Math.round(94 + t * (8 - 94))
    return `rgb(${r},${g},${b})`
  }
  if (ratio < 0.66) {
    const t = (ratio - 0.33) / 0.33
    const r = Math.round(234 + t * (239 - 234))
    const g = Math.round(179 - t * (179 - 68))
    const b = Math.round(8 + t * (68 - 8))
    return `rgb(${r},${g},${b})`
  }
  const t = (ratio - 0.66) / 0.34
  const r = Math.round(239 - t * (20))
  const g = Math.round(68 - t * (30))
  const b = Math.round(68 - t * (20))
  return `rgb(${r},${g},${b})`
}

function fgFormatTime(ms: number): string {
  if (ms < 1) {return `${(ms * 1000).toFixed(0)} us`}
  return `${ms.toFixed(1)} ms`
}

/* ================================================================
   Component
   ================================================================ */

export function FlameGraph() {
  const { isLG } = useLiquidGlass()

  const rootFrame = useMemo(() => fgBuildMockFrames(), [])
  const allFrames = useMemo(() => fgFlattenFrames(rootFrame), [rootFrame])
  const maxSelf = useMemo(() => Math.max(...allFrames.map(f => f.selfTime)), [allFrames])
  const maxDepth = useMemo(() => Math.max(...allFrames.map(f => f.depth)), [allFrames])

  const [fgMode, setFgMode] = useState<FgProfileMode>('cpu')
  const [fgSearch, setFgSearch] = useState('')
  const [fgZoom, setFgZoom] = useState(100)
  const [fgSelected, setFgSelected] = useState<FgFrame | null>(null)
  const [fgCapturing, setFgCapturing] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const fgModes: { key: FgProfileMode; icon: React.ElementType; label: string }[] = [
    { key: 'cpu', icon: Cpu, label: 'CPU Profile' },
    { key: 'memory', icon: HardDrive, label: 'Memory Profile' },
    { key: 'render', icon: MonitorDot, label: 'Render Profile' },
  ]

  const searchLower = fgSearch.toLowerCase()

  const fgMatchesSearch = useCallback((name: string) => {
    if (!searchLower) {return true}
    return name.toLowerCase().includes(searchLower)
  }, [searchLower])

  // SVG layout constants
  const fgBarH = 22
  const fgPadX = 2
  const fgPadY = 2
  const fgSvgW = 900 * (fgZoom / 100)
  const fgSvgH = (maxDepth + 1) * (fgBarH + fgPadY) + 20

  /** Recursively compute layout rects for flame graph */
  type FgRect = { frame: FgFrame; x: number; y: number; w: number }

  const fgRects = useMemo(() => {
    const rects: FgRect[] = []
    const totalW = fgSvgW - fgPadX * 2
    const rootTotal = rootFrame.totalTime

    function walk(frame: FgFrame, x: number, w: number) {
      const y = fgSvgH - (frame.depth + 1) * (fgBarH + fgPadY)
      rects.push({ frame, x, y, w })
      let childX = x
      for (const child of frame.children) {
        const childW = (child.totalTime / rootTotal) * totalW
        walk(child, childX, childW)
        childX += childW
      }
    }

    walk(rootFrame, fgPadX, totalW)
    return rects
  }, [rootFrame, fgSvgW, fgSvgH])

  const handleCapture = () => {
    setFgCapturing(true)
    setTimeout(() => setFgCapturing(false), 2000)
  }

  const accentBorder = isLG ? 'border-emerald-500/20' : 'border-violet-500/20'
  const accentText = isLG ? 'text-emerald-400' : 'text-violet-400'
  const accentBg = isLG ? 'bg-emerald-500/10' : 'bg-violet-500/10'
  const accentBgHover = isLG ? 'hover:bg-emerald-500/20' : 'hover:bg-violet-500/20'

  return (
    <div className="h-full flex flex-col bg-[#0a0a14] text-white overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <Flame className={`w-5 h-5 ${accentText}`} />
          <span className="text-sm text-white/80">Performance Flame Graph</span>
          <span className="text-[10px] text-white/20 px-2 py-0.5 rounded bg-white/[0.04]">
            {allFrames.length} frames
          </span>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
          {fgModes.map(m => (
            <button
              key={m.key}
              onClick={() => setFgMode(m.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all ${
                fgMode === m.key
                  ? `${accentBg} ${accentText}`
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04] shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            type="text"
            value={fgSearch}
            onChange={e => setFgSearch(e.target.value)}
            placeholder="Search function..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-white/[0.12] transition-colors"
          />
          {fgSearch && (
            <button onClick={() => setFgSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg px-1 py-0.5">
          <button onClick={() => setFgZoom(z => Math.max(50, z - 25))} className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-white/40 w-10 text-center tabular-nums">{fgZoom}%</span>
          <button onClick={() => setFgZoom(z => Math.min(500, z + 25))} className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button onClick={() => setFgZoom(100)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors" title="Reset zoom">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-white/[0.06]" />

        {/* Capture */}
        <button
          onClick={handleCapture}
          disabled={fgCapturing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all ${
            fgCapturing
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : `${accentBg} ${accentText} ${accentBgHover}`
          }`}
        >
          <Play className={`w-3.5 h-3.5 ${fgCapturing ? 'animate-spin' : ''}`} />
          {fgCapturing ? 'Capturing...' : 'Capture'}
        </button>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-white/25">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fgFormatTime(rootFrame.totalTime)}</span>
          <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Depth {maxDepth}</span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {rootFrame.samples} samples</span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* SVG Flame Graph */}
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto">
            <svg
              ref={svgRef}
              width={fgSvgW}
              height={fgSvgH}
              className="select-none"
              style={{ minWidth: fgSvgW }}
            >
              {/* Heat legend */}
              <defs>
                <linearGradient id="fg-heat-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {fgRects.map(({ frame, x, y, w }) => {
                const matched = fgMatchesSearch(frame.name)
                const isSelected = fgSelected?.id === frame.id
                const fillColor = fgHeatColor(frame.selfTime, maxSelf)
                const isGC = frame.name.startsWith('[GC]')
                const isIdle = frame.name.startsWith('[idle]')
                const displayColor = isGC ? '#f59e0b' : isIdle ? '#6b7280' : fillColor

                return (
                  <g
                    key={frame.id}
                    onClick={() => setFgSelected(frame)}
                    className="cursor-pointer"
                    opacity={searchLower && !matched ? 0.15 : 1}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={Math.max(w - 1, 2)}
                      height={fgBarH}
                      rx={3}
                      fill={displayColor}
                      opacity={isSelected ? 1 : 0.85}
                      stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}
                      strokeWidth={isSelected ? 1.5 : 0.5}
                    />
                    {w > 40 && (
                      <text
                        x={x + 4}
                        y={y + fgBarH / 2 + 1}
                        fill={isSelected ? '#fff' : 'rgba(255,255,255,0.85)'}
                        fontSize={10}
                        fontFamily="ui-monospace, monospace"
                        dominantBaseline="middle"
                        style={{ pointerEvents: 'none' }}
                      >
                        {frame.name.length > Math.floor(w / 6.5) ? frame.name.slice(0, Math.floor(w / 6.5)) + '...' : frame.name}
                      </text>
                    )}
                    {searchLower && matched && (
                      <rect
                        x={x}
                        y={y}
                        width={Math.max(w - 1, 2)}
                        height={fgBarH}
                        rx={3}
                        fill="none"
                        stroke={isLG ? '#34d399' : '#a78bfa'}
                        strokeWidth={2}
                        opacity={0.8}
                      />
                    )}
                  </g>
                )
              })}

              {/* Heat legend bar */}
              <rect x={fgSvgW - 150} y={6} width={120} height={6} rx={3} fill="url(#fg-heat-grad)" opacity={0.6} />
              <text x={fgSvgW - 155} y={12} fill="rgba(255,255,255,0.2)" fontSize={8} textAnchor="end" fontFamily="ui-monospace, monospace">cold</text>
              <text x={fgSvgW - 24} y={12} fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="ui-monospace, monospace">hot</text>
            </svg>
          </div>
        </div>

        {/* ── Detail Panel ── */}
        <AnimatePresence>
          {fgSelected && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`border-l border-white/[0.06] bg-white/[0.02] overflow-hidden shrink-0`}
            >
              <div className="w-[320px] h-full flex flex-col overflow-y-auto">
                {/* Detail header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <span className="text-[11px] text-white/50">Frame Details</span>
                  <button onClick={() => setFgSelected(null)} className="p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/60">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Frame info */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-[10px] text-white/25 mb-1">Function</div>
                    <div className="text-sm text-white/90 font-mono">{fgSelected.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/25 mb-1">Module</div>
                    <div className="text-[12px] text-white/60 font-mono">{fgSelected.module}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Self Time', value: fgFormatTime(fgSelected.selfTime) },
                      { label: 'Total Time', value: fgFormatTime(fgSelected.totalTime) },
                      { label: 'Samples', value: String(fgSelected.samples) },
                      { label: 'Depth', value: String(fgSelected.depth) },
                    ].map(item => (
                      <div key={item.label} className="bg-white/[0.03] rounded-lg px-3 py-2">
                        <div className="text-[9px] text-white/20 mb-0.5">{item.label}</div>
                        <div className="text-[12px] text-white/80 font-mono">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* % of Total */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-white/25">% of Total</span>
                      <span className={`text-[12px] font-mono ${accentText}`}>
                        {((fgSelected.totalTime / rootFrame.totalTime) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(fgSelected.totalTime / rootFrame.totalTime) * 100}%` }}
                        transition={{ duration: 0.4 }}
                        className={`h-full rounded-full ${isLG ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
                      />
                    </div>
                  </div>

                  {/* Self % bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-white/25">Self %</span>
                      <span className="text-[12px] font-mono text-amber-400/80">
                        {((fgSelected.selfTime / rootFrame.totalTime) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(fgSelected.selfTime / rootFrame.totalTime) * 100}%` }}
                        transition={{ duration: 0.4 }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      />
                    </div>
                  </div>

                  {/* Heat indicator */}
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] text-white/25">Heat</div>
                    <div
                      className="w-4 h-4 rounded"
                      style={{ background: fgHeatColor(fgSelected.selfTime, maxSelf) }}
                    />
                    <span className="text-[10px] text-white/40">
                      {fgSelected.selfTime < maxSelf * 0.33 ? 'Cold' : fgSelected.selfTime < maxSelf * 0.66 ? 'Warm' : 'Hot'}
                    </span>
                  </div>

                  {/* Call Stack — children */}
                  {fgSelected.children.length > 0 && (
                    <div>
                      <div className="text-[10px] text-white/25 mb-2 flex items-center gap-1.5">
                        <BarChart3 className="w-3 h-3" /> Call Stack ({fgSelected.children.length})
                      </div>
                      <div className="space-y-1">
                        {fgSelected.children.map(child => (
                          <button
                            key={child.id}
                            onClick={() => setFgSelected(child)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-left group"
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-sm shrink-0"
                              style={{ background: fgHeatColor(child.selfTime, maxSelf) }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] text-white/60 group-hover:text-white/80 font-mono truncate">{child.name}</div>
                              <div className="text-[9px] text-white/20">{fgFormatTime(child.totalTime)}</div>
                            </div>
                            <ChevronRight className="w-3 h-3 text-white/15 group-hover:text-white/40" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
