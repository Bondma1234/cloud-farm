<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="bar">
      <text class="bar-back" @tap="back">‹</text>
      <text class="bar-t">地址管理</text>
      <text class="bar-r" @tap="toNew">新增</text>
    </view>

    <!-- 地址列表 -->
    <view class="list" v-if="addresses.length">
      <view class="addr" v-for="a in addresses" :key="a.id" @tap="toEdit(a)">
        <view class="addr-top">
          <text class="addr-n">{{ a.name }}</text>
          <text class="addr-p">{{ a.phone }}</text>
          <view class="addr-tag" v-if="a.tag">{{ a.tag }}</view>
          <view class="addr-def" v-if="a.isDefault">默认</view>
        </view>
        <text class="addr-d">
          {{ a.province }} {{ a.city }} {{ a.district }} {{ a.detail }}
        </text>
        <view class="addr-bar">
          <view class="addr-l" @tap.stop="setDefault(a)">
            <view :class="['radio', a.isDefault && 'on']">
              <text v-if="a.isDefault">✓</text>
            </view>
            <text class="radio-l">{{ a.isDefault ? '默认地址' : '设为默认' }}</text>
          </view>
          <view class="addr-r">
            <text class="mini" @tap.stop="toEdit(a)">✎ 编辑</text>
            <text class="mini danger" @tap.stop="del(a)">🗑 删除</text>
          </view>
        </view>
      </view>
      <view style="height: 100px" />
    </view>

    <!-- 空态 -->
    <view v-else class="empty">
      <view class="empty-ic">📍</view>
      <text class="empty-t">还没有收货地址</text>
      <text class="empty-s">新增一个地址，方便农场给您寄送新鲜食材</text>
    </view>

    <!-- 底部新增按钮 -->
    <view class="foot">
      <view class="add-btn" @tap="toNew">
        <text class="add-ic">＋</text>
        <text>新增收货地址</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '../../stores/mock';

const router = useRouter();
const store = useAppStore();
const { addresses } = storeToRefs(store);

onMounted(async () => {
  // P4-E: 进页面先 bootstrap 登录态, 再拉真实地址(失败保留 mock)
  await store.bootstrap();
  await store.fetchAddresses();
});

// select 模式：从结算页跳过来选地址
const mode = router.params?.mode || '';

const back = () => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/profile/index' }));

const toNew = () => Taro.navigateTo({ url: '/pages/address-edit/index' })
  .catch(() => Taro.showToast({ title: '新增地址', icon: 'none' }));

const toEdit = (a) => {
  if (mode === 'select') {
    store.setDefaultAddress(a.id);
    Taro.showToast({ title: `已选择 ${a.name}`, icon: 'success' });
    setTimeout(() => Taro.navigateBack().catch(() => {}), 500);
    return;
  }
  Taro.navigateTo({ url: `/pages/address-edit/index?id=${a.id}` })
    .catch(() => Taro.showToast({ title: '编辑地址', icon: 'none' }));
};

const setDefault = (a) => {
  if (a.isDefault) return;
  store.addresses.forEach(x => x.isDefault = false);
  a.isDefault = true;
  store.setDefaultAddress(a.id);
  Taro.showToast({ title: '已设为默认', icon: 'success' });
};

const del = (a) => {
  Taro.showModal({
    title: '删除地址',
    content: `确定删除「${a.name} · ${a.detail}」？`,
    success: (res) => {
      if (res.confirm) {
        store.removeAddress(a.id);
        Taro.showToast({ title: '已删除', icon: 'success' });
      }
    }
  });
};
</script>

<style lang="scss" scoped>
.page { min-height: 100%; background: var(--color-bg); padding-bottom: 24px; }

.bar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #fff;
  border-bottom: 1px solid var(--color-divider);
}
.bar-back { font-size: 22px; color: var(--color-text); cursor: pointer; width: 24px; }
.bar-t { flex: 1; text-align: center; font-size: 16px; font-weight: 600; }
.bar-r { font-size: 13px; color: var(--color-primary-dark); cursor: pointer; }

.list { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }

.addr {
  background: #fff; border-radius: 12px; padding: 16px;
  box-shadow: var(--shadow-sm); cursor: pointer;
}
.addr-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.addr-n { font-size: 15px; font-weight: 600; color: var(--color-text); }
.addr-p { font-size: 13px; color: var(--color-text-sub); }
.addr-tag {
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  background: var(--color-surface-alt); color: var(--color-text-sub);
}
.addr-def {
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  background: var(--color-primary); color: #fff; font-weight: 600;
}
.addr-d {
  font-size: 13px; color: var(--color-text-sub);
  line-height: 1.6; margin-bottom: 12px;
}
.addr-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 12px; border-top: 1px solid var(--color-divider);
}
.addr-l { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.radio {
  width: 16px; height: 16px; border-radius: 50%;
  border: 1px solid var(--color-border);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 11px;
}
.radio.on { background: var(--color-primary); border-color: var(--color-primary); }
.radio-l { font-size: 12px; color: var(--color-text-sub); }
.addr-r { display: flex; gap: 16px; }
.mini {
  font-size: 12px; color: var(--color-text-sub); cursor: pointer;
}
.mini.danger { color: var(--color-danger); }

.empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 100px 24px 24px; gap: 8px;
}
.empty-ic { font-size: 56px; opacity: 0.6; }
.empty-t { font-size: 15px; color: var(--color-text-sub); font-weight: 500; }
.empty-s { font-size: 12px; color: var(--color-text-mute); text-align: center; line-height: 1.6; }

.foot {
  position: fixed; left: 0; right: 0; bottom: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
  background: #fff; box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
  z-index: 10;
}
.add-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 14px; border-radius: 999px;
  background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff;
  font-size: 15px; font-weight: 600; cursor: pointer;
  box-shadow: 0 6px 18px rgba(46,125,50,0.32);
}
.add-ic { font-size: 18px; font-weight: 700; }
</style>
