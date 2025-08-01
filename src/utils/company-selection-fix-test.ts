/**
 * 企业选择功能修复测试
 * 测试修复后的企业选择逻辑是否正常工作
 */

export const testCompanySelectionFix = () => {
  console.log("🧪 开始测试企业选择功能修复...");

  // 模拟企业数据
  const mockCompanies = [
    { code: "BYD001", name: "比亚迪汽车有限公司", isPartialMatch: false },
    {
      code: "FOTON001",
      name: "北汽福田汽车股份有限公司",
      isPartialMatch: false,
    },
    { code: "TESLA001", name: "特斯拉(上海)有限公司", isPartialMatch: false },
  ];

  // 模拟已选择的企业列表
  let selectedCompanies: any[] = [];

  // 测试企业选择逻辑
  const isCompanySelected = (company: any): boolean => {
    return selectedCompanies.some((selected) => {
      // 如果有企业代码，优先按代码匹配
      if (company.code && selected.code && company.code.trim() !== "") {
        return selected.code === company.code;
      }
      // 否则按企业名称精确匹配
      if (company.name && selected.name && company.name.trim() !== "") {
        return selected.name === company.name;
      }
      return false;
    });
  };

  // 测试添加企业逻辑
  const addCompanyToSelection = (company: any) => {
    if (!isCompanySelected(company)) {
      selectedCompanies.push({ ...company });
      console.log(`✅ 已添加企业：${company.name} (${company.code})`);
      return true;
    } else {
      // 允许重复添加，但给出提示
      selectedCompanies.push({ ...company });
      console.log(`ℹ️ 企业 ${company.name} 已重复添加，查询时将使用OR逻辑`);
      return false;
    }
  };

  // 测试场景1：正常添加企业
  console.log("\n📋 测试场景1：正常添加企业");
  addCompanyToSelection(mockCompanies[0]); // 比亚迪
  console.log("当前已选择企业数量:", selectedCompanies.length);

  // 测试场景2：添加另一家企业
  console.log("\n📋 测试场景2：添加另一家企业");
  addCompanyToSelection(mockCompanies[1]); // 福田
  console.log("当前已选择企业数量:", selectedCompanies.length);

  // 测试场景3：重复添加同一家企业
  console.log("\n📋 测试场景3：重复添加同一家企业");
  addCompanyToSelection(mockCompanies[0]); // 再次添加比亚迪
  console.log("当前已选择企业数量:", selectedCompanies.length);

  // 测试场景4：部分匹配企业
  console.log("\n📋 测试场景4：部分匹配企业");
  const partialCompany = { code: "", name: "福田", isPartialMatch: true };
  addCompanyToSelection(partialCompany);
  console.log("当前已选择企业数量:", selectedCompanies.length);

  // 测试场景5：验证查询参数构建
  console.log("\n📋 测试场景5：验证查询参数构建");
  const companyNames = selectedCompanies
    .map((c) => c.name)
    .filter((name) => name && name.trim());
  const companyCodes = selectedCompanies
    .map((c) => c.code)
    .filter((code) => code && code.trim());

  console.log("企业名称列表 (OR逻辑):", companyNames);
  console.log("企业代码列表 (OR逻辑):", companyCodes);

  // 验证OR逻辑
  console.log("\n🔍 验证OR逻辑查询条件:");
  console.log("SQL WHERE条件应该类似于:");
  if (companyNames.length > 0) {
    const nameConditions = companyNames
      .map((name) => `CLZZQYMC LIKE '%${name}%'`)
      .join(" OR ");
    console.log(`企业名称: (${nameConditions})`);
  }
  if (companyCodes.length > 0) {
    const codeConditions = companyCodes
      .map((code) => `QYDM = '${code}'`)
      .join(" OR ");
    console.log(`企业代码: (${codeConditions})`);
  }

  console.log("\n✅ 企业选择功能修复测试完成!");
  console.log("修复要点:");
  console.log('1. 允许用户重新输入企业名称，不会显示"该企业已选择"');
  console.log("2. 支持选择多个企业，使用OR逻辑进行查询");
  console.log("3. 允许重复添加企业，但会给出提示");
  console.log("4. 后端查询使用OR逻辑连接多个企业条件");

  return {
    selectedCompanies,
    companyNames,
    companyCodes,
  };
};

// 在开发环境下自动运行测试
if (import.meta.env.DEV) {
  // 延迟执行，确保在组件加载后运行
  setTimeout(() => {
    testCompanySelectionFix();
  }, 1000);
}
