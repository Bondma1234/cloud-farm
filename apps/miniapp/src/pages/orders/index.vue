<template>
  <view class="page">
    <!-- 顶部导航 -->
    <view class="bar">
      <text class="bar-back" @tap="back">‹</text>
      <text class="bar-t">我的订单</text>
      <text class="bar-r" @tap="contact">客服</text>
    </view>

    <!-- 筛选 Tab -->
    <view class="tabs">
      <view
        v-for="t in TABS"
        :key="t.key"
        :class="['tab', active === t.key && 'on']"
        @tap="active = t.key"
      >
        {{ t.label }}
        <text v-if="t.key === 'pending' && counts.pending" class="badge">{{ counts.pending }}</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="list" v-if="filtered.length">
      <view class="order" v-for="o in filtered" :key="o.id" @tap="toDetail(o)">
        <view class="order-h">
          <text class="order-type">{{ o.typeIcon }} {{ o.type }}</text>
          <text :class="['order-st', o.status]">{{ o.statusLabel }}</text>
        </view>

        <view class="order-b">
          <image class="order-c" :src="o.cover" mode="aspectFill" />
          <view class="order-info">
            <text class="order-t">{{ o.title }}</text>
            <text class="order-sub" v-if="o.subItems && o.subItems[0]">
              {{ o.subItems[0].label }}：{{ o.subItems[0].value }}
            </text>
            <text class="order-sub" v-else-if="o.logistics">
              {{ o.logistics.company }}·{{ o.logistics.no }}
            </text>
            <view class="order-meta">
              <text class="order-d">{{ o.date }}</text>
              <text class="order-price">¥{{ o.price }}<text class="order-count"> × {{ o.count }}</text></text>
            </view>
          </view>
        </view>

        <!-- 待付款倒计时 -->
        <view v-if="o.status === 'pending' && o.expireIn" class="order-tip">
          <text class="tip-ic">⏰</text>
          <text class="tip-t">剩余 <text class="tip-hi">{{ o.expireIn }}</text> 自动取消</text>
        </view>

        <view class="order-f">
          <text class="order-no">单号 {{ o.id }}</text>
          <view class="order-acts">
            <!-- 待付款 -->
            <template v-if="o.status === 'pending'">
              <view class="act ghost" @tap.stop="cancelOrder(o)">取消订单</view>
              <view class="act primary" @tap.stop="payOrder(o)">去支付</view>
            </template>
            <!-- 配送中 -->
            <template v-else-if="o.status === 'delivering'">
              <view class="act ghost" @tap.stop="contactCourier(o)">联系快递</view>
              <view class="act primary" @tap.stop="viewLogistics(o)">查看物流</view>
            </template>
            <!-- 待发货 -->
            <template v-else-if="o.status === 'shipped'">
              <view class="act ghost" @tap.stop="remindShip(o)">提醒发货</view>
              <view class="act primary" @tap.stop="toDetail(o)">查看详情</view>
            </template>
            <!-- 种植中 -->
            <template v-else-if="o.status === 'growing'">
              <view class="act ghost" @tap.stop="toDetail(o)">查看详情</view>
              <view class="act primary" @tap.stop="goMyPlot">去看我的田</view>
            </template>
            <!-- 已完成 -->
            <template v-else-if="o.status === 'completed'">
              <view class="act ghost" @tap.stop="buyAgain(o)">再来一单</view>
              <view class="act primary" v-if="o.canReview" @tap.stop="review(o)">评价晒单</view>
              <view class="act ghost" v-else @tap.stop="toDetail(o)">查看详情</view>
            </template>
            <template v-else>
              <view class="act ghost" @tap.stop="toDetail(o)">查看详情</view>
            </template>
          </view>
        </view>
      </view>
      <view style="height: 32px" />
    </view>

    <!-- 空态 -->
    <view v-else class="empty">
      <view class="empty-ic">📭</view>
      <text class="empty-t">暂无{{ activeLabel }}订单</text>
      <text class="empty-s">去挑一块心仪的田地吧～</text>
      <view class="empty-btn" @tap="goPackages">去认养</view>
    </view>
  </view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '../../stores/mock';
import { useOrderStore } from '../../stores/orders';

const router = useRouter();
const appStore = useAppStore();
const orderStore = useOrderStore();
const { list: orders } = storeToRefs(orderStore);

const TABS = [
  { key: 'all',        label: '全部' },
  { key: 'pending',    label: '待付款' },
  { key: 'shipped',    label: '待发货' },
  { key: 'delivering', label: '配送中' },
  { key: 'completed',  label: '已完成' },
  { key: 'growing',    label: '种植中' }
];

const active = ref(router.params?.active || 'all');
const activeLabel = computed(() => TABS.find(t => t.key === active.value)?.label || '');

const filtered = computed(() => {
  if (active.value === 'all') return orders.value;
  return orders.value.filter(o => o.status === active.value);
});

const counts = computed(() => ({
  pending: orders.value.filter(o => o.status === 'pending').length
}));

onMounted(() => {
  appStore.bootstrap().finally(() => orderStore.fetch());
});

const back = () => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/profile/index' }));
const contact = () => Taro.showToast({ title: '客服 400-8888-666', icon: 'none' });

const toDetail = (o) => {
  Taro.navigateTo({ url: `/pages/order-detail/index?id=${o.id}` })
    .catch(() => Taro.showToast({ title: `打开 ${o.id}`, icon: 'none' }));
};

