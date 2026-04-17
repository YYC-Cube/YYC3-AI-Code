/**
 * @file useI18n.ts
 * @description React hook for i18n — reactive locale switching, translation helper
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { i18nService, t as rawT } from '../services/i18n-service'
import type { SupportedLocale, TranslationNamespace, InterpolationOptions } from '../types/i18n'

export interface UseI18nReturn {
  /** Current locale code */
  locale: SupportedLocale
  /** Set the active locale */
  setLocale: (locale: SupportedLocale) => void
  /** Toggle between zh-CN and en-US */
  toggleLocale: () => void
  /** Translate a key with optional namespace and interpolation */
  t: (key: string, nsOrOpts?: TranslationNamespace | InterpolationOptions, opts?: InterpolationOptions) => string
  /** Check if a translation key exists */
  exists: (key: string, ns?: TranslationNamespace) => boolean
  /** Current locale display name (native) */
  localeName: string
  /** Current locale flag emoji */
  localeFlag: string
  /** Whether the current locale is Chinese */
  isChinese: boolean
  /** All available locales */
  availableLocales: Array<{ code: SupportedLocale; name: string; nativeName: string; flag: string; status: string }>
  /** Format a date */
  formatDate: typeof i18nService.formatDate
  /** Format a number */
  formatNumber: typeof i18nService.formatNumber
  /** Format currency */
  formatCurrency: typeof i18nService.formatCurrency
  /** Format relative time */
  formatRelativeTime: typeof i18nService.formatRelativeTime
}

/**
 * React hook providing reactive i18n — re-renders on locale change
 */
export function useI18n(): UseI18nReturn {
  const [locale, setLocaleState] = useState<SupportedLocale>(i18nService.getLocale())

  useEffect(() => {
    const unsub = i18nService.onLocaleChange((newLocale) => {
      setLocaleState(newLocale)
    })
    return unsub
  }, [])

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    i18nService.setLocale(newLocale)
    // State update will be triggered by the onLocaleChange listener
  }, [])

  const toggleLocale = useCallback(() => {
    const current = i18nService.getLocale()
    const next: SupportedLocale = current === 'zh-CN' ? 'en-US' : 'zh-CN'
    i18nService.setLocale(next)
  }, [])

  const t = useCallback(
    (key: string, nsOrOpts?: TranslationNamespace | InterpolationOptions, opts?: InterpolationOptions) => {
      return i18nService.t(key, nsOrOpts, opts)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale] // re-bind when locale changes so translations re-evaluate
  )

  const exists = useCallback(
    (key: string, ns?: TranslationNamespace) => i18nService.exists(key, ns),
    [locale]
  )

  const localeInfo = useMemo(() => {
    const info = i18nService.getLocaleInfo(locale)
    return {
      localeName: info.nativeName,
      localeFlag: info.flag,
      isChinese: locale.startsWith('zh'),
    }
  }, [locale])

  const availableLocales = useMemo(() => {
    return i18nService.getSupportedLocales()
      .filter(l => l.status === 'complete')
      .map(l => ({
        code: l.code,
        name: l.name,
        nativeName: l.nativeName,
        flag: l.flag,
        status: l.status,
      }))
  }, [])

  return {
    locale,
    setLocale,
    toggleLocale,
    t,
    exists,
    ...localeInfo,
    availableLocales,
    formatDate: i18nService.formatDate.bind(i18nService),
    formatNumber: i18nService.formatNumber.bind(i18nService),
    formatCurrency: i18nService.formatCurrency.bind(i18nService),
    formatRelativeTime: i18nService.formatRelativeTime.bind(i18nService),
  }
}
