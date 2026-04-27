<template>
  <view class="page">
    <!-- 顶部问候 -->
    <view class="hero">
      <view class="hero-content">
        <text class="hello">你好，{{ user.nickname }} 👋</text>
        <text class="sub">今天是你的田园第 49 天</text>
      </view>
      <view class="hero-card">
        <view class="stat">
          <text class="stat-num">22°</text>
          <text class="stat-label">河南·周口</text>
        </view>
        <view class="divider" />
        <view class="stat">
          <text class="stat-num">多云</text>
          <text class="stat-label">适宜生长</text>
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

    <!-- 热门套餐 -->
    <view class="section">
      <view class="sec-head">
        <text class="sec-title">精选认养</text>
        <text class="sec-more" @tap="go('/pages/packages/index')">全部 ›</text>
      </view>
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
      </view>
      <view class="feed">
        <view class="feed-item">
          <text class="feed-ico">🌸</text>
          <view class="feed-body">
            <text class="feed-title">你的小番茄开花啦</text>
            <text class="feed-time">2 小时前 · 点击查看照片</text>
          </view>
        </view>
        <view class="feed-item">
          <text class="feed-ico">💧</text>
          <view class="feed-body">
            <text class="feed-title">农技员已完成今日浇水</text>
            <text class="feed-time">今天 08:12</text>
          </view>
        </view>
        <view class="feed-item">
          <text class="feed-ico">📦</text>
          <view class="feed-body">
            <text class="feed-title">你的第一批蜜薯已发货</text>
            <text class="feed-time">昨天 17:30 · 中通快递</text>
          </view>
        </view>
      </view>
    </view>

    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { PACKAGES, LIVE_ROOMS, useAppStore } from '../../stores/mock';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const { user } = storeToRefs(store);
const packages = PACKAGES;
const liveRooms = LIVE_ROOMS.filter(l => l.live);

const go = url => Taro.navigateTo({ url }).catch(() => Taro.switchTab({ url }).catch(() => {}));
const goDetail = id => Taro.navigateTo({ url: `/pages/package-detail/index?id=${id}` });
const goLive = id => Taro.navigateTo({ url: `/pages/live/index?id=${id}` });
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; }

.hero {
  background: linear-gradient(135deg, #4CA777 0%, #2E7D32 100%);
  padding: 24px 20px 56px;
  color: #fff;
  position: relative;
}
.hero-content { display: flex; flex-direction: column; gap: 4px; }
.hello { font-size: 22px; font-weight: 600; }
.sub { font-size: 14px; opacity: 0.88; }
.hero-card {
  position: absolute; left: 20px; right: 20px; bottom: -32px;
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
