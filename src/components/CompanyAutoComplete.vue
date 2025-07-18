<template>
  <div class="company-autocomplete">
    <el-form-item :label="label" :prop="prop">
      <div class="input-container">
        <el-select
          v-model="selectedValues"
          :multiple="multiple"
          :placeholder="placeholder"
          filterable
          remote
          reserve-keyword
          :remote-method="handleRemoteSearch"
          :loading="loading"
          clearable
          @change="handleChange"
          @clear="handleClear"
          style="width: 100%"
        >
          <el-option
            v-for="company in filteredCompanies"
            :key="company.id"
            :label="formatCompanyLabel(company)"
            :value="multiple ? company.id : company"
          >
            <div class="company-option">
              <div class="company-name">{{ company.name }}</div>
              <div class="company-code">{{ company.code }}</div>
            </div>
          </el-option>
        </el-select>
        
        <!-- 批量导入按钮 -->
        <el-button 
          v-if="allowBatchImport" 
          type="text" 
          @click="showBatchDialog = true"
          style="margin-left: 8px"
        >
          批量导入
        </el-button>
      </div>
      
      <!-- 已选择的企业显示 -->
      <div v-if="multiple && selectedCompanies.length > 0" class="selected-companies">
        <el-tag
          v-for="company in selectedCompanies"
          :key="company.id"
          closable
          @close="removeCompany(company.id)"
          class="company-tag"
        >
          {{ company.name }}
        </el-tag>
      </div>
    </el-form-item>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showBatchDialog"
      title="批量导入企业"
      width="600px"
      @close="closeBatchDialog"
    >
      <div class="batch-import-content">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>支持以下格式导入：</p>
            <ul>
              <li>企业名称（每行一个）</li>
              <li>企业代码（每行一个）</li>
              <li>企业名称|企业代码（用竖线分隔）</li>
            </ul>
          </template>
        </el-alert>
        
        <el-input
          v-model="batchInput"
          type="textarea"
          :rows="8"
          placeholder="请输入企业信息，每行一个..."
          style="margin-top: 15px"
        />
        
        <div v-if="batchPreview.length > 0" class="batch-preview">
          <h4>预览结果（{{ batchPreview.length }}个企业）：</h4>
          <div class="preview-list">
            <el-tag
              v-for="(company, index) in batchPreview.slice(0, 10)"
              :key="index"
              class="preview-tag"
            >
              {{ company.name }}
            </el-tag>
            <span v-if="batchPreview.length > 10">
              ...还有{{ batchPreview.length - 10 }}个
            </span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="closeBatchDialog">取消</el-button>
        <el-button @click="previewBatchImport" :loading="batchLoading">预览</el-button>
        <el-button 
          type="primary" 
          @click="processBatchImport"
          :disabled="batchPreview.length === 0"
          :loading="batchLoading"
        >
          确定导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

interface Company {
  id: string
  name: string
  code: string
  shortName?: string
}

interface Props {
  modelValue?: Company | Company[] | string | string[]
  label?: string
  prop?: string
  placeholder?: string
  multiple?: boolean
  allowBatchImport?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: Company | Company[] | string | string[] | undefined): void
  (e: 'change', value: Company | Company[] | string | string[] | undefined): void
}

