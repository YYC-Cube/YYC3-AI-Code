/**
 * @file store.tsx
 * @description YYC3 Designer 全局状态管理 — Context + useReducer 模式，含面板/组件/AI/RBAC/CRDT 状态
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.3.0
 * @created 2026-03-08
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags store,context,state,designer,panel,rbac,crdt
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';

// Types
export interface ComponentDef {
  type: string;
  label: string;
  category: 'basic' | 'form' | 'data' | 'media' | 'advanced';
  icon: string;
  defaultProps: Record<string, any>;
}

export interface ComponentInstance {
  id: string;
  type: string;
  label: string;
  props: Record<string, any>;
  panelId: string;
  groupId?: string;
}

/** RBAC 角色类型 — Phase 12 多人协同 */
export type RBACRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'guest';

/** 面板级权限 */
export interface PanelPermissions {
  canEdit: RBACRole[];
  canDelete: RBACRole[];
  canShare: RBACRole[];
}

/** CRDT 用户身份 — 注入协同文档 */
export interface CRDTUserIdentity {
  userId: string;
  displayName: string;
  email: string;
  role: RBACRole;
  avatarColor: string;
  connectedAt: number;
}

/** 默认面板权限 */
export const DEFAULT_PANEL_PERMISSIONS: PanelPermissions = {
  canEdit: ['owner', 'admin', 'editor'],
  canDelete: ['owner', 'admin'],
  canShare: ['owner', 'admin', 'editor'],
};

/** 权限检查辅助函数 */
export function checkPanelPermission(
  panel: Panel,
  action: keyof PanelPermissions,
  userRole: RBACRole
): boolean {
  const perms = panel.permissions ?? DEFAULT_PANEL_PERMISSIONS;
  return perms[action].includes(userRole);
}

export interface Panel {
  id: string;
  name: string;
  type: 'blank' | 'form' | 'table' | 'chart' | 'custom';
  x: number;
  y: number;
  w: number;
  h: number;
  children: string[];
  /** Phase 12 RBAC — 创建者身份 */
  createdBy?: string;
  createdAt?: number;
  /** 当前锁定者（编辑中） */
  lockedBy?: string;
  /** 面板级权限覆盖 */
  permissions?: PanelPermissions;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'ollama' | 'custom';
  endpoint: string;
  apiKey: string;
  isActive: boolean;
  isDetected?: boolean;
}

export interface CRDTPeer {
  id: string;
  name: string;
  color: string;
  cursor: { panelId?: string; componentId?: string } | null;
  lastSeen: number;
  /** Phase 12 — RBAC 角色（注入自 CRDT 文档） */
  role?: RBACRole;
  /** Phase 12 — 当前锁定的面板 ID */
  lockedPanelId?: string;
}

export interface DesignerState {
  projectName: string;
  panels: Panel[];
  components: ComponentInstance[];
  selectedPanelId: string | null;
  selectedComponentId: string | null;
  theme: 'dark' | 'light';
  aiOpen: boolean;
  codePreviewOpen: boolean;
  aiMessages: AIMessage[];
  syncStatus: 'synced' | 'pending' | 'conflict';
  aiTokensUsed: number;
  viewMode: 'design' | 'preview' | 'code';
  modelSettingsOpen: boolean;
  aiModels: AIModel[];
  activeModelId: string | null;
  schemaExplorerOpen: boolean;
  deployPanelOpen: boolean;
  backendArchOpen: boolean;
  hostStorageOpen: boolean;
  figmaGuideOpen: boolean;
  deployManualOpen: boolean;
  qualityPanelOpen: boolean;
  subCanvasPanelId: string | null;
  snapEnabled: boolean;
  selectedComponentIds: string[];
  crdtPeers: CRDTPeer[];
  crdtDocVersion: number;
  crdtPanelOpen: boolean;
  dataBindings: Record<string, string>;
  designJsonValid: boolean;
  designJsonErrors: string[];
  conflictResolverOpen: boolean;
  conflicts: CRDTConflict[];
  /** 复式导航：一级活动栏当前选中区段 */
  activeNavSection: NavSection;
  /** 复式导航：二级面板是否展开 */
  secondaryNavOpen: boolean;
  /** 复式导航：三级子项 */
  activeNavSubItem: string | null;
  /** UI 视觉主题 */
  uiTheme: UITheme;
  /** Phase 12 — 当前用户 CRDT 身份 */
  currentUserIdentity: CRDTUserIdentity | null;
}

/** 一级导航区段 */
export type NavSection =
  | 'design'       // 设计画布（默认）
  | 'components'   // 组件面板
  | 'data'         // 数据管理（SchemaExplorer）
  | 'infra'        // 基础设施（Backend / Storage / Deploy）
  | 'ai'           // AI 助手 & Figma 指南
  | 'quality'      // 质量保障 & 测试
  | 'collab'       // CRDT 协同
  | 'settings';    // 设置（模型/主题等）

/** UI 视觉主题 */
export type UITheme = 'classic' | 'liquid-glass' | 'aurora';

export interface CRDTConflict {
  id: string;
  path: string;
  localValue: any;
  remoteValue: any;
  remotePeer: string;
  timestamp: number;
  resolved: boolean;
  resolution?: 'local' | 'remote' | 'merged';
}

/** Undo/Redo 快照只保存可逆数据 */
interface HistorySnapshot {
  panels: Panel[];
  components: ComponentInstance[];
  dataBindings: Record<string, string>;
}

