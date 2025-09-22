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

      <el-form :model="searchForm" :inline="true" label-width="140px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="产品号(CPH)">
              <el-input v-model="searchForm.CPH" placeholder="请输入产品号" clearable />
              <help-tooltip content="输入合格证产品号进行查询" placement="top" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="配置序列号(VIN)">
              <el-input v-model="searchForm.LSPZXLH" placeholder="请输入配置序列号" clearable />
              <help-tooltip content="输入车辆配置序列号(VIN码)" placement="top" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="制造企业名称">
              <el-input v-model="searchForm.CLZZQYMC" placeholder="请输入企业名称" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="车辆型号">
              <el-input v-model="searchForm.CLXH" placeholder="请输入车辆型号" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="车辆类别">
              <el-select v-model="searchForm.CLZT" placeholder="请选择车辆类别" clearable filterable>
                <el-option label="汽车" value="汽车" />
                <el-option label="改装车" value="改装车" />
                <el-option label="新能源汽车" value="新能源汽车" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="上传时间">
              <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="至"
                start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="车辆品牌">
              <el-input v-model="searchForm.CLPP" placeholder="请输入车辆品牌" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="燃料种类">
              <el-select v-model="searchForm.RLZL" placeholder="请选择燃料种类" clearable filterable>
                <el-option label="汽油" value="汽油" />
                <el-option label="柴油" value="柴油" />
                <el-option label="天然气" value="天然气" />
                <el-option label="纯电动" value="纯电动" />
                <el-option label="插电混动" value="插电混动" />
                <el-option label="燃料电池" value="燃料电池" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="新能源标记">
              <el-select v-model="searchForm.XNYBJ" placeholder="请选择新能源标记" clearable>
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="省份">
              <el-input v-model="searchForm.SF" placeholder="请输入省份" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="城市">
              <el-input v-model="searchForm.CS" placeholder="请输入城市" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="六大类">
              <el-input v-model="searchForm.G50" placeholder="请输入六大类" clearable />
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
              <el-button type="success" @click="showBatchDialog = true">
                <el-icon>
                  <Upload />
                </el-icon>
                批量查询
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 批量查询对话框 -->
    <BatchQueryDialog
      v-model="showBatchDialog"
      title="批量查询合格证信息"
      :query-types="batchQueryTypes"
      placeholder="请输入查询条件，每行一个（支持产品号或配置序列号）"
      :max-queries="100"
      :support-file-upload="true"
      :loading="batchLoading"
      @confirm="handleBatchSearch"
      @download-template="handleDownloadTemplate"
      @file-upload="handleBatchFileUpload"
    />

  
    <!-- 字段选择区域 -->
    <DisplayFields
      field-type="certificate"
      :initial-fields="selectedFields"
      @fields-change="handleFieldsChange"
    />

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
              <span v-if="field.key === 'XNYBJ'">
                <el-tag
                  :type="scope.row.XNYBJ === '是' ? 'success' : 'info'"
                >
                  {{ scope.row.XNYBJ || '-' }}
                </el-tag>
              </span>
              <span v-else>
                {{ scope.row[field.key] || '-' }}
              </span>
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
import DisplayFields from '../components/DisplayFields.vue'
import BatchQueryDialog from '../components/BatchQueryDialog.vue'

// 导入帮助模板
import { helpTemplates } from '../utils/helpTemplates'

// 导入类型定义

// 响应式数据
const loading = ref(false)
const hasSearched = ref(false)
const viewMode = ref<'table' | 'detail'>('table')
const selectedRows = ref<any[]>([])
const selectedCertificate = ref<any | null>(null)
const selectedFields = ref<string[]>([
  'QYDM',
  'CLZT',
  'CLZZQYMC',
  'CLXH',
  'CLPP',
  'CLMC',
  'SL',
  'SCDZ'
])

// 搜索表单
// 搜索表单
const searchForm = reactive({
  CPH: '',
  LSPZXLH: '',
  CLZZQYMC: '',
  CLXH: '',
  CLZT: '',
  CLPP: '',
  RLZL: '',
  XNYBJ: '',
  SF: '',
  CS: '',
  G50: '',
  timeRange: undefined,
  page: 1,
  pageSize: 20,
  field: undefined as string | undefined,
  order: undefined as "asc" | "desc" | undefined
})

