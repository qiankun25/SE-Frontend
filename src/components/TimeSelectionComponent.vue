<template>
    <div
        ref="containerRef"
        class="ts-container"
        :class="[
            `ts-size-${size}`,
            { 'ts-disabled': disabled, 'ts-mobile': isMobile, 'ts-high-contrast': isHighContrast }
        ]"
        role="region"
        :aria-label="title || '时间选择'"
        :aria-describedby="showHelp ? 'time-selection-help' : undefined"
    >
        <!-- 组件标题 -->
        <div v-if="showTitle" class="ts-section-title">
            <h3 class="ts-title">{{ title }}</h3>
            <el-tooltip v-if="showHelp" :content="helpText" placement="top">
                <el-icon class="ts-help-icon">
                    <QuestionFilled />
                </el-icon>
            </el-tooltip>
        </div>

        <!-- 快捷选择面板 -->
        <div class="selection-section">
            <QuickSelectionPanel v-model="state.quickSelection"
                :show-description="config.quickSelection.showCustomOption"
                :show-custom-option="config.quickSelection.showCustomOption"
                :show-statistics-suggestion="config.showStatisticsSuggestion" :disabled="disabled" :size="size"
                @option-select="handleQuickOptionSelect" @custom-select="handleCustomSelect"
                @option-hover="handleQuickOptionHover" />
        </div>

        <!-- 时间单位选择器 -->
        <div class="selection-section">
            <TimeUnitSelector v-model="state.timeUnit" :disabled="disabled" :available-units="availableTimeUnits"
                :show-debug-info="showDebugInfo" @change="handleTimeUnitChange"
                @picker-type-change="handlePickerTypeChange" />
        </div>

        <!-- 时间范围选择器 -->
        <div class="selection-section">
            <TimeRangePickerNew v-model="state.timeRange" :time-unit="state.timeUnit" :disabled="disabled"
                :clearable="clearable" :show-validation-status="config.validation.showValidationMessages"
                v-bind="timeRangePickerProps" @change="handleTimeRangeChange"
                @validation-change="handleTimeRangeValidation" />
        </div>

        <!-- 同期比验证器 -->
        <div v-if="config.showComparison" class="selection-section">
            <div class="comparison-section">
                <el-checkbox v-model="state.comparisonEnabled" :disabled="disabled" @change="(val: boolean) => handleComparisonToggle(val)">
                    启用同期比分析
                </el-checkbox>

                <ComparisonValidator v-if="state.comparisonEnabled" :time-range="state.timeRange"
                    :comparison-enabled="state.comparisonEnabled"
                    :enable-real-time-validation="config.validation.enableRealTimeValidation"
                    :show-validation-messages="config.validation.showValidationMessages"
                    :show-real-time-hint="showComparisonHint" @validation-update="handleComparisonValidation"
                    @continue-cross-year="handleContinueCrossYear" @reselect-time="handleReselectTime"
                    @validation-change="handleComparisonValidationChange" />
            </div>
        </div>

        <!-- 统计模式建议器 -->
        <div v-if="config.showStatisticsSuggestion" class="selection-section">
            <StatisticsModeSuggester data-testid="statistics-mode-suggester" :time-range="state.timeRange"
                :current-mode="state.statisticsMode" :show-suggestion="config.showStatisticsSuggestion"
                :auto-apply="autoApplyStatisticsSuggestion" :time-selection-state="state"
                @mode-change="handleStatisticsModeChange" @yearly-grouping-change="handleYearlyGroupingChange"
                @suggestion-applied="handleSuggestionApplied" @suggestion-dismissed="handleSuggestionDismissed" />
        </div>

        <!-- 整体验证状态显示 -->
        <div v-if="showOverallValidation && overallValidation" class="overall-validation">
            <el-alert :title="overallValidation.message" :type="overallValidation.level" :closable="false" show-icon
                class="validation-alert" />
        </div>

        <!-- 调试信息面板 -->
        <div v-if="showDebugInfo" class="debug-panel">
            <el-collapse>
                <el-collapse-item title="调试信息" name="debug">
                    <div class="debug-content">
                        <h4>当前状态:</h4>
                        <pre>{{ JSON.stringify(state, null, 2) }}</pre>

                        <h4>查询参数:</h4>
                        <pre>{{ JSON.stringify(queryParams, null, 2) }}</pre>

                        <h4>组件配置:</h4>
                        <pre>{{ JSON.stringify(config, null, 2) }}</pre>
                    </div>
                </el-collapse-item>
            </el-collapse>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElCheckbox, ElTooltip, ElIcon, ElAlert, ElCollapse, ElCollapseItem } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'

