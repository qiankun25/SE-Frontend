<template>
    <div class="time-unit-selector-example">
        <h2>时间单位选择器示例</h2>

        <!-- 基础用法 -->
        <el-card class="example-card">
            <template #header>
                <div class="card-header">
                    <span>基础用法</span>
                </div>
            </template>

            <div class="example-content">
                <TimeUnitSelector v-model="basicExample.selectedUnit" @change="handleBasicChange"
                    @picker-type-change="handlePickerTypeChange" />

                <div class="result-display">
                    <p><strong>当前选择:</strong> {{ basicExample.selectedUnit }} ({{ basicExample.config?.label }})</p>
                    <p><strong>选择器类型:</strong> {{ basicExample.pickerType }}</p>
                    <p><strong>查询策略:</strong> {{ basicExample.config?.queryStrategy }}</p>
                    <p><strong>分组表达式:</strong> {{ basicExample.config?.groupByExpression }}</p>
                </div>
            </div>
        </el-card>

        <!-- 限制可用单位 -->
        <el-card class="example-card">
            <template #header>
                <div class="card-header">
                    <span>限制可用单位</span>
                </div>
            </template>

            <div class="example-content">
                <div class="controls">
                    <el-checkbox-group v-model="restrictedExample.availableUnits">
                        <el-checkbox value="year">年</el-checkbox>
                        <el-checkbox value="month">月</el-checkbox>
                        <el-checkbox value="day">日</el-checkbox>
                    </el-checkbox-group>
                </div>

                <TimeUnitSelector v-model="restrictedExample.selectedUnit"
                    :available-units="restrictedExample.availableUnits" @change="handleRestrictedChange" />

                <div class="result-display">
                    <p><strong>可用单位:</strong> {{ restrictedExample.availableUnits.join(', ') }}</p>
                    <p><strong>当前选择:</strong> {{ restrictedExample.selectedUnit }}</p>
                </div>
            </div>
        </el-card>

        <!-- 禁用状态 -->
        <el-card class="example-card">
            <template #header>
                <div class="card-header">
                    <span>禁用状态</span>
                </div>
            </template>

            <div class="example-content">
                <div class="controls">
                    <el-switch v-model="disabledExample.disabled" active-text="禁用" inactive-text="启用" />
                </div>

                <TimeUnitSelector v-model="disabledExample.selectedUnit" :disabled="disabledExample.disabled"
                    @change="handleDisabledChange" />

                <div class="result-display">
                    <p><strong>禁用状态:</strong> {{ disabledExample.disabled ? '是' : '否' }}</p>
                    <p><strong>当前选择:</strong> {{ disabledExample.selectedUnit }}</p>
                </div>
            </div>
        </el-card>

        <!-- 调试模式 -->
        <el-card class="example-card">
            <template #header>
                <div class="card-header">
                    <span>调试模式</span>
                </div>
            </template>

            <div class="example-content">
                <TimeUnitSelector v-model="debugExample.selectedUnit" :show-debug-info="true"
                    @change="handleDebugChange" />

                <div class="result-display">
                    <p><strong>当前选择:</strong> {{ debugExample.selectedUnit }}</p>
                    <p><strong>变更历史:</strong></p>
                    <ul>
                        <li v-for="(change, index) in debugExample.changeHistory" :key="index">
                            {{ change.timestamp }}: {{ change.from }} → {{ change.to }}
                        </li>
                    </ul>
                </div>
            </div>
        </el-card>

        <!-- 与时间选择系统集成 -->
        <el-card class="example-card">
            <template #header>
                <div class="card-header">
                    <span>与时间选择系统集成</span>
                </div>
            </template>

            <div class="example-content">
                <TimeUnitSelector v-model="integrationExample.timeUnit" @change="handleIntegrationChange"
                    @picker-type-change="handleIntegrationPickerChange" />

                <!-- 模拟时间范围选择器 -->
                <div class="time-range-section">
                    <h4>时间范围选择 ({{ integrationExample.pickerType }})</h4>

                    <div v-if="integrationExample.pickerType === 'year'" class="year-picker">
                        <el-select v-model="integrationExample.startYear" placeholder="起始年份">
                            <el-option v-for="year in yearOptions" :key="year" :label="year + '年'" :value="year" />
                        </el-select>
                        <span class="range-separator">至</span>
                        <el-select v-model="integrationExample.endYear" placeholder="结束年份">
                            <el-option v-for="year in yearOptions" :key="year" :label="year + '年'" :value="year" />
                        </el-select>
                    </div>

                    <div v-else-if="integrationExample.pickerType === 'month'" class="month-picker">
                        <el-date-picker v-model="integrationExample.monthRange" type="monthrange" range-separator="至"
                            start-placeholder="开始月份" end-placeholder="结束月份" format="YYYY年MM月" value-format="YYYY-MM" />
                    </div>

                    <div v-else class="date-picker">
                        <el-date-picker v-model="integrationExample.dateRange" type="daterange" range-separator="至"
                            start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD" />
                    </div>
                </div>

                <!-- 查询参数预览 -->
                <div class="query-params-section">
                    <h4>查询参数预览</h4>
                    <pre>{{ JSON.stringify(integrationExample.queryParams, null, 2) }}</pre>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import TimeUnitSelector from '../TimeUnitSelector.vue'
