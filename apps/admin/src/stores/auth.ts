// ============ Admin · 当前登录态 store ============
// JWT 本身存 localStorage(api-client 那边管),这里 store 只放"用户信息"+
// 提供 isLoggedIn 让路由守卫判断是否能进受限页面

import { defineStore } from 'pinia';
import { getAccessToken, logout as apiLogout } from '@cloud-farm/api-client';

export interface AdminUser {
  id: number;
  phone: string;     // 后端返回的真号(我们这边没脱敏,因为后台需要看完整号方便客服)
  nickname: string;
  avatar: string;
  level: string;
  role: string;
}

const USER_KEY = 'cloud-farm-admin:user';

function readPersisted(): AdminUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

function writePersisted(u: AdminUser | null) {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
}

export const useAuthStore = defineStore('admin-auth', {
  state: () => ({
    user: readPersisted(),
    // 同步一次内存里的"是否有 token",避免每次 isLoggedIn 都跑 getAccessToken()→localStorage
    // 401 拦截器清 token 后会通过 invalidate() 把这个标志位拨回来
    _hasToken: !!getAccessToken(),
  }),
  getters: {
    isLoggedIn: (s) => !!s.user && s._hasToken,
    role: (s) => s.user?.role || '',
    isAdmin: (s) => s.user?.role === 'admin',
  },
  actions: {
    set(user: AdminUser) {
      this.user = user;
      this._hasToken = !!getAccessToken();
      writePersisted(user);
    },
    /** 401 拦截器调它,把 store 内的登录态拨成"已失效",路由守卫下一帧就跳 /login */
    invalidate() {
      this.user = null;
      this._hasToken = false;
      writePersisted(null);
    },
    clear() {
      this.user = null;
      this._hasToken = false;
      writePersisted(null);
      apiLogout();
    },
  },
});

// 模块级:监听 storage 事件(其他 tab 退出登录时同步)+ 简单轮询 token 变化
// 但更靠谱的是显式调:在 main.ts 装一个 unauthorized 事件桥

