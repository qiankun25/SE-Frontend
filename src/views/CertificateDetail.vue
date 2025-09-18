<template>
  <div class="certificate-detail">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>合格证单证查询</h2>
        <p class="page-description">
          支持通过合格证编号、车架号(VIN)等精确查询单个合格证的详细信息，常用于信息公开申请和现场核验
        </p>
      </div>
      <div class="header-right">
        <export-button :data="tableData" :selected-data="selectedRows" :total-count="total" :fields="exportFields"
          default-filename="合格证详细信息" :allow-select-export="true" @export="handleExport"
          @download-template="handleDownloadTemplate" />
      </div>
    </div>

    <!-- 查询条件区域 -->
    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
          <help-tooltip :content="helpTemplates.certificateDetailSearch.content"
            :title="helpTemplates.certificateDetailSearch.title"
            :examples="helpTemplates.certificateDetailSearch.examples" />
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="合格证编号">
              <el-input v-model="searchForm.certificateNumber" placeholder="请输入合格证编号" clearable />
              <help-tooltip content="输入完整的合格证编号进行精确查询" placement="top" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="车架号(VIN)">
              <el-input v-model="searchForm.vin" placeholder="请输入17位车架号" clearable maxlength="17" show-word-limit />
              <help-tooltip content="输入17位车辆识别代号，支持改装车多证查询" placement="top" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="企业选择">
              <el-input v-model="searchForm.companyName" placeholder="请输入企业名称" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="车辆型号">
              <el-input v-model="searchForm.vehicleModel" placeholder="请输入车辆型号" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="制造日期">
              <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="至"
                start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"
                @change="handleTimeRangeChange" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="查询模式">
              <el-radio-group v-model="searchForm.queryMode">
                <el-radio value="single">单个查询</el-radio>
                <el-radio value="batch">批量查询</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 批量查询区域 -->
        <el-row v-if="searchForm.queryMode === 'batch'">
          <el-col :span="24">
            <el-form-item label="批量输入">
              <div class="batch-input-container">
                <el-input v-model="batchInput" type="textarea" :rows="4"
                  placeholder="请输入要查询的信息，每行一个&#10;支持格式：&#10;- 合格证编号&#10;- 车架号(VIN)&#10;- 企业名称+车型" />
                <div class="batch-actions">
                  <el-button @click="downloadBatchTemplate">下载模板</el-button>
                  <el-upload ref="uploadRef" :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls,.csv"
                    @change="handleFileUpload">
                    <el-button type="primary" plain>上传文件</el-button>
                  </el-upload>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <div class="search-actions">
              <el-button type="primary" @click="handleSearch" :loading="loading">
                <el-icon>
                  <Search />
                </el-icon>
                {{ searchForm.queryMode === 'batch' ? '批量查询' : '查询' }}
              </el-button>
              <el-button @click="handleReset">
                <el-icon>
                  <Refresh />
                </el-icon>
                重置
              </el-button>
              <el-button type="info" plain @click="handleTemplateExport">
                导出模板格式
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 查询结果统计 -->
    <el-row :gutter="20" class="stats-row" v-if="hasSearched">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ formatNumber(stats.totalRecords) }}</div>
            <div class="stats-label">查询到记录数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ formatNumber(stats.validRecords) }}</div>
            <div class="stats-label">有效记录数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ formatNumber(stats.multipleRecords) }}</div>
            <div class="stats-label">多证记录数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ stats.queryTime }}</div>
            <div class="stats-label">查询耗时</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 显示字段选择组件 -->
    <certificate-display-fields v-if="hasSearched" :initial-fields="displayFields" mode="detail"
      @fields-change="handleDisplayFieldsChange" />

    <!-- 结果展示区域 -->
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <div class="result-actions">
            <el-button-group>
              <el-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'">
                <el-icon>
                  <Grid />
                </el-icon>
                列表视图
              </el-button>
              <el-button :type="viewMode === 'detail' ? 'primary' : 'default'" @click="viewMode = 'detail'">
                <el-icon>
                  <Document />
                </el-icon>
                详情视图
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 列表视图 -->
      <div v-show="viewMode === 'table'">
        <el-table :data="tableData" v-loading="loading" stripe border height="500"
          @selection-change="handleSelectionChange" @row-click="handleRowClick">
          <el-table-column type="selection" width="55" />
          <el-table-column type="index" label="序号" width="60" />

          <!-- 动态列 -->
          <template v-for="column in dynamicColumns" :key="column.key">
            <el-table-column v-if="column && column.key" :prop="column.key" :label="column.label || ''"
              :width="column.width" :min-width="column.minWidth" :sortable="column.sortable"
              :align="column.align || 'left'" :show-overflow-tooltip="column.showTooltip">
              <template #default="{ row }" v-if="column.formatter">
                <span v-html="column.formatter(row[column.key] || '', row) || ''"></span>
              </template>
              <template #default="{ row }" v-else>
                <span>{{ row[column.key] || '' }}</span>
              </template>
            </el-table-column>
          </template>

          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleViewDetail(row)">
                查看详情
              </el-button>
              <el-button type="success" link @click="handleExportSingle(row)">
                导出
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="total"
            :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange" @current-change="handlePageChange" />
        </div>
      </div>

      <!-- 详情视图 -->
      <div v-show="viewMode === 'detail'" class="detail-container">
        <div v-if="selectedCertificate" class="certificate-detail-view">
          <!-- 详情内容将在下一步添加 -->
          <el-empty v-if="!selectedCertificate" description="请选择一条记录查看详情" />
        </div>
        <el-empty v-else description="请先查询数据" />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Grid, Document } from '@element-plus/icons-vue'

