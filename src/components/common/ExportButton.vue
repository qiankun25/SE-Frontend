<template>
  <div class="export-button">
    <el-dropdown @command="handleExportCommand" :disabled="disabled">
      <el-button type="primary" :loading="exporting">
        <el-icon><Download /></el-icon>
        {{ buttonText }}
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="current">导出当前页</el-dropdown-item>
          <el-dropdown-item command="all">导出全部数据</el-dropdown-item>
          <el-dropdown-item command="selected" v-if="allowSelectExport">导出选中数据</el-dropdown-item>
          <el-dropdown-item divided command="template">下载模板</el-dropdown-item>
          <el-dropdown-item command="config">导出配置</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 导出配置对话框 -->
    <el-dialog
      v-model="showConfigDialog"
      title="导出配置"
      width="600px"
      @close="closeConfigDialog"
    >
      <el-form :model="exportConfig" label-width="100px">
        <el-form-item label="文件名称">
          <el-input v-model="exportConfig.filename" placeholder="请输入文件名称" />
        </el-form-item>

        <el-form-item label="文件格式">
          <el-radio-group v-model="exportConfig.format">
            <el-radio value="excel">Excel (.xlsx)</el-radio>
            <el-radio value="csv">CSV (.csv)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="导出字段">
          <div class="field-selection">
            <el-checkbox
              v-model="selectAllFields"
              :indeterminate="isIndeterminate"
              @change="handleSelectAllFields"
            >
              全选
            </el-checkbox>
            <el-divider />
            <el-checkbox-group v-model="exportConfig.selectedFields">
              <div class="field-grid">
                <el-checkbox
                  v-for="field in availableFields"
                  :key="field.key"
                  :value="field.key"
                  :label="field.label"
                />
              </div>
            </el-checkbox-group>
          </div>
        </el-form-item>

        <el-form-item label="数据范围">
          <el-radio-group v-model="exportConfig.range">
            <el-radio value="current">当前页数据</el-radio>
            <el-radio value="all">全部数据</el-radio>
            <el-radio value="filtered">筛选后数据</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="其他选项">
          <el-checkbox v-model="exportConfig.includeHeader">包含表头</el-checkbox>
          <el-checkbox v-model="exportConfig.includeIndex">包含序号</el-checkbox>
          <el-checkbox v-model="exportConfig.includeTimestamp">包含导出时间</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeConfigDialog">取消</el-button>
        <el-button type="primary" @click="executeExport">确定导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, ArrowDown } from '@element-plus/icons-vue'
import type { ExportParams } from '../../types/api'

interface FieldOption {
  key: string
  label: string
  required?: boolean
}

interface ExportConfig {
  filename: string
  format: 'excel' | 'csv'
  selectedFields: string[]
  range: 'current' | 'all' | 'filtered'
  includeHeader: boolean
  includeIndex: boolean
  includeTimestamp: boolean
}

interface Props {
  data?: any[]
  selectedData?: any[]
  totalCount?: number
  fields?: FieldOption[]
  defaultFilename?: string
  buttonText?: string
  disabled?: boolean
  allowSelectExport?: boolean
}

interface Emits {
  (e: 'export', config: ExportConfig & { command: string }): void
  (e: 'download-template'): void
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  selectedData: () => [],
  totalCount: 0,
  fields: () => [],
  defaultFilename: '导出数据',
  buttonText: '导出数据',
  disabled: false,
  allowSelectExport: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const exporting = ref(false)
const showConfigDialog = ref(false)
const exportConfig = ref<ExportConfig>({
  filename: '',
  format: 'excel',
  selectedFields: [],
  range: 'current',
  includeHeader: true,
  includeIndex: true,
  includeTimestamp: false
})

// 可用字段
const availableFields = computed(() => {
  return props.fields.length > 0 ? props.fields : [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '名称' },
    { key: 'createTime', label: '创建时间' }
  ]
})

// 全选状态
const selectAllFields = ref(false)
const isIndeterminate = computed(() => {
  const selectedCount = exportConfig.value.selectedFields.length
  const totalCount = availableFields.value.length
  return selectedCount > 0 && selectedCount < totalCount
})

// 监听字段变化
watch(() => props.fields, (newFields) => {
  if (newFields.length > 0) {
    // 默认选择所有非必需字段
    exportConfig.value.selectedFields = newFields
      .filter(field => !field.required)
      .map(field => field.key)
  }
}, { immediate: true })

// 监听默认文件名变化
watch(() => props.defaultFilename, (newFilename) => {
  exportConfig.value.filename = newFilename
}, { immediate: true })

// 处理导出命令
const handleExportCommand = async (command: string) => {
  switch (command) {
    case 'current':
      await executeQuickExport('current')
      break
    case 'all':
      await executeQuickExport('all')
      break
    case 'selected':
      await executeQuickExport('selected')
      break
    case 'template':
      handleDownloadTemplate()
      break
    case 'config':
      showConfigDialog.value = true
      break
  }
}

// 快速导出
const executeQuickExport = async (command: string) => {
  if (command === 'current' && props.data.length === 0) {
    ElMessage.warning('当前页没有数据可导出')
    return
  }

  if (command === 'selected' && props.selectedData.length === 0) {
    ElMessage.warning('请先选择要导出的数据')
    return
  }

  exporting.value = true

  try {
    const config: ExportConfig & { command: string } = {
      ...exportConfig.value,
      command,
      range: command as any,
      selectedFields: availableFields.value.map(field => field.key)
    }

    emit('export', config)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

// 执行配置导出
const executeExport = async () => {
  if (!exportConfig.value.filename.trim()) {
    ElMessage.warning('请输入文件名称')
    return
  }

  if (exportConfig.value.selectedFields.length === 0) {
    ElMessage.warning('请至少选择一个导出字段')
    return
  }

  exporting.value = true

  try {
    const config: ExportConfig & { command: string } = {
      ...exportConfig.value,
      command: 'config'
    }

    emit('export', config)
    
    closeConfigDialog()
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

// 下载模板
const handleDownloadTemplate = () => {
  emit('download-template')
}

// 处理全选字段
const handleSelectAllFields = (checked: boolean) => {
  if (checked) {
    exportConfig.value.selectedFields = availableFields.value.map(field => field.key)
  } else {
    exportConfig.value.selectedFields = []
  }
}

// 关闭配置对话框
const closeConfigDialog = () => {
  showConfigDialog.value = false
}

// 监听选中字段变化，更新全选状态
watch(() => exportConfig.value.selectedFields, (newFields) => {
  const totalCount = availableFields.value.length
  selectAllFields.value = newFields.length === totalCount
}, { deep: true })
</script>

<style scoped>
.export-button {
  display: inline-block;
}

.field-selection {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.field-grid .el-checkbox {
  margin-right: 0;
}
</style>
