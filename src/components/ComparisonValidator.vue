<template>
    <div class="comparison-validator" v-if="comparisonEnabled">
        <!-- 验证状态显示 -->
        <ValidationStatus :level="validationResult.level" :message="validationResult.message"
            :description="validationResult.suggestion" :show-actions="showCrossYearOptions"
            :show-continue="showCrossYearOptions" :show-reselect="showCrossYearOptions"
            @continue="handleContinueWithCrossYear" @reselect="handleReselectTime" />

        <!-- 实时验证提示 -->
        <div v-if="showRealTimeHint" class="real-time-hint">
            <div class="hint-icon">ℹ️</div>
            <div class="hint-text">同期比分析将对比相同时间段的不同年份数据</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, nextTick } from 'vue'
import type {
    TimeRange,
    ValidationResult
} from '../types/time-selection'
import { validateComparisonRange } from '../utils/time-selection-validation'
import ValidationStatus from './ValidationStatus.vue'

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    /** 时间范围 */
    timeRange: TimeRange | null
    /** 是否启用同期比 */
    comparisonEnabled: boolean
    /** 是否显示实时验证 */
    enableRealTimeValidation?: boolean
    /** 是否显示验证消息 */
    showValidationMessages?: boolean
    /** 是否显示实时提示 */
    showRealTimeHint?: boolean
}

interface Emits {
    /** 验证结果更新事件 */
    (e: 'validation-update', result: ValidationResult): void
    /** 用户选择继续跨年查询事件 */
    (e: 'continue-cross-year'): void
    /** 用户选择重新选择时间事件 */
    (e: 'reselect-time'): void
    /** 验证状态变化事件 */
    (e: 'validation-change', isValid: boolean, level: string): void
}

const props = withDefaults(defineProps<Props>(), {
    enableRealTimeValidation: true,
    showValidationMessages: true,
    showRealTimeHint: false
})

const emit = defineEmits<Emits>()

// ============================================================================
// Reactive State
// ============================================================================

/** 操作加载状态 */
const actionLoading = ref(false)

/** 是否显示跨年选择选项 */
const showCrossYearOptions = ref(false)

/** 上次验证的时间范围（用于检测变化） */
const lastValidatedRange = ref<string>('')

// ============================================================================
// Computed Properties
// ============================================================================

/** 验证结果 */
const validationResult = computed((): ValidationResult => {
    if (!props.comparisonEnabled) {
        return {
            isValid: true,
            level: 'success',
            message: ''
        }
    }

    return validateComparisonRange(props.timeRange, props.comparisonEnabled)
})

/** 是否为跨年警告 */
const isCrossYearWarning = computed((): boolean => {
    return validationResult.value.level === 'warning' &&
        validationResult.value.message.includes('同期比分析建议选择同一年份')
})

/** 时间范围的字符串表示（用于变化检测） */
const timeRangeString = computed((): string => {
    if (!props.timeRange?.startDate || !props.timeRange?.endDate) {
        return ''
    }
    return `${props.timeRange.startDate.getTime()}-${props.timeRange.endDate.getTime()}`
})

// ============================================================================
// Methods
// ============================================================================

/**
 * 处理继续跨年查询
 */
const handleContinueWithCrossYear = async (): Promise<void> => {
    actionLoading.value = true

    try {
        await nextTick()
        showCrossYearOptions.value = false
        emit('continue-cross-year')

        // 发送验证更新，标记为用户已确认的警告
        const confirmedResult: ValidationResult = {
            ...validationResult.value,
            message: '已确认跨年查询，请注意同期比分析结果的准确性',
            suggestion: undefined
        }
        emit('validation-update', confirmedResult)

    } finally {
        actionLoading.value = false
    }
}

/**
 * 处理重新选择时间
 */
const handleReselectTime = async (): Promise<void> => {
    actionLoading.value = true

    try {
        await nextTick()
        showCrossYearOptions.value = false
        emit('reselect-time')

    } finally {
        actionLoading.value = false
    }
}

/**
 * 更新跨年选择选项显示状态
 */
const updateCrossYearOptionsVisibility = (): void => {
    showCrossYearOptions.value = isCrossYearWarning.value && props.showValidationMessages
}

/**
 * 发送验证状态变化事件
 */
const emitValidationChange = (): void => {
    emit('validation-change', validationResult.value.isValid, validationResult.value.level)
}

// ============================================================================
// Watchers
// ============================================================================

/** 监听验证结果变化 */
watch(
    validationResult,
    (newResult, oldResult) => {
        // 发送验证更新事件
        if (props.enableRealTimeValidation) {
            emit('validation-update', newResult)
        }

        // 发送验证状态变化事件
        if (!oldResult ||
            newResult.isValid !== oldResult.isValid ||
            newResult.level !== oldResult.level) {
            emitValidationChange()
        }

        // 更新跨年选择选项显示
        updateCrossYearOptionsVisibility()
    },
    { immediate: true }
)

/** 监听时间范围变化进行实时验证 */
watch(
    timeRangeString,
    (newRange) => {
        if (props.enableRealTimeValidation && newRange !== lastValidatedRange.value) {
            lastValidatedRange.value = newRange

            // 重置跨年选择选项
            if (showCrossYearOptions.value) {
                showCrossYearOptions.value = false
            }
        }
    }
)

/** 监听同期比启用状态变化 */
watch(
    () => props.comparisonEnabled,
    (enabled) => {
        if (!enabled) {
            showCrossYearOptions.value = false
        } else {
            updateCrossYearOptionsVisibility()
        }
    }
)

// ============================================================================
// Lifecycle
// ============================================================================

// 组件挂载时进行初始验证
watch(
    () => props.comparisonEnabled,
    () => {
        if (props.comparisonEnabled) {
            emitValidationChange()
            updateCrossYearOptionsVisibility()
        }
    },
    { immediate: true }
)
</script>

<style scoped>
/* 导入设计系统样式 */
@import '../styles/time-selection-design-system.css';

.comparison-validator {
    margin-top: var(--ts-spacing-padding);
}

/* 实时提示 */
.real-time-hint {
    display: flex;
    align-items: center;
    gap: var(--ts-spacing-small);
    margin-top: var(--ts-spacing-element);
    padding: var(--ts-spacing-element) var(--ts-spacing-padding);
    background-color: var(--ts-color-bg-light);
    border-radius: var(--ts-border-radius);
    font-size: var(--ts-font-size-small);
    color: var(--ts-color-text-secondary);
}

.hint-icon {
    flex-shrink: 0;
    font-size: var(--ts-font-size-body);
}

.hint-text {
    line-height: 1.4;
}

/* 响应式设计和可访问性支持已在设计系统中定义 */
</style>