/**
 * PluginManager — Hot-loadable component/chart plugin registry
 *
 * Provides:
 * 1. Plugin Registry — register/unregister third-party component plugins
 * 2. Plugin Store UI — browse, install, and manage plugins
 * 3. Runtime rendering — dynamically resolve plugin components at render time
 */

import React, { useState, useCallback, useMemo, createContext, useContext, type ReactNode } from 'react';
import {
  Package, Puzzle, Download, Check, Trash2, Search,
  X, Star, ExternalLink, Zap, ChartBar, Table2,
  Map, FileText, Calendar, Image, Activity, Loader,
  Shield, ShieldCheck, RefreshCw, ToggleLeft, ToggleRight,
  ShieldAlert, Lock,
} from 'lucide-react';
import { useThemeTokens, type ThemeTokens } from './hooks/useThemeTokens';
import { motion, AnimatePresence } from 'motion/react';
import { useDesigner } from '../../store';

/* ================================================================
   Plugin Types
   ================================================================ */

export interface PluginComponentDef {
  /** Unique component type identifier (used in ComponentInstance.type) */
  type: string;
  label: string;
  icon: string;
  category: 'basic' | 'form' | 'data' | 'media' | 'advanced' | 'chart' | 'map' | 'workflow';
  defaultProps: Record<string, any>;
  /** JSON Schema for props */
  propsSchema?: Record<string, any>;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  homepage?: string;
  license: string;
  /** Components provided by this plugin */
  components: PluginComponentDef[];
  /** Whether this plugin has been verified by YYC3 team */
  verified: boolean;
  /** npm package name (for reference) */
  packageName: string;
  /** Icon URL or lucide icon name */
  icon?: string;
  /** Download count (mock) */
  downloads: number;
  /** Star rating (mock) */
  stars: number;
  /** Tags for search */
  tags: string[];
}

export interface InstalledPlugin extends PluginManifest {
  installedAt: number;
  enabled: boolean;
}

/* ================================================================
   Built-in Plugin Registry (Mock)
   ================================================================ */

