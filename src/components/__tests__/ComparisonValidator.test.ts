/**
 * ComparisonValidator 组件单元测试
 *
 * 测试同期比验证器组件的各项功能：
 * - 同期比时间范围合理性验证逻辑
 * - 跨年时间范围的警告提醒和用户选择界面
 * - 实时验证和状态更新机制
 * - 验证结果的视觉反馈（成功、警告、错误状态）
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import ComparisonValidator from "../ComparisonValidator.vue";
import type { TimeRange, ValidationResult } from "../../types/time-selection";

// ============================================================================
// 测试工具函数
// ============================================================================

/**
 * 创建测试用的时间范围
 */
function createTimeRange(
  startYear: number,
  startMonth: number,
  startDay: number,
  endYear: number,
  endMonth: number,
  endDay: number
): TimeRange {
  return {
    startDate: new Date(startYear, startMonth - 1, startDay),
    endDate: new Date(endYear, endMonth - 1, endDay),
    unit: "day",
  };
}

/**
 * 创建同年时间范围
 */
function createSameYearRange(): TimeRange {
  return createTimeRange(2024, 1, 1, 2024, 12, 31);
}

/**
 * 创建跨年时间范围
 */
function createCrossYearRange(): TimeRange {
  return createTimeRange(2023, 6, 1, 2024, 6, 30);
}

/**
 * 挂载组件的辅助函数
 */
function mountComponent(props: any = {}) {
  return mount(ComparisonValidator, {
    props: {
      timeRange: null,
      comparisonEnabled: false,
      enableRealTimeValidation: true,
      showValidationMessages: true,
      showRealTimeHint: false,
      ...props,
    },
  });
}

// ============================================================================
// 测试套件
// ============================================================================

