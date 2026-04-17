/**
 * @file HomePage.tsx
 * @description YYC³ AI Code 首页 — 品牌标识 · 智能编程 AI 聊天框 · 项目快速访问 · 智能路由决策
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-10
 * @updated 2026-03-13
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags homepage, brand, chat, routing, a11y
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAppStore, type ProjectItem } from '../stores/app-store'
import { useThemeStore } from '../stores/theme-store'
import {
  Send,
  ImagePlus,
  FileUp,
  Github,
  Figma,
  Code2,
  ClipboardPaste,
  Plus,
  Clock,
  Zap,
  Bot,
  Settings2,
  Palette,
  Layers,
  Loader2,
  Trash2,
  FolderOpen,
  Pencil,
  MoreHorizontal,
  Keyboard,
  X,
  PlusCircle,
  Archive,
  Bell,
  Settings,
  LogOut,
  User,
  ExternalLink,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { ModelSettings } from './designer/ModelSettings'
import { IntentService } from '../services/intent-service'
import { createLogger } from '../utils/logger'
import { useLiquidGlass } from '../utils/liquid-glass'
import { toast } from 'sonner'
import { CreateProjectDialog } from './designer/CreateProjectDialog'
import { useI18n } from '../utils/useI18n'
import logoImage from '/yyc3-white.png'

const log = createLogger('HomePage')

/* ================================================================
   Constants
   ================================================================ */

interface ToolbarMenuItem {
  id: string
  icon: React.ElementType
  labelKey: string
  desc: string
  shortcut: string
  shortcutMac: string
}

const TOOLBAR_MENU_ITEMS: ToolbarMenuItem[] = [
  { id: 'image-upload', icon: ImagePlus, labelKey: 'toolbar.imageUpload', desc: 'PNG, JPG, GIF, SVG', shortcut: 'Ctrl+U', shortcutMac: 'Cmd+U' },
  { id: 'file-import', icon: FileUp, labelKey: 'toolbar.fileImport', desc: 'Multi-file', shortcut: 'Ctrl+O', shortcutMac: 'Cmd+O' },
  { id: 'github-link', icon: Github, labelKey: 'toolbar.githubLink', desc: 'Repo URL', shortcut: 'Ctrl+G', shortcutMac: 'Cmd+G' },
  { id: 'figma-file', icon: Figma, labelKey: 'toolbar.figmaFile', desc: '.fig', shortcut: 'Ctrl+F', shortcutMac: 'Cmd+F' },
  { id: 'code-snippet', icon: Code2, labelKey: 'toolbar.codeSnippet', desc: 'Multi-lang', shortcut: 'Ctrl+I', shortcutMac: 'Cmd+I' },
  { id: 'clipboard', icon: ClipboardPaste, labelKey: 'toolbar.clipboard', desc: 'Any content', shortcut: 'Ctrl+Shift+V', shortcutMac: 'Cmd+Shift+V' },
]

const STATUS_MAP: Record<string, { labelKey: string; color: string; bg: string }> = {
  active: { labelKey: 'status.active', color: 'text-emerald-400', bg: 'bg-emerald-400' },
  draft: { labelKey: 'status.draft', color: 'text-amber-400', bg: 'bg-amber-400' },
  archived: { labelKey: 'status.archived', color: 'text-white/30', bg: 'bg-white/30' },
}

const QUICK_PROMPT_KEYS = [
  'quickPrompt.dashboard',
  'quickPrompt.loginPage',
  'quickPrompt.kanban',
  'quickPrompt.chart',
] as const

/* ================================================================
   Accessibility Helper
   ================================================================ */

function announceToScreenReader(message: string) {
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'polite')
  el.setAttribute('aria-atomic', 'true')
  el.className = 'sr-only'
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => document.body.removeChild(el), 1000)
}

/* ================================================================
   Sub-Components
   ================================================================ */