const AVAILABLE_PLUGINS: PluginManifest[] = [
  {
    id: 'yyc3-charts',
    name: 'YYC³ 图表插件',
    version: '2.1.0',
    author: 'YANYUCLOUD Team',
    description: '丰富的图表组件库，支持折线图、柱状图、饼图、雷达图、热力图等 12+ 图表类型，基于 Recharts 封装。',
    homepage: 'https://yyc3.dev/plugins/charts',
    license: 'MIT',
    verified: true,
    packageName: '@yyc3/plugin-charts',
    downloads: 12450,
    stars: 4.8,
    tags: ['图表', 'charts', 'recharts', '数据可视化'],
    components: [
      { type: 'LineChart', label: '折线图', icon: 'Activity', category: 'chart', defaultProps: { dataSource: 'mock', xKey: 'date', yKey: 'value', color: '#6366f1' } },
      { type: 'BarChart', label: '柱状图', icon: 'ChartBar', category: 'chart', defaultProps: { dataSource: 'mock', xKey: 'category', yKey: 'count', color: '#10b981' } },
      { type: 'PieChart', label: '饼图', icon: 'PieChart', category: 'chart', defaultProps: { dataSource: 'mock', nameKey: 'name', valueKey: 'value' } },
      { type: 'RadarChart', label: '雷达图', icon: 'Target', category: 'chart', defaultProps: { dataSource: 'mock', dimensions: ['A', 'B', 'C', 'D', 'E'] } },
    ],
  },
  {
    id: 'yyc3-data-grid',
    name: 'YYC³ 高级数据表格',
    version: '1.5.2',
    author: 'YANYUCLOUD Team',
    description: '企业级数据表格组件，支持虚拟滚动、列固定、行选择、可编辑单元格、树形数据、聚合统计。',
    verified: true,
    packageName: '@yyc3/plugin-data-grid',
    downloads: 8720,
    stars: 4.6,
    tags: ['表格', 'data-grid', '虚拟滚动', '企业级'],
    license: 'MIT',
    components: [
      { type: 'DataGrid', label: '高级表格', icon: 'Table2', category: 'data', defaultProps: { dataSource: 'local:users', pageSize: 50, virtualScroll: true, editable: false } },
      { type: 'TreeTable', label: '树形表格', icon: 'GitBranch', category: 'data', defaultProps: { dataSource: 'local:departments', expandAll: false } },
      { type: 'PivotTable', label: '透视表', icon: 'Layers', category: 'data', defaultProps: { dataSource: 'mock', rows: ['region'], cols: ['year'], values: ['revenue'] } },
    ],
  },
  {
    id: 'yyc3-map',
    name: 'YYC³ 地图插件',
    version: '1.2.0',
    author: 'Community',
    description: '基于 Leaflet / Mapbox 的地图组件，支持标记点、热力层、轨迹回放、地理围栏。',
    verified: false,
    packageName: '@yyc3/plugin-map',
    downloads: 3210,
    stars: 4.2,
    tags: ['地图', 'map', 'leaflet', 'GIS'],
    license: 'Apache-2.0',
    components: [
      { type: 'MapView', label: '地图视图', icon: 'Map', category: 'map', defaultProps: { center: [39.9, 116.4], zoom: 12, style: 'dark' } },
      { type: 'HeatmapLayer', label: '热力图层', icon: 'Flame', category: 'map', defaultProps: { dataSource: 'mock', radius: 25, maxIntensity: 100 } },
    ],
  },
  {
    id: 'yyc3-workflow',
    name: 'YYC³ 工作流引擎',
    version: '0.9.1',
    author: 'Community',
    description: '可视化工作流编排组件，支持条件分支、并行、循环、人工审批节点，输出 BPMN 2.0 格式。',
    verified: false,
    packageName: '@yyc3/plugin-workflow',
    downloads: 1890,
    stars: 4.0,
    tags: ['工作流', 'workflow', 'BPMN', '流程编排'],
    license: 'MIT',
    components: [
      { type: 'WorkflowCanvas', label: '工作流画布', icon: 'Workflow', category: 'workflow', defaultProps: { nodes: [], edges: [], editable: true } },
    ],
  },
  {
    id: 'yyc3-rich-text',
    name: 'YYC³ 富文本编辑器',
    version: '1.0.3',
    author: 'YANYUCLOUD Team',
    description: '基于 TipTap 的富文本编辑器组件，支持 Markdown 快捷键、代码块、表格、图片上传。',
    verified: true,
    packageName: '@yyc3/plugin-rich-text',
    downloads: 5670,
    stars: 4.5,
    tags: ['富文本', 'rich-text', 'editor', 'markdown'],
    license: 'MIT',
    components: [
      { type: 'RichTextEditor', label: '富文本编辑器', icon: 'FileText', category: 'advanced', defaultProps: { content: '', placeholder: '开始编辑...', toolbar: true } },
    ],
  },
  {
    id: 'yyc3-calendar',
    name: 'YYC³ 日历组件',
    version: '1.1.0',
    author: 'Community',
    description: '日历/日程组件，支持月/周/日视图、拖拽日程、重复事件、多日历叠加。',
    verified: false,
    packageName: '@yyc3/plugin-calendar',
    downloads: 2340,
    stars: 3.9,
    tags: ['日历', 'calendar', '日程', 'schedule'],
    license: 'MIT',
    components: [
      { type: 'CalendarView', label: '日历视图', icon: 'Calendar', category: 'advanced', defaultProps: { view: 'month', events: [], editable: true } },
    ],
  },
];

/* ================================================================
   Plugin Registry Context
   ================================================================ */

interface PluginRegistryContextType {
  installed: InstalledPlugin[];
  available: PluginManifest[];
  install: (pluginId: string) => void;
  uninstall: (pluginId: string) => void;
  toggle: (pluginId: string) => void;
  getPluginComponents: () => PluginComponentDef[];
  isInstalled: (pluginId: string) => boolean;
}

const PluginRegistryContext = createContext<PluginRegistryContextType | null>(null);

export function usePluginRegistry() {
  const ctx = useContext(PluginRegistryContext);
  if (!ctx) {
    // Return a no-op registry when outside provider
    return {
      installed: [] as InstalledPlugin[],
      available: AVAILABLE_PLUGINS,
      install: () => {},
      uninstall: () => {},
      toggle: () => {},
      getPluginComponents: () => [] as PluginComponentDef[],
      isInstalled: () => false,
    };
  }
  return ctx;
}

const STORAGE_KEY = 'yyc3-installed-plugins';

function loadInstalled(): InstalledPlugin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function saveInstalled(plugins: InstalledPlugin[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins)); } catch {}
}

