/**
 * @file template-engine.ts
 * @description YYC³ 模板引擎 — React 组件模板注册表、匹配、代码生成
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * Follows the spec's template system:
 *   Design → Intent → Template Match → Code Generation
 *   Supports Tailwind CSS, TypeScript, accessibility, responsive
 */

import { createLogger } from '../utils/logger'
import type {
  ComponentTemplate,
  TemplateContext,
  TemplateProp,
  DesignIntent,
} from '../types/codegen'

const log = createLogger('TemplateEngine')

/* ================================================================
   Helpers
   ================================================================ */

function indent(code: string, spaces = 2): string {
  const pad = ' '.repeat(spaces)
  return code.split('\n').map(l => pad + l).join('\n')
}

function pascalCase(s: string): string {
  return s.replace(/(^|[\s_-])(\w)/g, (_, __, c) => c.toUpperCase())
}

function generatePropsInterface(name: string, props: TemplateProp[], children: boolean): string {
  const lines = props.map(p => {
    const opt = p.required ? '' : '?'
    const desc = p.description ? `  /** ${p.description} */\n` : ''
    return `${desc}  ${p.name}${opt}: ${p.type}`
  })
  if (children) {lines.push('  children?: React.ReactNode')}
  return `interface ${name}Props {\n${lines.join('\n')}\n}`
}

function generatePropsDestructure(props: TemplateProp[], children: boolean): string {
  const names = props.map(p =>
    p.defaultValue ? `${p.name} = ${p.defaultValue}` : p.name
  )
  if (children) {names.push('children')}
  return `{ ${names.join(', ')} }`
}

/* ================================================================
   Built-in Templates
   ================================================================ */

const builtInTemplates: ComponentTemplate[] = [
  // ── Layout: Page Shell ──
  {
    id: 'layout-page',
    name: 'Page Layout',
    category: 'layout',
    description: '基础页面布局（Header + Main + Footer）',
    complexity: 'simple',
    dependencies: [],
    tags: ['layout', 'page', 'shell'],
    generate: (ctx) => {
      const name = ctx.componentName
      return `${generatePropsInterface(name, ctx.props, !!ctx.children)}

export function ${name}(${generatePropsDestructure(ctx.props, !!ctx.children)}: ${name}Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b border-border flex items-center px-6">
        <h1>Header</h1>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
      <footer className="h-12 border-t border-border flex items-center px-6 text-sm text-muted-foreground">
        Footer
      </footer>
    </div>
  )
}`
    },
  },

  // ── Layout: Dashboard ──
  {
    id: 'layout-dashboard',
    name: 'Dashboard Layout',
    category: 'layout',
    description: '仪表盘布局（Sidebar + Header + Content Grid）',
    complexity: 'medium',
    dependencies: [],
    tags: ['layout', 'dashboard', 'sidebar'],
    generate: (ctx) => {
      const name = ctx.componentName
      return `${generatePropsInterface(name, ctx.props, !!ctx.children)}

export function ${name}(${generatePropsDestructure(ctx.props, !!ctx.children)}: ${name}Props) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-border p-4 flex flex-col gap-4" role="navigation" aria-label="Sidebar">
        <div className="text-sm font-medium">Navigation</div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border flex items-center px-6">
          <h1>Dashboard</h1>
        </header>
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}`
    },
  },

  // ── UI: Card ──
  {
    id: 'ui-card',
    name: 'Card',
    category: 'ui',
    description: '通用卡片组件',
    complexity: 'simple',
    dependencies: [],
    tags: ['card', 'container', 'ui'],
    generate: (ctx) => {
      const name = ctx.componentName
      return `${generatePropsInterface(name, [
        { name: 'title', type: 'string', required: false },
        { name: 'description', type: 'string', required: false },
        ...ctx.props,
      ], true)}

export function ${name}({ title, description, children, ...props }: ${name}Props) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
      role="article"
      {...props}
    >
      {title && <h3 className="mb-1">${ctx.accessibility ? '<span>' : ''}{title}${ctx.accessibility ? '</span>' : ''}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {children}
    </div>
  )
}`
    },
  },

  // ── UI: Button ──
  {
    id: 'ui-button',
    name: 'Button',
    category: 'ui',
    description: '按钮组件（多变体）',
    complexity: 'simple',
    dependencies: [],
    tags: ['button', 'action', 'ui'],
    generate: (ctx) => {
      const name = ctx.componentName
      return `type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ${name}Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function ${name}({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ${name}Props) {
  return (
    <button
      className={\`inline-flex items-center justify-center gap-2 rounded-md transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        disabled:pointer-events-none disabled:opacity-50
        \${variantClasses[variant]} \${sizeClasses[size]} \${className}\`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}`
    },
  },

  // ── Form: Input Group ──
  {
    id: 'form-input',
    name: 'Input Group',
    category: 'form',
    description: '表单输入组（Label + Input + Error）',
    complexity: 'simple',
    dependencies: [],
    tags: ['form', 'input', 'field'],
    generate: (ctx) => {
      const name = ctx.componentName
      return `interface ${name}Props {
  label: string
  name: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
}

export function ${name}({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}: ${name}Props) {
  const inputId = \`input-\${name}\`
  const errorId = \`error-\${name}\`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm text-foreground">
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={\`h-10 rounded-md border px-3 text-sm bg-background
          transition-colors focus:outline-none focus:ring-2 focus:ring-ring
          \${error ? 'border-destructive' : 'border-border'}
          \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
      />
      {error && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}`
    },
  },

  // ── Data: Table ──
  {
    id: 'data-table',
    name: 'Data Table',
    category: 'data',
    description: '数据表格（分页、排序）',
    complexity: 'medium',
    dependencies: [],
    tags: ['table', 'data', 'grid', 'list'],
    generate: (ctx) => {
      const name = ctx.componentName
      return `interface Column<T> {
  key: keyof T & string
  label: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface ${name}Props<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  emptyMessage?: string
}

export function ${name}<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = '暂无数据',
}: ${name}Props<T>) {
  const [page, setPage] = React.useState(1)
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc')

  const sorted = React.useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = String(a[sortKey] ?? '')
      const bv = String(b[sortKey] ?? '')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={\`px-4 py-3 text-left \${col.sortable ? 'cursor-pointer select-none hover:bg-muted' : ''}\`}
                  onClick={() => col.sortable && handleSort(col.key)}
                  aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">{emptyMessage}</td></tr>
            ) : paged.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">
            第 {page}/{totalPages} 页，共 {sorted.length} 条
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="h-8 px-3 rounded text-xs border border-border disabled:opacity-40">上一页</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="h-8 px-3 rounded text-xs border border-border disabled:opacity-40">下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}`
    },
  },

  // ── Navigation: Tabs ──
  {
    id: 'nav-tabs',
    name: 'Tabs',
    category: 'navigation',
    description: '标签页切换组件',
    complexity: 'simple',
    dependencies: [],
    tags: ['tabs', 'navigation', 'switch'],
    generate: (ctx) => {
      const name = ctx.componentName
      return `interface Tab {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

interface ${name}Props {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
}

export function ${name}({ tabs, defaultTab, onChange }: ${name}Props) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id || '')

  const handleChange = (id: string) => {
    setActiveTab(id)
    onChange?.(id)
  }

  const activeContent = tabs.find(t => t.id === activeTab)?.content

  return (
    <div>
      <div className="flex border-b border-border" role="tablist" aria-label="Tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={\`panel-\${tab.id}\`}
            id={\`tab-\${tab.id}\`}
            disabled={tab.disabled}
            onClick={() => handleChange(tab.id)}
            className={\`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px
              \${activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'}
              \${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}\`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={\`panel-\${activeTab}\`}
        aria-labelledby={\`tab-\${activeTab}\`}
        className="py-4"
      >
        {activeContent}
      </div>
    </div>
  )
}`
    },
  },

  // ── Feedback: Empty State ──
  {
    id: 'feedback-empty',
    name: 'Empty State',
    category: 'feedback',
    description: '空状态提示组件',
    complexity: 'simple',
    dependencies: [],
    tags: ['empty', 'placeholder', 'feedback'],
    generate: (ctx) => {
      const name = ctx.componentName
      return `interface ${name}Props {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function ${name}({ icon, title, description, action }: ${name}Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" role="status">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}`
    },
  },
]

