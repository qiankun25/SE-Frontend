/**
 * 查询参数映射和构建器集成示例
 *
 * 演示如何使用 ParameterMapper 和 QueryBuilder 协同工作
 */

import type { TimeSelectionState } from "../../types/time-selection";
import { DEFAULT_TIME_SELECTION_STATE } from "../../types/time-selection";
import { ParameterMapper } from "../parameter-mapper";
import { QueryBuilder } from "../query-builder";

/**
 * 查询映射和构建示例类
 */
export class QueryMappingExample {
  private parameterMapper = new ParameterMapper();
  private queryBuilder = new QueryBuilder();

  /**
   * 示例1：今年按月统计查询
   */
  thisYearMonthlyExample() {
    console.log("=== 示例1：今年按月统计查询 ===");

    // 1. 创建时间选择状态
    const state: TimeSelectionState = {
      ...DEFAULT_TIME_SELECTION_STATE,
      quickSelection: "thisYear",
      timeUnit: "day",
      timeRange: {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        unit: "day",
      },
      statisticsMode: "monthly",
      comparisonEnabled: false,
    };

    // 2. 映射为查询参数
    const queryParams = this.parameterMapper.mapToQueryParams(state);
    console.log("查询参数:", queryParams);

    // 3. 构建SQL查询
    const queryResult = this.queryBuilder.buildQuery(queryParams);
    console.log("生成的SQL:", queryResult.sql);
    console.log("查询参数:", queryResult.parameters);

    return { state, queryParams, queryResult };
  }

  /**
   * 示例2：近两年按年统计查询
   */
  recent2YearsYearlyExample() {
    console.log("\n=== 示例2：近两年按年统计查询 ===");

    const state: TimeSelectionState = {
      ...DEFAULT_TIME_SELECTION_STATE,
      quickSelection: "recent2years",
      timeUnit: "day",
      timeRange: {
        startDate: new Date("2022-01-01"),
        endDate: new Date("2024-12-31"),
        unit: "day",
      },
      statisticsMode: "yearly",
      comparisonEnabled: false,
    };

    const queryParams = this.parameterMapper.mapToQueryParams(state);
    console.log("查询参数:", queryParams);

    const queryResult = this.queryBuilder.buildQuery(queryParams, {
      additionalConditions: ["company_name = 'AUDI'"],
    });
    console.log("生成的SQL:", queryResult.sql);

    return { state, queryParams, queryResult };
  }

  /**
   * 示例3：历史总量查询
   */
  historicalTotalExample() {
    console.log("\n=== 示例3：历史总量查询 ===");

    const state: TimeSelectionState = {
      ...DEFAULT_TIME_SELECTION_STATE,
      quickSelection: "historical",
      timeUnit: "day",
      timeRange: null, // 不限制时间范围
      statisticsMode: "total",
      comparisonEnabled: false,
    };

    const queryParams = this.parameterMapper.mapToQueryParams(state);
    console.log("查询参数:", queryParams);

    const queryResult = this.queryBuilder.buildQuery(queryParams);
    console.log("生成的SQL:", queryResult.sql);

    return { state, queryParams, queryResult };
  }

  /**
   * 示例4：同期比查询
   */
  comparisonQueryExample() {
    console.log("\n=== 示例4：同期比查询 ===");

    const state: TimeSelectionState = {
      ...DEFAULT_TIME_SELECTION_STATE,
      quickSelection: "thisYear",
      timeUnit: "day",
      timeRange: {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
        unit: "day",
      },
      statisticsMode: "monthly",
      comparisonEnabled: true,
    };

    const queryParams = this.parameterMapper.mapToQueryParams(state);
    console.log("查询参数:", queryParams);

    try {
      const queryResult = this.queryBuilder.buildComparisonQuery(queryParams);
      console.log("生成的同期比SQL:", queryResult.sql);
    } catch (error) {
      console.error("同期比查询错误:", error);
    }

    return { state, queryParams };
  }

  /**
   * 示例5：参数验证
   */
  validationExample() {
    console.log("\n=== 示例5：参数验证 ===");

    // 有效参数
    const validParams = this.parameterMapper.mapToQueryParams({
      ...DEFAULT_TIME_SELECTION_STATE,
      timeUnit: "day",
      timeRange: {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        unit: "day",
      },
    });

    const validationResult =
      this.parameterMapper.validateQueryParams(validParams);
    console.log("有效参数验证结果:", validationResult);

    // 无效参数
    const invalidParams = {
      ...validParams,
      startDate: "2024-12-31",
      endDate: "2024-01-01", // 开始日期晚于结束日期
    };

    const invalidValidationResult =
      this.parameterMapper.validateQueryParams(invalidParams);
    console.log("无效参数验证结果:", invalidValidationResult);

    return { validationResult, invalidValidationResult };
  }

  /**
   * 示例6：查询示例生成
   */
  queryExamplesDemo() {
    console.log("\n=== 示例6：查询示例生成 ===");

    const scenarios = ["thisYear", "recent2years", "historical"] as const;

    scenarios.forEach((scenario) => {
      const example = this.queryBuilder.getQueryExample(scenario);
      console.log(`${scenario} 查询示例:`, example.sql);
    });
  }

  /**
   * 运行所有示例
   */
  runAllExamples() {
    console.log("开始运行查询参数映射和构建器集成示例...\n");

    this.thisYearMonthlyExample();
    this.recent2YearsYearlyExample();
    this.historicalTotalExample();
    this.comparisonQueryExample();
    this.validationExample();
    this.queryExamplesDemo();

    console.log("\n所有示例运行完成！");
  }
}

/**
 * 运行示例的便捷函数
 */
export function runQueryMappingExamples() {
  const example = new QueryMappingExample();
  example.runAllExamples();
}

// 如果直接运行此文件，则执行示例
if (typeof window === "undefined") {
  // Node.js 环境
  runQueryMappingExamples();
}
