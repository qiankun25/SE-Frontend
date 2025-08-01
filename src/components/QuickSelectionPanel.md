# QuickSelectionPanel 快捷选择面板组件

## 概述

QuickSelectionPanel 是一个用于时间选择的快捷面板组件，提供常用时间范围的快速选择功能。该组件支持多种预设选项、自定义配置、描述提示和统计模式建议等功能。

## 功能特性

- ✅ 预设常用时间选择选项（历史总量、近两年、近六月、近三月、今年、去年）
- ✅ 支持自定义快捷选项配置
- ✅ 选中状态的视觉反馈和交互逻辑
- ✅ 快捷选项的描述提示
- ✅ 智能推荐统计模式
- ✅ 响应式设计，支持桌面端、平板端和移动端
- ✅ 可访问性支持
- ✅ 完整的单元测试覆盖

## 基础用法

```vue
<template>
  <QuickSelectionPanel
    v-model="selectedOption"
    @option-select="handleOptionSelect"
    @custom-select="handleCustomSelect"
  />
</template>

<script setup>
import { ref } from "vue";
import QuickSelectionPanel from "@/components/QuickSelectionPanel.vue";

const selectedOption = ref(null);

function handleOptionSelect(option) {
  console.log("选择了选项:", option);
}

function handleCustomSelect() {
  console.log("点击了自定义选项");
}
</script>
```

## API 文档

### Props

| 属性名                     | 类型                              | 默认值      | 说明                                     |
| -------------------------- | --------------------------------- | ----------- | ---------------------------------------- |
| `modelValue`               | `string \| null`                  | `null`      | 当前选中的选项 key                       |
| `showDescription`          | `boolean`                         | `true`      | 是否显示描述信息                         |
| `showCustomOption`         | `boolean`                         | `true`      | 是否显示自定义选项                       |
| `showStatisticsSuggestion` | `boolean`                         | `true`      | 是否显示统计模式建议                     |
| `customOptions`            | `QuickOption[]`                   | `undefined` | 自定义快捷选项（可选，用于覆盖默认配置） |
| `disabled`                 | `boolean`                         | `false`     | 是否禁用组件                             |
| `size`                     | `'large' \| 'default' \| 'small'` | `'default'` | 组件大小                                 |

### Events

| 事件名              | 参数                          | 说明               |
| ------------------- | ----------------------------- | ------------------ |
| `update:modelValue` | `value: string \| null`       | 选项变更事件       |
| `option-select`     | `option: QuickOption`         | 快捷选项选择事件   |
| `custom-select`     | -                             | 自定义选项点击事件 |
| `option-hover`      | `option: QuickOption \| null` | 选项悬停事件       |

### 暴露的方法

| 方法名              | 参数                        | 返回值 | 说明         |
| ------------------- | --------------------------- | ------ | ------------ |
| `resetSelection`    | -                           | `void` | 重置选择     |
| `setSelectedOption` | `optionKey: string \| null` | `void` | 设置选中选项 |

### 暴露的属性

| 属性名                 | 类型                               | 说明               |
| ---------------------- | ---------------------------------- | ------------------ |
| `selectedOption`       | `Ref<string \| null>`              | 当前选中的选项     |
| `selectedOptionObject` | `ComputedRef<QuickOption \| null>` | 当前选中的选项对象 |

## 类型定义

### QuickOption

```typescript
interface QuickOption {
  /** 选项唯一标识 */
  key: string;
  /** 显示标签 */
  label: string;
  /** 对应的时间范围，null表示不限制时间范围 */
  timeRange: TimeRange | null;
  /** 推荐的统计模式 */
  statisticsMode?: StatisticsMode;
  /** 选项描述 */
  description: string;
  /** 是否为默认选项 */
  isDefault?: boolean;
}
```

### TimeRange

```typescript
interface TimeRange {
  /** 开始日期 */
  startDate: Date | null;
  /** 结束日期 */
  endDate: Date | null;
  /** 时间单位 */
  unit: TimeUnit;
}
```

### StatisticsMode

```typescript
type StatisticsMode = "total" | "yearly" | "monthly" | "daily";
```

## 预设选项

组件提供以下预设快捷选项：

| 选项     | Key             | 描述                                         | 推荐统计模式 |
| -------- | --------------- | -------------------------------------------- | ------------ |
| 历史总量 | `historical`    | 查询所有历史数据，适用于企业或品牌的总体统计 | `total`      |
| 近两年   | `recent2years`  | 查询近两年数据，推荐按年度分组               | `yearly`     |
| 近六月   | `recent6months` | 查询近六个月数据，推荐按月度分组             | `monthly`    |
| 近三月   | `recent3months` | 查询近三个月数据，适用于短期趋势分析         | `monthly`    |
| 今年     | `thisYear`      | 查询当前年度数据                             | `monthly`    |
| 去年     | `lastYear`      | 查询上一年度数据                             | `monthly`    |

## 高级用法

### 自定义快捷选项

```vue
<template>
  <QuickSelectionPanel
    v-model="selectedOption"
    :custom-options="customOptions"
  />
</template>

<script setup>
import { ref } from "vue";

const selectedOption = ref(null);

const customOptions = [
  {
    key: "last7days",
    label: "近7天",
    timeRange: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      unit: "day",
    },
    statisticsMode: "daily",
    description: "查询最近7天的数据",
  },
  {
    key: "currentQuarter",
    label: "本季度",
    timeRange: {
      startDate: getCurrentQuarterStart(),
      endDate: getCurrentQuarterEnd(),
      unit: "day",
    },
    statisticsMode: "monthly",
    description: "查询当前季度的数据",
  },
];
</script>
```

