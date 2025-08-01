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
        import('../utils/vehicle-name-query-test').then(({ validateVehicleNameInResponse, testTableColumnLogic }) => {
          validateVehicleNameInResponse(response.data.list)
          testTableColumnLogic(conditions)
        })

        // 运行完整的修复验证
        import('../utils/vehicle-name-fix-validation').then(({ runFullValidation }) => {
          const expectedPrimaryColumn = conditions.some(c => c.vehicleNames && c.vehicleNames.length > 0) &&
            !conditions.some(c => c.selectedCompanies && c.selectedCompanies.length > 0)
            ? 'vehicleName' : 'companyName'

          runFullValidation(conditions, response, expectedPrimaryColumn)
            .then(result => {
              if (result.success) {
                console.log('🎉 实时验证通过！车辆名称修复正常工作')
              } else {
                console.warn('⚠️ 实时验证发现问题:', result.message)
              }
            })
        })
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
        import('../utils/query-debug').then(({ debugCompanySelection }) => {
          debugCompanySelection(condition.selectedCompanies)
        })
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
    if (condition.timeRangeType) {
      params.timeRangeType = condition.timeRangeType
    }
    if (condition.timeUnit) {
      params.timeUnit = condition.timeUnit
    }
    if (condition.enableComparison) {
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
      console.log('🏢 多企业名称查询:', uniqueCompanyNames)
    } else {
      // 单企业查询：使用companyName（兼容性）
      params.companyName = uniqueCompanyNames[0]
      console.log('🏢 单企业名称查询:', uniqueCompanyNames[0])
    }
  }
  if (allCompanyCodes.length > 0) {
    // 去重
    const uniqueCompanyCodes = [...new Set(allCompanyCodes)]

    if (uniqueCompanyCodes.length > 1) {
      // 多企业查询：优先使用companyCodes
      params.companyCodes = uniqueCompanyCodes
      console.log('🏢 多企业代码查询:', uniqueCompanyCodes)
    } else {
      // 单企业查询：使用companyCode（兼容性）
      params.companyCode = uniqueCompanyCodes[0]
      console.log('🏢 单企业代码查询:', uniqueCompanyCodes[0])
    }
  }

  // 设置合并后的车辆参数
  if (allVehicleBrands.length > 0) {
    const uniqueBrands = [...new Set(allVehicleBrands)]
    if (uniqueBrands.length > 1) {
      params.vehicleBrands = uniqueBrands
      console.log('🚗 多车辆品牌查询:', uniqueBrands)
    } else {
      params.vehicleBrand = uniqueBrands[0]
      console.log('🚗 单车辆品牌查询:', uniqueBrands[0])
    }
  }
  if (allVehicleModels.length > 0) {
    const uniqueModels = [...new Set(allVehicleModels)]
    if (uniqueModels.length > 1) {
      params.vehicleModels = uniqueModels
      console.log('🚗 多车辆型号查询:', uniqueModels)
    } else {
      params.vehicleModel = uniqueModels[0]
      console.log('🚗 单车辆型号查询:', uniqueModels[0])
    }
  }
  if (allVehicleNames.length > 0) {
    params.vehicleNames = [...new Set(allVehicleNames)]
    console.log('🚗 车辆名称查询:', params.vehicleNames)
  }
  if (allVehicleClass.length > 0) {
    params.vehicleClass = [...new Set(allVehicleClass)]
    console.log('🚗 车辆类别查询:', params.vehicleClass)
  }

  // 设置合并后的分类参数
  if (allSixCategories.length > 0) {
    params.sixCategories = [...new Set(allSixCategories)]
    console.log('📊 六大类查询:', params.sixCategories)
  }

  // 设置合并后的燃料和新能源参数
  if (allFuelTypes.length > 0) {
    const uniqueFuelTypes = [...new Set(allFuelTypes)]
    if (uniqueFuelTypes.length > 1) {
      params.fuelTypes = uniqueFuelTypes
      console.log('⛽ 多燃料类型查询:', uniqueFuelTypes)
    } else {
      params.fuelType = uniqueFuelTypes[0]
      console.log('⛽ 单燃料类型查询:', uniqueFuelTypes[0])
    }
  }
  if (allNewEnergyCategories.length > 0) {
    const uniqueEnergyTypes = [...new Set(allNewEnergyCategories)]
    if (uniqueEnergyTypes.length > 1) {
      params.newEnergyCategories = uniqueEnergyTypes
      console.log('🔋 多新能源类型查询:', uniqueEnergyTypes)
    } else {
      params.newEnergyType = uniqueEnergyTypes[0]
      console.log('🔋 单新能源类型查询:', uniqueEnergyTypes[0])
    }
  }

  // 设置合并后的地址参数
  if (allProductionAddresses.length > 0) {
    const uniqueAddresses = [...new Set(allProductionAddresses)]
    if (uniqueAddresses.length > 1) {
      params.productionAddresses = uniqueAddresses
      console.log('🏭 多生产地址查询:', uniqueAddresses)
    } else {
      params.productionAddress = uniqueAddresses[0]
      console.log('🏭 单生产地址查询:', uniqueAddresses[0])
    }
  }
  if (allProductionProvinces.length > 0) {
    params.productionProvinces = [...new Set(allProductionProvinces)]
    console.log('🏭 生产省份查询:', params.productionProvinces)
  }
  if (allProductionCities.length > 0) {
    params.productionCities = [...new Set(allProductionCities)]
    console.log('🏭 生产城市查询:', params.productionCities)
  }

  // 调试查询参数
  if (import.meta.env.DEV) {
    console.log('🔍 最终查询参数:', params)
    import('../utils/query-debug').then(({ debugQueryParams }) => {
      debugQueryParams(conditions, params)
    })
  }

  return params
}

