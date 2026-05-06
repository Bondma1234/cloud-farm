import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
    {
      path: '/dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { title: '工作台', requiresAuth: true },
    },
    {
      path: '/packages',
      component: () => import('@/views/Packages.vue'),
      meta: { title: '套餐管理', requiresAuth: true },
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.title) document.title = `${to.meta.title} · 云上田园 后台`;
  // P3 才接真鉴权; 现在 mock 通过
  return true;
});
