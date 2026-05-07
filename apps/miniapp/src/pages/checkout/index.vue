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
      <view class="row"><text class="lab">优惠券</text><text class="val">抵扣 ¥50</text></view>
      <view class="row"><text class="lab">备注</text><text class="val">无</text></view>
    </view>

    <view class="card">
      <view class="row"><text class="lab">套餐费用</text><text class="val">¥ {{ pkg.price }}</text></view>
      <view class="row"><text class="lab">运费</text><text class="val">包邮</text></view>
      <view class="row"><text class="lab">优惠</text><text class="val-dis">- ¥ 50</text></view>
      <view class="row total">
        <text class="lab">应付</text>
        <text class="val-total">¥ {{ pkg.price - 50 }}</text>
      </view>
    </view>

    <view style="height: 90px" />

    <view class="footer">
      <view class="f-total">
        <text class="f-l">实付</text>
        <text class="f-v">¥ {{ pkg.price - 50 }}</text>
      </view>
      <view class="f-btn" @tap="pay">提交订单</view>
    </view>
  </view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { createOrder, ApiError } from '@cloud-farm/api-client';
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
    });
    Taro.hideLoading();
    Taro.showToast({ title: `订单 ${order.id} 创建成功`, icon: 'success' });
    setTimeout(() => Taro.redirectTo({ url: `/pages/order-detail/index?id=${order.id}` }), 1200);
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

.footer { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); display: flex; padding: 10px 16px 22px; gap: 12px; align-items: center; z-index: 100; }
.f-total { flex: 1; }
.f-l { font-size: 11px; color: var(--color-text-mute); }
.f-v { font-size: 22px; font-weight: 700; color: var(--color-danger); display: block; }
.f-btn { background: var(--color-primary); color: #fff; padding: 14px 32px; border-radius: 999px; font-weight: 600; font-size: 15px; }
</style>
