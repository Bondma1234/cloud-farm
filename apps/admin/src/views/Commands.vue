<template>
  <div class="page">
    <el-card>
          <template #header>
            <div class="head">
              <strong>所有指令工单</strong>
              <el-space>
                <el-input
                  v-model="plotIdFilter"
                  placeholder="按地块 ID"
                  clearable
                  style="width: 160px"
                  @clear="load"
                  @keyup.enter="load"
                />
                <el-select v-model="typeFilter" placeholder="类型" clearable style="width: 130px" @change="load">
                  <el-option v-for="t in TYPES" :key="t.value" :value="t.value" :label="t.label" />
                </el-select>
                <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 130px" @change="load">
                  <el-option v-for="s in STATUSES" :key="s.value" :value="s.value" :label="s.label" />
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
            <el-table-column prop="id" label="工单号" width="170" />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <span style="font-size: 18px; margin-right: 4px">{{ row.icon }}</span>
                <span>{{ row.label }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="plotId" label="地块" width="110" />
            <el-table-column prop="requestedAt" label="发起时间" width="170" />
            <el-table-column label="备注 / 完成照片" min-width="220">
              <template #default="{ row }">
                <div v-if="row.note" style="font-size: 13px">{{ row.note }}</div>
                <div v-else style="color: #bbb; font-size: 12px">(无备注)</div>
                <el-image
                  v-if="row.photo"
                  :src="row.photo"
                  fit="cover"
                  style="width: 80px; height: 60px; margin-top: 6px; border-radius: 4px"
                  preview-teleported
                  :preview-src-list="[row.photo]"
                />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)">{{ row.statusLabel }}</el-tag>
                <div v-if="row.by" style="font-size: 11px; color: #888; margin-top: 2px">{{ row.by }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'pending'"
                  size="small"
                  type="primary"
                  :loading="busyId === row.id"
                  @click="onAccept(row)"
                >
                  接单
                </el-button>
                <el-button
                  v-if="row.status === 'executing' || row.status === 'pending'"
                  size="small"
                  type="success"
                  @click="openComplete(row)"
                >
                  完成
                </el-button>
                <el-text v-if="row.status === 'completed'" size="small" type="success">✓ 已完成</el-text>
              </template>
            </el-table-column>
          </el-table>

          <el-text type="info" size="small" style="margin-top:12px;display:block">
            共 {{ list.length }} 条 · 完成工单时填回执照片 URL,自动给用户写一条生长日记
          </el-text>
        </el-card>
    <!-- 完成对话框 -->
    <el-dialog v-model="completeDialog.open" title="完成工单" width="480px">
      <div v-if="completeDialog.row">
        <p style="margin: 0 0 10px">
          工单
          <el-tag size="small">{{ completeDialog.row.id }}</el-tag>
          · {{ completeDialog.row.icon }} {{ completeDialog.row.label }}
          · 地块 {{ completeDialog.row.plotId }}
        </p>
        <el-form label-width="80px">
          <el-form-item label="回执照片">
            <el-upload
              :show-file-list="false"
              :before-upload="beforeUpload"
              :http-request="uploadPhoto"
              accept="image/*"
            >
              <el-button :loading="completeDialog.uploading" type="primary" plain>
                {{ completeDialog.uploading ? '上传中…' : '📤 选择图片上传' }}
              </el-button>
            </el-upload>
            <div v-if="completeDialog.photo" style="margin-top: 8px">
              <el-image
                :src="completeDialog.photo"
                fit="cover"
                style="width: 140px; height: 100px; border-radius: 6px"
              />
              <div style="font-size: 11px; color: #888; margin-top: 2px">
                {{ completeDialog.photo }}
              </div>
            </div>
            <el-input
              v-model="completeDialog.photo"
              placeholder="或直接粘贴 URL"
              size="small"
              style="margin-top: 6px"
            />
          </el-form-item>
          <el-form-item label="完成备注">
            <el-input
              v-model="completeDialog.note"
              type="textarea"
              :rows="2"
              placeholder="可选,如:已浇水 2L,土壤湿度回升"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="completeDialog.open = false">取消</el-button>
        <el-button type="primary" :loading="completeDialog.loading" @click="onComplete">
          确认完成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  listAdminCommands,
  acceptCommand,
  completeCommand,
  ApiError,
} from '@cloud-farm/api-client';
import type { Command } from '@cloud-farm/shared';

const STATUSES = [
  { value: 'pending',   label: '待执行' },
  { value: 'executing', label: '执行中' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected',  label: '已拒绝' },
];
const TYPES = [
  { value: 'water',     label: '💧 浇水' },
  { value: 'fertilize', label: '🌱 施肥' },
  { value: 'weed',      label: '🌿 除草' },
  { value: 'shoot',     label: '📸 拍照' },
  { value: 'pest',      label: '🐛 捉虫' },
  { value: 'plant',     label: '🌾 补种' },
];

const list = ref<Command[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const statusFilter = ref('');
const typeFilter = ref('');
const plotIdFilter = ref('');
const busyId = ref<string | null>(null);

const completeDialog = reactive({
  open: false,
  loading: false,
  uploading: false,
  row: null as Command | null,
  photo: '',
  note: '',
});

function beforeUpload(file: File): boolean {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片');
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片不能超过 5MB');
    return false;
  }
  return true;
}

async function uploadPhoto(opt: { file: File }) {
  completeDialog.uploading = true;
  try {
    const fd = new FormData();
    fd.append('file', opt.file);
    // 直接 fetch — 简单点,Bearer token 从 localStorage 拿
    const token = localStorage.getItem('cloud-farm:access-token') || '';
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const body = await res.json();
    if (!res.ok || body.code !== 0) {
      throw new Error(body.message || `上传失败 (HTTP ${res.status})`);
    }
    completeDialog.photo = body.data.url;
    ElMessage.success(`已上传:${body.data.filename}`);
  } catch (e) {
    ElMessage.error(`上传失败:${(e as Error).message}`);
  } finally {
    completeDialog.uploading = false;
  }
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    list.value = await listAdminCommands({
      status: statusFilter.value || undefined,
      type: typeFilter.value || undefined,
      plotId: plotIdFilter.value || undefined,
    });
  } catch (e) {
    error.value = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e as Error).message;
  } finally {
    loading.value = false;
  }
}

function statusType(s: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'pending') return 'danger';
  if (s === 'executing') return 'warning';
  if (s === 'completed') return 'success';
  if (s === 'rejected') return 'info';
  return 'primary';
}

async function onAccept(row: Command) {
  busyId.value = row.id;
  try {
    const updated = await acceptCommand(row.id);
    Object.assign(row, updated);
    ElMessage.success(`已接单:${updated.id}`);
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e as Error).message;
    ElMessage.error(`接单失败:${msg}`);
  } finally {
    busyId.value = null;
  }
}

function openComplete(row: Command) {
  completeDialog.row = row;
  completeDialog.photo = '';
  completeDialog.note = '';
  completeDialog.open = true;
}

async function onComplete() {
  const row = completeDialog.row;
  if (!row) return;
  if (!completeDialog.photo) {
    ElMessage.warning('请填写回执照片 URL');
    return;
  }
  completeDialog.loading = true;
  try {
    const updated = await completeCommand(row.id, completeDialog.photo, completeDialog.note || undefined);
    Object.assign(row, updated);
    ElMessage.success(`工单 ${updated.id} 已完成,生长日记已同步推送给用户`);
    completeDialog.open = false;
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e as Error).message;
    ElMessage.error(`完成失败:${msg}`);
  } finally {
    completeDialog.loading = false;
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