/* ================================================================
   Template Engine
   ================================================================ */

class TemplateEngineImpl {
  private templates: Map<string, ComponentTemplate> = new Map()

  constructor() {
    // Register built-in templates
    builtInTemplates.forEach(t => this.register(t))
    log.info('Template engine initialized', { count: this.templates.size })
  }

  /** Register a new template */
  register(template: ComponentTemplate): void {
    this.templates.set(template.id, template)
  }

  /** Unregister a template */
  unregister(id: string): void {
    this.templates.delete(id)
  }

  /** Get all templates */
  getAll(): ComponentTemplate[] {
    return Array.from(this.templates.values())
  }

  /** Get templates by category */
  getByCategory(category: ComponentTemplate['category']): ComponentTemplate[] {
    return this.getAll().filter(t => t.category === category)
  }

  /** Get template by ID */
  getById(id: string): ComponentTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * Match best template(s) based on design intent.
   * Returns sorted by relevance score.
   */
  matchTemplates(intent: DesignIntent): ComponentTemplate[] {
    const all = this.getAll()

    const scored = all.map(template => {
      let score = 0

      // Category match
      if (intent.type === 'layout' && template.category === 'layout') {score += 30}
      if (intent.type === 'component' && template.category === 'ui') {score += 30}
      if (intent.type === 'style' && template.category === 'ui') {score += 20}

      // Complexity match
      if (template.complexity === intent.complexity) {score += 20}

      // Tag matching with requirements
      const lowerReqs = intent.requirements.map(r => r.toLowerCase())
      template.tags.forEach(tag => {
        if (lowerReqs.some(r => r.includes(tag) || tag.includes(r))) {
          score += 15
        }
      })

      // Pattern suggestions match
      if (intent.suggestedPatterns) {
        intent.suggestedPatterns.forEach(p => {
          if (template.tags.includes(p.toLowerCase())) {score += 10}
        })
      }

      return { template, score }
    })

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.template)
  }

  /**
   * Generate code from a template with context.
   */
  generate(templateId: string, context: TemplateContext): string {
    const template = this.templates.get(templateId)
    if (!template) {
      log.warn('Template not found', { templateId })
      return this.generateFallback(context)
    }

    try {
      const code = template.generate(context)
      log.debug('Template generated', { templateId, length: code.length })
      return code
    } catch (err) {
      log.error('Template generation failed', { templateId, error: err })
      return this.generateFallback(context)
    }
  }

  /**
   * Fallback: generate a minimal component stub.
   */
  private generateFallback(ctx: TemplateContext): string {
    return `// Auto-generated component stub
interface ${ctx.componentName}Props {
  children?: React.ReactNode
}

export function ${ctx.componentName}({ children }: ${ctx.componentName}Props) {
  return (
    <div className="p-4 rounded-md border border-border">
      {children ?? <span className="text-muted-foreground">TODO: implement ${ctx.componentName}</span>}
    </div>
  )
}`
  }
}

/* ================================================================
   Singleton
   ================================================================ */

export const templateEngine = new TemplateEngineImpl()
