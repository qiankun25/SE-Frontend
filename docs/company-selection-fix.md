# 企业选择功能修复说明

## 问题描述

在合格证总量查询界面，企业选择框存在以下问题：

1. **输入限制问题**：在企业选择框中输入了企业部分名（如"福田"），当再次输入另一家企业的部分名时（如"比亚迪"），显示"该企业已选择"，阻止用户继续输入。

2. **多企业查询逻辑不明确**：用户不清楚选择多家企业后的查询逻辑是什么。

## 修复内容

### 1. 前端修复

#### 1.1 企业选择检查逻辑优化

**修复前**：

```typescript
const isCompanySelected = (company: CompanyInfo): boolean => {
  return form.selectedCompanies.some(
    (selected) =>
      selected.code === company.code ||
      (selected.name === company.name && company.name.trim() !== "")
  );
};
```

**修复后**：

```typescript
const isCompanySelected = (company: CompanyInfo): boolean => {
  return form.selectedCompanies.some((selected) => {
    // 如果有企业代码，优先按代码匹配
    if (company.code && selected.code && company.code.trim() !== "") {
      return selected.code === company.code;
    }
    // 否则按企业名称精确匹配
    if (company.name && selected.name && company.name.trim() !== "") {
      return selected.name === company.name;
    }
    return false;
  });
};
```

#### 1.2 企业输入处理逻辑修复

**修复前**：过滤掉已选择的企业，导致用户无法重新输入

```typescript
companySuggestions.value = companyDatabase.value
  .filter(
    (company) =>
      company.name.toLowerCase().includes(value.toLowerCase()) &&
      !isCompanySelected(company) // 这里过滤掉已选择的企业
  )
  .slice(0, 8);
```

**修复后**：允许显示所有匹配的企业，不过滤已选择的

```typescript
companySuggestions.value = companyDatabase.value
  .filter((company) => company.name.toLowerCase().includes(value.toLowerCase()))
  .slice(0, 8); // 不再过滤已选择的企业
```

#### 1.3 企业添加逻辑优化

**修复前**：阻止重复添加

```typescript
if (!isCompanySelected(company)) {
  form.selectedCompanies.push({ ...company });
  ElMessage.success(`已添加企业：${company.name}`);
} else {
  ElMessage.warning("该企业已经被选择"); // 阻止添加
}
```

**修复后**：允许重复添加，但给出提示

```typescript
if (!isCompanySelected(company)) {
  form.selectedCompanies.push({ ...company });
  ElMessage.success(`已添加企业：${company.name}`);
} else {
  // 允许重复添加，但给出提示
  form.selectedCompanies.push({ ...company });
  ElMessage.info(`企业 ${company.name} 已重复添加，查询时将使用OR逻辑`);
}
```

### 2. 后端查询逻辑确认

后端已正确实现多企业 OR 逻辑查询：

```python
# 企业名称的OR逻辑
elif params.companyNames:
    name_conditions = [Certificate.CLZZQYMC.ilike(f"%{name}%") for name in params.companyNames]
    filters.append(or_(*name_conditions))

# 企业代码的OR逻辑
elif params.companyCodes:
    code_conditions = [Certificate.QYDM == code for code in params.companyCodes]
    filters.append(or_(*code_conditions))
```

### 3. 查询逻辑说明

当用户选择多个企业时，查询条件使用 **OR 逻辑**：

- **企业名称**：`(企业名称 LIKE '%福田%' OR 企业名称 LIKE '%比亚迪%')`
- **企业代码**：`(企业代码 = 'FOTON001' OR 企业代码 = 'BYD001')`

这意味着查询结果将包含所有选中企业的合格证数据。

## 用户体验改进

1. **输入自由度**：用户可以自由输入企业名称，不会被"已选择"提示阻止
2. **重复添加提示**：允许重复添加企业，但会给出友好提示
3. **查询逻辑透明**：明确告知用户多企业查询使用 OR 逻辑
4. **建议列表优化**：显示所有匹配的企业，不隐藏已选择的

## 测试验证

创建了 `company-selection-fix-test.ts` 测试文件，验证：

1. 正常添加企业功能
2. 添加多个不同企业
3. 重复添加同一企业的处理
4. 部分匹配企业的处理
5. 查询参数构建的正确性

## 使用示例

1. 用户输入"福田" → 显示福田相关企业建议
2. 用户选择"北汽福田汽车股份有限公司"
3. 用户再次输入"比亚迪" → 正常显示比亚迪相关企业建议（不会提示已选择）
4. 用户选择"比亚迪汽车有限公司"
5. 查询时使用 OR 逻辑：查找福田或比亚迪的所有合格证数据

这样修复后，用户可以自由选择多个企业进行查询，体验更加流畅。
