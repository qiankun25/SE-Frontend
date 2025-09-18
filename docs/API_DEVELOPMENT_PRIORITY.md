# API接口开发优先级详细清单

## 🚀 Phase 1: 核心功能接口 (高优先级 - 1-2周)

### 1.1 用户认证模块 (必须优先)

| 序号 | 接口路径 | 方法 | 功能描述 | 前端调用位置 | 预计工时 |
|-----|---------|------|---------|-------------|----------|
| 1 | `/api/auth/login` | POST | 用户登录验证 | `Login.vue` | 0.5天 |
| 2 | `/api/auth/logout` | POST | 用户登出 | `Layout.vue` | 0.2天 |
| 3 | `/api/auth/permissions` | GET | 获取用户权限 | 路由守卫 | 0.3天 |

**接口详情**:
```typescript
// POST /api/auth/login
Request: {
  username: string
  password: string
}
Response: {
  code: 200,
  message: "登录成功",
  data: {
    token: string
    user: {
      id: string
      username: string
      name: string
      permissions: string[]
    }
  }
}
```

### 1.2 合格证单证查询模块 (核心业务)

| 序号 | 接口路径 | 方法 | 功能描述 | 前端调用位置 | 预计工时 |
|-----|---------|------|---------|-------------|----------|
| 4 | `/api/certificate-detail/search` | POST | 合格证详细信息查询 | `CertificateDetail.vue` | 1天 |
| 5 | `/api/certificate-detail/batch-search` | POST | 批量查询合格证 | `CertificateDetail.vue` | 1天 |
| 6 | `/api/certificate-detail/export` | POST | 导出合格证详细信息 | `CertificateDetail.vue` | 0.5天 |
| 7 | `/api/certificate-detail/template` | GET | 下载批量查询模板 | `CertificateDetail.vue` | 0.2天 |

### 1.3 基础数据接口

| 序号 | 接口路径 | 方法 | 功能描述 | 前端调用位置 | 预计工时 |
|-----|---------|------|---------|-------------|----------|
| 8 | `/api/common/regions` | GET | 获取地区数据 | `RegionSelector.vue` | 0.3天 |

**Phase 1 总计**: 4天

---

## 🏗️ Phase 2: 企业信息查询模块 (中优先级 - 2-3周)

### 2.1 集团基本信息

| 序号 | 接口路径 | 方法 | 功能描述 | 前端调用位置 | 预计工时 |
|-----|---------|------|---------|-------------|----------|
| 9 | `/api/group/search` | POST | 集团信息查询 | `GroupInfo.vue` | 1天 |
| 10 | `/api/group/detail/{id}` | GET | 集团详细信息 | `GroupInfo.vue` | 0.5天 |
| 11 | `/api/group/export` | POST | 导出集团信息 | `GroupInfo.vue` | 0.3天 |

**新增数据结构**:
```typescript
GroupSearchParams {
  page: number
  pageSize: number
  groupName?: string
  groupCode?: string
  region?: string
}

GroupInfo {
  groupName: string
  groupCode: string
  region: string
  establishDate: string
  subsidiaryCount: number
  status: string
}
```

### 2.2 企业基本信息

| 序号 | 接口路径 | 方法 | 功能描述 | 前端调用位置 | 预计工时 |
|-----|---------|------|---------|-------------|----------|
| 12 | `/api/enterprise/search` | POST | 企业信息查询 | `EnterpriseInfo.vue` | 1天 |
| 13 | `/api/enterprise/detail/{id}` | GET | 企业详细信息 | `EnterpriseInfo.vue` | 0.5天 |
| 14 | `/api/enterprise/export` | POST | 导出企业信息 | `EnterpriseInfo.vue` | 0.3天 |

### 2.3 企业监管状态

| 序号 | 接口路径 | 方法 | 功能描述 | 前端调用位置 | 预计工时 |
|-----|---------|------|---------|-------------|----------|
| 15 | `/api/supervision/search` | POST | 监管状态查询 | `EnterpriseSupervision.vue` | 1天 |
| 16 | `/api/supervision/inspection/{id}` | GET | 检查记录详情 | `EnterpriseSupervision.vue` | 0.5天 |
| 17 | `/api/supervision/export` | POST | 导出监管信息 | `EnterpriseSupervision.vue` | 0.3天 |

**Phase 2 总计**: 5.4天

---

## 📊 Phase 3: 可视化和管理模块 (中低优先级 - 3-4周)

### 3.1 大屏可视化

