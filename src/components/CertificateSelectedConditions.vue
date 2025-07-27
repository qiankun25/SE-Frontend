<template>
  <div class="certificate-selected-conditions">
    <el-card v-if="selectedConditions.length > 0" shadow="never">
      <template #header>
        <div class="card-header">
          <span>已选择的查询条件 ({{ selectedConditions.length }})</span>
          <div class="header-actions">
            <el-button type="text" @click="handleClearAll" :disabled="selectedConditions.length === 0">
              清空所有
            </el-button>
          </div>
        </div>
      </template>

      <div class="conditions-container">
        <!-- 条件标签列表 -->
        <div class="condition-tags">
          <div v-for="(condition, index) in selectedConditions" :key="index" class="condition-group">
            <div class="condition-index">条件{{ index + 1 }}</div>
            <div class="condition-content">
              <!-- 前提条件 -->
              <div
                v-if="(condition.vehicleClass && condition.vehicleClass.length > 0) || condition.excludeNonAnnouncement !== undefined"
                class="preset-conditions">
                <el-tag v-if="condition.vehicleClass && condition.vehicleClass.length > 0" type="info" size="small"
                  class="condition-tag">
                  车辆类别: {{ condition.vehicleClass.join(', ') }}
                </el-tag>
                <el-tag v-if="condition.excludeNonAnnouncement !== undefined" type="info" size="small"
                  class="condition-tag">
                  {{ condition.excludeNonAnnouncement ? '排除非公告数据' : '包含非公告数据' }}
                </el-tag>
              </div>

              <!-- 主要条件 -->
              <div class="main-conditions">
                <!-- 企业选择 -->
                <div v-if="condition.companies && condition.companies.length > 0" class="condition-item">
                  <span class="condition-label">企业:</span>
                  <el-tag v-for="company in condition.companies.slice(0, 3)" :key="company.id" size="small"
                    class="condition-tag">
                    {{ company.name }}
                  </el-tag>
                  <el-tag v-if="condition.companies.length > 3" type="info" size="small" class="condition-tag">
                    +{{ condition.companies.length - 3 }}个
                  </el-tag>
                </div>

                <!-- 车辆型号 -->
                <div v-if="condition.vehicleModels && condition.vehicleModels.length > 0" class="condition-item">
                  <span class="condition-label">车辆型号:</span>
                  <el-tag v-for="model in condition.vehicleModels.slice(0, 3)" :key="model" size="small"
                    class="condition-tag">
                    {{ model }}
                  </el-tag>
                  <el-tag v-if="condition.vehicleModels.length > 3" type="info" size="small" class="condition-tag">
                    +{{ condition.vehicleModels.length - 3 }}个
                  </el-tag>
                </div>

                <!-- 车辆品牌 -->
                <div v-if="condition.vehicleBrands && condition.vehicleBrands.length > 0" class="condition-item">
                  <span class="condition-label">车辆品牌:</span>
                  <el-tag v-for="brand in condition.vehicleBrands.slice(0, 3)" :key="brand" size="small"
                    class="condition-tag">
                    {{ brand }}
                  </el-tag>
                  <el-tag v-if="condition.vehicleBrands.length > 3" type="info" size="small" class="condition-tag">
                    +{{ condition.vehicleBrands.length - 3 }}个
                  </el-tag>
                </div>

                <!-- 车辆名称 -->
                <div v-if="condition.vehicleNames && condition.vehicleNames.length > 0" class="condition-item">
                  <span class="condition-label">车辆名称:</span>
                  <el-tag v-for="name in condition.vehicleNames.slice(0, 3)" :key="name" size="small"
                    class="condition-tag">
                    {{ name }}
                  </el-tag>
                  <el-tag v-if="condition.vehicleNames.length > 3" type="info" size="small" class="condition-tag">
                    +{{ condition.vehicleNames.length - 3 }}个
                  </el-tag>
                </div>

                <!-- 时间范围 -->
                <div v-if="condition.timeRangeType" class="condition-item">
                  <span class="condition-label">时间范围:</span>
                  <el-tag size="small" class="condition-tag">
                    {{ formatTimeRange(condition) }}
                  </el-tag>
                  <el-tag v-if="condition.enableComparison" type="warning" size="small" class="condition-tag">
                    同期比
                  </el-tag>
                </div>

                <!-- 生产地址 -->
                <div v-if="condition.productionAddresses && condition.productionAddresses.length > 0"
                  class="condition-item">
                  <span class="condition-label">生产地址:</span>
                  <el-tag v-for="address in condition.productionAddresses.slice(0, 2)" :key="address" size="small"
                    class="condition-tag">
                    {{ address }}
                  </el-tag>
                  <el-tag v-if="condition.productionAddresses.length > 2" type="info" size="small"
                    class="condition-tag">
                    +{{ condition.productionAddresses.length - 2 }}个
                  </el-tag>
                </div>

                <!-- 生产省份 -->
                <div v-if="condition.productionProvinces && condition.productionProvinces.length > 0"
                  class="condition-item">
                  <span class="condition-label">生产省份:</span>
                  <el-tag v-for="province in condition.productionProvinces.slice(0, 3)" :key="province" size="small"
                    class="condition-tag">
                    {{ province }}
                  </el-tag>
                  <el-tag v-if="condition.productionProvinces.length > 3" type="info" size="small"
                    class="condition-tag">
                    +{{ condition.productionProvinces.length - 3 }}个
                  </el-tag>
                </div>

                <!-- 生产城市 -->
                <div v-if="condition.productionCities && condition.productionCities.length > 0" class="condition-item">
                  <span class="condition-label">生产城市:</span>
                  <el-tag v-for="city in condition.productionCities.slice(0, 3)" :key="city" size="small"
                    class="condition-tag">
                    {{ city }}
                  </el-tag>
                  <el-tag v-if="condition.productionCities.length > 3" type="info" size="small" class="condition-tag">
                    +{{ condition.productionCities.length - 3 }}个
                  </el-tag>
                </div>

                <!-- 六大类 -->
                <div v-if="condition.sixCategories && condition.sixCategories.length > 0" class="condition-item">
                  <span class="condition-label">六大类:</span>
                  <el-tag v-for="category in condition.sixCategories" :key="category" size="small"
                    class="condition-tag">
                    {{ category }}
                  </el-tag>
                </div>

                <!-- 商用车/乘用车 -->
                <div v-if="condition.commercialOrPassenger" class="condition-item">
                  <span class="condition-label">车辆分类:</span>
                  <el-tag size="small" class="condition-tag">
                    {{ condition.commercialOrPassenger }}
                  </el-tag>
                </div>

                <!-- 燃料种类 -->
                <div v-if="condition.fuelTypes && condition.fuelTypes.length > 0" class="condition-item">
                  <span class="condition-label">燃料种类:</span>
                  <el-tag v-for="fuel in condition.fuelTypes" :key="fuel" size="small" class="condition-tag">
                    {{ fuel }}
                  </el-tag>
                </div>

                <!-- 新能源类别 -->
                <div v-if="condition.newEnergyCategories && condition.newEnergyCategories.length > 0"
                  class="condition-item">
                  <span class="condition-label">新能源类别:</span>
                  <el-tag v-for="category in condition.newEnergyCategories" :key="category" size="small"
                    class="condition-tag">
                    {{ category }}
                  </el-tag>
                </div>

                <!-- 是否新能源 -->
                <div v-if="condition.isNewEnergy" class="condition-item">
                  <span class="condition-label">是否新能源:</span>
                  <el-tag size="small" class="condition-tag">
                    {{ condition.isNewEnergy }}
                  </el-tag>
                </div>
              </div>
            </div>

            <!-- 删除按钮 -->
            <div class="condition-actions">
              <el-button type="text" size="small" @click="handleRemoveCondition(index)" class="remove-btn">
                <el-icon>
                  <Close />
                </el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions-container">
          <el-button type="primary" @click="handleSearch" :disabled="selectedConditions.length === 0">
            开始查询 ({{ selectedConditions.length }}个条件)
          </el-button>
          <el-button @click="handleReset">
            重置所有条件
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-card v-else shadow="never">
      <el-empty description="暂无查询条件" :image-size="80">
        <template #description>
          <p>请在上方添加查询条件后开始查询</p>
        </template>
      </el-empty>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

