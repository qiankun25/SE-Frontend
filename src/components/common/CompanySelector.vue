<template>
  <div class="company-selector">
    <el-form-item :label="label" :prop="prop">
      <div class="selector-container">
        <!-- 企业搜索选择器 -->
        <el-select
          v-model="selectedCompany"
          placeholder="请输入企业名称搜索"
          filterable
          remote
          reserve-keyword
          clearable
          :remote-method="searchCompanies"
          :loading="loading"
          @change="handleCompanyChange"
          style="width: 300px"
        >
          <el-option
            v-for="company in companyOptions"
            :key="company.id"
            :label="company.name"
            :value="company.id"
          >
            <div class="company-option">
              <div class="company-name">{{ company.name }}</div>
              <div class="company-code">{{ company.code }}</div>
            </div>
          </el-option>
        </el-select>

        <!-- 企业ID输入 -->
        <el-input
          v-if="showIdInput"
          v-model="companyId"
          placeholder="或输入企业ID"
          clearable
          @input="handleIdInput"
          style="width: 150px; margin-left: 10px"
        />

        <!-- 企业代码输入 -->
        <el-input
          v-if="showCodeInput"
          v-model="companyCode"
          placeholder="或输入企业代码"
          clearable
          @input="handleCodeInput"
          style="width: 180px; margin-left: 10px"
        />

        <!-- 批量导入按钮 -->
        <el-button
          v-if="allowBatchImport"
          type="primary"
          plain
          @click="showBatchDialog = true"
          style="margin-left: 10px"
        >
          批量导入
        </el-button>
      </div>

      <!-- 已选择的企业列表 -->
      <div v-if="multiple && selectedCompanies.length > 0" class="selected-companies">
        <el-tag
          v-for="company in selectedCompanies"
          :key="company.id"
          closable
          @close="removeCompany(company.id)"
          style="margin: 5px 5px 0 0"
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
      <div class="batch-import">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 15px"
        >
          <template #default>
            <p>支持以下格式：</p>
            <ul>
              <li>企业名称（每行一个）</li>
              <li>企业ID（每行一个）</li>
              <li>企业代码（每行一个）</li>
            </ul>
          </template>
        </el-alert>

        <el-input
          v-model="batchInput"
          type="textarea"
          :rows="8"
          placeholder="请输入企业信息，每行一个"
        />

        <div class="batch-actions" style="margin-top: 15px">
          <el-button @click="downloadTemplate">下载模板</el-button>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
            @change="handleFileUpload"
          >
            <el-button type="primary" plain>上传文件</el-button>
          </el-upload>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeBatchDialog">取消</el-button>
        <el-button type="primary" @click="processBatchImport">确定导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface CompanyOption {
  id: string
  name: string
  code: string
  shortName?: string
}

interface CompanyValue {
  id?: string
  name?: string
  code?: string
  ids?: string[]
  names?: string[]
  codes?: string[]
}

interface Props {
  modelValue?: CompanyValue
  label?: string
  prop?: string
  multiple?: boolean
  showIdInput?: boolean
  showCodeInput?: boolean
  allowBatchImport?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: CompanyValue | undefined): void
  (e: 'change', value: CompanyValue | undefined): void
}

const props = withDefaults(defineProps<Props>(), {
  label: '企业选择',
  multiple: false,
  showIdInput: true,
  showCodeInput: true,
  allowBatchImport: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const selectedCompany = ref<string>('')
const companyId = ref<string>('')
const companyCode = ref<string>('')
const companyOptions = ref<CompanyOption[]>([])
const selectedCompanies = ref<CompanyOption[]>([])
const loading = ref(false)
const showBatchDialog = ref(false)
const batchInput = ref<string>('')

// 模拟企业数据（实际项目中应该从API获取）
const mockCompanies: CompanyOption[] = [
  { id: 'C001', name: '一汽集团有限公司', code: '91220000124000001X' },
  { id: 'C002', name: '东风汽车集团有限公司', code: '91420000177000002Y' },
  { id: 'C003', name: '上汽集团股份有限公司', code: '91310000132000003Z' },
  { id: 'C004', name: '北汽集团有限公司', code: '91110000145000004A' },
  { id: 'C005', name: '广汽集团股份有限公司', code: '91440000156000005B' },
  { id: 'C006', name: '长安汽车股份有限公司', code: '91500000167000006C' },
  { id: 'C007', name: '吉利控股集团有限公司', code: '91330000178000007D' },
  { id: 'C008', name: '比亚迪股份有限公司', code: '91440000189000008E' },
  { id: 'C009', name: '长城汽车股份有限公司', code: '91130000190000009F' },
  { id: 'C010', name: '奇瑞汽车股份有限公司', code: '91340000201000010G' }
]

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedCompany.value = newValue.id || ''
    companyId.value = newValue.id || ''
    companyCode.value = newValue.code || ''
    
    if (props.multiple && newValue.ids) {
      selectedCompanies.value = newValue.ids.map(id => {
        const company = mockCompanies.find(c => c.id === id)
        return company || { id, name: id, code: '' }
      })
    }
  } else {
    selectedCompany.value = ''
    companyId.value = ''
    companyCode.value = ''
    selectedCompanies.value = []
  }
}, { immediate: true })