describe("ComparisonValidator", () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 基础渲染测试
  // ==========================================================================

  describe("基础渲染", () => {
    it("当同期比未启用时不显示组件", () => {
      wrapper = mountComponent({
        comparisonEnabled: false,
      });

      expect(wrapper.find(".comparison-validator").exists()).toBe(false);
    });

    it("当同期比启用时显示组件", () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
      });

      expect(wrapper.find(".comparison-validator").exists()).toBe(true);
    });

    it("当没有时间范围时显示成功状态", () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: null,
      });

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("validation-success");
    });
  });

  // ==========================================================================
  // 同期比验证逻辑测试
  // ==========================================================================

  describe("同期比验证逻辑", () => {
    it("同一年份的时间范围应该显示成功状态", async () => {
      const sameYearRange = createSameYearRange();

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: sameYearRange,
      });

      await nextTick();

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("validation-success");

      const messageText = wrapper.find(".message-text");
      expect(messageText.text()).toBe("时间范围符合同期比分析要求");

      const successIcon = wrapper.find(".icon-success");
      expect(successIcon.exists()).toBe(true);
    });

    it("跨年时间范围应该显示警告状态", async () => {
      const crossYearRange = createCrossYearRange();

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: crossYearRange,
      });

      await nextTick();

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("validation-warning");

      const messageText = wrapper.find(".message-text");
      expect(messageText.text()).toContain(
        "同期比分析建议选择同一年份内的时间范围"
      );

      const warningIcon = wrapper.find(".icon-warning");
      expect(warningIcon.exists()).toBe(true);
    });

    it("跨年警告应该显示建议信息", async () => {
      const crossYearRange = createCrossYearRange();

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: crossYearRange,
      });

      await nextTick();

      const suggestionText = wrapper.find(".suggestion-text");
      expect(suggestionText.exists()).toBe(true);
      expect(suggestionText.text()).toContain(
        "建议调整时间范围至同一年份内，或关闭同期比功能"
      );
    });
  });

  // ==========================================================================
  // 跨年用户选择界面测试
  // ==========================================================================

  describe("跨年用户选择界面", () => {
    it("跨年警告时应该显示用户选择按钮", async () => {
      const crossYearRange = createCrossYearRange();

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: crossYearRange,
        showValidationMessages: true,
      });

      await nextTick();

      const crossYearActions = wrapper.find(".cross-year-actions");
      expect(crossYearActions.exists()).toBe(true);

      const continueButton = wrapper.find(".continue-button");
      const reselectButton = wrapper.find(".reselect-button");

      expect(continueButton.exists()).toBe(true);
      expect(reselectButton.exists()).toBe(true);
      expect(continueButton.text()).toBe("仍然继续");
      expect(reselectButton.text()).toBe("重新选择时间");
    });

    it('点击"仍然继续"按钮应该触发相应事件', async () => {
      const crossYearRange = createCrossYearRange();

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: crossYearRange,
      });

      await nextTick();

      const continueButton = wrapper.find(".continue-button");
      await continueButton.trigger("click");
      await nextTick();

      expect(wrapper.emitted("continue-cross-year")).toBeTruthy();
      expect(wrapper.emitted("validation-update")).toBeTruthy();
    });

    it('点击"重新选择时间"按钮应该触发相应事件', async () => {
      const crossYearRange = createCrossYearRange();

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: crossYearRange,
      });

      await nextTick();

      const reselectButton = wrapper.find(".reselect-button");
      await reselectButton.trigger("click");
      await nextTick();

      expect(wrapper.emitted("reselect-time")).toBeTruthy();
    });

    it("按钮点击时应该显示加载状态", async () => {
      const crossYearRange = createCrossYearRange();

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: crossYearRange,
      });

      await nextTick();

      const continueButton = wrapper.find(".continue-button");

      // 检查初始状态下按钮未被禁用
      expect(continueButton.attributes("disabled")).toBeUndefined();

      // 模拟点击并立即检查状态
      const clickPromise = continueButton.trigger("click");

      // 等待异步操作完成
      await clickPromise;
      await nextTick();

      // 验证事件被触发
      expect(wrapper.emitted("continue-cross-year")).toBeTruthy();
    });

    it("当showValidationMessages为false时不显示选择按钮", async () => {
      const crossYearRange = createCrossYearRange();

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: crossYearRange,
        showValidationMessages: false,
      });

      await nextTick();

      const crossYearActions = wrapper.find(".cross-year-actions");
      expect(crossYearActions.exists()).toBe(false);
    });
  });

  // ==========================================================================
  // 实时验证和状态更新测试
  // ==========================================================================

  describe("实时验证和状态更新", () => {
    it("时间范围变化时应该触发验证更新事件", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: createSameYearRange(),
        enableRealTimeValidation: true,
      });

      await nextTick();

      // 更改时间范围为跨年
      await wrapper.setProps({
        timeRange: createCrossYearRange(),
      });

      await nextTick();

      const validationUpdateEvents = wrapper.emitted("validation-update");
      expect(validationUpdateEvents).toBeTruthy();
      expect(validationUpdateEvents!.length).toBeGreaterThan(0);
    });

    it("验证状态变化时应该触发validation-change事件", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: createSameYearRange(),
      });

      await nextTick();

      // 更改为跨年范围
      await wrapper.setProps({
        timeRange: createCrossYearRange(),
      });

      await nextTick();

      const validationChangeEvents = wrapper.emitted("validation-change");
      expect(validationChangeEvents).toBeTruthy();

      // 检查事件参数
      const lastEvent =
        validationChangeEvents![validationChangeEvents!.length - 1];
      expect(lastEvent[0]).toBe(false); // isValid
      expect(lastEvent[1]).toBe("warning"); // level
    });

    it("同期比启用状态变化时应该更新验证", async () => {
      const crossYearRange = createCrossYearRange();

      wrapper = mountComponent({
        comparisonEnabled: false,
        timeRange: crossYearRange,
      });

      // 启用同期比
      await wrapper.setProps({
        comparisonEnabled: true,
      });

      await nextTick();

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("validation-warning");
    });

    it("禁用实时验证时不应该自动触发验证更新", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: createSameYearRange(),
        enableRealTimeValidation: false,
      });

      await nextTick();

      // 清除初始事件
      wrapper.vm.$emit = vi.fn();

      // 更改时间范围
      await wrapper.setProps({
        timeRange: createCrossYearRange(),
      });

      await nextTick();

      // 验证不应该触发validation-update事件
      expect(wrapper.vm.$emit).not.toHaveBeenCalledWith(
        "validation-update",
        expect.any(Object)
      );
    });
  });

  // ==========================================================================
  // 视觉反馈测试
  // ==========================================================================

  describe("视觉反馈", () => {
    it("成功状态应该显示正确的样式类", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: createSameYearRange(),
      });

      await nextTick();

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("validation-success");

      const icon = wrapper.find(".icon-success");
      expect(icon.exists()).toBe(true);
    });

    it("警告状态应该显示正确的样式类", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: createCrossYearRange(),
      });

      await nextTick();

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("validation-warning");

      const icon = wrapper.find(".icon-warning");
      expect(icon.exists()).toBe(true);
    });

    it("有建议信息时应该添加相应的样式类", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: createCrossYearRange(),
      });

      await nextTick();

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("has-suggestion");
    });
  });

  // ==========================================================================
  // 实时提示测试
  // ==========================================================================

  describe("实时提示", () => {
    it("启用实时提示时应该显示提示信息", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        showRealTimeHint: true,
      });

      await nextTick();

      const realTimeHint = wrapper.find(".real-time-hint");
      expect(realTimeHint.exists()).toBe(true);

      const hintText = wrapper.find(".hint-text");
      expect(hintText.text()).toBe("同期比分析将对比相同时间段的不同年份数据");
    });

    it("禁用实时提示时不应该显示提示信息", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        showRealTimeHint: false,
      });

      await nextTick();

      const realTimeHint = wrapper.find(".real-time-hint");
      expect(realTimeHint.exists()).toBe(false);
    });
  });

  // ==========================================================================
  // 边界情况测试
  // ==========================================================================

  describe("边界情况", () => {
    it("时间范围为null时应该显示成功状态", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: null,
      });

      await nextTick();

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("validation-success");
    });

    it("时间范围的日期为null时应该显示成功状态", async () => {
      const invalidRange: TimeRange = {
        startDate: null,
        endDate: null,
        unit: "day",
      };

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: invalidRange,
      });

      await nextTick();

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("validation-success");
    });

    it("同一天的时间范围应该显示成功状态", async () => {
      const sameDayRange = createTimeRange(2024, 6, 15, 2024, 6, 15);

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: sameDayRange,
      });

      await nextTick();

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("validation-success");
    });

    it("跨年但在同一年内的时间范围应该显示成功状态", async () => {
      // 2024年1月1日到2024年12月31日
      const fullYearRange = createTimeRange(2024, 1, 1, 2024, 12, 31);

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: fullYearRange,
      });

      await nextTick();

      const validationStatus = wrapper.find(".validation-status");
      expect(validationStatus.classes()).toContain("validation-success");
    });
  });

  // ==========================================================================
  // 事件测试
  // ==========================================================================

  describe("事件处理", () => {
    it("应该正确发送validation-update事件", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: createSameYearRange(),
      });

      await nextTick();

      const validationUpdateEvents = wrapper.emitted("validation-update");
      expect(validationUpdateEvents).toBeTruthy();

      const eventData = validationUpdateEvents![0][0] as ValidationResult;
      expect(eventData.isValid).toBe(true);
      expect(eventData.level).toBe("success");
      expect(eventData.message).toBe("时间范围符合同期比分析要求");
    });

    it("应该正确发送validation-change事件", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: createSameYearRange(),
      });

      await nextTick();

      const validationChangeEvents = wrapper.emitted("validation-change");
      expect(validationChangeEvents).toBeTruthy();

      const [isValid, level] = validationChangeEvents![0];
      expect(isValid).toBe(true);
      expect(level).toBe("success");
    });

    it("继续跨年操作后应该发送确认的验证结果", async () => {
      const crossYearRange = createCrossYearRange();

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: crossYearRange,
      });

      await nextTick();

      const continueButton = wrapper.find(".continue-button");
      await continueButton.trigger("click");
      await nextTick();

      const validationUpdateEvents = wrapper.emitted("validation-update");
      const lastEvent = validationUpdateEvents![
        validationUpdateEvents!.length - 1
      ][0] as ValidationResult;

      expect(lastEvent.message).toContain("已确认跨年查询");
      expect(lastEvent.suggestion).toBeUndefined();
    });
  });

  // ==========================================================================
  // 响应式和可访问性测试
  // ==========================================================================

  describe("响应式和可访问性", () => {
    it("按钮应该有正确的可访问性属性", async () => {
      const crossYearRange = createCrossYearRange();

      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: crossYearRange,
      });

      await nextTick();

      const continueButton = wrapper.find(".continue-button");
      const reselectButton = wrapper.find(".reselect-button");

      expect(continueButton.attributes("type")).toBe("button");
      expect(reselectButton.attributes("type")).toBe("button");
    });

    it("图标应该有正确的viewBox属性", async () => {
      wrapper = mountComponent({
        comparisonEnabled: true,
        timeRange: createSameYearRange(),
      });

      await nextTick();

      const successIcon = wrapper.find(".icon-success");
      expect(successIcon.attributes("viewBox")).toBe("0 0 24 24");
    });
  });
});
