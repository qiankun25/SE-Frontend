<template>
    <div class="statistics-mode-suggester">
        <!-- 统计模式选择器 -->
        <div class="mode-selector">
            <label class="selector-label">统计模式：</label>
            <el-select v-model="selectedMode" placeholder="选择统计模式" class="mode-select" @change="handleModeChange">
                <el-option v-for="mode in availableModes" :key="mode.key" :label="mode.label" :value="mode.key">
                    <div class="mode-option">
                        <span class="mode-label">{{ mode.label }}</span>
                        <span class="mode-description">{{ mode.description }}</span>
                    </div>
                </el-option>
            </el-select>
        </div>

        <!-- 智能推荐提示 -->
        <div v-if="suggestion && showSuggestion" class="suggestion-tip">
            <el-alert :title="suggestion.title" :description="suggestion.description" :type="suggestion.type"
                :closable="false" show-icon class="suggestion-alert">
                <template #default>
                    <div class="suggestion-content">
                        <p class="suggestion-title">{{ suggestion.title }}</p>
                        <p class="suggestion-description">{{ suggestion.description }}</p>
                        <div v-if="suggestion.showApplyButton" class="suggestion-actions">
                            <el-button type="primary" size="small" @click="applySuggestion">
                                应用推荐
                            </el-button>
                            <el-button size="small" @click="dismissSuggestion">
                                忽略
                            </el-button>
                        </div>
                    </div>
                </template>
            </el-alert>
        </div>

        <!-- 跨年分组选项 -->
        <div v-if="showCrossYearGrouping" class="cross-year-grouping">
            <el-checkbox v-model="enableYearlyGrouping" @change="handleYearlyGroupingChange">
                按年度分组显示
            </el-checkbox>
            <span class="grouping-hint">
                （推荐用于跨年查询的年度对比分析）
            </span>
        </div>

        <!-- 统计粒度信息 -->
        <div v-if="granularityInfo" class="granularity-info">
            <el-tag :type="granularityInfo.type" size="small">
                {{ granularityInfo.text }}
            </el-tag>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { ElSelect, ElOption, ElAlert, ElCheckbox, ElButton, ElTag } from 'element-plus'
import type {
    TimeRange,
    StatisticsMode,
    TimeSelectionState
} from '../types/time-selection'

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    /** 当前时间范围 */
    timeRange: TimeRange | null
    /** 当前选择的统计模式 */
    currentMode: StatisticsMode
    /** 是否显示智能推荐 */
    showSuggestion?: boolean
    /** 是否启用自动应用推荐 */
    autoApply?: boolean
    /** 时间选择状态（用于更全面的分析） */
    timeSelectionState?: TimeSelectionState
}

interface Emits {
    (e: 'mode-change', mode: StatisticsMode): void
    (e: 'yearly-grouping-change', enabled: boolean): void
    (e: 'suggestion-applied', suggestion: StatisticsSuggestion): void
    (e: 'suggestion-dismissed'): void
}

const props = withDefaults(defineProps<Props>(), {
    showSuggestion: true,
    autoApply: false
})

const emit = defineEmits<Emits>()

// ============================================================================
// 统计模式定义
// ============================================================================

interface StatisticsModeConfig {
    key: StatisticsMode
    label: string
    description: string
    applicableScenarios: string[]
    minDays?: number
    maxDays?: number
}

const STATISTICS_MODES: StatisticsModeConfig[] = [
    {
        key: 'total',
        label: '总量统计',
        description: '显示总体数量，不按时间维度分组',
        applicableScenarios: ['历史总量查询', '整体数据概览'],
    },
    {
        key: 'yearly',
        label: '按年统计',
        description: '按年份分组显示统计数据',
        applicableScenarios: ['长期趋势分析', '年度对比'],
        minDays: 365,
    },
    {
        key: 'monthly',
        label: '按月统计',
        description: '按月份分组显示统计数据',
        applicableScenarios: ['中期趋势分析', '季度对比'],
        minDays: 31,
        maxDays: 730,
    },
    {
        key: 'daily',
        label: '按日统计',
        description: '按日期分组显示统计数据',
        applicableScenarios: ['短期趋势分析', '详细数据查看'],
        maxDays: 31,
    },
]

// ============================================================================
// 推荐逻辑接口
// ============================================================================

interface StatisticsSuggestion {
    recommendedMode: StatisticsMode
    title: string
    description: string
    type: 'success' | 'info' | 'warning'
    confidence: number // 0-1, 推荐置信度
    reasons: string[]
    showApplyButton: boolean
}

