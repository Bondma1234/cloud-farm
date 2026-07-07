// ============ 农产品商城 store(M-08)============
// 无 mock 兜底:商城是新模块,后端挂了就显示错误/空态。
import { defineStore } from 'pinia';
import { listGoods, getGoods, ApiError } from '@cloud-farm/api-client';

export const useGoodsStore = defineStore('goods', {
  state: () => ({
    list: [],
    category: 'all',
    loading: false,
    error: null,
    loadedAt: 0,
    detailCache: {}, // id -> goods
  }),
  actions: {
    async fetch(category = 'all', opts = {}) {
      const changed = category !== this.category;
      const fresh = Date.now() - this.loadedAt < 60_000;
      if (!opts.force && !changed && fresh && this.list.length) return this.list;

      this.category = category;
      this.loading = true;
      this.error = null;
      try {
        this.list = await listGoods(category === 'all' ? undefined : category);
        this.loadedAt = Date.now();
      } catch (e) {
        this.error = e instanceof ApiError ? `${e.message} (${e.code})` : (e?.message || '网络错误');
        this.list = [];
      } finally {
        this.loading = false;
      }
      return this.list;
    },
    async fetchOne(id) {
      if (this.detailCache[id]) return this.detailCache[id];
      const g = await getGoods(id);
      this.detailCache[id] = g;
      return g;
    },
  },
});
