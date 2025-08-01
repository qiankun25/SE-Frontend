<template>
    <div class="date-range-picker">
        <div class="date-picker-container">
            <!-- Element Plus 日期范围选择器 -->
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
                end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" :clearable="clearable"
                :disabled="disabled" :disabled-date="disabledDate" :shortcuts="dateShortcuts" @change="handleDateChange"
                class="date-picker" />
        </div>

        <!-- 快捷日期选择按钮 -->
        <div class="quick-date-buttons" v-if="showQuickDates && !useBuiltinShortcuts">
            <el-button v-for="quick in quickDateOptions" :key="quick.key" size="small" type="default"
                @click="handleQuickDateSelect(quick)" class="quick-date-btn">
                {{ quick.label }}
            </el-button>
        </div>

        <!-- 验证提示 -->
        <div class="validation-message" v-if="validationMessage">
            <el-alert :title="validationMessage" :type="validationLevel" :closable="false" show-icon
                class="validation-alert" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import type { TimeRange, ValidationLevel } from '../types/time-selection'

interface QuickDateOption {
    key: string
    label: string
    startDate: Date
    endDate: Date
}

interface Props {
    modelValue?: TimeRange | null
    disabled?: boolean
    clearable?: boolean
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
    (e: 'validation-change', isValid: boolean, message: string, level: ValidationLevel): void
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    clearable: true,
    showQuickDates: true,
    useBuiltinShortcuts: true,
    maxDaysSpan: 365, // 最大365天跨度
    allowFutureDates: false,
    minDate: undefined,
    maxDate: undefined
})

const emit = defineEmits<Emits>()

// 响应式数据
const dateRange = ref<[string, string] | null>(null)
const validationMessage = ref<string>('')
const validationLevel = ref<ValidationLevel>('success')

// 计算今天的日期
const today = new Date()
const todayStr = today.toISOString().split('T')[0]

// 快捷日期选项
const quickDateOptions = computed<QuickDateOption[]>(() => {
    const now = new Date()

    return [
        {
            key: 'today',
            label: '今天',
            startDate: new Date(now),
            endDate: new Date(now)
        },
        {
            key: 'yesterday',
            label: '昨天',
            startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() - 24 * 60 * 60 * 1000)
        },
        {
            key: 'last7days',
            label: '近7天',
            startDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
            endDate: new Date(now)
        },
        {
            key: 'last30days',
            label: '近30天',
            startDate: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
            endDate: new Date(now)
        },
        {
            key: 'thisWeek',
            label: '本周',
            startDate: getWeekStart(now),
            endDate: getWeekEnd(now)
        },
        {
            key: 'lastWeek',
            label: '上周',
            startDate: getWeekStart(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
            endDate: getWeekEnd(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
        },
        {
            key: 'thisMonth',
            label: '本月',
            startDate: new Date(now.getFullYear(), now.getMonth(), 1),
            endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        },
        {
            key: 'lastMonth',
            label: '上月',
            startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            endDate: new Date(now.getFullYear(), now.getMonth(), 0)
        }
    ]
})

// Element Plus 内置快捷选项
const dateShortcuts = computed(() => {
    if (!props.useBuiltinShortcuts) return []

    return [
        {
            text: '今天',
            value: () => {
                const now = new Date()
                return [now, now]
            }
        },
        {
            text: '昨天',
            value: () => {
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                return [yesterday, yesterday]
            }
        },
        {
            text: '近7天',
            value: () => {
                const end = new Date()
                const start = new Date()
                start.setDate(start.getDate() - 6)
                return [start, end]
            }
        },
        {
            text: '近30天',
            value: () => {
                const end = new Date()
                const start = new Date()
                start.setDate(start.getDate() - 29)
                return [start, end]
            }
        },
        {
            text: '本月',
            value: () => {
                const now = new Date()
                const start = new Date(now.getFullYear(), now.getMonth(), 1)
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                return [start, end]
            }
        },
        {
            text: '上月',
            value: () => {
                const now = new Date()
                const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const end = new Date(now.getFullYear(), now.getMonth(), 0)
                return [start, end]
            }
        }
    ]
})

// 获取周的开始日期（周一）
function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 调整为周一开始
    return new Date(d.setDate(diff))
}

// 获取周的结束日期（周日）
function getWeekEnd(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? 0 : 7) // 调整为周日结束
    return new Date(d.setDate(diff))
}

