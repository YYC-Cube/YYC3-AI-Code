import React, { useState } from 'react';
import {
  X, Database, Table, ChevronRight, ChevronDown, Link2, Unlink,
  Key, Hash, Type, Calendar, ToggleLeft, Search, Plus, RefreshCw,
  CheckCircle2, AlertTriangle, Code, Copy, Check, FileCode2
} from 'lucide-react';
import { useDesigner } from '../../store';
import { copyToClipboard } from '../../utils/clipboard';
import { useThemeTokens } from './hooks/useThemeTokens';

/* ================================================================
   Mock Database Schema — simulated local DB tables
   ================================================================ */

interface DBColumn {
  name: string;
  type: 'string' | 'integer' | 'boolean' | 'datetime' | 'float' | 'text' | 'enum';
  nullable: boolean;
  isPrimary?: boolean;
  isForeign?: boolean;
  foreignRef?: string;
  defaultVal?: string;
}

interface DBTable {
  name: string;
  schema: string;
  rowCount: number;
  columns: DBColumn[];
}

const MOCK_TABLES: DBTable[] = [
  {
    name: 'users',
    schema: 'public',
    rowCount: 28491,
    columns: [
      { name: 'id', type: 'string', nullable: false, isPrimary: true, defaultVal: 'uuid()' },
      { name: 'email', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: true },
      { name: 'role', type: 'enum', nullable: false, defaultVal: 'USER' },
      { name: 'openai_id', type: 'string', nullable: true },
      { name: 'created_at', type: 'datetime', nullable: false, defaultVal: 'now()' },
      { name: 'updated_at', type: 'datetime', nullable: false, defaultVal: 'now()' },
    ],
  },
  {
    name: 'designs',
    schema: 'public',
    rowCount: 156,
    columns: [
      { name: 'id', type: 'string', nullable: false, isPrimary: true, defaultVal: 'uuid()' },
      { name: 'name', type: 'string', nullable: false },
      { name: 'json', type: 'text', nullable: false },
      { name: 'owner_id', type: 'string', nullable: false, isForeign: true, foreignRef: 'users.id' },
      { name: 'created_at', type: 'datetime', nullable: false, defaultVal: 'now()' },
      { name: 'updated_at', type: 'datetime', nullable: false, defaultVal: 'now()' },
    ],
  },
  {
    name: 'analytics',
    schema: 'public',
    rowCount: 384720,
    columns: [
      { name: 'id', type: 'integer', nullable: false, isPrimary: true, defaultVal: 'autoincrement()' },
      { name: 'event', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true, isForeign: true, foreignRef: 'users.id' },
      { name: 'value', type: 'float', nullable: true },
      { name: 'metadata', type: 'text', nullable: true },
      { name: 'timestamp', type: 'datetime', nullable: false, defaultVal: 'now()' },
    ],
  },
  {
    name: 'items',
    schema: 'public',
    rowCount: 1247,
    columns: [
      { name: 'id', type: 'string', nullable: false, isPrimary: true, defaultVal: 'uuid()' },
      { name: 'title', type: 'string', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'status', type: 'enum', nullable: false, defaultVal: 'ACTIVE' },
      { name: 'price', type: 'float', nullable: true },
      { name: 'created_at', type: 'datetime', nullable: false, defaultVal: 'now()' },
    ],
  },
];

const typeIcons: Record<string, React.ElementType> = {
  string: Type, integer: Hash, boolean: ToggleLeft,
  datetime: Calendar, float: Hash, text: Type, enum: ChevronDown,
};

const typeColors: Record<string, string> = {
  string: 'text-blue-400', integer: 'text-amber-400', boolean: 'text-pink-400',
  datetime: 'text-cyan-400', float: 'text-amber-400', text: 'text-blue-400', enum: 'text-purple-400',
};

/* ================================================================
   CRUD API Code Generator
   ================================================================ */

