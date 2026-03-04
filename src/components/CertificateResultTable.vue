<template>
  <div class="certificate-result-table">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="handleExport" :disabled="!hasData">
              <el-icon>
                <Download />
              </el-icon>
              导出数据
            </el-button>
          </div>
        </div>
      </template>



      <!-- 数据表格 -->
      <div>
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
import { Download, Search } from '@element-plus/icons-vue'

interface Props {
  data: any[]
  loading: boolean
  searchConditions: any[]
  timeDimension?: string // 时间维度
  groupDimensions?: string[] // 分组维度
  enableComparison?: boolean // 同期比开关
  displayFields?: string[] // 保留用于向后兼容
}

interface Emits {
  (e: 'export', data: { data: any[]; fields: string[] }): void
  (e: 'view-detail', row: any): void
  (e: 'sort-change', sortInfo: { prop: string; order: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  searchConditions: () => [],
  timeDimension: 'total',
  groupDimensions: () => [],
  enableComparison: false,
  displayFields: () => []
})

const emit = defineEmits<Emits>()

// 响应式数据
const viewMode = ref<'table' | 'chart'>('table')
const selectedRows = ref<any[]>([])
const pagination = ref({
  page: 1,
  pageSize: 20
})
const sortConfig = ref<{ prop: string; order: string } | null>(null)

// 计算属性
const hasData = computed(() => props.data.length > 0)

const filteredData = computed(() => {
  try {
    const data = Array.isArray(props.data) ? [...props.data] : []

    // 过滤掉null或undefined的项
    let validData = data.filter(item => item != null)

    // 如果启用了排行功能，按排名升序排列
    const hasRankingCondition = Array.isArray(props.searchConditions) &&
      props.searchConditions.some(c => c && c.showRanking)
    if (hasRankingCondition && validData.length > 0) {
      validData = validData.sort((a, b) => (a.ranking || 0) - (b.ranking || 0))
    }

    // 应用排序
    if (sortConfig.value && sortConfig.value.prop && sortConfig.value.order !== null) {
      const { prop, order } = sortConfig.value

      validData = [...validData].sort((a, b) => {
        const aValue = a[prop]
        const bValue = b[prop]

        // 处理null/undefined值
        if (aValue == null && bValue == null) return 0
        if (aValue == null) return order === 'ascending' ? 1 : -1
        if (bValue == null) return order === 'ascending' ? -1 : 1

        // 数值比较
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return order === 'ascending' ? aValue - bValue : bValue - aValue
        }

        // 字符串比较
        const aStr = String(aValue)
        const bStr = String(bValue)
        const compareResult = aStr.localeCompare(bStr, 'zh-CN')
        return order === 'ascending' ? compareResult : -compareResult
      })
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

// 根据用户选择的维度动态生成表格列
const dynamicColumns = computed(() => {
  try {
    const columns: any[] = []

    // 优先使用维度参数（新逻辑）
    if (props.groupDimensions && props.groupDimensions.length > 0) {
      return generateColumnsFromDimensions()
    }

    // 向后兼容：如果有displayFields，使用旧逻辑
    const displayFields = props.displayFields || []
    if (displayFields.length > 0) {
      return generateColumnsFromDisplayFields(displayFields)
    }

    // 最后使用默认逻辑
    const conditions = props.searchConditions || []
    return getDefaultColumns(conditions)

  } catch (error) {
    console.error('动态列生成失败:', error)
    return []
  }
})

// 根据维度参数生成列（新逻辑）
const generateColumnsFromDimensions = () => {
  const columns: any[] = []

  // 字段映射配置
  const fieldMapping: Record<string, any> = {
    'QYDM': {
      key: 'companyId',
      label: '合格证企业代码',
      width: 150,
      showTooltip: true
    },
    'CLZZQYMC': {
      key: 'companyName',
      label: '车辆制造企业名称',
      minWidth: 200,
      showTooltip: true
    },
    'CLZT': {
      key: 'vehicleCategory',
      label: '车辆类别',
      width: 100
    },
    'CLXH': {
      key: 'vehicleModel',
      label: '车辆型号',
      width: 150,
      showTooltip: true
    },
    'CLLX': {
      key: 'vehicleType',
      label: '车辆类型',
      width: 120,
      showTooltip: true
    },
    'CLPP': {
      key: 'vehicleBrand',
      label: '车辆品牌',
      width: 120
    },
    'CLMC': {
      key: 'vehicleName',
      label: '车辆名称',
      minWidth: 200,
      showTooltip: true
    },
    'RLZL': {
      key: 'fuelType',
      label: '燃料种类',
      width: 100
    },
    'PL': {
      key: 'displacement',
      label: '排量',
      width: 80,
      align: 'right'
    },
    'C': {
      key: 'length',
      label: '长',
      width: 80,
      align: 'right'
    },
    'ZZL': {
      key: 'totalWeight',
      label: '总质量',
      width: 100,
      align: 'right'
    },
    'ZBZL': {
      key: 'curbWeight',
      label: '整备质量',
      width: 100,
      align: 'right'
    },
    'ZJ': {
      key: 'wheelbase',
      label: '轴距',
      width: 80,
      align: 'right'
    },
    'UPD': {
      key: 'uploadTime',
      label: '上传时间',
      width: 160,
      align: 'center'
    },
    'SL': {
      key: 'certificateCount',
      label: '数量',
      width: 120,
      sortable: 'custom',
      align: 'right',
      formatter: (value: number) => `<span class="certificate-count">${formatNumber(value)}</span>`
    },
    'SCDZ': {
      key: 'productionAddress',
      label: '生产地址',
      minWidth: 150,
      showTooltip: true
    },
    'SF': {
      key: 'productionProvince',
      label: '省份',
      width: 100,
      showTooltip: true
    },
    'CS': {
      key: 'productionCity',
      label: '城市',
      width: 100,
      showTooltip: true
    },
    'QX': {
      key: 'district',
      label: '区县',
      width: 100,
      showTooltip: true
    },
    'G50': {
      key: 'sixCategory',
      label: '六大类',
      width: 100
    },
    'XNYBJ': {
      key: 'newEnergyFlag',
      label: '新能源标记',
      width: 120,
      align: 'center'
    },
    'XNYLB': {
      key: 'newEnergyType',
      label: '新能源类别',
      width: 120
    },
    'QYID': {
      key: 'announcementCompanyId',
      label: '公告企业ID',
      width: 150,
      showTooltip: true
    },
    'GXSJ': {
      key: 'updateTime',
      label: '更新时间',
      width: 160,
      align: 'center'
    },
    'JT': {
      key: 'group',
      label: '集团',
      width: 120,
      showTooltip: true
    },
    // 时间字段 - 根据 viewDimension 使用
    'year': {
      key: 'year',
      label: '年份',
      width: 100,
      align: 'center',
      formatter: (value: number) => value ? `${value}年` : '-'
    },
    'month': {
      key: 'month',
      label: '月份',
      width: 80,
      align: 'center',
      formatter: (value: number) => value ? `${value}月` : '-'
    },
    'date': {
      key: 'date',
      label: '日期',
      width: 120,
      align: 'center'
    }
  }

  // 1. 添加分组维度列
  if (props.groupDimensions) {
    props.groupDimensions.forEach(fieldKey => {
      const fieldConfig = fieldMapping[fieldKey]
      if (fieldConfig) {
        columns.push(fieldConfig)
      }
    })
  }

  // 2. 添加时间维度列
  if (props.timeDimension && props.timeDimension !== 'total') {
    if (props.timeDimension === 'yearly') {
      columns.push(fieldMapping['year'])
    } else if (props.timeDimension === 'monthly') {
      columns.push(fieldMapping['year'])
      columns.push(fieldMapping['month'])
    } else if (props.timeDimension === 'daily') {
      columns.push(fieldMapping['date'])
    }
  }

  // 3. 添加数量列
  if (props.enableComparison) {
    // 同期比模式
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
    // 普通模式
    columns.push(fieldMapping['SL'])
  }

  return columns
}

// 根据displayFields生成列（旧逻辑，向后兼容）
const generateColumnsFromDisplayFields = (displayFields: string[]) => {
  const columns: any[] = []

  // 复用字段映射配置
  const fieldMapping: Record<string, any> = {
    'QYDM': { key: 'companyId', label: '合格证企业代码', width: 150, showTooltip: true },
    'CLZZQYMC': { key: 'companyName', label: '车辆制造企业名称', minWidth: 200, showTooltip: true },
    'CLZT': { key: 'vehicleCategory', label: '车辆类别', width: 100 },
    'CLXH': { key: 'vehicleModel', label: '车辆型号', width: 150, showTooltip: true },
    'CLPP': { key: 'vehicleBrand', label: '车辆品牌', width: 120 },
    'CLMC': { key: 'vehicleName', label: '车辆名称', minWidth: 200, showTooltip: true },
    'RLZL': { key: 'fuelType', label: '燃料种类', width: 100 },
    'SF': { key: 'productionProvince', label: '省份', width: 100, showTooltip: true },
    'CS': { key: 'productionCity', label: '城市', width: 100, showTooltip: true },
    'G50': { key: 'sixCategory', label: '六大类', width: 100 },
    'XNYLB': { key: 'newEnergyType', label: '新能源类别', width: 120 },
    'SL': {
      key: 'certificateCount',
      label: '数量',
      width: 120,
      sortable: 'custom',
      align: 'right',
      formatter: (value: number) => `<span class="certificate-count">${formatNumber(value)}</span>`
    },
    'year': {
      key: 'year',
      label: '年份',
      width: 100,
      align: 'center',
      formatter: (value: number) => value ? `${value}年` : '-'
    },
    'month': {
      key: 'month',
      label: '月份',
      width: 80,
      align: 'center',
      formatter: (value: number) => value ? `${value}月` : '-'
    },
    'date': {
      key: 'date',
      label: '日期',
      width: 120,
      align: 'center'
    }
  }

  displayFields.forEach(fieldKey => {
    const fieldConfig = fieldMapping[fieldKey]
    if (fieldConfig) {
      columns.push(fieldConfig)
    }
  })

  return columns
}

// 默认列生成逻辑（当没有选择显示字段时使用）
const getDefaultColumns = (conditions: any[]) => {
  const columns: any[] = []

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
      showTooltip: true
    })
  } else {
    // 默认显示企业名称
    columns.push({
      key: 'companyName',
      label: '企业名称',
      minWidth: 200,
      showTooltip: true
    })
  }

  // 车辆品牌列
  if (hasVehicleBrandCondition) {
    columns.push({
      key: 'vehicleBrand',
      label: '车辆品牌',
      width: 120
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
      showTooltip: true
    })
  }

  // 企业名称列 - 当优先显示车辆名称时，企业名称作为辅助列显示
  if (hasVehicleNameCondition && !hasSelectedCompanies) {
    columns.push({
      key: 'companyName',
      label: '企业名称',
      width: 180,
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

    // 调试信息 - 开发环境下显示
    if (import.meta.env.DEV) {
      console.log('🔍 查看维度检测:', {
        hasViewDimensionCondition,
        viewDimension,
        conditions: conditions.map(c => ({ viewDimension: c.viewDimension }))
      })
    }

    switch (viewDimension) {
      case 'yearly':
        columns.push({
          key: 'year',
          label: '年份',
          width: 100,
          align: 'center',
          sortable: 'custom',
          formatter: (value: number) => {
            return value ? `${value}年` : '-'
          }
        })
        break
      case 'monthly':
        columns.push({
          key: 'year',
          label: '年份',
          width: 80,
          align: 'center',
          formatter: (value: number) => {
            return value ? `${value}年` : '-'
          }
        })
        columns.push({
          key: 'month',
          label: '月份',
          width: 80,
          align: 'center',
          sortable: 'custom',
          formatter: (value: number) => {
            return value ? `${value}月` : '-'
          }
        })
        break
      case 'daily':
        columns.push({
          key: 'date',
          label: '日期',
          width: 120,
          align: 'center',
          sortable: 'custom',
          formatter: (value: string) => {
            return value || '-'
          }
        })
        break
    }
  } else if (hasTimeCondition) {
    // 如果有时间条件但是总量查看，显示时间范围信息
    const timeCondition = conditions.find(c => c.timeRange || c.quickTimeRange)

    columns.push({
      key: 'timeRange',
      label: '时间范围',
      width: 120,
      align: 'center',
      formatter: (_value: any, _row: any) => {
        // 根据查询条件显示时间范围
        if (timeCondition) {
          if (timeCondition.quickTimeRange) {
            // 快捷时间选择的显示
            const quickTimeLabels: Record<string, string> = {
              '1month': '近一个月',
              '3months': '近三个月',
              '6months': '近六个月',
              '1year': '近一年',
              '2years': '近两年',
              '3years': '近三年',
              'thisYear': '今年'
            }
            return quickTimeLabels[timeCondition.quickTimeRange] || '总量'
          } else if (timeCondition.timeRange) {
            // 自定义时间范围的显示
            const { startDate, endDate } = timeCondition.timeRange
            if (startDate && endDate) {
              return `${startDate} 至 ${endDate}`
            }
          }
        }
        return '总量'
      }
    })
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
}



// 方法
const formatNumber = (num: number | null | undefined) => {
  if (num == null || isNaN(num)) {
    return '0'
  }
  return num.toLocaleString()
}

const handleSortChange = ({ prop, order }: any) => {
  // 更新排序配置
  sortConfig.value = order ? { prop, order } : null

  // 重置到第一页
  pagination.value.page = 1

  // 触发事件（如果父组件需要）
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

// 监听数据变化，重置分页和排序
watch(() => props.data, () => {
  pagination.value.page = 1
  sortConfig.value = null
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
}
</style>