// 导入通用组件
import ExportButton from '../components/ExportButton.vue'
import HelpTooltip from '../components/HelpTooltip.vue'
import CertificateDisplayFields from '../components/CertificateDisplayFields.vue'

// 导入帮助模板
import { helpTemplates } from '../utils/helpTemplates'

// 导入类型定义
import type { CertificateDetailParams, CertificateDetailItem } from '../types/api'

// 响应式数据
const loading = ref(false)
const hasSearched = ref(false)
const viewMode = ref<'table' | 'detail'>('table')
const selectedRows = ref<CertificateDetailItem[]>([])
const selectedCertificate = ref<CertificateDetailItem | null>(null)
const batchInput = ref('')
const displayFields = ref<string[]>([]) // 用户选择的显示字段

// 搜索表单
const searchForm = reactive<Partial<CertificateDetailParams> & { queryMode: 'single' | 'batch' }>({
  certificateNumber: '',
  vin: '',
  companyName: '',
  vehicleModel: '',
  timeRange: undefined,
  queryMode: 'single'
})

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 表格数据
const tableData = ref<CertificateDetailItem[]>([])
const total = ref(0)

// 统计数据
const stats = reactive({
  totalRecords: 0,
  validRecords: 0,
  multipleRecords: 0,
  queryTime: ''
})

// 导出字段配置
const exportFields = [
  { key: 'certificateNumber', label: '合格证编号', required: true },
  { key: 'vin', label: '车架号', required: true },
  { key: 'companyName', label: '制造企业' },
  { key: 'vehicleBrand', label: '车辆品牌' },
  { key: 'vehicleModel', label: '车辆型号' },
  { key: 'vehicleColor', label: '车身颜色' },
  { key: 'engineNumber', label: '发动机号' },
  { key: 'fuelType', label: '燃料种类' },
  { key: 'displacement', label: '排量' },
  { key: 'emissionStandard', label: '排放标准' },
  { key: 'manufactureDate', label: '制造日期' },
  { key: 'issueDate', label: '发证日期' }
]



