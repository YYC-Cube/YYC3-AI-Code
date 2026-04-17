/**
 * @file codegen.ts
 * @description YYC³ 代码生成智能规范类型 — Figma 解析、模板系统、AST、质量检查、生成管线
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 */

/* ================================================================
   Figma Design Parsing
   ================================================================ */

export interface FigmaDesign {
  document: FigmaDocument
  components: FigmaComponent[]
  styles: FigmaStyle[]
  assets: FigmaAsset[]
}

export interface FigmaDocument {
  id: string
  name: string
  type: string
  children: FigmaComponent[]
}

export interface FigmaComponent {
  id: string
  name: string
  type: 'FRAME' | 'COMPONENT' | 'INSTANCE' | 'GROUP' | 'TEXT' | 'RECTANGLE' | 'VECTOR'
  children?: FigmaComponent[]
  properties: FigmaComponentProperties
  styles: FigmaComponentStyles
}

export interface FigmaComponentProperties {
  width: number
  height: number
  x: number
  y: number
  rotation: number
  opacity: number
  cornerRadius: number[]
  effects: FigmaEffect[]
  constraints?: {
    horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'SCALE'
    vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'SCALE'
  }
}

export interface FigmaComponentStyles {
  backgroundColor?: string
  fills?: FigmaFill[]
  strokes?: FigmaStroke[]
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'
  responsive?: boolean
}

export interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'BLUR' | 'BACKGROUND_BLUR'
  visible: boolean
  radius: number
  offset?: { x: number; y: number }
  color?: { r: number; g: number; b: number; a: number }
}

export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE'
  color?: { r: number; g: number; b: number; a: number }
  opacity?: number
  imageRef?: string
}

export interface FigmaStroke {
  type: 'SOLID'
  color: { r: number; g: number; b: number; a: number }
  weight: number
}

export interface FigmaStyle {
  id: string
  name: string
  type: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
  description?: string
  responsive?: boolean
}

export interface FigmaAsset {
  id: string
  name: string
  type: 'image' | 'icon' | 'font'
  url: string
  format: string
}

/* ================================================================
   Design Intent Recognition
   ================================================================ */

export interface DesignIntent {
  type: 'layout' | 'component' | 'style' | 'animation' | 'page'
  complexity: 'simple' | 'medium' | 'complex'
  requirements: string[]
  constraints: DesignConstraint[]
  suggestedPatterns: string[]
  estimatedComponents: number
}

export interface DesignConstraint {
  type: 'responsive' | 'accessibility' | 'performance' | 'branding' | 'i18n'
  description: string
  priority: 'high' | 'medium' | 'low'
}

/* ================================================================
   Template System
   ================================================================ */

export interface ComponentTemplate {
  id: string
  name: string
  category: 'layout' | 'ui' | 'form' | 'data' | 'navigation' | 'feedback'
  description: string
  complexity: 'simple' | 'medium' | 'complex'
  /** Template function that generates TSX code */
  generate: (context: TemplateContext) => string
  /** Required dependencies */
  dependencies: string[]
  /** Tags for matching */
  tags: string[]
}

export interface TemplateContext {
  componentName: string
  props: TemplateProp[]
  children?: boolean
  styles: Record<string, string>
  responsive: boolean
  accessibility: boolean
  animations: boolean
  techStack: {
    styling: 'tailwind' | 'css-modules' | 'styled-components'
    stateManagement?: string
  }
}

export interface TemplateProp {
  name: string
  type: string
  required: boolean
  defaultValue?: string
  description?: string
}

/* ================================================================
   Code Generation Pipeline
   ================================================================ */

export type PipelineStage =
  | 'parse'
  | 'intent'
  | 'template'
  | 'generate'
  | 'transform'
  | 'optimize'
  | 'validate'
  | 'output'

export interface PipelineResult {
  stage: PipelineStage
  success: boolean
  duration: number // ms
  output?: unknown
  error?: GenerationError
}

export interface GenerationContext {
  projectId: string
  designFile?: FigmaDesign
  intent?: DesignIntent
  selectedTemplate?: string
  currentCode?: string
  targetLanguage: 'tsx' | 'typescript' | 'css' | 'json'
  options: GenerationOptions
}

export interface GenerationOptions {
  /** AI model to use */
  model: string
  /** Temperature for generation */
  temperature: number
  /** Max tokens in output */
  maxTokens: number
  /** Use streaming */
  stream: boolean
  /** Include inline comments */
  comments: boolean
  /** Generate TypeScript interfaces */
  typeDefinitions: boolean
  /** Apply auto-optimization */
  optimize: boolean
  /** Run quality check */
  qualityCheck: boolean
  /** Target Tailwind CSS */
  tailwind: boolean
  /** Include accessibility attributes */
  aria: boolean
}

/* ================================================================
   Code Quality
   ================================================================ */

export interface CodeQuality {
  /** Overall score 0-100 */
  score: number
  /** Grade label */
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  /** Individual issues */
  issues: QualityIssue[]
  /** Improvement suggestions */
  suggestions: ImprovementSuggestion[]
  /** Metrics breakdown */
  metrics: QualityMetrics
}

export interface QualityIssue {
  id: string
  severity: 'error' | 'warning' | 'info'
  category: QualityCategory
  message: string
  line?: number
  column?: number
  rule: string
  autoFixable: boolean
  fix?: string
}

export type QualityCategory =
  | 'type-safety'
  | 'performance'
  | 'accessibility'
  | 'best-practice'
  | 'maintainability'
  | 'security'
  | 'style'

export interface ImprovementSuggestion {
  category: QualityCategory
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  codeExample?: string
}

export interface QualityMetrics {
  typeSafety: number      // 0-100
  performance: number     // 0-100
  accessibility: number   // 0-100
  bestPractice: number    // 0-100
  maintainability: number // 0-100
  security: number        // 0-100
}

/* ================================================================
   Generation Error & Recovery
   ================================================================ */

export interface GenerationError {
  type: 'parse' | 'generation' | 'validation' | 'optimization' | 'template'
  message: string
  stage: PipelineStage
  details?: Record<string, unknown>
  recovery?: RecoveryAction
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'manual' | 'skip'
  description: string
  /** Auto-executed recovery function */
  execute?: () => Promise<unknown>
}

/* ================================================================
   Code Optimization
   ================================================================ */

export interface OptimizationResult {
  original: string
  optimized: string
  changes: OptimizationChange[]
  sizeBefore: number
  sizeAfter: number
  compressionRatio: number
}

export interface OptimizationChange {
  type: 'memo' | 'callback' | 'lazy' | 'key' | 'cleanup' | 'extract' | 'simplify'
  description: string
  line?: number
  before?: string
  after?: string
}

/* ================================================================
   AI Prompt Types
   ================================================================ */

export interface PromptTemplate {
  id: string
  name: string
  /** System prompt role */
  systemPrompt: string
  /** User prompt template with {{placeholders}} */
  userTemplate: string
  /** Required context variables */
  requiredVars: string[]
  /** Optimal temperature for this prompt type */
  temperature: number
  /** Max tokens recommendation */
  maxTokens: number
}

export interface PromptContext {
  design?: FigmaDesign
  intent?: DesignIntent
  currentCode?: string
  selectedCode?: string
  fileContext?: string[]
  errorContext?: string
  userMessage: string
  language: 'zh' | 'en'
}

export interface BuiltPrompt {
  system: string
  user: string
  estimatedTokens: number
  templateId: string
}
