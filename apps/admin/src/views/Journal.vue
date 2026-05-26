<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="head">
          <strong>田园动态</strong>
          <el-space>
            <el-select v-model="typeFilter" placeholder="按类型" clearable style="width: 140px" @change="load">
              <el-option v-for="t in TYPES" :key="t.value" :value="t.value">
                {{ t.icon }} {{ t.label }}
              </el-option>
            </el-select>
            <el-input v-model="plotIdFilter" placeholder="按地块 ID" clearable style="width: 140px" @clear="load" @keyup.enter="load" />
            <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
            <el-button type="primary" :icon="Plus" @click="openCreate">发布动态</el-button>
          </el-space>
        </div>
      </template>

      <el-alert v-if="error" type="error" :title="`接口失败: ${error}`" :closable="false" show-icon />

      <el-skeleton v-else-if="loading" :rows="5" animated />

      <el-empty v-else-if="!list.length" description="还没有动态" :image-size="80">
        <el-button type="primary" @click="openCreate">发布第一条</el-button>
      </el-empty>

      <el-table v-else :data="list" stripe>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <span style="font-size: 18px; margin-right: 4px">{{ row.icon }}</span>
            <span>{{ typeLabel(row.type) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="320">
          <template #default="{ row }">
            <div style="font-weight: 500">{{ row.title }}</div>
            <div style="color: #888; font-size: 12px; margin-top: 2px">{{ row.summary }}</div>
            <div v-if="row.photos && row.photos.length" style="margin-top: 6px; display: flex; gap: 4px">
              <el-image
                v-for="(p, i) in row.photos.slice(0, 3)"
                :key="i"
                :src="p"
                fit="cover"
                style="width: 50px; height: 50px; border-radius: 4px"
                :preview-src-list="row.photos"
                preview-teleported
              />
              <span v-if="row.photos.length > 3" style="font-size: 11px; color: #999; align-self: center">
                +{{ row.photos.length - 3 }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="plotId" label="地块" width="100">
          <template #default="{ row }">
            <span v-if="row.plotId">{{ row.plotId }}</span>
            <el-tag v-else size="small" type="info">全场</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="by" label="发布者" width="120" />
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ fmtTime(row.at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" plain @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-text type="info" size="small" style="margin-top: 12px; display: block">
        共 {{ list.length }} 条 · 发布的动态用户立刻在 miniapp 看到;photos 通过 /api/upload 上传
      </el-text>
    </el-card>

    <!-- 发布对话框 -->
    <el-dialog v-model="dialogOpen" title="发布田园动态" width="600px" :close-on-click-modal="false">
      <el-form :model="form" label-width="80px">
        <el-form-item label="类型" required>
          <el-select v-model="form.type" style="width: 100%">
            <el-option v-for="t in TYPES" :key="t.value" :value="t.value" :label="`${t.icon} ${t.label}`" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="今天田里开了一片小番茄花 🌸" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="正文" required>
          <el-input v-model="form.body" type="textarea" :rows="4" maxlength="2000" show-word-limit placeholder="正文内容..." />
        </el-form-item>
        <el-form-item label="关联地块">
          <el-input v-model="form.plotId" placeholder="P-A-07,不填表示全场动态" />
        </el-form-item>
        <el-form-item label="配图">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="uploadPhoto"
            accept="image/*"
            multiple
          >
            <el-button :loading="uploading" plain>
              {{ uploading ? '上传中…' : '📤 选图(可多选)' }}
            </el-button>
          </el-upload>
          <div v-if="form.photos.length" style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap">
            <div v-for="(p, i) in form.photos" :key="i" style="position: relative">
              <el-image :src="p" fit="cover" style="width: 70px; height: 70px; border-radius: 6px" />
              <el-button size="small" type="danger" link style="margin-top: 2px" @click="form.photos.splice(i, 1)">删除</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onPublish">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Refresh, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listJournal,
  createJournalEntry,
  deleteJournalEntry,
  ApiError,
} from '@cloud-farm/api-client';
import type { JournalEntry } from '@cloud-farm/shared';
import { useUpload } from '@/composables/useUpload';

const TYPES = [
  { value: 'news',     icon: '📰', label: '通知' },
  { value: 'bloom',    icon: '🌸', label: '开花' },
  { value: 'water',    icon: '💧', label: '浇水' },
  { value: 'fertilize',icon: '🌱', label: '施肥' },
  { value: 'weed',     icon: '🌿', label: '除草' },
  { value: 'shoot',    icon: '📸', label: '抓拍' },
  { value: 'plant',    icon: '🌾', label: '播种' },
  { value: 'harvest',  icon: '🎉', label: '收获' },
  { value: 'pest',     icon: '🐛', label: '病虫' },
  { value: 'ship',     icon: '📦', label: '发货' },
];

const list = ref<JournalEntry[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const typeFilter = ref('');
const plotIdFilter = ref('');

const dialogOpen = ref(false);
const saving = ref(false);
const form = reactive({
  type: 'news',
  title: '',
  body: '',
  plotId: '',
  photos: [] as string[],
});

const { uploadOne: uploadPhoto, beforeUpload, uploading } = useUpload(
  (url) => { form.photos.push(url); }
);

function typeLabel(t: string) {
  return TYPES.find(x => x.value === t)?.label ?? t;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    list.value = await listJournal({
      type: typeFilter.value || undefined,
      plotId: plotIdFilter.value || undefined,
    });
  } catch (e) {
    error.value = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e as Error).message;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.type = 'news';
  form.title = '';
  form.body = '';
  form.plotId = '';
  form.photos = [];
  dialogOpen.value = true;
}

async function onPublish() {
  if (!form.title.trim()) return ElMessage.warning('请填标题');
  if (!form.body.trim()) return ElMessage.warning('请填正文');

  saving.value = true;
  try {
    const created = await createJournalEntry({
      type: form.type,
      title: form.title,
      body: form.body,
      photos: form.photos,
      plotId: form.plotId || undefined,
    });
    list.value.unshift(created);
    ElMessage.success(`已发布:${created.title}`);
    dialogOpen.value = false;
  } catch (e) {
    ElMessage.error(`发布失败:${e instanceof ApiError ? e.message : (e as Error).message}`);
  } finally {
    saving.value = false;
  }
}

async function onDelete(row: JournalEntry) {
  try {
    await ElMessageBox.confirm(
      `删除动态"${row.title}"?用户端会立即看不到。`,
      '删除动态',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    );
  } catch { return; }
  try {
    await deleteJournalEntry(row.id);
    list.value = list.value.filter(j => j.id !== row.id);
    ElMessage.success('已删除');
  } catch (e) {
    ElMessage.error(`删除失败:${e instanceof ApiError ? e.message : (e as Error).message}`);
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
