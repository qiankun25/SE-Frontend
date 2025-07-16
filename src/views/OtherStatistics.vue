<template>
  <div class="other-statistics">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>其他统计</h2>
        <p class="page-description">
          提供公告信息公开网站访问量监测、各系统办件数量统计等其他常见统计功能
        </p>
      </div>
      <div class="header-right">
        <export-button
          :data="tableData"
          :total-count="total"
          :fields="exportFields"
          default-filename="其他统计信息"
          @export="handleExport"
          @download-template="handleDownloadTemplate"
        />
      </div>
    </div>

    <!-- 查询条件区域 -->
    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
          <help-tooltip
            content="支持按统计类型、时间范围等条件查询各类统计信息"
            title="其他统计查询帮助"
          />
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="统计类型">
              <el-select
                v-model="searchForm.statisticsType"
                placeholder="请选择统计类型"
                clearable
              >
                <el-option label="网站访问量" value="网站访问量" />
                <el-option label="系统办件数量" value="系统办件数量" />
                <el-option label="用户活跃度" value="用户活跃度" />
                <el-option label="数据下载量" value="数据下载量" />
                <el-option label="API调用统计" value="API调用统计" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <time-range-picker
              v-model="searchForm.timeRange"
              label="统计时间"
              @change="handleTimeRangeChange"
            />
          </el-col>

          <el-col :span="4">
            <div class="search-actions">
              <el-button type="primary" @click="handleSearch" :loading="loading">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 统计卡片区域 -->
    <el-row :gutter="20" class="stats-cards" v-if="hasSearched">
      <el-col :span="6" v-for="card in statsCards" :key="card.type">
        <el-card class="stats-card" shadow="hover" @click="handleCardClick(card)">
          <div class="stats-item">
            <div class="stats-icon">
              <el-icon :size="40" :color="card.color">
                <component :is="card.icon" />
              </el-icon>
            </div>
            <div class="stats-content">
              <div class="stats-value">{{ formatNumber(card.value) }}</div>
              <div class="stats-label">{{ card.label }}</div>
              <div class="stats-change" :class="card.changeType">
                <el-icon>
                  <component :is="card.changeType === 'increase' ? 'TrendCharts' : 'Bottom'" />
                </el-icon>
                {{ card.change }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 结果展示区域 -->
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>统计详情</span>
          <div class="result-actions">
            <el-button-group>
              <el-button
                :type="viewMode === 'table' ? 'primary' : 'default'"
                @click="viewMode = 'table'"
              >
                <el-icon><Grid /></el-icon>
                表格视图
              </el-button>
              <el-button
                :type="viewMode === 'chart' ? 'primary' : 'default'"
                @click="viewMode = 'chart'"
              >
                <el-icon><TrendCharts /></el-icon>
                图表视图
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 表格视图 -->
      <div v-show="viewMode === 'table'">
        <el-table
          :data="tableData"
          v-loading="loading"
          stripe
          border
          height="400"
          @sort-change="handleSortChange"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column type="index" label="序号" width="60" />
          
          <el-table-column
            prop="statisticsType"
            label="统计类型"
            width="150"
            align="center"
          >
            <template #default="{ row }">
              <el-tag :type="getStatisticsTypeTag(row.statisticsType)">
                {{ row.statisticsType }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column
            prop="title"
            label="统计项目"
            min-width="200"
            show-overflow-tooltip
          />
          
          <el-table-column
            prop="value"
            label="统计值"
            width="120"
            align="right"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="stats-value-cell">{{ formatNumber(row.value) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column
            prop="unit"
            label="单位"
            width="80"
            align="center"
          />
          
          <el-table-column
            prop="description"
            label="说明"
            min-width="200"
            show-overflow-tooltip
          />
          
          <el-table-column
            prop="updateTime"
            label="更新时间"
            width="180"
            align="center"
          />
          
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
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <!-- 图表视图 -->
      <div v-show="viewMode === 'chart'" class="chart-container">
        <div class="chart-placeholder">
          <el-empty description="图表功能开发中..." />
        </div>
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`${selectedItem?.title} - 统计详情`"
      width="60%"
      @close="closeDetailDialog"
    >
      <div v-if="selectedItem" class="statistics-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="统计类型">{{ selectedItem.statisticsType }}</el-descriptions-item>
          <el-descriptions-item label="统计项目">{{ selectedItem.title }}</el-descriptions-item>
          <el-descriptions-item label="统计值">{{ formatNumber(selectedItem.value) }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ selectedItem.unit }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ selectedItem.updateTime }}</el-descriptions-item>
          <el-descriptions-item label="说明" :span="2">{{ selectedItem.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <el-button @click="closeDetailDialog">关闭</el-button>
        <el-button type="primary" @click="handleExportDetail">导出详情</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Search, 
  Refresh, 
  Grid, 
  TrendCharts, 
  Bottom,
  View,
  Document,
  User,
  Download,
  DataAnalysis
} from '@element-plus/icons-vue'

// 导入通用组件
import TimeRangePicker from '../components/common/TimeRangePicker.vue'
import ExportButton from '../components/common/ExportButton.vue'
import HelpTooltip from '../components/common/HelpTooltip.vue'

// 导入类型定义
import type { OtherStatisticsParams, OtherStatisticsItem } from '../types/api'

// 响应式数据
const loading = ref(false)
const hasSearched = ref(false)
const viewMode = ref<'table' | 'chart'>('table')
const selectedRows = ref<OtherStatisticsItem[]>([])
const showDetailDialog = ref(false)
const selectedItem = ref<OtherStatisticsItem | null>(null)

// 搜索表单
const searchForm = reactive<Partial<OtherStatisticsParams>>({
  statisticsType: '',
  timeRange: undefined
})

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 表格数据
const tableData = ref<OtherStatisticsItem[]>([])
const total = ref(0)

// 统计卡片数据
const statsCards = ref([
  {
    type: 'website',
    label: '网站访问量',
    value: 125680,
    unit: '次',
    change: '+12.5%',
    changeType: 'increase',
    icon: 'View',
    color: '#409eff'
  },
  {
    type: 'documents',
    label: '系统办件数量',
    value: 3420,
    unit: '件',
    change: '+8.3%',
    changeType: 'increase',
    icon: 'Document',
    color: '#67c23a'
  },
  {
    type: 'users',
    label: '活跃用户数',
    value: 1580,
    unit: '人',
    change: '+15.2%',
    changeType: 'increase',
    icon: 'User',
    color: '#e6a23c'
  },
  {
    type: 'downloads',
    label: '数据下载量',
    value: 8960,
    unit: '次',
    change: '-2.1%',
    changeType: 'decrease',
    icon: 'Download',
    color: '#f56c6c'
  }
])

// 导出字段配置
const exportFields = [
  { key: 'statisticsType', label: '统计类型', required: true },
  { key: 'title', label: '统计项目', required: true },
  { key: 'value', label: '统计值' },
  { key: 'unit', label: '单位' },
  { key: 'description', label: '说明' },
  { key: 'updateTime', label: '更新时间' }
]

// 事件处理函数
const handleSearch = async () => {
  loading.value = true
  hasSearched.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    const mockData: OtherStatisticsItem[] = [
      {
        id: 'OS001',
        statisticsType: '网站访问量',
        title: '公告信息公开网站日访问量',
        value: 12568,
        unit: '次',
        description: '包括PC端和移动端访问量统计',
        updateTime: '2023-12-15 10:30:00'
      },
      {
        id: 'OS002',
        statisticsType: '系统办件数量',
        title: '产品准入系统办件数量',
        value: 342,
        unit: '件',
        description: '包括新产品申请、变更扩展等办件',
        updateTime: '2023-12-15 09:45:00'
      },
      {
        id: 'OS003',
        statisticsType: '数据下载量',
        title: '合格证数据下载量',
        value: 896,
        unit: '次',
        description: '用户下载合格证相关数据的统计',
        updateTime: '2023-12-15 08:20:00'
      }
    ]
    
    tableData.value = mockData
    total.value = 50
    
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

const handleTimeRangeChange = (value: any) => {
  console.log('时间范围变化:', value)
}

const handleCardClick = (card: any) => {
  ElMessage.info(`查看 ${card.label} 的详细统计`)
}

const handleSortChange = ({ prop, order }: any) => {
  console.log('排序变化:', prop, order)
}

const handleSelectionChange = (selection: OtherStatisticsItem[]) => {
  selectedRows.value = selection
}

const handleViewDetail = (row: OtherStatisticsItem) => {
  selectedItem.value = row
  showDetailDialog.value = true
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
  console.log('导出配置:', config)
  ElMessage.success('导出成功')
}

const handleDownloadTemplate = () => {
  ElMessage.info('下载模板功能开发中...')
}

const closeDetailDialog = () => {
  showDetailDialog.value = false
  selectedItem.value = null
}

const handleExportDetail = () => {
  ElMessage.success('导出统计详情成功')
}

// 计算属性和工具函数
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

const getStatisticsTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    '网站访问量': 'primary',
    '系统办件数量': 'success',
    '用户活跃度': 'warning',
    '数据下载量': 'info',
    'API调用统计': 'danger'
  }
  return tagMap[type] || 'default'
}

// 生命周期
onMounted(() => {
  // 初始化页面，可以加载一些默认统计数据
  hasSearched.value = true
})
</script>

<style scoped>
.other-statistics {
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
  gap: 10px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stats-icon {
  margin-right: 15px;
}

.stats-content {
  flex: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stats-change {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stats-change.increase {
  color: #67c23a;
}

.stats-change.decrease {
  color: #f56c6c;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.stats-value-cell {
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
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
}

.statistics-detail {
  padding: 20px 0;
}
</style>
