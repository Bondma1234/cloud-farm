<template>
  <view class="page">
    <!-- 空态: 未登录 / 未认养 -->
    <EmptyState v-if="store.isEmpty" type="plot" title="还没有种植中的地块" subtitle="先去认养一块田吧">
      <view class="empty-btn" @tap="goPackages">去认养</view>
    </EmptyState>

    <!-- 加载态 -->
    <Skeleton v-else-if="store.loading && !plot" type="card" :count="1" />

    <!-- 错误态 -->
    <EmptyState v-else-if="store.error && !plot" type="error" :title="store.error">
      <view class="empty-btn" @tap="retry">重试</view>
    </EmptyState>

    <template v-else-if="plot">
      <!-- 顶部我的地块信息 -->
      <view class="head">
        <view class="head-top">
          <text class="title">{{ plot.name || plot.crop + ' 田' }}</text>
          <view class="pill">{{ plot.plotId }}</view>
        </view>
        <view class="crop-row">
          <text class="emoji">{{ plot.cropEmoji }}</text>
          <view class="crop-info">
            <text class="crop-name">{{ plot.crop }} · {{ plot.stage }}</text>
            <text class="crop-days">第 {{ plot.daysElapsed }} / {{ plot.daysTotal }} 天</text>
          </view>
          <view class="weather">
            <text class="w-t">{{ plot.weather.temp }}°</text>
            <text class="w-d">{{ plot.weather.cond }}</text>
          </view>
        </view>
        <view class="progress">
          <view class="progress-bar" :style="`width: ${plot.progress}%`" />
        </view>
        <text class="next">⏰ 下一步：{{ plot.nextAction }}</text>
      </view>

      <!-- 摄像头画面 -->
      <view class="live">
        <image :src="store.cameraUrl || '/images/plot-snapshot.jpg'" mode="aspectFill" class="live-img" />
        <view class="live-tag" v-if="plot.camera.online">● 在线</view>
        <view class="live-tag offline" v-else>● 离线</view>
        <view class="live-ctrl" v-if="plot.camera.ptzSupported">
          <view class="ctrl-btn" @tap="onPtz('left')">←</view>
          <view class="ctrl-btn" @tap="onPtz('right')">→</view>
          <view class="ctrl-btn" @tap="onPtz('zoom-in')">🔍</view>
        </view>
        <view class="live-btm">
          <view class="btn-full" @tap="onSnapshot">
            {{ store.snapshotLoading ? '抓拍中...' : '📸 抓拍当前画面' }}
          </view>
        </view>
      </view>

      <!-- 今日指令 -->
      <view class="block">
        <view class="block-h">
          <text class="block-t">田间操作</text>
          <text class="block-more" @tap="goCommands">指令历史 ›</text>
        </view>
        <view class="cmd-grid">
          <view class="cmd" v-for="c in commands" :key="c.key" @tap="sendCmd(c)">
            <text class="cmd-ico">{{ c.icon }}</text>
            <text class="cmd-l">{{ c.label }}</text>
            <text class="cmd-cd">{{ c.cooldown }}</text>
            <text class="cmd-p" v-if="c.price > 0">¥{{ c.price }}</text>
            <text class="cmd-p free" v-else>免费</text>
          </view>
        </view>
      </view>

      <!-- 收获进度 -->
      <view class="block">
        <view class="block-h">
          <text class="block-t">预计收获</text>
        </view>
        <view class="harvest">
          <view class="h-stat">
            <text class="h-n">{{ plot.daysTotal - plot.daysElapsed }}</text>
            <text class="h-l">天后成熟</text>
          </view>
          <view class="h-stat">
            <text class="h-n">约 8 斤</text>
            <text class="h-l">预估产量</text>
          </view>
          <view class="h-stat" @tap="goCommands">
            <text class="h-n">{{ plot.daysElapsed > 30 ? 6 : 2 }} 次</text>
            <text class="h-l">已使用指令 ›</text>
          </view>
        </view>
      </view>

      <view class="block">
        <view class="block-h">
          <text class="block-t">生长日记</text>
          <text class="block-more" @tap="goJournal">查看全部</text>
        </view>
        <text class="muted">这里展示 plot 维度的最近动态(P4-G journal 模块已通,这里可以接 /journal?plotId=)</text>
      </view>

      <view style="height: 40px" />
    </template>
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useMyPlotStore } from '../../stores/myPlot';
import { useCommandStore } from '../../stores/commands';
import { useAppStore, COMMANDS } from '../../stores/mock';
import { createCommand, ApiError } from '@cloud-farm/api-client';
import Skeleton from '../../components/Skeleton.vue';
import EmptyState from '../../components/EmptyState.vue';

const store = useMyPlotStore();
const cmdStore = useCommandStore();
const appStore = useAppStore();
const { plot } = storeToRefs(store);
const commands = COMMANDS;

const sendCmd = async (c) => {
  // "拍张照" 走真摄像头抓拍接口(立即出图,不进工单系统)
  if (c.key === 'shoot') {
    return onSnapshot();
  }
  if (!plot.value?.plotId) {
    Taro.showToast({ title: '没有种植中的地块', icon: 'none' });
    return;
  }
  Taro.showModal({
    title: `确认${c.label}`,
    content: c.price > 0 ? `需支付 ¥${c.price},${c.cooldown}` : `${c.cooldown}`,
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        Taro.showLoading({ title: '提交中…' });
        await createCommand({
          type: c.key,
          plotId: plot.value.plotId,
        });
        Taro.hideLoading();
        Taro.showToast({ title: `${c.label}指令已下单`, icon: 'success' });
        // 刷新指令历史 store,用户进 /commands 能立即看到
        cmdStore.fetch({ force: true }).catch(() => {});
      } catch (e) {
        Taro.hideLoading();
        const msg = e instanceof ApiError ? `${e.message}` : (e?.message || '下单失败');
        Taro.showToast({ title: msg, icon: 'none' });
      }
    }
  });
};

