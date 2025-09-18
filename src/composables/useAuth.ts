import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { commonApi } from '../services/api'
import type { UserInfo, LoginRequest } from '../types/api'

// 全局状态
const token = ref<string | null>(localStorage.getItem('token'))
const user = ref<UserInfo | null>(null)
const permissions = ref<string[]>([])

// 初始化用户信息
const initUserInfo = () => {
  const savedUser = localStorage.getItem('userInfo')
  const savedPermissions = localStorage.getItem('permissions')
  
  if (savedUser) {
    try {
      user.value = JSON.parse(savedUser)
    } catch (error) {
      console.error('解析用户信息失败:', error)
      clearAuth()
    }
  }
  
  if (savedPermissions) {
    try {
      permissions.value = JSON.parse(savedPermissions)
    } catch (error) {
      console.error('解析权限信息失败:', error)
      permissions.value = []
    }
  }
}

// 清除认证信息
const clearAuth = () => {
  token.value = null
  user.value = null
  permissions.value = []
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('permissions')
  localStorage.removeItem('isLoggedIn') // 兼容旧版本
}

// 保存认证信息
const saveAuth = (authData: { token: string; user: UserInfo }) => {
  token.value = authData.token
  user.value = authData.user
  
  localStorage.setItem('token', authData.token)
  localStorage.setItem('userInfo', JSON.stringify(authData.user))
  localStorage.setItem('permissions', JSON.stringify(authData.user.permissions))
  localStorage.setItem('isLoggedIn', 'true') // 兼容旧版本
  
  permissions.value = authData.user.permissions
}

export const useAuth = () => {
  const router = useRouter()

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.name || user.value?.username || '')
  const userId = computed(() => user.value?.id || '')

  // 登录方法
  const login = async (loginData: LoginRequest): Promise<boolean> => {
    try {
      const response = await commonApi.login(loginData.username, loginData.password)
      
      if (response.code === 200) {
        saveAuth(response.data)
        ElMessage.success('登录成功')
        return true
      } else {
        ElMessage.error(response.message || '登录失败')
        return false
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      
      // 处理不同类型的错误
      if (error.response?.status === 401) {
        ElMessage.error('用户名或密码错误')
      } else if (error.response?.status === 403) {
        ElMessage.error('账户已被禁用')
      } else if (error.response?.status >= 500) {
        ElMessage.error('服务器错误，请稍后重试')
      } else {
        ElMessage.error('网络错误，请检查网络连接')
      }
      
      return false
    }
  }

  // 登出方法
  const logout = async (): Promise<void> => {
    try {
      // 调用后端登出接口
      await commonApi.logout()
    } catch (error) {
      console.error('登出接口调用失败:', error)
      // 即使接口失败也要清除本地状态
    } finally {
      clearAuth()
      ElMessage.success('已退出登录')
      router.push('/login')
    }
  }

  // 检查权限
  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission)
  }

  // 检查多个权限（任一满足）
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission))
  }

  // 检查多个权限（全部满足）
  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission))
  }

  // 获取用户权限（刷新权限）
  const refreshPermissions = async (): Promise<void> => {
    try {
      const response = await commonApi.getUserPermissions()
      if (response.code === 200) {
        permissions.value = response.data
        localStorage.setItem('permissions', JSON.stringify(response.data))
        
        // 更新用户信息中的权限
        if (user.value) {
          user.value.permissions = response.data
          localStorage.setItem('userInfo', JSON.stringify(user.value))
        }
      }
    } catch (error) {
      console.error('获取用户权限失败:', error)
    }
  }

  // 验证token有效性
  const validateToken = async (): Promise<boolean> => {
    if (!token.value) {
      return false
    }

    try {
      // 通过获取权限接口来验证token
      const response = await commonApi.getUserPermissions()
      if (response.code === 200) {
        return true
      } else {
        clearAuth()
        return false
      }
    } catch (error) {
      console.error('Token验证失败:', error)
      clearAuth()
      return false
    }
  }

  // 初始化
  if (!user.value && token.value) {
    initUserInfo()
  }

  return {
    // 状态
    token: computed(() => token.value),
    user: computed(() => user.value),
    permissions: computed(() => permissions.value),
    isLoggedIn,
    userName,
    userId,

    // 方法
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
    validateToken,
    clearAuth
  }
}
