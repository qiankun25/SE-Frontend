<template>
  <div class="enterprise-list">
    <el-table :data="enterprises" :loading="loading" stripe border style="width: 100%">
      <el-table-column prop="enterprise_name" label="企业名称" min-width="200" />
      <el-table-column prop="enterprise_code" label="企业代码" width="120" />
      <el-table-column prop="province" label="省份" width="100" />
      <el-table-column prop="city" label="城市" width="100" />
      <el-table-column prop="enterprise_type" label="企业性质" width="100">
        <template #default="{ row }">
          <el-tag :type="row.enterprise_type === '合资' ? 'warning' : 'success'">
            {{ row.enterprise_type || '自主' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="has_new_energy" label="新能源" width="100">
        <template #default="{ row }">
          <el-tag :type="row.has_new_energy ? 'success' : 'info'">
            {{ row.has_new_energy ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="showDetail(row)">
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]"
        :total="total" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>

    <!-- 企业详情弹窗 -->
    <el-dialog v-model="detailVisible" title="企业详细信息" width="800px" :close-on-click-modal="false">
      <div v-if="enterpriseDetail" class="enterprise-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="企业名称" span="2">
            <strong>{{ enterpriseDetail.enterprise_name }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="企业ID">
            {{ enterpriseDetail.enterprise_id }}
          </el-descriptions-item>
          <el-descriptions-item label="企业代码">
            {{ enterpriseDetail.enterprise_code }}
          </el-descriptions-item>
          <el-descriptions-item label="所属集团" span="2">
            {{ enterpriseDetail.group_name }} ({{ enterpriseDetail.group_code }})
          </el-descriptions-item>
          <el-descriptions-item label="省份">
            {{ enterpriseDetail.province }}
          </el-descriptions-item>
          <el-descriptions-item label="城市">
            {{ enterpriseDetail.city }}
          </el-descriptions-item>
          <el-descriptions-item label="区县" v-if="enterpriseDetail.district">
            {{ enterpriseDetail.district }}
          </el-descriptions-item>
          <el-descriptions-item label="企业性质">
            <el-tag :type="enterpriseDetail.enterprise_type === '合资' ? 'warning' : 'success'">
              {{ enterpriseDetail.enterprise_type || '自主' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="新能源标记">
            <el-tag :type="enterpriseDetail.has_new_energy ? 'success' : 'info'">
              {{ enterpriseDetail.has_new_energy ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册地址" span="2">
            {{ enterpriseDetail.registered_address }}
          </el-descriptions-item>
          <el-descriptions-item label="生产地址" span="2">
            {{ enterpriseDetail.production_address }}
          </el-descriptions-item>
          <el-descriptions-item label="产品商标" span="2" v-if="enterpriseDetail.product_brands">
            {{ enterpriseDetail.product_brands }}
          </el-descriptions-item>
          <el-descriptions-item label="企业资质" span="2" v-if="enterpriseDetail.enterprise_qualifications">
            {{ enterpriseDetail.enterprise_qualifications }}
          </el-descriptions-item>
          <el-descriptions-item label="新能源资质" span="2" v-if="enterpriseDetail.new_energy_qualifications">
            {{ enterpriseDetail.new_energy_qualifications }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { groupApi } from '@/services/api'
import type { EnterpriseDetailInfo } from '@/types/api'

interface Props {
  groupCode: string
}

const props = defineProps<Props>()

// 响应式数据
const loading = ref(false)
const enterprises = ref<EnterpriseDetailInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 详情弹窗
const detailVisible = ref(false)
const enterpriseDetail = ref<EnterpriseDetailInfo | null>(null)

// 加载企业列表
const loadEnterprises = async () => {
  if (!props.groupCode) return

  loading.value = true
  try {
    const response = await groupApi.getEnterpriseDetailed(
      props.groupCode,
      currentPage.value,
      pageSize.value
    )

    if (response.code === 200) {
      enterprises.value = response.data || []
      total.value = response.total || 0
    } else {
      ElMessage.error(response.message || '获取企业列表失败')
    }
  } catch (error) {
    console.error('获取企业列表失败:', error)
    ElMessage.error('获取企业列表失败')
  } finally {
    loading.value = false
  }
}

// 显示企业详情
const showDetail = async (enterprise: EnterpriseDetailInfo) => {
  try {
    const response = await groupApi.getEnterpriseDetail(enterprise.enterprise_id)

    if (response.code === 200) {
      enterpriseDetail.value = response.data
      detailVisible.value = true
    } else {
      ElMessage.error(response.message || '获取企业详情失败')
    }
  } catch (error) {
    console.error('获取企业详情失败:', error)
    ElMessage.error('获取企业详情失败')
  }
}

// 分页处理
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadEnterprises()
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
  loadEnterprises()
}

// 监听集团代码变化
watch(() => props.groupCode, () => {
  currentPage.value = 1
  loadEnterprises()
}, { immediate: true })

onMounted(() => {
  loadEnterprises()
})
</script>

<style scoped>
.enterprise-list {
  padding: 16px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.enterprise-detail {
  max-height: 500px;
  overflow-y: auto;
}

.el-descriptions {
  margin-top: 16px;
}
</style>
