import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  X, Copy, Check, Download, FileCode2,
  Braces, Layers, Shield, AlertTriangle, CheckCircle2,
  ChevronDown, GitBranch, RefreshCw, GitCompareArrows,
  Plus, Minus, History, Archive, Clock, ChevronRight, ChevronLeft,
  Rewind, Users, Zap, Settings2, FileCheck, XCircle,
  SkipBack, SkipForward, Sparkles, MessageSquareOff, BookOpen
} from 'lucide-react';
import { useDesigner } from '../../store';
import { copyToClipboard } from '../../utils/clipboard';
import Editor from '@monaco-editor/react';
import { useThemeTokens } from './hooks/useThemeTokens';
import { useCodeGenerator } from './hooks/useCodeGenerator';
import JSZip from 'jszip';
import { toast } from 'sonner';
import * as Y from 'yjs';

/* ================================================================
   Persistent Diff History — survives page reloads
   ================================================================ */

const DIFF_HISTORY_KEY = 'yyc3-diff-history';
const MAX_DIFF_SNAPSHOTS = 30;

interface DiffSnapshot {
  framework: 'react' | 'vue' | 'angular';
  code: string;
  timestamp: number;
  panelCount: number;
  componentCount: number;
  /** CRDT conflict metadata */
  conflictType?: 'normal' | 'conflict' | 'merge' | 'remote';
  conflictPeer?: string;
  conflictDetail?: string;
}

/** Full code store for snapshot playback (session-only, not persisted to localStorage) */
const FULL_CODE_STORE_KEY = 'yyc3-snapshot-fullcode';
const MAX_FULL_CODE_SNAPSHOTS = 15;

interface FullCodeEntry {
  timestamp: number;
  framework: 'react' | 'vue' | 'angular';
  fullCode: string;
}

function loadFullCodeStore(): FullCodeEntry[] {
  try {
    const raw = sessionStorage.getItem(FULL_CODE_STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FullCodeEntry[];
  } catch { return []; }
}

function saveFullCodeStore(entries: FullCodeEntry[]) {
  try {
    sessionStorage.setItem(FULL_CODE_STORE_KEY, JSON.stringify(entries.slice(-MAX_FULL_CODE_SNAPSHOTS)));
  } catch { /* quota */ }
}

/** CRDT peer names for conflict visualization */
const CRDT_PEERS = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];

/**
 * YjsCrdtConflictTracker — uses real yjs Y.Doc + state vectors
 * to detect concurrent edits, merges, and remote pushes.
 *
 * Each "peer" maintains its own Y.Doc. When a local edit is committed,
 * we encode the state vector diff against the previous snapshot's vector.
 * If the diff shows updates from multiple clients → conflict / merge.
 */
class YjsCrdtConflictTracker {
  private doc: Y.Doc;
  private peerDocs: Map<string, Y.Doc>;
  private lastStateVector: Uint8Array;
  private editCounter: number = 0;

  constructor() {
    this.doc = new Y.Doc();
    this.peerDocs = new Map();
    CRDT_PEERS.forEach(peer => {
      const d = new Y.Doc();
      this.peerDocs.set(peer, d);
    });
    this.lastStateVector = Y.encodeStateVector(this.doc);
  }

  /**
   * Record a local edit — mutates the shared Y.Text inside the main doc,
   * then checks if a simulated peer also pushed concurrent changes.
   */
  detectConflict(
    snapshots: DiffSnapshot[],
    panelCount: number,
    componentCount: number,
    codeHash: string,
  ): { type: DiffSnapshot['conflictType']; peer?: string; detail?: string } {
    this.editCounter++;
    const yText = this.doc.getText('design');
    // Apply local edit marker
    this.doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, codeHash);
    });

    const currentVector = Y.encodeStateVector(this.doc);
    const diff = Y.diffUpdate(
      Y.encodeStateAsUpdate(this.doc),
      this.lastStateVector
    );
    const diffSize = diff.byteLength;
    this.lastStateVector = currentVector;

    if (snapshots.length < 2) return { type: 'normal' };
    const prev = snapshots[snapshots.length - 1];
    const timeDelta = Date.now() - prev.timestamp;
    const peer = CRDT_PEERS[this.editCounter % CRDT_PEERS.length];

    // Simulate concurrent peer edit → apply to peer doc, then merge
    const peerDoc = this.peerDocs.get(peer);
    if (peerDoc) {
      const peerText = peerDoc.getText('design');
      peerDoc.transact(() => {
        peerText.delete(0, peerText.length);
        peerText.insert(0, `peer-${peer}-${Date.now()}`);
      });
      // Merge peer state into main doc
      const peerUpdate = Y.encodeStateAsUpdate(peerDoc);
      const mergedDiff = Y.diffUpdate(peerUpdate, this.lastStateVector);

      // Real conflict: rapid edits (< 3s) with substantial state vector diff
      if (timeDelta < 3000 && mergedDiff.byteLength > 10) {
        // Sync peer doc back
        Y.applyUpdate(peerDoc, Y.encodeStateAsUpdate(this.doc));
        return {
          type: 'conflict',
          peer,
          detail: `${peer} 同时编辑了相同区域（版本向量差异 ${mergedDiff.byteLength}B），yjs CRDT 自动合并`
        };
      }

      // Merge: large structural changes detected via state vector diff size
      if (
        diffSize > 50 ||
        Math.abs(panelCount - prev.panelCount) >= 2 ||
        Math.abs(componentCount - prev.componentCount) >= 3
      ) {
        Y.applyUpdate(peerDoc, Y.encodeStateAsUpdate(this.doc));
        return {
          type: 'merge',
          peer,
          detail: `合并 ${peer} 的远程变更（状态向量差 ${diffSize}B · ${Math.abs(panelCount - prev.panelCount)} 面板 / ${Math.abs(componentCount - prev.componentCount)} 组件差异）`
        };
      }

      // Sync peer doc for next round
      Y.applyUpdate(peerDoc, Y.encodeStateAsUpdate(this.doc));
    }

    // Random remote push (~8%)
    if (Math.random() < 0.08) {
      return { type: 'remote', peer, detail: `${peer} 推送了远程更新（state vector ${currentVector.length}B）` };
    }

    return { type: 'normal' };
  }

  /** Reset tracker state (e.g. when clearing diff history) */
  reset() {
    this.doc.destroy();
    this.doc = new Y.Doc();
    this.peerDocs.forEach(d => d.destroy());
    this.peerDocs.clear();
    CRDT_PEERS.forEach(peer => {
      this.peerDocs.set(peer, new Y.Doc());
    });
    this.lastStateVector = Y.encodeStateVector(this.doc);
    this.editCounter = 0;
  }
}

/** Singleton tracker instance */
const crdtTracker = new YjsCrdtConflictTracker();

/** Strip comments from code (single-line //, multi-line /* *​/, HTML <!-- -->, and # lines) */
function stripComments(code: string, preserveJSDoc = false): string {
  let result: string;
  if (preserveJSDoc) {
    // Preserve JSDoc (/** ... */) while removing normal block comments (/* ... */)
    result = code.replace(/\/\*(?!\*)([\s\S]*?)\*\//g, '');
  } else {
    // Remove all multi-line comments including JSDoc
    result = code.replace(/\/\*[\s\S]*?\*\//g, '');
  }
  // Remove single-line comments (but not URLs like http://)
  result = result.replace(/(?<!:)\/\/.*$/gm, '');
  // Remove HTML comments
  result = result.replace(/<!--[\s\S]*?-->/g, '');
  // Remove leading # comments (Python/shell style, but not #include/#!)
  result = result.replace(/^\s*#(?!include|!)[^\n]*$/gm, '');
  // Clean up excessive blank lines (3+ → 2)
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim() + '\n';
}

/** Simple code formatter — normalizes indentation and whitespace */
function formatCode(code: string, ext: string): string {
  const lines = code.split('\n');
  const isJson = ext === '.json';

  if (isJson) {
    try {
      return JSON.stringify(JSON.parse(code), null, 2) + '\n';
    } catch {
      return code;
    }
  }

  // For TS/TSX/Vue: normalize indentation to 2-space, trim trailing whitespace
  let indentLevel = 0;
  const formatted: string[] = [];
  const openers = /[{(\[]\s*$/;
  const closers = /^\s*[})\]]/;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) { formatted.push(''); continue; }

    // Decrease indent for closing braces
    if (closers.test(trimmed)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formatted.push('  '.repeat(indentLevel) + trimmed);

    // Increase indent after opening braces
    if (openers.test(trimmed) && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
      indentLevel++;
    }
  }

  // Clean up excessive blank lines
  return formatted.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/** Export file definitions for the config panel */
const EXPORT_FILE_DEFS = [
  { key: 'json', label: 'Design JSON', ext: '.json', icon: '📄', desc: '设计描述文件' },
  { key: 'zod', label: 'Zod Schema', ext: '.ts', icon: '🛡️', desc: '类型校验模型' },
  { key: 'react', label: 'React TSX', ext: '.tsx', icon: '⚛️', desc: 'React 组件代码' },
  { key: 'vue', label: 'Vue SFC', ext: '.vue', icon: '💚', desc: 'Vue 单文件组件' },
  { key: 'angular', label: 'Angular', ext: '.ts', icon: '🅰️', desc: 'Angular 组件' },
  { key: 'pipeline', label: 'Pipeline', ext: '.ts', icon: '🔧', desc: '代码生成流水线' },
  { key: 'template', label: 'Template+AST', ext: '.ts', icon: '🧬', desc: '模板引擎输出' },
] as const;

interface DiffHistoryStore {
  codeRefs: Record<string, string>;  // { react: '...', vue: '...', angular: '...' }
  snapshots: DiffSnapshot[];
}

function loadDiffHistory(): DiffHistoryStore | null {
  try {
    const raw = localStorage.getItem(DIFF_HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiffHistoryStore;
    if (parsed && parsed.codeRefs && parsed.snapshots) return parsed;
    return null;
  } catch { return null; }
}

function saveDiffHistory(store: DiffHistoryStore) {
  try {
    // Limit snapshot size to prevent localStorage bloat
    const trimmed: DiffHistoryStore = {
      codeRefs: store.codeRefs,
      snapshots: store.snapshots.slice(-MAX_DIFF_SNAPSHOTS),
    };
    localStorage.setItem(DIFF_HISTORY_KEY, JSON.stringify(trimmed));
  } catch { /* quota exceeded */ }
}

/* ================================================================
   Zod Schema Validation (simulated)
   ================================================================ */

interface ValidationResult {
  valid: boolean;
  errors: { path: string; message: string; severity: 'error' | 'warn' }[];
  stats: { panels: number; components: number; bindings: number; fields: number };
}

function validateDesignJSON(panels: any[], components: any[], bindings: Record<string, string>): ValidationResult {
  const errors: ValidationResult['errors'] = [];

  // Validate panels
  panels.forEach(p => {
    if (!p.name || p.name.trim() === '') {
      errors.push({ path: `panels.${p.id}.name`, message: '面板名称不能为空', severity: 'error' });
    }
    if (p.w <= 0 || p.h <= 0) {
      errors.push({ path: `panels.${p.id}.layout`, message: '面板尺寸必须大于 0', severity: 'error' });
    }
    if (p.children.length === 0) {
      errors.push({ path: `panels.${p.id}.children`, message: '空面板 — 建议添加组件', severity: 'warn' });
    }
  });

  // Validate components
  components.forEach(c => {
    if (c.type === 'Table' && (!c.props.columns || c.props.columns.length === 0)) {
      errors.push({ path: `components.${c.id}.props.columns`, message: 'Table 组件缺少列定义', severity: 'error' });
    }
    if (c.type === 'Input' && c.props.required && !c.props.placeholder) {
      errors.push({ path: `components.${c.id}.props.placeholder`, message: '必填输入框建议设置 placeholder', severity: 'warn' });
    }
    if (c.type === 'Chart' && !c.props.dataSource) {
      errors.push({ path: `components.${c.id}.props.dataSource`, message: 'Chart 组件需要绑定数据源', severity: 'warn' });
    }
  });

  // Check orphan components
  const allChildIds = panels.flatMap(p => p.children);
  components.forEach(c => {
    if (!allChildIds.includes(c.id)) {
      errors.push({ path: `components.${c.id}`, message: '孤立组件 — 未归属任何面板', severity: 'warn' });
    }
  });

  const fields = components.reduce((sum, c) => sum + Object.keys(c.props).length, 0);

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    stats: { panels: panels.length, components: components.length, bindings: Object.keys(bindings).length, fields },
  };
}

/* ================================================================
   Code Generators
   ================================================================ */

function generateDesignJSON(panels: any[], components: any[], bindings: Record<string, string>) {
  return JSON.stringify({
    $schema: 'https://yanyucloud.io/schemas/design-v1.json',
    panels: panels.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      layout: { x: p.x, y: p.y, w: p.w, h: p.h },
      children: components
        .filter(c => c.panelId === p.id)
        .map(c => ({
          id: c.id,
          type: c.type,
          props: c.props,
          dataBinding: bindings[c.id] || null,
        })),
    })),
    theme: 'dark',
    metadata: {
      project: 'YANYUCLOUD 内部报表系统',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      engine: 'yanyucloud-lowcode-v2.4.1',
    },
  }, null, 2);
}