// 导入子组件
import QuickSelectionPanel from './QuickSelectionPanel.vue'
import TimeUnitSelector from './TimeUnitSelector.vue'
import TimeRangePickerNew from './TimeRangePickerNew.vue'
import ComparisonValidator from './ComparisonValidator.vue'
import StatisticsModeSuggester from './StatisticsModeSuggester.vue'

// 导入工具函数
import { errorHandler, handleValidationError, handleLogicError, handleSystemError, ERROR_CODES } from '../utils/error-handler'
import { useDebounce, createValidationDebounce } from '../utils/debounce'
import { useKeyboardNavigation, useScreenReader, useTheme, useAria, KEYBOARD_KEYS } from '../utils/accessibility'

// 导入类型和配置
import type {
    TimeSelectionState,
    TimeSelectionConfig,
    TimeSelectionChangeEvent,
    TimeSelectionChangeType,
    TimeSelectionEventSource,
    ValidationResult,
    QuickOption,
    TimeUnit,
    TimeUnitConfig,
    TimeRange,
    StatisticsMode,
    QueryParams
} from '../types/time-selection'

import { TIME_SELECTION_CONFIG, getQuickOptionByKey } from '../config/time-selection'
import { ParameterMapper } from '../utils/parameter-mapper'

// ============================================================================
// Props 定义
// ============================================================================

interface Props {
    /** 当前时间选择状态 */
    modelValue?: TimeSelectionState
    /** 组件配置 */
    config?: Partial<TimeSelectionConfig>
    /** 是否禁用整个组件 */
    disabled?: boolean
    /** 组件大小 */
    size?: 'large' | 'default' | 'small'
    /** 是否显示标题 */
    showTitle?: boolean
    /** 组件标题 */
    title?: string
    /** 是否显示帮助图标 */
    showHelp?: boolean
    /** 帮助文本 */
    helpText?: string
    /** 是否显示整体验证状态 */
    showOverallValidation?: boolean
    /** 是否显示调试信息 */
    showDebugInfo?: boolean
    /** 是否可清空 */
    clearable?: boolean
    /** 可用的时间单位 */
    availableTimeUnits?: TimeUnit[]
    /** 是否自动应用统计建议 */
    autoApplyStatisticsSuggestion?: boolean
    /** 是否显示同期比提示 */
    showComparisonHint?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    size: 'default',
    showTitle: true,
    title: '时间选择',
    showHelp: true,
    helpText: '选择查询的时间范围和统计方式',
    showOverallValidation: true,
    showDebugInfo: false,
    clearable: true,
    availableTimeUnits: () => ['year', 'month', 'day'],
    autoApplyStatisticsSuggestion: false,
    showComparisonHint: false
})

// ============================================================================
// Emits 定义
// ============================================================================

