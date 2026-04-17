/**
 * @file code-quality-service.ts
 * @description YYC³ 代码质量分析服务 — 静态规则检查、评分、优化建议
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Implements the spec's code quality assurance:
 *   Pattern-based analysis → Scoring → Issue reporting → Suggestions
 * Runs entirely in the browser (no ESLint/TypeScript compiler required).
 */

import { createLogger } from '../utils/logger'
import type {
  CodeQuality,
  QualityIssue,
  QualityCategory,
  QualityMetrics,
  ImprovementSuggestion,
  OptimizationResult,
  OptimizationChange,
} from '../types/codegen'

const log = createLogger('CodeQuality')

/* ================================================================
   Rule Definitions
   ================================================================ */

interface QualityRule {
  id: string
  category: QualityCategory
  severity: QualityIssue['severity']
  pattern: RegExp
  message: string
  autoFixable: boolean
  fix?: (match: string) => string
  /** Weight for scoring (higher = more impactful) */
  weight: number
}

const rules: QualityRule[] = [
  // ── Type Safety ──
  {
    id: 'no-any',
    category: 'type-safety',
    severity: 'warning',
    pattern: /:\s*any\b/g,
    message: '避免使用 `any` 类型，请使用明确的类型定义或 `unknown`',
    autoFixable: false,
    weight: 8,
  },
  {
    id: 'no-ts-ignore',
    category: 'type-safety',
    severity: 'warning',
    pattern: /@ts-ignore/g,
    message: '避免使用 @ts-ignore，请修复类型错误或使用 @ts-expect-error',
    autoFixable: true,
    fix: () => '// @ts-expect-error TODO: fix type',
    weight: 6,
  },
  {
    id: 'no-non-null-assertion',
    category: 'type-safety',
    severity: 'info',
    pattern: /\w+!/g,
    message: '避免非空断言 (!)，考虑使用可选链或类型守卫',
    autoFixable: false,
    weight: 4,
  },

  // ── Performance ──
  {
    id: 'inline-object-in-jsx',
    category: 'performance',
    severity: 'warning',
    pattern: /(?:style|className)=\{\{[^}]+\}\}/g,
    message: 'JSX 中的内联对象会导致每次渲染创建新引用，考虑提取为常量或 useMemo',
    autoFixable: false,
    weight: 5,
  },
  {
    id: 'inline-function-in-jsx',
    category: 'performance',
    severity: 'info',
    pattern: /on\w+=\{\(\)\s*=>/g,
    message: 'JSX 中的内联箭头函数会导致子组件重渲染，考虑使用 useCallback',
    autoFixable: false,
    weight: 4,
  },
  {
    id: 'missing-key-prop',
    category: 'performance',
    severity: 'error',
    pattern: /\.map\(\s*\([^)]*\)\s*=>\s*(?:<\w+(?:\s+(?!key\s*=)[^>]*)*>)/g,
    message: '列表渲染缺少 key 属性',
    autoFixable: false,
    weight: 9,
  },
  {
    id: 'no-index-key',
    category: 'performance',
    severity: 'warning',
    pattern: /key=\{(?:index|i|idx)\}/g,
    message: '避免使用数组索引作为 key，应使用唯一标识符',
    autoFixable: false,
    weight: 6,
  },

  // ── Accessibility ──
  {
    id: 'img-no-alt',
    category: 'accessibility',
    severity: 'error',
    pattern: /<img(?:\s+(?!alt\s*=)[^>]*)*\/?>/g,
    message: '<img> 标签缺少 alt 属性',
    autoFixable: false,
    weight: 9,
  },
  {
    id: 'button-no-type',
    category: 'accessibility',
    severity: 'warning',
    pattern: /<button(?:\s+(?!type\s*=)[^>]*)*>/g,
    message: '<button> 标签应指定 type 属性 (button/submit/reset)',
    autoFixable: false,
    weight: 5,
  },
  {
    id: 'missing-aria-label',
    category: 'accessibility',
    severity: 'info',
    pattern: /<(?:button|a|input)\s+(?!.*(?:aria-label|aria-labelledby|title))[^>]*>/g,
    message: '交互元素应包含 aria-label 或其他无障碍标签',
    autoFixable: false,
    weight: 4,
  },

  // ── Best Practices ──
  {
    id: 'no-console-log',
    category: 'best-practice',
    severity: 'info',
    pattern: /console\.log\(/g,
    message: '生产代码应避免 console.log，使用 createLogger 替代',
    autoFixable: true,
    fix: () => '// log.debug(',
    weight: 3,
  },
  {
    id: 'no-var',
    category: 'best-practice',
    severity: 'warning',
    pattern: /\bvar\s+/g,
    message: '使用 const 或 let 替代 var',
    autoFixable: true,
    fix: () => 'const ',
    weight: 5,
  },
  {
    id: 'prefer-const',
    category: 'best-practice',
    severity: 'info',
    pattern: /\blet\s+(\w+)\s*=[^;]+;(?![\s\S]*?\1\s*=)/g,
    message: '如果变量不会被重新赋值，应使用 const',
    autoFixable: false,
    weight: 2,
  },
  {
    id: 'no-magic-numbers',
    category: 'best-practice',
    severity: 'info',
    pattern: /(?<!=\s*)(?<!\w)(?:(?:[2-9]\d{2,})|(?:\d+\.\d+))(?!\w)(?!\s*[;:,\]})])/g,
    message: '避免魔法数字，请提取为命名常量',
    autoFixable: false,
    weight: 3,
  },

  // ── Security ──
  {
    id: 'no-dangerously-set',
    category: 'security',
    severity: 'error',
    pattern: /dangerouslySetInnerHTML/g,
    message: '使用 dangerouslySetInnerHTML 存在 XSS 风险，确保内容已经过净化',
    autoFixable: false,
    weight: 10,
  },
  {
    id: 'no-eval',
    category: 'security',
    severity: 'error',
    pattern: /\beval\s*\(/g,
    message: '禁止使用 eval()，存在代码注入风险',
    autoFixable: false,
    weight: 10,
  },

  // ── Maintainability ──
  {
    id: 'excessive-state',
    category: 'maintainability',
    severity: 'warning',
    pattern: /useState/g,
    message: '',  // dynamic message based on count
    autoFixable: false,
    weight: 5,
  },
  {
    id: 'long-component',
    category: 'maintainability',
    severity: 'warning',
    pattern: /(?:)/g, // dummy — checked by line count
    message: '组件超过 200 行，建议拆分为更小的子组件',
    autoFixable: false,
    weight: 6,
  },
]

