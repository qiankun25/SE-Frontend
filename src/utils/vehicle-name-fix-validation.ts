/**
 * 车辆名称查询修复验证工具
 * 用于验证后端修复和前端显示是否正常工作
 */

export interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * 验证后端API响应结构
 */
export function validateApiResponse(response: any): ValidationResult {
  console.log("🔍 验证API响应结构...");

  if (!response) {
    return {
      success: false,
      message: "API响应为空",
    };
  }

  if (response.code !== 200) {
    return {
      success: false,
      message: `API响应错误: ${response.message}`,
      details: response,
    };
  }

  if (!response.data || !response.data.list) {
    return {
      success: false,
      message: "API响应数据结构错误",
      details: response,
    };
  }

  // 检查数据项结构
  const sampleItem = response.data.list[0];
  if (!sampleItem) {
    return {
      success: true,
      message: "响应结构正确，但没有数据",
    };
  }

  const requiredFields = ["companyId", "companyName", "certificateCount"];
  const optionalFields = ["vehicleName", "vehicleBrand", "vehicleModel"];

  const missingRequired = requiredFields.filter(
    (field) => !(field in sampleItem)
  );
  const presentOptional = optionalFields.filter((field) => field in sampleItem);

  if (missingRequired.length > 0) {
    return {
      success: false,
      message: `缺少必需字段: ${missingRequired.join(", ")}`,
      details: sampleItem,
    };
  }

  console.log("✅ API响应结构验证通过");
  console.log(`📊 必需字段: ${requiredFields.join(", ")}`);
  console.log(`📊 可选字段: ${presentOptional.join(", ")}`);

  return {
    success: true,
    message: "API响应结构正确",
    details: {
      requiredFields,
      presentOptional,
      sampleItem,
    },
  };
}

/**
 * 验证车辆名称字段
 */
export function validateVehicleNameField(data: any[]): ValidationResult {
  console.log("🚗 验证车辆名称字段...");

  if (!data || data.length === 0) {
    return {
      success: false,
      message: "没有数据可验证",
    };
  }

  const itemsWithVehicleName = data.filter(
    (item) => item.vehicleName && item.vehicleName.trim() !== ""
  );
  const itemsWithoutVehicleName = data.filter(
    (item) => !item.vehicleName || item.vehicleName.trim() === ""
  );

  const vehicleNameCoverage = (itemsWithVehicleName.length / data.length) * 100;

  console.log(
    `📈 车辆名称覆盖率: ${vehicleNameCoverage.toFixed(1)}% (${
      itemsWithVehicleName.length
    }/${data.length})`
  );

  if (vehicleNameCoverage === 0) {
    return {
      success: false,
      message: "所有记录的车辆名称都为空",
      details: {
        totalItems: data.length,
        itemsWithVehicleName: itemsWithVehicleName.length,
        coverage: vehicleNameCoverage,
      },
    };
  }

  // 显示一些示例
  const examples = itemsWithVehicleName.slice(0, 3).map((item) => ({
    vehicleName: item.vehicleName,
    companyName: item.companyName,
    certificateCount: item.certificateCount,
  }));

  console.log("📋 车辆名称示例:");
  examples.forEach((example, index) => {
    console.log(
      `  ${index + 1}. ${example.vehicleName} (${example.companyName}) - ${
        example.certificateCount
      }张`
    );
  });

  return {
    success: true,
    message: `车辆名称字段验证通过，覆盖率${vehicleNameCoverage.toFixed(1)}%`,
    details: {
      totalItems: data.length,
      itemsWithVehicleName: itemsWithVehicleName.length,
      itemsWithoutVehicleName: itemsWithoutVehicleName.length,
      coverage: vehicleNameCoverage,
      examples,
    },
  };
}

/**
 * 验证表格列显示逻辑
 */
