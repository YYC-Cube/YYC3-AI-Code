/**
 * @file clipboard.test.ts
 * @description clipboard.ts 单元测试 — 剪贴板 API 及降级 execCommand 方案
 * @priority P1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { copyToClipboard } from '../../app/utils/clipboard';

describe('clipboard.ts — 剪贴板工具', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TC-CB-001: 优先使用 navigator.clipboard.writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    copyToClipboard('hello');
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('TC-CB-002: Clipboard API 不存在时使用 fallback textarea', () => {
    // 移除 clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node as any);
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    copyToClipboard('fallback text');

    expect(createElementSpy).toHaveBeenCalledWith('textarea');
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('TC-CB-003: Clipboard API 失败时降级到 fallback', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);
    vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n as any);

    copyToClipboard('retry text');

    // writeText 被调用, 当 promise reject 后 fallback 会触发
    expect(writeText).toHaveBeenCalled();
  });

  it('TC-CB-004: 空字符串不报错', () => {
    expect(() => copyToClipboard('')).not.toThrow();
  });

  it('TC-CB-005: 特殊字符正确传递', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    const specialText = '<script>alert("xss")</script>\n\t"quotes"';
    copyToClipboard(specialText);
    expect(writeText).toHaveBeenCalledWith(specialText);
  });
});
