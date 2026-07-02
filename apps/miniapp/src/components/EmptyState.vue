<!--
  P8 视觉 F: 通用空态插画组件

  用法:
    <EmptyState type="plot" title="还没有种植中的地块" subtitle="先去认养一块田吧">
      <view class="empty-btn" @tap="goPackages">去认养</view>
    </EmptyState>

  type 决定 SVG 插画(都是内联 SVG,无外网请求):
    plot    种子破土 - 用于"未认养地块"
    order   购物袋   - 用于"无订单"
    cmd     ⚙️ 工单 - 用于"无指令工单"
    feed    📰       - 用于"无动态"
    photo   📷       - 用于"无照片"
    crop    🌾 作物  - 用于"无作物"
    addr    📍 定位  - 用于"无收货地址"
    search  🔍       - 用于"搜不到"
    error   ⚠️       - 用于"出错了"
-->
<template>
  <view class="empty-state">
    <view class="empty-illust" v-html="svg" />
    <text class="empty-t" v-if="title">{{ title }}</text>
    <text class="empty-s" v-if="subtitle">{{ subtitle }}</text>
    <view class="empty-slot">
      <slot />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  type: { type: String, default: 'plot' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' }
});

/* 简约田园风 SVG 插画;统一 160 x 120,白底配品牌色,emoji 顶部 + 装饰元素 */
const ILLUSTS = {
  plot: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="105" rx="60" ry="6" fill="#E8F4EA"/>
      <path d="M 30 95 Q 80 60, 130 95 L 130 105 L 30 105 Z" fill="#A1887F" opacity="0.6"/>
      <circle cx="60" cy="60" r="18" fill="#4CA777" opacity="0.18"/>
      <text x="80" y="78" text-anchor="middle" font-size="42">🌱</text>
      <circle cx="125" cy="40" r="3" fill="#F4B942"/>
      <circle cx="35" cy="50" r="2" fill="#F4B942"/>
    </svg>`,
  order: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="105" rx="55" ry="5" fill="#E8F4EA"/>
      <rect x="50" y="50" width="60" height="50" rx="6" fill="#4CA777" opacity="0.12"/>
      <text x="80" y="88" text-anchor="middle" font-size="36">📦</text>
      <path d="M 65 50 Q 80 38, 95 50" stroke="#4CA777" stroke-width="2.5" fill="none"/>
    </svg>`,
  cmd: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="105" rx="50" ry="5" fill="#E8F4EA"/>
      <circle cx="80" cy="60" r="32" fill="#4CA777" opacity="0.12"/>
      <text x="80" y="76" text-anchor="middle" font-size="36">📋</text>
    </svg>`,
  feed: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="105" rx="50" ry="5" fill="#E8F4EA"/>
      <rect x="48" y="38" width="64" height="56" rx="4" fill="#FFF" stroke="#4CA777" stroke-opacity="0.3" stroke-width="2"/>
      <line x1="55" y1="52" x2="105" y2="52" stroke="#4CA777" stroke-width="2" opacity="0.4"/>
      <line x1="55" y1="62" x2="95"  y2="62" stroke="#4CA777" stroke-width="2" opacity="0.3"/>
      <line x1="55" y1="72" x2="100" y2="72" stroke="#4CA777" stroke-width="2" opacity="0.3"/>
      <line x1="55" y1="82" x2="85"  y2="82" stroke="#4CA777" stroke-width="2" opacity="0.3"/>
    </svg>`,
  photo: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="105" rx="50" ry="5" fill="#E8F4EA"/>
      <rect x="42" y="42" width="76" height="56" rx="6" fill="#4CA777" opacity="0.12"/>
      <text x="80" y="82" text-anchor="middle" font-size="34">📷</text>
    </svg>`,
  crop: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="105" rx="50" ry="5" fill="#E8F4EA"/>
      <text x="80" y="78" text-anchor="middle" font-size="42">🌾</text>
    </svg>`,
  addr: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="105" rx="50" ry="5" fill="#E8F4EA"/>
      <circle cx="80" cy="56" r="30" fill="#4CA777" opacity="0.12"/>
      <text x="80" y="74" text-anchor="middle" font-size="38">📍</text>
    </svg>`,
  search: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="105" rx="50" ry="5" fill="#E8F4EA"/>
      <circle cx="78" cy="58" r="22" fill="none" stroke="#4CA777" stroke-width="3" opacity="0.5"/>
      <line x1="94" y1="74" x2="106" y2="86" stroke="#4CA777" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
    </svg>`,
  error: `
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="105" rx="50" ry="5" fill="#FFE0E0"/>
      <circle cx="80" cy="58" r="28" fill="#E57373" opacity="0.18"/>
      <text x="80" y="74" text-anchor="middle" font-size="40">⚠️</text>
    </svg>`
};

const svg = computed(() => ILLUSTS[props.type] || ILLUSTS.plot);
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 56px 24px;
  gap: 6px;
}
.empty-illust {
  width: 160px; height: 120px;
  margin-bottom: 8px;
  display: flex; align-items: center; justify-content: center;
  :deep(svg) { width: 100%; height: 100%; }
}
.empty-t { font-size: 15px; font-weight: 600; color: var(--color-text); }
.empty-s { font-size: 13px; color: var(--color-text-mute); }
.empty-slot { margin-top: 14px; }
</style>
