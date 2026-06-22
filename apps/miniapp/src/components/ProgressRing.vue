<!--
  批 C0: 可复用进度环(SVG)

  用法:
    <ProgressRing :percent="75" emoji="🍅" />
    <ProgressRing :percent="42" :size="56" :stroke="5" emoji="🌱" :label="`${days}天`" />

  特色:
    - 进度弧从 0 动画"长"到目标值(stroke-dashoffset 过渡)
    - 中心可放 emoji + 百分比/自定义 label
    - 颜色走 token,track 浅绿、弧琥珀,可由 props 覆盖
  H5/小程序通用:纯 SVG + CSS transition,不依赖平台 API。
-->
<template>
  <view class="ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="ring-svg">
      <circle
        class="ring-track"
        :cx="c" :cy="c" :r="r"
        fill="none" :stroke-width="stroke"
        :style="trackColor ? { stroke: trackColor } : null"
      />
      <circle
        class="ring-fill"
        :cx="c" :cy="c" :r="r"
        fill="none" :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        :style="fillColor ? { stroke: fillColor } : null"
      />
    </svg>
    <view class="ring-mid">
      <text v-if="emoji" class="ring-em">{{ emoji }}</text>
      <text class="ring-pc" :style="textColor ? { color: textColor } : null">{{ label || pctText }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';

const props = defineProps({
  percent: { type: Number, default: 0 },     // 0-100
  size:    { type: Number, default: 64 },
  stroke:  { type: Number, default: 6 },
  emoji:   { type: String, default: '' },
  label:   { type: String, default: '' },    // 覆盖中心文字,不传则显示百分比
  // 颜色覆盖(深色卡片上用,如绿底传白环白字)
  trackColor: { type: String, default: '' },
  fillColor:  { type: String, default: '' },
  textColor:  { type: String, default: '' },
});

const c = computed(() => props.size / 2);
const r = computed(() => props.size / 2 - props.stroke);
const circumference = computed(() => 2 * Math.PI * r.value);

// 入场时从 0 动画到目标值
const animated = ref(0);
const clamped = computed(() => Math.max(0, Math.min(100, props.percent)));
const offset = computed(() => circumference.value * (1 - animated.value / 100));
const pctText = computed(() => `${Math.round(clamped.value)}%`);

function play() {
  animated.value = 0;
  // 短延时后设目标值,触发 CSS transition 把弧"长"出来。
  // 用 setTimeout 而非 requestAnimationFrame: rAF 在隐藏/后台标签页不触发,
  // 会让弧永远停在 0%;setTimeout 后台仍会执行,保证最终值正确。
  setTimeout(() => { animated.value = clamped.value; }, 40);
}
onMounted(play);
watch(() => props.percent, play);
</script>

<style lang="scss" scoped>
.ring { position: relative; flex-shrink: 0; }
.ring-svg { transform: rotate(-90deg); }   /* 12 点方向起笔 */
.ring-track { stroke: var(--color-primary-light); }
.ring-fill {
  stroke: var(--color-accent);
  transition: stroke-dashoffset 0.9s var(--ease-out);
}
.ring-mid {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1px;
}
.ring-em { font-size: 20px; line-height: 1; }
.ring-pc {
  font-size: var(--fs-xs); font-weight: 800; color: var(--color-primary-dark);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .ring-fill { transition: none; }
}
</style>
