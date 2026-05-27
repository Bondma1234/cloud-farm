<!--
  P8 D2: 成功反馈动画 - 全屏半透 + 圆环勾画 + 文案

  用法 (Promise 风格,推荐):
    import { showSuccess } from '@/components/SuccessOverlay';
    await showSuccess({ title: '支付成功', subtitle: '已进入种植中', duration: 1200 });
    // duration ms 后自动消失,Promise resolve

  特色:
    - SVG 笔触动画绘制圆环 + ✓(stroke-dasharray 技巧)
    - emoji 跳一下(可选,撒花效果)
    - 整体 fade-in,无侵入
-->
<template>
  <transition name="cf-success">
    <div v-if="visible" class="cf-success-mask">
      <div class="cf-success-card">
        <svg viewBox="0 0 80 80" class="cf-check-svg">
          <circle class="cf-circle" cx="40" cy="40" r="34" />
          <path class="cf-check" d="M 25 42 L 36 53 L 56 30" />
        </svg>
        <div class="cf-title">{{ title }}</div>
        <div v-if="subtitle" class="cf-sub">{{ subtitle }}</div>
        <div v-if="emoji" class="cf-emoji">{{ emoji }}</div>
      </div>
    </div>
  </transition>
</template>

<script>
import { defineComponent, ref, createApp } from 'vue';

const SuccessComp = defineComponent({
  name: 'SuccessOverlay',
  props: {
    title: { type: String, default: '操作成功' },
    subtitle: { type: String, default: '' },
    emoji: { type: String, default: '' },
  },
  setup() {
    const visible = ref(false);
    return { visible };
  },
});

let _instance = null;

/**
 * 命令式 API
 * await showSuccess({ title, subtitle, emoji, duration })
 *   duration: ms,默认 1200
 */
export function showSuccess({ title = '操作成功', subtitle = '', emoji = '', duration = 1200 } = {}) {
  return new Promise((resolve) => {
    // 复用单例 host,避免每次 createApp 浪费
    if (!_instance) {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const app = createApp(SuccessComp);
      _instance = app.mount(host);
    }
    _instance.title = title;
    _instance.subtitle = subtitle;
    _instance.emoji = emoji;
    _instance.visible = true;
    setTimeout(() => {
      _instance.visible = false;
      // 给 transition leave 200ms
      setTimeout(() => resolve(), 220);
    }, duration);
  });
}

export default SuccessComp;
</script>

<style lang="scss" scoped>
.cf-success-mask {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.32);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000;
  pointer-events: none;
}
.cf-success-card {
  background: #fff;
  border-radius: 20px;
  padding: 28px 36px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  display: flex; flex-direction: column; align-items: center;
  min-width: 220px;
  position: relative;
}
.cf-check-svg {
  width: 72px; height: 72px;
  margin-bottom: 14px;
}
.cf-circle {
  fill: none;
  stroke: var(--color-primary, #4CA777);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 220;
  stroke-dashoffset: 220;
  animation: cf-circle-draw 0.55s ease-out forwards;
}
.cf-check {
  fill: none;
  stroke: var(--color-primary, #4CA777);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: cf-check-draw 0.32s ease-out 0.4s forwards;
}
@keyframes cf-circle-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes cf-check-draw {
  to { stroke-dashoffset: 0; }
}
.cf-title {
  font-size: 17px; font-weight: 700; color: #1B1B1B;
  margin-top: 2px;
}
.cf-sub {
  font-size: 13px; color: #999;
  margin-top: 4px; text-align: center; line-height: 1.5;
}
.cf-emoji {
  position: absolute; top: -8px; right: -8px;
  font-size: 28px;
  animation: cf-emoji-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}
@keyframes cf-emoji-pop {
  0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
  60%  { transform: scale(1.3) rotate(15deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

/* 整体进出 */
.cf-success-enter-active, .cf-success-leave-active {
  transition: opacity 0.2s ease;
}
.cf-success-enter-from, .cf-success-leave-to { opacity: 0; }
.cf-success-enter-active .cf-success-card,
.cf-success-leave-active .cf-success-card {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.cf-success-enter-from .cf-success-card { transform: scale(0.85); }
.cf-success-leave-to .cf-success-card { transform: scale(0.95); }
</style>
