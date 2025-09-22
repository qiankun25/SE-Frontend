<template>
  <div class="enterprise-supervision">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>企业监管状态</h2>
        <p class="page-description">
          查询汽车生产企业的监管状态、准入状态、有效标记等监管信息
        </p>
      </div>
      <div class="header-right">
        <ExportButton :data="tableData" :total-count="total" :fields="exportFields" default-filename="企业监管状态信息"
          module="enterprise_supervision" @export="handleExport" @download-template="handleDownloadTemplate" />
        <el-button @click="handleReset">
          <el-icon>
            <Refresh />
          </el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 查询条件区域 -->
    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" label-width="140px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="企业名称">
              <el-input v-model="searchForm.enterprise_name" placeholder="请输入企业名称" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="企业ID">
              <el-input v-model="searchForm.enterprise_id" placeholder="请输入企业ID" clearable />
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
            <el-form-item label="监管状态">
              <el-select v-model="searchForm.supervision_status" placeholder="请选择监管状态" clearable filterable multiple
                collapse-tags collapse-tags-tooltip class="wide-select" popper-class="wide-select-dropdown">
                <el-option v-for="option in supervisionStatusOptions" :key="option" :label="option" :value="option" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="企业准入状态">
              <el-select v-model="searchForm.access_status" placeholder="请选择企业准入状态" clearable filterable>
                <el-option v-for="option in accessStatusOptions" :key="option" :label="option" :value="option" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="企业类型">
              <el-select v-model="searchForm.enterprise_type" placeholder="请选择企业类型" clearable filterable>
                <el-option v-for="option in enterpriseTypeOptions" :key="option" :label="option" :value="option" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="新能源标记">
              <el-select v-model="searchForm.new_energy_flag" placeholder="请选择新能源标记" clearable>
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="有效标记">
              <el-select v-model="searchForm.valid_flag" placeholder="请选择有效标记" clearable>
                <el-option label="有效" value="有效" />
                <el-option label="无效" value="无效" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <div class="search-actions">
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
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 字段选择区域 -->
    <DisplayFields field-type="enterprise_supervision" :initial-fields="selectedFields"
      @fields-change="handleFieldsChange" />

    <!-- 结果展示区域 -->
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <span class="result-count">共 {{ total }} 条记录</span>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%" row-key="id">
        <!-- 动态生成表格列 -->
        <el-table-column v-for="field in visibleFields" :key="field.key" :prop="field.key" :label="field.label"
          :width="getColumnWidth(field.key)" :show-overflow-tooltip="true">
          <template #default="scope">
            <span v-if="field.key === 'supervision_status'">
              <el-tag :type="getSupervisionStatusType(scope.row.supervision_status)">
                {{ Array.isArray(scope.row.supervision_status) ? scope.row.supervision_status.join('、') :
                  (scope.row.supervision_status || '-') }}
              </el-tag>
            </span>
            <span v-else-if="field.key === 'access_status'">
              <el-tag :type="getAccessStatusType(scope.row.access_status)">
                {{ scope.row.access_status || '-' }}
              </el-tag>
            </span>
            <span v-else-if="field.key === 'valid_flag'">
              <el-tag :type="scope.row.valid_flag === '有效' ? 'success' : 'danger'">
                {{ scope.row.valid_flag || '-' }}
              </el-tag>
            </span>
            <span v-else-if="field.key === 'new_energy_flag'">
              <el-tag :type="scope.row.new_energy_flag === '是' ? 'success' : 'info'">
                {{ scope.row.new_energy_flag || '-' }}
              </el-tag>
            </span>
            <span v-else>
              {{ scope.row[field.key] || '-' }}
            </span>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { enterpriseSupervisionApi } from '../services/api'
import type {
  EnterpriseSupervisionParams,
  EnterpriseSupervisionItem,
  EnterpriseSupervisionExportParams
} from '../types/api'
import ExportButton from '../components/ExportButton.vue'
import DisplayFields from '../components/DisplayFields.vue'

// 响应式数据
const loading = ref(false)
const total = ref(0)
const tableData = ref<EnterpriseSupervisionItem[]>([])

// 选项数据
const supervisionStatusOptions = ref<string[]>([])
const accessStatusOptions = ref<string[]>([])
const enterpriseTypeOptions = ref<string[]>([])

// 搜索表单
const searchForm = reactive<EnterpriseSupervisionParams>({
  enterprise_id: '',
  enterprise_name: '',
  social_credit_code: '',
  supervision_status: [] as string[],
  supervision_code: '',
  access_status: '',
  valid_flag: '',
  enterprise_type: '',
  new_energy_flag: '',
  registered_address: '',
  production_address: '',
  page: 1,
  pageSize: 20,
  field: 'created_at',
  order: 'desc'
})

// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 字段选择相关
const selectedFields = ref<string[]>([
  'enterprise_id',
  'enterprise_name',
  'supervision_status',
  'access_status',
  'enterprise_type',
  'new_energy_flag'
])

// 所有可用字段
const allFields = ref([
  { key: 'enterprise_id', label: '企业ID', required: true },
  { key: 'enterprise_name', label: '企业名称', required: true },
  { key: 'social_credit_code', label: '统一社会信用代码' },
  { key: 'supervision_status', label: '监管状态' },
  { key: 'supervision_code', label: '监管代码' },
  { key: 'access_status', label: '企业准入状态' },
  { key: 'valid_flag', label: '有效标记' },
  { key: 'enterprise_type', label: '企业类型' },
  { key: 'new_energy_flag', label: '新能源标记' },
  { key: 'registered_address', label: '注册地址' },
  { key: 'production_address', label: '生产地址' },
  { key: 'product_brand', label: '产品商标' },
  { key: 'qualification', label: '资质' },
  { key: 'contact_person', label: '联系人' },
  { key: 'contact_position', label: '联系人职务' },
  { key: 'contact_phone', label: '联系人号码' },
  { key: 'created_at', label: '创建时间' },
  { key: 'updated_at', label: '更新时间' }
])

