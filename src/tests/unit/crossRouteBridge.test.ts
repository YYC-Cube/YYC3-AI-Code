/**
 * @file crossRouteBridge.test.ts
 * @description crossRouteBridge.ts 单元测试 — 双向桥读写、过期清理、parseCodeToComponents 解析
 * @priority P0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetLocalStorage } from '../setup';
import {
  bridgeSendToDesigner,
  bridgeSendToCode,
  bridgeReadForDesigner,
  bridgeReadForCode,
  bridgeClearForDesigner,
  bridgeClearForCode,
  parseCodeToComponents,
  type BridgePayload,
} from '../../app/crossRouteBridge';

describe('crossRouteBridge.ts — 跨路由双向通信桥', () => {

  beforeEach(() => {
    resetLocalStorage();
  });

  /* ── AI Code → Designer 方向 ── */

  describe('bridgeSendToDesigner / bridgeReadForDesigner', () => {
    it('TC-BRG-001: 写入后可正确读取', () => {
      bridgeSendToDesigner({
        code: 'const x = 1;',
        language: 'typescript',
        fileName: 'test.ts',
      });
      const payload = bridgeReadForDesigner();
      expect(payload).not.toBeNull();
      expect(payload!.code).toBe('const x = 1;');
      expect(payload!.language).toBe('typescript');
      expect(payload!.type).toBe('code-to-designer');
      expect(payload!.timestamp).toBeGreaterThan(0);
    });

    it('TC-BRG-002: 未写入时读取返回 null', () => {
      expect(bridgeReadForDesigner()).toBeNull();
    });

    it('TC-BRG-003: 超过 5 分钟的数据自动过期', () => {
      // 手动写入一个带过期时间戳的条目
      const oldPayload: BridgePayload = {
        type: 'code-to-designer',
        code: 'old code',
        language: 'typescript',
        timestamp: Date.now() - 6 * 60 * 1000, // 6 分钟前
      };
      localStorage.setItem('yyc3-bridge-code-to-designer', JSON.stringify(oldPayload));

      const result = bridgeReadForDesigner();
      expect(result).toBeNull();
    });

    it('TC-BRG-004: bridgeClearForDesigner 清除数据', () => {
      bridgeSendToDesigner({ code: 'test', language: 'ts' });
      expect(bridgeReadForDesigner()).not.toBeNull();
      bridgeClearForDesigner();
      expect(bridgeReadForDesigner()).toBeNull();
    });

    it('TC-BRG-005: 发送时触发 CustomEvent', () => {
      const handler = vi.fn();
      window.addEventListener('yyc3-bridge-sync', handler);
      bridgeSendToDesigner({ code: 'evt-test', language: 'ts' });
      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener('yyc3-bridge-sync', handler);
    });
  });

  /* ── Designer → AI Code 方向 ── */

  describe('bridgeSendToCode / bridgeReadForCode', () => {
    it('TC-BRG-010: Designer 写入 → Code 读取', () => {
      bridgeSendToCode({
        code: 'import React from "react";',
        language: 'typescript',
        designJSON: '{"panels":[]}',
      });
      const payload = bridgeReadForCode();
      expect(payload).not.toBeNull();
      expect(payload!.type).toBe('designer-to-code');
      expect(payload!.designJSON).toBe('{"panels":[]}');
    });

    it('TC-BRG-011: bridgeClearForCode 清除数据', () => {
      bridgeSendToCode({ code: 'test', language: 'ts' });
      bridgeClearForCode();
      expect(bridgeReadForCode()).toBeNull();
    });

    it('TC-BRG-012: 过期数据自动清理', () => {
      const oldPayload: BridgePayload = {
        type: 'designer-to-code',
        code: 'old',
        language: 'ts',
        timestamp: Date.now() - 400_000, // > 5分钟
      };
      localStorage.setItem('yyc3-bridge-designer-to-code', JSON.stringify(oldPayload));
      expect(bridgeReadForCode()).toBeNull();
    });
  });

  /* ── 双向隔离性 ── */

  describe('双向数据隔离', () => {
    it('TC-BRG-020: Code→Designer 的数据不影响 Designer→Code 读取', () => {
      bridgeSendToDesigner({ code: 'to-designer', language: 'ts' });
      expect(bridgeReadForCode()).toBeNull();
    });

    it('TC-BRG-021: Designer→Code 的数据不影响 Code→Designer 读取', () => {
      bridgeSendToCode({ code: 'to-code', language: 'ts' });
      expect(bridgeReadForDesigner()).toBeNull();
    });
  });

  /* ── components 字段传递 ── */

  describe('components 组件列表字段', () => {
    it('TC-BRG-030: 支持传递 components 数组', () => {
      bridgeSendToDesigner({
        code: 'export function Button() {}',
        language: 'typescript',
        components: [
          { type: 'Button', label: 'AI Button', props: { variant: 'primary' } },
        ],
      });
      const payload = bridgeReadForDesigner();
      expect(payload!.components).toHaveLength(1);
      expect(payload!.components![0].type).toBe('Button');
    });
  });

  /* ── parseCodeToComponents ── */

  describe('parseCodeToComponents — 代码解析', () => {
    it('TC-PCC-001: 解析 function 组件声明', () => {
      const code = `
        export function MyButton() { return <button>Click</button>; }
        export function CardList() { return <div />; }
      `;
      const result = parseCodeToComponents(code);
      expect(result).toBeDefined();
      expect(result!.some(c => c.label === 'MyButton')).toBe(true);
      expect(result!.some(c => c.label === 'CardList')).toBe(true);
    });

    it('TC-PCC-002: 解析 const 组件声明', () => {
      const code = `const Dashboard = () => <div>Dashboard</div>;`;
      const result = parseCodeToComponents(code);
      expect(result!.some(c => c.label === 'Dashboard')).toBe(true);
    });

    it('TC-PCC-003: 解析 JSX 内置元素（Button, Table, Input 等）', () => {
      const code = `
        function Page() {
          return (
            <div>
              <Button label="OK" />
              <Table source="users" />
              <Input placeholder="..." />
            </div>
          );
        }
      `;
      const result = parseCodeToComponents(code);
      expect(result).toBeDefined();
      const types = result!.map(c => c.type);
      expect(types).toContain('Button');
      expect(types).toContain('Table');
      expect(types).toContain('Input');
    });

    it('TC-PCC-004: 不重复同一 JSX 元素类型', () => {
      const code = `
        function X() { return <><Button /><Button /><Button /></>; }
      `;
      const result = parseCodeToComponents(code);
      const buttons = result!.filter(c => c.type === 'Button');
      expect(buttons.length).toBe(1); // 去重
    });

    it('TC-PCC-005: 无组件声明和 JSX 时返回 undefined', () => {
      const code = `const x = 1 + 2; console.log(x);`;
      const result = parseCodeToComponents(code);
      expect(result).toBeUndefined();
    });

    it('TC-PCC-006: Grid 映射为 Container 类型', () => {
      const code = `function Layout() { return <Grid columns={3}><Card /></Grid>; }`;
      const result = parseCodeToComponents(code);
      const grid = result!.find(c => c.type === 'Container');
      expect(grid).toBeDefined();
    });

    it('TC-PCC-007: 组件 props 标记 source 来源', () => {
      const code = `function Hero() { return <Image src="/hero.png" />; }`;
      const result = parseCodeToComponents(code);
      const img = result!.find(c => c.type === 'Image');
      expect(img?.props.source).toBe('ai-code');
      expect(img?.props.autoGenerated).toBe(true);
    });

    it('TC-PCC-008: 小写 jsx 标签不匹配（仅匹配 PascalCase 库组件）', () => {
      const code = `function App() { return <div><span>hello</span></div>; }`;
      const result = parseCodeToComponents(code);
      // 只有 App 被提取为 function 组件, div/span 不匹配
      expect(result!.every(c => c.type !== 'div' && c.type !== 'span')).toBe(true);
    });
  });

  /* ── 异常情况 ── */

  describe('异常安全', () => {
    it('TC-BRG-040: localStorage 损坏时 read 返回 null', () => {
      localStorage.setItem('yyc3-bridge-code-to-designer', '{INVALID JSON');
      expect(bridgeReadForDesigner()).toBeNull();
    });

    it('TC-BRG-041: localStorage 损坏时 read code 返回 null', () => {
      localStorage.setItem('yyc3-bridge-designer-to-code', 'not json');
      expect(bridgeReadForCode()).toBeNull();
    });
  });
});
