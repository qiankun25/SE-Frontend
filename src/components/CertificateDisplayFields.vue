<template>
  <div class="certificate-display-fields">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>显示字段选择</span>
          <div class="header-actions">
            <el-button size="small" @click="selectAll">全选</el-button>
            <el-button size="small" @click="selectNone">全不选</el-button>
            <el-button size="small" @click="selectDefault">默认选择</el-button>
          </div>
        </div>
      </template>

      <div class="fields-container">
        <div class="field-category" v-for="category in fieldCategories" :key="category.name">
          <div class="category-header">
            <el-checkbox 
              :model-value="isCategorySelected(category)" 
              :indeterminate="isCategoryIndeterminate(category)"
              @change="toggleCategory(category, $event)"
            >
              {{ category.label }}
            </el-checkbox>
          </div>
          <div class="category-fields">
            <el-checkbox-group v-model="selectedFields" @change="handleFieldsChange">
              <el-checkbox 
                v-for="field in category.fields" 
                :key="field.key" 
                :value="field.key"
                class="field-checkbox"
              >
                {{ field.label }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </div>

      <div class="selected-summary">
        <el-tag type="info" size="small">
          已选择 {{ selectedFields.length }} 个字段
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
}

interface FieldCategory {
  name: string
  label: string
  fields: Field[]
}

const props = defineProps<{
  initialFields?: string[]
  mode?: 'quantity' | 'detail'
}>()

const emit = defineEmits<{
  'fields-change': [fields: string[]]
}>()

// 字段分类配置
const fieldCategories: FieldCategory[] = [
  {
    name: 'basic',
    label: '基础信息',
    fields: [
      { key: 'QYDM', label: '合格证企业代码' },
      { key: 'CLZZQYMC', label: '车辆制造企业名称' },
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
  },
  {
    name: 'time',
    label: '时间信息',
    fields: [
      { key: 'UPD', label: '上传时间' },
      { key: 'UPY', label: '上传年' },
      { key: 'UPM', label: '上传月' },
      { key: 'GXSJ', label: '更新时间' }
    ]
  },
  {
    name: 'quantity',
    label: '数量信息',
    fields: [
      { key: 'SL', label: '数量' }
    ]
  }
]

// 默认选择的字段（根据模式不同）
const getDefaultFields = () => {
  if (props.mode === 'detail') {
    return [
      'QYDM', 'CLZZQYMC', 'CLXH', 'CLPP', 'CLMC', 'RLZL', 
      'SCDZ', 'SF', 'CS', 'UPD', 'SL'
    ]
  } else {
    // quantity 模式默认字段
    return [
      'QYDM', 'CLZZQYMC', 'CLXH', 'CLPP', 'CLMC', 'SL'
    ]
  }
}

const selectedFields = ref<string[]>([])

// 计算属性
const isCategorySelected = (category: FieldCategory) => {
  const categoryFieldKeys = category.fields.map(f => f.key)
  return categoryFieldKeys.every(key => selectedFields.value.includes(key))
}

const isCategoryIndeterminate = (category: FieldCategory) => {
  const categoryFieldKeys = category.fields.map(f => f.key)
  const selectedCount = categoryFieldKeys.filter(key => selectedFields.value.includes(key)).length
  return selectedCount > 0 && selectedCount < categoryFieldKeys.length
}

// 方法
const toggleCategory = (category: FieldCategory, checked: boolean) => {
  const categoryFieldKeys = category.fields.map(f => f.key)
  
  if (checked) {
    // 添加该分类的所有字段
    categoryFieldKeys.forEach(key => {
      if (!selectedFields.value.includes(key)) {
        selectedFields.value.push(key)
      }
    })
  } else {
    // 移除该分类的所有字段
    selectedFields.value = selectedFields.value.filter(key => !categoryFieldKeys.includes(key))
  }
  
  handleFieldsChange()
}

const selectAll = () => {
  selectedFields.value = fieldCategories.flatMap(category => category.fields.map(f => f.key))
  handleFieldsChange()
}

const selectNone = () => {
  selectedFields.value = []
  handleFieldsChange()
}

const selectDefault = () => {
  selectedFields.value = getDefaultFields()
  handleFieldsChange()
}

const handleFieldsChange = () => {
  emit('fields-change', selectedFields.value)
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
  emit('fields-change', selectedFields.value)
})
</script>

<style scoped>
.certificate-display-fields {
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.field-category {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
}

.category-header {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
}

.category-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-checkbox {
  margin-right: 0;
  margin-bottom: 8px;
}

.selected-summary {
  margin-top: 15px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .fields-container {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
