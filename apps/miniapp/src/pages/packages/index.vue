<template>
  <view class="page">
    <!-- mock 兜底提示(后端没起的时候显示) -->
    <view v-if="store.isMockFallback" class="api-warn" @tap="retry">
      <text>⚠️ 后端未连接,显示离线 mock 数据 · 点这里重试</text>
    </view>

    <view class="filter">
      <view
        v-for="f in filters"
        :key="f.key"
        :class="['chip', active === f.key && 'active']"
        @tap="active = f.key">
        {{ f.label }}
      </view>
    </view>

    <!-- P8 视觉 D: 骨架屏代替"加载中..."文字 -->
    <Skeleton v-if="store.loading && !store.list.length" type="card" :count="3" />

    <view v-else class="list">
      <view class="card" v-for="p in filtered" :key="p.id" @tap="goDetail(p.id)">
        <image :src="p.cover" mode="aspectFill" class="cover" />
        <view class="tag">{{ p.tag }}</view>
        <view class="body">
          <view class="top">
            <text class="name">{{ p.name }}</text>
            <view class="price">
              <text class="price-s">¥</text>
              <text class="price-n">{{ p.price }}</text>
              <text class="price-u">/ 年</text>
            </view>
          </view>
          <view class="hl">
            <view class="chip-sm" v-for="h in p.highlights" :key="h">{{ h }}</view>
          </view>
          <view class="crops">
            <text class="crops-l">可选作物：</text>
            <text class="crops-v">{{ p.crops.join('、') }}</text>
          </view>
          <view class="cta">
            <view class="btn btn-ghost">看详情</view>
            <view class="btn btn-primary" @tap.stop="goDetail(p.id)">立即认养</view>
          </view>
        </view>
      </view>
    </view>

    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePackageStore } from '../../stores/packages';
import Skeleton from '../../components/Skeleton.vue';

const store = usePackageStore();
const { list } = storeToRefs(store);

const filters = [
  { key: 'all', label: '全部' },
  { key: 'pkg-basic', label: '基础' },
  { key: 'pkg-pro', label: '进阶' },
  { key: 'pkg-family', label: '亲子' }
];
const active = ref('all');
const filtered = computed(() =>
  active.value === 'all' ? list.value : list.value.filter(p => p.id === active.value)
);
const goDetail = id => Taro.navigateTo({ url: `/pages/package-detail/index?id=${id}` });

const retry = async () => {
  Taro.showLoading?.({ title: '重试中…' });
  await store.fetch({ force: true });
  Taro.hideLoading?.();
  Taro.showToast?.({
    title: store.isMockFallback ? '后端仍未响应' : '已切到真实数据',
    icon: store.isMockFallback ? 'none' : 'success'
  });
};

onMounted(() => store.fetch());
</script>

<style lang="scss" scoped>
.page { padding: 12px 0 32px; }

.api-warn {
  margin: 0 16px 12px; padding: 8px 12px; border-radius: 8px;
  background: #FFF7E6; color: #8D6E00; font-size: 12px;
  border: 1px solid #F2C94C; text-align: center;
}

.loading { text-align: center; padding: 24px 0; color: var(--color-text-mute); font-size: 13px; }

.filter { display: flex; gap: 8px; padding: 0 16px 12px; overflow-x: auto; }
.chip {
  padding: 6px 14px; border-radius: 999px; background: #fff;
  font-size: 13px; color: var(--color-text-sub); flex-shrink: 0;
  border: 1px solid var(--color-divider);
}
.chip.active {
  background: var(--color-primary); color: #fff; border-color: var(--color-primary);
}

.list { display: flex; flex-direction: column; gap: 12px; padding: 0 16px; }
.card { background: #fff; border-radius: 14px; overflow: hidden; position: relative; box-shadow: var(--shadow-sm); }
.cover { width: 100%; height: 160px; display: block; }
.tag {
  position: absolute; top: 12px; left: 12px;
  background: var(--color-accent); color: #8D6E00;
  font-size: 12px; padding: 3px 10px; border-radius: 999px; font-weight: 600;
}
.body { padding: 14px 16px 16px; }
.top { display: flex; justify-content: space-between; align-items: baseline; }
.name { font-size: 16px; font-weight: 600; }
.price-s { font-size: 12px; color: var(--color-danger); }
.price-n { font-size: 22px; font-weight: 700; color: var(--color-danger); }
.price-u { font-size: 11px; color: var(--color-text-mute); margin-left: 2px; }

.hl { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.chip-sm {
  font-size: 11px; background: var(--color-primary-light);
  color: var(--color-primary-dark); padding: 3px 8px; border-radius: 4px;
}
.crops { font-size: 12px; color: var(--color-text-mute); margin-top: 10px; }
.crops-l { color: var(--color-text-sub); }
.cta { display: flex; gap: 10px; margin-top: 14px; }
.btn { flex: 1; text-align: center; padding: 10px; border-radius: 999px; font-size: 14px; font-weight: 600; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-ghost { background: var(--color-primary-light); color: var(--color-primary-dark); }
</style>
