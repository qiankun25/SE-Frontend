/**
 * 时间选择组件配置文件
 *
 * 定义快捷选项配置、时间单位配置等具体配置数据
 * 基于设计文档中的统一UPD字段策略
 */

import type {
  QuickOption,
  TimeUnitConfig,
  TimeSelectionConfig,
  TimeRange,
  TimeUnit,
} from "../types/time-selection";

// ============================================================================
// 时间计算工具函数
// ============================================================================

/**
 * 计算相对日期
 * @param amount 数量（负数表示往前推）
 * @param unit 单位
 * @returns 计算后的日期
 */
function calculateDate(
  amount: number,
  unit: "years" | "months" | "days"
): Date {
  const now = new Date();

  switch (unit) {
    case "years":
      return new Date(
        now.getFullYear() + amount,
        now.getMonth(),
        now.getDate()
      );
    case "months":
      return new Date(
        now.getFullYear(),
        now.getMonth() + amount,
        now.getDate()
      );
    case "days":
      return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
    default:
      return now;
  }
}

/**
 * 获取年份的第一天和最后一天
 * @param year 年份
 * @returns [开始日期, 结束日期]
 */
function getYearRange(year: number): [Date, Date] {
  return [
    new Date(year, 0, 1), // 1月1日
    new Date(year, 11, 31), // 12月31日
  ];
}

// ============================================================================
// 快捷选项配置
// ============================================================================

/**
 * 快捷选择选项配置
 * 基于需求文档中的常用查询场景
 */
export const QUICK_OPTIONS: QuickOption[] = [
  {
    key: "historical",
    label: "历史总量",
    timeRange: null, // 不限制时间范围
    statisticsMode: "total",
    description: "查询所有历史数据，适用于企业或品牌的总体统计",
    isDefault: false,
  },
  {
    key: "recent2years",
    label: "近两年",
    timeRange: {
      startDate: calculateDate(-2, "years"),
      endDate: new Date(),
      unit: "day",
    },
    statisticsMode: "yearly",
    description: "查询近两年数据，推荐按年度分组",
  },
  {
    key: "recent6months",
    label: "近六月",
    timeRange: {
      startDate: calculateDate(-6, "months"),
      endDate: new Date(),
      unit: "day",
    },
    statisticsMode: "monthly",
    description: "查询近六个月数据，推荐按月度分组",
  },
  {
    key: "recent3months",
    label: "近三月",
    timeRange: {
      startDate: calculateDate(-3, "months"),
      endDate: new Date(),
      unit: "day",
    },
    statisticsMode: "monthly",
    description: "查询近三个月数据，适用于短期趋势分析",
  },
  {
    key: "thisYear",
    label: "今年",
    timeRange: {
      startDate: getYearRange(new Date().getFullYear())[0],
      endDate: getYearRange(new Date().getFullYear())[1],
      unit: "day",
    },
    statisticsMode: "monthly",
    description: "查询当前年度数据",
  },
  {
    key: "lastYear",
    label: "去年",
    timeRange: {
      startDate: getYearRange(new Date().getFullYear() - 1)[0],
      endDate: getYearRange(new Date().getFullYear() - 1)[1],
      unit: "day",
    },
    statisticsMode: "monthly",
    description: "查询上一年度数据",
  },
];

// ============================================================================
// 时间单位配置
// ============================================================================

/**
 * 时间单位配置
 * 基于设计文档中统一使用UPD字段的技术决策
 */
export const TIME_UNITS: TimeUnitConfig[] = [
  {
    key: "year",
    label: "年",
    dbField: "UPD",
    queryStrategy: "year_range",
    groupByExpression: "YEAR(UPD)", // 按年分组
    pickerType: "year",
    defaultRange: 5,
    minRange: 1,
    maxRange: 10,
  },
  {
    key: "month",
    label: "月",
    dbField: "UPD",
    queryStrategy: "month_range",
    groupByExpression: "DATE_FORMAT(UPD, '%Y-%m')", // 按年月分组
    pickerType: "month",
    defaultRange: 2,
    minRange: 1,
    maxRange: 5,
  },
  {
    key: "day",
    label: "日",
    dbField: "UPD",
    queryStrategy: "date_range",
    groupByExpression: "DATE(UPD)", // 按日分组
    pickerType: "date",
    defaultRange: 1,
    minRange: 1,
    maxRange: 3,
  },
];

// ============================================================================
// 完整配置对象
// ============================================================================

/**
 * 时间选择组件完整配置
 */
export const TIME_SELECTION_CONFIG: TimeSelectionConfig = {
  quickSelection: {
    options: QUICK_OPTIONS,
    defaultOption: "thisYear", // 默认选择"今年"
    showCustomOption: true,
  },
  timeUnits: TIME_UNITS,
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

// ============================================================================
// 配置工具函数
// ============================================================================

/**
 * 根据key获取快捷选项
 * @param key 快捷选项key
 * @returns 快捷选项或undefined
 */
export function getQuickOptionByKey(key: string): QuickOption | undefined {
  return QUICK_OPTIONS.find((option) => option.key === key);
}

/**
 * 根据key获取时间单位配置
 * @param key 时间单位key
 * @returns 时间单位配置或undefined
 */
export function getTimeUnitConfig(key: TimeUnit): TimeUnitConfig | undefined {
  return TIME_UNITS.find((unit) => unit.key === key);
}

/**
 * 获取默认快捷选项
 * @returns 默认快捷选项
 */
export function getDefaultQuickOption(): QuickOption | undefined {
  return getQuickOptionByKey(
    TIME_SELECTION_CONFIG.quickSelection.defaultOption || ""
  );
}

/**
 * 验证时间单位是否有效
 * @param unit 时间单位
 * @returns 是否有效
 */
export function isValidTimeUnit(unit: string): unit is TimeUnit {
  return TIME_UNITS.some((config) => config.key === unit);
}

/**
 * 获取时间单位的显示标签
 * @param unit 时间单位
 * @returns 显示标签
 */
export function getTimeUnitLabel(unit: TimeUnit): string {
  const config = getTimeUnitConfig(unit);
  return config?.label || unit;
}

/**
 * 根据时间范围推荐统计模式
 * @param timeRange 时间范围
 * @returns 推荐的统计模式
 */
export function suggestStatisticsMode(
  timeRange: TimeRange | null
): "total" | "yearly" | "monthly" | "daily" {
  if (!timeRange || !timeRange.startDate || !timeRange.endDate) {
    return "total";
  }

  const daysDiff = Math.abs(
    (timeRange.endDate.getTime() - timeRange.startDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysDiff <= 31) {
    return "daily";
  } else if (daysDiff <= 365) {
    return "monthly";
  } else {
    return "yearly";
  }
}

// ============================================================================
// 导出配置常量
// ============================================================================

export default TIME_SELECTION_CONFIG;
