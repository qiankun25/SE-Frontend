// API 通用接口定义

// 通用响应结构
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  total?: number;
}

// 用户认证相关接口
export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 排序参数
export interface SortParams {
  field?: string;
  order?: "asc" | "desc";
}

// 时间范围参数
export interface TimeRangeParams {
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
}

// 导出参数
export interface ExportParams {
  format: "excel" | "csv";
  fields?: string[];
  filename?: string;
}

// 合格证总量查询相关接口
export interface CertificateQuantityParams
  extends PaginationParams,
    SortParams {
  // 企业信息
  companyName?: string;
  companyNames?: string[]; // 支持多个企业名称
  companyId?: string;
  companyCode?: string;
  companyCodes?: string[]; // 支持多个企业代码

  // 车辆信息
  vehicleBrand?: string;
  vehicleBrands?: string[]; // 支持多个品牌
  vehicleModel?: string;
  vehicleModels?: string[]; // 支持多个型号
  vehicleNames?: string[]; // 车辆名称
  vehicleCategory?: string;
  vehicleClass?: string[]; // 车辆类别(整车/底盘)

  // 分类信息
  sixCategories?: string[]; // 六大类
  commercialOrPassenger?: string; // 商用车/乘用车

  // 燃料和新能源
  fuelType?: string;
  fuelTypes?: string[]; // 支持多个燃料类型
  newEnergyType?: string;
  newEnergyCategories?: string[]; // 支持多个新能源类型
  isNewEnergy?: string; // 是否新能源

  // 地址信息
  registeredAddress?: string;
  productionAddress?: string;
  productionAddresses?: string[]; // 支持多个生产地址
  productionProvinces?: string[]; // 生产省份
  productionCities?: string[]; // 生产城市

  // 时间相关
  timeRange?: TimeRangeParams;
  quickTimeRange?: string; // 快捷时间选择
  viewDimension?: string; // 查看维度
  enableComparison?: boolean; // 启用同期比

  // 其他选项
  excludeNonAnnouncement?: boolean; // 排除非公告产品
  showRanking?: boolean; // 显示排行
}

export interface CertificateQuantityItem {
  companyId: string;
  companyName: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleName?: string;
  vehicleCategory?: string;
  sixCategory?: string;
  fuelType?: string;
  newEnergyType?: string;
  productionAddress?: string;
  productionProvince?: string;
  productionCity?: string;
  certificateCount: number;
  uploadYear?: number;
  uploadMonth?: number;
  uploadDay?: number;
  date?: string;
  year?: number;
  month?: number;

  // 同期比相关字段
  currentPeriodCount?: number;
  previousPeriodCount?: number;
  comparisonRatio?: number;

  ranking?: number;
}

// 合格证单证查询相关接口
export interface CertificateDetailParams extends PaginationParams {
  certificateNumber?: string;
  vin?: string;
  companyName?: string;
  vehicleModel?: string;
  timeRange?: TimeRangeParams;
}

export interface CertificateDetailItem {
  certificateNumber: string;
  companyName: string;
  vehicleBrand: string;
  vehicleModel: string;
  vin: string;
  engineNumber: string;
  chassisNumber?: string;
  vehicleColor: string;
  fuelType: string;
  displacement?: number;
  emissionStandard: string;
  fuelConsumption?: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: {
    totalWeight: number;
    curbWeight: number;
    ratedLoad?: number;
  };
  manufactureDate: string;
  issueDate: string;
  [key: string]: any;
}

// 产品准入信息查询相关接口
export interface ProductAccessParams extends PaginationParams, SortParams {
  companyName?: string;
  vehicleModel?: string;
  commonName?: string;
  batchNumber?: string;
  parameterKeyword?: string;
  timeRange?: TimeRangeParams;
}

export interface ProductAccessItem {
  id: string;
  companyName: string;
  vehicleModel: string;
  commonName: string;
  batchNumber: string;
  basicInfo: Record<string, any>;
  technicalParams: Record<string, any>;
  filingParams: Record<string, any>;
  certificateCount?: number;
  testingInstitution?: string;
  entryCode?: string;
  cpno?: string;
}

// 企业准入信息查询相关接口
export interface EnterpriseAccessParams extends PaginationParams, SortParams {
  companyName?: string;
  companyType?: string;
  enterpriseCategory?: string;
  registeredAddress?: string;
  productionAddress?: string;
  qualification?: string;
}

export interface EnterpriseAccessItem {
  companyId: string;
  companyName: string;
  companyShortName?: string;
  companyCode: string;
  catalogueNumber?: string;
  enterpriseType: string;
  enterpriseCategory: string;
  registeredAddress: string;
  productionAddress: string;
  productionAddressName?: string;
  contactInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  trademarks?: string[];
  qualifications?: string[];
  equity?: Record<string, any>;
}

// 集团查询相关接口
export interface GroupSearchParams extends PaginationParams, SortParams {
  group_name?: string;      // 集团名称
  group_code?: string;      // 集团代码
  region?: string;          // 所在地区
  enterprise_type?: string; // 企业性质（合资/自主）
  has_new_energy?: boolean; // 是否涉及新能源
}

