<template>
  <div class="user-profile">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2>个人信息</h2>
        <p class="page-description">
          查看和修改您的个人信息
        </p>
      </div>
    </div>

    <!-- 个人信息表单 -->
    <el-card class="profile-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>

      <el-form ref="formRef" :model="profileForm" :rules="formRules" label-width="120px" :loading="loading">
        <el-form-item label="用户ID">
          <el-input v-model="profileForm.id" disabled />
        </el-form-item>

        <el-form-item label="用户名">
          <el-input v-model="profileForm.username" disabled />
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input v-model="profileForm.name" placeholder="请输入姓名" clearable maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" placeholder="请输入邮箱" clearable maxlength="100" />
        </el-form-item>

        <el-form-item label="电话" prop="phone">
          <el-input v-model="profileForm.phone" placeholder="请输入电话" clearable maxlength="20" />
        </el-form-item>

        <el-form-item label="部门" prop="department">
          <el-select v-model="profileForm.department" placeholder="请选择或输入部门" filterable allow-create clearable
            :loading="optionsLoading">
            <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>

        <el-form-item label="单位" prop="organization">
          <el-select v-model="profileForm.organization" placeholder="请选择或输入单位" filterable allow-create clearable
            :loading="optionsLoading">
            <el-option v-for="org in organizationOptions" :key="org" :label="org" :value="org" />
          </el-select>
        </el-form-item>

        <!-- <el-form-item label="权限">
          <el-tag
            v-for="permission in profileForm.permissions"
            :key="permission"
            style="margin-right: 8px; margin-bottom: 8px"
          >
            {{ permission }}
          </el-tag>
        </el-form-item> -->

        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">
            <el-icon>
              <Check />
            </el-icon>
            保存
          </el-button>
          <el-button @click="handleReset">
            <el-icon>
              <Refresh />
            </el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 密码修改卡片 -->
    <el-card class="profile-card password-card" shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>

      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordFormRules" label-width="120px">
        <el-form-item label="旧密码" prop="old_password">
          <el-input v-model="passwordForm.old_password" type="password" placeholder="请输入旧密码" show-password clearable />
        </el-form-item>

        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="passwordForm.new_password" type="password" placeholder="请输入新密码（至少6位）" show-password
            clearable />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirm_password">
          <el-input v-model="passwordForm.confirm_password" type="password" placeholder="请再次输入新密码" show-password
            clearable />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
            <el-icon>
              <Check />
            </el-icon>
            修改密码
          </el-button>
          <el-button @click="handleResetPassword">
            <el-icon>
              <Refresh />
            </el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElForm } from 'element-plus'
import { Check, Refresh } from '@element-plus/icons-vue'
import { commonApi } from '../services/api'
import { useAuth } from '../composables/useAuth'
import type { UserInfo, UpdateProfileRequest, ChangePasswordRequest } from '../types/api'

const { user, clearAuth, refreshPermissions } = useAuth()

// 表单引用
const formRef = ref<InstanceType<typeof ElForm>>()
const passwordFormRef = ref<InstanceType<typeof ElForm>>()

// 加载状态
const loading = ref(false)
const saving = ref(false)
const optionsLoading = ref(false)
const changingPassword = ref(false)

// 选项数据
const departmentOptions = ref<string[]>([])
const organizationOptions = ref<string[]>([])

// 原始用户信息（用于重置）
const originalProfile = ref<UserInfo | null>(null)

// 表单数据
const profileForm = ref<{
  id: string
  username: string
  name: string
  email?: string
  phone?: string
  department?: string
  organization?: string
  permissions: string[]
}>({
  id: '',
  username: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  organization: '',
  permissions: []
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 1, max: 100, message: '姓名长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: ['blur', 'change']
    }
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$|^[\d\s\-+()]+$/,
      message: '请输入正确的电话号码',
      trigger: 'blur'
    }
  ]
}

// 密码表单数据
const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

