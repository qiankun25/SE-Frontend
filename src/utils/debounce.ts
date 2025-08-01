/**
 * 防抖处理工具
 * 提供防抖函数和相关的性能优化功能
 */

// ============================================================================
// 基础防抖函数
// ============================================================================

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    immediate = false
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastCallTime = 0

    return function (this: any, ...args: Parameters<T>) {
        const now = Date.now()
        const callNow = immediate && !timeoutId

        // 清除之前的定时器
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        // 设置新的定时器
        timeoutId = setTimeout(() => {
            timeoutId = null
            lastCallTime = Date.now()
            if (!immediate) {
                func.apply(this, args)
            }
        }, delay)

        // 立即执行模式
        if (callNow) {
            lastCallTime = now
            func.apply(this, args)
        }
    }
}

// ============================================================================
// 节流函数
// ============================================================================

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @param options 选项
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    options: {
        leading?: boolean
        trailing?: boolean
    } = {}
): (...args: Parameters<T>) => void {
    const { leading = true, trailing = true } = options
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastCallTime = 0
    let lastArgs: Parameters<T> | null = null

    return function (this: any, ...args: Parameters<T>) {
        const now = Date.now()
        const timeSinceLastCall = now - lastCallTime

        lastArgs = args

        // 首次调用或超过延迟时间
        if (leading && (lastCallTime === 0 || timeSinceLastCall >= delay)) {
            lastCallTime = now
            func.apply(this, args)
            return
        }

        // 设置尾部调用
        if (trailing && !timeoutId) {
            timeoutId = setTimeout(() => {
                timeoutId = null
                if (lastArgs && (!leading || Date.now() - lastCallTime >= delay)) {
                    lastCallTime = Date.now()
                    func.apply(this, lastArgs)
                }
            }, delay - timeSinceLastCall)
        }
    }
}

// ============================================================================
// Vue 3 Composition API 集成
// ============================================================================

import { ref, onUnmounted } from 'vue'

/**
 * Vue 3 防抖 Hook
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 防抖后的函数和取消函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    immediate = false
) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const debouncedFunc = function (this: any, ...args: Parameters<T>) {
        const callNow = immediate && !timeoutId

        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            timeoutId = null
            if (!immediate) {
                func.apply(this, args)
            }
        }, delay)

        if (callNow) {
            func.apply(this, args)
        }
    }

    const cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
    }

    // 组件卸载时自动清理
    onUnmounted(cancel)

    return {
        debouncedFunc,
        cancel
    }
}

/**
 * Vue 3 节流 Hook
 * @param func 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @param options 选项
 * @returns 节流后的函数和取消函数
 */
export function useThrottle<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    options: {
        leading?: boolean
        trailing?: boolean
    } = {}
) {
    const { leading = true, trailing = true } = options
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastCallTime = 0

    const throttledFunc = function (this: any, ...args: Parameters<T>) {
        const now = Date.now()
        const timeSinceLastCall = now - lastCallTime

        if (leading && (lastCallTime === 0 || timeSinceLastCall >= delay)) {
            lastCallTime = now
            func.apply(this, args)
            return
        }

        if (trailing && !timeoutId) {
            timeoutId = setTimeout(() => {
                timeoutId = null
                if (!leading || Date.now() - lastCallTime >= delay) {
                    lastCallTime = Date.now()
                    func.apply(this, args)
                }
            }, delay - timeSinceLastCall)
        }
    }

    const cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
    }

    onUnmounted(cancel)

    return {
        throttledFunc,
        cancel
    }
}

// ============================================================================
// 响应式防抖值
// ============================================================================

/**
 * 响应式防抖值
 * @param initialValue 初始值
 * @param delay 延迟时间（毫秒）
 * @returns 响应式值和设置函数
 */
export function useDebouncedRef<T>(initialValue: T, delay: number) {
    const value = ref<T>(initialValue)
    const debouncedValue = ref<T>(initialValue)

    const { debouncedFunc } = useDebounce((newValue: T) => {
        debouncedValue.value = newValue
    }, delay)

    const setValue = (newValue: T) => {
        value.value = newValue
        debouncedFunc(newValue)
    }

    return {
        value,
        debouncedValue,
        setValue
    }
}

// ============================================================================
// 特定场景的防抖函数
// ============================================================================

/**
 * 搜索防抖
 * 专门用于搜索输入的防抖处理
 */
export function createSearchDebounce<T extends (...args: any[]) => any>(
    searchFunc: T,
    delay = 300
) {
    return debounce(searchFunc, delay, false)
}

/**
 * 验证防抖
 * 专门用于表单验证的防抖处理
 */
export function createValidationDebounce<T extends (...args: any[]) => any>(
    validateFunc: T,
    delay = 500
) {
    return debounce(validateFunc, delay, false)
}

/**
 * 保存防抖
 * 专门用于自动保存的防抖处理
 */
export function createSaveDebounce<T extends (...args: any[]) => any>(
    saveFunc: T,
    delay = 1000
) {
    return debounce(saveFunc, delay, false)
}

/**
 * 调整大小防抖
 * 专门用于窗口大小调整的防抖处理
 */
export function createResizeDebounce<T extends (...args: any[]) => any>(
    resizeFunc: T,
    delay = 250
) {
    return debounce(resizeFunc, delay, false)
}

// ============================================================================
// 性能监控
// ============================================================================

/**
 * 带性能监控的防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间
 * @param name 函数名称（用于监控）
 * @returns 防抖后的函数
 */
export function debounceWithMonitoring<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    name: string
): (...args: Parameters<T>) => void {
    let callCount = 0
    let executionCount = 0
    let totalDelay = 0

    const debouncedFunc = debounce((...args: Parameters<T>) => {
        executionCount++
        const start = performance.now()
        
        const result = func.apply(this, args)
        
        const end = performance.now()
        const executionTime = end - start
        
        console.log(`[Debounce Monitor] ${name}:`, {
            callCount,
            executionCount,
            averageDelay: totalDelay / callCount,
            executionTime,
            efficiency: (executionCount / callCount * 100).toFixed(2) + '%'
        })
        
        return result
    }, delay)

    return function (this: any, ...args: Parameters<T>) {
        callCount++
        totalDelay += delay
        return debouncedFunc.apply(this, args)
    }
}
