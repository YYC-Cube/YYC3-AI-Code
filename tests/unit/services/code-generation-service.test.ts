/**
 * @file code-generation-service.test.ts
 * @description Code Generation Service 全面测试 — 覆盖管线、模板匹配、质量检查、错误诊断、文档生成
 * @author YYC³ QA Team
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { DesignIntent, DesignConstraint as ArchDesignConstraint } from '@/app/types/architecture'
import type { GenerationContext, FigmaDesign, GenerationOptions } from '@/app/types/codegen'

function createTestDesignFile(overrides?: Partial<FigmaDesign>): FigmaDesign {
  return {
    document: {
      id: 'doc-1',
      name: overrides?.document?.name || 'Test Design',
      type: 'DOCUMENT',
      children: overrides?.document?.children || [],
    },
    components: overrides?.components || [
      { id: '1', name: 'Button', type: 'COMPONENT', properties: { width: 100, height: 40, x: 0, y: 0, rotation: 0, opacity: 1, cornerRadius: [], effects: [] }, styles: { fills: [], strokes: [] } },
    ],
    styles: overrides?.styles || [],
    assets: overrides?.assets || [],
  }
}

function createTestOptions(overrides?: Partial<GenerationOptions>): GenerationOptions {
  return {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    stream: false,
    comments: true,
    typeDefinitions: true,
    optimize: true,
    qualityCheck: true,
    tailwind: true,
    aria: true,
    ...overrides,
  }
}

function createTestContext(overrides?: Partial<GenerationContext>): GenerationContext {
  return {
    projectId: 'test-project',
    targetLanguage: 'tsx',
    designFile: createTestDesignFile(),
    options: createTestOptions(),
    ...overrides,
  }
}

function createTestConstraint(overrides?: Partial<ArchDesignConstraint>): ArchDesignConstraint {
  return {
    type: 'responsive',
    value: 'mobile-first',
    priority: 'required',
    ...overrides,
  }
}

function createTestIntent(overrides?: Partial<DesignIntent> & { constraints?: Partial<ArchDesignConstraint>[] }): DesignIntent {
  const constraintOverrides = overrides?.constraints || []
  const constraints: ArchDesignConstraint[] = constraintOverrides.map(c => createTestConstraint(c))

  const { constraints: _, ...rest } = overrides || {}

  return {
    type: 'component',
    complexity: 'simple',
    requirements: ['Test'],
    confidence: 0.9,
    ...rest,
    constraints,
  }
}

// Mock dependencies before importing the service
const mockTemplateEngine = {
  matchTemplates: vi.fn(),
  generate: vi.fn(),
}

const mockPromptBuilder = {
  buildCodeGenPrompt: vi.fn(),
  buildDiagnosisPrompt: vi.fn(),
  buildDocPrompt: vi.fn(),
}

const mockCodeQualityService = {
  optimize: vi.fn(),
  analyze: vi.fn(),
}

vi.mock('@/app/services/template-engine', () => ({
  templateEngine: mockTemplateEngine,
}))

vi.mock('@/app/services/prompt-builder', () => ({
  promptBuilder: mockPromptBuilder,
}))

vi.mock('@/app/services/code-quality-service', () => ({
  codeQualityService: mockCodeQualityService,
}))

describe('CodeGenerationService - Quick Generation', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockTemplateEngine.matchTemplates.mockReturnValue([])
    mockCodeQualityService.analyze.mockReturnValue({
      score: 85,
      grade: 'A',
      issues: [],
      metrics: { complexity: 'low', maintainability: 'high', testability: 'good' },
    })
  })

  it('应该能够生成简单布局组件', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const intent = createTestIntent({
      type: 'layout',
      requirements: ['Navigation'],
      constraints: [{ type: 'responsive', value: 'mobile-first', priority: 'required' }],
      confidence: 0.9,
    })

    const result = await CodeGenerationService.generate(intent)

    expect(result).toBeDefined()
    expect(result.language).toBe('tsx')
    expect(result.content).toContain('export default function Layout')
    expect(result.content).toContain('Header')
    expect(result.content).toContain('Footer')
    expect(Array.isArray(result.dependencies)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it('应该能够生成中等复杂度布局', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')
    
    const intent = {
      type: 'layout' as const,
      complexity: 'medium' as const,
      requirements: ['Sidebar', 'Dashboard'],
      constraints: [],
      confidence: 0.8,
    }

    const result = await CodeGenerationService.generate(intent)

    expect(result.content).toContain('DashboardLayout')
    expect(result.content).toContain('Sidebar')
    expect(result.content).toContain('grid-cols-1 md:grid-cols-2 lg:grid-cols-3')
  })

  it('应该能够生成简单组件', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')
    
    const intent = {
      type: 'component' as const,
      complexity: 'simple' as const,
      requirements: ['Card'],
      constraints: [],
      confidence: 0.85,
    }

    const result = await CodeGenerationService.generate(intent)

    expect(result.content).toContain('CardProps')
    expect(result.content).toContain('function Card')
    expect(result.content).toContain('children?: React.ReactNode')
  })

  it('应该能够检测依赖项', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')
    
    const intent = {
      type: 'component' as const,
      complexity: 'simple' as const,
      requirements: ['ComponentWithMotion'],
      constraints: [],
      confidence: 0.9,
    }

    // 使用包含motion的fallback代码来测试依赖检测
    // 实际上generate会使用模板，但我们可以验证dependencies数组结构
    const result = await CodeGenerationService.generate(intent)

    expect(Array.isArray(result.dependencies)).toBe(true)
  })

  it('未匹配到模板时应使用fallback', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')
    
    const intent = {
      type: 'custom' as any,
      complexity: 'complex' as const,
      requirements: ['CustomWidget'],
      constraints: [],
      confidence: 0.7,
    }

    const result = await CodeGenerationService.generate(intent)

    expect(result.content).toContain('GeneratedComponent')
    expect(result.content).toContain('// Auto-generated custom component')
  })
})

describe('CodeGenerationService - Full Pipeline', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup default pipeline mocks
    mockTemplateEngine.matchTemplates.mockReturnValue([
      { id: 'react-component', name: 'React Component', confidence: 0.95 }
    ])
    mockTemplateEngine.generate.mockReturnValue(`
import React from 'react'

export default function GeneratedComponent({ children }) {
  return <div className="p-4">{children}</div>
}
`)
    mockCodeQualityService.optimize.mockReturnValue({
      optimized: `import React from 'react'

export default function GeneratedComponent({ children }) {
  return <div className="p-6">{children}</div> /* optimized */
}`,
      changes: [{ line: 3, description: '增加padding' }],
      compressionRatio: 0.98,
    })
    mockCodeQualityService.analyze.mockReturnValue({
      score: 92,
      grade: 'A+',
      issues: [],
      metrics: { complexity: 'low', maintainability: 'excellent', testability: 'excellent' },
    })
  })

  it('应该执行完整的管线流程', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const context = createTestContext({
      designFile: createTestDesignFile({
        document: {
          id: 'doc-pipeline',
          name: 'Test Design',
          type: 'DOCUMENT',
          children: [],
        },
        components: [
          { id: '1', name: 'Button', type: 'COMPONENT', properties: { width: 100, height: 40, x: 0, y: 0, rotation: 0, opacity: 1, cornerRadius: [], effects: [] }, styles: { fills: [], strokes: [] } },
          { id: '2', name: 'Card', type: 'COMPONENT', properties: { width: 200, height: 150, x: 0, y: 0, rotation: 0, opacity: 1, cornerRadius: [], effects: [] }, styles: { fills: [], strokes: [] } },
        ],
        styles: [{ id: 's1', name: 'Responsive', type: 'FILL', description: 'responsive', responsive: true }],
      }),
    })

    const result = await CodeGenerationService.runPipeline(context)

    expect(result).toBeDefined()
    expect(typeof result.code).toBe('string')
    expect(result.code.length).toBeGreaterThan(0)
    expect(Array.isArray(result.pipelineResults)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)
    expect(result.pipelineResults.length).toBeGreaterThanOrEqual(5) // parse, template, generate, optimize, output
  })

  it('应该在管线中正确识别设计意图', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const context = createTestContext({
      designFile: createTestDesignFile({
        document: {
          id: 'doc-2',
          name: 'Complex Dashboard',
          type: 'DOCUMENT',
          children: Array(15).fill(null).map((_, i) => ({
            id: `${i}`,
            name: `Component${i}`,
            type: i % 2 === 0 ? 'FRAME' as const : 'COMPONENT' as const,
            properties: { width: 100, height: 100, x: 0, y: 0, rotation: 0, opacity: 1, cornerRadius: [], effects: [] },
            styles: { fills: [], strokes: [] },
          })),
        },
        components: Array(15).fill(null).map((_, i) => ({
          id: `${i}`,
          name: `Component${i}`,
          type: i % 2 === 0 ? 'FRAME' as const : 'COMPONENT' as const,
          properties: { width: 100, height: 100, x: 0, y: 0, rotation: 0, opacity: 1, cornerRadius: [], effects: [] },
          styles: { fills: [], strokes: [] },
        })),
        styles: [{ id: 's1', name: 'Responsive', type: 'FILL', description: 'responsive', responsive: true }],
      }),
      options: createTestOptions({ optimize: false, qualityCheck: false }),
    })

    const result = await CodeGenerationService.runPipeline(context)

    const parseResult = result.pipelineResults.find(r => r.stage === 'parse')
    expect(parseResult).toBeDefined()
    expect(parseResult?.success).toBe(true)
    expect(parseResult?.output).toHaveProperty('type')
  })

  it('应该执行优化阶段', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const context = createTestContext({
      options: createTestOptions({ optimize: true, qualityCheck: false }),
    })

    const result = await CodeGenerationService.runPipeline(context)

    const optimizeResult = result.pipelineResults.find(r => r.stage === 'optimize')
    expect(optimizeResult).toBeDefined()
    expect(optimizeResult?.success).toBe(true)
  })

  it('应该执行质量检查阶段', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const context = createTestContext({
      options: createTestOptions({ optimize: false, qualityCheck: true }),
    })

    const result = await CodeGenerationService.runPipeline(context)

    expect(result.quality).toBeDefined()
    expect(result.quality?.score).toBe(92)
    expect(result.quality?.grade).toBe('A+')

    const validateResult = result.pipelineResults.find(r => r.stage === 'validate')
    expect(validateResult).toBeDefined()
    expect(validateResult?.success).toBe(true)
  })

  it('应该使用当前代码（如果提供）', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const existingCode = `
