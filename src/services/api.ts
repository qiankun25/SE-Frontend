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
  GroupInfo,
  GroupDetailInfo,
  EnterpriseItem,
} from "../types/api";

// 基础请求配置
// 开发环境使用后端服务器地址，生产环境使用相对路径
const BASE_URL = import.meta.env.DEV ? "http://localhost:8000/api" : "/api";

// 通用请求函数
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // 获取token并自动添加Authorization头
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };

  // 如果有token且不是登录接口，自动添加Authorization头
  if (token && !url.includes('/auth/login')) {
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
    const response = await fetch(`${BASE_URL}/certificate-quantity/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
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
      },
      body: JSON.stringify(params),
    });
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
    return request(`/group/enterprises/${groupCode}?page=${page}&page_size=${pageSize}`);
  },

  // 导出集团信息
  async export(
    params: GroupSearchParams & ExportParams
  ): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/group/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
    pageSize: number = 20
  ): Promise<ApiResponse<EnterpriseDetailInfo[]>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());

    return request(`/group/enterprises/${groupCode}/detailed?${params.toString()}`);
  },

  // 获取单个企业详细信息
  async getEnterpriseDetail(enterpriseId: string): Promise<ApiResponse<EnterpriseDetailInfo>> {
    return request(`/group/enterprise/${enterpriseId}`);
  },
};
