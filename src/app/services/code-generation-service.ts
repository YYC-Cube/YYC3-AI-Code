/**
 * @file code-generation-service.ts
 * @description AI 智能层 — 代码生成管线 (Design → Parse → Intent → Template → AI → Optimize → QA → Output)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 2.0.0
 * @created 2026-03-13
 * @updated 2026-03-13
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai, codegen, templates, pipeline
 */

import { createLogger } from '../utils/logger'
import { templateEngine } from './template-engine'
import { promptBuilder } from './prompt-builder'
import { codeQualityService } from './code-quality-service'
import type { DesignIntent, GeneratedCode, ErrorDiagnosis, Documentation } from '../types/architecture'
import type {
  FigmaDesign,
  FigmaComponent,
  DesignIntent as CodegenIntent,
  GenerationContext,
  GenerationOptions,
  PipelineResult,
  PipelineStage,
  GenerationError,
  CodeQuality,
  TemplateContext,
} from '../types/codegen'

const log = createLogger('CodeGeneration')

/* ================================================================
   Default Generation Options
   ================================================================ */

const DEFAULT_OPTIONS: GenerationOptions = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.3,
  maxTokens: 4096,
  stream: false,
  comments: true,
  typeDefinitions: true,
  optimize: true,
  qualityCheck: true,
  tailwind: true,
  aria: true,
}

/* ================================================================
   Template Registry (legacy compat — still used by quick generation)
   ================================================================ */

const TEMPLATES: Record<string, (intent: DesignIntent) => string> = {
  'layout:simple': () => `
export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b flex items-center px-6">Header</header>
      <main className="flex-1 p-6">Content</main>
      <footer className="h-12 border-t flex items-center px-6 text-sm text-muted-foreground">Footer</footer>
    </div>
  )
}`.trim(),

  'layout:medium': () => `
export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r p-4">Sidebar</aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center px-6">Header</header>
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cards */}
          </div>
        </main>
      </div>
    </div>
  )
}`.trim(),

  'component:simple': (intent) => `
interface ${intent.requirements[0] || 'Component'}Props {
  children?: React.ReactNode
}

export function ${intent.requirements[0] || 'Component'}({ children }: ${intent.requirements[0] || 'Component'}Props) {
  return (
    <div className="rounded-lg border p-4">
      {children}
    </div>
  )
}`.trim(),
}

/* ================================================================
   Design Intent Recognition
   ================================================================ */

function recognizeDesignIntent(design: FigmaDesign): CodegenIntent {
  const componentCount = design.components.length
  const hasResponsive = design.styles.some(s => s.responsive)

  // Analyze component types for pattern detection
  const types = design.components.map(c => c.type)
  const hasFrames = types.filter(t => t === 'FRAME').length > 3
  const hasText = types.includes('TEXT')

  const suggestedPatterns: string[] = []
  if (hasFrames) {suggestedPatterns.push('layout', 'grid')}
  if (hasText) {suggestedPatterns.push('text', 'content')}
  if (componentCount > 10) {suggestedPatterns.push('dashboard')}

  return {
    type: componentCount > 10 ? 'layout' : hasFrames ? ('component' as any) : 'component',
    complexity: componentCount > 20 ? 'complex' : componentCount > 5 ? 'medium' : 'simple',
    requirements: extractRequirements(design),
    constraints: [
      ...(hasResponsive ? [{ type: 'responsive' as const, description: '支持多屏幕尺寸', priority: 'high' as const }] : []),
      { type: 'accessibility' as const, description: '满足 WCAG 标准', priority: 'high' as const },
      { type: 'performance' as const, description: '首屏渲染 < 1s', priority: 'medium' as const },
    ],
    suggestedPatterns,
    estimatedComponents: componentCount,
  }
}

function extractRequirements(design: FigmaDesign): string[] {
  const reqs: string[] = []
  const componentNames = design.components.map(c => c.name)
  if (componentNames.some(n => /nav|header/i.test(n))) {reqs.push('Navigation')}
  if (componentNames.some(n => /sidebar/i.test(n))) {reqs.push('Sidebar')}
  if (componentNames.some(n => /card/i.test(n))) {reqs.push('Card')}
  if (componentNames.some(n => /button/i.test(n))) {reqs.push('Button')}
  if (componentNames.some(n => /input|form/i.test(n))) {reqs.push('Form')}
  if (componentNames.some(n => /table|list/i.test(n))) {reqs.push('DataDisplay')}
  if (componentNames.some(n => /modal|dialog/i.test(n))) {reqs.push('Modal')}
  if (reqs.length === 0) {reqs.push('GeneratedComponent')}
  return reqs
}

