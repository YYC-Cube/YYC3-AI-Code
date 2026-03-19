import React, { useState } from 'react';
import {
  X, Server, Database, Wifi, Shield, Cpu, Copy, Check,
  ArrowRight, ArrowDown, Zap, Globe, Lock, FileCode2,
  Container, RefreshCw, ChevronRight, ExternalLink
} from 'lucide-react';
import { useDesigner } from '../../store';
import { copyToClipboard } from '../../utils/clipboard';
import { useThemeTokens } from './hooks/useThemeTokens';

/* ================================================================
   Backend Tech Stack Data
   ================================================================ */

interface TechLayer {
  layer: string;
  tech: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  status: 'active' | 'idle' | 'warning';
}

const BACKEND_STACK: TechLayer[] = [
  { layer: '运行时', tech: 'Node.js 20 + TypeScript', desc: '主体 API 服务', icon: Cpu, color: 'emerald', status: 'active' },
  { layer: 'Web 框架', tech: 'Fastify + fastify-websocket', desc: '轻量、低延迟 HTTP/WS', icon: Zap, color: 'amber', status: 'active' },
  { layer: '实时协同', tech: 'y-websocket server', desc: '同步 yjs CRDT 文档', icon: Wifi, color: 'cyan', status: 'active' },
  { layer: '数据库', tech: 'SQLite / MySQL', desc: '通过 Prisma ORM', icon: Database, color: 'blue', status: 'active' },
  { layer: '认证', tech: 'passport-openidconnect + JWT', desc: 'OpenAI OAuth + 本地 JWT', icon: Shield, color: 'purple', status: 'idle' },
  { layer: 'AI 代理', tech: '/api/ai-proxy', desc: '统一计量、错误包装、SSE 流转发', icon: Globe, color: 'indigo', status: 'active' },
  { layer: '代码生成', tech: 'Handlebars + prisma-generator', desc: '生成后端 CRUD、OpenAPI', icon: FileCode2, color: 'pink', status: 'active' },
  { layer: '容器化', tech: 'Docker Compose', desc: 'frontend, backend, db, yjs-ws', icon: Container, color: 'orange', status: 'active' },
];

/* ================================================================
   Server Code Templates
   ================================================================ */

const FASTIFY_SERVER = `// src/server.ts — Fastify + y-websocket 服务端
import Fastify from 'fastify';
import websocketPlugin from '@fastify/websocket';
import { setupWSConnection } from 'y-websocket/bin/utils.js';
import { prisma } from './prisma';
import { verifyJWT } from './auth';

const app = Fastify({ logger: true });

// ── WebSocket 实时协同 ──
app.register(websocketPlugin, {
  handle: (conn, req) => {
    const token = req.headers['authorization']?.split(' ')[1];
    const user = verifyJWT(token);
    if (!user) { conn.close(); return; }
    setupWSConnection(conn, req, { gc: true });
  },
});

// ── Design CRUD ──
app.get('/api/design/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  const design = await prisma.design.findUnique({
    where: { id },
    include: { owner: true },
  });
  if (!design) return res.status(404).send({ error: 'Not found' });
  return design;
});

app.post('/api/design', async (req, res) => {
  const { name, json, ownerId } = req.body as any;
  const design = await prisma.design.create({
    data: { name, json, ownerId },
  });
  return res.status(201).send(design);
});

app.put('/api/design/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  const { name, json } = req.body as any;
  const design = await prisma.design.update({
    where: { id },
    data: { name, json },
  });
  return design;
});

// ── AI Proxy (统一认证 + 计量) ──
app.post('/api/ai-proxy', async (req, res) => {
  const { prompt, stream, model } = req.body as {
    prompt: string;
    stream?: boolean;
    model?: string;
  };

  const targetModel = model || 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: targetModel,
      messages: [{ role: 'user', content: prompt }],
      stream,
    }),
  });

  // 计量 token
  if (!stream) {
    const data = await response.json();
    await prisma.aiUsage.create({
      data: {
        model: targetModel,
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        userId: req.headers['x-user-id'] as string,
      },
    });
    return res.send(data);
  }

  // SSE 流式转发
  res.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  response.body?.pipe(res.raw);
});

// ── 启动 ──
app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
  app.log.info('Server running on http://0.0.0.0:3000');
});`;