// 搜索企业
const searchCompanies = (query: string) => {
  if (!query) {
    companyOptions.value = []
    return
  }

  loading.value = true
  
  // 模拟API调用
  setTimeout(() => {
    companyOptions.value = mockCompanies.filter(company =>
      company.name.toLowerCase().includes(query.toLowerCase()) ||
      company.code.includes(query) ||
      company.id.includes(query)
    )
    loading.value = false
  }, 300)
}

// 处理企业选择变化
const handleCompanyChange = (value: string) => {
  if (value) {
    const company = companyOptions.value.find(c => c.id === value)
    if (company) {
      companyId.value = company.id
      companyCode.value = company.code
      
      if (props.multiple) {
        const exists = selectedCompanies.value.find(c => c.id === company.id)
        if (!exists) {
          selectedCompanies.value.push(company)
        }
        selectedCompany.value = '' // 清空选择器
      }
    }
  }
  emitValue()
}

// 处理ID输入
const handleIdInput = () => {
  if (companyId.value) {
    // 根据ID查找企业信息
    const company = mockCompanies.find(c => c.id === companyId.value)
    if (company) {
      selectedCompany.value = company.id
      companyCode.value = company.code
    }
  }
  emitValue()
}

// 处理代码输入
const handleCodeInput = () => {
  if (companyCode.value) {
    // 根据代码查找企业信息
    const company = mockCompanies.find(c => c.code === companyCode.value)
    if (company) {
      selectedCompany.value = company.id
      companyId.value = company.id
    }
  }
  emitValue()
}

// 移除已选择的企业
const removeCompany = (id: string) => {
  selectedCompanies.value = selectedCompanies.value.filter(c => c.id !== id)
  emitValue()
}

// 下载模板
const downloadTemplate = () => {
  const template = '企业名称\n一汽集团有限公司\n东风汽车集团有限公司\n上汽集团股份有限公司'
  const blob = new Blob([template], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '企业导入模板.txt'
  link.click()
  URL.revokeObjectURL(url)
}

// 处理文件上传
const handleFileUpload = (file: any) => {
  // 这里应该解析Excel/CSV文件
  ElMessage.info('文件上传功能待实现')
}

// 处理批量导入
const processBatchImport = () => {
  if (!batchInput.value.trim()) {
    ElMessage.warning('请输入要导入的企业信息')
    return
  }

  const lines = batchInput.value.trim().split('\n')
  const newCompanies: CompanyOption[] = []

  lines.forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine) {
      // 尝试匹配现有企业
      const company = mockCompanies.find(c => 
        c.name === trimmedLine || 
        c.id === trimmedLine || 
        c.code === trimmedLine
      )
      
      if (company) {
        const exists = selectedCompanies.value.find(c => c.id === company.id)
        if (!exists) {
          newCompanies.push(company)
        }
      } else {
        // 创建新的企业项（实际项目中可能需要验证）
        newCompanies.push({
          id: trimmedLine,
          name: trimmedLine,
          code: ''
        })
      }
    }
  })

  selectedCompanies.value.push(...newCompanies)
  closeBatchDialog()
  emitValue()
  
  ElMessage.success(`成功导入 ${newCompanies.length} 个企业`)
}

// 关闭批量导入对话框
const closeBatchDialog = () => {
  showBatchDialog.value = false
  batchInput.value = ''
}

// 发送值变化事件
const emitValue = () => {
  let value: CompanyValue | undefined

  if (props.multiple) {
    value = selectedCompanies.value.length > 0 ? {
      ids: selectedCompanies.value.map(c => c.id),
      names: selectedCompanies.value.map(c => c.name),
      codes: selectedCompanies.value.map(c => c.code)
    } : undefined
  } else {
    value = selectedCompany.value || companyId.value || companyCode.value ? {
      id: companyId.value || undefined,
      name: companyOptions.value.find(c => c.id === selectedCompany.value)?.name || undefined,
      code: companyCode.value || undefined
    } : undefined
  }

  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.company-selector {
  width: 100%;
}

.selector-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.company-option {
  display: flex;
  flex-direction: column;
}

.company-name {
  font-weight: 500;
}

.company-code {
  font-size: 12px;
  color: #909399;
}

.selected-companies {
  margin-top: 10px;
}

.batch-import ul {
  margin: 5px 0;
  padding-left: 20px;
}

.batch-actions {
  display: flex;
  gap: 10px;
}
</style>
