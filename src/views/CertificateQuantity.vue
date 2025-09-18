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
        <el-dropdown @command="handleExportCommand" :disabled="!hasSearched">
          <el-button type="primary">
            <el-icon>
              <Download />
            </el-icon>
            导出数据
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="current">
                <el-icon>
                  <Document />
                </el-icon>
                导出当前页 ({{ tableData.length }}条)
              </el-dropdown-item>
              <el-dropdown-item command="all">
                <el-icon>
                  <FolderOpened />
                </el-icon>
                导出全部数据
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button @click="handleReset">
          <el-icon>
            <Refresh />
          </el-icon>
          重置所有
        </el-button>
      </div>
    </div>

    <!-- 四个主要组件 -->
    <div class="main-content">
      <!-- 查询条件设置组件 -->
      <certificate-search-conditions @add-condition="handleAddCondition" @reset="handleResetConditions" />

      <!-- 已选条件显示组件 -->
      <certificate-selected-conditions :selected-conditions="selectedConditions"
        @remove-condition="handleRemoveCondition" @clear-all="handleClearAllConditions" @search="handleSearch"
        @reset="handleResetAll" />

      <!-- 显示字段选择组件 -->
      <certificate-display-fields :initial-fields="displayFields" mode="quantity"
        @fields-change="handleDisplayFieldsChange" />

      <!-- 查询结果表格组件 -->
      <certificate-result-table :data="tableData" :loading="loading" :search-conditions="selectedConditions"
        :display-fields="displayFields" @export="handleExportData" @view-detail="handleViewDetail"
        @sort-change="handleSortChange" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh, ArrowDown, Document, FolderOpened } from '@element-plus/icons-vue'

// 导入新的组件
import CertificateSearchConditions from '../components/CertificateSearchConditions.vue'
import CertificateSelectedConditions from '../components/CertificateSelectedConditions.vue'
import CertificateDisplayFields from '../components/CertificateDisplayFields.vue'
import CertificateResultTable from '../components/CertificateResultTable.vue'

// 响应式数据
const loading = ref(false)
const hasSearched = ref(false)
const selectedConditions = ref<any[]>([])
const tableData = ref<any[]>([])
const displayFields = ref<string[]>([]) // 用户选择的显示字段

// 事件处理函数
const handleAddCondition = (condition: any) => {
  selectedConditions.value.push(condition)
  // 添加查询条件
  ElMessage.success('查询条件已添加')
}

const handleRemoveCondition = (index: number) => {
  selectedConditions.value.splice(index, 1)
  // 移除查询条件
}

const handleClearAllConditions = () => {
  selectedConditions.value = []
  tableData.value = []
  hasSearched.value = false
  // 清空所有查询条件
}

const handleResetConditions = () => {
  // 重置条件表单
}

const handleResetAll = () => {
  selectedConditions.value = []
  tableData.value = []
  hasSearched.value = false
  // 重置所有
}

const handleDisplayFieldsChange = (fields: string[]) => {
  displayFields.value = fields
  // 显示字段变化时，如果已经有查询结果，可以考虑重新渲染表格
  // 这里不需要重新查询数据，只需要更新显示字段即可
}

