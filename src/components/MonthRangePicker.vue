<template>
    <div class="month-range-picker">
        <div class="month-range-container">
            <!-- 起始年月选择器 -->
            <div class="month-selector">
                <label class="month-label">起始时间</label>
                <div class="year-month-group">
                    <el-select v-model="startYear" placeholder="年份" clearable :disabled="disabled"
                        @change="handleStartYearChange" class="year-select">
                        <el-option v-for="year in availableYears" :key="year" :label="year + '年'" :value="year" />
                    </el-select>
                    <el-select v-model="startMonth" placeholder="月份" clearable :disabled="disabled"
                        @change="handleStartMonthChange" class="month-select">
                        <el-option v-for="month in availableMonths" :key="month" :label="month + '月'" :value="month" />
                    </el-select>
                </div>
            </div>

            <!-- 分隔符 -->
            <div class="separator">至</div>

            <!-- 结束年月选择器 -->
            <div class="month-selector">
                <label class="month-label">结束时间</label>
                <div class="year-month-group">
                    <el-select v-model="endYear" placeholder="年份" clearable :disabled="disabled"
                        @change="handleEndYearChange" class="year-select">
                        <el-option v-for="year in availableYears" :key="year" :label="year + '年'" :value="year" />
                    </el-select>
                    <el-select v-model="endMonth" placeholder="月份" clearable :disabled="disabled"
                        @change="handleEndMonthChange" class="month-select">
                        <el-option v-for="month in availableMonths" :key="month" :label="month + '月'" :value="month" />
                    </el-select>
                </div>
            </div>
        </div>

        <!-- 快捷跳转功能 -->
        <div class="ts-quick-buttons" v-if="showQuickJump">
            <button v-for="jump in quickJumpOptions" :key="jump.key" type="button" class="ts-quick-button"
                @click="handleQuickJump(jump)">
                {{ jump.label }}
            </button>
        </div>

        <!-- 验证提示 -->
        <div class="ts-validation" v-if="validationMessage" :class="validationLevel">
            <div class="ts-validation-icon">
                <svg v-if="validationLevel === 'success'" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <svg v-else-if="validationLevel === 'warning'" viewBox="0 0 24 24">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </div>
            <div class="ts-validation-message">
                <div class="ts-validation-title">{{ validationMessage }}</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import type { TimeRange, ValidationLevel } from '../types/time-selection'

interface QuickJumpOption {
    key: string
    label: string
    startYear: number
    startMonth: number
    endYear: number
    endMonth: number
}

interface Props {
    modelValue?: TimeRange | null
    disabled?: boolean
    showQuickJump?: boolean
    minYear?: number
    maxYear?: number
    maxMonthSpan?: number
}

interface Emits {
    (e: 'update:modelValue', value: TimeRange | null): void
    (e: 'change', value: TimeRange | null): void
    (e: 'validation-change', isValid: boolean, message: string, level: ValidationLevel): void
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    showQuickJump: true,
    minYear: new Date().getFullYear() - 5,
    maxYear: new Date().getFullYear(),
    maxMonthSpan: 24 // 最大24个月跨度
})

const emit = defineEmits<Emits>()

// 响应式数据
const startYear = ref<number | null>(null)
const startMonth = ref<number | null>(null)
const endYear = ref<number | null>(null)
const endMonth = ref<number | null>(null)
const validationMessage = ref<string>('')
const validationLevel = ref<ValidationLevel>('success')

// 计算可选年份
const availableYears = computed(() => {
    const years = []
    for (let year = props.maxYear; year >= props.minYear; year--) {
        years.push(year)
    }
    return years
})

// 计算可选月份
const availableMonths = computed(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1)
})

// 快捷跳转选项
const quickJumpOptions = computed<QuickJumpOption[]>(() => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    return [
        {
            key: 'thisYear',
            label: '本年度',
            startYear: currentYear,
            startMonth: 1,
            endYear: currentYear,
            endMonth: 12
        },
        {
            key: 'lastYear',
            label: '去年',
            startYear: currentYear - 1,
            startMonth: 1,
            endYear: currentYear - 1,
            endMonth: 12
        },
        {
            key: 'recent6months',
            label: '近6个月',
            startYear: currentMonth <= 6 ? currentYear - 1 : currentYear,
            startMonth: currentMonth <= 6 ? currentMonth + 6 : currentMonth - 6,
            endYear: currentYear,
            endMonth: currentMonth
        },
        {
            key: 'recent12months',
            label: '近12个月',
            startYear: currentYear - 1,
            startMonth: currentMonth,
            endYear: currentYear,
            endMonth: currentMonth - 1 || 12
        }
    ]
})

// 计算月份总数差异
const calculateMonthDifference = (
    startY: number, startM: number,
    endY: number, endM: number
): number => {
    return (endY - startY) * 12 + (endM - startM) + 1
}

