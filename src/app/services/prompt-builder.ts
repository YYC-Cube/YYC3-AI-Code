/**
 * @file prompt-builder.ts
 * @description YYC³ AI 提示词工程 — 代码生成 / 错误诊断 / 文档生成的 Prompt 构建
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Follows the spec's AI prompt engineering patterns:
 *   System prompt → Design spec → Intent → Requirements → Output format → Context
 */

import { createLogger } from '../utils/logger'
import type {
  PromptTemplate,
  PromptContext,
  BuiltPrompt,
  DesignIntent,
  FigmaDesign,
} from '../types/codegen'

const log = createLogger('PromptBuilder')

/* ================================================================
   Prompt Templates Registry
   ================================================================ */

const promptTemplates: Record<string, PromptTemplate> = {
  /* ── Code Generation ── */
  'code-gen': {
    id: 'code-gen',
    name: '代码生成',
    systemPrompt: `You are an expert React/TypeScript code generator for the YYC³ AI Code platform.
You produce production-ready, accessible, performant components following these rules:

1. Use React 18+ with TypeScript strict mode
2. Style with Tailwind CSS utility classes — prefer semantic design tokens (bg-background, text-foreground, border-border)
3. Ensure responsive design (mobile-first)
4. Include proper TypeScript interfaces for all props
5. Add ARIA attributes and keyboard navigation
6. Use React best practices: hooks, memo when needed, proper key props
7. Include brief inline comments for complex logic (in Chinese)
8. Export components as named exports
9. Never use \`any\` type — use \`unknown\` or specific types
10. Prefer composition over inheritance`,
    userTemplate: `Based on the following design specification, generate a complete React component.

## Design Intent
- Type: {{intentType}}
- Complexity: {{intentComplexity}}
- Requirements: {{requirements}}
- Constraints: {{constraints}}

{{#if designSpec}}
## Design Specification
{{designSpec}}
{{/if}}

{{#if currentCode}}
## Existing Code Context
\`\`\`tsx
{{currentCode}}
\`\`\`
{{/if}}

{{#if userMessage}}
## Additional Instructions
{{userMessage}}
{{/if}}

## Output
Generate the complete component code. Include:
- TypeScript interface for props
- The component function with JSX
- All necessary imports
- Tailwind CSS classes for styling
- ARIA accessibility attributes`,
    requiredVars: ['intentType', 'intentComplexity', 'requirements'],
    temperature: 0.3,
    maxTokens: 4096,
  },

  /* ── Error Diagnosis ── */
  'error-diagnosis': {
    id: 'error-diagnosis',
    name: '错误诊断',
    systemPrompt: `You are a senior TypeScript/React code reviewer for the YYC³ AI Code platform.
Analyze the provided code and identify issues in these categories:
- Type Safety: missing types, unsafe casts, any usage
- Performance: unnecessary re-renders, missing memo/callback, large bundles
- Accessibility: missing ARIA, keyboard traps, color contrast
- Best Practices: React anti-patterns, missing error boundaries, side-effect management
- Security: XSS vectors, unsafe innerHTML, credential exposure
- Maintainability: code complexity, magic numbers, missing documentation

Respond in JSON format with severity, category, message, line number, and fix suggestion.`,
    userTemplate: `Analyze this code for issues:

\`\`\`{{language}}
{{code}}
\`\`\`

{{#if errorContext}}
## Known Error
{{errorContext}}
{{/if}}

Return a JSON array of issues, each with:
{ "severity": "error"|"warning"|"info", "category": string, "message": string, "line": number, "rule": string, "autoFixable": boolean, "fix": string }`,
    requiredVars: ['code', 'language'],
    temperature: 0.1,
    maxTokens: 2048,
  },

  /* ── Documentation ── */
  'doc-gen': {
    id: 'doc-gen',
    name: '文档生成',
    systemPrompt: `You are a technical documentation writer for the YYC³ AI Code platform.
Generate clear, bilingual (Chinese primary, English secondary) documentation.
Include: component description, props table, usage examples, accessibility notes.`,
    userTemplate: `Generate documentation for this component:

\`\`\`tsx
{{code}}
\`\`\`

Component name: {{componentName}}

Include:
1. Brief description (Chinese)
2. Props table (name, type, required, default, description)
3. 2-3 usage examples
4. Accessibility notes
5. Related components`,
    requiredVars: ['code', 'componentName'],
    temperature: 0.4,
    maxTokens: 2048,
  },

  /* ── Code Refactor ── */
  'refactor': {
    id: 'refactor',
    name: '代码重构',
    systemPrompt: `You are a code refactoring expert for the YYC³ AI Code platform.
Refactor the provided code to improve readability, performance, and maintainability.
Preserve all functionality — do not change behavior.
Explain each change in a brief comment.`,
    userTemplate: `Refactor this code:

\`\`\`{{language}}
{{code}}
\`\`\`

{{#if userMessage}}
Focus on: {{userMessage}}
{{/if}}

Requirements:
- Preserve all existing functionality
- Improve TypeScript types
- Optimize performance (memo, useMemo, useCallback where needed)
- Follow YYC³ coding conventions
- Add brief inline comments explaining changes`,
    requiredVars: ['code', 'language'],
    temperature: 0.2,
    maxTokens: 4096,
  },

  /* ── Component from Description ── */
  'component-from-desc': {
    id: 'component-from-desc',
    name: '从描述生成组件',
    systemPrompt: `You are an expert React/TypeScript component generator for the YYC³ AI Code platform.
Generate a complete, production-ready component from a natural language description.
Use Tailwind CSS, TypeScript strict mode, ARIA accessibility, and React best practices.`,
    userTemplate: `Create a React component based on this description:

{{userMessage}}

{{#if fileContext}}
## Related Files
{{fileContext}}
{{/if}}

Requirements:
- TypeScript with strict types
- Tailwind CSS styling
- Responsive design
- Accessibility (ARIA, keyboard)
- Named export`,
    requiredVars: ['userMessage'],
    temperature: 0.4,
    maxTokens: 4096,
  },
}

