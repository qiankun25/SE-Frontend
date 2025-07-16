<template>
  <div class="certificate-quantity">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>合格证总量查询</h2>
        <p class="page-description">
          支持按企业、车型、时间等多维度统计合格证上传数量，提供排名统计和趋势分析
        </p>
      </div>
      <div class="header-right">
        <export-button :data="tableData" :total-count="total" :fields="exportFields" default-filename="合格证总量统计"
          @export="handleExport" @download-template="handleDownloadTemplate" />
      </div>
    </div>

    <!-- 查询条件区域 -->
    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
          <help-tooltip :content="helpTemplates.certificateQuantitySearch.content"
            :title="helpTemplates.certificateQuantitySearch.title"
            :examples="helpTemplates.certificateQuantitySearch.examples" />
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <company-selector v-model="searchForm.company" label="企业选择" :multiple="true" :allow-batch-import="true"
              @change="handleCompanyChange" />
          </el-col>

          <el-col :span="8">
            <el-form-item label="车辆品牌">
              <el-input v-model="searchForm.vehicleBrand" placeholder="请输入车辆品牌" clearable />
              <help-tooltip content="支持模糊搜索，如输入'奥迪'可搜索AUDI品牌" placement="top" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="车辆型号">
              <el-input v-model="searchForm.vehicleModel" placeholder="请输入车辆型号" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="车辆类别">
              <el-select v-model="searchForm.vehicleCategory" placeholder="请选择车辆类别" clearable>
                <el-option label="乘用车" value="乘用车" />
                <el-option label="客车" value="客车" />
                <el-option label="货车" value="货车" />
                <el-option label="专用车" value="专用车" />
                <el-option label="摩托车" value="摩托车" />
                <el-option label="挂车" value="挂车" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="燃料种类">
              <el-select v-model="searchForm.fuelType" placeholder="请选择燃料种类" clearable>
                <el-option label="汽油" value="汽油" />
                <el-option label="柴油" value="柴油" />
                <el-option label="纯电动" value="纯电动" />
                <el-option label="混合动力" value="混合动力" />
                <el-option label="插电式混合动力" value="插电式混合动力" />
                <el-option label="燃料电池" value="燃料电池" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="新能源类型">
              <el-select v-model="searchForm.newEnergyType" placeholder="请选择新能源类型" clearable>
                <el-option label="纯电动" value="纯电动" />
                <el-option label="插电式混合动力" value="插电式混合动力" />
                <el-option label="增程式" value="增程式" />
                <el-option label="燃料电池" value="燃料电池" />
                <el-option label="换电式" value="换电式" />
                <el-option label="非换电式" value="非换电式" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <time-range-picker v-model="searchForm.timeRange" label="时间范围" @change="handleTimeRangeChange" />
          </el-col>

          <el-col :span="12">
            <region-selector v-model="searchForm.region" label="地区选择" @change="handleRegionChange" />
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
              <el-button type="info" plain @click="handleAdvancedSearch">
                高级查询
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-row" v-if="hasSearched">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-item">
            <div class="stats-value">{{ formatNumber(stats.totalCertificates) }}</div>
            <div class="stats-label">合格证总数</div>
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
            <div class="stats-value">{{ formatNumber(stats.totalModels) }}</div>
            <div class="stats-label">涉及车型数</div>
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

          <el-table-column prop="companyName" label="企业名称" min-width="200" sortable="custom" show-overflow-tooltip />

          <el-table-column prop="vehicleBrand" label="车辆品牌" width="120" sortable="custom" />

          <el-table-column prop="vehicleModel" label="车辆型号" width="150" show-overflow-tooltip />

          <el-table-column prop="vehicleCategory" label="车辆类别" width="100" />

          <el-table-column prop="certificateCount" label="合格证数量" width="120" sortable="custom" align="right">
            <template #default="{ row }">
              <span class="certificate-count">{{ formatNumber(row.certificateCount) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="ranking" label="排名" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.ranking <= 3" :type="getRankingTagType(row.ranking)" size="small">
                第{{ row.ranking }}名
              </el-tag>
              <span v-else>第{{ row.ranking }}名</span>
            </template>
          </el-table-column>

          <el-table-column prop="uploadYear" label="上传年份" width="100" align="center" />

          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleViewDetail(row)">
                查看详情
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Grid, TrendCharts } from '@element-plus/icons-vue'

// 导入通用组件
import TimeRangePicker from '../components/common/TimeRangePicker.vue'
import RegionSelector from '../components/common/RegionSelector.vue'
import CompanySelector from '../components/common/CompanySelector.vue'
import ExportButton from '../components/common/ExportButton.vue'
import HelpTooltip from '../components/common/HelpTooltip.vue'

// 导入帮助模板
import { helpTemplates } from '../utils/helpTemplates'

// 导入类型定义
import type { CertificateQuantityParams, CertificateQuantityItem } from '../types/api'

// 响应式数据
const loading = ref(false)
const hasSearched = ref(false)
const viewMode = ref<'table' | 'chart'>('table')
const selectedRows = ref<CertificateQuantityItem[]>([])

// 搜索表单
const searchForm = reactive<Partial<CertificateQuantityParams>>({
  company: undefined,
  vehicleBrand: '',
  vehicleModel: '',
  vehicleCategory: '',
  fuelType: '',
  newEnergyType: '',
  timeRange: undefined,
  region: undefined
})

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 表格数据
const tableData = ref<CertificateQuantityItem[]>([])
const total = ref(0)

// 统计数据
const stats = reactive({
  totalCertificates: 0,
  totalCompanies: 0,
  totalModels: 0,
  timeRange: ''
})

// 导出字段配置
const exportFields = [
  { key: 'companyName', label: '企业名称', required: true },
  { key: 'vehicleBrand', label: '车辆品牌' },
  { key: 'vehicleModel', label: '车辆型号' },
  { key: 'vehicleCategory', label: '车辆类别' },
  { key: 'certificateCount', label: '合格证数量' },
  { key: 'ranking', label: '排名' },
  { key: 'uploadYear', label: '上传年份' }
]



// 计算属性
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

const getRankingTagType = (ranking: number) => {
  if (ranking === 1) return 'danger'
  if (ranking === 2) return 'warning'
  if (ranking === 3) return 'success'
  return 'info'
}

// 事件处理函数
const handleSearch = async () => {
  loading.value = true
  hasSearched.value = true

  try {
    // 构建查询参数
    const params: CertificateQuantityParams = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
      field: 'certificateCount',
      order: 'desc'
    }

    // 这里应该调用实际的API
    // const response = await certificateQuantityApi.search(params)

    // 模拟API响应
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟数据
    const mockData: CertificateQuantityItem[] = [
      {
        companyId: 'C001',
        companyName: '一汽集团有限公司',
        vehicleBrand: '红旗',
        vehicleModel: 'H9',
        vehicleCategory: '乘用车',
        certificateCount: 15680,
        ranking: 1,
        uploadYear: 2023
      },
      {
        companyId: 'C002',
        companyName: '比亚迪股份有限公司',
        vehicleBrand: '比亚迪',
        vehicleModel: '汉EV',
        vehicleCategory: '乘用车',
        certificateCount: 12450,
        ranking: 2,
        uploadYear: 2023
      }
    ]

    tableData.value = mockData
    total.value = 50

    // 更新统计数据
    stats.totalCertificates = mockData.reduce((sum, item) => sum + item.certificateCount, 0)
    stats.totalCompanies = new Set(mockData.map(item => item.companyId)).size
    stats.totalModels = mockData.length
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
    searchForm[key as keyof typeof searchForm] = key === 'company' ? undefined : ''
  })
  pagination.page = 1
  tableData.value = []
  hasSearched.value = false
}

const handleAdvancedSearch = () => {
  ElMessage.info('高级查询功能开发中...')
}

const handleCompanyChange = (value: any) => {
  console.log('企业选择变化:', value)
}

const handleTimeRangeChange = (value: any) => {
  console.log('时间范围变化:', value)
}

const handleRegionChange = (value: any) => {
  console.log('地区选择变化:', value)
}

const handleSortChange = ({ prop, order }: any) => {
  console.log('排序变化:', prop, order)
  // 重新查询数据
}

const handleSelectionChange = (selection: CertificateQuantityItem[]) => {
  selectedRows.value = selection
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

const handleViewDetail = (row: CertificateQuantityItem) => {
  ElMessage.info(`查看 ${row.companyName} 的详细信息`)
}

const handleExport = (config: any) => {
  console.log('导出配置:', config)
  ElMessage.success('导出成功')
}

const handleDownloadTemplate = () => {
  ElMessage.info('下载模板功能开发中...')
}

// 生命周期
onMounted(() => {
  // 初始化页面
})
</script>

<style scoped>
.certificate-quantity {
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

.certificate-count {
  font-weight: 600;
  color: #409eff;
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

  .stats-row .el-col {
    margin-bottom: 10px;
  }
}
</style>
