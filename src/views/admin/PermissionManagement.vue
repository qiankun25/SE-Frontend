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

      <el-table
        :data="roleData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
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
            <el-button 
              link 
              :type="scope.row.status === '启用' ? 'warning' : 'success'"
              @click="handleToggleRoleStatus(scope.row)"
            >
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
    <el-dialog
      v-model="showRoleDialog"
      :title="roleForm.id ? '编辑角色' : '新增角色'"
      width="500px"
    >
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
    <el-dialog
      v-model="showPermissionDialog"
      title="权限配置"
      width="800px"
    >
      <div class="permission-config">
        <div class="config-header">
          <h4>为角色 "{{ currentRole.roleName }}" 配置权限</h4>
        </div>
        
        <el-tabs v-model="activeTab" type="card">
          <!-- 功能权限 -->
          <el-tab-pane label="功能权限" name="function">
            <el-tree
              ref="functionTreeRef"
              :data="functionPermissions"
              :props="treeProps"
              show-checkbox
              node-key="id"
              :default-checked-keys="checkedFunctionKeys"
              @check="handleFunctionCheck"
            />
          </el-tab-pane>
          
          <!-- 数据权限 -->
          <el-tab-pane label="数据权限" name="data">
            <el-form label-width="120px">
              <el-form-item label="数据范围">
                <el-radio-group v-model="dataPermission.scope">
                  <el-radio value="all">全部数据</el-radio>
                  <el-radio value="dept">本部门数据</el-radio>
                  <el-radio value="self">仅本人数据</el-radio>
                  <el-radio value="custom">自定义数据</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item v-if="dataPermission.scope === 'custom'" label="自定义范围">
                <el-tree
                  ref="dataTreeRef"
                  :data="dataPermissions"
                  :props="treeProps"
                  show-checkbox
                  node-key="id"
                  :default-checked-keys="checkedDataKeys"
                />
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
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

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const showRoleDialog = ref(false)
const showPermissionDialog = ref(false)
const activeTab = ref('function')
const roleFormRef = ref()
const functionTreeRef = ref()
const dataTreeRef = ref()

// 角色数据
const roleData = ref([
  {
    id: 1,
    roleName: '系统管理员',
    roleCode: 'ADMIN',
    description: '系统最高权限管理员',
    userCount: 2,
    status: '启用',
    createTime: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    roleName: '业务管理员',
    roleCode: 'BUSINESS_ADMIN',
    description: '业务功能管理员',
    userCount: 5,
    status: '启用',
    createTime: '2024-01-02 10:00:00'
  }
])

// 当前操作的角色
const currentRole = ref({})

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
const functionPermissions = ref([
  {
    id: 1,
    label: '企业信息查询',
    children: [
      { id: 11, label: '集团基本信息' },
      { id: 12, label: '企业基本信息' },
      { id: 13, label: '企业监管状态' }
    ]
  },
  {
    id: 2,
    label: '常用业务查询',
    children: [
      { id: 21, label: '合格证上传数量' },
      { id: 22, label: '合格证单证信息' }
    ]
  },
  {
    id: 3,
    label: '可视化图表',
    children: [
      { id: 31, label: '大屏界面' }
    ]
  },
  {
    id: 4,
    label: '管理工具',
    children: [
      { id: 41, label: '用户管理' },
      { id: 42, label: '权限管理' }
    ]
  }
])

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
const checkedFunctionKeys = ref([11, 12, 21])
const checkedDataKeys = ref([11, 21])

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 刷新数据
const handleRefresh = async () => {
  loading.value = true
  try {
    // TODO: 调用API接口
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据刷新完成')
  } catch (error) {
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
    
    // TODO: 调用API接口
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(roleForm.id ? '角色更新成功' : '角色创建成功')
    showRoleDialog.value = false
    handleRefresh()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 权限配置
const handlePermissionConfig = (row: any) => {
  currentRole.value = row
  showPermissionDialog.value = true
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
    const dataKeys = dataTreeRef.value?.getCheckedKeys() || []
    
    // TODO: 调用API接口保存权限配置
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('权限配置保存成功')
    showPermissionDialog.value = false
  } catch (error) {
    ElMessage.error('权限配置保存失败')
  } finally {
    saving.value = false
  }
}

// 切换角色状态
const handleToggleRoleStatus = async (row: any) => {
  const action = row.status === '启用' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}角色 ${row.roleName} 吗？`, '确认操作')
    // TODO: 调用API接口
    ElMessage.success(`角色${action}成功`)
    handleRefresh()
  } catch (error) {
    // 用户取消操作
  }
}

// 删除角色
const handleDeleteRole = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色 ${row.roleName} 吗？此操作不可恢复！`, '确认删除', {
      type: 'warning'
    })
    // TODO: 调用API接口
    ElMessage.success('角色删除成功')
    handleRefresh()
  } catch (error) {
    // 用户取消操作
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

:deep(.el-tree) {
  max-height: 300px;
  overflow-y: auto;
}
</style>
