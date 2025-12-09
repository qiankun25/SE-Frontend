# DisplayFields 组件字段显示 Bug 修复说明

## 🐛 Bug 描述

### 问题现象

在企业基本信息（EnterpriseInfo.vue）页面的"展示字段"区域，仍然显示了应该隐藏的字段：

- 联系人
- 联系人职务
- 联系人号码
- 统一社会信用代码
- 监管状态

### 问题原因

**EnterpriseInfo.vue 使用了错误的 field-type**：

```vue
<!-- ❌ 错误：使用了 enterprise_supervision -->
<DisplayFields
  field-type="enterprise_supervision"
  :initial-fields="selectedFields"
  @fields-change="handleFieldsChange"
/>
```

这导致 DisplayFields 组件加载了 `enterpriseSupervisionFields` 配置，而该配置包含了所有字段（包括应该隐藏的字段）。

---

## ✅ 修复方案

### 方案概述

在 DisplayFields.vue 组件中新增 `enterprise_basic` 字段类型，专门用于企业基本信息页面，并确保两个页面使用不同的字段配置。

### 修复步骤

#### 1️⃣ 修改 DisplayFields.vue

##### 1.1 扩展 fieldType 类型定义

```typescript
// 修改前
const props = defineProps<{
  fieldType?: "enterprise" | "certificate" | "enterprise_supervision";
  initialFields?: string[];
}>();

// 修改后
const props = defineProps<{
  fieldType?:
    | "enterprise"
    | "certificate"
    | "enterprise_supervision"
    | "enterprise_basic";
  initialFields?: string[];
}>();
```

##### 1.2 新增 enterpriseBasicFields 配置

```typescript
// 企业基本信息字段配置（已隐藏部分字段）
const enterpriseBasicFields: Field[] = [
  { key: "enterprise_id", label: "企业ID", selected: true },
  { key: "enterprise_name", label: "企业名称", selected: true },
  // social_credit_code - 已隐藏
  // supervision_status - 已隐藏
  { key: "supervision_code", label: "监管代码", selected: false },
  { key: "access_status", label: "企业准入状态", selected: false },
  { key: "valid_flag", label: "有效标记", selected: false },
  { key: "enterprise_type", label: "企业类型", selected: true },
  { key: "new_energy_flag", label: "新能源标记", selected: true },
  { key: "registered_address", label: "注册地址", selected: true },
  { key: "production_address", label: "生产地址", selected: true },
  { key: "product_brand", label: "产品商标", selected: true },
  { key: "qualification", label: "资质", selected: false },
  // contact_person - 已隐藏
  // contact_position - 已隐藏
  // contact_phone - 已隐藏
];
```

##### 1.3 更新 enterpriseSupervisionFields 配置

```typescript
// 企业监管状态字段配置（已隐藏部分字段）
const enterpriseSupervisionFields: Field[] = [
  { key: "enterprise_id", label: "企业ID", selected: true },
  { key: "enterprise_name", label: "企业名称", selected: true },
  // social_credit_code - 已隐藏
  { key: "supervision_status", label: "监管状态", selected: true },
  { key: "supervision_code", label: "监管代码", selected: false },
  { key: "access_status", label: "企业准入状态", selected: true },
  { key: "valid_flag", label: "有效标记", selected: false },
  { key: "enterprise_type", label: "企业类型", selected: true },
  { key: "new_energy_flag", label: "新能源标记", selected: true },
  // registered_address - 已隐藏
  // production_address - 已隐藏
  // product_brand - 已隐藏
  { key: "qualification", label: "资质", selected: false },
  // contact_person - 已隐藏
  // contact_position - 已隐藏
  // contact_phone - 已隐藏
];
```

##### 1.4 更新 initializeFields 方法

```typescript
const initializeFields = () => {
  const fieldType = props.fieldType || "enterprise";
  if (fieldType === "certificate") {
    fields.value = [...certificateFields];
  } else if (fieldType === "enterprise_supervision") {
    fields.value = [...enterpriseSupervisionFields];
  } else if (fieldType === "enterprise_basic") {
    // ⭐ 新增
    fields.value = [...enterpriseBasicFields];
  } else {
    fields.value = [...enterpriseFields];
  }

  // 如果有初始字段配置，应用它们
  if (props.initialFields && props.initialFields.length > 0) {
    fields.value.forEach((field) => {
      field.selected = props.initialFields!.includes(field.key);
    });
  }
};
```

#### 2️⃣ 修改 EnterpriseInfo.vue

```vue
<!-- 修改前 -->
<DisplayFields
  field-type="enterprise_supervision"
  :initial-fields="selectedFields"
  @fields-change="handleFieldsChange"
/>

<!-- 修改后 -->
<DisplayFields
  field-type="enterprise_basic"
  :initial-fields="selectedFields"
  @fields-change="handleFieldsChange"
/>
```

---

## 📊 修复效果对比

### 修复前

**EnterpriseInfo.vue 展示字段**（错误地使用了 enterprise_supervision 配置）：

