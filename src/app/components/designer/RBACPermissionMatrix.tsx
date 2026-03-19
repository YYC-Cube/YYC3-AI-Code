import React, { useState, useCallback, useMemo } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, Eye, Lock,
  CheckCircle2, XCircle, MinusCircle, X,
  Layers, Puzzle, Plug, Rocket, Settings, Users,
  Database, Code, Save, Trash2, Share2, Pencil,
  ChevronDown, ChevronRight, Radio, RotateCcw, Wifi
} from 'lucide-react';
import { useDesigner } from '../../store';
import { useThemeTokens } from './hooks/useThemeTokens';
import { Tooltip } from './Tooltip';

/* ================================================================
   RBAC Permission Matrix — 细粒度权限映射表 + 可编辑
   ================================================================ */

type PermLevel = 'full' | 'limited' | 'readonly' | 'denied';
const PERM_CYCLE: PermLevel[] = ['full', 'limited', 'readonly', 'denied'];

interface PermissionRow {
  id: string;
  category: string;
  label: string;
  icon: React.ElementType;
  desc: string;
  permissions: Record<string, PermLevel>;
}

const PERM_CATEGORIES = [
  { id: 'panel', label: '面板操作', icon: Layers },
  { id: 'component', label: '组件操作', icon: Puzzle },
  { id: 'plugin', label: '插件管理', icon: Plug },
  { id: 'deploy', label: '部署发布', icon: Rocket },
  { id: 'data', label: '数据管理', icon: Database },
  { id: 'system', label: '系统设置', icon: Settings },
];

const ROLES = [
  { id: 'owner', label: '所有者', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: ShieldCheck },
  { id: 'admin', label: '管理员', color: 'text-rose-400', bg: 'bg-rose-500/15', icon: Shield },
  { id: 'editor', label: '编辑者', color: 'text-cyan-400', bg: 'bg-cyan-500/15', icon: Pencil },
  { id: 'viewer', label: '观察者', color: 'text-white/40', bg: 'bg-white/[0.06]', icon: Eye },
  { id: 'guest', label: '访客', color: 'text-white/25', bg: 'bg-white/[0.04]', icon: Lock },
];

