/**
 * @file SettingsPage.tsx
 * @description Complete settings page — account, general, agents, MCP, models,
 *   context, conversation flow, rules & skills with search, keybinding editor,
 *   MCP endpoint management, and rules injection preview
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings, keybindings, mcp, rules, agents, models
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  useSettingsStore,
  DEFAULT_KEYBINDINGS,
  type SettingsSectionId,
  type AgentConfig,
  type MCPConfig,
  type RuleConfig,
  type SkillConfig,
  type ModelConfig,
  type DocumentSet,
  type SearchResult,
} from '../stores/settings-store'
import { useThemeStore } from '../stores/theme-store'
import { useLiquidGlass } from '../utils/liquid-glass'
import { useI18n } from '../utils/useI18n'
import {
  ArrowLeft,
  Search,
  User,
  Settings,
  Bot,
  Plug,
  Cpu,
  FileText,
  MessageSquare,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  RotateCcw,
  Download,
  Upload,
  Keyboard,
  Eye,
  EyeOff,
  X,
  Check,
  Globe,
  Database,
  FolderOpen,
  Github,
  Copy,
  AlertCircle,
  Volume2,
  ListTodo,
  Shield,
  Play,
  Terminal,
  Bell,
  Zap,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { DataManagementPanel } from './designer/DataManagementPanel'

// ============================================
// Deep Search Results Panel
// ============================================

function SearchResultsPanel({ results, onSelect }: { results: SearchResult[]; onSelect: (r: SearchResult) => void }) {
  const { t } = useI18n()
  const typeIcons: Record<string, typeof User> = { setting: Settings, agent: Bot, mcp: Plug, model: Cpu, rule: BookOpen, skill: Sparkles }

  if (results.length === 0) {return null}

  return (
    <div className="bg-white/[0.02] rounded-lg border border-emerald-500/10 mb-4 max-h-[280px] overflow-y-auto">
      <div className="px-3 py-2 text-[10px] text-emerald-400/60 border-b border-white/[0.04]">
        {results.length} {t('page.searchResults', 'settings')}
      </div>
      {results.map((r, i) => {
        const Icon = typeIcons[r.type] || Settings
        return (
          <button
            key={`${r.path}-${i}`}
            onClick={() => onSelect(r)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors border-b border-white/[0.02] last:border-b-0"
          >
            <Icon className="w-3 h-3 text-white/20 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-white/60 truncate">{r.title}</div>
              {r.description && <div className="text-[9px] text-white/25 truncate">{r.description}</div>}
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25 shrink-0">{r.section}</span>
          </button>
        )
      })}
    </div>
  )
}

// ============================================
// Section Navigation Config
// ============================================

interface SectionDef {
  id: SettingsSectionId
  labelKey: string
  icon: typeof User
  descKey: string
}

const SECTIONS: SectionDef[] = [
  { id: 'account', labelKey: 'page.account', icon: User, descKey: 'page.accountDesc' },
  { id: 'general', labelKey: 'page.general', icon: Settings, descKey: 'page.generalDesc' },
  { id: 'agents', labelKey: 'page.agents', icon: Bot, descKey: 'page.agentsDesc' },
  { id: 'mcp', labelKey: 'page.mcp', icon: Plug, descKey: 'page.mcpDesc' },
  { id: 'models', labelKey: 'page.models', icon: Cpu, descKey: 'page.modelsDesc' },
  { id: 'context', labelKey: 'page.context', icon: FileText, descKey: 'page.contextDesc' },
  { id: 'conversation', labelKey: 'page.conversation', icon: MessageSquare, descKey: 'page.conversationDesc' },
  { id: 'rules', labelKey: 'page.rules', icon: BookOpen, descKey: 'page.rulesDesc' },
  { id: 'data', labelKey: 'page.data', icon: Database, descKey: 'page.dataDesc' },
]

// ============================================
// Shared Sub-Components
// ============================================

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/[0.04] last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-white/70">{label}</div>
        {desc && <div className="text-[10px] text-white/30 mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0 flex items-center">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-9 h-5 rounded-full transition-colors relative ${
        value ? 'bg-emerald-500/60' : 'bg-white/10'
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          value ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/70 outline-none focus:border-emerald-500/30 min-w-[120px]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#1a1a2e]">
          {o.label}
        </option>
      ))}
    </select>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/70 outline-none focus:border-emerald-500/30 w-full ${className}`}
    />
  )
}

function NumberInput({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/70 outline-none focus:border-emerald-500/30 w-20"
    />
  )
}

function SectionHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-[14px] text-white/80">{title}</h3>
        {desc && <p className="text-[10px] text-white/30 mt-0.5">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

function EmptyState({ text, icon: Icon }: { text: string; icon: typeof AlertCircle }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-white/20">
      <Icon className="w-8 h-8 mb-2 opacity-40" />
      <span className="text-[11px]">{text}</span>
    </div>
  )
}

function CardButton({ onClick, icon: Icon, label, desc, danger }: { onClick: () => void; icon: typeof Plus; label: string; desc?: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded text-[11px] transition-colors ${
        danger
          ? 'bg-red-500/10 text-red-400/70 hover:bg-red-500/20'
          : 'bg-emerald-500/10 text-emerald-400/70 hover:bg-emerald-500/20'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

// ============================================
// Section: Account
// ============================================

function AccountSection() {
  const { settings, updateUserProfile } = useSettingsStore()
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(settings.userProfile)

  const handleSave = () => {
    updateUserProfile(draft)
    setEditing(false)
    toast.success(t('messages.success', 'common'))
  }

  return (
    <div>
      <SectionHeader
        title={t('page.account', 'settings')}
        desc={t('page.accountDesc', 'settings')}
        action={
          editing ? (
            <div className="flex gap-1.5">
              <CardButton onClick={() => setEditing(false)} icon={X} label={t('actions.cancel', 'common')} />
              <CardButton onClick={handleSave} icon={Check} label={t('actions.save', 'common')} />
            </div>
          ) : (
            <CardButton onClick={() => { setDraft(settings.userProfile); setEditing(true) }} icon={Edit3} label={t('actions.edit', 'common')} />
          )
        }
      />

      <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/[0.04]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/30 to-blue-500/30 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-white/40" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-white/70">{settings.userProfile.username || 'Guest'}</div>
            <div className="text-[10px] text-white/30">{settings.userProfile.email || 'No email'}</div>
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-white/40 mb-1">{t('page.username', 'settings')}</label>
              <TextInput value={draft.username} onChange={(v) => setDraft({ ...draft, username: v })} />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 mb-1">{t('page.email', 'settings')}</label>
              <TextInput value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 mb-1">{t('page.bio', 'settings')}</label>
              <textarea
                value={draft.bio || ''}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/70 outline-none focus:border-emerald-500/30 h-16 resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <SettingRow label={t('page.username', 'settings')}>
              <span className="text-[11px] text-white/50">{settings.userProfile.username}</span>
            </SettingRow>
            <SettingRow label={t('page.email', 'settings')}>
              <span className="text-[11px] text-white/50">{settings.userProfile.email}</span>
            </SettingRow>
            <SettingRow label={t('page.bio', 'settings')}>
              <span className="text-[11px] text-white/50">{settings.userProfile.bio || '-'}</span>
            </SettingRow>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Section: General
// ============================================

function GeneralSection() {
  const { settings, updateGeneralSettings, updateKeybinding, resetKeybindings } = useSettingsStore()
  const { t, setLocale } = useI18n()
  const { currentTheme, setTheme } = useThemeStore()
  const { general } = settings
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [recordedKeys, setRecordedKeys] = useState('')
  const keyInputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault()
    const parts: string[] = []
    if (e.ctrlKey || e.metaKey) {parts.push('Ctrl')}
    if (e.shiftKey) {parts.push('Shift')}
    if (e.altKey) {parts.push('Alt')}
    const key = e.key
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      parts.push(key.length === 1 ? key.toUpperCase() : key)
    }
    if (parts.length > 1 || !['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      setRecordedKeys(parts.join('+'))
    }
  }, [])

  const saveKeybinding = () => {
    if (editingKey && recordedKeys) {
      // Check for conflicts before saving
      const conflictAction = Object.entries(general.customKeybindings)
        .find(([action, keys]) => action !== editingKey && keys === recordedKeys)
      if (conflictAction) {
        toast.warning(`${t('page.keybindingConflict', 'settings')}: "${recordedKeys}" → ${conflictAction[0]}`)
      }
      updateKeybinding(editingKey, recordedKeys)
      toast.success(`${editingKey}: ${recordedKeys}`)
    }
    setEditingKey(null)
    setRecordedKeys('')
  }

  // Detect keybinding conflicts: find duplicate key assignments
  const keybindingConflicts = useMemo(() => {
    const keyMap: Record<string, string[]> = {}
    Object.entries(general.customKeybindings).forEach(([action, keys]) => {
      const normalized = keys.trim()
      if (!keyMap[normalized]) {keyMap[normalized] = []}
      keyMap[normalized].push(action)
    })
    const conflicts: Record<string, string[]> = {}
    for (const [keys, actions] of Object.entries(keyMap)) {
      if (actions.length > 1) {
        for (const action of actions) {
          conflicts[action] = actions.filter(a => a !== action)
        }
      }
    }
    return conflicts
  }, [general.customKeybindings])

  const hasConflicts = Object.keys(keybindingConflicts).length > 0

  return (
    <div className="space-y-6">
      {/* Theme & Language */}
      <div>
        <SectionHeader title={t('page.appearance', 'settings')} />
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
          <SettingRow label={t('theme.dark', 'settings')} desc={t('page.themeDesc', 'settings')}>
            <SelectInput
              value={general.theme}
              options={[
                { value: 'dark', label: t('theme.dark', 'settings') },
                { value: 'light', label: t('theme.light', 'settings') },
                { value: 'auto', label: t('theme.system', 'settings') },
              ]}
              onChange={(v) => {
                updateGeneralSettings({ theme: v as any })
                // Cross-module sync: if changing to dark/light, update theme-store
                if (v === 'dark' && currentTheme.type !== 'dark') {
                  setTheme({ ...currentTheme, type: 'dark' })
                } else if (v === 'light' && currentTheme.type !== 'light') {
                  setTheme({ ...currentTheme, type: 'light' })
                }
              }}
            />
          </SettingRow>
          <SettingRow label={t('language', 'settings')} desc={t('page.languageDesc', 'settings')}>
            <SelectInput
              value={general.language}
              options={[
                { value: 'zh-CN', label: '简体中文' },
                { value: 'en-US', label: 'English' },
                { value: 'ja-JP', label: '日本語' },
              ]}
              onChange={(v) => {
                updateGeneralSettings({ language: v as any })
                // Cross-module sync: update i18n locale
                setLocale(v as any)
              }}
            />
          </SettingRow>
        </div>
      </div>

      {/* Editor */}
      <div>
        <SectionHeader title={t('editor', 'settings')} />
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
          <SettingRow label={t('editor.fontSize', 'settings')}>
            <NumberInput value={general.editorFontSize} onChange={(v) => updateGeneralSettings({ editorFontSize: v })} min={10} max={24} />
          </SettingRow>
          <SettingRow label={t('page.editorFont', 'settings')}>
            <SelectInput
              value={general.editorFont}
              options={[
                { value: 'JetBrains Mono', label: 'JetBrains Mono' },
                { value: 'Fira Code', label: 'Fira Code' },
                { value: 'Monaco', label: 'Monaco' },
                { value: 'Consolas', label: 'Consolas' },
              ]}
              onChange={(v) => updateGeneralSettings({ editorFont: v })}
            />
          </SettingRow>
          <SettingRow label={t('editor.wordWrap', 'settings')}>
            <Toggle value={general.wordWrap} onChange={(v) => updateGeneralSettings({ wordWrap: v })} />
          </SettingRow>
          <SettingRow label={t('page.localLinkMode', 'settings')}>
            <SelectInput
              value={general.localLinkOpenMode}
              options={[
                { value: 'system', label: t('page.systemDefault', 'settings') },
                { value: 'builtin', label: t('page.builtinViewer', 'settings') },
              ]}
              onChange={(v) => updateGeneralSettings({ localLinkOpenMode: v as any })}
            />
          </SettingRow>
          <SettingRow label={t('page.markdownMode', 'settings')}>
            <SelectInput
              value={general.markdownOpenMode}
              options={[
                { value: 'editor', label: t('page.markdownEditor', 'settings') },
                { value: 'preview', label: t('page.markdownPreview', 'settings') },
              ]}
              onChange={(v) => updateGeneralSettings({ markdownOpenMode: v as any })}
            />
          </SettingRow>
          <SettingRow label="Node.js">
            <TextInput value={general.nodeVersion} onChange={(v) => updateGeneralSettings({ nodeVersion: v })} className="w-24" />
          </SettingRow>
        </div>
      </div>

      {/* Keybindings */}
      <div>
        <SectionHeader
          title={t('shortcuts', 'settings')}
          desc={t('page.shortcutsDesc', 'settings')}
          action={<CardButton onClick={resetKeybindings} icon={RotateCcw} label={t('actions.reset', 'common')} />}
        />
        {/* Conflict warning banner */}
        {hasConflicts && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
            <span className="text-[10px] text-amber-400/60">
              {t('page.keybindingConflictWarning', 'settings')}
            </span>
          </div>
        )}
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04] max-h-[320px] overflow-y-auto">
          {Object.entries(general.customKeybindings).map(([action, keys]) => {
            const isDefault = DEFAULT_KEYBINDINGS[action] === keys
            const conflictsWith = keybindingConflicts[action]
            return (
              <div key={action} className={`flex items-center justify-between py-2 border-b border-white/[0.03] last:border-b-0 group ${
                conflictsWith ? 'bg-amber-500/[0.03]' : ''
              }`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Keyboard className={`w-3 h-3 shrink-0 ${conflictsWith ? 'text-amber-400/40' : 'text-white/20'}`} />
                  <span className={`text-[11px] truncate ${conflictsWith ? 'text-amber-400/50' : 'text-white/50'}`}>{action}</span>
                  {conflictsWith && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400/50 shrink-0" title={`${t('page.conflictsWith', 'settings')}: ${conflictsWith.join(', ')}`}>
                      ⚠ {conflictsWith.join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {editingKey === action ? (
                    <>
                      <input
                        ref={keyInputRef}
                        value={recordedKeys || keys}
                        onKeyDown={handleKeyDown}
                        readOnly
                        className="bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-0.5 text-[10px] text-emerald-400 outline-none w-28 text-center"
                        autoFocus
                        placeholder="Press keys..."
                      />
                      <button onClick={saveKeybinding} className="text-emerald-400/60 hover:text-emerald-400">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => { setEditingKey(null); setRecordedKeys('') }} className="text-white/30 hover:text-white/50">
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <code className={`px-1.5 py-0.5 rounded text-[10px] ${
                        isDefault ? 'bg-white/[0.06] text-white/40' : 'bg-emerald-500/10 text-emerald-400/60'
                      }`}>
                        {keys}
                      </code>
                      <button
                        onClick={() => { setEditingKey(action); setRecordedKeys('') }}
                        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/50 transition-opacity"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Section: Agents
// ============================================

function AgentsSection() {
  const { settings, addAgent, updateAgent, removeAgent } = useSettingsStore()
  const { t } = useI18n()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftDesc, setDraftDesc] = useState('')
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftModel, setDraftModel] = useState('gpt-4-turbo-preview')
  const [draftTemp, setDraftTemp] = useState(0.7)

  const handleCreate = () => {
    if (!draftName.trim()) {return}
    addAgent({
      id: `agent-${Date.now()}`,
      name: draftName,
      description: draftDesc,
      systemPrompt: draftPrompt,
      model: draftModel,
      temperature: draftTemp,
      maxTokens: 4096,
      isBuiltIn: false,
      isCustom: true,
    })
    setShowCreate(false)
    setDraftName('')
    setDraftDesc('')
    setDraftPrompt('')
    toast.success(t('messages.success', 'common'))
  }

  return (
    <div>
      <SectionHeader
        title={t('page.agents', 'settings')}
        desc={t('page.agentsDesc', 'settings')}
        action={<CardButton onClick={() => setShowCreate(!showCreate)} icon={Plus} label={t('actions.add', 'common')} />}
      />

      {showCreate && (
        <div className="bg-emerald-500/[0.04] rounded-lg p-4 border border-emerald-500/10 mb-4 space-y-3">
          <TextInput value={draftName} onChange={setDraftName} placeholder={t('page.agentName', 'settings')} />
          <TextInput value={draftDesc} onChange={setDraftDesc} placeholder={t('page.agentDesc', 'settings')} />
          <textarea
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            placeholder={t('page.systemPrompt', 'settings')}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/70 outline-none h-20 resize-none"
          />
          <div className="flex gap-2 items-center">
            <SelectInput
              value={draftModel}
              options={settings.models.map((m) => ({ value: m.model, label: `${m.provider} / ${m.model}` }))}
              onChange={setDraftModel}
            />
            <NumberInput value={draftTemp} onChange={setDraftTemp} min={0} max={2} step={0.1} />
          </div>
          <div className="flex gap-2 justify-end">
            <CardButton onClick={() => setShowCreate(false)} icon={X} label={t('actions.cancel', 'common')} />
            <CardButton onClick={handleCreate} icon={Check} label={t('actions.create', 'common')} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {settings.agents.map((agent) => (
          <div key={agent.id} className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <Bot className="w-4 h-4 text-emerald-400/40 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-white/70 flex items-center gap-2">
                    {agent.name}
                    {agent.isBuiltIn && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400/60">{t('page.builtIn', 'settings')}</span>
                    )}
                  </div>
                  {agent.description && <div className="text-[10px] text-white/30 mt-0.5">{agent.description}</div>}
                  <div className="text-[9px] text-white/20 mt-1">
                    {agent.model} | temp: {agent.temperature}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!agent.isBuiltIn && (
                  <button onClick={() => removeAgent(agent.id)} className="p-1 text-red-400/40 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {settings.agents.length === 0 && <EmptyState text={t('page.noAgents', 'settings')} icon={Bot} />}
      </div>
    </div>
  )
}

// ============================================
// Section: MCP — with runtime endpoint injection
// ============================================

function MCPSection() {
  const { settings, addMCP, updateMCP, removeMCP, toggleMCP, testMCPConnection } = useSettingsStore()
  const { t } = useI18n()
  const [showAdd, setShowAdd] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftEndpoint, setDraftEndpoint] = useState('')
  const [draftDesc, setDraftDesc] = useState('')
  const [draftProject, setDraftProject] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editEndpoint, setEditEndpoint] = useState('')
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { connected: boolean; message: string }>>({})

  const handleTestMCP = async (mcpId: string) => {
    setTestingId(mcpId)
    try {
      const result = await testMCPConnection(mcpId)
      setTestResults(prev => ({ ...prev, [mcpId]: result }))
      if (result.connected) {toast.success(result.message)}
      else {toast.error(result.message)}
    } finally {
      setTestingId(null)
    }
  }

  const handleAdd = () => {
    if (!draftName.trim()) {return}
    addMCP({
      id: `mcp-${Date.now()}`,
      name: draftName,
      type: 'manual',
      endpoint: draftEndpoint,
      enabled: true,
      projectLevel: draftProject,
      description: draftDesc,
    })
    setShowAdd(false)
    setDraftName('')
    setDraftEndpoint('')
    setDraftDesc('')
    toast.success(t('messages.success', 'common'))
  }

  const handleSaveEndpoint = (id: string) => {
    updateMCP(id, { endpoint: editEndpoint })
    setEditingId(null)
    toast.success(t('page.mcpEndpointUpdated', 'settings'))
  }

  return (
    <div>
      <SectionHeader
        title={t('page.mcp', 'settings')}
        desc={t('page.mcpDesc', 'settings')}
        action={<CardButton onClick={() => setShowAdd(!showAdd)} icon={Plus} label={t('page.mcpAdd', 'settings')} />}
      />

      {/* Runtime Injection Info */}
      <div className="bg-blue-500/[0.04] rounded-lg p-3 border border-blue-500/10 mb-4">
        <div className="flex items-start gap-2">
          <Zap className="w-3.5 h-3.5 text-blue-400/60 mt-0.5 shrink-0" />
          <div>
            <div className="text-[11px] text-blue-400/70">{t('page.mcpRuntimeInfo', 'settings')}</div>
            <div className="text-[9px] text-white/30 mt-0.5">{t('page.mcpRuntimeDesc', 'settings')}</div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="bg-emerald-500/[0.04] rounded-lg p-4 border border-emerald-500/10 mb-4 space-y-3">
          <TextInput value={draftName} onChange={setDraftName} placeholder={t('page.mcpName', 'settings')} />
          <TextInput value={draftEndpoint} onChange={setDraftEndpoint} placeholder="stdio://mcp-server-xxx or http://localhost:3100" />
          <TextInput value={draftDesc} onChange={setDraftDesc} placeholder={t('labels.description', 'common')} />
          <div className="flex items-center gap-2">
            <Toggle value={draftProject} onChange={setDraftProject} />
            <span className="text-[10px] text-white/40">{t('page.mcpProjectLevel', 'settings')}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <CardButton onClick={() => setShowAdd(false)} icon={X} label={t('actions.cancel', 'common')} />
            <CardButton onClick={handleAdd} icon={Check} label={t('actions.add', 'common')} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {settings.mcpConfigs.map((mcp) => (
          <div key={mcp.id} className={`bg-white/[0.02] rounded-lg p-3 border transition-colors ${
            mcp.enabled ? 'border-emerald-500/10' : 'border-white/[0.04] opacity-60'
          } group`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <Plug className={`w-4 h-4 mt-0.5 shrink-0 ${mcp.enabled ? 'text-emerald-400/50' : 'text-white/20'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-white/70 flex items-center gap-2">
                    {mcp.name}
                    {mcp.projectLevel && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400/60">{t('page.projectScope', 'settings')}</span>
                    )}
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">{mcp.type}</span>
                  </div>
                  {mcp.description && <div className="text-[10px] text-white/30 mt-0.5">{mcp.description}</div>}

                  {/* Endpoint display/edit */}
                  <div className="mt-1.5">
                    {editingId === mcp.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={editEndpoint}
                          onChange={(e) => setEditEndpoint(e.target.value)}
                          className="flex-1 bg-white/[0.06] border border-emerald-500/20 rounded px-1.5 py-0.5 text-[9px] text-emerald-400/80 font-mono outline-none"
                          autoFocus
                        />
                        <button onClick={() => handleSaveEndpoint(mcp.id)} className="text-emerald-400/60 hover:text-emerald-400">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-white/30 hover:text-white/50">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <code className="text-[9px] text-white/25 font-mono truncate max-w-[200px]">{mcp.endpoint || 'No endpoint'}</code>
                        <button
                          onClick={() => { setEditingId(mcp.id); setEditEndpoint(mcp.endpoint || '') }}
                          className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-white/50"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTestMCP(mcp.id)}
                  disabled={testingId === mcp.id}
                  className={`px-2 py-0.5 rounded text-[9px] transition-colors ${
                    testingId === mcp.id
                      ? 'bg-white/[0.04] text-white/20 cursor-wait'
                      : testResults[mcp.id]?.connected
                        ? 'bg-emerald-500/10 text-emerald-400/60'
                        : 'bg-blue-500/10 text-blue-400/60 hover:bg-blue-500/20'
                  }`}
                >
                  {testingId === mcp.id ? '...' : testResults[mcp.id]?.connected ? '✓' : t('page.testConnection', 'settings')}
                </button>
                <Toggle value={mcp.enabled} onChange={() => toggleMCP(mcp.id)} />
                {mcp.type === 'manual' && (
                  <button onClick={() => removeMCP(mcp.id)} className="opacity-0 group-hover:opacity-100 text-red-400/40 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {settings.mcpConfigs.length === 0 && <EmptyState text={t('page.noMCPs', 'settings')} icon={Plug} />}
      </div>
    </div>
  )
}

// ============================================
// Section: Models
// ============================================

function ModelsSection() {
  const { settings, addModel, updateModel, removeModel, validateApiKey } = useSettingsStore()
  const { t } = useI18n()
  const [showAdd, setShowAdd] = useState(false)
  const [draftProvider, setDraftProvider] = useState('OpenAI')
  const [draftModel, setDraftModel] = useState('')
  const [draftKey, setDraftKey] = useState('')
  const [showKey, setShowKey] = useState<string | null>(null)
  const [validating, setValidating] = useState<string | null>(null)
  const [validationResults, setValidationResults] = useState<Record<string, { valid: boolean; message: string; latency?: number }>>({})

  const handleValidate = async (modelId: string) => {
    setValidating(modelId)
    try {
      const result = await validateApiKey(modelId)
      setValidationResults(prev => ({ ...prev, [modelId]: result }))
      if (result.valid) {
        toast.success(`${result.message} (${result.latency}ms)`)
      } else {
        toast.error(result.message)
      }
    } finally {
      setValidating(null)
    }
  }

  const handleAdd = () => {
    if (!draftModel.trim()) {return}
    addModel({
      id: `model-${Date.now()}`,
      provider: draftProvider,
      model: draftModel,
      apiKey: draftKey,
      enabled: true,
    })
    setShowAdd(false)
    setDraftModel('')
    setDraftKey('')
    toast.success(t('messages.success', 'common'))
  }

  return (
    <div>
      <SectionHeader
        title={t('page.models', 'settings')}
        desc={t('page.modelsDesc', 'settings')}
        action={<CardButton onClick={() => setShowAdd(!showAdd)} icon={Plus} label={t('actions.add', 'common')} />}
      />

      {showAdd && (
        <div className="bg-emerald-500/[0.04] rounded-lg p-4 border border-emerald-500/10 mb-4 space-y-3">
          <SelectInput
            value={draftProvider}
            options={[
              { value: 'OpenAI', label: 'OpenAI' },
              { value: 'Anthropic', label: 'Anthropic' },
              { value: 'ZhipuAI', label: 'ZhipuAI' },
              { value: 'Baidu', label: 'Baidu' },
              { value: 'Aliyun', label: 'Aliyun' },
              { value: 'Ollama', label: 'Ollama' },
            ]}
            onChange={setDraftProvider}
          />
          <TextInput value={draftModel} onChange={setDraftModel} placeholder="Model name (e.g. gpt-4-turbo)" />
          <TextInput value={draftKey} onChange={setDraftKey} placeholder="API Key" type="password" />
          <div className="flex gap-2 justify-end">
            <CardButton onClick={() => setShowAdd(false)} icon={X} label={t('actions.cancel', 'common')} />
            <CardButton onClick={handleAdd} icon={Check} label={t('actions.add', 'common')} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {settings.models.map((model) => (
          <div key={model.id} className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] group">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Cpu className={`w-4 h-4 shrink-0 ${model.enabled ? 'text-emerald-400/50' : 'text-white/20'}`} />
                <div className="min-w-0">
                  <div className="text-[12px] text-white/70">{model.provider} / {model.model}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] text-white/20 font-mono">
                      {showKey === model.id ? (model.apiKey || 'No key') : (model.apiKey ? '****' + model.apiKey.slice(-4) : 'No key')}
                    </span>
                    <button onClick={() => setShowKey(showKey === model.id ? null : model.id)} className="text-white/20 hover:text-white/40">
                      {showKey === model.id ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                  {/* Validation result */}
                  {validationResults[model.id] && (
                    <div className={`flex items-center gap-1 mt-0.5 text-[9px] ${
                      validationResults[model.id].valid ? 'text-emerald-400/60' : 'text-red-400/60'
                    }`}>
                      {validationResults[model.id].valid ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                      {validationResults[model.id].message}
                      {validationResults[model.id].latency && <span className="text-white/20 ml-1">({validationResults[model.id].latency}ms)</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleValidate(model.id)}
                  disabled={validating === model.id || !model.apiKey}
                  className={`px-2 py-0.5 rounded text-[9px] transition-colors ${
                    validating === model.id
                      ? 'bg-white/[0.04] text-white/20 cursor-wait'
                      : !model.apiKey
                        ? 'bg-white/[0.02] text-white/10 cursor-not-allowed'
                        : 'bg-emerald-500/10 text-emerald-400/60 hover:bg-emerald-500/20'
                  }`}
                  title={t('page.validateKey', 'settings')}
                >
                  {validating === model.id ? '...' : t('page.validate', 'settings')}
                </button>
                <Toggle value={model.enabled} onChange={(v) => updateModel(model.id, { enabled: v })} />
                <button onClick={() => removeModel(model.id)} className="opacity-0 group-hover:opacity-100 text-red-400/40 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Section: Context
// ============================================

function ContextSection() {
  const { settings, updateContextSettings, addIgnoreRule, removeIgnoreRule, addDocumentSet, removeDocumentSet } = useSettingsStore()
  const { t } = useI18n()
  const [newIgnore, setNewIgnore] = useState('')
  const [newDocName, setNewDocName] = useState('')
  const [newDocUrl, setNewDocUrl] = useState('')

  return (
    <div className="space-y-6">
      {/* Index Status */}
      <div>
        <SectionHeader title={t('page.context', 'settings')} desc={t('page.contextDesc', 'settings')} />
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
          <SettingRow label={t('page.indexStatus', 'settings')}>
            <span className={`text-[10px] px-2 py-0.5 rounded ${
              settings.context.indexStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-400/70' :
              settings.context.indexStatus === 'indexing' ? 'bg-blue-500/10 text-blue-400/70' :
              settings.context.indexStatus === 'error' ? 'bg-red-500/10 text-red-400/70' :
              'bg-white/[0.06] text-white/40'
            }`}>{settings.context.indexStatus}</span>
          </SettingRow>
          <SettingRow label={t('page.reindex', 'settings')}>
            <CardButton onClick={() => {
              updateContextSettings({ indexStatus: 'indexing' })
              setTimeout(() => updateContextSettings({ indexStatus: 'completed' }), 2000)
            }} icon={Play} label={t('page.startIndex', 'settings')} />
          </SettingRow>
        </div>
      </div>

      {/* Ignore Rules */}
      <div>
        <SectionHeader title={t('page.ignoreRules', 'settings')} />
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
          <div className="flex gap-2 mb-3">
            <TextInput value={newIgnore} onChange={setNewIgnore} placeholder="e.g. *.log" className="flex-1" />
            <CardButton onClick={() => { if (newIgnore.trim()) { addIgnoreRule(newIgnore.trim()); setNewIgnore('') } }} icon={Plus} label={t('actions.add', 'common')} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {settings.context.ignoreRules.map((rule) => (
              <span key={rule} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] text-[10px] text-white/40 group">
                <code>{rule}</code>
                <button onClick={() => removeIgnoreRule(rule)} className="opacity-0 group-hover:opacity-100 text-red-400/40 hover:text-red-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Document Sets */}
      <div>
        <SectionHeader title={t('page.documentSets', 'settings')} />
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
          <div className="flex gap-2 mb-3">
            <TextInput value={newDocName} onChange={setNewDocName} placeholder={t('labels.name', 'common')} className="w-32" />
            <TextInput value={newDocUrl} onChange={setNewDocUrl} placeholder="URL" className="flex-1" />
            <CardButton onClick={() => {
              if (newDocName.trim()) {
                addDocumentSet({ id: `doc-${Date.now()}`, name: newDocName, source: 'url', url: newDocUrl, enabled: true })
                setNewDocName(''); setNewDocUrl('')
              }
            }} icon={Plus} label={t('actions.add', 'common')} />
          </div>
          {settings.context.documentSets.length > 0 ? (
            <div className="space-y-1.5">
              {settings.context.documentSets.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] group">
                  <div className="text-[11px] text-white/50 truncate">{doc.name} <span className="text-white/20">({doc.source})</span></div>
                  <button onClick={() => removeDocumentSet(doc.id)} className="opacity-0 group-hover:opacity-100 text-red-400/40">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-white/20 text-center py-3">{t('messages.noData', 'common')}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Section: Conversation Flow
// ============================================

function ConversationSection() {
  const { settings, updateConversationSettings, addWhitelistCommand, removeWhitelistCommand } = useSettingsStore()
  const { t } = useI18n()
  const conv = settings.conversation
  const [newCmd, setNewCmd] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title={t('page.conversation', 'settings')} desc={t('page.conversationDesc', 'settings')} />
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
          <SettingRow label={t('page.useTodoList', 'settings')}>
            <Toggle value={conv.useTodoList} onChange={(v) => updateConversationSettings({ useTodoList: v })} />
          </SettingRow>
          <SettingRow label={t('page.autoCollapse', 'settings')}>
            <Toggle value={conv.autoCollapseNodes} onChange={(v) => updateConversationSettings({ autoCollapseNodes: v })} />
          </SettingRow>
          <SettingRow label={t('page.autoFixCode', 'settings')}>
            <Toggle value={conv.autoFixCodeIssues} onChange={(v) => updateConversationSettings({ autoFixCodeIssues: v })} />
          </SettingRow>
          <SettingRow label={t('page.agentProactive', 'settings')}>
            <Toggle value={conv.agentProactiveQuestion} onChange={(v) => updateConversationSettings({ agentProactiveQuestion: v })} />
          </SettingRow>
          <SettingRow label={t('page.codeReviewScope', 'settings')}>
            <SelectInput
              value={conv.codeReviewScope}
              options={[
                { value: 'none', label: t('page.reviewNone', 'settings') },
                { value: 'all', label: t('page.reviewAll', 'settings') },
                { value: 'changed', label: t('page.reviewChanged', 'settings') },
              ]}
              onChange={(v) => updateConversationSettings({ codeReviewScope: v as any })}
            />
          </SettingRow>
          <SettingRow label={t('page.jumpAfterReview', 'settings')}>
            <Toggle value={conv.jumpAfterReview} onChange={(v) => updateConversationSettings({ jumpAfterReview: v })} />
          </SettingRow>
        </div>
      </div>

      {/* MCP & Command Execution */}
      <div>
        <SectionHeader title={t('page.commandExecution', 'settings')} />
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
          <SettingRow label={t('page.autoRunMCP', 'settings')} desc={t('page.autoRunMCPDesc', 'settings')}>
            <Toggle value={conv.autoRunMCP} onChange={(v) => updateConversationSettings({ autoRunMCP: v })} />
          </SettingRow>
          <SettingRow label={t('page.commandRunMode', 'settings')}>
            <SelectInput
              value={conv.commandRunMode}
              options={[
                { value: 'sandbox', label: t('page.modeSandbox', 'settings') },
                { value: 'direct', label: t('page.modeDirect', 'settings') },
              ]}
              onChange={(v) => updateConversationSettings({ commandRunMode: v as any })}
            />
          </SettingRow>
        </div>
      </div>

      {/* Whitelist Commands */}
      <div>
        <SectionHeader title={t('page.whitelistCmds', 'settings')} />
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
          <div className="flex gap-2 mb-3">
            <TextInput value={newCmd} onChange={setNewCmd} placeholder="npm run build" className="flex-1" />
            <CardButton onClick={() => { if (newCmd.trim()) { addWhitelistCommand(newCmd.trim()); setNewCmd('') } }} icon={Plus} label={t('actions.add', 'common')} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {conv.whitelistCommands.map((cmd) => (
              <span key={cmd} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] text-[10px] text-white/40 font-mono group">
                {cmd}
                <button onClick={() => removeWhitelistCommand(cmd)} className="opacity-0 group-hover:opacity-100 text-red-400/40">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Notification */}
      <div>
        <SectionHeader title={t('page.notifications', 'settings')} />
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
          <SettingRow label={t('page.volume', 'settings')}>
            <div className="flex items-center gap-2">
              <Volume2 className="w-3 h-3 text-white/30" />
              <input
                type="range"
                value={conv.volume}
                onChange={(e) => updateConversationSettings({ volume: Number(e.target.value) })}
                min={0}
                max={100}
                className="w-24 accent-emerald-500"
              />
              <span className="text-[10px] text-white/40 w-6 text-right">{conv.volume}</span>
            </div>
          </SettingRow>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Section: Rules & Skills — with AI prompt injection preview
// ============================================

function RulesSection() {
  const { settings, addRule, updateRule, removeRule, toggleRule, addSkill, updateSkill, removeSkill, toggleSkill, getEnabledRulesContent } = useSettingsStore()
  const { t } = useI18n()
  const [tab, setTab] = useState<'rules' | 'skills' | 'preview'>('rules')
  const [showAddRule, setShowAddRule] = useState(false)
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [draftRuleName, setDraftRuleName] = useState('')
  const [draftRuleContent, setDraftRuleContent] = useState('')
  const [draftRuleScope, setDraftRuleScope] = useState<'personal' | 'project'>('personal')
  const [draftSkillName, setDraftSkillName] = useState('')
  const [draftSkillDesc, setDraftSkillDesc] = useState('')
  const [draftSkillContent, setDraftSkillContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const injectedContent = useMemo(() => getEnabledRulesContent(), [settings.rules, settings.skills])

  const handleAddRule = () => {
    if (!draftRuleName.trim()) {return}
    addRule({
      id: `rule-${Date.now()}`,
      name: draftRuleName,
      content: draftRuleContent,
      scope: draftRuleScope,
      enabled: true,
    })
    setShowAddRule(false)
    setDraftRuleName('')
    setDraftRuleContent('')
  }

  const handleAddSkill = () => {
    if (!draftSkillName.trim()) {return}
    addSkill({
      id: `skill-${Date.now()}`,
      name: draftSkillName,
      description: draftSkillDesc,
      content: draftSkillContent,
      scope: 'global',
      enabled: true,
    })
    setShowAddSkill(false)
    setDraftSkillName('')
    setDraftSkillDesc('')
    setDraftSkillContent('')
  }

  return (
    <div>
      <SectionHeader title={t('page.rules', 'settings')} desc={t('page.rulesDesc', 'settings')} />

      {/* Tabs */}
      <div className="flex gap-0.5 mb-4">
        {(['rules', 'skills', 'preview'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-3 py-1.5 text-[11px] rounded transition-colors ${
              tab === tb ? 'bg-emerald-500/15 text-emerald-400/80' : 'text-white/30 hover:text-white/50'
            }`}
          >
            {tb === 'rules' ? t('page.rulesTab', 'settings') : tb === 'skills' ? t('page.skillsTab', 'settings') : t('page.injectionPreview', 'settings')}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div>
          <div className="mb-3">
            <CardButton onClick={() => setShowAddRule(!showAddRule)} icon={Plus} label={t('page.addRule', 'settings')} />
          </div>

          {showAddRule && (
            <div className="bg-emerald-500/[0.04] rounded-lg p-4 border border-emerald-500/10 mb-4 space-y-3">
              <TextInput value={draftRuleName} onChange={setDraftRuleName} placeholder={t('labels.name', 'common')} />
              <textarea
                value={draftRuleContent}
                onChange={(e) => setDraftRuleContent(e.target.value)}
                placeholder={t('page.ruleContent', 'settings')}
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/70 outline-none h-24 resize-none font-mono"
              />
              <div className="flex items-center gap-3">
                <SelectInput value={draftRuleScope} options={[
                  { value: 'personal', label: t('page.scopePersonal', 'settings') },
                  { value: 'project', label: t('page.scopeProject', 'settings') },
                ]} onChange={(v) => setDraftRuleScope(v as any)} />
                <div className="flex gap-2 ml-auto">
                  <CardButton onClick={() => setShowAddRule(false)} icon={X} label={t('actions.cancel', 'common')} />
                  <CardButton onClick={handleAddRule} icon={Check} label={t('actions.create', 'common')} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {settings.rules.map((rule) => (
              <div key={rule.id} className={`bg-white/[0.02] rounded-lg p-3 border transition-colors ${
                rule.enabled ? 'border-emerald-500/10' : 'border-white/[0.04] opacity-50'
              } group`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-white/70 flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-white/20" />
                      {rule.name}
                      <span className={`text-[9px] px-1 py-0.5 rounded ${
                        rule.scope === 'project' ? 'bg-violet-500/10 text-violet-400/60' : 'bg-white/[0.06] text-white/30'
                      }`}>{rule.scope}</span>
                    </div>
                    {editingId === rule.id ? (
                      <div className="mt-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-white/[0.06] border border-emerald-500/20 rounded px-2 py-1 text-[10px] text-white/50 outline-none h-20 resize-none font-mono"
                        />
                        <div className="flex gap-1.5 mt-1.5 justify-end">
                          <button onClick={() => { updateRule(rule.id, { content: editContent }); setEditingId(null) }} className="text-emerald-400/60 hover:text-emerald-400"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setEditingId(null)} className="text-white/30 hover:text-white/50"><X className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-white/30 mt-1 line-clamp-2 font-mono cursor-pointer" onClick={() => { setEditingId(rule.id); setEditContent(rule.content) }}>
                        {rule.content}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Toggle value={rule.enabled} onChange={() => toggleRule(rule.id)} />
                    <button onClick={() => removeRule(rule.id)} className="opacity-0 group-hover:opacity-100 text-red-400/40 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {settings.rules.length === 0 && <EmptyState text={t('page.noRules', 'settings')} icon={BookOpen} />}
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {tab === 'skills' && (
        <div>
          <div className="mb-3">
            <CardButton onClick={() => setShowAddSkill(!showAddSkill)} icon={Plus} label={t('page.addSkill', 'settings')} />
          </div>

          {showAddSkill && (
            <div className="bg-emerald-500/[0.04] rounded-lg p-4 border border-emerald-500/10 mb-4 space-y-3">
              <TextInput value={draftSkillName} onChange={setDraftSkillName} placeholder={t('labels.name', 'common')} />
              <TextInput value={draftSkillDesc} onChange={setDraftSkillDesc} placeholder={t('labels.description', 'common')} />
              <textarea
                value={draftSkillContent}
                onChange={(e) => setDraftSkillContent(e.target.value)}
                placeholder={t('page.skillContent', 'settings')}
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/70 outline-none h-24 resize-none font-mono"
              />
              <div className="flex gap-2 justify-end">
                <CardButton onClick={() => setShowAddSkill(false)} icon={X} label={t('actions.cancel', 'common')} />
                <CardButton onClick={handleAddSkill} icon={Check} label={t('actions.create', 'common')} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {settings.skills.map((skill) => (
              <div key={skill.id} className={`bg-white/[0.02] rounded-lg p-3 border transition-colors ${
                skill.enabled ? 'border-emerald-500/10' : 'border-white/[0.04] opacity-50'
              } group`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-white/70 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-white/20" />
                      {skill.name}
                      <span className="text-[9px] px-1 py-0.5 rounded bg-white/[0.06] text-white/30">{skill.scope}</span>
                    </div>
                    {skill.description && <div className="text-[10px] text-white/25 mt-0.5">{skill.description}</div>}
                    <div className="text-[10px] text-white/20 mt-1 line-clamp-2 font-mono">{skill.content}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Toggle value={skill.enabled} onChange={() => toggleSkill(skill.id)} />
                    <button onClick={() => removeSkill(skill.id)} className="opacity-0 group-hover:opacity-100 text-red-400/40 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {settings.skills.length === 0 && <EmptyState text={t('page.noSkills', 'settings')} icon={Sparkles} />}
          </div>
        </div>
      )}

      {/* Injection Preview Tab */}
      {tab === 'preview' && (
        <div>
          <div className="bg-amber-500/[0.04] rounded-lg p-3 border border-amber-500/10 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] text-amber-400/70">{t('page.injectionInfo', 'settings')}</div>
                <div className="text-[9px] text-white/30 mt-0.5">{t('page.injectionInfoDesc', 'settings')}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0d0d14] rounded-lg p-4 border border-white/[0.06] max-h-[400px] overflow-y-auto">
            <div className="text-[10px] text-white/20 mb-2"># {t('page.systemPromptPreview', 'settings')}</div>
            <pre className="text-[10px] text-emerald-400/50 font-mono whitespace-pre-wrap leading-relaxed">
              {injectedContent || t('page.noActiveRules', 'settings')}
            </pre>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(injectedContent)
                toast.success(t('messages.copied', 'common'))
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.06] text-[10px] text-white/40 hover:text-white/60 transition-colors"
            >
              <Copy className="w-3 h-3" />
              {t('actions.copy', 'common')}
            </button>
            <span className="text-[9px] text-white/20">
              {settings.rules.filter(r => r.enabled).length} {t('page.rulesTab', 'settings')} + {settings.skills.filter(s => s.enabled).length} {t('page.skillsTab', 'settings')} {t('page.active', 'settings')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Main: SettingsPage
// ============================================

export function SettingsPage() {
  const navigate = useNavigate()
  const { activeSection, setActiveSection, searchQuery, setSearchQuery, settings, exportConfig, importConfig, resetSettings, deepSearch } = useSettingsStore()
  const { currentTheme } = useThemeStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const searchRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/designer')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [navigate])

  // Deep search results
  const searchResults = useMemo(() => deepSearch(searchQuery), [searchQuery, settings, deepSearch])

  // Filter sections by search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) {return SECTIONS}
    // If we have search results, show sections that have matches
    if (searchResults.length > 0) {
      const matchedSections = new Set(searchResults.map(r => r.section))
      return SECTIONS.filter(s => matchedSections.has(s.id))
    }
    const q = searchQuery.toLowerCase()
    return SECTIONS.filter((s) => {
      const label = t(s.labelKey, 'settings').toLowerCase()
      const desc = t(s.descKey, 'settings').toLowerCase()
      return label.includes(q) || desc.includes(q) || s.id.includes(q)
    })
  }, [searchQuery, searchResults, t])

  const handleSearchSelect = useCallback((r: SearchResult) => {
    setActiveSection(r.section)
    setSearchQuery('')
  }, [setActiveSection, setSearchQuery])

  const handleExport = () => {
    const data = exportConfig()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `yyc3-settings-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(t('page.exportSuccess', 'settings'))
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {return}
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        importConfig(data)
        toast.success(t('page.importSuccess', 'settings'))
      } catch {
        toast.error(t('messages.error', 'common'))
      }
    }
    input.click()
  }

  const bgStyle: React.CSSProperties = {
    background: currentTheme.type === 'dark'
      ? currentTheme.branding.backgroundColor || '#0d0d14'
      : 'var(--background, #f5f5fa)',
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'account': return <AccountSection />
      case 'general': return <GeneralSection />
      case 'agents': return <AgentsSection />
      case 'mcp': return <MCPSection />
      case 'models': return <ModelsSection />
      case 'context': return <ContextSection />
      case 'conversation': return <ConversationSection />
      case 'rules': return <RulesSection />
      case 'data': return <DataManagementPanel />
      default: return <GeneralSection />
    }
  }

  return (
    <div data-testid="settings-page" className="h-screen flex flex-col text-white overflow-hidden" style={bgStyle}>
      {/* Header */}
      <div
        className="h-11 flex items-center justify-between px-4 shrink-0 border-b"
        style={{
          background: isLG ? 'rgba(10,15,10,0.35)' : 'rgba(0,0,0,0.25)',
          backdropFilter: isLG ? 'blur(18px)' : undefined,
          borderColor: isLG ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/designer')} className="text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-white/70">{t('title', 'settings')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleImport} className="p-1.5 text-white/30 hover:text-white/50 transition-colors" title={t('actions.import', 'common')}>
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleExport} className="p-1.5 text-white/30 hover:text-white/50 transition-colors" title={t('actions.export', 'common')}>
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { if (confirm(t('page.resetConfirm', 'settings'))) { resetSettings(); toast.success(t('messages.success', 'common')) } }}
            className="p-1.5 text-red-400/30 hover:text-red-400/60 transition-colors"
            title={t('actions.reset', 'common')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className="w-56 shrink-0 flex flex-col border-r overflow-y-auto"
          style={{
            background: isLG ? 'rgba(10,15,10,0.3)' : 'rgba(0,0,0,0.15)',
            borderColor: isLG ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.04)',
          }}
        >
          {/* Search */}
          <div className="p-3 border-b border-white/[0.04]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('page.searchSettings', 'settings')}
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded pl-7 pr-2 py-1.5 text-[11px] text-white/60 outline-none focus:border-emerald-500/30 placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Nav items */}
          <div className="flex-1 py-2">
            {filteredSections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors ${
                    isActive
                      ? isLG
                        ? 'bg-emerald-500/10 text-emerald-400/80 border-r-2 border-emerald-400/40'
                        : 'bg-white/[0.06] text-white/70 border-r-2 border-violet-400/40'
                      : 'text-white/35 hover:text-white/50 hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] truncate">{t(section.labelKey, 'settings')}</span>
                </button>
              )
            })}
          </div>

          {/* Footer info */}
          <div className="p-3 border-t border-white/[0.04]">
            <div className="text-[9px] text-white/15 space-y-0.5">
              <div>YYC3 AI Code v1.0.0</div>
              <div>Settings Store: localStorage</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Deep search results */}
            {searchQuery.trim() && searchResults.length > 0 && (
              <SearchResultsPanel results={searchResults} onSelect={handleSearchSelect} />
            )}
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  )
}