- ✅ 企业 ID
- ✅ 企业名称
- ❌ 统一社会信用代码（应该隐藏）
- ❌ 监管状态（应该隐藏）
- ✅ 监管代码
- ✅ 企业准入状态
- ✅ 有效标记
- ✅ 企业类型
- ✅ 新能源标记
- ✅ 注册地址
- ✅ 生产地址
- ✅ 产品商标
- ✅ 资质
- ❌ 联系人（应该隐藏）
- ❌ 联系人职务（应该隐藏）
- ❌ 联系人号码（应该隐藏）

**共 16 个字段（包含 5 个应该隐藏的字段）**

### 修复后

**EnterpriseInfo.vue 展示字段**（正确使用 enterprise_basic 配置）：

- ✅ 企业 ID
- ✅ 企业名称
- ✅ 监管代码
- ✅ 企业准入状态
- ✅ 有效标记
- ✅ 企业类型
- ✅ 新能源标记
- ✅ 注册地址
- ✅ 生产地址
- ✅ 产品商标
- ✅ 资质

**共 11 个字段（已正确隐藏 5 个字段）**

**EnterpriseSupervision.vue 展示字段**（使用 enterprise_supervision 配置）：

- ✅ 企业 ID
- ✅ 企业名称
- ✅ 监管状态
- ✅ 监管代码
- ✅ 企业准入状态
- ✅ 有效标记
- ✅ 企业类型
- ✅ 新能源标记
- ✅ 资质

**共 9 个字段（已正确隐藏 7 个字段）**

---

## 🎯 字段配置对比表

| 字段             | enterprise_basic | enterprise_supervision | 说明           |
| ---------------- | ---------------- | ---------------------- | -------------- |
| 企业 ID          | ✅               | ✅                     | 两者都显示     |
| 企业名称         | ✅               | ✅                     | 两者都显示     |
| 统一社会信用代码 | ❌               | ❌                     | 两者都隐藏     |
| 监管状态         | ❌               | ✅                     | 仅监管状态显示 |
| 监管代码         | ✅               | ✅                     | 两者都显示     |
| 企业准入状态     | ✅               | ✅                     | 两者都显示     |
| 有效标记         | ✅               | ✅                     | 两者都显示     |
| 企业类型         | ✅               | ✅                     | 两者都显示     |
| 新能源标记       | ✅               | ✅                     | 两者都显示     |
| 注册地址         | ✅               | ❌                     | 仅基本信息显示 |
| 生产地址         | ✅               | ❌                     | 仅基本信息显示 |
| 产品商标         | ✅               | ❌                     | 仅基本信息显示 |
| 资质             | ✅               | ✅                     | 两者都显示     |
| 联系人           | ❌               | ❌                     | 两者都隐藏     |
| 联系人职务       | ❌               | ❌                     | 两者都隐藏     |
| 联系人号码       | ❌               | ❌                     | 两者都隐藏     |
| **字段总数**     | **11**           | **9**                  | 差异化明显     |

---

## ✅ 验证结果

### 代码验证

- ✅ TypeScript 编译通过
- ✅ 无 ESLint 错误
- ✅ 组件类型定义正确

### 功能验证

- ✅ EnterpriseInfo.vue 展示字段正确（11 个字段）
- ✅ EnterpriseSupervision.vue 展示字段正确（9 个字段）
- ✅ 字段选择功能正常
- ✅ 导出功能正常（只能导出可见字段）
- ✅ 查询功能正常

---

## 📝 技术要点

### 1. 组件复用与配置分离

DisplayFields 组件通过 `fieldType` prop 支持多种字段配置：

- `enterprise`: 企业信息（原有）
- `certificate`: 合格证信息（原有）
- `enterprise_supervision`: 企业监管状态（新增）
- `enterprise_basic`: 企业基本信息（新增）

### 2. 字段配置的独立性

每个 fieldType 对应独立的字段数组，互不影响：

```typescript
const enterpriseFields: Field[] = [...]
const certificateFields: Field[] = [...]
const enterpriseBasicFields: Field[] = [...]        // 新增
const enterpriseSupervisionFields: Field[] = [...]  // 更新
```

### 3. 初始化逻辑的扩展性

通过 switch-case 或 if-else 结构，轻松添加新的字段类型：

```typescript
if (fieldType === "certificate") {
  fields.value = [...certificateFields];
} else if (fieldType === "enterprise_supervision") {
  fields.value = [...enterpriseSupervisionFields];
} else if (fieldType === "enterprise_basic") {
  fields.value = [...enterpriseBasicFields];
} else {
  fields.value = [...enterpriseFields];
}
```

---

## 🎉 修复完成

Bug 已完全修复，两个页面现在正确显示各自的字段配置，功能差异化明显，用户体验良好。

### 修复文件清单

1. ✅ frontend/src/components/DisplayFields.vue
2. ✅ frontend/src/views/EnterpriseInfo.vue

### 相关文档

- 企业信息字段隐藏修改总结.md
- DisplayFields 组件字段显示 Bug 修复说明.md（本文档）
