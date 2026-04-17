/**
 * @file architecture.ts
 * @description YYC³ AI Code 系统架构类型定义 — 五层架构接口规范
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @updated 2026-03-13
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags architecture, types, interfaces
 */

/* ================================================================
   Layer 1 — 用户交互层 (User Interaction Layer)
   ================================================================ */

export interface InputMetadata {
  source: 'keyboard' | 'voice' | 'drag' | 'paste' | 'upload'
  timestamp: number
  locale: string
  sessionId: string
}

export interface UserInput {
  type: 'text' | 'image' | 'file' | 'gesture'
  content: any
  metadata: InputMetadata
}

export type OutputFormat = 'react' | 'html' | 'json' | 'markdown' | 'plaintext'

export interface RenderOutput {
  type: 'code' | 'preview' | 'message' | 'error'
  content: any
  format: OutputFormat
}

export interface UserInteractionLayer {
  handleInput(input: UserInput): Promise<void>
  renderOutput(output: RenderOutput): void
  onEvent(event: UIEvent): void
}

/* ================================================================
   Layer 2 — 功能逻辑层 (Function Logic Layer)
   ================================================================ */

export interface TransitionConfig {
  type: 'slide' | 'fade' | 'none'
  duration: number
  easing: string
}

export interface RouteDecision {
  target: 'home' | 'editor' | 'preview' | 'settings' | 'architecture'
  parameters: Record<string, any>
  transition: TransitionConfig
}

export interface RequestContext {
  userInput: UserInput
  currentRoute: string
  sessionState: Record<string, any>
  aiAnalysis?: DesignIntent
}

export interface ComponentConfig {
  id: string
  type: string
  props: Record<string, any>
  children?: ComponentConfig[]
  styles?: Record<string, string>
}

export interface StateUpdate {
  key: string
  value: any
  scope: 'local' | 'session' | 'persistent'
}

export interface FunctionLogicLayer {
  decideRoute(context: RequestContext): RouteDecision
  managePanel(panel: import('../stores/app-store').PanelConfig): void
  manageComponent(component: ComponentConfig): void
  manageState(state: StateUpdate): void
}

/* ================================================================
   Layer 3 — AI 智能层 (AI Intelligence Layer)
   ================================================================ */

export interface DesignConstraint {
  type: 'responsive' | 'accessibility' | 'performance' | 'branding'
  value: string
  priority: 'required' | 'preferred' | 'optional'
}

export interface DesignIntent {
  type: 'layout' | 'component' | 'style' | 'animation'
  complexity: 'simple' | 'medium' | 'complex'
  requirements: string[]
  constraints: DesignConstraint[]
  confidence: number
}

export interface GeneratedCode {
  language: 'typescript' | 'tsx' | 'css' | 'json'
  content: string
  dependencies: string[]
  warnings: string[]
}

export interface ErrorDiagnosis {
  severity: 'error' | 'warning' | 'info'
  message: string
  location?: { file: string; line: number; column: number }
  suggestion: string
  autoFixable: boolean
}

export interface Documentation {
  type: 'component' | 'api' | 'guide'
  title: string
  content: string
  examples: string[]
}

export interface AILayer {
  recognizeIntent(input: UserInput): Promise<DesignIntent>
  generateCode(design: DesignIntent): Promise<GeneratedCode>
  diagnoseError(code: string): Promise<ErrorDiagnosis[]>
  generateDocumentation(code: string): Promise<Documentation>
}

/* ================================================================
   Layer 4 — 数据持久层 (Data Persistence Layer)
   ================================================================ */

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system'
  language: 'zh-CN' | 'en-US' | 'zh-TW' | 'ja-JP' | 'ko-KR'
  editorFontSize: number
  editorTabSize: number
  autoSave: boolean
  autoSaveInterval: number
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  status: 'online' | 'busy' | 'offline'
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
}

export interface DesignJSON {
  version: string
  components: ComponentConfig[]
  styles: Record<string, any>
  metadata: Record<string, any>
}

export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  designJson: DesignJSON
  code?: string
  status: 'draft' | 'active' | 'archived'
  isPublic: boolean
  collaborators: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  userId: string
  projectId: string
  messages: SessionMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface SessionMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

/* ================================================================
   Layer 5 — 技术实现层 (Tech Implementation Layer)
   ================================================================ */

export interface TechStackItem {
  name: string
  version: string
  latestVersion?: string
  category: 'frontend' | 'backend' | 'devtools' | 'ai' | 'infra'
  purpose: string
  reason: string
  status?: 'current' | 'updatable' | 'deprecated' | 'beta'
  updateStrategy?: 'auto' | 'manual' | 'locked'
  dependencies?: string[]
}

export interface ArchitecturePhase {
  id: string
  name: string
  quarter: string
  description: string
  deployMethod: string
  targetUsers: string
  status: 'completed' | 'current' | 'planned' | 'future'
}

/* ================================================================
   Cross-Cutting — 安全与性能
   ================================================================ */

