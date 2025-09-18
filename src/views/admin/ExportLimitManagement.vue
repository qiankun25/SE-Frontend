<template>
  <div class="export-limit-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>导出限制管理</span>
          <el-button type="primary" @click="showAddDialog = true">
            添加配置
          </el-button>
        </div>
      </template>
      
      <!-- 搜索筛选 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="配置类型">
          <el-select v-model="searchForm.configType" placeholder="请选择">
            <el-option label="角色配置" value="role" />
            <el-option label="用户配置" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择">
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchConfigs">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 配置列表 -->
      <el-table :data="configList" v-loading="loading">
        <el-table-column prop="configType" label="配置类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.configType === 'role' ? 'primary' : 'success'">
              {{ row.configType === 'role' ? '角色' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetName" label="目标" width="150" />
        <el-table-column prop="exportType" label="导出类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getExportTypeLabel(row.exportType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dailyLimit" label="每日限额" width="100" />
        <el-table-column prop="isEnabled" label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.isEnabled"
              @change="toggleConfig(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="effectiveFrom" label="生效时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="editConfig(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteConfig(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchConfigs"
        @current-change="fetchConfigs"
      />
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingConfig ? '编辑配置' : '添加配置'"
      width="600px"
    >
      <el-form
        ref="configFormRef"
        :model="configForm"
        :rules="configRules"
        label-width="120px"
      >
        <el-form-item label="配置类型" prop="configType">
          <el-radio-group v-model="configForm.configType">
            <el-radio label="role">角色配置</el-radio>
            <el-radio label="user">用户配置</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item 
          v-if="configForm.configType === 'role'"
          label="选择角色" 
          prop="targetId"
        >
          <el-select v-model="configForm.targetId" placeholder="请选择角色">
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item 
          v-if="configForm.configType === 'user'"
          label="选择用户" 
          prop="targetId"
        >
          <el-select
            v-model="configForm.targetId"
            placeholder="请输入用户名搜索"
            filterable
            remote
            :remote-method="searchUsers"
            :loading="userSearchLoading"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="`${user.name} (${user.username})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="导出类型" prop="exportType">
          <el-select v-model="configForm.exportType">
            <el-option label="所有导出" value="all" />
            <el-option label="当前页导出" value="current" />
            <el-option label="全部数据导出" value="full" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="每日限额" prop="dailyLimit">
          <el-input-number
            v-model="configForm.dailyLimit"
            :min="0"
            :max="1000"
            placeholder="请输入每日限额"
          />
        </el-form-item>
        
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="configForm.effectiveFrom"
            type="datetime"
            placeholder="选择生效时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="失效时间">
          <el-date-picker
            v-model="configForm.effectiveTo"
            type="datetime"
            placeholder="选择失效时间（可选）"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="configForm.remarks"
            type="textarea"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { exportLimitApi } from '../../services/exportLimitApi'

// 响应式数据
const loading = ref(false)
const showAddDialog = ref(false)
const editingConfig = ref(null)
const configList = ref([])
const roleList = ref([])
const userList = ref([])
const userSearchLoading = ref(false)

// 搜索表单
const searchForm = reactive({
  configType: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 配置表单
const configForm = reactive({
  configType: 'role',
  targetId: null,
  exportType: 'all',
  dailyLimit: 20,
  effectiveFrom: null,
  effectiveTo: null,
  remarks: ''
})

// 表单验证规则
const configRules = {
  configType: [
    { required: true, message: '请选择配置类型', trigger: 'change' }
  ],
  targetId: [
    { required: true, message: '请选择目标', trigger: 'change' }
  ],
  exportType: [
    { required: true, message: '请选择导出类型', trigger: 'change' }
  ],
  dailyLimit: [
    { required: true, message: '请输入每日限额', trigger: 'blur' },
    { type: 'number', min: 0, max: 1000, message: '限额必须在0-1000之间', trigger: 'blur' }
  ]
}

// 方法
const fetchConfigs = async () => {
  loading.value = true
  try {
    // 这里应该调用获取配置列表的API
    // const response = await exportLimitApi.getConfigs(...)
    // configList.value = response.data.list
    // pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取配置列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.configType = ''
  searchForm.status = ''
  fetchConfigs()
}

const getExportTypeLabel = (type: string) => {
  const labels = {
    all: '所有导出',
    current: '当前页',
    full: '全部数据'
  }
  return labels[type] || type
}

const toggleConfig = async (row: any) => {
  try {
    // 调用切换状态的API
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    row.isEnabled = !row.isEnabled // 回滚状态
  }
}

const editConfig = (row: any) => {
  editingConfig.value = row
  Object.assign(configForm, row)
  showAddDialog.value = true
}

const deleteConfig = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个配置吗？', '确认删除', {
      type: 'warning'
    })
    
    // 调用删除API
    ElMessage.success('删除成功')
    fetchConfigs()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const saveConfig = async () => {
  try {
    if (configForm.configType === 'role') {
      await exportLimitApi.setRoleExportLimit({
        role_id: configForm.targetId,
        export_type: configForm.exportType,
        daily_limit: configForm.dailyLimit,
        remarks: configForm.remarks
      })
    } else {
      await exportLimitApi.setUserExportLimit({
        user_id: configForm.targetId,
        export_type: configForm.exportType,
        daily_limit: configForm.dailyLimit,
        effective_from: configForm.effectiveFrom,
        effective_to: configForm.effectiveTo,
        remarks: configForm.remarks
      })
    }
    
    ElMessage.success('保存成功')
    showAddDialog.value = false
    fetchConfigs()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const searchUsers = async (query: string) => {
  if (!query) return
  
  userSearchLoading.value = true
  try {
    // 调用搜索用户API
    // const response = await userApi.searchUsers(query)
    // userList.value = response.data
  } catch (error) {
    ElMessage.error('搜索用户失败')
  } finally {
    userSearchLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchConfigs()
  // 获取角色列表
  // fetchRoles()
})
</script>

<style scoped>
.export-limit-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
