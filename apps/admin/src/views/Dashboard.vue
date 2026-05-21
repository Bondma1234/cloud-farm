<template>
  <div class="dashboard">
    <el-row :gutter="20">
          <el-col :span="6" v-for="s in stats" :key="s.label">
            <el-card shadow="hover">
              <div class="stat">
                <div class="stat-num" :class="{ live: s.live }">{{ s.value }}</div>
                <div class="stat-label">
                  {{ s.label }}
                  <el-tag v-if="s.live" type="success" size="small" effect="plain">实时</el-tag>
                </div>
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
          :type="apiError ? 'error' : 'success'"
          :closable="false"
          show-icon
          :title="apiError ? '后端连接失败' : '后端连接正常'"
          :description="
            apiError
              ? `${apiError} (检查 pnpm dev:api 是否在跑)`
              : '当前接通: GET /api/packages → 真实 SQLite 数据库'
          "
        />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { listPackages, ApiError } from '@cloud-farm/api-client';

// 拉真实套餐数 - 后端接通验证
const packageCount = ref<number | string>('—');
const apiError = ref<string | null>(null);

async function fetchStats() {
  try {
    const list = await listPackages();
    packageCount.value = list.length;
  } catch (e) {
    apiError.value = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e as Error).message;
    packageCount.value = '✕';
  }
}

const stats = computed(() => [
  { label: '上架套餐', value: packageCount.value, live: true },
  { label: '认养用户', value: '— / 800' },
  { label: '今日订单', value: '—' },
  { label: '摄像头在线', value: '— / —' },
]);

const phases = [
  { phase: 'P1', title: '架构地基: monorepo + docker + apps 骨架', status: '已完成' },
  { phase: 'P2', title: '后端 API: NestJS + Prisma + 7 张表 + 套餐接口', status: '已完成' },
  { phase: 'P2+B', title: 'Admin 接通后端,套餐数据真实显示', status: '已完成' },
  { phase: 'P4-C', title: 'miniapp 套餐接 API + mock 兜底', status: '已完成' },
  { phase: 'P2+D', title: '后端 Auth + User + Order + JWT', status: '已完成' },
  { phase: 'P4-E', title: 'miniapp 接 Auth/User/Order 5 页', status: '已完成' },
  { phase: 'P4-G', title: 'Journal/Crop/Photo/Command 4 模块全打通', status: '已完成' },
  { phase: 'P4-H', title: '业务流程闭环: 选地块 / 创建订单 / Address CRUD', status: '已完成' },
  { phase: 'P3', title: 'Admin 完整: 真登录 / 套餐 CRUD / 订单管理', status: '已完成' },
  { phase: 'P5', title: '摄像头接萤石云 + 拍照抓帧 + my-plot', status: '待开始' },
  { phase: 'P6', title: 'C 端 Web Portal 拆分(独立 Vue 3)', status: '待开始' },
  { phase: 'P7', title: '部署上云 + 域名 / ICP / 微信支付', status: '待开始' },
];

onMounted(fetchStats);
</script>

<style scoped>
.dashboard {
  /* layout 已经管高度,这里只放业务样式 */
}
.stat {
  text-align: center;
  padding: 8px 0;
}
.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #888;
}
.stat-num.live {
  color: #2e7d32;
}
.stat-label {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>
