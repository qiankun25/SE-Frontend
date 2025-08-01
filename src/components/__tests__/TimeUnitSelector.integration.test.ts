/**
 * TimeUnitSelector 组件集成测试
 *
 * 测试时间单位选择器与整个时间选择系统的集成：
 * - 与时间选择状态管理的集成
 * - 与参数映射器的集成
 * - 与查询构建器的集成
 * - 界面调整逻辑的集成测试
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import TimeUnitSelector from "../TimeUnitSelector.vue";
import type {
  TimeUnit,
  TimeUnitConfig,
  TimeSelectionState,
} from "../../types/time-selection";
import {
  TIME_SELECTION_CONFIG,
  getTimeUnitConfig,
} from "../../config/time-selection";

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
      '<label class="el-radio" :class="{ \'is-checked\': modelValue === value }"><input type="radio" :value="value" :checked="modelValue === value" @change="$emit(\'change\', value)" /><span class="el-radio__label"><slot /></span></label>',
    props: ["value", "disabled", "modelValue"],
    emits: ["change"],
  },
  ElCollapse: {
    name: "ElCollapse",
    template: '<div class="el-collapse"><slot /></div>',
  },
  ElCollapseItem: {
    name: "ElCollapseItem",
    template: '<div class="el-collapse-item"><slot /></div>',
    props: ["title", "name"],
  },
}));

describe("TimeUnitSelector 集成测试", () => {
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

  // 模拟时间选择状态管理器
  class MockTimeSelectionStateManager {
    private state: TimeSelectionState = {
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

    updateTimeUnit(unit: TimeUnit, config: TimeUnitConfig) {
      this.state.timeUnit = unit;
      // 根据时间单位调整其他相关状态
      this.adjustRelatedState(config);
    }

    private adjustRelatedState(config: TimeUnitConfig) {
      // 根据时间单位调整统计模式
      if (config.key === "year") {
        this.state.statisticsMode = "yearly";
      } else if (config.key === "month") {
        this.state.statisticsMode = "monthly";
      } else {
        this.state.statisticsMode = "daily";
      }
    }

    getState(): TimeSelectionState {
      return { ...this.state };
    }
  }

  // 模拟参数映射器
  class MockParameterMapper {
    mapToQueryParams(state: TimeSelectionState) {
      const unitConfig = getTimeUnitConfig(state.timeUnit);
      if (!unitConfig) {
        throw new Error(`无效的时间单位: ${state.timeUnit}`);
      }

      return {
        timeUnit: state.timeUnit,
        dbTimeField: "UPD" as const,
        queryStrategy: unitConfig.queryStrategy,
        groupByExpression: unitConfig.groupByExpression,
        enableComparison: state.comparisonEnabled,
        startDate: state.timeRange?.startDate?.toISOString().split("T")[0],
        endDate: state.timeRange?.endDate?.toISOString().split("T")[0],
      };
    }
  }

  // ============================================================================
  // 配置集成测试
  // ============================================================================

  describe("配置系统集成", () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it("应该正确加载时间单位配置", () => {
      const vm = wrapper.vm;
      const timeUnits = vm.timeUnits;

      expect(timeUnits).toHaveLength(3);
      expect(timeUnits.map((unit: TimeUnitConfig) => unit.key)).toEqual([
        "year",
        "month",
        "day",
      ]);

      // 验证每个配置都包含必要字段
      timeUnits.forEach((unit: TimeUnitConfig) => {
        expect(unit).toHaveProperty("key");
        expect(unit).toHaveProperty("label");
        expect(unit).toHaveProperty("dbField", "UPD");
        expect(unit).toHaveProperty("queryStrategy");
        expect(unit).toHaveProperty("groupByExpression");
        expect(unit).toHaveProperty("pickerType");
        expect(unit).toHaveProperty("defaultRange");
      });
    });

    it("应该与全局配置保持一致", () => {
      const configUnits = TIME_SELECTION_CONFIG.timeUnits;
      const vm = wrapper.vm;
      const componentUnits = vm.timeUnits;

      expect(componentUnits).toEqual(configUnits);
    });

    it("应该支持配置的动态更新", async () => {
      // 模拟配置更新
      await wrapper.setProps({
        availableUnits: ["year", "month"], // 移除日单位
      });

      const vm = wrapper.vm;
      const timeUnits = vm.timeUnits;

      expect(timeUnits).toHaveLength(2);
      expect(timeUnits.map((unit: TimeUnitConfig) => unit.key)).toEqual([
        "year",
        "month",
      ]);
    });
  });

  // ============================================================================
  // 状态管理集成测试
  // ============================================================================

  describe("状态管理集成", () => {
    let stateManager: MockTimeSelectionStateManager;

    beforeEach(() => {
      stateManager = new MockTimeSelectionStateManager();
      wrapper = createWrapper();
    });

    it("应该正确更新时间选择状态", async () => {
      const yearRadio = findRadioByValue(wrapper, "year");
      await yearRadio!.find("input").trigger("change");

      const changeEvents = wrapper.emitted("change");
      expect(changeEvents).toBeTruthy();

      const [unit, config] = changeEvents![0];
      stateManager.updateTimeUnit(unit, config);

      const state = stateManager.getState();
      expect(state.timeUnit).toBe("year");
      expect(state.statisticsMode).toBe("yearly");
    });

    it("应该处理状态变化的级联效应", async () => {
      // 切换到月单位
      const monthRadio = findRadioByValue(wrapper, "month");
      await monthRadio!.find("input").trigger("change");

      const changeEvents = wrapper.emitted("change");
      const [unit, config] = changeEvents![0];
      stateManager.updateTimeUnit(unit, config);

      const state = stateManager.getState();
      expect(state.timeUnit).toBe("month");
      expect(state.statisticsMode).toBe("monthly");
    });

    it("应该维护状态的一致性", async () => {
      // 连续切换多个单位
      const units: TimeUnit[] = ["year", "month", "day"];

      for (const unit of units) {
        const radio = findRadioByValue(wrapper, unit);
        await radio!.find("input").trigger("change");

        const changeEvents = wrapper.emitted("change");
        const [emittedUnit, config] = changeEvents![changeEvents!.length - 1];
        stateManager.updateTimeUnit(emittedUnit, config);

        const state = stateManager.getState();
        expect(state.timeUnit).toBe(unit);
      }
    });
  });

  // ============================================================================
  // 参数映射集成测试
  // ============================================================================

  describe("参数映射集成", () => {
    let stateManager: MockTimeSelectionStateManager;
    let parameterMapper: MockParameterMapper;

    beforeEach(() => {
      stateManager = new MockTimeSelectionStateManager();
      parameterMapper = new MockParameterMapper();
      wrapper = createWrapper();
    });

    it("应该正确映射年单位参数", async () => {
      const yearRadio = findRadioByValue(wrapper, "year");
      await yearRadio!.find("input").trigger("change");

      const changeEvents = wrapper.emitted("change");
      const [unit, config] = changeEvents![0];
      stateManager.updateTimeUnit(unit, config);

      const state = stateManager.getState();
      const queryParams = parameterMapper.mapToQueryParams(state);

      expect(queryParams).toMatchObject({
        timeUnit: "year",
        dbTimeField: "UPD",
        queryStrategy: "year_range",
        groupByExpression: "YEAR(UPD)",
        enableComparison: false,
      });
    });

    it("应该正确映射月单位参数", async () => {
      const monthRadio = findRadioByValue(wrapper, "month");
      await monthRadio!.find("input").trigger("change");

      const changeEvents = wrapper.emitted("change");
      const [unit, config] = changeEvents![0];
      stateManager.updateTimeUnit(unit, config);

      const state = stateManager.getState();
      const queryParams = parameterMapper.mapToQueryParams(state);

      expect(queryParams).toMatchObject({
        timeUnit: "month",
        dbTimeField: "UPD",
        queryStrategy: "month_range",
        groupByExpression: "DATE_FORMAT(UPD, '%Y-%m')",
        enableComparison: false,
      });
    });

    it("应该正确映射日单位参数", async () => {
      // 日单位是默认值，直接测试
      const state = stateManager.getState();
      const queryParams = parameterMapper.mapToQueryParams(state);

      expect(queryParams).toMatchObject({
        timeUnit: "day",
        dbTimeField: "UPD",
        queryStrategy: "date_range",
        groupByExpression: "DATE(UPD)",
        enableComparison: false,
      });
    });
  });

  // ============================================================================
  // 界面调整集成测试
  // ============================================================================

  describe("界面调整集成", () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it("应该发送正确的选择器类型变更事件", async () => {
      const testCases = [
        { unit: "year" as TimeUnit, expectedPickerType: "year" },
        { unit: "month" as TimeUnit, expectedPickerType: "month" },
        { unit: "day" as TimeUnit, expectedPickerType: "date" },
      ];

      for (const { unit, expectedPickerType } of testCases) {
        const radio = findRadioByValue(wrapper, unit);
        await radio!.find("input").trigger("change");

        const pickerEvents = wrapper.emitted("picker-type-change");
        expect(pickerEvents).toBeTruthy();

        const lastEvent = pickerEvents![pickerEvents!.length - 1];
        expect(lastEvent[0]).toBe(expectedPickerType);

        const config = lastEvent[1] as TimeUnitConfig;
        expect(config.key).toBe(unit);
        expect(config.pickerType).toBe(expectedPickerType);
      }
    });

    it("应该在组件挂载时发送初始选择器类型", () => {
      const pickerEvents = wrapper.emitted("picker-type-change");
      expect(pickerEvents).toBeTruthy();

      // 初始值是 'day'，对应的 pickerType 是 'date'
      expect(pickerEvents![0][0]).toBe("date");

      const config = pickerEvents![0][1] as TimeUnitConfig;
      expect(config.key).toBe("day");
    });

    it("应该提供完整的配置信息用于界面调整", async () => {
      const yearRadio = findRadioByValue(wrapper, "year");
      await yearRadio!.find("input").trigger("change");

      const pickerEvents = wrapper.emitted("picker-type-change");
      const config = pickerEvents![
        pickerEvents!.length - 1
      ][1] as TimeUnitConfig;

      // 验证配置包含界面调整所需的所有信息
      expect(config).toHaveProperty("key", "year");
      expect(config).toHaveProperty("label", "年");
      expect(config).toHaveProperty("pickerType", "year");
      expect(config).toHaveProperty("defaultRange", 5);
      expect(config).toHaveProperty("minRange");
      expect(config).toHaveProperty("maxRange");
    });
  });

  // ============================================================================
  // 错误处理集成测试
  // ============================================================================

  describe("错误处理集成", () => {
    it("应该处理配置加载错误", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // 模拟配置错误
      wrapper = createWrapper({
        availableUnits: ["invalid" as TimeUnit],
      });

      // 组件应该能够处理错误并回退到安全状态
      expect(wrapper.vm.selectedUnit).toBeDefined();

      consoleSpy.mockRestore();
    });

    it("应该处理状态同步错误", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // 模拟无效的时间单位切换
      const vm = wrapper.vm;

      // 尝试设置无效单位
      try {
        vm.setTimeUnit("invalid" as TimeUnit);
      } catch (error) {
        // 应该能够优雅处理错误
      }

      // 组件状态应该保持稳定
      expect(vm.selectedUnit).toBeDefined();
      expect(["year", "month", "day"]).toContain(vm.selectedUnit);

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // 性能集成测试
  // ============================================================================

  describe("性能集成", () => {
    it("应该高效处理频繁的单位切换", async () => {
      const startTime = performance.now();

      // 模拟频繁切换
      const units: TimeUnit[] = ["year", "month", "day"];
      for (let i = 0; i < 100; i++) {
        const unit = units[i % units.length];
        const radio = findRadioByValue(wrapper, unit);
        await radio!.find("input").trigger("change");
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 性能要求：100次切换应该在100ms内完成
      expect(duration).toBeLessThan(100);
    });

    it("应该避免不必要的重新渲染", async () => {
      let renderCount = 0;

      // 监听组件更新
      wrapper.vm.$nextTick(() => {
        renderCount++;
      });

      // 切换到相同单位不应该触发重新渲染
      const vm = wrapper.vm;
      const currentUnit = vm.selectedUnit;

      vm.setTimeUnit(currentUnit);
      await nextTick();

      // 渲染次数应该保持不变
      expect(renderCount).toBe(0);
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