const DEFAULT_PERMISSIONS: PermissionRow[] = [
  // Panel
  { id: 'panel-create', category: 'panel', label: '创建面板', icon: Layers, desc: '新增空白/模板面板',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'denied', guest: 'denied' } },
  { id: 'panel-edit', category: 'panel', label: '编辑面板', icon: Pencil, desc: '修改面板布局/属性',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'readonly', guest: 'denied' } },
  { id: 'panel-delete', category: 'panel', label: '删除面板', icon: Trash2, desc: '永久移除面板',
    permissions: { owner: 'full', admin: 'full', editor: 'limited', viewer: 'denied', guest: 'denied' } },
  { id: 'panel-merge', category: 'panel', label: '合并/拆分面板', icon: Layers, desc: '面板组合操作',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'denied', guest: 'denied' } },
  { id: 'panel-lock', category: 'panel', label: '锁定面板', icon: Lock, desc: 'CRDT 面板独占锁',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'denied', guest: 'denied' } },

  // Component
  { id: 'comp-drag', category: 'component', label: '拖拽组件', icon: Puzzle, desc: '从面板拖入组件',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'denied', guest: 'denied' } },
  { id: 'comp-props', category: 'component', label: '编辑属性', icon: Pencil, desc: '修改 Inspector 属性',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'readonly', guest: 'denied' } },
  { id: 'comp-delete', category: 'component', label: '删除组件', icon: Trash2, desc: '从面板移除组件',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'denied', guest: 'denied' } },
  { id: 'comp-databind', category: 'component', label: '数据绑定', icon: Database, desc: '组件↔数据库绑定',
    permissions: { owner: 'full', admin: 'full', editor: 'limited', viewer: 'denied', guest: 'denied' } },

  // Plugin
  { id: 'plugin-install', category: 'plugin', label: '安装插件', icon: Plug, desc: '从市场安装新插件',
    permissions: { owner: 'full', admin: 'full', editor: 'denied', viewer: 'denied', guest: 'denied' } },
  { id: 'plugin-uninstall', category: 'plugin', label: '卸载插件', icon: Trash2, desc: '移除已安装插件',
    permissions: { owner: 'full', admin: 'full', editor: 'denied', viewer: 'denied', guest: 'denied' } },
  { id: 'plugin-config', category: 'plugin', label: '插件配置', icon: Settings, desc: '修改插件参数',
    permissions: { owner: 'full', admin: 'full', editor: 'limited', viewer: 'denied', guest: 'denied' } },
  { id: 'plugin-toggle', category: 'plugin', label: '启停插件', icon: Plug, desc: '启用/禁用已安装插件',
    permissions: { owner: 'full', admin: 'full', editor: 'denied', viewer: 'denied', guest: 'denied' } },

  // Deploy
  { id: 'deploy-build', category: 'deploy', label: '构建部署', icon: Rocket, desc: '触发 npm build & start',
    permissions: { owner: 'full', admin: 'full', editor: 'denied', viewer: 'denied', guest: 'denied' } },
  { id: 'deploy-config', category: 'deploy', label: '部署配置', icon: Settings, desc: '修改 docker-compose/env',
    permissions: { owner: 'full', admin: 'limited', editor: 'denied', viewer: 'denied', guest: 'denied' } },
  { id: 'deploy-export', category: 'deploy', label: '导出代码', icon: Code, desc: '生成 React/Vue 代码',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'readonly', guest: 'denied' } },
  { id: 'deploy-share', category: 'deploy', label: '分享项目', icon: Share2, desc: '生成协作��请链接',
    permissions: { owner: 'full', admin: 'full', editor: 'denied', viewer: 'denied', guest: 'denied' } },

  // Data
  { id: 'data-schema', category: 'data', label: 'Schema 管理', icon: Database, desc: '修改数据库 Schema',
    permissions: { owner: 'full', admin: 'full', editor: 'limited', viewer: 'readonly', guest: 'denied' } },
  { id: 'data-crud', category: 'data', label: 'CRUD API', icon: Code, desc: '自动生成 API',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'denied', guest: 'denied' } },
  { id: 'data-save', category: 'data', label: '保存项目', icon: Save, desc: '持久化 design.json',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'denied', guest: 'denied' } },

  // System
  { id: 'sys-models', category: 'system', label: 'AI 模型配置', icon: Settings, desc: '管理 API Key / 模型',
    permissions: { owner: 'full', admin: 'full', editor: 'limited', viewer: 'denied', guest: 'denied' } },
  { id: 'sys-rbac', category: 'system', label: '角色管理', icon: Users, desc: '修改用户角色分配',
    permissions: { owner: 'full', admin: 'limited', editor: 'denied', viewer: 'denied', guest: 'denied' } },
  { id: 'sys-theme', category: 'system', label: '主题切换', icon: Eye, desc: '切换 UI 视觉主题',
    permissions: { owner: 'full', admin: 'full', editor: 'full', viewer: 'full', guest: 'full' } },
];

function PermIcon({ level }: { level: PermLevel }) {
  switch (level) {
    case 'full':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    case 'limited':
      return <MinusCircle className="w-3.5 h-3.5 text-amber-400" />;
    case 'readonly':
      return <Eye className="w-3.5 h-3.5 text-blue-400/60" />;
    case 'denied':
      return <XCircle className="w-3.5 h-3.5 text-red-400/30" />;
  }
}

const PERM_LABELS: Record<PermLevel, { text: string; color: string }> = {
  full: { text: '完全', color: 'text-emerald-400' },
  limited: { text: '受限', color: 'text-amber-400' },
  readonly: { text: '只读', color: 'text-blue-400/60' },
  denied: { text: '拒绝', color: 'text-red-400/30' },
};

