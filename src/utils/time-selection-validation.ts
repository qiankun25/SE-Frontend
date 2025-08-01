/**
 * 时间选择组件数据验证工具
 *
 * 实现基础的类型安全和数据验证功能
 * 包括时间范围验证、同期比验证、输入验证等
 */

import type {
  TimeRange,
  TimeSelectionState,
  ValidationResult,
  TimeSelectionError,
  TimeSelectionException,
  TimeUnit,
} from "../types/time-selection";

// ============================================================================
// 基础验证函数
// ============================================================================

/**
 * 验证日期是否有效
 * @param date 要验证的日期
 * @returns 是否有效
 */
export function isValidDate(date: Date | null | undefined): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 验证时间范围是否有效
 * @param timeRange 时间范围
 * @returns 验证结果
 */
export function validateTimeRange(
  timeRange: TimeRange | null
): ValidationResult {
  if (!timeRange) {
    return {
      isValid: true,
      level: "success",
      message: "",
    };
  }

  const { startDate, endDate } = timeRange;

  // 检查日期有效性
  if (startDate && !isValidDate(startDate)) {
    return {
      isValid: false,
      level: "error",
      message: "开始日期格式无效",
      suggestion: "请选择有效的开始日期",
    };
  }

  if (endDate && !isValidDate(endDate)) {
    return {
      isValid: false,
      level: "error",
      message: "结束日期格式无效",
      suggestion: "请选择有效的结束日期",
    };
  }

  // 检查日期范围逻辑
  if (startDate && endDate) {
    if (startDate > endDate) {
      return {
        isValid: false,
        level: "error",
        message: "开始日期不能晚于结束日期",
        suggestion: "请调整日期范围，确保开始日期早于或等于结束日期",
      };
    }

    // 检查是否选择了未来日期
    const now = new Date();
    if (startDate > now || endDate > now) {
      return {
        isValid: false,
        level: "warning",
        message: "选择的日期包含未来时间",
        suggestion: "建议选择当前日期之前的时间范围以获得准确数据",
      };
    }

    // 检查时间跨度是否过大（超过10年）
    const maxTimeSpan = 10 * 365 * 24 * 60 * 60 * 1000; // 10年毫秒数
    if (endDate.getTime() - startDate.getTime() > maxTimeSpan) {
      return {
        isValid: false,
        level: "warning",
        message: "选择的时间跨度过大（超过10年）",
        suggestion: "建议缩小时间范围以提高查询性能",
      };
    }
  }

  return {
    isValid: true,
    level: "success",
    message: "时间范围设置正确",
  };
}

/**
 * 验证同期比时间范围
 * @param timeRange 时间范围
 * @param comparisonEnabled 是否启用同期比
 * @returns 验证结果
 */
export function validateComparisonRange(
  timeRange: TimeRange | null,
  comparisonEnabled: boolean
): ValidationResult {
  if (
    !comparisonEnabled ||
    !timeRange ||
    !timeRange.startDate ||
    !timeRange.endDate
  ) {
    return {
      isValid: true,
      level: "success",
      message: "",
    };
  }

  const startYear = timeRange.startDate.getFullYear();
  const endYear = timeRange.endDate.getFullYear();

  if (startYear === endYear) {
    return {
      isValid: true,
      level: "success",
      message: "时间范围符合同期比分析要求",
    };
  } else {
    return {
      isValid: false,
      level: "warning",
      message: "同期比分析建议选择同一年份内的时间范围，以确保分析结果的准确性",
      suggestion: "建议调整时间范围至同一年份内，或关闭同期比功能",
    };
  }
}

/**
 * 验证时间单位是否有效
 * @param unit 时间单位
 * @returns 是否有效
 */
export function validateTimeUnit(unit: string): unit is TimeUnit {
  return ["year", "month", "day"].includes(unit);
}

// ============================================================================
// 综合验证函数
// ============================================================================

/**
 * 验证完整的时间选择状态
 * @param state 时间选择状态
 * @returns 验证结果
 */
export function validateTimeSelectionState(
  state: TimeSelectionState
): ValidationResult {
  // 验证时间单位
  if (!validateTimeUnit(state.timeUnit)) {
    return {
      isValid: false,
      level: "error",
      message: `无效的时间单位: ${state.timeUnit}`,
      suggestion: "请选择有效的时间单位（年、月、日）",
    };
  }

  // 验证时间范围
  const timeRangeValidation = validateTimeRange(state.timeRange);
  if (!timeRangeValidation.isValid) {
    return timeRangeValidation;
  }

  // 验证同期比设置
  const comparisonValidation = validateComparisonRange(
    state.timeRange,
    state.comparisonEnabled
  );
  if (!comparisonValidation.isValid && comparisonValidation.level === "error") {
    return comparisonValidation;
  }

  // 如果同期比验证有警告，返回警告信息
  if (comparisonValidation.level === "warning") {
    return comparisonValidation;
  }

  // 所有验证通过
  return {
    isValid: true,
    level: "success",
    message: "时间选择配置正确",
  };
}

