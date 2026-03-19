/**
 * @file LivePreview.tsx
 * @description 增强型浏览器端代码编译 & 实时预览引擎 — 支持多语言渲染、滚动同步、快照导出、Tailwind CDN
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.3.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview,iframe,babel,tailwind,scroll-sync,snapshot-export,live-preview
 *
 * Capabilities:
 *   - JSX / TSX / JS / TS  → @babel/standalone transpilation
 *   - HTML / CSS / SVG / JSON / Markdown direct rendering
 *   - Preview modes: realtime · manual · delayed · smart
 *   - Console output capture (log / warn / error / info) via postMessage
 *   - Device simulation: desktop · tablet · mobile · custom · multi-device
 *   - Preview history with undo / redo / restore
 *   - Performance metrics (render time)
 *   - Responsive grid overlay
 *   - Execution timeout (5 s) for infinite-loop protection
 *   - Tailwind CSS CDN integration for full utility class rendering
 *   - Scroll sync: editor line ↔ preview scroll ratio mapping
 *   - Snapshot export: PNG (via print) / HTML file download
 *   - Settings drawer (delay, theme)
 *   - Fullscreen mode
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  Play, RotateCcw, Maximize2, Minimize2, AlertTriangle,
  Monitor, Smartphone, Tablet, Check, Loader,
  Terminal, X, ChevronDown, Clock, Zap,
  Grid3X3, History, Undo2, Redo2, Pause,
  Trash2, Copy, LayoutGrid, Ruler,
  Camera, FileDown, ExternalLink, Link2, Link2Off,
  type LucideIcon,
} from 'lucide-react';

/* ================================================================
   Babel lazy loader — with CDN fallback
   ================================================================ */
let _babelReady = false;
let _babelPromise: Promise<void> | null = null;

function ensureBabel(): Promise<void> {
  if (_babelReady) return Promise.resolve();
  if (_babelPromise) return _babelPromise;
  _babelPromise = import('@babel/standalone')
    .then((mod) => {
      (window as any).__Babel = mod;
      _babelReady = true;
    })
    .catch(() => {
      // CDN fallback if dynamic import fails
      return new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/@babel/standalone@7/babel.min.js';
        s.onload = () => {
          (window as any).__Babel = (window as any).Babel;
          _babelReady = true;
          resolve();
        };
        s.onerror = () => reject(new Error('Babel CDN fallback also failed'));
        document.head.appendChild(s);
      });
    });
  return _babelPromise;
}

interface TranspileResult { code: string | null; error: string | null }

function transpileCode(source: string): TranspileResult {
  const Babel = (window as any).__Babel;
  if (!Babel) return { code: null, error: 'Babel not loaded' };
  try {
    const transform = Babel.transform || Babel.default?.transform;
    if (!transform) return { code: null, error: 'Babel transform not available' };
    const result = transform(source, {
      presets: ['react', 'typescript'],
      filename: 'preview.tsx',
    });
    return { code: result.code, error: null };
  } catch (err: any) {
    return { code: null, error: err.message || String(err) };
  }
}

/* ================================================================
   Language detection
   ================================================================ */
type PreviewLang = 'react' | 'html' | 'css' | 'javascript' | 'markdown' | 'svg' | 'json';

