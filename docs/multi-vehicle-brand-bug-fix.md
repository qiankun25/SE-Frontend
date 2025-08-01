# 多车辆品牌查询 Bug 修复说明

## 问题描述

在合格证总量查询中，当用户选择多个车辆品牌时，系统只会查找第一个品牌的相关信息，而不是所有选中品牌的信息。这个问题与之前的多企业查询 bug 类似。

## 问题根本原因

### 1. 前端参数构建问题

**原始问题**：在 `buildSearchParams` 函数中，每次循环都会覆盖车辆品牌参数，导致只有最后一个条件的品牌信息被保留。

```typescript
// 问题代码
conditions.forEach((condition) => {
  if (condition.vehicleBrands && condition.vehicleBrands.length > 0) {
    params.vehicleBrands = condition.vehicleBrands; // 每次循环都会覆盖
    params.vehicleBrand = condition.vehicleBrands[0];
  }
});
```

### 2. 后端参数优先级问题

**关键问题**：后端使用 `elif` 逻辑处理车辆品牌参数，但前端同时设置了 `vehicleBrand` 和 `vehicleBrands`，导致后端优先处理单品牌参数而忽略多品牌参数。

```python
# 问题代码
if params.vehicleBrand:  # 单品牌参数
    filters.append(Certificate.CLPP.ilike(f"%{params.vehicleBrand}%"))
elif params.vehicleBrands:  # 多品牌参数 - 永远不会执行到这里
    brand_conditions = [Certificate.CLPP.ilike(f"%{brand}%") for brand in params.vehicleBrands]
    filters.append(or_(*brand_conditions))
```

## 修复方案

### 1. 前端修复

#### 1.1 参数收集逻辑优化

```typescript
// 修复后：收集所有车辆品牌信息到数组中
const allVehicleBrands: string[] = [];
const allVehicleModels: string[] = [];
const allFuelTypes: string[] = [];
// ... 其他参数数组

conditions.forEach((condition) => {
  // 车辆信息 - 合并多个条件的值
  if (condition.vehicleBrands && condition.vehicleBrands.length > 0) {
    allVehicleBrands.push(...condition.vehicleBrands); // 合并而不是覆盖
  }
  if (condition.vehicleModels && condition.vehicleModels.length > 0) {
    allVehicleModels.push(...condition.vehicleModels);
  }
  // ... 其他参数处理
});
```

#### 1.2 参数设置逻辑优化

```typescript
// 修复后：根据品牌数量决定使用哪个参数
if (allVehicleBrands.length > 0) {
  const uniqueBrands = [...new Set(allVehicleBrands)];
  if (uniqueBrands.length > 1) {
    // 多品牌查询：使用vehicleBrands
    params.vehicleBrands = uniqueBrands;
    console.log("🚗 多车辆品牌查询:", uniqueBrands);
  } else {
    // 单品牌查询：使用vehicleBrand（兼容性）
    params.vehicleBrand = uniqueBrands[0];
    console.log("🚗 单车辆品牌查询:", uniqueBrands[0]);
  }
}
```

### 2. 后端修复

#### 2.1 参数优先级调整

```python
# 修复后：优先处理多品牌参数
if params.vehicleBrands:
    # 多车辆品牌查询（OR逻辑）
    brand_conditions = [Certificate.CLPP.ilike(f"%{brand}%") for brand in params.vehicleBrands]
    filters.append(or_(*brand_conditions))
elif params.vehicleBrand:
    # 单车辆品牌查询（兼容性）
    filters.append(Certificate.CLPP.ilike(f"%{params.vehicleBrand}%"))

# 同样修复车辆型号、燃料类型、新能源类型、生产地址等参数
if params.vehicleModels:
    model_conditions = [Certificate.CLXH.ilike(f"%{model}%") for model in params.vehicleModels]
    filters.append(or_(*model_conditions))
elif params.vehicleModel:
    filters.append(Certificate.CLXH.ilike(f"%{params.vehicleModel}%"))
```

## 修复效果

### 修复前

- 用户选择：比亚迪、特斯拉、奔驰
- 实际查询：只查询比亚迪（第一个品牌）
- SQL 条件：`CLPP LIKE '%比亚迪%'`

### 修复后

- 用户选择：比亚迪、特斯拉、奔驰
- 实际查询：查询所有选中品牌
- SQL 条件：`(CLPP LIKE '%比亚迪%' OR CLPP LIKE '%特斯拉%' OR CLPP LIKE '%奔驰%')`

## 涉及的参数类型

修复涵盖了以下所有多值参数：

1. **车辆信息**

   - `vehicleBrands` / `vehicleBrand` - 车辆品牌
   - `vehicleModels` / `vehicleModel` - 车辆型号
   - `vehicleNames` - 车辆名称
   - `vehicleClass` - 车辆类别

2. **分类信息**

   - `sixCategories` - 六大类

3. **燃料和新能源**

   - `fuelTypes` / `fuelType` - 燃料类型
   - `newEnergyCategories` / `newEnergyType` - 新能源类型

4. **地址信息**
   - `productionAddresses` / `productionAddress` - 生产地址
   - `productionProvinces` - 生产省份
   - `productionCities` - 生产城市

## 测试验证

创建了 `multi-vehicle-brand-test.ts` 测试文件，验证：

1. **多条件多品牌合并**：不同查询条件中的品牌能正确合并
2. **单条件多品牌**：单个条件中的多个品牌能正确处理
3. **参数去重**：重复的品牌名称能正确去重
4. **SQL 生成**：生成正确的 OR 逻辑 SQL 条件
5. **其他参数**：车辆型号、燃料类型等参数的多值处理

## 关键改进点

1. **全面修复**：不仅修复了车辆品牌，还修复了所有多值参数
2. **参数收集**：从覆盖模式改为累积模式
3. **优先级调整**：后端优先处理多值参数
4. **兼容性保持**：保持对单值查询的兼容
5. **去重处理**：避免重复值导致的冗余查询
6. **调试增强**：添加详细的调试日志

## 使用示例

```typescript
// 用户操作
1. 在条件1中选择车辆品牌：["比亚迪", "特斯拉"]
2. 在条件2中选择车辆品牌：["奔驰", "宝马"]
3. 在条件3中选择车辆品牌：["红旗"]

// 前端参数（合并后）
{
  vehicleBrands: ["比亚迪", "特斯拉", "奔驰", "宝马", "红旗"]
}

// 后端SQL
WHERE (
  CLPP LIKE '%比亚迪%' OR
  CLPP LIKE '%特斯拉%' OR
  CLPP LIKE '%奔驰%' OR
  CLPP LIKE '%宝马%' OR
  CLPP LIKE '%红旗%'
)
```

## 相关修复

这次修复同时解决了以下类似问题：

- 多车辆型号查询
- 多燃料类型查询
- 多新能源类型查询
- 多生产地址查询
- 多生产省份/城市查询
- 多六大类查询

修复完成后，用户选择多个车辆品牌（或其他多值参数）时，系统会正确查询所有选中值的合格证数据，使用 OR 逻辑连接查询条件！
