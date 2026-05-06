<template>
  <el-header class="header">
    <div class="header-l">{{ title }}</div>
    <div class="header-r">
      <el-tag :type="phaseColor" size="small">{{ phase }}</el-tag>
      <el-button text type="primary" @click="logout">退出</el-button>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

withDefaults(
  defineProps<{
    title?: string;
    phase?: string;
    phaseColor?: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  }>(),
  {
    title: '运营后台',
    phase: 'P2 阶段',
    phaseColor: 'success',
  },
);

const router = useRouter();
function logout() {
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
</style>
