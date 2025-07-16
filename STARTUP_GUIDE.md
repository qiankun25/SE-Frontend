# 汽车企业查询系统 - 启动指南

## 问题修复说明

### 已修复的问题

1. **HelpTooltip 组件导出问题**
   - **问题**: `<script setup>` 语法不能包含 ES 模块导出语句
   - **解决方案**: 
     - 创建了独立的 `src/utils/helpTemplates.ts` 文件
     - 移除了组件内的 `export` 语句
     - 更新了所有页面组件的导入方式

2. **帮助模板导入问题**
   - **修复文件**:
     - `src/components/common/HelpTooltip.vue`
     - `src/views/CertificateQuantity.vue`
     - `src/views/CertificateDetail.vue`
     - `src/utils/helpTemplates.ts` (新建)

### 修复详情

#### 1. 创建帮助模板文件
```typescript
// src/utils/helpTemplates.ts
export const helpTemplates: Record<string, HelpTemplate> = {
  // 所有帮助模板定义
}
```

#### 2. 更新组件导入
```typescript
// 修复前
import HelpTooltip, { helpTemplates } from '../components/common/HelpTooltip.vue'

// 修复后
import HelpTooltip from '../components/common/HelpTooltip.vue'
import { helpTemplates } from '../utils/helpTemplates'
```

## 系统启动步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问系统
- 开发服务器地址: `http://localhost:5173`
- 默认登录页面: `/login`
- 主系统页面: `/` (需要登录)

## 系统功能验证

### 登录功能
1. 访问 `/login` 页面
2. 输入任意用户名和密码
3. 点击登录按钮
4. 系统会自动跳转到主页面

### 主要功能页面
1. **合格证总量查询** (`/certificate-quantity`)
   - 多维度查询条件
   - 统计概览展示
   - 表格和图表视图

2. **合格证单证查询** (`/certificate-detail`)
   - 精确查询功能
   - 批量查询支持
   - 详细信息展示

3. **产品准入信息查询** (`/product-access`)
   - 产品信息查询
   - 技术参数展示
   - 批次管理

4. **企业准入信息查询** (`/enterprise-access`)
   - 企业信息管理
   - 资质查询
   - 列表和卡片视图

5. **财税申报信息查询** (`/tax-declaration`)
   - 财税数据统计
   - 申报类型分类
   - 快捷查询

6. **其他统计** (`/other-statistics`)
   - 多种统计功能
   - 统计卡片展示
   - 数据监控

### 通用组件测试
1. **时间选择器**
   - 快捷时间选择
   - 自定义日期范围
   - 年月选择

2. **地区选择器**
   - 省市区联动
   - 手动输入支持

3. **企业选择器**
   - 企业搜索
   - 批量导入

4. **导出功能**
   - 多种导出方式
   - 格式选择
   - 字段配置

5. **帮助提示**
   - 上下文帮助
   - 详细说明
   - 使用示例

## 开发环境配置

### 技术栈
- Vue 3.5.13
- TypeScript
- Element Plus 2.10.1
- Vue Router 4.5.1
- Vite 6.3.5

### 项目结构
```
src/
├── components/          # 通用组件
│   └── common/         # 公共组件
├── views/              # 页面组件
├── router/             # 路由配置
├── types/              # TypeScript 类型定义
├── services/           # API 服务层
├── utils/              # 工具函数
└── App.vue            # 根组件
```

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 规范
- 使用 Element Plus 组件库
- 响应式设计支持

## 常见问题解决

### 1. 编译错误
- 确保所有依赖已正确安装
- 检查 TypeScript 类型定义
- 验证组件导入路径

### 2. 路由问题
- 检查路由配置文件
- 验证组件懒加载
- 确认路由守卫逻辑

### 3. 样式问题
- 检查 Element Plus 样式导入
- 验证自定义样式覆盖
- 确认响应式断点

### 4. 组件问题
- 检查组件导入路径
- 验证 props 类型定义
- 确认事件处理函数

## 下一步开发建议

### 1. 后端集成
- 实现真实的 API 接口
- 添加数据验证和错误处理
- 完善用户认证系统

### 2. 功能完善
- 实现图表功能
- 添加数据缓存
- 完善导出功能

### 3. 性能优化
- 添加虚拟滚动
- 实现懒加载
- 优化打包体积

### 4. 测试覆盖
- 编写单元测试
- 添加集成测试
- 实现端到端测试

## 联系支持

如果在启动或使用过程中遇到问题，请检查：
1. Node.js 版本 (推荐 16+)
2. npm 版本 (推荐 8+)
3. 浏览器兼容性 (推荐 Chrome/Firefox 最新版)

系统已经完成基础架构搭建，所有主要功能页面和通用组件都已实现，可以正常启动和访问。