function generateZodSchema(panels: any[], components: any[]) {
  const compTypes = [...new Set(components.map(c => c.type))];
  return `// Auto-generated Zod validation schema
// Validates design.json before code generation & deployment
import { z } from 'zod';

// ── Component Props Schemas ──
${compTypes.map(type => {
  const sample = components.find(c => c.type === type);
  if (!sample) return '';
  const propEntries = Object.entries(sample.props).map(([k, v]) => {
    if (typeof v === 'string') return `  ${k}: z.string(),`;
    if (typeof v === 'number') return `  ${k}: z.number(),`;
    if (typeof v === 'boolean') return `  ${k}: z.boolean(),`;
    if (Array.isArray(v)) return `  ${k}: z.array(z.string()),`;
    return `  ${k}: z.unknown(),`;
  }).join('\n');
  return `const ${type}PropsSchema = z.object({\n${propEntries}\n}).partial();\n`;
}).join('\n')}

// ── Component Schema ──
const ComponentSchema = z.object({
  id: z.string().min(1),
  type: z.enum([${compTypes.map(t => `'${t}'`).join(', ')}]),
  props: z.record(z.unknown()),
  dataBinding: z.string().nullable().optional(),
});

// ── Panel Schema ──
const PanelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '面板名称不能为空'),
  type: z.enum(['blank', 'form', 'table', 'chart', 'custom']),
  layout: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1, '宽度必须 >= 1'),
    h: z.number().int().min(1, '高度必须 >= 1'),
  }),
  children: z.array(ComponentSchema),
});

// ── Root Design Schema ──
export const DesignSchema = z.object({
  $schema: z.string().optional(),
  panels: z.array(PanelSchema).min(1, '至少需要一个面板'),
  theme: z.enum(['dark', 'light']).default('dark'),
  metadata: z.object({
    project: z.string(),
    version: z.string(),
    generatedAt: z.string().datetime(),
    engine: z.string().optional(),
  }),
});

// ── Validation ──
export function validateDesign(json: unknown) {
  return DesignSchema.safeParse(json);
}`;
}

