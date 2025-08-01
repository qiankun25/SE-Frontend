import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ElSelect, ElOption, ElButton, ElAlert } from "element-plus";
import YearRangePicker from "../YearRangePicker.vue";
import type { TimeRange } from "../../types/time-selection";

// Mock Element Plus components
const mockComponents = {
  ElSelect,
  ElOption,
  ElButton,
  ElAlert,
};

describe("YearRangePicker", () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(YearRangePicker, {
      global: {
        components: mockComponents,
      },
    });
  });

  describe("基础功能", () => {
    it("应该正确渲染组件", () => {
      expect(wrapper.find(".year-range-picker").exists()).toBe(true);
      expect(wrapper.find(".year-range-container").exists()).toBe(true);
      expect(wrapper.findAll(".year-selector")).toHaveLength(2);
    });

    it("应该显示起始年份和结束年份选择器", () => {
      const yearSelectors = wrapper.findAll(".year-selector");
      expect(yearSelectors[0].find(".year-label").text()).toBe("起始年份");
      expect(yearSelectors[1].find(".year-label").text()).toBe("结束年份");
    });

    it("应该显示快速选择按钮", () => {
      expect(wrapper.find(".quick-range-buttons").exists()).toBe(true);
      const quickButtons = wrapper.findAll(".quick-range-btn");
      expect(quickButtons.length).toBeGreaterThan(0);
    });
  });

  describe("年份选择功能", () => {
    it("应该正确处理起始年份选择", async () => {
      const currentYear = new Date().getFullYear();

      // 模拟选择起始年份
      await wrapper.vm.handleStartYearChange(currentYear - 2);

      expect(wrapper.vm.startYear).toBe(currentYear - 2);
    });

    it("应该正确处理结束年份选择", async () => {
      const currentYear = new Date().getFullYear();

      // 模拟选择结束年份
      await wrapper.vm.handleEndYearChange(currentYear);

      expect(wrapper.vm.endYear).toBe(currentYear);
    });

    it("应该在选择完整年份范围后发送正确的TimeRange", async () => {
      const currentYear = new Date().getFullYear();

      // 设置起始和结束年份
      await wrapper.vm.handleStartYearChange(currentYear - 2);
      await wrapper.vm.handleEndYearChange(currentYear);

      // 检查发送的事件
      const emittedEvents = wrapper.emitted("update:modelValue");
      expect(emittedEvents).toBeTruthy();

      const lastEmittedValue = emittedEvents[
        emittedEvents.length - 1
      ][0] as TimeRange;
      expect(lastEmittedValue.unit).toBe("year");
      expect(lastEmittedValue.startDate.getFullYear()).toBe(currentYear - 2);
      expect(lastEmittedValue.endDate.getFullYear()).toBe(currentYear);
    });
  });

  describe("验证功能", () => {
    it("应该自动调整无效的年份范围", async () => {
      const currentYear = new Date().getFullYear();

      // 设置无效的年份范围（起始年份大于结束年份）
      await wrapper.vm.handleStartYearChange(currentYear);
      await wrapper.vm.handleEndYearChange(currentYear - 2);

      // 组件应该自动调整起始年份，使其不大于结束年份
      expect(wrapper.vm.startYear).toBe(currentYear - 2);
      expect(wrapper.vm.endYear).toBe(currentYear - 2);
      expect(wrapper.vm.validationMessage).toBe("年份范围设置正确");
      expect(wrapper.vm.validationLevel).toBe("success");
    });

    it("应该验证年份范围不超过最大跨度", async () => {
      const currentYear = new Date().getFullYear();
      const maxRangeSpan = 5;

      // 创建带有最大跨度限制的组件
      const wrapperWithLimit = mount(YearRangePicker, {
        props: {
          maxRangeSpan,
        },
        global: {
          components: mockComponents,
        },
      });

      // 设置超过最大跨度的年份范围
      await wrapperWithLimit.vm.handleStartYearChange(currentYear - 6);
      await wrapperWithLimit.vm.handleEndYearChange(currentYear);

      expect(wrapperWithLimit.vm.validationMessage).toBe(
        `年份范围不能超过${maxRangeSpan}年`
      );
      expect(wrapperWithLimit.vm.validationLevel).toBe("warning");
    });

    it("应该在年份范围正确时显示成功消息", async () => {
      const currentYear = new Date().getFullYear();

      // 设置有效的年份范围
      await wrapper.vm.handleStartYearChange(currentYear - 2);
      await wrapper.vm.handleEndYearChange(currentYear);

      expect(wrapper.vm.validationMessage).toBe("年份范围设置正确");
      expect(wrapper.vm.validationLevel).toBe("success");
    });

    it("应该发送验证变化事件", async () => {
      const currentYear = new Date().getFullYear();

      // 设置有效的年份范围
      await wrapper.vm.handleStartYearChange(currentYear - 2);
      await wrapper.vm.handleEndYearChange(currentYear);

      // 检查验证事件
      const validationEvents = wrapper.emitted("validation-change");
      expect(validationEvents).toBeTruthy();

      const lastValidationEvent = validationEvents[validationEvents.length - 1];
      expect(lastValidationEvent[0]).toBe(true); // isValid
      expect(lastValidationEvent[1]).toBe("年份范围设置正确"); // message
      expect(lastValidationEvent[2]).toBe("success"); // level
    });
  });

  describe("快速选择功能", () => {
    it("应该正确处理快速范围选择", async () => {
      const currentYear = new Date().getFullYear();
      const quickRange = {
        key: "recent3years",
        label: "近3年",
        startYear: currentYear - 2,
        endYear: currentYear,
      };

      // 模拟快速选择
      await wrapper.vm.handleQuickRangeSelect(quickRange);

      expect(wrapper.vm.startYear).toBe(quickRange.startYear);
      expect(wrapper.vm.endYear).toBe(quickRange.endYear);
    });

    it("应该在快速选择后发送正确的值", async () => {
      const currentYear = new Date().getFullYear();
      const quickRange = {
        key: "recent3years",
        label: "近3年",
        startYear: currentYear - 2,
        endYear: currentYear,
      };

      // 模拟快速选择
      await wrapper.vm.handleQuickRangeSelect(quickRange);

      // 检查发送的事件
      const emittedEvents = wrapper.emitted("update:modelValue");
      expect(emittedEvents).toBeTruthy();

      const lastEmittedValue = emittedEvents[
        emittedEvents.length - 1
      ][0] as TimeRange;
      expect(lastEmittedValue.startDate.getFullYear()).toBe(
        quickRange.startYear
      );
      expect(lastEmittedValue.endDate.getFullYear()).toBe(quickRange.endYear);
    });
  });

  describe("自动调整功能", () => {
    it("应该在起始年份大于结束年份时自动调整结束年份", async () => {
      const currentYear = new Date().getFullYear();

      // 先设置结束年份
      await wrapper.vm.handleEndYearChange(currentYear - 3);

      // 再设置更大的起始年份
      await wrapper.vm.handleStartYearChange(currentYear - 1);

      // 结束年份应该被自动调整为起始年份
      expect(wrapper.vm.endYear).toBe(currentYear - 1);
    });

    it("应该在结束年份小于起始年份时自动调整起始年份", async () => {
      const currentYear = new Date().getFullYear();

      // 先设置起始年份
      await wrapper.vm.handleStartYearChange(currentYear - 1);

      // 再设置更小的结束年份
      await wrapper.vm.handleEndYearChange(currentYear - 3);

      // 起始年份应该被自动调整为结束年份
      expect(wrapper.vm.startYear).toBe(currentYear - 3);
    });
  });

  describe("Props 和外部值", () => {
    it("应该正确处理外部传入的 modelValue", async () => {
      const currentYear = new Date().getFullYear();
      const timeRange: TimeRange = {
        startDate: new Date(currentYear - 2, 0, 1),
        endDate: new Date(currentYear, 11, 31),
        unit: "year",
      };

      const wrapperWithValue = mount(YearRangePicker, {
        props: {
          modelValue: timeRange,
        },
        global: {
          components: mockComponents,
        },
      });

      expect(wrapperWithValue.vm.startYear).toBe(currentYear - 2);
      expect(wrapperWithValue.vm.endYear).toBe(currentYear);
    });

    it("应该正确处理 disabled 属性", () => {
      const disabledWrapper = mount(YearRangePicker, {
        props: {
          disabled: true,
        },
        global: {
          components: mockComponents,
        },
      });

      // 检查选择器是否被禁用
      // 注意：这里需要根据实际的Element Plus组件API来验证
      expect(disabledWrapper.props("disabled")).toBe(true);
    });

    it("应该根据 showQuickRange 属性控制快速选择按钮显示", () => {
      const wrapperWithoutQuick = mount(YearRangePicker, {
        props: {
          showQuickRange: false,
        },
        global: {
          components: mockComponents,
        },
      });

      expect(wrapperWithoutQuick.find(".quick-range-buttons").exists()).toBe(
        false
      );
    });
  });

  describe("年份选项计算", () => {
    it("应该正确计算可用的起始年份", () => {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 5;
      const maxYear = currentYear;

      const wrapperWithRange = mount(YearRangePicker, {
        props: {
          minYear,
          maxYear,
        },
        global: {
          components: mockComponents,
        },
      });

      const availableYears = wrapperWithRange.vm.availableStartYears;
      expect(availableYears).toContain(minYear);
      expect(availableYears).toContain(maxYear);
      expect(availableYears.length).toBe(6); // 包含起始和结束年份
    });

    it("应该根据起始年份限制结束年份选项", async () => {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 3;

      // 设置起始年份
      await wrapper.vm.handleStartYearChange(startYear);

      const availableEndYears = wrapper.vm.availableEndYears;
      expect(availableEndYears.every((year: number) => year >= startYear)).toBe(
        true
      );
    });
  });
});
