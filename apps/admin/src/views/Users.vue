<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="head">
          <strong>所有用户</strong>
          <el-space>
            <el-input
              v-model="q"
              placeholder="搜索 手机号 / 昵称"
              clearable
              style="width: 240px"
              @clear="load"
              @keyup.enter="load"
            />
            <el-select v-model="roleFilter" placeholder="角色" clearable style="width: 130px" @change="load">
              <el-option v-for="r in ROLES" :key="r.value" :value="r.value" :label="r.label" />
            </el-select>
            <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
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
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" min-width="220">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 10px">
              <el-avatar :size="36" shape="circle">{{ row.avatar }}</el-avatar>
              <div>
                <div>{{ row.nickname }} <span style="color:#bbb;font-size:11px">· {{ row.level }}</span></div>
                <div style="color: #888; font-size: 12px">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="130">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)" size="small">{{ roleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="认养订单数" width="110" align="right">
          <template #default="{ row }">{{ row.orderCount }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册日期" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.active" type="success" size="small">正常</el-tag>
            <el-tag v-else type="danger" size="small">已禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-dropdown :disabled="row.id === currentUserId" @command="(r: string) => onChangeRole(row, r)">
              <el-button size="small" type="primary" :disabled="row.id === currentUserId">
                改角色
                <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="r in ROLES"
                    :key="r.value"
                    :command="r.value"
                    :disabled="row.role === r.value"
                  >
                    {{ r.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              v-if="row.active"
              size="small"
              type="danger"
              plain
              :disabled="row.id === currentUserId"
              style="margin-left: 6px"
              @click="onToggleActive(row, false)"
            >
              禁用
            </el-button>
            <el-button
              v-else
              size="small"
              type="success"
              plain
              style="margin-left: 6px"
              @click="onToggleActive(row, true)"
            >
              启用
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-text type="info" size="small" style="margin-top: 12px; display: block">
        共 {{ list.length }} 人 · 禁用后该账号无法登录,历史订单保留;不能改自己 / 禁用其他 admin
      </el-text>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Refresh, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listAdminUsers,
  setAdminUserRole,
  setAdminUserActive,
  type AdminUserItem,
  ApiError,
} from '@cloud-farm/api-client';
import { useAuthStore } from '@/stores/auth';

const ROLES = [
  { value: 'customer',   label: '👤 普通用户' },
  { value: 'agronomist', label: '🧑‍🌾 农技员' },
  { value: 'cs',         label: '💬 客服' },
  { value: 'operator',   label: '🛠️ 运营' },
  { value: 'admin',      label: '🛡️ 管理员' },
];

const list = ref<AdminUserItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const q = ref('');
const roleFilter = ref('');

const auth = useAuthStore();
const currentUserId = ref<number>(auth.user?.id ?? -1);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    list.value = await listAdminUsers({
      role: roleFilter.value || undefined,
      q: q.value || undefined,
    });
  } catch (e) {
    error.value = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e as Error).message;
  } finally {
    loading.value = false;
  }
}

function roleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

function roleTagType(role: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (role === 'admin') return 'danger';
  if (role === 'operator') return 'warning';
  if (role === 'cs') return 'success';
  if (role === 'agronomist') return 'primary';
  return 'info';
}

async function onChangeRole(row: AdminUserItem, newRole: string) {
  if (newRole === row.role) return;
  try {
    await ElMessageBox.confirm(
      `把 ${row.nickname}(${row.phone})的角色从 "${roleLabel(row.role)}" 改成 "${roleLabel(newRole)}"?`,
      '改角色',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' },
    );
  } catch { return; }
  try {
    const updated = await setAdminUserRole(row.id, newRole as AdminUserItem['role']);
    Object.assign(row, updated);
    ElMessage.success(`已改为 ${roleLabel(updated.role)}`);
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e as Error).message;
    ElMessage.error(`改角色失败:${msg}`);
  }
}

async function onToggleActive(row: AdminUserItem, active: boolean) {
  try {
    await ElMessageBox.confirm(
      active
        ? `启用 ${row.nickname}?启用后可正常登录。`
        : `禁用 ${row.nickname}?禁用后该账号无法登录,历史订单保留。`,
      active ? '启用账号' : '禁用账号',
      { confirmButtonText: active ? '启用' : '禁用', cancelButtonText: '取消', type: active ? 'success' : 'warning' },
    );
  } catch { return; }
  try {
    const updated = await setAdminUserActive(row.id, active);
    Object.assign(row, updated);
    ElMessage.success(active ? '已启用' : '已禁用');
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e as Error).message;
    ElMessage.error(`操作失败:${msg}`);
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
