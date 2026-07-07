<template>
  <view class="page" v-if="goods">
    <image :src="goods.cover" mode="aspectFill" class="cover" />

    <view class="head">
      <view class="price-row">
        <text class="price"><text class="price-s">¥</text>{{ curSku ? curSku.price : goods.minPrice }}</text>
        <text v-if="curSku && curSku.originalPrice" class="price-o">¥{{ curSku.originalPrice }}</text>
        <view v-if="goods.coldChain" class="cold">❄ 冷链发货</view>
      </view>
      <text class="name">{{ goods.name }}</text>
      <view class="meta">
        <text class="rating">★ {{ goods.rating.toFixed(1) }}</text>
        <text class="sales">已售 {{ goods.sales }}</text>
        <text class="origin">📍 {{ goods.origin }}</text>
      </view>
      <view class="tags">
        <text class="tag" v-for="t in goods.tags" :key="t">{{ t }}</text>
      </view>
    </view>

    <!-- 选规格 -->
    <view class="block">
      <text class="block-t">选择规格</text>
      <view class="spec-grid">
        <view
          v-for="s in goods.skus"
          :key="s.id"
          :class="['spec', curSkuId === s.id && 'on', s.stock <= 0 && 'sold']"
          @tap="pickSku(s)"
        >
          <text class="spec-name">{{ s.spec }}</text>
          <text class="spec-price">¥{{ s.price }}</text>
          <text v-if="s.stock <= 0" class="spec-sold">缺货</text>
        </view>
      </view>
    </view>

    <!-- 数量 -->
    <view class="block">
      <view class="qty-row">
        <text class="block-t">购买数量</text>
        <view class="stepper">
          <view :class="['step', qty <= 1 && 'dis']" @tap="dec">−</view>
          <text class="qty">{{ qty }}</text>
          <view class="step" @tap="inc">＋</view>
        </view>
      </view>
      <text v-if="curSku" class="stock-hint">库存 {{ curSku.stock }} 件</text>
    </view>

    <!-- 商品介绍 -->
    <view class="block">
      <text class="block-t">商品介绍</text>
      <text class="intro">{{ goods.intro }}</text>
      <image :src="goods.cover" mode="widthFix" class="intro-img" />
    </view>

    <view style="height: 90px" />

    <!-- 底部操作栏 -->
    <view class="footer">
      <view class="f-cart" @tap="goCart">
        <text class="f-cart-ic">🛒</text>
        <view v-if="cart.count" class="f-cart-badge">{{ cart.count }}</view>
        <text class="f-cart-l">购物车</text>
      </view>
      <view class="f-add" @tap="onAdd">加入购物车</view>
      <view class="f-buy" @tap="onBuyNow">立即购买</view>
    </view>
  </view>

  <view v-else class="loading">加载中…</view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { ref, computed, onMounted } from 'vue';
import { useGoodsStore } from '../../stores/goods';
import { useCartStore } from '../../stores/cart';
import { showSuccess } from '../../components/SuccessOverlay.vue';

const router = useRouter();
const store = useGoodsStore();
const cart = useCartStore();

const goods = ref(null);
const curSkuId = ref('');
const qty = ref(1);

const curSku = computed(() => goods.value?.skus.find((s) => s.id === curSkuId.value) || null);

const pickSku = (s) => {
  if (s.stock <= 0) return Taro.showToast({ title: '该规格暂时缺货', icon: 'none' });
  curSkuId.value = s.id;
  if (qty.value > s.stock) qty.value = s.stock;
};
const inc = () => {
  const max = curSku.value?.stock ?? 99;
  if (qty.value >= max) return Taro.showToast({ title: '不能再多啦', icon: 'none' });
  qty.value += 1;
};
const dec = () => { if (qty.value > 1) qty.value -= 1; };

function ensureSku() {
  if (!curSku.value) {
    Taro.showToast({ title: '请先选择规格', icon: 'none' });
    return false;
  }
  return true;
}

const onAdd = async () => {
  if (!ensureSku()) return;
  const r = cart.add(goods.value, curSku.value, qty.value);
  if (!r.ok) return Taro.showToast({ title: r.reason, icon: 'none' });
  await showSuccess({ title: '已加入购物车', emoji: '🛒', duration: 900 });
};

const onBuyNow = () => {
  if (!ensureSku()) return;
  cart.add(goods.value, curSku.value, qty.value);
  goCart();
};

const goCart = () => Taro.navigateTo({ url: '/pages/cart/index' });

