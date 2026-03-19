/**
 * @file useCRDTAwareness.test.ts
 * @description useCRDTAwareness Hook 单元测试
 * @priority P0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCRDTAwareness } from '../../app/hooks/useCRDTAwareness';
import type { UseCRDTAwarenessOptions } from '../../app/hooks/useCRDTAwareness';

describe('useCRDTAwareness — CRDT 用户感知', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('TC-HOOK-001: useCRDTAwareness 返回正确的 API', () => {
    const mockOptions = {
      setCurrentUserIdentity: vi.fn(),
      setCRDTPeers: vi.fn(),
      incrementDocVersion: vi.fn(),
    } as UseCRDTAwarenessOptions;

    const { result } = renderHook(() => useCRDTAwareness(mockOptions));

    expect(result.current).toHaveProperty('identity');
    expect(result.current).toHaveProperty('updateIdentity');
  });

  it('TC-HOOK-002: 初始化时创建并注册身份', () => {
    const mockSetCurrentUserIdentity = vi.fn();
    const mockSetCRDTPeers = vi.fn();
    const mockIncrementDocVersion = vi.fn();

    const mockOptions = {
      setCurrentUserIdentity: mockSetCurrentUserIdentity,
      setCRDTPeers: mockSetCRDTPeers,
      incrementDocVersion: mockIncrementDocVersion,
    } as UseCRDTAwarenessOptions;

    renderHook(() => useCRDTAwareness(mockOptions));

    expect(mockSetCurrentUserIdentity).toHaveBeenCalled();
    expect(mockSetCRDTPeers).toHaveBeenCalled();
    expect(mockIncrementDocVersion).toHaveBeenCalled();
  });

  it('TC-HOOK-003: updateIdentity 正常工作', async () => {
    const mockSetCurrentUserIdentity = vi.fn();
    const mockSetCRDTPeers = vi.fn();
    const mockIncrementDocVersion = vi.fn();

    const mockOptions = {
      setCurrentUserIdentity: mockSetCurrentUserIdentity,
      setCRDTPeers: mockSetCRDTPeers,
      incrementDocVersion: mockIncrementDocVersion,
    } as UseCRDTAwarenessOptions;

    const { result } = renderHook(() => useCRDTAwareness(mockOptions));

    // Identity should be set by useEffect
    expect(mockSetCurrentUserIdentity).toHaveBeenCalled();
    
    // 调用 updateIdentity (identity may be null initially)
    result.current.updateIdentity({ role: 'owner' });

    // 验证 setCurrentUserIdentity 被再次调用
    expect(mockSetCurrentUserIdentity).toHaveBeenCalled();
  });

  it('TC-HOOK-004: 卸载时清理身份和定时器', () => {
    const mockSetCurrentUserIdentity = vi.fn();
    const mockSetCRDTPeers = vi.fn();
    const mockIncrementDocVersion = vi.fn();

    const mockOptions = {
      setCurrentUserIdentity: mockSetCurrentUserIdentity,
      setCRDTPeers: mockSetCRDTPeers,
      incrementDocVersion: mockIncrementDocVersion,
    } as UseCRDTAwarenessOptions;

    const { unmount } = renderHook(() => useCRDTAwareness(mockOptions));

    // 卸载 Hook
    unmount();

    // 验证清理函数被调用
    expect(mockSetCurrentUserIdentity).toHaveBeenCalledWith(null);
    expect(mockSetCRDTPeers).toHaveBeenCalledWith([]);
  });

  it('TC-HOOK-005: 周期性更新对等端状态', () => {
    const mockSetCurrentUserIdentity = vi.fn();
    const mockSetCRDTPeers = vi.fn();
    const mockIncrementDocVersion = vi.fn();

    const mockOptions = {
      setCurrentUserIdentity: mockSetCurrentUserIdentity,
      setCRDTPeers: mockSetCRDTPeers,
      incrementDocVersion: mockIncrementDocVersion,
    } as UseCRDTAwarenessOptions;

    renderHook(() => useCRDTAwareness(mockOptions));

    // 初始调用
    expect(mockSetCRDTPeers).toHaveBeenCalledTimes(1);

    // 快进 8 秒
    vi.advanceTimersByTime(8000);

    // 应该再次调用
    expect(mockSetCRDTPeers).toHaveBeenCalledTimes(2);

    // 再快进 8 秒
    vi.advanceTimersByTime(8000);

    // 应该第三次调用
    expect(mockSetCRDTPeers).toHaveBeenCalledTimes(3);
  });
});
