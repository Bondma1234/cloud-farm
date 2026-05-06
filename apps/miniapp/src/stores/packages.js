// ============ 套餐 store - P4 真实 API ============
// home / packages 页通过这个 store 拿数据,不再直接 import PACKAGES 常量
//
// 行为:
//   1. 启动后调 listPackages() 拉真实 /api/packages
//   2. 成功 → 替换 list,source = 'api'
//   3. 失败 → fallback 到 mock 的 PACKAGES,source = 'mock-fallback'
//      这样后端没起的时候页面也能看,演示无压力,但顶部会出 toast 提示
//
// 后续 P5+ 类似套路加 stores/orders.js / stores/journal.js / stores/cameras.js

import { defineStore } from 'pinia';
import { listPackages, ApiError } from '@cloud-farm/api-client';
import { PACKAGES as MOCK_PACKAGES } from './mock';

export const usePackageStore = defineStore('packages', {
  state: () => ({
    list: [],
    loading: false,
    error: null, // null | string
    source: 'init', // 'api' | 'mock-fallback' | 'init'
    loadedAt: 0,
  }),

  getters: {
    isMockFallback: (s) => s.source === 'mock-fallback',
    byId: (s) => (id) => s.list.find((p) => p.id === id),
  },

  actions: {
    /**
     * 拉套餐数据
     * @param {object} opts
     * @param {boolean} [opts.force] 强制重新拉(默认有缓存 60 秒)
     */
    async fetch(opts = {}) {
      const fresh = Date.now() - this.loadedAt < 60_000;
      if (!opts.force && fresh && this.list.length) return this.list;

      this.loading = true;
      this.error = null;
      try {
        const data = await listPackages();
        this.list = data;
        this.source = 'api';
        this.loadedAt = Date.now();
      } catch (e) {
        const msg =
          e instanceof ApiError ? `${e.message} (code=${e.code})` : e?.message || '网络错误';
        this.error = msg;
        // mock 兜底,保持页面可演示
        this.list = MOCK_PACKAGES;
        this.source = 'mock-fallback';
        this.loadedAt = Date.now();
        // eslint-disable-next-line no-console
        console.warn('[packages store] API 调用失败,已 fallback 到 mock 数据:', msg);
      } finally {
        this.loading = false;
      }
      return this.list;
    },
  },
});
