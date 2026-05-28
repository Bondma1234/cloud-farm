<template>
  <view class="page">
    <view class="top">
      <view class="close" @tap="close">✕</view>
    </view>

    <view class="brand">
      <view class="logo">🌾</view>
      <text class="brand-n">云上田园</text>
      <text class="brand-s">在一线城市，也能拥有一块属于你的田</text>
    </view>

    <view class="card">
      <view class="field">
        <text class="field-p">+86</text>
        <input v-model="phone" class="field-i" type="tel" maxlength="11" placeholder="请输入手机号" />
        <text class="field-x" v-if="phone" @tap="phone = ''">×</text>
      </view>
      <view class="field">
        <input v-model="code" class="field-i" type="number" maxlength="6" placeholder="请输入 6 位验证码" />
        <view :class="['field-a', (!canSend || countdown > 0) && 'dis']" @tap="sendCode">
          {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
        </view>
      </view>
      <!-- P8 B: 可选邀请码 -->
      <view class="field">
        <text class="field-p">🎁</text>
        <input v-model="inviteCode" class="field-i" maxlength="8" placeholder="邀请码(选填,双方各得 50 元券)" />
      </view>

      <view class="agree" @tap="agreed = !agreed">
        <view :class="['chk', agreed && 'on']">
          <text v-if="agreed">✓</text>
        </view>
        <text class="agree-t">
          我已阅读并同意 <text class="link">《用户协议》</text> 与 <text class="link">《隐私政策》</text>
        </text>
      </view>

      <view :class="['btn-login', canLogin && 'active']" @tap="doLogin">登 录</view>

      <view class="divider">
        <view class="d-line" /><text class="d-t">其他登录方式</text><view class="d-line" />
      </view>

      <view class="other">
        <view class="other-i" @tap="wxLogin">
          <text class="other-ic wx">💬</text>
          <text class="other-l">微信一键登录</text>
        </view>
      </view>
    </view>

    <view class="foot">
      <text>遇到问题？<text class="link" @tap="help">联系客服</text></text>
    </view>
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro';
import { ref, computed } from 'vue';
import { useAppStore } from '../../stores/mock';

const store = useAppStore();
const phone = ref('');
const code = ref('');
const inviteCode = ref('');
const agreed = ref(false);
const countdown = ref(0);

const canSend = computed(() => /^1[3-9]\d{9}$/.test(phone.value));
const canLogin = computed(() => canSend.value && code.value.length === 6 && agreed.value);

const sendCode = () => {
  if (!canSend.value) {
    Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }
  if (countdown.value > 0) return;
  // P4-E: 后端 mock 验证(任意 6 位数字通过), 这里 toast 仅是 UX 提示
  // P5+ 接真短信时, 在这里 await 一个 /api/auth/send-code 再开始倒计时
  Taro.showToast({ title: `验证码已发送至 ${phone.value}`, icon: 'none' });
  countdown.value = 60;
  const timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) clearInterval(timer);
  }, 1000);
  // 演示用:自动填 123456(后端 mock 接受任意 6 位数字)
  setTimeout(() => { code.value = '123456'; }, 800);
};

const doLogin = async () => {
  if (!canLogin.value) {
    if (!canSend.value) return Taro.showToast({ title: '手机号不正确', icon: 'none' });
    if (code.value.length !== 6) return Taro.showToast({ title: '请输入 6 位验证码', icon: 'none' });
    if (!agreed.value) return Taro.showToast({ title: '请先阅读并同意用户协议', icon: 'none' });
  }
  Taro.showLoading({ title: '登录中...' });
  try {
    // P4-E: 调真接口拿 JWT,后端会 upsert 用户,token 自动存 localStorage
    // P8 B: 带邀请码(选填),新用户首次注册时双方各得券
    await store.loginReal(phone.value, code.value, inviteCode.value.trim().toUpperCase() || undefined);
    Taro.hideLoading();
    Taro.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 800);
  } catch (e) {
    Taro.hideLoading();
    // 后端挂了或验证码错 → 兜底用 mock 让演示能继续
    const reason = e?.message || '后端未连接';
    store.loginMock(phone.value);
    Taro.showToast({ title: `${reason},已用 mock 登录`, icon: 'none' });
    setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 1200);
  }
};

