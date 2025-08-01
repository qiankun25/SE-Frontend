<template>
    <div class="time-selection-example">
        <h2>时间选择组件示例</h2>

        <!-- 基础使用示例 -->
        <div class="example-section">
            <h3>基础使用</h3>
            <TimeSelectionComponent v-model="basicState" title="基础时间选择" @change="handleBasicChange"
                @query-params-update="handleQueryParamsUpdate" />

            <div class="state-display">
                <h4>当前状态:</h4>
                <pre>{{ JSON.stringify(basicState, null, 2) }}</pre>
            </div>
        </div>

        <!-- 自定义配置示例 -->
        <div class="example-section">
            <h3>自定义配置</h3>
            <TimeSelectionComponent v-model="customState" :config="customConfig" title="自定义配置示例" size="large"
                :show-debug-info="true" @change="handleCustomChange" />
        </div>

        <!-- 禁用状态示例 -->
        <div class="example-section">
            <h3>禁用状态</h3>
            <el-switch v-model="isDisabled" active-text="启用" inactive-text="禁用" />
            <TimeSelectionComponent v-model="disabledState" :disabled="isDisabled" title="禁用状态示例" size="small" />
        </div>

        <!-- 移动端适配示例 -->
        <div class="example-section">
            <h3>移动端适配</h3>
            <div class="mobile-container">
                <TimeSelectionComponent v-model="mobileState" title="移动端适配" :show-help="false"
                    @change="handleMobileChange" />
            </div>
        </div>

        <!-- 查询参数展示 -->
        <div class="example-section">
            <h3>查询参数</h3>
            <div class="query-params-display">
                <h4>当前查询参数:</h4>
                <pre>{{ JSON.stringify(currentQueryParams, null, 2) }}</pre>
            </div>
        </div>

        <!-- 事件日志 -->
        <div class="example-section">
            <h3>事件日志</h3>
            <div class="event-log">
                <el-button @click="clearEventLog" size="small" type="danger">清空日志</el-button>
                <div class="log-entries">
                    <div v-for="(event, index) in eventLog" :key="index" class="log-entry" :class="`log-${event.type}`">
                        <span class="log-time">{{ event.time }}</span>
                        <span class="log-type">{{ event.type }}</span>
                        <span class="log-message">{{ event.message }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="example-section">
            <h3>操作示例</h3>
            <div class="action-buttons">
                <el-button @click="resetAllStates" type="primary">重置所有状态</el-button>
                <el-button @click="setPresetState" type="success">设置预设状态</el-button>
                <el-button @click="toggleComparison" type="warning">切换同期比</el-button>
                <el-button @click="changeTimeUnit" type="info">切换时间单位</el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElSwitch, ElButton } from 'element-plus'
import TimeSelectionComponent from '../TimeSelectionComponent.vue'
import type {
    TimeSelectionState,
    TimeSelectionConfig,
    TimeSelectionChangeEvent,
    QueryParams
} from '../../types/time-selection'

// ============================================================================
// 响应式数据
// ============================================================================

