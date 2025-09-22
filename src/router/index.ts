import { createRouter, createWebHistory } from "vue-router";
import Layout from "../views/Layout.vue";
import Login from "../views/Login.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/",
      component: Layout,
      meta: { requiresAuth: true },
      redirect: "/enterprise/group-info",
      children: [
        // 企业信息查询
        {
          path: "/enterprise/group-info",
          name: "group-info",
          component: () => import("../views/GroupInfo.vue"),
          meta: {
            requiresAuth: true,
            title: "集团基本信息",
            icon: "OfficeBuilding",
            parentTitle: "企业信息查询",
          },
        },
        {
          path: "/enterprise/enterprise-info",
          name: "enterprise-info",
          component: () => import("../views/EnterpriseInfo.vue"),
          meta: {
            requiresAuth: true,
            title: "企业基本信息",
            icon: "OfficeBuilding",
            parentTitle: "企业信息查询",
          },
        },
        {
          path: "/enterprise/supervision",
          name: "enterprise-supervision",
          component: () => import("../views/EnterpriseSupervision.vue"),
          meta: {
            requiresAuth: true,
            title: "企业监管状态",
            icon: "View",
            parentTitle: "企业信息查询",
          },
        },
        // 常用业务查询
        {
          path: "/business/certificate-quantity",
          name: "certificate-quantity",
          component: () => import("../views/CertificateQuantity.vue"),
          meta: {
            requiresAuth: true,
            title: "合格证上传数量",
            icon: "Document",
            parentTitle: "常用业务查询",
          },
        },
        // {
        //   path: "/business/certificate-detail",
        //   name: "certificate-detail",
        //   component: () => import("../views/CertificateDetail.vue"),
        //   meta: {
        //     requiresAuth: true,
        //     title: "合格证单证信息",
        //     icon: "Search",
        //     parentTitle: "常用业务查询",
        //   },
        // },
        // 可视化图表
        {
          path: "/visualization/dashboard",
          name: "dashboard",
          component: () => import("../views/Dashboard.vue"),
          meta: {
            requiresAuth: true,
            title: "大屏界面",
            icon: "Monitor",
            parentTitle: "可视化图表",
          },
        },
        // 管理工具
        {
          path: "/management/users",
          name: "user-management",
          component: () => import("../views/admin/UserManagement.vue"),
          meta: {
            requiresAuth: true,
            title: "用户管理",
            icon: "User",
            parentTitle: "管理工具",
            requiredPermissions: ["admin:all"]
          },
        },
        {
          path: "/management/permissions",
          name: "permission-management",
          component: () => import("../views/admin/PermissionManagement.vue"),
          meta: {
            requiresAuth: true,
            title: "权限管理",
            icon: "Lock",
            parentTitle: "管理工具",
            requiredPermissions: ["admin:all"]
          },
        },
        {
          path: "/management/export-limits",
          name: "export-limit-management",
          component: () => import("../views/admin/ExportLimitManagement.vue"),
          meta: {
            requiresAuth: true,
            title: "导出限制管理",
            icon: "Download",
            parentTitle: "管理工具",
            requiredPermissions: ["admin:all"]
          },
        },
        // 隐藏的原有页面（保留以防需要）
        {
          path: "/product-access",
          name: "product-access",
          component: () => import("../views/ProductAccess.vue"),
          meta: {
            requiresAuth: true,
            title: "产品准入信息查询",
            icon: "Files",
            hidden: true,
          },
        },
        {
          path: "/enterprise-access",
          name: "enterprise-access",
          component: () => import("../views/EnterpriseAccess.vue"),
          meta: {
            requiresAuth: true,
            title: "企业准入信息查询",
            icon: "OfficeBuilding",
            hidden: true,
          },
        },
        {
          path: "/tax-declaration",
          name: "tax-declaration",
          component: () => import("../views/TaxDeclaration.vue"),
          meta: {
            requiresAuth: true,
            title: "财税申报信息查询",
            icon: "Money",
            hidden: true,
          },
        },
        {
          path: "/other-statistics",
          name: "other-statistics",
          component: () => import("../views/OtherStatistics.vue"),
          meta: {
            requiresAuth: true,
            title: "其他统计",
            icon: "DataAnalysis",
            hidden: true,
          },
        },
      ],
    },
  ],
});

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 动态导入useAuth以避免循环依赖
  const { useAuth } = await import('../composables/useAuth')
  const { isLoggedIn, validateToken, user } = useAuth()

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!isLoggedIn.value) {
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原始路径用于登录后跳转
      })
      return
    }

    // 已登录，验证token有效性
    const tokenValid = await validateToken()
    if (!tokenValid) {
      // token无效，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 检查权限要求
    if (to.meta.requiredPermissions) {
      const requiredPermissions = to.meta.requiredPermissions as string[]
      const userPermissions = user.value?.permissions || []

      const hasPermission = requiredPermissions.some(permission =>
        userPermissions.includes(permission)
      )

      if (!hasPermission) {
        // 权限不足，跳转到首页并显示错误信息
        next('/')
        // 这里可以显示权限不足的提示
        return
      }
    }
  }

  // 如果已登录用户访问登录页，重定向到首页
  if (to.path === '/login' && isLoggedIn.value) {
    next('/')
    return
  }

  // 正常跳转
  next()
});

export default router;
