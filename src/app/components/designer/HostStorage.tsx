import React, { useState, useEffect, useCallback } from 'react';
import {
  X, HardDrive, FolderOpen, Database, Key, RefreshCw,
  CheckCircle2, AlertTriangle, Copy, Check, Terminal,
  Server, Wifi, Container, ArrowRight, Play, Pause,
  FileJson, Eye, EyeOff, Shield, Zap, ChevronRight,
  FolderTree, MonitorSmartphone, Settings2
} from 'lucide-react';
import { useDesigner } from '../../store';
import { copyToClipboard } from '../../utils/clipboard';
import { useThemeTokens } from './hooks/useThemeTokens';

/* ================================================================
   Step Definitions (§5)
   ================================================================ */

interface HostStep {
  id: string;
  step: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  command?: string;
}

const HOST_STEPS: HostStep[] = [
  {
    id: 'init',
    step: '1️⃣',
    title: '初始化宿主机',
    desc: 'docker compose up -d（包括 frontend, backend, db, yjs）',
    icon: Container,
    color: 'blue',
    command: 'docker compose up -d --build',
  },
  {
    id: 'mount',
    step: '2️⃣',
    title: '项目挂载',
    desc: '本地目录 ./my-designs 挂载到容器 /app/designs，编辑器自动写入 design.json',
    icon: FolderOpen,
    color: 'emerald',
    command: '# docker-compose.yml volumes:\n#   - ./my-designs:/app/designs\n#   - ./data:/app/data',
  },
  {
    id: 'database',
    step: '3️⃣',
    title: '本地数据库',
    desc: '默认 SQLite (./data/db.sqlite)；企业版切换 MySQL',
    icon: Database,
    color: 'amber',
    command: '# SQLite (默认)\nDATABASE_URL="file:./data/db.sqlite"\n\n# MySQL (生产)\n# DATABASE_URL="mysql://user:pwd@db:3306/yanyucloud"',
  },
  {
    id: 'auth',
    step: '4️⃣',
    title: 'OpenAI 认证',
    desc: '配置 .env 中 OPENAI_CLIENT_ID/SECRET，首次登录弹出 OAuth，token 保存到 keytar',
    icon: Shield,
    color: 'purple',
    command: 'OPENAI_CLIENT_ID=your_client_id\nOPENAI_CLIENT_SECRET=your_client_secret\nOPENAI_API_KEY=sk-your-api-key',
  },
  {
    id: 'autodeploy',
    step: '5️⃣',
    title: '自动部署',
    desc: '监控 designs/*.json，变更触发 npm run build && npm run start',
    icon: RefreshCw,
    color: 'cyan',
    command: '# 容器内 watcher 脚本\nchokidar "designs/*.json" -c "npm run build && npm run start"',
  },
];

/* ================================================================
   File System Tree Data
   ================================================================ */

interface FSNode {
  name: string;
  type: 'dir' | 'file';
  size?: string;
  modified?: string;
  highlight?: boolean;
  children?: FSNode[];
}

