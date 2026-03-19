/**
 * @file SettingsPage.tsx
 * @description YYC3 设置页面 — 完整设置管理界面，含侧栏导航、全局搜索、多模块设置面板
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,page,ui,panel,search
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, User, Settings, Bot, Plug, Cpu, Database,
  MessageSquare, Shield, ChevronRight, Plus, Trash2,
  ExternalLink, RefreshCw, Download, Upload, X,
  Eye, EyeOff, Volume2, VolumeX, Keyboard,
  FileText, Globe, Palette, Type, Monitor, Moon, Sun, Zap,
  BookOpen, FolderOpen, Terminal, Bell, AlertTriangle, CheckCircle2, Loader,
} from 'lucide-react';
import {
  useSettingsStore, searchSettings,
  type AgentConfig, type MCPConfig, type ModelConfig,
  type RuleConfig, type SkillConfig,
} from './useSettingsStore';
import { VSCODE_KEYBINDINGS } from '../../services/settingsSyncService';

/* ================================================================
   Section definitions
   ================================================================ */

const SECTIONS = [
  { id: 'account', label: '账号信息', icon: User, desc: 'Account' },
  { id: 'general', label: '通用设置', icon: Settings, desc: 'General' },
  { id: 'agents', label: '智能体', icon: Bot, desc: 'Agents' },
  { id: 'mcp', label: 'MCP 连接', icon: Plug, desc: 'MCP' },
  { id: 'models', label: '模型配置', icon: Cpu, desc: 'Models' },
  { id: 'context', label: '上下文', icon: Database, desc: 'Context' },
  { id: 'conversation', label: '对话流', icon: MessageSquare, desc: 'Conversation' },
  { id: 'rules', label: '规则与技能', icon: Shield, desc: 'Rules & Skills' },
] as const;

/* ================================================================
   Main Settings Page
   ================================================================ */

export function SettingsPage() {
  const navigate = useNavigate();
  const store = useSettingsStore();
  const { settings, searchQuery, activeSection, setSearchQuery, setActiveSection } = store;
  const searchRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(
    () => searchSettings(settings, searchQuery),
    [settings, searchQuery]
  );

  const handleSearchResultClick = useCallback((result: { section: string }) => {
    setActiveSection(result.section);
    setSearchQuery('');
  }, [setActiveSection, setSearchQuery]);

  const handleExport = useCallback(() => {
    const config = store.exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yyc3-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('配置已导出');
  }, [store]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const config = JSON.parse(text);
        store.importConfig(config);
        toast.success('配置已导入');
      } catch {
        toast.error('配置文件格式错误');
      }
    };
    input.click();
  }, [store]);

  return (
    <div className="flex h-screen w-screen bg-[#0a0b10] text-white/90 overflow-hidden" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside className="flex flex-col w-[260px] min-w-[260px] border-r border-white/[0.06] bg-[#0d0e14]">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <button
            onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            title="返回"
          >
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
              <Settings size={12} className="text-white" />
            </div>
            <span className="text-[13px] text-white/90" style={{ fontWeight: 600 }}>设置</span>
            <span className="text-[10px] text-white/30 ml-1">Settings</span>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索设置..."
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[12px] text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#667eea]/40 focus:bg-white/[0.06] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/[0.08]"
              >
                <X size={11} className="text-white/40" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchQuery && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1 rounded-lg bg-[#14151e] border border-white/[0.08] shadow-xl max-h-[240px] overflow-y-auto"
              >
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearchResultClick(r)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#667eea]/60 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-white/80 truncate">{r.title}</div>
                      {r.description && (
                        <div className="text-[9px] text-white/30 truncate">{r.description}</div>
                      )}
                    </div>
                    <span className="text-[9px] text-white/20 uppercase shrink-0">{r.type}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-1">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-all text-left group
                  ${isActive
                    ? 'bg-[#667eea]/10 text-white/95'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'}
                `}
              >
                <Icon
                  size={15}
                  className={isActive ? 'text-[#667eea]' : 'text-white/30 group-hover:text-white/50'}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate" style={{ fontWeight: isActive ? 500 : 400 }}>{sec.label}</div>
                </div>
                <ChevronRight
                  size={11}
                  className={`transition-all ${isActive ? 'text-[#667eea]/60 translate-x-0' : 'text-transparent group-hover:text-white/20 -translate-x-1'}`}
                />
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-3 border-t border-white/[0.06] space-y-1">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all"
          >
            <Download size={13} />
            <span>导出配置</span>
          </button>
          <button
            onClick={handleImport}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all"
          >
            <Upload size={13} />
            <span>导入配置</span>
          </button>
          <button
            onClick={() => {
              store.resetSettings();
              toast.success('设置已重置为默认值');
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
          >
            <RefreshCw size={13} />
            <span>重置设置</span>
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15 }}
            className="max-w-[720px] mx-auto px-8 py-6"
          >
            {activeSection === 'account' && <AccountSection />}
            {activeSection === 'general' && <GeneralSection />}
            {activeSection === 'agents' && <AgentsSection />}
            {activeSection === 'mcp' && <MCPSection />}
            {activeSection === 'models' && <ModelsSection />}
            {activeSection === 'context' && <ContextSection />}
            {activeSection === 'conversation' && <ConversationSection />}
            {activeSection === 'rules' && <RulesSkillsSection />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ================================================================
   Shared UI primitives
   ================================================================ */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[18px] text-white/90" style={{ fontWeight: 600 }}>{title}</h2>
      <p className="text-[12px] text-white/35 mt-0.5">{subtitle}</p>
    </div>
  );
}

function SettingCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 mb-3 ${className}`}>
      {children}
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-white/75" style={{ fontWeight: 500 }}>{label}</div>
        {desc && <div className="text-[10px] text-white/30 mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[#667eea]' : 'bg-white/10'}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

function SmallSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/70 focus:outline-none focus:border-[#667eea]/40 cursor-pointer appearance-none min-w-[120px]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#14151e]">{o.label}</option>
      ))}
    </select>
  );
}

