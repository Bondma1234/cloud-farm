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
          <!-- U2a: 生长进度环 -->
          <view class="ring">
            <svg viewBox="0 0 72 72" class="ring-svg">
              <circle class="ring-bg" cx="36" cy="36" r="32" />
              <circle
                class="ring-fg" cx="36" cy="36" r="32"
                :stroke-dasharray="ringCirc"
                :stroke-dashoffset="ringOffset"
              />
            </svg>
            <view class="ring-center">
              <text class="ring-emoji">{{ plot.cropEmoji }}</text>
              <text class="ring-pct">{{ plot.progress }}%</text>
            </view>
          </view>
          <view class="crop-info">
            <text class="crop-name">{{ plot.crop }} · {{ plot.stage }}</text>
            <text class="crop-days">第 {{ plot.daysElapsed }} / {{ plot.daysTotal }} 天</text>
            <text class="next">⏰ {{ plot.nextAction }}</text>
          </view>
          <view class="weather">
            <text class="w-t">{{ plot.weather.temp }}°</text>
            <text class="w-d">{{ plot.weather.cond }}</text>
          </view>
        </view>

        <!-- U2a: 生长阶段指示器 -->
        <view class="stages">
          <view
            v-for="(s, i) in STAGES"
            :key="s.key"
            :class="['stage', i <= currentStageIdx && 'done', i === currentStageIdx && 'current']"
          >
            <view class="stage-dot">{{ s.icon }}</view>
            <text class="stage-l">{{ s.label }}</text>
            <view v-if="i < STAGES.length - 1" class="stage-line" />
          </view>
        </view>
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
          <text class="block-more" @tap="goJournal">查看全部 ›</text>
        </view>
        <view v-if="journalLoading" class="muted">加载中…</view>
        <view v-else-if="plotJournal.length" class="timeline">
          <view class="tl-item" v-for="(j, i) in plotJournal" :key="j.id">
            <view class="tl-rail">
              <view class="tl-dot">{{ j.icon }}</view>
              <view v-if="i < plotJournal.length - 1" class="tl-line" />
            </view>
            <view class="tl-body">
              <text class="tl-title">{{ j.title }}</text>
              <text class="tl-sum">{{ j.summary }}</text>
              <image v-if="j.photos && j.photos.length" :src="j.photos[0]" mode="aspectFill" class="tl-photo" />
            </view>
          </view>
        </view>
        <text v-else class="muted">这块田还没有动态,发个指令让农技员来打理吧 🌱</text>
      </view>

      <view style="height: 40px" />
    </template>
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMyPlotStore } from '../../stores/myPlot';
import { useCommandStore } from '../../stores/commands';
import { useAppStore, COMMANDS } from '../../stores/mock';
import { createCommand, listJournal, ApiError } from '@cloud-farm/api-client';
import Skeleton from '../../components/Skeleton.vue';
import EmptyState from '../../components/EmptyState.vue';

const store = useMyPlotStore();
const cmdStore = useCommandStore();
const appStore = useAppStore();
const { plot } = storeToRefs(store);
const commands = COMMANDS;

// U2b: 该地块的生长日记(最近 5 条)
const plotJournal = ref([]);
const journalLoading = ref(false);
async function loadPlotJournal() {
  if (!plot.value?.plotId) return;
  journalLoading.value = true;
  try {
    const list = await listJournal({ plotId: plot.value.plotId });
    plotJournal.value = list.slice(0, 5);
  } catch {
    plotJournal.value = [];
  } finally {
    journalLoading.value = false;
  }
}

// U2a: 生长进度环(SVG circle r=32 周长)
const RING_R = 32;
const ringCirc = 2 * Math.PI * RING_R;
const ringOffset = computed(() => {
  const p = Math.max(0, Math.min(100, plot.value?.progress || 0));
  return ringCirc * (1 - p / 100);
});

