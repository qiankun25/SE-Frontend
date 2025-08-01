# ComparisonValidator 组件

## 概述

ComparisonValidator 是时间选择功能改进中的同期比验证器组件，负责验证同期比功能的时间范围合理性，提供跨年时间范围的警告提醒和用户选择界面。

## 功能特性

### 核心功能

1. **同期比时间范围验证**

   - 检验时间范围是否为同一年份的时间段
   - 提供实时验证和状态更新机制
   - 支持自定义验证规则配置

2. **跨年警告处理**

   - 自动检测跨年时间范围
   - 显示警告提醒和建议信息
   - 提供用户选择界面（继续或重新选择）

3. **视觉反馈系统**

   - 成功、警告、错误状态的视觉反馈
   - 状态图标和颜色区分
   - 响应式设计和动画效果

4. **实时验证**
   - 时间范围变化时自动验证
   - 同期比启用状态变化时更新验证
   - 可配置的验证触发机制

## Props

| 属性名                     | 类型                | 默认值  | 说明               |
| -------------------------- | ------------------- | ------- | ------------------ |
| `timeRange`                | `TimeRange \| null` | `null`  | 当前选择的时间范围 |
| `comparisonEnabled`        | `boolean`           | `false` | 是否启用同期比功能 |
| `enableRealTimeValidation` | `boolean`           | `true`  | 是否启用实时验证   |
| `showValidationMessages`   | `boolean`           | `true`  | 是否显示验证消息   |
| `showRealTimeHint`         | `boolean`           | `false` | 是否显示实时提示   |

## Events

| 事件名                | 参数                              | 说明                       |
| --------------------- | --------------------------------- | -------------------------- |
| `validation-update`   | `ValidationResult`                | 验证结果更新时触发         |
| `continue-cross-year` | -                                 | 用户选择继续跨年查询时触发 |
| `reselect-time`       | -                                 | 用户选择重新选择时间时触发 |
| `validation-change`   | `isValid: boolean, level: string` | 验证状态变化时触发         |

## 使用示例

### 基础用法

```vue
<template>
  <ComparisonValidator
    :time-range="timeRange"
    :comparison-enabled="comparisonEnabled"
    @validation-update="handleValidationUpdate"
    @continue-cross-year="handleContinueCrossYear"
    @reselect-time="handleReselectTime"
  />
</template>

<script setup>
import { ref } from "vue";
import ComparisonValidator from "./ComparisonValidator.vue";

const timeRange = ref({
  startDate: new Date(2023, 5, 1),
  endDate: new Date(2024, 5, 30),
  unit: "day",
});

const comparisonEnabled = ref(true);

const handleValidationUpdate = (result) => {
  console.log("验证结果:", result);
};

const handleContinueCrossYear = () => {
  console.log("用户选择继续跨年查询");
};

const handleReselectTime = () => {
  console.log("用户选择重新选择时间");
  // 重置时间选择或打开时间选择器
};
</script>
```

### 高级配置

```vue
<template>
  <ComparisonValidator
    :time-range="timeRange"
    :comparison-enabled="comparisonEnabled"
    :enable-real-time-validation="true"
    :show-validation-messages="true"
    :show-real-time-hint="true"
    @validation-update="handleValidationUpdate"
    @validation-change="handleValidationChange"
  />
</template>

<script setup>
const handleValidationChange = (isValid, level) => {
  console.log(`验证状态变化: ${isValid ? "有效" : "无效"}, 级别: ${level}`);

  // 根据验证状态更新UI
  if (!isValid && level === "warning") {
    // 显示警告样式
  } else if (!isValid && level === "error") {
    // 显示错误样式
  }
};
</script>
```

## 验证逻辑

### 验证规则

1. **同一年份验证**

   ```typescript
   // 成功：时间范围在同一年份内
   startYear === endYear → 成功状态

   // 警告：时间范围跨越多个年份
   startYear !== endYear → 警告状态
   ```

2. **空值处理**
   ```typescript
   // 同期比未启用或时间范围为空时返回成功
   !comparisonEnabled || !timeRange → 成功状态
   ```

### 验证结果类型

```typescript
interface ValidationResult {
  isValid: boolean; // 验证是否通过
  level: "success" | "warning" | "error"; // 验证级别
  message: string; // 验证消息
  suggestion?: string; // 建议信息（可选）
}
```

## 样式定制

### CSS 变量

