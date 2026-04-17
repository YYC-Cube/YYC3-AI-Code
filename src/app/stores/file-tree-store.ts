/**
 * @file file-tree-store.ts
 * @description File tree state — workspace, nodes, context menu, diff, versioning, recent files, drag-drop, file metadata
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-13
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags file-tree, workspace, versioning, recent-files, file-metadata
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../utils/logger'

const log = createLogger('FileTreeStore')

// ============================================
// Types
// ============================================

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  /** File size in bytes (simulated) */
  size?: number
  /** Timestamp of last modification */
  modifiedAt?: number
  /** Timestamp of creation */
  createdAt?: number
  /** Whether children have been loaded (lazy loading support) */
  loaded?: boolean
  /** Whether children are currently being loaded */
  loading?: boolean
}

export interface FileVersion {
  id: string
  path: string
  content: string
  timestamp: number
  label: string
  /** Who authored this version */
  author?: string
  /** Number of lines changed (+ / -) */
  linesAdded?: number
  linesRemoved?: number
}

export interface DiffState {
  enabled: boolean
  leftPath: string | null
  rightPath: string | null
  leftContent: string
  rightContent: string
}

export interface RecentFileEntry {
  path: string
  name: string
  openedAt: number
  language: string
}

export interface WorkspaceConfig {
  rootPath: string
  name: string
  createdAt: number
}

// ============================================
// Default File Tree
// ============================================

const now = Date.now()

