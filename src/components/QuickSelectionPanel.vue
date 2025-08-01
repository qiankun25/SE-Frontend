<template>
    <div class="quick-selection-panel">
        <!-- 快捷选择标题 -->
        <div class="panel-header">
            <span class="panel-title">快捷选择</span>
            <el-tooltip v-if="showDescription" content="选择常用的时间范围，快速完成查询设置" placement="top">
                <el-icon class="help-icon">
                    <QuestionFilled />
                </el-icon>
            </el-tooltip>
        </div>

        <!-- 快捷选择按钮组 -->
        <div class="quick-options-container" role="group" aria-label="快捷时间选择">
            <div class="ts-quick-buttons">
                <button
                    v-for="option in quickOptions"
                    :key="option.key"
                    type="button"
                    :class="{
                        'ts-quick-button': true,
                        'selected': selectedOption === option.key,
                        'with-description': showDescription
                    }"
                    :aria-pressed="selectedOption === option.key"
                    :aria-describedby="showDescription ? `desc-${option.key}` : undefined"
                    @click="handleOptionClick(option)"
                    @mouseenter="handleOptionHover(option)"
                    @mouseleave="handleOptionLeave"
                >
                    <span class="option-label">{{ option.label }}</span>
                    <el-icon v-if="selectedOption === option.key" class="ts-quick-button-icon" aria-hidden="true">
                        <Check />
                    </el-icon>
                </button>

                <!-- 自定义选项按钮 -->
                <button
                    v-if="showCustomOption"
                    type="button"
                    :class="{
                        'ts-quick-button': true,
                        'custom': true,
                        'selected': selectedOption === 'custom'
                    }"
                    :aria-pressed="selectedOption === 'custom'"
                    aria-label="自定义时间范围"
                    @click="handleCustomOptionClick"
                >
                    <span class="option-label">自定义</span>
                    <el-icon v-if="selectedOption === 'custom'" class="ts-quick-button-icon" aria-hidden="true">
                        <Check />
                    </el-icon>
                </button>
            </div>
        </div>

        <!-- 选项描述提示 -->
        <div v-if="showDescription && currentDescription" class="option-description">
            <div
                :id="`desc-${selectedOption}`"
                class="ts-alert info"
                role="status"
                aria-live="polite"
            >
                <div class="ts-validation-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                </div>
                <div class="ts-validation-message">
                    <div class="ts-validation-title">{{ currentDescription }}</div>
                </div>
            </div>
        </div>

        <!-- 统计模式建议 -->
        <div v-if="showStatisticsSuggestion && currentSuggestion" class="statistics-suggestion">
            <el-tag :type="getSuggestionTagType(currentSuggestion.mode)" size="small" class="suggestion-tag">
                <el-icon class="suggestion-icon">
                    <TrendCharts />
                </el-icon>
                推荐{{ currentSuggestion.label }}
            </el-tag>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElButton, ElTooltip, ElIcon, ElAlert, ElTag } from 'element-plus'
import { QuestionFilled, Check, TrendCharts } from '@element-plus/icons-vue'
import type { QuickOption, StatisticsMode, TimeSelectionState } from '../types/time-selection'
import { QUICK_OPTIONS } from '../config/time-selection'

// ============================================================================
// Props 定义
// ============================================================================

interface Props {
    /** 当前选中的选项 */
    modelValue?: string | null
    /** 是否显示描述信息 */
    showDescription?: boolean
    /** 是否显示自定义选项 */
    showCustomOption?: boolean
    /** 是否显示统计模式建议 */
    showStatisticsSuggestion?: boolean
    /** 自定义快捷选项（可选，用于覆盖默认配置） */
    customOptions?: QuickOption[]
    /** 是否禁用组件 */
    disabled?: boolean
    /** 组件大小 */
    size?: 'large' | 'default' | 'small'
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    showDescription: true,
    showCustomOption: true,
    showStatisticsSuggestion: true,
    customOptions: undefined,
    disabled: false,
    size: 'default'
})

// ============================================================================
// Emits 定义
// ============================================================================

interface Emits {
    /** 选项变更事件 */
    (e: 'update:modelValue', value: string | null): void
    /** 快捷选项选择事件 */
    (e: 'option-select', option: QuickOption): void
    /** 自定义选项点击事件 */
    (e: 'custom-select'): void
    /** 选项悬停事件 */
    (e: 'option-hover', option: QuickOption | null): void
}

const emit = defineEmits<Emits>()

// ============================================================================
// 响应式数据
// ============================================================================

/** 当前选中的选项 */
const selectedOption = ref<string | null>(props.modelValue)

/** 当前悬停的选项 */
const hoveredOption = ref<QuickOption | null>(null)

/** 当前显示的描述信息 */
const currentDescription = ref<string>('')

// ============================================================================
// 计算属性
// ============================================================================

/** 快捷选项列表 */
const quickOptions = computed<QuickOption[]>(() => {
    return props.customOptions || QUICK_OPTIONS
})

/** 当前选中的选项对象 */
const selectedOptionObject = computed<QuickOption | null>(() => {
    if (!selectedOption.value) return null
    return quickOptions.value.find(option => option.key === selectedOption.value) || null
})

/** 当前统计模式建议 */
const currentSuggestion = computed(() => {
    const option = selectedOptionObject.value
    if (!option || !option.statisticsMode) return null

    const modeLabels: Record<StatisticsMode, string> = {
        total: '总量统计',
        yearly: '按年统计',
        monthly: '按月统计',
        daily: '按日统计'
    }

    return {
        mode: option.statisticsMode,
        label: modeLabels[option.statisticsMode]
    }
})

// ============================================================================
// 方法定义
// ============================================================================

/**
 * 处理选项点击
 */
