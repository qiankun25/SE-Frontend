# API接口技术规范详细文档

## 📋 概述

本文档详细定义了汽车企业查询系统前端项目中所有API接口的技术规范，包括请求参数、响应格式、错误处理等，为后端开发提供精确的实现指导。

## 🔧 通用规范

### 1. 基础配置
```typescript
const BASE_URL = "http://localhost:8000/api"
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
}
```

### 2. 统一响应格式
```typescript
interface ApiResponse<T = any> {
  code: number        // 状态码: 200成功, 400客户端错误, 500服务器错误
  message: string     // 响应消息
  data: T | null     // 响应数据
  total?: number     // 总记录数(分页查询时)
  timestamp?: string // 响应时间戳
}
```

### 3. 分页参数规范
```typescript
interface PaginationParams {
  page: number       // 页码，从1开始
  pageSize: number   // 每页记录数，默认20
  field?: string     // 排序字段
  order?: "asc" | "desc"  // 排序方向
}
```

### 4. 导出参数规范
```typescript
interface ExportParams {
  format?: "xlsx" | "csv"  // 导出格式，默认xlsx
  fields?: string[]        // 导出字段列表
  filename?: string        // 文件名
}
```

## 🔐 认证模块接口规范

### 1. 用户登录
```typescript
// POST /api/auth/login
interface LoginRequest {
  username: string    // 用户名，必填，3-50字符
  password: string    // 密码，必填，6-100字符
}

interface LoginResponse {
  token: string       // JWT令牌，有效期24小时
  user: {
    id: string        // 用户ID
    username: string  // 用户名
    name: string      // 真实姓名
    permissions: string[]  // 权限列表
  }
}

// 示例
Request: {
  "username": "admin",
  "password": "123456"
}

Response: {
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "username": "admin",
      "name": "管理员",
      "permissions": ["certificate:query", "enterprise:query"]
    }
  }
}
```

### 2. 用户登出
```typescript
// POST /api/auth/logout
// 请求头需要包含Authorization: Bearer {token}

Response: {
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

### 3. 获取用户权限
```typescript
// GET /api/auth/permissions

Response: {
  "code": 200,
  "message": "获取成功",
  "data": ["certificate:query", "certificate:export", "enterprise:query"]
}
```

## 📋 合格证查询模块接口规范

### 1. 合格证总量查询 (已实现)
```typescript
// POST /api/certificate-quantity/search
interface CertificateQuantityParams extends PaginationParams {
  // 企业筛选
  companyName?: string      // 企业名称模糊查询
  companyNames?: string[]   // 企业名称列表精确查询
  
  // 车型筛选
  vehicleBrand?: string     // 车辆品牌
  vehicleBrands?: string[]  // 车辆品牌列表
  vehicleModel?: string     // 车型型号
  vehicleModels?: string[]  // 车型型号列表
  
  // 分类筛选
  vehicleCategory?: string     // 车辆类别
  vehicleCategories?: string[] // 车辆类别列表
  fuelType?: string           // 燃料种类
  fuelTypes?: string[]        // 燃料种类列表
  newEnergyType?: string      // 新能源类型
  newEnergyTypes?: string[]   // 新能源类型列表
  
  // 时间筛选
  timeRange?: {
    startDate: string    // 开始日期 YYYY-MM-DD
    endDate: string      // 结束日期 YYYY-MM-DD
    timeType: "upload" | "production" | "issue"  // 时间类型
  }
  
  // 地区筛选
  region?: string          // 地区代码
  regions?: string[]       // 地区代码列表
}

interface CertificateQuantityItem {
  companyName: string      // 企业名称
  companyId?: string       // 企业ID
  vehicleBrand?: string    // 车辆品牌
  vehicleModel?: string    // 车型型号
  certificateCount: number // 合格证数量
  percentage?: number      // 占比
  rank?: number           // 排名
}

Response: {
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": CertificateQuantityItem[],
    "total": 1000
  },
  "total": 1000
}
```

### 2. 合格证单证查询
```typescript
// POST /api/certificate-detail/search
interface CertificateDetailParams extends PaginationParams {
  // 精确查询条件
  certificateNumber?: string  // 合格证编号
  vin?: string               // 车架号VIN
  engineNumber?: string      // 发动机号
  
  // 模糊查询条件
  companyName?: string       // 企业名称
  vehicleModel?: string      // 车型型号
  
  // 时间范围
  timeRange?: {
    startDate: string
    endDate: string
    timeType: "upload" | "production" | "issue"
  }
}

interface CertificateDetailItem {
  certificateNumber: string    // 合格证编号
  vin: string                 // 车架号
  engineNumber: string        // 发动机号
  companyName: string         // 企业名称
  vehicleBrand: string        // 车辆品牌
  vehicleModel: string        // 车型型号
  vehicleCategory: string     // 车辆类别
  fuelType: string           // 燃料种类
  newEnergyType?: string     // 新能源类型
  productionDate: string     // 生产日期
  issueDate: string          // 开具日期
  uploadDate: string         // 上传日期
  status: string             // 状态
}

Response: {
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": CertificateDetailItem[],
    "total": 500
  },
  "total": 500
}
```

### 3. 批量查询合格证
```typescript
// POST /api/certificate-detail/batch-search
interface BatchSearchRequest {
  queries: string[]    // 查询条件列表(合格证编号或VIN码)
}

