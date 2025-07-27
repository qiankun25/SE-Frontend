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
} from "../types/api";

// 基础请求配置
// 开发环境使用后端服务器地址，生产环境使用相对路径
const BASE_URL = import.meta.env.DEV ? "http://localhost:8000/api" : "/api";

// 通用请求函数
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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

  // 获取统计概览
  async getStats(params: Partial<CertificateQuantityParams>): Promise<
    ApiResponse<{
      totalCertificates: number;
      totalCompanies: number;
      totalModels: number;
      timeRange: string;
    }>
  > {
    return request("/certificate-quantity/stats", {
      method: "POST",
      body: JSON.stringify(params),
    });
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

// 通用API
export const commonApi = {
  // 搜索企业
  async searchCompanies(query: string): Promise<
    ApiResponse<
      Array<{
        id: string;
        name: string;
        code: string;
        shortName?: string;
      }>
    >
  > {
    return request(`/common/companies/search?q=${encodeURIComponent(query)}`);
  },

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
