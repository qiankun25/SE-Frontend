/**
 * StatisticsModeSuggester 组件单元测试
 *
 * 测试统计模式建议器的核心功能：
 * - 基于时间范围的智能推荐逻辑
 * - 统计模式选择和变更
 * - 跨年查询的年度分组选项
 * - 推荐应用和忽略功能
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import StatisticsModeSuggester from "../StatisticsModeSuggester.vue";
import type { TimeRange, StatisticsMode } from "../../types/time-selection";

// Mock Element Plus components
vi.mock("element-plus", () => ({
  ElSelect: {
    name: "ElSelect",
    template: '<div class="el-select"><slot /></div>',
    props: ["modelValue", "placeholder"],
    emits: ["update:modelValue", "change"],
  },
  ElOption: {
    name: "ElOption",
    template: '<div class="el-option"><slot /></div>',
    props: ["label", "value"],
  },
  ElAlert: {
    name: "ElAlert",
    template: '<div class="el-alert"><slot /></div>',
    props: ["title", "description", "type", "closable", "showIcon"],
  },
  ElCheckbox: {
    name: "ElCheckbox",
    template: '<div class="el-checkbox"><slot /></div>',
    props: ["modelValue"],
    emits: ["update:modelValue", "change"],
  },
  ElButton: {
    name: "ElButton",
    template: '<button class="el-button"><slot /></button>',
    props: ["type", "size"],
  },
  ElTag: {
    name: "ElTag",
    template: '<span class="el-tag"><slot /></span>',
    props: ["type", "size"],
  },
}));

describe("StatisticsModeSuggester", () => {
  let wrapper: VueWrapper<any>;

  // 测试用的时间范围工具函数
  const createTimeRange = (
    startDaysAgo: number,
    endDaysAgo: number = 0
  ): TimeRange => {
    const now = new Date();
    const startDate = new Date(
      now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000
    );
    const endDate = new Date(now.getTime() - endDaysAgo * 24 * 60 * 60 * 1000);

    return {
      startDate,
      endDate,
      unit: "day",
    };
  };

  const createYearRange = (startYear: number, endYear: number): TimeRange => {
    return {
      startDate: new Date(startYear, 0, 1),
      endDate: new Date(endYear, 11, 31),
      unit: "year",
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基础渲染", () => {
    it("应该正确渲染组件基本结构", () => {
      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange: null,
          currentMode: "total" as StatisticsMode,
        },
      });

      expect(wrapper.find(".statistics-mode-suggester").exists()).toBe(true);
      expect(wrapper.find(".mode-selector").exists()).toBe(true);
      expect(wrapper.find(".selector-label").text()).toBe("统计模式：");
    });

    it("应该显示所有可用的统计模式选项", () => {
      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange: null,
          currentMode: "total" as StatisticsMode,
        },
      });

      const modes = wrapper.vm.availableModes;
      expect(modes).toHaveLength(4);
      expect(modes.map((m: any) => m.key)).toEqual([
        "total",
        "yearly",
        "monthly",
        "daily",
      ]);
    });
  });

  describe("智能推荐逻辑", () => {
    it("无时间范围时应该推荐总量统计", async () => {
      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange: null,
          currentMode: "monthly" as StatisticsMode,
          showSuggestion: true,
        },
      });

      await nextTick();

      const suggestion = wrapper.vm.suggestion;
      expect(suggestion).toBeTruthy();
      expect(suggestion.recommendedMode).toBe("total");
      expect(suggestion.title).toContain("总量统计");
    });

    it("一周内时间范围应该推荐按日统计", async () => {
      const timeRange = createTimeRange(7, 0); // 7天前到现在

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
          showSuggestion: true,
        },
      });

      await nextTick();

      const suggestion = wrapper.vm.suggestion;
      expect(suggestion).toBeTruthy();
      expect(suggestion.recommendedMode).toBe("daily");
      expect(suggestion.confidence).toBeGreaterThan(0.8);
    });

    it("一个月内时间范围应该推荐按日统计", async () => {
      const timeRange = createTimeRange(30, 0); // 30天前到现在

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
          showSuggestion: true,
        },
      });

      await nextTick();

      const suggestion = wrapper.vm.suggestion;
      expect(suggestion).toBeTruthy();
      expect(suggestion.recommendedMode).toBe("daily");
    });

    it("一年内时间范围应该推荐按月统计", async () => {
      const timeRange = createTimeRange(180, 0); // 180天前到现在

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
          showSuggestion: true,
        },
      });

      await nextTick();

      const suggestion = wrapper.vm.suggestion;
      expect(suggestion).toBeTruthy();
      expect(suggestion.recommendedMode).toBe("monthly");
      expect(suggestion.confidence).toBeGreaterThan(0.8);
    });

    it("跨年长期时间范围应该推荐按年统计", async () => {
      const timeRange = createYearRange(2022, 2024); // 2022-2024年

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
          showSuggestion: true,
        },
      });

      await nextTick();

      const suggestion = wrapper.vm.suggestion;
      expect(suggestion).toBeTruthy();
      expect(suggestion.recommendedMode).toBe("yearly");
      expect(suggestion.reasons).toContain("跨年查询");
    });

    it("当前模式已是推荐模式时不应显示推荐", async () => {
      const timeRange = createTimeRange(7, 0); // 7天前到现在

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "daily" as StatisticsMode, // 已经是推荐的模式
          showSuggestion: true,
        },
      });

      await nextTick();

      const suggestion = wrapper.vm.suggestion;
      expect(suggestion).toBeNull();
    });
  });

  describe("跨年分组功能", () => {
    it("跨年时间范围应该显示年度分组选项", async () => {
      const timeRange = createYearRange(2023, 2024); // 跨年范围

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "monthly" as StatisticsMode,
        },
      });

      await nextTick();

      expect(wrapper.vm.showCrossYearGrouping).toBe(true);
      expect(wrapper.find(".cross-year-grouping").exists()).toBe(true);
    });

    it("同年时间范围不应显示年度分组选项", async () => {
      const timeRange = {
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
        unit: "day" as const,
      };

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "monthly" as StatisticsMode,
        },
      });

      await nextTick();

      expect(wrapper.vm.showCrossYearGrouping).toBe(false);
      expect(wrapper.find(".cross-year-grouping").exists()).toBe(false);
    });

    it("总量统计模式不应显示年度分组选项", async () => {
      const timeRange = createYearRange(2023, 2024); // 跨年范围

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
        },
      });

      await nextTick();

      expect(wrapper.vm.showCrossYearGrouping).toBe(false);
    });
  });

  describe("统计粒度信息", () => {
    it("应该显示正确的粒度信息", async () => {
      const timeRange = createTimeRange(30, 0); // 30天

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "daily" as StatisticsMode,
        },
      });

      await nextTick();

      const granularityInfo = wrapper.vm.granularityInfo;
      expect(granularityInfo).toBeTruthy();
      expect(granularityInfo.text).toContain("按日统计");
      expect(granularityInfo.text).toContain("30 天数据");
    });

    it("总量统计应该显示不分组信息", async () => {
      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange: createTimeRange(30, 0),
          currentMode: "total" as StatisticsMode,
        },
      });

      await nextTick();

      const granularityInfo = wrapper.vm.granularityInfo;
      expect(granularityInfo.text).toContain("不分组");
    });
  });

  describe("事件处理", () => {
    it("应该正确触发模式变更事件", async () => {
      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange: null,
          currentMode: "total" as StatisticsMode,
        },
      });

      await wrapper.vm.handleModeChange("monthly");

      expect(wrapper.emitted("mode-change")).toBeTruthy();
      expect(wrapper.emitted("mode-change")![0]).toEqual(["monthly"]);
    });

    it("应该正确触发年度分组变更事件", async () => {
      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange: createYearRange(2023, 2024),
          currentMode: "monthly" as StatisticsMode,
        },
      });

      await wrapper.vm.handleYearlyGroupingChange(true);

      expect(wrapper.emitted("yearly-grouping-change")).toBeTruthy();
      expect(wrapper.emitted("yearly-grouping-change")![0]).toEqual([true]);
    });

    it("应该正确应用推荐", async () => {
      const timeRange = createTimeRange(7, 0); // 7天，应推荐daily

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
          showSuggestion: true,
        },
      });

      await nextTick();

      // 确保有推荐存在
      const suggestion = wrapper.vm.suggestion;
      expect(suggestion).toBeTruthy();

      await wrapper.vm.applySuggestion();

      expect(wrapper.emitted("mode-change")).toBeTruthy();
      expect(wrapper.emitted("mode-change")![0]).toEqual(["daily"]);
      expect(wrapper.emitted("suggestion-applied")).toBeTruthy();
    });

    it("应该正确忽略推荐", async () => {
      const timeRange = createTimeRange(7, 0);

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
          showSuggestion: true,
        },
      });

      await nextTick();
      await wrapper.vm.dismissSuggestion();

      expect(wrapper.emitted("suggestion-dismissed")).toBeTruthy();
      expect(wrapper.vm.dismissedSuggestion).toBe(true);
    });
  });

  describe("自动应用功能", () => {
    it("高置信度推荐应该自动应用", async () => {
      const timeRange = createTimeRange(7, 0); // 高置信度推荐daily

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
          showSuggestion: true,
          autoApply: true,
        },
      });

      await nextTick();

      // 等待自动应用逻辑执行
      await nextTick();

      // 应该自动应用推荐
      expect(wrapper.emitted("mode-change")).toBeTruthy();
      expect(wrapper.emitted("suggestion-applied")).toBeTruthy();
    });

    it("低置信度推荐不应该自动应用", async () => {
      // 创建一个会产生低置信度推荐的场景
      const timeRange = createTimeRange(1000, 0); // 长期但不跨年

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
          showSuggestion: true,
          autoApply: true,
        },
      });

      await nextTick();

      const suggestion = wrapper.vm.suggestion;
      if (suggestion && suggestion.confidence < 0.8) {
        expect(wrapper.emitted("mode-change")).toBeFalsy();
      }
    });
  });

  describe("可用模式过滤", () => {
    it("短期时间范围应该过滤掉不适用的模式", async () => {
      const timeRange = createTimeRange(7, 0); // 7天

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
        },
      });

      await nextTick();

      const availableModes = wrapper.vm.availableModes;
      // 7天的范围，yearly模式应该被过滤掉
      const yearlyMode = availableModes.find((m: any) => m.key === "yearly");
      expect(yearlyMode).toBeFalsy();
    });

    it("长期时间范围应该过滤掉不适用的模式", async () => {
      const timeRange = createTimeRange(400, 0); // 400天

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange,
          currentMode: "total" as StatisticsMode,
        },
      });

      await nextTick();

      const availableModes = wrapper.vm.availableModes;
      // 400天的范围，daily模式应该被过滤掉
      const dailyMode = availableModes.find((m: any) => m.key === "daily");
      expect(dailyMode).toBeFalsy();
    });
  });

  describe("响应式更新", () => {
    it("时间范围变化时应该重置推荐状态", async () => {
      const initialTimeRange = createTimeRange(7, 0);

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange: initialTimeRange,
          currentMode: "total" as StatisticsMode,
          showSuggestion: true,
        },
      });

      await nextTick();

      // 忽略推荐
      await wrapper.vm.dismissSuggestion();
      expect(wrapper.vm.dismissedSuggestion).toBe(true);

      // 更改时间范围
      const newTimeRange = createTimeRange(30, 0);
      await wrapper.setProps({ timeRange: newTimeRange });

      // 推荐状态应该重置
      expect(wrapper.vm.dismissedSuggestion).toBe(false);
    });

    it("当前模式变化时应该更新选中模式", async () => {
      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange: null,
          currentMode: "total" as StatisticsMode,
        },
      });

      expect(wrapper.vm.selectedMode).toBe("total");

      await wrapper.setProps({ currentMode: "monthly" });

      expect(wrapper.vm.selectedMode).toBe("monthly");
    });
  });

  describe("边界情况", () => {
    it("应该处理无效的时间范围", async () => {
      const invalidTimeRange: TimeRange = {
        startDate: null,
        endDate: null,
        unit: "day",
      };

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange: invalidTimeRange,
          currentMode: "total" as StatisticsMode,
        },
      });

      await nextTick();

      expect(() => wrapper.vm.generateRecommendation()).not.toThrow();
    });

    it("应该处理开始日期晚于结束日期的情况", async () => {
      const invalidTimeRange: TimeRange = {
        startDate: new Date("2024-12-31"),
        endDate: new Date("2024-01-01"),
        unit: "day",
      };

      wrapper = mount(StatisticsModeSuggester, {
        props: {
          timeRange: invalidTimeRange,
          currentMode: "total" as StatisticsMode,
        },
      });

      await nextTick();

      expect(() =>
        wrapper.vm.calculateDaysDifference(invalidTimeRange)
      ).not.toThrow();
    });
  });
});
