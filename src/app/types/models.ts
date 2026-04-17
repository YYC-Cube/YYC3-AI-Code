/**
 * @file models.ts
 * @description YYC³ 核心数据模型 — User / Project / File / Version
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 */

/* ================================================================
   User
   ================================================================ */

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  status: 'online' | 'busy' | 'offline'
  role: 'admin' | 'developer' | 'viewer'
  permissions: UserPermission[]
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export interface UserPermission {
  resource: string
  actions: ('read' | 'write' | 'delete' | 'admin')[]
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto'
  locale: 'zh' | 'en'
  fontSize: number
  keyboardShortcuts: boolean
  notifications: boolean
  autoSave: boolean
  autoSaveInterval: number // seconds
}

/* ================================================================
   Project
   ================================================================ */

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
  designJson?: DesignJSON
  tech: ProjectTechStack
  status: ProjectStatus
  isPublic?: boolean
  collaborators: ProjectCollaborator[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'draft' | 'active' | 'archived' | 'deployed'

export interface ProjectTechStack {
  framework: 'react' | 'vue' | 'svelte'
  language: 'typescript' | 'javascript'
  styling: 'tailwind' | 'css-modules' | 'styled-components'
  stateManagement?: 'zustand' | 'redux' | 'jotai'
}

export interface ProjectCollaborator {
  userId: string
  role: 'owner' | 'editor' | 'viewer'
  joinedAt: string
}

/* ================================================================
   Design JSON — 项目设计数据结构
   ================================================================ */

export interface DesignJSON {
  layout: DesignLayoutConfig
  components: DesignComponent[]
  styles: DesignStyleConfig
  assets: DesignAsset[]
}

export interface DesignLayoutConfig {
  type: 'flex' | 'grid' | 'absolute' | 'flow'
  direction?: 'row' | 'column'
  gap?: number
  padding?: number
  responsive?: {
    breakpoints: Record<string, number>
    rules: Record<string, Partial<DesignLayoutConfig>>
  }
}

export interface DesignStyleConfig {
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  fontFamily: string
  borderRadius: number
  customCSS?: string
}

export interface DesignAsset {
  id: string
  type: 'image' | 'icon' | 'font' | 'svg'
  name: string
  url: string
  size: number
  mimeType: string
}

/* ================================================================
   Design Component — 可视化设计组件
   ================================================================ */

export type DesignComponentType =
  | 'panel' | 'button' | 'input' | 'text' | 'image'
  | 'container' | 'list' | 'card' | 'form' | 'table'
  | 'chart' | 'modal' | 'nav' | 'sidebar' | 'footer'
  | 'custom'

export interface DesignComponent {
  id: string
  projectId: string
  type: DesignComponentType
  name: string
  props: Record<string, unknown>
  styles: ComponentStyles
  position: ComponentPosition
  parentId?: string
  children?: string[] // child component IDs
  order: number
  locked?: boolean
  hidden?: boolean
  createdAt: string
  updatedAt: string
}

export interface ComponentStyles {
  width?: string | number
  height?: string | number
  minWidth?: string | number
  minHeight?: string | number
  maxWidth?: string | number
  maxHeight?: string | number
  backgroundColor?: string
  color?: string
  borderRadius?: string | number
  border?: string
  padding?: string | number
  margin?: string | number
  opacity?: number
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  display?: string
  flexDirection?: string
  alignItems?: string
  justifyContent?: string
  gap?: string | number
  boxShadow?: string
  transition?: string
  cursor?: string
  [key: string]: unknown
}

export interface ComponentPosition {
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  rotation?: number
}

/* ================================================================
   Session / Chat — AI 对话会话
   ================================================================ */

export interface Session {
  id: string
  userId: string
  projectId: string
  title: string
  messages: SessionMessage[]
  context: SessionContext
  status: 'active' | 'closed'
  createdAt: string
  updatedAt: string
}

export interface SessionMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  model?: string
  tokensUsed?: number
  duration?: number
  codeBlocks?: Array<{
    language: string
    code: string
    filePath?: string
  }>
  attachments?: Array<{
    type: 'image' | 'file' | 'code'
    name: string
    url?: string
    content?: string
  }>
}

export interface SessionContext {
  currentFile?: string
  selectedComponent?: string
  aiModel: string
  aiProvider: string
  temperature: number
  maxTokens: number
  systemPrompt?: string
  relatedFiles?: string[]
}

/* ================================================================
   File
   ================================================================ */

export interface ProjectFile {
  path: string
  name: string
  type: 'file' | 'directory'
  language?: string
  content?: string
  size: number
  isModified: boolean
  createdAt: string
  updatedAt: string
}

export interface FileVersion {
  id: string
  path: string
  content: string
  hash: string
  message?: string
  authorId: string
  createdAt: string
}

/* ================================================================
   Code Generation
   ================================================================ */

export interface CodeGenerationRequest {
  prompt: string
  context: {
    currentFile?: string
    selectedCode?: string
    projectTech: ProjectTechStack
    relatedFiles?: string[]
  }
  options: {
    model: string
    temperature: number
    maxTokens: number
    stream: boolean
  }
}

export interface CodeGenerationResult {
  id: string
  code: string
  language: string
  explanation?: string
  filePath?: string
  tokensUsed: {
    prompt: number
    completion: number
    total: number
  }
  duration: number // ms
  model: string
}

/* ================================================================
   Notification
   ================================================================ */

export interface AppNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system'
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: string
}

/* ================================================================
   Deployment
   ================================================================ */

export interface Deployment {
  id: string
  projectId: string
  version: string
  status: 'pending' | 'building' | 'deployed' | 'failed' | 'rolled-back'
  url?: string
  buildLog?: string
  startedAt: string
  completedAt?: string
}