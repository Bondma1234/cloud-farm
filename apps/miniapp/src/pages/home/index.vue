<template>
  <view class="page">
    <!-- 顶部问候(U1a 重设计:装饰背景 + 层次) -->
    <view class="hero">
      <!-- 装饰元素:漂浮的叶子 / 太阳 / 云 -->
      <view class="deco deco-sun" />
      <view class="deco deco-leaf1">🌿</view>
      <view class="deco deco-leaf2">🍃</view>
      <view class="deco deco-cloud">☁️</view>
      <view class="hero-content">
        <text class="hello">你好,{{ user.nickname }} 👋</text>
        <text class="sub">{{ heroSub }}</text>
      </view>
      <view class="hero-card">
        <view class="stat">
          <text class="stat-num" v-if="plantedDays">第 {{ plantedDays }} 天</text>
          <text class="stat-num" v-else>欢迎</text>
          <text class="stat-label">{{ plantedDays ? joinedDate : '注册后开始种地' }}</text>
        </view>
        <view class="divider" />
        <view class="stat">
          <text class="stat-num">{{ season.icon }} {{ season.season }}</text>
          <text class="stat-label">{{ season.tip }}</text>
        </view>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="quick-grid">
      <view class="quick-item" @tap="go('/pages/packages/index')">
        <text class="ico">🌱</text>
        <text>认养地</text>
      </view>
      <view class="quick-item" @tap="go('/pages/my-plot/index')">
        <text class="ico">📹</text>
        <text>我的田</text>
      </view>
      <view class="quick-item" @tap="go('/pages/live/index')">
        <text class="ico">🎥</text>
        <text>直播</text>
      </view>
      <view class="quick-item" @tap="go('/pages/profile/index')">
        <text class="ico">🛒</text>
        <text>农产品</text>
      </view>
    </view>

    <!-- U1b: 我的田园数据卡(登录后显示) -->
    <view v-if="isLoggedIn" class="mygarden" @tap="go('/pages/my-plot/index')">
      <view class="mg-bg" />
      <view class="mg-head">
        <text class="mg-t">🌾 我的田园</text>
        <text class="mg-more">进我的田 ›</text>
      </view>
      <view class="mg-stats">
        <view class="mg-stat">
          <text class="mg-n">{{ growingDisplay }}</text>
          <text class="mg-l">认养中</text>
        </view>
        <view class="mg-stat">
          <text class="mg-n">{{ daysDisplay }}</text>
          <text class="mg-l">种植天数</text>
        </view>
        <view class="mg-stat">
          <text class="mg-n">{{ orderDisplay }}</text>
          <text class="mg-l">总订单</text>
        </view>
      </view>
    </view>

    <!-- 热门套餐 -->
    <view class="section">
      <view class="sec-head">
        <text class="sec-title">精选认养</text>
        <text class="sec-more" @tap="go('/pages/packages/index')">全部 ›</text>
      </view>
      <!-- P8 视觉 D: 拉数据时骨架屏占位,不再白屏 -->
      <Skeleton v-if="pkgStore.loading && !packages.length" type="card" :count="3" />
      <view v-else class="h-scroll-wrap">
      <scroll-view scroll-x class="h-scroll">
        <view class="pkg-card" v-for="p in packages" :key="p.id" @tap="goDetail(p.id)">
          <image :src="p.cover" mode="aspectFill" class="pkg-cover" />
          <view class="pkg-tag">{{ p.tag }}</view>
          <view class="pkg-body">
            <text class="pkg-name">{{ p.name }}</text>
            <text class="pkg-desc">{{ p.highlights[0] }} · {{ p.highlights[1] }}</text>
            <view class="pkg-foot">
              <text class="price"><text class="price-s">¥</text>{{ p.price }}</text>
              <text class="price-u">/ 年</text>
            </view>
          </view>
        </view>
      </scroll-view>
      </view>
    </view>

    <!-- 正在直播 -->
    <view class="section">
      <view class="sec-head">
        <text class="sec-title">正在直播</text>
        <text class="sec-more" @tap="go('/pages/live/index')">更多 ›</text>
      </view>
      <view class="live-grid">
        <view class="live-card" v-for="l in liveRooms" :key="l.id" @tap="goLive(l.id)">
          <image :src="l.cover" mode="aspectFill" class="live-cover" />
          <view class="live-badge" v-if="l.live">● LIVE</view>
          <view class="live-viewers">👀 {{ l.viewers }}</view>
          <text class="live-title">{{ l.title }}</text>
        </view>
      </view>
    </view>

    <!-- 田园动态 -->
    <view class="section">
      <view class="sec-head">
        <text class="sec-title">田园动态</text>
        <text class="sec-more" @tap="go('/pages/journal/index')">全部 ›</text>
      </view>
      <view class="feed">
        <view class="feed-item" v-for="f in feedPreview" :key="f.id" @tap="go('/pages/journal/index')">
          <text class="feed-ico">{{ f.icon }}</text>
          <view class="feed-body">
            <text class="feed-title">{{ f.title }}</text>
            <text class="feed-time">{{ f.at }} · {{ f.summary }}</text>
          </view>
        </view>
      </view>
    </view>

    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { LIVE_ROOMS, JOURNAL_ENTRIES, useAppStore } from '../../stores/mock';
