<template>
  <view class="page">
    <template v-if="current">
      <!-- 直击画面 -->
      <view class="stage">
        <image :src="current.cover" mode="aspectFill" class="stage-cov" />
        <view class="stage-mask" />
        <view class="stage-live" v-if="current.live">● 直击中</view>
        <view class="stage-live replay" v-else>回放</view>
        <view class="stage-viewers">👀 {{ current.viewers }} 在看</view>
        <view class="stage-foot">
          <text class="stage-title">{{ current.title }}</text>
          <text class="stage-loc">📍 {{ current.location }}</text>
        </view>
      </view>

      <!-- 场景信息(农场直击:出镜农技员 + 这块地在做什么)-->
      <view class="info">
        <view class="info-row">
          <view class="host">
            <text class="host-av">🧑‍🌾</text>
            <view class="host-meta">
              <text class="host-n">{{ current.host }}</text>
              <text class="host-t">出镜 · 当前作物 {{ current.cropName }}</text>
            </view>
          </view>
          <view class="follow" @tap="subscribe">＋ 关注</view>
        </view>
        <text class="info-scene">{{ current.scene }}</text>
      </view>

      <!-- 认养引导(替代原直播带货小黄车)-->
      <view class="adopt">
        <view class="adopt-l">
          <text class="adopt-t">喜欢这片田?</text>
          <text class="adopt-s">认养一块,远程看着它长大 · 收获直送到家</text>
        </view>
        <view class="adopt-btn" @tap="goAdopt">去认养 ›</view>
      </view>

      <!-- 更多直击 -->
      <view class="block">
        <view class="block-h"><text class="block-t">更多农场直击</text></view>
        <view class="live-grid cf-stagger">
          <view
            v-for="l in others"
            :key="l.id"
            class="live-card"
            @tap="switchRoom(l)">
            <image :src="l.cover" mode="aspectFill" class="live-cover" />
            <view class="live-badge" v-if="l.live">● 直击</view>
            <view class="live-badge replay" v-else>回放</view>
            <text class="live-title">{{ l.title }}</text>
            <text class="live-sub">👀 {{ l.viewers }} · {{ l.host }}</text>
          </view>
        </view>
      </view>

      <view style="height: 80px" />

      <!-- 底部互动栏(去掉带货输入框,改分享 / 认养引导)-->
      <view class="footer">
        <view class="f-like" @tap="like">
          <text :class="['f-like-ic', liking && 'bump']">❤️</text>
          <text>{{ likes }}</text>
        </view>
        <view class="f-act" @tap="share">📤 分享</view>
        <view class="f-cta" @tap="goAdopt">看认养套餐</view>
      </view>
    </template>

    <!-- 加载态 -->
    <view v-else class="loading">加载中…</view>
  </view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useLiveStore } from '../../stores/live';

const router = useRouter();
const liveStore = useLiveStore();
const { list } = storeToRefs(liveStore);

const current = computed(() =>
  list.value.find(l => l.id === router.params.id) || list.value[0]
);
const others = computed(() =>
  current.value ? list.value.filter(l => l.id !== current.value.id) : []
);

const likes = ref(1286);
const liking = ref(false);

onMounted(() => liveStore.fetch());

const like = () => {
  likes.value += 1;
  liking.value = true;
  setTimeout(() => { liking.value = false; }, 400);
};
const subscribe = () => Taro.showToast({ title: '已关注,开播提醒你', icon: 'success' });
const share = () => Taro.showToast({ title: '分享海报（mock）', icon: 'none' });
const goAdopt = () => Taro.switchTab({ url: '/pages/packages/index' })
  .catch(() => Taro.navigateTo({ url: '/pages/packages/index' }).catch(() => {}));
const switchRoom = l => Taro.redirectTo({ url: `/pages/live/index?id=${l.id}` });
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; background: #1B1B1B; min-height: 100vh; }

