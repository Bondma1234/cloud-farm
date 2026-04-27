<template>
  <view class="page">
    <view class="card">
      <view class="row-h">
        <text class="lab">收货地址</text>
        <text class="more">›</text>
      </view>
      <view class="addr">
        <text class="addr-n">严先生 · 138 **** 5412</text>
        <text class="addr-d">北京市海淀区中关村软件园 3 号楼 12A</text>
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
      <view class="f-btn" @tap="pay">微信支付</view>
    </view>
  </view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { computed, ref } from 'vue';
import { PACKAGES } from '../../stores/mock';

const router = useRouter();
const pkg = computed(() => PACKAGES.find(p => p.id === router.params.pkg) || PACKAGES[1]);
const plot = ref(router.params.plot || 'P-A-07');
const stake = ref('小祎的菜园');
const pickedCrops = ref(['小番茄']);

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

const pay = () => {
  Taro.showLoading({ title: '调起支付...' });
  setTimeout(() => {
    Taro.hideLoading();
    Taro.showToast({ title: '支付成功', icon: 'success' });
    setTimeout(() => Taro.switchTab({ url: '/pages/my-plot/index' }), 1200);
  }, 800);
};
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
