# 汽车企业查询系统 - 前端

基于 Vue.js 3 + Element Plus + TypeScript 的汽车企业合格证查询系统前端项目。

## 🚀 快速开始

### 环境要求

- Node.js 14+
- npm 6+ 或 yarn 1.22+

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发服务器

```bash
npm run dev
```

服务启动后访问：http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 🛠️ 技术栈

- **Vue.js 3** - 渐进式JavaScript框架，使用Composition API
- **Element Plus** - 基于Vue 3的组件库
- **TypeScript** - JavaScript的超集，提供类型安全
- **Vite** - 下一代前端构建工具
- **Vue Router** - Vue.js官方路由管理器
- **Axios** - HTTP客户端库
- **XLSX** - Excel文件处理库

## 📁 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── components/        # 可复用组件
│   │   ├── EnterpriseList.vue    # 企业列表组件 🆕
│   │   ├── ExportButton.vue      # 导出按钮组件
│   │   └── ...
│   ├── views/             # 页面组件
│   │   ├── GroupInfo.vue         # 集团基本信息页面 🆕
│   │   ├── CertificateQuantity.vue # 合格证总量查询
│   │   ├── CertificateDetail.vue   # 合格证详细查询
│   │   └── ...
│   ├── services/          # API服务
│   │   ├── api.ts         # API接口定义
│   │   └── request.ts     # HTTP请求封装
│   ├── types/             # TypeScript类型定义
│   │   ├── api.ts         # API相关类型
│   │   └── common.ts      # 通用类型
│   ├── router/            # 路由配置
│   │   └── index.ts
│   ├── datas/             # 静态数据文件
│   ├── App.vue            # 根组件
│   └── main.ts            # 应用入口
├── package.json           # 项目配置
├── vite.config.ts         # Vite配置
└── tsconfig.json          # TypeScript配置
```

## 🧩 核心组件说明

### 集团基本信息相关组件 🆕

#### GroupInfo.vue - 集团基本信息页面
**功能特性：**
- 集团信息搜索和筛选
- 表格展开功能，支持集团→企业数据钻取
- 集团统计信息展示（企业数量、新能源占比、合资企业占比）
- 分页浏览和排序功能
- 数据导出功能

**核心交互：**
```vue
<template>
  <!-- 搜索表单 -->
  <el-form :model="searchForm" inline>
    <el-form-item label="集团名称">
      <el-input v-model="searchForm.group_name" placeholder="请输入集团名称" />
    </el-form-item>
    <!-- 更多筛选条件... -->
  </el-form>

  <!-- 数据表格 - 支持展开 -->
  <el-table :data="tableData" @expand-change="handleExpandChange">
    <el-table-column type="expand">
      <template #default="{ row }">
        <EnterpriseList :group-code="row.group_code" />
      </template>
    </el-table-column>
    <!-- 表格列定义... -->
  </el-table>
</template>
```

#### EnterpriseList.vue - 企业列表组件
**功能特性：**
- 独立的企业列表展示组件
- 支持分页浏览企业信息
- 企业详情弹窗功能
- 新能源和企业性质标签显示
- 响应式设计，适配不同屏幕尺寸

**组件接口：**
```vue
<script setup lang="ts">
interface Props {
  groupCode: string  // 集团代码，用于查询该集团下的企业
}

const props = defineProps<Props>()

