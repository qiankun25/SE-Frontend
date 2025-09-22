<template>
  <div class="dashboard">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>大屏界面</h2>
        <p class="page-description">
          汽车企业数据可视化大屏展示，支持实时数据监控和图表分析
        </p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="toggleFullscreen">
          <el-icon>
            <FullScreen />
          </el-icon>
          {{ isFullscreen ? '退出全屏' : '全屏显示' }}
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 大屏内容区域 -->
    <div class="dashboard-container" :class="{ 'fullscreen': isFullscreen }">
      <!-- 顶部统计卡片 -->
      <div class="stats-row">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32" color="#409EFF">
                <OfficeBuilding />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.enterpriseCount }}</div>
              <div class="stat-label">注册企业总数</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32" color="#67C23A">
                <Document />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.certificateCount }}</div>
              <div class="stat-label">合格证总数</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32" color="#E6A23C">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.vehicleModelCount }}</div>
              <div class="stat-label">车型数量</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32" color="#F56C6C">
                <DataAnalysis />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayCount }}</div>
              <div class="stat-label">今日新增</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 图表展示区域 -->
      <div class="charts-row">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>企业分布统计</span>
              <el-button link type="primary">查看详情</el-button>
            </div>
          </template>
          <div class="chart-container" id="enterpriseChart">
            <div class="chart-placeholder">
              <el-icon size="64" color="#DCDFE6">
                <PieChart />
              </el-icon>
              <p>企业分布图表</p>
              <p class="placeholder-text">图表组件将在此处显示</p>
            </div>
          </div>
        </el-card>

        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>合格证趋势分析</span>
              <el-button link type="primary">查看详情</el-button>
            </div>
          </template>
          <div class="chart-container" id="trendChart">
            <div class="chart-placeholder">
              <el-icon size="64" color="#DCDFE6">
                <TrendCharts />
              </el-icon>
              <p>趋势分析图表</p>
              <p class="placeholder-text">图表组件将在此处显示</p>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 数据表格区域 -->
      <div class="table-row">
        <el-card class="table-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>实时数据监控</span>
              <div class="header-actions">
                <el-switch
                  v-model="autoRefresh"
                  active-text="自动刷新"
                  @change="handleAutoRefreshChange"
                />
                <el-button link type="primary">导出数据</el-button>
              </div>
            </div>
          </template>
          
          <el-table
            :data="realtimeData"
            v-loading="loading"
            stripe
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="time" label="时间" width="120" />
            <el-table-column prop="enterpriseName" label="企业名称" width="200" />
            <el-table-column prop="action" label="操作类型" width="120" />
            <el-table-column prop="count" label="数量" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === '成功' ? 'success' : 'danger'">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="region" label="地区" />
          </el-table>
        </el-card>
      </div>
    </div>

    <!-- 外部链接配置对话框 -->
    <el-dialog
      v-model="showLinkDialog"
      title="外部大屏链接配置"
      width="500px"
    >
      <el-form :model="linkForm" label-width="100px">
        <el-form-item label="链接地址">
          <el-input
            v-model="linkForm.url"
            placeholder="请输入外部大屏链接地址"
          />
        </el-form-item>
        <el-form-item label="显示方式">
          <el-radio-group v-model="linkForm.displayType">
            <el-radio value="iframe">内嵌显示</el-radio>
            <el-radio value="newTab">新标签页打开</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showLinkDialog = false">取消</el-button>
        <el-button type="primary" @click="handleLinkConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  FullScreen,
  Refresh,
  OfficeBuilding,
  Document,
  TrendCharts,
  DataAnalysis,
  PieChart
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const isFullscreen = ref(false)
const autoRefresh = ref(false)
const showLinkDialog = ref(false)
let refreshTimer: NodeJS.Timeout | null = null

// 统计数据
const stats = reactive({
  enterpriseCount: '1,234',
  certificateCount: '56,789',
  vehicleModelCount: '2,345',
  todayCount: '123'
})

// 实时数据
const realtimeData = ref([
  {
    time: '14:30:25',
    enterpriseName: '比亚迪汽车有限公司',
    action: '合格证上传',
    count: 15,
    status: '成功',
    region: '广东省'
  },
  {
    time: '14:29:18',
    enterpriseName: '上海汽车集团股份有限公司',
    action: '企业信息更新',
    count: 1,
    status: '成功',
    region: '上海市'
  }
])

// 外部链接配置
const linkForm = reactive({
  url: '',
  displayType: 'iframe'
})

// 切换全屏
const toggleFullscreen = () => {
  if (!isFullscreen.value) {
    document.documentElement.requestFullscreen?.()
    isFullscreen.value = true
  } else {
    document.exitFullscreen?.()
    isFullscreen.value = false
  }
}

// 刷新数据
const handleRefresh = async () => {
  loading.value = true
  try {
    // TODO: 调用API接口刷新数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据刷新完成')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

// 自动刷新切换
const handleAutoRefreshChange = (value: boolean) => {
  if (value) {
    refreshTimer = setInterval(() => {
      handleRefresh()
    }, 30000) // 30秒刷新一次
    ElMessage.success('已开启自动刷新')
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    ElMessage.info('已关闭自动刷新')
  }
}

// 外部链接确认
const handleLinkConfirm = () => {
  if (!linkForm.url) {
    ElMessage.warning('请输入链接地址')
    return
  }
  
  if (linkForm.displayType === 'newTab') {
    window.open(linkForm.url, '_blank')
  } else {
    // TODO: 实现iframe内嵌显示
    ElMessage.info('内嵌显示功能开发中')
  }
  
  showLinkDialog.value = false
}

// 监听全屏变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 组件挂载
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  // 初始化图表（预留）
})

// 组件卸载
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
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
  font-size: 22px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 16px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.dashboard-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #f0f2f5;
  padding: 20px;
  overflow: auto;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 26px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 16px;
  color: #909399;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
}

.chart-container {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder p {
  margin: 8px 0;
  font-size: 18px;
}

.placeholder-text {
  font-size: 14px !important;
  color: #C0C4CC !important;
}

.table-row {
  margin-bottom: 20px;
}

.table-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
