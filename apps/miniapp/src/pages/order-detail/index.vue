<template>
  <view class="page" v-if="order">
    <!-- 顶部 -->
    <view class="bar">
      <text class="bar-back" @tap="back">‹</text>
      <text class="bar-t">订单详情</text>
      <text class="bar-r" @tap="contact">客服</text>
    </view>

    <!-- 状态大卡 -->
    <view :class="['status', order.status]">
      <view class="status-ic">{{ statusMeta.icon }}</view>
      <view class="status-body">
        <text class="status-t">{{ order.statusLabel }}</text>
        <text class="status-s">{{ statusMeta.tip }}</text>
      </view>
      <view v-if="order.status === 'pending' && order.expireIn" class="status-cd">
        {{ order.expireIn }}
      </view>
    </view>

    <!-- 地址 -->
    <view class="card address" v-if="address">
      <view class="addr-ic">📍</view>
      <view class="addr-body">
        <view class="addr-h">
          <text class="addr-n">{{ address.name }}</text>
          <text class="addr-p">{{ address.phone }}</text>
          <view class="addr-tag" v-if="address.tag">{{ address.tag }}</view>
        </view>
        <text class="addr-d">
          {{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}
        </text>
      </view>
    </view>

    <!-- 商品 -->
    <view class="card">
      <view class="card-h">
        <text class="card-t">{{ order.type }}商品</text>
      </view>
      <view class="item">
        <image class="item-c" :src="order.cover" mode="aspectFill" />
        <view class="item-info">
          <text class="item-t">{{ order.title }}</text>
          <view class="item-tags" v-if="order.subItems">
            <view class="item-tag" v-for="(s, i) in order.subItems" :key="i">
              {{ s.label }}：{{ s.value }}
            </view>
          </view>
          <view class="item-meta">
            <text class="item-p">¥{{ order.price }}</text>
            <text class="item-x">× {{ order.count }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 时间线（认养/种植） -->
    <view class="card" v-if="order.timeline && order.timeline.length">
      <view class="card-h">
        <text class="card-t">成长时间线</text>
      </view>
      <view class="tl">
        <view :class="['tl-i', n.done && 'done']" v-for="(n, i) in order.timeline" :key="i">
          <view class="tl-dot" />
          <view class="tl-body">
            <text class="tl-e">{{ n.event }}</text>
            <text class="tl-d">{{ n.at }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 物流 -->
    <view class="card" v-if="order.logistics">
      <view class="card-h">
        <text class="card-t">物流信息</text>
        <text class="card-s">{{ order.logistics.company }} · {{ order.logistics.no }}</text>
      </view>
      <view class="tl">
        <view :class="['tl-i', i === 0 && 'current', 'done']" v-for="(n, i) in order.logistics.nodes" :key="i">
          <view class="tl-dot" />
          <view class="tl-body">
            <text class="tl-e">{{ n.node }}</text>
            <text class="tl-d">{{ n.at }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 费用 -->
    <view class="card">
      <view class="card-h"><text class="card-t">费用明细</text></view>
      <view class="fee">
        <view class="fee-r"><text>商品金额</text><text>¥{{ order.price * order.count }}</text></view>
        <view class="fee-r"><text>运费</text><text>¥0.00</text></view>
        <view class="fee-r" v-if="order.type === '认养'"><text>地块服务费</text><text>已含</text></view>
        <view class="fee-r mute"><text>优惠券</text><text>-¥0.00</text></view>
        <view class="fee-total">
          <text>实付</text>
          <text class="fee-total-v">¥{{ order.price * order.count }}</text>
        </view>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="card">
      <view class="card-h"><text class="card-t">订单信息</text></view>
      <view class="info-r"><text class="info-l">订单编号</text><text class="info-v">{{ order.id }}</text><text class="info-copy" @tap="copyId">复制</text></view>
      <view class="info-r"><text class="info-l">下单时间</text><text class="info-v">{{ order.date }} 10:23</text></view>
      <view class="info-r" v-if="order.status === 'completed'"><text class="info-l">完成时间</text><text class="info-v">{{ order.date }} 16:40</text></view>
    </view>

    <view style="height: 80px" />

    <!-- 底部操作栏 -->
    <view class="foot">
      <view class="foot-l">
        <text class="foot-total">合计 <text class="foot-p">¥{{ order.price * order.count }}</text></text>
      </view>
      <view class="foot-r">
        <template v-if="order.status === 'pending'">
          <view class="act ghost" @tap="cancelOrder">取消</view>
          <view class="act primary" @tap="payOrder">去支付</view>
        </template>
        <template v-else-if="order.status === 'delivering'">
          <view class="act ghost" @tap="contactCourier">联系快递</view>
          <view class="act primary" @tap="confirmReceive">确认收货</view>
        </template>
        <template v-else-if="order.status === 'growing'">
          <view class="act ghost" @tap="after">售后</view>
          <view class="act primary" @tap="goMyPlot">去我的田</view>
        </template>
        <template v-else-if="order.status === 'completed'">
          <view class="act ghost" @tap="buyAgain">再来一单</view>
          <view class="act primary" v-if="order.canReview" @tap="review">评价晒单</view>
        </template>
        <template v-else>
          <view class="act ghost" @tap="contact">联系客服</view>
        </template>
      </view>
    </view>
  </view>

  <view v-else class="page empty">
    <view class="empty-ic">🔍</view>
    <text class="empty-t">订单不存在或已失效</text>
    <view class="empty-btn" @tap="back">返回</view>
  </view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { computed, onMounted, ref } from 'vue';
import { useAppStore } from '../../stores/mock';
import { useOrderStore } from '../../stores/orders';
import { cancelOrder as apiCancelOrder, ApiError } from '@cloud-farm/api-client';
import { showSuccess } from '../../components/SuccessOverlay.vue';

const router = useRouter();
const store = useAppStore();
const orderStore = useOrderStore();
const orderId = computed(() => router.params?.id || '');

const order = ref(null);
const paying = ref(false);

const address = computed(() => {
  if (!order.value?.addressId) return null;
  return store.addresses.find(a => a.id === order.value.addressId);
});

onMounted(async () => {
  await store.bootstrap();
  // 如果 list 已经在(从 orders 页跳过来),先 fetch 占位
  if (!orderStore.list.length) await orderStore.fetch();
  order.value = await orderStore.fetchOne(orderId.value);
});

const STATUS_MAP = {
  pending:    { icon: '⏰', tip: '订单已提交，请尽快完成支付' },
  shipped:    { icon: '📦', tip: '商家正在备货，请耐心等待' },
  delivering: { icon: '🚚', tip: '包裹已发出，正在派送中' },
  completed:  { icon: '✅', tip: '交易完成，感谢您的支持' },
  growing:    { icon: '🌱', tip: '作物长势良好，您的小田正在努力生长' },
  cancelled:  { icon: '🚫', tip: '订单已取消' }
};
const statusMeta = computed(() => STATUS_MAP[order.value?.status] || { icon: '📋', tip: '' });

const back = () => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/profile/index' }));
const contact = () => Taro.showToast({ title: '客服 400-8888-666', icon: 'none' });

const copyId = () => {
  Taro.setClipboardData?.({ data: orderId.value }).catch(() => {});
  Taro.showToast({ title: '已复制单号', icon: 'success' });
};

const cancelOrder = () => Taro.showModal({
  title: '取消订单',
  content: '确定要取消该订单吗?',
  success: async (res) => {
    if (!res.confirm || !order.value) return;
    try {
      Taro.showLoading({ title: '提交中…' });
      const updated = await apiCancelOrder(order.value.id);
      order.value = updated;
      // 同步 list
      const idx = orderStore.list.findIndex(o => o.id === updated.id);
      if (idx >= 0) orderStore.list[idx] = updated;
      Taro.hideLoading();
      Taro.showToast({ title: '订单已取消', icon: 'success' });
    } catch (e) {
      Taro.hideLoading();
      const msg = e instanceof ApiError ? e.message : (e?.message || '取消失败');
      Taro.showToast({ title: msg, icon: 'none' });
    }
  }
});

const payOrder = async () => {
  if (!order.value || paying.value) return;
  paying.value = true;
  Taro.showLoading({ title: '调起支付…' });
  try {
    // MVP mock 直接调后端 pay,真接微信支付时这里换 wx.requestPayment
    const updated = await orderStore.pay(order.value.id);
    order.value = updated;
    Taro.hideLoading();
    // P8 D2: 支付成功反馈动画
    showSuccess({
      title: '支付成功',
      subtitle: `状态变更:${updated.statusLabel}`,
      emoji: updated.status === 'growing' ? '🌱' : '🎉',
      duration: 1500,
    });
  } catch (e) {
    Taro.hideLoading();
    const msg = e instanceof ApiError ? e.message : (e?.message || '支付失败');
    Taro.showToast({ title: msg, icon: 'none' });
  } finally {
    paying.value = false;
  }
};

const contactCourier = () => Taro.showToast({ title: order.value?.logistics?.company || '联系快递', icon: 'none' });
const confirmReceive = () => Taro.showModal({
  title: '确认收货',
  content: '请确认您已收到商品且无质量问题',
  success: (res) => { if (res.confirm) Taro.showToast({ title: '已确认收货', icon: 'success' }); }
});
const after = () => Taro.showToast({ title: '售后服务，请联系客服', icon: 'none' });
const goMyPlot = () => Taro.switchTab({ url: '/pages/my-plot/index' });
const buyAgain = () => Taro.showToast({ title: '已加入购物车', icon: 'success' });
const review = () => Taro.showToast({ title: '去写评价（mock）', icon: 'none' });
</script>

<style lang="scss" scoped>
.page { min-height: 100%; background: var(--color-bg); padding-bottom: 32px; }

.bar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #fff;
  border-bottom: 1px solid var(--color-divider);
}
.bar-back { font-size: 22px; color: var(--color-text); cursor: pointer; width: 24px; }
.bar-t { flex: 1; text-align: center; font-size: 16px; font-weight: 600; }
.bar-r { font-size: 13px; color: var(--color-primary-dark); cursor: pointer; }

.status {
  display: flex; align-items: center; gap: 14px;
  padding: 22px 20px; color: #fff;
  background: linear-gradient(135deg, #4CA777, #2E7D32);
}
.status.pending { background: linear-gradient(135deg, #E67E22, #C0392B); }
.status.delivering { background: linear-gradient(135deg, #3498DB, #1F5F9E); }
.status.completed { background: linear-gradient(135deg, #7F8C8D, #4A5859); }
.status-ic { font-size: 38px; }
.status-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.status-t { font-size: 18px; font-weight: 700; }
.status-s { font-size: 12px; opacity: 0.9; line-height: 1.5; }
.status-cd {
  background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 999px;
  font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums;
}

.card {
  background: #fff; margin: 12px 16px 0; border-radius: 12px;
  padding: 14px 16px; box-shadow: var(--shadow-sm);
}
.card-h {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 10px;
}
.card-t { font-size: 14px; font-weight: 600; color: var(--color-text); }
.card-s { font-size: 11px; color: var(--color-text-mute); }

.address { display: flex; gap: 12px; }
.addr-ic { font-size: 24px; }
.addr-body { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.addr-h { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.addr-n { font-size: 15px; font-weight: 600; }
.addr-p { font-size: 13px; color: var(--color-text-sub); }
.addr-tag {
  font-size: 10px; padding: 1px 6px; border-radius: 4px;
  background: var(--color-primary-light); color: var(--color-primary-dark);
}
.addr-d { font-size: 13px; color: var(--color-text-sub); line-height: 1.6; }

.item { display: flex; gap: 12px; }
.item-c { width: 88px; height: 88px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.item-info { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.item-t { font-size: 14px; font-weight: 500; line-height: 1.4; }
.item-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.item-tag {
  font-size: 11px; padding: 2px 8px; border-radius: 4px;
  background: var(--color-surface-alt); color: var(--color-text-sub);
}
.item-meta { display: flex; justify-content: space-between; align-items: baseline; margin-top: auto; }
.item-p { font-size: 16px; font-weight: 700; color: var(--color-danger); }
.item-x { font-size: 12px; color: var(--color-text-mute); }

.tl { padding-left: 8px; }
.tl-i {
  position: relative; padding: 0 0 16px 20px;
  border-left: 2px dashed var(--color-divider);
}
.tl-i:last-child { border-left-color: transparent; padding-bottom: 0; }
.tl-i.done { border-left-color: var(--color-primary); border-left-style: solid; }
.tl-dot {
  position: absolute; left: -5px; top: 2px;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-divider); border: 2px solid #fff;
}
.tl-i.done .tl-dot { background: var(--color-primary); }
.tl-i.current .tl-dot { width: 12px; height: 12px; left: -7px; box-shadow: 0 0 0 3px rgba(76,167,119,0.2); }
.tl-body { display: flex; flex-direction: column; gap: 2px; }
.tl-e { font-size: 13px; color: var(--color-text); }
.tl-i:not(.done) .tl-e { color: var(--color-text-mute); }
.tl-i.current .tl-e { font-weight: 600; color: var(--color-primary-dark); }
.tl-d { font-size: 11px; color: var(--color-text-mute); }

.fee { display: flex; flex-direction: column; gap: 8px; }
.fee-r { display: flex; justify-content: space-between; font-size: 13px; color: var(--color-text-sub); }
.fee-r.mute { color: var(--color-text-mute); }
.fee-total {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-top: 10px; margin-top: 4px;
  border-top: 1px dashed var(--color-divider);
  font-size: 13px;
}
.fee-total-v { font-size: 18px; font-weight: 700; color: var(--color-danger); }

.info-r {
  display: flex; align-items: center; padding: 8px 0; gap: 12px;
  font-size: 13px; border-bottom: 1px solid var(--color-divider);
}
.info-r:last-child { border-bottom: none; }
.info-l { color: var(--color-text-mute); min-width: 72px; }
.info-v { flex: 1; color: var(--color-text); word-break: break-all; }
.info-copy {
  font-size: 12px; color: var(--color-primary-dark); cursor: pointer;
  padding: 2px 8px; border: 1px solid var(--color-primary); border-radius: 999px;
}

.foot {
  position: fixed; left: 0; right: 0; bottom: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; padding-bottom: calc(10px + env(safe-area-inset-bottom, 0));
  background: #fff; box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
  z-index: 10;
}
.foot-total { font-size: 13px; color: var(--color-text-sub); }
.foot-p { font-size: 18px; font-weight: 700; color: var(--color-danger); margin-left: 4px; }
.foot-r { display: flex; gap: 8px; }
.act {
  font-size: 13px; padding: 8px 18px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--color-border); color: var(--color-text-sub); background: #fff;
}
.act.primary {
  background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff;
  border-color: transparent; font-weight: 600;
}

.empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 120px 24px; gap: 12px;
}
.empty-ic { font-size: 56px; opacity: 0.6; }
.empty-t { font-size: 14px; color: var(--color-text-mute); }
.empty-btn {
  margin-top: 12px; padding: 10px 28px; border-radius: 999px;
  background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
}
</style>
