// API 服务层 - 预留接口调用位置

import type {
  ApiResponse,
  CertificateQuantityParams,
  CertificateQuantityItem,
  CertificateDetailParams,
  CertificateDetailItem,
  ProductAccessParams,
  ProductAccessItem,
  EnterpriseAccessParams,
  EnterpriseAccessItem,
  TaxDeclarationParams,
  TaxDeclarationItem,
  OtherStatisticsParams,
  OtherStatisticsItem,
  ExportParams,
  GroupSearchParams,
  GroupExportParams,
  GroupInfo,
  GroupDetailInfo,
  EnterpriseItem,
} from "../types/api";

import { getApiBaseUrl } from "../utils/request";

// 基础请求配置
// 开发环境使用后端服务器地址，生产环境使用相对路径
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

  // 如果有token且不是登录接口，自动添加Authorization头
  if (token && !url.includes("/auth/login")) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 合格证总量查询相关API
export const certificateQuantityApi = {
  // 查询合格证总量统计
  async search(params: CertificateQuantityParams): Promise<
    ApiResponse<{
      list: CertificateQuantityItem[];
      total: number;
    }>
  > {
    return request("/certificate-quantity/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 导出合格证总量数据
  async export(
    params: CertificateQuantityParams & ExportParams
  ): Promise<Blob> {
    // 获取token并检查
    const token = localStorage.getItem("token");

    // 开发环境下打印调试信息
    if (import.meta.env.DEV) {
      console.log("🔐 导出API - Token检查:", {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : "null",
      });
    }

    if (!token) {
      throw new Error("未登录或登录已过期，请先登录");
    }

    const response = await fetch(`${BASE_URL}/certificate-quantity/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    // 处理403错误
    if (response.status === 403) {
      throw new Error("没有导出权限，请联系管理员");
    }

    if (!response.ok) {
      throw new Error(`导出失败: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  },

  // 获取企业列表
  async getCompaniesList(): Promise<
    ApiResponse<
      Array<{
        code: string;
        name: string;
      }>
    >
  > {
    return request("/certificate-quantity/companies");
  },
};

// 合格证单证查询相关API
export const certificateDetailApi = {
  // 查询合格证详细信息
  async search(params: CertificateDetailParams): Promise<
    ApiResponse<{
      list: CertificateDetailItem[];
      total: number;
    }>
  > {
    return request("/certificate-detail/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 批量查询合格证信息
  async batchSearch(queries: string[]): Promise<
    ApiResponse<{
      list: CertificateDetailItem[];
      total: number;
      validCount: number;
      invalidCount: number;
    }>
  > {
    return request("/certificate-detail/batch-search", {
      method: "POST",
      body: JSON.stringify({ queries }),
    });
  },

  // 导出合格证详细信息
  async export(params: CertificateDetailParams & ExportParams): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/certificate-detail/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`导出失败: ${response.statusText}`);
    }

    return response.blob();
  },

  // 下载批量查询模板
  async downloadTemplate(): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/certificate-detail/template`);
    return response.blob();
  },
};

// 产品准入信息查询相关API
export const productAccessApi = {
  // 查询产品准入信息
  async search(params: ProductAccessParams): Promise<
    ApiResponse<{
      list: ProductAccessItem[];
      total: number;
    }>
  > {
    return request("/product-access/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 获取产品详细信息
  async getDetail(id: string): Promise<ApiResponse<ProductAccessItem>> {
    return request(`/product-access/detail/${id}`);
  },

  // 导出产品准入信息
  async export(params: ProductAccessParams & ExportParams): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/product-access/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    return response.blob();
  },

  // 获取批次列表
  async getBatchList(): Promise<ApiResponse<string[]>> {
    return request("/product-access/batch-list");
  },
};

// 企业准入信息查询相关API
export const enterpriseAccessApi = {
  // 查询企业准入信息
  async search(params: EnterpriseAccessParams): Promise<
    ApiResponse<{
      list: EnterpriseAccessItem[];
      total: number;
    }>
  > {
    return request("/enterprise-access/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 获取企业详细信息
  async getDetail(id: string): Promise<ApiResponse<EnterpriseAccessItem>> {
    return request(`/enterprise-access/detail/${id}`);
  },

  // 快捷查询
  async quickSearch(type: string): Promise<
    ApiResponse<{
      list: EnterpriseAccessItem[];
      total: number;
    }>
  > {
    return request(`/enterprise-access/quick-search/${type}`);
  },

  // 导出企业准入信息
  async export(params: EnterpriseAccessParams & ExportParams): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/enterprise-access/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    return response.blob();
  },
};

// 财税申报信息查询相关API
export const taxDeclarationApi = {
  // 查询财税申报信息
  async search(params: TaxDeclarationParams): Promise<
    ApiResponse<{
      list: TaxDeclarationItem[];
      total: number;
    }>
  > {
    return request("/tax-declaration/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 快捷查询
  async quickSearch(type: string): Promise<
    ApiResponse<{
      list: TaxDeclarationItem[];
      total: number;
      stats: {
        totalDeclarations: number;
        totalAmount: number;
        totalCompanies: number;
      };
    }>
  > {
    return request(`/tax-declaration/quick-search/${type}`);
  },

  // 导出财税申报信息
  async export(params: TaxDeclarationParams & ExportParams): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/tax-declaration/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    return response.blob();
  },
};

// 其他统计相关API
export const otherStatisticsApi = {
  // 查询其他统计信息
  async search(params: OtherStatisticsParams): Promise<
    ApiResponse<{
      list: OtherStatisticsItem[];
      total: number;
    }>
  > {
    return request("/other-statistics/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 获取统计卡片数据
  async getStatsCards(): Promise<
    ApiResponse<
      Array<{
        type: string;
        label: string;
        value: number;
        unit: string;
        change: string;
        changeType: "increase" | "decrease";
        icon: string;
        color: string;
      }>
    >
  > {
    return request("/other-statistics/stats-cards");
  },

  // 导出其他统计信息
  async export(params: OtherStatisticsParams & ExportParams): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/other-statistics/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    return response.blob();
  },
};

// 操作日志API
export const operationLogApi = {
  // 获取用户操作日志
  async getOperationLogs(params: {
    operation_type?: string;
    module?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    return request("/user/logs/operations", {
      method: "GET",
      params,
    });
  },

  // 获取用户下载日志
  async getDownloadLogs(params: {
    status_filter?: string;
    data_source?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    return request("/user/logs/downloads", {
      method: "GET",
      params,
    });
  },

  // 获取操作统计
  async getOperationStatistics(params: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any>> {
    return request("/user/statistics/operations", {
      method: "GET",
      params,
    });
  },

  // 管理员获取所有操作日志
  async getAllOperationLogs(params: {
    user_id?: number;
    operation_type?: string;
    module?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    return request("/user/admin/logs/all", {
      method: "GET",
      params,
    });
  },

  // 管理员获取系统统计
  async getSystemStatistics(params: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any>> {
    return request("/user/admin/statistics/system", {
      method: "GET",
      params,
    });
  },
};

// 通用API
export const commonApi = {
  // 获取地区数据
  async getRegions(): Promise<
    ApiResponse<
      Array<{
        code: string;
        name: string;
        children?: Array<{
          code: string;
          name: string;
        }>;
      }>
    >
  > {
    return request("/common/regions");
  },

  // 用户认证相关
  async login(
    username: string,
    password: string
  ): Promise<
    ApiResponse<{
      token: string;
      user: {
        id: string;
        username: string;
        name: string;
        permissions: string[];
      };
    }>
  > {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async logout(): Promise<ApiResponse<null>> {
    return request("/auth/logout", {
      method: "POST",
    });
  },

  // 获取用户权限
  async getUserPermissions(): Promise<ApiResponse<string[]>> {
    return request("/auth/permissions");
  },

  // 记录操作日志
  async logOperation(operation: {
    module: string;
    action: string;
    params?: any;
    result?: any;
  }): Promise<ApiResponse<null>> {
    return request("/common/log", {
      method: "POST",
      body: JSON.stringify(operation),
    });
  },
};

// 导出工具函数
export const exportUtils = {
  // 下载文件
  downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // 生成导出文件名
  generateFilename(prefix: string, format: string = "xlsx"): string {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, "");
    return `${prefix}_${timestamp}.${format}`;
  },
};

// 集团信息查询相关API
export const groupApi = {
  // 查询集团信息
  async search(params: GroupSearchParams): Promise<
    ApiResponse<{
      list: GroupInfo[];
      total: number;
    }>
  > {
    return request("/group/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 获取集团详细信息
  async getDetail(groupCode: string): Promise<ApiResponse<GroupDetailInfo>> {
    return request(`/group/detail/${groupCode}`);
  },

  // 获取集团下属企业列表
  async getEnterprises(
    groupCode: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<
    ApiResponse<{
      list: EnterpriseItem[];
      total: number;
    }>
  > {
    return request(
      `/group/enterprises/${groupCode}?page=${page}&page_size=${pageSize}`
    );
  },

  // 导出集团信息
  async export(params: GroupExportParams): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/group/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`导出失败: ${response.statusText}`);
    }

    return response.blob();
  },

  // 获取集团统计信息
  async getStatistics(): Promise<
    ApiResponse<{
      total_groups: number;
      total_enterprises: number;
      total_provinces: number;
      new_energy_groups: number;
      joint_venture_groups: number;
      avg_enterprises: number;
      size_distribution: Record<string, number>;
      province_distribution: Record<string, number>;
    }>
  > {
    return request("/group/statistics");
  },

  // 获取集团列表（用于下拉选择）
  async getList(
    q?: string,
    limit: number = 50
  ): Promise<
    ApiResponse<
      Array<{
        code: string;
        name: string;
        enterprise_count: number;
      }>
    >
  > {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    params.append("limit", limit.toString());

    return request(`/group/list?${params.toString()}`);
  },

  // 获取集团下属企业详细列表
  async getEnterpriseDetailed(
    groupCode: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      region?: string;
      enterprise_type?: string;
      has_new_energy?: boolean;
    }
  ): Promise<ApiResponse<EnterpriseDetailInfo[]>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());

    if (filters) {
      if (filters.region) params.append("region", filters.region);
      if (filters.enterprise_type)
        params.append("enterprise_type", filters.enterprise_type);
      if (filters.has_new_energy !== undefined && filters.has_new_energy !== null)
        params.append("has_new_energy", String(filters.has_new_energy));
    }

    return request(
      `/group/enterprises/${groupCode}/detailed?${params.toString()}`
    );
  },

  // 获取单个企业详细信息
  async getEnterpriseDetail(
    enterpriseId: string
  ): Promise<ApiResponse<EnterpriseDetailInfo>> {
    return request(`/group/enterprise/${enterpriseId}`);
  },
};

// 企业监管状态查询相关API
export const enterpriseSupervisionApi = {
  // 查询企业监管状态
  async search(params: EnterpriseSupervisionParams): Promise<
    ApiResponse<{
      list: EnterpriseSupervisionItem[];
      total: number;
    }>
  > {
    return request("/enterprise-supervision/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 批量查询企业监管状态
  async batchSearch(params: BatchEnterpriseSupervisionParams): Promise<
    ApiResponse<{
      list: EnterpriseSupervisionItem[];
      total: number;
      validCount: number;
      invalidCount: number;
    }>
  > {
    return request("/enterprise-supervision/batch-search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 导出企业监管状态
  async export(params: EnterpriseSupervisionExportParams): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/enterprise-supervision/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`导出失败: ${response.status}`);
    }

    return response.blob();
  },

  // 获取监管状态选项
  async getSupervisionStatusOptions(): Promise<ApiResponse<string[]>> {
    return request("/enterprise-supervision/supervision-status-options");
  },

  // 获取企业准入状态选项
  async getAccessStatusOptions(): Promise<ApiResponse<string[]>> {
    return request("/enterprise-supervision/access-status-options");
  },

  // 获取企业类型选项
  async getEnterpriseTypeOptions(): Promise<ApiResponse<string[]>> {
    return request("/enterprise-supervision/enterprise-type-options");
  },

  // 获取字段选项
  async getFieldOptions(): Promise<
    ApiResponse<
      Array<{
        key: string;
        label: string;
        required?: boolean;
      }>
    >
  > {
    return request("/enterprise-supervision/field-options");
  },

  // 下载批量查询模板
  async downloadTemplate(): Promise<Blob> {
    const response = await fetch(
      `${BASE_URL}/enterprise-supervision/template`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`下载模板失败: ${response.status}`);
    }

    return response.blob();
  },
};

// 角色管理相关API
export const roleManagementApi = {
  // 获取角色列表
  async getRoleList(params: {
    name?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<
    ApiResponse<{
      list: any[];
      total: number;
      page: number;
      page_size: number;
    }>
  > {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return request(`/role/list?${queryParams.toString()}`);
  },

  // 创建角色
  async createRole(data: {
    name: string;
    description?: string;
    permissions?: string[];
  }): Promise<ApiResponse<any>> {
    return request("/role/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // 获取角色详情
  async getRoleDetail(roleId: number): Promise<ApiResponse<any>> {
    return request(`/role/${roleId}`);
  },

  // 更新角色
  async updateRole(
    roleId: number,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
      is_active?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    return request(`/role/${roleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // 删除角色
  async deleteRole(roleId: number): Promise<ApiResponse<any>> {
    return request(`/role/${roleId}`, {
      method: "DELETE",
    });
  },

  // 切换角色状态
  async toggleRoleStatus(roleId: number): Promise<ApiResponse<any>> {
    return request(`/role/${roleId}/toggle-status`, {
      method: "PUT",
    });
  },

  // 获取角色权限
  async getRolePermissions(roleId: number): Promise<ApiResponse<string[]>> {
    return request(`/role/${roleId}/permissions`);
  },

  // 更新角色权限
  async updateRolePermissions(
    roleId: number,
    permissions: string[]
  ): Promise<ApiResponse<any>> {
    return request(`/role/${roleId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    });
  },

  // 获取权限树
  async getPermissionTree(): Promise<ApiResponse<any[]>> {
    return request("/role/permissions/tree");
  },
};

// 用户管理相关API
export const userManagementApi = {
  // 获取用户列表
  async getUserList(params: {
    username?: string;
    name?: string;
    is_active?: boolean;
    is_admin?: boolean;
    role_id?: number;
    page?: number;
    page_size?: number;
  }): Promise<
    ApiResponse<{
      list: any[];
      total: number;
      page: number;
      page_size: number;
    }>
  > {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return request(`/user/list?${queryParams.toString()}`);
  },

  // 创建用户
  async createUser(data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
    is_admin?: boolean;
    role_ids?: number[];
  }): Promise<ApiResponse<any>> {
    return request("/user/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // 获取用户详情
  async getUserDetail(userId: number): Promise<ApiResponse<any>> {
    return request(`/user/${userId}`);
  },

  // 更新用户
  async updateUser(
    userId: number,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      is_admin?: boolean;
      role_ids?: number[];
    }
  ): Promise<ApiResponse<any>> {
    return request(`/user/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // 删除用户
  async deleteUser(userId: number): Promise<ApiResponse<any>> {
    return request(`/user/${userId}`, {
      method: "DELETE",
    });
  },

  // 切换用户状态
  async toggleUserStatus(userId: number): Promise<ApiResponse<any>> {
    return request(`/user/${userId}/toggle-status`, {
      method: "PUT",
    });
  },

  // 重置用户密码
  async resetUserPassword(userId: number): Promise<ApiResponse<any>> {
    return request(`/user/${userId}/reset-password`, {
      method: "POST",
    });
  },

  // 获取所有角色列表
  async getAllRoles(): Promise<ApiResponse<any[]>> {
    return request("/user/roles/all");
  },
};

// 企业基本信息查询相关API
export const enterpriseBasicApi = {
  // 查询企业基本信息
  async search(params: EnterpriseBasicParams): Promise<
    ApiResponse<{
      list: EnterpriseBasicItem[];
      total: number;
    }>
  > {
    return request("/enterprise-basic/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 批量查询企业基本信息
  async batchSearch(params: BatchEnterpriseBasicParams): Promise<
    ApiResponse<{
      list: EnterpriseBasicItem[];
      total: number;
      validCount: number;
      invalidCount: number;
    }>
  > {
    return request("/enterprise-basic/batch-search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // 导出企业基本信息
  async export(params: EnterpriseBasicParams & ExportParams): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/enterprise-basic/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(params),
    });
    return response.blob();
  },

  // 获取监管状态选项
  async getSupervisionStatusOptions(): Promise<ApiResponse<string[]>> {
    return request("/enterprise-basic/supervision-status-options");
  },

  // 获取企业类型选项
  async getEnterpriseTypeOptions(): Promise<ApiResponse<string[]>> {
    return request("/enterprise-basic/enterprise-type-options");
  },

  // 下载批量查询模板
  async downloadTemplate(): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/enterprise-basic/template`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.blob();
  },
};