export function PluginRegistryProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState<InstalledPlugin[]>(loadInstalled);

  const install = useCallback((pluginId: string) => {
    const manifest = AVAILABLE_PLUGINS.find(p => p.id === pluginId);
    if (!manifest) return;
    setInstalled(prev => {
      if (prev.find(p => p.id === pluginId)) return prev;
      const next = [...prev, { ...manifest, installedAt: Date.now(), enabled: true }];
      saveInstalled(next);
      return next;
    });
  }, []);

  const uninstall = useCallback((pluginId: string) => {
    setInstalled(prev => {
      const next = prev.filter(p => p.id !== pluginId);
      saveInstalled(next);
      return next;
    });
  }, []);

  const toggle = useCallback((pluginId: string) => {
    setInstalled(prev => {
      const next = prev.map(p => p.id === pluginId ? { ...p, enabled: !p.enabled } : p);
      saveInstalled(next);
      return next;
    });
  }, []);

  const getPluginComponents = useCallback((): PluginComponentDef[] => {
    return installed
      .filter(p => p.enabled)
      .flatMap(p => p.components);
  }, [installed]);

  const isInstalled = useCallback((pluginId: string) => {
    return installed.some(p => p.id === pluginId);
  }, [installed]);

  return (
    <PluginRegistryContext.Provider value={{
      installed, available: AVAILABLE_PLUGINS,
      install, uninstall, toggle, getPluginComponents, isInstalled,
    }}>
      {children}
    </PluginRegistryContext.Provider>
  );
}

/* ================================================================
   Plugin Store Dialog
   ================================================================ */

