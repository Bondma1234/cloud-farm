import { createApp, defineComponent, h, Transition } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory, RouterView } from 'vue-router';
import { setRouter } from './shims/taro.js';
import './app.scss';

// ============ @tap 事件桥接（浏览器预览专用） ============
// Taro 小程序里 <view @tap> 是标准写法；在浏览器里 view 只是个 <div>。
// 桌面浏览器上直接监听 'click' 就能转发；
// 但 iOS Safari / 微信 H5 里，<div> 这种非"可点击元素"默认不触发 click —— 只触发 touch 事件，
// 这会让套餐卡之类的按钮在 iPhone 上完全失效。
// 解决：同时监听 click（桌面）和 touchend（移动），并用距离+时长判定"真实轻触"（过滤滑动/长按），
// 再用时间戳去重避免同一次触摸既派发 touchend 又派发 click 引起的双触发。
if (typeof window !== 'undefined') {
  let startX = 0, startY = 0, startT = 0;
  let lastDispatchAt = 0;

  const dispatchTap = (target) => {
    const now = Date.now();
    if (now - lastDispatchAt < 400) return;   // 400ms 去重窗口
    lastDispatchAt = now;
    const tap = new CustomEvent('tap', { bubbles: true, cancelable: true });
    (target || document).dispatchEvent(tap);
  };

  // 记录触摸起点
  window.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; if (!t) return;
    startX = t.clientX; startY = t.clientY; startT = Date.now();
  }, { passive: true, capture: true });

  // 移动端主通道：touchend
  window.addEventListener('touchend', (e) => {
    if (!e.isTrusted) return;
    const t = e.changedTouches && e.changedTouches[0]; if (!t) return;
    const dx = Math.abs(t.clientX - startX);
    const dy = Math.abs(t.clientY - startY);
    if (dx > 10 || dy > 10) return;            // 位移 >10px 视为滑动/滚动，不派发
    if (Date.now() - startT > 800) return;     // 按压 >800ms 视为长按，不派发
    dispatchTap(e.target);
  }, { passive: true, capture: true });

  // 桌面主通道：click
  window.addEventListener('click', (e) => {
    if (!e.isTrusted) return;
    dispatchTap(e.target);
  }, true);
}

// ============ 自动注册所有页面 ============
const pageModules = import.meta.glob('./pages/*/index.vue', { eager: true });
const routes = Object.entries(pageModules).map(([p, mod]) => ({
  path: '/' + p.replace('./', '').replace('.vue', ''),
  component: mod.default,
  meta: { key: p }
}));
routes.push({ path: '/', redirect: '/pages/home/index' });

// ============ 顶部导航（桌面可见） ============
const NAV_ITEMS = [
  { path: '/pages/home/index',     label: '首页' },
  { path: '/pages/packages/index', label: '认养套餐' },
  { path: '/pages/my-plot/index',  label: '我的田' },
  { path: '/pages/live/index',     label: '直播' },
];

const SiteNav = defineComponent({
  render() {
    const active = this.$route.path;
    const isActive = (p) => active === p;
    return h('nav', { class: 'site-nav' }, [
      h('a', {
        class: 'brand',
        onClick: e => { e.preventDefault(); this.$router.push('/pages/home/index'); }
      }, [
        h('span', { class: 'logo' }, '🌾'),
        h('span', null, '云上田园')
      ]),
      h('ul', null, NAV_ITEMS.map(n => h('li', null,
        h('a', {
          class: ['nav-link', isActive(n.path) && 'active'],
          onClick: e => { e.preventDefault(); this.$router.push(n.path); }
        }, n.label)
      ))),
      h('div', { class: 'actions' }, [
        h('button', {
          class: 'cta-ghost',
          onClick: () => this.$router.push('/pages/profile/index')
        }, '我的账户'),
        h('button', {
          class: 'cta',
          onClick: () => this.$router.push('/pages/packages/index')
        }, '立即认养')
      ])
    ]);
  }
});

// ============ 底部 TabBar（移动端主导航） ============
const TABS = [
  { path: '/pages/home/index',     icon: '🏡', label: '首页' },
  { path: '/pages/packages/index', icon: '🌱', label: '认养' },
  { path: '/pages/my-plot/index',  icon: '📹', label: '我的田' },
  { path: '/pages/profile/index',  icon: '👤', label: '我的' }
];
const TAB_PATHS = TABS.map(t => t.path);

const TabBar = defineComponent({
  render() {
    const active = this.$route.path;
    return h('nav', { class: 'site-tabbar' }, TABS.map(t =>
      h('a', {
        class: ['tab', active === t.path && 'active'],
        onClick: e => { e.preventDefault(); this.$router.push(t.path); }
      }, [h('span', { class: 'ico' }, t.icon), h('span', { class: 'lab' }, t.label)])
    ));
  }
});

