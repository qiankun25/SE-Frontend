<template>
  <div class="certificate-search-conditions">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件设置</span>
          <el-button type="text" @click="showPresetConditions = !showPresetConditions">
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
          <el-col :span="8">
            <company-auto-complete v-model="form.companies" label="企业选择" placeholder="请输入企业代码或企业名称" :multiple="true"
              :allow-batch-import="true" @change="handleCompanyChange" />
          </el-col>

          <!-- 车辆型号 -->
          <el-col :span="8">
            <el-form-item label="车辆型号">
              <el-select v-model="form.vehicleModels" multiple filterable allow-create placeholder="请输入车辆型号"
                style="width: 100%">
                <el-option v-for="model in vehicleModelOptions" :key="model" :label="model" :value="model" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 车辆品牌 -->
          <el-col :span="8">
            <el-form-item label="车辆品牌">
              <el-select v-model="form.vehicleBrands" multiple filterable allow-create placeholder="请输入车辆品牌"
                style="width: 100%">
                <el-option v-for="brand in vehicleBrandOptions" :key="brand" :label="brand" :value="brand" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 车辆名称 -->
          <el-col :span="8">
            <el-form-item label="车辆名称">
              <el-select v-model="form.vehicleNames" multiple filterable allow-create placeholder="请输入车辆名称（模糊查询）"
                style="width: 100%">
                <el-option v-for="name in vehicleNameOptions" :key="name" :label="name" :value="name" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 时间范围 -->
          <el-col :span="8">
            <el-form-item label="时间范围">
              <div class="time-range-container">
                <el-select v-model="form.timeRangeType" placeholder="选择时间类型" style="width: 100%; margin-bottom: 8px;"
                  @change="handleTimeRangeTypeChange">
                  <el-option label="总量" value="total" />
                  <el-option label="近两年" value="recent2years" />
                  <el-option label="近六月" value="recent6months" />
                  <el-option label="今年" value="thisYear" />
                  <el-option label="去年" value="lastYear" />
                  <el-option label="自定义" value="custom" />
                </el-select>

                <el-select v-if="form.timeRangeType !== 'total'" v-model="form.timeUnit" placeholder="选择时间单位"
                  style="width: 100%; margin-bottom: 8px;">
                  <el-option label="年" value="year" />
                  <el-option label="月" value="month" />
                  <el-option label="日" value="day" />
                </el-select>

                <el-date-picker v-if="form.timeRangeType === 'custom'" v-model="form.customTimeRange" type="daterange"
                  range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" />
              </div>
            </el-form-item>
          </el-col>

          <!-- 同期比 -->
          <el-col :span="8">
            <el-form-item label="同期比">
              <div class="comparison-container">
                <el-switch v-model="form.enableComparison" @change="handleComparisonChange" />
                <el-text v-if="!form.timeRangeType" type="info" size="small" style="margin-left: 8px;">
                  请先选择时间范围
                </el-text>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 生产地址 -->
          <el-col :span="8">
            <el-form-item label="生产地址">
              <el-select v-model="form.productionAddresses" multiple filterable allow-create placeholder="请输入生产地址（模糊查询）"
                style="width: 100%">
                <el-option v-for="address in productionAddressOptions" :key="address" :label="address"
                  :value="address" />
              </el-select>
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
              <el-select v-model="form.fuelTypes" multiple filterable allow-create placeholder="请输入燃料种类（模糊查询）"
                style="width: 100%">
                <el-option label="电" value="电" />
                <el-option label="油" value="油" />
                <el-option label="汽油" value="汽油" />
                <el-option label="柴油" value="柴油" />
                <el-option label="天然气" value="天然气" />
                <el-option label="混合动力" value="混合动力" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 新能源类别 -->
          <el-col :span="8">
            <el-form-item label="新能源类别">
              <el-select v-model="form.newEnergyCategories" multiple placeholder="请选择新能源类别" style="width: 100%">
                <el-option label="纯电动" value="纯电动" />
                <el-option label="插电式" value="插电式" />
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
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import CompanyAutoComplete from './CompanyAutoComplete.vue'

interface SearchForm {
  // 前提条件
  vehicleClass: string[]
  excludeNonAnnouncement: boolean