/* ================================================================
   Simple Template Interpolation
   ================================================================ */

function interpolate(template: string, vars: Record<string, string>): string {
  let result = template

  // Handle {{#if var}}...{{/if}} blocks
  result = result.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, varName, content) => {
      return vars[varName] ? content : ''
    }
  )

  // Handle {{var}} substitutions
  result = result.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
    return vars[varName] ?? ''
  })

  return result.replace(/\n{3,}/g, '\n\n').trim()
}

/* ================================================================
   Prompt Builder Service
   ================================================================ */

class PromptBuilderService {
  /**
   * Build a prompt for code generation from design intent.
   */
  buildCodeGenPrompt(intent: DesignIntent, context: PromptContext): BuiltPrompt {
    const template = promptTemplates['code-gen']

    const vars: Record<string, string> = {
      intentType: intent.type,
      intentComplexity: intent.complexity,
      requirements: intent.requirements.join(', '),
      constraints: intent.constraints
        .map(c => `${c.type} (${c.priority}): ${c.description}`)
        .join('\n'),
      userMessage: context.userMessage || '',
      currentCode: context.currentCode || '',
      designSpec: context.design
        ? JSON.stringify(summarizeDesign(context.design), null, 2)
        : '',
    }

    const user = interpolate(template.userTemplate, vars)
    const estimatedTokens = Math.ceil((template.systemPrompt.length + user.length) / 4)

    log.debug('Code generation prompt built', { estimatedTokens })

    return {
      system: template.systemPrompt,
      user,
      estimatedTokens,
      templateId: template.id,
    }
  }

  /**
   * Build a prompt for error diagnosis.
   */
  buildDiagnosisPrompt(code: string, language: string, errorContext?: string): BuiltPrompt {
    const template = promptTemplates['error-diagnosis']

    const vars: Record<string, string> = {
      code,
      language,
      errorContext: errorContext || '',
    }

    const user = interpolate(template.userTemplate, vars)
    const estimatedTokens = Math.ceil((template.systemPrompt.length + user.length) / 4)

    return {
      system: template.systemPrompt,
      user,
      estimatedTokens,
      templateId: template.id,
    }
  }

  /**
   * Build a prompt for documentation generation.
   */
  buildDocPrompt(code: string, componentName: string): BuiltPrompt {
    const template = promptTemplates['doc-gen']

    const vars: Record<string, string> = {
      code,
      componentName,
    }

    const user = interpolate(template.userTemplate, vars)
    const estimatedTokens = Math.ceil((template.systemPrompt.length + user.length) / 4)

    return {
      system: template.systemPrompt,
      user,
      estimatedTokens,
      templateId: template.id,
    }
  }

  /**
   * Build a prompt for code refactoring.
   */
  buildRefactorPrompt(code: string, language: string, instructions?: string): BuiltPrompt {
    const template = promptTemplates['refactor']

    const vars: Record<string, string> = {
      code,
      language,
      userMessage: instructions || '',
    }

    const user = interpolate(template.userTemplate, vars)
    const estimatedTokens = Math.ceil((template.systemPrompt.length + user.length) / 4)

    return {
      system: template.systemPrompt,
      user,
      estimatedTokens,
      templateId: template.id,
    }
  }

  /**
   * Build a prompt for component generation from natural language.
   */
  buildComponentPrompt(description: string, relatedFiles?: string[]): BuiltPrompt {
    const template = promptTemplates['component-from-desc']

    const vars: Record<string, string> = {
      userMessage: description,
      fileContext: relatedFiles?.join('\n---\n') || '',
    }

    const user = interpolate(template.userTemplate, vars)
    const estimatedTokens = Math.ceil((template.systemPrompt.length + user.length) / 4)

    return {
      system: template.systemPrompt,
      user,
      estimatedTokens,
      templateId: template.id,
    }
  }

  /** Get a prompt template by ID */
  getTemplate(id: string): PromptTemplate | undefined {
    return promptTemplates[id]
  }

  /** List all available templates */
  listTemplates(): PromptTemplate[] {
    return Object.values(promptTemplates)
  }
}

/* ================================================================
   Helpers
   ================================================================ */

/** Summarize a Figma design for prompt inclusion (trim to reduce tokens) */
function summarizeDesign(design: FigmaDesign): Record<string, unknown> {
  return {
    componentCount: design.components.length,
    components: design.components.slice(0, 20).map(c => ({
      name: c.name,
      type: c.type,
      width: c.properties.width,
      height: c.properties.height,
      hasChildren: !!(c.children && c.children.length > 0),
    })),
    styleCount: design.styles.length,
    assetCount: design.assets.length,
  }
}

/* ================================================================
   Singleton
   ================================================================ */

export const promptBuilder = new PromptBuilderService()
