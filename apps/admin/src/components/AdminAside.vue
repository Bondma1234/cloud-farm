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
      <el-menu-item index="/commands">
        <el-icon><Bell /></el-icon>
        <span>指令工单</span>
      </el-menu-item>
      <el-menu-item index="/users">
        <el-icon><User /></el-icon>
        <span>用户管理</span>
      </el-menu-item>
      <el-menu-item index="/errors">
        <el-icon><Warning /></el-icon>
        <span>错误日志</span>
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
        <el-menu-item index="/crops">作物百科</el-menu-item>
        <el-menu-item index="/journal">田园动态</el-menu-item>
        <el-menu-item index="/photos">照片墙审核</el-menu-item>
      </el-sub-menu>
      <el-menu-item disabled>
        <el-icon><Setting /></el-icon>
        <span>系统设置 (P3)</span>
      </el-menu-item>
    </el-menu>
    <!-- A1: 底部版本徽标 -->
    <div class="aside-foot">
      <span class="dot" />
      <span>内部运营系统 · P8</span>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Monitor, Tickets, MapLocation, Document, Setting, Bell, User, Warning } from '@element-plus/icons-vue';

const route = useRoute();
const active = computed(() => route.path);
</script>

<style scoped>
.aside {
  background: #001628;
  color: #fff;
  display: flex;
  flex-direction: column;
}
.brand {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  /* 左对齐,和下方菜单项图标(6px 菜单容器内边距 + 20px 项内边距)precisely 对齐 */
  justify-content: flex-start;
  padding-left: 26px;
  gap: 8px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  /* A1: 品牌区加一点绿色底光 */
  background: linear-gradient(180deg, rgba(76, 167, 119, 0.12), transparent);
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
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}
/* A1: 菜单项圆角化 + 过渡,摆脱"贴边长条"的原生感 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: #c8cdd6;
  border-radius: 8px;
  margin: 2px 0;
  transition: background-color 0.18s ease, color 0.18s ease, padding-left 0.18s ease;
}
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: rgba(76, 167, 119, 0.15);
  color: #fff;
}
:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #4ca777, #2e7d32);
  color: #fff;
  box-shadow: 0 2px 8px rgba(76, 167, 119, 0.35);
}
/* A1: 底部版本徽标 */
.aside-foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0 14px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.aside-foot .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ca777;
  box-shadow: 0 0 6px rgba(76, 167, 119, 0.8);
}
</style>