const props = withDefaults(defineProps<Props>(), {
  label: '企业选择',
  placeholder: '请输入企业名称或代码',
  multiple: false,
  allowBatchImport: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)
const selectedValues = ref<string | string[]>(props.multiple ? [] : '')
const allCompanies = ref<Company[]>([])
const filteredCompanies = ref<Company[]>([])
const companyHashMap = ref<Map<string, Company>>(new Map())
const showBatchDialog = ref(false)
const batchInput = ref('')
const batchPreview = ref<Company[]>([])
const batchLoading = ref(false)

// 计算属性
const selectedCompanies = computed(() => {
  if (!props.multiple) return []
  const values = Array.isArray(selectedValues.value) ? selectedValues.value : []
  return values.map(id => companyHashMap.value.get(id)).filter(Boolean) as Company[]
})

// 初始化企业数据哈希表
const initializeCompanyData = async () => {
  try {
    loading.value = true
    
    // 这里应该从后端API获取所有企业数据
    // const response = await companyApi.getAllCompanies()
    
    // 模拟数据
    const mockCompanies: Company[] = [
      { id: 'C001', name: '一汽集团有限公司', code: 'FAW001', shortName: '一汽集团' },
      { id: 'C002', name: '比亚迪股份有限公司', code: 'BYD002', shortName: '比亚迪' },
      { id: 'C003', name: '上汽集团股份有限公司', code: 'SAIC003', shortName: '上汽集团' },
      { id: 'C004', name: '广汽集团股份有限公司', code: 'GAC004', shortName: '广汽集团' },
      { id: 'C005', name: '北汽集团有限公司', code: 'BAIC005', shortName: '北汽集团' },
      { id: 'C006', name: '东风汽车集团有限公司', code: 'DFM006', shortName: '东风汽车' },
      { id: 'C007', name: '长安汽车股份有限公司', code: 'CHANGAN007', shortName: '长安汽车' },
      { id: 'C008', name: '吉利控股集团有限公司', code: 'GEELY008', shortName: '吉利控股' },
      { id: 'C009', name: '长城汽车股份有限公司', code: 'GWM009', shortName: '长城汽车' },
      { id: 'C010', name: '奇瑞汽车股份有限公司', code: 'CHERY010', shortName: '奇瑞汽车' }
    ]
    
    allCompanies.value = mockCompanies
    
    // 构建哈希表以提高搜索效率
    companyHashMap.value.clear()
    mockCompanies.forEach(company => {
      companyHashMap.value.set(company.id, company)
      // 同时以名称和代码作为key存储，方便搜索
      companyHashMap.value.set(company.name, company)
      companyHashMap.value.set(company.code, company)
      if (company.shortName) {
        companyHashMap.value.set(company.shortName, company)
      }
    })
    
    filteredCompanies.value = mockCompanies.slice(0, 10) // 默认显示前10个
    
  } catch (error) {
    console.error('获取企业数据失败:', error)
    ElMessage.error('获取企业数据失败')
  } finally {
    loading.value = false
  }
}

// 远程搜索
const handleRemoteSearch = (query: string) => {
  if (!query) {
    filteredCompanies.value = allCompanies.value.slice(0, 10)
    return
  }
  
  loading.value = true
  
  // 使用哈希表进行快速搜索
  const results = allCompanies.value.filter(company => 
    company.name.toLowerCase().includes(query.toLowerCase()) ||
    company.code.toLowerCase().includes(query.toLowerCase()) ||
    (company.shortName && company.shortName.toLowerCase().includes(query.toLowerCase()))
  )
  
  filteredCompanies.value = results.slice(0, 20) // 限制结果数量
  loading.value = false
}

// 格式化显示标签
const formatCompanyLabel = (company: Company) => {
  return `${company.name} (${company.code})`
}

// 处理选择变化
const handleChange = (value: string | string[]) => {
  if (props.multiple) {
    const companies = Array.isArray(value) 
      ? value.map(id => companyHashMap.value.get(id)).filter(Boolean) as Company[]
      : []
    emit('update:modelValue', companies)
    emit('change', companies)
  } else {
    const company = typeof value === 'string' ? companyHashMap.value.get(value) : value
    emit('update:modelValue', company)
    emit('change', company)
  }
}

// 处理清空
const handleClear = () => {
  emit('update:modelValue', props.multiple ? [] : undefined)
  emit('change', props.multiple ? [] : undefined)
}

// 移除企业
const removeCompany = (companyId: string) => {
  if (Array.isArray(selectedValues.value)) {
    selectedValues.value = selectedValues.value.filter(id => id !== companyId)
    handleChange(selectedValues.value)
  }
}

// 批量导入相关方法
const previewBatchImport = () => {
  if (!batchInput.value.trim()) {
    ElMessage.warning('请输入企业信息')
    return
  }
  
  batchLoading.value = true
  const lines = batchInput.value.trim().split('\n')
  const preview: Company[] = []
  
  lines.forEach(line => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return
    
    // 尝试不同的匹配方式
    let company: Company | undefined
    
    // 1. 直接匹配企业名称或代码
    company = companyHashMap.value.get(trimmedLine)
    
    // 2. 如果包含分隔符，尝试分割
    if (!company && trimmedLine.includes('|')) {
      const [name, code] = trimmedLine.split('|').map(s => s.trim())
      company = allCompanies.value.find(c => c.name === name || c.code === code)
    }
    
    // 3. 模糊匹配
    if (!company) {
      company = allCompanies.value.find(c => 
        c.name.includes(trimmedLine) || 
        c.code.includes(trimmedLine) ||
        (c.shortName && c.shortName.includes(trimmedLine))
      )
    }
    
    if (company && !preview.find(p => p.id === company!.id)) {
      preview.push(company)
    }
  })
  
  batchPreview.value = preview
  batchLoading.value = false
  
  if (preview.length === 0) {
    ElMessage.warning('未找到匹配的企业，请检查输入格式')
  }
}

const processBatchImport = () => {
  if (batchPreview.value.length === 0) {
    ElMessage.warning('没有可导入的企业')
    return
  }
  
  if (props.multiple) {
    const currentIds = Array.isArray(selectedValues.value) ? selectedValues.value : []
    const newIds = batchPreview.value.map(c => c.id)
    const allIds = [...new Set([...currentIds, ...newIds])]
    
    selectedValues.value = allIds
    handleChange(allIds)
  } else {
    // 单选模式下选择第一个
    const firstCompany = batchPreview.value[0]
    selectedValues.value = firstCompany.id
    handleChange(firstCompany.id)
  }
  
  ElMessage.success(`成功导入 ${batchPreview.value.length} 个企业`)
  closeBatchDialog()
}

const closeBatchDialog = () => {
  showBatchDialog.value = false
  batchInput.value = ''
  batchPreview.value = []
}

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  if (props.multiple) {
    if (Array.isArray(newValue)) {
      selectedValues.value = newValue.map(item => 
        typeof item === 'string' ? item : item.id
      )
    } else {
      selectedValues.value = []
    }
  } else {
    if (newValue && typeof newValue === 'object' && 'id' in newValue) {
      selectedValues.value = newValue.id
    } else if (typeof newValue === 'string') {
      selectedValues.value = newValue
    } else {
      selectedValues.value = ''
    }
  }
}, { immediate: true })

// 组件挂载时初始化数据
onMounted(() => {
  initializeCompanyData()
})
</script>

<style scoped>
.company-autocomplete {
  width: 100%;
}

.input-container {
  display: flex;
  align-items: center;
}

.company-option {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.company-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.company-code {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.selected-companies {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.company-tag {
  margin: 0;
}

.batch-import-content {
  padding: 0 4px;
}

.batch-preview {
  margin-top: 15px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.batch-preview h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.preview-tag {
  margin: 0;
  font-size: 12px;
}
</style>
