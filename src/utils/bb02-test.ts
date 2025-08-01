/**
 * BB02企业代码查询测试工具
 */

export async function testBB02Query() {
  if (import.meta.env.DEV) {
    console.group("🧪 BB02企业代码查询测试");

    try {
      const { certificateQuantityApi } = await import("../services/api");

      // 测试用例1: 直接使用企业代码查询
      const testParams1 = {
        page: 1,
        pageSize: 10,
        field: "certificateCount",
        order: "desc" as const,
        companyCode: "BB02",
      };

      console.log("测试参数1 (单个企业代码):", testParams1);

      const response1 = await certificateQuantityApi.search(testParams1);
      console.log("查询结果1:", response1);

      // 测试用例2: 使用企业代码数组查询
      const testParams2 = {
        page: 1,
        pageSize: 10,
        field: "certificateCount",
        order: "desc" as const,
        companyCodes: ["BB02"],
      };

      console.log("测试参数2 (企业代码数组):", testParams2);

      const response2 = await certificateQuantityApi.search(testParams2);
      console.log("查询结果2:", response2);

      // 测试用例3: 使用企业名称查询
      const testParams3 = {
        page: 1,
        pageSize: 10,
        field: "certificateCount",
        order: "desc" as const,
        companyName: "河南丰收新能源",
      };

      console.log("测试参数3 (企业名称):", testParams3);

      const response3 = await certificateQuantityApi.search(testParams3);
      console.log("查询结果3:", response3);

      // 汇总测试结果
      console.log("📊 测试结果汇总:");
      console.log(`企业代码查询: ${response1.data?.list?.length || 0} 条结果`);
      console.log(
        `企业代码数组查询: ${response2.data?.list?.length || 0} 条结果`
      );
      console.log(`企业名称查询: ${response3.data?.list?.length || 0} 条结果`);
    } catch (error) {
      console.error("测试过程中出错:", error);
    }

    console.groupEnd();
  }
}

// 在控制台中手动调用的函数
(window as any).testBB02 = testBB02Query;