/* ================================================================
   Analysis Engine
   ================================================================ */

function findLineNumber(code: string, index: number): number {
  return code.substring(0, index).split('\n').length
}

function analyzeCode(code: string): QualityIssue[] {
  const issues: QualityIssue[] = []
  const lines = code.split('\n')
  let issueId = 0

  for (const rule of rules) {
    // Special cases
    if (rule.id === 'excessive-state') {
      const matches = code.match(/useState/g)
      if (matches && matches.length > 8) {
        issues.push({
          id: `issue-${issueId++}`,
          severity: 'warning',
          category: rule.category,
          message: `组件使用了 ${matches.length} 个 useState，建议抽取为自定义 Hook 或 Zustand Store`,
          rule: rule.id,
          autoFixable: false,
        })
      }
      continue
    }

    if (rule.id === 'long-component') {
      if (lines.length > 200) {
        issues.push({
          id: `issue-${issueId++}`,
          severity: 'warning',
          category: rule.category,
          message: `组件 ${lines.length} 行，超过推荐的 200 行上限`,
          rule: rule.id,
          autoFixable: false,
        })
      }
      continue
    }

    // Standard regex rules
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags)
    let match: RegExpExecArray | null
    while ((match = pattern.exec(code)) !== null) {
      issues.push({
        id: `issue-${issueId++}`,
        severity: rule.severity,
        category: rule.category,
        message: rule.message,
        line: findLineNumber(code, match.index),
        rule: rule.id,
        autoFixable: rule.autoFixable,
        fix: rule.fix ? rule.fix(match[0]) : undefined,
      })
    }
  }

  return issues
}

/* ================================================================
   Scoring
   ================================================================ */

function calculateScore(issues: QualityIssue[], lineCount: number): QualityMetrics {
  const categories: QualityCategory[] = [
    'type-safety', 'performance', 'accessibility',
    'best-practice', 'maintainability', 'security',
  ]

  const metrics: Record<string, number> = {}

  for (const cat of categories) {
    const catIssues = issues.filter(i => i.category === cat)
    const errorPenalty = catIssues.filter(i => i.severity === 'error').length * 15
    const warningPenalty = catIssues.filter(i => i.severity === 'warning').length * 8
    const infoPenalty = catIssues.filter(i => i.severity === 'info').length * 3

    // Scale penalty by code size (larger files tolerate slightly more)
    const sizeFactor = Math.max(1, lineCount / 100)
    const totalPenalty = (errorPenalty + warningPenalty + infoPenalty) / sizeFactor

    metrics[cat] = Math.max(0, Math.min(100, 100 - totalPenalty))
  }

  return {
    typeSafety: metrics['type-safety'],
    performance: metrics['performance'],
    accessibility: metrics['accessibility'],
    bestPractice: metrics['best-practice'],
    maintainability: metrics['maintainability'],
    security: metrics['security'],
  }
}

function overallScore(metrics: QualityMetrics): number {
  // Weighted average — security and type-safety weigh more
  const weights = {
    typeSafety: 0.2,
    performance: 0.15,
    accessibility: 0.15,
    bestPractice: 0.15,
    maintainability: 0.15,
    security: 0.2,
  }

  let total = 0
  for (const [key, weight] of Object.entries(weights)) {
    total += (metrics[key as keyof QualityMetrics] || 0) * weight
  }

  return Math.round(total)
}

function scoreToGrade(score: number): CodeQuality['grade'] {
  if (score >= 90) {return 'A'}
  if (score >= 75) {return 'B'}
  if (score >= 60) {return 'C'}
  if (score >= 40) {return 'D'}
  return 'F'
}