// ============ 页脚（桌面可见） ============
const SiteFooter = defineComponent({
  render() {
    return h('footer', { class: 'site-footer' }, [
      h('div', { class: 'inner' }, [
        h('div', { class: 'copy' }, [
          h('div', { class: 'brand-line' }, '🌾 云上田园 · 河南周口农业基地'),
          h('div', null, '远程认养 · 24h直播 · 有机种植 · 产地直送 · 冷链到家'),
          h('div', { style: 'color:#aaa;margin-top:6px' }, '© 2026 云上田园 保留所有权利  ·  豫ICP备XXXXXXXX号')
        ]),
        h('div', { class: 'links' }, [
          h('a', { href: '#/pages/packages/index' }, '认养套餐'),
          h('a', { href: '#/pages/live/index' }, '直播'),
          h('a', { href: '#' }, '关于我们'),
          h('a', { href: '#' }, '帮助中心'),
          h('a', { href: '#' }, '联系合作')
        ])
      ])
    ]);
  }
});

// ============ Site Shell（响应式容器） ============
// P8 D5: 路由切换 fade 200ms,GPU 加速 (translateZ),不影响性能
const SiteShell = defineComponent({
  render() {
    const isTab = TAB_PATHS.includes(this.$route.path);
    // RouterView 渲染当前页;Transition 包一层做 fade
    return h('div', { class: 'site-shell' }, [
      h(SiteNav),
      h('main', { class: 'site-main' }, [
        h('div', { class: 'site-content' }, [
          h(RouterView, null, {
            default: ({ Component }) => h(
              Transition,
              { name: 'cf-page', mode: 'out-in' },
              { default: () => Component ? h(Component) : null }
            )
          })
        ]),
        isTab ? h(TabBar) : null
      ]),
      h(SiteFooter)
    ]);
  }
});

const router = createRouter({
  history: createWebHashHistory(),
  routes
});
setRouter(router);

// ============ <image> → <img> 补丁（浏览器预览专用） ============
// Taro 小程序里 <image> 是内置组件；浏览器里它是 SVG 专用标签，什么都不显示。
// Vue 的全局组件注册对「原生保留标签名」不生效，所以用 MutationObserver 拦截：
// 每当 DOM 里出现一个 <image>（或它被重新赋值 src），就同步把属性映射到一个
// 真实的 <img>。加载失败时不会显示损坏图标 —— 父容器的背景色直接兜底。
if (typeof window !== 'undefined') {
  const modeToFit = (mode) => ({
    aspectFit:   'contain',
    widthFix:    'contain',
    scaleToFill: 'fill'
  }[mode] || 'cover');                      // 默认 aspectFill

  // ============ P8 视觉 C: 图片 fallback 兜底 SVG ============
  // <image @error> 会被 Taro 吞掉,我们在 patchImage 里直接挂 img.onerror。
  // 失败时用渐变 + emoji 的 SVG dataURL 顶上,emoji 根据 src 关键词智能选:
  //   url 含 pkg/package → 🌱  / crop → 🍅 / live → 📹 / ship/order → 📦 / 其他 → 🌾
  const pickFallback = (src = '') => {
    const s = src.toLowerCase();
    let emoji = '🌾', c1 = '#4CA777', c2 = '#2E7D32';
    if (s.includes('pkg') || s.includes('package')) { emoji = '🌱'; }
    else if (s.includes('crop'))                      { emoji = '🍅'; c1 = '#E57373'; c2 = '#C0392B'; }
    else if (s.includes('live'))                      { emoji = '📹'; }
    else if (s.includes('ship') || s.includes('order')) { emoji = '📦'; c1 = '#A1887F'; c2 = '#5D4037'; }
    else if (s.includes('snapshot') || s.includes('camera')) { emoji = '📸'; c1 = '#64B5F6'; c2 = '#1F5F9E'; }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="180" text-anchor="middle" font-size="120" opacity="0.85">${emoji}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const patchImage = (el) => {
    if (el.tagName !== 'IMAGE' || el.__patched) return;
    el.__patched = true;
    // 用一个 img 覆盖到 image 上（image 本身还占布局，免得 Vue diff 错乱）
    const img = document.createElement('img');
    img.style.cssText = 'display:block;width:100%;height:100%;position:absolute;inset:0;background:transparent;';
    img.draggable = false;
    el.style.position = 'relative';
    el.style.display = el.style.display || 'block';
    el.appendChild(img);
    // P8 视觉 C: 加载失败时挂 fallback SVG(只兜底一次,避免循环 error)
    img.addEventListener('error', () => {
      if (img.__fellback) return;
      img.__fellback = true;
      img.src = pickFallback(img.dataset.origSrc || img.src);
      img.style.objectFit = 'cover';
    });
    // 同步 src/mode，并响应变化
    const sync = () => {
      const src = el.getAttribute('src') || '';
      const mode = el.getAttribute('mode') || 'aspectFill';
      if (img.src !== src && src) {
        img.__fellback = false;      // src 换了,重置 fallback 标志
        img.dataset.origSrc = src;
        img.src = src;
      }
      img.style.objectFit = modeToFit(mode);
      const lazy = el.getAttribute('lazy-load');
      img.loading = (lazy === 'false' ? 'eager' : 'lazy');
    };
    sync();
    new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ['src', 'mode', 'lazy-load'] });
  };

  const patchAll = (root) => {
    if (root.tagName === 'IMAGE') patchImage(root);
    root.querySelectorAll && root.querySelectorAll('image').forEach(patchImage);
  };

  // 初次 paint + 持续监听新节点
  const go = () => {
    patchAll(document);
    new MutationObserver(muts => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.nodeType === 1) patchAll(n);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go, { once: true });
  } else {
    go();
  }
}

