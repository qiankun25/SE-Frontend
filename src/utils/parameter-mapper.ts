/**
 * 参数映射器 (ParameterMapper)
 *
 * 实现 TimeSelectionState 到 QueryParams 的映射逻辑
 * 配置统一使用 UPD 字段的参数映射策略
 * 添加日期格式化和查询策略配置
 *
 * 需求: 2.2, 2.3, 2.4
 */

import type {
  TimeSelectionState,
  QueryParams,
  TimeUnit,
  TimeRange,
  StatisticsMode,
} from "../types/time-selection";
import { getTimeUnitConfig } from "../config/time-selection";

/**
 * 参数映射器类
 * 负责将时间选择状态映射为API查询参数
 */
export class ParameterMapper {
  /**
   * 将 TimeSelectionState 映射为 QueryParams
   * @param state 时间选择状态
   * @returns 查询参数
   */
  mapToQueryParams(state: TimeSelectionState): QueryParams {
    const timeUnitConfig = getTimeUnitConfig(state.timeUnit);

    if (!timeUnitConfig) {
      throw new Error(`Invalid time unit: ${state.timeUnit}`);
    }

    const params: QueryParams = {
      timeUnit: state.timeUnit,
      dbTimeField: "UPD", // 统一使用UPD字段
      queryStrategy: timeUnitConfig.queryStrategy,
      enableComparison: state.comparisonEnabled,
    };

    // 添加时间范围参数
    if (state.timeRange) {
      params.startDate = this.formatDate(
        state.timeRange.startDate,
        state.timeUnit
      );
      params.endDate = this.formatDate(state.timeRange.endDate, state.timeUnit);
    }

    // 添加分组参数
    if (state.statisticsMode !== "total") {
      params.groupBy = this.mapStatisticsModeToGroupBy(state.statisticsMode);
      params.groupByExpression = timeUnitConfig.groupByExpression;
    }

    // 添加快捷选择信息
    if (state.quickSelection) {
      params.quickSelectionKey = state.quickSelection;
    }

    return params;
  }

  /**
   * 格式化日期为字符串
   * @param date 日期对象
   * @param unit 时间单位
   * @returns 格式化后的日期字符串
   */
  private formatDate(date: Date | null, unit: TimeUnit): string | undefined {
    if (!date) {
      return undefined;
    }

    switch (unit) {
      case "year":
        return date.getFullYear().toString();
      case "month":
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      case "day":
        return date.toISOString().split("T")[0];
      default:
        return date.toISOString().split("T")[0];
    }
  }

  /**
   * 将统计模式映射为分组方式
   * @param mode 统计模式
   * @returns 分组方式
   */
  private mapStatisticsModeToGroupBy(
    mode: StatisticsMode
  ): "year" | "month" | "day" | undefined {
    switch (mode) {
      case "yearly":
        return "year";
      case "monthly":
        return "month";
      case "daily":
        return "day";
      case "total":
      default:
        return undefined;
    }
  }

  /**
   * 验证映射参数的有效性
   * @param params 查询参数
   * @returns 验证结果
   */
  validateQueryParams(params: QueryParams): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 验证时间单位
    if (!["year", "month", "day"].includes(params.timeUnit)) {
      errors.push(`Invalid time unit: ${params.timeUnit}`);
    }

    // 验证日期范围
    if (params.startDate && params.endDate) {
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      if (isNaN(startDate.getTime())) {
        errors.push(`Invalid start date: ${params.startDate}`);
      }

      if (isNaN(endDate.getTime())) {
        errors.push(`Invalid end date: ${params.endDate}`);
      }

      if (startDate > endDate) {
        errors.push("Start date cannot be after end date");
      }
    }

    // 验证查询策略
    if (
      !["year_range", "month_range", "date_range"].includes(
        params.queryStrategy
      )
    ) {
      errors.push(`Invalid query strategy: ${params.queryStrategy}`);
    }

