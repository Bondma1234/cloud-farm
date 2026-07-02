<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="head">
      <text class="title">作物百科</text>
      <text class="sub">认养时挑选你想种的作物 · 共 {{ crops.length }} 种</text>
    </view>

    <!-- 季节筛选 -->
    <scroll-view scroll-x class="filter">
      <view
        v-for="t in SEASONS"
        :key="t.key"
        :class="['ftab', active === t.key && 'active']"
        @tap="active = t.key"
      >
        <text>{{ t.label }}</text>
      </view>
    </scroll-view>

    <!-- 首次加载骨架屏 -->
    <Skeleton v-if="cropStore.loading && !crops.length" type="card" :count="3" />

    <!-- 作物卡片 -->
    <view class="grid cf-stagger" v-else-if="filtered.length" :key="active">
      <view class="card" v-for="c in filtered" :key="c.id" @tap="openDetail(c)">
        <image :src="c.cover" mode="aspectFill" class="cover" />
        <view class="diff">
          <text v-for="i in 5" :key="i" :class="['star', i <= c.difficulty && 'on']">★</text>
        </view>
        <view class="body">
          <view class="row">
            <text class="emoji">{{ c.emoji }}</text>
            <text class="name">{{ c.name }}</text>
            <text class="season">{{ c.season }}</text>
          </view>
          <text class="intro">{{ c.intro }}</text>
          <view class="info">
            <view class="info-item">
              <text class="info-l">生长期</text>
              <text class="info-v">{{ c.daysToHarvest }}</text>
            </view>
            <view class="info-item">
              <text class="info-l">产量</text>
              <text class="info-v">{{ c.yieldPerSqm }}</text>
            </view>
          </view>
          <view class="tags">
            <view class="tag" v-for="t in c.tags" :key="t">{{ t }}</view>
          </view>
          <view class="recommend">
            <text class="rec-l">推荐套餐</text>
            <text class="rec-v">{{ c.recommendPkg.join(' / ') }}</text>
          </view>
        </view>
      </view>
    </view>

    <EmptyState v-else type="crop" title="这个季节暂时没有可种作物" subtitle="换个季节看看,或去认养当季推荐" />

    <view style="height: 80px" />

    <!-- 底部 CTA -->
    <view class="cta">
      <view class="cta-btn" @tap="goPackages">去看认养套餐 ›</view>
    </view>
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useCropStore } from '../../stores/crops';
import Skeleton from '../../components/Skeleton.vue';
import EmptyState from '../../components/EmptyState.vue';

const cropStore = useCropStore();
const { list: crops } = storeToRefs(cropStore);

onMounted(() => cropStore.fetch());

const SEASONS = [
  { key: 'all',     label: '全部' },
  { key: '春',      label: '春季' },
  { key: '夏',      label: '夏季' },
  { key: '秋',      label: '秋季' },
  { key: '冬',      label: '冬季' }
];

const active = ref('all');
const filtered = computed(() => {
  if (active.value === 'all') return crops.value;
  return crops.value.filter(c => c.season.includes(active.value));
});

const openDetail = (c) => {
  Taro.showModal({
    title: `${c.emoji} ${c.name}`,
    content: `${c.intro}\n\n生长期：${c.daysToHarvest}\n产量：${c.yieldPerSqm}\n推荐套餐：${c.recommendPkg.join('、')}`,
    confirmText: '去认养',
    cancelText: '关闭',
    success: ({ confirm }) => {
      if (confirm) goPackages();
    }
  });
};

const goPackages = () => Taro.navigateTo({ url: '/pages/packages/index' })
  .catch(() => Taro.switchTab({ url: '/pages/packages/index' }).catch(() => {}));
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; background: var(--color-surface-alt); min-height: 100vh; }

.head {
  background: linear-gradient(135deg, #4CA777 0%, #2E7D32 100%);
  color: #fff; padding: 22px 18px;
}
.title { font-size: 22px; font-weight: 700; display: block; }
.sub { font-size: 12px; opacity: 0.88; margin-top: 4px; display: block; }

.filter {
  white-space: nowrap; padding: 12px 12px 0;
  background: #fff; border-bottom: 1px solid var(--color-divider);
}
.ftab {
  display: inline-block; padding: 6px 14px; margin-right: 8px;
  background: var(--color-surface-alt); border-radius: 999px;
  font-size: 13px; color: var(--color-text-sub); cursor: pointer;
}
.ftab.active { background: var(--color-primary); color: #fff; }

.grid {
  padding: 12px; display: grid; gap: 12px;
  grid-template-columns: 1fr;
}
@media (min-width: 720px) {
  .grid { grid-template-columns: 1fr 1fr; }
}

.card {
  background: #fff; border-radius: 14px; overflow: hidden;
  box-shadow: var(--shadow-sm); position: relative; cursor: pointer;
}
.cover { width: 100%; height: 140px; display: block; background: var(--color-primary-light); }

.diff {
  position: absolute; top: 10px; right: 10px;
  background: rgba(0,0,0,0.55); padding: 3px 8px;
  border-radius: 999px;
}
.star { font-size: 11px; color: rgba(255,255,255,0.4); }
.star.on { color: #F4B942; }

.body { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.row { display: flex; align-items: center; gap: 8px; }
.emoji { font-size: 22px; }
.name { font-size: 16px; font-weight: 700; flex: 1; }
.season {
  background: var(--color-primary-light); color: var(--color-primary-dark);
  font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600;
}

.intro { font-size: 12px; color: var(--color-text-sub); line-height: 1.55; }

.info {
  display: flex; gap: 8px;
  background: var(--color-surface-alt); border-radius: 8px;
  padding: 8px 10px;
}
.info-item { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.info-l { font-size: 10px; color: var(--color-text-mute); }
.info-v { font-size: 12px; color: var(--color-text); font-weight: 600; }

.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag {
  background: rgba(76,167,119,0.08); color: var(--color-primary-dark);
  font-size: 11px; padding: 2px 8px; border-radius: 4px;
}

.recommend {
  display: flex; align-items: baseline; gap: 6px;
  font-size: 12px; padding-top: 8px;
  border-top: 1px solid var(--color-divider);
}
.rec-l { color: var(--color-text-mute); }
.rec-v { color: var(--color-primary-dark); font-weight: 600; }

.cta {
  position: fixed; left: 16px; right: 16px; z-index: 9;
  bottom: calc(16px + env(safe-area-inset-bottom, 0));
}
.cta-btn {
  background: var(--color-primary); color: #fff;
  text-align: center; padding: 14px; border-radius: 999px;
  font-size: 15px; font-weight: 600;
  box-shadow: 0 6px 18px rgba(76,167,119,0.35); cursor: pointer;
}
</style>
