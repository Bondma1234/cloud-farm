<template>
  <view class="page">
    <!-- 未登录提示 -->
    <view v-if="!isLoggedIn" class="login-prompt" @tap="toLogin">
      <view class="lp-ic">👋</view>
      <view class="lp-body">
        <text class="lp-t">点击登录</text>
        <text class="lp-s">登录后可管理地块、订单与地址</text>
      </view>
      <text class="lp-a">›</text>
    </view>

    <!-- 已登录头部 -->
    <view v-else class="head">
      <view class="avatar">{{ user.avatar }}</view>
      <view class="user-info">
        <text class="user-n">{{ user.nickname }}</text>
        <view class="user-l">
          <view class="level">{{ user.level }}</view>
          <text class="user-m">认证田主 · 已种植 49 天</text>
        </view>
      </view>
      <view class="setting" @tap="toSettings">⚙️</view>
    </view>

    <!-- 概览卡片 -->
    <view class="stats-card" v-if="isLoggedIn">
      <view class="stat-item" @tap="goMyPlot">
        <text class="stat-n">1</text>
        <text class="stat-l">认养中</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item" @tap="goOrders('growing')">
        <text class="stat-n">3</text>
        <text class="stat-l">待收获</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item" @tap="goOrders('all')">
        <text class="stat-n">{{ orders.length }}</text>
        <text class="stat-l">已下单</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item" @tap="toCoupons">
        <text class="stat-n">¥50</text>
        <text class="stat-l">可用券</text>
      </view>
    </view>

    <!-- 订单 -->
    <view class="block">
      <view class="block-h">
        <text class="block-t">我的订单</text>
        <text class="block-more" @tap="goOrders('all')">全部订单 ›</text>
      </view>
      <view class="order-tabs">
        <view
          v-for="t in ORDER_TABS"
          :key="t.key"
          :class="['otab', active === t.key && 'active']"
          @tap="active = t.key"
        >{{ t.label }}</view>
      </view>
      <view class="order-list" v-if="filteredOrders.length">
        <view class="order" v-for="o in filteredOrders.slice(0, 2)" :key="o.id" @tap="goOrderDetail(o)">
          <view class="order-h">
            <text class="order-type">{{ o.typeIcon }} {{ o.type }}</text>
            <text :class="['order-st', o.status]">{{ o.statusLabel }}</text>
          </view>
          <view class="order-b">
            <image class="order-c" :src="o.cover" mode="aspectFill" />
            <view class="order-info">
              <text class="order-t">{{ o.title }}</text>
              <view class="order-f">
                <text class="order-d">{{ o.date }}</text>
                <text class="order-p">¥ {{ o.price }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="order-empty">
        <text>暂无{{ activeLabel }}订单</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="block">
      <view class="menu-grid">
        <view class="menu" v-for="m in menus" :key="m.key" @tap="onMenu(m)">
          <text class="menu-ic">{{ m.icon }}</text>
          <text class="menu-l">{{ m.label }}</text>
        </view>
      </view>
    </view>

    <!-- 更多 -->
    <view class="block">
      <view class="row" v-for="(r, i) in rows" :key="i" @tap="onRow(r)">
        <text class="row-ic">{{ r.icon }}</text>
        <text class="row-l">{{ r.label }}</text>
        <text class="row-v">{{ r.value }}</text>
        <text class="row-a">›</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="isLoggedIn" class="logout" @tap="logout">退出登录</view>

    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useAppStore, ORDERS } from '../../stores/mock';

const store = useAppStore();
const { user, isLoggedIn } = storeToRefs(store);
const orders = ORDERS;

const ORDER_TABS = [
  { key: 'all',        label: '全部' },
  { key: 'pending',    label: '待付款' },
  { key: 'delivering', label: '待收货' },
  { key: 'growing',    label: '种植中' },
  { key: 'completed',  label: '已完成' }
];
const active = ref('all');
const activeLabel = computed(() => ORDER_TABS.find(t => t.key === active.value)?.label || '');
const filteredOrders = computed(() => {
  if (active.value === 'all') return orders;
  return orders.filter(o => o.status === active.value);
});

