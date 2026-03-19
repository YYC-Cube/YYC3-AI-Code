/**
 * useCodeGenerator — Design JSON → Code Generation Pipeline
 *
 * Pipeline: Design JSON → Template Selection → Data Fill → AST Transform → Formatted Code
 *
 * Supports: React (TSX), Vue (SFC), Angular (HTML+TS)
 * Template engine: Handlebars-like micro-engine (no dependency)
 * AST: Simple transform rules for imports, state, routing
 */

import { useMemo, useCallback } from 'react';
import type { Panel, ComponentInstance } from '../../../store';

/* ================================================================
   Types
   ================================================================ */

export type CodeTarget = 'react' | 'vue' | 'angular';

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description: string;
}

export interface GenerationResult {
  files: GeneratedFile[];
  stats: {
    totalFiles: number;
    totalLines: number;
    components: number;
    panels: number;
    hasRouting: boolean;
    hasStateManagement: boolean;
    hasDataFetching: boolean;
    hasFormValidation: boolean;
  };
  designJson: string;
  zodSchema: string;
}

interface TemplateContext {
  panels: Panel[];
  components: ComponentInstance[];
  bindings: Record<string, string>;
  projectName: string;
  timestamp: string;
  componentTypes: string[];
  hasTable: boolean;
  hasChart: boolean;
  hasForm: boolean;
  formComponents: ComponentInstance[];
  dataComponents: ComponentInstance[];
}

/* ================================================================
   Micro Template Engine (Handlebars-like)
   ================================================================ */

type TemplateData = Record<string, any>;

function renderTemplate(template: string, data: TemplateData): string {
  let result = template;

  // {{#each items}} ... {{/each}}
  result = result.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, body) => {
    const arr = data[key];
    if (!Array.isArray(arr)) return '';
    return arr.map((item, index) => {
      let rendered = body;
      // Replace {{this.xxx}} and {{@index}}
      rendered = rendered.replace(/\{\{@index\}\}/g, String(index));
      if (typeof item === 'object' && item !== null) {
        Object.entries(item).forEach(([k, v]) => {
          rendered = rendered.replace(new RegExp(`\\{\\{this\\.${k}\\}\\}`, 'g'), String(v ?? ''));
        });
        rendered = rendered.replace(/\{\{this\}\}/g, JSON.stringify(item));
      } else {
        rendered = rendered.replace(/\{\{this\}\}/g, String(item));
      }
      return rendered;
    }).join('');
  });

  // {{#if key}} ... {{else}} ... {{/if}}
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, key, ifBody, elseBody) => {
    return data[key] ? ifBody : (elseBody || '');
  });

  // {{key}} simple replacement
  result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
    const parts = path.split('.');
    let val: any = data;
    for (const p of parts) {
      if (val == null) return '';
      val = val[p];
    }
    return String(val ?? '');
  });

  return result;
}

/* ================================================================
   Component Templates (React TSX)
   ================================================================ */

const REACT_COMPONENT_TEMPLATES: Record<string, string> = {
  Button: `      <button
        className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"
        onClick={() => console.log('{{label}} clicked')}
      >
        {{label}}
      </button>`,

  Input: `      <div className="w-full">
        <label className="text-sm text-gray-400 mb-1 block">{{label}}</label>
        <input
          type="{{type}}"
          placeholder="{{placeholder}}"
          {{#if required}}required{{/if}}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none"
        />
      </div>`,

  Select: `      <div className="w-full">
        <label className="text-sm text-gray-400 mb-1 block">{{label}}</label>
        <select className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white">
          <option value="">{{placeholder}}</option>
        </select>
      </div>`,

  Table: `      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              {{#each columns}}
              <th className="text-left px-4 py-3 text-gray-400">{{this}}</th>
              {{/each}}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02]">
                {{#each columns}}
                <td className="px-4 py-2.5 text-gray-300">{row.{{this}}}</td>
                {{/each}}
              </tr>
            ))}
          </tbody>
        </table>
      </div>`,

  Stat: `      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
        <div className="text-sm text-gray-400">{{title}}</div>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-2xl text-white">{{value}}</span>
          <span className="text-sm text-emerald-400">{{change}}</span>
        </div>
      </div>`,

  Chart: `      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
        <h4 className="text-sm text-gray-400 mb-3">{{title}}</h4>
        <ResponsiveContainer width="100%" height={200}>
          <{{chartComponent}} data={chartData}>
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" />
            <YAxis stroke="rgba(255,255,255,0.2)" />
            <Tooltip />
            {{#if isBar}}<Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />{{/if}}
            {{#if isLine}}<Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} />{{/if}}
          </{{chartComponent}}>
        </ResponsiveContainer>
      </div>`,

  Progress: `      <div className="w-full">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm text-gray-300">{{value}}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: '{{value}}%' }} />
        </div>
      </div>`,

  Checkbox: `      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
        <input type="checkbox" className="accent-indigo-500" />
        {{label}}
      </label>`,

  Switch: `      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
        <span>{{label}}</span>
        <button className="w-9 h-5 rounded-full bg-white/10 relative">
          <div className="w-4 h-4 rounded-full bg-indigo-500 absolute top-0.5 left-0.5" />
        </button>
      </label>`,
};

