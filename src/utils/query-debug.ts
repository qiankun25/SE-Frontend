/**
 * 查询调试工具
 * 用于调试企业代码查询问题
 */

export function debugQueryParams(conditions: any[], params: any) {
  if (import.meta.env.DEV) {
    console.group("🔍 查询参数调试");
    console.log("原始条件:", conditions);
    console.log("构造的参数:", params);

    // 检查企业相关参数
    if (
      params.companyCode ||
      params.companyCodes ||
      params.companyName ||
      params.companyNames
    ) {
      console.group("👥 企业查询参数");
      console.log("单个企业代码:", params.companyCode);
      console.log("多个企业代码:", params.companyCodes);
      console.log("单个企业名称:", params.companyName);
      console.log("多个企业名称:", params.companyNames);
      console.groupEnd();
    }

    console.groupEnd();
  }
}

export function debugCompanySelection(selectedCompanies: any[]) {
  if (import.meta.env.DEV) {
    console.group("🏢 企业选择调试");
    console.log("选择的企业数量:", selectedCompanies.length);
    selectedCompanies.forEach((company, index) => {
      console.log(`企业 ${index + 1}:`, {
        name: company.name,
        code: company.code,
        isPartialMatch: company.isPartialMatch,
      });
    });
    console.groupEnd();
  }
}
