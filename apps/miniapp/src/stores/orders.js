// ============ 订单 store - P4-E 真实 API ============
// 跟 stores/packages.js 同套路:真接口为主, mock 兜底, source 标记数据来源。
//
// 使用范例:
//   const ordersStore = useOrderStore();
//   onMounted(() => ordersStore.fetch());      // 拉列表
//   const filtered = computed(() => ordersStore.list.filter(o => o.status === 'pending'));
//   const o = ordersStore.byId('ORD-2026-0418');

import { defineStore } from 'pinia';
import { listOrders, getOrder, payOrder, ApiError } from '@cloud-farm/api-client';
import { ORDERS as MOCK_ORDERS } from './mock';

export const useOrderStore = defineStore('orders', {
  state: () => ({
    list: [],
    loading: false,
    error: null,
    source: 'init',         // 'api' | 'mock-fallback' | 'init'
    loadedAt: 0,
    detailCache: {}         // id → 详情(避免来回切换重复拉)
  }),

  getters: {
    isMockFallback: (s) => s.source === 'mock-fallback',
    byId: (s) => (id) => s.list.find((o) => o.id === id) || s.detailCache[id]
  },

  actions: {
    async fetch(opts = {}) {
      const fresh = Date.now() - this.loadedAt < 30_000;
      if (!opts.force && fresh && this.list.length) return this.list;

      this.loading = true;
      this.error = null;
      try {
        const data = await listOrders();
        this.list = data;
        this.source = 'api';
        this.loadedAt = Date.now();
      } catch (e) {
        const msg = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e?.message || '网络错误');
        this.error = msg;
        this.list = MOCK_ORDERS;
        this.source = 'mock-fallback';
        this.loadedAt = Date.now();
        // eslint-disable-next-line no-console
        console.warn('[orders store] API 失败, fallback mock:', msg);
      } finally {
        this.loading = false;
      }
      return this.list;
    },

    /** 详情:先看 list / detailCache,没有的话走接口,再失败用 mock 找 */
    async fetchOne(id) {
      const cached = this.byId(id);
      if (cached) return cached;
      try {
        const o = await getOrder(id);
        this.detailCache[id] = o;
        return o;
      } catch {
        // mock 兜底
        const fallback = MOCK_ORDERS.find((o) => o.id === id);
        if (fallback) this.detailCache[id] = fallback;
        return fallback || null;
      }
    },

    /** 支付订单(MVP mock):pending → growing(认养)/ shipped(产地直送) */
    async pay(id) {
      const updated = await payOrder(id);
      // 同步更新 list 和 cache
      const idx = this.list.findIndex((o) => o.id === id);
      if (idx >= 0) this.list[idx] = updated;
      this.detailCache[id] = updated;
      return updated;
    },

    clear() {
      this.list = [];
      this.detailCache = {};
      this.source = 'init';
      this.loadedAt = 0;
    }
  }
});