// 事件处理函数
const handleSearch = async () => {
  if (searchForm.queryMode === 'single') {
    if (!searchForm.certificateNumber && !searchForm.vin && !searchForm.companyName) {
      ElMessage.warning('请至少输入一个查询条件')
      return
    }
  } else {
    if (!batchInput.value.trim()) {
      ElMessage.warning('请输入批量查询内容')
      return
    }
  }

  loading.value = true
  hasSearched.value = true

  try {
    const startTime = Date.now()

    // 构建查询参数
    const params: CertificateDetailParams = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    // 这里应该调用实际的API
    // const response = await certificateDetailApi.search(params)

    // 模拟API响应
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟数据
    const mockData: CertificateDetailItem[] = [
      {
        certificateNumber: 'CERT2023001234567',
        companyName: '一汽集团有限公司',
        vehicleBrand: '红旗',
        vehicleModel: 'CA7230AE3',
        vin: 'LGWEF4A57MA123456',
        engineNumber: 'CA4GA3-12-001234',
        chassisNumber: 'CA1234567890',
        vehicleColor: '黑色',
        fuelType: '汽油',
        displacement: 2000,
        emissionStandard: '国六',
        fuelConsumption: 8.5,
        dimensions: {
          length: 5137,
          width: 1904,
          height: 1493
        },
        weight: {
          totalWeight: 2350,
          curbWeight: 1850,
          ratedLoad: 500
        },
        manufactureDate: '2023-06-15',
        issueDate: '2023-06-20'
      }
    ]

    tableData.value = mockData
    total.value = mockData.length

    // 更新统计数据
    const endTime = Date.now()
    stats.totalRecords = mockData.length
    stats.validRecords = mockData.length
    stats.multipleRecords = 0
    stats.queryTime = `${endTime - startTime}ms`

    ElMessage.success('查询完成')
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    if (key === 'queryMode') {
      searchForm[key] = 'single'
    } else if (key === 'company') {
      searchForm[key as keyof typeof searchForm] = undefined
    } else {
      searchForm[key as keyof typeof searchForm] = ''
    }
  })
  batchInput.value = ''
  pagination.page = 1
  tableData.value = []
  hasSearched.value = false
  selectedCertificate.value = null
}

const handleCompanyChange = (value: any) => {
  // 企业选择变化处理
}

const handleTimeRangeChange = (value: any) => {
  // 时间范围变化处理
}

const handleSelectionChange = (selection: CertificateDetailItem[]) => {
  selectedRows.value = selection
}

const handleRowClick = (row: CertificateDetailItem) => {
  selectedCertificate.value = row
  viewMode.value = 'detail'
}

const handleViewDetail = (row: CertificateDetailItem) => {
  selectedCertificate.value = row
  viewMode.value = 'detail'
}

const handleExportSingle = (row: CertificateDetailItem) => {
  ElMessage.success(`导出 ${row.certificateNumber} 的详细信息`)
}

const handlePageChange = (page: number) => {
  pagination.page = page
  handleSearch()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  handleSearch()
}

const handleExport = (config: any) => {
  // 导出配置处理
  ElMessage.success('导出成功')
}

const handleDownloadTemplate = () => {
  ElMessage.info('下载模板功能开发中...')
}

const handleTemplateExport = () => {
  ElMessage.info('导出合格证模板格式功能开发中...')
}

const downloadBatchTemplate = () => {
  const template = '查询类型,查询内容\n合格证编号,CERT2023001234567\n车架号,LGWEF4A57MA123456\n企业名称,一汽集团有限公司'
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '批量查询模板.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const handleFileUpload = (file: any) => {
  ElMessage.info('文件上传功能待实现')
}

const handleDisplayFieldsChange = (fields: string[]) => {
  displayFields.value = fields
  // 显示字段变化时，如果已经有查询结果，可以考虑重新渲染表格
  // 这里不需要重新查询数据，只需要更新显示字段即可
}

// 计算属性
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

