<template>
    <div class="time-unit-selector">
        <el-form-item label="时间单位" class="time-unit-form-item">
            <el-radio-group v-model="selectedUnit" @change="(val: string) => handleUnitChange(val as TimeUnit)" class="time-unit-radio-group">
                <el-radio v-for="unit in timeUnits" :key="unit.key" :value="unit.key" :disabled="disabled"
                    class="time-unit-radio">
                    {{ unit.label }}
                </el-radio>
            </el-radio-group>
        </el-form-item>

        <!-- 调试信息 (开发环境) -->
        <div v-if="showDebugInfo" class="debug-info">
            <el-collapse>
                <el-collapse-item title="调试信息" name="debug">
                    <div class="debug-content">
                        <p><strong>当前选择:</strong> {{ selectedUnit }} ({{ currentUnitConfig?.label }})</p>
                        <p><strong>数据库字段:</strong> {{ currentUnitConfig?.dbField }}</p>
                        <p><strong>查询策略:</strong> {{ currentUnitConfig?.queryStrategy }}</p>
                        <p><strong>分组表达式:</strong> {{ currentUnitConfig?.groupByExpression }}</p>
                        <p><strong>选择器类型:</strong> {{ currentUnitConfig?.pickerType }}</p>
                        <p><strong>默认范围:</strong> {{ currentUnitConfig?.defaultRange }} 年</p>
                    </div>
                </el-collapse-item>
            </el-collapse>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import type { TimeUnit, TimeUnitConfig } from '../types/time-selection'
import { TIME_UNITS, getTimeUnitConfig } from '../config/time-selection'

// ============================================================================
// 组件接口定义
// ============================================================================

interface Props {
    /** 当前选中的时间单位 */
    modelValue?: TimeUnit
    /** 是否禁用 */
    disabled?: boolean
    /** 可用的时间单位列表，默认使用全部 */
    availableUnits?: TimeUnit[]
    /** 是否显示调试信息 */
    showDebugInfo?: boolean
}

interface Emits {
    /** 时间单位变更事件 */
    (e: 'update:modelValue', value: TimeUnit): void
    /** 时间单位变更事件（带详细信息） */
    (e: 'change', value: TimeUnit, config: TimeUnitConfig): void
    /** 时间选择器界面需要调整事件 */
    (e: 'picker-type-change', pickerType: 'year' | 'month' | 'date', config: TimeUnitConfig): void
}

// ============================================================================
// 组件属性和事件
// ============================================================================

const props = withDefaults(defineProps<Props>(), {
    modelValue: 'day',
    disabled: false,
    availableUnits: () => ['year', 'month', 'day'],
    showDebugInfo: false
})

const emit = defineEmits<Emits>()

// ============================================================================
// 响应式数据
// ============================================================================

/** 当前选中的时间单位 */
const selectedUnit = ref<TimeUnit>(props.modelValue || 'day')

// ============================================================================
// 计算属性
// ============================================================================

/** 可用的时间单位配置列表 */
const timeUnits = computed<TimeUnitConfig[]>(() => {
    return TIME_UNITS.filter(unit => props.availableUnits.includes(unit.key))
})

/** 当前选中单位的配置 */
const currentUnitConfig = computed<TimeUnitConfig | undefined>(() => {
    return getTimeUnitConfig(selectedUnit.value)
})

/** 是否为有效的时间单位 */
const isValidUnit = computed<boolean>(() => {
    return timeUnits.value.some(unit => unit.key === selectedUnit.value)
})

// ============================================================================
// 事件处理函数
// ============================================================================

/**
 * 处理时间单位变更
 * @param newUnit 新选择的时间单位
 */
const handleUnitChange = (newUnit: TimeUnit) => {
    const previousUnit = selectedUnit.value
    selectedUnit.value = newUnit

    const unitConfig = getTimeUnitConfig(newUnit)
    if (!unitConfig) {
        console.error(`[TimeUnitSelector] 无效的时间单位: ${newUnit}`)
        return
    }

    // 发送更新事件
    emit('update:modelValue', newUnit)
    emit('change', newUnit, unitConfig)

    // 发送选择器类型变更事件，通知父组件调整时间选择器界面
    emit('picker-type-change', unitConfig.pickerType, unitConfig)

    console.log(`[TimeUnitSelector] 时间单位从 ${previousUnit} 切换到 ${newUnit}`, {
        previousUnit,
        newUnit,
        config: unitConfig,
        pickerType: unitConfig.pickerType,
        queryStrategy: unitConfig.queryStrategy,
        groupByExpression: unitConfig.groupByExpression
    })
}