// 验证月份范围
const validateMonthRange = () => {
    if (!startYear.value || !startMonth.value || !endYear.value || !endMonth.value) {
        validationMessage.value = ''
        validationLevel.value = 'success'
        emit('validation-change', true, '', 'success')
        return true
    }

    // 检查起始时间是否大于结束时间
    const startDate = new Date(startYear.value, startMonth.value - 1, 1)
    const endDate = new Date(endYear.value, endMonth.value - 1, 1)

    if (startDate > endDate) {
        validationMessage.value = '起始时间不能大于结束时间'
        validationLevel.value = 'error'
        emit('validation-change', false, validationMessage.value, 'error')
        return false
    }

    // 检查月份跨度
    const monthSpan = calculateMonthDifference(
        startYear.value, startMonth.value,
        endYear.value, endMonth.value
    )

    if (monthSpan > props.maxMonthSpan) {
        validationMessage.value = `月份范围不能超过${props.maxMonthSpan}个月`
        validationLevel.value = 'warning'
        emit('validation-change', false, validationMessage.value, 'warning')
        return false
    }

    // 跨年提示
    if (startYear.value !== endYear.value) {
        validationMessage.value = '已选择跨年月份范围，请确认是否正确'
        validationLevel.value = 'warning'
        emit('validation-change', true, validationMessage.value, 'warning')
        return true
    }

    validationMessage.value = '月份范围设置正确'
    validationLevel.value = 'success'
    emit('validation-change', true, validationMessage.value, 'success')
    return true
}

// 处理起始年份变化
const handleStartYearChange = (year: number | null) => {
    startYear.value = year
    validateMonthRange()
    emitValue()
}

// 处理起始月份变化
const handleStartMonthChange = (month: number | null) => {
    startMonth.value = month
    validateMonthRange()
    emitValue()
}

// 处理结束年份变化
const handleEndYearChange = (year: number | null) => {
    endYear.value = year
    validateMonthRange()
    emitValue()
}

// 处理结束月份变化
const handleEndMonthChange = (month: number | null) => {
    endMonth.value = month
    validateMonthRange()
    emitValue()
}

// 处理快捷跳转
const handleQuickJump = (jump: QuickJumpOption) => {
    startYear.value = jump.startYear
    startMonth.value = jump.startMonth
    endYear.value = jump.endYear
    endMonth.value = jump.endMonth
    validateMonthRange()
    emitValue()
}

// 发送值变化事件
const emitValue = () => {
    if (startYear.value && startMonth.value && endYear.value && endMonth.value) {
        const timeRange: TimeRange = {
            startDate: new Date(startYear.value, startMonth.value - 1, 1), // 月份第一天
            endDate: new Date(endYear.value, endMonth.value, 0),           // 月份最后一天
            unit: 'month'
        }
        emit('update:modelValue', timeRange)
        emit('change', timeRange)
    } else {
        emit('update:modelValue', null)
        emit('change', null)
    }
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
    if (newValue && newValue.startDate && newValue.endDate) {
        startYear.value = newValue.startDate.getFullYear()
        startMonth.value = newValue.startDate.getMonth() + 1
        endYear.value = newValue.endDate.getFullYear()
        endMonth.value = newValue.endDate.getMonth() + 1
    } else {
        startYear.value = null
        startMonth.value = null
        endYear.value = null
        endMonth.value = null
    }
    validateMonthRange()
}, { immediate: true })

// 组件挂载时进行初始验证
onMounted(() => {
    validateMonthRange()
})
</script>

<style scoped>
/* 导入设计系统样式 */
@import '../styles/time-selection-design-system.css';

.month-range-picker {
    width: 100%;
}

.month-range-container {
    display: flex;
    align-items: center;
    gap: var(--ts-spacing-component);
    margin-bottom: var(--ts-spacing-padding);
}

.month-selector {
    display: flex;
    flex-direction: column;
    gap: var(--ts-spacing-small);
}

.month-label {
    font-size: var(--ts-font-size-small);
    color: var(--ts-color-text-secondary);
    font-weight: var(--ts-font-weight-body);
}

.year-month-group {
    display: flex;
    gap: var(--ts-spacing-element);
    align-items: center;
}

.year-select {
    width: 100px;
}

.month-select {
    width: 80px;
}

.separator {
    color: var(--ts-color-text-secondary);
    font-size: var(--ts-font-size-body);
    margin-top: var(--ts-spacing-large);
}

/* 快捷跳转按钮样式已在设计系统中定义 */

/* 响应式设计 */
@media (max-width: 768px) {
    .month-range-container {
        flex-direction: column;
        align-items: stretch;
        gap: var(--ts-spacing-padding);
    }

    .month-selector {
        width: 100%;
    }

    .year-month-group {
        justify-content: space-between;
    }

    .year-select,
    .month-select {
        flex: 1;
    }

    .separator {
        text-align: center;
        margin-top: 0;
    }
}
</style>