function generateCrudAPI(table: DBTable): string {
  const cap = table.name.charAt(0).toUpperCase() + table.name.slice(1);
  const singular = table.name.endsWith('s') ? table.name.slice(0, -1) : table.name;

  const zodFields = table.columns
    .filter(c => !c.isPrimary && !c.defaultVal?.includes('now'))
    .map(c => {
      let zType = c.type === 'string' || c.type === 'text' || c.type === 'enum' ? 'z.string()' :
                  c.type === 'integer' ? 'z.number().int()' :
                  c.type === 'float' ? 'z.number()' :
                  c.type === 'boolean' ? 'z.boolean()' :
                  c.type === 'datetime' ? 'z.string().datetime()' : 'z.unknown()';
      if (c.nullable) zType += '.nullable().optional()';
      return '  ' + c.name + ': ' + zType + ',';
    }).join('\n');

  const lines = [
    '// Auto-generated CRUD API for "' + table.name + '"',
    '// Prisma + Fastify — ' + table.columns.length + ' fields, ' + table.rowCount.toLocaleString() + ' rows',
    '',
    "import { FastifyInstance } from 'fastify';",
    "import { prisma } from '../prisma';",
    "import { z } from 'zod';",
    '',
    '// Zod validation schema',
    'const ' + cap + 'Schema = z.object({',
    zodFields,
    '});',
    '',
    'export async function ' + table.name + 'Routes(app: FastifyInstance) {',
    '  // GET /' + table.name + ' — List all',
    "  app.get('/" + table.name + "', async (req, res) => {",
    '    const { page = 1, limit = 20 } = req.query as any;',
    '    const [data, total] = await Promise.all([',
    '      prisma.' + singular + '.findMany({',
    '        skip: (page - 1) * limit,',
    '        take: limit,',
    "        orderBy: { created_at: 'desc' },",
    '      }),',
    '      prisma.' + singular + '.count(),',
    '    ]);',
    '    return { data, total, page, limit };',
    '  });',
    '',
    '  // GET /' + table.name + '/:id — Get by ID',
    "  app.get('/" + table.name + "/:id', async (req, res) => {",
    '    const { id } = req.params as { id: string };',
    '    const item = await prisma.' + singular + '.findUnique({ where: { id } });',
    "    if (!item) return res.status(404).send({ error: 'Not found' });",
    '    return item;',
    '  });',
    '',
    '  // POST /' + table.name + ' — Create',
    "  app.post('/" + table.name + "', async (req, res) => {",
    '    const body = ' + cap + 'Schema.parse(req.body);',
    '    const item = await prisma.' + singular + '.create({ data: body });',
    '    return res.status(201).send(item);',
    '  });',
    '',
    '  // PUT /' + table.name + '/:id — Update',
    "  app.put('/" + table.name + "/:id', async (req, res) => {",
    '    const { id } = req.params as { id: string };',
    '    const body = ' + cap + 'Schema.partial().parse(req.body);',
    '    const item = await prisma.' + singular + '.update({ where: { id }, data: body });',
    '    return item;',
    '  });',
    '',
    '  // DELETE /' + table.name + '/:id — Delete',
    "  app.delete('/" + table.name + "/:id', async (req, res) => {",
    '    const { id } = req.params as { id: string };',
    '    await prisma.' + singular + ".delete({ where: { id } });",
    '    return { success: true };',
    '  });',
    '}',
  ];

  return lines.join('\n');
}

