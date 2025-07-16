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
      redirect: "/certificate-quantity",
      children: [
        {
          path: "/certificate-quantity",
          name: "certificate-quantity",
          component: () => import("../views/CertificateQuantity.vue"),
          meta: {
            requiresAuth: true,
            title: "合格证总量查询",
            icon: "Document",
          },
        },
        {
          path: "/certificate-detail",
          name: "certificate-detail",
          component: () => import("../views/CertificateDetail.vue"),
          meta: {
            requiresAuth: true,
            title: "合格证单证查询",
            icon: "Search",
          },
        },
        {
          path: "/product-access",
          name: "product-access",
          component: () => import("../views/ProductAccess.vue"),
          meta: {
            requiresAuth: true,
            title: "产品准入信息查询",
            icon: "Files",
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
          },
        },
      ],
    },
  ],
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (to.meta.requiresAuth && !isLoggedIn) {
    next("/login");
  } else if (to.path === "/login" && isLoggedIn) {
    next("/");
  } else {
    next();
  }
});

export default router;