  // 主要查询条件
  companies: any[]
  vehicleModels: string[]
  vehicleBrands: string[]
  vehicleNames: string[]
  timeRangeType: string
  timeUnit: string
  customTimeRange: [Date, Date] | null
  enableComparison: boolean
  productionAddresses: string[]
  productionProvinces: string[]
  productionCities: string[]
  sixCategories: string[]
  commercialOrPassenger: string
  fuelTypes: string[]
  newEnergyCategories: string[]
  isNewEnergy: string
  showRanking: boolean
}

const emit = defineEmits(['add-condition', 'reset'])

// 响应式数据
const showPresetConditions = ref(false)

const form = reactive<SearchForm>({
  // 前提条件默认值
  vehicleClass: [],
  excludeNonAnnouncement: true,
  showRanking: false,

  // 主要查询条件
  companies: [],
  vehicleModels: [],
  vehicleBrands: [],
  vehicleNames: [],
  timeRangeType: '',
  timeUnit: 'year',
  customTimeRange: null,
  enableComparison: false,
  productionAddresses: [],
  productionProvinces: [],
  productionCities: [],
  sixCategories: [],
  commercialOrPassenger: '',
  fuelTypes: [],
  newEnergyCategories: [],
  isNewEnergy: ''
})

// 选项数据
const vehicleModelOptions = ref(['Model S', 'Model 3', 'Model X', 'Model Y', 'H9', '汉EV'])
const vehicleBrandOptions = ref(['特斯拉', '比亚迪', '红旗', '奥迪', '宝马', '奔驰'])
const vehicleNameOptions = ref(['电动轿车', '混合动力SUV', '纯电动客车', '燃油货车'])
const productionAddressOptions = ref(['上海临港', '深圳坪山', '长春一汽', '北京亦庄'])
const provinceOptions = ref([
  '北京市', '上海市', '天津市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省',
  '黑龙江省', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
  '湖北省', '湖南省', '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省',
  '甘肃省', '青海省', '台湾省', '内蒙古自治区', '广西壮族自治区', '西藏自治区',
  '宁夏回族自治区', '新疆维吾尔自治区', '香港特别行政区', '澳门特别行政区'
])
const cityOptions = computed(() => {
  // 根据选择的省份动态生成城市选项
  return ['北京市', '上海市', '深圳市', '广州市', '杭州市', '成都市', '西安市', '武汉市']
})

// 事件处理
const handleCompanyChange = (companies: any[]) => {
  console.log('企业选择变化:', companies)
}

const handleTimeRangeTypeChange = (type: string) => {
  if (type === 'total') {
    form.timeUnit = ''
    form.customTimeRange = null
  }

  // 如果启用了同期比但没有选择时间范围，禁用同期比
  if (!type && form.enableComparison) {
    form.enableComparison = false
    ElMessage.warning('请先选择时间范围才能启用同期比')
  }
}

const handleComparisonChange = (enabled: boolean) => {
  if (enabled && !form.timeRangeType) {
    form.enableComparison = false
    ElMessage.warning('请先选择时间范围才能启用同期比')
  }
}

const handleAddCondition = () => {
  // 验证必要条件
  const condition: any = {}

  // 收集所有非空条件
  if (form.companies.length > 0) condition.companies = [...form.companies]
  if (form.vehicleModels.length > 0) condition.vehicleModels = [...form.vehicleModels]
  if (form.vehicleBrands.length > 0) condition.vehicleBrands = [...form.vehicleBrands]
  if (form.vehicleNames.length > 0) condition.vehicleNames = [...form.vehicleNames]
  if (form.timeRangeType) {
    condition.timeRangeType = form.timeRangeType
    condition.timeUnit = form.timeUnit
    if (form.customTimeRange) condition.customTimeRange = form.customTimeRange
  }
  if (form.enableComparison) condition.enableComparison = true
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

  if (Object.keys(condition).length <= 2) { // 只有前提条件
    ElMessage.warning('请至少选择一个查询条件')
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
    companies: [],
    vehicleModels: [],
    vehicleBrands: [],
    vehicleNames: [],
    timeRangeType: '',
    timeUnit: 'year',
    customTimeRange: null,
    enableComparison: false,
    productionAddresses: [],
    productionProvinces: [],
    productionCities: [],
    sixCategories: [],
    commercialOrPassenger: '',
    fuelTypes: [],
    newEnergyCategories: [],
    isNewEnergy: ''
  })

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
</style>
