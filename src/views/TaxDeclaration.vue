<template>
  <div class="tax-declaration">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>财税申报信息查询</h2>
        <p class="page-description">
          查询减免购置税、新车船税等财税申报相关信息，支持与商务部交换数据统计
        </p>
      </div>
      <div class="header-right">
        <export-button :data="tableData" :total-count="total" :fields="exportFields" default-filename="财税申报信息"
          @export="handleExport" @download-template="handleDownloadTemplate" />
      </div>
    </div>

    <!-- 查询条件区域 -->
    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
          <help-tooltip content="支持按申报类型、车辆类型、时间范围等条件查询财税申报信息" title="财税申报查询帮助" />
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="申报类型">
              <el-select v-model="searchForm.declarationType" placeholder="请选择申报类型" clearable>
                <el-option label="减免购置税" value="减免购置税" />
                <el-option label="新车船税" value="新车船税" />
                <el-option label="商务部交换数据" value="商务部交换数据" />
                <el-option label="出口退税" value="出口退税" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="车辆类型">
              <el-select v-model="searchForm.vehicleType" placeholder="请选择车辆类型" clearable>
                <el-option label="乘用车" value="乘用车" />
                <el-option label="客车" value="客车" />
                <el-option label="货车" value="货车" />
                <el-option label="专用车" value="专用车" />
                <el-option label="新能源汽车" value="新能源汽车" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="申报时间">
              <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="至"
                start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"
                @change="handleTimeRangeChange" />
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
                查询
              </el-button>
              <el-button @click="handleReset">
                <el-icon>
                  <Refresh />
                </el-icon>
                重置
              </el-button>
              <el-button type="info" plain @click="handleQuickQuery">
                快捷查询
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 快捷查询按钮 -->
    <el-card class="quick-query-card" shadow="never" v-if="showQuickQuery">
      <template #header>
        <span>快捷查询</span>
      </template>
      <div class="quick-buttons">
        <el-button @click="handleQuickSearch('last-month-commerce')">上月与商务部交换数据</el-button>
        <el-button @click="handleQuickSearch('last-year-tax')">去年车船税统计</el-button>
        <el-button @click="handleQuickSearch('purchase-tax-exempt')">减免购置税统计</el-button>
        <el-button @click="handleQuickSearch('cumulative-exchange')">累计交换总量</el-button>
      </div>
    </el-card>

    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-row" v-if="hasSearched">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ formatNumber(stats.totalDeclarations) }}</div>
            <div class="stats-label">申报总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ formatNumber(stats.totalAmount) }}</div>
            <div class="stats-label">涉及金额(万元)</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ formatNumber(stats.totalCompanies) }}</div>
            <div class="stats-label">涉及企业数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ stats.timeRange }}</div>
            <div class="stats-label">统计时间段</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

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
                表格视图
              </el-button>
              <el-button :type="viewMode === 'chart' ? 'primary' : 'default'" @click="viewMode = 'chart'">
                <el-icon>
                  <TrendCharts />
                </el-icon>
                图表视图
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 表格视图 -->
      <div v-show="viewMode === 'table'">
        <el-table :data="tableData" v-loading="loading" stripe border height="500" @sort-change="handleSortChange"
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column type="index" label="序号" width="60" />

          <el-table-column prop="declarationType" label="申报类型" width="150" align="center">
            <template #default="{ row }">
              <el-tag :type="getDeclarationTypeTag(row.declarationType)">
                {{ row.declarationType }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="vehicleType" label="车辆类型" width="120" align="center" />

          <el-table-column prop="companyName" label="企业名称" min-width="200" show-overflow-tooltip />

          <el-table-column prop="vehicleModel" label="车辆型号" width="150" show-overflow-tooltip />

          <el-table-column prop="quantity" label="申报数量" width="120" align="right" sortable="custom">
            <template #default="{ row }">
              <span class="quantity-value">{{ formatNumber(row.quantity) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="amount" label="涉及金额(万元)" width="150" align="right" sortable="custom">
            <template #default="{ row }">
              <span class="amount-value">{{ formatCurrency(row.amount) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="exchangeDate" label="交换日期" width="120" align="center" />

          <el-table-column prop="cumulativeTotal" label="累计总量" width="120" align="right">
            <template #default="{ row }">
              <span class="cumulative-value">{{ formatNumber(row.cumulativeTotal) }}</span>
            </template>
          </el-table-column>

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

      <!-- 图表视图 -->
      <div v-show="viewMode === 'chart'" class="chart-container">
        <div class="chart-placeholder">
          <el-empty description="图表功能开发中..." />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Grid, TrendCharts } from '@element-plus/icons-vue'

// 导入通用组件
import ExportButton from '../components/ExportButton.vue'
import HelpTooltip from '../components/HelpTooltip.vue'

// 导入类型定义
import type { TaxDeclarationParams, TaxDeclarationItem } from '../types/api'

// 响应式数据
const loading = ref(false)
const hasSearched = ref(false)
const viewMode = ref<'table' | 'chart'>('table')
const showQuickQuery = ref(false)
const selectedRows = ref<TaxDeclarationItem[]>([])

// 搜索表单
const searchForm = reactive<Partial<TaxDeclarationParams>>({
  declarationType: '',
  vehicleType: '',
  timeRange: undefined
})

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 表格数据
const tableData = ref<TaxDeclarationItem[]>([])
const total = ref(0)

// 统计数据
const stats = reactive({
  totalDeclarations: 0,
  totalAmount: 0,
  totalCompanies: 0,
  timeRange: ''
})

// 导出字段配置
const exportFields = [
  { key: 'declarationType', label: '申报类型', required: true },
  { key: 'vehicleType', label: '车辆类型' },
  { key: 'companyName', label: '企业名称' },
  { key: 'vehicleModel', label: '车辆型号' },
  { key: 'quantity', label: '申报数量' },
  { key: 'amount', label: '涉及金额' },
  { key: 'exchangeDate', label: '交换日期' },
  { key: 'cumulativeTotal', label: '累计总量' }
]

// 事件处理函数
const handleSearch = async () => {
  loading.value = true
  hasSearched.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟数据
    const mockData: TaxDeclarationItem[] = [
      {
        id: 'TD001',
        declarationType: '减免购置税',
        vehicleType: '乘用车',
        companyName: '比亚迪股份有限公司',
        vehicleModel: '汉EV',
        quantity: 8520,
        amount: 12500,
        exchangeDate: '2023-12-15',
        cumulativeTotal: 125000
      },
      {
        id: 'TD002',
        declarationType: '新车船税',
        vehicleType: '客车',
        companyName: '宇通客车股份有限公司',
        vehicleModel: 'ZK6128HQB9',
        quantity: 450,
        amount: 2800,
        exchangeDate: '2023-12-10',
        cumulativeTotal: 15600
      }
    ]

    tableData.value = mockData
    total.value = 50

    // 更新统计数据
    stats.totalDeclarations = mockData.reduce((sum, item) => sum + item.quantity, 0)
    stats.totalAmount = mockData.reduce((sum, item) => sum + (item.amount || 0), 0)
    stats.totalCompanies = new Set(mockData.map(item => item.companyName)).size
    stats.timeRange = '2023年全年'

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
    searchForm[key as keyof typeof searchForm] = key === 'timeRange' ? undefined : ''
  })
  pagination.page = 1
  tableData.value = []
  hasSearched.value = false
}

const handleQuickQuery = () => {
  showQuickQuery.value = !showQuickQuery.value
}

const handleQuickSearch = (type: string) => {
  ElMessage.info(`执行快捷查询: ${type}`)
  // 根据类型设置不同的查询条件
  handleSearch()
}

const handleTimeRangeChange = (value: any) => {
  // 时间范围变化处理
}

const handleSortChange = ({ prop, order }: any) => {
  // 排序变化处理
}

const handleSelectionChange = (selection: TaxDeclarationItem[]) => {
  selectedRows.value = selection
}

const handleViewDetail = (row: TaxDeclarationItem) => {
  ElMessage.info(`查看 ${row.companyName} 的详细申报信息`)
}

const handleExportSingle = (row: TaxDeclarationItem) => {
  ElMessage.success(`导出 ${row.companyName} 的申报信息`)
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

// 计算属性和工具函数
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

const formatCurrency = (amount: number | undefined) => {
  if (!amount) return '-'
  return amount.toLocaleString()
}

const getDeclarationTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    '减免购置税': 'success',
    '新车船税': 'primary',
    '商务部交换数据': 'warning',
    '出口退税': 'info'
  }
  return tagMap[type] || 'default'
}

// 生命周期
onMounted(() => {
  // 初始化页面
})
</script>

<style scoped>
.tax-declaration {
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

.search-card,
.quick-query-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.search-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.quick-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
  font-size: 30px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 16px;
  color: #606266;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.quantity-value {
  font-weight: 600;
  color: #409eff;
}

.amount-value {
  font-weight: 600;
  color: #67c23a;
}

.cumulative-value {
  font-weight: 600;
  color: #e6a23c;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px 0;
}

.chart-container {
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
}
</style>
