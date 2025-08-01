<template>
    <div class="time-selection-adapter">
        <!-- 新的时间选择组件 -->
        <TimeSelectionComponent 
            ref="timeSelectionRef"
            v-model="timeSelectionState"
            title="时间范围选择"
            :config="timeSelectionConfig"
            :size="size"
            :disabled="disabled"
            @change="handleTimeSelectionChange"
            @validation-change="handleValidationChange"
            @error="handleError"
        />
        
        <!-- 兼容性映射信息（开发模式显示） -->
        <div v-if="showDebugInfo" class="compatibility-debug">
            <el-collapse>
                <el-collapse-item title="兼容性映射信息" name="compatibility">
                    <div class="debug-content">
                        <h4>原始表单数据:</h4>
                        <pre>{{ JSON.stringify(legacyFormData, null, 2) }}</pre>
                        
                        <h4>新组件状态:</h4>
                        <pre>{{ JSON.stringify(timeSelectionState, null, 2) }}</pre>
                        
                        <h4>查询参数:</h4>
                        <pre>{{ JSON.stringify(queryParams, null, 2) }}</pre>
                    </div>
                </el-collapse-item>
            </el-collapse>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElCollapse, ElCollapseItem } from 'element-plus'
import TimeSelectionComponent from './TimeSelectionComponent.vue'
import type { 
    TimeSelectionState, 
    TimeSelectionConfig, 
    ValidationResult,
    QueryParams 
} from '../types/time-selection'

// ============================================================================
// 接口定义
// ============================================================================

/** 原有表单数据结构 */
interface LegacyFormData {
    timeRangeType: string
    timeUnit: string
    customTimeRange: [Date, Date] | null
    enableComparison: boolean
}

interface Props {
    /** 原有表单数据 */
    modelValue: LegacyFormData
    /** 组件尺寸 */
    size?: 'small' | 'default' | 'large'
    /** 是否禁用 */
    disabled?: boolean
    /** 是否显示调试信息 */
    showDebugInfo?: boolean
}

interface Emits {
    (e: 'update:modelValue', value: LegacyFormData): void
    (e: 'change', value: LegacyFormData): void
    (e: 'query-params-change', params: QueryParams): void
    (e: 'validation-change', result: ValidationResult): void
    (e: 'error', error: Error): void
}

const props = withDefaults(defineProps<Props>(), {
    size: 'default',
    disabled: false,
    showDebugInfo: false
})

const emit = defineEmits<Emits>()

// ============================================================================
// 响应式数据
// ============================================================================

/** 时间选择组件引用 */
const timeSelectionRef = ref<InstanceType<typeof TimeSelectionComponent> | null>(null)

/** 原有表单数据 */
const legacyFormData = ref<LegacyFormData>({ ...props.modelValue })