const DEFAULT_FILE_TREE: FileNode[] = [
  {
    name: 'src',
    path: 'src',
    type: 'folder',
    createdAt: now - 86400000,
    modifiedAt: now - 3600000,
    children: [
      {
        name: 'app',
        path: 'src/app',
        type: 'folder',
        createdAt: now - 86400000,
        modifiedAt: now - 3600000,
        children: [
          { name: 'App.tsx', path: 'src/app/App.tsx', type: 'file', size: 1420, createdAt: now - 86400000, modifiedAt: now - 7200000 },
          { name: 'routes.ts', path: 'src/app/routes.ts', type: 'file', size: 890, createdAt: now - 86400000, modifiedAt: now - 7200000 },
          {
            name: 'components',
            path: 'src/app/components',
            type: 'folder',
            createdAt: now - 86400000,
            modifiedAt: now - 1800000,
            children: [
              { name: 'HomePage.tsx', path: 'src/app/components/HomePage.tsx', type: 'file', size: 3210, createdAt: now - 86400000, modifiedAt: now - 5400000 },
              { name: 'DesignerPage.tsx', path: 'src/app/components/DesignerPage.tsx', type: 'file', size: 5640, createdAt: now - 86400000, modifiedAt: now - 3600000 },
              {
                name: 'designer',
                path: 'src/app/components/designer',
                type: 'folder',
                createdAt: now - 86400000,
                modifiedAt: now - 1800000,
                children: [
                  { name: 'TopNavBar.tsx', path: 'src/app/components/designer/TopNavBar.tsx', type: 'file', size: 8920, createdAt: now - 86400000, modifiedAt: now - 3600000 },
                  { name: 'LeftPanel.tsx', path: 'src/app/components/designer/LeftPanel.tsx', type: 'file', size: 24680, createdAt: now - 86400000, modifiedAt: now - 1800000 },
                  { name: 'CenterPanel.tsx', path: 'src/app/components/designer/CenterPanel.tsx', type: 'file', size: 18450, createdAt: now - 86400000, modifiedAt: now - 1800000 },
                  { name: 'RightPanel.tsx', path: 'src/app/components/designer/RightPanel.tsx', type: 'file', size: 12340, createdAt: now - 86400000, modifiedAt: now - 7200000 },
                  { name: 'PreviewPanel.tsx', path: 'src/app/components/designer/PreviewPanel.tsx', type: 'file', size: 15620, createdAt: now - 86400000, modifiedAt: now - 3600000 },
                  { name: 'ViewSwitchBar.tsx', path: 'src/app/components/designer/ViewSwitchBar.tsx', type: 'file', size: 4890, createdAt: now - 86400000, modifiedAt: now - 7200000 },
                  { name: 'ModelSettings.tsx', path: 'src/app/components/designer/ModelSettings.tsx', type: 'file', size: 32450, createdAt: now - 86400000, modifiedAt: now - 1800000 },
                  { name: 'CommandPalette.tsx', path: 'src/app/components/designer/CommandPalette.tsx', type: 'file', size: 11230, createdAt: now - 86400000, modifiedAt: now - 3600000 },
                  { name: 'CodeIntelligence.tsx', path: 'src/app/components/designer/CodeIntelligence.tsx', type: 'file', size: 9870, createdAt: now - 3600000, modifiedAt: now - 1800000 },
                  { name: 'FileSystemManager.tsx', path: 'src/app/components/designer/FileSystemManager.tsx', type: 'file', size: 16200, createdAt: now, modifiedAt: now },
                ],
              },
              {
                name: 'theme',
                path: 'src/app/components/theme',
                type: 'folder',
                createdAt: now - 86400000,
                modifiedAt: now - 7200000,
                children: [
                  { name: 'ThemeCustomizer.tsx', path: 'src/app/components/theme/ThemeCustomizer.tsx', type: 'file', size: 6780, createdAt: now - 86400000, modifiedAt: now - 7200000 },
                  { name: 'ThemeProvider.tsx', path: 'src/app/components/theme/ThemeProvider.tsx', type: 'file', size: 2340, createdAt: now - 86400000, modifiedAt: now - 7200000 },
                ],
              },
              {
                name: 'ui',
                path: 'src/app/components/ui',
                type: 'folder',
                createdAt: now - 86400000,
                modifiedAt: now - 86400000,
                children: [
                  { name: 'button.tsx', path: 'src/app/components/ui/button.tsx', type: 'file', size: 1560, createdAt: now - 86400000, modifiedAt: now - 86400000 },
                  { name: 'input.tsx', path: 'src/app/components/ui/input.tsx', type: 'file', size: 980, createdAt: now - 86400000, modifiedAt: now - 86400000 },
                  { name: 'card.tsx', path: 'src/app/components/ui/card.tsx', type: 'file', size: 1240, createdAt: now - 86400000, modifiedAt: now - 86400000 },
                  { name: 'scroll-area.tsx', path: 'src/app/components/ui/scroll-area.tsx', type: 'file', size: 2130, createdAt: now - 86400000, modifiedAt: now - 86400000 },
                  { name: 'resizable.tsx', path: 'src/app/components/ui/resizable.tsx', type: 'file', size: 3450, createdAt: now - 86400000, modifiedAt: now - 86400000 },
                ],
              },
            ],
          },
          {
            name: 'stores',
            path: 'src/app/stores',
            type: 'folder',
            createdAt: now - 86400000,
            modifiedAt: now - 1800000,
            children: [
              { name: 'app-store.ts', path: 'src/app/stores/app-store.ts', type: 'file', size: 14560, createdAt: now - 86400000, modifiedAt: now - 3600000 },
              { name: 'theme-store.ts', path: 'src/app/stores/theme-store.ts', type: 'file', size: 8920, createdAt: now - 86400000, modifiedAt: now - 7200000 },
              { name: 'plugin-store.ts', path: 'src/app/stores/plugin-store.ts', type: 'file', size: 6780, createdAt: now - 86400000, modifiedAt: now - 7200000 },
              { name: 'collab-store.ts', path: 'src/app/stores/collab-store.ts', type: 'file', size: 4560, createdAt: now - 86400000, modifiedAt: now - 7200000 },
              { name: 'file-tree-store.ts', path: 'src/app/stores/file-tree-store.ts', type: 'file', size: 12340, createdAt: now - 86400000, modifiedAt: now },
              { name: 'ai-service-store.ts', path: 'src/app/stores/ai-service-store.ts', type: 'file', size: 18920, createdAt: now - 3600000, modifiedAt: now - 1800000 },
              { name: 'preview-store.ts', path: 'src/app/stores/preview-store.ts', type: 'file', size: 11230, createdAt: now - 86400000, modifiedAt: now - 3600000 },
              { name: 'session-store.ts', path: 'src/app/stores/session-store.ts', type: 'file', size: 5670, createdAt: now - 86400000, modifiedAt: now - 7200000 },
            ],
          },
          {
            name: 'utils',
            path: 'src/app/utils',
            type: 'folder',
            createdAt: now - 86400000,
            modifiedAt: now - 3600000,
            children: [
              { name: 'logger.ts', path: 'src/app/utils/logger.ts', type: 'file', size: 3450, createdAt: now - 86400000, modifiedAt: now - 86400000 },
              { name: 'file-contents.ts', path: 'src/app/utils/file-contents.ts', type: 'file', size: 21340, createdAt: now - 86400000, modifiedAt: now - 3600000 },
              { name: 'liquid-glass.ts', path: 'src/app/utils/liquid-glass.ts', type: 'file', size: 4560, createdAt: now - 86400000, modifiedAt: now - 7200000 },
              { name: 'useI18n.ts', path: 'src/app/utils/useI18n.ts', type: 'file', size: 2340, createdAt: now - 86400000, modifiedAt: now - 86400000 },
            ],
          },
          {
            name: 'services',
            path: 'src/app/services',
            type: 'folder',
            createdAt: now - 86400000,
            modifiedAt: now - 1800000,
            children: [
              { name: 'i18n-service.ts', path: 'src/app/services/i18n-service.ts', type: 'file', size: 56780, createdAt: now - 86400000, modifiedAt: now - 1800000 },
            ],
          },
        ],
      },
      {
        name: 'styles',
        path: 'src/styles',
        type: 'folder',
        createdAt: now - 86400000,
        modifiedAt: now - 86400000,
        children: [
          { name: 'theme.css', path: 'src/styles/theme.css', type: 'file', size: 4560, createdAt: now - 86400000, modifiedAt: now - 86400000 },
          { name: 'index.css', path: 'src/styles/index.css', type: 'file', size: 1230, createdAt: now - 86400000, modifiedAt: now - 86400000 },
          { name: 'fonts.css', path: 'src/styles/fonts.css', type: 'file', size: 890, createdAt: now - 86400000, modifiedAt: now - 86400000 },
        ],
      },
    ],
  },
  { name: 'package.json', path: 'package.json', type: 'file', size: 2340, createdAt: now - 86400000, modifiedAt: now - 86400000 },
  { name: 'tsconfig.json', path: 'tsconfig.json', type: 'file', size: 560, createdAt: now - 86400000, modifiedAt: now - 86400000 },
  { name: 'vite.config.ts', path: 'vite.config.ts', type: 'file', size: 780, createdAt: now - 86400000, modifiedAt: now - 86400000 },
  { name: 'README.md', path: 'README.md', type: 'file', size: 3450, createdAt: now - 86400000, modifiedAt: now - 86400000 },
]