function generateReactHook(table: DBTable): string {
  const cap = table.name.charAt(0).toUpperCase() + table.name.slice(1);
  const bt = '`'; // backtick character for generated template literals
  const ds = '$'; // dollar sign for generated interpolations

  const fields = table.columns.map(c => {
    const tsType = c.type === 'string' || c.type === 'text' || c.type === 'enum' ? 'string' :
                   c.type === 'integer' || c.type === 'float' ? 'number' :
                   c.type === 'boolean' ? 'boolean' :
                   c.type === 'datetime' ? 'string' : 'unknown';
    return '  ' + c.name + (c.nullable ? '?' : '') + ': ' + tsType + ';';
  }).join('\n');

  const lines = [
    '// Auto-generated React hooks for "' + table.name + '"',
    '// useQuery + useMutation pattern',
    '',
    "import { useState, useEffect, useCallback } from 'react';",
    '',
    "const API_BASE = '/api/" + table.name + "';",
    '',
    'interface ' + cap + ' {',
    fields,
    '}',
    '',
    'export function use' + cap + 'List(page = 1, limit = 20) {',
    '  const [data, setData] = useState<' + cap + '[]>([]);',
    '  const [total, setTotal] = useState(0);',
    '  const [loading, setLoading] = useState(true);',
    '',
    '  const refetch = useCallback(async () => {',
    '    setLoading(true);',
    '    const res = await fetch(' + bt + ds + '{API_BASE}?page=' + ds + '{page}&limit=' + ds + '{limit}' + bt + ');',
    '    const json = await res.json();',
    '    setData(json.data);',
    '    setTotal(json.total);',
    '    setLoading(false);',
    '  }, [page, limit]);',
    '',
    '  useEffect(() => { refetch(); }, [refetch]);',
    '',
    '  return { data, total, loading, refetch };',
    '}',
    '',
    'export function use' + cap + 'Mutation() {',
    '  const create = async (data: Partial<' + cap + '>) => {',
    '    const res = await fetch(API_BASE, {',
    "      method: 'POST',",
    "      headers: { 'Content-Type': 'application/json' },",
    '      body: JSON.stringify(data),',
    '    });',
    '    return res.json();',
    '  };',
    '',
    '  const update = async (id: string, data: Partial<' + cap + '>) => {',
    '    const res = await fetch(' + bt + ds + '{API_BASE}/' + ds + '{id}' + bt + ', {',
    "      method: 'PUT',",
    "      headers: { 'Content-Type': 'application/json' },",
    '      body: JSON.stringify(data),',
    '    });',
    '    return res.json();',
    '  };',
    '',
    '  const remove = async (id: string) => {',
    '    await fetch(' + bt + ds + '{API_BASE}/' + ds + '{id}' + bt + ", { method: 'DELETE' });",
    '  };',
    '',
    '  return { create, update, remove };',
    '}',
  ];

  return lines.join('\n');
}

/* ================================================================
   SchemaExplorer Component
   ================================================================ */

