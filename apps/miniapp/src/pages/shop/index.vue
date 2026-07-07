<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="head">
      <view class="head-top">
        <text class="bar-back" @tap="back">‹</text>
        <text class="title">农产品商城</text>
        <text class="bar-r" @tap="goCart">🛒</text>
      </view>
      <text class="sub">农场当季直供 · 冷链锁鲜 · 产地直发</text>
    </view>

    <!-- 类目筛选 -->
    <scroll-view scroll-x class="filter">
      <view
        v-for="c in CATS"
        :key="c.key"
        :class="['ftab', active === c.key && 'active']"
        @tap="switchCat(c.key)"
      >
        <text class="ftab-ic">{{ c.icon }}</text>
        <text class="ftab-l">{{ c.label }}</text>
      </view>
    </scroll-view>

    <!-- 加载 -->
    <Skeleton v-if="store.loading && !list.length" type="card" :count="4" />

    <!-- 错误 -->
    <EmptyState
      v-else-if="store.error && !list.length"
      type="error"
      :title="store.error"
      subtitle="点下面重试"
    >
      <view class="empty-btn" @tap="reload">重试</view>
    </EmptyState>

    <!-- 商品网格 -->
    <view v-else-if="list.length" class="grid cf-stagger" :key="active">
      <view class="g-card" v-for="g in list" :key="g.id" @tap="goDetail(g.id)">
        <view class="g-cover-wrap">
          <image :src="g.cover" mode="aspectFill" class="g-cover" />
          <view v-if="g.coldChain" class="g-cold">❄ 冷链</view>
        </view>
        <view class="g-body">
          <text class="g-name">{{ g.name }}</text>
          <view class="g-tags">
            <text class="g-tag" v-for="t in g.tags.slice(0, 2)" :key="t">{{ t }}</text>
          </view>
          <view class="g-meta">
            <text class="g-rating">★ {{ g.rating.toFixed(1) }}</text>
            <text class="g-sales">已售 {{ g.sales }}</text>
          </view>
          <view class="g-foot">
            <text class="g-price"><text class="g-price-s">¥</text>{{ g.minPrice }}<text class="g-price-q">起</text></text>
            <view class="g-add" @tap.stop="quickView(g)">选规格</view>
          </view>
        </view>
      </view>
    </view>

    <EmptyState v-else type="order" title="这个分类暂时没有商品" subtitle="换个分类看看" />

    <view style="height: 90px" />

    <!-- 悬浮购物车 -->
    <view class="cart-fab" @tap="goCart">
      <text class="fab-ic">🛒</text>
      <view v-if="cart.count" class="fab-badge">{{ cart.count > 99 ? '99+' : cart.count }}</view>
    </view>
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useGoodsStore } from '../../stores/goods';
import { useCartStore } from '../../stores/cart';
import Skeleton from '../../components/Skeleton.vue';
import EmptyState from '../../components/EmptyState.vue';

const store = useGoodsStore();
const { list } = storeToRefs(store);
const cart = useCartStore();

const CATS = [
  { key: 'all', icon: '🛍', label: '全部' },
  { key: 'fresh', icon: '🥬', label: '鲜食' },
  { key: 'processed', icon: '🍿', label: '深加工' },
  { key: 'box', icon: '📦', label: '套餐箱' },
  { key: 'around', icon: '🎁', label: '周边' },
];
const active = ref('all');

const switchCat = (k) => {
  active.value = k;
  store.fetch(k);
};
const reload = () => store.fetch(active.value, { force: true });

const back = () => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/home/index' }));
const goDetail = (id) => Taro.navigateTo({ url: `/pages/goods-detail/index?id=${id}` });
const quickView = (g) => goDetail(g.id); // 选规格统一进详情页选 SKU
const goCart = () => Taro.navigateTo({ url: '/pages/cart/index' });

onMounted(() => store.fetch('all'));
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; background: var(--color-surface-alt); min-height: 100vh; }

.head {
  background: linear-gradient(135deg, #4CA777 0%, #2E7D32 100%);
  color: #fff; padding: 14px 16px 20px;
}
.head-top { display: flex; align-items: center; justify-content: space-between; }
.bar-back { font-size: 24px; width: 28px; }
.title { font-size: var(--fs-xl); font-weight: 700; }
.bar-r { font-size: 20px; width: 28px; text-align: right; }
.sub { font-size: var(--fs-sm); opacity: 0.9; margin-top: 6px; display: block; }

.filter { white-space: nowrap; padding: 12px 12px 0; background: #fff; border-bottom: 1px solid var(--color-divider); }
.ftab {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 14px; margin-right: 8px;
  background: var(--color-surface-alt); border-radius: var(--radius-pill);
  font-size: var(--fs-sm); color: var(--color-text-sub);
  transition: background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out);
}
.ftab.active { background: var(--color-primary); color: #fff; }
.ftab-ic { font-size: 14px; }

.grid {
  padding: 12px; display: grid; gap: 12px;
  grid-template-columns: 1fr 1fr;
}
@media (min-width: 720px) { .grid { grid-template-columns: 1fr 1fr 1fr; } }

.g-card {
  background: #fff; border-radius: var(--radius-lg); overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.g-cover-wrap { position: relative; }
.g-cover { width: 100%; height: 140px; display: block; background: var(--color-primary-light); }
.g-cold {
  position: absolute; top: 8px; left: 8px;
  background: rgba(31,95,158,0.85); color: #fff;
  font-size: var(--fs-xs); padding: 2px 8px; border-radius: var(--radius-pill);
}
.g-body { padding: 10px 12px 12px; }
.g-name { font-size: var(--fs-base); font-weight: 600; display: block; }
.g-tags { display: flex; gap: 4px; margin-top: 6px; min-height: 18px; }
.g-tag {
  font-size: var(--fs-xs); background: var(--color-primary-light); color: var(--color-primary-dark);
  padding: 1px 6px; border-radius: 4px;
}
.g-meta { display: flex; gap: 10px; margin-top: 6px; }
.g-rating { font-size: var(--fs-xs); color: var(--color-accent); font-weight: 600; }
.g-sales { font-size: var(--fs-xs); color: var(--color-text-mute); }
.g-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.g-price { font-size: var(--fs-xl); font-weight: 700; color: var(--color-danger); }
.g-price-s { font-size: var(--fs-sm); }
.g-price-q { font-size: var(--fs-xs); font-weight: 400; color: var(--color-text-mute); margin-left: 2px; }
.g-add {
  background: var(--color-primary); color: #fff;
  font-size: var(--fs-xs); font-weight: 600; padding: 5px 12px; border-radius: var(--radius-pill);
}

.empty-btn {
  background: var(--color-primary); color: #fff;
  padding: 10px 28px; border-radius: var(--radius-pill); font-size: var(--fs-base); font-weight: 600;
}

.cart-fab {
  position: fixed; right: 16px; bottom: calc(24px + env(safe-area-inset-bottom, 0));
  width: 52px; height: 52px; border-radius: 50%;
  background: linear-gradient(135deg, #4CA777, #2E7D32);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 18px rgba(46,125,50,0.4); z-index: 50;
}
.fab-ic { font-size: 24px; }
.fab-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 18px; height: 18px; padding: 0 5px;
  background: var(--color-danger); color: #fff;
  font-size: var(--fs-xs); font-weight: 700;
  border-radius: 9px; display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--color-surface-alt);
}
</style>
