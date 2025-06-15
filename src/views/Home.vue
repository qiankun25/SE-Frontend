<template>
    <div class="home">
        <div class="header">
            <div class="welcome">
                <h2>欢迎使用汽车企业查询系统</h2>
            </div>
            <div class="actions">
                <el-button type="primary" @click="handleExport">导出数据</el-button>
                <el-button @click="handleLogout">退出登录</el-button>
            </div>
        </div>

        <div class="main-content">
            <search-conditions ref="searchConditionsRef" @search="handleSearch" @remove="handleRemoveCondition" />
            <display-fields @fields-change="handleFieldsChange" />
            <company-table :data="filteredData" :selected-fields="selectedFields" :time-range="currentTimeRange"
                :loading="loading" @sort="handleSort" @page-change="handlePageChange" @size-change="handleSizeChange" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SearchConditions from '../components/SearchConditions.vue'
import DisplayFields from '../components/DisplayFields.vue'
import CompanyTable from '../components/CompanyTable.vue'
import type { Company } from '../types/company'
import { exportToExcel } from '../utils/export'

const router = useRouter()
const searchConditionsRef = ref()

// 数据状态
const companiesData = ref<Company[]>([])
const originalData = ref<Company[]>([]) // 添加原始数据存储
const loading = ref(false)
const hasSearched = ref(false) // 添加搜索状态标记
const selectedFields = ref<string[]>([
    'company_id', 'company_name', 'social_credit_code', 'company_type',
    'national_standard_industry', 'registered_address', 'subsidiaries',
    'production_addresses', 'vehicle_brand'
])
const currentTimeRange = ref<[Date, Date] | undefined>(undefined)
const currentPage = ref(1)
const pageSize = ref(10)
const sortField = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 过滤后的数据 - 只有搜索后才显示数据
const filteredData = computed(() => {
    if (!hasSearched.value) {
        return [] // 未搜索时返回空数组
    }
    console.log('计算 filteredData，当前数据：', companiesData.value)
    return companiesData.value
})

// 处理搜索
const handleSearch = (conditions: any[]) => {
    console.log('开始搜索，搜索条件：', conditions)
    currentPage.value = 1
    hasSearched.value = true // 标记已经进行过搜索

    // 如果没有搜索条件，显示空数据
    if (conditions.length === 0) {
        companiesData.value = []
        currentTimeRange.value = undefined
        return
    }

    // 更新当前时间范围
    let timeRange: [Date, Date] | undefined = undefined
    conditions.forEach(condition => {
        if (condition.timeRange) {
            timeRange = condition.timeRange
        }
    })
    currentTimeRange.value = timeRange

    // 从原始数据中过滤企业级数据
    let filtered = originalData.value.filter(company => {
        console.log('正在检查企业：', company.company_name)
        return conditions.every((condition: any) => {
            // 企业名称匹配
            if (condition.company_name && condition.company_name !== '') {
                const nameMatch = company.company_name.includes(condition.company_name)
                console.log('企业名称匹配：', company.company_name, condition.company_name, nameMatch)
                if (!nameMatch) return false
            }

            // 国标行业分类匹配
            if (condition.national_standard_industry && condition.national_standard_industry !== '') {
                const industryMatch = company.national_standard_industry === condition.national_standard_industry
                console.log('行业分类匹配：', company.company_name, company.national_standard_industry, condition.national_standard_industry, industryMatch)
                if (!industryMatch) return false
            }

            // 新能源类别匹配
            if (condition.new_energy && condition.new_energy !== '') {
                const hasMatchingVehicle = company.vehicles.some(vehicle => {
                    if (condition.new_energy === 'null') {
                        return vehicle.new_energy === null
                    }
                    return vehicle.new_energy === condition.new_energy
                })
                console.log('新能源类别匹配：', company.company_name, condition.new_energy, hasMatchingVehicle)
                if (!hasMatchingVehicle) return false
            }

            // 车辆类别匹配
            if (condition.vehicle_category && condition.vehicle_category !== '') {
                const hasMatchingCategory = company.vehicles.some(vehicle =>
                    vehicle.vehicle_category === condition.vehicle_category
                )
                console.log('车辆类别匹配：', company.company_name, condition.vehicle_category, hasMatchingCategory)
                if (!hasMatchingCategory) return false
            }

            // 车辆类型匹配（整车/底盘）
            if (condition.vehicle_type && condition.vehicle_type !== '') {
                const isCompleteVehicle = company.national_standard_industry.includes('整车制造')
                const typeMatch = (condition.vehicle_type === '整车' && isCompleteVehicle) ||
                    (condition.vehicle_type === '底盘' && !isCompleteVehicle)
                console.log('车辆类型匹配：', company.company_name, condition.vehicle_type, typeMatch)
                if (!typeMatch) return false
            }

            return true
        })
    })

    // 对车辆级数据进行过滤
    filtered = filtered.map(company => {
        // 创建企业对象的深拷贝
        const newCompany = {
            ...company,
            vehicles: [...company.vehicles]
        }

        // 步骤1：车辆级过滤（基于新能源类别和车辆类别）
        const vehicleConditions = conditions.filter(condition =>
            condition.new_energy || condition.vehicle_category
        )

        if (vehicleConditions.length > 0) {
            newCompany.vehicles = newCompany.vehicles.filter(vehicle => {
                return vehicleConditions.every(condition => {
                    // 新能源类别匹配
                    if (condition.new_energy && condition.new_energy !== '') {
                        if (condition.new_energy === 'null') {
                            if (vehicle.new_energy !== null) return false
                        } else {
                            if (vehicle.new_energy !== condition.new_energy) return false
                        }
                    }

                    // 车辆类别匹配
                    if (condition.vehicle_category && condition.vehicle_category !== '') {
                        if (vehicle.vehicle_category !== condition.vehicle_category) return false
                    }

                    return true
                })
            })
        }

        // 步骤2：合格证级过滤（基于时间范围）
        newCompany.vehicles = newCompany.vehicles.map(vehicle => {
            const newVehicle = { ...vehicle };

            // 不在这里过滤certificate_count数据，只传递原始数据和时间范围
            // 让CompanyTable组件负责根据时间范围计算合格证数量

            return newVehicle;
        });

        return newCompany
    })

    console.log('过滤后数据量：', filtered.length)
    console.log('过滤后数据：', filtered)

    // 更新过滤后的数据
    companiesData.value = filtered
}