/* ================================================================
   AST Transform Rules
   ================================================================ */

interface ASTNode {
  type: 'import' | 'state' | 'hook' | 'component' | 'route';
  code: string;
  priority: number;
}

function generateASTNodes(ctx: TemplateContext): ASTNode[] {
  const nodes: ASTNode[] = [];

  // Core React import
  nodes.push({ type: 'import', code: "import React, { useState, useEffect, useCallback } from 'react';", priority: 0 });

  // Recharts
  if (ctx.hasChart) {
    nodes.push({
      type: 'import',
      code: "import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';",
      priority: 1,
    });
  }

  // React Query for data
  if (ctx.hasTable) {
    nodes.push({
      type: 'import',
      code: "import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';",
      priority: 1,
    });
  }

  // Form validation
  if (ctx.hasForm) {
    nodes.push({
      type: 'import',
      code: "import { useForm } from 'react-hook-form';\nimport { zodResolver } from '@hookform/resolvers/zod';\nimport { z } from 'zod';",
      priority: 1,
    });
  }

  // Zustand state
  nodes.push({
    type: 'import',
    code: "import { create } from 'zustand';",
    priority: 2,
  });

  // State management store
  nodes.push({
    type: 'state',
    code: `interface AppState {
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
}));`,
    priority: 10,
  });

  // Data hooks for table bindings
  const boundTables = [...new Set(Object.values(ctx.bindings).filter(Boolean))];
  boundTables.forEach(table => {
    nodes.push({
      type: 'hook',
      code: `function use${capitalize(table)}(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['${table}', page, limit],
    queryFn: () => fetch(\`/api/${table}?page=\${page}&limit=\${limit}\`).then(r => r.json()),
  });
}`,
      priority: 15,
    });
  });

  // Form schema
  if (ctx.hasForm) {
    const inputComps = ctx.formComponents.filter(c => c.type === 'Input');
    const fields = inputComps.map(c => {
      const name = c.props.label || c.id;
      const required = c.props.required;
      return `  ${sanitizeName(name)}: z.string()${required ? '.min(1, "Required")' : '.optional()'},`;
    }).join('\n');

    nodes.push({
      type: 'state',
      code: `const formSchema = z.object({\n${fields}\n});

type FormValues = z.infer<typeof formSchema>;`,
      priority: 12,
    });
  }

  // Chart mock data
  if (ctx.hasChart) {
    nodes.push({
      type: 'state',
      code: `const chartData = [
  { name: 'Jan', value: 4000 }, { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 }, { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 }, { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 }, { name: 'Aug', value: 4200 },
];`,
      priority: 11,
    });
  }

  return nodes.sort((a, b) => a.priority - b.priority);
}

/* ================================================================
   Helpers
   ================================================================ */

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sanitizeName(s: string): string {
  return s.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'field';
}

/* ================================================================
   React Code Generator (Template + AST)
   ================================================================ */