function detectLang(code: string, hint?: string): PreviewLang {
  if (hint === 'html' || hint === 'htm') return 'html';
  if (hint === 'css' || hint === 'scss' || hint === 'less') return 'css';
  if (hint === 'markdown' || hint === 'md') return 'markdown';
  if (hint === 'svg') return 'svg';
  if (hint === 'json') return 'json';
  const t = code.trim();
  if (t.startsWith('<!DOCTYPE') || t.startsWith('<!doctype') || t.startsWith('<html')) return 'html';
  if (t.startsWith('<svg')) return 'svg';
  if (/^(#|\*|>|- |1\.)/.test(t) && !t.includes('import ') && !t.includes('function ')) return 'markdown';
  if (/^[.#@[\w]/.test(t) && !t.includes('import') && !t.includes('=>') && t.includes('{') && t.includes('}') && t.includes(':')) return 'css';
  if (hint === 'javascript' || hint === 'js') {
    if (t.includes('React') || t.includes('jsx') || t.includes('useState') || t.includes('export default')) return 'react';
    return 'javascript';
  }
  return 'react';
}

/* ================================================================
   Markdown renderer (simple)
   ================================================================ */
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#e5e7eb">$1</h3>')
    .replace(/^## (.*$)/gm,  '<h2 style="font-size:20px;font-weight:600;margin:20px 0 10px;color:#e5e7eb">$1</h2>')
    .replace(/^# (.*$)/gm,   '<h1 style="font-size:24px;font-weight:700;margin:24px 0 12px;color:#f3f4f6">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:600;color:#e5e7eb">$1</strong>')
    .replace(/\*(.*?)\*/g,     '<em>$1</em>')
    .replace(/`([^`]+)`/g,    '<code style="background:rgba(99,102,241,.15);padding:2px 6px;border-radius:4px;font-size:13px;font-family:monospace;color:#a5b4fc">$1</code>')
    .replace(/^- (.*$)/gm,    '<li style="margin:4px 0;padding-left:8px">$1</li>')
    .replace(/^\d+\. (.*$)/gm,'<li style="margin:4px 0;padding-left:8px">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/^> (.*$)/gm, '<blockquote style="border-left:3px solid rgba(99,102,241,.4);padding:8px 16px;margin:12px 0;color:rgba(255,255,255,.5);background:rgba(99,102,241,.05);border-radius:0 8px 8px 0">$1</blockquote>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,.08);margin:16px 0"/>');
}

/* ================================================================
   Shared style / script fragments for generated HTML
   ================================================================ */
const BASE_CSS = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0b10;color:#e5e7eb;padding:16px;min-height:100vh}.flex{display:flex}.flex-col{flex-direction:column}.items-center{align-items:center}.justify-center{justify-content:center}.gap-2{gap:8px}.gap-3{gap:12px}.gap-4{gap:16px}.p-2{padding:8px}.p-3{padding:12px}.p-4{padding:16px}.px-4{padding-left:16px;padding-right:16px}.py-2{padding-top:8px;padding-bottom:8px}.rounded{border-radius:6px}.rounded-lg{border-radius:12px}.rounded-xl{border-radius:16px}.bg-indigo-500{background:#6366f1}.bg-emerald-500{background:#10b981}.bg-rose-500{background:#f43f5e}.text-white{color:#fff}.text-sm{font-size:14px}.text-xs{font-size:12px}.text-lg{font-size:18px}.font-bold{font-weight:700}.font-medium{font-weight:500}.w-full{width:100%}.h-full{height:100%}.border{border:1px solid rgba(255,255,255,.1)}.shadow-lg{box-shadow:0 10px 15px -3px rgba(0,0,0,.3)}.space-y-2>*+*{margin-top:8px}.space-y-3>*+*{margin-top:12px}.space-y-4>*+*{margin-top:16px}.text-center{text-align:center}.cursor-pointer{cursor:pointer}.overflow-hidden{overflow:hidden}.min-h-screen{min-height:100vh}button{cursor:pointer;border:none;font:inherit}input,textarea,select{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px 12px;color:#e5e7eb;font:inherit;outline:none;width:100%}input:focus,textarea:focus,select:focus{border-color:rgba(99,102,241,.5)}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.06)}th{color:rgba(255,255,255,.4);font-size:12px;font-weight:500}.preview-error{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.25);border-radius:12px;padding:16px;color:#fda4af;font-size:13px;white-space:pre-wrap;word-break:break-word;font-family:'SF Mono',Monaco,monospace}`;

/* Console capture – injected into every iframe */
const CONSOLE_JS = `(function(){var O=console.log,W=console.warn,E=console.error,I=console.info;function s(l,a){try{var m=Array.prototype.map.call(a,function(x){if(typeof x==='object')try{return JSON.stringify(x,null,2)}catch(e){return String(x)}return String(x)}).join(' ');window.parent.postMessage({type:'__pc__',level:l,message:m,ts:Date.now()},'*')}catch(e){}}console.log=function(){s('log',arguments);O.apply(console,arguments)};console.warn=function(){s('warn',arguments);W.apply(console,arguments)};console.error=function(){s('error',arguments);E.apply(console,arguments)};console.info=function(){s('info',arguments);I.apply(console,arguments)};window.addEventListener('error',function(e){s('error',[e.message+' at '+e.filename+':'+e.lineno])});window.addEventListener('unhandledrejection',function(e){s('error',['Unhandled: '+e.reason])})})();`;

/* Performance reporter */
const PERF_JS = `window.addEventListener('load',function(){window.parent.postMessage({type:'__pp__',rt:Math.round(performance.now())},'*')});`;

/* Execution timeout (5 s) — posts a message then reloads */
const TIMEOUT_JS = `var __to=setTimeout(function(){document.getElementById('root')&&(document.getElementById('root').innerHTML='<div class="preview-error">Execution timeout (5 s)</div>');window.parent.postMessage({type:'__pc__',level:'error',message:'Execution timeout (5 s)',ts:Date.now()},'*')},5000);window.addEventListener('load',function(){clearTimeout(__to)});`;

/* Scroll sync — reports scroll ratio to parent & accepts scroll commands */
const SCROLL_SYNC_JS = `(function(){window.addEventListener('scroll',function(){var st=document.documentElement.scrollTop||document.body.scrollTop;var sh=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);var ch=document.documentElement.clientHeight;var r=sh>ch?st/(sh-ch):0;window.parent.postMessage({type:'__ps__',ratio:r},'*')});window.addEventListener('message',function(e){if(e.data&&e.data.type==='__scroll__'){var sh=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);var ch=document.documentElement.clientHeight;var t=e.data.ratio*(sh-ch);window.scrollTo({top:t,behavior:'smooth'})}})})();`;

/* Tailwind CSS CDN — Play CDN for full utility class support */
const TAILWIND_CDN = '<script src="https://cdn.tailwindcss.com"><' + '/script><script>tailwind.config={darkMode:"class",theme:{extend:{}}}<' + '/script>';

/** Safe script tag builder — avoids escaping issues with closing tags */
function scriptTag(js: string): string {
  return '<script>' + js + '<' + '/script>';
}

/* ================================================================
   HTML builders per language
   ================================================================ */
function buildReactHTML(transpiledCode: string, tw = true): string {
  const wrap = `(function(){var exports={};var module={exports:exports};${transpiledCode};var C=module.exports.default||module.exports.App||module.exports.Main||module.exports.Component||exports.default||exports.App||exports.Main;if(typeof C==='function'){ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(C))}else{var ns=Object.keys(exports).filter(function(k){return/^[A-Z]/.test(k)});if(ns.length>0&&typeof exports[ns[0]]==='function'){ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(exports[ns[0]]))}else{document.getElementById('root').innerHTML='<div class="preview-error">No renderable component found. Export a default component.</div>'}}})();`;
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>',
    '<style>' + BASE_CSS + '</style>',
    tw ? TAILWIND_CDN : '',
    scriptTag(CONSOLE_JS),
    scriptTag(TIMEOUT_JS),
    scriptTag(SCROLL_SYNC_JS),
    '<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin><' + '/script>',
    '<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin><' + '/script>',
    '</head><body><div id="root"></div>',
    '<script>var _R=React;var useState=_R.useState,useEffect=_R.useEffect,useRef=_R.useRef,useCallback=_R.useCallback,useMemo=_R.useMemo,createElement=_R.createElement,Fragment=_R.Fragment;try{' + wrap + '}catch(e){document.getElementById("root").innerHTML=\'<div class="preview-error">Runtime Error:\\n\'+String(e).replace(/</g,"&lt;")+\'</div>\';console.error(e)}<' + '/script>',
    scriptTag(PERF_JS),
    '</body></html>',
  ].join('');
}

function buildHTMLPreview(code: string, tw = true): string {
  const twTag = tw ? TAILWIND_CDN : '';
  const trimmed = code.trim().toLowerCase();
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    // Inject our helpers before </head>
    return code.replace(/<\/head>/i, twTag + scriptTag(CONSOLE_JS) + scriptTag(SCROLL_SYNC_JS) + scriptTag(PERF_JS) + '</head>');
  }
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>',
    '<style>' + BASE_CSS + '</style>',
    twTag,
    scriptTag(CONSOLE_JS),
    scriptTag(SCROLL_SYNC_JS),
    '</head><body>',
    code,
    scriptTag(PERF_JS),
    '</body></html>',
  ].join('');
}

function buildCSSPreview(code: string, tw = true): string {
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"/>',
    '<style>' + BASE_CSS + '\n' + code + '</style>',
    tw ? TAILWIND_CDN : '',
    scriptTag(CONSOLE_JS),
    scriptTag(SCROLL_SYNC_JS),
    '</head><body>',
    '<div style="padding:24px"><h1 style="font-size:24px;font-weight:700;margin-bottom:16px">CSS Preview</h1>',
    '<div class="demo-box" style="padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,.1)">',
    '<p>This is a paragraph element.</p>',
    '<button style="margin-top:12px;padding:8px 16px;border-radius:8px;background:#6366f1;color:#fff">Button</button>',
    '<input type="text" placeholder="Input field" style="margin-top:12px"/>',
    '<div style="display:flex;gap:8px;margin-top:12px"><div style="width:60px;height:60px;border-radius:8px;background:#6366f1"></div><div style="width:60px;height:60px;border-radius:8px;background:#10b981"></div><div style="width:60px;height:60px;border-radius:8px;background:#f43f5e"></div></div>',
    '<ul style="margin-top:12px;padding-left:20px"><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>',
    '<table style="margin-top:12px"><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody><tr><td>Alpha</td><td>100</td></tr><tr><td>Beta</td><td>200</td></tr></tbody></table>',
    '</div></div>',
    scriptTag(PERF_JS),
    '</body></html>',
  ].join('');
}

function buildMarkdownPreview(code: string): string {
  const html = renderMarkdown(code);
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"/>',
    '<style>body{font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;background:#0a0b10;color:#d1d5db;padding:32px;line-height:1.7;max-width:800px;margin:0 auto}a{color:#818cf8}code{background:rgba(99,102,241,.15);padding:2px 6px;border-radius:4px;font-family:\'SF Mono\',Monaco,monospace}pre{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:16px;overflow-x:auto;margin:12px 0}pre code{background:none;padding:0}</style>',
    scriptTag(CONSOLE_JS),
    scriptTag(SCROLL_SYNC_JS),
    '</head><body>',
    html,
    scriptTag(PERF_JS),
    '</body></html>',
  ].join('');
}

