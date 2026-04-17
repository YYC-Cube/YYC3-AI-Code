/**
 * @file intent-service.ts
 * @description AI 智能层 — 意图识别服务 (Intent Recognition Service)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @updated 2026-03-13
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai, intent, nlp
 */

import type { UserInput, DesignIntent, DesignConstraint } from '../types/architecture'

/* ================================================================
   Keyword Maps for Intent Detection
   ================================================================ */

const LAYOUT_KEYWORDS = [
  '布局', '排列', '栅格', 'grid', 'flex', '响应式', 'responsive',
  '三栏', '两栏', '侧栏', 'sidebar', '面板', 'panel', '页面',
  '导航', 'navbar', '头部', 'header', '底部', 'footer', '仪表板', 'dashboard',
]

const COMPONENT_KEYWORDS = [
  '按钮', 'button', '表单', 'form', '输入框', 'input', '卡片', 'card',
  '模态框', 'modal', '对话框', 'dialog', '下拉', 'dropdown', '选项',
  '表格', 'table', '列表', 'list', '标签页', 'tabs', '开关', 'switch',
  '组件', 'component', '控件', 'widget',
]

const STYLE_KEYWORDS = [
  '颜色', 'color', '字体', 'font', '主题', 'theme', '暗色', 'dark',
  '亮色', 'light', '渐变', 'gradient', '阴影', 'shadow', '圆角',
  '边框', 'border', '间距', 'spacing', '样式', 'style', 'css',
]

const ANIMATION_KEYWORDS = [
  '动画', 'animation', '过渡', 'transition', '淡入', 'fade',
  '滑动', 'slide', '旋转', 'rotate', '缩放', 'scale',
  '弹性', 'spring', '运动', 'motion', '效果', 'effect',
]

const COMPLEXITY_INDICATORS = {
  simple: ['简单', '基础', '基本', 'simple', 'basic', '快速', 'quick', '一个'],
  medium: ['标准', '完整', 'standard', '常规', '中等', '适当'],
  complex: ['复杂', '高级', 'complex', 'advanced', '多功能', '全功能', '企业', '系统'],
}

/* ================================================================
   Service Implementation
   ================================================================ */

export class IntentService {
  /**
   * 分析用户输入文本，识别设计意图
   */
  static recognizeIntent(input: UserInput): DesignIntent {
    const text = typeof input.content === 'string' ? input.content.toLowerCase() : ''

    const type = this.detectType(text)
    const complexity = this.detectComplexity(text)
    const requirements = this.extractRequirements(text)
    const constraints = this.detectConstraints(text)
    const confidence = this.calculateConfidence(text, type)

    return { type, complexity, requirements, constraints, confidence }
  }

  /**
   * 判断是否应该导航到多联式布局设计器
   */
  static shouldNavigateToDesigner(text: string): boolean {
    const designKeywords = [
      '创建', '构建', '设计', '生成', '做一个', '帮我', '开发',
      'create', 'build', 'design', 'generate', 'make', 'develop',
      '应用', '页面', '组件', '界面', 'app', 'page', 'ui',
    ]
    const lower = text.toLowerCase()
    return designKeywords.some(k => lower.includes(k))
  }

  /**
   * 判断是否需要全屏 AI 交互模式
   */
  static shouldEnterAIWorkbench(text: string): boolean {
    const aiKeywords = [
      '解释', '分析', '教我', '学习', '为什么', '怎么',
      'explain', 'analyze', 'teach', 'why', 'how',
      '讨论', '对比', '优化建议', '代码审查', 'review',
    ]
    const lower = text.toLowerCase()
    return aiKeywords.some(k => lower.includes(k))
  }

  private static detectType(text: string): DesignIntent['type'] {
    const scores = {
      layout: LAYOUT_KEYWORDS.filter(k => text.includes(k)).length,
      component: COMPONENT_KEYWORDS.filter(k => text.includes(k)).length,
      style: STYLE_KEYWORDS.filter(k => text.includes(k)).length,
      animation: ANIMATION_KEYWORDS.filter(k => text.includes(k)).length,
    }

    const maxScore = Math.max(...Object.values(scores))
    if (maxScore === 0) {return 'layout'} // default

    return (Object.entries(scores) as [DesignIntent['type'], number][])
      .sort((a, b) => b[1] - a[1])[0][0]
  }

  private static detectComplexity(text: string): DesignIntent['complexity'] {
    for (const k of COMPLEXITY_INDICATORS.complex) {
      if (text.includes(k)) {return 'complex'}
    }
    for (const k of COMPLEXITY_INDICATORS.medium) {
      if (text.includes(k)) {return 'medium'}
    }
    // Short inputs or simple keywords → simple
    if (text.length < 30) {return 'simple'}
    return 'medium'
  }

  private static extractRequirements(text: string): string[] {
    const requirements: string[] = []

    // Extract bullet-like requirements
    const lines = text.split(/[，。；、\n,;]/).filter(l => l.trim().length > 2)
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length > 2 && trimmed.length < 200) {
        requirements.push(trimmed)
      }
    }

    return requirements.length > 0 ? requirements : [text.trim()]
  }

  private static detectConstraints(text: string): DesignConstraint[] {
    const constraints: DesignConstraint[] = []

    if (text.includes('响应式') || text.includes('responsive') || text.includes('移动')) {
      constraints.push({ type: 'responsive', value: 'mobile-first', priority: 'required' })
    }
    if (text.includes('无障碍') || text.includes('accessible') || text.includes('a11y')) {
      constraints.push({ type: 'accessibility', value: 'WCAG 2.1 AA', priority: 'preferred' })
    }
    if (text.includes('性能') || text.includes('performance') || text.includes('快速')) {
      constraints.push({ type: 'performance', value: 'LCP < 2.5s', priority: 'preferred' })
    }
    if (text.includes('品牌') || text.includes('brand') || text.includes('主题')) {
      constraints.push({ type: 'branding', value: 'YYC³ design system', priority: 'optional' })
    }

    return constraints
  }

  private static calculateConfidence(text: string, type: DesignIntent['type']): number {
    const allKeywords = [...LAYOUT_KEYWORDS, ...COMPONENT_KEYWORDS, ...STYLE_KEYWORDS, ...ANIMATION_KEYWORDS]
    const matched = allKeywords.filter(k => text.includes(k)).length
    const base = Math.min(matched / 5, 0.8)
    const lengthBonus = Math.min(text.length / 200, 0.15)
    return Math.min(base + lengthBonus + 0.1, 1.0)
  }
}