/**
 * 验证并设置时间单位
 * @param unit 要设置的时间单位
 */
const setTimeUnit = (unit: TimeUnit) => {
    if (!props.availableUnits.includes(unit)) {
        console.warn(`[TimeUnitSelector] 时间单位 ${unit} 不在可用列表中`)
        return
    }

    if (selectedUnit.value !== unit) {
        handleUnitChange(unit)
    }
}

/**
 * 获取当前时间单位配置
 */
const getCurrentConfig = (): TimeUnitConfig | undefined => {
    return currentUnitConfig.value
}

/**
 * 重置到默认时间单位
 */
const resetToDefault = () => {
    const defaultUnit = props.availableUnits[0] || 'day'
    setTimeUnit(defaultUnit)
}

// ============================================================================
// 监听器
// ============================================================================

/** 监听外部值变化 */
watch(() => props.modelValue, (newValue) => {
    if (newValue && newValue !== selectedUnit.value) {
        selectedUnit.value = newValue
        console.log(`[TimeUnitSelector] 外部值变化: ${newValue}`)
    }
}, { immediate: true })

/** 监听可用单位列表变化 */
watch(() => props.availableUnits, (newUnits) => {
    // 如果当前选中的单位不在新的可用列表中，切换到第一个可用单位
    if (!newUnits.includes(selectedUnit.value)) {
        const firstAvailable = newUnits[0]
        if (firstAvailable) {
            setTimeUnit(firstAvailable)
        }
    }
}, { deep: true })

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
    // 验证初始值
    if (!isValidUnit.value) {
        console.warn(`[TimeUnitSelector] 初始时间单位 ${selectedUnit.value} 无效，重置为默认值`)
        resetToDefault()
    }

    // 发送初始配置
    const config = getCurrentConfig()
    if (config) {
        emit('picker-type-change', config.pickerType, config)
    }

    console.log('[TimeUnitSelector] 组件已挂载', {
        selectedUnit: selectedUnit.value,
        availableUnits: props.availableUnits,
        config: config
    })
})

// ============================================================================
// 暴露给父组件的方法
// ============================================================================

defineExpose({
    setTimeUnit,
    getCurrentConfig,
    resetToDefault,
    selectedUnit: computed(() => selectedUnit.value),
    currentConfig: currentUnitConfig,
    isValid: isValidUnit
})
</script>

<style scoped>
.time-unit-selector {
    width: 100%;
}

.time-unit-form-item {
    margin-bottom: 0;
}

.time-unit-radio-group {
    display: flex;
    gap: 24px;
    align-items: center;
}

.time-unit-radio {
    margin-right: 0;
    font-size: 14px;
    font-weight: 400;
    color: #303133;
}

.time-unit-radio:hover {
    color: #409EFF;
}

.time-unit-radio.is-checked {
    color: #409EFF;
    font-weight: 500;
}

.time-unit-radio.is-disabled {
    color: #C0C4CC;
    cursor: not-allowed;
}

/* 调试信息样式 */
.debug-info {
    margin-top: 16px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
}

.debug-content {
    font-size: 12px;
    line-height: 1.5;
    color: #606266;
}

.debug-content p {
    margin: 4px 0;
}

.debug-content strong {
    color: #303133;
    font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .time-unit-radio-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .time-unit-radio {
        width: 100%;
    }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
    .time-unit-radio {
        border: 1px solid transparent;
    }

    .time-unit-radio:focus {
        border-color: #409EFF;
        outline: 2px solid #409EFF;
        outline-offset: 2px;
    }

    .time-unit-radio.is-checked {
        background-color: #409EFF;
        color: white;
        border-radius: 4px;
        padding: 4px 8px;
    }
}

/* 色盲友好设计 */
.time-unit-radio.is-checked::before {
    content: '✓';
    margin-right: 4px;
    font-weight: bold;
}

/* 动画效果 */
.time-unit-radio {
    transition: all 0.2s ease-in-out;
}

.time-unit-radio:hover {
    transform: translateY(-1px);
}

.time-unit-radio.is-checked {
    transform: scale(1.02);
}
</style>