<template>
  <view class="page">
    <view class="bar">
      <text class="bar-back" @tap="back">‹</text>
      <text class="bar-t">邀请好友</text>
      <text class="bar-r" />
    </view>

    <!-- Hero -->
    <view class="hero">
      <text class="hero-emoji">🎁</text>
      <text class="hero-t">邀好友一起种田</text>
      <text class="hero-s">好友注册成功,双方各得 ¥50 优惠券</text>
    </view>

    <Skeleton v-if="loading && !info" type="line" :count="2" />

    <template v-else-if="info">
      <!-- 邀请码大卡 -->
      <view class="code-card">
        <text class="code-label">我的专属邀请码</text>
        <view class="code-box">
          <text class="code">{{ info.code }}</text>
        </view>
        <view class="copy-btn" @tap="copyCode">复制邀请码</view>
        <text class="share-hint">把邀请码发给好友,Ta 注册时填写即可</text>
      </view>

      <!-- 战绩 -->
      <view class="stats">
        <view class="stat">
          <text class="stat-n">{{ info.invitedCount }}</text>
          <text class="stat-l">已邀请好友</text>
        </view>
        <view class="stat-divider" />
        <view class="stat">
          <text class="stat-n">¥{{ info.rewardTotal }}</text>
          <text class="stat-l">累计获得奖励</text>
        </view>
      </view>

      <!-- 已邀请列表 -->
      <view class="block" v-if="info.invitedNames.length">
        <text class="block-t">已邀请的好友</text>
        <view class="invited-list">
          <view class="invited" v-for="(n, i) in info.invitedNames" :key="i">
            <text class="invited-av">🧑‍🌾</text>
            <text class="invited-n">{{ n }}</text>
            <text class="invited-tag">+¥50</text>
          </view>
        </view>
      </view>

      <!-- 规则 -->
      <view class="block">
        <text class="block-t">活动规则</text>
        <view class="rules">
          <view class="rule"><text class="rule-i">1</text><text>把你的邀请码分享给好友</text></view>
          <view class="rule"><text class="rule-i">2</text><text>好友用手机号注册时填写你的邀请码</text></view>
          <view class="rule"><text class="rule-i">3</text><text>注册成功,你和好友各得 ¥50 优惠券(满 199 可用,60 天有效)</text></view>
          <view class="rule"><text class="rule-i">4</text><text>邀请人数不设上限,多邀多得</text></view>
        </view>
      </view>
    </template>

    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { onMounted, ref } from 'vue';
import { getMyInvite, ApiError } from '@cloud-farm/api-client';
import { useAppStore } from '../../stores/mock';
import Skeleton from '../../components/Skeleton.vue';

const appStore = useAppStore();
const info = ref(null);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    info.value = await getMyInvite();
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e?.message || '加载失败');
    Taro.showToast({ title: msg, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

const back = () => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/profile/index' }));

const copyCode = () => {
  if (!info.value?.code) return;
  Taro.setClipboardData?.({ data: info.value.code })
    .then(() => Taro.showToast({ title: '邀请码已复制', icon: 'success' }))
    .catch(() => Taro.showToast({ title: info.value.code, icon: 'none' }));
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

.hero {
  background: linear-gradient(135deg, #4CA777, #2E7D32);
  color: #fff; padding: 28px 20px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.hero-emoji { font-size: 48px; }
.hero-t { font-size: 20px; font-weight: 700; }
.hero-s { font-size: 13px; opacity: 0.9; }

.code-card {
  margin: -12px 16px 0; background: #fff; border-radius: 16px;
  padding: 20px; box-shadow: var(--shadow-md);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.code-label { font-size: 13px; color: var(--color-text-mute); }
.code-box {
  background: var(--color-primary-light); border: 2px dashed var(--color-primary);
  border-radius: 12px; padding: 12px 28px;
}
.code {
  font-size: 28px; font-weight: 800; letter-spacing: 4px;
  color: var(--color-primary-dark); font-family: monospace;
}
.copy-btn {
  background: var(--color-primary); color: #fff;
  padding: 10px 36px; border-radius: 999px;
  font-size: 14px; font-weight: 600;
}
.share-hint { font-size: 12px; color: var(--color-text-mute); }

.stats {
  margin: 12px 16px 0; background: #fff; border-radius: 12px;
  padding: 18px 4px; display: flex; align-items: center; box-shadow: var(--shadow-sm);
}
.stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-n { font-size: 24px; font-weight: 700; color: var(--color-primary-dark); }
.stat-l { font-size: 12px; color: var(--color-text-mute); }
.stat-divider { width: 1px; height: 36px; background: var(--color-divider); }

.block { background: #fff; margin: 12px 16px 0; border-radius: 12px; padding: 16px; }
.block-t { font-size: 15px; font-weight: 600; display: block; margin-bottom: 12px; }

.invited-list { display: flex; flex-direction: column; gap: 10px; }
.invited { display: flex; align-items: center; gap: 10px; }
.invited-av {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--color-primary-light);
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.invited-n { flex: 1; font-size: 14px; color: var(--color-text); }
.invited-tag {
  font-size: 12px; font-weight: 600; color: var(--color-primary-dark);
  background: var(--color-primary-light); padding: 3px 10px; border-radius: 999px;
}

.rules { display: flex; flex-direction: column; gap: 12px; }
.rule { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--color-text-sub); line-height: 1.5; }
.rule-i {
  flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%;
  background: var(--color-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
</style>
