/**
 * @file AICodeSystem.tsx
 * @description YYC3 AI Code 系统 — 多面板 IDE 风格界面，集成代码编辑器、实时预览、AI 助手、任务看板、协同编辑等功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai-code,ide,editor,preview,ai,task-board,collaboration
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useStreamingAI, type AIModelConfig } from '../designer/hooks/useStreamingAI';
import { useGlobalAI } from '../../aiModelContext';
import yyc3Logo from '/yyc3-logo-blue.png';
import {
  Home, Wrench, FolderOpen, Paintbrush, Zap, Bell,
  Bot, Settings, ChevronLeft, Eye, Code2, Search, MoreHorizontal,
  File, Monitor, FilePen, Send, Plus, Image as ImageIcon,
  FileUp, Github, Figma, Clipboard, ChevronRight, ChevronDown,
  FolderClosed, FileCode2, FileJson, FileCog, Folder,
  Terminal, X, Copy, Download, Maximize2, Minimize2,
  Split, RotateCcw, Sparkles, Layers, Rocket, Share2,
  GitBranch, PanelRightClose, PanelLeftClose,
  FileType, Shield, Trash2, Pencil, FilePlus, FolderPlus,
  GripVertical, History, Hash,
  Check, AlertCircle, Globe, FolderKanban,
  Columns2, Pin, SquareSplitHorizontal, LayoutDashboard,
  type LucideIcon
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { LivePreview } from './LivePreview';
import {
  bridgeSendToDesigner, bridgeReadForCode, bridgeClearForCode,
  parseCodeToComponents,
} from '../../crossRouteBridge';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Panel as ResizablePanel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { ActivityBar, type ActivityView } from './ActivityBar';
import { LayoutPresetSwitcher, type LayoutPreset } from './LayoutPresets';
import { EditorBreadcrumb } from './EditorBreadcrumb';
import { SearchPanel, GitPanel, DebugPanel, RunPanel, ExtensionsPanel, DatabasePanel } from './SidebarViews';
import { MultiInstanceManager } from './MultiInstanceManager';
import { AIProviderManager } from './AIProviderManager';
import { useWindowManager, MinimizedPanelTray, LayoutSaverDialog, FloatingPanelWrapper, PANEL_TYPE_REGISTRY, type TabConfig } from './WindowManager';
import { AIChatPanel as AIChatStreamPanel } from './AIChatPanel';
import { QuickActionsToolbar } from './QuickActionsToolbar';
import { useAIService } from '../../hooks/useAIService';
import { useCRDTCollab } from '../../hooks/useCRDTCollab';
import { CollabCursors, CollabStatusIndicator } from './CollabCursors';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

/* ================================================================
   TYPES
   ================================================================ */
interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  icon?: LucideIcon;
  children?: FileNode[];
  language?: string;
  content?: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  node: FileNode;
  parentId: string | null;
}

/* ── Draggable panel resize handle ── */
function PanelDragHandle({ direction = 'vertical' }: { direction?: 'vertical' | 'horizontal' }) {
  const isVertical = direction === 'vertical';
  return (
    <PanelResizeHandle
      className={`group relative flex items-center justify-center transition-colors duration-150 hover:bg-indigo-500/10 active:bg-indigo-500/20 ${
        isVertical ? 'w-[6px] cursor-col-resize' : 'h-[6px] cursor-row-resize'
      }`}
    >
      <div className={`rounded-full bg-white/10 group-hover:bg-indigo-400/50 group-active:bg-indigo-400/70 transition-all ${
        isVertical ? 'w-[3px] h-8' : 'h-[3px] w-8'
      }`} />
    </PanelResizeHandle>
  );
}

interface TerminalTab {
  id: string;
  name: string;
  shell: string;
  history: string[];
  cmdHistory: string[];
  cmdHistoryIdx: number;
}

/* ================================================================
   TipIcon — lucide icon + Chinese hover tooltip
   ================================================================ */
function TipIcon({ icon: Icon, tip, size = 16, className = '', active = false, onClick, onContextMenu }: {
  icon: React.ElementType; tip: string; size?: number; className?: string; active?: boolean;
  onClick?: (e?: React.MouseEvent) => void; onContextMenu?: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="relative group inline-flex">
      <button
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`p-1.5 rounded-lg transition-all duration-200 hover:bg-white/10 hover:scale-105
          ${active ? 'bg-white/10 text-indigo-400' : ''} ${className}`}
      >
        <Icon size={size} />
      </button>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px]
        bg-black/95 text-white/90 whitespace-nowrap opacity-0 group-hover:opacity-100
        transition-opacity duration-200 pointer-events-none z-[100] border border-white/10">
        {tip}
      </div>
    </div>
  );
}

/* ================================================================
   UTILITIES — file tree helpers
   ================================================================ */
let _idCounter = 100;
const nextId = () => 'f' + (++_idCounter);

