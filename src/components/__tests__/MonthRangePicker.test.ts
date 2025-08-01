import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ElSelect, ElOption, ElButton, ElAlert } from "element-plus";
import MonthRangePicker from "../MonthRangePicker.vue";
import type { TimeRange } from "../../types/time-selection";

// Mock Element Plus components
const mockComponents = {
  ElSelect,
  ElOption,
  ElButton,
  ElAlert,
};

describe("MonthRangePicker", () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(MonthRangePicker, {
      global: {
        components: mockComponents,
      },
    });
  });

  describe("基础功能", () => {
    it("应该正确渲染组件", () => {
      expect(wrapper.find(".month-range-picker").exists()).toBe(true);
      expect(wrapper.find(".month-range-container").exists()).toBe(true);
      expect(wrapper.findAll(".month-selector")).toHaveLength(2);
    });

    it("应该显示起始时间和结束时间选择器", () => {
      const monthSelectors = wrapper.findAll(".month-selector");
      expect(monthSelectors[0].find(".month-label").text()).toBe("起始时间");
      expect(monthSelectors[1].find(".month-label").text()).toBe("结束时间");
    });

    it("应该显示年份和月份选择器", () => {
      const yearMonthGroups = wrapper.findAll(".year-month-group");
      expect(yearMonthGroups).toHaveLength(2);

      // 每个组应该包含年份和月份选择器
      yearMonthGroups.forEach((group) => {
        expect(group.find(".year-select").exists()).toBe(true);
        expect(group.find(".month-select").exists()).toBe(true);
      });
    });

    it("应该显示快捷跳转按钮", () => {
      expect(wrapper.find(".quick-jump-buttons").exists()).toBe(true);
      const quickButtons = wrapper.findAll(".quick-jump-btn");
      expect(quickButtons.length).toBeGreaterThan(0);
    });
  });

  describe("月份选择功能", () => {
    it("应该正确处理起始年份选择", async () => {
      const currentYear = new Date().getFullYear();

      await wrapper.vm.handleStartYearChange(currentYear - 1);

      expect(wrapper.vm.startYear).toBe(currentYear - 1);
    });

    it("应该正确处理起始月份选择", async () => {
      await wrapper.vm.handleStartMonthChange(6);

      expect(wrapper.vm.startMonth).toBe(6);
    });

    it("应该正确处理结束年份选择", async () => {
      const currentYear = new Date().getFullYear();

      await wrapper.vm.handleEndYearChange(currentYear);

      expect(wrapper.vm.endYear).toBe(currentYear);
    });

    it("应该正确处理结束月份选择", async () => {
      await wrapper.vm.handleEndMonthChange(12);

      expect(wrapper.vm.endMonth).toBe(12);
    });

    it("应该在选择完整月份范围后发送正确的TimeRange", async () => {
      const currentYear = new Date().getFullYear();

      // 设置完整的月份范围
      await wrapper.vm.handleStartYearChange(currentYear);
      await wrapper.vm.handleStartMonthChange(6);
      await wrapper.vm.handleEndYearChange(currentYear);
      await wrapper.vm.handleEndMonthChange(12);

      // 检查发送的事件
      const emittedEvents = wrapper.emitted("update:modelValue");
      expect(emittedEvents).toBeTruthy();

      const lastEmittedValue = emittedEvents[
        emittedEvents.length - 1
      ][0] as TimeRange;
      expect(lastEmittedValue.unit).toBe("month");
      expect(lastEmittedValue.startDate.getFullYear()).toBe(currentYear);
      expect(lastEmittedValue.startDate.getMonth()).toBe(5); // 6月 - 1
      expect(lastEmittedValue.endDate.getFullYear()).toBe(currentYear);
      expect(lastEmittedValue.endDate.getMonth()).toBe(11); // 12月 - 1
    });
  });

  describe("验证功能", () => {
    it("应该验证起始时间不大于结束时间", async () => {
      const currentYear = new Date().getFullYear();

      // 设置无效的月份范围（起始时间大于结束时间）
      await wrapper.vm.handleStartYearChange(currentYear);
      await wrapper.vm.handleStartMonthChange(12);
      await wrapper.vm.handleEndYearChange(currentYear);
      await wrapper.vm.handleEndMonthChange(6);

      expect(wrapper.vm.validationMessage).toBe("起始时间不能大于结束时间");
      expect(wrapper.vm.validationLevel).toBe("error");
    });

    it("应该验证月份范围不超过最大跨度", async () => {
      const currentYear = new Date().getFullYear();
      const maxMonthSpan = 12;

      // 创建带有最大跨度限制的组件
      const wrapperWithLimit = mount(MonthRangePicker, {
        props: {
          maxMonthSpan,
        },
        global: {
          components: mockComponents,
        },
      });

      // 设置超过最大跨度的月份范围（13个月）
      await wrapperWithLimit.vm.handleStartYearChange(currentYear - 1);
      await wrapperWithLimit.vm.handleStartMonthChange(12);
      await wrapperWithLimit.vm.handleEndYearChange(currentYear);
      await wrapperWithLimit.vm.handleEndMonthChange(12);

      expect(wrapperWithLimit.vm.validationMessage).toBe(
        `月份范围不能超过${maxMonthSpan}个月`
      );
      expect(wrapperWithLimit.vm.validationLevel).toBe("warning");
    });

    it("应该在跨年时显示警告提示", async () => {
      const currentYear = new Date().getFullYear();

      // 设置跨年的月份范围
      await wrapper.vm.handleStartYearChange(currentYear - 1);
      await wrapper.vm.handleStartMonthChange(12);
      await wrapper.vm.handleEndYearChange(currentYear);
      await wrapper.vm.handleEndMonthChange(6);

      expect(wrapper.vm.validationMessage).toBe(
        "已选择跨年月份范围，请确认是否正确"
      );
      expect(wrapper.vm.validationLevel).toBe("warning");
    });

    it("应该在同年月份范围正确时显示成功消息", async () => {
      const currentYear = new Date().getFullYear();

      // 设置有效的同年月份范围
      await wrapper.vm.handleStartYearChange(currentYear);
      await wrapper.vm.handleStartMonthChange(6);
      await wrapper.vm.handleEndYearChange(currentYear);
      await wrapper.vm.handleEndMonthChange(12);

      expect(wrapper.vm.validationMessage).toBe("月份范围设置正确");
      expect(wrapper.vm.validationLevel).toBe("success");
    });

    it("应该发送验证变化事件", async () => {
      const currentYear = new Date().getFullYear();

      // 设置有效的月份范围
      await wrapper.vm.handleStartYearChange(currentYear);
      await wrapper.vm.handleStartMonthChange(6);
      await wrapper.vm.handleEndYearChange(currentYear);
      await wrapper.vm.handleEndMonthChange(12);

      // 检查验证事件
      const validationEvents = wrapper.emitted("validation-change");
      expect(validationEvents).toBeTruthy();

      const lastValidationEvent = validationEvents[validationEvents.length - 1];
      expect(lastValidationEvent[0]).toBe(true); // isValid
      expect(lastValidationEvent[1]).toBe("月份范围设置正确"); // message
      expect(lastValidationEvent[2]).toBe("success"); // level
    });
  });

  describe("快捷跳转功能", () => {
    it("应该正确处理快捷跳转选择", async () => {
      const currentYear = new Date().getFullYear();
      const quickJump = {
        key: "thisYear",
        label: "本年度",
        startYear: currentYear,
        startMonth: 1,
        endYear: currentYear,
        endMonth: 12,
      };

      // 模拟快捷跳转
      await wrapper.vm.handleQuickJump(quickJump);

      expect(wrapper.vm.startYear).toBe(quickJump.startYear);
      expect(wrapper.vm.startMonth).toBe(quickJump.startMonth);
      expect(wrapper.vm.endYear).toBe(quickJump.endYear);
      expect(wrapper.vm.endMonth).toBe(quickJump.endMonth);
    });

    it("应该在快捷跳转后发送正确的值", async () => {
      const currentYear = new Date().getFullYear();
      const quickJump = {
        key: "thisYear",
        label: "本年度",
        startYear: currentYear,
        startMonth: 1,
        endYear: currentYear,
        endMonth: 12,
      };

      // 模拟快捷跳转
      await wrapper.vm.handleQuickJump(quickJump);

      // 检查发送的事件
      const emittedEvents = wrapper.emitted("update:modelValue");
      expect(emittedEvents).toBeTruthy();

      const lastEmittedValue = emittedEvents[
        emittedEvents.length - 1
      ][0] as TimeRange;
      expect(lastEmittedValue.startDate.getFullYear()).toBe(
        quickJump.startYear
      );
      expect(lastEmittedValue.startDate.getMonth()).toBe(
        quickJump.startMonth - 1
      );
      expect(lastEmittedValue.endDate.getFullYear()).toBe(quickJump.endYear);
      expect(lastEmittedValue.endDate.getMonth()).toBe(quickJump.endMonth - 1);
    });

    it("应该提供合理的快捷跳转选项", () => {
      const quickJumpOptions = wrapper.vm.quickJumpOptions;

      expect(quickJumpOptions).toBeInstanceOf(Array);
      expect(quickJumpOptions.length).toBeGreaterThan(0);

      // 检查是否包含常用选项
      const optionKeys = quickJumpOptions.map((option: any) => option.key);
      expect(optionKeys).toContain("thisYear");
      expect(optionKeys).toContain("lastYear");
    });
  });

  describe("月份差异计算", () => {
    it("应该正确计算月份差异", () => {
      const currentYear = new Date().getFullYear();

      // 测试同年月份差异
      const sameYearDiff = wrapper.vm.calculateMonthDifference(
        currentYear,
        6,
        currentYear,
        12
      );
      expect(sameYearDiff).toBe(7); // 6月到12月，包含起始和结束月份

      // 测试跨年月份差异
      const crossYearDiff = wrapper.vm.calculateMonthDifference(
        currentYear - 1,
        12,
        currentYear,
        6
      );
      expect(crossYearDiff).toBe(7); // 去年12月到今年6月
    });
  });

  describe("Props 和外部值", () => {
    it("应该正确处理外部传入的 modelValue", async () => {
      const currentYear = new Date().getFullYear();
      const timeRange: TimeRange = {
        startDate: new Date(currentYear, 5, 1), // 6月1日
        endDate: new Date(currentYear, 11, 31), // 12月31日
        unit: "month",
      };

      const wrapperWithValue = mount(MonthRangePicker, {
        props: {
          modelValue: timeRange,
        },
        global: {
          components: mockComponents,
        },
      });

      expect(wrapperWithValue.vm.startYear).toBe(currentYear);
      expect(wrapperWithValue.vm.startMonth).toBe(6);
      expect(wrapperWithValue.vm.endYear).toBe(currentYear);
      expect(wrapperWithValue.vm.endMonth).toBe(12);
    });

    it("应该正确处理 disabled 属性", () => {
      const disabledWrapper = mount(MonthRangePicker, {
        props: {
          disabled: true,
        },
        global: {
          components: mockComponents,
        },
      });

      expect(disabledWrapper.props("disabled")).toBe(true);
    });

    it("应该根据 showQuickJump 属性控制快捷跳转按钮显示", () => {
      const wrapperWithoutQuick = mount(MonthRangePicker, {
        props: {
          showQuickJump: false,
        },
        global: {
          components: mockComponents,
        },
      });

      expect(wrapperWithoutQuick.find(".quick-jump-buttons").exists()).toBe(
        false
      );
    });
  });

  describe("年份和月份选项", () => {
    it("应该正确计算可用的年份", () => {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 3;
      const maxYear = currentYear;

      const wrapperWithRange = mount(MonthRangePicker, {
        props: {
          minYear,
          maxYear,
        },
        global: {
          components: mockComponents,
        },
      });

      const availableYears = wrapperWithRange.vm.availableYears;
      expect(availableYears).toContain(minYear);
      expect(availableYears).toContain(maxYear);
      expect(availableYears.length).toBe(4); // 包含起始和结束年份
    });

    it("应该提供1-12月的选项", () => {
      const availableMonths = wrapper.vm.availableMonths;
      expect(availableMonths).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
  });

  describe("边界情况", () => {
    it("应该正确处理月份的最后一天计算", async () => {
      const currentYear = new Date().getFullYear();

      // 设置2月份（需要考虑闰年）
      await wrapper.vm.handleStartYearChange(currentYear);
      await wrapper.vm.handleStartMonthChange(2);
      await wrapper.vm.handleEndYearChange(currentYear);
      await wrapper.vm.handleEndMonthChange(2);

      const emittedEvents = wrapper.emitted("update:modelValue");
      const lastEmittedValue = emittedEvents[
        emittedEvents.length - 1
      ][0] as TimeRange;

      // 检查结束日期是否为2月的最后一天
      const expectedLastDay = new Date(currentYear, 2, 0).getDate(); // 2月最后一天
      expect(lastEmittedValue.endDate.getDate()).toBe(expectedLastDay);
    });

    it("应该正确处理跨年的12月到1月", async () => {
      const currentYear = new Date().getFullYear();

      // 设置跨年范围：去年12月到今年1月
      await wrapper.vm.handleStartYearChange(currentYear - 1);
      await wrapper.vm.handleStartMonthChange(12);
      await wrapper.vm.handleEndYearChange(currentYear);
      await wrapper.vm.handleEndMonthChange(1);

      const monthDiff = wrapper.vm.calculateMonthDifference(
        currentYear - 1,
        12,
        currentYear,
        1
      );
      expect(monthDiff).toBe(2); // 12月和1月，共2个月
    });
  });
});