// ============================================
// Default initial versions (simulated history)
// ============================================

const INITIAL_VERSIONS: FileVersion[] = [
  {
    id: 'init-v1-app',
    path: 'src/app/App.tsx',
    content: `import { RouterProvider } from 'react-router'\nimport { router } from './routes'\n\nexport default function App() {\n  return <RouterProvider router={router} />\n}`,
    timestamp: now - 86400000,
    label: 'v1 — 初始版本',
    author: 'YYC³ AI',
    linesAdded: 6,
    linesRemoved: 0,
  },
  {
    id: 'init-v2-app',
    path: 'src/app/App.tsx',
    content: `import { RouterProvider } from 'react-router'\nimport { router } from './routes'\nimport { ThemeProvider } from './components/theme/ThemeProvider'\n\nexport default function App() {\n  return (\n    <ThemeProvider>\n      <RouterProvider router={router} />\n    </ThemeProvider>\n  )\n}`,
    timestamp: now - 43200000,
    label: 'v2 — 添加主题系统',
    author: 'YYC³ AI',
    linesAdded: 5,
    linesRemoved: 1,
  },
  {
    id: 'init-v1-center',
    path: 'src/app/components/designer/CenterPanel.tsx',
    content: '// CenterPanel v1 — basic file tree + editor',
    timestamp: now - 86400000,
    label: 'v1 — 基础文件树',
    author: 'YYC³ AI',
    linesAdded: 320,
    linesRemoved: 0,
  },
  {
    id: 'init-v2-center',
    path: 'src/app/components/designer/CenterPanel.tsx',
    content: '// CenterPanel v2 — scroll sync + code intelligence',
    timestamp: now - 7200000,
    label: 'v2 — 滚动同步 + 代码智能',
    author: '你',
    linesAdded: 145,
    linesRemoved: 28,
  },
  {
    id: 'init-v1-left',
    path: 'src/app/components/designer/LeftPanel.tsx',
    content: '// LeftPanel v1 — basic chat panel',
    timestamp: now - 86400000,
    label: 'v1 — 基础 AI 聊天',
    author: 'YYC³ AI',
    linesAdded: 280,
    linesRemoved: 0,
  },
  {
    id: 'init-v2-left',
    path: 'src/app/components/designer/LeftPanel.tsx',
    content: '// LeftPanel v2 — markdown + AI service indicator',
    timestamp: now - 3600000,
    label: 'v2 — Markdown 渲染增强',
    author: '你',
    linesAdded: 120,
    linesRemoved: 15,
  },
  {
    id: 'init-v3-left',
    path: 'src/app/components/designer/LeftPanel.tsx',
    content: '// LeftPanel v3 — AI service indicator + session management',
    timestamp: now - 1800000,
    label: 'v3 — AI 服务指示器',
    author: 'YYC³ AI',
    linesAdded: 85,
    linesRemoved: 12,
  },
]

