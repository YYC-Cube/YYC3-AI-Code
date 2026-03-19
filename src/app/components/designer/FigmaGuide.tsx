import React, { useState, useMemo } from 'react';
import {
  X, Figma, ArrowRight, Copy, Check, Sparkles, Palette,
  MousePointerClick, Type, Layers, Table, FormInput,
  SquareKanban, ChevronRight, Zap, Eye, Database,
  MessageSquare, RefreshCw, ExternalLink, CheckCircle2,
  Code, FileCode2, Tag, Paintbrush
} from 'lucide-react';
import { useDesigner } from '../../store';
import { copyToClipboard } from '../../utils/clipboard';
import { useThemeTokens } from './hooks/useThemeTokens';

/* ================================================================
   §6.1  Naming Convention Data
   ================================================================ */

interface NamingRule {
  figmaLayer: string;
  codeFile: string;
  prefix: string;
  category: string;
  note: string;
  icon: React.ElementType;
  color: string;
  exampleProps?: Record<string, string>;
  generatedCode?: string;
}

const NAMING_RULES: NamingRule[] = [
  {
    figmaLayer: 'Btn/Primary',
    codeFile: 'ButtonPrimary.tsx',
    prefix: 'Btn',
    category: '按钮',
    note: '前缀表示组件类别 + 变体',
    icon: SquareKanban,
    color: 'indigo',
    exampleProps: { label: '提交', variant: 'primary', size: 'md', disabled: 'false' },
    generatedCode: `export const ButtonPrimary = ({ label, onClick, disabled }) => (
  <button
    className="px-4 py-2 bg-primary text-white rounded-lg
               hover:bg-primary/90 disabled:opacity-50"
    onClick={onClick}
    disabled={disabled}
  >
    {label}
  </button>
);`,
  },
  {
    figmaLayer: 'Btn/Secondary',
    codeFile: 'ButtonSecondary.tsx',
    prefix: 'Btn',
    category: '按钮',
    note: '同类别不同变体，共享基础 props',
    icon: SquareKanban,
    color: 'slate',
    exampleProps: { label: '取消', variant: 'secondary', size: 'md', outline: 'true' },
    generatedCode: `export const ButtonSecondary = ({ label, onClick }) => (
  <button
    className="px-4 py-2 border border-border text-foreground
               rounded-lg hover:bg-muted"
    onClick={onClick}
  >
    {label}
  </button>
);`,
  },
  {
    figmaLayer: 'Tbl/UserList',
    codeFile: 'TableUserList.tsx',
    prefix: 'Tbl',
    category: '表格',
    note: '自动生成 Table + 数据源绑定',
    icon: Table,
    color: 'cyan',
    exampleProps: { source: 'local:users', pageSize: '20', columns: 'name,email,role,status', sortable: 'true' },
    generatedCode: `export const TableUserList = () => {
  const { data, isLoading } = useQuery({ source: 'local:users' });
  return (
    <DataTable
      source="local:users"
      pageSize={20}
      columns={[
        { key: 'name', label: '姓名', sortable: true },
        { key: 'email', label: '邮箱' },
        { key: 'role', label: '角色' },
        { key: 'status', label: '状态' },
      ]}
      data={data}
      loading={isLoading}
    />
  );
};`,
  },
  {
    figmaLayer: 'Tbl/OrderList',
    codeFile: 'TableOrderList.tsx',
    prefix: 'Tbl',
    category: '表格',
    note: '订单表格，自动推断列定义和筛选器',
    icon: Table,
    color: 'cyan',
    exampleProps: { source: 'local:orders', pageSize: '50', filterable: 'true', exportCSV: 'true' },
  },
  {
    figmaLayer: 'Frm/Login',
    codeFile: 'FormLogin.tsx',
    prefix: 'Frm',
    category: '表单',
    note: '包含 Input, Checkbox，自动生成 Zod 验证',
    icon: FormInput,
    color: 'emerald',
    exampleProps: { fields: 'email,password', validation: 'zod', submitLabel: '登录', rememberMe: 'true' },
    generatedCode: `const LoginSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(8, '密码至少8位'),
  rememberMe: z.boolean().optional(),
});

export const FormLogin = () => {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(LoginSchema),
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input label="邮箱" {...register('email')} error={formState.errors.email} />
      <Input label="密码" type="password" {...register('password')} />
      <Checkbox label="记住我" {...register('rememberMe')} />
      <Button type="submit" variant="primary">登录</Button>
    </form>
  );
};`,
  },
  {
    figmaLayer: 'Frm/Register',
    codeFile: 'FormRegister.tsx',
    prefix: 'Frm',
    category: '表单',
    note: '注册表单，自动包含密码确认和强度校验',
    icon: FormInput,
    color: 'emerald',
    exampleProps: { fields: 'name,email,password,confirmPwd', validation: 'zod', captcha: 'true' },
  },
  {
    figmaLayer: 'Panel/Analytics',
    codeFile: 'PanelAnalytics.tsx',
    prefix: 'Panel',
    category: '容器面板',
    note: '容器面板，内部可再嵌套子组件',
    icon: Layers,
    color: 'purple',
    exampleProps: { layout: 'grid', cols: '12', gap: '16', children: 'Stat,Chart,Table' },
    generatedCode: `export const PanelAnalytics = ({ children }) => (
  <section className="col-span-6 rounded-xl border border-border bg-card p-4">
    <h3 className="text-sm text-muted-foreground mb-3">Analytics</h3>
    <div className="grid grid-cols-12 gap-4">
      {children}
    </div>
  </section>
);`,
  },
  {
    figmaLayer: 'Panel/Dashboard',
    codeFile: 'PanelDashboard.tsx',
    prefix: 'Panel',
    category: '容器面板',
    note: '仪表盘主面板，支持响应式布局断点',
    icon: Layers,
    color: 'purple',
    exampleProps: { layout: 'responsive-grid', breakpoints: 'sm:1,md:2,lg:3', fullWidth: 'true' },
  },
  {
    figmaLayer: 'Chrt/MonthlyRevenue',
    codeFile: 'ChartMonthlyRevenue.tsx',
    prefix: 'Chrt',
    category: '图表',
    note: '自动推断图表类型、数据源和配色方案',
    icon: Zap,
    color: 'amber',
    exampleProps: { chartType: 'bar', dataSource: 'local:revenue', title: '月收入', colorScheme: 'primary' },
  },
  {
    figmaLayer: 'Stat/ActiveUsers',
    codeFile: 'StatActiveUsers.tsx',
    prefix: 'Stat',
    category: '统计卡',
    note: '数值统计卡片，含趋势和变化百分比',
    icon: Zap,
    color: 'rose',
    exampleProps: { title: '活跃用户', value: '3,847', change: '+5.2%', trend: 'up' },
  },
];

