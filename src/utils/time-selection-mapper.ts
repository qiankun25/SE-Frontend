/**
 * 时间选择参数映射工具
 *
 * 实现TimeSelectionState到QueryParams的映射逻辑
 * 基于统一使用UPD字段的技术决策
 */

import type {
  TimeSelectionState,
  QueryParams,
  TimeUnit,
} from "../types/time-selection";
import { getTimeUnitConfig } from "../config/time-selection";

// ============================================================================
// 日期格式化工具函数
// ============================================================================

/**
 * 根据时间单位格式化日期
 * @param date 日期对象
 * @param unit 时间单位
 * @returns 格式化后的日期字符串
 */
function formatDateForUnit(date: Date, unit: TimeUnit): string {
  switch (unit) {
    case "year":
      return date.getFullYear().toString();
    case "month":
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    case "day":
      return date.toISOString().split("T")[0]; // YYYY-MM-DD格式
    default:
      return date.toISOString().split("T")[0];
  }
}

/**
 * 获取月份的最后一天
 * @param yearMonth 年月字符串 (YYYY-MM)
 * @returns 该月最后一天的日期字符串 (YYYY-MM-DD)
 */
function getLastDayOfMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  return `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
}

// ============================================================================
// 查询条件构建工具
// ============================================================================

/**
 * 构建时间条件查询字符串
 * 统一使用UPD字段，根据时间单位构建不同的查询范围
 * @param timeUnit 时间单位
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns SQL查询条件字符串
 */
export function buildTimeCondition(
  timeUnit: TimeUnit,
  startDate: Date,
  endDate: Date
): string {
  const start = formatDateForUnit(startDate, timeUnit);
  const end = formatDateForUnit(endDate, timeUnit);

  switch (timeUnit) {
    case "year":
      // 查询整年数据，使用年份范围
      // 例：查询2023-2024年 → UPD >= '2023-01-01' AND UPD <= '2024-12-31'
      return `UPD >= '${start}-01-01' AND UPD <= '${end}-12-31'`;

    case "month":
      // 查询月份数据，使用月份范围
      // 例：查询2024年1-3月 → UPD >= '2024-01-01' AND UPD <= '2024-03-31'
      const endMonth = getLastDayOfMonth(end);
      return `UPD >= '${start}-01' AND UPD <= '${endMonth}'`;

    case "day":
      // 查询日期数据，使用精确日期范围
      return `UPD >= '${start}' AND UPD <= '${end}'`;

    default:
      return `UPD >= '${start}' AND UPD <= '${end}'`;
  }
}

/**
 * 构建分组查询子句
 * @param timeUnit 时间单位
 * @returns SQL分组表达式
 */
export function buildGroupByClause(timeUnit: TimeUnit): string {
  const unitConfig = getTimeUnitConfig(timeUnit);
  return unitConfig ? unitConfig.groupByExpression : "DATE(UPD)";
}

// ============================================================================
// 参数映射器类
// ============================================================================

/**
 * 参数映射器类
 * 负责将时间选择状态转换为查询参数
 */
export class ParameterMapper {
  /**
   * 将时间选择状态映射为查询参数
   * @param state 时间选择状态
   * @returns 查询参数
   */
  mapToQueryParams(state: TimeSelectionState): QueryParams {
    const timeUnitConfig = getTimeUnitConfig(state.timeUnit);

    const params: QueryParams = {
      timeUnit: state.timeUnit,
      dbTimeField: "UPD", // 统一使用UPD字段
      queryStrategy: timeUnitConfig?.queryStrategy || "date_range",
      enableComparison: state.comparisonEnabled,
    };

    // 映射时间范围
    if (
      state.timeRange &&
      state.timeRange.startDate &&
      state.timeRange.endDate
    ) {
      params.startDate = formatDateForUnit(
        state.timeRange.startDate,
        state.timeUnit
      );
      params.endDate = formatDateForUnit(
        state.timeRange.endDate,
        state.timeUnit
      );
    }

    // 映射统计模式
    if (state.statisticsMode !== "total") {
      const groupByMap: Record<string, "year" | "month" | "day"> = {
        yearly: "year",
        monthly: "month",
        daily: "day",
      };

      params.groupBy = groupByMap[state.statisticsMode];
      params.groupByExpression = timeUnitConfig?.groupByExpression;
    }

    // 映射快捷选择信息
    if (state.quickSelection) {
      params.quickSelectionKey = state.quickSelection;
    }

    return params;
  }

  /**
   * 构建完整的查询SQL示例
   * @param params 查询参数
   * @returns SQL查询字符串
   */
  buildQuery(params: QueryParams): string {
    let sql = "SELECT ";

    // 根据统计模式构建SELECT子句
    if (params.groupBy) {
      const groupExpr = buildGroupByClause(params.timeUnit);
      sql += `${groupExpr} as time_period, COUNT(*) as certificate_count `;
    } else {
      sql += "COUNT(*) as total_count ";
    }

    sql += "FROM certificate_table WHERE ";

    // 添加时间条件
    if (params.startDate && params.endDate) {
      const startDate = this.parseDate(params.startDate, params.timeUnit);
      const endDate = this.parseDate(params.endDate, params.timeUnit);
      sql += buildTimeCondition(params.timeUnit, startDate, endDate);
    }

    // 添加分组子句
    if (params.groupBy) {
      sql += ` GROUP BY ${buildGroupByClause(params.timeUnit)}`;
      sql += ` ORDER BY time_period`;
    }

    return sql;
  }

  /**
   * 解析日期字符串为Date对象
   * @param dateStr 日期字符串
   * @param unit 时间单位
   * @returns Date对象
   */
  private parseDate(dateStr: string, unit: TimeUnit): Date {
    switch (unit) {
      case "year":
        return new Date(parseInt(dateStr), 0, 1);
      case "month":
        const [year, month] = dateStr.split("-");
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      case "day":
        return new Date(dateStr);
      default:
        return new Date(dateStr);
    }
  }
}

// ============================================================================
// 查询构建器类
// ============================================================================

/**
 * 查询构建器类
 * 专门用于构建数据库查询
 */
export class QueryBuilder {
  private mapper: ParameterMapper;

  constructor() {
    this.mapper = new ParameterMapper();
  }

  /**
   * 根据时间选择状态构建查询参数
   * @param state 时间选择状态
   * @returns 查询参数
   */
  buildQueryParams(state: TimeSelectionState): QueryParams {
    return this.mapper.mapToQueryParams(state);
  }

  /**
   * 构建API请求参数
   * @param state 时间选择状态
   * @returns API请求参数对象
   */
  buildApiParams(state: TimeSelectionState): Record<string, any> {
    const queryParams = this.buildQueryParams(state);

    const apiParams: Record<string, any> = {
      timeUnit: queryParams.timeUnit,
      enableComparison: queryParams.enableComparison,
    };

    // 添加时间范围参数
    if (queryParams.startDate && queryParams.endDate) {
      apiParams.startDate = queryParams.startDate;
      apiParams.endDate = queryParams.endDate;
    }

    // 添加分组参数
    if (queryParams.groupBy) {
      apiParams.groupBy = queryParams.groupBy;
    }

    // 添加快捷选择标识
    if (queryParams.quickSelectionKey) {
      apiParams.quickSelection = queryParams.quickSelectionKey;
    }

    return apiParams;
  }

  /**
   * 构建用于显示的查询描述
   * @param state 时间选择状态
   * @returns 查询描述字符串
   */
  buildQueryDescription(state: TimeSelectionState): string {
    const parts: string[] = [];

    // 时间范围描述
    if (
      state.timeRange &&
      state.timeRange.startDate &&
      state.timeRange.endDate
    ) {
      const startStr = formatDateForUnit(
        state.timeRange.startDate,
        state.timeUnit
      );
      const endStr = formatDateForUnit(state.timeRange.endDate, state.timeUnit);

      switch (state.timeUnit) {
        case "year":
          parts.push(`${startStr}年至${endStr}年`);
          break;
        case "month":
          parts.push(`${startStr}至${endStr}`);
          break;
        case "day":
          parts.push(`${startStr}至${endStr}`);
          break;
      }
    } else if (state.quickSelection === "historical") {
      parts.push("历史总量");
    }

    // 统计模式描述
    const modeMap: Record<string, string> = {
      total: "总量统计",
      yearly: "按年统计",
      monthly: "按月统计",
      daily: "按日统计",
    };
    parts.push(modeMap[state.statisticsMode] || "总量统计");

    // 同期比描述
    if (state.comparisonEnabled) {
      parts.push("启用同期比");
    }

    return parts.join("，");
  }
}

// ============================================================================
// 工具函数导出
// ============================================================================

/**
 * 创建参数映射器实例
 * @returns 参数映射器实例
 */
export function createParameterMapper(): ParameterMapper {
  return new ParameterMapper();
}

/**
 * 创建查询构建器实例
 * @returns 查询构建器实例
 */
export function createQueryBuilder(): QueryBuilder {
  return new QueryBuilder();
}

/**
 * 快捷函数：直接将状态映射为查询参数
 * @param state 时间选择状态
 * @returns 查询参数
 */
export function mapStateToQueryParams(state: TimeSelectionState): QueryParams {
  const mapper = createParameterMapper();
  return mapper.mapToQueryParams(state);
}

/**
 * 快捷函数：直接将状态映射为API参数
 * @param state 时间选择状态
 * @returns API参数
 */
export function mapStateToApiParams(
  state: TimeSelectionState
): Record<string, any> {
  const builder = createQueryBuilder();
  return builder.buildApiParams(state);
}

// All classes and functions are already exported individually above