// 动态列生成
const dynamicColumns = computed(() => {
  const fields = displayFields.value
  if (fields.length === 0) {
    // 默认显示的列
    return [
      { key: 'certificateNumber', label: '合格证编号', width: 180, showTooltip: true },
      { key: 'vin', label: '车架号(VIN)', width: 180, showTooltip: true },
      { key: 'companyName', label: '制造企业', minWidth: 200, showTooltip: true },
      { key: 'vehicleBrand', label: '车辆品牌', width: 120 },
      { key: 'vehicleModel', label: '车辆型号', width: 150, showTooltip: true },
      { key: 'vehicleColor', label: '车身颜色', width: 100 },
      { key: 'manufactureDate', label: '制造日期', width: 120, align: 'center' },
      { key: 'issueDate', label: '发证日期', width: 120, align: 'center' }
    ]
  }

  // 字段映射配置
  const fieldMapping: Record<string, any> = {
    'QYDM': { key: 'companyCode', label: '合格证企业代码', width: 150, showTooltip: true },
    'CLZZQYMC': { key: 'companyName', label: '车辆制造企业名称', minWidth: 200, showTooltip: true },
    'CLZT': { key: 'vehicleCategory', label: '车辆类别', width: 100 },
    'CLXH': { key: 'vehicleModel', label: '车辆型号', width: 150, showTooltip: true },
    'CLLX': { key: 'vehicleType', label: '车辆类型', width: 120, showTooltip: true },
    'CLPP': { key: 'vehicleBrand', label: '车辆品牌', width: 120 },
    'CLMC': { key: 'vehicleName', label: '车辆名称', minWidth: 200, showTooltip: true },
    'RLZL': { key: 'fuelType', label: '燃料种类', width: 100 },
    'PL': { key: 'displacement', label: '排量', width: 80, align: 'right' },
    'C': { key: 'length', label: '长', width: 80, align: 'right' },
    'ZZL': { key: 'totalWeight', label: '总质量', width: 100, align: 'right' },
    'ZBZL': { key: 'curbWeight', label: '整备质量', width: 100, align: 'right' },
    'ZJ': { key: 'wheelbase', label: '轴距', width: 80, align: 'right' },
    'UPD': { key: 'uploadTime', label: '上传时间', width: 160, align: 'center' },
    'SL': { key: 'quantity', label: '数量', width: 120, align: 'right' },
    'SCDZ': { key: 'productionAddress', label: '生产地址', minWidth: 150, showTooltip: true },
    'SF': { key: 'productionProvince', label: '省份', width: 100 },
    'CS': { key: 'productionCity', label: '城市', width: 100 },
    'QX': { key: 'district', label: '区县', width: 100 },
    'G50': { key: 'sixCategory', label: '六大类', width: 100 },
    'XNYBJ': { key: 'newEnergyMark', label: '新能源标记', width: 120, align: 'center' },
    'XNYLB': { key: 'newEnergyType', label: '新能源类别', width: 120 },
    'QYID': { key: 'announcementCompanyId', label: '公告企业ID', width: 150, showTooltip: true },
    'GXSJ': { key: 'updateTime', label: '更新时间', width: 160, align: 'center' },
    'JT': { key: 'group', label: '集团', width: 120, showTooltip: true },
    'UPY': { key: 'uploadYear', label: '上传年', width: 80, align: 'center' },
    'UPM': { key: 'uploadMonth', label: '上传月', width: 80, align: 'center' }
  }

  // 根据用户选择的字段生成列
  const columns: any[] = []
  fields.forEach(fieldKey => {
    const fieldConfig = fieldMapping[fieldKey]
    if (fieldConfig) {
      columns.push(fieldConfig)
    }
  })

  return columns
})

// 生命周期
onMounted(() => {
  // 初始化页面
})
</script>

<style scoped>
.certificate-detail {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.header-right {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.batch-input-container {
  width: 100%;
}

.batch-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.search-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-item {
  padding: 10px 0;
}

.stats-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #606266;
}

.result-card {
  margin-bottom: 20px;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px 0;
}

.detail-container {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.certificate-detail-view {
  width: 100%;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .search-actions {
    flex-wrap: wrap;
  }

  .batch-actions {
    flex-wrap: wrap;
  }

  .stats-row .el-col {
    margin-bottom: 10px;
  }
}
</style>
