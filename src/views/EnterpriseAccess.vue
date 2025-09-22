<template>
  <div class="enterprise-access">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>企业准入信息查询</h2>
        <p class="page-description">
          查询汽车生产企业的基本信息、资质情况、注册和生产地址等详细信息
        </p>
      </div>
      <div class="header-right">
        <export-button
          :data="tableData"
          :total-count="total"
          :fields="exportFields"
          default-filename="企业准入信息"
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
            content="支持按企业名称、类型、地区、资质等条件查询企业准入信息"
            title="企业准入查询帮助"
          />
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="企业名称">
              <el-input
                v-model="searchForm.companyName"
                placeholder="请输入企业名称"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="企业类型">
              <el-select
                v-model="searchForm.companyType"
                placeholder="请选择企业类型"
                clearable
              >
                <el-option label="整车企业" value="整车企业" />
                <el-option label="改装企业" value="改装企业" />
                <el-option label="新能源企业" value="新能源企业" />
                <el-option label="专用车企业" value="专用车企业" />
                <el-option label="挂车企业" value="挂车企业" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="企业类别">
              <el-select
                v-model="searchForm.enterpriseCategory"
                placeholder="请选择企业类别"
                clearable
              >
                <el-option label="乘用车" value="乘用车" />
                <el-option label="客车" value="客车" />
                <el-option label="货车" value="货车" />
                <el-option label="专用车" value="专用车" />
                <el-option label="摩托车" value="摩托车" />
                <el-option label="挂车" value="挂车" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <region-selector
              v-model="searchForm.registeredRegion"
              label="注册地址"
              @change="handleRegisteredRegionChange"
            />
          </el-col>

          <el-col :span="8">
            <region-selector
              v-model="searchForm.productionRegion"
              label="生产地址"
              @change="handleProductionRegionChange"
            />
          </el-col>

          <el-col :span="8">
            <el-form-item label="资质类型">
              <el-select
                v-model="searchForm.qualification"
                placeholder="请选择资质类型"
                clearable
              >
                <el-option label="整车目录" value="整车目录" />
                <el-option label="改装目录" value="改装目录" />
                <el-option label="新能源准入" value="新能源准入" />
                <el-option label="出口资质" value="出口资质" />
              </el-select>
            </el-form-item>
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
        <el-button @click="handleQuickSearch('latest-vehicle')">最新整车企业列表</el-button>
        <el-button @click="handleQuickSearch('latest-newenergy')">最新新能源企业列表</el-button>
        <el-button @click="handleQuickSearch('address-info')">最新企业地址信息</el-button>
        <el-button @click="handleQuickSearch('hebei-trailer')">河北省挂车资质企业</el-button>
      </div>
    </el-card>

    <!-- 结果展示区域 -->
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <div class="result-actions">
            <el-button-group>
              <el-button
                :type="viewMode === 'list' ? 'primary' : 'default'"
                @click="viewMode = 'list'"
              >
                <el-icon><List /></el-icon>
                列表视图
              </el-button>
              <el-button
                :type="viewMode === 'card' ? 'primary' : 'default'"
                @click="viewMode = 'card'"
              >
                <el-icon><Grid /></el-icon>
                卡片视图
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 列表视图 -->
      <div v-show="viewMode === 'list'">
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
            min-width="250"
            show-overflow-tooltip
          />
          
          <el-table-column
            prop="companyCode"
            label="企业代码"
            width="180"
            show-overflow-tooltip
          />
          
          <el-table-column
            prop="enterpriseType"
            label="企业类型"
            width="120"
            align="center"
          />
          
          <el-table-column
            prop="enterpriseCategory"
            label="企业类别"
            width="120"
            align="center"
          />
          
          <el-table-column
            prop="registeredAddress"
            label="注册地址"
            min-width="200"
            show-overflow-tooltip
          />
          
          <el-table-column
            prop="productionAddress"
            label="生产地址"
            min-width="200"
            show-overflow-tooltip
          />
          
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleViewDetail(row)">
                查看详情
              </el-button>
              <el-button type="success" link @click="handleViewQualification(row)">
                查看资质
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
      </div>

      <!-- 卡片视图 -->
      <div v-show="viewMode === 'card'" class="card-view">
        <el-row :gutter="20">
          <el-col :span="8" v-for="item in tableData" :key="item.companyId">
            <el-card class="enterprise-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="company-name">{{ item.companyName }}</span>
                  <el-tag :type="getEnterpriseTypeTag(item.enterpriseType)" size="small">
                    {{ item.enterpriseType }}
                  </el-tag>
                </div>
              </template>
              
              <div class="card-content">
                <p><strong>企业代码：</strong>{{ item.companyCode }}</p>
                <p><strong>企业类别：</strong>{{ item.enterpriseCategory }}</p>
                <p><strong>注册地址：</strong>{{ item.registeredAddress }}</p>
                <p><strong>生产地址：</strong>{{ item.productionAddress }}</p>
              </div>
              
              <template #footer>
                <div class="card-actions">
                  <el-button type="primary" size="small" @click="handleViewDetail(item)">
                    查看详情
                  </el-button>
                  <el-button type="success" size="small" @click="handleViewQualification(item)">
                    查看资质
                  </el-button>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 企业详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`${selectedEnterprise?.companyName} - 企业详情`"
      width="70%"
      @close="closeDetailDialog"
    >
      <div v-if="selectedEnterprise" class="enterprise-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="企业名称">{{ selectedEnterprise.companyName }}</el-descriptions-item>
          <el-descriptions-item label="企业简称">{{ selectedEnterprise.companyShortName }}</el-descriptions-item>
          <el-descriptions-item label="企业代码">{{ selectedEnterprise.companyCode }}</el-descriptions-item>
          <el-descriptions-item label="目录序号">{{ selectedEnterprise.catalogueNumber }}</el-descriptions-item>
          <el-descriptions-item label="企业类型">{{ selectedEnterprise.enterpriseType }}</el-descriptions-item>
          <el-descriptions-item label="企业类别">{{ selectedEnterprise.enterpriseCategory }}</el-descriptions-item>
          <el-descriptions-item label="注册地址" :span="2">{{ selectedEnterprise.registeredAddress }}</el-descriptions-item>
          <el-descriptions-item label="生产地址" :span="2">{{ selectedEnterprise.productionAddress }}</el-descriptions-item>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, List, Grid } from '@element-plus/icons-vue'