// ============================================================================
// 响应式数据
// ============================================================================

const selectedMode = ref<StatisticsMode>(props.currentMode)
const enableYearlyGrouping = ref(false)
const dismissedSuggestion = ref(false)

// ============================================================================
// 计算属性
// ============================================================================

/** 可用的统计模式 */
const availableModes = computed(() => {
    if (!props.timeRange) {
        return STATISTICS_MODES
    }

    const daysDiff = calculateDaysDifference(props.timeRange)

    return STATISTICS_MODES.filter(mode => {
        if (mode.minDays && daysDiff < mode.minDays) return false
        if (mode.maxDays && daysDiff > mode.maxDays) return false
        return true
    })
})

/** 智能推荐 */
const suggestion = computed((): StatisticsSuggestion | null => {
    if (!props.showSuggestion || dismissedSuggestion.value) {
        return null
    }

    const recommended = generateRecommendation()

    // 如果没有推荐或当前模式已经是推荐模式，不显示推荐
    if (!recommended || recommended.recommendedMode === selectedMode.value) {
        return null
    }

    return recommended
})

/** 是否显示跨年分组选项 */
const showCrossYearGrouping = computed(() => {
    if (!props.timeRange || !props.timeRange.startDate || !props.timeRange.endDate) {
        return false
    }

    const startYear = props.timeRange.startDate.getFullYear()
    const endYear = props.timeRange.endDate.getFullYear()

    return startYear !== endYear && selectedMode.value !== 'total'
})

/** 统计粒度信息 */
const granularityInfo = computed(() => {
    if (!props.timeRange) {
        return null
    }

    const daysDiff = calculateDaysDifference(props.timeRange)
    const mode = STATISTICS_MODES.find(m => m.key === selectedMode.value)

    if (!mode) return null

    let type: 'success' | 'info' | 'warning' = 'info'
    let text = `${mode.label} - `

    if (selectedMode.value === 'total') {
        text += '不分组'
        type = 'info'
    } else if (selectedMode.value === 'daily') {
        text += `${daysDiff} 天数据`
        type = daysDiff <= 31 ? 'success' : 'warning'
    } else if (selectedMode.value === 'monthly') {
        const months = Math.ceil(daysDiff / 30)
        text += `约 ${months} 个月数据`
        type = daysDiff >= 31 && daysDiff <= 730 ? 'success' : 'warning'
    } else if (selectedMode.value === 'yearly') {
        const years = Math.ceil(daysDiff / 365)
        text += `约 ${years} 年数据`
        type = daysDiff >= 365 ? 'success' : 'warning'
    }

    return { text, type }
})

// ============================================================================
// 核心推荐逻辑
// ============================================================================

/**
 * 生成统计模式推荐
 */
function generateRecommendation(): StatisticsSuggestion {
    if (!props.timeRange || !props.timeRange.startDate || !props.timeRange.endDate) {
        return {
            recommendedMode: 'total',
            title: '推荐使用总量统计',
            description: '未设置时间范围，建议使用总量统计查看整体数据',
            type: 'info',
            confidence: 0.8,
            reasons: ['未限制时间范围'],
            showApplyButton: true,
        }
    }

    const daysDiff = calculateDaysDifference(props.timeRange)
    const startYear = props.timeRange.startDate.getFullYear()
    const endYear = props.timeRange.endDate.getFullYear()
    const isCrossYear = startYear !== endYear

    // 基于时间跨度的推荐逻辑
    if (daysDiff <= 7) {
        return {
            recommendedMode: 'daily',
            title: '推荐按日统计',
            description: '时间范围较短（一周内），按日统计可以看到详细的数据变化',
            type: 'success',
            confidence: 0.9,
            reasons: ['时间跨度短', '适合详细分析'],
            showApplyButton: true,
        }
    } else if (daysDiff <= 31) {
        return {
            recommendedMode: 'daily',
            title: '推荐按日统计',
            description: '时间范围在一个月内，按日统计能够展现详细的趋势变化',
            type: 'success',
            confidence: 0.8,
            reasons: ['一个月内数据', '趋势分析'],
            showApplyButton: true,
        }
    } else if (daysDiff <= 365) {
        return {
            recommendedMode: 'monthly',
            title: '推荐按月统计',
            description: '时间范围在一年内，按月统计能够平衡数据详细度和可读性',
            type: 'success',
            confidence: 0.9,
            reasons: ['一年内数据', '平衡详细度和可读性'],
            showApplyButton: true,
        }
    } else if (daysDiff <= 1095) { // 3年
        if (isCrossYear) {
            return {
                recommendedMode: 'yearly',
                title: '推荐按年统计',
                description: '跨年查询且时间跨度较长，按年统计便于年度对比分析',
                type: 'success',
                confidence: 0.9,
                reasons: ['跨年查询', '长期趋势分析', '年度对比'],
                showApplyButton: true,
            }
        } else {
            return {
                recommendedMode: 'monthly',
                title: '推荐按月统计',
                description: '时间跨度适中，按月统计能够展现中期趋势',
                type: 'info',
                confidence: 0.7,
                reasons: ['中期数据', '趋势分析'],
                showApplyButton: true,
            }
        }
    } else {
        return {
            recommendedMode: 'yearly',
            title: '推荐按年统计',
            description: '时间跨度很长，按年统计能够展现长期趋势，避免数据过于密集',
            type: 'success',
            confidence: 0.9,
            reasons: ['长期数据', '避免数据密集', '长期趋势分析'],
            showApplyButton: true,
        }
    }
}

