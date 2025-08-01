# TimeSelectionComponent 时间选择组件

## 概述

`TimeSelectionComponent` 是一个集成了所有时间选择功能的主组件，它整合了快捷选择面板、时间单位选择器、时间范围选择器、同期比验证器和统计模式建议器等子组件，提供完整的时间选择解决方案。

## 功能特性

- ✅ **快捷选择**: 支持历史总量、近两年、近六月、近三月、今年、去年等常用时间选择
- ✅ **多时间单位**: 支持年、月、日三种时间度量单位
- ✅ **智能验证**: 实时验证时间范围合理性，特别是同期比功能的跨年验证
- ✅ **统计建议**: 根据时间范围智能推荐合适的统计模式
- ✅ **响应式设计**: 支持桌面端、平板端和移动端适配
- ✅ **状态管理**: 完整的组件间状态同步和数据流控制
- ✅ **查询参数映射**: 自动将时间选择状态映射为 API 查询参数
- ✅ **可访问性支持**: 支持键盘导航、屏幕阅读器等无障碍功能

## 基础用法

```vue
<template>
  <TimeSelectionComponent
    v-model="timeSelectionState"
    @change="handleTimeSelectionChange"
    @query-params-update="handleQueryParamsUpdate"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import TimeSelectionComponent from "@/components/TimeSelectionComponent.vue";
import type {
  TimeSelectionState,
  TimeSelectionChangeEvent,
  QueryParams,
} from "@/types/time-selection";

const timeSelectionState = ref<TimeSelectionState>({
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
});

function handleTimeSelectionChange(event: TimeSelectionChangeEvent) {
  console.log("时间选择变更:", event);
}

function handleQueryParamsUpdate(params: QueryParams) {
  console.log("查询参数更新:", params);
  // 使用查询参数调用API
}
</script>
```

## Props 属性

| 属性名                          | 类型                              | 默认值                           | 说明                       |
| ------------------------------- | --------------------------------- | -------------------------------- | -------------------------- |
| `modelValue`                    | `TimeSelectionState`              | -                                | 当前时间选择状态           |
| `config`                        | `Partial<TimeSelectionConfig>`    | -                                | 组件配置，用于覆盖默认配置 |
| `disabled`                      | `boolean`                         | `false`                          | 是否禁用整个组件           |
| `size`                          | `'large' \| 'default' \| 'small'` | `'default'`                      | 组件大小                   |
| `showTitle`                     | `boolean`                         | `true`                           | 是否显示标题               |
| `title`                         | `string`                          | `'时间选择'`                     | 组件标题                   |
| `showHelp`                      | `boolean`                         | `true`                           | 是否显示帮助图标           |
| `helpText`                      | `string`                          | `'选择查询的时间范围和统计方式'` | 帮助文本                   |
| `showOverallValidation`         | `boolean`                         | `true`                           | 是否显示整体验证状态       |
| `showDebugInfo`                 | `boolean`                         | `false`                          | 是否显示调试信息           |
| `clearable`                     | `boolean`                         | `true`                           | 是否可清空                 |
| `availableTimeUnits`            | `TimeUnit[]`                      | `['year', 'month', 'day']`       | 可用的时间单位             |
| `autoApplyStatisticsSuggestion` | `boolean`                         | `false`                          | 是否自动应用统计建议       |
| `showComparisonHint`            | `boolean`                         | `false`                          | 是否显示同期比提示         |

## Events 事件

| 事件名                   | 参数                                       | 说明               |
| ------------------------ | ------------------------------------------ | ------------------ |
| `update:modelValue`      | `(value: TimeSelectionState)`              | 状态更新事件       |
| `change`                 | `(event: TimeSelectionChangeEvent)`        | 时间选择变更事件   |
| `query-params-update`    | `(params: QueryParams)`                    | 查询参数更新事件   |
| `validation-change`      | `(result: ValidationResult)`               | 验证状态变更事件   |
| `quick-option-select`    | `(option: QuickOption)`                    | 快捷选项选择事件   |
| `custom-select`          | `()`                                       | 自定义选择事件     |
| `time-unit-change`       | `(unit: TimeUnit, config: TimeUnitConfig)` | 时间单位变更事件   |
| `time-range-change`      | `(range: TimeRange \| null)`               | 时间范围变更事件   |
| `comparison-toggle`      | `(enabled: boolean)`                       | 同期比状态变更事件 |
| `statistics-mode-change` | `(mode: StatisticsMode)`                   | 统计模式变更事件   |
| `reset`                  | `()`                                       | 重置事件           |
| `error`                  | `(error: Error)`                           | 错误事件           |