interface Emits {
    /** 状态更新事件 */
    (e: 'update:modelValue', value: TimeSelectionState): void
    /** 时间选择变更事件 */
    (e: 'change', event: TimeSelectionChangeEvent): void
    /** 查询参数更新事件 */
    (e: 'query-params-update', params: QueryParams): void
    /** 验证状态变更事件 */
    (e: 'validation-change', result: ValidationResult): void
    /** 快捷选项选择事件 */
    (e: 'quick-option-select', option: QuickOption): void
    /** 自定义选择事件 */
    (e: 'custom-select'): void
    /** 时间单位变更事件 */
    (e: 'time-unit-change', unit: TimeUnit, config: TimeUnitConfig): void
    /** 时间范围变更事件 */
    (e: 'time-range-change', range: TimeRange | null): void
    /** 同期比状态变更事件 */
    (e: 'comparison-toggle', enabled: boolean): void
    /** 统计模式变更事件 */
    (e: 'statistics-mode-change', mode: StatisticsMode): void
    /** 重置事件 */
    (e: 'reset'): void
    /** 错误事件 */
    (e: 'error', error: Error): void
}

const emit = defineEmits<Emits>()

// ============================================================================
// 响应式数据
// ============================================================================

/** 组件内部状态 */
const state = ref<TimeSelectionState>({
    quickSelection: null,
    timeUnit: 'day',
    timeRange: null,
    comparisonEnabled: false,
    statisticsMode: 'total',
    validation: {
        isValid: true,
        level: 'success',
        message: ''
    }
})

/** 参数映射器实例 */
const parameterMapper = new ParameterMapper()

/** 是否为移动端 */
const isMobile = ref(false)

/** 年度分组启用状态 */
const yearlyGroupingEnabled = ref(false)

/** 错误状态 */
const errorState = ref<{
    hasError: boolean
    errorInfo: any
    lastErrorTime: number
}>({
    hasError: false,
    errorInfo: null,
    lastErrorTime: 0
})

/** 防抖处理的验证函数 */
const { debouncedFunc: debouncedValidation } = useDebounce(
    (newState: TimeSelectionState) => {
        try {
            validateState(newState)
        } catch (error) {
            handleComponentError(error as Error)
        }
    },
    300
)

/** 防抖处理的查询参数更新函数 */
const { debouncedFunc: debouncedQueryParamsUpdate } = useDebounce(
    (params: QueryParams) => {
        try {
            emit('query-params-update', params)
        } catch (error) {
            handleComponentError(error as Error)
        }
    },
    500
)

// ============================================================================
// 可访问性支持
// ============================================================================

/** 容器引用 */
const containerRef = ref<HTMLElement | null>(null)

/** 键盘导航支持 */
const { focusManager } = useKeyboardNavigation(containerRef, [
    {
        key: KEYBOARD_KEYS.ESCAPE,
        handler: () => {
            // ESC键重置选择
            reset()
            announce('时间选择已重置', 'polite')
        }
    },
    {
        key: KEYBOARD_KEYS.ENTER,
        handler: (event) => {
            // 回车键确认选择
            const target = event.target as HTMLElement
            if (target.tagName === 'BUTTON') {
                target.click()
            }
        }
    }
])

/** 屏幕阅读器支持 */
const { announce } = useScreenReader()

/** 主题支持 */
const { currentTheme, isHighContrast, prefersReducedMotion } = useTheme()

/** ARIA 管理 */
const { ariaManager } = useAria(containerRef)

// ============================================================================
// 计算属性
// ============================================================================

/** 合并后的配置 */
const config = computed<TimeSelectionConfig>(() => {
    return {
        ...TIME_SELECTION_CONFIG,
        ...props.config
    }
})

/** 当前查询参数 */
const queryParams = computed<QueryParams>(() => {
    return parameterMapper.mapToQueryParams(state.value)
})

/** 整体验证结果 */
const overallValidation = computed<ValidationResult | null>(() => {
    if (!props.showOverallValidation) return null

    // 如果有任何验证失败，显示整体验证状态
    if (!state.value.validation.isValid) {
        return state.value.validation
    }

    return null
})