// Component library
export const COMPONENT_LIBRARY: ComponentDef[] = [
  { type: 'Button', label: '按钮', category: 'basic', icon: 'RectangleHorizontal', defaultProps: { label: '按钮', variant: 'primary', size: 'md' } },
  { type: 'Text', label: '文本', category: 'basic', icon: 'Type', defaultProps: { content: '文本内容', size: 'base' } },
  { type: 'Image', label: '图片', category: 'basic', icon: 'Image', defaultProps: { src: '', alt: '', fit: 'cover' } },
  { type: 'Card', label: '卡片', category: 'basic', icon: 'Square', defaultProps: { title: '卡片标题', shadow: true, padding: 16 } },
  { type: 'Divider', label: '分割线', category: 'basic', icon: 'Minus', defaultProps: { orientation: 'horizontal', color: '#e5e7eb' } },
  { type: 'Badge', label: '徽标', category: 'basic', icon: 'Circle', defaultProps: { text: 'New', color: 'blue' } },
  { type: 'Input', label: '输入框', category: 'form', icon: 'TextCursorInput', defaultProps: { placeholder: '请输入...', type: 'text', required: false } },
  { type: 'Select', label: '选择器', category: 'form', icon: 'ChevronDown', defaultProps: { placeholder: '请选择', options: ['选项1', '选项2', '选项3'] } },
  { type: 'Checkbox', label: '复选框', category: 'form', icon: 'CheckSquare', defaultProps: { label: '复选项', checked: false } },
  { type: 'Switch', label: '开关', category: 'form', icon: 'ToggleLeft', defaultProps: { label: '开关', checked: false } },
  { type: 'DatePicker', label: '日期选择', category: 'form', icon: 'Calendar', defaultProps: { placeholder: '选择日期', format: 'YYYY-MM-DD' } },
  { type: 'Textarea', label: '文本域', category: 'form', icon: 'AlignLeft', defaultProps: { placeholder: '请输入...', rows: 4 } },
  { type: 'Table', label: '表格', category: 'data', icon: 'Table', defaultProps: { source: 'local:users', pageSize: 10, columns: ['Name', 'Email', 'Role'] } },
  { type: 'Chart', label: '图表', category: 'data', icon: 'ChartBar', defaultProps: { chartType: 'bar', dataSource: 'local:analytics' } },
  { type: 'List', label: '列表', category: 'data', icon: 'List', defaultProps: { source: 'local:items', layout: 'vertical' } },
  { type: 'Stat', label: '统计卡', category: 'data', icon: 'TrendingUp', defaultProps: { title: '总用户', value: '12,345', change: '+12%' } },
  { type: 'Progress', label: '进度条', category: 'data', icon: 'Loader', defaultProps: { value: 65, max: 100, color: 'blue' } },
  { type: 'Avatar', label: '头像', category: 'media', icon: 'User', defaultProps: { src: '', name: '用户', size: 'md' } },
  { type: 'Video', label: '视频', category: 'media', icon: 'Play', defaultProps: { src: '', autoplay: false } },
  { type: 'Icon', label: '图标', category: 'media', icon: 'Smile', defaultProps: { name: 'Star', size: 24, color: '#667eea' } },
  { type: 'Map', label: '地图', category: 'advanced', icon: 'MapPin', defaultProps: { center: [39.9, 116.4], zoom: 12 } },
  { type: 'Workflow', label: '工作流', category: 'advanced', icon: 'GitBranch', defaultProps: { nodes: 3, edges: 2 } },
  { type: 'Markdown', label: 'Markdown', category: 'advanced', icon: 'FileText', defaultProps: { content: '# Hello\n\nMarkdown content here.' } },
  { type: 'CodeBlock', label: '代码块', category: 'advanced', icon: 'Code', defaultProps: { language: 'typescript', code: 'const x = 1;' } },
];

// Initial state
const initialPanels: Panel[] = [
  { id: 'panel-1', name: '用户仪表盘', type: 'blank', x: 0, y: 0, w: 6, h: 8, children: ['comp-1', 'comp-2', 'comp-3'] },
  { id: 'panel-2', name: '数据表格', type: 'table', x: 6, y: 0, w: 6, h: 8, children: ['comp-4', 'comp-5'] },
  { id: 'panel-3', name: '分析图表', type: 'chart', x: 0, y: 8, w: 8, h: 6, children: ['comp-6'] },
  { id: 'panel-4', name: '表单模块', type: 'form', x: 8, y: 8, w: 4, h: 6, children: ['comp-7', 'comp-8', 'comp-9'] },
];

const initialComponents: ComponentInstance[] = [
  { id: 'comp-1', type: 'Stat', label: '总用户统计', props: { title: '总用户数', value: '28,491', change: '+12.5%', trend: 'up' }, panelId: 'panel-1' },
  { id: 'comp-2', type: 'Stat', label: '活跃用户', props: { title: '日活用户', value: '3,847', change: '+5.2%', trend: 'up' }, panelId: 'panel-1' },
  { id: 'comp-3', type: 'Chart', label: '趋势图', props: { chartType: 'line', dataSource: 'local:daily_active', title: '用户增长趋势' }, panelId: 'panel-1' },
  { id: 'comp-4', type: 'Table', label: '用户列表', props: { source: 'local:users', pageSize: 10, columns: ['姓名', '邮箱', '角色', '状态', '注册时间'] }, panelId: 'panel-2' },
  { id: 'comp-5', type: 'Button', label: '新增用户', props: { label: '+ 新增用户', variant: 'primary', size: 'md' }, panelId: 'panel-2' },
  { id: 'comp-6', type: 'Chart', label: '业务分析', props: { chartType: 'bar', dataSource: 'local:analytics', title: '月度业务报表' }, panelId: 'panel-3' },
  { id: 'comp-7', type: 'Input', label: '用户名输入', props: { placeholder: '请输入用户名', type: 'text', required: true, label: '用户名' }, panelId: 'panel-4' },
  { id: 'comp-8', type: 'Input', label: '邮箱输入', props: { placeholder: '请输入邮箱', type: 'email', required: true, label: '邮箱' }, panelId: 'panel-4' },
  { id: 'comp-9', type: 'Button', label: '提交按钮', props: { label: '提交', variant: 'primary', size: 'md' }, panelId: 'panel-4' },
];

