<template>
  <div class="group-info">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>集团基本信息</h2>
        <p class="page-description">
          查询汽车集团的基本信息、组织架构、下属企业等详细信息
        </p>
      </div>
      <div class="header-right">
        <el-button type="primary" :loading="exportLoading" @click="handleExport">
          <el-icon>
            <Download />
          </el-icon>
          导出数据
        </el-button>
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

      <el-form :model="searchForm" :inline="true" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="集团名称">
              <el-input v-model="searchForm.group_name" placeholder="请输入集团名称" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="集团代码">
              <el-input v-model="searchForm.group_code" placeholder="请输入集团代码" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="所在地区">
              <el-input v-model="searchForm.region" placeholder="请输入省份或城市" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="企业性质">
              <el-select v-model="searchForm.enterprise_type" placeholder="请选择企业性质" clearable>
                <el-option v-for="option in enterpriseTypeOptions" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="新能源业务">
              <el-select v-model="searchForm.has_new_energy" placeholder="请选择" clearable>
                <el-option v-for="option in newEnergyOptions" :key="option.label" :label="option.label"
                  :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
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
          <span class="result-count">共 {{ total }} 条记录</span>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%" @sort-change="handleSortChange"
        :expand-row-keys="expandedRows" row-key="group_code" @expand-change="handleExpandChange">
        <!-- 展开列 -->
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <h4>{{ row.group_name }} - 下属企业列表</h4>
              <EnterpriseList :group-code="row.group_code" />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="group_name" label="集团名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="group_code" label="集团代码" width="150" />
        <el-table-column prop="main_region" label="主要地区" width="120" />
        <el-table-column prop="enterprise_count" label="下属企业数" width="120" sortable="custom" align="center" />
        <el-table-column label="分布省份" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            {{ formatProvinces(scope.row.provinces) }}
          </template>
        </el-table-column>
        <el-table-column prop="new_energy_count" label="新能源企业" width="120" align="center" />
        <el-table-column prop="joint_venture_count" label="合资企业" width="120" align="center" />
        <el-table-column label="新能源占比" width="120" align="center">
          <template #default="scope">
            {{ formatPercentage(scope.row.new_energy_ratio) }}
          </template>
        </el-table-column>
        <el-table-column label="合资占比" width="120" align="center">
          <template #default="scope">
            {{ formatPercentage(scope.row.joint_venture_ratio) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">
              <el-icon>
                <View />
              </el-icon>
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh, Search, View } from '@element-plus/icons-vue'
import { groupApi, exportUtils } from '../services/api'
import type { GroupInfo, GroupSearchParams } from '../types/api'
import EnterpriseList from '../components/EnterpriseList.vue'

// 响应式数据
const loading = ref(false)
const total = ref(0)
const tableData = ref<GroupInfo[]>([])
const exportLoading = ref(false)

// 搜索表单
const searchForm = reactive({
  group_name: '',
  group_code: '',
  region: '',
  enterprise_type: '',
  has_new_energy: undefined as boolean | undefined
})

// 分页配置
const pagination = reactive({
  page: 1,
  page_size: 20
})

// 排序配置
const sortConfig = reactive({
  field: 'enterprise_count',
  order: 'desc' as 'desc' | 'asc'
})

// 表格展开相关
const expandedRows = ref<string[]>([])

// 企业性质选项
const enterpriseTypeOptions = [
  { label: '全部', value: '' },
  { label: '自主', value: '自主' },
  { label: '合资', value: '合资' }
]

// 新能源选项
const newEnergyOptions = [
  { label: '全部', value: undefined },
  { label: '有新能源企业', value: true },
  { label: '无新能源企业', value: false }
]

// 查询方法
const handleSearch = async () => {
  loading.value = true
  try {
    const params: GroupSearchParams = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.page_size,
      field: sortConfig.field,
      order: sortConfig.order
    }

    const response = await groupApi.search(params)

    if (response.code === 200) {
      tableData.value = response.data.list
      total.value = response.data.total
      ElMessage.success(`查询完成，共找到 ${response.data.total} 个集团`)
    } else {
      ElMessage.error(response.message || '查询失败')
    }
  } catch (error) {
    console.error('查询集团信息失败:', error)
    ElMessage.error('查询失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 重置方法
const handleReset = () => {
  Object.assign(searchForm, {
    group_name: '',
    group_code: '',
    region: '',
    enterprise_type: '',
    has_new_energy: undefined
  })
  pagination.page = 1
  pagination.page_size = 20
  sortConfig.field = 'enterprise_count'
  sortConfig.order = 'desc'
  total.value = 0
  tableData.value = []
}

// 导出数据
const handleExport = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要导出当前查询条件下的所有集团信息吗？`,
      '确认导出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    exportLoading.value = true

    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.page_size,
      field: sortConfig.field,
      order: sortConfig.order,
      format: 'excel' as const,
      filename: '集团基本信息'
    }

    const blob = await groupApi.export(params)
    const filename = exportUtils.generateFilename('集团基本信息', 'xlsx')
    exportUtils.downloadFile(blob, filename)

    ElMessage.success('导出成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('导出失败:', error)
      ElMessage.error('导出失败，请稍后重试')
    }
  } finally {
    exportLoading.value = false
  }
}

// 查看详情
const handleView = async (row: GroupInfo) => {
  try {
    const response = await groupApi.getDetail(row.group_code)
    if (response.code === 200) {
      // 这里可以打开详情弹窗或跳转到详情页面
      ElMessage.success(`获取集团详情成功：${row.group_name}`)
      console.log('集团详情:', response.data)
    } else {
      ElMessage.error(response.message || '获取详情失败')
    }
  } catch (error) {
    console.error('获取集团详情失败:', error)
    ElMessage.error('获取详情失败，请稍后重试')
  }
}

// 表格排序处理
const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => {
  if (order) {
    sortConfig.field = prop
    sortConfig.order = order === 'ascending' ? 'asc' : 'desc'
    pagination.page = 1
    handleSearch()
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.page_size = size
  pagination.page = 1
  handleSearch()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  handleSearch()
}

// 格式化百分比
const formatPercentage = (value: number) => {
  return `${value}%`
}

// 格式化省份列表
const formatProvinces = (provinces: string[]) => {
  if (!provinces || provinces.length === 0) return '-'
  if (provinces.length <= 3) return provinces.join(', ')
  return `${provinces.slice(0, 3).join(', ')} 等${provinces.length}个省份`
}

// 表格展开处理
const handleExpandChange = (row: GroupInfo, expanded: boolean) => {
  if (expanded) {
    expandedRows.value.push(row.group_code)
  } else {
    const index = expandedRows.value.indexOf(row.group_code)
    if (index > -1) {
      expandedRows.value.splice(index, 1)
    }
  }
}

// 组件挂载时初始化数据
onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.group-info {
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
  font-size: 20px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
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
  font-size: 14px;
}

.search-actions {
  text-align: right;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.expand-content {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin: 10px 0;
}

.expand-content h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}
</style>
