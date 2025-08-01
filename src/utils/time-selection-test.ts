/**
 * 时间选择组件核心功能测试
 *
 * 验证类型安全、数据验证和参数映射功能
 */

import type {
  TimeRange,
  TimeSelectionState,
  ValidationResult,
} from "../types/time-selection";

import {
  validateTimeRange,
  validateComparisonRange,
  validateTimeSelectionState,
  sanitizeTimeRange,
  sanitizeTimeSelectionState,
  isTimeRange,
  isTimeSelectionState,
} from "./time-selection-validation";

import {
  QueryBuilder,
  mapStateToQueryParams,
  mapStateToApiParams,
} from "./time-selection-mapper";

import {
  getQuickOptionByKey,
  getTimeUnitConfig,
  suggestStatisticsMode,
  TIME_SELECTION_CONFIG,
} from "../config/time-selection";

// ============================================================================
// 测试数据
// ============================================================================

/**
 * 创建测试用的时间范围
 */
function createTestTimeRange(): TimeRange {
  return {
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    unit: "day",
  };
}

/**
 * 创建测试用的时间选择状态
 */
function createTestTimeSelectionState(): TimeSelectionState {
  return {
    quickSelection: "thisYear",
    timeUnit: "day",
    timeRange: createTestTimeRange(),
    comparisonEnabled: false,
    statisticsMode: "monthly",
    validation: {
      isValid: true,
      level: "success",
      message: "时间选择配置正确",
    },
  };
}

// ============================================================================
// 类型安全测试
// ============================================================================

/**
 * 测试类型守卫函数
 */
export function testTypeGuards(): void {
  console.log("=== 类型守卫测试 ===");

  // 测试有效的时间范围
  const validTimeRange = createTestTimeRange();
  console.log("有效时间范围检查:", isTimeRange(validTimeRange)); // 应该为true

  // 测试无效的时间范围
  const invalidTimeRange = {
    startDate: "invalid",
    endDate: null,
    unit: "invalid",
  };
  console.log("无效时间范围检查:", isTimeRange(invalidTimeRange)); // 应该为false

  // 测试有效的时间选择状态
  const validState = createTestTimeSelectionState();
  console.log("有效状态检查:", isTimeSelectionState(validState)); // 应该为true

  // 测试无效的时间选择状态
  const invalidState = {
    timeUnit: "invalid",
    comparisonEnabled: "not boolean",
  };
  console.log("无效状态检查:", isTimeSelectionState(invalidState)); // 应该为false
}

// ============================================================================
// 数据验证测试
// ============================================================================

/**
 * 测试时间范围验证
 */
export function testTimeRangeValidation(): void {
  console.log("\n=== 时间范围验证测试 ===");

  // 测试有效时间范围
  const validRange = createTestTimeRange();
  const validResult = validateTimeRange(validRange);
  console.log("有效时间范围验证:", validResult);

  // 测试开始日期晚于结束日期
  const invalidRange: TimeRange = {
    startDate: new Date("2024-12-31"),
    endDate: new Date("2024-01-01"),
    unit: "day",
  };
  const invalidResult = validateTimeRange(invalidRange);
  console.log("无效时间范围验证:", invalidResult);

  // 测试未来日期
  const futureRange: TimeRange = {
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    unit: "day",
  };
  const futureResult = validateTimeRange(futureRange);
  console.log("未来日期验证:", futureResult);

  // 测试null时间范围
  const nullResult = validateTimeRange(null);
  console.log("空时间范围验证:", nullResult);
}

/**
 * 测试同期比验证
 */
