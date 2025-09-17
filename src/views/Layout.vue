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
            {{ currentUser }}
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="main-container">
      <!-- 侧边导航菜单 -->
      <el-aside class="sidebar" width="250px">
        <el-menu :default-active="$route.path" class="sidebar-menu" router :collapse="false">
          <el-menu-item v-for="route in menuRoutes" :key="route.path" :index="route.path">
            <el-icon>
              <component :is="route.meta.icon" />
            </el-icon>
            <span>{{ route.meta.title }}</span>
          </el-menu-item>
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
import { ElMessage } from 'element-plus'
import {
  User,
  ArrowDown,
  Document,
  Search,
  Files,
  OfficeBuilding,
  Money,
  DataAnalysis
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 当前用户信息
const currentUser = computed(() => {
  return localStorage.getItem('username') || '管理员'
})

// 当前页面标题
const currentPageTitle = computed(() => {
  return route.meta?.title as string || '首页'
})

// 菜单路由配置
const menuRoutes = computed(() => {
  return router.getRoutes()
    .filter(route => route.path !== '/' && route.path !== '/login' && route.meta?.title)
    .map(route => ({
      path: route.path,
      name: route.name,
      meta: route.meta
    }))
})

// 处理用户操作
const handleCommand = (command: string) => {
  switch (command) {
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('username')
  ElMessage.success('已退出登录')
  router.push('/login')
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
