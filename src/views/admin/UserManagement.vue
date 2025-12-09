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
              <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="真实姓名">
              <el-input v-model="searchForm.realName" placeholder="请输入真实姓名" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="用户状态">
              <el-select v-model="searchForm.status" placeholder="请选择用户状态" clearable>
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
              <el-select v-model="searchForm.role" placeholder="请选择用户角色" clearable>
                <el-option v-for="role in roleList" :key="role.id" :label="role.description || role.name"
                  :value="role.description || role.name" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="创建时间">
              <el-date-picker v-model="searchForm.createTime" type="daterange" range-separator="至"
                start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
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

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column label="角色" width="150">
          <template #default="scope">
            <el-tag v-for="role in scope.row.roles" :key="role.id" :type="role.name === 'admin' ? 'danger' : 'primary'"
              size="small" style="margin-right: 4px;">
              {{ role.description || role.name }}
            </el-tag>
            <span v-if="!scope.row.roles || scope.row.roles.length === 0">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'danger'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login" label="最后登录" width="150">
          <template #default="scope">
            {{ scope.row.last_login ? new Date(scope.row.last_login).toLocaleString('zh-CN') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="150">
          <template #default="scope">
            {{ scope.row.created_at ? new Date(scope.row.created_at).toLocaleString('zh-CN') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button link :type="scope.row.is_active ? 'warning' : 'success'" @click="handleToggleStatus(scope.row)">
              {{ scope.row.is_active ? '禁用' : '启用' }}
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
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 用户编辑对话框 -->
    <el-dialog v-model="showEditDialog" :title="editForm.id ? '编辑用户' : '新增用户'" width="600px">
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
            <el-option v-for="role in roleList" :key="role.id" :label="role.description || role.name"
              :value="role.description || role.name" />
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
import { userManagementApi } from '../../services/api'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const total = ref(0)
const tableData = ref([])
const showEditDialog = ref(false)
const editFormRef = ref()
const roleList = ref<any[]>([])

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
    const response = await userManagementApi.getUserList({
      username: searchForm.username || undefined,
      name: searchForm.realName || undefined,
      is_active: searchForm.status === '启用' ? true : searchForm.status === '禁用' ? false : undefined,
      role_id: searchForm.role ? getRoleIdByDescription(searchForm.role) : undefined,
      page: pagination.page,
      page_size: pagination.pageSize
    })

    if (response.code === 200) {
      tableData.value = response.data.list
      total.value = response.data.total
      ElMessage.success(`查询完成，共找到 ${response.data.total} 个用户`)
    } else {
      ElMessage.error(response.message || '查询失败')
    }
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败')
  } finally {
    loading.value = false
  }
}

// 加载角色列表
const loadRoles = async () => {
  try {
    const response = await userManagementApi.getAllRoles()
    if (response.code === 200) {
      roleList.value = response.data
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

// 辅助函数：根据角色描述获取角色ID
const getRoleIdByDescription = (description: string): number | undefined => {
  const role = roleList.value.find(r => r.description === description || r.name === description)
  return role?.id
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
  // 获取用户的第一个角色描述
  const roleDescription = row.roles && row.roles.length > 0
    ? (row.roles[0].description || row.roles[0].name)
    : ''

  Object.assign(editForm, {
    id: row.id,
    username: row.username,
    realName: row.name,
    email: row.email,
    phone: row.phone,
    role: roleDescription,
    status: row.is_active ? '启用' : '禁用',
    password: ''
  })
  showEditDialog.value = true
}

// 保存用户
const handleSave = async () => {
  if (!editFormRef.value) return

  try {
    await editFormRef.value.validate()
    saving.value = true

    // 获取角色ID列表
    const roleIds = editForm.role ? [getRoleIdByDescription(editForm.role)] : []

    if (editForm.id) {
      // 更新用户
      // 判断是否是管理员角色
      const selectedRole = roleList.value.find(r => r.description === editForm.role || r.name === editForm.role)
      const isAdmin = selectedRole?.name === 'admin'

      const response = await userManagementApi.updateUser(editForm.id, {
        name: editForm.realName,
        email: editForm.email,
        phone: editForm.phone,
        is_admin: isAdmin,
        role_ids: roleIds.filter(id => id !== undefined) as number[]
      })

      if (response.code === 200) {
        ElMessage.success('用户更新成功')
        showEditDialog.value = false
        handleSearch()
      } else {
        ElMessage.error(response.message || '更新失败')
      }
    } else {
      // 创建用户
      // 判断是否是管理员角色
      const selectedRole = roleList.value.find(r => r.description === editForm.role || r.name === editForm.role)
      const isAdmin = selectedRole?.name === 'admin'

      const response = await userManagementApi.createUser({
        username: editForm.username,
        password: editForm.password,
        name: editForm.realName,
        email: editForm.email,
        phone: editForm.phone,
        is_admin: isAdmin,
        role_ids: roleIds.filter(id => id !== undefined) as number[]
      })

      if (response.code === 200) {
        ElMessage.success('用户创建成功')
        showEditDialog.value = false
        handleSearch()
      } else {
        ElMessage.error(response.message || '创建失败')
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 切换用户状态
const handleToggleStatus = async (row: any) => {
  const action = row.is_active ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}用户 ${row.username} 吗？`, '确认操作')

    const response = await userManagementApi.toggleUserStatus(row.id)
    if (response.code === 200) {
      ElMessage.success(response.message || `用户${action}成功`)
      handleSearch()
    } else {
      ElMessage.error(response.message || `${action}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换状态失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 重置密码
const handleResetPassword = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要重置用户 ${row.username} 的密码吗？`, '确认操作')

    const response = await userManagementApi.resetUserPassword(row.id)
    if (response.code === 200) {
      await ElMessageBox.alert(
        `新密码：${response.data.new_password}\n\n${response.data.note}`,
        '密码重置成功',
        {
          confirmButtonText: '我已复制',
          type: 'success'
        }
      )
    } else {
      ElMessage.error(response.message || '重置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置密码失败:', error)
      ElMessage.error('重置失败')
    }
  }
}

// 删除用户
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 ${row.username} 吗？此操作不可恢复！`, '确认删除', {
      type: 'warning'
    })

    const response = await userManagementApi.deleteUser(row.id)
    if (response.code === 200) {
      ElMessage.success('用户删除成功')
      handleSearch()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error('删除失败')
    }
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
onMounted(async () => {
  await loadRoles()
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
  font-size: 22px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 16px;
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
  font-size: 16px;
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
