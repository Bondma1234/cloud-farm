<template>
  <view class="page">
    <!-- 顶部我的地块信息 -->
    <view class="head">
      <view class="head-top">
        <text class="title">{{ plot.name }}</text>
        <view class="pill">{{ plot.id }}</view>
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

    <!-- 直播画面 -->
    <view class="live">
      <image :src="plot.snapshot" mode="aspectFill" class="live-img" />
      <view class="live-tag" v-if="plot.cameraOnline">● 在线</view>
      <view class="live-ctrl">
        <view class="ctrl-btn" @tap="ptz('left')">←</view>
        <view class="ctrl-btn" @tap="ptz('right')">→</view>
        <view class="ctrl-btn" @tap="ptz('zoom')">🔍</view>
      </view>
      <view class="live-btm">
        <view class="btn-full" @tap="openLive">📺 观看完整直播</view>
      </view>
    </view>

    <!-- 今日指令 -->
    <view class="block">
      <view class="block-h">
        <text class="block-t">田间操作</text>
        <text class="block-d">指令会推送到农技员，完成后自动回传照片</text>
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

    <!-- 生长时间轴 -->
    <view class="block">
      <view class="block-h">
        <text class="block-t">生长日记</text>
        <text class="block-more" @tap="noop">查看全部</text>
      </view>
      <view class="timeline">
        <view class="tl-item" v-for="(it, i) in plot.growthLog" :key="i">
          <view class="tl-col">
            <view class="tl-dot" :class="{ first: i === 0 }" />
            <view class="tl-line" v-if="i < plot.growthLog.length - 1" />
          </view>
          <view class="tl-body">
            <view class="tl-head">
              <text class="tl-date">{{ it.date }}</text>
              <text class="tl-photo">{{ it.photo }}</text>
            </view>
            <text class="tl-t">{{ it.title }}</text>
          </view>
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
        <view class="h-stat">
          <text class="h-n">1 次</text>
          <text class="h-l">已使用指令</text>
        </view>
      </view>
    </view>

    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { MY_PLOT, COMMANDS } from '../../stores/mock';

const plot = MY_PLOT;
const commands = COMMANDS;

const sendCmd = c => {
  Taro.showModal({
    title: `确认${c.label}`,
    content: c.price > 0 ? `需支付 ¥${c.price}，${c.cooldown}` : `${c.cooldown}`,
    success: ({ confirm }) => {
      if (confirm) {
        Taro.showToast({ title: `${c.label}指令已发送`, icon: 'success' });
      }
    }
  });
};
const ptz = dir => Taro.showToast({ title: `摄像头 ${dir}`, icon: 'none' });
const openLive = () => Taro.navigateTo({ url: `/pages/live/index?id=live-001` });
const noop = () => Taro.showToast({ title: '完整日记（mock）', icon: 'none' });
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; }

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

.timeline { padding: 4px 0; }
.tl-item { display: flex; gap: 12px; padding: 2px 0; }
.tl-col { width: 16px; display: flex; flex-direction: column; align-items: center; padding-top: 4px; }
.tl-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-divider); }
.tl-dot.first { background: var(--color-primary); box-shadow: 0 0 0 4px rgba(76,167,119,0.2); }
.tl-line { flex: 1; width: 1px; background: var(--color-divider); margin-top: 4px; }
.tl-body { flex: 1; padding: 0 0 14px; }
.tl-head { display: flex; justify-content: space-between; }
.tl-date { font-size: 12px; color: var(--color-text-mute); }
.tl-photo { font-size: 18px; }
.tl-t { font-size: 14px; margin-top: 2px; display: block; }

.harvest { display: flex; gap: 8px; }
.h-stat { flex: 1; background: var(--color-surface-alt); border-radius: 10px; padding: 14px 8px; text-align: center; }
.h-n { font-size: 18px; font-weight: 700; color: var(--color-primary-dark); display: block; }
.h-l { font-size: 11px; color: var(--color-text-mute); margin-top: 2px; }
</style>
