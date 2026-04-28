<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="head">
      <text class="title">田园动态</text>
      <text class="sub">{{ entries.length }} 条记录 · 最近更新 2 小时前</text>
    </view>

    <!-- 类型筛选 -->
    <scroll-view scroll-x class="filter">
      <view
        v-for="t in TYPES"
        :key="t.key"
        :class="['ftab', active === t.key && 'active']"
        @tap="active = t.key"
      >
        <text class="ftab-ic">{{ t.icon }}</text>
        <text class="ftab-l">{{ t.label }}</text>
      </view>
    </scroll-view>

    <!-- 列表 -->
    <view class="list" v-if="filtered.length">
      <view class="card" v-for="e in filtered" :key="e.id">
        <view class="card-h">
          <view class="card-ic">{{ e.icon }}</view>
          <view class="card-meta">
            <text class="card-t">{{ e.title }}</text>
            <text class="card-by">{{ e.by }} · {{ e.at }}</text>
          </view>
          <view class="card-pill" v-if="e.plotId">{{ e.plotId }}</view>
        </view>

        <text class="card-body">{{ e.body }}</text>

        <view class="photos" v-if="e.photos && e.photos.length">
          <image
            v-for="(p, i) in e.photos"
            :key="i"
            :src="p"
            mode="aspectFill"
            :class="['ph', e.photos.length === 1 && 'ph-full']"
            @tap="preview(e.photos, i)"
          />
        </view>

        <view class="card-f">
          <view class="card-act" @tap="like(e)">
            <text>👍</text>
            <text class="act-n">{{ e.likes }}</text>
          </view>
          <view class="card-act" @tap="comment(e)">
            <text>💬</text>
            <text class="act-n">{{ e.comments }}</text>
          </view>
          <view class="card-act" @tap="share(e)">
            <text>🔗</text>
            <text class="act-l">分享</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty">
      <text class="empty-ic">📭</text>
      <text>这个分类下还没有动态</text>
    </view>

    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { ref, computed } from 'vue';
import { JOURNAL_ENTRIES } from '../../stores/mock';

const entries = JOURNAL_ENTRIES;

const TYPES = [
  { key: 'all',       icon: '📋', label: '全部' },
  { key: 'bloom',     icon: '🌸', label: '开花' },
  { key: 'water',     icon: '💧', label: '浇水' },
  { key: 'fertilize', icon: '🌿', label: '施肥' },
  { key: 'shoot',     icon: '📸', label: '拍照' },
  { key: 'plant',     icon: '🌱', label: '种植' },
  { key: 'ship',      icon: '📦', label: '物流' }
];

const active = ref('all');
const filtered = computed(() =>
  active.value === 'all' ? entries : entries.filter(e => e.type === active.value)
);

const preview = (urls, current) => {
  Taro.previewImage
    ? Taro.previewImage({ urls, current: urls[current] })
    : Taro.showToast({ title: '查看大图（mock）', icon: 'none' });
};

const like = (e) => Taro.showToast({ title: `已点赞 +1`, icon: 'success' });
const comment = (e) => Taro.showToast({ title: '评论功能（待开放）', icon: 'none' });
const share = (e) => Taro.showToast({ title: '分享卡片（待开放）', icon: 'none' });
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; background: var(--color-surface-alt); min-height: 100vh; }

.head {
  background: linear-gradient(135deg, #4CA777 0%, #2E7D32 100%);
  color: #fff; padding: 22px 18px 26px;
}
.title { font-size: 22px; font-weight: 700; display: block; }
.sub { font-size: 12px; opacity: 0.88; margin-top: 4px; display: block; }

.filter {
  white-space: nowrap; padding: 12px 12px 0;
  background: #fff; border-bottom: 1px solid var(--color-divider);
}
.ftab {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 12px; margin-right: 8px;
  background: var(--color-surface-alt); border-radius: 999px;
  font-size: 12px; color: var(--color-text-sub); cursor: pointer;
}
.ftab.active {
  background: var(--color-primary); color: #fff;
}
.ftab-ic { font-size: 14px; }
.ftab-l { font-size: 12px; }

.list { padding: 12px; display: flex; flex-direction: column; gap: 12px; }

.card {
  background: #fff; border-radius: 14px; padding: 14px;
  box-shadow: var(--shadow-sm);
}
.card-h { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.card-ic {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--color-primary-light);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.card-meta { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.card-t { font-size: 15px; font-weight: 600; }
.card-by { font-size: 11px; color: var(--color-text-mute); }
.card-pill {
  background: var(--color-surface-alt); color: var(--color-text-sub);
  font-size: 11px; padding: 3px 8px; border-radius: 4px;
}
.card-body {
  font-size: 13px; color: var(--color-text-sub); line-height: 1.65;
  display: block; margin-bottom: 10px;
}

.photos { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
.ph {
  width: 100%; height: 110px; border-radius: 8px;
  background: var(--color-primary-light); object-fit: cover;
}
.ph-full { grid-column: 1 / -1; height: 180px; }

.card-f {
  display: flex; gap: 18px; padding-top: 10px;
  border-top: 1px solid var(--color-divider);
}
.card-act {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--color-text-mute); cursor: pointer;
}
.act-n, .act-l { font-size: 12px; }

.empty {
  text-align: center; padding: 80px 0; color: var(--color-text-mute);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.empty-ic { font-size: 48px; opacity: 0.5; }
</style>