const PRISMA_SCHEMA = `// prisma/schema.prisma — 完整数据模型 (§4.3)

datasource db {
  provider = "sqlite"  // 开发: sqlite | 生产: mysql
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

generator openapi {
  provider = "prisma-generator-typescript"
  output   = "../generated/openapi"
}

// ── 用户 ──
model User {
  id          String    @id @default(uuid())
  email       String    @unique
  name        String?
  openaiId    String    @unique
  role        Role      @default(USER)
  designs     Design[]
  aiUsages    AiUsage[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// ── 设计文档 ──
model Design {
  id          String   @id @default(uuid())
  name        String
  json        Json     // 存储 Design JSON
  version     Int      @default(1)
  published   Boolean  @default(false)
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ── AI 用量 ──
model AiUsage {
  id               Int      @id @default(autoincrement())
  model            String
  promptTokens     Int
  completionTokens Int
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  createdAt        DateTime @default(now())
}

// ── 角色枚举 ──
enum Role {
  ADMIN
  EDITOR
  USER
}`;

const CODEGEN_PIPELINE = `// generate.ts — 代码生成流水线 (§4.4)
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import Handlebars from 'handlebars';
import prettier from 'prettier';
import { DesignSchema } from './schema';

// ─── Step 1: 读取并校验 Design JSON ───
const raw = readFileSync('design.json', 'utf-8');
const result = DesignSchema.safeParse(JSON.parse(raw));
if (!result.success) {
  console.error('Schema validation failed:', result.error);
  process.exit(1);
}
const design = result.data;

// ─── Step 2: 加载 Handlebars 模板 ───
const componentTmpl = Handlebars.compile(
  readFileSync('templates/react-component.hbs', 'utf-8')
);
const pageTmpl = Handlebars.compile(
  readFileSync('templates/react-page.hbs', 'utf-8')
);
const routerTmpl = Handlebars.compile(
  readFileSync('templates/react-router.hbs', 'utf-8')
);
const storeTmpl = Handlebars.compile(
  readFileSync('templates/zustand-store.hbs', 'utf-8')
);

// ─── Step 3: 递归生成组件代码 ───
function genComponent(node: any): string {
  const { type, props, children = [] } = node;
  const childCodes = children.map(genComponent).join('\\n');
  return componentTmpl({ type, props, children: childCodes });
}

// ─── Step 4: 生成面板/页面 ───
mkdirSync('src/generated', { recursive: true });

design.panels.forEach((panel) => {
  const componentCode = panel.children
    .map(genComponent)
    .join('\\n');

  const pageCode = pageTmpl({
    panelName: panel.name,
    panelId: panel.id,
    panelType: panel.type,
    layout: panel.layout,
    components: componentCode,
  });

  const formatted = prettier.format(pageCode, {
    parser: 'typescript',
    singleQuote: true,
  });

  writeFileSync(
    \`src/generated/\${panel.id}.tsx\`,
    formatted
  );
});

// ─── Step 5: 生成路由 ───
const routerCode = routerTmpl({
  panels: design.panels.map(p => ({
    id: p.id,
    path: \`/\${p.id}\`,
    name: p.name,
  })),
});
writeFileSync('src/generated/router.tsx', routerCode);

// ─── Step 6: 生成状态管理 ───
const storeCode = storeTmpl({
  panels: design.panels,
  theme: design.theme,
});
writeFileSync('src/generated/store.ts', storeCode);

console.log(\`✓ Generated \${design.panels.length} pages\`);
console.log(\`✓ Generated router.tsx\`);
console.log(\`✓ Generated store.ts\`);`;

