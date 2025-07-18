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
        <el-button type="primary" @click="handleExport" :disabled="!hasSearched">
          <el-icon>
            <Download />
          </el-icon>
          导出数据
        </el-button>
        <el-button @click="handleReset">
          <el-icon>
            <Refresh />
          </el-icon>
          重置所有
        </el-button>
      </div>
    </div>

    <!-- 三个主要组件 -->
    <div class="main-content">
      <!-- 查询条件设置组件 -->
      <certificate-search-conditions @add-condition="handleAddCondition" @reset="handleResetConditions" />

      <!-- 已选条件显示组件 -->
      <certificate-selected-conditions :selected-conditions="selectedConditions"
        @remove-condition="handleRemoveCondition" @clear-all="handleClearAllConditions" @search="handleSearch"
        @reset="handleResetAll" />

      <!-- 查询结果表格组件 -->
      <certificate-result-table :data="tableData" :loading="loading" :search-conditions="selectedConditions"
        @export="handleExportData" @view-detail="handleViewDetail" @sort-change="handleSortChange" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'

// 导入新的组件
import CertificateSearchConditions from '../components/CertificateSearchConditions.vue'
import CertificateSelectedConditions from '../components/CertificateSelectedConditions.vue'
import CertificateResultTable from '../components/CertificateResultTable.vue'

// 响应式数据
const loading = ref(false)
const hasSearched = ref(false)
const selectedConditions = ref<any[]>([])
const tableData = ref<any[]>([])

// 事件处理函数
const handleAddCondition = (condition: any) => {
  selectedConditions.value.push(condition)
  console.log('添加查询条件:', condition)
  ElMessage.success('查询条件已添加')
}

const handleRemoveCondition = (index: number) => {
  selectedConditions.value.splice(index, 1)
  console.log('移除查询条件:', index)
}

const handleClearAllConditions = () => {
  selectedConditions.value = []
  tableData.value = []
  hasSearched.value = false
  console.log('清空所有查询条件')
}

const handleResetConditions = () => {
  console.log('重置条件表单')
}

const handleResetAll = () => {
  selectedConditions.value = []
  tableData.value = []
  hasSearched.value = false
  console.log('重置所有')
}

const handleSearch = async (conditions: any[]) => {
  if (conditions.length === 0) {
    ElMessage.warning('请至少添加一个查询条件')
    return
  }

  loading.value = true
  hasSearched.value = true

  try {
    console.log('开始查询，查询条件:', conditions)

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 根据查询条件生成模拟数据
    const mockData = generateMockData(conditions)

    tableData.value = mockData
    ElMessage.success(`查询完成，共找到 ${mockData.length} 条记录`)
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败，请重试')
  } finally {
    loading.value = false
  }
}

// 生成模拟数据的函数
const generateMockData = (conditions: any[]) => {
  const baseData = [
    {
      companyId: 'C001',
      companyName: '一汽集团有限公司',
      vehicleBrand: '红旗',
      vehicleModel: 'H9',
      vehicleCategory: '乘用车',
      certificateCount: 15680,
      currentPeriodCount: 15680,
      previousPeriodCount: 12000,
      comparisonRatio: 0.307,
      ranking: 1,
      timePeriod: '2024年',
      productionLocation: '长春市',
      fuelType: '汽油',
      newEnergyCategory: ''
    },
    {
      companyId: 'C002',
      companyName: '比亚迪股份有限公司',
      vehicleBrand: '比亚迪',
      vehicleModel: '汉EV',
      vehicleCategory: '乘用车',
      certificateCount: 12450,
      currentPeriodCount: 12450,
      previousPeriodCount: 8000,
      comparisonRatio: 0.556,
      ranking: 2,
      timePeriod: '2024年',
      productionLocation: '深圳市',
      fuelType: '电',
      newEnergyCategory: '纯电动'
    },
    {
      companyId: 'C003',
      companyName: '上汽集团股份有限公司',
      vehicleBrand: '荣威',
      vehicleModel: 'RX5',
      vehicleCategory: '乘用车',
      certificateCount: 9800,
      currentPeriodCount: 9800,
      previousPeriodCount: 11000,
      comparisonRatio: -0.109,
      ranking: 3,
      timePeriod: '2024年',
      productionLocation: '上海市',
      fuelType: '汽油',
      newEnergyCategory: ''
    }
  ]

  // 根据条件过滤和调整数据
  let filteredData = [...baseData]

  // 检查是否启用排行功能
  const hasRankingEnabled = conditions.some(c => c.showRanking)

  // 根据查询条件过滤数据
  conditions.forEach(condition => {
    // 企业过滤
    if (condition.companies && condition.companies.length > 0) {
      const companyNames = condition.companies.map((c: any) => c.name)
      filteredData = filteredData.filter(item =>
        companyNames.some((name: string) => item.companyName.includes(name))
      )
    }

    // 车辆品牌过滤
    if (condition.vehicleBrands && condition.vehicleBrands.length > 0) {
      filteredData = filteredData.filter(item =>
        condition.vehicleBrands.includes(item.vehicleBrand)
      )
    }

    // 车辆型号过滤
    if (condition.vehicleModels && condition.vehicleModels.length > 0) {
      filteredData = filteredData.filter(item =>
        condition.vehicleModels.includes(item.vehicleModel)
      )
    }

    // 燃料种类过滤
    if (condition.fuelTypes && condition.fuelTypes.length > 0) {
      filteredData = filteredData.filter(item =>
        condition.fuelTypes.includes(item.fuelType)
      )
    }

    // 新能源类别过滤
    if (condition.newEnergyCategories && condition.newEnergyCategories.length > 0) {
      filteredData = filteredData.filter(item =>
        condition.newEnergyCategories.includes(item.newEnergyCategory) ||
        (item.newEnergyCategory === '' && condition.newEnergyCategories.includes('非新能源'))
      )
    }
  })

  // 重新计算排名（如果启用了排行功能）
  if (hasRankingEnabled) {
    filteredData = filteredData
      .sort((a, b) => b.certificateCount - a.certificateCount) // 按合格证数量降序排列
      .map((item, index) => ({
        ...item,
        ranking: index + 1
      }))
  } else {
    // 如果未启用排行，移除ranking字段或设为0
    filteredData = filteredData.map(item => ({
      ...item,
      ranking: 0
    }))
  }

  return filteredData
}

const handleReset = () => {
  selectedConditions.value = []
  tableData.value = []
  hasSearched.value = false
  ElMessage.success('已重置所有条件')
}

const handleExport = () => {
  if (!hasSearched.value || tableData.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  // 这里应该调用实际的导出功能
  console.log('导出数据:', tableData.value)
  ElMessage.success('数据导出成功')
}

const handleExportData = (data: any[]) => {
  console.log('导出选中数据:', data)
  ElMessage.success('数据导出成功')
}

const handleViewDetail = (row: any) => {
  console.log('查看详情:', row)
  ElMessage.info(`查看 ${row.companyName} 的详细信息`)
}

const handleSortChange = (sortInfo: { prop: string; order: string }) => {
  console.log('排序变化:', sortInfo)
  // 这里可以重新排序数据或重新查询
}

// 生命周期
onMounted(() => {
  console.log('合格证总量查询页面已加载')
})
</script>

<style scoped>
.certificate-quantity {
  padding: 20px;
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

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

  .main-content {
    gap: 15px;
  }
}
</style>
