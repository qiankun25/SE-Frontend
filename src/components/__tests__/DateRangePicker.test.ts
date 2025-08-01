import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ElDatePicker, ElButton, ElAlert } from "element-plus";
import DateRangePicker from "../DateRangePicker.vue";
import type { TimeRange } from "../../types/time-selection";

// Mock Element Plus components
const mockComponents = {
  ElDatePicker,
  ElButton,
  ElAlert,
};

describe("DateRangePicker", () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(DateRangePicker, {
      global: {
        components: mockComponents,
      },
    });
  });

  describe("基础功能", () => {
    it("应该正确渲染组件", () => {
      expect(wrapper.find(".date-range-picker").exists()).toBe(true);
      expect(wrapper.find(".date-picker-container").exists()).toBe(true);
      expect(wrapper.find(".date-picker").exists()).toBe(true);
    });

    it("应该显示Element Plus日期选择器", () => {
      const datePicker = wrapper.findComponent(ElDatePicker);
      expect(datePicker.exists()).toBe(true);
      expect(datePicker.props("type")).toBe("daterange");
    });

    it("应该显示快捷日期选择按钮", () => {
      const wrapperWithoutBuiltin = mount(DateRangePicker, {
        props: {
          useBuiltinShortcuts: false,
        },
        global: {
          components: mockComponents,
        },
      });

      expect(wrapperWithoutBuiltin.find(".quick-date-buttons").exists()).toBe(
        true
      );
      const quickButtons = wrapperWithoutBuiltin.findAll(".quick-date-btn");
      expect(quickButtons.length).toBeGreaterThan(0);
    });
  });

  describe("日期选择功能", () => {
    it("应该正确处理日期范围变化", async () => {
      const dateRange = ["2024-01-01", "2024-01-31"];

      await wrapper.vm.handleDateChange(dateRange);

      expect(wrapper.vm.dateRange).toEqual(dateRange);
    });

    it("应该在选择日期范围后发送正确的TimeRange", async () => {
      const dateRange = ["2024-01-01", "2024-01-31"];

      await wrapper.vm.handleDateChange(dateRange);

      // 检查发送的事件
      const emittedEvents = wrapper.emitted("update:modelValue");
      expect(emittedEvents).toBeTruthy();

      const lastEmittedValue = emittedEvents[
        emittedEvents.length - 1
      ][0] as TimeRange;
      expect(lastEmittedValue.unit).toBe("day");
      expect(lastEmittedValue.startDate.toISOString().split("T")[0]).toBe(
        "2024-01-01"
      );
      expect(lastEmittedValue.endDate.toISOString().split("T")[0]).toBe(
        "2024-01-31"
      );
    });

    it("应该在清空日期时发送null值", async () => {
      await wrapper.vm.handleDateChange(null);

      const emittedEvents = wrapper.emitted("update:modelValue");
      expect(emittedEvents).toBeTruthy();

      const lastEmittedValue = emittedEvents[emittedEvents.length - 1][0];
      expect(lastEmittedValue).toBeNull();
    });
  });

  describe("验证功能", () => {
    it("应该验证开始日期不大于结束日期", async () => {
      // 设置无效的日期范围（开始日期大于结束日期）
      const invalidRange = ["2024-01-31", "2024-01-01"];

      await wrapper.vm.handleDateChange(invalidRange);

      expect(wrapper.vm.validationMessage).toBe("开始日期不能大于结束日期");
      expect(wrapper.vm.validationLevel).toBe("error");
    });

    it("应该验证日期范围不超过最大跨度", async () => {
      const maxDaysSpan = 30;

      // 创建带有最大跨度限制的组件
      const wrapperWithLimit = mount(DateRangePicker, {
        props: {
          maxDaysSpan,
        },
        global: {
          components: mockComponents,
        },
      });

      // 设置超过最大跨度的日期范围（31天）
      const longRange = ["2024-01-01", "2024-01-31"];
      await wrapperWithLimit.vm.handleDateChange(longRange);

      expect(wrapperWithLimit.vm.validationMessage).toBe(
        `日期范围不能超过${maxDaysSpan}天`
      );
      expect(wrapperWithLimit.vm.validationLevel).toBe("warning");
    });

    it("应该验证未来日期限制", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const futureRange = [tomorrowStr, tomorrowStr];
      await wrapper.vm.handleDateChange(futureRange);

      expect(wrapper.vm.validationMessage).toBe("不允许选择未来日期");
      expect(wrapper.vm.validationLevel).toBe("error");
    });

    it("应该在允许未来日期时不显示未来日期错误", async () => {
      const wrapperAllowFuture = mount(DateRangePicker, {
        props: {
          allowFutureDates: true,
        },
        global: {
          components: mockComponents,
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const futureRange = [tomorrowStr, tomorrowStr];
      await wrapperAllowFuture.vm.handleDateChange(futureRange);

      expect(wrapperAllowFuture.vm.validationMessage).toBe("日期范围设置正确");
      expect(wrapperAllowFuture.vm.validationLevel).toBe("success");
    });

    it("应该验证最小日期限制", async () => {
      const minDate = new Date("2024-01-15");

      const wrapperWithMinDate = mount(DateRangePicker, {
        props: {
          minDate,
        },
        global: {
          components: mockComponents,
        },
      });

      // 设置早于最小日期的范围
      const earlyRange = ["2024-01-01", "2024-01-10"];
      await wrapperWithMinDate.vm.handleDateChange(earlyRange);

      expect(wrapperWithMinDate.vm.validationMessage).toBe(
        "开始日期不能早于2024-01-15"
      );
      expect(wrapperWithMinDate.vm.validationLevel).toBe("error");
    });

    it("应该验证最大日期限制", async () => {
      const maxDate = new Date("2024-01-15");

      const wrapperWithMaxDate = mount(DateRangePicker, {
        props: {
          maxDate,
          allowFutureDates: true,
        },
        global: {
          components: mockComponents,
        },
      });

      // 设置晚于最大日期的范围
      const lateRange = ["2024-01-10", "2024-01-20"];
      await wrapperWithMaxDate.vm.handleDateChange(lateRange);

      expect(wrapperWithMaxDate.vm.validationMessage).toBe(
        "结束日期不能晚于2024-01-15"
      );
      expect(wrapperWithMaxDate.vm.validationLevel).toBe("error");
    });

    it("应该在日期范围正确时显示成功消息", async () => {
      const validRange = ["2024-01-01", "2024-01-15"];

      await wrapper.vm.handleDateChange(validRange);

      expect(wrapper.vm.validationMessage).toBe("日期范围设置正确");
      expect(wrapper.vm.validationLevel).toBe("success");
    });

    it("应该发送验证变化事件", async () => {
      const validRange = ["2024-01-01", "2024-01-15"];

      await wrapper.vm.handleDateChange(validRange);

      // 检查验证事件
      const validationEvents = wrapper.emitted("validation-change");
      expect(validationEvents).toBeTruthy();

      const lastValidationEvent = validationEvents[validationEvents.length - 1];
      expect(lastValidationEvent[0]).toBe(true); // isValid
      expect(lastValidationEvent[1]).toBe("日期范围设置正确"); // message
      expect(lastValidationEvent[2]).toBe("success"); // level
    });
  });

  describe("快捷日期选择功能", () => {
    it("应该正确处理快捷日期选择", async () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const quickDate = {
        key: "today",
        label: "今天",
        startDate: today,
        endDate: today,
      };

      await wrapper.vm.handleQuickDateSelect(quickDate);

      expect(wrapper.vm.dateRange).toEqual([todayStr, todayStr]);
    });

    it("应该在快捷选择后发送正确的值", async () => {
      const today = new Date();
      const quickDate = {
        key: "today",
        label: "今天",
        startDate: today,
        endDate: today,
      };

      await wrapper.vm.handleQuickDateSelect(quickDate);

      // 检查发送的事件
      const emittedEvents = wrapper.emitted("update:modelValue");
      expect(emittedEvents).toBeTruthy();

      const lastEmittedValue = emittedEvents[
        emittedEvents.length - 1
      ][0] as TimeRange;
      expect(lastEmittedValue.startDate.toDateString()).toBe(
        today.toDateString()
      );
      expect(lastEmittedValue.endDate.toDateString()).toBe(
        today.toDateString()
      );
    });

    it("应该提供合理的快捷日期选项", () => {
      const quickDateOptions = wrapper.vm.quickDateOptions;

      expect(quickDateOptions).toBeInstanceOf(Array);
      expect(quickDateOptions.length).toBeGreaterThan(0);

      // 检查是否包含常用选项
      const optionKeys = quickDateOptions.map((option: any) => option.key);
      expect(optionKeys).toContain("today");
      expect(optionKeys).toContain("yesterday");
      expect(optionKeys).toContain("last7days");
      expect(optionKeys).toContain("last30days");
    });
  });

  describe("日期计算工具函数", () => {
    it("应该正确计算日期差异", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const daysDiff = wrapper.vm.calculateDaysDifference(startDate, endDate);
      expect(daysDiff).toBe(31); // 包含起始和结束日期
    });

    it("应该正确计算周的开始和结束日期", () => {
      // 测试2024年1月1日（周一）
      const monday = new Date("2024-01-01");
      const weekStart = wrapper.vm.getWeekStart(monday);
      const weekEnd = wrapper.vm.getWeekEnd(monday);

      expect(weekStart.getDay()).toBe(1); // 周一
      expect(weekEnd.getDay()).toBe(0); // 周日
    });
  });

  describe("禁用日期功能", () => {
    it("应该正确禁用未来日期", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isDisabled = wrapper.vm.disabledDate(tomorrow);
      expect(isDisabled).toBe(true);
    });

    it("应该在允许未来日期时不禁用未来日期", () => {
      const wrapperAllowFuture = mount(DateRangePicker, {
        props: {
          allowFutureDates: true,
        },
        global: {
          components: mockComponents,
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isDisabled = wrapperAllowFuture.vm.disabledDate(tomorrow);
      expect(isDisabled).toBe(false);
    });

    it("应该正确禁用早于最小日期的日期", () => {
      const minDate = new Date("2024-01-15");

      const wrapperWithMinDate = mount(DateRangePicker, {
        props: {
          minDate,
        },
        global: {
          components: mockComponents,
        },
      });

      const earlyDate = new Date("2024-01-10");
      const isDisabled = wrapperWithMinDate.vm.disabledDate(earlyDate);
      expect(isDisabled).toBe(true);
    });

    it("应该正确禁用晚于最大日期的日期", () => {
      const maxDate = new Date("2024-01-15");

      const wrapperWithMaxDate = mount(DateRangePicker, {
        props: {
          maxDate,
        },
        global: {
          components: mockComponents,
        },
      });

      const lateDate = new Date("2024-01-20");
      const isDisabled = wrapperWithMaxDate.vm.disabledDate(lateDate);
      expect(isDisabled).toBe(true);
    });
  });

  describe("Props 和外部值", () => {
    it("应该正确处理外部传入的 modelValue", async () => {
      const timeRange: TimeRange = {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        unit: "day",
      };

      const wrapperWithValue = mount(DateRangePicker, {
        props: {
          modelValue: timeRange,
        },
        global: {
          components: mockComponents,
        },
      });

      expect(wrapperWithValue.vm.dateRange).toEqual([
        "2024-01-01",
        "2024-01-31",
      ]);
    });

    it("应该正确处理 disabled 属性", () => {
      const disabledWrapper = mount(DateRangePicker, {
        props: {
          disabled: true,
        },
        global: {
          components: mockComponents,
        },
      });

      expect(disabledWrapper.props("disabled")).toBe(true);
    });

    it("应该正确处理 clearable 属性", () => {
      const nonClearableWrapper = mount(DateRangePicker, {
        props: {
          clearable: false,
        },
        global: {
          components: mockComponents,
        },
      });

      expect(nonClearableWrapper.props("clearable")).toBe(false);
    });

    it("应该根据 showQuickDates 属性控制快捷日期按钮显示", () => {
      const wrapperWithoutQuick = mount(DateRangePicker, {
        props: {
          showQuickDates: false,
          useBuiltinShortcuts: false,
        },
        global: {
          components: mockComponents,
        },
      });

      expect(wrapperWithoutQuick.find(".quick-date-buttons").exists()).toBe(
        false
      );
    });

    it("应该根据 useBuiltinShortcuts 属性控制内置快捷选项", () => {
      const wrapperWithBuiltin = mount(DateRangePicker, {
        props: {
          useBuiltinShortcuts: true,
        },
        global: {
          components: mockComponents,
        },
      });

      const shortcuts = wrapperWithBuiltin.vm.dateShortcuts;
      expect(shortcuts.length).toBeGreaterThan(0);

      const wrapperWithoutBuiltin = mount(DateRangePicker, {
        props: {
          useBuiltinShortcuts: false,
        },
        global: {
          components: mockComponents,
        },
      });

      const noShortcuts = wrapperWithoutBuiltin.vm.dateShortcuts;
      expect(noShortcuts.length).toBe(0);
    });
  });

  describe("边界情况", () => {
    it("应该正确处理跨年日期范围", async () => {
      const crossYearRange = ["2023-12-15", "2024-01-15"];

      await wrapper.vm.handleDateChange(crossYearRange);

      expect(wrapper.vm.validationMessage).toBe("日期范围设置正确");
      expect(wrapper.vm.validationLevel).toBe("success");
    });

    it("应该正确处理单日范围", async () => {
      const singleDayRange = ["2024-01-15", "2024-01-15"];

      await wrapper.vm.handleDateChange(singleDayRange);

      const daysDiff = wrapper.vm.calculateDaysDifference(
        new Date("2024-01-15"),
        new Date("2024-01-15")
      );
      expect(daysDiff).toBe(1); // 单日应该计算为1天
    });

    it("应该正确处理闰年2月29日", async () => {
      const leapYearRange = ["2024-02-28", "2024-02-29"];

      await wrapper.vm.handleDateChange(leapYearRange);

      expect(wrapper.vm.validationMessage).toBe("日期范围设置正确");
      expect(wrapper.vm.validationLevel).toBe("success");
    });
  });
});