function buildJSPreview(code: string): string {
  const jsBody = [
    'var _o=document.getElementById("output");',
    'function _a(t,c){var d=document.createElement("div");d.className="log-line "+(c||"");d.textContent=t;_o.appendChild(d)}',
    'var _cl=console.log,_cw=console.warn,_ce=console.error;',
    'console.log=function(){var m=Array.prototype.map.call(arguments,String).join(" ");_a(m);_cl.apply(console,arguments)};',
    'console.warn=function(){var m=Array.prototype.map.call(arguments,String).join(" ");_a(m,"warn");_cw.apply(console,arguments)};',
    'console.error=function(){var m=Array.prototype.map.call(arguments,String).join(" ");_a(m,"error");_ce.apply(console,arguments)};',
    'try{' + code + '}catch(e){_a("Error: "+e.message,"error");console.error(e)}',
  ].join('');
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"/>',
    '<style>' + BASE_CSS + '#output{font-family:\'SF Mono\',Monaco,monospace;font-size:13px;line-height:1.6;padding:16px}.log-line{padding:4px 8px;border-bottom:1px solid rgba(255,255,255,.04)}.log-line.error{color:#fda4af;background:rgba(244,63,94,.05)}.log-line.warn{color:#fcd34d;background:rgba(234,179,8,.05)}</style>',
    scriptTag(CONSOLE_JS),
    scriptTag(TIMEOUT_JS),
    scriptTag(SCROLL_SYNC_JS),
    '</head><body><div id="output"></div>',
    scriptTag(jsBody),
    scriptTag(PERF_JS),
    '</body></html>',
  ].join('');
}

