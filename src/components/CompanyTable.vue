<template>
    <div class="company-table">
        <el-table :data="data" :loading="loading" style="width: 100%" border @sort-change="handleSortChange">
            <el-table-column prop="id" label="企业ID" width="80" sortable />
            <el-table-column prop="code" label="企业代码" width="120" sortable />

            <!-- 企业名称和生产地址合并显示 -->
            <el-table-column label="企业信息" min-width="300">
                <template #default="{ row }">
                    <div class="company-info">
                        <div class="company-name">{{ row.name }}</div>
                        <div class="company-address">{{ row.address }}</div>
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="vehicleType" label="底盘或整车" width="120" />
            <el-table-column prop="category" label="六大类" width="120" />
            <el-table-column prop="type" label="车辆类型" width="120" />
            <el-table-column prop="model" label="车辆型号" width="120" />
            <el-table-column prop="brand" label="商标" width="120" />
            <el-table-column prop="vehicleName" label="车辆名称" width="120" />
            <el-table-column prop="fuelType" label="燃料种类" width="120" />
            <el-table-column prop="newEnergyMark" label="新能源标记" width="120" />
            <el-table-column prop="newEnergyType" label="新能源类别" width="120" />
            <el-table-column prop="certificateCount" label="合格证数量" width="120" sortable="custom">
                <template #default="{ row }">
                    <span class="certificate-count">{{ row.certificateCount }}</span>
                </template>
            </el-table-column>
            <el-table-column prop="uploadYear" label="上传年" width="100" sortable />
            <el-table-column prop="uploadMonth" label="上传月" width="100" sortable />
            <el-table-column prop="rank" label="排名序号" width="100" sortable />
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
import { ref } from 'vue'

defineProps({
    data: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['sort-change', 'pagination-change'])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

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

.company-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.company-name {
    font-weight: bold;
}

.company-address {
    color: #666;
    font-size: 13px;
}

.certificate-count {
    font-weight: bold;
    color: #409EFF;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>