<template>
  <div class="permission-management">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>权限管理</h2>
        <p class="page-description">
          管理系统角色权限、功能权限、数据权限等权限配置信息
        </p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAddRole">
          <el-icon>
            <Plus />
          </el-icon>
          新增角色
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 角色列表 -->
    <el-card class="role-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>角色列表</span>
        </div>
      </template>

      <el-table :data="roleData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="roleName" label="角色名称" width="150" />
        <el-table-column prop="roleCode" label="角色代码" width="150" />
        <el-table-column prop="description" label="角色描述" />
        <el-table-column prop="userCount" label="用户数量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '启用' ? 'success' : 'danger'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="150" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEditRole(scope.row)">
              编辑
            </el-button>
            <el-button link type="warning" @click="handlePermissionConfig(scope.row)">
              权限配置
            </el-button>
            <el-button link :type="scope.row.status === '启用' ? 'warning' : 'success'"
              @click="handleToggleRoleStatus(scope.row)">
              {{ scope.row.status === '启用' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDeleteRole(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 角色编辑对话框 -->
    <el-dialog v-model="showRoleDialog" :title="roleForm.id ? '编辑角色' : '新增角色'" width="500px">
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="roleForm.roleName" />
        </el-form-item>
        <el-form-item label="角色代码" prop="roleCode">
          <el-input v-model="roleForm.roleCode" :disabled="!!roleForm.id" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roleForm.status">
            <el-radio value="启用">启用</el-radio>
            <el-radio value="禁用">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showRoleDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRole" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog v-model="showPermissionDialog" title="权限配置" width="800px">
      <div class="permission-config">
        <div class="config-header">
          <h4>为角色 "{{ currentRole.roleName }}" 配置权限</h4>
        </div>

        <!-- 功能权限 -->
        <div class="permission-tree-container">
          <el-tree ref="functionTreeRef" :data="functionPermissions" :props="treeProps" show-checkbox node-key="id"
            :default-checked-keys="checkedFunctionKeys" @check="handleFunctionCheck" />
        </div>
      </div>

      <template #footer>
        <el-button @click="showPermissionDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermission" :loading="saving">保存权限</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { roleManagementApi } from '../../services/api'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const showRoleDialog = ref(false)
const showPermissionDialog = ref(false)
const activeTab = ref('function')
const roleFormRef = ref()
const functionTreeRef = ref()
const dataTreeRef = ref()

// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 角色数据
const roleData = ref<any[]>([])

// 当前操作的角色
const currentRole = ref<any>({})

// 角色表单
const roleForm = reactive({
  id: null,
  roleName: '',
  roleCode: '',
  description: '',
  status: '启用'
})

// 表单验证规则
const roleRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色代码', trigger: 'blur' }],
  description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }]
}

// 功能权限树数据
const functionPermissions = ref<any[]>([])

// 数据权限
const dataPermission = reactive({
  scope: 'all'
})

const dataPermissions = ref([
  {
    id: 1,
    label: '北京市',
    children: [
      { id: 11, label: '朝阳区' },
      { id: 12, label: '海淀区' }
    ]
  },
  {
    id: 2,
    label: '上海市',
    children: [
      { id: 21, label: '浦东新区' },
      { id: 22, label: '黄浦区' }
    ]
  }
])