const cancelOrder = (o) => {
  Taro.showModal({
    title: '取消订单',
    content: `确定取消订单 ${o.id}？`,
    success: async (res) => {
      if (!res.confirm) return;
      Taro.showLoading({ title: '取消中...' });
      try {
        const { cancelOrder: doCancel, ApiError } = await import('@cloud-farm/api-client');
        await doCancel(o.id);
        await orderStore.fetch({ force: true });
        Taro.hideLoading();
        Taro.showToast({ title: '订单已取消', icon: 'success' });
      } catch (e) {
        Taro.hideLoading();
        Taro.showModal({ title: '取消失败', content: e?.message || '请稍后重试', showCancel: false });
      }
    }
  });
};

const payOrder = (o) => {
  Taro.showLoading({ title: '调起支付...' });
  setTimeout(() => {
    Taro.hideLoading();
    Taro.showToast({ title: '支付成功（mock）', icon: 'success' });
  }, 800);
};

const contactCourier = (o) => {
  Taro.showToast({ title: o.logistics?.company || '联系快递', icon: 'none' });
};

const viewLogistics = (o) => {
  Taro.navigateTo({ url: `/pages/order-detail/index?id=${o.id}&tab=logistics` })
    .catch(() => Taro.showToast({ title: '查看物流', icon: 'none' }));
};

const remindShip = (o) => Taro.showToast({ title: '已提醒商家发货', icon: 'success' });
const buyAgain = (o) => Taro.showToast({ title: '已加入购物车', icon: 'success' });
const review = (o) => Taro.showToast({ title: '去写评价（mock）', icon: 'none' });
const goMyPlot = () => Taro.switchTab({ url: '/pages/my-plot/index' });
const goPackages = () => Taro.switchTab({ url: '/pages/packages/index' });
</script>

<style lang="scss" scoped>
.page { min-height: 100%; background: var(--color-bg); padding-bottom: 24px; }

.bar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #fff;
  border-bottom: 1px solid var(--color-divider);
}
.bar-back { font-size: 22px; color: var(--color-text); cursor: pointer; width: 24px; }
.bar-t { flex: 1; text-align: center; font-size: 16px; font-weight: 600; }
.bar-r { font-size: 13px; color: var(--color-primary-dark); cursor: pointer; }

.tabs {
  display: flex; background: #fff; padding: 0 4px;
  border-bottom: 1px solid var(--color-divider);
  overflow-x: auto; white-space: nowrap;
}
.tab {
  flex-shrink: 0; padding: 12px 14px; font-size: 13px;
  color: var(--color-text-sub); position: relative; cursor: pointer;
}
.tab.on { color: var(--color-primary-dark); font-weight: 600; }
.tab.on::after {
  content: ""; position: absolute; left: 50%; bottom: 4px;
  transform: translateX(-50%); width: 20px; height: 2px;
  background: var(--color-primary); border-radius: 2px;
}
.badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 16px; height: 16px; padding: 0 4px; margin-left: 4px;
  background: var(--color-danger); color: #fff;
  font-size: 10px; border-radius: 8px; font-weight: 600;
}

.list { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }

.order {
  background: #fff; border-radius: 14px; padding: 14px;
  box-shadow: var(--shadow-sm); cursor: pointer;
}
.order-h { display: flex; justify-content: space-between; align-items: center; }
.order-type { font-size: 12px; color: var(--color-text-sub); font-weight: 500; }
.order-st { font-size: 13px; font-weight: 600; color: var(--color-primary-dark); }
.order-st.pending { color: var(--color-danger); }
.order-st.delivering { color: #E67E22; }
.order-st.completed { color: var(--color-text-mute); }
.order-st.growing { color: var(--color-primary-dark); }

.order-b {
  display: flex; gap: 12px; margin-top: 12px;
  padding-bottom: 12px; border-bottom: 1px dashed var(--color-divider);
}
.order-c {
  width: 88px; height: 88px; border-radius: 10px; flex-shrink: 0;
  background: var(--color-primary-light); object-fit: cover;
}
.order-info { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.order-t {
  font-size: 14px; font-weight: 500; color: var(--color-text);
  line-height: 1.4;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
}
.order-sub { font-size: 12px; color: var(--color-text-mute); }
.order-meta {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-top: auto;
}
.order-d { font-size: 11px; color: var(--color-text-mute); }
.order-price { font-size: 16px; font-weight: 700; color: var(--color-danger); }
.order-count { font-size: 11px; font-weight: 400; color: var(--color-text-mute); }

.order-tip {
  display: flex; align-items: center; gap: 6px;
  margin-top: 10px; padding: 8px 10px;
  background: #FFF7E6; border-radius: 8px; font-size: 12px; color: #B45309;
}
.tip-hi { color: var(--color-danger); font-weight: 700; }

.order-f {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12px;
}
.order-no { font-size: 11px; color: var(--color-text-mute); }
.order-acts { display: flex; gap: 8px; }
.act {
  font-size: 12px; padding: 6px 14px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--color-border); color: var(--color-text-sub); background: #fff;
}
.act.ghost { background: #fff; }
.act.primary {
  background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff; border-color: transparent;
  font-weight: 600;
}

.empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 24px 32px; gap: 10px;
}
.empty-ic { font-size: 56px; opacity: 0.6; }
.empty-t { font-size: 15px; color: var(--color-text-sub); font-weight: 500; }
.empty-s { font-size: 13px; color: var(--color-text-mute); }
.empty-btn {
  margin-top: 16px; padding: 10px 28px; border-radius: 999px;
  background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 12px rgba(46,125,50,0.28);
}
</style>