const FILE_TREE: FSNode[] = [
  {
    name: 'multi-panel-lowcode/', type: 'dir', children: [
      {
        name: 'my-designs/', type: 'dir', highlight: true, children: [
          { name: 'design.json', type: 'file', size: '24.5 KB', modified: '刚刚', highlight: true },
          { name: 'design.backup.json', type: 'file', size: '22.1 KB', modified: '10 分钟前' },
          { name: 'templates/', type: 'dir', children: [
            { name: 'react-component.hbs', type: 'file', size: '1.8 KB' },
            { name: 'react-page.hbs', type: 'file', size: '2.4 KB' },
            { name: 'zustand-store.hbs', type: 'file', size: '0.9 KB' },
          ]},
        ]
      },
      {
        name: 'data/', type: 'dir', highlight: true, children: [
          { name: 'db.sqlite', type: 'file', size: '512 KB', modified: '30 秒前', highlight: true },
          { name: 'db.sqlite-wal', type: 'file', size: '64 KB' },
          { name: 'db.sqlite-shm', type: 'file', size: '32 KB' },
        ]
      },
      { name: '.env', type: 'file', size: '0.4 KB', highlight: true },
      { name: 'docker-compose.yml', type: 'file', size: '1.2 KB', highlight: true },
      { name: 'nginx.conf', type: 'file', size: '0.6 KB' },
      {
        name: 'frontend/', type: 'dir', children: [
          { name: 'Dockerfile', type: 'file', size: '0.3 KB' },
          { name: 'src/', type: 'dir', children: [
            { name: 'App.tsx', type: 'file', size: '4.2 KB' },
            { name: 'generated/', type: 'dir', highlight: true, children: [
              { name: 'panel-1.tsx', type: 'file', size: '2.1 KB' },
              { name: 'panel-2.tsx', type: 'file', size: '3.4 KB' },
              { name: 'router.tsx', type: 'file', size: '0.8 KB' },
              { name: 'store.ts', type: 'file', size: '1.2 KB' },
            ]},
          ]},
        ]
      },
      {
        name: 'backend/', type: 'dir', children: [
          { name: 'Dockerfile', type: 'file', size: '0.4 KB' },
          { name: 'src/', type: 'dir', children: [
            { name: 'server.ts', type: 'file', size: '3.8 KB' },
            { name: 'prisma.ts', type: 'file', size: '0.2 KB' },
          ]},
          { name: 'prisma/', type: 'dir', children: [
            { name: 'schema.prisma', type: 'file', size: '1.1 KB' },
          ]},
        ]
      },
      {
        name: 'yjs-server/', type: 'dir', children: [
          { name: 'Dockerfile', type: 'file', size: '0.2 KB' },
          { name: 'index.js', type: 'file', size: '0.5 KB' },
        ]
      },
    ]
  }
];

/* ================================================================
   Docker Services Status (simulated)
   ================================================================ */

interface DockerService {
  name: string;
  image: string;
  port: string;
  status: 'running' | 'starting' | 'stopped';
  cpu: string;
  memory: string;
  uptime: string;
}

const DOCKER_SERVICES: DockerService[] = [
  { name: 'frontend', image: 'node:20-alpine', port: '5173:5173', status: 'running', cpu: '2.3%', memory: '128 MB', uptime: '2h 15m' },
  { name: 'backend', image: 'node:20-alpine', port: '3000:3000', status: 'running', cpu: '1.8%', memory: '96 MB', uptime: '2h 15m' },
  { name: 'db', image: 'alpine:latest', port: '-', status: 'running', cpu: '0.1%', memory: '12 MB', uptime: '2h 15m' },
  { name: 'yjs', image: 'node:20-alpine', port: '1234:1234', status: 'running', cpu: '0.5%', memory: '48 MB', uptime: '2h 15m' },
];

/* ================================================================
   Terminal Output Lines (simulated)
   ================================================================ */

