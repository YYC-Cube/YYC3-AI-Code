import React, { useState, useCallback } from 'react';
import {
  Settings, Palette, Code, Sparkles, X, ChevronRight, Trash2,
  Copy, Layers, Move, Lock, Unlock, Eye, EyeOff, Zap,
  Send, Bot, Loader, Check, PanelTop, RefreshCw, ShieldAlert,
  Shield, Database, Link2, LayoutGrid
} from 'lucide-react';
import { useDesigner, COMPONENT_LIBRARY } from '../../store';
import { useThemeTokens } from './hooks/useThemeTokens';
import { PropsDiffPanel } from './PropsDiffPanel';

export function Inspector() {
  const t = useThemeTokens();
  const {
    selectedComponentId, selectedPanelId, components, panels,
    updateComponentProps, removeComponent, selectComponent,
    duplicateComponent, addAIMessage, toggleAI, aiOpen,
    importDesignJSON, currentUserIdentity,
  } = useDesigner();
  const [activeTab, setActiveTab] = useState<'props' | 'style' | 'events' | 'ai'>('props');

  // RBAC: viewer and guest are read-only
  const userRole = currentUserIdentity?.role || 'editor';
  const isReadOnly = userRole === 'viewer' || userRole === 'guest';

  const selectedComponent = components.find(c => c.id === selectedComponentId);
  const selectedPanel = panels.find(p => p.id === selectedPanelId);

  if (!selectedComponent && !selectedPanel) {
    return (
      <div className={`w-[260px] border-l ${t.panelBorder} ${t.panelBg} flex flex-col items-center justify-center shrink-0 select-none ${t.scrollClass}`}
        style={{ boxShadow: t.panelShadow.replace('1px', '-1px').replace('4px', '-4px') }}
      >
        <div className="text-center px-6">
          <div className={`w-12 h-12 rounded-2xl ${t.inputBg} flex items-center justify-center mx-auto mb-3`}>
            <Layers className={`w-5 h-5 ${t.textMuted}`} />
          </div>
          <p className={`text-[12px] ${t.textTertiary} leading-relaxed`}>选择一个组件或面板<br />以查看其属性</p>
          {isReadOnly && (
            <div className="flex items-center gap-1.5 justify-center mt-3 px-2 py-1.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/10">
              <ShieldAlert className="w-3 h-3 text-amber-400/60" />
              <span className="text-[9px] text-amber-400/50">当前为{userRole === 'viewer' ? '观察者' : '访客'}模式 · 只读</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-[260px] border-l ${t.panelBorder} ${t.panelBg} flex flex-col shrink-0 select-none ${t.scrollClass}`}
      style={{ boxShadow: t.panelShadow.replace('1px', '-1px').replace('4px', '-4px') }}
    >
      {/* RBAC Read-only Banner */}
      {isReadOnly && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/[0.06] border-b border-amber-500/10">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-amber-400/70">{userRole === 'viewer' ? '观察者' : '访客'}模式 — 属性只读</span>
          </div>
          <Lock className="w-3 h-3 text-amber-400/40 shrink-0" />
        </div>
      )}

      {/* Header */}
      <div className={`p-3 border-b ${t.sectionBorder}`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md ${t.accentBg} flex items-center justify-center`}>
            <Zap className={`w-3 h-3 ${t.accent}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-[12px] ${t.textPrimary} truncate`}>
              {selectedComponent?.label || selectedPanel?.name || '未命名'}
            </div>
            <div className={`text-[10px] ${t.textTertiary}`}>
              {selectedComponent ? `${selectedComponent.type} · ${selectedComponent.id}` : `面板 · ${selectedPanel?.id}`}
            </div>
          </div>
          {selectedComponent && (
            <button
              onClick={() => selectComponent(null)}
              className={`p-1 rounded ${t.textMuted} hover:text-white/50 ${t.hoverBg}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {selectedComponent && (
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={() => { if (selectedComponent && !isReadOnly) removeComponent(selectedComponent.id); }}
              className={`p-1.5 rounded ${isReadOnly ? `${t.textMuted} opacity-30 cursor-not-allowed` : `${t.textMuted} ${t.dangerHover}`} transition-all`}
              title={isReadOnly ? '只读模式' : '删除'}
              disabled={isReadOnly}
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => { if (selectedComponent && !isReadOnly) duplicateComponent(selectedComponent.id); }}
              className={`p-1.5 rounded ${isReadOnly ? `${t.textMuted} opacity-30 cursor-not-allowed` : `${t.textMuted} hover:text-white/50 ${t.hoverBg}`} transition-all`}
              title={isReadOnly ? '只读模式' : '复制'}
              disabled={isReadOnly}
            >
              <Copy className="w-3 h-3" />
            </button>
            <button className={`p-1.5 rounded ${isReadOnly ? `${t.textMuted} opacity-30 cursor-not-allowed` : `${t.textMuted} hover:text-white/50 ${t.hoverBg}`} transition-all`} title="显示/隐藏" disabled={isReadOnly}>
              <Eye className="w-3 h-3" />
            </button>
            <button className={`p-1.5 rounded ${isReadOnly ? `${t.textMuted} opacity-30 cursor-not-allowed` : `${t.textMuted} hover:text-white/50 ${t.hoverBg}`} transition-all`} title="锁定" disabled={isReadOnly}>
              <Unlock className="w-3 h-3" />
            </button>
            <div className="flex-1" />
            <button
              onClick={() => {
                const panel = panels.find(p => p.id === selectedComponent.panelId);
                const json = JSON.stringify({
                  component: { type: selectedComponent.type, label: selectedComponent.label, props: selectedComponent.props },
                  panel: panel ? { name: panel.name, type: panel.type } : null,
                }, null, 2);
                addAIMessage({
                  role: 'user',
                  content: `请帮我优化以下组件的属性配置，保持类型不变，返回优化后的 JSON（包含 type、label、props 字段）：\n\n\`\`\`json\n${json}\n\`\`\`\n\n请基于最佳实践给出属性建议和理由。`,
                });
                if (!aiOpen) toggleAI();
              }}
              className={`p-1.5 rounded ${t.accent} ${t.accentBg} hover:opacity-80 transition-all`}
              title="发送到 AI 助手"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        )}
        {selectedPanel && !selectedComponent && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex-1" />
            <button
              onClick={() => {
                const panelComponents = components.filter(c => c.panelId === selectedPanel.id);
                const json = JSON.stringify({
                  panel: {
                    name: selectedPanel.name,
                    type: selectedPanel.type,
                    layout: { x: selectedPanel.x, y: selectedPanel.y, w: selectedPanel.w, h: selectedPanel.h },
                  },
                  components: panelComponents.map(c => ({
                    type: c.type, label: c.label, props: c.props,
                  })),
                }, null, 2);
                addAIMessage({
                  role: 'user',
                  content: `请帮我优化以下面板及其组件配置。返回 JSON 格式（保持 panels + children 结构），可以调整属性、增减组件：\n\n\`\`\`json\n${json}\n\`\`\`\n\n请给出改进建议，使面板更实用。`,
                });
                if (!aiOpen) toggleAI();
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${t.accent} ${t.accentBg} hover:opacity-80 transition-all text-[10px]`}
              title="发送面板到 AI 助手"
            >
              <Send className="w-3 h-3" />
              发送到 AI
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${t.sectionBorder}`}>
        {[
          { key: 'props' as const, label: '属性', icon: Settings },
          { key: 'style' as const, label: '样式', icon: Palette },
          { key: 'events' as const, label: '事件', icon: Code },
          { key: 'ai' as const, label: 'AI', icon: Sparkles },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] transition-all ${
              activeTab === key
                ? `${t.activeTabText} border-b-2 ${t.activeTabBorder} ${t.accentBg.replace('/20', '/[0.03]')}`
                : `${t.textTertiary} hover:text-white/50`
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Content — with RBAC overlay */}
      <div className="relative flex-1 overflow-y-auto">
        {/* Read-only overlay mask */}
        {isReadOnly && (
          <div className="absolute inset-0 z-10 pointer-events-auto">
            {/* Semi-transparent frosted overlay */}
            <div className="absolute inset-0 bg-[#0d0e14]/40 backdrop-blur-[1px]" />
            {/* Centered RBAC notice */}
            <div className="sticky top-0 flex flex-col items-center justify-center pt-8 pb-4 px-4 z-20">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/[0.08] border border-amber-500/15 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-amber-400/60" />
              </div>
              <div className="text-[12px] text-amber-400/80 mb-1" style={{ fontWeight: 600 }}>
                {userRole === 'viewer' ? '观察者' : '访客'}只读模式
              </div>
              <div className="text-[10px] text-white/25 text-center leading-relaxed max-w-[200px]">
                当前角色无编辑权限，属性面板仅供查阅。如需编辑请联系项目所有者升级角色。
              </div>
              <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/10">
                <Lock className="w-3 h-3 text-amber-400/40" />
                <span className="text-[9px] text-amber-400/40">RBAC · {userRole}</span>
              </div>
            </div>
          </div>
        )}
        <div className="p-3 space-y-3">
          {activeTab === 'props' && selectedComponent && (
            <PropsEditor component={selectedComponent} onUpdate={updateComponentProps} readOnly={isReadOnly} />
          )}
          {activeTab === 'props' && selectedComponent && !isReadOnly && (
            <PropsDiffPanel />
          )}
          {activeTab === 'props' && !selectedComponent && selectedPanel && (
            <PanelPropsEditor panel={selectedPanel} />
          )}
          {activeTab === 'style' && <StyleEditor readOnly={isReadOnly} />}
          {activeTab === 'events' && <EventsEditor component={selectedComponent} readOnly={isReadOnly} />}
          {activeTab === 'ai' && <AIPropsAssist component={selectedComponent} readOnly={isReadOnly} />}
        </div>
      </div>
    </div>
  );
}

function PropsEditor({ component, onUpdate, readOnly = false }: { component: any; onUpdate: (id: string, props: Record<string, any>) => void; readOnly?: boolean }) {
  const t = useThemeTokens();
  return (
    <div className="space-y-3">
      <div className={`text-[10px] ${t.textMuted} uppercase tracking-wider`}>
        组件属性{readOnly ? ' (只读)' : ''}
      </div>
      {Object.entries(component.props).map(([key, value]) => (
        <div key={key}>
          <label className={`text-[11px] ${t.textTertiary} mb-1 block`}>{key}</label>
          {typeof value === 'boolean' ? (
            <button
              onClick={() => !readOnly && onUpdate(component.id, { [key]: !value })}
              disabled={readOnly}
              className={`w-8 h-4 rounded-full transition-colors ${readOnly ? 'opacity-40 cursor-not-allowed' : ''} ${value ? t.btnPrimary : 'bg-white/[0.1]'}`}
            >
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${value ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
          ) : Array.isArray(value) ? (
            <div className="space-y-1">
              {(value as any[]).map((item, idx) => (
                <input
                  key={idx}
                  value={String(item)}
                  readOnly={readOnly}
                  onChange={(e) => {
                    if (readOnly) return;
                    const newArr = [...value as any[]];
                    newArr[idx] = e.target.value;
                    onUpdate(component.id, { [key]: newArr });
                  }}
                  className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-md px-2.5 py-1.5 text-[11px] ${t.inputText} focus:outline-none ${readOnly ? 'opacity-50 cursor-not-allowed' : t.inputFocusBorder}`}
                />
              ))}
            </div>
          ) : typeof value === 'number' ? (
            <input
              type="number"
              value={value as number}
              readOnly={readOnly}
              onChange={(e) => !readOnly && onUpdate(component.id, { [key]: Number(e.target.value) })}
              className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-md px-2.5 py-1.5 text-[11px] ${t.inputText} focus:outline-none ${readOnly ? 'opacity-50 cursor-not-allowed' : t.inputFocusBorder}`}
            />
          ) : (
            <input
              value={String(value)}
              readOnly={readOnly}
              onChange={(e) => !readOnly && onUpdate(component.id, { [key]: e.target.value })}
              className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-md px-2.5 py-1.5 text-[11px] ${t.inputText} focus:outline-none ${readOnly ? 'opacity-50 cursor-not-allowed' : t.inputFocusBorder}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PanelPropsEditor({ panel }: { panel: any }) {
  const t = useThemeTokens();
  return (
    <div className="space-y-3">
      <div className={`text-[10px] ${t.textMuted} uppercase tracking-wider`}>面板属性</div>
      {['name', 'type'].map(key => (
        <div key={key}>
          <label className={`text-[11px] ${t.textTertiary} mb-1 block`}>{key}</label>
          <input
            value={String(panel[key])}
            readOnly
            className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-md px-2.5 py-1.5 text-[11px] ${t.textTertiary}`}
          />
        </div>
      ))}
      <div>
        <label className={`text-[11px] ${t.textTertiary} mb-1 block`}>布局 (Layout)</label>
        <div className="grid grid-cols-2 gap-2">
          {['x', 'y', 'w', 'h'].map(k => (
            <div key={k}>
              <span className={`text-[9px] ${t.textMuted} uppercase`}>{k}</span>
              <input
                value={panel[k]}
                readOnly
                className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-md px-2 py-1 text-[11px] ${t.textTertiary} mt-0.5`}
              />
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className={`text-[11px] ${t.textTertiary} mb-1 block`}>子组件</label>
        <span className={`text-[12px] ${t.textTertiary}`}>{panel.children?.length || 0} 个组件</span>
      </div>
    </div>
  );
}

function StyleEditor({ readOnly = false }: { readOnly?: boolean }) {
  const t = useThemeTokens();
  const styles = [
    { label: '圆角', value: '12px', prop: 'borderRadius' },
    { label: '内边距', value: '16px', prop: 'padding' },
    { label: '外边距', value: '0px', prop: 'margin' },
    { label: '背景色', value: 'transparent', prop: 'backgroundColor' },
    { label: '边框', value: '1px solid rgba(255,255,255,0.06)', prop: 'border' },
    { label: '阴影', value: 'none', prop: 'boxShadow' },
    { label: '不透明度', value: '100%', prop: 'opacity' },
  ];
  return (
    <div className="space-y-3">
      <div className={`text-[10px] ${t.textMuted} uppercase tracking-wider`}>
        样式属性{readOnly ? ' (只读)' : ''}
      </div>
      {styles.map(s => (
        <div key={s.prop}>
          <label className={`text-[11px] ${t.textTertiary} mb-1 block`}>{s.label}</label>
          <input
            value={s.value}
            readOnly
            className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-md px-2.5 py-1.5 text-[11px] ${t.textTertiary} ${readOnly ? 'opacity-50' : ''}`}
          />
        </div>
      ))}
    </div>
  );
}

function EventsEditor({ component, readOnly = false }: { component: any; readOnly?: boolean }) {
  const t = useThemeTokens();
  const events = [
    { name: 'onClick', bound: component?.type === 'Button', handler: 'handleSubmit()' },
    { name: 'onChange', bound: component?.type === 'Input', handler: 'updateField(e)' },
    { name: 'onHover', bound: false, handler: '' },
    { name: 'onFocus', bound: false, handler: '' },
  ];
  return (
    <div className="space-y-3">
      <div className={`text-[10px] ${t.textMuted} uppercase tracking-wider`}>
        事件绑定{readOnly ? ' (只读)' : ''}
      </div>
      {events.map(evt => (
        <div key={evt.name} className={`p-2.5 rounded-lg border ${evt.bound ? `${t.accentBorder} ${t.accentBg.replace('/20', '/[0.03]')}` : `${t.surfaceInsetBorder} ${t.surfaceInset}`}`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${evt.bound ? t.btnPrimary : t.surfaceInset}`} />
            <span className={`text-[11px] ${t.textSecondary}`}>{evt.name}</span>
            {evt.bound && <span className={`text-[9px] ${t.accent} ml-auto`}>已绑定</span>}
          </div>
          {evt.bound && (
            <code className={`block mt-1 text-[10px] ${t.codeAccent} ${t.accentBg.replace('/20', '/[0.06]')} rounded px-2 py-1`}>{evt.handler}</code>
          )}
        </div>
      ))}
    </div>
  );
}

function AIPropsAssist({ component, readOnly = false }: { component: any; readOnly?: boolean }) {
  const t = useThemeTokens();
  const {
    addAIMessage, toggleAI, aiOpen, panels, components,
    importDesignJSON, updateComponentProps, dataBindings,
  } = useDesigner();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [patchApplied, setPatchApplied] = useState(false);
  const [contextInfo, setContextInfo] = useState<{ binding: string | null; siblings: string[]; panelType: string | null }>({
    binding: null, siblings: [], panelType: null,
  });

  const handleGenerate = useCallback(() => {
    setLoading(true);
    setPatchApplied(false);

    // Generate context-aware suggestions based on component type, data bindings, and siblings
    setTimeout(() => {
      const compDef = COMPONENT_LIBRARY.find(c => c.type === component?.type);
      const baseProps = compDef?.defaultProps || {};
      const currentProps = component?.props || {};

      // ── Context analysis ──
      const binding = component ? (dataBindings[component.id] || null) : null;
      const parentPanel = panels.find(p => p.children?.includes(component?.id));
      const siblingComps = parentPanel
        ? components.filter(c => parentPanel.children?.includes(c.id) && c.id !== component?.id)
        : [];
      const siblingTypes = siblingComps.map(c => c.type);
      const panelType = parentPanel?.type || null;

      setContextInfo({
        binding,
        siblings: siblingTypes,
        panelType,
      });

      const recs: string[] = [];

      // ── Data binding aware suggestions (highest priority) ──
      if (binding) {
        recs.push(`已绑定数据源「${binding}」— 建议配置自动刷新 (autoRefresh: true)`);
        if (component?.type === 'Table') {
          recs.push(`数据源「${binding}」绑定 — 启用服务端分页 (serverPagination: true)`);
          recs.push('绑定数据量可能较大 — 启用虚拟滚动 (virtualScroll: true)');
        }
        if (component?.type === 'Chart') {
          recs.push(`数据源「${binding}」绑定 — 启用实时数据流 (realtime: true)`);
        }
        if (component?.type === 'Input' || component?.type === 'Textarea') {
          recs.push(`数据源「${binding}」绑定 — 启用双向同步 (syncMode: "bidirectional")`);
        }
      }

      // ── Sibling context aware suggestions ──
      if (siblingTypes.includes('Table') && component?.type === 'Button') {
        recs.push('面板含表格 — 建议设为表格操作按钮 (variant: "primary")');
        recs.push('搭配表格使用 — 添加批量操作功能 (batchAction: true)');
      }
      if (siblingTypes.includes('Chart') && component?.type === 'Select') {
        recs.push('面板含图表 — 建议用作图表数据筛选器 (filterTarget: "chart")');
      }
      if (siblingTypes.includes('Input') && component?.type === 'Button') {
        recs.push('面板含输入框 — 建议设为表单提交按钮 (formSubmit: true)');
      }
      if (siblingTypes.includes('Button') && component?.type === 'Input') {
        recs.push('面板含按钮 — 建议回车触发提交 (submitOnEnter: true)');
      }
      if (siblingTypes.length > 3) {
        recs.push(`面板已有 ${siblingTypes.length} 个兄弟组件 — 考虑分组布局 (groupLayout: true)`);
      }

      // ── Panel type context ──
      if (panelType === 'form' && component?.type !== 'Button') {
        recs.push('所在面板为表单类型 — 建议添加标签 (label: "字段名")');
        if (!currentProps.required) recs.push('表单面板 — 标记为必填 (required: true)');
      }
      if (panelType === 'table' && component?.type === 'Button') {
        recs.push('所在面板为表格类型 — 设为表格工具栏按钮 (toolbar: true)');
      }

      // ── Type-specific base recommendations ──
      if (component?.type === 'Table') {
        if (!recs.some(r => r.includes('pageSize'))) recs.push('建议启用分页 (pageSize: 20)');
        if (!currentProps.sortable) recs.push('添加排序功能 (sortable: true)');
        if (!recs.some(r => r.includes('searchable'))) recs.push('添加搜索过滤栏 (searchable: true)');
        recs.push('启用行选择 (selectable: true)');
        recs.push('添加导出 CSV 功能 (exportable: true)');
      } else if (component?.type === 'Chart') {
        if (!recs.some(r => r.includes('chartType'))) recs.push('建议使用折线图展示趋势 (chartType: "line")');
        if (!currentProps.showLabel) recs.push('添加数据标签 (showLabel: true)');
        recs.push('启用缩放交互 (zoomable: true)');
        recs.push('添加图例 (showLegend: true)');
      } else if (component?.type === 'Input' || component?.type === 'Textarea') {
        if (!currentProps.required && !recs.some(r => r.includes('required'))) recs.push('标记为必填 (required: true)');
        recs.push('添加验证规则 (validation: "email|phone|custom")');
        recs.push('设置最大长度 (maxLength: 200)');
      } else if (component?.type === 'Button') {
        if (!recs.some(r => r.includes('loading'))) recs.push('设置加载态 (loading: false)');
        recs.push('设置禁用态 (disabled: false)');
        if (currentProps.variant !== 'danger' && !recs.some(r => r.includes('variant'))) {
          recs.push('考虑使用 danger 变体 (variant: "danger")');
        }
      } else {
        recs.push('添加 aria-label 辅助属性');
        recs.push('设置合理的默认值');
        recs.push('添加加载态 (loading: false)');
        recs.push('添加禁用态 (disabled: false)');
      }

      setSuggestions(recs);
      setLoading(false);
    }, 800);
  }, [component, dataBindings, panels, components]);

  /** Apply a suggestion that contains "key: value" pattern */
  const handleApplySuggestion = useCallback((suggestion: string) => {
    if (!component) return;
    // Extract key-value pairs from suggestion like (key: value)
    const match = suggestion.match(/\((\w+):\s*(.+?)\)/);
    if (match) {
      const key = match[1];
      let val: any = match[2].trim();
      // Parse value
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(Number(val))) val = Number(val);
      else val = val.replace(/^["']|["']$/g, '');

      updateComponentProps(component.id, { [key]: val });
      setPatchApplied(true);
      setTimeout(() => setPatchApplied(false), 2000);
    }
  }, [component, updateComponentProps]);

  /** Send selected component to AI for deep analysis */
  const handleSendToAI = useCallback(() => {
    if (!component) return;
    const panel = panels.find(p => p.children.includes(component.id));
    const json = JSON.stringify({
      component: {
        type: component.type,
        label: component.label,
        props: component.props,
      },
      panel: panel ? { name: panel.name, type: panel.type } : null,
    }, null, 2);

    addAIMessage({
      role: 'user',
      content: `请帮我深度优化以下组件，返回改进后的完整 JSON。保持 type 不变，优化 props 配置使其更专业实用。请同时解释每项改动的理由：\n\n\`\`\`json\n${json}\n\`\`\``,
    });

    if (!aiOpen) toggleAI();
  }, [component, panels, addAIMessage, aiOpen, toggleAI]);

  return (
    <div className="space-y-3">
      <div className={`text-[10px] ${t.textMuted} uppercase tracking-wider`}>AI 智能建议</div>

      {/* Context awareness card */}
      {(contextInfo.binding || contextInfo.siblings.length > 0 || contextInfo.panelType) && (
        <div className={`p-2.5 rounded-lg ${t.surfaceInset} border ${t.surfaceInsetBorder} space-y-1.5`}>
          <div className="flex items-center gap-1.5">
            <LayoutGrid className={`w-3 h-3 ${t.accent}`} />
            <span className={`text-[9px] ${t.accent} uppercase tracking-wider`}>上下文感知</span>
          </div>
          {contextInfo.binding && (
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400/60" />
              <span className="text-[10px] text-emerald-400/60">数据绑定:</span>
              <span className="text-[10px] text-emerald-400/80">{contextInfo.binding}</span>
            </div>
          )}
          {contextInfo.siblings.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Link2 className="w-3 h-3 text-cyan-400/60" />
              <span className="text-[10px] text-cyan-400/60">兄弟组件:</span>
              <span className="text-[10px] text-white/35 truncate">{contextInfo.siblings.join(', ')}</span>
            </div>
          )}
          {contextInfo.panelType && (
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-amber-400/60" />
              <span className="text-[10px] text-amber-400/60">面板类型:</span>
              <span className="text-[10px] text-white/35">{contextInfo.panelType}</span>
            </div>
          )}
        </div>
      )}

      {/* Quick generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || readOnly}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg ${t.suggestionBg} border ${t.suggestionBorder} ${t.accent} text-[12px] hover:opacity-80 transition-all disabled:opacity-50 ${readOnly ? 'cursor-not-allowed' : ''}`}
      >
        {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {loading ? '上下文分析中...' : '生成上下文感知建议'}
      </button>

      {/* Send to AI assistant for deep analysis */}
      <button
        onClick={handleSendToAI}
        disabled={readOnly}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400/80 text-[11px] hover:bg-cyan-500/15 transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Bot className="w-3.5 h-3.5" />
        发送到 AI 助手深度优化
      </button>

      {/* Suggestions list */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <div className={`text-[9px] ${t.textMuted} uppercase tracking-wider mt-2`}>
            点击建议直接应用
          </div>
          {suggestions.map((s, i) => {
            const hasApplyable = /\(\w+:\s*.+?\)/.test(s);
            return (
              <button
                key={i}
                onClick={() => handleApplySuggestion(s)}
                disabled={!hasApplyable}
                className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-all ${
                  hasApplyable
                    ? `${t.accentBg.replace('/20', '/[0.04]')} border ${t.suggestionBorder} cursor-pointer hover:opacity-80`
                    : `${t.surfaceInset} border ${t.surfaceInsetBorder} cursor-default opacity-60`
                }`}
              >
                {hasApplyable ? (
                  <ChevronRight className={`w-3 h-3 ${t.accent} mt-0.5 shrink-0`} />
                ) : (
                  <Sparkles className={`w-3 h-3 ${t.textMuted} mt-0.5 shrink-0`} />
                )}
                <span className={`text-[11px] ${t.textSecondary}`}>{s}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Patch applied feedback */}
      {patchApplied && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400/70">属性已更新到组件</span>
        </div>
      )}
    </div>
  );
}