function findNodeById(tree: FileNode[], id: string): FileNode | null {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findParent(tree: FileNode[], id: string): FileNode | null {
  for (const n of tree) {
    if (n.children) {
      if (n.children.some(c => c.id === id)) return n;
      const found = findParent(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function removeNode(tree: FileNode[], id: string): FileNode[] {
  return tree.filter(n => n.id !== id).map(n =>
    n.children ? { ...n, children: removeNode(n.children, id) } : n
  );
}

function insertNode(tree: FileNode[], parentId: string | null, newNode: FileNode): FileNode[] {
  if (!parentId) return [...tree, newNode];
  return tree.map(n => {
    if (n.id === parentId && n.children) return { ...n, children: [...n.children, newNode] };
    if (n.children) return { ...n, children: insertNode(n.children, parentId, newNode) };
    return n;
  });
}

function renameNode(tree: FileNode[], id: string, newName: string): FileNode[] {
  return tree.map(n => {
    if (n.id === id) return { ...n, name: newName };
    if (n.children) return { ...n, children: renameNode(n.children, id, newName) };
    return n;
  });
}

function cloneNode(node: FileNode): FileNode {
  const newId = nextId();
  return {
    ...node,
    id: newId,
    name: node.name.replace(/(\.\w+)?$/, '_copy$1'),
    children: node.children?.map(cloneNode),
  };
}

function flattenNames(tree: FileNode[]): string[] {
  const out: string[] = [];
  for (const n of tree) {
    out.push(n.name.toLowerCase());
    if (n.children) out.push(...flattenNames(n.children));
  }
  return out;
}

function filterTree(tree: FileNode[], query: string): FileNode[] {
  if (!query) return tree;
  const q = query.toLowerCase();
  return tree.reduce<FileNode[]>((acc, n) => {
    if (n.name.toLowerCase().includes(q)) { acc.push(n); return acc; }
    if (n.children) {
      const filtered = filterTree(n.children, query);
      if (filtered.length > 0) acc.push({ ...n, children: filtered });
    }
    return acc;
  }, []);
}

/** Compute full path (e.g. "src/app/components/designer") for a node */
function getNodePath(tree: FileNode[], nodeId: string, prefix = ''): string | null {
  for (const n of tree) {
    const p = prefix ? prefix + '/' + n.name : n.name;
    if (n.id === nodeId) return p;
    if (n.children) {
      const found = getNodePath(n.children, nodeId, p);
      if (found) return found;
    }
  }
  return null;
}

/** Collect all file names across tree (for completions) */
function collectAllFileNames(tree: FileNode[]): string[] {
  const out: string[] = [];
  for (const n of tree) {
    out.push(n.name);
    if (n.children) out.push(...collectAllFileNames(n.children));
  }
  return out;
}

/* ================================================================
   INITIAL FILE TREE DATA
   ================================================================ */
function makeInitialTree(): FileNode[] {
  return [
    {
      id: 'f1', name: 'src', type: 'folder', children: [
        {
          id: 'f2', name: 'app', type: 'folder', children: [
            {
              id: 'f3', name: 'App.tsx', type: 'file', icon: FileCode2, language: 'typescript',
              content: "import { DndProvider } from 'react-dnd';\nimport { HTML5Backend } from 'react-dnd-html5-backend';\nimport { DesignerProvider } from './store';\nimport { DesignerLayout } from './components/designer/DesignerLayout';\n\nexport default function App() {\n  return (\n    <DesignerProvider>\n      <DndProvider backend={HTML5Backend}>\n        <DesignerLayout />\n      </DndProvider>\n    </DesignerProvider>\n  );\n}"
            },
            {
              id: 'f4', name: 'store.tsx', type: 'file', icon: FileCode2, language: 'typescript',
              content: "// YYC3 Designer Store — ~843 lines\nimport React, { createContext, useContext, useReducer } from 'react';\nimport { produce } from 'immer';\n\nexport interface Panel {\n  id: string;\n  x: number; y: number; w: number; h: number;\n  children: ComponentInstance[];\n}\n\nexport interface ComponentInstance {\n  id: string;\n  type: string;\n  props: Record<string, unknown>;\n}\n\nexport interface DesignerState {\n  projectName: string;\n  panels: Panel[];\n  selectedId: string | null;\n  uiTheme: 'classic' | 'liquid-glass' | 'aurora';\n}\n\n// Full reducer + context + provider..."
            },
            {
              id: 'f5', name: 'config.ts', type: 'file', icon: FileCog, language: 'typescript',
              content: '/**\n * YANYUCLOUD (YYC³) Global Configuration\n * Primary + Standby API endpoints\n */\nexport const API_CONFIG = {\n  primary: import.meta.env.VITE_API_PRIMARY || "https://api.yyc3.cn",\n  standby1: import.meta.env.VITE_API_STANDBY_1 || "https://api2.yyc3.cn",\n  standby2: import.meta.env.VITE_API_STANDBY_2 || "https://api3.yyc3.cn",\n};\n\nexport const AI_CONFIG = {\n  model: "gpt-4o-mini",\n  maxTokens: 4096,\n  temperature: 0.7,\n};'
            },
            {
              id: 'f6', name: 'apiClient.ts', type: 'file', icon: FileCode2, language: 'typescript',
              content: '/**\n * Failover API Client\n * Tries primary → standby1 → standby2\n */\nimport { API_CONFIG } from "./config";\n\nconst endpoints = [API_CONFIG.primary, API_CONFIG.standby1, API_CONFIG.standby2];\n\nexport async function apiFetch(path: string, init?: RequestInit) {\n  for (const base of endpoints) {\n    try {\n      const res = await fetch(base + path, init);\n      if (res.ok) return res;\n    } catch { /* try next */ }\n  }\n  throw new Error("All API endpoints failed");\n}'
            },
            {
              id: 'f7', name: 'components', type: 'folder', children: [
                {
                  id: 'f8', name: 'designer', type: 'folder', children: [
                    { id: 'f9', name: 'PanelCanvas.tsx', type: 'file', icon: FileCode2, language: 'typescript', content: '// PanelCanvas — multi-panel drag/drop workspace\nimport { Responsive, WidthProvider } from "react-grid-layout";\nimport { useDrop } from "react-dnd";\n\nconst GridLayout = WidthProvider(Responsive);\n\nexport function PanelCanvas() {\n  // ... panel rendering with iframe sandboxes\n  return <div className="h-full w-full" />;\n}' },
                    { id: 'f10', name: 'AIAssistant.tsx', type: 'file', icon: FileCode2, language: 'typescript', content: '// AI Assistant — OpenAI proxy integration\nimport { useState } from "react";\n\nexport function AIAssistant() {\n  const [prompt, setPrompt] = useState("");\n  // SSE streaming from /api/ai-proxy\n  return <div className="p-4">AI Assistant Panel</div>;\n}' },
                    { id: 'f11', name: 'Inspector.tsx', type: 'file', icon: FileCode2, language: 'typescript', content: '// Inspector — JSON Schema property editor\nimport { useForm } from "react-hook-form";\nimport { z } from "zod";\n\nexport function Inspector({ schema }: { schema: any }) {\n  // Two-way binding to Design JSON\n  return <div className="p-3">Property Inspector</div>;\n}' },
                    { id: 'f12', name: 'GlobalToolbar.tsx', type: 'file', icon: FileCode2, language: 'typescript' },
                    { id: 'f13', name: 'StatusBar.tsx', type: 'file', icon: FileCode2, language: 'typescript' },
                  ]
                },
                { id: 'f14', name: 'home', type: 'folder', children: [
                  { id: 'f15', name: 'AIHomePage.tsx', type: 'file', icon: FileCode2, language: 'typescript' },
                ] },
                { id: 'f16', name: 'ai-code', type: 'folder', children: [
                  { id: 'f17', name: 'AICodeSystem.tsx', type: 'file', icon: FileCode2, language: 'typescript' },
                ] },
              ]
            },
          ]
        },
        { id: 'f18', name: 'styles', type: 'folder', children: [
          { id: 'f19', name: 'theme.css', type: 'file', icon: FileType, language: 'css', content: '/* YYC3 Theme Tokens */\n:root {\n  --color-primary: #667eea;\n  --color-bg: #0a0b10;\n  --color-surface: #14151e;\n  --color-border: rgba(255,255,255,0.06);\n  --font-size-base: 14px;\n}' },
          { id: 'f20', name: 'fonts.css', type: 'file', icon: FileType, language: 'css' },
        ] },
      ]
    },
    { id: 'f21', name: 'package.json', type: 'file', icon: FileJson, language: 'json', content: '{\n  "name": "@yyc3/cloudpivot-ai",\n  "version": "3.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build",\n    "preview": "vite preview",\n    "test": "jest --passWithNoTests"\n  }\n}' },
    { id: 'f22', name: 'tsconfig.json', type: 'file', icon: FileJson, language: 'json', content: '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "jsx": "react-jsx",\n    "strict": true,\n    "paths": { "@/*": ["./src/*"] }\n  }\n}' },
    { id: 'f23', name: 'vite.config.ts', type: 'file', icon: FileCog, language: 'typescript', content: 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: { alias: { "@": "/src" } },\n});' },
    { id: 'f24', name: '.env', type: 'file', icon: Shield, language: 'plaintext', content: 'VITE_API_PRIMARY=https://api.yyc3.cn\nVITE_API_STANDBY_1=https://api2.yyc3.cn\nVITE_OPENAI_CLIENT_ID=xxxx' },
  ];
}

/* ================================================================
   CONTEXT MENU component
   ================================================================ */
function ContextMenu({ x, y, node, onAction, onClose }: {
  x: number; y: number; node: FileNode;
  onAction: (action: string) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    ...(node.type === 'folder' ? [
      { label: '新建文件', icon: FilePlus, action: 'newFile', color: 'text-cyan-400/70' },
      { label: '新建文件夹', icon: FolderPlus, action: 'newFolder', color: 'text-amber-400/70' },
      { sep: true },
    ] : []),
    { label: '重命名', icon: Pencil, action: 'rename', color: 'text-white/60' },
    { label: '复制', icon: Copy, action: 'copy', color: 'text-white/60' },
    { label: '粘贴', icon: Clipboard, action: 'paste', color: 'text-white/60' },
    { sep: true },
    { label: '删除', icon: Trash2, action: 'delete', color: 'text-red-400/70' },
    { sep: true },
    { label: '版本历史', icon: History, action: 'history', color: 'text-violet-400/70' },
  ] as const;

  return (
    <motion.div
      ref={ref}
      className="fixed z-[200] bg-[#1a1b26] border border-white/[0.1] rounded-xl shadow-2xl
        py-1.5 min-w-[180px] backdrop-blur-xl"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
    >
      <div className="px-3 py-1.5 border-b border-white/[0.06] mb-1">
        <p className="text-[10px] text-white/30 truncate">{node.name}</p>
      </div>
      {items.map((item, i) => {
        if ('sep' in item) return <div key={i} className="h-px bg-white/[0.06] mx-2 my-1" />;
        const ItemIcon = item.icon;
        return (
          <button
            key={item.action}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-white/70
              hover:bg-white/[0.06] transition-colors"
            onClick={() => { onAction(item.action); onClose(); }}
          >
            <ItemIcon size={13} className={item.color} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

/* ================================================================
   VERSION HISTORY DIALOG
   ================================================================ */
function VersionHistoryDialog({ node, onClose }: { node: FileNode; onClose: () => void }) {
  const fakeHistory = [
    { hash: 'a3f7c2d', date: '2026-03-09 14:22', author: 'YanYu', message: '修复类型错误' },
    { hash: 'b1e9d4a', date: '2026-03-08 09:15', author: 'AI Assistant', message: '自动生成组件代码' },
    { hash: 'c5a2f8b', date: '2026-03-07 16:40', author: 'YanYu', message: '初始创建' },
  ];
  return (
    <motion.div
      className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-[420px] bg-[#14151e] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
        initial={{ y: -20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <History size={14} className="text-violet-400" />
            <span className="text-[12px] text-white/70" style={{ fontWeight: 500 }}>版本历史 — {node.name}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X size={14} className="text-white/40" /></button>
        </div>
        <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
          {fakeHistory.map((h) => (
            <div key={h.hash} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:border-violet-500/20 transition-colors cursor-pointer">
              <div className="mt-0.5 w-2 h-2 rounded-full bg-violet-400/50 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-[10px] text-violet-400/80 font-mono">{h.hash}</code>
                  <span className="text-[10px] text-white/25">{h.date}</span>
                </div>
                <p className="text-[11px] text-white/60 mt-0.5">{h.message}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{h.author}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================
   INLINE CREATE DIALOG (new file / folder)
   ================================================================ */
function InlineCreateInput({ type, onSubmit, onCancel }: {
  type: 'file' | 'folder'; onSubmit: (name: string) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="flex items-center gap-1.5 px-2 py-1">
      {type === 'folder' ? <Folder size={12} className="text-amber-400/70" /> : <File size={12} className="text-cyan-400/70" />}
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && val.trim()) onSubmit(val.trim());
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => { if (val.trim()) onSubmit(val.trim()); else onCancel(); }}
        placeholder={type === 'folder' ? '文件夹名...' : '文件名...'}
        className="flex-1 bg-white/[0.06] border border-indigo-500/30 rounded px-1.5 py-0.5
          text-[11px] text-white/80 placeholder-white/25 outline-none"
      />
    </div>
  );
}

/* ================================================================
   FILE TREE NODE — with right-click, drag, inline rename
   ================================================================ */
function FileTreeNode({ node, depth = 0, selectedFile, onSelect, onContextMenu, dragNodeId, onDragStart, onDragOver, onDrop, renamingId, renameValue, setRenameValue, onRenameSubmit, onRenameCancel, creatingIn, creatingType, onCreateSubmit, onCreateCancel, searchQuery }: {
  node: FileNode; depth?: number; selectedFile: string | null;
  onSelect: (id: string, node: FileNode) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  dragNodeId: string | null;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  creatingIn: string | null;
  creatingType: 'file' | 'folder';
  onCreateSubmit: (name: string) => void;
  onCreateCancel: () => void;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2 || searchQuery.length > 0);
  const isSelected = selectedFile === node.id;
  const isDragging = dragNodeId === node.id;
  const isRenaming = renamingId === node.id;
  const NodeIcon = node.icon || (node.type === 'folder' ? (expanded ? FolderOpen : FolderClosed) : File);

  const renameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (isRenaming) renameRef.current?.focus(); }, [isRenaming]);

  return (
    <div className={isDragging ? 'opacity-40' : ''}>
      <div
        draggable
        onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/node-id', node.id); onDragStart(node.id); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (node.type === 'folder') onDragOver(e, node.id); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (node.type === 'folder') onDrop(e, node.id); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node); }}
        className={`w-full flex items-center gap-1.5 py-[3px] px-2 text-[12px] rounded-md
          transition-all duration-150 cursor-pointer select-none
          ${isSelected ? 'bg-indigo-500/15 text-indigo-300' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80'}`}
        style={{ paddingLeft: depth * 14 + 8 + 'px' }}
        onClick={() => {
          if (node.type === 'folder') setExpanded(!expanded);
          else onSelect(node.id, node);
        }}
      >
        {node.type === 'folder' ? (
          <ChevronRight size={10} className={`transition-transform duration-150 text-white/30 shrink-0 ${expanded ? 'rotate-90' : ''}`} />
        ) : (
          <span className="w-[10px] shrink-0" />
        )}
        <GripVertical size={9} className="text-white/15 shrink-0 opacity-0 group-hover:opacity-100" />
        <NodeIcon size={13} className={`shrink-0 ${node.type === 'folder' ? 'text-amber-400/70' : 'text-cyan-400/70'}`} />
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onRenameSubmit(); if (e.key === 'Escape') onRenameCancel(); }}
            onBlur={onRenameSubmit}
            className="flex-1 bg-white/[0.06] border border-indigo-500/30 rounded px-1 text-[11px] text-white/80 outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate">{node.name}</span>
        )}
      </div>
      {node.type === 'folder' && expanded && (
        <>
          {creatingIn === node.id && (
            <div style={{ paddingLeft: (depth + 1) * 14 + 8 + 'px' }}>
              <InlineCreateInput type={creatingType} onSubmit={onCreateSubmit} onCancel={onCreateCancel} />
            </div>
          )}
          {node.children?.map((child) => (
            <FileTreeNode
              key={child.id} node={child} depth={depth + 1}
              selectedFile={selectedFile} onSelect={onSelect} onContextMenu={onContextMenu}
              dragNodeId={dragNodeId} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
              renamingId={renamingId} renameValue={renameValue} setRenameValue={setRenameValue}
              onRenameSubmit={onRenameSubmit} onRenameCancel={onRenameCancel}
              creatingIn={creatingIn} creatingType={creatingType}
              onCreateSubmit={onCreateSubmit} onCreateCancel={onCreateCancel}
              searchQuery={searchQuery}
            />
          ))}
        </>
      )}
    </div>
  );
}

/* ================================================================
   INTEGRATED TERMINAL — multi-tab, command history, shell types
   ================================================================ */
const SHELL_OPTIONS = ['bash', 'zsh', 'fish', 'powershell'] as const;

function createTerminalTab(shell = 'bash', idx = 1): TerminalTab {
  return {
    id: 'term-' + Date.now() + '-' + idx,
    name: shell + ' #' + idx,
    shell,
    history: [
      '$ npm run dev',
      '',
      '  VITE v5.4.0  ready in 342 ms',
      '',
      '  \u279C  Local:   http://localhost:5173/',
      '  \u279C  Network: http://192.168.1.100:5173/',
      '',
    ],
    cmdHistory: ['npm run dev'],
    cmdHistoryIdx: -1,
  };
}

// Mock command responses
function mockExec(cmd: string): string[] {
  const c = cmd.trim();
  if (c === 'clear') return [];
  if (c === 'ls' || c === 'ls -la') return [
    'drwxr-xr-x  src/           drwxr-xr-x  node_modules/',
    '-rw-r--r--  package.json   -rw-r--r--  tsconfig.json',
    '-rw-r--r--  vite.config.ts -rw-r--r--  .env',
    '',
  ];
  if (c === 'ls src' || c === 'ls src/') return ['drwxr-xr-x  app/    drwxr-xr-x  styles/', ''];
  if (c === 'ls src/app' || c === 'ls src/app/') return [
    '-rw-r--r--  App.tsx        -rw-r--r--  store.tsx',
    '-rw-r--r--  config.ts      -rw-r--r--  apiClient.ts',
    'drwxr-xr-x  components/',
    '',
  ];
  if (c === 'pwd') return ['/workspace/yyc3-cloudpivot-ai', ''];
  if (c.startsWith('git status')) return [
    'On branch main',
    "Your branch is up to date with 'origin/main'.",
    '',
    'Changes not staged for commit:',
    '  modified:   src/app/components/ai-code/AICodeSystem.tsx',
    '',
    'no changes added to commit',
    '',
  ];
  if (c.startsWith('git log')) return [
    'a3f7c2d (HEAD -> main, origin/main) 修复类型错误',
    'b1e9d4a AI Code System: 添加Monaco智能补全',
    'c5a2f8b 集成终端多标签+拖拽文件cd',
    'd2e4f6a 文件树CRUD: 右键菜单/重命名/删除',
    'e7g8h9i 初始项目结构创建',
    '',
  ];
  if (c.startsWith('git branch')) return ['* main', '  feature/panel-canvas', '  feature/inspector', '  feature/liquid-glass', ''];
  if (c.startsWith('git diff')) return [
    'diff --git a/src/app/components/ai-code/AICodeSystem.tsx',
    '--- a/src/app/components/ai-code/AICodeSystem.tsx',
    '+++ b/src/app/components/ai-code/AICodeSystem.tsx',
    '@@ -1,5 +1,8 @@',
    '+// Enhanced AI Code System',
    ' import React from "react";',
    '',
  ];
  if (c === 'npm run dev') return [
    '> @yyc3/cloudpivot-ai@3.0.0 dev',
    '> vite',
    '',
    '  VITE v5.4.0  ready in 342 ms',
    '',
    '  \u279C  Local:   http://localhost:5173/',
    '  \u279C  Network: http://192.168.1.100:5173/',
    '',
  ];
  if (c === 'npm run build') return ['> @yyc3/cloudpivot-ai@3.0.0 build', '> tsc && vite build', '', '\u2713 built in 2.4s', ''];
  if (c === 'npm run test' || c === 'npm test') return [
    '> @yyc3/cloudpivot-ai@3.0.0 test',
    '> jest --passWithNoTests',
    '',
    'PASS  src/__tests__/utils.test.ts',
    'PASS  src/__tests__/store.test.ts',
    '',
    'Test Suites: 2 passed, 2 total',
    'Tests:       8 passed, 8 total',
    '\u2713 All tests passed',
    '',
  ];
  if (c.startsWith('npx eslint')) return ['\u2713 No ESLint errors found', ''];
  if (c.startsWith('npm install') || c.startsWith('pnpm add') || c.startsWith('yarn add')) {
    const pkg = c.split(' ').slice(2).join(' ') || 'dependencies';
    return ['Installing ' + pkg + '...', '\u2713 Done in 1.2s', ''];
  }
  if (c === 'node -v') return ['v20.11.0', ''];
  if (c === 'npm -v') return ['10.4.0', ''];
  if (c === 'pnpm -v') return ['9.1.0', ''];
  if (c === 'whoami') return ['yanyu@yyc3', ''];
  if (c === 'date') return [new Date().toLocaleString('zh-CN'), ''];
  if (c === 'uptime') return ['up 3 days, 14:22', ''];
  if (c.startsWith('echo ')) return [c.slice(5), ''];
  if (c.startsWith('cat ')) {
    const target = c.slice(4).trim();
    // Lookup file content from initial tree for demo
    const lookupContent = (nodes: FileNode[], name: string): string | null => {
      for (const n of nodes) {
        if (n.name === name && n.type === 'file') return n.content || '(empty file)';
        if (n.children) { const r = lookupContent(n.children, name); if (r) return r; }
      }
      return null;
    };
    const tree = makeInitialTree();
    const content = lookupContent(tree, target);
    if (content) return [content, ''];
    return ['cat: ' + target + ': No such file or directory', ''];
  }
  if (c === 'help') return [
    'YYC3 Terminal — Available commands:',
    '',
    '  File:     ls, pwd, cd, echo, cat <filename>',
    '  Git:      git status|log|branch|diff',
    '  Node:     node -v, npm -v, pnpm -v',
    '  Build:    npm run dev|build|test',
    '  Package:  npm install, pnpm add, yarn add',
    '  Lint:     npx eslint .',
    '  System:   whoami, date, uptime, clear, help',
    '',
  ];
  return [c + ': command executed \u2713', ''];
}

const QUICK_ALIASES: { label: string; cmd: string; color: string }[] = [
  { label: 'dev', cmd: 'npm run dev', color: 'text-emerald-400/60' },
  { label: 'build', cmd: 'npm run build', color: 'text-cyan-400/60' },
  { label: 'test', cmd: 'npm run test', color: 'text-amber-400/60' },
  { label: 'lint', cmd: 'npx eslint .', color: 'text-violet-400/60' },
  { label: 'git-s', cmd: 'git status', color: 'text-rose-400/60' },
  { label: 'git-l', cmd: 'git log --oneline -5', color: 'text-rose-400/60' },
];

function IntegratedTerminal({ expanded, onToggle, onClose, onResolveDropPath, height, onHeightChange }: {
  expanded: boolean; onToggle: () => void; onClose: () => void;
  onResolveDropPath?: (nodeId: string) => string | null;
  height: number; onHeightChange: (h: number) => void;
}) {
  const [tabs, setTabs] = useState<TerminalTab[]>([createTerminalTab('bash', 1)]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [termInput, setTermInput] = useState('');
  const [showShellPicker, setShowShellPicker] = useState(false);
  const [showAliases, setShowAliases] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTermSearch, setShowTermSearch] = useState(false);
  const [cwd, setCwd] = useState('/workspace/yyc3-cloudpivot-ai');
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeTab?.history.length]);

  const addTab = (shell: string) => {
    const newTab = createTerminalTab(shell, tabs.length + 1);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setShowShellPicker(false);
  };

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
  };

  const execCmd = (overrideCmd?: string) => {
    const cmd = (overrideCmd || termInput).trim();
    if (!cmd) return;
    if (cmd === 'clear') {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, history: [], cmdHistory: [...t.cmdHistory, cmd], cmdHistoryIdx: -1 } : t));
      setTermInput('');
      return;
    }
    // Track cd commands
    if (cmd.startsWith('cd ')) {
      const target = cmd.slice(3).trim();
      let newCwd = cwd;
      if (target === '..') {
        newCwd = cwd.substring(0, cwd.lastIndexOf('/')) || '/';
      } else if (target.startsWith('/')) {
        newCwd = target;
      } else {
        newCwd = cwd + '/' + target;
      }
      setCwd(newCwd);
      const output = ['\u279C  ' + newCwd];
      setTabs(prev => prev.map(t =>
        t.id === activeTabId ? {
          ...t,
          history: [...t.history, '$ ' + cmd, ...output, ''],
          cmdHistory: [...t.cmdHistory, cmd],
          cmdHistoryIdx: -1,
        } : t
      ));
      setTermInput('');
      return;
    }
    const output = mockExec(cmd);
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? {
        ...t,
        history: [...t.history, '$ ' + cmd, ...output],
        cmdHistory: [...t.cmdHistory, cmd],
        cmdHistoryIdx: -1,
      } : t
    ));
    setTermInput('');
  };

  const navigateHistory = (dir: 'up' | 'down') => {
    const cmds = activeTab.cmdHistory;
    if (cmds.length === 0) return;
    let idx = activeTab.cmdHistoryIdx;
    if (dir === 'up') {
      idx = idx < 0 ? cmds.length - 1 : Math.max(0, idx - 1);
    } else {
      idx = idx < 0 ? -1 : idx >= cmds.length - 1 ? -1 : idx + 1;
    }
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, cmdHistoryIdx: idx } : t));
    setTermInput(idx >= 0 ? cmds[idx] : '');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') execCmd();
    else if (e.key === 'ArrowUp') { e.preventDefault(); navigateHistory('up'); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); navigateHistory('down'); }
  };

  // Drag-to-terminal: accept file drops → auto cd to parent path
  const handleTermDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('text/node-id')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'link';
      setDragOver(true);
    }
  };
  const handleTermDragLeave = () => setDragOver(false);
  const handleTermDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const nodeId = e.dataTransfer.getData('text/node-id');
    if (!nodeId || !onResolveDropPath) return;
    const fullPath = onResolveDropPath(nodeId);
    if (!fullPath) return;
    // Determine if it's a file or folder; cd to parent for files
    const isFile = fullPath.includes('.');
    const dir = isFile ? fullPath.substring(0, fullPath.lastIndexOf('/')) || '.' : fullPath;
    const newCwd = '/workspace/yyc3-cloudpivot-ai/' + dir;
    const cdCmd = 'cd ' + newCwd;
    setCwd(newCwd);
    // Inject into history and auto-execute
    const output = ['\u279C  ' + newCwd];
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? {
        ...t,
        history: [...t.history, '$ ' + cdCmd, ...output, ''],
        cmdHistory: [...t.cmdHistory, cdCmd],
        cmdHistoryIdx: -1,
      } : t
    ));
    inputRef.current?.focus();
  };

  /* ── Drag-to-resize handle ── */
  const resizeStartY = useRef(0);
  const resizeStartH = useRef(0);

  return (
    <div
      className={`bg-[#0c0d13] flex flex-col h-full
        ${dragOver ? 'ring-1 ring-inset ring-indigo-500/40 bg-indigo-500/[0.03]' : ''}`}
      onDragOver={handleTermDragOver}
      onDragLeave={handleTermDragLeave}
      onDrop={handleTermDrop}
    >
      {/* Tab bar + controls */}
      <div className="flex items-center justify-between px-1.5 py-0.5 border-b border-white/[0.04] shrink-0 min-h-[32px]">
        <div className="flex items-center gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <div
              key={t.id}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] cursor-pointer transition-colors shrink-0
                ${t.id === activeTabId ? 'bg-white/[0.08] text-white/70' : 'text-white/30 hover:bg-white/[0.04] hover:text-white/50'}`}
              onClick={() => setActiveTabId(t.id)}
            >
              <Terminal size={10} />
              <span>{t.name}</span>
              {tabs.length > 1 && (
                <X size={9} className="text-white/20 hover:text-white/60 ml-0.5"
                  onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} />
              )}
            </div>
          ))}
          <div className="relative">
            <button
              className="p-1 rounded hover:bg-white/[0.06] text-white/25 hover:text-white/50"
              onClick={() => setShowShellPicker(!showShellPicker)}
            >
              <Plus size={11} />
            </button>
            {showShellPicker && (
              <div className="absolute top-full left-0 mt-1 bg-[#1a1b26] border border-white/[0.1] rounded-lg py-1 z-50 shadow-xl min-w-[120px]">
                {SHELL_OPTIONS.map(sh => (
                  <button key={sh} className="w-full px-3 py-1.5 text-[10px] text-white/60 hover:bg-white/[0.06] text-left transition-colors"
                    onClick={() => addTab(sh)}>
                    <Terminal size={10} className="inline mr-1.5" />{sh}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <TipIcon icon={Search} tip="搜索输出" size={11} className={showTermSearch ? 'text-indigo-400' : 'text-white/25'}
            onClick={() => { setShowTermSearch(!showTermSearch); setTimeout(() => searchInputRef.current?.focus(), 50); }} />
          <TipIcon icon={Copy} tip="复制输出" size={11} className="text-white/25"
            onClick={() => { navigator.clipboard?.writeText(activeTab.history.join('\n')); }} />
          <TipIcon icon={Zap} tip="快捷命令" size={11} className={showAliases ? 'text-amber-400' : 'text-white/25'}
            onClick={() => setShowAliases(!showAliases)} />
          <TipIcon icon={Split} tip="拆分终端" size={11} className="text-white/25" onClick={() => addTab(activeTab.shell)} />
          <TipIcon icon={expanded ? Minimize2 : Maximize2} tip={expanded ? '最小化' : '最大化'} size={11} className="text-white/25" onClick={onToggle} />
          <TipIcon icon={X} tip="关闭终端" size={11} className="text-white/25" onClick={onClose} />
        </div>
      </div>

      {/* Terminal search bar */}
      {expanded && showTermSearch && (
        <div className="flex items-center gap-2 px-3 py-1 border-b border-white/[0.04] shrink-0 bg-[#0d0e14]">
          <Search size={10} className="text-white/25" />
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索终端输出..."
            className="flex-1 bg-transparent text-[10px] text-white/60 placeholder-white/20 outline-none"
          />
          {searchTerm && (
            <span className="text-[9px] text-white/25">
              {activeTab.history.filter(l => l.toLowerCase().includes(searchTerm.toLowerCase())).length} 处匹配
            </span>
          )}
          <button onClick={() => { setShowTermSearch(false); setSearchTerm(''); }} className="text-white/25 hover:text-white/50">
            <X size={10} />
          </button>
        </div>
      )}

      {/* Quick command aliases */}
      {expanded && showAliases && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.04] shrink-0 bg-[#0d0e14] flex-wrap">
          <Zap size={10} className="text-amber-400/40 shrink-0" />
          {QUICK_ALIASES.map(a => (
            <button key={a.label}
              className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors"
              onClick={() => { setTermInput(a.cmd); execCmd(a.cmd); setShowAliases(false); }}>
              <span className={a.color}>{a.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Terminal output */}
      {expanded && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] cursor-text relative"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
          onClick={() => inputRef.current?.focus()}
        >
          {dragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/[0.06] rounded-lg z-10 pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                <FolderOpen size={14} className="text-indigo-400" />
                <span className="text-[11px] text-indigo-300" style={{ fontWeight: 500 }}>拖放文件至此 → 自动 cd 到目录</span>
              </div>
            </div>
          )}
          {activeTab.history.map((line, i) => {
            const isHighlighted = searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase());
            return (
              <div key={i} className={`${line.startsWith('$') ? 'text-cyan-400/80' : line.startsWith('\u2713') ? 'text-emerald-400/80' : line.startsWith('\u279C') ? 'text-indigo-400/80' : 'text-white/50'} leading-[1.6] ${isHighlighted ? 'bg-amber-400/10 rounded px-1 -mx-1' : ''}`}>
                {line || '\u00A0'}
              </div>
            );
          })}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-violet-400/50 text-[9px] shrink-0">{cwd.split('/').pop()}</span>
            <span className="text-emerald-400/70 shrink-0">
              {activeTab.shell === 'powershell' ? 'PS>' : activeTab.shell === 'fish' ? '>' : '$'}
            </span>
            <input
              ref={inputRef}
              value={termInput}
              onChange={(e) => setTermInput(e.target.value)}
              onKeyDown={handleKey}
              className="flex-1 bg-transparent outline-none text-green-400/80 caret-green-400"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   AI Chat Sidebar (left column)
   ================================================================ */
interface ChatMessage { id: string; role: 'user' | 'assistant' | 'system'; content: string; }

interface AIModelEntry {
  id: string; name: string; provider: string;
  badge: string; endpoint: string; providerType: 'openai' | 'ollama' | 'custom' | 'mock';
}

const DEFAULT_AI_MODELS: AIModelEntry[] = [
  { id: 'glm-4.5', name: 'GLM-4.5', provider: 'ZhipuAI', badge: 'text-cyan-400/70 bg-cyan-500/10 border-cyan-500/15', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', providerType: 'custom' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', badge: 'text-emerald-400/70 bg-emerald-500/10 border-emerald-500/15', endpoint: 'https://api.openai.com/v1/chat/completions', providerType: 'openai' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', badge: 'text-violet-400/70 bg-violet-500/10 border-violet-500/15', endpoint: 'https://api.deepseek.com/v1/chat/completions', providerType: 'custom' },
  { id: 'qwen-plus', name: 'Qwen Plus', provider: '通义千问', badge: 'text-amber-400/70 bg-amber-500/10 border-amber-500/15', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', providerType: 'custom' },
  { id: 'ernie-4.0', name: 'ERNIE-4.0', provider: '百度文心', badge: 'text-blue-400/70 bg-blue-500/10 border-blue-500/15', endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro', providerType: 'custom' },
  { id: 'qwen-max', name: 'Qwen Max', provider: '阿里通义', badge: 'text-orange-400/70 bg-orange-500/10 border-orange-500/15', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', providerType: 'custom' },
  { id: 'local-ollama', name: 'Ollama 本地', provider: '本地模型', badge: 'text-rose-400/70 bg-rose-500/10 border-rose-500/15', endpoint: 'http://localhost:11434', providerType: 'ollama' },
];

/* ── Persistent API key storage ── */
const MODEL_KEYS_STORAGE = 'yyc3-ai-model-keys';
function saveModelKeys(keys: Record<string, string>) {
  try { localStorage.setItem(MODEL_KEYS_STORAGE, JSON.stringify(keys)); } catch {}
}

/* ── Code block extraction from markdown ── */
interface CodeBlock { language: string; code: string; filename?: string; }
function extractCodeBlocks(text: string): { blocks: CodeBlock[]; parts: { type: 'text' | 'code'; content: string; blockIdx?: number }[] } {
  const blocks: CodeBlock[] = [];
  const parts: { type: 'text' | 'code'; content: string; blockIdx?: number }[] = [];
  const regex = /```(\w*)\s*\n([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) });
    const lang = match[1] || 'plaintext';
    const code = match[2].trimEnd();
    const firstLine = code.split('\n')[0];
    const fnMatch = firstLine.match(/\/\/\s*(\S+\.\w+)/);
    blocks.push({ language: lang, code, filename: fnMatch?.[1] });
    parts.push({ type: 'code', content: code, blockIdx: blocks.length - 1 });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });
  return { blocks, parts };
}