/** 时间范围选择器的属性 */
const timeRangePickerProps = computed(() => {
    const baseProps = {
        clearable: props.clearable
    }

    // 根据时间单位添加特定属性
    switch (state.value.timeUnit) {
        case 'year':
            return {
                ...baseProps,
                showQuickRange: true,
                minYear: new Date().getFullYear() - 10,
                maxYear: new Date().getFullYear(),
                maxYearSpan: 10
            }
        case 'month':
            return {
                ...baseProps,
                showQuickJump: true,
                maxMonthSpan: 24
            }
        case 'day':
            return {
                ...baseProps,
                showQuickDates: true,
                useBuiltinShortcuts: true,
                maxDaysSpan: 365,
                allowFutureDates: false
            }
        default:
            return baseProps
    }
})

// ============================================================================
// 事件处理函数
// ============================================================================

/**
 * 处理快捷选项选择
 */
function handleQuickOptionSelect(option: QuickOption) {
    const previousState = { ...state.value }

    // 更新状态
    state.value.quickSelection = option.key

    // 如果快捷选项有时间范围，应用它
    if (option.timeRange) {
        state.value.timeRange = { ...option.timeRange }
        state.value.timeUnit = option.timeRange.unit
    }

    // 如果有推荐的统计模式，应用它
    if (option.statisticsMode) {
        state.value.statisticsMode = option.statisticsMode
    }

    // 发送事件
    emitStateChange(previousState, 'quick_selection', 'quick_panel')
    emit('quick-option-select', option)

    // 屏幕阅读器公告
    announce(`已选择${option.label}`, 'polite')
}

/**
 * 处理自定义选择
 */
function handleCustomSelect() {
    const previousState = { ...state.value }

    state.value.quickSelection = 'custom'

    emitStateChange(previousState, 'quick_selection', 'quick_panel')
    emit('custom-select')

    // 屏幕阅读器公告
    announce('已选择自定义时间范围', 'polite')
}

/**
 * 处理快捷选项悬停
 */
function handleQuickOptionHover(option: QuickOption | null) {
    // 可以在这里添加悬停预览逻辑
}

/**
 * 处理时间单位变更
 */
function handleTimeUnitChange(unit: TimeUnit, unitConfig: TimeUnitConfig) {
    const previousState = { ...state.value }

    state.value.timeUnit = unit
    // 切换时间单位时清空时间范围
    state.value.timeRange = null
    // 清空快捷选择
    state.value.quickSelection = null

    emitStateChange(previousState, 'time_unit', 'unit_selector')
    emit('time-unit-change', unit, unitConfig)

    // 屏幕阅读器公告
    const unitLabels = { year: '年', month: '月', day: '日' }
    announce(`时间单位已切换为${unitLabels[unit]}`, 'polite')
}

/**
 * 处理选择器类型变更
 */
function handlePickerTypeChange(pickerType: 'year' | 'month' | 'date', unitConfig: TimeUnitConfig) {
    // 这里可以添加选择器界面调整逻辑
    console.log('[TimeSelectionComponent] 选择器类型变更:', pickerType, unitConfig)
}

/**
 * 处理时间范围变更
 */
function handleTimeRangeChange(range: TimeRange | null) {
    const previousState = { ...state.value }

    state.value.timeRange = range
    // 只有在不是通过快捷选择设置的时候才设置为custom
    if (range && !state.value.quickSelection) {
        state.value.quickSelection = 'custom'
    }

    emitStateChange(previousState, 'time_range', 'range_picker')
    emit('time-range-change', range)
}

/**
 * 处理时间范围验证
 */
function handleTimeRangeValidation(result: { isValid: boolean; message: string; level: string }) {
    try {
        // 更新验证状态
        state.value.validation = {
            isValid: result.isValid,
            level: result.level as any,
            message: result.message
        }

        // 根据验证结果处理错误
        if (!result.isValid) {
            if (result.level === 'error') {
                handleValidationError(ERROR_CODES.INVALID_DATE_RANGE, {
                    showMessage: true,
                    showNotification: false
                })
            } else if (result.level === 'warning') {
                handleLogicError(ERROR_CODES.CROSS_YEAR_COMPARISON, {
                    showNotification: true,
                    showMessage: false
                })
            }
        }

        emit('validation-change', state.value.validation)
    } catch (error) {
        handleComponentError(error as Error)
    }
}