function generateTerminalOutput(activeStep: number): string[] {
  const base = [
    '$ docker compose up -d --build',
    '[+] Building 24.3s (18/18) FINISHED',
    '  => [frontend] npm install                    12.4s',
    '  => [frontend] npm run build                   4.2s',
    '  => [backend]  npm install                     8.1s',
    '  => [backend]  prisma generate                 1.3s',
    '  => [backend]  prisma migrate deploy           0.8s',
    '[+] Running 4/4',
    '  ✔ Container frontend   Started               0.8s',
    '  ✔ Container backend    Started               1.2s',
    '  ✔ Container db         Started               0.3s',
    '  ✔ Container yjs        Started               0.5s',
    '',
  ];

  if (activeStep >= 1) {
    base.push(
      '$ ls -la ./my-designs/',
      'total 52K',
      '-rw-r--r-- 1 user user 24.5K  design.json',
      '-rw-r--r-- 1 user user 22.1K  design.backup.json',
      'drwxr-xr-x 2 user user  4.0K  templates/',
      '',
      '→ design.json 已同步到 /app/designs/design.json (容器内)',
      ''
    );
  }

  if (activeStep >= 2) {
    base.push(
      '$ sqlite3 ./data/db.sqlite ".tables"',
      'User       Design     AiUsage    _prisma_migrations',
      '',
      '$ sqlite3 ./data/db.sqlite "SELECT count(*) FROM User;"',
      '3',
      '',
      '$ sqlite3 ./data/db.sqlite "SELECT count(*) FROM Design;"',
      '7',
      ''
    );
  }

  if (activeStep >= 3) {
    base.push(
      '$ cat .env | grep OPENAI',
      'OPENAI_CLIENT_ID=yc_xxxxxx',
      'OPENAI_CLIENT_SECRET=yc_sec_xxxxxx',
      'OPENAI_API_KEY=sk-xxxx...xxxx',
      '',
      '→ OAuth token cached in keytar (host keychain)',
      '→ JWT secret: HS256, expires in 7d',
      ''
    );
  }

  if (activeStep >= 4) {
    base.push(
      '$ chokidar "designs/*.json" --initial',
      '[watcher] Watching designs/*.json for changes...',
      '[watcher] Detected change: design.json (24.5 KB)',
      '[watcher] Running: npm run build && npm run start',
      '[build]   Vite build completed in 3.2s',
      '[build]   Output: dist/ (1.8 MB, 12 chunks)',
      '[deploy]  Restarting frontend container...',
      '[deploy]  ✔ Frontend hot-reloaded at localhost:5173',
      '',
      '→ 配置即部署: design.json → 代码生成 → 构建 → 热更新',
      '→ 所有 4 个容器运行正常 ✔',
    );
  }

  return base;
}

/* ================================================================
   Sub-Components
   ================================================================ */