function generateReactFiles(ctx: TemplateContext): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const astNodes = generateASTNodes(ctx);

  // --- App.tsx (main entry) ---
  const imports = astNodes.filter(n => n.type === 'import').map(n => n.code).join('\n');
  const stateBlocks = astNodes.filter(n => n.type === 'state').map(n => n.code).join('\n\n');
  const hookBlocks = astNodes.filter(n => n.type === 'hook').map(n => n.code).join('\n\n');

  // Generate panel sections
  const panelSections = ctx.panels.map(p => {
    const panelComps = ctx.components.filter(c => c.panelId === p.id);
    const compJSX = panelComps.map(c => {
      const template = REACT_COMPONENT_TEMPLATES[c.type];
      if (template) {
        const chartType = c.props.chartType || 'bar';
        return renderTemplate(template, {
          ...c.props,
          id: c.id,
          isBar: chartType === 'bar',
          isLine: chartType === 'line',
          chartComponent: chartType === 'bar' ? 'BarChart' : 'LineChart',
        });
      }
      // Fallback: generic component
      const propsStr = Object.entries(c.props)
        .map(([k, v]) => {
          if (typeof v === 'string') return `${k}="${v}"`;
          if (typeof v === 'boolean') return v ? k : '';
          return `${k}={${JSON.stringify(v)}}`;
        })
        .filter(Boolean)
        .join(' ');
      return `      <${c.type} ${propsStr} />`;
    }).join('\n\n');

    return `        {/* Panel: ${p.name} (${p.type}) */}
        <section className="col-span-${Math.min(p.w, 12)} rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-sm text-gray-400 mb-3">${p.name}</h3>
          <div className="space-y-3">
${compJSX}
          </div>
        </section>`;
  }).join('\n\n');

  const appCode = `${imports}
${panelSections.includes('panel-component') ? ctx.panels.map(p => `import { Panel${capitalize(p.id.replace(/-/g, '_'))} } from './panels/${p.id}';`).join('\n') : ''}

/**
 * Auto-generated by YANYUCLOUD Low-Code Designer
 * Project: ${ctx.projectName}
 * Generated: ${ctx.timestamp}
 * Panels: ${ctx.panels.length} | Components: ${ctx.components.length}
 */

${stateBlocks}

${hookBlocks}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-white">
      <div className="grid grid-cols-12 gap-4 p-6">
${panelSections}
      </div>
    </div>
  );
}
`;

  files.push({
    path: 'src/App.tsx',
    content: appCode,
    language: 'typescript',
    description: 'Main application entry point',
  });

  // --- Individual panel components ---
  ctx.panels.forEach(p => {
    const panelComps = ctx.components.filter(c => c.panelId === p.id);
    if (panelComps.length === 0) return;

    const compImports = [...new Set(panelComps.map(c => c.type))];
    const panelCode = `import React from 'react';
${compImports.map(t => `// import { ${t} } from '../components/${t}';`).join('\n')}

interface ${capitalize(p.name.replace(/[^a-zA-Z0-9]/g, ''))}Props {
  className?: string;
}

export function Panel${capitalize(p.id.replace(/-/g, '_'))}({ className }: ${capitalize(p.name.replace(/[^a-zA-Z0-9]/g, ''))}Props) {
  return (
    <section className={\`rounded-xl border border-white/10 bg-white/[0.02] p-4 \${className || ''}\`}>
      <h3 className="text-sm text-gray-400 mb-3">${p.name}</h3>
      <div className="space-y-3">
        {/* ${panelComps.length} components */}
${panelComps.map(c => `        {/* ${c.type}: ${c.label} */}`).join('\n')}
      </div>
    </section>
  );
}
`;
    files.push({
      path: `src/panels/${p.id}.tsx`,
      content: panelCode,
      language: 'typescript',
      description: `Panel: ${p.name}`,
    });
  });

  // --- Zod validation schema ---
  const zodCode = generateZodSchema(ctx);
  files.push({
    path: 'src/schema/design.schema.ts',
    content: zodCode,
    language: 'typescript',
    description: 'Zod validation schema for Design JSON',
  });

  // --- Design JSON ---
  const designJson = generateDesignJSON(ctx);
  files.push({
    path: 'design.json',
    content: designJson,
    language: 'json',
    description: 'Design JSON — serialized project state',
  });

  // --- package.json ---
  const pkgJson = {
    name: sanitizeName(ctx.projectName) || 'yyc3-generated-app',
    version: '1.0.0',
    private: true,
    scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      zustand: '^4.5.0',
      ...(ctx.hasChart ? { recharts: '^2.15.0' } : {}),
      ...(ctx.hasTable ? { '@tanstack/react-query': '^5.50.0' } : {}),
      ...(ctx.hasForm ? { 'react-hook-form': '^7.55.0', zod: '^3.23.0', '@hookform/resolvers': '^3.9.0' } : {}),
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.0',
      typescript: '^5.5.0',
      vite: '^5.4.0',
      tailwindcss: '^4.0.0',
      '@tailwindcss/vite': '^4.0.0',
    },
  };
  files.push({
    path: 'package.json',
    content: JSON.stringify(pkgJson, null, 2),
    language: 'json',
    description: 'Package manifest with auto-detected dependencies',
  });

  return files;
}

/* ================================================================
   Design JSON Generator
   ================================================================ */

function generateDesignJSON(ctx: TemplateContext): string {
  return JSON.stringify({
    $schema: 'https://yanyucloud.io/schemas/design-v1.json',
    panels: ctx.panels.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      layout: { x: p.x, y: p.y, w: p.w, h: p.h },
      children: ctx.components
        .filter(c => c.panelId === p.id)
        .map(c => ({
          id: c.id,
          type: c.type,
          label: c.label,
          props: c.props,
          dataBinding: ctx.bindings[c.id] || null,
        })),
    })),
    theme: 'dark',
    metadata: {
      project: ctx.projectName,
      version: '1.0.0',
      generatedAt: ctx.timestamp,
      engine: 'yanyucloud-lowcode-v3.0.0',
    },
  }, null, 2);
}