.loading { padding: 120px 0; text-align: center; color: #888; font-size: var(--fs-md); }

.stage { position: relative; width: 100%; }
.stage-cov { width: 100%; height: 420px; display: block; }
.stage-mask {
  position: absolute; left: 0; right: 0; bottom: 0; height: 120px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
}
.stage-live {
  position: absolute; top: 16px; left: 16px; background: var(--color-danger);
  color: #fff; font-size: var(--fs-sm); padding: 4px 10px; border-radius: 4px; font-weight: 600;
}
.stage-live.replay { background: rgba(0,0,0,0.55); }
.stage-viewers {
  position: absolute; top: 16px; right: 16px;
  background: rgba(0,0,0,0.55); color: #fff; font-size: var(--fs-sm);
  padding: 4px 10px; border-radius: 999px;
}
.stage-foot { position: absolute; left: 16px; right: 16px; bottom: 14px; }
.stage-title {
  color: #fff; font-size: var(--fs-xl); font-weight: 700; display: block;
  text-shadow: 0 2px 6px rgba(0,0,0,0.4);
}
.stage-loc { color: rgba(255,255,255,0.85); font-size: var(--fs-sm); margin-top: 4px; display: block; }

/* 场景信息 */
.info { background: #262626; padding: 14px 16px; }
.info-row { display: flex; align-items: center; justify-content: space-between; }
.host { display: flex; align-items: center; gap: 10px; }
.host-av {
  width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center; font-size: 20px;
}
.host-meta { display: flex; flex-direction: column; gap: 2px; }
.host-n { color: #fff; font-size: var(--fs-base); font-weight: 600; }
.host-t { color: #999; font-size: var(--fs-xs); }
.follow {
  background: var(--color-primary); color: #fff;
  font-size: var(--fs-sm); font-weight: 600; padding: 6px 16px; border-radius: 999px;
}
.info-scene { color: #ccc; font-size: var(--fs-md); line-height: var(--lh-normal); margin-top: 10px; display: block; }

/* 认养引导 */
.adopt {
  margin: 12px 16px; padding: 14px 16px; border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #4CA777, #2E7D32);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.adopt-l { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.adopt-t { color: #fff; font-size: var(--fs-base); font-weight: 700; }
.adopt-s { color: rgba(255,255,255,0.85); font-size: var(--fs-xs); }
.adopt-btn {
  flex-shrink: 0; background: #fff; color: var(--color-primary-dark);
  font-size: var(--fs-sm); font-weight: 700; padding: 9px 16px; border-radius: 999px;
}

.block { padding: 16px; }
.block-h { margin-bottom: 10px; }
.block-t { font-size: var(--fs-base); font-weight: 600; color: #fff; }
.live-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.live-card { background: #262626; border-radius: var(--radius-md); overflow: hidden; position: relative; padding-bottom: 8px; }
.live-cover { width: 100%; height: 100px; display: block; }
.live-badge { position: absolute; top: 6px; left: 6px; background: var(--color-danger); color: #fff; font-size: var(--fs-xs); padding: 2px 6px; border-radius: 3px; font-weight: 600; }
.live-badge.replay { background: rgba(0,0,0,0.6); }
.live-title { padding: 6px 8px 0; font-size: var(--fs-sm); color: #fff; display: block; }
.live-sub { padding: 2px 8px; font-size: var(--fs-xs); color: #999; display: block; }

.footer {
  position: fixed; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9);
  display: flex; padding: 10px 12px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0));
  gap: 10px; align-items: center; z-index: 100;
}
.f-like {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.12); color: #fff;
  padding: 10px 16px; border-radius: 999px; font-size: var(--fs-md);
}
.f-like-ic { display: inline-block; }
.f-like-ic.bump { animation: like-bump 0.4s var(--ease-spring); }
@keyframes like-bump {
  0% { transform: scale(1); }
  40% { transform: scale(1.5); }
  100% { transform: scale(1); }
}
.f-act {
  background: rgba(255,255,255,0.12); color: #fff;
  padding: 10px 16px; border-radius: 999px; font-size: var(--fs-md);
}
.f-cta {
  flex: 1; text-align: center;
  background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff;
  padding: 10px; border-radius: 999px; font-size: var(--fs-md); font-weight: 600;
}
</style>