/**
 * 处理同期比切换
 */
function handleComparisonToggle(enabled: boolean) {
    const previousState = { ...state.value }

    state.value.comparisonEnabled = enabled

    emitStateChange(previousState, 'comparison_toggle', 'comparison_validator')
    emit('comparison-toggle', enabled)
}

/**
 * 处理同期比验证
 */
function handleComparisonValidation(result: ValidationResult) {
    state.value.validation = result
    emit('validation-change', result)
}

/**
 * 处理继续跨年查询
 */
function handleContinueCrossYear() {
    // 用户确认继续跨年查询，可以在这里添加相关逻辑
    console.log('[TimeSelectionComponent] 用户确认继续跨年查询')
}

/**
 * 处理重新选择时间
 */
function handleReselectTime() {
    // 清空时间范围，让用户重新选择
    state.value.timeRange = null
    state.value.quickSelection = null

    emit('time-range-change', null)
}

/**
 * 处理同期比验证状态变更
 */
function handleComparisonValidationChange(isValid: boolean, level: string) {
    // 这里可以添加额外的验证状态处理逻辑
}

/**
 * 处理统计模式变更
 */
function handleStatisticsModeChange(mode: StatisticsMode) {
    const previousState = { ...state.value }

    state.value.statisticsMode = mode

    emitStateChange(previousState, 'statistics_mode', 'statistics_suggester')
    emit('statistics-mode-change', mode)
}

/**
 * 处理年度分组变更
 */
function handleYearlyGroupingChange(enabled: boolean) {
    yearlyGroupingEnabled.value = enabled
    // 可以在这里添加年度分组相关逻辑
}

/**
 * 处理建议应用
 */
function handleSuggestionApplied(suggestion: any) {
    console.log('[TimeSelectionComponent] 统计建议已应用:', suggestion)
}

/**
 * 处理建议忽略
 */
function handleSuggestionDismissed() {
    console.log('[TimeSelectionComponent] 统计建议已忽略')
}

/**
 * 发送状态变更事件
 */
function emitStateChange(
    previousState: TimeSelectionState,
    changeType: TimeSelectionChangeType,
    source: TimeSelectionEventSource
) {
    const changeEvent: TimeSelectionChangeEvent = {
        previousState,
        currentState: { ...state.value },
        changeType,
        source
    }

    emit('update:modelValue', state.value)
    emit('change', changeEvent)
    emit('query-params-update', queryParams.value)
}

// ============================================================================
// 公共方法
// ============================================================================

/**
 * 重置组件状态
 */
function reset() {
    const previousState = { ...state.value }

    state.value = {
        quickSelection: null,
        timeUnit: config.value.defaultTimeUnit,
        timeRange: null,
        comparisonEnabled: false,
        statisticsMode: 'total',
        validation: {
            isValid: true,
            level: 'success',
            message: ''
        }
    }

    yearlyGroupingEnabled.value = false

    emitStateChange(previousState, 'quick_selection', 'external')
    emit('reset')
}

/**
 * 设置时间选择状态
 */
function setState(newState: Partial<TimeSelectionState>) {
    const previousState = { ...state.value }

    Object.assign(state.value, newState)

    emitStateChange(previousState, 'quick_selection', 'external')
}

/**
 * 获取当前状态
 */
function getState(): TimeSelectionState {
    return { ...state.value }
}

/**
 * 获取查询参数
 */
function getQueryParams(): QueryParams {
    return queryParams.value
}

/**
 * 验证当前状态
 */
function validate(): ValidationResult {
    try {
        return validateState(state.value)
    } catch (error) {
        handleComponentError(error as Error)
        return {
            isValid: false,
            level: 'error',
            message: '验证过程中发生错误'
        }
    }
}

