<template>
  <div class="certificate-search-conditions">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件设置</span>
          <el-button link @click="showPresetConditions = !showPresetConditions">
            {{ showPresetConditions ? '隐藏' : '显示' }}前提条件
          </el-button>
        </div>
      </template>

      <!-- 前提条件 -->
      <div v-show="showPresetConditions" class="preset-conditions">
        <el-alert title="前提条件" type="info" :closable="false" show-icon>
          <p>以下为查询时的前提条件，初始为默认值，但也支持修改</p>
        </el-alert>

        <el-row :gutter="20" style="margin-top: 15px;">
          <el-col :span="12">
            <el-form-item label="车辆类别">
              <el-checkbox-group v-model="form.vehicleClass">
                <el-checkbox label="整车">整车</el-checkbox>
                <el-checkbox label="底盘">底盘</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆类型">
              <el-checkbox v-model="form.excludeNonAnnouncement">
                排除非《公告》产品
              </el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider />
      </div>

      <!-- 主要查询条件 -->
      <el-form :model="form" label-width="120px">
        <el-row :gutter="20">
          <!-- 企业选择 -->
          <el-col :span="12">
            <el-form-item label="企业选择">
              <div class="enterprise-selection">
                <!-- 已选择的企业标签 -->
                <div v-if="form.selectedCompanies.length > 0" class="selected-companies">
                  <el-tag v-for="(company, index) in form.selectedCompanies" :key="`${company.code}-${index}`" closable
                    @close="removeCompany(index)" :type="company.isPartialMatch ? 'warning' : 'primary'"
                    class="company-tag">
                    <span class="company-tag-content">
                      <span class="company-name">{{ company.name }}</span>
                      <span v-if="company.code && !company.isPartialMatch" class="company-code">({{ company.code
                      }})</span>
                      <span v-if="company.isPartialMatch" class="partial-match-hint">(部分匹配)</span>
                    </span>
                  </el-tag>
                </div>

                <!-- 输入区域 -->
                <div class="enterprise-input-group">
                  <el-input v-model="form.companyNameInput" placeholder="输入企业名称（支持部分匹配）" style="flex: 1" clearable
                    @input="handleCompanyNameInput" @keyup.enter="addCompanyByName">
                    <template #prepend>企业名称</template>
                    <template #append>
                      <el-button @click="addCompanyByName" :disabled="!form.companyNameInput.trim()">
                        添加
                      </el-button>
                    </template>
                  </el-input>
                  <el-input v-model="form.companyCodeInput" placeholder="输入企业代码" style="flex: 1; margin-left: 8px"
                    clearable @input="handleCompanyCodeInput" @keyup.enter="addCompanyByCode">
                    <template #prepend>企业代码</template>
                    <template #append>
                      <el-button @click="addCompanyByCode" :disabled="!form.companyCodeInput.trim()">
                        添加
                      </el-button>
                    </template>
                  </el-input>
                </div>

                <!-- 加载状态 -->
                <div v-if="loadingCompanies" class="loading-companies">
                  <el-icon class="is-loading">
                    <Loading />
                  </el-icon>
                  正在加载企业数据...
                </div>

                <!-- 建议列表 -->
                <div class="enterprise-suggestions" v-else-if="showCompanySuggestions && companySuggestions.length > 0">
                  <div class="suggestion-header">
                    匹配的企业（点击添加）：
                    <el-button link size="small" @click="addAllSuggestions">
                      全部添加
                    </el-button>
                  </div>
                  <div class="suggestion-list">
                    <div v-for="company in companySuggestions" :key="company.code" class="suggestion-item"
                      @click="addCompanyFromSuggestion(company)">
                      <div class="company-info">
                        <span class="company-name">{{ company.name }}</span>
                        <span class="company-code">{{ company.code }}</span>
                      </div>
                      <el-icon class="add-icon">
                        <Plus />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>

          <!-- 车辆型号 -->
          <el-col :span="6">
            <el-form-item label="车辆型号">
              <div class="vehicle-input-selection">
                <!-- 已选择的车辆型号标签 -->
                <div v-if="form.vehicleModels.length > 0" class="selected-items">
                  <el-tag v-for="(model, index) in form.vehicleModels" :key="`model-${index}`" closable
                    @close="removeVehicleModel(index)" type="primary" class="item-tag">
                    {{ model }}
                  </el-tag>
                </div>

                <!-- 输入区域 -->
                <el-input v-model="form.vehicleModelInput" placeholder="输入车辆型号，回车添加" clearable
                  @keyup.enter="addVehicleModel" @input="handleVehicleModelInput">
                  <template #append>
                    <el-button @click="addVehicleModel" :disabled="!form.vehicleModelInput.trim()">
                      添加
                    </el-button>
                  </template>
                </el-input>

                <!-- 建议列表 -->
                <div class="suggestions" v-if="showVehicleModelSuggestions && vehicleModelSuggestions.length > 0">
                  <div class="suggestion-header">
                    匹配的车辆型号（点击添加）：
                  </div>
                  <div class="suggestion-list">
                    <div v-for="model in vehicleModelSuggestions" :key="model" class="suggestion-item"
                      @click="addVehicleModelFromSuggestion(model)">
                      <span class="suggestion-text">{{ model }}</span>
                      <el-icon class="add-icon">
                        <Plus />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>

          <!-- 车辆品牌 -->
          <el-col :span="6">
            <el-form-item label="车辆品牌">
              <div class="vehicle-input-selection">
                <!-- 已选择的车辆品牌标签 -->
                <div v-if="form.vehicleBrands.length > 0" class="selected-items">
                  <el-tag v-for="(brand, index) in form.vehicleBrands" :key="`brand-${index}`" closable
                    @close="removeVehicleBrand(index)" type="primary" class="item-tag">
                    {{ brand }}
                  </el-tag>
                </div>

                <!-- 输入区域 -->
                <el-input v-model="form.vehicleBrandInput" placeholder="输入车辆品牌，回车添加" clearable
                  @keyup.enter="addVehicleBrand" @input="handleVehicleBrandInput">
                  <template #append>
                    <el-button @click="addVehicleBrand" :disabled="!form.vehicleBrandInput.trim()">
                      添加
                    </el-button>
                  </template>
                </el-input>

                <!-- 建议列表 -->
                <div class="suggestions" v-if="showVehicleBrandSuggestions && vehicleBrandSuggestions.length > 0">
                  <div class="suggestion-header">
                    匹配的车辆品牌（点击添加）：
                  </div>
                  <div class="suggestion-list">
                    <div v-for="brand in vehicleBrandSuggestions" :key="brand" class="suggestion-item"
                      @click="addVehicleBrandFromSuggestion(brand)">
                      <span class="suggestion-text">{{ brand }}</span>
                      <el-icon class="add-icon">
                        <Plus />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 车辆名称 -->
          <el-col :span="8">
            <el-form-item label="车辆名称">
              <div class="vehicle-input-selection">
                <!-- 已选择的车辆名称标签 -->
                <div v-if="form.vehicleNames.length > 0" class="selected-items">
                  <el-tag v-for="(name, index) in form.vehicleNames" :key="`name-${index}`" closable
                    @close="removeVehicleName(index)" type="primary" class="item-tag">
                    {{ name }}
                  </el-tag>
                </div>

                <!-- 输入区域 -->
                <el-input v-model="form.vehicleNameInput" placeholder="输入车辆名称，回车添加" clearable
                  @keyup.enter="addVehicleName" @input="handleVehicleNameInput">
                  <template #append>
                    <el-button @click="addVehicleName" :disabled="!form.vehicleNameInput.trim()">
                      添加
                    </el-button>
                  </template>
                </el-input>

                <!-- 建议列表 -->
                <div class="suggestions" v-if="showVehicleNameSuggestions && vehicleNameSuggestions.length > 0">
                  <div class="suggestion-header">
                    匹配的车辆名称（点击添加）：
                  </div>
                  <div class="suggestion-list">
                    <div v-for="name in vehicleNameSuggestions" :key="name" class="suggestion-item"
                      @click="addVehicleNameFromSuggestion(name)">
                      <span class="suggestion-text">{{ name }}</span>
                      <el-icon class="add-icon">
                        <Plus />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>

          <!-- 时间范围选择 -->
          <el-col :span="16">
            <el-form-item label="时间范围">
              <div class="time-range-container">
                <!-- 快捷时间选择 -->
                <el-select v-model="form.quickTimeRange" placeholder="选择时间范围" style="width: 200px"
                  @change="handleQuickTimeRangeChange">
                  <el-option label="近三个月" value="3months" />
                  <el-option label="近六个月" value="6months" />
                  <el-option label="近一年" value="1year" />
                  <el-option label="近两年" value="2years" />
                  <el-option label="近三年" value="3years" />
                  <el-option label="自定义" value="custom" />
                </el-select>

                <!-- 自定义时间范围 -->
                <el-date-picker v-if="form.quickTimeRange === 'custom'" v-model="timeRange" type="daterange"
                  range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD" @change="handleTimeRangeChange" style="margin-left: 10px" />

                <!-- 查看维度选择 -->
                <el-select v-model="form.viewDimension" placeholder="查看维度" style="width: 150px; margin-left: 10px">
                  <el-option label="总量" value="total">
                    <el-icon>
                      <TrendCharts />
                    </el-icon>
                    <span style="margin-left: 8px">总量</span>
                  </el-option>
                  <el-option label="分年度" value="yearly">
                    <span style="margin-left: 8px">年 分年度</span>
                  </el-option>
                  <el-option label="分月份" value="monthly">
                    <span style="margin-left: 8px">月 分月份</span>
                  </el-option>
                  <el-option label="分天数" value="daily">
                    <span style="margin-left: 8px">日 分天数</span>
                  </el-option>
                </el-select>

                <!-- 同期比开关 -->
                <el-switch v-model="form.enableComparison" active-text="同期比" inactive-text="同期比"
                  style="margin-left: 15px" :active-color="form.enableComparison ? '#409eff' : '#dcdfe6'"
                  @change="handleComparisonToggle">
                  <template #active-action>
                    <el-icon :style="{ color: form.enableComparison ? '#409eff' : '#909399' }">
                      <TrendCharts />
                    </el-icon>
                  </template>
                </el-switch>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 生产地址 -->
          <el-col :span="8">
            <el-form-item label="生产地址">
              <div class="vehicle-input-selection">
                <!-- 已选择的生产地址标签 -->
                <div v-if="form.productionAddresses.length > 0" class="selected-items">
                  <el-tag v-for="(address, index) in form.productionAddresses" :key="`address-${index}`" closable
                    @close="removeProductionAddress(index)" type="primary" class="item-tag">
                    {{ address }}
                  </el-tag>
                </div>

                <!-- 输入区域 -->
                <el-input v-model="form.productionAddressInput" placeholder="输入生产地址，回车添加" clearable
                  @keyup.enter="addProductionAddress" @input="handleProductionAddressInput">
                  <template #append>
                    <el-button @click="addProductionAddress" :disabled="!form.productionAddressInput.trim()">
                      添加
                    </el-button>
                  </template>
                </el-input>

                <!-- 建议列表 -->
                <div class="suggestions"
                  v-if="showProductionAddressSuggestions && productionAddressSuggestions.length > 0">
                  <div class="suggestion-header">
                    匹配的生产地址（点击添加）：
                  </div>
                  <div class="suggestion-list">
                    <div v-for="address in productionAddressSuggestions" :key="address" class="suggestion-item"
                      @click="addProductionAddressFromSuggestion(address)">
                      <span class="suggestion-text">{{ address }}</span>
                      <el-icon class="add-icon">
                        <Plus />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>

          <!-- 生产省份 -->
          <el-col :span="8">
            <el-form-item label="生产省份">
              <el-select v-model="form.productionProvinces" multiple filterable placeholder="请选择生产省份"
                style="width: 100%">
                <el-option v-for="province in provinceOptions" :key="province" :label="province" :value="province" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 生产城市 -->
          <el-col :span="8">
            <el-form-item label="生产城市">
              <el-select v-model="form.productionCities" multiple filterable allow-create placeholder="请输入生产城市"
                style="width: 100%">
                <el-option v-for="city in cityOptions" :key="city" :label="city" :value="city" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 六大类 -->
          <el-col :span="8">
            <el-form-item label="六大类">
              <el-select v-model="form.sixCategories" multiple placeholder="请选择车辆六大类" style="width: 100%">
                <el-option label="货车" value="货车" />
                <el-option label="乘用车" value="乘用车" />
                <el-option label="专用车" value="专用车" />
                <el-option label="摩托车" value="摩托车" />
                <el-option label="农用车" value="农用车" />
                <el-option label="挂车" value="挂车" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 商用车/乘用车 -->
          <el-col :span="8">
            <el-form-item label="商用车/乘用车">
              <el-radio-group v-model="form.commercialOrPassenger">
                <el-radio label="">全部</el-radio>
                <el-radio label="商用车">商用车</el-radio>
                <el-radio label="乘用车">乘用车</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <!-- 燃料种类 -->
          <el-col :span="8">
            <el-form-item label="燃料种类">
              <div class="vehicle-input-selection">
                <!-- 已选择的燃料种类标签 -->
                <div v-if="form.fuelTypes.length > 0" class="selected-items">
                  <el-tag v-for="(fuel, index) in form.fuelTypes" :key="`fuel-${index}`" closable
                    @close="removeFuelType(index)" type="primary" class="item-tag">
                    {{ fuel }}
                  </el-tag>
                </div>

                <!-- 输入区域 -->
                <el-input v-model="form.fuelTypeInput" placeholder="输入燃料种类，回车添加" clearable @keyup.enter="addFuelType"
                  @input="handleFuelTypeInput">
                  <template #append>
                    <el-button @click="addFuelType" :disabled="!form.fuelTypeInput.trim()">
                      添加
                    </el-button>
                  </template>
                </el-input>

                <!-- 建议列表 -->
                <div class="suggestions" v-if="showFuelTypeSuggestions && fuelTypeSuggestions.length > 0">
                  <div class="suggestion-header">
                    匹配的燃料种类（点击添加）：
                  </div>
                  <div class="suggestion-list">
                    <div v-for="fuel in fuelTypeSuggestions" :key="fuel" class="suggestion-item"
                      @click="addFuelTypeFromSuggestion(fuel)">
                      <span class="suggestion-text">{{ fuel }}</span>
                      <el-icon class="add-icon">
                        <Plus />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 新能源类别 -->
          <el-col :span="8">
            <el-form-item label="新能源类别">
              <el-select v-model="form.newEnergyCategories" multiple placeholder="请选择新能源类别" style="width: 100%">
                <el-option label="纯电动" value="纯电动" />
                <el-option label="插电式混合动力" value="插电式混合动力" />
                <el-option label="燃料电池" value="燃料电池" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 是否新能源 -->
          <el-col :span="8">
            <el-form-item label="是否新能源">
              <el-radio-group v-model="form.isNewEnergy">
                <el-radio label="">全部</el-radio>
                <el-radio label="是">是</el-radio>
                <el-radio label="否">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <!-- 显示排行 -->
          <el-col :span="8">
            <el-form-item label="显示排行">
              <el-switch v-model="form.showRanking" active-text="显示排名" inactive-text="不显示排名" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 操作按钮 -->
        <el-row>
          <el-col :span="24">
            <div class="form-actions">
              <el-button type="primary" @click="handleAddCondition">
                添加条件
              </el-button>
              <el-button @click="handleReset">
                重置表单
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Loading, TrendCharts } from '@element-plus/icons-vue'


