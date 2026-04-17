/**
 * @file BrandingPanel.tsx
 * @description YYC³ 品牌身份管理面板 — Logo/头像/标语/SEO/联系信息/用户档案/版权 全量配置 UI
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags branding, logo, avatar, slogan, seo, contact, ui
 */

import { useState, useRef } from 'react'
import {
  Image as ImageIcon, User, MessageSquare, Search, Mail, Shield,
  Globe, Github, Twitter, Linkedin, Hash,
  RotateCcw, Download, Upload, Eye, EyeOff, Copy, Check,
  Sparkles, Heart, ExternalLink, ChevronRight,
  Palette, Type, AtSign, FileText, Copyright,
} from 'lucide-react'
import {
  useBrandingStore,
  DEFAULT_BRANDING,
  type BrandingSection,
  type LogoConfig,
  type AvatarConfig,
  type SloganConfig,
  type SEOConfig,
  type ContactConfig,
  type UserProfileConfig,
  type CopyrightConfig,
} from '../../stores/branding-store'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import { toast } from 'sonner'

// ============================================
// Section navigation items
// ============================================

interface NavItem {
  id: BrandingSection
  icon: React.ElementType
  labelKey: string
  fallback: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', icon: Sparkles, labelKey: 'branding.overview', fallback: 'Overview' },
  { id: 'logo', icon: ImageIcon, labelKey: 'branding.logo', fallback: 'Logo' },
  { id: 'avatar', icon: User, labelKey: 'branding.avatar', fallback: 'Avatar' },
  { id: 'slogan', icon: MessageSquare, labelKey: 'branding.slogan', fallback: 'Slogan' },
  { id: 'seo', icon: Search, labelKey: 'branding.seo', fallback: 'SEO' },
  { id: 'contact', icon: Mail, labelKey: 'branding.contact', fallback: 'Contact' },
  { id: 'user', icon: User, labelKey: 'branding.userProfile', fallback: 'User Profile' },
  { id: 'copyright', icon: Copyright, labelKey: 'branding.copyright', fallback: 'Copyright' },
]

// ============================================
// Shared UI Components
// ============================================

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <div className="text-[13px] text-white/80" style={{ fontWeight: 500 }}>{title}</div>
      <div className="text-[10px] text-white/30 mt-0.5" style={{ fontWeight: 400 }}>{desc}</div>
    </div>
  )
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-1.5">
      <span className="text-[11px] text-white/50" style={{ fontWeight: 400 }}>{label}</span>
      {hint && <span className="text-[9px] text-white/20" style={{ fontWeight: 400 }}>{hint}</span>}
    </div>
  )
}

function TextInput({
  value, onChange, placeholder, mono,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean
}) {
  const { isLG } = useLiquidGlass()
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg text-[11px] text-white/70 placeholder:text-white/20
        border transition-colors focus:outline-none ${mono ? 'font-mono' : ''}
        ${isLG
          ? 'bg-white/[0.03] border-emerald-500/[0.08] focus:border-emerald-500/30'
          : 'bg-white/[0.04] border-white/[0.08] focus:border-violet-500/40'
        }`}
      style={{ fontWeight: 400 }}
    />
  )
}

function NumberSlider({
  value, onChange, min, max, step, label, unit,
}: {
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number; label: string; unit?: string
}) {
  const { isLG } = useLiquidGlass()
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-white/50" style={{ fontWeight: 400 }}>{label}</span>
        <span className="text-[10px] text-white/30 font-mono" style={{ fontWeight: 400 }}>
          {value}{unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step || 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer
          ${isLG ? 'accent-emerald-500' : 'accent-violet-500'}
          bg-white/[0.08]`}
      />
    </div>
  )
}

