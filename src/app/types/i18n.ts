/**
 * @file i18n.ts
 * @description YYC³ 国际化类型定义 — 语言配置、翻译资源、格式化选项
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Covers: zh-CN (完整), en-US (完整), zh-TW / ja-JP / ko-KR (计划中)
 * Date / Number / Currency formatting via Intl APIs.
 */

/* ================================================================
   Locale & Direction
   ================================================================ */

export type SupportedLocale = 'zh-CN' | 'en-US' | 'zh-TW' | 'ja-JP' | 'ko-KR'
export type TextDirection = 'ltr' | 'rtl'
export type LocaleStatus = 'complete' | 'partial' | 'planned'

export interface LocaleInfo {
  code: SupportedLocale
  name: string
  nativeName: string
  direction: TextDirection
  status: LocaleStatus
  flag: string
  dateFormat: string
  currency: string
}

/* ================================================================
   Translation Namespaces
   ================================================================ */

export type TranslationNamespace =
  | 'common'
  | 'home'
  | 'designer'
  | 'architecture'
  | 'settings'
  | 'ai'
  | 'database'
  | 'files'
  | 'testing'
  | 'security'
  | 'branding'
  | 'errors'
  | 'navigation'
  | 'test'
  | 'custom'

/* ================================================================
   Translation Resource Structure
   ================================================================ */

/** Flattened or nested key→string map for a single namespace */
export type TranslationMap = Record<string, string | Record<string, any>>

/** All namespaces for one locale */
export type LocaleResources = Record<TranslationNamespace, TranslationMap>

/** Complete resources: locale → namespaces → keys */
export type I18nResources = Record<SupportedLocale, Partial<LocaleResources>>

/* ================================================================
   Interpolation & Pluralisation
   ================================================================ */

export interface InterpolationOptions {
  /** Key–value pairs to inject into the translated string via {{key}} */
  [key: string]: string | number | boolean | undefined
}

export interface PluralRules {
  zero?: string
  one?: string
  few?: string
  many?: string
  other: string
}

/* ================================================================
   Formatting Options
   ================================================================ */

export interface DateFormatOptions {
  style?: 'date' | 'datetime' | 'time' | 'relative' | 'short' | 'long'
  timezone?: string
}

export interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent' | 'unit'
  currency?: string
  unit?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/* ================================================================
   I18n Service Configuration
   ================================================================ */

export interface I18nConfig {
  /** Current active locale */
  locale: SupportedLocale
  /** Fallback locale when key is missing */
  fallbackLocale: SupportedLocale
  /** Enable debug logging of missing keys */
  debug: boolean
  /** Persist locale to localStorage */
  persist: boolean
  /** localStorage key */
  storageKey: string
  /** Auto-detect from browser */
  autoDetect: boolean
  /** Default namespace */
  defaultNamespace: TranslationNamespace
  /** Interpolation delimiters */
  interpolation: {
    prefix: string
    suffix: string
  }
}

/* ================================================================
   I18n Service Interface
   ================================================================ */

export interface I18nService {
  // ── Core ──
  t(key: string, options?: InterpolationOptions): string
  t(key: string, ns: TranslationNamespace, options?: InterpolationOptions): string
  exists(key: string, ns?: TranslationNamespace): boolean

  // ── Locale management ──
  getLocale(): SupportedLocale
  setLocale(locale: SupportedLocale): void
  getSupportedLocales(): LocaleInfo[]
  getLocaleInfo(locale: SupportedLocale): LocaleInfo

  // ── Formatting ──
  formatDate(date: Date | number | string, options?: DateFormatOptions): string
  formatNumber(value: number, options?: NumberFormatOptions): string
  formatCurrency(value: number, currency?: string): string
  formatPercent(value: number): string
  formatRelativeTime(date: Date | number): string

  // ── Resources ──
  addResources(locale: SupportedLocale, ns: TranslationNamespace, resources: TranslationMap): void
  getResources(locale: SupportedLocale, ns: TranslationNamespace): TranslationMap | undefined
  getMissingKeys(): Array<{ key: string; ns: string; locale: string }>

  // ── Config ──
  getConfig(): I18nConfig
  updateConfig(partial: Partial<I18nConfig>): void

  // ── Events ──
  onLocaleChange(callback: (locale: SupportedLocale) => void): () => void
}

/* ================================================================
   Translation Validation
   ================================================================ */

export interface TranslationValidationResult {
  locale: SupportedLocale
  namespace: TranslationNamespace
  missingKeys: string[]
  extraKeys: string[]
  emptyValues: string[]
  totalKeys: number
  coverage: number // 0-100
}

export interface TranslationHealthReport {
  timestamp: number
  locales: TranslationValidationResult[]
  overallCoverage: number
  recommendations: string[]
}