const menus = [
  { key: 'addr',        icon: '📍', label: '地址管理' },
  { key: 'crops',       icon: '🌾', label: '作物百科' },
  { key: 'photos',      icon: '📷', label: '照片墙' },
  { key: 'coupon',      icon: '🎟️', label: '优惠券' },
  { key: 'invite',      icon: '👥', label: '邀请好友' },
  { key: 'enterprise',  icon: '🏢', label: '企业合作' },
  { key: 'help',        icon: '❓', label: '帮助中心' },
  { key: 'contact',     icon: '💬', label: '联系我们' }
];

const rows = [
  { key: 'notify',  icon: '🔔', label: '消息通知', value: '开启' },
  { key: 'privacy', icon: '🛡️', label: '隐私与权限', value: '' },
  { key: 'about',   icon: 'ℹ️', label: '关于云上田园', value: 'v0.1.0' }
];

const toLogin = () => Taro.navigateTo({ url: '/pages/login/index' })
  .catch(() => Taro.showToast({ title: '请先登录', icon: 'none' }));

const toSettings = () => Taro.showToast({ title: '设置页（待开放）', icon: 'none' });
const toCoupons = () => Taro.showToast({ title: '优惠券（待开放）', icon: 'none' });

const goOrders = (tab) => {
  Taro.navigateTo({ url: `/pages/orders/index?active=${tab}` })
    .catch(() => Taro.showToast({ title: '打开订单', icon: 'none' }));
};

const goOrderDetail = (o) => {
  Taro.navigateTo({ url: `/pages/order-detail/index?id=${o.id}` })
    .catch(() => Taro.showToast({ title: `订单 ${o.id}`, icon: 'none' }));
};

const goMyPlot = () => Taro.switchTab({ url: '/pages/my-plot/index' });

const onMenu = (m) => {
  const nav = (url) => Taro.navigateTo({ url }).catch(() => Taro.showToast({ title: m.label, icon: 'none' }));
  switch (m.key) {
    case 'addr':       return nav('/pages/address/index');
    case 'crops':      return nav('/pages/crops/index');
    case 'photos':     return nav('/pages/photos/index');
    case 'coupon':     return Taro.showToast({ title: '优惠券（待开放）', icon: 'none' });
    case 'invite':     return Taro.showToast({ title: '邀请好友（待开放）', icon: 'none' });
    case 'enterprise': return Taro.showToast({ title: '企业合作咨询 400-8888-666', icon: 'none' });
    case 'help':       return Taro.showToast({ title: '帮助中心（待开放）', icon: 'none' });
    case 'contact':    return Taro.showToast({ title: '客服 400-8888-666', icon: 'none' });
    default:           return Taro.showToast({ title: m.label, icon: 'none' });
  }
};

const onRow = (r) => {
  switch (r.key) {
    case 'notify':  return Taro.showToast({ title: '已开启消息通知', icon: 'none' });
    case 'privacy': return Taro.showToast({ title: '隐私与权限（待开放）', icon: 'none' });
    case 'about':   return Taro.showToast({ title: '云上田园 v0.1.0', icon: 'none' });
  }
};

const logout = () => {
  Taro.showModal({
    title: '退出登录',
    content: '确定退出当前账号？',
    success: (res) => {
      if (res.confirm) {
        store.logoutMock();
        Taro.showToast({ title: '已退出', icon: 'success' });
      }
    }
  });
};
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; }