interface SearchForm {
  // 前提条件
  vehicleClass: string[]
  excludeNonAnnouncement: boolean

  // 主要查询条件
  selectedCompanies: CompanyInfo[]  // 已选择的企业列表
  companyNameInput: string          // 企业名称输入框
  companyCodeInput: string          // 企业代码输入框
  vehicleModels: string[]
  vehicleModelInput: string         // 车辆型号输入框
  vehicleBrands: string[]
  vehicleBrandInput: string         // 车辆品牌输入框
  vehicleNames: string[]
  vehicleNameInput: string          // 车辆名称输入框

  // 时间范围选择
  quickTimeRange: string            // 快捷时间选择
  viewDimension: string             // 查看维度
  enableComparison: boolean         // 同期比开关

  productionAddresses: string[]
  productionAddressInput: string    // 生产地址输入框
  productionProvinces: string[]
  productionCities: string[]
  sixCategories: string[]
  commercialOrPassenger: string
  fuelTypes: string[]
  fuelTypeInput: string             // 燃料种类输入框
  newEnergyCategories: string[]
  isNewEnergy: string
  showRanking: boolean
}

interface CompanyInfo {
  code: string
  name: string
  isPartialMatch?: boolean  // 是否为部分匹配（用户输入的不完整信息）
}

