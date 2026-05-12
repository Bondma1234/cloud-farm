// ============ 我的田 store (P5-mock) ============
// 一个 store 管:
//   - 当前用户的种植中地块(getMyPlot)
//   - 摄像头播放 url(getCameraUrl)
//   - PTZ / 抓拍 动作的 loading 态
//
// 无 mock fallback: 没登录 / 没认养 → 显示空态(my-plot 模板里处理),
// 不像 packages 那样兜底假数据,因为"我的田"没数据时本来就是个引导认养页

import { defineStore } from 'pinia';
import { getMyPlot, getCameraUrl, cameraPtz, cameraSnapshot, ApiError } from '@cloud-farm/api-client';

export const useMyPlotStore = defineStore('myPlot', {
  state: () => ({
    plot: null,           // MyPlot | null
    cameraUrl: '',
    cameraTtl: 0,
    cameraLoadedAt: 0,
    loading: false,
    error: null,
    source: 'init',       // 'api' | 'empty' | 'init'
    ptzLoading: false,
    snapshotLoading: false,
  }),
  getters: {
    isEmpty: (s) => s.source === 'empty',
    hasCamera: (s) => !!s.plot?.camera?.id,
  },
  actions: {
    async fetch(opts = {}) {
      const fresh = Date.now() - this.cameraLoadedAt < 60_000;
      if (!opts.force && fresh && this.plot) return this.plot;

      this.loading = true;
      this.error = null;
      try {
        this.plot = await getMyPlot();
        this.source = 'api';
        // 顺便拉摄像头 url
        if (this.plot.camera?.id) {
          await this.refreshCameraUrl();
        }
      } catch (e) {
        // 404: 没认养任何地块,正常空态
        if (e instanceof ApiError && e.code === 404) {
          this.plot = null;
          this.source = 'empty';
          this.error = null;
        } else {
          this.error = e instanceof ApiError ? `${e.message} (${e.code})` : (e?.message || '加载失败');
        }
      } finally {
        this.loading = false;
      }
      return this.plot;
    },

    async refreshCameraUrl() {
      if (!this.plot?.plotId) return;
      try {
        const r = await getCameraUrl(this.plot.plotId);
        this.cameraUrl = r.url;
        this.cameraTtl = r.ttl;
        this.cameraLoadedAt = Date.now();
      } catch {
        this.cameraUrl = '';
      }
    },

    async ptz(direction) {
      if (!this.plot?.plotId) return null;
      this.ptzLoading = true;
      try {
        return await cameraPtz(this.plot.plotId, direction);
      } finally {
        this.ptzLoading = false;
      }
    },

    async snapshot() {
      if (!this.plot?.plotId) return null;
      this.snapshotLoading = true;
      try {
        return await cameraSnapshot(this.plot.plotId);
      } finally {
        this.snapshotLoading = false;
      }
    },

    clear() {
      this.plot = null;
      this.cameraUrl = '';
      this.cameraTtl = 0;
      this.cameraLoadedAt = 0;
      this.source = 'init';
      this.error = null;
    },
  },
});
