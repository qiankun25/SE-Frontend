<template>
  <div class="region-selector">
    <el-form-item :label="label" :prop="prop">
      <div class="selector-container">
        <!-- 省份选择 -->
        <el-select
          v-model="selectedProvince"
          placeholder="请选择省份"
          clearable
          filterable
          @change="handleProvinceChange"
          style="width: 150px; margin-right: 10px"
        >
          <el-option
            v-for="province in provinces"
            :key="province.code"
            :label="province.name"
            :value="province.code"
          />
        </el-select>

        <!-- 城市选择 -->
        <el-select
          v-model="selectedCity"
          placeholder="请选择城市"
          clearable
          filterable
          :disabled="!selectedProvince"
          @change="handleCityChange"
          style="width: 150px; margin-right: 10px"
        >
          <el-option
            v-for="city in cities"
            :key="city.code"
            :label="city.name"
            :value="city.code"
          />
        </el-select>

        <!-- 区县选择 -->
        <el-select
          v-if="showDistrict"
          v-model="selectedDistrict"
          placeholder="请选择区县"
          clearable
          filterable
          :disabled="!selectedCity"
          @change="handleDistrictChange"
          style="width: 150px"
        >
          <el-option
            v-for="district in districts"
            :key="district.code"
            :label="district.name"
            :value="district.code"
          />
        </el-select>

        <!-- 手动输入选项 -->
        <div v-if="allowManualInput" class="manual-input">
          <el-input
            v-model="manualInput"
            placeholder="或手动输入地址关键词"
            clearable
            @input="handleManualInput"
            style="width: 200px; margin-left: 10px"
          />
        </div>
      </div>
    </el-form-item>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'

interface RegionItem {
  code: string
  name: string
  children?: RegionItem[]
}

interface RegionValue {
  province?: string
  city?: string
  district?: string
  manual?: string
}

interface Props {
  modelValue?: RegionValue
  label?: string
  prop?: string
  showDistrict?: boolean
  allowManualInput?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: RegionValue | undefined): void
  (e: 'change', value: RegionValue | undefined): void
}

const props = withDefaults(defineProps<Props>(), {
  label: '地区选择',
  showDistrict: false,
  allowManualInput: true
})

const emit = defineEmits<Emits>()

// 响应式数据
const selectedProvince = ref<string>('')
const selectedCity = ref<string>('')
const selectedDistrict = ref<string>('')
const manualInput = ref<string>('')

