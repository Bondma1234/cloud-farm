<!--
  P8 视觉 D: 通用骨架屏组件

  用法:
    <Skeleton type="card" :count="3" />     <!-- 套餐 / 订单 等卡片列表 -->
    <Skeleton type="line" :count="5" />     <!-- 多条文字行 -->
    <Skeleton type="hero" />                <!-- home 首屏 hero -->
    <Skeleton type="grid" :count="4" />     <!-- 快捷入口网格 -->

  shimmer 动画从左到右扫过,模拟内容正在加载;在没有数据来之前占满空间,
  比"白屏 + 文字 '加载中...'"体感好得多。
-->
<template>
  <view class="skel-wrap">
    <!-- card: 大卡片(套餐/订单) -->
    <template v-if="type === 'card'">
      <view class="skel-card" v-for="i in count" :key="i">
        <view class="skel-cover skel-block" />
        <view class="skel-body">
          <view class="skel-line skel-block" style="width: 70%; height: 14px;" />
          <view class="skel-line skel-block" style="width: 50%; height: 11px; margin-top: 8px;" />
          <view class="skel-line skel-block" style="width: 35%; height: 18px; margin-top: 10px;" />
        </view>
      </view>
    </template>

    <!-- line: 列表行 -->
    <template v-else-if="type === 'line'">
      <view class="skel-line-row" v-for="i in count" :key="i">
        <view class="skel-circle skel-block" />
        <view class="skel-line-body">
          <view class="skel-line skel-block" style="width: 65%; height: 13px;" />
          <view class="skel-line skel-block" style="width: 40%; height: 11px; margin-top: 6px;" />
        </view>
      </view>
    </template>

    <!-- hero: home 顶部大块 -->
    <template v-else-if="type === 'hero'">
      <view class="skel-hero skel-block" />
      <view class="skel-hero-card">
        <view class="skel-block" style="width: 40%; height: 18px;" />
        <view class="skel-block" style="width: 40%; height: 18px; margin-top: 6px;" />
      </view>
    </template>

    <!-- grid: 4 列网格(home 快捷入口) -->
    <template v-else-if="type === 'grid'">
      <view class="skel-grid">
        <view class="skel-grid-item" v-for="i in count" :key="i">
          <view class="skel-circle skel-block" style="width: 48px; height: 48px;" />
          <view class="skel-line skel-block" style="width: 32px; height: 10px; margin-top: 8px;" />
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'card' },
  count: { type: Number, default: 3 }
});
</script>

<style lang="scss" scoped>
.skel-wrap { padding: 0; }

/* shimmer 基础 block - 灰底 + 滑动高光 */
.skel-block {
  background: linear-gradient(
    90deg,
    var(--color-divider) 0%,
    rgba(255, 255, 255, 0.85) 50%,
    var(--color-divider) 100%
  );
  background-size: 200% 100%;
  animation: skel-shimmer 1.4s linear infinite;
  border-radius: 6px;
}

@keyframes skel-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* card */
.skel-card {
  display: inline-block;
  width: 240px;
  margin: 0 12px 16px 16px;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  vertical-align: top;
}
.skel-cover { width: 100%; height: 140px; border-radius: 0; }
.skel-body { padding: 12px; }
.skel-line { display: block; }

/* line */
.skel-line-row {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-divider);
}
.skel-circle {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
}
.skel-line-body { flex: 1; display: flex; flex-direction: column; }

/* hero */
.skel-hero {
  width: 100%; height: 110px; border-radius: 0; margin: 0;
}
.skel-hero-card {
  margin: -32px 20px 0;
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* grid */
.skel-grid {
  margin: 16px;
  background: #fff;
  border-radius: 16px;
  padding: 18px 8px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  box-shadow: var(--shadow-sm);
}
.skel-grid-item {
  display: flex; flex-direction: column; align-items: center;
}
</style>
