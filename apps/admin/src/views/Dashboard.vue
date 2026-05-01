<template>
  <el-container class="dashboard">
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
        <el-sub-menu index="orders">
          <template #title>
            <el-icon><Tickets /></el-icon>
            <span>订单中心</span>
          </template>
          <el-menu-item disabled>认养订单 (P3)</el-menu-item>
          <el-menu-item disabled>商城订单 (P3)</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="farm">
          <template #title>
            <el-icon><MapLocation /></el-icon>
            <span>农场管理</span>
          </template>
          <el-menu-item disabled>套餐 (P3)</el-menu-item>
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

    <el-container>
      <el-header class="header">
        <div class="header-l">运营后台</div>
        <div class="header-r">
          <el-tag type="success" size="small">P1 骨架版</el-tag>
          <el-button text type="primary" @click="logout">退出</el-button>
        </div>
      </el-header>

      <el-main>
        <el-row :gutter="20">
          <el-col :span="6" v-for="s in stats" :key="s.label">
            <el-card shadow="hover">
              <div class="stat">
                <div class="stat-num">{{ s.value }}</div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-divider />

        <el-card>
          <template #header>
            <strong>开发进度</strong>
          </template>
          <el-table :data="phases" stripe>
            <el-table-column prop="phase" label="阶段" width="100" />
            <el-table-column prop="title" label="内容" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === '已完成' ? 'success' : row.status === '进行中' ? 'warning' : 'info'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-alert
          style="margin-top: 24px"
          type="info"
          :closable="false"
          title="说明"
          description="这是 P1 阶段的运营后台骨架版本,只跑通了登录 + 工作台壳子。P3 阶段会实现真实的套餐 / 订单管理,P5 实现摄像头管理。"
        />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Monitor, Tickets, MapLocation, Document, Setting } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const active = computed(() => route.path);

const stats = [
  { label: '认养用户', value: '— / 800' },
  { label: '今日订单', value: '—' },
  { label: '摄像头在线', value: '— / —' },
  { label: '待处理工单', value: '—' },
];

const phases = [
  { phase: 'P1', title: '架构地基: monorepo + docker + apps 骨架', status: '已完成' },
  { phase: 'P2', title: '后端 API: NestJS + Prisma + 7 张表 + 套餐接口', status: '待开始' },
  { phase: 'P3', title: 'Admin 实现: 登录 / 套餐 CRUD / 订单查看', status: '待开始' },
  { phase: 'P4', title: 'miniapp 接 API,替换 mock', status: '待开始' },
  { phase: 'P5', title: '摄像头接萤石云 + 拍照抓帧', status: '待开始' },
  { phase: 'P6', title: 'C 端 Web Portal 拆分(独立 Vue 3)', status: '待开始' },
];

function logout() {
  router.push('/login');
}
</script>

<style scoped>
.dashboard {
  height: 100vh;
}
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

.stat {
  text-align: center;
  padding: 8px 0;
}
.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #2e7d32;
}
.stat-label {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}
</style>
