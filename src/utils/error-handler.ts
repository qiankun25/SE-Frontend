/**
 * 错误处理工具类
 * 提供统一的错误处理机制和用户体验优化
 */

import { ElMessage, ElNotification } from 'element-plus'
import type { ValidationLevel } from '../types/time-selection'

// ============================================================================
// 错误类型定义
// ============================================================================

export interface ErrorInfo {
    /** 错误代码 */
    code: string
    /** 错误消息 */
    message: string
    /** 错误级别 */
    level: ValidationLevel
    /** 详细描述 */
    description?: string
    /** 修正建议 */
    suggestion?: string
    /** 是否可恢复 */
    recoverable?: boolean
    /** 原始错误对象 */
    originalError?: Error
}

export interface ErrorHandlerOptions {
    /** 是否显示通知 */
    showNotification?: boolean
    /** 是否显示消息提示 */
    showMessage?: boolean
    /** 是否记录到控制台 */
    logToConsole?: boolean
    /** 自定义处理函数 */
    customHandler?: (error: ErrorInfo) => void
    /** 回退策略 */
    fallbackStrategy?: () => void
}

// ============================================================================
// 预定义错误类型
// ============================================================================

export const ERROR_CODES = {
    // 输入验证错误
    INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
    INVALID_TIME_UNIT: 'INVALID_TIME_UNIT',
    FUTURE_DATE_NOT_ALLOWED: 'FUTURE_DATE_NOT_ALLOWED',
    EMPTY_TIME_RANGE: 'EMPTY_TIME_RANGE',
    
    // 逻辑错误
    CROSS_YEAR_COMPARISON: 'CROSS_YEAR_COMPARISON',
    TIME_SPAN_TOO_LARGE: 'TIME_SPAN_TOO_LARGE',
    INCOMPATIBLE_TIME_UNITS: 'INCOMPATIBLE_TIME_UNITS',
    
    // 系统错误
    NETWORK_ERROR: 'NETWORK_ERROR',
    API_ERROR: 'API_ERROR',
    COMPONENT_INIT_ERROR: 'COMPONENT_INIT_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// ============================================================================
// 错误消息映射
// ============================================================================

const ERROR_MESSAGES: Record<ErrorCode, Omit<ErrorInfo, 'code'>> = {
    [ERROR_CODES.INVALID_DATE_RANGE]: {
        message: '时间范围无效',
        level: 'error',
        description: '结束时间不能早于开始时间',
        suggestion: '请重新选择正确的时间范围',
        recoverable: true
    },
    
    [ERROR_CODES.INVALID_TIME_UNIT]: {
        message: '时间单位无效',
        level: 'error',
        description: '选择的时间单位不被支持',
        suggestion: '请选择年、月或日作为时间单位',
        recoverable: true
    },
    
    [ERROR_CODES.FUTURE_DATE_NOT_ALLOWED]: {
        message: '不允许选择未来日期',
        level: 'warning',
        description: '查询日期不能超过当前日期',
        suggestion: '请选择当前日期或之前的日期',
        recoverable: true
    },
    
    [ERROR_CODES.EMPTY_TIME_RANGE]: {
        message: '请选择时间范围',
        level: 'warning',
        description: '时间范围不能为空',
        suggestion: '请选择一个有效的时间范围',
        recoverable: true
    },
    
    [ERROR_CODES.CROSS_YEAR_COMPARISON]: {
        message: '跨年同期比提醒',
        level: 'warning',
        description: '当前选择的时间范围跨越多个年份',
        suggestion: '同期比分析建议选择同一年份内的时间范围，以确保分析结果的准确性',
        recoverable: true
    },
    
    [ERROR_CODES.TIME_SPAN_TOO_LARGE]: {
        message: '时间跨度过大',
        level: 'warning',
        description: '选择的时间范围超过了建议的最大跨度',
        suggestion: '建议缩小时间范围以获得更好的查询性能',
        recoverable: true
    },
    
    [ERROR_CODES.INCOMPATIBLE_TIME_UNITS]: {
        message: '时间单位不兼容',
        level: 'error',
        description: '当前操作不支持所选的时间单位组合',
        suggestion: '请调整时间单位设置',
        recoverable: true
    },
    
    [ERROR_CODES.NETWORK_ERROR]: {
        message: '网络连接错误',
        level: 'error',
        description: '无法连接到服务器',
        suggestion: '请检查网络连接并重试',
        recoverable: true
    },
    
    [ERROR_CODES.API_ERROR]: {
        message: '服务器错误',
        level: 'error',
        description: '服务器处理请求时发生错误',
        suggestion: '请稍后重试，如问题持续存在请联系技术支持',
        recoverable: true
    },
    
    [ERROR_CODES.COMPONENT_INIT_ERROR]: {
        message: '组件初始化失败',
        level: 'error',
        description: '时间选择组件初始化时发生错误',
        suggestion: '请刷新页面重试',
        recoverable: false
    },
    
    [ERROR_CODES.UNKNOWN_ERROR]: {
        message: '未知错误',
        level: 'error',
        description: '发生了未预期的错误',
        suggestion: '请刷新页面重试，如问题持续存在请联系技术支持',
        recoverable: false
    }
}

// ============================================================================
// 错误处理器类
// ============================================================================

export class ErrorHandler {
    private static instance: ErrorHandler
    private defaultOptions: ErrorHandlerOptions = {
        showNotification: true,
        showMessage: false,
        logToConsole: true
    }

    private constructor() {}

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler()
        }
        return ErrorHandler.instance
    }

    /**
     * 处理错误
     */
    handle(
        codeOrError: ErrorCode | Error | ErrorInfo,
        options: ErrorHandlerOptions = {}
    ): ErrorInfo {
        const mergedOptions = { ...this.defaultOptions, ...options }
        let errorInfo: ErrorInfo

        // 根据输入类型创建错误信息
        if (typeof codeOrError === 'string') {
            errorInfo = this.createErrorInfo(codeOrError)
        } else if (codeOrError instanceof Error) {
            errorInfo = this.createErrorInfoFromError(codeOrError)
        } else {
            errorInfo = codeOrError
        }

        // 记录到控制台
        if (mergedOptions.logToConsole) {
            this.logError(errorInfo)
        }

        // 显示用户通知
        if (mergedOptions.showNotification) {
            this.showNotification(errorInfo)
        }

        // 显示消息提示
        if (mergedOptions.showMessage) {
            this.showMessage(errorInfo)
        }

        // 执行自定义处理
        if (mergedOptions.customHandler) {
            mergedOptions.customHandler(errorInfo)
        }

        // 执行回退策略
        if (mergedOptions.fallbackStrategy && !errorInfo.recoverable) {
            mergedOptions.fallbackStrategy()
        }

        return errorInfo
    }

    /**
     * 创建错误信息
     */
    private createErrorInfo(code: ErrorCode): ErrorInfo {
        const template = ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
        return {
            code,
            ...template
        }
    }

    /**
     * 从Error对象创建错误信息
     */
    private createErrorInfoFromError(error: Error): ErrorInfo {
        return {
            code: ERROR_CODES.UNKNOWN_ERROR,
            message: error.message || '未知错误',
            level: 'error',
            description: error.stack,
            recoverable: false,
            originalError: error
        }
    }

    /**
     * 记录错误到控制台
     */
    private logError(errorInfo: ErrorInfo): void {
        const logMethod = errorInfo.level === 'error' ? console.error : console.warn
        logMethod(`[${errorInfo.level.toUpperCase()}] ${errorInfo.code}: ${errorInfo.message}`, {
            description: errorInfo.description,
            suggestion: errorInfo.suggestion,
            originalError: errorInfo.originalError
        })
    }

    /**
     * 显示通知
     */
    private showNotification(errorInfo: ErrorInfo): void {
        const type = errorInfo.level === 'warning' ? 'warning' : 'error'
        
        ElNotification({
            title: errorInfo.message,
            message: errorInfo.description || errorInfo.suggestion,
            type,
            duration: errorInfo.level === 'error' ? 0 : 4500,
            showClose: true
        })
    }

    /**
     * 显示消息提示
     */
    private showMessage(errorInfo: ErrorInfo): void {
        const type = errorInfo.level === 'warning' ? 'warning' : 'error'
        
        ElMessage({
            message: errorInfo.message,
            type,
            duration: 3000,
            showClose: true
        })
    }

    /**
     * 设置默认选项
     */
    setDefaultOptions(options: Partial<ErrorHandlerOptions>): void {
        this.defaultOptions = { ...this.defaultOptions, ...options }
    }
}

// ============================================================================
// 便捷函数
// ============================================================================

export const errorHandler = ErrorHandler.getInstance()

/**
 * 处理输入验证错误
 */
export function handleValidationError(
    code: ErrorCode,
    options?: ErrorHandlerOptions
): ErrorInfo {
    return errorHandler.handle(code, {
        showMessage: true,
        showNotification: false,
        ...options
    })
}

/**
 * 处理逻辑错误
 */
export function handleLogicError(
    code: ErrorCode,
    options?: ErrorHandlerOptions
): ErrorInfo {
    return errorHandler.handle(code, {
        showNotification: true,
        showMessage: false,
        ...options
    })
}

/**
 * 处理系统错误
 */
export function handleSystemError(
    error: Error | ErrorCode,
    options?: ErrorHandlerOptions
): ErrorInfo {
    return errorHandler.handle(error, {
        showNotification: true,
        showMessage: true,
        ...options
    })
}
