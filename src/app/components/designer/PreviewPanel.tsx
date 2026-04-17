/**
 * @file PreviewPanel.tsx
 * @description 实时预览面板 — 多语言编译引擎、设备仿真器、控制台捕获、历史时间线、
 * 响应式缩放、四种预览模式（实时/手动/延迟/智能）、元素检查器、网格参考线、
 * 滚动同步、全屏模式、并排多设备对比、快照导出（HTML/PNG）、HMR 平滑过渡、
 * 性能迷你仪表盘（sparkline 趋势图）
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 4.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview, realtime, device-simulation, console, history, i18n, scroll-sync, fullscreen, custom-devices, parallel, export, hmr, sparkline
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Monitor, Tablet, Smartphone, RefreshCw, ExternalLink,
  ZoomIn, ZoomOut, Code2, LayoutDashboard, AlertTriangle,
  Play, Clock, Settings2, Crosshair, Grid3X3,
  Terminal, Trash2, ChevronDown, RotateCcw,
  History, Save, Undo2, Redo2, Copy, Check, Maximize2,
  Minimize2, X, AlertCircle, Info,
  Bug, Zap, ChevronRight, Link2, Plus,
  Columns, Download, Camera, Activity,
} from 'lucide-react'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useAppStore } from '../../stores/app-store'
import {
  usePreviewStore,
  DEVICE_PRESETS,
  type DevicePreset,
  type ConsoleLevel,
  type PreviewMode,
} from '../../stores/preview-store'
import { useI18n } from '../../utils/useI18n'
import { useDebounce } from '../../utils/debounce'
import { getLanguage } from '../../utils/file-contents'
import { createLogger } from '../../utils/logger'

const log = createLogger('PreviewPanel')

// ============================================
// Preview Compiler — build self-contained HTML documents
// ============================================

function buildPreviewHtml(
  code: string,
  language: string,
  options: { inspectorEnabled?: boolean; consoleCapture?: boolean; scrollSync?: boolean } = {},
): string {
  const { inspectorEnabled = false, consoleCapture = true, scrollSync = false } = options

  /* ---------- shared injectable scripts ---------- */

  const consoleScript = consoleCapture
    ? `<script>
(function(){
  var oc={};
  ['log','warn','error','info','debug'].forEach(function(l){
    oc[l]=console[l];
    console[l]=function(){
      var a=Array.from(arguments).map(function(v){
        try{return typeof v==='object'?JSON.stringify(v,null,2):String(v)}
        catch(e){return String(v)}
      });
      window.parent.postMessage({type:'yyc3:console',level:l,message:a.join(' ')},'*');
      oc[l].apply(console,arguments);
    };
  });
  window.addEventListener('error',function(e){
    window.parent.postMessage({type:'yyc3:error',message:e.message,line:e.lineno,column:e.colno,stack:e.error?e.error.stack:''},'*');
  });
  window.addEventListener('unhandledrejection',function(e){
    window.parent.postMessage({type:'yyc3:error',message:'Unhandled Promise: '+(e.reason?e.reason.message||String(e.reason):'unknown'),stack:e.reason?e.reason.stack:''},'*');
  });
})();
</script>`
    : ''

  const inspectorScript = inspectorEnabled
    ? `<script>
(function(){
  var ov=document.createElement('div');ov.id='__yyc3_insp__';
  ov.style.cssText='position:fixed;pointer-events:none;z-index:999999;border:2px solid #10b981;background:rgba(16,185,129,0.08);transition:all 80ms ease;display:none;';
  var lb=document.createElement('div');
  lb.style.cssText='position:fixed;z-index:999999;background:#10b981;color:#fff;font:11px/1.4 monospace;padding:2px 6px;border-radius:3px;pointer-events:none;display:none;';
  document.body.appendChild(ov);document.body.appendChild(lb);
  document.addEventListener('mousemove',function(e){
    var el=document.elementFromPoint(e.clientX,e.clientY);
    if(!el||el===ov||el===lb)return;
    var r=el.getBoundingClientRect();
    ov.style.left=r.left+'px';ov.style.top=r.top+'px';ov.style.width=r.width+'px';ov.style.height=r.height+'px';ov.style.display='block';
    lb.textContent=el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\\s+/).join('.'):'');
    lb.style.left=r.left+'px';lb.style.top=Math.max(0,r.top-22)+'px';lb.style.display='block';
  });
})();
</script>`
    : ''

  const perfScript = `<script>
window.addEventListener('load',function(){
  requestAnimationFrame(function(){
    window.parent.postMessage({type:'yyc3:perf',renderTime:performance.now()},'*');
  });
});
</script>`

  const scrollSyncScript = scrollSync
    ? `<script>
(function(){
  var sending=false,receiving=false;
  window.addEventListener('scroll',function(){
    if(receiving)return;
    var h=document.documentElement.scrollHeight-window.innerHeight;
    if(h<=0)return;
    sending=true;
    window.parent.postMessage({type:'yyc3:scroll',percent:window.scrollY/h},'*');
    setTimeout(function(){sending=false;},50);
  });
  window.addEventListener('message',function(e){
    if(e.data&&e.data.type==='yyc3:scrollTo'&&!sending){
      receiving=true;
      var h=document.documentElement.scrollHeight-window.innerHeight;
      window.scrollTo({top:e.data.percent*h,behavior:'auto'});
      setTimeout(function(){receiving=false;},50);
    }
  });
})();
</script>`
    : ''

  /* ---------- language detection ---------- */

  const lang = language.toLowerCase()
  const isHtml = lang === 'html' || lang === 'htm'
  const isCss = lang === 'css' || lang === 'scss' || lang === 'less'
  const isMarkdown = lang === 'markdown' || lang === 'md'
  const isSvg = lang === 'svg'
  const isJson = lang === 'json'
  const isJsx = ['jsx', 'tsx', 'javascript', 'typescript', 'js', 'ts'].includes(lang)

  /* ---------- HTML ---------- */
  if (isHtml) {
    if (code.toLowerCase().includes('<html') || code.toLowerCase().includes('<!doctype')) {
      return code.replace('</head>', `${consoleScript}${inspectorScript}${perfScript}${scrollSyncScript}</head>`)
    }
    return wrapHtml(code, `${consoleScript}${inspectorScript}${perfScript}${scrollSyncScript}`)
  }

  /* ---------- CSS ---------- */
  if (isCss) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${code}</style>
