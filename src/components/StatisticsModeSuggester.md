# StatisticsModeSuggester 组件

统计模式建议器组件，提供基于时间范围的智能统计模式推荐功能。

## 功能特性

### 核心功能

1. **智能推荐逻辑**

   - 基于时间范围自动推荐最适合的统计模式
   - 支持总量统计、按年统计、按月统计、按日统计四种模式
   - 提供推荐置信度和详细原因说明

2. **统计模式支持**

   - 历史总量：不限制时间范围的总体统计
   - 分年度统计：按年份分组的长期趋势分析
   - 分月度统计：按月份分组的中期趋势分析
   - 分日度统计：按日期分组的短期详细分析

3. **跨年查询支持**

   - 自动检测跨年时间范围
   - 提供年度分组选项
   - 优化年度对比分析体验

4. **自动推荐功能**
   - 支持高置信度推荐的自动应用
   - 可配置的自动应用阈值
   - 智能推荐状态管理

## 推荐逻辑

### 时间范围推荐规则

| 时间跨度     | 推荐模式 | 置信度 | 推荐原因               |
| ------------ | -------- | ------ | ---------------------- |
| 无时间限制   | 总量统计 | 0.8    | 适合整体数据概览       |
| ≤ 7 天       | 按日统计 | 0.9    | 详细趋势分析           |
| ≤ 31 天      | 按日统计 | 0.8    | 短期趋势分析           |
| ≤ 365 天     | 按月统计 | 0.9    | 平衡详细度和可读性     |
| ≤ 3 年且跨年 | 按年统计 | 0.9    | 年度对比分析           |
| ≤ 3 年且同年 | 按月统计 | 0.7    | 中期趋势分析           |
| > 3 年       | 按年统计 | 0.9    | 长期趋势，避免数据密集 |

### 特殊场景处理

1. **跨年查询**

   - 优先推荐按年统计
   - 提供年度分组选项
   - 增强年度对比功能

2. **短期查询**

   - 7 天内推荐按日统计
   - 提供详细的数据变化展示
   - 适合精细化分析

3. **长期查询**
   - 超过 3 年推荐按年统计
   - 避免数据过于密集
   - 突出长期趋势

## 使用方法

### 基础用法

```vue
<template>
  <StatisticsModeSuggester
    :time-range="timeRange"
    :current-mode="currentMode"
    @mode-change="handleModeChange"
  />
</template>

<script setup>
import { ref } from "vue";
import StatisticsModeSuggester from "./StatisticsModeSuggester.vue";

const timeRange = ref({
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  unit: "day",
});

const currentMode = ref("total");

function handleModeChange(mode) {
  currentMode.value = mode;
  console.log("统计模式变更为:", mode);
}
</script>
```

### 启用智能推荐

```vue
<template>
  <StatisticsModeSuggester
    :time-range="timeRange"
    :current-mode="currentMode"
    :show-suggestion="true"
    @mode-change="handleModeChange"
    @suggestion-applied="handleSuggestionApplied"
    @suggestion-dismissed="handleSuggestionDismissed"
  />
</template>

<script setup>
function handleSuggestionApplied(suggestion) {
  console.log("应用推荐:", suggestion.recommendedMode);
  console.log("推荐原因:", suggestion.reasons);
}

function handleSuggestionDismissed() {
  console.log("用户忽略了推荐");
}
</script>
```

### 自动应用推荐

```vue
<template>
  <StatisticsModeSuggester
    :time-range="timeRange"
    :current-mode="currentMode"
    :show-suggestion="true"
    :auto-apply="true"
    @mode-change="handleModeChange"
  />
</template>
```

### 跨年分组功能

```vue
<template>
  <StatisticsModeSuggester
    :time-range="crossYearTimeRange"
    :current-mode="currentMode"
    @yearly-grouping-change="handleYearlyGroupingChange"
  />
</template>

<script setup>
const crossYearTimeRange = ref({
  startDate: new Date("2023-01-01"),
  endDate: new Date("2024-12-31"),
  unit: "day",
});

function handleYearlyGroupingChange(enabled) {
  console.log("年度分组:", enabled ? "启用" : "禁用");
}
</script>
```

## Props

