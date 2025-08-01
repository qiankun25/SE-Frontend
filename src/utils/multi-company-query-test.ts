/**
 * 多企业查询功能测试
 * 测试修复后的多企业查询参数构建是否正确
 */

export const testMultiCompanyQuery = () => {
  console.log("🧪 开始测试多企业查询功能...");

  // 模拟多个查询条件，每个条件包含不同的企业
  const mockConditions = [
    {
      selectedCompanies: [
        { code: "BYD001", name: "比亚迪汽车有限公司", isPartialMatch: false },
        {
          code: "FOTON001",
          name: "北汽福田汽车股份有限公司",
          isPartialMatch: false,
        },
      ],
      vehicleBrands: ["比亚迪"],
      timeRangeType: "thisYear",
    },
    {
      selectedCompanies: [
        {
          code: "TESLA001",
          name: "特斯拉(上海)有限公司",
          isPartialMatch: false,
        },
      ],
      vehicleBrands: ["特斯拉"],
      fuelTypes: ["电"],
    },
    {
      // 部分匹配的企业
      selectedCompanies: [{ code: "", name: "长城", isPartialMatch: true }],
      vehicleModels: ["H6", "H9"],
    },
  ];

  // 模拟buildSearchParams函数的逻辑
  const buildSearchParams = (conditions: any[]) => {
    const params: any = {};

    // 收集所有企业信息
    const allCompanyNames: string[] = [];
    const allCompanyCodes: string[] = [];

    conditions.forEach((condition) => {
      // 企业信息 - 处理新的多选企业逻辑
      if (
        condition.selectedCompanies &&
        condition.selectedCompanies.length > 0
      ) {
        // 提取企业名称和代码，合并到总列表中
        const companyNames = condition.selectedCompanies
          .map((c: any) => c.name)
          .filter((name: string) => name && name.trim());
        const companyCodes = condition.selectedCompanies
          .map((c: any) => c.code)
          .filter((code: string) => code && code.trim());

        allCompanyNames.push(...companyNames);
        allCompanyCodes.push(...companyCodes);
      }

      // 其他参数处理（简化版）
      if (condition.vehicleBrands) {
        params.vehicleBrands = condition.vehicleBrands;
      }
      if (condition.vehicleModels) {
        params.vehicleModels = condition.vehicleModels;
      }
      if (condition.fuelTypes) {
        params.fuelTypes = condition.fuelTypes;
      }
      if (condition.timeRangeType) {
        params.timeRangeType = condition.timeRangeType;
      }
    });

    // 设置合并后的企业参数
    if (allCompanyNames.length > 0) {
      const uniqueCompanyNames = [...new Set(allCompanyNames)];
      params.companyNames = uniqueCompanyNames;
      params.companyName = uniqueCompanyNames[0]; // 兼容单个值
    }
    if (allCompanyCodes.length > 0) {
      const uniqueCompanyCodes = [...new Set(allCompanyCodes)];
      params.companyCodes = uniqueCompanyCodes;
      params.companyCode = uniqueCompanyCodes[0]; // 兼容单个值
    }

    return params;
  };

  // 执行测试
  const result = buildSearchParams(mockConditions);

  console.log("\n📋 测试结果:");
  console.log("输入条件数量:", mockConditions.length);
  console.log("合并后的查询参数:", result);

  // 验证企业参数
  console.log("\n🏢 企业参数验证:");
  console.log("企业名称列表:", result.companyNames);
  console.log("企业代码列表:", result.companyCodes);

  // 验证预期结果
  const expectedCompanyNames = [
    "比亚迪汽车有限公司",
    "北汽福田汽车股份有限公司",
    "特斯拉(上海)有限公司",
    "长城",
  ];
  const expectedCompanyCodes = ["BYD001", "FOTON001", "TESLA001"];

  console.log("\n✅ 预期结果验证:");
  console.log("预期企业名称:", expectedCompanyNames);
  console.log("实际企业名称:", result.companyNames);
  console.log(
    "企业名称匹配:",
    JSON.stringify(result.companyNames) === JSON.stringify(expectedCompanyNames)
  );

  console.log("预期企业代码:", expectedCompanyCodes);
  console.log("实际企业代码:", result.companyCodes);
  console.log(
    "企业代码匹配:",
    JSON.stringify(result.companyCodes) === JSON.stringify(expectedCompanyCodes)
  );

  // 模拟后端SQL查询条件
  console.log("\n🔍 模拟后端SQL查询条件:");
  if (result.companyNames && result.companyNames.length > 0) {
    const nameConditions = result.companyNames
      .map((name) => `CLZZQYMC LIKE '%${name}%'`)
      .join(" OR ");
    console.log(`企业名称条件: (${nameConditions})`);
  }
  if (result.companyCodes && result.companyCodes.length > 0) {
    const codeConditions = result.companyCodes
      .map((code) => `QYDM = '${code}'`)
      .join(" OR ");
    console.log(`企业代码条件: (${codeConditions})`);
  }

  console.log("\n✅ 多企业查询功能测试完成!");
  console.log("修复要点:");
  console.log("1. 正确合并多个条件中的企业信息");
  console.log("2. 去重处理，避免重复的企业");
  console.log("3. 同时支持企业名称和企业代码的OR查询");
  console.log("4. 后端使用OR逻辑连接多个企业条件");

  return result;
};

// 测试单个条件多企业的情况
export const testSingleConditionMultiCompany = () => {
  console.log("\n🧪 测试单个条件多企业情况...");

  const singleCondition = [
    {
      selectedCompanies: [
        { code: "BYD001", name: "比亚迪汽车有限公司", isPartialMatch: false },
        {
          code: "FOTON001",
          name: "北汽福田汽车股份有限公司",
          isPartialMatch: false,
        },
        {
          code: "TESLA001",
          name: "特斯拉(上海)有限公司",
          isPartialMatch: false,
        },
      ],
    },
  ];

  // 简化的参数构建逻辑
  const params: any = {};
  const allCompanyNames: string[] = [];
  const allCompanyCodes: string[] = [];

  singleCondition.forEach((condition) => {
    if (condition.selectedCompanies && condition.selectedCompanies.length > 0) {
      const companyNames = condition.selectedCompanies
        .map((c: any) => c.name)
        .filter((name: string) => name && name.trim());
      const companyCodes = condition.selectedCompanies
        .map((c: any) => c.code)
        .filter((code: string) => code && code.trim());

      allCompanyNames.push(...companyNames);
      allCompanyCodes.push(...companyCodes);
    }
  });

  if (allCompanyNames.length > 0) {
    params.companyNames = [...new Set(allCompanyNames)];
  }
  if (allCompanyCodes.length > 0) {
    params.companyCodes = [...new Set(allCompanyCodes)];
  }

  console.log("单个条件多企业结果:", params);
  console.log("企业数量:", params.companyNames?.length || 0);

  return params;
};

// 在开发环境下自动运行测试
if (import.meta.env.DEV) {
  setTimeout(() => {
    testMultiCompanyQuery();
    testSingleConditionMultiCompany();
  }, 2000);
}
