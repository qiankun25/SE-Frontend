/**
 * 参数映射器单元测试
 *
 * 测试 ParameterMapper 类的各种映射功能
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ParameterMapper, parameterMapper } from "../parameter-mapper";
import type {
  TimeSelectionState,
  QueryParams,
} from "../../types/time-selection";
import { DEFAULT_TIME_SELECTION_STATE } from "../../types/time-selection";

describe("ParameterMapper", () => {
  let mapper: ParameterMapper;

  beforeEach(() => {
    mapper = new ParameterMapper();
  });

  describe("mapToQueryParams", () => {
    it("should map basic state to query params", () => {
      const state: TimeSelectionState = {
        ...DEFAULT_TIME_SELECTION_STATE,
        timeUnit: "day",
        timeRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
          unit: "day",
        },
        statisticsMode: "monthly",
        comparisonEnabled: false,
      };

      const params = mapper.mapToQueryParams(state);

      expect(params).toEqual({
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        groupBy: "month",
        groupByExpression: "DATE(UPD)",
      });
    });

    it("should handle year time unit", () => {
      const state: TimeSelectionState = {
        ...DEFAULT_TIME_SELECTION_STATE,
        timeUnit: "year",
        timeRange: {
          startDate: new Date("2023-01-01"),
          endDate: new Date("2024-12-31"),
          unit: "year",
        },
        statisticsMode: "yearly",
      };

      const params = mapper.mapToQueryParams(state);

      expect(params.timeUnit).toBe("year");
      expect(params.queryStrategy).toBe("year_range");
      expect(params.startDate).toBe("2023");
      expect(params.endDate).toBe("2024");
      expect(params.groupBy).toBe("year");
      expect(params.groupByExpression).toBe("YEAR(UPD)");
    });

    it("should handle month time unit", () => {
      const state: TimeSelectionState = {
        ...DEFAULT_TIME_SELECTION_STATE,
        timeUnit: "month",
        timeRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-06-30"),
          unit: "month",
        },
        statisticsMode: "monthly",
      };

      const params = mapper.mapToQueryParams(state);

      expect(params.timeUnit).toBe("month");
      expect(params.queryStrategy).toBe("month_range");
      expect(params.startDate).toBe("2024-01");
      expect(params.endDate).toBe("2024-06");
      expect(params.groupBy).toBe("month");
      expect(params.groupByExpression).toBe("DATE_FORMAT(UPD, '%Y-%m')");
    });

    it("should handle total statistics mode", () => {
      const state: TimeSelectionState = {
        ...DEFAULT_TIME_SELECTION_STATE,
        timeUnit: "day",
        statisticsMode: "total",
      };

      const params = mapper.mapToQueryParams(state);

      expect(params.groupBy).toBeUndefined();
      expect(params.groupByExpression).toBeUndefined();
    });

    it("should include quick selection key", () => {
      const state: TimeSelectionState = {
        ...DEFAULT_TIME_SELECTION_STATE,
        quickSelection: "thisYear",
      };

      const params = mapper.mapToQueryParams(state);

      expect(params.quickSelectionKey).toBe("thisYear");
    });

    it("should handle null time range", () => {
      const state: TimeSelectionState = {
        ...DEFAULT_TIME_SELECTION_STATE,
        timeRange: null,
      };

      const params = mapper.mapToQueryParams(state);

      expect(params.startDate).toBeUndefined();
      expect(params.endDate).toBeUndefined();
    });

    it("should throw error for invalid time unit", () => {
      const state: TimeSelectionState = {
        ...DEFAULT_TIME_SELECTION_STATE,
        timeUnit: "invalid" as any,
      };

      expect(() => mapper.mapToQueryParams(state)).toThrow(
        "Invalid time unit: invalid"
      );
    });
  });

  describe("mapFromQueryParams", () => {
    it("should map query params back to state", () => {
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

      const state = mapper.mapFromQueryParams(params);

      expect(state).toEqual({
        timeUnit: "day",
        comparisonEnabled: true,
        timeRange: {
          startDate: new Date("2024-01-01T00:00:00"),
          endDate: new Date("2024-12-31T00:00:00"),
          unit: "day",
        },
        statisticsMode: "monthly",
        quickSelection: "thisYear",
      });
    });

    it("should handle year params", () => {
      const params: QueryParams = {
        timeUnit: "year",
        dbTimeField: "UPD",
        queryStrategy: "year_range",
        enableComparison: false,
        startDate: "2023",
        endDate: "2024",
        groupBy: "year",
      };

      const state = mapper.mapFromQueryParams(params);

      expect(state.timeRange?.startDate).toEqual(new Date(2023, 0, 1));
      expect(state.timeRange?.endDate).toEqual(new Date(2024, 0, 1));
      expect(state.statisticsMode).toBe("yearly");
    });

    it("should handle month params", () => {
      const params: QueryParams = {
        timeUnit: "month",
        dbTimeField: "UPD",
        queryStrategy: "month_range",
        enableComparison: false,
        startDate: "2024-01",
        endDate: "2024-06",
        groupBy: "month",
      };

      const state = mapper.mapFromQueryParams(params);

      expect(state.timeRange?.startDate).toEqual(new Date(2024, 0, 1));
      expect(state.timeRange?.endDate).toEqual(new Date(2024, 5, 1));
      expect(state.statisticsMode).toBe("monthly");
    });

    it("should handle total mode without groupBy", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
      };

      const state = mapper.mapFromQueryParams(params);

      expect(state.statisticsMode).toBe("total");
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
        groupBy: "month",
      };

      const result = mapper.validateQueryParams(params);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect invalid time unit", () => {
      const params: QueryParams = {
        timeUnit: "invalid" as any,
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
      };

      const result = mapper.validateQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid time unit: invalid");
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

      const result = mapper.validateQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Start date cannot be after end date");
    });

    it("should detect invalid dates", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        startDate: "invalid-date",
        endDate: "2024-12-31",
      };

      const result = mapper.validateQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid start date: invalid-date");
    });

    it("should detect invalid query strategy", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "invalid" as any,
        enableComparison: false,
      };

      const result = mapper.validateQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid query strategy: invalid");
    });

    it("should detect invalid group by", () => {
      const params: QueryParams = {
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
        groupBy: "invalid" as any,
      };

      const result = mapper.validateQueryParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid group by: invalid");
    });
  });

  describe("createDefaultQueryParams", () => {
    it("should create default params for day unit", () => {
      const params = mapper.createDefaultQueryParams("day");

      expect(params).toEqual({
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        enableComparison: false,
      });
    });

    it("should create default params for year unit", () => {
      const params = mapper.createDefaultQueryParams("year");

      expect(params).toEqual({
        timeUnit: "year",
        dbTimeField: "UPD",
        queryStrategy: "year_range",
        enableComparison: false,
      });
    });

    it("should use day as default unit", () => {
      const params = mapper.createDefaultQueryParams();

      expect(params.timeUnit).toBe("day");
    });

    it("should throw error for invalid unit", () => {
      expect(() => mapper.createDefaultQueryParams("invalid" as any)).toThrow(
        "Invalid time unit: invalid"
      );
    });
  });

  describe("utility methods", () => {
    it("should get correct date format pattern", () => {
      expect(mapper.getDateFormatPattern("year")).toBe("YYYY");
      expect(mapper.getDateFormatPattern("month")).toBe("YYYY-MM");
      expect(mapper.getDateFormatPattern("day")).toBe("YYYY-MM-DD");
    });

    it("should detect cross year range", () => {
      const crossYearRange = {
        startDate: new Date("2023-12-01"),
        endDate: new Date("2024-01-31"),
        unit: "day" as const,
      };

      const sameYearRange = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        unit: "day" as const,
      };

      expect(mapper.isCrossYear(crossYearRange)).toBe(true);
      expect(mapper.isCrossYear(sameYearRange)).toBe(false);
      expect(mapper.isCrossYear(null)).toBe(false);
    });

    it("should calculate days difference", () => {
      const timeRange = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        unit: "day" as const,
      };

      const days = mapper.calculateDaysDifference(timeRange);
      expect(days).toBe(30);

      expect(mapper.calculateDaysDifference(null)).toBe(0);
    });
  });

  describe("exported functions", () => {
    it("should export convenience functions", () => {
      const state: TimeSelectionState = {
        ...DEFAULT_TIME_SELECTION_STATE,
        timeUnit: "day",
      };

      // Test exported functions work
      expect(typeof parameterMapper).toBe("object");
      expect(typeof parameterMapper.mapToQueryParams).toBe("function");

      const params = parameterMapper.mapToQueryParams(state);
      expect(params.timeUnit).toBe("day");
    });
  });
});