| 序号 | 接口路径 | 方法 | 功能描述 | 前端调用位置 | 预计工时 |
|-----|---------|------|---------|-------------|----------|
| 18 | `/api/dashboard/stats` | GET | 大屏统计数据 | `Dashboard.vue` | 0.5天 |
| 19 | `/api/dashboard/charts/enterprise` | GET | 企业分布图表数据 | `Dashboard.vue` | 0.5天 |
| 20 | `/api/dashboard/charts/trend` | GET | 趋势分析图表数据 | `Dashboard.vue` | 0.5天 |
| 21 | `/api/dashboard/realtime` | GET | 实时数据监控 | `Dashboard.vue` | 0.5天 |

### 3.2 用户管理

| 序号 | 接口路径 | 方法 | 功能描述 | 前端调用位置 | 预计工时 |
|-----|---------|------|---------|-------------|----------|
| 22 | `/api/users/search` | POST | 用户列表查询 | `UserManagement.vue` | 0.5天 |
| 23 | `/api/users/create` | POST | 创建用户 | `UserManagement.vue` | 0.5天 |
| 24 | `/api/users/update/{id}` | PUT | 更新用户信息 | `UserManagement.vue` | 0.3天 |
| 25 | `/api/users/delete/{id}` | DELETE | 删除用户 | `UserManagement.vue` | 0.2天 |
| 26 | `/api/users/toggle-status/{id}` | PATCH | 切换用户状态 | `UserManagement.vue` | 0.2天 |
| 27 | `/api/users/reset-password/{id}` | POST | 重置用户密码 | `UserManagement.vue` | 0.3天 |

### 3.3 权限管理

| 序号 | 接口路径 | 方法 | 功能描述 | 前端调用位置 | 预计工时 |
|-----|---------|------|---------|-------------|----------|
| 28 | `/api/roles/list` | GET | 角色列表 | `PermissionManagement.vue` | 0.3天 |
| 29 | `/api/roles/create` | POST | 创建角色 | `PermissionManagement.vue` | 0.5天 |
| 30 | `/api/roles/update/{id}` | PUT | 更新角色 | `PermissionManagement.vue` | 0.3天 |
| 31 | `/api/roles/delete/{id}` | DELETE | 删除角色 | `PermissionManagement.vue` | 0.2天 |
| 32 | `/api/permissions/function-tree` | GET | 功能权限树 | `PermissionManagement.vue` | 0.5天 |
| 33 | `/api/permissions/data-tree` | GET | 数据权限树 | `PermissionManagement.vue` | 0.3天 |
| 34 | `/api/roles/{id}/permissions` | GET | 获取角色权限 | `PermissionManagement.vue` | 0.3天 |
| 35 | `/api/roles/{id}/permissions` | PUT | 保存角色权限 | `PermissionManagement.vue` | 0.5天 |

**Phase 3 总计**: 6.5天

---

## 🔧 Phase 4: 优化和完善 (低优先级 - 1周)

### 4.1 性能优化接口

| 序号 | 接口路径 | 方法 | 功能描述 | 优化目标 | 预计工时 |
|-----|---------|------|---------|---------|----------|
| 36 | `/api/common/cache/clear` | POST | 清除缓存 | 性能优化 | 0.2天 |
| 37 | `/api/common/health` | GET | 健康检查 | 监控 | 0.1天 |

### 4.2 日志和统计

| 序号 | 接口路径 | 方法 | 功能描述 | 前端调用位置 | 预计工时 |
|-----|---------|------|---------|-------------|----------|
| 38 | `/api/common/log` | POST | 记录操作日志 | 全局 | 0.3天 |
| 39 | `/api/user/logs/operations` | GET | 用户操作日志 | `OperationLog.vue` | 0.5天 |
| 40 | `/api/user/logs/downloads` | GET | 用户下载日志 | `OperationLog.vue` | 0.3天 |

**Phase 4 总计**: 1.4天

---

## 📋 开发总结

### 总体工时估算
- **Phase 1 (核心功能)**: 4天
- **Phase 2 (企业信息)**: 5.4天  
- **Phase 3 (可视化管理)**: 6.5天
- **Phase 4 (优化完善)**: 1.4天

**总计**: 17.3天 (约3.5周)

### 关键里程碑
1. **Week 1**: 完成用户认证和合格证单证查询
2. **Week 2-3**: 完成企业信息查询模块
3. **Week 4**: 完成可视化和管理功能
4. **Week 5**: 优化和测试

### 风险评估
- **高风险**: 合格证查询的复杂业务逻辑
- **中风险**: 权限管理的复杂权限树结构
- **低风险**: 基础CRUD操作

### 建议
1. 优先开发Phase 1，确保系统基本可用
2. Phase 2和3可以并行开发
3. 预留20%的缓冲时间处理意外问题
4. 每个Phase完成后进行集成测试