/** 基础示例状态 */
const basicState = ref<TimeSelectionState>({
    quickSelection: null,
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

/** 自定义配置示例状态 */
const customState = ref<TimeSelectionState>({
    quickSelection: 'thisYear',
    timeUnit: 'month',
    timeRange: {
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
        unit: 'month'
    },
    comparisonEnabled: false,
    statisticsMode: 'monthly',
    validation: {
        isValid: true,
        level: 'success',
        message: ''
    }
})

/** 禁用状态示例 */
const disabledState = ref<TimeSelectionState>({
    quickSelection: 'recent3months',
    timeUnit: 'day',
    timeRange: {
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 2, 31),
        unit: 'day'
    },
    comparisonEnabled: true,
    statisticsMode: 'monthly',
    validation: {
        isValid: true,
        level: 'success',
        message: ''
    }
})

/** 移动端示例状态 */
const mobileState = ref<TimeSelectionState>({
    quickSelection: 'recent6months',
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

/** 是否禁用 */
const isDisabled = ref(false)

/** 当前查询参数 */
const currentQueryParams = ref<QueryParams | null>(null)

/** 事件日志 */
interface EventLogEntry {
    time: string
    type: string
    message: string
}

const eventLog = ref<EventLogEntry[]>([])

// ============================================================================
// 自定义配置
// ============================================================================

const customConfig: Partial<TimeSelectionConfig> = {
    defaultTimeUnit: 'month',
    showComparison: true,
    showStatisticsSuggestion: true,
    quickSelection: {
        options: [
            {
                key: 'thisYear',
                label: '今年',
                timeRange: {
                    startDate: new Date(2024, 0, 1),
                    endDate: new Date(2024, 11, 31),
                    unit: 'month'
                },
                statisticsMode: 'monthly',
                description: '查询当前年度数据，按月统计'
            },
            {
                key: 'lastYear',
                label: '去年',
                timeRange: {
                    startDate: new Date(2023, 0, 1),
                    endDate: new Date(2023, 11, 31),
                    unit: 'month'
                },
                statisticsMode: 'monthly',
                description: '查询上一年度数据，按月统计'
            },
            {
                key: 'recent2years',
                label: '近两年',
                timeRange: {
                    startDate: new Date(2022, 0, 1),
                    endDate: new Date(2024, 11, 31),
                    unit: 'month'
                },
                statisticsMode: 'yearly',
                description: '查询近两年数据，按年统计'
            }
        ],
        defaultOption: 'thisYear',
        showCustomOption: true
    },
    validation: {
        enableRealTimeValidation: true,
        showValidationMessages: true,
        rules: {
            validateDateRange: true,
            validateComparisonRange: true,
            validateFutureDate: true,
            maxTimeSpanDays: 1095 // 3年
        }
    }
}

// ============================================================================
// 事件处理函数
// ============================================================================

/**
 * 添加事件日志
 */
function addEventLog(type: string, message: string) {
    const now = new Date()
    const time = now.toLocaleTimeString()

    eventLog.value.unshift({
        time,
        type,
        message
    })

    // 限制日志条数
    if (eventLog.value.length > 50) {
        eventLog.value = eventLog.value.slice(0, 50)
    }
}

/**
 * 处理基础示例变更
 */
function handleBasicChange(event: TimeSelectionChangeEvent) {
    addEventLog('change', `基础示例状态变更: ${event.changeType} (来源: ${event.source})`)
    console.log('[BasicExample] 状态变更:', event)
}

/**
 * 处理自定义配置示例变更
 */
function handleCustomChange(event: TimeSelectionChangeEvent) {
    addEventLog('change', `自定义配置示例状态变更: ${event.changeType}`)
    console.log('[CustomExample] 状态变更:', event)
}

/**
 * 处理移动端示例变更
 */
function handleMobileChange(event: TimeSelectionChangeEvent) {
    addEventLog('change', `移动端示例状态变更: ${event.changeType}`)
    console.log('[MobileExample] 状态变更:', event)
}

/**
 * 处理查询参数更新
 */
function handleQueryParamsUpdate(params: QueryParams) {
    currentQueryParams.value = params
    addEventLog('query-params', `查询参数已更新: ${params.timeUnit} - ${params.queryStrategy}`)
    console.log('[QueryParams] 参数更新:', params)
}

/**
 * 清空事件日志
 */
function clearEventLog() {
    eventLog.value = []
    addEventLog('system', '事件日志已清空')
}

// ============================================================================
// 操作方法
// ============================================================================

/**
 * 重置所有状态
 */
function resetAllStates() {
    basicState.value = {
        quickSelection: null,
        timeUnit: 'day',
        timeRange: null,
        comparisonEnabled: false,
        statisticsMode: 'total',
        validation: {
            isValid: true,
            level: 'success',
            message: ''
        }
    }

    customState.value = { ...basicState.value }
    disabledState.value = { ...basicState.value }
    mobileState.value = { ...basicState.value }

    addEventLog('action', '所有状态已重置')
}

/**
 * 设置预设状态
 */
function setPresetState() {
    const presetState: TimeSelectionState = {
        quickSelection: 'recent6months',
        timeUnit: 'month',
        timeRange: {
            startDate: new Date(2024, 0, 1),
            endDate: new Date(2024, 5, 30),
            unit: 'month'
        },
        comparisonEnabled: true,
        statisticsMode: 'monthly',
        validation: {
            isValid: true,
            level: 'success',
            message: ''
        }
    }

    basicState.value = { ...presetState }
    addEventLog('action', '已设置预设状态: 近六月按月统计，启用同期比')
}

/**
 * 切换同期比
 */
function toggleComparison() {
    basicState.value.comparisonEnabled = !basicState.value.comparisonEnabled
    addEventLog('action', `同期比已${basicState.value.comparisonEnabled ? '启用' : '禁用'}`)
}

/**
 * 切换时间单位
 */
function changeTimeUnit() {
    const units = ['day', 'month', 'year'] as const
    const currentIndex = units.indexOf(basicState.value.timeUnit)
    const nextIndex = (currentIndex + 1) % units.length
    const nextUnit = units[nextIndex]

    basicState.value.timeUnit = nextUnit
    basicState.value.timeRange = null // 清空时间范围
    basicState.value.quickSelection = null // 清空快捷选择

    addEventLog('action', `时间单位已切换为: ${nextUnit}`)
}
</script>

<style scoped>
.time-selection-example {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.time-selection-example h2 {
    color: #303133;
    margin-bottom: 30px;
    text-align: center;
}

.example-section {
    margin-bottom: 40px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.example-section h3 {
    color: #495057;
    margin-bottom: 20px;
    font-size: 18px;
    font-weight: 600;
}

/* 状态显示 */
.state-display,
.query-params-display {
    margin-top: 20px;
    padding: 16px;
    background: #ffffff;
    border-radius: 6px;
    border: 1px solid #dee2e6;
}

.state-display h4,
.query-params-display h4 {
    color: #6c757d;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
}

.state-display pre,
.query-params-display pre {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #e9ecef;
    font-size: 12px;
    line-height: 1.4;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: #495057;
}

/* 移动端容器 */
.mobile-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 16px;
    background: #ffffff;
    border-radius: 8px;
    border: 2px dashed #6c757d;
    position: relative;
}

.mobile-container::before {
    content: '移动端模拟';
    position: absolute;
    top: -10px;
    left: 16px;
    background: #f8f9fa;
    padding: 4px 8px;
    font-size: 12px;
    color: #6c757d;
    border-radius: 4px;
}

/* 事件日志 */
.event-log {
    background: #ffffff;
    border-radius: 6px;
    border: 1px solid #dee2e6;
    padding: 16px;
}

.log-entries {
    max-height: 300px;
    overflow-y: auto;
    margin-top: 12px;
}

.log-entry {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 4px;
    font-size: 13px;
    line-height: 1.4;
}

.log-entry.log-change {
    background: #e3f2fd;
    border-left: 3px solid #2196f3;
}

.log-entry.log-query-params {
    background: #f3e5f5;
    border-left: 3px solid #9c27b0;
}

.log-entry.log-action {
    background: #e8f5e9;
    border-left: 3px solid #4caf50;
}

.log-entry.log-system {
    background: #fff3e0;
    border-left: 3px solid #ff9800;
}

.log-time {
    font-family: 'Courier New', monospace;
    color: #6c757d;
    font-size: 11px;
    min-width: 80px;
}

.log-type {
    font-weight: 600;
    color: #495057;
    min-width: 100px;
    text-transform: uppercase;
    font-size: 11px;
}

.log-message {
    flex: 1;
    color: #212529;
}

/* 操作按钮 */
.action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.action-buttons .el-button {
    flex: 1;
    min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .time-selection-example {
        padding: 16px;
    }

    .example-section {
        padding: 16px;
        margin-bottom: 24px;
    }

    .action-buttons {
        flex-direction: column;
    }

    .action-buttons .el-button {
        width: 100%;
    }

    .mobile-container {
        max-width: 100%;
    }

    .log-entry {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .log-time,
    .log-type {
        min-width: auto;
    }
}

/* 滚动条样式 */
.log-entries::-webkit-scrollbar {
    width: 6px;
}

.log-entries::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.log-entries::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.log-entries::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>