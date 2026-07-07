<template>
  <view class="page">
    <!-- 地址 -->
    <view class="card" @tap="goAddress">
      <view class="row-h">
        <text class="lab">收货地址</text>
        <text class="more">›</text>
      </view>
      <view class="addr" v-if="address">
        <text class="addr-n">{{ address.name }} · {{ address.phone }}</text>
        <text class="addr-d">{{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}</text>
      </view>
      <view class="addr" v-else>
        <text class="addr-n">尚无收货地址</text>
        <text class="addr-d">点击右侧 › 去新增</text>
      </view>
    </view>

    <!-- 商品清单 -->
    <view class="card">
      <view class="row-h"><text class="lab">商品清单({{ lines.length }})</text></view>
      <view class="line" v-for="it in lines" :key="it.skuId">
        <image :src="it.cover" mode="aspectFill" class="line-cov" />
        <view class="line-info">
          <text class="line-n">{{ it.goodsName }}</text>
          <text class="line-s">{{ it.spec }}<text v-if="it.coldChain" class="line-cold"> · ❄冷链</text></text>
        </view>
        <view class="line-r">
          <text class="line-p">¥{{ it.price }}</text>
          <text class="line-q">×{{ it.qty }}</text>
        </view>
      </view>
    </view>

    <!-- 优惠券 + 费用 -->
    <view class="card">
      <view class="row tappable" @tap="openCoupon">
        <text class="lab2">优惠券</text>
        <text :class="['val', pickedCoupon ? 'val-dis' : '']">
          {{ pickedCoupon ? `${pickedCoupon.name} -¥${pickedCoupon.amount}` : (usableCoupons.length ? `${usableCoupons.length} 张可用` : '暂无可用') }} ›
        </text>
      </view>
      <view class="row"><text class="lab2">商品金额</text><text class="val">¥ {{ goodsTotal }}</text></view>
      <view class="row"><text class="lab2">运费{{ hasCold ? '(含冷链)' : '' }}</text><text class="val">{{ shipping ? `¥ ${shipping}` : '包邮' }}</text></view>
      <view class="row" v-if="discount"><text class="lab2">优惠</text><text class="val-dis">- ¥ {{ discountDisplay }}</text></view>
      <view class="row total">
        <text class="lab2">应付</text>
        <text class="val-total">¥ {{ finalDisplay }}</text>
      </view>
    </view>

    <view class="tip">💡 含冷链商品不满 199 元加收 ¥20 冷链运费,满 199 包冷链</view>
    <view style="height: 90px" />

    <view class="footer">
      <view class="f-total">
        <text class="f-l">实付</text>
        <text class="f-v">¥ {{ finalDisplay }}</text>
      </view>
      <view class="f-btn" @tap="pay">提交订单</view>
    </view>

    <!-- 优惠券 sheet -->
    <view v-if="couponSheet" class="mask" @tap="couponSheet = false">
      <view class="sheet" @tap.stop>
        <view class="sheet-h">
          <text class="sheet-t">选择优惠券</text>
          <text class="sheet-x" @tap="couponSheet = false">×</text>
        </view>
        <view class="sheet-body">
          <view class="cp-opt" :class="{ on: !pickedCouponId }" @tap="selectCoupon(null)">
            <text>不使用优惠券</text>
            <text v-if="!pickedCouponId" class="cp-check">✓</text>
          </view>
          <view
            v-for="c in usableCoupons"
            :key="c.id"
            class="cp-opt"
            :class="{ on: pickedCouponId === c.id }"
            @tap="selectCoupon(c.id)"
          >
            <view class="cp-l"><text class="cp-amt">¥{{ c.amount }}</text></view>
            <view class="cp-m">
              <text class="cp-n">{{ c.name }}</text>
              <text class="cp-d">{{ c.thresholdLabel }} · 至 {{ c.expireAt }}</text>
            </view>
            <text v-if="pickedCouponId === c.id" class="cp-check">✓</text>
          </view>
          <view v-if="!usableCoupons.length" class="cp-empty">没有满足条件的优惠券</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { createShopOrder, listMyCoupons, ApiError } from '@cloud-farm/api-client';
import { showSuccess } from '../../components/SuccessOverlay.vue';
import { useCartStore } from '../../stores/cart';
import { useAppStore } from '../../stores/mock';
import { useCountUp } from '../../utils/useCountUp';

const router = useRouter();
const cart = useCartStore();
const appStore = useAppStore();
const { addresses, defaultAddressId } = storeToRefs(appStore);

// 选中的 skuId(从购物车透传);没传就用整个购物车
const selectedIds = computed(() => {
  const raw = router.params.skus ? decodeURIComponent(router.params.skus).split(',') : null;
  return raw && raw.length ? new Set(raw) : null;
});
const lines = computed(() =>
  selectedIds.value ? cart.items.filter((it) => selectedIds.value.has(it.skuId)) : cart.items
);

const goodsTotal = computed(() => lines.value.reduce((n, it) => n + it.price * it.qty, 0));
const hasCold = computed(() => lines.value.some((it) => it.coldChain));
const shipping = computed(() => (hasCold.value && goodsTotal.value < 199 ? 20 : 0));

// 优惠券
const allCoupons = ref([]);
const pickedCouponId = ref(null);
const couponSheet = ref(false);
const usableCoupons = computed(() =>
  allCoupons.value.filter((c) => c.status === 'unused' && c.scope !== 'adopt' && goodsTotal.value >= c.threshold)
);
const pickedCoupon = computed(() => usableCoupons.value.find((c) => c.id === pickedCouponId.value) || null);
const discount = computed(() => pickedCoupon.value?.amount || 0);
const finalPrice = computed(() => Math.max(0, goodsTotal.value + shipping.value - discount.value));

const finalDisplay = useCountUp(() => finalPrice.value);
const discountDisplay = useCountUp(() => discount.value);

const openCoupon = () => { couponSheet.value = true; };
const selectCoupon = (id) => { pickedCouponId.value = id; couponSheet.value = false; };

const address = computed(() => {
  const list = addresses.value;
  if (!list?.length) return null;
  return list.find((a) => a.id === defaultAddressId.value) || list[0];
});

const goAddress = () => Taro.navigateTo({ url: '/pages/address/index?mode=select' }).catch(() => {});

const pay = async () => {
  if (!lines.value.length) return Taro.showToast({ title: '没有可结算的商品', icon: 'none' });
  if (!address.value?.id) return Taro.showToast({ title: '请先选收货地址', icon: 'none' });
  Taro.showLoading({ title: '提交订单...' });
  try {
    const order = await createShopOrder({
      items: lines.value.map((it) => ({ skuId: it.skuId, qty: it.qty })),
      addressId: address.value.id,
      couponId: pickedCouponId.value || undefined,
    });
    Taro.hideLoading();
    // 下单成功 → 从购物车移除已购项
    lines.value.forEach((it) => cart.remove(it.skuId));
    await showSuccess({
      title: '下单成功',
      subtitle: `实付 ¥${order.price}${shipping.value ? ' · 含冷链运费' : ''}`,
      emoji: '🎉',
      duration: 1400,
    });
    Taro.redirectTo({ url: `/pages/order-detail/index?id=${order.id}` });
  } catch (e) {
    Taro.hideLoading();
    const msg = e instanceof ApiError ? e.message : (e?.message || '下单失败');
    Taro.showModal({ title: '下单失败', content: msg, showCancel: false });
  }
};

onMounted(async () => {
  await appStore.bootstrap().then(() => appStore.fetchAddresses());
  try {
    allCoupons.value = await listMyCoupons();
    if (usableCoupons.value.length) {
      const best = [...usableCoupons.value].sort((a, b) => b.amount - a.amount)[0];
      pickedCouponId.value = best.id;
    }
  } catch { /* 未登录/失败 → 不用券 */ }
});
</script>

<style lang="scss" scoped>
.page { padding: 12px 0 32px; }
.card { background: #fff; margin: 0 16px 12px; border-radius: var(--radius-lg); padding: 14px 16px; }
.row-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.lab { font-size: var(--fs-base); font-weight: 600; }
.more { color: var(--color-text-mute); font-size: 18px; }
.addr-n { font-size: var(--fs-base); font-weight: 500; display: block; }
.addr-d { font-size: var(--fs-md); color: var(--color-text-sub); margin-top: 4px; display: block; }

.line { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--color-divider); }
.line:last-child { border-bottom: none; }
.line-cov { width: 56px; height: 56px; border-radius: var(--radius-md); flex-shrink: 0; background: var(--color-primary-light); }
.line-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.line-n { font-size: var(--fs-md); font-weight: 500; }
.line-s { font-size: var(--fs-sm); color: var(--color-text-mute); }
.line-cold { color: #1F5F9E; }
.line-r { text-align: right; }
.line-p { font-size: var(--fs-base); font-weight: 700; color: var(--color-danger); display: block; }
.line-q { font-size: var(--fs-sm); color: var(--color-text-mute); }

.row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--color-divider); }
.row:last-child { border-bottom: none; }
.lab2 { font-size: var(--fs-base); }
.val { font-size: var(--fs-base); color: var(--color-text-sub); }
.val-dis { color: var(--color-danger); font-size: var(--fs-base); }
.total { border-bottom: none; margin-top: 4px; padding-top: 12px; border-top: 1px solid var(--color-divider); }
.val-total { color: var(--color-danger); font-size: var(--fs-lg); font-weight: 700; }