/**
 * 验证状态函数
 */
function validateState(currentState: TimeSelectionState): ValidationResult {
    // 检查时间范围有效性
    if (currentState.timeRange) {
        const { startDate, endDate } = currentState.timeRange

        if (startDate && endDate && startDate > endDate) {
            throw new Error('结束时间不能早于开始时间')
        }

        // 检查未来日期
        const now = new Date()
        if (endDate && endDate > now) {
            handleValidationError(ERROR_CODES.FUTURE_DATE_NOT_ALLOWED)
        }

        // 检查跨年同期比
        if (currentState.comparisonEnabled && startDate && endDate) {
            if (startDate.getFullYear() !== endDate.getFullYear()) {
                return {
                    isValid: true,
                    level: 'warning',
                    message: '跨年同期比提醒'
                }
            }
        }
    }

    return currentState.validation
}

/**
 * 处理组件错误
 */
function handleComponentError(error: Error) {
    errorState.value = {
        hasError: true,
        errorInfo: error,
        lastErrorTime: Date.now()
    }

    handleSystemError(error, {
        customHandler: (errorInfo) => {
            console.error('[TimeSelectionComponent] 组件错误:', errorInfo)
        },
        fallbackStrategy: () => {
            // 重置组件状态作为回退策略
            reset()
        }
    })

    emit('error', error)
}

/**
 * 清除错误状态
 */
function clearError() {
    errorState.value = {
        hasError: false,
        errorInfo: null,
        lastErrorTime: 0
    }
}

// ============================================================================
// 响应式处理
// ============================================================================

/**
 * 检测移动端
 */
function checkMobile() {
    isMobile.value = window.innerWidth < 768
}

/**
 * 窗口大小变化处理
 */
function handleResize() {
    checkMobile()
}

// ============================================================================
// 监听器
// ============================================================================

/** 监听外部状态变化 */
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        state.value = { ...newValue }
    }
}, { immediate: true, deep: true })

/** 监听配置变化 */
watch(() => props.config, () => {
    // 配置变化时可能需要重新验证或调整状态
    try {
        debouncedValidation(state.value)
    } catch (error) {
        handleComponentError(error as Error)
    }
}, { deep: true })

/** 监听状态变化，进行防抖验证 */
watch(() => state.value, (newState) => {
    try {
        // 清除之前的错误状态
        if (errorState.value.hasError) {
            clearError()
        }

        // 防抖验证
        debouncedValidation(newState)

        // 防抖更新查询参数
        debouncedQueryParamsUpdate(queryParams.value)
    } catch (error) {
        handleComponentError(error as Error)
    }
}, { deep: true })

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
    try {
        // 初始化移动端检测
        checkMobile()
        window.addEventListener('resize', handleResize)

        // 如果有初始值，应用它
        if (props.modelValue) {
            state.value = { ...props.modelValue }
        } else {
            // 应用默认配置
            state.value.timeUnit = config.value.defaultTimeUnit

            // 如果有默认快捷选项，应用它
            const defaultOption = config.value.quickSelection.defaultOption
            if (defaultOption) {
                const option = getQuickOptionByKey(defaultOption)
                if (option) {
                    nextTick(() => {
                        try {
                            handleQuickOptionSelect(option)
                        } catch (error) {
                            handleComponentError(error as Error)
                        }
                    })
                }
            }
        }

        // 初始验证
        debouncedValidation(state.value)

        console.log('[TimeSelectionComponent] 组件已挂载', {
            state: state.value,
            config: config.value,
            isMobile: isMobile.value
        })
    } catch (error) {
        handleSystemError(error as Error, {
            customHandler: () => {
                console.error('[TimeSelectionComponent] 组件初始化失败:', error)
            }
        })
    }
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})

// ============================================================================
// 暴露给父组件的方法
// ============================================================================

