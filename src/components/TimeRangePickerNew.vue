<template>
    <div class="time-range-picker">
        <!-- 年份范围选择器 -->
        <YearRangePicker v-if="timeUnit === 'year'" v-model="timeRange" :disabled="disabled"
            :show-quick-range="showQuickRange" :min-year="minYear" :max-year="maxYear" :max-range-span="maxYearSpan"
            @change="handleTimeRangeChange" @validation-change="handleValidationChange" />

        <!-- 月份范围选择器 -->
        <MonthRangePicker v-else-if="timeUnit === 'month'" v-model="timeRange" :disabled="disabled"
            :show-quick-jump="showQuickJump" :min-year="minYear" :max-year="maxYear" :max-month-span="maxMonthSpan"
            @change="handleTimeRangeChange" @validation-change="handleValidationChange" />

        <!-- 日期范围选择器 -->
        <DateRangePicker v-else-if="timeUnit === 'day'" v-model="timeRange" :disabled="disabled" :clearable="clearable"
            :show-quick-dates="showQuickDates" :use-builtin-shortcuts="useBuiltinShortcuts" :max-days-span="maxDaysSpan"
            :allow-future-dates="allowFutureDates" :min-date="minDate" :max-date="maxDate"
            @change="handleTimeRangeChange" @validation-change="handleValidationChange" />

        <!-- 验证状态显示 -->
        <div class="validation-status" v-if="showValidationStatus && validationResult">
            <el-alert :title="validationResult.message" :type="validationResult.level" :closable="false" show-icon
                class="validation-alert" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import YearRangePicker from './YearRangePicker.vue'
import MonthRangePicker from './MonthRangePicker.vue'
import DateRangePicker from './DateRangePicker.vue'
import type { TimeRange, TimeUnit, ValidationLevel } from '../types/time-selection'

interface ValidationResult {
    isValid: boolean
    message: string
    level: ValidationLevel
}

interface Props {
    modelValue?: TimeRange | null
    timeUnit: TimeUnit
    disabled?: boolean
    clearable?: boolean
    showValidationStatus?: boolean

    // 年份选择器相关
    showQuickRange?: boolean
    minYear?: number
    maxYear?: number
    maxYearSpan?: number

    // 月份选择器相关
    showQuickJump?: boolean
    maxMonthSpan?: number

    // 日期选择器相关
    showQuickDates?: boolean
    useBuiltinShortcuts?: boolean
    maxDaysSpan?: number
    allowFutureDates?: boolean
    minDate?: Date
    maxDate?: Date
}

interface Emits {
    (e: 'update:modelValue', value: TimeRange | null): void
    (e: 'change', value: TimeRange | null): void
    (e: 'validation-change', result: ValidationResult): void
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    clearable: true,
    showValidationStatus: true,

    // 年份选择器默认值
    showQuickRange: true,
    minYear: new Date().getFullYear() - 10,
    maxYear: new Date().getFullYear(),
    maxYearSpan: 10,

    // 月份选择器默认值
    showQuickJump: true,
    maxMonthSpan: 24,

    // 日期选择器默认值
    showQuickDates: true,
    useBuiltinShortcuts: true,
    maxDaysSpan: 365,
    allowFutureDates: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const timeRange = ref<TimeRange | null>(null)
const validationResult = ref<ValidationResult | null>(null)

// 处理时间范围变化
const handleTimeRangeChange = (value: TimeRange | null) => {
    timeRange.value = value
    emit('update:modelValue', value)
    emit('change', value)
}

// 处理验证状态变化
const handleValidationChange = (isValid: boolean, message: string, level: ValidationLevel) => {
    const result: ValidationResult = {
        isValid,
        message,
        level
    }

    validationResult.value = result
    emit('validation-change', result)
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
    timeRange.value = newValue || null
}, { immediate: true })

// 监听时间单位变化，清空当前选择
watch(() => props.timeUnit, () => {
    timeRange.value = null
    validationResult.value = null
    emit('update:modelValue', null)
    emit('change', null)
    // 发送清空的验证状态
    emit('validation-change', {
        isValid: true,
        message: '',
        level: 'success'
    })
})
</script>

<style scoped>
.time-range-picker {
    width: 100%;
}

.validation-status {
    margin-top: 12px;
}

.validation-alert {
    font-size: 12px;
}
</style>