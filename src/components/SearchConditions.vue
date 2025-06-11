<template>
    <div class="search-conditions">
        <el-form :model="form" label-width="120px">
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-form-item label="企业名称">
                        <el-input v-model="form.companyName" placeholder="请输入企业名称" />
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="能源类型">
                        <el-select v-model="form.energyType" placeholder="请选择能源类型" style="width: 100%">
                            <el-option label="全部" value="" />
                            <el-option label="燃油" value="fuel" />
                            <el-option label="新能源" value="new_energy" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="8">
                    <el-form-item label="六大类">
                        <el-select v-model="form.vehicleCategory" placeholder="请选择车辆类别" style="width: 100%">
                            <el-option label="全部" value="" />
                            <el-option label="乘用车" value="passenger" />
                            <el-option label="货车" value="truck" />
                            <el-option label="客车" value="bus" />
                            <el-option label="专用车" value="special" />
                            <el-option label="摩托车" value="motorcycle" />
                            <el-option label="挂车" value="trailer" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="时间段">
                        <div class="time-range">
                            <el-date-picker v-model="form.timeRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="dateShortcuts"
                                value-format="YYYY-MM" style="width: 100%" unlink-panels />
                        </div>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="合格证类别">
                        <el-select v-model="form.certificateType" placeholder="请选择合格证类别" style="width: 100%">
                            <el-option label="全部" value="" />
                            <el-option label="整车" value="complete" />
                            <el-option label="底盘" value="chassis" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="24" style="text-align: center">
                    <el-button type="primary" @click="handleAddCondition">添加条件</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </el-col>
            </el-row>

            <!-- 已选条件展示区域 -->
            <div v-if="selectedConditions.length > 0" class="selected-conditions">
                <div class="conditions-title">已选条件：</div>
                <div class="conditions-list">
                    <el-tag v-for="(condition, index) in selectedConditions" :key="index" closable class="condition-tag"
                        @close="removeCondition(index)">
                        {{ formatCondition(condition) }}
                    </el-tag>
                </div>
            </div>
        </el-form>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['search'])

interface SearchForm {
    companyName: string
    energyType: string
    vehicleCategory: string
    timeRange: [Date, Date] | undefined
    certificateType: string
}

const form = reactive<SearchForm>({
    companyName: '',
    energyType: '',
    vehicleCategory: '',
    timeRange: undefined,
    certificateType: ''
})

const selectedConditions = ref<SearchForm[]>([])

// 日期快捷选项
const dateShortcuts = [
    {
        text: '本季度',
        value: () => {
            const now = new Date()
            const quarter = Math.floor((now.getMonth() / 3))
            const start = new Date(now.getFullYear(), quarter * 3, 1)
            const end = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
            return [start, end]
        }
    },
    {
        text: '今年',
        value: () => {
            const now = new Date()
            return [
                new Date(now.getFullYear(), 0, 1),
                new Date(now.getFullYear(), 11, 31)
            ]
        }
    },
    {
        text: '去年',
        value: () => {
            const now = new Date()
            return [
                new Date(now.getFullYear() - 1, 0, 1),
                new Date(now.getFullYear() - 1, 11, 31)
            ]
        }
    },
    {
        text: '近两年',
        value: () => {
            const now = new Date()
            return [
                new Date(now.getFullYear() - 1, 0, 1),
                new Date(now.getFullYear(), 11, 31)
            ]
        }
    }
]

// 格式化条件显示
const formatCondition = (condition: SearchForm) => {
    const parts: string[] = []

    if (condition.companyName) {
        parts.push(`企业名称: ${condition.companyName}`)
    }
    if (condition.energyType) {
        parts.push(`能源类型: ${condition.energyType === 'fuel' ? '燃油' : '新能源'}`)
    }
    if (condition.vehicleCategory) {
        const categoryMap: Record<string, string> = {
            passenger: '乘用车',
            truck: '货车',
            bus: '客车',
            special: '专用车',
            motorcycle: '摩托车',
            trailer: '挂车'
        }
        parts.push(`六大类: ${categoryMap[condition.vehicleCategory] || condition.vehicleCategory}`)
    }
    if (condition.timeRange) {
        const [start, end] = condition.timeRange
        const formatDate = (date: Date) => {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        }
        parts.push(`时间段: ${formatDate(start)} 至 ${formatDate(end)}`)
    }
    if (condition.certificateType) {
        parts.push(`合格证类别: ${condition.certificateType === 'complete' ? '整车' : '底盘'}`)
    }

    return parts.join(' | ')
}

// 添加条件
const handleAddCondition = () => {
    // 检查是否有选择条件
    const hasCondition = Object.values(form).some(value => {
        if (Array.isArray(value)) {
            return value.some(v => v)
        }
        return value !== ''
    })

    if (!hasCondition) {
        ElMessage.warning('请至少选择一个条件')
        return
    }

    selectedConditions.value.push({ ...form })
    emit('search', selectedConditions.value)
}

// 移除条件
const removeCondition = (index: number) => {
    selectedConditions.value.splice(index, 1)
    emit('search', selectedConditions.value)
}

// 重置
const handleReset = () => {
    resetConditions()
    emit('search', [])
}

// 更新条件列表
const updateConditions = (conditions: SearchForm[]) => {
    selectedConditions.value = conditions
}

// 重置所有条件
const resetConditions = () => {
    Object.keys(form).forEach(key => {
        if (key === 'timeRange') {
            (form as any)[key] = undefined
        } else {
            (form as any)[key] = ''
        }
    })
    selectedConditions.value = []
}

// 暴露方法给父组件
defineExpose({
    updateConditions,
    resetConditions
})
</script>

<style scoped>
.search-conditions {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.time-range {
    display: flex;
    gap: 10px;
    align-items: center;
}

.selected-conditions {
    margin-top: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.conditions-title {
    font-weight: bold;
    margin-bottom: 10px;
    color: #606266;
}

.conditions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.condition-tag {
    max-width: 100%;
    white-space: normal;
    height: auto;
    padding: 5px 10px;
}
</style>