.tip { margin: 0 16px; font-size: var(--fs-xs); color: var(--color-text-mute); line-height: var(--lh-normal); }

.footer { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); display: flex; padding: 10px 16px; padding-bottom: calc(10px + env(safe-area-inset-bottom, 0)); gap: 12px; align-items: center; z-index: 100; }
.f-total { flex: 1; }
.f-l { font-size: var(--fs-xs); color: var(--color-text-mute); }
.f-v { font-size: var(--fs-xl); font-weight: 700; color: var(--color-danger); display: block; }
.f-btn { background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff; padding: 14px 32px; border-radius: var(--radius-pill); font-weight: 600; font-size: var(--fs-base); }

.mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: flex-end; }
.sheet { width: 100%; background: var(--color-bg); border-radius: 16px 16px 0 0; max-height: 70vh; display: flex; flex-direction: column; padding-bottom: calc(8px + env(safe-area-inset-bottom, 0)); }
.sheet-h { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--color-divider); }
.sheet-t { font-size: var(--fs-lg); font-weight: 600; }
.sheet-x { font-size: 24px; color: var(--color-text-mute); width: 28px; text-align: center; }
.sheet-body { overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
.cp-opt { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: var(--radius-md); padding: 14px; border: 2px solid transparent; }
.cp-opt.on { border-color: var(--color-primary); }
.cp-l { background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff; border-radius: 8px; padding: 8px 12px; flex-shrink: 0; }
.cp-amt { font-size: var(--fs-lg); font-weight: 800; }
.cp-m { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cp-n { font-size: var(--fs-base); font-weight: 600; }
.cp-d { font-size: var(--fs-xs); color: var(--color-text-mute); }
.cp-check { color: var(--color-primary); font-size: 18px; font-weight: 700; }
.cp-empty { text-align: center; color: var(--color-text-mute); font-size: var(--fs-md); padding: 24px 0; }
</style>
