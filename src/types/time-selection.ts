/**
 * 时间选择组件核心数据结构和类型定义
 *
 * 基于需求文档和设计文档创建的类型安全的时间选择相关接口
 * 支持多种时间度量单位、快捷选择、同期比验证等功能
 */

// ============================================================================
// 基础时间相关类型
// ============================================================================

/**
 * 时间单位枚举
 */
export type TimeUnit = "year" | "month" | "day";

/**
 * 统计模式枚举
 */
export type StatisticsMode = "total" | "yearly" | "monthly" | "daily";

/**
 * 查询策略枚举
 */
export type QueryStrategy = "year_range" | "month_range" | "date_range";

/**
 * 验证级别枚举
 */
export type ValidationLevel = "success" | "warning" | "error";

// ============================================================================
// 核心数据结构
// ============================================================================

/**
 * 时间范围接口
 * 定义时间选择的基本范围信息
 */
export interface TimeRange {
  /** 开始日期 */
  startDate: Date | null;
  /** 结束日期 */
  endDate: Date | null;
  /** 时间单位 */
  unit: TimeUnit;
}

/**
 * 时间选择状态接口
 * 管理整个时间选择组件的状态
 */
export interface TimeSelectionState {
  /** 当前选中的快捷选项 */
  quickSelection: string | null;
  /** 当前选择的时间单位 */
  timeUnit: TimeUnit;
  /** 当前选择的时间范围 */
  timeRange: TimeRange | null;
  /** 是否启用同期比功能 */
  comparisonEnabled: boolean;
  /** 当前统计模式 */
  statisticsMode: StatisticsMode;
  /** 验证结果 */
  validation: ValidationResult;
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 验证是否通过 */
  isValid: boolean;
  /** 验证级别 */
  level: ValidationLevel;
  /** 验证消息 */
  message: string;
  /** 建议信息（可选） */
  suggestion?: string;
}

// ============================================================================
// 快捷选择配置
// ============================================================================

/**
 * 快捷选项接口
 */
export interface QuickOption {
  /** 选项唯一标识 */
  key: string;
  /** 显示标签 */
  label: string;
  /** 对应的时间范围，null表示不限制时间范围 */
  timeRange: TimeRange | null;
  /** 推荐的统计模式 */
  statisticsMode?: StatisticsMode;
  /** 选项描述 */
  description: string;
  /** 是否为默认选项 */
  isDefault?: boolean;
}

/**
 * 快捷选择配置
 * 预定义的常用时间选择选项
 */
export interface QuickSelectionConfig {
  /** 快捷选项列表 */
  options: QuickOption[];
  /** 默认选中的选项 */
  defaultOption?: string;
  /** 是否显示自定义选项 */
  showCustomOption: boolean;
}

// ============================================================================
// 时间单位配置
// ============================================================================

/**
 * 时间单位配置接口
 */
export interface TimeUnitConfig {
  /** 单位标识 */
  key: TimeUnit;
  /** 显示标签 */
  label: string;
  /** 数据库字段映射 - 统一使用UPD字段 */
  dbField: "UPD";
  /** 查询策略 */
  queryStrategy: QueryStrategy;
  /** SQL分组表达式 */
  groupByExpression: string;
  /** 选择器类型 */
  pickerType: "year" | "month" | "date";
  /** 默认范围（年数） */
  defaultRange: number;
  /** 最小可选范围 */
  minRange?: number;
  /** 最大可选范围 */
  maxRange?: number;
}

// ============================================================================
// 查询参数映射
// ============================================================================

/**
 * 查询参数接口
 * 用于将时间选择状态映射为API查询参数
 */
export interface QueryParams {
  // 时间相关参数
  /** 时间单位 */
  timeUnit: TimeUnit;
  /** 开始日期字符串 */
  startDate?: string;
  /** 结束日期字符串 */
  endDate?: string;

  // 数据库字段映射 - 统一使用UPD
  /** 数据库时间字段 */
  dbTimeField: "UPD";

  // 查询策略和分组
  /** 查询策略 */
  queryStrategy: QueryStrategy;
  /** SQL分组表达式 */
  groupByExpression?: string;

  // 统计模式
  /** 分组方式 */
  groupBy?: "year" | "month" | "day";

  // 同期比
  /** 是否启用同期比 */
  enableComparison: boolean;

  // 快捷选择信息
  /** 快捷选择标识 */
  quickSelectionKey?: string;
}

// ============================================================================
// 组件配置接口
// ============================================================================

/**
 * 时间选择组件配置接口
 */