// 批量查询配置
const batchQueryTypes = [
  { value: 'CPH', label: '按产品号查询' },
  { value: 'LSPZXLH', label: '按配置序列号查询' }
]

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 批量查询相关
const showBatchDialog = ref(false)
const batchLoading = ref(false)

// 表格数据
const tableData = ref<any[]>([])
const total = ref(0)

// 统计数据
// 计算属性：可见字段
const visibleFields = computed(() => {
  return allFields.value.filter(field => selectedFields.value.includes(field.key))
})

// 计算属性：导出字段
const exportFields = computed(() => {
  return allFields.value
})

// 所有可用字段 - 与certificate字段保持一致
const allFields = ref([
  { key: 'QYDM', label: '合格证企业代码', required: true, sortable: true },
  { key: 'CLZT', label: '车辆类别', required: true, sortable: true },
  { key: 'CLZZQYMC', label: '车辆制造企业名称', required: true, sortable: true },
  { key: 'CLXH', label: '车辆型号', required: true, sortable: true },
  { key: 'CLLX', label: '车辆类型', sortable: true },
  { key: 'CLPP', label: '车辆品牌', required: true, sortable: true },
  { key: 'CLMC', label: '车辆名称', required: true, sortable: true },
  { key: 'RLZL', label: '燃料种类', sortable: true },
  { key: 'PL', label: '排量', sortable: true },
  { key: 'C', label: '长', sortable: true },
  { key: 'ZZL', label: '总质量', sortable: true },
  { key: 'ZBZL', label: '整备质量', sortable: true },
  { key: 'ZJ', label: '轴距', sortable: true },
  { key: 'UPD', label: '上传时间', sortable: true },
  { key: 'SL', label: '数量', required: true, sortable: true },
  { key: 'SCDZ', label: '生产地址', sortable: true },
  { key: 'LSPZXLH', label: '配置序列号', sortable: true },
  { key: 'CONFIG_SEQUENCE_NUM', label: '配置序列号', sortable: true },
  { key: 'POINTS_CONF_ID', label: '双积分ID', sortable: true },
  { key: 'CPH', label: '产品号', required: true, sortable: true },
  { key: 'SF', label: '省份', sortable: true },
  { key: 'CS', label: '城市', sortable: true },
  { key: 'QX', label: '区县', sortable: true },
  { key: 'G50', label: '六大类', sortable: true },
  { key: 'XNYBJ', label: '新能源标记', sortable: true },
  { key: 'XNYLB', label: '新能源类别', sortable: true },
  { key: 'QYID', label: '公告企业ID', sortable: true },
  { key: 'GXSJ', label: '更新时间', sortable: true },
  { key: 'JT', label: '集团', sortable: true },
  { key: 'UPY', label: '上传年', sortable: true },
  { key: 'UPM', label: '上传月', sortable: true }
])



// 查询方法
const handleSearch = async () => {
  loading.value = true
  hasSearched.value = true
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    // 这里应该调用实际的API
    // const response = await certificateDetailApi.search(params)

    // 模拟API响应
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟数据 - 使用hgz表字段结构
    const mockData = [
      {
        QYDM: 'QYDM001',
        CLZT: '汽车',
        CLZZQYMC: '一汽集团有限公司',
        CLXH: 'CA7230AE3',
        CLLX: '轿车',
        CLPP: '红旗',
        CLMC: '红旗H5',
        RLZL: '汽油',
        PL: '2000',
        C: '4975',
        ZZL: '2350',
        ZBZL: '1850',
        ZJ: '2935',
        UPD: '2023-06-20 10:30:00',
        SL: 1,
        SCDZ: '吉林省长春市',
        LSPZXLH: 'LGWEF4A57MA123456',
        CONFIG_SEQUENCE_NUM: 'SEQ001',
        POINTS_CONF_ID: 'P001',
        CPH: 'CPH001',
        SF: '吉林省',
        CS: '长春市',
        QX: '朝阳区',
        G50: 'M1',
        XNYBJ: '否',
        XNYLB: '',
        QYID: 'QY001',
        GXSJ: '2023-06-20 15:45:00',
        JT: '一汽集团',
        UPY: '2023',
        UPM: '06'
      }
    ]

    tableData.value = mockData
    total.value = mockData.length
    ElMessage.success('查询完成')
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
    CPH: '',
    LSPZXLH: '',
    CLZZQYMC: '',
    CLXH: '',
    CLZT: '',
    CLPP: '',
    RLZL: '',
    XNYBJ: '',
    SF: '',
    CS: '',
    G50: '',
    timeRange: undefined,
    page: 1,
    pageSize: 20,
    field: 'UPD',
    order: 'desc'
  })
  pagination.page = 1
  pagination.pageSize = 20
  total.value = 0
  tableData.value = []
  hasSearched.value = false
}