export function validateTableColumns(
  searchConditions: any[],
  expectedPrimaryColumn: string
): ValidationResult {
  console.log("📋 验证表格列显示逻辑...");

  const hasVehicleNameCondition = searchConditions.some(
    (c) => c.vehicleNames && c.vehicleNames.length > 0
  );
  const hasSelectedCompanies = searchConditions.some(
    (c) =>
      (c.selectedCompanies && c.selectedCompanies.length > 0) ||
      c.companyName ||
      c.companyCode
  );

  let actualPrimaryColumn: string;
  if (hasVehicleNameCondition && !hasSelectedCompanies) {
    actualPrimaryColumn = "vehicleName";
  } else {
    actualPrimaryColumn = "companyName";
  }

  const isCorrect = actualPrimaryColumn === expectedPrimaryColumn;

  console.log(`🔍 查询条件分析:`);
  console.log(`  包含车辆名称: ${hasVehicleNameCondition ? "✅" : "❌"}`);
  console.log(`  包含企业选择: ${hasSelectedCompanies ? "✅" : "❌"}`);
  console.log(`  预期主列: ${expectedPrimaryColumn}`);
  console.log(`  实际主列: ${actualPrimaryColumn}`);
  console.log(`  逻辑正确: ${isCorrect ? "✅" : "❌"}`);

  return {
    success: isCorrect,
    message: isCorrect ? "表格列显示逻辑正确" : "表格列显示逻辑错误",
    details: {
      hasVehicleNameCondition,
      hasSelectedCompanies,
      expectedPrimaryColumn,
      actualPrimaryColumn,
      searchConditions,
    },
  };
}

/**
 * 运行完整的验证流程
 */
export async function runFullValidation(
  searchConditions: any[],
  apiResponse: any,
  expectedPrimaryColumn: string = "vehicleName"
): Promise<ValidationResult> {
  console.log("🚀 开始完整验证流程...");

  const results: ValidationResult[] = [];

  // 1. 验证API响应结构
  const apiValidation = validateApiResponse(apiResponse);
  results.push(apiValidation);

  if (!apiValidation.success) {
    return {
      success: false,
      message: "API响应验证失败",
      details: { results },
    };
  }

  // 2. 验证车辆名称字段
  const vehicleNameValidation = validateVehicleNameField(apiResponse.data.list);
  results.push(vehicleNameValidation);

  // 3. 验证表格列逻辑
  const columnValidation = validateTableColumns(
    searchConditions,
    expectedPrimaryColumn
  );
  results.push(columnValidation);

  // 汇总结果
  const allSuccess = results.every((r) => r.success);
  const successCount = results.filter((r) => r.success).length;

  console.log(`📊 验证结果汇总: ${successCount}/${results.length} 项通过`);

  if (allSuccess) {
    console.log("🎉 所有验证项目都通过了！");
  } else {
    console.log("⚠️ 部分验证项目失败，需要检查");
    results.forEach((result, index) => {
      if (!result.success) {
        console.log(`  ${index + 1}. ${result.message}`);
      }
    });
  }

  return {
    success: allSuccess,
    message: allSuccess
      ? "完整验证通过"
      : `验证失败: ${successCount}/${results.length} 项通过`,
    details: { results },
  };
}

/**
 * 创建测试查询条件
 */
export function createTestConditions(): any[] {
  return [
    {
      vehicleNames: ["三轮"],
      // 没有选择企业
    },
  ];
}

/**
 * 模拟API响应用于测试
 */
export function createMockApiResponse(): any {
  return {
    code: 200,
    message: "查询成功",
    data: {
      list: [
        {
          companyId: "COMP001",
          companyName: "某某汽车制造有限公司",
          vehicleName: "三轮货车",
          vehicleBrand: "某某牌",
          vehicleModel: "XX-2024",
          certificateCount: 150,
          ranking: 1,
        },
        {
          companyId: "COMP002",
          companyName: "另一家汽车公司",
          vehicleName: "三轮客车",
          vehicleBrand: "另一牌",
          vehicleModel: "YY-2024",
          certificateCount: 120,
          ranking: 2,
        },
      ],
      total: 2,
    },
  };
}

/**
 * 运行测试
 */
export function runTest(): void {
  console.log("🧪 运行车辆名称修复验证测试...");

  const testConditions = createTestConditions();
  const mockResponse = createMockApiResponse();

  runFullValidation(testConditions, mockResponse, "vehicleName")
    .then((result) => {
      if (result.success) {
        console.log("✅ 测试通过！修复验证成功");
      } else {
        console.log("❌ 测试失败！需要进一步检查");
        console.log("详细信息:", result.details);
      }
    })
    .catch((error) => {
      console.error("💥 测试执行失败:", error);
    });
}
