<template>
  <view class="page">
    <view class="hint">
      <text class="hint-t">河南·周口基地 · A 区</text>
      <text class="hint-d">绿=可选，灰=已售，黄=选中。点击地块查看土壤、朝向数据。</text>
    </view>

    <view class="map">
      <view class="map-legend">
        <view class="leg"><view class="dot avail" /><text>可选</text></view>
        <view class="leg"><view class="dot sold" /><text>已售</text></view>
        <view class="leg"><view class="dot active" /><text>选中</text></view>
      </view>
      <view class="grid">
        <view
          v-for="p in plots"
          :key="p.id"
          :class="['cell', p.status, selected === p.id && 'active']"
          @tap="pick(p)">
          <text class="cell-id">{{ p.id.split('-').pop() }}</text>
          <text class="cell-tag" v-if="p.status === 'sold'">售</text>
        </view>
      </view>
      <view class="compass">N ↑</view>
    </view>

    <view class="detail" v-if="current">
      <view class="d-head">
        <text class="d-id">{{ current.id }}</text>
        <view :class="['d-status', current.status]">
          {{ current.status === 'sold' ? '已售' : '可认养' }}
        </view>
      </view>
      <view class="d-grid">
        <view class="d-item">
          <text class="d-l">日照</text>
          <text class="d-v">{{ current.sunHours }} 小时</text>
        </view>
        <view class="d-item">
          <text class="d-l">土壤分</text>
          <text class="d-v">{{ current.soilScore }}</text>
        </view>
        <view class="d-item">
          <text class="d-l">位置</text>
          <text class="d-v">第 {{ current.row }} 排 {{ current.col }} 列</text>
        </view>
        <view class="d-item">
          <text class="d-l">朝向</text>
          <text class="d-v">南偏东 12°</text>
        </view>
      </view>
    </view>

    <view style="height: 90px" />

    <view class="footer">
      <view class="f-info">
        <text class="f-l">已选地块</text>
        <text class="f-v">{{ current ? current.id : '未选择' }}</text>
      </view>
      <view class="f-btn" @tap="confirm">确定并结算</view>
    </view>
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { computed, ref } from 'vue';
import { PLOTS } from '../../stores/mock';

const plots = PLOTS;
const selected = ref('P-A-07');
const current = computed(() => plots.find(p => p.id === selected.value));

const pick = p => {
  if (p.status === 'sold') return Taro.showToast({ title: '此地块已售', icon: 'none' });
  selected.value = p.id;
};
const confirm = () => {
  if (!current.value || current.value.status === 'sold') return;
  Taro.redirectTo({ url: `/pages/checkout/index?plot=${current.value.id}` });
};
</script>

<style lang="scss" scoped>
.page { padding: 12px 0 32px; }
.hint { padding: 12px 16px; background: #fff; margin: 0 16px 12px; border-radius: 10px; }
.hint-t { font-size: 14px; font-weight: 600; display: block; }
.hint-d { font-size: 12px; color: var(--color-text-mute); margin-top: 4px; display: block; line-height: 1.5; }

.map {
  margin: 0 16px; background: linear-gradient(135deg, #F0F7F1, #E8F4EA);
  border-radius: 16px; padding: 16px; position: relative;
}
.map-legend { display: flex; gap: 14px; margin-bottom: 12px; }
.leg { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-sub); }
.dot { width: 10px; height: 10px; border-radius: 2px; }
.dot.avail { background: var(--color-primary); }
.dot.sold { background: #CCC; }
.dot.active { background: var(--color-accent); }

.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.cell {
  aspect-ratio: 1 / 1; border-radius: 8px; background: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  position: relative; color: #fff; font-weight: 600;
}
.cell.sold { background: #CCC; color: #888; }
.cell.active { background: var(--color-accent); color: #8D6E00; box-shadow: 0 0 0 3px rgba(244,185,66,0.35); }
.cell-id { font-size: 13px; }
.cell-tag { position: absolute; top: 4px; right: 6px; font-size: 10px; opacity: 0.7; }

.compass { position: absolute; top: 14px; right: 18px; font-size: 12px; color: var(--color-text-sub); }

.detail { margin: 12px 16px; background: #fff; border-radius: 12px; padding: 14px 16px; }
.d-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.d-id { font-size: 16px; font-weight: 600; }
.d-status { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: var(--color-primary-light); color: var(--color-primary-dark); }
.d-status.sold { background: #F2F2F2; color: var(--color-text-mute); }

.d-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.d-item { background: var(--color-surface-alt); padding: 10px; border-radius: 8px; }
.d-l { font-size: 11px; color: var(--color-text-mute); }
.d-v { font-size: 15px; font-weight: 600; margin-top: 2px; display: block; }

.footer {
  position: fixed; left: 0; right: 0; bottom: 0; background: #fff;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  display: flex; padding: 10px 16px 22px; gap: 12px; align-items: center;
  z-index: 100;
}
.f-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.f-l { font-size: 11px; color: var(--color-text-mute); }
.f-v { font-size: 15px; font-weight: 600; color: var(--color-primary-dark); }
.f-btn { background: var(--color-primary); color: #fff; padding: 12px 24px; border-radius: 999px; font-weight: 600; }
</style>