/* ================================================================
   §6.2  Interaction Annotation Data
   ================================================================ */

interface InteractionRule {
  type: string;
  figmaAction: string;
  generatedProp: string;
  icon: React.ElementType;
  color: string;
  description: string;
  codeExample: string;
}

const INTERACTION_RULES: InteractionRule[] = [
  {
    type: 'Click → Open Modal',
    figmaAction: 'Prototype → On Click → Open',
    generatedProp: "onClick={() => openModal('xxx')}",
    icon: MousePointerClick,
    color: 'indigo',
    description: '点击组件后打开模态框，自动生成 Modal 组件和 useModal Hook',
    codeExample: `// 自动生成
const { openModal, closeModal, isOpen } = useModal('userDetail');

<Button onClick={() => openModal('userDetail')}>查看详情</Button>

<Modal isOpen={isOpen} onClose={closeModal} title="用户详情">
  <UserDetailForm userId={selectedId} />
</Modal>`,
  },
  {
    type: 'Hover → Tooltip',
    figmaAction: 'Prototype → On Hover → Show',
    generatedProp: 'title="..." (自动转为 Tooltip 组件)',
    icon: MessageSquare,
    color: 'cyan',
    description: '悬停显示提示文字，自动转换为 Tooltip 组件包装',
    codeExample: `// Figma 标注 title="操作说明"
// 自动生成 ↓

<Tooltip label="操作说明" side="top" delay={200}>
  <Button variant="ghost">
    <HelpCircle className="w-4 h-4" />
  </Button>
</Tooltip>`,
  },
  {
    type: 'Data Bind',
    figmaAction: '右键 → Bind Data → Table',
    generatedProp: 'source="local:users"',
    icon: Database,
    color: 'emerald',
    description: '将组件绑定到本地数据表，自动生成 useQuery/useMutation',
    codeExample: `// Figma 标注: Bind Data → users 表
// 自动生成 ↓

const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(r => r.json()),
});

// 组件接收
<Table source="local:users" data={data} loading={isLoading} />`,
  },
  {
    type: 'AI 推荐',
    figmaAction: '右键 → AI Suggest → Props',
    generatedProp: 'AI 填充 props (在 Inspector 中出现)',
    icon: Sparkles,
    color: 'purple',
    description: 'AI 分析组件类型和上下文，智能推荐属性值、验证规则和样式',
    codeExample: `// 用户拖入 Table 组件
// AI 自动推荐 ↓

推荐属性:
  pageSize: 20           // 基于数据量推荐
  sortable: true         // 表格通常需要排序
  filterable: true       // 用户搜索需求
  columns: [             // 根据数据源推断
    { key: 'name', label: '姓名' },
    { key: 'email', label: '邮箱' },
    { key: 'role', label: '角色' },
  ]
  exportCSV: true        // 报表类场景推荐`,
  },
  {
    type: 'Scroll → Lazy Load',
    figmaAction: 'Prototype → On Scroll → Load More',
    generatedProp: 'onScrollEnd={() => loadMore()}',
    icon: RefreshCw,
    color: 'amber',
    description: '滚动到底部自动加载更多数据，生成 IntersectionObserver 或虚拟列表',
    codeExample: `// 自动生成 infinite scroll
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['items'],
  queryFn: ({ pageParam }) => fetchItems(pageParam),
  getNextPageParam: (last) => last.nextCursor,
});

<VirtualList
  data={data.pages.flat()}
  onEndReached={() => hasNextPage && fetchNextPage()}
  renderItem={(item) => <ItemCard {...item} />}
/>`,
  },
  {
    type: 'Focus → Validate',
    figmaAction: 'Prototype → On Blur → Validate',
    generatedProp: 'onBlur={() => validate(fieldName)}',
    icon: CheckCircle2,
    color: 'rose',
    description: '失焦时触发字段验证，自动生成 Zod schema 和错误提示',
    codeExample: `// Figma 标注: On Blur → Validate email
// 自动生成 ↓

const schema = z.object({
  email: z.string().email('请输入有效邮箱地址'),
});

<Input
  label="邮箱"
  {...register('email')}
  onBlur={() => trigger('email')}
  error={errors.email?.message}
/>`,
  },
];

