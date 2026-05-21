<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <span class="logo">🌾</span>
        <h1>云上田园 · 运营后台</h1>
        <p class="sub">P3 真 JWT 认证 · admin / operator / cs 可登录</p>
      </div>

      <el-form label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="18888888888" autofocus maxlength="11" />
        </el-form-item>
        <el-form-item label="验证码">
          <el-input v-model="form.code" placeholder="6 位数字(MVP 任意 6 位)" maxlength="6" show-password />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
          登录
        </el-button>
      </el-form>

      <div class="hint">
        <el-text type="info" size="small">
          📞 后台账号:<strong>18888888888</strong>(admin)/ <strong>19999999999</strong>(农技员)<br />
          🔢 验证码:任意 6 位数字(MVP mock,如 <strong>123456</strong>)<br />
          ⚠️ C 端用户(role=customer)登录会被后台拒绝
        </el-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login as apiLogin, ApiError } from '@cloud-farm/api-client';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const form = reactive({ phone: '18888888888', code: '' });

async function onSubmit() {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('手机号格式不正确');
    return;
  }
  if (!/^\d{6}$/.test(form.code)) {
    ElMessage.warning('请输入 6 位数字验证码');
    return;
  }
  loading.value = true;
  try {
    const data = await apiLogin({ phone: form.phone, code: form.code });
    // 后台要求至少 admin / operator / cs 之一
    const allowed = ['admin', 'operator', 'cs', 'agronomist'];
    if (!allowed.includes(data.user.role)) {
      auth.clear();
      ElMessage.error(`当前账号角色 ${data.user.role} 不能登录后台`);
      loading.value = false;
      return;
    }
    auth.set(data.user);
    ElMessage.success(`欢迎,${data.user.nickname}`);
    router.push('/dashboard');
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e as Error).message;
    ElMessage.error(`登录失败:${msg}`);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4ca777 0%, #2e7d32 100%);
}
.login-card {
  width: 400px;
  padding: 32px 28px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
}
.brand {
  text-align: center;
  margin-bottom: 24px;
}
.logo {
  font-size: 44px;
}
.brand h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 8px 0 4px;
  color: #2e7d32;
}
.brand .sub {
  font-size: 12px;
  color: #999;
  margin: 0;
}
.hint {
  margin-top: 16px;
  text-align: center;
  line-height: 1.8;
}
.hint strong {
  color: #2e7d32;
}
</style>
