<template>
  <view class="page">
    <view class="bar">
      <text class="bar-back" @tap="back">‹</text>
      <text class="bar-t">{{ isEdit ? '编辑地址' : '新增地址' }}</text>
      <text class="bar-r" v-if="isEdit" @tap="del">删除</text>
    </view>

    <view class="form">
      <view class="row">
        <text class="row-l">收货人</text>
        <input class="row-i" v-model="form.name" placeholder="请输入姓名" maxlength="16" />
      </view>
      <view class="row">
        <text class="row-l">手机号</text>
        <input class="row-i" v-model="form.phone" type="tel" placeholder="请输入 11 位手机号" maxlength="11" />
      </view>
      <view class="row" @tap="pickRegion">
        <text class="row-l">所在地区</text>
        <text :class="['row-v', !form.province && 'placeholder']">
          {{ form.province ? `${form.province} ${form.city} ${form.district}` : '选择省/市/区' }}
        </text>
        <text class="row-a">›</text>
      </view>
      <view class="row">
        <text class="row-l">详细地址</text>
        <textarea
          class="row-ta"
          v-model="form.detail"
          placeholder="小区/街道/楼栋/门牌号等"
          maxlength="80"
          auto-height
        />
      </view>
    </view>

    <!-- 标签 -->
    <view class="form">
      <view class="row row-stack">
        <text class="row-l">地址标签</text>
        <view class="tags">
          <view
            v-for="t in TAGS"
            :key="t"
            :class="['tag', form.tag === t && 'on']"
            @tap="form.tag = form.tag === t ? '' : t"
          >{{ t }}</view>
        </view>
      </view>
    </view>

    <view class="form">
      <view class="row" @tap="form.isDefault = !form.isDefault">
        <text class="row-l">设为默认</text>
        <view style="flex: 1" />
        <view :class="['switch', form.isDefault && 'on']">
          <view class="switch-dot" />
        </view>
      </view>
    </view>

    <view style="height: 100px" />

    <view class="foot">
      <view :class="['save', canSave && 'active']" @tap="save">
        保存地址
      </view>
    </view>

    <!-- 省市区选择遮罩（mock） -->
    <view v-if="regionOpen" class="mask" @tap="regionOpen = false">
      <view class="sheet" @tap.stop>
        <view class="sheet-h">
          <text class="sheet-c" @tap="regionOpen = false">取消</text>
          <text class="sheet-t">选择省市区</text>
          <text class="sheet-d" @tap="confirmRegion">确定</text>
        </view>
        <view class="picker">
          <view class="col">
            <view
              v-for="p in REGIONS"
              :key="p.name"
              :class="['col-i', sel.province === p.name && 'on']"
              @tap="pickProvince(p)"
            >{{ p.name }}</view>
          </view>
          <view class="col">
            <view
              v-for="c in provinceCities"
              :key="c.name"
              :class="['col-i', sel.city === c.name && 'on']"
              @tap="pickCity(c)"
            >{{ c.name }}</view>
          </view>
          <view class="col">
            <view
              v-for="d in cityDistricts"
              :key="d"
              :class="['col-i', sel.district === d && 'on']"
              @tap="sel.district = d"
            >{{ d }}</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import Taro, { useRouter } from '@tarojs/taro';
import { computed, onMounted, reactive, ref } from 'vue';
import { createAddress, updateAddress, deleteAddress, ApiError } from '@cloud-farm/api-client';
import { useAppStore } from '../../stores/mock';

const router = useRouter();
const store = useAppStore();
const id = router.params?.id || '';
const isEdit = computed(() => !!id);

// 编辑模式:从 store 找一条已有的;若 store 是空的,先 fetchAddresses 一下
const exist = id ? store.addresses.find(a => a.id === id) : null;

onMounted(async () => {
  // 进编辑模式但 store 没数据(直接深链进来)
  if (isEdit.value && !exist) {
    await store.bootstrap();
    await store.fetchAddresses();
    const found = store.addresses.find(a => a.id === id);
    if (found) {
      form.name = found.name;
      // 从脱敏 phone 反推回真号(不可能, 这里编辑时让用户重填或保持脱敏不可改)
      // 后端会校验 phone 格式, 脱敏值 138****0001 校验失败
      // 所以编辑时如果 phone 是 *** 形式, 必须用户重填
      form.phone = found.phone.includes('*') ? '' : found.phone;
      form.province = found.province;
      form.city = found.city;
      form.district = found.district;
      form.detail = found.detail;
      form.tag = found.tag || '';
      form.isDefault = found.isDefault;
    }
  }
});

