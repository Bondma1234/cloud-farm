<template>
  <view class="page">
    <view class="bar">
      <text class="bar-back" @tap="back">‹</text>
      <text class="bar-t">购物车</text>
      <text class="bar-r" @tap="toggleEdit">{{ editing ? '完成' : '管理' }}</text>
    </view>

    <!-- 空态 -->
    <EmptyState v-if="cart.isEmpty" type="order" title="购物车还是空的" subtitle="去商城逛逛,挑点当季好物">
      <view class="empty-btn" @tap="goShop">去逛商城</view>
    </EmptyState>

    <template v-else>
      <view class="list cf-stagger">
        <view class="item" v-for="it in cart.items" :key="it.skuId">
          <view :class="['check', checked.has(it.skuId) && 'on']" @tap="toggle(it.skuId)">
            <text v-if="checked.has(it.skuId)">✓</text>
          </view>
          <image :src="it.cover" mode="aspectFill" class="item-cover" />
          <view class="item-info">
            <text class="item-name">{{ it.goodsName }}</text>
            <text class="item-spec">{{ it.spec }}<text v-if="it.coldChain" class="item-cold"> · ❄冷链</text></text>
            <view class="item-foot">
              <text class="item-price"><text class="ip-s">¥</text>{{ it.price }}</text>
              <view class="stepper">
                <view :class="['step', it.qty <= 1 && 'dis']" @tap="cart.setQty(it.skuId, it.qty - 1)">−</view>
                <text class="qty">{{ it.qty }}</text>
                <view class="step" @tap="cart.setQty(it.skuId, it.qty + 1)">＋</view>
              </view>
            </view>
          </view>
          <text v-if="editing" class="item-del" @tap="del(it)">🗑</text>
        </view>
      </view>
      <view style="height: 90px" />
    </template>

    <!-- 底部结算栏 -->
    <view v-if="!cart.isEmpty" class="footer">
      <view class="f-all" @tap="toggleAll">
        <view :class="['check', allChecked && 'on']"><text v-if="allChecked">✓</text></view>
        <text class="f-all-l">全选</text>
      </view>
      <view class="f-total">
        <text class="f-t-l">合计</text>
        <text class="f-t-v"><text class="ft-s">¥</text>{{ checkedTotal }}</text>
      </view>
      <view :class="['f-btn', !checkedCount && 'dis']" @tap="checkout">
        {{ editing ? `删除(${checkedCount})` : `去结算(${checkedCount})` }}
      </view>
    </view>
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { ref, computed } from 'vue';
import { useCartStore } from '../../stores/cart';
import EmptyState from '../../components/EmptyState.vue';

const cart = useCartStore();
const editing = ref(false);

// 选中集合,默认全选
const checked = ref(new Set(cart.items.map((it) => it.skuId)));

const checkedItems = computed(() => cart.items.filter((it) => checked.value.has(it.skuId)));
const checkedCount = computed(() => checkedItems.value.reduce((n, it) => n + it.qty, 0));
const checkedTotal = computed(() => checkedItems.value.reduce((n, it) => n + it.price * it.qty, 0));
const allChecked = computed(() => cart.items.length > 0 && checked.value.size === cart.items.length);

const toggle = (skuId) => {
  const next = new Set(checked.value);
  if (next.has(skuId)) next.delete(skuId); else next.add(skuId);
  checked.value = next;
};
const toggleAll = () => {
  checked.value = allChecked.value ? new Set() : new Set(cart.items.map((it) => it.skuId));
};
const toggleEdit = () => { editing.value = !editing.value; };

const del = (it) => {
  Taro.showModal({
    title: '删除商品',
    content: `确定移除「${it.goodsName} · ${it.spec}」?`,
    success: ({ confirm }) => {
      if (!confirm) return;
      cart.remove(it.skuId);
      const next = new Set(checked.value); next.delete(it.skuId); checked.value = next;
    },
  });
};

const checkout = () => {
  if (!checkedCount.value) return Taro.showToast({ title: '请先选择商品', icon: 'none' });
  if (editing.value) {
    // 管理模式下按钮变"删除选中"
    Taro.showModal({
      title: '删除选中', content: `确定移除选中的 ${checked.value.size} 种商品?`,
      success: ({ confirm }) => {
        if (!confirm) return;
        checkedItems.value.forEach((it) => cart.remove(it.skuId));
        checked.value = new Set();
      },
    });
    return;
  }
  // 把选中的 skuId 透传给商城结算页
  const ids = [...checked.value].join(',');
  Taro.navigateTo({ url: `/pages/shop-checkout/index?skus=${encodeURIComponent(ids)}` });
};

const back = () => Taro.navigateBack().catch(() => Taro.navigateTo({ url: '/pages/shop/index' }));
const goShop = () => Taro.navigateTo({ url: '/pages/shop/index' }).catch(() => Taro.navigateBack());
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: var(--color-surface-alt); padding-bottom: 24px; }

.bar { display: flex; align-items: center; padding: 12px 16px; background: #fff; border-bottom: 1px solid var(--color-divider); }
.bar-back { font-size: 24px; width: 40px; }
.bar-t { flex: 1; text-align: center; font-size: var(--fs-lg); font-weight: 600; }
.bar-r { width: 40px; text-align: right; font-size: var(--fs-md); color: var(--color-primary-dark); }

.list { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.item {
  background: #fff; border-radius: var(--radius-lg); padding: 12px;
  display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-sm);
}
.check {
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
  border: 1.5px solid var(--color-border); color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 12px;
  transition: background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.check.on { background: var(--color-primary); border-color: var(--color-primary); }
.item-cover { width: 72px; height: 72px; border-radius: var(--radius-md); flex-shrink: 0; background: var(--color-primary-light); }
.item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.item-name { font-size: var(--fs-base); font-weight: 500; }
.item-spec { font-size: var(--fs-sm); color: var(--color-text-mute); }
.item-cold { color: #1F5F9E; }
.item-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.item-price { font-size: var(--fs-lg); font-weight: 700; color: var(--color-danger); }
.ip-s { font-size: var(--fs-xs); }
.item-del { font-size: 18px; padding: 4px; }

.stepper { display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }
.step { width: 30px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--color-text-sub); background: var(--color-surface-alt); }
.step.dis { opacity: 0.4; }
.qty { width: 38px; text-align: center; font-size: var(--fs-md); font-weight: 600; }

.empty-btn { background: var(--color-primary); color: #fff; padding: 10px 28px; border-radius: var(--radius-pill); font-size: var(--fs-base); font-weight: 600; }

.footer {
  position: fixed; left: 0; right: 0; bottom: 0; background: #fff;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; padding-bottom: calc(10px + env(safe-area-inset-bottom, 0)); z-index: 100;
}
.f-all { display: flex; align-items: center; gap: 6px; }
.f-all-l { font-size: var(--fs-sm); color: var(--color-text-sub); }
.f-total { flex: 1; display: flex; align-items: baseline; gap: 4px; justify-content: flex-end; }
.f-t-l { font-size: var(--fs-sm); color: var(--color-text-sub); }
.f-t-v { font-size: var(--fs-xl); font-weight: 800; color: var(--color-danger); }
.ft-s { font-size: var(--fs-sm); }
.f-btn { background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff; padding: 11px 24px; border-radius: var(--radius-pill); font-weight: 700; font-size: var(--fs-base); }
.f-btn.dis { opacity: 0.5; }
</style>