// ============================================================================
// 数据清理和标准化函数
// ============================================================================

/**
 * 清理和标准化时间范围数据
 * @param timeRange 原始时间范围
 * @returns 清理后的时间范围
 */
export function sanitizeTimeRange(
  timeRange: TimeRange | null
): TimeRange | null {
  if (!timeRange) {
    return null;
  }

  const { startDate, endDate, unit } = timeRange;

  // 清理日期数据
  const cleanStartDate = isValidDate(startDate) ? startDate : null;
  const cleanEndDate = isValidDate(endDate) ? endDate : null;

  // 验证时间单位
  const cleanUnit = validateTimeUnit(unit) ? unit : "day";

  // 如果开始日期晚于结束日期，交换它们
  if (cleanStartDate && cleanEndDate && cleanStartDate > cleanEndDate) {
    return {
      startDate: cleanEndDate,
      endDate: cleanStartDate,
      unit: cleanUnit,
    };
  }

  return {
    startDate: cleanStartDate,
    endDate: cleanEndDate,
    unit: cleanUnit,
  };
}

/**
 * 清理和标准化时间选择状态
 * @param state 原始状态
 * @returns 清理后的状态
 */
export function sanitizeTimeSelectionState(
  state: Partial<TimeSelectionState>
): TimeSelectionState {
  const cleanTimeRange = sanitizeTimeRange(state.timeRange || null);
  const cleanTimeUnit = validateTimeUnit(state.timeUnit || "")
    ? state.timeUnit!
    : "day";

  const cleanState: TimeSelectionState = {
    quickSelection: state.quickSelection || null,
    timeUnit: cleanTimeUnit,
    timeRange: cleanTimeRange,
    comparisonEnabled: Boolean(state.comparisonEnabled),
    statisticsMode: state.statisticsMode || "total",
    validation: state.validation || {
      isValid: true,
      level: "success",
      message: "",
    },
  };

  // 重新验证清理后的状态
  cleanState.validation = validateTimeSelectionState(cleanState);

  return cleanState;
}

// ============================================================================
// 错误处理工具
// ============================================================================

/**
 * 创建时间选择异常
 * @param type 错误类型
 * @param message 错误消息
 * @param context 错误上下文
 * @param recoverySuggestion 恢复建议
 * @returns 时间选择异常对象
 */
export function createTimeSelectionException(
  type: TimeSelectionError,
  message: string,
  context?: Record<string, any>,
  recoverySuggestion?: string
): TimeSelectionException {
  return {
    type,
    message,
    context,
    timestamp: new Date(),
    recoverySuggestion,
  };
}

/**
 * 处理时间选择错误
 * @param error 错误对象
 * @returns 用户友好的错误信息
 */
export function handleTimeSelectionError(error: any): ValidationResult {
  if (error instanceof Error) {
    return {
      isValid: false,
      level: "error",
      message: `系统错误: ${error.message}`,
      suggestion: "请刷新页面重试，如问题持续存在请联系技术支持",
    };
  }

  if (typeof error === "object" && error.type) {
    const exception = error as TimeSelectionException;
    return {
      isValid: false,
      level: "error",
      message: exception.message,
      suggestion: exception.recoverySuggestion,
    };
  }

  return {
    isValid: false,
    level: "error",
    message: "未知错误",
    suggestion: "请刷新页面重试",
  };
}

// ============================================================================
// 类型守卫函数
// ============================================================================

/**
 * 检查对象是否为有效的时间范围
 * @param obj 要检查的对象
 * @returns 类型守卫结果
 */
export function isTimeRange(obj: any): obj is TimeRange {
  return (
    obj &&
    typeof obj === "object" &&
    (obj.startDate === null || obj.startDate instanceof Date) &&
    (obj.endDate === null || obj.endDate instanceof Date) &&
    validateTimeUnit(obj.unit)
  );
}

/**
 * 检查对象是否为有效的时间选择状态
 * @param obj 要检查的对象
 * @returns 类型守卫结果
 */
export function isTimeSelectionState(obj: any): obj is TimeSelectionState {
  return (
    obj &&
    typeof obj === "object" &&
    (obj.quickSelection === null || typeof obj.quickSelection === "string") &&
    validateTimeUnit(obj.timeUnit) &&
    (obj.timeRange === null || isTimeRange(obj.timeRange)) &&
    typeof obj.comparisonEnabled === "boolean" &&
    ["total", "yearly", "monthly", "daily"].includes(obj.statisticsMode) &&
    obj.validation &&
    typeof obj.validation.isValid === "boolean"
  );
}

// All functions are already exported individually above
