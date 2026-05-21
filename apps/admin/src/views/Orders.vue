<template>
  <div class="page">
    <el-card>
          <template #header>
            <div class="head">
              <strong>所有订单</strong>
              <el-space>
                <el-input
                  v-model="q"
                  placeholder="搜索 订单号 / 标题"
                  clearable
                  style="width: 240px"
                  @clear="load"
                  @keyup.enter="load"
                />
                <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 130px" @change="load">
                  <el-option v-for="s in STATUSES" :key="s.value" :value="s.value" :label="s.label" />
                </el-select>
                <el-button :icon="Refresh" :loading="loading" @click="load">查询</el-button>
              </el-space>
            </div>
          </template>

          <el-alert
            v-if="error"
            type="error"
            :title="`接口失败: ${error}`"
            :closable="false"
            show-icon
          />

          <el-skeleton v-else-if="loading" :rows="5" animated />

          <el-table v-else :data="list" stripe>
            <el-table-column prop="id" label="订单号" width="170" />
            <el-table-column label="用户" width="170">
              <template #default="{ row }">
                <div>{{ row.userNickname }}</div>
                <div style="color: #999; font-size: 12px">{{ row.userPhone }}</div>
              </template>
            </el-table-column>
            <el-table-column label="商品" min-width="240">
              <template #default="{ row }">
                <div style="display:flex; align-items:center; gap:10px">
                  <el-avatar :size="40" shape="square" :src="row.cover">
                    <span style="font-size:11px">无</span>
                  </el-avatar>
                  <div>
                    <div>{{ row.title }}</div>
                    <div style="color:#999;font-size:12px">{{ row.type }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="100" align="right">
              <template #default="{ row }">
                <span style="color:#e57373;font-weight:600">¥ {{ row.price }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="日期" width="110" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)">{{ row.statusLabel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-dropdown @command="(s: string) => onChangeStatus(row, s)">
                  <el-button size="small" type="primary">
                    改状态
                    <el-icon style="margin-left:4px"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-for="s in STATUSES" :key="s.value" :command="s.value" :disabled="row.status === s.value">
                        {{ s.label }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>

          <el-text type="info" size="small" style="margin-top:12px;display:block">
            共 {{ list.length }} 条 · 取的是真实 SQLite 数据,只显示前 200 条
          </el-text>
        </el-card>

        <el-alert
          style="margin-top: 16px"
          type="success"
          show-icon
          :closable="false"
          title="P3 阶段"
          description="GET /api/admin/orders 是 admin 专属接口(role admin/operator/cs 可看), PATCH /admin/orders/:id/status 改状态(admin/operator 可改, cs 只读)。"
        />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Refresh, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  listAdminOrders,
  setAdminOrderStatus,
  type AdminOrderListItem,
  ApiError,
} from '@cloud-farm/api-client';
const STATUSES = [
  { value: 'pending', label: '待付款' },
  { value: 'paid', label: '已付款' },
  { value: 'shipped', label: '待发货' },
  { value: 'delivering', label: '配送中' },
  { value: 'completed', label: '已完成' },
  { value: 'growing', label: '种植中' },
  { value: 'cancelled', label: '已取消' },
];

const list = ref<AdminOrderListItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const q = ref('');
const statusFilter = ref('');

async function load() {
  loading.value = true;
  error.value = null;
  try {
    list.value = await listAdminOrders({
      status: statusFilter.value || undefined,
      q: q.value || undefined,
    });
  } catch (e) {
    error.value = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e as Error).message;
  } finally {
    loading.value = false;
  }
}

function statusType(s: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'pending') return 'danger';
  if (s === 'delivering' || s === 'growing') return 'warning';
  if (s === 'completed' || s === 'paid') return 'success';
  if (s === 'cancelled') return 'info';
  return 'primary';
}

async function onChangeStatus(row: AdminOrderListItem, newStatus: string) {
  if (newStatus === row.status) return;
  try {
    const updated = await setAdminOrderStatus(row.id, newStatus);
    Object.assign(row, updated);
    ElMessage.success(`订单 ${row.id} → ${updated.statusLabel}`);
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e as Error).message;
    ElMessage.error(`改状态失败:${msg}`);
  }
}

onMounted(load);
</script>

<style scoped>
.page {
  /* layout 管高度 */
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