const form = reactive({
  id: exist?.id || '',
  name: exist?.name || '',
  phone: exist?.phone?.replace(/\*+/g, '') || '',
  province: exist?.province || '',
  city: exist?.city || '',
  district: exist?.district || '',
  detail: exist?.detail || '',
  tag: exist?.tag || '',
  isDefault: exist?.isDefault || false
});

const TAGS = ['家', '公司', '爸妈', '学校'];

// ----- 省市区 Mock -----
const REGIONS = [
  { name: '北京市', cities: [
    { name: '北京市', districts: ['海淀区', '朝阳区', '东城区', '西城区', '丰台区', '通州区'] }
  ]},
  { name: '上海市', cities: [
    { name: '上海市', districts: ['浦东新区', '徐汇区', '静安区', '长宁区', '闵行区', '杨浦区'] }
  ]},
  { name: '广东省', cities: [
    { name: '深圳市', districts: ['南山区', '福田区', '宝安区', '龙岗区'] },
    { name: '广州市', districts: ['天河区', '越秀区', '海珠区', '番禺区'] }
  ]},
  { name: '江苏省', cities: [
    { name: '南京市', districts: ['鼓楼区', '玄武区', '建邺区', '秦淮区'] },
    { name: '苏州市', districts: ['姑苏区', '工业园区', '吴中区'] }
  ]},
  { name: '浙江省', cities: [
    { name: '杭州市', districts: ['西湖区', '拱墅区', '余杭区', '滨江区'] }
  ]},
  { name: '河南省', cities: [
    { name: '郑州市', districts: ['金水区', '郑东新区', '中原区'] },
    { name: '周口市', districts: ['川汇区', '淮阳区', '项城市'] }
  ]}
];

const regionOpen = ref(false);
const sel = reactive({ province: form.province, city: form.city, district: form.district });

const provinceCities = computed(() => REGIONS.find(p => p.name === sel.province)?.cities || []);
const cityDistricts = computed(() => provinceCities.value.find(c => c.name === sel.city)?.districts || []);

const pickRegion = () => {
  sel.province = form.province || REGIONS[0].name;
  sel.city = form.city || REGIONS[0].cities[0].name;
  sel.district = form.district || '';
  regionOpen.value = true;
};
const pickProvince = (p) => {
  sel.province = p.name;
  sel.city = p.cities[0].name;
  sel.district = '';
};
const pickCity = (c) => {
  sel.city = c.name;
  sel.district = '';
};
const confirmRegion = () => {
  if (!sel.district) {
    Taro.showToast({ title: '请选择区县', icon: 'none' });
    return;
  }
  form.province = sel.province;
  form.city = sel.city;
  form.district = sel.district;
  regionOpen.value = false;
};

// ----- 保存 -----
const canSave = computed(() =>
  form.name && /^1[3-9]\d{9}$/.test(form.phone) && form.province && form.district && form.detail.length >= 4
);

const save = async () => {
  if (!form.name) return Taro.showToast({ title: '请输入收货人', icon: 'none' });
  if (!/^1[3-9]\d{9}$/.test(form.phone)) return Taro.showToast({ title: '手机号格式不正确', icon: 'none' });
  if (!form.province || !form.district) return Taro.showToast({ title: '请选择地区', icon: 'none' });
  if (form.detail.length < 4) return Taro.showToast({ title: '详细地址太短', icon: 'none' });

  const payload = {
    name: form.name,
    phone: form.phone, // 真号传后端,后端入库不脱敏,返回时脱敏
    province: form.province,
    city: form.city,
    district: form.district,
    detail: form.detail,
    tag: form.tag || undefined,
    isDefault: form.isDefault,
  };

  Taro.showLoading({ title: '保存中...' });
  try {
    if (isEdit.value) {
      await updateAddress(id, payload);
    } else {
      await createAddress(payload);
    }
    // 同步本地 store(让上一页刷新就能看到)
    await store.fetchAddresses();
    Taro.hideLoading();
    Taro.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => Taro.navigateBack().catch(() => {}), 500);
  } catch (e) {
    Taro.hideLoading();
    const msg = e instanceof ApiError ? e.message : (e?.message || '保存失败');
    Taro.showModal({ title: '保存失败', content: msg, showCancel: false });
  }
};

