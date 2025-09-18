<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <h1 class="system-title">汽车企业查询系统</h1>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-icon>
              <User />
            </el-icon>
            {{ userName || '未知用户' }}
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon>
                  <User />
                </el-icon>
                个人信息
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon>
                  <Setting />
                </el-icon>
                系统设置
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon>
                  <SwitchButton />
                </el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="main-container">
      <!-- 侧边导航菜单 -->
      <el-aside class="sidebar" width="250px">
        <el-menu :default-active="$route.path" class="sidebar-menu" router :collapse="false"
          :default-openeds="defaultOpeneds">
          <!-- 企业信息查询 -->
          <el-sub-menu index="enterprise">
            <template #title>
              <el-icon>
                <OfficeBuilding />
              </el-icon>
              <span>企业信息查询</span>
            </template>
            <el-menu-item v-for="route in enterpriseRoutes" :key="route.path" :index="route.path">
              <el-icon>
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 常用业务查询 -->
          <el-sub-menu index="business">
            <template #title>
              <el-icon>
                <Document />
              </el-icon>
              <span>常用业务查询</span>
            </template>
            <el-menu-item v-for="route in businessRoutes" :key="route.path" :index="route.path">
              <el-icon>
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 可视化图表 -->
          <el-sub-menu index="visualization">
            <template #title>
              <el-icon>
                <TrendCharts />
              </el-icon>
              <span>可视化图表</span>
            </template>
            <el-menu-item v-for="route in visualizationRoutes" :key="route.path" :index="route.path">
              <el-icon>
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 管理工具 (仅管理员可见) -->
          <el-sub-menu index="management" v-if="hasAdminPermission">
            <template #title>
              <el-icon>
                <Setting />
              </el-icon>
              <span>管理工具</span>
            </template>
            <el-menu-item v-for="route in managementRoutes" :key="route.path" :index="route.path">
              <el-icon>
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta.title }}</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <!-- 主内容区域 -->
      <el-main class="content">
        <div class="page-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="page-content">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  ArrowDown,
  Document,
  Search,
  Files,
  OfficeBuilding,
  Money,
  DataAnalysis,
  Monitor,
  Lock,
  TrendCharts,
  Setting,
  View,
  SwitchButton,
  Download
} from '@element-plus/icons-vue'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { userName, logout, user } = useAuth()

// 检查是否有管理员权限
const hasAdminPermission = computed(() => {
  return user.value?.permissions?.includes('admin:all') || false
})

// 当前页面标题
const currentPageTitle = computed(() => {
  return route.meta?.title as string || '首页'
})

// 默认展开的菜单项
const defaultOpeneds = ['enterprise', 'business', 'visualization', 'management']

// 获取所有可见的路由
const allRoutes = computed(() => {
  return router.getRoutes()
    .filter(route =>
      route.path !== '/' &&
      route.path !== '/login' &&
      route.meta?.title &&
      !route.meta?.hidden
    )
    .map(route => ({
      path: route.path,
      name: route.name,
      meta: route.meta
    }))
})

// 企业信息查询路由
const enterpriseRoutes = computed(() => {
  return allRoutes.value.filter(route => route.meta?.parentTitle === '企业信息查询')
})

// 常用业务查询路由
const businessRoutes = computed(() => {
  return allRoutes.value.filter(route => route.meta?.parentTitle === '常用业务查询')
})

// 可视化图表路由
const visualizationRoutes = computed(() => {
  return allRoutes.value.filter(route => route.meta?.parentTitle === '可视化图表')
})

// 管理工具路由
const managementRoutes = computed(() => {
  return allRoutes.value.filter(route => route.meta?.parentTitle === '管理工具')
})

// 处理用户操作
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      handleProfile()
      break
    case 'settings':
      handleSettings()
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 个人信息
const handleProfile = () => {
  ElMessage.info('个人信息功能开发中...')
}

// 系统设置
const handleSettings = () => {
  ElMessage.info('系统设置功能开发中...')
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '确认退出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 调用logout方法
    await logout()
  } catch (error) {
    // 用户取消操作
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left .system-title {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.header-right .user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
}

.header-right .user-info:hover {
  color: #409eff;
}

.main-container {
  flex: 1;
  height: calc(100vh - 60px);
}

.sidebar {
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.sidebar-menu .el-sub-menu__title {
  height: 50px;
  line-height: 50px;
  font-weight: 600;
}

.sidebar-menu .el-sub-menu .el-menu-item {
  height: 45px;
  line-height: 45px;
  padding-left: 50px !important;
  background-color: #f8f9fa;
}

.sidebar-menu .el-sub-menu .el-menu-item:hover {
  background-color: #ecf5ff;
}

.sidebar-menu .el-sub-menu .el-menu-item.is-active {
  background-color: #409eff;
  color: #fff;
}

.sidebar-menu .el-sub-menu .el-menu-item.is-active .el-icon {
  color: #fff;
}

.content {
  background: #f5f7fa;
  padding: 0;
  overflow: auto;
}

.page-header {
  background: #fff;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.page-content {
  padding: 0 20px 20px;
  min-height: calc(100vh - 140px);
}
</style>
