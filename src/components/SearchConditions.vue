<template>
    <div class="search-conditions">
        <div class="condition-form">
            <el-form :model="form" label-width="100px">
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="企业名称">
                            <el-input v-model="form.company_name" placeholder="请输入企业名称" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="国标行业分类">
                            <el-select v-model="form.national_standard_industry" placeholder="请选择搜索的国标行业"
                                style="width: 100%">
                                <el-option label="全部" value="" />
                                <el-option label="汽柴油车整车制造" value="汽柴油车整车制造" />
                                <el-option label="新能源车整车制造" value="新能源车整车制造" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="新能源类别">
                            <el-select v-model="form.new_energy" placeholder="请选择能源类型" style="width: 100%">
                                <el-option label="全部" value="" />
                                <el-option label="非新能源车" value="null" />
                                <el-option label="纯电动" value="纯电动" />
                                <el-option label="插电式混合动力" value="插电式混合动力" />
                                <el-option label="增程式电动" value="增程式电动" />
                                <el-option label="燃料电池" value="燃料电池" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="六大类">
                            <el-select v-model="form.vehicle_category" placeholder="请选择车辆类别" style="width: 100%">
                                <el-option label="全部" value="" />
                                <el-option label="乘用车" value="乘用车" />
                                <el-option label="货车" value="货车" />
                                <el-option label="客车" value="客车" />
                                <el-option label="专用车" value="专用车" />
                                <el-option label="摩托车" value="摩托车" />
                                <el-option label="挂车" value="挂车" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="车辆类型">
                            <el-select v-model="form.vehicle_type" placeholder="请选择车辆类型" style="width: 100%">
                                <el-option label="全部" value="" />
                                <el-option label="整车" value="整车" />
                                <el-option label="底盘" value="底盘" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="时间范围">
                            <el-date-picker v-model="form.timeRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item>
                    <el-button type="primary" @click="handleAddCondition">添加条件</el-button>
                    <el-button @click="resetForm">重置</el-button>
                </el-form-item>
            </el-form>
        </div>

        <div class="selected-conditions" v-if="selectedConditions.length > 0">
            <div class="condition-tags">
                <el-tag v-for="(condition, index) in selectedConditions" :key="index" closable
                    @close="handleRemoveCondition(index)" class="condition-tag">
                    {{ formatCondition(condition) }}
                </el-tag>
            </div>
            <div class="condition-actions">
                <el-button type="primary" @click="handleSearch"
                    :disabled="selectedConditions.length === 0">搜索</el-button>
                <el-button @click="handleReset">重置</el-button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

interface SearchForm {
    company_name: string
    national_standard_industry: string
    new_energy: string
    vehicle_category: string
    vehicle_type: string
    timeRange: [Date, Date] | undefined
}

const emit = defineEmits(['search', 'remove'])

const form = reactive<SearchForm>({
    company_name: '',
    national_standard_industry: '',
    new_energy: '',
    vehicle_category: '',
    vehicle_type: '',
    timeRange: undefined
})

const selectedConditions = ref<any[]>([])

const handleAddCondition = () => {
    const condition: SearchCondition = {}

    if (form.company_name) {
        condition.company_name = form.company_name
    }
    if (form.national_standard_industry) {
        condition.national_standard_industry = form.national_standard_industry
    }
    if (form.new_energy) {
        condition.new_energy = form.new_energy
    }
    if (form.vehicle_category) {
        condition.vehicle_category = form.vehicle_category
    }
    if (form.vehicle_type) {
        condition.vehicle_type = form.vehicle_type
    }
    if (form.timeRange) {
        condition.timeRange = form.timeRange
    }

    // 只有当至少有一个条件被设置时才添加
    if (Object.keys(condition).length > 0) {
        selectedConditions.value = [...selectedConditions.value, condition]
        console.log('添加条件后的条件列表：', selectedConditions.value)
        resetForm()
    }
}

const handleSearch = () => {
    if (selectedConditions.value.length === 0) {
        ElMessage.warning('请至少添加一个搜索条件')
        return
    }
    console.log('发送搜索条件：', selectedConditions.value)
    emit('search', selectedConditions.value)
}

const handleRemoveCondition = (index: number) => {
    selectedConditions.value = selectedConditions.value.filter((_, i) => i !== index)
    console.log('移除条件后的条件列表：', selectedConditions.value)
    emit('remove', index)
}

const handleReset = () => {
    selectedConditions.value = []
    resetForm()
    console.log('重置后的条件列表：', selectedConditions.value)
    emit('search', [])
}

const resetForm = () => {
    form.company_name = ''
    form.national_standard_industry = ''
    form.new_energy = ''
    form.vehicle_category = ''
    form.vehicle_type = ''
    form.timeRange = undefined
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString()
}

const formatCondition = (condition: any) => {
    const parts: string[] = []

    if (condition.company_name) {
        parts.push(`企业名称: ${condition.company_name}`)
    }
    if (condition.national_standard_industry) {
        parts.push(`国标行业分类: ${condition.national_standard_industry}`)
    }
    if (condition.new_energy) {
        const energyTypeMap: Record<string, string> = {
            'null': '非新能源车',
            '纯电动': '纯电动',
            '插电式混合动力': '插电式混合动力',
            '增程式电动': '增程式电动',
            '燃料电池': '燃料电池'
        }
        parts.push(`能源类型: ${energyTypeMap[condition.new_energy] || condition.new_energy}`)
    }
    if (condition.vehicle_category) {
        parts.push(`车辆类别: ${condition.vehicle_category}`)
    }
    if (condition.timeRange) {
        const [start, end] = condition.timeRange
        parts.push(`时间段: ${formatDate(start)} 至 ${formatDate(end)}`)
    }

    return parts.join(' | ')
}
</script>

<style scoped>
.search-conditions {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.condition-form {
    margin-bottom: 20px;
}

.selected-conditions {
    border-top: 1px solid #ebeef5;
    padding-top: 20px;
}

.condition-tags {
    margin-bottom: 15px;
}

.condition-tag {
    margin-right: 10px;
    margin-bottom: 10px;
}

.condition-actions {
    display: flex;
    gap: 10px;
}
</style>