/** 新组件状态 */
const timeSelectionState = ref<TimeSelectionState>({
    quickSelection: '',
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

/** 时间选择组件配置 */
const timeSelectionConfig = ref<TimeSelectionConfig>({
    quickSelection: {
        enabled: true,
        options: [
            { key: 'total', label: '历史总量', description: '查询所有历史数据' },
            { key: 'recent2years', label: '近两年', description: '查询最近两年的数据' },
            { key: 'recent6months', label: '近六月', description: '查询最近六个月的数据' },
            { key: 'thisYear', label: '今年', description: '查询当前年份的数据' },
            { key: 'lastYear', label: '去年', description: '查询上一年份的数据' },
            { key: 'custom', label: '自定义', description: '自定义时间范围' }
        ],
        defaultOption: 'total',
        showDescription: true,
        showStatisticsSuggestion: true
    },
    timeUnits: {
        enabled: true,
        availableUnits: ['year', 'month', 'day'],
        defaultUnit: 'day',
        showUnitDescription: true
    },
    comparison: {
        enabled: true,
        showValidation: true,
        allowCrossYear: true,
        showWarningForCrossYear: true
    },
    validation: {
        enabled: true,
        showRealTimeValidation: true,
        showDetailedMessages: true
    },
    defaultTimeUnit: 'day'
})

/** 查询参数 */
const queryParams = computed(() => {
    if (!timeSelectionRef.value) return null
    return timeSelectionRef.value.getQueryParams()
})

// ============================================================================
// 数据转换函数
// ============================================================================

/**
 * 将原有表单数据转换为新组件状态
 */
function convertLegacyToNew(legacy: LegacyFormData): TimeSelectionState {
    const state: TimeSelectionState = {
        quickSelection: legacy.timeRangeType || '',
        timeUnit: (legacy.timeUnit as any) || 'day',
        timeRange: null,
        comparisonEnabled: legacy.enableComparison,
        statisticsMode: 'total',
        validation: {
            isValid: true,
            level: 'success',
            message: ''
        }
    }

    // 转换自定义时间范围
    if (legacy.customTimeRange && legacy.customTimeRange.length === 2) {
        state.timeRange = {
            startDate: legacy.customTimeRange[0],
            endDate: legacy.customTimeRange[1]
        }
        state.quickSelection = 'custom'
    }

    return state
}

/**
 * 将新组件状态转换为原有表单数据
 */
function convertNewToLegacy(newState: TimeSelectionState): LegacyFormData {
    const legacy: LegacyFormData = {
        timeRangeType: newState.quickSelection,
        timeUnit: newState.timeUnit,
        customTimeRange: null,
        enableComparison: newState.comparisonEnabled
    }

    // 转换自定义时间范围
    if (newState.timeRange && newState.quickSelection === 'custom') {
        legacy.customTimeRange = [
            newState.timeRange.startDate,
            newState.timeRange.endDate
        ]
    }

    return legacy
}

// ============================================================================
// 事件处理
// ============================================================================

/**
 * 处理时间选择变化
 */
function handleTimeSelectionChange(newState: TimeSelectionState) {
    // 更新原有表单数据
    const newLegacyData = convertNewToLegacy(newState)
    legacyFormData.value = newLegacyData
    
    // 发送事件
    emit('update:modelValue', newLegacyData)
    emit('change', newLegacyData)
    
    // 发送查询参数变化事件
    if (queryParams.value) {
        emit('query-params-change', queryParams.value)
    }
}

/**
 * 处理验证状态变化
 */
function handleValidationChange(result: ValidationResult) {
    emit('validation-change', result)
}

/**
 * 处理错误
 */
function handleError(error: Error) {
    emit('error', error)
}

// ============================================================================
// 监听器
// ============================================================================

/** 监听外部表单数据变化 */
watch(() => props.modelValue, (newValue) => {
    legacyFormData.value = { ...newValue }
    timeSelectionState.value = convertLegacyToNew(newValue)
}, { deep: true })

/** 初始化时转换数据 */
onMounted(() => {
    timeSelectionState.value = convertLegacyToNew(props.modelValue)
})

// ============================================================================
// 暴露的方法
// ============================================================================

/**
 * 重置组件状态
 */
function reset() {
    timeSelectionRef.value?.reset()
}

/**
 * 获取查询参数
 */
function getQueryParams(): QueryParams | null {
    return timeSelectionRef.value?.getQueryParams() || null
}

/**
 * 验证当前状态
 */
function validate(): ValidationResult {
    return timeSelectionRef.value?.validate() || {
        isValid: false,
        level: 'error',
        message: '组件未初始化'
    }
}

/**
 * 获取原有表单数据
 */
function getLegacyFormData(): LegacyFormData {
    return { ...legacyFormData.value }
}

/**
 * 设置原有表单数据
 */
function setLegacyFormData(data: LegacyFormData) {
    legacyFormData.value = { ...data }
    timeSelectionState.value = convertLegacyToNew(data)
}

defineExpose({
    reset,
    getQueryParams,
    validate,
    getLegacyFormData,
    setLegacyFormData,
    timeSelectionRef
})
</script>

<style scoped>
.time-selection-adapter {
    width: 100%;
}

.compatibility-debug {
    margin-top: 16px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
}

.debug-content {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
}

.debug-content h4 {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin: 12px 0 8px 0;
}

.debug-content pre {
    background-color: #ffffff;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 200px;
}
</style>