/* ================================================================
   Suggestions
   ================================================================ */

function generateSuggestions(issues: QualityIssue[], metrics: QualityMetrics): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = []

  if (metrics.typeSafety < 80) {
    suggestions.push({
      category: 'type-safety',
      title: '增强类型安全',
      description: '将所有 `any` 替换为具体类型或 `unknown`，启用 TypeScript strict 模式',
      priority: 'high',
      codeExample: `// Before\nconst data: any = fetchData()\n// After\nconst data: UserData = await fetchData<UserData>()`,
    })
  }

  if (metrics.performance < 70) {
    suggestions.push({
      category: 'performance',
      title: '优化渲染性能',
      description: '使用 React.memo 包裹纯组件，useCallback 缓存事件处理函数，useMemo 缓存计算结果',
      priority: 'high',
      codeExample: `const handleClick = useCallback(() => {\n  // ...\n}, [dependency])`,
    })
  }

  if (metrics.accessibility < 70) {
    suggestions.push({
      category: 'accessibility',
      title: '改善无障碍访问',
      description: '为所有交互元素添加 aria-label，为图片添加 alt 文本，确保键盘可导航',
      priority: 'high',
    })
  }

  if (metrics.security < 80) {
    suggestions.push({
      category: 'security',
      title: '加强安全性',
      description: '避免 dangerouslySetInnerHTML 和 eval()，使用 DOMPurify 净化用户输入',
      priority: 'high',
    })
  }

  if (metrics.maintainability < 70) {
    suggestions.push({
      category: 'maintainability',
      title: '提升可维护性',
      description: '将大组件拆分为更小的子组件，提取魔法数字为常量，减少 useState 数量',
      priority: 'medium',
    })
  }

  return suggestions
}

/* ================================================================
   Code Optimization
   ================================================================ */

function optimizeCode(code: string): OptimizationResult {
  let optimized = code
  const changes: OptimizationChange[] = []

  // 1. Detect components that could use React.memo
  const componentDef = /export\s+(?:const|function)\s+(\w+)/g
  let match: RegExpExecArray | null
  while ((match = componentDef.exec(code)) !== null) {
    const name = match[1]
    if (!code.includes(`React.memo(${name}`) && !code.includes('memo(')) {
      changes.push({
        type: 'memo',
        description: `考虑对 ${name} 使用 React.memo 避免不必要的重渲染`,
        line: findLineNumber(code, match.index),
      })
    }
  }

  // 2. Detect inline functions that could use useCallback
  const inlineFn = /on\w+=\{\(\)\s*=>\s*\{/g
  while ((match = inlineFn.exec(code)) !== null) {
    changes.push({
      type: 'callback',
      description: '将内联事件处理函数提取为 useCallback',
      line: findLineNumber(code, match.index),
    })
  }

  // 3. Detect missing cleanup in useEffect
  const effectNoCleanup = /useEffect\(\(\)\s*=>\s*\{[^}]*(?:setInterval|addEventListener|subscribe)[^}]*\},/g
  while ((match = effectNoCleanup.exec(code)) !== null) {
    changes.push({
      type: 'cleanup',
      description: 'useEffect 中使用了订阅/定时器但可能缺少清理函数',
      line: findLineNumber(code, match.index),
    })
  }

  // 4. Remove console.log in production
  optimized = optimized.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '')

  return {
    original: code,
    optimized,
    changes,
    sizeBefore: code.length,
    sizeAfter: optimized.length,
    compressionRatio: optimized.length / code.length,
  }
}

/* ================================================================
   Public Service
   ================================================================ */

class CodeQualityServiceImpl {
  /**
   * Run full quality analysis on code.
   */
  analyze(code: string): CodeQuality {
    const startTime = performance.now()

    const issues = analyzeCode(code)
    const lineCount = code.split('\n').length
    const metrics = calculateScore(issues, lineCount)
    const score = overallScore(metrics)
    const grade = scoreToGrade(score)
    const suggestions = generateSuggestions(issues, metrics)

    const duration = performance.now() - startTime
    log.debug('Quality analysis complete', { score, grade, issues: issues.length, duration: `${duration.toFixed(1)}ms` })

    return { score, grade, issues, suggestions, metrics }
  }

  /**
   * Run optimization pass on code.
   */
  optimize(code: string): OptimizationResult {
    return optimizeCode(code)
  }

  /**
   * Quick score (no detailed issues).
   */
  quickScore(code: string): { score: number; grade: CodeQuality['grade'] } {
    const issues = analyzeCode(code)
    const lineCount = code.split('\n').length
    const metrics = calculateScore(issues, lineCount)
    const score = overallScore(metrics)
    return { score, grade: scoreToGrade(score) }
  }

  /**
   * Get issues filtered by category or severity.
   */
  getIssuesByCategory(code: string, category: QualityCategory): QualityIssue[] {
    return analyzeCode(code).filter(i => i.category === category)
  }

  getIssuesBySeverity(code: string, severity: QualityIssue['severity']): QualityIssue[] {
    return analyzeCode(code).filter(i => i.severity === severity)
  }
}

export const codeQualityService = new CodeQualityServiceImpl()
