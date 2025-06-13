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
import { ref } from 'vue'

const emit = defineEmits(['fields-change'])

interface Field {
    key: string
    label: string
    selected: boolean
}

const fields = ref<Field[]>([
    { key: 'company_id', label: '企业ID', selected: true },
    { key: 'company_name', label: '企业名称', selected: true },
    { key: 'social_credit_code', label: '企业代码', selected: true },
    { key: 'company_type', label: '企业类型', selected: true },
    { key: 'national_standard_industry', label: '国标行业分类', selected: true },
    { key: 'registered_address', label: '注册地址', selected: true },
    { key: 'subsidiaries', label: '子公司名称', selected: true },
    { key: 'production_addresses', label: '生产基地信息', selected: true },
    { key: 'vehicle_brand', label: '车辆信息', selected: true }
])

const toggleField = (field: Field) => {
    field.selected = !field.selected
    emit('fields-change', fields.value.filter(f => f.selected).map(f => f.key))
}
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