import { usePackageStore } from '../../stores/packages';
import { useOrderStore } from '../../stores/orders';
import { getCurrentSeason, getPlantedDays, formatJoinedDate } from '../../utils/season';
import { useCountUp } from '../../utils/useCountUp';
import Skeleton from '../../components/Skeleton.vue';

const store = useAppStore();
const { user, isLoggedIn } = storeToRefs(store);

// P4: 套餐走 store(后端真 API + mock 兜底), 不再直接 import PACKAGES
const pkgStore = usePackageStore();
const { list: packages } = storeToRefs(pkgStore);

// U1b: 我的田园数据卡
const orderStore = useOrderStore();
const orderCount = computed(() => orderStore.list.length);
const growingCount = computed(() => orderStore.list.filter(o => o.status === 'growing').length);

const liveRooms = LIVE_ROOMS.filter(l => l.live);
// home 页只显示最近 3 条，全部走 /pages/journal
const feedPreview = JOURNAL_ENTRIES.slice(0, 3);

// === P8 视觉 A:替换硬编码"第 49 天 / 河南·周口 22° 多云" ===
const plantedDays = computed(() => getPlantedDays(user.value?.createdAt));
const joinedDate = computed(() => formatJoinedDate(user.value?.createdAt));
const season = computed(() => getCurrentSeason());
const heroSub = computed(() => {
  if (plantedDays.value) return `你的田园第 ${plantedDays.value} 天 · ${season.value.season}季种植`;
  return `${season.value.season}季正适合种植 · 选块田一起开始`;
});

// U3a: count-up 滚动(放在 plantedDays 之后,避免 TDZ)
const growingDisplay = useCountUp(() => growingCount.value);
const orderDisplay = useCountUp(() => orderCount.value);
const daysDisplay = useCountUp(() => plantedDays.value || 0);

const go = url => Taro.navigateTo({ url }).catch(() => Taro.switchTab({ url }).catch(() => {}));
const goDetail = id => Taro.navigateTo({ url: `/pages/package-detail/index?id=${id}` });
const goLive = id => Taro.navigateTo({ url: `/pages/live/index?id=${id}` });

onMounted(async () => {
  // 拉真套餐
  pkgStore.fetch();
  // 拉真用户 createdAt(没登录就静默跳过)
  await store.bootstrap?.();
  // 登录了就拉订单(给"我的田园"数据卡)
  if (store.isLoggedIn) orderStore.fetch();
});
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; }

.hero {
  background: linear-gradient(135deg, #56B383 0%, #4CA777 45%, #2E7D32 100%);
  padding: 28px 20px 56px;
  color: #fff;
  position: relative;
  overflow: hidden;
}
/* 径向高光,增加层次 */
.hero::before {
  content: '';
  position: absolute; top: -40%; right: -20%;
  width: 280px; height: 280px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%);
  pointer-events: none;
}
/* 装饰 */
.deco { position: absolute; pointer-events: none; user-select: none; }
.deco-sun {
  top: -30px; right: -30px; width: 110px; height: 110px; border-radius: 50%;
  background: radial-gradient(circle, rgba(244,185,66,0.5) 0%, rgba(244,185,66,0) 70%);
}
.deco-leaf1 { top: 14px; right: 18px; font-size: 26px; opacity: 0.5; animation: float1 5s ease-in-out infinite; }
.deco-leaf2 { top: 54px; right: 64px; font-size: 18px; opacity: 0.4; animation: float2 6s ease-in-out infinite; }
.deco-cloud { top: 22px; right: 110px; font-size: 22px; opacity: 0.35; animation: drift 8s ease-in-out infinite; }
@keyframes float1 { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-8px) rotate(8deg); } }
@keyframes float2 { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(6px) rotate(-6deg); } }
@keyframes drift  { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-12px); } }