defineExpose({
    reset,
    setState,
    getState,
    getQueryParams,
    validate,
    clearError,
    handleComponentError,
    state: computed(() => state.value),
    queryParams: computed(() => queryParams.value),
    config: computed(() => config.value),
    errorState: computed(() => errorState.value)
})
</script>

<style scoped>
/* 导入设计系统样式 */
@import '../styles/time-selection-design-system.css';

/* 主容器样式 - 使用设计系统类名 */
.ts-container {
    /* 基础样式已在设计系统中定义 */
}

/* 尺寸变体 */
.ts-container.ts-size-large {
    padding: var(--ts-spacing-xlarge);
}

.ts-container.ts-size-large .ts-title {
    font-size: 18px;
}

.ts-container.ts-size-large .ts-section {
    margin-bottom: var(--ts-spacing-xlarge);
}

.ts-container.ts-size-small {
    padding: var(--ts-spacing-component);
}

.ts-container.ts-size-small .ts-title {
    font-size: 14px;
}

.ts-container.ts-size-small .ts-section {
    margin-bottom: var(--ts-spacing-component);
}

/* 选择区域 */
.selection-section {
    margin-bottom: var(--ts-spacing-component);
}

.selection-section:last-child {
    margin-bottom: 0;
}

/* 同期比区域 */
.comparison-section {
    display: flex;
    flex-direction: column;
    gap: var(--ts-spacing-padding);
}

/* 整体验证状态 */
.overall-validation {
    margin-top: var(--ts-spacing-component);
    padding-top: var(--ts-spacing-component);
    border-top: 1px solid var(--ts-color-border-light);
}

.validation-alert {
    border-radius: var(--ts-border-radius-large);
}

/* 调试面板 */
.debug-panel {
    margin-top: var(--ts-spacing-large);
    padding-top: var(--ts-spacing-component);
    border-top: 1px solid var(--ts-color-border-light);
}

.debug-content {
    font-family: 'Courier New', monospace;
    font-size: var(--ts-font-size-small);
    line-height: 1.4;
}

.debug-content h4 {
    font-size: 13px;
    font-weight: var(--ts-font-weight-title);
    color: var(--ts-color-text);
    margin: var(--ts-spacing-padding) 0 var(--ts-spacing-element) 0;
}

.debug-content pre {
    background-color: var(--ts-color-bg-light);
    padding: var(--ts-spacing-element);
    border-radius: var(--ts-border-radius);
    border: 1px solid var(--ts-color-border);
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
}

/* 禁用状态 */
.ts-container.ts-disabled {
    opacity: 0.6;
    pointer-events: none;
    background-color: var(--ts-color-bg-light);
}

/* 移动端适配 */
.ts-container.ts-mobile {
    padding: var(--ts-spacing-component);
    border-radius: 0;
    border-left: none;
    border-right: none;
}

.ts-container.ts-mobile .ts-section-title {
    margin-bottom: var(--ts-spacing-component);
    padding-bottom: var(--ts-spacing-element);
}

.ts-container.ts-mobile .ts-title {
    font-size: 15px;
}

.ts-container.ts-mobile .selection-section {
    margin-bottom: var(--ts-spacing-component);
}

/* 响应式设计 - 组件特定的响应式样式 */
@media (max-width: 768px) {
    .ts-section-title {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--ts-spacing-element);
    }

    .selection-section {
        margin-bottom: var(--ts-spacing-component);
    }
}

@media (max-width: 480px) {
    .selection-section {
        margin-bottom: var(--ts-spacing-padding);
    }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
    .ts-container {
        border-width: 2px;
        border-color: #000;
    }

    .ts-section-title {
        border-bottom-width: 2px;
        border-bottom-color: #000;
    }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
    .ts-container * {
        transition: none !important;
        animation: none !important;
    }
}

/* 打印样式 */
@media print {
    .ts-container {
        box-shadow: none;
        border: 1px solid #000;
    }

    .debug-panel {
        display: none;
    }
}
</style>