const initialAIMessages: AIMessage[] = [
  {
    id: 'msg-0',
    role: 'system',
    content: `YYC3-DveOps AI 助手已绪。我可以帮你：

1. 智能推荐组件属性
2. 生成代码片段
3. 诊断布局冲突
4. 生成交互文档

请输入 /ai 或按 F1 开始对话。`,
    timestamp: Date.now() - 60000,
  },
];

const initialAIModels: AIModel[] = [
  {
    id: 'model-glm',
    name: 'glm-4.5',
    provider: 'custom',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    apiKey: '',
    isActive: true,
  },
  {
    id: 'model-qwen',
    name: 'qwen-plus',
    provider: 'custom',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: '',
    isActive: false,
  },
  {
    id: 'model-gpt4',
    name: 'gpt-4o-mini',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    isActive: false,
  },
];

// Context
interface DesignerContextType extends DesignerState {
  addPanel: (panel: Omit<Panel, 'id'>) => void;
  removePanel: (id: string) => void;
  selectPanel: (id: string | null) => void;
  addComponentToPanel: (panelId: string, compDef: ComponentDef) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  updateComponentProps: (id: string, props: Record<string, any>) => void;
  toggleTheme: () => void;
  toggleAI: () => void;
  toggleCodePreview: () => void;
  addAIMessage: (msg: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  setViewMode: (mode: 'design' | 'preview' | 'code') => void;
  setSyncStatus: (s: 'synced' | 'pending' | 'conflict') => void;
  updatePanelName: (id: string, name: string) => void;
  splitPanel: (id: string, direction: 'horizontal' | 'vertical') => void;
  duplicatePanel: (id: string) => void;
  duplicateComponent: (id: string) => void;
  splitPanelN: (id: string, direction: 'horizontal' | 'vertical', count: number) => void;
  openModelSettings: () => void;
  closeModelSettings: () => void;
  addAIModel: (model: Omit<AIModel, 'id'>) => void;
  removeAIModel: (id: string) => void;
  updateAIModel: (id: string, model: Partial<AIModel>) => void;
  activateAIModel: (id: string) => void;
  toggleSchemaExplorer: () => void;
  toggleDeployPanel: () => void;
  toggleBackendArch: () => void;
  toggleHostStorage: () => void;
  toggleFigmaGuide: () => void;
  toggleDeployManual: () => void;
  toggleQualityPanel: () => void;
  enterSubCanvas: (id: string) => void;
  exitSubCanvas: () => void;
  movePanelPixel: (id: string, dx: number, dy: number) => void;
  mergePanels: (sourceId: string, targetId: string) => void;
  batchUpdatePanelLayouts: (layouts: { id: string; x: number; y: number; w: number; h: number }[]) => void;
  toggleSnap: () => void;
  setDataBinding: (componentId: string, tableName: string) => void;
  toggleSelectComponent: (id: string) => void;
  clearComponentSelection: () => void;
  groupComponents: () => void;
  ungroupComponent: (groupId: string) => void;
  importDesignJSON: (json: string) => void;
  /** CRDT direct state setters (bypass undo history) */
  setPanelsFromCRDT: (panels: Panel[]) => void;
  setComponentsFromCRDT: (components: ComponentInstance[]) => void;
  toggleCRDTPanel: () => void;
  setCRDTPeers: (peers: CRDTPeer[]) => void;
  incrementDocVersion: () => void;
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Conflict
  toggleConflictResolver: () => void;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote') => void;
  resolveAllConflicts: (resolution: 'local' | 'remote') => void;
  simulateConflict: () => void;
  // 复式导航
  setActiveNavSection: (section: NavSection) => void;
  toggleSecondaryNav: () => void;
  setActiveNavSubItem: (item: string | null) => void;
  // UI 视觉主题
  setUITheme: (theme: UITheme) => void;
  // Phase 12 — RBAC 身份与面板锁定
  setCurrentUserIdentity: (identity: CRDTUserIdentity | null) => void;
  lockPanel: (panelId: string) => void;
  unlockPanel: (panelId: string) => void;
}

const MAX_HISTORY = 50;

// HMR-safe context: preserve the same context reference across hot reloads
const CTX_KEY = '__YANYUCLOUD_DESIGNER_CTX__';
const DesignerContext: React.Context<DesignerContextType | null> =
  (globalThis as any)[CTX_KEY] ??
  ((globalThis as any)[CTX_KEY] = createContext<DesignerContextType | null>(null));

export function useDesigner(): DesignerContextType {
  const ctx = useContext(DesignerContext);
  if (!ctx) throw new Error('useDesigner must be used within DesignerProvider');
  return ctx;
}

/* ================================================================
   Persistence helpers
   ================================================================ */

function loadState(): Partial<DesignerState> | null {
  try {
    const raw = localStorage.getItem('yyc3-designer-state');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state: DesignerState) {
  try {
    localStorage.setItem('yyc3-designer-state', JSON.stringify({
      projectName: state.projectName,
      panels: state.panels,
      components: state.components,
      theme: state.theme,
      aiModels: state.aiModels,
      activeModelId: state.activeModelId,
      dataBindings: state.dataBindings,
      snapEnabled: state.snapEnabled,
    }));
  } catch { /* quota exceeded — silently ignore */ }
}

/* ================================================================
   DesignerProvider
   ================================================================ */

export function DesignerProvider({ children }: { children: ReactNode }) {
  const saved = loadState();

  const [projectName] = useState(saved?.projectName ?? 'YYC3-DveOps 内部报表系统');
  const [panels, setPanels] = useState<Panel[]>(saved?.panels ?? initialPanels);
  const [components, setComponents] = useState<ComponentInstance[]>(saved?.components ?? initialComponents);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(saved?.theme ?? 'dark');
  const [aiOpen, setAiOpen] = useState(saved?.aiOpen ?? true);
  const [codePreviewOpen, setCodePreviewOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>(initialAIMessages);
  const [syncStatus, setSyncStatusState] = useState<'synced' | 'pending' | 'conflict'>('synced');
  const [aiTokensUsed, setAiTokensUsed] = useState(0);
  const [viewMode, setViewModeState] = useState<'design' | 'preview' | 'code'>('design');
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);
  const [aiModels, setAiModels] = useState<AIModel[]>(saved?.aiModels ?? initialAIModels);
  const [activeModelId, setActiveModelId] = useState<string | null>(saved?.activeModelId ?? 'model-glm');
  const [schemaExplorerOpen, setSchemaExplorerOpen] = useState(false);
  const [deployPanelOpen, setDeployPanelOpen] = useState(false);
  const [backendArchOpen, setBackendArchOpen] = useState(false);
  const [hostStorageOpen, setHostStorageOpen] = useState(false);
  const [figmaGuideOpen, setFigmaGuideOpen] = useState(false);
  const [deployManualOpen, setDeployManualOpen] = useState(false);
  const [qualityPanelOpen, setQualityPanelOpen] = useState(false);
  const [subCanvasPanelId, setSubCanvasPanelId] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(saved?.snapEnabled ?? true);
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [crdtPeers, setCRDTPeersState] = useState<CRDTPeer[]>([]);
  const [crdtDocVersion, setCRDTDocVersion] = useState(1);
  const [crdtPanelOpen, setCRDTPanelOpen] = useState(false);
  const [dataBindings, setDataBindingsState] = useState<Record<string, string>>(saved?.dataBindings ?? {});
  const [designJsonValid, setDesignJsonValid] = useState(true);
  const [designJsonErrors, setDesignJsonErrors] = useState<string[]>([]);
  const [conflictResolverOpen, setConflictResolverOpen] = useState(false);
  const [conflicts, setConflicts] = useState<CRDTConflict[]>([]);

  /* ---- Phase 12 — CRDT 用户身份 ---- */
  const [currentUserIdentity, setCurrentUserIdentityState] = useState<CRDTUserIdentity | null>(null);

  /* ---- UI 视觉主题 ---- */
  const [uiTheme, setUIThemeState] = useState<UITheme>(() => {
    try {
      return (localStorage.getItem('yyc3-ui-theme') as UITheme) || 'classic';
    } catch { return 'classic'; }
  });
  const setUITheme = useCallback((t: UITheme) => {
    setUIThemeState(t);
    try { localStorage.setItem('yyc3-ui-theme', t); } catch {}
  }, []);

  /* ---- 复式导航 ---- */
  const [activeNavSection, setActiveNavSectionState] = useState<NavSection>('components');
  const [secondaryNavOpen, setSecondaryNavOpen] = useState(true);
  const [activeNavSubItem, setActiveNavSubItemState] = useState<string | null>(null);

  const setActiveNavSection = useCallback((section: NavSection) => {
    setActiveNavSectionState(prev => {
      if (section === prev) {
        setSecondaryNavOpen(p => !p);
        return prev;
      }
      setSecondaryNavOpen(true);
      return section;
    });
    setActiveNavSubItemState(null);
  }, []);

  const toggleSecondaryNav = useCallback(() => {
    setSecondaryNavOpen(prev => !prev);
  }, []);

  const setActiveNavSubItem = useCallback((item: string | null) => {
    setActiveNavSubItemState(item);
  }, []);

  /* ---- Undo / Redo ---- */
  const pastRef = useRef<HistorySnapshot[]>([]);
  const futureRef = useRef<HistorySnapshot[]>([]);

  const takeSnapshot = useCallback((): HistorySnapshot => ({
    panels: JSON.parse(JSON.stringify(panels)),
    components: JSON.parse(JSON.stringify(components)),
    dataBindings: { ...dataBindings },
  }), [panels, components, dataBindings]);

  /** Push current state onto the undo stack before a mutation */
  const pushHistory = useCallback(() => {
    const snap = takeSnapshot();
    pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), snap];
    futureRef.current = []; // clear redo on new action
  }, [takeSnapshot]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const snap = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, takeSnapshot()];
    setPanels(snap.panels);
    setComponents(snap.components);
    setDataBindingsState(snap.dataBindings);
  }, [takeSnapshot]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const snap = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, takeSnapshot()];
    setPanels(snap.panels);
    setComponents(snap.components);
    setDataBindingsState(snap.dataBindings);
  }, [takeSnapshot]);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  /* ---- localStorage Persistence ---- */
  useEffect(() => {
    saveState({
      projectName, panels, components, selectedPanelId, selectedComponentId, theme,
      aiOpen, codePreviewOpen, aiMessages, syncStatus, aiTokensUsed, viewMode,
      modelSettingsOpen, aiModels, activeModelId, schemaExplorerOpen, deployPanelOpen,
      backendArchOpen, hostStorageOpen, figmaGuideOpen, deployManualOpen, qualityPanelOpen,
      subCanvasPanelId, snapEnabled, selectedComponentIds, crdtPeers, crdtDocVersion,
      crdtPanelOpen, dataBindings, designJsonValid, designJsonErrors,
      conflictResolverOpen, conflicts,
      activeNavSection, secondaryNavOpen, activeNavSubItem,
      uiTheme, currentUserIdentity,
    } as DesignerState);
  }, [projectName, panels, components, theme, aiModels, activeModelId, dataBindings, snapEnabled]);
  
  /* ---- State Self-Healing: auto-detect & fix invalid state ---- */
  useEffect(() => {
    let healed = false;
    const panelIds = new Set(panels.map(p => p.id));

    // 1. Remove orphaned components (panelId points to non-existent panel)
    const validComponents = components.filter(c => panelIds.has(c.panelId));
    if (validComponents.length !== components.length) {
      const removed = components.length - validComponents.length;
      console.warn(`[State Self-Heal] Removed ${removed} orphaned component(s)`);
      setComponents(validComponents);
      healed = true;
    }

    // 2. Fix panels with children[] referencing non-existent components
    const compIds = new Set(components.map(c => c.id));
    const fixedPanels = panels.map(p => {
      const validChildren = p.children.filter(cid => compIds.has(cid));
      if (validChildren.length !== p.children.length) {
        console.warn(`[State Self-Heal] Fixed panel "${p.name}" children: removed ${p.children.length - validChildren.length} stale ref(s)`);
        healed = true;
        return { ...p, children: validChildren };
      }
      return p;
    });
    if (healed && fixedPanels !== panels) setPanels(fixedPanels);

    // 3. Fix selected IDs pointing to deleted items
    if (selectedComponentId && !compIds.has(selectedComponentId)) {
      console.warn(`[State Self-Heal] Cleared stale selectedComponentId: ${selectedComponentId}`);
      setSelectedComponentId(null);
    }
    if (selectedPanelId && !panelIds.has(selectedPanelId)) {
      console.warn(`[State Self-Heal] Cleared stale selectedPanelId: ${selectedPanelId}`);
      setSelectedPanelId(null);
    }
    const validSelectedIds = selectedComponentIds.filter(id => compIds.has(id));
    if (validSelectedIds.length !== selectedComponentIds.length) {
      setSelectedComponentIds(validSelectedIds);
    }

    // 4. Ensure panels with components actually list them in children
    const panelChildMap = new Map<string, string[]>();
    for (const c of validComponents) {
      if (!panelChildMap.has(c.panelId)) panelChildMap.set(c.panelId, []);
      panelChildMap.get(c.panelId)!.push(c.id);
    }
    const syncedPanels = fixedPanels.map(p => {
      const expected = panelChildMap.get(p.id) || [];
      const missing = expected.filter(cid => !p.children.includes(cid));
      if (missing.length > 0) {
        console.debug(`[State Self-Heal] Panel "${p.name}" reconciled ${missing.length} child ref(s)`);
        return { ...p, children: [...p.children, ...missing] };
      }
      return p;
    });
    if (syncedPanels.some((p, i) => p !== fixedPanels[i])) {
      setPanels(syncedPanels);
    }

    // 5. Clean stale data bindings
    const staleBindings = Object.keys(dataBindings).filter(k => !compIds.has(k));
    if (staleBindings.length > 0) {
      console.warn(`[State Self-Heal] Removed ${staleBindings.length} stale data binding(s)`);
      setDataBindingsState(prev => {
        const next = { ...prev };
        staleBindings.forEach(k => delete next[k]);
        return next;
      });
    }

    // 6. Validate Design JSON structure
    const errors: string[] = [];
    for (const p of panels) {
      if (!p.id) errors.push('Panel missing id');
      if (p.w <= 0 || p.h <= 0) errors.push(`Panel "${p.name}" has invalid dimensions: w=${p.w}, h=${p.h}`);
    }
    for (const c of components) {
      if (!c.id) errors.push('Component missing id');
      if (!c.type) errors.push(`Component ${c.id} missing type`);
      if (!c.panelId) errors.push(`Component ${c.id} missing panelId`);
    }
    setDesignJsonValid(errors.length === 0);
    setDesignJsonErrors(errors);
  }, [panels, components, selectedComponentId, selectedPanelId, selectedComponentIds, dataBindings]);

  /* ---- Helpers ---- */
  const genId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  /* ================================================================
     Panel actions
     ================================================================ */

  const addPanel = useCallback((panel: Omit<Panel, 'id'>) => {
    pushHistory();
    const id = genId('panel');
    // Phase 12: Inject createdBy from current CRDT identity
    setPanels(prev => [...prev, {
      ...panel,
      id,
      createdBy: currentUserIdentity?.userId ?? undefined,
      createdAt: Date.now(),
    }]);
  }, [pushHistory, currentUserIdentity]);

  const removePanel = useCallback((id: string) => {
    // Phase 12: RBAC permission check — viewers and guests cannot delete panels
    const panel = panels.find(p => p.id === id);
    if (panel && currentUserIdentity) {
      if (!checkPanelPermission(panel, 'canDelete', currentUserIdentity.role)) {
        console.warn(`[RBAC] User "${currentUserIdentity.displayName}" (${currentUserIdentity.role}) denied: canDelete on panel "${panel.name}"`);
        return;
      }
    }
    pushHistory();
    setPanels(prev => prev.filter(p => p.id !== id));
    setComponents(prev => prev.filter(c => c.panelId !== id));
    if (selectedPanelId === id) setSelectedPanelId(null);
  }, [pushHistory, selectedPanelId, panels, currentUserIdentity]);

  const selectPanel = useCallback((id: string | null) => {
    setSelectedPanelId(id);
    if (id) { setSelectedComponentId(null); setSelectedComponentIds([]); }
  }, []);

  const updatePanelName = useCallback((id: string, name: string) => {
    pushHistory();
    setPanels(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }, [pushHistory]);

  const splitPanel = useCallback((id: string, direction: 'horizontal' | 'vertical') => {
    pushHistory();
    setPanels(prev => {
      const panel = prev.find(p => p.id === id);
      if (!panel) return prev;
      const newId = genId('panel');
      const newPanel: Panel = direction === 'horizontal'
        ? { ...panel, id: newId, name: `${panel.name} (右)`, x: panel.x + Math.ceil(panel.w / 2), w: Math.floor(panel.w / 2), children: [] }
        : { ...panel, id: newId, name: `${panel.name} (下)`, y: panel.y + Math.ceil(panel.h / 2), h: Math.floor(panel.h / 2), children: [] };
      const updated = prev.map(p => p.id === id ? {
        ...p,
        ...(direction === 'horizontal' ? { w: Math.ceil(p.w / 2) } : { h: Math.ceil(p.h / 2) }),
      } : p);
      return [...updated, newPanel];
    });
  }, [pushHistory]);

  const splitPanelN = useCallback((id: string, direction: 'horizontal' | 'vertical', count: number) => {
    pushHistory();
    setPanels(prev => {
      const panel = prev.find(p => p.id === id);
      if (!panel) return prev;
      const total = count + 1;
      const newPanels: Panel[] = [];
      for (let i = 1; i < total; i++) {
        const newId = genId('panel');
        newPanels.push(direction === 'horizontal'
          ? { ...panel, id: newId, name: `${panel.name} (${i + 1})`, x: panel.x + Math.round(panel.w / total * i), w: Math.round(panel.w / total), children: [] }
          : { ...panel, id: newId, name: `${panel.name} (${i + 1})`, y: panel.y + Math.round(panel.h / total * i), h: Math.round(panel.h / total), children: [] }
        );
      }
      const updated = prev.map(p => p.id === id ? {
        ...p,
        ...(direction === 'horizontal' ? { w: Math.round(p.w / total) } : { h: Math.round(p.h / total) }),
        name: `${p.name} (1)`,
      } : p);
      return [...updated, ...newPanels];
    });
  }, [pushHistory]);

  const duplicatePanel = useCallback((id: string) => {
    pushHistory();
    setPanels(prev => {
      const panel = prev.find(p => p.id === id);
      if (!panel) return prev;
      const newId = genId('panel');
      return [...prev, { ...panel, id: newId, name: `${panel.name} (副本)`, y: panel.y + panel.h, children: [] }];
    });
  }, [pushHistory]);

  const mergePanels = useCallback((sourceId: string, targetId: string) => {
    pushHistory();
    setPanels(prev => {
      const source = prev.find(p => p.id === sourceId);
      const target = prev.find(p => p.id === targetId);
      if (!source || !target) return prev;
      return prev
        .map(p => p.id === targetId ? { ...p, children: [...p.children, ...source.children] } : p)
        .filter(p => p.id !== sourceId);
    });
    setComponents(prev => prev.map(c => c.panelId === sourceId ? { ...c, panelId: targetId } : c));
  }, [pushHistory]);

  const movePanelPixel = useCallback((id: string, dx: number, dy: number) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, x: p.x + dx, y: p.y + dy } : p));
  }, []);

  const batchUpdatePanelLayouts = useCallback((layouts: { id: string; x: number; y: number; w: number; h: number }[]) => {
    pushHistory();
    setPanels(prev => prev.map(p => {
      const layout = layouts.find(l => l.id === p.id);
      if (layout) {
        return { ...p, x: layout.x, y: layout.y, w: layout.w, h: layout.h };
      }
      return p;
    }));
  }, [pushHistory]);

  const enterSubCanvas = useCallback((id: string) => { setSubCanvasPanelId(id); }, []);
  const exitSubCanvas = useCallback(() => { setSubCanvasPanelId(null); }, []);

  /* ================================================================
     Component actions
     ================================================================ */

  const addComponentToPanel = useCallback((panelId: string, compDef: ComponentDef) => {
    pushHistory();
    const id = genId('comp');
    const instance: ComponentInstance = {
      id, type: compDef.type, label: compDef.label,
      props: { ...compDef.defaultProps }, panelId,
    };
    setComponents(prev => [...prev, instance]);
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, children: [...p.children, id] } : p));
    setSelectedComponentId(id);
  }, [pushHistory]);

  const removeComponent = useCallback((id: string) => {
    pushHistory();
    const comp = components.find(c => c.id === id);
    setComponents(prev => prev.filter(c => c.id !== id));
    if (comp) {
      setPanels(prev => prev.map(p => p.id === comp.panelId ? { ...p, children: p.children.filter(cId => cId !== id) } : p));
    }
    if (selectedComponentId === id) setSelectedComponentId(null);
  }, [pushHistory, components, selectedComponentId]);

  const selectComponent = useCallback((id: string | null) => {
    setSelectedComponentId(id);
    setSelectedComponentIds(id ? [id] : []);
  }, []);

  const updateComponentProps = useCallback((id: string, newProps: Record<string, any>) => {
    pushHistory();
    setComponents(prev => prev.map(c => c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c));
  }, [pushHistory]);

  const duplicateComponent = useCallback((id: string) => {
    pushHistory();
    const comp = components.find(c => c.id === id);
    if (!comp) return;
    const newId = genId('comp');
    const clone: ComponentInstance = { ...comp, id: newId, label: `${comp.label} (副本)` };
    setComponents(prev => [...prev, clone]);
    setPanels(prev => prev.map(p => p.id === comp.panelId ? { ...p, children: [...p.children, newId] } : p));
  }, [pushHistory, components]);

  /* ================================================================
     Multi-select & Grouping
     ================================================================ */

  const toggleSelectComponent = useCallback((id: string) => {
    setSelectedComponentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const clearComponentSelection = useCallback(() => {
    setSelectedComponentIds([]);
  }, []);

  const groupComponents = useCallback(() => {
    if (selectedComponentIds.length < 2) return;
    pushHistory();
    const groupId = genId('group');
    setComponents(prev => prev.map(c =>
      selectedComponentIds.includes(c.id) ? { ...c, groupId } : c
    ));
  }, [selectedComponentIds, pushHistory]);

  const ungroupComponent = useCallback((groupId: string) => {
    pushHistory();
    setComponents(prev => prev.map(c =>
      c.groupId === groupId ? { ...c, groupId: undefined } : c
    ));
  }, [pushHistory]);

  /* ================================================================
     UI Toggles
     ================================================================ */

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'dark' ? 'light' : 'dark'), []);
  const toggleAI = useCallback(() => setAiOpen(prev => !prev), []);
  const toggleCodePreview = useCallback(() => setCodePreviewOpen(prev => !prev), []);
  const setViewMode = useCallback((mode: 'design' | 'preview' | 'code') => setViewModeState(mode), []);
  const setSyncStatus = useCallback((s: 'synced' | 'pending' | 'conflict') => setSyncStatusState(s), []);
  const openModelSettings = useCallback(() => setModelSettingsOpen(true), []);
  const closeModelSettings = useCallback(() => setModelSettingsOpen(false), []);
  const toggleSchemaExplorer = useCallback(() => setSchemaExplorerOpen(prev => !prev), []);
  const toggleDeployPanel = useCallback(() => setDeployPanelOpen(prev => !prev), []);
  const toggleBackendArch = useCallback(() => setBackendArchOpen(prev => !prev), []);
  const toggleHostStorage = useCallback(() => setHostStorageOpen(prev => !prev), []);
  const toggleFigmaGuide = useCallback(() => setFigmaGuideOpen(prev => !prev), []);
  const toggleDeployManual = useCallback(() => setDeployManualOpen(prev => !prev), []);
  const toggleQualityPanel = useCallback(() => setQualityPanelOpen(prev => !prev), []);
  const toggleCRDTPanel = useCallback(() => setCRDTPanelOpen(prev => !prev), []);
  const toggleSnap = useCallback(() => setSnapEnabled(prev => !prev), []);

  /* ================================================================
     AI Models
     ================================================================ */

  const addAIModel = useCallback((model: Omit<AIModel, 'id'>) => {
    setAiModels(prev => [...prev, { ...model, id: genId('model') }]);
  }, []);

  const removeAIModel = useCallback((id: string) => {
    setAiModels(prev => prev.filter(m => m.id !== id));
    if (activeModelId === id) setActiveModelId(null);
  }, [activeModelId]);

  const updateAIModel = useCallback((id: string, partial: Partial<AIModel>) => {
    setAiModels(prev => prev.map(m => m.id === id ? { ...m, ...partial } : m));
  }, []);

  const activateAIModel = useCallback((id: string) => {
    setAiModels(prev => prev.map(m => ({ ...m, isActive: m.id === id })));
    setActiveModelId(id);
  }, []);

  /* ================================================================
     AI Messages
     ================================================================ */

  const addAIMessage = useCallback((msg: Omit<AIMessage, 'id' | 'timestamp'>) => {
    setAiMessages(prev => [...prev, { ...msg, id: genId('msg'), timestamp: Date.now() }]);
    if (msg.role === 'assistant') {
      setAiTokensUsed(prev => prev + Math.floor(msg.content.length * 1.3));
    }
  }, []);

  /* ================================================================
     Data Bindings & Design JSON Import
     ================================================================ */

  const setDataBinding = useCallback((componentId: string, tableName: string) => {
    pushHistory();
    setDataBindingsState(prev => ({ ...prev, [componentId]: tableName }));
  }, [pushHistory]);

  const importDesignJSON = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.panels && data.components) {
        pushHistory();
        setPanels(data.panels);
        setComponents(data.components);
        if (data.dataBindings) setDataBindingsState(data.dataBindings);
        setDesignJsonValid(true);
        setDesignJsonErrors([]);
      }
    } catch (err: any) {
      setDesignJsonValid(false);
      setDesignJsonErrors([err.message || 'Invalid JSON']);
    }
  }, [pushHistory]);

  /* ================================================================
     CRDT
     ================================================================ */

  const setCRDTPeers = useCallback((peers: CRDTPeer[]) => {
    setCRDTPeersState(peers);
  }, []);

  /** CRDT direct state setters — bypass undo history to avoid conflict with CRDT ops */
  const setPanelsFromCRDT = useCallback((newPanels: Panel[]) => {
    setPanels(newPanels);
  }, []);

  const setComponentsFromCRDT = useCallback((newComponents: ComponentInstance[]) => {
    setComponents(newComponents);
  }, []);

  const incrementDocVersion = useCallback(() => {
    setCRDTDocVersion(prev => prev + 1);
  }, []);

  /* ================================================================
     Conflict Resolution
     ================================================================ */

  const toggleConflictResolver = useCallback(() => {
    setConflictResolverOpen(prev => !prev);
  }, []);

  const resolveConflict = useCallback((conflictId: string, resolution: 'local' | 'remote') => {
    setConflicts(prev => prev.map(c =>
      c.id === conflictId ? { ...c, resolved: true, resolution } : c
    ));
    // If all resolved, set sync to synced
    setConflicts(prev => {
      const unresolved = prev.filter(c => !c.resolved);
      if (unresolved.length === 0) {
        setSyncStatusState('synced');
      }
      return prev;
    });
  }, []);

  const resolveAllConflicts = useCallback((resolution: 'local' | 'remote') => {
    setConflicts(prev => prev.map(c => c.resolved ? c : { ...c, resolved: true, resolution }));
    setSyncStatusState('synced');
  }, []);

  const simulateConflict = useCallback(() => {
    const paths = [
      'panels.panel-1.name',
      'components.comp-2.props.value',
      'components.comp-4.props.pageSize',
      'panels.panel-3.layout.w',
      'theme',
    ];
    const peerNames = ['Alice', 'Bob', 'Charlie'];
    const newConflicts: CRDTConflict[] = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, (_, i) => ({
      id: genId('conflict'),
      path: paths[Math.floor(Math.random() * paths.length)],
      localValue: `local_value_${i}`,
      remoteValue: `remote_value_${i}`,
      remotePeer: peerNames[Math.floor(Math.random() * peerNames.length)],
      timestamp: Date.now() - Math.floor(Math.random() * 60000),
      resolved: false,
    }));
    setConflicts(prev => [...prev, ...newConflicts]);
    setSyncStatusState('conflict');
    setConflictResolverOpen(true);
  }, []);

  /* ================================================================
     Context value
     ================================================================ */

  const value: DesignerContextType = {
    // State
    projectName, panels, components, selectedPanelId, selectedComponentId,
    theme, aiOpen, codePreviewOpen, aiMessages, syncStatus, aiTokensUsed,
    viewMode, modelSettingsOpen, aiModels, activeModelId,
    schemaExplorerOpen, deployPanelOpen, backendArchOpen, hostStorageOpen,
    figmaGuideOpen, deployManualOpen, qualityPanelOpen,
    subCanvasPanelId, snapEnabled, selectedComponentIds,
    crdtPeers, crdtDocVersion, crdtPanelOpen,
    dataBindings, designJsonValid, designJsonErrors,
    conflictResolverOpen, conflicts,

    // Panel actions
    addPanel, removePanel, selectPanel, updatePanelName,
    splitPanel, splitPanelN, duplicatePanel, mergePanels,
    movePanelPixel, batchUpdatePanelLayouts, enterSubCanvas, exitSubCanvas,

    // Component actions
    addComponentToPanel, removeComponent, selectComponent,
    updateComponentProps, duplicateComponent,

    // Multi-select & grouping
    toggleSelectComponent, clearComponentSelection,
    groupComponents, ungroupComponent,

    // UI toggles
    toggleTheme, toggleAI, toggleCodePreview, setViewMode, setSyncStatus,
    openModelSettings, closeModelSettings,
    toggleSchemaExplorer, toggleDeployPanel, toggleBackendArch,
    toggleHostStorage, toggleFigmaGuide, toggleDeployManual,
    toggleQualityPanel, toggleCRDTPanel, toggleSnap,

    // AI
    addAIModel, removeAIModel, updateAIModel, activateAIModel,
    addAIMessage,

    // Data
    setDataBinding, importDesignJSON,

    // CRDT
    setCRDTPeers, setPanelsFromCRDT, setComponentsFromCRDT, incrementDocVersion,

    // Undo / Redo
    undo, redo, canUndo, canRedo,

    // Conflict resolution
    toggleConflictResolver, resolveConflict,
    resolveAllConflicts, simulateConflict,

    // 复式导航
    activeNavSection, secondaryNavOpen, activeNavSubItem,
    setActiveNavSection, toggleSecondaryNav, setActiveNavSubItem,

    // UI 视觉主题
    uiTheme, setUITheme,

    // Phase 12 — RBAC 身份与面板锁定
    currentUserIdentity,
    setCurrentUserIdentity: (identity: CRDTUserIdentity | null) => {
      setCurrentUserIdentityState(identity);
      setCRDTDocVersion(prev => prev + 1);
      if (identity) {
        setCRDTPeersState(prev => prev.map(p => p.id === identity.userId ? { ...p, role: identity.role } : p));
      }
    },
    lockPanel: (panelId: string) => {
      const identity = currentUserIdentity;
      if (!identity) return;
      setCRDTDocVersion(prev => prev + 1);
      setCRDTPeersState(prev => prev.map(p => p.id === identity.userId ? { ...p, lockedPanelId: panelId } : p));
      setPanels(prev => prev.map(p => p.id === panelId ? { ...p, lockedBy: identity.userId } : p));
    },
    unlockPanel: (panelId: string) => {
      const identity = currentUserIdentity;
      if (!identity) return;
      setCRDTDocVersion(prev => prev + 1);
      setCRDTPeersState(prev => prev.map(p => p.id === identity.userId ? { ...p, lockedPanelId: undefined } : p));
      setPanels(prev => prev.map(p => p.id === panelId ? { ...p, lockedBy: undefined } : p));
    },
  };

  return (
    <DesignerContext.Provider value={value}>
      {children}
    </DesignerContext.Provider>
  );
}