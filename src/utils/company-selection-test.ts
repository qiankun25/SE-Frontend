/**
 * 企业选择功能测试工具
 * 用于验证新的企业选择逻辑是否正常工作
 */

export interface CompanyInfo {
  code: string;
  name: string;
  isPartialMatch?: boolean;
}

/**
 * 测试企业选择功能
 */
export function testCompanySelection() {
  console.group("🧪 企业选择功能测试");

  // 模拟企业数据
  const mockCompanies: CompanyInfo[] = [
    { code: "C001", name: "一汽集团有限公司" },
    { code: "C002", name: "比亚迪股份有限公司" },
    { code: "C003", name: "上汽集团股份有限公司" },
  ];

  // 测试用例
  const testCases = [
    {
      name: "完整企业名称匹配",
      input: "一汽集团有限公司",
      expected: {
        code: "C001",
        name: "一汽集团有限公司",
        isPartialMatch: false,
      },
    },
    {
      name: "部分企业名称匹配",
      input: "一汽",
      expected: { code: "", name: "一汽", isPartialMatch: true },
    },
    {
      name: "企业代码匹配",
      input: "C002",
      expected: {
        code: "C002",
        name: "比亚迪股份有限公司",
        isPartialMatch: false,
      },
    },
    {
      name: "未知企业代码",
      input: "C999",
      expected: { code: "C999", name: "企业代码: C999", isPartialMatch: true },
    },
  ];

  testCases.forEach((testCase) => {
    console.log(`📝 测试: ${testCase.name}`);
    console.log(`   输入: ${testCase.input}`);
    console.log(`   期望: ${JSON.stringify(testCase.expected)}`);

    // 这里可以添加实际的测试逻辑
    const result = simulateCompanySelection(testCase.input, mockCompanies);
    console.log(`   结果: ${JSON.stringify(result)}`);

    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
    console.log(`   ${passed ? "✅ 通过" : "❌ 失败"}`);
  });

  console.groupEnd();
}

/**
 * 模拟企业选择逻辑
 */
function simulateCompanySelection(
  input: string,
  companies: CompanyInfo[]
): CompanyInfo {
  // 检查是否为企业代码（假设企业代码以C开头）
  if (input.startsWith("C")) {
    const matchedCompany = companies.find((c) => c.code === input);
    if (matchedCompany) {
      return { ...matchedCompany, isPartialMatch: false };
    } else {
      return { code: input, name: `企业代码: ${input}`, isPartialMatch: true };
    }
  }

  // 检查是否为完整企业名称
  const exactMatch = companies.find((c) => c.name === input);
  if (exactMatch) {
    return { ...exactMatch, isPartialMatch: false };
  }

  // 部分匹配
  return { code: "", name: input, isPartialMatch: true };
}

/**
 * 验证查询条件构造
 */
export function validateQueryConstruction(selectedCompanies: CompanyInfo[]) {
  console.group("🔍 查询条件构造验证");

  const companyNames = selectedCompanies
    .map((c) => c.name)
    .filter((name) => name && name.trim());

  const companyCodes = selectedCompanies
    .map((c) => c.code)
    .filter((code) => code && code.trim());

  console.log("选择的企业:", selectedCompanies);
  console.log("提取的企业名称:", companyNames);
  console.log("提取的企业代码:", companyCodes);

  const queryParams = {
    companyNames: companyNames.length > 0 ? companyNames : undefined,
    companyCodes: companyCodes.length > 0 ? companyCodes : undefined,
    companyName: companyNames[0] || undefined, // 兼容性
    companyCode: companyCodes[0] || undefined, // 兼容性
  };

  console.log("构造的查询参数:", queryParams);
  console.groupEnd();

  return queryParams;
}

/**
 * 在开发环境下运行测试
 */
export function runCompanySelectionTests() {
  if (import.meta.env.DEV) {
    testCompanySelection();

    // 测试多选场景
    const multiSelectTest = [
      { code: "C001", name: "一汽集团有限公司", isPartialMatch: false },
      { code: "", name: "比亚迪", isPartialMatch: true },
      { code: "C999", name: "企业代码: C999", isPartialMatch: true },
    ];

    validateQueryConstruction(multiSelectTest);
  }
}