// ============================================
// Tree manipulation helpers
// ============================================

function cloneTree(tree: FileNode[]): FileNode[] {
  return tree.map(node => ({
    ...node,
    children: node.children ? cloneTree(node.children) : undefined,
  }))
}

function addNodeToTree(tree: FileNode[], parentPath: string, newNode: FileNode): FileNode[] {
  return tree.map(node => {
    if (node.path === parentPath && node.type === 'folder') {
      return {
        ...node,
        modifiedAt: Date.now(),
        children: [...(node.children || []), newNode].sort((a, b) => {
          if (a.type !== b.type) {return a.type === 'folder' ? -1 : 1}
          return a.name.localeCompare(b.name)
        }),
      }
    }
    if (node.children) {
      return { ...node, children: addNodeToTree(node.children, parentPath, newNode) }
    }
    return node
  })
}

function removeNodeFromTree(tree: FileNode[], targetPath: string): FileNode[] {
  return tree
    .filter(node => node.path !== targetPath)
    .map(node => {
      if (node.children) {
        return { ...node, children: removeNodeFromTree(node.children, targetPath) }
      }
      return node
    })
}

function renameNodeInTree(tree: FileNode[], oldPath: string, newName: string): FileNode[] {
  return tree.map(node => {
    if (node.path === oldPath) {
      const parts = oldPath.split('/')
      parts[parts.length - 1] = newName
      const newPath = parts.join('/')
      return {
        ...node,
        name: newName,
        path: newPath,
        modifiedAt: Date.now(),
        children: node.children ? updateChildPaths(node.children, oldPath, newPath) : undefined,
      }
    }
    if (node.children) {
      return { ...node, children: renameNodeInTree(node.children, oldPath, newName) }
    }
    return node
  })
}

function updateChildPaths(children: FileNode[], oldParent: string, newParent: string): FileNode[] {
  return children.map(child => {
    const newPath = child.path.replace(oldParent, newParent)
    return {
      ...child,
      path: newPath,
      children: child.children ? updateChildPaths(child.children, oldParent, newParent) : undefined,
    }
  })
}

function moveNodeInTree(tree: FileNode[], sourcePath: string, targetParentPath: string): FileNode[] {
  let sourceNode: FileNode | null = null
  function findNode(nodes: FileNode[]): void {
    for (const n of nodes) {
      if (n.path === sourcePath) { sourceNode = { ...n }; return }
      if (n.children) {findNode(n.children)}
    }
  }
  findNode(tree)
  if (!sourceNode) {return tree}

  let result = removeNodeFromTree(tree, sourcePath)
  const newPath = targetParentPath + '/' + (sourceNode as FileNode).name
  const updatedNode: FileNode = { ...(sourceNode as FileNode), path: newPath, modifiedAt: Date.now() }
  result = addNodeToTree(result, targetParentPath, updatedNode)
  return result
}