// 省份数据（简化版，实际项目中应该从API获取）
const provinces: RegionItem[] = [
  {
    code: '110000',
    name: '北京市',
    children: [
      { code: '110100', name: '北京市' }
    ]
  },
  {
    code: '120000',
    name: '天津市',
    children: [
      { code: '120100', name: '天津市' }
    ]
  },
  {
    code: '130000',
    name: '河北省',
    children: [
      { code: '130100', name: '石家庄市' },
      { code: '130200', name: '唐山市' },
      { code: '130300', name: '秦皇岛市' },
      { code: '130400', name: '邯郸市' },
      { code: '130500', name: '邢台市' },
      { code: '130600', name: '保定市' },
      { code: '130700', name: '张家口市' },
      { code: '130800', name: '承德市' },
      { code: '130900', name: '沧州市' },
      { code: '131000', name: '廊坊市' },
      { code: '131100', name: '衡水市' }
    ]
  },
  {
    code: '140000',
    name: '山西省',
    children: [
      { code: '140100', name: '太原市' },
      { code: '140200', name: '大同市' },
      { code: '140300', name: '阳泉市' },
      { code: '140400', name: '长治市' },
      { code: '140500', name: '晋城市' },
      { code: '140600', name: '朔州市' },
      { code: '140700', name: '晋中市' },
      { code: '140800', name: '运城市' },
      { code: '140900', name: '忻州市' },
      { code: '141000', name: '临汾市' },
      { code: '141100', name: '吕梁市' }
    ]
  },
  {
    code: '210000',
    name: '辽宁省',
    children: [
      { code: '210100', name: '沈阳市' },
      { code: '210200', name: '大连市' },
      { code: '210300', name: '鞍山市' },
      { code: '210400', name: '抚顺市' },
      { code: '210500', name: '本溪市' },
      { code: '210600', name: '丹东市' },
      { code: '210700', name: '锦州市' },
      { code: '210800', name: '营口市' },
      { code: '210900', name: '阜新市' },
      { code: '211000', name: '辽阳市' },
      { code: '211100', name: '盘锦市' },
      { code: '211200', name: '铁岭市' },
      { code: '211300', name: '朝阳市' },
      { code: '211400', name: '葫芦岛市' }
    ]
  },
  {
    code: '310000',
    name: '上海市',
    children: [
      { code: '310100', name: '上海市' }
    ]
  },
  {
    code: '320000',
    name: '江苏省',
    children: [
      { code: '320100', name: '南京市' },
      { code: '320200', name: '无锡市' },
      { code: '320300', name: '徐州市' },
      { code: '320400', name: '常州市' },
      { code: '320500', name: '苏州市' },
      { code: '320600', name: '南通市' },
      { code: '320700', name: '连云港市' },
      { code: '320800', name: '淮安市' },
      { code: '320900', name: '盐城市' },
      { code: '321000', name: '扬州市' },
      { code: '321100', name: '镇江市' },
      { code: '321200', name: '泰州市' },
      { code: '321300', name: '宿迁市' }
    ]
  },
  {
    code: '330000',
    name: '浙江省',
    children: [
      { code: '330100', name: '杭州市' },
      { code: '330200', name: '宁波市' },
      { code: '330300', name: '温州市' },
      { code: '330400', name: '嘉兴市' },
      { code: '330500', name: '湖州市' },
      { code: '330600', name: '绍兴市' },
      { code: '330700', name: '金华市' },
      { code: '330800', name: '衢州市' },
      { code: '330900', name: '舟山市' },
      { code: '331000', name: '台州市' },
      { code: '331100', name: '丽水市' }
    ]
  },
  {
    code: '440000',
    name: '广东省',
    children: [
      { code: '440100', name: '广州市' },
      { code: '440200', name: '韶关市' },
      { code: '440300', name: '深圳市' },
      { code: '440400', name: '珠海市' },
      { code: '440500', name: '汕头市' },
      { code: '440600', name: '佛山市' },
      { code: '440700', name: '江门市' },
      { code: '440800', name: '湛江市' },
      { code: '440900', name: '茂名市' },
      { code: '441200', name: '肇庆市' },
      { code: '441300', name: '惠州市' },
      { code: '441400', name: '梅州市' },
      { code: '441500', name: '汕尾市' },
      { code: '441600', name: '河源市' },
      { code: '441700', name: '阳江市' },
      { code: '441800', name: '清远市' },
      { code: '441900', name: '东莞市' },
      { code: '442000', name: '中山市' },
      { code: '445100', name: '潮州市' },
      { code: '445200', name: '揭阳市' },
      { code: '445300', name: '云浮市' }
    ]
  }
]

// 计算城市列表
const cities = computed(() => {
  if (!selectedProvince.value) return []
  const province = provinces.find(p => p.code === selectedProvince.value)
  return province?.children || []
})

// 计算区县列表（这里简化处理，实际项目中需要更详细的数据）
const districts = computed(() => {
  if (!selectedCity.value) return []
  // 这里应该根据选中的城市返回对应的区县数据
  return []
})

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedProvince.value = newValue.province || ''
    selectedCity.value = newValue.city || ''
    selectedDistrict.value = newValue.district || ''
    manualInput.value = newValue.manual || ''
  } else {
    selectedProvince.value = ''
    selectedCity.value = ''
    selectedDistrict.value = ''
    manualInput.value = ''
  }
}, { immediate: true })

// 处理省份变化
const handleProvinceChange = (value: string) => {
  selectedCity.value = ''
  selectedDistrict.value = ''
  emitValue()
}

// 处理城市变化
const handleCityChange = (value: string) => {
  selectedDistrict.value = ''
  emitValue()
}

// 处理区县变化
const handleDistrictChange = () => {
  emitValue()
}

// 处理手动输入
const handleManualInput = () => {
  // 如果有手动输入，清空选择器
  if (manualInput.value) {
    selectedProvince.value = ''
    selectedCity.value = ''
    selectedDistrict.value = ''
  }
  emitValue()
}

// 发送值变化事件
const emitValue = () => {
  const value: RegionValue | undefined = 
    selectedProvince.value || selectedCity.value || selectedDistrict.value || manualInput.value
      ? {
          province: selectedProvince.value || undefined,
          city: selectedCity.value || undefined,
          district: selectedDistrict.value || undefined,
          manual: manualInput.value || undefined
        }
      : undefined

  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.region-selector {
  width: 100%;
}

.selector-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.manual-input {
  margin-left: 10px;
}
</style>