// 导入通用组件
import RegionSelector from '../components/RegionSelector.vue'
import ExportButton from '../components/ExportButton.vue'
import HelpTooltip from '../components/HelpTooltip.vue'

// 导入类型定义
import type { EnterpriseAccessParams, EnterpriseAccessItem } from '../types/api'

// 响应式数据
const loading = ref(false)
const viewMode = ref<'list' | 'card'>('list')
const showQuickQuery = ref(false)
const selectedRows = ref<EnterpriseAccessItem[]>([])
const showDetailDialog = ref(false)
const selectedEnterprise = ref<EnterpriseAccessItem | null>(null)

// 搜索表单
const searchForm = reactive<Partial<EnterpriseAccessParams>>({
  companyName: '',
  companyType: '',
  enterpriseCategory: '',
  registeredRegion: undefined,
  productionRegion: undefined,
  qualification: ''
})

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 表格数据
const tableData = ref<EnterpriseAccessItem[]>([])
const total = ref(0)

// 导出字段配置
const exportFields = [
  { key: 'companyName', label: '企业名称', required: true },
  { key: 'companyCode', label: '企业代码', required: true },
  { key: 'enterpriseType', label: '企业类型' },
  { key: 'enterpriseCategory', label: '企业类别' },
  { key: 'registeredAddress', label: '注册地址' },
  { key: 'productionAddress', label: '生产地址' }
]

// 事件处理函数
const handleSearch = async () => {
  loading.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    const mockData: EnterpriseAccessItem[] = [
      {
        companyId: 'E001',
        companyName: '一汽集团有限公司',
        companyShortName: '一汽集团',
        companyCode: '91220000124000001X',
        catalogueNumber: 'C001',
        enterpriseType: '整车企业',
        enterpriseCategory: '乘用车',
        registeredAddress: '吉林省长春市朝阳区东风大街2259号',
        productionAddress: '吉林省长春市朝阳区东风大街2259号',
        productionAddressName: '长春生产基地'
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
    searchForm[key as keyof typeof searchForm] = key.includes('Region') ? undefined : ''
  })
  pagination.page = 1
  tableData.value = []
}

const handleQuickQuery = () => {
  showQuickQuery.value = !showQuickQuery.value
}

const handleQuickSearch = (type: string) => {
  ElMessage.info(`执行快捷查询: ${type}`)
  // 根据类型设置不同的查询条件
  handleSearch()
}

const handleRegisteredRegionChange = (value: any) => {
  // 注册地址变化处理
}

const handleProductionRegionChange = (value: any) => {
  // 生产地址变化处理
}

const handleSortChange = ({ prop, order }: any) => {
  // 排序变化处理
}

const handleSelectionChange = (selection: EnterpriseAccessItem[]) => {
  selectedRows.value = selection
}

const handleViewDetail = (row: EnterpriseAccessItem) => {
  selectedEnterprise.value = row
  showDetailDialog.value = true
}

const handleViewQualification = (row: EnterpriseAccessItem) => {
  ElMessage.info(`查看 ${row.companyName} 的资质信息`)
}

const handleExportSingle = (row: EnterpriseAccessItem) => {
  ElMessage.success(`导出 ${row.companyName} 的详细信息`)
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
  selectedEnterprise.value = null
}

const handleExportDetail = () => {
  ElMessage.success('导出企业详情成功')
}

const getEnterpriseTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    '整车企业': 'primary',
    '改装企业': 'success',
    '新能源企业': 'warning',
    '专用车企业': 'info',
    '挂车企业': 'danger'
  }
  return tagMap[type] || 'default'
}

// 生命周期
onMounted(() => {
  // 初始化页面
})
</script>

<style scoped>
.enterprise-access {
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

.card-view {
  min-height: 500px;
}

.enterprise-card {
  margin-bottom: 20px;
  height: 280px;
}

.enterprise-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.company-name {
  font-weight: 600;
  font-size: 18px;
}

.card-content p {
  margin: 8px 0;
  font-size: 16px;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.enterprise-detail {
  padding: 20px 0;
}
</style>