const handleSearch = async (conditions: any[]) => {
  if (conditions.length === 0) {
    ElMessage.warning('请至少添加一个查询条件')
    return
  }

  loading.value = true
  hasSearched.value = true

  try {
    // 开始查询

    // 调用后端API
    const { certificateQuantityApi } = await import('../services/api')

    // 构建查询参数
    const params = {
      page: 1,
      pageSize: 100,
      field: 'certificateCount',
      order: 'desc' as const,
      ...buildSearchParams(conditions)
    }

    const response = await certificateQuantityApi.search(params)

    if (response.code === 200) {
      tableData.value = response.data.list

      // 开发环境下验证返回数据
      if (import.meta.env.DEV) {
        // 数据验证逻辑
        const expectedPrimaryColumn = conditions.some(c => c.vehicleNames && c.vehicleNames.length > 0) &&
          !conditions.some(c => c.selectedCompanies && c.selectedCompanies.length > 0)
          ? 'vehicleName' : 'companyName'

        // 验证逻辑处理
      }

      ElMessage.success(`查询完成，共找到 ${response.data.total} 条记录`)
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败，请重试')
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// 构建查询参数
const buildSearchParams = (conditions: any[]) => {
  const params: any = {}

  // 收集所有参数的数组，用于合并多个条件
  const allCompanyNames: string[] = []
  const allCompanyCodes: string[] = []
  const allVehicleBrands: string[] = []
  const allVehicleModels: string[] = []
  const allVehicleNames: string[] = []
  const allVehicleClass: string[] = []
  const allSixCategories: string[] = []
  const allFuelTypes: string[] = []
  const allNewEnergyCategories: string[] = []
  const allProductionAddresses: string[] = []
  const allProductionProvinces: string[] = []
  const allProductionCities: string[] = []

  conditions.forEach(condition => {
    // 开发环境下验证条件映射
    if (import.meta.env.DEV) {
      import('../utils/api-validation').then(({ validateConditionMapping }) => {
        const validation = validateConditionMapping(condition)
        if (!validation.valid) {
          console.warn('⚠️ 发现未映射的查询条件字段:', validation.unmappedFields)
          console.info('✅ 已映射的字段:', validation.mappedFields)
        }
      })
    }

    // 企业信息 - 处理新的多选企业逻辑
    if (condition.selectedCompanies && condition.selectedCompanies.length > 0) {
      // 调试企业选择
      if (import.meta.env.DEV) {
        // 企业选择调试
      }

      // 提取企业名称和代码，合并到总列表中
      const companyNames = condition.selectedCompanies
        .map((c: any) => c.name)
        .filter((name: string) => name && name.trim())
      const companyCodes = condition.selectedCompanies
        .map((c: any) => c.code)
        .filter((code: string) => code && code.trim())

      allCompanyNames.push(...companyNames)
      allCompanyCodes.push(...companyCodes)
    }
    // 兼容旧的单个企业选择方式
    else {
      if (condition.companyName) {
        allCompanyNames.push(condition.companyName)
      }
      if (condition.companyCode) {
        allCompanyCodes.push(condition.companyCode)
      }
    }

    // 车辆信息 - 合并多个条件的值
    if (condition.vehicleBrands && condition.vehicleBrands.length > 0) {
      allVehicleBrands.push(...condition.vehicleBrands)
    }
    if (condition.vehicleModels && condition.vehicleModels.length > 0) {
      allVehicleModels.push(...condition.vehicleModels)
    }
    if (condition.vehicleNames && condition.vehicleNames.length > 0) {
      allVehicleNames.push(...condition.vehicleNames)
    }
    if (condition.vehicleClass && condition.vehicleClass.length > 0) {
      allVehicleClass.push(...condition.vehicleClass)
    }
    if (condition.vehicleCategory) {
      params.vehicleCategory = condition.vehicleCategory
    }

    // 分类信息 - 合并多个条件的值
    if (condition.sixCategories && condition.sixCategories.length > 0) {
      allSixCategories.push(...condition.sixCategories)
    }
    if (condition.commercialOrPassenger) {
      params.commercialOrPassenger = condition.commercialOrPassenger
    }

    // 燃料和新能源 - 合并多个条件的值
    if (condition.fuelTypes && condition.fuelTypes.length > 0) {
      allFuelTypes.push(...condition.fuelTypes)
    }
    if (condition.newEnergyCategories && condition.newEnergyCategories.length > 0) {
      allNewEnergyCategories.push(...condition.newEnergyCategories)
    }
    if (condition.isNewEnergy) {
      params.isNewEnergy = condition.isNewEnergy
    }

    // 地址信息 - 合并多个条件的值
    if (condition.productionAddresses && condition.productionAddresses.length > 0) {
      allProductionAddresses.push(...condition.productionAddresses)
    }
    if (condition.productionProvinces && condition.productionProvinces.length > 0) {
      allProductionProvinces.push(...condition.productionProvinces)
    }
    if (condition.productionCities && condition.productionCities.length > 0) {
      allProductionCities.push(...condition.productionCities)
    }

    // 时间相关
    if (condition.timeRange) {
      params.timeRange = {
        startDate: condition.timeRange.startDate,
        endDate: condition.timeRange.endDate
      }
    }

    // 新增的时间范围参数
    if (condition.quickTimeRange) {
      params.quickTimeRange = condition.quickTimeRange
    }
    if (condition.viewDimension) {
      params.viewDimension = condition.viewDimension
    }
    if (condition.enableComparison !== undefined) {
      params.enableComparison = condition.enableComparison
    }

    // 其他选项
    if (condition.excludeNonAnnouncement !== undefined) {
      params.excludeNonAnnouncement = condition.excludeNonAnnouncement
    }
    if (condition.showRanking) {
      params.showRanking = condition.showRanking
    }
  })

  // 设置合并后的企业参数
  if (allCompanyNames.length > 0) {
    // 去重
    const uniqueCompanyNames = [...new Set(allCompanyNames)]

    if (uniqueCompanyNames.length > 1) {
      // 多企业查询：优先使用companyNames
      params.companyNames = uniqueCompanyNames
    } else {
      // 单企业查询：使用companyName（兼容性）
      params.companyName = uniqueCompanyNames[0]
      // 查询参数处理
    }
  }
  if (allCompanyCodes.length > 0) {
    // 去重
    const uniqueCompanyCodes = [...new Set(allCompanyCodes)]

    if (uniqueCompanyCodes.length > 1) {
      // 多企业查询：优先使用companyCodes
      params.companyCodes = uniqueCompanyCodes
      // 查询参数处理
    } else {
      // 单企业查询：使用companyCode（兼容性）
      params.companyCode = uniqueCompanyCodes[0]
      // 查询参数处理
    }
  }

  // 设置合并后的车辆参数
  if (allVehicleBrands.length > 0) {
    const uniqueBrands = [...new Set(allVehicleBrands)]
    if (uniqueBrands.length > 1) {
      params.vehicleBrands = uniqueBrands
      // 查询参数处理
    } else {
      params.vehicleBrand = uniqueBrands[0]
      // 查询参数处理
    }
  }
  if (allVehicleModels.length > 0) {
    const uniqueModels = [...new Set(allVehicleModels)]
    if (uniqueModels.length > 1) {
      params.vehicleModels = uniqueModels
      // 查询参数处理
    } else {
      params.vehicleModel = uniqueModels[0]
      // 查询参数处理
    }
  }
  if (allVehicleNames.length > 0) {
    params.vehicleNames = [...new Set(allVehicleNames)]
    // 查询参数处理
  }
  if (allVehicleClass.length > 0) {
    params.vehicleClass = [...new Set(allVehicleClass)]
    // 查询参数处理
  }

  // 设置合并后的分类参数
  if (allSixCategories.length > 0) {
    params.sixCategories = [...new Set(allSixCategories)]
    // 查询参数处理
  }

  // 设置合并后的燃料和新能源参数
  if (allFuelTypes.length > 0) {
    const uniqueFuelTypes = [...new Set(allFuelTypes)]
    if (uniqueFuelTypes.length > 1) {
      params.fuelTypes = uniqueFuelTypes
      // 查询参数处理
    } else {
      params.fuelType = uniqueFuelTypes[0]
      // 查询参数处理
    }
  }
  if (allNewEnergyCategories.length > 0) {
    const uniqueEnergyTypes = [...new Set(allNewEnergyCategories)]
    if (uniqueEnergyTypes.length > 1) {
      params.newEnergyCategories = uniqueEnergyTypes
      // 查询参数处理
    } else {
      params.newEnergyType = uniqueEnergyTypes[0]
      // 查询参数处理
    }
  }

  // 设置合并后的地址参数
  if (allProductionAddresses.length > 0) {
    const uniqueAddresses = [...new Set(allProductionAddresses)]
    if (uniqueAddresses.length > 1) {
      params.productionAddresses = uniqueAddresses
      // 查询参数处理
    } else {
      params.productionAddress = uniqueAddresses[0]
      // 查询参数处理
    }
  }
  if (allProductionProvinces.length > 0) {
    params.productionProvinces = [...new Set(allProductionProvinces)]
    // 查询参数处理
  }
  if (allProductionCities.length > 0) {
    params.productionCities = [...new Set(allProductionCities)]
    // 查询参数处理
  }

  // 开发环境调试
  if (import.meta.env.DEV) {
    // 查询参数调试
  }

  return params
}

const handleReset = () => {
  selectedConditions.value = []
  tableData.value = []
  hasSearched.value = false
  ElMessage.success('已重置所有条件')
}

// 存储当前显示的字段 - 现在使用用户选择的字段
// const currentDisplayFields = ref<string[]>([])

// 导出当前页数据（默认行为，安全）
const handleExport = async () => {
  if (!hasSearched.value || tableData.value.length === 0) {
    ElMessage.warning('当前页没有可导出的数据')
    return
  }

  try {
    const { certificateQuantityApi, exportUtils } = await import('../services/api')

    // 构建导出参数 - 只导出当前页数据
    const params = {
      ...buildSearchParams(selectedConditions.value),
      page: 1, // 当前页码
      pageSize: 100, // 当前页大小
      field: 'certificateCount',
      order: 'desc' as const,
      format: 'excel' as const,
      filename: '合格证总量统计_当前页',
      export_range: 'current', // 明确指定导出范围
      fields: displayFields.value // 只导出用户选择的字段
    }

    const blob = await certificateQuantityApi.export(params)
    exportUtils.downloadFile(blob, exportUtils.generateFilename('合格证总量统计_当前页'))

    ElMessage.success(`当前页数据导出成功（${tableData.value.length}条记录）`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 导出全部数据（需要用户确认）
const handleExportAll = async () => {
  if (!hasSearched.value) {
    ElMessage.warning('请先执行查询')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要导出全部符合条件的数据吗？这可能包含大量记录。',
      '确认导出全部数据',
      {
        confirmButtonText: '确定导出',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const { certificateQuantityApi, exportUtils } = await import('../services/api')

    const params = {
      ...buildSearchParams(selectedConditions.value),
      field: 'certificateCount',
      order: 'desc' as const,
      format: 'excel' as const,
      filename: '合格证总量统计_全部数据',
      export_range: 'all', // 导出全部数据
      fields: displayFields.value // 只导出用户选择的字段
    }

    const blob = await certificateQuantityApi.export(params)
    exportUtils.downloadFile(blob, exportUtils.generateFilename('合格证总量统计_全部'))

    ElMessage.success('全部数据导出成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('导出失败:', error)
      ElMessage.error('导出失败，请重试')
    }
  }
}

// 导出选中数据
const handleExportData = async (exportData: any) => {
  // 处理新的数据结构
  const selectedRows = Array.isArray(exportData) ? exportData : exportData.data

  if (!selectedRows || selectedRows.length === 0) {
    ElMessage.warning('请先选择要导出的数据')
    return
  }

  try {
    const { certificateQuantityApi, exportUtils } = await import('../services/api')

    // 提取选中数据的ID
    const selectedIds = selectedRows.map((row: any) => row.companyId || row.id || `${row.companyName}_${row.vehicleModel}`)

    const params = {
      ...buildSearchParams(selectedConditions.value),
      field: 'certificateCount',
      order: 'desc' as const,
      format: 'excel' as const,
      filename: '合格证总量统计_选中数据',
      export_range: 'selected', // 导出选中数据
      selected_ids: selectedIds,
      fields: displayFields.value // 只导出用户选择的字段
    }

    const blob = await certificateQuantityApi.export(params)
    exportUtils.downloadFile(blob, exportUtils.generateFilename('合格证总量统计_选中'))

    ElMessage.success(`选中的${selectedRows.length}条数据导出成功`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const handleViewDetail = (row: any) => {
  // 查看详情处理
  ElMessage.info(`查看 ${row.companyName} 的详细信息`)
}

const handleSortChange = (sortInfo: { prop: string; order: string }) => {
  // 排序变化处理
  console.log('排序变化:', sortInfo)
  // 这里可以重新排序数据或重新查询
}

// 添加缺失的导出命令处理方法
const handleExportCommand = (command: string) => {
  if (command === 'current') {
    handleExport()
  } else if (command === 'all') {
    handleExportAll()
  }
}

// 生命周期
onMounted(() => {
  // 查询参数处理

  // 开发环境下打印API映射报告
  if (import.meta.env.DEV) {
    import('../utils/api-validation').then(({ printMappingReport }) => {
      printMappingReport()
    })
    // 其他开发环境初始化逻辑
  }
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