function SmallInput({ value, onChange, placeholder, type = 'text', className = '' }: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#667eea]/40 ${className}`}
    />
  );
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' }) {
  const colors = {
    default: 'bg-white/[0.06] text-white/50',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    error: 'bg-red-500/10 text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] ${colors[variant]}`} style={{ fontWeight: 500 }}>
      {children}
    </span>
  );
}

/* ================================================================
   Keybindings Editor — Custom keybinding UI with conflict detection
   ================================================================ */

/** 快捷键操作名 → 中文标签映射 */
const KEYBINDING_LABELS: Record<string, string> = {
  save: '保存', undo: '撤销', redo: '重做', find: '查找', replace: '替换',
  commandPalette: '命令面板', quickOpen: '快速打开', globalSearch: '全局搜索',
  toggleSidebar: '切换侧栏', toggleTerminal: '切换终端', newFile: '新建文件',
  closeTab: '关闭标签', settings: '打开设置', aiAssist: 'AI 助手',
  preview: '预览', formatCode: '格式化代码', duplicateLine: '复制行',
  deleteLine: '删除行', toggleComment: '切换注释', selectAll: '全选',
  copy: '复��', cut: '剪切', paste: '粘贴', notifications: '通知',
};

function KeybindingsEditor({
  scheme, customKeybindings, onSchemeChange, onBindingChange,
}: {
  scheme: 'vscode' | 'custom';
  customKeybindings: Record<string, string>;
  onSchemeChange: (v: string) => void;
  onBindingChange: (bindings: Record<string, string>) => void;
}) {
  const [recordingKey, setRecordingKey] = useState<string | null>(null);

  // Merge custom onto defaults
  const resolved = { ...VSCODE_KEYBINDINGS, ...customKeybindings };

  // Conflict detection: find duplicate shortcuts
  const conflicts = useMemo(() => {
    const byShortcut: Record<string, string[]> = {};
    for (const [action, shortcut] of Object.entries(resolved)) {
      const normalized = shortcut.toLowerCase().replace(/\s+/g, '');
      if (!byShortcut[normalized]) byShortcut[normalized] = [];
      byShortcut[normalized].push(action);
    }
    const result: Record<string, string[]> = {};
    for (const [, actions] of Object.entries(byShortcut)) {
      if (actions.length > 1) {
        for (const a of actions) result[a] = actions.filter(x => x !== a);
      }
    }
    return result;
  }, [resolved]);

  // Record keyboard shortcut
  const handleKeyRecord = useCallback((e: React.KeyboardEvent, actionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    const key = e.key;
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      // Normalize special keys
      const keyMap: Record<string, string> = {
        ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
        Escape: 'Esc', Delete: 'Del', Backspace: 'Backspace', Enter: 'Enter',
        Tab: 'Tab', ' ': 'Space', '`': '`',
      };
      parts.push(keyMap[key] || (key.length === 1 ? key.toUpperCase() : key));
      const shortcut = parts.join('+');
      onBindingChange({ ...customKeybindings, [actionId]: shortcut });
      setRecordingKey(null);
    }
  }, [customKeybindings, onBindingChange]);

  const handleReset = (actionId: string) => {
    const next = { ...customKeybindings };
    delete next[actionId];
    onBindingChange(next);
  };

  return (
    <SettingCard>
      <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Keyboard size={11} />
        快捷键 Keybindings
      </div>

      <SettingRow label="快捷键方案" desc="选择键位映射方案">
        <SmallSelect
          value={scheme}
          onChange={onSchemeChange}
          options={[
            { value: 'vscode', label: 'VS Code' },
            { value: 'custom', label: '自定义' },
          ]}
        />
      </SettingRow>

      {/* Conflict warning banner */}
      {Object.keys(conflicts).length > 0 && (
        <div className="flex items-start gap-2 mt-2 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/15">
          <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="text-[10px] text-amber-400/80" style={{ lineHeight: '1.5' }}>
            检测到 {Object.keys(conflicts).length} 个快捷键冲突，相同快捷键映射到多个操作可能导致行为不一致。
          </div>
        </div>
      )}

      {/* Custom keybinding editor table */}
      {scheme === 'custom' && (
        <div className="mt-3 space-y-0.5">
          <div className="flex items-center gap-2 px-2 py-1 text-[9px] text-white/20 uppercase tracking-wider">
            <span className="w-28">操作</span>
            <span className="flex-1">快捷键</span>
            <span className="w-12 text-right">操作</span>
          </div>
          {Object.entries(VSCODE_KEYBINDINGS).map(([actionId, defaultBinding]) => {
            const current = resolved[actionId] || defaultBinding;
            const isCustomized = customKeybindings[actionId] !== undefined;
            const hasConflict = conflicts[actionId] !== undefined;
            const isRecording = recordingKey === actionId;

            return (
              <div
                key={actionId}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                  hasConflict ? 'bg-amber-500/5 border border-amber-500/10' : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* Label */}
                <div className="w-28 text-[10px] text-white/50 truncate" title={actionId}>
                  {KEYBINDING_LABELS[actionId] || actionId}
                </div>

                {/* Shortcut input */}
                <div className="flex-1">
                  <button
                    onClick={() => setRecordingKey(isRecording ? null : actionId)}
                    onKeyDown={(e) => { if (isRecording) handleKeyRecord(e, actionId); }}
                    className={`px-2 py-0.5 rounded text-[10px] border transition-colors w-full text-left ${
                      isRecording
                        ? 'bg-[#667eea]/10 border-[#667eea]/30 text-[#667eea] animate-pulse'
                        : isCustomized
                          ? 'bg-[#667eea]/5 border-[#667eea]/15 text-white/60'
                          : 'bg-white/[0.03] border-white/[0.06] text-white/40'
                    }`}
                  >
                    {isRecording ? '按下快捷键...' : current}
                  </button>
                  {/* Conflict detail */}
                  {hasConflict && (
                    <div className="text-[8px] text-amber-400/60 mt-0.5">
                      冲突: {conflicts[actionId].map(a => KEYBINDING_LABELS[a] || a).join(', ')}
                    </div>
                  )}
                </div>

                {/* Reset button */}
                <div className="w-12 text-right">
                  {isCustomized && (
                    <button
                      onClick={() => handleReset(actionId)}
                      className="text-[8px] text-white/20 hover:text-white/50 transition-colors"
                      title="恢复默认"
                    >
                      重置
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SettingCard>
  );
}

/* ================================================================
   API Key Validation — 真实 /models endpoint 探测
   ================================================================ */

/** Provider → models endpoint 映射 */
const PROVIDER_MODELS_ENDPOINTS: Record<string, string> = {
  OpenAI: 'https://api.openai.com/v1/models',
  Anthropic: 'https://api.anthropic.com/v1/models',
  '智谱 AI': 'https://open.bigmodel.cn/api/paas/v4/models',
};

/**
 * validateApiKey — 格式校验 + 真实 /models endpoint 探测
 * @returns 验证结果 { valid, message }
 */
async function validateApiKey(
  provider: string,
  apiKey: string,
): Promise<{ valid: boolean; message: string }> {
  // Step 1: 格式校验
  if (!apiKey || apiKey.trim().length < 8) {
    return { valid: false, message: 'API Key 格式不正确（过短）' };
  }

  if (provider === 'OpenAI' && !apiKey.startsWith('sk-')) {
    return { valid: false, message: 'OpenAI Key 应以 sk- 开头' };
  }

  if (provider === 'Ollama') {
    // Ollama 是本地服务，无需 API Key
    return { valid: true, message: 'Ollama 本地模式无需验证' };
  }

  // Step 2: 真实 endpoint 探测
  const endpoint = PROVIDER_MODELS_ENDPOINTS[provider];
  if (!endpoint) {
    // 未知 provider，仅做格式校验
    return { valid: true, message: '格式校验通过（未知提供商，无法在线验证）' };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 各 provider 的 auth header 不同
    if (provider === 'Anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok) {
      return { valid: true, message: '验证成功 — API Key 有效' };
    } else if (resp.status === 401 || resp.status === 403) {
      return { valid: false, message: `验证失败 — 认证被拒绝 (${resp.status})` };
    } else if (resp.status === 429) {
      return { valid: true, message: '验证通过（速率限制触发，但 Key 有效）' };
    } else {
      return { valid: false, message: `验证异常 — 服务返回 ${resp.status}` };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { valid: false, message: '验证超时 — 网络连接超时' };
    }
    // CORS or network error — common in browser env
    return { valid: true, message: '格式校验通过（浏览器 CORS 限制，无法在线验证）' };
  }
}

/* ================================================================
   Account Section
   ================================================================ */

function AccountSection() {
  const { settings, updateUserProfile } = useSettingsStore();
  const { userProfile } = settings;

  return (
    <>
      <SectionHeader title="账号信息" subtitle="Account & Profile" />

      <SettingCard>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-[20px]" style={{ fontWeight: 600 }}>
              {userProfile.username.charAt(0).toUpperCase()}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <User size={16} className="text-white/70" />
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">用户名</label>
              <SmallInput
                value={userProfile.username}
                onChange={(v) => updateUserProfile({ username: v })}
                placeholder="输入用户名"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">邮箱</label>
              <SmallInput
                value={userProfile.email}
                onChange={(v) => updateUserProfile({ email: v })}
                placeholder="输入邮箱"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">个人简介</label>
              <textarea
                value={userProfile.bio || ''}
                onChange={(e) => updateUserProfile({ bio: e.target.value })}
                placeholder="一句话介绍自己..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#667eea]/40 resize-none"
              />
            </div>
          </div>
        </div>
      </SettingCard>

      <SettingCard>
        <div className="text-[11px] text-white/30 flex items-center gap-2">
          <Shield size={13} />
          <span>用户 ID: {userProfile.id}</span>
        </div>
      </SettingCard>
    </>
  );
}

/* ================================================================
   General Section
   ================================================================ */

function GeneralSection() {
  const { settings, updateGeneralSettings } = useSettingsStore();
  const g = settings.general;

  return (
    <>
      <SectionHeader title="通用设置" subtitle="General Settings" />

      {/* Appearance */}
      <SettingCard>
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Palette size={11} />
          外观 Appearance
        </div>

        <SettingRow label="主题" desc="选择界面颜色方案">
          <div className="flex gap-1">
            {[
              { v: 'dark', icon: Moon, label: '深色' },
              { v: 'light', icon: Sun, label: '浅色' },
              { v: 'auto', icon: Monitor, label: '跟随系统' },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => updateGeneralSettings({ theme: t.v as any })}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] transition-all ${
                  g.theme === t.v ? 'bg-[#667eea]/15 text-[#667eea] border border-[#667eea]/30' : 'bg-white/[0.04] text-white/40 border border-transparent hover:bg-white/[0.06]'
                }`}
              >
                <t.icon size={11} />
                {t.label}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow label="语言" desc="界面显示语言">
          <SmallSelect
            value={g.language}
            onChange={(v) => updateGeneralSettings({ language: v as any })}
            options={[
              { value: 'zh-CN', label: '简体中文' },
              { value: 'en-US', label: 'English' },
              { value: 'ja-JP', label: '日本語' },
            ]}
          />
        </SettingRow>
      </SettingCard>

      {/* Editor */}
      <SettingCard>
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Type size={11} />
          编辑器 Editor
        </div>

        <SettingRow label="字体" desc="Monaco 编辑器字体">
          <SmallSelect
            value={g.editorFont}
            onChange={(v) => updateGeneralSettings({ editorFont: v })}
            options={[
              { value: 'Monaco', label: 'Monaco' },
              { value: 'JetBrains Mono', label: 'JetBrains Mono' },
              { value: 'Fira Code', label: 'Fira Code' },
              { value: 'Cascadia Code', label: 'Cascadia Code' },
              { value: 'Source Code Pro', label: 'Source Code Pro' },
            ]}
          />
        </SettingRow>

        <SettingRow label="字体大小" desc={`当前: ${g.editorFontSize}px`}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={10}
              max={24}
              value={g.editorFontSize}
              onChange={(e) => updateGeneralSettings({ editorFontSize: Number(e.target.value) })}
              className="w-24 accent-[#667eea]"
            />
            <span className="text-[10px] text-white/40 w-8 text-right">{g.editorFontSize}px</span>
          </div>
        </SettingRow>

        <SettingRow label="自动换行" desc="编辑器内长行自动换行">
          <Toggle checked={g.wordWrap} onChange={(v) => updateGeneralSettings({ wordWrap: v })} />
        </SettingRow>
      </SettingCard>

      {/* Keybindings */}
      <KeybindingsEditor
        scheme={g.keybindingScheme}
        customKeybindings={g.customKeybindings}
        onSchemeChange={(v) => updateGeneralSettings({ keybindingScheme: v as 'vscode' | 'custom' })}
        onBindingChange={(bindings) => updateGeneralSettings({ customKeybindings: bindings })}
      />

      {/* Other */}
      <SettingCard>
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Globe size={11} />
          其他 Other
        </div>

        <SettingRow label="本地链接打开方式">
          <SmallSelect
            value={g.localLinkOpenMode}
            onChange={(v) => updateGeneralSettings({ localLinkOpenMode: v as any })}
            options={[
              { value: 'system', label: '系统默认' },
              { value: 'builtin', label: '内置打开' },
            ]}
          />
        </SettingRow>

        <SettingRow label="Markdown 打开方式">
          <SmallSelect
            value={g.markdownOpenMode}
            onChange={(v) => updateGeneralSettings({ markdownOpenMode: v as any })}
            options={[
              { value: 'editor', label: '编辑模式' },
              { value: 'preview', label: '预览模式' },
            ]}
          />
        </SettingRow>

        <SettingRow label="Node.js 版本" desc="项目运行时版本">
          <SmallInput
            value={g.nodeVersion}
            onChange={(v) => updateGeneralSettings({ nodeVersion: v })}
            className="w-[120px]"
          />
        </SettingRow>
      </SettingCard>
    </>
  );
}

/* ================================================================
   Agents Section
   ================================================================ */

function AgentsSection() {
  const { settings, addAgent, updateAgent, removeAgent } = useSettingsStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const newAgent: AgentConfig = {
      id: `agent-${Date.now()}`,
      name: '新智能体',
      description: '',
      systemPrompt: '',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4096,
      isBuiltIn: false,
      isCustom: true,
    };
    addAgent(newAgent);
    setEditingId(newAgent.id);
    toast.success('已添加新智能体');
  };

  return (
    <>
      <SectionHeader title="智能体管理" subtitle="Agent Configuration" />

      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] text-white/30">
          共 {settings.agents.length} 个智能体
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#667eea]/10 text-[#667eea] text-[11px] hover:bg-[#667eea]/20 transition-colors"
          style={{ fontWeight: 500 }}
        >
          <Plus size={13} />
          添加智能体
        </button>
      </div>

      {settings.agents.map((agent) => (
        <SettingCard key={agent.id}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agent.isBuiltIn ? 'bg-[#667eea]/15' : 'bg-emerald-500/15'}`}>
                <Bot size={14} className={agent.isBuiltIn ? 'text-[#667eea]' : 'text-emerald-400'} />
              </div>
              <div>
                {editingId === agent.id ? (
                  <SmallInput
                    value={agent.name}
                    onChange={(v) => updateAgent(agent.id, { name: v })}
                    className="w-[200px]"
                  />
                ) : (
                  <div className="text-[12px] text-white/80" style={{ fontWeight: 500 }}>{agent.name}</div>
                )}
                <div className="text-[10px] text-white/30 mt-0.5 flex items-center gap-2">
                  {agent.isBuiltIn && <Badge>内置</Badge>}
                  {agent.isCustom && <Badge variant="success">自定义</Badge>}
                  <span>{agent.model}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditingId(editingId === agent.id ? null : agent.id)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
              >
                <Settings size={13} />
              </button>
              {!agent.isBuiltIn && (
                <button
                  onClick={() => { removeAgent(agent.id); toast.success('已删除'); }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Expanded edit */}
          <AnimatePresence>
            {editingId === agent.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-3 border-t border-white/[0.04] space-y-3">
                  <div>
                    <label className="text-[10px] text-white/30 mb-1 block">描述</label>
                    <SmallInput
                      value={agent.description || ''}
                      onChange={(v) => updateAgent(agent.id, { description: v })}
                      placeholder="智能体描述..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 mb-1 block">系统提示词</label>
                    <textarea
                      value={agent.systemPrompt}
                      onChange={(e) => updateAgent(agent.id, { systemPrompt: e.target.value })}
                      placeholder="系统提示词..."
                      rows={3}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#667eea]/40 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 mb-1 block">模型</label>
                      <SmallSelect
                        value={agent.model}
                        onChange={(v) => updateAgent(agent.id, { model: v })}
                        options={[
                          { value: 'gpt-4o', label: 'GPT-4o' },
                          { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                          { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
                          { value: 'glm-4-flash', label: 'GLM-4 Flash' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 mb-1 block">温度: {agent.temperature}</label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={agent.temperature}
                        onChange={(e) => updateAgent(agent.id, { temperature: Number(e.target.value) })}
                        className="w-24 accent-[#667eea]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 mb-1 block">最大 Tokens</label>
                      <SmallInput
                        value={agent.maxTokens}
                        onChange={(v) => updateAgent(agent.id, { maxTokens: Number(v) || 0 })}
                        type="number"
                        className="w-[80px]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SettingCard>
      ))}
    </>
  );
}

/* ================================================================
   MCP Section
   ================================================================ */

function MCPSection() {
  const { settings, addMCP, updateMCP, removeMCP } = useSettingsStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    const mcp: MCPConfig = {
      id: `mcp-${Date.now()}`,
      name: newName,
      type: 'manual',
      endpoint: newEndpoint || undefined,
      enabled: true,
      projectLevel: false,
    };
    addMCP(mcp);
    setNewName('');
    setNewEndpoint('');
    setShowAdd(false);
    toast.success('已添加 MCP 连接');
  };

  return (
    <>
      <SectionHeader title="MCP 连接管理" subtitle="Model Context Protocol" />

      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] text-white/30">
          {settings.mcpConfigs.filter(m => m.enabled).length} / {settings.mcpConfigs.length} 已启用
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#667eea]/10 text-[#667eea] text-[11px] hover:bg-[#667eea]/20 transition-colors"
          style={{ fontWeight: 500 }}
        >
          <Plus size={13} />
          添加 MCP
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <SettingCard className="border-[#667eea]/20">
              <div className="space-y-2">
                <SmallInput value={newName} onChange={setNewName} placeholder="MCP 名称" className="w-full" />
                <SmallInput value={newEndpoint} onChange={setNewEndpoint} placeholder="ws://localhost:3100/mcp/..." className="w-full" />
                <div className="flex gap-2">
                  <button onClick={handleAdd} className="px-3 py-1 rounded-lg bg-[#667eea] text-white text-[11px] hover:bg-[#667eea]/80 transition-colors">添加</button>
                  <button onClick={() => setShowAdd(false)} className="px-3 py-1 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.08] transition-colors">取消</button>
                </div>
              </div>
            </SettingCard>
          </motion.div>
        )}
      </AnimatePresence>

      {settings.mcpConfigs.map((mcp) => (
        <SettingCard key={mcp.id}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mcp.enabled ? 'bg-emerald-500/15' : 'bg-white/[0.04]'}`}>
                <Plug size={14} className={mcp.enabled ? 'text-emerald-400' : 'text-white/20'} />
              </div>
              <div>
                <div className="text-[12px] text-white/80 flex items-center gap-2" style={{ fontWeight: 500 }}>
                  {mcp.name}
                  <Badge variant={mcp.type === 'market' ? 'success' : 'default'}>
                    {mcp.type === 'market' ? '市场' : '手动'}
                  </Badge>
                  {mcp.projectLevel && <Badge variant="warning">项目级</Badge>}
                </div>
                {mcp.endpoint && (
                  <div className="text-[10px] text-white/25 mt-0.5 font-mono">{mcp.endpoint}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Toggle checked={mcp.enabled} onChange={(v) => updateMCP(mcp.id, { enabled: v })} />
              <button
                onClick={() => { removeMCP(mcp.id); toast.success('已删除'); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </SettingCard>
      ))}
    </>
  );
}

/* ================================================================
   Models Section
   ================================================================ */

function ModelsSection() {
  const { settings, addModel, updateModel, removeModel } = useSettingsStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [validationResults, setValidationResults] = useState<Record<string, { valid: boolean; message: string }>>({});

  const handleValidate = async (model: ModelConfig) => {
    setValidating(prev => ({ ...prev, [model.id]: true }));
    setValidationResults(prev => { const next = { ...prev }; delete next[model.id]; return next; });
    try {
      const result = await validateApiKey(model.provider, model.apiKey);
      setValidationResults(prev => ({ ...prev, [model.id]: result }));
      if (result.valid) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      setValidationResults(prev => ({ ...prev, [model.id]: { valid: false, message: '验证过程出错' } }));
    } finally {
      setValidating(prev => ({ ...prev, [model.id]: false }));
    }
  };

  const providerLinks: Record<string, string> = {
    OpenAI: 'https://platform.openai.com/api-keys',
    Anthropic: 'https://console.anthropic.com/settings/keys',
    '智谱 AI': 'https://open.bigmodel.cn/usercenter/apikeys',
  };

  const handleAdd = () => {
    const m: ModelConfig = {
      id: `model-${Date.now()}`,
      provider: 'OpenAI',
      model: 'gpt-4o-mini',
      apiKey: '',
      enabled: false,
    };
    addModel(m);
    toast.success('已添加模型');
  };

  return (
    <>
      <SectionHeader title="模型配置" subtitle="Model Configuration" />

      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] text-white/30">
          {settings.models.filter(m => m.enabled).length} / {settings.models.length} 已启用
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#667eea]/10 text-[#667eea] text-[11px] hover:bg-[#667eea]/20 transition-colors"
          style={{ fontWeight: 500 }}
        >
          <Plus size={13} />
          添加模型
        </button>
      </div>

      {settings.models.map((model) => (
        <SettingCard key={model.id}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${model.enabled ? 'bg-[#667eea]/15' : 'bg-white/[0.04]'}`}>
                <Cpu size={14} className={model.enabled ? 'text-[#667eea]' : 'text-white/20'} />
              </div>
              <div>
                <div className="text-[12px] text-white/80" style={{ fontWeight: 500 }}>{model.provider}</div>
                <div className="text-[10px] text-white/30">{model.model}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Toggle checked={model.enabled} onChange={(v) => updateModel(model.id, { enabled: v })} />
              <button
                onClick={() => { removeModel(model.id); toast.success('已删��'); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-2">
            <SmallSelect
              value={model.provider}
              onChange={(v) => updateModel(model.id, { provider: v })}
              options={[
                { value: 'OpenAI', label: 'OpenAI' },
                { value: 'Anthropic', label: 'Anthropic' },
                { value: '智谱 AI', label: '智谱 AI' },
                { value: 'Ollama', label: 'Ollama (本地)' },
              ]}
            />
            <SmallInput
              value={model.model}
              onChange={(v) => updateModel(model.id, { model: v })}
              placeholder="模型名称"
              className="flex-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SmallInput
                value={model.apiKey}
                onChange={(v) => updateModel(model.id, { apiKey: v })}
                placeholder="API Key"
                type={showKeys[model.id] ? 'text' : 'password'}
                className="w-full pr-8"
              />
              <button
                onClick={() => setShowKeys({ ...showKeys, [model.id]: !showKeys[model.id] })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
              >
                {showKeys[model.id] ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            {providerLinks[model.provider] && (
              <a
                href={providerLinks[model.provider]}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors"
                title="获取 API Key"
              >
                <ExternalLink size={13} />
              </a>
            )}
            {/* Validate API Key */}
            <button
              onClick={() => handleValidate(model)}
              disabled={!model.apiKey || validating[model.id]}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors ${
                !model.apiKey
                  ? 'bg-white/[0.03] text-white/15 cursor-not-allowed'
                  : validating[model.id]
                    ? 'bg-[#667eea]/10 text-[#667eea]/60 cursor-wait'
                    : 'bg-[#667eea]/10 text-[#667eea] hover:bg-[#667eea]/20'
              }`}
              title="测试连接"
            >
              {validating[model.id]
                ? <Loader size={11} className="animate-spin" />
                : <Zap size={11} />
              }
              {validating[model.id] ? '验证中' : '测试'}
            </button>
          </div>
          {/* Validation result */}
          {validationResults[model.id] && (
            <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${
              validationResults[model.id].valid ? 'text-emerald-400/80' : 'text-red-400/80'
            }`}>
              {validationResults[model.id].valid
                ? <CheckCircle2 size={11} />
                : <AlertTriangle size={11} />
              }
              {validationResults[model.id].message}
            </div>
          )}
        </SettingCard>
      ))}
    </>
  );
}

/* ================================================================
   Context Section
   ================================================================ */

function ContextSection() {
  const { settings, updateContextSettings } = useSettingsStore();
  const ctx = settings.context;
  const [newRule, setNewRule] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  const statusMap = {
    idle: { label: '未索引', variant: 'default' as const },
    indexing: { label: '索引中...', variant: 'warning' as const },
    completed: { label: '已完成', variant: 'success' as const },
    error: { label: '出错', variant: 'error' as const },
  };

  const handleAddIgnoreRule = () => {
    if (!newRule.trim()) return;
    updateContextSettings({ ignoreRules: [...ctx.ignoreRules, newRule.trim()] });
    setNewRule('');
  };

  const handleAddDoc = () => {
    if (!newDocName.trim()) return;
    const doc = { id: `doc-${Date.now()}`, name: newDocName, source: 'url' as const, url: newDocUrl, enabled: true };
    updateContextSettings({ documentSets: [...ctx.documentSets, doc] });
    setNewDocName('');
    setNewDocUrl('');
  };

  return (
    <>
      <SectionHeader title="上下文管理" subtitle="Context & Indexing" />

      {/* Index Status */}
      <SettingCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#667eea]/15 flex items-center justify-center">
              <Database size={14} className="text-[#667eea]" />
            </div>
            <div>
              <div className="text-[12px] text-white/80" style={{ fontWeight: 500 }}>代码索引</div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={statusMap[ctx.indexStatus].variant}>{statusMap[ctx.indexStatus].label}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                updateContextSettings({ indexStatus: 'indexing' });
                setTimeout(() => updateContextSettings({ indexStatus: 'completed' }), 2000);
                toast.success('开始索引...');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] text-[10px] text-white/50 hover:bg-white/[0.08] transition-colors"
            >
              <RefreshCw size={11} />
              刷新
            </button>
          </div>
        </div>
      </SettingCard>

      {/* Ignore Rules */}
      <SettingCard>
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FolderOpen size={11} />
          忽略规则 Ignore Rules
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {ctx.ignoreRules.map((rule, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-white/50 font-mono">
              {rule}
              <button
                onClick={() => updateContextSettings({ ignoreRules: ctx.ignoreRules.filter((_, j) => j !== i) })}
                className="text-white/20 hover:text-red-400"
              >
                <X size={9} />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <SmallInput value={newRule} onChange={setNewRule} placeholder="添加忽略规则..." className="flex-1" />
          <button onClick={handleAddIgnoreRule} className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-[10px] text-white/40 hover:bg-white/[0.08]">添加</button>
        </div>
      </SettingCard>

      {/* Document Sets */}
      <SettingCard>
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <BookOpen size={11} />
          文档集 Document Sets
        </div>

        {ctx.documentSets.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
            <div className="flex items-center gap-2">
              <FileText size={13} className="text-white/20" />
              <div>
                <div className="text-[11px] text-white/70">{doc.name}</div>
                {doc.url && <div className="text-[9px] text-white/25 font-mono">{doc.url}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Toggle
                checked={doc.enabled}
                onChange={(v) => {
                  updateContextSettings({
                    documentSets: ctx.documentSets.map(d => d.id === doc.id ? { ...d, enabled: v } : d),
                  });
                }}
              />
              <button
                onClick={() => updateContextSettings({ documentSets: ctx.documentSets.filter(d => d.id !== doc.id) })}
                className="p-1 rounded text-white/20 hover:text-red-400"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-2 mt-3">
          <SmallInput value={newDocName} onChange={setNewDocName} placeholder="文档名称" className="flex-1" />
          <SmallInput value={newDocUrl} onChange={setNewDocUrl} placeholder="URL" className="flex-1" />
          <button onClick={handleAddDoc} className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-[10px] text-white/40 hover:bg-white/[0.08]">添加</button>
        </div>
      </SettingCard>
    </>
  );
}

/* ================================================================
   Conversation Section
   ================================================================ */

function ConversationSection() {
  const { settings, updateConversationSettings } = useSettingsStore();
  const c = settings.conversation;
  const [newCmd, setNewCmd] = useState('');

  return (
    <>
      <SectionHeader title="对话流设置" subtitle="Conversation Flow" />

      {/* Behavior */}
      <SettingCard>
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap size={11} />
          行为 Behavior
        </div>

        <SettingRow label="使用待办清单" desc="AI 自动生成待办事项跟踪">
          <Toggle checked={c.useTodoList} onChange={(v) => updateConversationSettings({ useTodoList: v })} />
        </SettingRow>

        <SettingRow label="自动折叠对话节点" desc="已完成的对话自动折叠">
          <Toggle checked={c.autoCollapseNodes} onChange={(v) => updateConversationSettings({ autoCollapseNodes: v })} />
        </SettingRow>

        <SettingRow label="自动修复代码规范" desc="AI 检测到问题时自动修复">
          <Toggle checked={c.autoFixCodeIssues} onChange={(v) => updateConversationSettings({ autoFixCodeIssues: v })} />
        </SettingRow>

        <SettingRow label="智能体主动提问" desc="AI 在信息不足时主动询问">
          <Toggle checked={c.agentProactiveQuestion} onChange={(v) => updateConversationSettings({ agentProactiveQuestion: v })} />
        </SettingRow>
      </SettingCard>

      {/* Code Review */}
      <SettingCard>
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FileText size={11} />
          代码审查 Code Review
        </div>

        <SettingRow label="审查范围">
          <SmallSelect
            value={c.codeReviewScope}
            onChange={(v) => updateConversationSettings({ codeReviewScope: v as any })}
            options={[
              { value: 'all', label: '全部文件' },
              { value: 'changed', label: '仅变更文件' },
              { value: 'none', label: '不审查' },
            ]}
          />
        </SettingRow>

        <SettingRow label="审查后跳转" desc="审查完成后自动跳转到问题位置">
          <Toggle checked={c.jumpAfterReview} onChange={(v) => updateConversationSettings({ jumpAfterReview: v })} />
        </SettingRow>
      </SettingCard>

      {/* Command Execution */}
      <SettingCard>
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Terminal size={11} />
          命令执行 Command Execution
        </div>

        <SettingRow label="自动运行 MCP" desc="AI 可自动调用 MCP 工具">
          <Toggle checked={c.autoRunMCP} onChange={(v) => updateConversationSettings({ autoRunMCP: v })} />
        </SettingRow>

        <SettingRow label="命令运行方式">
          <SmallSelect
            value={c.commandRunMode}
            onChange={(v) => updateConversationSettings({ commandRunMode: v as any })}
            options={[
              { value: 'sandbox', label: '沙箱模式' },
              { value: 'direct', label: '直接执行' },
            ]}
          />
        </SettingRow>

        <div className="mt-3">
          <div className="text-[10px] text-white/30 mb-2">白名单命令</div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {c.whitelistCommands.map((cmd, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] text-emerald-400 font-mono">
                {cmd}
                <button
                  onClick={() => updateConversationSettings({
                    whitelistCommands: c.whitelistCommands.filter((_, j) => j !== i),
                  })}
                  className="text-emerald-400/40 hover:text-red-400"
                >
                  <X size={9} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <SmallInput value={newCmd} onChange={setNewCmd} placeholder="npm run ..." className="flex-1" />
            <button
              onClick={() => {
                if (newCmd.trim()) {
                  updateConversationSettings({ whitelistCommands: [...c.whitelistCommands, newCmd.trim()] });
                  setNewCmd('');
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-[10px] text-white/40 hover:bg-white/[0.08]"
            >
              添加
            </button>
          </div>
        </div>
      </SettingCard>

      {/* Notifications */}
      <SettingCard>
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Bell size={11} />
          通知 Notifications
        </div>

        <SettingRow label="横幅通知">
          <Toggle
            checked={c.notificationTypes.includes('banner')}
            onChange={(v) => {
              const types = v
                ? [...c.notificationTypes, 'banner' as const]
                : c.notificationTypes.filter(t => t !== 'banner');
              updateConversationSettings({ notificationTypes: types });
            }}
          />
        </SettingRow>

        <SettingRow label="声音提醒">
          <Toggle
            checked={c.notificationTypes.includes('sound')}
            onChange={(v) => {
              const types = v
                ? [...c.notificationTypes, 'sound' as const]
                : c.notificationTypes.filter(t => t !== 'sound');
              updateConversationSettings({ notificationTypes: types });
            }}
          />
        </SettingRow>

        <SettingRow label="音量" desc={`${c.volume}%`}>
          <div className="flex items-center gap-2">
            {c.volume > 0 ? <Volume2 size={13} className="text-white/30" /> : <VolumeX size={13} className="text-white/20" />}
            <input
              type="range"
              min={0}
              max={100}
              value={c.volume}
              onChange={(e) => updateConversationSettings({ volume: Number(e.target.value) })}
              className="w-24 accent-[#667eea]"
            />
          </div>
        </SettingRow>
      </SettingCard>
    </>
  );
}

/* ================================================================
   Rules & Skills Section
   ================================================================ */

function RulesSkillsSection() {
  const { settings, addRule, updateRule, removeRule, addSkill, updateSkill, removeSkill, updateImportSettings } = useSettingsStore();
  const [tab, setTab] = useState<'rules' | 'skills' | 'import'>('rules');

  const handleAddRule = () => {
    const r: RuleConfig = {
      id: `rule-${Date.now()}`,
      name: '新规则',
      content: '',
      scope: 'personal',
      enabled: true,
    };
    addRule(r);
    toast.success('已添加规则');
  };

  const handleAddSkill = () => {
    const s: SkillConfig = {
      id: `skill-${Date.now()}`,
      name: '新技能',
      description: '',
      content: '',
      scope: 'global',
      enabled: true,
    };
    addSkill(s);
    toast.success('已添加技能');
  };

  return (
    <>
      <SectionHeader title="规则与技能" subtitle="Rules, Skills & Import" />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        {[
          { id: 'rules' as const, label: '规则', icon: Shield },
          { id: 'skills' as const, label: '技能', icon: Zap },
          { id: 'import' as const, label: '导入', icon: Download },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] transition-all ${
              tab === t.id ? 'bg-[#667eea]/15 text-[#667eea]' : 'text-white/35 hover:text-white/50'
            }`}
            style={{ fontWeight: tab === t.id ? 500 : 400 }}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Rules */}
      {tab === 'rules' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] text-white/30">{settings.rules.length} 条规则</div>
            <button
              onClick={handleAddRule}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#667eea]/10 text-[#667eea] text-[11px] hover:bg-[#667eea]/20 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Plus size={13} />
              添加规则
            </button>
          </div>

          {settings.rules.map((rule) => (
            <SettingCard key={rule.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-white/30" />
                  <SmallInput
                    value={rule.name}
                    onChange={(v) => updateRule(rule.id, { name: v })}
                    className="bg-transparent border-none text-[12px] p-0 focus:bg-white/[0.04]"
                  />
                  <Badge variant={rule.scope === 'project' ? 'warning' : 'default'}>
                    {rule.scope === 'project' ? '项目' : '个人'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle checked={rule.enabled} onChange={(v) => updateRule(rule.id, { enabled: v })} />
                  <button
                    onClick={() => { removeRule(rule.id); toast.success('已删除'); }}
                    className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <textarea
                value={rule.content}
                onChange={(e) => updateRule(rule.id, { content: e.target.value })}
                placeholder="规则内容..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[10px] text-white/50 placeholder:text-white/15 focus:outline-none focus:border-[#667eea]/30 resize-none"
              />
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => updateRule(rule.id, { scope: 'personal' })}
                  className={`px-2 py-0.5 rounded text-[9px] transition-all ${rule.scope === 'personal' ? 'bg-white/[0.06] text-white/50' : 'text-white/20 hover:text-white/40'}`}
                >
                  个人
                </button>
                <button
                  onClick={() => updateRule(rule.id, { scope: 'project' })}
                  className={`px-2 py-0.5 rounded text-[9px] transition-all ${rule.scope === 'project' ? 'bg-amber-500/10 text-amber-400' : 'text-white/20 hover:text-white/40'}`}
                >
                  项目
                </button>
              </div>
            </SettingCard>
          ))}
        </>
      )}

      {/* Skills */}
      {tab === 'skills' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] text-white/30">{settings.skills.length} 个技能</div>
            <button
              onClick={handleAddSkill}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#667eea]/10 text-[#667eea] text-[11px] hover:bg-[#667eea]/20 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Plus size={13} />
              添加技能
            </button>
          </div>

          {settings.skills.map((skill) => (
            <SettingCard key={skill.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap size={13} className="text-amber-400/50" />
                  <SmallInput
                    value={skill.name}
                    onChange={(v) => updateSkill(skill.id, { name: v })}
                    className="bg-transparent border-none text-[12px] p-0 focus:bg-white/[0.04]"
                  />
                  <Badge variant={skill.scope === 'global' ? 'success' : 'warning'}>
                    {skill.scope === 'global' ? '全局' : '项目'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle checked={skill.enabled} onChange={(v) => updateSkill(skill.id, { enabled: v })} />
                  <button
                    onClick={() => { removeSkill(skill.id); toast.success('已删除'); }}
                    className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <SmallInput
                value={skill.description || ''}
                onChange={(v) => updateSkill(skill.id, { description: v })}
                placeholder="技能描述..."
                className="w-full mb-2"
              />
              <textarea
                value={skill.content}
                onChange={(e) => updateSkill(skill.id, { content: e.target.value })}
                placeholder="技能内容..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[10px] text-white/50 placeholder:text-white/15 focus:outline-none focus:border-[#667eea]/30 resize-none"
              />
            </SettingCard>
          ))}
        </>
      )}

      {/* Import Settings */}
      {tab === 'import' && (
        <>
          <SettingCard>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">导入选项</div>
            <SettingRow label="包含 AGENTS.md" desc="导入时包含 AGENTS.md 配置">
              <Toggle
                checked={settings.importSettings.includeAgentsMD}
                onChange={(v) => updateImportSettings({ includeAgentsMD: v })}
              />
            </SettingRow>
            <SettingRow label="包含 CLAUDE.md" desc="导入时包含 CLAUDE.md 配置">
              <Toggle
                checked={settings.importSettings.includeClaudeMD}
                onChange={(v) => updateImportSettings({ includeClaudeMD: v })}
              />
            </SettingRow>
          </SettingCard>

          <SettingCard>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">从其他工具导入</div>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-white/50 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all">
                <Upload size={14} />
                <div className="text-left">
                  <div style={{ fontWeight: 500 }}>VS Code</div>
                  <div className="text-[9px] text-white/25">settings.json</div>
                </div>
              </button>
              <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-white/50 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all">
                <Upload size={14} />
                <div className="text-left">
                  <div style={{ fontWeight: 500 }}>Cursor</div>
                  <div className="text-[9px] text-white/25">cursor.json</div>
                </div>
              </button>
            </div>
          </SettingCard>
        </>
      )}
    </>
  );
}