import type { TimeUnit, TimeUnitConfig } from '../../types/time-selection'

// ============================================================================
// 基础用法示例
// ============================================================================

const basicExample = ref({
    selectedUnit: 'day' as TimeUnit,
    config: null as TimeUnitConfig | null,
    pickerType: 'date' as 'year' | 'month' | 'date'
})

const handleBasicChange = (unit: TimeUnit, config: TimeUnitConfig) => {
    basicExample.value.config = config
    console.log('基础示例 - 时间单位变更:', { unit, config })
}

const handlePickerTypeChange = (pickerType: 'year' | 'month' | 'date', config: TimeUnitConfig) => {
    basicExample.value.pickerType = pickerType
    console.log('基础示例 - 选择器类型变更:', { pickerType, config })
}

// ============================================================================
// 限制可用单位示例
// ============================================================================

const restrictedExample = ref({
    selectedUnit: 'year' as TimeUnit,
    availableUnits: ['year', 'month'] as TimeUnit[]
})

const handleRestrictedChange = (unit: TimeUnit, config: TimeUnitConfig) => {
    console.log('限制示例 - 时间单位变更:', { unit, config, availableUnits: restrictedExample.value.availableUnits })
}

// ============================================================================
// 禁用状态示例
// ============================================================================

const disabledExample = ref({
    selectedUnit: 'month' as TimeUnit,
    disabled: false
})

const handleDisabledChange = (unit: TimeUnit, config: TimeUnitConfig) => {
    console.log('禁用示例 - 时间单位变更:', { unit, config, disabled: disabledExample.value.disabled })
}

// ============================================================================
// 调试模式示例
// ============================================================================

interface ChangeRecord {
    timestamp: string
    from: TimeUnit
    to: TimeUnit
}

const debugExample = ref({
    selectedUnit: 'day' as TimeUnit,
    changeHistory: [] as ChangeRecord[]
})

const handleDebugChange = (unit: TimeUnit, config: TimeUnitConfig) => {
    const previousUnit = debugExample.value.selectedUnit
    debugExample.value.changeHistory.push({
        timestamp: new Date().toLocaleTimeString(),
        from: previousUnit,
        to: unit
    })

    // 限制历史记录数量
    if (debugExample.value.changeHistory.length > 10) {
        debugExample.value.changeHistory.shift()
    }

    console.log('调试示例 - 时间单位变更:', { unit, config, history: debugExample.value.changeHistory })
}

