<template>
  <view class="page">
    <!-- 直播画面 -->
    <view class="stage">
      <image :src="current.cover" mode="aspectFill" class="stage-cov" />
      <view class="stage-live" v-if="current.live">● LIVE</view>
      <view class="stage-viewers">👀 {{ current.viewers }}</view>
      <view class="stage-title">{{ current.title }}</view>
    </view>

    <!-- 弹幕 -->
    <view class="chat">
      <view class="chat-msg" v-for="(m, i) in chat" :key="i">
        <text class="chat-u">{{ m.user }}：</text><text class="chat-t">{{ m.text }}</text>
      </view>
    </view>

    <!-- 下单区（小黄车） -->
    <view class="cart">
      <view class="cart-item">
        <text class="cart-ic">🍠</text>
        <view class="cart-info">
          <text class="cart-n">蜜薯 3 斤 · 河南沙土种植</text>
          <text class="cart-p">¥ 9.9 包邮</text>
        </view>
        <view class="cart-btn" @tap="buy">抢购</view>
      </view>
      <view class="cart-item">
        <text class="cart-ic">🥕</text>
        <view class="cart-info">
          <text class="cart-n">水果胡萝卜 5 斤</text>
          <text class="cart-p">¥ 29.9 包邮</text>
        </view>
        <view class="cart-btn" @tap="buy">抢购</view>
      </view>
    </view>

    <!-- 其它直播 -->
    <view class="block">
      <view class="block-h"><text class="block-t">其它直播间</text></view>
      <view class="live-grid">
        <view
          v-for="l in others"
          :key="l.id"
          class="live-card"
          @tap="switchRoom(l)">
          <image :src="l.cover" mode="aspectFill" class="live-cover" />
          <view class="live-badge" v-if="l.live">● LIVE</view>
          <text class="live-title">{{ l.title }}</text>
          <text class="live-sub">👀 {{ l.viewers }}</text>
        </view>
      </view>
    </view>

    <!-- 底部互动栏 -->
    <view style="height: 80px" />
    <view class="footer">
      <view class="f-input">
        <text class="f-placeholder">说点什么…</text>
      </view>
      <view class="f-btn" @tap="like">❤️ {{ likes }}</view>
      <view class="f-btn" @tap="share">📤</view>
    </view>
  </view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { computed, ref } from 'vue';
import { LIVE_ROOMS } from '../../stores/mock';

const router = useRouter();
const current = computed(() => LIVE_ROOMS.find(l => l.id === router.params.id) || LIVE_ROOMS[0]);
const others = computed(() => LIVE_ROOMS.filter(l => l.id !== current.value.id));
const likes = ref(1286);

const chat = ref([
  { user: '北京-宝妈小雅', text: '这红薯真大！好想要' },
  { user: '张老师', text: '孩子们看得津津有味' },
  { user: '上海-Jacky', text: '我的田也在A区吗？' },
  { user: '主播', text: '@Jacky 你的是 A-07，稍后展示' },
  { user: '小王', text: '太治愈了' }
]);

const buy = () => Taro.showToast({ title: '已加入购物车', icon: 'success' });
const like = () => (likes.value += 1);
const share = () => Taro.showToast({ title: '分享海报（mock）', icon: 'none' });
const switchRoom = l => Taro.redirectTo({ url: `/pages/live/index?id=${l.id}` });
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; background: #1B1B1B; min-height: 100vh; }

.stage { position: relative; width: 100%; }
.stage-cov { width: 100%; height: 420px; display: block; }
.stage-live {
  position: absolute; top: 16px; left: 16px; background: var(--color-danger);
  color: #fff; font-size: 12px; padding: 4px 10px; border-radius: 4px; font-weight: 600;
}
.stage-viewers {
  position: absolute; top: 16px; right: 16px;
  background: rgba(0,0,0,0.55); color: #fff; font-size: 12px;
  padding: 4px 10px; border-radius: 999px;
}
.stage-title {
  position: absolute; left: 16px; right: 16px; bottom: 16px;
  color: #fff; font-size: 18px; font-weight: 600;
  text-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.chat {
  padding: 12px 16px; background: #262626;
  max-height: 160px; overflow-y: auto;
}
.chat-msg { padding: 4px 0; font-size: 13px; color: #E5E5E5; }
.chat-u { color: var(--color-accent); }

.cart {
  background: linear-gradient(180deg, #2E2E2E 0%, #1B1B1B 100%);
  padding: 12px; display: flex; flex-direction: column; gap: 10px;
}
.cart-item {
  background: rgba(255,255,255,0.08); border-radius: 10px;
  padding: 10px 12px; display: flex; align-items: center; gap: 10px;
}
.cart-ic { font-size: 28px; width: 48px; height: 48px; background: rgba(255,255,255,0.08); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.cart-info { flex: 1; }
.cart-n { color: #fff; font-size: 14px; display: block; }
.cart-p { color: var(--color-accent); font-size: 13px; font-weight: 700; margin-top: 2px; display: block; }
.cart-btn { background: var(--color-accent); color: #8D6E00; padding: 8px 18px; border-radius: 999px; font-weight: 700; font-size: 13px; }

.block { background: #1B1B1B; padding: 16px; }
.block-h { margin-bottom: 10px; }
.block-t { font-size: 15px; font-weight: 600; color: #fff; }
.live-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.live-card { background: #262626; border-radius: 10px; overflow: hidden; position: relative; padding-bottom: 8px; }
.live-cover { width: 100%; height: 100px; display: block; }
.live-badge { position: absolute; top: 6px; left: 6px; background: var(--color-danger); color: #fff; font-size: 10px; padding: 2px 5px; border-radius: 3px; font-weight: 600; }
.live-title { padding: 6px 8px 0; font-size: 12px; color: #fff; display: block; }
.live-sub { padding: 2px 8px; font-size: 11px; color: #999; display: block; }

.footer { position: fixed; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; padding: 10px 12px; padding-bottom: calc(10px + env(safe-area-inset-bottom, 0)); gap: 8px; align-items: center; z-index: 100; }
.f-input { flex: 1; background: rgba(255,255,255,0.12); color: #fff; padding: 10px 14px; border-radius: 999px; }
.f-placeholder { color: #999; font-size: 13px; }
.f-btn {
  background: rgba(255,255,255,0.1); color: #fff;
  padding: 10px 14px; border-radius: 999px; font-size: 13px;
}
</style>