export interface SecurityConfig {
  authentication: {
    method: 'jwt'
    accessTokenTTL: number
    refreshTokenTTL: number
  }
  authorization: {
    model: 'rbac'
    roles: string[]
  }
  rateLimit: {
    requestsPerMinute: number
    burstLimit: number
  }
  encryption: {
    algorithm: 'AES-256-GCM'
    keyDerivation: 'PBKDF2' | 'Argon2'
  }
}

export interface PerformanceTargets {
  responseTimeP95: number
  errorRate: number
  availability: number
  ttfb: number
  lcp: number
  fid: number
  cls: number
}

/* ================================================================
   Architecture Metadata
   ================================================================ */

export interface ArchitectureLayer {
  id: string
  name: string
  nameCn: string
  description: string
  modules: string[]
  color: string
  icon: string
}

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    id: 'interaction',
    name: 'User Interaction Layer',
    nameCn: '用户交互层',
    description: '首页入口 | 设计画布 | AI交互区 | 预览视图',
    modules: ['HomePage', 'DesignerCanvas', 'AIChat', 'PreviewPanel'],
    color: '#8b5cf6',
    icon: 'Monitor',
  },
  {
    id: 'logic',
    name: 'Function Logic Layer',
    nameCn: '功能逻辑层',
    description: '路由决策 | 面板管理 | 组件系统 | 状态管理',
    modules: ['Router', 'PanelManager', 'ComponentSystem', 'StateManager'],
    color: '#6366f1',
    icon: 'Workflow',
  },
  {
    id: 'ai',
    name: 'AI Intelligence Layer',
    nameCn: 'AI 智能层',
    description: '意图识别 | 代码生成 | 错误诊断 | 文档生成',
    modules: ['IntentRecognizer', 'CodeGenerator', 'ErrorDiagnostics', 'DocGenerator'],
    color: '#06b6d4',
    icon: 'Brain',
  },
  {
    id: 'data',
    name: 'Data Persistence Layer',
    nameCn: '数据持久层',
    description: 'Design JSON | 代码仓库 | 用户数据 | 协同状态',
    modules: ['DesignStore', 'CodeRepo', 'UserData', 'CollabState'],
    color: '#10b981',
    icon: 'Database',
  },
  {
    id: 'tech',
    name: 'Tech Implementation Layer',
    nameCn: '技术实现层',
    description: 'React + TS | Monaco Editor | WebSocket | CRDT',
    modules: ['React', 'TypeScript', 'MonacoEditor', 'WebSocket', 'CRDT'],
    color: '#f59e0b',
    icon: 'Cpu',
  },
]