onMounted(async () => {
  try {
    goods.value = await store.fetchOne(router.params.id);
    // 默认选第一个有货的规格
    const firstAvail = goods.value.skus.find((s) => s.stock > 0) || goods.value.skus[0];
    if (firstAvail) curSkuId.value = firstAvail.id;
  } catch (e) {
    Taro.showToast({ title: e?.message || '商品加载失败', icon: 'none' });
    setTimeout(() => Taro.navigateBack().catch(() => {}), 800);
  }
});
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; background: var(--color-surface-alt); }
.loading { padding: 120px 0; text-align: center; color: var(--color-text-mute); }

.cover { width: 100%; height: 300px; display: block; background: var(--color-primary-light); }

.head { background: #fff; padding: 16px; }
.price-row { display: flex; align-items: baseline; gap: 8px; }
.price { font-size: 30px; font-weight: 800; color: var(--color-danger); }
.price-s { font-size: var(--fs-base); }
.price-o { font-size: var(--fs-sm); color: var(--color-text-mute); text-decoration: line-through; }
.cold { margin-left: auto; background: rgba(31,95,158,0.1); color: #1F5F9E; font-size: var(--fs-xs); padding: 3px 10px; border-radius: var(--radius-pill); }
.name { font-size: var(--fs-xl); font-weight: 700; margin-top: 8px; display: block; }
.meta { display: flex; gap: 14px; margin-top: 8px; }
.rating { font-size: var(--fs-sm); color: var(--color-accent); font-weight: 600; }
.sales, .origin { font-size: var(--fs-sm); color: var(--color-text-mute); }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.tag { font-size: var(--fs-xs); background: var(--color-primary-light); color: var(--color-primary-dark); padding: 2px 8px; border-radius: 4px; }

.block { background: #fff; margin-top: 10px; padding: 16px; }
.block-t { font-size: var(--fs-base); font-weight: 600; display: block; margin-bottom: 12px; }

.spec-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.spec {
  position: relative; min-width: 96px; padding: 10px 14px;
  background: var(--color-surface-alt); border-radius: var(--radius-md);
  border: 2px solid transparent;
  display: flex; flex-direction: column; gap: 2px;
  transition: border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.spec:active { transform: scale(0.96); }
.spec.on { border-color: var(--color-primary); background: var(--color-primary-light); }
.spec.sold { opacity: 0.5; }
.spec-name { font-size: var(--fs-md); font-weight: 500; }
.spec-price { font-size: var(--fs-sm); color: var(--color-danger); font-weight: 600; }
.spec-sold { position: absolute; top: 6px; right: 8px; font-size: var(--fs-xs); color: var(--color-text-mute); }

.qty-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
.qty-row .block-t { margin-bottom: 0; }
.stepper { display: flex; align-items: center; gap: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
.step { width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--color-text-sub); background: var(--color-surface-alt); }
.step.dis { color: var(--color-text-mute); opacity: 0.5; }
.qty { width: 44px; text-align: center; font-size: var(--fs-base); font-weight: 600; }
.stock-hint { font-size: var(--fs-xs); color: var(--color-text-mute); margin-top: 10px; display: block; }

.intro { font-size: var(--fs-md); color: var(--color-text-sub); line-height: var(--lh-loose); display: block; }
.intro-img { width: 100%; border-radius: var(--radius-md); margin-top: 12px; display: block; }

.footer {
  position: fixed; left: 0; right: 0; bottom: 0; background: #fff;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; padding-bottom: calc(8px + env(safe-area-inset-bottom, 0)); z-index: 100;
}
.f-cart { position: relative; display: flex; flex-direction: column; align-items: center; padding: 0 8px; }
.f-cart-ic { font-size: 22px; }
.f-cart-l { font-size: var(--fs-xs); color: var(--color-text-mute); }
.f-cart-badge {
  position: absolute; top: -4px; right: 0;
  min-width: 16px; height: 16px; padding: 0 4px;
  background: var(--color-danger); color: #fff; font-size: 10px; font-weight: 700;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
}
.f-add {
  flex: 1; text-align: center; padding: 12px; border-radius: var(--radius-pill);
  background: var(--color-accent-light); color: #8D6E00; font-weight: 600; font-size: var(--fs-base);
}
.f-buy {
  flex: 1; text-align: center; padding: 12px; border-radius: var(--radius-pill);
  background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff; font-weight: 600; font-size: var(--fs-base);
}
</style>