## 方法

通过 `ref` 可以访问以下方法：

```vue
<template>
  <TimeSelectionComponent ref="timeSelectionRef" v-model="state" />
  <button @click="resetComponent">重置</button>
</template>

<script setup lang="ts">
import { ref } from "vue";

const timeSelectionRef = ref();

function resetComponent() {
  timeSelectionRef.value?.reset();
}
</script>
```

### 可用方法

| 方法名               | 参数                          | 返回值               | 说明             |
| -------------------- | ----------------------------- | -------------------- | ---------------- |
| `reset()`            | -                             | `void`               | 重置组件状态     |
| `setState(newState)` | `Partial<TimeSelectionState>` | `void`               | 设置时间选择状态 |
| `getState()`         | -                             | `TimeSelectionState` | 获取当前状态     |
| `getQueryParams()`   | -                             | `QueryParams`        | 获取查询参数     |
| `validate()`         | -                             | `ValidationResult`   | 验证当前状态     |

## 配置选项

### 自定义配置示例

```typescript
const customConfig: Partial<TimeSelectionConfig> = {
  // 默认时间单位
  defaultTimeUnit: "month",

  // 是否显示同期比选项
  showComparison: true,

  // 是否显示统计模式建议
  showStatisticsSuggestion: true,

  // 快捷选择配置
  quickSelection: {
    options: [
      {
        key: "thisYear",
        label: "今年",
        timeRange: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2024, 11, 31),
          unit: "month",
        },
        statisticsMode: "monthly",
        description: "查询当前年度数据，按月统计",
      },
    ],
    defaultOption: "thisYear",
    showCustomOption: true,
  },

  // 验证配置
  validation: {
    enableRealTimeValidation: true,
    showValidationMessages: true,
    rules: {
      validateDateRange: true,
      validateComparisonRange: true,
      validateFutureDate: true,
      maxTimeSpanDays: 1095, // 3年
    },
  },
};
```

## 使用场景

### 1. 基础查询场景

```vue
<template>
  <TimeSelectionComponent
    v-model="basicState"
    title="合格证查询"
    @query-params-update="performQuery"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";

const basicState = ref({
  quickSelection: "thisYear",
  timeUnit: "day",
  timeRange: null,
  comparisonEnabled: false,
  statisticsMode: "total",
  validation: { isValid: true, level: "success", message: "" },
});

async function performQuery(params: QueryParams) {
  try {
    const response = await api.queryCertificates(params);
    // 处理查询结果
  } catch (error) {
    console.error("查询失败:", error);
  }
}
</script>
```

### 2. 高级分析场景

```vue
<template>
  <TimeSelectionComponent
    v-model="analysisState"
    :config="analysisConfig"
    title="数据分析"
    size="large"
    :auto-apply-statistics-suggestion="true"
    @change="handleAnalysisChange"
  />
</template>

<script setup lang="ts">
const analysisConfig = {
  showComparison: true,
  showStatisticsSuggestion: true,
  validation: {
    enableRealTimeValidation: true,
    showValidationMessages: true,
  },
};

function handleAnalysisChange(event: TimeSelectionChangeEvent) {
  if (event.changeType === "statistics_mode") {
    // 统计模式变更时的特殊处理
    updateChartType(event.currentState.statisticsMode);
  }
}
</script>
```

### 3. 移动端适配场景

```vue
<template>
  <div class="mobile-query">
    <TimeSelectionComponent
      v-model="mobileState"
      title="快速查询"
      size="small"
      :show-help="false"
      :show-debug-info="false"
    />
  </div>
</template>

<style scoped>
.mobile-query {
  padding: 12px;
}

@media (max-width: 768px) {
  .mobile-query :deep(.time-selection-component) {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
</style>
```

## 状态管理

### TimeSelectionState 结构

```typescript
interface TimeSelectionState {
  /** 当前选中的快捷选项 */
  quickSelection: string | null;

  /** 当前选择的时间单位 */
  timeUnit: TimeUnit;

  /** 当前选择的时间范围 */
  timeRange: TimeRange | null;

  /** 是否启用同期比功能 */
  comparisonEnabled: boolean;

  /** 当前统计模式 */
  statisticsMode: StatisticsMode;

  /** 验证结果 */
  validation: ValidationResult;
}
```

### 状态变更事件

