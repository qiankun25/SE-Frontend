/**
 * API参数验证工具
 * 用于检查前端表单字段与API参数的匹配情况
 */

import type { CertificateQuantityParams } from "../types/api";

// 前端表单字段列表
const FRONTEND_FORM_FIELDS = [
  "vehicleClass",
  "excludeNonAnnouncement",
  "companyName",
  "companyCode",
  "vehicleModels",
  "vehicleBrands",
  "vehicleNames",
  // 移除复杂的时间选择字段
  "productionAddresses",
  "productionProvinces",
  "productionCities",
  "sixCategories",
  "commercialOrPassenger",
  "fuelTypes",
  "newEnergyCategories",
  "isNewEnergy",
  "showRanking",
] as const;

// API参数字段列表
const API_PARAM_FIELDS: (keyof CertificateQuantityParams)[] = [
  "companyName",
  "companyId",
  "companyCode",
  "vehicleBrand",
  "vehicleBrands",
  "vehicleModel",
  "vehicleModels",
  "vehicleNames",
  "vehicleCategory",
  "vehicleClass",
  "sixCategories",
  "commercialOrPassenger",
  "fuelType",
  "fuelTypes",
  "newEnergyType",
  "newEnergyCategories",
  "isNewEnergy",
  "registeredAddress",
  "productionAddress",
  "productionAddresses",
  "productionProvinces",
  "productionCities",
  "timeRange",
  // 移除复杂的时间选择字段
  "excludeNonAnnouncement",
  "showRanking",
];

/**
 * 验证前端条件是否能正确映射到API参数
 */
export function validateConditionMapping(condition: any): {
  valid: boolean;
  unmappedFields: string[];
  mappedFields: string[];
} {
  const unmappedFields: string[] = [];
  const mappedFields: string[] = [];

  Object.keys(condition).forEach((field) => {
    // 检查字段是否有对应的API参数
    const hasDirectMapping = API_PARAM_FIELDS.includes(field as any);
    const hasIndirectMapping = checkIndirectMapping(field, condition[field]);

    if (hasDirectMapping || hasIndirectMapping) {
      mappedFields.push(field);
    } else {
      unmappedFields.push(field);
    }
  });

  return {
    valid: unmappedFields.length === 0,
    unmappedFields,
    mappedFields,
  };
}

/**
 * 检查间接映射（如数组字段映射到单个字段）
 */
function checkIndirectMapping(field: string, value: any): boolean {
  const indirectMappings: Record<string, string[]> = {
    vehicleBrands: ["vehicleBrand"],
    vehicleModels: ["vehicleModel"],
    fuelTypes: ["fuelType"],
    newEnergyCategories: ["newEnergyType"],
    productionAddresses: ["productionAddress"],
    // 移除复杂的时间选择字段映射
  };

  return field in indirectMappings;
}

/**
 * 生成API参数映射报告
 */
export function generateMappingReport(): {
  frontendFields: string[];
  apiFields: string[];
  coverage: number;
  missingInApi: string[];
  missingInFrontend: string[];
} {
  const frontendFieldsSet = new Set(FRONTEND_FORM_FIELDS);
  const apiFieldsSet = new Set(API_PARAM_FIELDS);

  const missingInApi = FRONTEND_FORM_FIELDS.filter(
    (field) =>
      !apiFieldsSet.has(field as any) && !checkIndirectMapping(field, null)
  );

  const missingInFrontend = API_PARAM_FIELDS.filter(
    (field) => !frontendFieldsSet.has(field as any)
  );

  const coverage =
    ((FRONTEND_FORM_FIELDS.length - missingInApi.length) /
      FRONTEND_FORM_FIELDS.length) *
    100;

  return {
    frontendFields: [...FRONTEND_FORM_FIELDS],
    apiFields: [...API_PARAM_FIELDS],
    coverage: Math.round(coverage),
    missingInApi,
    missingInFrontend,
  };
}

/**
 * 在开发环境下打印映射报告
 */
export function printMappingReport() {
  if (import.meta.env.DEV) {
    const report = generateMappingReport();

    console.group("🔍 API参数映射报告");
    console.log(`📊 覆盖率: ${report.coverage}%`);
    console.log(`📝 前端字段数: ${report.frontendFields.length}`);
    console.log(`🔌 API字段数: ${report.apiFields.length}`);

    if (report.missingInApi.length > 0) {
      console.warn("⚠️ 前端有但API缺失的字段:", report.missingInApi);
    }

    if (report.missingInFrontend.length > 0) {
      console.info("ℹ️ API有但前端缺失的字段:", report.missingInFrontend);
    }

    console.groupEnd();
  }
}