/* ================================================================
   Service Implementation
   ================================================================ */

export class CodeGenerationService {

  /* ──────────────────────────────────────
     Quick Generation (legacy compat)
     ────────────────────────────────────── */

  static async generate(intent: DesignIntent): Promise<GeneratedCode> {
    const templateKey = `${intent.type}:${intent.complexity}`
    const template = TEMPLATES[templateKey]
    const content = template ? template(intent) : this.generateFallback(intent)
    const dependencies = this.detectDependencies(content)
    const warnings = this.validate(content)
    return { language: 'tsx', content, dependencies, warnings }
  }

  /* ──────────────────────────────────────
     Full Pipeline
     ────────────────────────────────────── */

  /**
   * Run the complete code generation pipeline:
   *   1. Parse design → 2. Recognize intent → 3. Match template →
   *   4. Generate code → 5. Optimize → 6. Quality check → 7. Output
   */
  static async runPipeline(context: GenerationContext): Promise<{
    code: string
    quality?: CodeQuality
    pipelineResults: PipelineResult[]
    warnings: string[]
  }> {
    const options = { ...DEFAULT_OPTIONS, ...context.options }
    const results: PipelineResult[] = []
    let generatedCode = ''

    try {
      // ── Stage 1: Parse ──
      let intent: CodegenIntent | undefined = context.intent
      if (context.designFile && !intent) {
        const start = performance.now()
        intent = recognizeDesignIntent(context.designFile)
        results.push({ stage: 'parse', success: true, duration: performance.now() - start, output: intent })
        log.debug('Intent recognized', intent)
      }

      // ── Stage 2: Template Match ──
      if (intent) {
        const start = performance.now()
        const matched = templateEngine.matchTemplates(intent)
        results.push({ stage: 'template', success: true, duration: performance.now() - start, output: matched.map(t => t.id) })

        // ── Stage 3: Generate from template ──
        if (matched.length > 0 && !context.currentCode) {
          const selectedTemplate = context.selectedTemplate || matched[0].id
          const templateCtx: TemplateContext = {
            componentName: intent.requirements[0] || 'GeneratedComponent',
            props: [],
            children: true,
            styles: {},
            responsive: intent.constraints.some(c => c.type === 'responsive'),
            accessibility: options.aria,
            animations: false,
            techStack: { styling: 'tailwind' },
          }

          const genStart = performance.now()
          generatedCode = templateEngine.generate(selectedTemplate, templateCtx)
          results.push({ stage: 'generate', success: true, duration: performance.now() - genStart })
        }
      }

      // If no template match or code came from context
      if (!generatedCode && context.currentCode) {
        generatedCode = context.currentCode
      }

      if (!generatedCode) {
        generatedCode = this.generateFallback({
          type: (intent?.type || 'component') as any,
          complexity: intent?.complexity || 'simple',
          requirements: intent?.requirements || ['Component'],
          constraints: [],
          confidence: 0.5,
        })
        results.push({ stage: 'generate', success: true, duration: 0 })
      }

      // ── Stage 4: Optimize ──
      if (options.optimize) {
        const optStart = performance.now()
        const optimized = codeQualityService.optimize(generatedCode)
        generatedCode = optimized.optimized
        results.push({
          stage: 'optimize',
          success: true,
          duration: performance.now() - optStart,
          output: { changes: optimized.changes.length, compressionRatio: optimized.compressionRatio },
        })
      }

      // ── Stage 5: Quality Check ──
      let quality: CodeQuality | undefined
      if (options.qualityCheck) {
        const qaStart = performance.now()
        quality = codeQualityService.analyze(generatedCode)
        results.push({
          stage: 'validate',
          success: true,
          duration: performance.now() - qaStart,
          output: { score: quality.score, grade: quality.grade, issues: quality.issues.length },
        })
      }

      // ── Stage 6: Output ──
      const warnings = this.validate(generatedCode)
      results.push({ stage: 'output', success: true, duration: 0 })

      log.info('Pipeline complete', {
        stages: results.length,
        codeLength: generatedCode.length,
        score: quality?.score,
        grade: quality?.grade,
      })

      return { code: generatedCode, quality, pipelineResults: results, warnings }

    } catch (err: unknown) {
      const error = err as Error
      log.error('Pipeline failed', { error: error.message })

      const genError: GenerationError = {
        type: 'generation',
        message: error.message,
        stage: 'generate',
        recovery: {
          type: 'fallback',
          description: '使用默认模板生成基础组件',
        },
      }

      results.push({ stage: 'generate', success: false, duration: 0, error: genError })

      // Fallback
      generatedCode = this.generateFallback({
        type: 'component', complexity: 'simple',
        requirements: ['FallbackComponent'], constraints: [], confidence: 0,
      })

      return { code: generatedCode, pipelineResults: results, warnings: ['管线异常，使用了备用模板'] }
    }
  }