<style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px;background:#fafafa}
.pg{display:grid;gap:16px}.pc{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.08)}.pc h4{margin:0 0 12px;color:#333;font-size:14px}</style>
${consoleScript}${inspectorScript}${perfScript}
</head><body>
<div class="pg">
  <div class="pc"><h4>Typography</h4><h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3><p>Paragraph text with <a href="#">links</a>, <strong>bold</strong> and <em>italic</em>.</p></div>
  <div class="pc"><h4>Elements</h4><button style="padding:8px 16px;border-radius:6px;border:1px solid #ddd;cursor:pointer;margin-right:8px">Button</button><input type="text" placeholder="Input field..." style="padding:8px 12px;border-radius:6px;border:1px solid #ddd"/><div style="width:120px;height:80px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;margin-top:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px">Box</div></div>
  <div class="pc"><h4>Lists</h4><ul><li>Item one</li><li>Item two</li><li>Item three</li></ul></div>
</div></body></html>`
  }

  /* ---------- Markdown ---------- */
  if (isMarkdown) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif;margin:0;padding:24px 32px;color:#1f2328;line-height:1.6;max-width:860px}
h1,h2,h3,h4,h5,h6{margin-top:24px;margin-bottom:16px;line-height:1.25}
h1{font-size:2em;border-bottom:1px solid #d1d9e0;padding-bottom:.3em}
h2{font-size:1.5em;border-bottom:1px solid #d1d9e0;padding-bottom:.3em}
h3{font-size:1.25em}
code{background:#eff1f3;padding:.2em .4em;border-radius:4px;font-size:85%;font-family:'SFMono-Regular',Consolas,monospace}
pre{background:#f6f8fa;padding:16px;border-radius:8px;overflow-x:auto}pre code{background:transparent;padding:0}
blockquote{border-left:4px solid #d1d9e0;margin:0;padding:.5em 1em;color:#636c76}
table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #d1d9e0;padding:8px 12px;text-align:left}th{background:#f6f8fa;font-weight:600}
a{color:#0969da;text-decoration:none}a:hover{text-decoration:underline}
img{max-width:100%;border-radius:6px}hr{border:none;border-top:2px solid #d1d9e0;margin:24px 0}
ul,ol{padding-left:2em}li+li{margin-top:4px}
</style>
${consoleScript}${inspectorScript}${perfScript}
</head><body>${markdownToHtml(code)}</body></html>`
  }

  /* ---------- SVG ---------- */
  if (isSvg) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8f9fa}svg{max-width:90vw;max-height:90vh}.svg-bg{background:repeating-conic-gradient(#e8e8e8 0% 25%,transparent 0% 50%) 50%/20px 20px;padding:24px;border-radius:12px}</style>
${consoleScript}${inspectorScript}${perfScript}
</head><body><div class="svg-bg">${code}</div></body></html>`
  }

  /* ---------- JSON ---------- */
  if (isJson) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:'SFMono-Regular',Consolas,monospace;margin:0;padding:16px;background:#1e1e2e;color:#cdd6f4;font-size:13px}pre{white-space:pre-wrap;word-break:break-word}.k{color:#89b4fa}.s{color:#a6e3a1}.n{color:#fab387}.b{color:#f38ba8}.nl{color:#9399b2}</style>
${consoleScript}${perfScript}
</head><body><pre>${syntaxHighlightJson(code)}</pre></body></html>`
  }

  /* ---------- JSX / TSX / JS / TS ---------- */
  if (isJsx) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
<style>
body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:16px;background:#fff}
#root{min-height:100px}
.ce{color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;font-family:'SFMono-Regular',Consolas,monospace;font-size:12px;white-space:pre-wrap;line-height:1.5}
.ce .t{font-weight:600;margin-bottom:8px;font-size:13px}
</style>
${consoleScript}${inspectorScript}${perfScript}
</head><body>
<div id="root"></div>
<script type="text/babel" data-type="module">
try{
  ${sanitizeForBabel(code)}
  ${extractComponentRender(code)}
}catch(err){
  document.getElementById('root').innerHTML='<div class="ce"><div class="t">Render Error</div>'+err.message+'</div>';
  log.error('Render Error:',err.message);
}
</script>
<script>
window.addEventListener('error',function(e){
  var r=document.getElementById('root');
  if(r&&!r.innerHTML.includes('ce')){
    r.innerHTML='<div class="ce"><div class="t">Runtime Error</div>'+e.message+'</div>';
    log.error('Runtime Error:',e.message);
  }
});
</script>
</body></html>`
  }

  /* ---------- Fallback: plaintext ---------- */
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:'SFMono-Regular',Consolas,monospace;margin:0;padding:16px;background:#1e1e2e;color:#cdd6f4;font-size:13px;line-height:1.6}pre{white-space:pre-wrap;word-break:break-all}.ln{color:#585b70;display:inline-block;width:3em;text-align:right;margin-right:1em;user-select:none}</style>
${consoleScript}${perfScript}
</head><body><pre>${code
    .split('\n')
    .map((line, i) => `<span class="ln">${i + 1}</span>${escapeHtml(line)}`)
    .join('\n')}</pre></body></html>`
}

/* ---------- helpers ---------- */

function wrapHtml(body: string, headScripts: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
<style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:16px}*{box-sizing:border-box}</style>
${headScripts}
</head><body>${body}</body></html>`
}

function sanitizeForBabel(code: string): string {
  let c = code
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '// [import removed]')
    .replace(/^import\s+['"].*?['"];?\s*$/gm, '// [import removed]')
    .replace(/^export\s+default\s+/gm, 'const __DefaultExport__ = ')
    .replace(/^export\s+/gm, '')
  c = c
    .replace(/:\s*React\.FC\b[^=]*/g, '')
    .replace(/:\s*[A-Z][a-zA-Z]*Props/g, '')
    .replace(/<[A-Z][a-zA-Z]*>\s*\(/g, '(')
    .replace(/interface\s+\w+\s*\{[^}]*\}/gs, '')
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
    .replace(/as\s+\w+/g, '')
  return c
}

function extractComponentRender(code: string): string {
  const m = code.match(/(?:function|const)\s+([A-Z]\w+)/)
  const name = m ? m[1] : null
  const fallback = `document.getElementById('root').innerHTML='<div style="color:#666;font-size:13px;padding:20px">No renderable component found</div>';`
  if (name) {
    return `
if(typeof __DefaultExport__!=='undefined'){ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(__DefaultExport__));}
else if(typeof ${name}!=='undefined'){ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(${name}));}
else{${fallback}}`
  }
  return `if(typeof __DefaultExport__!=='undefined'){ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(__DefaultExport__));}else{${fallback}}`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function syntaxHighlightJson(json: string): string {
  try {
    const f = JSON.stringify(JSON.parse(json), null, 2)
    return f.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (m) => {
        let c = 'n'
        if (/^"/.test(m)) {c = /:$/.test(m) ? 'k' : 's'}
        else if (/true|false/.test(m)) {c = 'b'}
        else if (/null/.test(m)) {c = 'nl'}
        return `<span class="${c}">${escapeHtml(m)}</span>`
      },
    )
  } catch {
    return escapeHtml(json)
  }
}

function markdownToHtml(md: string): string {
  let h = md
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, (_, l, c) => `<pre><code class="language-${l || 'text'}">${escapeHtml(c.trim())}</code></pre>`)
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>')
  h = h.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
  h = h.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
  h = h.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
  h = h.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  h = h.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  h = h.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
  h = h.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>')
  h = h.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
  h = h.replace(/^---$/gm, '<hr>')
  h = h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1"/>')
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  h = h.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
  h = h.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
  h = h.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
  h = h.replace(/^(?!<[a-z/]|$)(.+)$/gm, '<p>$1</p>')
  return h
}

// ============================================
// Export Utilities
// ============================================

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

async function captureIframeAsPng(iframe: HTMLIFrameElement): Promise<Blob | null> {
  try {
    const doc = iframe.contentDocument
    if (!doc) {return null}
    const canvas = document.createElement('canvas')
    const w = iframe.clientWidth
    const h = iframe.clientHeight
    canvas.width = w * 2
    canvas.height = h * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) {return null}
    ctx.scale(2, 2)
    // Serialize the iframe content to SVG foreignObject for canvas rendering
    const html = new XMLSerializer().serializeToString(doc.documentElement)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
      </foreignObject>
    </svg>`
    const img = new Image()
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    return new Promise<Blob | null>((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(svgUrl)
        canvas.toBlob(resolve, 'image/png')
      }
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl)
        resolve(null)
      }
      img.src = svgUrl
    })
  } catch {
    return null
  }
}