/** Find a node by path */
function findNodeByPath(tree: FileNode[], path: string): FileNode | null {
  for (const node of tree) {
    if (node.path === path) {return node}
    if (node.children) {
      const found = findNodeByPath(node.children, path)
      if (found) {return found}
    }
  }
  return null
}

/** Count total files in tree */
function countFiles(tree: FileNode[]): number {
  let count = 0
  for (const node of tree) {
    if (node.type === 'file') {count++}
    if (node.children) {count += countFiles(node.children)}
  }
  return count
}

/** Get total size of all files */
function totalSize(tree: FileNode[]): number {
  let size = 0
  for (const node of tree) {
    if (node.type === 'file' && node.size) {size += node.size}
    if (node.children) {size += totalSize(node.children)}
  }
  return size
}

/** Compute simple line-level diff stats */
function computeDiffStats(oldContent: string, newContent: string): { added: number; removed: number } {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const oldSet = new Set(oldLines)
  const newSet = new Set(newLines)
  let added = 0
  let removed = 0
  for (const line of newLines) {
    if (!oldSet.has(line)) {added++}
  }
  for (const line of oldLines) {
    if (!newSet.has(line)) {removed++}
  }
  return { added, removed }
}

/** Mark a folder node as loading */
function markNodeLoading(tree: FileNode[], targetPath: string): FileNode[] {
  return tree.map(node => {
    if (node.path === targetPath) {
      return { ...node, loading: true }
    }
    if (node.children) {
      return { ...node, children: markNodeLoading(node.children, targetPath) }
    }
    return node
  })
}

/** Update a node's properties in the tree */
function updateNodeInTree(tree: FileNode[], targetPath: string, updates: Partial<FileNode>): FileNode[] {
  return tree.map(node => {
    if (node.path === targetPath) {
      return { ...node, ...updates }
    }
    if (node.children) {
      return { ...node, children: updateNodeInTree(node.children, targetPath, updates) }
    }
    return node
  })
}

// ============================================
// Storage — removed: now handled by zustand persist middleware
// ============================================

function getLanguageFromPath(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) {return 'typescript'}
  if (path.endsWith('.jsx') || path.endsWith('.js')) {return 'javascript'}
  if (path.endsWith('.css')) {return 'css'}
  if (path.endsWith('.json')) {return 'json'}
  if (path.endsWith('.md')) {return 'markdown'}
  if (path.endsWith('.html')) {return 'html'}
  return 'text'
}

// ============================================
// Store
// ============================================

interface FileTreeStoreState {
  fileTree: FileNode[]
  versions: FileVersion[]
  diff: DiffState
  recentFiles: RecentFileEntry[]
  workspace: WorkspaceConfig

  // Context menu state
  contextMenu: { x: number; y: number; path: string; type: 'file' | 'folder' } | null

  // Workspace
  setWorkspace: (ws: Partial<WorkspaceConfig>) => void

  // File operations
  createFile: (parentPath: string, fileName: string) => void
  createFolder: (parentPath: string, folderName: string) => void
  deleteNode: (path: string) => void
  renameNode: (path: string, newName: string) => void
  moveNode: (sourcePath: string, targetParentPath: string) => void
  duplicateFile: (path: string) => void
  resetTree: () => void

  // Lazy loading
  loadChildren: (folderPath: string) => Promise<void>
  ensureChildrenLoaded: (folderPath: string) => Promise<void>

  // Version control
  saveVersion: (path: string, content: string, label?: string, author?: string) => void
  getVersions: (path: string) => FileVersion[]
  rollbackVersion: (path: string, versionId: string) => string | null
  deleteVersion: (versionId: string) => void
  clearVersions: (path: string) => void

  // Diff view
  openDiff: (leftPath: string, rightPath: string, leftContent: string, rightContent: string) => void
  closeDiff: () => void

  // Recent files
  addRecentFile: (path: string) => void
  removeRecentFile: (path: string) => void
  clearRecentFiles: () => void