```typescript
interface TimeSelectionChangeEvent {
  /** 变更前的状态 */
  previousState: TimeSelectionState;

  /** 变更后的状态 */
  currentState: TimeSelectionState;

  /** 变更类型 */
  changeType: TimeSelectionChangeType;

  /** 触发变更的源 */
  source: TimeSelectionEventSource;
}
```

## 查询参数映射

组件会自动将时间选择状态映射为标准的查询参数：

```typescript
interface QueryParams {
  // 时间相关参数
  timeUnit: TimeUnit;
  startDate?: string;
  endDate?: string;

  // 数据库字段映射 - 统一使用UPD
  dbTimeField: "UPD";

  // 查询策略和分组
  queryStrategy: QueryStrategy;
  groupByExpression?: string;

  // 统计模式
  groupBy?: "year" | "month" | "day";

  // 同期比
  enableComparison: boolean;

  // 快捷选择信息
  quickSelectionKey?: string;
}
```

## 验证机制

### 实时验证

组件支持多层次的实时验证：

1. **时间范围验证**: 检查开始时间是否早于结束时间
2. **同期比验证**: 检查跨年时间范围的合理性
3. **未来日期验证**: 防止选择未来日期
4. **时间跨度验证**: 限制最大时间跨度

### 验证结果处理

```vue
<template>
  <TimeSelectionComponent
    v-model="state"
    @validation-change="handleValidationChange"
  />
</template>

<script setup lang="ts">
function handleValidationChange(result: ValidationResult) {
  if (!result.isValid) {
    // 处理验证失败
    if (result.level === "error") {
      // 阻止查询
      showErrorMessage(result.message);
    } else if (result.level === "warning") {
      // 显示警告但允许继续
      showWarningMessage(result.message);
    }
  }
}
</script>
```

## 样式定制

### CSS 变量

组件支持通过 CSS 变量进行样式定制：

```css
.time-selection-component {
  --time-selection-primary-color: #409eff;
  --time-selection-success-color: #67c23a;
  --time-selection-warning-color: #e6a23c;
  --time-selection-error-color: #f56c6c;
  --time-selection-border-radius: 8px;
  --time-selection-padding: 20px;
}
```

### 尺寸变体

```vue
<!-- 大尺寸 -->
<TimeSelectionComponent size="large" />

<!-- 默认尺寸 -->
<TimeSelectionComponent size="default" />

<!-- 小尺寸 -->
<TimeSelectionComponent size="small" />
```

## 可访问性

组件遵循 WCAG 2.1 AA 标准：

- ✅ 键盘导航支持
- ✅ 屏幕阅读器支持
- ✅ 高对比度模式支持
- ✅ 色盲友好设计
- ✅ 语义化 HTML 结构

### 键盘快捷键

| 快捷键            | 功能           |
| ----------------- | -------------- |
| `Tab`             | 在组件间导航   |
| `Shift + Tab`     | 反向导航       |
| `Enter` / `Space` | 激活按钮或选项 |
| `Escape`          | 关闭弹出层     |
| `Arrow Keys`      | 在选项间导航   |

## 性能优化

### 渲染优化

- 使用 Vue 3 的响应式系统
- 组件懒加载
- 计算属性缓存

### 交互优化

- 防抖处理用户输入
- 缓存计算结果
- 预加载常用数据

## 故障排除

### 常见问题

1. **组件不显示**

   - 检查是否正确导入组件
   - 确认 Element Plus 已正确安装

2. **状态不更新**

   - 确保使用 `v-model` 绑定
   - 检查状态对象的响应式

3. **验证不工作**

   - 检查配置中的验证规则
   - 确认时间范围格式正确

4. **样式异常**
   - 检查 CSS 导入
   - 确认没有样式冲突

### 调试模式

启用调试模式查看详细信息：

```vue
<TimeSelectionComponent v-model="state" :show-debug-info="true" />
```

## 更新日志

### v1.0.0

- ✅ 初始版本发布
- ✅ 支持基础时间选择功能
- ✅ 集成所有子组件
- ✅ 响应式设计支持
- ✅ 完整的测试覆盖

## 相关组件

- [QuickSelectionPanel](./QuickSelectionPanel.md) - 快捷选择面板
- [TimeUnitSelector](./TimeUnitSelector.md) - 时间单位选择器
- [TimeRangePickerNew](./TimeRangePickerNew.md) - 时间范围选择器
- [ComparisonValidator](./ComparisonValidator.md) - 同期比验证器
- [StatisticsModeSuggester](./StatisticsModeSuggester.md) - 统计模式建议器
