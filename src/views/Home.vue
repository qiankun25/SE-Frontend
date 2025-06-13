<template>
    <div class="home-container">
        <!-- 顶部操作栏 -->
        <div class="header-actions">
            <div class="welcome-text">
                欢迎, {{ username }}
            </div>
            <div class="action-buttons">
                <el-button type="primary" @click="handleExport" :loading="exporting">
                    导出数据
                </el-button>
                <el-button type="danger" @click="handleLogout">
                    退出登录
                </el-button>
            </div>
        </div>

        <!-- 顶部搜索框 -->
        <div class="search-header">
            <el-input v-model="searchKeyword" placeholder="请输入关键字搜索" class="top-search" :prefix-icon="Search">
                <template #append>
                    <el-button :icon="Search" @click="handleSearch">搜索</el-button>
                </template>
            </el-input>
        </div>

        <!-- 条件筛选区域 -->
        <search-conditions ref="searchConditionsRef" @search="handleConditionSearch" @remove="removeCondition" />

        <!-- 展示字段选择区域 -->
        <display-fields @fields-change="handleFieldsChange" />

        <!-- 数据表格区域 -->
        <company-table ref="tableRef" :data="tableData" :loading="loading" :selected-fields="selectedFields"
            :time-range="currentTimeRange" @sort-change="handleSortChange"
            @pagination-change="handlePaginationChange" />
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SearchConditions from '../components/SearchConditions.vue'
import CompanyTable from '../components/CompanyTable.vue'
import DisplayFields from '../components/DisplayFields.vue'
import ExcelJS from 'exceljs'
import { companiesData } from '../datas/companiesData'

const router = useRouter()
const username = ref(localStorage.getItem('username') || '用户')
const searchKeyword = ref('')
const tableData = ref([])
const loading = ref(false)
const exporting = ref(false)
const searchConditionsRef = ref()
const tableRef = ref()

// 当前的排序和分页状态
const currentSort = ref({
    prop: '',
    order: ''
})
const currentPage = ref(1)
const pageSize = ref(10)

// 当前的搜索条件
const currentConditions = ref<any[]>([])
const currentTimeRange = ref<[Date, Date] | null>(null)

// 选中的展示字段
const selectedFields = ref<string[]>([
    'company_id',
    'company_name',
    'social_credit_code',
    'company_type',
    'national_standard_industry',
    'registered_address',
    'subsidiaries',
    'production_addresses',
    'capacity',
    'vehicle_brand',
    'vehicle_category',
    'new_energy',
    'certificate_count'
])

// 条件搜索处理
const handleConditionSearch = (conditions: any[]) => {
    currentConditions.value = conditions
    // 更新时间范围
    const timeRangeCondition = conditions.find(c => c.timeRange)
    if (timeRangeCondition) {
        currentTimeRange.value = timeRangeCondition.timeRange
    } else {
        currentTimeRange.value = null
    }
    fetchData()
}

// 移除条件
const removeCondition = (index: number) => {
    currentConditions.value.splice(index, 1)
    searchConditionsRef.value?.updateConditions(currentConditions.value)
    fetchData()
}

// 字段变化处理
const handleFieldsChange = (fields: string[]) => {
    selectedFields.value = fields
}

// 获取数据
const fetchData = async () => {
    loading.value = true
    try {
        // 使用实际数据
        tableData.value = companiesData
    } catch (error) {
        console.error('获取数据失败:', error)
        ElMessage.error('获取数据失败')
    } finally {
        loading.value = false
    }
}

// 搜索处理
const handleSearch = () => {
    console.log('搜索关键字:', searchKeyword.value)
    fetchData()
}

// 排序变化处理
const handleSortChange = ({ prop, order }: { prop: string, order: string }) => {
    currentSort.value = { prop, order }
    fetchData()
}

// 分页变化处理
const handlePaginationChange = ({ page, size }: { page: number, size: number }) => {
    currentPage.value = page
    pageSize.value = size
    fetchData()
}

// 计算合格证数量
const calculateCertificateCount = (vehicle: any) => {
    if (!currentTimeRange.value) {
        return 0
    }

    const [start, end] = currentTimeRange.value
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

// 导出数据
const handleExport = async () => {
    try {
        exporting.value = true

        const data = tableData.value
        if (!data || data.length === 0) {
            ElMessage.warning('没有可导出的数据')
            return
        }

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('企业数据')

        // 定义表头
        const headers = selectedFields.value.map(field => {
            const fieldMap: Record<string, string> = {
                company_id: '企业ID',
                company_name: '企业名称',
                social_credit_code: '企业代码',
                company_type: '企业类型',
                national_standard_industry: '国标行业分类',
                registered_address: '注册地址',
                subsidiaries: '子公司名称',
                production_addresses: '生产基地名称',
                capacity: '基地产能',
                vehicle_brand: '车辆品牌',
                vehicle_category: '车辆类别',
                new_energy: '能源类型',
                certificate_count: '合格证数量'
            }
            return { header: fieldMap[field], key: field, width: 20 }
        })

        worksheet.columns = headers

        // 添加数据
        data.forEach(company => {
            const row: any = {}
            selectedFields.value.forEach(field => {
                if (field === 'subsidiaries') {
                    row[field] = company.subsidiaries.map((s: any) => s.company_name).join(', ')
                } else if (field === 'production_addresses') {
                    row[field] = company.production_addresses.map((a: any) => a.address).join(', ')
                } else if (field === 'capacity') {
                    row[field] = company.production_addresses.map((a: any) => `${a.capacity}万辆`).join(', ')
                } else if (field === 'vehicle_brand' || field === 'vehicle_category' || field === 'new_energy') {
                    row[field] = company.vehicles.map((v: any) => v[field] || '传统能源').join(', ')
                } else if (field === 'certificate_count') {
                    row[field] = company.vehicles.map((v: any) => calculateCertificateCount(v)).join(', ')
                } else {
                    row[field] = company[field]
                }
            })
            worksheet.addRow(row)
        })

        // 生成并下载文件
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = '企业数据_' + new Date().toLocaleDateString() + '.xlsx'
        link.click()
        window.URL.revokeObjectURL(url)

        ElMessage.success('导出成功')
    } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败')
    } finally {
        exporting.value = false
    }
}

// 退出登录
const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    router.push('/login')
}

// 初始化
onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.home-container {
    padding: 20px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.welcome-text {
    font-size: 16px;
    color: #606266;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

.search-header {
    padding: 20px 0;
}

.top-search {
    width: 500px;
    margin: 0 auto;
}
</style>