// ============================================
// Performance Sparkline
// ============================================

function PerfSparkline({ data, width = 80, height = 16, isLG }: {
  data: Array<{ compile: number; render: number; ts: number }>
  width?: number; height?: number; isLG: boolean
}) {
  if (data.length < 2) {return null}

  const recent = data.slice(-30)
  const maxVal = Math.max(...recent.map(d => d.compile + d.render), 1)
  const step = width / (recent.length - 1)

  const compilePath = recent.map((d, i) => {
    const x = i * step
    const y = height - (d.compile / maxVal) * height
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const totalPath = recent.map((d, i) => {
    const x = i * step
    const y = height - ((d.compile + d.render) / maxVal) * height
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <path d={totalPath} fill="none" stroke={isLG ? 'rgba(16,185,129,0.3)' : 'rgba(34,211,238,0.3)'} strokeWidth="1" />
      <path d={compilePath} fill="none" stroke={isLG ? 'rgba(16,185,129,0.7)' : 'rgba(34,211,238,0.7)'} strokeWidth="1.5" />
    </svg>
  )
}

// ============================================
// PreviewPanel — Main Component
// ============================================

export function PreviewPanel() {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const { selectedFile, fileContents } = useAppStore()
  const {
    mode, setMode,
    activeDevice, setActiveDevice, orientation, toggleOrientation,
    zoom, setZoom,
    refreshKey, triggerRefresh,
    history, historyIndex, addHistory, undoHistory, redoHistory,
    consoleEntries, addConsoleEntry, clearConsole, consoleVisible, toggleConsole,
    previewError, setPreviewError,
    perf, updatePerf,
    inspectorEnabled, toggleInspector,
    gridOverlay, toggleGridOverlay,
    showMock, setShowMock,
    previewDelay,
    autoRefresh, refreshInterval,
    scrollSyncEnabled, toggleScrollSync, scrollPercent, setScrollPercent, _scrollSource,
    isFullscreen, toggleFullscreen,
    parallelMode, toggleParallelMode, parallelDevices, setParallelDevices,
    perfHistory, addPerfSample,
    _iframeTransitioning, _setIframeTransitioning,
  } = usePreviewStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [manualPending, setManualPending] = useState(false)
  const [exportDropdown, setExportDropdown] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevSrcdocRef = useRef<string | null>(null)

  // Current file
  const currentFile = selectedFile ? fileContents[selectedFile] : null
  const fileCode = currentFile?.content || ''
  const fileLanguage = currentFile?.language || getLanguage(selectedFile || '')

  // Debounce for realtime/delayed/smart modes
  const debouncedCode = useDebounce(fileCode, previewDelay)

  // Effective code based on mode
  const effectiveCode = mode === 'manual' ? fileCode : debouncedCode

  // Smart mode: flag pending for large changes
  useEffect(() => {
    if (mode === 'smart') {
      const delta = Math.abs(fileCode.length - (debouncedCode?.length || 0))
      setManualPending(delta > 500)
    } else {
      setManualPending(false)
    }
  }, [mode, fileCode, debouncedCode])

  // Build srcdoc
  const [srcdoc, setSrcdoc] = useState<string | null>(null)
  useEffect(() => {
    if (showMock || !effectiveCode.trim()) {
      setSrcdoc(null)
      return
    }
    const t0 = performance.now()
    try {
      setPreviewError(null)
      const html = buildPreviewHtml(effectiveCode, fileLanguage, { inspectorEnabled, consoleCapture: true, scrollSync: scrollSyncEnabled })
      const compileMs = performance.now() - t0
      updatePerf({ compileTime: compileMs, lastUpdate: Date.now() })

      // HMR smoothing — show transition overlay during update
      if (prevSrcdocRef.current && prevSrcdocRef.current !== html) {
        _setIframeTransitioning(true)
        setTimeout(() => _setIframeTransitioning(false), 250)
      }
      prevSrcdocRef.current = html
      setSrcdoc(html)
    } catch (err: any) {
      setPreviewError({ message: err.message, timestamp: Date.now() })
      updatePerf({ compileTime: performance.now() - t0 })
      setSrcdoc(null)
    }
  }, [effectiveCode, fileLanguage, refreshKey, inspectorEnabled, showMock, scrollSyncEnabled])

  // Record history on meaningful code changes
  const lastHistoryCode = useRef('')
  useEffect(() => {
    if (effectiveCode && effectiveCode !== lastHistoryCode.current && effectiveCode.trim().length > 10) {
      const timer = setTimeout(() => {
        addHistory(effectiveCode, fileLanguage)
        lastHistoryCode.current = effectiveCode
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [effectiveCode, fileLanguage, addHistory])

  // Listen for iframe messages
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') {return}
      const { type } = e.data
      if (type === 'yyc3:console') {
        addConsoleEntry(e.data.level as ConsoleLevel, e.data.message)
      } else if (type === 'yyc3:error') {
        setPreviewError({
          message: e.data.message,
          line: e.data.line,
          column: e.data.column,
          stack: e.data.stack,
          timestamp: Date.now(),
        })
        addConsoleEntry('error', e.data.message)
      } else if (type === 'yyc3:perf') {
        const ct = usePreviewStore.getState().perf.compileTime || 0
        const rt = e.data.renderTime || 0
        updatePerf({ renderTime: rt, totalTime: ct + rt })
        // Record perf sample for sparkline
        addPerfSample(ct, rt)
      } else if (type === 'yyc3:scroll') {
        setScrollPercent(e.data.percent, 'preview')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [addConsoleEntry, setPreviewError, updatePerf, setScrollPercent, addPerfSample])

  // Forward editor scroll to iframe
  useEffect(() => {
    if (!scrollSyncEnabled || _scrollSource !== 'editor') {return}
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) {return}
    iframe.contentWindow.postMessage({ type: 'yyc3:scrollTo', percent: scrollPercent }, '*')
  }, [scrollSyncEnabled, _scrollSource, scrollPercent])

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) {return}
    const timer = setInterval(triggerRefresh, refreshInterval)
    return () => clearInterval(timer)
  }, [autoRefresh, refreshInterval, triggerRefresh])

  // Set default parallel devices if entering parallel mode with none selected
  useEffect(() => {
    if (parallelMode && parallelDevices.length === 0) {
      setParallelDevices([
        DEVICE_PRESETS.find(d => d.id === 'desktop-1280')!,
        DEVICE_PRESETS.find(d => d.id === 'ipad-air')!,
        DEVICE_PRESETS.find(d => d.id === 'iphone-15-pro')!,
      ])
    }
  }, [parallelMode, parallelDevices.length, setParallelDevices])

  // Callbacks
  const handleRefresh = useCallback(() => {
    setManualPending(false)
    clearConsole()
    triggerRefresh()
  }, [clearConsole, triggerRefresh])

  const handleOpenExternal = useCallback(() => {
    if (!srcdoc) {return}
    const blob = new Blob([srcdoc], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }, [srcdoc])

  const handleCopyHtml = useCallback(() => {
    if (!srcdoc) {return}
    navigator.clipboard.writeText(srcdoc)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [srcdoc])

  const handleExportHtml = useCallback(() => {
    if (!srcdoc) {return}
    const filename = selectedFile ? selectedFile.replace(/\.\w+$/, '.html') : 'preview.html'
    downloadFile(srcdoc, filename, 'text/html')
    setExportDropdown(false)
  }, [srcdoc, selectedFile])

  const handleExportPng = useCallback(async () => {
    const iframe = iframeRef.current
    if (!iframe) {return}
    const blob = await captureIframeAsPng(iframe)
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = (selectedFile || 'preview').replace(/\.\w+$/, '.png')
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
    setExportDropdown(false)
  }, [selectedFile])

  // Device dimensions
  const deviceW = orientation === 'landscape' ? activeDevice.height : activeDevice.width
  const deviceH = orientation === 'landscape' ? activeDevice.width : activeDevice.height
  const isDesktop = activeDevice.category === 'desktop'

  const showLivePreview = !showMock && srcdoc && !previewError

  // Mode icons map
  const modeIcons: Record<PreviewMode, React.ReactNode> = {
    realtime: <Zap className="w-3 h-3" />,
    manual: <Play className="w-3 h-3" />,
    delayed: <Clock className="w-3 h-3" />,
    smart: <Crosshair className="w-3 h-3" />,
  }

  return (
    <div
      className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-[80]' : ''}`}
      style={{ background: isLG ? 'rgba(8,12,8,0.6)' : 'color-mix(in oklch, var(--background, #0a0a12), black 8%)' }}
    >
      {/* ============ Primary Toolbar ============ */}
      <div
        className="h-10 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0"
        style={isLG ? { background: 'rgba(10,15,10,0.35)', backdropFilter: 'blur(12px)' } : { background: 'var(--sidebar, #0d0d14)' }}
      >
        {/* Left side */}
        <div className="flex items-center gap-1.5">
          {/* Live / Mock */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-md p-0.5">
            <ToolbarToggle active={!showMock} isLG={isLG} onClick={() => setShowMock(false)} title={t('preview.live', 'designer')}>
              <Code2 className="w-3 h-3" />
              <span>{t('preview.live', 'designer')}</span>
            </ToolbarToggle>
            <ToolbarToggle active={showMock} isLG={isLG} onClick={() => setShowMock(true)} title={t('preview.mock', 'designer')}>
              <LayoutDashboard className="w-3 h-3" />
              <span>Mock</span>
            </ToolbarToggle>
          </div>

          {/* Preview Mode selector */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-md p-0.5 ml-1">
            {(['realtime', 'manual', 'delayed', 'smart'] as PreviewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                title={t(`preview.mode.${m}`, 'designer')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors ${
                  mode === m
                    ? isLG ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.08] text-white/70'
                    : 'text-white/25 hover:text-white/45'
                }`}
              >
                {modeIcons[m]}
              </button>
            ))}
          </div>

          {/* Status badge */}
          <StatusBadge
            isLG={isLG}
            hasError={!!previewError}
            showMock={showMock}
            manualPending={manualPending}
            t={t}
          />

          {selectedFile && !showMock && (
            <span className="text-[9px] text-white/20 truncate max-w-[120px]">{selectedFile}</span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-0.5">
          {/* Manual play button */}
          {mode === 'manual' && (
            <button
              onClick={handleRefresh}
              className={`p-1.5 rounded transition-colors ${
                manualPending ? 'text-amber-400 animate-pulse' : isLG ? 'text-emerald-400/50 hover:text-emerald-400/80' : 'text-white/30 hover:text-white/50'
              }`}
              title={t('preview.runPreview', 'designer')}
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Inspector */}
          <ToolbarIconButton active={inspectorEnabled} isLG={isLG} onClick={toggleInspector} title={t('preview.inspector', 'designer')}>
            <Crosshair className="w-3.5 h-3.5" />
          </ToolbarIconButton>

          {/* Grid overlay */}
          <ToolbarIconButton active={gridOverlay} isLG={isLG} onClick={toggleGridOverlay} title={t('preview.gridOverlay', 'designer')}>
            <Grid3X3 className="w-3.5 h-3.5" />
          </ToolbarIconButton>

          {/* Parallel preview */}
          <ToolbarIconButton active={parallelMode} isLG={isLG} onClick={toggleParallelMode} title={t('preview.parallel', 'designer')}>
            <Columns className="w-3.5 h-3.5" />
          </ToolbarIconButton>

          <ToolbarDivider />

          {/* Device selector */}
          {!parallelMode && (
            <DeviceQuickSelect activeDevice={activeDevice} setActiveDevice={setActiveDevice} isLG={isLG} t={t} />
          )}

          {/* Orientation */}
          {!isDesktop && !parallelMode && (
            <button onClick={toggleOrientation} className="p-1.5 rounded text-white/25 hover:text-white/50 transition-colors" title={t('preview.rotate', 'designer')}>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <ToolbarDivider />

          {/* Zoom */}
          <button onClick={() => setZoom(zoom - 10)} className="p-1 rounded text-white/25 hover:text-white/50 transition-colors"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-[10px] text-white/30 min-w-[28px] text-center">{zoom}%</span>
          <button onClick={() => setZoom(zoom + 10)} className="p-1 rounded text-white/25 hover:text-white/50 transition-colors"><ZoomIn className="w-3.5 h-3.5" /></button>

          <ToolbarDivider />

          {/* Action buttons */}
          <button onClick={handleRefresh} className="p-1.5 rounded text-white/25 hover:text-white/50 transition-colors" title={t('preview.refresh', 'designer')}><RefreshCw className="w-3.5 h-3.5" /></button>
          <button onClick={handleCopyHtml} className="p-1.5 rounded text-white/25 hover:text-white/50 transition-colors" title={t('preview.copyHtml', 'designer')}>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportDropdown(!exportDropdown)}
              className={`p-1.5 rounded transition-colors ${exportDropdown ? (isLG ? 'text-emerald-400' : 'text-cyan-400') : 'text-white/25 hover:text-white/50'}`}
              title={t('preview.export', 'designer')}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {exportDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportDropdown(false)} />
                <div
                  className={`absolute top-full right-0 mt-1 w-48 rounded-lg border z-50 overflow-hidden ${isLG ? 'border-emerald-500/[0.1]' : 'border-white/[0.08]'}`}
                  style={{ background: isLG ? 'rgba(10,15,10,0.95)' : 'rgba(14,14,24,0.98)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                >
                  <button onClick={handleExportHtml} className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/50 hover:bg-white/[0.04] transition-colors" disabled={!srcdoc}>
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{t('preview.export.html', 'designer')}</span>
                  </button>
                  <button onClick={handleExportPng} className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/50 hover:bg-white/[0.04] transition-colors" disabled={!srcdoc}>
                    <Camera className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{t('preview.export.png', 'designer')}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={handleOpenExternal} className="p-1.5 rounded text-white/25 hover:text-white/50 transition-colors" title={t('preview.openExternal', 'designer')}><ExternalLink className="w-3.5 h-3.5" /></button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded text-white/25 hover:text-white/50 transition-colors" title={t('preview.fullscreen', 'designer')}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Panels */}
          <ToolbarIconButton active={settingsOpen} isLG={isLG} onClick={() => { setSettingsOpen(!settingsOpen); setHistoryOpen(false) }} title={t('preview.settings', 'designer')}>
            <Settings2 className="w-3.5 h-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton active={historyOpen} isLG={isLG} onClick={() => { setHistoryOpen(!historyOpen); setSettingsOpen(false) }} title={t('preview.history', 'designer')}>
            <History className="w-3.5 h-3.5" />
          </ToolbarIconButton>

          {/* Console */}
          <button
            onClick={toggleConsole}
            className={`p-1.5 rounded transition-colors relative ${consoleVisible ? (isLG ? 'text-emerald-400' : 'text-white/70') : 'text-white/25 hover:text-white/50'}`}
            title={t('preview.console', 'designer')}
          >
            <Terminal className="w-3.5 h-3.5" />
            {consoleEntries.some(e => e.level === 'error') && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* ============ Settings / History Dropdown ============ */}
      {settingsOpen && <PreviewSettingsPanel isLG={isLG} t={t} onClose={() => setSettingsOpen(false)} />}
      {historyOpen && <PreviewHistoryPanel isLG={isLG} t={t} onClose={() => setHistoryOpen(false)} />}

      {/* ============ Preview Area ============ */}
      <div ref={containerRef} className="flex-1 flex items-start justify-center p-4 overflow-auto relative">
        {gridOverlay && !showMock && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        )}

        {/* HMR transition overlay */}
        {_iframeTransitioning && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className={`px-3 py-1.5 rounded-lg text-[10px] ${isLG ? 'bg-emerald-500/10 text-emerald-400/60' : 'bg-cyan-500/10 text-cyan-400/60'}`}
              style={{ backdropFilter: 'blur(4px)' }}>
              {t('preview.hmr.transitioning', 'designer')}
            </div>
          </div>
        )}

        {parallelMode && showLivePreview ? (
          /* ---- Parallel multi-device preview ---- */
          <div className="flex gap-4 items-start overflow-x-auto w-full">
            {parallelDevices.map((device) => {
              const pW = device.width
              const pH = device.height
              const pIsDesktop = device.category === 'desktop'
              return (
                <div key={device.id} className="shrink-0 flex flex-col items-center">
                  <span className="text-[9px] text-white/25 mb-1">{device.name} ({pW}x{pH})</span>
                  <div
                    className="bg-white rounded-lg shadow-xl overflow-hidden"
                    style={{
                      width: pIsDesktop ? '100%' : `${pW}px`,
                      maxWidth: pIsDesktop ? 400 : pW,
                      transform: `scale(${Math.min(zoom / 100, 0.5)})`,
                      transformOrigin: 'top center',
                    }}
                  >
                    <BrowserChrome url={selectedFile ? `preview://${selectedFile}` : 'localhost:5173'} isDesktop={pIsDesktop} deviceW={pW} deviceH={pH} />
                    <iframe
                      srcDoc={srcdoc!}
                      className="w-full border-0"
                      style={{ minHeight: 300, height: pIsDesktop ? '50vh' : `${Math.min(pH, 500)}px` }}
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      title={`Preview ${device.name}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ---- Standard single-device preview ---- */
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{
              width: isDesktop ? '100%' : `${deviceW}px`,
              maxWidth: '100%',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Browser Chrome */}
            <BrowserChrome
              url={!showMock && selectedFile ? `preview://${selectedFile}` : 'localhost:5173'}
              isDesktop={isDesktop}
              deviceW={deviceW}
              deviceH={deviceH}
            />

            {/* Content */}
            {showLivePreview ? (
              <iframe
                ref={iframeRef}
                key={`${refreshKey}-${inspectorEnabled}`}
                srcDoc={srcdoc!}
                className="w-full border-0"
                style={{
                  minHeight: 400,
                  height: isDesktop ? '65vh' : `${Math.min(deviceH, 700)}px`,
                  opacity: _iframeTransitioning ? 0.6 : 1,
                  transition: 'opacity 200ms ease',
                }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                title="Live Preview"
              />
            ) : previewError ? (
              <PreviewErrorDisplay error={previewError} t={t} />
            ) : !showMock && !fileCode.trim() ? (
              <PreviewEmptyState t={t} />
            ) : (
              <MockDashboard t={t} />
            )}
          </div>
        )}
      </div>

      {/* ============ Console Panel ============ */}
      {consoleVisible && <PreviewConsole isLG={isLG} t={t} />}

      {/* ============ Bottom Status ============ */}
      <div
        className="h-6 flex items-center justify-between px-3 border-t border-white/[0.06] shrink-0"
        style={isLG ? { background: 'rgba(10,15,10,0.35)', backdropFilter: 'blur(8px)' } : { background: 'var(--sidebar, #0d0d14)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/25">
            {parallelMode ? `${t('preview.parallel', 'designer')} (${parallelDevices.length})` : `${activeDevice.name}${!isDesktop ? ` ${deviceW}x${deviceH}` : ''}`}
          </span>
          <span className={`text-[10px] ${previewError ? 'text-red-400/70' : isLG ? 'text-emerald-400/70' : 'text-emerald-400/50'}`}>
            {previewError
              ? `● ${t('preview.status.error', 'designer')}`
              : showMock
                ? `● Mock`
                : `● Live (${t(`preview.mode.${mode}`, 'designer')})`}
          </span>
          {perf.compileTime !== null && (
            <span className="text-[9px] text-white/15">
              {t('preview.perf.compile', 'designer')}: {perf.compileTime.toFixed(1)}ms
              {perf.renderTime !== null && ` | ${t('preview.perf.render', 'designer')}: ${perf.renderTime.toFixed(0)}ms`}
            </span>
          )}
          {/* Perf sparkline */}
          {perfHistory.length >= 2 && (
            <div className="flex items-center gap-1" title={`${t('preview.perf.sparkline', 'designer')} (${perfHistory.length} ${t('preview.perf.samples', 'designer')})`}>
              <Activity className="w-2.5 h-2.5 text-white/15" />
              <PerfSparkline data={perfHistory} isLG={isLG} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <div className="flex items-center gap-1">
              <button onClick={undoHistory} disabled={historyIndex <= 0} className="text-white/15 hover:text-white/40 disabled:opacity-30 transition-colors"><Undo2 className="w-3 h-3" /></button>
              <span className="text-[9px] text-white/15">{historyIndex + 1}/{history.length}</span>
              <button onClick={redoHistory} disabled={historyIndex >= history.length - 1} className="text-white/15 hover:text-white/40 disabled:opacity-30 transition-colors"><Redo2 className="w-3 h-3" /></button>
            </div>
          )}
          <span className="text-[10px] text-white/15">{fileLanguage} | iframe</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Shared Toolbar Primitives (DRY)
// ============================================

function ToolbarToggle({ active, isLG, onClick, title, children }: {
  active: boolean; isLG: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
        active
          ? isLG ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.08] text-white/70'
          : 'text-white/30 hover:text-white/50'
      }`}
    >
      {children}
    </button>
  )
}

function ToolbarIconButton({ active, isLG, onClick, title, children }: {
  active: boolean; isLG: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? isLG ? 'text-emerald-400 bg-emerald-500/10' : 'text-cyan-400 bg-cyan-500/10'
          : 'text-white/25 hover:text-white/50'
      }`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-white/[0.06] mx-0.5" />
}

function StatusBadge({ isLG, hasError, showMock, manualPending, t }: {
  isLG: boolean; hasError: boolean; showMock: boolean; manualPending: boolean
  t: (key: string, nsOrOpts?: any, opts?: any) => string
}) {
  const cls = hasError
    ? 'bg-red-500/15 text-red-400/80 border-red-500/25'
    : isLG
      ? 'bg-emerald-500/15 text-emerald-400/80 border-emerald-500/25 shadow-[0_0_8px_rgba(0,255,135,0.1)]'
      : 'bg-emerald-500/10 text-emerald-400/60 border-emerald-500/20'

  const label = hasError
    ? t('preview.status.error', 'designer')
    : showMock
      ? 'MOCK'
      : manualPending
        ? t('preview.status.pending', 'designer')
        : 'LIVE'

  return <span className={`text-[9px] px-1.5 py-0.5 rounded border ${cls}`}>{label}</span>
}

// ============================================
// Browser Chrome (address bar simulation)
// ============================================

function BrowserChrome({ url, isDesktop, deviceW, deviceH }: {
  url: string; isDesktop: boolean; deviceW: number; deviceH: number
}) {
  return (
    <div className="h-8 bg-gray-100 flex items-center px-3 gap-1.5 border-b border-gray-200">
      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
      <div className="flex-1 mx-6">
        <div className="h-5 bg-white rounded-md flex items-center px-2 max-w-md mx-auto">
          <span className="text-[10px] text-gray-400 truncate">{url}</span>
        </div>
      </div>
      {!isDesktop && (
        <span className="text-[9px] text-gray-300">{deviceW}x{deviceH}</span>
      )}
    </div>
  )
}

// ============================================
// Device Quick Select
// ============================================

function DeviceQuickSelect({ activeDevice, setActiveDevice, isLG, t }: {
  activeDevice: DevicePreset; setActiveDevice: (d: DevicePreset) => void; isLG: boolean
  t: (key: string, nsOrOpts?: any, opts?: any) => string
}) {
  const [open, setOpen] = useState(false)
  const { customDevices } = usePreviewStore()

  const cats = [
    { id: 'desktop' as const, icon: Monitor, label: t('preview.device.desktop', 'designer') },
    { id: 'tablet' as const, icon: Tablet, label: t('preview.device.tablet', 'designer') },
    { id: 'mobile' as const, icon: Smartphone, label: t('preview.device.mobile', 'designer') },
  ]

  const quickDevices = cats.map(c => ({ ...c, device: DEVICE_PRESETS.find(d => d.category === c.id)! }))

  return (
    <div className="relative">
      <div className="flex items-center gap-0.5">
        {quickDevices.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDevice(d.device)}
            title={d.label}
            className={`p-1.5 rounded transition-colors ${
              activeDevice.category === d.id
                ? isLG ? 'text-emerald-400 bg-emerald-500/10' : 'bg-white/[0.08] text-white/70'
                : 'text-white/25 hover:text-white/50'
            }`}
          >
            <d.icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <button onClick={() => setOpen(!open)} className="p-1 rounded text-white/20 hover:text-white/40 transition-colors" title={t('preview.device.more', 'designer')}>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute top-full right-0 mt-1 w-56 rounded-xl border overflow-hidden z-50 max-h-80 overflow-y-auto ${isLG ? 'border-emerald-500/[0.1]' : 'border-white/[0.08]'}`}
            style={{ background: isLG ? 'rgba(10,15,10,0.95)' : 'rgba(14,14,24,0.98)', backdropFilter: 'blur(20px)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
          >
            {(['desktop', 'tablet', 'mobile'] as const).map(cat => (
              <div key={cat}>
                <div className={`px-3 py-1.5 text-[9px] uppercase tracking-wider ${isLG ? 'text-emerald-400/30' : 'text-white/20'}`}>
                  {t(`preview.device.${cat}`, 'designer')}
                </div>
                {DEVICE_PRESETS.filter(d => d.category === cat).map(device => (
                  <button
                    key={device.id}
                    onClick={() => { setActiveDevice(device); setOpen(false) }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors ${
                      activeDevice.id === device.id
                        ? isLG ? 'bg-emerald-500/[0.08] text-emerald-300/80' : 'bg-white/[0.06] text-white/80'
                        : 'text-white/50 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-[11px]">{device.name}</span>
                    <span className="text-[9px] text-white/20">{device.width}x{device.height}</span>
                  </button>
                ))}
              </div>
            ))}
            {customDevices.length > 0 && (
              <div>
                <div className={`px-3 py-1.5 text-[9px] uppercase tracking-wider ${isLG ? 'text-emerald-400/30' : 'text-white/20'}`}>
                  {t('preview.settings.customDevices', 'designer')}
                </div>
                {customDevices.map(device => (
                  <button
                    key={device.id}
                    onClick={() => { setActiveDevice(device); setOpen(false) }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors ${
                      activeDevice.id === device.id
                        ? isLG ? 'bg-emerald-500/[0.08] text-emerald-300/80' : 'bg-white/[0.06] text-white/80'
                        : 'text-white/50 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-[11px]">{device.name}</span>
                    <span className="text-[9px] text-white/20">{device.width}x{device.height}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// Preview Settings Panel
// ============================================

function PreviewSettingsPanel({ isLG, t, onClose }: {
  isLG: boolean; t: (key: string, nsOrOpts?: any, opts?: any) => string; onClose: () => void
}) {
  const {
    mode, setMode, autoRefresh, setAutoRefresh, refreshInterval, setRefreshInterval,
    previewDelay, setPreviewDelay,
    scrollSyncEnabled, toggleScrollSync,
    customDevices, addCustomDevice, removeCustomDevice,
  } = usePreviewStore()

  const [showAddDevice, setShowAddDevice] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [deviceWidth, setDeviceWidth] = useState(375)
  const [deviceHeight, setDeviceHeight] = useState(812)

  const handleAddDevice = () => {
    if (!deviceName.trim()) {return}
    addCustomDevice({ name: deviceName.trim(), width: deviceWidth, height: deviceHeight })
    setDeviceName('')
    setDeviceWidth(375)
    setDeviceHeight(812)
    setShowAddDevice(false)
  }

  return (
    <div
      className={`border-b shrink-0 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}
      style={{ background: isLG ? 'rgba(10,15,10,0.5)' : 'rgba(14,14,20,0.6)' }}
    >
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/50">{t('preview.settings', 'designer')}</span>
          <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>

        {/* Mode */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-white/30">{t('preview.settings.mode', 'designer')}</span>
          <div className="grid grid-cols-4 gap-1">
            {(['realtime', 'manual', 'delayed', 'smart'] as PreviewMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2 py-1 rounded text-[10px] transition-colors ${
                  mode === m
                    ? isLG ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-white/[0.08] text-white/70 border border-white/[0.1]'
                    : 'bg-white/[0.02] text-white/30 border border-transparent hover:border-white/[0.06]'
                }`}
              >
                {t(`preview.mode.${m}`, 'designer')}
              </button>
            ))}
          </div>
        </div>

        {/* Delay */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/30 shrink-0">{t('preview.settings.delay', 'designer')}</span>
          <input type="range" min={100} max={2000} step={100} value={previewDelay} onChange={e => setPreviewDelay(Number(e.target.value))} className="flex-1 h-1 appearance-none bg-white/[0.08] rounded-full accent-emerald-500" />
          <span className="text-[10px] text-white/25 min-w-[36px] text-right">{previewDelay}ms</span>
        </div>

        {/* Auto-refresh */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="w-3 h-3 accent-emerald-500 rounded" />
            <span className="text-[10px] text-white/30">{t('preview.settings.autoRefresh', 'designer')}</span>
          </label>
          {autoRefresh && (
            <div className="flex items-center gap-1">
              <input type="number" min={1000} max={60000} step={1000} value={refreshInterval} onChange={e => setRefreshInterval(Number(e.target.value))} className="w-16 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/50 outline-none" />
              <span className="text-[9px] text-white/20">ms</span>
            </div>
          )}
        </div>

        {/* Scroll Sync */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={scrollSyncEnabled} onChange={toggleScrollSync} className="w-3 h-3 accent-emerald-500 rounded" />
            <span className="text-[10px] text-white/30">{t('preview.settings.scrollSync', 'designer')}</span>
          </label>
          <Link2 className={`w-3 h-3 ${scrollSyncEnabled ? (isLG ? 'text-emerald-400/60' : 'text-cyan-400/60') : 'text-white/15'}`} />
        </div>

        {/* Custom Devices */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30">{t('preview.settings.customDevices', 'designer')}</span>
            <button
              onClick={() => setShowAddDevice(!showAddDevice)}
              className={`p-0.5 rounded transition-colors ${showAddDevice ? 'text-emerald-400/60' : 'text-white/20 hover:text-white/40'}`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {showAddDevice && (
            <div className="space-y-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <input
                autoFocus
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                placeholder={t('preview.settings.deviceName', 'designer')}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-[10px] text-white/60 outline-none focus:border-emerald-500/30 placeholder:text-white/15"
                onKeyDown={e => { if (e.key === 'Enter') {handleAddDevice();} if (e.key === 'Escape') {setShowAddDevice(false)} }}
              />
              <div className="flex gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[9px] text-white/20">W</span>
                  <input type="number" min={200} max={3840} value={deviceWidth} onChange={e => setDeviceWidth(Number(e.target.value))} className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 text-[10px] text-white/50 outline-none" />
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[9px] text-white/20">H</span>
                  <input type="number" min={200} max={3840} value={deviceHeight} onChange={e => setDeviceHeight(Number(e.target.value))} className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 text-[10px] text-white/50 outline-none" />
                </div>
                <button onClick={handleAddDevice} className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                  {t('preview.settings.add', 'designer')}
                </button>
              </div>
            </div>
          )}

          {customDevices.length > 0 && (
            <div className="space-y-0.5">
              {customDevices.map(d => (
                <div key={d.id} className="flex items-center justify-between px-2 py-1 rounded bg-white/[0.02] text-[10px]">
                  <span className="text-white/40">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/20">{d.width}x{d.height}</span>
                    <button onClick={() => removeCustomDevice(d.id)} className="text-white/15 hover:text-red-400/60 transition-colors"><Trash2 className="w-2.5 h-2.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Preview History Panel
// ============================================

function PreviewHistoryPanel({ isLG, t, onClose }: {
  isLG: boolean; t: (key: string, nsOrOpts?: any, opts?: any) => string; onClose: () => void
}) {
  const { history, historyIndex, goToHistory, clearHistory, saveSnapshot } = usePreviewStore()

  return (
    <div
      className={`border-b shrink-0 max-h-48 overflow-y-auto ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}
      style={{ background: isLG ? 'rgba(10,15,10,0.5)' : 'rgba(14,14,20,0.6)' }}
    >
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-white/50">{t('preview.history', 'designer')} ({history.length})</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { const l = prompt(t('preview.history.labelPrompt', 'designer')) || ''; if (l) {saveSnapshot(l)} }}
              className="p-1 rounded text-white/20 hover:text-white/50 transition-colors"
              title={t('preview.history.save', 'designer')}
            >
              <Save className="w-3 h-3" />
            </button>
            <button onClick={clearHistory} className="p-1 rounded text-white/20 hover:text-red-400/50 transition-colors" title={t('preview.history.clear', 'designer')}>
              <Trash2 className="w-3 h-3" />
            </button>
            <button onClick={onClose} className="p-1 rounded text-white/20 hover:text-white/50 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-[10px] text-white/15 text-center py-4">{t('preview.history.empty', 'designer')}</div>
        ) : (
          <div className="space-y-0.5">
            {history.slice().reverse().map((entry, i) => {
              const realIdx = history.length - 1 - i
              const isActive = realIdx === historyIndex
              const time = new Date(entry.timestamp)
              return (
                <button
                  key={entry.id}
                  onClick={() => goToHistory(realIdx)}
                  className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors ${
                    isActive
                      ? isLG ? 'bg-emerald-500/[0.08] text-emerald-300/70' : 'bg-white/[0.06] text-white/70'
                      : 'text-white/30 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-400' : 'bg-white/10'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] truncate block">
                      {entry.label || `${entry.language} — ${entry.code.substring(0, 40).replace(/\n/g, ' ')}...`}
                    </span>
                  </div>
                  <span className="text-[9px] text-white/15 shrink-0">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Preview Console
// ============================================

function PreviewConsole({ isLG, t }: { isLG: boolean; t: (key: string, nsOrOpts?: any, opts?: any) => string }) {
  const { consoleEntries, clearConsole } = usePreviewStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {scrollRef.current.scrollTop = scrollRef.current.scrollHeight}
  }, [consoleEntries])

  const levelMap: Record<ConsoleLevel, { icon: React.ElementType; color: string }> = {
    log: { icon: ChevronRight, color: 'text-white/50' },
    info: { icon: Info, color: isLG ? 'text-emerald-400/60' : 'text-blue-400/60' },
    warn: { icon: AlertTriangle, color: 'text-amber-400/70' },
    error: { icon: AlertCircle, color: 'text-red-400/70' },
    debug: { icon: Bug, color: 'text-purple-400/60' },
  }

  return (
    <div
      className={`h-36 border-t shrink-0 flex flex-col ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.06]'}`}
      style={{ background: isLG ? 'rgba(8,12,8,0.85)' : 'rgba(10,10,18,0.95)' }}
    >
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-white/25" />
          <span className="text-[10px] text-white/40">{t('preview.console', 'designer')}</span>
          {consoleEntries.length > 0 && (
            <span className="text-[9px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded">{consoleEntries.length}</span>
          )}
        </div>
        <button onClick={clearConsole} className="p-1 rounded text-white/15 hover:text-white/40 transition-colors" title={t('preview.console.clear', 'designer')}>
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto font-mono">
        {consoleEntries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] text-white/10">{t('preview.console.empty', 'designer')}</div>
        ) : (
          consoleEntries.map(entry => {
            const { icon: Icon, color } = levelMap[entry.level]
            return (
              <div
                key={entry.id}
                className={`flex items-start gap-2 px-3 py-0.5 border-b border-white/[0.02] ${color} ${
                  entry.level === 'error' ? 'bg-red-500/[0.03]' : entry.level === 'warn' ? 'bg-amber-500/[0.02]' : ''
                }`}
              >
                <Icon className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="text-[11px] whitespace-pre-wrap break-all flex-1">{entry.message}</span>
                {entry.count > 1 && <span className="text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded-full shrink-0">{entry.count}</span>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ============================================
// Preview Error Display
// ============================================

function PreviewErrorDisplay({ error, t }: {
  error: { message: string; line?: number; column?: number; stack?: string }
  t: (key: string, nsOrOpts?: any, opts?: any) => string
}) {
  return (
    <div className="bg-white p-6 min-h-[400px]">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-700">{t('preview.compileError', 'designer')}</p>
          <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap font-mono break-all">{error.message}</pre>
          {error.line && <p className="text-[10px] text-red-400 mt-1">Line {error.line}{error.column ? `, Col ${error.column}` : ''}</p>}
          {error.stack && (
            <details className="mt-2">
              <summary className="text-[10px] text-red-400 cursor-pointer">Stack trace</summary>
              <pre className="text-[10px] text-red-400/70 mt-1 whitespace-pre-wrap">{error.stack}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Preview Empty State
// ============================================

function PreviewEmptyState({ t }: { t: (key: string, nsOrOpts?: any, opts?: any) => string }) {
  return (
    <div className="bg-white p-6 min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <Code2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">{t('preview.selectFile', 'designer')}</p>
        <p className="text-xs text-gray-300 mt-1">{t('preview.supportedFormats', 'designer')}</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          {['HTML', 'CSS', 'JSX', 'TSX', 'MD', 'SVG', 'JSON'].map(ext => (
            <span key={ext} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 border border-gray-200">.{ext.toLowerCase()}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Mock Dashboard
// ============================================

function MockDashboard({ t }: { t: (key: string, nsOrOpts?: any, opts?: any) => string }) {
  return (
    <div className="bg-white p-6 min-h-[400px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg text-gray-900">{t('preview.mock.title', 'designer')}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t('preview.mock.subtitle', 'designer')}</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50">{t('preview.refresh', 'designer')}</button>
            <button className="px-3 py-1.5 text-xs rounded-md bg-gray-900 text-white hover:bg-gray-800">{t('preview.mock.export', 'designer')}</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('preview.mock.totalUsers', 'designer'), value: '12,345', change: '+12.5%', positive: true },
            { label: t('preview.mock.activeUsers', 'designer'), value: '8,901', change: '+8.3%', positive: true },
            { label: t('preview.mock.revenue', 'designer'), value: '$123,456', change: '-2.1%', positive: false },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className="text-xl text-gray-900 mt-1">{stat.value}</p>
              <p className={`text-xs mt-2 ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>{stat.change} {t('preview.mock.vsLastMonth', 'designer')}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="border border-gray-100 rounded-lg p-4">
          <h3 className="text-sm text-gray-700 mb-4">{t('preview.mock.growthTrend', 'designer')}</h3>
          <div className="flex items-end gap-2 h-32">
            {[40, 55, 45, 70, 60, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t bg-gradient-to-t from-violet-500 to-indigo-400 transition-all" style={{ height: `${h}%` }} />
                <span className="text-[8px] text-gray-300">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 text-xs bg-gray-50 border-b border-gray-100">
            <div className="p-3 text-gray-500">{t('preview.mock.colUser', 'designer')}</div>
            <div className="p-3 text-gray-500">{t('preview.mock.colAction', 'designer')}</div>
            <div className="p-3 text-gray-500">{t('preview.mock.colAmount', 'designer')}</div>
            <div className="p-3 text-gray-500">{t('preview.mock.colStatus', 'designer')}</div>
          </div>
          {[
            { user: 'Alice', action: t('preview.mock.purchase', 'designer'), amount: '$299', status: t('preview.mock.completed', 'designer'), ok: true },
            { user: 'Bob', action: t('preview.mock.refund', 'designer'), amount: '$199', status: t('preview.mock.processing', 'designer'), ok: false },
            { user: 'Charlie', action: t('preview.mock.purchase', 'designer'), amount: '$599', status: t('preview.mock.completed', 'designer'), ok: true },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-4 text-xs border-b border-gray-50 last:border-0">
              <div className="p-3 text-gray-700">{row.user}</div>
              <div className="p-3 text-gray-500">{row.action}</div>
              <div className="p-3 text-gray-700">{row.amount}</div>
              <div className="p-3">
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${row.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{row.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
