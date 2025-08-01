/**
 * 查询构建器 (QueryBuilder)
 *
 * 实现基于 UPD 字段的统一查询条件构建
 * 创建不同时间单位的查询范围构建逻辑
 * 实现分组查询子句的动态构建
 * 添加完整 SQL 查询的构建和优化
 *
 * 需求: 2.2, 2.3, 2.4, 2.7
 */

import type { QueryParams, TimeUnit } from "../types/time-selection";
import { getTimeUnitConfig } from "../config/time-selection";

/**
 * SQL 查询构建结果接口
 */
export interface QueryBuildResult {
  /** 完整的 SQL 查询语句 */
  sql: string;
  /** 查询参数 */
  parameters: Record<string, any>;
  /** 时间条件子句 */
  timeCondition: string;
  /** 分组子句 */
  groupByClause?: string;
  /** 排序子句 */
  orderByClause?: string;
}

/**
 * 查询构建选项接口
 */
export interface QueryBuildOptions {
  /** 表名 */
  tableName?: string;
  /** 额外的 WHERE 条件 */
  additionalConditions?: string[];
  /** 是否包含计数查询 */
  includeCount?: boolean;
  /** 限制结果数量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
}

/**
 * 查询构建器类
 * 负责将查询参数构建为完整的 SQL 查询
 */
export class QueryBuilder {
  private readonly defaultTableName = "certificate_table";

  /**
   * 构建完整的查询
   * @param params 查询参数
   * @param options 构建选项
   * @returns 查询构建结果
   */
  buildQuery(
    params: QueryParams,
    options: QueryBuildOptions = {}
  ): QueryBuildResult {
    const {
      tableName = this.defaultTableName,
      additionalConditions = [],
      includeCount = true,
      limit,
      offset,
    } = options;

    // 构建 SELECT 子句
    const selectClause = this.buildSelectClause(params, includeCount);

    // 构建 FROM 子句
    const fromClause = `FROM ${tableName}`;

    // 构建 WHERE 子句
    const whereConditions = this.buildWhereConditions(
      params,
      additionalConditions
    );
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // 构建 GROUP BY 子句
    const groupByClause = this.buildGroupByClause(params);

    // 构建 ORDER BY 子句
    const orderByClause = this.buildOrderByClause(params);

    // 构建 LIMIT 子句
    const limitClause = this.buildLimitClause(limit, offset);

    // 组装完整 SQL
    const sqlParts = [
      selectClause,
      fromClause,
      whereClause,
      groupByClause,
      orderByClause,
      limitClause,
    ].filter(Boolean);

    const sql = sqlParts.join(" ");

    // 构建参数
    const parameters = this.buildParameters(params);

    return {
      sql,
      parameters,
      timeCondition: this.buildTimeCondition(params),
      groupByClause: groupByClause || undefined,
      orderByClause: orderByClause || undefined,
    };
  }

  /**
   * 构建时间条件查询
   * 统一使用UPD字段，根据时间单位构建不同的查询范围
   * @param params 查询参数
   * @returns 时间条件字符串
   */
  buildTimeCondition(params: QueryParams): string {
    if (!params.startDate || !params.endDate) {
      return "";
    }

    const { timeUnit, startDate, endDate } = params;

    switch (timeUnit) {
      case "year":
        // 查询整年数据，使用年份范围
        // 例：查询2023-2024年 → UPD >= '2023-01-01' AND UPD <= '2024-12-31'
        return `UPD >= '${startDate}-01-01' AND UPD <= '${endDate}-12-31'`;

      case "month":
        // 查询月份数据，使用月份范围
        // 例：查询2024年1-3月 → UPD >= '2024-01-01' AND UPD <= '2024-03-31'
        const startMonthEnd = this.getLastDayOfMonth(startDate);
        const endMonthEnd = this.getLastDayOfMonth(endDate);
        return `UPD >= '${startDate}-01' AND UPD <= '${endMonthEnd}'`;

      case "day":
        // 查询日期数据，使用精确日期范围
        return `UPD >= '${startDate}' AND UPD <= '${endDate}'`;

      default:
        return `UPD >= '${startDate}' AND UPD <= '${endDate}'`;
    }
  }

  /**
   * 构建分组查询子句
   * @param params 查询参数
   * @returns 分组子句
   */
  buildGroupByClause(params: QueryParams): string {
    if (!params.groupBy) {
      return "";
    }

    const groupExpression = this.getGroupExpression(params.groupBy);
    return `GROUP BY ${groupExpression}`;
  }

