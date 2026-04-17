/**
 * @file index.ts
 * @description YYC³ 图标系统公共入口
 */

export { AppIcon, RawIcon } from './AppIcon'
export type { AppIconProps, RawIconProps } from './AppIcon'

export {
  ICON_REGISTRY,
  ICON_THEME_DARK,
  ICON_THEME_LIGHT,
  ICON_SIZE_CLASS,
  getIcon,
  getIconLabel,
  getIconTooltip,
  getIconsByCategory,
  getAllCategories,
} from './icon-registry'

export type {
  IconEntry,
  IconSize,
  IconState,
  IconCategory,
  IconThemeColors,
} from './icon-registry'