function FileTreeView({ nodes, depth = 0 }: { nodes: FSNode[]; depth?: number }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    nodes.forEach(n => { if (n.type === 'dir') init[n.name] = depth < 2; });
    return init;
  });

  return (
    <div>
      {nodes.map(node => (
        <div key={node.name}>
          <div
            className={`flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer transition-all hover:bg-white/[0.03] ${
              node.highlight ? 'bg-indigo-500/[0.04]' : ''
            }`}
            style={{ paddingLeft: `${depth * 14 + 4}px` }}
            onClick={() => node.type === 'dir' && setExpanded(p => ({ ...p, [node.name]: !p[node.name] }))}
          >
            {node.type === 'dir' ? (
              <ChevronRight className={`w-2.5 h-2.5 text-white/20 transition-transform ${expanded[node.name] ? 'rotate-90' : ''}`} />
            ) : (
              <div className="w-2.5" />
            )}
            {node.type === 'dir' ? (
              <FolderOpen className={`w-3 h-3 ${node.highlight ? 'text-indigo-400' : 'text-amber-400/60'}`} />
            ) : (
              <FileJson className={`w-3 h-3 ${node.highlight ? 'text-emerald-400/70' : 'text-white/20'}`} />
            )}
            <span className={`text-[10px] ${node.highlight ? 'text-white/70' : 'text-white/40'}`}>{node.name}</span>
            {node.size && <span className="text-[9px] text-white/15 ml-auto">{node.size}</span>}
            {node.modified && <span className="text-[9px] text-emerald-400/40 ml-1">{node.modified}</span>}
          </div>
          {node.type === 'dir' && expanded[node.name] && node.children && (
            <FileTreeView nodes={node.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

function DbConfigPanel() {
  const [dbType, setDbType] = useState<'sqlite' | 'mysql'>('sqlite');

  return (
    <div className="space-y-3">
      {/* DB Type Selector */}
      <div className="flex gap-2">
        {(['sqlite', 'mysql'] as const).map(type => (
          <button
            key={type}
            onClick={() => setDbType(type)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] transition-all ${
              dbType === type
                ? 'border-amber-500/25 bg-amber-500/[0.08] text-amber-400'
                : 'border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            {type === 'sqlite' ? 'SQLite (开发)' : 'MySQL (企业)'}
          </button>
        ))}
      </div>

      {/* Config */}
      <div className="rounded-xl border border-white/[0.06] p-3 space-y-2.5">
        {dbType === 'sqlite' ? (
          <>
            <div>
              <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1">数据库文件路径</label>
              <input
                value="./data/db.sqlite"
                readOnly
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white/50 font-mono"
              />
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-400/70">SQLite 无需额外配置，开箱即用</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] text-white/60">512 KB</div>
                <div className="text-[9px] text-white/20">文件大小</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] text-white/60">4 表</div>
                <div className="text-[9px] text-white/20">数据表</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] text-white/60">3 次</div>
                <div className="text-[9px] text-white/20">迁移版本</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1">连接字符串</label>
              <input
                defaultValue="mysql://user:password@db:3306/yanyucloud"
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white/50 font-mono focus:outline-none focus:border-amber-500/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1">Host</label>
                <input defaultValue="db" className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white/50 font-mono focus:outline-none focus:border-amber-500/30" />
              </div>
              <div>
                <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1">Port</label>
                <input defaultValue="3306" className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white/50 font-mono focus:outline-none focus:border-amber-500/30" />
              </div>
              <div>
                <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1">User</label>
                <input defaultValue="root" className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white/50 font-mono focus:outline-none focus:border-amber-500/30" />
              </div>
              <div>
                <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1">Database</label>
                <input defaultValue="yanyucloud" className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white/50 font-mono focus:outline-none focus:border-amber-500/30" />
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/[0.04] border border-amber-500/10">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-amber-400/70">需要修改 docker-compose.yml 的 db 服务为 mysql:8.0 镜像</span>
            </div>
          </>
        )}
      </div>

      {/* Prisma datasource */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="px-3 py-2 bg-white/[0.02] border-b border-white/[0.04] flex items-center gap-2">
          <Zap className="w-3 h-3 text-pink-400" />
          <span className="text-[10px] text-white/40">prisma/schema.prisma (datasource)</span>
        </div>
        <pre className="p-3 text-[10px] leading-relaxed font-mono text-white/35">
{dbType === 'sqlite' ? `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  // 文件: ./data/db.sqlite
}` : `datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  // mysql://user:pwd@db:3306/yanyucloud
}`}
        </pre>
      </div>
    </div>
  );
}

function AuthConfigPanel() {
  const [showSecrets, setShowSecrets] = useState(false);

  return (
    <div className="space-y-3">
      {/* OAuth flow diagram */}
      <div className="rounded-xl border border-purple-500/15 p-3 bg-purple-500/[0.02]">
        <div className="text-[10px] text-white/25 uppercase tracking-wider mb-2">OpenAI OAuth 认证流程</div>
        <div className="flex items-center justify-between text-[10px] gap-1">
          {[
            { label: '用户登录', icon: MonitorSmartphone },
            { label: 'OAuth 窗口', icon: Shield },
            { label: '获取 Token', icon: Key },
            { label: '保存 Keytar', icon: HardDrive },
            { label: 'JWT 签发', icon: Zap },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <item.icon className="w-3 h-3 text-purple-400" />
                </div>
                <span className="text-white/30 text-center whitespace-nowrap">{item.label}</span>
              </div>
              {i < 4 && <ArrowRight className="w-3 h-3 text-white/10 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* .env fields */}
      <div className="rounded-xl border border-white/[0.06] p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/25 uppercase tracking-wider">.env 认证配置</span>
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="flex items-center gap-1 text-[9px] text-white/20 hover:text-white/40 transition-all"
          >
            {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showSecrets ? '隐藏' : '显示'}密钥
          </button>
        </div>
        {[
          { key: 'OPENAI_CLIENT_ID', value: 'yc_a3f7b2c8d9e1f4...', sensitive: false },
          { key: 'OPENAI_CLIENT_SECRET', value: 'yc_sec_x9k2m7n4p1...', sensitive: true },
          { key: 'OPENAI_API_KEY', value: 'sk-proj-abc123def456...', sensitive: true },
          { key: 'JWT_SECRET', value: 'yc-super-secret-2026...', sensitive: true },
          { key: 'JWT_EXPIRES_IN', value: '7d', sensitive: false },
        ].map(field => (
          <div key={field.key}>
            <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-0.5">{field.key}</label>
            <input
              type={field.sensitive && !showSecrets ? 'password' : 'text'}
              defaultValue={field.value}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[10px] text-white/50 font-mono focus:outline-none focus:border-purple-500/30"
            />
          </div>
        ))}
      </div>

      {/* Keytar info */}
      <div className="rounded-xl border border-white/[0.06] p-3">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-white/60">宿主机密钥库 (keytar)</span>
        </div>
        <div className="space-y-1.5">
          {[
            { key: 'yanyucloud/oauth-token', status: 'cached', expiry: '6d 23h' },
            { key: 'yanyucloud/refresh-token', status: 'cached', expiry: '29d' },
            { key: 'yanyucloud/jwt-token', status: 'active', expiry: '6d 18h' },
          ].map(entry => (
            <div key={entry.key} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-white/40 font-mono flex-1">{entry.key}</span>
              <span className="text-[9px] text-emerald-400/60">{entry.status}</span>
              <span className="text-[9px] text-white/15">过期: {entry.expiry}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WatcherPanel() {
  const [watcherRunning, setWatcherRunning] = useState(true);
  const [events, setEvents] = useState([
    { time: '14:32:15', file: 'design.json', action: '修改', size: '24.5 KB', result: '✔ 构建成功 (3.2s)' },
    { time: '14:28:41', file: 'design.json', action: '修改', size: '24.1 KB', result: '✔ 构建成功 (2.8s)' },
    { time: '14:15:02', file: 'design.json', action: '修改', size: '23.7 KB', result: '✔ 构建成功 (3.1s)' },
    { time: '13:59:33', file: 'design.backup.json', action: '创建', size: '22.1 KB', result: '— 备份文件，已忽略' },
    { time: '13:45:10', file: 'design.json', action: '修改', size: '22.1 KB', result: '✔ 构建成功 (2.5s)' },
  ]);

  return (
    <div className="space-y-3">
      {/* Watcher status */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${watcherRunning ? 'bg-cyan-500/15' : 'bg-white/[0.04]'}`}>
            {watcherRunning ? <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} /> : <Pause className="w-4 h-4 text-white/20" />}
          </div>
          <div>
            <div className="text-[12px] text-white/70">文件监服务</div>
            <div className="text-[10px] text-white/25">
              {watcherRunning ? '正在监控 designs/*.json 文件更...' : '监控已暂停'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setWatcherRunning(!watcherRunning)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] border transition-all ${
            watcherRunning
              ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
              : 'border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10'
          }`}
        >
          {watcherRunning ? <><Pause className="w-3 h-3" /> 暂停</> : <><Play className="w-3 h-3" /> 启动</>}
        </button>
      </div>

      {/* Pipeline flow */}
      <div className="rounded-xl border border-white/[0.06] p-3">
        <div className="text-[10px] text-white/25 uppercase tracking-wider mb-2">自动部署流水线</div>
        <div className="flex items-center justify-between gap-2">
          {[
            { label: '文件变更', icon: FileJson, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Zod 校验', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: '代码生成', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Vite 构建', icon: Container, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: '热更新', icon: RefreshCw, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-lg ${step.bg} flex items-center justify-center`}>
                  <step.icon className={`w-3 h-3 ${step.color}`} />
                </div>
                <span className="text-[9px] text-white/25 text-center whitespace-nowrap">{step.label}</span>
              </div>
              {i < 4 && <ArrowRight className="w-3 h-3 text-white/10 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="px-3 py-2 bg-white/[0.02] border-b border-white/[0.04] flex items-center gap-2">
          <Terminal className="w-3 h-3 text-white/25" />
          <span className="text-[10px] text-white/40">变更事件日志</span>
          <span className="text-[9px] text-white/15 ml-auto">{events.length} 条记录</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {events.map((evt, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02] transition-all">
              <span className="text-[9px] text-white/15 font-mono w-14">{evt.time}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                evt.action === '修改' ? 'bg-amber-500/10 text-amber-400/70' : 'bg-emerald-500/10 text-emerald-400/70'
              }`}>{evt.action}</span>
              <span className="text-[10px] text-white/50 font-mono flex-1">{evt.file}</span>
              <span className="text-[9px] text-white/15">{evt.size}</span>
              <span className={`text-[9px] ${evt.result.includes('✔') ? 'text-emerald-400/60' : 'text-white/20'}`}>{evt.result}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Main Component
   ================================================================ */

export function HostStorage() {
  const { hostStorageOpen, toggleHostStorage, projectName, panels, components } = useDesigner();
  const [activeTab, setActiveTab] = useState<'overview' | 'filesystem' | 'database' | 'auth' | 'watcher' | 'services'>('overview');
  const [activeStep, setActiveStep] = useState(4); // All steps done by default
  const [copied, setCopied] = useState(false);
  const [simRunning, setSimRunning] = useState(false);

  const handleCopy = useCallback((text: string) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSimulate = useCallback(() => {
    setSimRunning(true);
    setActiveStep(-1);
    let step = 0;
    const interval = setInterval(() => {
      if (step <= 4) {
        setActiveStep(step);
        step++;
      } else {
        setSimRunning(false);
        clearInterval(interval);
      }
    }, 1500);
  }, []);

  const t = useThemeTokens();
  if (!hostStorageOpen) return null;

  const terminalLines = generateTerminalOutput(activeStep);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className={`absolute inset-0 ${t.overlayBg} backdrop-blur-md`} onClick={toggleHostStorage} />
      <div
        className={`relative w-[920px] max-h-[90vh] ${t.modalBg} border ${t.modalBorder} rounded-2xl flex flex-col overflow-hidden`}
        style={{ boxShadow: t.modalShadow }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.sectionBorder}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-white/90">宿主机存储方案 · §5</div>
            <div className="text-[11px] text-white/30">本地自用 — Docker Volume 挂载 · 本地数据库 · 密钥管理 · 自动部署</div>
          </div>
          <button onClick={toggleHostStorage} className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-white/[0.06] overflow-x-auto">
          {([
            { key: 'overview' as const, label: '5 步总览', icon: Play },
            { key: 'filesystem' as const, label: '文件系统', icon: FolderTree },
            { key: 'services' as const, label: 'Docker 服务', icon: Container },
            { key: 'database' as const, label: '数据库配置', icon: Database },
            { key: 'auth' as const, label: '认证 & 密钥', icon: Shield },
            { key: 'watcher' as const, label: '自动部署', icon: RefreshCw },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] transition-all border-b-2 whitespace-nowrap ${
                activeTab === key
                  ? 'text-blue-400 border-blue-400 bg-blue-500/[0.05]'
                  : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          {/* ─── Overview Tab ─── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-[1fr_1fr] gap-5">
              {/* Left: Steps */}
              <div className="space-y-2">
                <div className="text-[10px] text-white/20 uppercase tracking-wider mb-3">宿主机存储 5 步工作流</div>
                {HOST_STEPS.map((step, idx) => {
                  const isDone = idx <= activeStep;
                  const isActive = idx === activeStep && simRunning;
                  const colorClasses: Record<string, string> = {
                    blue: 'border-blue-500/20 bg-blue-500/[0.04]',
                    emerald: 'border-emerald-500/20 bg-emerald-500/[0.04]',
                    amber: 'border-amber-500/20 bg-amber-500/[0.04]',
                    purple: 'border-purple-500/20 bg-purple-500/[0.04]',
                    cyan: 'border-cyan-500/20 bg-cyan-500/[0.04]',
                  };
                  const iconColors: Record<string, string> = {
                    blue: 'text-blue-400',
                    emerald: 'text-emerald-400',
                    amber: 'text-amber-400',
                    purple: 'text-purple-400',
                    cyan: 'text-cyan-400',
                  };

                  return (
                    <div
                      key={step.id}
                      onClick={() => !simRunning && setActiveStep(idx)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isDone
                          ? colorClasses[step.color]
                          : 'border-white/[0.06] bg-white/[0.01] opacity-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isDone ? `bg-${step.color}-500/15` : 'bg-white/[0.04]'
                      }`}>
                        {isDone && !isActive ? (
                          <CheckCircle2 className={`w-4 h-4 ${iconColors[step.color]}`} />
                        ) : isActive ? (
                          <RefreshCw className={`w-4 h-4 ${iconColors[step.color]} animate-spin`} />
                        ) : (
                          <step.icon className="w-4 h-4 text-white/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/25">{step.step}</span>
                          <span className="text-[12px] text-white/70">{step.title}</span>
                        </div>
                        <div className="text-[10px] text-white/30 mt-0.5">{step.desc}</div>
                        {step.command && isDone && (
                          <pre className="mt-2 p-2 rounded-lg bg-black/30 text-[9px] text-white/25 font-mono overflow-x-auto">{step.command}</pre>
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={handleSimulate}
                  disabled={simRunning}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-500/20 text-blue-400 text-[12px] hover:from-blue-500/25 hover:to-cyan-500/25 transition-all disabled:opacity-50 mt-2"
                >
                  {simRunning ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> 模拟执行中...</> : <><Play className="w-3.5 h-3.5" /> 模拟 5 步初始化</>}
                </button>
              </div>

              {/* Right: Terminal */}
              <div className="flex flex-col rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border-b border-white/[0.04]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">bash — 宿主机终端</span>
                  <button
                    onClick={() => handleCopy(terminalLines.join('\n'))}
                    className="ml-auto text-white/15 hover:text-white/40 transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 bg-[#0a0b10] max-h-[460px]">
                  {terminalLines.map((line, i) => (
                    <div key={i} className={`text-[10px] font-mono leading-relaxed ${
                      line.startsWith('$') ? 'text-emerald-400/60' :
                      line.startsWith('  ✔') || line.startsWith('[+]') ? 'text-cyan-400/50' :
                      line.startsWith('→') ? 'text-amber-400/50' :
                      line.startsWith('[watcher]') ? 'text-purple-400/50' :
                      line.startsWith('[build]') || line.startsWith('[deploy]') ? 'text-blue-400/50' :
                      'text-white/25'
                    }`}>
                      {line || '\u00A0'}
                    </div>
                  ))}
                  {simRunning && (
                    <div className="text-emerald-400/40 text-[10px] font-mono animate-pulse">▋</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── File System Tab ─── */}
          {activeTab === 'filesystem' && (
            <div className="grid grid-cols-[1fr_300px] gap-5">
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-3 py-2 bg-white/[0.02] border-b border-white/[0.04] flex items-center gap-2">
                  <FolderTree className="w-3.5 h-3.5 text-amber-400/60" />
                  <span className="text-[11px] text-white/50">宿主机文件结构</span>
                </div>
                <div className="p-2 max-h-[420px] overflow-y-auto">
                  <FileTreeView nodes={FILE_TREE} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] text-white/20 uppercase tracking-wider">挂载映射</div>
                {[
                  { host: './my-designs', container: '/app/designs', desc: 'Design JSON 目录', color: 'indigo' },
                  { host: './data', container: '/app/data', desc: '本地数据库目录', color: 'amber' },
                  { host: './.env', container: '/app/.env', desc: '环境变量配置', color: 'purple' },
                  { host: './frontend/src', container: '/app/src', desc: '前端源码 (HMR)', color: 'blue' },
                ].map(mount => (
                  <div key={mount.host} className={`p-3 rounded-xl border border-${mount.color}-500/15 bg-${mount.color}-500/[0.03]`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <FolderOpen className={`w-3 h-3 text-${mount.color}-400`} />
                      <span className="text-[10px] text-white/50">{mount.desc}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-mono">
                      <span className="text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{mount.host}</span>
                      <ArrowRight className="w-3 h-3 text-white/10" />
                      <span className="text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{mount.container}</span>
                    </div>
                  </div>
                ))}

                <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400/80">双写保障</span>
                  </div>
                  <div className="text-[10px] text-white/30 leading-relaxed">
                    本地首写 (IndexedDB) + 宿主机同步 (REST API) 双写机制，确保离线也能编辑。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Docker Services Tab ─── */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {DOCKER_SERVICES.map(svc => (
                  <div key={svc.name} className="rounded-xl border border-white/[0.06] p-3 bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${
                        svc.status === 'running' ? 'bg-emerald-400' :
                        svc.status === 'starting' ? 'bg-amber-400 animate-pulse' :
                        'bg-red-400'
                      }`} />
                      <span className="text-[12px] text-white/70">{svc.name}</span>
                    </div>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between">
                        <span className="text-white/20">镜像</span>
                        <span className="text-white/40 font-mono">{svc.image}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/20">端口</span>
                        <span className="text-white/40 font-mono">{svc.port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/20">CPU</span>
                        <span className="text-emerald-400/60">{svc.cpu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/20">内存</span>
                        <span className="text-cyan-400/60">{svc.memory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/20">运行时间</span>
                        <span className="text-white/30">{svc.uptime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compose commands */}
              <div className="rounded-xl border border-white/[0.06] p-4 space-y-2">
                <div className="text-[10px] text-white/25 uppercase tracking-wider mb-2">常用 Docker 命令</div>
                {[
                  { cmd: 'docker compose up -d --build', desc: '构建并启动所有服务' },
                  { cmd: 'docker compose ps', desc: '查看运行状态' },
                  { cmd: 'docker compose logs -f backend', desc: '跟踪后端日志' },
                  { cmd: 'docker compose exec backend npx prisma migrate dev', desc: '数据库迁移' },
                  { cmd: 'docker compose restart frontend', desc: '重启前端容器' },
                  { cmd: 'docker compose down', desc: '停止所有服务' },
                ].map(item => (
                  <div key={item.cmd} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] group transition-all">
                    <code className="text-[10px] text-emerald-400/60 font-mono flex-1 bg-black/20 px-2 py-1 rounded">{item.cmd}</code>
                    <span className="text-[9px] text-white/20 w-36 text-right">{item.desc}</span>
                    <button
                      onClick={() => handleCopy(item.cmd)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white/50"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Architecture summary */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/[0.04] border border-blue-500/10">
                <Container className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <div className="text-[11px] text-blue-400/80">Docker Compose 编排</div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    4 个容器 (frontend:5173 + backend:3000 + db + yjs:1234) 通过 app-network 桥接网络互通，
                    volumes 挂载宿主机 ./my-designs 和 ./data 目录实现数据持久化。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Database Tab ─── */}
          {activeTab === 'database' && <DbConfigPanel />}

          {/* ─── Auth Tab ─── */}
          {activeTab === 'auth' && <AuthConfigPanel />}

          {/* ─── Watcher Tab ─── */}
          {activeTab === 'watcher' && <WatcherPanel />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/20">
              {panels.length} 面板 · {components.length} 组件 · {projectName}
            </span>
            <div className="flex items-center gap-1.5">
              {DOCKER_SERVICES.map(svc => (
                <div key={svc.name} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[8px] text-white/15">{svc.name}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={toggleHostStorage} className="px-4 py-1.5 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.1] transition-all">
            完成
          </button>
        </div>
      </div>
    </div>
  );
}