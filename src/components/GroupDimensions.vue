<template>
  <div class="group-dimensions">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>统计维度选择</span>
          <div class="header-actions">
            <el-button size="small" @click="selectDefault">默认选择</el-button>
            <el-button size="small" @click="selectNone">清空选择</el-button>
          </div>
        </div>
      </template>

      <div class="fields-container">
        <!-- 时间维度（新增） -->
        <div class="field-category">
          <div class="category-label">时间维度：</div>
          <div class="category-fields">
            <el-radio-group v-model="timeDimension" @change="(val) => handleTimeDimensionChange(val as TimeDimension)">
              <el-radio value="total">总量（不按时间分组）</el-radio>
              <el-radio value="yearly">按年统计</el-radio>
              <el-radio value="monthly">按月统计</el-radio>
              <el-radio value="daily">按日统计</el-radio>
            </el-radio-group>

            <!-- 同期比开关（集成到时间维度中） -->
            <!-- <div v-if="timeDimension !== 'total'" class="comparison-switch">
              <el-switch v-model="enableComparison" active-text="启用同期比" inactive-text="关闭同期比"
                @change="(val) => handleComparisonChange(val as boolean)" />
              <el-tooltip content="同期比将对比去年同期数据" placement="top">
                <el-icon class="info-icon">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div> -->
          </div>
        </div>

        <!-- 其他分组维度（原有逻辑） -->
        <div class="field-category" v-for="category in visibleCategories" :key="category.name">
          <div class="category-label">{{ category.label }}：</div>
          <div class="category-fields">
            <el-checkbox-group v-model="selectedFields" @change="handleFieldsChange">
              <el-checkbox v-for="field in category.fields" :key="field.key" :value="field.key"
                :disabled="field.disabled" class="field-checkbox">
                {{ field.label }}
                <el-tag v-if="field.required" type="danger" size="small">必选</el-tag>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </div>

      <div class="selected-summary">
        <el-tag type="primary" size="small">
          时间维度：{{ timeDimensionLabel }}
        </el-tag>
        <el-tag type="info" size="small" style="margin-left: 8px;">
          已选择 {{ selectedFields.length }} 个分组维度
        </el-tag>
        <!-- <el-tag v-if="enableComparison" type="warning" size="small" style="margin-left: 8px;">
          同期比已启用
        </el-tag> -->
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { TimeDimension } from '../types/api'

interface Field {
  key: string
  label: string
  required?: boolean
  disabled?: boolean
}

interface FieldCategory {
  name: string
  label: string
  fields: Field[]
}

const props = defineProps<{
  initialFields?: string[]
  initialTimeDimension?: TimeDimension
  initialEnableComparison?: boolean
}>()

const emit = defineEmits<{
  'dimensions-change': [data: {
    timeDimension: TimeDimension
    groupDimensions: string[]
    enableComparison: boolean
  }]
}>()

// 字段分类配置（仅包含可作为统计维度的字段）
const fieldCategories: FieldCategory[] = [
  {
    name: 'basic',
    label: '基础信息',
    fields: [
      { key: 'CLZZQYMC', label: '车辆制造企业名称', required: true },
      { key: 'QYDM', label: '合格证企业代码', required: true },
      { key: 'CLZT', label: '车辆类别' },
      // { key: 'QYID', label: '公告企业ID' },
      // { key: 'JT', label: '集团' }
    ]
  },
  {
    name: 'vehicle',
    label: '车辆信息',
    fields: [
      { key: 'CLXH', label: '车辆型号' },
      { key: 'CLLX', label: '车辆类型' },
      { key: 'CLPP', label: '车辆品牌' },
      { key: 'CLMC', label: '车辆名称' },
      { key: 'CPH', label: '产品号' }
    ]
  },
  // {
  //   name: 'technical',
  //   label: '技术参数',
  //   fields: [
  //     { key: 'RLZL', label: '燃料种类' },
  //     { key: 'PL', label: '排量' },
  //     { key: 'C', label: '长' },
  //     { key: 'ZZL', label: '总质量' },
  //     { key: 'ZBZL', label: '整备质量' },
  //     { key: 'ZJ', label: '轴距' }
  //   ]
  // },
  {
    name: 'production',
    label: '生产信息',
    fields: [
      { key: 'SCDZ', label: '生产地址' },
      { key: 'SF', label: '省份' },
      { key: 'CS', label: '城市' },
      // { key: 'QX', label: '区县' }
    ]
  },
  {
    name: 'classification',
    label: '分类信息',
    fields: [
      { key: 'G50', label: '六大类' },
      { key: 'XNYBJ', label: '新能源标记' },
      { key: 'XNYLB', label: '新能源类别' }
    ]
  },
  // {
  //   name: 'config',
  //   label: '配置信息',
  //   fields: [
  //     { key: 'LSPZXLH', label: '历史配置序列号' },
  //     { key: 'CONFIG_SEQUENCE_NUM', label: '配置序列号' },
  //     { key: 'POINTS_CONF_ID', label: '双积分ID' }
  //   ]
  // }
]

