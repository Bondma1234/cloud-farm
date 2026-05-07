// ============ 指令工单 store - P4-G ============
import { defineStore } from 'pinia';
import { listCommands, ApiError } from '@cloud-farm/api-client';
import { COMMAND_HISTORY as MOCK } from './mock';

export const useCommandStore = defineStore('commands', {
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
      const fresh = Date.now() - this.loadedAt < 30_000;
      if (!opts.force && fresh && this.list.length) return this.list;

      this.loading = true;
      this.error = null;
      try {
        this.list = await listCommands();
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
