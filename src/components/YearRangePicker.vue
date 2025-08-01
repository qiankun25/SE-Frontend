<template>
    <div class="year-range-picker">
        <div class="year-range-container">
            <!-- 起始年份选择器 -->
            <div class="year-selector">
                <label class="year-label">起始年份</label>
                <el-select v-model="startYear" placeholder="选择起始年份" clearable :disabled="disabled"
                    @change="handleStartYearChange" class="year-select">
                    <el-option v-for="year in availableStartYears" :key="year" :label="year + '年'" :value="year" />
                </el-select>
            </div>

            <!-- 分隔符 -->
            <div class="separator">至</div>

            <!-- 结束年份选择器 -->
            <div class="year-selector">
                <label class="year-label">结束年份</label>
                <el-select v-model="endYear" placeholder="选择结束年份" clearable :disabled="disabled"
                    @change="handleEndYearChange" class="year-select">
                    <el-option v-for="year in availableEndYears" :key="year" :label="year + '年'" :value="year" />
                </el-select>
            </div>
        </div>

        <!-- 快速选择连续年份范围 -->
        <div class="ts-quick-buttons" v-if="showQuickRange">
            <button v-for="range in quickRangeOptions" :key="range.key" type="button" class="ts-quick-button"
                @click="handleQuickRangeSelect(range)">
                {{ range.label }}
            </button>
        </div>

        <!-- 验证错误提示 -->
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

interface QuickRangeOption {
    key: string
    label: string
    startYear: number
    endYear: number
}

interface Props {
    modelValue?: TimeRange | null
    disabled?: boolean
    showQuickRange?: boolean
    minYear?: number
    maxYear?: number
    maxRangeSpan?: number
}

interface Emits {
    (e: 'update:modelValue', value: TimeRange | null): void
    (e: 'change', value: TimeRange | null): void
    (e: 'validation-change', isValid: boolean, message: string, level: ValidationLevel): void
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    showQuickRange: true,
    minYear: new Date().getFullYear() - 10,
    maxYear: new Date().getFullYear(),
    maxRangeSpan: 10
})

const emit = defineEmits<Emits>()

// 响应式数据
const startYear = ref<number | null>(null)
const endYear = ref<number | null>(null)
const validationMessage = ref<string>('')
const validationLevel = ref<ValidationLevel>('success')

// 计算可选的起始年份
const availableStartYears = computed(() => {
    const years = []
    for (let year = props.maxYear; year >= props.minYear; year--) {
        years.push(year)
    }
    return years
})

// 计算可选的结束年份（基于起始年份的限制）
const availableEndYears = computed(() => {
    const years = []
    const minEndYear = startYear.value || props.minYear
    const maxEndYear = startYear.value
        ? Math.min(props.maxYear, startYear.value + props.maxRangeSpan - 1)
        : props.maxYear

    for (let year = maxEndYear; year >= minEndYear; year--) {
        years.push(year)
    }
    return years
})

// 快速选择选项
const quickRangeOptions = computed<QuickRangeOption[]>(() => {
    const currentYear = new Date().getFullYear()
    return [
        {
            key: 'recent3years',
            label: '近3年',
            startYear: currentYear - 2,
            endYear: currentYear
        },
        {
            key: 'recent5years',
            label: '近5年',
            startYear: currentYear - 4,
            endYear: currentYear
        },
        {
            key: 'last5years',
            label: '前5年',
            startYear: currentYear - 5,
            endYear: currentYear - 1
        }
    ]
})

// 验证年份范围
const validateYearRange = () => {
    if (!startYear.value || !endYear.value) {
        validationMessage.value = ''
        validationLevel.value = 'success'
        emit('validation-change', true, '', 'success')
        return true
    }

    if (startYear.value > endYear.value) {
        validationMessage.value = '起始年份不能大于结束年份'
        validationLevel.value = 'error'
        emit('validation-change', false, validationMessage.value, 'error')
        return false
    }

    const yearSpan = endYear.value - startYear.value + 1
    if (yearSpan > props.maxRangeSpan) {
        validationMessage.value = `年份范围不能超过${props.maxRangeSpan}年`
        validationLevel.value = 'warning'
        emit('validation-change', false, validationMessage.value, 'warning')
        return false
    }

    validationMessage.value = '年份范围设置正确'
    validationLevel.value = 'success'
    emit('validation-change', true, validationMessage.value, 'success')
    return true
}

// 处理起始年份变化
const handleStartYearChange = (year: number | null) => {
    startYear.value = year

    // 如果结束年份小于起始年份，自动调整结束年份
    if (year && endYear.value && endYear.value < year) {
        endYear.value = year
    }

    validateYearRange()
    emitValue()
}

// 处理结束年份变化
const handleEndYearChange = (year: number | null) => {
    endYear.value = year

    // 如果起始年份大于结束年份，自动调整起始年份
    if (year && startYear.value && startYear.value > year) {
        startYear.value = year
    }

    validateYearRange()
    emitValue()
}

// 处理快速范围选择
const handleQuickRangeSelect = (range: QuickRangeOption) => {
    startYear.value = range.startYear
    endYear.value = range.endYear
    validateYearRange()
    emitValue()
}

// 发送值变化事件
const emitValue = () => {
    if (startYear.value && endYear.value) {
        const timeRange: TimeRange = {
            startDate: new Date(startYear.value, 0, 1), // 1月1日
            endDate: new Date(endYear.value, 11, 31),   // 12月31日
            unit: 'year'
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
        endYear.value = newValue.endDate.getFullYear()
    } else {
        startYear.value = null
        endYear.value = null
    }
    validateYearRange()
}, { immediate: true })

// 组件挂载时进行初始验证
onMounted(() => {
    validateYearRange()
})
</script>

<style scoped>
/* 导入设计系统样式 */
@import '../styles/time-selection-design-system.css';

.year-range-picker {
    width: 100%;
}

.year-range-container {
    display: flex;
    align-items: center;
    gap: var(--ts-spacing-padding);
    margin-bottom: var(--ts-spacing-padding);
}

.year-selector {
    display: flex;
    flex-direction: column;
    gap: var(--ts-spacing-small);
}

.year-label {
    font-size: var(--ts-font-size-small);
    color: var(--ts-color-text-secondary);
    font-weight: var(--ts-font-weight-body);
}

.year-select {
    width: 120px;
}

.separator {
    color: var(--ts-color-text-secondary);
    font-size: var(--ts-font-size-body);
    margin-top: var(--ts-spacing-large);
}

/* 快速范围选择按钮样式已在设计系统中定义 */

/* 响应式设计 */
@media (max-width: 768px) {
    .year-range-container {
        flex-direction: column;
        align-items: stretch;
        gap: var(--ts-spacing-element);
    }

    .year-selector {
        width: 100%;
    }

    .year-select {
        width: 100%;
    }

    .separator {
        text-align: center;
        margin-top: 0;
    }
}
</style>