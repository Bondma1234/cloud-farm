// ============ 数字滚动动画 composable (P8 U3a) ============
// 用法:
//   import { useCountUp } from '@/utils/useCountUp';
//   const display = useCountUp(() => stats.value.total, { duration: 800 });
//   <text>{{ display }}</text>
//
// 传一个返回目标数字的 getter,返回一个 ref(动画中的当前值,整数)。
// 目标值变化时自动重新滚动。非数字(如 '—')原样透传。
import { ref, watch } from 'vue';

export function useCountUp(getter, opts = {}) {
  const { duration = 800 } = opts;
  const display = ref(0);
  let raf = null;

  const animateTo = (target) => {
    // 非数字直接透传(如 '—' / '✕')
    if (typeof target !== 'number' || isNaN(target)) {
      display.value = target;
      return;
    }
    const from = typeof display.value === 'number' ? display.value : 0;
    const start = performance.now();
    if (raf) cancelAnimationFrame(raf);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      display.value = Math.round(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else display.value = target;
    };
    raf = requestAnimationFrame(tick);
  };

  watch(getter, (v) => animateTo(v), { immediate: true });
  return display;
}