/* ================================================================
   §6.3  Design Token Data
   ================================================================ */

interface DesignToken {
  system: string;
  figmaVar: string;
  codeVar: string;
  currentValue: string;
  preview?: string;
  category: 'color' | 'typography' | 'spacing' | 'effect';
}

const DESIGN_TOKENS: DesignToken[] = [
  { system: '主色', figmaVar: '--color-primary', codeVar: 'theme.colors.primary', currentValue: '#667eea', category: 'color' },
  { system: '主色深', figmaVar: '--color-primary-dark', codeVar: 'theme.colors.primaryDark', currentValue: '#4f46e5', category: 'color' },
  { system: '主色浅', figmaVar: '--color-primary-light', codeVar: 'theme.colors.primaryLight', currentValue: '#818cf8', category: 'color' },
  { system: '成功色', figmaVar: '--color-success', codeVar: 'theme.colors.success', currentValue: '#10b981', category: 'color' },
  { system: '警告色', figmaVar: '--color-warning', codeVar: 'theme.colors.warning', currentValue: '#f59e0b', category: 'color' },
  { system: '危险色', figmaVar: '--color-danger', codeVar: 'theme.colors.danger', currentValue: '#ef4444', category: 'color' },
  { system: '背景', figmaVar: '--color-bg', codeVar: 'theme.colors.background', currentValue: '#0d0e14', category: 'color' },
  { system: '表面色', figmaVar: '--color-surface', codeVar: 'theme.colors.surface', currentValue: '#12131a', category: 'color' },
  { system: '边框色', figmaVar: '--color-border', codeVar: 'theme.colors.border', currentValue: 'rgba(255,255,255,0.06)', category: 'color' },
  { system: '前景文本', figmaVar: '--color-foreground', codeVar: 'theme.colors.foreground', currentValue: 'rgba(255,255,255,0.9)', category: 'color' },
  { system: '二级文本', figmaVar: '--color-muted', codeVar: 'theme.colors.muted', currentValue: 'rgba(255,255,255,0.4)', category: 'color' },
  { system: '文本大小', figmaVar: '--font-size-base', codeVar: 'theme.fontSize.base', currentValue: '14px', category: 'typography' },
  { system: '标题大小', figmaVar: '--font-size-heading', codeVar: 'theme.fontSize.heading', currentValue: '20px', category: 'typography' },
  { system: '小号文本', figmaVar: '--font-size-sm', codeVar: 'theme.fontSize.sm', currentValue: '12px', category: 'typography' },
  { system: '极小文本', figmaVar: '--font-size-xs', codeVar: 'theme.fontSize.xs', currentValue: '10px', category: 'typography' },
  { system: '行高', figmaVar: '--line-height-base', codeVar: 'theme.lineHeight.base', currentValue: '1.5', category: 'typography' },
  { system: '字体族', figmaVar: '--font-family', codeVar: 'theme.fontFamily.base', currentValue: 'Inter, system-ui, sans-serif', category: 'typography' },
  { system: '等宽字体', figmaVar: '--font-family-mono', codeVar: 'theme.fontFamily.mono', currentValue: 'JetBrains Mono, monospace', category: 'typography' },
  { system: '间距单位', figmaVar: '--spacing-unit', codeVar: 'theme.spacing.unit', currentValue: '4px', category: 'spacing' },
  { system: '圆角', figmaVar: '--radius-base', codeVar: 'theme.borderRadius.base', currentValue: '8px', category: 'spacing' },
  { system: '圆角大', figmaVar: '--radius-lg', codeVar: 'theme.borderRadius.lg', currentValue: '12px', category: 'spacing' },
  { system: '阴影', figmaVar: '--shadow-sm', codeVar: 'theme.boxShadow.sm', currentValue: '0 1px 2px rgba(0,0,0,0.2)', category: 'effect' },
  { system: '辉光', figmaVar: '--glow-primary', codeVar: 'theme.boxShadow.glow', currentValue: '0 0 20px rgba(99,102,241,0.15)', category: 'effect' },
];