/**
 * 计算时间范围的天数差
 */
function calculateDaysDifference(timeRange: TimeRange): number {
    if (!timeRange.startDate || !timeRange.endDate) {
        return 0
    }

    const timeDiff = Math.abs(
        timeRange.endDate.getTime() - timeRange.startDate.getTime()
    )

    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
}

// ============================================================================
// 事件处理
// ============================================================================

/**
 * 处理统计模式变更
 */
function handleModeChange(mode: StatisticsMode) {
    selectedMode.value = mode
    emit('mode-change', mode)
}

/**
 * 处理年度分组变更
 */
function handleYearlyGroupingChange(enabled: boolean) {
    enableYearlyGrouping.value = enabled
    emit('yearly-grouping-change', enabled)
}

/**
 * 应用推荐
 */
function applySuggestion() {
    const currentSuggestion = suggestion.value
    if (currentSuggestion && currentSuggestion.recommendedMode) {
        selectedMode.value = currentSuggestion.recommendedMode
        emit('mode-change', currentSuggestion.recommendedMode)
        emit('suggestion-applied', currentSuggestion)
        dismissedSuggestion.value = true
    }
}

/**
 * 忽略推荐
 */
function dismissSuggestion() {
    dismissedSuggestion.value = true
    emit('suggestion-dismissed')
}

// ============================================================================
// 监听器
// ============================================================================

// 监听时间范围变化，重置推荐状态
watch(
    () => props.timeRange,
    () => {
        dismissedSuggestion.value = false
    },
    { deep: true }
)

// 监听当前模式变化
watch(
    () => props.currentMode,
    (newMode) => {
        selectedMode.value = newMode
    }
)

// 自动应用推荐
watch(
    suggestion,
    (newSuggestion) => {
        if (props.autoApply && newSuggestion && newSuggestion.recommendedMode && newSuggestion.confidence >= 0.8) {
            applySuggestion()
        }
    },
    { immediate: true }
)

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
    selectedMode.value = props.currentMode
})

// ============================================================================
// 暴露给父组件的方法
// ============================================================================

defineExpose({
    applySuggestion,
    dismissSuggestion,
    generateRecommendation,
})
</script>

<style scoped>
.statistics-mode-suggester {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.mode-selector {
    display: flex;
    align-items: center;
    gap: 8px;
}

.selector-label {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    white-space: nowrap;
}

.mode-select {
    min-width: 200px;
}

.mode-option {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mode-label {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
}

.mode-description {
    font-size: 12px;
    color: #909399;
    line-height: 1.2;
}

.suggestion-tip {
    margin-top: 8px;
}

.suggestion-alert {
    border-radius: 6px;
}

.suggestion-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.suggestion-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: #303133;
}

.suggestion-description {
    font-size: 13px;
    margin: 0;
    color: #606266;
    line-height: 1.4;
}

.suggestion-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
}

.cross-year-grouping {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border-left: 3px solid #409eff;
}

.grouping-hint {
    font-size: 12px;
    color: #909399;
}

.granularity-info {
    display: flex;
    justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .mode-selector {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }

    .mode-select {
        width: 100%;
        min-width: unset;
    }

    .suggestion-actions {
        flex-direction: column;
    }

    .cross-year-grouping {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }
}
</style>