// 核心功能方法
const loadEnterprises = async () => { /* 加载企业列表 */ }
const showDetail = async (enterprise: EnterpriseDetailInfo) => { /* 显示企业详情 */ }
const handlePageChange = (page: number) => { /* 分页处理 */ }
</script>
```

### 通用组件

#### ExportButton.vue - 导出按钮组件
- 统一的导出功能封装
- 权限检查和配额验证
- 导出进度显示
- 错误处理和用户提示

## 🌐 API服务说明

### groupApi - 集团相关API服务 🆕

```typescript
export const groupApi = {
  // 集团搜索
  async search(params: GroupSearchParams): Promise<ApiResponse<{
    list: GroupInfo[];
    total: number;
  }>> {
    return request('/group/search', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // 获取集团详细信息
  async getDetail(groupCode: string): Promise<ApiResponse<GroupDetailInfo>> {
    return request(`/group/detail/${groupCode}`);
  },

  // 获取集团下属企业列表
  async getEnterprises(
    groupCode: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<{
    list: EnterpriseItem[];
    total: number;
  }>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    return request(`/group/enterprises/${groupCode}?${params.toString()}`);
  },

  // 获取集团下属企业详细信息
  async getEnterpriseDetailed(
    groupCode: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<EnterpriseDetailInfo[]>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    return request(`/group/enterprises/${groupCode}/detailed?${params.toString()}`);
  },

  // 获取单个企业详细信息
  async getEnterpriseDetail(enterpriseId: string): Promise<ApiResponse<EnterpriseDetailInfo>> {
    return request(`/group/enterprise/${enterpriseId}`);
  },

  // 导出集团信息
  async export(params: GroupSearchParams): Promise<Blob> {
    return request('/group/export', {
      method: 'POST',
      body: JSON.stringify(params),
      responseType: 'blob'
    });
  }
};
```

## 🛣️ 路由配置

### 集团基本信息路由 🆕

```typescript
// src/router/index.ts
const routes = [
  {
    path: '/group-info',
    name: 'GroupInfo',
    component: () => import('../views/GroupInfo.vue'),
    meta: {
      title: '集团基本信息',
      requiresAuth: true,
      permissions: ['enterprise:read']
    }
  },
  // 其他路由...
];
```

**路由特性：**
- 需要登录认证 (`requiresAuth: true`)
- 需要企业查询权限 (`permissions: ['enterprise:read']`)
- 支持动态标题设置
- 懒加载组件，优化首屏加载性能

## 🎨 用户界面说明

### 集团基本信息页面交互功能 🆕

#### 1. 搜索和筛选功能
```
搜索表单包含：
├── 集团名称输入框 - 支持模糊查询
├── 集团代码输入框 - 精确匹配
├── 地区选择器 - 省份/城市筛选
├── 企业性质选择 - 自主/合资/全部
├── 新能源业务选择 - 有/无/全部
└── 查询/重置按钮
```

#### 2. 表格展开功能
```
集团列表表格：
├── 展开列 - 点击展开查看下属企业
├── 集团名称 - 显示完整集团名称
├── 集团代码 - 唯一标识码
├── 主要地区 - 集团主要经营地区
├── 下属企业数 - 支持排序
├── 分布省份 - 企业分布的省份列表
├── 新能源企业 - 新能源企业数量
├── 合资企业 - 合资企业数量
├── 新能源占比 - 百分比显示
├── 合资占比 - 百分比显示
└── 操作列 - 查看详情按钮
```

#### 3. 企业列表展开内容
```
展开后显示：
├── 企业列表标题 - "XX集团 - 下属企业列表"
├── 企业信息表格
│   ├── 企业名称 - 完整企业名称
│   ├── 企业代码 - 企业标识码
│   ├── 省份 - 企业所在省份
│   ├── 城市 - 企业所在城市
│   ├── 企业性质标签 - 自主(蓝色)/合资(绿色)
│   ├── 新能源标记 - 是(绿色)/否(灰色)
│   └── 操作 - 详情按钮
└── 分页控件 - 支持分页浏览
```

#### 4. 企业详情弹窗
```
详情弹窗内容：
├── 基本信息
│   ├── 企业ID
│   ├── 企业名称
│   ├── 企业代码
│   └── 所属集团
├── 地理信息
│   ├── 省份/城市/区县
│   ├── 注册地址
│   └── 生产地址
├── 业务信息
│   ├── 企业性质
│   ├── 新能源标记
│   └── 产品商标
└── 资质信息
    ├── 企业资质
    └── 新能源资质
```

## 📊 TypeScript类型定义

### 集团企业相关类型 🆕

```typescript
// src/types/api.ts

// 集团搜索参数
export interface GroupSearchParams {
  group_name: string;
  group_code: string;
  region: string;
  enterprise_type: string;
  has_new_energy: boolean | null;
  page: number;
  pageSize: number;
  field: string;
  order: 'asc' | 'desc';
}

// 集团基本信息
export interface GroupInfo {
  group_code: string;
  group_name: string;
  enterprise_count: number;
  main_region: string;
  provinces: string[];
  new_energy_count: number;
  joint_venture_count: number;
  new_energy_ratio: number;
  joint_venture_ratio: number;
}

// 企业详细信息
export interface EnterpriseDetailInfo {
  enterprise_id: string;
  enterprise_name: string;
  enterprise_code?: string;
  province?: string;
  city?: string;
  district?: string;
  registered_address?: string;
  production_address?: string;
  enterprise_type?: string;
  has_new_energy: boolean;
  product_brands?: string;
  enterprise_qualifications?: string;
  new_energy_qualifications?: string;
  group_code?: string;
  group_name?: string;
}

// API响应通用格式
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  total?: number;
}
```

## ⚙️ 配置说明

### Vite配置 (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')  // 路径别名配置
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // 后端API代理
        changeOrigin: true
      }
    }
  }
})
```

### TypeScript配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]  // 路径映射
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🔧 开发说明

### 添加新页面组件

1. **创建Vue组件**
```bash
# 在 src/views/ 目录下创建新组件
touch src/views/NewPage.vue
```

2. **添加路由配置**
```typescript
// src/router/index.ts
{
  path: '/new-page',
  name: 'NewPage',
  component: () => import('../views/NewPage.vue'),
  meta: {
    title: '新页面',
    requiresAuth: true
  }
}
```

3. **更新导航菜单**
```typescript
// 在相应的菜单配置中添加新页面链接
```

### 添加新API接口

1. **定义TypeScript类型**
```typescript
// src/types/api.ts
export interface NewApiParams {
  // 参数定义
}

export interface NewApiResponse {
  // 响应定义
}
```

2. **实现API方法**
```typescript
// src/services/api.ts
export const newApi = {
  async getData(params: NewApiParams): Promise<ApiResponse<NewApiResponse>> {
    return request('/new-endpoint', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
};
```

### 开发最佳实践

1. **组件设计原则**
   - 单一职责：每个组件只负责一个功能
   - 可复用性：通过props和events实现组件复用
   - 类型安全：使用TypeScript确保类型安全

2. **API调用规范**
   - 统一错误处理：使用try-catch包装API调用
   - 加载状态：显示loading状态提升用户体验
   - 错误提示：使用Element Plus的Message组件显示错误

3. **代码风格**
   - 使用Composition API编写Vue组件
   - 遵循ESLint和Prettier配置
   - 组件和方法使用有意义的命名

## 🚨 注意事项

1. **开发环境**
   - 确保后端服务运行在 http://localhost:8000
   - 前端开发服务器会自动代理API请求到后端

2. **类型安全**
   - 所有API接口都有完整的TypeScript类型定义
   - 使用时请确保类型匹配，避免运行时错误

3. **性能优化**
   - 大数据量表格使用分页加载
   - 路由组件使用懒加载
   - 图片和静态资源进行适当压缩

4. **浏览器兼容性**
   - 支持现代浏览器（Chrome 80+, Firefox 78+, Safari 13+）
   - 使用Vite的默认浏览器兼容性配置

## 📞 技术支持

如遇到问题：

1. 检查控制台错误信息
2. 确认后端API服务正常运行
3. 查看网络请求是否正常
4. 参考Element Plus官方文档：https://element-plus.org/
```
```
