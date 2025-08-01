<template>
    <div class="comparison-validator-example">
        <h2>ComparisonValidator 组件示例</h2>

        <!-- 控制面板 -->
        <div class="control-panel">
            <h3>控制面板</h3>

            <div class="control-group">
                <label>
                    <input type="checkbox" v-model="comparisonEnabled" />
                    启用同期比功能
                </label>
            </div>

            <div class="control-group">
                <label>
                    <input type="checkbox" v-model="enableRealTimeValidation" />
                    启用实时验证
                </label>
            </div>

            <div class="control-group">
                <label>
                    <input type="checkbox" v-model="showValidationMessages" />
                    显示验证消息
                </label>
            </div>

            <div class="control-group">
                <label>
                    <input type="checkbox" v-model="showRealTimeHint" />
                    显示实时提示
                </label>
            </div>

            <div class="control-group">
                <label>时间范围预设:</label>
                <select v-model="selectedPreset" @change="applyPreset">
                    <option value="">请选择预设</option>
                    <option value="same-year">同一年份（2024年）</option>
                    <option value="cross-year">跨年范围（2023-2024）</option>
                    <option value="same-day">同一天</option>
                    <option value="null">空时间范围</option>
                </select>
            </div>

            <div class="control-group">
                <label>自定义时间范围:</label>
                <div class="date-inputs">
                    <input type="date" v-model="startDateInput" @change="updateTimeRange" />
                    <span>至</span>
                    <input type="date" v-model="endDateInput" @change="updateTimeRange" />
                </div>
            </div>
        </div>

        <!-- 组件演示 -->
        <div class="demo-section">
            <h3>组件演示</h3>

            <div class="demo-container">
                <ComparisonValidator :time-range="timeRange" :comparison-enabled="comparisonEnabled"
                    :enable-real-time-validation="enableRealTimeValidation"
                    :show-validation-messages="showValidationMessages" :show-real-time-hint="showRealTimeHint"
                    @validation-update="handleValidationUpdate" @continue-cross-year="handleContinueCrossYear"
                    @reselect-time="handleReselectTime" @validation-change="handleValidationChange" />
            </div>
        </div>

        <!-- 状态显示 -->
        <div class="status-section">
            <h3>当前状态</h3>

            <div class="status-grid">
                <div class="status-item">
                    <strong>时间范围:</strong>
                    <pre>{{ timeRangeDisplay }}</pre>
                </div>

                <div class="status-item">
                    <strong>验证结果:</strong>
                    <pre>{{ validationResultDisplay }}</pre>
                </div>

                <div class="status-item">
                    <strong>配置状态:</strong>
                    <pre>{{ configDisplay }}</pre>
                </div>
            </div>
        </div>

        <!-- 事件日志 -->
        <div class="events-section">
            <h3>事件日志</h3>
            <div class="events-log">
                <div v-for="(event, index) in eventLog" :key="index" class="event-item" :class="`event-${event.type}`">
                    <span class="event-time">{{ event.time }}</span>
                    <span class="event-type">{{ event.type }}</span>
                    <span class="event-data">{{ event.data }}</span>
                </div>
            </div>
            <button @click="clearEventLog" class="clear-button">清空日志</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ComparisonValidator from '../ComparisonValidator.vue'
import type { TimeRange, ValidationResult } from '../../types/time-selection'

// ============================================================================
// Reactive State
// ============================================================================

/** 时间范围 */
const timeRange = ref<TimeRange | null>(null)

/** 同期比启用状态 */
const comparisonEnabled = ref(true)

/** 实时验证启用状态 */
const enableRealTimeValidation = ref(true)

/** 显示验证消息 */
const showValidationMessages = ref(true)

/** 显示实时提示 */
const showRealTimeHint = ref(false)

/** 当前验证结果 */
const currentValidationResult = ref<ValidationResult | null>(null)

/** 预设选择 */
const selectedPreset = ref('')

/** 开始日期输入 */
const startDateInput = ref('')

/** 结束日期输入 */
const endDateInput = ref('')

/** 事件日志 */
const eventLog = ref<Array<{
    time: string
    type: string
    data: string
}>>([])

// ============================================================================
// Computed Properties
// ============================================================================

/** 时间范围显示 */
const timeRangeDisplay = computed(() => {
    if (!timeRange.value) {
        return 'null'
    }

    return {
        startDate: timeRange.value.startDate?.toISOString().split('T')[0] || null,
        endDate: timeRange.value.endDate?.toISOString().split('T')[0] || null,
        unit: timeRange.value.unit
    }
})

/** 验证结果显示 */
const validationResultDisplay = computed(() => {
    return currentValidationResult.value || 'null'
})

/** 配置显示 */
const configDisplay = computed(() => {
    return {
        comparisonEnabled: comparisonEnabled.value,
        enableRealTimeValidation: enableRealTimeValidation.value,
        showValidationMessages: showValidationMessages.value,
        showRealTimeHint: showRealTimeHint.value
    }
})

// ============================================================================
// Methods
// ============================================================================

/**
 * 应用预设时间范围
 */
