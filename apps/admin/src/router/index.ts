import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
    // 受保护页统一挂 DefaultLayout 下,AdminAside / AdminHeader 只挂一次
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '工作台', requiresAuth: true },
        },
        {
          path: 'packages',
          component: () => import('@/views/Packages.vue'),
          meta: { title: '套餐管理', requiresAuth: true },
        },
        {
          path: 'orders',
          component: () => import('@/views/Orders.vue'),
          meta: { title: '订单管理', requiresAuth: true },
        },
        {
          path: 'commands',
          component: () => import('@/views/Commands.vue'),
          meta: { title: '指令工单', requiresAuth: true },
        },
        {
          path: 'users',
          component: () => import('@/views/Users.vue'),
          meta: { title: '用户管理', requiresAuth: true },
        },
        {
          path: 'errors',
          component: () => import('@/views/Errors.vue'),
          meta: { title: '错误日志', requiresAuth: true },
        },
      ],
    },
  ],
});

// P3: 真路由守卫,没登录访问受限页面 → 跳 /login
router.beforeEach((to) => {
  if (to.meta.title) document.title = `${to.meta.title as string} · 云上田园 后台`;
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  // 已登录访问 /login 直接送去 dashboard
  if (to.path === '/login' && auth.isLoggedIn) {
    return { path: '/dashboard' };
  }
  return true;
});