function buildSVGPreview(code: string): string {
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"/>',
    '<style>body{background:#0a0b10;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}</style>',
    scriptTag(CONSOLE_JS),
    scriptTag(SCROLL_SYNC_JS),
    '</head><body>',
    code,
    scriptTag(PERF_JS),
    '</body></html>',
  ].join('');
}

function buildJSONPreview(code: string): string {
  let f = code;
  try { f = JSON.stringify(JSON.parse(code), null, 2); } catch {}
  const escaped = f.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/"([^"]+)"(?=\s*:)/g, '<span class="k">"$1"</span>')
    .replace(/:\s*"([^"]*)"/g, ': <span class="s">"$1"</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="n">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="b">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="u">$1</span>');
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"/>',
    '<style>body{background:#0a0b10;color:#d1d5db;font-family:\'SF Mono\',Monaco,monospace;padding:24px;font-size:13px;line-height:1.6}.k{color:#818cf8}.s{color:#34d399}.n{color:#fbbf24}.b{color:#f472b6}.u{color:#6b7280}</style>',
    scriptTag(CONSOLE_JS),
    scriptTag(SCROLL_SYNC_JS),
    '</head><body><pre>',
    escaped,
    '</pre>',
    scriptTag(PERF_JS),
    '</body></html>',
  ].join('');
}

/** Build HTML for a given source + language */
function buildPreview(src: string, lang: PreviewLang, babelLoaded: boolean, tw = true): { html: string; error: string | null } {
  if (lang === 'html')       return { html: buildHTMLPreview(src, tw), error: null };
  if (lang === 'css')        return { html: buildCSSPreview(src, tw), error: null };
  if (lang === 'markdown')   return { html: buildMarkdownPreview(src), error: null };
  if (lang === 'svg')        return { html: buildSVGPreview(src), error: null };
  if (lang === 'json')       return { html: buildJSONPreview(src), error: null };
  if (lang === 'javascript') return { html: buildJSPreview(src), error: null };
  // react / typescript
  if (!babelLoaded) return { html: '', error: 'Babel not loaded' };
  const r = transpileCode(src);
  if (r.error) return { html: '', error: r.error };
  return { html: buildReactHTML(r.code!, tw), error: null };
}

/* ================================================================
   Device presets
   ================================================================ */
interface DevicePreset { id: string; label: string; icon: LucideIcon; width: number | null; /* null = 100 % */ }

const DEVICES: DevicePreset[] = [
  { id: 'desktop',  label: '桌面',          icon: Monitor,    width: null },
  { id: 'tablet',   label: '平板 (768px)',  icon: Tablet,     width: 768 },
  { id: 'mobile',   label: '手机 (375px)',  icon: Smartphone, width: 375 },
];

/* ================================================================
   Shared types
   ================================================================ */
interface ConsoleEntry { id: number; level: 'log'|'warn'|'error'|'info'; message: string; ts: number }
interface Snapshot { id: number; code: string; ts: number; rt?: number }

/* ================================================================
   TipIcon (local helper)
   ================================================================ */
function Tip({ icon: Icon, tip, size = 12, className = '', active = false, disabled = false, onClick }: {
  icon: React.ElementType; tip: string; size?: number; className?: string; active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <div className="relative group/tip inline-flex">
      <button onClick={disabled ? undefined : onClick}
        className={`p-1 rounded-md transition-all duration-150 ${disabled ? 'opacity-30 cursor-default' : 'hover:bg-white/[0.08] cursor-pointer'} ${active ? 'bg-white/[0.08] text-indigo-400' : ''} ${className}`}>
        <Icon size={size} />
      </button>
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] bg-black/95 text-white/90 whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] border border-white/10">
        {tip}
      </div>
    </div>
  );
}

/* ================================================================
   PreviewConsole
   ================================================================ */