export interface TimeSelectionConfig {
  /** 快捷选择配置 */
  quickSelection: QuickSelectionConfig;
  /** 时间单位配置列表 */
  timeUnits: TimeUnitConfig[];
  /** 默认时间单位 */
  defaultTimeUnit: TimeUnit;
  /** 是否显示同期比选项 */
  showComparison: boolean;
  /** 是否显示统计模式建议 */
  showStatisticsSuggestion: boolean;
  /** 验证配置 */
  validation: ValidationConfig;
}

/**
 * 验证配置接口
 */
export interface ValidationConfig {
  /** 是否启用实时验证 */
  enableRealTimeValidation: boolean;
  /** 是否显示验证消息 */
  showValidationMessages: boolean;
  /** 验证规则配置 */
  rules: ValidationRules;
}

/**
 * 验证规则接口
 */
export interface ValidationRules {
  /** 是否验证日期范围合理性 */
  validateDateRange: boolean;
  /** 是否验证同期比时间范围 */
  validateComparisonRange: boolean;
  /** 是否验证未来日期 */
  validateFutureDate: boolean;
  /** 最大允许的时间跨度（天数） */
  maxTimeSpanDays?: number;
}

// ============================================================================
// 事件相关类型
// ============================================================================

/**
 * 时间选择变更事件数据
 */
export interface TimeSelectionChangeEvent {
  /** 变更前的状态 */
  previousState: TimeSelectionState;
  /** 变更后的状态 */
  currentState: TimeSelectionState;
  /** 变更类型 */
  changeType: TimeSelectionChangeType;
  /** 触发变更的源 */
  source: TimeSelectionEventSource;
}

/**
 * 时间选择变更类型
 */
export type TimeSelectionChangeType =
  | "quick_selection"
  | "time_unit"
  | "time_range"
  | "comparison_toggle"
  | "statistics_mode"
  | "validation_update";

/**
 * 时间选择事件源
 */
export type TimeSelectionEventSource =
  | "quick_panel"
  | "unit_selector"
  | "range_picker"
  | "comparison_validator"
  | "statistics_suggester"
  | "external";

// ============================================================================
// 错误处理类型
// ============================================================================

/**
 * 时间选择错误类型枚举
 */
export enum TimeSelectionError {
  INVALID_DATE_RANGE = "INVALID_DATE_RANGE",
  START_DATE_AFTER_END_DATE = "START_DATE_AFTER_END_DATE",
  FUTURE_DATE_SELECTED = "FUTURE_DATE_SELECTED",
  COMPARISON_CROSS_YEAR = "COMPARISON_CROSS_YEAR",
  INVALID_TIME_UNIT = "INVALID_TIME_UNIT",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  VALIDATION_FAILED = "VALIDATION_FAILED",
}

/**
 * 时间选择异常接口
 */
export interface TimeSelectionException {
  /** 错误类型 */
  type: TimeSelectionError;
  /** 错误消息 */
  message: string;
  /** 错误上下文 */
  context?: Record<string, any>;
  /** 错误时间戳 */
  timestamp: Date;
  /** 恢复建议 */
  recoverySuggestion?: string;
}

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 部分时间选择状态类型
 * 用于状态的部分更新
 */
export type PartialTimeSelectionState = Partial<TimeSelectionState>;

/**
 * 时间选择状态更新函数类型
 */
export type TimeSelectionStateUpdater = (
  currentState: TimeSelectionState
) => PartialTimeSelectionState;

/**
 * 时间选择验证函数类型
 */
export type TimeSelectionValidator = (
  state: TimeSelectionState
) => ValidationResult;

/**
 * 参数映射函数类型
 */
export type ParameterMapper = (state: TimeSelectionState) => QueryParams;

// ============================================================================
// 默认配置常量
// ============================================================================

/**
 * 默认时间选择配置
 */
export const DEFAULT_TIME_SELECTION_CONFIG: TimeSelectionConfig = {
  quickSelection: {
    options: [], // 将在配置文件中定义
    showCustomOption: true,
  },
  timeUnits: [], // 将在配置文件中定义
  defaultTimeUnit: "day",
  showComparison: true,
  showStatisticsSuggestion: true,
  validation: {
    enableRealTimeValidation: true,
    showValidationMessages: true,
    rules: {
      validateDateRange: true,
      validateComparisonRange: true,
      validateFutureDate: true,
      maxTimeSpanDays: 3650, // 10年
    },
  },
};

/**
 * 默认时间选择状态
 */
export const DEFAULT_TIME_SELECTION_STATE: TimeSelectionState = {
  quickSelection: null,
  timeUnit: "day",
  timeRange: null,
  comparisonEnabled: false,
  statisticsMode: "total",
  validation: {
    isValid: true,
    level: "success",
    message: "",
  },
};
