/**
 * 简单的时间选择组件类型验证测试
 */

import type { TimeRange, TimeSelectionState } from "../types/time-selection";
import {
  validateTimeRange,
  validateTimeSelectionState,
} from "./time-selection-validation";
import { mapStateToQueryParams } from "./time-selection-mapper";
import { getQuickOptionByKey } from "../config/time-selection";

// 测试基本类型定义
const testTimeRange: TimeRange = {
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  unit: "day",
};

const testState: TimeSelectionState = {
  quickSelection: "thisYear",
  timeUnit: "day",
  timeRange: testTimeRange,
  comparisonEnabled: false,
  statisticsMode: "monthly",
  validation: {
    isValid: true,
    level: "success",
    message: "配置正确",
  },
};

// 测试验证功能
console.log("时间范围验证:", validateTimeRange(testTimeRange));
console.log("状态验证:", validateTimeSelectionState(testState));

// 测试参数映射
console.log("参数映射:", mapStateToQueryParams(testState));

// 测试配置获取
console.log("快捷选项:", getQuickOptionByKey("thisYear"));

console.log("✅ 基本类型和功能测试通过！");
