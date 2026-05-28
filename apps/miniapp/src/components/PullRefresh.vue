<!--
  P8 U3c: 轻量下拉刷新(H5 touch 实现)

  用法:
    <PullRefresh @refresh="onRefresh">
      <view>...长列表内容...</view>
    </PullRefresh>
    function onRefresh(done) {  // 调 done() 结束刷新
      store.fetch({ force: true }).finally(done);
    }

  仅在内容滚动到顶部时,继续下拉才触发;下拉距离 > 60px 松手刷新。
  浏览器里 .site-content 是真正的滚动容器,这里用 touch 事件 + transform 做下拉视觉。
-->
<template>
  <view
    class="pr-wrap"
    @touchstart="onStart"
    @touchmove="onMove"
    @touchend="onEnd"
  >
    <view class="pr-indicator" :style="{ height: pull + 'px' }">
      <text v-if="refreshing" class="pr-text"><text class="pr-spin">⟳</text> 刷新中…</text>
      <text v-else-if="pull > threshold" class="pr-text">↑ 松手刷新</text>
      <text v-else-if="pull > 0" class="pr-text">↓ 下拉刷新</text>
    </view>
    <view class="pr-content" :style="{ transform: `translateY(${pull}px)`, transition: dragging ? 'none' : 'transform 0.25s' }">
      <slot />
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['refresh']);
const threshold = 60;
const pull = ref(0);
const dragging = ref(false);
const refreshing = ref(false);
let startY = 0;
let active = false;

// 找到最近的可滚动祖先,判断是否已在顶部
function atTop(el) {
  let node = el;
  while (node && node !== document.body) {
    const oy = getComputedStyle(node).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node.scrollTop <= 0;
    }
    node = node.parentElement;
  }
  return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
}

function onStart(e) {
  if (refreshing.value) return;
  const t = e.touches && e.touches[0];
  if (!t) return;
  active = atTop(e.target);
  startY = t.clientY;
}

function onMove(e) {
  if (!active || refreshing.value) return;
  const t = e.touches && e.touches[0];
  if (!t) return;
  const dy = t.clientY - startY;
  if (dy <= 0) { pull.value = 0; dragging.value = false; return; }
  dragging.value = true;
  // 阻尼:越拉越沉
  pull.value = Math.min(90, dy * 0.5);
}

function onEnd() {
  dragging.value = false;
  if (refreshing.value) return;
  if (pull.value > threshold) {
    refreshing.value = true;
    pull.value = 44;
    emit('refresh', () => {
      refreshing.value = false;
      pull.value = 0;
    });
  } else {
    pull.value = 0;
  }
  active = false;
}
</script>

<style lang="scss" scoped>
.pr-wrap { position: relative; }
.pr-indicator {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; color: var(--color-text-mute);
}
.pr-text { font-size: 12px; }
.pr-spin { display: inline-block; animation: pr-rotate 0.7s linear infinite; }
@keyframes pr-rotate { to { transform: rotate(360deg); } }
.pr-content { will-change: transform; }
</style>