    // 验证分组方式
    if (params.groupBy && !["year", "month", "day"].includes(params.groupBy)) {
      errors.push(`Invalid group by: ${params.groupBy}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 创建默认查询参数
   * @param timeUnit 时间单位
   * @returns 默认查询参数
   */
  createDefaultQueryParams(timeUnit: TimeUnit = "day"): QueryParams {
    const timeUnitConfig = getTimeUnitConfig(timeUnit);

    if (!timeUnitConfig) {
      throw new Error(`Invalid time unit: ${timeUnit}`);
    }

    return {
      timeUnit,
      dbTimeField: "UPD",
      queryStrategy: timeUnitConfig.queryStrategy,
      enableComparison: false,
    };
  }

  /**
   * 从查询参数反向映射为时间选择状态的部分信息
   * @param params 查询参数
   * @returns 部分时间选择状态
   */
  mapFromQueryParams(params: QueryParams): Partial<TimeSelectionState> {
    const state: Partial<TimeSelectionState> = {
      timeUnit: params.timeUnit,
      comparisonEnabled: params.enableComparison,
    };

    // 映射时间范围
    if (params.startDate && params.endDate) {
      state.timeRange = {
        startDate: this.parseDate(params.startDate, params.timeUnit),
        endDate: this.parseDate(params.endDate, params.timeUnit),
        unit: params.timeUnit,
      };
    }

    // 映射统计模式
    if (params.groupBy) {
      state.statisticsMode = this.mapGroupByToStatisticsMode(params.groupBy);
    } else {
      state.statisticsMode = "total";
    }

    // 映射快捷选择
    if (params.quickSelectionKey) {
      state.quickSelection = params.quickSelectionKey;
    }

    return state;
  }

  /**
   * 解析日期字符串
   * @param dateStr 日期字符串
   * @param unit 时间单位
   * @returns 日期对象
   */
  private parseDate(dateStr: string, unit: TimeUnit): Date {
    switch (unit) {
      case "year":
        return new Date(parseInt(dateStr), 0, 1);
      case "month":
        const [year, month] = dateStr.split("-");
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      case "day":
        // 使用 dateStr + 'T00:00:00' 来避免时区问题
        return new Date(dateStr + "T00:00:00");
      default:
        return new Date(dateStr + "T00:00:00");
    }
  }

  /**
   * 将分组方式映射为统计模式
   * @param groupBy 分组方式
   * @returns 统计模式
   */
  private mapGroupByToStatisticsMode(
    groupBy: "year" | "month" | "day"
  ): StatisticsMode {
    switch (groupBy) {
      case "year":
        return "yearly";
      case "month":
        return "monthly";
      case "day":
        return "daily";
      default:
        return "total";
    }
  }

  /**
   * 获取日期格式化模式
   * @param unit 时间单位
   * @returns 格式化模式
   */
  getDateFormatPattern(unit: TimeUnit): string {
    switch (unit) {
      case "year":
        return "YYYY";
      case "month":
        return "YYYY-MM";
      case "day":
        return "YYYY-MM-DD";
      default:
        return "YYYY-MM-DD";
    }
  }

  /**
   * 检查时间范围是否跨年
   * @param timeRange 时间范围
   * @returns 是否跨年
   */
  isCrossYear(timeRange: TimeRange | null): boolean {
    if (!timeRange || !timeRange.startDate || !timeRange.endDate) {
      return false;
    }

    return (
      timeRange.startDate.getFullYear() !== timeRange.endDate.getFullYear()
    );
  }

  /**
   * 计算时间范围的天数差
   * @param timeRange 时间范围
   * @returns 天数差
   */
  calculateDaysDifference(timeRange: TimeRange | null): number {
    if (!timeRange || !timeRange.startDate || !timeRange.endDate) {
      return 0;
    }

    const timeDiff =
      timeRange.endDate.getTime() - timeRange.startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }
}

/**
 * 默认参数映射器实例
 */
export const parameterMapper = new ParameterMapper();

/**
 * 导出便捷函数
 */
export const mapToQueryParams = (state: TimeSelectionState): QueryParams =>
  parameterMapper.mapToQueryParams(state);

export const mapFromQueryParams = (
  params: QueryParams
): Partial<TimeSelectionState> => parameterMapper.mapFromQueryParams(params);

export const validateQueryParams = (params: QueryParams) =>
  parameterMapper.validateQueryParams(params);

export const createDefaultQueryParams = (timeUnit?: TimeUnit) =>
  parameterMapper.createDefaultQueryParams(timeUnit);