export function RBACPermissionMatrix() {
  const { currentUserIdentity } = useDesigner();
  const t = useThemeTokens();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [highlightRole, setHighlightRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionRow[]>(DEFAULT_PERMISSIONS);
  const [changeCount, setChangeCount] = useState(0);
  const [broadcasting, setBroadcasting] = useState(false);
  const [lastBroadcast, setLastBroadcast] = useState<string | null>(null);

  const activeRole = currentUserIdentity?.role || 'editor';
  const canEdit = activeRole === 'owner' || activeRole === 'admin';

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  /** Cycle permission level for a cell */
  const cyclePermission = useCallback((permId: string, roleId: string) => {
    if (!canEdit) return;
    setPermissions(prev => prev.map(p => {
      if (p.id !== permId) return p;
      const currentLevel = p.permissions[roleId];
      const currentIdx = PERM_CYCLE.indexOf(currentLevel);
      const nextLevel = PERM_CYCLE[(currentIdx + 1) % PERM_CYCLE.length];
      return {
        ...p,
        permissions: { ...p.permissions, [roleId]: nextLevel },
      };
    }));
    setChangeCount(c => c + 1);
  }, [canEdit]);

  /** Simulate CRDT broadcast */
  const handleBroadcast = useCallback(() => {
    setBroadcasting(true);
    setTimeout(() => {
      setBroadcasting(false);
      setLastBroadcast(new Date().toLocaleTimeString('zh-CN'));
      setChangeCount(0);
    }, 1200);
  }, []);

  /** Reset to defaults */
  const handleReset = useCallback(() => {
    setPermissions(DEFAULT_PERMISSIONS);
    setChangeCount(0);
  }, []);

  // Statistics (computed from current permissions state)
  const totalPerms = permissions.length;
  const statsByRole = useMemo(() => ROLES.map(role => {
    const full = permissions.filter(p => p.permissions[role.id] === 'full').length;
    const limited = permissions.filter(p => p.permissions[role.id] === 'limited').length;
    const readonly = permissions.filter(p => p.permissions[role.id] === 'readonly').length;
    const denied = permissions.filter(p => p.permissions[role.id] === 'denied').length;
    return { ...role, full, limited, readonly, denied, access: full + limited + readonly };
  }), [permissions]);

  return (
    <div className="space-y-4">
      {/* Edit mode indicator */}
      {canEdit && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/10">
          <Pencil className="w-3.5 h-3.5 text-cyan-400/60 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-cyan-400/70">编辑模式 — 点击单元格切换权限级别</div>
            <div className="text-[9px] text-white/20 mt-0.5">权限轮转: 完全 → 受限 → 只读 → 拒绝 → 完全</div>
          </div>
          {changeCount > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] text-amber-400/60">{changeCount} 项变更</span>
              <Tooltip label="重置为默认" side="top">
                <button
                  onClick={handleReset}
                  className="p-1 rounded-md text-white/20 hover:text-white/40 hover:bg-white/[0.04] transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </Tooltip>
              <Tooltip label="广播到所有协作者 (CRDT)" side="top">
                <button
                  onClick={handleBroadcast}
                  disabled={broadcasting}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-400 text-[9px] hover:bg-cyan-500/25 transition-all disabled:opacity-50"
                >
                  <Wifi className={`w-3 h-3 ${broadcasting ? 'animate-pulse' : ''}`} />
                  {broadcasting ? '广播中...' : '广播变更'}
                </button>
              </Tooltip>
            </div>
          )}
          {lastBroadcast && changeCount === 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
              <span className="text-[9px] text-emerald-400/50">已广播 {lastBroadcast}</span>
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-2">
        {statsByRole.map(role => (
          <div
            key={role.id}
            className={`p-2.5 rounded-xl border transition-all cursor-default ${
              activeRole === role.id
                ? `${role.bg} border-white/[0.1] ring-1 ring-white/[0.06]`
                : 'border-white/[0.04] bg-white/[0.01]'
            }`}
            onMouseEnter={() => setHighlightRole(role.id)}
            onMouseLeave={() => setHighlightRole(null)}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield className={`w-3 h-3 ${role.color}`} />
              <span className={`text-[10px] ${role.color}`} style={{ fontWeight: 600 }}>{role.label}</span>
              {activeRole === role.id && (
                <span className="text-[7px] px-1 py-0 rounded bg-emerald-500/15 text-emerald-400 ml-auto">当前</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400/60 transition-all duration-300" style={{ width: `${(role.access / totalPerms) * 100}%` }} />
              </div>
              <span className="text-[9px] text-white/25">{Math.round((role.access / totalPerms) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1">
        {Object.entries(PERM_LABELS).map(([level, { text, color }]) => (
          <div key={level} className="flex items-center gap-1.5">
            <PermIcon level={level as PermLevel} />
            <span className={`text-[9px] ${color}`}>{text}</span>
          </div>
        ))}
        {canEdit && (
          <span className="text-[8px] text-white/15 ml-auto">点击可切换</span>
        )}
      </div>

      {/* Permission Matrix Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center bg-white/[0.02] border-b border-white/[0.06]">
          <div className="w-[240px] px-3 py-2.5 text-[10px] text-white/30 shrink-0" style={{ fontWeight: 600 }}>
            权限项
          </div>
          {ROLES.map(role => (
            <div
              key={role.id}
              className={`flex-1 px-2 py-2.5 text-center transition-all ${
                highlightRole === role.id ? 'bg-white/[0.04]' : ''
              } ${activeRole === role.id ? `${role.bg}` : ''}`}
              onMouseEnter={() => setHighlightRole(role.id)}
              onMouseLeave={() => setHighlightRole(null)}
            >
              <div className={`text-[10px] ${role.color}`} style={{ fontWeight: 600 }}>{role.label}</div>
            </div>
          ))}
        </div>

        {/* Categories + rows */}
        {PERM_CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          const isCollapsed = collapsedCategories.has(cat.id);
          const rows = permissions.filter(p => p.category === cat.id);

          return (
            <div key={cat.id}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-white/[0.015] border-b border-white/[0.04] hover:bg-white/[0.03] transition-all"
              >
                {isCollapsed
                  ? <ChevronRight className="w-3 h-3 text-white/20" />
                  : <ChevronDown className="w-3 h-3 text-white/20" />
                }
                <CatIcon className="w-3.5 h-3.5 text-white/30" />
                <span className="text-[10px] text-white/50" style={{ fontWeight: 600 }}>{cat.label}</span>
                <span className="text-[9px] text-white/15 ml-1">{rows.length} 项</span>
              </button>

              {/* Rows */}
              {!isCollapsed && rows.map(perm => {
                const RowIcon = perm.icon;
                // Check if this row was modified from defaults
                const defaultRow = DEFAULT_PERMISSIONS.find(d => d.id === perm.id);
                const isModified = defaultRow && ROLES.some(r => perm.permissions[r.id] !== defaultRow.permissions[r.id]);

                return (
                  <div key={perm.id} className={`flex items-center border-b border-white/[0.03] transition-all ${isModified ? 'bg-cyan-500/[0.02]' : 'hover:bg-white/[0.015]'}`}>
                    <div className="w-[240px] px-3 py-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <RowIcon className="w-3 h-3 text-white/20" />
                        <span className="text-[10px] text-white/50">{perm.label}</span>
                        {isModified && (
                          <span className="text-[7px] px-1 py-0 rounded bg-cyan-500/15 text-cyan-400/60">已修改</span>
                        )}
                      </div>
                      <div className="text-[8px] text-white/15 ml-5 mt-0.5">{perm.desc}</div>
                    </div>
                    {ROLES.map(role => {
                      const level = perm.permissions[role.id];
                      const isCurrentRole = activeRole === role.id;
                      const wasChanged = defaultRow && defaultRow.permissions[role.id] !== level;

                      return (
                        <Tooltip
                          key={role.id}
                          label={
                            canEdit
                              ? `${role.label}: ${PERM_LABELS[level].text} — 点击切换`
                              : `${role.label}: ${PERM_LABELS[level].text} — ${perm.label}`
                          }
                          side="top"
                        >
                          <div
                            onClick={() => cyclePermission(perm.id, role.id)}
                            className={`flex-1 flex items-center justify-center py-2 transition-all ${
                              highlightRole === role.id ? 'bg-white/[0.04]' : ''
                            } ${isCurrentRole ? `${role.bg}` : ''} ${
                              canEdit ? 'cursor-pointer hover:bg-white/[0.06] active:scale-95' : ''
                            } ${wasChanged ? 'ring-1 ring-inset ring-cyan-500/20' : ''}`}
                            onMouseEnter={() => setHighlightRole(role.id)}
                            onMouseLeave={() => setHighlightRole(null)}
                          >
                            <PermIcon level={level} />
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="flex items-start gap-2 px-1">
        <ShieldAlert className="w-3.5 h-3.5 text-white/15 shrink-0 mt-0.5" />
        <div className="text-[9px] text-white/20 leading-relaxed">
          权限矩阵定义了 YANYUCLOUD 多联式设计器中各角色的操作范围。
          <strong className="text-white/30">「受限」</strong>表示需要额外条件（如面板所有权、审批流程）才能执行。
          {canEdit && <><br /><strong className="text-cyan-400/40">编辑提示：</strong>点击单元格循环切换权限级别，修改后点击「广播变更」同步到所有协作者。</>}
          {!canEdit && <> 实际部署中由后端 JWT + RBAC 中间件强制执行，前端仅做 UI 适配。</>}
          {' '}当前角色 <strong className="text-white/30">「{statsByRole.find(r => r.id === activeRole)?.label}」</strong> 可访问 {totalPerms} 项中的 {statsByRole.find(r => r.id === activeRole)?.access} 项。
        </div>
      </div>
    </div>
  );
}