```css
.comparison-validator {
  /* 成功状态颜色 */
  --success-color: #67c23a;
  --success-bg: #f0f9ff;

  /* 警告状态颜色 */
  --warning-color: #e6a23c;
  --warning-bg: #fdf6ec;

  /* 错误状态颜色 */
  --error-color: #f56c6c;
  --error-bg: #fef0f0;

  /* 按钮颜色 */
  --button-primary: #409eff;
  --button-warning: #e6a23c;
}
```

### 自定义样式类

```css
/* 自定义验证状态样式 */
.validation-status.custom-success {
  border-left: 4px solid var(--success-color);
}

.validation-status.custom-warning {
  border-left: 4px solid var(--warning-color);
}

/* 自定义按钮样式 */
.action-button.custom-style {
  border-radius: 8px;
  font-weight: 600;
}
```

## 可访问性

### 键盘导航

- 按钮支持 Tab 键导航
- 支持 Enter 和 Space 键激活按钮
- 合理的焦点顺序

### 屏幕阅读器

- 使用语义化的 HTML 结构
- 提供适当的 ARIA 标签
- 状态变化时提供通知

### 视觉辅助

- 支持高对比度模式
- 色盲友好的颜色方案
- 支持减少动画模式

## 最佳实践

### 1. 事件处理

```vue
<script setup>
// 推荐：使用具体的事件处理函数
const handleValidationUpdate = (result) => {
  if (result.level === "warning") {
    // 处理警告状态
    showWarningNotification(result.message);
  }
};

// 推荐：处理用户选择
const handleContinueCrossYear = () => {
  // 记录用户选择
  analytics.track("comparison_cross_year_continue");

  // 更新应用状态
  updateComparisonSettings({ allowCrossYear: true });
};
</script>
```

### 2. 状态管理

```vue
<script setup>
import { computed } from "vue";

// 推荐：使用计算属性管理复杂状态
const validationConfig = computed(() => ({
  enableRealTimeValidation: settings.value.realTimeValidation,
  showValidationMessages: !settings.value.silentMode,
  showRealTimeHint: settings.value.showHints,
}));
</script>
```

### 3. 错误处理

```vue
<script setup>
const handleValidationError = (error) => {
  console.error("验证错误:", error);

  // 显示用户友好的错误信息
  showErrorMessage("验证过程中出现错误，请重试");

  // 重置到安全状态
  resetValidationState();
};
</script>
```

## 测试

### 单元测试覆盖

- ✅ 基础渲染测试
- ✅ 同期比验证逻辑测试
- ✅ 跨年用户选择界面测试
- ✅ 实时验证和状态更新测试
- ✅ 视觉反馈测试
- ✅ 事件处理测试
- ✅ 边界情况测试
- ✅ 可访问性测试

### 测试运行

```bash
# 运行组件测试
npm test -- ComparisonValidator.test.ts

# 运行测试并查看覆盖率
npm run test:coverage -- ComparisonValidator
```

## 性能优化

### 1. 计算属性缓存

组件使用 Vue 3 的计算属性来缓存验证结果，避免不必要的重复计算。

### 2. 事件防抖

对于频繁的时间范围变化，组件内部实现了变化检测机制，避免重复验证。

### 3. 条件渲染

只在需要时渲染验证界面和用户选择按钮，减少 DOM 节点数量。

## 故障排除

### 常见问题

1. **验证不触发**

   - 检查 `enableRealTimeValidation` 是否为 `true`
   - 确认 `comparisonEnabled` 状态正确
   - 验证时间范围数据格式

2. **按钮不显示**

   - 检查 `showValidationMessages` 配置
   - 确认时间范围确实跨年
   - 验证组件渲染条件

3. **事件不触发**
   - 检查事件监听器绑定
   - 确认事件名称拼写正确
   - 验证组件实例状态

### 调试技巧

```vue
<template>
  <!-- 开发模式下显示调试信息 -->
  <div v-if="isDev" class="debug-info">
    <pre>{{ JSON.stringify(validationResult, null, 2) }}</pre>
  </div>
</template>

<script setup>
const isDev = process.env.NODE_ENV === "development";

// 监听验证结果变化
watch(
  validationResult,
  (result) => {
    if (isDev) {
      console.log("验证结果更新:", result);
    }
  },
  { deep: true }
);
</script>
```

## 更新日志

### v1.0.0

- ✅ 初始版本发布
- ✅ 实现基础验证功能
- ✅ 添加跨年警告处理
- ✅ 完成单元测试覆盖
- ✅ 支持可访问性特性