const onPtz = async (dir) => {
  try {
    await store.ptz(dir);
    Taro.showToast({ title: `摄像头 ${dir}`, icon: 'success' });
  } catch (e) {
    Taro.showToast({ title: e?.message || 'PTZ 失败', icon: 'none' });
  }
};

const onSnapshot = async () => {
  if (store.snapshotLoading) return;
  try {
    const r = await store.snapshot();
    if (r) {
      // 把抓拍图设为新的"摄像头画面"(让用户立刻看到结果)
      store.cameraUrl = r.url;
      Taro.showToast({ title: '已抓拍并加入生长日记', icon: 'success' });
    }
  } catch (e) {
    Taro.showToast({ title: e?.message || '抓拍失败', icon: 'none' });
  }
};

const retry = () => store.fetch({ force: true });

const goJournal = () => Taro.navigateTo({ url: `/pages/journal/index${plot.value?.plotId ? '?plotId=' + plot.value.plotId : ''}` });
const goCommands = () => Taro.navigateTo({ url: '/pages/commands/index' });
const goPackages = () => Taro.switchTab({ url: '/pages/packages/index' }).catch(() => Taro.navigateTo({ url: '/pages/packages/index' }));

onMounted(async () => {
  await appStore.bootstrap();
  await store.fetch();
});
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; }

.empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 24px;
}
.empty-ic { font-size: 60px; margin-bottom: 16px; }
.empty-t { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.empty-s { font-size: 13px; color: var(--color-text-mute); margin-bottom: 20px; }
.empty-btn {
  background: var(--color-primary); color: #fff;
  padding: 10px 28px; border-radius: 999px; font-size: 14px; font-weight: 600;
}

.loading { padding: 80px 0; text-align: center; color: var(--color-text-mute); }

.head {
  background: linear-gradient(135deg, #4CA777 0%, #2E7D32 100%);
  color: #fff; padding: 16px 18px 20px; margin-bottom: 10px;
}
.head-top { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 18px; font-weight: 600; }
.pill { background: rgba(255,255,255,0.22); color: #fff; font-size: 11px; padding: 2px 10px; border-radius: 999px; }

.crop-row { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.emoji { font-size: 44px; }
.crop-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.crop-name { font-size: 15px; font-weight: 600; }
.crop-days { font-size: 12px; opacity: 0.88; }
.weather { text-align: right; }
.w-t { font-size: 20px; font-weight: 700; display: block; }
.w-d { font-size: 11px; opacity: 0.88; }

.progress {
  height: 6px; background: rgba(255,255,255,0.25);
  border-radius: 999px; margin-top: 14px; overflow: hidden;
}
.progress-bar { height: 100%; background: #F4B942; border-radius: 999px; transition: width 0.6s; }
.next { font-size: 12px; margin-top: 10px; display: block; opacity: 0.92; }

.live { margin: 0 16px 10px; position: relative; border-radius: 16px; overflow: hidden; background: #000; }
.live-img { width: 100%; height: 220px; display: block; }
.live-tag {
  position: absolute; top: 12px; left: 12px;
  background: var(--color-danger); color: #fff; font-size: 11px;
  padding: 3px 8px; border-radius: 4px; font-weight: 600;
}
.live-tag.offline { background: #999; }
.live-ctrl {
  position: absolute; right: 12px; top: 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.ctrl-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(0,0,0,0.5); color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.live-btm { position: absolute; left: 12px; right: 12px; bottom: 12px; }
.btn-full {
  background: rgba(255,255,255,0.92); color: var(--color-primary-dark);
  text-align: center; padding: 8px; border-radius: 999px; font-size: 13px; font-weight: 600;
}

.block { background: #fff; margin: 10px 16px; border-radius: 12px; padding: 14px 16px; }
.block-h { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.block-t { font-size: 15px; font-weight: 600; }
.block-d { font-size: 11px; color: var(--color-text-mute); }
.block-more { font-size: 12px; color: var(--color-primary-dark); }

.muted { font-size: 12px; color: var(--color-text-mute); display: block; }

.cmd-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
.cmd {
  background: var(--color-surface-alt); border-radius: 10px;
  padding: 12px 4px; display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.cmd-ico { font-size: 24px; }
.cmd-l { font-size: 12px; font-weight: 500; margin-top: 2px; }
.cmd-cd { font-size: 10px; color: var(--color-text-mute); }
.cmd-p { font-size: 11px; color: var(--color-danger); font-weight: 600; }
.cmd-p.free { color: var(--color-primary-dark); }

.harvest { display: flex; gap: 8px; }
.h-stat { flex: 1; background: var(--color-surface-alt); border-radius: 10px; padding: 14px 8px; text-align: center; }
.h-n { font-size: 18px; font-weight: 700; color: var(--color-primary-dark); display: block; }
.h-l { font-size: 11px; color: var(--color-text-mute); margin-top: 2px; }
</style>
