<template>
  <div class="view-dimension-example">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>查看维度功能示例</span>
          <el-button type="primary" @click="runExample">运行示例</el-button>
        </div>
      </template>

      <!-- 查看维度选择 -->
      <div class="dimension-selector">
        <el-radio-group v-model="selectedDimension" @change="handleDimensionChange">
          <el-radio-button label="total">总量</el-radio-button>
          <el-radio-button label="yearly">分年度</el-radio-button>
          <el-radio-button label="monthly">分月份</el-radio-button>
          <el-radio-button label="daily">分天数</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 示例数据表格 -->
      <div class="example-table">
        <el-table :data="exampleData" border stripe>
          <el-table-column type="index" label="序号" width="60" />
          
          <!-- 企业名称列 -->
          <el-table-column prop="companyName" label="企业名称" min-width="150" />
          
          <!-- 动态时间列 -->
          <template v-if="selectedDimension === 'yearly'">
            <el-table-column prop="year" label="年份" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="primary">{{ row.year }}年</el-tag>
              </template>
            </el-table-column>
          </template>
          
          <template v-if="selectedDimension === 'monthly'">
            <el-table-column prop="year" label="年份" width="80" align="center">
              <template #default="{ row }">{{ row.year }}年</template>
            </el-table-column>
            <el-table-column prop="month" label="月份" width="80" align="center">
              <template #default="{ row }">
                <el-tag type="success">{{ row.month }}月</el-tag>
              </template>
            </el-table-column>
          </template>
          
          <template v-if="selectedDimension === 'daily'">
            <el-table-column prop="date" label="日期" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="warning">{{ row.date }}</el-tag>
              </template>
            </el-table-column>
          </template>
          
          <!-- 车辆信息列 -->
          <el-table-column prop="vehicleModel" label="车辆型号" width="150" />
          
          <!-- 合格证数量列 -->
          <el-table-column prop="certificateCount" label="合格证数量" width="120" align="right">
            <template #default="{ row }">
              <span class="certificate-count">{{ formatNumber(row.certificateCount) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 说明信息 -->
      <div class="explanation">
        <el-alert :title="explanationTitle" :description="explanationText" type="info" show-icon />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const selectedDimension = ref<'total' | 'yearly' | 'monthly' | 'daily'>('yearly')

// 示例数据
const exampleData = ref([
  {
    companyName: '比亚迪汽车',
    vehicleModel: 'BYD7154EV1',
    year: 2024,
    month: 1,
    date: '2024-01-15',
    certificateCount: 5360
  },
  {
    companyName: '比亚迪汽车',
    vehicleModel: 'BYD7154EV1',
    year: 2023,
    month: 12,
    date: '2023-12-20',
    certificateCount: 4500
  },
  {
    companyName: '比亚迪汽车',
    vehicleModel: 'BYD7154EV2',
    year: 2024,
    month: 2,
    date: '2024-02-10',
    certificateCount: 4440
  },
  {
    companyName: '比亚迪汽车',
    vehicleModel: 'BYD7154EV2',
    year: 2023,
    month: 11,
    date: '2023-11-25',
    certificateCount: 3700
  },
  {
    companyName: '比亚迪汽车',
    vehicleModel: 'BYD7154EV3',
    year: 2024,
    month: 3,
    date: '2024-03-05',
    certificateCount: 3960
  }
])

// 计算属性
const explanationTitle = computed(() => {
  const titles = {
    total: '总量查看模式',
    yearly: '分年度查看模式',
    monthly: '分月份查看模式',
    daily: '分天数查看模式'
  }
  return titles[selectedDimension.value]
})

const explanationText = computed(() => {
  const texts = {
    total: '显示指定时间范围内的合格证总量，不按时间分组，适合查看整体统计。',
    yearly: '按年份分组显示合格证数量，每行代表某企业某车型在某年的数据，适合年度趋势分析。',
    monthly: '按年月分组显示合格证数量，每行代表某企业某车型在某年某月的数据，适合月度分析。',
    daily: '按日期分组显示合格证数量，每行代表某企业某车型在某天的数据，适合日常监控。'
  }
  return texts[selectedDimension.value]
})

// 方法
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

const handleDimensionChange = (dimension: string) => {
  ElMessage.info(`切换到${explanationTitle.value}`)
}

const runExample = () => {
  ElMessage.success('这是查看维度功能的正确显示示例')
}
</script>

<style scoped>
.view-dimension-example {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.dimension-selector {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.example-table {
  margin-bottom: 20px;
}

.certificate-count {
  font-weight: 600;
  color: #409eff;
}

.explanation {
  margin-top: 20px;
}

:deep(.el-alert__description) {
  line-height: 1.6;
}
</style>