  // Context menu
  openContextMenu: (x: number, y: number, path: string, type: 'file' | 'folder') => void
  closeContextMenu: () => void

  // Derived queries
  getFileNode: (path: string) => FileNode | null
  getFileCount: () => number
  getTotalSize: () => number
  getVersionCount: (path: string) => number
}

export const useFileTreeStore = create<FileTreeStoreState>()(persist(
  (set, get) => ({
    fileTree: cloneTree(DEFAULT_FILE_TREE),
    versions: [...INITIAL_VERSIONS],
    diff: { enabled: false, leftPath: null, rightPath: null, leftContent: '', rightContent: '' },
    recentFiles: [],
    workspace: { rootPath: '~/Documents/YYC3-AI-Code', name: 'YYC³ AI Code', createdAt: Date.now() - 86400000 },
    contextMenu: null,

    // ── Workspace ──

    setWorkspace: (updates) => {
      set((s) => {
        const ws = { ...s.workspace, ...updates }
        log.info('Workspace updated', ws)
        return { workspace: ws }
      })
    },

    // ── File operations ──

    createFile: (parentPath, fileName) => {
      const path = parentPath + '/' + fileName
      const newNode: FileNode = { name: fileName, path, type: 'file', size: 0, createdAt: Date.now(), modifiedAt: Date.now() }
      set((s) => {
        const updated = addNodeToTree(s.fileTree, parentPath, newNode)
        log.info('File created', { path })
        return { fileTree: updated }
      })
    },

    createFolder: (parentPath, folderName) => {
      const path = parentPath + '/' + folderName
      const newNode: FileNode = { name: folderName, path, type: 'folder', children: [], createdAt: Date.now(), modifiedAt: Date.now() }
      set((s) => {
        const updated = addNodeToTree(s.fileTree, parentPath, newNode)
        log.info('Folder created', { path })
        return { fileTree: updated }
      })
    },

    deleteNode: (path) => {
      set((s) => {
        const updated = removeNodeFromTree(s.fileTree, path)
        const recentFiles = s.recentFiles.filter(r => r.path !== path)
        log.info('Node deleted', { path })
        return { fileTree: updated, recentFiles }
      })
    },

    renameNode: (path, newName) => {
      set((s) => {
        const updated = renameNodeInTree(s.fileTree, path, newName)
        log.info('Node renamed', { path, newName })
        return { fileTree: updated }
      })
    },

    moveNode: (sourcePath, targetParentPath) => {
      set((s) => {
        const updated = moveNodeInTree(s.fileTree, sourcePath, targetParentPath)
        log.info('Node moved', { sourcePath, targetParentPath })
        return { fileTree: updated }
      })
    },

    duplicateFile: (path) => {
      const node = findNodeByPath(get().fileTree, path)
      if (!node || node.type !== 'file') {return}
      const parentPath = path.substring(0, path.lastIndexOf('/'))
      const ext = node.name.includes('.') ? '.' + node.name.split('.').pop() : ''
      const baseName = node.name.replace(ext, '')
      const newName = `${baseName}-copy${ext}`
      const newNode: FileNode = { name: newName, path: parentPath + '/' + newName, type: 'file', size: node.size || 0, createdAt: Date.now(), modifiedAt: Date.now() }
      set((s) => {
        const updated = addNodeToTree(s.fileTree, parentPath, newNode)
        log.info('File duplicated', { from: path, to: newNode.path })
        return { fileTree: updated }
      })
    },

    resetTree: () => {
      const tree = cloneTree(DEFAULT_FILE_TREE)
      set({ fileTree: tree })
      log.info('File tree reset to default')
    },

    // ── Lazy loading ──

    loadChildren: async (folderPath) => {
      const tree = get().fileTree
      const node = findNodeByPath(tree, folderPath)
      if (!node || node.type !== 'folder') {return}
      if (node.loaded) {return}

      set((s) => ({
        fileTree: markNodeLoading(s.fileTree, folderPath),
      }))

      await new Promise((r) => setTimeout(r, 80 + Math.random() * 120))

      const children = node.children || []
      set((s) => ({
        fileTree: updateNodeInTree(s.fileTree, folderPath, {
          children,
          loaded: true,
          loading: false,
        }),
      }))
      log.info('Folder children loaded', { path: folderPath, count: children.length })
    },

    ensureChildrenLoaded: async (folderPath) => {
      const node = findNodeByPath(get().fileTree, folderPath)
      if (!node || node.type !== 'folder') {return}
      if (node.loaded) {return}
      await get().loadChildren(folderPath)
    },

    // ── Version control ──

    saveVersion: (path, content, label, author) => {
      const existing = get().versions.filter(v => v.path === path)
      const lastVersion = existing.length > 0 ? existing.sort((a, b) => b.timestamp - a.timestamp)[0] : null
      const diffStats = lastVersion ? computeDiffStats(lastVersion.content, content) : { added: content.split('\n').length, removed: 0 }
      const version: FileVersion = {
        id: crypto.randomUUID(), path, content, timestamp: Date.now(),
        label: label || `v${existing.length + 1}`, author: author || '你',
        linesAdded: diffStats.added, linesRemoved: diffStats.removed,
      }
      set((s) => {
        const updated = [...s.versions, version].slice(-500)
        log.info('Version saved', { path, label: version.label, added: diffStats.added, removed: diffStats.removed })
        return { versions: updated }
      })
    },

    getVersions: (path) => get().versions.filter(v => v.path === path).sort((a, b) => b.timestamp - a.timestamp),

    rollbackVersion: (path, versionId) => {
      const version = get().versions.find(v => v.id === versionId && v.path === path)
      if (version) { log.info('Rollback to version', { path, versionId, label: version.label }); return version.content }
      return null
    },

    deleteVersion: (versionId) => {
      set((s) => ({ versions: s.versions.filter(v => v.id !== versionId) }))
    },

    clearVersions: (path) => {
      set((s) => {
        const updated = s.versions.filter(v => v.path !== path)
        log.info('Versions cleared', { path })
        return { versions: updated }
      })
    },

    // ── Diff view ──

    openDiff: (leftPath, rightPath, leftContent, rightContent) => {
      set({ diff: { enabled: true, leftPath, rightPath, leftContent, rightContent } })
      log.info('Diff view opened', { leftPath, rightPath })
    },

    closeDiff: () => {
      set({ diff: { enabled: false, leftPath: null, rightPath: null, leftContent: '', rightContent: '' } })
    },

    // ── Recent files ──

    addRecentFile: (path) => {
      const name = path.split('/').pop() || path
      const entry: RecentFileEntry = { path, name, openedAt: Date.now(), language: getLanguageFromPath(path) }
      set((s) => {
        const filtered = s.recentFiles.filter(r => r.path !== path)
        return { recentFiles: [entry, ...filtered].slice(0, 20) }
      })
    },

    removeRecentFile: (path) => {
      set((s) => ({ recentFiles: s.recentFiles.filter(r => r.path !== path) }))
    },

    clearRecentFiles: () => set({ recentFiles: [] }),

    // ── Context menu ──

    openContextMenu: (x, y, path, type) => set({ contextMenu: { x, y, path, type } }),
    closeContextMenu: () => set({ contextMenu: null }),

    // ── Derived queries ──

    getFileNode: (path) => findNodeByPath(get().fileTree, path),
    getFileCount: () => countFiles(get().fileTree),
    getTotalSize: () => totalSize(get().fileTree),
    getVersionCount: (path) => get().versions.filter(v => v.path === path).length,
  }),
  {
    name: 'yyc3_file_tree_store',
    partialize: (state) => ({
      fileTree: state.fileTree,
      versions: state.versions,
      recentFiles: state.recentFiles,
      workspace: state.workspace,
    }),
    merge: (persisted: any, current) => {
      if (!persisted) {return current}
      return {
        ...current,
        fileTree: persisted.fileTree?.length ? persisted.fileTree : current.fileTree,
        versions: persisted.versions?.length ? persisted.versions : current.versions,
        recentFiles: persisted.recentFiles || current.recentFiles,
        workspace: persisted.workspace || current.workspace,
      }
    },
  }
))