<template>
  <div class="product-access">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>产品准入信息查询</h2>
        <p class="page-description">
          查询车型的基本信息、主要技术参数、备案参数等详细信息，支持按批次、参数关键词等条件筛选
        </p>
      </div>
      <div class="header-right">
        <export-button
          :data="tableData"
          :total-count="total"
          :fields="exportFields"
          default-filename="产品准入信息"
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
            content="支持按企业、车型、批次、参数关键词等多维度查询产品准入信息"
            title="产品准入查询帮助"
          />
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="企业选择">
              <el-input
                v-model="searchForm.companyName"
                placeholder="请输入企业名称"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="车辆型号">
              <el-input
                v-model="searchForm.vehicleModel"
                placeholder="请输入车辆型号"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="通用名称">
              <el-input
                v-model="searchForm.commonName"
                placeholder="请输入通用名称"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="批次号">
              <el-input
                v-model="searchForm.batchNumber"
                placeholder="如：第379批、380-390"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="参数关键词">
              <el-input
                v-model="searchForm.parameterKeyword"
                placeholder="如：颗粒捕集器、OTA、辅助驾驶"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <time-range-picker
              v-model="searchForm.timeRange"
              label="公告时间"
              @change="handleTimeRangeChange"
            />
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <div class="search-actions">
              <el-button type="primary" @click="handleSearch" :loading="loading">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon>
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

    <!-- 结果展示区域 -->
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <div class="result-actions">
            <el-button-group>
              <el-button
                :type="viewMode === 'basic' ? 'primary' : 'default'"
                @click="viewMode = 'basic'"
              >
                基本信息
              </el-button>
              <el-button
                :type="viewMode === 'technical' ? 'primary' : 'default'"
                @click="viewMode = 'technical'"
              >
                技术参数
              </el-button>
              <el-button
                :type="viewMode === 'filing' ? 'primary' : 'default'"
                @click="viewMode = 'filing'"
              >
                备案参数
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        height="500"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column
          prop="companyName"
          label="企业名称"
          min-width="200"
          show-overflow-tooltip
        />
        
        <el-table-column
          prop="vehicleModel"
          label="车辆型号"
          width="150"
          show-overflow-tooltip
        />
        
        <el-table-column
          prop="commonName"
          label="通用名称"
          width="150"
          show-overflow-tooltip
        />
        
        <el-table-column
          prop="batchNumber"
          label="批次号"
          width="100"
          align="center"
        />
        
        <el-table-column
          prop="certificateCount"
          label="合格证数量"
          width="120"
          align="right"
          sortable="custom"
        />
        
        <el-table-column
          prop="testingInstitution"
          label="检测机构"
          width="150"
          show-overflow-tooltip
        />
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button type="success" link @click="handleViewParameters(row)">
              查看参数
            </el-button>
            <el-button type="info" link @click="handleExportSingle(row)">
              导出
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
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`${selectedProduct?.vehicleModel} - 产品详情`"
      width="80%"
      @close="closeDetailDialog"
    >
      <div v-if="selectedProduct" class="product-detail">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <div class="detail-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="企业名称">{{ selectedProduct.companyName }}</el-descriptions-item>
                <el-descriptions-item label="车辆型号">{{ selectedProduct.vehicleModel }}</el-descriptions-item>
                <el-descriptions-item label="通用名称">{{ selectedProduct.commonName }}</el-descriptions-item>
                <el-descriptions-item label="批次号">{{ selectedProduct.batchNumber }}</el-descriptions-item>
                <el-descriptions-item label="入库编码">{{ selectedProduct.entryCode }}</el-descriptions-item>
                <el-descriptions-item label="CPNO">{{ selectedProduct.cpno }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="技术参数" name="technical">
            <div class="detail-content">
              <el-empty description="技术参数详情开发中..." />
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="备案参数" name="filing">
            <div class="detail-content">
              <el-empty description="备案参数详情开发中..." />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <template #footer>
        <el-button @click="closeDetailDialog">关闭</el-button>
        <el-button type="primary" @click="handleExportDetail">导出详情</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

// 导入通用组件
import TimeRangePicker from '../components/TimeRangePicker.vue'
import ExportButton from '../components/ExportButton.vue'
import HelpTooltip from '../components/HelpTooltip.vue'

// 导入类型定义
import type { ProductAccessParams, ProductAccessItem } from '../types/api'

// 响应式数据
const loading = ref(false)
const viewMode = ref<'basic' | 'technical' | 'filing'>('basic')
const selectedRows = ref<ProductAccessItem[]>([])
const showDetailDialog = ref(false)
const selectedProduct = ref<ProductAccessItem | null>(null)
const activeTab = ref('basic')

// 搜索表单
const searchForm = reactive<Partial<ProductAccessParams>>({
  companyName: '',
  vehicleModel: '',
  commonName: '',
  batchNumber: '',
  parameterKeyword: '',
  timeRange: undefined
})

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 表格数据
const tableData = ref<ProductAccessItem[]>([])
const total = ref(0)

// 导出字段配置
const exportFields = [
  { key: 'companyName', label: '企业名称', required: true },
  { key: 'vehicleModel', label: '车辆型号', required: true },
  { key: 'commonName', label: '通用名称' },
  { key: 'batchNumber', label: '批次号' },
  { key: 'certificateCount', label: '合格证数量' },
  { key: 'testingInstitution', label: '检测机构' },
  { key: 'entryCode', label: '入库编码' },
  { key: 'cpno', label: 'CPNO' }
]

// 事件处理函数
const handleSearch = async () => {
  loading.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    const mockData: ProductAccessItem[] = [
      {
        id: 'PA001',
        companyName: '一汽集团有限公司',
        vehicleModel: 'CA7230AE3',
        commonName: '红旗牌轿车',
        batchNumber: '第379批',
        basicInfo: {},
        technicalParams: {},
        filingParams: {},
        certificateCount: 1250,
        testingInstitution: '中汽研汽车检验中心',
        entryCode: 'RK2023001234',
        cpno: 'CP2023001234'
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
    searchForm[key as keyof typeof searchForm] = key === 'company' ? undefined : ''
  })
  pagination.page = 1
  tableData.value = []
}

const handleAdvancedSearch = () => {
  ElMessage.info('高级查询功能开发中...')
}

const handleCompanyChange = (value: any) => {
  // 企业选择变化处理
}

const handleTimeRangeChange = (value: any) => {
  // 时间范围变化处理
}

const handleSortChange = ({ prop, order }: any) => {
  // 排序变化处理
}

const handleSelectionChange = (selection: ProductAccessItem[]) => {
  selectedRows.value = selection
}

const handleViewDetail = (row: ProductAccessItem) => {
  selectedProduct.value = row
  showDetailDialog.value = true
}

const handleViewParameters = (row: ProductAccessItem) => {
  selectedProduct.value = row
  activeTab.value = 'technical'
  showDetailDialog.value = true
}

const handleExportSingle = (row: ProductAccessItem) => {
  ElMessage.success(`导出 ${row.vehicleModel} 的详细信息`)
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

const closeDetailDialog = () => {
  showDetailDialog.value = false
  selectedProduct.value = null
  activeTab.value = 'basic'
}

const handleExportDetail = () => {
  ElMessage.success('导出产品详情成功')
}

// 生命周期
onMounted(() => {
  // 初始化页面
})
</script>

<style scoped>
.product-access {
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
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
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

.product-detail {
  min-height: 400px;
}

.detail-content {
  padding: 20px 0;
}
</style>