export function SchemaExplorer() {
  const { schemaExplorerOpen, toggleSchemaExplorer, setDataBinding, components, selectedComponentId, dataBindings } = useDesigner();
  const t = useThemeTokens();
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'schema' | 'crud' | 'hooks'>('schema');
  const [selectedTable, setSelectedTable] = useState<DBTable | null>(null);
  const [copied, setCopied] = useState(false);

  if (!schemaExplorerOpen) return null;

  const filteredTables = MOCK_TABLES.filter(t =>
    t.name.includes(searchTerm.toLowerCase()) ||
    t.columns.some(c => c.name.includes(searchTerm.toLowerCase()))
  );

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBind = (tableName: string) => {
    if (selectedComponentId) {
      setDataBinding(selectedComponentId, `local:${tableName}`);
    }
  };

  const codeContent = selectedTable
    ? activeTab === 'crud'
      ? generateCrudAPI(selectedTable)
      : activeTab === 'hooks'
      ? generateReactHook(selectedTable)
      : ''
    : '';

  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center ${t.overlayBg} backdrop-blur-sm`}>
      <div
        className={`w-[820px] max-h-[85vh] ${t.modalBg} border ${t.modalBorder} rounded-2xl flex flex-col overflow-hidden`}
        style={{ boxShadow: t.modalShadow }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${t.sectionBorder} shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-[14px] text-white/90" style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.4 }}>Schema Explorer</h2>
              <p className="text-[10px] text-white/30">SQLite / MySQL — Prisma ORM</p>
            </div>
          </div>
          <button onClick={toggleSchemaExplorer} className="p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Table list */}
          <div className="w-[260px] border-r border-white/[0.06] flex flex-col shrink-0">
            {/* Search */}
            <div className="p-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                <Search className="w-3.5 h-3.5 text-white/25" />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="搜索表/字段..."
                  className="flex-1 bg-transparent text-[12px] text-white/70 placeholder:text-white/20 outline-none"
                  style={{ fontSize: '12px', fontWeight: 400, lineHeight: 1.5 }}
                />
              </div>
            </div>

            {/* Tables */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
              {filteredTables.map(table => {
                const isExpanded = expandedTable === table.name;
                const isBound = Object.values(dataBindings).includes(`local:${table.name}`);
                return (
                  <div key={table.name}>
                    <button
                      onClick={() => { setExpandedTable(isExpanded ? null : table.name); setSelectedTable(table); }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all group ${
                        isExpanded ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-white/30" /> : <ChevronRight className="w-3 h-3 text-white/20" />}
                      <Table className="w-3.5 h-3.5 text-cyan-400/60" />
                      <span className="text-[12px] text-white/60 flex-1" style={{ fontSize: '12px', fontWeight: 400, lineHeight: 1.5 }}>{table.name}</span>
                      {isBound && <Link2 className="w-3 h-3 text-emerald-400/60" />}
                      <span className="text-[9px] text-white/15">{table.rowCount.toLocaleString()}</span>
                    </button>
                    {isExpanded && (
                      <div className="ml-5 pl-3 border-l border-white/[0.06] py-1 space-y-0.5">
                        {table.columns.map(col => {
                          const IconComp = typeIcons[col.type] || Type;
                          const colorClass = typeColors[col.type] || 'text-white/40';
                          return (
                            <div key={col.name} className="flex items-center gap-2 px-2 py-1 rounded text-[11px] hover:bg-white/[0.03] transition-colors">
                              {col.isPrimary && <Key className="w-3 h-3 text-amber-400/60" />}
                              {col.isForeign && <Link2 className="w-3 h-3 text-purple-400/60" />}
                              {!col.isPrimary && !col.isForeign && <IconComp className={`w-3 h-3 ${colorClass} opacity-50`} />}
                              <span className="text-white/50">{col.name}</span>
                              <span className={`text-[9px] ${colorClass} opacity-40`}>{col.type}</span>
                              {col.nullable && <span className="text-[8px] text-white/15">NULL</span>}
                            </div>
                          );
                        })}
                        {/* Bind button */}
                        <button
                          onClick={() => handleBind(table.name)}
                          disabled={!selectedComponentId}
                          className={`w-full mt-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] transition-all ${
                            selectedComponentId
                              ? 'text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10'
                              : 'text-white/15 cursor-not-allowed'
                          }`}
                        >
                          <Link2 className="w-3 h-3" />
                          <span>绑定到选中组件</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Code preview */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06] shrink-0">
              {([
                { id: 'schema' as const, label: 'Schema', icon: Database },
                { id: 'crud' as const, label: 'CRUD API', icon: Code },
                { id: 'hooks' as const, label: 'React Hooks', icon: FileCode2 },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/[0.08] text-white/80'
                      : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
              <div className="flex-1" />
              {codeContent && (
                <button
                  onClick={() => handleCopy(codeContent)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已复制' : '复制'}
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'schema' && selectedTable ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Table className="w-5 h-5 text-cyan-400/60" />
                    <div>
                      <div className="text-[14px] text-white/80" style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.4 }}>{selectedTable.schema}.{selectedTable.name}</div>
                      <div className="text-[10px] text-white/30">{selectedTable.columns.length} 字段 · {selectedTable.rowCount.toLocaleString()} 行</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-white/[0.03]">
                          <th className="text-left px-3 py-2 text-white/40" style={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.5 }}>字段</th>
                          <th className="text-left px-3 py-2 text-white/40" style={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.5 }}>类型</th>
                          <th className="text-left px-3 py-2 text-white/40" style={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.5 }}>约束</th>
                          <th className="text-left px-3 py-2 text-white/40" style={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.5 }}>默认值</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTable.columns.map(col => (
                          <tr key={col.name} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="px-3 py-2 text-white/60 flex items-center gap-2">
                              {col.isPrimary && <Key className="w-3 h-3 text-amber-400/60" />}
                              {col.isForeign && <Link2 className="w-3 h-3 text-purple-400/60" />}
                              {col.name}
                            </td>
                            <td className={`px-3 py-2 ${typeColors[col.type] || 'text-white/40'}`}>{col.type}</td>
                            <td className="px-3 py-2 text-white/30">
                              {col.isPrimary && <span className="text-amber-400/60 mr-1">PK</span>}
                              {col.isForeign && <span className="text-purple-400/60 mr-1">FK→{col.foreignRef}</span>}
                              {!col.nullable && <span className="text-red-400/40">NOT NULL</span>}
                            </td>
                            <td className="px-3 py-2 text-white/20">{col.defaultVal || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeTab === 'schema' ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Database className="w-10 h-10 text-white/[0.06] mb-3" />
                  <p className="text-[12px] text-white/20">选择左侧表以查看 Schema</p>
                </div>
              ) : codeContent ? (
                <pre className="text-[11px] text-white/60 whitespace-pre-wrap break-all" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '11px', fontWeight: 400, lineHeight: 1.6 }}>
                  {codeContent}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Code className="w-10 h-10 text-white/[0.06] mb-3" />
                  <p className="text-[12px] text-white/20">选择左侧表以生成代码</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}