// 已选中的权限
const checkedFunctionKeys = ref<string[]>([])

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 刷新数据
const handleRefresh = async () => {
  loading.value = true
  try {
    const response = await roleManagementApi.getRoleList({
      page: pagination.page,
      page_size: pagination.pageSize
    })

    if (response.code === 200) {
      roleData.value = response.data.list.map((role: any) => ({
        id: role.id,
        roleName: role.name,
        roleCode: role.name,
        description: role.description,
        userCount: role.user_count,
        status: role.is_active ? '启用' : '禁用',
        createTime: role.created_at ? new Date(role.created_at).toLocaleString('zh-CN') : '-',
        permissions: role.permissions,
        is_active: role.is_active
      }))
      pagination.total = response.data.total
      ElMessage.success('数据刷新完成')
    } else {
      ElMessage.error(response.message || '数据刷新失败')
    }
  } catch (error) {
    console.error('数据刷新失败:', error)
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

// 新增角色
const handleAddRole = () => {
  Object.assign(roleForm, {
    id: null,
    roleName: '',
    roleCode: '',
    description: '',
    status: '启用'
  })
  showRoleDialog.value = true
}

// 编辑角色
const handleEditRole = (row: any) => {
  Object.assign(roleForm, { ...row })
  showRoleDialog.value = true
}

// 保存角色
const handleSaveRole = async () => {
  if (!roleFormRef.value) return

  try {
    await roleFormRef.value.validate()
    saving.value = true

    if (roleForm.id) {
      // 更新角色
      const response = await roleManagementApi.updateRole(roleForm.id, {
        name: roleForm.roleName,
        description: roleForm.description,
        is_active: roleForm.status === '启用'
      })

      if (response.code === 200) {
        ElMessage.success('角色更新成功')
        showRoleDialog.value = false
        handleRefresh()
      } else {
        ElMessage.error(response.message || '更新失败')
      }
    } else {
      // 创建角色
      const response = await roleManagementApi.createRole({
        name: roleForm.roleName,
        description: roleForm.description
      })

      if (response.code === 200) {
        ElMessage.success('角色创建成功')
        showRoleDialog.value = false
        handleRefresh()
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

// 权限配置
const handlePermissionConfig = async (row: any) => {
  currentRole.value = row

  // 加载权限树
  try {
    const treeResponse = await roleManagementApi.getPermissionTree()
    if (treeResponse.code === 200) {
      functionPermissions.value = treeResponse.data
    }

    // 加载角色当前权限
    const permResponse = await roleManagementApi.getRolePermissions(row.id)
    if (permResponse.code === 200) {
      checkedFunctionKeys.value = permResponse.data
    }

    showPermissionDialog.value = true
  } catch (error) {
    console.error('加载权限配置失败:', error)
    ElMessage.error('加载权限配置失败')
  }
}

// 功能权限选择
const handleFunctionCheck = (data: any, checked: any) => {
  console.log('功能权限变更:', data, checked)
}

// 保存权限配置
const handleSavePermission = async () => {
  saving.value = true
  try {
    const functionKeys = functionTreeRef.value?.getCheckedKeys() || []

    const response = await roleManagementApi.updateRolePermissions(
      currentRole.value.id,
      functionKeys
    )

    if (response.code === 200) {
      ElMessage.success('权限配置保存成功')
      showPermissionDialog.value = false
      handleRefresh()
    } else {
      ElMessage.error(response.message || '权限配置保存失败')
    }
  } catch (error) {
    console.error('权限配置保存失败:', error)
    ElMessage.error('权限配置保存失败')
  } finally {
    saving.value = false
  }
}

// 切换角色状态
const handleToggleRoleStatus = async (row: any) => {
  const action = row.is_active ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}角色 ${row.roleName} 吗？`, '确认操作')

    const response = await roleManagementApi.toggleRoleStatus(row.id)
    if (response.code === 200) {
      ElMessage.success(response.message || `角色${action}成功`)
      handleRefresh()
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

// 删除角色
const handleDeleteRole = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色 ${row.roleName} 吗？此操作不可恢复！`, '确认删除', {
      type: 'warning'
    })

    const response = await roleManagementApi.deleteRole(row.id)
    if (response.code === 200) {
      ElMessage.success('角色删除成功')
      handleRefresh()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除角色失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 组件挂载
onMounted(() => {
  handleRefresh()
})
</script>

<style scoped>
.permission-management {
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

.role-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-config {
  min-height: 400px;
}

.config-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.config-header h4 {
  margin: 0;
  color: #303133;
}

.permission-tree-container {
  padding: 20px;
  min-height: 400px;
}

:deep(.el-tree) {
  max-height: 400px;
  overflow-y: auto;
}
</style>