const del = () => {
  Taro.showModal({
    title: '删除地址',
    content: '确定删除该地址？',
    success: async (res) => {
      if (!res.confirm) return;
      Taro.showLoading({ title: '删除中...' });
      try {
        await deleteAddress(id);
        await store.fetchAddresses();
        Taro.hideLoading();
        Taro.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => Taro.navigateBack().catch(() => {}), 500);
      } catch (e) {
        Taro.hideLoading();
        const msg = e instanceof ApiError ? e.message : (e?.message || '删除失败');
        Taro.showModal({ title: '删除失败', content: msg, showCancel: false });
      }
    }
  });
};

const back = () => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/profile/index' }));
</script>

<style lang="scss" scoped>
.page { min-height: 100%; background: var(--color-bg); }

.bar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #fff;
  border-bottom: 1px solid var(--color-divider);
}
.bar-back { font-size: 22px; cursor: pointer; width: 24px; }
.bar-t { flex: 1; text-align: center; font-size: 16px; font-weight: 600; }
.bar-r { font-size: 13px; color: var(--color-danger); cursor: pointer; }

.form {
  background: #fff; margin: 12px 16px 0;
  border-radius: 12px; padding: 4px 16px;
  box-shadow: var(--shadow-sm);
}
.row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 0; border-bottom: 1px solid var(--color-divider);
  min-height: 48px;
}
.row:last-child { border-bottom: none; }
.row-stack { flex-direction: column; align-items: stretch; gap: 10px; padding: 14px 0; }
.row-l { font-size: 14px; color: var(--color-text-sub); width: 76px; flex-shrink: 0; }
.row-i, .row-ta {
  flex: 1; border: 0; outline: none;
  font-size: 14px; color: var(--color-text);
  background: transparent; min-width: 0;
}
.row-ta { min-height: 22px; line-height: 1.6; resize: none; padding: 0; font-family: inherit; }
.row-v { flex: 1; font-size: 14px; color: var(--color-text); }
.row-v.placeholder { color: var(--color-text-mute); }
.row-a { color: var(--color-text-mute); font-size: 18px; }

.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tag {
  font-size: 12px; padding: 6px 14px; border-radius: 999px;
  background: var(--color-surface-alt); color: var(--color-text-sub);
  cursor: pointer;
}
.tag.on {
  background: var(--color-primary-light); color: var(--color-primary-dark);
  border: 1px solid var(--color-primary); font-weight: 600;
}

.switch {
  width: 42px; height: 24px; border-radius: 999px; position: relative;
  background: var(--color-divider); transition: background 0.2s; cursor: pointer;
}
.switch.on { background: var(--color-primary); }
.switch-dot {
  position: absolute; top: 2px; left: 2px;
  width: 20px; height: 20px; border-radius: 50%; background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.switch.on .switch-dot { transform: translateX(18px); }

.foot {
  position: fixed; left: 0; right: 0; bottom: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
  background: #fff; box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
  z-index: 10;
}
.save {
  padding: 14px; border-radius: 999px; text-align: center;
  background: var(--color-divider); color: #B0B0B0;
  font-size: 16px; font-weight: 600; cursor: not-allowed;
}
.save.active {
  background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff;
  box-shadow: 0 6px 18px rgba(46,125,50,0.32); cursor: pointer;
}

/* 省市区弹层 */
.mask {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 100; display: flex; align-items: flex-end;
}
.sheet {
  width: 100%; background: #fff;
  border-radius: 16px 16px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
  max-height: 70vh; display: flex; flex-direction: column;
}
.sheet-h {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid var(--color-divider);
}
.sheet-c { font-size: 14px; color: var(--color-text-sub); cursor: pointer; }
.sheet-t { font-size: 15px; font-weight: 600; }
.sheet-d { font-size: 14px; color: var(--color-primary-dark); font-weight: 600; cursor: pointer; }
.picker {
  display: flex; height: 280px;
}
.col {
  flex: 1; overflow-y: auto;
  border-right: 1px solid var(--color-divider);
}
.col:last-child { border-right: none; }
.col-i {
  padding: 12px 10px; font-size: 13px; color: var(--color-text-sub);
  border-bottom: 1px solid var(--color-divider); cursor: pointer;
  text-align: center;
}
.col-i.on { color: var(--color-primary-dark); font-weight: 600; background: var(--color-primary-light); }
</style>