/* ================================================================
   §6.4  AI Prompt Template
   ================================================================ */

const AI_PROMPT_TEMPLATE = `You are a UI/UX design assistant integrated into Figma.
Your task is to help the designer quickly turn selected layers into
low-code components that can be exported to a React/Vue/Angular project.

When the user selects a layer and types "/ai", respond with:
1. A concise component name following the naming convention.
2. A JSON schema of the component's props (including default values).
3. Optional code snippet (TSX) that renders the component based on the schema.
4. Any recommended Tailwind utility classes for layout and styling.

Always respect the existing design tokens (colors, spacing, typography) in the file.
If the layer is a container (frame) containing child components, suggest a
Panel component with a flexible layout (grid/flex) and list its child component
names.

Example response:
---
Component: CardFeature
PropsSchema: {
  "title": "string",
  "subtitle": "string",
  "imageSrc": "string",
  "ctaLabel": "string",
  "ctaLink": "url"
}
Snippet:
\`\`\`tsx
export const CardFeature = ({title, subtitle, imageSrc, ctaLabel, ctaLink}) => (
  <div className="rounded-lg overflow-hidden shadow-sm bg-white">
    <img src={imageSrc} className="w-full h-48 object-cover" />
    <div className="p-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
      <a href={ctaLink} className="mt-2 inline-block text-primary hover:underline">
        {ctaLabel}
      </a>
    </div>
  </div>
);
\`\`\`
---`;

