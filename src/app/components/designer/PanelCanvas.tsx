/**
 * @file PanelCanvas.tsx
 * @description YYC3 Designer 面板画布 — 多面板拖拽、合并、拆分、嵌套、实时预览、CRDT 协同
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags designer,panel,canvas,drag-drop,merge,split,crdt,preview
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import {
  GripHorizontal, X, Maximize2, Copy,
  Table, ChartBar, TrendingUp, TextCursorInput, RectangleHorizontal,
  Play, FileText, Code, List, Square, ChevronDown, Sparkles,
  Plus, Columns, Rows, Eye, LayoutGrid, FileCode2, FormInput, Layers,
  Merge, ArrowUpDown, Scissors, ArrowLeft, Magnet, Move,
  Group, Lock, Unlock
} from 'lucide-react';
import { useDesigner, type Panel as PanelType, type ComponentInstance } from '../../store';
import { useThemeTokens } from './hooks/useThemeTokens';
import { useLayoutConstraints } from './hooks/useLayoutConstraints';

/* ================================================================
   Accent color helper — extract raw CSS accent color from theme tokens
   for inline styles & boxShadow values
   ================================================================ */

function useAccentColors(t: ReturnType<typeof useThemeTokens>) {
  const isAurora = t.accent.includes('#00ff87');
  const isLiquid = t.accent.includes('violet');

  return {
    isAurora,
    isLiquid,
    raw: isAurora ? '#00ff87' : isLiquid ? '#8b5cf6' : '#667eea',
    rawRgb: isAurora ? '0,255,135' : isLiquid ? '139,92,246' : '102,126,234',
    secondary: isAurora ? '#60efff' : isLiquid ? '#d946ef' : '#a855f7',
    secondaryRgb: isAurora ? '96,239,255' : isLiquid ? '217,70,239' : '168,85,247',
    checkbox: isAurora ? '#00ff87' : isLiquid ? '#8b5cf6' : '#667eea',
    selectedShadow: isAurora
      ? '0 0 0 1px rgba(0,255,135,0.1), 0 8px 32px -8px rgba(0,0,0,0.5), 0 0 60px -20px rgba(0,255,135,0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
      : isLiquid
      ? '0 0 0 1px rgba(139,92,246,0.1), 0 8px 32px -8px rgba(0,0,0,0.5), 0 0 60px -20px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
      : '0 0 0 1px rgba(99,102,241,0.1), 0 8px 32px -8px rgba(0,0,0,0.5), 0 0 60px -20px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.04)',
    multiSelectShadow: isAurora
      ? '0 8px 40px -8px rgba(0,0,0,0.5), 0 0 60px -20px rgba(0,255,135,0.15)'
      : isLiquid
      ? '0 8px 40px -8px rgba(0,0,0,0.5), 0 0 60px -20px rgba(139,92,246,0.15)'
      : '0 8px 40px -8px rgba(0,0,0,0.5), 0 0 60px -20px rgba(34,211,238,0.15)',
    subCanvasShadow: isAurora
      ? '0 0 0 1px rgba(0,255,135,0.08), 0 16px 60px -12px rgba(0,0,0,0.5), 0 0 120px -40px rgba(0,255,135,0.1)'
      : isLiquid
      ? '0 0 0 1px rgba(139,92,246,0.08), 0 16px 60px -12px rgba(0,0,0,0.5), 0 0 120px -40px rgba(139,92,246,0.1)'
      : '0 0 0 1px rgba(99,102,241,0.08), 0 16px 60px -12px rgba(0,0,0,0.5), 0 0 120px -40px rgba(99,102,241,0.1)',
  };
}

/* ================================================================
   iframe Table HTML helper — column drag/sort/select for sandbox
   ================================================================ */

function generateIframeTableHTML(c: { id: string; props: Record<string, any> }): string {
  const cols: string[] = c.props.columns || ['Name', 'Email', 'Role'];
  const colWidths: Record<string, string> = {
    '姓名': '12%', '邮箱': '30%', '角色': '10%', '状态': '10%', '注册时间': '18%',
    'Name': '15%', 'Email': '30%', 'Role': '12%',
  };
  const mockRows = [
    ['张三', 'zhang@mail.com', '管理', '活跃', '2025-01-15'],
    ['李四', 'li@mail.com', '编辑', '活跃', '2025-02-20'],
    ['王五', 'wang@mail.com', '浏览', '离线', '2025-03-01'],
  ];
  const T = (c.id || 'tbl').replace(/-/g, '_');
  const cgHTML = '<col style="width:32px"/>' + cols.map(col =>
    '<col style="width:' + (colWidths[col] || 'auto') + '"/>'
  ).join('');
  const thChk = [
    '<th style="padding:8px 4px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06)">',
    '<input type="checkbox" id="chkAll_' + T + '" style="accent-color:#667eea;cursor:pointer"',
    " onchange=\"document.querySelectorAll('.rc_" + T + "').forEach(function(c){c.checked=this.checked}.bind(this));updB_" + T + '()"/>',
    '</th>',
  ].join('');
  const thCols = cols.map((col, ci) => {
    const p: string[] = [];
    p.push('<th draggable="true" data-ci="' + ci + '"');
    p.push(' ondragstart="dcS_' + T + '(event,' + ci + ')"');
    p.push(' ondragover="dcO_' + T + '(event,' + ci + ')"');
    p.push(' ondrop="dcD_' + T + '(event,' + ci + ')"');
    p.push(' ondragend="dcE_' + T + '()"');
    p.push(' style="text-align:left;padding:8px 12px;color:rgba(255,255,255,0.4);');
    p.push('border-bottom:1px solid rgba(255,255,255,0.06);white-space:nowrap;');
    p.push('cursor:grab;user-select:none;position:relative;transition:background 0.15s"');
    p.push(' onclick="doSort_' + T + "('" + col + "')\">");
    p.push(col);
    p.push(' <span class="si_' + T + '" data-col="' + col + '" style="font-size:10px;color:rgba(99,102,241,0.6)"></span>');
    p.push('<span class="dI_' + T + '" data-idx="' + ci + '" style="position:absolute;left:0;top:0;bottom:0;width:2px;background:rgb(99,102,241);display:none"></span>');
    p.push('</th>');
    return p.join('');
  }).join('');
  const renderCell = (cell: string) => {
    if (cell === '活跃') return '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:#34d399"></span>' + cell + '</span>';
    if (cell === '离线') return '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.2)"></span>' + cell + '</span>';
    return cell;
  };
  const tbHTML = mockRows.map(row => {
    const tds = row.slice(0, cols.length).map(cell =>
      '<td style="padding:6px 12px;color:rgba(255,255,255,0.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + renderCell(cell) + '</td>'
    ).join('');
    return '<tr class="tr_' + T + '" style="border-bottom:1px solid rgba(255,255,255,0.03)"><td style="padding:6px 4px;text-align:center"><input type="checkbox" class="rc_' + T + '" onchange="updB_' + T + '()" style="accent-color:#667eea;cursor:pointer"/></td>' + tds + '</tr>';
  }).join('');
  const batchBar = [
    '<div id="bb_' + T + '" style="display:none;padding:6px 12px;background:rgba(99,102,241,0.06);border-bottom:1px solid rgba(99,102,241,0.1);font-size:11px;color:rgb(129,140,248)">',
    '<span id="bc_' + T + '">0</span> 行已选 ',
    "<button onclick=\"document.querySelectorAll('.rc_" + T + "').forEach(function(c){c.checked=false});updB_" + T + '()" style="margin-left:8px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.04);border:none;color:rgba(255,255,255,0.4);font-size:10px;cursor:pointer">取消</button>',
    '<button style="margin-left:4px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.04);border:none;color:rgba(255,255,255,0.4);font-size:10px;cursor:pointer">批量删除</button>',
    '<button style="margin-left:4px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.04);border:none;color:rgba(255,255,255,0.4);font-size:10px;cursor:pointer">导出</button>',
    '</div>',
  ].join('');
  const sl: string[] = [];
  sl.push('var dSrc_' + T + '=null;');
  sl.push('function dcS_' + T + '(e,i){dSrc_' + T + '=i;e.dataTransfer.effectAllowed="move";e.target.style.opacity="0.4";}');
  sl.push('function dcO_' + T + '(e,i){e.preventDefault();e.dataTransfer.dropEffect="move";');
  sl.push('document.querySelectorAll(".dI_' + T + '").forEach(function(d){d.style.display="none";});');
  sl.push('if(dSrc_' + T + '!==null&&dSrc_' + T + '!==i){var d=document.querySelector(".dI_' + T + '[data-idx=\\""+i+"\\"]");if(d)d.style.display="block";}}');
  sl.push('function dcD_' + T + '(e,ti){e.preventDefault();var fi=dSrc_' + T + ';if(fi===null||fi===ti){dcE_' + T + '();return;}');
  sl.push('var tbl=document.getElementById("tb_' + T + '").parentElement;');
  sl.push('var hr=tbl.querySelector("thead tr");var ths=Array.from(hr.children);');
  sl.push('var m=ths.splice(fi+1,1)[0];ths.splice(ti+1,0,m);');
  sl.push('while(hr.children.length)hr.removeChild(hr.lastChild);ths.forEach(function(t){hr.appendChild(t);});');
  sl.push('tbl.querySelectorAll("tbody tr").forEach(function(r){var cs=Array.from(r.children);var mc=cs.splice(fi+1,1)[0];cs.splice(ti+1,0,mc);while(r.children.length)r.removeChild(r.lastChild);cs.forEach(function(c){r.appendChild(c);});});');
  sl.push('var cgs=Array.from(tbl.querySelectorAll("colgroup col"));var cg=tbl.querySelector("colgroup");var mg=cgs.splice(fi+1,1)[0];cgs.splice(ti+1,0,mg);while(cg.children.length)cg.removeChild(cg.lastChild);cgs.forEach(function(c){cg.appendChild(c);});');
  sl.push('dcE_' + T + '();}');
  sl.push('function dcE_' + T + '(){dSrc_' + T + '=null;document.querySelectorAll(".dI_' + T + '").forEach(function(d){d.style.display="none";});document.querySelectorAll("[data-ci]").forEach(function(t){t.style.opacity="1";});}');
  sl.push('var ss_' + T + '={col:null,dir:"asc"};');
  sl.push('function doSort_' + T + '(col){var s=ss_' + T + ';if(s.col===col)s.dir=s.dir==="asc"?"desc":"asc";else{s.col=col;s.dir="asc";}');
  sl.push('var tb=document.getElementById("tb_' + T + '");var rows=Array.from(tb.querySelectorAll("tr"));');
  sl.push('var ci=' + JSON.stringify(cols) + '.indexOf(col);');
  sl.push('rows.sort(function(a,b){var va=a.children[ci+1]?a.children[ci+1].textContent:"";var vb=b.children[ci+1]?b.children[ci+1].textContent:"";return s.dir==="asc"?va.localeCompare(vb,"zh-CN"):vb.localeCompare(va,"zh-CN");});');
  sl.push('rows.forEach(function(r){tb.appendChild(r);});');
  sl.push('document.querySelectorAll(".si_' + T + '").forEach(function(el){el.textContent=el.dataset.col===col?(s.dir==="asc"?"▲":"▼"):"";});}');
  sl.push('function updB_' + T + '(){var n=document.querySelectorAll(".rc_' + T + ':checked").length;');
  sl.push('document.getElementById("bb_' + T + '").style.display=n>0?"block":"none";');
  sl.push('document.getElementById("bc_' + T + '").textContent=n;');
  sl.push('document.querySelectorAll(".tr_' + T + '").forEach(function(r){var chk=r.querySelector(".rc_' + T + '");r.style.background=chk&&chk.checked?"rgba(99,102,241,0.06)":"";});}');
  const script = '<script>' + sl.join('') + '<\/script>';
  return [
    '<div style="border-radius:8px;border:1px solid rgba(255,255,255,0.06);overflow:hidden">',
    batchBar,
    '<table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">',
    '<colgroup>' + cgHTML + '</colgroup>',
    '<thead><tr style="background:rgba(255,255,255,0.03)">' + thChk + thCols + '</tr></thead>',
    '<tbody id="tb_' + T + '">' + tbHTML + '</tbody>',
    '</table></div>',
    script,
  ].join('');
}