export interface GroupExportParams extends GroupSearchParams, ExportParams {
  range?: string;           // 导出范围：current（当前页）、all（全部数据）
}

export interface EnterpriseItem {
  enterprise_id: string;
  enterprise_name: string;
  enterprise_code?: string;
  province?: string;
  city?: string;
  enterprise_type?: string;
  has_new_energy: boolean;
  registered_address?: string;
  production_address?: string;
}

export interface EnterpriseDetailInfo {
  enterprise_id: string;
  enterprise_name: string;
  enterprise_code?: string;
  province?: string;
  city?: string;
  district?: string;
  registered_address?: string;
  production_address?: string;
  enterprise_type?: string;
  has_new_energy: boolean;
  product_brands?: string;
  enterprise_qualifications?: string;
  new_energy_qualifications?: string;
  group_code?: string;
  group_name?: string;
}

export interface GroupInfo {
  group_code: string;           // 集团代码
  group_name: string;           // 集团名称
  enterprise_count: number;     // 下属企业数量
  provinces: string[];          // 分布省份
  new_energy_count: number;     // 新能源企业数量
  joint_venture_count: number;  // 合资企业数量
  main_region: string;          // 主要地区
  new_energy_ratio: number;     // 新能源企业占比
  joint_venture_ratio: number;  // 合资企业占比
  enterprises?: EnterpriseItem[]; // 下属企业列表
}

export interface GroupDetailInfo {
  group_code: string;
  group_name: string;
  enterprise_count: number;
  total_provinces: number;
  provinces: string[];
  new_energy_count: number;
  joint_venture_count: number;
  autonomous_count: number;
  main_region: string;
  new_energy_ratio: number;
  joint_venture_ratio: number;
  enterprises: EnterpriseItem[];
  province_distribution: Record<string, number>;
  enterprise_type_distribution: Record<string, number>;
}

// 财税申报信息查询相关接口
export interface TaxDeclarationParams extends PaginationParams, SortParams {
  declarationType?: string;
  vehicleType?: string;
  timeRange?: TimeRangeParams;
}

export interface TaxDeclarationItem {
  id: string;
  declarationType: string;
  vehicleType: string;
  companyName: string;
  vehicleModel: string;
  quantity: number;
  amount?: number;
  exchangeDate?: string;
  cumulativeTotal?: number;
}

// 其他统计相关接口
export interface OtherStatisticsParams extends PaginationParams {
  statisticsType?: string;
  timeRange?: TimeRangeParams;
}

export interface OtherStatisticsItem {
  id: string;
  statisticsType: string;
  title: string;
  value: number;
  unit?: string;
  description?: string;
  updateTime: string;
}

// 企业基本信息查询相关类型
export interface EnterpriseBasicParams extends PaginationParams, SortParams {
  enterprise_id?: string;
  enterprise_name?: string;
  supervision_status?: string;
  new_energy_flag?: string;
  enterprise_type?: string;
  social_credit_code?: string;
  registered_address?: string;
  production_address?: string;
  product_brand?: string;
  qualification?: string;
}

export interface EnterpriseBasicItem {
  id: number;
  enterprise_id?: string;
  enterprise_name?: string;
  catalog_number?: string;
  vehicle_catalog?: string;
  delete_flag?: string;
  access_status?: string;
  valid_flag?: string;
  supervision_status?: string;
  supervision_code?: string;
  new_energy_flag?: string;
  enterprise_type?: string;
  registered_address?: string;
  production_address?: string;
  product_brand?: string;
  qualification?: string;
  equity?: string;
  contact_person?: string;
  contact_position?: string;
  contact_phone?: string;
  social_credit_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BatchEnterpriseBasicParams {
  queries: string[];
  query_type: "enterprise_id" | "enterprise_name";
  fields?: string[];
}

// 企业监管状态相关类型
export interface EnterpriseSupervisionParams extends PaginationParams {
  enterprise_id?: string;
  enterprise_name?: string;
  social_credit_code?: string;
  supervision_status?: string;
  supervision_code?: string;
  access_status?: string;
  valid_flag?: string;
  enterprise_type?: string;
  new_energy_flag?: string;
  registered_address?: string;
  production_address?: string;
  fields?: string[];
}

export interface EnterpriseSupervisionItem {
  id: number;
  enterprise_id?: string;
  enterprise_name?: string;
  social_credit_code?: string;
  supervision_status?: string;
  supervision_code?: string;
  access_status?: string;
  valid_flag?: string;
  enterprise_type?: string;
  new_energy_flag?: string;
  registered_address?: string;
  production_address?: string;
  product_brand?: string;
  qualification?: string;
  contact_person?: string;
  contact_position?: string;
  contact_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EnterpriseSupervisionExportParams extends EnterpriseSupervisionParams {
  format: "excel" | "csv";
  filename?: string;
  fields?: string[];
}

export interface BatchEnterpriseSupervisionParams {
  queries: string[];
  query_type: "enterprise_id" | "enterprise_name";
  fields?: string[];
}