function PreviewConsole({ entries, onClear }: { entries: ConsoleEntry[]; onClear: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [entries.length]);
  const colors: Record<string, string> = { log: 'text-white/50', info: 'text-cyan-400/70', warn: 'text-amber-400/70', error: 'text-red-400/70' };
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1.5">
          <Terminal size={11} className="text-white/30" />
          <span className="text-[10px] text-white/40" style={{ fontWeight: 500 }}>控制台</span>
          {entries.length > 0 && <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">{entries.length}</span>}
        </div>
        <div className="flex items-center gap-1">
          <Tip icon={Copy} tip="复制" size={10} className="text-white/20" onClick={() => navigator.clipboard?.writeText(entries.map(e => '[' + e.level + '] ' + e.message).join('\n'))} />
          <Tip icon={Trash2} tip="清除" size={10} className="text-white/20" onClick={onClear} />
        </div>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[10px]" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,.06) transparent' }}>
        {entries.length === 0
          ? <div className="flex items-center justify-center h-full"><span className="text-[10px] text-white/15">No output</span></div>
          : entries.map(e => (
            <div key={e.id} className={'flex items-start gap-2 py-0.5 border-b border-white/[0.02] ' + (colors[e.level] || 'text-white/50')}>
              <span className="text-[8px] text-white/15 shrink-0 mt-0.5 w-[52px]">{new Date(e.ts).toLocaleTimeString('zh-CN', { hour12: false })}</span>
              <span className="text-[8px] w-7 shrink-0" style={{ fontWeight: 500 }}>{e.level === 'error' ? 'ERR' : e.level === 'warn' ? 'WRN' : e.level === 'info' ? 'INF' : 'LOG'}</span>
              <span className="flex-1 break-all whitespace-pre-wrap">{e.message}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ================================================================
   PreviewHistoryPanel
   ================================================================ */
function HistoryPanel({ history, idx, onRestore, onClose }: { history: Snapshot[]; idx: number; onRestore: (i: number) => void; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#0d0e14] border-l border-white/[0.04]" style={{ width: 210 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1.5"><History size={11} className="text-violet-400/70" /><span className="text-[10px] text-white/50" style={{ fontWeight: 500 }}>预览历史</span></div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/[0.06]"><X size={10} className="text-white/30" /></button>
      </div>
      <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
        {history.length === 0
          ? <div className="px-3 py-6 text-center"><History size={20} className="text-white/10 mx-auto mb-2" /><p className="text-[10px] text-white/20">暂无记录</p></div>
          : history.map((s, i) => (
            <button key={s.id} onClick={() => onRestore(i)}
              className={'w-full text-left px-3 py-2 border-b border-white/[0.02] transition-colors ' + (i === idx ? 'bg-indigo-500/10 border-l-2 border-l-indigo-400' : 'hover:bg-white/[0.03] border-l-2 border-l-transparent')}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/50" style={{ fontWeight: 500 }}>#{history.length - i}</span>
                <span className="text-[8px] text-white/20">{new Date(s.ts).toLocaleTimeString('zh-CN', { hour12: false })}</span>
              </div>
              {s.rt !== undefined && <span className="text-[8px] text-emerald-400/40">{s.rt}ms</span>}
              <p className="text-[9px] text-white/25 mt-0.5 truncate font-mono">{s.code.slice(0, 50)}...</p>
            </button>
          ))}
      </div>
    </div>
  );
}

/* ================================================================
   Multi-Device Frame — renders the same HTML in multiple widths
   ================================================================ */
function MultiDeviceFrame({ html }: { html: string }) {
  const widths = [
    { label: '桌面', w: '100%' },
    { label: '平板 768px', w: '768px' },
    { label: '手机 375px', w: '375px' },
  ];
  return (
    <div className="flex-1 flex gap-3 overflow-x-auto p-3 bg-[#080910] items-start">
      {widths.map((d) => (
        <div key={d.label} className="flex flex-col shrink-0" style={{ width: d.w === '100%' ? '50%' : d.w, minWidth: 200 }}>
          <div className="text-[9px] text-white/30 mb-1 px-1">{d.label}</div>
          <div className="border border-white/[0.06] rounded-lg overflow-hidden shadow-xl" style={{ height: 420 }}>
            <iframe srcDoc={html} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title={d.label} style={{ background: '#0a0b10' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   Exported types & component
   ================================================================ */
export type PreviewMode = 'realtime' | 'manual' | 'delayed' | 'smart';

export interface LivePreviewProps {
  code: string;
  language?: string;
  autoRefresh?: boolean;
  debounceMs?: number;
  mode?: PreviewMode;
  showConsole?: boolean;
  /** Enable Tailwind CSS CDN in preview (default: true) */
  enableTailwind?: boolean;
  /** Incoming scroll ratio from editor (0–1) for scroll sync */
  scrollRatio?: number;
  /** Callback when preview scrolls — reports ratio (0–1) back to editor */
  onScrollRatioChange?: (ratio: number) => void;
}

export function LivePreview({
  code,
  language = 'typescript',
  autoRefresh = true,
  debounceMs = 600,
  mode: modeProp,
  showConsole: showConsoleProp = false,
  enableTailwind = true,
  scrollRatio: scrollRatioProp,
  onScrollRatioChange,
}: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [babelLoaded, setBabelLoaded] = useState(_babelReady);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<string>('desktop');
  const [customWidth, setCustomWidth] = useState(1024);
  const [fullscreen, setFullscreen] = useState(false);
  const [lastRendered, setLastRendered] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preview mode
  const [previewMode, setPreviewMode] = useState<PreviewMode>(modeProp || (autoRefresh ? 'realtime' : 'manual'));
  const [showModeMenu, setShowModeMenu] = useState(false);
  const modeRef = useRef<HTMLDivElement>(null);

  // Sync external mode prop changes
  useEffect(() => {
    if (modeProp) setPreviewMode(modeProp);
  }, [modeProp]);

  // Console
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [showConsole, setShowConsole] = useState(showConsoleProp);
  const cid = useRef(0);

  // History
  const historyRef = useRef<Snapshot[]>([]);
  const [historyVer, setHistoryVer] = useState(0);            // force re-render
  const idxRef = useRef(-1);
  const sid = useRef(0);
  const [showHistory, setShowHistory] = useState(false);

  // Performance
  const [renderTime, setRenderTime] = useState<number | null>(null);

  // Grid / Multi-device / Paused
  const [showGrid, setShowGrid] = useState(false);
  const [multiDevice, setMultiDevice] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastHTML, setLastHTML] = useState('');

  // Scroll sync
  const [scrollSyncEnabled, setScrollSyncEnabled] = useState(false);
  const scrollSyncLock = useRef(false);

  // Close mode menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (modeRef.current && !modeRef.current.contains(e.target as HTMLElement)) setShowModeMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Listen for iframe messages
  useEffect(() => {
    const h = (e: MessageEvent) => {
      if (e.data?.type === '__pc__') {
        setConsoleEntries(prev => [...prev.slice(-200), { id: ++cid.current, level: e.data.level, message: e.data.message, ts: e.data.ts }]);
      }
      if (e.data?.type === '__pp__') setRenderTime(e.data.rt);
      // Scroll sync: iframe reports its scroll ratio
      if (e.data?.type === '__ps__' && scrollSyncEnabled && onScrollRatioChange && !scrollSyncLock.current) {
        onScrollRatioChange(e.data.ratio);
      }
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, [scrollSyncEnabled, onScrollRatioChange]);

  // Scroll sync: receive scroll ratio from editor and apply to iframe
  useEffect(() => {
    if (!scrollSyncEnabled || scrollRatioProp == null || !iframeRef.current?.contentWindow) return;
    scrollSyncLock.current = true;
    iframeRef.current.contentWindow.postMessage({ type: '__scroll__', ratio: scrollRatioProp }, '*');
    const timer = setTimeout(() => { scrollSyncLock.current = false; }, 100);
    return () => clearTimeout(timer);
  }, [scrollRatioProp, scrollSyncEnabled]);

  // Babel loader
  useEffect(() => {
    ensureBabel().then(() => { setBabelLoaded(true); setLoading(false); }).catch(err => { setError('Babel load failed: ' + err); setLoading(false); });
  }, []);

  const previewLang = useMemo(() => detectLang(code, language), [code, language]);

  /* ---- core render ---- */
  const doRender = useCallback((src: string) => {
    if (!src.trim()) return;
    const lang = detectLang(src, language);
    const { html, error: err } = buildPreview(src, lang, babelLoaded, enableTailwind);
    if (err) { setError(err); return; }
    setError(null);
    if (!html) return;
    setLastHTML(html);
    if (iframeRef.current) iframeRef.current.srcdoc = html;
    setLastRendered(src);
    // history
    const snap: Snapshot = { id: ++sid.current, code: src, ts: Date.now(), rt: Math.round(performance.now()) };
    const h = historyRef.current;
    const sliced = h.slice(0, idxRef.current + 1 < 0 ? h.length : idxRef.current + 1);
    sliced.push(snap);
    if (sliced.length > 50) sliced.shift();
    historyRef.current = sliced;
    idxRef.current = sliced.length - 1;
    setHistoryVer(v => v + 1);
  }, [babelLoaded, language, enableTailwind]);

  // Auto-refresh
  useEffect(() => {
    if (paused || previewMode === 'manual' || !code.trim() || code === lastRendered) return;
    let delay = debounceMs;
    if (previewMode === 'delayed') delay = debounceMs * 2;
    if (previewMode === 'smart') delay = code.length > 3000 ? debounceMs * 2 : debounceMs / 2;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doRender(code), delay);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [code, previewMode, paused, debounceMs, doRender, lastRendered]);

  const handleRefresh = useCallback(() => { setConsoleEntries([]); doRender(code); }, [code, doRender]);

  /* ---- history helpers (use refs to avoid stale closures) ---- */
  const restoreIndex = useCallback((i: number) => {
    const snap = historyRef.current[i];
    if (!snap) return;
    idxRef.current = i;
    setHistoryVer(v => v + 1);
    const lang = detectLang(snap.code, language);
    const { html } = buildPreview(snap.code, lang, babelLoaded, enableTailwind);
    if (html) {
      setLastHTML(html);
      if (iframeRef.current) iframeRef.current.srcdoc = html;
    }
  }, [language, babelLoaded, enableTailwind]);

  const handleUndo = useCallback(() => { if (idxRef.current > 0) restoreIndex(idxRef.current - 1); }, [restoreIndex]);
  const handleRedo = useCallback(() => { if (idxRef.current < historyRef.current.length - 1) restoreIndex(idxRef.current + 1); }, [restoreIndex]);

  /* ---- Export helpers ---- */
  const handleExportHTML = useCallback(() => {
    if (!lastHTML) return;
    const blob = new Blob([lastHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'preview-' + new Date().toISOString().slice(0, 10) + '.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [lastHTML]);

  const handleExportPNG = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    // Open print dialog on iframe for PNG/PDF capture
    try {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } catch {
      // Fallback: open HTML in new tab for user to save
      if (lastHTML) {
        const blob = new Blob([lastHTML], { type: 'text/html' });
        window.open(URL.createObjectURL(blob), '_blank');
      }
    }
  }, [lastHTML]);

  const handleOpenInNewTab = useCallback(() => {
    if (!lastHTML) return;
    const blob = new Blob([lastHTML], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  }, [lastHTML]);

  // device width
  const deviceWidth = useMemo(() => {
    if (device === 'custom') return customWidth + 'px';
    const d = DEVICES.find(d => d.id === device);
    return d?.width ? d.width + 'px' : '100%';
  }, [device, customWidth]);

  const MODE_OPTS: { id: PreviewMode; label: string; icon: LucideIcon; desc: string }[] = [
    { id: 'realtime', label: '实时模式', icon: Zap,   desc: '代码修改即时更新' },
    { id: 'manual',   label: '手动模式', icon: Play,  desc: '手动触发刷新' },
    { id: 'delayed',  label: '延迟模式', icon: Clock, desc: '较长防抖延迟' },
    { id: 'smart',    label: '智能模式', icon: Zap,   desc: '根据代码量自适应延迟' },
  ];
  const curMode = MODE_OPTS.find(m => m.id === previewMode)!;

  /* ---- empty state ---- */
  if (!code.trim()) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0b10]">
        <Monitor size={48} className="text-white/10 mb-3" />
        <p className="text-[13px] text-white/30" style={{ fontWeight: 500 }}>实时预览</p>
        <p className="text-[11px] text-white/15 mt-1">在编辑器中编写代码或让 AI 生成代码后</p>
        <p className="text-[11px] text-white/15">组件将在此区域自动渲染</p>
      </div>
    );
  }

  const history = historyRef.current;
  const historyIdx = idxRef.current;

  return (
    <div className={'flex-1 flex flex-col ' + (fullscreen ? 'fixed inset-0 z-[200] bg-[#0a0b10]' : '')}>
      {/* ═══ Toolbar ═══ */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/[0.04] shrink-0 bg-[#0d0e14] flex-wrap">
        {/* Device selector */}
        <div className="flex items-center gap-0.5 mr-1 border-r border-white/[0.06] pr-1.5">
          {DEVICES.map(d => (
            <button key={d.id} onClick={() => { setDevice(d.id); setMultiDevice(false); }}
              className={'p-1 rounded-md transition-all ' + (device === d.id && !multiDevice ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]')}
              title={d.label}><d.icon size={12} /></button>
          ))}
          {/* Custom width input */}
          <div className="relative group/cw">
            <button onClick={() => { setDevice('custom'); setMultiDevice(false); }}
              className={'p-1 rounded-md transition-all ' + (device === 'custom' && !multiDevice ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]')}
              title="自定义宽度"><Ruler size={12} /></button>
            {device === 'custom' && !multiDevice && (
              <input type="number" value={customWidth} min={200} max={2560}
                onChange={e => setCustomWidth(Math.max(200, Math.min(2560, +e.target.value || 200)))}
                className="absolute top-full left-0 mt-1 w-[80px] bg-[#1a1b26] border border-white/[0.1] rounded px-2 py-1 text-[10px] text-white/60 outline-none z-50"
                onClick={e => e.stopPropagation()} />
            )}
          </div>
          {/* Multi-device */}
          <Tip icon={LayoutGrid} tip="多设备并行预览" size={12} active={multiDevice} className="text-white/20"
            onClick={() => { setMultiDevice(!multiDevice); if (!lastHTML) doRender(code); }} />
        </div>

        {/* Mode selector */}
        <div className="relative" ref={modeRef}>
          <button onClick={() => setShowModeMenu(!showModeMenu)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] text-white/40 hover:bg-white/[0.04] transition-colors">
            <curMode.icon size={10} className={previewMode === 'realtime' || previewMode === 'smart' ? 'text-emerald-400/70' : previewMode === 'manual' ? 'text-amber-400/70' : 'text-cyan-400/70'} />
            <span>{curMode.label}</span>
            <ChevronDown size={8} className="text-white/20" />
          </button>
          {showModeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-[#1a1b26] border border-white/[0.1] rounded-lg py-1 z-50 shadow-xl min-w-[160px]">
              {MODE_OPTS.map(m => (
                <button key={m.id}
                  className={'w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-left hover:bg-white/[0.06] transition-colors ' + (previewMode === m.id ? 'bg-white/[0.04] text-white/70' : 'text-white/50')}
                  onClick={() => { setPreviewMode(m.id); setShowModeMenu(false); }}>
                  <m.icon size={11} className={m.id === 'realtime' || m.id === 'smart' ? 'text-emerald-400/70' : m.id === 'manual' ? 'text-amber-400/70' : 'text-cyan-400/70'} />
                  <div><p style={{ fontWeight: 500 }}>{m.label}</p><p className="text-[8px] text-white/25">{m.desc}</p></div>
                  {previewMode === m.id && <Check size={10} className="text-indigo-400 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex-1 flex items-center gap-2 justify-center min-w-0">
          {loading ? (
            <div className="flex items-center gap-1.5"><Loader size={10} className="text-indigo-400 animate-spin" /><span className="text-[9px] text-white/30">编译器加载中...</span></div>
          ) : error ? (
            <div className="flex items-center gap-1.5 min-w-0"><AlertTriangle size={10} className="text-amber-400 shrink-0" /><span className="text-[9px] text-amber-400/70 truncate max-w-[220px]">{error}</span></div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Check size={10} className="text-emerald-400" />
              <span className="text-[9px] text-emerald-400/60">{previewLang === 'react' ? 'JSX 编译成功' : previewLang.toUpperCase() + ' 就绪'}</span>
              {renderTime != null && <span className="text-[8px] text-white/20 bg-white/[0.03] px-1 py-0.5 rounded">{renderTime}ms</span>}
            </div>
          )}
        </div>

        {/* Language badge + Tailwind indicator */}
        <div className="flex items-center gap-1">
          <div className="flex items-center px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[8px] text-white/30" style={{ fontWeight: 500 }}>{previewLang.toUpperCase()}</span>
          </div>
          {enableTailwind && (
          <div className="flex items-center px-1.5 py-0.5 rounded bg-cyan-500/[0.06] border border-cyan-500/10" title="Tailwind CSS CDN 已启用">
            <span className="text-[8px] text-cyan-400/40" style={{ fontWeight: 500 }}>TW</span>
          </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 border-l border-white/[0.06] pl-1">
          {previewMode !== 'manual' && (
            <Tip icon={paused ? Play : Pause} tip={paused ? '继续' : '暂停'} size={11} active={paused} className="text-white/25" onClick={() => setPaused(!paused)} />
          )}
          <Tip icon={RotateCcw} tip="刷新预览" size={11} className="text-white/25" onClick={handleRefresh} />
          <Tip icon={Undo2} tip="撤销" size={11} disabled={historyIdx <= 0} className="text-white/25" onClick={handleUndo} />
          <Tip icon={Redo2} tip="重做" size={11} disabled={historyIdx >= history.length - 1} className="text-white/25" onClick={handleRedo} />
          <div className="w-px h-3 bg-white/[0.06]" />
          <Tip icon={scrollSyncEnabled ? Link2 : Link2Off} tip={scrollSyncEnabled ? '滚动同步(开)' : '滚动同步(关)'} size={11}
            active={scrollSyncEnabled} className="text-white/25"
            onClick={() => setScrollSyncEnabled(!scrollSyncEnabled)} />
          <Tip icon={Grid3X3} tip="网格辅助线" size={11} active={showGrid} className="text-white/25" onClick={() => setShowGrid(!showGrid)} />
          <Tip icon={Terminal} tip="控制台" size={11} active={showConsole} className="text-white/25" onClick={() => setShowConsole(!showConsole)} />
          <Tip icon={History} tip="历史记录" size={11} active={showHistory} className="text-white/25" onClick={() => setShowHistory(!showHistory)} />
          <div className="w-px h-3 bg-white/[0.06]" />
          <Tip icon={FileDown} tip="导出 HTML" size={11} className="text-white/25" disabled={!lastHTML} onClick={handleExportHTML} />
          <Tip icon={Camera} tip="打印/截图 PNG" size={11} className="text-white/25" disabled={!lastHTML} onClick={handleExportPNG} />
          <Tip icon={ExternalLink} tip="新标签打开" size={11} className="text-white/25" disabled={!lastHTML} onClick={handleOpenInNewTab} />
          <div className="w-px h-3 bg-white/[0.06]" />
          <Tip icon={fullscreen ? Minimize2 : Maximize2} tip={fullscreen ? '退出全屏' : '全屏'} size={11} className="text-white/25" onClick={() => setFullscreen(!fullscreen)} />
        </div>
      </div>

      {/* ═══ Main area ═══ */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          {multiDevice && lastHTML ? (
            <MultiDeviceFrame html={lastHTML} />
          ) : (
            /* Single device iframe */
            <div className="flex-1 flex items-start justify-center overflow-auto p-3 bg-[#080910] relative">
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.06) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
              )}
              <div className="bg-[#0a0b10] border border-white/[0.06] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 relative"
                style={{ width: deviceWidth, maxWidth: '100%', height: fullscreen ? 'calc(100vh - 80px)' : '100%', minHeight: 200 }}>
                {device !== 'desktop' && (
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                    <span className="text-[8px] text-white/40">{device === 'custom' ? customWidth + 'px' : DEVICES.find(d => d.id === device)?.label}</span>
                  </div>
                )}
                <iframe ref={iframeRef} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-modals" title="Preview" style={{ background: '#0a0b10' }} />
              </div>
            </div>
          )}

          {/* Console */}
          {showConsole && (
            <div className="shrink-0 border-t border-white/[0.04] bg-[#0c0d13]" style={{ height: 140 }}>
              <PreviewConsole entries={consoleEntries} onClear={() => setConsoleEntries([])} />
            </div>
          )}
        </div>

        {/* History sidebar */}
        {showHistory && (
          <HistoryPanel history={history} idx={historyIdx} onRestore={restoreIndex} onClose={() => setShowHistory(false)} />
        )}
      </div>

      {/* ═══ Error bar ═══ */}
      {error && (
        <div className="shrink-0 border-t border-red-500/20 bg-red-500/[0.04] px-4 py-2 max-h-[100px] overflow-y-auto">
          <div className="flex items-start gap-2">
            <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" />
            <pre className="text-[10px] text-red-300/70 whitespace-pre-wrap break-all font-mono leading-relaxed">{error}</pre>
          </div>
        </div>
      )}

      {/* ═══ Status bar ═══ */}
      <div className="flex items-center justify-between px-3 py-0.5 border-t border-white/[0.04] bg-[#0c0d13] shrink-0">
        <div className="flex items-center gap-2">
          <div className={'w-1.5 h-1.5 rounded-full ' + (error ? 'bg-red-400' : paused ? 'bg-amber-400' : 'bg-emerald-400')} />
          <span className="text-[9px] text-white/25">
            {error ? '编译错误' : paused ? '已暂停' : previewMode === 'realtime' ? '实时预览' : previewMode === 'manual' ? '手动模式' : previewMode === 'smart' ? '智能模式' : '延迟模式'}
          </span>
          {scrollSyncEnabled && (
            <span className="text-[8px] text-indigo-400/50 bg-indigo-500/10 px-1 py-0.5 rounded">同步</span>
          )}
          {consoleEntries.filter(e => e.level === 'error').length > 0 && (
            <span className="text-[8px] text-red-400/60 bg-red-500/10 px-1 py-0.5 rounded">{consoleEntries.filter(e => e.level === 'error').length} errors</span>
          )}
          {consoleEntries.filter(e => e.level === 'warn').length > 0 && (
            <span className="text-[8px] text-amber-400/60 bg-amber-500/10 px-1 py-0.5 rounded">{consoleEntries.filter(e => e.level === 'warn').length} warnings</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {renderTime != null && <span className="text-[8px] text-white/20">渲染 {renderTime}ms</span>}
          <span className="text-[8px] text-white/15">快照 {history.length}</span>
          {multiDevice && <span className="text-[8px] text-indigo-400/40">多设备</span>}
          {enableTailwind && <span className="text-[8px] text-cyan-400/25">Tailwind</span>}
        </div>
      </div>
    </div>
  );
}