const wxLogin = () => {
  Taro.showLoading({ title: '调起微信授权...' });
  setTimeout(() => {
    // 微信一键登录 P5+ 接 wx.login + 后端 /api/auth/wx-login
    // 当前阶段直接 mock,token 不真实
    store.loginMock('13800001234');
    Taro.hideLoading();
    Taro.showToast({ title: '微信登录成功(mock)', icon: 'success' });
    setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 800);
  }, 700);
};

const close = () => Taro.switchTab({ url: '/pages/home/index' }).catch(() => {});
const help = () => Taro.showToast({ title: '客服 400-8888-666', icon: 'none' });
</script>

<style lang="scss" scoped>
.page {
  min-height: 100%;
  background: linear-gradient(180deg, #E8F4EA 0%, #F5F7F6 45%, #F5F7F6 100%);
  display: flex; flex-direction: column;
}

.top { display: flex; padding: 16px 16px 0; }
.close {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: var(--color-text-sub); cursor: pointer;
}

.brand {
  text-align: center; padding: 32px 24px 40px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.logo {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, #4CA777, #2E7D32);
  display: flex; align-items: center; justify-content: center;
  font-size: 38px; box-shadow: 0 8px 24px rgba(46,125,50,0.28); margin-bottom: 6px;
}
.brand-n { font-size: 26px; font-weight: 700; color: var(--color-primary-dark); letter-spacing: 1px; }
.brand-s { font-size: 13px; color: var(--color-text-mute); margin-top: 2px; }

.card {
  background: #fff; margin: 0 16px; border-radius: 16px; padding: 24px 20px;
  box-shadow: var(--shadow-md);
}

.field {
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--color-divider); padding: 14px 0;
}
.field-p { font-size: 15px; color: var(--color-text-sub); font-weight: 500; }
.field-i {
  flex: 1; border: 0; outline: none; font-size: 16px;
  color: var(--color-text); background: transparent; min-width: 0;
}
.field-x {
  color: var(--color-text-mute); font-size: 18px; padding: 0 4px; cursor: pointer;
}
.field-a {
  font-size: 13px; color: var(--color-primary-dark); font-weight: 600;
  padding: 6px 12px; border-radius: 999px; background: var(--color-primary-light);
  cursor: pointer; flex-shrink: 0;
}
.field-a.dis { color: var(--color-text-mute); background: var(--color-divider); }

.agree {
  display: flex; align-items: flex-start; gap: 8px; margin-top: 18px;
  cursor: pointer;
}
.chk {
  width: 16px; height: 16px; border-radius: 50%;
  border: 1px solid var(--color-border); flex-shrink: 0; margin-top: 2px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 11px;
}
.chk.on { background: var(--color-primary); border-color: var(--color-primary); }
.agree-t { font-size: 12px; color: var(--color-text-mute); line-height: 1.6; }
.link { color: var(--color-primary-dark); }

.btn-login {
  margin-top: 24px; padding: 14px; border-radius: 999px;
  text-align: center; font-size: 16px; font-weight: 600;
  background: var(--color-divider); color: #B0B0B0; cursor: not-allowed;
}
.btn-login.active {
  background: linear-gradient(135deg, #4CA777, #2E7D32); color: #fff;
  box-shadow: 0 6px 18px rgba(46,125,50,0.32); cursor: pointer;
}

.divider { display: flex; align-items: center; margin: 28px 0 18px; gap: 10px; }
.d-line { flex: 1; height: 1px; background: var(--color-divider); }
.d-t { font-size: 11px; color: var(--color-text-mute); }

.other { display: flex; justify-content: center; }
.other-i {
  display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer;
}
.other-ic {
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 22px;
  background: #07C160; color: #fff;
}
.other-l { font-size: 12px; color: var(--color-text-sub); }

.foot {
  text-align: center; padding: 32px 0 20px; color: var(--color-text-mute); font-size: 12px;
}
</style>
