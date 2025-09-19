<template>
  <div class="enterprise-info">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>企业基本信息</h2>
        <p class="page-description">
          查询汽车生产企业的基本信息、监管状态、资质情况、注册和生产地址等详细信息
        </p>
      </div>
      <div class="header-right">
        <export-button :data="tableData" :total-count="total" :fields="exportFields" default-filename="企业基本信息"
          @export="handleExport" @download-template="handleDownloadTemplate" />
      </div>
    </div>

    <!-- 查询条件区域 -->
    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
          <help-tooltip content="支持按企业ID、名称、监管状态、企业类型等条件查询企业基本信息" title="企业基本信息查询帮助" />
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="企业ID">
              <el-input v-model="searchForm.enterprise_id" placeholder="请输入企业ID" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="企业名称">
              <el-input v-model="searchForm.enterprise_name" placeholder="请输入企业名称" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="监管状态">
              <el-select v-model="searchForm.supervision_status" placeholder="请选择监管状态" clearable class="wide-select"
                popper-class="wide-select-dropdown">
                <el-option v-for="status in supervisionStatusOptions" :key="status" :label="status" :value="status" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="新能源标记">
              <el-select v-model="searchForm.new_energy_flag" placeholder="请选择新能源标记" clearable class="wide-select"
                popper-class="wide-select-dropdown">
                <el-option label="是" value="1" />
                <el-option label="否" value="2" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="企业类型">
              <el-select v-model="searchForm.enterprise_type" placeholder="请选择企业类型" clearable filterable
                class="wide-select" popper-class="wide-select-dropdown">
                <el-option v-for="type in enterpriseTypeOptions" :key="type" :label="type" :value="type" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="统一社会信用代码">
              <el-input v-model="searchForm.social_credit_code" placeholder="请输入统一社会信用代码" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="注册地址">
              <el-input v-model="searchForm.registered_address" placeholder="请输入注册地址关键词" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="生产地址">
              <el-input v-model="searchForm.production_address" placeholder="请输入生产地址关键词" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="产品商标">
              <el-input v-model="searchForm.product_brand" placeholder="请输入产品商标关键词" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="资质">
              <el-input v-model="searchForm.qualification" placeholder="请输入资质关键词" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="16">
            <el-form-item>
              <el-button type="primary" @click="handleSearch" :loading="loading">
                <el-icon>
                  <Search />
                </el-icon>
                查询
              </el-button>
              <el-button @click="handleReset">
                <el-icon>
                  <Refresh />
                </el-icon>
                重置
              </el-button>
              <el-button type="success" @click="showBatchDialog = true">
                <el-icon>
                  <Upload />
                </el-icon>
                批量查询
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 字段选择区域 -->
    <DisplayFields
      field-type="enterprise_supervision"
      :initial-fields="selectedFields"
      @fields-change="handleFieldsChange"
    />

    <!-- 批量查询对话框 -->
    <BatchQueryDialog
      v-model="showBatchDialog"
      title="批量查询企业基本信息"
      :query-types="batchQueryTypes"
      placeholder="请输入查询条件，每行一个（支持企业ID或企业名称）"
      :max-queries="100"
      :support-file-upload="true"
      :loading="batchLoading"
      @confirm="handleBatchSearch"
      @download-template="handleDownloadTemplate"
      @file-upload="handleBatchFileUpload"
    />

    <!-- 查询结果区域 -->
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <div class="result-summary" v-if="total > 0">
            共找到 <strong>{{ total }}</strong> 条记录
          </div>
        </div>
      </template>

      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        row-key="id"
        height="500"
      >
        <!-- 动态生成表格列 -->
        <el-table-column
          v-for="field in visibleFields"
          :key="field.key"
          :prop="field.key"
          :label="field.label"
          :width="getColumnWidth(field.key)"
          :sortable="field.sortable ? 'custom' : false"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span v-if="field.key === 'supervision_status'">
              <el-tag
                :type="getSupervisionStatusType(scope.row.supervision_status)"
              >
                {{ scope.row.supervision_status || '-' }}
              </el-tag>
            </span>
            <span v-else-if="field.key === 'access_status'">
              <el-tag
                :type="getAccessStatusType(scope.row.access_status)"
              >
                {{ scope.row.access_status || '-' }}
              </el-tag>
            </span>
            <span v-else-if="field.key === 'valid_flag'">
              <el-tag
                :type="scope.row.valid_flag === '有效' ? 'success' : 'danger'"
              >
                {{ scope.row.valid_flag || '-' }}
              </el-tag>
            </span>
            <span v-else-if="field.key === 'new_energy_flag'">
              <el-tag
                :type="scope.row.new_energy_flag === '是' || scope.row.new_energy_flag === '1' ? 'success' : 'info'"
              >
                {{ scope.row.new_energy_flag === '1' ? '是' : scope.row.new_energy_flag === '2' ? '否' : scope.row.new_energy_flag || '-' }}
              </el-tag>
            </span>
            <span v-else>
              {{ scope.row[field.key] || '-' }}
            </span>
          </template>
        </el-table-column>

      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Upload } from '@element-plus/icons-vue'
