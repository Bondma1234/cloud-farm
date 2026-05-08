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
  }),
  getters: {
    isLoggedIn: (s) => !!s.user && !!getAccessToken(),
    role: (s) => s.user?.role || '',
    isAdmin: (s) => s.user?.role === 'admin',
  },
  actions: {
    set(user: AdminUser) {
      this.user = user;
      writePersisted(user);
    },
    clear() {
      this.user = null;
      writePersisted(null);
      apiLogout();
    },
  },
});
