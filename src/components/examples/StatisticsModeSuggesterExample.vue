<template>
    <div class="statistics-mode-suggester-example">
        <h2>统计模式建议器示例</h2>

        <!-- 控制面板 -->
        <div class="control-panel">
            <h3>测试控制</h3>

            <div class="control-group">
                <label>时间范围预设：</label>
                <el-select v-model="selectedPreset" @change="applyPreset">
                    <el-option v-for="preset in timePresets" :key="preset.key" :label="preset.label"
                        :value="preset.key" />
                </el-select>
            </div>

            <div class="control-group">
                <label>当前统计模式：</label>
                <el-radio-group v-model="currentMode">
                    <el-radio label="total">总量统计</el-radio>
                    <el-radio label="yearly">按年统计</el-radio>
                    <el-radio label="monthly">按月统计</el-radio>
                    <el-radio label="daily">按日统计</el-radio>
                </el-radio-group>
            </div>

            <div class="control-group">
                <el-checkbox v-model="showSuggestion">显示智能推荐</el-checkbox>
                <el-checkbox v-model="autoApply">自动应用推荐</el-checkbox>
            </div>
        </div>

        <!-- 当前状态显示 -->
        <div class="status-panel">
            <h3>当前状态</h3>
            <div class="status-info">
                <p><strong>时间范围：</strong> {{ formatTimeRange(timeRange) }}</p>
                <p><strong>时间跨度：</strong> {{ calculateDays(timeRange) }} 天</p>
                <p><strong>统计模式：</strong> {{ getModeLabel(currentMode) }}</p>
                <p><strong>是否跨年：</strong> {{ isCrossYear(timeRange) ? '是' : '否' }}</p>
            </div>
        </div>

        <!-- 统计模式建议器组件 -->
        <div class="suggester-panel">
            <h3>统计模式建议器</h3>
            <StatisticsModeSuggester :time-range="timeRange" :current-mode="currentMode"
                :show-suggestion="showSuggestion" :auto-apply="autoApply" @mode-change="handleModeChange"
                @yearly-grouping-change="handleYearlyGroupingChange" @suggestion-applied="handleSuggestionApplied"
                @suggestion-dismissed="handleSuggestionDismissed" />
        </div>

        <!-- 事件日志 -->
        <div class="event-log">
            <h3>事件日志</h3>
            <div class="log-controls">
                <el-button size="small" @click="clearLog">清空日志</el-button>
                <el-button size="small" @click="exportLog">导出日志</el-button>
            </div>
            <div class="log-content">
                <div v-for="(log, index) in eventLogs" :key="index" :class="['log-entry', `log-${log.type}`]">
                    <span class="log-time">{{ log.timestamp }}</span>
                    <span class="log-type">{{ log.type }}</span>
                    <span class="log-message">{{ log.message }}</span>
                    <pre v-if="log.data" class="log-data">{{ JSON.stringify(log.data, null, 2) }}</pre>
                </div>
            </div>
        </div>

        <!-- 推荐分析 -->
        <div class="analysis-panel">
            <h3>推荐分析</h3>
            <div v-if="currentRecommendation" class="recommendation-analysis">
                <div class="analysis-item">
                    <strong>推荐模式：</strong> {{ getModeLabel(currentRecommendation.recommendedMode) }}
                </div>
                <div class="analysis-item">
                    <strong>置信度：</strong>
                    <el-progress :percentage="Math.round(currentRecommendation.confidence * 100)"
                        :color="getConfidenceColor(currentRecommendation.confidence)" />
                </div>
                <div class="analysis-item">
                    <strong>推荐原因：</strong>
                    <ul>
                        <li v-for="reason in currentRecommendation.reasons" :key="reason">
                            {{ reason }}
                        </li>
                    </ul>
                </div>
            </div>
            <div v-else class="no-recommendation">
                当前无推荐或推荐已被忽略
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
    ElSelect,
    ElOption,
    ElRadioGroup,
    ElRadio,
    ElCheckbox,
    ElButton,
    ElProgress
} from 'element-plus'
import StatisticsModeSuggester from '../StatisticsModeSuggester.vue'
import type { TimeRange, StatisticsMode } from '../../types/time-selection'

// ============================================================================
// 响应式数据
// ============================================================================

const selectedPreset = ref('thisYear')
const currentMode = ref<StatisticsMode>('total')
const showSuggestion = ref(true)
const autoApply = ref(false)
const timeRange = ref<TimeRange | null>(null)
const yearlyGroupingEnabled = ref(false)
const eventLogs = ref<Array<{
    timestamp: string
    type: string
    message: string
    data?: any
}>>([])
const currentRecommendation = ref<any>(null)

// ============================================================================
// 时间预设配置
// ============================================================================

const timePresets = [
    {
        key: 'none',
        label: '无时间限制',
        timeRange: null
    },
    {
        key: 'week',
        label: '近一周',
        timeRange: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            unit: 'day' as const
        }
    },
    {
        key: 'month',
        label: '近一月',
        timeRange: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            unit: 'day' as const
        }
    },
    {
        key: 'quarter',
        label: '近三月',
        timeRange: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            unit: 'day' as const
        }
    },
    {
        key: 'halfYear',
        label: '近半年',
        timeRange: {
            startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            unit: 'day' as const
        }
    },
    {
        key: 'thisYear',
        label: '今年',
        timeRange: {
            startDate: new Date(new Date().getFullYear(), 0, 1),
            endDate: new Date(new Date().getFullYear(), 11, 31),
            unit: 'day' as const
        }
    },
    {
        key: 'lastYear',
        label: '去年',
        timeRange: {
            startDate: new Date(new Date().getFullYear() - 1, 0, 1),
            endDate: new Date(new Date().getFullYear() - 1, 11, 31),
            unit: 'day' as const
        }
    },
    {
        key: 'twoYears',
        label: '近两年',
        timeRange: {
            startDate: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            unit: 'day' as const
        }
    },
    {
        key: 'crossYear',
        label: '跨年范围 (2023-2024)',
        timeRange: {
            startDate: new Date(2023, 0, 1),
            endDate: new Date(2024, 11, 31),
            unit: 'day' as const
        }
    }
]

