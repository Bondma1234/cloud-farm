<template>
  <view class="page">
    <view class="bar">
      <text class="bar-back" @tap="back">‹</text>
      <text class="bar-t">我的优惠券</text>
      <text class="bar-r" />
    </view>

    <!-- tab -->
    <view class="tabs">
      <view
        v-for="t in TABS"
        :key="t.key"
        :class="['tab', active === t.key && 'active']"
        @tap="active = t.key"
      >
        {{ t.label }}<text v-if="counts[t.key]" class="cnt">({{ counts[t.key] }})</text>
      </view>
    </view>

    <Skeleton v-if="loading && !list.length" type="card" :count="2" />

    <view v-else-if="filtered.length" class="list">
      <view v-for="c in filtered" :key="c.id" :class="['coupon', c.status]">
        <!-- 左:金额 -->
        <view class="coupon-l">
          <view class="amt"><text class="amt-s">¥</text>{{ c.amount }}</view>
          <text class="thr">{{ c.thresholdLabel }}</text>
        </view>
        <!-- 中:信息 -->
        <view class="coupon-m">
          <text class="name">{{ c.name }}</text>
          <text class="scope">{{ c.scopeLabel }} · {{ c.desc }}</text>
          <text class="exp">有效期至 {{ c.expireAt }}</text>
        </view>
        <!-- 右:状态/按钮 -->
        <view class="coupon-r">
          <view v-if="c.status === 'unused'" class="use-btn" @tap="goUse(c)">去使用</view>
          <view v-else-if="c.status === 'used'" class="stamp used">已使用</view>
          <view v-else class="stamp expired">已过期</view>
        </view>
        <!-- 来源角标 -->
        <view v-if="c.source !== 'system'" class="src-tag">
          {{ c.source === 'invite' ? '邀请奖励' : '新人专享' }}
        </view>
      </view>
    </view>

    <EmptyState v-else type="order" :title="`暂无${activeLabel}优惠券`" subtitle="多参与活动 / 邀请好友领券" />

    <view class="tip">
      <text>💡 优惠券在结算页自动可选,满足门槛即可抵扣</text>
    </view>
    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { computed, onMounted, ref } from 'vue';
import { listMyCoupons, ApiError } from '@cloud-farm/api-client';
import { useAppStore } from '../../stores/mock';
import Skeleton from '../../components/Skeleton.vue';
import EmptyState from '../../components/EmptyState.vue';

const appStore = useAppStore();
const list = ref([]);
const loading = ref(false);
const active = ref('unused');

const TABS = [
  { key: 'unused',  label: '可用' },
  { key: 'used',    label: '已使用' },
  { key: 'expired', label: '已过期' },
];
const activeLabel = computed(() => TABS.find(t => t.key === active.value)?.label || '');

const counts = computed(() => ({
  unused:  list.value.filter(c => c.status === 'unused').length,
  used:    list.value.filter(c => c.status === 'used').length,
  expired: list.value.filter(c => c.status === 'expired').length,
}));

const filtered = computed(() => list.value.filter(c => c.status === active.value));

async function load() {
  loading.value = true;
  try {
    list.value = await listMyCoupons();
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e?.message || '加载失败');
    Taro.showToast({ title: msg, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

const back = () => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/profile/index' }));
const goUse = (c) => {
  // 认养券 → 去套餐;商城券 → 去商城(暂跳套餐);全场 → 套餐
  Taro.switchTab({ url: '/pages/packages/index' }).catch(() =>
    Taro.navigateTo({ url: '/pages/packages/index' }).catch(() => {})
  );
};

onMounted(() => {
  appStore.bootstrap().finally(load);
});
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 32px; }

.bar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #fff;
  border-bottom: 1px solid var(--color-divider);
}
.bar-back { font-size: 22px; color: var(--color-text); width: 24px; }
.bar-t { flex: 1; text-align: center; font-size: 16px; font-weight: 600; }
.bar-r { width: 24px; }

.tabs {
  display: flex; background: #fff; padding: 0 16px;
  border-bottom: 1px solid var(--color-divider);
}
.tab {
  flex: 1; text-align: center; padding: 12px 0;
  font-size: 14px; color: var(--color-text-mute); position: relative;
}
.tab.active { color: var(--color-primary-dark); font-weight: 600; }
.tab.active::after {
  content: ''; position: absolute; left: 50%; bottom: 0;
  transform: translateX(-50%); width: 24px; height: 2px;
  background: var(--color-primary); border-radius: 2px;
}
.cnt { font-size: 11px; margin-left: 2px; }

.list { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }

.coupon {
  background: #fff; border-radius: 12px; display: flex;
  overflow: hidden; box-shadow: var(--shadow-sm); position: relative;
  min-height: 88px;
}
/* 左侧锯齿分隔 */
.coupon-l {
  width: 110px; flex-shrink: 0;
  background: linear-gradient(135deg, #4CA777, #2E7D32);
  color: #fff; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 4px;
  position: relative;
}
.coupon-l::after {
  content: ''; position: absolute; right: -6px; top: 0; bottom: 0;
  width: 12px;
  background: radial-gradient(circle at 0 6px, transparent 0, transparent 5px, #fff 5px, #fff 6px) repeat-y;
  background-size: 12px 16px;
}
.amt { font-size: 30px; font-weight: 800; line-height: 1; }
.amt-s { font-size: 16px; font-weight: 600; }
.thr { font-size: 11px; opacity: 0.9; }

.coupon-m {
  flex: 1; padding: 12px 14px; display: flex; flex-direction: column;
  justify-content: center; gap: 4px; min-width: 0;
}
.name { font-size: 15px; font-weight: 600; color: var(--color-text); }
.scope {
  font-size: 12px; color: var(--color-text-sub); line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
}
.exp { font-size: 11px; color: var(--color-text-mute); }

.coupon-r {
  flex-shrink: 0; display: flex; align-items: center; padding: 0 14px;
}
.use-btn {
  background: var(--color-primary); color: #fff;
  font-size: 12px; font-weight: 600;
  padding: 7px 14px; border-radius: 999px;
}
.stamp {
  font-size: 12px; font-weight: 700;
  border: 2px solid; border-radius: 6px; padding: 4px 8px;
  transform: rotate(-12deg); opacity: 0.6;
}
.stamp.used { color: var(--color-text-mute); border-color: var(--color-text-mute); }
.stamp.expired { color: var(--color-danger); border-color: var(--color-danger); }

/* 已用/过期整卡置灰 */
.coupon.used, .coupon.expired { opacity: 0.72; }
.coupon.used .coupon-l, .coupon.expired .coupon-l {
  background: linear-gradient(135deg, #B0BEC5, #78909C);
}

.src-tag {
  position: absolute; top: 0; right: 0;
  background: var(--color-accent); color: #8D6E00;
  font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-bottom-left-radius: 8px;
}

.tip {
  margin: 4px 16px; font-size: 12px; color: var(--color-text-mute);
  text-align: center; line-height: 1.6;
}
</style>
