/**
 * @file index.ts
 * @description YYC³ 类型系统统一入口
 */

// API types
export type { CacheEntry } from './api'

// Model types (core domain)
export type {
  Project,
  ProjectStatus,
  ProjectTechStack,
  ProjectCollaborator,
  FileVersion,
  User,
  UserPermission,
  UserPreferences,
  Session,
  SessionMessage,
  DesignJSON
} from './models'

// Architecture types
export type {
  DesignConstraint as ArchDesignConstraint,
  DesignIntent as ArchDesignIntent,
  UserInput,
  UserInteractionLayer
} from './architecture'

// Codegen types
export type {
  DesignIntent as CodegenDesignIntent,
  DesignConstraint as CodegenDesignConstraint
} from './codegen'

// Other domains
export type * from './security'
export type * from './testing'
export type * from './i18n'
export type * from './storage'