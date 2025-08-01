import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ElAlert } from "element-plus";
import TimeRangePickerNew from "../TimeRangePickerNew.vue";
import YearRangePicker from "../YearRangePicker.vue";
import MonthRangePicker from "../MonthRangePicker.vue";
import DateRangePicker from "../DateRangePicker.vue";
import type { TimeRange, TimeUnit } from "../../types/time-selection";

// Mock子组件
const mockComponents = {
  ElAlert,
  YearRangePicker,
  MonthRangePicker,
  DateRangePicker,
};

describe("TimeRangePickerNew", () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(TimeRangePickerNew, {
      props: {
        timeUnit: "day" as TimeUnit,
      },
      global: {
        components: mockComponents,
      },
    });
  });

  describe("基础功能", () => {
    it("应该正确渲染组件", () => {
      expect(wrapper.find(".time-range-picker").exists()).toBe(true);
    });

    it("应该根据timeUnit显示对应的选择器", async () => {
      // 测试日期选择器
      await wrapper.setProps({ timeUnit: "day" });
      expect(wrapper.findComponent(DateRangePicker).exists()).toBe(true);
      expect(wrapper.findComponent(YearRangePicker).exists()).toBe(false);
      expect(wrapper.findComponent(MonthRangePicker).exists()).toBe(false);

      // 测试年份选择器
      await wrapper.setProps({ timeUnit: "year" });
      expect(wrapper.findComponent(YearRangePicker).exists()).toBe(true);
      expect(wrapper.findComponent(DateRangePicker).exists()).toBe(false);
      expect(wrapper.findComponent(MonthRangePicker).exists()).toBe(false);

      // 测试月份选择器
      await wrapper.setProps({ timeUnit: "month" });
      expect(wrapper.findComponent(MonthRangePicker).exists()).toBe(true);
      expect(wrapper.findComponent(YearRangePicker).exists()).toBe(false);
      expect(wrapper.findComponent(DateRangePicker).exists()).toBe(false);
    });
  });

  describe("年份选择器集成", () => {
    beforeEach(async () => {
      await wrapper.setProps({ timeUnit: "year" });
    });

    it("应该正确传递年份选择器的props", () => {
      const yearPicker = wrapper.findComponent(YearRangePicker);
      expect(yearPicker.exists()).toBe(true);

      // 检查默认props
      expect(yearPicker.props("showQuickRange")).toBe(true);
      expect(yearPicker.props("maxRangeSpan")).toBe(10);
    });

    it("应该正确处理年份选择器的事件", async () => {
      const currentYear = new Date().getFullYear();
      const timeRange: TimeRange = {
        startDate: new Date(currentYear - 2, 0, 1),
        endDate: new Date(currentYear, 11, 31),
        unit: "year",
      };

      // 模拟年份选择器的change事件
      await wrapper.vm.handleTimeRangeChange(timeRange);

      // 检查事件是否正确发送
      const changeEvents = wrapper.emitted("change");
      expect(changeEvents).toBeTruthy();
      expect(changeEvents[changeEvents.length - 1][0]).toEqual(timeRange);

      const updateEvents = wrapper.emitted("update:modelValue");
      expect(updateEvents).toBeTruthy();
      expect(updateEvents[updateEvents.length - 1][0]).toEqual(timeRange);
    });
  });

  describe("月份选择器集成", () => {
    beforeEach(async () => {
      await wrapper.setProps({ timeUnit: "month" });
    });

    it("应该正确传递月份选择器的props", () => {
      const monthPicker = wrapper.findComponent(MonthRangePicker);
      expect(monthPicker.exists()).toBe(true);

      // 检查默认props
      expect(monthPicker.props("showQuickJump")).toBe(true);
      expect(monthPicker.props("maxMonthSpan")).toBe(24);
    });

    it("应该正确处理月份选择器的事件", async () => {
      const currentYear = new Date().getFullYear();
      const timeRange: TimeRange = {
        startDate: new Date(currentYear, 5, 1), // 6月1日
        endDate: new Date(currentYear, 11, 31), // 12月31日
        unit: "month",
      };

      // 模拟月份选择器的change事件
      await wrapper.vm.handleTimeRangeChange(timeRange);

      // 检查事件是否正确发送
      const changeEvents = wrapper.emitted("change");
      expect(changeEvents).toBeTruthy();
      expect(changeEvents[changeEvents.length - 1][0]).toEqual(timeRange);
    });
  });

  describe("日期选择器集成", () => {
    beforeEach(async () => {
      await wrapper.setProps({ timeUnit: "day" });
    });

    it("应该正确传递日期选择器的props", () => {
      const datePicker = wrapper.findComponent(DateRangePicker);
      expect(datePicker.exists()).toBe(true);

      // 检查默认props
      expect(datePicker.props("showQuickDates")).toBe(true);
      expect(datePicker.props("useBuiltinShortcuts")).toBe(true);
      expect(datePicker.props("maxDaysSpan")).toBe(365);
      expect(datePicker.props("allowFutureDates")).toBe(false);
    });

    it("应该正确处理日期选择器的事件", async () => {
      const timeRange: TimeRange = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        unit: "day",
      };

      // 模拟日期选择器的change事件
      await wrapper.vm.handleTimeRangeChange(timeRange);

      // 检查事件是否正确发送
      const changeEvents = wrapper.emitted("change");
      expect(changeEvents).toBeTruthy();
      expect(changeEvents[changeEvents.length - 1][0]).toEqual(timeRange);
    });
  });

  describe("验证功能集成", () => {
    it("应该正确处理验证状态变化", async () => {
      // 模拟验证状态变化
      await wrapper.vm.handleValidationChange(true, "设置正确", "success");

      // 检查验证事件是否发送
      const validationEvents = wrapper.emitted("validation-change");
      expect(validationEvents).toBeTruthy();

      const lastValidationEvent =
        validationEvents[validationEvents.length - 1][0];
      expect(lastValidationEvent.isValid).toBe(true);
      expect(lastValidationEvent.message).toBe("设置正确");
      expect(lastValidationEvent.level).toBe("success");
    });

    it("应该显示验证状态", async () => {
      // 设置验证结果
      await wrapper.vm.handleValidationChange(false, "设置错误", "error");

      // 检查验证状态是否显示
      expect(wrapper.find(".validation-status").exists()).toBe(true);
      expect(wrapper.findComponent(ElAlert).exists()).toBe(true);
    });

    it("应该根据showValidationStatus控制验证状态显示", async () => {
      // 隐藏验证状态
      await wrapper.setProps({ showValidationStatus: false });
      await wrapper.vm.handleValidationChange(false, "设置错误", "error");

      expect(wrapper.find(".validation-status").exists()).toBe(false);
    });
  });

  describe("外部值处理", () => {
    it("应该正确处理外部传入的modelValue", async () => {
      const timeRange: TimeRange = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        unit: "day",
      };

      await wrapper.setProps({ modelValue: timeRange });

      expect(wrapper.vm.timeRange).toEqual(timeRange);
    });

    it("应该在timeUnit变化时清空当前选择", async () => {
      // 先设置一个值
      const timeRange: TimeRange = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        unit: "day",
      };
      await wrapper.setProps({ modelValue: timeRange });
      expect(wrapper.vm.timeRange).toEqual(timeRange);

      // 改变时间单位
      await wrapper.setProps({ timeUnit: "year" });

      // 检查值是否被清空
      expect(wrapper.vm.timeRange).toBeNull();
      expect(wrapper.vm.validationResult).toEqual({
        isValid: true,
        message: "",
        level: "success",
      });

      // 检查事件是否发送
      const updateEvents = wrapper.emitted("update:modelValue");
      const changeEvents = wrapper.emitted("change");

      expect(updateEvents[updateEvents.length - 1][0]).toBeNull();
      expect(changeEvents[changeEvents.length - 1][0]).toBeNull();
    });
  });

  describe("Props传递", () => {
    it("应该正确传递通用props", async () => {
      await wrapper.setProps({
        disabled: true,
        clearable: false,
      });

      // 检查日期选择器
      await wrapper.setProps({ timeUnit: "day" });
      const datePicker = wrapper.findComponent(DateRangePicker);
      expect(datePicker.props("disabled")).toBe(true);
      expect(datePicker.props("clearable")).toBe(false);

      // 检查年份选择器
      await wrapper.setProps({ timeUnit: "year" });
      const yearPicker = wrapper.findComponent(YearRangePicker);
      expect(yearPicker.props("disabled")).toBe(true);

      // 检查月份选择器
      await wrapper.setProps({ timeUnit: "month" });
      const monthPicker = wrapper.findComponent(MonthRangePicker);
      expect(monthPicker.props("disabled")).toBe(true);
    });

    it("应该正确传递年份选择器特有的props", async () => {
      await wrapper.setProps({
        timeUnit: "year",
        showQuickRange: false,
        minYear: 2020,
        maxYear: 2025,
        maxYearSpan: 5,
      });

      const yearPicker = wrapper.findComponent(YearRangePicker);
      expect(yearPicker.props("showQuickRange")).toBe(false);
      expect(yearPicker.props("minYear")).toBe(2020);
      expect(yearPicker.props("maxYear")).toBe(2025);
      expect(yearPicker.props("maxRangeSpan")).toBe(5);
    });

    it("应该正确传递月份选择器特有的props", async () => {
      await wrapper.setProps({
        timeUnit: "month",
        showQuickJump: false,
        maxMonthSpan: 12,
      });

      const monthPicker = wrapper.findComponent(MonthRangePicker);
      expect(monthPicker.props("showQuickJump")).toBe(false);
      expect(monthPicker.props("maxMonthSpan")).toBe(12);
    });

    it("应该正确传递日期选择器特有的props", async () => {
      const minDate = new Date("2024-01-01");
      const maxDate = new Date("2024-12-31");

      await wrapper.setProps({
        timeUnit: "day",
        showQuickDates: false,
        useBuiltinShortcuts: false,
        maxDaysSpan: 30,
        allowFutureDates: true,
        minDate,
        maxDate,
      });

      const datePicker = wrapper.findComponent(DateRangePicker);
      expect(datePicker.props("showQuickDates")).toBe(false);
      expect(datePicker.props("useBuiltinShortcuts")).toBe(false);
      expect(datePicker.props("maxDaysSpan")).toBe(30);
      expect(datePicker.props("allowFutureDates")).toBe(true);
      expect(datePicker.props("minDate")).toEqual(minDate);
      expect(datePicker.props("maxDate")).toEqual(maxDate);
    });
  });

  describe("边界情况", () => {
    it("应该正确处理null值", async () => {
      await wrapper.vm.handleTimeRangeChange(null);

      expect(wrapper.vm.timeRange).toBeNull();

      const updateEvents = wrapper.emitted("update:modelValue");
      const changeEvents = wrapper.emitted("change");

      expect(updateEvents[updateEvents.length - 1][0]).toBeNull();
      expect(changeEvents[changeEvents.length - 1][0]).toBeNull();
    });

    it("应该正确处理无效的timeUnit", async () => {
      // 设置无效的timeUnit（虽然TypeScript会阻止，但测试运行时行为）
      await wrapper.setProps({ timeUnit: "invalid" as any });

      // 应该不显示任何选择器
      expect(wrapper.findComponent(YearRangePicker).exists()).toBe(false);
      expect(wrapper.findComponent(MonthRangePicker).exists()).toBe(false);
      expect(wrapper.findComponent(DateRangePicker).exists()).toBe(false);
    });
  });
});