export function testComparisonValidation(): void {
  console.log("\n=== 同期比验证测试 ===");

  // 测试同一年份的时间范围
  const sameYearRange: TimeRange = {
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-06-30"),
    unit: "day",
  };
  const sameYearResult = validateComparisonRange(sameYearRange, true);
  console.log("同一年份验证:", sameYearResult);

  // 测试跨年的时间范围
  const crossYearRange: TimeRange = {
    startDate: new Date("2023-01-01"),
    endDate: new Date("2024-12-31"),
    unit: "day",
  };
  const crossYearResult = validateComparisonRange(crossYearRange, true);
  console.log("跨年范围验证:", crossYearResult);

  // 测试未启用同期比
  const disabledResult = validateComparisonRange(crossYearRange, false);
  console.log("未启用同期比验证:", disabledResult);
}

/**
 * 测试完整状态验证
 */
export function testStateValidation(): void {
  console.log("\n=== 完整状态验证测试 ===");

  // 测试有效状态
  const validState = createTestTimeSelectionState();
  const validResult = validateTimeSelectionState(validState);
  console.log("有效状态验证:", validResult);

  // 测试无效时间单位
  const invalidUnitState: TimeSelectionState = {
    ...validState,
    timeUnit: "invalid" as any,
  };
  const invalidUnitResult = validateTimeSelectionState(invalidUnitState);
  console.log("无效时间单位验证:", invalidUnitResult);

  // 测试跨年同期比
  const crossYearState: TimeSelectionState = {
    ...validState,
    timeRange: {
      startDate: new Date("2023-01-01"),
      endDate: new Date("2024-12-31"),
      unit: "day",
    },
    comparisonEnabled: true,
  };
  const crossYearResult = validateTimeSelectionState(crossYearState);
  console.log("跨年同期比验证:", crossYearResult);
}

// ============================================================================
// 数据清理测试
// ============================================================================

/**
 * 测试数据清理功能
 */
export function testDataSanitization(): void {
  console.log("\n=== 数据清理测试 ===");

  // 测试时间范围清理
  const dirtyTimeRange: TimeRange = {
    startDate: new Date("2024-12-31"),
    endDate: new Date("2024-01-01"), // 开始日期晚于结束日期
    unit: "day",
  };
  const cleanTimeRange = sanitizeTimeRange(dirtyTimeRange);
  console.log("时间范围清理结果:", cleanTimeRange);

  // 测试状态清理
  const dirtyState = {
    timeUnit: "day" as any, // 使用有效的时间单位
    comparisonEnabled: "true" as any, // 字符串而非布尔值
    statisticsMode: "unknown" as any,
  };
  const cleanState = sanitizeTimeSelectionState(dirtyState);
  console.log("状态清理结果:", cleanState);
}

// ============================================================================
// 参数映射测试
// ============================================================================

/**
 * 测试参数映射功能
 */
export function testParameterMapping(): void {
  console.log("\n=== 参数映射测试 ===");

  const testState = createTestTimeSelectionState();

  // 测试基本参数映射
  const queryParams = mapStateToQueryParams(testState);
  console.log("查询参数映射结果:", queryParams);

  // 测试API参数映射
  const apiParams = mapStateToApiParams(testState);
  console.log("API参数映射结果:", apiParams);

  // 测试不同时间单位的映射
  const yearState: TimeSelectionState = {
    ...testState,
    timeUnit: "year",
    timeRange: {
      startDate: new Date("2022-01-01"),
      endDate: new Date("2024-12-31"),
      unit: "year",
    },
    statisticsMode: "yearly",
  };
  const yearParams = mapStateToQueryParams(yearState);
  console.log("年度参数映射结果:", yearParams);

  // 测试月度映射
  const monthState: TimeSelectionState = {
    ...testState,
    timeUnit: "month",
    timeRange: {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-06-30"),
      unit: "month",
    },
    statisticsMode: "monthly",
  };
  const monthParams = mapStateToQueryParams(monthState);
  console.log("月度参数映射结果:", monthParams);
}

// ============================================================================
// 查询构建测试
// ============================================================================

/**
 * 测试查询构建功能
 */
