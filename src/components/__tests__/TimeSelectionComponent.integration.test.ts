import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import TimeSelectionComponent from "../TimeSelectionComponent.vue";
import type {
  TimeSelectionState,
  QuickOption,
} from "../../types/time-selection";

// 不mock子组件，进行真实的集成测试
describe("TimeSelectionComponent Integration Tests", () => {
  let wrapper: VueWrapper<any>;

  const defaultState: TimeSelectionState = {
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

  beforeEach(() => {
    wrapper = mount(TimeSelectionComponent, {
      props: {
        modelValue: defaultState,
      },
    });
  });

  describe("完整的用户交互流程", () => {
    it("应该支持完整的快捷选择到查询参数生成流程", async () => {
      const component = wrapper.vm;

      // 1. 用户选择"今年"快捷选项
      const thisYearOption: QuickOption = {
        key: "thisYear",
        label: "今年",
        timeRange: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2024, 11, 31),
          unit: "day",
        },
        statisticsMode: "monthly",
        description: "查询当前年度数据",
      };

      component.handleQuickOptionSelect(thisYearOption);
      await nextTick();

      // 验证状态更新
      expect(component.state.quickSelection).toBe("thisYear");
      expect(component.state.timeRange).toEqual(thisYearOption.timeRange);
      expect(component.state.statisticsMode).toBe("monthly");

      // 2. 用户启用同期比
      component.handleComparisonToggle(true);
      await nextTick();

      expect(component.state.comparisonEnabled).toBe(true);

      // 3. 验证查询参数生成
      const queryParams = component.getQueryParams();
      expect(queryParams.timeUnit).toBe("day");
      expect(queryParams.dbTimeField).toBe("UPD");
      expect(queryParams.enableComparison).toBe(true);
      expect(queryParams.groupBy).toBe("month");
      expect(queryParams.quickSelectionKey).toBe("thisYear");

      // 4. 验证事件发送
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("change")).toBeTruthy();
      expect(wrapper.emitted("query-params-update")).toBeTruthy();
    });

    it("应该支持时间单位切换后的状态重置流程", async () => {
      const component = wrapper.vm;

      // 1. 先设置一些初始状态
      component.handleQuickOptionSelect({
        key: "recent3months",
        label: "近三月",
        timeRange: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2024, 2, 31),
          unit: "day",
        },
        statisticsMode: "monthly",
        description: "近三个月数据",
      });
      await nextTick();

      expect(component.state.quickSelection).toBe("recent3months");
      expect(component.state.timeRange).toBeTruthy();

      // 2. 切换时间单位
      const yearUnitConfig = {
        key: "year" as const,
        label: "年",
        dbField: "UPD" as const,
        queryStrategy: "year_range" as const,
        groupByExpression: "YEAR(UPD)",
        pickerType: "year" as const,
        defaultRange: 5,
      };

      component.handleTimeUnitChange("year", yearUnitConfig);
      await nextTick();

      // 3. 验证状态重置
      expect(component.state.timeUnit).toBe("year");
      expect(component.state.timeRange).toBeNull(); // 应该被清空
      expect(component.state.quickSelection).toBeNull(); // 应该被清空

      // 4. 验证查询参数更新
      const queryParams = component.getQueryParams();
      expect(queryParams.timeUnit).toBe("year");
      expect(queryParams.queryStrategy).toBe("year_range");
    });

    it("应该支持自定义时间范围选择流程", async () => {
      const component = wrapper.vm;

      // 1. 用户点击自定义选择
      component.handleCustomSelect();
      await nextTick();

      expect(component.state.quickSelection).toBe("custom");

      // 2. 用户手动设置时间范围
      const customTimeRange = {
        startDate: new Date(2024, 5, 1),
        endDate: new Date(2024, 7, 31),
        unit: "day" as const,
      };

      component.handleTimeRangeChange(customTimeRange);
      await nextTick();

      expect(component.state.timeRange).toEqual(customTimeRange);
      expect(component.state.quickSelection).toBe("custom"); // 应该保持custom

      // 3. 验证查询参数
      const queryParams = component.getQueryParams();
      expect(queryParams.startDate).toBeDefined();
      expect(queryParams.endDate).toBeDefined();
    });
  });

  describe("组件间状态同步", () => {
    it("应该在快捷选择变化时同步所有相关组件状态", async () => {
      const component = wrapper.vm;

      const recentYearOption: QuickOption = {
        key: "recent2years",
        label: "近两年",
        timeRange: {
          startDate: new Date(2022, 0, 1),
          endDate: new Date(2024, 11, 31),
          unit: "day",
        },
        statisticsMode: "yearly",
        description: "近两年数据",
      };

      component.handleQuickOptionSelect(recentYearOption);
      await nextTick();

      // 验证所有相关状态都已同步
      expect(component.state.quickSelection).toBe("recent2years");
      expect(component.state.timeRange).toEqual(recentYearOption.timeRange);
      expect(component.state.statisticsMode).toBe("yearly");

      // 验证查询参数反映了所有变化
      const queryParams = component.getQueryParams();
      expect(queryParams.groupBy).toBe("year");
      expect(queryParams.quickSelectionKey).toBe("recent2years");
    });

    it("应该在统计模式变化时保持其他状态不变", async () => {
      const component = wrapper.vm;

      // 先设置一些初始状态
      const initialTimeRange = {
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
        unit: "day" as const,
      };

      component.state.timeRange = initialTimeRange;
      component.state.comparisonEnabled = true;
      await nextTick();

      // 改变统计模式
      component.handleStatisticsModeChange("monthly");
      await nextTick();

      // 验证只有统计模式变化，其他状态保持不变
      expect(component.state.statisticsMode).toBe("monthly");
      expect(component.state.timeRange).toEqual(initialTimeRange);
      expect(component.state.comparisonEnabled).toBe(true);
    });
  });

  describe("验证状态传播", () => {
    it("应该正确处理时间范围验证失败的情况", async () => {
      const component = wrapper.vm;

      // 模拟时间范围验证失败
      const validationResult = {
        isValid: false,
        message: "开始时间不能晚于结束时间",
        level: "error",
      };

      component.handleTimeRangeValidation(validationResult);
      await nextTick();

      // 验证验证状态更新
      expect(component.state.validation.isValid).toBe(false);
      expect(component.state.validation.message).toBe(
        "开始时间不能晚于结束时间"
      );
      expect(component.state.validation.level).toBe("error");

      // 验证整体验证状态显示
      expect(wrapper.find(".overall-validation").exists()).toBe(true);
    });

    it("应该正确处理同期比验证警告", async () => {
      const component = wrapper.vm;

      // 设置跨年时间范围
      const crossYearRange = {
        startDate: new Date(2023, 10, 1), // 2023年11月
        endDate: new Date(2024, 1, 28), // 2024年2月
        unit: "day" as const,
      };

      component.state.timeRange = crossYearRange;
      component.state.comparisonEnabled = true;
      await nextTick();

      // 模拟同期比验证结果
      const comparisonValidation = {
        isValid: false,
        level: "warning",
        message: "同期比分析建议选择同一年份内的时间范围",
        suggestion: "建议调整时间范围至同一年份内，或关闭同期比功能",
      };

      component.handleComparisonValidation(comparisonValidation);
      await nextTick();

      expect(component.state.validation.level).toBe("warning");
      expect(component.state.validation.message).toContain("同期比分析建议");
    });
  });

  describe("响应式行为", () => {
    it("应该在窗口大小变化时正确更新移动端状态", async () => {
      const component = wrapper.vm;

      // 模拟桌面端
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });

      component.checkMobile();
      expect(component.isMobile).toBe(false);

      // 模拟移动端
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 600,
      });

      component.checkMobile();
      expect(component.isMobile).toBe(true);

      await nextTick();
      expect(wrapper.classes()).toContain("mobile");
    });
  });

  describe("配置驱动的行为", () => {
    it("应该根据配置显示或隐藏同期比功能", async () => {
      // 默认应该显示同期比
      expect(wrapper.find(".comparison-section").exists()).toBe(true);

      // 配置为不显示同期比
      await wrapper.setProps({
        config: {
          showComparison: false,
        },
      });

      expect(wrapper.find(".comparison-section").exists()).toBe(false);
    });

    it("应该根据配置显示或隐藏统计建议", async () => {
      // 默认应该显示统计建议
      expect(
        wrapper.find('[data-testid="statistics-mode-suggester"]').exists()
      ).toBe(true);

      // 配置为不显示统计建议
      await wrapper.setProps({
        config: {
          showStatisticsSuggestion: false,
        },
      });

      expect(
        wrapper.find('[data-testid="statistics-mode-suggester"]').exists()
      ).toBe(false);
    });
  });

  describe("重置和状态管理", () => {
    it("应该支持完整的重置流程", async () => {
      const component = wrapper.vm;

      // 设置复杂的状态
      component.state.quickSelection = "thisYear";
      component.state.timeUnit = "month";
      component.state.timeRange = {
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
        unit: "month",
      };
      component.state.comparisonEnabled = true;
      component.state.statisticsMode = "yearly";
      await nextTick();

      // 执行重置
      component.reset();
      await nextTick();

      // 验证所有状态都被重置
      expect(component.state.quickSelection).toBeNull();
      expect(component.state.timeUnit).toBe("day"); // 默认值
      expect(component.state.timeRange).toBeNull();
      expect(component.state.comparisonEnabled).toBe(false);
      expect(component.state.statisticsMode).toBe("total");
      expect(component.state.validation.isValid).toBe(true);

      // 验证重置事件发送
      expect(wrapper.emitted("reset")).toBeTruthy();
    });

    it("应该支持部分状态更新", async () => {
      const component = wrapper.vm;

      const originalState = { ...component.state };

      // 部分更新状态
      component.setState({
        timeUnit: "year",
        comparisonEnabled: true,
      });

      // 验证只有指定的状态被更新
      expect(component.state.timeUnit).toBe("year");
      expect(component.state.comparisonEnabled).toBe(true);
      // 其他状态应该保持不变
      expect(component.state.quickSelection).toBe(originalState.quickSelection);
      expect(component.state.statisticsMode).toBe(originalState.statisticsMode);
    });
  });

  describe("查询参数生成的完整性", () => {
    it("应该为复杂状态生成完整的查询参数", async () => {
      const component = wrapper.vm;

      // 设置复杂状态
      component.state.quickSelection = "recent6months";
      component.state.timeUnit = "month";
      component.state.timeRange = {
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 5, 30),
        unit: "month",
      };
      component.state.comparisonEnabled = true;
      component.state.statisticsMode = "monthly";
      await nextTick();

      const queryParams = component.getQueryParams();

      // 验证所有必要的查询参数都存在
      expect(queryParams.timeUnit).toBe("month");
      expect(queryParams.dbTimeField).toBe("UPD");
      expect(queryParams.queryStrategy).toBe("month_range");
      expect(queryParams.groupBy).toBe("month");
      expect(queryParams.enableComparison).toBe(true);
      expect(queryParams.quickSelectionKey).toBe("recent6months");
      expect(queryParams.startDate).toBeDefined();
      expect(queryParams.endDate).toBeDefined();
      expect(queryParams.groupByExpression).toBeDefined();
    });
  });

  describe("错误恢复", () => {
    it("应该能够从验证错误中恢复", async () => {
      const component = wrapper.vm;

      // 设置验证错误状态
      component.state.validation = {
        isValid: false,
        level: "error",
        message: "时间范围无效",
      };
      await nextTick();

      expect(wrapper.find(".overall-validation").exists()).toBe(true);

      // 修复错误（设置有效的时间范围）
      component.handleTimeRangeValidation({
        isValid: true,
        message: "时间范围有效",
        level: "success",
      });
      await nextTick();

      // 验证错误状态已清除
      expect(component.state.validation.isValid).toBe(true);
      expect(wrapper.find(".overall-validation").exists()).toBe(false);
    });
  });
});
