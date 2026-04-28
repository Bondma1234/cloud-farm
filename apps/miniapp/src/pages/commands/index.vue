<template>
  <view class="page">
    <!-- 头部统计 -->
    <view class="head">
      <view class="head-row">
        <view class="head-stat">
          <text class="hs-n">{{ stats.total }}</text>
          <text class="hs-l">总指令</text>
        </view>
        <view class="head-stat">
          <text class="hs-n">{{ stats.completed }}</text>
          <text class="hs-l">已完成</text>
        </view>
        <view class="head-stat">
          <text class="hs-n">{{ stats.executing }}</text>
          <text class="hs-l">执行中</text>
        </view>
        <view class="head-stat">
          <text class="hs-n">¥{{ stats.cost }}</text>
          <text class="hs-l">累计花费</text>
        </view>
      </view>
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
      <view class="cmd" v-for="c in filtered" :key="c.id">
        <view class="cmd-l">
          <view :class="['cmd-ic', c.status]">{{ c.icon }}</view>
        </view>
        <view class="cmd-r">
          <view class="cmd-h">
            <text class="cmd-t">{{ c.label }} · {{ c.plotId }}</text>
            <text :class="['cmd-st', c.status]">{{ c.statusLabel }}</text>
          </view>
          <view class="cmd-meta">
            <text>发起 {{ c.requestedAt }}</text>
            <text v-if="c.cost > 0" class="cmd-cost">¥{{ c.cost }}</text>
          </view>
          <view class="cmd-note">
            <text class="cmd-by">{{ c.by }}：</text>
            <text>{{ c.note }}</text>
          </view>
          <image
            v-if="c.photo"
            :src="c.photo"
            mode="aspectFill"
            class="cmd-photo"
            @tap="preview(c)"
          />
          <view v-if="c.completedAt" class="cmd-done">
            <text>✓ 完成于 {{ c.completedAt }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty">
      <text class="empty-ic">📭</text>
      <text>这个分类下还没有指令</text>
    </view>

    <!-- 底部 CTA -->
    <view class="cta">
      <view class="cta-btn" @tap="goPlot">＋ 去我的田发指令</view>
    </view>

    <view style="height: 80px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { ref, computed } from 'vue';
import { COMMAND_HISTORY } from '../../stores/mock';

const all = COMMAND_HISTORY;

const TYPES = [
  { key: 'all',       icon: '📋', label: '全部' },
  { key: 'water',     icon: '💧', label: '浇水' },
  { key: 'fertilize', icon: '🌿', label: '施肥' },
  { key: 'weed',      icon: '🍃', label: '除草' },
  { key: 'shoot',     icon: '📸', label: '拍照' }
];

const active = ref('all');
const filtered = computed(() =>
  active.value === 'all' ? all : all.filter(c => c.type === active.value)
);

const stats = computed(() => ({
  total: all.length,
  completed: all.filter(c => c.status === 'completed').length,
  executing: all.filter(c => c.status === 'executing').length,
  cost: all.reduce((s, c) => s + (c.cost || 0), 0)
}));

const preview = (c) => {
  if (Taro.previewImage && c.photo) {
    Taro.previewImage({ urls: [c.photo], current: c.photo });
  } else {
    Taro.showToast({ title: '查看大图（mock）', icon: 'none' });
  }
};

const goPlot = () => Taro.switchTab({ url: '/pages/my-plot/index' });
</script>

<style lang="scss" scoped>
.page { padding-bottom: 32px; background: var(--color-surface-alt); min-height: 100vh; }

.head {
  background: linear-gradient(135deg, #4CA777 0%, #2E7D32 100%);
  color: #fff; padding: 22px 18px;
}
.head-row { display: flex; align-items: center; }
.head-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.hs-n { font-size: 22px; font-weight: 700; }
.hs-l { font-size: 11px; opacity: 0.88; }

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
.ftab.active { background: var(--color-primary); color: #fff; }
.ftab-ic { font-size: 14px; }
.ftab-l { font-size: 12px; }

.list { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

.cmd {
  background: #fff; border-radius: 12px; padding: 14px;
  display: flex; gap: 12px; box-shadow: var(--shadow-sm);
}
.cmd-l { flex-shrink: 0; }
.cmd-ic {
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--color-primary-light);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.cmd-ic.executing { background: rgba(242, 201, 76, 0.2); }
.cmd-ic.rejected { background: rgba(229, 115, 115, 0.15); opacity: 0.7; }

.cmd-r { flex: 1; min-width: 0; }
.cmd-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.cmd-t { font-size: 14px; font-weight: 600; }
.cmd-st { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
.cmd-st.completed { background: var(--color-primary-light); color: var(--color-primary-dark); }
.cmd-st.executing { background: rgba(242, 201, 76, 0.25); color: #8D6E00; }
.cmd-st.rejected { background: rgba(229, 115, 115, 0.15); color: var(--color-danger); }

.cmd-meta {
  display: flex; gap: 12px; align-items: baseline;
  font-size: 11px; color: var(--color-text-mute); margin-bottom: 8px;
}
.cmd-cost { color: var(--color-danger); font-weight: 600; }

.cmd-note {
  font-size: 13px; color: var(--color-text-sub); line-height: 1.55;
  background: var(--color-surface-alt); padding: 8px 10px; border-radius: 8px;
  margin-bottom: 8px;
}
.cmd-by { font-weight: 600; color: var(--color-text); }

.cmd-photo {
  width: 100%; height: 140px; border-radius: 8px;
  background: var(--color-primary-light); object-fit: cover;
  margin-bottom: 8px;
}

.cmd-done {
  font-size: 11px; color: var(--color-primary-dark);
  display: flex; align-items: center; gap: 4px;
}

.empty {
  text-align: center; padding: 80px 0; color: var(--color-text-mute);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.empty-ic { font-size: 48px; opacity: 0.5; }

.cta {
  position: fixed; bottom: 16px; left: 16px; right: 16px; z-index: 9;
}
.cta-btn {
  background: var(--color-primary); color: #fff;
  text-align: center; padding: 14px; border-radius: 999px;
  font-size: 15px; font-weight: 600; box-shadow: 0 6px 18px rgba(76,167,119,0.35);
  cursor: pointer;
}
</style>
