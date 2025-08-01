import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import TimeSelectionComponent from "../TimeSelectionComponent.vue";
import type {
  TimeSelectionState,
  TimeSelectionConfig,
} from "../../types/time-selection";

// Mock子组件
vi.mock("../QuickSelectionPanel.vue", () => ({
  default: {
    name: "QuickSelectionPanel",
    template:
      '<div data-testid="quick-selection-panel">QuickSelectionPanel</div>',
    props: [
      "modelValue",
      "showDescription",
      "showCustomOption",
      "showStatisticsSuggestion",
      "disabled",
      "size",
    ],
    emits: [
      "update:modelValue",
      "option-select",
      "custom-select",
      "option-hover",
    ],
  },
}));

vi.mock("../TimeUnitSelector.vue", () => ({
  default: {
    name: "TimeUnitSelector",
    template: '<div data-testid="time-unit-selector">TimeUnitSelector</div>',
    props: ["modelValue", "disabled", "availableUnits", "showDebugInfo"],
    emits: ["update:modelValue", "change", "picker-type-change"],
  },
}));

vi.mock("../TimeRangePickerNew.vue", () => ({
  default: {
    name: "TimeRangePickerNew",
    template: '<div data-testid="time-range-picker">TimeRangePickerNew</div>',
    props: [
      "modelValue",
      "timeUnit",
      "disabled",
      "clearable",
      "showValidationStatus",
    ],
    emits: ["update:modelValue", "change", "validation-change"],
  },
}));

vi.mock("../ComparisonValidator.vue", () => ({
  default: {
    name: "ComparisonValidator",
    template:
      '<div data-testid="comparison-validator">ComparisonValidator</div>',
    props: [
      "timeRange",
      "comparisonEnabled",
      "enableRealTimeValidation",
      "showValidationMessages",
      "showRealTimeHint",
    ],
    emits: [
      "validation-update",
      "continue-cross-year",
      "reselect-time",
      "validation-change",
    ],
  },
}));

vi.mock("../StatisticsModeSuggester.vue", () => ({
  default: {
    name: "StatisticsModeSuggester",
    template:
      '<div data-testid="statistics-mode-suggester">StatisticsModeSuggester</div>',
    props: [
      "timeRange",
      "currentMode",
      "showSuggestion",
      "autoApply",
      "timeSelectionState",
    ],
    emits: [
      "mode-change",
      "yearly-grouping-change",
      "suggestion-applied",
      "suggestion-dismissed",
    ],
  },
}));