/* 未登录提示 */
.login-prompt {
  background: linear-gradient(135deg, #4CA777 0%, #2E7D32 100%);
  padding: 28px 20px; display: flex; align-items: center; gap: 14px;
  color: #fff; cursor: pointer;
}
.lp-ic { font-size: 42px; }
.lp-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.lp-t { font-size: 18px; font-weight: 700; }
.lp-s { font-size: 12px; opacity: 0.85; }
.lp-a { font-size: 22px; opacity: 0.85; }

.head {
  background: linear-gradient(135deg, #4CA777 0%, #2E7D32 100%);
  padding: 20px 18px 36px; display: flex; align-items: center; gap: 14px;
  color: #fff;
}
.avatar {
  width: 60px; height: 60px; border-radius: 50%;
  background: rgba(255,255,255,0.22);
  display: flex; align-items: center; justify-content: center;
  font-size: 32px;
}
.user-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.user-n { font-size: 18px; font-weight: 600; }
.user-l { display: flex; align-items: center; gap: 8px; }
.level {
  background: var(--color-accent); color: #8D6E00;
  font-size: 10px; padding: 2px 8px; border-radius: 999px; font-weight: 700;
}
.user-m { font-size: 12px; opacity: 0.88; }
.setting { font-size: 22px; cursor: pointer; }

.stats-card {
  margin: -20px 16px 0; background: #fff; border-radius: 14px;
  padding: 16px 4px; display: flex; align-items: center; box-shadow: var(--shadow-sm);
}
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; }
.stat-n { font-size: 20px; font-weight: 700; color: var(--color-primary-dark); }
.stat-l { font-size: 11px; color: var(--color-text-mute); }
.stat-divider { width: 1px; height: 32px; background: var(--color-divider); }

.block { background: #fff; margin: 12px 16px 0; border-radius: 12px; padding: 14px 16px; }
.block-h { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.block-t { font-size: 15px; font-weight: 600; }
.block-more { font-size: 12px; color: var(--color-text-mute); cursor: pointer; }

.order-tabs { display: flex; gap: 16px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--color-divider); overflow-x: auto; }
.otab { flex-shrink: 0; font-size: 13px; color: var(--color-text-mute); padding-bottom: 6px; position: relative; cursor: pointer; }
.otab.active { color: var(--color-primary-dark); font-weight: 600; }
.otab.active::after {
  content: ""; position: absolute; left: 50%; bottom: -8px;
  transform: translateX(-50%); width: 20px; height: 2px;
  background: var(--color-primary); border-radius: 2px;
}

.order-list { display: flex; flex-direction: column; gap: 10px; }
.order { background: var(--color-surface-alt); border-radius: 10px; padding: 12px; cursor: pointer; }
.order-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.order-type { font-size: 12px; color: var(--color-text-sub); }
.order-st { font-size: 12px; font-weight: 600; color: var(--color-primary-dark); }
.order-st.pending { color: var(--color-danger); }
.order-st.delivering { color: #E67E22; }
.order-st.completed { color: var(--color-text-mute); }

.order-b { display: flex; gap: 10px; }
.order-c { width: 64px; height: 64px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: var(--color-primary-light); }
.order-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
.order-t { font-size: 13px; color: var(--color-text); line-height: 1.4; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.order-f { display: flex; justify-content: space-between; align-items: baseline; }
.order-d { font-size: 11px; color: var(--color-text-mute); }
.order-p { font-size: 14px; font-weight: 700; color: var(--color-danger); }

.order-empty {
  text-align: center; padding: 28px 0;
  font-size: 13px; color: var(--color-text-mute);
}

.menu-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 4px 0; }
.menu { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.menu-ic { width: 44px; height: 44px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; font-size: 22px; }
.menu-l { font-size: 12px; color: var(--color-text-sub); }

.row { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-divider); gap: 10px; cursor: pointer; }
.row:last-child { border-bottom: none; }
.row-ic { font-size: 18px; width: 28px; }
.row-l { flex: 1; font-size: 14px; }
.row-v { font-size: 12px; color: var(--color-text-mute); }
.row-a { color: var(--color-text-mute); font-size: 18px; }

.logout {
  margin: 20px 16px 0;
  padding: 14px; border-radius: 12px;
  background: #fff; text-align: center;
  font-size: 14px; color: var(--color-danger);
  cursor: pointer; box-shadow: var(--shadow-sm);
}
</style>
