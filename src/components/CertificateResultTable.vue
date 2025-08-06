<template>
  <div class="certificate-result-table">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <div class="header-actions">
            <el-button-group>
              <el-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'" size="small">
                <el-icon>
                  <Grid />
                </el-icon>
                表格视图
              </el-button>
              <el-button :type="viewMode === 'chart' ? 'primary' : 'default'" @click="viewMode = 'chart'" size="small">
                <el-icon>
                  <TrendCharts />
                </el-icon>
                图表视图
              </el-button>
            </el-button-group>
            <el-button type="primary" size="small" @click="handleExport" :disabled="!hasData">
              <el-icon>
                <Download />
              </el-icon>
              导出数据
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计概览 -->
      <div v-if="hasData" class="stats-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stats-item">
              <div class="stats-value">{{ formatNumber(stats.totalCertificates || 0) }}</div>
              <div class="stats-label">合格证总数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stats-item">
              <div class="stats-value">{{ formatNumber(stats.totalCompanies || 0) }}</div>
              <div class="stats-label">涉及企业数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stats-item">
              <div class="stats-value">{{ formatNumber(stats.totalModels || 0) }}</div>
              <div class="stats-label">涉及车型数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stats-item">
              <div class="stats-value">{{ stats.timeRange || '全部时间' }}</div>
              <div class="stats-label">统计时间段</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 表格视图 -->
      <div v-show="viewMode === 'table'">
        <!-- 空状态 -->
        <div v-if="!hasData && !loading" class="empty-state">
          <el-empty description="暂无查询结果">
            <template #image>
              <el-icon size="60" color="#c0c4cc">
                <Search />
              </el-icon>
            </template>
            <template #description>
              <p>请设置查询条件并点击查询按钮</p>
            </template>
          </el-empty>
        </div>

        <!-- 数据表格 -->
        <div v-else>
          <el-table :data="paginatedData" v-loading="loading" stripe border height="500" @sort-change="handleSortChange"
            @selection-change="handleSelectionChange">
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


          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
              :total="filteredData.length" :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
              @current-change="handlePageChange" />
          </div>
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
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Grid, TrendCharts, Download, Search } from '@element-plus/icons-vue'

interface Props {
  data: any[]
  loading: boolean
  searchConditions: any[]
}