describe("TimeSelectionComponent", () => {
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

  describe("组件渲染", () => {
    it("应该正确渲染所有子组件", () => {
      expect(
        wrapper.find('[data-testid="quick-selection-panel"]').exists()
      ).toBe(true);
      expect(wrapper.find('[data-testid="time-unit-selector"]').exists()).toBe(
        true
      );
      expect(wrapper.find('[data-testid="time-range-picker"]').exists()).toBe(
        true
      );
      expect(
        wrapper.find('[data-testid="statistics-mode-suggester"]').exists()
      ).toBe(true);
    });

    it("应该显示组件标题", () => {
      expect(wrapper.find(".component-title").text()).toBe("时间选择");
    });

    it("应该根据showTitle属性控制标题显示", async () => {
      await wrapper.setProps({ showTitle: false });
      expect(wrapper.find(".component-header").exists()).toBe(false);
    });

    it("应该根据showHelp属性控制帮助图标显示", async () => {
      expect(wrapper.find(".help-icon").exists()).toBe(true);

      await wrapper.setProps({ showHelp: false });
      expect(wrapper.find(".help-icon").exists()).toBe(false);
    });
  });

  describe("状态管理", () => {
    it("应该正确初始化状态", () => {
      const component = wrapper.vm;
      expect(component.state).toEqual(defaultState);
    });

    it("应该响应外部状态变化", async () => {
      const newState: TimeSelectionState = {
        ...defaultState,
        timeUnit: "month",
        comparisonEnabled: true,
      };

      await wrapper.setProps({ modelValue: newState });
      expect(wrapper.vm.state.timeUnit).toBe("month");
      expect(wrapper.vm.state.comparisonEnabled).toBe(true);
    });

    it("应该正确更新状态并发送事件", async () => {
      const component = wrapper.vm;

      // 模拟快捷选项选择
      const mockOption = {
        key: "thisYear",
        label: "今年",
        timeRange: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2024, 11, 31),
          unit: "day" as const,
        },
        statisticsMode: "monthly" as const,
        description: "查询当前年度数据",
      };

      component.handleQuickOptionSelect(mockOption);

      expect(component.state.quickSelection).toBe("thisYear");
      expect(component.state.timeRange).toEqual(mockOption.timeRange);
      expect(component.state.statisticsMode).toBe("monthly");
    });
  });

  describe("组件交互", () => {
    it("应该处理快捷选项选择", async () => {
      const component = wrapper.vm;
      const mockOption = {
        key: "recent3months",
        label: "近三月",
        timeRange: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2024, 2, 31),
          unit: "day" as const,
        },
        statisticsMode: "monthly" as const,
        description: "查询近三个月数据",
      };

      component.handleQuickOptionSelect(mockOption);

      expect(wrapper.emitted("quick-option-select")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("change")).toBeTruthy();
    });

    it("应该处理自定义选择", async () => {
      const component = wrapper.vm;

      component.handleCustomSelect();

      expect(component.state.quickSelection).toBe("custom");
      expect(wrapper.emitted("custom-select")).toBeTruthy();
    });

    it("应该处理时间单位变更", async () => {
      const component = wrapper.vm;
      const mockUnitConfig = {
        key: "month" as const,
        label: "月",
        dbField: "UPD" as const,
        queryStrategy: "month_range" as const,
        groupByExpression: "DATE_FORMAT(UPD, '%Y-%m')",
        pickerType: "month" as const,
        defaultRange: 2,
      };

      component.handleTimeUnitChange("month", mockUnitConfig);

      expect(component.state.timeUnit).toBe("month");
      expect(component.state.timeRange).toBeNull(); // 应该清空时间范围
      expect(component.state.quickSelection).toBeNull(); // 应该清空快捷选择
      expect(wrapper.emitted("time-unit-change")).toBeTruthy();
    });

    it("应该处理同期比切换", async () => {
      const component = wrapper.vm;

      component.handleComparisonToggle(true);

      expect(component.state.comparisonEnabled).toBe(true);
      expect(wrapper.emitted("comparison-toggle")).toBeTruthy();
    });

    it("应该处理统计模式变更", async () => {
      const component = wrapper.vm;

      component.handleStatisticsModeChange("yearly");

      expect(component.state.statisticsMode).toBe("yearly");
      expect(wrapper.emitted("statistics-mode-change")).toBeTruthy();
    });
  });

  describe("验证功能", () => {
    it("应该处理时间范围验证", async () => {
      const component = wrapper.vm;
      const validationResult = {
        isValid: false,
        message: "时间范围无效",
        level: "error",
      };

      component.handleTimeRangeValidation(validationResult);

      expect(component.state.validation.isValid).toBe(false);
      expect(component.state.validation.message).toBe("时间范围无效");
      expect(component.state.validation.level).toBe("error");
      expect(wrapper.emitted("validation-change")).toBeTruthy();
    });

    it("应该显示整体验证状态", async () => {
      const component = wrapper.vm;

      // 设置验证失败状态
      component.state.validation = {
        isValid: false,
        level: "error",
        message: "验证失败",
      };

      await nextTick();

      expect(wrapper.find(".overall-validation").exists()).toBe(true);
      expect(wrapper.find(".validation-alert").exists()).toBe(true);
    });
  });

  describe("响应式设计", () => {
    it("应该根据屏幕尺寸应用移动端样式", async () => {
      // 模拟移动端屏幕尺寸
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      });

      const component = wrapper.vm;
      component.checkMobile();

      expect(component.isMobile).toBe(true);

      await nextTick();
      expect(wrapper.classes()).toContain("mobile");
    });

    it("应该根据size属性应用不同尺寸样式", async () => {
      await wrapper.setProps({ size: "large" });
      expect(wrapper.classes()).toContain("size-large");

      await wrapper.setProps({ size: "small" });
      expect(wrapper.classes()).toContain("size-small");
    });
  });

  describe("配置管理", () => {
    it("应该使用默认配置", () => {
      const component = wrapper.vm;
      expect(component.config).toBeDefined();
      expect(component.config.defaultTimeUnit).toBe("day");
    });

    it("应该合并自定义配置", async () => {
      const customConfig: Partial<TimeSelectionConfig> = {
        defaultTimeUnit: "month",
        showComparison: false,
      };

      await wrapper.setProps({ config: customConfig });

      const component = wrapper.vm;
      expect(component.config.defaultTimeUnit).toBe("month");
      expect(component.config.showComparison).toBe(false);
    });
  });

  describe("查询参数生成", () => {
    it("应该正确生成查询参数", async () => {
      const component = wrapper.vm;

      // 设置状态
      component.state.timeUnit = "month";
      component.state.timeRange = {
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 2, 31),
        unit: "month",
      };
      component.state.statisticsMode = "monthly";

      await nextTick();

      const queryParams = component.queryParams;
      expect(queryParams.timeUnit).toBe("month");
      expect(queryParams.dbTimeField).toBe("UPD");
      expect(queryParams.queryStrategy).toBe("month_range");
      expect(queryParams.groupBy).toBe("month");
    });

    it("应该在状态变化时发送查询参数更新事件", async () => {
      const component = wrapper.vm;

      component.handleTimeUnitChange("year", {
        key: "year",
        label: "年",
        dbField: "UPD",
        queryStrategy: "year_range",
        groupByExpression: "YEAR(UPD)",
        pickerType: "year",
        defaultRange: 5,
      });

      expect(wrapper.emitted("query-params-update")).toBeTruthy();
    });
  });

  describe("公共方法", () => {
    it("应该支持重置功能", async () => {
      const component = wrapper.vm;

      // 先设置一些状态
      component.state.quickSelection = "thisYear";
      component.state.timeUnit = "month";
      component.state.comparisonEnabled = true;

      // 重置
      component.reset();

      expect(component.state.quickSelection).toBeNull();
      expect(component.state.timeUnit).toBe("day"); // 默认值
      expect(component.state.comparisonEnabled).toBe(false);
      expect(wrapper.emitted("reset")).toBeTruthy();
    });

    it("应该支持设置状态", async () => {
      const component = wrapper.vm;
      const newState = {
        timeUnit: "year" as const,
        comparisonEnabled: true,
      };

      component.setState(newState);

      expect(component.state.timeUnit).toBe("year");
      expect(component.state.comparisonEnabled).toBe(true);
    });

    it("应该支持获取状态", () => {
      const component = wrapper.vm;
      const state = component.getState();

      expect(state).toEqual(component.state);
      expect(state).not.toBe(component.state); // 应该是副本
    });

    it("应该支持获取查询参数", () => {
      const component = wrapper.vm;
      const params = component.getQueryParams();

      expect(params).toBeDefined();
      expect(params.timeUnit).toBe("day");
      expect(params.dbTimeField).toBe("UPD");
    });

    it("应该支持验证", () => {
      const component = wrapper.vm;
      const result = component.validate();

      expect(result).toEqual(component.state.validation);
    });
  });

  describe("禁用状态", () => {
    it("应该在禁用时应用正确的样式和属性", async () => {
      await wrapper.setProps({ disabled: true });

      expect(wrapper.classes()).toContain("disabled");

      // 检查子组件是否接收到disabled属性
      const quickPanel = wrapper.findComponent({ name: "QuickSelectionPanel" });
      expect(quickPanel.props("disabled")).toBe(true);
    });
  });

  describe("调试功能", () => {
    it("应该在开启调试时显示调试面板", async () => {
      await wrapper.setProps({ showDebugInfo: true });

      expect(wrapper.find(".debug-panel").exists()).toBe(true);
      expect(wrapper.find(".debug-content").exists()).toBe(true);
    });

    it("应该在调试面板中显示状态和配置信息", async () => {
      await wrapper.setProps({ showDebugInfo: true });

      const debugContent = wrapper.find(".debug-content");
      expect(debugContent.text()).toContain("当前状态");
      expect(debugContent.text()).toContain("查询参数");
      expect(debugContent.text()).toContain("组件配置");
    });
  });

  describe("错误处理", () => {
    it("应该处理子组件的错误", async () => {
      const component = wrapper.vm;

      // 模拟错误情况
      try {
        component.handleTimeUnitChange("invalid" as any, {} as any);
      } catch (error) {
        // 应该有适当的错误处理
      }
    });
  });

  describe("事件传播", () => {
    it("应该正确传播所有必要的事件", async () => {
      const component = wrapper.vm;

      // 测试各种事件是否正确发送
      const mockOption = {
        key: "test",
        label: "Test",
        timeRange: null,
        description: "Test option",
      };

      component.handleQuickOptionSelect(mockOption);
      component.handleCustomSelect();
      component.handleComparisonToggle(true);
      component.handleStatisticsModeChange("yearly");
      component.reset();

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("change")).toBeTruthy();
      expect(wrapper.emitted("query-params-update")).toBeTruthy();
      expect(wrapper.emitted("quick-option-select")).toBeTruthy();
      expect(wrapper.emitted("custom-select")).toBeTruthy();
      expect(wrapper.emitted("comparison-toggle")).toBeTruthy();
      expect(wrapper.emitted("statistics-mode-change")).toBeTruthy();
      expect(wrapper.emitted("reset")).toBeTruthy();
    });
  });
});