// ============================================================================
// 计算属性
// ============================================================================

const modeLabels = {
    total: '总量统计',
    yearly: '按年统计',
    monthly: '按月统计',
    daily: '按日统计'
}

// ============================================================================
// 工具函数
// ============================================================================

function formatTimeRange(range: TimeRange | null): string {
    if (!range || !range.startDate || !range.endDate) {
        return '无限制'
    }

    const start = range.startDate.toLocaleDateString()
    const end = range.endDate.toLocaleDateString()
    return `${start} 至 ${end}`
}

function calculateDays(range: TimeRange | null): number {
    if (!range || !range.startDate || !range.endDate) {
        return 0
    }

    const timeDiff = Math.abs(range.endDate.getTime() - range.startDate.getTime())
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
}

function isCrossYear(range: TimeRange | null): boolean {
    if (!range || !range.startDate || !range.endDate) {
        return false
    }

    return range.startDate.getFullYear() !== range.endDate.getFullYear()
}

function getModeLabel(mode: StatisticsMode): string {
    return modeLabels[mode] || mode
}

function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#67c23a'
    if (confidence >= 0.6) return '#e6a23c'
    return '#f56c6c'
}

function addLog(type: string, message: string, data?: any) {
    eventLogs.value.unshift({
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        data
    })

    // 限制日志数量
    if (eventLogs.value.length > 50) {
        eventLogs.value = eventLogs.value.slice(0, 50)
    }
}

// ============================================================================
// 事件处理
// ============================================================================

function applyPreset() {
    const preset = timePresets.find(p => p.key === selectedPreset.value)
    if (preset) {
        timeRange.value = preset.timeRange
        addLog('preset', `应用时间预设: ${preset.label}`, preset.timeRange)
    }
}

function handleModeChange(mode: StatisticsMode) {
    const oldMode = currentMode.value
    currentMode.value = mode
    addLog('mode-change', `统计模式变更: ${getModeLabel(oldMode)} → ${getModeLabel(mode)}`, {
        oldMode,
        newMode: mode
    })
}

function handleYearlyGroupingChange(enabled: boolean) {
    yearlyGroupingEnabled.value = enabled
    addLog('yearly-grouping', `年度分组: ${enabled ? '启用' : '禁用'}`, { enabled })
}

function handleSuggestionApplied(suggestion: any) {
    currentRecommendation.value = suggestion
    addLog('suggestion-applied', `应用推荐: ${getModeLabel(suggestion.recommendedMode)}`, suggestion)
}

function handleSuggestionDismissed() {
    addLog('suggestion-dismissed', '忽略推荐')
}

function clearLog() {
    eventLogs.value = []
    addLog('system', '日志已清空')
}

function exportLog() {
    const logData = JSON.stringify(eventLogs.value, null, 2)
    const blob = new Blob([logData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statistics-suggester-log-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    addLog('system', '日志已导出')
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
    // 初始化默认时间范围
    applyPreset()
    addLog('system', '示例组件已加载')
})
</script>

<style scoped>
.statistics-mode-suggester-example {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.statistics-mode-suggester-example h2 {
    color: #303133;
    border-bottom: 2px solid #409eff;
    padding-bottom: 10px;
    margin-bottom: 30px;
}

.statistics-mode-suggester-example h3 {
    color: #606266;
    margin-bottom: 15px;
    font-size: 16px;
}

.control-panel,
.status-panel,
.suggester-panel,
.event-log,
.analysis-panel {
    background: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-group {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 15px;
}

.control-group label {
    min-width: 120px;
    font-weight: 500;
    color: #606266;
}

.status-info p {
    margin: 8px 0;
    color: #606266;
}

.log-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
}

.log-content {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 10px;
    background: #fafafa;
}

.log-entry {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
}

.log-entry:last-child {
    border-bottom: none;
}

.log-time {
    color: #909399;
    font-family: monospace;
    min-width: 80px;
}

.log-type {
    font-weight: 600;
    min-width: 120px;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    text-transform: uppercase;
}

.log-mode-change .log-type {
    background: #e1f3d8;
    color: #529b2e;
}

.log-suggestion-applied .log-type {
    background: #d9ecff;
    color: #337ecc;
}

.log-suggestion-dismissed .log-type {
    background: #fdf6ec;
    color: #b88230;
}

.log-system .log-type {
    background: #f4f4f5;
    color: #73767a;
}

.log-message {
    flex: 1;
    color: #303133;
}

.log-data {
    margin-top: 4px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 3px;
    font-size: 11px;
    color: #606266;
    white-space: pre-wrap;
    word-break: break-all;
}

.recommendation-analysis {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.analysis-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.analysis-item ul {
    margin: 0;
    padding-left: 20px;
}

.analysis-item li {
    margin: 4px 0;
    color: #606266;
}

.no-recommendation {
    color: #909399;
    font-style: italic;
    text-align: center;
    padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .statistics-mode-suggester-example {
        padding: 10px;
    }

    .control-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }

    .control-group label {
        min-width: unset;
    }

    .log-entry {
        flex-direction: column;
        gap: 4px;
    }

    .log-time,
    .log-type {
        min-width: unset;
    }
}
</style>