/* ================================================================
   iframe HTML generator — real sandboxed rendering
   ================================================================ */

function generateIframeHTML(comps: ComponentInstance[]): string {
  const compHTML = comps.map(c => {
    switch (c.type) {
      case 'Button':
        return `<button style="padding:8px 16px;border-radius:8px;background:#667eea;color:#fff;border:none;font-size:13px;cursor:pointer">${c.props.label || '按钮'}</button>`;
      case 'Input':
        return `<div style="margin-bottom:8px">${c.props.label ? `<label style="display:block;font-size:12px;color:#9ca3af;margin-bottom:4px">${c.props.label}</label>` : ''}<input placeholder="${c.props.placeholder || ''}" type="${c.props.type || 'text'}" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#e5e7eb;font-size:13px;outline:none" /></div>`;
      case 'Select':
        return `<select style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#9ca3af;font-size:13px"><option>${c.props.placeholder || '请选择'}</option></select>`;
      case 'Text':
        return `<p style="font-size:14px;color:rgba(255,255,255,0.65)">${c.props.content || ''}</p>`;
      case 'Stat':
        return `<div style="padding:12px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)"><div style="font-size:12px;color:rgba(255,255,255,0.35)">${c.props.title}</div><div style="display:flex;align-items:flex-end;gap:8px;margin-top:4px"><span style="font-size:22px;color:rgba(255,255,255,0.9)">${c.props.value}</span><span style="font-size:12px;color:${(c.props.change || '').startsWith('+') ? '#34d399' : '#f87171'}">${c.props.change}</span></div></div>`;
      case 'Chart':
        const bars = [40, 65, 45, 80, 55, 70, 50, 85, 60, 75];
        return `<div style="padding:8px"><div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:8px">${c.props.title || 'Chart'}</div><div style="display:flex;align-items:flex-end;gap:3px;height:80px">${bars.map(v => `<div style="flex:1;height:${v}%;background:linear-gradient(to top,rgba(99,102,241,0.6),rgba(99,102,241,0.3));border-radius:2px 2px 0 0"></div>`).join('')}</div></div>`;
      case 'Table':
        return generateIframeTableHTML(c);
      /* DEAD_CODE_BLOCK_WAS_HERE
        const colWidths: Record<string, string> = { '姓名': '12%', '邮箱': '30%', '角色': '10%', '状态': '10%', '注册时间': '18%', 'Name': '15%', 'Email': '30%', 'Role': '12%' };
        const mockRows = [['张三', 'zhang@mail.com', '管理', '活跃', '2025-01-15'], ['李四', 'li@mail.com', '编辑', '活跃', '2025-02-20'], ['王五', 'wang@mail.com', '浏览', '离线', '2025-03-01']];
        const tblId = (c.id || 'tbl').replace(/-/g, '_');
        const colGroupHTML = '<col style="width:32px"/>' + cols.map((col: string) => '<col style="width:' + (colWidths[col] || 'auto') + '"/>').join('');
        const thAllChk = '<th style="padding:8px 4px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06)"><input type="checkbox" id="chkAll_' + tblId + '" style="accent-color:#667eea;cursor:pointer" onchange="document.querySelectorAll(\'.rc_' + tblId + '\').forEach(function(c){c.checked=this.checked}.bind(this));updBatch_' + tblId + '()"/></th>';
        const thCols = cols.map((col: string, colIdx: number) => '<th draggable="true" data-ci="' + colIdx + '" ondragstart="dcS_' + tblId + '(event,' + colIdx + ')" ondragover="dcO_' + tblId + '(event,' + colIdx + ')" ondrop="dcD_' + tblId + '(event,' + colIdx + ')" ondragend="dcE_' + tblId + '()" style="text-align:left;padding:8px 12px;color:rgba(255,255,255,0.4);border-bottom:1px solid rgba(255,255,255,0.06);white-space:nowrap;cursor:pointer;user-select:none" onclick="doSort_' + tblId + '(\'' + col + '\')">' + col + ' <span class="si_' + tblId + '" data-col="' + col + '" style="font-size:10px;color:rgba(99,102,241,0.6)"></span></th>').join('');
        const renderCell = (cell: string) => cell === '活跃' ? '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:#34d399"></span>' + cell + '</span>' : cell === '离线' ? '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.2)"></span>' + cell + '</span>' : cell;
        const tbodyHTML = mockRows.map((row, ri) => '<tr class="tr_' + tblId + '" style="border-bottom:1px solid rgba(255,255,255,0.03)"><td style="padding:6px 4px;text-align:center"><input type="checkbox" class="rc_' + tblId + '" onchange="updBatch_' + tblId + '()" style="accent-color:#667eea;cursor:pointer"/></td>' + row.slice(0, cols.length).map((cell: string) => '<td style="padding:6px 12px;color:rgba(255,255,255,0.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + renderCell(cell) + '</td>').join('') + '</tr>').join('');
        const batchBar = '<div id="bb_' + tblId + '" style="display:none;padding:6px 12px;background:rgba(99,102,241,0.06);border-bottom:1px solid rgba(99,102,241,0.1);font-size:11px;color:rgb(129,140,248)"><span id="bc_' + tblId + '">0</span> 行已选 <button onclick="document.querySelectorAll(\'.rc_' + tblId + '\').forEach(function(c){c.checked=false});updBatch_' + tblId + '()" style="margin-left:8px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.04);border:none;color:rgba(255,255,255,0.4);font-size:10px;cursor:pointer">取消</button><button style="margin-left:4px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.04);border:none;color:rgba(255,255,255,0.4);font-size:10px;cursor:pointer">批量删除</button><button style="margin-left:4px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.04);border:none;color:rgba(255,255,255,0.4);font-size:10px;cursor:pointer">导出</button></div>';
        const sortScript = '<script>var ss_' + tblId + '={col:null,dir:"asc"};function doSort_' + tblId + '(col){var s=ss_' + tblId + ';if(s.col===col)s.dir=s.dir==="asc"?"desc":"asc";else{s.col=col;s.dir="asc";}var tb=document.getElementById("tb_' + tblId + '");var rows=Array.from(tb.querySelectorAll("tr"));var ci=' + JSON.stringify(cols) + '.indexOf(col);rows.sort(function(a,b){var va=a.children[ci+1]?a.children[ci+1].textContent:"";var vb=b.children[ci+1]?b.children[ci+1].textContent:"";return s.dir==="asc"?va.localeCompare(vb,"zh-CN"):vb.localeCompare(va,"zh-CN");});rows.forEach(function(r){tb.appendChild(r);});document.querySelectorAll(".si_' + tblId + '").forEach(function(el){el.textContent=el.dataset.col===col?(s.dir==="asc"?"▲":"▼"):"";});}function updBatch_' + tblId + '(){var n=document.querySelectorAll(".rc_' + tblId + ':checked").length;document.getElementById("bb_' + tblId + '").style.display=n>0?"block":"none";document.getElementById("bc_' + tblId + '").textContent=n;document.querySelectorAll(".tr_' + tblId + '").forEach(function(r){var chk=r.querySelector(".rc_' + tblId + '");r.style.background=chk&&chk.checked?"rgba(99,102,241,0.06)":"";});}<\/script>';
        return '<div style="border-radius:8px;border:1px solid rgba(255,255,255,0.06);overflow:hidden">' + batchBar + '<table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed"><colgroup>' + colGroupHTML + '</colgroup><thead><tr style="background:rgba(255,255,255,0.03)">' + thAllChk + thCols + '</tr></thead><tbody id="tb_' + tblId + '">' + tbodyHTML + '</tbody></table></div>' + sortScript; DEAD_PLACEHOLDER_END */
      case 'Progress':
        return `<div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;color:rgba(255,255,255,0.4)">进度</span><span style="font-size:12px;color:rgba(255,255,255,0.5)">${c.props.value}%</span></div><div style="height:8px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden"><div style="height:100%;width:${c.props.value}%;background:#667eea;border-radius:999px"></div></div></div>`;
      case 'Checkbox':
        return `<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,0.6);cursor:pointer"><input type="checkbox" style="accent-color:#667eea" />${c.props.label || '复选项'}</label>`;
      case 'Switch':
        return `<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,0.6);cursor:pointer"><span>${c.props.label || '开关'}</span><div style="width:36px;height:20px;border-radius:999px;background:rgba(255,255,255,0.1);position:relative"><div style="width:16px;height:16px;border-radius:50%;background:#667eea;position:absolute;top:2px;left:2px"></div></div></label>`;
      default:
        return `<div style="padding:8px 12px;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;font-size:12px;color:rgba(255,255,255,0.25)">${c.type}: ${c.props.label || c.type}</div>`;
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f1019;color:#e5e7eb;font-family:Inter,system-ui,sans-serif;padding:16px}
body>*{margin-bottom:12px}
::selection{background:rgba(99,102,241,0.3)}
input:focus,select:focus{border-color:rgba(99,102,241,0.4)!important;box-shadow:0 0 0 2px rgba(99,102,241,0.15)}
</style></head><body>
${compHTML}
</body></html>`;
}

/* ================================================================
   Mock renderers (Chart / Table / Stat / etc.)
   ================================================================ */

function MockChart({ type, title }: { type: string; title?: string }) {
  const t = useThemeTokens();
  const bars = [40, 65, 45, 80, 55, 70, 50, 85, 60, 75];
  const linePoints = bars.map((v, i) => `${i * 28 + 10},${100 - v}`).join(' ');

  // Derive gradient colors from theme accent
  const ac = useAccentColors(t);
  const gradFrom = `rgba(${ac.rawRgb},0.6)`;
  const gradTo = `rgba(${ac.rawRgb},0.3)`;
  const lineColor = `rgb(${ac.rawRgb})`;
  const dotColor = ac.isAurora ? 'rgb(96,239,255)' : ac.isLiquid ? 'rgb(167,139,250)' : 'rgb(129,140,248)';
  const gradId = `lineGrad-${ac.isAurora ? 'a' : ac.isLiquid ? 'l' : 'c'}`;

  return (
    <div className="w-full h-full flex flex-col">
      {title && <span className={`text-[11px] ${t.textSecondary} mb-2`}>{title}</span>}
      <div className="flex-1 flex items-end gap-1.5 px-1 min-h-0">
        {type === 'bar' ? (
          bars.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <div className="rounded-t-sm transition-all hover:opacity-80" style={{ height: `${v}%`, background: `linear-gradient(to top, ${gradFrom}, ${gradTo})` }} />
            </div>
          ))
        ) : (
          <svg className="w-full h-full" viewBox="0 0 280 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={`10,100 ${linePoints} 262,100`} fill={`url(#${gradId})`} />
            <polyline points={linePoints} fill="none" stroke={lineColor} strokeWidth="2" />
            {bars.map((v, i) => (
              <circle key={i} cx={i * 28 + 10} cy={100 - v} r="3" fill={dotColor} />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}

function MockTable({ columns }: { columns: string[] }) {
  const t = useThemeTokens();
  const ac = useAccentColors(t);
  const rows = [
    ['张三', 'zhang@mail.com', '管理', '活跃', '2025-01-15'],
    ['李四', 'li@mail.com', '编辑', '活跃', '2025-02-20'],
    ['王五', 'wang@mail.com', '浏览', '离线', '2025-03-01'],
    ['赵六', 'zhao@mail.com', '编辑', '活跃', '2025-03-05'],
  ];

  const defaultWidthMap: Record<string, number> = {
    '姓名': 70, '邮箱': 160, '角色': 60, '状态': 60, '注册时间': 100,
    'Name': 80, 'Email': 160, 'Role': 70,
  };

  const [colOrder, setColOrder] = useState<string[]>(columns);
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const w: Record<string, number> = {};
    columns.forEach(c => { w[c] = defaultWidthMap[c] || 100; });
    return w;
  });
  const [dragCol, setDragCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const resizeRef = useRef<{ col: string; startX: number; startW: number } | null>(null);

  useEffect(() => {
    setColOrder(columns);
    setColWidths(prev => {
      const next = { ...prev };
      columns.forEach(c => { if (!next[c]) next[c] = defaultWidthMap[c] || 100; });
      return next;
    });
  }, [columns]);

  const handleDragStart = useCallback((col: string) => setDragCol(col), []);
  const handleDragOverCol = useCallback((e: React.DragEvent, col: string) => {
    e.preventDefault();
    if (dragCol && dragCol !== col) setDragOverCol(col);
  }, [dragCol]);
  const handleDrop = useCallback((targetCol: string) => {
    if (!dragCol || dragCol === targetCol) { setDragCol(null); setDragOverCol(null); return; }
    setColOrder(prev => {
      const next = [...prev];
      const from = next.indexOf(dragCol);
      const to = next.indexOf(targetCol);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragCol);
      return next;
    });
    setDragCol(null);
    setDragOverCol(null);
  }, [dragCol]);

  const handleResizeStart = useCallback((e: React.MouseEvent, col: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(col);
    resizeRef.current = { col, startX: e.clientX, startW: colWidths[col] || 100 };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = ev.clientX - resizeRef.current.startX;
      const newW = Math.max(40, resizeRef.current.startW + delta);
      setColWidths(prev => ({ ...prev, [resizeRef.current!.col]: newW }));
    };
    const onUp = () => {
      setResizingCol(null);
      resizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colWidths]);

  const getColIndex = (col: string) => columns.indexOf(col);

  // Sort handler
  const handleSort = useCallback((col: string) => {
    if (sortCol === col) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }, [sortCol]);

  // Toggle row selection
  const toggleRow = useCallback((ri: number) => {
    setSelectedRows(prev => { const n = new Set(prev); if (n.has(ri)) n.delete(ri); else n.add(ri); return n; });
  }, []);
  const toggleAllRows = useCallback(() => {
    setSelectedRows(prev => prev.size === rows.length ? new Set() : new Set(rows.map((_, i) => i)));
  }, [rows.length]);

  // Sorted rows (stable original index tracking)
  const indexedRows = useMemo(() => rows.map((r, i) => ({ r, oi: i })), [rows]);
  const sortedRows = useMemo(() => {
    if (!sortCol) return indexedRows;
    const ci = getColIndex(sortCol);
    if (ci < 0) return indexedRows;
    return [...indexedRows].sort((a, b) => {
      const cmp = (a.r[ci] || '').localeCompare(b.r[ci] || '', 'zh-CN');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [indexedRows, sortCol, sortDir, getColIndex]);

  const allSelected = selectedRows.size === rows.length && rows.length > 0;

  return (
    <div className={`w-full rounded-lg border ${t.panelBorder}`}>
      {/* Batch action bar */}
      {selectedRows.size > 0 && (
        <div className={`flex items-center gap-2 px-3 py-1.5 ${t.accentBg} border-b ${t.accentBorder}`}>
          <span className={`text-[10px] ${t.accent}`}>{selectedRows.size} 行已选</span>
          <button onClick={() => setSelectedRows(new Set())} className={`text-[10px] ${t.textTertiary} hover:text-white/50 transition-colors px-1.5 py-0.5 rounded ${t.inputBg}`}>取消</button>
          <button className={`text-[10px] ${t.textTertiary} hover:text-white/50 transition-colors px-1.5 py-0.5 rounded ${t.inputBg}`}>批量删除</button>
          <button className={`text-[10px] ${t.textTertiary} hover:text-white/50 transition-colors px-1.5 py-0.5 rounded ${t.inputBg}`}>导出</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="text-[11px]" style={{ tableLayout: 'fixed', width: 32 + colOrder.reduce((sum, c) => sum + (colWidths[c] || 100), 0) }}>
          <colgroup>
            <col style={{ width: 32 }} />
            {colOrder.map(col => (<col key={col} style={{ width: colWidths[col] || 100 }} />))}
          </colgroup>
          <thead>
            <tr className={t.inputBg}>
              <th className={`px-2 py-2 border-b ${t.sectionBorder} text-center`}>
                <input type="checkbox" checked={allSelected} onChange={toggleAllRows} className="w-3 h-3 rounded cursor-pointer" style={{ accentColor: ac.checkbox }} />
              </th>
              {colOrder.map(col => (
                <th
                  key={col}
                  draggable
                  onDragStart={() => handleDragStart(col)}
                  onDragOver={(e) => handleDragOverCol(e, col)}
                  onDragEnd={() => { setDragCol(null); setDragOverCol(null); }}
                  onDrop={() => handleDrop(col)}
                  className={`text-left px-3 py-2 ${t.textTertiary} border-b ${t.sectionBorder} whitespace-nowrap overflow-hidden text-ellipsis relative select-none cursor-grab active:cursor-grabbing transition-colors ${
                    dragOverCol === col ? `${t.accentBg} opacity-60` : ''
                  } ${dragCol === col ? 'opacity-40' : ''}`}
                >
                  <span className={`inline-flex items-center gap-1 cursor-pointer hover:text-white/60 transition-colors`} onClick={(e) => { e.stopPropagation(); handleSort(col); }}>
                    {col}
                    {sortCol === col && (
                      <ArrowUpDown className={`w-3 h-3 ${t.accent} transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </span>
                  <div
                    className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:opacity-60 transition-colors ${resizingCol === col ? `${t.accentBg}` : ''}`}
                    onMouseDown={(e) => handleResizeStart(e, col)}
                    style={{ backgroundColor: resizingCol === col ? undefined : 'transparent' }}
                  />
                  {dragOverCol === col && dragCol !== col && (
                    <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${t.btnPrimary}`} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map(({ r: row, oi }, ri) => {
              const isRowSelected = selectedRows.has(oi);
              return (
                <tr key={ri} className={`transition-colors ${isRowSelected ? t.accentBg : 'hover:bg-white/[0.02]'}`}>
                  <td className="px-2 py-1.5 border-b border-white/[0.04] text-center">
                    <input type="checkbox" checked={isRowSelected} onChange={() => toggleRow(oi)} className="w-3 h-3 rounded cursor-pointer" style={{ accentColor: ac.checkbox }} />
                  </td>
                  {colOrder.map((col) => {
                    const ci = getColIndex(col);
                    const cell = ci >= 0 && ci < row.length ? row[ci] : '';
                    return (
                      <td key={col} className={`px-3 py-1.5 ${t.textSecondary} border-b border-white/[0.04] whitespace-nowrap overflow-hidden text-ellipsis`}>
                        {cell === '活跃' ? (
                          <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{cell}</span>
                        ) : cell === '离��' ? (
                          <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white/20" />{cell}</span>
                        ) : cell}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MockStat({ title, value, change }: { title: string; value: string; change: string }) {
  const t = useThemeTokens();
  const ac = useAccentColors(t);
  const isPositive = change.startsWith('+');

  const miniBarFrom = `rgba(${ac.rawRgb},0.2)`;
  const miniBarTo = `rgba(${ac.rawRgb},0.1)`;

  return (
    <div className={`p-3 rounded-xl ${t.aiBubbleBg} border ${t.panelBorder} hover:border-white/[0.1] transition-all`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px -2px rgba(0,0,0,0.3)' }}
    >
      <span className={`text-[11px] ${t.textTertiary}`}>{title}</span>
      <div className="flex items-end gap-2 mt-1">
        <span className={`text-[20px] ${t.textPrimary} tracking-tight`}>{value}</span>
        <span className={`text-[11px] mb-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{change}</span>
      </div>
      <div className="mt-2 h-6 flex items-end gap-0.5">
        {[30, 45, 35, 60, 50, 70, 55, 80, 65, 75, 85, 90].map((v, i) => (
          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${v}%`, background: `linear-gradient(to top, ${miniBarFrom}, ${miniBarTo})` }} />
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   ComponentRenderer
   ================================================================ */

/* Icon map for collapsed mode */
const COMP_ICON_MAP: Record<string, React.ElementType> = {
  Stat: TrendingUp,
  Chart: ChartBar,
  Table: Table,
  Button: RectangleHorizontal,
  Input: TextCursorInput,
  Select: List,
  Text: FileText,
  Progress: Play,
  Checkbox: Square,
  Switch: Square,
};

function ComponentRenderer({ comp }: { comp: { id: string; type: string; props: Record<string, any>; groupId?: string } }) {
  const { selectComponent, selectedComponentId, toggleSelectComponent, selectedComponentIds, components } = useDesigner();
  const t = useThemeTokens();
  const isSelected = selectedComponentId === comp.id;
  const isMultiSelected = selectedComponentIds.includes(comp.id);
  const groupMembers = comp.groupId ? components.filter(c => c.groupId === comp.groupId) : [];
  const isGrouped = !!comp.groupId;

  // Auto-collapse: detect when container is too narrow for full content
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsCompact(entry.contentRect.width < 120);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      toggleSelectComponent(comp.id);
    } else {
      selectComponent(comp.id);
    }
  };

  const renderContent = () => {
    // Compact mode: only show icon + type name
    if (isCompact) {
      const IconComp = COMP_ICON_MAP[comp.type] || Code;
      return (
        <div className="flex items-center justify-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]" title={comp.props.label || comp.props.title || comp.type}>
          <IconComp className="w-4 h-4 text-white/30" />
        </div>
      );
    }

    switch (comp.type) {
      case 'Stat': return <MockStat title={comp.props.title} value={comp.props.value} change={comp.props.change} />;
      case 'Chart': return <MockChart type={comp.props.chartType} title={comp.props.title} />;
      case 'Table': return <MockTable columns={comp.props.columns || ['Name', 'Email', 'Role']} />;
      case 'Button':
        return <button className={`px-4 py-2 rounded-lg ${t.btnPrimary} text-white text-[12px] ${t.btnPrimaryHover} transition-colors`}>{comp.props.label}</button>;
      case 'Input':
        return (
          <div className="w-full">
            {comp.props.label && <label className={`text-[11px] ${t.textTertiary} mb-1 block`}>{comp.props.label}</label>}
            <input className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-lg px-3 py-2 text-[12px] ${t.inputText} placeholder:text-white/20 ${t.inputFocusBorder}`} placeholder={comp.props.placeholder} type={comp.props.type} />
          </div>
        );
      case 'Select':
        return (
          <div className={`w-full flex items-center gap-2 px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-lg text-[12px] ${t.textTertiary}`}>
            {comp.props.placeholder}
            <ChevronDown className="w-3 h-3 ml-auto" />
          </div>
        );
      case 'Text': return <p className={`text-[13px] ${t.textSecondary}`}>{comp.props.content}</p>;
      case 'Progress':
        return (
          <div className="w-full">
            <div className="flex justify-between mb-1">
              <span className={`text-[11px] ${t.textTertiary}`}>进度</span>
              <span className={`text-[11px] ${t.textSecondary}`}>{comp.props.value}%</span>
            </div>
            <div className={`h-2 ${t.inputBg} rounded-full overflow-hidden`}>
              <div className={`h-full ${t.btnPrimary} rounded-full`} style={{ width: `${comp.props.value}%` }} />
            </div>
          </div>
        );
      default:
        return (
          <div className={`flex items-center gap-2 px-3 py-2 ${t.aiBubbleBg} rounded-lg border border-dashed ${t.inputBorder} text-[12px] ${t.textTertiary}`}>
            <Code className="w-3.5 h-3.5" />
            {comp.type}: {comp.props.label || comp.type}
          </div>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      data-comp-id={comp.id}
      className={`relative group ${
        isSelected ? `ring-1 ${t.accentBorder} rounded-lg` :
        isMultiSelected ? 'ring-1 ring-cyan-500/40 rounded-lg' :
        ''
      }`}
    >
      {/* Selection / group indicators */}
      {isSelected && (
        <div className="absolute -top-5 left-0 flex items-center gap-1 z-10">
          <span className={`text-[9px] ${t.btnPrimary} text-white px-1.5 py-0.5 rounded`}>{comp.type}</span>
          {isGrouped && (
            <span className="text-[9px] bg-cyan-500/80 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Group className="w-2.5 h-2.5" />
              {groupMembers.length}
            </span>
          )}
        </div>
      )}
      {isMultiSelected && !isSelected && (
        <div className="absolute -top-5 left-0 flex items-center gap-1 z-10">
          <span className="text-[9px] bg-cyan-500/80 text-white px-1.5 py-0.5 rounded">Shift 多选</span>
        </div>
      )}
      {/* Group border */}
      {isGrouped && (
        <div className="absolute -inset-1 rounded-lg border border-dashed border-cyan-500/20 pointer-events-none" />
      )}
      {renderContent()}
      {!isSelected && !isMultiSelected && (
        <div className={`absolute inset-0 rounded-lg border border-transparent group-hover:${t.accentBorder} transition-colors pointer-events-none`} />
      )}
    </div>
  );
}

/* ================================================================
   Context Menu — reusable floating menu
   ================================================================ */

interface ContextMenuPos { x: number; y: number }

function ContextMenu({ pos, children, onClose }: { pos: ContextMenuPos; children: React.ReactNode; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useThemeTokens();

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className={`fixed z-[100] min-w-[180px] ${t.ctxBg} border ${t.ctxBorder} rounded-xl py-1.5 text-[11px] select-none`}
      style={{
        left: pos.x,
        top: pos.y,
        boxShadow: t.ctxShadow,
      }}
    >
      {children}
    </div>
  );
}

function CtxItem({ icon: Icon, label, shortcut, onClick, danger, disabled }: {
  icon?: React.ElementType; label: string; shortcut?: string; onClick: () => void; danger?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 transition-colors ${
        danger
          ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06]'
          : disabled
          ? 'text-white/15 cursor-not-allowed'
          : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">{shortcut}</span>}
    </button>
  );
}

function CtxSeparator() {
  return <div className="border-t border-white/[0.06] my-1" />;
}

function CtxSubmenu({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const t = useThemeTokens();
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div className="w-full flex items-center gap-2.5 px-3 py-1.5 text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors cursor-default">
        <Icon className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown className="w-3 h-3 -rotate-90" />
      </div>
      {open && (
        <div
          className={`absolute left-full top-0 ml-1 min-w-[160px] ${t.ctxBg} border ${t.ctxBorder} rounded-xl py-1.5 text-[11px]`}
          style={{ boxShadow: t.ctxShadow }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   New Panel Template Dialog
   ================================================================ */

const PANEL_TEMPLATES: { type: PanelType['type']; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { type: 'blank', label: '空白面板', icon: LayoutGrid, desc: '空白容器，自由放置任意组件', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { type: 'form', label: '表单面板', icon: FormInput, desc: '预置输入框、选择器、提交按钮', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { type: 'table', label: '表格面板', icon: Table, desc: '预置数据表格 + 操作按钮', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { type: 'chart', label: '图表面板', icon: ChartBar, desc: '预置图表组件 + 统计卡片', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { type: 'custom', label: '自定义 HTML', icon: FileCode2, desc: '���入自定义 HTML/Markdown', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
];

function NewPanelDialog({ pos, onClose, onSelect }: {
  pos: ContextMenuPos;
  onClose: () => void;
  onSelect: (type: PanelType['type']) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useThemeTokens();

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`fixed z-[100] w-[280px] ${t.ctxBg} border ${t.ctxBorder} rounded-xl overflow-hidden select-none`}
      style={{
        left: pos.x,
        top: pos.y,
        boxShadow: t.ctxShadow,
      }}
    >
      <div className="px-3 py-2.5 border-b border-white/[0.06]">
        <div className="text-[11px] text-white/60">选择面板模板</div>
        <div className="text-[9px] text-white/20 mt-0.5">右键画布空白处打开此菜单</div>
      </div>
      <div className="p-2 space-y-1">
        {PANEL_TEMPLATES.map(t => (
          <button
            key={t.type}
            onClick={() => { onSelect(t.type); onClose(); }}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] transition-all group text-left"
          >
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${t.color}`}>
              <t.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-white/70 group-hover:text-white/90 transition-colors">{t.label}</div>
              <div className="text-[9px] text-white/25 truncate">{t.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   PanelCard — individual panel with context menu
   ================================================================ */

function PanelCard({ panel }: { panel: PanelType }) {
  const {
    components, selectPanel, selectedPanelId, addComponentToPanel,
    splitPanel, splitPanelN, removePanel, duplicatePanel,
    enterSubCanvas, mergePanels, panels,
    crdtPeers, currentUserIdentity, unlockPanel
  } = useDesigner();
  const t = useThemeTokens();
  const ac = useAccentColors(t);
  const isSelected = selectedPanelId === panel.id;
  const panelComponents = components.filter(c => c.panelId === panel.id);

  // Phase 12 — Locked-by indicator
  const lockedByPeer = panel.lockedBy
    ? crdtPeers.find(p => p.id === panel.lockedBy)
    : null;
  const isLockedByMe = panel.lockedBy === currentUserIdentity?.userId;
  const isLockedByOther = panel.lockedBy && !isLockedByMe;
  // Peers currently viewing this panel (cursor awareness)
  const peersOnPanel = crdtPeers.filter(p =>
    p.cursor?.panelId === panel.id && p.id !== currentUserIdentity?.userId
  );
  const [ctxMenu, setCtxMenu] = useState<ContextMenuPos | null>(null);
  const [mergeTarget, setMergeTarget] = useState(false);

  const [{ isOver }, dropRef] = useDrop({
    accept: ['COMPONENT', 'PANEL_MERGE'],
    drop: (item: any) => {
      if (item.type === 'PANEL_MERGE' && item.panelId !== panel.id) {
        mergePanels(item.panelId, panel.id);
      } else if (item.componentDef) {
        addComponentToPanel(panel.id, item.componentDef);
      }
    },
    hover: (item: any) => {
      if (item.type === 'PANEL_MERGE' && item.panelId !== panel.id) {
        setMergeTarget(true);
      }
    },
    collect: (m) => ({ isOver: m.isOver() }),
  });

  useEffect(() => {
    if (!isOver) setMergeTarget(false);
  }, [isOver]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectPanel(panel.id);
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, [panel.id, selectPanel]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    enterSubCanvas(panel.id);
  }, [panel.id, enterSubCanvas]);

  const otherPanels = panels.filter(p => p.id !== panel.id);

  return (
    <div
      ref={dropRef as any}
      onClick={(e) => { e.stopPropagation(); selectPanel(panel.id); }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      className={`h-full flex flex-col rounded-xl border transition-all relative group ${t.scrollClass} ${ac.isAurora ? 'aurora-light-bleed' : ''} ${
        mergeTarget
          ? 'border-emerald-500/50 bg-emerald-500/[0.05] ring-2 ring-emerald-500/30'
          : isSelected
          ? `${t.accentBorder}`
          : `${t.panelBorder} hover:border-white/[0.1]`
      } ${isOver && !mergeTarget ? `ring-2 ${t.accentBorder}` : ''}`}
      style={{
        backgroundColor: mergeTarget ? undefined : isSelected ? t.canvasCardSelectedBg : t.canvasCardBg,
        boxShadow: mergeTarget
          ? '0 0 0 2px rgba(16,185,129,0.2), 0 0 40px -10px rgba(16,185,129,0.2)'
          : isSelected
          ? ac.selectedShadow
          : '0 2px 12px -4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Merge indicator overlay */}
      {mergeTarget && (
        <div className="absolute inset-0 z-10 rounded-xl flex items-center justify-center bg-emerald-500/[0.08] pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <Merge className="w-4 h-4 text-emerald-400" />
            <span className="text-[12px] text-emerald-400">释放以合并到此面板</span>
          </div>
        </div>
      )}
      {/* Panel header */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${t.sectionBorder} shrink-0`}>
        <GripHorizontal className={`w-3.5 h-3.5 cursor-grab active:cursor-grabbing ${isLockedByOther ? 'text-white/8' : 'text-white/15'}`} />
        <span className="text-[11px] text-white/60 flex-1 truncate">{panel.name}</span>

        {/* Phase 12 — Peer avatars on this panel */}
        {peersOnPanel.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {peersOnPanel.slice(0, 4).map(peer => (
              <div
                key={peer.id}
                className="w-4 h-4 rounded-full border border-[#0d0e14] flex items-center justify-center text-[7px] text-white/90 shrink-0"
                style={{ backgroundColor: peer.color }}
                title={`${peer.name}${peer.role ? ` (${peer.role})` : ''}`}
              >
                {peer.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {peersOnPanel.length > 4 && (
              <div className="w-4 h-4 rounded-full bg-white/10 border border-[#0d0e14] flex items-center justify-center text-[7px] text-white/40 shrink-0">
                +{peersOnPanel.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Phase 12 — Lock indicator */}
        {isLockedByOther && lockedByPeer && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
            title={`${lockedByPeer.name} 正在编辑此面板`}
          >
            <Lock className="w-2.5 h-2.5 text-amber-400/70" />
            <div className="w-3 h-3 rounded-full text-[6px] flex items-center justify-center text-white/80 shrink-0" style={{ backgroundColor: lockedByPeer.color }}>
              {lockedByPeer.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        {isLockedByMe && (
          <button
            onClick={(e) => { e.stopPropagation(); unlockPanel(panel.id); }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            title="取消锁定（你正在编辑）"
          >
            <Unlock className="w-2.5 h-2.5 text-emerald-400/70" />
            <span className="text-[8px] text-emerald-400/60">我</span>
          </button>
        )}

        <span className="text-[9px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded">{panel.type}</span>
        <span className="text-[9px] text-white/10">{panelComponents.length}个</span>
        {/* createdBy timestamp badge */}
        {panel.createdBy && (
          <span className="text-[7px] text-white/8 hidden group-hover:inline" title={`创建者: ${panel.createdBy}`}>
            by:{panel.createdBy.slice(0, 6)}
          </span>
        )}
      </div>

      {/* Locked overlay — prevent interaction when locked by another user */}
      {isLockedByOther && lockedByPeer && (
        <div
          className="absolute inset-0 z-20 rounded-xl pointer-events-auto cursor-not-allowed flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: `linear-gradient(135deg, ${lockedByPeer.color}08, ${lockedByPeer.color}04, transparent)`,
            backdropFilter: 'blur(1px)',
            border: `1px solid ${lockedByPeer.color}25`,
          }}
        >
          {/* Animated scanning line */}
          <div
            className="absolute inset-x-0 h-px opacity-40 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${lockedByPeer.color}, transparent)`,
              animation: 'lockScanLine 3s ease-in-out infinite',
              top: '30%',
            }}
          />
          {/* Central lock indicator */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] ring-2 ring-offset-2 ring-offset-[#0d0e14]"
                style={{
                  backgroundColor: lockedByPeer.color,
                  boxShadow: `0 0 20px ${lockedByPeer.color}40, 0 0 40px ${lockedByPeer.color}15`,
                }}
              >
                {lockedByPeer.name.charAt(0).toUpperCase()}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0d0e14]"
                style={{ backgroundColor: lockedByPeer.color }}
              >
                <Lock className="w-2.5 h-2.5 text-white" />
              </div>
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: lockedByPeer.color, opacity: 0.12, animationDuration: '2s' }}
              />
            </div>
            <div
              className="px-3 py-1.5 rounded-lg backdrop-blur-sm border text-center"
              style={{ backgroundColor: `${lockedByPeer.color}12`, borderColor: `${lockedByPeer.color}25` }}
            >
              <div className="flex items-center gap-1.5 justify-center">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: lockedByPeer.color }} />
                <span className="text-[11px]" style={{ color: lockedByPeer.color }}>{lockedByPeer.name}</span>
              </div>
              <div className="text-[9px] text-white/25 mt-0.5">正在编辑此面板</div>
            </div>
          </div>
          {/* Corner color indicators */}
          <div className="absolute top-0 left-0 w-8 h-8 rounded-tl-xl pointer-events-none" style={{ background: `linear-gradient(135deg, ${lockedByPeer.color}15, transparent)` }} />
          <div className="absolute top-0 right-0 w-8 h-8 rounded-tr-xl pointer-events-none" style={{ background: `linear-gradient(225deg, ${lockedByPeer.color}15, transparent)` }} />
          <div className="absolute bottom-0 left-0 w-8 h-8 rounded-bl-xl pointer-events-none" style={{ background: `linear-gradient(45deg, ${lockedByPeer.color}15, transparent)` }} />
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-br-xl pointer-events-none" style={{ background: `linear-gradient(315deg, ${lockedByPeer.color}15, transparent)` }} />
          <style>{`@keyframes lockScanLine { 0%,100% { top:20%; opacity:0 } 50% { top:80%; opacity:.4 } }`}</style>
        </div>
      )}

      {/* Panel content */}
      <div className="flex-1 p-3 overflow-auto space-y-2.5 min-h-0">
        {panelComponents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-white/15">
            <Plus className="w-8 h-8" />
            <span className="text-[11px]">拖拽组件到此面板</span>
            <span className="text-[9px] text-white/10">双击进入子画布 · 右键更多选项</span>
          </div>
        ) : (
          panelComponents.map(comp => (
            <ComponentRenderer key={comp.id} comp={comp} />
          ))
        )}
        {isOver && !mergeTarget && (
          <div className={`border-2 border-dashed ${t.accentBorder} rounded-lg p-4 flex items-center justify-center`}>
            <span className={`text-[12px] ${t.accent} opacity-60`}>释放以添加组件</span>
          </div>
        )}
      </div>

      {/* Panel right-click context menu */}
      {ctxMenu && (
        <ContextMenu pos={ctxMenu} onClose={() => setCtxMenu(null)}>
          <div className="px-3 py-1.5 text-[9px] text-white/20 uppercase tracking-wider">
            {panel.name}
          </div>
          <CtxSeparator />
          <CtxItem icon={Maximize2} label="进入子画布" shortcut="双击" onClick={() => { enterSubCanvas(panel.id); setCtxMenu(null); }} />
          <CtxSeparator />
          <CtxSubmenu icon={Scissors} label="拆分面板">
            <CtxItem icon={Columns} label="水平 2 等分" onClick={() => { splitPanel(panel.id, 'horizontal'); setCtxMenu(null); }} />
            <CtxItem icon={Columns} label="水平 3 等分" onClick={() => { splitPanelN(panel.id, 'horizontal', 2); setCtxMenu(null); }} />
            <CtxItem icon={Columns} label="水平 4 等分" onClick={() => { splitPanelN(panel.id, 'horizontal', 3); setCtxMenu(null); }} />
            <CtxSeparator />
            <CtxItem icon={Rows} label="垂直 2 等分" onClick={() => { splitPanel(panel.id, 'vertical'); setCtxMenu(null); }} />
            <CtxItem icon={Rows} label="垂直 3 等分" onClick={() => { splitPanelN(panel.id, 'vertical', 2); setCtxMenu(null); }} />
            <CtxItem icon={Rows} label="垂直 4 等分" onClick={() => { splitPanelN(panel.id, 'vertical', 3); setCtxMenu(null); }} />
          </CtxSubmenu>
          {otherPanels.length > 0 && (
            <CtxSubmenu icon={Merge} label="合并到...">
              {otherPanels.map(p => (
                <CtxItem key={p.id} label={p.name} onClick={() => { mergePanels(panel.id, p.id); setCtxMenu(null); }} />
              ))}
            </CtxSubmenu>
          )}
          <CtxSeparator />
          <CtxItem icon={Copy} label="复制面板" shortcut="⌘D" onClick={() => { duplicatePanel(panel.id); setCtxMenu(null); }} />
          <CtxItem icon={Eye} label="预览面板" onClick={() => setCtxMenu(null)} />
          <CtxSeparator />
          <CtxItem icon={X} label="删除面板" onClick={() => { removePanel(panel.id); setCtxMenu(null); }} danger />
        </ContextMenu>
      )}
    </div>
  );
}

/* ================================================================
   CRDT Peer Cursors — real-time remote cursor overlay
   ================================================================ */

interface PeerCursorState {
  peerId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  active: boolean;
}

function PeerCursorsOverlay() {
  const { crdtPeers } = useDesigner();
  const [cursors, setCursors] = useState<PeerCursorState[]>([]);

  // Initialize and animate peer cursors
  useEffect(() => {
    if (crdtPeers.length === 0) return;
    // Initialize random positions within canvas bounds
    const initial: PeerCursorState[] = crdtPeers.map((peer, i) => ({
      peerId: peer.id || `peer-${i}`,
      name: peer.name,
      color: peer.color || '#f43f5e',
      x: 120 + Math.random() * 500,
      y: 80 + Math.random() * 300,
      active: true,
    }));
    setCursors(initial);

    // Simulate smooth cursor movement
    const interval = setInterval(() => {
      setCursors(prev => prev.map(c => {
        if (!c.active) return c;
        const dx = (Math.random() - 0.5) * 40;
        const dy = (Math.random() - 0.5) * 30;
        return {
          ...c,
          x: Math.max(20, Math.min(800, c.x + dx)),
          y: Math.max(20, Math.min(500, c.y + dy)),
        };
      }));
    }, 2000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, [crdtPeers]);

  if (cursors.length === 0) return null;

  return (
    <>
      {cursors.filter(c => c.active).map(cursor => (
        <div
          key={cursor.peerId}
          className="absolute z-40 pointer-events-none"
          style={{
            left: cursor.x,
            top: cursor.y,
            transition: 'left 1.5s cubic-bezier(0.16,1,0.3,1), top 1.5s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Cursor arrow SVG */}
          <svg
            width="16"
            height="20"
            viewBox="0 0 16 20"
            fill="none"
            className="drop-shadow-lg"
            style={{ filter: `drop-shadow(0 2px 4px ${cursor.color}40)` }}
          >
            <path
              d="M1 1L1 15L5.5 11.5L9 19L12 17.5L8.5 10L14 10L1 1Z"
              fill={cursor.color}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="0.8"
            />
          </svg>
          {/* Name bubble */}
          <div
            className="absolute left-4 top-4 px-2 py-0.5 rounded-md text-[9px] text-white whitespace-nowrap"
            style={{
              backgroundColor: cursor.color,
              boxShadow: `0 2px 8px ${cursor.color}40, 0 0 20px ${cursor.color}15`,
            }}
          >
            {cursor.name}
          </div>
          {/* Subtle glow ring */}
          <div
            className="absolute -inset-3 rounded-full animate-ping"
            style={{
              backgroundColor: cursor.color,
              opacity: 0.06,
              animationDuration: '3s',
            }}
          />
        </div>
      ))}
    </>
  );
}

/* ================================================================
   PanelCanvas — main work area
   ================================================================ */

export function PanelCanvas() {
  const {
    panels, selectPanel, selectComponent, addPanel, viewMode,
    toggleAI, setViewMode, toggleCodePreview,
    selectedPanelId, selectedComponentId,
    duplicatePanel, duplicateComponent,
    subCanvasPanelId, exitSubCanvas, enterSubCanvas,
    movePanelPixel, batchUpdatePanelLayouts, snapEnabled, toggleSnap,
    groupComponents, ungroupComponent, selectedComponentIds, components,
    undo, redo, toggleSelectComponent, clearComponentSelection
  } = useDesigner();
  const t = useThemeTokens();
  const ac = useAccentColors(t);
  const layoutAnalysis = useLayoutConstraints(panels);

  const [canvasCtx, setCanvasCtx] = useState<ContextMenuPos | null>(null);
  const [templateDialog, setTemplateDialog] = useState<ContextMenuPos | null>(null);
  const [rubberBand, setRubberBand] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  /* ---- Canvas right-click → context menu ---- */
  const handleCanvasContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCanvasCtx({ x: e.clientX, y: e.clientY });
  }, []);

  const handleAddPanelFromTemplate = useCallback((type: PanelType['type']) => {
    const templates: Record<PanelType['type'], Omit<PanelType, 'id'>> = {
      blank:  { name: `空白面板 ${panels.length + 1}`, type: 'blank',  x: 0, y: 0, w: 6, h: 6, children: [] },
      form:   { name: `表单面板 ${panels.length + 1}`, type: 'form',   x: 0, y: 0, w: 4, h: 6, children: [] },
      table:  { name: `表格面板 ${panels.length + 1}`, type: 'table',  x: 0, y: 0, w: 6, h: 8, children: [] },
      chart:  { name: `图表面板 ${panels.length + 1}`, type: 'chart',  x: 0, y: 0, w: 6, h: 6, children: [] },
      custom: { name: `自定义面板 ${panels.length + 1}`, type: 'custom', x: 0, y: 0, w: 6, h: 6, children: [] },
    };
    addPanel(templates[type]);
  }, [addPanel, panels.length]);

  /* ---- Global keyboard shortcuts ---- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // F1 → Toggle AI
      if (e.key === 'F1') { e.preventDefault(); toggleAI(); return; }

      // ⌘S → Save (prevent default)
      if (isMod && e.key === 's') { e.preventDefault(); /* save logic — show toast */ return; }

      // ⌘Z → Undo / ⌘⇧Z → Redo
      if (isMod && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      // ⌘P → Preview toggle
      if (isMod && e.key === 'p') { e.preventDefault(); setViewMode(viewMode === 'preview' ? 'design' : 'preview'); return; }

      // ⌘E → Code preview
      if (isMod && e.key === 'e') { e.preventDefault(); toggleCodePreview(); return; }

      // ⌘D → Duplicate
      if (isMod && e.key === 'd') {
        e.preventDefault();
        if (selectedComponentId) duplicateComponent(selectedComponentId);
        else if (selectedPanelId) duplicatePanel(selectedPanelId);
        return;
      }

      // ⌘G → Group/Ungroup
      if (isMod && e.key === 'g') {
        e.preventDefault();
        if (selectedComponentId) {
          const comp = components.find(c => c.id === selectedComponentId);
          if (comp?.groupId) {
            ungroupComponent(comp.groupId);
          } else if (selectedComponentIds.length >= 2) {
            groupComponents();
          }
        }
        return;
      }

      // Alt + Arrow → pixel move (5px step)
      if (e.altKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (selectedPanelId) {
          const step = e.shiftKey ? 1 : 5;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
          movePanelPixel(selectedPanelId, dx, dy);
        }
        return;
      }

      // Escape → exit sub-canvas
      if (e.key === 'Escape' && subCanvasPanelId) {
        exitSubCanvas();
        return;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleAI, setViewMode, toggleCodePreview, viewMode, selectedPanelId, selectedComponentId, duplicatePanel, duplicateComponent, movePanelPixel, subCanvasPanelId, exitSubCanvas, groupComponents, ungroupComponent, selectedComponentIds, components, undo, redo]);

  if (viewMode === 'preview') return <PreviewMode />;

  // ── Sub-canvas mode ──
  if (subCanvasPanelId) {
    return <SubCanvasMode />;
  }

  return (
    <div
      className={`flex-1 overflow-auto p-4 min-h-0 relative ${t.scrollClass}`}
      style={{ backgroundColor: t.canvasBg }}
      onClick={() => { selectPanel(null); selectComponent(null); }}
      onContextMenu={handleCanvasContext}
      ref={canvasRef}
      onMouseDown={e => {
        // Only start rubber band when clicking on the canvas background directly
        if (e.button === 0 && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.target === e.currentTarget) {
          setRubberBand({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });
        }
      }}
      onMouseMove={e => {
        if (rubberBand) {
          setRubberBand(prev => prev ? { ...prev, endX: e.clientX, endY: e.clientY } : null);
        }
      }}
      onMouseUp={() => {
        if (rubberBand) {
          const { startX, startY, endX, endY } = rubberBand;
          const dx = Math.abs(endX - startX);
          const dy = Math.abs(endY - startY);
          // Only consider it a rubber-band if dragged at least 20px
          if (dx > 20 || dy > 20) {
            const selRect = {
              left: Math.min(startX, endX),
              top: Math.min(startY, endY),
              right: Math.max(startX, endX),
              bottom: Math.max(startY, endY),
            };
            // Find all rendered component DOM elements by data attribute
            const compEls = canvasRef.current?.querySelectorAll('[data-comp-id]');
            const hitIds: string[] = [];
            compEls?.forEach(el => {
              const r = el.getBoundingClientRect();
              const intersects = !(selRect.right < r.left || selRect.left > r.right || selRect.bottom < r.top || selRect.top > r.bottom);
              if (intersects) {
                const cid = el.getAttribute('data-comp-id');
                if (cid) hitIds.push(cid);
              }
            });
            if (hitIds.length > 0) {
              clearComponentSelection();
              hitIds.forEach(id => toggleSelectComponent(id));
            }
          }
          setRubberBand(null);
        }
      }}
    >
      {/* Multi-select floating action bar */}
      {selectedComponentIds.length >= 2 && (
        <div className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl ${t.ctxBg} border border-cyan-500/20`}
          style={{ boxShadow: ac.multiSelectShadow }}
        >
          <div className="flex items-center gap-1.5 pr-3 border-r border-white/[0.08]">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] text-cyan-400">{selectedComponentIds.length} 个组件已选中</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); groupComponents(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 text-[11px] hover:bg-cyan-500/25 transition-all"
          >
            <Group className="w-3.5 h-3.5" />
            分组 (⌘G)
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/30 text-[11px] hover:text-white/50 hover:bg-white/[0.06] transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            复制
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); selectComponent(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/30 text-[11px] hover:text-white/50 hover:bg-white/[0.06] transition-all"
          >
            <X className="w-3.5 h-3.5" />
            取消
          </button>
        </div>
      )}

      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: t.canvasGlow1 }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: t.canvasGlow2 }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[150px] pointer-events-none" style={{ backgroundColor: t.canvasGlow1, opacity: 0.5 }} />

      {/* CRDT Peer Cursors */}
      <PeerCursorsOverlay />

      {/* Layout Constraint Warnings */}
      {!layoutAnalysis.isValid && (
        <div className="absolute top-3 right-3 z-40 w-[240px] space-y-1.5">
          {layoutAnalysis.collisions.map((c, i) => (
            <div
              key={`col-${i}`}
              className={`flex items-start gap-2 px-3 py-2 rounded-lg backdrop-blur-sm border transition-all ${
                c.severity === 'error'
                  ? 'bg-red-500/[0.08] border-red-500/20 text-red-400/80'
                  : 'bg-amber-500/[0.08] border-amber-500/20 text-amber-400/80'
              }`}
              style={{ boxShadow: '0 4px 16px -4px rgba(0,0,0,0.4)' }}
            >
              <ArrowUpDown className={`w-3 h-3 shrink-0 mt-0.5 ${c.severity === 'error' ? 'text-red-400/70' : 'text-amber-400/70'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] truncate">{c.message}</div>
                <div className="text-[8px] text-white/20 mt-0.5">碰撞面积: {c.overlapArea} 格</div>
              </div>
            </div>
          ))}
          {layoutAnalysis.violations.map((v, i) => (
            <div
              key={`vio-${i}`}
              className="flex items-start gap-2 px-3 py-2 rounded-lg backdrop-blur-sm bg-amber-500/[0.06] border border-amber-500/15 text-amber-400/70"
              style={{ boxShadow: '0 4px 16px -4px rgba(0,0,0,0.4)' }}
            >
              <Magnet className="w-3 h-3 shrink-0 mt-0.5 text-amber-400/60" />
              <span className="text-[10px]">{v.message}</span>
            </div>
          ))}
          {layoutAnalysis.suggestedLayout && (
            <button
              onClick={() => {
                if (!layoutAnalysis.suggestedLayout) return;
                // Batch update with undo support
                batchUpdatePanelLayouts(
                  layoutAnalysis.suggestedLayout.map(s => ({
                    id: s.id, x: s.x, y: s.y, w: s.w, h: s.h,
                  }))
                );
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/20 text-indigo-400/80 text-[10px] hover:bg-indigo-500/[0.15] transition-all"
              style={{ boxShadow: '0 4px 16px -4px rgba(0,0,0,0.4)' }}
            >
              <LayoutGrid className="w-3 h-3" />
              自动重排消除碰撞
            </button>
          )}
        </div>
      )}

      {/* Grid background */}
      <div className="relative min-h-full" style={{
        backgroundImage: `radial-gradient(circle, ${t.canvasGridDot} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}>
        {/* Column guides (subtle 12-col overlay) */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-12 gap-1 opacity-0 hover:opacity-100 transition-opacity duration-700">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-full" style={{ borderLeft: `1px solid ${t.canvasGuideColor}`, borderRight: `1px solid ${t.canvasGuideColor}` }} />
          ))}
        </div>

        {/* Panel grid */}
        <div className="grid grid-cols-2 gap-4 auto-rows-[280px]">
          {panels.map(panel => (
            <PanelCard key={panel.id} panel={panel} />
          ))}
          {/* Add panel button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTemplateDialog({ x: e.clientX - 140, y: e.clientY - 200 });
            }}
            className={`h-full min-h-[200px] rounded-xl border-2 border-dashed border-white/[0.06] hover:${t.accentBorder} flex flex-col items-center justify-center gap-2 text-white/15 transition-all group`}
            style={{ ['--hover-accent' as any]: ac.raw }}
          >
            <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-[12px]">新增面板</span>
            <span className={`text-[9px] text-white/10 group-hover:text-white/20`}>点击选择模板 · 右键更多选项</span>
          </button>
        </div>
      </div>

      {/* Canvas context menu */}
      {canvasCtx && (
        <ContextMenu pos={canvasCtx} onClose={() => setCanvasCtx(null)}>
          <CtxItem icon={Plus} label="新增面板..." onClick={() => {
            setCanvasCtx(null);
            setTemplateDialog(canvasCtx);
          }} />
          <CtxSeparator />
          <CtxItem icon={Layers} label="选择全部面板" onClick={() => setCanvasCtx(null)} />
          <CtxItem icon={LayoutGrid} label="自动排列" onClick={() => setCanvasCtx(null)} />
          <CtxSeparator />
          <CtxItem icon={Eye} label="切换预览" shortcut="⌘P" onClick={() => { setViewMode('preview'); setCanvasCtx(null); }} />
          <CtxItem icon={Code} label="查看代码" shortcut="⌘E" onClick={() => { toggleCodePreview(); setCanvasCtx(null); }} />
          <CtxItem icon={Sparkles} label="AI 助手" shortcut="F1" onClick={() => { toggleAI(); setCanvasCtx(null); }} />
          <CtxSeparator />
          <CtxItem icon={Magnet} label={snapEnabled ? '关闭边缘捕捉' : '开启边缘捕捉'} onClick={() => { toggleSnap(); setCanvasCtx(null); }} />
        </ContextMenu>
      )}

      {/* Template chooser dialog */}
      {templateDialog && (
        <NewPanelDialog
          pos={templateDialog}
          onClose={() => setTemplateDialog(null)}
          onSelect={(type) => { handleAddPanelFromTemplate(type); setTemplateDialog(null); }}
        />
      )}

      {/* Rubber band selection */}
      {rubberBand && (() => {
        const dx = Math.abs(rubberBand.endX - rubberBand.startX);
        const dy = Math.abs(rubberBand.endY - rubberBand.startY);
        if (dx < 5 && dy < 5) return null;
        return (
          <div
            className={`fixed pointer-events-none border ${t.accentBorder} rounded-sm z-50`}
            data-rubber-band
            style={{
              left: Math.min(rubberBand.startX, rubberBand.endX),
              top: Math.min(rubberBand.startY, rubberBand.endY),
              width: dx,
              height: dy,
              backgroundColor: `rgba(${ac.rawRgb},0.06)`,
            }}
          />
        );
      })()}
    </div>
  );
}

/* ================================================================
   Preview Mode
   ================================================================ */

function PreviewMode() {
  const { panels, components, setViewMode } = useDesigner();
  const t = useThemeTokens();
  return (
    <div className={`flex-1 overflow-auto p-6 min-h-0 ${t.scrollClass}`} style={{ backgroundColor: t.canvasBg }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className={`text-[12px] ${t.textTertiary}`}>实时预览模式 — 所有面板独立渲染</span>
          <button
            onClick={() => setViewMode('design')}
            className={`ml-auto px-3 py-1 rounded-lg ${t.inputBg} ${t.textTertiary} text-[11px] hover:text-white/60 transition-all`}
          >
            返回设计
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {panels.map(panel => {
            const panelComps = components.filter(c => c.panelId === panel.id);
            return (
              <div key={panel.id} className={`rounded-xl border ${t.panelBorder} overflow-hidden`} style={{ backgroundColor: t.canvasCardSelectedBg }}>
                <div className={`px-4 py-2.5 border-b ${t.sectionBorder} bg-white/[0.02] flex items-center gap-2`}>
                  <span className={`text-[12px] ${t.textSecondary}`}>{panel.name}</span>
                  <span className={`text-[9px] ${t.textMuted} ml-auto`}>{panel.type}</span>
                </div>
                <div className="p-4 space-y-3">
                  {panelComps.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-white/15">空面板</div>
                  ) : (
                    panelComps.map(comp => (
                      <ComponentRenderer key={comp.id} comp={comp} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SubCanvas Mode
   ================================================================ */

function SubCanvasMode() {
  const { subCanvasPanelId, exitSubCanvas, panels, components, selectedComponentId } = useDesigner();
  const t = useThemeTokens();
  const ac = useAccentColors(t);
  const panel = panels.find(p => p.id === subCanvasPanelId);
  const panelComps = components.filter(c => c.panelId === subCanvasPanelId);

  if (!panel) { exitSubCanvas(); return null; }

  return (
    <div className={`flex-1 overflow-auto min-h-0 relative ${t.scrollClass}`} style={{ backgroundColor: t.canvasBg }}>
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[150px] pointer-events-none" style={{ backgroundColor: t.canvasGlow1 }} />

      {/* Breadcrumb header */}
      <div className={`sticky top-0 z-20 px-4 py-3 backdrop-blur-lg border-b ${t.sectionBorder} flex items-center gap-3`} style={{ backgroundColor: t.canvasBg.replace(/[\d.]+\)$/, '0.9)') }}>
        <button
          onClick={exitSubCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.1] hover:text-white/70 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回画布
        </button>
        <div className="flex items-center gap-1.5 text-[11px] text-white/25">
          <span>画布</span>
          <ChevronDown className="w-3 h-3 -rotate-90" />
          <span className={t.accent}>{panel.name}</span>
        </div>
        <span className="text-[9px] text-white/15 ml-auto">子画布模式 · Esc 退出 · {panelComps.length} 组件</span>
        <div className="flex items-center gap-1">
          <Move className="w-3 h-3 text-white/15" />
          <span className="text-[9px] text-white/15">Alt+方向键移动</span>
        </div>
      </div>

      {/* Expanded panel content */}
      <div className="p-8" style={{ backgroundImage: `radial-gradient(circle, ${t.canvasGridDot} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
        {/* Snap grid overlay */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-12 gap-1 opacity-[0.03]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-full" style={{ borderLeft: `1px solid ${ac.raw}`, borderRight: `1px solid ${ac.raw}` }} />
          ))}
        </div>

        <div
          className={`max-w-4xl mx-auto rounded-2xl border ${t.accentBorder} overflow-hidden`}
          style={{ backgroundColor: t.canvasCardSelectedBg, boxShadow: ac.subCanvasShadow }}
        >
          {/* Panel header */}
          <div className={`flex items-center gap-2 px-5 py-3 border-b ${t.sectionBorder}`}>
            <Layers className={`w-4 h-4 ${t.accent}`} />
            <span className="text-[13px] text-white/70">{panel.name}</span>
            <span className="text-[10px] text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-lg">{panel.type}</span>
            <span className="text-[10px] text-white/15 ml-auto">Position: ({panel.x}, {panel.y}) · Size: {panel.w}×{panel.h}</span>
          </div>

          {/* Components */}
          <div className="p-6 space-y-4 min-h-[400px]">
            {panelComps.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center gap-3 text-white/15">
                <Plus className="w-12 h-12" />
                <span className="text-[13px]">子画布为空</span>
                <span className="text-[10px] text-white/10">从左侧组件库拖拽组件到此处</span>
              </div>
            ) : (
              panelComps.map(comp => (
                <div key={comp.id} className="relative">
                  <ComponentRenderer comp={comp} />
                  {selectedComponentId === comp.id && (
                    <div className={`absolute -left-3 top-0 bottom-0 w-1 ${t.btnPrimary} rounded-full`} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* iframe preview placeholder */}
        <div className={`max-w-4xl mx-auto mt-6 rounded-2xl border ${t.panelBorder} overflow-hidden`} style={{ backgroundColor: t.canvasCardBg }}>
          <div className={`flex items-center gap-2 px-4 py-2 border-b ${t.sectionBorder} bg-white/[0.02]`}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-[10px] text-white/25 font-mono">iframe sandbox — {panel.name} 实时预览</span>
            <Eye className="w-3 h-3 text-white/15 ml-auto" />
          </div>
          <IframeSandbox comps={panelComps} panelName={panel.name} />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   IframeSandbox — real-time preview in iframe
   ================================================================ */

function IframeSandbox({ comps, panelName }: { comps: ComponentInstance[]; panelName: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHTML, setIframeHTML] = useState('');

  // Deep comparison via JSON.stringify — ensures iframe updates on any prop change (Inspector two-way binding)
  const compsKey = useMemo(() => JSON.stringify(comps.map(c => ({ id: c.id, type: c.type, props: c.props }))), [comps]);

  useEffect(() => {
    const html = generateIframeHTML(comps);
    setIframeHTML(html);
  }, [compsKey]);

  useEffect(() => {
    const currentRef = iframeRef.current;
    if (currentRef && iframeHTML) {
      const doc = currentRef.contentDocument || currentRef.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(iframeHTML);
        doc.close();
      }
    }
  }, [iframeHTML]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-[200px] border-none"
      title={`iframe sandbox — ${panelName}`}
    />
  );
}