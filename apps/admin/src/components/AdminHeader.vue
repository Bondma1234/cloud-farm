<template>
  <el-header class="header">
    <div class="header-l">{{ title }}</div>
    <div class="header-r">
      <template v-if="auth.user">
        <span class="user">
          <span class="user-avatar">{{ auth.user.avatar }}</span>
          {{ auth.user.nickname }}
          <el-tag :type="roleType" size="small" effect="plain" style="margin-left: 4px">
            {{ auth.user.role }}
          </el-tag>
        </span>
      </template>
      <el-tag :type="phaseColor" size="small">{{ phase }}</el-tag>
      <el-button text type="primary" @click="logout">退出</el-button>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

withDefaults(
  defineProps<{
    title?: string;
    phase?: string;
    phaseColor?: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  }>(),
  {
    title: '运营后台',
    phase: 'P3 真接入',
    phaseColor: 'success',
  },
);

const router = useRouter();
const auth = useAuthStore();

const roleType = computed<'primary' | 'success' | 'warning' | 'danger' | 'info'>(() => {
  if (auth.user?.role === 'admin') return 'danger';
  if (auth.user?.role === 'operator') return 'warning';
  if (auth.user?.role === 'cs') return 'success';
  if (auth.user?.role === 'agronomist') return 'primary';
  return 'info';
});

async function logout() {
  try {
    await ElMessageBox.confirm('确定退出当前账号?', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  auth.clear();
  router.push('/login');
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}
.header-l {
  font-weight: 600;
  color: #2e7d32;
}
.header-r {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
}
.user-avatar {
  font-size: 18px;
}
</style>