// 处理移除条件
const handleRemoveCondition = (index: number) => {
    // 如果移除的是时间范围条件，清空当前时间范围
    if (searchConditionsRef.value?.selectedConditions[index]?.timeRange) {
        currentTimeRange.value = undefined
    }

    // 如果没有搜索条件了，清空数据显示
    if (searchConditionsRef.value?.selectedConditions.length === 0) {
        companiesData.value = []
        hasSearched.value = false // 重置搜索状态
    }
}

// 处理字段变化
const handleFieldsChange = (fields: string[]) => {
    selectedFields.value = fields
}

// 处理排序
const handleSort = (field: string, order: 'asc' | 'desc') => {
    sortField.value = field
    sortOrder.value = order
}

// 处理分页
const handlePageChange = (page: number) => {
    currentPage.value = page
}

// 处理每页条数变化
const handleSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
}

// 导出数据
const handleExport = () => {
    if (filteredData.value.length === 0) {
        ElMessage.warning('没有可导出的数据')
        return
    }

    // 准备导出数据
    const exportData = filteredData.value.map(company => {
        const row: Record<string, any> = {}
        selectedFields.value.forEach(field => {
            switch (field) {
                case 'subsidiaries':
                    row['子公司名称'] = company.subsidiaries?.map((sub: any) => sub.company_name).join(', ') || ''
                    break
                case 'production_addresses':
                    row['生产基地信息'] = company.production_addresses?.map((addr: any) => `${addr.address}(${addr.capacity}万辆)`).join(', ') || ''
                    break
                case 'vehicle_brand':
                    row['车辆信息'] = company.vehicles?.map((vehicle: any) => `${vehicle.vehicle_brand}-${vehicle.vehicle_category}${vehicle.new_energy ? `(${vehicle.new_energy})` : ''}`).join(', ') || ''
                    break
                default:
                    row[field] = company[field as keyof Company]
            }
        })
        return row
    })

    // 准备表头
    const headers = selectedFields.value.map(field => {
        const headerMap: Record<string, string> = {
            company_id: '企业ID',
            company_name: '企业名称',
            social_credit_code: '企业代码',
            company_type: '企业类型',
            national_standard_industry: '国标行业分类',
            registered_address: '注册地址',
            subsidiaries: '子公司名称',
            production_addresses: '生产基地信息',
            vehicle_brand: '车辆信息'
        }
        return headerMap[field] || field
    })

    // 导出Excel
    exportToExcel(exportData, headers, '汽车企业数据')
}

// 退出登录
const handleLogout = () => {
    router.push('/login')
}

// 初始化
onMounted(async () => {
    try {
        loading.value = true
        // 导入数据
        const { companiesData: data } = await import('../datas/companiesData.js')
        originalData.value = data // 保存原始数据
        // 不设置 companiesData.value，保持为空数组，只有搜索后才显示数据
        console.log('数据加载完成，总数据量：', originalData.value.length)
        console.log('示例数据：', originalData.value[0])
    } catch (error) {
        console.error('数据加载失败：', error)
        ElMessage.error('获取数据失败')
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.home {
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.welcome h2 {
    margin: 0;
    color: #303133;
}

.actions {
    display: flex;
    gap: 10px;
}

.main-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
</style>
