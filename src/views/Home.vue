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

        <!-- 数据表格区域 -->
        <company-table ref="tableRef" :data="tableData" :loading="loading" @sort-change="handleSortChange"
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
import ExcelJS from 'exceljs'

interface CompanyData {
    id: number
    name: string
    code: string
    address: string
    certificateCount: number
    vehicleType: string
    category: string
    fuelType: string
    uploadYear: number
    uploadMonth: number
}

const router = useRouter()
const username = ref(localStorage.getItem('username') || '用户')
const searchKeyword = ref('')
const tableData = ref<CompanyData[]>([])
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

// 条件搜索处理
const handleConditionSearch = (conditions: any[]) => {
    currentConditions.value = conditions
    console.log('搜索条件:', conditions)
    fetchData()
}

// 移除条件
const removeCondition = (index: number) => {
    currentConditions.value.splice(index, 1)
    searchConditionsRef.value?.updateConditions(currentConditions.value)
    fetchData()
}

// 模拟数据获取
const fetchData = async () => {
    loading.value = true
    try {
        // TODO: 替换为实际的API调用
        // 这里模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 模拟数据
        const mockData: CompanyData[] = Array.from({ length: 20 }, (_, index) => ({
            id: index + 1,
            name: '企业' + (index + 1),
            code: 'CODE' + (index + 1),
            address: '地址' + (index + 1),
            certificateCount: Math.floor(Math.random() * 1000),
            vehicleType: Math.random() > 0.5 ? '整车' : '底盘',
            category: ['乘用车', '货车', '客车', '专用车', '摩托车', '挂车'][Math.floor(Math.random() * 6)],
            fuelType: Math.random() > 0.5 ? '燃油' : '新能源',
            uploadYear: 2024,
            uploadMonth: Math.floor(Math.random() * 12) + 1
        }))

        // 应用排序
        if (currentSort.value.prop && currentSort.value.order) {
            mockData.sort((a, b) => {
                const factor = currentSort.value.order === 'ascending' ? 1 : -1
                const aValue = a[currentSort.value.prop as keyof CompanyData]
                const bValue = b[currentSort.value.prop as keyof CompanyData]
                return ((aValue as number) - (bValue as number)) * factor
            })
        }

        tableData.value = mockData
    } catch (error) {
        console.error('获取数据失败:', error)
        ElMessage.error('获取数据失败')
    } finally {
        loading.value = false
    }
}

// 搜索处理
const handleSearch = () => {
    // TODO: 实现搜索逻辑
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
        worksheet.columns = [
            { header: '企业ID', key: 'id', width: 10 },
            { header: '企业代码', key: 'code', width: 15 },
            { header: '企业名称', key: 'name', width: 30 },
            { header: '地址', key: 'address', width: 40 },
            { header: '合格证数量', key: 'certificateCount', width: 15 },
            { header: '底盘或整车', key: 'vehicleType', width: 15 },
            { header: '六大类', key: 'category', width: 15 },
            { header: '能源类型', key: 'fuelType', width: 15 },
            { header: '上传年', key: 'uploadYear', width: 10 },
            { header: '上传月', key: 'uploadMonth', width: 10 }
        ]

        // 添加数据
        worksheet.addRows(data)

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