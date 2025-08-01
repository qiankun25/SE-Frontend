/**
 * 防抖功能测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
    debounce, 
    throttle, 
    createSearchDebounce, 
    createValidationDebounce,
    createSaveDebounce,
    createResizeDebounce,
    debounceWithMonitoring
} from '../utils/debounce'

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('应该延迟执行函数', () => {
        const fn = vi.fn()
        const debouncedFn = debounce(fn, 100)

        debouncedFn()
        expect(fn).not.toHaveBeenCalled()

        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该在多次调用时只执行最后一次', () => {
        const fn = vi.fn()
        const debouncedFn = debounce(fn, 100)

        debouncedFn('first')
        debouncedFn('second')
        debouncedFn('third')

        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('third')
    })

    it('应该在immediate模式下立即执行', () => {
        const fn = vi.fn()
        const debouncedFn = debounce(fn, 100, true)

        debouncedFn('immediate')
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('immediate')

        // 后续调用应该被防抖
        debouncedFn('delayed')
        expect(fn).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该正确处理this上下文', () => {
        const obj = {
            value: 'test',
            method: vi.fn(function(this: any) {
                return this.value
            })
        }

        const debouncedMethod = debounce(obj.method, 100)
        debouncedMethod.call(obj)

        vi.advanceTimersByTime(100)
        expect(obj.method).toHaveBeenCalledTimes(1)
    })
})

describe('throttle', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('应该限制函数执行频率', () => {
        const fn = vi.fn()
        const throttledFn = throttle(fn, 100)

        throttledFn('first')
        expect(fn).toHaveBeenCalledTimes(1)

        throttledFn('second')
        expect(fn).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledTimes(2)
        expect(fn).toHaveBeenLastCalledWith('second')
    })

    it('应该支持leading选项', () => {
        const fn = vi.fn()
        const throttledFn = throttle(fn, 100, { leading: false })

        throttledFn('first')
        expect(fn).not.toHaveBeenCalled()

        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该支持trailing选项', () => {
        const fn = vi.fn()
        const throttledFn = throttle(fn, 100, { trailing: false })

        throttledFn('first')
        expect(fn).toHaveBeenCalledTimes(1)

        throttledFn('second')
        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledTimes(1)
    })
})

describe('特定场景的防抖函数', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('createSearchDebounce应该使用正确的延迟时间', () => {
        const searchFn = vi.fn()
        const debouncedSearch = createSearchDebounce(searchFn)

        debouncedSearch('query')
        expect(searchFn).not.toHaveBeenCalled()

        vi.advanceTimersByTime(300)
        expect(searchFn).toHaveBeenCalledWith('query')
    })

    it('createValidationDebounce应该使用正确的延迟时间', () => {
        const validateFn = vi.fn()
        const debouncedValidate = createValidationDebounce(validateFn)

        debouncedValidate('value')
        expect(validateFn).not.toHaveBeenCalled()

        vi.advanceTimersByTime(500)
        expect(validateFn).toHaveBeenCalledWith('value')
    })

    it('createSaveDebounce应该使用正确的延迟时间', () => {
        const saveFn = vi.fn()
        const debouncedSave = createSaveDebounce(saveFn)

        debouncedSave('data')
        expect(saveFn).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1000)
        expect(saveFn).toHaveBeenCalledWith('data')
    })

    it('createResizeDebounce应该使用正确的延迟时间', () => {
        const resizeFn = vi.fn()
        const debouncedResize = createResizeDebounce(resizeFn)

        debouncedResize()
        expect(resizeFn).not.toHaveBeenCalled()

        vi.advanceTimersByTime(250)
        expect(resizeFn).toHaveBeenCalled()
    })
})

describe('debounceWithMonitoring', () => {
    let consoleSpy: any

    beforeEach(() => {
        vi.useFakeTimers()
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.useRealTimers()
        consoleSpy.mockRestore()
    })

    it('应该记录性能监控信息', () => {
        const fn = vi.fn()
        const monitoredFn = debounceWithMonitoring(fn, 100, 'testFunction')

        monitoredFn()
        monitoredFn()
        monitoredFn()

        vi.advanceTimersByTime(100)

        expect(consoleSpy).toHaveBeenCalledWith(
            '[Debounce Monitor] testFunction:',
            expect.objectContaining({
                callCount: 3,
                executionCount: 1,
                efficiency: expect.any(String)
            })
        )
    })

    it('应该计算正确的效率百分比', () => {
        const fn = vi.fn()
        const monitoredFn = debounceWithMonitoring(fn, 100, 'testFunction')

        // 调用5次，但只执行1次
        for (let i = 0; i < 5; i++) {
            monitoredFn()
        }

        vi.advanceTimersByTime(100)

        const logCall = consoleSpy.mock.calls[0]
        const monitorData = logCall[1]
        expect(monitorData.efficiency).toBe('20.00%')
    })
})

describe('边界情况测试', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('应该处理零延迟', () => {
        const fn = vi.fn()
        const debouncedFn = debounce(fn, 0)

        debouncedFn()
        vi.advanceTimersByTime(0)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该处理负延迟', () => {
        const fn = vi.fn()
        const debouncedFn = debounce(fn, -100)

        debouncedFn()
        vi.advanceTimersByTime(0)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该处理函数抛出异常', () => {
        const fn = vi.fn(() => {
            throw new Error('Test error')
        })
        const debouncedFn = debounce(fn, 100)

        expect(() => {
            debouncedFn()
            vi.advanceTimersByTime(100)
        }).toThrow('Test error')
    })

    it('应该处理undefined参数', () => {
        const fn = vi.fn()
        const debouncedFn = debounce(fn, 100)

        debouncedFn(undefined)
        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledWith(undefined)
    })

    it('应该处理多个参数', () => {
        const fn = vi.fn()
        const debouncedFn = debounce(fn, 100)

        debouncedFn('arg1', 'arg2', 'arg3')
        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    })
})

describe('性能测试', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('应该能处理大量快速调用', () => {
        const fn = vi.fn()
        const debouncedFn = debounce(fn, 100)

        // 快速调用1000次
        for (let i = 0; i < 1000; i++) {
            debouncedFn(i)
        }

        vi.advanceTimersByTime(100)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith(999)
    })

    it('节流函数应该能处理高频调用', () => {
        const fn = vi.fn()
        const throttledFn = throttle(fn, 100)

        // 每10ms调用一次，持续1秒
        for (let i = 0; i < 100; i++) {
            throttledFn(i)
            vi.advanceTimersByTime(10)
        }

        // 应该执行约10次（每100ms一次）
        expect(fn.mock.calls.length).toBeGreaterThan(5)
        expect(fn.mock.calls.length).toBeLessThan(15)
    })
})
