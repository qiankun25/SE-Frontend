/**
 * 操作日志API服务
 */
import type {
  ApiResponse,
  OperationLogParams,
  OperationLogItem,
  OperationLogStatistics,
} from "../types/api";
import { getApiBaseUrl } from "../utils/request";

// 基础请求配置
const BASE_URL = getApiBaseUrl();

// 通用请求函数
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // 获取token并自动添加Authorization头
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // 如果有token，自动添加Authorization头
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
        errorData.message ||
        `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

/**
 * 构建查询字符串
 */
function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * 获取所有用户操作日志（管理员专用）
 */
export async function getAllOperationLogs(params: OperationLogParams): Promise<
  ApiResponse<{
    logs: OperationLogItem[];
    total: number;
    limit: number;
    offset: number;
  }>
> {
  const queryString = buildQueryString({
    user_id: params.user_id,
    operation_type: params.operation_type,
    module: params.module,
    start_date: params.start_date,
    end_date: params.end_date,
    limit: params.limit || 20,
    offset: params.offset || 0,
  });

  return request(`/user/admin/logs/all${queryString}`);
}

/**
 * 获取系统操作统计（管理员专用）
 */
export async function getSystemStatistics(params: {
  start_date?: string;
  end_date?: string;
}): Promise<ApiResponse<OperationLogStatistics>> {
  const queryString = buildQueryString(params);
  return request(`/user/admin/statistics/system${queryString}`);
}

/**
 * 获取当前用户操作日志
 */
export async function getUserOperationLogs(params: OperationLogParams): Promise<
  ApiResponse<{
    logs: OperationLogItem[];
    total: number;
    limit: number;
    offset: number;
  }>
> {
  const queryString = buildQueryString({
    operation_type: params.operation_type,
    module: params.module,
    start_date: params.start_date,
    end_date: params.end_date,
    limit: params.limit || 20,
    offset: params.offset || 0,
  });

  return request(`/user/logs/operations${queryString}`);
}

/**
 * 导出操作日志（管理员专用）
 */
export async function exportOperationLogs(params: {
  user_id?: number;
  operation_type?: string;
  module?: string;
  start_date?: string;
  end_date?: string;
  format?: string;
  filename?: string;
  range?: string;
  limit?: number;
  offset?: number;
}): Promise<Blob> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/user/admin/logs/export`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
        errorData.message ||
        `HTTP error! status: ${response.status}`
    );
  }

  return response.blob();
}