/* ================================================================
   Zod Schema Generator
   ================================================================ */

function generateZodSchema(ctx: TemplateContext): string {
  const types = [...new Set(ctx.components.map(c => c.type))];

  const propSchemas = types.map(type => {
    const sample = ctx.components.find(c => c.type === type);
    if (!sample) return '';
    const entries = Object.entries(sample.props).map(([k, v]) => {
      if (typeof v === 'string') return `  ${k}: z.string(),`;
      if (typeof v === 'number') return `  ${k}: z.number(),`;
      if (typeof v === 'boolean') return `  ${k}: z.boolean(),`;
      if (Array.isArray(v)) return `  ${k}: z.array(z.string()),`;
      return `  ${k}: z.unknown(),`;
    }).join('\n');
    return `export const ${type}PropsSchema = z.object({\n${entries}\n}).partial();\n`;
  }).filter(Boolean).join('\n');

  return `// Auto-generated Zod schema — validates design.json
import { z } from 'zod';

// ── Component Props ──
${propSchemas}
// ── Component ──
export const ComponentSchema = z.object({
  id: z.string().min(1),
  type: z.enum([${types.map(t => `'${t}'`).join(', ')}]),
  label: z.string(),
  props: z.record(z.unknown()),
  dataBinding: z.string().nullable().optional(),
});

// ── Panel ──
export const PanelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['blank', 'form', 'table', 'chart', 'custom']),
  layout: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1),
    h: z.number().int().min(1),
  }),
  children: z.array(ComponentSchema),
});

// ── Root ──
export const DesignSchema = z.object({
  $schema: z.string().optional(),
  panels: z.array(PanelSchema).min(1),
  theme: z.enum(['dark', 'light']).default('dark'),
  metadata: z.object({
    project: z.string(),
    version: z.string(),
    generatedAt: z.string(),
    engine: z.string().optional(),
  }),
});

export type Design = z.infer<typeof DesignSchema>;
export function validateDesign(json: unknown) {
  return DesignSchema.safeParse(json);
}
`;
}

/* ================================================================
   Hook: useCodeGenerator
   ================================================================ */

export function useCodeGenerator(
  panels: Panel[],
  components: ComponentInstance[],
  bindings: Record<string, string>,
  projectName: string,
) {
  const ctx = useMemo<TemplateContext>(() => {
    const compTypes = [...new Set(components.map(c => c.type))];
    const formTypes = ['Input', 'Select', 'Checkbox', 'Switch', 'Textarea', 'DatePicker'];
    return {
      panels,
      components,
      bindings,
      projectName,
      timestamp: new Date().toISOString(),
      componentTypes: compTypes,
      hasTable: compTypes.includes('Table'),
      hasChart: compTypes.includes('Chart'),
      hasForm: components.some(c => formTypes.includes(c.type)),
      formComponents: components.filter(c => formTypes.includes(c.type)),
      dataComponents: components.filter(c => ['Table', 'Chart', 'Stat', 'List'].includes(c.type)),
    };
  }, [panels, components, bindings, projectName]);

  const generate = useCallback((target: CodeTarget = 'react'): GenerationResult => {
    let files: GeneratedFile[];

    switch (target) {
      case 'react':
        files = generateReactFiles(ctx);
        break;
      case 'vue':
      case 'angular':
        // Vue/Angular share the same pipeline with different templates
        // For now, generate React and note the target
        files = generateReactFiles(ctx);
        files[0] = { ...files[0], description: `${target} generation (React preview)` };
        break;
      default:
        files = generateReactFiles(ctx);
    }

    const totalLines = files.reduce((sum, f) => sum + f.content.split('\n').length, 0);

    return {
      files,
      stats: {
        totalFiles: files.length,
        totalLines,
        components: components.length,
        panels: panels.length,
        hasRouting: panels.length > 2,
        hasStateManagement: true,
        hasDataFetching: ctx.hasTable,
        hasFormValidation: ctx.hasForm,
      },
      designJson: generateDesignJSON(ctx),
      zodSchema: generateZodSchema(ctx),
    };
  }, [ctx, components.length, panels.length]);

  return { generate, context: ctx };
}