const emit = defineEmits(['add-condition', 'reset'])

// 响应式数据
const showPresetConditions = ref(false)
const showCompanySuggestions = ref(false)
const companySuggestions = ref<CompanyInfo[]>([])

// 车辆相关建议状态
const showVehicleModelSuggestions = ref(false)
const vehicleModelSuggestions = ref<string[]>([])
const showVehicleBrandSuggestions = ref(false)
const vehicleBrandSuggestions = ref<string[]>([])
const showVehicleNameSuggestions = ref(false)
const vehicleNameSuggestions = ref<string[]>([])
const showProductionAddressSuggestions = ref(false)
const productionAddressSuggestions = ref<string[]>([])
const showFuelTypeSuggestions = ref(false)
const fuelTypeSuggestions = ref<string[]>([])

const form = reactive<SearchForm>({
  // 前提条件默认值
  vehicleClass: [],
  excludeNonAnnouncement: true,
  showRanking: false,

  // 主要查询条件
  selectedCompanies: [],
  companyNameInput: '',
  companyCodeInput: '',
  vehicleModels: [],
  vehicleModelInput: '',
  vehicleBrands: [],
  vehicleBrandInput: '',
  vehicleNames: [],
  vehicleNameInput: '',

  // 时间范围选择初始化
  quickTimeRange: '',
  viewDimension: 'total',
  enableComparison: false,

  productionAddresses: [],
  productionAddressInput: '',
  productionProvinces: [],
  productionCities: [],
  sixCategories: [],
  commercialOrPassenger: '',
  fuelTypes: [],
  fuelTypeInput: '',
  newEnergyCategories: [],
  isNewEnergy: ''
})

