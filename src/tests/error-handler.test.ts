/**
 * 错误处理工具测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorHandler, ERROR_CODES, handleValidationError, handleLogicError, handleSystemError } from '../utils/error-handler'

// Mock Element Plus
vi.mock('element-plus', () => ({
    ElMessage: vi.fn(),
    ElNotification: vi.fn()
}))

describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler
    let consoleSpy: any

    beforeEach(() => {
        errorHandler = ErrorHandler.getInstance()
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.clearAllMocks()
    })

    afterEach(() => {
        consoleSpy.mockRestore()
    })

    describe('基础错误处理', () => {
        it('应该正确处理预定义错误代码', () => {
            const result = errorHandler.handle(ERROR_CODES.INVALID_DATE_RANGE)
            
            expect(result.code).toBe(ERROR_CODES.INVALID_DATE_RANGE)
            expect(result.message).toBe('时间范围无效')
            expect(result.level).toBe('error')
            expect(result.recoverable).toBe(true)
        })

        it('应该正确处理Error对象', () => {
            const error = new Error('测试错误')
            const result = errorHandler.handle(error)
            
            expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
            expect(result.message).toBe('测试错误')
            expect(result.level).toBe('error')
            expect(result.originalError).toBe(error)
        })

        it('应该正确处理ErrorInfo对象', () => {
            const errorInfo = {
                code: 'CUSTOM_ERROR',
                message: '自定义错误',
                level: 'warning' as const,
                recoverable: true
            }
            
            const result = errorHandler.handle(errorInfo)
            expect(result).toEqual(errorInfo)
        })
    })

    describe('错误处理选项', () => {
        it('应该根据选项控制日志输出', () => {
            errorHandler.handle(ERROR_CODES.INVALID_DATE_RANGE, {
                logToConsole: false
            })
            
            expect(consoleSpy).not.toHaveBeenCalled()
        })

        it('应该执行自定义处理函数', () => {
            const customHandler = vi.fn()
            
            errorHandler.handle(ERROR_CODES.INVALID_DATE_RANGE, {
                customHandler
            })
            
            expect(customHandler).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ERROR_CODES.INVALID_DATE_RANGE
                })
            )
        })

        it('应该在不可恢复错误时执行回退策略', () => {
            const fallbackStrategy = vi.fn()
            
            errorHandler.handle(ERROR_CODES.COMPONENT_INIT_ERROR, {
                fallbackStrategy
            })
            
            expect(fallbackStrategy).toHaveBeenCalled()
        })
    })

    describe('便捷函数', () => {
        it('handleValidationError应该使用正确的默认选项', () => {
            const spy = vi.spyOn(errorHandler, 'handle')
            
            handleValidationError(ERROR_CODES.INVALID_DATE_RANGE)
            
            expect(spy).toHaveBeenCalledWith(
                ERROR_CODES.INVALID_DATE_RANGE,
                expect.objectContaining({
                    showMessage: true,
                    showNotification: false
                })
            )
        })

        it('handleLogicError应该使用正确的默认选项', () => {
            const spy = vi.spyOn(errorHandler, 'handle')
            
            handleLogicError(ERROR_CODES.CROSS_YEAR_COMPARISON)
            
            expect(spy).toHaveBeenCalledWith(
                ERROR_CODES.CROSS_YEAR_COMPARISON,
                expect.objectContaining({
                    showNotification: true,
                    showMessage: false
                })
            )
        })

        it('handleSystemError应该使用正确的默认选项', () => {
            const spy = vi.spyOn(errorHandler, 'handle')
            const error = new Error('系统错误')
            
            handleSystemError(error)
            
            expect(spy).toHaveBeenCalledWith(
                error,
                expect.objectContaining({
                    showNotification: true,
                    showMessage: true
                })
            )
        })
    })

    describe('错误消息映射', () => {
        it('应该为所有错误代码提供正确的消息', () => {
            Object.values(ERROR_CODES).forEach(code => {
                const result = errorHandler.handle(code)
                
                expect(result.message).toBeTruthy()
                expect(result.level).toMatch(/^(success|warning|error)$/)
                expect(typeof result.recoverable).toBe('boolean')
            })
        })

        it('应该为跨年比较提供正确的警告信息', () => {
            const result = errorHandler.handle(ERROR_CODES.CROSS_YEAR_COMPARISON)
            
            expect(result.level).toBe('warning')
            expect(result.message).toContain('跨年')
            expect(result.suggestion).toContain('同一年份')
        })

        it('应该为网络错误提供正确的错误信息', () => {
            const result = errorHandler.handle(ERROR_CODES.NETWORK_ERROR)
            
            expect(result.level).toBe('error')
            expect(result.message).toContain('网络')
            expect(result.suggestion).toContain('检查网络')
        })
    })

    describe('单例模式', () => {
        it('应该返回同一个实例', () => {
            const instance1 = ErrorHandler.getInstance()
            const instance2 = ErrorHandler.getInstance()
            
            expect(instance1).toBe(instance2)
        })
    })

    describe('默认选项设置', () => {
        it('应该正确设置和使用默认选项', () => {
            errorHandler.setDefaultOptions({
                showNotification: false,
                logToConsole: false
            })
            
            errorHandler.handle(ERROR_CODES.INVALID_DATE_RANGE)
            
            expect(consoleSpy).not.toHaveBeenCalled()
        })
    })
})

describe('错误代码覆盖测试', () => {
    it('应该覆盖所有输入验证错误', () => {
        const validationErrors = [
            ERROR_CODES.INVALID_DATE_RANGE,
            ERROR_CODES.INVALID_TIME_UNIT,
            ERROR_CODES.FUTURE_DATE_NOT_ALLOWED,
            ERROR_CODES.EMPTY_TIME_RANGE
        ]
        
        validationErrors.forEach(code => {
            const result = handleValidationError(code)
            expect(result.code).toBe(code)
        })
    })

    it('应该覆盖所有逻辑错误', () => {
        const logicErrors = [
            ERROR_CODES.CROSS_YEAR_COMPARISON,
            ERROR_CODES.TIME_SPAN_TOO_LARGE,
            ERROR_CODES.INCOMPATIBLE_TIME_UNITS
        ]
        
        logicErrors.forEach(code => {
            const result = handleLogicError(code)
            expect(result.code).toBe(code)
        })
    })

    it('应该覆盖所有系统错误', () => {
        const systemErrors = [
            ERROR_CODES.NETWORK_ERROR,
            ERROR_CODES.API_ERROR,
            ERROR_CODES.COMPONENT_INIT_ERROR,
            ERROR_CODES.UNKNOWN_ERROR
        ]
        
        systemErrors.forEach(code => {
            const result = handleSystemError(code)
            expect(result.code).toBe(code)
        })
    })
})

describe('错误恢复能力测试', () => {
    it('应该正确标识可恢复的错误', () => {
        const recoverableErrors = [
            ERROR_CODES.INVALID_DATE_RANGE,
            ERROR_CODES.FUTURE_DATE_NOT_ALLOWED,
            ERROR_CODES.CROSS_YEAR_COMPARISON,
            ERROR_CODES.NETWORK_ERROR
        ]

        recoverableErrors.forEach(code => {
            const result = ErrorHandler.getInstance().handle(code)
            expect(result.recoverable).toBe(true)
        })
    })

    it('应该正确标识不可恢复的错误', () => {
        const nonRecoverableErrors = [
            ERROR_CODES.COMPONENT_INIT_ERROR,
            ERROR_CODES.UNKNOWN_ERROR
        ]

        nonRecoverableErrors.forEach(code => {
            const result = ErrorHandler.getInstance().handle(code)
            expect(result.recoverable).toBe(false)
        })
    })
})