// 密码表单验证规则
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.value.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordFormRules = {
  old_password: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 加载用户信息
const loadUserProfile = async () => {
  loading.value = true
  try {
    const response = await commonApi.getUserProfile()
    if (response.code === 200 && response.data) {
      profileForm.value = {
        id: response.data.id,
        username: response.data.username,
        name: response.data.name,
        email: response.data.email || '',
        phone: response.data.phone || '',
        department: response.data.department || '',
        organization: response.data.organization || '',
        permissions: response.data.permissions || []
      }
      // 保存原始数据用于重置
      originalProfile.value = { ...response.data }
    } else {
      ElMessage.error(response.message || '获取用户信息失败')
    }
  } catch (error: any) {
    console.error('获取用户信息失败:', error)
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      clearAuth()
    } else {
      ElMessage.error('获取用户信息失败，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}

// 保存用户信息
const handleSave = async () => {
  if (!formRef.value) return

  // 表单验证
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      return false
    }

    saving.value = true
    try {
      const updateData: UpdateProfileRequest = {
        name: profileForm.value.name,
        email: profileForm.value.email || undefined,
        phone: profileForm.value.phone || undefined,
        department: profileForm.value.department || undefined,
        organization: profileForm.value.organization || undefined
      }

      const response = await commonApi.updateUserProfile(updateData)
      if (response.code === 200 && response.data) {
        ElMessage.success('保存成功')
        // 更新本地用户信息和 localStorage
        const currentUser = user.value
        if (currentUser) {
          const updatedUserInfo: UserInfo = {
            ...currentUser,
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone,
            department: response.data.department,
            organization: response.data.organization
          }
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
        }
        // 更新原始数据
        originalProfile.value = { ...response.data }
        // 更新表单数据
        profileForm.value = {
          id: response.data.id,
          username: response.data.username,
          name: response.data.name,
          email: response.data.email || '',
          phone: response.data.phone || '',
          department: response.data.department || '',
          organization: response.data.organization || '',
          permissions: response.data.permissions || []
        }
      } else {
        ElMessage.error(response.message || '保存失败')
      }
    } catch (error: any) {
      console.error('保存用户信息失败:', error)
      if (error.response?.status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        clearAuth()
      } else {
        ElMessage.error('保存失败，请稍后重试')
      }
    } finally {
      saving.value = false
    }
  })
}

// 重置表单
const handleReset = () => {
  if (originalProfile.value) {
    profileForm.value = {
      id: originalProfile.value.id,
      username: originalProfile.value.username,
      name: originalProfile.value.name,
      email: originalProfile.value.email || '',
      phone: originalProfile.value.phone || '',
      department: originalProfile.value.department || '',
      organization: originalProfile.value.organization || '',
      permissions: originalProfile.value.permissions || []
    }
    formRef.value?.clearValidate()
  }
}

// 加载选项数据
const loadOptions = async () => {
  optionsLoading.value = true
  try {
    const response = await commonApi.getProfileOptions()
    if (response.code === 200 && response.data) {
      departmentOptions.value = response.data.departments || []
      organizationOptions.value = response.data.organizations || []
    }
  } catch (error: any) {
    console.error('获取选项失败:', error)
    // 选项加载失败不影响主流程，只记录错误
  } finally {
    optionsLoading.value = false
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  // 表单验证
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) {
      return false
    }

    changingPassword.value = true
    try {
      const changeData: ChangePasswordRequest = {
        old_password: passwordForm.value.old_password,
        new_password: passwordForm.value.new_password
      }

      const response = await commonApi.changePassword(changeData)
      if (response.code === 200) {
        ElMessage.success('密码修改成功')
        // 清空表单
        handleResetPassword()
      } else {
        ElMessage.error(response.message || '密码修改失败')
      }
    } catch (error: any) {
      console.error('修改密码失败:', error)
      if (error.response?.status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        clearAuth()
      } else if (error.response?.status === 400) {
        ElMessage.error(error.response?.data?.detail || '密码修改失败，请检查旧密码是否正确')
      } else {
        ElMessage.error('密码修改失败，请稍后重试')
      }
    } finally {
      changingPassword.value = false
    }
  })
}

// 重置密码表单
const handleResetPassword = () => {
  passwordForm.value = {
    old_password: '',
    new_password: '',
    confirm_password: ''
  }
  passwordFormRef.value?.clearValidate()
}

// 组件挂载时加载数据
onMounted(() => {
  loadUserProfile()
  loadOptions()
})
</script>

<style scoped>
.user-profile {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-description {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.profile-card {
  background: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

:deep(.el-form) {
  max-width: 600px;
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  color: #606266;
  cursor: not-allowed;
}

:deep(.el-tag) {
  margin-right: 8px;
  margin-bottom: 8px;
}

.password-card {
  margin-top: 20px;
}
</style>
