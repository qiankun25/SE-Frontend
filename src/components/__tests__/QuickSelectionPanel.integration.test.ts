import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import QuickSelectionPanel from "../QuickSelectionPanel.vue";
import {
  QUICK_OPTIONS,
  getQuickOptionByKey,
} from "../../config/time-selection";
import type { TimeSelectionState } from "../../types/time-selection";

describe("QuickSelectionPanel Integration Tests", () => {
  // ============================================================================
  // 与配置系统的集成测试
  // ============================================================================

  describe("配置系统集成", () => {
    it("应该正确加载默认快捷选项配置", () => {
      const wrapper = mount(QuickSelectionPanel);

      // 验证组件能够正确加载配置中的选项
      const buttons = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      );
      expect(buttons.length).toBe(QUICK_OPTIONS.length);

      // 验证每个选项都正确渲染
      QUICK_OPTIONS.forEach((option, index) => {
        const button = buttons[index];
        expect(button.text()).toContain(option.label);
      });
    });

    it("应该正确处理配置中的时间范围", async () => {
      const wrapper = mount(QuickSelectionPanel, {
        props: { modelValue: "thisYear" },
      });

      const thisYearOption = getQuickOptionByKey("thisYear");
      expect(thisYearOption).toBeTruthy();
      expect(thisYearOption?.timeRange).toBeTruthy();
      expect(thisYearOption?.timeRange?.unit).toBe("day");
    });

    it("应该正确处理历史总量选项（无时间限制）", async () => {
      const wrapper = mount(QuickSelectionPanel, {
        props: { modelValue: "historical" },
      });

      const historicalOption = getQuickOptionByKey("historical");
      expect(historicalOption).toBeTruthy();
      expect(historicalOption?.timeRange).toBe(null);
      expect(historicalOption?.statisticsMode).toBe("total");
    });
  });

  // ============================================================================
  // 与时间选择状态的集成测试
  // ============================================================================

  describe("时间选择状态集成", () => {
    it("应该能够生成正确的时间选择状态", async () => {
      const wrapper = mount(QuickSelectionPanel);

      // 模拟选择"今年"选项
      const thisYearButton = wrapper
        .findAll(".quick-option-button:not(.custom-option)")
        .find((button) => button.text().includes("今年"));

      expect(thisYearButton).toBeTruthy();
      await thisYearButton!.trigger("click");

      // 验证事件被正确触发
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("option-select")).toBeTruthy();

      const optionSelectEvent = wrapper.emitted("option-select")?.[0]?.[0];
      expect(optionSelectEvent).toBeTruthy();
      expect(optionSelectEvent.key).toBe("thisYear");
    });

    it("应该正确处理统计模式建议", async () => {
      const wrapper = mount(QuickSelectionPanel, {
        props: {
          modelValue: "recent3months",
          showStatisticsSuggestion: true,
        },
      });

      await wrapper.vm.$nextTick();

      const suggestion = wrapper.vm.currentSuggestion;
      expect(suggestion).toBeTruthy();
      expect(suggestion.mode).toBe("monthly");
      expect(suggestion.label).toBe("按月统计");
    });
  });

  // ============================================================================
  // 与查询参数映射的集成测试
  // ============================================================================

  describe("查询参数映射集成", () => {
    it("应该提供足够的信息用于参数映射", async () => {
      const wrapper = mount(QuickSelectionPanel);

      // 选择一个有时间范围的选项
      await wrapper.setProps({ modelValue: "recent6months" });

      const selectedOption = wrapper.vm.selectedOptionObject;
      expect(selectedOption).toBeTruthy();
      expect(selectedOption.key).toBe("recent6months");
      expect(selectedOption.timeRange).toBeTruthy();
      expect(selectedOption.statisticsMode).toBe("monthly");

      // 验证时间范围信息完整
      const timeRange = selectedOption.timeRange;
      expect(timeRange?.startDate).toBeInstanceOf(Date);
      expect(timeRange?.endDate).toBeInstanceOf(Date);
      expect(timeRange?.unit).toBe("day");
    });

    it("应该正确处理历史总量的特殊情况", async () => {
      const wrapper = mount(QuickSelectionPanel);

      await wrapper.setProps({ modelValue: "historical" });

      const selectedOption = wrapper.vm.selectedOptionObject;
      expect(selectedOption).toBeTruthy();
      expect(selectedOption.key).toBe("historical");
      expect(selectedOption.timeRange).toBe(null); // 历史总量不限制时间范围
      expect(selectedOption.statisticsMode).toBe("total");
    });
  });

  // ============================================================================
  // 与业务场景的集成测试
  // ============================================================================

  describe("业务场景集成", () => {
    it("应该支持企业历史合格证查询场景", async () => {
      const wrapper = mount(QuickSelectionPanel);

      // 模拟选择历史总量
      await wrapper.setProps({ modelValue: "historical" });

      const selectedOption = wrapper.vm.selectedOptionObject;
      expect(selectedOption?.description).toContain("企业或品牌的总体统计");
      expect(selectedOption?.statisticsMode).toBe("total");
    });

    it("应该支持分年度统计场景", async () => {
      const wrapper = mount(QuickSelectionPanel);

      // 模拟选择近两年
      await wrapper.setProps({ modelValue: "recent2years" });

      const selectedOption = wrapper.vm.selectedOptionObject;
      expect(selectedOption?.description).toContain("按年度分组");
      expect(selectedOption?.statisticsMode).toBe("yearly");
    });

    it("应该支持短期趋势分析场景", async () => {
      const wrapper = mount(QuickSelectionPanel);

      // 模拟选择近三月
      await wrapper.setProps({ modelValue: "recent3months" });

      const selectedOption = wrapper.vm.selectedOptionObject;
      expect(selectedOption?.description).toContain("短期趋势分析");
      expect(selectedOption?.statisticsMode).toBe("monthly");
    });
  });

  // ============================================================================
  // 错误处理和边界情况集成测试
  // ============================================================================

  describe("错误处理集成", () => {
    it("应该优雅处理无效的选项key", async () => {
      const wrapper = mount(QuickSelectionPanel);

      await wrapper.setProps({ modelValue: "invalid-option-key" });

      // 组件应该不会崩溃，并且返回null
      expect(wrapper.vm.selectedOptionObject).toBe(null);
      expect(wrapper.vm.currentSuggestion).toBe(null);
    });

    it("应该正确处理空配置", async () => {
      const wrapper = mount(QuickSelectionPanel, {
        props: {
          customOptions: [],
        },
      });

      const buttons = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      );
      expect(buttons.length).toBe(0);

      // 自定义选项按钮仍应存在（如果启用）
      const customButton = wrapper.find(".custom-option");
      expect(customButton.exists()).toBe(true);
    });
  });

  // ============================================================================
  // 性能和响应性集成测试
  // ============================================================================

  describe("性能集成", () => {
    it("应该能够处理大量选项而不影响性能", async () => {
      const manyOptions = Array.from({ length: 50 }, (_, i) => ({
        key: `option-${i}`,
        label: `选项 ${i}`,
        timeRange: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2024, 11, 31),
          unit: "day" as const,
        },
        statisticsMode: "monthly" as const,
        description: `选项 ${i} 的描述`,
      }));

      const startTime = performance.now();

      const wrapper = mount(QuickSelectionPanel, {
        props: {
          customOptions: manyOptions,
        },
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 渲染时间应该在合理范围内（小于100ms）
      expect(renderTime).toBeLessThan(100);

      // 验证所有选项都正确渲染
      const buttons = wrapper.findAll(
        ".quick-option-button:not(.custom-option)"
      );
      expect(buttons.length).toBe(50);
    });

    it("应该正确处理快速连续的选项切换", async () => {
      const wrapper = mount(QuickSelectionPanel);

      const options = [
        "thisYear",
        "lastYear",
        "recent3months",
        "recent6months",
        "historical",
      ];

      // 快速连续切换选项
      for (const option of options) {
        await wrapper.setProps({ modelValue: option });
        expect(wrapper.vm.selectedOption).toBe(option);
      }

      // 验证最终状态正确
      expect(wrapper.vm.selectedOption).toBe("historical");
      const selectedOption = wrapper.vm.selectedOptionObject;
      expect(selectedOption?.key).toBe("historical");
    });
  });

  // ============================================================================
  // 实际使用场景模拟测试
  // ============================================================================

  describe("实际使用场景模拟", () => {
    it("应该模拟完整的用户交互流程", async () => {
      const wrapper = mount(QuickSelectionPanel, {
        props: {
          showDescription: true,
          showStatisticsSuggestion: true,
        },
      });

      // 1. 用户悬停在选项上
      const thisYearButton = wrapper
        .findAll(".quick-option-button:not(.custom-option)")
        .find((button) => button.text().includes("今年"));

      await thisYearButton!.trigger("mouseenter");
      expect(wrapper.emitted("option-hover")).toBeTruthy();

      // 2. 用户点击选择选项
      await thisYearButton!.trigger("click");
      expect(wrapper.emitted("option-select")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();

      // 3. 验证选中状态
      expect(thisYearButton!.classes()).toContain("selected");

      // 4. 验证描述和建议显示
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".option-description").exists()).toBe(true);
      expect(wrapper.find(".statistics-suggestion").exists()).toBe(true);

      // 5. 用户离开悬停
      await thisYearButton!.trigger("mouseleave");
      expect(wrapper.emitted("option-hover")).toBeTruthy();
    });

    it("应该模拟自定义选项的使用场景", async () => {
      const wrapper = mount(QuickSelectionPanel);

      // 用户点击自定义选项
      const customButton = wrapper.find(".custom-option");
      await customButton.trigger("click");

      // 验证自定义选择事件
      expect(wrapper.emitted("custom-select")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();

      const updateEvent = wrapper.emitted("update:modelValue")?.[0]?.[0];
      expect(updateEvent).toBe("custom");
    });
  });
});