  /**
   * 根据分组方式获取分组表达式
   * @param groupBy 分组方式
   * @returns 分组表达式
   */
  private getGroupExpression(groupBy: "year" | "month" | "day"): string {
    switch (groupBy) {
      case "year":
        return "YEAR(UPD)";
      case "month":
        return "DATE_FORMAT(UPD, '%Y-%m')";
      case "day":
        return "DATE(UPD)";
      default:
        return "DATE(UPD)";
    }
  }

  /**
   * 构建 SELECT 子句
   * @param params 查询参数
   * @param includeCount 是否包含计数
   * @returns SELECT 子句
   */
  private buildSelectClause(
    params: QueryParams,
    includeCount: boolean
  ): string {
    if (params.groupBy) {
      const groupExpression = this.getGroupExpression(params.groupBy);

      let selectParts = [`${groupExpression} as time_period`];

      if (includeCount) {
        selectParts.push("COUNT(*) as certificate_count");
      }

      return `SELECT ${selectParts.join(", ")}`;
    } else {
      return includeCount ? "SELECT COUNT(*) as total_count" : "SELECT *";
    }
  }

  /**
   * 构建 WHERE 条件
   * @param params 查询参数
   * @param additionalConditions 额外条件
   * @returns WHERE 条件数组
   */
  private buildWhereConditions(
    params: QueryParams,
    additionalConditions: string[]
  ): string[] {
    const conditions: string[] = [];

    // 添加时间条件
    const timeCondition = this.buildTimeCondition(params);
    if (timeCondition) {
      conditions.push(timeCondition);
    }

    // 添加额外条件
    conditions.push(...additionalConditions);

    return conditions;
  }

  /**
   * 构建 ORDER BY 子句
   * @param params 查询参数
   * @returns ORDER BY 子句
   */
  private buildOrderByClause(params: QueryParams): string {
    if (params.groupBy) {
      return "ORDER BY time_period";
    }
    return "";
  }

  /**
   * 构建 LIMIT 子句
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns LIMIT 子句
   */
  private buildLimitClause(limit?: number, offset?: number): string {
    if (!limit) {
      return "";
    }

    if (offset) {
      return `LIMIT ${offset}, ${limit}`;
    }

    return `LIMIT ${limit}`;
  }

  /**
   * 构建查询参数
   * @param params 查询参数
   * @returns 参数对象
   */
  private buildParameters(params: QueryParams): Record<string, any> {
    const parameters: Record<string, any> = {
      timeUnit: params.timeUnit,
      dbTimeField: params.dbTimeField,
      queryStrategy: params.queryStrategy,
      enableComparison: params.enableComparison,
    };

    if (params.startDate) {
      parameters.startDate = params.startDate;
    }

    if (params.endDate) {
      parameters.endDate = params.endDate;
    }

    if (params.groupBy) {
      parameters.groupBy = params.groupBy;
    }

    if (params.quickSelectionKey) {
      parameters.quickSelectionKey = params.quickSelectionKey;
    }

    return parameters;
  }

