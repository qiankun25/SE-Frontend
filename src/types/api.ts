// API 通用接口定义

// 通用响应结构
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  total?: number
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 排序参数
export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}

// 时间范围参数
export interface TimeRangeParams {
  startDate?: string
  endDate?: string
  year?: number
  month?: number
}

// 导出参数
export interface ExportParams {
  format: 'excel' | 'csv'
  fields?: string[]
  filename?: string
}

// 合格证总量查询相关接口
export interface CertificateQuantityParams extends PaginationParams, SortParams {
  companyName?: string
  companyId?: string
  vehicleBrand?: string
  vehicleModel?: string
  vehicleCategory?: string
  fuelType?: string
  newEnergyType?: string
  registeredAddress?: string
  productionAddress?: string
  timeRange?: TimeRangeParams
}

export interface CertificateQuantityItem {
  companyId: string
  companyName: string
  vehicleBrand?: string
  vehicleModel?: string
  vehicleCategory?: string
  fuelType?: string
  newEnergyType?: string
  certificateCount: number
  uploadYear?: number
  uploadMonth?: number
  ranking?: number
}

// 合格证单证查询相关接口
export interface CertificateDetailParams extends PaginationParams {
  certificateNumber?: string
  vin?: string
  companyName?: string
  vehicleModel?: string
  timeRange?: TimeRangeParams
}

export interface CertificateDetailItem {
  certificateNumber: string
  companyName: string
  vehicleBrand: string
  vehicleModel: string
  vin: string
  engineNumber: string
  chassisNumber?: string
  vehicleColor: string
  fuelType: string
  displacement?: number
  emissionStandard: string
  fuelConsumption?: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  weight: {
    totalWeight: number
    curbWeight: number
    ratedLoad?: number
  }
  manufactureDate: string
  issueDate: string
  [key: string]: any
}

// 产品准入信息查询相关接口
export interface ProductAccessParams extends PaginationParams, SortParams {
  companyName?: string
  vehicleModel?: string
  commonName?: string
  batchNumber?: string
  parameterKeyword?: string
  timeRange?: TimeRangeParams
}

export interface ProductAccessItem {
  id: string
  companyName: string
  vehicleModel: string
  commonName: string
  batchNumber: string
  basicInfo: Record<string, any>
  technicalParams: Record<string, any>
  filingParams: Record<string, any>
  certificateCount?: number
  testingInstitution?: string
  entryCode?: string
  cpno?: string
}

// 企业准入信息查询相关接口
export interface EnterpriseAccessParams extends PaginationParams, SortParams {
  companyName?: string
  companyType?: string
  enterpriseCategory?: string
  registeredAddress?: string
  productionAddress?: string
  qualification?: string
}

export interface EnterpriseAccessItem {
  companyId: string
  companyName: string
  companyShortName?: string
  companyCode: string
  catalogueNumber?: string
  enterpriseType: string
  enterpriseCategory: string
  registeredAddress: string
  productionAddress: string
  productionAddressName?: string
  contactInfo?: {
    name: string
    phone: string
    email: string
  }
  trademarks?: string[]
  qualifications?: string[]
  equity?: Record<string, any>
}

// 财税申报信息查询相关接口
export interface TaxDeclarationParams extends PaginationParams, SortParams {
  declarationType?: string
  vehicleType?: string
  timeRange?: TimeRangeParams
}

export interface TaxDeclarationItem {
  id: string
  declarationType: string
  vehicleType: string
  companyName: string
  vehicleModel: string
  quantity: number
  amount?: number
  exchangeDate?: string
  cumulativeTotal?: number
}

// 其他统计相关接口
export interface OtherStatisticsParams extends PaginationParams {
  statisticsType?: string
  timeRange?: TimeRangeParams
}

export interface OtherStatisticsItem {
  id: string
  statisticsType: string
  title: string
  value: number
  unit?: string
  description?: string
  updateTime: string
}