export const TECH_STACK: TechStackItem[] = [
  // Frontend
  { name: 'React', version: '18.3.1', latestVersion: '18.3.1', category: 'frontend', purpose: 'UI 框架', reason: '生态成熟，组件化开发效率高', status: 'current', updateStrategy: 'manual' },
  { name: 'TypeScript', version: '5.3.3', latestVersion: '5.3.3', category: 'frontend', purpose: '类型系统', reason: '类型安全，减少运行时错误', status: 'current', updateStrategy: 'manual' },
  { name: 'Vite', version: '6.3.5', latestVersion: '6.3.5', category: 'devtools', purpose: '构建工具', reason: '开发体验好，构建速度快', status: 'current', updateStrategy: 'manual' },
  { name: 'Zustand', version: '5.x', latestVersion: '5.0.11', category: 'frontend', purpose: '状态管理', reason: '轻量级，API 简洁', status: 'current', updateStrategy: 'auto' },
  { name: 'React Query', version: '5.17.19', latestVersion: '5.17.19', category: 'frontend', purpose: '服务端状态', reason: '数据获取与缓存最佳实践', status: 'current', updateStrategy: 'auto' },
  { name: 'Tailwind CSS', version: '4.1', latestVersion: '4.1.12', category: 'frontend', purpose: '样式框架', reason: '原子化 CSS，开发效率高', status: 'current', updateStrategy: 'manual' },
  { name: 'Lucide React', version: '0.487.0', latestVersion: '0.487.0', category: 'frontend', purpose: '图标库', reason: '统一线条风格，24px 标准', status: 'current', updateStrategy: 'auto' },
  { name: 'React Router', version: '7.x', latestVersion: '7.13.0', category: 'frontend', purpose: '路由系统', reason: 'Data mode，嵌套路由', status: 'current', updateStrategy: 'manual' },
  { name: 'Monaco Editor', version: '0.45.0', latestVersion: '0.45.0', category: 'frontend', purpose: '代码编辑器', reason: 'VS Code 同款，功能强大', status: 'current', updateStrategy: 'locked' },
  { name: 'Motion', version: '12.x', latestVersion: '12.23.24', category: 'frontend', purpose: '动画引擎', reason: '声明式动画，手势支持', status: 'current', updateStrategy: 'auto' },
  { name: 'react-resizable-panels', version: '2.x', latestVersion: '2.1.7', category: 'frontend', purpose: '面板布局', reason: '可拖拽分割面板', status: 'current', updateStrategy: 'auto' },
  { name: 'Recharts', version: '2.x', latestVersion: '2.15.2', category: 'frontend', purpose: '数据可视化', reason: '声明式图表组件', status: 'current', updateStrategy: 'auto' },
  // Backend
  { name: 'Node.js', version: '20.11.0', latestVersion: '20.11.1', category: 'backend', purpose: '运行时', reason: 'JavaScript 全栈，开发效率高', status: 'updatable', updateStrategy: 'manual' },
  { name: 'Express', version: '5.0.0', latestVersion: '5.0.0', category: 'backend', purpose: 'Web 框架', reason: '轻量级，生态丰富', status: 'current', updateStrategy: 'manual' },
  { name: 'GraphQL', version: '16.8.0', latestVersion: '16.8.0', category: 'backend', purpose: 'API 查询语言', reason: '高效数据查询，类型安全', status: 'current', updateStrategy: 'manual' },
  { name: 'Socket.io', version: '4.6.1', latestVersion: '4.6.1', category: 'backend', purpose: '实时通信', reason: 'WebSocket 封装完善', status: 'current', updateStrategy: 'manual' },
  { name: 'PostgreSQL', version: '16.1', latestVersion: '16.1', category: 'backend', purpose: '关系数据库', reason: '功能强大，扩展性好', status: 'current', updateStrategy: 'locked' },
  { name: 'Redis', version: '7.2.4', latestVersion: '7.2.4', category: 'backend', purpose: '缓存 / 会话', reason: '高性能缓存，会话管理', status: 'current', updateStrategy: 'locked' },
  // AI
  { name: 'OpenAI API', version: 'Latest', latestVersion: 'Latest', category: 'ai', purpose: 'GPT 系列模型', reason: '多模态推理，代码��成准确', status: 'current', updateStrategy: 'auto' },
  { name: 'Anthropic API', version: 'Latest', latestVersion: 'Latest', category: 'ai', purpose: 'Claude 系列', reason: '长上下文推理，对话能力强', status: 'current', updateStrategy: 'auto' },
  { name: 'Ollama', version: 'Latest', latestVersion: 'Latest', category: 'ai', purpose: '本地模型运行', reason: '数据私有化，离线支持', status: 'current', updateStrategy: 'auto' },
  // Infra / DevTools
  { name: 'Yjs', version: '13.x', latestVersion: '13.6.10', category: 'infra', purpose: 'CRDT 协同', reason: '无冲突协同编辑', status: 'current', updateStrategy: 'manual' },
  { name: 'Zod', version: '3.x', latestVersion: '3.22.4', category: 'devtools', purpose: '数据校验', reason: '运行时类型验证', status: 'current', updateStrategy: 'auto' },
]

/* ================================================================
   Architecture Design Principles
   ================================================================ */

export interface DesignPrinciple {
  id: string
  title: string
  titleEn: string
  description: string
  icon: string
  color: string
}

export const DESIGN_PRINCIPLES: DesignPrinciple[] = [
  { id: 'cohesion', title: '高内聚低耦合', titleEn: 'High Cohesion, Low Coupling', description: '各层职责明确，接口清晰，层间通过定义好的 TypeScript 接口通信', icon: 'Layers', color: '#8b5cf6' },
  { id: 'extensible', title: '可扩展性', titleEn: 'Extensibility', description: '插件 API 支持第三方扩展；Provider 动态注册；模型/工具热插拔', icon: 'Boxes', color: '#6366f1' },
  { id: 'maintainable', title: '可维护性', titleEn: 'Maintainability', description: '统一命名规范、文件标头、分层架构，代码结构清晰便于团队协作', icon: 'Wrench', color: '#06b6d4' },
  { id: 'testable', title: '可测试性', titleEn: 'Testability', description: '各层可独立测试：单元测试 60% + 集成测试 30% + E2E 测试 10%', icon: 'Shield', color: '#10b981' },
]

export const ARCHITECTURE_PHASES: ArchitecturePhase[] = [
  { id: 'mvp', name: 'MVP 单体架构', quarter: '2026 Q2', description: '前端 + 后端 + 数据库 + AI 服务', deployMethod: '单机部署', targetUsers: '内部测试用户', status: 'current' },
  { id: 'micro', name: '微服务化', quarter: '2026 Q3-Q4', description: '用户服务 | 项目服务 | AI 服务 | 协同服务', deployMethod: 'Docker Compose', targetUsers: '早期采用者', status: 'planned' },
  { id: 'cloud', name: '云原生', quarter: '2027 Q1-Q2', description: 'Kubernetes + Service Mesh + Serverless', deployMethod: 'K8s 集群', targetUsers: '企业客户', status: 'future' },
  { id: 'global', name: '全球化', quarter: '2027 Q3+', description: '多区域部署 + CDN + 边缘计算', deployMethod: '全球多活', targetUsers: '全球开发者', status: 'future' },
]