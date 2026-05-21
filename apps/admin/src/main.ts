import { createApp } from 'vue';
import { createPinia } from 'pinia';
// ✅ 一次性引 Element Plus 整包 CSS — dev 模式下只发 1 个 CSS 请求,
// 而不是按 <el-xxx> 拆 60+ 个 css chunk(那才是后台卡浏览器的真凶)。
// 组件 JS 仍由 unplugin-vue-components 自动按需注册,树摇生产构建不会变胖。
import 'element-plus/dist/index.css';
import './styles/global.css';

import App from './App.vue';
import { router } from './router';
import { useAuthStore } from '@/stores/auth';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia).use(router);

// 401 全局桥:api-client 401 拦截器 dispatch 'cloud-farm:unauthorized'
// → 这里清登录态 + 路由跳 /login,避免在受限页面反复发 401
window.addEventListener('cloud-farm:unauthorized', () => {
  const auth = useAuthStore();
  if (!auth.isLoggedIn) return; // 已经登出过,别重复跳
  auth.invalidate();
  // 只在当前不是 /login 时跳,避免循环
  if (router.currentRoute.value.path !== '/login') {
    router.replace({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath, reason: 'expired' },
    });
  }
});

app.mount('#app');