const HBS_TEMPLATE = `{{!-- templates/react-component.hbs --}}
{{#if (eq type "container")}}
<div className="panel-{{id}}" style={{json layout}}>
  {{{children}}}
</div>

{{else if (eq type "Button")}}
<Button
  variant="{{props.variant}}"
  size="{{props.size}}"
  onClick={handlers.{{props.onClick}}}
>
  {{props.label}}
</Button>

{{else if (eq type "Table")}}
<DataTable
  source="{{props.source}}"
  pageSize={{props.pageSize}}
  columns={[
    {{#each props.columns}}
    { key: "{{this}}", label: "{{this}}" },
    {{/each}}
  ]}
  onRowClick={handlers.onRowClick}
/>

{{else if (eq type "Chart")}}
<Chart
  type="{{props.chartType}}"
  dataSource="{{props.dataSource}}"
  title="{{props.title}}"
  responsive
/>

{{else if (eq type "Input")}}
<Input
  type="{{props.type}}"
  placeholder="{{props.placeholder}}"
  {{#if props.required}}required{{/if}}
  label="{{props.label}}"
  {...register("{{props.label}}")}
/>

{{else if (eq type "Stat")}}
<StatCard
  title="{{props.title}}"
  value="{{props.value}}"
  change="{{props.change}}"
  trend="{{props.trend}}"
/>

{{else}}
<{{type}} {{#each props}} {{@key}}="{{this}}"{{/each}} />
{{/if}}`;

/* ================================================================
   Architecture Diagram Nodes
   ================================================================ */

interface ArchNode {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  x: number;
  y: number;
}

const ARCH_NODES: ArchNode[] = [
  { id: 'frontend', label: 'Frontend', sublabel: 'React 18 + Vite', icon: Globe, color: 'blue', x: 1, y: 0 },
  { id: 'websocket', label: 'WebSocket', sublabel: 'y-websocket CRDT', icon: Wifi, color: 'cyan', x: 0, y: 1 },
  { id: 'backend', label: 'Fastify API', sublabel: 'REST + AI Proxy', icon: Server, color: 'amber', x: 1, y: 1 },
  { id: 'auth', label: 'Auth & RBAC', sublabel: 'OpenID + JWT', icon: Shield, color: 'purple', x: 2, y: 1 },
  { id: 'db', label: 'Database', sublabel: 'SQLite / MySQL', icon: Database, color: 'emerald', x: 0, y: 2 },
  { id: 'prisma', label: 'Prisma ORM', sublabel: 'Schema + Migrate', icon: Zap, color: 'pink', x: 1, y: 2 },
  { id: 'codegen', label: 'Code Generator', sublabel: 'Handlebars + AST', icon: FileCode2, color: 'orange', x: 2, y: 2 },
];

const ARCH_EDGES = [
  { from: 'frontend', to: 'backend', label: 'REST API' },
  { from: 'frontend', to: 'websocket', label: 'WS 1234' },
  { from: 'backend', to: 'prisma', label: 'ORM' },
  { from: 'backend', to: 'auth', label: 'JWT verify' },
  { from: 'prisma', to: 'db', label: 'SQL' },
  { from: 'backend', to: 'codegen', label: 'design.json' },
];

const colorMap: Record<string, string> = {
  blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/25 text-blue-400',
  cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/25 text-cyan-400',
  amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/25 text-amber-400',
  purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/25 text-purple-400',
  emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/25 text-emerald-400',
  pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/25 text-pink-400',
  orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/25 text-orange-400',
  indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/25 text-indigo-400',
};

const statusColorMap: Record<string, string> = {
  emerald: 'bg-emerald-400', amber: 'bg-amber-400', cyan: 'bg-cyan-400',
  blue: 'bg-blue-400', purple: 'bg-purple-400', indigo: 'bg-indigo-400',
  pink: 'bg-pink-400', orange: 'bg-orange-400',
};

/* ================================================================
   Component
   ================================================================ */