| 属性名               | 类型                 | 默认值      | 说明                       |
| -------------------- | -------------------- | ----------- | -------------------------- |
| `timeRange`          | `TimeRange \| null`  | `null`      | 当前时间范围               |
| `currentMode`        | `StatisticsMode`     | `'total'`   | 当前选择的统计模式         |
| `showSuggestion`     | `boolean`            | `true`      | 是否显示智能推荐           |
| `autoApply`          | `boolean`            | `false`     | 是否自动应用高置信度推荐   |
| `timeSelectionState` | `TimeSelectionState` | `undefined` | 完整的时间选择状态（可选） |

## Events

| 事件名                   | 参数                                 | 说明                   |
| ------------------------ | ------------------------------------ | ---------------------- |
| `mode-change`            | `(mode: StatisticsMode)`             | 统计模式变更时触发     |
| `yearly-grouping-change` | `(enabled: boolean)`                 | 年度分组选项变更时触发 |
| `suggestion-applied`     | `(suggestion: StatisticsSuggestion)` | 应用推荐时触发         |
| `suggestion-dismissed`   | `()`                                 | 忽略推荐时触发         |

## 类型定义

### StatisticsSuggestion

```typescript
interface StatisticsSuggestion {
  recommendedMode: StatisticsMode;
  title: string;
  description: string;
  type: "success" | "info" | "warning";
  confidence: number; // 0-1, 推荐置信度
  reasons: string[];
  showApplyButton: boolean;
}
```

### StatisticsMode

```typescript
interface StatisticsMode {
  key: StatisticsMode;
  label: string;
  description: string;
  applicableScenarios: string[];
  minDays?: number;
  maxDays?: number;
}
```

## 暴露的方法

| 方法名                   | 参数 | 返回值                 | 说明             |
| ------------------------ | ---- | ---------------------- | ---------------- |
| `applySuggestion`        | `()` | `void`                 | 手动应用当前推荐 |
| `dismissSuggestion`      | `()` | `void`                 | 手动忽略当前推荐 |
| `generateRecommendation` | `()` | `StatisticsSuggestion` | 生成推荐建议     |

## 样式定制

### CSS 变量

```css
.statistics-mode-suggester {
  --suggester-gap: 12px;
  --selector-label-color: #303133;
  --suggestion-border-radius: 6px;
  --cross-year-bg-color: #f5f7fa;
  --cross-year-border-color: #409eff;
}
```

### 响应式断点

- 桌面端：≥1024px - 水平布局
- 平板端：768px-1023px - 部分换行
- 移动端：<768px - 垂直布局

## 最佳实践

### 1. 推荐配置

```vue
<template>
  <StatisticsModeSuggester
    :time-range="timeRange"
    :current-mode="currentMode"
    :show-suggestion="true"
    :auto-apply="false"
    @mode-change="handleModeChange"
    @suggestion-applied="logSuggestionUsage"
  />
</template>
```

### 2. 与其他组件集成

```vue
<template>
  <div class="time-selection-panel">
    <TimeRangePicker v-model="timeRange" @change="handleTimeRangeChange" />

    <StatisticsModeSuggester
      :time-range="timeRange"
      :current-mode="statisticsMode"
      @mode-change="handleModeChange"
    />
  </div>
</template>

<script setup>
function handleTimeRangeChange(newRange) {
  timeRange.value = newRange;
  // 时间范围变化时，推荐状态会自动重置
}
</script>
```

### 3. 数据分析场景

```vue
<template>
  <StatisticsModeSuggester
    :time-range="analysisTimeRange"
    :current-mode="analysisMode"
    :show-suggestion="true"
    @mode-change="updateAnalysisMode"
    @yearly-grouping-change="updateGroupingStrategy"
  />
</template>

<script setup>
function updateAnalysisMode(mode) {
  analysisMode.value = mode;
  // 根据模式更新图表配置
  updateChartConfiguration(mode);
}

function updateGroupingStrategy(enabled) {
  // 更新数据分组策略
  dataGroupingEnabled.value = enabled;
}
</script>
```

## 注意事项

1. **性能优化**

   - 推荐计算会在时间范围变化时触发
   - 大时间跨度的计算已优化
   - 避免频繁的推荐状态变更

2. **用户体验**

   - 推荐不会强制应用，用户保持最终控制权
   - 提供清晰的推荐原因和置信度
   - 支持推荐的忽略和重新显示

3. **数据准确性**

   - 推荐逻辑基于通用的数据分析最佳实践
   - 特殊业务场景可能需要自定义推荐规则
   - 建议结合实际数据特征调整推荐参数

4. **可访问性**
   - 所有交互元素支持键盘导航
   - 推荐信息提供屏幕阅读器支持
   - 颜色信息不是唯一的状态指示器
