# 车辆名称查询显示问题修复

## 问题描述

当用户在查询条件中只输入车辆名称（如"三轮"）进行查询时，系统返回的结果中不包含车辆名称信息，反而显示企业名称。这不符合用户的预期，理想情况下应该：

- 当只查询车辆名称时，优先显示车辆名称
- 如果没有选择特定企业，不应该以企业名称为主要显示内容

## 问题分析

### 根本原因

1. **后端数据模型缺失**：`CertificateQuantityItem` 模型中没有 `vehicleName` 字段
2. **查询逻辑不完整**：后端查询的 SELECT 和 GROUP BY 语句中没有包含 `Certificate.CLMC`（车辆名称）字段
3. **前端显示逻辑不当**：表格组件始终优先显示企业名称，没有根据查询条件调整显示优先级

### 技术细节

- 数据库字段：`Certificate.CLMC` 对应车辆名称
- 查询参数：`vehicleNames` 数组传递给后端
- 显示逻辑：需要根据是否选择企业来决定主要显示列

## 修复方案

### 1. 后端修复

#### 1.1 更新数据模型

在 `backend/app/schemas/certificate.py` 中的 `CertificateQuantityItem` 添加 `vehicleName` 字段：

```python
class CertificateQuantityItem(BaseModel):
    # ... 其他字段
    vehicleName: Optional[str] = Field(default=None, description="车辆名称")
    # ... 其他字段
```

#### 1.2 更新查询逻辑

在 `backend/app/routers/certificate_quantity.py` 中：

1. **SELECT 语句添加车辆名称字段**：

```python
query = select(
    # ... 其他字段
    Certificate.CLMC.label('vehicleName'),
    # ... 其他字段
)
```

2. **GROUP BY 语句添加车辆名称字段**：

```python
.group_by(
    # ... 其他字段
    Certificate.CLMC,
    # ... 其他字段
)
```

3. **结果转换添加车辆名称**：

```python
item = CertificateQuantityItem(
    # ... 其他字段
    vehicleName=row.vehicleName,
    # ... 其他字段
)
```

### 2. 前端修复

#### 2.1 表格列显示逻辑优化

在 `frontend/src/components/CertificateResultTable.vue` 中：

1. **检测查询条件**：

```typescript
const hasVehicleNameCondition = conditions.some(
  (c) => c.vehicleNames && c.vehicleNames.length > 0
);
const hasSelectedCompanies = conditions.some(
  (c) =>
    (c.selectedCompanies && c.selectedCompanies.length > 0) ||
    c.companyName ||
    c.companyCode
);
```

2. **动态调整主要显示列**：

```typescript
if (hasVehicleNameCondition && !hasSelectedCompanies) {
  // 优先显示车辆名称
  primaryColumn = "vehicleName";
} else {
  // 默认显示企业名称
  primaryColumn = "companyName";
}
```

#### 2.2 列顺序调整

- **只查询车辆名称**：车辆名称 → 企业名称 → 合格证数量
- **车辆名称 + 企业**：企业名称 → 车辆名称 → 合格证数量
- **默认情况**：企业名称 → 合格证数量

## 测试验证

### 测试工具

创建了 `frontend/src/utils/vehicle-name-query-test.ts` 测试工具，包含：

1. **查询参数构建测试**：验证不同场景下的参数构建逻辑
2. **返回数据验证**：检查后端返回数据是否包含车辆名称字段
3. **表格列显示测试**：验证前端表格列的显示逻辑

### 测试场景

1. **场景 1**：只输入车辆名称（如"三轮"）

   - 预期：优先显示车辆名称列
   - 验证：返回数据包含 `vehicleName` 字段

2. **场景 2**：车辆名称 + 选择企业

   - 预期：优先显示企业名称，车辆名称作为辅助列
   - 验证：两个字段都正确显示

3. **场景 3**：车辆名称 + 企业名称（旧方式）
   - 预期：与场景 2 相同
   - 验证：兼容性正常

## 使用说明

### 开发环境调试

在开发环境下，系统会自动运行测试并在控制台输出详细信息：

```javascript
// 查询参数测试
🚗 开始测试车辆名称查询逻辑...
📋 场景1 - 只查询车辆名称:
  查询参数: { vehicleNames: ['三轮'] }
  预期主要列: vehicleName
  预期显示列: ['vehicleName', 'companyName', 'certificateCount']

// 返回数据验证
🔍 验证后端返回数据中的车辆名称字段...
📊 数据字段检查:
  包含 vehicleName: ✅
  包含 companyName: ✅
```

### 用户操作流程

1. **只查询车辆名称**：

   - 在查询条件中输入车辆名称（如"三轮"）
   - 不选择任何企业
   - 点击查询
   - 结果表格优先显示车辆名称列

2. **车辆名称 + 企业查询**：
   - 输入车辆名称并选择企业
   - 点击查询
   - 结果表格优先显示企业名称，车辆名称作为辅助列

## 注意事项

1. **数据库字段映射**：确保 `Certificate.CLMC` 字段在数据库中存在且有数据
2. **性能影响**：添加车辆名称字段到 GROUP BY 可能影响查询性能，需要监控
3. **兼容性**：修改保持了向后兼容性，不影响现有功能
4. **数据质量**：如果车辆名称字段为空，会显示空值，需要数据质量保证

## 相关文件

### 后端文件

- `backend/app/schemas/certificate.py` - 数据模型定义
- `backend/app/routers/certificate_quantity.py` - 查询逻辑
- `backend/app/models/certificate.py` - 数据库模型

### 前端文件

- `frontend/src/components/CertificateResultTable.vue` - 结果表格组件
- `frontend/src/views/CertificateQuantity.vue` - 主页面
- `frontend/src/utils/vehicle-name-query-test.ts` - 测试工具

## 修复验证

### 后端修复验证

1. **变量名错误修复**：

   - 修复了 `ificates_query` 变量名错误
   - 添加了完整的 `total_certificates_query` 查询逻辑
   - 改进了错误处理，避免 500 错误

2. **查询逻辑完善**：
   - 添加了 `Certificate.CLMC` 字段到 SELECT 和 GROUP BY 语句
   - 更新了 `CertificateQuantityItem` 模型，添加 `vehicleName` 字段
   - 改进了统计查询的健壮性

### 前端修复验证

1. **表格显示逻辑**：

   - 根据查询条件动态调整主要显示列
   - 只查询车辆名称时优先显示车辆名称
   - 车辆名称+企业查询时优先显示企业名称

2. **数据验证**：
   - 添加了实时数据验证工具
   - 检查 API 响应结构完整性
   - 验证车辆名称字段覆盖率

### 测试工具

创建了多个测试和验证工具：

1. `backend/test_stats_fix.py` - 后端修复验证
2. `frontend/src/utils/vehicle-name-query-test.ts` - 查询逻辑测试
3. `frontend/src/utils/vehicle-name-fix-validation.ts` - 完整修复验证

## 版本信息

- 修复日期：2025-01-08
- 影响版本：当前开发版本
- 测试状态：已添加自动化测试和验证工具
- 修复状态：✅ 后端错误已修复，✅ 前端显示逻辑已优化