.hero-content { display: flex; flex-direction: column; gap: 5px; position: relative; z-index: 1; }
.hello { font-size: 23px; font-weight: 700; letter-spacing: 0.5px; text-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.sub { font-size: 14px; opacity: 0.92; }
.hero-card {
  position: absolute; left: 20px; right: 20px; bottom: -32px; z-index: 2;
  background: #fff; border-radius: 16px; box-shadow: var(--shadow-md);
  display: flex; padding: 16px; gap: 8px;
}
.hero-card .stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-num { font-size: 22px; font-weight: 700; color: var(--color-primary-dark); }
.stat-label { font-size: 12px; color: var(--color-text-mute); }
.divider { width: 1px; background: var(--color-divider); margin: 6px 0; }

.quick-grid {
  margin: 56px 16px 0;
  background: #fff; border-radius: 16px; padding: 18px 8px;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
  box-shadow: var(--shadow-sm);
}
.quick-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-size: 13px;
}
.quick-item .ico {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--color-primary-light);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
}

/* U1b: 我的田园数据卡 */
.mygarden {
  margin: 16px 16px 0; border-radius: 16px; padding: 16px 18px;
  background: linear-gradient(120deg, #2E7D32 0%, #4CA777 100%);
  color: #fff; position: relative; overflow: hidden;
  box-shadow: 0 6px 18px rgba(46,125,50,0.25);
}
.mg-bg {
  position: absolute; right: -30px; bottom: -40px;
  width: 140px; height: 140px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%);
  pointer-events: none;
}
.mg-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; position: relative; z-index: 1; }
.mg-t { font-size: 16px; font-weight: 700; }
.mg-more { font-size: 12px; opacity: 0.85; }
.mg-stats { display: flex; position: relative; z-index: 1; }
.mg-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.mg-n { font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; }
.mg-l { font-size: 11px; opacity: 0.85; }

.section { margin: 20px 16px 0; }
.sec-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.sec-title { font-size: 17px; font-weight: 600; }
.sec-more { font-size: 13px; color: var(--color-text-mute); }

.h-scroll { white-space: nowrap; }
.pkg-card {
  display: inline-block; width: 240px; background: #fff;
  border-radius: 14px; overflow: hidden; margin-right: 12px;
  box-shadow: var(--shadow-sm); white-space: normal; position: relative;
  vertical-align: top;
}
.pkg-cover { width: 240px; height: 140px; display: block; }
.pkg-tag {
  position: absolute; top: 10px; left: 10px; background: var(--color-accent);
  color: #8D6E00; font-size: 11px; padding: 2px 8px; border-radius: 999px; font-weight: 600;
}
.pkg-body { padding: 12px; }
.pkg-name { font-size: 15px; font-weight: 600; display: block; }
.pkg-desc { font-size: 12px; color: var(--color-text-mute); margin-top: 4px; display: block; }
.pkg-foot { margin-top: 10px; display: flex; align-items: baseline; }
.price { font-size: 20px; font-weight: 700; color: var(--color-danger); }
.price-s { font-size: 13px; }
.price-u { font-size: 11px; color: var(--color-text-mute); margin-left: 4px; }

.live-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.live-card { background: #fff; border-radius: 12px; overflow: hidden; position: relative; }
.live-cover { width: 100%; height: 96px; display: block; }
.live-badge {
  position: absolute; top: 8px; left: 8px;
  background: var(--color-danger); color: #fff; font-size: 11px;
  padding: 2px 6px; border-radius: 4px; font-weight: 600;
}
.live-viewers {
  position: absolute; top: 8px; right: 8px;
  background: rgba(0,0,0,0.5); color: #fff; font-size: 11px;
  padding: 2px 6px; border-radius: 4px;
}
.live-title { display: block; padding: 8px 10px; font-size: 13px; }

.feed { background: #fff; border-radius: 12px; padding: 4px 14px; box-shadow: var(--shadow-sm); }
.feed-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--color-divider); }
.feed-item:last-child { border-bottom: none; }
.feed-ico { font-size: 24px; width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; }
.feed-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.feed-title { font-size: 14px; font-weight: 500; }
.feed-time { font-size: 12px; color: var(--color-text-mute); }
</style>