interface Props {
  selectedConditions: any[]
}

interface Emits {
  (e: 'remove-condition', index: number): void
  (e: 'clear-all'): void
  (e: 'search', conditions: any[]): void
  (e: 'reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 格式化时间范围显示
const formatTimeRange = (condition: any) => {
  const typeMap: Record<string, string> = {
    total: '总量',
    recent2years: '近两年',
    recent6months: '近六月',
    thisYear: '今年',
    lastYear: '去年',
    custom: '自定义'
  }

  let result = typeMap[condition.timeRangeType] || condition.timeRangeType

  if (condition.timeUnit) {
    const unitMap: Record<string, string> = {
      year: '年',
      month: '月',
      day: '日'
    }
    result += `(${unitMap[condition.timeUnit]})`
  }

  if (condition.customTimeRange) {
    const [start, end] = condition.customTimeRange
    result += ` ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
  }

  return result
}

// 移除单个条件
const handleRemoveCondition = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个查询条件吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    emit('remove-condition', index)
    ElMessage.success('条件已删除')
  } catch {
    // 用户取消删除
  }
}

// 清空所有条件
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要清空所有 ${props.selectedConditions.length} 个查询条件吗？`,
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    emit('clear-all')
    ElMessage.success('所有条件已清空')
  } catch {
    // 用户取消清空
  }
}

// 开始查询
const handleSearch = () => {
  if (props.selectedConditions.length === 0) {
    ElMessage.warning('请先添加查询条件')
    return
  }

  emit('search', props.selectedConditions)
}

// 重置所有条件
const handleReset = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有查询条件吗？这将清空所有已设置的条件。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    emit('reset')
    ElMessage.success('所有条件已重置')
  } catch {
    // 用户取消重置
  }
}
</script>

<style scoped>
.certificate-selected-conditions {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.conditions-container {
  padding: 0;
}

.condition-tags {
  margin-bottom: 20px;
}

.condition-group {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.condition-index {
  flex-shrink: 0;
  width: 60px;
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  margin-right: 15px;
  margin-top: 2px;
}

.condition-content {
  flex: 1;
  min-width: 0;
}

.preset-conditions {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.main-conditions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.condition-label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
  margin-right: 4px;
  flex-shrink: 0;
}

.condition-tag {
  margin: 0;
  font-size: 12px;
}

.condition-actions {
  flex-shrink: 0;
  margin-left: 10px;
}

.remove-btn {
  color: #f56c6c;
  padding: 4px;
}

.remove-btn:hover {
  background-color: #fef0f0;
}

.actions-container {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .condition-group {
    flex-direction: column;
  }

  .condition-index {
    width: auto;
    margin-bottom: 10px;
  }

  .condition-actions {
    margin-left: 0;
    margin-top: 10px;
    align-self: flex-end;
  }

  .actions-container {
    flex-direction: column;
  }
}
</style>
