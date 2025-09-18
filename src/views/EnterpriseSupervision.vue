<template>
  <div class="enterprise-supervision">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>企业监管状态</h2>
        <p class="page-description">
          查询汽车生产企业的监管状态、合规情况、处罚记录等监管信息
        </p>
      </div>
      <div class="header-right">
        <el-button type="primary">
          <el-icon>
            <Download />
          </el-icon>
          导出数据
        </el-button>
        <el-button @click="handleReset">
          <el-icon>
            <Refresh />
          </el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 查询条件区域 -->
    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="企业名称">
              <el-input
                v-model="searchForm.enterpriseName"
                placeholder="请输入企业名称"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="监管状态">
              <el-select
                v-model="searchForm.supervisionStatus"
                placeholder="请选择监管状态"
                clearable
              >
                <el-option label="正常" value="正常" />
                <el-option label="重点监管" value="重点监管" />
                <el-option label="限制生产" value="限制生产" />
                <el-option label="停产整改" value="停产整改" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="合规等级">
              <el-select
                v-model="searchForm.complianceLevel"
                placeholder="请选择合规等级"
                clearable
              >
                <el-option label="A级" value="A级" />
                <el-option label="B级" value="B级" />
                <el-option label="C级" value="C级" />
                <el-option label="D级" value="D级" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="风险等级">
              <el-select
                v-model="searchForm.riskLevel"
                placeholder="请选择风险等级"
                clearable
              >
                <el-option label="低风险" value="低风险" />
                <el-option label="中风险" value="中风险" />
                <el-option label="高风险" value="高风险" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="检查时间">
              <el-date-picker
                v-model="searchForm.inspectionDate"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <div class="search-actions">
              <el-button type="primary" @click="handleSearch" :loading="loading">
                <el-icon>
                  <Search />
                </el-icon>
                查询
              </el-button>
              <el-button @click="handleReset">
                <el-icon>
                  <Refresh />
                </el-icon>
                重置
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 结果展示区域 -->
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <span class="result-count">共 {{ total }} 条记录</span>
        </div>
      </template>

      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="enterpriseName" label="企业名称" width="200" />
        <el-table-column prop="supervisionStatus" label="监管状态" width="120">
          <template #default="scope">
            <el-tag 
              :type="scope.row.supervisionStatus === '正常' ? 'success' : 
                     scope.row.supervisionStatus === '重点监管' ? 'warning' : 'danger'"
            >
              {{ scope.row.supervisionStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="complianceLevel" label="合规等级" width="100">
          <template #default="scope">
            <el-tag 
              :type="scope.row.complianceLevel === 'A级' ? 'success' : 
                     scope.row.complianceLevel === 'B级' ? '' : 
                     scope.row.complianceLevel === 'C级' ? 'warning' : 'danger'"
            >
              {{ scope.row.complianceLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskLevel" label="风险等级" width="100">
          <template #default="scope">
            <el-tag 
              :type="scope.row.riskLevel === '低风险' ? 'success' : 
                     scope.row.riskLevel === '中风险' ? 'warning' : 'danger'"
            >
              {{ scope.row.riskLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastInspectionDate" label="最近检查时间" width="120" />
        <el-table-column prop="violationCount" label="违规次数" width="100" />
        <el-table-column prop="penaltyAmount" label="处罚金额(万元)" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">
              查看详情
            </el-button>
            <el-button link type="warning" @click="handleInspection(scope.row)">
              检查记录
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh, Search } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const total = ref(0)
const tableData = ref([])

// 搜索表单
const searchForm = reactive({
  enterpriseName: '',
  supervisionStatus: '',
  complianceLevel: '',
  riskLevel: '',
  inspectionDate: null
})

// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 查询方法
const handleSearch = async () => {
  loading.value = true
  try {
    // TODO: 调用API接口
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('查询完成')
  } catch (error) {
    ElMessage.error('查询失败')
  } finally {
    loading.value = false
  }
}

// 重置方法
const handleReset = () => {
  Object.assign(searchForm, {
    enterpriseName: '',
    supervisionStatus: '',
    complianceLevel: '',
    riskLevel: '',
    inspectionDate: null
  })
  pagination.page = 1
  pagination.pageSize = 20
  total.value = 0
  tableData.value = []
}

// 查看详情
const handleView = (row: any) => {
  ElMessage.info(`查看监管详情：${row.enterpriseName}`)
}

// 查看检查记录
const handleInspection = (row: any) => {
  ElMessage.info(`查看检查记录：${row.enterpriseName}`)
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  handleSearch()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  handleSearch()
}

// 组件挂载
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.enterprise-supervision {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.search-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-count {
  color: #909399;
  font-size: 14px;
}

.search-actions {
  text-align: right;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
