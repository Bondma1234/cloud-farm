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
  showToast: ({ title = '', icon = 'none' }) => {
    const el = document.createElement('div');
    el.textContent = (icon === 'success' ? '✓ ' : '') + title;
    el.style.cssText = `
      position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.75); color: #fff; padding: 14px 20px;
      border-radius: 8px; z-index: 9999; font-size: 14px; pointer-events: none;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },
  showLoading: ({ title = 'Loading' } = {}) => {
    const el = document.createElement('div');
    el.id = '__loading';
    el.textContent = '⏳ ' + title;
    el.style.cssText = `
      position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.75); color: #fff; padding: 16px 24px;
      border-radius: 8px; z-index: 9999; font-size: 14px;
    `;
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
