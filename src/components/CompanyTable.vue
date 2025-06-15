<template>
    <div class="company-table">
        <!-- 空状态提示 -->
        <div v-if="processedData.length === 0 && !loading" class="empty-state">
            <el-empty description="请添加搜索条件并点击搜索按钮来查看企业数据">
                <template #image>
                    <el-icon size="60" color="#c0c4cc">
                        <Search />
                    </el-icon>
                </template>
            </el-empty>
        </div>

        <!-- 数据表格 -->
        <div v-else>
            <el-table :data="processedData" :loading="loading" style="width: 100%" border
                @sort-change="handleSortChange">
                <template v-for="field in selectedFields" :key="field">
                    <el-table-column v-if="field === 'company_id'" prop="company_id" label="企业ID" width="80" sortable />
                    <el-table-column v-else-if="field === 'company_name'" prop="company_name" label="企业名称"
                        min-width="150" />
                    <el-table-column v-else-if="field === 'social_credit_code'" prop="social_credit_code" label="企业代码"
                        width="150" />
                    <el-table-column v-else-if="field === 'company_type'" prop="company_type" label="企业类型"
                        width="150" />
                    <el-table-column v-else-if="field === 'national_standard_industry'"
                        prop="national_standard_industry" label="国标行业分类" width="150" />
                    <el-table-column v-else-if="field === 'registered_address'" prop="registered_address" label="注册地址"
                        min-width="200" />
                    <el-table-column v-else-if="field === 'subsidiaries'" label="子公司名称" min-width="150">
                        <template #default="{ row }">
                            <div v-for="subsidiary in row.subsidiaries" :key="subsidiary.company_id">
                                {{ subsidiary.company_name }}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column v-else-if="field === 'production_addresses'" label="生产基地信息" min-width="300">
                        <template #default="{ row }">
                            <el-table :data="row.production_addresses || []" border style="width: 100%">
                                <el-table-column prop="address" label="生产基地名称" min-width="200" />
                                <el-table-column prop="capacity" label="基地产能" width="100">
                                    <template #default="{ row }">
                                        {{ row.capacity }}万辆
                                    </template>
                                </el-table-column>
                            </el-table>
                        </template>
                    </el-table-column>
                    <el-table-column v-else-if="field === 'vehicle_brand'" label="车辆信息" min-width="400">
                        <template #default="{ row }">
                            <el-table :data="row.vehicles || []" border style="width: 100%">
                                <el-table-column prop="vehicle_brand" label="车辆品牌" width="120" />
                                <el-table-column prop="vehicle_category" label="车辆类别" width="120" />
                                <el-table-column prop="new_energy" label="能源类型" width="120">
                                    <template #default="{ row }">
                                        {{ row.new_energy || '传统能源' }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="合格证数量" width="120" sortable="custom">
                                    <template #default="{ row }">
                                        {{ calculateCertificateCount(row) }}
                                    </template>
                                </el-table-column>
                            </el-table>
                        </template>
                    </el-table-column>
                </template>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container" v-if="processedData.length > 0">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, withDefaults } from 'vue'
import { Search } from '@element-plus/icons-vue'

interface Props {
    data: any[]
    loading: boolean
    selectedFields: string[]
    timeRange?: [Date, Date]
}

const props = withDefaults(defineProps<Props>(), {
    data: () => [],
    loading: false,
    selectedFields: () => [],
    timeRange: undefined
})

const emit = defineEmits(['sort-change', 'pagination-change'])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = computed(() => props.data.length)

// 处理数据展示 - 简化处理逻辑，避免复杂的数据转换
const processedData = computed(() => {
    return props.data || []
})

// 计算合格证数量
const calculateCertificateCount = (vehicle: any) => {
    console.log('计算合格证数量:', vehicle?.vehicle_brand);

    if (!vehicle?.certificate_count) {
        console.log('无certificate_count数据');
        return 0;
    }

    let certData = vehicle.certificate_count;
    console.log('证书数据类型:', Array.isArray(certData) ? 'Array' : typeof certData);

    let totalCount = 0;

    // 处理数组格式
    if (Array.isArray(certData)) {
        // 遍历处理每个证书项
        for (const item of certData) {
            if (!item) continue;

            // 如果是数组，递归处理
            if (Array.isArray(item)) {
                for (const subItem of item) {
                    if (!subItem || typeof subItem.count !== 'number') continue;

                    if (props.timeRange && props.timeRange.length === 2 && subItem.time) {
                        if (checkDateInRange(subItem.time)) {
                            totalCount += subItem.count;
                        }
                    } else {
                        totalCount += subItem.count;
                    }
                }
            }
            // 处理对象格式
            else if (typeof item === 'object') {
                if (typeof item.count !== 'number') continue;

                if (props.timeRange && props.timeRange.length === 2 && item.time) {
                    if (checkDateInRange(item.time)) {
                        totalCount += item.count;
                    }
                } else {
                    totalCount += item.count;
                }
            }
        }
    }
    // 处理对象格式
    else if (typeof certData === 'object') {
        if (typeof certData.count === 'number') {
            if (props.timeRange && props.timeRange.length === 2 && certData.time) {
                if (checkDateInRange(certData.time)) {
                    totalCount += certData.count;
                }
            } else {
                totalCount += certData.count;
            }
        }
    }

    console.log('计算结果:', totalCount);
    return totalCount;
}

const checkDateInRange = (dateString: string) => {
    console.group('检查日期范围');
    console.log('检查日期:', dateString);
    console.log('时间范围:', props.timeRange);

    if (!props.timeRange || props.timeRange.length !== 2) {
        console.log('无有效时间范围，返回true');
        console.groupEnd();
        return true;
    }

    try {
        const [year, month] = dateString.split('-');
        const itemDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const startDate = props.timeRange[0];
        const endDate = props.timeRange[1];

        console.log('解析后的日期:', itemDate);
        console.log('开始日期:', startDate);
        console.log('结束日期:', endDate);

        const result = itemDate >= startDate && itemDate <= endDate;
        console.log('比较结果:', result);
        console.groupEnd();
        return result;
    } catch (e) {
        console.error('日期解析错误:', e);
        console.groupEnd();
        return false;
    }
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

.empty-state {
    padding: 40px 20px;
    text-align: center;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>
