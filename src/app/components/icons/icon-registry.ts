/**
 * @file icon-registry.ts
 * @description YYC³ 图标系统注册表 — 统一管理所有图标的映射、分类、标签、快捷键
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @updated 2026-03-13
 * @status stable
 * @license MIT
 */

import {
  Home,
  FolderOpen,
  Bell,
  Settings,
  Github,
  Share2,
  Rocket,
  Zap,
  Globe,
  User,
  ChevronLeft,
  Eye,
  Code2,
  Columns2,
  Search,
  MoreHorizontal,
  Bot,
  MessageSquare,
  Settings2,
  Wrench,
  Terminal,
  PanelLeft,
  User2,
  FileText,
  Circle,
  Plus,
  ImagePlus,
  FileUp,
  Link,
  PenTool,
  Code,
  Clipboard,
  type LucideIcon,
} from 'lucide-react'

/* ================================================================
   Types
   ================================================================ */

export type IconSize = 16 | 20 | 24 | 32 | 48

export type IconState = 'default' | 'hover' | 'active' | 'disabled'

export type IconCategory =
  | 'navigation'
  | 'view-switch'
  | 'ai-function'
  | 'terminal'
  | 'user'
  | 'function-operation'

export interface IconEntry {
  /** Unique icon identifier */
  id: string
  /** Lucide React component */
  component: LucideIcon
  /** Chinese label */
  labelZh: string
  /** English label */
  labelEn: string
  /** Category for grouping */
  category: IconCategory
  /** Description of the icon's purpose */
  description?: string
  /** Associated keyboard shortcut (Windows/Linux) */
  shortcut?: string
  /** Associated keyboard shortcut (macOS) */
  shortcutMac?: string
  /** Hover tooltip Chinese */
  tooltipZh?: string
  /** Hover tooltip English */
  tooltipEn?: string
}

export interface IconThemeColors {
  default: string
  hover: string
  active: string
  disabled: string
}

/* ================================================================
   Theme Colors
   ================================================================ */

export const ICON_THEME_DARK: IconThemeColors = {
  default: 'text-white/40',
  hover: 'text-white/70',
  active: 'text-violet-400',
  disabled: 'text-white/15',
}

export const ICON_THEME_LIGHT: IconThemeColors = {
  default: 'text-gray-600',
  hover: 'text-gray-900',
  active: 'text-violet-600',
  disabled: 'text-gray-300',
}

/* ================================================================
   Size Mappings
   ================================================================ */

export const ICON_SIZE_CLASS: Record<IconSize, string> = {
  16: 'w-4 h-4',
  20: 'w-5 h-5',
  24: 'w-6 h-6',
  32: 'w-8 h-8',
  48: 'w-12 h-12',
}

/* ================================================================
   Icon Registry
   ================================================================ */