/** Project context menu */
function ProjectContextMenu({
  project,
  position,
  onClose,
  onOpen,
  onRename,
  onDelete,
}: {
  project: ProjectItem
  position: { x: number; y: number }
  onClose: () => void
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {onClose()}
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const actions = [
    { icon: FolderOpen, label: t('projects.openProject', 'home'), action: onOpen },
    { icon: Pencil, label: t('projects.rename', 'home'), action: onRename },
    { icon: Archive, label: t('projects.archive', 'home'), action: () => { toast(t('projects.archiveSuccess', 'home')); onClose() } },
    { icon: Trash2, label: t('projects.delete', 'home'), action: onDelete, danger: true },
  ]

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[100] rounded-xl border border-white/[0.08] shadow-2xl py-1.5 min-w-[160px]"
      style={{ top: position.y, left: position.x, background: 'rgba(18,18,30,0.95)', backdropFilter: 'blur(16px)' }}
      role="menu"
      aria-label={`${project.name} ${t('projects.contextMenu', 'home')}`}
    >
      <div className="px-3 py-1.5 text-[10px] text-white/20 truncate border-b border-white/[0.06] mb-1">
        {project.name}
      </div>
      {actions.map(a => (
        <button
          key={a.label}
          onClick={() => { a.action(); onClose() }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] transition-colors ${
            (a as any).danger
              ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06]'
              : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
          }`}
          role="menuitem"
        >
          <a.icon className="w-3.5 h-3.5" />
          {a.label}
        </button>
      ))}
    </motion.div>
  )
}

/** Keyboard shortcuts overlay */
function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
  const { t } = useI18n()
  const shortcuts = [
    { keys: isMac ? 'Option + I' : 'Alt + I', desc: t('shortcut.focusInput', 'home') },
    { keys: isMac ? 'Cmd + U' : 'Ctrl + U', desc: t('shortcut.uploadImage', 'home') },
    { keys: isMac ? 'Cmd + O' : 'Ctrl + O', desc: t('shortcut.importFile', 'home') },
    { keys: isMac ? 'Cmd + G' : 'Ctrl + G', desc: t('shortcut.githubLink', 'home') },
    { keys: isMac ? 'Cmd + Enter' : 'Ctrl + Enter', desc: t('shortcut.sendMessage', 'home') },
    { keys: isMac ? 'Cmd + Shift + N' : 'Ctrl + Shift + N', desc: t('shortcut.newProject', 'home') },
    { keys: isMac ? 'Cmd + L' : 'Ctrl + L', desc: t('shortcut.clearChat', 'home') },
    { keys: 'Escape', desc: t('shortcut.closePanel', 'home') },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/[0.08] p-6"
        style={{ background: 'rgba(14,14,24,0.96)', backdropFilter: 'blur(20px)' }}
        role="dialog"
        aria-label={t('header.keyboardShortcuts', 'home')}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-violet-400" />
            <span className="text-[14px] text-white/80">{t('header.keyboardShortcuts', 'home')}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors" aria-label={t('shortcut.close', 'home')}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1.5">
          {shortcuts.map(s => (
            <div key={s.desc} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
              <span className="text-[11px] text-white/45">{s.desc}</span>
              <kbd className="text-[10px] text-violet-400/70 bg-violet-500/[0.06] px-2 py-0.5 rounded border border-violet-500/10 font-mono">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ================================================================
   Main Component
   ================================================================ */

export function HomePage() {
  const navigate = useNavigate()
  const {
    projects, addMessage, messages,
    aiModels, activeModelId, openModelSettings,
    createProject, deleteProject, archiveProject, renameProject, setActiveProject,
  } = useAppStore()
  const { currentTheme, openCustomizer } = useThemeStore()
  const { t } = useI18n()

  const [inputValue, setInputValue] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ project: ProjectItem; x: number; y: number } | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const activeModel = aiModels.find(m => m.id === activeModelId)
  const branding = currentTheme.branding
  const glass = currentTheme.glass
  const {
    isLG, brandGradientClass, logoGlow, logoGlowLg,
    focusGlowClass, sendBtnClass, cardLiftClass, shimmerClass,
    aiIconColor, accentColor,
  } = useLiquidGlass()

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {setShowMenu(false)}
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {setShowUserMenu(false)}
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {setShowNotifications(false)}
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey

      // Alt+I → focus input
      if (e.altKey && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }
      // Ctrl+Shift+N → new project
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setShowCreateDialog(true)
        return
      }
      // Escape → close overlays
      if (e.key === 'Escape') {
        setShowMenu(false)
        setContextMenu(null)
        setShowShortcuts(false)
        setShowUserMenu(false)
        return
      }
      // ? → show shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        setShowShortcuts(prev => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Smart routing + submit
  const handleSubmit = useCallback(() => {
    const text = inputValue.trim()
    if (!text) {return}

    log.info('User submit', { text: text.slice(0, 50) })
    setIsSending(true)

    // Recognize intent using IntentService
    const intent = IntentService.recognizeIntent({
      type: 'text',
      content: text,
      metadata: { source: 'keyboard', timestamp: Date.now(), locale: 'zh-CN', sessionId: 'home' },
    })

    log.debug('Intent recognized', intent)

    addMessage({ role: 'user', content: text })
    setInputValue('')

    announceToScreenReader(`${t('chat.messageSent', 'home')}: ${text.slice(0, 30)}`)

    // Smart route — always goes to designer but carries intent context
    setTimeout(() => {
      setIsSending(false)
      navigate('/designer')
    }, 200)
  }, [inputValue, addMessage, navigate, t])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter (no shift) or Ctrl+Enter → submit
    if (e.key === 'Enter' && (!e.shiftKey || e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleMenuAction = useCallback((item: ToolbarMenuItem) => {
    setShowMenu(false)
    const label = t(item.labelKey, 'home')
    toast(`${label} — ${t('chat.featureInDev', 'home')}`)
    announceToScreenReader(`${t('chat.selected', 'home')}: ${label}`)
    log.info('Toolbar action', { id: item.id })
  }, [t])

  const handleProjectContextMenu = useCallback((e: React.MouseEvent, project: ProjectItem) => {
    e.preventDefault()
    setContextMenu({ project, x: e.clientX, y: e.clientY })
  }, [])

  // Branding styles
  const bgStyle: React.CSSProperties = {
    background: branding.backgroundType === 'gradient'
      ? branding.backgroundGradient
      : branding.backgroundColor || '#0a0a0f',
  }

  const glassStyle: React.CSSProperties = glass.enabled
    ? {
        background: `rgba(255,255,255,${glass.opacity / 100})`,
        backdropFilter: `blur(${glass.blur}px) saturate(${glass.saturation}%)`,
        WebkitBackdropFilter: `blur(${glass.blur}px) saturate(${glass.saturation}%)`,
        borderColor: `rgba(255,255,255,${glass.borderOpacity / 100})`,
      }
    : {}

  const cardGlass: React.CSSProperties = glass.enabled
    ? {
        background: `rgba(255,255,255,${Math.max(glass.opacity / 200, 0.02)})`,
        backdropFilter: `blur(${Math.max(glass.blur / 2, 4)}px)`,
        borderColor: `rgba(255,255,255,${glass.borderOpacity / 200})`,
      }
    : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }

  const menuBg: React.CSSProperties = glass.enabled
    ? {
        background: `rgba(26,26,46,${Math.max(glass.opacity / 100, 0.85)})`,
        backdropFilter: `blur(${glass.blur}px)`,
        borderColor: `rgba(255,255,255,${glass.borderOpacity / 100})`,
      }
    : { background: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)' }

  return (
    <div className="min-h-screen text-white flex flex-col" style={bgStyle} data-testid="home-page">
      {/* ───── Header ───── */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4" role="banner">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center justify-center overflow-hidden"
            style={{
              width: Math.min(branding.logoSize, 36) + 4,
              height: Math.min(branding.logoSize, 36) + 4,
              borderRadius: branding.logoRadius,
              opacity: branding.logoOpacity / 100,
            }}
          >
            <img
              src={branding.logoUrl || logoImage}
              alt="YYC³ Logo"
              className={`object-contain ${logoGlow}`}
              loading="eager"
              decoding="async"
              style={{
                width: Math.min(branding.logoSize, 36),
                height: Math.min(branding.logoSize, 36),
              }}
            />
          </div>
          <span className="text-lg tracking-tight text-white/90 hidden sm:inline">
            {branding.appName}
          </span>
        </div>

        <nav className="flex items-center gap-1 sm:gap-1.5 flex-wrap" role="navigation" aria-label={t('header.globalNav', 'home')}>
          <button
            type="button"
            onClick={() => { setShowShortcuts(true); toast.info(t('header.keyboardShortcuts', 'home')) }}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
            title={`${t('header.keyboardShortcuts', 'home')} (?)`}
            aria-label={t('header.keyboardShortcuts', 'home')}
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { openCustomizer(); toast.info(t('header.themeCustomize', 'home')) }}
            className="p-2 rounded-lg hover:bg-white/10 text-pink-400/60 hover:text-pink-400 transition-colors cursor-pointer"
            title={t('header.themeCustomize', 'home')}
            aria-label={t('header.themeCustomize', 'home')}
          >
            <Palette className="w-4 h-4" />
          </button>
          {/* Notification Bell + Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/25 hover:text-white/50 transition-colors relative"
              title={t('header.notifications', 'home')}
              aria-label={t('header.notifications', 'home')}
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/[0.08] shadow-2xl z-[100] overflow-hidden"
                  style={{ background: 'rgba(14,14,26,0.97)', backdropFilter: 'blur(20px)' }}
                  role="region"
                  aria-label={t('header.notifications', 'home')}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-[12px] text-white/70">{t('header.notifications', 'home')}</span>
                      <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded-full">5</span>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Notification items */}
                  <div className="max-h-80 overflow-y-auto">
                    {[
                      { id: 'n1', icon: CheckCircle2, iconColor: 'text-emerald-400', title: 'Sprint 2 completed', desc: 'All 6 features deployed successfully', time: '2m ago', unread: true },
                      { id: 'n2', icon: Sparkles, iconColor: 'text-violet-400', title: 'AI model updated', desc: 'Qwen3-Max activated as primary model', time: '15m ago', unread: true },
                      { id: 'n3', icon: AlertCircle, iconColor: 'text-amber-400', title: 'API rate limit warning', desc: 'DashScope usage at 85% of daily quota', time: '1h ago', unread: true },
                      { id: 'n4', icon: Info, iconColor: 'text-cyan-400', title: 'New i18n coverage', desc: '12 components migrated to i18n system', time: '3h ago', unread: false },
                      { id: 'n5', icon: CheckCircle2, iconColor: 'text-emerald-400', title: 'Backup exported', desc: 'Full project backup saved to downloads', time: '1d ago', unread: false },
                    ].map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => { setShowNotifications(false); toast(notif.title) }}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] ${notif.unread ? 'bg-white/[0.01]' : ''}`}
                      >
                        <notif.icon className={`w-4 h-4 ${notif.iconColor} shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] ${notif.unread ? 'text-white/80' : 'text-white/50'}`}>{notif.title}</span>
                            {notif.unread && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-white/25 mt-0.5 truncate">{notif.desc}</div>
                        </div>
                        <span className="text-[9px] text-white/15 shrink-0">{notif.time}</span>
                      </button>
                    ))}
                  </div>
                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06]">
                    <button
                      onClick={() => { setShowNotifications(false); toast.success('All marked as read') }}
                      className="text-[10px] text-white/25 hover:text-white/50 transition-colors"
                    >
                      Mark all as read
                    </button>
                    <button
                      onClick={() => { setShowNotifications(false); navigate('/designer') }}
                      className={`text-[10px] ${isLG ? 'text-emerald-400/60 hover:text-emerald-400' : 'text-violet-400/60 hover:text-violet-400'} transition-colors`}
                    >
                      View all
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={() => { openModelSettings(); toast.info(t('header.settings', 'home')) }}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
            title={t('header.settings', 'home')}
            aria-label={t('header.settings', 'home')}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => toast.info('GitHub: https://github.com — 沙箱环境无法打开外部链接')}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
            title={t('header.github', 'home')}
            aria-label={t('header.github', 'home')}
          >
            <Github className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { navigate('/devtools'); toast.info('DevTools') }}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
            title="DevTools"
            aria-label="DevTools"
          >
            <Wrench className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/architecture')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/50 hover:text-white/70 transition-colors cursor-pointer"
            title={t('header.architecture', 'home')}
            aria-label={t('header.architecture', 'home')}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('header.architecture', 'home')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
            title={t('header.settings', 'home')}
            aria-label={t('header.settings', 'home')}
          >
            <Settings className="w-4 h-4" />
          </button>
          {/* User Avatar + Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs cursor-pointer hover:ring-2 hover:ring-emerald-400/30 transition-all"
              aria-label={t('header.userMenu', 'home')}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              YY
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/[0.08] shadow-2xl py-1.5 z-[100]"
                  style={{ background: 'rgba(18,18,30,0.96)', backdropFilter: 'blur(16px)' }}
                  role="menu"
                  aria-label={t('header.userMenu', 'home')}
                >
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-b border-white/[0.06] mb-1">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src="/yyc3-logo-white.png" 
                        alt="YYC³ AI Logo" 
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[12px] text-white/80 truncate">YanYu User</div>
                        <div className="text-[10px] text-white/30 truncate">admin@0379.email</div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-auto" title={t('header.notifications', 'home')} />
                    </div>
                  </div>
                  {/* Menu items */}
                  {[
                    { icon: User, label: t('header.userProfile', 'home'), action: () => toast(t('header.featureInDev', 'home')) },
                    { icon: Settings, label: t('header.preferences', 'home'), action: () => toast(t('header.featureInDev', 'home')) },
                    { icon: Palette, label: t('header.themeCustomize', 'home'), action: () => { openCustomizer(); setShowUserMenu(false) } },
                    { icon: Keyboard, label: t('header.keyboardShortcuts', 'home'), action: () => { setShowShortcuts(true); setShowUserMenu(false) } },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setShowUserMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
                      role="menuitem"
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-white/[0.06] my-1" />
                  <button
                    onClick={() => { toast(t('header.featureInDev', 'home')); setShowUserMenu(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
                    role="menuitem"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {t('header.logout', 'home')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </header>

      {/* ───── Main Content ───── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 py-8" role="main">

        {/* Brand Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10 lg:mb-12 xl:mb-14"
          aria-label="品牌标识"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 sm:mb-8 lg:mb-10 flex items-center justify-center"
            style={{ 
              width: 'clamp(72px, 5vw, 120px)', 
              height: 'clamp(72px, 5vw, 120px)', 
              opacity: branding.logoOpacity / 100,
              maxWidth: 140,
              maxHeight: 140
            }}
          >
            <img
              src={branding.logoUrl || logoImage}
              alt="YYC³ Logo"
              className={`object-contain ${logoGlowLg}`}
              loading="eager"
              decoding="async"
              style={{ width: '100%', height: '100%' }}
            />
          </motion.div>
          <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl ${brandGradientClass} bg-clip-text text-transparent mb-3 sm:mb-4 font-bold tracking-tight`}>
            {branding.appName}
          </h1>
          <p className="text-white/40 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto" aria-label={t('projects.brandSlogan', 'home')}>
            {branding.sloganPrimary}
          </p>
          <p className="text-white/25 text-xs sm:text-sm mt-2 tracking-wide">
            {branding.sloganSecondary}
          </p>
        </motion.div>

        {/* ───── Smart AI Chat Box ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl"
        >
          <div
            className={`relative rounded-2xl border transition-colors ${focusGlowClass} ${shimmerClass}`}
            style={{
              ...(glass.enabled ? glassStyle : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }),
            }}
            role="form"
            aria-label="智能编程 AI 聊天框"
          >
            {/* Model Selector */}
            <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 sm:pt-4">
              <button
                onClick={openModelSettings}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs sm:text-sm text-white/60 transition-colors group"
                aria-label={t('chat.aiModelSettings', 'home')}
                aria-describedby="model-hint"
              >
                <Bot className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${aiIconColor}`} aria-hidden="true" />
                {activeModel ? activeModel.name : t('chat.selectModel', 'home')}
                <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/20 group-hover:text-white/50 transition-colors" aria-hidden="true" />
              </button>
              {!activeModel && (
                <span id="model-hint" className="text-[10px] text-amber-400/50">{t('chat.configModelHint', 'home')}</span>
              )}
            </div>

            {/* Text Area */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder', 'home')}
              className="w-full bg-transparent border-none outline-none resize-none px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-white/90 placeholder:text-white/25 min-h-[70px] sm:min-h-[80px] max-h-[180px] sm:max-h-[200px]"
              rows={2}
              aria-label={t('chat.inputLabel', 'home')}
              aria-describedby="chat-help"
            />
            <span id="chat-help" className="sr-only">
              {t('chat.inputHelp', 'home')}
            </span>

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-5 pb-3 sm:pb-4">
              {/* Toolbar left — Add menu */}
              <div className="flex items-center gap-1" ref={menuRef} role="toolbar" aria-label={t('chat.toolbar', 'home')}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 sm:p-2.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                  aria-label={t('chat.add', 'home')}
                  aria-expanded={showMenu}
                  aria-haspopup="true"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-16 left-3 rounded-xl shadow-2xl py-2 z-50 min-w-[240px] border"
                      style={menuBg}
                      role="menu"
                      aria-label={t('chat.multiMenu', 'home')}
                    >
                      {TOOLBAR_MENU_ITEMS.map((item) => {
                        const label = t(item.labelKey, 'home')
                        return (
                        <button
                          key={item.id}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group"
                          onClick={() => handleMenuAction(item)}
                          role="menuitem"
                          aria-label={label}
                        >
                          <item.icon className={`w-4 h-4 text-white/40 group-hover:${isLG ? 'text-emerald-400' : 'text-violet-400'} transition-colors`} aria-hidden="true" />
                          <div className="text-left flex-1 min-w-0">
                            <div className="text-[12px] text-white/70 group-hover:text-white/90 transition-colors">{label}</div>
                            <div className="text-[10px] text-white/25">{item.desc}</div>
                          </div>
                          <kbd className="text-[9px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono shrink-0 group-hover:text-white/30 transition-colors">
                            {item.shortcut}
                          </kbd>
                        </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Toolbar right — send */}
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isSending}
                className={`p-2 rounded-lg ${sendBtnClass} disabled:text-white/20 text-white transition-colors`}
                aria-label={t('chat.send', 'home')}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center" role="list" aria-label={t('quickPrompts.label', 'home')}>
            {QUICK_PROMPT_KEYS.map((key, index) => {
              const promptText = t(key, 'home')
              return (
              <button
                key={key}
                onClick={() => { setInputValue(promptText); inputRef.current?.focus() }}
                className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
                role="listitem"
              >
                <Zap className="w-3 h-3 inline mr-1 -mt-0.5" aria-hidden="true" />
                {promptText}
              </button>
              )
            })}
          </div>
        </motion.div>

        {/* ───── Recent Projects ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mt-10 sm:mt-12 lg:mt-14 xl:mt-16"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-sm sm:text-base text-white/40 flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              {t('recentProjects', 'home')}
            </h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className={`flex items-center gap-1 text-xs sm:text-sm ${isLG ? 'text-emerald-400/50 hover:text-emerald-400' : 'text-violet-400/50 hover:text-violet-400'} transition-colors`}
                onClick={() => setShowCreateDialog(true)}
                aria-label={t('newProject', 'home')}
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                {t('projects.new', 'home')}
              </button>
              <button
                className="text-xs sm:text-sm text-white/30 hover:text-white/60 transition-colors"
                onClick={() => toast(t('header.featureInDev', 'home'))}
                aria-label={t('projects.viewAll', 'home')}
              >
                {t('projects.viewAll', 'home')} →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4" role="list" aria-label={t('projects.projectList', 'home')}>
            {projects.map((project) => {
              const status = STATUS_MAP[project.status] || STATUS_MAP.active
              return (
                <motion.button
                  key={project.id}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  onClick={() => { setActiveProject(project.id); navigate('/designer') }}
                  onContextMenu={(e) => handleProjectContextMenu(e, project)}
                  className={`group text-left p-4 sm:p-5 rounded-xl border transition-all hover:border-white/[0.15] focus:outline-none focus:ring-1 ${isLG ? 'focus:ring-emerald-500/30' : 'focus:ring-violet-500/30'} ${cardLiftClass}`}
                  style={cardGlass}
                  role="listitem"
                  aria-label={`${project.name} — ${project.description} — ${project.updatedAt}`}
                >
                  {/* Thumbnail */}
                  <div className="w-full h-20 sm:h-24 lg:h-28 rounded-lg bg-gradient-to-br from-white/[0.03] to-white/[0.01] mb-3 sm:mb-4 flex items-center justify-center relative overflow-hidden">
                    <Code2 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white/10 group-hover:text-white/20 transition-colors" aria-hidden="true" />
                    {/* Hover action hint */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                      <span className="text-[10px] sm:text-xs text-white/60">{t('projects.open', 'home')}</span>
                    </div>
                  </div>
                  {/* Project name — inline rename or display */}
                  {renamingProjectId === project.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => {
                        if (renameValue.trim()) {renameProject(project.id, renameValue.trim())}
                        setRenamingProjectId(null)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (renameValue.trim()) {renameProject(project.id, renameValue.trim())}
                          setRenamingProjectId(null)
                        }
                        if (e.key === 'Escape') {setRenamingProjectId(null)}
                        e.stopPropagation()
                      }}
                      onClick={e => e.stopPropagation()}
                      className="text-sm sm:text-base text-white/80 bg-white/[0.06] border border-white/[0.15] rounded px-1.5 py-0.5 outline-none w-full"
                    />
                  ) : (
                    <h3 className="text-sm sm:text-base text-white/80 truncate">{project.name}</h3>
                  )}
                  <p className="text-xs sm:text-sm text-white/30 mt-1 sm:mt-1.5 truncate">{project.description}</p>
                  <div className="flex items-center justify-between mt-3 sm:mt-4">
                    <span className="text-[10px] sm:text-xs text-white/20">{project.updatedAt}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] ${status.color}`}>{t(status.labelKey, 'home')}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.bg}`} />
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </main>

      {/* ───── Footer ───── */}
      <footer className="text-center py-5 sm:py-6 lg:py-8 px-4 text-xs sm:text-sm text-white/15 select-none" role="contentinfo">
        <div className="leading-relaxed tracking-wide">YanYuCloudCube · 万象归元于云枢 | 深栈智启新纪元</div>
        <div className="mt-2 sm:mt-2.5 text-white/[0.08] hidden sm:block leading-relaxed tracking-wider">
          All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
        </div>
        <div className="mt-1.5 sm:mt-2 text-white/[0.06]">
          Press <kbd className="text-white/15 bg-white/[0.04] px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono border border-white/[0.06]" aria-label="question-mark">?</kbd> for keyboard shortcuts
        </div>
      </footer>

      {/* ───── Overlays ───── */}
      <ModelSettings />

      <AnimatePresence>
        {contextMenu && (
          <ProjectContextMenu
            project={contextMenu.project}
            position={{ x: contextMenu.x, y: contextMenu.y }}
            onClose={() => setContextMenu(null)}
            onOpen={() => { setActiveProject(contextMenu!.project.id); setContextMenu(null); navigate('/designer') }}
            onRename={() => {
              const p = contextMenu!.project
              setRenameValue(p.name)
              setRenamingProjectId(p.id)
              setContextMenu(null)
            }}
            onDelete={() => {
              const p = contextMenu!.project
              deleteProject(p.id)
              setContextMenu(null)
              toast.success(t('projects.deleteSuccess', 'home', { name: p.name }))
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
      </AnimatePresence>

      <CreateProjectDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={(id) => {
          toast.success(t('projects.createSuccess', 'home'))
          navigate('/designer')
        }}
      />
    </div>
  )
}