import type {
  EnterpriseBasicParams,
  EnterpriseBasicItem
} from '../types/api'
import { enterpriseBasicApi } from '../services/api'
import ExportButton from '../components/ExportButton.vue'
import DisplayFields from '../components/DisplayFields.vue'
import BatchQueryDialog from '../components/BatchQueryDialog.vue'

// 响应式数据
const loading = ref(false)
const batchLoading = ref(false)
const total = ref(0)
const tableData = ref<EnterpriseBasicItem[]>([])
const showBatchDialog = ref(false)

// 选项数据
const supervisionStatusOptions = ref<string[]>([])
const enterpriseTypeOptions = ref<string[]>([])

// 搜索表单
const searchForm = reactive<EnterpriseBasicParams>({
  enterprise_id: '',
  enterprise_name: '',
  supervision_status: '',
  new_energy_flag: '',
  enterprise_type: '',
  social_credit_code: '',
  registered_address: '',
  production_address: '',
  product_brand: '',
  qualification: '',
  page: 1,
  pageSize: 20,
  field: undefined as string | undefined,
  order: undefined as "asc" | "desc" | undefined
})

// 批量查询配置
const batchQueryTypes = [
  { value: 'enterprise_id', label: '按企业ID查询' },
  { value: 'enterprise_name', label: '按企业名称查询' }
]

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 字段选择相关
const selectedFields = ref<string[]>([
  'enterprise_id',
  'enterprise_name',
  'supervision_status',
  'new_energy_flag',
  'enterprise_type',
  'registered_address',
  'production_address'
])

// 所有可用字段 - 与enterprise_supervision字段保持一致
const allFields = ref([
  { key: 'enterprise_id', label: '企业ID', required: true, sortable: true },
  { key: 'enterprise_name', label: '企业名称', required: true, sortable: true },
  { key: 'social_credit_code', label: '统一社会信用代码', sortable: true },
  { key: 'supervision_status', label: '监管状态', sortable: true },
  { key: 'supervision_code', label: '监管代码' },
  { key: 'access_status', label: '企业准入状态' },
  { key: 'valid_flag', label: '有效标记' },
  { key: 'enterprise_type', label: '企业类型', sortable: true },
  { key: 'new_energy_flag', label: '新能源标记', sortable: true },
  { key: 'registered_address', label: '注册地址' },
  { key: 'production_address', label: '生产地址' },
  { key: 'product_brand', label: '产品商标' },
  { key: 'qualification', label: '资质' },
  { key: 'contact_person', label: '联系人' },
  { key: 'contact_position', label: '联系人职务' },
  { key: 'contact_phone', label: '联系人号码' },
  { key: 'created_at', label: '创建时间', sortable: true },
  { key: 'updated_at', label: '更新时间', sortable: true }
])

// 计算属性：可见字段
const visibleFields = computed(() => {
  return allFields.value.filter(field => selectedFields.value.includes(field.key))
})

// 计算属性：导出字段
const exportFields = computed(() => {
  return allFields.value
})

// 方法
// 初始化选项数据
const initializeOptions = async () => {
  try {
    const [supervisionRes, typeRes] = await Promise.all([
      enterpriseBasicApi.getSupervisionStatusOptions(),
      enterpriseBasicApi.getEnterpriseTypeOptions()
    ])

    if (supervisionRes.code === 200) {
      supervisionStatusOptions.value = supervisionRes.data
    }
    if (typeRes.code === 200) {
      enterpriseTypeOptions.value = typeRes.data
    }
  } catch (error) {
    console.error('初始化选项数据失败:', error)
  }
}

// 查询方法
const handleSearch = async () => {
  loading.value = true
  try {
    const params: EnterpriseBasicParams = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    const response = await enterpriseBasicApi.search(params)

    if (response.code === 200) {
      tableData.value = response.data.list
      total.value = response.data.total
      ElMessage.success('查询完成')
    } else {
      ElMessage.error(response.message || '查询失败')
    }
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败，请重试')
  } finally {
    loading.value = false
  }
}