const applyPreset = (): void => {
    switch (selectedPreset.value) {
        case 'same-year':
            timeRange.value = {
                startDate: new Date(2024, 0, 1),
                endDate: new Date(2024, 11, 31),
                unit: 'day'
            }
            break

        case 'cross-year':
            timeRange.value = {
                startDate: new Date(2023, 5, 1),
                endDate: new Date(2024, 5, 30),
                unit: 'day'
            }
            break

        case 'same-day':
            timeRange.value = {
                startDate: new Date(2024, 5, 15),
                endDate: new Date(2024, 5, 15),
                unit: 'day'
            }
            break

        case 'null':
            timeRange.value = null
            break
    }

    // 更新输入框
    if (timeRange.value) {
        startDateInput.value = timeRange.value.startDate?.toISOString().split('T')[0] || ''
        endDateInput.value = timeRange.value.endDate?.toISOString().split('T')[0] || ''
    } else {
        startDateInput.value = ''
        endDateInput.value = ''
    }

    logEvent('preset-applied', `应用预设: ${selectedPreset.value}`)
}

/**
 * 更新时间范围
 */
const updateTimeRange = (): void => {
    if (startDateInput.value && endDateInput.value) {
        timeRange.value = {
            startDate: new Date(startDateInput.value),
            endDate: new Date(endDateInput.value),
            unit: 'day'
        }
    } else {
        timeRange.value = null
    }

    logEvent('time-range-updated', '手动更新时间范围')
}

/**
 * 记录事件
 */
const logEvent = (type: string, data: string): void => {
    eventLog.value.unshift({
        time: new Date().toLocaleTimeString(),
        type,
        data
    })

    // 限制日志数量
    if (eventLog.value.length > 50) {
        eventLog.value = eventLog.value.slice(0, 50)
    }
}

/**
 * 清空事件日志
 */
const clearEventLog = (): void => {
    eventLog.value = []
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * 处理验证更新事件
 */
const handleValidationUpdate = (result: ValidationResult): void => {
    currentValidationResult.value = result
    logEvent('validation-update', `验证结果: ${result.level} - ${result.message}`)
}

/**
 * 处理继续跨年事件
 */
const handleContinueCrossYear = (): void => {
    logEvent('continue-cross-year', '用户选择继续跨年查询')
}

/**
 * 处理重新选择时间事件
 */
const handleReselectTime = (): void => {
    logEvent('reselect-time', '用户选择重新选择时间')

    // 演示：重置时间范围
    timeRange.value = null
    startDateInput.value = ''
    endDateInput.value = ''
    selectedPreset.value = ''
}

/**
 * 处理验证状态变化事件
 */
const handleValidationChange = (isValid: boolean, level: string): void => {
    logEvent('validation-change', `验证状态变化: ${isValid ? '有效' : '无效'}, 级别: ${level}`)
}

// ============================================================================
// Watchers
// ============================================================================

/** 监听配置变化 */
watch(
    [comparisonEnabled, enableRealTimeValidation, showValidationMessages, showRealTimeHint],
    () => {
        logEvent('config-change', '配置已更新')
    }
)

// ============================================================================
// Lifecycle
// ============================================================================

// 初始化默认状态
applyPreset()
selectedPreset.value = 'cross-year'
applyPreset()
</script>

<style scoped>
.comparison-validator-example {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h2 {
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
    margin-bottom: 30px;
}

h3 {
    color: #34495e;
    margin-bottom: 15px;
}

/* 控制面板 */
.control-panel {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
}

.control-group {
    margin-bottom: 15px;
}

.control-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #495057;
}

.control-group input[type="checkbox"] {
    margin-right: 8px;
}

.control-group select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
}

.date-inputs {
    display: flex;
    align-items: center;
    gap: 10px;
}

.date-inputs input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
}

.date-inputs span {
    color: #6c757d;
    font-weight: 500;
}

/* 演示区域 */
.demo-section {
    margin-bottom: 30px;
}

.demo-container {
    background: white;
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    padding: 20px;
    min-height: 100px;
}

/* 状态显示 */
.status-section {
    margin-bottom: 30px;
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.status-item {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
}

.status-item strong {
    display: block;
    margin-bottom: 8px;
    color: #495057;
}

.status-item pre {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 10px;
    margin: 0;
    font-size: 12px;
    overflow-x: auto;
    white-space: pre-wrap;
}

/* 事件日志 */
.events-section {
    margin-bottom: 30px;
}

.events-log {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 10px;
}

.event-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
    font-size: 13px;
}

.event-item:last-child {
    border-bottom: none;
}

.event-time {
    color: #6c757d;
    font-family: monospace;
    min-width: 80px;
}

.event-type {
    background: #e9ecef;
    color: #495057;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    min-width: 120px;
    text-align: center;
}

.event-data {
    flex: 1;
    color: #212529;
}

/* 事件类型颜色 */
.event-validation-update .event-type {
    background: #d4edda;
    color: #155724;
}

.event-continue-cross-year .event-type {
    background: #fff3cd;
    color: #856404;
}

.event-reselect-time .event-type {
    background: #d1ecf1;
    color: #0c5460;
}

.event-validation-change .event-type {
    background: #f8d7da;
    color: #721c24;
}

.event-config-change .event-type {
    background: #e2e3e5;
    color: #383d41;
}

.event-preset-applied .event-type {
    background: #cce5ff;
    color: #004085;
}

.event-time-range-updated .event-type {
    background: #e7f3ff;
    color: #0056b3;
}

.clear-button {
    background: #6c757d;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.clear-button:hover {
    background: #5a6268;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .comparison-validator-example {
        padding: 15px;
    }

    .status-grid {
        grid-template-columns: 1fr;
    }

    .date-inputs {
        flex-direction: column;
        align-items: stretch;
    }

    .date-inputs span {
        text-align: center;
        margin: 5px 0;
    }

    .event-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }

    .event-time,
    .event-type {
        min-width: auto;
    }
}
</style>