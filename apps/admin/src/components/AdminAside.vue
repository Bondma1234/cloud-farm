<template>
  <el-aside width="220px" class="aside">
    <div class="brand">
      <span class="logo">🌾</span>
      <span class="name">云上田园 后台</span>
    </div>
    <el-menu :default-active="active" router>
      <el-menu-item index="/dashboard">
        <el-icon><Monitor /></el-icon>
        <span>工作台</span>
      </el-menu-item>
      <el-menu-item index="/orders">
        <el-icon><Tickets /></el-icon>
        <span>订单管理</span>
      </el-menu-item>
      <el-sub-menu index="farm">
        <template #title>
          <el-icon><MapLocation /></el-icon>
          <span>农场管理</span>
        </template>
        <el-menu-item index="/packages">套餐</el-menu-item>
        <el-menu-item disabled>地块 (P3)</el-menu-item>
        <el-menu-item disabled>摄像头 (P5)</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="content">
        <template #title>
          <el-icon><Document /></el-icon>
          <span>内容管理</span>
        </template>
        <el-menu-item disabled>田园动态 (P4+)</el-menu-item>
        <el-menu-item disabled>作物百科 (P4+)</el-menu-item>
      </el-sub-menu>
      <el-menu-item disabled>
        <el-icon><Setting /></el-icon>
        <span>系统设置 (P3)</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Monitor, Tickets, MapLocation, Document, Setting } from '@element-plus/icons-vue';

const route = useRoute();
const active = computed(() => route.path);
</script>

<style scoped>
.aside {
  background: #001628;
  color: #fff;
}
.brand {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.brand .logo {
  font-size: 22px;
}
.brand .name {
  font-size: 14px;
  font-weight: 600;
}
:deep(.el-menu) {
  background-color: transparent;
  border-right: none;
}
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: #c8cdd6;
}
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: rgba(76, 167, 119, 0.15);
}
:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #4ca777, #2e7d32);
  color: #fff;
}
</style>