const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

const handleRowClick = (row: any) => {
  selectedCertificate.value = row
  viewMode.value = 'detail'
}

const handleViewDetail = (row: any) => {
  selectedCertificate.value = row
  viewMode.value = 'detail'
}

const handleExportSingle = (row: any) => {
  ElMessage.success(`导出 ${row.CPH} 的详细信息`)
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

// 批量查询处理
const handleBatchSearch = async (data: { queries: string[]; query_type: string }) => {
  batchLoading.value = true

  try {
    const params = {
      queries: data.queries,
      query_type: data.query_type
    }

    // 这里应该调用实际的API
    // const response = await certificateDetailApi.batchSearch(params)

    // 模拟API响应
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 模拟数据 - 使用hgz表字段结构
    const mockData = data.queries.map((query, index) => ({
      QYDM: `QYDM${String(index + 1).padStart(3, '0')}`,
      CLZT: '汽车',
      CLZZQYMC: `测试企业${index + 1}`,
      CLXH: 'TEST001',
      CLLX: '轿车',
      CLPP: '测试品牌',
      CLMC: '测试车型',
      RLZL: '汽油',
      PL: '2000',
      C: '4500',
      ZZL: '2000',
      ZBZL: '1500',
      ZJ: '2700',
      UPD: '2023-06-20 10:30:00',
      SL: 1,
      SCDZ: '测试地址',
      LSPZXLH: query,
      CONFIG_SEQUENCE_NUM: `SEQ${String(index + 1).padStart(3, '0')}`,
      POINTS_CONF_ID: `P${String(index + 1).padStart(3, '0')}`,
      CPH: `CPH${String(index + 1).padStart(3, '0')}`,
      SF: '测试省',
      CS: '测试市',
      QX: '测试区',
      G50: 'M1',
      XNYBJ: '否',
      XNYLB: '',
      QYID: `QY${String(index + 1).padStart(3, '0')}`,
      GXSJ: '2023-06-20 15:45:00',
      JT: '测试集团',
      UPY: '2023',
      UPM: '06'
    }))

    tableData.value = mockData
    total.value = mockData.length
    hasSearched.value = true
    showBatchDialog.value = false

    ElMessage.success(`批量查询完成，共找到 ${mockData.length} 条记录`)
  } catch (error) {
    console.error('批量查询失败:', error)
    ElMessage.error('批量查询失败，请重试')
  } finally {
    batchLoading.value = false
  }
}

const handleBatchFileUpload = () => {
  ElMessage.info('文件上传功能开发中...')
  return false
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

    // 这里应该调用实际的API
    // const blob = await certificateDetailApi.export(params)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 下载模板
const handleDownloadTemplate = async () => {
  try {
    // 这里应该调用实际的API
    // const blob = await certificateDetailApi.downloadTemplate()

    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败，请重试')
  }
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
    'QYDM': 120,
    'CLZT': 100,
    'CLZZQYMC': 200,
    'CLXH': 150,
    'CLLX': 120,
    'CLPP': 120,
    'CLMC': 150,
    'RLZL': 100,
    'PL': 80,
    'C': 60,
    'ZZL': 100,
    'ZBZL': 100,
    'ZJ': 80,
    'UPD': 160,
    'SL': 80,
    'SCDZ': 200,
    'LSPZXLH': 180,
    'CONFIG_SEQUENCE_NUM': 180,
    'POINTS_CONF_ID': 120,
    'CPH': 120,
    'SF': 80,
    'CS': 80,
    'QX': 80,
    'G50': 100,
    'XNYBJ': 100,
    'XNYLB': 100,
    'QYID': 120,
    'GXSJ': 160,
    'JT': 100,
    'UPY': 80,
    'UPM': 80
  }
  return widthMap[fieldKey] || 120
}

// 格式化数字
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

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
  font-size: 30px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 16px;
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