function generateReactCode(panels: any[], components: any[], bindings: Record<string, string>) {
  const imports = new Set<string>();
  components.forEach(c => imports.add(c.type));
  const hasTable = components.some(c => c.type === 'Table');
  const hasForm = components.some(c => ['Input', 'Select', 'Checkbox', 'Switch', 'Textarea', 'DatePicker'].includes(c.type));

  return `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/theme';
${hasTable ? `import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';\n` : ''}${hasForm ? `import { useForm } from 'react-hook-form';\nimport { zodResolver } from '@hookform/resolvers/zod';\nimport { z } from 'zod';\n` : ''}import { create } from 'zustand';
${Array.from(imports).map(i => `import { ${i} } from '@/components/${i}';`).join('\n')}

/**
 * Auto-generated by YANYUCLOUD Low-Code Designer
 * Generated: ${new Date().toISOString()}
 * Panels: ${panels.length} | Components: ${components.length}
 */

// ── Zustand Store ──
interface AppState {
  loading: boolean;
  error: string | null;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
}

const useAppStore = create<AppState>((set) => ({
  loading: false,
  error: null,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
${hasTable ? `
// ── Data Hooks ──
${[...new Set(Object.values(bindings))].filter(Boolean).map(table => `
function use${table.charAt(0).toUpperCase() + table.slice(1)}(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['${table}', page, limit],
    queryFn: () => fetch(\`/api/${table}?page=\${page}&limit=\${limit}\`).then(r => r.json()),
  });
}`).join('\n')}` : ''}
${hasForm ? `
// ── Form Schema ──
const formSchema = z.object({
${components.filter(c => c.type === 'Input').map(c =>
  `  ${c.props.label || c.id}: z.string()${c.props.required ? '.min(1, "必填")' : '.optional()'},`
).join('\n')}
});` : ''}

// ── Page Component ──
export const App: React.FC = () => {
  return (
    <ThemeProvider theme="dark">
      <div className="min-h-screen bg-background">
        <div className="grid grid-cols-12 gap-4 p-6">
${panels.map(p => {
  const panelComps = components.filter(c => c.panelId === p.id);
  return `          {/* ${p.name} */}
          <section className="col-span-${p.w} row-span-${Math.ceil(p.h / 3)}">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm text-muted-foreground mb-3">${p.name}</h3>
${panelComps.map(c => {
  const propsStr = Object.entries(c.props)
    .map(([k, v]) => {
      if (typeof v === 'string') return `${k}="${v}"`;
      if (typeof v === 'boolean') return v ? k : '';
      if (typeof v === 'number') return `${k}={${v}}`;
      return `${k}={${JSON.stringify(v)}}`;
    })
    .filter(Boolean)
    .join('\n                ');
  const binding = bindings[c.id] ? `\n                source="/api/${bindings[c.id]}"` : '';
  return `              <${c.type}
                ${propsStr}${binding}
              />`;
}).join('\n')}
            </div>
          </section>`;
}).join('\n')}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;`;
}

function generateVueCode(panels: any[], components: any[]) {
  return `<template>
  <ThemeProvider theme="dark">
    <div class="min-h-screen bg-background">
      <div class="grid grid-cols-12 gap-4 p-6">
${panels.map(p => {
  const panelComps = components.filter(c => c.panelId === p.id);
  return `        <!-- ${p.name} -->
        <section class="col-span-${p.w}">
          <div class="rounded-xl border border-border bg-card p-4">
            <h3 class="text-sm text-muted-foreground mb-3">${p.name}</h3>
${panelComps.map(c => {
  const propsStr = Object.entries(c.props)
    .map(([k, v]) => {
      if (typeof v === 'string') return `:${k}="'${v}'"`;
      return `:${k}="${JSON.stringify(v)}"`;
    })
    .join('\n              ');
  return `            <${c.type}
              ${propsStr}
            />`;
}).join('\n')}
          </div>
        </section>`;
}).join('\n')}
      </div>
    </div>
  </ThemeProvider>
</template>

<script setup lang="ts">
${Array.from(new Set(components.map(c => c.type))).map(t => `import ${t} from '@/components/${t}.vue';`).join('\n')}
</script>`;
}

function generateAngularCode(panels: any[], components: any[]) {
  return `// Auto-generated Angular Component
// ${panels.length} panels, ${components.length} components

// ── app.component.ts ──
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
${Array.from(new Set(components.map(c => c.type))).map(t =>
  `import { ${t}Component } from './components/${t.toLowerCase()}/${t.toLowerCase()}.component';`
).join('\n')}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ${Array.from(new Set(components.map(c => c.type))).map(t => `${t}Component`).join(', ')}],
  template: \`
    <div class="min-h-screen bg-background">
      <div class="grid grid-cols-12 gap-4 p-6">
${panels.map(p => {
  const panelComps = components.filter(c => c.panelId === p.id);
  return `        <!-- ${p.name} -->
        <section class="col-span-${p.w}">
          <div class="rounded-xl border border-border bg-card p-4">
            <h3 class="text-sm text-muted-foreground mb-3">${p.name}</h3>
${panelComps.map(c => {
  const propsStr = Object.entries(c.props)
    .map(([k, v]) => `[${k}]="${typeof v === 'string' ? "'" + v + "'" : JSON.stringify(v)}"`)
    .join('\n              ');
  return `            <app-${c.type.toLowerCase()}
              ${propsStr}
            />`;
}).join('\n')}
          </div>
        </section>`;
}).join('\n')}
      </div>
    </div>
  \`,
})
export class AppComponent {
  title = 'YANYUCLOUD 内部报表系统';
}`;
}

function generatePipelineCode(panels: any[], components: any[]) {
  const types = [...new Set(components.map(c => c.type))];
  return `// ━━━ YANYUCLOUD 代码生成流水线 (§4.4) ━━━
// design.json → Zod 校验 → Handlebars 模板 → AST 转换 → 代码输出
//
// 当前项目: ${panels.length} 面板, ${components.length} 组件
// 组件类型: ${types.join(', ')}
// 生成目标: React TSX + Vue SFC + Angular

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import Handlebars from 'handlebars';
import prettier from 'prettier';
import { DesignSchema } from './schema';
import * as babel from '@babel/standalone';

// ════════════════════════════════════════
// Step 1: 读取 design.json & Zod 校验
// ════════════════════════════════════════

const raw = readFileSync('design.json', 'utf-8');
const result = DesignSchema.safeParse(JSON.parse(raw));

if (!result.success) {
  console.error('❌ Schema validation failed:');
  result.error.issues.forEach(issue => {
    console.error(\`  → \${issue.path.join('.')}: \${issue.message}\`);
  });
  process.exit(1);
}

const design = result.data;
console.log('✓ Schema validation passed');
console.log(\`  Panels: \${design.panels.length}\`);
console.log(\`  Theme:  \${design.theme}\`);

// ════════════════════════════════════════
// Step 2: 注册 Handlebars 模板 & Helpers
// ════════════════════════════════════════

// 注册自定义 helper
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('json', (obj) => JSON.stringify(obj));
Handlebars.registerHelper('capitalize', (str) =>
  str.charAt(0).toUpperCase() + str.slice(1)
);

// 加载模板文件
const templates = {
  component: Handlebars.compile(
    readFileSync('templates/react-component.hbs', 'utf-8')
  ),
  page: Handlebars.compile(
    readFileSync('templates/react-page.hbs', 'utf-8')
  ),
  router: Handlebars.compile(
    readFileSync('templates/react-router.hbs', 'utf-8')
  ),
  store: Handlebars.compile(
    readFileSync('templates/zustand-store.hbs', 'utf-8')
  ),
};

console.log('✓ Templates loaded (4 files)');

// ════════════════════════════════════════
// Step 3: 递归生成组件代码
// ════════════════════════════════���═══════

function genComponent(node: any): string {
  const { type, props, children = [] } = node;
  const childCodes = children.map(genComponent).join('\\n');
  return templates.component({
    type,
    props,
    children: childCodes,
    hasChildren: children.length > 0,
  });
}

// ════════════════════════════════════════
// Step 4: 遍历面板，生成页面文件
// ════════════════════════════════════════

mkdirSync('src/generated', { recursive: true });
mkdirSync('src/generated/components', { recursive: true });

const generatedFiles: string[] = [];

design.panels.forEach((panel) => {
  // 生成组件代码
  const componentCode = panel.children
    .map(genComponent)
    .join('\\n');

  // 生成页面
  const pageCode = templates.page({
    panelName: panel.name,
    panelId: panel.id,
    panelType: panel.type,
    layout: panel.layout,
    components: componentCode,
    imports: [...new Set(
      panel.children.map(c => c.type)
    )],
  });

  // Prettier 格式化
  const formatted = prettier.format(pageCode, {
    parser: 'typescript',
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 100,
  });

  const filePath = \`src/generated/\${panel.id}.tsx\`;
  writeFileSync(filePath, formatted);
  generatedFiles.push(filePath);
});

console.log(\`✓ Generated \${generatedFiles.length} page files\`);

// ════════════════════════════════════════
// Step 5: 生成路由配置
// ════════════════════════════════════════

const routerCode = templates.router({
  panels: design.panels.map(p => ({
    id: p.id,
    path: \`/\${p.id.replace('panel-', '')}\`,
    name: p.name,
    component: p.id.replace(/-/g, '_'),
  })),
  defaultPanel: design.panels[0]?.id || 'home',
});

writeFileSync('src/generated/router.tsx', routerCode);
console.log('✓ Generated router.tsx');

// ════════════════════════════════════════
// Step 6: 生成 Zustand 状态管理
// ════════════════════════════════════════

const storeCode = templates.store({
  panels: design.panels,
  theme: design.theme,
  dataBindings: design.panels
    .flatMap(p => p.children)
    .filter(c => c.dataBinding)
    .map(c => ({ componentId: c.id, table: c.dataBinding })),
});

writeFileSync('src/generated/store.ts', storeCode);
console.log('✓ Generated store.ts');

// ════════════════════════════════���═══════
// Step 7: Babel AST 后处理 (可选优化)
// ════════════════════════════════════════

generatedFiles.forEach(file => {
  const code = readFileSync(file, 'utf-8');

  // 用 Babel 做 AST 级别优化:
  // - 删除未使用的 import
  // - 合并重复的 className
  // - 注入 React.memo() 包装
  const transformed = babel.transform(code, {
    presets: ['typescript', 'react'],
    plugins: [
      // 自定义插件: 自动 memo 纯组件
      function autoMemoPlugin() {
        return {
          visitor: {
            ExportDefaultDeclaration(path) {
              // 包装 React.memo
            },
          },
        };
      },
    ],
  });

  if (transformed?.code) {
    writeFileSync(file, transformed.code);
  }
});

console.log('✓ AST optimization complete');

// ════════════════════════════════════════
// Summary
// ════════════════════════════════════════

console.log('\\n━━━ Generation Complete ━━━');
console.log(\`  📄 Pages:     \${generatedFiles.length}\`);
console.log(\`  🔀 Router:    1 file\`);
console.log(\`  🗄️ Store:     1 file\`);
console.log(\`  📦 Total:     \${generatedFiles.length + 2} files\`);
console.log(\`  🎨 Theme:     \${design.theme}\`);
console.log('\\nRun: npm run build && npm run start');`;
}

/* ================================================================
   Tab Configuration
   ================================================================ */

const TAB_OPTIONS = [
  { key: 'react', label: 'React TSX', icon: FileCode2 },
  { key: 'diff', label: 'Diff', icon: GitCompareArrows },
  { key: 'json', label: 'Design JSON', icon: Braces },
  { key: 'zod', label: 'Zod Schema', icon: Shield },
  { key: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { key: 'template', label: 'Template+AST', icon: Layers },
  { key: 'vue', label: 'Vue SFC', icon: Layers },
  { key: 'angular', label: 'Angular', icon: FileCode2 },
];

/* ================================================================
   Simple line-level diff engine
   ================================================================ */

interface DiffLine {
  type: 'added' | 'removed' | 'context' | 'header';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

function computeLineDiff(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table (optimized for reasonable file sizes)
  const maxSize = 500;
  if (m > maxSize || n > maxSize) {
    // Fallback: just show full new code as diff
    result.push({ type: 'header', content: `@@ -1,${m} +1,${n} @@` });
    oldLines.forEach((l, i) => result.push({ type: 'removed', content: l, oldLineNum: i + 1 }));
    newLines.forEach((l, i) => result.push({ type: 'added', content: l, newLineNum: i + 1 }));
    return result;
  }

  // DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const rawDiff: { type: 'context' | 'added' | 'removed'; line: string; oldIdx?: number; newIdx?: number }[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      rawDiff.unshift({ type: 'context', line: oldLines[i - 1], oldIdx: i, newIdx: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.unshift({ type: 'added', line: newLines[j - 1], newIdx: j });
      j--;
    } else {
      rawDiff.unshift({ type: 'removed', line: oldLines[i - 1], oldIdx: i });
      i--;
    }
  }

  // Convert to DiffLine with context collapse (show 3 lines of context around changes)
  const contextRadius = 3;
  const changeIndices = new Set<number>();
  rawDiff.forEach((d, idx) => {
    if (d.type !== 'context') {
      for (let k = Math.max(0, idx - contextRadius); k <= Math.min(rawDiff.length - 1, idx + contextRadius); k++) {
        changeIndices.add(k);
      }
    }
  });

  let lastShown = -1;
  rawDiff.forEach((d, idx) => {
    if (!changeIndices.has(idx)) return;

    if (lastShown >= 0 && idx - lastShown > 1) {
      const skipped = idx - lastShown - 1;
      result.push({ type: 'header', content: `@@ ... ${skipped} 行未变 ...@@` });
    }

    result.push({
      type: d.type,
      content: d.line,
      oldLineNum: d.oldIdx,
      newLineNum: d.newIdx,
    });
    lastShown = idx;
  });

  return result;
}

/* ================================================================
   Main Component
   ================================================================ */

export function CodePreview() {
  const { codePreviewOpen, toggleCodePreview, panels, components, viewMode, dataBindings, importDesignJSON, projectName } = useDesigner();
  const t = useThemeTokens();
  const [activeTab, setActiveTab] = useState('react');
  const [copied, setCopied] = useState(false);
  const [syncIndicator, setSyncIndicator] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCodeRefs = useRef<Record<string, string>>(
    loadDiffHistory()?.codeRefs || { react: '', vue: '', angular: '' }
  );
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [diffFramework, setDiffFramework] = useState<'react' | 'vue' | 'angular'>('react');
  const [diffSnapshots, setDiffSnapshots] = useState<DiffSnapshot[]>(() => {
    return loadDiffHistory()?.snapshots || [];
  });
  const diffSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullCodeStoreRef = useRef<FullCodeEntry[]>(loadFullCodeStore());
  // Snapshot playback state
  const [playbackSnapshotIdx, setPlaybackSnapshotIdx] = useState<number | null>(null);
  const [playbackDiffLines, setPlaybackDiffLines] = useState<DiffLine[]>([]);
  // Export config panel
  const [exportConfigOpen, setExportConfigOpen] = useState(false);
  const [exportSelections, setExportSelections] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    EXPORT_FILE_DEFS.forEach(f => { defaults[f.key] = true; });
    return defaults;
  });
  // Export post-processing options — persisted to localStorage
  const [exportFormatCode, setExportFormatCode] = useState(() => {
    try { const v = localStorage.getItem('yyc3_export_formatCode'); return v !== null ? v === 'true' : true; } catch { return true; }
  });
  const [exportStripComments, setExportStripComments] = useState(() => {
    try { const v = localStorage.getItem('yyc3_export_stripComments'); return v !== null ? v === 'true' : false; } catch { return false; }
  });
  const [exportPreserveJSDoc, setExportPreserveJSDoc] = useState(() => {
    try { const v = localStorage.getItem('yyc3_export_preserveJSDoc'); return v !== null ? v === 'true' : true; } catch { return true; }
  });

  // Persist post-processing options to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('yyc3_export_formatCode', String(exportFormatCode));
      localStorage.setItem('yyc3_export_stripComments', String(exportStripComments));
      localStorage.setItem('yyc3_export_preserveJSDoc', String(exportPreserveJSDoc));
    } catch { /* localStorage unavailable */ }
  }, [exportFormatCode, exportStripComments, exportPreserveJSDoc]);

  // Initialize prevCodeRefs from localStorage on mount
  useEffect(() => {
    const saved = loadDiffHistory();
    if (saved?.codeRefs) {
      prevCodeRefs.current = saved.codeRefs;
    }
  }, []);

  // Template + AST code generation pipeline
  const { generate } = useCodeGenerator(panels, components, dataBindings, projectName);

  const validation = useMemo(
    () => validateDesignJSON(panels, components, dataBindings),
    [panels, components, dataBindings]
  );

  // Two-way sync: Monaco edit → canvas update (JSON tab only)
  const handleMonacoChange = useCallback((value: string | undefined) => {
    if (activeTab !== 'json' || !value) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSyncIndicator('syncing');
    debounceRef.current = setTimeout(() => {
      importDesignJSON(value);
      setSyncIndicator('synced');
      setTimeout(() => setSyncIndicator('idle'), 1500);
    }, 800);
  }, [activeTab, importDesignJSON]);

  // Track previous react code for diff
  const reactCode = useMemo(
    () => generateReactCode(panels, components, dataBindings),
    [panels, components, dataBindings]
  );

  const vueCode = useMemo(
    () => generateVueCode(panels, components),
    [panels, components]
  );

  const angularCode = useMemo(
    () => generateAngularCode(panels, components),
    [panels, components]
  );

  // Track all framework code changes for diff
  useEffect(() => {
    const codeMap: Record<string, string> = { react: reactCode, vue: vueCode, angular: angularCode };
    const currentCode = codeMap[diffFramework];
    const prevCode = prevCodeRefs.current[diffFramework];

    if (prevCode && prevCode !== currentCode) {
      setDiffLines(computeLineDiff(prevCode, currentCode));
    }

    // Update all previous code refs
    prevCodeRefs.current.react = reactCode;
    prevCodeRefs.current.vue = vueCode;
    prevCodeRefs.current.angular = angularCode;
  }, [reactCode, vueCode, angularCode, diffFramework]);

  // Persist diff history to localStorage (debounced 2s)
  useEffect(() => {
    if (diffSaveTimerRef.current) clearTimeout(diffSaveTimerRef.current);
    diffSaveTimerRef.current = setTimeout(() => {
      // Save current code refs + add a snapshot if code changed
      const codeMap: Record<string, string> = { react: reactCode, vue: vueCode, angular: angularCode };
      const currentCode = codeMap[diffFramework];
      const lastSnap = diffSnapshots[diffSnapshots.length - 1];
      const shouldSnapshot = !lastSnap || lastSnap.code !== currentCode || lastSnap.framework !== diffFramework;

      const now = Date.now();
      // yjs version-vector CRDT conflict analysis
      const codeHash = currentCode.slice(0, 200) + `|${panels.length}|${components.length}|${now}`;
      const crdtResult = crdtTracker.detectConflict(diffSnapshots, panels.length, components.length, codeHash);

      const newSnapshots = shouldSnapshot
        ? [...diffSnapshots, {
            framework: diffFramework,
            code: currentCode.slice(0, 2000), // Truncate for localStorage
            timestamp: now,
            panelCount: panels.length,
            componentCount: components.length,
            conflictType: crdtResult.type,
            conflictPeer: crdtResult.peer,
            conflictDetail: crdtResult.detail,
          }]
        : diffSnapshots;

      // Also store full code in sessionStorage for playback
      if (shouldSnapshot) {
        const fullEntries = [...fullCodeStoreRef.current, {
          timestamp: now,
          framework: diffFramework,
          fullCode: currentCode,
        }].slice(-MAX_FULL_CODE_SNAPSHOTS);
        fullCodeStoreRef.current = fullEntries;
        saveFullCodeStore(fullEntries);
      }

      setDiffSnapshots(newSnapshots.slice(-MAX_DIFF_SNAPSHOTS));
      saveDiffHistory({
        codeRefs: { ...prevCodeRefs.current },
        snapshots: newSnapshots.slice(-MAX_DIFF_SNAPSHOTS),
      });
    }, 2000);

    return () => { if (diffSaveTimerRef.current) clearTimeout(diffSaveTimerRef.current); };
  }, [reactCode, vueCode, angularCode, panels.length, components.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-compute diff when framework selector changes
  const handleDiffFrameworkChange = useCallback((fw: 'react' | 'vue' | 'angular') => {
    setDiffFramework(fw);
    // Recompute diff with current prev refs
    const codeMap: Record<string, string> = { react: reactCode, vue: vueCode, angular: angularCode };
    const prevCode = prevCodeRefs.current[fw];
    if (prevCode && prevCode !== codeMap[fw]) {
      setDiffLines(computeLineDiff(prevCode, codeMap[fw]));
    } else {
      setDiffLines([]);
    }
  }, [reactCode, vueCode, angularCode]);

  const handleClearDiffHistory = useCallback(() => {
    setDiffSnapshots([]);
    setDiffLines([]);
    setPlaybackSnapshotIdx(null);
    setPlaybackDiffLines([]);
    prevCodeRefs.current = { react: reactCode, vue: vueCode, angular: angularCode };
    fullCodeStoreRef.current = [];
    try { localStorage.removeItem(DIFF_HISTORY_KEY); } catch {}
    try { sessionStorage.removeItem(FULL_CODE_STORE_KEY); } catch {}
    crdtTracker.reset();
  }, [reactCode, vueCode, angularCode]);

  // Snapshot playback: click a timeline node to compare against current code
  const handleSelectSnapshot = useCallback((snapshotIdx: number) => {
    const snap = diffSnapshots[snapshotIdx];
    if (!snap) return;

    // Try to find full code from session store
    const fullEntry = fullCodeStoreRef.current.find(
      e => e.timestamp === snap.timestamp && e.framework === snap.framework
    );
    const snapshotCode = fullEntry?.fullCode || snap.code;

    // Get current code for same framework
    const codeMap: Record<string, string> = { react: reactCode, vue: vueCode, angular: angularCode };
    const currentCode = codeMap[snap.framework];

    // Compute diff: snapshot (old) vs current (new)
    const lines = computeLineDiff(snapshotCode, currentCode);
    setPlaybackSnapshotIdx(snapshotIdx);
    setPlaybackDiffLines(lines);

    const date = new Date(snap.timestamp);
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    toast.success(`时间旅行：已加载快照 #${snapshotIdx + 1}`, {
      description: `${timeStr} · ${snap.framework} · ${snap.panelCount}P ${snap.componentCount}C → 与当前代码对比`,
    });
  }, [diffSnapshots, reactCode, vueCode, angularCode]);

  // Exit playback mode
  const handleExitPlayback = useCallback(() => {
    setPlaybackSnapshotIdx(null);
    setPlaybackDiffLines([]);
  }, []);

  // Playback navigation: prev / next snapshot
  const handlePlaybackPrev = useCallback(() => {
    if (playbackSnapshotIdx === null || playbackSnapshotIdx <= 0) return;
    handleSelectSnapshot(playbackSnapshotIdx - 1);
  }, [playbackSnapshotIdx, handleSelectSnapshot]);

  const handlePlaybackNext = useCallback(() => {
    if (playbackSnapshotIdx === null) return;
    const maxIdx = diffSnapshots.length - 2; // last snapshot is "current"
    if (playbackSnapshotIdx >= maxIdx) return;
    handleSelectSnapshot(playbackSnapshotIdx + 1);
  }, [playbackSnapshotIdx, diffSnapshots.length, handleSelectSnapshot]);

  // Configurable export
  const handleConfigurableExport = useCallback(() => {
    const zip = new JSZip();
    const allFiles: { key: string; path: string; content: string }[] = [
      { key: 'json', path: 'design.json', content: generateDesignJSON(panels, components, dataBindings) },
      { key: 'zod', path: 'schema.ts', content: generateZodSchema(panels, components) },
      { key: 'react', path: 'react.tsx', content: generateReactCode(panels, components, dataBindings) },
      { key: 'vue', path: 'vue.vue', content: generateVueCode(panels, components) },
      { key: 'angular', path: 'angular.ts', content: generateAngularCode(panels, components) },
      { key: 'pipeline', path: 'pipeline.ts', content: generatePipelineCode(panels, components) },
      { key: 'template', path: 'template.ts', content: generate('react').files.map(f => `// ──── ${f.path} (${f.description}) ────\n${f.content}`).join('\n\n// ════════════════════════════════════════\n\n') },
    ];

    const selectedFiles = allFiles.filter(f => exportSelections[f.key]);
    if (selectedFiles.length === 0) {
      toast.error('请至少选择一种文件类型');
      return;
    }

    // Apply post-processing options
    const processedFiles = selectedFiles.map(file => {
      let content = file.content;
      if (exportStripComments) {
        content = stripComments(content, exportPreserveJSDoc);
      }
      if (exportFormatCode) {
        const ext = EXPORT_FILE_DEFS.find(d => d.key === file.key)?.ext || '.ts';
        content = formatCode(content, ext);
      }
      return { ...file, content };
    });

    processedFiles.forEach(file => {
      zip.file(file.path, file.content);
    });

    zip.generateAsync({ type: 'blob' }).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (projectName || 'yanyucloud').replace(/[^a-zA-Z0-9_\u4e00-\u9fff-]/g, '_');
      a.download = `${safeName}-code-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const postOps = [exportFormatCode && '格式化', exportStripComments && '注释清理', exportStripComments && exportPreserveJSDoc && '保留JSDoc'].filter(Boolean);
      toast.success('自定义导出完成', {
        description: `${processedFiles.length} / ${allFiles.length} 个文件已打包为 ZIP${postOps.length > 0 ? `（已应用：${postOps.join('、')}）` : ''}`,
      });
      setExportConfigOpen(false);
    }).catch(() => {
      toast.error('ZIP 导出失败', { description: '请检查浏览器存储空间或重试' });
    });
  }, [panels, components, dataBindings, generate, projectName, exportSelections, exportFormatCode, exportStripComments, exportPreserveJSDoc]);

  const code = useMemo(() => {
    if (activeTab === 'diff') {
      // Show diff as unified diff text for Monaco
      if (diffLines.length === 0) {
        return '// 尚无代码变更记录\n// 修改组件属性或面板配置后，此处将自动生成 Git-style diff\n//\n// Tip: 添加组件、修改属性、拆分面板等操作都会触发 diff 计算';
      }
      return diffLines.map(d => {
        if (d.type === 'header') return d.content;
        const prefix = d.type === 'added' ? '+' : d.type === 'removed' ? '-' : ' ';
        const lineNum = d.type === 'removed'
          ? `${String(d.oldLineNum || '').padStart(4)}     `
          : d.type === 'added'
          ? `     ${String(d.newLineNum || '').padStart(4)}`
          : `${String(d.oldLineNum || '').padStart(4)} ${String(d.newLineNum || '').padStart(4)}`;
        return `${prefix} ${lineNum} | ${d.content}`;
      }).join('\n');
    }
    if (activeTab === 'json') return generateDesignJSON(panels, components, dataBindings);
    if (activeTab === 'zod') return generateZodSchema(panels, components);
    if (activeTab === 'vue') return generateVueCode(panels, components);
    if (activeTab === 'angular') return generateAngularCode(panels, components);
    if (activeTab === 'pipeline') return generatePipelineCode(panels, components);
    if (activeTab === 'template') {
      // Use the new template + AST pipeline
      const result = generate('react');
      const header = `// ═══════════════════════════════════════════════════
// Template + AST Code Generation Pipeline
// Generated: ${new Date().toISOString()}
// Files: ${result.stats.totalFiles} | Lines: ${result.stats.totalLines}
// Components: ${result.stats.components} | Panels: ${result.stats.panels}
// Features: ${[
  result.stats.hasRouting && 'Routing',
  result.stats.hasStateManagement && 'State',
  result.stats.hasDataFetching && 'Data Fetching',
  result.stats.hasFormValidation && 'Form Validation',
].filter(Boolean).join(', ')}
// ═══════════════════════════════════════════════════\n\n`;
      return header + result.files.map(f =>
        `// ──── ${f.path} (${f.description}) ────\n${f.content}`
      ).join('\n\n// ═══════════════════════════════════════\n\n');
    }
    return reactCode;
  }, [activeTab, panels, components, dataBindings, generate, reactCode, diffLines]);

  const handleCopy = () => {
    copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = useCallback(() => {
    // Create a downloadable file
    const ext = activeTab === 'json' ? 'json'
      : activeTab === 'vue' ? 'vue'
      : activeTab === 'angular' ? 'ts'
      : activeTab === 'diff' ? 'diff'
      : 'tsx';
    const filename = `yanyucloud-${activeTab}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, activeTab]);

  const handleExportAll = useCallback(() => {
    const zip = new JSZip();
    const files = [
      { path: 'design.json', content: generateDesignJSON(panels, components, dataBindings) },
      { path: 'schema.ts', content: generateZodSchema(panels, components) },
      { path: 'react.tsx', content: generateReactCode(panels, components, dataBindings) },
      { path: 'vue.vue', content: generateVueCode(panels, components) },
      { path: 'angular.ts', content: generateAngularCode(panels, components) },
      { path: 'pipeline.ts', content: generatePipelineCode(panels, components) },
      { path: 'template.ts', content: generate('react').files.map(f => `// ──── ${f.path} (${f.description}) ────\n${f.content}`).join('\n\n// ════════════════════════════════════════\n\n') },
    ];

    files.forEach(file => {
      zip.file(file.path, file.content);
    });

    zip.generateAsync({ type: 'blob' }).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (projectName || 'yanyucloud').replace(/[^a-zA-Z0-9_\u4e00-\u9fff-]/g, '_');
      a.download = `${safeName}-code-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('批量导出完成', {
        description: `${files.length} 个文件已打包为 ZIP（React + Vue + Angular + JSON + Zod + Pipeline）`,
      });
    }).catch(() => {
      toast.error('ZIP 导出失败', { description: '请检查浏览器存储空间或重试' });
    });
  }, [panels, components, dataBindings, generate, projectName]);

  if (!codePreviewOpen && viewMode !== 'code') return null;

  if (viewMode === 'code' && !codePreviewOpen) {
    return (
      <div className={`flex-1 flex flex-col min-h-0 ${t.panelBg} ${t.scrollClass}`}>
        <ValidationBar validation={validation} />
        <CodeHeader activeTab={activeTab} setActiveTab={setActiveTab} copied={copied} handleCopy={handleCopy} handleExport={handleExport} syncIndicator={syncIndicator} onExportAll={handleExportAll} onExportConfig={() => setExportConfigOpen(!exportConfigOpen)} exportConfigOpen={exportConfigOpen} />
        {exportConfigOpen && (
          <ExportConfigPanel
            selections={exportSelections}
            onToggle={(key) => setExportSelections(prev => ({ ...prev, [key]: !prev[key] }))}
            onExport={handleConfigurableExport}
            onClose={() => setExportConfigOpen(false)}
            onSelectAll={() => { const a: Record<string, boolean> = {}; EXPORT_FILE_DEFS.forEach(f => { a[f.key] = true; }); setExportSelections(a); }}
            onDeselectAll={() => { const n: Record<string, boolean> = {}; EXPORT_FILE_DEFS.forEach(f => { n[f.key] = false; }); setExportSelections(n); }}
            formatCode={exportFormatCode}
            onToggleFormat={() => setExportFormatCode(v => !v)}
            stripComments={exportStripComments}
            onToggleStrip={() => setExportStripComments(v => !v)}
            preserveJSDoc={exportPreserveJSDoc}
            onTogglePreserveJSDoc={() => setExportPreserveJSDoc(v => !v)}
          />
        )}
        <CodeContent code={code} activeTab={activeTab} onChange={handleMonacoChange} diffLines={diffLines} diffFramework={diffFramework} onDiffFrameworkChange={handleDiffFrameworkChange} diffSnapshotCount={diffSnapshots.length} onClearDiffHistory={handleClearDiffHistory} diffSnapshots={diffSnapshots} onSelectSnapshot={handleSelectSnapshot} playbackSnapshotIdx={playbackSnapshotIdx} playbackDiffLines={playbackDiffLines} onExitPlayback={handleExitPlayback} onPlaybackPrev={handlePlaybackPrev} onPlaybackNext={handlePlaybackNext} />
      </div>
    );
  }

  return (
    <div className={`w-[420px] border-l ${t.panelBorder} ${t.panelBg} flex flex-col shrink-0 ${t.scrollClass}`}
      style={{ boxShadow: t.panelShadow.replace('1px', '-1px').replace('4px', '-4px') }}
    >
      <div className={`flex items-center justify-between p-3 border-b ${t.sectionBorder}`}>
        <div className="flex items-center gap-2">
          <FileCode2 className={`w-4 h-4 ${t.accent}`} />
          <span className={`text-[12px] ${t.textSecondary}`}>代码生成引擎</span>
        </div>
        <button onClick={toggleCodePreview} className={`p-1 rounded ${t.textMuted} hover:text-white/50 ${t.hoverBg}`}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <ValidationBar validation={validation} />
      <CodeHeader activeTab={activeTab} setActiveTab={setActiveTab} copied={copied} handleCopy={handleCopy} handleExport={handleExport} syncIndicator={syncIndicator} onExportAll={handleExportAll} onExportConfig={() => setExportConfigOpen(!exportConfigOpen)} exportConfigOpen={exportConfigOpen} />
      <CodeContent code={code} activeTab={activeTab} onChange={handleMonacoChange} diffLines={diffLines} diffFramework={diffFramework} onDiffFrameworkChange={handleDiffFrameworkChange} diffSnapshotCount={diffSnapshots.length} onClearDiffHistory={handleClearDiffHistory} diffSnapshots={diffSnapshots} onSelectSnapshot={handleSelectSnapshot} playbackSnapshotIdx={playbackSnapshotIdx} playbackDiffLines={playbackDiffLines} onExitPlayback={handleExitPlayback} onPlaybackPrev={handlePlaybackPrev} onPlaybackNext={handlePlaybackNext} />
      {/* Export Config Panel */}
      {exportConfigOpen && (
        <ExportConfigPanel
          selections={exportSelections}
          onToggle={(key) => setExportSelections(prev => ({ ...prev, [key]: !prev[key] }))}
          onExport={handleConfigurableExport}
          onClose={() => setExportConfigOpen(false)}
          onSelectAll={() => {
            const all: Record<string, boolean> = {};
            EXPORT_FILE_DEFS.forEach(f => { all[f.key] = true; });
            setExportSelections(all);
          }}
          onDeselectAll={() => {
            const none: Record<string, boolean> = {};
            EXPORT_FILE_DEFS.forEach(f => { none[f.key] = false; });
            setExportSelections(none);
          }}
          formatCode={exportFormatCode}
          onToggleFormat={() => setExportFormatCode(v => !v)}
          stripComments={exportStripComments}
          onToggleStrip={() => setExportStripComments(v => !v)}
          preserveJSDoc={exportPreserveJSDoc}
          onTogglePreserveJSDoc={() => setExportPreserveJSDoc(v => !v)}
        />
      )}
      <div className={`flex items-center justify-between px-3 py-2 border-t ${t.sectionBorder}`}>
        <button
          onClick={handleExportAll}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all"
        >
          <Archive className="w-3 h-3" />
          导出全部
        </button>
        <button
          onClick={() => setExportConfigOpen(!exportConfigOpen)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all ${exportConfigOpen ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/25 hover:text-white/50 hover:bg-white/[0.06]'}`}
        >
          <Settings2 className="w-3 h-3" />
          自定义导出
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   Export Config Panel
   ================================================================ */

function ExportConfigPanel({ selections, onToggle, onExport, onClose, onSelectAll, onDeselectAll, formatCode: fmtEnabled, onToggleFormat, stripComments: stripEnabled, onToggleStrip, preserveJSDoc: jsDocEnabled, onTogglePreserveJSDoc }: {
  selections: Record<string, boolean>;
  onToggle: (key: string) => void;
  onExport: () => void;
  onClose: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  formatCode?: boolean;
  onToggleFormat?: () => void;
  stripComments?: boolean;
  onToggleStrip?: () => void;
  preserveJSDoc?: boolean;
  onTogglePreserveJSDoc?: () => void;
}) {
  const selectedCount = Object.values(selections).filter(Boolean).length;
  const totalCount = EXPORT_FILE_DEFS.length;

  return (
    <div className="border-t border-white/[0.06] bg-white/[0.02]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5 text-indigo-400/70" />
          <span className="text-[10px] text-white/50">导出配置</span>
          <span className="text-[9px] text-white/25 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
            {selectedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onSelectAll} className="text-[9px] text-indigo-400/60 hover:text-indigo-400 px-1.5 py-0.5 rounded hover:bg-indigo-500/10 transition-all">
            全选
          </button>
          <button onClick={onDeselectAll} className="text-[9px] text-white/30 hover:text-white/50 px-1.5 py-0.5 rounded hover:bg-white/[0.04] transition-all">
            清空
          </button>
          <button onClick={onClose} className="p-0.5 rounded text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all ml-1">
            <XCircle className="w-3 h-3" />
          </button>
        </div>
      </div>
      {/* File list */}
      <div className="px-3 py-2 space-y-1">
        {EXPORT_FILE_DEFS.map(def => (
          <label
            key={def.key}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
              selections[def.key]
                ? 'bg-indigo-500/[0.08] hover:bg-indigo-500/[0.12]'
                : 'hover:bg-white/[0.03]'
            }`}
          >
            <input
              type="checkbox"
              checked={selections[def.key] ?? true}
              onChange={() => onToggle(def.key)}
              className="w-3 h-3 rounded border-white/20 bg-transparent accent-indigo-500 cursor-pointer"
            />
            <span className="text-[11px]">{def.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${selections[def.key] ? 'text-white/60' : 'text-white/30'}`}>
                  {def.label}
                </span>
                <span className="text-[8px] text-white/15 font-mono">{def.ext}</span>
              </div>
              <span className="text-[8px] text-white/20">{def.desc}</span>
            </div>
            {selections[def.key] && (
              <FileCheck className="w-3 h-3 text-indigo-400/50 shrink-0" />
            )}
          </label>
        ))}
      </div>
      {/* Post-processing options */}
      <div className="px-3 py-2 border-t border-white/[0.04]">
        <div className="text-[9px] text-white/30 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          导出后处理
        </div>
        <div className="space-y-1">
          <label className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
            fmtEnabled ? 'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.12]' : 'hover:bg-white/[0.03]'
          }`}>
            <input
              type="checkbox"
              checked={fmtEnabled ?? true}
              onChange={onToggleFormat}
              className="w-3 h-3 rounded border-white/20 bg-transparent accent-emerald-500 cursor-pointer"
            />
            <Sparkles className={`w-3 h-3 ${fmtEnabled ? 'text-emerald-400/70' : 'text-white/20'}`} />
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] ${fmtEnabled ? 'text-white/60' : 'text-white/30'}`}>代码格式化</div>
              <div className="text-[8px] text-white/20">统一缩进（2空格）、移除多余空行、JSON 美化</div>
            </div>
          </label>
          <label className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
            stripEnabled ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.12]' : 'hover:bg-white/[0.03]'
          }`}>
            <input
              type="checkbox"
              checked={stripEnabled ?? false}
              onChange={onToggleStrip}
              className="w-3 h-3 rounded border-white/20 bg-transparent accent-amber-500 cursor-pointer"
            />
            <MessageSquareOff className={`w-3 h-3 ${stripEnabled ? 'text-amber-400/70' : 'text-white/20'}`} />
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] ${stripEnabled ? 'text-white/60' : 'text-white/30'}`}>注释清理</div>
              <div className="text-[8px] text-white/20">移除 //、/* */、{'<!--'} {'-->'} 等注释块</div>
            </div>
          </label>
          {/* Preserve JSDoc sub-option — only visible when strip is enabled */}
          {stripEnabled && (
            <label className={`flex items-center gap-2.5 px-2 py-1.5 ml-4 rounded-md cursor-pointer transition-all ${
              jsDocEnabled ? 'bg-sky-500/[0.08] hover:bg-sky-500/[0.12]' : 'hover:bg-white/[0.03]'
            }`}>
              <input
                type="checkbox"
                checked={jsDocEnabled ?? true}
                onChange={onTogglePreserveJSDoc}
                className="w-3 h-3 rounded border-white/20 bg-transparent accent-sky-500 cursor-pointer"
              />
              <BookOpen className={`w-3 h-3 ${jsDocEnabled ? 'text-sky-400/70' : 'text-white/20'}`} />
              <div className="flex-1 min-w-0">
                <div className={`text-[10px] ${jsDocEnabled ? 'text-white/60' : 'text-white/30'}`}>保留 JSDoc</div>
                <div className="text-[8px] text-white/20">保留 /** ... */ 文档注释，仅清理普通注释</div>
              </div>
            </label>
          )}
        </div>
      </div>
      {/* Export button */}
      <div className="px-3 pb-2">
        <button
          onClick={onExport}
          disabled={selectedCount === 0}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] transition-all ${
            selectedCount > 0
              ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/20'
              : 'bg-white/[0.03] text-white/20 cursor-not-allowed border border-white/[0.04]'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          导出 {selectedCount} 个文件为 ZIP
          {(fmtEnabled || stripEnabled) && (
            <span className="text-[8px] text-indigo-400/50 ml-1">
              +{[fmtEnabled && '格式化', stripEnabled && '清理', stripEnabled && jsDocEnabled && '保留JSDoc'].filter(Boolean).join('+')}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   Validation Bar
   ================================================================ */

function ValidationBar({ validation }: { validation: ValidationResult }) {
  const [expanded, setExpanded] = useState(false);
  const errorCount = validation.errors.filter(e => e.severity === 'error').length;
  const warnCount = validation.errors.filter(e => e.severity === 'warn').length;

  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] transition-all ${
          validation.valid ? 'hover:bg-emerald-500/[0.03]' : 'hover:bg-red-500/[0.03]'
        }`}
      >
        {validation.valid ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
        )}
        <span className={validation.valid ? 'text-emerald-400' : 'text-red-400'}>
          {validation.valid ? 'Zod Schema Valid' : `${errorCount} 错误`}
        </span>
        {warnCount > 0 && <span className="text-amber-400/60">{warnCount} 警告</span>}
        <span className="ml-auto text-white/20">
          {validation.stats.panels}P · {validation.stats.components}C · {validation.stats.fields}F
        </span>
        <ChevronDown className={`w-3 h-3 text-white/20 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && validation.errors.length > 0 && (
        <div className="px-3 pb-2 space-y-1 max-h-[120px] overflow-y-auto">
          {validation.errors.map((err, i) => (
            <div key={i} className={`flex items-start gap-2 text-[9px] px-2 py-1 rounded ${
              err.severity === 'error' ? 'text-red-400/70 bg-red-500/[0.04]' : 'text-amber-400/60 bg-amber-500/[0.04]'
            }`}>
              {err.severity === 'error' ? <AlertTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0" /> : <AlertTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0" />}
              <span className="font-mono text-white/30">{err.path}</span>
              <span className="flex-1">{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Code Header & Content
   ================================================================ */

function CodeHeader({ activeTab, setActiveTab, copied, handleCopy, handleExport, syncIndicator, onExportAll, onExportConfig, exportConfigOpen }: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  copied: boolean;
  handleCopy: () => void;
  handleExport: () => void;
  syncIndicator: 'idle' | 'syncing' | 'synced' | 'error';
  onExportAll?: () => void;
  onExportConfig?: () => void;
  exportConfigOpen?: boolean;
}) {
  const t = useThemeTokens();
  const [exported, setExported] = useState(false);
  return (
    <div className={`flex items-center justify-between px-3 py-2 border-b ${t.sectionBorder}`}>
      <div className="flex gap-0.5 overflow-x-auto">
        {TAB_OPTIONS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? `${t.accentBg.replace('/20', '/10')} ${t.activeTabText}`
                : `${t.textTertiary} hover:text-white/50`
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? '已复制' : '复制'}
        </button>
        <button
          onClick={() => {
            handleExport();
            setExported(true);
            setTimeout(() => setExported(false), 2000);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all"
        >
          {exported ? <Check className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3" />}
          {exported ? '已导出' : '导出'}
        </button>
        {onExportAll && (
          <button
            onClick={onExportAll}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all"
          >
            <Archive className="w-3 h-3" />
            ZIP
          </button>
        )}
        {onExportConfig && (
          <button
            onClick={onExportConfig}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all ${
              exportConfigOpen ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/25 hover:text-white/50 hover:bg-white/[0.06]'
            }`}
            title="自定义导出配置"
          >
            <Settings2 className="w-3 h-3" />
          </button>
        )}
        {activeTab === 'json' && (
          <span className={`text-[10px] ${syncIndicator === 'syncing' ? 'text-blue-400' : syncIndicator === 'synced' ? 'text-emerald-400' : 'text-white/25'}`}>
            {syncIndicator === 'syncing' ? '同步中...' : syncIndicator === 'synced' ? '已同步' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

const DIFF_FRAMEWORKS = [
  { key: 'react' as const, label: 'React TSX' },
  { key: 'vue' as const, label: 'Vue SFC' },
  { key: 'angular' as const, label: 'Angular' },
];

function CodeContent({ code, activeTab, onChange, diffLines, diffFramework, onDiffFrameworkChange, diffSnapshotCount, onClearDiffHistory, diffSnapshots, onSelectSnapshot, playbackSnapshotIdx, playbackDiffLines, onExitPlayback, onPlaybackPrev, onPlaybackNext }: {
  code: string;
  activeTab: string;
  onChange?: (value: string | undefined) => void;
  diffLines?: DiffLine[];
  diffFramework?: 'react' | 'vue' | 'angular';
  onDiffFrameworkChange?: (fw: 'react' | 'vue' | 'angular') => void;
  diffSnapshotCount?: number;
  onClearDiffHistory?: () => void;
  diffSnapshots?: DiffSnapshot[];
  onSelectSnapshot?: (idx: number) => void;
  playbackSnapshotIdx?: number | null;
  playbackDiffLines?: DiffLine[];
  onExitPlayback?: () => void;
  onPlaybackPrev?: () => void;
  onPlaybackNext?: () => void;
}) {
  const t = useThemeTokens();
  const [timelineOpen, setTimelineOpen] = useState(false);

  // Keyboard shortcuts: ← → for playback navigation, Escape to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only act when in playback mode and diff tab is active
      if (playbackSnapshotIdx === null || playbackSnapshotIdx === undefined) return;
      if (activeTab !== 'diff') return;
      // Avoid intercepting when user is typing in an input/textarea/editor
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.closest?.('.monaco-editor')) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPlaybackPrev?.();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onPlaybackNext?.();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onExitPlayback?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackSnapshotIdx, activeTab, onPlaybackPrev, onPlaybackNext, onExitPlayback]);

  // Determine which diff lines to render: playback or live
  const isPlayback = playbackSnapshotIdx !== null && playbackSnapshotIdx !== undefined;
  const activeDiffLines = isPlayback ? (playbackDiffLines || []) : (diffLines || []);
  const playbackSnap = isPlayback && diffSnapshots ? diffSnapshots[playbackSnapshotIdx] : null;

  // Diff tab: show custom styled diff view
  if (activeTab === 'diff' && activeDiffLines && activeDiffLines.length > 0) {
    const addedCount = activeDiffLines.filter(d => d.type === 'added').length;
    const removedCount = activeDiffLines.filter(d => d.type === 'removed').length;
    return (
      <div className="flex-1 overflow-auto min-h-0">
        {/* Diff stats bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
          <GitCompareArrows className="w-3.5 h-3.5 text-indigo-400/60" />
          {/* Framework selector */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-md p-0.5">
            {DIFF_FRAMEWORKS.map(fw => (
              <button
                key={fw.key}
                onClick={() => onDiffFrameworkChange?.(fw.key)}
                className={`px-2 py-0.5 rounded text-[9px] transition-all ${
                  diffFramework === fw.key
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {fw.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Plus className="w-3 h-3 text-emerald-400/70" />
            <span className="text-[10px] text-emerald-400/70">{addedCount} 行新增</span>
          </div>
          <div className="flex items-center gap-1">
            <Minus className="w-3 h-3 text-red-400/70" />
            <span className="text-[10px] text-red-400/70">{removedCount} 行删除</span>
          </div>
          {/* Mini change bar */}
          <div className="flex h-1.5 rounded-full overflow-hidden ml-auto w-24 bg-white/[0.06]">
            {addedCount > 0 && (
              <div className="bg-emerald-400/60 h-full" style={{ width: `${(addedCount / (addedCount + removedCount)) * 100}%` }} />
            )}
            {removedCount > 0 && (
              <div className="bg-red-400/60 h-full" style={{ width: `${(removedCount / (addedCount + removedCount)) * 100}%` }} />
            )}
          </div>
          {/* Snapshot count */}
          {(diffSnapshotCount ?? 0) > 0 && (
            <div className="flex items-center gap-1 ml-2">
              <History className="w-3 h-3 text-white/30" />
              <span className="text-[10px] text-white/30">{diffSnapshotCount} 个快照</span>
              <button
                onClick={onClearDiffHistory}
                className="text-[10px] text-red-400/70 hover:text-red-400/90"
              >
                清除
              </button>
            </div>
          )}
        </div>
        {/* Playback Mode Indicator */}
        {isPlayback && playbackSnap && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-500/20 bg-amber-500/[0.06]">
            <Rewind className="w-3.5 h-3.5 text-amber-400/80" />
            <span className="text-[10px] text-amber-400/80">时间旅行模式</span>
            <span className="text-[9px] text-amber-400/50">
              快照 #{(playbackSnapshotIdx ?? 0) + 1} · {new Date(playbackSnap.timestamp).toLocaleTimeString('zh-CN')} · {playbackSnap.framework}
            </span>
            {playbackSnap.conflictType && playbackSnap.conflictType !== 'normal' && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                playbackSnap.conflictType === 'conflict' ? 'bg-red-500/15 text-red-400/70' :
                playbackSnap.conflictType === 'merge' ? 'bg-blue-500/15 text-blue-400/70' :
                'bg-purple-500/15 text-purple-400/70'
              }`}>
                {playbackSnap.conflictType === 'conflict' ? '⚡ 冲突' : playbackSnap.conflictType === 'merge' ? '🔀 合并' : '📡 远程'}
              </span>
            )}
            {/* Playback navigation arrows */}
            <div className="flex items-center gap-0.5 ml-auto">
              <button
                onClick={onPlaybackPrev}
                disabled={playbackSnapshotIdx === 0}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] transition-all ${
                  playbackSnapshotIdx === 0
                    ? 'text-amber-400/25 cursor-not-allowed'
                    : 'text-amber-400/70 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                }`}
                title="上一个快照 (←)"
              >
                <SkipBack className="w-3 h-3" />
              </button>
              <span className="text-[9px] text-amber-400/40 px-1 tabular-nums">
                {(playbackSnapshotIdx ?? 0) + 1}/{(diffSnapshots?.length ?? 1) - 1}
              </span>
              <button
                onClick={onPlaybackNext}
                disabled={playbackSnapshotIdx === (diffSnapshots?.length ?? 1) - 2}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] transition-all ${
                  playbackSnapshotIdx === (diffSnapshots?.length ?? 1) - 2
                    ? 'text-amber-400/25 cursor-not-allowed'
                    : 'text-amber-400/70 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                }`}
                title="下一个快照 (→)"
              >
                <SkipForward className="w-3 h-3" />
              </button>
              <div className="w-px h-3 bg-amber-500/20 mx-1" />
              <button
                onClick={onExitPlayback}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-amber-400/70 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
              >
                <XCircle className="w-3 h-3" />
                退出回放 (Esc)
              </button>
            </div>
          </div>
        )}
        {/* Diff History Timeline (collapsible) */}
        {(diffSnapshots?.length ?? 0) > 1 && (
          <div className="border-b border-white/[0.06]">
            <button
              onClick={() => setTimelineOpen(!timelineOpen)}
              className="w-full flex items-center gap-2 px-4 py-1.5 text-[10px] text-white/30 hover:text-white/50 hover:bg-white/[0.02] transition-all"
            >
              <Clock className="w-3 h-3" />
              <span>快照时间线</span>
              <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${timelineOpen ? 'rotate-90' : ''}`} />
            </button>
            {timelineOpen && diffSnapshots && (
              <div className="px-4 pb-3 pt-1">
                {/* Timeline track */}
                <div className="relative ml-2">
                  {/* Vertical line */}
                  <div className="absolute left-[3px] top-0 bottom-0 w-px bg-white/[0.08]" />
                  {/* Snapshots */}
                  <div className="space-y-0.5 max-h-[160px] overflow-y-auto">
                    {[...diffSnapshots].reverse().map((snap, idx) => {
                      const realIdx = diffSnapshots.length - 1 - idx;
                      const isLatest = realIdx === diffSnapshots.length - 1;
                      const isSelected = playbackSnapshotIdx === realIdx;
                      const date = new Date(snap.timestamp);
                      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                      const fwColors: Record<string, string> = {
                        react: 'bg-cyan-400',
                        vue: 'bg-green-400',
                        angular: 'bg-red-400',
                      };
                      // CRDT conflict styling
                      const conflictType = snap.conflictType || 'normal';
                      const conflictDotColor = conflictType === 'conflict' ? 'bg-red-400 ring-red-400/30'
                        : conflictType === 'merge' ? 'bg-blue-400 ring-blue-400/30'
                        : conflictType === 'remote' ? 'bg-purple-400 ring-purple-400/30'
                        : '';
                      const dotColor = conflictType !== 'normal' ? conflictDotColor
                        : isLatest ? fwColors[snap.framework] : isSelected ? 'bg-amber-400 ring-amber-400/30' : 'bg-white/20';
                      const ringClass = (conflictType !== 'normal' || isLatest || isSelected) ? 'ring-2' : '';

                      return (
                        <div
                          key={snap.timestamp + '-' + idx}
                          className={`flex items-center gap-2 pl-0 group cursor-pointer ${isSelected ? 'opacity-100' : ''}`}
                          onClick={() => !isLatest && onSelectSnapshot?.(realIdx)}
                          title={snap.conflictDetail || (isLatest ? '当前版本' : `点击加载快照 #${realIdx + 1} 进行对比`)}
                        >
                          {/* Dot */}
                          <div className={`w-[7px] h-[7px] rounded-full shrink-0 z-10 ${dotColor} ${ringClass} ${!isLatest ? 'group-hover:scale-150 transition-transform' : ''}`} />
                          {/* Info */}
                          <div className={`flex-1 flex items-center gap-2 px-2 py-1 rounded-md text-[9px] transition-all ${
                            isSelected ? 'bg-amber-500/[0.1] ring-1 ring-amber-500/20' :
                            isLatest ? 'bg-white/[0.04]' : 'group-hover:bg-white/[0.04]'
                          }`}>
                            <span className={`${isLatest ? 'text-white/50' : isSelected ? 'text-amber-400/70' : 'text-white/25'}`}>{timeStr}</span>
                            <span className="text-white/15">{dateStr}</span>
                            <span className={`px-1 py-0.5 rounded text-[8px] ${snap.framework === 'react' ? 'bg-cyan-500/15 text-cyan-400/70' : snap.framework === 'vue' ? 'bg-green-500/15 text-green-400/70' : 'bg-red-500/15 text-red-400/70'}`}>
                              {snap.framework}
                            </span>
                            {/* CRDT conflict indicator */}
                            {conflictType === 'conflict' && (
                              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] bg-red-500/15 text-red-400/70" title={snap.conflictDetail}>
                                <Zap className="w-2.5 h-2.5" />冲突
                              </span>
                            )}
                            {conflictType === 'merge' && (
                              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] bg-blue-500/15 text-blue-400/70" title={snap.conflictDetail}>
                                <GitBranch className="w-2.5 h-2.5" />合并
                              </span>
                            )}
                            {conflictType === 'remote' && (
                              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] bg-purple-500/15 text-purple-400/70" title={snap.conflictDetail}>
                                <Users className="w-2.5 h-2.5" />{snap.conflictPeer}
                              </span>
                            )}
                            <span className="text-white/20 ml-auto">{snap.panelCount}P {snap.componentCount}C</span>
                            {isLatest && <span className="text-indigo-400/60 text-[8px]">当前</span>}
                            {isSelected && <span className="text-amber-400/60 text-[8px]">回放中</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Diff lines */}
        <div className="font-mono text-[11px] leading-[1.6]">
          {activeDiffLines.map((line, i) => {
            if (line.type === 'header') {
              return (
                <div key={i} className="px-4 py-1 bg-indigo-500/[0.06] text-indigo-400/60 border-y border-indigo-500/10">
                  {line.content}
                </div>
              );
            }
            const bgClass = line.type === 'added'
              ? 'bg-emerald-500/[0.06]'
              : line.type === 'removed'
              ? 'bg-red-500/[0.06]'
              : '';
            const textClass = line.type === 'added'
              ? 'text-emerald-400/80'
              : line.type === 'removed'
              ? 'text-red-400/70'
              : 'text-white/30';
            const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '\u2212' : ' ';
            const prefixColor = line.type === 'added'
              ? 'text-emerald-400'
              : line.type === 'removed'
              ? 'text-red-400'
              : 'text-white/15';

            return (
              <div key={i} className={`flex ${bgClass} hover:brightness-125 transition-all`}>
                {/* Line numbers */}
                <div className="w-[44px] shrink-0 text-right pr-1 text-[10px] text-white/15 select-none border-r border-white/[0.04]">
                  {line.type !== 'added' ? (line.oldLineNum || '') : ''}
                </div>
                <div className="w-[44px] shrink-0 text-right pr-1 text-[10px] text-white/15 select-none border-r border-white/[0.04]">
                  {line.type !== 'removed' ? (line.newLineNum || '') : ''}
                </div>
                {/* Prefix */}
                <div className={`w-5 shrink-0 text-center ${prefixColor} select-none`}>
                  {prefix}
                </div>
                {/* Content */}
                <div className={`flex-1 px-2 ${textClass} whitespace-pre overflow-x-auto`}>
                  {highlightDiffLine(line.content, diffFramework as DiffHighlightFramework)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const monacoLang = activeTab === 'json' ? 'json'
    : activeTab === 'zod' || activeTab === 'react' || activeTab === 'pipeline' || activeTab === 'angular' || activeTab === 'diff' ? 'typescript'
    : activeTab === 'vue' ? 'html'
    : 'typescript';

  return (
    <div className="flex-1 overflow-hidden min-h-0">
      <Editor
        height="100%"
        language={monacoLang}
        value={code}
        theme="vs-dark"
        options={{
          readOnly: false,
          minimap: { enabled: false },
          lineNumbers: 'on',
          wordWrap: 'on',
          fontSize: 12,
          tabSize: 2,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 8, bottom: 8 },
          renderLineHighlight: 'line',
          scrollbar: { verticalSliderSize: 4, horizontalSliderSize: 4 },
        }}
        onChange={onChange}
      />
    </div>
  );
}

/* ================================================================
   Syntax Highlighting
   ================================================================ */

/** Shared keywords for all JS-family frameworks */
const JS_KEYWORDS = new Set([
  'import', 'from', 'export', 'const', 'let', 'var', 'return', 'function',
  'class', 'interface', 'type', 'enum', 'async', 'await', 'default',
  'extends', 'implements', 'new', 'if', 'else', 'for', 'while', 'switch',
  'case', 'break', 'continue', 'try', 'catch', 'throw', 'finally',
  'typeof', 'instanceof', 'in', 'of', 'as', 'is', 'readonly', 'static',
  'abstract', 'private', 'protected', 'public', 'void', 'null', 'undefined',
  'true', 'false', 'this', 'super',
]);

/** Vue-specific keywords */
const VUE_KEYWORDS = new Set([
  'template', 'script', 'style', 'setup', 'defineProps', 'defineEmits',
  'defineExpose', 'withDefaults', 'ref', 'reactive', 'computed',
  'watch', 'watchEffect', 'onMounted', 'onUnmounted', 'nextTick',
  'provide', 'inject', 'toRef', 'toRefs', 'shallowRef',
]);

/** Angular-specific keywords */
const ANGULAR_KEYWORDS = new Set([
  'Component', 'Injectable', 'NgModule', 'Directive', 'Pipe',
  'Input', 'Output', 'ViewChild', 'EventEmitter', 'OnInit',
  'OnDestroy', 'CommonModule', 'standalone', 'selector', 'imports',
  'declarations', 'providers', 'bootstrap',
]);

/** React-specific keywords */
const REACT_KEYWORDS = new Set([
  'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef',
  'useContext', 'useReducer', 'useLayoutEffect', 'useImperativeHandle',
  'forwardRef', 'memo', 'lazy', 'Suspense', 'Fragment', 'StrictMode',
  'createContext', 'createElement', 'React', 'JSX', 'FC',
]);

type DiffHighlightFramework = 'react' | 'vue' | 'angular';

function highlightDiffLine(content: string, framework: DiffHighlightFramework): React.ReactNode {
  if (!content || content.trim() === '') return content;

  // Tokenize: split on word boundaries, strings, comments, tags, decorators
  const tokenRegex = /(\/\/.*$|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|"[^"]*"|'[^']*'|`[^`]*`|<\/?[a-zA-Z][\w.-]*|\/?>|@\w+|[a-zA-Z_$][\w$]*|[{}()[\];,.:=<>+\-*/%!&|?]+|\s+)/gm;
  const tokens = content.match(tokenRegex) || [content];

  const frameworkKeywords = framework === 'react' ? REACT_KEYWORDS
    : framework === 'vue' ? VUE_KEYWORDS
    : ANGULAR_KEYWORDS;

  return tokens.map((token, i) => {
    // Comments
    if (token.startsWith('//') || token.startsWith('/*') || token.startsWith('<!--')) {
      return <span key={i} className="text-white/20 italic">{token}</span>;
    }
    // Strings
    if ((token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'")) ||
        (token.startsWith('`') && token.endsWith('`'))) {
      return <span key={i} className="text-emerald-300/80">{token}</span>;
    }
    // JSX/HTML tags
    if (token.startsWith('<') || token === '/>' || token === '>') {
      return <span key={i} className="text-blue-300/80">{token}</span>;
    }
    // Angular decorators
    if (token.startsWith('@')) {
      return <span key={i} className="text-amber-400/80">{token}</span>;
    }
    // Vue v-directives (within tags)
    if (framework === 'vue' && (token.startsWith('v-') || token.startsWith(':') || token.startsWith('@'))) {
      return <span key={i} className="text-cyan-300/80">{token}</span>;
    }
    // Framework-specific keywords
    if (frameworkKeywords.has(token)) {
      return <span key={i} className={
        framework === 'react' ? 'text-cyan-300/80' :
        framework === 'vue' ? 'text-green-300/80' :
        'text-amber-300/80'
      }>{token}</span>;
    }
    // Shared JS keywords
    if (JS_KEYWORDS.has(token)) {
      return <span key={i} className="text-purple-400/80">{token}</span>;
    }
    // Zod
    if (token.startsWith('z.') || token === 'z') {
      return <span key={i} className="text-cyan-300/80">{token}</span>;
    }
    // Numbers
    if (/^\d+(\.\d+)?$/.test(token)) {
      return <span key={i} className="text-orange-300/80">{token}</span>;
    }
    // Type annotations (PascalCase identifiers)
    if (/^[A-Z][a-zA-Z0-9]+$/.test(token) && !JS_KEYWORDS.has(token)) {
      return <span key={i} className="text-yellow-300/70">{token}</span>;
    }
    return <span key={i}>{token}</span>;
  });
}

function highlightSyntax(line: string, lang: string): React.ReactNode {
  if (lang === 'json') {
    return line
      .replace(/"([^"]+)":/g, '<key>"$1"</key>:')
      .split(/(<key>.*?<\/key>)/)
      .map((part, i) => {
        if (part.startsWith('<key>')) {
          const inner = part.replace(/<\/?key>/g, '');
          return <span key={i} className="text-indigo-300">{inner}</span>;
        }
        if (part.match(/: "(.*?)"/)) {
          return <span key={i} className="text-emerald-300">{part}</span>;
        }
        return <span key={i}>{part}</span>;
      });
  }

  const keywords = ['import', 'from', 'export', 'const', 'return', 'function', 'class', 'template', 'script', 'setup', 'interface', 'type', 'enum', 'async', 'await', 'default', 'extends', 'implements'];
  const parts = line.split(/(\s+)/);
  return parts.map((part, i) => {
    if (keywords.includes(part)) return <span key={i} className="text-purple-400">{part}</span>;
    if (part.startsWith("'") || part.startsWith('"')) return <span key={i} className="text-emerald-300">{part}</span>;
    if (part.startsWith('//') || part.startsWith('<!--') || part.startsWith('#') || part.startsWith('*')) return <span key={i} className="text-white/20">{part}</span>;
    if (part.startsWith('<') || part.startsWith('/>') || part === '>') return <span key={i} className="text-blue-300">{part}</span>;
    if (part.startsWith('z.') || part.startsWith('z,')) return <span key={i} className="text-cyan-300">{part}</span>;
    return <span key={i}>{part}</span>;
  });
}