<template>
  <div class="time-range-picker">
    <el-form-item :label="label" :prop="prop">
      <div class="picker-container">
        <!-- 快捷选择按钮 -->
        <div class="quick-select" v-if="showQuickSelect">
          <el-button
            v-for="option in quickOptions"
            :key="option.value"
            size="small"
            :type="selectedQuick === option.value ? 'primary' : 'default'"
            @click="handleQuickSelect(option)"
          >
            {{ option.label }}
          </el-button>
        </div>

        <!-- 时间范围选择器 -->
        <div class="date-picker-wrapper">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :placeholder="placeholder"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="clearable"
            :disabled="disabled"
            @change="handleDateChange"
            style="width: 100%"
          />
        </div>

        <!-- 年月选择器 -->
        <div class="year-month-picker" v-if="showYearMonth">
          <el-select
            v-model="selectedYear"
            placeholder="选择年份"
            clearable
            @change="handleYearChange"
            style="width: 120px; margin-right: 10px"
          >
            <el-option
              v-for="year in yearOptions"
              :key="year"
              :label="year + '年'"
              :value="year"
            />
          </el-select>
          
          <el-select
            v-model="selectedMonth"
            placeholder="选择月份"
            clearable
            @change="handleMonthChange"
            style="width: 120px"
          >
            <el-option
              v-for="month in monthOptions"
              :key="month"
              :label="month + '月'"
              :value="month"
            />
          </el-select>
        </div>
      </div>
    </el-form-item>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import type { TimeRangeParams } from '../../types/api'

interface QuickOption {
  label: string
  value: string
  dateRange: [string, string] | null
  year?: number
  month?: number
}

interface Props {
  modelValue?: TimeRangeParams
  label?: string
  prop?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  showQuickSelect?: boolean
  showYearMonth?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: TimeRangeParams | undefined): void
  (e: 'change', value: TimeRangeParams | undefined): void
}

const props = withDefaults(defineProps<Props>(), {
  label: '时间范围',
  placeholder: '请选择时间范围',
  clearable: true,
  disabled: false,
  showQuickSelect: true,
  showYearMonth: true
})

const emit = defineEmits<Emits>()

// 响应式数据
const dateRange = ref<[string, string] | null>(null)
const selectedYear = ref<number | undefined>()
const selectedMonth = ref<number | undefined>()
const selectedQuick = ref<string>('')

// 快捷选择选项
const quickOptions: QuickOption[] = [
  {
    label: '今年',
    value: 'thisYear',
    dateRange: [
      new Date().getFullYear() + '-01-01',
      new Date().getFullYear() + '-12-31'
    ],
    year: new Date().getFullYear()
  },
  {
    label: '去年',
    value: 'lastYear',
    dateRange: [
      (new Date().getFullYear() - 1) + '-01-01',
      (new Date().getFullYear() - 1) + '-12-31'
    ],
    year: new Date().getFullYear() - 1
  },
  {
    label: '近3个月',
    value: 'last3Months',
    dateRange: [
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    ]
  },
  {
    label: '近一年',
    value: 'lastYear365',
    dateRange: [
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    ]
  }
]

// 年份选项（最近10年）
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 10; i--) {
    years.push(i)
  }
  return years
})

// 月份选项
const monthOptions = computed(() => {
  return Array.from({ length: 12 }, (_, i) => i + 1)
})

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    if (newValue.startDate && newValue.endDate) {
      dateRange.value = [newValue.startDate, newValue.endDate]
    }
    selectedYear.value = newValue.year
    selectedMonth.value = newValue.month
  } else {
    dateRange.value = null
    selectedYear.value = undefined
    selectedMonth.value = undefined
    selectedQuick.value = ''
  }
}, { immediate: true })

// 处理快捷选择
const handleQuickSelect = (option: QuickOption) => {
  selectedQuick.value = option.value
  dateRange.value = option.dateRange
  selectedYear.value = option.year
  selectedMonth.value = option.month
  
  emitValue()
}

// 处理日期范围变化
const handleDateChange = (value: [string, string] | null) => {
  selectedQuick.value = ''
  if (value) {
    const startDate = new Date(value[0])
    selectedYear.value = startDate.getFullYear()
    selectedMonth.value = startDate.getMonth() + 1
  }
  emitValue()
}

// 处理年份变化
const handleYearChange = (year: number | undefined) => {
  selectedQuick.value = ''
  if (year && selectedMonth.value) {
    const startDate = `${year}-${String(selectedMonth.value).padStart(2, '0')}-01`
    const endDate = `${year}-${String(selectedMonth.value).padStart(2, '0')}-${new Date(year, selectedMonth.value, 0).getDate()}`
    dateRange.value = [startDate, endDate]
  }
  emitValue()
}

// 处理月份变化
const handleMonthChange = (month: number | undefined) => {
  selectedQuick.value = ''
  if (selectedYear.value && month) {
    const startDate = `${selectedYear.value}-${String(month).padStart(2, '0')}-01`
    const endDate = `${selectedYear.value}-${String(month).padStart(2, '0')}-${new Date(selectedYear.value, month, 0).getDate()}`
    dateRange.value = [startDate, endDate]
  }
  emitValue()
}

// 发送值变化事件
const emitValue = () => {
  const value: TimeRangeParams | undefined = dateRange.value || selectedYear.value || selectedMonth.value
    ? {
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1],
        year: selectedYear.value,
        month: selectedMonth.value
      }
    : undefined

  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.time-range-picker {
  width: 100%;
}

.picker-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-select {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.date-picker-wrapper {
  width: 100%;
}

.year-month-picker {
  display: flex;
  align-items: center;
}
</style>
