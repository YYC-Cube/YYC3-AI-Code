import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { debounce, throttle } from '@/app/utils/debounce'

describe('Debounce/Throttle 工具函数', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('debounce', () => {
    it('应该延迟执行函数', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('test')
      
      expect(fn).not.toHaveBeenCalled()
      
      vi.advanceTimersByTime(100)
      
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('test')
    })

    it('多次调用只执行最后一次', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('first')
      debounced('second')
      debounced('third')

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('third')
    })

    it('应该在延迟时间内重置计时器', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('call1')
      vi.advanceTimersByTime(50)
      debounced('call2')
      vi.advanceTimersByTime(50)

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('call2')
    })

    it('支持cancel方法取消待执行的调用', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('test')
      debounced.cancel()

      vi.advanceTimersByTime(100)

      expect(fn).not.toHaveBeenCalled()
    })

    it('支持flush方法立即执行待执行的调用', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('immediate')
      
      expect(fn).not.toHaveBeenCalled()
      
      debounced.flush()
      
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('immediate')
    })

    it('flush后不应该再次执行', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('test')
      debounced.flush()

      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('cancel后flush不应该执行', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('test')
      debounced.cancel()
      debounced.flush()

      expect(fn).not.toHaveBeenCalled()
    })

    it('可以连续多次调用', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 50)

      for (let i = 0; i < 10; i++) {
        debounced(i)
      }

      vi.advanceTimersByTime(50)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith(9)
    })

    it('处理0延迟的情况', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 0)

      debounced('zero-delay')

      vi.advanceTimersByTime(0)

      expect(fn).toHaveBeenCalled()
    })
  })

  describe('throttle', () => {
    it('应该立即执行第一次调用', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('first')

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('first')
    })

    it('在间隔期内不重复执行', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('first')
      throttled('second')
      throttled('third')

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('间隔期过后可以再次执行', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('first')
      vi.advanceTimersByTime(100)
      throttled('second')

      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenNthCalledWith(1, 'first')
      expect(fn).toHaveBeenNthCalledWith(2, 'second')
    })

    it('支持cancel方法', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('first')
      throttled.cancel()
      vi.advanceTimersByTime(100)
      throttled('second')

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('正确处理快速连续调用', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 50)

      for (let i = 0; i < 10; i++) {
        throttled(i)
        if (i < 9) {
          vi.advanceTimersByTime(25)
        }
      }
      vi.advanceTimersByTime(50)

      const callCount = fn.mock.calls.length
      expect(callCount).toBeGreaterThan(1)
      expect(callCount).toBeLessThanOrEqual(6)
    })

    it('正确处理调用参数', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled(21)
      
      expect(fn).toHaveBeenCalledWith(21)
    })
  })

  describe('边界情况', () => {
    it('debounce处理负数延迟', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, -100)

      debounced('negative')
      vi.advanceTimersByTime(0)

      expect(fn).toHaveBeenCalled()
    })

    it('throttle处理非常小的间隔', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 1)

      throttled('tiny')
      expect(fn).toHaveBeenCalled()
    })

    it('debounce处理无参数的函数', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 50)

      debounced()
      vi.advanceTimersByTime(50)

      expect(fn).toHaveBeenCalledWith()
    })

    it('throttle处理多个参数', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('a', 'b', 'c', 123)

      expect(fn).toHaveBeenCalledWith('a', 'b', 'c', 123)
    })
  })
})
