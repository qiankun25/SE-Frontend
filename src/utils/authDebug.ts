/**
 * 认证调试工具
 * 用于检查和诊断认证相关问题
 */

export interface AuthDebugInfo {
  hasToken: boolean
  tokenLength: number
  tokenPreview: string
  hasUserInfo: boolean
  userName: string
  userId: string
  permissions: string[]
  isLoggedIn: boolean
}

/**
 * 获取认证调试信息
 */
export function getAuthDebugInfo(): AuthDebugInfo {
  const token = localStorage.getItem('token')
  const userInfo = localStorage.getItem('userInfo')
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  
  let userName = '未知'
  let userId = '未知'
  let permissions: string[] = []
  
  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo)
      userName = parsed.name || parsed.username || '未知'
      userId = parsed.id || '未知'
      permissions = parsed.permissions || []
    } catch (e) {
      console.error('解析用户信息失败:', e)
    }
  }
  
  return {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
    hasUserInfo: !!userInfo,
    userName,
    userId,
    permissions,
    isLoggedIn: isLoggedIn === 'true'
  }
}

/**
 * 打印认证调试信息到控制台
 */
export function printAuthDebugInfo() {
  const info = getAuthDebugInfo()
  
  console.group('🔐 认证状态调试信息')
  console.log('Token状态:', info.hasToken ? '✅ 存在' : '❌ 不存在')
  console.log('Token长度:', info.tokenLength)
  console.log('Token预览:', info.tokenPreview)
  console.log('用户信息:', info.hasUserInfo ? '✅ 存在' : '❌ 不存在')
  console.log('用户名:', info.userName)
  console.log('用户ID:', info.userId)
  console.log('权限列表:', info.permissions)
  console.log('登录标记:', info.isLoggedIn ? '✅ 已登录' : '❌ 未登录')
  console.groupEnd()
  
  // 警告信息
  if (!info.hasToken) {
    console.warn('⚠️ 警告: Token不存在，可能未登录或登录已过期')
  }
  
  if (info.hasToken && !info.hasUserInfo) {
    console.warn('⚠️ 警告: Token存在但用户信息缺失，可能需要重新登录')
  }
  
  if (info.hasToken && info.permissions.length === 0) {
    console.warn('⚠️ 警告: 权限列表为空，可能影响功能使用')
  }
  
  return info
}

/**
 * 验证导出权限
 */
export function checkExportPermission(): {
  hasPermission: boolean
  message: string
  debugInfo: AuthDebugInfo
} {
  const info = getAuthDebugInfo()
  
  // 检查token
  if (!info.hasToken) {
    return {
      hasPermission: false,
      message: '未登录或登录已过期，请先登录',
      debugInfo: info
    }
  }
  
  // 检查用户信息
  if (!info.hasUserInfo) {
    return {
      hasPermission: false,
      message: '用户信息缺失，请重新登录',
      debugInfo: info
    }
  }
  
  // 检查权限 - 支持多种权限格式
  const hasExportPermission = info.permissions.includes('export') || 
                               info.permissions.includes('admin') ||
                               info.permissions.includes('admin:all') ||
                               info.permissions.includes('certificate:export') ||
                               info.permissions.includes('certificate.export') ||
                               info.permissions.some(p => p.includes('export'))
  
  if (!hasExportPermission && info.permissions.length > 0) {
    return {
      hasPermission: false,
      message: '没有导出权限，请联系管理员',
      debugInfo: info
    }
  }
  
  return {
    hasPermission: true,
    message: '权限验证通过',
    debugInfo: info
  }
}

/**
 * 测试API请求（带认证）
 */
export async function testAuthRequest(url: string): Promise<{
  success: boolean
  status: number
  message: string
  headers: Record<string, string>
}> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    })
    
    return {
      success: response.ok,
      status: response.status,
      message: response.statusText,
      headers
    }
  } catch (error: any) {
    return {
      success: false,
      status: 0,
      message: error.message || '请求失败',
      headers
    }
  }
}

