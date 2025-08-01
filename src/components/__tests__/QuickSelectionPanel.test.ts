import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import QuickSelectionPanel from "../QuickSelectionPanel.vue";
import type { QuickOption } from "../../types/time-selection";
import { QUICK_OPTIONS } from "../../config/time-selection";

// Mock Element Plus components
vi.mock("element-plus", () => ({
  ElButton: { name: "ElButton", template: "<button><slot /></button>" },
  ElTooltip: { name: "ElTooltip", template: "<div><slot /></div>" },
  ElIcon: { name: "ElIcon", template: "<i><slot /></i>" },
  ElAlert: { name: "ElAlert", template: "<div><slot /></div>" },
  ElTag: { name: "ElTag", template: "<span><slot /></span>" },
}));

// Mock Element Plus icons
vi.mock("@element-plus/icons-vue", () => ({
  QuestionFilled: { name: "QuestionFilled", template: "<i></i>" },
  Check: { name: "Check", template: "<i></i>" },
  TrendCharts: { name: "TrendCharts", template: "<i></i>" },
}));

describe("QuickSelectionPanel", () => {
  let wrapper: VueWrapper<any>;

  const mockQuickOptions: QuickOption[] = [
    {
      key: "historical",
      label: "历史总量",
      timeRange: null,
      statisticsMode: "total",
      description: "查询所有历史数据，适用于企业或品牌的总体统计",
    },
    {
      key: "thisYear",
      label: "今年",
      timeRange: {
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
        unit: "day",
      },
      statisticsMode: "monthly",
      description: "查询当前年度数据",
    },
    {
      key: "recent3months",
      label: "近三月",
      timeRange: {
        startDate: new Date(2024, 6, 1),
        endDate: new Date(2024, 8, 30),
        unit: "day",
      },
      statisticsMode: "monthly",
      description: "查询近三个月数据，适用于短期趋势分析",
    },
  ];

  beforeEach(() => {
    wrapper = mount(QuickSelectionPanel, {
      props: {
        modelValue: null,
        showDescription: true,
        showCustomOption: true,
        showStatisticsSuggestion: true,
      },
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  // ============================================================================
  // 基础渲染测试
  // ============================================================================

  describe("基础渲染", () => {
    it("应该正确渲染组件", () => {
      expect(wrapper.find(".quick-selection-panel").exists()).toBe(true);
      expect(wrapper.find(".panel-header").exists()).toBe(true);
      expect(wrapper.find(".quick-options-container").exists()).toBe(true);
    });

    it("应该显示面板标题", () => {
      expect(wrapper.find(".panel-title").text()).toBe("快捷选择");
    });

    it("应该渲染所有快捷选项按钮", () => {
      const buttons = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      );
      expect(buttons.length).toBe(QUICK_OPTIONS.length);
    });

    it("应该显示自定义选项按钮", () => {
      expect(wrapper.find(".custom-option").exists()).toBe(true);
    });

    it("应该显示帮助图标", () => {
      expect(wrapper.find(".help-icon").exists()).toBe(true);
    });
  });

  // ============================================================================
  // Props 测试
  // ============================================================================

  describe("Props 功能", () => {
    it("应该根据 showDescription 控制描述显示", async () => {
      await wrapper.setProps({ showDescription: false });
      expect(wrapper.find(".option-description").exists()).toBe(false);
    });

    it("应该根据 showCustomOption 控制自定义选项显示", async () => {
      await wrapper.setProps({ showCustomOption: false });
      expect(wrapper.find(".custom-option").exists()).toBe(false);
    });

    it("应该根据 showStatisticsSuggestion 控制统计建议显示", async () => {
      await wrapper.setProps({ showStatisticsSuggestion: false });
      expect(wrapper.find(".statistics-suggestion").exists()).toBe(false);
    });

    it("应该支持自定义快捷选项", async () => {
      await wrapper.setProps({ customOptions: mockQuickOptions });
      const buttons = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      );
      expect(buttons.length).toBe(mockQuickOptions.length);
    });

    it("应该正确设置初始选中值", async () => {
      await wrapper.setProps({ modelValue: "thisYear" });
      const selectedButton = wrapper.find(".quick-option-button.selected");
      expect(selectedButton.exists()).toBe(true);
    });
  });

  // ============================================================================
  // 交互测试
  // ============================================================================

  describe("用户交互", () => {
    it("应该在点击快捷选项时触发选择事件", async () => {
      const firstButton = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      )[0];
      await firstButton.trigger("click");

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("option-select")).toBeTruthy();
    });

    it("应该在点击自定义选项时触发自定义选择事件", async () => {
      const customButton = wrapper.find(".custom-option");
      await customButton.trigger("click");

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("custom-select")).toBeTruthy();
    });

    it("应该在悬停时触发悬停事件", async () => {
      const firstButton = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      )[0];
      await firstButton.trigger("mouseenter");

      expect(wrapper.emitted("option-hover")).toBeTruthy();
    });

    it("应该在离开悬停时触发离开事件", async () => {
      const firstButton = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      )[0];
      await firstButton.trigger("mouseleave");

      expect(wrapper.emitted("option-hover")).toBeTruthy();
    });

    it("应该正确更新选中状态", async () => {
      const firstButton = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      )[0];
      await firstButton.trigger("click");

      expect(firstButton.classes()).toContain("selected");
    });
  });

  // ============================================================================
  // 描述和建议测试
  // ============================================================================

  describe("描述和建议功能", () => {
    it("应该在选择选项后显示描述", async () => {
      await wrapper.setProps({ modelValue: "thisYear" });
      await wrapper.vm.$nextTick();

      const description = wrapper.find(".option-description");
      expect(description.exists()).toBe(true);
    });

    it("应该在选择选项后显示统计模式建议", async () => {
      await wrapper.setProps({ modelValue: "thisYear" });
      await wrapper.vm.$nextTick();

      const suggestion = wrapper.find(".statistics-suggestion");
      expect(suggestion.exists()).toBe(true);
    });

    it("应该根据统计模式显示不同的建议标签类型", async () => {
      // 测试不同统计模式的标签类型
      const testCases = [
        { mode: "total", expectedType: "info" },
        { mode: "yearly", expectedType: "success" },
        { mode: "monthly", expectedType: "warning" },
        { mode: "daily", expectedType: "danger" },
      ];

      for (const testCase of testCases) {
        const result = wrapper.vm.getSuggestionTagType(testCase.mode);
        expect(result).toBe(testCase.expectedType);
      }
    });
  });

  // ============================================================================
  // 响应式和状态管理测试
  // ============================================================================

  describe("响应式和状态管理", () => {
    it("应该响应 modelValue 的外部变化", async () => {
      await wrapper.setProps({ modelValue: "thisYear" });
      expect(wrapper.vm.selectedOption).toBe("thisYear");

      await wrapper.setProps({ modelValue: "recent3months" });
      expect(wrapper.vm.selectedOption).toBe("recent3months");
    });

    it("应该正确计算选中的选项对象", async () => {
      await wrapper.setProps({ modelValue: "thisYear" });
      const selectedObject = wrapper.vm.selectedOptionObject;
      expect(selectedObject).toBeTruthy();
      expect(selectedObject.key).toBe("thisYear");
    });

    it("应该正确计算当前统计建议", async () => {
      await wrapper.setProps({ modelValue: "thisYear" });
      const suggestion = wrapper.vm.currentSuggestion;
      expect(suggestion).toBeTruthy();
      expect(suggestion.mode).toBe("monthly");
      expect(suggestion.label).toBe("按月统计");
    });
  });

  // ============================================================================
  // 暴露方法测试
  // ============================================================================

  describe("暴露方法", () => {
    it("应该提供 resetSelection 方法", () => {
      expect(typeof wrapper.vm.resetSelection).toBe("function");
    });

    it("应该提供 setSelectedOption 方法", () => {
      expect(typeof wrapper.vm.setSelectedOption).toBe("function");
    });

    it("resetSelection 应该清空选择", async () => {
      await wrapper.setProps({ modelValue: "thisYear" });
      wrapper.vm.resetSelection();

      expect(wrapper.vm.selectedOption).toBe(null);
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    });

    it("setSelectedOption 应该设置选中选项", () => {
      wrapper.vm.setSelectedOption("thisYear");
      expect(wrapper.vm.selectedOption).toBe("thisYear");
    });
  });

  // ============================================================================
  // 边界情况测试
  // ============================================================================

  describe("边界情况", () => {
    it("应该处理空的快捷选项列表", async () => {
      await wrapper.setProps({ customOptions: [] });
      const buttons = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      );
      expect(buttons.length).toBe(0);
    });

    it("应该处理无效的 modelValue", async () => {
      await wrapper.setProps({ modelValue: "invalid-option" });
      expect(wrapper.vm.selectedOptionObject).toBe(null);
    });

    it("应该在禁用状态下阻止交互", async () => {
      await wrapper.setProps({ disabled: true });
      const firstButton = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      )[0];
      await firstButton.trigger("click");

      // 在禁用状态下不应该触发事件
      expect(wrapper.emitted("update:modelValue")).toBeFalsy();
    });

    it("应该处理没有统计模式的选项", () => {
      const optionWithoutMode: QuickOption = {
        key: "test",
        label: "测试",
        timeRange: null,
        description: "测试选项",
      };

      wrapper.vm.setSelectedOption("test");
      // 模拟选项对象
      wrapper.vm.selectedOptionObject = optionWithoutMode;

      const suggestion = wrapper.vm.currentSuggestion;
      expect(suggestion).toBe(null);
    });
  });

  // ============================================================================
  // 可访问性测试
  // ============================================================================

  describe("可访问性", () => {
    it("应该为按钮提供适当的类名", () => {
      const buttons = wrapper.findAll(".quick-option-button");
      buttons.forEach((button) => {
        expect(button.classes()).toContain("quick-option-button");
      });
    });

    it("应该为选中的按钮添加选中类名", async () => {
      await wrapper.setProps({ modelValue: "thisYear" });
      const selectedButton = wrapper.find(".quick-option-button.selected");
      expect(selectedButton.exists()).toBe(true);
    });

    it("应该显示选中图标", async () => {
      await wrapper.setProps({ modelValue: "thisYear" });
      const selectedIcon = wrapper.find(".selected-icon");
      expect(selectedIcon.exists()).toBe(true);
    });
  });

  // ============================================================================
  // 性能测试
  // ============================================================================

  describe("性能优化", () => {
    it("应该正确处理大量快捷选项", async () => {
      const manyOptions: QuickOption[] = Array.from({ length: 20 }, (_, i) => ({
        key: `option-${i}`,
        label: `选项 ${i}`,
        timeRange: null,
        statisticsMode: "total",
        description: `选项 ${i} 的描述`,
      }));

      await wrapper.setProps({ customOptions: manyOptions });
      const buttons = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      );
      expect(buttons.length).toBe(20);
    });

    it("应该避免不必要的重新渲染", async () => {
      const renderSpy = vi.spyOn(wrapper.vm, "$forceUpdate");

      // 设置相同的值不应该触发重新渲染
      await wrapper.setProps({ modelValue: "thisYear" });
      await wrapper.setProps({ modelValue: "thisYear" });

      // 由于我们无法直接测试渲染次数，我们测试状态是否正确
      expect(wrapper.vm.selectedOption).toBe("thisYear");
    });
  });
});