interface Emits {
  (e: 'export', data: any[]): void
  (e: 'view-detail', row: any): void
  (e: 'sort-change', sortInfo: { prop: string; order: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  searchConditions: () => []
})

const emit = defineEmits<Emits>()

// 响应式数据
const viewMode = ref<'table' | 'chart'>('table')
const selectedRows = ref<any[]>([])
const pagination = ref({
  page: 1,
  pageSize: 20
})

// 计算属性
const hasData = computed(() => props.data.length > 0)

const filteredData = computed(() => {
  try {
    const data = Array.isArray(props.data) ? [...props.data] : []

    // 过滤掉null或undefined的项
    const validData = data.filter(item => item != null)

    // 如果启用了排行功能，按排名升序排列
    const hasRankingCondition = Array.isArray(props.searchConditions) &&
      props.searchConditions.some(c => c && c.showRanking)
    if (hasRankingCondition && validData.length > 0) {
      return validData.sort((a, b) => (a.ranking || 0) - (b.ranking || 0))
    }

    return validData
  } catch (error) {
    console.error('数据过滤失败:', error)
    return []
  }
})

const paginatedData = computed(() => {
  try {
    const data = filteredData.value || []
    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return data.slice(start, end)
  } catch (error) {
    console.error('分页数据计算失败:', error)
    return []
  }
})

// 根据查询条件动态生成表格列
const dynamicColumns = computed(() => {
  try {
    const columns: any[] = []
    const conditions = props.searchConditions || []

    // 检查各种查询条件
    const hasVehicleModelCondition = conditions.some(c => c.vehicleModels && c.vehicleModels.length > 0)
    const hasVehicleBrandCondition = conditions.some(c => c.vehicleBrands && c.vehicleBrands.length > 0)
    const hasVehicleNameCondition = conditions.some(c => c.vehicleNames && c.vehicleNames.length > 0)
    const hasVehicleClassCondition = conditions.some(c => c.vehicleClass && c.vehicleClass.length > 0)
    const hasTimeCondition = conditions.some(c => c.timeRange || c.quickTimeRange)
    const hasComparisonCondition = conditions.some(c => c.enableComparison)
    const hasViewDimensionCondition = conditions.some(c => c.viewDimension && c.viewDimension !== 'total')

    // 基础列 - 根据查询条件决定优先显示的列
    const hasSelectedCompanies = conditions.some(c =>
      (c.selectedCompanies && c.selectedCompanies.length > 0) ||
      c.companyName ||
      c.companyCode
    )

    if (hasVehicleNameCondition && !hasSelectedCompanies) {
      // 优先显示车辆名称
      columns.push({
        key: 'vehicleName',
        label: '车辆名称',
        minWidth: 200,
        sortable: 'custom',
        showTooltip: true
      })
    } else {
      // 默认显示企业名称
      columns.push({
        key: 'companyName',
        label: '企业名称',
        minWidth: 200,
        sortable: 'custom',
        showTooltip: true
      })
    }

    // 车辆品牌列
    if (hasVehicleBrandCondition) {
      columns.push({
        key: 'vehicleBrand',
        label: '车辆品牌',
        width: 120,
        sortable: 'custom'
      })
    }

    // 车辆型号列
    if (hasVehicleModelCondition) {
      columns.push({
        key: 'vehicleModel',
        label: '车辆型号',
        width: 150,
        showTooltip: true
      })
    }

    // 车辆名称列 - 当查询条件中包含车辆名称且已经选择了企业时，作为辅助列显示
    if (hasVehicleNameCondition && hasSelectedCompanies) {
      columns.push({
        key: 'vehicleName',
        label: '车辆名称',
        width: 120,
        sortable: 'custom',
        showTooltip: true
      })
    }

    // 企业名称列 - 当优先显示车辆名称时，企业名称作为辅助列显示
    if (hasVehicleNameCondition && !hasSelectedCompanies) {
      columns.push({
        key: 'companyName',
        label: '企业名称',
        width: 180,
        sortable: 'custom',
        showTooltip: true
      })
    }

    // 车辆类别列
    if (hasVehicleClassCondition) {
      columns.push({
        key: 'vehicleCategory',
        label: '车辆类别',
        width: 100
      })
    }

    // 地址相关列
    const hasProvinceCondition = conditions.some(c => c.productionProvinces && c.productionProvinces.length > 0)
    const hasCityCondition = conditions.some(c => c.productionCities && c.productionCities.length > 0)
    const hasAddressCondition = conditions.some(c => c.productionAddresses && c.productionAddresses.length > 0)

    if (hasProvinceCondition) {
      columns.push({
        key: 'productionProvince',
        label: '生产省份',
        width: 100,
        showTooltip: true
      })
    }

    if (hasCityCondition) {
      columns.push({
        key: 'productionCity',
        label: '生产城市',
        width: 100,
        showTooltip: true
      })
    }

    if (hasAddressCondition) {
      columns.push({
        key: 'productionAddress',
        label: '生产地址',
        minWidth: 150,
        showTooltip: true
      })
    }

    // 时间维度列 - 根据查看维度显示不同的时间列
    if (hasViewDimensionCondition) {
      const viewDimension = conditions.find(c => c.viewDimension)?.viewDimension

      switch (viewDimension) {
        case 'yearly':
          columns.push({
            key: 'year',
            label: '年份',
            width: 100,
            align: 'center',
            sortable: 'custom'
          })
          break
        case 'monthly':
          columns.push({
            key: 'year',
            label: '年份',
            width: 80,
            align: 'center'
          })
          columns.push({
            key: 'month',
            label: '月份',
            width: 80,
            align: 'center',
            sortable: 'custom'
          })
          break
        case 'daily':
          columns.push({
            key: 'date',
            label: '日期',
            width: 120,
            align: 'center',
            sortable: 'custom'
          })
          break
      }
    }

    // 数量相关列 - 根据是否开启同期比显示不同的列
    if (hasComparisonCondition) {
      columns.push({
        key: 'currentPeriodCount',
        label: '当期数量',
        width: 120,
        sortable: 'custom',
        align: 'right',
        formatter: (value: number) => `<span class="certificate-count">${formatNumber(value)}</span>`
      })

      columns.push({
        key: 'previousPeriodCount',
        label: '同期数量',
        width: 120,
        sortable: 'custom',
        align: 'right',
        formatter: (value: number) => `<span class="certificate-count">${formatNumber(value)}</span>`
      })

      columns.push({
        key: 'comparisonRatio',
        label: '同期比',
        width: 100,
        align: 'center',
        formatter: (value: number) => {
          if (value == null || isNaN(value)) return '-'
          const color = value > 0 ? '#67c23a' : value < 0 ? '#f56c6c' : '#909399'
          const symbol = value > 0 ? '+' : ''
          return `<span style="color: ${color}; font-weight: 600;">${symbol}${(value * 100).toFixed(1)}%</span>`
        }
      })
    } else {
      columns.push({
        key: 'certificateCount',
        label: '合格证数量',
        width: 120,
        sortable: 'custom',
        align: 'right',
        formatter: (value: number) => `<span class="certificate-count">${formatNumber(value)}</span>`
      })
    }

    // 六大类列
    const hasSixCategoryCondition = conditions.some(c => c.sixCategories && c.sixCategories.length > 0)
    const hasCommercialOrPassengerCondition = conditions.some(c => c.commercialOrPassenger && c.commercialOrPassenger !== '')
    if (hasSixCategoryCondition || hasCommercialOrPassengerCondition) {
      columns.push({
        key: 'sixCategory',
        label: '六大类',
        width: 100
      })
    }

    // 燃料种类列
    const hasFuelCondition = conditions.some(c => c.fuelTypes && c.fuelTypes.length > 0)
    if (hasFuelCondition) {
      columns.push({
        key: 'fuelType',
        label: '燃料种类',
        width: 100
      })
    }

    // 新能源类别列
    const hasNewEnergyCondition = conditions.some(c => c.newEnergyCategories && c.newEnergyCategories.length > 0)
    if (hasNewEnergyCondition) {
      columns.push({
        key: 'newEnergyType',
        label: '新能源类别',
        width: 120
      })
    }

    // 排名列
    const hasRankingCondition = conditions.some(c => c.showRanking)
    if (hasRankingCondition) {
      columns.push({
        key: 'ranking',
        label: '排名',
        width: 80,
        align: 'center',
        formatter: (value: number) => {
          if (value <= 3) {
            const types = ['', 'danger', 'warning', 'success']
            return `<el-tag type="${types[value]}" size="small">第${value}名</el-tag>`
          }
          return `第${value}名`
        }
      })
    }

    return columns
  } catch (error) {
    console.error('动态列生成失败:', error)
    // 返回基础列作为后备
    return [
      {
        key: 'companyName',
        label: '企业名称',
        minWidth: 200,
        sortable: 'custom',
        showTooltip: true
      },
      {
        key: 'certificateCount',
        label: '合格证数量',
        width: 120,
        sortable: 'custom',
        align: 'right'
      }
    ]
  }
})

// 统计数据 - 从后端获取
const stats = ref({
  totalCertificates: 0,
  totalCompanies: 0,
  totalModels: 0,
  timeRange: '全部时间'
})

// 获取统计数据
const fetchStats = async () => {
  if (!hasData.value) return

  try {
    const { certificateQuantityApi } = await import('../services/api')

    // 构建统计查询参数，基于当前的查询条件
    const statsParams = {}

    // 这里可以根据需要添加过滤条件，目前使用空参数获取全局统计
    const response = await certificateQuantityApi.getStats(statsParams)

    if (response.code === 200) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    // 如果统计数据获取失败，使用默认值
    stats.value = {
      totalCertificates: props.data.reduce((sum, item) => sum + (item.certificateCount || 0), 0),
      totalCompanies: new Set(props.data.map(item => item.companyId)).size,
      totalModels: new Set(props.data.map(item => item.vehicleModel)).size,
      timeRange: '当前查询结果'
    }
  }
}

// 方法
const formatNumber = (num: number | null | undefined) => {
  if (num == null || isNaN(num)) {
    return '0'
  }
  return num.toLocaleString()
}

const handleSortChange = ({ prop, order }: any) => {
  emit('sort-change', { prop, order })
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
}

// 获取当前显示的列字段
const getDisplayFields = () => {
  const fields: string[] = []

  // 添加动态列的字段
  dynamicColumns.value.forEach(column => {
    if (column && column.key) {
      fields.push(column.key)
    }
  })

  return fields
}

const handleExport = () => {
  if (!hasData.value) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  // 获取当前显示的字段
  const displayFields = getDisplayFields()

  // 传递数据和字段信息
  emit('export', {
    data: selectedRows.value.length > 0 ? selectedRows.value : filteredData.value,
    fields: displayFields
  })
}

const handleViewDetail = (row: any) => {
  emit('view-detail', row)
}

// 监听数据变化，重置分页并获取统计数据
watch(() => props.data, () => {
  pagination.value.page = 1
  fetchStats()
}, { immediate: true })
</script>

<style scoped>
.certificate-result-table {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.stats-overview {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.stats-item {
  text-align: center;
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

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.pagination-container {
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

:deep(.certificate-count) {
  font-weight: 600;
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    gap: 8px;
  }

  .stats-overview .el-col {
    margin-bottom: 10px;
  }
}
</style>
