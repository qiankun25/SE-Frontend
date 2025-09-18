/**
 * 导出限制相关API
 */
import type { ApiResponse } from '../types/api'

// 基础请求配置
const BASE_URL = import.meta.env.DEV ? "http://localhost:8000/api" : "/api"

// 通用请求函数
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // 获取token并自动添加Authorization头
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  }

  // 如果有token，自动添加Authorization头
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    headers,
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export interface QuotaInfo {
  limit: number
  used: number
  remaining: number
  reset_time: string
}

export interface ExportUsageRecord {
  id: number
  user_id: number
  export_type: string
  module: string
  record_count: number
  file_format: string
  file_size?: number
  export_date: string
  created_at: string
  completed_at?: string
  status: string
}

export interface RoleExportLimitConfig {
  role_id: number
  export_type: string
  daily_limit: number
  remarks?: string
}

export interface UserExportLimitConfig {
  user_id: number
  export_type: string
  daily_limit: number
  effective_from?: string
  effective_to?: string
  remarks?: string
}

// 导出限制API
export const exportLimitApi = {
  // 获取当前用户导出配额
  async getCurrentUserQuota(): Promise<ApiResponse<QuotaInfo>> {
    return request('/export-management/quota/current')
  },

  // 获取指定用户导出配额（管理员权限）
  async getUserQuota(userId: number): Promise<ApiResponse<QuotaInfo>> {
    return request(`/export-management/quota/user/${userId}`)
  },

  // 设置角色导出限制（管理员权限）
  async setRoleExportLimit(config: RoleExportLimitConfig): Promise<ApiResponse<any>> {
    return request('/export-management/config/role', {
      method: 'POST',
      body: JSON.stringify(config)
    })
  },

  // 设置用户导出限制（管理员权限）
  async setUserExportLimit(config: UserExportLimitConfig): Promise<ApiResponse<any>> {
    return request('/export-management/config/user', {
      method: 'POST',
      body: JSON.stringify(config)
    })
  },

  // 获取导出使用统计（管理员权限）
  async getExportUsageStatistics(params: {
    start_date?: string
    end_date?: string
    user_id?: number
    module?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    list: ExportUsageRecord[]
    total: number
    limit: number
    offset: number
  }>> {
    const queryParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
    
    return request(`/export-management/usage/statistics?${queryParams.toString()}`)
  },

  // 获取导出操作日志（管理员权限）
  async getExportLogs(params: {
    user_id?: number
    module?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    list: any[]
    total: number
    limit: number
    offset: number
  }>> {
    const queryParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
    
    return request(`/export-management/logs/export?${queryParams.toString()}`)
  }
}

// 导出工具函数
export const exportUtils = {
  // 检查是否可以执行导出
  canExport(quotaInfo: QuotaInfo | null, exportType: string = 'current'): boolean {
    if (!quotaInfo) return true
    
    // 根据导出类型判断所需配额
    const requiredQuota = exportType === 'all' ? 2 : 1
    return quotaInfo.remaining >= requiredQuota
  },

  // 获取导出类型的配额消耗
  getQuotaCost(exportType: string): number {
    switch (exportType) {
      case 'all':
      case 'full':
        return 2 // 全部导出消耗更多配额
      case 'current':
      case 'selected':
        return 1 // 当前页或选中数据导出
      default:
        return 1
    }
  },

  // 格式化配额信息显示
  formatQuotaInfo(quotaInfo: QuotaInfo | null): string {
    if (!quotaInfo) return '无限制'
    
    return `${quotaInfo.used}/${quotaInfo.limit} (剩余${quotaInfo.remaining})`
  },

  // 检查配额是否即将用完
  isQuotaLow(quotaInfo: QuotaInfo | null, threshold: number = 3): boolean {
    if (!quotaInfo) return false
    return quotaInfo.remaining <= threshold && quotaInfo.remaining > 0
  },

  // 检查配额是否已用完
  isQuotaExceeded(quotaInfo: QuotaInfo | null): boolean {
    if (!quotaInfo) return false
    return quotaInfo.remaining <= 0
  }
}
