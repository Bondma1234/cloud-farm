// ============ 数字滚动 composable(A2)============
// KPI 数值从 0 滚到目标值;数据源变化时从当前值继续滚,不闪回 0。
//
// 用法:
//   const userCountUp = useCountUp(() => data.value?.totals.userCount ?? 0);
//   template: {{ userCountUp }}
import { computed, ref, watch, type ComputedRef } from 'vue';

export function useCountUp(source: () => number, duration = 800): ComputedRef<string> {
  const display = ref(0);
  let raf = 0;
  let settle: ReturnType<typeof setTimeout> | null = null;

  watch(
    computed(source),
    (target) => {
      cancelAnimationFrame(raf);
      if (settle) clearTimeout(settle);
      const from = display.value;
      const delta = target - from;
      if (delta === 0) return;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - p, 3);
        display.value = Math.round(from + delta * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      // 兜底:后台标签页 rAF 被浏览器冻结时,动画结束时刻强制落到终值,
      // 保证任何情况下数字都正确(动画只是锦上添花)
      settle = setTimeout(() => {
        cancelAnimationFrame(raf);
        display.value = target;
      }, duration + 80);
    },
    { immediate: true },
  );

  return computed(() => display.value.toLocaleString());
}
