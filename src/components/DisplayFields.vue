<template>
    <div class="display-fields">
        <div class="fields-title">展示字段：</div>
        <div class="fields-container">
            <el-tag v-for="field in fields" :key="field.key" :type="field.selected ? 'success' : 'info'"
                class="field-tag" @click="toggleField(field)">
                {{ field.label }}
            </el-tag>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
    fieldType?: 'enterprise' | 'certificate'
    initialFields?: string[]
}>()

const emit = defineEmits(['fields-change'])

interface Field {
    key: string
    label: string
    selected: boolean
}

// 企业字段配置
const enterpriseFields: Field[] = [
    { key: 'company_id', label: '企业ID', selected: true },
    { key: 'company_name', label: '企业名称', selected: true },
    { key: 'social_credit_code', label: '企业代码', selected: true },
    { key: 'company_type', label: '企业类型', selected: true },
    { key: 'national_standard_industry', label: '国标行业分类', selected: true },
    { key: 'registered_address', label: '注册地址', selected: true },
    { key: 'subsidiaries', label: '子公司名称', selected: true },
    { key: 'production_addresses', label: '生产基地信息', selected: true },
    { key: 'vehicle_brand', label: '车辆信息', selected: true }
]

// 合格证字段配置
const certificateFields: Field[] = [
    { key: 'QYDM', label: '合格证企业代码', selected: true },
    { key: 'CLZT', label: '车辆类别', selected: true },
    { key: 'CLZZQYMC', label: '车辆制造企业名称', selected: true },
    { key: 'CLXH', label: '车辆型号', selected: true },
    { key: 'CLLX', label: '车辆类型', selected: false },
    { key: 'CLPP', label: '车辆品牌', selected: true },
    { key: 'CLMC', label: '车辆名称', selected: true },
    { key: 'RLZL', label: '燃料种类', selected: false },
    { key: 'PL', label: '排量', selected: false },
    { key: 'C', label: '长', selected: false },
    { key: 'ZZL', label: '总质量', selected: false },
    { key: 'ZBZL', label: '整备质量', selected: false },
    { key: 'ZJ', label: '轴距', selected: false },
    { key: 'UPD', label: '上传时间', selected: false },
    { key: 'SL', label: '数量', selected: true },
    { key: 'SCDZ', label: '生产地址', selected: false },
    { key: 'LSPZXLH', label: '配置序列号', selected: false },
    { key: 'CONFIG_SEQUENCE_NUM', label: '配置序列号', selected: false },
    { key: 'POINTS_CONF_ID', label: '双积分ID', selected: false },
    { key: 'CPH', label: '产品号', selected: false },
    { key: 'SF', label: '省份', selected: false },
    { key: 'CS', label: '城市', selected: false },
    { key: 'QX', label: '区县', selected: false },
    { key: 'G50', label: '六大类', selected: false },
    { key: 'XNYBJ', label: '新能源标记', selected: false },
    { key: 'XNYLB', label: '新能源类别', selected: false },
    { key: 'QYID', label: '公告企业ID', selected: false },
    { key: 'GXSJ', label: '更新时间', selected: false },
    { key: 'JT', label: '集团', selected: false },
    { key: 'UPY', label: '上传年', selected: false },
    { key: 'UPM', label: '上传月', selected: false }
]

const fields = ref<Field[]>([])

// 初始化字段
const initializeFields = () => {
    const fieldType = props.fieldType || 'enterprise'
    fields.value = fieldType === 'certificate' ? [...certificateFields] : [...enterpriseFields]

    // 如果有初始字段配置，应用它们
    if (props.initialFields && props.initialFields.length > 0) {
        fields.value.forEach(field => {
            field.selected = props.initialFields!.includes(field.key)
        })
    }
}

const toggleField = (field: Field) => {
    field.selected = !field.selected
    emit('fields-change', fields.value.filter(f => f.selected).map(f => f.key))
}

// 监听props变化
watch(() => [props.fieldType, props.initialFields], () => {
    initializeFields()
}, { immediate: true })

// 组件挂载时发送初始选中的字段
onMounted(() => {
    emit('fields-change', fields.value.filter(f => f.selected).map(f => f.key))
})
</script>

<style scoped>
.display-fields {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    margin: 20px 0;
}

.fields-title {
    font-weight: bold;
    margin-bottom: 15px;
    color: #606266;
}

.fields-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.field-tag {
    cursor: pointer;
    user-select: none;
}

.field-tag:hover {
    opacity: 0.8;
}
</style>