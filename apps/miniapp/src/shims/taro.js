// 浏览器预览用的 Taro API 轻量 shim：把 Taro.navigateTo/switchTab 映射到 vue-router
import { useRoute as vueUseRoute } from 'vue-router';

let _router = null;
export const setRouter = r => { _router = r; };

// 读取当前路由的 query 作为 Taro 页面参数
export const useRouter = () => {
  try {
    const route = vueUseRoute();
    return { params: { ...route.query } };
  } catch {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const q = hash.split('?')[1] || '';
    const params = Object.fromEntries(
      q.split('&').filter(Boolean).map(kv => kv.split('=').map(decodeURIComponent))
    );
    return { params };
  }
};

const toWebPath = url => {
  const [path, query = ''] = url.split('?');
  const params = Object.fromEntries(
    query.split('&').filter(Boolean).map(kv => kv.split('=').map(decodeURIComponent))
  );
  return { path, params };
};

const Taro = {
  navigateTo: ({ url }) => {
    const { path, params } = toWebPath(url);
    _router && _router.push({ path, query: params });
    return Promise.resolve();
  },
  redirectTo: ({ url }) => {
    const { path, params } = toWebPath(url);
    _router && _router.replace({ path, query: params });
    return Promise.resolve();
  },
  switchTab: ({ url }) => {
    const { path } = toWebPath(url);
    _router && _router.push({ path });
    return Promise.resolve();
  },
  navigateBack: ({ delta = 1 } = {}) => {
    if (_router && window.history.length > 1) {
      for (let i = 0; i < delta; i++) _router.back();
      return Promise.resolve();
    }
    return Promise.reject(new Error('no history'));
  },
  setClipboardData: ({ data }) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(data).catch(() => {});
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = data; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      return Promise.resolve();
    } catch (e) { return Promise.reject(e); }
  },
  // P8 视觉 J: 品牌化 toast / loading
  // 原:黑色方框 + 文字。现:白卡片 + 品牌色图标 + 阴影 + fade-in
  showToast: ({ title = '', icon = 'none' }) => {
    const el = document.createElement('div');
    const iconMap = {
      success: { ic: '✓', color: '#4CA777' },
      error:   { ic: '✕', color: '#E57373' },
      loading: { ic: '⟳', color: '#4CA777' },
      none:    { ic: '',  color: '#4CA777' }
    };
    const m = iconMap[icon] || iconMap.none;
    const iconHtml = m.ic
      ? `<span style="display:inline-flex;width:22px;height:22px;border-radius:50%;background:${m.color};color:#fff;align-items:center;justify-content:center;font-size:14px;font-weight:700;margin-right:8px;flex-shrink:0;">${m.ic}</span>`
      : '';
    el.innerHTML = `${iconHtml}<span>${title}</span>`;
    el.style.cssText = `
      position: fixed; left: 50%; top: 30%; transform: translate(-50%, -50%);
      background: #fff; color: #1B1B1B;
      padding: 12px 20px; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(76,167,119,0.08);
      z-index: 9999; font-size: 14px; font-weight: 500;
      display: flex; align-items: center; max-width: 80vw;
      animation: cf-toast-in 0.2s ease-out;
      pointer-events: none;
    `;
    if (!document.getElementById('__cf_toast_kf')) {
      const style = document.createElement('style');
      style.id = '__cf_toast_kf';
      style.textContent = `
        @keyframes cf-toast-in {
          from { opacity: 0; transform: translate(-50%, -56%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes cf-spin { to { transform: rotate(360deg); } }
        .__cf-spinner {
          display: inline-block; width: 28px; height: 28px;
          border: 3px solid #E8F4EA; border-top-color: #4CA777;
          border-radius: 50%; animation: cf-spin 0.8s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  },
  showLoading: ({ title = '加载中…' } = {}) => {
    // 防重复:已经有就只更新文案
    let el = document.getElementById('__loading');
    if (el) { el.querySelector('.text').textContent = title; return; }
    el = document.createElement('div');
    el.id = '__loading';
    el.innerHTML = `<span class="__cf-spinner" style="margin-right:10px"></span><span class="text">${title}</span>`;
    el.style.cssText = `
      position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
      background: #fff; color: #2E7D32;
      padding: 18px 24px; border-radius: 14px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(76,167,119,0.1);
      z-index: 9999; font-size: 14px; font-weight: 500;
      display: flex; align-items: center; min-width: 140px;
    `;
    // 注入 keyframes(若 toast 没注入过)
    if (!document.getElementById('__cf_toast_kf')) {
      const style = document.createElement('style');
      style.id = '__cf_toast_kf';
      style.textContent = `
        @keyframes cf-spin { to { transform: rotate(360deg); } }
        .__cf-spinner {
          display: inline-block; width: 28px; height: 28px;
          border: 3px solid #E8F4EA; border-top-color: #4CA777;
          border-radius: 50%; animation: cf-spin 0.8s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
    document.body.appendChild(el);
  },
  hideLoading: () => {
    const el = document.getElementById('__loading');
    if (el) el.remove();
  },
  showModal: ({ title = '', content = '', success }) => {
    const ok = window.confirm(title + (content ? `\n\n${content}` : ''));
    success && success({ confirm: ok, cancel: !ok });
  }
};

export default Taro;
