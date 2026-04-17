/**
 * @file logger.test.ts
 * @description typescript 模块 - logger.test.ts
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags core,typescript
 */

import { describe, it, expect, vi } from 'vitest'
import { createLogger } from '@/app/utils/logger'

describe('createLogger', () => {
  it('应该创建一个logger对象', () => {
    const logger = createLogger('TestLogger')
    
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('应该能够记录信息', () => {
    const logger = createLogger('TestLogger')
    const consoleSpy = vi.spyOn(console, 'info')
    
    logger.info('测试信息', { key: 'value' })
    
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('应该能够记录警告', () => {
    const logger = createLogger('TestLogger')
    const consoleSpy = vi.spyOn(console, 'warn')
    
    logger.warn('测试警告')
    
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('应该能够记录错误', () => {
    const logger = createLogger('TestLogger')
    const consoleSpy = vi.spyOn(console, 'error')
    
    logger.error('测试错误')
    
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})