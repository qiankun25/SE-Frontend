/**
 * TimeUnitSelector 组件单元测试
 *
 * 测试时间单位选择器的核心功能：
 * - 时间单位选择和切换
 * - 事件发送和处理
 * - 配置映射和验证
 * - 界面调整逻辑
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import TimeUnitSelector from "../TimeUnitSelector.vue";
import type { TimeUnit, TimeUnitConfig } from "../../types/time-selection";

// Mock Element Plus 组件
vi.mock("element-plus", () => ({
  ElFormItem: {
    name: "ElFormItem",
    template: '<div class="el-form-item"><slot /></div>',
    props: ["label"],
  },
  ElRadioGroup: {
    name: "ElRadioGroup",
    template: '<div class="el-radio-group"><slot /></div>',
    props: ["modelValue", "disabled"],
    emits: ["update:modelValue", "change"],
    setup(props: any, { emit }: any) {
      return {
        handleChange: (value: any) => {
          emit("update:modelValue", value);
          emit("change", value);
        },
      };
    },
  },
  ElRadio: {
    name: "ElRadio",
    template:
      '<label class="el-radio" :class="{ \'is-checked\': modelValue === value, \'is-disabled\': disabled }"><input type="radio" :value="value" :checked="modelValue === value" :disabled="disabled" @change="$emit(\'change\', value)" /><span class="el-radio__label"><slot /></span></label>',
    props: ["value", "disabled", "modelValue"],
    emits: ["change"],
  },
  ElCollapse: {
    name: "ElCollapse",
    template: '<div class="el-collapse"><slot /></div>',
  },
  ElCollapseItem: {
    name: "ElCollapseItem",
    template:
      '<div class="el-collapse-item"><div class="el-collapse-item__header">{{ title }}</div><div class="el-collapse-item__wrap"><slot /></div></div>',
    props: ["title", "name"],
  },
}));

describe("TimeUnitSelector", () => {
  let wrapper: VueWrapper<any>;

  // ============================================================================
  // 测试工具函数
  // ============================================================================

  const createWrapper = (props = {}) => {
    return mount(TimeUnitSelector, {
      props: {
        modelValue: "day",
        ...props,
      },
      global: {
        stubs: {
          "el-form-item": true,
          "el-radio-group": true,
          "el-radio": true,
          "el-collapse": true,
          "el-collapse-item": true,
        },
      },
    });
  };

  const findRadioByValue = (wrapper: VueWrapper<any>, value: TimeUnit) => {
    const radios = wrapper.findAll(".el-radio");
    return radios.find((radio) => {
      const input = radio.find('input[type="radio"]');
      return input.exists() && input.attributes("value") === value;
    });
  };

  // ============================================================================
  // 基础渲染测试
  // ============================================================================

  describe("基础渲染", () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it("应该正确渲染组件", () => {
      expect(wrapper.find(".time-unit-selector").exists()).toBe(true);
      expect(wrapper.find(".time-unit-form-item").exists()).toBe(true);
      expect(wrapper.find(".time-unit-radio-group").exists()).toBe(true);
    });

    it("应该渲染所有可用的时间单位选项", () => {
      const radios = wrapper.findAll(".el-radio");
      expect(radios).toHaveLength(3); // 年、月、日

      // 验证每个选项的标签
      const labels = radios.map((radio) =>
        radio.find(".el-radio__label").text()
      );
      expect(labels).toContain("年");
      expect(labels).toContain("月");
      expect(labels).toContain("日");
    });

    it("应该正确设置默认选中状态", () => {
      const dayRadio = findRadioByValue(wrapper, "day");
      expect(dayRadio?.classes()).toContain("is-checked");
    });

    it("应该支持自定义可用单位列表", () => {
      wrapper = createWrapper({
        availableUnits: ["year", "month"],
      });

      const radios = wrapper.findAll(".el-radio");
      expect(radios).toHaveLength(2);

      const labels = radios.map((radio) =>
        radio.find(".el-radio__label").text()
      );
      expect(labels).toContain("年");
      expect(labels).toContain("月");
      expect(labels).not.toContain("日");
    });
  });

  // ============================================================================
  // 交互功能测试
  // ============================================================================

  describe("交互功能", () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it("应该能够切换时间单位", async () => {
      const yearRadio = findRadioByValue(wrapper, "year");
      expect(yearRadio).toBeTruthy();

      // 点击年份选项
      await yearRadio!.find("input").trigger("change");
      await nextTick();

      // 验证选中状态变化
      expect(yearRadio!.classes()).toContain("is-checked");

      // 验证之前选中的选项不再选中
      const dayRadio = findRadioByValue(wrapper, "day");
      expect(dayRadio!.classes()).not.toContain("is-checked");
    });

    it("应该在禁用状态下不响应点击", async () => {
      wrapper = createWrapper({ disabled: true });

      const radios = wrapper.findAll(".el-radio");
      radios.forEach((radio) => {
        expect(radio.classes()).toContain("is-disabled");
        const input = radio.find("input");
        expect(input.attributes("disabled")).toBeDefined();
      });
    });

    it("应该支持通过 modelValue 外部控制选中状态", async () => {
      await wrapper.setProps({ modelValue: "month" });
      await nextTick();

      const monthRadio = findRadioByValue(wrapper, "month");
      expect(monthRadio?.classes()).toContain("is-checked");
    });
  });

  // ============================================================================
  // 事件发送测试
  // ============================================================================

  describe("事件发送", () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it("应该发送 update:modelValue 事件", async () => {
      const yearRadio = findRadioByValue(wrapper, "year");
      await yearRadio!.find("input").trigger("change");

      const updateEvents = wrapper.emitted("update:modelValue");
      expect(updateEvents).toBeTruthy();
      expect(updateEvents![0]).toEqual(["year"]);
    });

    it("应该发送 change 事件并包含配置信息", async () => {
      const monthRadio = findRadioByValue(wrapper, "month");
      await monthRadio!.find("input").trigger("change");

      const changeEvents = wrapper.emitted("change");
      expect(changeEvents).toBeTruthy();
      expect(changeEvents![0][0]).toBe("month");

      // 验证配置对象
      const config = changeEvents![0][1] as TimeUnitConfig;
      expect(config).toMatchObject({
        key: "month",
        label: "月",
        dbField: "UPD",
        queryStrategy: "month_range",
        groupByExpression: "DATE_FORMAT(UPD, '%Y-%m')",
        pickerType: "month",
      });
    });

    it("应该发送 picker-type-change 事件", async () => {
      const yearRadio = findRadioByValue(wrapper, "year");
      await yearRadio!.find("input").trigger("change");

      const pickerEvents = wrapper.emitted("picker-type-change");
      expect(pickerEvents).toBeTruthy();
      expect(pickerEvents![0][0]).toBe("year");

      // 验证配置对象
      const config = pickerEvents![0][1] as TimeUnitConfig;
      expect(config.key).toBe("year");
      expect(config.pickerType).toBe("year");
    });
  });

  // ============================================================================
  // 配置映射测试
  // ============================================================================

  describe("配置映射", () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it("应该正确映射年单位配置", async () => {
      await wrapper.setProps({ modelValue: "year" });

      const vm = wrapper.vm;
      const config = vm.getCurrentConfig();

      expect(config).toMatchObject({
        key: "year",
        label: "年",
        dbField: "UPD",
        queryStrategy: "year_range",
        groupByExpression: "YEAR(UPD)",
        pickerType: "year",
        defaultRange: 5,
      });
    });

    it("应该正确映射月单位配置", async () => {
      await wrapper.setProps({ modelValue: "month" });

      const vm = wrapper.vm;
      const config = vm.getCurrentConfig();

      expect(config).toMatchObject({
        key: "month",
        label: "月",
        dbField: "UPD",
        queryStrategy: "month_range",
        groupByExpression: "DATE_FORMAT(UPD, '%Y-%m')",
        pickerType: "month",
        defaultRange: 2,
      });
    });

    it("应该正确映射日单位配置", async () => {
      await wrapper.setProps({ modelValue: "day" });

      const vm = wrapper.vm;
      const config = vm.getCurrentConfig();

      expect(config).toMatchObject({
        key: "day",
        label: "日",
        dbField: "UPD",
        queryStrategy: "date_range",
        groupByExpression: "DATE(UPD)",
        pickerType: "date",
        defaultRange: 1,
      });
    });
  });

  // ============================================================================
  // 验证逻辑测试
  // ============================================================================

  describe("验证逻辑", () => {
    it("应该验证时间单位的有效性", () => {
      wrapper = createWrapper({ modelValue: "day" });
      const vm = wrapper.vm;
      expect(vm.isValid).toBe(true);
    });

    it("应该处理无效的时间单位", () => {
      // 模拟控制台警告
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      wrapper = createWrapper({
        modelValue: "invalid" as TimeUnit,
        availableUnits: ["year", "month", "day"],
      });

      // 应该重置为第一个可用单位
      expect(wrapper.vm.selectedUnit).toBe("year");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("应该在可用单位列表变化时自动调整", async () => {
      wrapper = createWrapper({
        modelValue: "day",
        availableUnits: ["year", "month", "day"],
      });

      // 改变可用单位列表，移除当前选中的 'day'
      await wrapper.setProps({ availableUnits: ["year", "month"] });
      await nextTick();

      // 应该自动切换到第一个可用单位
      expect(wrapper.vm.selectedUnit).toBe("year");
    });
  });

  // ============================================================================
  // 暴露方法测试
  // ============================================================================

  describe("暴露方法", () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it("应该提供 setTimeUnit 方法", () => {
      const vm = wrapper.vm;

      vm.setTimeUnit("month");
      expect(vm.selectedUnit).toBe("month");

      // 验证事件发送
      const updateEvents = wrapper.emitted("update:modelValue");
      expect(updateEvents).toBeTruthy();
      expect(updateEvents![0]).toEqual(["month"]);
    });

    it("应该提供 getCurrentConfig 方法", () => {
      const vm = wrapper.vm;

      vm.setTimeUnit("year");
      const config = vm.getCurrentConfig();

      expect(config?.key).toBe("year");
      expect(config?.label).toBe("年");
    });

    it("应该提供 resetToDefault 方法", () => {
      const vm = wrapper.vm;

      // 先切换到其他单位
      vm.setTimeUnit("year");
      expect(vm.selectedUnit).toBe("year");

      // 重置到默认
      vm.resetToDefault();
      expect(vm.selectedUnit).toBe("year"); // 第一个可用单位
    });
  });

  // ============================================================================
  // 调试信息测试
  // ============================================================================

  describe("调试信息", () => {
    it("应该在开启调试模式时显示调试信息", () => {
      wrapper = createWrapper({ showDebugInfo: true });

      expect(wrapper.find(".debug-info").exists()).toBe(true);
      expect(wrapper.find(".debug-content").exists()).toBe(true);
    });

    it("应该在关闭调试模式时隐藏调试信息", () => {
      wrapper = createWrapper({ showDebugInfo: false });

      expect(wrapper.find(".debug-info").exists()).toBe(false);
    });

    it("应该显示正确的调试信息内容", () => {
      wrapper = createWrapper({
        showDebugInfo: true,
        modelValue: "month",
      });

      const debugContent = wrapper.find(".debug-content");
      const text = debugContent.text();

      expect(text).toContain("month");
      expect(text).toContain("月");
      expect(text).toContain("UPD");
      expect(text).toContain("month_range");
      expect(text).toContain("DATE_FORMAT(UPD, '%Y-%m')");
    });
  });

  // ============================================================================
  // 边界情况测试
  // ============================================================================

  describe("边界情况", () => {
    it("应该处理空的可用单位列表", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      wrapper = createWrapper({ availableUnits: [] });

      const radios = wrapper.findAll(".el-radio");
      expect(radios).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it("应该处理重复的单位切换", () => {
      wrapper = createWrapper({ modelValue: "day" });
      const vm = wrapper.vm;

      // 切换到相同单位应该不触发事件
      const initialEventCount =
        wrapper.emitted("update:modelValue")?.length || 0;
      vm.setTimeUnit("day");

      const finalEventCount = wrapper.emitted("update:modelValue")?.length || 0;
      expect(finalEventCount).toBe(initialEventCount);
    });

    it("应该处理不在可用列表中的单位设置", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      wrapper = createWrapper({ availableUnits: ["year", "month"] });
      const vm = wrapper.vm;

      vm.setTimeUnit("day"); // 不在可用列表中
      expect(vm.selectedUnit).not.toBe("day");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // 清理
  // ============================================================================

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });
});