// ============ <scroll-view scroll-x> 桌面增强（浏览器预览专用）============
// CSS 的 overflow-x: auto 在手机上点一下就能滑，但桌面浏览器默认：
//   - 鼠标滚轮只走 deltaY（垂直），不会转成横向
//   - 没法直接拖动卡片让容器滚（不像 swiper）
// 下面给所有 <scroll-view scroll-x> 加：
//   1) 滚轮 deltaY → 转成 scrollLeft，桌面用户感觉"自然"
//   2) 鼠标按住拖拽 → 跟手滑动，且拖拽距离 >5px 时拦截后续 click，避免误触发卡片 @tap
if (typeof window !== 'undefined') {
  const enhanceScrollX = (el) => {
    if (el.__sxEnhanced) return;
    el.__sxEnhanced = true;

    // 滚轮 → 横向
    el.addEventListener('wheel', (e) => {
      // 只有内容真的溢出时才接管
      if (el.scrollWidth <= el.clientWidth) return;
      // 用户已经按 shift 自己横滚，不重复处理
      if (e.shiftKey) return;
      // 优先用 deltaY（普通滚轮），如果 deltaX 已经有就用它
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (dx === 0) return;
      el.scrollLeft += dx;
      e.preventDefault();
    }, { passive: false });

    // 拖拽 → 跟手
    let dragging = false, startX = 0, startScroll = 0, moved = 0;
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      moved = 0;
      el.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = startScroll - dx;
    });
    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = '';
    });
    // 拖拽 >5px 后的 click 被拦掉，避免误触卡片
    el.addEventListener('click', (e) => {
      if (moved > 5) { e.stopPropagation(); e.preventDefault(); moved = 0; }
    }, true);
  };

  const scanSx = (root) => {
    if (root.tagName === 'SCROLL-VIEW' && root.hasAttribute('scroll-x')) enhanceScrollX(root);
    root.querySelectorAll && root.querySelectorAll('scroll-view[scroll-x]').forEach(enhanceScrollX);
  };

  // 初次 + 持续监听
  const startSx = () => {
    scanSx(document);
    new MutationObserver(muts => {
      for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) scanSx(n);
    }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSx, { once: true });
  } else {
    startSx();
  }
}

const app = createApp(SiteShell);
app.use(createPinia());
app.use(router);

// P8 W2-5: 前端错误上报 — 静默,不让上报二次错
import('@cloud-farm/api-client').then(({ reportError }) => {
  app.config.errorHandler = (err, _instance, info) => {
    const e = err;
    // eslint-disable-next-line no-console
    console.error('[Vue errorHandler]', info, e);
    reportError({
      source: 'miniapp',
      message: `${e?.message || String(err)} @ ${info}`,
      stack: e?.stack || '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 280) : '',
    });
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (ev) => {
      const reason = ev.reason;
      const message = typeof reason === 'string' ? reason : reason?.message || 'unhandledrejection';
      reportError({
        source: 'miniapp',
        message,
        stack: reason?.stack || '',
        url: window.location.href,
        userAgent: navigator.userAgent.slice(0, 280),
      });
    });
    window.addEventListener('error', (ev) => {
      reportError({
        source: 'miniapp',
        message: ev.message || 'window.error',
        stack: ev.error?.stack || '',
        url: ev.filename || window.location.href,
        userAgent: navigator.userAgent.slice(0, 280),
      });
    });
  }
});

app.mount('#app');