// 默认选择的字段
const getDefaultFields = () => {
  return ['CLZZQYMC', 'QYDM'] // 默认选择企业名称和企业代码（必选字段）
}

// 时间维度选择
const timeDimension = ref<TimeDimension>('total')
const enableComparison = ref<boolean>(false)

// 其他分组维度选择
const selectedFields = ref<string[]>([])

// 过滤掉时间信息分类（这些字段由时间维度控制，不在这里显示）
const visibleCategories = computed(() => {
  return fieldCategories.filter(category => category.name !== 'time')
})

// 时间维度标签
const timeDimensionLabel = computed(() => {
  const labels: Record<TimeDimension, string> = {
    'total': '总量',
    'yearly': '按年',
    'monthly': '按月',
    'daily': '按日'
  }
  return labels[timeDimension.value] || '总量'
})

// 时间维度变化处理
const handleTimeDimensionChange = (value: TimeDimension) => {
  // 如果选择总量，自动关闭同期比
  if (value === 'total') {
    enableComparison.value = false
    ElMessage.info('总量模式不支持同期比，已自动关闭')
  }
  emitChange()
}

// 同期比变化处理
const handleComparisonChange = (value: boolean) => {
  if (value) {
    ElMessage.success('已启用同期比，将对比去年同期数据')
  }
  emitChange()
}

// 分组维度变化处理
const handleFieldsChange = () => {
  emitChange()
}

// 统一发送变化事件
const emitChange = () => {
  emit('dimensions-change', {
    timeDimension: timeDimension.value,
    groupDimensions: selectedFields.value,
    enableComparison: enableComparison.value
  })
}

// 默认选择
const selectDefault = () => {
  timeDimension.value = 'total'
  selectedFields.value = getDefaultFields()
  enableComparison.value = false
  emitChange()
  ElMessage.success('已恢复默认选择')
}

// 清空选择
const selectNone = () => {
  timeDimension.value = 'total'
  selectedFields.value = getDefaultFields() // 保留必选字段
  enableComparison.value = false
  emitChange()
  ElMessage.info('已清空选择（保留必选字段）')
}

// 初始化
const initializeFields = () => {
  if (props.initialTimeDimension) {
    timeDimension.value = props.initialTimeDimension
  }
  if (props.initialFields && props.initialFields.length > 0) {
    selectedFields.value = [...props.initialFields]
  } else {
    selectedFields.value = getDefaultFields()
  }
  if (props.initialEnableComparison !== undefined) {
    enableComparison.value = props.initialEnableComparison
  }
}

// 监听props变化
watch(() => [props.initialFields, props.initialTimeDimension, props.initialEnableComparison], () => {
  initializeFields()
}, { immediate: true })

// 组件挂载时发送初始选中的字段
onMounted(() => {
  emitChange()
})
</script>

<style scoped>
.group-dimensions {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.fields-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-category {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.time-dimension-category {
  background-color: #f0f9ff;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
}

.category-label {
  font-weight: 600;
  color: #606266;
  white-space: nowrap;
  padding-top: 2px;
  min-width: 80px;
}

.category-fields {
  flex: 1;
}

.category-fields :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.category-fields :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.field-checkbox {
  margin-right: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.field-checkbox :deep(.el-tag) {
  margin-left: 4px;
}

.comparison-switch {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.info-icon {
  color: #909399;
  cursor: help;
  font-size: 16px;
}

.selected-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .field-category {
    flex-direction: column;
    gap: 8px;
  }

  .category-label {
    min-width: auto;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .category-fields :deep(.el-radio-group) {
    flex-direction: column;
  }
}
</style>