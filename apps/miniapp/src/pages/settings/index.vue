<template>
  <view class="page">
    <view class="bar">
      <text class="bar-back" @tap="back">‹</text>
      <text class="bar-t">设置</text>
      <text class="bar-r" />
    </view>

    <!-- 账号 -->
    <view class="group" v-if="isLoggedIn">
      <view class="g-title">账号</view>
      <view class="row">
        <text class="row-l">手机号</text>
        <text class="row-v">{{ user.phone || '未绑定' }}</text>
      </view>
      <view class="row">
        <text class="row-l">昵称</text>
        <text class="row-v">{{ user.nickname }}</text>
      </view>
      <view class="row">
        <text class="row-l">会员等级</text>
        <text class="row-v">{{ user.level }}</text>
      </view>
    </view>

    <!-- 通知 -->
    <view class="group">
      <view class="g-title">通知</view>
      <view class="row">
        <text class="row-l">订单状态推送</text>
        <view :class="['switch', notify.order && 'on']" @tap="notify.order = !notify.order">
          <view class="knob" />
        </view>
      </view>
      <view class="row">
        <text class="row-l">生长动态推送</text>
        <view :class="['switch', notify.journal && 'on']" @tap="notify.journal = !notify.journal">
          <view class="knob" />
        </view>
      </view>
      <view class="row">
        <text class="row-l">营销活动推送</text>
        <view :class="['switch', notify.promo && 'on']" @tap="notify.promo = !notify.promo">
          <view class="knob" />
        </view>
      </view>
    </view>

    <!-- 通用 -->
    <view class="group">
      <view class="g-title">通用</view>
      <view class="row tappable" @tap="clearCache">
        <text class="row-l">清除缓存</text>
        <text class="row-v">{{ cacheSize }}</text>
        <text class="row-a">›</text>
      </view>
      <view class="row tappable" @tap="goHelp">
        <text class="row-l">帮助中心</text>
        <text class="row-a">›</text>
      </view>
      <view class="row tappable" @tap="about">
        <text class="row-l">关于云上田园</text>
        <text class="row-v">v0.1.0</text>
        <text class="row-a">›</text>
      </view>
    </view>

    <view v-if="isLoggedIn" class="logout" @tap="logout">退出登录</view>
    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '../../stores/mock';

const store = useAppStore();
const { user, isLoggedIn } = storeToRefs(store);

const notify = reactive({ order: true, journal: true, promo: false });
const cacheSize = ref('2.3 MB');

const back = () => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/profile/index' }));
const goHelp = () => Taro.navigateTo({ url: '/pages/help/index' });
const about = () => Taro.showModal({
  title: '云上田园 v0.1.0',
  content: '让每个城市家庭都有一块"看得见的安心农田"。\n远程认养 + 摄像头监控 + 产地直送。',
  showCancel: false,
});
const clearCache = () => {
  Taro.showLoading({ title: '清理中…' });
  setTimeout(() => {
    cacheSize.value = '0 MB';
    Taro.hideLoading();
    Taro.showToast({ title: '缓存已清除', icon: 'success' });
  }, 600);
};
const logout = () => Taro.showModal({
  title: '退出登录',
  content: '确定退出当前账号?',
  success: (res) => {
    if (res.confirm) {
      store.logoutMock?.();
      Taro.showToast({ title: '已退出', icon: 'success' });
      setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }).catch(() => {}), 600);
    }
  },
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

.group { background: #fff; margin: 12px 16px 0; border-radius: 12px; padding: 4px 16px; }
.g-title { font-size: 12px; color: var(--color-text-mute); padding: 12px 0 4px; }

.row {
  display: flex; align-items: center; padding: 14px 0;
  border-bottom: 1px solid var(--color-divider); gap: 10px;
}
.row:last-child { border-bottom: none; }
.row-l { flex: 1; font-size: 14px; color: var(--color-text); }
.row-v { font-size: 13px; color: var(--color-text-mute); }
.row-a { color: var(--color-text-mute); font-size: 18px; }

/* iOS 风格开关 */
.switch {
  width: 46px; height: 26px; border-radius: 999px;
  background: #ddd; position: relative; transition: background 0.2s;
}
.switch.on { background: var(--color-primary); }
.knob {
  position: absolute; top: 2px; left: 2px;
  width: 22px; height: 22px; border-radius: 50%; background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s;
}
.switch.on .knob { transform: translateX(20px); }

.logout {
  margin: 20px 16px 0; padding: 14px; border-radius: 12px;
  background: #fff; text-align: center;
  font-size: 14px; color: var(--color-danger); box-shadow: var(--shadow-sm);
}
</style>