/* ── Model Config Dialog ── */
function ModelConfigDialog({ models, modelKeys, onSave, onClose }: {
  models: AIModelEntry[]; modelKeys: Record<string, string>;
  onSave: (keys: Record<string, string>) => void; onClose: () => void;
}) {
  const [keys, setKeys] = useState<Record<string, string>>({ ...modelKeys });
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  return (
    <motion.div
      className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-[480px] bg-[#14151e] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
        initial={{ y: -20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-indigo-400" />
            <span className="text-[13px] text-white/80" style={{ fontWeight: 600 }}>AI 模型配置</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X size={14} className="text-white/40" /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <p className="text-[10px] text-white/30 mb-2">配置 API Key 后即可启用真实 AI 流式响应。密钥仅保存在本地浏览器 localStorage 中，不会上传到任何服务器。</p>
          {models.map(m => (
            <div key={m.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${m.badge}`}>{m.provider}</span>
                  <span className="text-[12px] text-white/70" style={{ fontWeight: 500 }}>{m.name}</span>
                </div>
                {keys[m.id] && <Check size={12} className="text-emerald-400/70" />}
              </div>
              <div className="text-[9px] text-white/25 font-mono truncate">{m.endpoint}</div>
              {m.providerType !== 'ollama' ? (
                <div className="flex items-center gap-2">
                  <input
                    type={showKey[m.id] ? 'text' : 'password'}
                    value={keys[m.id] || ''}
                    onChange={(e) => setKeys(prev => ({ ...prev, [m.id]: e.target.value }))}
                    placeholder="输入 API Key..."
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11px] text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/30 font-mono"
                  />
                  <button
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 text-[9px]"
                    onClick={() => setShowKey(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                  >{showKey[m.id] ? '隐藏' : '显示'}</button>
                </div>
              ) : (
                <p className="text-[10px] text-white/30">本地 Ollama 无需 API Key，确保 Ollama 已在本机运行即可。</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-[11px] text-white/40 hover:bg-white/[0.06] transition-colors">取消</button>
          <button
            onClick={() => { onSave(keys); onClose(); }}
            className="px-4 py-1.5 rounded-lg bg-indigo-500 text-[11px] text-white hover:bg-indigo-400 transition-colors"
          >保存配置</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Code Block with Inject Buttons ── */
function CodeBlockView({ block, onApplyToEditor, onCreateFile }: {
  block: CodeBlock;
  onApplyToEditor: (code: string, lang: string) => void;
  onCreateFile: (code: string, lang: string, suggestedName?: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-2 rounded-lg overflow-hidden border border-white/[0.08] bg-[#0a0b10]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Code2 size={10} className="text-cyan-400/60" />
          <span className="text-[9px] text-white/30">{block.language}</span>
          {block.filename && <span className="text-[9px] text-indigo-400/60 font-mono">{block.filename}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onApplyToEditor(block.code, block.language)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 hover:bg-indigo-500/25 transition-colors"
          >
            <FilePen size={9} />应用到编辑器
          </button>
          <button
            onClick={() => onCreateFile(block.code, block.language, block.filename)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors"
          >
            <FilePlus size={9} />创建文件
          </button>
          <button
            onClick={() => { navigator.clipboard?.writeText(block.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-white/40 hover:bg-white/[0.06] transition-colors"
          >
            {copied ? <Check size={9} className="text-emerald-400" /> : <Copy size={9} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>
      <pre className="px-3 py-2 text-[10px] text-white/60 font-mono overflow-x-auto leading-[1.6]" style={{ scrollbarWidth: 'thin' }}>
        {block.code}
      </pre>
    </div>
  );
}

/* ── Render AI message content with code blocks ── */
function AIMessageContent({ content, onApplyToEditor, onCreateFile }: {
  content: string;
  onApplyToEditor: (code: string, lang: string) => void;
  onCreateFile: (code: string, lang: string, suggestedName?: string) => void;
}) {
  const { blocks, parts } = useMemo(() => extractCodeBlocks(content), [content]);
  if (blocks.length === 0) return <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>;
  return (
    <>
      {parts.map((p, i) => p.type === 'text' ? (
        <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{p.content}</span>
      ) : (
        <CodeBlockView
          key={i}
          block={blocks[p.blockIdx!]}
          onApplyToEditor={onApplyToEditor}
          onCreateFile={onCreateFile}
        />
      ))}
    </>
  );
}

function AIChatPanel({ onInjectCode, onCreateFileFromAI }: {
  onInjectCode: (code: string, lang: string) => void;
  onCreateFileFromAI: (code: string, lang: string, suggestedName?: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'system', content: '' },
    { id: '2', role: 'assistant', content: 'YYC\u00b3 CloudPivot AI \u7f16\u7a0b\u52a9\u624b\u5df2\u5c31\u7eea\uff01\n\n\u6211\u53ef\u4ee5\u5e2e\u4f60\uff1a\n\n\u2022 \u6839\u636e\u63cf\u8ff0\u751f\u6210\u4ee3\u7801\n\u2022 \u8c03\u8bd5\u5e76\u4fee\u590d\u95ee\u9898\n\u2022 \u91cd\u6784\u73b0\u6709\u4ee3\u7801\n\u2022 \u89e3\u91ca\u4ee3\u7801\u903b\u8f91\n\n\u8bd5\u8bd5\uff1a\u300c\u521b\u5efa\u4e00\u4e2a\u5e26\u8868\u5355\u9a8c\u8bc1\u7684\u767b\u5f55\u7ec4\u4ef6\u300d\n\n\ud83d\udca1 \u70b9\u51fb\u53f3\u4e0a\u89d2 \u2699 \u914d\u7f6e API Key \u542f\u7528\u771f\u5b9e AI \u54cd\u5e94\u3002' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  // Global AI model context
  const globalAI = useGlobalAI();
  const selectedModel = useMemo(() => {
    const gm = globalAI.getActiveModel();
    if (!gm) return DEFAULT_AI_MODELS[0];
    return DEFAULT_AI_MODELS.find(m => m.id === gm.id) || DEFAULT_AI_MODELS[0];
  }, [globalAI]);
  const modelKeys = globalAI.apiKeys;

  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showModelConfig, setShowModelConfig] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  // Close model picker on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (modelRef.current && !modelRef.current.contains(e.target as HTMLElement)) setShowModelPicker(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSaveKeys = useCallback((keys: Record<string, string>) => {
    globalAI.setApiKeys(keys);
    saveModelKeys(keys); // keep localStorage in sync for backward compat
  }, [globalAI]);

  // Streaming AI hook
  const streamingAI = useStreamingAI();

  // Determine if selected model has real API key
  const hasApiKey = selectedModel.providerType === 'ollama' || !!modelKeys[selectedModel.id];

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Build the AI model config — use real API when key is configured
    const apiKey = modelKeys[selectedModel.id] || '';
    const useRealAPI = hasApiKey && selectedModel.providerType !== 'mock';
    const aiModelConfig: AIModelConfig = {
      id: selectedModel.id,
      name: selectedModel.name,
      provider: useRealAPI ? selectedModel.providerType : 'mock',
      endpoint: selectedModel.endpoint,
      apiKey,
    };

    // Build message history for context
    const aiMessages = messages
      .filter(m => m.role !== 'system')
      .slice(-10) // Last 10 messages for context
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    aiMessages.push({ role: 'user' as const, content: input.trim() });

    // Add streaming assistant message placeholder
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

    try {
      await streamingAI.sendMessage(
        aiModelConfig,
        [
          { role: 'system', content: 'You are YYC3 AI Code Assistant. Help users with code generation, debugging, and development tasks. Respond in Chinese when the user writes in Chinese. Use Markdown formatting with code blocks.' },
          ...aiMessages,
        ],
        (fullText) => {
          // Update the streaming message in real-time
          setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullText } : m));
        },
      );
    } catch (err: any) {
      if (err.message !== 'Aborted') {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: `Error: ${err.message}\n\nTip: Configure a real API key in the model settings to enable live AI responses.` } : m
        ));
      }
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, selectedModel, streamingAI, modelKeys, hasApiKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] shrink-0">
        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Bot size={13} className="text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0 relative" ref={modelRef}>
          <button
            className="flex items-center gap-1 hover:bg-white/[0.04] rounded px-1 -mx-1 py-0.5 transition-colors"
            onClick={() => setShowModelPicker(!showModelPicker)}
          >
            <p className="text-[11px] text-white/70" style={{ fontWeight: 500 }}>AI 对话面板</p>
            <ChevronDown size={10} className={`text-white/30 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
          </button>
          <p className="text-[9px] text-white/30 px-1">{selectedModel.name} | {selectedModel.provider} | {hasApiKey ? '实时流式' : 'Mock 模式'}</p>
          <AnimatePresence>
            {showModelPicker && (
              <motion.div
                className="absolute top-full left-0 mt-1 bg-[#1a1b26] border border-white/[0.1] rounded-xl py-1.5 z-50 shadow-2xl min-w-[200px]"
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              >
                <div className="px-3 py-1.5 border-b border-white/[0.06] mb-1">
                  <p className="text-[10px] text-white/30">选择 AI 模型</p>
                </div>
                {DEFAULT_AI_MODELS.map(m => (
                  <button
                    key={m.id}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.06] transition-colors ${selectedModel.id === m.id ? 'bg-white/[0.04]' : ''}`}
                    onClick={() => { globalAI.setActiveModel(m.id); setShowModelPicker(false); }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedModel.id === m.id ? 'bg-indigo-400' : 'bg-white/10'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/70">{m.name}</p>
                      <p className="text-[9px] text-white/25">{m.provider}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {modelKeys[m.id] && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      <span className={`text-[8px] px-1.5 py-0.5 rounded border ${m.badge}`}>{m.provider}</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <TipIcon icon={Settings} tip="模型设置" size={13} className="text-white/30" onClick={() => setShowModelConfig(true)} />
        {hasApiKey && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="API Key 已配置" />}
      </div>

      {/* Model Config Dialog */}
      <AnimatePresence>
        {showModelConfig && (
          <ModelConfigDialog
            models={DEFAULT_AI_MODELS}
            modelKeys={modelKeys}
            onSave={handleSaveKeys}
            onClose={() => setShowModelConfig(false)}
          />
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        {messages.filter(m => m.role !== 'system').map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-xl px-3 py-2 text-[11px] ${
              msg.role === 'user'
                ? 'bg-indigo-500/20 text-white/80 border border-indigo-500/20'
                : 'bg-white/[0.04] text-white/70 border border-white/[0.06]'
            }`} style={{ lineHeight: '1.6' }}>
              {msg.role === 'assistant' ? (
                <AIMessageContent
                  content={msg.content}
                  onApplyToEditor={onInjectCode}
                  onCreateFile={onCreateFileFromAI}
                />
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] p-3 shrink-0">
        <div className="flex items-center gap-1 mb-2 relative">
          <TipIcon icon={Plus} tip="展开多功能菜单" size={13} className={showAddMenu ? 'text-indigo-400 bg-white/10 rounded-lg' : 'text-white/30'}
            onClick={() => setShowAddMenu(v => !v)} />
          <AnimatePresence>
            {showAddMenu && <AddFunctionMenu onClose={() => setShowAddMenu(false)} onAction={() => {}} />}
          </AnimatePresence>
          <TipIcon icon={ImageIcon} tip="图片上传" size={13} className="text-white/30" />
          <TipIcon icon={FileUp} tip="文件导入" size={13} className="text-white/30" />
          <TipIcon icon={Github} tip="GitHub 链接" size={13} className="text-white/30" />
          <TipIcon icon={Figma} tip="Figma 文件" size={13} className="text-white/30" />
          <TipIcon icon={Code2} tip="代码片段" size={13} className="text-white/30" />
          <TipIcon icon={Clipboard} tip="剪贴板" size={13} className="text-white/30" />
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="输入消息..."
            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2
              text-[11px] text-white/80 placeholder-white/25 outline-none resize-none focus:border-indigo-500/30"
            rows={2} style={{ maxHeight: '80px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-2 rounded-xl shrink-0 transition-all ${
              input.trim() ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-white/[0.04] text-white/20'
            }`}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SEARCH OVERLAY — Ctrl+Shift+F global search
   ================================================================ */
function SearchOverlay({ fileTree, onClose, onSelectFile }: {
  fileTree: FileNode[]; onClose: () => void;
  onSelectFile: (id: string, node: FileNode) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const allFiles = useMemo(() => {
    const collect = (nodes: FileNode[]): FileNode[] =>
      nodes.flatMap(n => n.type === 'file' ? [n] : (n.children ? collect(n.children) : []));
    return collect(fileTree);
  }, [fileTree]);

  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return allFiles.filter(f =>
      f.name.toLowerCase().includes(q) || (f.content && f.content.toLowerCase().includes(q))
    );
  }, [query, allFiles]);

  return (
    <motion.div
      className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15%]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-[520px] bg-[#14151e] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search size={16} className="text-white/30" />
          <input
            ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文件、代码、组件... (Ctrl+Shift+F)"
            className="flex-1 bg-transparent text-white/80 text-[13px] placeholder-white/25 outline-none"
          />
          <kbd className="text-[10px] text-white/20 px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.03]">ESC</kbd>
        </div>
        <div className="p-3 max-h-[350px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map(f => {
                const hasContentMatch = f.content && f.content.toLowerCase().includes(query.toLowerCase());
                let snippet = '';
                if (hasContentMatch && f.content) {
                  const idx = f.content.toLowerCase().indexOf(query.toLowerCase());
                  const start = Math.max(0, idx - 30);
                  const end = Math.min(f.content.length, idx + query.length + 30);
                  snippet = (start > 0 ? '...' : '') + f.content.slice(start, end) + (end < f.content.length ? '...' : '');
                }
                return (
                  <button
                    key={f.id}
                    className="w-full flex flex-col gap-0.5 px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors text-left"
                    onClick={() => { onSelectFile(f.id, f); onClose(); }}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode2 size={13} className="text-cyan-400/60 shrink-0" />
                      <span className="text-[12px] text-white/70">{f.name}</span>
                      {f.language && <span className="text-[9px] text-white/20 ml-auto">{f.language}</span>}
                    </div>
                    {snippet && (
                      <p className="text-[10px] text-white/30 font-mono pl-5 truncate">{snippet}</p>
                    )}
                  </button>
                );
              })}
            </div>
          ) : query ? (
            <p className="text-[11px] text-white/25 text-center py-6">未找到匹配结果</p>
          ) : (
            <p className="text-[11px] text-white/25 text-center py-6">输入关键词开始搜索</p>
          )}
        </div>
        {query && results.length > 0 && (
          <div className="px-4 py-2 border-t border-white/[0.06] text-[10px] text-white/20">
            找到 {results.length} 个结果
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ================================================================
   MORE MENU — extend operations
   ================================================================ */
function MoreMenu({ onClose, onAction }: { onClose: () => void; onAction: (a: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as HTMLElement)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const items = [
    { label: '导出项目', icon: Download, action: 'export' },
    { label: '导入项目', icon: FileUp, action: 'import' },
    { label: '格式化代码', icon: Paintbrush, action: 'format' },
    { label: '快捷键帮助', icon: Hash, action: 'shortcuts' },
    { label: '终端', icon: Terminal, action: 'terminal' },
    { label: 'Git 操作', icon: GitBranch, action: 'git' },
  ];

  return (
    <motion.div
      ref={ref}
      className="absolute top-full right-0 mt-1 bg-[#1a1b26] border border-white/[0.1] rounded-xl py-1.5 z-50 shadow-2xl min-w-[160px]"
      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
    >
      {items.map(item => (
        <button key={item.action}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-white/60 hover:bg-white/[0.06] transition-colors"
          onClick={() => { onAction(item.action); onClose(); }}>
          <item.icon size={12} className="text-white/40" />
          <span>{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

/* ================================================================
   SHORTCUTS DIALOG
   ================================================================ */
function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { keys: 'Ctrl+1', desc: '切换至预览视图' },
    { keys: 'Ctrl+2', desc: '切换至代码视图' },
    { keys: 'Ctrl+3', desc: '分屏预览（编辑器+预览并排）' },
    { keys: 'Ctrl+Shift+F', desc: '全局搜索' },
    { keys: 'Ctrl+Shift+P', desc: '项目管理面板' },
    { keys: 'Ctrl+Shift+N', desc: '通知中心' },
    { keys: 'Ctrl+,', desc: '打开设置' },
    { keys: 'Ctrl+Shift+L', desc: '语言切换' },
    { keys: 'Esc', desc: '关闭面板/返回' },
    { keys: 'Ctrl+S', desc: '保存当前文件' },
    { keys: 'Ctrl+W', desc: '关闭当前标签页' },
    { keys: 'Ctrl+\\', desc: '分屏编辑 / 关闭分屏' },
    { keys: 'F11', desc: '全屏/退出全屏' },
    { keys: '↑/↓', desc: '终端命令历史' },
    { keys: '右键标签', desc: '固定/取消固定标签页' },
    { keys: '右键', desc: '文件操作菜单' },
    { keys: '拖拽分隔线', desc: '调整面板宽度' },
    { keys: '拖拽文件→终端', desc: '自动 cd 到文件目录' },
  ];
  return (
    <motion.div
      className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-[380px] bg-[#14151e] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
        initial={{ y: -20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <span className="text-[12px] text-white/70" style={{ fontWeight: 500 }}>快捷键帮助</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X size={14} className="text-white/40" /></button>
        </div>
        <div className="p-3 space-y-1">
          {shortcuts.map(s => (
            <div key={s.keys} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/[0.03]">
              <span className="text-[11px] text-white/50">{s.desc}</span>
              <kbd className="text-[10px] text-white/30 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] font-mono">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================
   PROJECTS PANEL — 项目管理下拉面板
   ================================================================ */
const MOCK_PROJECTS = [
  { id: 'p1', name: '内部报表系统', updated: '2026-03-12 18:30', status: 'active' as const, tech: 'React + TS' },
  { id: 'p2', name: '电商后台管理', updated: '2026-03-11 14:20', status: 'active' as const, tech: 'Vue + Element' },
  { id: 'p3', name: '数据可视化平台', updated: '2026-03-10 09:45', status: 'archived' as const, tech: 'React + D3' },
  { id: 'p4', name: '移动端 H5 活动页', updated: '2026-03-08 16:10', status: 'draft' as const, tech: 'React + Motion' },
];

function ProjectsPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as HTMLElement)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  const statusColors: Record<string, string> = { active: 'bg-emerald-400', archived: 'bg-white/20', draft: 'bg-amber-400' };
  const statusLabels: Record<string, string> = { active: '进行中', archived: '已归档', draft: '草稿' };
  return (
    <motion.div ref={ref}
      className="absolute top-full right-0 mt-1 w-[320px] bg-[#14151e] border border-white/[0.1] rounded-xl shadow-2xl z-[200] overflow-hidden"
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <FolderKanban size={13} className="text-indigo-400" />
          <span className="text-[12px] text-white/70" style={{ fontWeight: 500 }}>项目管理</span>
        </div>
        <button className="px-2 py-1 rounded-md text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/15 hover:bg-indigo-500/20 transition-colors">
          <Plus size={10} className="inline mr-1" />新建项目
        </button>
      </div>
      <div className="p-2 max-h-[280px] overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin' }}>
        {MOCK_PROJECTS.map(p => (
          <button key={p.id} className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left">
            <div className={'mt-1.5 w-2 h-2 rounded-full shrink-0 ' + statusColors[p.status]} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/70 truncate" style={{ fontWeight: 500 }}>{p.name}</span>
                <span className={'text-[8px] px-1.5 py-0.5 rounded border ' + (p.status === 'active' ? 'text-emerald-400/70 bg-emerald-500/10 border-emerald-500/15' : p.status === 'draft' ? 'text-amber-400/70 bg-amber-500/10 border-amber-500/15' : 'text-white/30 bg-white/[0.04] border-white/[0.08]')}>{statusLabels[p.status]}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-white/25">{p.updated}</span>
                <span className="text-[9px] text-white/20">{p.tech}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-white/[0.06]">
        <button className="w-full text-[10px] text-white/30 hover:text-white/50 text-center py-1 transition-colors">查看全部项目 →</button>
      </div>
    </motion.div>
  );
}

/* ================================================================
   NOTIFICATIONS PANEL — 通知中心下拉面板
   ================================================================ */
const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'system' as const, title: '系统更新', desc: 'YYC³ v3.2.0 已发布，新增 Liquid Glass 主题', time: '5 分钟前', read: false },
  { id: 'n2', type: 'collab' as const, title: '协作邀请', desc: 'YanYu 邀请你加入「内部报表系统」项目', time: '1 小时前', read: false },
  { id: 'n3', type: 'ai' as const, title: 'AI 建议', desc: 'PanelCanvas.tsx 检测到 3 处可优化代码段', time: '3 小时前', read: true },
  { id: 'n4', type: 'deploy' as const, title: '部署完成', desc: '「电商后台管理」已成功部署到生产环��', time: '昨天', read: true },
];

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as HTMLElement)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  const typeIcons: Record<string, React.ElementType> = { system: Rocket, collab: Share2, ai: Sparkles, deploy: Check };
  const typeColors: Record<string, string> = { system: 'text-cyan-400/70', collab: 'text-violet-400/70', ai: 'text-amber-400/70', deploy: 'text-emerald-400/70' };
  return (
    <motion.div ref={ref}
      className="absolute top-full right-0 mt-1 w-[300px] bg-[#14151e] border border-white/[0.1] rounded-xl shadow-2xl z-[200] overflow-hidden"
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Bell size={13} className="text-amber-400" />
          <span className="text-[12px] text-white/70" style={{ fontWeight: 500 }}>通知中心</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">{MOCK_NOTIFICATIONS.filter(n => !n.read).length}</span>
        </div>
        <button className="text-[10px] text-white/30 hover:text-white/50 transition-colors">全部已读</button>
      </div>
      <div className="p-2 max-h-[260px] overflow-y-auto space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
        {MOCK_NOTIFICATIONS.map(n => {
          const NIcon = typeIcons[n.type];
          return (
            <button key={n.id} className={'w-full flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left ' + (!n.read ? 'bg-white/[0.02]' : '')}>
              <NIcon size={13} className={'mt-0.5 shrink-0 ' + typeColors[n.type]} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-white/70" style={{ fontWeight: n.read ? 400 : 500 }}>{n.title}</span>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-white/35 mt-0.5 truncate">{n.desc}</p>
                <span className="text-[9px] text-white/20 mt-0.5">{n.time}</span>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ================================================================
   SETTINGS DIALOG — 设置弹窗（含主题切换 + 语言 + 编辑器 + AI）
   ================================================================ */
function SettingsDialog({ onClose, settings, onUpdate }: {
  onClose: () => void;
  settings: import('../../hooks/useAppSettings').AppSettings;
  onUpdate: <K extends keyof import('../../hooks/useAppSettings').AppSettings>(key: K, value: import('../../hooks/useAppSettings').AppSettings[K]) => void;
}) {
  const [activeTab, setActiveTab] = useState<'general' | 'editor' | 'ai' | 'preview' | 'theme'>('general');
  const tabs = [
    { id: 'general' as const, label: '通用', icon: Settings },
    { id: 'editor' as const, label: '编辑器', icon: Code2 },
    { id: 'preview' as const, label: '预览', icon: Eye },
    { id: 'ai' as const, label: 'AI 设置', icon: Bot },
    { id: 'theme' as const, label: '主题外观', icon: Paintbrush },
  ];
  const ToggleSwitch = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
    <div className="flex items-center gap-2">
      <button onClick={onToggle} className={'w-8 h-4 rounded-full relative cursor-pointer transition-colors ' + (on ? 'bg-indigo-500' : 'bg-white/15')}>
        <div className={'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ' + (on ? 'right-0.5' : 'left-0.5')} />
      </button>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
  const indentOpts: { id: import('../../hooks/useAppSettings').IndentStyle; label: string }[] = [
    { id: '2-spaces', label: '2 空格' }, { id: '4-spaces', label: '4 空格' }, { id: 'tab', label: 'Tab' },
  ];
  return (
    <motion.div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="w-[540px] bg-[#14151e] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
        initial={{ y: -20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Settings size={15} className="text-indigo-400" /><span className="text-[13px] text-white/80" style={{ fontWeight: 600 }}>设置</span></div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X size={14} className="text-white/40" /></button>
        </div>
        <div className="flex min-h-[360px]">
          <div className="w-[140px] border-r border-white/[0.06] py-2 px-1.5 space-y-0.5 shrink-0">
            {tabs.map(t => (
              <button key={t.id} className={'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-colors ' + (activeTab === t.id ? 'bg-indigo-500/15 text-indigo-300' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70')}
                onClick={() => setActiveTab(t.id)}><t.icon size={13} /> {t.label}</button>
            ))}
          </div>
          <div className="flex-1 p-5 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div><label className="text-[11px] text-white/40 mb-2 block">界面语言</label>
                  <div className="flex gap-2">
                    {[{ id: 'zh-CN' as const, label: '中文' }, { id: 'en-US' as const, label: 'English' }].map(l => (
                      <button key={l.id} className={'px-4 py-2 rounded-lg text-[11px] border transition-colors ' + (settings.language === l.id ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06]')}
                        onClick={() => onUpdate('language', l.id)}>{l.label}</button>
                    ))}
                  </div>
                </div>
                <div><label className="text-[11px] text-white/40 mb-2 block">自动保存</label>
                  <ToggleSwitch on={settings.autoSave} onToggle={() => onUpdate('autoSave', !settings.autoSave)} label={settings.autoSave ? '已启用 · 每 ' + settings.autoSaveInterval + ' 秒自动保存' : '已禁用'} />
                </div>
                <div><label className="text-[11px] text-white/40 mb-2 block">侧栏默认展开</label>
                  <ToggleSwitch on={settings.sidebarOpen} onToggle={() => onUpdate('sidebarOpen', !settings.sidebarOpen)} label={settings.sidebarOpen ? '已启用' : '已禁用'} />
                </div>
              </div>
            )}
            {activeTab === 'editor' && (
              <div className="space-y-4">
                <div><label className="text-[11px] text-white/40 mb-2 block">字体大小</label>
                  <div className="flex items-center gap-3">
                    {[12, 13, 14, 15, 16].map(s => (
                      <button key={s} onClick={() => onUpdate('editorFontSize', s)}
                        className={'px-3 py-1.5 rounded-lg text-[11px] border transition-colors ' + (settings.editorFontSize === s ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06]')}>{s}px</button>
                    ))}
                  </div>
                </div>
                <div><label className="text-[11px] text-white/40 mb-2 block">缩进方式</label>
                  <div className="flex gap-2">
                    {indentOpts.map(o => (
                      <button key={o.id} onClick={() => onUpdate('indentStyle', o.id)}
                        className={'px-4 py-2 rounded-lg text-[11px] border transition-colors ' + (settings.indentStyle === o.id ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06]')}>{o.label}</button>
                    ))}
                  </div>
                </div>
                <div><label className="text-[11px] text-white/40 mb-2 block">代码小地图</label>
                  <ToggleSwitch on={settings.minimap} onToggle={() => onUpdate('minimap', !settings.minimap)} label={settings.minimap ? '已启用' : '已禁用'} />
                </div>
              </div>
            )}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-white/40 mb-2 block">AI 服务管理</label>
                  <button onClick={() => { onClose(); (window as any).__yyc3_open_provider_mgr?.(); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500/15 to-violet-500/15 border border-indigo-500/20 text-indigo-300 text-[11px] hover:from-indigo-500/20 hover:to-violet-500/20 transition-all"
                    style={{ fontWeight: 500 }}>
                    <Zap size={13} />
                    管理 AI 服务商 · 模型 · API Key · 性能
                  </button>
                </div>
                <div><label className="text-[11px] text-white/40 mb-2 block">默认 AI 模型</label>
                  <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[11px] text-white/70 outline-none">
                    <option>GLM-4.5 (ZhipuAI)</option><option>GPT-4o Mini (OpenAI)</option><option>DeepSeek V3</option><option>Qwen Plus (通义千问)</option><option>ERNIE-4.0 (百度文心)</option><option>Qwen Max (阿里通义)</option><option>Ollama 本地模型</option>
                  </select>
                </div>
                <div><label className="text-[11px] text-white/40 mb-2 block">流式响应</label>
                  <ToggleSwitch on={settings.streamingEnabled} onToggle={() => onUpdate('streamingEnabled', !settings.streamingEnabled)} label={settings.streamingEnabled ? '已启用 · Server-Sent Events' : '已禁用'} />
                </div>
                <div><label className="text-[11px] text-white/40 mb-2 block">上下文长度</label>
                  <div className="flex gap-2">
                    {[5, 10, 20, 50].map(n => (
                      <button key={n} onClick={() => onUpdate('aiContextLength', n)}
                        className={'px-3 py-1.5 rounded-lg text-[11px] border transition-colors ' + (settings.aiContextLength === n ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06]')}>{n} 条</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div><label className="text-[11px] text-white/40 mb-2 block">Tailwind CSS CDN</label>
                  <ToggleSwitch on={settings.previewTailwind} onToggle={() => onUpdate('previewTailwind', !settings.previewTailwind)} label={settings.previewTailwind ? '已启用 · 预览支持完整 Tailwind utility class' : '已禁用'} />
                </div>
                <div><label className="text-[11px] text-white/40 mb-2 block">滚动同步（编辑器 ↔ 预览）</label>
                  <ToggleSwitch on={settings.previewScrollSync} onToggle={() => onUpdate('previewScrollSync', !settings.previewScrollSync)} label={settings.previewScrollSync ? '已启用 · 编辑器行号与预览滚动同步' : '已禁用'} />
                </div>
                <div><label className="text-[11px] text-white/40 mb-2 block">预览防抖延迟</label>
                  <div className="flex items-center gap-3">
                    {[200, 300, 500, 800, 1200].map(ms => (
                      <button key={ms} onClick={() => onUpdate('previewDebounceMs', ms)}
                        className={'px-3 py-1.5 rounded-lg text-[11px] border transition-colors ' + (settings.previewDebounceMs === ms ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06]')}>{ms}ms</button>
                    ))}
                  </div>
                </div>
                <div><label className="text-[11px] text-white/40 mb-2 block">默认预览模式</label>
                  <div className="flex gap-2 flex-wrap">
                    {([
                      { id: 'realtime' as const, label: '实时', desc: '即时更新' },
                      { id: 'manual' as const, label: '手动', desc: '手动刷新' },
                      { id: 'delayed' as const, label: '延迟', desc: '较长防抖' },
                      { id: 'smart' as const, label: '智能', desc: '自适应延迟' },
                    ]).map(m => (
                      <button key={m.id} onClick={() => onUpdate('previewMode', m.id)}
                        className={'px-3 py-2 rounded-lg text-[11px] border transition-colors flex flex-col items-center gap-0.5 min-w-[70px] ' + (settings.previewMode === m.id ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06]')}>
                        <span style={{ fontWeight: 500 }}>{m.label}</span>
                        <span className="text-[8px] text-white/25">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Monitor size={12} className="text-cyan-400/60" />
                    <span className="text-[10px] text-cyan-400/60" style={{ fontWeight: 500 }}>预览引擎说明</span>
                  </div>
                  <p className="text-[9px] text-white/30 leading-relaxed">预览引擎使用 iframe 沙箱渲染，支持 React/TSX（Babel 转译）、HTML、CSS、JavaScript、Markdown、SVG、JSON 七种语言。Tailwind CDN 模式加载 tailwindcss.com Play CDN 以支持运行时 utility class 解析。</p>
                </div>
              </div>
            )}
            {activeTab === 'theme' && (
              <div className="space-y-4">
                <label className="text-[11px] text-white/40 mb-2 block">选择主题</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'classic' as const, name: 'Classic IDE', desc: '深色经典', gradient: 'from-slate-800 to-slate-900' },
                    { id: 'liquid-glass' as const, name: 'Liquid Glass', desc: '毛玻璃', gradient: 'from-sky-800/50 to-violet-800/50' },
                    { id: 'aurora' as const, name: 'Aurora', desc: '极光', gradient: 'from-emerald-800/50 to-cyan-800/50' },
                  ].map(t => (
                    <button key={t.id} onClick={() => onUpdate('theme', t.id)}
                      className={'relative p-3 rounded-xl border transition-all ' + (settings.theme === t.id ? 'border-indigo-500/40 ring-1 ring-indigo-500/20' : 'border-white/[0.08] hover:border-white/[0.15]')}>
                      <div className={'w-full h-16 rounded-lg bg-gradient-to-br mb-2 ' + t.gradient} />
                      <span className="text-[11px] text-white/70 block" style={{ fontWeight: 500 }}>{t.name}</span>
                      <span className="text-[9px] text-white/30">{t.desc}</span>
                      {settings.theme === t.id && <div className="absolute top-2 right-2"><Check size={12} className="text-indigo-400" /></div>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================
   USER PROFILE PANEL — 用户信息展示面板
   ================================================================ */
function UserProfilePanel({ onClose, user, rbacRole, onlineStatus, onStatusChange }: {
  onClose: () => void;
  user: { name: string; role: string; isAuth: boolean };
  rbacRole: import('../../store').RBACRole;
  onlineStatus: 'online' | 'busy' | 'offline';
  onStatusChange: (s: 'online' | 'busy' | 'offline') => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as HTMLElement)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  const status = onlineStatus;
  const setStatus = onStatusChange;
  const roleLabels: Record<string, string> = { owner: '拥有者', admin: '管理员', editor: '编辑者', viewer: '查看者', guest: '访客' };
  const statusCfg = {
    online: { color: 'bg-emerald-400', label: '在线' },
    busy: { color: 'bg-amber-400', label: '忙碌' },
    offline: { color: 'bg-white/30', label: '离线' },
  };
  return (
    <motion.div ref={ref}
      className="absolute top-full right-0 mt-1 w-[240px] bg-[#14151e] border border-white/[0.1] rounded-xl shadow-2xl z-[200] overflow-hidden"
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={'w-10 h-10 rounded-full flex items-center justify-center text-[14px] ' + (user.isAuth ? 'bg-gradient-to-br from-emerald-500 to-cyan-500' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500')} style={{ fontWeight: 600 }}>
              {user.isAuth ? (user.name?.[0] || 'U') : 'Y'}
            </div>
            <div className={'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#14151e] ' + statusCfg[status].color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-white/80 truncate" style={{ fontWeight: 500 }}>{user.isAuth ? user.name : 'YYC³ 用户'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-white/30">{user.isAuth ? user.role : '未登录'}</p>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">{roleLabels[rbacRole] || rbacRole}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-2">
        <div className="px-3 py-1.5 mb-1"><p className="text-[10px] text-white/25">在线状态</p></div>
        {(['online', 'busy', 'offline'] as const).map(s => (
          <button key={s} className={'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors ' + (status === s ? 'bg-white/[0.06] text-white/70' : 'text-white/40 hover:bg-white/[0.04]')}
            onClick={() => setStatus(s)}>
            <div className={'w-2 h-2 rounded-full ' + statusCfg[s].color} /><span>{statusCfg[s].label}</span>
            {status === s && <Check size={10} className="ml-auto text-indigo-400" />}
          </button>
        ))}
        <div className="h-px bg-white/[0.06] my-1.5" />
        <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-white/40 hover:bg-white/[0.04] transition-colors"><Settings size={12} /> 偏好设置</button>
        <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-white/40 hover:bg-white/[0.04] transition-colors"><FilePen size={12} /> 编辑资料</button>
      </div>
    </motion.div>
  );
}

/* ================================================================
   ADD FUNCTION MENU — AI聊天框⊕多功能展开菜单
   ================================================================ */
function AddFunctionMenu({ onClose, onAction }: { onClose: () => void; onAction: (a: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as HTMLElement)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  const items = [
    { label: '图片上传', icon: ImageIcon, action: 'image', desc: 'PNG, JPG, GIF, SVG', shortcut: 'Ctrl+U', color: 'text-cyan-400/70' },
    { label: '文件导入', icon: FileUp, action: 'file', desc: '多文件支持', shortcut: 'Ctrl+O', color: 'text-amber-400/70' },
    { label: 'GitHub 链接', icon: Github, action: 'github', desc: '仓库 URL', shortcut: 'Ctrl+G', color: 'text-white/60' },
    { label: 'Figma 文件', icon: Figma, action: 'figma', desc: '.fig 文件', shortcut: 'Ctrl+F', color: 'text-violet-400/70' },
    { label: '代码片段', icon: Code2, action: 'code', desc: '多语言代码', shortcut: 'Ctrl+I', color: 'text-emerald-400/70' },
    { label: '剪贴板', icon: Clipboard, action: 'clipboard', desc: '任意内容', shortcut: 'Ctrl+V', color: 'text-rose-400/70' },
  ];
  return (
    <motion.div ref={ref}
      className="absolute bottom-full left-0 mb-2 w-[260px] bg-[#1a1b26] border border-white/[0.1] rounded-xl shadow-2xl z-[100] overflow-hidden"
      initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}>
      <div className="px-3 py-2 border-b border-white/[0.06]"><p className="text-[10px] text-white/30">添加到对话</p></div>
      <div className="p-1.5 space-y-0.5">
        {items.map(item => (
          <button key={item.action} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-white/[0.06] transition-colors group"
            onClick={() => { onAction(item.action); onClose(); }}>
            <item.icon size={14} className={item.color} />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-white/60 group-hover:text-white/80">{item.label}</span>
              <span className="text-[9px] text-white/20 ml-2">{item.desc}</span>
            </div>
            <kbd className="text-[8px] text-white/15 px-1 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] font-mono">{item.shortcut}</kbd>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ================================================================
   MAIN — AI Code System Page
   ================================================================ */
export function AICodeSystem() {
  const navigate = useNavigate();

  // Core state
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [fileTree, setFileTree] = useState<FileNode[]>(makeInitialTree);
  const [selectedFileId, setSelectedFileId] = useState<string>('f3');
  const [fileContent, setFileContent] = useState<string>(makeInitialTree()[0]?.children?.[0]?.children?.[0]?.content || '');
  const [fileLanguage, setFileLanguage] = useState('typescript');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  // Split editor view
  const [splitView, setSplitView] = useState(false);
  const [splitFileId, setSplitFileId] = useState<string | null>(null);
  const [splitContent, setSplitContent] = useState('');
  const [splitLanguage, setSplitLanguage] = useState('typescript');
  const splitEditorRef = useRef<any>(null);

  // File tree interaction
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'file' | 'folder'>('file');
  const [copiedNode, setCopiedNode] = useState<FileNode | null>(null);
  const [historyNode, setHistoryNode] = useState<FileNode | null>(null);

  // Terminal — height adjustable 100-400px per guidelines
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(200);

  // Resizable panel refs for imperative collapse/expand
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);

  // Monaco refs + diagnostics
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [diagnostics, setDiagnostics] = useState<{ errors: number; warnings: number }>({ errors: 0, warnings: 0 });

  // Monaco editor selection tracking (for AI context injection)
  const [editorSelection, setEditorSelection] = useState('');

  // Scroll sync state for split view (editor ↔ preview)
  const [scrollRatio, setScrollRatio] = useState(0);
  const scrollSyncFromEditor = useRef(false);

  // Full-screen mode
  const [fullScreen, setFullScreen] = useState(false);

  // Activity Bar view
  const [activityView, setActivityView] = useState<ActivityView>('files');

  // Layout preset
  const [activePreset, setActivePreset] = useState('coding');

  // Tab drag reorder state
  const [dragTabId, setDragTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

  // Panel maximize state
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);

  // CRDT sync status — derived from useCRDTCollab hook (initialized below)
  // Placeholder: actual `syncStatus` is derived after crdt hook init

  // Overlays
  const [showSearch, setShowSearch] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [bridgeToast, setBridgeToast] = useState<string | null>(null);

  // Nav bar panels — per YYC3-AI-Code.md guidelines
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showProviderManager, setShowProviderManager] = useState(false);

  // Register global callback for Settings → AI Provider Manager bridge
  useEffect(() => {
    (window as any).__yyc3_open_provider_mgr = () => setShowProviderManager(true);
    return () => { delete (window as any).__yyc3_open_provider_mgr; };
  }, []);

  // Window Manager — per guidelines §2410
  const windowMgr = useWindowManager();
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);
  const [showPanelCreator, setShowPanelCreator] = useState(false);

  // Multi-tab editor — unified via windowMgr (Tab System Merge)
  const initialContent = makeInitialTree()[0]?.children?.[0]?.children?.[0]?.content || '';
  const wmInitRef = useRef(false);
  useEffect(() => {
    if (!wmInitRef.current && windowMgr.tabs.length === 0) {
      wmInitRef.current = true;
      windowMgr.openTab({
        id: 'tab-f3', fileId: 'f3', name: 'App.tsx', language: 'typescript',
        content: initialContent, isModified: false, isPinned: false,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Alias for backward compat
  const openTabs = windowMgr.tabs;
  const activeTabId = windowMgr.activeTabId ?? 'tab-f3';
  // Open AI Chat as floating panel
  const handleOpenAIChatFloat = useCallback(() => {
    const existing = windowMgr.floatingPanels.find(p => p.type === 'aiChat');
    if (existing) { windowMgr.dockPanel(existing.id); return; }
    windowMgr.createPanel('aiChat', { state: 'floating', position: { x: Math.max(100, window.innerWidth - 500), y: 80 } });
  }, [windowMgr]);

  // AI Service — per guidelines §AI Service Integration
  const aiService = useAIService();

  // Cross-route shared settings (persisted to localStorage) — Phase 12
  const { settings: appSettings, updateSetting, rbacUser, setOnlineStatus, setRole } = useAppSettings();
  const uiLang = appSettings.language;
  const setUiLang = useCallback((lang: string) => updateSetting('language', lang as 'zh-CN' | 'en-US'), [updateSetting]);

  // Derive CRDT user identity from RBAC state or localStorage fallback
  const crdtUserIdentity = useMemo(() => {
    if (rbacUser.identity) {
      return {
        id: rbacUser.identity.userId,
        name: rbacUser.identity.displayName,
        color: rbacUser.identity.avatarColor,
      };
    }
    try {
      const raw = localStorage.getItem('yyc3-crdt-identity');
      if (raw) {
        const parsed = JSON.parse(raw);
        return { id: parsed.userId || 'local-user', name: parsed.displayName || '本地用户', color: parsed.avatarColor || '#667eea' };
      }
    } catch { /* ignore */ }
    return { id: `user-${Date.now().toString(36)}`, name: '本地用户', color: '#667eea' };
  }, [rbacUser.identity]);

  // CRDT Real-time Collaboration — per guidelines §Real-time Collaboration (yjs 13.x)
  // WebSocket URL priority: localStorage override → WS_CONFIG env-var → undefined (local-only)
  const crdtWsUrl = useMemo(() => {
    try {
      const override = localStorage.getItem('yyc3-crdt-ws-url');
      if (override) return override;
    } catch { /* ignore */ }
    return undefined; // Default to local-only; set VITE_WS_PRIMARY in .env or localStorage for remote
  }, []);

  const crdt = useCRDTCollab({
    roomName: `yyc3-project-${selectedFileId}`,
    user: crdtUserIdentity,
    wsUrl: crdtWsUrl,
    enablePersistence: true,
    enableUndoManager: true,
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectBaseDelay: 1000,
  });
  const syncStatus = crdt.status === 'synced' ? 'synced'
    : crdt.status === 'syncing' || crdt.status === 'connecting' || crdt.status === 'connected' ? 'syncing'
    : crdt.status === 'conflict' ? 'conflict' : 'synced';

  // Global AI context for auth
  const globalAI = useGlobalAI();

  // Performance monitor — adaptive degradation for high-availability
  const { degradation: perfDegradation, level: perfLevel } = usePerformanceMonitor({
    enableAutoDegradation: true,
  });

  // Effective settings: merge user preferences with adaptive degradation overrides
  const effectiveMinimap = appSettings.minimap && !perfDegradation.disableMinimap;
  const effectiveRemoteCursors = !perfDegradation.disableRemoteCursors;
  const effectivePreviewMode = perfDegradation.reducePreviewFrequency
    ? 'delayed' as const
    : (appSettings.previewMode || 'realtime');
  const effectivePreviewDebounce = perfDegradation.reducePreviewFrequency
    ? Math.max(appSettings.previewDebounceMs || 800, 2000)
    : (appSettings.previewDebounceMs || 800);

  /* ════��══════ CROSS-ROUTE BRIDGE — Read from Designer on mount ═══════════ */
  useEffect(() => {
    const payload = bridgeReadForCode();
    if (payload && payload.code) {
      setFileContent(payload.code);
      setFileLanguage(payload.language || 'typescript');
      // Update selected file content in tree
      if (selectedFileId) {
        setFileTree(prev => {
          const update = (nodes: FileNode[]): FileNode[] =>
            nodes.map(n => {
              if (n.id === selectedFileId) return { ...n, content: payload.code, language: payload.language || n.language };
              if (n.children) return { ...n, children: update(n.children) };
              return n;
            });
          return update(prev);
        });
      }
      bridgeClearForCode();
      setBridgeToast('已从 Designer 画布同步代码');
      setTimeout(() => setBridgeToast(null), 3000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Selected file info (moved above handleSyncToDesigner to avoid TDZ)
  const selectedNode = findNodeById(fileTree, selectedFileId);

  /* ═══════════ CROSS-ROUTE BRIDGE — Send to Designer ═══════════ */
  const handleSyncToDesigner = useCallback(() => {
    const components = parseCodeToComponents(fileContent);
    bridgeSendToDesigner({
      code: fileContent,
      language: fileLanguage,
      fileName: selectedNode?.name,
      components,
    });
    setBridgeToast('代码已同步，正在跳转到 Designer...');
    setTimeout(() => {
      navigate('/designer');
    }, 600);
  }, [fileContent, fileLanguage, selectedNode, navigate]);

  // Filtered tree
  const displayTree = useMemo(() => filterTree(fileTree, treeSearchQuery), [fileTree, treeSearchQuery]);

  // File selection — integrated with multi-tab
  const handleFileSelect = useCallback((id: string, node: FileNode) => {
    if (node.type === 'folder') return;
    setSelectedFileId(id);
    const content = node.content || '';
    const lang = node.language || 'typescript';
    setFileContent(content);
    setFileLanguage(lang);

    // Open or switch to existing tab (via windowMgr)
    const tabId = 'tab-' + id;
    windowMgr.openTab({
      id: tabId, fileId: id, name: node.name, language: lang,
      content, isModified: false, isPinned: false,
    });
  }, []);

  // Close tab (via windowMgr)
  const handleCloseTab = useCallback((tabId: string) => {
    if (openTabs.length <= 1) return; // keep at least one
    windowMgr.closeTab(tabId);
  }, [openTabs.length, windowMgr]);

  // Sync file content when active tab changes (covers close, switch, open)
  const prevActiveTabIdRef = useRef(activeTabId);
  useEffect(() => {
    if (activeTabId !== prevActiveTabIdRef.current) {
      prevActiveTabIdRef.current = activeTabId;
      const tab = openTabs.find(t => t.id === activeTabId);
      if (tab) {
        setSelectedFileId(tab.fileId);
        setFileContent(tab.content);
        setFileLanguage(tab.language);
      }
    }
  }, [activeTabId, openTabs]);

  // Switch tab (via windowMgr — file sync handled by useEffect above)
  const handleSwitchTab = useCallback((tabId: string) => {
    windowMgr.setActiveTabId(tabId);
  }, [windowMgr]);

  // Pin/unpin tab (via windowMgr)
  const handleTogglePin = useCallback((tabId: string) => {
    windowMgr.togglePinTab(tabId);
  }, [windowMgr]);

  // Track modifications in active tab (via windowMgr)
  const handleContentChange = useCallback((newContent: string) => {
    setFileContent(newContent);
    windowMgr.updateTabContent(activeTabId, newContent);
  }, [activeTabId, windowMgr]);

  // Split view: open current file in split pane
  const handleToggleSplit = useCallback(() => {
    if (splitView) {
      setSplitView(false);
      setSplitFileId(null);
    } else {
      setSplitView(true);
      setSplitFileId(selectedFileId);
      setSplitContent(fileContent);
      setSplitLanguage(fileLanguage);
    }
  }, [splitView, selectedFileId, fileContent, fileLanguage]);

  // Context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    const parent = findParent(fileTree, node.id);
    setContextMenu({ x: e.clientX, y: e.clientY, node, parentId: parent?.id || null });
  }, [fileTree]);

  // Context menu actions
  const handleContextAction = useCallback((action: string) => {
    if (!contextMenu) return;
    const { node, parentId } = contextMenu;
    switch (action) {
      case 'newFile':
        setCreatingIn(node.id);
        setCreatingType('file');
        break;
      case 'newFolder':
        setCreatingIn(node.id);
        setCreatingType('folder');
        break;
      case 'rename':
        setRenamingId(node.id);
        setRenameValue(node.name);
        break;
      case 'copy':
        setCopiedNode(node);
        break;
      case 'paste':
        if (copiedNode && node.type === 'folder') {
          const clone = cloneNode(copiedNode);
          setFileTree(prev => insertNode(prev, node.id, clone));
        }
        break;
      case 'delete':
        setFileTree(prev => removeNode(prev, node.id));
        if (selectedFileId === node.id) setSelectedFileId('');
        break;
      case 'history':
        setHistoryNode(node);
        break;
    }
  }, [contextMenu, copiedNode, selectedFileId]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.currentTarget.classList.add('ring-1', 'ring-indigo-500/30');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.currentTarget.classList.remove('ring-1', 'ring-indigo-500/30');
    if (!dragNodeId || dragNodeId === targetId) return;
    const node = findNodeById(fileTree, dragNodeId);
    if (!node) return;
    let newTree = removeNode(fileTree, dragNodeId);
    newTree = insertNode(newTree, targetId, node);
    setFileTree(newTree);
    setDragNodeId(null);
  }, [dragNodeId, fileTree]);

  // Rename handlers
  const handleRenameSubmit = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      setFileTree(prev => renameNode(prev, renamingId, renameValue.trim()));
    }
    setRenamingId(null);
  }, [renamingId, renameValue]);

  // Create handlers
  const handleCreateSubmit = useCallback((name: string) => {
    if (!creatingIn) return;
    const langMap: Record<string, string> = {
      '.tsx': 'typescript', '.ts': 'typescript', '.jsx': 'javascript', '.js': 'javascript',
      '.css': 'css', '.json': 'json', '.html': 'html', '.md': 'markdown',
    };
    const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
    const newNode: FileNode = {
      id: nextId(),
      name,
      type: creatingType,
      language: langMap[ext] || 'plaintext',
      content: creatingType === 'file' ? `// ${name}\n` : undefined,
      children: creatingType === 'folder' ? [] : undefined,
    };
    setFileTree(prev => insertNode(prev, creatingIn, newNode));
    setCreatingIn(null);
  }, [creatingIn, creatingType]);

  // Keyboard shortcuts — refs to avoid stale closures
  const handleToggleSplitRef = useRef(handleToggleSplit);
  handleToggleSplitRef.current = handleToggleSplit;
  const handleCloseTabRef = useRef(handleCloseTab);
  handleCloseTabRef.current = handleCloseTab;
  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;
  const uiLangRef = useRef(uiLang);
  uiLangRef.current = uiLang;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault(); setShowSearch(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '1') { e.preventDefault(); setViewMode('preview'); }
      if ((e.ctrlKey || e.metaKey) && e.key === '2') { e.preventDefault(); setViewMode('edit'); }
      if ((e.ctrlKey || e.metaKey) && e.key === '3') { e.preventDefault(); setViewMode('split'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); /* save mock */ }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') { e.preventDefault(); setShowProjectsPanel(v => !v); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') { e.preventDefault(); setShowNotifications(v => !v); }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); setShowSettingsDialog(true); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setUiLang(uiLangRef.current === 'zh-CN' ? 'en-US' : 'zh-CN');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') { e.preventDefault(); handleToggleSplitRef.current(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') { e.preventDefault(); handleCloseTabRef.current(activeTabIdRef.current); }
      if (e.key === 'F11') { e.preventDefault(); setFullScreen(f => !f); }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setContextMenu(null);
        setShowMoreMenu(false);
        setShowProjectsPanel(false);
        setShowNotifications(false);
        setShowUserProfile(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setUiLang]);

  // Sync right panel collapse/expand with viewMode
  useEffect(() => {
    if (viewMode === 'preview') {
      rightPanelRef.current?.collapse();
    } else {
      rightPanelRef.current?.expand();
    }
  }, [viewMode]);

  // Editor format action
  const handleFormat = useCallback(() => {
    // Simple mock format: normalize indentation
    const formatted = fileContent
      .split('\n')
      .map(l => l.trimEnd())
      .join('\n');
    setFileContent(formatted);
  }, [fileContent]);

  // More menu actions
  const handleMoreAction = useCallback((action: string) => {
    switch (action) {
      case 'format': handleFormat(); break;
      case 'shortcuts': setShowShortcuts(true); break;
      case 'terminal': setTerminalVisible(v => { if (!v) setTerminalExpanded(true); return !v; }); break;
    }
  }, [handleFormat]);

  // Layout preset handler
  const handleApplyPreset = useCallback((preset: LayoutPreset) => {
    setActivePreset(preset.id);
    setTerminalVisible(preset.config.terminalVisible);
    if (preset.config.leftPanel === 0) {
      leftPanelRef.current?.collapse();
    } else {
      leftPanelRef.current?.expand();
      leftPanelRef.current?.resize(preset.config.leftPanel);
    }
    if (preset.config.rightPanel === 0) {
      rightPanelRef.current?.collapse();
    } else {
      rightPanelRef.current?.expand();
      rightPanelRef.current?.resize(preset.config.rightPanel);
    }
  }, []);

  // Tab drag reorder handlers
  const handleTabDragStart = useCallback((tabId: string) => {
    setDragTabId(tabId);
  }, []);

  const handleTabDragOver = useCallback((e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTabId(tabId);
  }, []);

  const handleTabDrop = useCallback((e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (!dragTabId || dragTabId === targetTabId) {
      setDragTabId(null);
      setDragOverTabId(null);
      return;
    }
    const fromIdx = windowMgr.tabs.findIndex(t => t.id === dragTabId);
    const toIdx = windowMgr.tabs.findIndex(t => t.id === targetTabId);
    if (fromIdx >= 0 && toIdx >= 0) {
      windowMgr.reorderTabs(fromIdx, toIdx);
    }
    setDragTabId(null);
    setDragOverTabId(null);
  }, [dragTabId]);

  const handleTabDragEnd = useCallback(() => {
    setDragTabId(null);
    setDragOverTabId(null);
  }, []);

  // Activity bar view change handler
  const handleActivityViewChange = useCallback((view: ActivityView) => {
    // Toggle: clicking same view collapses/expands the left panel
    if (view === activityView && leftPanelOpen) {
      leftPanelRef.current?.collapse();
      setLeftPanelOpen(false);
    } else {
      leftPanelRef.current?.expand();
      setLeftPanelOpen(true);
    }
    setActivityView(view);
  }, [activityView, leftPanelOpen]);

  /* ═══════════ AI CODE INJECTION — Apply AI-generated code to editor ═══════════ */
  const handleAIInjectCode = useCallback((code: string, lang: string) => {
    // Map language to file extension
    const langMap: Record<string, string> = {
      typescript: 'typescript', tsx: 'typescript', ts: 'typescript',
      javascript: 'javascript', jsx: 'javascript', js: 'javascript',
      css: 'css', json: 'json', html: 'html', markdown: 'markdown', md: 'markdown',
    };
    setFileContent(code);
    setFileLanguage(langMap[lang] || 'typescript');
    // Update the selected file node's content in the tree
    if (selectedFileId) {
      setFileTree(prev => {
        const updateContent = (nodes: FileNode[]): FileNode[] =>
          nodes.map(n => {
            if (n.id === selectedFileId) return { ...n, content: code, language: langMap[lang] || n.language };
            if (n.children) return { ...n, children: updateContent(n.children) };
            return n;
          });
        return updateContent(prev);
      });
    }
  }, [selectedFileId]);

  /* ═══════════ AI CREATE FILE — Create new file from AI-generated code ═══════════ */
  const handleAICreateFile = useCallback((code: string, lang: string, suggestedName?: string) => {
    const extMap: Record<string, string> = {
      typescript: '.tsx', tsx: '.tsx', ts: '.ts',
      javascript: '.jsx', jsx: '.jsx', js: '.js',
      css: '.css', json: '.json', html: '.html',
      markdown: '.md', md: '.md', python: '.py',
    };
    const ext = extMap[lang] || '.tsx';
    const fileName = suggestedName || ('AIGenerated' + ext);
    const langMap: Record<string, string> = {
      typescript: 'typescript', tsx: 'typescript', ts: 'typescript',
      javascript: 'javascript', jsx: 'javascript', js: 'javascript',
      css: 'css', json: 'json', html: 'html',
    };
    const newNode: FileNode = {
      id: nextId(),
      name: fileName,
      type: 'file',
      icon: FileCode2,
      language: langMap[lang] || 'typescript',
      content: code,
    };
    // Insert into src/app/components folder if it exists, else root
    const componentsId = findNodeById(fileTree, 'f7')?.id;
    setFileTree(prev => insertNode(prev, componentsId || prev[0]?.id || null, newNode));
    // Auto-select the new file
    setSelectedFileId(newNode.id);
    setFileContent(code);
    setFileLanguage(langMap[lang] || 'typescript');
  }, [fileTree]);

  /* ═══════════ MONACO EDITOR MOUNT — Completions + Error Markers ═══════════ */
  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // ── Selection tracking for AI context injection ──
    editor.onDidChangeCursorSelection(() => {
      const sel = editor.getModel()?.getValueInRange(editor.getSelection());
      setEditorSelection(sel || '');
      // CRDT awareness: update selection
      const s = editor.getSelection();
      if (s) crdt.updateSelection(s.startLineNumber, s.startColumn, s.endLineNumber, s.endColumn);
    });

    // ── CRDT cursor tracking ──
    editor.onDidChangeCursorPosition((e: any) => {
      crdt.updateCursor(e.position.lineNumber, e.position.column);
    });

    // ── CRDT Monaco binding (yjs ↔ editor sync) ──
    crdt.bindMonacoEditor(editor, monaco).catch(() => {
      // Non-critical: CRDT binding may fail in some environments
    });

    // ── Scroll sync: editor → preview ratio mapping ──
    editor.onDidScrollChange(() => {
      if (!scrollSyncFromEditor.current) {
        const scrollTop = editor.getScrollTop();
        const scrollHeight = editor.getScrollHeight();
        const clientHeight = editor.getLayoutInfo().height;
        if (scrollHeight > clientHeight) {
          const ratio = scrollTop / (scrollHeight - clientHeight);
          setScrollRatio(Math.max(0, Math.min(1, ratio)));
        }
      }
    });

    // ── Custom Completion Provider for TypeScript / JavaScript ──
    const reactHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useLayoutEffect', 'useImperativeHandle', 'useDebugValue'];
    const reactComponents = ['Fragment', 'Suspense', 'StrictMode', 'Profiler'];
    const projectImports = collectAllFileNames(fileTree);

    monaco.languages.registerCompletionItemProvider('typescript', {
      triggerCharacters: ['.', '<', '"', "'", '/'],
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: any[] = [];

        // React hooks
        reactHooks.forEach(hook => {
          suggestions.push({
            label: hook,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: hook === 'useState' ? 'useState(${1:initialValue})' :
                         hook === 'useEffect' ? 'useEffect(() => {\n  ${1}\n}, [${2}])' :
                         hook === 'useCallback' ? 'useCallback((${1}) => {\n  ${2}\n}, [${3}])' :
                         hook === 'useMemo' ? 'useMemo(() => ${1}, [${2}])' :
                         hook === 'useRef' ? 'useRef<${1}>(${2:null})' :
                         hook + '(${1})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'React Hook',
            documentation: 'React ' + hook + ' hook',
            range,
          });
        });

        // React components
        reactComponents.forEach(comp => {
          suggestions.push({
            label: comp,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: comp === 'Fragment' ? '<>\n  ${1}\n</>' : '<' + comp + '>\n  ${1}\n</' + comp + '>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'React Component',
            range,
          });
        });

        // Project file imports
        projectImports.forEach(file => {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const baseName = file.replace(/\.(tsx?|jsx?)$/, '');
            suggestions.push({
              label: 'import ' + baseName,
              kind: monaco.languages.CompletionItemKind.Module,
              insertText: "import { ${1} } from './${2:" + baseName + "}';\n",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: '项目文件导入',
              range,
            });
          }
        });

        // Common patterns
        suggestions.push(
          { label: 'interface', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'interface ${1:Name} {\n  ${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'TypeScript', range },
          { label: 'type', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'type ${1:Name} = ${2};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'TypeScript', range },
          { label: 'export function', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'export function ${1:name}(${2}): ${3:void} {\n  ${4}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: '导出函数', range },
          { label: 'export const', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'export const ${1:name} = ${2};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: '导出常量', range },
          { label: 'console.log', kind: monaco.languages.CompletionItemKind.Snippet, insertText: "console.log('${1}', ${2});", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: '调试输出', range },
          { label: 'async function', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'async function ${1:name}(${2}): Promise<${3:void}> {\n  ${4}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: '异步函数', range },
          { label: 'try-catch', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'try {\n  ${1}\n} catch (error) {\n  ${2:console.error(error);}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: '异常处理', range },
        );

        return { suggestions };
      },
    });

    // ── Hover info provider ──
    monaco.languages.registerHoverProvider('typescript', {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        const hoverMap: Record<string, string> = {
          useState: '**useState<T>(initial: T)**: 声明组件状态，返回 [state, setState] 元组',
          useEffect: '**useEffect(effect, deps?)**: 处理副作用，组件挂载/更新/卸载时执行',
          useCallback: '**useCallback(fn, deps)**: 缓存函数引用，避免不必要的子��件重渲染',
          useMemo: '**useMemo(factory, deps)**: 缓存计算结果，仅在依赖变化时重新计算',
          useRef: '**useRef<T>(initial)**: 创建可变引用，不触发重渲染',
          useContext: '**useContext(Context)**: 消费 React Context 值',
          useReducer: '**useReducer(reducer, initial)**: 复杂状态管理的替代方案',
        };
        const info = hoverMap[word.word];
        if (!info) return null;
        return {
          range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
          contents: [{ value: info }],
        };
      },
    });
  }, [fileTree]);

  /* ═══════════ Error Marker Scanner — runs on content change ═══════════ */
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;
    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const timer = setTimeout(() => {
      const markers: any[] = [];
      const lines = fileContent.split('\n');

      lines.forEach((line, idx) => {
        const ln = idx + 1;
        // Detect console.log as warning
        if (line.includes('console.log')) {
          markers.push({
            severity: monaco.MarkerSeverity.Warning,
            message: '调试语句: console.log 应在发布前移除',
            startLineNumber: ln, startColumn: line.indexOf('console.log') + 1,
            endLineNumber: ln, endColumn: line.indexOf('console.log') + 12,
          });
        }
        // Detect TODO/FIXME comments as info
        const todoMatch = line.match(/(TODO|FIXME|HACK|XXX)/i);
        if (todoMatch) {
          markers.push({
            severity: monaco.MarkerSeverity.Info,
            message: '待办标记: ' + todoMatch[0],
            startLineNumber: ln, startColumn: (todoMatch.index || 0) + 1,
            endLineNumber: ln, endColumn: (todoMatch.index || 0) + todoMatch[0].length + 1,
          });
        }
        // Detect `any` type usage as warning
        if (/:\s*any\b/.test(line)) {
          const anyIdx = line.search(/:\s*any\b/);
          markers.push({
            severity: monaco.MarkerSeverity.Warning,
            message: '类型安全: 避免使用 any 类型，建议使用具体类型',
            startLineNumber: ln, startColumn: anyIdx + 1,
            endLineNumber: ln, endColumn: anyIdx + line.slice(anyIdx).indexOf('any') + 4,
          });
        }
        // Detect unmatched brackets (simple heuristic)
        const opens = (line.match(/\{/g) || []).length;
        const closes = (line.match(/\}/g) || []).length;
        if (opens > 2 && closes === 0 && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          markers.push({
            severity: monaco.MarkerSeverity.Hint,
            message: '此行有多个开括号，请检查是否遗漏闭括号',
            startLineNumber: ln, startColumn: 1,
            endLineNumber: ln, endColumn: line.length + 1,
          });
        }
      });

      monaco.editor.setModelMarkers(model, 'yyc3-linter', markers);
      setDiagnostics({
        errors: markers.filter(m => m.severity === monaco.MarkerSeverity.Error).length,
        warnings: markers.filter(m => m.severity === monaco.MarkerSeverity.Warning).length,
      });
    }, 500); // debounce 500ms

    return () => clearTimeout(timer);
  }, [fileContent]);

  /* ═══════════ Drag-to-terminal path resolver ═══════════ */
  const resolveDropPath = useCallback((nodeId: string) => {
    return getNodePath(fileTree, nodeId);
  }, [fileTree]);

  // (Terminal now uses full-width absolute overlay — no positional calculation needed)

  return (
    <motion.div
      className="h-screen w-screen bg-[#0a0b10] text-white flex flex-col overflow-hidden relative"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* ═══════════ TOP NAVIGATION BAR ═══════════ */}
      {!fullScreen && (
      <header className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] bg-[#0d0e14] shrink-0">
        <div className="flex items-center gap-2.5">
          <TipIcon icon={Home} tip="返回首���" size={15} className="text-white/50" onClick={() => navigate('/')} />
          <div className="flex items-center gap-1.5">
            <img src={yyc3Logo} alt="YYC³" className="w-6 h-6 rounded-lg object-contain" />
            <span className="text-[13px] text-white/80" style={{ fontWeight: 600 }}>CloudPivot AI</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {/* 项目管理 (Ctrl+Shift+P) */}
          <div className="relative">
            <TipIcon icon={FolderKanban} tip="项目管理" size={14} active={showProjectsPanel} className="text-white/40"
              onClick={() => { setShowProjectsPanel(v => !v); setShowNotifications(false); }} />
            <AnimatePresence>{showProjectsPanel && <ProjectsPanel onClose={() => setShowProjectsPanel(false)} />}</AnimatePresence>
          </div>
          {/* 通知中心 (Ctrl+Shift+N) */}
          <div className="relative">
            <TipIcon icon={Bell} tip="通知中心" size={14} active={showNotifications} className="text-white/40"
              onClick={() => { setShowNotifications(v => !v); setShowProjectsPanel(false); }} />
            {MOCK_NOTIFICATIONS.filter(n => !n.read).length > 0 && (
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-400 pointer-events-none" />
            )}
            <AnimatePresence>{showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}</AnimatePresence>
          </div>
          {/* 设置 (Ctrl+,) */}
          <TipIcon icon={Settings} tip="设置" size={14} className="text-white/40"
            onClick={() => setShowSettingsDialog(true)} />
          <TipIcon icon={Github} tip="GitHub" size={14} className="text-white/40" />
          <TipIcon icon={Share2} tip="分享" size={14} className="text-white/40" />
          <TipIcon icon={Rocket} tip="发布" size={14} className="text-white/40" />
          <TipIcon icon={Zap} tip="快速操作" size={14} className="text-white/40" />
          {/* 语言切换 (Ctrl+Shift+L) */}
          <TipIcon icon={Globe} tip={uiLang === 'zh-CN' ? '语言切换 (中文)' : 'Language (EN)'} size={14} className="text-white/40"
            onClick={() => setUiLang(uiLang === 'zh-CN' ? 'en-US' : 'zh-CN')} />
          {/* 用户头像 */}
          <div className="relative">
            <div className={`relative group ml-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] cursor-pointer hover:ring-2 hover:ring-violet-400/30 transition-all ${
              globalAI.isAuthenticated
                ? 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
            }`} style={{ fontWeight: 600 }}
              onClick={() => setShowUserProfile(v => !v)}>
              {globalAI.isAuthenticated ? (globalAI.session?.user.name?.[0] || 'U') : 'Y'}
              {globalAI.isAuthenticated && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0d0e14]" />
              )}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] bg-black/95 text-white/90 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] border border-white/10">
                {globalAI.isAuthenticated ? (globalAI.session?.user.name + ' (' + globalAI.session?.user.role + ')') : '未登录'}
              </div>
            </div>
            <AnimatePresence>{showUserProfile && <UserProfilePanel onClose={() => setShowUserProfile(false)} user={{ name: globalAI.session?.user.name || 'YanYu', role: globalAI.session?.user.role || 'Developer', isAuth: globalAI.isAuthenticated }} rbacRole={rbacUser.currentRole} onlineStatus={rbacUser.onlineStatus} onStatusChange={setOnlineStatus} />}</AnimatePresence>
          </div>
        </div>
      </header>
      )}

      {/* ═══════════ VIEW SWITCH BAR ═══════════ */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/[0.06] bg-[#0c0d13] shrink-0">
        <div className="flex items-center gap-0.5">
          <TipIcon icon={Bot} tip="AI 助手浮窗" size={14} active className="text-indigo-400" onClick={handleOpenAIChatFloat} />
          <TipIcon icon={Wrench} tip="功能扩展" size={14} className="text-white/40" />
          <TipIcon icon={Settings} tip="设置" size={14} className="text-white/40" />
        </div>
        <div className="flex items-center gap-0.5">
          <TipIcon icon={ChevronLeft} tip="返回 (Esc)" size={14} className="text-white/40" onClick={() => navigate('/')} />
          <TipIcon icon={fullScreen ? Minimize2 : Maximize2} tip={fullScreen ? '退出全屏' : '全屏'} size={14} active={fullScreen} className="text-white/40"
            onClick={() => setFullScreen(!fullScreen)} />
          <TipIcon icon={Eye} tip="预览 (Ctrl+1)" size={14} active={viewMode === 'preview'} className="text-white/40"
            onClick={() => setViewMode('preview')} />
          <TipIcon icon={Code2} tip="代码 (Ctrl+2)" size={14} active={viewMode === 'edit'} className="text-white/40"
            onClick={() => setViewMode('edit')} />
          <TipIcon icon={Columns2} tip="分屏预览 (Ctrl+3)" size={14} active={viewMode === 'split'} className="text-white/40"
            onClick={() => setViewMode('split')} />
          <div className="w-px h-4 bg-white/[0.08] mx-1" />
          <TipIcon icon={Search} tip="搜索 (Ctrl+Shift+F)" size={14} className="text-white/40"
            onClick={() => setShowSearch(true)} />
          <div className="relative">
            <TipIcon icon={MoreHorizontal} tip="更多" size={14} className="text-white/40"
              onClick={() => setShowMoreMenu(!showMoreMenu)} />
            <AnimatePresence>
              {showMoreMenu && <MoreMenu onClose={() => setShowMoreMenu(false)} onAction={handleMoreAction} />}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Sync to Designer bridge */}
          <button
            onClick={handleSyncToDesigner}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-cyan-400/70 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/15 transition-all mr-1"
            title="将当前代码同步到 Designer 画布"
          >
            <Layers size={11} />
            <span>同步到设计器</span>
          </button>
          <TipIcon icon={Terminal} tip="终端" size={14} active={terminalVisible} className="text-white/40"
            onClick={() => { setTerminalVisible(v => !v); if (!terminalVisible) setTerminalExpanded(true); }} />
          <LayoutPresetSwitcher activePreset={activePreset} onApplyPreset={handleApplyPreset} />
          <TipIcon icon={LayoutDashboard} tip="布局管理" size={14} className="text-white/40" onClick={() => setShowLayoutDialog(true)} />
          <TipIcon icon={File} tip="文件列表" size={14} className="text-white/40" />
          <TipIcon icon={Monitor} tip="设备预览" size={14} className="text-white/40" />
        </div>
      </div>

      {/* Bridge sync toast */}
      <AnimatePresence>
        {bridgeToast && (
          <motion.div
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[500] px-4 py-2.5 rounded-xl bg-[#1a1b26] border border-cyan-500/20 shadow-2xl flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Layers size={14} className="text-cyan-400" />
            <span className="text-[12px] text-cyan-300/80">{bridgeToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ THREE-COLUMN LAYOUT — Activity Bar + Resizable Panels ═══════════ */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Activity Bar — VS Code style */}
        {!fullScreen && (
          <ActivityBar activeView={activityView} onViewChange={handleActivityViewChange} />
        )}

        {/* Main content area with vertical split for terminal */}
        <PanelGroup direction="vertical" autoSaveId="yyc3-ai-code-vertical">
          {/* Top: Horizontal panel group */}
          <ResizablePanel defaultSize={75} minSize={40} id="main-content-panel" order={1}>
        <PanelGroup
          direction="horizontal"
          autoSaveId="yyc3-ai-code-layout"
        >
          {/* LEFT COLUMN — AI Chat (collapsible via imperative API) */}
          {!fullScreen && (
            <>
              <ResizablePanel
                ref={leftPanelRef}
                defaultSize={25}
                minSize={15}
                maxSize={40}
                collapsible
                collapsedSize={0}
                order={1}
                id="ai-chat-panel"
                onCollapse={() => setLeftPanelOpen(false)}
                onExpand={() => setLeftPanelOpen(true)}
              >
                <div className="flex flex-col h-full bg-[#0d0e14]">
                  {activityView === 'ai' && <AIChatPanel onInjectCode={handleAIInjectCode} onCreateFileFromAI={handleAICreateFile} />}
                  {activityView === 'search' && <SearchPanel
                    fileTree={fileTree}
                    onOpenFile={(fileId, line) => {
                      const findNode = (nodes: typeof fileTree): typeof fileTree[0] | null => {
                        for (const n of nodes) {
                          if (n.id === fileId) return n;
                          if (n.children) { const f = findNode(n.children); if (f) return f; }
                        }
                        return null;
                      };
                      const node = findNode(fileTree);
                      if (node) handleFileSelect(fileId, node);
                    }}
                  />}
                  {activityView === 'git' && <GitPanel />}
                  {activityView === 'debug' && <DebugPanel />}
                  {activityView === 'run' && <RunPanel />}
                  {activityView === 'extensions' && <ExtensionsPanel />}
                  {activityView === 'database' && <DatabasePanel />}
                  {activityView === 'multi-instance' && <MultiInstanceManager />}
                  {activityView === 'files' && <AIChatPanel onInjectCode={handleAIInjectCode} onCreateFileFromAI={handleAICreateFile} />}
                </div>
              </ResizablePanel>
              <PanelDragHandle />
            </>
          )}
          {!leftPanelOpen && !fullScreen && (
            <button
              onClick={() => leftPanelRef.current?.expand()}
              className="w-8 flex items-center justify-center border-r border-white/[0.06] bg-[#0d0e14] hover:bg-white/[0.03] transition-colors shrink-0"
            >
              <PanelLeftClose size={14} className="text-white/30 rotate-180" />
            </button>
          )}

          {/* MIDDLE COLUMN — File Resource Manager */}
          <ResizablePanel
            defaultSize={viewMode === 'preview' ? 60 : viewMode === 'split' ? 25 : 40}
            minSize={20}
            order={2}
            id="file-manager-panel"
          >
            <motion.div
              className="flex flex-col h-full bg-[#0c0d13]"
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2">
                  <TipIcon icon={FolderOpen} tip="文件资源管理器" size={13} className="text-amber-400/60" />
                  <span className="text-[11px] text-white/50" style={{ fontWeight: 500 }}>文件资源管理器</span>
                  {copiedNode && (
                    <span className="text-[9px] text-emerald-400/50 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
                      已复制: {copiedNode.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <TipIcon icon={FilePlus} tip="新建文件" size={12} className="text-white/30"
                    onClick={() => { setCreatingIn(fileTree[0]?.id || null); setCreatingType('file'); }} />
                  <TipIcon icon={FolderPlus} tip="新建文件夹" size={12} className="text-white/30"
                    onClick={() => { setCreatingIn(fileTree[0]?.id || null); setCreatingType('folder'); }} />
                  <TipIcon icon={RotateCcw} tip="刷新" size={12} className="text-white/30"
                    onClick={() => setFileTree(makeInitialTree())} />
                  {leftPanelOpen && (
                    <TipIcon icon={PanelRightClose} tip="收起左栏" size={12} className="text-white/30"
                      onClick={() => leftPanelRef.current?.collapse()} />
                  )}
                </div>
              </div>

              {/* Search filter */}
              <div className="px-3 py-1.5 border-b border-white/[0.04] shrink-0">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] focus-within:border-indigo-500/30 transition-colors">
                  <Search size={11} className="text-white/25" />
                  <input
                    value={treeSearchQuery}
                    onChange={(e) => setTreeSearchQuery(e.target.value)}
                    placeholder="搜索过滤..."
                    className="flex-1 bg-transparent text-[11px] text-white/60 placeholder-white/20 outline-none"
                  />
                  {treeSearchQuery && (
                    <button onClick={() => setTreeSearchQuery('')} className="text-white/25 hover:text-white/50">
                      <X size={10} />
                    </button>
                  )}
                </div>
              </div>

              {/* File tree + preview split */}
              <div className="flex-1 flex min-h-0">
                <div
                  className={`${viewMode === 'preview' ? 'w-[220px] border-r border-white/[0.04]' : 'flex-1'} shrink-0 overflow-y-auto py-1.5`}
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (dragNodeId) handleDrop(e, ''); }}
                >
                  <div className="px-3 py-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <FolderOpen size={12} className="text-amber-400/50" />
                      <span className="text-[10px] text-white/30 uppercase" style={{ fontWeight: 600, letterSpacing: '0.5px' }}>项目结构</span>
                    </div>
                  </div>
                  {displayTree.length > 0 ? displayTree.map(node => (
                    <FileTreeNode
                      key={node.id} node={node} selectedFile={selectedFileId}
                      onSelect={handleFileSelect} onContextMenu={handleContextMenu}
                      dragNodeId={dragNodeId} onDragStart={setDragNodeId} onDragOver={handleDragOver} onDrop={handleDrop}
                      renamingId={renamingId} renameValue={renameValue} setRenameValue={setRenameValue}
                      onRenameSubmit={handleRenameSubmit} onRenameCancel={() => setRenamingId(null)}
                      creatingIn={creatingIn} creatingType={creatingType}
                      onCreateSubmit={handleCreateSubmit} onCreateCancel={() => setCreatingIn(null)}
                      searchQuery={treeSearchQuery}
                    />
                  )) : (
                    <div className="px-4 py-6 text-center">
                      <Search size={20} className="text-white/10 mx-auto mb-2" />
                      <p className="text-[10px] text-white/20">无匹配文件</p>
                    </div>
                  )}
                </div>

                {/* Preview area (preview mode merges mid+right) */}
                {viewMode === 'preview' && (
                  <div className="flex-1 flex flex-col bg-[#0a0b10]">
                    <LivePreview
                      code={fileContent}
                      language={fileLanguage}
                      autoRefresh={true}
                      debounceMs={effectivePreviewDebounce}
                      enableTailwind={appSettings.previewTailwind !== false}
                      mode={effectivePreviewMode}
                      scrollRatio={scrollRatio}
                      onScrollRatioChange={(ratio) => {
                        scrollSyncFromEditor.current = true;
                        if (editorRef.current) {
                          const scrollHeight = editorRef.current.getScrollHeight();
                          const clientHeight = editorRef.current.getLayoutInfo().height;
                          editorRef.current.setScrollTop(ratio * (scrollHeight - clientHeight));
                        }
                        setTimeout(() => { scrollSyncFromEditor.current = false; }, 100);
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </ResizablePanel>

          {/* RIGHT COLUMN — Code Editor with Multi-Tab + Split View */}
          <PanelDragHandle />
          <ResizablePanel
            ref={rightPanelRef}
            defaultSize={35}
            minSize={20}
            maxSize={60}
            collapsible
            collapsedSize={0}
            order={3}
            id="code-editor-panel"
          >
            {(viewMode === 'edit' || viewMode === 'split') ? (
              <div
                className="flex flex-col h-full bg-[#0d0e14]"
              >
                  {/* Editor header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
                    <div className="flex items-center gap-2">
                      <Monitor size={13} className="text-cyan-400/60" />
                      <span className="text-[11px] text-white/50" style={{ fontWeight: 500 }}>文件预览 / 编辑</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <TipIcon icon={SquareSplitHorizontal} tip={splitView ? '关闭分屏' : '分屏编辑'} size={12}
                        active={splitView} className="text-white/30" onClick={handleToggleSplit} />
                      <TipIcon icon={Paintbrush} tip="格式化" size={12} className="text-white/30" onClick={handleFormat} />
                      <TipIcon icon={Copy} tip="复制" size={12} className="text-white/30"
                        onClick={() => navigator.clipboard?.writeText(fileContent)} />
                      <TipIcon icon={Download} tip="下载" size={12} className="text-white/30" />
                      <TipIcon icon={Maximize2} tip={windowMgr.maximizedPanel ? '退出全屏' : '全屏'} size={12}
                        className="text-white/30" active={!!windowMgr.maximizedPanel}
                        onClick={() => windowMgr.maximizePanel('panel-editor')} />
                    </div>
                  </div>

                  {/* Multi-Tab Bar with drag reorder */}
                  <div className="flex items-center border-b border-white/[0.04] shrink-0 bg-[#0c0d13] overflow-x-auto"
                    style={{ scrollbarWidth: 'none' }}>
                    {openTabs.map(tab => (
                      <div
                        key={tab.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/tab-id', tab.id); handleTabDragStart(tab.id); }}
                        onDragOver={(e) => handleTabDragOver(e, tab.id)}
                        onDrop={(e) => handleTabDrop(e, tab.id)}
                        onDragEnd={handleTabDragEnd}
                        className={`group flex items-center gap-1 px-3 py-1.5 border-r border-white/[0.04] cursor-pointer transition-all shrink-0 min-w-0 ${
                          activeTabId === tab.id
                            ? 'bg-[#0d0e14] text-white/80 border-b-2 border-b-indigo-500'
                            : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
                        } ${dragTabId === tab.id ? 'opacity-40' : ''} ${dragOverTabId === tab.id && dragTabId !== tab.id ? 'border-l-2 border-l-indigo-400' : ''}`}
                        onClick={() => handleSwitchTab(tab.id)}
                        onContextMenu={(e) => { e.preventDefault(); handleTogglePin(tab.id); }}
                      >
                        {tab.isPinned ? (
                          <Pin size={10} className="text-amber-400/60 shrink-0" />
                        ) : (
                          <FileCode2 size={10} className="text-cyan-400/60 shrink-0" />
                        )}
                        <span className="text-[10px] truncate max-w-[80px]">{tab.name}</span>
                        {tab.isModified && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" title="已修改" />
                        )}
                        {!tab.isPinned && openTabs.length > 1 && (
                          <X size={9}
                            className="text-white/15 hover:text-white/60 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex items-center gap-1 px-1 shrink-0">
                      <span className="text-[8px] text-white/15 px-1">{openTabs.length} 个标签</span>
                    </div>
                  </div>

                  {/* Breadcrumb navigation */}
                  <EditorBreadcrumb fileTree={fileTree} selectedFileId={selectedFileId} onNavigate={(id) => {
                    const node = findNodeById(fileTree, id);
                    if (node && node.type === 'file') handleFileSelect(id, node);
                  }} />

                  {/* Feature badges */}
                  <div className="flex items-center gap-1.5 px-3 py-1 border-b border-white/[0.04] shrink-0 flex-wrap">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/15">
                      <Monitor size={9} className="text-cyan-400/60" />
                      <span className="text-[8px] text-cyan-400/60">编辑器</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15">
                      <Paintbrush size={9} className="text-emerald-400/60" />
                      <span className="text-[8px] text-emerald-400/60">高亮</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15">
                      <Zap size={9} className="text-amber-400/60" />
                      <span className="text-[8px] text-amber-400/60">补全</span>
                    </div>
                    {splitView && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/15">
                        <Columns2 size={9} className="text-violet-400/60" />
                        <span className="text-[8px] text-violet-400/60">分屏</span>
                      </div>
                    )}
                  </div>

                  {/* Monaco Editor — with optional split view + Collab Cursors overlay */}
                  <div className="flex-1 min-h-0 relative">
                    {/* Remote user cursors overlay (auto-disabled under performance pressure) */}
                    {editorRef.current && monacoRef.current && crdt.remoteUsers.length > 0 && effectiveRemoteCursors && (
                      <CollabCursors
                        editor={editorRef.current}
                        monaco={monacoRef.current}
                        remoteUsers={crdt.remoteUsers}
                        currentUserId={crdtUserIdentity.id}
                        enableMinimapMarkers={effectiveMinimap}
                        onJumpToUser={(u) => {
                          if (u.cursor && editorRef.current) {
                            editorRef.current.revealLineInCenter(u.cursor.line);
                            editorRef.current.setPosition({ lineNumber: u.cursor.line, column: u.cursor.column });
                          }
                        }}
                      />
                    )}
                    {viewMode === 'split' ? (
                      /* Editor + LivePreview side by side */
                      <PanelGroup direction="horizontal" autoSaveId="yyc3-editor-preview-split">
                        <ResizablePanel defaultSize={50} minSize={25} id="split-editor-pane">
                          <Editor
                            height="100%"
                            language={fileLanguage}
                            theme="vs-dark"
                            value={fileContent}
                            onChange={(v) => handleContentChange(v || '')}
                            onMount={handleEditorMount}
                            options={{
                              fontSize: appSettings.editorFontSize,
                              lineHeight: appSettings.editorFontSize + 8,
                              minimap: { enabled: false },
                              tabSize: appSettings.indentStyle === '4-spaces' ? 4 : 2,
                              insertSpaces: appSettings.indentStyle !== 'tab',
                              scrollBeyondLastLine: false,
                              folding: true, lineNumbers: 'on', renderLineHighlight: 'all',
                              wordWrap: 'on', smoothScrolling: true, cursorBlinking: 'smooth',
                              padding: { top: 8, bottom: 8 }, automaticLayout: true,
                              formatOnPaste: true, suggestOnTriggerCharacters: true, quickSuggestions: true,
                              bracketPairColorization: { enabled: true },
                              guides: { bracketPairs: true, indentation: true },
                            }}
                          />
                        </ResizablePanel>
                        <PanelDragHandle />
                        <ResizablePanel defaultSize={50} minSize={25} id="split-preview-pane">
                          <LivePreview
                            code={fileContent}
                            language={fileLanguage}
                            autoRefresh={true}
                            debounceMs={perfDegradation.reducePreviewFrequency ? Math.max(600, 2000) : (appSettings.previewDebounceMs || 600)}
                            enableTailwind={appSettings.previewTailwind !== false}
                            mode={effectivePreviewMode}
                            showConsole={false}
                            scrollRatio={scrollRatio}
                            onScrollRatioChange={(ratio) => {
                              scrollSyncFromEditor.current = true;
                              if (editorRef.current) {
                                const scrollHeight = editorRef.current.getScrollHeight();
                                const clientHeight = editorRef.current.getLayoutInfo().height;
                                editorRef.current.setScrollTop(ratio * (scrollHeight - clientHeight));
                              }
                              setTimeout(() => { scrollSyncFromEditor.current = false; }, 100);
                            }}
                          />
                        </ResizablePanel>
                      </PanelGroup>
                    ) : splitView ? (
                      <PanelGroup direction="horizontal" autoSaveId="yyc3-editor-split">
                        <ResizablePanel defaultSize={50} minSize={25} id="editor-split-left">
                          <Editor
                            height="100%"
                            language={fileLanguage}
                            theme="vs-dark"
                            value={fileContent}
                            onChange={(v) => handleContentChange(v || '')}
                            onMount={handleEditorMount}
                            options={{
                              fontSize: appSettings.editorFontSize,
                              lineHeight: appSettings.editorFontSize + 8,
                              minimap: { enabled: effectiveMinimap, scale: 1 },
                              tabSize: appSettings.indentStyle === '4-spaces' ? 4 : 2,
                              insertSpaces: appSettings.indentStyle !== 'tab',
                              scrollBeyondLastLine: false,
                              folding: true,
                              lineNumbers: 'on',
                              renderLineHighlight: 'all',
                              wordWrap: 'on',
                              smoothScrolling: true,
                              cursorBlinking: 'smooth',
                              padding: { top: 8, bottom: 8 },
                              automaticLayout: true,
                              formatOnPaste: true,
                              suggestOnTriggerCharacters: true,
                              quickSuggestions: true,
                              bracketPairColorization: { enabled: true },
                              guides: { bracketPairs: true, indentation: true },
                            }}
                          />
                        </ResizablePanel>
                        <PanelDragHandle />
                        <ResizablePanel defaultSize={50} minSize={25} id="editor-split-right">
                          <Editor
                            height="100%"
                            language={splitLanguage}
                            theme="vs-dark"
                            value={splitContent}
                            onChange={(v) => setSplitContent(v || '')}
                            onMount={(editor) => { splitEditorRef.current = editor; }}
                            options={{
                              fontSize: appSettings.editorFontSize,
                              lineHeight: appSettings.editorFontSize + 8,
                              minimap: { enabled: false },
                              tabSize: appSettings.indentStyle === '4-spaces' ? 4 : 2,
                              insertSpaces: appSettings.indentStyle !== 'tab',
                              scrollBeyondLastLine: false,
                              folding: true,
                              lineNumbers: 'on',
                              renderLineHighlight: 'all',
                              wordWrap: 'on',
                              smoothScrolling: true,
                              cursorBlinking: 'smooth',
                              padding: { top: 8, bottom: 8 },
                              automaticLayout: true,
                              bracketPairColorization: { enabled: true },
                              guides: { bracketPairs: true, indentation: true },
                            }}
                          />
                        </ResizablePanel>
                      </PanelGroup>
                    ) : (
                      <Editor
                        height="100%"
                        language={fileLanguage}
                        theme="vs-dark"
                        value={fileContent}
                        onChange={(v) => handleContentChange(v || '')}
                        onMount={handleEditorMount}
                        options={{
                          fontSize: appSettings.editorFontSize,
                          lineHeight: appSettings.editorFontSize + 8,
                          minimap: { enabled: effectiveMinimap, scale: 1 },
                          tabSize: appSettings.indentStyle === '4-spaces' ? 4 : 2,
                          insertSpaces: appSettings.indentStyle !== 'tab',
                          scrollBeyondLastLine: false,
                          folding: true,
                          lineNumbers: 'on',
                          renderLineHighlight: 'all',
                          wordWrap: 'on',
                          smoothScrolling: true,
                          cursorBlinking: 'smooth',
                          padding: { top: 8, bottom: 8 },
                          automaticLayout: true,
                          formatOnPaste: true,
                          suggestOnTriggerCharacters: true,
                          quickSuggestions: true,
                          'semanticHighlighting.enabled': true,
                          bracketPairColorization: { enabled: true },
                          guides: { bracketPairs: true, indentation: true },
                        }}
                      />
                    )}
                  </div>

                  {/* Bottom status bar — live diagnostics + CRDT sync */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/[0.06] bg-[#0c0d13] shrink-0">
                    <div className="flex items-center gap-2">
                      <GitBranch size={11} className="text-white/25" />
                      <span className="text-[9px] text-white/20">main</span>
                      <div className="w-px h-3 bg-white/[0.06]" />
                      <Check size={10} className="text-emerald-400/50" />
                      <span className="text-[9px] text-white/25">{fileLanguage === 'typescript' ? 'TypeScript' : fileLanguage === 'json' ? 'JSON' : fileLanguage === 'css' ? 'CSS' : 'Plain'}</span>
                      <div className="w-px h-3 bg-white/[0.06]" />
                      {/* CRDT Sync + WS Status */}
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          syncStatus === 'synced' ? 'bg-emerald-400' :
                          syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' :
                          'bg-red-400 animate-pulse'
                        }`} />
                        <span className={`text-[9px] ${
                          syncStatus === 'synced' ? 'text-emerald-400/50' :
                          syncStatus === 'syncing' ? 'text-amber-400/50' :
                          'text-red-400/50'
                        }`}>
                          {syncStatus === 'synced' ? '已同步' : syncStatus === 'syncing' ? '同步中' : '冲突'}
                        </span>
                      </div>
                      {/* Collab users indicator */}
                      <CollabStatusIndicator
                        connectedUsers={crdt.connectedUsers}
                        currentUserId={crdtUserIdentity.id}
                        wsState={crdt.wsState}
                      />
                      {/* Performance degradation indicator */}
                      {perfLevel !== 'excellent' && perfLevel !== 'good' && (
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                          perfLevel === 'critical' ? 'bg-red-500/10 border border-red-500/15' :
                          perfLevel === 'poor' ? 'bg-amber-500/10 border border-amber-500/15' :
                          'bg-white/[0.04]'
                        }`} title={`性能等级: ${perfLevel}${perfDegradation.disableAnimations ? ' · 动画已禁用' : ''}${perfDegradation.disableMinimap ? ' · Minimap 已禁用' : ''}${perfDegradation.reducePreviewFrequency ? ' · 预览已降频' : ''}${perfDegradation.disableRemoteCursors ? ' · 远程光标已禁用' : ''}`}>
                          <Zap size={9} className={perfLevel === 'critical' ? 'text-red-400/70' : perfLevel === 'poor' ? 'text-amber-400/70' : 'text-white/30'} />
                          <span className={`text-[9px] ${perfLevel === 'critical' ? 'text-red-400/60' : perfLevel === 'poor' ? 'text-amber-400/60' : 'text-white/20'}`}>
                            {perfLevel === 'critical' ? '性能严重不足' : perfLevel === 'poor' ? '性能降级中' : '性能一般'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {diagnostics.errors > 0 ? (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/15">
                          <X size={9} className="text-red-400/70" />
                          <span className="text-[9px] text-red-400/70">{diagnostics.errors} errors</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Check size={9} className="text-emerald-400/50" />
                          <span className="text-[9px] text-emerald-400/40">0 errors</span>
                        </div>
                      )}
                      {diagnostics.warnings > 0 ? (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15">
                          <AlertCircle size={9} className="text-amber-400/70" />
                          <span className="text-[9px] text-amber-400/70">{diagnostics.warnings} warnings</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle size={9} className="text-white/20" />
                          <span className="text-[9px] text-white/15">0 warnings</span>
                        </div>
                      )}
                      <span className="text-[9px] text-white/15">UTF-8</span>
                      <div className="h-2.5 w-px bg-white/[0.08]" />
                      <div className="flex items-center gap-1">
                        <div className={'w-1.5 h-1.5 rounded-full ' + (rbacUser.onlineStatus === 'online' ? 'bg-emerald-400' : rbacUser.onlineStatus === 'busy' ? 'bg-amber-400' : 'bg-white/25')} />
                        <span className="text-[9px] text-white/25">{rbacUser.currentRole === 'owner' ? '拥有者' : rbacUser.currentRole === 'admin' ? '管理员' : rbacUser.currentRole === 'editor' ? '编辑者' : '查看者'}</span>
                      </div>
                    </div>
                  </div>
                </div>
            ) : (
              <div className="h-full bg-[#0d0e14]" />
            )}
          </ResizablePanel>
        </PanelGroup>
          </ResizablePanel>

          {/* ═══════════ INTEGRATED TERMINAL — as resizable bottom panel ═══════════ */}
          <PanelResizeHandle className={`group relative flex items-center justify-center h-[5px] cursor-row-resize transition-colors hover:bg-indigo-500/10 active:bg-indigo-500/20 ${!terminalVisible ? 'hidden' : ''}`}>
            <div className="rounded-full bg-white/10 group-hover:bg-indigo-400/50 group-active:bg-indigo-400/70 transition-all h-[3px] w-8" />
          </PanelResizeHandle>
          <ResizablePanel
            defaultSize={terminalVisible ? 25 : 0}
            minSize={0}
            maxSize={50}
            collapsible
            collapsedSize={0}
            order={2}
            id="terminal-panel"
            onCollapse={() => setTerminalExpanded(false)}
            onExpand={() => setTerminalExpanded(true)}
            className={!terminalVisible ? 'hidden' : ''}
          >
            {terminalVisible && (
              <IntegratedTerminal
                expanded={terminalExpanded}
                onToggle={() => setTerminalExpanded(v => !v)}
                onClose={() => setTerminalVisible(false)}
                onResolveDropPath={resolveDropPath}
                height={terminalHeight}
                onHeightChange={setTerminalHeight}
              />
            )}
          </ResizablePanel>
        </PanelGroup>
      </div>

      {/* ═══════════ MINIMIZED PANEL TRAY ═══════════ */}
      {windowMgr.minimizedPanels.length > 0 && !fullScreen && (
        <div className="shrink-0 border-t border-white/[0.04] bg-[#0a0b10]">
          <MinimizedPanelTray panels={windowMgr.minimizedPanels} onRestore={(id) => windowMgr.minimizePanel(id)} />
        </div>
      )}

      {/* ═══════════ GLOBAL STATUS BAR ═══════════ */}
      {!fullScreen && (
        <div className="flex items-center justify-between px-2 py-0.5 bg-indigo-600/90 text-white/90 shrink-0 select-none" style={{ minHeight: '22px' }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-1.5">
              <GitBranch size={11} />
              <span className="text-[10px]">main</span>
            </div>
            <div className="flex items-center gap-1 px-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${
                syncStatus === 'synced' ? 'bg-emerald-300' :
                syncStatus === 'syncing' ? 'bg-amber-300 animate-pulse' :
                'bg-red-300 animate-pulse'
              }`} />
              <span className="text-[10px]">{syncStatus === 'synced' ? '已同步' : syncStatus === 'syncing' ? '同步中...' : '冲突'}</span>
              {crdt.wsState !== 'closed' && (
                <span className="text-[9px] opacity-70">
                  {crdt.wsState === 'open' ? 'WS' : crdt.wsState === 'connecting' ? 'WS...' : 'WS!'}
                </span>
              )}
              {crdt.connectedUsers.length > 1 && (
                <span className="text-[9px] opacity-60">{crdt.connectedUsers.length}人</span>
              )}
            </div>
            {diagnostics.errors > 0 && (
              <div className="flex items-center gap-1 px-1.5">
                <X size={10} />
                <span className="text-[10px]">{diagnostics.errors}</span>
              </div>
            )}
            {diagnostics.warnings > 0 && (
              <div className="flex items-center gap-1 px-1.5">
                <AlertCircle size={10} />
                <span className="text-[10px]">{diagnostics.warnings}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] opacity-70">{selectedNode?.name || '—'}</span>
            <span className="text-[10px] opacity-50">{fileLanguage === 'typescript' ? 'TypeScript' : fileLanguage === 'json' ? 'JSON' : fileLanguage === 'css' ? 'CSS' : fileLanguage}</span>
            <span className="text-[10px] opacity-50">UTF-8</span>
            <span className="text-[10px] opacity-50">{openTabs.length} 标签</span>
            {windowMgr.modifiedTabs.length > 0 && <span className="text-[10px] opacity-60 text-amber-300">{windowMgr.modifiedTabs.length} 未保存</span>}
            {viewMode === 'split' && <span className="text-[10px] opacity-60">分屏</span>}
            {viewMode === 'preview' && <span className="text-[10px] opacity-60">预览</span>}
            {appSettings.previewTailwind && <span className="text-[10px] opacity-40">TW</span>}
            <div className="flex items-center gap-1 px-1.5">
              <div className={'w-1.5 h-1.5 rounded-full ' + (rbacUser.onlineStatus === 'online' ? 'bg-emerald-300' : rbacUser.onlineStatus === 'busy' ? 'bg-amber-300' : 'bg-white/40')} />
              <span className="text-[10px] opacity-70">{rbacUser.currentRole === 'owner' ? '拥有者' : rbacUser.currentRole === 'admin' ? '管理员' : rbacUser.currentRole === 'editor' ? '编辑者' : '查看者'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ OVERLAYS ═══════════ */}
      <AnimatePresence>
        {showSearch && (
          <SearchOverlay fileTree={fileTree} onClose={() => setShowSearch(false)} onSelectFile={handleFileSelect} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x} y={contextMenu.y} node={contextMenu.node}
            onAction={handleContextAction} onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyNode && (
          <VersionHistoryDialog node={historyNode} onClose={() => setHistoryNode(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showSettingsDialog && <SettingsDialog onClose={() => setShowSettingsDialog(false)} settings={appSettings} onUpdate={updateSetting} />}
      </AnimatePresence>

      {/* AI Provider Manager Dialog */}
      <AnimatePresence>
        {showProviderManager && (
          <motion.div className="fixed inset-0 z-[310] bg-black/60 backdrop-blur-sm flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProviderManager(false)}>
            <motion.div className="w-[600px] h-[520px] bg-[#14151e] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
              initial={{ y: -20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
              <AIProviderManager
                onClose={() => setShowProviderManager(false)}
                externalProviders={aiService.config.providers.length > 0 ? aiService.config.providers : undefined}
                onExternalToggleProvider={aiService.toggleProvider}
                onExternalToggleModel={aiService.toggleModel}
                onExternalUpdateApiKey={aiService.setApiKey}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout Saver Dialog */}
      <AnimatePresence>
        {showLayoutDialog && (
          <LayoutSaverDialog
            savedLayouts={windowMgr.savedLayouts}
            onSave={(name, desc) => windowMgr.saveLayout(name, desc)}
            onLoad={(id) => { windowMgr.loadLayout(id); setShowLayoutDialog(false); }}
            onDelete={(id) => windowMgr.deleteLayout(id)}
            onReset={() => { windowMgr.resetLayout(); setShowLayoutDialog(false); }}
            onClose={() => setShowLayoutDialog(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Panels (draggable + snap-to-edge + z-order) */}
      <AnimatePresence>
        {windowMgr.floatingPanels.map(fp => {
          const otherSnap = windowMgr.floatingPanels
            .filter(p => p.id !== fp.id && p.position)
            .map(p => ({ id: p.id, x: p.position!.x, y: p.position!.y, w: 420, h: 380 }));
          return (
          <FloatingPanelWrapper
            key={fp.id}
            panel={fp}
            onUpdatePosition={windowMgr.updatePanelPosition}
            onDock={windowMgr.dockPanel}
            onClose={windowMgr.deletePanel}
            otherFloatingPanels={otherSnap}
            onBringToFront={(id) => windowMgr.updatePanel(id, { zIndex: Date.now() })}
          >
            {fp.type === 'aiChat' && (
              <AIChatStreamPanel
                onChatStream={aiService.chatStream as any}
                activeModel={aiService.activeModel?.displayName}
                activeProvider={aiService.activeProvider?.displayName}
                isLoading={aiService.isLoading}
                currentCode={fileContent}
                selectedCode={editorSelection}
                editorFileName={selectedNode?.name}
              />
            )}
            {fp.type === 'terminal' && (
              <div className="p-4 text-[10px] text-white/30">终端浮动面板（开发中）</div>
            )}
            {fp.type === 'quickActions' && (
              <QuickActionsToolbar
                selectedText={editorSelection}
                currentCode={fileContent}
                fileName={selectedNode?.name}
                language={selectedNode?.name?.endsWith('.tsx') ? 'typescript' : selectedNode?.name?.endsWith('.css') ? 'css' : 'typescript'}
              />
            )}
            {fp.type !== 'aiChat' && fp.type !== 'terminal' && fp.type !== 'quickActions' && (
              <div className="p-4 text-[10px] text-white/30">{PANEL_TYPE_REGISTRY[fp.type]?.label || '面板'}（浮动模式）</div>
            )}
          </FloatingPanelWrapper>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