function ToggleSwitch({
  value, onChange, label, desc,
}: {
  value: boolean; onChange: (v: boolean) => void; label: string; desc?: string
}) {
  const { isLG } = useLiquidGlass()
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full relative transition-colors shrink-0
          ${value ? (isLG ? 'bg-emerald-500' : 'bg-violet-500') : 'bg-white/10'}`}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ left: value ? '22px' : '2px' }}
        />
      </button>
      <div className="min-w-0">
        <div className="text-[11px] text-white/60" style={{ fontWeight: 400 }}>{label}</div>
        {desc && <div className="text-[9px] text-white/25" style={{ fontWeight: 400 }}>{desc}</div>}
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

// ============================================
// Section: Overview
// ============================================

function OverviewSection() {
  const { config } = useBrandingStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const stats = [
    { label: t('branding.appName', 'branding') || 'App Name', value: config.appName },
    { label: t('branding.version', 'branding') || 'Version', value: config.appVersion },
    { label: t('branding.license', 'branding') || 'License', value: config.copyright.license },
    { label: t('branding.owner', 'branding') || 'Owner', value: config.copyright.owner },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader
        title={t('branding.overviewTitle', 'branding') || 'Brand Identity Overview'}
        desc={t('branding.overviewDesc', 'branding') || 'Complete brand configuration for YYC³ Family AI'}
      />

      {/* Brand Card Preview */}
      <div
        className="relative rounded-2xl border overflow-hidden p-6"
        style={{
          background: isLG
            ? 'linear-gradient(135deg, rgba(0,255,135,0.06) 0%, rgba(6,182,212,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(236,72,153,0.04) 100%)',
          borderColor: isLG ? 'rgba(0,255,135,0.1)' : 'rgba(139,92,246,0.1)',
        }}
      >
        {/* Logo + Name */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center rounded-xl overflow-hidden"
            style={{
              width: 48, height: 48,
              background: isLG
                ? 'linear-gradient(135deg, rgba(0,255,135,0.15), rgba(6,182,212,0.15))'
                : 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))',
              border: `1px solid ${isLG ? 'rgba(0,255,135,0.15)' : 'rgba(139,92,246,0.15)'}`,
            }}
          >
            {config.logo.url ? (
              <img src={config.logo.url} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <Sparkles className={`w-5 h-5 ${isLG ? 'text-emerald-400' : 'text-violet-400'}`} />
            )}
          </div>
          <div>
            <div className="text-[16px] text-white/90" style={{ fontWeight: 600 }}>{config.appName}</div>
            <div className="text-[10px] text-white/30" style={{ fontWeight: 400 }}>v{config.appVersion}</div>
          </div>
        </div>

        {/* Slogan */}
        <div className="mb-4 pl-1">
          <div className="text-[12px] text-white/60 mb-0.5" style={{ fontWeight: 500 }}>
            {config.slogan.primary.zh}
          </div>
          <div className="text-[10px] text-white/25 italic" style={{ fontWeight: 400 }}>
            {config.slogan.primary.en}
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs shrink-0"
            style={{
              background: `linear-gradient(135deg, ${config.user.gradientFrom}, ${config.user.gradientTo})`,
            }}
          >
            {config.user.initials}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] text-white/80" style={{ fontWeight: 500 }}>{config.user.displayName}</div>
            <div className="text-[10px] text-white/30" style={{ fontWeight: 400 }}>{config.user.role}</div>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ml-auto shrink-0 ${
            config.avatar.status === 'online' ? 'bg-emerald-400' :
            config.avatar.status === 'busy' ? 'bg-red-400' :
            config.avatar.status === 'away' ? 'bg-amber-400' : 'bg-gray-500'
          }`} style={{ boxShadow: `0 0 6px ${
            config.avatar.status === 'online' ? 'rgba(52,211,153,0.5)' :
            config.avatar.status === 'busy' ? 'rgba(248,113,113,0.5)' :
            config.avatar.status === 'away' ? 'rgba(251,191,36,0.5)' : 'rgba(107,114,128,0.3)'
          }` }} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <div className="text-[9px] text-white/25 uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>{s.label}</div>
            <div className="text-[12px] text-white/70" style={{ fontWeight: 400 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Contact Quick View */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-white/25 uppercase tracking-wider" style={{ fontWeight: 500 }}>
          {t('branding.contactInfo', 'branding') || 'Contact'}
        </div>
        {config.contact.email && (
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Mail className="w-3 h-3" /> {config.contact.email}
            <CopyButton text={config.contact.email} />
          </div>
        )}
        {config.contact.website && (
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Globe className="w-3 h-3" /> {config.contact.website}
            <CopyButton text={config.contact.website} />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Section: Logo
// ============================================

function LogoSection() {
  const { config, updateLogo } = useBrandingStore()
  const { isLG } = useLiquidGlass()
  const logo = config.logo

  return (
    <div className="space-y-5">
      <SectionHeader title="Logo Configuration" desc="Upload and configure your application logo" />

      {/* Preview */}
      <div className="flex items-center justify-center p-8 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex flex-col items-center gap-4">
          {/* Logo preview at different sizes */}
          <div className="flex items-end gap-6">
            {[24, 40, 64].map((sz) => (
              <div key={sz} className="flex flex-col items-center gap-2">
                <div
                  className="flex items-center justify-center overflow-hidden"
                  style={{
                    width: sz, height: sz,
                    borderRadius: logo.radius,
                    opacity: logo.opacity / 100,
                    background: isLG
                      ? 'rgba(0,255,135,0.08)'
                      : 'rgba(139,92,246,0.08)',
                    border: `1px solid ${isLG ? 'rgba(0,255,135,0.12)' : 'rgba(139,92,246,0.12)'}`,
                  }}
                >
                  {logo.url ? (
                    <img src={logo.url} alt="Logo" className="object-contain" style={{ width: sz * 0.7, height: sz * 0.7 }} />
                  ) : (
                    <Sparkles className={`${isLG ? 'text-emerald-400' : 'text-violet-400'}`} style={{ width: sz * 0.45, height: sz * 0.45 }} />
                  )}
                </div>
                <span className="text-[9px] text-white/20 font-mono">{sz}px</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div>
        <FieldLabel label="Logo URL" hint="SVG, PNG, WebP recommended" />
        <TextInput value={logo.url} onChange={(v) => updateLogo({ url: v })} placeholder="https://example.com/logo.svg" mono />
      </div>

      {/* Size & Radius */}
      <div className="grid grid-cols-2 gap-4">
        <NumberSlider value={logo.size} onChange={(v) => updateLogo({ size: v })} min={16} max={128} label="Size" unit="px" />
        <NumberSlider value={logo.radius} onChange={(v) => updateLogo({ radius: v })} min={0} max={64} label="Radius" unit="px" />
      </div>

      {/* Opacity */}
      <NumberSlider value={logo.opacity} onChange={(v) => updateLogo({ opacity: v })} min={0} max={100} label="Opacity" unit="%" />

      {/* Animation */}
      <ToggleSwitch value={logo.animated} onChange={(v) => updateLogo({ animated: v })} label="Animated Logo" desc="Enable float/pulse animation" />

      {logo.animated && (
        <div>
          <FieldLabel label="Animation Type" />
          <div className="flex gap-2">
            {(['float', 'pulse', 'none'] as const).map((type) => (
              <button
                key={type}
                onClick={() => updateLogo({ animationType: type })}
                className={`px-3 py-1.5 rounded-lg text-[10px] border transition-colors ${
                  logo.animationType === type
                    ? (isLG ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-violet-500/15 border-violet-500/30 text-violet-400')
                    : 'border-white/[0.06] text-white/30 hover:text-white/50'
                }`}
                style={{ fontWeight: 400 }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Link URL */}
      <div>
        <FieldLabel label="Click URL" hint="Logo click target" />
        <TextInput value={logo.linkUrl} onChange={(v) => updateLogo({ linkUrl: v })} placeholder="/" />
      </div>
    </div>
  )
}

// ============================================
// Section: Avatar
// ============================================

function AvatarSection() {
  const { config, updateAvatar } = useBrandingStore()
  const { isLG } = useLiquidGlass()
  const avatar = config.avatar
  const user = config.user

  return (
    <div className="space-y-5">
      <SectionHeader title="Avatar Configuration" desc="Configure user avatar appearance and status" />

      {/* Preview */}
      <div className="flex items-center justify-center p-8 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-end gap-6">
          {[24, 32, 40, 56, 80].map((sz) => (
            <div key={sz} className="flex flex-col items-center gap-2">
              <div className="relative">
                <div
                  className="flex items-center justify-center overflow-hidden transition-transform hover:scale-110"
                  style={{
                    width: sz, height: sz,
                    borderRadius: avatar.radius,
                    borderWidth: avatar.borderWidth,
                    borderStyle: 'solid',
                    borderColor: avatar.borderColor,
                    opacity: avatar.opacity / 100,
                    background: avatar.url
                      ? 'transparent'
                      : `linear-gradient(135deg, ${user.gradientFrom}, ${user.gradientTo})`,
                  }}
                >
                  {avatar.url ? (
                    <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover" style={{ borderRadius: avatar.radius }} />
                  ) : (
                    <span className="text-white" style={{ fontSize: Math.max(sz * 0.3, 8) }}>{user.initials}</span>
                  )}
                </div>
                {avatar.statusIndicator && sz >= 32 && (
                  <div
                    className="absolute bottom-0 right-0 rounded-full border-2"
                    style={{
                      width: Math.max(sz * 0.25, 8), height: Math.max(sz * 0.25, 8),
                      borderColor: 'rgba(10,10,15,0.9)',
                      background: avatar.status === 'online' ? '#34d399' :
                        avatar.status === 'busy' ? '#f87171' :
                        avatar.status === 'away' ? '#fbbf24' : '#6b7280',
                      boxShadow: `0 0 6px ${
                        avatar.status === 'online' ? 'rgba(52,211,153,0.5)' :
                        avatar.status === 'busy' ? 'rgba(248,113,113,0.5)' :
                        avatar.status === 'away' ? 'rgba(251,191,36,0.5)' : 'rgba(107,114,128,0.3)'
                      }`,
                    }}
                  />
                )}
              </div>
              <span className="text-[9px] text-white/20 font-mono">{sz}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* URL */}
      <div>
        <FieldLabel label="Avatar Image URL" hint="PNG, JPG, WebP" />
        <TextInput value={avatar.url} onChange={(v) => updateAvatar({ url: v })} placeholder="https://example.com/avatar.png" mono />
      </div>

      {/* Size & Radius */}
      <div className="grid grid-cols-2 gap-4">
        <NumberSlider value={avatar.size} onChange={(v) => updateAvatar({ size: v })} min={16} max={120} label="Size" unit="px" />
        <NumberSlider value={avatar.radius} onChange={(v) => updateAvatar({ radius: v })} min={0} max={9999} step={avatar.radius > 64 ? 100 : 1} label="Radius" unit="px" />
      </div>

      {/* Border */}
      <div className="grid grid-cols-2 gap-4">
        <NumberSlider value={avatar.borderWidth} onChange={(v) => updateAvatar({ borderWidth: v })} min={0} max={6} label="Border Width" unit="px" />
        <NumberSlider value={avatar.opacity} onChange={(v) => updateAvatar({ opacity: v })} min={0} max={100} label="Opacity" unit="%" />
      </div>

      {/* Status */}
      <ToggleSwitch value={avatar.statusIndicator} onChange={(v) => updateAvatar({ statusIndicator: v })} label="Status Indicator" desc="Show online/offline status dot" />

      {avatar.statusIndicator && (
        <div>
          <FieldLabel label="Status" />
          <div className="flex gap-2">
            {(['online', 'busy', 'away', 'offline'] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateAvatar({ status: s })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] border transition-colors ${
                  avatar.status === s
                    ? (isLG ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-violet-500/15 border-violet-500/30 text-violet-400')
                    : 'border-white/[0.06] text-white/30 hover:text-white/50'
                }`}
                style={{ fontWeight: 400 }}
              >
                <div className={`w-2 h-2 rounded-full ${
                  s === 'online' ? 'bg-emerald-400' : s === 'busy' ? 'bg-red-400' : s === 'away' ? 'bg-amber-400' : 'bg-gray-500'
                }`} />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Section: Slogan
// ============================================

function SloganSection() {
  const { config, updateSlogan } = useBrandingStore()
  const { isLG } = useLiquidGlass()
  const slogan = config.slogan

  return (
    <div className="space-y-5">
      <SectionHeader title="Slogan Configuration" desc="Primary and secondary slogans with i18n support" />

      {/* Preview */}
      <div
        className="p-5 rounded-xl border"
        style={{
          background: isLG ? 'rgba(0,255,135,0.04)' : 'rgba(139,92,246,0.04)',
          borderColor: isLG ? 'rgba(0,255,135,0.08)' : 'rgba(139,92,246,0.08)',
        }}
      >
        <div className="text-[15px] text-white/80 mb-1" style={{ fontWeight: 600 }}>
          {slogan.primary.zh}
        </div>
        <div className="text-[11px] text-white/35 italic mb-3" style={{ fontWeight: 400 }}>
          {slogan.primary.en}
        </div>
        <div className="text-[11px] text-white/50 mb-0.5" style={{ fontWeight: 400 }}>
          {slogan.secondary.zh}
        </div>
        <div className="text-[10px] text-white/20 italic" style={{ fontWeight: 400 }}>
          {slogan.secondary.en}
        </div>
      </div>

      {/* Primary Slogan */}
      <div className="space-y-3">
        <div className="text-[10px] text-white/25 uppercase tracking-wider" style={{ fontWeight: 500 }}>Primary Slogan</div>
        <div>
          <FieldLabel label="Chinese" />
          <TextInput
            value={slogan.primary.zh}
            onChange={(v) => updateSlogan({ primary: { zh: v, en: slogan.primary.en } })}
            placeholder="主标语中文"
          />
        </div>
        <div>
          <FieldLabel label="English" />
          <TextInput
            value={slogan.primary.en}
            onChange={(v) => updateSlogan({ primary: { zh: slogan.primary.zh, en: v } })}
            placeholder="Primary slogan in English"
          />
        </div>
      </div>

      {/* Secondary Slogan */}
      <div className="space-y-3">
        <div className="text-[10px] text-white/25 uppercase tracking-wider" style={{ fontWeight: 500 }}>Secondary Slogan</div>
        <div>
          <FieldLabel label="Chinese" />
          <TextInput
            value={slogan.secondary.zh}
            onChange={(v) => updateSlogan({ secondary: { zh: v, en: slogan.secondary.en } })}
            placeholder="副标语中文"
          />
        </div>
        <div>
          <FieldLabel label="English" />
          <TextInput
            value={slogan.secondary.en}
            onChange={(v) => updateSlogan({ secondary: { zh: slogan.secondary.zh, en: v } })}
            placeholder="Secondary slogan in English"
          />
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-2">
        <ToggleSwitch value={slogan.showOnHome} onChange={(v) => updateSlogan({ showOnHome: v })} label="Show on Homepage" desc="Display slogan on the landing page" />
        <ToggleSwitch value={slogan.showOnNav} onChange={(v) => updateSlogan({ showOnNav: v })} label="Show in Navigation" desc="Display slogan in the top navigation bar" />
        <ToggleSwitch value={slogan.animateTyping} onChange={(v) => updateSlogan({ animateTyping: v })} label="Typing Animation" desc="Typewriter effect on homepage" />
      </div>
    </div>
  )
}

// ============================================
// Section: SEO
// ============================================

function SEOSection() {
  const { config, updateSEO, setAppName } = useBrandingStore()
  const seo = config.seo
  const [keywordInput, setKeywordInput] = useState('')

  const addKeyword = () => {
    const kw = keywordInput.trim()
    if (kw && !seo.keywords.includes(kw)) {
      updateSEO({ keywords: [...seo.keywords, kw] })
      setKeywordInput('')
    }
  }

  const removeKeyword = (kw: string) => {
    updateSEO({ keywords: seo.keywords.filter(k => k !== kw) })
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="SEO Configuration" desc="Page titles, descriptions, and metadata" />

      {/* App Name */}
      <div>
        <FieldLabel label="Application Name" />
        <TextInput value={config.appName} onChange={(v) => setAppName(v)} placeholder="YYC³ Family AI" />
      </div>

      {/* Title */}
      <div>
        <FieldLabel label="SEO Title" />
        <TextInput value={seo.title} onChange={(v) => updateSEO({ title: v })} placeholder="Page Title" />
      </div>

      {/* Title Template */}
      <div>
        <FieldLabel label="Title Template" hint="{pageName}, {appName}" />
        <TextInput value={seo.titleTemplate} onChange={(v) => updateSEO({ titleTemplate: v })} placeholder="{pageName} - {appName}" mono />
      </div>

      {/* Description */}
      <div>
        <FieldLabel label="Description" />
        <textarea
          value={seo.description}
          onChange={(e) => updateSEO({ description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-[11px] text-white/70 placeholder:text-white/20 bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/40 focus:outline-none resize-none"
          style={{ fontWeight: 400 }}
          placeholder="Brief description for search engines..."
        />
        <div className="text-[9px] text-white/15 mt-1">{seo.description.length}/160 characters</div>
      </div>

      {/* Keywords */}
      <div>
        <FieldLabel label="Keywords" />
        <div className="flex flex-wrap gap-1.5 mb-2">
          {seo.keywords.map((kw) => (
            <span
              key={kw}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/50"
              style={{ fontWeight: 400 }}
            >
              <Hash className="w-2.5 h-2.5 text-white/20" />
              {kw}
              <button onClick={() => removeKeyword(kw)} className="text-white/20 hover:text-white/50 ml-0.5">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            className="flex-1 px-3 py-1.5 rounded-lg text-[11px] text-white/70 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/40"
            style={{ fontWeight: 400 }}
            placeholder="Add keyword..."
          />
          <button
            onClick={addKeyword}
            className="px-3 py-1.5 rounded-lg text-[10px] bg-white/[0.06] hover:bg-white/[0.1] text-white/40 hover:text-white/60 transition-colors"
            style={{ fontWeight: 400 }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Section: Contact
// ============================================

function ContactSection() {
  const { config, updateContact } = useBrandingStore()
  const { isLG } = useLiquidGlass()
  const contact = config.contact

  return (
    <div className="space-y-5">
      <SectionHeader title="Contact Information" desc="Email, website, and social links" />

      <div>
        <FieldLabel label="Email" />
        <TextInput value={contact.email} onChange={(v) => updateContact({ email: v })} placeholder="admin@example.com" />
      </div>

      <div>
        <FieldLabel label="Website" />
        <TextInput value={contact.website} onChange={(v) => updateContact({ website: v })} placeholder="https://example.com" mono />
      </div>

      <div className="text-[10px] text-white/25 uppercase tracking-wider mt-4" style={{ fontWeight: 500 }}>Social Links</div>

      {[
        { key: 'github', icon: Github, label: 'GitHub', placeholder: 'https://github.com/username' },
        { key: 'twitter', icon: Twitter, label: 'Twitter / X', placeholder: 'https://twitter.com/username' },
        { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
        { key: 'discord', icon: MessageSquare, label: 'Discord', placeholder: 'https://discord.gg/invite' },
      ].map((s) => (
        <div key={s.key}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <s.icon className="w-3 h-3 text-white/25" />
            <span className="text-[11px] text-white/50" style={{ fontWeight: 400 }}>{s.label}</span>
          </div>
          <TextInput
            value={(contact.social as any)[s.key] || ''}
            onChange={(v) => updateContact({ social: { [s.key]: v } as any })}
            placeholder={s.placeholder}
            mono
          />
        </div>
      ))}
    </div>
  )
}

// ============================================
// Section: User Profile
// ============================================

function UserProfileSection() {
  const { config, updateUser } = useBrandingStore()
  const { isLG } = useLiquidGlass()
  const user = config.user

  return (
    <div className="space-y-5">
      <SectionHeader title="User Profile" desc="Default user profile configuration" />

      {/* Preview Card */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${user.gradientFrom}, ${user.gradientTo})` }}
          >
            {user.initials}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] text-white/90" style={{ fontWeight: 600 }}>{user.displayName}</div>
            <div className="text-[11px] text-white/30" style={{ fontWeight: 400 }}>{user.email}</div>
            <span
              className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] border"
              style={{
                fontWeight: 500,
                color: isLG ? '#34d399' : '#a78bfa',
                background: isLG ? 'rgba(52,211,153,0.1)' : 'rgba(167,139,250,0.1)',
                borderColor: isLG ? 'rgba(52,211,153,0.2)' : 'rgba(167,139,250,0.2)',
              }}
            >
              {user.role}
            </span>
          </div>
        </div>
        {user.bio && (
          <div className="text-[11px] text-white/50 leading-relaxed" style={{ fontWeight: 400 }}>{user.bio}</div>
        )}
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label="Display Name" />
          <TextInput value={user.displayName} onChange={(v) => updateUser({ displayName: v })} placeholder="Your Name" />
        </div>
        <div>
          <FieldLabel label="Initials" hint="2 chars" />
          <TextInput value={user.initials} onChange={(v) => updateUser({ initials: v.slice(0, 3) })} placeholder="YY" />
        </div>
      </div>

      <div>
        <FieldLabel label="Email" />
        <TextInput value={user.email} onChange={(v) => updateUser({ email: v })} placeholder="user@example.com" />
      </div>

      <div>
        <FieldLabel label="Role / Title" />
        <TextInput value={user.role} onChange={(v) => updateUser({ role: v })} placeholder="Full-Stack Developer" />
      </div>

      <div>
        <FieldLabel label="Bio" />
        <textarea
          value={user.bio}
          onChange={(e) => updateUser({ bio: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-[11px] text-white/70 placeholder:text-white/20 bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/40 focus:outline-none resize-none"
          style={{ fontWeight: 400 }}
          placeholder="Short bio..."
        />
      </div>

      <div>
        <FieldLabel label="Location" />
        <TextInput value={user.location} onChange={(v) => updateUser({ location: v })} placeholder="City, Country" />
      </div>

      {/* Avatar Gradient */}
      <div className="text-[10px] text-white/25 uppercase tracking-wider" style={{ fontWeight: 500 }}>Avatar Gradient</div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label="From Color" />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={user.gradientFrom}
              onChange={(e) => updateUser({ gradientFrom: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent"
            />
            <input
              value={user.gradientFrom}
              onChange={(e) => updateUser({ gradientFrom: e.target.value })}
              className="flex-1 px-2 py-1 rounded text-[10px] text-white/50 font-mono bg-white/[0.04] border border-white/[0.08] focus:outline-none"
              style={{ fontWeight: 400 }}
            />
          </div>
        </div>
        <div>
          <FieldLabel label="To Color" />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={user.gradientTo}
              onChange={(e) => updateUser({ gradientTo: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent"
            />
            <input
              value={user.gradientTo}
              onChange={(e) => updateUser({ gradientTo: e.target.value })}
              className="flex-1 px-2 py-1 rounded text-[10px] text-white/50 font-mono bg-white/[0.04] border border-white/[0.08] focus:outline-none"
              style={{ fontWeight: 400 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Section: Copyright
// ============================================

function CopyrightSection() {
  const { config, updateCopyright, setAppVersion } = useBrandingStore()
  const cr = config.copyright

  const defaultText = `Copyright (c) ${cr.year} ${cr.owner}. Licensed under ${cr.license}.`

  return (
    <div className="space-y-5">
      <SectionHeader title="Copyright & License" desc="Legal and version information" />

      {/* Preview */}
      <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
        <div className="text-[10px] text-white/25" style={{ fontWeight: 400 }}>
          {cr.text || defaultText}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label="Copyright Year" />
          <TextInput value={cr.year.toString()} onChange={(v) => updateCopyright({ year: parseInt(v) || cr.year })} placeholder="2026" />
        </div>
        <div>
          <FieldLabel label="Owner" />
          <TextInput value={cr.owner} onChange={(v) => updateCopyright({ owner: v })} placeholder="YanYuCloudCube Team" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label="License" />
          <TextInput value={cr.license} onChange={(v) => updateCopyright({ license: v })} placeholder="MIT" />
        </div>
        <div>
          <FieldLabel label="App Version" />
          <TextInput value={config.appVersion} onChange={(v) => setAppVersion(v)} placeholder="2.6.0" />
        </div>
      </div>

      <div>
        <FieldLabel label="Custom Copyright Text" hint="Leave empty for auto-generated" />
        <textarea
          value={cr.text}
          onChange={(e) => updateCopyright({ text: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-[11px] text-white/70 placeholder:text-white/20 bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/40 focus:outline-none resize-none"
          style={{ fontWeight: 400 }}
          placeholder={defaultText}
        />
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function BrandingPanel({ standalone }: { standalone?: boolean }) {
  const { config, activeSection, setActiveSection, resetToDefault, exportConfig, importConfig } = useBrandingStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const json = exportConfig()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'yyc3-branding.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('branding.exportSuccess', 'branding') || 'Branding config exported')
  }

  const handleImport = () => {
    if (importConfig(importJson)) {
      toast.success(t('branding.importSuccess', 'branding') || 'Branding config imported')
      setShowImport(false)
      setImportJson('')
    } else {
      toast.error(t('branding.importError', 'branding') || 'Invalid branding config JSON')
    }
  }

  const handleReset = () => {
    resetToDefault()
    toast.success(t('branding.resetSuccess', 'branding') || 'Reset to default branding')
  }

  return (
    <div className={`flex h-full ${standalone ? '' : 'border-t border-white/[0.06]'}`}>
      {/* Left Navigation */}
      <div className="w-[160px] border-r border-white/[0.06] py-2 px-2 shrink-0 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all mb-0.5 ${
              activeSection === item.id
                ? isLG
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
            }`}
            style={{ fontWeight: 400 }}
          >
            <item.icon className="w-3.5 h-3.5" />
            {t(item.labelKey, 'branding') || item.fallback}
          </button>
        ))}

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
            style={{ fontWeight: 400 }}
          >
            <Download className="w-3 h-3" /> {t('branding.export', 'branding') || 'Export'}
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
            style={{ fontWeight: 400 }}
          >
            <Upload className="w-3 h-3" /> {t('branding.import', 'branding') || 'Import'}
          </button>
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] text-red-400/40 hover:text-red-400/70 hover:bg-red-500/[0.04] transition-colors"
            style={{ fontWeight: 400 }}
          >
            <RotateCcw className="w-3 h-3" /> {t('branding.reset', 'branding') || 'Reset'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0">
        {showImport && (
          <div className="mb-5 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
            <div className="text-[11px] text-white/50" style={{ fontWeight: 500 }}>Import Branding Config</div>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg text-[10px] text-white/60 font-mono bg-white/[0.04] border border-white/[0.08] focus:outline-none resize-none"
              style={{ fontWeight: 400 }}
              placeholder="Paste branding JSON here..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className={`px-4 py-1.5 rounded-lg text-[10px] transition-colors ${
                  isLG ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                }`}
                style={{ fontWeight: 500 }}
              >
                Import
              </button>
              <button
                onClick={() => { setShowImport(false); setImportJson('') }}
                className="px-4 py-1.5 rounded-lg text-[10px] text-white/30 hover:text-white/50 bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
                style={{ fontWeight: 400 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeSection === 'overview' && <OverviewSection />}
        {activeSection === 'logo' && <LogoSection />}
        {activeSection === 'avatar' && <AvatarSection />}
        {activeSection === 'slogan' && <SloganSection />}
        {activeSection === 'seo' && <SEOSection />}
        {activeSection === 'contact' && <ContactSection />}
        {activeSection === 'user' && <UserProfileSection />}
        {activeSection === 'copyright' && <CopyrightSection />}
      </div>
    </div>
  )
}