const handleReset = () => {
  selectedConditions.value = []
  tableData.value = []
  hasSearched.value = false
  ElMessage.success('已重置所有条件')
}

const handleExport = async () => {
  if (!hasSearched.value || tableData.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  try {
    const { certificateQuantityApi, exportUtils } = await import('../services/api')

    // 构建导出参数
    const params = {
      ...buildSearchParams(selectedConditions.value),
      field: 'certificateCount', // 添加必需的排序字段
      order: 'desc' as const,
      format: 'excel' as const,
      filename: '合格证总量统计'
    }

    const blob = await certificateQuantityApi.export(params)
    exportUtils.downloadFile(blob, exportUtils.generateFilename('合格证总量统计'))

    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const handleExportData = async (data: any[]) => {
  try {
    const { certificateQuantityApi, exportUtils } = await import('../services/api')

    const params = {
      ...buildSearchParams(selectedConditions.value),
      field: 'certificateCount', // 添加必需的排序字段
      order: 'desc' as const,
      format: 'excel' as const,
      filename: '合格证总量统计_选中数据'
    }

    const blob = await certificateQuantityApi.export(params)
    exportUtils.downloadFile(blob, exportUtils.generateFilename('合格证总量统计_选中'))

    ElMessage.success('选中数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
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

  // 开发环境下打印API映射报告
  if (import.meta.env.DEV) {
    import('../utils/api-validation').then(({ printMappingReport }) => {
      printMappingReport()
    })

    // 运行多企业查询测试
    import('../utils/multi-company-query-test').then(({ testMultiCompanyQuery, testSingleConditionMultiCompany }) => {
      testMultiCompanyQuery()
      testSingleConditionMultiCompany()
    })

    // 运行多车辆品牌查询测试
    import('../utils/multi-vehicle-brand-test').then(({ testMultiVehicleBrandQuery, testSingleConditionMultiBrand }) => {
      testMultiVehicleBrandQuery()
      testSingleConditionMultiBrand()
    })

    // 运行车辆名称查询测试
    import('../utils/vehicle-name-query-test').then(({ testVehicleNameQuery }) => {
      testVehicleNameQuery()
    })

    // 运行修复验证测试
    import('../utils/vehicle-name-fix-validation').then(({ runTest }) => {
      runTest()
    })
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