/* ================================================================
   Sub Components
   ================================================================ */

function NamingConventionTab() {
  const [selectedRule, setSelectedRule] = useState<NamingRule | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const prefixes = useMemo(() => [...new Set(NAMING_RULES.map(r => r.prefix))], []);
  const filtered = filter === 'all' ? NAMING_RULES : NAMING_RULES.filter(r => r.prefix === filter);

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-white/20 uppercase tracking-wider">前缀筛选</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-[10px] transition-all ${
            filter === 'all' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50'
          }`}
        >
          全部 ({NAMING_RULES.length})
        </button>
        {prefixes.map(p => {
          const count = NAMING_RULES.filter(r => r.prefix === p).length;
          return (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                filter === p ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50'
              }`}
            >
              {p}/ ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-4">
        {/* Rules list */}
        <div className="space-y-1.5">
          {filtered.map(rule => {
            const isSelected = selectedRule?.figmaLayer === rule.figmaLayer;
            return (
              <div
                key={rule.figmaLayer}
                onClick={() => setSelectedRule(rule)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? `border-${rule.color}-500/25 bg-${rule.color}-500/[0.06]`
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg bg-${rule.color}-500/10 flex items-center justify-center shrink-0`}>
                  <rule.icon className={`w-3.5 h-3.5 text-${rule.color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] text-white/70 font-mono">{rule.figmaLayer}</code>
                    <ArrowRight className="w-3 h-3 text-white/15 shrink-0" />
                    <code className="text-[11px] text-emerald-400/70 font-mono truncate">{rule.codeFile}</code>
                  </div>
                  <div className="text-[9px] text-white/25 mt-0.5">{rule.note}</div>
                </div>
                <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90 text-white/40' : 'text-white/10'}`} />
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="space-y-3">
          {selectedRule ? (
            <>
              <div className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className={`w-3.5 h-3.5 text-${selectedRule.color}-400`} />
                  <span className="text-[12px] text-white/70">{selectedRule.category}</span>
                  <code className="text-[10px] text-white/30 font-mono ml-auto">{selectedRule.prefix}/</code>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-white/25">Figma:</span>
                  <code className="text-[11px] text-white/60 font-mono bg-white/[0.04] px-2 py-0.5 rounded">{selectedRule.figmaLayer}</code>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-white/25">Code:</span>
                  <code className="text-[11px] text-emerald-400/70 font-mono bg-emerald-500/[0.06] px-2 py-0.5 rounded">{selectedRule.codeFile}</code>
                </div>
                {selectedRule.exampleProps && (
                  <div>
                    <span className="text-[10px] text-white/25 block mb-1.5">推断 Props:</span>
                    <div className="space-y-1">
                      {Object.entries(selectedRule.exampleProps).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2 text-[10px]">
                          <span className="text-purple-400/60 font-mono w-20">{k}:</span>
                          <span className="text-white/40 font-mono">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedRule.generatedCode && (
                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                  <div className="px-3 py-2 bg-white/[0.02] border-b border-white/[0.04] flex items-center gap-2">
                    <FileCode2 className="w-3 h-3 text-emerald-400/60" />
                    <span className="text-[10px] text-white/40">{selectedRule.codeFile}</span>
                  </div>
                  <pre className="p-3 text-[10px] leading-relaxed font-mono text-white/35 overflow-x-auto max-h-[240px] overflow-y-auto">
                    {selectedRule.generatedCode}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Layers className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <div className="text-[11px] text-white/20">选择左侧规则查看详细映射</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InteractionAnnotationTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="text-[10px] text-white/20 uppercase tracking-wider mb-1">交互标注 → 代码生成映射</div>
      {INTERACTION_RULES.map(rule => {
        const isExpanded = expanded === rule.type;
        return (
          <div
            key={rule.type}
            className={`rounded-xl border transition-all ${
              isExpanded
                ? `border-${rule.color}-500/20 bg-${rule.color}-500/[0.03]`
                : 'border-white/[0.06] bg-white/[0.02]'
            }`}
          >
            <div
              onClick={() => setExpanded(isExpanded ? null : rule.type)}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-lg bg-${rule.color}-500/10 flex items-center justify-center shrink-0`}>
                <rule.icon className={`w-4 h-4 text-${rule.color}-400`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-white/70">{rule.type}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{rule.description}</div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-white/15 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-black/20">
                    <span className="text-[9px] text-white/20 uppercase tracking-wider block mb-1">Figma 操作</span>
                    <span className="text-[10px] text-white/50">{rule.figmaAction}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/20">
                    <span className="text-[9px] text-white/20 uppercase tracking-wider block mb-1">生成属性</span>
                    <code className="text-[10px] text-emerald-400/60 font-mono">{rule.generatedProp}</code>
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.04] overflow-hidden">
                  <div className="px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.04]">
                    <span className="text-[9px] text-white/20 uppercase tracking-wider">生成代码示例</span>
                  </div>
                  <pre className="p-3 text-[10px] leading-relaxed font-mono text-white/35 overflow-x-auto max-h-[180px] overflow-y-auto">
                    {rule.codeExample}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DesignTokensTab() {
  const [tokenFilter, setTokenFilter] = useState<'all' | 'color' | 'typography' | 'spacing' | 'effect'>('all');
  const [copied, setCopied] = useState('');

  const filtered = tokenFilter === 'all' ? DESIGN_TOKENS : DESIGN_TOKENS.filter(t => t.category === tokenFilter);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {([
          { key: 'all' as const, label: '全部', count: DESIGN_TOKENS.length },
          { key: 'color' as const, label: '颜色', count: DESIGN_TOKENS.filter(t => t.category === 'color').length },
          { key: 'typography' as const, label: '文字', count: DESIGN_TOKENS.filter(t => t.category === 'typography').length },
          { key: 'spacing' as const, label: '间距', count: DESIGN_TOKENS.filter(t => t.category === 'spacing').length },
          { key: 'effect' as const, label: '效果', count: DESIGN_TOKENS.filter(t => t.category === 'effect').length },
        ]).map(f => (
          <button
            key={f.key}
            onClick={() => setTokenFilter(f.key)}
            className={`px-2.5 py-1 rounded-lg text-[10px] transition-all ${
              tokenFilter === f.key
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Token grid */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-white/[0.02]">
              <th className="text-left px-3 py-2 text-white/20">系统</th>
              <th className="text-left px-3 py-2 text-white/20">Figma 变量</th>
              <th className="text-left px-3 py-2 text-white/20">代码变量</th>
              <th className="text-left px-3 py-2 text-white/20">当前值</th>
              <th className="text-left px-3 py-2 text-white/20 w-10">预览</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(token => (
              <tr key={token.figmaVar} className="border-t border-white/[0.03] hover:bg-white/[0.02] group">
                <td className="px-3 py-2 text-white/50">{token.system}</td>
                <td className="px-3 py-2">
                  <code className="text-purple-400/60 font-mono">{token.figmaVar}</code>
                </td>
                <td className="px-3 py-2">
                  <code className="text-cyan-400/60 font-mono">{token.codeVar}</code>
                </td>
                <td className="px-3 py-2">
                  <code className="text-white/40 font-mono">{token.currentValue}</code>
                </td>
                <td className="px-3 py-2">
                  {token.category === 'color' && token.currentValue.startsWith('#') ? (
                    <div
                      className="w-5 h-5 rounded border border-white/10"
                      style={{ backgroundColor: token.currentValue }}
                    />
                  ) : token.category === 'color' && token.currentValue.startsWith('rgba') ? (
                    <div
                      className="w-5 h-5 rounded border border-white/10"
                      style={{ backgroundColor: token.currentValue }}
                    />
                  ) : (
                    <span className="text-white/15">—</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => handleCopy(token.codeVar)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white/50"
                  >
                    {copied === token.codeVar ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sync info */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <div>
          <div className="text-[11px] text-emerald-400/80">Design Tokens 同步</div>
          <div className="text-[10px] text-white/30 mt-0.5">
            Figma Design Tokens (File → Tokens) 自动同步到 <code className="text-cyan-400/50 bg-white/[0.04] px-1 py-0.5 rounded">tailwind.config.js</code>。
            上次同步: 2 分钟前 · {DESIGN_TOKENS.length} tokens
          </div>
        </div>
      </div>
    </div>
  );
}

function AIPromptTab() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(AI_PROMPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/[0.04] border border-purple-500/10">
        <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
        <div>
          <div className="text-[11px] text-purple-400/80">Figma AI 插件提示词</div>
          <div className="text-[10px] text-white/30 mt-0.5">
            将此提示词拷贝到 Figma 插件的 Prompt 输入框，AI 将按照统一规则输出组件代码。
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-white/[0.04]">
          <span className="text-[10px] text-white/40 font-mono">figma-plugin-prompt.txt</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? '已复制' : '复制全部'}
          </button>
        </div>
        <pre className="p-4 text-[10px] leading-relaxed font-mono text-white/35 overflow-x-auto max-h-[360px] overflow-y-auto whitespace-pre-wrap">
          {AI_PROMPT_TEMPLATE}
        </pre>
      </div>

      {/* AI capabilities summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Tag, label: '命名规范', desc: '根据图层名自动推断组件名和文件名', color: 'indigo' },
          { icon: Code, label: 'Props Schema', desc: '自动生成 JSON Schema 含默认值', color: 'cyan' },
          { icon: FileCode2, label: 'TSX 代码片段', desc: '基于 schema 生成完整组件代码', color: 'emerald' },
          { icon: Paintbrush, label: 'Tailwind 建议', desc: '推荐布局和样式的 utility 类', color: 'purple' },
        ].map(cap => (
          <div key={cap.label} className={`p-3 rounded-xl border border-${cap.color}-500/15 bg-${cap.color}-500/[0.03]`}>
            <div className="flex items-center gap-2 mb-1">
              <cap.icon className={`w-3.5 h-3.5 text-${cap.color}-400`} />
              <span className="text-[11px] text-white/60">{cap.label}</span>
            </div>
            <div className="text-[9px] text-white/25">{cap.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveMappingTab() {
  const { components, panels } = useDesigner();

  const mappings = useMemo(() => {
    return components.map(comp => {
      const panel = panels.find(p => p.children.includes(comp.id));
      const prefix = comp.type === 'Button' ? 'Btn' :
                     comp.type === 'Table' ? 'Tbl' :
                     comp.type === 'Input' || comp.type === 'Select' || comp.type === 'Checkbox' ? 'Frm' :
                     comp.type === 'Chart' ? 'Chrt' :
                     comp.type === 'Stat' ? 'Stat' :
                     comp.type;
      const variant = comp.props.variant || comp.props.chartType || comp.label.replace(/\s/g, '');
      const figmaName = `${prefix}/${variant}`;
      const fileName = `${comp.type}${variant.charAt(0).toUpperCase() + variant.slice(1)}.tsx`;
      return {
        id: comp.id,
        figmaName,
        fileName,
        type: comp.type,
        panel: panel?.name || '—',
        props: Object.keys(comp.props).length,
      };
    });
  }, [components, panels]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/10">
        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <div className="text-[11px] text-amber-400/80">实时映射</div>
          <div className="text-[10px] text-white/30 mt-0.5">
            当前项目 {components.length} 个组件自动映射到 Figma 图层名和代码文件名
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-white/[0.02]">
              <th className="text-left px-3 py-2 text-white/20">Figma 图层</th>
              <th className="text-left px-3 py-2 text-white/20">代码文件</th>
              <th className="text-left px-3 py-2 text-white/20">类型</th>
              <th className="text-left px-3 py-2 text-white/20">所在面板</th>
              <th className="text-left px-3 py-2 text-white/20">Props</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map(m => (
              <tr key={m.id} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-3 py-2">
                  <code className="text-white/50 font-mono">{m.figmaName}</code>
                </td>
                <td className="px-3 py-2">
                  <code className="text-emerald-400/60 font-mono">{m.fileName}</code>
                </td>
                <td className="px-3 py-2 text-white/30">{m.type}</td>
                <td className="px-3 py-2 text-white/30">{m.panel}</td>
                <td className="px-3 py-2">
                  <span className="text-[9px] text-indigo-400/60 bg-indigo-500/[0.06] px-1.5 py-0.5 rounded">{m.props} props</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================
   Main Component
   ================================================================ */

export function FigmaGuide() {
  const { figmaGuideOpen, toggleFigmaGuide } = useDesigner();
  const t = useThemeTokens();
  const [activeTab, setActiveTab] = useState<'naming' | 'interaction' | 'tokens' | 'prompt' | 'live'>('naming');

  if (!figmaGuideOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className={`absolute inset-0 ${t.overlayBg} backdrop-blur-md`} onClick={toggleFigmaGuide} />
      <div
        className={`relative w-[920px] max-h-[90vh] ${t.modalBg} border ${t.modalBorder} rounded-2xl flex flex-col overflow-hidden`}
        style={{ boxShadow: t.modalShadow }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.sectionBorder}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
            <Figma className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-white/90">Figma AI 设计指南 · §6</div>
            <div className="text-[11px] text-white/30">命名规范 · 交互标注 · Design Tokens · AI 插件提示词</div>
          </div>
          <button onClick={toggleFigmaGuide} className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-white/[0.06] overflow-x-auto">
          {([
            { key: 'naming' as const, label: '§6.1 命名规范', icon: Tag },
            { key: 'interaction' as const, label: '§6.2 交互标注', icon: MousePointerClick },
            { key: 'tokens' as const, label: '§6.3 Design Tokens', icon: Palette },
            { key: 'prompt' as const, label: '§6.4 AI 提示词', icon: Sparkles },
            { key: 'live' as const, label: '实时映射', icon: Zap },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] transition-all border-b-2 whitespace-nowrap ${
                activeTab === key
                  ? 'text-purple-400 border-purple-400 bg-purple-500/[0.05]'
                  : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          {activeTab === 'naming' && <NamingConventionTab />}
          {activeTab === 'interaction' && <InteractionAnnotationTab />}
          {activeTab === 'tokens' && <DesignTokensTab />}
          {activeTab === 'prompt' && <AIPromptTab />}
          {activeTab === 'live' && <LiveMappingTab />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
          <span className="text-[10px] text-white/20">
            {NAMING_RULES.length} 命名规则 · {INTERACTION_RULES.length} 交互标注 · {DESIGN_TOKENS.length} Design Tokens
          </span>
          <button onClick={toggleFigmaGuide} className="px-4 py-1.5 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.1] transition-all">
            完成
          </button>
        </div>
      </div>
    </div>
  );
}