// 企业数据（从后端获取）
const companyDatabase = ref<CompanyInfo[]>([])
const loadingCompanies = ref(false)

// 时间范围选择
const timeRange = ref<[string, string] | null>(null)

// 时间范围处理方法
const handleQuickTimeRangeChange = (value: string) => {
  if (value === 'custom') {
    // 自定义时间范围，不设置默认值
    timeRange.value = null
    return
  }

  const now = new Date()
  const endDate = now.toISOString().split('T')[0]
  let startDate: string

  switch (value) {
    case '3months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0]
      break
    case '6months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0]
      break
    case '1year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0]
      break
    case '2years':
      startDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString().split('T')[0]
      break
    case '3years':
      startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()).toISOString().split('T')[0]
      break
    default:
      return
  }

  timeRange.value = [startDate, endDate]
}

const handleComparisonToggle = (value: boolean) => {
  if (value) {
    ElMessage.info('已开启同期比分析，将与去年同期进行对比')
  } else {
    ElMessage.info('已关闭同期比分析')
  }
}

// 开发环境标识
const isDevelopment = computed(() => import.meta.env.DEV)

// 获取企业列表
const fetchCompanies = async () => {
  try {
    loadingCompanies.value = true
    const { certificateQuantityApi } = await import('../services/api')
    const response = await certificateQuantityApi.getCompaniesList()

    if (response.code === 200) {
      companyDatabase.value = response.data.map(company => ({
        code: company.code,
        name: company.name,
        isPartialMatch: false
      }))
      console.log(`✅ 成功加载 ${companyDatabase.value.length} 个企业信息`)
    } else {
      console.error('获取企业列表失败:', response.message)
      ElMessage.error('获取企业列表失败')
    }
  } catch (error) {
    console.error('获取企业列表出错:', error)
    ElMessage.error('获取企业列表出错')
  } finally {
    loadingCompanies.value = false
  }
}

// 获取省份列表
const fetchProvinces = async () => {
  try {
    const { commonApi } = await import('../services/api')
    const response = await commonApi.getRegions()

    if (response.code === 200) {
      // 提取省份名称，使用数据库中的格式（不带省字）
      const provinces = response.data.map(region => region.name)
      provinceOptions.value = provinces
      console.log(`✅ 成功加载 ${provinces.length} 个省份信息`)
    } else {
      console.warn('获取省份列表失败，使用默认列表')
    }
  } catch (error) {
    console.warn('获取省份列表出错，使用默认列表:', error)
  }
}

// 选项数据
const vehicleModelOptions = ref(['Model S', 'Model 3', 'Model X', 'Model Y', 'H9', '汉EV'])
const vehicleBrandOptions = ref(['特斯拉', '比亚迪', '红旗', '奥迪', '宝马', '奔驰'])
const vehicleNameOptions = ref(['电动轿车', '混合动力SUV', '纯电动客车', '燃油货车'])
const productionAddressOptions = ref(['上海临港', '深圳坪山', '长春一汽', '北京亦庄'])
const provinceOptions = ref([
  '北京', '上海', '天津', '重庆', '河北', '山西', '辽宁', '吉林',
  '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西',
  '甘肃', '青海', '台湾', '内蒙古', '广西', '西藏',
  '宁夏', '新疆', '香港', '澳门'
])
const cityOptions = computed(() => {
  // 根据选择的省份动态生成城市选项
  return ['北京市', '上海市', '深圳市', '广州市', '杭州市', '成都市', '西安市', '武汉市']
})

