<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <span class="logo">🌾</span>
        <h1>云上田园 · 运营后台</h1>
        <p class="sub">P1 骨架版 · 后续接真鉴权</p>
      </div>

      <el-form label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="账号">
          <el-input v-model="form.username" placeholder="admin" autofocus />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="任意 6 位以上" show-password />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
          登录
        </el-button>
      </el-form>

      <div class="hint">
        <el-text type="info" size="small">
          ⚠️ 当前是 P1 阶段的骨架页面，登录走前端 mock。<br />
          P3 阶段将接 NestJS API 的 JWT 认证。
        </el-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const form = reactive({ username: 'admin', password: '' });

async function onSubmit() {
  if (form.password.length < 6) {
    ElMessage.warning('密码至少 6 位');
    return;
  }
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    ElMessage.success('登录成功(mock)');
    router.push('/dashboard');
  }, 400);
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
  width: 380px;
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
  line-height: 1.6;
}
</style>
