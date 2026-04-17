/**
 * @file AppIcon.tsx
 * @description YYC³ 统一图标组件 — 封装 Lucide React 图标，提供状态管理、tooltip、主题适配、无障碍支持
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @updated 2026-03-13
 * @status stable
 * @license MIT
 *
 * 交互规范:
 * - 默认状态: 只显示图标，不显示文字
 * - 悬停状态: 显示中文名称 tooltip（根据当前语言设置）
 * - 激活状态: 高亮显示，表示当前功能已激活
 * - 禁用状态: 灰度显示，表示功能不可用
 */

import { forwardRef, type MouseEvent, type KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ICON_REGISTRY,
  ICON_THEME_DARK,
  ICON_THEME_LIGHT,
  getIconTooltip,
  type IconEntry,
  type IconSize,
  type IconState,
  type IconThemeColors,
} from './icon-registry'

/* ================================================================
   Props
   ================================================================ */

export interface AppIconProps {
  /** Icon ID from the registry (e.g. 'home', 'settings', 'aiModel') */
  name?: string
  /** OR pass a Lucide icon component directly */
  icon?: LucideIcon
  /** Override label for tooltip */
  label?: string
  /** Icon size in pixels: 16 | 20 | 24 | 32 | 48 */
  size?: IconSize
  /** Explicit state override */
  state?: IconState
  /** Whether the icon is in active state */
  active?: boolean
  /** Whether the icon is disabled */
  disabled?: boolean
  /** Theme mode */
  theme?: 'dark' | 'light'
  /** Custom theme colors */
  themeColors?: IconThemeColors
  /** Locale for tooltip */
  locale?: 'zh' | 'en'
  /** Show keyboard shortcut in tooltip */
  showShortcut?: boolean
  /** Whether to show a visible tooltip label on hover (not just title) */
  showTooltip?: boolean
  /** Additional className */
  className?: string
  /** Click handler */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  /** Keyboard handler */
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void
  /** Accent variant color class (overrides theme) */
  accent?: string
  /** ARIA label override */
  ariaLabel?: string
  /** tabIndex */
  tabIndex?: number
  /** Badge content (e.g. notification count) */
  badge?: number | string
  /** render as span instead of button (non-interactive) */
  asSpan?: boolean
}

/* ================================================================
   Component
   ================================================================ */

export const AppIcon = forwardRef<HTMLButtonElement, AppIconProps>(function AppIcon(
  {
    name,
    icon,
    label,
    size = 20,
    state,
    active = false,
    disabled = false,
    theme = 'dark',
    themeColors,
    locale = 'zh',
    showShortcut = true,
    showTooltip = true,
    className = '',
    onClick,
    onKeyDown,
    accent,
    ariaLabel,
    tabIndex,
    badge,
    asSpan = false,
  },
  ref
) {
  // Resolve icon from registry or direct prop
  let entry: IconEntry | undefined
  let IconComponent: LucideIcon | undefined

  if (name && ICON_REGISTRY[name]) {
    entry = ICON_REGISTRY[name]
    IconComponent = entry.component
  }
  if (icon) {
    IconComponent = icon
  }

  if (!IconComponent) {
    return null
  }

  // Resolve state
  const resolvedState: IconState = state || (disabled ? 'disabled' : active ? 'active' : 'default')

  // Theme colors
  const colors = themeColors || (theme === 'dark' ? ICON_THEME_DARK : ICON_THEME_LIGHT)

  // Color class
  const colorClass = accent && resolvedState !== 'disabled'
    ? accent
    : colors[resolvedState]

  // Hover color (only applies in default state)
  const hoverColorClass = resolvedState === 'default' && !accent
    ? `hover:${colors.hover}`
    : resolvedState === 'default' && accent
    ? ''
    : ''

  // Tooltip text
  const tooltipText = label
    || (entry && showShortcut ? getIconTooltip(entry.id, locale) : undefined)
    || (entry ? (locale === 'zh' ? entry.tooltipZh : entry.tooltipEn) : undefined)

  // Size
  const pxSize = size

  // Build classes
  const wrapperClasses = [
    'relative inline-flex items-center justify-center rounded-lg transition-colors',
    resolvedState === 'disabled' ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
    resolvedState === 'default' ? 'hover:bg-white/[0.06]' : '',
    resolvedState === 'active' ? 'bg-white/[0.08]' : '',
    'group',
    className,
  ].filter(Boolean).join(' ')

  const iconEl = (
    <>
      <IconComponent
        size={pxSize}
        className={`${colorClass} ${hoverColorClass} transition-colors`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      />

      {/* Badge */}
      {badge !== undefined && badge !== 0 && (
        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] px-0.5 leading-none">
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Hover tooltip */}
      {showTooltip && tooltipText && (
        <span
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] text-white/70 bg-black/80 border border-white/[0.08] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
          role="tooltip"
        >
          {tooltipText}
        </span>
      )}
    </>
  )

  if (asSpan) {
    return (
      <span
        className={wrapperClasses}
        title={tooltipText}
        aria-label={ariaLabel || tooltipText}
        style={{ padding: Math.max(pxSize * 0.25, 4) }}
      >
        {iconEl}
      </span>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={disabled ? undefined : onClick}
      onKeyDown={disabled ? undefined : onKeyDown}
      disabled={disabled}
      className={wrapperClasses}
      title={tooltipText}
      aria-label={ariaLabel || tooltipText}
      aria-disabled={disabled}
      aria-pressed={active}
      tabIndex={tabIndex ?? (disabled ? -1 : 0)}
      style={{ padding: Math.max(pxSize * 0.25, 4) }}
    >
      {iconEl}
    </button>
  )
})

/* ================================================================
   Convenience: Icon-only render (no wrapper button)
   ================================================================ */

export interface RawIconProps {
  name?: string
  icon?: LucideIcon
  size?: IconSize
  className?: string
  state?: IconState
  theme?: 'dark' | 'light'
}

export function RawIcon({ name, icon, size = 20, className = '', state = 'default', theme = 'dark' }: RawIconProps) {
  let IconComponent: LucideIcon | undefined
  if (name && ICON_REGISTRY[name]) {
    IconComponent = ICON_REGISTRY[name].component
  }
  if (icon) {IconComponent = icon}

  if (!IconComponent) {return null}

  const colors = theme === 'dark' ? ICON_THEME_DARK : ICON_THEME_LIGHT

  return (
    <IconComponent
      size={size}
      className={`${colors[state]} ${className}`}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    />
  )
}