// 计算属性：可见字段
const visibleFields = computed(() => {
  return allFields.value.filter(field => selectedFields.value.includes(field.key))
})

// 计算属性：导出字段
const exportFields = computed(() => {
  return allFields.value
})

// 初始化选项数据
const initializeOptions = async () => {
  try {
    const [supervisionRes, accessRes, typeRes] = await Promise.all([
      enterpriseSupervisionApi.getSupervisionStatusOptions(),
      enterpriseSupervisionApi.getAccessStatusOptions(),
      enterpriseSupervisionApi.getEnterpriseTypeOptions()
    ])

    if (supervisionRes.code === 200) {
      supervisionStatusOptions.value = supervisionRes.data
    }
    if (accessRes.code === 200) {
      accessStatusOptions.value = accessRes.data
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
    const params: EnterpriseSupervisionParams = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
      fields: selectedFields.value
    }

    const response = await enterpriseSupervisionApi.search(params)

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
    social_credit_code: '',
    supervision_status: [] as string[],
    supervision_code: '',
    access_status: '',
    valid_flag: '',
    enterprise_type: '',
    new_energy_flag: '',
    registered_address: '',
    production_address: '',
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
    'new_energy_flag': 120,
    'registered_address': 250,
    'production_address': 250,
    'product_brand': 150,
    'qualification': 150,
    'contact_person': 100,
    'contact_position': 120,
    'contact_phone': 130,
    'created_at': 160,
    'updated_at': 160
  }
  return widthMap[fieldKey] || 150
}

// 获取监管状态标签类型（支持 string 或 string[]）
const getSupervisionStatusType = (status: string | string[] | undefined): string => {
  if (!status) return 'info'
  const check = (s: string) => {
    if (s.includes('正常')) return 'success'
    if (s.includes('重点监管') || s.includes('责令整改')) return 'warning'
    if (s.includes('暂停') || s.includes('停产')) return 'danger'
    return 'info'
  }

  if (Array.isArray(status)) {
    // 优先级：danger > warning > success > info
    let hasDanger = false
    let hasWarning = false
    let hasSuccess = false
    for (const s of status) {
      if (!s) continue
      const t = check(s)
      if (t === 'danger') { hasDanger = true; break }
      if (t === 'warning') { hasWarning = true }
      if (t === 'success') { hasSuccess = true }
    }
    if (hasDanger) return 'danger'
    if (hasWarning) return 'warning'
    if (hasSuccess) return 'success'
    return 'info'
  }

  return check(status as string)
}

// 获取准入状态标签类型
const getAccessStatusType = (status: string): string => {
  if (!status) return 'info'
  if (status.includes('准入') || status.includes('正常')) return 'success'
  if (status.includes('暂停') || status.includes('限制')) return 'warning'
  if (status.includes('撤销') || status.includes('注销')) return 'danger'
  return 'info'
}

// 查看详情
const handleView = (row: EnterpriseSupervisionItem) => {
  ElMessageBox.alert(
    `
    <div style="text-align: left;">
      <p><strong>企业ID：</strong>${row.enterprise_id || '-'}</p>
      <p><strong>企业名称：</strong>${row.enterprise_name || '-'}</p>
      <p><strong>统一社会信用代码：</strong>${row.social_credit_code || '-'}</p>
      <p><strong>监管状态：</strong>${row.supervision_status || '-'}</p>
      <p><strong>监管代码：</strong>${row.supervision_code || '-'}</p>
      <p><strong>企业准入状态：</strong>${row.access_status || '-'}</p>
      <p><strong>有效标记：</strong>${row.valid_flag || '-'}</p>
      <p><strong>企业类型：</strong>${row.enterprise_type || '-'}</p>
      <p><strong>新能源标记：</strong>${row.new_energy_flag || '-'}</p>
      <p><strong>注册地址：</strong>${row.registered_address || '-'}</p>
      <p><strong>生产地址：</strong>${row.production_address || '-'}</p>
      <p><strong>联系人：</strong>${row.contact_person || '-'}</p>
      <p><strong>联系电话：</strong>${row.contact_phone || '-'}</p>
    </div>
    `,
    '企业监管详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定'
    }
  )
}

// 导出处理
const handleExport = async (config: any) => {
  try {
    const params: EnterpriseSupervisionExportParams = {
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

    const blob = await enterpriseSupervisionApi.export(params)

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

// 下载模板
const handleDownloadTemplate = async () => {
  try {
    const blob = await enterpriseSupervisionApi.downloadTemplate()

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '企业监管状态批量查询模板.xlsx'
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

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  searchForm.pageSize = size
  handleSearch()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  searchForm.page = page
  handleSearch()
}

// 组件挂载
onMounted(async () => {
  await initializeOptions()
  // 默认加载第一页数据
  await handleSearch()
})
</script>

<style scoped>
.enterprise-supervision {
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
  font-size: 22px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 16px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.search-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-count {
  color: #909399;
  font-size: 16px;
}

.search-actions {
  text-align: right;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 宽度选择器样式 */
.wide-select {
  width: 100%;
}

.wide-select-dropdown {
  min-width: 200px;
}
</style>
