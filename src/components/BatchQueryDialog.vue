<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-query-content">
      <el-form :model="form" label-width="120px">
        <el-form-item label="查询类型" v-if="queryTypes.length > 1">
          <el-radio-group v-model="form.query_type">
            <el-radio
              v-for="type in queryTypes"
              :key="type.value"
              :value="type.value"
            >
              {{ type.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="查询条件">
          <el-input
            v-model="form.queries_text"
            type="textarea"
            :rows="8"
            :placeholder="placeholder"
          />
          <div class="form-tip">
            每行输入一个查询条件，最多支持{{ maxQueries }}个条件
          </div>
        </el-form-item>
      </el-form>

      <div class="batch-actions">
        <el-button @click="handleDownloadTemplate" v-if="templateUrl">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
        <el-upload
          :show-file-list="false"
          :before-upload="handleFileUpload"
          accept=".xlsx,.xls,.csv"
          v-if="supportFileUpload"
        >
          <el-button>
            <el-icon><Upload /></el-icon>
            上传文件
          </el-button>
        </el-upload>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleConfirm"
          :loading="loading"
        >
          开始查询
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'

interface QueryType {
  value: string
  label: string
}

interface Props {
  modelValue: boolean
  title?: string
  queryTypes?: QueryType[]
  placeholder?: string
  maxQueries?: number
  templateUrl?: string
  supportFileUpload?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: { queries: string[]; query_type: string }): void
  (e: 'download-template'): void
  (e: 'file-upload', file: File): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '批量查询',
  queryTypes: () => [{ value: 'default', label: '默认查询' }],
  placeholder: '请输入查询条件，每行一个',
  maxQueries: 100,
  templateUrl: '',
  supportFileUpload: false,
  loading: false
})

const emit = defineEmits<Emits>()

const visible = ref(false)
const form = reactive({
  query_type: props.queryTypes[0]?.value || 'default',
  queries_text: ''
})

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    visible.value = newValue
  },
  { immediate: true }
)

// 监听 visible 变化
watch(visible, (newValue) => {
  emit('update:modelValue', newValue)
})

const handleClose = () => {
  visible.value = false
  form.queries_text = ''
}

const handleConfirm = () => {
  if (!form.queries_text.trim()) {
    ElMessage.warning('请输入查询条件')
    return
  }
  
  // 解析查询条件
  const queries = form.queries_text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  if (queries.length === 0) {
    ElMessage.warning('请输入有效的查询条件')
    return
  }
  
  if (queries.length > props.maxQueries) {
    ElMessage.warning(`查询条件不能超过${props.maxQueries}个`)
    return
  }
  
  emit('confirm', {
    queries,
    query_type: form.query_type
  })
}

const handleDownloadTemplate = () => {
  emit('download-template')
}

const handleFileUpload = (file: File) => {
  emit('file-upload', file)
  return false // 阻止自动上传
}

// 暴露方法供父组件调用
defineExpose({
  setQueriesText: (text: string) => {
    form.queries_text = text
  },
  getQueriesText: () => form.queries_text,
  clearForm: () => {
    form.queries_text = ''
  }
})
</script>

<style scoped>
.batch-query-content {
  padding: 10px 0;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.batch-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
