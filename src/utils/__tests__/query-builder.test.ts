/**
 * 查询构建器单元测试
 *
 * 测试 QueryBuilder 类的各种查询构建功能
 */

import { describe, it, expect, beforeEach } from "vitest";
import { QueryBuilder, queryBuilder } from "../query-builder";
import type { QueryParams } from "../../types/time-selection";

describe("QueryBuilder", () => {
  let builder: QueryBuilder;

  beforeEach(() => {
    builder = new QueryBuilder();
  });

  describe("buildTimeCondition", () => {
    it("should build year time condition", () => {
      const params: QueryParams = {
        timeUnit: "year",
        dbTimeField: "UPD",
        queryStrategy: "year_range",
        enableComparison: false,
        startDate: "2023",
        endDate: "2024",
      };

      const condition = builder.buildTimeCondition(params);

      expect(condition).toBe("UPD >= '2023-01-01' AND UPD <= '2024-12-31'");
    });

    it("should build month time condition", () => {
      const params: QueryParams = {
        timeUnit: "month",
        dbTimeField: "UPD",
        queryStrategy: "month_range",
        enableComparison: false,
        startDate: "2024-01",
        endDate: "2024-03",
      };

      const condition = builder.buildTimeCondition(params);

      expect(condition).toBe("UPD >= '2024-01-01' AND UPD <= '2024-03-31'");
    });

    it("should build day time condition", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };

      const condition = builder.buildTimeCondition(params);

      expect(condition).toBe("UPD >= '2024-01-01' AND UPD <= '2024-01-31'");
    });

    it("should handle February correctly", () => {
      const params: QueryParams = {
        timeUnit: "month",
        dbTimeField: "UPD",
        queryStrategy: "month_range",
        enableComparison: false,
        startDate: "2024-02",
        endDate: "2024-02",
      };

      const condition = builder.buildTimeCondition(params);

      expect(condition).toBe("UPD >= '2024-02-01' AND UPD <= '2024-02-29'");
    });

    it("should handle leap year February", () => {
      const params: QueryParams = {
        timeUnit: "month",
        dbTimeField: "UPD",
        queryStrategy: "month_range",
        enableComparison: false,
        startDate: "2023-02",
        endDate: "2023-02",
      };

      const condition = builder.buildTimeCondition(params);

      expect(condition).toBe("UPD >= '2023-02-01' AND UPD <= '2023-02-28'");
    });

    it("should return empty string when no date range", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
      };

      const condition = builder.buildTimeCondition(params);

      expect(condition).toBe("");
    });
  });

  describe("buildGroupByClause", () => {
    it("should build group by clause for year", () => {
      const params: QueryParams = {
        timeUnit: "year",
        dbTimeField: "UPD",
        queryStrategy: "year_range",
        enableComparison: false,
        groupBy: "year",
      };

      const clause = builder.buildGroupByClause(params);

      expect(clause).toBe("GROUP BY YEAR(UPD)");
    });

    it("should build group by clause for month", () => {
      const params: QueryParams = {
        timeUnit: "month",
        dbTimeField: "UPD",
        queryStrategy: "month_range",
        enableComparison: false,
        groupBy: "month",
      };

      const clause = builder.buildGroupByClause(params);

      expect(clause).toBe("GROUP BY DATE_FORMAT(UPD, '%Y-%m')");
    });

    it("should build group by clause for day", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        groupBy: "day",
      };

      const clause = builder.buildGroupByClause(params);

      expect(clause).toBe("GROUP BY DATE(UPD)");
    });

    it("should return empty string when no groupBy", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
      };

      const clause = builder.buildGroupByClause(params);

      expect(clause).toBe("");
    });
  });

  describe("buildQuery", () => {
    it("should build complete query with grouping", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        groupBy: "month",
      };

      const result = builder.buildQuery(params);

      expect(result.sql).toContain(
        "SELECT DATE_FORMAT(UPD, '%Y-%m') as time_period, COUNT(*) as certificate_count"
      );
      expect(result.sql).toContain("FROM certificate_table");
      expect(result.sql).toContain(
        "WHERE UPD >= '2024-01-01' AND UPD <= '2024-12-31'"
      );
      expect(result.sql).toContain("GROUP BY DATE_FORMAT(UPD, '%Y-%m')");
      expect(result.sql).toContain("ORDER BY time_period");
      expect(result.timeCondition).toBe(
        "UPD >= '2024-01-01' AND UPD <= '2024-12-31'"
      );
    });

    it("should build total count query without grouping", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };

      const result = builder.buildQuery(params);

      expect(result.sql).toContain("SELECT COUNT(*) as total_count");
      expect(result.sql).toContain("FROM certificate_table");
      expect(result.sql).toContain(
        "WHERE UPD >= '2024-01-01' AND UPD <= '2024-12-31'"
      );
      expect(result.sql).not.toContain("GROUP BY");
      expect(result.sql).not.toContain("ORDER BY");
    });

    it("should build query with custom table name", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
      };

      const result = builder.buildQuery(params, { tableName: "custom_table" });

      expect(result.sql).toContain("FROM custom_table");
    });

    it("should build query with additional conditions", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };

      const result = builder.buildQuery(params, {
        additionalConditions: ["company_name = 'AUDI'", "status = 'active'"],
      });

      expect(result.sql).toContain(
        "WHERE UPD >= '2024-01-01' AND UPD <= '2024-12-31' AND company_name = 'AUDI' AND status = 'active'"
      );
    });

    it("should build query with limit and offset", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
      };

      const result = builder.buildQuery(params, { limit: 10, offset: 20 });

      expect(result.sql).toContain("LIMIT 20, 10");
    });

    it("should build query with limit only", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
      };

      const result = builder.buildQuery(params, { limit: 10 });

      expect(result.sql).toContain("LIMIT 10");
    });

    it("should include all parameters in result", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: true,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        groupBy: "month",
        quickSelectionKey: "thisYear",
      };

      const result = builder.buildQuery(params);

      expect(result.parameters).toEqual({
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: true,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        groupBy: "month",
        quickSelectionKey: "thisYear",
      });
    });
  });

  describe("buildComparisonQuery", () => {
    it("should build comparison query", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: true,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        groupBy: "month",
      };

      const result = builder.buildComparisonQuery(params);

      expect(result.sql).toContain("WITH current_period AS");
      expect(result.sql).toContain("comparison_period AS");
      expect(result.sql).toContain("current_count");
      expect(result.sql).toContain("comparison_count");
      expect(result.sql).toContain("growth_rate");
      expect(result.sql).toContain("FULL OUTER JOIN");
    });

    it("should throw error when comparison not enabled", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };

      expect(() => builder.buildComparisonQuery(params)).toThrow(
        "Comparison query requires enableComparison=true and valid date range"
      );
    });

    it("should throw error when no date range", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: true,
      };

      expect(() => builder.buildComparisonQuery(params)).toThrow(
        "Comparison query requires enableComparison=true and valid date range"
      );
    });
  });

  describe("validateQueryParams", () => {
    it("should validate valid params", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };

      const result = builder.validateQueryParams(params);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing required fields", () => {
      const params: QueryParams = {
        timeUnit: "" as any,
        dbTimeField: "" as any,
        queryStrategy: "" as any,
        enableComparison: false,
      };

      const result = builder.validateQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("timeUnit is required");
      expect(result.errors).toContain("dbTimeField is required");
      expect(result.errors).toContain("queryStrategy is required");
    });

    it("should detect invalid date range", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        startDate: "2024-12-31",
        endDate: "2024-01-01",
      };

      const result = builder.validateQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("startDate cannot be after endDate");
    });

    it("should detect comparison without date range", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: true,
      };

      const result = builder.validateQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Comparison mode requires valid date range"
      );
    });
  });

  describe("getQueryExample", () => {
    it("should get thisYear example", () => {
      const result = builder.getQueryExample("thisYear");
      const currentYear = new Date().getFullYear();

      expect(result.parameters.startDate).toBe(`${currentYear}-01-01`);
      expect(result.parameters.endDate).toBe(`${currentYear}-12-31`);
      expect(result.parameters.groupBy).toBe("month");
    });

    it("should get recent2years example", () => {
      const result = builder.getQueryExample("recent2years");
      const currentYear = new Date().getFullYear();

      expect(result.parameters.startDate).toBe(`${currentYear - 2}-01-01`);
      expect(result.parameters.endDate).toBe(`${currentYear}-12-31`);
      expect(result.parameters.groupBy).toBe("year");
    });

    it("should get historical example", () => {
      const result = builder.getQueryExample("historical");

      expect(result.parameters.startDate).toBeUndefined();
      expect(result.parameters.endDate).toBeUndefined();
      expect(result.parameters.groupBy).toBeUndefined();
    });

    it("should throw error for unknown scenario", () => {
      expect(() => builder.getQueryExample("unknown" as any)).toThrow(
        "Unknown scenario: unknown"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle month with 30 days", () => {
      const params: QueryParams = {
        timeUnit: "month",
        dbTimeField: "UPD",
        queryStrategy: "month_range",
        enableComparison: false,
        startDate: "2024-04",
        endDate: "2024-04",
      };

      const condition = builder.buildTimeCondition(params);

      expect(condition).toBe("UPD >= '2024-04-01' AND UPD <= '2024-04-30'");
    });

    it("should handle month with 31 days", () => {
      const params: QueryParams = {
        timeUnit: "month",
        dbTimeField: "UPD",
        queryStrategy: "month_range",
        enableComparison: false,
        startDate: "2024-01",
        endDate: "2024-01",
      };

      const condition = builder.buildTimeCondition(params);

      expect(condition).toBe("UPD >= '2024-01-01' AND UPD <= '2024-01-31'");
    });

    it("should handle query without any conditions", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
      };

      const result = builder.buildQuery(params);

      expect(result.sql).not.toContain("WHERE");
      expect(result.timeCondition).toBe("");
    });

    it("should handle query with only additional conditions", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
      };

      const result = builder.buildQuery(params, {
        additionalConditions: ["company_name = 'AUDI'"],
      });

      expect(result.sql).toContain("WHERE company_name = 'AUDI'");
    });
  });

  describe("exported functions", () => {
    it("should export convenience functions", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      };

      // Test exported functions work
      expect(typeof queryBuilder).toBe("object");
      expect(typeof queryBuilder.buildQuery).toBe("function");

      const result = queryBuilder.buildQuery(params);
      expect(result.sql).toContain("SELECT COUNT(*) as total_count");
    });
  });
});