// ============================================================================
// 集成示例
// ============================================================================

const integrationExample = ref({
    timeUnit: 'day' as TimeUnit,
    pickerType: 'date' as 'year' | 'month' | 'date',
    config: null as TimeUnitConfig | null,

    // 年份选择
    startYear: null as number | null,
    endYear: null as number | null,

    // 月份选择
    monthRange: null as [string, string] | null,

    // 日期选择
    dateRange: null as [string, string] | null
})

// 年份选项（最近10年）
const yearOptions = computed(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 10; i--) {
        years.push(i)
    }
    return years
})

// 查询参数
const queryParams = computed(() => {
    const config = integrationExample.value.config
    if (!config) return {}

    const params: any = {
        timeUnit: integrationExample.value.timeUnit,
        dbTimeField: 'UPD',
        queryStrategy: config.queryStrategy,
        groupByExpression: config.groupByExpression
    }

    // 根据选择器类型添加时间范围参数
    switch (integrationExample.value.pickerType) {
        case 'year':
            if (integrationExample.value.startYear && integrationExample.value.endYear) {
                params.startDate = `${integrationExample.value.startYear}-01-01`
                params.endDate = `${integrationExample.value.endYear}-12-31`
            }
            break
        case 'month':
            if (integrationExample.value.monthRange) {
                params.startDate = `${integrationExample.value.monthRange[0]}-01`
                params.endDate = `${integrationExample.value.monthRange[1]}-31`
            }
            break
        case 'date':
            if (integrationExample.value.dateRange) {
                params.startDate = integrationExample.value.dateRange[0]
                params.endDate = integrationExample.value.dateRange[1]
            }
            break
    }

    return params
})

// 将计算属性绑定到响应式对象
watch(queryParams, (newParams) => {
    integrationExample.value.queryParams = newParams
}, { immediate: true })

const handleIntegrationChange = (unit: TimeUnit, config: TimeUnitConfig) => {
    integrationExample.value.config = config

    // 清空之前的时间选择
    integrationExample.value.startYear = null
    integrationExample.value.endYear = null
    integrationExample.value.monthRange = null
    integrationExample.value.dateRange = null

    console.log('集成示例 - 时间单位变更:', { unit, config })
}

const handleIntegrationPickerChange = (pickerType: 'year' | 'month' | 'date', config: TimeUnitConfig) => {
    integrationExample.value.pickerType = pickerType
    console.log('集成示例 - 选择器类型变更:', { pickerType, config })
}
</script>

<style scoped>
.time-unit-selector-example {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.example-card {
    margin-bottom: 24px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
}

.example-content {
    padding: 16px 0;
}

.controls {
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.result-display {
    margin-top: 16px;
    padding: 12px;
    background-color: #f0f9ff;
    border-radius: 4px;
    border-left: 4px solid #409EFF;
}

.result-display p {
    margin: 8px 0;
    font-size: 14px;
    line-height: 1.5;
}

.result-display strong {
    color: #303133;
    font-weight: 600;
}

.result-display ul {
    margin: 8px 0;
    padding-left: 20px;
}

.result-display li {
    margin: 4px 0;
    font-size: 12px;
    color: #606266;
}

.time-range-section {
    margin-top: 20px;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 4px;
}

.time-range-section h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.year-picker {
    display: flex;
    align-items: center;
    gap: 12px;
}

.range-separator {
    color: #909399;
    font-size: 14px;
}

.month-picker,
.date-picker {
    width: 100%;
}

.query-params-section {
    margin-top: 20px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 4px;
}

.query-params-section h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.query-params-section pre {
    background-color: #2d3748;
    color: #e2e8f0;
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.4;
    overflow-x: auto;
    margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .time-unit-selector-example {
        padding: 12px;
    }

    .year-picker {
        flex-direction: column;
        align-items: stretch;
    }

    .range-separator {
        text-align: center;
        margin: 8px 0;
    }
}
</style>