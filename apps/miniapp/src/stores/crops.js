// ============ 作物百科 store - P4-G ============
import { defineStore } from 'pinia';
import { listCrops, ApiError } from '@cloud-farm/api-client';
import { CROPS_CATALOG as MOCK } from './mock';

export const useCropStore = defineStore('crops', {
  state: () => ({
    list: [],
    loading: false,
    error: null,
    source: 'init',
    loadedAt: 0,
  }),
  getters: {
    isMockFallback: (s) => s.source === 'mock-fallback',
  },
  actions: {
    async fetch(opts = {}) {
      const fresh = Date.now() - this.loadedAt < 5 * 60_000; // 5min
      if (!opts.force && fresh && this.list.length) return this.list;

      this.loading = true;
      this.error = null;
      try {
        this.list = await listCrops();
        this.source = 'api';
        this.loadedAt = Date.now();
      } catch (e) {
        this.error = e instanceof ApiError ? `${e.message} (${e.code})` : (e?.message || '网络错误');
        this.list = MOCK;
        this.source = 'mock-fallback';
        this.loadedAt = Date.now();
      } finally {
        this.loading = false;
      }
      return this.list;
    },
  },
});
