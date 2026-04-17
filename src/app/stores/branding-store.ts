/**
 * @file branding-store.ts
 * @description YYC³ 品牌配置管理 — Logo/头像/标语/SEO/联系信息/版权 全生命周期管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags branding, logo, avatar, slogan, seo, persist
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================
// Types
// ============================================

export interface LogoConfig {
  url: string
  lightUrl: string
  darkUrl: string
  size: number          // px height
  radius: number        // px border-radius
  opacity: number       // 0-100
  animated: boolean
  animationType: 'float' | 'pulse' | 'none'
  linkUrl: string       // click target
}

export interface AvatarConfig {
  url: string
  size: number          // px
  radius: number        // px (9999 = circle)
  borderWidth: number   // px
  borderColor: string
  opacity: number       // 0-100
  statusIndicator: boolean
  status: 'online' | 'offline' | 'busy' | 'away'
}

export interface SloganConfig {
  primary: { zh: string; en: string }
  secondary: { zh: string; en: string }
  showOnHome: boolean
  showOnNav: boolean
  animateTyping: boolean
}

export interface SEOConfig {
  title: string
  description: string
  keywords: string[]
  titleTemplate: string   // e.g. "{pageName} - {appName}"
  ogImage: string
  favicon: string
}

export interface ContactConfig {
  email: string
  website: string
  social: {
    github: string
    twitter: string
    linkedin: string
    discord: string
  }
}

export interface UserProfileConfig {
  displayName: string
  email: string
  bio: string
  role: string
  location: string
  website: string
  initials: string
  gradientFrom: string
  gradientTo: string
}

export interface CopyrightConfig {
  year: number
  owner: string
  license: string
  text: string          // custom copyright text
}

export interface BrandingConfig {
  appName: string
  appVersion: string
  logo: LogoConfig
  avatar: AvatarConfig
  slogan: SloganConfig
  seo: SEOConfig
  contact: ContactConfig
  user: UserProfileConfig
  copyright: CopyrightConfig
  backgroundType: 'color' | 'gradient' | 'image'
  backgroundColor: string
  backgroundGradient: string
  backgroundImage: string
}

// ============================================
// Defaults
// ============================================

const DEFAULT_LOGO: LogoConfig = {
  url: '',
  lightUrl: '',
  darkUrl: '',
  size: 40,
  radius: 8,
  opacity: 100,
  animated: true,
  animationType: 'float',
  linkUrl: '/',
}

const DEFAULT_AVATAR: AvatarConfig = {
  url: '',
  size: 40,
  radius: 9999,
  borderWidth: 2,
  borderColor: 'rgba(255, 255, 255, 0.2)',
  opacity: 100,
  statusIndicator: true,
  status: 'online',
}

const DEFAULT_SLOGAN: SloganConfig = {
  primary: {
    zh: '言启象限 | 语枢未来',
    en: 'Words Initiate Quadrants, Language Serves as Core for Future',
  },
  secondary: {
    zh: '万象归元于云枢 | 深栈智启新纪元',
    en: 'All things converge in cloud pivot; Deep stacks ignite a new era of intelligence',
  },
  showOnHome: true,
  showOnNav: false,
  animateTyping: true,
}

const DEFAULT_SEO: SEOConfig = {
  title: 'YYC³ AI Code Designer',
  description: '智能AI代码设计器，支持实时协作、多设备预览、AI辅助开发',
  keywords: ['AI', 'Code', 'Designer', 'Collaboration', 'Real-time', 'YYC3'],
  titleTemplate: '{pageName} - {appName}',
  ogImage: '',
  favicon: '',
}

const DEFAULT_CONTACT: ContactConfig = {
  email: 'admin@0379.email',
  website: 'https://yanyucloudcube.com',
  social: {
    github: 'https://github.com/yanyucloudcube',
    twitter: '',
    linkedin: '',
    discord: '',
  },
}

const DEFAULT_USER: UserProfileConfig = {
  displayName: 'YanYu User',
  email: 'admin@0379.email',
  bio: 'YYC³ Family AI Developer',
  role: 'Full-Stack Developer',
  location: '',
  website: '',
  initials: 'YY',
  gradientFrom: '#34d399',
  gradientTo: '#06b6d4',
}

const DEFAULT_COPYRIGHT: CopyrightConfig = {
  year: new Date().getFullYear(),
  owner: 'YanYuCloudCube Team',
  license: 'MIT',
  text: '',
}

export const DEFAULT_BRANDING: BrandingConfig = {
  appName: 'YYC³ Family AI',
  appVersion: '2.6.0',
  logo: { ...DEFAULT_LOGO },
  avatar: { ...DEFAULT_AVATAR },
  slogan: { ...DEFAULT_SLOGAN },
  seo: { ...DEFAULT_SEO },
  contact: { ...DEFAULT_CONTACT },
  user: { ...DEFAULT_USER },
  copyright: { ...DEFAULT_COPYRIGHT },
  backgroundType: 'color',
  backgroundColor: '#0a0a0f',
  backgroundGradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
  backgroundImage: '',
}

// ============================================
// Store
// ============================================

interface BrandingState {
  config: BrandingConfig
  isEditing: boolean
  activeSection: BrandingSection
  previewMode: boolean

  // Actions
  setConfig: (config: BrandingConfig) => void
  updateLogo: (logo: Partial<LogoConfig>) => void
  updateAvatar: (avatar: Partial<AvatarConfig>) => void
  updateSlogan: (slogan: Partial<SloganConfig>) => void
  updateSEO: (seo: Partial<SEOConfig>) => void
  updateContact: (contact: Partial<ContactConfig>) => void
  updateUser: (user: Partial<UserProfileConfig>) => void
  updateCopyright: (copyright: Partial<CopyrightConfig>) => void
  setAppName: (name: string) => void
  setAppVersion: (version: string) => void
  setBackground: (bg: Partial<Pick<BrandingConfig, 'backgroundType' | 'backgroundColor' | 'backgroundGradient' | 'backgroundImage'>>) => void
  setActiveSection: (section: BrandingSection) => void
  setEditing: (editing: boolean) => void
  setPreviewMode: (preview: boolean) => void
  resetToDefault: () => void
  exportConfig: () => string
  importConfig: (json: string) => boolean
}

export type BrandingSection =
  | 'overview'
  | 'logo'
  | 'avatar'
  | 'slogan'
  | 'seo'
  | 'contact'
  | 'user'
  | 'copyright'
  | 'background'

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set, get) => ({
      config: { ...DEFAULT_BRANDING },
      isEditing: false,
      activeSection: 'overview',
      previewMode: false,

      setConfig: (config) => set({ config }),

      updateLogo: (logo) => {
        const prev = get().config
        set({ config: { ...prev, logo: { ...prev.logo, ...logo } } })
      },

      updateAvatar: (avatar) => {
        const prev = get().config
        set({ config: { ...prev, avatar: { ...prev.avatar, ...avatar } } })
      },

      updateSlogan: (slogan) => {
        const prev = get().config
        const merged = { ...prev.slogan }
        if (slogan.primary) {merged.primary = { ...merged.primary, ...slogan.primary }}
        if (slogan.secondary) {merged.secondary = { ...merged.secondary, ...slogan.secondary }}
        if (slogan.showOnHome !== undefined) {merged.showOnHome = slogan.showOnHome}
        if (slogan.showOnNav !== undefined) {merged.showOnNav = slogan.showOnNav}
        if (slogan.animateTyping !== undefined) {merged.animateTyping = slogan.animateTyping}
        set({ config: { ...prev, slogan: merged } })
      },

      updateSEO: (seo) => {
        const prev = get().config
        set({ config: { ...prev, seo: { ...prev.seo, ...seo } } })
      },

      updateContact: (contact) => {
        const prev = get().config
        const merged = { ...prev.contact }
        if (contact.email !== undefined) {merged.email = contact.email}
        if (contact.website !== undefined) {merged.website = contact.website}
        if (contact.social) {merged.social = { ...merged.social, ...contact.social }}
        set({ config: { ...prev, contact: merged } })
      },

      updateUser: (user) => {
        const prev = get().config
        set({ config: { ...prev, user: { ...prev.user, ...user } } })
      },

      updateCopyright: (copyright) => {
        const prev = get().config
        set({ config: { ...prev, copyright: { ...prev.copyright, ...copyright } } })
      },

      setAppName: (name) => {
        const prev = get().config
        set({ config: { ...prev, appName: name } })
      },

      setAppVersion: (version) => {
        const prev = get().config
        set({ config: { ...prev, appVersion: version } })
      },

      setBackground: (bg) => {
        const prev = get().config
        set({ config: { ...prev, ...bg } })
      },

      setActiveSection: (section) => set({ activeSection: section }),
      setEditing: (editing) => set({ isEditing: editing }),
      setPreviewMode: (preview) => set({ previewMode: preview }),

      resetToDefault: () => set({ config: { ...DEFAULT_BRANDING } }),

      exportConfig: () => JSON.stringify(get().config, null, 2),

      importConfig: (json) => {
        try {
          const parsed = JSON.parse(json)
          if (!parsed.appName || !parsed.logo) {return false}
          set({ config: { ...DEFAULT_BRANDING, ...parsed } })
          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: 'yyc3_branding_store',
      partialize: (state) => ({ config: state.config }),
      merge: (persisted: any, current) => {
        if (!persisted) {return current}
        return {
          ...current,
          config: { ...DEFAULT_BRANDING, ...(persisted.config || {}) },
        }
      },
    }
  )
)
