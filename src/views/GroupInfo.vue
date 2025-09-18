<template>
  <div class="group-info">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>集团基本信息</h2>
        <p class="page-description">
          查询汽车集团的基本信息、组织架构、下属企业等详细信息
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
            <el-form-item label="集团名称">
              <el-input
                v-model="searchForm.groupName"
                placeholder="请输入集团名称"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="集团代码">
              <el-input
                v-model="searchForm.groupCode"
                placeholder="请输入集团代码"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="注册地区">
              <el-select
                v-model="searchForm.region"
                placeholder="请选择注册地区"
                clearable
              >
                <el-option label="北京市" value="北京市" />
                <el-option label="上海市" value="上海市" />
                <el-option label="广东省" value="广东省" />
                <el-option label="浙江省" value="浙江省" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
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
        <el-table-column prop="groupName" label="集团名称" width="200" />
        <el-table-column prop="groupCode" label="集团代码" width="150" />
        <el-table-column prop="region" label="注册地区" width="120" />
        <el-table-column prop="establishDate" label="成立时间" width="120" />
        <el-table-column prop="subsidiaryCount" label="下属企业数" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">
              查看详情
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
  groupName: '',
  groupCode: '',
  region: ''
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
    groupName: '',
    groupCode: '',
    region: ''
  })
  pagination.page = 1
  pagination.pageSize = 20
  total.value = 0
  tableData.value = []
}

// 查看详情
const handleView = (row: any) => {
  ElMessage.info(`查看集团详情：${row.groupName}`)
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
.group-info {
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