  /**
   * 获取月份的最后一天
   * @param yearMonth 年月字符串 (YYYY-MM)
   * @returns 最后一天的日期字符串 (YYYY-MM-DD)
   */
  private getLastDayOfMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split("-");
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    return `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
  }

  /**
   * 构建同期比查询
   * @param params 查询参数
   * @param options 构建选项
   * @returns 同期比查询结果
   */
  buildComparisonQuery(
    params: QueryParams,
    options: QueryBuildOptions = {}
  ): QueryBuildResult {
    if (!params.enableComparison || !params.startDate || !params.endDate) {
      throw new Error(
        "Comparison query requires enableComparison=true and valid date range"
      );
    }

    // 计算同期比的时间范围（去年同期）
    const comparisonParams = this.calculateComparisonDateRange(params);

    // 构建主查询
    const mainQuery = this.buildQuery(params, options);

    // 构建同期比查询
    const comparisonQuery = this.buildQuery(comparisonParams, options);

    // 组合查询
    const combinedSql = `
      WITH current_period AS (
        ${mainQuery.sql}
      ),
      comparison_period AS (
        ${comparisonQuery.sql}
      )
      SELECT 
        COALESCE(c.time_period, p.time_period) as time_period,
        COALESCE(c.certificate_count, 0) as current_count,
        COALESCE(p.certificate_count, 0) as comparison_count,
        CASE 
          WHEN p.certificate_count = 0 THEN NULL
          ELSE ROUND((c.certificate_count - p.certificate_count) * 100.0 / p.certificate_count, 2)
        END as growth_rate
      FROM current_period c
      FULL OUTER JOIN comparison_period p ON c.time_period = p.time_period
      ORDER BY time_period
    `;

    return {
      sql: combinedSql,
      parameters: { ...mainQuery.parameters, ...comparisonQuery.parameters },
      timeCondition: mainQuery.timeCondition,
      groupByClause: mainQuery.groupByClause,
      orderByClause: "ORDER BY time_period",
    };
  }

  /**
   * 计算同期比的日期范围
   * @param params 原始查询参数
   * @returns 同期比查询参数
   */
  private calculateComparisonDateRange(params: QueryParams): QueryParams {
    if (!params.startDate || !params.endDate) {
      throw new Error("Date range is required for comparison calculation");
    }

    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);

    // 计算去年同期
    const comparisonStartDate = new Date(startDate);
    comparisonStartDate.setFullYear(startDate.getFullYear() - 1);

    const comparisonEndDate = new Date(endDate);
    comparisonEndDate.setFullYear(endDate.getFullYear() - 1);

    return {
      ...params,
      startDate: this.formatDateForComparison(
        comparisonStartDate,
        params.timeUnit
      ),
      endDate: this.formatDateForComparison(comparisonEndDate, params.timeUnit),
    };
  }

  /**
   * 格式化同期比日期
   * @param date 日期对象
   * @param timeUnit 时间单位
   * @returns 格式化后的日期字符串
   */
  private formatDateForComparison(date: Date, timeUnit: TimeUnit): string {
    switch (timeUnit) {
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
   * 验证查询参数
   * @param params 查询参数
   * @returns 验证结果
   */
  validateQueryParams(params: QueryParams): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 验证必需字段
    if (!params.timeUnit) {
      errors.push("timeUnit is required");
    }

    if (!params.dbTimeField) {
      errors.push("dbTimeField is required");
    }

    if (!params.queryStrategy) {
      errors.push("queryStrategy is required");
    }

    // 验证时间范围
    if (params.startDate && params.endDate) {
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      if (startDate > endDate) {
        errors.push("startDate cannot be after endDate");
      }
    }

    // 验证同期比设置
    if (params.enableComparison && (!params.startDate || !params.endDate)) {
      errors.push("Comparison mode requires valid date range");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取查询示例
   * @param scenario 查询场景
   * @returns 查询示例
   */
  getQueryExample(
    scenario: "thisYear" | "recent2years" | "historical"
  ): QueryBuildResult {
    const currentYear = new Date().getFullYear();

    switch (scenario) {
      case "thisYear":
        return this.buildQuery({
          timeUnit: "day",
          dbTimeField: "UPD",
          queryStrategy: "date_range",
          enableComparison: false,
          startDate: `${currentYear}-01-01`,
          endDate: `${currentYear}-12-31`,
          groupBy: "month",
        });

      case "recent2years":
        return this.buildQuery({
          timeUnit: "day",
          dbTimeField: "UPD",
          queryStrategy: "date_range",
          enableComparison: false,
          startDate: `${currentYear - 2}-01-01`,
          endDate: `${currentYear}-12-31`,
          groupBy: "year",
        });

      case "historical":
        return this.buildQuery({
          timeUnit: "day",
          dbTimeField: "UPD",
          queryStrategy: "date_range",
          enableComparison: false,
        });

      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }
  }
}

/**
 * 默认查询构建器实例
 */
export const queryBuilder = new QueryBuilder();

/**
 * 导出便捷函数
 */
export const buildQuery = (params: QueryParams, options?: QueryBuildOptions) =>
  queryBuilder.buildQuery(params, options);

export const buildTimeCondition = (params: QueryParams) =>
  queryBuilder.buildTimeCondition(params);

export const buildGroupByClause = (params: QueryParams) =>
  queryBuilder.buildGroupByClause(params);

export const buildComparisonQuery = (
  params: QueryParams,
  options?: QueryBuildOptions
) => queryBuilder.buildComparisonQuery(params, options);

export const validateQueryParams = (params: QueryParams) =>
  queryBuilder.validateQueryParams(params);

export const getQueryExample = (
  scenario: "thisYear" | "recent2years" | "historical"
) => queryBuilder.getQueryExample(scenario);
