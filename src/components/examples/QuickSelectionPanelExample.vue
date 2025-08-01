<template>
    <div class="quick-selection-example">
        <h2>快捷选择面板组件示例</h2>

        <!-- 基础用法 -->
        <div class="example-section">
            <h3>基础用法</h3>
            <QuickSelectionPanel v-model="selectedOption" @option-select="handleOptionSelect"
                @custom-select="handleCustomSelect" @option-hover="handleOptionHover" />
            <div class="result-display">
                <p><strong>当前选择:</strong> {{ selectedOption || '未选择' }}</p>
                <p><strong>选择的选项:</strong> {{ selectedOptionInfo }}</p>
            </div>
        </div>

        <!-- 自定义配置 -->
        <div class="example-section">
            <h3>自定义配置</h3>
            <QuickSelectionPanel v-model="customSelectedOption" :custom-options="customOptions"
                :show-description="false" :show-statistics-suggestion="false"
                @option-select="handleCustomOptionSelect" />
            <div class="result-display">
                <p><strong>自定义选择:</strong> {{ customSelectedOption || '未选择' }}</p>
            </div>
        </div>

        <!-- 不同尺寸 -->
        <div class="example-section">
            <h3>不同尺寸</h3>
            <div class="size-examples">
                <div class="size-example">
                    <h4>小尺寸</h4>
                    <QuickSelectionPanel v-model="smallSizeOption" size="small" :show-description="false" />
                </div>
                <div class="size-example">
                    <h4>大尺寸</h4>
                    <QuickSelectionPanel v-model="largeSizeOption" size="large" :show-description="false" />
                </div>
            </div>
        </div>

        <!-- 禁用状态 -->
        <div class="example-section">
            <h3>禁用状态</h3>
            <el-switch v-model="isDisabled" active-text="启用" inactive-text="禁用" />
            <QuickSelectionPanel v-model="disabledOption" :disabled="isDisabled" :show-description="false" />
        </div>

        <!-- 事件日志 */
    <div class="example-section">
      <h3>事件日志</h3>
      <div class="event-log">
        <div
          v-for="(event, index) in eventLog"
          :key="index"
          class="event-item"
        >
          <span class="event-time">{{ event.time }}</span>
          <span class="event-type">{{ event.type }}</span>
          <span class="event-data">{{ event.data }}</span>
        </div>
      </div>
      <el-button @click="clearEventLog" size="small">清空日志</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElSwitch, ElButton } from 'element-plus'
import QuickSelectionPanel from '../QuickSelectionPanel.vue'
import type { QuickOption } from '../../types/time-selection'

// ============================================================================
// 响应式数据
// ============================================================================

const selectedOption = ref<string | null>(null)
const customSelectedOption = ref<string | null>(null)
const smallSizeOption = ref<string | null>(null)
const largeSizeOption = ref<string | null>(null)
const disabledOption = ref<string | null>('thisYear')
const isDisabled = ref(false)

// 事件日志
const eventLog = ref<Array<{
  time: string
  type: string
  data: string
}>>([])

// 自定义选项配置
const customOptions: QuickOption[] = [
  {
    key: 'last7days',
    label: '近7天',
    timeRange: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      unit: 'day'
    },
    statisticsMode: 'daily',
    description: '查询最近7天的数据'
  },
  {
    key: 'last30days',
    label: '近30天',
    timeRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      unit: 'day'
    },
    statisticsMode: 'daily',
    description: '查询最近30天的数据'
  },
  {
    key: 'currentQuarter',
    label: '本季度',
    timeRange: {
      startDate: getCurrentQuarterStart(),
      endDate: getCurrentQuarterEnd(),
      unit: 'day'
    },
    statisticsMode: 'monthly',
    description: '查询当前季度的数据'
  }
]

// ============================================================================
// 计算属性
// ============================================================================

const selectedOptionInfo = computed(() => {
  if (!selectedOption.value) return '无'
  
  // 这里可以根据选择的选项返回详细信息
  const optionLabels: Record<string, string> = {
    'historical': '历史总量 - 查询所有历史数据',
    'recent2years': '近两年 - 查询近两年数据',
    'recent6months': '近六月 - 查询近六个月数据',
    'recent3months': '近三月 - 查询近三个月数据',
    'thisYear': '今年 - 查询当前年度数据',
    'lastYear': '去年 - 查询上一年度数据',
    'custom': '自定义 - 用户自定义时间范围'
  }
  
  return optionLabels[selectedOption.value] || selectedOption.value
})

// ============================================================================
// 方法定义
// ============================================================================

/**
 * 处理选项选择
 */
function handleOptionSelect(option: QuickOption) {
  addEventLog('option-select', `选择了选项: ${option.label} (${option.key})`)
}

/**
 * 处理自定义选择
 */
function handleCustomSelect() {
  addEventLog('custom-select', '点击了自定义选项')
}

/**
 * 处理选项悬停
 */
function handleOptionHover(option: QuickOption | null) {
  if (option) {
    addEventLog('option-hover', `悬停在选项: ${option.label}`)
  } else {
    addEventLog('option-hover', '离开悬停')
  }
}

/**
 * 处理自定义选项选择
 */
function handleCustomOptionSelect(option: QuickOption) {
  addEventLog('custom-option-select', `自定义选项: ${option.label}`)
}

/**
 * 添加事件日志
 */
function addEventLog(type: string, data: string) {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  
  eventLog.value.unshift({
    time,
    type,
    data
  })
  
  // 限制日志数量
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20)
  }
}

/**
 * 清空事件日志
 */
function clearEventLog() {
  eventLog.value = []
}

/**
 * 获取当前季度开始日期
 */
function getCurrentQuarterStart(): Date {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  return new Date(now.getFullYear(), quarter * 3, 1)
}

/**
 * 获取当前季度结束日期
 */
function getCurrentQuarterEnd(): Date {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  return new Date(now.getFullYear(), quarter * 3 + 3, 0)
}
</script>

<style scoped>
.quick-selection-example {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.example-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.example-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.example-section h4 {
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.result-display {
  margin-top: 20px;
  padding: 15px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.result-display p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

.size-examples {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.size-example {
  padding: 15px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.event-log {
  max-height: 300px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}

.event-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #f5f7fa;
  font-size: 12px;
}

.event-item:last-child {
  border-bottom: none;
}

.event-time {
  width: 80px;
  color: #909399;
  font-family: monospace;
}

.event-type {
  width: 120px;
  color: #409eff;
  font-weight: 500;
}

.event-data {
  flex: 1;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .size-examples {
    grid-template-columns: 1fr;
  }
  
  .quick-selection-example {
    padding: 10px;
  }
  
  .example-section {
    padding: 15px;
  }
}
</style>