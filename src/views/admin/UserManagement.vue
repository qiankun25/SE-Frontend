<template>
  <div class="user-management">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>用户管理</h2>
        <p class="page-description">
          管理系统用户账号、角色分配、权限设置等用户相关信息
        </p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon>
            <Plus />
          </el-icon>
          新增用户
        </el-button>
        <el-button @click="handleReset">
          <el-icon>
            <Refresh />
          </el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 查询条件区域 -->
    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
        </div>
      </template>

      <el-form :model="searchForm" :inline="true" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="用户名">
              <el-input
                v-model="searchForm.username"
                placeholder="请输入用户名"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="真实姓名">
              <el-input
                v-model="searchForm.realName"
                placeholder="请输入真实姓名"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="用户状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择用户状态"
                clearable
              >
                <el-option label="启用" value="启用" />
                <el-option label="禁用" value="禁用" />
                <el-option label="锁定" value="锁定" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="用户角色">
              <el-select
                v-model="searchForm.role"
                placeholder="请选择用户角色"
                clearable
              >
                <el-option label="系统管理员" value="系统管理员" />
                <el-option label="业务管理员" value="业务管理员" />
                <el-option label="普通用户" value="普通用户" />
                <el-option label="只读用户" value="只读用户" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="searchForm.createTime"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <div class="search-actions">
              <el-button type="primary" @click="handleSearch" :loading="loading">
                <el-icon>
                  <Search />
                </el-icon>
                查询
              </el-button>
              <el-button @click="handleReset">
                <el-icon>
                  <Refresh />
                </el-icon>
                重置
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 结果展示区域 -->
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <span class="result-count">共 {{ total }} 条记录</span>
        </div>
      </template>

      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="scope">
            <el-tag 
              :type="scope.row.role === '系统管理员' ? 'danger' : 
                     scope.row.role === '业务管理员' ? 'warning' : 'primary'"
            >
              {{ scope.row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === '启用' ? 'success' : 
                     scope.row.status === '禁用' ? 'danger' : 'warning'"
            >
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="150" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button 
              link 
              :type="scope.row.status === '启用' ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === '启用' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="info" @click="handleResetPassword(scope.row)">
              重置密码
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="editForm.id ? '编辑用户' : '新增用户'"
      width="600px"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" :disabled="!!editForm.id" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="editForm.realName" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editForm.role" style="width: 100%">
            <el-option label="系统管理员" value="系统管理员" />
            <el-option label="业务管理员" value="业务管理员" />
            <el-option label="普通用户" value="普通用户" />
            <el-option label="只读用户" value="只读用户" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio value="启用">启用</el-radio>
            <el-radio value="禁用">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!editForm.id" label="密码" prop="password">
          <el-input v-model="editForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const total = ref(0)
const tableData = ref([])
const showEditDialog = ref(false)
const editFormRef = ref()

// 搜索表单
const searchForm = reactive({
  username: '',
  realName: '',
  status: '',
  role: '',
  createTime: null
})

// 编辑表单
const editForm = reactive({
  id: null,
  username: '',
  realName: '',
  email: '',
  phone: '',
  role: '',
  status: '启用',
  password: ''
})

// 表单验证规则
const editRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 查询方法
const handleSearch = async () => {
  loading.value = true
  try {
    // TODO: 调用API接口
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('查询完成')
  } catch (error) {
    ElMessage.error('查询失败')
  } finally {
    loading.value = false
  }
}

// 重置方法
const handleReset = () => {
  Object.assign(searchForm, {
    username: '',
    realName: '',
    status: '',
    role: '',
    createTime: null
  })
  pagination.page = 1
  pagination.pageSize = 20
  total.value = 0
  tableData.value = []
}

// 新增用户
const handleAdd = () => {
  Object.assign(editForm, {
    id: null,
    username: '',
    realName: '',
    email: '',
    phone: '',
    role: '',
    status: '启用',
    password: ''
  })
  showEditDialog.value = true
}

// 编辑用户
const handleEdit = (row: any) => {
  Object.assign(editForm, { ...row, password: '' })
  showEditDialog.value = true
}

// 保存用户
const handleSave = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    saving.value = true
    
    // TODO: 调用API接口
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(editForm.id ? '用户更新成功' : '用户创建成功')
    showEditDialog.value = false
    handleSearch()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 切换用户状态
const handleToggleStatus = async (row: any) => {
  const action = row.status === '启用' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}用户 ${row.username} 吗？`, '确认操作')
    // TODO: 调用API接口
    ElMessage.success(`用户${action}成功`)
    handleSearch()
  } catch (error) {
    // 用户取消操作
  }
}

// 重置密码
const handleResetPassword = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要重置用户 ${row.username} 的密码吗？`, '确认操作')
    // TODO: 调用API接口
    ElMessage.success('密码重置成功，新密码已发送到用户邮箱')
  } catch (error) {
    // 用户取消操作
  }
}

// 删除用户
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 ${row.username} 吗？此操作不可恢复！`, '确认删除', {
      type: 'warning'
    })
    // TODO: 调用API接口
    ElMessage.success('用户删除成功')
    handleSearch()
  } catch (error) {
    // 用户取消操作
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  handleSearch()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  handleSearch()
}

// 组件挂载
onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.search-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-count {
  color: #909399;
  font-size: 14px;
}

.search-actions {
  text-align: right;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
