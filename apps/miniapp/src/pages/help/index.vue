<template>
  <view class="page">
    <view class="bar">
      <text class="bar-back" @tap="back">‹</text>
      <text class="bar-t">帮助中心</text>
      <text class="bar-r" />
    </view>

    <view class="search-tip">
      <text>常见问题,点击展开。没找到答案?联系客服 400-8888-666</text>
    </view>

    <view class="faq-group" v-for="g in FAQ" :key="g.cat">
      <text class="cat">{{ g.cat }}</text>
      <view class="faq" v-for="(q, i) in g.items" :key="i">
        <view class="q" @tap="toggle(g.cat + i)">
          <text class="q-t">{{ q.q }}</text>
          <text :class="['q-arrow', open[g.cat + i] && 'up']">›</text>
        </view>
        <view v-if="open[g.cat + i]" class="a">{{ q.a }}</view>
      </view>
    </view>

    <view class="contact" @tap="contact">
      <text class="contact-ic">💬</text>
      <text>联系在线客服</text>
    </view>
    <view style="height: 40px" />
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { reactive } from 'vue';

const FAQ = [
  {
    cat: '认养相关',
    items: [
      { q: '认养后多久能收到菜?', a: '不同作物生长周期不同,小番茄约 80-95 天,蜜薯约 110-130 天。地块详情页有预计收获时间,成熟后冷链寄出。' },
      { q: '可以自己选种什么作物吗?', a: '可以。下单时在套餐允许范围内选择作物,基础版 1 种、进阶版 2 种。' },
      { q: '认养期间能看到田地实时画面吗?', a: '可以。进"我的田"查看专属摄像头实时画面,进阶版还支持云台遥控。' },
    ],
  },
  {
    cat: '配送与售后',
    items: [
      { q: '配送范围覆盖哪些城市?', a: '目前覆盖北上广深等一线城市,冷链次日达。其他城市陆续开通中。' },
      { q: '收到的菜有质量问题怎么办?', a: '签收后 48 小时内联系客服,拍照反馈,核实后补发或退款。' },
      { q: '保底产量没达到怎么办?', a: '每户有保底产量承诺(基础版 10 斤、进阶版 20 斤),不足部分由农场补足或折算优惠券。' },
    ],
  },
  {
    cat: '优惠券与邀请',
    items: [
      { q: '优惠券怎么用?', a: '结算页自动展示可用券,满足门槛即可勾选抵扣,每单限用一张。' },
      { q: '邀请好友怎么得奖励?', a: '在"邀请好友"页复制邀请码,好友注册时填写,双方各得 50 元券。' },
    ],
  },
];

const open = reactive({});
const toggle = (k) => { open[k] = !open[k]; };

const back = () => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/profile/index' }));
const contact = () => Taro.showModal({ title: '在线客服', content: '客服热线 400-8888-666\n工作时间 9:00-21:00', showCancel: false });
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 32px; }

.bar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #fff;
  border-bottom: 1px solid var(--color-divider);
}
.bar-back { font-size: 22px; color: var(--color-text); width: 24px; }
.bar-t { flex: 1; text-align: center; font-size: 16px; font-weight: 600; }
.bar-r { width: 24px; }

.search-tip {
  margin: 12px 16px; font-size: 12px; color: var(--color-text-mute);
  line-height: 1.6;
}

.faq-group { margin: 0 16px 12px; }
.cat { font-size: 13px; font-weight: 600; color: var(--color-primary-dark); display: block; margin: 12px 0 8px; }
.faq { background: #fff; border-radius: 10px; margin-bottom: 8px; overflow: hidden; }
.q {
  display: flex; align-items: center; padding: 14px 16px; gap: 10px;
}
.q-t { flex: 1; font-size: 14px; color: var(--color-text); line-height: 1.4; }
.q-arrow { font-size: 18px; color: var(--color-text-mute); transform: rotate(90deg); transition: transform 0.2s; }
.q-arrow.up { transform: rotate(-90deg); }
.a {
  padding: 0 16px 14px; font-size: 13px; color: var(--color-text-sub);
  line-height: 1.7;
}

.contact {
  margin: 16px; padding: 14px; border-radius: 12px;
  background: var(--color-primary); color: #fff;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 15px; font-weight: 600;
}
.contact-ic { font-size: 18px; }
</style>