// 企业选择相关事件处理

// 检查企业是否已经被选择
const isCompanySelected = (company: CompanyInfo): boolean => {
  return form.selectedCompanies.some(selected => {
    // 如果有企业代码，优先按代码匹配
    if (company.code && selected.code && company.code.trim() !== '') {
      return selected.code === company.code
    }
    // 否则按企业名称精确匹配
    if (company.name && selected.name && company.name.trim() !== '') {
      return selected.name === company.name
    }
    return false
  })
}

// 添加企业到选择列表
const addCompanyToSelection = (company: CompanyInfo) => {
  if (!isCompanySelected(company)) {
    form.selectedCompanies.push({ ...company })
    ElMessage.success(`已添加企业：${company.name}${company.code ? ` (${company.code})` : ''}`)
  } else {
    // 允许重复添加，但给出提示
    form.selectedCompanies.push({ ...company })
    ElMessage.info(`企业 ${company.name} 已重复添加，查询时将使用OR逻辑`)
  }
}

// 从选择列表中移除企业
const removeCompany = (index: number) => {
  const removed = form.selectedCompanies.splice(index, 1)[0]
  ElMessage.info(`已移除企业：${removed.name}`)
}

// 处理企业名称输入
const handleCompanyNameInput = (value: string) => {
  if (value.trim()) {
    // 根据企业名称搜索，显示匹配的企业（不过滤已选择的企业，允许重复选择）
    companySuggestions.value = companyDatabase.value.filter(company =>
      company.name.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 8) // 最多显示8个建议
    showCompanySuggestions.value = companySuggestions.value.length > 0
  } else {
    showCompanySuggestions.value = false
    companySuggestions.value = []
  }
}

// 处理企业代码输入
const handleCompanyCodeInput = (value: string) => {
  if (value.trim()) {
    // 根据企业代码搜索（不过滤已选择的企业，允许重复选择）
    const matchedCompanies = companyDatabase.value.filter(company =>
      company.code.toLowerCase().includes(value.toLowerCase())
    )

    companySuggestions.value = matchedCompanies.slice(0, 8)
    showCompanySuggestions.value = companySuggestions.value.length > 0

    // 如果找到完全匹配的企业代码，自动补全企业名称
    const exactMatch = companyDatabase.value.find(company =>
      company.code.toLowerCase() === value.toLowerCase()
    )
    if (exactMatch) {
      // 可以选择是否自动补全，这里暂时不自动补全，让用户手动选择
    }
  } else {
    showCompanySuggestions.value = false
    companySuggestions.value = []
  }
}

// 通过企业名称添加（支持部分匹配）
const addCompanyByName = () => {
  const name = form.companyNameInput.trim()
  if (!name) return

  // 检查是否有完全匹配的企业
  const exactMatch = companyDatabase.value.find(company =>
    company.name.toLowerCase() === name.toLowerCase()
  )

  if (exactMatch) {
    addCompanyToSelection(exactMatch)
  } else {
    // 添加部分匹配的企业
    const partialCompany: CompanyInfo = {
      code: '',
      name: name,
      isPartialMatch: true
    }
    addCompanyToSelection(partialCompany)
  }

  // 清空输入框
  form.companyNameInput = ''
  showCompanySuggestions.value = false
}

// 通过企业代码添加
const addCompanyByCode = () => {
  const code = form.companyCodeInput.trim()
  if (!code) return

  // 查找对应的企业
  const matchedCompany = companyDatabase.value.find(company =>
    company.code.toLowerCase() === code.toLowerCase()
  )

  if (matchedCompany) {
    addCompanyToSelection(matchedCompany)
  } else {
    // 添加未找到的企业代码
    const unknownCompany: CompanyInfo = {
      code: code,
      name: `企业代码: ${code}`,
      isPartialMatch: true
    }
    addCompanyToSelection(unknownCompany)
  }

  // 清空输入框
  form.companyCodeInput = ''
  showCompanySuggestions.value = false
}

// 从建议列表添加企业
const addCompanyFromSuggestion = (company: CompanyInfo) => {
  addCompanyToSelection(company)

  // 清空相关输入框
  if (form.companyNameInput) {
    form.companyNameInput = ''
  }
  if (form.companyCodeInput) {
    form.companyCodeInput = ''
  }

  showCompanySuggestions.value = false
}

// 添加所有建议的企业
const addAllSuggestions = () => {
  let addedCount = 0
  let duplicateCount = 0

  companySuggestions.value.forEach(company => {
    if (!isCompanySelected(company)) {
      form.selectedCompanies.push({ ...company })
      addedCount++
    } else {
      duplicateCount++
    }
  })

  if (addedCount > 0) {
    ElMessage.success(`已添加 ${addedCount} 个企业${duplicateCount > 0 ? `，跳过 ${duplicateCount} 个重复企业` : ''}`)
  } else {
    ElMessage.info('所有建议的企业都已存在')
  }

  // 清空输入框和建议
  form.companyNameInput = ''
  form.companyCodeInput = ''
  showCompanySuggestions.value = false
}