export function PluginStoreDialog({ onClose }: { onClose: () => void }) {
  const t = useThemeTokens();
  const { installed, available, install, uninstall, toggle, isInstalled } = usePluginRegistry();
  const { currentUserIdentity } = useDesigner();
  const [tab, setTab] = useState<'browse' | 'installed'>('browse');
  const [search, setSearch] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);

  // RBAC: viewer and guest cannot install/uninstall/toggle plugins
  const userRole = currentUserIdentity?.role || 'editor';
  const canManage = userRole === 'owner' || userRole === 'admin' || userRole === 'editor';

  const filteredAvailable = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q)
    );
  }, [available, search]);

  const handleInstall = useCallback((pluginId: string) => {
    setInstalling(pluginId);
    // Simulate async install
    setTimeout(() => {
      install(pluginId);
      setInstalling(null);
    }, 800);
  }, [install]);

  const categoryIcons: Record<string, React.ElementType> = {
    chart: ChartBar,
    data: Table2,
    map: Map,
    advanced: FileText,
    workflow: Activity,
  };

  return (
    <motion.div
      className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`w-[680px] max-h-[80vh] ${t.panelBg} border ${t.panelBorder} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 120px rgba(99,102,241,0.08)' }}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.sectionBorder}`}>
          <div className={`w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center`}>
            <Puzzle className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className={`text-[13px] ${t.textPrimary}`} style={{ fontWeight: 600 }}>插件市场</h3>
            <p className={`text-[10px] ${t.textTertiary} mt-0.5`}>
              发现和安装第三方组件插件 · {installed.length} 已安装 · {available.length} 可用
            </p>
          </div>

          {/* Tab switcher */}
          <div className={`flex items-center ${t.inputBg} rounded-lg p-0.5`}>
            <button
              onClick={() => setTab('browse')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-all ${
                tab === 'browse'
                  ? 'bg-violet-500/20 text-violet-300'
                  : `${t.textTertiary} hover:text-white/60`
              }`}
            >
              <Package className="w-3 h-3" />
              浏览
            </button>
            <button
              onClick={() => setTab('installed')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-all ${
                tab === 'installed'
                  ? 'bg-violet-500/20 text-violet-300'
                  : `${t.textTertiary} hover:text-white/60`
              }`}
            >
              <Check className="w-3 h-3" />
              已安装 ({installed.length})
            </button>
          </div>

          <button onClick={onClose} className={`p-1.5 rounded-md ${t.textMuted} hover:text-white/50 ${t.hoverBg}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* RBAC Permission Banner */}
        {!canManage && (
          <div className={`flex items-center gap-2.5 px-5 py-2.5 ${t.rbacDeniedBg} border-b ${t.rbacDeniedBorder}`}>
            <ShieldAlert className={`w-4 h-4 ${t.rbacDeniedText} shrink-0`} />
            <div className="flex-1">
              <span className={`text-[11px] ${t.rbacDeniedText}`}>
                {userRole === 'viewer' ? '观察者' : '访客'}模式 — 插件安装/卸载/启停操作已禁用
              </span>
            </div>
            <Lock className={`w-3.5 h-3.5 ${t.rbacDeniedText} opacity-50 shrink-0`} />
          </div>
        )}

        {/* Search */}
        <div className={`flex items-center gap-2 px-5 py-2.5 border-b ${t.sectionBorder}`}>
          <Search className={`w-4 h-4 ${t.textMuted}`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索插件名称、标签..."
            className={`flex-1 bg-transparent text-[12px] ${t.inputText} placeholder:text-white/20 outline-none`}
          />
        </div>

        {/* Plugin list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'browse' && filteredAvailable.map(plugin => {
            const isInst = isInstalled(plugin.id);
            const isLoading = installing === plugin.id;
            const CategoryIcon = categoryIcons[plugin.components[0]?.category] || Package;

            return (
              <div key={plugin.id} className={`p-4 rounded-xl border ${t.sectionBorder} ${t.hoverBg} transition-all`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${plugin.verified ? 'bg-violet-500/15' : 'bg-white/[0.04]'} flex items-center justify-center shrink-0`}>
                    <CategoryIcon className={`w-5 h-5 ${plugin.verified ? 'text-violet-400' : t.textMuted}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] ${t.textPrimary}`} style={{ fontWeight: 600 }}>{plugin.name}</span>
                      <span className={`text-[9px] ${t.textMuted}`}>v{plugin.version}</span>
                      {plugin.verified && (
                        <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          官方认证
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] ${t.textTertiary} mt-1 line-clamp-2`}>{plugin.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[9px] ${t.textMuted}`}>by {plugin.author}</span>
                      <span className={`text-[9px] ${t.textMuted}`}>{plugin.downloads.toLocaleString()} 安装</span>
                      <span className="flex items-center gap-0.5 text-[9px] text-amber-400/70">
                        <Star className="w-2.5 h-2.5" />
                        {plugin.stars}
                      </span>
                      <span className={`text-[9px] ${t.textMuted}`}>{plugin.components.length} 组件</span>
                    </div>
                    {/* Component tags */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {plugin.components.map(c => (
                        <span key={c.type} className={`text-[8px] px-1.5 py-0.5 rounded ${t.inputBg} ${t.textMuted} border border-white/[0.04]`}>
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isInst ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/15">
                        <Check className="w-3 h-3" />
                        已安装
                      </span>
                    ) : canManage ? (
                      <button
                        onClick={() => handleInstall(plugin.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-[10px] text-violet-300 bg-violet-500/15 px-2.5 py-1.5 rounded-lg border border-violet-500/20 hover:bg-violet-500/25 transition-all"
                      >
                        {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        {isLoading ? '安装中...' : '安装'}
                      </button>
                    ) : (
                      <span className={`flex items-center gap-1 text-[10px] ${t.rbacDeniedText} ${t.rbacDeniedBg} px-2.5 py-1.5 rounded-lg border ${t.rbacDeniedBorder} cursor-not-allowed`}>
                        <Lock className="w-3 h-3" />
                        无权限
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {tab === 'installed' && installed.length === 0 && (
            <div className={`text-center py-12 ${t.textTertiary}`}>
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-[12px]">尚未安装任何插件</p>
              <p className="text-[10px] mt-1 opacity-60">切换到「浏览」标签发现插件</p>
            </div>
          )}

          {tab === 'installed' && installed.map(plugin => (
            <div key={plugin.id} className={`p-4 rounded-xl border ${t.sectionBorder} ${plugin.enabled ? '' : 'opacity-50'} transition-all`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${plugin.verified ? 'bg-violet-500/15' : 'bg-white/[0.04]'} flex items-center justify-center shrink-0`}>
                  <Puzzle className={`w-4 h-4 ${plugin.verified ? 'text-violet-400' : t.textMuted}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] ${t.textPrimary}`} style={{ fontWeight: 500 }}>{plugin.name}</span>
                    <span className={`text-[9px] ${t.textMuted}`}>v{plugin.version}</span>
                  </div>
                  <p className={`text-[10px] ${t.textTertiary}`}>{plugin.components.length} 组件 · {plugin.packageName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {canManage ? (
                    <>
                      <button
                        onClick={() => toggle(plugin.id)}
                        className={`p-1.5 rounded-md transition-all ${
                          plugin.enabled
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : `${t.textMuted} ${t.hoverBg}`
                        }`}
                        title={plugin.enabled ? '禁用' : '启用'}
                      >
                        {plugin.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => uninstall(plugin.id)}
                        className={`p-1.5 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all`}
                        title="卸载"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className={`flex items-center gap-1 text-[9px] ${t.rbacDeniedText} ${t.rbacDeniedBg} px-2 py-1 rounded border ${t.rbacDeniedBorder}`}>
                      <Lock className="w-3 h-3" />
                      只读
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-3 px-5 py-3 border-t ${t.sectionBorder}`}>
          <span className={`text-[9px] ${t.textMuted}`}>
            插件安装到本地 localStorage · 组件运行时动态注入到组件面板
          </span>
          <div className="flex-1" />
          {!canManage && (
            <span className={`text-[9px] ${t.rbacDeniedText} flex items-center gap-1`}>
              <ShieldAlert className="w-3 h-3" />
              {userRole === 'viewer' ? '观察者' : '访客'}权限
            </span>
          )}
          <span className={`text-[9px] ${t.textMuted}`}>YYC³ Plugin Ecosystem v1.0</span>
        </div>
      </motion.div>
    </motion.div>
  );
}