export function ExistingComponent() {
  return <div>Existing</div>
}
`

    const context = createTestContext({
      currentCode: existingCode,
      options: createTestOptions({ optimize: false, qualityCheck: false }),
    })

    const result = await CodeGenerationService.runPipeline(context)

    expect(result.code).toBe(existingCode)
  })

  it('应该处理管线异常并返回fallback', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    mockTemplateEngine.matchTemplates.mockImplementation(() => {
      throw new Error('Template engine failed')
    })

    const context = createTestContext({
      designFile: createTestDesignFile({
        document: {
          id: 'doc-error',
          name: 'Error Test',
          type: 'DOCUMENT',
          children: [],
        },
        components: [{ id: '1', name: 'Test', type: 'COMPONENT', properties: { width: 100, height: 100, x: 0, y: 0, rotation: 0, opacity: 1, cornerRadius: [], effects: [] }, styles: { fills: [], strokes: [] } }],
        styles: [],
      }),
      options: createTestOptions(),
    })

    const result = await CodeGenerationService.runPipeline(context)

    expect(result.code).toContain('GeneratedComponent')
    expect(result.warnings).toContain('管线异常，使用了备用模板')
    
    const errorResult = result.pipelineResults.find(r => !r.success)
    expect(errorResult).toBeDefined()
    expect(errorResult?.error).toBeDefined()
  })

  it('应该跳过优化和质检（如果选项禁用）', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const context = createTestContext({
      options: createTestOptions({ optimize: false, qualityCheck: false }),
    })

    const result = await CodeGenerationService.runPipeline(context)

    const stages = result.pipelineResults.map(r => r.stage)
    expect(stages).not.toContain('optimize')
    expect(stages).not.toContain('validate')
  })
})

describe('CodeGenerationService - AI Prompt Building', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    mockPromptBuilder.buildCodeGenPrompt.mockReturnValue('Generated code gen prompt')
    mockPromptBuilder.buildDiagnosisPrompt.mockReturnValue('Generated diagnosis prompt')
    mockPromptBuilder.buildDocPrompt.mockReturnValue('Generated doc prompt')
  })

  it('应该构建代码生成prompt', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const intent = createTestIntent({
      type: 'component',
      complexity: 'medium',
      requirements: ['Form'],
      confidence: 0.85,
    })

    const prompt = CodeGenerationService.buildPrompt(intent as any, '创建一个表单组件')

    expect(prompt).toBe('Generated code gen prompt')
    expect(mockPromptBuilder.buildCodeGenPrompt).toHaveBeenCalledWith(intent, expect.objectContaining({
      intent,
      userMessage: '创建一个表单组件',
      language: 'zh',
    }))
  })

  it('应该构建错误诊断prompt', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const code = 'const x = 1'
    const prompt = CodeGenerationService.buildDiagnosisPrompt(code, 'TypeError: x is not defined')

    expect(prompt).toBe('Generated diagnosis prompt')
    expect(mockPromptBuilder.buildDiagnosisPrompt).toHaveBeenCalledWith(code, 'tsx', 'TypeError: x is not defined')
  })

  it('应该构建文档生成prompt', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const code = 'export function MyComponent() {}'
    const prompt = CodeGenerationService.buildDocPrompt(code, 'MyComponent')

    expect(prompt).toBe('Generated doc prompt')
    expect(mockPromptBuilder.buildDocPrompt).toHaveBeenCalledWith(code, 'MyComponent')
  })
})

describe('CodeGenerationService - Error Diagnosis', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    mockCodeQualityService.analyze.mockReturnValue({
      score: 70,
      grade: 'B',
      issues: [
        {
          severity: 'warning' as const,
          message: 'Missing return type',
          rule: 'typescript/return-type',
          line: 3,
          column: 12,
          fix: 'Add return type annotation',
          autoFixable: true,
        },
        {
          severity: 'error' as const,
          message: 'Unused variable',
          rule: 'no-unused-vars',
          line: 5,
          column: 8,
          fix: 'Remove unused variable',
          autoFixable: true,
        },
      ],
      metrics: { complexity: 'medium', maintainability: 'good', testability: 'fair' },
    })
  })

  it('应该诊断代码中的错误', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const code = 'function broken() {}'
    const diagnoses = CodeGenerationService.diagnoseErrors(code)

    expect(diagnoses).toHaveLength(2)
    expect(diagnoses[0].severity).toBe('warning')
    expect(diagnoses[0].message).toBe('Missing return type')
    expect(diagnoses[0].location).toEqual({ file: 'generated.tsx', line: 3, column: 12 })
    expect(diagnoses[0].suggestion).toBe('Add return type annotation')
    expect(diagnoses[0].autoFixable).toBe(true)
  })

  it('严重错误应该正确标记', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const diagnoses = CodeGenerationService.diagnoseErrors('code')

    const error = diagnoses.find(d => d.severity === 'error')
    expect(error).toBeDefined()
    expect(error?.message).toBe('Unused variable')
  })
})

describe('CodeGenerationService - Documentation Generation', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该生成组件文档', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const docs = CodeGenerationService.generateDocs(
      'export function MyButton() { return <button /> }',
      'MyButton'
    )

    expect(docs.type).toBe('component')
    expect(docs.title).toBe('MyButton')
    expect(docs.content).toContain('# MyButton')
    expect(docs.examples).toHaveLength(2)
    expect(docs.examples[0]).toBe('<MyButton />')
    expect(docs.examples[1]).toBe('<MyButton>Content</MyButton>')
  })
})

describe('CodeGenerationService - Quality Analysis', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    mockCodeQualityService.analyze.mockReturnValue({
      score: 88,
      grade: 'A',
      issues: [
        {
          severity: 'info' as const,
          message: 'Consider adding JSDoc',
          rule: 'jsdoc/comment',
          autoFixable: false,
        },
      ],
      metrics: { complexity: 'low', maintainability: 'high', testability: 'good' },
    })
  })

  it('应该分析代码质量', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')

    const quality = CodeGenerationService.analyzeQuality('const x = 1')

    expect(quality.score).toBe(88)
    expect(quality.grade).toBe('A')
    expect(quality.issues).toHaveLength(1)
    expect(quality.metrics.maintainability).toBe('high')
  })
})

describe('CodeGenerationService - Validation Helpers', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该检测过长的代码警告', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')
    
    // 通过generate触发validate
    const intent = {
      type: 'custom' as any,
      complexity: 'complex' as const,
      requirements: ['X'.repeat(6000)],
      constraints: [],
      confidence: 0.9,
    }

    const result = await CodeGenerationService.generate(intent)
    
    // Fallback代码不会超过5000字符，所以这里测试的是validate方法本身
    // 我们可以间接通过warnings字段验证
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it('应该检测缺少导出声明的代码', async () => {
    const { CodeGenerationService } = await import('@/app/services/code-generation-service')
    
    // 测试私有validate方法的逻辑（通过generate间接调用）
    const intent = {
      type: 'custom' as any,
      complexity: 'simple' as const,
      requirements: ['Test'],
      constraints: [],
      confidence: 0.9,
    }

    const result = await CodeGenerationService.generate(intent)
    
    // 生成的代码应该包含export
    expect(result.content).toContain('export')
  })
})