// 点击外部关闭建议框
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.enterprise-selection') && !target.closest('.vehicle-input-selection')) {
    showCompanySuggestions.value = false
    showVehicleModelSuggestions.value = false
    showVehicleBrandSuggestions.value = false
    showVehicleNameSuggestions.value = false
    showProductionAddressSuggestions.value = false
    showFuelTypeSuggestions.value = false
  }
}

// 车辆型号相关处理函数
const handleVehicleModelInput = (value: string) => {
  if (value.trim()) {
    vehicleModelSuggestions.value = vehicleModelOptions.value.filter(model =>
      model.toLowerCase().includes(value.toLowerCase()) &&
      !form.vehicleModels.includes(model)
    ).slice(0, 6)
    showVehicleModelSuggestions.value = vehicleModelSuggestions.value.length > 0
  } else {
    showVehicleModelSuggestions.value = false
  }
}

const addVehicleModel = () => {
  const model = form.vehicleModelInput.trim()
  if (!model) return

  if (!form.vehicleModels.includes(model)) {
    form.vehicleModels.push(model)
    ElMessage.success(`已添加车辆型号：${model}`)
  } else {
    ElMessage.warning('该车辆型号已存在')
  }

  form.vehicleModelInput = ''
  showVehicleModelSuggestions.value = false
}

const addVehicleModelFromSuggestion = (model: string) => {
  if (!form.vehicleModels.includes(model)) {
    form.vehicleModels.push(model)
    ElMessage.success(`已添加车辆型号：${model}`)
  }
  form.vehicleModelInput = ''
  showVehicleModelSuggestions.value = false
}

const removeVehicleModel = (index: number) => {
  const removed = form.vehicleModels.splice(index, 1)[0]
  ElMessage.info(`已移除车辆型号：${removed}`)
}

// 车辆品牌相关处理函数
const handleVehicleBrandInput = (value: string) => {
  if (value.trim()) {
    vehicleBrandSuggestions.value = vehicleBrandOptions.value.filter(brand =>
      brand.toLowerCase().includes(value.toLowerCase()) &&
      !form.vehicleBrands.includes(brand)
    ).slice(0, 6)
    showVehicleBrandSuggestions.value = vehicleBrandSuggestions.value.length > 0
  } else {
    showVehicleBrandSuggestions.value = false
  }
}

const addVehicleBrand = () => {
  const brand = form.vehicleBrandInput.trim()
  if (!brand) return

  if (!form.vehicleBrands.includes(brand)) {
    form.vehicleBrands.push(brand)
    ElMessage.success(`已添加车辆品牌：${brand}`)
  } else {
    ElMessage.warning('该车辆品牌已存在')
  }

  form.vehicleBrandInput = ''
  showVehicleBrandSuggestions.value = false
}

const addVehicleBrandFromSuggestion = (brand: string) => {
  if (!form.vehicleBrands.includes(brand)) {
    form.vehicleBrands.push(brand)
    ElMessage.success(`已添加车辆品牌：${brand}`)
  }
  form.vehicleBrandInput = ''
  showVehicleBrandSuggestions.value = false
}

const removeVehicleBrand = (index: number) => {
  const removed = form.vehicleBrands.splice(index, 1)[0]
  ElMessage.info(`已移除车辆品牌：${removed}`)
}

// 车辆名称相关处理函数
const handleVehicleNameInput = (value: string) => {
  if (value.trim()) {
    vehicleNameSuggestions.value = vehicleNameOptions.value.filter(name =>
      name.toLowerCase().includes(value.toLowerCase()) &&
      !form.vehicleNames.includes(name)
    ).slice(0, 6)
    showVehicleNameSuggestions.value = vehicleNameSuggestions.value.length > 0
  } else {
    showVehicleNameSuggestions.value = false
  }
}

const addVehicleName = () => {
  const name = form.vehicleNameInput.trim()
  if (!name) return

  if (!form.vehicleNames.includes(name)) {
    form.vehicleNames.push(name)
    ElMessage.success(`已添加车辆名称：${name}`)
  } else {
    ElMessage.warning('该车辆名称已存在')
  }

  form.vehicleNameInput = ''
  showVehicleNameSuggestions.value = false
}

const addVehicleNameFromSuggestion = (name: string) => {
  if (!form.vehicleNames.includes(name)) {
    form.vehicleNames.push(name)
    ElMessage.success(`已添加车辆名称：${name}`)
  }
  form.vehicleNameInput = ''
  showVehicleNameSuggestions.value = false
}

const removeVehicleName = (index: number) => {
  const removed = form.vehicleNames.splice(index, 1)[0]
  ElMessage.info(`已移除车辆名称：${removed}`)
}

// 生产地址相关处理函数
const handleProductionAddressInput = (value: string) => {
  if (value.trim()) {
    productionAddressSuggestions.value = productionAddressOptions.value.filter(address =>
      address.toLowerCase().includes(value.toLowerCase()) &&
      !form.productionAddresses.includes(address)
    ).slice(0, 6)
    showProductionAddressSuggestions.value = productionAddressSuggestions.value.length > 0
  } else {
    showProductionAddressSuggestions.value = false
  }
}

const addProductionAddress = () => {
  const address = form.productionAddressInput.trim()
  if (!address) return

  if (!form.productionAddresses.includes(address)) {
    form.productionAddresses.push(address)
    ElMessage.success(`已添加生产地址：${address}`)
  } else {
    ElMessage.warning('该生产地址已存在')
  }

  form.productionAddressInput = ''
  showProductionAddressSuggestions.value = false
}