export function BackendArchitecture() {
  const { backendArchOpen, toggleBackendArch } = useDesigner();
  const [activeTab, setActiveTab] = useState<'arch' | 'server' | 'prisma' | 'codegen' | 'template'>('arch');
  const [copied, setCopied] = useState(false);

  const t = useThemeTokens();
  if (!backendArchOpen) return null;

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeMap: Record<string, string> = {
    server: FASTIFY_SERVER,
    prisma: PRISMA_SCHEMA,
    codegen: CODEGEN_PIPELINE,
    template: HBS_TEMPLATE,
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className={`absolute inset-0 ${t.overlayBg} backdrop-blur-md`} onClick={toggleBackendArch} />
      <div
        className={`relative w-[880px] max-h-[88vh] ${t.modalBg} border ${t.modalBorder} rounded-2xl flex flex-col overflow-hidden`}
        style={{ boxShadow: t.modalShadow }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.sectionBorder}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-white/90">后端架构 · §4.2 – 4.4</div>
            <div className="text-[11px] text-white/30">Fastify + y-websocket + Prisma + Handlebars 代码生成</div>
          </div>
          <button onClick={toggleBackendArch} className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-white/[0.06] overflow-x-auto">
          {([
            { key: 'arch' as const, label: '架构图谱', icon: Cpu },
            { key: 'server' as const, label: 'Fastify 服务端', icon: Server },
            { key: 'prisma' as const, label: 'Prisma 数据模型', icon: Database },
            { key: 'codegen' as const, label: '代码生成流水线', icon: FileCode2 },
            { key: 'template' as const, label: 'HBS 模板', icon: FileCode2 },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] transition-all border-b-2 whitespace-nowrap ${
                activeTab === key
                  ? 'text-amber-400 border-amber-400 bg-amber-500/[0.05]'
                  : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'arch' && (
            <div className="p-5 space-y-5">
              {/* Architecture Grid */}
              <div className="grid grid-cols-3 gap-3">
                {ARCH_NODES.map(node => {
                  const cls = colorMap[node.color] || colorMap.blue;
                  return (
                    <div
                      key={node.id}
                      className={`p-4 rounded-xl border bg-gradient-to-br ${cls} transition-all hover:scale-[1.02] cursor-pointer`}
                      style={{ order: node.y * 3 + node.x }}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <node.icon className="w-4 h-4" />
                        <span className="text-[12px]">{node.label}</span>
                      </div>
                      <div className="text-[10px] text-white/30">{node.sublabel}</div>
                    </div>
                  );
                })}
              </div>

              {/* Connection Flow */}
              <div className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.01]">
                <div className="text-[10px] text-white/25 uppercase tracking-wider mb-3">数据流 · 连接关系</div>
                <div className="space-y-2">
                  {ARCH_EDGES.map((edge, i) => {
                    const fromNode = ARCH_NODES.find(n => n.id === edge.from);
                    const toNode = ARCH_NODES.find(n => n.id === edge.to);
                    return (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <span className={`px-2 py-0.5 rounded bg-${fromNode?.color || 'white'}-500/10 text-${fromNode?.color || 'white'}-400`}>
                          {fromNode?.label}
                        </span>
                        <ArrowRight className="w-3 h-3 text-white/15" />
                        <span className="text-white/25 font-mono">{edge.label}</span>
                        <ArrowRight className="w-3 h-3 text-white/15" />
                        <span className={`px-2 py-0.5 rounded bg-${toNode?.color || 'white'}-500/10 text-${toNode?.color || 'white'}-400`}>
                          {toNode?.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tech Stack Table */}
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
                  <span className="text-[10px] text-white/25 uppercase tracking-wider">后端技术栈明细</span>
                </div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="text-left px-4 py-2 text-white/25">层级</th>
                      <th className="text-left px-4 py-2 text-white/25">技术</th>
                      <th className="text-left px-4 py-2 text-white/25">说明</th>
                      <th className="text-left px-4 py-2 text-white/25">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BACKEND_STACK.map((item, i) => (
                      <tr key={i} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-white/40">
                          <div className="flex items-center gap-2">
                            <item.icon className={`w-3.5 h-3.5 text-${item.color}-400`} />
                            {item.layer}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-white/60 font-mono text-[10px]">{item.tech}</td>
                        <td className="px-4 py-2.5 text-white/30">{item.desc}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusColorMap[item.color] || 'bg-white/20'} ${item.status === 'active' ? '' : 'opacity-30'}`} />
                            <span className="text-[9px] text-white/20">{item.status === 'active' ? '运行中' : '待配置'}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Code Tabs: server / prisma / codegen / template */}
          {activeTab !== 'arch' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.06]">
                <span className="text-[11px] text-white/40 font-mono">
                  {activeTab === 'server' && 'src/server.ts'}
                  {activeTab === 'prisma' && 'prisma/schema.prisma'}
                  {activeTab === 'codegen' && 'scripts/generate.ts'}
                  {activeTab === 'template' && 'templates/react-component.hbs'}
                </span>
                <button
                  onClick={() => handleCopy(codeMap[activeTab])}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已复制' : '复制代码'}
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <pre className="p-4 text-[10px] leading-relaxed font-mono">
                  <code>
                    {codeMap[activeTab].split('\n').map((line, i) => (
                      <div key={i} className="flex hover:bg-white/[0.02] -mx-4 px-4">
                        <span className="w-8 text-right mr-4 text-white/[0.08] select-none shrink-0">{i + 1}</span>
                        <span className="flex-1">
                          {highlightLine(line, activeTab)}
                        </span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
          <span className="text-[10px] text-white/20">
            Node.js 20 · Fastify 4 · Prisma 5 · Handlebars 4 · Docker Compose 3.8
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[9px] text-emerald-400/60">All services healthy</span>
            </div>
            <button onClick={toggleBackendArch} className="px-4 py-1.5 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.1] transition-all">
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Syntax Highlighting Helper
   ================================================================ */

function highlightLine(line: string, tab: string): React.ReactNode {
  // Comments
  if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#') || line.trimStart().startsWith('*') || line.trimStart().startsWith('{{!--')) {
    return <span className="text-white/15">{line}</span>;
  }

  // Prisma
  if (tab === 'prisma') {
    if (line.trimStart().startsWith('model ') || line.trimStart().startsWith('enum ')) {
      return <span className="text-purple-400">{line}</span>;
    }
    if (line.includes('@id') || line.includes('@default') || line.includes('@unique') || line.includes('@relation') || line.includes('@updatedAt')) {
      const parts = line.split(/(@\w+)/);
      return <>{parts.map((p, i) => p.startsWith('@') ? <span key={i} className="text-amber-400/70">{p}</span> : <span key={i} className="text-white/40">{p}</span>)}</>;
    }
    if (line.includes('String') || line.includes('Int') || line.includes('Boolean') || line.includes('DateTime') || line.includes('Json')) {
      return <span className="text-cyan-400/60">{line}</span>;
    }
    return <span className="text-white/35">{line}</span>;
  }

  // HBS
  if (tab === 'template') {
    if (line.includes('{{') || line.includes('}}')) {
      const parts = line.split(/({{.*?}})/);
      return <>{parts.map((p, i) => p.startsWith('{{') ? <span key={i} className="text-amber-400/70">{p}</span> : <span key={i} className="text-white/40">{p}</span>)}</>;
    }
    if (line.trimStart().startsWith('<') || line.includes('/>')) {
      return <span className="text-blue-300/60">{line}</span>;
    }
    return <span className="text-white/35">{line}</span>;
  }

  // TypeScript / default
  const keywords = ['import', 'from', 'export', 'const', 'let', 'async', 'await', 'function', 'return', 'if', 'else', 'new', 'typeof'];
  const parts = line.split(/(\s+)/);
  return <>{parts.map((part, i) => {
    if (keywords.includes(part)) return <span key={i} className="text-purple-400/80">{part}</span>;
    if (part.startsWith("'") || part.startsWith('"') || part.startsWith('`')) return <span key={i} className="text-emerald-300/70">{part}</span>;
    return <span key={i} className="text-white/40">{part}</span>;
  })}</>;
}