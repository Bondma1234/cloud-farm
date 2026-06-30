<template>
  <view class="page" v-if="pkg">
    <image :src="pkg.cover" mode="aspectFill" class="cover" />

    <view class="head">
      <view class="tag">{{ pkg.tag }}</view>
      <text class="name">{{ pkg.name }}</text>
      <view class="price-row">
        <text class="price-s">¥</text>
        <text class="price-n">{{ pkg.price }}</text>
        <text class="price-u">/ 年（含物流）</text>
      </view>
    </view>

    <view class="block">
      <text class="block-title">套餐含什么</text>
      <view class="feat" v-for="(h, i) in pkg.highlights" :key="i">
        <text class="feat-ic">✓</text>
        <text class="feat-t">{{ h }}</text>
      </view>
    </view>

    <view class="block">
      <text class="block-title">可选作物</text>
      <view class="crop-grid">
        <view class="crop" v-for="c in pkg.crops" :key="c">
          <text class="crop-em">{{ cropEmoji(c) }}</text>
          <text class="crop-n">{{ c }}</text>
        </view>
      </view>
    </view>

    <view class="block">
      <text class="block-title">服务流程</text>
      <view class="steps cf-stagger">
        <view class="step">
          <view class="step-idx">1</view>
          <view class="step-body">
            <text class="step-t">选地块</text>
            <text class="step-d">查看农场实景，挑选朝向与位置</text>
          </view>
        </view>
        <view class="step">
          <view class="step-idx">2</view>
          <view class="step-body">
            <text class="step-t">选作物·下单</text>
            <text class="step-d">选择品种，支付后 3 日内播种</text>
          </view>
        </view>
        <view class="step">
          <view class="step-idx">3</view>
          <view class="step-body">
            <text class="step-t">远程管理</text>
            <text class="step-d">小程序看直播、发指令、查报告</text>
          </view>
        </view>
        <view class="step">
          <view class="step-idx">4</view>
          <view class="step-body">
            <text class="step-t">收获·直送</text>
            <text class="step-d">成熟采收，48 小时冷链到家</text>
          </view>
        </view>
      </view>
    </view>

    <view class="block">
      <text class="block-title">常见问题</text>
      <view class="qa">
        <text class="q">Q：绝收怎么办？</text>
        <text class="a">A：我们已购买农业保险，且每单位保留 10% 抗逆作物作为保底；若实际收成不足，按差额补偿等价产品或退款。</text>
      </view>
      <view class="qa">
        <text class="q">Q：可以换作物吗？</text>
        <text class="a">A：播种前 72 小时内免费更换；播种后可追加付费更换。</text>
      </view>
    </view>

    <view style="height: 100px" />

    <!-- 悬浮下单栏 -->
    <view class="footer">
      <view class="f-item" @tap="contact">
        <text class="f-ic">💬</text>
        <text class="f-l">客服</text>
      </view>
      <view class="f-item" @tap="favorite">
        <text class="f-ic">⭐</text>
        <text class="f-l">收藏</text>
      </view>
      <view class="f-btn f-btn-ghost" @tap="goPlot">选地块</view>
      <view class="f-btn f-btn-primary" @tap="goCheckout">立即认养</view>
    </view>
  </view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { computed, onMounted } from 'vue';
import { usePackageStore } from '../../stores/packages';
import { PACKAGES as MOCK_PACKAGES } from '../../stores/mock';

const router = useRouter();
const pkgStore = usePackageStore();

// store 没数据时(直接深链进来)兜底用 mock
const pkg = computed(() => {
  const id = router.params.id;
  const list = pkgStore.list.length ? pkgStore.list : MOCK_PACKAGES;
  return list.find(p => p.id === id) || list[0];
});

onMounted(() => pkgStore.fetch());

const cropEmoji = name => ({
  红薯: '🍠', 胡萝卜: '🥕', 土豆: '🥔', 南瓜: '🎃',
  草莓: '🍓', 小番茄: '🍅', 香椿: '🌿', 大蒜: '🧄'
}[name] || '🌱');

const goPlot = () => Taro.navigateTo({ url: `/pages/plot-picker/index?pkg=${pkg.value.id}` });
const goCheckout = () => Taro.navigateTo({ url: `/pages/checkout/index?pkg=${pkg.value.id}` });
const favorite = () => Taro.showToast({ title: '已收藏', icon: 'success' });
const contact = () => Taro.showToast({ title: '客服会话（mock）', icon: 'none' });
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; background: var(--color-bg); }
.cover { width: 100%; height: 260px; display: block; }

.head { background: #fff; padding: 16px 18px; position: relative; }
.tag {
  display: inline-block; background: var(--color-accent); color: #8D6E00;
  font-size: 11px; padding: 2px 10px; border-radius: 999px; font-weight: 600;
}
.name { font-size: 20px; font-weight: 700; margin-top: 8px; display: block; }
.price-row { margin-top: 8px; display: flex; align-items: baseline; gap: 4px; }
.price-s { font-size: 14px; color: var(--color-danger); font-weight: 600; }
.price-n { font-size: 30px; font-weight: 700; color: var(--color-danger); }
.price-u { font-size: 12px; color: var(--color-text-mute); }

.block { background: #fff; margin-top: 10px; padding: 16px 18px; }
.block-title { font-size: 16px; font-weight: 600; display: block; margin-bottom: 12px; }

.feat { display: flex; gap: 10px; padding: 6px 0; align-items: center; }
.feat-ic { width: 22px; height: 22px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.feat-t { font-size: 14px; }

.crop-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.crop {
  background: var(--color-surface-alt); border-radius: 12px; padding: 14px 4px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  transition: transform var(--dur-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
}
.crop:active { transform: scale(0.94); }
.crop-em { font-size: 28px; }
.crop-n { font-size: var(--fs-sm); color: var(--color-text-sub); }

.steps { display: flex; flex-direction: column; gap: 12px; }
.step { display: flex; gap: 12px; }
.step-idx { width: 28px; height: 28px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
.step-body { display: flex; flex-direction: column; gap: 2px; }
.step-t { font-size: 14px; font-weight: 600; }
.step-d { font-size: 12px; color: var(--color-text-mute); }

.qa { padding: 10px 0; border-bottom: 1px solid var(--color-divider); }
.qa:last-child { border-bottom: none; }
.q { font-size: 14px; font-weight: 500; display: block; }
.a { font-size: 13px; color: var(--color-text-sub); margin-top: 4px; display: block; line-height: 1.5; }

.footer {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: #fff; box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  display: flex; padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0));
  gap: 10px; align-items: center;
  z-index: 100;
}
.f-item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 8px; }
.f-ic { font-size: 20px; }
.f-l { font-size: 11px; color: var(--color-text-mute); }
.f-btn { flex: 1; text-align: center; padding: 12px; border-radius: 999px; font-size: 14px; font-weight: 600; }
.f-btn-primary { background: var(--color-primary); color: #fff; }
.f-btn-ghost { background: var(--color-primary-light); color: var(--color-primary-dark); flex: 0.7; }
</style>
