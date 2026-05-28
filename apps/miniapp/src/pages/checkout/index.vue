<template>
  <view class="page">
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

    <view class="card">
      <view class="row-h">
        <text class="lab">认养套餐</text>
      </view>
      <view class="pkg">
        <image :src="pkg.cover" mode="aspectFill" class="pkg-cov" />
        <view class="pkg-info">
          <text class="pkg-n">{{ pkg.name }}</text>
          <text class="pkg-d">{{ pkg.highlights.join(' · ') }}</text>
          <text class="pkg-plot">地块：{{ plot }} · A 区 · 南偏东 12°</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="row-h"><text class="lab">选择作物（最多 {{ pkg.id === 'pkg-pro' ? 2 : 1 }} 种）</text></view>
      <view class="crop-grid">
        <view
          v-for="c in pkg.crops"
          :key="c"
          :class="['crop', pickedCrops.includes(c) && 'on']"
          @tap="toggleCrop(c)">
          <text class="crop-em">{{ emoji(c) }}</text>
          <text class="crop-n">{{ c }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="row"><text class="lab">立牌名字（可选）</text><text class="val">{{ stake || '点击填写' }}</text></view>
      <view class="row"><text class="lab">配送时段</text><text class="val">成熟后 48 小时内</text></view>
      <view class="row tappable" @tap="openCoupon">
        <text class="lab">优惠券</text>
        <text :class="['val', pickedCoupon ? 'val-dis' : '']">
          {{ pickedCoupon ? `${pickedCoupon.name} -¥${pickedCoupon.amount}` : (usableCoupons.length ? `${usableCoupons.length} 张可用` : '暂无可用') }}
          ›
        </text>
      </view>
      <view class="row"><text class="lab">备注</text><text class="val">无</text></view>
    </view>

    <view class="card">
      <view class="row"><text class="lab">套餐费用</text><text class="val">¥ {{ pkg.price }}</text></view>
      <view class="row"><text class="lab">运费</text><text class="val">包邮</text></view>
      <view class="row"><text class="lab">优惠</text><text class="val-dis">- ¥ {{ discount }}</text></view>
      <view class="row total">
        <text class="lab">应付</text>
        <text class="val-total">¥ {{ finalPrice }}</text>
      </view>
    </view>

    <view style="height: 90px" />

    <view class="footer">
      <view class="f-total">
        <text class="f-l">实付</text>
        <text class="f-v">¥ {{ finalPrice }}</text>
      </view>
      <view class="f-btn" @tap="pay">提交订单</view>
    </view>

    <!-- 优惠券选择 sheet -->
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
            <view class="cp-l">
              <text class="cp-amt">¥{{ c.amount }}</text>
            </view>
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
import { createOrder, listMyCoupons, ApiError } from '@cloud-farm/api-client';
import { showSuccess } from '../../components/SuccessOverlay.vue';
import { usePackageStore } from '../../stores/packages';
import { useAppStore, PACKAGES as MOCK_PACKAGES } from '../../stores/mock';

const router = useRouter();
const pkgStore = usePackageStore();
const appStore = useAppStore();
const { addresses, defaultAddressId } = storeToRefs(appStore);

const pkg = computed(() => {
  const list = pkgStore.list.length ? pkgStore.list : MOCK_PACKAGES;
  return list.find(p => p.id === router.params.pkg) || list[1] || list[0];
});
const plot = ref(router.params.plot || 'P-A-07');
const stake = ref('小祎的菜园');
const pickedCrops = ref(['小番茄']);

// P8 B: 优惠券
const allCoupons = ref([]);
const pickedCouponId = ref(null);
const couponSheet = ref(false);

// 适用的券:未使用 + 非商城专用 + 满门槛(基于套餐价)
const usableCoupons = computed(() => {
  const price = pkg.value?.price || 0;
  return allCoupons.value.filter(c =>
    c.status === 'unused' && c.scope !== 'shop' && price >= c.threshold
  );
});
const pickedCoupon = computed(() => usableCoupons.value.find(c => c.id === pickedCouponId.value) || null);
const discount = computed(() => pickedCoupon.value?.amount || 0);
const finalPrice = computed(() => Math.max(0, (pkg.value?.price || 0) - discount.value));

const openCoupon = () => { couponSheet.value = true; };
const selectCoupon = (id) => { pickedCouponId.value = id; couponSheet.value = false; };

// 收货地址:取默认地址,没有就第 1 条
const address = computed(() => {
  const list = addresses.value;
  if (!list?.length) return null;
  return list.find(a => a.id === defaultAddressId.value) || list[0];
});

const emoji = n => ({
  红薯: '🍠', 胡萝卜: '🥕', 土豆: '🥔', 南瓜: '🎃',
  草莓: '🍓', 小番茄: '🍅', 香椿: '🌿', 大蒜: '🧄'
}[n] || '🌱');

const toggleCrop = c => {
  const max = pkg.value.id === 'pkg-pro' ? 2 : 1;
  const i = pickedCrops.value.indexOf(c);
  if (i >= 0) pickedCrops.value.splice(i, 1);
  else if (pickedCrops.value.length < max) pickedCrops.value.push(c);
  else Taro.showToast({ title: `最多选 ${max} 种`, icon: 'none' });
};

const goAddress = () => Taro.navigateTo({ url: '/pages/address/index?mode=select' })
  .catch(() => Taro.showToast({ title: '打开地址簿', icon: 'none' }));

/**
 * 真下单链路:
 * 1. 校验
 * 2. 调 POST /api/orders → 后端事务锁地块 + 创建订单
 * 3. 成功 → toast + 跳订单页
 *    - 后端约定:状态 'pending' 30 分钟内付款,过期自动释放(P5+)
 *    - 微信支付 P5+ 接,现在按钮文案改成"提交订单(模拟支付)"
 */
const pay = async () => {
  if (!pkg.value || !plot.value) return Taro.showToast({ title: '套餐 / 地块缺失', icon: 'none' });
  if (!pickedCrops.value.length) return Taro.showToast({ title: '请至少选 1 种作物', icon: 'none' });
  if (!address.value?.id) return Taro.showToast({ title: '请先选收货地址', icon: 'none' });

  Taro.showLoading({ title: '提交订单...' });
  try {
    const order = await createOrder({
      packageId: pkg.value.id,
      plotId: plot.value,
      crops: pickedCrops.value,
      addressId: address.value.id,
      stake: stake.value,
      couponId: pickedCouponId.value || undefined,
    });
    Taro.hideLoading();
    // P8 D2: 成功反馈动画取代 toast
    await showSuccess({
      title: '下单成功',
      subtitle: `实付 ¥${order.price}${discount.value ? ` · 已抵扣 ¥${discount.value}` : ''}`,
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
  await Promise.all([
    pkgStore.fetch(),
    appStore.bootstrap().then(() => appStore.fetchAddresses()),
  ]);
  // 拉优惠券,自动默认选中"金额最大的可用券"
  try {
    allCoupons.value = await listMyCoupons();
    if (usableCoupons.value.length) {
      const best = [...usableCoupons.value].sort((a, b) => b.amount - a.amount)[0];
      pickedCouponId.value = best.id;
    }
  } catch { /* 没登录或失败 → 不用券 */ }
});
</script>

<style lang="scss" scoped>
.page { padding: 12px 0 32px; }
.card { background: #fff; margin: 0 16px 12px; border-radius: 12px; padding: 14px 16px; }
.row-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.lab { font-size: 14px; font-weight: 600; }
.more { color: var(--color-text-mute); font-size: 18px; }

.addr-n { font-size: 15px; font-weight: 500; display: block; }
.addr-d { font-size: 13px; color: var(--color-text-sub); margin-top: 4px; display: block; }

.pkg { display: flex; gap: 12px; }
.pkg-cov { width: 88px; height: 88px; border-radius: 10px; display: block; flex-shrink: 0; }
.pkg-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.pkg-n { font-size: 15px; font-weight: 600; }
.pkg-d { font-size: 12px; color: var(--color-text-mute); line-height: 1.5; }
.pkg-plot { font-size: 12px; color: var(--color-primary-dark); }

.crop-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.crop { background: var(--color-surface-alt); border-radius: 10px; padding: 12px 4px; display: flex; flex-direction: column; align-items: center; gap: 4px; border: 2px solid transparent; }
.crop.on { background: var(--color-primary-light); border-color: var(--color-primary); }
.crop-em { font-size: 24px; }
.crop-n { font-size: 12px; }

.row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--color-divider); }
.row:last-child { border-bottom: none; }
.val { font-size: 14px; color: var(--color-text-sub); }
.val-dis { color: var(--color-danger); font-size: 14px; }
.total { border-bottom: none; margin-top: 4px; padding-top: 12px; border-top: 1px solid var(--color-divider); }
.val-total { color: var(--color-danger); font-size: 18px; font-weight: 700; }

.footer { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); display: flex; padding: 10px 16px; padding-bottom: calc(10px + env(safe-area-inset-bottom, 0)); gap: 12px; align-items: center; z-index: 100; }
.f-total { flex: 1; }
.f-l { font-size: 11px; color: var(--color-text-mute); }
.f-v { font-size: 22px; font-weight: 700; color: var(--color-danger); display: block; }
.f-btn { background: var(--color-primary); color: #fff; padding: 14px 32px; border-radius: 999px; font-weight: 600; font-size: 15px; }

/* 优惠券选择 sheet */
.mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: flex-end; }
.sheet { width: 100%; background: var(--color-bg); border-radius: 16px 16px 0 0; max-height: 70vh; display: flex; flex-direction: column; padding-bottom: calc(8px + env(safe-area-inset-bottom, 0)); }
.sheet-h { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--color-divider); }
.sheet-t { font-size: 16px; font-weight: 600; }
.sheet-x { font-size: 24px; color: var(--color-text-mute); width: 28px; text-align: center; }
.sheet-body { overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
.cp-opt {
  display: flex; align-items: center; gap: 12px; background: #fff;
  border-radius: 10px; padding: 14px; border: 2px solid transparent;
}
.cp-opt.on { border-color: var(--color-primary); }
.cp-l {
  background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff;
  border-radius: 8px; padding: 8px 12px; flex-shrink: 0;
}
.cp-amt { font-size: 18px; font-weight: 800; }
.cp-m { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cp-n { font-size: 14px; font-weight: 600; }
.cp-d { font-size: 11px; color: var(--color-text-mute); }
.cp-check { color: var(--color-primary); font-size: 18px; font-weight: 700; }
.cp-empty { text-align: center; color: var(--color-text-mute); font-size: 13px; padding: 24px 0; }
</style>