const addProductionAddressFromSuggestion = (address: string) => {
  if (!form.productionAddresses.includes(address)) {
    form.productionAddresses.push(address)
    ElMessage.success(`已添加生产地址：${address}`)
  }
  form.productionAddressInput = ''
  showProductionAddressSuggestions.value = false
}

const removeProductionAddress = (index: number) => {
  const removed = form.productionAddresses.splice(index, 1)[0]
  ElMessage.info(`已移除生产地址：${removed}`)
}

// 燃料种类相关处理函数
const fuelTypeOptions = ref(['电', '油', '汽油', '柴油', '天然气', '混合动力', '氢能', '纯电动', '插电式混合动力'])

const handleFuelTypeInput = (value: string) => {
  if (value.trim()) {
    fuelTypeSuggestions.value = fuelTypeOptions.value.filter(fuel =>
      fuel.toLowerCase().includes(value.toLowerCase()) &&
      !form.fuelTypes.includes(fuel)
    ).slice(0, 6)
    showFuelTypeSuggestions.value = fuelTypeSuggestions.value.length > 0
  } else {
    showFuelTypeSuggestions.value = false
  }
}

const addFuelType = () => {
  const fuel = form.fuelTypeInput.trim()
  if (!fuel) return

  if (!form.fuelTypes.includes(fuel)) {
    form.fuelTypes.push(fuel)
    ElMessage.success(`已添加燃料种类：${fuel}`)
  } else {
    ElMessage.warning('该燃料种类已存在')
  }

  form.fuelTypeInput = ''
  showFuelTypeSuggestions.value = false
}

const addFuelTypeFromSuggestion = (fuel: string) => {
  if (!form.fuelTypes.includes(fuel)) {
    form.fuelTypes.push(fuel)
    ElMessage.success(`已添加燃料种类：${fuel}`)
  }
  form.fuelTypeInput = ''
  showFuelTypeSuggestions.value = false
}

const removeFuelType = (index: number) => {
  const removed = form.fuelTypes.splice(index, 1)[0]
  ElMessage.info(`已移除燃料种类：${removed}`)
}

