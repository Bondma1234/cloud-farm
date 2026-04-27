// ============ 图片资源中心 ============
// 所有 mock 图片在这里统一管理。后续接入后台后，只需把这里的路径
// 换成 CDN URL（如 https://cdn.cloud-farm.com/xxx.jpg）即可，
// 前端组件无需任何修改。

const BASE = '/images';

// 套餐封面
export const PKG_COVER = {
  basic:  `${BASE}/pkg-basic.jpg`,
  pro:    `${BASE}/pkg-pro.jpg`,
  family: `${BASE}/pkg-family.jpg`
};

// 作物
export const CROP = {
  tomato:      `${BASE}/crop-tomato.jpg`,
  strawberry:  `${BASE}/crop-strawberry.jpg`,
  sweetpotato: `${BASE}/crop-sweetpotato.jpg`,
  pumpkin:     `${BASE}/crop-pumpkin.jpg`
};

// 田地 / 农场
export const FARM = {
  hero:     `${BASE}/farm-hero.jpg`,
  field:    `${BASE}/farm-field.jpg`,
  detail1:  `${BASE}/farm-detail-1.jpg`,
  detail2:  `${BASE}/farm-detail-2.jpg`,
  detail3:  `${BASE}/farm-detail-3.jpg`
};

// 直播间
export const LIVE = {
  harvest:    `${BASE}/live-harvest.jpg`,
  greenhouse: `${BASE}/live-greenhouse.jpg`,
  packing:    `${BASE}/live-packing.jpg`
};

// 其他
export const MISC = {
  plotSnapshot: `${BASE}/plot-snapshot.jpg`,
  orderPkg:     `${BASE}/order-pkg.jpg`
};

// ============ 图片兜底 ============
// 图片加载失败时，展示这个带渐变 + emoji 的 SVG data URL。
// 使用：<image :src="pic" @error="(e)=>e.target.src = fallbackImage('🌱','green')" />
const PALETTES = {
  green:  ['#4CA777', '#2E7D32'],
  amber:  ['#F2C94C', '#E2A93A'],
  red:    ['#E57373', '#C0392B'],
  blue:   ['#64B5F6', '#1F5F9E'],
  purple: ['#BA68C8', '#7B1FA2'],
  mud:    ['#A1887F', '#5D4037']
};

export const fallbackImage = (emoji = '🌾', palette = 'green') => {
  const [c1, c2] = PALETTES[palette] || PALETTES.green;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>` +
      `</linearGradient></defs>` +
      `<rect width="400" height="300" fill="url(#g)"/>` +
      `<text x="200" y="180" text-anchor="middle" font-size="120" opacity="0.85">${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// 常用 fallback 预生成（懒加载用，避免每次渲染重新算）
export const FB = {
  pkg:  fallbackImage('🌱', 'green'),
  crop: fallbackImage('🍅', 'red'),
  live: fallbackImage('📹', 'green'),
  farm: fallbackImage('🌾', 'green'),
  ship: fallbackImage('📦', 'mud')
};
