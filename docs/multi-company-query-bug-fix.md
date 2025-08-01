# 多企业查询 Bug 修复说明

## 问题描述

在合格证总量查询中，当用户选择多个企业时，系统只会查找第一个企业的相关信息，而不是所有选中企业的信息。

## 问题根本原因

### 1. 前端参数构建问题

**原始问题**：在 `buildSearchParams` 函数中，每次循环都会覆盖 `params` 对象的值，导致只有最后一个条件的企业信息被保留。

```typescript
// 问题代码
conditions.forEach((condition) => {
  if (condition.selectedCompanies && condition.selectedCompanies.length > 0) {
    params.companyNames = companyNames; // 每次循环都会覆盖
    params.companyName = companyNames[0];
  }
});
```

### 2. 后端参数优先级问题

**关键问题**：后端使用 `elif` 逻辑处理企业参数，但前端同时设置了 `companyName` 和 `companyNames`，导致后端优先处理单企业参数而忽略多企业参数。

```python
# 问题代码
if params.companyName:  # 单企业参数
    filters.append(Certificate.CLZZQYMC.ilike(f"%{params.companyName}%"))
elif params.companyNames:  # 多企业参数 - 永远不会执行到这里
    name_conditions = [Certificate.CLZZQYMC.ilike(f"%{name}%") for name in params.companyNames]
    filters.append(or_(*name_conditions))
```

## 修复方案

### 1. 前端修复

#### 1.1 参数收集逻辑优化

```typescript
// 修复后：收集所有企业信息到数组中
const allCompanyNames: string[] = [];
const allCompanyCodes: string[] = [];

conditions.forEach((condition) => {
  if (condition.selectedCompanies && condition.selectedCompanies.length > 0) {
    const companyNames = condition.selectedCompanies
      .map((c: any) => c.name)
      .filter((name: string) => name && name.trim());
    const companyCodes = condition.selectedCompanies
      .map((c: any) => c.code)
      .filter((code: string) => code && code.trim());

    allCompanyNames.push(...companyNames); // 合并而不是覆盖
    allCompanyCodes.push(...companyCodes);
  }
});
```

#### 1.2 参数设置逻辑优化

```typescript
// 修复后：根据企业数量决定使用哪个参数
if (allCompanyNames.length > 0) {
  const uniqueCompanyNames = [...new Set(allCompanyNames)];

  if (uniqueCompanyNames.length > 1) {
    // 多企业查询：使用companyNames
    params.companyNames = uniqueCompanyNames;
  } else {
    // 单企业查询：使用companyName（兼容性）
    params.companyName = uniqueCompanyNames[0];
  }
}
```

### 2. 后端修复

#### 2.1 参数优先级调整

```python
# 修复后：优先处理多企业参数
if params.companyNames:
    # 多企业名称查询（OR逻辑）
    name_conditions = [Certificate.CLZZQYMC.ilike(f"%{name}%") for name in params.companyNames]
    filters.append(or_(*name_conditions))
elif params.companyName:
    # 单企业名称查询（兼容性）
    filters.append(Certificate.CLZZQYMC.ilike(f"%{params.companyName}%"))

if params.companyCodes:
    # 多企业代码查询（OR逻辑）
    code_conditions = [Certificate.QYDM == code for code in params.companyCodes]
    filters.append(or_(*code_conditions))
elif params.companyCode:
    # 单企业代码查询（兼容性）
    filters.append(Certificate.QYDM == params.companyCode)
```

## 修复效果

### 修复前

- 用户选择：比亚迪、福田、特斯拉
- 实际查询：只查询比亚迪（第一个企业）
- SQL 条件：`CLZZQYMC LIKE '%比亚迪%'`

### 修复后

- 用户选择：比亚迪、福田、特斯拉
- 实际查询：查询所有选中企业
- SQL 条件：`(CLZZQYMC LIKE '%比亚迪%' OR CLZZQYMC LIKE '%福田%' OR CLZZQYMC LIKE '%特斯拉%')`

## 测试验证

创建了 `multi-company-query-test.ts` 测试文件，验证：

1. **多条件多企业合并**：不同查询条件中的企业能正确合并
2. **单条件多企业**：单个条件中的多个企业能正确处理
3. **参数去重**：重复的企业名称和代码能正确去重
4. **SQL 生成**：生成正确的 OR 逻辑 SQL 条件

## 关键改进点

1. **参数收集**：从覆盖模式改为累积模式
2. **优先级调整**：后端优先处理多企业参数
3. **兼容性保持**：保持对单企业查询的兼容
4. **去重处理**：避免重复企业导致的冗余查询
5. **调试增强**：添加详细的调试日志

## 使用示例

```typescript
// 用户操作
1. 选择"比亚迪汽车有限公司"
2. 选择"北汽福田汽车股份有限公司"
3. 选择"特斯拉(上海)有限公司"

// 前端参数
{
  companyNames: ["比亚迪汽车有限公司", "北汽福田汽车股份有限公司", "特斯拉(上海)有限公司"]
}

// 后端SQL
WHERE (
  CLZZQYMC LIKE '%比亚迪汽车有限公司%' OR
  CLZZQYMC LIKE '%北汽福田汽车股份有限公司%' OR
  CLZZQYMC LIKE '%特斯拉(上海)有限公司%'
)
```

修复完成后，用户选择多个企业时，系统会正确查询所有选中企业的合格证数据，使用 OR 逻辑连接查询条件。