// 禁用日期函数
const disabledDate = (time: Date) => {
    // 禁用未来日期
    if (!props.allowFutureDates && time.getTime() > Date.now()) {
        return true
    }

    // 最小日期限制
    if (props.minDate && time.getTime() < props.minDate.getTime()) {
        return true
    }

    // 最大日期限制
    if (props.maxDate && time.getTime() > props.maxDate.getTime()) {
        return true
    }

    return false
}

// 计算日期差异（天数）
const calculateDaysDifference = (startDate: Date, endDate: Date): number => {
    const timeDiff = endDate.getTime() - startDate.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1 // 包含起始和结束日期
}

// 验证日期范围
const validateDateRange = () => {
    if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) {
        validationMessage.value = ''
        validationLevel.value = 'success'
        emit('validation-change', true, '', 'success')
        return true
    }

    const startDate = new Date(dateRange.value[0])
    const endDate = new Date(dateRange.value[1])

    // 检查起始日期是否大于结束日期
    if (startDate > endDate) {
        validationMessage.value = '开始日期不能大于结束日期'
        validationLevel.value = 'error'
        emit('validation-change', false, validationMessage.value, 'error')
        return false
    }

    // 检查日期跨度
    const daysDiff = calculateDaysDifference(startDate, endDate)
    if (daysDiff > props.maxDaysSpan) {
        validationMessage.value = `日期范围不能超过${props.maxDaysSpan}天`
        validationLevel.value = 'warning'
        emit('validation-change', false, validationMessage.value, 'warning')
        return false
    }

    // 检查未来日期
    if (!props.allowFutureDates && (startDate > today || endDate > today)) {
        validationMessage.value = '不允许选择未来日期'
        validationLevel.value = 'error'
        emit('validation-change', false, validationMessage.value, 'error')
        return false
    }

    // 检查边界日期
    if (props.minDate && startDate < props.minDate) {
        validationMessage.value = `开始日期不能早于${props.minDate.toISOString().split('T')[0]}`
        validationLevel.value = 'error'
        emit('validation-change', false, validationMessage.value, 'error')
        return false
    }

    if (props.maxDate && endDate > props.maxDate) {
        validationMessage.value = `结束日期不能晚于${props.maxDate.toISOString().split('T')[0]}`
        validationLevel.value = 'error'
        emit('validation-change', false, validationMessage.value, 'error')
        return false
    }

    validationMessage.value = '日期范围设置正确'
    validationLevel.value = 'success'
    emit('validation-change', true, validationMessage.value, 'success')
    return true
}

// 处理日期变化
const handleDateChange = (value: [string, string] | null) => {
    dateRange.value = value
    validateDateRange()
    emitValue()
}

// 处理快捷日期选择
const handleQuickDateSelect = (quick: QuickDateOption) => {
    const startStr = quick.startDate.toISOString().split('T')[0]
    const endStr = quick.endDate.toISOString().split('T')[0]
    dateRange.value = [startStr, endStr]
    validateDateRange()
    emitValue()
}

// 发送值变化事件
const emitValue = () => {
    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
        const timeRange: TimeRange = {
            startDate: new Date(dateRange.value[0]),
            endDate: new Date(dateRange.value[1]),
            unit: 'day'
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
        const startStr = newValue.startDate.toISOString().split('T')[0]
        const endStr = newValue.endDate.toISOString().split('T')[0]
        dateRange.value = [startStr, endStr]
    } else {
        dateRange.value = null
    }
    validateDateRange()
}, { immediate: true })

// 组件挂载时进行初始验证
onMounted(() => {
    validateDateRange()
})
</script>

<style scoped>
.date-range-picker {
    width: 100%;
}

.date-picker-container {
    margin-bottom: 12px;
}

.date-picker {
    width: 100%;
}

.quick-date-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.quick-date-btn {
    font-size: 12px;
    padding: 4px 8px;
}

.validation-message {
    margin-top: 8px;
}

.validation-alert {
    font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .quick-date-buttons {
        justify-content: center;
    }

    .quick-date-btn {
        flex: 1;
        min-width: 80px;
    }
}

/* Element Plus 日期选择器样式覆盖 */
:deep(.el-date-editor) {
    width: 100%;
}

:deep(.el-date-editor .el-range-separator) {
    color: #909399;
}

:deep(.el-date-editor .el-range-input) {
    background-color: transparent;
}
</style>