// 重置方法
const handleReset = () => {
  Object.assign(searchForm, {
    enterprise_id: '',
    enterprise_name: '',
    supervision_status: '',
    new_energy_flag: '',
    enterprise_type: '',
    social_credit_code: '',
    registered_address: '',
    production_address: '',
    product_brand: '',
    qualification: '',
    page: 1,
    pageSize: 20,
    field: 'created_at',
    order: 'desc'
  })
  pagination.page = 1
  pagination.pageSize = 20
  total.value = 0
  tableData.value = []
}


// 字段选择变化处理
const handleFieldsChange = (fields: string[]) => {
  selectedFields.value = fields
  // 如果已有数据，重新搜索以更新显示字段
  if (tableData.value.length > 0) {
    handleSearch()
  }
}

// 获取列宽度
const getColumnWidth = (fieldKey: string): number => {
  const widthMap: Record<string, number> = {
    'enterprise_id': 120,
    'enterprise_name': 200,
    'social_credit_code': 180,
    'supervision_status': 120,
    'supervision_code': 100,
    'access_status': 140,
    'valid_flag': 100,
    'enterprise_type': 140,
    'catalog_number': 120,
    'new_energy_flag': 120,
    'registered_address': 250,
    'production_address': 250,
    'product_brand': 150,
    'qualification': 150,
    'equity': 150,
    'contact_person': 100,
    'contact_position': 120,
    'contact_phone': 130,
    'created_at': 160,
    'updated_at': 160
  }
  return widthMap[fieldKey] || 150
}

// 获取监管状态标签类型
const getSupervisionStatusType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
  if (!status) return 'info'
  if (status.includes('正常')) return 'success'
  if (status.includes('重点监管') || status.includes('责令整改')) return 'warning'
  if (status.includes('暂停') || status.includes('停产')) return 'danger'
  return 'info'
}

// 获取准入状态标签类型
const getAccessStatusType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
  if (!status) return 'info'
  if (status.includes('准入') || status.includes('正常')) return 'success'
  if (status.includes('暂停') || status.includes('限制')) return 'warning'
  if (status.includes('撤销') || status.includes('注销')) return 'danger'
  return 'info'
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  searchForm.pageSize = size
  handleSearch()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  searchForm.page = page
  handleSearch()
}


// 导出处理
const handleExport = async (config: any) => {
  try {
    const params = {
      ...searchForm,
      format: config.format,
      filename: config.filename,
      fields: config.selectedFields
    }

    // 根据导出范围调整参数
    if (config.range === 'current') {
      params.page = pagination.page
      params.pageSize = pagination.pageSize
    } else if (config.range === 'all') {
      params.page = 1
      params.pageSize = 10000
    }

    const blob = await enterpriseBasicApi.export(params)

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${config.filename}.${config.format === 'csv' ? 'csv' : 'xlsx'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 批量查询处理
const handleBatchSearch = async (data: { queries: string[]; query_type: string }) => {
  batchLoading.value = true

  try {
    const params = {
      queries: data.queries,
      query_type: data.query_type
    }

    const response = await enterpriseBasicApi.batchSearch(params)

    if (response.code === 200) {
      tableData.value = response.data.list
      total.value = response.data.total
      showBatchDialog.value = false

      ElMessage.success(
        `批量查询完成，有效: ${response.data.validCount}，无效: ${response.data.invalidCount}`
      )
    } else {
      ElMessage.error(response.message || '批量查询失败')
    }
  } catch (error) {
    console.error('批量查询失败:', error)
    ElMessage.error('批量查询失败，请重试')
  } finally {
    batchLoading.value = false
  }
}

const handleBatchFileUpload = () => {
  // 这里可以实现文件解析逻辑
  ElMessage.info('文件上传功能开发中...')
  return false
}

// 下载模板
const handleDownloadTemplate = async () => {
  try {
    const blob = await enterpriseBasicApi.downloadTemplate()

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '企业基本信息批量查询模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败，请重试')
  }
}

// 组件挂载
onMounted(async () => {
  await initializeOptions()
  // 默认加载第一页数据
  await handleSearch()
})
</script>

<style scoped>
.enterprise-info {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.search-card,
.display-fields-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.result-summary {
  color: #606266;
  font-size: 14px;
  font-weight: normal;
}

.result-summary strong {
  color: #409eff;
  font-weight: 600;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.batch-search-content {
  padding: 10px 0;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.batch-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.enterprise-detail {
  padding: 10px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
  }

  .header-right {
    align-self: stretch;
  }
}
</style>