function handleOptionClick(option: QuickOption) {
    if (props.disabled) return

    selectedOption.value = option.key
    emit('update:modelValue', option.key)
    emit('option-select', option)

    // 更新描述信息
    currentDescription.value = option.description
}

/**
 * 处理自定义选项点击
 */
function handleCustomOptionClick() {
    if (props.disabled) return

    selectedOption.value = 'custom'
    emit('update:modelValue', 'custom')
    emit('custom-select')

    // 清空描述信息
    currentDescription.value = ''
}

/**
 * 处理选项悬停
 */
function handleOptionHover(option: QuickOption) {
    if (props.disabled) return

    hoveredOption.value = option
    emit('option-hover', option)

    // 如果没有选中选项，显示悬停选项的描述
    if (!selectedOption.value && props.showDescription) {
        currentDescription.value = option.description
    }
}

/**
 * 处理选项离开悬停
 */
function handleOptionLeave() {
    if (props.disabled) return

    hoveredOption.value = null
    emit('option-hover', null)

    // 恢复选中选项的描述
    if (selectedOptionObject.value && props.showDescription) {
        currentDescription.value = selectedOptionObject.value.description
    } else if (!selectedOption.value) {
        currentDescription.value = ''
    }
}

/**
 * 获取建议标签类型
 */
function getSuggestionTagType(mode: StatisticsMode): 'success' | 'info' | 'warning' | 'danger' {
    switch (mode) {
        case 'total':
            return 'info'
        case 'yearly':
            return 'success'
        case 'monthly':
            return 'warning'
        case 'daily':
            return 'danger'
        default:
            return 'info'
    }
}

/**
 * 重置选择
 */
function resetSelection() {
    selectedOption.value = null
    currentDescription.value = ''
    emit('update:modelValue', null)
}

/**
 * 设置选中选项
 */
function setSelectedOption(optionKey: string | null) {
    selectedOption.value = optionKey

    if (optionKey) {
        const option = quickOptions.value.find(opt => opt.key === optionKey)
        if (option) {
            currentDescription.value = option.description
        }
    } else {
        currentDescription.value = ''
    }
}

// ============================================================================
// 监听器
// ============================================================================

/** 监听 modelValue 变化 */
watch(() => props.modelValue, (newValue) => {
    if (newValue !== selectedOption.value) {
        setSelectedOption(newValue)
    }
})

/** 监听选中选项变化，更新描述 */
watch(selectedOptionObject, (newOption) => {
    if (newOption && props.showDescription) {
        currentDescription.value = newOption.description
    }
})

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
    // 初始化选中选项
    if (props.modelValue) {
        setSelectedOption(props.modelValue)
    }
})

// ============================================================================
// 暴露给父组件的方法
// ============================================================================

defineExpose({
    resetSelection,
    setSelectedOption,
    selectedOption: selectedOption,
    selectedOptionObject: selectedOptionObject
})
</script>

<style scoped>
/* 导入设计系统样式 */
@import '../styles/time-selection-design-system.css';

.quick-selection-panel {
    width: 100%;
    padding: var(--ts-spacing-component);
    background: var(--ts-color-bg-white);
    border-radius: var(--ts-border-radius-xlarge);
    border: 1px solid var(--ts-color-border);
}

/* 面板标题 */
.panel-header {
    display: flex;
    align-items: center;
    margin-bottom: var(--ts-spacing-padding);
}

.panel-title {
    font-size: var(--ts-font-size-body);
    font-weight: var(--ts-font-weight-title);
    color: var(--ts-color-text);
    margin-right: var(--ts-spacing-element);
}

.help-icon {
    font-size: var(--ts-font-size-body);
    color: var(--ts-color-text-secondary);
    cursor: help;
    transition: var(--ts-transition-fast);
}

.help-icon:hover {
    color: var(--ts-color-primary);
}

/* 快捷选项容器 */
.quick-options-container {
    margin-bottom: var(--ts-spacing-padding);
}

/* 使用设计系统中的快捷按钮样式 */
.ts-quick-buttons {
    /* 样式已在设计系统中定义 */
}

/* 选项标签样式 */
.option-label {
    flex: 1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 选项描述 */
.option-description {
    margin-bottom: var(--ts-spacing-padding);
}

.description-alert {
    border-radius: var(--ts-border-radius-large);
}

.description-alert :deep(.el-alert__content) {
    font-size: var(--ts-font-size-small);
    line-height: 1.4;
}

/* 统计模式建议 */
.statistics-suggestion {
    display: flex;
    justify-content: center;
}

.suggestion-tag {
    display: flex;
    align-items: center;
    gap: var(--ts-spacing-small);
    padding: var(--ts-spacing-small) var(--ts-spacing-element);
    border-radius: var(--ts-border-radius);
}

.suggestion-icon {
    font-size: var(--ts-font-size-small);
}

/* 组件特定的响应式样式 */
@media (max-width: 768px) {
    .panel-title {
        font-size: 13px;
    }
}

@media (max-width: 480px) {
    .quick-selection-panel {
        padding: var(--ts-spacing-padding);
    }
}

/* 禁用状态 */
.quick-selection-panel[disabled] {
    opacity: 0.6;
    pointer-events: none;
}

/* 不同尺寸适配 */
.quick-selection-panel.size-large .ts-quick-button {
    min-height: 40px;
    padding: 10px 16px;
    font-size: 14px;
}

.quick-selection-panel.size-small .ts-quick-button {
    min-height: 28px;
    padding: var(--ts-spacing-small) var(--ts-spacing-element);
    font-size: var(--ts-font-size-small);
}

/* 动画效果 */
.ts-quick-button {
    animation: ts-fade-in 0.3s ease-in-out;
}

/* 高对比度模式和减少动画模式支持已在设计系统中定义 */
</style>