<template>
    <div class="company-table">
        <el-table :data="processedData" :loading="loading" style="width: 100%" border @sort-change="handleSortChange">
            <template v-for="field in selectedFields" :key="field">
                <el-table-column v-if="field === 'company_id'" prop="company_id" label="企业ID" width="80" sortable />
                <el-table-column v-else-if="field === 'company_name'" prop="company_name" label="企业名称"
                    min-width="150" />
                <el-table-column v-else-if="field === 'social_credit_code'" prop="social_credit_code" label="企业代码"
                    width="150" />
                <el-table-column v-else-if="field === 'company_type'" prop="company_type" label="企业类型" width="150" />
                <el-table-column v-else-if="field === 'national_standard_industry'" prop="national_standard_industry"
                    label="国标行业分类" width="150" />
                <el-table-column v-else-if="field === 'registered_address'" prop="registered_address" label="注册地址"
                    min-width="200" />
                <el-table-column v-else-if="field === 'subsidiaries'" label="子公司名称" min-width="150">
                    <template #default="{ row }">
                        <div v-for="subsidiary in row.subsidiaries" :key="subsidiary.company_id">
                            {{ subsidiary.company_name }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column v-else-if="field === 'production_addresses'" label="生产基地名称" min-width="150">
                    <template #default="{ row }">
                        <div v-for="address in row.production_addresses" :key="address.address">
                            {{ address.address }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column v-else-if="field === 'capacity'" label="基地产能" width="100">
                    <template #default="{ row }">
                        <div v-for="address in row.production_addresses" :key="address.address">
                            {{ address.capacity }}万辆
                        </div>
                    </template>
                </el-table-column>
                <el-table-column v-else-if="field === 'vehicle_brand'" label="车辆品牌" width="120">
                    <template #default="{ row }">
                        <div v-for="vehicle in row.vehicles" :key="vehicle.vehicle_brand">
                            {{ vehicle.vehicle_brand }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column v-else-if="field === 'vehicle_category'" label="车辆类别" width="120">
                    <template #default="{ row }">
                        <div v-for="vehicle in row.vehicles" :key="vehicle.vehicle_category">
                            {{ vehicle.vehicle_category }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column v-else-if="field === 'new_energy'" label="能源类型" width="120">
                    <template #default="{ row }">
                        <div v-for="vehicle in row.vehicles" :key="vehicle.new_energy">
                            {{ vehicle.new_energy || '传统能源' }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column v-else-if="field === 'certificate_count'" label="合格证数量" width="120" sortable="custom">
                    <template #default="{ row }">
                        <div v-for="vehicle in row.vehicles" :key="vehicle.vehicle_brand">
                            {{ calculateCertificateCount(vehicle) }}
                        </div>
                    </template>
                </el-table-column>
            </template>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { companiesData } from '../datas/companiesData'

const props = defineProps({
    data: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    selectedFields: {
        type: Array,
        default: () => []
    },
    timeRange: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['sort-change', 'pagination-change'])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(companiesData.length)

// 处理数据展示
const processedData = computed(() => {
    return companiesData.map(company => {
        const processedCompany = { ...company }
        if (props.timeRange && props.timeRange.length === 2) {
            processedCompany.vehicles = company.vehicles.map(vehicle => ({
                ...vehicle,
                certificate_count: calculateCertificateCount(vehicle)
            }))
        }
        return processedCompany
    })
})

// 计算合格证数量
const calculateCertificateCount = (vehicle: any) => {
    if (!props.timeRange || props.timeRange.length !== 2) {
        return 0
    }

    const [startDate, endDate] = props.timeRange
    const start = new Date(startDate)
    const end = new Date(endDate)

    // 确保时间区间至少为一个月
    if (end.getTime() - start.getTime() < 30 * 24 * 60 * 60 * 1000) {
        end.setMonth(end.getMonth() + 1)
    }

    const certificateData = vehicle.certificate_count[0]
    let totalCount = 0

    certificateData.forEach((item: any) => {
        const [year, month] = item.time.split('-')
        const itemDate = new Date(parseInt(year), parseInt(month) - 1)

        if (itemDate >= start && itemDate <= end) {
            totalCount += item.count
        }
    })

    return totalCount
}

const handleSortChange = (sort: any) => {
    emit('sort-change', sort)
}

const handleSizeChange = (size: number) => {
    pageSize.value = size
    emit('pagination-change', {
        page: currentPage.value,
        size: pageSize.value
    })
}

const handleCurrentChange = (page: number) => {
    currentPage.value = page
    emit('pagination-change', {
        page: currentPage.value,
        size: pageSize.value
    })
}
</script>

<style scoped>
.company-table {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>