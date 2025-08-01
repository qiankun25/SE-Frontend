/**
 * 车辆名称查询测试工具
 * 用于测试只输入车辆名称时的查询和显示逻辑
 */

export interface VehicleNameTestCondition {
  vehicleNames: string[];
  selectedCompanies?: any[];
  companyName?: string;
  companyCode?: string;
}

export interface VehicleNameTestResult {
  queryParams: any;
  expectedColumns: string[];
  primaryColumn: string;
}

/**
 * 测试车辆名称查询的参数构建
 */
export function testVehicleNameQuery(): void {
  console.log("🚗 开始测试车辆名称查询逻辑...");

  // 测试场景1: 只输入车辆名称，没有选择企业
  const scenario1: VehicleNameTestCondition = {
    vehicleNames: ["三轮"],
  };

  const result1 = simulateVehicleNameQuery(scenario1);
  console.log("📋 场景1 - 只查询车辆名称:");
  console.log("  查询参数:", result1.queryParams);
  console.log("  预期主要列:", result1.primaryColumn);
  console.log("  预期显示列:", result1.expectedColumns);

  // 测试场景2: 输入车辆名称 + 选择企业
  const scenario2: VehicleNameTestCondition = {
    vehicleNames: ["三轮"],
    selectedCompanies: [{ name: "某某汽车公司", code: "COMP001" }],
  };

  const result2 = simulateVehicleNameQuery(scenario2);
  console.log("📋 场景2 - 车辆名称 + 企业:");
  console.log("  查询参数:", result2.queryParams);
  console.log("  预期主要列:", result2.primaryColumn);
  console.log("  预期显示列:", result2.expectedColumns);

  // 测试场景3: 输入车辆名称 + 企业名称（旧方式）
  const scenario3: VehicleNameTestCondition = {
    vehicleNames: ["三轮"],
    companyName: "某某汽车公司",
  };

  const result3 = simulateVehicleNameQuery(scenario3);
  console.log("📋 场景3 - 车辆名称 + 企业名称:");
  console.log("  查询参数:", result3.queryParams);
  console.log("  预期主要列:", result3.primaryColumn);
  console.log("  预期显示列:", result3.expectedColumns);

  console.log("✅ 车辆名称查询测试完成");
}

/**
 * 模拟车辆名称查询的参数构建过程
 */
function simulateVehicleNameQuery(
  condition: VehicleNameTestCondition
): VehicleNameTestResult {
  // 模拟前端的 buildSearchParams 逻辑
  const params: any = {};

  // 车辆名称参数
  if (condition.vehicleNames && condition.vehicleNames.length > 0) {
    params.vehicleNames = condition.vehicleNames;
  }

  // 企业参数
  if (condition.selectedCompanies && condition.selectedCompanies.length > 0) {
    const companyNames = condition.selectedCompanies.map((c) => c.name);
    const companyCodes = condition.selectedCompanies.map((c) => c.code);

    if (companyNames.length > 1) {
      params.companyNames = companyNames;
    } else {
      params.companyName = companyNames[0];
    }

    if (companyCodes.length > 1) {
      params.companyCodes = companyCodes;
    } else {
      params.companyCode = companyCodes[0];
    }
  } else if (condition.companyName) {
    params.companyName = condition.companyName;
  } else if (condition.companyCode) {
    params.companyCode = condition.companyCode;
  }

  // 判断显示逻辑
  const hasVehicleNames =
    condition.vehicleNames && condition.vehicleNames.length > 0;
  const hasSelectedCompanies =
    (condition.selectedCompanies && condition.selectedCompanies.length > 0) ||
    condition.companyName ||
    condition.companyCode;

  let primaryColumn: string;
  let expectedColumns: string[];

  if (hasVehicleNames && !hasSelectedCompanies) {
    // 只有车辆名称，优先显示车辆名称
    primaryColumn = "vehicleName";
    expectedColumns = ["vehicleName", "companyName", "certificateCount"];
  } else if (hasVehicleNames && hasSelectedCompanies) {
    // 车辆名称 + 企业，优先显示企业名称
    primaryColumn = "companyName";
    expectedColumns = ["companyName", "vehicleName", "certificateCount"];
  } else {
    // 默认情况
    primaryColumn = "companyName";
    expectedColumns = ["companyName", "certificateCount"];
  }

  return {
    queryParams: params,
    expectedColumns,
    primaryColumn,
  };
}

/**
 * 验证后端返回数据是否包含车辆名称字段
 */
export function validateVehicleNameInResponse(responseData: any[]): void {
  console.log("🔍 验证后端返回数据中的车辆名称字段...");

  if (!responseData || responseData.length === 0) {
    console.log("⚠️ 没有返回数据");
    return;
  }

  const sampleItem = responseData[0];
  const hasVehicleName = "vehicleName" in sampleItem;
  const hasCompanyName = "companyName" in sampleItem;

  console.log("📊 数据字段检查:");
  console.log(`  包含 vehicleName: ${hasVehicleName ? "✅" : "❌"}`);
  console.log(`  包含 companyName: ${hasCompanyName ? "✅" : "❌"}`);

  if (hasVehicleName) {
    console.log(`  vehicleName 示例值: "${sampleItem.vehicleName}"`);
  }
  if (hasCompanyName) {
    console.log(`  companyName 示例值: "${sampleItem.companyName}"`);
  }

  // 检查是否有车辆名称为空但企业名称有值的情况
  const vehicleNameEmptyCount = responseData.filter(
    (item) => !item.vehicleName || item.vehicleName.trim() === ""
  ).length;
  const companyNameEmptyCount = responseData.filter(
    (item) => !item.companyName || item.companyName.trim() === ""
  ).length;

  console.log("📈 数据质量统计:");
  console.log(
    `  车辆名称为空的记录: ${vehicleNameEmptyCount}/${responseData.length}`
  );
  console.log(
    `  企业名称为空的记录: ${companyNameEmptyCount}/${responseData.length}`
  );

  if (vehicleNameEmptyCount > 0 && companyNameEmptyCount === 0) {
    console.log(
      "⚠️ 发现问题: 车辆名称为空但企业名称有值，可能存在字段映射问题"
    );
  }
}

/**
 * 测试表格列显示逻辑
 */
export function testTableColumnLogic(searchConditions: any[]): void {
  console.log("📋 测试表格列显示逻辑...");

  const hasVehicleNameCondition = searchConditions.some(
    (c) => c.vehicleNames && c.vehicleNames.length > 0
  );
  const hasSelectedCompanies = searchConditions.some(
    (c) =>
      (c.selectedCompanies && c.selectedCompanies.length > 0) ||
      c.companyName ||
      c.companyCode
  );

  console.log("🔍 条件分析:");
  console.log(`  包含车辆名称条件: ${hasVehicleNameCondition ? "✅" : "❌"}`);
  console.log(`  包含企业选择条件: ${hasSelectedCompanies ? "✅" : "❌"}`);

  let primaryColumn: string;
  let columnOrder: string[];

  if (hasVehicleNameCondition && !hasSelectedCompanies) {
    primaryColumn = "vehicleName";
    columnOrder = ["vehicleName", "companyName", "certificateCount"];
    console.log("📊 显示策略: 优先显示车辆名称");
  } else {
    primaryColumn = "companyName";
    columnOrder = ["companyName"];
    if (hasVehicleNameCondition) {
      columnOrder.push("vehicleName");
    }
    columnOrder.push("certificateCount");
    console.log("📊 显示策略: 优先显示企业名称");
  }

  console.log(`  主要列: ${primaryColumn}`);
  console.log(`  列顺序: ${columnOrder.join(" -> ")}`);
}