  /* ──────────────────────────────────────
     AI Prompt Building
     ────────────────────────────────────── */

  /**
   * Build a complete AI prompt for code generation.
   */
  static buildPrompt(intent: CodegenIntent, userMessage: string, currentCode?: string) {
    return promptBuilder.buildCodeGenPrompt(intent, {
      intent,
      userMessage,
      currentCode,
      language: 'zh',
    })
  }

  /**
   * Build a prompt for error diagnosis.
   */
  static buildDiagnosisPrompt(code: string, errorContext?: string) {
    return promptBuilder.buildDiagnosisPrompt(code, 'tsx', errorContext)
  }

  /**
   * Build a prompt for documentation generation.
   */
  static buildDocPrompt(code: string, componentName: string) {
    return promptBuilder.buildDocPrompt(code, componentName)
  }

  /* ──────────────────────────────────────
     Error Diagnosis
     ────────────────────────────────────── */

  static diagnoseErrors(code: string): ErrorDiagnosis[] {
    const quality = codeQualityService.analyze(code)
    return quality.issues.map(issue => ({
      severity: issue.severity,
      message: issue.message,
      location: issue.line ? { file: 'generated.tsx', line: issue.line, column: issue.column || 0 } : undefined,
      suggestion: issue.fix || `检查规则: ${issue.rule}`,
      autoFixable: issue.autoFixable,
    }))
  }

  /* ──────────────────────────────────────
     Documentation Generation
     ────────────────────────────────────── */

  static generateDocs(code: string, componentName: string): Documentation {
    return {
      type: 'component',
      title: componentName,
      content: `## ${componentName}\n\nAuto-generated component documentation.\n\n### Usage\n\n\`\`\`tsx\nimport { ${componentName} } from './${componentName}'\n\`\`\``,
      examples: [`<${componentName} />`, `<${componentName}>Content</${componentName}>`],
    }
  }

  /* ──────────────────────────────────────
     Quality Analysis (public convenience)
     ────────────────────────────────────── */

  static analyzeQuality(code: string): CodeQuality {
    return codeQualityService.analyze(code)
  }

  /* ──────────────────────────────────────
     Private Helpers
     ────────────────────────────────────── */

  private static generateFallback(intent: DesignIntent): string {
    return `// Auto-generated ${intent.type} component (${intent.complexity})
// Requirements: ${intent.requirements.join(', ')}

export default function GeneratedComponent() {
  return (
    <div className="p-6">
      <h2 className="text-lg mb-4">${intent.requirements[0] || 'Generated Component'}</h2>
      <p className="text-muted-foreground">待实现</p>
    </div>
  )
}`
  }

  private static detectDependencies(code: string): string[] {
    const deps: string[] = []
    if (code.includes('motion')) {deps.push('motion')}
    if (code.includes('useForm')) {deps.push('react-hook-form')}
    if (code.includes('z.')) {deps.push('zod')}
    if (code.includes('Recharts') || code.includes('BarChart')) {deps.push('recharts')}
    if (code.includes('lucide-react') || code.includes('from \'lucide-react\'')) {deps.push('lucide-react')}
    if (code.includes('useQuery') || code.includes('useMutation')) {deps.push('@tanstack/react-query')}
    return deps
  }

  private static validate(code: string): string[] {
    const warnings: string[] = []
    if (code.length > 5000) {warnings.push('生成代码超过 5000 字符，建议拆分组件')}
    if ((code.match(/useState/g) || []).length > 8) {warnings.push('状态变量过多，建议抽取为自定义 Hook 或 Zustand Store')}
    if (!code.includes('export')) {warnings.push('缺少导出声明')}
    return warnings
  }
}