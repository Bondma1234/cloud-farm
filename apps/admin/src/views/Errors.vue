<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="head">
          <strong>错误日志</strong>
          <el-space>
            <el-select v-model="sourceFilter" placeholder="来源" clearable style="width: 120px" @change="load">
              <el-option value="admin" label="Admin" />
              <el-option value="miniapp" label="Miniapp" />
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

      <el-empty v-else-if="!list.length" description="还没有错误日志" :image-size="80" />

      <el-table v-else :data="list" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <el-tag :type="row.source === 'admin' ? 'danger' : 'warning'" size="small">
              {{ row.source }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="at" label="时间" width="170" />
        <el-table-column label="错误信息" min-width="320">
          <template #default="{ row }">
            <div style="color:#e57373;font-weight:500;font-size:13px">{{ row.message }}</div>
            <pre v-if="row.stack" style="margin:6px 0 0;color:#888;font-size:11px;white-space:pre-wrap;max-height:80px;overflow:auto">{{ row.stack }}</pre>
          </template>
        </el-table-column>
        <el-table-column label="上下文" min-width="220">
          <template #default="{ row }">
            <div style="font-size:11px;color:#666;word-break:break-all">{{ row.url }}</div>
            <div v-if="row.userAgent" style="font-size:11px;color:#bbb;margin-top:2px">{{ row.userAgent.slice(0,60) }}…</div>
            <div v-if="row.userId" style="font-size:11px;color:#888;margin-top:2px">user #{{ row.userId }}</div>
          </template>
        </el-table-column>
      </el-table>

      <el-text type="info" size="small" style="margin-top:12px;display:block">
        共 {{ list.length }} 条 · 取最近 200 条;不抛"上报失败"二次错误
      </el-text>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { listAdminErrorLogs, type AdminErrorLog, ApiError } from '@cloud-farm/api-client';

const list = ref<AdminErrorLog[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const sourceFilter = ref('');

async function load() {
  loading.value = true;
  error.value = null;
  try {
    list.value = await listAdminErrorLogs(sourceFilter.value || undefined);
  } catch (e) {
    error.value = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e as Error).message;
  } finally {
    loading.value = false;
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