export function testQueryBuilding(): void {
  console.log("\n=== 查询构建测试 ===");

  const builder = new QueryBuilder();
  const testState = createTestTimeSelectionState();

  // 测试查询描述构建
  const description = builder.buildQueryDescription(testState);
  console.log("查询描述:", description);

  // 测试不同场景的查询描述
  const historicalState: TimeSelectionState = {
    ...testState,
    quickSelection: "historical",
    timeRange: null,
    statisticsMode: "total",
  };
  const historicalDescription = builder.buildQueryDescription(historicalState);
  console.log("历史总量查询描述:", historicalDescription);

  const comparisonState: TimeSelectionState = {
    ...testState,
    comparisonEnabled: true,
  };
  const comparisonDescription = builder.buildQueryDescription(comparisonState);
  console.log("同期比查询描述:", comparisonDescription);
}

// ============================================================================
// 配置测试
// ============================================================================

/**
 * 测试配置功能
 */
export function testConfiguration(): void {
  console.log("\n=== 配置测试 ===");

  // 测试快捷选项获取
  const thisYearOption = getQuickOptionByKey("thisYear");
  console.log("今年快捷选项:", thisYearOption);

  const invalidOption = getQuickOptionByKey("invalid");
  console.log("无效快捷选项:", invalidOption);

  // 测试时间单位配置
  const dayConfig = getTimeUnitConfig("day");
  console.log("日单位配置:", dayConfig);

  const yearConfig = getTimeUnitConfig("year");
  console.log("年单位配置:", yearConfig);

  // 测试统计模式建议
  const shortRange: TimeRange = {
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-31"),
    unit: "day",
  };
  const shortSuggestion = suggestStatisticsMode(shortRange);
  console.log("短期范围建议:", shortSuggestion);

  const longRange: TimeRange = {
    startDate: new Date("2022-01-01"),
    endDate: new Date("2024-12-31"),
    unit: "day",
  };
  const longSuggestion = suggestStatisticsMode(longRange);
  console.log("长期范围建议:", longSuggestion);

  // 测试配置完整性
  console.log("配置完整性检查:");
  console.log(
    "- 快捷选项数量:",
    TIME_SELECTION_CONFIG.quickSelection.options.length
  );
  console.log("- 时间单位数量:", TIME_SELECTION_CONFIG.timeUnits.length);
  console.log("- 默认时间单位:", TIME_SELECTION_CONFIG.defaultTimeUnit);
  console.log("- 显示同期比:", TIME_SELECTION_CONFIG.showComparison);
}

// ============================================================================
// 综合测试函数
// ============================================================================

/**
 * 运行所有测试
 */
export function runAllTests(): void {
  console.log("开始运行时间选择组件核心功能测试...\n");

  try {
    testTypeGuards();
    testTimeRangeValidation();
    testComparisonValidation();
    testStateValidation();
    testDataSanitization();
    testParameterMapping();
    testQueryBuilding();
    testConfiguration();

    console.log("\n✅ 所有测试完成！");
  } catch (error) {
    console.error("\n❌ 测试过程中发生错误:", error);
  }
}

// ============================================================================
// 性能测试
// ============================================================================

/**
 * 测试性能
 */
export function testPerformance(): void {
  console.log("\n=== 性能测试 ===");

  const iterations = 1000;
  const testState = createTestTimeSelectionState();

  // 测试验证性能
  console.time("验证性能测试");
  for (let i = 0; i < iterations; i++) {
    validateTimeSelectionState(testState);
  }
  console.timeEnd("验证性能测试");

  // 测试映射性能
  console.time("映射性能测试");
  for (let i = 0; i < iterations; i++) {
    mapStateToQueryParams(testState);
  }
  console.timeEnd("映射性能测试");

  // 测试清理性能
  console.time("清理性能测试");
  for (let i = 0; i < iterations; i++) {
    sanitizeTimeSelectionState(testState);
  }
  console.timeEnd("清理性能测试");
}

// 如果直接运行此文件，执行所有测试
if (typeof window === "undefined") {
  // Node.js环境
  runAllTests();
  testPerformance();
}
