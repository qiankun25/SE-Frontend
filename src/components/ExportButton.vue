<template>
  <div class="export-button">
    <!-- 导出配额显示 -->
    <div class="export-quota-info" v-if="showQuotaInfo && quotaInfo">
      <el-text size="small" type="info">
        今日已导出: {{ quotaInfo.used }}/{{ quotaInfo.limit }} 次
        <el-text v-if="quotaInfo.remaining <= 3" type="warning">
          (剩余 {{ quotaInfo.remaining }} 次)
        </el-text>
      </el-text>
    </div>

    <el-dropdown @command="handleExportCommand" :disabled="disabled || isQuotaExceeded">
      <el-button
        type="primary"
        :loading="exporting"
        :disabled="isQuotaExceeded"
      >
        <el-icon><Download /></el-icon>
        {{ buttonText }}
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            command="current"
            :disabled="!canExport('current')"
          >
            导出当前页
            <el-tag v-if="!canExport('current')" size="small" type="danger">
              配额不足
            </el-tag>
          </el-dropdown-item>
          <el-dropdown-item
            command="all"
            :disabled="!canExport('all')"
          >
            导出全部数据
            <el-tag v-if="!canExport('all')" size="small" type="danger">
              配额不足
            </el-tag>
          </el-dropdown-item>
          <el-dropdown-item
            command="selected"
            v-if="allowSelectExport"
            :disabled="!canExport('selected')"
          >
            导出选中数据
            <el-tag v-if="!canExport('selected')" size="small" type="danger">
              配额不足
            </el-tag>
          </el-dropdown-item>
          <el-dropdown-item divided command="template">下载模板</el-dropdown-item>
          <el-dropdown-item command="config">导出配置</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 配额不足提示 -->
    <el-alert
      v-if="isQuotaExceeded"
      title="导出配额已用完"
      type="warning"
      :closable="false"
      show-icon
      class="quota-alert"
    >
      <template #default>
        您今日的导出配额已用完，请明日再试或联系管理员增加配额。
      </template>
    </el-alert>

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
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, ArrowDown } from '@element-plus/icons-vue'
import type { ExportParams } from '../../types/api'
import { exportLimitApi, exportUtils, type QuotaInfo } from '../services/exportLimitApi'
import { useAuth } from '../composables/useAuth'

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
  showQuotaInfo?: boolean
  module?: string
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
  allowSelectExport: false,
  showQuotaInfo: true,
  module: 'default'
})

const emit = defineEmits<Emits>()

// 获取用户认证信息
const { user } = useAuth()

// 响应式数据
const exporting = ref(false)
const showConfigDialog = ref(false)
const quotaInfo = ref<QuotaInfo | null>(null)
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

// 配额相关计算属性
const isQuotaExceeded = computed(() => {
  return exportUtils.isQuotaExceeded(quotaInfo.value)
})

// 检查是否可以执行特定类型的导出
const canExport = (exportType: string): boolean => {
  return exportUtils.canExport(quotaInfo.value, exportType)
}

// 全选状态
const selectAllFields = ref(false)
const isIndeterminate = computed(() => {
  const selectedCount = exportConfig.value.selectedFields.length
  const totalCount = availableFields.value.length
  return selectedCount > 0 && selectedCount < totalCount
})

// 获取用户导出配额信息
const fetchQuotaInfo = async () => {
  try {
    if (!user.value || !props.showQuotaInfo) return

    const response = await exportLimitApi.getCurrentUserQuota()
    if (response.code === 200) {
      quotaInfo.value = response.data
    }
  } catch (error) {
    console.error('获取导出配额失败:', error)
  }
}

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

// 处理导出命令（增强版）
const handleExportCommand = async (command: string) => {
  // 模板下载和配置不需要检查配额
  if (command === 'template') {
    handleDownloadTemplate()
    return
  }

  if (command === 'config') {
    showConfigDialog.value = true
    return
  }

  // 1. 检查配额
  if (!canExport(command)) {
    ElMessage.warning('导出配额不足，无法执行此操作')
    return
  }

  // 2. 对于大数据量导出，显示确认对话框
  if (command === 'all' && quotaInfo.value && quotaInfo.value.remaining <= 5) {
    try {
      await ElMessageBox.confirm(
        `导出全部数据将消耗${exportUtils.getQuotaCost('all')}个配额，您当前剩余${quotaInfo.value.remaining}个配额。确定继续吗？`,
        '配额提醒',
        {
          confirmButtonText: '确定导出',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
    } catch {
      return // 用户取消
    }
  }

  // 3. 执行导出
  await executeQuickExport(command)
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

    // 刷新配额信息
    await fetchQuotaInfo()

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)

    // 处理配额相关错误
    if (error?.response?.status === 429) {
      ElMessage.error('导出配额已用完，请明日再试')
      await fetchQuotaInfo() // 刷新配额信息
    } else {
      ElMessage.error('导出失败，请重试')
    }
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

// 组件挂载时获取配额信息
onMounted(() => {
  if (props.showQuotaInfo) {
    fetchQuotaInfo()
  }
})

// 监听用户变化
watch(() => user.value, () => {
  if (props.showQuotaInfo && user.value) {
    fetchQuotaInfo()
  }
})
</script>

<style scoped>
.export-button {
  display: inline-block;
}

.export-quota-info {
  margin-bottom: 8px;
  text-align: right;
}

.quota-alert {
  margin-top: 8px;
}

.el-dropdown-menu__item:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
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