### 禁用特定功能

```vue
<template>
  <QuickSelectionPanel
    v-model="selectedOption"
    :show-description="false"
    :show-custom-option="false"
    :show-statistics-suggestion="false"
  />
</template>
```

### 使用暴露的方法

```vue
<template>
  <div>
    <QuickSelectionPanel ref="quickPanelRef" v-model="selectedOption" />
    <el-button @click="resetPanel">重置</el-button>
    <el-button @click="selectThisYear">选择今年</el-button>
  </div>
</template>

<script setup>
import { ref } from "vue";

const quickPanelRef = ref();
const selectedOption = ref(null);

function resetPanel() {
  quickPanelRef.value?.resetSelection();
}

function selectThisYear() {
  quickPanelRef.value?.setSelectedOption("thisYear");
}
</script>
```

## 样式定制

### CSS 变量

组件支持通过 CSS 变量进行样式定制：

```css
.quick-selection-panel {
  /* 主色调 */
  --quick-panel-primary-color: #409eff;

  /* 背景色 */
  --quick-panel-bg-color: #ffffff;

  /* 边框色 */
  --quick-panel-border-color: #e4e7ed;

  /* 文本色 */
  --quick-panel-text-color: #303133;

  /* 按钮间距 */
  --quick-panel-button-gap: 8px;

  /* 圆角 */
  --quick-panel-border-radius: 6px;
}
```

### 自定义样式类

```css
/* 自定义按钮样式 */
.quick-selection-panel .quick-option-button.my-custom-style {
  background: linear-gradient(45deg, #409eff, #67c23a);
  color: white;
  border: none;
}

/* 自定义选中状态 */
.quick-selection-panel .quick-option-button.selected.my-custom-style {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transform: translateY(-2px);
}
```

## 响应式设计

组件内置响应式设计，在不同屏幕尺寸下自动调整布局：

- **桌面端 (≥1024px)**: 水平网格布局，所有选项在一行显示
- **平板端 (768px-1023px)**: 部分选项换行显示
- **移动端 (<768px)**: 垂直布局，每个选项占一行

## 可访问性

组件遵循 WCAG 2.1 可访问性标准：

- ✅ 键盘导航支持（Tab 键顺序）
- ✅ 屏幕阅读器支持（ARIA 标签）
- ✅ 高对比度模式支持
- ✅ 减少动画模式支持
- ✅ 色盲友好的颜色方案

## 测试

组件包含完整的单元测试覆盖：

```bash
# 运行测试
npm run test

# 运行测试并监听变化
npm run test:watch

# 运行测试 UI
npm run test:ui
```

测试覆盖范围：

- ✅ 基础渲染测试
- ✅ Props 功能测试
- ✅ 用户交互测试
- ✅ 描述和建议功能测试
- ✅ 响应式和状态管理测试
- ✅ 暴露方法测试
- ✅ 边界情况测试
- ✅ 可访问性测试
- ✅ 性能优化测试

## 最佳实践

### 1. 合理使用描述信息

```vue
<!-- 推荐：在复杂场景下显示描述 -->
<QuickSelectionPanel
  v-model="selectedOption"
  :show-description="isComplexScenario"
/>
```

### 2. 根据业务场景自定义选项

```vue
<!-- 推荐：根据具体业务需求定制选项 -->
<QuickSelectionPanel
  v-model="selectedOption"
  :custom-options="businessSpecificOptions"
/>
```

### 3. 监听事件进行业务逻辑处理

```vue
<template>
  <QuickSelectionPanel
    v-model="selectedOption"
    @option-select="handleBusinessLogic"
  />
</template>

<script setup>
function handleBusinessLogic(option) {
  // 根据选择的选项执行相应的业务逻辑
  if (option.key === "historical") {
    // 处理历史总量查询
  } else if (option.statisticsMode === "yearly") {
    // 处理年度统计
  }
}
</script>
```

### 4. 性能优化

```vue
<!-- 推荐：在不需要的场景下关闭不必要的功能 -->
<QuickSelectionPanel
  v-model="selectedOption"
  :show-statistics-suggestion="false"
  :show-description="false"
/>
```

## 常见问题

### Q: 如何添加新的快捷选项？

A: 可以通过 `customOptions` prop 传入自定义选项，或者修改 `src/config/time-selection.ts` 中的 `QUICK_OPTIONS` 配置。

### Q: 如何自定义选项的时间范围计算？

A: 在 `QuickOption` 的 `timeRange` 属性中定义具体的开始和结束日期。可以使用 JavaScript 的 Date 对象进行动态计算。

### Q: 组件是否支持国际化？

A: 目前组件使用中文标签，如需国际化支持，可以通过 `customOptions` 传入不同语言的选项配置。

### Q: 如何处理选项选择后的业务逻辑？

A: 监听 `option-select` 事件，在事件处理函数中根据选择的选项执行相应的业务逻辑。

## 更新日志

### v1.0.0 (2024-01-01)

- ✅ 初始版本发布
- ✅ 支持基础快捷选择功能
- ✅ 完整的单元测试覆盖
- ✅ 响应式设计支持
- ✅ 可访问性支持

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个组件。在提交代码前，请确保：

1. 运行测试并确保所有测试通过
2. 遵循现有的代码风格
3. 添加必要的测试用例
4. 更新相关文档

## 许可证

MIT License