// U2a: 生长阶段(4 段)+ 当前阶段判定(按 progress / stage 名)
const STAGES = [
  { key: 'sprout',  icon: '🌱', label: '发芽' },
  { key: 'bloom',   icon: '🌸', label: '开花' },
  { key: 'fruit',   icon: '🍅', label: '结果' },
  { key: 'harvest', icon: '🎉', label: '收获' },
];
const currentStageIdx = computed(() => {
  const stage = plot.value?.stage || '';
  const p = plot.value?.progress || 0;
  // 优先按 stage 名匹配,兜底按 progress 百分比
  if (/收获/.test(stage)) return 3;
  if (/坐果|结果|果/.test(stage)) return 2;
  if (/开花|花/.test(stage)) return 1;
  if (/发芽|苗|幼/.test(stage)) return 0;
  if (p >= 85) return 3;
  if (p >= 55) return 2;
  if (p >= 25) return 1;
  return 0;
});

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
      loadPlotJournal();   // U2b: 刷新时间线
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
  loadPlotJournal();
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

.crop-row { display: flex; align-items: center; gap: 14px; margin-top: 16px; }

/* U2a 进度环 */
.ring { position: relative; width: 72px; height: 72px; flex-shrink: 0; }
.ring-svg { width: 72px; height: 72px; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: rgba(255,255,255,0.22); stroke-width: 6; }
.ring-fg {
  fill: none; stroke: #F4B942; stroke-width: 6; stroke-linecap: round;
  transition: stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1);
}
.ring-center {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0;
}
.ring-emoji { font-size: 22px; line-height: 1; }
.ring-pct { font-size: 11px; font-weight: 700; margin-top: 1px; }

.crop-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.crop-name { font-size: 15px; font-weight: 600; }
.crop-days { font-size: 12px; opacity: 0.88; }
.crop-info .next { font-size: 11px; opacity: 0.92; margin-top: 2px; }
.weather { text-align: right; flex-shrink: 0; }
.w-t { font-size: 20px; font-weight: 700; display: block; }
.w-d { font-size: 11px; opacity: 0.88; }

/* U2a 生长阶段指示器 */
.stages { display: flex; margin-top: 18px; }
.stage { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; position: relative; }
.stage-dot {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(255,255,255,0.18); color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 17px;
  filter: grayscale(0.6); opacity: 0.6;
  transition: all 0.3s; z-index: 1;
}
.stage.done .stage-dot { background: rgba(255,255,255,0.95); filter: none; opacity: 1; }
.stage.current .stage-dot {
  background: #F4B942; filter: none; opacity: 1;
  box-shadow: 0 0 0 4px rgba(244,185,66,0.3);
  transform: scale(1.12);
}
.stage-l { font-size: 11px; opacity: 0.85; }
.stage.done .stage-l, .stage.current .stage-l { opacity: 1; font-weight: 600; }
.stage-line {
  position: absolute; top: 17px; left: 50%; width: 100%; height: 2px;
  background: rgba(255,255,255,0.22); z-index: 0;
}
.stage.done .stage-line { background: rgba(255,255,255,0.85); }

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

/* U2b 生长日记时间线 */
.timeline { display: flex; flex-direction: column; }
.tl-item { display: flex; gap: 12px; }
.tl-rail { display: flex; flex-direction: column; align-items: center; width: 36px; flex-shrink: 0; }
.tl-dot {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--color-primary-light);
  display: flex; align-items: center; justify-content: center; font-size: 18px;
  flex-shrink: 0; z-index: 1;
}
.tl-line { flex: 1; width: 2px; background: var(--color-divider); margin: 2px 0; min-height: 12px; }
.tl-body { flex: 1; padding-bottom: 16px; min-width: 0; }
.tl-title { font-size: 14px; font-weight: 600; display: block; }
.tl-sum { font-size: 12px; color: var(--color-text-mute); display: block; margin-top: 2px; line-height: 1.5; }
.tl-photo { width: 100%; height: 120px; border-radius: 8px; margin-top: 8px; display: block; object-fit: cover; }
.tl-item:last-child .tl-body { padding-bottom: 0; }
</style>
