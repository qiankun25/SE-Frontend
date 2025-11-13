<template>
  <div class="group-dimensions">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>统计维度选择</span>
          <div class="header-actions">
            <el-button size="small" @click="selectAll">全选</el-button>
            <el-button size="small" @click="selectNone">全不选</el-button>
            <el-button size="small" @click="selectDefault">默认选择</el-button>
          </div>
        </div>
      </template>

      <div class="fields-container">
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
        <el-tag type="info" size="small">
          已选择 {{ selectedFields.length }} 个统计维度
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'

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
}>()

const emit = defineEmits<{
  'dimensions-change': [fields: string[]]
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
      { key: 'QYID', label: '公告企业ID' },
      { key: 'JT', label: '集团' }
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
  {
    name: 'technical',
    label: '技术参数',
    fields: [
      { key: 'RLZL', label: '燃料种类' },
      { key: 'PL', label: '排量' },
      { key: 'C', label: '长' },
      { key: 'ZZL', label: '总质量' },
      { key: 'ZBZL', label: '整备质量' },
      { key: 'ZJ', label: '轴距' }
    ]
  },
  {
    name: 'production',
    label: '生产信息',
    fields: [
      { key: 'SCDZ', label: '生产地址' },
      { key: 'SF', label: '省份' },
      { key: 'CS', label: '城市' },
      { key: 'QX', label: '区县' }
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
  {
    name: 'config',
    label: '配置信息',
    fields: [
      { key: 'LSPZXLH', label: '配置序列号' },
      { key: 'CONFIG_SEQUENCE_NUM', label: '配置序列号' },
      { key: 'POINTS_CONF_ID', label: '双积分ID' }
    ]
  }
]

// 默认选择的字段
const getDefaultFields = () => {
  return ['CLZZQYMC', 'QYDM'] // 默认选择企业名称和企业代码（必选字段）
}

const selectedFields = ref<string[]>([])

// 过滤掉时间信息分类（这些字段由时间维度控制，不在这里显示）
const visibleCategories = computed(() => {
  return fieldCategories.filter(category => category.name !== 'time')
})

// 方法
const selectAll = () => {
  const allFields = fieldCategories.flatMap(category =>
    category.fields.filter(f => !f.disabled && !f.required).map(f => f.key)
  )
  selectedFields.value = [...getDefaultFields(), ...allFields]
  handleFieldsChange()
}

const selectNone = () => {
  // 保留必选字段
  const requiredFields = fieldCategories.flatMap(category =>
    category.fields.filter(f => f.required).map(f => f.key)
  )
  selectedFields.value = requiredFields
  handleFieldsChange()
}

const selectDefault = () => {
  selectedFields.value = getDefaultFields()
  handleFieldsChange()
}

const handleFieldsChange = () => {
  emit('dimensions-change', selectedFields.value)
}

// 初始化
const initializeFields = () => {
  if (props.initialFields && props.initialFields.length > 0) {
    selectedFields.value = [...props.initialFields]
  } else {
    selectedFields.value = getDefaultFields()
  }
}

// 监听props变化
watch(() => props.initialFields, () => {
  initializeFields()
}, { immediate: true })

// 组件挂载时发送初始选中的字段
onMounted(() => {
  emit('dimensions-change', selectedFields.value)
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

.field-checkbox {
  margin-right: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.field-checkbox :deep(.el-tag) {
  margin-left: 4px;
}

.selected-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
  text-align: center;
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
}
</style>