Response: {
  "code": 200,
  "message": "批量查询完成",
  "data": {
    "list": CertificateDetailItem[],
    "total": 100,
    "validCount": 95,      // 有效查询数量
    "invalidCount": 5      // 无效查询数量
  }
}
```

## 🏢 企业信息查询模块接口规范

### 1. 集团基本信息查询
```typescript
// POST /api/group/search
interface GroupSearchParams extends PaginationParams {
  groupName?: string      // 集团名称
  groupCode?: string      // 集团代码
  region?: string         // 所在地区
  establishDateRange?: {  // 成立时间范围
    startDate: string
    endDate: string
  }
}

interface GroupInfo {
  id: string              // 集团ID
  groupName: string       // 集团名称
  groupCode: string       // 集团代码
  region: string          // 所在地区
  regionName: string      // 地区名称
  establishDate: string   // 成立日期
  subsidiaryCount: number // 下属企业数量
  status: "正常" | "注销" | "吊销"  // 状态
  description?: string    // 描述信息
}

Response: {
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": GroupInfo[],
    "total": 200
  }
}
```

### 2. 企业基本信息查询
```typescript
// POST /api/enterprise/search
interface EnterpriseSearchParams extends PaginationParams {
  enterpriseName?: string     // 企业名称
  enterpriseCode?: string     // 企业代码
  enterpriseType?: string     // 企业类型
  region?: string            // 所在地区
  productionStatus?: string  // 生产状态
  groupId?: string          // 所属集团ID
}

interface EnterpriseInfo {
  id: string                 // 企业ID
  enterpriseName: string     // 企业名称
  enterpriseCode: string     // 企业代码
  enterpriseType: string     // 企业类型
  region: string            // 所在地区
  regionName: string        // 地区名称
  address: string           // 详细地址
  productionStatus: string  // 生产状态
  groupId?: string          // 所属集团ID
  groupName?: string        // 集团名称
  establishDate: string     // 成立日期
  registeredCapital: string // 注册资本
  legalPerson: string       // 法定代表人
  contactPhone?: string     // 联系电话
  status: string           // 企业状态
}

Response: {
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": EnterpriseInfo[],
    "total": 1500
  }
}
```

### 3. 企业监管状态查询
```typescript
// POST /api/supervision/search
interface SupervisionSearchParams extends PaginationParams {
  enterpriseName?: string    // 企业名称
  enterpriseCode?: string    // 企业代码
  supervisionStatus?: string // 监管状态
  inspectionType?: string    // 检查类型
  inspectionDateRange?: {    // 检查时间范围
    startDate: string
    endDate: string
  }
}

interface SupervisionInfo {
  id: string                 // 记录ID
  enterpriseId: string       // 企业ID
  enterpriseName: string     // 企业名称
  enterpriseCode: string     // 企业代码
  supervisionStatus: string  // 监管状态
  lastInspectionDate: string // 最后检查日期
  inspectionType: string     // 检查类型
  inspectionResult: string   // 检查结果
  issueCount: number        // 发现问题数量
  rectificationStatus: string // 整改状态
  inspector: string         // 检查人员
  remarks?: string          // 备注信息
}

Response: {
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": SupervisionInfo[],
    "total": 800
  }
}
```

## 📊 可视化图表模块接口规范

### 1. 大屏统计数据
```typescript
// GET /api/dashboard/stats
interface DashboardStats {
  enterpriseCount: string    // 企业总数
  certificateCount: string  // 合格证总数
  vehicleModelCount: string // 车型总数
  todayCount: string        // 今日新增
}

Response: {
  "code": 200,
  "message": "获取成功",
  "data": {
    "enterpriseCount": "1,234",
    "certificateCount": "567,890",
    "vehicleModelCount": "2,345",
    "todayCount": "123"
  }
}
```

### 2. 图表数据接口
```typescript
// GET /api/dashboard/charts/enterprise
interface ChartData {
  categories: string[]       // X轴分类
  series: {
    name: string            // 系列名称
    data: number[]          // 数据值
    type?: string          // 图表类型
  }[]
}

Response: {
  "code": 200,
  "message": "获取成功",
  "data": {
    "categories": ["北京", "上海", "广东", "江苏"],
    "series": [{
      "name": "企业数量",
      "data": [120, 98, 156, 89],
      "type": "bar"
    }]
  }
}
```

## 🔧 通用功能模块接口规范

### 1. 地区数据
```typescript
// GET /api/common/regions
interface RegionData {
  code: string              // 地区代码
  name: string              // 地区名称
  children?: RegionData[]   // 下级地区
}

Response: {
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "code": "110000",
      "name": "北京市",
      "children": [
        {
          "code": "110100",
          "name": "北京市市辖区"
        }
      ]
    }
  ]
}
```

### 2. 操作日志记录
```typescript
// POST /api/common/log
interface LogRequest {
  action: string           // 操作类型
  module: string          // 模块名称
  description: string     // 操作描述
  params?: any           // 操作参数
}

Response: {
  "code": 200,
  "message": "日志记录成功",
  "data": null
}
```

## ⚠️ 错误处理规范

### 1. 错误响应格式
```typescript
interface ErrorResponse {
  code: number           // 错误码
  message: string        // 错误信息
  data: null            // 错误时data为null
  errors?: {            // 详细错误信息(可选)
    field: string       // 错误字段
    message: string     // 字段错误信息
  }[]
}
```

### 2. 常见错误码
- `400`: 请求参数错误
- `401`: 未授权，需要登录
- `403`: 权限不足
- `404`: 资源不存在
- `422`: 数据验证失败
- `500`: 服务器内部错误

### 3. 错误示例
```typescript
// 参数验证失败
{
  "code": 422,
  "message": "数据验证失败",
  "data": null,
  "errors": [
    {
      "field": "username",
      "message": "用户名不能为空"
    }
  ]
}

// 权限不足
{
  "code": 403,
  "message": "权限不足，无法访问该资源",
  "data": null
}
```