export const ICON_REGISTRY: Record<string, IconEntry> = {
  /* ── Navigation ───────────────────────── */
  home: {
    id: 'home',
    component: Home,
    labelZh: '首页',
    labelEn: 'Home',
    category: 'navigation',
    description: '返回首页',
    tooltipZh: '首页',
    tooltipEn: 'Home',
  },
  file: {
    id: 'file',
    component: FolderOpen,
    labelZh: '项目管理',
    labelEn: 'Projects',
    category: 'navigation',
    description: '项目列表、创建新项目、项目设置',
    shortcut: 'Ctrl+Shift+P',
    shortcutMac: 'Cmd+Shift+P',
    tooltipZh: '项目管理',
    tooltipEn: 'Projects',
  },
  notification: {
    id: 'notification',
    component: Bell,
    labelZh: '通知中心',
    labelEn: 'Notifications',
    category: 'navigation',
    description: '系统通知、更新提醒、消息中心',
    shortcut: 'Ctrl+Shift+N',
    shortcutMac: 'Cmd+Shift+N',
    tooltipZh: '通知中心',
    tooltipEn: 'Notifications',
  },
  settings: {
    id: 'settings',
    component: Settings,
    labelZh: '设置',
    labelEn: 'Settings',
    category: 'navigation',
    description: '全局设置、偏好配置、主题切换',
    shortcut: 'Ctrl+,',
    shortcutMac: 'Cmd+,',
    tooltipZh: '设置',
    tooltipEn: 'Settings',
  },
  github: {
    id: 'github',
    component: Github,
    labelZh: 'GitHub',
    labelEn: 'GitHub',
    category: 'navigation',
    description: '代码仓库、版本控制、协作功能',
    shortcut: 'Ctrl+Shift+G',
    shortcutMac: 'Cmd+Shift+G',
    tooltipZh: 'GitHub',
    tooltipEn: 'GitHub',
  },
  export: {
    id: 'export',
    component: Share2,
    labelZh: '分享',
    labelEn: 'Share',
    category: 'navigation',
    description: '项目分享、协作邀请、导出功能',
    shortcut: 'Ctrl+Shift+S',
    shortcutMac: 'Cmd+Shift+S',
    tooltipZh: '分享',
    tooltipEn: 'Share',
  },
  deploy: {
    id: 'deploy',
    component: Rocket,
    labelZh: '发布',
    labelEn: 'Deploy',
    category: 'navigation',
    description: '部署发布、版本管理、上线流程',
    shortcut: 'Ctrl+Shift+D',
    shortcutMac: 'Cmd+Shift+D',
    tooltipZh: '发布',
    tooltipEn: 'Deploy',
  },
  quickAction: {
    id: 'quickAction',
    component: Zap,
    labelZh: '快速操作',
    labelEn: 'Quick Actions',
    category: 'navigation',
    description: '快速操作菜单、常用功能',
    shortcut: 'Ctrl+Shift+Q',
    shortcutMac: 'Cmd+Shift+Q',
    tooltipZh: '快速操作',
    tooltipEn: 'Quick Actions',
  },
  language: {
    id: 'language',
    component: Globe,
    labelZh: '语言切换',
    labelEn: 'Language',
    category: 'navigation',
    description: '中/英文语言切换',
    shortcut: 'Ctrl+Shift+L',
    shortcutMac: 'Cmd+Shift+L',
    tooltipZh: '语言切换',
    tooltipEn: 'Language',
  },
  user: {
    id: 'user',
    component: User,
    labelZh: '用户',
    labelEn: 'User',
    category: 'navigation',
    description: '用户设置',
    tooltipZh: '用户',
    tooltipEn: 'User',
  },

  /* ── View Switch ──────────────────────── */
  back: {
    id: 'back',
    component: ChevronLeft,
    labelZh: '返回',
    labelEn: 'Back',
    category: 'view-switch',
    description: '返回上一级或主页',
    shortcut: 'Esc',
    shortcutMac: 'Esc',
    tooltipZh: '返回',
    tooltipEn: 'Back',
  },
  preview: {
    id: 'preview',
    component: Eye,
    labelZh: '预览',
    labelEn: 'Preview',
    category: 'view-switch',
    description: '切换至项目实时预览视图',
    shortcut: 'Ctrl+1',
    shortcutMac: 'Cmd+1',
    tooltipZh: '预览',
    tooltipEn: 'Preview',
  },
  code: {
    id: 'code',
    component: Code2,
    labelZh: '代码',
    labelEn: 'Code',
    category: 'view-switch',
    description: '切换至代码详情面板',
    shortcut: 'Ctrl+2',
    shortcutMac: 'Cmd+2',
    tooltipZh: '代码',
    tooltipEn: 'Code',
  },
  split: {
    id: 'split',
    component: Columns2,
    labelZh: '分屏',
    labelEn: 'Split',
    category: 'view-switch',
    description: '代码与预览分屏',
    shortcut: 'Ctrl+3',
    shortcutMac: 'Cmd+3',
    tooltipZh: '分屏',
    tooltipEn: 'Split',
  },
  search: {
    id: 'search',
    component: Search,
    labelZh: '搜索',
    labelEn: 'Search',
    category: 'view-switch',
    description: '全局搜索功能',
    shortcut: 'Ctrl+Shift+F',
    shortcutMac: 'Cmd+Shift+F',
    tooltipZh: '搜索',
    tooltipEn: 'Search',
  },
  more: {
    id: 'more',
    component: MoreHorizontal,
    labelZh: '更多',
    labelEn: 'More',
    category: 'view-switch',
    description: '扩展菜单、快捷操作、工具列表',
    shortcut: 'Ctrl+Shift+M',
    shortcutMac: 'Cmd+Shift+M',
    tooltipZh: '更多',
    tooltipEn: 'More',
  },

  /* ── AI Function ──────────────────────── */
  aiModel: {
    id: 'aiModel',
    component: Bot,
    labelZh: 'AI 模型',
    labelEn: 'AI Model',
    category: 'ai-function',
    description: 'AI 模型选择',
    tooltipZh: 'AI 模型',
    tooltipEn: 'AI Model',
  },
  aiChat: {
    id: 'aiChat',
    component: MessageSquare,
    labelZh: 'AI 对话',
    labelEn: 'AI Chat',
    category: 'ai-function',
    description: 'AI 对话界面',
    tooltipZh: 'AI 对话',
    tooltipEn: 'AI Chat',
  },
  aiSettings: {
    id: 'aiSettings',
    component: Wrench,
    labelZh: 'AI 设置',
    labelEn: 'AI Settings',
    category: 'ai-function',
    description: 'AI 参数设置',
    tooltipZh: 'AI 设置',
    tooltipEn: 'AI Settings',
  },
  aiConfig: {
    id: 'aiConfig',
    component: Settings2,
    labelZh: 'AI 配置',
    labelEn: 'AI Config',
    category: 'ai-function',
    description: 'AI 配置选项',
    tooltipZh: 'AI 配置',
    tooltipEn: 'AI Config',
  },

  /* ── Terminal ─────────────────────────── */
  terminal: {
    id: 'terminal',
    component: Terminal,
    labelZh: '终端',
    labelEn: 'Terminal',
    category: 'terminal',
    description: '打开终端',
    tooltipZh: '终端',
    tooltipEn: 'Terminal',
  },
  tab: {
    id: 'tab',
    component: PanelLeft,
    labelZh: '标签页',
    labelEn: 'Tab',
    category: 'terminal',
    description: '终端标签页',
    tooltipZh: '标签页',
    tooltipEn: 'Tab',
  },

  /* ── User ─────────────────────────────── */
  userAvatar: {
    id: 'userAvatar',
    component: User2,
    labelZh: '用户头像',
    labelEn: 'User Avatar',
    category: 'user',
    description: '显示用户头像',
    tooltipZh: '用户头像',
    tooltipEn: 'User Avatar',
  },
  userName: {
    id: 'userName',
    component: FileText,
    labelZh: '用户名称',
    labelEn: 'User Name',
    category: 'user',
    description: '显示当前用户名称',
    tooltipZh: '用户名称',
    tooltipEn: 'User Name',
  },
  onlineStatus: {
    id: 'onlineStatus',
    component: Circle,
    labelZh: '在线状态',
    labelEn: 'Online Status',
    category: 'user',
    description: '实时在线状态指示',
    tooltipZh: '在线状态',
    tooltipEn: 'Online Status',
  },
  preferences: {
    id: 'preferences',
    component: Settings,
    labelZh: '偏好设置',
    labelEn: 'Preferences',
    category: 'user',
    description: '快速访问用户偏好设置',
    tooltipZh: '偏好设置',
    tooltipEn: 'Preferences',
  },

  /* ── Function Operations ──────────────── */
  add: {
    id: 'add',
    component: Plus,
    labelZh: '添加',
    labelEn: 'Add',
    category: 'function-operation',
    description: '展开多功能菜单',
    shortcut: 'Ctrl+Shift+A',
    shortcutMac: 'Cmd+Shift+A',
    tooltipZh: '添加',
    tooltipEn: 'Add',
  },
  imageUpload: {
    id: 'imageUpload',
    component: ImagePlus,
    labelZh: '图片上传',
    labelEn: 'Image Upload',
    category: 'function-operation',
    description: '上传图片 (PNG, JPG, GIF, SVG)',
    shortcut: 'Ctrl+U',
    shortcutMac: 'Cmd+U',
    tooltipZh: '图片上传',
    tooltipEn: 'Image Upload',
  },
  fileImport: {
    id: 'fileImport',
    component: FileUp,
    labelZh: '文件导入',
    labelEn: 'File Import',
    category: 'function-operation',
    description: '导入文件（多文件支持）',
    shortcut: 'Ctrl+O',
    shortcutMac: 'Cmd+O',
    tooltipZh: '文件导入',
    tooltipEn: 'File Import',
  },
  githubLink: {
    id: 'githubLink',
    component: Link,
    labelZh: 'GitHub 链接',
    labelEn: 'GitHub Link',
    category: 'function-operation',
    description: '粘贴/输入仓库 URL',
    shortcut: 'Ctrl+G',
    shortcutMac: 'Cmd+G',
    tooltipZh: 'GitHub 链接',
    tooltipEn: 'GitHub Link',
  },
  figmaFile: {
    id: 'figmaFile',
    component: PenTool,
    labelZh: 'Figma 文件',
    labelEn: 'Figma File',
    category: 'function-operation',
    description: '导入 .fig 文件',
    shortcut: 'Ctrl+F',
    shortcutMac: 'Cmd+F',
    tooltipZh: 'Figma 文件',
    tooltipEn: 'Figma File',
  },
  codeSnippet: {
    id: 'codeSnippet',
    component: Code,
    labelZh: '代码片段',
    labelEn: 'Code Snippet',
    category: 'function-operation',
    description: '粘贴/输入多语言代码',
    shortcut: 'Ctrl+I',
    shortcutMac: 'Cmd+I',
    tooltipZh: '代码片段',
    tooltipEn: 'Code Snippet',
  },
  clipboard: {
    id: 'clipboard',
    component: Clipboard,
    labelZh: '剪贴板',
    labelEn: 'Clipboard',
    category: 'function-operation',
    description: '粘贴任意内容',
    shortcut: 'Ctrl+Shift+V',
    shortcutMac: 'Cmd+Shift+V',
    tooltipZh: '剪贴板',
    tooltipEn: 'Clipboard',
  },
}

