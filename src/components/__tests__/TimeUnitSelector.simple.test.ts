/**
 * TimeUnitSelector 组件简化单元测试
 *
 * 测试时间单位选择器的核心功能：
 * - 配置映射和验证
 * - 事件发送逻辑
 * - 状态管理
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import TimeUnitSelector from "../TimeUnitSelector.vue";
import type { TimeUnit, TimeUnitConfig } from "../../types/time-selection";

describe("TimeUnitSelector 核心功能测试", () => {
  let wrapper: any;

  const createWrapper = (props = {}) => {
    return mount(TimeUnitSelector, {
      props: {
        modelValue: "day",
        ...props,
      },
      global: {
        stubs: {
          "el-form-item": {
            template: '<div class="el-form-item"><slot /></div>',
          },
          "el-radio-group": {
            template: '<div class="el-radio-group"><slot /></div>',
            props: ["modelValue"],
            emits: ["update:modelValue", "change"],
          },
          "el-radio": {
            template:
              '<div class="el-radio" :data-value="value"><slot /></div>',
            props: ["value"],
          },
          "el-collapse": {
            template: '<div class="el-collapse"><slot /></div>',
          },
          "el-collapse-item": {
            template: '<div class="el-collapse-item"><slot /></div>',
          },
        },
      },
    });
  };

  beforeEach(() => {
    wrapper = createWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  // ============================================================================
  // 基础渲染测试
  // ============================================================================

  describe("基础渲染", () => {
    it("应该正确渲染组件", () => {
      expect(wrapper.find(".time-unit-selector").exists()).toBe(true);
      expect(wrapper.find(".time-unit-form-item").exists()).toBe(true);
    });

    it("应该正确设置初始状态", () => {
      const vm = wrapper.vm;
      expect(vm.selectedUnit).toBe("day");
      expect(vm.isValid).toBe(true);
    });

    it("应该支持自定义可用单位列表", () => {
      wrapper = createWrapper({
        availableUnits: ["year", "month"],
      });

      const vm = wrapper.vm;
      expect(vm.timeUnits).toHaveLength(2);
      expect(vm.timeUnits.map((unit: TimeUnitConfig) => unit.key)).toEqual([
        "year",
        "month",
      ]);
    });
  });

  // ============================================================================
  // 配置映射测试
  // ============================================================================

  describe("配置映射", () => {
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

    it("应该正确映射日单位配置", () => {
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
  // 事件发送测试
  // ============================================================================

  describe("事件发送", () => {
    it("应该在时间单位变更时发送正确的事件", async () => {
      const vm = wrapper.vm;

      // 模拟时间单位变更
      vm.setTimeUnit("month");
      await nextTick();

      const updateEvents = wrapper.emitted("update:modelValue");
      const changeEvents = wrapper.emitted("change");
      const pickerEvents = wrapper.emitted("picker-type-change");

      expect(updateEvents).toBeTruthy();
      expect(updateEvents![0]).toEqual(["month"]);

      expect(changeEvents).toBeTruthy();
      expect(changeEvents![0][0]).toBe("month");

      const config = changeEvents![0][1] as TimeUnitConfig;
      expect(config.key).toBe("month");

      expect(pickerEvents).toBeTruthy();
      // 第一个事件是初始挂载时的 'date'，第二个事件是切换到 'month' 时的 'month'
      expect(pickerEvents![pickerEvents!.length - 1][0]).toBe("month");
    });

    it("应该在组件挂载时发送初始选择器类型", () => {
      const pickerEvents = wrapper.emitted("picker-type-change");
      expect(pickerEvents).toBeTruthy();

      // 初始值是 'day'，对应的 pickerType 是 'date'
      expect(pickerEvents![0][0]).toBe("date");

      const config = pickerEvents![0][1] as TimeUnitConfig;
      expect(config.key).toBe("day");
    });
  });

  // ============================================================================
  // 验证逻辑测试
  // ============================================================================

  describe("验证逻辑", () => {
    it("应该验证时间单位的有效性", () => {
      const vm = wrapper.vm;
      expect(vm.isValid).toBe(true);
    });

    it("应该处理无效的时间单位", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      wrapper = createWrapper({
        modelValue: "invalid" as TimeUnit,
        availableUnits: ["year", "month", "day"],
      });

      // 应该重置为第一个可用单位
      expect(wrapper.vm.selectedUnit).toBe("year");

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
    });

    it("应该在关闭调试模式时隐藏调试信息", () => {
      wrapper = createWrapper({ showDebugInfo: false });

      expect(wrapper.find(".debug-info").exists()).toBe(false);
    });
  });

  // ============================================================================
  // 边界情况测试
  // ============================================================================

  describe("边界情况", () => {
    it("应该处理空的可用单位列表", () => {
      wrapper = createWrapper({ availableUnits: [] });

      const vm = wrapper.vm;
      expect(vm.timeUnits).toHaveLength(0);
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
  // 统一UPD字段策略测试
  // ============================================================================

  describe("统一UPD字段策略", () => {
    it("所有时间单位都应该使用UPD字段", () => {
      const vm = wrapper.vm;
      const timeUnits = vm.timeUnits;

      timeUnits.forEach((unit: TimeUnitConfig) => {
        expect(unit.dbField).toBe("UPD");
      });
    });

    it("应该为不同时间单位提供正确的分组表达式", () => {
      const vm = wrapper.vm;
      const timeUnits = vm.timeUnits;

      const expectedExpressions = {
        year: "YEAR(UPD)",
        month: "DATE_FORMAT(UPD, '%Y-%m')",
        day: "DATE(UPD)",
      };

      timeUnits.forEach((unit: TimeUnitConfig) => {
        expect(unit.groupByExpression).toBe(expectedExpressions[unit.key]);
      });
    });

    it("应该为不同时间单位提供正确的查询策略", () => {
      const vm = wrapper.vm;
      const timeUnits = vm.timeUnits;

      const expectedStrategies = {
        year: "year_range",
        month: "month_range",
        day: "date_range",
      };

      timeUnits.forEach((unit: TimeUnitConfig) => {
        expect(unit.queryStrategy).toBe(expectedStrategies[unit.key]);
      });
    });
  });
});