// 生命周期钩子
onMounted(() => {
  document.addEventListener('click', handleClickOutside)

  // 获取企业列表数据
  fetchCompanies()

  // 获取省份列表数据
  fetchProvinces()

  // 开发环境下的初始化逻辑
  if (import.meta.env.DEV) {
    // 开发环境特定的初始化代码
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 时间范围选择事件处理
const handleTimeRangeChange = (value: [string, string] | null) => {
  timeRange.value = value
  console.log('时间范围变化:', value)
}

// 移除复杂的时间处理函数

const handleAddCondition = () => {
  // 验证必要条件
  const condition: any = {}

  // 收集所有非空条件
  if (form.selectedCompanies.length > 0) {
    condition.selectedCompanies = [...form.selectedCompanies]
    // 为了兼容性，也提取企业名称和代码
    condition.companyNames = form.selectedCompanies.map(c => c.name).filter(name => name.trim())
    condition.companyCodes = form.selectedCompanies.map(c => c.code).filter(code => code.trim())
  }
  if (form.vehicleModels.length > 0) condition.vehicleModels = [...form.vehicleModels]
  if (form.vehicleBrands.length > 0) condition.vehicleBrands = [...form.vehicleBrands]
  if (form.vehicleNames.length > 0) condition.vehicleNames = [...form.vehicleNames]

  // 时间范围相关参数
  if (timeRange.value) {
    condition.timeRange = {
      startDate: timeRange.value[0],
      endDate: timeRange.value[1]
    }
  }
  if (form.quickTimeRange) condition.quickTimeRange = form.quickTimeRange
  if (form.viewDimension) condition.viewDimension = form.viewDimension
  if (form.enableComparison) condition.enableComparison = form.enableComparison
  if (form.productionAddresses.length > 0) condition.productionAddresses = [...form.productionAddresses]
  if (form.productionProvinces.length > 0) condition.productionProvinces = [...form.productionProvinces]
  if (form.productionCities.length > 0) condition.productionCities = [...form.productionCities]
  if (form.sixCategories.length > 0) condition.sixCategories = [...form.sixCategories]
  if (form.commercialOrPassenger) condition.commercialOrPassenger = form.commercialOrPassenger
  if (form.fuelTypes.length > 0) condition.fuelTypes = [...form.fuelTypes]
  if (form.newEnergyCategories.length > 0) condition.newEnergyCategories = [...form.newEnergyCategories]
  if (form.isNewEnergy) condition.isNewEnergy = form.isNewEnergy
  if (form.showRanking) condition.showRanking = form.showRanking

  // 添加前提条件
  condition.vehicleClass = [...form.vehicleClass]
  condition.excludeNonAnnouncement = form.excludeNonAnnouncement

  // 检查是否有有效的查询条件（排除前提条件）
  const hasValidCondition = Object.keys(condition).some(key =>
    !['vehicleClass', 'excludeNonAnnouncement'].includes(key) &&
    condition[key] !== undefined &&
    condition[key] !== '' &&
    condition[key] !== false &&
    (Array.isArray(condition[key]) ? condition[key].length > 0 : true)
  )

  if (!hasValidCondition) {
    ElMessage.warning('请至少选择一个查询条件（企业、车辆信息、时间范围等）')
    return
  }

  emit('add-condition', condition)
  ElMessage.success('条件已添加')
}

const handleReset = () => {
  // 重置为默认值
  Object.assign(form, {
    vehicleClass: [],
    excludeNonAnnouncement: true,
    showRanking: false,
    selectedCompanies: [],
    companyNameInput: '',
    companyCodeInput: '',
    vehicleModels: [],
    vehicleModelInput: '',
    vehicleBrands: [],
    vehicleBrandInput: '',
    vehicleNames: [],
    vehicleNameInput: '',

    // 时间范围选择重置
    quickTimeRange: '',
    viewDimension: 'total',
    enableComparison: false,

    productionAddresses: [],
    productionAddressInput: '',
    productionProvinces: [],
    productionCities: [],
    sixCategories: [],
    commercialOrPassenger: '',
    fuelTypes: [],
    fuelTypeInput: '',
    newEnergyCategories: [],
    isNewEnergy: ''
  })

  // 重置时间范围
  timeRange.value = null

  // 重置所有建议
  showCompanySuggestions.value = false
  companySuggestions.value = []
  showVehicleModelSuggestions.value = false
  vehicleModelSuggestions.value = []
  showVehicleBrandSuggestions.value = false
  vehicleBrandSuggestions.value = []
  showVehicleNameSuggestions.value = false
  vehicleNameSuggestions.value = []
  showProductionAddressSuggestions.value = false
  productionAddressSuggestions.value = []
  showFuelTypeSuggestions.value = false
  fuelTypeSuggestions.value = []

  emit('reset')
  ElMessage.success('表单已重置')
}
</script>

<style scoped>
.certificate-search-conditions {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.preset-conditions {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.time-range-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comparison-container {
  display: flex;
  align-items: center;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 企业选择样式 */
.enterprise-selection {
  position: relative;
  width: 100%;
}

/* 车辆输入选择样式 */
.vehicle-input-selection {
  position: relative;
  width: 100%;
}

.selected-companies {
  margin-bottom: 12px;
  min-height: 32px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.company-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.company-tag-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.company-name {
  font-weight: 500;
}

.company-code {
  font-size: 12px;
  opacity: 0.8;
}

.partial-match-hint {
  font-size: 11px;
  opacity: 0.7;
  font-style: italic;
}

.enterprise-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.enterprise-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-top: 2px;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-header {
  padding: 8px 12px;
  font-size: 12px;
  color: #909399;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.suggestion-list {
  max-height: 160px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f5f7fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.company-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.suggestion-item .company-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.suggestion-item .company-code {
  font-size: 12px;
  color: #909399;
  background-color: #f0f2f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.add-icon {
  color: #409eff;
  font-size: 16px;
  margin-left: 8px;
}

.loading-companies {
  padding: 12px;
  text-align: center;
  color: #909399;
  font-size: 14px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 8px;
}

.loading-companies .el-icon {
  margin-right: 8px;
}

/* 通用选择项样式 */
.selected-items {
  margin-bottom: 8px;
  min-height: 28px;
  padding: 6px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.item-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 999;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-top: 2px;
  max-height: 180px;
  overflow-y: auto;
}

.suggestion-header {
  padding: 6px 10px;
  font-size: 12px;
  color: #909399;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.suggestion-list {
  max-height: 140px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 6px 10px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestion-item:hover {
  background-color: #f5f7fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-text {
  font-size: 14px;
  color: #303133;
  flex: 1;
}

.suggestion-item .add-icon {
  color: #409eff;
  font-size: 14px;
  margin-left: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .enterprise-input-group {
    flex-direction: column;
    gap: 8px;
  }

  .enterprise-input-group .el-input {
    margin-left: 0 !important;
  }
}

@media (max-width: 768px) {
  .enterprise-selection {
    width: 100%;
  }

  .enterprise-input-group {
    flex-direction: column;
  }
}
</style>

<style scoped>
.certificate-search-conditions {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.preset-conditions {
  margin-bottom: 20px;
}

.enterprise-selection {
  width: 100%;
}

.selected-companies {
  margin-bottom: 10px;
}

.company-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.company-tag-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.company-name {
  font-weight: 500;
}

.company-code {
  font-size: 12px;
  color: #909399;
}

.partial-match-hint {
  font-size: 11px;
  color: #e6a23c;
}

.enterprise-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.loading-companies {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
  padding: 10px 0;
}

.enterprise-suggestions,
.suggestions {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.suggestion-header {
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 12px;
  color: #606266;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestion-list {
  max-height: 160px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-item:hover {
  background: #f5f7fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.company-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.company-info .company-name {
  font-size: 14px;
  color: #303133;
}

.company-info .company-code {
  font-size: 12px;
  color: #909399;
}

.suggestion-text {
  font-size: 14px;
  color: #303133;
}

.add-icon {
  color: #409eff;
  font-size: 16px;
}

.vehicle-input-selection {
  width: 100%;
}

.selected-items {
  margin-bottom: 8px;
}

.item-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 时间范围选择样式 */
.time-range-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.time-range-container .el-select,
.time-range-container .el-date-editor {
  flex-shrink: 0;
}

.time-range-container .el-switch {
  flex-shrink: 0;
}

.time-range-container .el-switch .el-switch__label {
  font-size: 12px;
  color: #606266;
}

.time-range-container .el-switch.is-checked .el-switch__label {
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .enterprise-input-group {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
  }

  .time-range-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>