/* ================================================================
   Helpers
   ================================================================ */

/** Get all icons in a category */
export function getIconsByCategory(category: IconCategory): IconEntry[] {
  return Object.values(ICON_REGISTRY).filter(e => e.category === category)
}

/** Get a single icon entry by ID */
export function getIcon(id: string): IconEntry | undefined {
  return ICON_REGISTRY[id]
}

/** Get label for an icon based on locale */
export function getIconLabel(id: string, locale: 'zh' | 'en' = 'zh'): string {
  const entry = ICON_REGISTRY[id]
  if (!entry) {return id}
  return locale === 'zh' ? entry.labelZh : entry.labelEn
}

/** Get tooltip for an icon based on locale */
export function getIconTooltip(id: string, locale: 'zh' | 'en' = 'zh'): string {
  const entry = ICON_REGISTRY[id]
  if (!entry) {return id}
  const label = locale === 'zh' ? (entry.tooltipZh || entry.labelZh) : (entry.tooltipEn || entry.labelEn)
  if (entry.shortcut) {
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
    const shortcut = isMac ? (entry.shortcutMac || entry.shortcut) : entry.shortcut
    return `${label} (${shortcut})`
  }
  return label
}

/** Get all categories with their icons */
export function getAllCategories(): { category: IconCategory; label: string; labelEn: string; icons: IconEntry[] }[] {
  return [
    { category: 'navigation', label: '导航图标', labelEn: 'Navigation', icons: getIconsByCategory('navigation') },
    { category: 'view-switch', label: '视图切换图标', labelEn: 'View Switch', icons: getIconsByCategory('view-switch') },
    { category: 'ai-function', label: 'AI 功能图标', labelEn: 'AI Functions', icons: getIconsByCategory('ai-function') },
    { category: 'terminal', label: '终端图标', labelEn: 'Terminal', icons: getIconsByCategory('terminal') },
    { category: 'user', label: '用户图标', labelEn: 'User', icons: getIconsByCategory('user') },
    { category: 'function-operation', label: '功能操作图标', labelEn: 'Function Operations', icons: getIconsByCategory('function-operation') },
  ]
}
